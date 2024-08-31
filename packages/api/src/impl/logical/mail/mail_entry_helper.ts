/* eslint-disable max-statements */
import cloneDeep from 'lodash/cloneDeep';
import { config as confFunc } from 'env_def';
import {
  ActionStore,
  mailBoxOfDefault,
  mailBoxOfOthers,
  mailBoxOfRdFlag,
  mailBoxOfSent,
  mailBoxOfTask, // 任务邮件
  mailBoxOfDefer, // 待办邮件
  mailComposeDataTable,
  methodMap,
  MethodMap,
  mailBoxOfDraft,
  mailBoxOfUnread,
  mailUnfinishedMailTable,
  mailBoxOfStar,
  SubActionsType,
} from './mail_action_store_model';
import {
  EntityMailBox,
  MailBoxModel,
  MailConfApi,
  MailContentModel,
  MailEntryModel,
  MailFileAttachModel,
  queryMailBoxParam,
  WriteMailInitModelParams,
  WriteLetterPropType,
  MailAttrConf,
  MailApi,
} from '@/api/logical/mail';
import { PraiseInfo, PraisePersonInfo } from '@/api/logical/mail_praise';
import { ModelHelper, NumberTypedMap, StringMap } from '@/api/commonModel';
import { api } from '@/api/api';
import { SystemApi } from '@/api/system/system';
import { DataStoreApi, StoredSequence, ISubAccountEmailOnlyInfo } from '@/api/data/store';
import { MailAbstractHandler } from './mail_abs_handler';
import { ElementOperation, HtmlApi, HtmlTransfer } from '@/api/data/html';
import { apis, URLKey } from '@/config';
import { DataTransApi, URLBuilderConf } from '@/api/data/http';
import { EventApi } from '@/api/data/event';
import { PushHandleApi } from '@/api/logical/push';
import { DbApiV2 } from '@/api/data/new_db';
// import { JSON } from '../../../../../../modified_third_party/tinymce';
import { resultObject } from '@/api/_base/api';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { FileApi, FileAttachModel } from '@/api/system/fileLoader';
import { util, traverseTreeBFS, folderId2TransMap, splitFolderStartContactId } from '@/api/util';
import corpMailUtils, { MailFuncToCorpMailUrlMap } from './corp_mail_utils';
import { AccountApi } from '@/api/logical/account';
import { host } from '@/urlConfig/url_common';
import { ContactApi, OrgApi } from '@/api/logical/contactAndOrg';
import { getIn18Text } from '@/api/utils';

/**
 * 处理MailEntryModel
 * 包括比较合并hash等操作
 * 包括存入localStorage 并从localStorage中加载
 * 包括Db的序列化和反序列化
 */
export class MailModelHandler implements ModelHelper<MailEntryModel> {
  // private static readonly mailSavedSeq = 'mailSavedSeq';
  static readonly mailPrefix: string = 'm_';

  static readonly mailInitModelPrefix: string = 'i_';

  private static MAIL_ENTRY_EXPIRED_SPAN: number = 1000 * 60 * 24 * 7;

  static seq: StoredSequence;

  actions: ActionStore;

  subActions?: SubActionsType;

  systemApi: SystemApi;

  accountApi: AccountApi;

  storeApi: DataStoreApi;

  htmlApi: HtmlApi;

  impl: DataTransApi;

  eventApi: EventApi;

  mailConfApi: MailConfApi;

  pushApi: PushHandleApi;

  dbApi: DbApiV2;

  loggerApi: DataTrackerApi;

  fileApi: FileApi;

  isCorpMail!: boolean;

  contactApi: ContactApi & OrgApi;

  mailApi: MailApi;

  constructor(actions: ActionStore, subActions?: SubActionsType) {
    // action改造
    this.actions = actions;
    this.subActions = subActions;
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.impl = api.getDataTransApi();
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as unknown as AccountApi;
    this.eventApi = api.getEventApi();
    this.loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as unknown as DataTrackerApi;
    this.pushApi = api.requireLogicalApi(apis.pushApiImpl) as PushHandleApi;
    this.htmlApi = api.requireLogicalApi(apis.htmlApi) as unknown as HtmlApi;
    this.mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
    this.dbApi = api.getNewDBApi();
    this.fileApi = api.getFileApi();
    this.contactApi = api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
    this.mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
  }

  static htmlApi = api.requireLogicalApi(apis.htmlApi) as unknown as HtmlApi;

  compare(origin: MailEntryModel, current: MailEntryModel): number {
    const originS = MailModelHandler.buildMailEntryModelString(origin);
    const currentS = MailModelHandler.buildMailEntryModelString(current);
    return originS.localeCompare(currentS);
  }

  // a db取值 b 传入值 用于整合两者
  merge(a: MailEntryModel, b: MailEntryModel): MailEntryModel {
    const { _account } = a;
    const user = this.systemApi.getCurrentUser(_account);
    if (!a) {
      return b;
    }
    if (!b) {
      return a;
    }
    if (b.receiver) {
      a.receiver = b.receiver;
    }
    // if (b.entry.attachment) a.entry.attachment = b.entry.attachment;
    // if (b.entry.title) { 可以故意将title设置为空 SIRIUS-4120
    //   a.entry.title = b.entry.title;
    // }
    a.entry.title = b.entry.title;
    if (b.entry.content && b.entry.content.content) {
      a.entry.content.content = b.entry.content.content;
    }
    if (b.aliasSender && b.aliasSender.id) {
      a.aliasSender = b.aliasSender;
    }
    if (b.entry.priority) {
      a.entry.priority = b.entry.priority;
    }
    if (b.entry.suspiciousSpam) {
      a.entry.suspiciousSpam = b.entry.suspiciousSpam;
    }
    a.scheduleDate = b.scheduleDate;
    a.scheduleDateTimeZone = b.scheduleDateTimeZone;
    // 加密邮件相关
    a.isEncryptedMail = b.isEncryptedMail;
    a.setEncrypt = b.setEncrypt;
    if (b.entry.encpwd) {
      a.entry.encpwd = b.entry.encpwd;
    }
    a.savePassword = b.savePassword;

    a.senderReceivers = b.senderReceivers;
    a.requestReadReceipt = b.requestReadReceipt;
    a.isOneRcpt = b.isOneRcpt;
    if (a.resend || b.resend) {
      a._id = undefined;
    }
    a.handleTime = b.handleTime;
    // 优先选择传入值的_account 否则 选择当前用户
    a._account = b._account || user?.id;
    b.draftVersionId && (a.draftVersionId = b.draftVersionId);
    return a;
  }

  hash(a: MailEntryModel): string {
    const str = MailModelHandler.buildMailEntryModelString(a);
    return this.systemApi.md5(str);
  }

  private static buildMailEntryModelString(a: MailEntryModel) {
    const doc: Document = this.htmlApi.parseHtml(a?.entry?.content?.content || '');
    const receiverStr = a.receiver ? a.receiver.map((it, idx) => String(idx) + '_' + it.mailMemberType + it.contactItem.contactItemVal).join('') : '';
    // const attachmentStr = a.entry.attachment
    //   ? a.entry.attachment.map(
    //     (it, idx) =>
    //       String(idx) +
    //       '_' +
    //       (it.id || ' ') +
    //       (it.fileName || ' ') +
    //       (it.deleted ? 'd' : ' ') +
    //       (it.ready ? 'r' : ' '),
    //   ).join('')
    //   : '';
    return (
      +receiverStr +
      (a.entry?.title || '') +
      (this.htmlApi.generateElStr(doc) || '') +
      // + (a.entry.brief || "")
      // attachmentStr +
      (a.entry?.folder || '0')
    );
  }

  unFreezeObject<T>(obj: T): T {
    try {
      return cloneDeep(obj);
    } catch (error) {
      return { ...obj };
    }
  }

  getEntryFromCacheCid(cid: string, _account?: string) {
    let targetAccount = '';
    // 传入_account优先， cid兜底
    if (_account) {
      targetAccount = _account || '';
    }
    const accountId = cid.split('&seq&')[0];
    if (accountId) {
      targetAccount = accountId;
    }
    const targetActions = this.mailApi.getActions({ actions: this.actions, subActions: this.subActions, _account: targetAccount }).val;
    if (targetActions?.mailEntryCache[cid]) {
      return this.unFreezeObject(targetActions?.mailEntryCache[cid]);
    }
    return undefined;
  }

  syncAndUpdateLocalContentInMemory(_content: MailEntryModel): MailEntryModel | undefined {
    if (_content && _content.cid) {
      let item = this.getEntryFromCacheCid(_content.cid, _content._account);
      if (item) {
        item = this.merge(item, _content);
        return item;
      }
    }
    return undefined;
  }

  async syncAndUpdateLocalContent(_content: MailEntryModel, noMerge?: boolean): Promise<MailEntryModel> {
    /** immer返回的对象被freeze了，需要先unfreeze */
    const content = this.unFreezeObject(_content);
    // 没有cid先生成一个
    if (!content.cid) {
      content.cid = MailModelHandler.seq.nextOne(_content?._account);
      await this.saveEntryToStore(content);
      return this.loadEntryFromStore(content.cid);
    }
    let item = this.getEntryFromCacheCid(content.cid);
    // 需要整合
    if (item && !noMerge) {
      item = this.merge(item, content);
    } else {
      item = this.unFreezeObject(content);
    }
    if (!item) {
      item = await this.loadEntryFromStore(content.cid);
    }
    await this.saveEntryToStore(item, content.cid);
    return item;
  }

  updateLocalContent(_content: MailEntryModel, noMerge?: boolean): MailEntryModel {
    const { _account } = _content;
    const content = this.unFreezeObject(_content);
    if (!content.cid) {
      content.cid = MailModelHandler.seq.nextOne(_account);
      this.saveEntryToStore(content).then();
      return content;
    }
    let item = this.getEntryFromCacheCid(content.cid, _account);
    if (item && !noMerge) {
      item = this.merge(item, content);
    } else {
      item = this.unFreezeObject(content);
    }
    this.saveEntryToStore(item, content.cid).then();
    return item;
  }

  private stringifyMailEntry(content: MailEntryModel): resultObject | undefined {
    if (!content) {
      return undefined;
    }
    // if (content.entry && content.entry.attachment && content.entry.attachment.length > 0) {
    //     let attachments = content.entry.attachment;
    //     for (let item of attachments) {
    //         console.log(item);
    //     }
    // }
    content.createTime = new Date().getTime();
    const s = JSON.stringify(content, (_, val) => {
      if (val instanceof File) {
        return undefined;
      }
      return val;
    });
    return JSON.parse(s) as resultObject;
  }

  clearEntryFromStore(cid: string, eid?: string, _account?: string): void {
    const targetAction = this.mailApi.getActions({ actions: this.actions, subActions: this.subActions, _account }).val;
    if (!targetAction) {
      // todo 子action不存在是否可以直接return wanglijun
    }
    delete targetAction?.mailEntryCache[cid];
    const mid = MailModelHandler.mailPrefix + cid;
    const mailIds = targetAction.writingMailIds;
    mailIds.delete(mid);
    // this.dbApi.deleteById(mailComposeDataTable, cid).then();
    // this.storeApi.del(mid).then();
    // this.storeApi.put(MailModelHandler.mailSavedSeq,
    //   JSON.stringify(Array.from(mailIds.keys()))).then();
    for (let i = 0; i < 3; ++i) {
      try {
        const lockName = MailAbstractHandler.COMMON_ATTACHMENT_LOCK_NAME + '-' + eid + '-' + i;
        const uploadLock = this.storeApi.getLock(lockName, 20 * 60 * 1000 + 10, true);
        if (uploadLock) {
          uploadLock.destroyLock();
        }
      } catch (e) {
        console.log('[mail] error unlock', e);
      }
    }
  }

  saveInitModelToStore(content: WriteMailInitModelParams) {
    if (content.id) {
      this.storeApi.put(MailModelHandler.mailInitModelPrefix + content.id, JSON.stringify(content)).then();
    }
  }

  loadInitModelToStore(mid: string): WriteMailInitModelParams | undefined {
    if (mid && !util.extractPathFromCid(mid)) {
      const sync = this.storeApi.getSync(MailModelHandler.mailInitModelPrefix + mid);
      return sync && sync.suc && sync.data ? (JSON.parse(sync.data) as WriteMailInitModelParams) : undefined;
    }
    return undefined;
  }

