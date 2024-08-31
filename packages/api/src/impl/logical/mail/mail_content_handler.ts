/* eslint-disable max-lines */
import cloneDeep from 'lodash/cloneDeep';
import moment from 'moment';
import lodashGet from 'lodash/get';
import {
  ActionStore,
  CheckTpMailResponse,
  CustomerListEntryResponse,
  CustomerListUnreadResponse,
  CustomerListUnreadTotalResponse,
  ListEntryResponse,
  mailBoxOfDefault,
  mailBoxOfDefer,
  mailBoxOfRdFlag,
  mailBoxOfUnread,
  mailBoxOfSent,
  mailBoxOfWaitingIssue,
  MailEntryProcessingItem,
  MethodMap,
  methodMap,
  RequestCustomerListMailEntry,
  RequestCustomerListMailEntryItem,
  RequestCustomerMailTotalUnreadEntry,
  RequestCustomerMailUnreadEntry,
  // RequestDownloadAttachment,
  RequestListMailEntry,
  RequestSubordinateListMailEntry,
  RequestSubordinateListMailEntryItem,
  RequestThreadListMailEntry,
  RequestThreadMailDetailEntry,
  ResponseAttachment,
  ResponseDeliverStatus,
  ResponseFolderStat,
  ResponseMailContentEntry,
  ResponseMailEntryModelWithTotal,
  ResponseMailListEntry,
  ResponseRelatedMail,
  ResponseThreadDetailEntryModelWithTotal,
  ResponseThreadMailDetailEntry,
  ResponseThreadMailEntryModelWithTotal,
  ResponseThreadMailListEntry,
  ThreadDetailEntryResponse,
  ThreadListEntryResponse,
  TpMailContentResponse,
  watchConf,
  ReqMailReadCount,
  ReqMailReadDetail,
  SubActionsType,
  ResponseFolderDef,
} from './mail_action_store_model';
// import { StoreData } from '@/api/data/store';
import { api } from '@/api/api';
import {
  ApiResponseListAttachments,
  contentMakeModelParams,
  CustomerBoxUnread,
  CustomerUnread,
  CustomerUnreadItem,
  DecryptedResult,
  DeliveryDetail,
  EdmMailModelEntries,
  listAttachmentsParam,
  MailBoxEntryContactInfoModel,
  MailContentModel,
  MailDeliverStatus,
  MailEncodings,
  MailEntryModel,
  MailExternalDeliverStatusItem,
  MailFileAttachModel,
  MailModelEntries,
  MailOperationStatus,
  queryCusterUnreadParam,
  queryMailBoxParam,
  queryThreadMailDetailParam,
  RequestSequentialParams,
  ResponseListAttachments,
  ResponseUploadMail,
  SyncTpMailParamItem,
  TpMailContentParams,
  UpdateMailCountTaskType,
  UploadMailResult,
  WriteMailInitModelParams,
  // AccountTokensType,
} from '@/api/logical/mail';
import { MailModelHandler } from './mail_entry_helper';
import { MailContactHandler } from './mail_obtain_contact_helper';
import { FileApi, FileSourceType, FileType } from '@/api/system/fileLoader';
// import { ISubAccountEmailOnlyInfo } from '@/api/data/store';
import { MailAbstractHandler } from './mail_abs_handler';
import { ApiResponse, ResponseData } from '@/api/data/http';
import { StringMap, StringTypedMap } from '@/api/commonModel';
import { ErrResult } from '@/api/errMap';
import { ContactModel } from '@/api/_base/api';
import { ErrorReportApi } from '@/api/data/errorReport';
import { apis, inWindow } from '@/config';
import { SystemEvent } from '@/api/data/event';
import { MailFolderHandler } from './mail_folder_handler';
import { getXmlByObject, getFolderStartContactId, pathNotInArrJudge, util, wait, getIsEncryptedMail } from '@/api/util';
import { MailContentDbHelper } from '@/impl/logical/mail/mail_content_db_handler';
import corpMailUtils from './corp_mail_utils';
import { locationHelper } from '@/api/util/location_helper';
import { edmMailHelper } from '@/api/util/edm_mail_helper';
import { getIn18Text, setMailListAttSource, setMailAttSource } from '@/api/utils';

/**
 * 将外域邮件状态更新到全量列表
 * @param statusList         全量邮件状态列表
 * @param externalStatusList 外域邮件状态列表
 * @returns
 */
function mergeMailStatusList(statusList: ResponseDeliverStatus[] = [], externalStatusList: MailExternalDeliverStatusItem[] = []) {
  return statusList.map(status => {
    const target = externalStatusList.find(newStatus => newStatus.to === status.to);
    if (!target) {
      return status;
    }
    status.inner = target.inner;
    if (status.result >= 700) {
      return status;
    }
    if (target?.read) {
      status.result = 109;
      status.modtime = util.formatDate(target.readTime);
      return status;
    }
    //  status.result=target?.sentStatus;
    return status;
  });
}

/**
 * 读信处理
 */
export class MailContentHandler extends MailFolderHandler {
  fileApi: FileApi;

  errReportApi: ErrorReportApi;

  mailDbHandler: MailContentDbHelper;

  static debugMailPopWindow = false;

  static decryptedErrorCode = {
    FA_MAIL_NOT_FOUND: getIn18Text('FA_MAIL_NOT_FOUND'),
    FA_PART_NOT_FOUND: getIn18Text('FA_PART_NOT_FOUND'),
    FA_INVALID_PART: getIn18Text('FA_EMPTY_PASSWORD'),
    FA_EMPTY_PASSWORD: getIn18Text('FA_EMPTY_PASSWORD'),
    FA_INVALID_PASSWORD: getIn18Text('FA_INVALID_PASSWORD'),
    FA_INVALID_ENCRYPTED_DATA: getIn18Text('FA_INVALID_ENCRYPTED_DATA'),
  };

  constructor(actions: ActionStore, modelHandler: MailModelHandler, contactHandler: MailContactHandler, mailDbHandler: MailContentDbHelper, subActions?: SubActionsType) {
    super(actions, modelHandler, contactHandler, mailDbHandler, subActions);
    this.mailDbHandler = mailDbHandler;
    this.fileApi = api.getFileApi();
    this.errReportApi = api.requireLogicalApi(apis.errorReportImpl) as unknown as ErrorReportApi;
  }
  // zpy-tag: 无引用
  protected handleCacheStatus(res: ApiResponse<any>) {
    // 废弃
    const tag = res.config.tag as keyof MethodMap;
    if (tag && watchConf[tag]) {
      const item = watchConf[tag];
      if (item && item.updateStatus) {
        this.cleanCacheStatus();
        this.doUpdateMailBoxStat('default').then().catch(console.error);
      }
      if (item && item.cache) {
        const methodStatus = this.actions.methodStatus[tag];
        if (methodStatus && !methodStatus.refreshedKeys) {
          methodStatus.refreshedKeys = new Set<string>();
        }
        const value = res.config.rqKey || '';
        if (methodStatus && methodStatus.refreshedKeys && !methodStatus.refreshedKeys.has(value)) {
          methodStatus.refreshedKeys.add(value);
        }
      }
    }
  }

  protected unpackData(res: ApiResponse): ResponseData {
    const isCorpMailMode = this.systemApi.getIsCorpMailMode();
    if (isCorpMailMode) {
      corpMailUtils.corpMailTransformResponse(res);
    }
    const data = res.data as ResponseData;
    if (data && data.code === (MailAbstractHandler.sOk || MailAbstractHandler.SuccessCode)) {
    } else {
      res.config.requestFailed = true;
    }
    return data;
  }

  // 下属邮件,转发/回复,接口整理
  protected unpackSubData(res: ApiResponse): ResponseData {
    const isCorpMailMode = this.systemApi.getIsCorpMailMode();
    if (isCorpMailMode) {
      corpMailUtils.corpMailTransformResponse(res);
    }
    const data = res.data as ResponseData;
    if (data && data.code === 0) {
      // 附件字段映射
      if (data.data?.attachments && data.data?.attachments.length) {
        data.data.attachments = data.data.attachments.map((item: { name: any; filename: any; size: any; estimateSize: any; id: string | number }) => {
          item.name = item.filename;
          item.size = item.estimateSize;
          item.id = isNaN(+item.id) ? item.id : +item.id;
          return item;
        });
      }
      data.var = data.data;

      data.code = MailAbstractHandler.sOk;
    } else {
      res.config.requestFailed = true;
    }
    return data;
  }
  // zpy-tag: 无引用
  cleanCacheStatus(_account?: string) {
    const targetActions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    console.log('clear cache called', targetActions.methodStatus);
  }

  async getStarMailBoxIdByEmail(model: MailEntryModel): Promise<string[]> {
    const emailSet: Set<string> = new Set();
    const mailBoxIdSet: Set<string> = new Set();
    if (model.sender?.contact?.contact?.accountName) {
      emailSet.add(model.sender?.contact?.contact?.accountName);
    }
    if (Array.isArray(model.receiver) && model.receiver.length > 0) {
      model.receiver.forEach(v => {
        const email = v?.contact?.contact?.accountName;
        if (email) {
          emailSet.add(email);
        }
      });
    }
    if (emailSet.size > 0) {
      const emails = [...emailSet];
      const starMap = await this.contactApi.doGetPersonalMarklistByEmail({ emails });
      if (starMap.size > 0) {
        starMap.forEach(v => {
          v.forEach(it => {
            const mailBoxId = getFolderStartContactId(it.id, it.type);
            mailBoxIdSet.add(mailBoxId);
          });
        });
      }
    }
    return [...mailBoxIdSet];
  }

  async doUpdateMailBoxStat(taskType: UpdateMailCountTaskType, extraData?: any, _account?: string): Promise<void> {
    console.log('[mail sync] doUpdateMailBoxStat: ', taskType);
    const targetActions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    const fids: number[] = targetActions.mailBoxDic ? this.getAllFids() : [mailBoxOfDefault.id];
    const isThread = this.mailConfApi.getMailMergeSettings() === 'true';
    let unread = 0;
    const accountMd5 = this.systemApi.md5(this.systemApi.getCurrentUser(_account)?.id || '----');
    if (taskType === 'push' && extraData && extraData.mid && extraData.accountId === accountMd5) {
      console.log('[mail-push] got ', extraData);
      const retrySend = async (retry: number, mid: string): Promise<boolean> => {
        if (retry > 0) {
          try {
            await wait(1000);
            const model = await this.mailApi.doGetMailContent(mid, undefined, undefined, taskType);
            if (model) {
              console.log('[mail-push] got mail model ', model);
              // 如果在账号后台
              if (inWindow() && window.isAccountBg) {
                this.mailApi.doListMailBox(true, false).then();
              } else {
                // 获取星标联系人对应的文件夹ID
                const starMailBoxIds = await this.getStarMailBoxIdByEmail(model);
                await this.sendRefreshEvent(taskType, false, new Set([model.entry.folder, ...starMailBoxIds]), mid);
                // 更新客户列表排序
                if (this.systemApi.inEdm()) {
                  this.mailApi.doUpdateCustomersByNewMail([model]).catch(e => {
                    console.error('[edm mail] push customer', e);
                  });
                  // this.mailApi.refreshCustomerUnread([model]).catch(e => {
                  //   console.error('[edm mail] push unread', e);
                  // });
                }
              }
              // 17版本智能模式下线，陌生人不再调用
              // setTimeout(() => {
              //   this.mailApi.newMailIntoStrangers(model);
              // });
              // await this.eventApi.sendSysEvent({
              //   eventName: 'mailChanged',
              //   eventStrData: 'refreshThreadContent',
              //   eventData: {
              //     taskType
              //     // ...params,
              //     // threadId: id,
              //   },
              // });
              return true;
            }
            console.warn('[mail] got empty data when refresh push email ' + mid + ' ' + retry);
            this.loggerApi.track('push_email_retrieve_failed', { retry, mid, msg: 'empty data' });
            await wait((3 - retry) * 500);
            return retrySend(retry - 1, mid);
          } catch (ex: any) {
            console.warn('[mail] got error when refresh push email ' + mid + ' ' + retry, ex);
            this.loggerApi.track('push_email_retrieve_failed', { retry, mid, msg: ex?.msg });
            await wait((3 - retry) * 500);
            return retrySend(retry - 1, mid);
          }
        } else {
          // await this.sendRefreshEvent(taskType, true, new Set<number>(fids));
          console.log('[mail-push] not got mail content for ' + mid);
        }
        return false;
      };
      const pushed = await retrySend(3, extraData.mid);
      if (pushed) {
        console.log('[mail-push]', pushed);
        return Promise.resolve();
      }
    }
    if (pathNotInArrJudge(window.location, ['/', 'api_data_init'])) {
      return Promise.resolve();
    }
    const differFolder: Set<number> = new Set<number>();
    const retryGet = async (retry: number): Promise<void> => {
      console.log('[mail sync] statUnreadCount start');
      const res = await this.statUnreadCount(fids, false, _account);
      unread = Object.keys(res).reduce((prev: number, it: string) => {
        if (targetActions.mailBoxDic) {
          const fid = Number(it);
          const mailBoxDicElement = targetActions.mailBoxDic[fid];
          if (mailBoxDicElement) {
            const pre = isThread ? mailBoxDicElement.threadMailBoxTotal : mailBoxDicElement.mailBoxTotal;
            const preUnread = isThread ? mailBoxDicElement.threadMailBoxUnread : mailBoxDicElement.mailBoxUnread;
            const mailboxHasUnread =
              mailBoxDicElement.mailBoxId === mailBoxOfDefault.id ||
              mailBoxDicElement.mailBoxType === 'customer' ||
              mailBoxDicElement.mailBoxId === mailBoxOfWaitingIssue.id;
            const dicItem = res[it];
            const countDiffer = mailboxHasUnread
              ? pre !== (isThread ? dicItem.threadCount : dicItem.messageCount) || preUnread !== (isThread ? dicItem.unreadThreadCount : dicItem.unreadMessageCount)
              : pre !== (isThread ? dicItem.threadCount : dicItem.messageCount);
            if (countDiffer) {
              differFolder.add(fid);
            }
            if (mailboxHasUnread) {
              prev += isThread ? dicItem.unreadThreadCount : dicItem.unreadMessageCount;
            }
          }
        }
        return prev;
      }, 0);
      this.modelHandler.updateUnreadCount(unread);
      console.log('[mail sync] statUnreadCount end', unread);
      if (differFolder.size === 0 && retry > 0 && taskType === 'push') {
        await wait(1500 + 1000 * (3 - retry));
        await retryGet(retry - 1);
      }
    };
    await retryGet(2);
    console.log('[mail sync] statUnreadCount differFolder', differFolder);
    if (differFolder.size > 0) {
      this.refreshMailContent(differFolder, taskType).then();
    } else {
      this.mailApi.doListMailBox(true, false).then();
    }
    setTimeout(() => {
      this.mailApi.syncAllMails(200, 0, _account).then();
    }, 1500);
    return Promise.resolve();
  }

