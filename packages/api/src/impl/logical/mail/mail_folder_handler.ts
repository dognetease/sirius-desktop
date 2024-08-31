import moment from 'moment';
import {
  ActionStore,
  mailBoxOfAllRes,
  mailBoxOfDefault,
  mailBoxOfDefer,
  // mailBoxOfOthers,
  mailBoxOfRdFlag,
  // mailBoxOfUnread,
  MethodMap,
  ResponseContactStats,
  ResponseFolderDef,
  ResponseGroupResult,
  ResponseMessageStat,
} from './mail_action_store_model';
import { api } from '@/api/api';
import {
  StarAddressContactMap,
  createUserFolderParams,
  EntityMailBox,
  MailBoxModel,
  MailSearchModelCondition,
  StarMailUnreadParams,
  updateUserFolderParams,
} from '@/api/logical/mail';
import { MailModelHandler } from './mail_entry_helper';
import { MailContactHandler } from './mail_obtain_contact_helper';
import { FileApi } from '@/api/system/fileLoader';
import { MailAbstractHandler } from './mail_abs_handler';
import { ApiResponse, ResponseData } from '@/api/data/http';
import { NumberTypedMap } from '@/api/commonModel';
import { ErrorReportApi } from '@/api/data/errorReport';
import { apis } from '@/config';
import { LoggerApi } from '@/api/data/dataTracker';
import { MailContentDbHelper } from '@/impl/logical/mail/mail_content_db_handler';
import corpMailUtils from './corp_mail_utils';
import { ContactApi, OrgApi } from '@/api/logical/contactAndOrg';
import { getIn18Text } from '@/api/utils';
import { FolderErrResult } from '@/api/errMap';

/**
 * 文件夹处理
 */
export class MailFolderHandler extends MailAbstractHandler {
  fileApi: FileApi;

  errReportApi: ErrorReportApi;

  loggerApi: LoggerApi;

  contactApi: ContactApi & OrgApi;

  static debugMailPopWindow = false;

  constructor(
    actions: ActionStore,
    modelHandler: MailModelHandler,
    contactHandler: MailContactHandler,
    mailDbHandler: MailContentDbHelper,
    subActions?: Map<string, ActionStore>
  ) {
    // action改造
    super(actions, modelHandler, contactHandler, mailDbHandler, subActions);
    this.fileApi = api.getFileApi();
    this.errReportApi = api.requireLogicalApi(apis.errorReportImpl) as unknown as ErrorReportApi;
    this.loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;
    this.contactApi = api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
  }

  unpackFolderData(res: ApiResponse): ResponseData {
    console.log('[mail] return from network:', res);
    const isCorpMailMode = this.systemApi.getIsCorpMailMode();
    if (isCorpMailMode) {
      // 转换接口的response到hmail的格式
      corpMailUtils.corpMailTransformResponse(res);
    }
    // console.log(res);
    const data = res.data as ResponseData;

    if (data && data.code !== MailAbstractHandler.sOk) {
      res.config.requestFailed = true;
    }
    return data;
  }

  public async doListMailBox(noCache?: boolean, updateStat?: boolean, entries?: EntityMailBox[], _account?: string): Promise<MailBoxModel[]> {
    const p1 = () => this.doListFolder(noCache, entries, _account);
    // 用于更新待办邮件数目
    const p2 = updateStat ? () => Promise.resolve(null) : () => this.doStatMessages(noCache, updateStat, undefined, _account);
    return Promise.all([p1(), p2()])
      .then(([mailBoxModels, deferEntry]) => {
        if (deferEntry) {
          mailBoxModels.some(v => {
            // 待办邮件存到了 actionStore 中，没有存到 db 中，因为没有放到 entries 中
            if (v.mailBoxId === mailBoxOfDefer.id) {
              const oldName = v?.entry?.mailBoxName;
              if (entries) {
                const newEntries = [...entries, deferEntry.entry];
                this.saveMailContentToAction(mailBoxModels, newEntries, _account);
              }
              // 同步深度信息
              if (v.entry?._deep != null) {
                deferEntry.entry._deep = v.entry?._deep;
              }
              v.entry = deferEntry.entry;
              // 兼容稍后处理文件夹名称翻译
              if (oldName) {
                v.entry.mailBoxName = oldName;
              }
              return true;
            }
            return false;
          });
        }
        // TODO: updateStat 为 true 时的目的需要更明确，目前的设计没啥用
        console.log('[doListMailBox]', mailBoxModels, deferEntry);
        return mailBoxModels;
      })
      .catch(e => Promise.reject(this.commonCatch(e)));
  }