  async saveEntryToStoreNomerge(item: MailEntryModel, cid?: string): Promise<void> {
    if (!cid && !item.cid) {
      // cid = MailModelHandler.seq.next();
      cid = MailModelHandler.seq.nextOne(item?._account);
    } else if (!cid && item.cid) {
      cid = item.cid;
    }
    if (!item.cid) {
      item.cid = cid;
    }
    if (!cid) {
      return;
    }
    if (!item.id) {
      item.id = cid + '-tmp';
      item.entry && (item.entry.id = item.id);
    }
    // 区分写信action
    const targetActions = this.mailApi.getActions({ actions: this.actions, subActions: this.subActions, _account: item?._account }).val;
    if (targetActions?.mailEntryCache) {
      targetActions.mailEntryCache[cid] = item;
    }
    console.log('[mail] save to cache item saveEntryToStoreNomerge', item);
    const storeObj = this.stringifyMailEntry(item);
    if (storeObj) {
      const inElectron = this.systemApi.isElectron() && window.electronLib;
      if (inElectron) {
        // cid改造
        let _dbAccount = '';
        const fromEmail = cid.split('&seq&')[0];
        fromEmail && (_dbAccount = fromEmail);
        if (_dbAccount) {
          await this.dbApi.put({ ...mailComposeDataTable, _dbAccount }, storeObj).then();
        } else {
          await this.dbApi.put(mailComposeDataTable, storeObj).then();
        }
      } else {
        await this.dbApi.put(mailComposeDataTable, storeObj).then();
      }
      targetActions.writingMailIds && targetActions.writingMailIds.add(String(cid));
    }
  }

  async saveEntryToStore(item: MailEntryModel, cid?: string, attachment?: MailFileAttachModel[], _account?: string): Promise<void> {
    const targetAccount = _account || item?._account;
    if (!cid && !item.cid) {
      // cid = MailModelHandler.seq.next();
      cid = MailModelHandler.seq.nextOne(targetAccount);
    } else if (!cid && item.cid) {
      cid = item.cid;
    }
    if (!item.cid) {
      item.cid = cid;
    }
    if (!cid) {
      return;
    }
    if (!item.id) {
      item.id = cid + '-tmp';
      item.entry && (item.entry.id = item.id);
    }
    let data = this.getEntryFromCacheCid(cid, item._account);
    if (!data) {
      data = await this.loadEntryFromStore(cid, item._account);
    }
    // 新旧数据附件整合,以数据库内数据为准，操作附件的数据利用attachment参数传入
    if (data && data.entry && data.entry.attachment && attachment && attachment.length > 0) {
      item = this.mergeAttachment(item, data, attachment);
    }
    // 区分写信action
    const targetActions = this.mailApi.getActions({ actions: this.actions, subActions: this.subActions, _account: item?._account }).val;
    if (targetActions?.mailEntryCache) {
      targetActions.mailEntryCache[cid] = item;
    }
    console.log('[mail] save to cache item saveEntryToStore', item);
    // 过滤file对象

    const storeObj = this.stringifyMailEntry(item);
    if (storeObj) {
      const inElectron = this.systemApi.isElectron() && window.electronLib;
      if (inElectron) {
        // cid改造
        let _dbAccount = '';
        const fromEmail = cid.split('&seq&')[0];
        fromEmail && (_dbAccount = fromEmail);
        if (_dbAccount) {
          // composedata表
          await this.dbApi.put({ ...mailComposeDataTable, _dbAccount }, storeObj).then();
        } else {
          await this.dbApi.put(mailComposeDataTable, storeObj).then();
        }
      } else {
        await this.dbApi.put(mailComposeDataTable, storeObj).then();
      }
      // 正在写信的id
      targetActions.writingMailIds && targetActions.writingMailIds.add(String(cid));
    }
  }

  // 本地存草稿整合用
  async mergeStoreUnfinishedMail(_content: MailEntryModel, delExpiredDraft?: boolean): Promise<void> {
    const { _account } = _content;
    // 非主账号 不入
    if (_account && _account !== this.systemApi.getMainAccount1().email) return;
    /** immer返回的对象被freeze了，需要先unfreeze */
    const content = this.unFreezeObject(_content);
    let item = this.getEntryFromCacheCid(_content.cid as string);
    if (item) {
      // API层数据整合
      item = this.merge(item, content);
      await this.saveEntryToUnfinishedMail(item, delExpiredDraft === true);
    }
  }

  // 存入未完成表
  async saveEntryToUnfinishedMail(item: MailEntryModel, delExpiredDraft?: boolean): Promise<void> {
    const { _account } = item;
    // 非主账号 不入
    if (_account && _account !== this.systemApi.getMainAccount1().email) return;
    // 更新cache ???
    // 过滤file对象
    const storeObj = this.stringifyMailEntry(item);
    if (storeObj) {
      const inElectron = this.systemApi.isElectron() && window.electronLib;
      if (inElectron) {
        await this.dbApi.put(mailUnfinishedMailTable, storeObj);
      } else {
        await this.dbApi.put(mailUnfinishedMailTable, storeObj);
      }
      // 删除过期
      if (delExpiredDraft) {
        await this.delExpiredDraftVersion(item.cid as string);
      }
    }
  }

  // 覆盖draftId
  async coverDraft(cid: string, draftId: string) {
    // 此cid所有版本
    const curCidDrafts = await this.dbApi.getByEqCondition({
      dbName: 'mail_new',
      tableName: 'unfinished_mail',
      query: { cid },
    });
    // 删除旧版本
    await this.dbApi.deleteById(
      {
        dbName: 'mail_new',
        tableName: 'unfinished_mail',
      },
      curCidDrafts.map(item => item.draftVersionId)
    );
    // 覆盖新版
    await this.dbApi.putAll(
      mailUnfinishedMailTable,
      curCidDrafts.map(item => ({ ...item, draftId }))
    );
  }

  // 删除过期草稿
  async delExpiredDraftVersion(cid: string) {
    // 所有版本 按创建时间排序
    const curCidDrafts = await this.dbApi.getByEqCondition({
      dbName: 'mail_new',
      tableName: 'unfinished_mail',
      query: { cid },
    });
    // 按照创建时间倒序
    const orderedCidDrafts = util.setDataOrder({
      data: curCidDrafts,
      orderBy: [['createTime', false]],
    });
    // 删除过期版本
    if (orderedCidDrafts?.length > 3) {
      const delIds = orderedCidDrafts.splice(3).map(item => item.draftVersionId);
      if (delIds.length > 0) {
        await this.dbApi.deleteById(
          {
            dbName: 'mail_new',
            tableName: 'unfinished_mail',
          },
          delIds
        );
      }
    }
  }

  // 已废弃...
  async saveEntryToStore1(item: MailEntryModel, cid?: string): Promise<boolean> {
    if (!cid && !item.cid) {
      // cid = MailModelHandler.seq.next();
      cid = MailModelHandler.seq.nextOne(item?._account);
    } else if (!cid && item.cid) {
      cid = item.cid;
    }
    if (!item.cid) {
      item.cid = cid;
    }
    if (!cid) {
      return false;
    }
    if (!item.id) {
      item.id = cid + '-tmp';
      item.entry && (item.entry.id = item.id);
    }
    await new Promise(resolve => {
      if (!item.entry.attachment || item.entry.attachment.length === 0) {
        resolve('');
      }
      item.entry.attachment?.forEach(async (attachItem, index) => {
        const { attachPath } = attachItem;
        if (attachPath) {
          const localfile = await window.electronLib.fsManage.readFile(attachPath);
          const sep = window.electronLib.env.isMac ? '/' : '\\';
          const file = new File([localfile], attachPath.split(sep).pop() as string);
          attachItem.file = file;
        }
        if (item.entry.attachment?.length === index + 1) {
          resolve('');
        }
      });
    });
    // 区分写信action
    const targetAction = this.mailApi.getActions({ actions: this.actions, subActions: this.subActions, _account: item?._account }).val;
    if (targetAction?.mailEntryCache) {
      targetAction.mailEntryCache[cid] = item;
    }
    console.log('[mail] save to cache item saveEntryToStore1', item);
    const storeObj = this.stringifyMailEntry(item);
    if (storeObj) {
      await this.dbApi.put(mailComposeDataTable, storeObj).then();
      this.actions.writingMailIds.add(String(cid));
    }
    return true;
    // this.storeApi.put(key, this.stringifyMailEntry(item)).then();
    // this.storeApi.put(MailModelHandler.mailSavedSeq,
    //   JSON.stringify(Array.from(mailIds.keys()))).then();
  }

  // item 传入 data db已存在 attachment 要操作的附件
  private mergeAttachment(item: MailEntryModel, data: MailEntryModel, attachment: MailFileAttachModel[]) {
    if (!data || !data.entry?.attachment) {
      return item;
    }
    // item.entry.attachment = item.entry.attachment || [];
    const savedData = data.entry.attachment.filter(it => !!it.realId);
    // const newData = item.entry.attachment.filter(it => !!it.realId);
    const savedDataMap = new Map<number, MailFileAttachModel>();
    // debugger;
    savedData.forEach(it => {
      savedDataMap.set(it.realId || it.id, it);
    });
    attachment.forEach(att => {
      const key = att.realId || att.id;
      // 新增 或 未删除改为已删除 （删除只允许单向覆盖）
      const saved = savedDataMap.get(key);
      if (!saved || !saved?.deleted) {
        savedDataMap.set(key, att);
      }
      // if (!savedDataMap.has(key)) {
      //   savedData.push(att);
      // } else {
      //   savedDataMap.delete(key);
      //
      //   // const currentItem = newDataMap.get(att.id);
      // }
    });

    this.loggerApi.track('mail_merge_attahment', { savedData, attachment });
    item.entry.attachment = [...savedDataMap.values()];
    // debugger;
    return item;
    // item.entry.attachment.push(...savedData);
  }

  // 循环获取邮件内容
  private async electronloadEntryFromStore(cid: string, _account?: string): Promise<MailEntryModel> {
    let _dbAccount = '';
    // 先尝试cache
    let element = this.getEntryFromCacheCid(cid, _account);
    // 再尝试DB
    if (!element) {
      let dbRes = null;
      // cid改造
      const fromEmail = cid.split('&seq&')[0];
      fromEmail && (_dbAccount = fromEmail);
      if (_dbAccount) {
        dbRes = await this.dbApi.getById({ ...mailComposeDataTable, _dbAccount }, cid, _dbAccount);
      } else {
        dbRes = await this.dbApi.getById({ ...mailComposeDataTable }, cid, _dbAccount);
      }
      element = dbRes as MailEntryModel;
    }
    return { ...element, _account: element?._account || _dbAccount };
  }

  async loadEntryFromStore(cid: string, _account?: string): Promise<MailEntryModel> {
    let targetAccount = '';
    // 传入_account优先， cid兜底
    // （_account透传缺口大，但cid逻辑上也可以）
    if (_account) {
      targetAccount = _account || '';
    } else {
      const accountId = cid.split('&seq&')[0];
      if (accountId) {
        targetAccount = accountId;
      }
    }
    let element = this.getEntryFromCacheCid(cid, targetAccount);
    if (!element) {
      const inElectron = this.systemApi.isElectron() && window.electronLib;
      if (inElectron) {
        element = await this.electronloadEntryFromStore(cid, targetAccount);
        // return element;
      } else {
        const dbRes = await this.dbApi.getById({ ...mailComposeDataTable }, cid, targetAccount);
        element = dbRes as MailEntryModel;
      }
    }
    return element;
  }

  async loadEntryFromStore1(cid: string, _account?: string): Promise<MailEntryModel> {
    let element = this.getEntryFromCacheCid(cid, _account);
    if (!element) {
      const re = await this.dbApi.getById(mailComposeDataTable, cid, _account);
      element = re as MailEntryModel;
      // const storeData = this.storeApi.getSync(MailModelHandler.mailPrefix + cid);
      // if (storeData && storeData.suc && storeData.data) {
      //   return JSON.parse(storeData.data) as MailEntryModel;
      // }
    }
    element.entry.attachment?.forEach((attachment: any) => {
      // 将原文件删除
      attachment?.file && delete attachment.file;
    });
    return element;
  }

