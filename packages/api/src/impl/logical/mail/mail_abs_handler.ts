import { config } from 'env_def';
import {
  ActionStore,
  methodConf,
  MethodMap,
  methodMap,
  RequestListMailEntry,
  ResponseFolderDef,
  SubActionsType,
  watchConf,
  WatchMethod,
} from './mail_action_store_model';
import { SystemApi } from '@/api/system/system';
import { DataStoreApi } from '@/api/data/store';
import { MailModelHandler } from './mail_entry_helper';
import { MailContactHandler } from './mail_obtain_contact_helper';
import { api } from '@/api/api';
import { ApiRequestConfig, DataTransApi, ResponseData } from '@/api/data/http';
import { EventApi } from '@/api/data/event';
import { ErrMsgCodeMap, ErrMsgType, ErrResult } from '@/api/errMap';
import { StringMap, StringTypedMap } from '@/api/commonModel';
import { PushHandleApi } from '@/api/logical/push';
import { apis, URLKey } from '@/config';
import { PopUpMessageInfo, User } from '@/api/_base/api';
import { EntityMailBox, FolderTreeEditState, MailApi, MailBoxModel, MailConfApi, MailEntryModel, WriteMailInitModelParams } from '@/api/logical/mail';
import { DbApiV2 } from '@/api/data/new_db';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { HtmlApi } from '@/api/data/html';
import { MailSignatureApi } from '@/api/logical/mail_signature';
import { MailContentDbHelper } from '@/impl/logical/mail/mail_content_db_handler';
import { AccountApi } from '@/api/logical/account';
import corpMailUtils from './corp_mail_utils';
import { getOs } from '../../../utils/confOs';
import { ErrorReportApi } from '@/api/data/errorReport';

// import { MailContentDbHelper } from './mail_content_db_handler';
const os = (getOs() as string) || 'web';
export const xMailerExt = 'Sirius_' + os.toUpperCase() + '_' + config('version');

/**
 * 邮件处理逻辑基类
 * 继承关系 mail_content_db_handler -> mail_send_handler -> mail_operation_handler -> mail_search_handler -> mail_content_handler -> mail_folder_handler
 * -> mail_abs_handler
 */
export class MailAbstractHandler {
  static readonly MAX_CACHE_ALIVE_SPAN = 1000 * 3600 * 24 * 7;

  static readonly COMMON_CACHE_ALIVE_SPAN = 1000 * 3600;

  static readonly COMMON_ATTACHMENT_LOCK_NAME = 'mailAttachmentUploadLock';

  static readonly COMMON_DEL_ATTACHMENT_LOCK_NAME = 'mailAttachmentDelLock';

  // static readonly COMMON_SAVE_ATTACHMENT_LOCK_NAME = 'mailAttachmentSaveLock';

  static readonly searchFields: string = 'from,to,subj,cont,aname';

  static readonly mailSearchSeq = 'mailSearchSeq';

  static readonly mailSearchKeyWord = 'mailSearchKeyWord';

  static readonly comNotExist: string = config('notExistUrl') as string;

  static readonly sOk: string = 'S_OK';

  static readonly SuccessCode: number = 200;

  static tmpIdFormat = /[0-9]+-tmp/i;

  static readonly MAX_ATTACHMENT_ALLOWED_SIZE: number = 16 * 1000 * 1000 * 1000;

  static readonly MAX_SINGLE_ATTACHMENT_ALLOWED_SIZE: number = 5 * 1000 * 1000 * 1000;

  static useLegacyUpload = false;

  static readonly defaultRequestListMailEntry: RequestListMailEntry = {
    limit: 50,
    start: 0,
    summaryWindowSize: 50,
    // fid: mailBoxOfDefault.id,
    returnTotal: true,
    returnTid: true,
    returnTag: true,
    returnAttachments: true,
    order: 'date',
    desc: true,
    skipLockedFolders: false,
    // topFlag: true,
  };