  async getStarMailUnreadFromServer(params: StarMailUnreadParams, _account?: string): Promise<ResponseContactStats> {
    const urlKey = 'contactStats';
    const url = this.buildUrl(urlKey, undefined, undefined, _account);
    const apiRet = await this.impl.post(
      url,
      params,
      this.getConfigForHttp(urlKey, {
        url,
        data: params,
        method: 'post',
        cachePolicy: 'refresh',
        _account,
      })
    );
    const res: ResponseData<ResponseContactStats> = this.unpackFolderData(apiRet);
    if (res.code !== MailAbstractHandler.sOk || !res.var) {
      throw new Error(String(res.code) || 'unknown_err');
    }
    return res.var;
  }

  async updateStarUnread(starList: MailBoxModel[], addressContactMap: StarAddressContactMap, _account?: string): Promise<MailBoxModel[]> {
    const reqParams: StarMailUnreadParams = {
      addresses: Object.keys(addressContactMap),
      addressType: 2,
      returnAll: false,
    };
    // 服务端获取未读数数据
    const { stats } = await this.getStarMailUnreadFromServer(reqParams, _account);
    const contactUnreadMap: Record<string, number> = {};
    stats.forEach(({ address, newMsgCnt }) => {
      const addressContact = addressContactMap[address];
      if (addressContact) {
        addressContact.contactsBelong.forEach(contact => {
          if (!contactUnreadMap[contact]) {
            contactUnreadMap[contact] = 0;
          }
          contactUnreadMap[contact] += newMsgCnt;
        });
      }
    });
    const idMap: Record<string, number> = {};
    // 更改包括星标联系人的文件夹树的未读数
    starList.forEach(({ starInfo, entry }) => {
      const contactId = starInfo?.id;
      if (contactId && contactUnreadMap[contactId] !== undefined) {
        const unread = contactUnreadMap[contactId];
        entry.mailBoxUnread = unread;
        entry.mailBoxCurrentUnread = unread;
        entry.threadMailBoxUnread = unread;
        entry.threadMailBoxCurrentUnread = unread;
        idMap[contactId] = unread;
      }
    });
    // 写入到联系人的 personal_mark 表
    await this.contactApi.doUpdateMarkUnreadMailCount(idMap, _account);
    return starList;
  }

  public async doListFolder(noCache?: boolean, entries?: EntityMailBox[], _account?: string): Promise<MailBoxModel[]> {
    const urlKey = 'listFolder';
    // custom : 系统文件夹在上  custom_virtual： 系统文件夹参与混排
    const dt = {
      order: 'custom_virtual',
    };
    if (noCache) {
      await this.mailConfApi.loadMailConf(_account);
    }
    try {
      const [entryDt, startListWithNewUnread] = await Promise.all([this.listMailEntry(dt, urlKey, noCache, _account), this.doStarContactUnread(_account)]);
      // const entryDt = await this.listMailEntry(dt, urlKey, noCache);
      await this.buildFolderConf(_account);
      // const { starList, addressContactMap } = await this.mailApi.doListStarContact();
      // const startListWithNewUnread = await this.updateStarUnread(starList, addressContactMap);
      const mailBoxModels = await this.modelHandler.handleCommonFolderRet(entryDt, startListWithNewUnread, _account);
      this.saveMailContentToAction(mailBoxModels, entryDt, _account);
      if (entries) {
        entries.push(...entryDt);
      }
      return mailBoxModels;
    } catch (e) {
      return Promise.reject(this.commonCatch(e));
    }
  }