  async initEntryFromStore(): Promise<void> {
    const resultObjects = await this.dbApi.getByEqCondition(mailComposeDataTable);
    const now = new Date().getTime();
    const delIds: string[] = [];
    resultObjects.forEach(it => {
      if (it) {
        const entry = it as MailEntryModel;
        //
        const targetActions = this.mailApi.getActions({
          actions: this.actions,
          subActions: this.subActions,
          _account: entry._account,
        })?.val;
        if (entry.cid && entry.createTime && entry.createTime + MailModelHandler.MAIL_ENTRY_EXPIRED_SPAN > now) {
          targetActions.mailEntryCache[entry.cid] = entry;
          console.log('[mail] save to cache item initEntryFromStore', entry);
          targetActions.writingMailIds.add(String(entry.cid));
        } else if (entry.cid) {
          // 本地打开的 eml 邮件解析后，也会插入到这个表中，这里不应该删除这个记录
          const isEmlRecord = util.extractPathFromCid(entry.cid as unknown);
          if (!isEmlRecord) {
            delIds.push(entry.cid);
          }
        }
      }
    });
    if (delIds.length > 0) {
      this.dbApi.deleteById(mailComposeDataTable, delIds).then();
    }
  }

  checkAllFailToSendMails(req: queryMailBoxParam, ret?: MailEntryModel[], search?: string): number {
    if (req.ids || req.id !== mailBoxOfSent.id || req.index !== 0) {
      return 0;
    }
    try {
      const targetActions = this.mailApi.getActions({
        actions: this.actions,
        subActions: this.subActions,
        _account: req._account,
      })?.val;
      const { mailEntryCache } = targetActions;
      let num = 0;
      Object.keys(mailEntryCache).forEach(i => {
        const key = Number(i);
        if (
          Object.prototype.hasOwnProperty.apply(mailEntryCache, [key]) &&
          mailEntryCache[key] &&
          mailEntryCache[key].entry &&
          mailEntryCache[key].entry.sendStatus &&
          mailEntryCache[key].cid &&
          mailEntryCache[key].id
        ) {
          if (ret) {
            const element = this.getEntryFromCacheCid(mailEntryCache[key].cid as string);
            if (element) {
              if (!search) {
                ret.push(element);
              } else if (targetActions.searchContentOfEntry(element, search)) {
                ret.push(element);
              }
            }
          }
          num += 1;
        }
      });
      return num;
    } catch (ex) {
      console.warn('[mail] get local mail failed ', ex);
      return 0;
    }
  }

  async insertStarContactIntoMailbox(mailBox: MailBoxModel[], starList?: MailBoxModel[]): Promise<MailBoxModel[]> {
    if (Array.isArray(starList) && starList.length > 0) {
      mailBox.forEach(v => {
        if (v.mailBoxId === mailBoxOfStar.id) {
          v.children = starList;
          v.childrenCount = starList.length;
          const unread = starList.reduce((t, v) => {
            t += v.entry.mailBoxUnread;
            return t;
          }, 0);
          v.entry.mailBoxUnread = unread;
          v.entry.mailBoxCurrentUnread = unread;
          v.entry.threadMailBoxUnread = unread;
          v.entry.threadMailBoxCurrentUnread = unread;
        }
      });
    }
    console.log('[start list] mailBox', mailBox);
    return mailBox;
  }

  isValidStarFolderId(fid?: number | string) {
    if (!fid) {
      return false;
    }
    const [type, id] = splitFolderStartContactId(fid);
    return type && id && ['personal', 'org'].includes(type);
  }

  async doGetStarContactQuery(folderId?: number | string, _account?: string): Promise<Omit<MailAttrConf, 'attrType'>> {
    const fid = String(folderId);
    if (!this.isValidStarFolderId(fid)) {
      return {
        id: '',
        emailList: [],
        attrValue: '',
      };
    }
    const [type, id] = splitFolderStartContactId(fid);
    const promise = type === 'personal' ? () => this.contactApi.doGetContactById(id, _account) : () => this.contactApi.doGetContactByOrgId({ orgId: id, _account });
    const contactModels = await promise();
    const emailList = contactModels.reduce((total, current) => {
      total.push(...(this.contactApi.transContactModel2ContactItem(current)?.emailList || []));
      return total;
    }, [] as string[]);
    const attrValue = this.getStarAttrValue(id, emailList);
    console.log('doGetStarContactQuery', emailList, attrValue);
    return {
      id,
      emailList,
      attrValue,
    };
  }

  // 根据联系人ID或者联系人组ID，以及包含的 email 构造 attr 表的查询主键
  getStarAttrValue(id: string, emailList: string[]) {
    return this.systemApi.md5(`${id}${emailList.join('')}`, true);
  }

  async handleCommonFolderRet(_dt: EntityMailBox[], starListModels?: MailBoxModel[], _account?: string): Promise<MailBoxModel[]> {
    let dt: EntityMailBox[];
    const actions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    // 过滤掉系统文件夹，且在本地没有初始化配置的文件夹
    try {
      // eslint-disable-next-line max-len
      dt = _dt.filter(
        v => v.mailBoxType === 'customer' || (v.mailBoxType === 'sys' && v.mailBoxId && actions && actions.mailBoxConfs && actions.mailBoxConfs[Number(v.mailBoxId)])
      );
    } catch (error) {
      dt = _dt;
    }
    const ret: MailBoxModel[] = [];
    const trans: NumberTypedMap<MailBoxModel> = {};
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    // 红旗邮件 任务邮件 稍后处理 未读邮件 星标联系人
    const baseExtraMailBoxes = isCorpMail ? [mailBoxOfRdFlag] : [mailBoxOfRdFlag, mailBoxOfUnread, mailBoxOfTask, mailBoxOfDefer, mailBoxOfStar];
    const systemMailBoxes = dt.filter(v => v.mailBoxType === 'sys').map(b => b.mailBoxId);
    const currentUser = this.systemApi.getCurrentUser(_account);
    baseExtraMailBoxes.forEach(it => {
      if (!systemMailBoxes.includes(it.id) && actions) {
        const { mailBoxDic } = actions;
        const currentBox = it.id === mailBoxOfDefer.id && mailBoxDic && mailBoxDic[it.id] ? mailBoxDic[it.id] : null;
        const mailBox: MailBoxModel = {
          childrenCount: 0,
          _account: currentUser?.id,
          authAccountType: currentUser?.prop?.authAccountType as string, // currentUser?.prop?.authAccountType,
          entry: {
            deferCount: currentBox?.deferCount || 0,
            mailBoxName: it.name || '',
            mailBoxCurrentUnread: currentBox?.mailBoxCurrentUnread || 0,
            mailBoxUnread: currentBox?.mailBoxUnread || 0,
            mailBoxTotal: currentBox?.mailBoxTotal || 0,
            mailBoxType: 'sys',
            mailBoxId: it.id,
            mailBoxParent: 0,
            threadMailBoxTotal: currentBox?.threadMailBoxTotal || 0,
            threadMailBoxUnread: currentBox?.threadMailBoxUnread || 0,
            threadMailBoxCurrentUnread: currentBox?.threadMailBoxCurrentUnread || 0,
            id: actions.mailBoxConfs[it.id].id + '',
            sort: actions.mailBoxConfs[it.id].sort,
          },
          mailBoxId: it.id,
          children: [],
        };
        ret.push(mailBox);
        trans[it.id] = mailBox;
      }
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const entry of dt) {
      const id = Number(entry.mailBoxId);
      trans[id] = {
        childrenCount: 0,
        _account: currentUser?.id,
        authAccountType: currentUser?.prop?.authAccountType as string, //  currentUser?.prop?.authAccountType,
        entry,
        children: [],
      };
    }
    const children: NumberTypedMap<MailBoxModel[]> = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const item of dt) {
      const id = item.mailBoxId;
      const pid = item.pid || 0;
      const model = trans[+id];
      model.mailBoxId = id;
      const mailBoxConf = actions.mailBoxConfs[+id];
      if (mailBoxConf?.hide) {
        // eslint-disable-next-line no-continue
        continue;
      }
      model.entry.mailBoxName = mailBoxConf?.name || model.entry.mailBoxName;
      if (model.entry.mailBoxType === 'sys') {
        if (mailBoxConf?.getUnreadNumber) {
          const unreadNumber = mailBoxConf.getUnreadNumber(model);
          model.entry.mailBoxUnread = unreadNumber.unread;
          model.entry.mailBoxCurrentUnread = unreadNumber.currentUnread;
          model.entry.threadMailBoxUnread = unreadNumber.threadUnread;
          model.entry.threadMailBoxCurrentUnread = unreadNumber.currentThreadUnread;
        }
        if (model.entry.mailBoxId === mailBoxOfDraft.id) {
          model.entry.threadMailBoxTotal = model.entry.mailBoxTotal;
        }
        if (model.entry.mailBoxId === 1) {
          ret.unshift(model);
        } else {
          ret.push(model);
        }
      } else if (model.entry.mailBoxType === 'customer') {
        // pid = pid === 0 ? mailBoxOfOthers.id : pid;
        // mailBoxConf?.fold === 1 && pid === 0
        if (pid === 0) {
          ret.push(model);
        } else {
          const parent = trans[pid];
          if (parent) {
            parent.children!.push(model);
            parent.childrenCount += 1;
            this.handleParentCount(trans, parent, model.entry.mailBoxCurrentUnread, model.entry.threadMailBoxCurrentUnread);
            // parent.entry.mailBoxUnread += model.entry.mailBoxCurrentUnread || 0;
          } else {
            let list = children[pid];
            if (!list) {
              list = [];
            }
            list.push(model);
            children[pid] = list;
          }
        }
      }
      // else {
      // }
    }
    Object.keys(children).forEach(i => {
      if (Object.prototype.hasOwnProperty.apply(children, [i]) && children[Number(i)]) {
        children[Number(i)].forEach(it => {
          const parent = trans[Number(i)];
          if (parent) {
            parent.children!.push(it);
            parent.childrenCount += 1;
            this.handleParentCount(trans, parent, it.entry.mailBoxCurrentUnread, it.entry.threadMailBoxCurrentUnread);
          }
          // parent.entry.mailBoxUnread += it.entry.mailBoxCurrentUnread || 0;
        });
      }
    });
    // 计算未读文件夹的未读数，即将除了草稿箱 和 稍后处理 的其他邮箱未读数求和
    let urFolderUnRead = 0;
    let threadUrFolderUnRead = 0;
    const ignoreFolderId = [2, -4, -3, mailBoxOfStar.id];
    ret.forEach(model => {
      if (model && model.mailBoxId && !ignoreFolderId.includes(+model.mailBoxId)) {
        urFolderUnRead += model.entry.mailBoxUnread;
        threadUrFolderUnRead += model.entry.threadMailBoxUnread;
      }
    });
    ret.forEach(model => {
      if (model && model.mailBoxId && model.mailBoxId === -4) {
        model.entry.mailBoxUnread = urFolderUnRead;
        model.entry.mailBoxCurrentUnread = urFolderUnRead;
        model.entry.threadMailBoxUnread = threadUrFolderUnRead;
        model.entry.threadMailBoxCurrentUnread = threadUrFolderUnRead;
      }
    });
    const result = ret.sort((prev, next) => prev.entry.sort - next.entry.sort);
    // 插入星标联系人的子项
    const resultWithStarContacts = await this.insertStarContactIntoMailbox(result, starListModels);
    /**
     * 对tree进行遍历，写入深度信息
     * 限制最大遍历次数为10w
     * 同时对系统文件夹进行翻译
     */
    traverseTreeBFS(
      resultWithStarContacts,
      (node, deep) => {
        if (node && node?.entry) {
          node.entry._deep = deep;
          if (node.entry.mailBoxId != null && folderId2TransMap[node.entry.mailBoxId as keyof typeof folderId2TransMap]) {
            const folderTransName = folderId2TransMap[node.entry.mailBoxId as keyof typeof folderId2TransMap];
            node.entry.mailBoxName = getIn18Text(folderTransName) || node.entry.mailBoxName;
          }
        }
      },
      100000
    );
    console.log('[star list]', resultWithStarContacts);
    return resultWithStarContacts;
  }

  handleParentCount(trans: NumberTypedMap<MailBoxModel>, parent: MailBoxModel, mailBoxCurrentUnread: number, threadMailBoxCurrentUnread: number) {
    let c = true;
    do {
      if (Array.isArray(parent.children) && parent.children.length > 1) {
        parent.children.sort((prev, next) => prev.entry.sort - next.entry.sort);
      }
      parent.entry.mailBoxUnread += mailBoxCurrentUnread;
      parent.entry.threadMailBoxUnread += threadMailBoxCurrentUnread;
      const { pid } = parent.entry;
      const parentId = pid === 0 ? mailBoxOfOthers.id : pid;
      if (parentId) {
        parent = trans[parentId];
        c = !!parent;
      } else {
        c = false;
      }
    } while (c);
  }

  public init() {
    MailModelHandler.seq = this.storeApi.getSeqHelper('mail-content');
  }