  private async refreshMailContent(differFolder: Set<number>, taskType: UpdateMailCountTaskType) {
    // TODO : refresh cache
    console.log('[mail] push differ count folder:', differFolder);
    if (differFolder && differFolder.size > 0) {
      // let retry = 2;
      // const now = Date.now();
      // let lastTime = 0;
      // do {
      await this.sendRefreshEvent(taskType, true, differFolder);
      // const hasNew = lastTime + 180000 > now;
      // if (hasNew) {
      // this.doListMailBox(true, false).then();
      // this.cleanCacheStatus();
      //   break;
      // } else
      //   await wait(2000+(3-retry)*1000);
      // } while ((retry--) > 0);
    }
  }

  async sendRefreshEvent(taskType: UpdateMailCountTaskType, noCache?: boolean, fids?: Set<number | string>, mid?: string): Promise<number> {
    const maxLastTime = 0;
    this.eventApi.sendSysEvent({
      eventName: 'mailChanged',
      eventStrData: 'data',
      eventData: {
        // entries: newMail,
        // count: newMail.length,
        noCache,
        fid: fids,
        taskType,
        mid,
      },
    } as SystemEvent);
    this.eventApi.sendSysEvent({
      eventName: 'mailChanged',
      eventStrData: 'refreshFolder',
      eventData: {
        // entries: newMail,
        // count: newMail.length,
        noCache,
        taskType,
      },
    } as SystemEvent);
    return maxLastTime;
  }