  async doStarContactUnread(_account?: string): Promise<MailBoxModel[]> {
    const { starList, addressContactMap } = await this.mailApi.doListStarContact(_account);
    const startListWithNewUnread = await this.updateStarUnread(starList, addressContactMap);
    console.log('startListWithNewUnread', startListWithNewUnread);
    return startListWithNewUnread;
  }

  getDoStatMessagesParams(updateStat?: boolean, fids?: number[], filter?: MailSearchModelCondition) {
    if (updateStat) {
      return {
        fids: Array.isArray(fids) ? fids : [mailBoxOfDefault.id],
      };
    }
    return {
      filter: filter || {
        defer: `:${moment().format('YYYYMMDD')}`,
      },
    };
  }

  public async doStatMessages(
    noCache?: boolean,
    updateStat?: boolean,
    params?: {
      fids?: number[];
      filter?: MailSearchModelCondition;
    },
    _account?: string
  ): Promise<MailBoxModel | null> {
    const urlKey = 'statMailCount';
    if (noCache) {
      await this.mailConfApi.loadMailConf(_account);
    }
    const mailBox: MailBoxModel = {
      childrenCount: 0,
      entry: {
        mailBoxName: mailBoxOfDefer.name || '',
        mailBoxCurrentUnread: 0,
        mailBoxUnread: 0,
        mailBoxTotal: 0,
        mailBoxType: 'sys',
        mailBoxId: mailBoxOfDefer.id,
        mailBoxParent: 0,
        threadMailBoxTotal: 0,
        threadMailBoxUnread: 0,
        threadMailBoxCurrentUnread: 0,
        deferCount: 0,
        id: mailBoxOfDefer.sort + '',
        sort: mailBoxOfDefer.sort,
        _deep: 1,
      },
      mailBoxId: mailBoxOfDefer.id,
      children: [],
    };
    try {
      const url = this.buildUrl(urlKey, undefined, undefined, _account);
      const req = this.getDoStatMessagesParams(updateStat, params?.fids, params?.filter);
      // const req = updateStat
      //   ? {
      //       fids:
      //         params && Array.isArray(params?.fids)
      //           ? params.fids
      //           : [mailBoxOfDefault.id],
      //     }
      //   : {
      //       filter: params?.filter || {
      //         defer: `:${moment().format('YYYYMMDD')}`,
      //       },
      //     };

      const apiRet = await this.impl.post(
        url,
        req,
        this.getConfigForHttp(urlKey, {
          url,
          data: req,
          method: 'post',
          cachePolicy: noCache ? 'refresh' : undefined,
          _account,
        })
      );
      const res: ResponseData<ResponseMessageStat> = this.unpackFolderData(apiRet);
      if (res.code !== MailAbstractHandler.sOk || !res.var || !res.var.all) {
        console.error('[doStatMessages] error', res.code);
        return null;
      }
      mailBox.entry.deferCount = res.var.all.msgcnt || 0;
      mailBox.entry.mailBoxUnread = res.var.all.msgcnt || 0;
      mailBox.entry.mailBoxCurrentUnread = res.var.all.msgcnt || 0;
      mailBox.entry.threadMailBoxUnread = res.var.all.msgcnt || 0;
      mailBox.entry.threadMailBoxCurrentUnread = res.var.all.msgcnt || 0;
      return mailBox;
    } catch (e) {
      console.error('[doStatMessages] error', e);
      return null;
    }
  }

  public getAllFids(fids: number[] = [mailBoxOfDefault.id], _account?: string) {
    const actions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    const { mailBoxDic } = actions || {};
    if (mailBoxDic) {
      Object.keys(mailBoxDic).forEach(it => {
        const element = actions.mailBoxDic && actions.mailBoxDic[parseInt(it, 10)];
        if (element && !element.locked && element.id !== String(mailBoxOfDefault.id) && +element.mailBoxId) {
          fids.push(+element.mailBoxId);
        }
      });
    }
    return fids;
  }