  buildInitContent(param: WriteMailInitModelParams) {
    let con = '';
    if (param.originContent && param.originContent.length > 0) {
      if (param.originContent.indexOf('\n') < 0) {
        con = '<p>' + param.originContent + '</p><p></p>';
      } else {
        const strings = param.originContent.split('\n');
        strings.forEach(it => {
          con += '<p>' + it + '</p>';
        });
      }
      // mailContentModel.entry.content.userInputContent = param.originContent;  写信弹窗后model清空
    }
    return con;
  }

  buildTpMailUrl(url: URLKey, additionalParam?: StringMap) {
    const currentUser = this.systemApi.getCurrentUser();
    if (!currentUser) {
      return MailAbstractHandler.comNotExist;
    }
    let req: StringMap = {
      sid: currentUser.sessionId,
    };
    if (additionalParam?.sid === '') {
      delete additionalParam?.sid;
      delete additionalParam?.session;
    }
    if (additionalParam) {
      req = Object.assign(req, additionalParam);
    }
    const conf = {
      noAddingHost: false,
    } as URLBuilderConf;
    return this.impl.buildUrl(this.systemApi.getUrl(url), req, conf);
  }

  // 邮件相关请求构建url都会经过这里
  // eslint-disable-next-line max-params
  buildUrl(payloads: { key: keyof MethodMap; additionalParam?: StringMap; urlPath?: URLKey; noSid?: boolean; _account?: string }) {
    const { key, additionalParam, urlPath, noSid, _account } = payloads;
    // 是否拆分请求 （带_session即为主窗口替子窗口发信）
    const splitReq = false;
    // if (!MailAbstractHandler.sid) {
    const currentUser = this.systemApi.getCurrentUser(_account);
    if (!currentUser) {
      return MailAbstractHandler.comNotExist;
    }
    const isCorpMailMode = this.systemApi.getIsCorpMailMode();
    // 用户是否是corpMailMode
    if (isCorpMailMode) {
      return corpMailUtils.buildUrlForCorpMail(key as keyof MailFuncToCorpMailUrlMap, additionalParam);
    }

    let req: StringMap = {
      func: methodMap[key],
      sid: currentUser.sessionId,
    };
    if (noSid) {
      delete req.sid;
    }
    if (additionalParam?.sid === '') {
      delete additionalParam?.sid;
      delete additionalParam?.session;
    }

    console.log('[mail] build api for ' + req.func + '->' + req.sid, currentUser);
    // if (key != 'getMailPart' && key != 'downloadTmpAttachment') {
    //   req.p = 'sirius';
    // }
    if (additionalParam) {
      req = Object.assign(req, additionalParam);
    }
    const conf = {
      noAddingHost: key === 'downloadTmpAttachment',
    } as URLBuilderConf;
    const generateUrl = this.impl.buildUrl(this.systemApi.getUrl(urlPath || 'mailOperation', '', splitReq, _account), req, conf);
    return generateUrl;
  }

  // eslint-disable-next-line class-methods-use-this
  private handleReadOnlyMailImageTag(item: HTMLImageElement): ElementOperation {
    const originSrc = item.getAttribute('src');
    if (originSrc && originSrc.length > 2) {
      const host = originSrc.startsWith('http') || originSrc.startsWith('data:') || !this.systemApi.isElectron() ? '' : confFunc('host');
      item.setAttribute('src', host + originSrc);
      return {
        op: 'none',
      };
    }
    return {
      op: 'remove',
    };
  }

  private handleImageTag(item: HTMLImageElement, config: Map<string, any> | undefined): ElementOperation {
    // 回复生成进 读信进 发信进
    const readMail: boolean = config ? config.get('readMail') === 'true' : false;
    const isTpMail = config && !!config.get('isTpMail');
    const _account = config && config.get('_account');
    const subAccount = this.storeApi.getSubAccountList() || [];
    const isSubAccount = subAccount.some((it: ISubAccountEmailOnlyInfo) => it.email === _account);
    // 将图片替换为本地协议的预处理
    const imageConf = readMail && config ? config.get('imageConf') : null;
    const FALLBACK_SRC_KEY = 'data-origin-src';
    let needHandleSiriusImage = this.systemApi.isElectron() && readMail && imageConf;

    // 修复27已经加了 'wirte-origin-src'的老邮件 需要删了
    // 'wirte-origin-src' 发信时不能带，但是现在线上带了，导致转发图片图裂，这个是处理老邮件的逻辑
    const originSrc = item.getAttribute('src');
    const oldOriginSrc = item.getAttribute('wirte-origin-src');
    if (oldOriginSrc && originSrc) {
      const pattern = /composeId=(\w+)/;
      const oldMatch = oldOriginSrc.match(pattern);
      const newMatch = originSrc.match(pattern);
      const oldComposeId = oldMatch && oldMatch[1];
      const newComposeId = newMatch && newMatch[1];
      if (oldComposeId !== newComposeId) {
        item.removeAttribute('wirte-origin-src');
      }
    }

    // 写信子账号上传的图片链接也需要加上 commonweb/proxy, 但是发信的时候不能带上，服务端只认他给的URL
    // 所以此处保存一个wirte-origin-src 在发信的时候替换回去； 解决回复内容被修改
    // 同一封邮件回复生成和发信的时候都会进来，只在第一次的时候加
    if (item.getAttribute('wirte-origin-src') === null) item.setAttribute('wirte-origin-src', originSrc || '');
    const originFallbackSrc = item.getAttribute(FALLBACK_SRC_KEY);
    const isSiriusImage = originSrc && originSrc.startsWith('sirius');

    let imageConfKey = '';

    if (originSrc && originSrc.length > 2) {
      let originUrl = needHandleSiriusImage && isSiriusImage ? originFallbackSrc : originSrc;
      if (originUrl && originUrl.length > 2) {
        let url = originUrl;
        url = this.htmlApi.decodeHtml(url);
        const isDecryptedMailImage = url.includes('decryptMessagePart');
        // 加密邮件的图片不进行sirius链接替换
        if (isDecryptedMailImage) {
          needHandleSiriusImage = false;
        }
        const queryMap = this.htmlApi.parseUrlQuery(url);

        // 根据 mid + part 去 imageConf 中找 filePath
        if (queryMap.mid && queryMap.Part) {
          imageConfKey = `${queryMap.mid}-${queryMap.Part}`;
        }

        // 如果是打开埋点
        if (url.includes('/api/pub/edm/read')) {
          const regExp = '/api/pub/edm/read(.)+';
          const match = url.match(regExp);
          console.log(url, host);
          if (match && match[0]) {
            item.setAttribute('src', decodeURIComponent(host + '/trace') + match[0]);
            return {
              op: 'none',
            };
          }
        }

        let func;
        if (isDecryptedMailImage) {
          func = 'getDecryptedMailPart';
        } else if (isTpMail && url.includes('getMessageData')) {
          func = 'getTpMailPart';
        } else if (url.indexOf('mbox:getMessageData') >= 0 || url.indexOf('mbox%3AgetMessageData') >= 0) {
          // 读信图片
          func = 'getMailPart';
        } else if (url.indexOf('mbox:getComposeData') >= 0 || url.indexOf('mbox%3AgetComposeData') >= 0) {
          // 回复的图片
          func = 'downloadTmpAttachment';
        } else if (url.includes('/coremail') && (url.includes('func=user:proxyGet') || url.includes('user%3AproxyGet'))) {
          // coreMail的代理获取的 转为直接获取的模式
          item.setAttribute('src', decodeURIComponent(queryMap.url || ''));
        } else if (url.includes('/corp-mail')) {
          if (url.includes('mail/message/data')) {
            // 需要替换到新的sid
            func = 'getMailPart';
            if (queryMap.mid) {
              queryMap.mid = decodeURIComponent(queryMap.mid);
            }
          }
        }

        if (func) {
          delete queryMap.func;
          delete queryMap.sid;
          delete queryMap.p;
          // const _session = this.systemApi.getCurrentSessionName() || '';
          // queryMap._session = _session;
          if (isSubAccount) {
            if (!process.env.BUILD_ISELECTRON) {
              queryMap._token = this.mailConfApi.accountTokens.find(token => token.account === _account)?.token || '';
            } else {
              queryMap._session = this.systemApi.getSessionNameOfSubAccount(_account);
            }
          } else {
            const curNode = this.systemApi.getCurrentNode();
            queryMap._ms = curNode || 'hz';
          }

          let replaceValue = '';
          if (func === 'getTpMailPart') {
            replaceValue = this.buildTpMailUrl('getTpMailPart', queryMap);
          } else if (isSubAccount && !process.env.BUILD_ISELECTRON) {
            // 内容图片查看
            replaceValue = this.buildUrl({ key: func as keyof MethodMap, urlPath: 'mailProxyOperation', additionalParam: queryMap, _account });
          } else {
            replaceValue = this.buildUrl({ key: func as keyof MethodMap, additionalParam: queryMap, _account });
          }
          //  else if (_session) {
          //   const decodeRes = this.systemApi.decodeSessionName(_session);
          //   if (decodeRes && decodeRes.mainEmail !== decodeRes.subEmail) {
          //     const subEmailNode = this.accountApi.getNodeInfoByEmail(decodeRes.subEmail) || 'hz';
          //     replaceValue = getUrlFinal(this.buildUrl({ key: func as keyof MethodMap, additionalParam: queryMap, _account }), subEmailNode);
          //   } else {
          //     const curNode = this.systemApi.getCurrentNode();
          //     replaceValue = getUrlFinal(this.buildUrl({ key: func as keyof MethodMap, additionalParam: queryMap, _account }), curNode);
          //   }
          // }

          if (!(config && config.get('host'))) {
            item.setAttribute('src', replaceValue);
          }
          if (!readMail) {
            // 写信发送
            const wirteOriginSrc = item.getAttribute('wirte-origin-src');
            if (wirteOriginSrc) {
              item.removeAttribute('wirte-origin-src');
              originUrl = wirteOriginSrc;
            }
            const newSrc = (originUrl as string).replace(/^.*(js6\/s.+$)/gi, (_, p1) => decodeURIComponent('/' + p1));
            console.log('[mail] src test ', newSrc);
            item.setAttribute('src', newSrc);
            if (queryMap && queryMap.composeId && queryMap.attachId && config) {
              config.set('img-' + queryMap.attachId, newSrc);
            }
          }
          // if (config && config.host && config.host.length > 7) {
          // replaceValue = replaceValue.replace(/https?:\/\/([a-z0-9_\-.]{0,256})(:[0-9]{2,5})?/i, config.host);
          // item.removeAttribute('src');
          // item.setAttribute('src', replaceValue);
          // } else {
          //   item.setAttribute('src', replaceValue);
          // }
          // item.setAttribute('send-src', originUrl!);
          console.log('[mail] handle image result，src ,value=', item.outerHTML, replaceValue, readMail);
        }
        // if (picURLInMailPattern.test(url)) {
        //   const func='getMailPart';
        //   const replaceValue = this.buildUrl(func as keyof MethodMap);
        //   item.setAttribute('src',replaceValue);
        // }else if(picURLInMailPattern){
        // }
        // this.host + '/js6/s?func=' + func + '&sid=' + currentUser.sessionId;
        // con.content = con.content.replace(searchValue, replaceValue);

        // 将邮件内联图片替换为本地缓存图片
        if (needHandleSiriusImage) {
          const handledSrc = item.getAttribute('src');
          const currentConf = imageConf && imageConf.get(imageConfKey);
          if (currentConf) {
            item.setAttribute('src', `sirius://sirius.file/${encodeURIComponent(currentConf.filePath)}`);
            item.setAttribute(FALLBACK_SRC_KEY, handledSrc || '');
            item.setAttribute('fid', currentConf.fid);
            // if (!item.getAttribute('onerror') || item.getAttribute('onerror') === 'void(0);') {
            //   item.setAttribute(
            //     'onerror',
            //     `this.setAttribute('src',this.getAttribute("${FALLBACK_SRC_KEY}"));this.removeAttribute('onerror');`
            //   );
            // }
          }
        }
      }
      return {
        op: 'none',
      };
    }
    return {
      op: 'remove',
    };
  }