  statUnreadCount(fids?: number[], needFillIds?: boolean, _account?: string): Promise<StringTypedMap<ResponseFolderStat>> {
    if (needFillIds && !fids) {
      const targetActions = this.mailApi.getActions({
        actions: this.actions,
        subActions: this.subActions,
        _account,
      })?.val;
      if (!targetActions.mailBoxDic) {
        fids = [mailBoxOfDefault.id];
      } else {
        fids = Object.keys(targetActions.mailBoxDic).map(it => parseInt(it, 10));
      }
    }
    const url = this.buildUrl('getFolderStat', undefined, undefined, _account);
    const defaultResult = {};
    return this.impl
      .post(url, { ids: fids, threads: true, messages: true }, { contentType: 'json', cachePolicy: 'noCache' })
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<StringTypedMap<ResponseFolderStat>>) => {
        if (res.code === MailAbstractHandler.sOk) {
          return res.var || defaultResult;
        }
        return Promise.reject(new Error('统计接口报错'));
      })
      .catch(ex => {
        console.error('statUnreadCount error', ex);
        return defaultResult;
      });
  }

  getMailPartHtml(mid: string, part: number, _account?: string): Promise<string> {
    const requestData = {
      mid,
      part,
      mode: 'inline',
    };
    const key = 'getMailPart';
    const url = this.buildUrl(key);
    const requestConfig = this.getConfigForHttp(key, {
      url,
      data: part,
      method: 'post',
      contentType: 'form',
      responseType: 'text',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/html',
      },
      _account,
    });
    const isCorpMail = this.systemApi.getIsCorpMailMode(_account);

    return (isCorpMail ? this.impl.get(url, requestData, requestConfig) : this.impl.post(url, requestData, requestConfig)).then((res: ApiResponse<string>) => {
      if (res.rawData) {
        return res.rawData;
      }
      return '';
    });
  }

  getMailHeaders(mid: string, _account?: string): Promise<string> {
    const requestData = {
      mid,
      action: 'read_head',
      mode: 'text',
      // l: 'read',
    };
    const key = 'getMailPart';
    const url = this.buildUrl(key);
    return this.impl.post(url, requestData, { _account }).then((res: ApiResponse<string>) => res?.data as unknown as string);
  }

  // public doGetMailContent(ids: string, noFlagInfo?: boolean, noCache?: boolean): Promise<MailEntryModel> {
  //   return this.getMailContentInternal(ids, noFlagInfo, noCache).then((res) => {
  //     this.saveMails(res).then();
  //     return res;
  //   });
  // }

  // 邮件讨论，邮件消息详情
  public async doGetMailContentIM(emailMid: string, teamId?: string): Promise<MailEntryModel> {
    if (!emailMid) {
      return Promise.reject(new Error('emailMid is null'));
    }
    const httpApi = api.getDataTransApi();
    const url = this.systemApi.getUrl('getDiscussMailDetail');
    const mailEntryModelPromise = await httpApi
      .get(url, { emailMid, teamId })
      .then(res => {
        if (res && res.data && res.data.success) {
          return res.data.data;
        }
        return Promise.reject(new Error('获取邮件详情失败'));
      })
      .then(res => {
        // available 表示邮件是否被删除，撤回等导致的不可达
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { available } = res!;
        if (!available) {
          return Promise.reject(new Error('availableFail'));
        }
        const data: ResponseMailContentEntry = res!.email;
        const prItem: MailEntryProcessingItem = this.contactHandler.mapMailEntryToProcessingItem(data, emailMid);
        const promise = this.contactHandler.handleContactList([prItem]);
        // const dataContentNotEmpty = !!data.html && !!data.html.contentLength && data.html.contentLength > 0;
        // const mailPartHtmlPromise = Promise.resolve(dataContentNotEmpty ? data.html!.content : '');
        return promise;
        //     .then((contentRs:MailEntryProcessingItem[]) => {
        //     let htmlContent = '';
        //     if (contentRs[0] && contentRs[0].length > 0) {
        //       htmlContent = contentRs[0] as string;
        //     }
        //     if (contentRs[1] && contentRs[1].length === 1) {
        //       const dd = contentRs[1][0] as MailEntryProcessingItem;
        //       if (dd.html) {
        //         dd.html.content = htmlContent;
        //       }
        //     }
        //     return contentRs as MailEntryProcessingItem[];
        //   });
        // })
      })
      .then((res: MailEntryProcessingItem[]) => this.handleMailContentResponse(res, true))
      .then(res => setMailAttSource(res, 'content'));
    return mailEntryModelPromise;
  }

  private getMailContentPartProcessPromise(id: string, data: ResponseMailContentEntry, _account?: string): Promise<string> {
    const dataContentNotEmpty = !!data.html && !!data.html.contentLength && data.html.contentLength > 0;
    const hasHtmlMailContent = dataContentNotEmpty && (!data!.html!.content || data!.html!.content.length === 0);
    if (hasHtmlMailContent && data?.html?.id) {
      return this.getMailPartHtml(id, data?.html?.id, _account);
    }
    return Promise.resolve(dataContentNotEmpty ? data.html!.content : '');
  }

  public async doGetDecryptedContent(id: string, encpwd: string, _account?: string): Promise<DecryptedResult> {
    const urlKey = 'decryptedContent';
    const url = this.buildUrl(urlKey, { l: 'read', action: 'decrypt' }, undefined, _account);
    const dt = {
      id,
      password: encpwd + '',
      mode: 'html',
    };
    const result = await this.impl.post(
      url,
      dt,
      this.getConfigForHttp(urlKey, {
        contentType: 'json',
        responseType: 'text',
        expectedResponseType: 'json',
        url,
        data: dt,
        method: 'post',
        cachePolicy: 'refresh',
        _account,
      })
    );
    const res = this.unpackData(result);
    if (res && res.code === MailAbstractHandler.sOk && res.var) {
      const content = await this.getMailContentPartProcessPromise(id, res.var, _account);
      const { html = {}, attachments } = res.var;
      return {
        passed: true,
        data: {
          html: {
            content,
            contentId: html.id || '',
            contentLength: html.contentLength || 0,
          },
          attachments,
        },
      };
    }
    return {
      passed: false,
      code: res.code as string,
      errMsg: MailContentHandler.decryptedErrorCode[res.code as keyof typeof MailContentHandler.decryptedErrorCode],
    };
  }

  // eslint-disable-next-line max-params
  public async doGetMailContent(
    ids: string,
    conf?: {
      noFlagInfo?: boolean;
      noCache?: boolean;
      noContactRace?: boolean;
      encoding?: MailEncodings;
      _account?: string;
    }
  ): Promise<MailEntryModel> {
    const { noFlagInfo, noCache, noContactRace = false, _account, encoding } = conf || {};
    if (!ids) {
      return Promise.reject(new Error('请填入邮件id'));
    }
    const id: string = ids;
    if (MailAbstractHandler.tmpIdFormat.test(id)) {
      const newId = id.replace('-tmp', '');
      // 区分写信action
      const targetActions = this.mailApi.getActions({ actions: this.actions, subActions: this.subActions, _account }).val;
      if (targetActions?.mailEntryCache[newId]) {
        const element = await this.modelHandler.loadEntryFromStore(newId, _account);
        if (element) {
          return Promise.resolve(this.makeModelSafe(element));
        }
      } else {
        return Promise.reject(new Error('邮件id不存在'));
      }
    }

    const urlKey = 'listContent';
    // 模式使用新模式，支持微软的winmail.dat附件
    const url = this.buildUrl(urlKey, { l: 'read', uid: MailAbstractHandler.user?.id || '', supportTNEF: 'true' }, undefined, _account);
    const dt = {
      id,
      level: 32,
      mode: 'html',
      returnHeaders: {
        'Resent-From': 'A', // 代发/转发标识，不为空就是转发，否则就是代发
        Sender: 'A', // 转发
      },
      encoding: !encoding || encoding === 'default' ? undefined : encoding,
      // 获取邮件详情的时候不需要服务端同时标记已读
      markRead: false,
    };
    const mailEntryModelPromise = this.impl
      .post(url, dt, {
        ...(this.getConfigForHttp(urlKey, {
          contentType: 'json',
          responseType: 'text',
          expectedResponseType: 'json',
          url,
          data: dt,
          method: 'post',
          cachePolicy: noCache ? 'refresh' : undefined,
        }) || {}),
        _account,
      })
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<ResponseMailContentEntry>) => {
        if (res && res.code === MailAbstractHandler.sOk && res.var) {
          return this.getMailContentProcessResponse(id, res.var as ResponseMailContentEntry, noContactRace, _account);
        }
        return Promise.reject(this.getErrMsg(res.code));
      })
      .then((res: MailEntryProcessingItem[]) => this.handleMailContentResponse(res, undefined, undefined, encoding, _account))
      .then(res => setMailAttSource(res, 'content'));
    const modelPromise = this.getMailContentMakeModelPromise({
      id,
      noFlagInfo,
      noCache,
      _account,
    });

    // TODO : handle errors
    return Promise.all([modelPromise, mailEntryModelPromise])
      .then(res => this.getMailContentAssemble(res))
      .catch(reason => {
        console.warn(reason);
        if (reason === 'FA_MAIL_NOT_FOUND' || reason?.message === 'FA_MAIL_NOT_FOUND') {
          this.loggerApi.track('dogetmailcontontent_fail', {
            reason: reason || reason?.message,
            id,
          });
        }
        return Promise.reject(this.commonCatch(reason));
      });
  }

  async handleRawMailContent(id: string, rawContent: ResponseMailContentEntry) {
    const contentProcessResponse = await this.getMailContentProcessResponse(id, rawContent);
    const model = await this.handleMailContentResponse(contentProcessResponse);
    return model;
  }

  async handleMailContentResponseAddTid(res1: MailEntryModel, res2: MailEntryProcessingItem[], owner: string) {
    const tpRes = res2.map(v => ({ ...v, isTpMail: true, owner }));
    res1.mailFrom = 'subordinate'; // 下属邮件添加一个标志
    tpRes[0].tid = res1.entry.tid;
    const res22 = await this.handleMailContentResponse(tpRes);
    return [res1, res22];
  }

  doGetTpMailContent(param: Required<TpMailContentParams>, checkType: queryMailBoxParam['checkType'] = 'checkCustomerMail'): Promise<MailEntryModel> {
    const url = this.systemApi.getUrl('readTpMessage');
    const req = {
      email: param.owner,
      mid: param.mid,
    };
    const mailEntryModelPromise = this.impl
      .post(url, req, {
        url,
        method: 'post',
        contentType: 'json',
        responseType: 'text',
        expectedResponseType: 'json',
      })
      .then(res => {
        const { data, code } = res.data as TpMailContentResponse;
        if (+code === 0 && data) {
          return this.getMailContentProcessResponse(req.mid, data);
        }
        return Promise.reject(this.getErrMsg(code));
      });
    const modelPromise = this.getMailContentMakeModelPromise({
      id: req.mid,
      checkType,
      tpMids: { mids: [req.mid], email: req.email },
    }).catch(() => {
      console.error('getMailContentMakeModelPromise');
      return Promise.resolve(this.buildEmptyMailEntryModel({ id: req.mid }, true));
    });
    return Promise.all([modelPromise, mailEntryModelPromise])
      .then(res => this.handleMailContentResponseAddTid(res[0], res[1], param.owner))
      .then(res => this.getMailContentAssemble(res))
      .catch(reason => {
        console.warn(reason);
        return Promise.reject(this.commonCatch(reason));
      });
  }

  getMailContentProcessResponse(id: string, data: ResponseMailContentEntry, noContactRace = false, _account?: string): Promise<MailEntryProcessingItem[]> {
    const prItem: MailEntryProcessingItem = this.contactHandler.mapMailEntryToProcessingItem(data, id);
    const promise = this.contactHandler.handleContactList([prItem], noContactRace, _account);
    const mailPartHtmlPromise = this.getMailContentPartProcessPromise(id, data);
    // TODO : error handling
    return Promise.all([mailPartHtmlPromise, promise]).then((contentRs: [string, MailEntryProcessingItem[]]) => {
      let htmlContent = '';
      if (contentRs[0] && contentRs[0].length > 0) {
        htmlContent = contentRs[0] as string;
      }
      if (contentRs[1] && contentRs[1].length === 1) {
        const dd = contentRs[1][0] as MailEntryProcessingItem;
        if (dd.html) {
          dd.html.content = htmlContent;
        }
      }
      return contentRs[1] as MailEntryProcessingItem[];
    });
  }

  getMailContentMakeModelPromise(param: contentMakeModelParams) {
    const { id, noFlagInfo, noCache, ignoreContact = true, noContactRace = false, checkType, attrQuery, tpMids, _account } = param || {};
    return noFlagInfo
      ? Promise.resolve(this.buildEmptyMailEntryModel({ id, _account }, true))
      : this.mailApi
          .doListMailBoxEntities(
            {
              mids: [id],
              count: 1,
              ignoreContact,
              noContactRace,
              checkType,
              attrQuery,
              tpMids: tpMids ? [tpMids] : undefined,
              _account: param._account,
            },
            noCache
          )
          .then(result => {
            const res = Array.isArray(result) ? (result as MailEntryModel[]) : (result as MailModelEntries).data;
            return res[0];
          });
  }

  getMailContentAssemble(res: MailEntryModel[]) {
    if (res && res[0] && res[1]) {
      const attachmentIllegal = this.modelHandler.getAttachmentsIllegal(res[0].entry.attachment, res[1].entry.attachment);
      if (attachmentIllegal > 0) {
        if (!res[0].mailIllegal) {
          res[0].mailIllegal = [];
        }
        res[0].mailIllegal.push(attachmentIllegal);
      }
      const { entry } = res[0];
      entry.title = res[1].entry.title;
      entry.content = res[1].entry.content;
      entry.requestReadReceipt = res[1].entry.requestReadReceipt;
      entry.requestReadReceiptLocal = res[1].entry.requestReadReceipt;
      entry.attachment = res[1].entry.attachment;
      res[0].receiver = res[1].receiver;
      // 规避详情接口返回的发件人解析异常的问题
      if (res[1].sender.originName !== '无发件人') {
        res[0].sender = res[1].sender;
      }
      // 列表不返回时区，详情会返回，用详情覆盖之
      if (res[1]?.scheduleDateTimeZone) {
        res[0].scheduleDateTimeZone = res[1].scheduleDateTimeZone;
      }
      res[0].headers = res[1].headers;
      res[0].antispamInfo = res[1].antispamInfo; // 手动转换，有问题！
      return res[0];
    }
    if (res[1]) {
      console.error('获取邮件内容时，未返回标示位对象');
      return res[1];
    }
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject({
      popupType: 'window',
      title: '未返回合适数据',
      code: 'SERVER.ERR',
    });
  }

  // public doListMailBoxEntities(param: queryMailBoxParam, noCache?: boolean): Promise<MailEntryModel[] | MailModelEntries> {
  //   return this.listMailBoxEntitiesInternal(param, noCache).then(res => {
  //     const entry = Array.isArray(res) ? res : res.data;
  //     this.saveMails(entry).then();
  //     return res;
  //   });
  // }
  public doListMailBoxEntities(param: queryMailBoxParam, noCache?: boolean): Promise<MailEntryModel[] | MailModelEntries> {
    if (!param) {
      return Promise.reject(new Error('需要传入查询参数'));
    }
    const targetActions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account: param._account,
    })?.val;
    if (param.id && targetActions.mailBoxDic && targetActions.mailBoxDic[param.id as number] && targetActions.mailBoxDic[param.id as number].locked) {
      return Promise.reject(ErrResult.FA_NEED_AUTH2);
    }
    if (process.env.BUILD_ISEDM && param.checkType === 'checkCustomerMail') {
      return this.listCustomerMailEntry(param, noCache);
    }
    if (process.env.BUILD_ISEDM && param.checkType === 'checkSubordinateMail') {
      return this.listSubordinateMailEntry(param, noCache);
    }
    // const idCheck = !!param.mids;
    if (!param.checkType || ['normal', 'checkStarMail'].includes(param.checkType)) {
      return this.listCommonMailEntry(param, noCache);
    }
    if (param.checkType === 'checkThread') {
      // 挂载账号不支持聚合模式
      param._account = undefined;
      return this.listThreadMailEntry(param, noCache);
    }
    // TODO: 180后不走此逻辑了，得空了把这个分支删除 @周昊
    if (param.checkType === 'checkThreadDetail') {
      return this.getThreadMailDetails(param, noCache);
    }
    if (param.checkType === 'checkRelatedMail') {
      return this.getRelatedMail(param, noCache);
    }
    throw new Error('unknown error');
  }

  public getThreadMailContentFromNetwork(
    threadId: string[],
    params?: queryThreadMailDetailParam,
    noCache?: boolean,
    _account?: string
  ): Promise<MailEntryModel[] | MailModelEntries> {
    const url = this.buildUrl('threadMailInfoDetail', undefined, undefined, _account);
    const req: RequestThreadMailDetailEntry = this.buildThreadMailContentReq(threadId, params);
    return this.impl
      .post(url, req, {
        url,
        cachePolicy: 'noCache',
        noEnqueue: noCache,
        contentType: 'json',
        _account,
      })
      .then(res => {
        const isCorpMail = this.systemApi.getIsCorpMailMode();
        if (isCorpMail) {
          corpMailUtils.corpMailTransformResponse(res);
        }
        return res;
      })
      .then(res => {
        const data = res.data as ThreadDetailEntryResponse;
        if (data.code === MailAbstractHandler.sOk && data.var) {
          return {
            d: data.var,
            t: data.total,
          };
        }
        if (data.code === 'FA_NEED_AUTH2') {
          return Promise.reject(ErrResult.FA_NEED_AUTH2);
        }
        return Promise.reject(this.getErrMsg(data.code));
      })
      .then(async (res: ResponseThreadDetailEntryModelWithTotal) => {
        if (res.d && res.d.length > 0) {
          const responseMailListEntry: ResponseMailEntryModelWithTotal = {
            t: res.t,
            d: this.handleThreadMailDetailEntryModel(res.d),
          };
          return this.handleListMailBoxEntities(req, responseMailListEntry, {
            count: req.limit,
            _account,
          }).then(res => setMailListAttSource(res, 'list'));
        }
        return [];
      });
  }

  buildThreadMailContentReq(threadId: string[], params?: queryThreadMailDetailParam): Required<RequestThreadMailDetailEntry> {
    return {
      ids: [...new Set(threadId.map(v => v.split('--')[0]))],
      summaryWindowSize: params && params.summaryWindowSize ? params.summaryWindowSize : params?.limit || 50, // 返回摘要的邮件数
      order: params && params.order ? params.order : 'date', // 排序字段,目前只有时间
      desc: params && params.desc !== undefined ? params.desc : false, // 是否为逆序
      returnTag: params && params.returnTag !== undefined ? params.returnTag : true, // 是否返回邮件的tag
      returnTotal: params && params.returnTotal !== undefined ? params.returnTotal : true, // 是否返回总数
      start: params?.start || 0,
      limit: params?.limit || 3000,
      // 为 true 时会话id支持多个最多限制 100，为 false 时，会话列表只支持1个；如果不满足,服务端会返回参数不合法
      returnConvInfo: params?.returnConvInfo !== undefined ? params.returnConvInfo : threadId.length > 1,
    };
  }

  getRelatedMail(
    param: queryMailBoxParam,
    // eslint-disable-next-line no-unused-vars
    _noCache: boolean | undefined
  ): Promise<MailModelEntries> {
    if (!param) {
      return Promise.reject(new Error('参数不合法'));
    }
    // if (noCache) {
    // }
    const currentUser = this.systemApi.getCurrentUser(param._account);
    if (!currentUser) {
      return Promise.reject(new Error('未登录？'));
    }
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    // 一般 非corp
    if (!isCorpMail) {
      return this.listCommonMailEntry(param, _noCache).then(res => res as MailModelEntries);
    }
    const url = this.impl.buildUrl(this.systemApi.getUrl('corpExchangeMails'), { sid: currentUser.sessionId });
    const emailList = [];
    if (param.relatedEmail) {
      emailList.push(...param.relatedEmail);
    }
    const flagVar = param.status === 'redFlag' ? 'FLAG' : param.status;
    const companyId = currentUser?.prop?.companyId;
    const emailCategory = param.status ? flagVar : 'ALL';
    const timestamp = param.startDate && param.startDate.length > 0 ? param.startDate : util.dateFormat(Date.now());
    const pageSize = param.count;

    const commonParams = {
      timestamp,
      offset: 0,
    };

    const reqParams = isCorpMail
      ? {
          companyId,
          contactList: emailList,
          emailCategory,
          pageSize,
        }
      : {
          company_id: currentUser?.prop?.companyId,
          contact_list: emailList,
          page_size: pageSize,
          email_category: emailCategory,
        };

    return this.impl
      .post(url, { ...commonParams, ...reqParams }, { contentType: 'json', _account: param._account })
      .then((res: ApiResponse<ResponseRelatedMail>) => {
        console.log('[mail] related mail return from network :', res);
        if (isCorpMail) {
          corpMailUtils.corpMailTransformResponse(res);
        }
        if (res.data?.success) {
          const rs: ResponseMailListEntry[] | undefined = res.data.data?.emailInfoList;
          if (rs) {
            const prItems: MailEntryProcessingItem[] = rs.map(item => this.contactHandler.mapMailEntryToProcessingItem(item, item.id));
            return this.contactHandler.handleContactList(prItems).then((data: MailEntryProcessingItem[]) => {
              const ret: MailEntryModel[] = [];
              data.forEach(item => {
                const receiver = item.receiver && item.receiver.length > 0 ? item.receiver : this.contactHandler.buildEmptyContact(true);
                const sender = item.sender && item.sender.length > 0 ? item.sender : this.contactHandler.buildEmptyContact(false);
                // if (param.checkType && param.checkType  ==='checkThread') {
                //   item.receiver.push(item.sender[0]);
                // }
                item.attachments?.forEach((it: ResponseAttachment) => {
                  it._account = param._account;
                });
                const attachment = this.handleAttachment(item.attachments, item.id);
                ret.push({
                  id: item.id,
                  entry: {
                    folder: item.fid || 0,
                    top: item.flags?.top,
                    system: item.flags?.system || false,
                    popRead: item.flags?.popRead || false,
                    rcptSucceed: item.flags?.rcptSucceed || false,
                    rcptFailed: item.flags?.rcptFailed || false,
                    title: item.subject,
                    sendTime: item.sentDate,
                    receiveTime: item.receivedDate,
                    mark: item.label0 === 1 ? 'redFlag' : 'none',
                    attachmentCount: item.attachments ? item.attachments.length : 0,
                    attachment,
                    readStatus: item.flags?.read ? 'read' : 'unread',
                    brief: item.summary,
                    replayed: item.flags?.replied,
                    forwarded: item.flags?.forwarded,
                    isDraft: item.flags?.draft,
                    isIcs: attachment?.some(it => it.fileType === 'ics'),
                    canRecall: item.recallable,
                    // tags: [],
                    id: item.id,
                    memo: item.memo,
                    content: {
                      content: '',
                      contentId: '',
                    },
                    threadMessageIds: item.threadMessageIds,
                    threadMessageCount: item.threadMessageIds?.length || item.threadMessageCount || 0,
                    rclStatus: item.rclStatus,
                    sndStatus: item.sndStatus,
                    sentMailId: item.sentMailId,
                    // requestReadReceipt: item.requestReadReceipt,
                    suspiciousSpam: !!item.flags?.suspiciousSpam,
                  },
                  receiver,
                  isOneRcpt: item.composeExtra?.showOneRcpt,
                  senders: sender && sender.length > 0 ? sender : undefined,
                  sender: lodashGet(item, 'sender.0', {}) as MailBoxEntryContactInfoModel,
                  totalSize: MailContentHandler.calculateTotalSize(item.attachments),
                  antispamInfo: item.antispamInfo,
                });
              });
              ret.forEach(it => {
                this.makeModelSafe(it);
              });
              return {
                data: ret,
                total: ret.length > 50 ? ret.length * 3 : ret.length,
                index: param.index,
                count: param.count,
                additionalInfo: {
                  startDate: res.data?.data?.timestamp,
                },
                query: param,
              } as MailModelEntries;
            });
          }
        }
        return Promise.reject(res.data?.message);
      })
      .then(res => setMailListAttSource(res, 'list'));
  }

  private getThreadMailDetails(param: queryMailBoxParam, noCache: boolean | undefined) {
    if (!param.mids) {
      return Promise.reject(new Error('需要传入查询参数,mids'));
    }
    return this.listThreadDetails(param.mids, noCache, param._account).then((res: string[]) => {
      if (res && res.length > 0) {
        return this.doListMailBoxEntities(
          {
            count: res.length,
            mids: res,
            returnModel: param.returnModel,
            querySeq: param.querySeq,
            _account: param._account,
          },
          noCache
        );
      }
      return Promise.reject(new Error('无法获取数据'));
    });
  }

  doGetGroupMailStatus(id: string, noCache?: boolean, _account?: string): Promise<MailEntryModel> {
    const promise = this.listThreadDetails([id], noCache, _account);
    return promise
      .then((res: string[]) => this.doListMailBoxEntities({ count: res.length, mids: res, _account }))
      .then(result => MailContentHandler.calThreadMailStatus(result));
  }

  private static calThreadMailStatus(result: MailEntryModel[] | MailModelEntries): MailEntryModel {
    const res = Array.isArray(result) ? (result as MailEntryModel[]) : (result as MailModelEntries).data;
    const re = { ...res[0] };
    re.senders = re.senders ? re.senders : [re.sender];
    const map: StringMap = {};
    const contacts: Set<string> = new Set<string>([re.sender.contactItem.contactItemVal]);
    re.senders?.forEach(it => {
      contacts.add(it.contactItem.contactItemVal);
    });
    re.entry.threadMessageCount = res.length;
    re.tags = Array.from(
      new Set(
        res
          .map(item => item.tags)
          .flat()
          .filter(item => item)
      )
    ) as [];
    if (res && res.length > 1) {
      for (let i = 1; i < res.length; ++i) {
        re.entry.replayed = re.entry.replayed || res[i].entry.replayed;
        re.entry.forwarded = re.entry.forwarded || res[i].entry.forwarded;
        re.entry.readStatus = re.entry.readStatus === 'unread' ? re.entry.readStatus : res[i].entry.readStatus;
        re.entry.mark = re.entry.mark === 'redFlag' ? re.entry.mark : res[i].entry.mark;
        re.entry.isIcs = re.entry.isIcs || res[i].entry.attachment?.some(item => item.fileType === 'ics');
        const { sender } = res[i];
        if (!contacts.has(sender.contactItem.contactItemVal)) {
          re.senders?.push(sender);
          contacts.add(sender.contactItem.contactItemVal);
        }
        res[i].receiver.forEach(it => {
          if (!map[it.contactItem.contactItemVal + it.mailMemberType]) {
            map[it.contactItem.contactItemVal + it.mailMemberType] = '';
            re.receiver.push(it);
          }
        });
      }
    }
    return re;
  }

  listThreadDetails(mids: string[], noCache?: boolean, _account?: string): Promise<string[]> {
    if (!mids) {
      throw new Error('参数错误');
    }
    if (mids.length === 1) {
      const id = mids[0];
      const urlKey = 'threadMailDetail';
      const url = this.buildUrl(urlKey, undefined, undefined, _account);
      const dt = { id };
      return this.impl
        .post(
          url,
          dt,
          this.getConfigForHttp(urlKey, {
            url,
            data: dt,
            method: 'post',
            cachePolicy: noCache ? 'refresh' : undefined,
            _account,
          })
        )
        .then(res => {
          console.log('[mail] return from network:', res);
          const data = res.data as ListEntryResponse;
          const ids: string[] = data.var?.map(it => it.id) || [];

          const targetActions = this.mailApi.getActions({
            actions: this.actions,
            subActions: this.subActions,
            _account,
          })?.val;
          if (targetActions) targetActions.threadMailIdMap[id] = ids;
          return ids;
        });
    }
    const ps: Promise<string[]>[] = mids.map(it => this.listThreadDetails([it], noCache, _account));
    return Promise.all(ps).then((value: string[][]) =>
      value.reduce((ret, cur) => {
        if (cur && cur.length > 0) {
          cur.forEach(it => {
            ret.push(it);
          });
        }
        return ret;
      }, [] as string[])
    );
  }

  doCustomersUnread(param: queryCusterUnreadParam): Promise<CustomerBoxUnread> {
    if (!Array.isArray(param.customerIds) || param.customerIds.length === 0) {
      return Promise.reject(new Error('缺少参数'));
    }
    const req: RequestCustomerMailUnreadEntry = {
      companyIdList: param.customerIds,
      returnAll: param.returnAll === false ? 0 : 1,
    };
    const url = this.systemApi.getUrl('getCustomerMailUnread');
    return this.impl
      .post(url, req, {
        url,
        contentType: 'json',
        cachePolicy: 'noCache',
        noEnqueue: true,
      })
      .then(res => {
        const { data, code } = res.data as CustomerListUnreadResponse;
        if (+code === 0 && data) {
          const customers = Array.isArray(data.customers) ? data.customers : [];
          const items: CustomerUnread[] = customers.map(v => {
            const contacts: CustomerUnreadItem = Array.isArray(v.contacts)
              ? v.contacts.reduce<CustomerUnreadItem>((total, current) => {
                  const { contactId, email, num = 0 } = current;
                  if (!total[contactId]) {
                    total[contactId] = {
                      contactId,
                      email,
                      unread: num,
                      initialized: current.initialized,
                    };
                  } else {
                    total[contactId].unread = num;
                  }
                  return total;
                }, {} as CustomerUnreadItem)
              : {};
            return {
              customerId: v.customerId,
              unread: v.num || 0,
              contacts,
              initialized: v.initialized,
            };
          });
          return {
            total: data.num,
            items,
            initialized: data.initialized,
          };
        }
        return Promise.reject(this.getErrMsg(code));
      });
  }

  doCustomersUnreadTotal(): Promise<CustomerBoxUnread> {
    const url = this.systemApi.getUrl('getCustomerMailUnread');
    const req: RequestCustomerMailTotalUnreadEntry = {
      returnAll: 1,
    };
    return this.impl
      .post(url, req, {
        url,
        contentType: 'json',
        cachePolicy: 'noCache',
        noEnqueue: true,
      })
      .then(res => {
        const { data, code } = res.data as CustomerListUnreadTotalResponse;
        if (+code === 0 && data) {
          return {
            total: data.num || 0,
            initialized: data.initialized,
          };
        }
        return Promise.reject(this.getErrMsg(code));
      });
  }

  private listCustomerMailEntry(param: queryMailBoxParam, noCache?: boolean): Promise<EdmMailModelEntries> {
    const { attrQuery, attrQueryFilter } = param;
    if (!attrQuery || (Array.isArray(attrQuery) && attrQuery.length === 0)) {
      return Promise.reject(new Error('查询客户邮件时缺少 Attr 参数'));
    }
    const queryList = Array.isArray(attrQuery) ? attrQuery : [attrQuery];
    const currentUser = this.systemApi.getCurrentUser();
    if (!currentUser) {
      return Promise.reject(new Error('未登录'));
    }
    const url = this.systemApi.getUrl('getCustomerMail');
    const searchItems: RequestCustomerListMailEntryItem[] = queryList.map(v => ({
      from: v.from || currentUser.id,
      toList: (Array.isArray(v.to) ? v.to : [v.to]).filter(it => !!it),
    }));
    const req: RequestCustomerListMailEntry = {
      searchItems,
      exchangeType: attrQueryFilter?.type || 'all',
      limit: param.count,
      endTime: param.endDate || '',
      mid: param.endMid || '',
    };
    return this.listEdmMailEntry(param, { url, req, noCache }).then(res => setMailListAttSource(res, 'list'));
  }

  private listSubordinateMailEntry(param: queryMailBoxParam, noCache?: boolean): Promise<EdmMailModelEntries> {
    const { attrQuery, attrQueryFilter } = param;
    if (!attrQuery || (Array.isArray(attrQuery) && attrQuery.length === 0)) {
      return Promise.reject(new Error('查询客户邮件时缺少 Attr 参数'));
    }
    const queryList = Array.isArray(attrQuery) ? attrQuery : [attrQuery];
    const currentUser = this.systemApi.getCurrentUser();
    if (!currentUser) {
      return Promise.reject(new Error('未登录'));
    }
    const url = this.systemApi.getUrl('getSubordinateMail');
    const searchItems: RequestSubordinateListMailEntryItem[] = queryList.map(v => ({
      endTime: param.endDate,
      from: v.from || currentUser.id,
      toList: (Array.isArray(v.to) ? v.to : [v.to]).filter(it => !!it),
      limit: param.count,
    }));
    const defaultIds = this.getAllFids().filter(v => edmMailHelper.filterEdmFid(v));
    const req: RequestSubordinateListMailEntry = {
      fids: param.id ? [param.id] : defaultIds,
      searchItems,
      exchangeType: attrQueryFilter?.type || 'all',
    };
    return this.listEdmMailEntry(param, { url, req, noCache }).then(res => {
      const result = this.subordinateAddMailFrom(res);
      return setMailListAttSource(result, 'list');
    });
  }

  // 下属邮件列表接口返回，添加mailFrom
  subordinateAddMailFrom(res: EdmMailModelEntries): EdmMailModelEntries {
    if (res.data && res.data.length) {
      res.data = res.data.map(mail => {
        mail.mailFrom = 'subordinate';
        return mail;
      });
    }
    return res;
  }

  listEdmMailEntry(param: queryMailBoxParam, conf: { url: string; req: any; noCache?: boolean }): Promise<EdmMailModelEntries> {
    param.returnModel = true;
    const { url, req, noCache } = conf;
    let over = false;
    return this.impl
      .post(url, req, {
        url,
        contentType: 'json',
        cachePolicy: noCache ? 'noCache' : undefined,
        noEnqueue: noCache,
      })
      .then(res => {
        const { data, code } = res.data as CustomerListEntryResponse;
        if (+code === 0 && data) {
          over = data.over;
          if (data.emailInfos) {
            const deleteInfo = param.checkType === 'checkCustomerMail' ? data.notPartner : data.notColleague;
            if (Array.isArray(deleteInfo) && deleteInfo.length > 0) {
              console.warn('[listCustomerMailEntry] no permission', deleteInfo);
              this.mailDbHandler.deleteTpMailsByOwner(deleteInfo).then();
            }
            return {
              d: data.emailInfos,
              t: data.emailInfos.length === 0 ? 0 : data.emailInfos.length,
            };
          }
          return {
            d: [],
            t: 0,
          };
        }
        return Promise.reject(this.getErrMsg(code));
      })
      .then(
        (res: ResponseMailEntryModelWithTotal) =>
          this.handleListMailBoxEntities(
            {
              ...req,
              start: 0,
              limit: param.count,
              summaryWindowSize: param.count,
            },
            res,
            param
          ) as Promise<MailModelEntries>
      )
      .then(res => ({
        ...res,
        over,
      }));
  }

  async listCustomerMailEntryById(
    param: SyncTpMailParamItem[],
    checkType: queryMailBoxParam['checkType'] = 'checkCustomerMail'
  ): Promise<MailEntryModel[] | MailModelEntries> {
    const count = param.reduce((t, v) => t + v.mids.length, 0);
    const url = this.systemApi.getUrl('checkTpMailExist');
    const req = {
      emails: param,
    };
    return this.impl
      .post(url, req, {
        url,
        contentType: 'json',
      })
      .then(res => {
        const { data, code } = res.data as CheckTpMailResponse;
        if (+code === 0 && data && Array.isArray(data?.emailInfos)) {
          return {
            d: data.emailInfos,
            t: data.emailInfos.length === 0 ? 0 : data.emailInfos.length,
          };
        }
        return Promise.reject(this.getErrMsg(code));
      })
      .then((res: ResponseMailEntryModelWithTotal) =>
        this.handleListMailBoxEntities(
          {
            start: 0,
            limit: count,
            summaryWindowSize: count,
          },
          res,
          { checkType, count, noContactRace: true }
        )
      )
      .then((res: MailEntryModel[] | MailModelEntries) => {
        const oldData = Array.isArray(res) ? res : res.data;
        oldData.forEach(v => {
          v.isTpMail = true;
        });
        return res;
      });
  }

  private async listCommonMailEntry(param: queryMailBoxParam, noCache?: boolean): Promise<MailEntryModel[] | MailModelEntries> {
    if (param.mids && param.mids.length > 100) {
      const params: queryMailBoxParam[] = [];
      const max = param.mids.length < 2000 ? param.mids.length : 2000;
      for (let i = 0; i * 100 < max; ++i) {
        params.push({ ...param, mids: param.mids.slice(i * 100, i * 100 + 99) });
      }
      const promises: Promise<MailEntryModel[]>[] = params.map(it =>
        this.listCommonMailEntry(it, noCache).then(result => (Array.isArray(result) ? (result as MailEntryModel[]) : (result as MailModelEntries).data))
      );
      return Promise.all(promises)
        .then((res: MailEntryModel[][]) => {
          const mailEntryModels = res.reduce((current, item) => {
            item.forEach(it => {
              current.push(it);
            });
            return current;
          }, [] as MailEntryModel[]);
          if (param.returnModel) {
            return {
              data: mailEntryModels,
              total: mailEntryModels.length,
              index: 0,
              count: mailEntryModels.length,
              query: param,
            } as MailModelEntries;
          }
          return mailEntryModels;
        })
        .then(res => setMailListAttSource(res, 'list'));
    }
    if ((param.mids && param.mids.length <= 100) || !param.mids) {
      if (param.mids && param.mids.length === 0) {
        return Promise.resolve(param.returnModel ? ({ data: [] as MailEntryModel[], total: 0 } as MailModelEntries) : ([] as MailEntryModel[]));
      }

      const urlKey = MailContentHandler.getListMailBoxEntryUrl(param);
      const additionalParam = param._account ? this.getAccountSession(param._account) : undefined;
      const url = this.buildUrl(urlKey, additionalParam, !!additionalParam?._session, param._account);
      // const req: RequestListMailEntry | { ids: string[] } = idCheck ? {ids: param.mids || []} : this.buildListEntryReq(param);
      // TODO 不同接口的sentDate字段类型不一致
      const req: RequestListMailEntry = await this.buildListEntryReq(param);
      // if (idCheck) {
      // req.ignoreContact = ignoreContact;
      // }
      param.addSentContent = !param.mids && param.id === mailBoxOfSent.id;
      // noCache = noCache ?noCache: (param.mids && param.mids.length > 20);
      const cacheInfo = 'noCache';
      const cachePolicy = noCache ? cacheInfo : undefined;
      return this.impl
        .post(
          url,
          req,
          this.getConfigForHttp(urlKey, {
            url,
            data: req,
            method: 'post',
            responseType: 'text',
            expectedResponseType: 'json',
            cachePolicy,
            noEnqueue: noCache,
            _account: param?._account,
          })
        )
        .then(res => {
          // if (param.querySeq && param.querySeq != this.actions.curMailListReqSeq) {
          //   console.warn('mail list request refreshed and this request is not accepted', param, this.actions.curMailListReqSeq);
          //   return Promise.reject(ErrResult['REQUEST.EXPIRED']);
          // }
          const isCorpMail = this.systemApi.getIsCorpMailMode();
          if (isCorpMail) {
            corpMailUtils.corpMailTransformResponse(res);
          }
          console.log('[mail] return from network:', res);
          const data = res.data as ListEntryResponse;
          if (data.code === MailAbstractHandler.sOk && data.var) {
            // this.handleCacheStatus(res);

            return {
              d: data.var,
              t: data.total,
              b: data.building === true ? 1 : 0,
            };
          }
          if (data.code === 'FA_NEED_AUTH2') {
            return Promise.reject(ErrResult.FA_NEED_AUTH2);
          }
          return Promise.reject(this.getErrMsg(data.code));
        })
        .then((res: ResponseMailEntryModelWithTotal) =>
          this.handleListMailBoxEntities(
            req,
            res,
            // !param.mids && param.id  ===mailBoxOfSent.id,
            param
          )
        );
    }
    throw new Error('请求过于庞大，请稍后再试');
  }

  private async listThreadMailEntry(param: queryMailBoxParam, noCache?: boolean): Promise<MailEntryModel[] | MailModelEntries> {
    const url = this.buildUrl('threadMailList');
    const req: RequestThreadListMailEntry = await this.buildThreadListEntryReq(param);
    return this.impl
      .post(url, req, {
        url,
        cachePolicy: 'noCache',
        noEnqueue: noCache,
        contentType: 'json',
      })
      .then(res => {
        const isCorpMail = this.systemApi.getIsCorpMailMode();
        if (isCorpMail) {
          corpMailUtils.corpMailTransformResponse(res);
        }
        return res;
      })
      .then(res => {
        const data = res.data as ThreadListEntryResponse;
        if (data.code === MailAbstractHandler.sOk && data.var) {
          return {
            d: data.var,
            t: data.total,
            b: data.building ? 1 : 0,
          };
        }
        if (data.code === 'FA_NEED_AUTH2') {
          return Promise.reject(ErrResult.FA_NEED_AUTH2);
        }
        return Promise.reject(this.getErrMsg(data.code));
      })
      .then((res: ResponseThreadMailEntryModelWithTotal) => {
        const responseMailListEntry: ResponseMailEntryModelWithTotal = {
          t: res.t,
          d: this.handleThreadMailEntryModel(res.d),
          b: res.b,
        };
        return this.handleListMailBoxEntities(req, responseMailListEntry, param).then(res => setMailListAttSource(res, 'list'));
      });
  }

  private handleThreadMailEntryModel(data: ResponseThreadMailListEntry[]): ResponseMailListEntry[] {
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    return data.map(v => {
      const cid = v.convId ? String(v.convId) : v.id;
      const mid = isCorpMail ? v.id : cid;
      return {
        isThread: !!v.convId,
        id: mid,
        convFids: Array.isArray(v.convFids) ? v.convFids : undefined,
        threadId: isCorpMail ? v.id : String(v.convId),
        threadMessageFirstId: v.id,
        threadMessageCount: v.threadMessageCount || 0,
        threadMessageIds: Array.isArray(v.threadMessageIds) ? v.threadMessageIds : [],
        attachments: Array.isArray(v.attachments) ? v.attachments : [],
        subject: v.subject,
        priority: v.priority,
        from: typeof v.from === 'string' ? v.from.split(',') : v.from,
        to: v.to,
        cc: Array.isArray(v.cc) ? v.cc : [],
        bcc: Array.isArray(v.bcc) ? v.bcc : [],
        replyTo: Array.isArray(v.replyTo) ? v.replyTo : [],
        flags: v.flags,
        memo: v.memo,
        fid: v.fid,
        summary: v.summary,
        backgroundColor: v.backgroundColor,
        antiVirusStatus: v.antiVirusStatus,
        label0: v.label0,
        size: v.size,
        encpwd: v.encpwd,
        recallable: v.recallable,
        modifiedDate: v.modifiedDate || '',
        tag: v.tag,
        sentDate: v.sentDate || '',
        receivedDate: v.receivedDate || '',
        tid: v.tid,
        eTeamType: v.eTeamType || 0,
        suspiciousSpam: !!v.flags?.suspiciousSpam,
      };
    });
  }

  private handleThreadMailDetailEntryModel(data: ResponseThreadMailDetailEntry[]): ResponseMailListEntry[] {
    return data.map(v => ({
      isThread: !!v.convId,
      id: v.convId ? String(v.convId) : v.id,
      convFids: Array.isArray(v.convFids) ? v.convFids : undefined,
      threadId: v.convId ? String(v.convId) : undefined,
      threadMessageCount: v.threadMessageCount || undefined,
      threadMessageIds: Array.isArray(v.threadMessageIds) ? v.threadMessageIds : undefined,
      attachments: Array.isArray(v.attachments) ? v.attachments : [],
      subject: v.subject,
      priority: v.priority,
      from: v.from,
      to: v.to,
      cc: Array.isArray(v.cc) ? v.cc : [],
      bcc: Array.isArray(v.bcc) ? v.bcc : [],
      replyTo: Array.isArray(v.replyTo) ? v.replyTo : [],
      flags: v.flags,
      memo: v.memo,
      fid: v.fid,
      summary: v.summary,
      backgroundColor: v.backgroundColor,
      antiVirusStatus: v.antiVirusStatus,
      label0: v.label0,
      size: v.size,
      encpwd: v.encpwd,
      recallable: v.recallable,
      modifiedDate: v.modifiedDate || '',
      tag: v.tag,
      sentDate: v.sentDate || '',
      sentMailId: v.sentMailId || '',
      receivedDate: v.receivedDate || '',
      taskId: v.taskId,
      tid: v.tid,
      eTeamType: v.eTeamType || 0,
      suspiciousSpam: !!v.flags?.suspiciousSpam,
    }));
  }

  /**
   * 该方法目前其实没用了,原功能是记录了每次请求的最后一个mailEntry，但由于实在难以维护，记录的数据已经放弃使用
   * @param req
   * @param result
   * @private
   */
  private setupLastMailBoxEntry(req: RequestListMailEntry, result: MailEntryModel) {
    if (result && req && req.fid && req.start === 0 && !req.ids && !req.filter?.label0 && !req.filter?.flags && !req.filter?.read) {
      // const dt = res.config.data as RequestListMailEntry;
      // if (req && dt.fid) {
      const targetActions = this.mailApi.getActions({
        actions: this.actions,
        subActions: this.subActions,
        _account: result._account,
      })?.val;
      const confs = targetActions?.mailBoxDic;
      if (confs && typeof req.fid === 'number' && Object.prototype.hasOwnProperty.call(confs, Number(req.fid)) && confs[Number(req.fid)]) {
        const item = confs[req.fid];
        // const result = res.data?.var;
        item.latestMailEntry = result;
      }
      // }
    }
  }

  handleListMailBoxEntities(
    req: RequestListMailEntry,
    result: ResponseMailEntryModelWithTotal,
    param: queryMailBoxParam,
    search?: string
  ): Promise<MailEntryModel[] | MailModelEntries> {
    const res = result.d;
    const { _account } = param;
    const prItems: MailEntryProcessingItem[] = res.map(item => this.contactHandler.mapMailEntryToProcessingItem(item, item.id));
    if (param.ignoreContact || res.length === 0) {
      return Promise.resolve(
        this.handleEntryListRet({
          req,
          data: prItems,
          param,
          total: result.t,
          search,
          building: result.b,
        })
      );
    }
    return this.contactHandler
      .handleContactList(prItems, param.noContactRace, _account)
      .then((contactRs: MailEntryProcessingItem[]) =>
        this.handleEntryListRet({
          req,
          data: contactRs,
          param,
          total: result.t,
          search,
          building: result.b,
        })
      )
      .catch(reason => {
        console.log('[mail] mail entry get contact error:', reason);
        return this.handleEntryListRet({
          req,
          data: prItems,
          param,
          total: result.t,
          search,
          building: result.b,
        });
      });
  }

  private handleEntryListRet(conf: {
    req: RequestListMailEntry;
    data: MailEntryProcessingItem[];
    param: queryMailBoxParam;
    total: number;
    search?: string;
    building?: number;
  }): MailEntryModel[] | MailModelEntries {
    const { req, data, param, total, search, building } = conf;
    const { _account } = param || {};
    const ret: MailEntryModel[] = [];
    if (search) {
      this.modelHandler.checkAllFailToSendMails(param, ret, search);
    }
    const user = this.systemApi.getCurrentUser(_account);
    data.forEach(item => {
      const receiver = item.receiver && item.receiver.length > 0 ? item.receiver : this.contactHandler.buildEmptyContact(true);
      const sender = item.sender && item.sender.length > 0 ? item.sender : this.contactHandler.buildEmptyContact(false);
      // if (param.checkType && param.checkType  ==='checkThread') {
      //   item.receiver.push(item.sender[0]);
      // }
      const isTpMail = !!item.owner && user?.id !== item.owner;
      // const attachment = this.handleAttachment(item.attachments, item.id);
      item.attachments?.forEach((it: ResponseAttachment) => {
        it._account = _account;
      });
      const attachment = this.handleAttachment(item.attachments, item.id, {
        isTpMail,
        owner: item.owner,
        tid: item.tid,
      });
      const isEncryptedMail = attachment ? getIsEncryptedMail(attachment) : false;
      ret.push({
        isThread: !!item.isThread,
        threadId: item.threadId ? item.threadId : '',
        id: item.isThread && item.threadId ? item.threadId : item.id,
        convFids: item.isThread && Array.isArray(item.convFids) ? item.convFids : undefined,
        _account: user?.id,
        entry: {
          folder: item.fid || 0,
          top: item.flags?.top,
          system: item.flags?.system || false,
          popRead: item.flags?.popRead || false,
          rcptSucceed: item.flags?.rcptSucceed || false,
          rcptFailed: item.flags?.rcptFailed || false,
          title: this.htmlApi.encodeHtml(item.subject),
          sendTime: item.sentDate,
          receiveTime: item.receivedDate,
          mark: item.label0 === 1 ? 'redFlag' : 'none',
          attachmentCount: item.attachments ? item.attachments.length : 0,
          attachment,
          readStatus: item.flags?.read ? 'read' : 'unread',
          brief: item.summary ? this.htmlApi.encodeHtml(item.summary) : undefined,
          replayed: item.flags?.replied,
          forwarded: item.flags?.forwarded,
          directForwarded: item.flags?.directForwarded,
          isDraft: item.flags?.draft,
          isIcs: attachment?.some(it => it?.fileType === 'ics'),
          canRecall: item.recallable,
          // tags: [],
          id: item.id,
          memo: item.memo,
          content: {
            content: '',
            contentId: '',
          },
          threadMessageFirstId: item.isThread && item.threadMessageFirstId ? item.threadMessageFirstId : undefined,
          threadMessageIds: item.isThread && item.threadMessageIds ? item.threadMessageIds : undefined,
          threadMessageCount: item.isThread && item.threadMessageCount ? item.threadMessageCount : 0,
          rclStatus: item.rclStatus,
          sndStatus: item.sndStatus,
          isScheduleSend: item.flags?.scheduleDelivery || false,
          priority: item.priority,
          tid: item.tid,
          rcptCount: item.rcptCount,
          readCount: item.readCount,
          innerCount: item.innerCount,
          innerRead: item.innerRead,
          preferred: item.preferred === 0 ? 0 : 1,
          praiseId: item.praiseId ? item.praiseId : undefined,
          sentMailId: item.sentMailId,
          requestReadReceipt: item.requestReadReceipt,
          langType: item.langType || '',
          langListMap: item.langListMap || {},
          eTeamType: item.eTeamType || 0,
          isDefer: !!item.flags?.deferHandle,
          deferTime: item.flags?.deferHandle ? item.defer || '2200-01-01 00:00:00' : undefined,
          deferNotice: item.deferNotice,
          linkAttached: !!item.flags?.linkAttached, // 服务端返回是否包含云附件
          suspiciousSpam: !!item.flags?.suspiciousSpam,
          encpwd: item.encpwd || '',
        },
        receiver,
        isOneRcpt: item.composeExtra?.showOneRcpt,
        senders: sender && sender.length > 0 ? sender : undefined,
        sender: lodashGet(item, 'sender.0', {}) as MailBoxEntryContactInfoModel,
        totalSize: MailContentHandler.calculateTotalSize(item.attachments),
        tags: item?.tag, // ? item.tag.filter(tag => tag && !tag.startsWith('%st') && !tag.endsWith('%')) : [],
        taskId: item?.taskId,
        isTpMail,
        owner: item.owner,
        size: item.size,
        isEncryptedMail,
      });
    });
    ret.forEach(it => {
      this.makeModelSafe(it);
    });
    this.setupLastMailBoxEntry(req, ret[0]);
    if (param.returnModel) {
      return {
        data: ret,
        total,
        index: param.index,
        count: param.count,
        query: param,
        building,
      } as MailModelEntries;
    }
    return ret;
  }

  private static getListMailBoxEntryUrl(param: queryMailBoxParam): keyof MethodMap {
    if (param.checkType && param.checkType === 'checkThread') {
      return 'threadMail';
    }
    if (param.checkType && param.checkType === 'checkThreadDetail') {
      return 'threadMailDetail';
    }
    return param.mids ? 'getContentByIds' : 'listItem';
  }

  // eslint-disable-next-line max-statements
  private async buildListEntryReq(param: queryMailBoxParam): Promise<RequestListMailEntry> {
    const target: Partial<RequestListMailEntry> = {
      // start: param.index,
      limit: param.count,
      summaryWindowSize: param.count,
      filter: param.filter || {},
    };
    if (param.tag) {
      target.tag = param.tag;
      // 按标签划分不包含垃圾邮件与已删除文件
      target.fids = this.getFids(true, param._account)?.filter((id: number) => id !== 4 && id !== 5);
      target.skipLockedFolders = true;
    }
    if (param.startId) {
      target.offsetmid = param.startId;
    }
    if (param.index) {
      target.start = param.index;
    }
    if (param.topFlag) {
      target.topFlag = param.topFlag;
    }
    if (param.id === mailBoxOfDefer.id) {
      delete target.fid;
      target.desc = false;
      target.order = 'deferredDate';
      target.filter = {
        ...target.filter,
        defer: param.filter?.defer || ':22000101',
      };
      target.skipLockedFolders = true;
    }
    // 排序
    if (param.order) {
      target.order = param.order;
      target.desc = !!param.desc;
      if (param.filter?.sentDate) {
        target.filter = {
          ...target.filter,
          sentDate: `${param.filter?.sentDate[0].replace(/-/g, '')}:${param.filter?.sentDate[1].replace(/-/g, '')}`,
        };
      }
    }
    if (param.mids && param.mids.length > 0) {
      if (!param.checkType || param.checkType === 'normal') {
        target.ids = param.mids.filter(it => !it.endsWith('-tmp'));
      } else if (param.checkType && param.checkType === 'checkThreadDetail') {
        target.id = param.mids[0];
      }
    }
    if (param.checkType === 'checkThread') {
      target.mode = param.mode || 'listid';
    }
    if (!param.mids || param.mids.length === 0) {
      let checkRed = false;
      if (param.ids && param.ids.length > 0) {
        target.fids = param.ids.filter(it => it > 0);
      } else if (param.id && param.id > 0) {
        target.fid = param.id as number;
      } else if (param.id === mailBoxOfRdFlag.id) {
        target.fids = this.getFids(true, param._account)?.filter((id: number) => id !== 4);
        target.filter = Object.assign(target.filter, {
          label0: 1,
        });
        checkRed = true;
      } else if (param.id === mailBoxOfUnread.id) {
        target.fids = this.getFids(false, param._account)?.filter((id: number) => id > 0 && id !== 4 && id !== 5 && id !== 2);
        target.filter = Object.assign(target.filter, {
          flags: { ...target?.filter?.flags, read: false },
        });
        checkRed = true;
      } else if (param.checkType === 'checkStarMail') {
        // 星标联系人
        if (!param.attrConf) {
          const attrConf = await this.modelHandler.doGetStarContactQuery(param.id);
          param.attrConf = {
            ...attrConf,
            attrType: 'star',
          };
        }
        const { emailList } = param.attrConf;
        if (emailList.length > 0) {
          target.filter = Object.assign(target.filter, {
            starredWithAddress: [...new Set(emailList)],
            selfSend: null,
          });
          // target.fids = this.getAllFids().filter(v => !mailBoxOfFilterStar[v]);
          if (param.attrQueryFilter) {
            target.filter = Object.assign(target.filter, {
              selfSend: param.attrQueryFilter.type === 'send',
            });
          }
        }
        target.skipLockedFolders = true;
        if (param.filter?.read !== undefined) {
          target.filter = Object.assign(target.filter, {
            flags: { read: param.filter?.read },
          });
        }
      }
      if (checkRed) {
        target.skipLockedFolders = true;
      }
      // 往来邮件
      if (param.checkType === 'checkRelatedMail') {
        target.skipLockedFolders = true;
        // 关联邮件
        // eslint-disable-next-line no-unused-expressions
        if (param.relatedEmail) {
          target.filter = Object.assign(target.filter, {
            chatWithAddress: [...param.relatedEmail],
          });
        }
      }
      if (param.status) {
        switch (param.status) {
          case 'spam':
            break;
          case 'redFlag':
            if (!checkRed) {
              // 往来附件使用flagged而不是label0
              const extraFilter = param.checkType === 'checkRelatedMail' ? { flags: { flagged: true } } : { label0: 1 };
              target.filter = Object.assign(target.filter, extraFilter);
            }
            break;
          case 'read':
            target.filter = Object.assign(target.filter, {
              read: true,
            });
            break;
          case 'unread':
            target.filter = Object.assign(target.filter, {
              read: false,
            });
            break;
          // 我发出的
          case 'SENT':
            target.filter = Object.assign(target.filter, {
              selfSend: true,
            });
            break;
          // 我收到的
          case 'RECEIVED':
            target.filter = Object.assign(target.filter, {
              selfSend: false,
            });
            break;
          // 带附件的
          case 'ATTACHMENT':
            target.filter = Object.assign(target.filter, {
              flags: { attached: true },
            });
            break;
          default:
            break;
        }
      }
    }
    return { ...MailAbstractHandler.defaultRequestListMailEntry, ...target };
  }

  private async buildThreadListEntryReq(param: queryMailBoxParam): Promise<RequestThreadListMailEntry> {
    const initTarget: RequestListMailEntry = await this.buildListEntryReq(param);
    const target: Partial<RequestThreadListMailEntry> = {
      // eslint-disable-next-line no-nested-ternary
      fids: Array.isArray(initTarget.fids) ? initTarget.fids : ((initTarget.fid ? [initTarget.fid] : []) as number[]),
      topFlag: initTarget.topFlag,
      returnTag: initTarget.returnTag,
      start: initTarget.start,
      limit: Math.min(512, initTarget.limit),
      summaryWindowSize: initTarget.summaryWindowSize,
      skipLockedFolders: initTarget.skipLockedFolders,
      returnAttachments: initTarget.returnAttachments,
      tag: initTarget.tag,
      mode: initTarget.mode || 'count',
      returnTotal: initTarget.returnTotal,
      returnTid: true,
      filterFlags: {
        read: initTarget.filter?.flags?.read,
        label0: initTarget.filter?.label0,
      },
    };
    return { ...MailAbstractHandler.defaultRequestListMailEntry, ...target };
  }

  private getFids(needlockedFid = true, _account?: string) {
    const targetActions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    if (needlockedFid) {
      return targetActions?.mailBoxOriginData?.map((it: ResponseFolderDef) => it.id);
    }
    return targetActions?.mailBoxOriginData?.filter((it: ResponseFolderDef) => !it?.auth2Locked).map((it: ResponseFolderDef) => it.id);
  }

  buildEmptyMailEntryModel(param: WriteMailInitModelParams, noStore?: boolean) {
    const { id, asAttachIds, _account, owner } = param;
    const uniqueId = id;
    const mailContentModel: MailEntryModel = {
      id: uniqueId || '',
      entry: {
        folder: 0,
        top: false,
        system: false,
        popRead: false,
        rcptSucceed: false,
        rcptFailed: false,
        withoutPlaceholder: param.withoutPlaceholder,
        title: param.title || '',
        sendTime: '',
        receiveTime: '',
        mark: 'none',
        attachmentCount: 0,
        attachment: [],
        readStatus: 'read',
        brief: '',
        id: uniqueId || '',
        asAttachIds,
        replayed: false,
        forwarded: false,
        isDraft: param.mailType && param.mailType === 'draft',
        isIcs: false,
        writeLetterProp: param && param.writeType,
        canRecall: false,
        threadMessageCount: 0,
        content: {
          content: this.buildInitContent(param),
          contentId: '',
        },
        memo: '',
      },
      extraOperate: param.extraOperate || '',
      receiver: [],
      sender: this.contactHandler.buildRawContactItem(undefined, _account),
      totalSize: 0,
      tags: [],
      headers: {},
      mailFormClickWriteMail: param.mailFormClickWriteMail,
      _account: param._account,
      owner,
    };
    if (noStore) {
      return mailContentModel;
    }
    return this.modelHandler.updateLocalContent(mailContentModel);
  }

  private testContentChange(origin: MailEntryModel, content: MailEntryModel) {
    // const { attachment } = origin.entry;
    // if (attachment && attachment.length > 0) {
    //   // for (const it of attachment) {
    //   //   if (!it.deleted && it.idFilled) {
    //   //     return true;
    //   //   }
    //   // }
    //   const flag = attachment.reduce((
    //     b: boolean,
    //     it: MailFileAttachModel,
    //   ) => b || (
    //     !!it && !it.deleted && it.idFilled
    //   ) || false, false);
    //   if (flag) {
    //     return flag;
    //   }
    // }
    if (origin.newUploadedAttachment && origin.newUploadedAttachment > 0) {
      return true;
    }
    return this.modelHandler.compare(origin, content) !== 0;
  }

  public async doNeedSaveTemp(curCont: MailEntryModel): Promise<boolean> {
    const { id, cid, draftId } = curCont;
    if (!cid || !draftId) return true;
    const content = cloneDeep(curCont); // 深拷贝是为了解决content.entry.content.content赋值报readonly问题
    content.entry.content.content = this.modelHandler.getTransferHtml(content.entry.content, 'draftCompare'); // content初始化被Transfer，所以diff的时候需要Transfer还原

    try {
      const origin = await this.doGetMailContent(id);
      if (!origin) return true;
      const ret = this.testContentChange(origin, content);
      console.log('retret', ret);
      return ret;
    } catch (error) {
      console.log('对比失败', error);
      return true;
    }
  }

  handleAttachmentType(contentType: string | undefined, fileName: string): FileType {
    return this.fileApi.judgeFileType(contentType, fileName);
  }

  private static calculateTotalSize(attachments: ResponseAttachment[]) {
    let ret = 0;
    if (attachments && attachments.length > 0) {
      // for (let item of attachments) {
      //   ret += item.contentLength;
      // }
      ret = attachments.reduce((val: number, it: ResponseAttachment) => {
        val += it.contentLength;
        return val;
      }, 0);
    }
    return ret;
  }

  // eslint-disable-next-line max-params
  protected handleAttachment(
    attachments: ResponseAttachment[], // ResponseAttachment 加了_account 仅限于给 handleAttachment 的 attachments
    mid: string,
    params?: {
      forWrite?: boolean;
      fromIMDisscuss?: boolean; // 是否来自邮件讨论组 只读
      source?: string;
      isTpMail?: boolean; // 是否为第三方邮件
      owner?: string; // 第三方邮件所属人
      tid?: string;
      password?: string; // 加密邮件解密密码
    }
  ): MailFileAttachModel[] | undefined {
    const { forWrite, fromIMDisscuss, source, isTpMail, owner, tid, password } = params || {};
    const ret: MailFileAttachModel[] = [];
    if (attachments && attachments.length > 0) {
      attachments.forEach(item => {
        const { _account } = item;
        const fileType = this.handleAttachmentType(item.contentType, item.filename);
        const downloadUrl = this.buildAttachmentDownloadUrl(item, mid, undefined, isTpMail, owner, password);
        const originUrl = this.buildAttachmentDownloadOriginUrl(item, mid, isTpMail, owner, password, _account);
        const previewUrl = this.buildAttachmentPreviewUrl(item, mid, fileType, isTpMail, owner, tid, password);
        const imDisscuss = fromIMDisscuss ? this.buildAttachmentUrlFromIMDisscuss(item, mid, _account) : undefined;
        const items = {
          realId: forWrite ? this.generateRndId() : 0,
          fileMime: item.contentType,
          fileName: item.filename,
          fileType,
          fileSize: item.estimateSize || item.contentLength,
          type: 'url',
          contentId: item.contentId,
          id: item.id,
          inlined: !!item.inlined, // corpMail返回null，需要转为false
          contentLocation: item.contentLocation,
          fileUrl: fromIMDisscuss ? imDisscuss : downloadUrl,
          fileOriginUrl: fromIMDisscuss ? imDisscuss : originUrl,
          deleted: false,
          ready: true,
          filePreviewUrl: fromIMDisscuss ? imDisscuss : previewUrl,
          fileSourceType: FileSourceType.downloadMail,
          fileSourceKey: mid + ';' + item.id,
          // 来源为eml预览的话 保留二进制附件内容
          ...(source === 'eml' && item?.content ? { fileContent: item.content } : {}),
        } as MailFileAttachModel;
        this.fileApi.registerTmpFile(items);
        ret.push(items);
      });
    }
    return ret;
  }

  async handleDecryptedMailResponse(retVal: MailEntryModel, attachments: ResponseAttachment[], password: string): Promise<MailEntryModel> {
    attachments?.forEach((it: ResponseAttachment) => {
      it._account = retVal._account;
    });
    const attachmentsResult =
      this.handleAttachment(attachments, retVal.id, {
        forWrite: false,
        password,
      }) || [];
    retVal.entry.attachment = attachmentsResult;
    retVal.entry.isIcs = attachmentsResult?.some(it => it.fileType === 'ics');
    retVal.isDecrypted = true;
    await this.modelHandler.handleMailContentReplace(retVal, 'readMailFromNet');
    return retVal;
  }

  async handleMailContentResponse(
    res: MailEntryProcessingItem[],
    readOnly?: boolean,
    source?: string,
    encoding?: MailEncodings,
    _account?: string
  ): Promise<MailEntryModel> {
    const item = res[0];
    let content: MailContentModel | undefined;
    let conItem;
    let isHtml = false;
    if (item.html && item.html.content && item.html.content.length > 0) {
      conItem = item.html;
      isHtml = true;
    } else if (item.text && item.text.content && item.text.content.length > 0) {
      item.text.content = `<pre>${item.text.content.replace(/</g, '&lt;')}</pre>`;
      conItem = item.text;
    } else if (item.rtf && item.rtf.content && item.rtf.content.length > 0) {
      conItem = item.rtf;
    }

    if (conItem) {
      content = {
        contentId: conItem.contentId || '',
        isHtml,
        content: conItem.content,
        contentLen: conItem.contentLength,
        encoding: encoding || 'default',
      };
    }
    const currentUser = this.systemApi.getCurrentUser(_account);
    const retVal = {
      id: item.id,
      _account: currentUser?.id,

      authAccountType: currentUser?.prop?.authAccountType,
      entry: {
        folder: item.fid || 0,
        top: item.flags?.top,
        system: item.flags?.system || false,
        popRead: item.flags?.popRead || false,
        rcptSucceed: item.flags?.rcptSucceed || false,
        rcptFailed: item.flags?.rcptFailed || false,
        title: this.htmlApi.encodeHtml(item.subject),
        sendTime: item.sentDate,
        receiveTime: item.receivedDate,
        mark: item.label0 === 1 ? 'redFlag' : 'none',
        attachmentCount: item.attachments ? item.attachments.length : 0,
        attachment: [],
        readStatus: !item.flags?.read ? 'unread' : 'read',
        brief: item.summary ? this.htmlApi.encodeHtml(item.summary) : undefined,
        id: item.id,
        replayed: item.flags?.replied,
        forwarded: item.flags?.forwarded,
        isDraft: item.flags?.draft,
        isIcs: false,
        // tags: [],
        content: content || {
          content: '',
          contentId: '',
          encoding: 'default',
        },
        memo: item.memo,
        threadMessageCount: item.threadMessageCount || 0,
        rclStatus: item.rclStatus,
        sndStatus: item.sndStatus,
        isScheduleSend: item.flags?.scheduleDelivery || false,
        sentMailId: item.sentMailId,
        requestReadReceipt: item.requestReadReceipt,
        suspiciousSpam: !!item.flags?.suspiciousSpam,
      },
      receiver: item.receiver,
      isOneRcpt: item.composeExtra?.showOneRcpt,
      sender: lodashGet(item, 'sender.0', {}) as MailBoxEntryContactInfoModel,
      totalSize: MailContentHandler.calculateTotalSize(item.attachments),
      tags: item?.tag,
      headers: item.headers,
      scheduleDateTimeZone: item.clientTimeZone ? Number(item.clientTimeZone) : undefined,
      antispamInfo: item.antispamInfo,
      isTpMail: item.isTpMail,
      owner: item.owner,
    } as MailEntryModel;
    item.attachments?.forEach((it: ResponseAttachment) => {
      it._account = _account;
    });
    const attachment =
      this.handleAttachment(item.attachments, item.id, {
        forWrite: false,
        fromIMDisscuss: readOnly,
        source,
        isTpMail: item.isTpMail,
        owner: item.owner,
        tid: item.tid,
      }) || [];
    retVal.entry.attachment = attachment;
    retVal.entry.isIcs = attachment?.some(it => it.fileType === 'ics');
    if (readOnly) {
      // 只读读信页
      await this.modelHandler.handleMailContentReplace(retVal, 'readMailReadOnly', undefined, item.isTpMail);
    } else {
      await this.modelHandler.handleMailContentReplace(retVal, 'readMailFromNet', undefined, item.isTpMail);
    }
    return retVal;
  }

  // private getMailAttachmentDownloadBaseUrl(): string {
  //
  // }

  // 不使用sid
  private buildAttachmentDownloadOriginUrl(
    item: ResponseAttachment,
    mid: string,
    isTpMail?: boolean,
    // preview?: boolean,
    owner?: string, // 第三方邮件所属人
    password?: string, // // 加密邮件解密密码
    _account?: string
  ) {
    const req = {
      mid,
      Part: item.id + '', // 使用大写的 Part 是为了与后端返回的字段一致
      email: owner || '',
    };
    if (password) {
      return this.buildUrl('getDecryptedMailPart', { ...req, password }, true, item._account);
    }
    if (!isTpMail) {
      return this.buildUrl('getMailPart', req, true, item._account);
    }
    return this.impl.buildUrl(this.systemApi.getUrl('getTpMailPart', undefined, undefined, _account), req);
  }

  // 邮件讨论组附件链接
  private buildAttachmentUrlFromIMDisscuss(item: ResponseAttachment, mid: string, _account?: string) {
    const req = {
      part: item.id,
      emailMid: mid,
    };
    const url = this.systemApi.getUrl('discussMailAttach', undefined, undefined, _account);
    return this.impl.buildUrl(url, req);
  }

  // eslint-disable-next-line max-params
  private buildAttachmentDownloadUrl(
    item: ResponseAttachment,
    mid: string,
    preview?: boolean,
    isTpMail?: boolean,
    owner?: string, // 第三方邮件所属人
    password?: string, // 加密邮件解密密码
    noSid?: boolean
  ) {
    // const subAccount = this.storeApi.getSubAccountList();
    // const isSubAccount = subAccount.some((it: ISubAccountEmailOnlyInfo) => it.email === item._account);
    const isSubAccount = this.mailConfApi.isSubAccount(item._account);
    const _session = isSubAccount ? this.systemApi.getSessionNameOfSubAccount(item._account || '') : '';
    // const _token = this.mailConfApi.accountTokens.find((token: AccountTokensType) => token.account === item._account)?.token || '';
    const req: StringMap = {
      // action: 'download_attach',
      // l: 'read',
      mode: preview ? 'inline' : 'download',
      part: String(item.id),
      // sid: user.sessionId || '',
      // uid: user.id,
      mid,
      _session,
      email: owner || '',
    };
    if (isSubAccount && !process.env.BUILD_ISELECTRON) {
      delete req._session;
      const token = this.mailConfApi.accountTokens.find(token => token.account === item._account)?.token || '';
      const user = this.systemApi.getCurrentUser(item._account);
      if (token && user) {
        req._token = token;
        req.sid = user.sessionId || '';
        req.func = 'mbox:getMessageData';
      }
      // 不用在这里加token 此处只在最初走一次，所以token会过期，
      // req._token = _token;
    }
    // const isCorpMailMode = this.systemApi.getIsCorpMailMode();
    // if (isCorpMailMode) {
    //   const user = this.systemApi.getCurrentUser();
    //   if (!user) {
    //     return ''; // TODO : add user illegal image
    //   }
    //   req.sid = user.sessionId || '';
    //   req.uid = user.id;
    //   // const urlKey = isCorpMailMode ? 'corpMailGetMessageData' : 'mailDownload';
    //   // const url = this.getMailAttachmentDownloadBaseUrl();
    //   return this.impl.buildUrl(this.systemApi.getUrl('corpMailGetMessageData'), req);
    //   // return this.impl.buildUrl(this.systemApi.getUrl(""),req)
    // }

    let downloadUrl = '';
    if (password) {
      downloadUrl = this.buildUrl('getDecryptedMailPart', { ...req, password }, noSid, item._account);
    } else if (isTpMail) {
      // 三方邮件不传子账号
      downloadUrl = this.impl.buildUrl(this.systemApi.getUrl('getTpMailPart'), req);
    } else if (isSubAccount && !process.env.BUILD_ISELECTRON && !this.systemApi.isElectron()) {
      // 单独附件下载
      downloadUrl = this.buildUrl('getMailPart', req, noSid, item._account, 'mailProxyOperation');
    } else {
      // todo 参数优化 wanglijun
      downloadUrl = this.buildUrl('getMailPart', req, noSid, item._account);
    }
    // if (isSubAccount) {
    //   if (downloadUrl.startsWith('/lx-web')) {
    //     downloadUrl = '/lx-web/commonweb/proxy' + downloadUrl.replace('/lx-web', '');
    //   } else {
    //     downloadUrl = '/commonweb/proxy' + downloadUrl;
    //   }
    // }

    if (downloadUrl && !downloadUrl.startsWith('http')) {
      downloadUrl = locationHelper.getProtocol() + locationHelper.getHost() + downloadUrl;
    }
    return downloadUrl;
  }

  // eslint-disable-next-line max-params
  private buildAttachmentPreviewUrl(
    item: ResponseAttachment,
    mid: string,
    fileType: FileType,
    isTpMail?: boolean,
    owner?: string, // 第三方邮件所属人
    tid?: string,
    password?: string // 加密邮件解密密码
    // _account?: string
  ) {
    if (fileType === 'png' || fileType === 'jpeg' || fileType === 'jpg' || fileType === 'gif') {
      return this.buildAttachmentDownloadUrl(item, mid, true, isTpMail, owner, password);
    }
    const user = this.systemApi.getCurrentUser(item?._account);
    if (!user) {
      return ''; // TODO : add user illegal image
    }
    const subAccount = this.accountApi.getEmailIdByEmail(item?._account || '');
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    const host = isCorpMail
      ? // @todo liuhao-todo 需要查看mesg.corp.netease.com的情况
        user.domain
      : this.mailConfApi.getWebMailHost(true, subAccount).replace(/^.*?:\/\//, '');
    let url = '';
    let req = {};
    // 子账号拼_session
    const isSubAccount = !!subAccount;
    if (isTpMail) {
      url = this.systemApi.getUrl('getTpMailPreview');
      req = {
        uid: owner,
        host,
        tid,
        mid,
        part: item.id + '',
        product: 'MAIL',
        fullFileName: item.filename,
      };
    } else {
      url = this.systemApi.getUrl('filePreview');
      req = {
        product: 'MAIL',
        fullFileName: item.filename,
        sid: user.sessionId,
        url: this.buildAttachmentDownloadUrl(item, mid, undefined, undefined, undefined, password, true),
        uid: user.id,
        // eslint-disable-next-line max-lines
        mid,
        part: item.id + '',
        host,
        _session: '',
      };
    }
    if (process.env.BUILD_ISELECTRON && isSubAccount) {
      const sessionName = this.systemApi.getSessionNameOfSubAccount(item._account || '');
      if (sessionName) {
        // @ts-ignore
        req._session = sessionName;
      }
    }
    return this.impl.buildUrl(url, req);
  }
  // "mailh.qiye.163.com/js6/s?host=mailh.qiye.163.com&func=mbox%3AgetMessageData&sid=x07AwCa8-D7Ar5I8NeOM0DhD5QBvkUj8&mode=download&part=4&mid=ANYA3gBaFJSPJ3XztJKuoKqk"
  // private buildAttachmentPreviewUrl(
  //   item: ResponseAttachment,
  //   mid: string,
  //   fileType: FileType,
  // ) {
  //   if (fileType === 'png' || fileType === 'jpeg' || fileType === 'jpg' || fileType === 'gif' || fileType === 'pdf'
  //     || fileType === 'html') {
  //     return this.buildAttachmentDownloadUrl(item, mid, true);
  //   }
  //   const user = this.systemApi.getCurrentUser();
  //   if (!user) {
  //     return ''; // TODO : add user illegal image
  //   }
  //   const url = this.systemApi.getUrl('mailPreview');
  //   return this.impl.buildUrl(url, {
  //     sid: user.sessionId,
  //     part: item.id + '',
  //     mid,
  //     uid: user.id,
  //     keyfrom: 'wmqiye.163.com',
  //     host: this.mailConfApi.getWebMailHost(true),
  //     ver: 'js6',
  //     skin: 'skyblue',
  //     style: 7,
  //   });
  // }

  async doCheckReadStatus(mid: string, _account?: string): Promise<MailDeliverStatus> {
    const key = 'checkPostMail';
    const url = this.buildUrl(key, undefined, undefined, _account);
    const data1 = { mid, _subaccount: _account };
    const apiResponsePromise = this.impl.post(url, data1, this.getConfigForHttp(key, { url, data: data1, _account }));
    return apiResponsePromise.then(this.unpackData.bind(this)).then(async (res: ResponseData<ResponseDeliverStatus[]>) => {
      if (res && res.code === MailAbstractHandler.sOk && res.var && res.var.length > 0) {
        const { var: data = [] } = res;
        const tid = data[0]?.tid;
        const sentDate = data[0]?.modtime;
        const mailTraceUrl = this.systemApi.getAccountUrl('mailTraceStatus', _account);
        let newData: MailExternalDeliverStatusItem[] = [];
        const isCorpMail = this.systemApi.getIsCorpMailMode();
        if (!isCorpMail) {
          try {
            const response: ApiResponse<MailExternalDeliverStatusItem[]> = await this.impl.post(mailTraceUrl, { tid, sentDate }, { contentType: 'form', _account });
            const { result } = this.unpackData(response);
            newData = result?.data;
          } catch (error) {
            newData = [];
          }
        }
        const _data = mergeMailStatusList(data, newData);
        const contactList: string[] = _data.map(it => it.to);
        return this.contactHandler.getContractItemByEmail(contactList, '', _account).then((ret: MailBoxEntryContactInfoModel[]) => {
          // console.log(ret);
          const contactMap: StringTypedMap<ContactModel> = {};
          if (ret && ret.length > 0) {
            ret.forEach(it => {
              contactMap[it.contactItem.contactItemVal] = it.contact;
            });
          }
          return {
            status: res.code as MailOperationStatus,
            tid,
            detail: _data.map(it => {
              const contactMapElement = contactMap[it.to];
              return {
                result: it.result,
                email: it.to,
                rclResult: it.rclResult,
                contact: contactMapElement,
                contactName: contactMapElement?.contact.contactName,
                avatar: contactMapElement?.contact.avatar || contactMapElement?.contact.contactLabel,
                modifiedTime: it.modtime,
                msgType: it.msgType,
                mid,
                tid,
                inner: it?.inner,
              };
            }),
          } as MailDeliverStatus;
        });
      }
      // return Promise.reject(this.getMailErrMsg(res));
      return {
        status: 'FA_MAIL_EXPIRED',
        tid: '',
        detail: [],
      } as MailDeliverStatus;
    });
  }

  async doGetMailReadCount(params: ReqMailReadCount): Promise<any> {
    const url = this.systemApi.getUrl('getMailReadCount');
    const response: any = await this.impl.post(url, params, { contentType: 'json', _account: params._account });
    return response.data;
  }

  async doGetMailReadDetail(params: ReqMailReadDetail): Promise<any> {
    const url = this.systemApi.getUrl('getMailReadDetail');
    const response: any = await this.impl.post(url, params, { contentType: 'json', _account: params._account });
    return response.data;
  }

  // 异步请求批量阅读状态接口
  // todo: api接口不应该依赖 MailEntryModel 作为参数
  async checkReadStatusOfSentMail(result: MailEntryModel[] | MailModelEntries, param: queryMailBoxParam) {
    let res = {};
    try {
      const data = Array.isArray(result) ? result : result.data;
      const { _account } = param;
      if (Array.isArray(data) && data.length) {
        // 过滤出是自己发出的邮件
        // const sendDatas = data.filter(mail => mail.fid === mailBoxOfSent.id );
        const sendDatas = data.filter(mail => {
          // 是发件箱
          const isSendBox = mail.entry.folder === mailBoxOfSent.id;
          // 是当前账号发出的
          const senderEmail = mail.sender?.contact?.contact?.displayEmail || mail.sender?.contact?.contact?.accountName;
          const isSendMail = this.accountApi.getIsSameSubAccountSync(senderEmail, _account);
          const accountAlias = this.systemApi.getCurrentUser(_account)?.prop?.accountAlias;
          const accountAliasArray = Array.isArray(accountAlias) ? accountAlias : [accountAlias];
          const isAliasSend = accountAliasArray.some(acc => this.accountApi.getIsSameSubAccountSync(senderEmail, acc));
          return isSendBox || isSendMail || isAliasSend;
        });

        /**
         * 当检测到我发出的邮件的时候
         */
        if (sendDatas.length) {
          // let res: MailEntryModel[] = [];
          const authAccountType = this.systemApi.getCurrentUser(_account)?.prop?.authAccountType;
          // 如果是三方账号，请求打开记录
          if (authAccountType && authAccountType !== '0') {
            const mailList = sendDatas.map(i => ({
              tid: i.entry.tid,
              mid: i.entry.id,
              fromEmail: i.sender?.contact?.contact.displayEmail || i.sender?.contact?.contact.accountName,
            }));
            const url = this.systemApi.getUrl('getMailReadCountBatch');
            const response: any = await this.impl.post(url, { mailList }, { contentType: 'json', _account });
            const { data, success } = response?.data || {};
            if (success && data.mailList && data.mailList.length) {
              const countMap = {} as { [key: string]: { openCount: number } };
              data.mailList.forEach((m: { tid: string; count: number }) => {
                const { tid, count } = m;
                if (tid) {
                  countMap[tid] = {
                    openCount: +count || 0,
                  };
                }
              });
              res = countMap;
            }
          } else {
            // 非三方账号，请求阅读记录
            let start = sendDatas[0].entry.sendTime;
            let end = sendDatas[0].entry.sendTime;
            const tids = sendDatas.map(i => {
              if (moment(i.entry.sendTime).isBefore(moment(start))) {
                start = i.entry.sendTime;
              }
              if (moment(i.entry.sendTime).isAfter(moment(end))) {
                end = i.entry.sendTime;
              }
              return i.entry.tid;
            });
            const mailsReadStatusUrl = this.systemApi.getUrl('mailsReadStatus', undefined, undefined, _account);
            const params = {
              tids: tids.join(','),
              start,
              end,
            };
            const response: ApiResponse = await this.impl.post(mailsReadStatusUrl, params, { contentType: 'form', _account });
            const { result } = this.unpackData(response);
            res = result?.data || {};
          }
        }
      }
    } catch (error) {
      console.error('checkReadStatusOfSentMail error', error);
    }
    return res;
  }

  // 获取邮件往来附件
  async listAttachments(params: listAttachmentsParam): Promise<ResponseListAttachments> {
    const url = this.buildUrl('listAttachments');
    const res: ApiResponse<ApiResponseListAttachments> = await this.impl.post(url, params, { contentType: 'json', cachePolicy: 'noCache' });
    const unpackRes = this.unpackData(res);
    if (res?.data?.code === MailAbstractHandler.sOk) {
      const { total, var: list, notReady } = unpackRes;
      return {
        total,
        list,
        notReady,
        success: true,
      };
    }
    return {
      success: false,
      error: res.code ? ErrResult[res.code] : ErrResult.FS_UNKNOWN,
    };
  }

  // 导入邮件
  async uploadMail(fid: number, file: Buffer, _account?: string): Promise<UploadMailResult> {
    // if (!isElectron()) {
    //   return Promise.reject(new Error('只可以在electron中调用'));
    // }
    const url = this.buildUrl('uploadMail', { fid: fid + '', date: Date.now() + '' }, undefined, _account);
    return this.impl
      .post(url, file, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        contentType: 'arraybuffer',
        _account: _account || '',
        // 3分钟超时
        timeout: 3 * 60 * 1000,
      })
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<ResponseUploadMail>) => {
        if (res && res.code === MailAbstractHandler.sOk && res.var) {
          return {
            mid: res.var.mailUniqueId,
          };
        }
        return Promise.reject(res?.code && ErrResult[res.code] ? ErrResult[res.code].title : '邮件导入失败');
      });
  }

  // 获取邮件详情
  getMailDeliveryDetail(mid: string, _account?: string): Promise<DeliveryDetail> {
    const url = this.systemApi.getUrl('getDeliveryDetail');
    const req = {
      emailMid: mid,
    };
    return this.impl
      .post(url, req, {
        url,
        contentType: 'json',
        cachePolicy: 'noCache',
        noEnqueue: true,
        _account,
      })
      .then(res => {
        const { data, code } = res.data as any;
        if (+code === 0 && data) {
          return data as DeliveryDetail;
        }
        return Promise.reject(this.getErrMsg(code));
      })
      .catch(err => Promise.reject(err));
  }

  // 请求合并
  async doRequestSequential(params: RequestSequentialParams[]) {
    const _params = params
      .filter(v => methodMap[v.func])
      .map(v => ({
        func: methodMap[v.func],
        var: Array.isArray(v.var) && v.var.length === 0 ? undefined : v.var,
      }));
    const reqParams = {
      var: getXmlByObject(_params),
    };
    const key = 'sequential';
    const url = this.buildUrl(key);
    const result = await this.impl.post(url, reqParams, { data: reqParams, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    console.log(result);
    return result.data?.var;
  }

  public async doGetMailContentInquiry(handoverEmailId: string): Promise<MailEntryModel> {
    if (!handoverEmailId) {
      return Promise.reject(new Error('no handoverEmailId input'));
    }
    const httpApi = api.getDataTransApi();
    const url = this.systemApi.getUrl('getMailContentInquiry');
    const mailEntryModelPromise = await httpApi
      .get(url, { handoverEmailId })
      .then(res => {
        if (res && res.data && res.data.success) {
          return res.data.data;
        }
        return Promise.reject(new Error('获取邮件详情失败'));
      })
      .then(res => {
        const { mid, emailInfo } = res;
        const data: ResponseMailContentEntry = JSON.parse(emailInfo);
        const prItem: MailEntryProcessingItem = this.contactHandler.mapMailEntryToProcessingItem(data, mid);
        const promise = this.contactHandler.handleContactList([prItem]);
        return promise;
      })
      .then((res: MailEntryProcessingItem[]) => this.handleMailContentResponse(res, true))
      .then(res => setMailAttSource(res, 'content'));
    return mailEntryModelPromise;
  }
}