  async listMailEntry(dt: { [k: string]: string | boolean | undefined }, urlKey: keyof MethodMap, noCache: boolean | undefined, _account?: string) {
    const url = this.buildUrl(urlKey, undefined, undefined, _account);
    const isCorpMailMode = this.systemApi.getIsCorpMailMode();
    if (isCorpMailMode) {
      // corpMode需要stats参数来返回stats状态
      if (!dt) {
        dt = {};
      }
      dt.threads = true;
      dt.stats = true;
    }

    const apiRet = await this.impl.post(
      url,
      dt,
      this.getConfigForHttp(urlKey, {
        url,
        data: dt,
        method: 'post',
        cachePolicy: noCache ? 'refresh' : undefined,
        _account,
      })
    );
    const res: ResponseData<ResponseFolderDef[]> = this.unpackFolderData(apiRet);

    if (res.code !== MailAbstractHandler.sOk || !res.var) {
      throw new Error(String(res.code) || 'unknown_err');
    }
    const data: ResponseFolderDef[] = res.var;
    // data.forEach((item) => {
    //   const key = LocalLabelConf[item.name as keyof typeof LocalLabelConf];
    //   if (key != null) {
    //     item.name =
    //       getIn18Text(key) || item.name;
    //   }
    // });
    const actions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    actions.mailBoxOriginData = data;
    // if (now - this.actions.lastUserAttrUpdateTime < 60000) {
    //   return this.handleFolderRet(data, true);
    // } else {
    // debugger;
    const entryDt = this.mappingToMailBoxEntry(data, _account);
    return entryDt;
  }

  // private getErrorMsgByErroCode(errCode: string): string {
  //   const isCorpMailMode = this.systemApi.getIsCorpMailMode();
  //   if (isCorpMailMode) {
  //     return corpMailUtils.getCorpFolderErrMsgByCode(errCode);
  //   }
  //   const errorInfo = this.getErrMsg(errCode);
  //   return errorInfo.title;
  // }

  // 优先命中文件夹相关错误码
  private getFolderErrorMsgByErroCode(errCode: string): string {
    const errorInfo = this.getErrMsg(errCode, undefined, undefined, { errResult: FolderErrResult });
    return errorInfo.title;
  }

  // 优先命中文件夹相关错误码
  private getFolderErrorMsgByResponse(res: ResponseData | unknown): string {
    const resCode = (res as ResponseData)?.data?.message || (res as ResponseData)?.data?.code;
    if (resCode) {
      return this.getFolderErrorMsgByErroCode(resCode);
    }
    return '';
  }

  // private getErrorMsgByResponse(res: ResponseData | unknown): string {
  //   const resCode = (res as ResponseData)?.data?.message || (res as ResponseData)?.data?.code;
  //   if (resCode) {
  //     return this.getErrorMsgByErroCode(resCode);
  //   }
  //   return '';
  // }

  public async createUserFolder(items: createUserFolderParams[], _account?: string): Promise<number[]> {
    try {
      const urlKey = 'createUserFolder';
      const url = this.buildUrl(urlKey, undefined, undefined, _account);
      const isCorpMailMode = this.systemApi.getIsCorpMailMode();
      if (isCorpMailMode) {
        corpMailUtils.transformCorpCreateUserFolderParams(items);
      }
      const dt = { items };
      const apiRet = await this.impl.post(
        url,
        dt,
        this.getConfigForHttp(urlKey, {
          url,
          data: dt,
          method: 'post',
          noErrorMsgEmit: true,
          _account,
        })
      );
      const res: ResponseData<number[]> = this.unpackFolderData(apiRet);
      if (res.code === MailAbstractHandler.sOk && res.var) {
        const data: number[] = res.var;
        return Promise.resolve(data);
      }
      // corp的reject具体的错误信息
      const resCode = res.code as string;
      const errMsg = this.getFolderErrorMsgByErroCode(resCode);
      return Promise.reject(errMsg);
    } catch (ex) {
      const errorMsg = this.getFolderErrorMsgByResponse(ex);
      if (errorMsg) {
        return Promise.reject(errorMsg);
      }
      return Promise.reject(ex);
    }
  }