  static readonly composeUrlParam: { [k: string]: StringMap } = {
    save: {
      l: 'compose',
      action: 'save',
      xMailerExt,
    },
    deliver: {
      l: 'compose',
      action: 'deliver',
      xMailerExt,
    },
  };

  // static sid?: string;
  static user: User | undefined = undefined;

  private static defaultErrInfo: PopUpMessageInfo = {
    popupType: 'window',
    title: ErrMsgCodeMap['SERVER.ERR'],
    code: 'SERVER.ERR',
  };

  protected commonConfig = {
    contentType: 'json',
    responseType: 'text',
    method: 'post',
    expectedResponseType: 'json',
  } as Partial<ApiRequestConfig>;

  protected readonly host: string = config('host') as string;

  protected readonly domain: string = config('domain') as string;

  watchUrlKey: string[];

  cacheUrlKey: string[];

  db: DbApiV2;

  actions: ActionStore;

  subActions?: SubActionsType;

  systemApi: SystemApi;

  storeApi: DataStoreApi;

  eventApi: EventApi;

  impl: DataTransApi;

  pushApi: PushHandleApi;

  mailApi: MailApi;

  mailConfApi: MailConfApi;

  mailSigApi: MailSignatureApi;

  modelHandler: MailModelHandler;

  contactHandler: MailContactHandler;

  mailDbHanlder: MailContentDbHelper;

  dataTrakerApi: DataTrackerApi;

  errReporter: ErrorReportApi;

  htmlApi: HtmlApi;

  accountApi: AccountApi;

  readonly dbEnableKey = 'mailDbEnable';

  // static dbEnable: boolean = true;
  constructor(actions: ActionStore, modelHandler: MailModelHandler, contactHandler: MailContactHandler, mailDbHandler: MailContentDbHelper, subActions?: SubActionsType) {
    this.mailDbHanlder = mailDbHandler;
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.eventApi = api.getEventApi();
    this.impl = api.getDataTransApi();
    this.pushApi = api.requireLogicalApi(apis.pushApiImpl) as unknown as PushHandleApi;
    this.mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
    this.mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
    this.mailSigApi = api.requireLogicalApi(apis.mailSignatureImplApi) as unknown as MailSignatureApi;
    this.db = api.requireLogicalApi(apis.dbInterfaceApiImpl) as DbApiV2;
    this.modelHandler = modelHandler;
    this.contactHandler = contactHandler;
    // action改造
    this.actions = actions;
    this.subActions = subActions;
    this.errReporter = api.requireLogicalApi(apis.errorReportImpl) as unknown as ErrorReportApi;
    this.dataTrakerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
    this.htmlApi = api.requireLogicalApi(apis.htmlApi) as unknown as HtmlApi;
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    const buildKeys = (info: WatchMethod, st: keyof methodConf) => {
      const ret: string[] = [];
      Object.keys(info).forEach(it => {
        const t = info[it as keyof WatchMethod];
        t && t[st] && ret.push(methodMap[it as keyof MethodMap]);
      });
      return ret;
    };
    this.watchUrlKey = buildKeys(watchConf, 'updateStatus');
    this.cacheUrlKey = buildKeys(watchConf, 'cache');
  }

  buildUrl(
    key: keyof MethodMap,
    additionalParam?: StringMap,
    noSid?: boolean, // 不添加sid
    _account?: string,
    urlPath?: URLKey
  ) {
    return this.modelHandler.buildUrl({ key, additionalParam, urlPath, noSid, _account });
  }

  buildPriaseUrl(key: keyof MethodMap, additionalParam?: StringMap, _account?: string) {
    return this.modelHandler.buildUrl({ key, additionalParam, urlPath: 'sendPraise', _account });
  }

  buildCreateTaskUrl(key: keyof MethodMap, additionalParam?: StringMap, _account?: string) {
    return this.modelHandler.buildUrl({ key, additionalParam, urlPath: 'createTask', _account });
  }