  private handleSignatureTag(item: Element, config: Map<string, any> | undefined): ElementOperation {
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    if (isCorpMail) {
      corpMailUtils.handleCorpSignatureEl(item);
    }
    const readMail: boolean = config ? config.get('readMail') === 'true' : false;
    let itemHtmlStr = item.outerHTML;
    let replaceEle = null as any;
    if (readMail && item.tagName.toLowerCase() === 'a') {
      // 读信：将a标签改为div标签
      itemHtmlStr = itemHtmlStr.replace(/^\<a/, '<div').replace(/a\>$/, 'div>');
      replaceEle = this.htmlApi.parseHtml(itemHtmlStr).body.childNodes[0];
      replaceEle.setAttribute('data-tagchange', '1');
    } else if (!readMail && item.hasAttribute('data-tagchange')) {
      // 发送：将div标签还原为a标签
      // lingxi-signature-block
      const copyItem = this.htmlApi.parseHtml(itemHtmlStr).body.querySelector('#lingxi-signature-block');
      if (!copyItem) {
        return {
          op: 'none',
        };
      }
      // const copyItem = this.htmlApi.parseHtml(itemHtmlStr).body.childNodes[0] as Element;
      const childrenStr = copyItem.innerHTML;
      copyItem.innerHTML = '';
      let copyItemHtmlStr = copyItem.outerHTML;
      copyItemHtmlStr = copyItemHtmlStr.replace(/^\<div/, '<a').replace(/div\>$/, 'a>');
      replaceEle = this.htmlApi.parseHtml(copyItemHtmlStr).body.childNodes[0];
      replaceEle.innerHTML = childrenStr;
      // itemHtmlStr = itemHtmlStr.replace(/^\<div/, '<a').replace(/div\>$/, 'a>');
      // replaceEle = this.htmlApi.parseHtml(itemHtmlStr).documentElement;
      // replaceEle = this.htmlApi.parseHtml(itemHtmlStr).body.childNodes[0];
      replaceEle.removeAttribute('data-tagchange');
      item.removeAttribute('data-tagchange');
    } else {
      // 不存在a标签包裹问题，直接返回
      return {
        op: 'none',
      };
    }
    const { attributes } = item;
    if (attributes && attributes.length > 0) {
      for (let i = 0; i < attributes.length; ++i) {
        const attrItem = attributes.item(i) as Attr;
        if (replaceEle.hasAttribute('data-tagchange') && replaceEle[attrItem.name] === undefined) {
          // 读信并且替换过标签：属性不是合法属性时，将属性改为自定义属性
          replaceEle.setAttribute(`data-${attrItem.name}`, attrItem.value);
          replaceEle.removeAttribute(attrItem.name);
        } else if (!replaceEle.hasAttribute('data-tagchange') && attrItem.name.indexOf('data-') !== -1) {
          // 发信并且替换过标签：替换过标签将属性重置为最开始属性
          replaceEle.setAttribute(attrItem.name.replace('data-', ''), attrItem.value);
          replaceEle.removeAttribute(attrItem.name);
        }
      }
    }
    return {
      op: 'replace',
      el: replaceEle,
    };
  }

  // 处理 @ 联系人，用户自己被 @ 的情况
  private handleAtBlock(item: Element, config: Map<string, any> | undefined): ElementOperation {
    const readMail: boolean = config ? config.get('readMail') === 'true' : false;
    if (readMail) {
      const currentUser = this.systemApi.getCurrentUser(config ? config.get('readMail') : '');
      // 前者PC，后者移动端
      const atTarget = item.getAttribute('data-mce-contact-id') || item.getAttribute('mail-address');
      if (!currentUser || !atTarget) {
        return {
          op: 'none',
        };
      }
      if (currentUser.id === atTarget || (currentUser.prop && Array.isArray(currentUser.prop.accountAlias) && currentUser.prop.accountAlias.includes(atTarget))) {
        const style = {
          display: 'inline-block',
          background: '#386EE7',
          'border-radius': '3px',
          padding: '2px 4px',
          color: '#fff',
          outline: 'none',
          cursor: 'pointer',
        };
        const styleStr = Object.keys(style).reduce((total, current) => {
          total += `${current}: ${style[current as keyof typeof style]};`;
          return total;
        }, '');
        item.setAttribute('style', styleStr);
        return {
          el: item,
          op: 'replace',
        };
      }
    }
    return {
      op: 'none',
    };
  }

  async handleMailContentReplace(
    model: MailEntryModel,
    scene: string,
    writeType?: WriteLetterPropType,
    isTpMail?: boolean // 是否为第三方邮件
  ) {
    const { _account } = model;
    const con = model.entry.content;
    const currentUser = this.systemApi.getCurrentUser(_account);
    // const subAccount = this.storeApi.getSubAccountList() || [];
    // const isSubAccount = subAccount.some((v: ISubAccountEmailOnlyInfo) => v.email === _account);
    const isSubAccount = this.mailConfApi.isSubAccount(_account);
    if (!currentUser) {
      this.eventApi.sendSimpleSysEvent('logout');
      throw new Error('why not login' + scene);
    }
    if (con.isHtml) {
      const conf: Map<string, any> = new Map<string, any>([
        ['mailModel', model],
        ['isTpMail', isTpMail],
        ['_account', _account],
      ]);
      if (!isTpMail) {
        // 设置图片元素替换的配置项，用于替换为本地缓存图片
        await this.addImageConf(conf, scene, _account);
      }
      con._account = _account;
      con.content = this.getTransferHtml(con, scene, true, conf);
      // }
      const cloudAttachments: MailFileAttachModel[] = [];
      const urlSet: Set<string> = new Set<string>();
      conf.forEach((val, key) => {
        const atta: MailFileAttachModel = val as MailFileAttachModel;
        if (key.startsWith('atta-') && val && atta.fileUrl && !urlSet.has(atta.fileUrl) && !(writeType && ['reply', 'replyAll'].includes(writeType))) {
          // 回复，回复全部，不处理云附件
          cloudAttachments.push(val);
          urlSet.add(atta.fileUrl);
        }
      });

      if (model.entry.attachment) {
        if (isSubAccount && !process.env.BUILD_ISELECTRON) {
          const _token = this.mailConfApi.accountTokens.find(token => token.account === _account)?.token || '';
          model.entry.attachment = model.entry.attachment.map((v: MailFileAttachModel) => {
            // 附件下载加token
            let { fileUrl } = v;
            if (fileUrl && fileUrl.includes('&_token=')) {
              fileUrl = fileUrl.replace(/&_token=[^&]*/, `&_token=${_token}`);
            } else {
              fileUrl = `${fileUrl}&_token=${_token}`;
            }
            return {
              ...v,
              fileUrl,
            };
          });
        }
        if (cloudAttachments && cloudAttachments.length > 0) {
          model.entry.attachment.push(...cloudAttachments);
        }
      }
    } else if (!con.isHtml) {
      con.content = con.content.replace(/\r?\n|(\\n)/g, '<br/>');
    }
  }

  // 判断是否是老版本的云附件，不进行处理
  private isOldVerCloudAttachment(href: string) {
    return ['http://fs.qiye.163.com/', 'https://fs.qiye.163.com/'].some(v => href.startsWith(v));
  }

  private handleCloudAttachmentReplace(item: Element, config: Map<string, any> | undefined): ElementOperation {
    const readMail: boolean = config ? config.get('readMail') === 'true' : false;
    if (['divNeteaseSiriusCloudAttach'].includes(item.id)) {
      // 写信时由于模型均不从html中获取，移除所有既有html,然后重新拼接写信模型中的云附件即可
      if (!readMail) {
        return {
          el: item,
          op: 'remove',
        };
      }
      // 从已存在的邮件中重新编辑 且 已成功获取到云附件了 直接删除即可
      if (config && config.get('scene') === 'writeLetterSinceExist') {
        const attachments = config?.get('mailModel')?.entry?.attachment;
        const cloudAtt = (attachments || []).find((att: MailFileAttachModel) => att.type === 'netfolder');
        if (cloudAtt) {
          return {
            el: item,
            op: 'remove',
          };
        }
      }
      // 读信时HTML中云附件均移除，从Model中获取
      const booleans = this.handleCloudAttachment(item, config);
      // 如所有云附件均解析成功，则直接移除html元素
      if (booleans.length > 0 && !booleans.some(cur => !cur)) {
        return {
          el: item,
          op: 'remove',
        };
      }
      // 并非所有云附件均解析成功，则替换当前元素，因为解析成功的云附件条目设置为 display:none
      return {
        el: item,
        op: 'replace',
      };
    }
    return {
      op: 'none',
    };
  }

  // 处理表扬信script ==> src/packages/web-ui/static_html/test/template-praise.html
  private handlePraiseScript(): string {
    return `<script>
    document.addEventListener("DOMContentLoaded", () => {
      // targetWrapName 需要裁剪元素
      // expandedName 展开按钮元素
      // foldName 折叠按钮元素
      // listenToggleWrapName 展开 折叠的wrap元素
      // lineMaxNumber 最大行数
      function listenLineText(targetWrapName, expandedName, foldName, listenToggleWrapName, lineMaxNumber) {
        // 表扬对象wrap
        const praiseTargetWarpEl = document.querySelector(targetWrapName);
        if (!praiseTargetWarpEl) return;
        const cssStyle = praiseTargetWarpEl.style.cssText;
        // 表扬对象toggle
        const praiseExpandedEl = document.querySelector(expandedName);
        if (!praiseExpandedEl) return;
        const praiseFoldEl = document.querySelector(foldName);
        if (!praiseFoldEl) return;
        const clipperStyle = 'display:-webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp:'+lineMaxNumber+';overflow: hidden;';
        if (praiseTargetWarpEl.offsetHeight > 21 * lineMaxNumber) {
          praiseTargetWarpEl.style.cssText += clipperStyle;
          praiseExpandedEl.style.display = "block";
        }
        const listenToggleWrapEl = document.querySelector(listenToggleWrapName);
        if (!listenToggleWrapEl) return;
        listenToggleWrapEl.addEventListener("click", function(e) {
          const target = e.target || src.srcElement;
          if (expandedName.includes(target.className.baseVal)) {
            praiseTargetWarpEl.style.cssText = cssStyle;
            praiseExpandedEl.style.display = "none";
            praiseFoldEl.style.display = "block";
          } else if (foldName.includes(target.className.baseVal)) {
            praiseTargetWarpEl.style.cssText += clipperStyle;
            praiseExpandedEl.style.display = "block";
            praiseFoldEl.style.display = "none";
          }
        });
      }
      // 监听表扬对象
      listenLineText(".praise-winners-wrap", ".praise-winner-expanded", ".praise-winner-fold", ".praise-winner-toggle", 3);
      // 监听颁奖词
      listenLineText(".praise-words-wrap", ".praise-words-expanded", ".praise-words-fold", ".praise-words-toggle", 5);
      const praiseMedalEl = document.querySelector('.praise-medal')
      if (praiseMedalEl) {
        const medalData = JSON.parse(praiseMedalEl.getAttribute("data-medal-source") || "null");
        // gif图会被浏览器缓存最后一帧，加个时间戳保证正常渲染
        praiseMedalEl.style.background = "url("+ medalData.gifImageUrl +"&"+ new Date().getTime() +") no-repeat center/contain"
      }
    });
  </script>`;
  }