  public async updateUserFolder(items: updateUserFolderParams[], _account?: string): Promise<boolean> {
    try {
      const urlKey = 'updateUserFolder';
      const url = this.buildUrl(urlKey, undefined, undefined, _account);
      const dt = { items };
      const apiRet = await this.impl.post(
        url,
        dt,
        this.getConfigForHttp(urlKey, {
          url,
          data: dt,
          method: 'post',
          noErrorMsgEmit: true,
          _account,
        })
      );
      const res: ResponseData<number[]> = this.unpackFolderData(apiRet);
      if (res.code === MailAbstractHandler.sOk) {
        return Promise.resolve(true);
      }
      // corp的reject具体的错误信息
      // const resCode = res.code as string;
      // let errMsg = this.getFolderErrorMsgByErroCode(resCode);
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({ code: res.code });
    } catch (ex) {
      const errorMsg = this.getFolderErrorMsgByResponse(ex);
      if (errorMsg) {
        return Promise.reject(errorMsg);
      }
      return Promise.reject(ex);
    }
  }

  public async deleteUserFolder(ids: string[], _account?: string): Promise<boolean> {
    try {
      const urlKey = 'deleteUserFolder';
      const url = this.buildUrl(urlKey, undefined, undefined, _account);
      const dt = {
        ids,
      };
      const apiRet = await this.impl.post(
        url,
        dt,
        this.getConfigForHttp(urlKey, {
          url,
          data: dt,
          method: 'post',
          _account,
        })
      );
      const res: ResponseData<number[]> = this.unpackFolderData(apiRet);
      if (res.code === MailAbstractHandler.sOk) {
        return Promise.resolve(true);
      }
      // corp的reject具体的错误信息
      const resCode = res.code as string;
      const errMsg = this.getFolderErrorMsgByErroCode(resCode);
      return Promise.reject(errMsg);
    } catch (ex) {
      const errorMsg = this.getFolderErrorMsgByResponse(ex);
      if (errorMsg) {
        return Promise.reject(errorMsg);
      }
      return Promise.reject(ex);
    }
  }

  private async buildFolderConf(_account?: string): Promise<void> {
    // return
    // this.mailConfApi.doGetUserAttr([MailSettingKeys.nFolderSetting]).then((res: StringMap) =>
    const actions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    if (actions) {
      const isCorpMail = this.systemApi.getIsCorpMailMode();
      let value: string | null = null;
      if (!isCorpMail) {
        // corp不支持
        value = await this.mailConfApi.getFolderSettings(_account);
      }
      const ret: {
        folder: number[][];
        tag: any[];
        filecenter: any[];
      } = value ? JSON.parse(value) : { folder: [] };
      if (ret && ret.folder) {
        ret.folder.forEach(it => {
          if (it && it.length === 2 && it[0] && it[1]) {
            let mailBoxConf = actions.mailBoxConfs[it[0]];
            if (!mailBoxConf) {
              mailBoxConf = {
                id: it[0],
                fold: it[1],
                sort: 1000,
              };
            } else {
              mailBoxConf.fold = it[1];
            }
            actions.mailBoxConfs[it[0]] = mailBoxConf;
          }
        });
        actions.lastUserAttrUpdateTime = new Date().getTime();
      }
    }

    // );
  }