  public commonCatch(reason: any, additionalInfo?: string, extraObj?: Object): PopUpMessageInfo {
    console.log('commonCatch', reason);
    if (typeof reason === 'object' && reason.code && reason.title && reason.popupType) {
      return reason;
    }
    if (reason instanceof Error) {
      return this.getErrMsg(reason.message);
    }
    if (typeof reason === 'string') {
      return this.getErrMsg(reason, undefined, additionalInfo, extraObj);
    }
    return MailAbstractHandler.defaultErrInfo;
  }

  getMailErrMsg(err: ResponseData, type?: string, additionalInfo?: string): PopUpMessageInfo {
    // if (type) {
    //   if (type == 'mailSend') {
    //   }
    // }
    if (err && err.code) {
      return this.getErrMsg(err.code);
    }
    return {
      code: err.code === undefined ? type || '' : err.code + '',
      title: additionalInfo || ErrMsgCodeMap.UNKNOWN_ERR,
    };
  }

  getErrMsg(
    // code
    errMsg: string | number | undefined,
    defaultMsg?: string,
    // 额外字段
    additionalInfo?: string,
    // 额外对象
    extraObj?: { account?: string; errResult?: StringTypedMap<PopUpMessageInfo>; overflowReason?: string }
  ): PopUpMessageInfo {
    if (errMsg) {
      let errInfo = null;
      // 优先使用传入的映射
      if (extraObj?.errResult) {
        errInfo = extraObj?.errResult[errMsg];
      } else {
        // 默认映射
        errInfo = ErrResult[errMsg];
      }
      if (errInfo) {
        let messageInfo = {
          ...errInfo,
        };
        if (errMsg === 'FA_MTA_REJECTED5511') {
          messageInfo = {
            ...messageInfo,
            btnConfirmTxt: '解 禁',
            confirmCallback: () => corpMailUtils.applyUnban(extraObj as { account: string }),
          };
        }
        if (errMsg === 'FA_OVERFLOW') {
          messageInfo = {
            ...messageInfo,
            overflowReason: extraObj?.overflowReason,
          };
        }

        if (messageInfo.popupType && (messageInfo.popupType === 'window' || messageInfo.popupType === 'toast')) {
          messageInfo.content += additionalInfo || '';
          // 默认全局通知
          if (errMsg !== 'FA_MAIL_NOT_FOUND') {
            this.eventApi.sendSysEvent({
              eventName: 'error',
              eventLevel: 'error',
              eventStrData: '',
              eventData: messageInfo,
              eventSeq: 0,
            });
          } else {
          }
        }
        return messageInfo;
      }
      if (errMsg in ErrMsgCodeMap) {
        return {
          title: ErrMsgCodeMap[errMsg as ErrMsgType] as string,
          code: errMsg + '',
        };
      }
    }
    return {
      title: (errMsg ? errMsg + '' : undefined) || defaultMsg || ErrMsgCodeMap.UNKNOWN_ERR,
      code: 'UNKNOWN_ERR',
    };
  }

  getConfigForHttp(urlKey: keyof MethodMap, httpConfig: Partial<ApiRequestConfig>): ApiRequestConfig {
    const ret: ApiRequestConfig = { ...this.commonConfig, ...httpConfig };
    ret.tag = urlKey;
    const element = watchConf[urlKey];
    if (element) {
      if (element.immutable) {
        // ret.cachePolicy = ret.cachePolicy || 'useDirect';
        // ret.useCacheResultPeriod = MailAbstractHandler.MAX_ATTACHMENT_ALLOWED_SIZE;
      } else if (element.cache) {
        const methodStatus = this.actions.methodStatus[urlKey];
        if (methodStatus) {
          this.impl.getUrlPath(httpConfig);
          // const reqKey = this.impl.buildRequestKey(config);
          // if (methodStatus.refreshedKeys?.has(reqKey)) {
          //   ret.cachePolicy = ret.cachePolicy || 'useDirect';
          //   ret.useCacheResultPeriod = MailAbstractHandler.COMMON_CACHE_ALIVE_SPAN;
          // } else {
          //   ret.cachePolicy = ret.cachePolicy || 'refresh';
          //   // ret.useCacheResultPeriod=-1;
          // }
        }
      } else {
        //
      }
    }
    ret.cachePolicy = ret.cachePolicy || 'noCache';
    return ret;
  }