  // 处理表扬信html ==> src/packages/web-ui/static_html/test/template-praise.html
  private handlePraiseReplace(item: Element, config: Map<string, any> | undefined): ElementOperation {
    const readMail: boolean = config ? config.get('readMail') === 'true' : false;
    const currentUser = this.systemApi.getCurrentUser(config ? config.get('_account') : '');
    if (readMail) {
      const dataSource = JSON.parse(item.getAttribute('data-source') || 'null') as PraiseInfo;
      if (dataSource) {
        const temp = dataSource.winners?.map(winner => winner.email);
        const index = temp.indexOf(currentUser?.id || '');
        if (index > -1) {
          const curData = dataSource.winners.splice(index, 1)[0];
          dataSource.winners.unshift(curData);
        }
        const replaceEl = document.createElement('div');
        const contentEl = ` <div
        class="divNeteaseSiriusPraise"
        contenteditable="false"
        style="position: relative;margin: 0 auto 16px;min-width: 460px;max-width: 588px;border-radius: 12px;user-select:none;
        background: url('https://cowork-storage.nos-jd.163yun.com/reward%2F2022%2F02%2F22%2F84aa392741404c44ba78b8c3af3f33e4?Signature=N08sbMa89Yy0YI6KQmwYfdNeyN07wzqoC29DNM2%2FaKg%3D&Expires=32503651199&NOSAccessKeyId=0cd796d04a3a45dba2ef94a2f2a0c218');
        background-size: cover;"
      >
        <img
          src="https://cowork-storage.nos-jd.163yun.com/reward%2F2022%2F02%2F22%2F75343b0ac49c4d148734f4700c278357?Signature=LKJYQxt7UPA0QC5jgw8maLqt0PadZWu7Ov%2Fip3Jwgbk%3D&Expires=32503651199&NOSAccessKeyId=0cd796d04a3a45dba2ef94a2f2a0c218"
          alt=""
          style="position: absolute;z-index:1;top: 0;left: 0;width: 20%;max-width: 100px;height: auto;border-radius: 12px 0 0 0;"
        />
        <img
          src="https://cowork-storage.nos-jd.163yun.com/reward%2F2022%2F02%2F22%2Fb3652394296144fdaf632074c05637b5?Signature=rd6EgCXTY%2FryJ%2FpkPPAj1vfe0dm3ZronMSk12bh0O8A%3D&Expires=32503651199&NOSAccessKeyId=0cd796d04a3a45dba2ef94a2f2a0c218"
          alt=""
          style="position: absolute;z-index:1;top: 0;right: 0;width: 13%;max-width: 70px;height: auto;border-radius: 0 12px 0 0;"
        />
        <img
          src="https://cowork-storage.nos-jd.163yun.com/reward%2F2022%2F02%2F22%2F91201de5ac9b4fe6b59fb52a46068c42?Signature=%2FUdU6kOAp4%2BCrHj3wFI0q7LCkqpY3y6NAb92UuRL9PA%3D&Expires=32503651199&NOSAccessKeyId=0cd796d04a3a45dba2ef94a2f2a0c218"
          alt=""
          style="position: absolute;z-index:1;bottom: 0;left: 0;width: 30%;max-width: 90px;height: auto;border-radius: 0 0 0 12px;"
        />
        <img
          src="https://cowork-storage.nos-jd.163yun.com/reward%2F2022%2F02%2F22%2Fd83514ae0cd44303b5bffd6a730622e7?Signature=kwxXPFqPcoX4jJT1O0g4g%2BISJp3RMF6We8vQsM2Kt74%3D&Expires=32503651199&NOSAccessKeyId=0cd796d04a3a45dba2ef94a2f2a0c218"
          alt=""
          style="position: absolute;z-index:1;bottom: 0;right: 0;width: 29%;max-width: 120px;height: auto;border-radius: 0 0 12px 0;"
        />
        <div style="position: relative;padding-bottom: 30px;z-index: 2;overflow: hidden;">
          <div class="praise-medal" data-medal-source='${JSON.stringify(dataSource.medal)}' data-hasOwner="${
          index > -1
        }" style="width: 176px;height: 150px;margin: 12px auto 25px;background: url(${dataSource.medal.gifImageUrl}) no-repeat center/contain;cursor: pointer;"></div>
          <div style="display: flex;font-size: 14px;color: #51555C;margin: 25px 20px 0">
            <p style="width: 70px;text-align-last: justify;color: rgba(38, 42, 51, 0.5);margin: 0;">表扬对象：</p>
            <div class="praise-winners-wrap" style="color: #262A33;flex: 1;line-height: 21px;">
            ${dataSource.winners
              ?.map(
                (winner: PraisePersonInfo, index: number) => `<span data-praise="true" data-mce-contact-id="${
                  winner.email
                }" data-mce-contact="true" data-mce-contact-type="EMAIL" data-hubble-event-id="pcMail_click_readMail_praiseLetter​_contactDetails​"
            style="display: inline-block;cursor: pointer;${winner.email === currentUser?.id ? 'font-weight:bold' : ''}">
              ${winner.name}${index === dataSource?.winners.length - 1 ? '' : '、'} 
            </span>`
              )
              .join('')}
            </div>
          </div>
          <div class="praise-winner-toggle">
            <svg style="display: none;margin: 8px auto;cursor: pointer;" class="praise-winner-expanded" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5.5L8 10.5L13 5.5" stroke="#7D8085" stroke-width="1.2" stroke-linejoin="round" />
            </svg>
            <svg style="display: none;margin: 8px auto;cursor: pointer;" class="praise-winner-fold" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 10.5L8 5.5L3 10.5" stroke="#7D8085" stroke-width="1.2" stroke-linejoin="round" />
            </svg>
          </div>
          <div style="display: flex;font-size: 14px;margin: 12px 20px 0">
            <p style="width: 70px;text-align-last: justify;color: rgba(38, 42, 51, 0.5);margin: 0;">颁奖词：</p>
            <pre class="praise-words-wrap" style="flex: 1;white-space: pre-wrap;line-height: 21px;color: #51555C;margin: 0;">${dataSource.presentationWords}</pre>
          </div>
          <div class="praise-words-toggle">
            <svg style="display: none;margin: 8px auto;cursor: pointer;" class="praise-words-expanded" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 5.5L8 10.5L13 5.5" stroke="#7D8085" stroke-width="1.2" stroke-linejoin="round" />
            </svg>
            <svg style="display: none;margin: 8px auto;cursor: pointer;" class="praise-words-fold" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 10.5L8 5.5L3 10.5" stroke="#7D8085" stroke-width="1.2" stroke-linejoin="round" />
            </svg>
          </div>
          <div style="display: flex;font-size: 14px;margin: 12px 20px 0">
            <p style="width: 70px;text-align-last: justify;color: rgba(38, 42, 51, 0.5);margin: 0;">颁奖人：</p>
            <span style="line-height: 150%;color: #262A33;">${dataSource.presenter}</span>
          </div>
        </div>
      </div>`;
        replaceEl.innerHTML = contentEl;
        return {
          op: 'replace',
          el: replaceEl,
        };
      }
      return {
        op: 'none',
      };
    }
    return {
      op: 'none',
    };
  }

  /**
   * 携带信息的element样例
   * <a class="divNeteaseSiriusCloudAttachItem"
   * href="https://edisk.qiye.163.com/api/biz/attachment/download?identity=6606e7227aaf41ffb558c24760ca04e9"
   * download="https://edisk.qiye.163.com/api/biz/attachment/download?identity=6606e7227aaf41ffb558c24760ca04e9"
   * file-name="lingxi_win32_1.8.4.exe" file-size="95397296" expired="0" file-type="exe" file-mime="application/x-msdownload"
   * id="540655" file-id="6606e7227aaf41ffb558c24760ca04e9"
   * style="text-decoration: none;display: block; font-size: 12px; line-height: 12px;
   * position: absolute;right: 16px;top:50%;margin-top: -14px;color:#386EE7">
   * 下载
   * </a>
   * @param attachmentParentEl
   * @param conf
   * @protected
   */
  protected handleCloudAttachment(attachmentParentEl: Element, conf?: Map<string, any>): boolean[] {
    if (!attachmentParentEl || attachmentParentEl.children.length === 0) {
      return [];
    }
    const result: boolean[] = [];
    const attachmentEl = attachmentParentEl.children;
    if (attachmentEl && attachmentEl.length > 0) {
      Array.from(attachmentEl)
        .slice(1)
        .forEach(item => {
          const el = item.querySelector('.divNeteaseSiriusCloudAttachItem') || item.querySelector('.divNeteaseBigAttachItem');
          if (el) {
            const fileName = el.getAttribute('file-name') || '';
            const url = el.getAttribute('href') || '';
            if (fileName && url && !this.isOldVerCloudAttachment(url)) {
              const attachmentURL = new URL(url);
              const fileMime = el.getAttribute('file-mime') || '';
              const fileType = el.getAttribute('file-type') || '';
              const size = el.getAttribute('file-size');
              const fileSize = size ? +size : 0;
              const fid = el.getAttribute('file-id') || el.getAttribute('fid') || '';
              const identity = attachmentURL.searchParams.get('identity') || fid;
              const realId = this.generateRndId();
              const id = el.getAttribute('id') || realId; // 做一个不重复的number的id
              const expired = Number(el.getAttribute('expired')) || 0;
              const file: MailFileAttachModel = {
                fileMime,
                fileName,
                fileType,
                fileSize,
                realId,
                type: 'netfolder',
                contentId: undefined,
                id: id as number,
                inlined: false,
                contentLocation: undefined,
                fileUrl: url,
                fileOriginUrl: url,
                deleted: false,
                ready: true,
                filePreviewUrl: url,
                fileSourceType: 1,
                fileSourceKey: this.systemApi.md5(url),
                cloudAttachment: true,
                // fid,
                cloudIdentity: identity,
                expired,
              } as MailFileAttachModel;
              this.fileApi.registerTmpFile(file);
              conf?.set('atta-' + id, file);
              item.setAttribute('style', 'display:none');
              result.push(true);
            } else {
              result.push(false);
            }
          } else {
            result.push(false);
          }
        });
    }
    return result;
  }

  generateRndId() {
    return (Date.now() % 1000000) * 1000 + Math.floor(Math.random() * 1000);
  }

  /**
   * 转换邮件html的核心逻辑入口，
   * -- 注意约束：本接口只可以更改html，或从html中提取信息，不能更改conf中的mailModel
   * @param con 邮件内容
   * @param scene 是否是读信状态
   * @param needHtml
   * @param conf 额外参数，考虑灵活性，使用了map传输数据，即可以传入，也可以传出数据，
   * 最后一个参数map中可包含值--
   * mailModel : 邮件的mailEntryModel 实体 ；
   * img-[number] :邮件正文中的内联附件图片的信息，key中的[number]为attachmentId ,value为邮件的url
   * atta-[number] :邮件正文中的云文档html解析出来的附件节点,key中的[number]为附件的唯一标识，
   * host : value为邮箱内各种资源的host , 例如企业邮的host为 mailhz.qiye.163.com 或 mail.qiye.163.com
   * readMail : value为true/false ,标识处理时使用读信方式处理，还是以发信方式处理，主要在图片地址转换上存在区别
   * imageConf: value是一个map，Map<mid+part, {filePath}> 用 mid+part 做标识，filePath是经过验证图片本机路径
   */
  getTransferHtml(con: MailContentModel, scene: string, needHtml = true, conf?: Map<string, any>) {
    // 用读信方式处理的场景
    const readMailScenes = ['readMailReadOnly', 'readMailFromNet', 'readMailFromDb', 'sign', 'writeLetterSinceNon', 'writeLetterSinceExist'];
    const document = this.htmlApi.parseHtml(con.content);
    const config = conf || new Map<string, any>();
    // 是否以读信方式
    const readMailWay = readMailScenes.includes(scene);
    const host = readMailWay ? '' : this.mailConfApi.getWebMailHost(true);
    config.set('host', host);
    config.set('readMail', String(!!readMailWay));
    config.set('scene', scene);
    config.set('_account', con._account);
    let shtml;
    if (needHtml && document.documentElement.tagName.toLowerCase() !== 'html') {
      const element = document.createElement('html');
      element.append('body');
      const rootElement = element.children.item(0);
      if (rootElement) {
        rootElement.append(document.documentElement);
        shtml = this.htmlApi.transferHtml(element, this.transfer, config);
      } else {
        throw new Error('html error');
      }
    } else if (needHtml || document.documentElement.tagName.toLowerCase() !== 'html') {
      shtml = this.htmlApi.transferHtml(document, this.transfer, config);
    } else {
      shtml = this.htmlApi.transferHtml(document.body, this.transfer, config);
    }
    // if (!readMail) {
    //   shtml = shtml.replace(/send-src="([^"]+)"/ig, (_, p1) => {
    //     return 'src="' + decodeURIComponent(this.htmlApi.decodeHtml(p1)) + '"';
    //   });
    //   console.log('reset the image src:' + shtml);
    // }
    con.content = shtml;
    return shtml;
  }

  // 保存草稿删除上传失败的内联图片和上传失败的提示
  delImgFailedUpload(con: string) {
    try {
      const document = this.htmlApi.parseHtml(con);
      const errWrapDom = document.querySelectorAll('.paste-img-reload:not(.hide)'); // 上传失败的提示显示
      if (errWrapDom && errWrapDom.length) {
        errWrapDom.forEach(i => {
          let errWrapParentDom = null;
          errWrapParentDom = i.closest('.upload-img-wrapper');
          if (!errWrapParentDom) {
            errWrapParentDom = i.closest('.paste-img-wrapper');
          }
          // let currentParentDom = i.parentElement;
          // let num = 0; // 限制循环次数，防止无限循环
          // while (!errWrapParentDom && currentParentDom && num < 5) {
          //   if (currentParentDom.className.indexOf('upload-img-wrapper') !== -1 || currentParentDom.className.indexOf('paste-img-wrapper') !== -1) {
          //     errWrapParentDom = currentParentDom;
          //   } else {
          //     currentParentDom = currentParentDom.parentElement;
          //   }
          //   num++;
          // }
          errWrapParentDom && errWrapParentDom.parentElement && errWrapParentDom.parentElement.removeChild(errWrapParentDom);
        });
        return document.documentElement.innerHTML;
      }
      return con;
    } catch (err) {
      return con;
    }
  }

  // 设置图片配置项，目的是将邮件正文的图片替换为本地图片
  // 会在 config 添加一个 imageConf 的 Map 对象
  // Map 里面的每个成员的 key 是通过邮件附件的 fileOriginUrl 解析出的  mid + part， value 是经过验证文件在本机存在的 filePath
  private async addImageConf(config: Map<string, any>, scene: string, _account?: string) {
    const mail: MailEntryModel = config.get('mailModel');
    // 对于图片替换来说，config 中的 readMail 过于宽泛，写信的某些场景也会被认为是 readMail，导致写信的图片有可能被错误的替换为本地图片，导致图裂
    const isReadMail = ['readMailReadOnly', 'readMailFromNet', 'readMailFromDb'].includes(scene);
    // 非读信的图片不进行替换
    if (!isReadMail) {
      return config;
    }
    const imageConf: Map<string, { filePath: string; fid: number }> = new Map();

    if (this.systemApi.isElectron() && mail && Array.isArray(mail.entry?.attachment)) {
      const fileOriginUrls = mail.entry.attachment.filter(v => v.inlined && v.fileType && util.isImage(v.fileType) && v.fileOriginUrl).map(v => v.fileOriginUrl || '');
      if (fileOriginUrls.length > 0) {
        const fileRecords = (
          (await this.dbApi.getByIndexIds(
            {
              dbName: 'fileop',
              tableName: 'file',
            },
            'fileOriginUrl',
            fileOriginUrls,
            _account
          )) as FileAttachModel[]
        ).filter(v => !!v);
        if (Array.isArray(fileRecords) && fileRecords.length > 0) {
          fileRecords.forEach(({ filePath, fileOriginUrl, fid }) => {
            const fileExist = filePath && window.electronLib.fsManage.isExist(filePath);
            if (fileExist && fileOriginUrl) {
              const query = this.htmlApi.parseUrlQuery(fileOriginUrl);
              if (query.mid && query.Part) {
                const key = `${query.mid}-${query.Part}`;
                imageConf.set(key, { filePath, fid: fid as number });
              }
            }
          });
        }
      }
    }
    if (imageConf.size > 0) {
      config.set('imageConf', imageConf);
    }
    return config;
  }

  protected transfer: HtmlTransfer = (item: HTMLElement, config?: Map<string, any>) => {
    // const inElectron = this.systemApi.isElectron() && window.electronLib;
    const tagName = item.tagName.toLowerCase();
    const isReadOnlyMail = config && config.get('scene') === 'readMailReadOnly'; // 只读读信页
    const { attributes } = item;
    let isAtBlock = false;
    // 处理 @ 块
    if (attributes && attributes.length > 0) {
      isAtBlock = Array.from(attributes).some(v => {
        const fromPC = v.name === 'data-mce-contact' && v.value === 'true';
        const fromMobile = v.name === 'class' && v.value === 'divNeteaseSiriusATContact';
        return fromPC || fromMobile;
      });
      // 表扬信跳过
      const hasPraise = item.getAttribute('data-praise');
      if (isAtBlock && hasPraise !== 'true') {
        // 处理 @ 块，如果 @ 的是自己，那么需要改一下样式
        return this.handleAtBlock(item, config) as ElementOperation;
      }
    }

    const isCorpMail = this.systemApi.getIsCorpMailMode();
    if (attributes && attributes.length > 0) {
      for (let i = 0; i < attributes.length; ++i) {
        const attrItem = attributes.item(i);
        // 处理attribute中的各种trigger listener 脚本
        if (attrItem && attrItem.name.startsWith('on')) {
          attrItem.value = 'void(0);';
        }
        // corpMail模式下，background会替换为u_r_l，估计有懒下载的逻辑
        if (isCorpMail && attrItem && attrItem.name === 'style' && attrItem.value) {
          attrItem.value = attrItem.value.replaceAll(/background\s*:\s*u_r_l/g, 'background:url');
        }
      }
    }
    // 处理图片
    if (tagName.toLocaleLowerCase() === 'img') {
      // if (tagName === 'img') {
      // const picURLInMailPattern =
      // /(https?:\/\/[a-zA-Z0-9\-_.]+)\/js6\/s\?.*(?:func=mbox(?::|(?:%3A))getMessageData)(?:&|(?:&amp;))(sid=[0-9a-zA-Z*_\-]+)/ig; const
      // picURLInWriteMailPattern =
      // /(https?:\/\/[a-zA-Z0-9\-_.]+)\/js6\/s\?.*(?:func=mbox(?::|(?:%3A))getComposeData)(?:&|(?:&amp;))(sid=[0-9a-zA-Z*_\-]+)/ig; const
      // searchValue = readMail ? picURLInMailPattern : picURLInWriteMailPattern; const func = readMail ? 'getMailPart' : 'downloadTmpAttachment';
      const isTpMail = config && !!config.get('isTpMail');
      if (isReadOnlyMail && !isTpMail) {
        return this.handleReadOnlyMailImageTag(item as HTMLImageElement) as ElementOperation;
      }
      return this.handleImageTag(item as HTMLImageElement, config) as ElementOperation;
    }
    // 检测是否包含iframe,并设置为沙盒模式
    if (tagName.toLocaleLowerCase() === 'iframe') {
      try {
        // 将所有iframe的sandbox属性设置为all，防止iframe中的js代码污染主页面
        item.setAttribute('sandbox', '');
      } catch (e) {
        console.error('[transIframeSandBox]', e);
      }
    }
    // 处理script标签
    // 标签标记为不过滤的不被过滤
    if (tagName === 'script' && !item.attributes.getNamedItem('nofilter') && (!config || !config.get('noFilterScript'))) {
      return {
        op: 'remove',
      } as ElementOperation;
    }
    // 26注释 因为SIRIUS-3108不能再复现 可能是读信的改造把原来的问题规避了 不是因为怪异模式改成标准模式
    // if (inElectron) {
    // 读信页移除 base 标签，防止应用崩溃，SIRIUS-3108
    // if (tagName.toLowerCase() === 'base') {
    //   return {
    //     op: 'remove',
    //   } as ElementOperation;
    // }
    // }
    // 处理灵犀的签名块、
    if (item.id === 'lingxi-signature-block') {
      // 手机端使用定制标签，会用a标签包裹，导致桌面端错误，所以需要在读信需要替换为div，发信再还原为a标签
      return this.handleSignatureTag(item, config) as ElementOperation;
    }
    // 读信 时 为引用内容添加折叠功能
    // 使用nextElementSibling 替换 nextsibing，使用nextElementSibling会将换行符排除
    if (config?.get('scene')?.includes('readMail')) {
      // 给body添加script并标记
      if (tagName === 'body' && !item.className.includes('bodyMarked')) {
        let scriptStr = `
        <script nofilter version=3>
        document.addEventListener('DOMContentLoaded', function(){
          var bqs = document.querySelectorAll('.foldEle');
          const parentWindow = window.top;

          function addOnClickFn(element) {
            element.onclick = function(e) { foldAction(e); }
          }
          for(var i=0;i <bqs.length; ++i){
            var currEl = bqs[i];
            addOnClickFn(currEl);
          }

          function foldAction(ev) {
            var currentTarget = ev.currentTarget;
            var nextElementSibling = currentTarget.nextElementSibling;
            if (!nextElementSibling || nextElementSibling.id !== 'isReplyContent') return;
            var className = nextElementSibling.className;
            if (className.indexOf('hid')!==-1) {
              var str = parentWindow  && parentWindow.__getIn18Text ? parentWindow.__getIn18Text('YINCANGYINYONGNEIRONG') : '${getIn18Text('YINCANGYINYONGNEIRONG')}'
              currentTarget.lastChild.nodeValue = str;
              nextElementSibling.className = className.replace('hid', '');
              nextElementSibling.style.display = 'block';
              localStorage.setItem('quoteShow', 'true');
            } else {
              var str = parentWindow  && parentWindow.__getIn18Text ? parentWindow.__getIn18Text('XIANSHIYINYONGNEIRONG') : '${getIn18Text('XIANSHIYINYONGNEIRONG')}'
              currentTarget.lastChild.nodeValue = str;
              nextElementSibling.className += ' hid';
              nextElementSibling.style.display = 'none';
              localStorage.setItem('quoteShow', 'false');
            }
          };
        });
        </script>
      `;
        // 插入表扬信逻辑
        scriptStr += this.handlePraiseScript();
        const tmpDoc = new DOMParser().parseFromString(scriptStr, 'text/html');
        // 插入收起/展开引用内容的script
        if (tmpDoc?.head?.childNodes?.length) {
          tmpDoc.head.childNodes.forEach(child => {
            item.appendChild(child);
          });
        }
        item.className += ' bodyMarked';
      }
      // 引用内容
      if (item.id === 'isReplyContent' && tagName === 'div') {
        // 默认折叠/展开
        const quoteExpand = localStorage.getItem('quoteShow') === 'true';
        // 邮件已被已标记（入库标记） 视为本轮被标记
        if (item.className.includes('marked')) {
          config.set('marked', true);
          // eslint-disable-next-line no-param-reassign
          item.style.display = quoteExpand ? 'block' : 'none';
          const prev = item.previousElementSibling;
          if (prev?.className.includes('foldEle')) {
            if (prev?.lastChild?.nodeValue) {
              prev.lastChild.nodeValue = quoteExpand ? getIn18Text('YINCANGYINYONGNEIRONG') : getIn18Text('XIANSHIYINYONGNEIRONG');
            }
          }
          // 本轮未被标记
        } else if (!config.get('marked')) {
          // 本轮标记
          config.set('marked', true);
          // 插入引用/折叠入口
          const folderStr = `<div class='foldEle' style="font-size:14px;line-height:16px;color:#386EE7;margin:16px 0;cursor:pointer;display:flex;">
            <svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#386EE7" style="margin-right: 6px;">
              <path d="M2.5 2.5A.5.5 0 013 2h10a.5.5 0 01.5.5v11a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5v-11z" stroke="#386EE7"></path>
              <path d="M5 5h6M5 8h3.5" stroke="#386EE7" stroke-linecap="round"></path>
            </svg>
            ${quoteExpand ? getIn18Text('YINCANGYINYONGNEIRONG') : getIn18Text('XIANSHIYINYONGNEIRONG')}
          </div>`;

          const tmpDoc = new DOMParser().parseFromString(folderStr, 'text/html');
          // eslint-disable-next-line no-param-reassign
          item.className += ` marked ${quoteExpand ? '' : 'hid'}`;
          if (item instanceof HTMLElement && !quoteExpand) item.style.display = 'none';
          item?.parentNode?.insertBefore(tmpDoc?.body?.childNodes[0], item);
        }
      }
    }
    // 处理云附件
    if (['divNeteaseSiriusCloudAttach', 'divNeteaseBigAttach'].includes(item.id)) {
      return this.handleCloudAttachmentReplace(item, config) as ElementOperation;
    }
    // 处理表扬信
    if (['divNeteaseSiriusPraise'].includes(item.className) && !isReadOnlyMail) {
      // 重绘表扬信html
      return this.handlePraiseReplace(item, config) as ElementOperation;
    }
    // 处理任务邮件原生卡片
    if (['divNeteaseSiriusTask'].includes(item.className) && !isReadOnlyMail) {
      const readMail: boolean = config ? ['readMailFromNet', 'readMailFromDb'].includes(config.get('scene')) : false;
      let replaceEle = null as any;
      replaceEle = this.htmlApi.parseHtml(item.outerHTML).body.childNodes[0];
      if (readMail) {
        // 读信
        replaceEle.style.display = 'none';
      } else if (!readMail) {
        // 发送
        const hideEle = replaceEle.getElementsByClassName('divNeteaseSiriusHidden');
        if (hideEle && hideEle.length > 0) {
          for (let i = 0; i < hideEle.length; i++) {
            const onEle = hideEle[i];
            onEle.style.display = 'none';
          }
        }
        replaceEle.className = 'divNeteaseSiriusTask-write';
        replaceEle.style.display = 'block';
      }
      return {
        op: 'replace',
        el: replaceEle,
      } as ElementOperation;
    }
    // 处理任务通知邮件底部下载提示、im通知邮件底部下载提示等
    if (typeof item.className === 'string' && item.className.indexOf('divNeteaseSiriusHidden') !== -1) {
      return {
        el: item,
        op: 'remove',
      } as ElementOperation;
    }
    // 处理im通知邮件提示文案
    if (['qiyesu-im-notice-more-text'].includes(item.className)) {
      let replaceEle = null as any;
      replaceEle = this.htmlApi.parseHtml(item.outerHTML).body.childNodes[0];
      replaceEle.innerHTML = '更多未读请前往消息列表查看';
      return {
        op: 'replace',
        el: replaceEle,
      } as ElementOperation;
    }
    // 处理im通知邮件按钮文案
    if (['qiyesu-im-notice-more-btn'].includes(item.className)) {
      let replaceEle = null as any;
      replaceEle = this.htmlApi.parseHtml(item.outerHTML).body.childNodes[0];
      replaceEle.innerHTML = '点击前往消息列表';
      return {
        op: 'replace',
        el: replaceEle,
      } as ElementOperation;
    }
    return {
      op: 'none',
    } as ElementOperation;
  };

  isEntryContentEmpty(ret: MailEntryModel) {
    return !ret || !ret.entry.content || !ret.entry.content.content || ret.entry.content.content.length === 0;
  }

  // 检查DB中TpMailContent的附件的下载链接和预览链接是否有未换成邮件+的链接
  checkAttachmentUrl(result: MailEntryModel) {
    if (!result.entry.attachment || result.entry.attachment.length === 0) {
      // 邮件没有附件
      return false;
    }
    return result.entry.attachment.some((i: MailFileAttachModel) => {
      if (!i.fileUrl) {
        return false;
      }
      return i.fileUrl.indexOf('js6') !== -1;
    });
  }

  saveMailBoxContentToAction(_: MailBoxModel[], mailBoxEntry: EntityMailBox[], _account?: string) {
    const actions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    actions.lastMailBoxUpdateTime[ActionStore.keyMailSyncTime] = new Date().getTime();
    mailBoxEntry.forEach(item => {
      if (item.mailBoxId && actions.mailBoxDic) {
        if (![mailBoxOfStar.id, mailBoxOfUnread.id].includes(item.mailBoxId as number)) {
          actions.mailBoxDic[+item.mailBoxId] = { ...item };
        }
      }
    });
  }

  notifyFolderCountChange(noCache: boolean, _account?: string) {
    return new Promise(resolve => {
      setTimeout(() => {
        // warn: 同步发送会导致redux的崩溃问题....临时解决方案
        this.calFolderUnread(_account);
        this.eventApi.sendSysEvent({
          eventName: 'mailChanged',
          eventStrData: 'refreshFolder',
          eventData: {
            noCache,
          },
          _account,
        });
        resolve(true);
      }, 100);
    });
    // warn: 同步发送会导致redux的崩溃问题....临时解决方案
    // setTimeout(() => {
    //   console.log('zzzzzzzh run notifyFolderCountChange')
    //   this.calFolderUnread();
    //   this.eventApi.sendSysEvent({
    //     eventName: 'mailChanged',
    //     eventStrData: 'refreshFolder',
    //     eventData: {
    //       noCache,
    //     },
    //   });
    // }, 100);
  }

  calFolderUnread(_account?: string) {
    const isThreadMode = this.mailConfApi.getMailMergeSettings() === 'true';
    const actions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    const { mailBoxDic } = actions;
    // if (_account && this.subActions && this.subActions?.has(_account)) {
    //   mailBoxDic = this.subActions.get(_account)?.mailBoxDic;
    // }
    if (!mailBoxDic) {
      return;
    }
    let unread = 0;
    Object.keys(mailBoxDic).forEach(key => {
      if (mailBoxDic && Object.prototype.hasOwnProperty.apply(mailBoxDic, [key]) && mailBoxDic[Number(key)]) {
        const item = mailBoxDic[Number(key)];
        const fid = Number(item.id);
        if (item && (fid === mailBoxOfDefault.id || item.mailBoxType === 'customer')) {
          unread += isThreadMode ? item.threadMailBoxCurrentUnread : item.mailBoxCurrentUnread;
        }
      }
    });
    // TODO：临时防护，1.11 梳理消息，解决到底为什么 unread 会小于 0 -_-||
    if (unread < 0) {
      unread = 0;
      console.error('[mail] something wrong... and the unread is less then 0: ', unread);
    }
    this.loggerApi.track('mark_mail', { stage: 'cal_folder_unread', isThreadMode, mailBoxDic, unread });
    this.updateUnreadCount(unread, _account);
  }

  updateUnreadCount(unread: number, _account?: string) {
    this.pushApi!.triggerNotificationInfoChange(
      {
        action: 'new_mail_num',
        num: unread,
        content: '',
        title: '',
      },
      _account
    );
  }

  compareMailBoxModel(cacheResult: MailBoxModel[], netResult: MailBoxModel[]) {
    if (cacheResult && netResult) {
      if (cacheResult.length !== netResult.length) {
        return true;
      }
      const len = cacheResult.length;
      for (let i = 0; i < len; ++i) {
        const itemA = cacheResult[i];
        const itemB = netResult[i];
        if (this.compareMailBoxItem(itemA, itemB)) {
          return true;
        }
      }
    }
    return false;
  }

  private compareMailBoxItem(itemA: MailBoxModel, itemB: MailBoxModel) {
    const entryNEq =
      itemA.entry.mailBoxUnread !== itemB.entry.mailBoxUnread ||
      itemA.entry.mailBoxCurrentUnread !== itemB.entry.mailBoxCurrentUnread ||
      itemA.entry.mailBoxTotal !== itemB.entry.mailBoxTotal ||
      itemA.entry.mailBoxId !== itemB.entry.mailBoxId ||
      itemA.entry.sort !== itemB.entry.sort;
    if (entryNEq) {
      return true;
    }
    if (itemA.children && itemA.children.length > 0) {
      if (!itemB.children || itemB.children.length !== itemA.children.length) {
        return true;
      }
      const len = itemA.children.length;
      for (let i = 0; i < len; ++i) {
        if (this.compareMailBoxItem(itemA.children[i], itemB.children[i])) {
          return true;
        }
      }
    }
    return false;
  }

  simpleKeysInEntry: Array<keyof MailEntryModel['entry']> = [
    'folder',
    'memo',
    'mark',
    'readStatus',
    // 'title',摘要，标题，tid的不同需要额外处理，如果网络返回空，缓存有值，则不认为不同
    // 'brief',
    // 'tid',
    // 'rcptCount',
    // 'readCount',
    // 'innerCount',
    // 'innerRead',
    'preferred',
    'praiseId',
    'eTeamType',
    'tid',
    'deferTime',
    'sentMailId',
  ];

  numberKeysInEntry: Array<keyof MailEntryModel['entry']> = ['rcptCount', 'readCount', 'innerCount', 'innerRead'];

  booleanKeysInEntry: Array<keyof MailEntryModel['entry']> = [
    'replayed',
    'forwarded',
    'directForwarded',
    'top',
    'isScheduleSend',
    'requestReadReceipt',
    'isDefer',
    'deferNotice',
    'popRead',
    'rcptFailed',
    'rcptSucceed',
    'system',
    'linkAttached',
    'suspiciousSpam',
  ];

  // 摘要，标题，tid的不同需要额外处理，如果网络返回空，缓存有值，则不认为不同
  spStringKeyInEntry: Array<keyof MailEntryModel['entry']> = ['title', 'brief', 'tid'];

  // 『几乎』是全部字段的比对了
  compareMailEntryModel(
    itemA: MailEntryModel, // 缓存
    itemB: MailEntryModel // network
  ) {
    const idA = itemA.isThread ? itemA.threadId : itemA.id;
    const idB = itemB.isThread ? itemB.threadId : itemB.id;
    const isIdDifferent = !!idB && idA !== idB;
    if (isIdDifferent) {
      return true;
    }

    if (itemA.isOneRcpt !== itemB.isOneRcpt) {
      return true;
    }

    if (itemA.antispamInfo !== itemB.antispamInfo) {
      return true;
    }

    if (itemA.taskId !== itemB.taskId) {
      return true;
    }

    const threadIdA = itemA.threadId;
    const threadIdB = itemB.threadId;
    const isThreadIdDifferent = !!threadIdB && threadIdA !== threadIdB;
    if (isThreadIdDifferent) {
      return true;
    }

    const isBooleanDifferent = this.booleanKeysInEntry.some(key => (itemA.entry[key] || false) !== (itemB.entry[key] || false));
    if (isBooleanDifferent) {
      return true;
    }

    // 聚合邮件不比较 folder
    const simpleKeysInEntry = itemA.isThread ? [...this.simpleKeysInEntry.slice(1)] : this.simpleKeysInEntry;
    if (itemB.entry.memo !== itemA.entry.memo) {
      return true;
    }
    const isStringInEntryDifferent = simpleKeysInEntry.some(key => itemB.entry[key] && itemA.entry[key] !== itemB.entry[key]);
    if (isStringInEntryDifferent) {
      return true;
    }

    const isNumberInEntryDifferent = this.numberKeysInEntry.some(key => itemA.entry[key] !== itemB.entry[key]);
    if (isNumberInEntryDifferent) {
      return true;
    }

    const isSpStringInEntryDifferent = this.spStringKeyInEntry.some(
      key => itemB.entry[key] && String(itemB.entry[key]).trim().length > 0 && itemA.entry[key] !== itemB.entry[key]
    );
    if (isSpStringInEntryDifferent) {
      return true;
    }

    const sendersA = Array.isArray(itemA.senders) ? itemA.senders : [];
    const sendersB = Array.isArray(itemB.senders) ? itemB.senders : [];
    const sendersASet = new Set(sendersA.map(v => v.originName + v.contactItem.contactItemVal));
    const sendersBSet = new Set(sendersB.map(v => v.originName + v.contactItem.contactItemVal));
    const isSendersDifferent = util.isArrayDifferent([...sendersASet], [...sendersBSet]);
    if (isSendersDifferent) {
      return true;
    }

    const attachmentUrlsA = Array.isArray(itemA.entry.attachment) ? itemA.entry.attachment.map(v => v.fileUrl).filter(v => !!v) : [];
    const attachmentUrlsB = Array.isArray(itemB.entry.attachment) ? itemB.entry.attachment.map(v => v.fileUrl).filter(v => !!v) : [];
    const isAttachmentDifferent = !util.isArrayContains(attachmentUrlsA as string[], attachmentUrlsB as string[]);
    if (isAttachmentDifferent) {
      return true;
    }

    const isThreadMessageIdsDifferent = util.isArrayDifferent(itemA.entry.threadMessageIds, itemB.entry.threadMessageIds);
    if (isThreadMessageIdsDifferent) {
      return true;
    }

    const isConvFidsDifferent = util.isArrayDifferent(itemA.convFids, itemB.convFids);
    if (isConvFidsDifferent) {
      return true;
    }

    const isTagsDifferent = util.isArrayDifferent(itemA.tags, itemB.tags);
    if (isTagsDifferent) {
      return true;
    }

    return false;
  }

  getAttachmentsIllegal(dtA?: MailFileAttachModel[], dtB?: MailFileAttachModel[]): number {
    if (!dtA || !dtB) {
      return -1;
    }
    const fileUrlMapA = dtA.reduce((total, current) => {
      if (current.fileUrl) {
        total.set(current.fileUrl, current);
      }
      return total;
    }, new Map() as Map<string, MailFileAttachModel>);
    const fileUrlMapB = dtB.reduce((total, current) => {
      if (current.fileUrl) {
        total.set(current.fileUrl, current);
      }
      return total;
    }, new Map() as Map<string, MailFileAttachModel>);
    // eslint-disable-next-line no-restricted-syntax
    for (const [keyA, valueA] of fileUrlMapA) {
      const valueB = fileUrlMapB.get(keyA);
      if (valueB) {
        const illegalNum = this.getAttachmentIllegal(valueA, valueB);
        if (illegalNum > 0) {
          return illegalNum;
        }
      }
    }
    return -1;
  }

  getAttachmentIllegal(dtA: MailFileAttachModel, dtB: MailFileAttachModel): number {
    if (dtA.fileUrl !== dtB.fileUrl) {
      return -1;
    }
    if (dtA.inlined !== dtB.inlined) {
      const dtAImageIllegal = dtA.fileMime?.includes('image') && !dtA.fileName?.endsWith(`.${dtA.fileType}`);
      const dtBImageIllegal = dtB.fileMime?.includes('image') && !dtB.fileName?.endsWith(`.${dtB.fileType}`);
      if (dtAImageIllegal || dtBImageIllegal) {
        return 2;
      }
      return 1;
    }
    return -1;
  }
}