  protected handleFolderRet(data: ResponseFolderDef[], gpCount?: ResponseGroupResult, _account?: string): MailBoxModel[] {
    const ret: MailBoxModel[] = [];
    const trans: NumberTypedMap<MailBoxModel> = {};
    const mailCount: NumberTypedMap<number> = {};
    const threadMailCount: NumberTypedMap<number> = {};
    let total = 0;
    let threadTotal = 0;
    const actions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;

    if (gpCount) {
      const { fid } = gpCount;
      if (fid) {
        fid.forEach(it => {
          if (it.val !== undefined) {
            mailCount[Number(it.val)] = it.cnt;
            threadMailCount[Number(it.val)] = it.threadCount || 0;
            total += it.cnt;
            threadTotal += it.cnt;
          }
        });
      }
    }
    {
      const redMailBox = {
        childrenCount: 0,
        entry: {
          mailBoxName: getIn18Text('QUANBU'),
          mailBoxCurrentUnread: total,
          mailBoxUnread: total,
          threadMailBoxTotal: 0,
          threadMailBoxUnread: threadTotal,
          threadMailBoxCurrentUnread: threadTotal,
          mailBoxTotal: 0,
          mailBoxType: 'sys',
          mailBoxId: mailBoxOfAllRes.id,
          mailBoxParent: 0,
          id: '0',
          sort: actions.mailBoxConfs[mailBoxOfRdFlag.id].sort,
        },
        children: [],
      } as MailBoxModel;
      ret.push(redMailBox);
      trans[mailBoxOfAllRes.id] = redMailBox;
    }

    data.forEach(item => {
      const { id } = item;
      const entry: EntityMailBox = {
        mailBoxName: item.name,
        mailBoxCurrentUnread: item?.stats?.unreadMessageCount || 0,
        mailBoxUnread: item?.stats?.unreadMessageCount || 0,
        mailBoxTotal: item?.stats?.messageCount || 0,
        threadMailBoxTotal: Math.max(item?.stats?.unreadThreadCount || 0, 0),
        threadMailBoxUnread: Math.max(item?.stats?.unreadThreadCount || 0, 0),
        threadMailBoxCurrentUnread: Math.max(item?.stats?.threadCount || 0, 0),
        mailBoxType: item.flags.system ? 'sys' : 'customer',
        mailBoxId: id,
        mailBoxParent: item.parent,
        id: '' + (actions.mailBoxConfs[id]?.sort || id),
        pid: item.parent,
        locked: item.auth2Locked,
        keepPeriod: item.keepPeriod,
        sort: actions.mailBoxConfs[id]?.sort,
      };
      {
        const countElement = mailCount[id] || 0;
        const threadCountElement = threadMailCount[id] || 0;
        entry.mailBoxCurrentUnread = countElement as number;
        entry.mailBoxUnread = countElement as number;
        entry.threadMailBoxCurrentUnread = threadCountElement as number;
        entry.threadMailBoxUnread = threadCountElement as number;
      }
      trans[id] = {
        childrenCount: 0,
        entry,
        children: [],
      };
    });

    const children: NumberTypedMap<MailBoxModel[]> = {};
    // for (const item of data)
    data.forEach(item => {
      const { id } = item;
      const pid = item.parent;
      const model = trans[id];
      model.mailBoxId = id;
      const mailBoxConf = actions.mailBoxConfs[id];
      if (!mailBoxConf?.hide) {
        model.entry.mailBoxName = mailBoxConf?.name || model.entry.mailBoxName;
        if (model.entry.mailBoxType === 'sys') {
          // if (mailBoxConf?.getUnreadNumber) {
          //   let unreadNumber = mailBoxConf.getUnreadNumber(model);
          //   model.entry.mailBoxUnread = unreadNumber.unread;
          //   model.entry.mailBoxCurrentUnread = unreadNumber.currentUnread;
          // }
          ret.push(model);
        } else if (model.entry.mailBoxType === 'customer') {
          if (pid === 0) {
            ret.push(model);
          } else {
            let list = children[pid];
            if (!list) {
              list = [];
            }
            list.push(model);
            children[pid] = list;
          }
          // }
        }
      }
    });
    /* for (const i in ) */
    Object.keys(children).forEach(i => {
      if (Object.prototype.hasOwnProperty.apply(children, [i]) && children[Number(i)]) {
        children[Number(i)].forEach(it => {
          const parent = trans[Number(i)];
          parent.children!.push(it);
          parent.childrenCount += 1;
          this.modelHandler.handleParentCount(trans, parent, it.entry.mailBoxUnread, it.entry.threadMailBoxUnread);
          // parent.entry.mailBoxUnread += it.entry.mailBoxCurrentUnread || 0;
        });
      }
    });
    return ret;
  }

  travelAndGetAllNode(mailBoxModels: MailBoxModel[], trans: NumberTypedMap<MailBoxModel>) {
    if (mailBoxModels && mailBoxModels.length > 0) {
      mailBoxModels.forEach(it => {
        if (it.mailBoxId) {
          trans[+it.mailBoxId] = it;
        }
        if (it.children && it.children.length > 0) {
          this.travelAndGetAllNode(it.children, trans);
        }
      });
    }
  }
}