  setDbEnable(flag: boolean) {
    ActionStore.dbEnable = flag;
    this.storeApi.put(this.dbEnableKey, String(ActionStore.dbEnable)).then().catch(console.warn);
  }

  buildInitContent(param: WriteMailInitModelParams) {
    return this.modelHandler.buildInitContent(param);
  }

  mappingToMailBoxEntry(data: ResponseFolderDef[], _account?: string): EntityMailBox[] {
    const dt: EntityMailBox[] = [];
    // const currentUser = this.systemApi.getCurrentUser();
    const actions = this.mailApi.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    if (actions) {
      data.forEach((item, index) => {
        if (item) {
          const { id } = item;
          const stats = item.stats || {};
          const flags = item.flags || {};
          const entry: EntityMailBox = {
            mailBoxName: item.name,
            mailBoxCurrentUnread: stats.unreadMessageCount || 0,
            mailBoxUnread: stats.unreadMessageCount || 0,
            mailBoxTotal: stats.messageCount || 0,
            mailBoxType: flags.system ? 'sys' : 'customer',
            mailBoxId: id,
            threadMailBoxCurrentUnread: Math.max(stats.unreadThreadCount || 0, 0),
            threadMailBoxUnread: Math.max(stats.unreadThreadCount || 0, 0),
            threadMailBoxTotal: Math.max(stats.threadCount || 0, 0),
            mailBoxParent: item.parent,
            id: '' + (actions.mailBoxConfs[id]?.sort || id),
            pid: item.parent,
            locked: item.auth2Locked,
            keepPeriod: item.keepPeriod,
            sort: index,
            _state: FolderTreeEditState.DEFAULT,
            _deep: 0,
            _isTempNode: false,
          };
          dt.push(entry);
        }
      });
    }
    return dt;
  }

  saveMailContentToAction(mailBoxModels: MailBoxModel[], mailBoxEntry: EntityMailBox[], _account?: string) {
    this.modelHandler.saveMailBoxContentToAction(mailBoxModels, mailBoxEntry, _account);
  }

  protected generateRndId() {
    return this.modelHandler.generateRndId();
  }

  // makeModelSafe(entry: MailEntryModel): MailEntryModel {
  //   entry.entry.content = entry.entry.content || {
  //     content: '',
  //     contentId: '',
  //   };
  //   entry.receiver = entry.receiver || [];
  //   entry.sender = entry.sender || this.contactHandler.buildEmptyContact(false)[0];
  //   return entry;
  // }

  makeModelSafe(entry: MailEntryModel): MailEntryModel {
    entry.entry.content = entry.entry.content || {
      content: '',
      contentId: '',
    };
    entry.receiver = entry.receiver || [];
    entry.sender = entry.sender || this.contactHandler.buildEmptyContact(false)[0];
    return entry;
  }

  getAccountSession(_account: string): { _session: string; sid: string } {
    const result = {
      _session: '',
      sid: '',
    };
    const accounts = this.accountApi.getLocalSubAccountsFromCache({
      subAccountEmail: _account,
      expired: false,
    });
    const account = accounts.find((it: any) => it.id === _account);
    if (account) {
      result._session = '';
      result.sid = account.sessionId;
    }
    return result;
  }

  // saveMails(mails: MailEntryModel[], conf: MailContentFeature, index: number, total: number): Promise<void> {
  //   console.log('save mail to db:', conf, mails, index, total);
  //   return Promise.resolve();
  // }
  //
  // saveMailContent(mail: MailEntryModel): Promise<void> {
  //   console.log('save mail content to db:', mail);
  //   return Promise.reject('');
  // }
}
