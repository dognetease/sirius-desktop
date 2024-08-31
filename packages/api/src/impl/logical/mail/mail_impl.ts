/* eslint-disable max-lines */
import { FsSelectRes, WindowHooksObserverConf } from 'env_def';
import lodashOrderBy from 'lodash/orderBy';
import lodashGet from 'lodash/get';
import { createHash } from 'crypto';
import dayjs from 'dayjs';
import { api } from '@/api/api';
import { ApiRequestConfig, ApiResponse, DataTransApi, LoaderActionConf, ResponseData } from '@/api/data/http';
import { Api, ApiLifeCycleEvent, CommonBatchResult, ContactModel, PopUpMessageInfo, resultObject, User } from '@/api/_base/api';
import { DataStoreApi, ISubAccountEmailOnlyInfo, globalStoreConfig } from '@/api/data/store';
import { SystemApi } from '@/api/system/system';
import { ContactAndOrgApi, syncRes } from '@/api/logical/contactAndOrg';
import { EventApi, SystemEvent } from '@/api/data/event';
import { apis, inWindow, isElectron, reLoginCodeList } from '@/config';
import {
  ActionStore,
  EntityMailAttachment,
  EntityMailContent,
  EntityMailData,
  EntityMailStatus,
  localSearchDataFilterName,
  mailAttachmentOfContentFilterName,
  mailBoxOfDefault,
  mailBoxOfDeleted,
  mailBoxOfDraft,
  mailBoxOfFakeThread,
  mailBoxOfSent,
  mailBoxOfWaitingIssue,
  mailBoxTable,
  mailContentFilterName,
  mailContentFolderFilterName,
  mailDbCommonQueryFilterName,
  mailComposeDataTable,
  MailEntryProcessingItem,
  mailSearchAttachmentFilterName,
  mailTable,
  ResponseAttachment,
  ResponseMailContentEntry,
  mailBoxOfTask,
  mailBoxOfDefer,
  mailAttrFilterName,
  tpMailFilterName,
  EntityMailAttr,
  TpMailListQuery,
  mailBoxOfSpam,
  mailBoxOfFilterStar,
  ContactProcessingItem,
  ReqMailReadCount,
  ReqMailReadDetail,
  SubActionsType,
  ResponseMailUploadCloud,
} from './mail_action_store_model';
import {
  createUserFolderParams,
  createUserFolderParamsCondig,
  // CustomerBoxModel,
  CustomerBoxUnread,
  DelMailParams,
  EmoticonCreateModel,
  EntityMailBox,
  EntityTpMail,
  FsParsedMail,
  listAttachmentsParam,
  MailApi,
  MailBoxEntryContactInfoModel,
  MailBoxModel,
  MailConfApi,
  MailConfigQuickSettingModel,
  MailConfigDefaultCCBCCModel,
  MailDeferParams,
  MailDeliverStatus,
  MailEmoticonInfoModel,
  MailEntryInfo,
  MailEntryModel,
  MailFileAttachModel,
  MailModelEntries,
  MailMsgCenter,
  MailMsgCenterParams,
  MailMsgCenterTypes,
  MailOperationType,
  MailOpEventParams,
  MailOpReplyPayload,
  MailPerferedOpType,
  MailRefreshTypes,
  MailSearchModel,
  MailSearchRecord,
  MailSearchRecordPayload,
  MailSearchResult,
  MailTypes,
  MailTypesGroup,
  MemberType,
  NewTagOpItem,
  newUsersIntoEmailListParam,
  ParsedContact,
  // queryCusterListParam,
  queryCusterUnreadParam,
  queryMailBoxParam,
  queryThreadMailDetailParam,
  Recent3StrangersRes,
  RequestMailTagRequest,
  ResponseListAttachments,
  ResponseMailUploadCloudToken,
  SearchCacheInfo,
  StrangerOfContactModel,
  SyncTpMailParamItem,
  SystemAccounts,
  TagManageOps,
  TaskInternalMap,
  TopTaskModel,
  TpMailContentParams,
  TranslatResModel,
  GrammarResponse,
  UpdateMailCountTaskType,
  updateUserFolderParams,
  UploadAttachmentFlag,
  UploadMailResult,
  WriteMailInitModelParams,
  DoCancelDeliverParams,
  EdmMailModelEntries,
  DeliveryDetail,
  MailUploadParams,
  ImportMailsResult,
  MailAttrConf,
  ListStarContactRes,
  MarkStarMailQueue,
  MailEncodings,
  RequestSequentialParams,
  MailDeliverStatusItem,
  DecryptedContentResult,
  DecryptedMailsCache,
  IMailReadListItem,
  DeleteAttachmentRes,
  DoUploadAttachmentParams,
  DoAbortAttachmentRes,
  updateMessageInfosParams,
  MarkPayload,
  ISubAccountMailFoldersConfigItem,
  IMailPushConfigItem,
  DoSaveTempParams,
  DoWriteMailPayload,
  AuthCodeDesc,
  ReUploadInfo,
  RespDoTransferAtts,
  DoImmediateDeliverParams,
  MailContentLangResModel,
  WriteLetterPropType,
  GuessUserSettingModel,
  ReqDoSaveAttachmentToDB,
} from '@/api/logical/mail';
import { AiWriteMailModel, GenerateReportReq, GPTDayLeft, GptAiContentTranslateReq, GPTAiContentTranslateRes, GPTAiContentRes } from '@/api/logical/edm_marketing';
import { MailPraiseApi, MedalInfo } from '@/api/logical/mail_praise';
import { EmailListPriority, MailStrangerApi, StrangerModel } from '@/api/logical/mail_stranger';
import { FileApi, FsSaveRes, LoaderResult, UploadPieceHandler, CloudUploaderCommonArgs, ImportMailModel } from '@/api/system/fileLoader';
import { NumberTypedMap } from '@/api/commonModel';
import { IPushConfigSetRequest, PushHandleApi } from '@/api/logical/push';
import { MailModelHandler } from './mail_entry_helper';
import { MailContactHandler } from './mail_obtain_contact_helper';
import { AdQueryConfig, DbApiV2, DBList, QueryConfig } from '@/api/data/new_db';
import { ErrorReportApi } from '@/api/data/errorReport';
import { MailContentDbHelper } from './mail_content_db_handler';
import { MailContentHandler } from './mail_content_handler';
import { isWinmailDatAttachment, util, wait } from '@/api/util';
import { MailSendHandler } from './mail_send_handler';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { ErrResult } from '@/api/errMap';
import { mailPerfTool } from '@/api/util/mail_perf';
import { TaskMailApi, TaskMailModel } from '@/api/logical/taskmail';
import { MailItemRes } from '@/api/logical/im_discuss';
import { AccountApi } from '@/api/logical/account';
import { edmMailHelper } from '@/api/util/edm_mail_helper';
import { startWatchMailMessage } from '@/api/store/api_store';
import { ProductAuthApi } from '@/api/logical/productAuth';
import { MailCustomerHelper } from './mail_customer';
import { MailDraftApi } from '@/api/logical/mail_draft';
import { getOs } from '../../../utils/confOs';
import { getIn18Text, setMailAttSource } from '@/api/utils';
import { EdmRoleApi } from '@/api/logical/edm_role';
import { MailPlusCustomerApi } from '@/api/logical/mail_plus_customer';

const inElectron = api.getSystemApi().isElectron();
const inMainPage = api.getSystemApi().isMainPage();

const MAIL_CACHE_CUSTOMDIRKEY = 'mailCacheCustomPath';

function traverseMailBoxs(mailBoxs: Array<MailBoxModel>, resArr: Array<MailBoxModel>) {
  if (mailBoxs && mailBoxs.length) {
    mailBoxs.forEach(mailBoxItem => {
      resArr.push(mailBoxItem);
      if (mailBoxItem.children && mailBoxItem.children.length) {
        traverseMailBoxs(mailBoxItem.children, resArr);
      }
    });
  }
}
class MailApiImpl implements MailApi {
  static readonly mailSyncMinPeriod = 25 * 1000;

  static readonly MAIL_SYNC_WAIT_SPAN = 15 * 1000;

  static readonly MAIL_CONTENT_SYNC_MIN_PERIOD = 30 * 60 * 1000;

  static readonly SAVE_FILES_WAIT = 2 * 60 * 1000;

  // static readonly SYNC_CUSTOMER_UNREAD_INTERVAL = 10 * 60 * 1000;

  // private static reLoginCodeList = {
  //   FA_SECURITY: 1,
  //   FA_INVALID_SESSION: 1,
  //   FA_UNAUTHORIZED: 1,
  //   NS_411: 1,
  //   NF_401: 1,
  //   NF_403: 1,
  //   'ERR.SESSIONNULL': 1,
  //   EXP_AUTH_COOKIE_TIMEOUT: 1,
  // };

  // static sid: string | undefined = undefined;
  static user: User | undefined = undefined;

  static mailSyncing = false;

  readonly isMailPage: boolean; // =window.location.pathname.indexOf('writeMail');

  readonly dbName: string = 'mail_new';

  readonly topTaskNum: number = 2;

  markStarMailQueue: MarkStarMailQueue = { queue: [], runningId: '' };

  // 正在扫描邮件
  scanningMails = false;

  // 通讯录准备完毕
  contactReady = false;

  // 正在标记全部已读
  markingMailsRead = false;

  // 客户邮件未读数自动更新计时器
  // lastUpdateCustomerUnreadTimer: number | null = null;

  // static debugMailPopWindow: boolean = false;
  fileApi: FileApi;

  db: DbApiV2;

  impl: DataTransApi;

  systemApi: SystemApi;

  eventApi: EventApi;

  contactApi: ContactAndOrgApi;

  storeApi: DataStoreApi;

  pushApi?: PushHandleApi;

  mailConfApi: MailConfApi;

  name: string;

  // 主账号actions
  actions: ActionStore;
  // 子账号actionMap
  subActions: SubActionsType;

  contactHandler: MailContactHandler;

  modelHandler: MailModelHandler;

  mailContentHandler: MailSendHandler;

  mailOperationHandler: MailSendHandler;

  mailDbHandler: MailContentDbHelper;

  mailCustomerHandler: MailCustomerHelper;

  loggerHelper: DataTrackerApi;

  dataTrackerHelper: DataTrackerApi;

  errReporter: ErrorReportApi;

  mailPraiseApi: MailPraiseApi;

  mailDraftApi: MailDraftApi;

  // 是否可以调用Bridge
  enableExcuteBridge = api.getSystemApi().isElectron();

  mailStrangerApi: MailStrangerApi;

  readonly isMac: boolean = getOs() === 'mac';

  productApi: ProductAuthApi;

  mailTaskApi: TaskMailApi;

  // taskMailMap: TaskInternalMap | null;

  mailMsgCenter: MailMsgCenter;

  accountApi: AccountApi;

  edmRoleApi: EdmRoleApi;

  mailPlusCustomerApi: MailPlusCustomerApi;

  constructor() {
    // 主账号actions
    this.actions = new ActionStore();
    // 子账号actions
    this.subActions = new Map();
    this.modelHandler = new MailModelHandler(this.actions, this.subActions);
    this.contactHandler = new MailContactHandler(this.actions, this.subActions);
    // this.mailContentHandler = new MailContentHandler(this.actions, this.modelHandler, this.contactHandler);
    // 纯本地记录日志
    this.loggerHelper = api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;
    // 既上报又记录日志
    this.dataTrackerHelper = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
    this.mailDbHandler = new MailContentDbHelper(this.actions, this.modelHandler, this.contactHandler, this.subActions);
    this.mailContentHandler = new MailSendHandler(this.actions, this.modelHandler, this.contactHandler, this.mailDbHandler, this.subActions);
    this.mailCustomerHandler = new MailCustomerHelper();
    this.mailOperationHandler = this.mailContentHandler;
    this.db = api.requireLogicalApi(apis.dbInterfaceApiImpl) as DbApiV2;
    this.contactApi = api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactAndOrgApi;
    this.impl = api.getDataTransApi();
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.eventApi = api.getEventApi();
    this.fileApi = api.getFileApi();
    this.mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
    this.pushApi = api.requireLogicalApi(apis.pushApiImpl) as unknown as PushHandleApi;
    this.errReporter = api.requireLogicalApi(apis.errorReportImpl) as unknown as ErrorReportApi;
    this.name = apis.mailApiImpl;
    this.isMailPage = inWindow() ? window.location.pathname.indexOf('writeMail') >= 0 : false;
    this.mailPraiseApi = api.requireLogicalApi(apis.mailPraiseApiImpl) as unknown as MailPraiseApi;
    this.mailDraftApi = api.requireLogicalApi(apis.mailDraftApiImpl) as unknown as MailDraftApi;
    this.mailTaskApi = api.requireLogicalApi(apis.taskMailImplApi) as TaskMailApi;
    this.mailStrangerApi = api.requireLogicalApi(apis.mailStrangerApiImpl) as unknown as MailStrangerApi;
    this.productApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
    this.mailPlusCustomerApi = api.requireLogicalApi(apis.mailPlusCustomerApiImpl) as MailPlusCustomerApi;
    // this.taskMailMap = null;
    this.mailMsgCenter = {
      syncMail: {
        regularMail: { received: false, diff: false },
        // task: { received: false, diff: false },
        // contentMail: { received: false, diff: false },
      },
    };
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    this.edmRoleApi = api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;
    // this.contactApi = undefined;
    // this.sOk = MailApiImpl.sOk;
  }

  private async setMailContentDbCachePath() {
    try {
      const path = await this.getMailCachePath();
      if (path) {
        this.mailDbHandler.setMailCachePath(path);
      }
    } catch (ex) {
      console.error('setMailContentDbCachePath-error', ex);
    }
  }

  // 新建子账号action
  createSubActions(_account: string) {
    // 已存在
    if (this.subActions.has(_account)) {
      return { suc: true, msg: 'existed' };
    }
    this.subActions.set(_account, new ActionStore());
    return { suc: true, msg: 'suc' };
  }

  removeSubActions(_account: string) {
    this.subActions.delete(_account);
  }

  // 获取合适的action
  getActions(params: { actions: ActionStore; subActions?: SubActionsType; _account?: string }) {
    const { actions, subActions, _account } = params;
    if (!_account) {
      return { suc: true, val: actions };
    }
    const targetAccountId = this.accountApi.getEmailIdByEmail(_account);
    if (targetAccountId === '') {
      return { suc: true, val: actions };
    }
    const mainAccountId = this.systemApi.getCurrentUser()?.id;
    if (targetAccountId === mainAccountId) {
      return { suc: true, val: actions };
    }
    const targetActions = subActions?.get(targetAccountId);
    if (targetActions) {
      return { suc: true, val: targetActions };
    }
    return { suc: false, val: null, msg: 'account not existed' };
  }

  // 根据cid获取accountId
  cidGetAccountId(cid: string) {
    return cid.split('&seq&')[0];
  }

  async doCompleteTrustMail(id: string | string[]): Promise<CommonBatchResult> {
    return this.mailContentHandler.doCompleteTrustMail(id);
  }

  // eslint-disable-next-line max-params
  async doReportOrTrustMail(
    id: string | string[],
    fid: number,
    spamType?: string,
    isThread?: boolean,
    needCheckThread = true,
    _account?: string
  ): Promise<CommonBatchResult> {
    if (needCheckThread) {
      const { threadIds, normalIds } = await this.mailDbHandler.classifyThreadMailsByIds(id, undefined, _account);
      const normalPromise = normalIds.length > 0 ? this.doReportOrTrustMail(normalIds, fid, spamType, false, false, _account) : Promise.resolve({ succ: true });
      const threadPromise = threadIds.length > 0 ? this.doReportOrTrustMail(threadIds, fid, spamType, true, false, _account) : Promise.resolve({ succ: true });
      return Promise.all([normalPromise, threadPromise]).then(([v1, v2]) => {
        if (v1 && v2 && v1.succ && v2.succ) {
          return { succ: true };
        }
        return Promise.reject();
      });
    }
    return this.mailContentHandler.doReportOrTrustMail(id, fid, spamType, isThread, _account);
  }

  // getMailAliasAccountListV2(noMail=false): Promise<MailAliasAccountModel[]> {
  //   return this.mailConfApi.doGetMailAliasAccountListV2(noMail);
  // }
  doAdvanceSearchMail(search: MailSearchModel, noCache?: boolean, _account?: string): Promise<MailSearchResult> {
    this.loggerHelper.track('mail_search_advance_start', { search, noCache });
    return this.mailContentHandler.doAdvanceSearchMail(search, noCache, _account);
  }

  // 专门承载 writePageDataExchange
  handleWriteMail(ev: SystemEvent) {
    // 桌面端 主页
    if (inMainPage && inElectron) this.electronMainPageHandleWriteMail(ev);

    // web端 主页
    if (inMainPage && !inElectron) this.webMainPageHandleWriteMail(ev);

    // 桌面端 写信窗口
    if (this.isMailPage && inElectron) this.mailWinHandleWriteMail(ev);

    // web端 其他独立页面-独立读信页-往来邮件-陌生人往来邮件
    if (!inMainPage && !inElectron) this.webMainPageHandleWriteMail(ev);
  }

  // 主页处理写信（electron + web）
  private commonMainPageHandleWriteMail(ev: SystemEvent) {
    const { eventFrom, eventStrData, eventTarget, _account } = ev;
    // 得取主账号 使用主账号action的mailParamMap与paramDispatched(存储独立窗口的webId)
    const targetActions = this.getActions({
      actions: this.actions,
      subActions: this.subActions,
    })?.val;
    // 带有事件发送来源(从独立窗口发来)
    if (eventFrom !== undefined && eventStrData) {
      const webFrom = Number(eventFrom);
      // writePageDataExchange 代表 写信页 electronloaded 即写信页准备完毕
      if (eventStrData === 'writePageDataExchange') {
        // 正式加进去
        // 主窗口下的子窗口
        targetActions?.paramDispatched.add(webFrom);
        // 刚刚新建的窗口 需要初始化
        if (targetActions?.mailParamMap[webFrom]) {
          // 发送初始化initData数据 第2次不会进这个判断了
          this.mailOperationHandler.sendDataToWritePage(targetActions?.mailParamMap[webFrom] as MailEntryModel, webFrom, ev);
          // 及时减去
          delete targetActions?.mailParamMap[webFrom];
        } else {
          // 已存在 不用electron初始化 prepareData
          // 独立窗口重置内容（防止下次打开展示之前内容）
          this.resetWriteMailContent(webFrom, _account);
        }
      }
      // 邮件发送成功 同步草稿箱
      if (['sendSucceed', 'scheduleDateSucceed'].includes(eventStrData)) {
        setTimeout(() => {
          this.eventApi.sendSysEvent({
            eventName: 'mailChanged',
            eventStrData: 'syncDraft',
            eventData: {},
            _account,
          } as SystemEvent);
        }, 1500);
      }
      // 草稿保存成功 同步草稿箱
      if (['saveSucceed', 'autoSaveSucceed'].includes(eventStrData)) {
        setTimeout(() => {
          this.eventApi.sendSysEvent({
            eventName: 'mailChanged',
            eventStrData: 'syncDraft',
            eventData: {},
            _account,
          } as SystemEvent);
        }, 1500);
      }
      if (eventStrData === 'sending') {
        this.mailContentHandler.cleanCacheStatus(_account);
      }
    }

    // 主窗口只承接不带明确指向（由主窗口打开）的写信
    if (eventStrData === 'initData' && !eventTarget) {
      this.handleWriteLatterEvent(ev, false);
    }
  }

  // web主页
  private webMainPageHandleWriteMail(ev: SystemEvent) {
    this.commonMainPageHandleWriteMail(ev);
  }

  // 桌面端主页
  private electronMainPageHandleWriteMail(ev: SystemEvent) {
    this.commonMainPageHandleWriteMail(ev);
  }

  // 写信窗口
  private mailWinHandleWriteMail(ev: SystemEvent) {
    const { eventTarget, eventData, eventStrData, _account } = ev;
    const targetActions = this.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    // 对于写信业务 目前 只接收带目标的(目标是自己)
    if (!eventTarget || !eventData) return;
    if (eventStrData === 'initData') {
      this.handleWriteLatterEvent(ev, false, eventTarget);
      setTimeout(() => {
        this.eventApi
          .sendSysEvent({
            eventName: 'writePageDataExchange',
            eventStrData: 'writePageWindowCreated',
            eventData,
            _account,
          })
          ?.catch(ex => {
            console.error(ex);
          });
      }, 0);
      if (this.systemApi.isElectron()) {
        this.eventApi.registerSysEventObserver('electronClose', {
          func: () => {
            if (targetActions) targetActions.writeMailPageDataReceived = false;
          },
        });
        this.systemApi.addWindowHookConf({
          observerWinId: -1,
          hookObjName: 'mail-hooks-obj',
          intercept: true,
          hooksEventExtraData: { mailPageIntercept: true },
          hooksName: 'onBeforeClose',
        } as WindowHooksObserverConf);
      }
    }
    if (eventStrData === 'prepareData') {
      this.handleWriteLatterEvent(ev, true, eventTarget);
    }
  }

  private resetWriteMailContent(webFrom: number, _account?: string) {
    this.initModel({ mailType: 'common', writeType: 'common', _account }).then(res => {
      this.eventApi
        .sendSysEvent({
          eventName: 'writePageDataExchange',
          eventData: res,
          eventStrData: 'prepareData',
          eventTarget: String(webFrom),
          _account,
        })
        ?.catch(ex => {
          console.error(ex);
        });
    });
  }

  private handleWriteLatterEvent(ev: SystemEvent<any>, prepare: boolean, eventTarget?: string | null) {
    const eventObj = {
      eventName: 'writeLatter',
      eventData: {
        result: { ...ev.eventData, eventTarget },
      },
      eventTarget,
    };
    this.eventApi.sendSysEvent(eventObj as SystemEvent);
    if (prepare) {
      console.log('[mail write] prepare event handle');
    } else if (this.systemApi.isElectron() && window.electronLib) {
      window.electronLib.windowManage.show();
    }
  }

  init(): string {
    if (inWindow()) {
      MailApiImpl.user = this.systemApi.getCurrentUser() || undefined;
      this.modelHandler.init();
      this.eventApi.registerSysEventObserver('mailPushNotify', {
        name: 'mailPushWatcher',
        func: async (ev: SystemEvent) => {
          if (ev) {
            if (ev.eventStrData === 'notify') {
              // 查找当前账号对应的accountid是否在子账号中存在
              const subAccounts = await this.accountApi.getSubAccounts();
              const currentSubAccount = subAccounts.find(item => this.systemApi.md5(item.id || '----') === (ev.eventData?.accountId || ''));
              // 如果存在代理到账号后台
              // if (currentSubAccount) {
              //   this.accountApi.setCurrentAccount({
              //     email: currentSubAccount!.id,
              //   });
              // }
              this.doUpdateMailBoxStat('push', ev.eventData, currentSubAccount?.id).then();
            }
          }
        },
      });
      // API层接收writePageDataExchange
      this.eventApi.registerSysEventObserver('writePageDataExchange', {
        name: 'writeMailLogicalOb',
        func: this.handleWriteMail.bind(this),
      });
      // 独立窗口借助主窗口写信
      this.eventApi.registerSysEventObserver('openWritePageFromMain', {
        name: 'mailOpenWritePageFromMain',
        func: ev => {
          if (this.systemApi.isMainPage()) {
            const account = ev._account;
            // if (account) {
            //   this.accountApi.setCurrentAccount({ email: account });
            // }
            // eventData包含_acount
            this.callWriteLetterFunc({ _account: account, ...ev.eventData });
          }
        },
      });
      const mailContentFilter = (it: resultObject) => {
        const mail = it as EntityMailStatus;
        return mail.folder !== mailBoxOfDeleted.id;
      };
      const mailContentFolderFilter = (it: resultObject) => {
        const mail = it as EntityMailStatus;
        return mail.folder !== mailBoxOfDeleted.id && mail.folder !== mailBoxOfDraft.id && mail.folder !== mailBoxOfSpam.id;
      };
      this.db.addFilterRegistry({
        name: mailContentFilterName,
        filterFunc: mailContentFilter,
      });
      this.db.addFilterRegistry({
        name: mailContentFolderFilterName,
        filterFunc: mailContentFolderFilter,
      });
      // 注册邮件属性对应的筛选器
      this.registerMailAttrFilter();
      this.registerTpMailFilter();

      const mailDbCommonQueryFilter = (it: resultObject, query?: QueryConfig) => {
        const mail = it as EntityMailStatus;

        if (query && query.additionalData && 'isThread' in query.additionalData && query?.additionalData?.isThread === 1) {
          return it.isThread && mail.folder === mailBoxOfFakeThread.id;
        }
        return !it.isThread && mail.folder !== mailBoxOfDeleted.id;
      };
      this.db.addFilterRegistry({
        name: mailDbCommonQueryFilterName,
        filterFunc: mailDbCommonQueryFilter,
      });
      const localSearchDataFilter = (item: resultObject, query?: QueryConfig) => {
        if (!query?.additionalData?.searchType || query?.additionalData?.isThread === undefined || !query?.additionalData?.key) {
          return false;
        }
        const data = item as EntityMailData;
        if (data.isThread !== query.additionalData.isThread) {
          return false;
        }
        // 原来filter方法逻辑
        return this.mailContentHandler.getSearchDataCondition(data, query?.additionalData?.key.toLowerCase(), query?.additionalData?.searchType || 'all');

        // const resultBySearchType = this.mailContentHandler.getSearchDataCondition(
        //   data,
        //   query?.additionalData?.key.toLowerCase(),
        //   query?.additionalData?.searchType || 'all',
        // );
        // if (!resultBySearchType) {
        //   return false;
        // }
        // const resultByFilter = this.mailContentHandler.getSearchDataFilter(
        //   data,
        //   query?.additionalData
        // );
        // return resultByFilter
      };
      this.db.addFilterRegistry({
        name: localSearchDataFilterName,
        filterFunc: localSearchDataFilter,
      });
      const mailSearchAttachmentFilter = (item: resultObject, query?: QueryConfig) => {
        if (!query?.additionalData?.searchType || query?.additionalData?.isThread === undefined || !query?.additionalData?.key) {
          return false;
        }
        const data = item as EntityMailAttachment;
        console.log('1111mailSearchAttachmentFilter', data, query?.additionalData);
        if (data.isThread !== query?.additionalData?.isThread) {
          return false;
        }
        return util.testArrayContainsKey(query?.additionalData?.key, data.attachmentNames);
      };
      this.db.addFilterRegistry({
        name: mailSearchAttachmentFilterName,
        filterFunc: mailSearchAttachmentFilter,
      });
      const mailAttachmentOfContentFilter = (item: resultObject, query?: QueryConfig) => {
        if (!query?.additionalData?.searchType || query?.additionalData?.isThread === undefined || !query?.additionalData?.key) {
          return false;
        }
        const data = item as EntityMailContent;
        console.log('1111mailAttachmentOfContentFilter', data, query?.additionalData);
        if (data.isThread !== query?.additionalData?.isThread) {
          return false;
        }
        return (
          util.testArrayContainsKey(query?.additionalData?.key, data.ccContactName) ||
          util.testArrayContainsKey(query?.additionalData?.key, data.ccEmail) ||
          util.testArrayContainsKey(query?.additionalData?.key, data.bccContactName) ||
          util.testArrayContainsKey(query?.additionalData?.key, data.bccEmail)
        );
      };
      this.db.addFilterRegistry({
        name: mailAttachmentOfContentFilterName,
        filterFunc: mailAttachmentOfContentFilter,
      });
      this.impl.addConfig({
        matcher: /^(\/lx-web)?\/(?:(?:bj)?js6)|(?:upxmail)|(?:corp-mail)|(?:todo\/api\/biz\/taskEmail)|(?:praise-mail\/reward\/person\/praise)\/.*/i,
        requestAutoReLogin: (data: ApiResponse<ResponseData>) => !!data.data && !!data.data.code && data.data.code in reLoginCodeList,
        reLoginUrlHandler: conf => {
          const subAccount = this.impl.getSubAccountByReqConfig(conf);
          const originUrl = conf.url;
          const currentUser = this.systemApi.getCurrentUser(!subAccount ? '' : subAccount);
          if (currentUser) {
            conf.url = conf.url?.replace(this.sidRegexp, 'sid=' + currentUser.sessionId);
          }
          console.log('mail_re_login_change_url', {
            originUrl,
            url: conf.url,
            sid: currentUser?.sessionId,
          });
          return conf;
        },
        cachePolicyGenerator: config => {
          const mainRq: Partial<ApiRequestConfig> = {
            url: config.url?.replace(this.sidRegexp, ''),
            data: config.contentType === 'stream' ? new Date().getTime() : config.data,
            method: config.method,
          };
          const cacheKey = this.systemApi.md5(JSON.stringify(mainRq), true);
          return { cacheKey };
        },
        canCache: (data: ApiResponse<ResponseData>) => !!data.data && !!data.data.code && data.data.code === MailContentHandler.sOk,
        // requestAutoCache(data: ApiRequestConfig): boolean {
        //   if (data.contentType === 'stream') return false;
        //   for (let it of that.mailContentHandler.cacheUrlKey) {
        //     if (data.url && data.url.indexOf(it) > 0) {
        //       return true;
        //     }
        //   }
        //   return false;
        // },
      });

      // 每20分钟整体扫描一次本地邮件
      if (isElectron()) {
        // electron 是在后台页面
        if (window.location.pathname.includes('api_data_init')) {
          // 17版本智能模式下线，陌生人不在计算
          // this.systemApi.intervalEvent({
          //   id: 'loopScanLocalMails',
          //   eventPeriod: 'extLong',
          //   seq: 0,
          //   handler: ev => {
          //     if (ev.seq % 2 === 0 && ev.seq > 0) this.scanMailsSetStrangers();
          //   },
          // });
          this.eventApi.registerSysEventObserver('contactNotify', {
            func: (ev: SystemEvent<unknown>) => {
              // 屏蔽多账号场景下 账号互串查询的问题
              if (MailApiImpl.user && ev && ev._account !== MailApiImpl.user.id) {
                return;
              }
              console.log('contactNotify', ev);
              // 通讯录未准备完毕
              if (!this.contactReady) {
                this.contactReady = true;
                // 17版本智能模式下线，陌生人不在计算
                // setTimeout(() => {
                //   this.scanMailsSetStrangers();
                // }, 30 * 1000);
              }
              // 17版本智能模式下线，陌生人不在计算
              // setTimeout(() => {
              //   this.contactNotityEmailListChange(ev);
              // });
            },
          });
        }
      } else if (this.systemApi.isMainPage()) {
        // web是在主页面
        // 17版本智能模式下线，陌生人不在计算
        // this.systemApi.intervalEvent({
        //   id: 'loopScanLocalMails',
        //   eventPeriod: 'extLong',
        //   seq: 0,
        //   handler: ev => {
        //     if (ev.seq % 2 === 0 && ev.seq > 0) this.scanMailsSetStrangers();
        //   },
        // });
        this.eventApi.registerSysEventObserver('contactNotify', {
          func: () => {
            // 通讯录未准备完毕
            if (!this.contactReady) {
              this.contactReady = true;
              // 17版本智能模式下线，陌生人不在计算
              // setTimeout(() => {
              //   this.scanMailsSetStrangers();
              // }, 30 * 1000);
              // return;
            }
            // 17版本智能模式下线，陌生人不在计算
            // setTimeout(() => {
            //   this.contactNotityEmailListChange(ev);
            // });
          },
        });
      }

      // 2分钟后开始进行文件自动下载
      const isLowMemoryMode = this.systemApi.getIsLowMemoryModeSync();
      const isBgPage = window.isBridgeWorker;
      // 开启自动下载和清理过期邮件的任务扫描的条件
      // 1 必须在后台执行
      // 2 不能是低内存模式（没有后台）
      if (inWindow() && !isLowMemoryMode && isBgPage) {
        if (isElectron()) {
          setTimeout(() => {
            console.warn('[file auto download] started in background page');
            this.doAutoSaveFilesInMail().then();
          }, MailApiImpl.SAVE_FILES_WAIT);
        }
        // 开启自动清理过期过期邮件的扫描任务
        this.systemApi.intervalEvent({
          seq: 0,
          eventPeriod: 'extLong',
          id: 'clearExpiredMailsTimer',
          handler: () => {
            this.clearExpiredMails().catch();
          },
        });
      }

      // 添加本地打开 eml 的监听
      if (process.env.BUILD_ISELECTRON && inWindow() && this.systemApi.isMainWindow()) {
        const currentUser = this.systemApi.getCurrentUser();
        if (currentUser) {
          this.getEmlFilePaths().then(emlFilePaths => {
            if (!emlFilePaths || !emlFilePaths.length) return;
            this.resetEmlFilePaths().catch();
            this.openEmlMails(emlFilePaths).catch();
          });

          this.getSendFilePaths().then(sendFilePaths => {
            if (!sendFilePaths || !sendFilePaths.length) return;
            this.resetSendFilePaths();
            this.handleSendFileAsAttachment(sendFilePaths);
          });
        }
        window.electronLib.windowManage.addOpenFileListener(async fileInfos => {
          const currentUser = this.systemApi.getCurrentUser();
          if (currentUser) {
            // 有登录态，直接打开即可
            if (fileInfos.type === 'open') {
              this.openEmlMails(fileInfos.paths).catch(e => {
                console.warn('[open eml] error', e);
              });
            } else if (fileInfos.type === 'send') {
              this.handleSendFileAsAttachment(fileInfos.paths);
            }
          } else {
            // 没有登录态，存储到emlFilePaths中
            if (fileInfos.type === 'open') {
              let emlFilePaths = await this.getEmlFilePaths();
              if (!emlFilePaths) {
                emlFilePaths = [];
              }
              emlFilePaths.push(...fileInfos.paths);
              this.storeEmlFilePaths(emlFilePaths).catch();
            } else if (fileInfos.type === 'send') {
              this.storeSendFilePaths(fileInfos.paths);
            }
          }
        });
      }

      // // 客户未读数自动刷新
      // if (process.env.BUILD_ISEDM && inWindow() && this.systemApi.isMainPage()) {
      //   this.syncCustomerUnread();
      // }
    }
    return this.name;
  }

  private async storeEmlFilePaths(filePaths: string[]) {
    await window.electronLib.storeManage.set('memory', 'emlFilePaths', filePaths);
  }

  private async storeSendFilePaths(filePaths: string[]) {
    await window.electronLib.storeManage.set('memory', 'sendFilePaths', filePaths);
  }

  private registerMailAttrFilter() {
    const mailAttrFilter = (item: resultObject, query?: QueryConfig) => {
      const data = item as EntityMailAttr;
      const { exchangeType, filterValue } = query?.additionalData || {};
      if (!exchangeType || !Array.isArray(filterValue) || filterValue.length === 0) {
        return true;
      }
      const fromHasValue = (data.filterValues.from || []).some(v => filterValue.includes(v));
      // 我发出的，from 里面必定有我自己
      if (exchangeType === 'send') {
        return fromHasValue;
      }
      if (exchangeType === 'receive') {
        // 我收到的，from 里没有我，肯定是我收到的
        if (!fromHasValue) {
          return true;
        }
        // 如果 from 里有我，那么 to、cc 和 bcc里面，也必须有我，才是我收到的（就是自己发给自己的邮件）
        // TODO：但是因为拿不到完整的 cc 和 bcc，那么自己抄送或者密送给自己的判断会有问题
        return (data.filterValues.to || []).some(v => filterValue.includes(v));
      }
      return true;
    };
    this.db.addFilterRegistry({
      name: mailAttrFilterName,
      filterFunc: mailAttrFilter,
    });
  }

  private registerTpMailFilter() {
    const isValidToList = (toList?: string[]): toList is string[] => Array.isArray(toList) && toList.length > 0;
    const sendFilter = (data: EntityTpMail, from: string, toList?: string[]) => {
      const fromIsSender = data.entryModel.sender.contact.contact.accountName === from;
      const toIsReceiver = isValidToList(toList) ? data.entryModel.receiver.some(v => toList.includes(v.contact.contact.accountName)) : true;
      return fromIsSender && toIsReceiver;
    };
    const receiveFilter = (data: EntityTpMail, from: string, toList: string[]) => {
      const fromIsReceiver = data.entryModel.receiver.some(v => v.contact.contact.accountName === from);
      const toIsSender = isValidToList(toList) ? toList.includes(data.entryModel.sender.contact.contact.accountName) : true;
      return fromIsReceiver && toIsSender;
    };
    const tpMailFilter = (item: resultObject, query?: QueryConfig) => {
      const { exchangeType, toList, from } = (query?.additionalData as TpMailListQuery) || {};
      if (!exchangeType && !isValidToList(toList)) {
        return true;
      }
      const data = item as EntityTpMail;
      if (!exchangeType) {
        return sendFilter(data, from, toList) || receiveFilter(data, from, toList);
      }
      if (exchangeType === 'send') {
        return sendFilter(data, from, toList);
      }
      return receiveFilter(data, from, toList);
    };
    this.db.addFilterRegistry({
      name: tpMailFilterName,
      filterFunc: tpMailFilter,
    });
  }

  private async resetEmlFilePaths() {
    await window.electronLib.storeManage.set('memory', 'emlFilePaths', []);
  }

  private async getEmlFilePaths(): Promise<string[] | null> {
    const emlFilePaths: string[] = await window.electronLib.storeManage.get('memory', 'emlFilePaths');
    return emlFilePaths && emlFilePaths.length ? emlFilePaths : null;
  }

  private async getSendFilePaths(): Promise<string[] | null> {
    const sendFilePaths: string[] = await window.electronLib.storeManage.get('memory', 'sendFilePaths');
    return sendFilePaths && sendFilePaths.length ? sendFilePaths : null;
  }

  private async resetSendFilePaths() {
    try {
      await window.electronLib.storeManage.set('memory', 'sendFilePaths', []);
    } catch (ex) {
      console.error('resetSendFilePaths-catch', ex);
    }
  }

  private async doAutoSaveFilesInMail(): Promise<void> {
    return this.mailDbHandler.saveFilesInMail(true).catch(err => {
      console.warn('[file auto download] error', err);
    });
  }

  async mkDownloadDir(type: 'inline' | 'regular', config: { fid: number; mid: string; _account?: string }, fallbackToDefault?: boolean): Promise<string> {
    return this.mailDbHandler.mkDownloadDir(type, config, fallbackToDefault);
  }

  sendMailRefreshMessage(data?: Partial<queryMailBoxParam>, checkType?: queryMailBoxParam['checkType'], diff?: boolean, _account?: string) {
    console.log('[mail msg] sendMailRefreshMessage', data, checkType, diff, _account);
    const eventData = data ? { ...data, checkType, diff } : { checkType, diff };
    // storeMailOps.updateMailModelEntriesFromDb(data);
    this.eventApi.sendSysEvent({
      eventName: 'mailStoreRefresh',
      eventStrData: 'refreshFromDb',
      eventData,
      _account,
    });
  }

  // 邮件消息中心
  doCallMailMsgCenter(params: MailMsgCenterParams, _account?: string) {
    const refreshType = params.msgCenter?.refreshType;
    const msgType = params.type;
    const msgData = params.data;

    console.log('[mail msg center] received ', params, refreshType);
    if (!params.msgCenter?.merge) {
      // if (params.msgCenter?.diff) {
      this.sendMailRefreshMessage(msgData, params.checkType, params.msgCenter?.diff, _account);
      // }
      console.log('[mail msg center] immediate sent ' + refreshType, params, this.mailMsgCenter);
      return;
    }
    const refreshTypes = Object.keys(this.mailMsgCenter[msgType]);
    if (refreshType && refreshTypes.includes(refreshType)) {
      this.mailMsgCenter[msgType][refreshType as MailRefreshTypes] = {
        received: true,
        diff: !!params.msgCenter?.diff,
      };
      const { allReceived, diff } = this.checkMsgCenter(msgType);
      if (allReceived) {
        // if (diff) {
        this.sendMailRefreshMessage(msgData, params.checkType, diff, _account);
        console.log(`[mail msg center] all received and diff:${diff}, controlled sent ` + refreshType, params, this.mailMsgCenter);
        // } else {
        //   console.log(
        //     '[mail msg center] all received but no diff ' + refreshType,
        //     params,
        //     this.mailMsgCenter
        //   );
        // }
        // 加延时是为了吸收消息多发导致的错误累计
        setTimeout(() => {
          this.resetMsgCenter(msgType);
        }, 500);
      } else {
        console.log('[mail msg center] waiting other message ', params, this.mailMsgCenter);
      }
    } else {
      this.sendMailRefreshMessage(msgData, params.checkType, true, _account);
      console.log('[mail msg center] uncontrolled sent ' + refreshType, params, this.mailMsgCenter);
    }
  }

  private checkMsgCenter(msgType: MailMsgCenterTypes) {
    const msgCenter = this.mailMsgCenter[msgType];
    const targets = Object.keys(msgCenter) as MailRefreshTypes[];
    return {
      allReceived: targets.every(key => msgCenter[key].received),
      diff: targets.some(key => msgCenter[key].diff),
    };
  }

  private resetMsgCenter(msgType: MailMsgCenterTypes) {
    const msgCenter = this.mailMsgCenter[msgType];
    (Object.keys(msgCenter) as MailRefreshTypes[]).forEach(key => {
      this.mailMsgCenter[msgType][key] = {
        received: false,
        diff: false,
      };
    });
  }

  readonly sidRegexp = /sid=[^&]+/i;

  afterInit() {
    try {
      // 初始化时新增子账号Cache
      const subAccounts: ISubAccountEmailOnlyInfo[] = this.storeApi.getSubAccountList();
      if (subAccounts?.length > 0) {
        subAccounts.forEach((subAccount: ISubAccountEmailOnlyInfo) => this.createSubActions(subAccount.email));
      }
    } catch (error) {
      console.log('获取子账号并设置 error', error);
    }
    this.contactReady = false;
    if (this.systemApi.getCurrentUser()) {
      this.db.initDb(this.dbName as DBList);
      this.initData();
      startWatchMailMessage();
    }
    return this.name;
  }

  private async startWatchMail() {
    if (this.systemApi.isMainPage()) {
      const currentUser = this.systemApi.getCurrentUser();
      if (currentUser && currentUser.sessionId) {
        await wait(10000);
        this.doUpdateMailBoxStatCall('default').then(console.log).catch(console.warn);
      }
      this.systemApi.intervalEvent({
        seq: 1,
        eventPeriod: 'long',
        id: 'mailSync',
        handler: ev => {
          console.log('[mail sync] interval long event:', ev);
          const currentUserInterval = this.systemApi.getCurrentUser();
          if (currentUserInterval && currentUserInterval.sessionId) {
            MailApiImpl.user = currentUserInterval;
            // MailApiImpl.sid = currentUser.sessionId;
            if (ev.seq % 2 === 0 && ev.seq > 3) {
              this.doUpdateMailBoxStatCall('time').then();
            }
            if (ev.seq % 3 === 0 && ev.seq > 3) {
              if (currentUserInterval && this.pushApi) {
                this.pushApi.registerPush(currentUserInterval);
              }
            }
          }
        },
      });
    } else if (window.location.pathname.indexOf('writeMail')) {
      // this.systemApi.intervalEvent(
      //   {
      //     seq: 1,
      //     eventPeriod: 'mid',
      //     id: 'mailSync',
      //     handler: () => {
      //       const currentUser = this.systemApi.getCurrentUser();
      //       if (!currentUser) {
      //         // this.systemApi.closeWindow(true);
      //       }
      //     },
      //   },
      // );
    }
  }

  private async getPraiseMedals() {
    const response = await this.mailPraiseApi.getMedals();
    this.actions.praiseMedals = response.data?.medals || [];
  }

  // watchLogin(ev: SystemEvent): void {
  //   if (ev && ev.eventData) {
  //
  //   } else {
  //   }
  // }
  onPathChange(ev?: ApiLifeCycleEvent) {
    if (ev?.curPath?.pathname === '/') {
      const currentUser = this.systemApi.getCurrentUser();
      if (currentUser) {
        this.db.initDb(this.dbName as DBList);
        this.initData();
      }
    }
    return this.name;
  }

  afterLogin(ev?: ApiLifeCycleEvent) {
    if (!ev || !ev.data) {
      return this.name;
    }
    const user = ev.data?.eventData as User;
    // MailApiImpl.sid = user.sessionId;
    // MailAbstractHandler.sid = user.sessionId;
    MailApiImpl.user = user;
    // if (inWindow() && window.electronLib && this.actions.needSendWriteMail) {
    //   console.log('******** init model after login');
    //   window.electronLib.windowManage.exchangeData({
    //     data: {
    //       data: undefined,
    //       eventStrData: 'writeMail',
    //       eventName: 'writeLatter',
    //       eventSeq: 0,
    //     } as SystemEvent,
    //   }).then(
    //     () => {
    //       console.log('**********send write dmail page inited ');
    //     },
    //   );
    // }
    // this.eventApi.sendSysEvent({
    //   eventName: 'mailChanged',
    //   eventData: '1',
    //   eventSeq: 0,
    //   eventStrData: '',
    // });
    this.db.initDb(this.dbName as DBList);
    this.initData();
    // 17版本智能模式下线，陌生人不在计算
    // if (isElectron()) {
    //   // electron 是在后台页面
    //   if (window.location.pathname.includes('api_data_init')) {
    //     this.systemAccountsIntoEmailList();
    //   }
    // } else if (this.systemApi.isMainPage()) {
    //   this.systemAccountsIntoEmailList();
    // }
    return this.name;
  }

  initData() {
    console.log('initModule send mail');
    this.eventApi.sendSysEvent({
      eventName: 'initModule',
      eventStrData: 'mail',
    });
  }

  beforeLogout() {
    // MailApiImpl.sid = undefined;
    // MailAbstractHandler.sid = undefined;
    MailApiImpl.user = undefined;
    this.actions = new ActionStore();
    this.db.closeSpecific(this.dbName as DBList);
    this.pushApi?.triggerNotificationInfoChange({
      action: 'mail_clear',
      content: '',
      num: 0,
      title: '',
    });
    return this.name;
  }

  afterLoadFinish() {
    this.contactReady = false;
    if (inWindow()) {
      this.setMailContentDbCachePath();
      this.modelHandler.initEntryFromStore().then().catch(console.warn);
      this.startWatchMail().then().catch();
      const h: MailContentDbHelper = this.mailDbHandler as MailContentDbHelper;
      this.getPraiseMedals().then().catch();
      try {
        h.initDbEnable();
      } catch (e) {
        console.warn(e);
      }
    }
    // 17版本智能模式下线，陌生人不在计算
    // if (isElectron()) {
    //   // electron 是在后台页面
    //   if (window.location.pathname.includes('api_data_init')) {
    //     this.systemAccountsIntoEmailList();
    //   }
    // } else if (this.systemApi.isMainPage()) {
    //   this.systemAccountsIntoEmailList();
    // }
    // 子账号新增 添加store
    this.eventApi.registerSysEventObserver('SubAccountAdded', {
      name: 'SubAccountAdded-MailImpl',
      func: ev => {
        if (ev && ev.eventData) {
          const { eventData } = ev;
          const { subAccount } = eventData;
          if (subAccount && !this.subActions.has(subAccount)) {
            this.subActions.set(subAccount, new ActionStore());
          }
        }
      },
    });
    // 子账号删除 删除store
    this.eventApi.registerSysEventObserver('SubAccountDeleted', {
      name: 'SubAccountDeleted-MailImpl',
      func: ev => {
        if (ev && ev.eventData) {
          const { eventData } = ev;
          const { subAccount } = eventData;
          if (subAccount && this.subActions.has(subAccount)) {
            this.subActions.delete(subAccount);
          }
        }
      },
    });
    return this.name;
  }

  /**
   * 只有写信页面会调用此接口
   */
  electronLoaded() {
    const currentUser = this.systemApi.getCurrentUser();
    if (!currentUser) {
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'window',
          popupLevel: 'info',
          title: '账号状态错误，请稍后重启写信窗口',
          code: 'PARAM.ERR',
          confirmCallback: () => {
            this.systemApi.closeWindow(true);
          },
        } as PopUpMessageInfo,
        eventSeq: 0,
      });
    }
    if (inWindow() && window.electronLib && this.isMailPage) {
      console.log('[mail] ******* init write page ui called loaded;');
      this.eventApi.sendSimpleSysEvent('writePageDataExchange')?.catch(ex => {
        console.error(ex);
        this.errReporter.doReportMessage({
          error: '写信页面，初始化写信数据发送失败：' + ex.message,
          data: '',
          id: '',
        });
      });
    }
  }

  private getNeedCheckThread(needCheckThread?: boolean): boolean {
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    if (isCorpMail) {
      return false;
    }
    return !!needCheckThread;
  }

  async doListThreadMailBoxEntities(param: queryMailBoxParam, noCache?: boolean, _account?: string): Promise<MailModelEntries> {
    // corpMail暂不支持缓存
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    if (isCorpMail) {
      noCache = true;
    }

    const result = (await this.doListMailBoxEntities({ ...param, returnModel: true, checkType: 'checkThread', _account }, noCache)) as MailModelEntries;
    const newData = result.data.filter(v => {
      if (v.isThread) {
        return v.entry.threadMessageCount > 0;
      }
      return true;
    });
    const validCount = result.data.length - newData.length;
    result.data = newData;
    result.total -= validCount;
    return result;
  }

  // 疑似废弃
  async doGetMailByReplyMId(mid: string): Promise<MailEntryModel> {
    if (!this.actions.mailEntryCache) {
      await this.modelHandler.initEntryFromStore();
    }
    if (this.actions.mailEntryCache) {
      const entryCache: NumberTypedMap<MailEntryModel> = this.actions.mailEntryCache;
      const entry = Object.entries(entryCache)
        .filter(([, val]) => val.id === mid)
        .pop();
      if (entry && entry.length === 2) {
        return entry[1];
      }
    }
    return Promise.reject(new Error('无法找到合适的邮件'));
  }

  buildRawContactItem(item?: ParsedContact): MailBoxEntryContactInfoModel {
    return this.contactHandler.buildRawContactItem(item);
  }

  callWriteLetterFunc(params: WriteMailInitModelParams): WriteMailInitModelParams {
    return this.mailOperationHandler.callWriteLetterFunc(params);
  }

  doCancelCompose(cid: string, deleteDraft?: boolean, _account?: string): Promise<string> {
    return this.mailOperationHandler.doCancelCompose(cid, deleteDraft, _account);
  }

  async doCheckReadStatus(mid: string, _account?: string): Promise<MailDeliverStatus> {
    const statusNetWork = await this.mailOperationHandler.doCheckReadStatus(mid, _account);
    const mailEntryDB = await this.mailDbHandler.getMailById({
      id: mid,
      noContent: true,
      noAttachment: true,
      noContact: true,
      _account,
    });
    if (mailEntryDB && mailEntryDB.length === 1) {
      let readCountNetWork = 0;

      // 尊享版
      if (this.productApi.doGetProductVersionId() === 'sirius') {
        const stateTrack = this.storeApi.getSync('stateTrack').data;
        // 域外追踪如果关闭 域外的阅读状态视为未知
        if (stateTrack === 'OFF') {
          // 内域列表
          const domainList = lodashGet(this.systemApi.getCurrentUser(_account), 'prop.domainList', []);
          readCountNetWork = (statusNetWork?.detail || []).filter((item: MailDeliverStatusItem) => {
            const { email, result } = item;
            if (result !== 109) return false;
            if (email) {
              const suffix = email.split('@')[1];
              // 外域
              if (suffix && !domainList.includes(suffix)) {
                return false;
              }
              return true;
            }
            return true;
          }).length;
        } else {
          // 远端已读数目
          readCountNetWork = statusNetWork?.detail.filter(i => i.result === 109).length;
        }
      } else {
        // 远端已读数目
        readCountNetWork = statusNetWork?.detail.filter(i => i.result === 109).length;
      }
      const readCountDB = mailEntryDB[0]?.entry?.readCount;
      // 已读发生变化
      if (readCountNetWork !== readCountDB) {
        console.log('[mail] readCount is different from DB');
        // 同步下总数和已读数，防止总数为0的情况
        mailEntryDB[0].entry.readCount = readCountNetWork;
        mailEntryDB[0].entry.rcptCount = statusNetWork?.detail.length;
        this.saveMails(mailEntryDB[0], undefined, undefined, _account).then(() => {
          // 同步界面标记,此处同步事件有问题todo,所以页面尚未同步最新数据
          this.doCallMailMsgCenter(
            {
              data: { id: mailBoxOfSent.id },
              type: 'syncMail',
              msgCenter: {
                diff: true,
              },
            },
            _account
          );
        });
      }
    }
    return Promise.resolve(statusNetWork);
  }

  doGetMailReadCount(params: ReqMailReadCount): Promise<any> {
    return this.mailContentHandler.doGetMailReadCount(params);
  }

  doGetMailReadDetail(params: ReqMailReadDetail): Promise<any> {
    return this.mailContentHandler.doGetMailReadDetail(params);
  }

  checkReadStatusOfSentMail(result: MailEntryModel[] | MailModelEntries, param: queryMailBoxParam): Promise<any> {
    return this.mailContentHandler.checkReadStatusOfSentMail(result, param);
  }

  getThumbUpInfo(mid: string, tid?: string, page?: number, _account?: string): Promise<MailEmoticonInfoModel> {
    return this.mailOperationHandler.getThumbUpInfo(mid, tid, page, _account);
  }

  setThumbUpCreate(params: EmoticonCreateModel): Promise<MailEmoticonInfoModel> {
    return this.mailOperationHandler.setThumbUpCreate(params);
  }

  // 获取邮箱快捷设置配置
  getMailConfig(): Promise<MailConfigQuickSettingModel> {
    return this.mailOperationHandler.getMailConfig();
  }

  // 设置邮箱快捷设置配置
  setMailConfig(params: MailConfigQuickSettingModel): Promise<boolean> {
    return this.mailOperationHandler.setMailConfig(params);
  }

  // 获取邮箱默认抄送密送
  getDefaultCCBCC(): Promise<MailConfigDefaultCCBCCModel> {
    return this.mailOperationHandler.getDefaultCCBCC();
  }

  // 设置邮箱默认抄送密送
  setDefaultCCBCC(params: MailConfigDefaultCCBCCModel): Promise<boolean> {
    return this.mailOperationHandler.setDefaultCCBCC(params);
  }

  // 触发三方邮箱收信插队
  triggerReceive(params: { folderId: number; _account?: string }): Promise<boolean> {
    return this.mailOperationHandler.triggerReceive(params);
  }

  async getAuthCodeDesc(): Promise<AuthCodeDesc[]> {
    return this.mailOperationHandler.getAuthCodeDesc();
  }

  // 通过邮箱获取邮箱配置
  async guessUserSetting(email: string): Promise<GuessUserSettingModel | null> {
    return this.mailOperationHandler.guessUserSetting(email);
  }

  async updateDisplayEmail(params: { bindEmail: string; bindUserName: string }): Promise<AuthCodeDesc[]> {
    return this.mailOperationHandler.updateDisplayEmail(params);
  }

  async getDisplayName(emailList: string[]): Promise<AuthCodeDesc[]> {
    return this.mailOperationHandler.getDisplayName(emailList);
  }

  doDeleteAttachment(params: { cid: string; attachId: number; _account?: string }): Promise<DeleteAttachmentRes> {
    const { cid, attachId, _account } = params;
    return this.mailOperationHandler.doDeleteAttachment({ cid, attachId, attachmentObj: undefined, _account });
  }

  async doEditMail(id: string, payload?: DoWriteMailPayload): Promise<WriteMailInitModelParams> {
    const { draft, noPopup, _account } = payload || {};
    if (!noPopup) {
      mailPerfTool.writeMail('start', {
        writeType: draft ? 'editDraft' : 'edit',
      });
    }
    const mailType = await this.doGetMailTypeById(id, _account);
    const isThread = mailType === 'thread';
    return this.mailOperationHandler.doEditMail(id, { draft, noPopup, isThread, _account });
  }

  async doExportMail(mailId: string | string[], fileName: string, dialogConfirmText?: string, _account?: string): Promise<LoaderResult | FsSaveRes> {
    const { threadIds, normalIds } = await this.mailDbHandler.classifyThreadMailsByIds(mailId, true, _account);
    const MAIL_EXPORT_LIMIT = 100;
    if (normalIds.length > MAIL_EXPORT_LIMIT) {
      return Promise.reject(new Error(getIn18Text('DAOCHUSHULIANGCHAO1', { count: MAIL_EXPORT_LIMIT })));
    }
    const { threadMessages } = await this.mailDbHandler.getThreadMessageByThreadIds(threadIds, _account);
    if (threadMessages.length > 2000) {
      return Promise.reject(new Error(getIn18Text('DAOCHUSHULIANGCHAO2')));
    }
    const messageIds = threadMessages.map(v => v.mid);
    const ids = [...messageIds, ...normalIds];
    const oneMailExport = ids.length === 1;
    const manyMailExport = ids.length > 1;
    const processFileName = fileName.replace(/<\s*b\s*>/gi, '').replace(/<\s*\/b\s*>/gi, '');
    // 目前无混合导出聚合邮件与普通邮件的情况，以下为electron中的导出名称规则
    let leftFileName = processFileName || '无主题';
    // 聚合：单封邮件：主题 + 时间 + .eml ；多封邮件：主题 + '的所有邮件' + 时间 + .zip
    const language = getIn18Text('SUOYOUYOUJIAN');
    const languageType = language.length === 5 ? 'zh' : 'en';
    const suffix = languageType === 'zh' ? `${leftFileName}${language}` : `${language}${leftFileName}`;
    leftFileName = messageIds.length > 1 ? suffix : leftFileName;
    // 普通：单封邮件：主题 + 时间 + .eml ；多封邮件：'信件打包' + 时间 + .zip
    const text = getIn18Text('XINJIANDABAO');
    leftFileName = normalIds.length > 1 ? text : leftFileName;
    const fullFileName = `${leftFileName}${util.dateFormat(new Date(), 'yyyyMMdd')}`;
    if (oneMailExport) {
      return this.mailOperationHandler.doExportMailAsEml(ids[0], fullFileName, dialogConfirmText, _account);
    }
    if (manyMailExport) {
      return this.mailOperationHandler.doExportGroupMailAsZip(ids, fullFileName, dialogConfirmText, _account);
    }
    return Promise.reject(new Error(getIn18Text('YOUJIANDAOCHUSHI')));
  }

  doExportMailAsEml(id: string, fileName: string, _account?: string) {
    return this.mailOperationHandler.doExportMailAsEml(id, fileName, _account);
  }

  async doExportThreadMailAsZip(threadId: string[], fileName: string, _account?: string) {
    const threadIds = Array.isArray(threadId) ? threadId : [threadId];
    const results = (await this.db.getByIds(mailTable.status, threadIds, _account)) as EntityMailStatus[];
    if (results.length > 0) {
      const ids = results.reduce<string[]>((t, v) => {
        const tempIds = Array.isArray(v.threadMessageIds) ? v.threadMessageIds : [];
        return [...t, ...tempIds];
      }, []);
      return this.mailOperationHandler.doExportGroupMailAsZip(ids, fileName, _account);
    }
    return Promise.reject(new Error('聚合邮件列表获取失败'));
  }

  async doGetMailTypeById(id: string, _account?: string): Promise<MailTypes> {
    const { thread, normal } = await this.doGetMailTypeByIds([id], _account);
    if (Array.isArray(thread) && thread.includes(id)) {
      return 'thread';
    }
    if (Array.isArray(normal) && normal.includes(id)) {
      return 'normal';
    }
    return Promise.reject(new Error('邮件不存在'));
  }

  async doGetMailTypeByIds(ids: string[], _account?: string): Promise<MailTypesGroup> {
    ids = ids.filter(v => !!v);
    if (ids.length === 0) {
      return {
        thread: [],
        normal: [],
      };
    }
    const idSet = new Set(ids);
    const uniqueIds = [...idSet];
    const { threadIds, normalIds } = await this.mailDbHandler.classifyThreadMailsByIds(uniqueIds, undefined, _account);
    const result: MailTypesGroup = {
      thread: [],
      normal: [],
    };
    uniqueIds.reduce<MailTypesGroup>((total, current) => {
      if (threadIds.includes(current)) {
        total.thread.push(current);
        idSet.delete(current);
      } else if (normalIds.includes(current)) {
        total.normal.push(current);
        idSet.delete(current);
      }
      return total;
    }, result);

    if (idSet.size > 0) {
      const temp: MailTypesGroup = {
        thread: [],
        normal: [],
      };
      [...idSet].reduce<MailTypesGroup>((total, current) => {
        const target = current.split('--')[0];
        if (/^\d+$/.test(target)) {
          total.thread.push(current);
        } else {
          total.normal.push(current);
        }
        return total;
      }, temp as MailTypesGroup);
      result.thread = [...result.thread, ...temp.thread];
      result.normal = [...result.normal, ...temp.normal];
      if (temp.thread.length > 0) {
        this.syncMailByIds(temp.thread, 'checkThreadDetail', undefined, _account).then();
      }
      if (temp.normal.length > 0) {
        this.syncMailByIds(temp.normal, 'normal', undefined, _account).then();
      }
    }
    return result;
  }

  doFastSend(content: WriteMailInitModelParams): Promise<MailEntryModel> {
    return this.mailOperationHandler.doFastSend(content);
  }

  // eslint-disable-next-line max-params
  async replyExternalThumbMail(id: string, all?: boolean, noPopup?: boolean, additionalContent?: string, _account?: string): Promise<MailEntryModel> {
    if (!additionalContent) {
      additionalContent = `
        <div style="font-size: 17px; font-weight: 500; color: #262A33; height: 30px; line-height: 30px">赞 👍</div>
        <div style="font-size: 16px; line-height: 26px; color: #51555C;">
        点赞邮件来自 <a style="color: #386ee7; display: inline-block; text-underline: none; text-decoration: none;" href="https://hubble.netease.com/sl/aaagLd">网易灵犀办公</a>
        </div>
      `;
    }
    const param = await this.doReplayMail(id, all, noPopup, additionalContent, _account);
    return this.doFastSend(param);
  }

  async getTranslateContent(content: string, from: string, to: string, _account?: string): Promise<TranslatResModel> {
    return this.mailContentHandler.getTranslateContent(content, from, to, _account);
  }

  async detectMailContentLang(mid: string, content: string): Promise<MailContentLangResModel | null> {
    const data = await this.mailContentHandler.detectMailContentLang(content);
    if (data?.lang) {
      await this.syncContentLangToDb(mid, data.lang);
    }
    return data;
  }

  async syncContentLangToDb(mid: string, originLang: string, _account?: string): Promise<boolean> {
    return this.mailContentHandler.syncContentLangToDb(mid, originLang, _account);
  }

  async getEnglishGrammar(content: string, _account?: string): Promise<GrammarResponse | null> {
    return this.mailContentHandler.getEnglishGrammar(content, _account);
  }

  async syncTranslateContentToDb(mid: string, langType: string, conditions?: string, _account?: string): Promise<boolean> {
    return this.mailContentHandler.syncTranslateContentToDb(mid, langType, conditions, _account);
  }

  async getMailContentTableInDb(ids: string, _account?: string) {
    const result = await this.mailDbHandler.getMailContentTableInDb(ids, _account);
    return result;
  }

  async doForwardMail(id: string, payload?: { noPopup?: boolean; additionalContent?: string; _account?: string; owner?: string }): Promise<WriteMailInitModelParams> {
    const { noPopup, additionalContent, _account, owner } = payload || {};
    if (!noPopup) {
      mailPerfTool.writeMail('start', { writeType: 'forward' });
    }
    let isThread = false;
    // 下属邮件没有聚合
    if (!owner) {
      const mailType = await this.doGetMailTypeById(id, _account);
      isThread = mailType === 'thread';
    }
    return this.mailOperationHandler.doForwardMail(id, { noPopup, additionalContent, isThread, _account, owner });
  }

  async doForwardMailAsAttach(
    id: string,
    payload?: { asAttach?: boolean; asAttachIds?: string[]; noPopup?: boolean; additionalContent?: string; _account?: string; owner?: string; title?: string }
  ): Promise<WriteMailInitModelParams> {
    const { asAttach, asAttachIds, noPopup, additionalContent, _account, owner, title } = payload || {};
    if (!noPopup) {
      // mailPerfTool.writeMail('start', { writeType: 'forward' }); // ‘按照附件转发'，原来使用的‘转发’是否有问题?
      mailPerfTool.writeMail('start', { writeType: 'forwardAsAttach' });
    }
    let isThread = false;
    // 多选作为附件转发不进入
    if (!asAttachIds && !owner) {
      const mailType = await this.doGetMailTypeById(id);
      isThread = mailType === 'thread';
    }
    return this.mailOperationHandler.doForwardMail(id, { noPopup, additionalContent, isThread, asAttach, asAttachIds, _account, owner, title });
  }

  doGetAllComposingMailId(): number[] {
    return this.mailOperationHandler.doGetAllComposingMailId();
  }

  // 邮件讨论，邮件消息详情
  async doGetMailContentIM(emailMid: string, teamId?: string): Promise<MailEntryModel> {
    if (!emailMid) {
      return Promise.reject(new Error('no emailMid input'));
    }
    const result = await this.mailContentHandler.doGetMailContentIM(emailMid, teamId);
    // 邮件详情中过滤掉钓鱼邮件标签
    if (result && result.tags) {
      result.tags = result.tags.filter(tag => !tag.startsWith('%') && !tag.endsWith('%'));
    }
    if (result && !result.sender) {
      result.sender = this.contactHandler.buildEmptyContact(false)[0];
    }
    return result;
  }

  // eslint-disable-next-line max-params
  async updateDbContentState(
    id: string,
    dbContent: MailEntryModel,
    taskType: UpdateMailCountTaskType = 'default',
    noContactRace = false,
    _account?: string
  ): Promise<MailEntryModel | null> {
    const serverContent = await this.mailContentHandler.getMailContentMakeModelPromise({
      id,
      noFlagInfo: false,
      noCache: true,
      ignoreContact: false,
      noContactRace,
      _account,
    });
    // serverContent 如果是 undefined，说明在服务端被删了，目前没有做处理，寄希望于列表将这封邮件干掉，因为如果在DB删掉，会引起UI层的一系列的变化
    if (serverContent) {
      const isDiff = this.checkMailContentDiff(dbContent, serverContent);
      console.log('[mail content update]', dbContent, serverContent, isDiff);
      // diff 说明 content 不正确了，直接删掉，重新拉取吧
      if (isDiff) {
        await this.db.deleteById(mailTable.content, id);
        return this.getMailContentFromServer(id, {
          noFlagInfo: false,
          noCache: true,
          taskType,
          noContactRace,
          _account,
        });
      }
      return this.mailContentHandler.getMailContentAssemble([serverContent, dbContent]);
    }
    return null;
  }

  private checkMailContentDiff(dbContent: MailEntryModel, serverContent: MailEntryModel): boolean {
    const keysInEntry: Array<keyof MailEntryInfo> = ['title', 'isDefer', 'deferTime', 'deferNotice', 'receiveTime', 'sendTime'];
    const isKeyInEntryDiff = keysInEntry.some(v => {
      if (serverContent.entry[v] !== undefined && dbContent.entry[v] !== serverContent.entry[v]) {
        return true;
      }
      return false;
    });
    if (isKeyInEntryDiff) {
      return true;
    }

    const sendersA = Array.isArray(dbContent.senders) ? dbContent.senders : [dbContent.sender];
    const sendersB = Array.isArray(serverContent.senders) ? serverContent.senders : [serverContent.sender];
    const sendersASet = new Set(sendersA.map(v => v.originName + v.contactItem.contactItemVal));
    const sendersBSet = new Set(sendersB.map(v => v.originName + v.contactItem.contactItemVal));
    const isSendersInclude = util.isArrayInclude([...sendersASet], [...sendersBSet]);
    if (!isSendersInclude) {
      return true;
    }

    const receiversA = Array.isArray(dbContent.receiver) ? dbContent.receiver : [];
    const receiversB = Array.isArray(serverContent.receiver) ? serverContent.receiver : [];
    const receiversASet = new Set(receiversA.map(v => v.originName + v.contactItem.contactItemVal));
    const receiversBSet = new Set(receiversB.map(v => v.originName + v.contactItem.contactItemVal));
    const isReceiversInclude = util.isArrayInclude([...receiversASet], [...receiversBSet]);
    if (!isReceiversInclude) {
      return true;
    }

    return false;
  }

  // eslint-disable-next-line max-params
  async doGetMailContent(
    ids: string,
    noFlagInfo?: boolean,
    noCache?: boolean,
    taskType: UpdateMailCountTaskType = 'default',
    conf?: { noContactRace?: boolean; _account?: string }
  ): Promise<MailEntryModel> {
    // 在本地数据库获取 eml 内容
    if (util.extractPathFromCid(ids)) {
      return this.doParseEml(ids, conf?._account);
    }
    let result = await this.getMailContentInDb(ids, conf?.noContactRace, conf?._account).then(res => (res ? setMailAttSource(res, 'content') : res));
    console.log('[mail content] got mail content from db: ', result);

    if (result && result.isEncryptedMail) {
      // 如果是加密邮件，优先获取解密后的内容（如果缓存中存在的话）
      result = await this.insertDecryptedContent(result, ids);
    }

    if (result) {
      // 一封未读邮件点击时，在有缓存的情况下，会同时触发获取比对远端状态、标记已读两个操作，服务端两个操作完成的时序对于客户端来说是未知的
      // 所以加了 3s 的延时是为了保证本地的已读状态，不会被远端（还没有接收到以读消息的）状态所错误覆盖
      // 这种实现不理想，但是如果监听远端已读成功的消息，也不理想，暂时没想到更好的实现方法
      // setTimeout(() => {
      //   this.updateDbContentState(
      //     ids,
      //     result as MailEntryModel,
      //     taskType,
      //     true,
      //     conf?._account
      //   ).then(newContent => {
      //     if (newContent) {
      //       this.eventApi.sendSysEvent({
      //         eventName: 'mailStoreRefresh',
      //         eventStrData: 'updateMailEntities',
      //         eventData: [newContent],
      //       });
      //       // storeMailOps.updateMailEntities([newContent]);
      //     }
      //   });
      // }, 3000);
    }

    if (!result || !result.entry?.content?.content || noCache) {
      console.warn('数据库查询邮件详情未成功', ids);
      // if (environment === 'local') {
      //   this.eventApi.sendSysEvent({
      //     eventName: 'error',
      //     eventLevel: 'error',
      //     eventStrData: '',
      //     eventData: {
      //       popupType: 'toast',
      //       popupLevel: 'info',
      //       title: '数据库查询邮件详情未成功，' + ids,
      //       code: 'PARAM.ERR',
      //     } as PopUpMessageInfo,
      //     eventSeq: 0,
      //   });
      // }
      result = await this.getMailContentFromServer(ids, {
        noFlagInfo,
        noCache,
        taskType,
        noContactRace: conf?.noContactRace,
        _account: conf?._account,
      });
      // 远程获取详情时，如果有且仅有一个.dat附件，大概率是压缩后的附件解压出问题了，把这种情况上报上去
      if (Array.isArray(result?.entry.attachment) && result?.entry.attachment.length === 1) {
        const datAttachment = result?.entry.attachment.find(v => v.fileType === 'dat' && v.fileName.endsWith('.dat'));
        if (datAttachment) {
          this.dataTrackerHelper.track('pc_mail_dat_attachment', {
            filename: datAttachment.fileName,
          });
        }
      }
    }
    // 邮件详情中过滤掉钓鱼邮件标签
    if (result && result.tags) {
      result.tags = result.tags.filter(tag => !tag.startsWith('%') && !tag.endsWith('%'));
    }
    if (result && !result.sender) {
      result.sender = this.contactHandler.buildEmptyContact(false)[0];
    }
    return result;
  }

  async cleanDecryptedCached(_account?: string): Promise<void> {
    const actions = this.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    if (actions) {
      actions.decryptedMailsCache.clear();
    }
  }

  // 从 cache 中获取解密后的内容，插入邮件 model 中
  async insertDecryptedContent(result: MailEntryModel, id: string): Promise<MailEntryModel> {
    const { _account } = result;
    const targetActions = this.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    const cacheContent = targetActions?.decryptedMailsCache.get(id);
    // cache中没有，从服务端获取
    if (!cacheContent?.data && cacheContent?.encpwd) {
      await this.doGetDecryptedContent(id, cacheContent.encpwd, _account);
    }
    // 再获取一次 并插入
    const cacheContentAgain = targetActions?.decryptedMailsCache.get(id);
    if (cacheContentAgain?.data) {
      const { attachments, content } = cacheContentAgain.data;
      result.entry.attachment = attachments;
      result.entry.content = content;
      result.entry.encpwd = cacheContentAgain.encpwd;
      result.isDecrypted = true;
    }
    return result;
  }

  async doGetDecryptedContent(mid: string, encpwd: string, _account?: string): Promise<DecryptedContentResult> {
    const { passed, errMsg, code, data } = await this.mailContentHandler.doGetDecryptedContent(mid, encpwd, _account);
    if (passed && data) {
      const contentInDb = await this.mailDbHandler.doGetMailContent(mid, false, _account);
      const targetActions = this.getActions({
        actions: this.actions,
        subActions: this.subActions,
        _account: contentInDb?._account,
      })?.val;
      if (!contentInDb) {
        throw new Error('doGetDecryptedContent no originContent');
      }
      const { html, attachments } = data;
      contentInDb.entry.content = {
        ...contentInDb.entry.content,
        content: html.content,
        contentId: html.contentId,
        contentLen: html.contentLength,
      };
      const processedModel = await this.mailContentHandler.handleDecryptedMailResponse(contentInDb, attachments, encpwd);
      const cache: DecryptedMailsCache = {
        encpwd,
        data: {
          content: processedModel.entry.content,
          attachments: processedModel.entry.attachment || [],
        },
      };
      targetActions?.decryptedMailsCache.set(mid, cache);
      return {
        passed: true,
        data: processedModel,
      };
    }
    return {
      passed,
      errMsg,
      code,
    };
  }

  async doChangeMailEncoding(mid: string, encoding: MailEncodings, conf?: { _account?: string }): Promise<MailEntryModel> {
    const result = await this.getMailContentFromServer(mid, {
      encoding,
      _account: conf?._account,
    });
    return result;
  }

  // eslint-disable-next-line max-params
  // 三方邮件详情方法，之前考虑到三方邮件不变化，所以可以直接使用数据库的数据，0915版本后，下属邮件增加了下属是否已读功能，开始有变化,先直接使用远程
  async doGetTpMailContent(params: TpMailContentParams, noCache?: boolean): Promise<MailEntryModel> {
    const currentUser = this.systemApi.getCurrentUser();
    if (!currentUser || currentUser.id === params.owner) {
      return Promise.reject(new Error('本接口不支持查询本人邮件'));
    }
    // from db
    // let result = await this.mailDbHandler.doGetTpMailContent(params.mid);
    // console.log('[tp mail] got mail content from db: ', result);

    // if (result && result.entry?.content?.content) {
    //   return result;
    // }

    if (!params.owner) {
      const resultInDb = await this.mailDbHandler.getTpMailById({ id: params.mid, noContent: true });
      if (Array.isArray(resultInDb) && resultInDb.length > 0) {
        const target = resultInDb[0];
        if (target && target.isTpMail && target.owner) {
          params.owner = target.owner;
        }
      }
    }

    if (!params.owner) {
      return Promise.reject(new Error('无法获取三方邮件 owner 属性'));
    }

    // from server
    const result = await this.mailContentHandler.doGetTpMailContent(params as Required<TpMailContentParams>);
    console.log('[tp mail] got mail content from server: ', result, noCache);

    if (result) {
      // 邮件详情中过滤掉钓鱼邮件标签
      if (result.tags) {
        result.tags = result.tags.filter(tag => !tag.startsWith('%') && !tag.endsWith('%'));
      }
      if (!result.sender) {
        result.sender = this.contactHandler.buildEmptyContact(false)[0];
      }
      // 标记邮件附件数据来源
      result.entry.attSource = 'content';

      this.saveMails(result).catch();
    } else {
      // 如果远程没有请求一下本地
      const resultDB = await this.mailDbHandler.doGetTpMailContent(params.mid);
      if (resultDB && resultDB.entry?.content?.content) {
        return resultDB;
      }
    }

    return result;
  }

  private async saveMails(mails: MailEntryModel | MailEntryModel[], taskType: UpdateMailCountTaskType = 'default', attrConf?: MailAttrConf, _account?: string) {
    const allMails = Array.isArray(mails) ? mails : [mails];
    const selfMails = allMails.filter(mail => !mail.isTpMail);
    const tpMails = allMails.filter(mail => !!mail.isTpMail);
    if (selfMails.length > 0) {
      await this.mailDbHandler.saveMails(selfMails, taskType, _account, attrConf).catch();
    }
    if (tpMails.length > 0) {
      await this.mailDbHandler.saveTpMails(tpMails).catch();
    }
  }

  private async clearExpiredMails(): Promise<void> {
    const needClear = await this.mailDbHandler.checkAndSetClearFlag();
    console.log('[mail clear] needClear', needClear);
    if (needClear) {
      const mids = await this.mailDbHandler.collectExpiredMailIds();
      console.log('[mail clear] find ids to check', mids);
      if (mids.length > 0) {
        await this.syncMailByIds(mids);
      }
    }
  }

  async handleSendMDN(id: string, _account?: string) {
    const urlKey = 'sendMDN';
    const url = this.modelHandler.buildUrl({ key: urlKey, _account });
    const dt = {
      id,
      dispositionInfo: {
        mode: 'manual',
        type: 'displayed',
      },
    };
    return this.impl.post(url, dt, {
      contentType: 'json',
      _account,
    });
  }

  // ai 写信
  async gptEmailWrite(
    req: AiWriteMailModel,
    cb = (data: GPTAiContentRes) => console.log(data),
    errorCB = (err: string) => console.log(err),
    taskId = ''
  ): Promise<string> {
    return this.impl
      .post(
        this.systemApi.getUrl('getMailGPTWrite'),
        {
          taskId,
          first: !taskId,
          ...req,
        },
        {
          timeout: 2 * 60 * 1000,
          contentType: 'json',
        }
      )
      .then(({ data }) => {
        if (!data?.success || !data.data || data.data.finishState === 2) {
          // onError
          return data;
        }
        if (data.data.finishState === 1) {
          // onSuccess
          cb(data.data);
          return data.data;
        }
        if (data.data.finishState === 0) {
          const newTaskid = data.data.taskId;
          return setTimeout(() => {
            this.gptEmailWrite(req, cb, errorCB, newTaskid);
          }, 500);
        }
        return '';
      })
      .catch(e => {
        errorCB(e);
      });
  }

  // ai 润色
  gptEmailRetouch(req: AiWriteMailModel, cb = (data: GPTAiContentRes) => console.log(data), errorCB = (err: string) => console.log(err), taskId = '') {
    return this.impl
      .post(
        this.systemApi.getUrl('getMailGPTPolish'),
        {
          taskId,
          first: !taskId,
          ...req,
        },
        {
          timeout: 2 * 60 * 1000,
          contentType: 'json',
        }
      )
      .then(({ data }) => {
        if (!data?.success || !data.data || data.data.finishState === 2) {
          // onError
          return data;
        }
        if (data.data.finishState === 1) {
          // onSuccess
          cb(data.data);
          return data.data;
        }
        if (data.data.finishState === 0) {
          const newTaskid = data.data.taskId;
          return setTimeout(() => {
            this.gptEmailRetouch(req, cb, errorCB, newTaskid);
          }, 500);
        }
        return '';
      })
      .catch(e => {
        errorCB(e);
      });
  }

  getGPTQuota() {
    return this.impl.get(this.systemApi.getUrl('getMailGPTQuote'), {}).then(res => res.data?.data || { dayLeft: 0, dayLimit: 0 });
  }

  getGptConfig(): Promise<any> {
    return this.impl.get(this.systemApi.getUrl('getMailGPTConfig'), {});
  }

  getGptRecord(req: GenerateReportReq) {
    return this.impl.get(this.systemApi.getUrl('getMailGPTHistory'), req).then(res => res.data?.data);
  }

  async doTranslateGPTAiContent(req: GptAiContentTranslateReq, token: number): Promise<GPTAiContentTranslateRes> {
    const res = await this.impl.post(this.systemApi.getUrl('doTranslateGPTAiContent'), req, {
      contentType: 'json',
      noEnqueue: true,
    });
    return {
      ...res.data,
      token,
    } as GPTAiContentTranslateRes;
  }

  filterThreadFolder(data: MailEntryModel[]) {
    return data.filter(v => [1, 3].includes(v.entry.folder) || v.entry.folder > 20);
  }

  private addThreadMessageIdsForCorp(list: MailEntryModel[], threadMesageIds: string[] = []) {
    if (list && list.length) {
      list.forEach(item => {
        item.entry.threadMessageIds = threadMesageIds;
        item.entry.threadMessageCount = threadMesageIds.length;
      });
    }
  }

  // TODO：重构，将部分逻辑移到后台窗口
  async doGetThreadMailContent(
    id: string,
    params: queryThreadMailDetailParam,
    noCache?: boolean,
    threadMailIds?: string[],
    _account?: string
  ): Promise<MailEntryModel[] | MailModelEntries> {
    if (!id) {
      return Promise.reject(new Error('invalid mail thread id'));
    }

    // corp的id没有--，不需要
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    const threadId = isCorpMail ? id : util.resetThreadMailId(id, true);

    // 在 db 中查询结果
    const result: MailEntryModel[] = await this.doGetThreadMailContentFromDb(id, params, _account);

    // 如果不使用缓存或者本地没有获取到的数据，返回的是从服务端获取到的结果
    const useSeverRes = isCorpMail || noCache || !result || result.length === 0;

    console.log('[thread mail] content use server res', id, useSeverRes);

    // 从远端异步获取数据，并且通过 sendSysEvent 的形式通知 Web 进行更新，并插入数据
    const ids = isCorpMail ? threadMailIds : [threadId];
    const serverPromise = this.mailContentHandler.getThreadMailContentFromNetwork(ids as string[], params, useSeverRes, _account).then(res => {
      console.log('[thread mail] content from server', id, params, res);
      const networkRes = Array.isArray(res) ? res : res.data;
      const dtA = result ? result.filter(it => !it.id.endsWith('-tmp')) : [];
      const dtB = Array.isArray(networkRes) ? networkRes.filter(it => !it.id.endsWith('-tmp')) : [];
      const total = Array.isArray(networkRes) ? networkRes.length : 0;
      const syncParams = { ...params, count: 3000 };
      this.syncAndResendMailEntryHandler(dtA, dtB, total, {
        param: syncParams,
        fromNetwork: useSeverRes,
        threadId: id,
        _account,
      }).then(isChanged => {
        console.log('[thread mail] content diff', id, isChanged);
        // corpMail不用发送事件
        // if (isCorpMail) {
        //   return;
        // }
        // if (!useSeverRes && isChanged) {
        //   console.log('[thread mail] content sendEvent', id);
        //   this.eventApi.sendSysEvent({
        //     eventName: 'mailChanged',
        //     eventStrData: 'refreshThreadContent',
        //     eventData: {
        //       ...params,
        //       threadId: new Set<string>([id]),
        //     },
        //   });
        // }
      });
      if (Array.isArray(res)) {
        if (isCorpMail) {
          this.addThreadMessageIdsForCorp(res, threadMailIds);
        }
        return res;
      }
      return {
        ...res,
        data: Array.isArray(res.data) ? res.data : [],
      };
    });

    // 返回的从服务端获获取数据的 promise
    if (useSeverRes) {
      return serverPromise;
    }

    // 如果使用缓存，先将从本地的结果返回出去
    return result;
  }

  async doGetThreadMailContentFromDb(threadId: string, params?: queryThreadMailDetailParam, _account?: string): Promise<MailEntryModel[]> {
    let result: MailEntryModel[] = [];
    const orderDesc = params?.desc;
    const query: AdQueryConfig = {
      start: params && params.start ? params.start : 0,
      count: params && params.limit ? params.limit : 3000,
      adCondition: {
        field: ['isThread', 'threadId', 'rcTime'],
        type: 'between',
        args: [[0, threadId, orderDesc ? -Number.MAX_VALUE : 0], [0, threadId, orderDesc ? 0 : -Number.MAX_VALUE], true, true],
      },
      ...mailTable.status,
    };
    const detailMailsStatus = ((await this.db.getByRangeCondition(query, _account)) as EntityMailStatus[]).filter(v => !!v);
    if (detailMailsStatus.length > 0) {
      const detailMids = detailMailsStatus.map(v => v.mid);
      const detailMails = await this.getMailEntryInDb(detailMids, false, false, _account);
      result = Array.isArray(detailMails) ? detailMails : [];
    }
    console.log('[thread mail] content from db', threadId, params, result);
    return result;
  }

  doGetThreadMailStatus(id: string, noCache?: boolean) {
    // 废弃
    return this.mailContentHandler.doGetGroupMailStatus(id, noCache);
  }

  async getMailContentInDb(ids: string, noContactRace = false, _account?: string) {
    const result = await this.mailDbHandler.doGetMailContent(ids, noContactRace, _account);
    return result;
  }

  // eslint-disable-next-line max-params
  async getMailContentFromServer(
    id: string,
    conf: {
      noFlagInfo?: boolean;
      noCache?: boolean;
      taskType?: UpdateMailCountTaskType;
      noContactRace?: boolean;
      encoding?: MailEncodings;
      _account?: string;
    }
  ) {
    const { noFlagInfo, noCache, taskType = 'default', noContactRace = false, _account, encoding } = conf;
    const result = await this.mailContentHandler
      .doGetMailContent(id, {
        noFlagInfo,
        noCache,
        noContactRace,
        _account,
        encoding,
      })
      .then(res => setMailAttSource(res, 'content'));
    console.log('[mail content] from server', result);
    if (!noFlagInfo) {
      this.saveMails(result, taskType, undefined, _account).catch();
    }
    return result;
  }

  async getMailEntryInDb(ids: string | string[], noContact?: boolean, noStatus?: boolean, _account?: string) {
    return this.mailDbHandler.getMailById({
      id: ids,
      noContact,
      noStatus,
      _account,
    });
  }

  doGetReplayContentModel(content: WriteMailInitModelParams): Promise<MailEntryModel> {
    return this.mailOperationHandler.doGetReplayContentModel(content);
  }

  async createUserFolder(items: createUserFolderParams[], config: createUserFolderParamsCondig, _account?: string): Promise<number[]> {
    const { syncMailFolder = true } = config;
    return this.mailContentHandler.createUserFolder(items, _account).then(async res => {
      if (syncMailFolder) {
        await this.syncMailFolder(_account);
      }
      return res;
    });
  }

  async updateUserFolder(items: updateUserFolderParams[], _account?: string): Promise<boolean> {
    return this.mailContentHandler.updateUserFolder(items, _account).then(async res => {
      // this.doUpdateMailBoxStat();
      await this.syncMailFolder(_account);
      return res;
    });
  }

  async deleteUserFolder(items: string[], account?: string): Promise<boolean> {
    return this.mailContentHandler.deleteUserFolder(items, account).then(async res => {
      await this.syncMailFolder(account);
      return res;
    });
  }

  async updateMessageInfos(item: updateMessageInfosParams, _account?: string): Promise<boolean> {
    return this.mailOperationHandler.updateMessageInfos(item, _account);
  }

  async doListMailBox(noCache?: boolean, updateStat?: boolean, from?: string, _account?: string): Promise<MailBoxModel[]> {
    console.log('[mail box] doListMailBox', noCache, updateStat, from);
    try {
      let result;
      if (!noCache && !updateStat) {
        result = await this.mailDbHandler.doListMailBox(_account);
        console.log('[mail] doListMailBox from db ', result);
        if (result) {
          this.syncAndResendMailBox(result, _account);
          return result;
        }
      }
    } catch (e) {
      console.warn(e);
    }
    const res = await this.listMailBoxFromNetwork(noCache, updateStat, _account);
    if (from === 'refreshFolder') {
      this.loggerHelper.track('do_list_mail_box_by_refresh_folder', { res, noCache, updateStat });
    }
    return res;
  }

  private syncAndResendMailBox(cacheResult: MailBoxModel[], _account?: string) {
    this.listMailBoxFromNetwork(true, false, _account).then(netResult => {
      const diff: boolean = this.modelHandler.compareMailBoxModel(cacheResult, netResult);
      if (diff) {
        this.eventApi.sendSysEvent({
          eventName: 'mailChanged',
          eventStrData: 'syncFolder',
          eventData: netResult,
          toAccount: [this.systemApi.getMainAccount().email],
          _account,
        });
      }
    });
    // }
  }

  private listMailBoxFromNetwork(noCache: undefined | boolean, updateStat: undefined | boolean, _account?: string): Promise<MailBoxModel[]> {
    const entries: EntityMailBox[] = [];
    const promise = this.mailContentHandler.doListMailBox(noCache, updateStat, entries, _account);
    return promise.then(async res => {
      // 在写入前，先清空本地的数据
      const crearFolderTable = true;
      await this.mailDbHandler.saveMailBoxes(entries, _account, crearFolderTable);
      const unread = this.calUnreadFromModel(entries, _account);
      this.modelHandler.updateUnreadCount(unread, _account);
      return res;
    });
  }

  calUnreadFromModel(entries: EntityMailBox[], _account?: string) {
    const isThread = this.mailConfApi.getMailMergeSettings(_account) === 'true';
    let unread = 0;
    // for (const entry of entries)
    entries.forEach((entry: EntityMailBox) => {
      if (entry.mailBoxId === mailBoxOfDefault.id || entry.mailBoxType === 'customer' || entry.mailBoxId === mailBoxOfWaitingIssue.id) {
        unread += isThread ? entry.threadMailBoxCurrentUnread : entry.mailBoxCurrentUnread;
      }
    });
    return unread;
  }

  private syncAndResendMailEntry(param: queryMailBoxParam, cacheRes?: MailModelEntries, networkRes?: MailEntryModel[], _account?: string) {
    param.noContactRace = true;
    if (networkRes) {
      // 拉取本地数据，进行比对
      this.mailDbHandler.doListMailEntry(param, _account).then(async res => {
        const dtA = res && res.data ? res.data.filter(it => !it.id.endsWith('-tmp')) : [];
        const dtB = Array.isArray(networkRes) ? networkRes.filter(it => !it.id.endsWith('-tmp')) : [];
        const total = Array.isArray(networkRes) ? networkRes.length : 0;
        await this.syncAndResendMailEntryHandler(dtA, dtB, total, {
          param,
          fromNetwork: true,
          _account,
        });
      });
    } else {
      // 拉取网络数据，进行比对
      this.listMailEntryFromNetwork(param, true).then(async res => {
        const total = Array.isArray(res) ? res.length : res.total;
        const targetActions = this.getActions({
          actions: this.actions,
          subActions: this.subActions,
          _account,
        })?.val;
        if (targetActions?.curRealListReqSeq === param.querySeq && param.isRealList) {
          this.eventApi.sendSysEvent({
            eventName: 'mailRealListTotalChanged',
            eventData: {
              netWorkTotal: total,
            },
            _account,
          });
        }
        const dtA = cacheRes ? cacheRes.data.filter(it => !it.id.endsWith('-tmp')) : [];
        const dtB = (Array.isArray(res) ? res : res.data).filter(it => !it.id.endsWith('-tmp'));
        await this.syncAndResendMailEntryHandler(dtA, dtB, total, {
          param,
          fromNetwork: false,
          _account,
        });
      });
    }
  }

  private async syncAndResendMailEntryHandler(
    dtA: MailEntryModel[], // 缓存数据
    dtB: MailEntryModel[], // 在线数据
    total: number,
    conf: {
      param: queryMailBoxParam;
      fromNetwork?: boolean;
      threadId?: string; // 将聚合邮件父邮件的 threadId 写入子邮件
      _account?: string;
    }
  ): Promise<boolean> {
    const { param, fromNetwork = false, _account } = conf;

    // const eventRefreshType = param.mids && param.mids.length > 0 ? 'contentMail' : 'regularMail';
    const eventRefreshType = 'regularMail';
    const isThread = this.mailConfApi.getMailMergeSettings(_account) === 'true';
    const eventMerge = !isThread && param.id !== mailBoxOfTask.id;
    // 客户邮件和下属邮件的比对不需要等待其他消息的merge，直接发出即可
    const forEdmMail = edmMailHelper.isEdmMailReq(param.checkType);

    if (!dtA || !dtB) {
      this.doCallMailMsgCenter(
        {
          type: 'syncMail',
          msgCenter: {
            merge: eventMerge,
            diff: !dtA || !dtB,
            refreshType: eventRefreshType,
          },
          checkType: conf.param.checkType,
        },
        _account
      );
      return false;
    }

    const { changedModels, delModels, allModels } = this.compareAllMail(dtA, dtB);
    const needChange = changedModels.length > 0;
    const needDel = delModels.length > 0;

    const isDiff = allModels.length > 0;
    if (!fromNetwork) {
      // 更改邮件总数
      if (dtA.length === dtB.length && dtB.length < param.count && total === (param.index || 0) + dtA.length) {
        if (!needChange && !needDel) {
          if (!param.isRealList) {
            this.eventApi.sendSysEvent({
              eventName: 'mailChanged',
              eventStrData: 'syncMailTotal',
              eventData: { total, param },
              _account,
            });
          }
          if (!forEdmMail) {
            this.doCallMailMsgCenter(
              {
                type: 'syncMail',
                msgCenter: {
                  merge: eventMerge && !forEdmMail,
                  diff: false,
                  refreshType: eventRefreshType,
                },
                checkType: conf.param.checkType,
              },
              _account
            );
          }
          return false;
        }
      }
    }

    const allIds = changedModels.map(v => v.id);

    if (needChange) {
      const saveModels = conf.threadId
        ? changedModels.map(v => ({
            ...v,
            threadId: conf.threadId,
          }))
        : changedModels;
      await this.saveMails(saveModels, undefined, conf.param.attrConf, _account);
      const threadMessageChangeIds = await this.syncThreadMessages(changedModels, _account);
      allIds.push(...threadMessageChangeIds);
    }

    if (needDel) {
      const selfDelIds = delModels.filter(v => !v.isTpMail).map(v => v.id);
      if (selfDelIds.length > 0) {
        await this.syncMailByIds(selfDelIds, param.checkType, true, _account);
        allIds.push(...selfDelIds);
      }
      const tpDelIds: SyncTpMailParamItem[] = delModels.filter(v => v.isTpMail && v.owner).map(v => ({ mids: [v.id], email: v.owner || '' }));
      if (tpDelIds.length > 0) {
        await this.syncTpMailByIds(tpDelIds, param.checkType);
      }
      if (param.checkType === 'checkStarMail') {
        const needDeleteAttrList = delModels.filter(v => mailBoxOfFilterStar[v.entry.folder]).map(v => v.id);
        if (needDeleteAttrList.length > 0) {
          // 如果邮件被移动到上述三个文件夹，则mail_attr数据需要删掉
          this.mailDbHandler.deleteMailAttrByMids(needDeleteAttrList, _account).then();
        }
      }
    }

    // 全都发送
    // if (!fromNetwork) {
    this.doCallMailMsgCenter(
      {
        type: 'syncMail',
        data: param,
        msgCenter: {
          // 客户邮件比对
          merge: eventMerge && !forEdmMail,
          // 如果是使用网络数据，本不必发送同步请求，但是由于此消息是发送给消息中心的，所以还是要发出去，但是 diff 被更改
          diff: !fromNetwork && isDiff,
          refreshType: eventRefreshType,
        },
        checkType: conf.param.checkType,
      },
      _account
    );
    // }

    // if (isDiff && !fromNetwork) {
    //   await this.eventApi.sendSysEvent({
    //     eventName: 'mailChanged',
    //     eventStrData: 'refreshThreadContent',
    //     eventData: {
    //       threadId: new Set(allIds),
    //     },
    //   });
    // }

    return isDiff;
  }

  private async syncThreadMessages(models: MailEntryModel[], _account?: string) {
    const tempIds: string[] = [];
    models.forEach(model => {
      if (model.isThread && Array.isArray(model.entry.threadMessageIds)) {
        tempIds.push(...model.entry.threadMessageIds);
      }
    });
    const threadMessageIds = [...new Set(tempIds)];
    const threadMessageInDb = (await this.db.getByIds(mailTable.status, threadMessageIds, _account)) as EntityMailStatus[];
    const threadMessageIdsInDb = threadMessageInDb.filter(v => !!v).map(v => v.mid);
    const threadMessageChangeIds = threadMessageIds.filter(id => !threadMessageIdsInDb.includes(id));
    await this.syncMailByIds(threadMessageChangeIds, 'normal', true, _account);
    await this.mailDbHandler.saveThreadIds(models);
    return threadMessageChangeIds;
  }

  private compareAllMail(
    dtA: MailEntryModel[], // 缓存
    dtB: MailEntryModel[] // network
  ) {
    const delModels: MailEntryModel[] = [];
    const changedModels: MailEntryModel[] = [];

    const dtAMap = dtA.reduce<Map<string, MailEntryModel>>((total, current) => {
      const id = current.isThread && current.threadId ? current.threadId.split('--')[0] : current.id;
      return total.set(id, current);
    }, new Map());

    const dtBMap = dtB.reduce<Map<string, MailEntryModel>>((total, current) => {
      const id = current.isThread && current.threadId ? current.threadId.split('--')[0] : current.id;
      return total.set(id, current);
    }, new Map());

    dtAMap.forEach((itemA, id) => {
      const itemB = dtBMap.get(id);
      if (!itemB) {
        delModels.push(itemA);
      } else {
        const idDifferent = this.modelHandler.compareMailEntryModel(itemA, itemB);
        if (idDifferent) {
          changedModels.push(itemB);
        }
        dtBMap.delete(id);
      }
    });

    if (dtBMap.size > 0) {
      dtBMap.forEach(itemB => {
        changedModels.push(itemB);
      });
    }

    return {
      delModels,
      changedModels,
      allModels: [...delModels, ...changedModels],
    };
  }

  async doListMailEntitiesFromDb(param: queryMailBoxParam, _account?: string): Promise<MailModelEntries | undefined> {
    const isThread = this.mailConfApi.getMailMergeSettings() === 'true';
    param.returnModel = true;
    if (edmMailHelper.isEdmMailReq(param.checkType) || param.attrQuery) {
      return this.doListMailEntitiesFromDbInternal(param);
    }
    if (isThread || (param.mids && param.mids.length > 0)) {
      return this.doListMailEntitiesFromDbInternal(param, _account);
    }
    if (param.id === mailBoxOfTask.id) {
      return (await this.getTaskMailInTaskFolder(param)) as MailModelEntries;
    }
    const noDeleteTaskMail = true;
    // const { taskMailMap } = this.actions;
    // if (
    //   param.index === 0
    //   || !taskMailMap
    //   || !taskMailMap.mailIdMap
    //   || taskMailMap.mailIdMap.size === 0
    // ) {
    //   const [m, t] = await Promise.allSettled([
    //     this.doListMailEntitiesFromDbInternal(param),
    //     this.doGetFullTaskMailList(param, false, true),
    //   ]);
    //   if (m.status === 'fulfilled') {
    //     const mailModel = m.value as MailModelEntries;
    //     this.actions.taskMailMap = t.status === 'fulfilled'
    //       ? (t.value as TaskInternalMap)
    //       : {
    //         mailIdMap: new Map(),
    //         twoTaskIds: new Map<string, TopTaskModel>(),
    //         hasMore: 0,
    //         taskMap: new Map<number, TaskMailModel>(),
    //       };
    //     const result = await this.handleDeleteTaskInMailModel(
    //       mailModel,
    //       this.actions.taskMailMap,
    //       (param.index || 0) === 0,
    //       true
    //     );
    //     mailModel.data = result;
    //     return mailModel;
    //   }
    //   return Promise.reject(m.reason);
    // }
    // 次页直接使用action.taskMailMap
    const mailModel = await this.doListMailEntitiesFromDbInternal(param, _account);
    if (mailModel) {
      const mailModelCopied = {
        ...mailModel,
        ...{ data: [...mailModel.data] },
      };
      const targetActions = this.getActions({
        actions: this.actions,
        subActions: this.subActions,
        _account,
      })?.val;
      const result = noDeleteTaskMail
        ? mailModelCopied.data
        : await this.handleDeleteTaskInMailModel(mailModel, targetActions?.taskMailMap as TaskInternalMap, (param.index || 0) === 0, true, _account);
      mailModelCopied.data = result;
      return mailModelCopied;
    }
    return undefined;
  }

  async doListMailEntitiesFromDbInternal(param: queryMailBoxParam, _account?: string): Promise<MailModelEntries | undefined> {
    const targetActions = this.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    if (param.id && targetActions?.mailBoxDic && targetActions?.mailBoxDic[param.id as number] && targetActions?.mailBoxDic[param.id as number].locked) {
      return Promise.reject(ErrResult.FA_NEED_AUTH2);
    }
    let data = await this.mailDbHandler.doListMailEntry(param, _account);
    if (data) {
      if (!param.isRealList) {
        data.total += param.count;
      }
    } else {
      data = {
        count: 0,
        index: param.index || 0,
        query: param,
        total: 0,
        data: [],
        building: -1,
      };
    }
    return data;
  }

  private sortMailList(list: MailEntryModel[]): MailEntryModel[] {
    if (list && list.length) {
      return [...list].sort((a, b) => {
        if (a.entry.sendTime && b.entry.sendTime) {
          const aDate = util.parseDate(a.entry.sendTime);
          const bDate = util.parseDate(b.entry.sendTime);
          if (aDate && bDate) {
            return bDate - aDate;
          }
        }
        return 0;
      });
    }
    return [];
  }

  private getLocalPageData<T>(list: T[], startIndex: number, pageSize: number): { total: number; data: T[] } {
    if (!list || !list.length) {
      return { total: 0, data: [] };
    }
    const total = list.length;
    if (total <= startIndex) {
      return { total, data: [] };
    }
    return {
      data: list.slice(startIndex, startIndex + pageSize),
      total,
    };
  }

  public orderByMailList(list: MailEntryModel[], param: queryMailBoxParam): MailEntryModel[] | { total: number; data: MailEntryModel[] } {
    console.log('[mail] before orderByMailList', list, param);
    let res;
    const orderbyParams = ['entry.sendTime'];
    const orderType: any = ['desc'];
    if (list && list.length) {
      if (param.order === 'from') {
        orderbyParams[0] = 'sender.contact.contact.contactLabel';
      } else if (param.order === 'size') {
        orderbyParams[0] = 'entry.size';
      } else if (param.order === 'subject') {
        orderbyParams[0] = 'entry.title';
      } else if (param.order === 'to') {
        orderbyParams[0] = 'receiver[0].contact.contact.contactLabel';
      }
      if (!param.desc) {
        orderType[0] = 'asc';
      }
      res = lodashOrderBy([...list], orderbyParams, orderType);
      if (param.isRealList) {
        return this.getLocalPageData<MailEntryModel>(list, param.index || 0, param.count);
      }
      // 走的本地查询并且包含排序 sentDate filter参数， 按照分页策略切割数据返回
      // if (param.noCaparam.filter?.sentDate?.length) {

      // }
      console.log('[mail] after orderByMailList', res, param);
      return res;
    }
    return [];
  }

  private removeThreadInfoForCorp(list: MailEntryModel[]): void {
    if (list && list.length) {
      list.forEach(item => {
        item.isThread = false;
        item.entry.threadMessageIds = undefined;
        item.entry.threadMessageCount = 0;
      });
    }
  }

  // 请求合并
  async refreshPageSequential(): Promise<{ code: string; var: any[] }[]> {
    const requests: RequestSequentialParams[] = [
      {
        func: 'getTaglist',
      },
      {
        func: 'listFolder',
        var: { order: 'custom_virtual' },
      },
      {
        func: 'statMailCount',
        var: this.mailContentHandler.getDoStatMessagesParams(),
      },
    ];
    return this.mailContentHandler.doRequestSequential(requests);
  }

  async doListMailBoxEntities(param: queryMailBoxParam, noCache?: boolean): Promise<MailEntryModel[] | MailModelEntries> {
    const { _account } = param;
    if (process.env.BUILD_ISEDM) {
      if (edmMailHelper.isEdmMailReq(param.checkType) || param.attrQuery) {
        return this.doListEdmMailBoxEntities(param, noCache);
      }
    }
    // 星标联系人
    if (param.checkType === 'checkStarMail') {
      if (!this.modelHandler.isValidStarFolderId(param.id)) {
        return {
          data: [],
          total: 0,
          index: param.index || 0,
          count: param.count,
          query: param,
        };
      }
      return this.doListMailBoxEntriesInternal(param, noCache);
    }
    let result: MailEntryModel[] = [];
    const isThread = this.mailConfApi.getMailMergeSettings(_account) === 'true';
    // 如果是聚合模式并且非任务文件夹，直接返回
    if (isThread && param.id !== mailBoxOfTask.id) {
      return this.doListMailBoxEntriesInternal(param, noCache);
    }
    // 按id查询邮件，直接返回
    if (param.mids && param.mids.length > 0) {
      return this.doListMailBoxEntriesInternal(param, noCache);
    }
    // 以下列表请求
    if ((!param.mids || param.mids.length === 0) && param.checkType !== 'checkRelatedMail') {
      const isTaskMailBox = param.id === mailBoxOfTask.id;
      // 任务邮件箱单独处理
      if (isTaskMailBox) {
        return this.getTaskMailInTaskFolder(param);
      }
      const noDeleteTaskMail = true; // param.index!==0 && param.isRealList;
      // 第一页缓存taskMailMap
      // const { taskMailMap } = this.actions;
      // if (
      //   param.index === 0
      //   || noCache
      //   || !taskMailMap
      //   || !taskMailMap.mailIdMap
      //   || taskMailMap.mailIdMap.size === 0
      // ) {
      //   const [m, t] = await Promise.allSettled([
      //     this.doListMailBoxEntriesInternal(param, noCache),
      //     this.doGetFullTaskMailList(param, noCache)
      //   ]);
      //   if (m.status === 'fulfilled') {
      //     const mailModel = m.value as MailModelEntries;
      //     this.actions.taskMailMap = t.status === 'fulfilled'
      //       ? (t.value as TaskInternalMap)
      //       : {
      //         mailIdMap: new Map(),
      //         twoTaskIds: new Map<string, TopTaskModel>(),
      //         hasMore: 0,
      //         taskMap: new Map<number, TaskMailModel>(),
      //       };
      //     const mailModelCopied = {
      //       ...mailModel,
      //       ...{ data: [...mailModel.data] },
      //     };
      //     result = noDeleteTaskMail ? mailModelCopied.data : await this.handleDeleteTaskInMailModel(
      //       mailModelCopied,
      //       this.actions.taskMailMap,
      //       (param.index || 0) === 0
      //     );
      //     mailModelCopied.data = result;
      //     return mailModelCopied;
      //   }
      //   return Promise.reject(m.reason);
      // }
      // 次页直接使用action.taskMailMap
      const mailModel = await this.doListMailBoxEntriesInternal(param, noCache);
      const mailModelCopied = {
        ...mailModel,
        ...{ data: [...mailModel.data] },
      };
      const targetActions = this.getActions({
        actions: this.actions,
        subActions: this.subActions,
        _account,
      })?.val;
      result = noDeleteTaskMail
        ? mailModelCopied.data
        : await this.handleDeleteTaskInMailModel(mailModelCopied, targetActions?.taskMailMap as TaskInternalMap, (param.index || 0) === 0, undefined, _account);
      mailModelCopied.data = result;
      return mailModelCopied;
    }
    return Promise.reject(new Error('not implemented'));
  }

  async doListEdmMailBoxEntities(param: queryMailBoxParam, noCache?: boolean): Promise<MailModelEntries> {
    // TODO：对于CC和BCC的邮件，本地查询无法完美支撑，所以暂时关闭了本地化路径。。。o(╥﹏╥)o
    // lx1.19星标联系人对本地化的处理之后，会对本地化方案进行优化，后续客户邮件也可采用这套方案
    noCache = true;
    const { attrQuery, tpMids } = param;
    if (Array.isArray(tpMids) && tpMids.length > 0) {
      const tpResult = await this.syncTpMailByIds(tpMids, param.checkType);
      return {
        data: tpResult,
        total: tpResult.length + 1,
        index: 0,
        count: tpMids.length,
        query: param,
      };
    }
    if (!attrQuery || (Array.isArray(attrQuery) && attrQuery.length === 0)) {
      return Promise.resolve({
        count: param.count || 0,
        index: param.index || 0,
        query: param,
        total: 0,
        data: [],
        building: -1,
      });
    }
    let result: MailModelEntries | undefined;
    // 从 db 中获取
    if (!noCache) {
      result = await this.mailDbHandler.doListMailEntry(param);
      console.log('[customer mail] get mail from db', result);
      if (result && result.data && result.data.length > 0) {
        result.total = (param.index || 0) + result.data.length * 2;
        this.syncAndResendMailEntry(param, result);
        return result;
      }
    }
    // 从服务器拉取
    param.returnModel = true;
    return this.listMailEntryFromNetwork(param, noCache).then(res => {
      const result = res as EdmMailModelEntries;
      console.log('[customer mail] get mail from network', result);
      const { data } = result;
      this.syncAndResendMailEntry(param, undefined, data);
      if (!result.over) {
        (result as MailModelEntries).total = (param.index || 0) + (data || []).length * 2;
      } else {
        result.total = 0;
      }
      return result;
    });
  }

  // async doListCustomers(param: CustomerListParams, noCache?: boolean): Promise<ListCustomerPageRes> {
  //   if (!process.env.BUILD_ISEDM) {
  //     return {
  //       data: [],
  //       loadMore: false,
  //     };
  //   }
  //   return this.mailCustomerHandler.doListCustomers(param, noCache);
  // }

  // async doListCustomersFromDb(param: CustomerListParams): Promise<ListCustomerPageRes> {
  //   return this.mailCustomerHandler.doListCustomersFromDb(param);
  // }

  // async doSearchCustomers(param: SearchCustomerParams): Promise<ListCustomerPageRes> {
  //   return this.mailCustomerHandler.doSearchCustomers(param);
  // }

  async doUpdateCustomersByNewMail(models: MailEntryModel[], type?: 'list' | 'mail' | 'unread') {
    // 先使用filter过滤，防止存在空的情况报错
    const senderEmailList = models.filter(model => model?.sender?.contact?.contact?.accountName).map(model => model.sender.contact.contact.accountName);
    const receiverEmailList = models.reduce((total, model) => {
      // 先使用filter过滤，防止存在空的情况报错
      const list = model.receiver.filter(v => v?.contact?.contact?.accountName).map(v => v.contact.contact.accountName);
      total.push(...list);
      return total;
    }, [] as string[]);
    const allEmailList = [...senderEmailList, ...receiverEmailList];
    const res = await this.mailPlusCustomerApi.doGetRoleByEmail({ emails: allEmailList, useLx: false });
    const senderIdList: string[] = edmMailHelper.getMyCustomerByEmailList(res, senderEmailList);
    const receiverIdList: string[] = edmMailHelper.getMyCustomerByEmailList(res, receiverEmailList);
    await this.eventApi.sendSysEvent({
      eventName: 'mailChanged',
      eventStrData: 'refreshCustomer',
      eventData: {
        type: type || 'all',
        senderIdList,
        receiverIdList,
      },
    });
  }

  async doCustomersUnread(param: queryCusterUnreadParam): Promise<CustomerBoxUnread> {
    if (!process.env.BUILD_ISEDM || !this.edmRoleApi.doGetContactViewPrivilege()) {
      return {
        initialized: true,
        total: 0,
        items: [],
      };
    }
    let result: CustomerBoxUnread;
    if (Array.isArray(param.customerIds) && param.customerIds.length > 0) {
      result = await this.mailContentHandler.doCustomersUnread(param);
      console.log('[customer unread] detail', result);
    } else {
      result = await this.mailContentHandler.doCustomersUnreadTotal();
      console.log('[customer unread] total', result);
    }
    return result;
  }

  // // 10分钟轮询
  // syncCustomerUnread() {
  //   if (!window || !this.edmRoleApi.doGetContactViewPrivilege()) {
  //     return;
  //   }
  //   if (this.lastUpdateCustomerUnreadTimer) {
  //     window.clearTimeout(this.lastUpdateCustomerUnreadTimer);
  //     this.lastUpdateCustomerUnreadTimer = null;
  //   }
  //   this.lastUpdateCustomerUnreadTimer = window.setTimeout(() => {
  //     console.log('[customer unread] interval');
  //     this.syncCustomerUnread();
  //     this.sendCustomerUnreadEvent(undefined, true).catch();
  //   }, MailApiImpl.SYNC_CUSTOMER_UNREAD_INTERVAL);
  // }

  // async sendCustomerUnreadEvent(param?: queryCusterUnreadParam, refreshMailList?: boolean) {
  //   const { customerIds = [] } = param || {};
  //   await this.eventApi.sendSysEvent({
  //     eventName: 'mailChanged',
  //     eventStrData: 'refreshCustomerUnread',
  //     eventData: { customerIds },
  //   } as SystemEvent);
  //   if (refreshMailList) {
  //     await this.eventApi.sendSysEvent({
  //       eventName: 'mailChanged',
  //       eventStrData: 'refreshCustomerMail',
  //       eventData: { noCache: true },
  //     } as SystemEvent);
  //   }
  // }

  // async refreshCustomerUnread(models: MailEntryModel[]): Promise<void> {
  //   if (!process.env.BUILD_ISEDM) {
  //     return;
  //   }
  //
  //   const customerInfos: Map<string, CustomerOrgModel> = new Map();
  //   const accountNames: string[] = [];
  //   const sendersAndReceivers: MailBoxEntryContactInfoModel[] = [];
  //
  //   // 批量拿出 sender 和 receiver
  //   models.forEach(model => {
  //     sendersAndReceivers.push(model.sender);
  //     sendersAndReceivers.push(...model.receiver);
  //   });
  //
  //   // 从sender 和 receiver 里直接拿出 customerInfo，如果没有 customerInfo， 则把 accountName 存起来
  //   sendersAndReceivers.forEach(item => {
  //     const { customerOrgModel, contact } = item.contact;
  //     const accountName = contact?.accountName;
  //     // if (customerOrgModel?.customerRole === 'manager' && customerOrgModel.data && customerOrgModel.customerType === 'customer') {
  //     if (customerOrgModel?.role === 'myCustomer') {
  //       // const customerId = customerOrgModel.data.id.startsWith('customer_') ? customerOrgModel.data.id.split('_')[1] : customerOrgModel.data.id;
  //       const customerId = customerOrgModel?.companyId;
  //       if (!customerInfos.has(customerId)) {
  //         customerInfos.set(customerId, customerOrgModel);
  //       }
  //     } else if (accountName) {
  //       accountNames.push(accountName);
  //     }
  //   });
  //
  //   // 根据 accountNames 换取 customerInfo
  //   if (accountNames.length > 0) {
  //     const { mapRes } = await this.contactApi.doGetContactByEmailsAdvance({
  //       emails: [...new Set(accountNames)],
  //       useEdm: this.systemApi.inEdm(),
  //       needGroup: true,
  //     });
  //     accountNames.forEach(accountName => {
  //       if (mapRes[accountName]) {
  //         const target = mapRes[accountName].find(
  //           // v => v.customerOrgModel?.customerRole === 'manager' && v.customerOrgModel.data && v.customerOrgModel.customerType === 'customer'
  //           v => v.customerOrgModel?.role === 'myCustomer'
  //         );
  //         if (target?.customerOrgModel) {
  //           const customerInfo = target.customerOrgModel;
  //           // const customerId = customerInfo.data.id.startsWith('customer_') ? customerInfo.data.id.split('_')[1] : customerInfo.data.id;
  //           const customerId = customerInfo.companyId;
  //           if (!customerInfos.has(customerId)) {
  //             customerInfos.set(customerId, customerInfo);
  //           }
  //         }
  //       }
  //     });
  //   }
  //
  //   // 获取 ID 发送消息
  //   const customerIds = [...customerInfos.keys()];
  //   console.log('refreshCustomerUnread', customerIds);
  //   // 立刻查询未读数，可能未更新
  //   setTimeout(() => {
  //     this.sendCustomerUnreadEvent({ customerIds: [...new Set(customerIds)] }, true).catch();
  //   }, 1000);
  // }

  // async doListCustomerContactsById(customerId: string): Promise<EntityContact[]> {
  //   const contacts = await this.contactApi.doGetCustomerContactByOrgIds({
  //     idList: [customerId],
  //   });
  //   const result = (contacts[customerId] || []).map(v => v.contact);
  //   console.log('[mail customer list] doListCustomerContacts', result);
  //   return result;
  // }

  // async doListCustomerManagersById(customerId: string, excludeSelf = true): Promise<SimpleContactModel[]> {
  //   const contacts = await this.contactApi.doGetCustomerManagerByIds({
  //     idList: [customerId],
  //   });
  //   const result = contacts[customerId] || [];
  //   const currentUser = this.systemApi.getCurrentUser();
  //   if (excludeSelf && currentUser?.prop?.contactId) {
  //     return result.filter(v => v.contactId !== (currentUser?.prop?.contactId || currentUser?.contact?.contact?.id));
  //   }
  //   console.log('[mail customer list] doListCustomerManagersById', result);
  //   return result;
  // }

  private async getTaskMailInTaskFolder(param: queryMailBoxParam) {
    const taskInternalMap = await this.doGetFullTaskMailList(param, true);
    let result: MailEntryModel[] = [];
    const mids = [...taskInternalMap.mailIdMap.keys()];
    console.log('[task-mail]', param, mids);
    if (mids.length > 0) {
      const taskIdMailModel = await this.doListMailBoxEntriesInternal(
        {
          mids,
          count: mids.length,
          id: param.id,
        },
        false
      );
      if (taskIdMailModel.data && taskIdMailModel.data.length > 0) {
        taskIdMailModel.data = await this.setTaskInfoToMailModel(taskIdMailModel.data, taskInternalMap.taskMap);
      }
      result = [...taskIdMailModel.data];
    }
    const count = result ? result.length : 0;

    if (count > 0) {
      this.mailTaskApi.setTaskPageInfo(param.index || 0, count);
    }
    const paramIndex = param.index || 0;

    return param.returnModel
      ? ({
          query: param,
          count,
          data: result || [],
          total: taskInternalMap.hasMore === 0 || result.length === 0 ? param.index : paramIndex + count + 1,
        } as MailModelEntries)
      : result;
  }

  /**
   * 通过一次遍历MailModel，将
   * 1.进行中和 已逾期的、且不置顶的 全部删除
   * 2.处理列表头部两个置顶邮件
   * */
  private async handleDeleteTaskInMailModel(
    mailModel: MailModelEntries,
    maps: TaskInternalMap,
    handleTop?: boolean,
    onlyDb = false,
    _account?: string
  ): Promise<MailEntryModel[]> {
    // 子账号不需要处理表头的置顶邮件
    const isSubCountReq = window?.isAccountBg;
    if (isSubCountReq) {
      handleTop = false;
    }
    const { mailIdMap, taskMap, twoTaskIds } = maps;
    let top: MailEntryModel[] = [];
    const ret: MailEntryModel[] = [];
    const taskAllSize = mailIdMap.size;
    mailModel.data.forEach((model: MailEntryModel) => {
      if (!model.taskId || !mailIdMap.has(model.entry.id)) {
        ret.push(model);
      }
      if (handleTop) {
        const isTaskTop = twoTaskIds.has(model.id);
        if (isTaskTop) {
          const taskModel = twoTaskIds.get(model.id);
          if (taskModel) {
            model.entry.taskTop = true;
            model.entry.taskNum = taskAllSize;
            top[taskModel.pos] = model;
            twoTaskIds.delete(model.id);
          }
        }
      }
    });
    if (handleTop && twoTaskIds.size > 0) {
      const entries = onlyDb
        ? await this.doListMailEntitiesFromDbInternal(
            {
              mids: Array.from(twoTaskIds.keys()),
              count: twoTaskIds.size,
            },
            _account
          )
        : await this.doListMailBoxEntriesInternal(
            {
              mids: Array.from(twoTaskIds.keys()),
              count: twoTaskIds.size,
              _account,
            },
            false
          );
      if (entries && entries.data) {
        entries.data.forEach(mail => {
          const taskModel = twoTaskIds.get(mail.id);
          if (taskModel) {
            mail.entry.taskTop = true;
            mail.entry.taskNum = taskAllSize;
            top[taskModel.pos] = mail;
          }
        });
      }
    } else {
      // this.doCallMailMsgCenter({
      //   type: 'syncMail',
      //   msgCenter: {
      //     merge: true,
      //     diff: false,
      //     refreshType: 'contentMail',
      //   },
      // });
    }
    top = top.filter(it => !!it);
    // zpy-todp: 是否需要处理？
    top = await this.setTaskInfoToMailModel(top, taskMap);
    return [...top, ...ret];
  }

  // 有分页
  async doGetFullTaskMailList(param: queryMailBoxParam, noCache?: boolean, onlyDb = false): Promise<TaskInternalMap> {
    const mailIdMap: Map<string, string> = new Map<string, string>();
    const twoTaskIds: Map<string, TopTaskModel> = new Map<string, TopTaskModel>();
    const taskMap: Map<number, TaskMailModel> = new Map<number, TaskMailModel>();
    const idx = param?.index || 0;
    const isUseRealList = inWindow() && window.isAccountBg ? param.isRealList : this.mailConfApi.getIsUseRealListSync();
    const { page } = isUseRealList ? { page: Math.floor(idx / param.count) + 1 } : this.mailTaskApi.getTaskPageInfo(idx);

    const reqParams = {
      status: param.filter?.taskTab === 0 ? 0 : 1,
      page: param.id === mailBoxOfTask.id ? page : -1,
      size: param.count,
      detailCount: param.id === mailBoxOfTask.id ? -1 : this.topTaskNum, // 只有邮件任务邮箱列表需要查询全部详情，其他列表只需要最前面两条的详情
    };
    const taskList = await this.mailTaskApi.doGetFullTaskMailList(reqParams, noCache, onlyDb);
    let hasMore = 0;

    if (taskList.success && taskList.data) {
      const { todoList, todoToMails, hasNextPage } = taskList.data;
      if (todoList && todoList.length > 0) {
        todoList.forEach(it => {
          taskMap.set(it.todoId, it);
        });
      }
      if (todoToMails && todoToMails.length > 0) {
        todoToMails.forEach((it, idx) => {
          mailIdMap.set(it.mid, String(it.todoId));
          if (idx < this.topTaskNum) {
            twoTaskIds.set(it.mid, {
              mid: it.mid,
              pos: idx,
              todoId: it.todoId || -1, // 按接口定义，-1 不会出现
            });
          }
        });
      }
      hasMore = hasNextPage;
    }
    return {
      mailIdMap,
      twoTaskIds,
      hasMore,
      taskMap,
    };
  }

  /** 查找todoId对应的 taskInfo，然后加入到mailmodel上
   * * */
  private async setTaskInfoToMailModel(mailModel: MailEntryModel[], map?: Map<number, TaskMailModel>): Promise<MailEntryModel[]> {
    const todoIds: number[] = [];
    let _account;
    mailModel.forEach(model => {
      if (model.taskId) {
        todoIds.push(model.taskId);
        _account = model._account;
      }
    });

    if (todoIds.length > 0) {
      const { completeTaskMap } = await this.doGetTaskMailContent(todoIds, map, _account);
      mailModel.forEach(model => {
        if (model.taskId && completeTaskMap.has(String(model.taskId))) {
          model.taskInfo = completeTaskMap.get(String(model.taskId));
        }
      });
    }
    return mailModel;
  }

  /**
   * 按照id 获取 任务详情
   * @param todoIds
   * @param map
   * @private
   */
  private async doGetTaskMailContent(todoIds: number | number[], map?: Map<number, TaskMailModel>, _account?: string) {
    const completeTaskMap: Map<string, TaskMailModel> = new Map<string, TaskMailModel>();
    const remain: number[] = [];
    const idss = Array.isArray(todoIds) ? todoIds : [todoIds];
    const targetActions = this.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    const taskMap = targetActions?.taskMailMap?.taskMap;
    if ((taskMap && taskMap.size > 0) || (map && map.size > 0)) {
      idss.forEach(it => {
        if (taskMap && taskMap.has(it)) {
          completeTaskMap.set(String(it), taskMap.get(it)!);
        } else if (map && map.has(it)) {
          completeTaskMap.set(String(it), map.get(it)!);
        } else {
          remain.push(it);
        }
      });
    } else {
      remain.push(...idss);
    }
    if (remain.length > 0) {
      const taskMailModel = await this.mailTaskApi.doGetTaskMailContent(remain, false);

      if (taskMailModel.success && taskMailModel.data) {
        taskMailModel.data.forEach(model => {
          completeTaskMap.set(String(model.todoId), model);
        });
      }
    }
    return { completeTaskMap };
  }

  private async doListMailBoxEntriesInternal(param: queryMailBoxParam, noCache: boolean | undefined): Promise<MailModelEntries> {
    param.returnModel = true;
    const { _account } = param;
    const actions = this.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    if (param.id && actions && actions.mailBoxDic && actions.mailBoxDic[param.id as number] && actions.mailBoxDic[param.id as number].locked) {
      return Promise.reject(ErrResult.FA_NEED_AUTH2);
    }
    if (actions) {
      actions.curMailListReqSeq = actions.curMailSequenceGen.next();
      param.querySeq = actions.curMailListReqSeq;
    }
    const isUseRealList = inWindow() && window.isAccountBg ? param.isRealList : this.mailConfApi.getIsUseRealListSync();

    // 星标联系人查询邮件，提前处理一下
    if (param.checkType === 'checkStarMail' && !param.attrConf) {
      const attrConf = await this.modelHandler.doGetStarContactQuery(param.id, _account);
      if (!attrConf.id || attrConf.emailList.length === 0) {
        return {
          data: [],
          total: 0,
          index: param.index || 0,
          count: param.count,
          query: param,
        };
      }
      param.attrConf = {
        ...attrConf,
        attrType: 'star',
      };
    }
    let result: MailModelEntries | undefined;

    if (isUseRealList && param.isRealList && actions) {
      actions.curRealListReqSeq = actions.curMailSequenceGen.next();
      param.querySeq = actions.curRealListReqSeq;
      noCache = true;
    }

    console.log('[mail list] use Query', param, noCache);
    if (!noCache && !(param.id && param.id === mailBoxOfTask.id)) {
      result = await this.mailDbHandler.doListMailEntry(param, _account);
      console.log('[mail list] get mail entry from db', result);

      if (result && result.data && result.data.length >= 1) {
        result.total = isUseRealList && param.isRealList ? result.total : (param.index || 0) + param.count * 2;

        const cachedIds = new Set<string>();
        if (param.mids && param.mids.length > 0) {
          // 按id查找的数据比对，只需要比较缓存真实返回的数据，其他缓存没有的id,无需比较
          result.data.forEach(it => cachedIds.add(it.id));
          this.syncAndResendMailEntry(
            {
              mids: Array.from(cachedIds),
              count: cachedIds.size,
              id: param.id,
              returnModel: true,
            },
            result,
            undefined,
            _account
          );
        } else {
          this.syncAndResendMailEntry(param, result, undefined, _account);
        }

        const isCorpMail = this.systemApi.getIsCorpMailMode();
        if (isCorpMail) {
          this.removeThreadInfoForCorp(result.data);
          result.data = this.sortMailList(result.data);
        }

        // 如果按id查询，且缓存内数据缺少，需补足数据
        if (param.mids && param.mids.length > 0 && result.data.length < param.mids.length) {
          const remainIds = param.mids.filter(it => !cachedIds.has(it));
          const remain = (await this.mailContentHandler.doListMailBoxEntities(
            {
              mids: remainIds,
              count: remainIds.length,
              returnModel: true,
              _account,
            },
            true
          )) as MailModelEntries;
          if (remain && remain.data && remain.data.length > 0) {
            result.data.push(...remain.data);
            // 缓存没有id的数据，从网络拿到，直接添加入库
            this.saveMails(remain.data, undefined, param.attrConf, _account).then();
          }
        }
        return result;
      }
      // if (!result || !result.data) {
      //   if (environment === 'local') {
      //     this.eventApi.sendSysEvent({
      //       eventName: 'error',
      //       eventLevel: 'error',
      //       eventStrData: '',
      //       eventData: {
      //         popupType: 'toast',
      //         popupLevel: 'info',
      //         title: '数据库查询邮件列表未成功，' + param.id + ':' + param.index,
      //         code: 'PARAM.ERR',
      //       } as PopUpMessageInfo,
      //       eventSeq: 0,
      //     });
      //   }
      // }
    }

    // 从服务器拉取
    return this.listMailEntryFromNetwork(param, noCache).then(async res => {
      const totalCount = !Array.isArray(res) ? res.total : null;
      let data = Array.isArray(res) ? res : res.data;
      // 针对待办文件夹进行一个特殊的排序
      if (param.id === mailBoxOfDefer.id) {
        data = data.sort((a, b) => {
          if (a.entry.deferTime && b.entry.deferTime) {
            const aTime = util.parseDate(a.entry.deferTime);
            const bTime = util.parseDate(b.entry.deferTime);
            if (aTime !== bTime) {
              return 0;
            }
          }
          if (a.entry.sendTime && b.entry.sendTime) {
            const aDate = util.parseDate(a.entry.sendTime);
            const bDate = util.parseDate(b.entry.sendTime);
            if (aDate && bDate) {
              return bDate - aDate;
            }
          }
          return 0;
        });
      }

      /**
       * 聚合模式下，如果是聚合模式，则对齐一下fid
       * 下面为兼容逻辑
       * 解决聚合邮件请求特定文件夹下的邮件数据，返回的邮件fid可能为其他文件夹。
       * 因为聚合邮件的子邮件可能在多个文件夹，逻辑上没问题，但需要做统一。
       */
      try {
        if (param?.checkType === 'checkThread') {
          const fid = param?.id;
          data.forEach(item => {
            if (item?.isThread && item?.convFids && item?.convFids?.length && fid != null && item?.convFids.includes(fid)) {
              item.entry.folder = fid;
            }
          });
        }
      } catch (e) {
        console.error('checkThread fid error', e);
      }

      const isCorpMail = this.systemApi.getIsCorpMailMode();
      if (!param.noSync && !isCorpMail && !(param.id && param.id === mailBoxOfTask.id)) {
        this.syncAndResendMailEntry(param, undefined, data, _account);
      }

      if (!result || !result.data || result.data.length === 0) {
        return res as MailModelEntries;
      }
      console.log('[mail] return entry by list entry and cache ?? :', res, result);

      if (result) {
        result.data = result.data || [];
        result.total = (isUseRealList ? totalCount : null) || (Array.isArray(res) ? res.length : res.total);
        data = result.data.concat(data);
        if (param.id !== mailBoxOfDefer.id) {
          result.data = this.sortMailList(data);
        }
      }
      return result;
    });
  }

  async doGetThreadMailById(threadId: string, _account?: string): Promise<MailEntryModel | undefined> {
    const result = await this.mailDbHandler.getMailById({
      id: threadId,
      noContent: true,
      _account,
    });
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return Promise.resolve(undefined);
  }

  private listMailEntryFromNetwork(param: queryMailBoxParam, noCache: undefined | boolean) {
    const { _account } = param;
    const actions = this.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account: _account || param._account,
    })?.val;

    const promise = this.mailContentHandler.doListMailBoxEntities(param, noCache).then(res => {
      const data = Array.isArray(res) ? res : res.data;
      if (!Array.isArray(res)) {
        if (actions && param.id && actions.mailBoxDic && actions.mailBoxDic[param.id] && res.total !== actions.mailBoxDic[param.id].mailBoxTotal) {
          this.syncAndResendMailBox([], _account);
        }
      }
      if (data.length === 0) {
        this.loggerHelper.track('mail_box_db_reach_the_final_mail', {
          param,
        });
      }
      const currentUser = this.systemApi.getCurrentUser(_account);
      const data1 = data.map((item: MailEntryModel) => {
        if (item.entry.folder === mailBoxOfSent.id) {
          return {
            ...item,
            authAccountType: (currentUser?.prop?.authAccountType as string) || null,
          };
        }
        return item;
      });
      console.log('[mail] get mail entry from network', data1);
      return Array.isArray(res) ? data1 : { ...res, data: data1 };
    });
    return promise;
  }

  doLoadMailInitParamLocal(mid: string): WriteMailInitModelParams | undefined {
    return this.mailOperationHandler.doLoadMailInitParamLocal(mid);
  }

  async updateMessageTags(params: RequestMailTagRequest, isThread?: boolean, needCheckThread = true, _account?: string): Promise<CommonBatchResult | ''> {
    if (
      !params ||
      !params.ids ||
      params.ids.length === 0 ||
      ((!params.add || params.add.length === 0) && (!params.set || params.set.length === 0) && (!params.delete || params.delete.length === 0))
    ) {
      this.sendMailOperationEvent({
        eventStrData: 'tag',
        status: 'fail',
        params: { ...params, isThread, _account },
        reason: new Error('请求参数错误'),
      });
      return Promise.reject(new Error('请求参数错误'));
    }
    if (needCheckThread) {
      this.sendMailOperationEvent({
        eventStrData: 'tag',
        status: 'start',
        params: { ...params, isThread, _account },
      });
      const { threadIds, normalIds } = await this.mailDbHandler.classifyThreadMailsByIds(params.ids, undefined, _account);
      const normalPromise =
        normalIds.length > 0
          ? (this.updateMessageTags({ ...params, ids: normalIds }, false, false, _account) as Promise<CommonBatchResult>)
          : Promise.resolve({ succ: true, data: [] });
      const threadPromise =
        threadIds.length > 0
          ? (this.updateMessageTags({ ...params, ids: threadIds }, true, false, _account) as Promise<CommonBatchResult>)
          : Promise.resolve({ succ: true, data: [] });
      return Promise.all([normalPromise, threadPromise]).then(([v1, v2]) => {
        this.sendMailOperationEvent({
          eventStrData: 'tag',
          status: [v1 && v1.succ, v2 && v2.succ],
          params: { ...params, isThread, _account },
          result: [v1.data as EntityMailStatus[], v2.data as EntityMailStatus[]],
          reason: v1.failReason || v2.failReason,
        });
        if (v1 && v2 && v1.succ && v2.succ) {
          return '';
        }
        return Promise.reject();
      });
    }

    const origin: EntityMailStatus[] = [];
    const result = await this.mailDbHandler.updateMessageTags(params, origin, isThread, _account);

    this.sendMailOperationEvent({
      eventStrData: 'tag',
      status: 'local',
      params: { ...params, isThread, _account },
      result: [result],
    });

    try {
      await this.mailOperationHandler.updateMessageTags(params, isThread, _account);
    } catch (e) {
      if (origin.length > 0) {
        await this.mailDbHandler.updateMailStatus(origin, _account);
        if (isThread) {
          this.doListThreadMailBoxEntities({ mids: params.ids, count: params.ids.length }, true, _account).then();
        } else {
          this.doListMailBoxEntities({ mids: params.ids, count: params.ids.length, _account }, true).then();
        }
      }
      return { succ: false, data: origin };
    }
    return { succ: true, data: result };
  }

  async refreshDbMailsByTag(tagOpItems: NewTagOpItem[], type: TagManageOps, _account?: string) {
    const isThread = this.mailConfApi.getMailMergeSettings() === 'true';
    const newTags = tagOpItems.map(v => v.tag);
    const query: queryMailBoxParam = {
      count: 1000,
      index: 0,
      returnModel: true,
      returnTag: true,
      checkType: isThread ? 'checkThread' : 'normal',
      tag: newTags,
    };
    const result = (await this.mailDbHandler.buildQuery(query, _account)) as EntityMailStatus[];
    console.log('[refreshMailsByTag] query', newTags, type, result);
    if (result && result.length > 0) {
      result.forEach(v => {
        if (type === 'add') {
          v.tags = Array.isArray(v.tags) ? [...new Set([...v.tags, ...newTags])] : newTags;
        } else if (type === 'delete') {
          v.tags = Array.isArray(v.tags) ? v.tags.filter(tag => !newTags.includes(tag)) : [];
        } else {
          v.tags = Array.isArray(v.tags)
            ? v.tags.map(tag => {
                const it = tagOpItems.find(o => o.tag === tag);
                if (it) {
                  return it.alias || tag;
                }
                return tag;
              })
            : newTags;
        }
      });
      console.log('[refreshMailsByTag] update', result);
      await this.db.putAll(mailTable.status, result, undefined, _account);
      console.log('[refreshMailsByTag] saved', result);
    }
  }

  private async getAllMoveOrDelMids(
    id: string | string[],
    ignoreFakeThreadId?: boolean,
    _account?: string
  ): Promise<{
    normalIds: string[];
    threadIds: string[];
    fakeThreadIds: string[];
  }> {
    const ids = Array.isArray(id) ? id : [id];
    const isThreadMode = this.mailConfApi.getMailMergeSettings() === 'true';
    if (!isThreadMode) {
      return {
        normalIds: ids,
        threadIds: [],
        fakeThreadIds: [],
      };
    }
    const { normalIds, threadIds, fakeThreadIds } = await this.mailDbHandler.classifyThreadMailsByIds(ids, ignoreFakeThreadId, _account);
    let allNormalIds = [...normalIds];
    if (!ignoreFakeThreadId) {
      const { threadMessages } = await this.mailDbHandler.getThreadMessageByThreadIds(threadIds, _account);
      allNormalIds = [...allNormalIds, ...threadMessages.map(v => v.mid)];
    }
    return {
      normalIds: allNormalIds,
      threadIds,
      fakeThreadIds,
    };
  }

  // eslint-disable-next-line max-params
  async doDeleteMail({ fid, id, isThread, needCheckThread = true, delFolder = !id, _account }: DelMailParams): Promise<CommonBatchResult> {
    needCheckThread = this.getNeedCheckThread(needCheckThread);
    // eslint-disable-next-line no-nested-ternary
    const perfType = delFolder ? 'deleteFolder' : fid === mailBoxOfDeleted.id ? 'completeDelete' : 'delete';
    if (needCheckThread) {
      mailPerfTool.moveMail(perfType, 'start', {
        isThread,
      });
      this.sendMailOperationEvent({
        eventStrData: 'delete',
        status: 'start',
        params: { id, fid, isThread },
        _account,
      });

      let targetId = id;
      if (!targetId) {
        const folderRes = (await this.db.getByEqCondition(
          {
            query: { folder: fid },
            ...mailTable.status,
            _dbAccount: _account,
          },
          _account
        )) as EntityMailStatus[];
        targetId = folderRes.filter(v => !!v).map(v => v.mid);
      }
      const { normalIds, threadIds } = await this.getAllMoveOrDelMids(targetId, undefined, _account);
      const normalPromise =
        normalIds.length > 0
          ? () =>
              this.doDeleteMail({
                fid,
                id: normalIds,
                isThread: false,
                needCheckThread: false,
                delFolder,
                _account,
              })
          : () => Promise.resolve({ succ: true, data: [] });
      const threadPromise = threadIds.length > 0 ? () => this.doDeleteThreadMail(threadIds, undefined, _account) : () => Promise.resolve({ succ: true, data: [] });
      return Promise.all([normalPromise(), threadPromise()]).then(([v1, v2]) => {
        this.sendMailOperationEvent({
          eventStrData: 'delete',
          status: [v1 && v1.succ, v2 && v2.succ],
          params: { id, fid, isThread },
          result: [v1.data as EntityMailStatus[], v2.data as EntityMailStatus[]],
          reason: v1.failReason || v2.failReason,
          _account,
        });
        if (v1 && v2 && v1.succ && v2.succ) {
          mailPerfTool.moveMail(perfType, 'end', {
            isThread,
            result: 'success',
          });
          // 为了异步更新星标联系人文件夹的未读数
          this.doListMailBox(undefined, undefined, undefined, _account).then();
          return { succ: true };
        }
        mailPerfTool.moveMail(perfType, 'end', {
          isThread,
          result: 'fail',
        });
        return Promise.reject();
      });
    }
    const origin: EntityMailStatus[] = [];
    const deletedId: string[] = [];
    const moveId: string[] = [];

    const result = await this.mailDbHandler.doDeleteMail({
      originData: origin,
      fid,
      id,
      isThread,
      deletedId,
      moveId,
      ignoreThread: true,
      _account,
    });
    const delFolderPromise = delFolder
      ? () =>
          this.mailOperationHandler.doDeleteMail({
            fid,
            isThread,
            _account,
          })
      : () => Promise.resolve({ succ: true });
    const movePromise =
      !delFolder && moveId && moveId.length > 0
        ? () =>
            this.mailOperationHandler.doDeleteMail({
              fid: mailBoxOfDefault.id,
              id: moveId,
              isThread,
              _account,
            })
        : () => Promise.resolve({ succ: true });
    const delPromise =
      (!delFolder && deletedId && deletedId.length) > 0
        ? () =>
            this.mailOperationHandler.doDeleteMail({
              fid: mailBoxOfDeleted.id,
              id: deletedId,
              isThread,
              _account,
            })
        : () => Promise.resolve({ succ: true });

    const retryFn = async () => {
      const re = await Promise.all([delFolderPromise(), delPromise(), movePromise()]);
      if (re[0] && re[0].succ && re[1] && re[1].succ && re[2] && re[2].succ) {
        if (deletedId.length > 0) {
          this.mailDbHandler
            .deleteInActionById(deletedId, _account)
            .then()
            .catch(e => {
              console.error('deleteInActionById', e);
            });
        }
        return { succ: true };
      }
      return Promise.reject();
    };
    const retryGetResult = await this.retryCall(retryFn);
    if (retryGetResult.succ) {
      return { succ: retryGetResult.succ, data: result };
    }
    if (origin && origin.length > 0) {
      await this.mailDbHandler.updateMailStatus(origin, _account);
      id = moveId || id;
      if (id) {
        this.doListMailBoxEntities(
          {
            mids: Array.isArray(id) ? id : [id],
            count: Array.isArray(id) ? id.length : 1,
            _account,
          },
          true
        ).then();
      }
    }
    return { succ: false, data: origin };
  }

  doDeleteThreadMail(id: string | string[], fakeThreadIds?: string[], _account?: string): Promise<CommonBatchResult> {
    return this.doMoveThreadMail(id, 4, fakeThreadIds, _account);
  }

  private sendMailOperationEvent(params: MailOpEventParams) {
    const data = Array.isArray(params.result) ? params.result.filter(v => !!v).flat(1) : undefined;
    const mapResult = Array.isArray(data)
      ? data.reduce<Map<string, EntityMailStatus | MailOpReplyPayload>>((total, current) => {
          if (current && !total.has(current.mid)) {
            total.set(current.mid, current as EntityMailStatus);
          }
          return total;
        }, new Map())
      : undefined;
    let statusText;
    if (Array.isArray(params.status)) {
      const [v1, v2] = params.status;
      if (v1 && v2) {
        statusText = 'success';
      } else if (!v1 && !v2) {
        statusText = 'fail';
      } else {
        statusText = 'partial';
      }
    } else {
      statusText = params.status;
    }
    console.log('[mail operation]', statusText, params.eventStrData, params.params, mapResult);
    const ev: SystemEvent = {
      eventName: 'mailStoreRefresh',
      eventStrData: 'mailOp',
      eventData: {
        status: statusText,
        params: params.params,
        reason: params.reason,
        result: mapResult,
        opType: params.eventStrData,
      },
      _account: params._account,
    };
    // storeMailOps.updateMailEntity(ev);
    // if (this.systemApi.isElectron()) {
    //   this.eventApi.sendSysEvent(ev);
    // }
    this.eventApi.sendSysEvent(ev);
    // 17版本智能模式下线
    // if (params.eventStrData === 'delete') {
    //   setTimeout(() => {
    //     this.mailOperationEmailListChange(ev).then();
    //   });
    // }
  }

  private async retryCall(fn: (...args: any) => Promise<CommonBatchResult>, failReason = '', retry = 3): Promise<CommonBatchResult> {
    const data = await fn();
    if (data && data.succ) {
      return Promise.resolve(data);
    }
    await wait((3 - retry) * 200 + 500);
    if (retry > 0) {
      return this.retryCall(fn, failReason, retry - 1);
    }
    return Promise.reject(new Error(failReason));
  }

  // eslint-disable-next-line max-params, max-statements
  async doMarkMail(
    mark: boolean,
    id: string[] | string,
    type: MailOperationType,
    isThread?: boolean,
    needCheckThread = true,
    payload?: MarkPayload,
    _account?: string
  ): Promise<CommonBatchResult> {
    console.log('doMarkMail in api start');
    if (!id || (Array.isArray(id) && id.length === 0) || mark === undefined) {
      this.sendMailOperationEvent({
        eventStrData: type,
        status: 'fail',
        params: { mark, id, type },
        reason: new Error('请求参数错误'),
        _account,
      });
      this.dataTrackerHelper.track('mark_mail_error', {
        stage: 'pre',
        mark,
        type,
        id,
        isThread,
        _account,
      });
      return Promise.reject(new Error('请求参数错误'));
    }
    needCheckThread = this.getNeedCheckThread(needCheckThread);
    if (needCheckThread) {
      this.sendMailOperationEvent({
        eventStrData: type,
        status: 'start',
        params: { mark, id, type },
        _account,
      });
      const { threadIds, normalIds } = await this.mailDbHandler.classifyThreadMailsByIds(id, undefined, _account);
      // 高级搜索返回的邮件不入库，直接请求服务端,如果threadIds，normalIds都为空，表示本地库没有当前邮件，可以直接请求远程
      if (!threadIds.length && !normalIds.length) {
        try {
          // const retryFn = () =>
          // this.mailOperationHandler.doMarkMail({
          //   mark,
          //   id,
          //   type,
          //   isThread,
          //   payload,
          //   _account,
          // });
          const res = await this.mailOperationHandler.doMarkMail({
            mark,
            id,
            type,
            isThread,
            payload,
            _account,
          });
          const { succ } = res;
          // 远程请求成功
          if (succ) {
            // 发送事件通知redux
            const operationEventParams = {
              eventStrData: type,
              status: 'local',
              params: { mark, id, type },
            };
            this.sendMailOperationEvent({
              ...operationEventParams,
              status: 'local',
              _account,
            });
            this.sendMailOperationEvent({
              ...operationEventParams,
              status: 'success',
              _account,
            });
            // 在根据id请求一次邮件，同步本地库，防止一直没有此封邮件
            this.doListMailBoxEntities({ mids: Array.isArray(id) ? id : [id], count: 1, _account }, true);
            return Promise.resolve({ succ: true });
          }
          this.sendMailOperationEvent({
            eventStrData: type,
            status: 'fail',
            params: { mark, id, type },
            reason: new Error('操作失败'),
            _account,
          });
          return Promise.reject(new Error('操作失败'));
        } catch (ex) {
          this.sendMailOperationEvent({
            eventStrData: type,
            status: 'fail',
            params: { mark, id, type },
            reason: new Error('操作失败'),
            _account,
          });
          return Promise.reject(ex);
        }
      } else {
        const normalPromise = normalIds.length > 0 ? this.doMarkMail(mark, normalIds, type, false, false, payload, _account) : Promise.resolve({ succ: true, data: [] });
        const threadPromise = threadIds.length > 0 ? this.doMarkMail(mark, threadIds, type, true, false, payload, _account) : Promise.resolve({ succ: true, data: [] });

        return Promise.all([normalPromise, threadPromise])
          .then(([v1, v2]) => {
            this.sendMailOperationEvent({
              eventStrData: type,
              status: [v1 && v1.succ, v2 && v2.succ],
              params: { mark, id, type },
              result: [v1.data as EntityMailStatus[], v2.data as EntityMailStatus[]],
              reason: v1.failReason || v2.failReason,
              _account,
            });
            if (v1 && v1.succ && v2 && v2.succ) {
              return { succ: true };
            }
            this.loggerHelper.track('doMarkMail_error_track', {
              key: 'Promise.all([normalPromise, threadPromise])',
              res: `v1: ${v1}, v2: ${v2}`,
            });
            return Promise.reject(!v1?.succ ? v1 : v2);
          })
          .catch(e => {
            this.sendMailOperationEvent({
              eventStrData: type,
              status: 'fail',
              params: { mark, id, type },
              reason: e,
              _account,
            });
            this.loggerHelper.track('doMarkMail_error_track', {
              key: 'Promise.all([normalPromise, threadPromise]) catch',
              res: `e: ${e}`,
            });
            return Promise.reject(e);
          });
      }
    }
    const result = await this.mailDbHandler.doMarkMail(mark, id, type, isThread, payload, _account);
    if (process.env.BUILD_ISEDM && !isThread && type === 'read' && id) {
      const ids = Array.isArray(id) ? id : [id];
      if (ids.length > 0) {
        this.mailDbHandler
          .getMailById({
            id: ids,
            noContent: true,
            noAttachment: true,
            noStatus: true,
            noContactRace: true,
            _account,
          })
          .then(model => {
            if (model.length > 0) {
              this.doUpdateCustomersByNewMail(model, 'unread');
            }
          });
      }
    }
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    const operationEventParams = {
      eventStrData: type,
      status: 'local',
      params: { mark, id, type },
      result: [result],
    };
    this.sendMailOperationEvent({
      ...operationEventParams,
      status: 'local',
      _account,
    });
    console.log('doMarkMail in api db done');
    const idsInDb = Array.isArray(result) ? result.filter(v => (isCorpMail ? true : (isThread && v.isThread) || (!isThread && !v.isThread))).map(it => it.mid) : [];
    const idsNotInDb = (Array.isArray(id) ? id : [id])
      .filter(v => !idsInDb.includes(v))
      .filter(v => (isCorpMail ? true : (isThread && util.isThreadMailById(v)) || (!isThread && !util.isThreadMailById(v))))
      .map(util.getReadThreadId);
    const allIds = [...new Set([...idsInDb, ...idsNotInDb])];
    if (type === 'read') {
      this.loggerHelper.track('mark_mail', {
        stage: 'after_db',
        mark,
        id,
        isThread,
        result,
        allIds,
      });
    }
    try {
      const retryFn = () =>
        this.mailOperationHandler.doMarkMail({
          mark,
          id: allIds,
          type,
          isThread,
          payload,
          _account,
        });
      await this.retryCall(retryFn);
      console.log('doMarkMail in api server done');
      if (type === 'read') {
        this.loggerHelper.track('mark_mail', {
          stage: 'after_request',
          mark,
          id,
          isThread,
        });
      }
    } catch (ex) {
      this.dataTrackerHelper.track('mark_mail_error', {
        stage: 'request',
        mark,
        type,
        id: allIds,
        isThread,
        error: ex,
      });
      let oData: EntityMailStatus[] | undefined;
      if (idsInDb.length > 0) {
        // 本地数据回滚
        oData = await this.mailDbHandler.doMarkMail(!mark, idsInDb, type, isThread, undefined, _account);
      }
      // 重查一遍远端数据
      this.doListMailBoxEntities(
        {
          mids: allIds,
          count: allIds.length,
          checkType: isThread ? 'checkThread' : 'normal',
          _account,
        },
        true
      ).then();
      this.loggerHelper.track('doMarkMail_error_track', {
        key: 'const retryFn = () => this.mailOperationHandler.doMarkMail',
        res: `e: ${ex}, id: ${id}`,
      });
      return { succ: false, data: oData, failReason: ex as Error };
    }
    if (isCorpMail) {
      this.sendMailOperationEvent({
        ...operationEventParams,
        status: 'success',
      });
    }
    await this.modelHandler.notifyFolderCountChange(true, _account);
    console.log('doMarkMail in api notifyFolderCountChange');
    return { succ: true, data: result };
  }

  // 记录邮件的阅读状态
  async recordMailRead(id: string | string[], _account?: string): Promise<CommonBatchResult> {
    const result = await this.mailOperationHandler.doMarkMail({
      mark: true,
      id,
      type: 'read',
      isThread: false,
      _account,
    });
    return { succ: true, data: result };
  }

  async doMarkMailFolderRead(fids: number[], isThread = false): Promise<CommonBatchResult> {
    if (this.markingMailsRead) {
      console.warn('[mail] doMarkMailFolderRead 正在标记');
      return { succ: false };
    }
    this.markingMailsRead = true;
    const target: queryMailBoxParam = {
      index: 0,
      id: -4,
      count: 100,
      order: 'date',
      desc: true,
      filter: {
        flags: { read: false },
      },
      checkType: isThread ? 'checkThread' : 'normal',
      returnModel: false,
      returnTag: false,
      noContactRace: false,
    };

    const mailBoxMarkRead = async (idx: number): Promise<CommonBatchResult> =>
      new Promise(resolve => {
        if (!fids[idx]) {
          this.markingMailsRead = false;
          resolve({ succ: true });
          return;
        }
        target.id = fids[idx];
        console.log('[mail] doMarkMailFolderRead target.id', target.id);
        try {
          this.listMailEntryFromNetwork(target, true)
            .then(async res => {
              const data = Array.isArray(res) ? res : res.data;
              if (data.length) {
                console.log('[mail] doMarkMailFolderRead res mids', data);
                await this.doMarkMail(
                  true,
                  data.map(item => item.id),
                  'read',
                  isThread
                );
              }
              setTimeout(() => {
                if (data.length) {
                  resolve(mailBoxMarkRead(idx));
                } else {
                  resolve(mailBoxMarkRead(idx + 1));
                }
              }, 500);
            })
            .catch(async reason => {
              console.warn('[mail] doMarkMailFolderRead promise catch', reason);
              this.markingMailsRead = false;
              await this.doMarkMailInfFolder(true, fids[idx]);
              resolve(mailBoxMarkRead(idx + 1));
            });
        } catch (error) {
          console.warn('[mail] doMarkMailFolderRead error', error);
          this.markingMailsRead = false;
          this.doMarkMailInfFolder(true, fids[idx]);
          resolve(mailBoxMarkRead(idx + 1));
        }
      });
    return mailBoxMarkRead(0);
  }

  async doMarkMailDefer(mid: string | string[], isDefer: boolean, conf?: MailDeferParams, markAll?: boolean, _account?: string): Promise<CommonBatchResult> {
    const params = { mid, isDefer, conf };
    if (isDefer && !conf && !markAll) {
      this.sendMailOperationEvent({
        eventStrData: 'defer',
        status: 'fail',
        params,
        reason: new Error('请求参数错误'),
        _account,
      });
      return Promise.reject(new Error('请求参数错误'));
    }
    if (!markAll) {
      this.sendMailOperationEvent({
        eventStrData: 'defer',
        status: 'start',
        params,
        _account,
      });
    }
    const deferParams: MailDeferParams = {
      deferTime: conf?.deferTime || -1,
      deferNotice: conf?.deferNotice || false,
    };
    // 与其他邮件标记的差异有点大，就没有走 mailDbHandler.doMarkMail 方法
    // 主要区别是：待办标记时的筛选规则不同，待办文件夹展示的数目是今日和逾期数目，不像未读数，可以本地计算，所以标记后直接重新同步文件夹
    const result = await this.mailDbHandler.doMarkMailDefer(mid, isDefer, deferParams, _account);
    if (!markAll) {
      this.sendMailOperationEvent({
        eventStrData: 'defer',
        status: 'local',
        params,
        result: [result],
        _account,
      });
    }
    const newId: string[] = Array.isArray(result) ? result.map(v => v.mid) : [];
    if (newId.length > 0) {
      const retryFn = () =>
        this.mailOperationHandler.doMarkMail({
          mark: isDefer,
          id: newId,
          type: 'defer',
          needFilter: false,
          deferParams,
          _account,
        });
      try {
        const res = await this.retryCall(retryFn);
        if (!markAll) {
          this.sendMailOperationEvent({
            eventStrData: 'defer',
            status: res?.succ ? 'success' : 'fail',
            params,
            result: [result],
            _account,
          });
        }
        await this.doListMailBox(true, undefined, undefined, _account);
        return { succ: res?.succ, data: result };
      } catch (e) {
        this.sendMailOperationEvent({
          eventStrData: 'defer',
          status: 'fail',
          params,
          _account,
        });
        return { succ: false };
      }
    }
    return { succ: true, data: result };
  }

  async doMarkMailDeferAll(deferTime?: string, _account?: string): Promise<CommonBatchResult> {
    this.sendMailOperationEvent({
      eventStrData: 'deferAll',
      status: 'start',
      params: null,
      _account,
    });
    try {
      const allDeferMails = await this.doListMailBoxEntities(
        {
          count: 3000,
          id: mailBoxOfDefer.id,
          index: 0,
          returnModel: true,
          returnTag: true,
          topFlag: 'top',
          filter: {
            defer: deferTime,
          },
          _account,
        },
        true
      );
      const mids = (Array.isArray(allDeferMails) ? allDeferMails : allDeferMails.data).map(v => v.id);
      console.log('[doMarkMailDeferAll] mails', allDeferMails);

      if (mids.length > 0) {
        const markRes = await this.doMarkMailDefer(mids, false, undefined, true, _account);
        console.log('[doMarkMailDeferAll] result', markRes);
        this.sendMailOperationEvent({
          eventStrData: 'deferAll',
          status: markRes.succ ? 'success' : 'fail',
          params: null,
          _account,
        });
        return markRes;
      }
      return { succ: true };
    } catch (e) {
      this.sendMailOperationEvent({
        eventStrData: 'deferAll',
        status: 'fail',
        params: null,
        _account,
      });
      return { succ: false };
    }
  }

  async doMarkStarMailAll(mailboxId: string | number): Promise<CommonBatchResult> {
    if (!this.modelHandler.isValidStarFolderId(mailboxId)) {
      return { succ: false, failReason: new Error('无效的星标联系人ID') };
    }
    const inQueue = this.markStarMailQueue.queue.some(v => v.id === mailboxId);
    if (inQueue) {
      return { succ: false, failReason: new Error('星标联系人标记中') };
    }
    return new Promise(resolve => {
      const task = () => this.doMarkStarMailAllHandler.call(this, mailboxId, 0).then(resolve).catch(resolve);
      this.markStarMailQueue.queue.push({
        id: mailboxId,
        task,
      });
      if (!this.markStarMailQueue.runningId) {
        this.doMarkStarMailAllTask();
      }
    });
  }

  private async doMarkStarMailAllTask() {
    const current = this.markStarMailQueue.queue.shift();
    if (current) {
      this.markStarMailQueue.runningId = current.id;
      await current.task();
      if (this.markStarMailQueue.queue.length > 0) {
        await this.doMarkStarMailAllTask();
      } else {
        this.markStarMailQueue.runningId = '';
      }
    } else {
      this.markStarMailQueue.runningId = '';
    }
  }

  private async doMarkStarMailAllHandler(mailboxId: string | number, retry = 0): Promise<CommonBatchResult> {
    const reqParam: queryMailBoxParam = {
      index: 0,
      id: mailboxId as number,
      count: 100,
      order: 'date',
      desc: true,
      filter: {
        flags: { read: false },
      },
      checkType: 'checkStarMail',
      returnModel: false,
      returnTag: false,
      noContactRace: false,
    };
    return new Promise(resolve => {
      try {
        this.listMailEntryFromNetwork(reqParam, true)
          .then(async res => {
            const data = Array.isArray(res) ? res : res.data;
            if (data.length) {
              console.log('[mail] doMarkMailFolderRead res mids', data);
              await this.doMarkMail(
                true,
                data.map(item => item.id),
                'read'
              );
            }
            setTimeout(() => {
              if (data.length) {
                resolve(this.doMarkStarMailAllHandler(mailboxId, 0));
              } else {
                resolve({ succ: true });
              }
            }, 500);
          })
          .catch(async reason => {
            console.warn('[star mail] mark all list failed', reason);
            if (retry < 3) {
              resolve(this.doMarkStarMailAllHandler(mailboxId, retry + 1));
            } else {
              resolve({ succ: false, failReason: new Error(reason) });
            }
          });
      } catch (reason) {
        console.warn('[star mail] mark all mark failed', reason);
        if (retry < 3) {
          resolve(this.doMarkStarMailAllHandler(mailboxId, retry + 1));
        } else {
          resolve({ succ: false, failReason: new Error(typeof reason === 'string' ? reason : '') });
        }
      }
    });
  }

  async doMarkMailPerferred(email: string[], priority: EmailListPriority, op: MailPerferedOpType, _account?: string): Promise<CommonBatchResult> {
    const res = await this.mailOperationHandler.doMarkMailPerferred(email, priority, op, _account);
    return res;
  }

  async doMarkMailInfFolder(mark: boolean, fid: number, _isThread?: boolean, _account?: string): Promise<CommonBatchResult> {
    const isThread = _isThread || this.mailConfApi.getMailMergeSettings() === 'true';
    if (mark === undefined || !fid || fid < 0) {
      this.sendMailOperationEvent({
        eventStrData: 'markFolder',
        status: 'fail',
        params: { mark, fid, isThread },
        reason: new Error('请求参数错误'),
        _account,
      });
      return Promise.reject(new Error('请求参数错误'));
    }
    this.sendMailOperationEvent({
      eventStrData: 'markFolder',
      status: 'start',
      params: { mark, fid, isThread },
      _account,
    });
    const result = await this.mailDbHandler.doMarkMailInfFolder(mark, fid, isThread, _account);
    this.sendMailOperationEvent({
      eventStrData: 'markFolder',
      status: 'local',
      params: { mark, fid, isThread },
      result: [result],
      _account,
    });
    if (result) {
      try {
        const retryFn = () => this.mailOperationHandler.doMarkMailInfFolder(mark, fid, isThread, _account);
        const res = await this.retryCall(retryFn);
        this.sendMailOperationEvent({
          eventStrData: 'markFolder',
          status: 'success',
          params: { mark, fid, isThread },
          result: [result],
          _account,
        });
        return res;
      } catch (ex) {
        // 反转mark回滚
        const cids = result.map(it => it.mid);
        const oData = await this.mailDbHandler.doMarkMail(!mark, cids, 'read', undefined, undefined, _account);
        this.sendMailOperationEvent({
          eventStrData: 'markFolder',
          status: 'fail',
          params: { mark, fid, isThread },
          result: [oData],
          reason: new Error(ex as string),
          _account,
        });
        return { succ: false };
      }
    }
    return this.mailOperationHandler
      .doMarkMailInfFolder(mark, fid, undefined, _account)
      .then(async res => {
        await this.modelHandler.notifyFolderCountChange(true, _account);
        this.sendMailOperationEvent({
          eventStrData: 'markFolder',
          status: 'success',
          params: { mark, fid, isThread },
          result,
          _account,
        });
        return res;
      })
      .catch(e => {
        this.sendMailOperationEvent({
          eventStrData: 'markFolder',
          status: 'fail',
          params: { mark, fid, isThread },
          reason: e,
          _account,
        });
        return Promise.reject(e);
      });
  }

  async doMoveMail(id: string | string[], fid: number, isThread?: boolean, needCheckThread = true, _account?: string): Promise<CommonBatchResult> {
    if (!id || (Array.isArray(id) && id.length === 0) || !fid || fid < 0) {
      this.sendMailOperationEvent({
        eventStrData: 'move',
        status: 'fail',
        params: { id, fid, isThread },
        reason: new Error('请求参数错误'),
        _account,
      });
      return Promise.reject(new Error('请求参数错误'));
    }
    needCheckThread = this.getNeedCheckThread(needCheckThread);
    if (needCheckThread) {
      mailPerfTool.moveMail('move', 'start', {
        isThread,
      });
      this.sendMailOperationEvent({
        eventStrData: 'move',
        status: 'start',
        params: { id, fid, isThread },
        _account,
      });

      const { threadIds, normalIds, fakeThreadIds } = await this.getAllMoveOrDelMids(id, true);
      const normalPromise = normalIds.length > 0 ? () => this.doMoveMail(normalIds, fid, false, false, _account) : () => Promise.resolve({ succ: true, data: [] });
      const threadPromise = threadIds.length > 0 ? () => this.doMoveThreadMail(threadIds, fid, fakeThreadIds, _account) : () => Promise.resolve({ succ: true, data: [] });
      return Promise.all([normalPromise(), threadPromise()]).then(([v1, v2]) => {
        this.sendMailOperationEvent({
          eventStrData: 'move',
          status: [v1 && v1.succ, v2 && v2.succ],
          params: { id, fid, isThread },
          result: [v1.data as EntityMailStatus[], v2.data as EntityMailStatus[]],
          reason: v1.failReason || v2.failReason,
          _account,
        });
        if (v1 && v2 && v1.succ && v2.succ) {
          mailPerfTool.moveMail('move', 'end', {
            isThread,
            result: 'success',
          });
          // 为了异步更新星标联系人文件夹的未读数
          this.doListMailBox(undefined, undefined, undefined, _account).then();
          return { succ: true };
        }
        mailPerfTool.moveMail('move', 'end', {
          isThread,
          result: 'fail',
        });
        return Promise.reject();
      });
    }
    const origin: EntityMailStatus[] = [];
    const result = await this.mailDbHandler.doMoveMail(origin, id, fid, isThread, _account);
    const idsInDb = Array.isArray(result) ? result.filter(v => (isThread && v.isThread) || (!isThread && !v.isThread)).map(it => it.mid) : [];
    const idsNotInDb = (Array.isArray(id) ? id : [id])
      .filter(v => !idsInDb.includes(v))
      .filter(v => (isThread && util.isThreadMailById(v)) || (!isThread && !util.isThreadMailById(v)))
      .map(util.getReadThreadId);
    const allIds = [...new Set([...idsInDb, ...idsNotInDb])];
    // if (result && result.length > 0) {
    //   const newId = result
    //     .filter(v => (isThread && v.isThread) || (!isThread && !v.isThread))
    //     .map(it => it.mid);
    if (allIds.length > 0) {
      try {
        const retryFn = () => this.mailOperationHandler.doMoveMail({ id: allIds, fid, isThread, _account });
        await this.retryCall(retryFn);
        // this.modelHandler.notifyFolderCountChange(true);
        return {
          succ: true,
          data: result,
        };
      } catch (ex) {
        // const checkId = Array.isArray(id) ? id : [id];
        // 先回滚，再重查一遍远端数据
        await this.mailDbHandler.updateMailStatus(origin, _account);
        this.doListMailBoxEntities(
          {
            mids: allIds,
            count: allIds.length,
            checkType: isThread ? 'checkThread' : 'normal',
            _account,
          },
          true
        ).then();
        return { succ: false, data: origin };
      }
    }
    return { succ: true, data: [] };
    // }
    // return this.mailOperationHandler
    //   .doMoveMail({ id, fid, isThread })
    //   .then(res => {
    //     this.modelHandler.notifyFolderCountChange(true);
    //     return res;
    //   })
    //   .catch(e => ({ succ: false, reason: e }));
  }

  async doMoveThreadMail(id: string | string[], fid: number, fakeThreadIds?: string[], _account?: string): Promise<CommonBatchResult> {
    // threadIds 是真实的聚合邮件ID，使用它去请求后端接口
    const threadIds = Array.isArray(id) ? id : [id];
    // fakeThreadIds 是数据库中伪造的与文件夹相关的聚合邮件ID，使用它来处理数据库中数据
    const fakeIds = Array.isArray(fakeThreadIds) ? fakeThreadIds : [];
    // 删除时需要删除所有
    const deletedIds = [...new Set([...threadIds, ...fakeIds])];

    // 移动聚合邮件时，关联的所有邮件也要进行移动
    const moveThreadMessage = async () => {
      const { threadMessages } = await this.mailDbHandler.getThreadMessageByThreadIds(threadIds, _account);
      const messageIds = threadMessages.map(v => v.mid);
      const origin: EntityMailStatus[] = [];
      // 1
      return this.mailDbHandler.doMoveMail(origin, messageIds, fid);
    };

    const retryFn = async () => {
      const data = await this.mailOperationHandler.doMoveMail({
        id: threadIds,
        fid,
        isThread: true,
        _account,
      });
      if (data && data.succ) {
        return this.mailDbHandler
          .deleteByIds(deletedIds, _account)
          .then(moveThreadMessage)
          .then(() => this.syncMailByIds(deletedIds, 'checkThreadDetail', true, _account))
          .then(async () => {
            this.doCallMailMsgCenter(
              {
                type: 'syncMail',
                data: { id: fid },
              },
              _account
            );
            await this.modelHandler.notifyFolderCountChange(true, _account);
            return Promise.resolve(data);
          });
      }
      return Promise.reject();
    };
    const { succ } = await this.retryCall(retryFn);
    const results = (await this.db.getByIds(mailTable.status, deletedIds, _account)) as EntityMailStatus[];
    return { succ, data: results.filter(v => !!v) };
  }

  async doNeedSaveTemp(content: MailEntryModel): Promise<boolean> {
    const res = await this.mailOperationHandler.doNeedSaveTemp(content);
    return res;
  }

  // eslint-disable-next-line max-params
  async doReplayMail(id: string, all?: boolean, noPopup?: boolean, additionalContent?: string, _account?: string, owner?: string): Promise<WriteMailInitModelParams> {
    if (!noPopup) {
      const writeType = all ? 'replyAll' : 'reply';
      mailPerfTool.writeMail('start', {
        writeType: writeType as WriteLetterPropType,
      });
    }
    let isThread = false;
    // 下属邮件没有聚合
    if (!owner) {
      const mailType = await this.doGetMailTypeById(id, _account);
      isThread = mailType === 'thread';
    }
    return this.mailOperationHandler.doReplayMail(id, all, noPopup, additionalContent, isThread, _account, owner);
  }

  doReplayMailWithAttach(id: string, all?: boolean, noPopup?: boolean, additionalContent?: string, _account?: string, owner?: string): WriteMailInitModelParams {
    if (!noPopup) {
      const writeType = all ? 'replyAllWithAttach' : 'replyWithAttach';
      mailPerfTool.writeMail('start', {
        writeType: writeType as WriteLetterPropType,
      });
    }
    return this.mailOperationHandler.doReplayMailWithAttach(id, all, noPopup, additionalContent, _account, owner);
  }

  doSaveMailInitParamLocal(content: WriteMailInitModelParams): void {
    this.mailOperationHandler.doSaveMailInitParamLocal(content);
  }

  doSaveMailLocal(content: MailEntryModel): void {
    this.modelHandler.updateLocalContent(content);
  }

  doTransferSign(signHtml: string): string {
    // const readMail = true; // 读信
    // const needHtml = false; // 不需要包裹html标签
    return this.modelHandler.getTransferHtml({ content: signHtml, contentId: '' }, 'sign', false /* 不需要包裹html标签 */);
  }

  doLocalSearchMail(key: string, param: queryMailBoxParam): Promise<MailSearchResult> {
    return this.mailContentHandler.doLocalSearchMail(key, param);
  }

  // eslint-disable-next-line max-params
  async doGetSearchCacheInfo(key: string, param: queryMailBoxParam, searchId?: number, noData?: boolean, _account?: string): Promise<SearchCacheInfo | boolean> {
    return this.mailContentHandler.doGetSearchCacheInfo(key, param, searchId, noData, _account);
  }

  async doClearSearchCache(_account?: string): Promise<void> {
    return this.mailContentHandler.doClearSearchCache(_account);
  }

  // eslint-disable-next-line max-params
  doSearchMail(key: string, param: queryMailBoxParam, localSearch?: boolean, searchId?: number): Promise<MailSearchResult> {
    // 目前搜索只支持非聚合邮件的搜索
    const _account = param._account || '';
    const params: queryMailBoxParam = { ...param, checkType: 'normal', _account };
    if (key.startsWith('*#') && key.endsWith('*#')) {
      this.mailContentHandler.doSpecialJob(key);
      return Promise.resolve(this.mailContentHandler.buildSearchResult([[], {}, [], {}], 0, key, 0, params.id, undefined, undefined, _account));
      // return Promise.reject('构建信息：' + window.BuildData);
    }
    if (process.env.BUILD_ISWEB) {
      localSearch = false;
    }
    if (localSearch) {
      this.loggerHelper.track('mail_search_local_start', {
        key,
        params,
        searchId,
      });
      return this.doLocalSearchMail(key, params);
    }
    this.loggerHelper.track('mail_search_cloud_start', {
      key,
      params,
      searchId,
    });
    return this.mailContentHandler.doSearchMail(key, params, searchId);
  }

  doSaveTemp(params: DoSaveTempParams): Promise<MailEntryModel> {
    const { content, saveDraft, auto, _account, callPurpose } = params;
    return this.mailOperationHandler.doSaveTemp({ content, saveDraft, auto, _account, callPurpose }).then(re => {
      // this.mailDbHandler.saveMails(re).then();
      // if (this.systemApi.isElectron() && window.electronLib && this.isMailPage) {
      //   // if (this.systemApi.isElectron() && this.isMailPage) {
      //   // if (!auto) {
      //   // electron内使用此消息告知主窗口刷新列表
      //   setTimeout(() => {
      //     this.eventApi.sendSysEvent(
      //       {
      //         eventName: 'writePageDataExchange',
      //         eventData: content.cid,
      //         eventStrData: auto ? 'autoSaveSucceed' : 'saveSucceed',
      //       },
      //     )?.catch(ex => {
      //       console.error(ex);
      //       this.errReporter.doReportMessage(
      //         {
      //           error: '存草稿成功消息数据发送失败：' + ex.message,
      //           data: '',
      //           id: '',
      //         },
      //       );
      //     });
      //   }, 1000);
      //   // }
      //   // }
      // } else {
      // 非electron内使用此消息同步
      setTimeout(() => {
        this.eventApi
          .sendSysEvent({
            eventName: 'mailChanged',
            eventStrData: 'syncDraft',
            eventData: {
              id: content.entry.id,
            },
            _account: content._account,
          } as SystemEvent)
          ?.catch(ex => {
            console.error(ex);
            this.errReporter.doReportMessage({
              error: '存草稿成功消息数据发送失败：' + ex.message,
              data: '',
              id: '',
            });
          });
      }, 2700);
      // }
      return re;
    });
  }

  // 获取最新草稿id
  doGetLatestedDraftId(params: { content: MailEntryModel; oldCid: string }): Promise<string> {
    return this.mailOperationHandler.doGetLatestedDraftId(params);
  }

  doSaveDraftLocal(content: MailEntryModel): Promise<void> {
    return this.mailOperationHandler.doSaveDraftLocal(content);
  }

  doGetContentFromDB(cid: string, _account?: string): Promise<MailEntryModel> {
    return this.modelHandler.loadEntryFromStore1(cid, _account);
  }

  doGetMailFromDB(cid: string, _account?: string): Promise<MailEntryModel> {
    return this.modelHandler.loadEntryFromStore(cid, _account);
  }

  async doSaveAttachmentToDB(params: ReqDoSaveAttachmentToDB): Promise<boolean> {
    const { cid, _account, attachment } = params;
    try {
      const element = await this.modelHandler.loadEntryFromStore(cid, _account);
      await this.modelHandler.saveEntryToStore(element, undefined, attachment);
      return true;
    } catch (error) {
      console.log('doSaveAttachmentToDB error', error);
      return false;
    }
  }

  doSaveContentToDB(item: MailEntryModel): Promise<boolean> {
    return this.modelHandler.saveEntryToStore1(item);
  }

  doReSendInitMail(cid: string, resendAccount?: string, withCloudAtt?: boolean, latestedCont?: string) {
    return this.mailOperationHandler.doReSendInitMail(cid, resendAccount, withCloudAtt, latestedCont);
  }

  doGetExcludeAttIds(cid: string, latestedCont: string) {
    return this.mailOperationHandler.doGetExcludeAttIds(cid, latestedCont);
  }

  doTransferAtts(params: ReUploadInfo): Promise<RespDoTransferAtts> {
    return this.mailOperationHandler.doTransferAtts(params);
  }

  doSendMail(content: MailEntryModel): Promise<MailEntryModel> {
    this.eventApi.sendSysEvent({
      eventName: 'writePageDataExchange',
      eventData: content.cid,
      eventStrData: 'sending',
      _account: content._account,
    });
    return this.mailOperationHandler
      .doSendMail(content)
      .then(async re => {
        // this.mailDbHandler.saveMails(re).then();
        // electron非同窗口，发送跨窗口消息
        // if (this.systemApi.isElectron() && window.electronLib && this.isMailPage) {
        // if (this.systemApi.isElectron() && this.isMailPage) {
        if (re.errMsg) {
          setTimeout(() => {
            this.eventApi.sendSysEvent({
              eventName: 'writePageDataExchange',
              eventData: content.cid,
              eventStrData: 'sendFailed',
              _account: content._account,
              // eventTarget: String(res),
            });
          }, 100);
        } else {
          setTimeout(() => {
            this.eventApi
              .sendSysEvent({
                eventName: 'writePageDataExchange',
                eventData: content.cid,
                _account: content._account,
                eventStrData: content.scheduleDate ? 'scheduleDateSucceed' : 'sendSucceed', // 定时发送:scheduleDateSucceed 正常发信:sendSucceed
              })
              ?.catch(ex => {
                console.error(ex);
                this.errReporter.doReportMessage({
                  error: '写信成功消息数据发送失败：' + ex.message,
                  data: '',
                  id: '',
                });
              });
          }, 1000);
          // }
        }
        // }
        // 发送成功后删除草稿箱的邮件
        if (!re.errMsg) {
          // 自动添加联系人
          const autoAddContact = await this.mailConfApi.getMailAutoAddContact();
          if (autoAddContact && autoAddContact.toString() === '1') {
            this.addNewContact(content.receiver, content._account || '');
          }
          // 发送最近联系人
          this.sendRecentContact(content.receiver, content._account || '');
          if (content.entry.isDraft || content.entry.folder === 2) {
            this.doDeleteMail({
              fid: mailBoxOfDraft.id,
              id: content.originMailId,
              isThread: false,
              _account: content._account,
            }).then(() => {
              setTimeout(() => {
                this.eventApi.sendSysEvent({
                  eventName: 'mailChanged',
                  eventStrData: 'syncDraft',
                  eventData: {
                    // entries: [],
                    // count: 0,
                    // fid: new Set([mailBoxOfDraft.id]),
                    // noCache: true,
                    closeDetail: true,
                    id: content.entry.id,
                  },
                  _account: content._account,
                } as SystemEvent);
              }, 2700);
            });
          }
        }
        // 非electron中发送窗口内消息，此外快捷回复也会发送此消息
        setTimeout(() => {
          this.eventApi.sendSysEvent({
            eventName: 'mailChanged',
            eventStrData: 'data',
            eventData: {
              entries: [],
              count: 0,
              fid: new Set([mailBoxOfSent.id, mailBoxOfDraft.id]),
              noCache: true,
            },
            _account: content._account,
          } as SystemEvent);
        }, 1700);

        // 主动添加回复转发标识，（如编辑了对应邮件，则尝试更新？）
        if (content.entry.writeLetterProp && !re.errMsg) {
          switch (content.entry.writeLetterProp) {
            case 'common':
              break;
            case 'forward':
            case 'reply':
            case 'replyAll':
              console.log('[mail] change mailInfo after send succeed', content);
              if (content.originMailId) {
                this.mailDbHandler
                  .getMailById({
                    id: content.originMailId,
                    noContent: true,
                    noAttachment: true,
                    noContact: true,
                    _account: content._account,
                  })
                  .then(re => {
                    if (re && re.length === 1) {
                      if (content.entry.writeLetterProp === 'reply' || content.entry.writeLetterProp === 'replyAll') {
                        re[0].entry.replayed = true;
                      }
                      if (content.entry.writeLetterProp === 'forward') {
                        re[0].entry.forwarded = true;
                      }
                      this.mailDbHandler.saveMails(re[0], undefined, content._account);
                      // 同步界面标记
                      this.sendMailOperationEvent({
                        eventStrData: 'reply',
                        status: 'success',
                        params: {
                          originMailId: content.originMailId,
                        },
                        result: [
                          [
                            {
                              mid: content.entry.id,
                              replyStatus: re[0].entry.replayed ? 1 : 0,
                              forwardStatus: re[0].entry.forwarded ? 1 : 0,
                            },
                          ],
                        ],
                        _account: content._account,
                      });
                    }
                  });
              }
              break;
            default:
              break;
          }
        }
        return re;
      })
      .catch(reason => {
        setTimeout(() => {
          this.eventApi.sendSysEvent({
            eventName: 'writePageDataExchange',
            eventData: content.cid,
            eventStrData: 'sendFailed',
            _account: content._account,
            // eventTarget: String(res),
          });
        }, 100);
        return Promise.reject(reason);
      });
  }

  doCancelDeliver(content: DoCancelDeliverParams): Promise<any> {
    return this.mailOperationHandler.doCancelDeliver(content);
  }

  doImmediateDeliver(content: DoImmediateDeliverParams): Promise<any> {
    return this.mailOperationHandler.doImmediateDeliver(content);
  }

  async getLastMailSyncTime(key: string, _account?: string): Promise<number> {
    const actions = this.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    if (actions && actions.lastMailBoxUpdateTime[key] && actions.lastMailBoxUpdateTime[key] > 0) {
      return actions.lastMailBoxUpdateTime[key];
    }
    const storeData = await this.storeApi.get(key, { _account });
    if (actions && storeData && storeData.suc && storeData.data) {
      const number = Number(storeData.data);
      actions.lastMailBoxUpdateTime[key] = number;
      return number;
    }

    return -1;
  }

  setLastMailSyncTime(key: string, targetActions?: ActionStore | null, _account?: string): number {
    if (targetActions) targetActions.lastMailBoxUpdateTime[key] = Date.now();
    this.storeApi.put(key, String(targetActions?.lastMailBoxUpdateTime[key]), { _account }).then().catch(console.error);
    return targetActions?.lastMailBoxUpdateTime[key] || NaN;
  }

  async doUpdateMailBoxStat(taskType?: UpdateMailCountTaskType, extraData?: any, _account?: string): Promise<void> {
    const timestamp: number = await this.getLastMailSyncTime(ActionStore.keyMailSyncTime, _account);
    const targetActions = this.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    if (timestamp < 0) {
      this.setLastMailSyncTime(ActionStore.keyMailSyncTime, targetActions, _account);
    } else if (timestamp + MailApiImpl.mailSyncMinPeriod > Date.now() && taskType !== 'push') {
      return;
    }
    this.doUpdateMailBoxStatCall(taskType || 'default', extraData).then(() => {
      this.setLastMailSyncTime(ActionStore.keyMailSyncTime, targetActions, _account);
    });
  }

  async doUpdateMailBoxStatCall(taskType: UpdateMailCountTaskType, extraData?: any): Promise<void> {
    return this.mailContentHandler.doUpdateMailBoxStat(taskType, extraData);
  }

  doUploadAttachment(params: DoUploadAttachmentParams): Promise<MailFileAttachModel> {
    return this.mailOperationHandler.doUploadAttachment(params);
  }

  buildUploadedAttachmentDownloadUrl(
    content: MailEntryModel,
    attachId: number,
    cloudAdditional?: ResponseMailUploadCloud,
    _session?: string,
    agentNode?: string | null
  ): string {
    return this.mailOperationHandler.buildUploadedAttachmentDownloadUrl(content, attachId, cloudAdditional, _session, agentNode);
  }

  buildAttachmentSliceUploader(
    uploader: LoaderActionConf | undefined,
    item: MailFileAttachModel,
    cloudUploaderCommonArgs: CloudUploaderCommonArgs,
    qrs: ResponseMailUploadCloudToken
  ): UploadPieceHandler {
    return this.mailOperationHandler.buildAttachmentSliceUploader(uploader, item, cloudUploaderCommonArgs, qrs);
  }

  doAbortAttachment(id: string): DoAbortAttachmentRes {
    return this.mailOperationHandler.doAbortAttachment(id);
  }

  doAddAttachment(cid: string, attach: MailFileAttachModel[], flag?: UploadAttachmentFlag, _acount?: string): Promise<MailFileAttachModel[]> {
    return this.mailOperationHandler.doAddAttachment(cid, attach, flag, _acount);
  }

  doWithdrawMail(mid: string, tid?: string, _account?: string): Promise<MailDeliverStatus> {
    return this.mailOperationHandler.doWithdrawMail(mid, tid, _account);
  }

  doWriteMailToContact(contact?: string[], _account?: string): WriteMailInitModelParams {
    mailPerfTool.writeMail('start', { writeType: 'common' });
    return this.mailOperationHandler.doWriteMailToContact(contact, _account);
  }

  doWriteMailFromLink(contact: string[], title: string, originContent: string, _account?: string): WriteMailInitModelParams {
    mailPerfTool.writeMail('start', { writeType: 'common' });
    return this.mailOperationHandler.doWriteMailFromLink(contact, title, originContent, _account);
  }

  doWriteMailToServer(): Promise<void> {
    return this.mailOperationHandler.doWriteMailToServer();
  }

  doWriteMailToWaimaoServer(): Promise<void> {
    return this.mailOperationHandler.doWriteMailToWaimaoServer();
  }

  getContractItemByEmail(id: string[], type: MemberType, _account?: string): Promise<MailBoxEntryContactInfoModel[]> {
    return this.contactHandler.getContractItemByEmail(id, type, _account);
  }

  doGetGroupMailStatus(id: string, noCache?: boolean) {
    // 废弃？
    return this.mailContentHandler.doGetGroupMailStatus(id, noCache);
  }

  buildEmptyMailEntryModel(param: WriteMailInitModelParams, noStore?: boolean): MailEntryModel {
    return this.mailContentHandler.buildEmptyMailEntryModel(param, noStore);
  }

  async buildCloudAttMailEntryModel(param: WriteMailInitModelParams): Promise<MailEntryModel> {
    // const res = await this.mailContentHandler.buildCloudAttMailEntryModel(param);
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject({ param, err: '方法已废弃' });
  }

  async initModel(param: WriteMailInitModelParams): Promise<MailEntryModel> {
    // 使用邮件模板等场景时，调用 callWriteLetterFunc 会携带result，这种情况下，initModel直接返回param.result即可
    let result: MailEntryModel | undefined;
    const { _account } = param;
    try {
      if (param.result) {
        this.modelHandler.updateLocalContent(param.result);
        result = param.result;
      } else {
        result = await this.mailOperationHandler.initModel(param);
      }
      if (result) {
        const copyResult = JSON.parse(JSON.stringify(result));
        if (copyResult.entry?.content?.content) {
          copyResult.entry.content.content = '';
        }
        this.loggerHelper.track('callWriteLetterFunc_initModelresult', {
          params: JSON.stringify(copyResult),
        });
      }
      return Promise.resolve(result);
    } finally {
      this.mailConfApi.reqMailLimit({ _account });
      if (result && !result._id) {
        this.doSaveTemp({ content: result, saveDraft: false, auto: true, _account: param._account }).then();
      }
    }
  }

  // 邮件分发
  async requestDelivery(id: string, bcc: string[], _account: string): Promise<boolean> {
    return this.mailOperationHandler.requestDelivery(id, bcc, _account);
  }

  doBuildEmptyMailEntryModel(param: WriteMailInitModelParams): MailEntryModel {
    return this.mailContentHandler.buildEmptyMailEntryModel(param);
  }

  getRelatedMail(param: queryMailBoxParam, noCache: boolean | undefined): Promise<MailModelEntries> {
    return this.mailContentHandler.getRelatedMail(param, noCache);
  }

  async getFilePreviewUrl(param: { mid: string; url: string; _account?: string }) {
    // const tidRes = await this.doCheckReadStatus(param.mid);
    const mailEntry = await this.mailDbHandler.doGetMailContent(param.mid, undefined, param._account);
    const accountId = param._account ? this.storeApi.getEmailIdByEmail(param._account) : '';
    const mainUser = this.systemApi.getCurrentUser();
    const result = await this.impl.get(
      param.url,
      {
        tid: mailEntry?.entry.tid,
        ...(accountId && mainUser ? { mainAccount: mainUser.id } : {}),
      },
      {
        _account: param._account,
      }
    );
    if (result && result.data) {
      if (process.env.BUILD_ISELECTRON) {
        const res = result.data;
        const subAccountSessioName = param && param._account ? this.systemApi.getSessionNameOfSubAccount(param._account || '') : '';
        if (subAccountSessioName && res.data) {
          res.data = `${res.data}&_session=${subAccountSessioName}`;
        }
        return res;
      }
      const ret = result.data;
      // try {
      //   if (ret.data.startsWith('http')) {
      //     const url = new URL(ret.data);
      //     ret.data = ret.data.replace(url.protocol + '//' + url.host, '');
      //   }
      return ret;
      // } catch (e) {
      //   console.warn(e);
      // }
    }
    return { success: false };
  }

  onFocus() {
    if (this.systemApi.isMainPage()) {
      this.doUpdateMailBoxStatCall('resume').then();
    }
    return this.name;
  }

  async syncAllMails(total = 200, start = 0, _account?: string): Promise<void> {
    console.log('[mail sync] syncAllMails');
    let timestamp: number = await this.getLastMailSyncTime(ActionStore.keyMailContentSyncTime, _account);
    const targetActions = this.getActions({
      actions: this.actions,
      subActions: this.subActions,
      _account,
    })?.val;
    const judgeTimestamp = timestamp;
    let retry = 0;
    const retryCall = async () => {
      retry += 1;
      this.setLastMailSyncTime(ActionStore.keyMailContentSyncTime, undefined, _account);
      timestamp = await this.getLastMailSyncTime(ActionStore.keyMailContentSyncTime, _account);
      if (timestamp <= 0 && retry < 5) {
        await retryCall();
      }
    };
    await retryCall();
    if (judgeTimestamp + MailApiImpl.MAIL_CONTENT_SYNC_MIN_PERIOD > Date.now()) {
      console.log('[mail sync] not now');
      return;
    }
    if (MailApiImpl.mailSyncing) {
      console.log('[mail sync] is syncing');
      return;
    }
    this.loggerHelper.track('mail_sync_start', { total, judgeTimestamp });
    MailApiImpl.mailSyncing = true;
    console.log('[mail sync] start');
    const { mailBoxDic } = targetActions || {};
    if (mailBoxDic) {
      try {
        const mailBoxIds: number[] = [];
        Object.keys(mailBoxDic).forEach(mbid => {
          mailBoxIds.push(Number(mbid));
        });
        const mailBoxSync = (idx: number) => {
          const k = mailBoxIds[idx];
          const mailBox = mailBoxDic[k];
          if (mailBox && !mailBox.locked && mailBox.mailBoxTotal > 0) {
            setTimeout(() => {
              this.handleMailBoxSync(start, total, mailBox, _account).then(() => {
                mailBoxSync(idx + 1);
              });
            }, 2000);
          }
        };
        mailBoxSync(0);
      } catch (ex) {
        console.warn(ex);
      } finally {
        MailApiImpl.mailSyncing = false;
        this.setLastMailSyncTime(ActionStore.keyMailContentSyncTime, targetActions, _account);
      }
    }
  }

  private async handleMailBoxSync(start: number, total: number, mailBox: EntityMailBox, _account?: string) {
    console.log('[mail sync] handleMailBoxSync mailbox', mailBox);
    let index = start;
    let error = 0;

    const retryCall = async () => {
      try {
        const data = await this.mailContentHandler.doListMailBoxEntities({
          index,
          count: 100,
          id: Number(mailBox.id),
          _account,
        });
        await wait(MailApiImpl.MAIL_SYNC_WAIT_SPAN);
        const __ret = await this.handleSyncList(data, index, start, _account);
        index = __ret.index;
        if (__ret.empty) {
          return Promise.resolve();
        }
      } catch (e) {
        console.warn(e);
        error += 1;
      }
      if (index < total && error < 3) {
        await retryCall();
      }
      return Promise.resolve();
    };
    await retryCall();
    const isThread = this.mailConfApi.getMailMergeSettings() === 'true';
    const unread = await this.mailContentHandler.doListMailBoxEntities({
      index,
      count: 60,
      id: Number(mailBox.id),
      filter: {
        flags: { read: false },
      },
      checkType: isThread ? 'checkThread' : 'normal',
      _account,
    });
    await wait(MailApiImpl.MAIL_SYNC_WAIT_SPAN);
    await this.handleSyncList(unread, index, start, _account);
    await wait(MailApiImpl.MAIL_SYNC_WAIT_SPAN);
    await this.syncByTimestamp(mailBox);
  }

  private async handleSyncList(data: MailEntryModel[] | MailModelEntries, index: number, start: number, _account?: string) {
    const dt = Array.isArray(data) ? data : data.data;
    let empty = false;
    if (dt && dt.length > 0) {
      console.log('[mail sync] handleSyncList');
      await this.saveMails(dt, undefined, undefined, _account);
      await wait(MailApiImpl.MAIL_SYNC_WAIT_SPAN);
      if (index < 20 && start === 0) {
        console.log('[mail sync] syncMailContent');
        await this.syncMailContent(dt, _account);
      }
      index += dt.length;
    } else {
      empty = true;
    }
    return { index, empty };
  }

  private async syncMailContent(dt: MailEntryModel[], _account?: string) {
    const mids = dt.map(it => it.id);
    const savedMails = await this.mailDbHandler.getMailById({
      id: mids,
      noContact: true,
      noAttachment: true,
      noData: true,
      noStatus: true,
      noContent: false,
      _account,
    });
    const set: Set<string> = new Set<string>(savedMails.map(it => it.id));
    const needSyncContentMail = dt.filter(it => !set.has(it.id));
    if (needSyncContentMail.length > 0) {
      await this.syncMailContentInternal(needSyncContentMail);
    }
  }

  private async syncMailContentInternal(needSyncContentMail: MailEntryModel[], _account?: string) {
    const ids: string[] = [];
    // for (const it of needSyncContentMail)
    needSyncContentMail.forEach(it => {
      if (it && it.id) {
        ids.push(it.id);
      }
    });
    return ids.reduce(
      (item: Promise<void>, cur: string) =>
        item
          .then(() => wait(MailApiImpl.MAIL_SYNC_WAIT_SPAN))
          .then(() => this.mailContentHandler.doGetMailContent(cur, { _account }))
          .then(con => {
            this.saveMails(con, undefined, undefined, _account);
          }),
      Promise.resolve()
    );
    // return new Promise((i,j)=>{
    //   this.mailContentHandler.doGetMailContent(it.id);
    //   await this.mailDbHandler.saveMails(con);
    //   await wait(15000);
    // });
  }

  private async syncByTimestamp(mailBox: EntityMailBox): Promise<number[]> {
    try {
      const now = Date.now();
      const statuses = await this.mailDbHandler.getMailLeastUpdated(Number(mailBox.id), now - ActionStore.minUpdateSpan, now - ActionStore.maxUpdateSpan);
      const tempStatuses = statuses.map(v => ({
        isThread: v.isThread === 1,
        id: v.mid,
        convFids: v.convFids,
        threadId: v.threadId,
      })) as MailEntryModel[];
      const normalTempStatuses = tempStatuses.filter(v => v.isThread);
      const threadTempStatuses = tempStatuses.filter(v => !v.isThread);

      const normalIds: string[] = normalTempStatuses.map(v => v.id);
      const threadIds: string[] = threadTempStatuses.map(v => v.id);
      const allThreadIds: string[] = [...this.mailDbHandler.getAllThreadIds(threadTempStatuses), ...threadIds];

      const p1 = this.syncMailByIds(normalIds, 'normal');
      const p2 = this.syncMailByIds(allThreadIds, 'checkThread');
      return Promise.all([p1, p2]).then(([res1, res2]) => {
        const res = [];
        if (Array.isArray(res1)) {
          res.push(...res1);
        }
        if (Array.isArray(res2)) {
          res.push(...res2);
        }
        return res;
      });
    } catch (ex) {
      console.warn(ex);
    }
    return [];
  }

  async syncMailByIds(mids: string[], checkType?: queryMailBoxParam['checkType'], skipWait?: boolean, _account?: string) {
    const isThread = checkType && ['checkThreadDetail', 'checkThread'].includes(checkType);
    const originMids = [...mids];
    if (isThread) {
      mids = [...new Set(mids.map(v => v.split('--')[0]))];
    }
    const ret: number[] = [];
    if (mids && mids.length > 0) {
      ret.push(mids.length);
      const mailBoxEntities = isThread
        ? await this.mailContentHandler.getThreadMailContentFromNetwork(
            mids,
            {
              returnConvInfo: true,
            },
            undefined,
            _account
          )
        : await this.mailContentHandler.doListMailBoxEntities({
            mids,
            count: mids.length,
            returnModel: false,
            _account,
          });
      if (!mailBoxEntities) {
        return ret;
      }
      let data = Array.isArray(mailBoxEntities) ? mailBoxEntities : mailBoxEntities.data;
      const now = Date.now();
      data = data.filter(it => now - (it.updateTime || 0) > MailApiImpl.mailSyncMinPeriod);
      if (edmMailHelper.isEdmMailReq(checkType)) {
        data = data.filter(it => edmMailHelper.filterEdmFid(it.entry.folder));
      }
      if (data) {
        ret.push(data.length);
        /**
         * 有删除的情况
         */
        if (mids.length > data.length || isThread) {
          const delMids: string[] = [];
          const set: Set<string> = new Set<string>(this.mailDbHandler.getAllThreadIds(data, true));
          if (isThread) {
            delMids.push(...set, ...originMids);
          } else {
            mids.forEach(it => {
              if (!set.has(it)) {
                delMids.push(it);
              }
            });
          }
          if (delMids.length > 0) {
            await this.mailDbHandler.deleteInActionById(delMids, _account);
          } else {
            console.warn('[mail-db] it do not happen');
          }
        }
        await this.saveMails(data, undefined, undefined, _account);
        if (!skipWait) {
          await wait(MailApiImpl.MAIL_SYNC_WAIT_SPAN);
        }
      }
    }
    return ret;
  }

  async syncTpMailByIds(param: SyncTpMailParamItem[], checkType: queryMailBoxParam['checkType']): Promise<MailEntryModel[]> {
    const allMids: string[] = param.reduce((t, v) => [...t, ...v.mids], [] as string[]);
    const query = param.reduce<Map<string, string[]>>((total, current) => {
      const { email, mids } = current;
      if (email) {
        const oldIds = total.get(email);
        if (!oldIds) {
          total.set(email, mids);
        } else {
          total.set(email, [...oldIds, ...mids]);
        }
      }
      return total;
    }, new Map());
    const queryList: SyncTpMailParamItem[] = [...query.entries()].map(([email, mids]) => ({
      email,
      mids,
    }));
    const mailBoxEntities = await this.mailContentHandler.listCustomerMailEntryById(queryList, checkType);
    const newData = Array.isArray(mailBoxEntities) ? mailBoxEntities : mailBoxEntities.data;
    // 第三方邮件过滤掉了已删除和草稿箱中的数据
    const filterNewData = newData.filter(v => edmMailHelper.filterEdmFid(v.entry.folder));
    const newIdSet = filterNewData.reduce<Set<string>>((t, v) => t.add(v.id), new Set<string>());
    console.log('[sync tp mail] ids exist', filterNewData);
    // 有删除的情况
    if (allMids.length > filterNewData.length) {
      const delIds = allMids.filter(id => !newIdSet.has(id));
      console.log('[sync tp mail] ids to del', delIds);
      if (delIds.length > 0) {
        await this.mailDbHandler.deleteTpMailsById(delIds);
      }
    }
    // await this.saveMails(filterNewData);
    return filterNewData;
  }

  sendRecentContact(receiver: MailBoxEntryContactInfoModel[], _account: string) {
    const toList: Record<'contactId' | 'email', string>[] = [];
    const ccList: Record<'contactId' | 'email', string>[] = [];
    const bccList: Record<'contactId' | 'email', string>[] = [];
    receiver.forEach(item => {
      switch (item.mailMemberType) {
        case 'to':
          toList.push({
            contactId: item.contactItem.contactId,
            email: item.contactItem.contactItemVal,
          });
          break;
        case 'cc':
          ccList.push({
            contactId: item.contactItem.contactId,
            email: item.contactItem.contactItemVal,
          });
          break;
        case 'bcc':
          bccList.push({
            contactId: item.contactItem.contactId,
            email: item.contactItem.contactItemVal,
          });
          break;
        default:
          break;
      }
    });
    const commonParams = {
      conditionType: 1,
      _account,
    };

    this.contactApi.addRecentContact({
      memberParams: {
        to: { ...commonParams, contactlist: toList, contactType: 1 },
        cc: {
          ...commonParams,
          contactlist: ccList,
          contactType: 2,
        },
        bcc: {
          ...commonParams,
          contactlist: bccList,
          contactType: 3,
        },
      },
      _account,
    });
  }

  async addNewContact(receiver?: MailBoxEntryContactInfoModel[], _account?: string) {
    if (!receiver || receiver.length <= 0) {
      return;
    }
    console.log('auto add receivers', receiver);
    const mailList: string[] = [];
    const needInsert: MailBoxEntryContactInfoModel[] = [];
    receiver.forEach(item => {
      const email = item.contactItem.contactItemVal || item.contact?.contact?.accountName;
      if (!item.inContactBook && item.contact.contact.type === 'external') {
        mailList.push(email);
        needInsert.push(item);
      }
    });
    if (!mailList.length) {
      return;
    }
    const contactList: ContactModel[] = await this.contactApi.doGetContactByItem({
      type: 'EMAIL',
      value: mailList,
      filterType: 'personal',
    });
    const emailSet = new Set<string>();
    // 1.25郭超修改。排查的时候需要排查当前通讯录名下的所有email
    contactList
      .map(item => (item.contactInfo || []).map(item => item.contactItemVal))
      .flat()
      .forEach(subEmail => {
        emailSet.add(subEmail);
      });
    const insertList: MailBoxEntryContactInfoModel[] = [];
    needInsert.forEach(item => {
      const email = (item.contactItem.contactItemVal || item.contact?.contact?.accountName).toLowerCase();
      if (!emailSet.has(email)) {
        insertList.push(item);
      }
    });
    if (!insertList.length) {
      return;
    }
    this.contactHandler.addContact(insertList, _account);
  }

  async syncMailFolder(_account?: string) {
    console.log('[mail box] syncMailFolder, account:', _account);
    const promise = this.mailDbHandler.listMailBoxRawEntry(_account);
    const promise1 = this.mailContentHandler.listMailEntry({ order: 'custom_virtual' }, 'listFolder', true, _account);
    await Promise.all([promise, promise1]).then(async ([cache, network]) => {
      console.log(cache, network);
      if (network && network.length > 0) {
        await this.mailDbHandler.saveMailBoxes(network);
      }
      const netSet: Map<string, EntityMailBox> = new Map<string, EntityMailBox>();
      network?.forEach(it => {
        netSet.set(it.id, it);
      });
      const delIds: number[] = [];
      cache?.forEach(it => {
        if (!netSet.has(it.id)) {
          // 修复删除不成功的bug，key的类型是number的
          delIds.push(Number(it.id));
        }
      });
      const filterDelIds = delIds.filter(v => !!v);
      if (filterDelIds.length > 0) {
        await this.mailDbHandler.db.deleteById(mailBoxTable, filterDelIds, _account);
      }
    });
  }

  async doGetMailSearchRecords(count = 10, _account?: string): Promise<MailSearchRecord[]> {
    return this.mailDbHandler.doGetMailSearchRecords(count, _account);
  }

  async doSaveMailSearchRecord(content: MailSearchRecordPayload | MailSearchRecordPayload[], _account?: string): Promise<void> {
    const contents = Array.isArray(content) ? content : [content];
    try {
      // 读取50条，预估是完全够用了，不用考虑老数据的问题
      const list = await this.mailDbHandler.doGetMailSearchRecords(50, _account);
      if (contents && contents.length) {
        const idMap: { [key: string]: boolean } = {};
        contents.forEach(item => {
          if (item.content) {
            idMap[item.content.trim()] = !0;
          }
        });
        // 过滤出重复的id
        const repeatIdList = list.filter(item => item.content && idMap[item.content.trim()]).map(item => item.id);
        if (repeatIdList && repeatIdList.length) {
          // 先删除，后续存入以保持刷新数据
          await this.mailDbHandler.updateMailSearchRecord(
            {
              id: repeatIdList,
              deleteFlag: 1,
            },
            _account
          );
        }
      }
    } catch (e) {
      console.error('[Error doGetMailSearchRecords]', e);
    }
    // 无论是否重复，都会写入DB
    if (contents && contents.length) {
      await this.mailDbHandler.doSaveMailSearchRecord(contents, _account);
    }
  }

  async doDeleteMailSearchRecord(id: string | string[], isDel = true, _account?: string): Promise<void> {
    const ids = Array.isArray(id) ? id : [id];
    await this.mailDbHandler.updateMailSearchRecord(
      {
        id: ids,
        deleteFlag: isDel ? 1 : 0,
      },
      _account
    );
  }

  generateRndId() {
    return this.modelHandler.generateRndId();
  }

  async doGetPraiseMedals(): Promise<MedalInfo[]> {
    if (!this.actions.praiseMedals || this.actions.praiseMedals.length === 0) {
      await this.getPraiseMedals();
    }
    return this.actions.praiseMedals;
  }

  // 无引用
  // 扫描本地邮件，放入emailList
  // 增量扫描！
  async scanMailsSetStrangers(): Promise<void> {
    console.log('scanMailsSetStrangers');
    if (this.scanningMails) return;
    this.scanningMails = true;
    // 扫描边界邮件id (上一次扫描的起始邮件！)
    const oldScanBoundaryMailId = this.storeApi.getSync('scanBoundaryMailId')?.data;
    // console.log('oldScanBoundaryMailId', oldScanBoundaryMailId);

    // 新边界邮件id
    let newScanBoundaryMailId: null | string = null;
    // 扫描最近1w邮件
    const scanRecent1wMails = async () => {
      // 扫描最大数
      const scanMaxNum = 10000;
      // 已扫描邮件数目
      let count = 0;
      // 当前时间
      const nowTime = new Date().getTime();
      // 过期时间 60天
      const expireTime = 60 * 24 * 60 * 60 * 1000;
      // 所有之于通讯录的陌生人隐射
      const contactStrangerMap: Map<string, StrangerOfContactModel> = new Map();
      // 一次循环的长度
      const loopLen = 50;

      // 获取所有文件夹id
      const { mailBoxDic } = this.actions;
      // 默认有收信箱 收信箱id为1
      let dicIds = [1];
      if (mailBoxDic) {
        dicIds =
          mailBoxDic &&
          Object.keys(mailBoxDic).reduce(
            (total: number[], key: string) => {
              const { mailBoxType } = mailBoxDic[Number(key)];
              // 自定义文件夹
              if (mailBoxType !== 'sys') {
                return [...total, Number(key)];
              }
              return total;
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            },
            [...dicIds]
          );
      }

      // 处理满足条件的邮件（60 day 1w）
      const dealMail = (mail: MailEntryModel) => {
        // console.log('dealMaildealMail', mail);

        // 发送者
        const { id, senders, sender, entry } = mail;
        // 设置新的边界id
        if (!newScanBoundaryMailId) newScanBoundaryMailId = id;
        const senderArr = senders || [sender] || [];
        // eslint-disable-next-line no-unused-expressions
        senderArr &&
          senderArr.forEach(item => {
            const { inContactBook, contact } = item;
            // 不在通讯录中 放入contactStrangerMap
            if (!inContactBook) {
              const { contact: contactInfo } = contact;
              const { accountName, contactName } = contactInfo;
              // 当前发送时间毫秒
              const sendTimeMS = new Date(String(entry.sendTime)).getTime();
              // contactStrangerMap未存储过
              if (!contactStrangerMap.has(accountName)) {
                contactStrangerMap.set(accountName, {
                  accountName,
                  contactName,
                  mailIds: [id],
                  sendTime: sendTimeMS,
                  priority: null, // 未知
                });
              } else {
                // contactStrangerMap存储过
                // 同一个陌生人可能有多封邮件
                // sendTime以时间接近现在的为准   mailId累加
                const existedContactStranger = contactStrangerMap.get(accountName);
                if (existedContactStranger) {
                  const { mailIds, sendTime: existedSendTime } = existedContactStranger;
                  contactStrangerMap.set(accountName, {
                    ...existedContactStranger,
                    mailIds: mailIds ? [...mailIds, id] : [id],
                    sendTime: sendTimeMS > existedSendTime ? sendTimeMS : existedSendTime,
                  });
                }
              }
            }
          });
      };

      // 以50个为一轮周期获取
      const getNextLoop = async ({ index, dicIndex }: { index: number; dicIndex: number }) => {
        console.log('getNextLoop', index, dicIndex);
        // 文件夹id
        const preDicId = dicIds[dicIndex];
        // 没有此文件夹
        if (!preDicId) return;

        const mailList = await this.mailDbHandler.doListMailEntry({
          id: preDicId,
          index,
          count: loopLen,
        });
        console.log('mailListmailList', mailList);

        const mails = mailList?.data || [];
        // 邮件列表为空
        if (!mails || mails?.length === 0) {
          // 进入下一个文件夹
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          await intoNextFolder(dicIndex + 1);
        }

        let loopRes = '';
        // 遍历
        for (let i = 0; i < mails.length; i++) {
          const pre = mails[i];
          const { createTime, id } = pre;
          // 扫描到起始邮件了 终止!
          if (oldScanBoundaryMailId === id) return;
          // 扫描到60天前邮件了，不再继续扫描
          if (createTime && nowTime - createTime > expireTime) {
            loopRes = 'nextFolder';
            break;
          }
          // 已达到1w，终止扫描
          if (count >= scanMaxNum) return;

          // 处理满足条件的邮件
          dealMail(pre);
          count += 1;

          // 遍历完了
          if (i === mails.length - 1) {
            // 当前文件夹没有更多了，进入下一个文件夹
            if (mails.length < loopLen) {
              loopRes = 'nextFolder';
              break;
            }
            // 开启下一轮
            loopRes = 'nextLoop';
            break;
          }
        }

        // 进入下一轮循环
        if (loopRes === 'nextLoop') {
          await getNextLoop({ index: index + loopLen, dicIndex });
        }

        if (loopRes === 'nextFolder') {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          await intoNextFolder(dicIndex + 1);
        }
      };

      // 一个文件夹扫描完 进入下一个文件夹
      const intoNextFolder = async (dicIndex: number) => {
        await getNextLoop({ index: 0, dicIndex });
      };

      // 以50为一次周期扫描最近邮件
      await getNextLoop({ index: 0, dicIndex: 0 });

      return contactStrangerMap;
    };

    try {
      // 扫描本地邮件
      const contactStrangerMap = await scanRecent1wMails();
      // 获取被标记的用户 同样也入emailList 以和客户端保持一致！
      // 这里传0获取所有标记用户 包括企业和个人！
      // const prioritiesRes = await this.mailStrangerApi.getSmartGetPriorities({ priorityType: 0 });
      // 远端获取的被标记的用户
      // const markedUsers = prioritiesRes?.data?.priorities || [];
      // // 要插入的陌生用户
      const newUserArr: {
        accountName: string;
        priority: EmailListPriority | null;
      }[] = [];
      // // 考虑到若和contactStrangerMap有重复数据，应当覆盖之
      // markedUsers.forEach(item => {
      //   const { email, priority } = item;
      //   if (contactStrangerMap.has(email)) {
      //     // 覆盖
      //     contactStrangerMap.set(email, {
      //       ...(contactStrangerMap.get(email) as StrangerOfContactModel),
      //       priority
      //     });
      //   } else {
      //     newUserArr.push({
      //       accountName: email,
      //       priority,
      //     });
      //   }
      // });
      contactStrangerMap.forEach(value => newUserArr.push(value));

      // eslint-disable-next-line no-unused-expressions
      if (newUserArr.length > 0) {
        // 入库
        await this.newUsersIntoEmailList(newUserArr);
        // 设置扫描边界id
        // eslint-disable-next-line no-unused-expressions
        newScanBoundaryMailId && this.storeApi.putSync('scanBoundaryMailId', newScanBoundaryMailId);
      }
      this.scanningMails = false;
    } catch (error) {
      // 扫描失败
      console.log('scan 1w mails fail', error);
      this.scanningMails = false;
    }
  }

  // 新邮件（单封/多封）判断是否为陌生人
  async newMailIntoStrangers(newComer: MailEntryModel | MailEntryModel[]): Promise<void> {
    if (!this.contactReady) return;
    console.log('newMailIntoStrangers', newComer);
    const mails = Array.isArray(newComer) ? newComer : [newComer];
    // 通讯录的陌生人
    const contactStrangers: StrangerOfContactModel[] = [];
    mails.forEach(mail => {
      // 信id，发送者
      const { id, senders, sender, entry } = mail;
      const senderArr = senders || [sender] || [];

      // eslint-disable-next-line no-unused-expressions
      senderArr &&
        senderArr.forEach(item => {
          const { inContactBook, contact } = item;
          // 不在通讯录中
          if (!inContactBook) {
            const { contact: contactInfo } = contact;
            const { accountName, contactName } = contactInfo;
            contactStrangers.push({
              accountName,
              contactName,
              mailIds: [id],
              // 发送时间
              sendTime: new Date(String(entry.sendTime)).getTime(),
              priority: null,
            });
          }
        });
    });

    // 入库
    if (contactStrangers.length > 0) {
      await this.newUsersIntoEmailList(contactStrangers);
    }
  }

  async newUsersIntoEmailList(originUsers: newUsersIntoEmailListParam[], occasion?: string): Promise<boolean> {
    // 过滤垃圾数据（accountName非email格式）
    const users = originUsers.filter(item => item?.accountName && !!this.systemApi.handleAccountAndDomain(item.accountName).account);
    if (users.length < 1) return true;
    try {
      const accountNameArr = users.map(item => item.accountName);
      // emaillist 查询是否已存在
      // 不存在为undefined
      const searchEmailListRes = await this.db.getByIds(
        {
          dbName: 'contact_dexie',
          tableName: 'email_list',
        },
        accountNameArr
      );
      console.log('searchEmailListRes', searchEmailListRes);
      // 当前时间 备用
      const nowTime = new Date().getTime();
      const emailListUpdateArr = searchEmailListRes.map((item, index) => {
        // contactName, mailIds, sendTime 这三都可能不存在 注意容错！
        const { accountName, priority, contactName, mailIds, sendTime, isSystemAccount } = users[index];
        // 未存在 新建
        if (!item) {
          const newItem = {
            accountName,
            contactName,
            createTime: nowTime,
            updateTime: nowTime,
            mailIds: (mailIds as string[]) || [],
            priority: priority === null ? -1 : priority, // 容错
            latestSendTime: sendTime, // 注意这里使用latestSendTime ！
            isSystemAccount: isSystemAccount || false,
          };
          // console.log('sdsds', newItem);
          return newItem;
        }
        // 已存在 更新updateTime和mailIds和latestSendTime
        const { mailIds: existedMailIds, latestSendTime, priority: existedPriority, isSystemAccount: existedIsSystemAccount } = item;
        // console.log('itemitem', item, users[index]);

        // 这么写笨点 但不容易错
        let newLatestSendTime = null;
        if (!sendTime && !latestSendTime) newLatestSendTime = null;
        else if ((!sendTime && latestSendTime) || (sendTime && !latestSendTime)) {
          newLatestSendTime = sendTime || latestSendTime;
        } else newLatestSendTime = Math.max(sendTime as number, latestSendTime);
        const newIsSystemAccount = typeof isSystemAccount === 'boolean' ? isSystemAccount : existedIsSystemAccount || false;

        return {
          ...item,
          updateTime: nowTime,
          mailIds: Array.from(new Set([...existedMailIds, ...((mailIds as string[]) || [])])), // 追加mailId并去重
          // 容错sendTime为空
          latestSendTime: newLatestSendTime,
          priority: priority === null ? existedPriority : priority,
          isSystemAccount: newIsSystemAccount,
        };
      });

      // console.log('emailListUpdateArr', emailListUpdateArr);

      await this.db.putAll(
        {
          dbName: 'contact_dexie',
          tableName: 'email_list',
        },
        emailListUpdateArr
      );
      const eventData =
        occasion === 'mark'
          ? {
              markedAccountNames: accountNameArr,
            }
          : {};

      // 陌生人表发生改变
      this.eventApi.sendSysEvent({
        eventName: 'emailListChange',
        eventStrData: occasion || '',
        eventData,
      });
      return true;
    } catch (error) {
      console.log('入email_list表失败');
      return false;
    }
  }

  // 获取所有陌生人
  // 按照latestSendTime倒序 priority必须是-1 即未标记
  async doGetAllStrangers(): Promise<StrangerModel[]> {
    try {
      // 陌生人
      const allStrangers = await this.db.getByEqCondition({
        dbName: 'contact_dexie' as DBList,
        tableName: 'email_list',
        query: { priority: -1 },
        order: 'latestSendTime',
        desc: true,
      });
      // web层获取的时候，再过滤一次 保证不展示历史脏数据
      const filterStrangers = allStrangers.filter(item => item?.accountName && !!this.systemApi.handleAccountAndDomain(item.accountName).account);
      // console.log('doGetAllStrangers', allStrangers, filterStrangers);
      return filterStrangers.reverse() as StrangerModel[];
    } catch (error) {
      console.log('获取所有陌生人失败', error);
      return [];
    }
  }

  // 获取最近3个陌生人
  async doGetRecent3Strangers(): Promise<Recent3StrangersRes> {
    try {
      // 搜索基本条件
      const baseConds = {
        dbName: 'contact_dexie' as DBList,
        tableName: 'email_list',
        query: { priority: -1 },
      };
      // 陌生人
      const strangers = await this.db.getByEqCondition({
        ...baseConds,
        order: 'latestSendTime',
        desc: true,
        // start: strangerCount - 3,
        // count: 3,
      });
      // console.log('strangersstrangers', strangers);

      return {
        recent3Strangers: (strangers as StrangerModel[]).reverse().slice(0, 3),
        strangerCount: strangers.length,
      };
    } catch (error) {
      console.log('获取最近3个陌生人失败', error);
      return {
        recent3Strangers: [],
        strangerCount: 0,
      };
    }
  }

  // 邮件彻底删除引发的emaillist修改
  async mailOperationEmailListChange(ev: SystemEvent<unknown>): Promise<void> {
    console.log('mailOperationEmailListChange', ev);
    try {
      const { eventStrData, eventData } = ev;
      // 删除
      if (eventStrData === 'delete') {
        const { status, params } = eventData as { status: string; params: any };
        // 删除成功
        if (status !== 'success') return;
        // 被删除邮件id 所在文件夹
        const { id, fid } = params;
        // 非垃圾箱 非彻底删除
        if (fid !== 4) return;
        // 被删除的邮件id数组
        let delMailIdArr: string[] = [];
        if (typeof id === 'string') delMailIdArr = [id];
        if (Array.isArray(id)) delMailIdArr = id;
        if (delMailIdArr.length < 1) return;
        const rangeRes = await this.db.getByRangeCondition({
          dbName: 'contact_dexie' as DBList,
          tableName: 'email_list',
          adCondition: {
            type: 'anyOf',
            field: 'mailIds',
            args: delMailIdArr,
          },
        });
        if (!rangeRes || rangeRes.length < 1) return;
        const updateTime = new Date().getTime();
        // 需要被重置的项目
        const resetItems: StrangerModel[] = [];
        // 需要被删除的id(accountName)
        const delIds: string[] = [];
        (rangeRes as StrangerModel[]).forEach((item: StrangerModel) => {
          // 过滤被删除邮件
          const filterMailIds = (item.mailIds || []).filter((mailIdItem: string) => !delMailIdArr.includes(mailIdItem));
          // 未空 保留 覆盖
          if (filterMailIds.length > 0) {
            resetItems.push({
              ...item,
              updateTime,
              mailIds: filterMailIds,
            });
          } else {
            delIds.push(item.accountName);
          }
        });
        // 入库
        await this.db.putAll(
          {
            dbName: 'contact_dexie',
            tableName: 'email_list',
          },
          resetItems
        );
        // 删除
        await this.db.deleteById(
          {
            dbName: 'contact_dexie' as DBList,
            tableName: 'email_list',
          },
          delIds
        );
        // 陌生人表发生改变
        this.eventApi.sendSysEvent({
          eventName: 'emailListChange',
          eventStrData: '',
          eventData: {},
        });
      }
    } catch (error) {
      console.log('邮件彻底删除 emaillist修改失败', error);
    }
  }

  // 通讯录发生变化 emaillist响应
  async contactNotityEmailListChange(ev: SystemEvent<unknown>): Promise<void> {
    try {
      const { eventData } = ev;
      console.log('contactNotityEmailListChange', ev);

      const { contact_personal: pContact, contact_enterprise: eContact } = eventData as syncRes;
      // 无变化
      // if (!hasDiff) return;
      const { insertDiff: pInsertDiff, updateDiff: pUpdateDiff, deleteDiff: pDeleteDiff } = pContact || {};
      const { insertDiff: eInsertDiff, updateDiff: eUpdateDiff, deleteDiff: eDeleteDiff } = eContact || {};

      // 企业通讯录和个人通讯录的增/改
      const insertAndUpdateContactIds = [...(pInsertDiff || []), ...(pUpdateDiff || []), ...(eInsertDiff || []), ...(eUpdateDiff || [])];
      let resArr: newUsersIntoEmailListParam[] = [];
      if (insertAndUpdateContactIds?.length > 0) {
        const contactArr: ContactModel[] = await this.contactApi.doGetContactById(insertAndUpdateContactIds);
        resArr = (contactArr || []).map((item: ContactModel) => {
          const { contact } = item;
          const { accountName, contactName, priority } = contact;
          return {
            accountName,
            contactName,
            priority: priority as EmailListPriority,
          };
        });
      }

      // 企业通讯录和个人通讯录的 删
      const deleteContactIds = [...(pDeleteDiff || []), ...(eDeleteDiff || [])];
      let res1Arr: newUsersIntoEmailListParam[] = [];
      if (deleteContactIds?.length > 0) {
        // 看看是否已存在
        // const searchEmailListRes = await this.db.getByIds({
        //   dbName: 'contact_dexie',
        //   tableName: 'email_list',
        // }, deleteContactIds);

        // searchEmailListRes.forEach((item, index) => {
        //   // 已存在 优先级设为-1
        //   if (item) {
        //     res1Arr.push({
        //       ...(item as StrangerModel),
        //       priority: (-1 as EmailListPriority),
        //     });
        //   } else {
        // 不存在 新加 设为 -1
        // res1Arr.push({
        //   accountName: deleteContactIds[index],
        //   priority: (-1 as EmailListPriority),
        // });
        res1Arr = deleteContactIds.map((item: string) => ({
          accountName: item,
          priority: -1 as EmailListPriority,
        }));
        //   }
        // });
      }

      // console.log('resArrresArr', resArr, res1Arr);
      await this.newUsersIntoEmailList([...resArr, ...res1Arr] as newUsersIntoEmailListParam[]);
    } catch (error) {
      console.log('通讯录发生变化 emaillist响应失败', error);
    }
  }

  // 系统账号插入emaillist
  async systemAccountsIntoEmailList(): Promise<void> {
    try {
      let mySystemAccounts: string[] = [];
      // try {
      //   const res = await this.mailConfApi.doGetUserAttr(['system_sender_list']);
      //   mySystemAccounts = (res?.system_sender_list as unknown as string[]) || [];
      // } catch (error) {
      //   console.log('获取系统发件人失败', error);
      // 本地白名单兜底
      mySystemAccounts = SystemAccounts;
      // }
      const systemUsers = mySystemAccounts.map((item: string) => ({
        accountName: item,
        priority: 0 as EmailListPriority, // 系统账号最高优先级
        isSystemAccount: true,
      }));
      await this.newUsersIntoEmailList(systemUsers as newUsersIntoEmailListParam[]);
    } catch (error) {
      console.log('系统账号插入emaillist失败', error);
    }
  }

  // 获取附件列表
  async listAttachments(params: listAttachmentsParam): Promise<ResponseListAttachments> {
    const result = await this.mailContentHandler.listAttachments(params);
    return result;
  }

  async assembleMail(data: MailItemRes): Promise<MailEntryModel> {
    const res: ResponseMailContentEntry = {
      ...data,
      id: data.emailMid,
      tid: data.emailTid,
      sentDate: new Date(data.sentDate).toString(),
    } as unknown as ResponseMailContentEntry;
    const prItem: MailEntryProcessingItem = this.contactHandler.mapMailEntryToProcessingItem(res, data.emailMid);
    return this.contactHandler.handleContactList([prItem]).then((it: MailEntryProcessingItem[]) => this.mailContentHandler.handleMailContentResponse(it, true));
  }

  async doUploadMail(cid: string, fid: number): Promise<UploadMailResult> {
    if (!isElectron()) {
      return Promise.reject(new Error('只可以在electron中调用'));
    }
    const matched = util.extractPathFromCid(cid);
    if (!matched || matched.length < 2) {
      return Promise.reject(new Error('错误的ID'));
    }
    const filePath = matched[1];
    const fileExist = window.electronLib.fsManage.isExist(filePath);
    console.log('[upload mail] file path', filePath, 'is exist', fileExist);
    if (!fileExist) {
      return Promise.reject(new Error('文件不存在'));
    }
    const file = await window.electronLib.fsManage.readFile(filePath);
    if (file.length <= 0) {
      return Promise.reject(new Error('文件损坏'));
    }
    const uploadResult = await this.mailContentHandler.uploadMail(fid, file);
    console.log('[upload mail] file', file, 'result', uploadResult);
    this.doGetParsedEmlFromDb(cid).then(emlContentInDb => {
      if (emlContentInDb) {
        emlContentInDb.id = uploadResult.mid;
        this.db.put(mailComposeDataTable, emlContentInDb).catch();
      }
    });
    return uploadResult;
  }

  async doImportMails(conf: MailUploadParams, useDragImport?: boolean): Promise<ImportMailsResult[]> {
    let result: ImportMailsResult[] = []; // { mid: '' };
    if (inElectron && useDragImport) {
      result = await this.doImportMailByDrag(conf);
    } else if (!inElectron) {
      result = await this.doImportMailInWeb(conf);
    } else {
      result = await this.doImportMailInElectron(conf);
    }
    return result;
  }

  private async doImportMailInWeb(conf: MailUploadParams): Promise<ImportMailsResult[]> {
    const { fileList = [], fid, _account } = conf;
    const result: ImportMailsResult[] = []; // { mid: '' };
    const _extension = '.eml';
    const uploadPromise: Promise<ImportMailsResult>[] = [];
    const filteredFileList: Map<string, File> = new Map();

    const _doImportSingleMail = async (file: File, idx: number) => {
      const buffer = (await file.arrayBuffer()) as Buffer;
      const res = await this.mailContentHandler.uploadMail(fid, buffer, _account); // .then(res => ());
      return {
        mid: res.mid,
        fileName: file.name,
        success: true,
        idx,
      };
    };
    // web端简单按照文件名+文件大小 去重
    fileList.forEach(item => {
      filteredFileList.set(`${item.name}_${item.size}`, item);
    });
    [...filteredFileList.values()].forEach((file: File, idx) => {
      if (file.name.includes(_extension)) {
        uploadPromise.push(_doImportSingleMail(file, idx));
      } else {
        result.push({ fileName: file.name, success: false });
      }
    });
    const uploadRes = await Promise.allSettled(uploadPromise);
    uploadRes.forEach(_res => {
      if (_res.status === 'fulfilled') {
        result.push({ mid: _res.value.mid, fileName: _res.value.fileName, success: true });
      }
    });
    return result;
  }

  /**
   * 过滤本地db已经保存的mail md5, 再去请求接口检查是否已经已经存在远端邮箱列表内，然后去重
   * @param pathList 本地路径
   * @param finallyRes 最终结果返回 统计失败成功数量
   * @returns 去除已经存在邮箱列表的邮件md5
   */
  private async _filterDupFileByMd5(pathList: string[], _account?: string, finallyRes: any[] = [], ignoreDuplicateFid = 4): Promise<Map<string, string>> {
    if (pathList.length <= 0) {
      return new Map();
    }
    const calcMd5Promise: Promise<any>[] = [];
    const md5Map: Map<string, string> = new Map();
    const _doGetFileMd5 = async (path: string) => {
      const md5 = await window.electronLib.fsManage.getFileMd5(path);
      return { path, md5 };
    };
    const _genFailedResult = (times: number, reason: string, faildRes: any[] = []): any[] => {
      for (let i = 0; i < times; i++) {
        faildRes.push({
          mid: '',
          fileName: '',
          success: false,
          reason,
        });
      }
      return faildRes;
    };
    // 生成md5
    pathList.forEach(path => {
      calcMd5Promise.push(_doGetFileMd5(path));
    });
    const calcMd5PromiseRes = await Promise.allSettled(calcMd5Promise);
    calcMd5PromiseRes.forEach(res => {
      if (res.status === 'fulfilled') {
        md5Map.set(res.value.md5, res.value.path);
      }
    });
    if (md5Map.size < calcMd5PromiseRes.length) {
      _genFailedResult(calcMd5PromiseRes.length - md5Map.size, 'local repeat', finallyRes);
    }
    // 获取本地DB 已上传mails记录

    const dubMd5List = await this.getDuplicateMailByLocalMd5([...md5Map.keys()], _account, ignoreDuplicateFid);
    if (dubMd5List?.length) {
      _genFailedResult(dubMd5List.length, 'network repeat', finallyRes);
      dubMd5List.forEach(md5 => {
        md5Map.delete(md5);
      });
    }
    return md5Map;
  }

  private async getDuplicateMailByLocalMd5(md5List: string[], _account?: string, ignoreDuplicateFid = 4) {
    // 获取本地DB 已上传mails记录
    const existsLocalMails = await this.fileApi.checkMailMd5Exists([...md5List], _account);
    if (existsLocalMails.length) {
      // 获取邮件entry 通过本地记录中的mids
      const existsNetworkMails = await this.listMailEntryFromNetwork(
        {
          mids: existsLocalMails.map(mail => mail.mid),
          count: existsLocalMails.length,
          _account,
        },
        true
      );
      // .filter(it => it.fol)
      const midsFromNetwork = (Array.isArray(existsNetworkMails) ? existsNetworkMails : existsNetworkMails.data)
        .filter(it => it?.entry?.folder !== ignoreDuplicateFid)
        .map(it => it.id);
      // 拿到重复的mails记录并从list中移除
      const dupMails = existsLocalMails.filter(localMail => midsFromNetwork.indexOf(localMail.mid) !== -1);
      return dupMails.map(mail => mail.mailMd5);
    }
    return [];
  }

  private async doImportMailByDrag(conf: MailUploadParams): Promise<ImportMailsResult[]> {
    const { fileList = [], fid, _account } = conf;
    const result: ImportMailsResult[] = []; // { mid: '' };
    const uploadPromise: Promise<ImportMailsResult>[] = [];
    const filteredFileList: Map<string, File> = new Map();
    const calcMd5Promise: Promise<any>[] = [];
    const localMailModelList: ImportMailModel[] = [];
    const isSubCountReq = window?.isAccountBg;
    const _doImportSingleMail = async (file: File, idx: number, md5: string) => {
      let buffer;
      // fix: SIRIUS-3581
      try {
        if (isSubCountReq) {
          buffer = (await window.electronLib.fsManage.readFile(file.path)) as unknown as Buffer;
        } else {
          buffer = (await file.arrayBuffer()) as Buffer;
        }
        // const buffer = (await file.arrayBuffer()) as Buffer;
        const res = await this.mailContentHandler.uploadMail(fid, buffer, _account); // .then(res => ());
        return {
          mid: res.mid,
          fileName: file.name,
          success: true,
          path: file.path,
          idx,
          mailMd5: md5,
        };
      } catch (error) {
        const reason = JSON.stringify(error);
        return {
          mid: '',
          fileName: '',
          success: false,
          reason,
        };
      }
    };
    const _genFailedResult = (times: number, reason: string, faildRes: any[] = []): any[] => {
      for (let i = 0; i < times; i++) {
        faildRes.push({
          mid: '',
          fileName: '',
          success: false,
          reason,
        });
      }
      return faildRes;
    };
    const _doGetFileMd5 = async (file: File) => {
      try {
        let buffer;
        if (isSubCountReq) {
          buffer = (await window.electronLib.fsManage.readFile(file.path)) as unknown as Buffer;
        } else {
          buffer = (await file.arrayBuffer()) as Buffer;
        }
        const hash = createHash('md5');
        // todo: 临时解决Update中isBuffer过不去的问题, 在添加node的poyfill之后可以去掉
        const _buffer = Buffer.from(buffer);
        try {
          // eslint-disable-next-line
          // @ts-ignore
          _buffer._isBuffer = true;
        } catch (error) {
          console.error('[error] buffer._isBuffer', error);
        }
        hash.update(_buffer);
        return { md5: hash.digest('hex').toUpperCase(), file };
      } catch (e: any) {
        _genFailedResult(1, e?.message || '获取md5报错', result);
        return Promise.reject();
      }
    };
    // 生成md5
    fileList.forEach(file => {
      calcMd5Promise.push(_doGetFileMd5(file));
    });
    const calcMd5PromiseRes = await Promise.allSettled(calcMd5Promise);
    calcMd5PromiseRes.forEach(res => {
      if (res.status === 'fulfilled') {
        filteredFileList.set(res.value.md5, res.value.file);
      }
    });

    const dubMd5List = await this.getDuplicateMailByLocalMd5([...filteredFileList.keys()], _account, conf.ignoreDuplicateFid);
    if (dubMd5List?.length) {
      _genFailedResult(dubMd5List.length, 'network repeat', result);
      dubMd5List.forEach(md5 => {
        filteredFileList.delete(md5);
      });
    }
    [...filteredFileList].forEach(([md5, file], idx) => {
      uploadPromise.push(_doImportSingleMail(file, idx, md5));
    });
    const uploadRes = await Promise.allSettled(uploadPromise);
    uploadRes.forEach(_res => {
      if (_res.status === 'fulfilled') {
        const { mid = '', fileName = '', mailMd5 = '', success } = _res.value;
        localMailModelList.push({ mid, mailMd5, mailLocalPath: fileName });
        result.push({ mid, fileName, success });
      }
    });
    await this.fileApi.saveImportMails(localMailModelList, _account);
    return result;
  }

  private async doImportMailInElectron(conf: MailUploadParams): Promise<ImportMailsResult[]> {
    const { fid, _account } = conf;
    const result: ImportMailsResult[] = []; // { mid: '' };
    const _extension = '.eml';
    const loopPathPromise: Promise<string[]>[] = [];
    const uploadPromise: Promise<ImportMailsResult>[] = [];
    const localMailModelList: ImportMailModel[] = [];
    // const openDialogProperties = this.isMac ? ['openDirectory', 'openFile', 'multiSelections'] : ['openFile', 'multiSelections'];
    let dirPathList: string[] = [];

    // 收集文件夹内所有包含eml文件路径
    const _doCollectFilePath = async (path: string): Promise<string[]> => {
      const filePath = await window.electronLib.fsManage.loopDirPath(path, _extension, true);
      if (Array.isArray(filePath) && filePath.length > 0) {
        // 计算文件md5去重需要读取每一个文件到内存，在多文件场景会造成阻塞卡顿，先根据文件夹地址+文件名实现去重
        return filePath;
      }
      if (typeof filePath === 'string') {
        return [filePath];
      }
      return [];
    };
    // 单文件上传
    const _doImportSingleMail = async (path: string, name: string, md5: string): Promise<ImportMailsResult> => {
      // fix: SIRIUS-3581
      let reason = '';
      try {
        if (window.electronLib.fsManage.isExist(path)) {
          const fileBuffer = (await window.electronLib.fsManage.readFile(path)) as unknown as Buffer;
          const res = await this.mailContentHandler.uploadMail(fid, fileBuffer, _account); // .then(res => ());
          return {
            mid: res.mid,
            fileName: name,
            success: true,
            mailMd5: md5,
          };
        }
      } catch (error) {
        reason = JSON.stringify(error);
        this.dataTrackerHelper.track('import_mail_error', {
          path,
          name,
          error: reason,
        });
        console.warn('_doImportSingleMail in electron error has occured', error);
      }
      return {
        mid: '',
        fileName: name,
        success: false,
        mailMd5: '',
        reason,
      };
    };
    const selectRes: FsSelectRes = await window.electronLib.windowManage.select({
      properties: this.isMac ? ['openDirectory', 'openFile', 'multiSelections'] : ['openFile', 'multiSelections'],
      filters: [{ name: 'email', extensions: ['eml'] }],
      buttonLabel: '上传',
    });
    if (selectRes.success) {
      const paths = Array.isArray(selectRes.path) ? selectRes.path : [selectRes.path];
      paths.forEach((path: string) => {
        loopPathPromise.push(_doCollectFilePath(path));
      });
      const res = await Promise.allSettled(loopPathPromise);
      res.forEach((pathResult: PromiseSettledResult<string[]>) => {
        if (pathResult.status === 'fulfilled' && pathResult.value) {
          dirPathList = dirPathList.concat(pathResult.value);
        } else if (pathResult.status === 'rejected') {
          result.push({
            mid: '',
            fileName: '',
            success: false,
            reason: 'can not find dir or files: ' + pathResult?.reason,
          });
        }
      });
      const filteredLocalMailModel = await this._filterDupFileByMd5([...new Set(dirPathList)], _account, result, conf.ignoreDuplicateFid);
      [...filteredLocalMailModel].forEach(([md5, path]) => {
        uploadPromise.push(_doImportSingleMail(path, path, md5));
      });
      const uploadRes = await Promise.allSettled(uploadPromise);
      uploadRes.forEach(resData => {
        if (resData.status === 'fulfilled') {
          const importRes = resData.value as ImportMailsResult;
          result.push({
            mid: importRes.mid,
            mailMd5: importRes.mailMd5,
            fileName: importRes.fileName,
            success: importRes.success,
          });
          localMailModelList.push({ mid: importRes.mid || '', mailMd5: importRes.mailMd5 || '', mailLocalPath: importRes.fileName || '' });
        } else if (resData.status === 'rejected') {
          result.push({
            mid: '',
            fileName: '',
            success: false,
            reason: 'upload failed: ' + resData.reason,
          });
        }
      });
      await this.fileApi.saveImportMails(localMailModelList, _account);
    } else {
      result.push({
        mid: '',
        fileName: '',
        success: false,
        reason: 'canceled',
      });
    }
    return result;
  }

  doGetParsedEmlFromDb(cid: string, _account?: string): Promise<MailEntryModel> {
    return this.db.getById(mailComposeDataTable, cid, _account) as Promise<MailEntryModel>;
  }

  private async trackEmlOpenEvent() {
    try {
      this.loggerHelper.track('pcMail_OpenLocalEml_withLX');
    } catch (ex) {
      console.error('trackEmlOpenEvent-Error', ex);
    }
  }

  showUIMsg(msg: string, popupLevel = 'error') {
    try {
      if (!msg || !msg.length) return;
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventData: {
          popupType: 'window',
          popupLevel,
          title: msg,
        },
      });
    } catch (ex) {
      console.error('showErrorMsg-catch', ex);
    }
  }

  getIsSendAttachmentWritePage() {
    if (this.isMailPage) {
      return inWindow() ? location.href.indexOf('send-as-attachment') > 0 : false;
    }
    return false;
  }

  private async storeFilePathsByKey(key: string, filePaths: string[]) {
    try {
      await window.electronLib.storeManage.set('memory', key, filePaths);
    } catch (ex) {
      console.error('storeFilePathsByKey-error', ex);
    }
  }

  async getStoreFilesByKey(key: string): Promise<Array<string>> {
    try {
      const res = await window.electronLib.storeManage.get('memory', key);
      window.electronLib.storeManage.set('memory', key, []);
      return res;
    } catch (ex) {
      console.error('getStoreFileByKey-error', ex);
      return [];
    }
  }

  private async handleSendFileAsAttachment(filePaths: string[]) {
    try {
      const storeKey = new Date().getTime().toString() + Math.random().toString();
      await this.storeFilePathsByKey(storeKey, filePaths);
      this.systemApi.createWindow({ type: 'writeMailAttachmentPage', additionalParams: { 'send-as-attachment': 'true', 'store-key': storeKey } });
    } catch (ex) {
      console.error('handleSendFileAsAttachment-catch', ex);
    }
  }

  async openEmlMails(filePaths: string[]) {
    // eslint-disable-next-line no-restricted-syntax
    for (const filePath of filePaths) {
      try {
        this.trackEmlOpenEvent();
        // eslint-disable-next-line no-await-in-loop
        const cid = await this.preParseEml(filePath);
        // eslint-disable-next-line no-await-in-loop
        const res = await this.systemApi.createWindowWithInitData(
          { type: 'readMail', additionalParams: { account: '' } },
          {
            eventName: 'initPage',
            eventData: cid,
            _account: '',
          }
        );
        if (!res.success) {
          console.warn('[open eml] error', filePath, res.message);
        }
        // eslint-disable-next-line no-await-in-loop
        await wait(500);
      } catch (e) {
        console.warn('[open eml] error', e);
      }
    }
  }

  // 预解析 eml 文件，根据 eml 的 filePath 和 lastModified， 生成 eml 文件的 id
  async preParseEml(filePath: string): Promise<string> {
    if (isElectron()) {
      const fileExist = window.electronLib.fsManage.isExist(filePath);
      if (!fileExist) {
        return Promise.reject(new Error('文件不存在'));
      }
      // 获取文件状态
      const stat = await window.electronLib.fsManage.stat(filePath);
      const lastModified = stat.mtime.getTime();
      // 在 compose 标中查询，如果有，直接返回，不需要再次 parse
      return `eml-${filePath}-${lastModified}`;
    }
    return Promise.reject(new Error('只可以在electron中调用'));
  }

  async doParseEml(cid: string, encoding?: string, _account?: string): Promise<MailEntryModel> {
    if (process.env.BUILD_ISELECTRON) {
      // 先尝试从DB获取 能拿到 直接返回
      const content = await this.doGetParsedEmlFromDb(cid, _account);
      console.log('[parse eml] from db', cid, content);
      if (content) {
        return content;
      }
      // 路径
      const matched = util.extractPathFromCid(cid);
      if (!matched) {
        return Promise.reject(new Error('错误的EML ID'));
      }

      const filePath = matched[1];
      const lastModified = +matched[2];

      // 解析本地 eml
      const parsedMail = await window.electronLib.fsManage.parseEml(filePath, lastModified);

      parsedMail.id = cid;
      console.log('[parse eml] parse mail', parsedMail);

      // 处理 eml 附件
      await this.handleEmlAttachments(parsedMail, encoding || parsedMail.encoding);

      // 将本地 eml 内容，解析为服务端返回的格式
      const mailContentRes = this.parsedMailToResponseContent(parsedMail);
      const processingItem = await this.mailContentHandler.getMailContentProcessResponse(mailContentRes.id, mailContentRes);
      // 调用处理服务端返回数据的一系列接口，并最后进行组装
      const mailModel = await this.mailContentHandler.handleMailContentResponse(processingItem, true, 'eml', undefined, _account);
      mailModel.localFilePath = filePath;
      mailModel.cid = cid as unknown as string;
      console.log('[parse eml] return model', mailModel);

      // 解析完成存库
      await this.db.put(mailComposeDataTable, mailModel, _account).catch();
      return mailModel;
    }
    console.warn('[parse eml] 只可以在electron中调用');
    return Promise.reject(new Error('只可以在electron中调用'));
  }

  // 目前单独为了处理outlook 巴拉巴拉
  private async handleEmlAttachments(parsedMail: FsParsedMail, encoding = 'utf8') {
    const { attachments } = parsedMail;
    if (Array.isArray(attachments) && attachments.length > 0) {
      // eslint-disable-next-line no-restricted-syntax
      for (const attach of attachments) {
        // 处理 outlook 特殊格式的正文，需要对 winmail.dat 进行二次处理 SIRIUS-210【邮件】灵犀方式打开eml格式乱码（导入后正常）
        if (isWinmailDatAttachment(attach.contentType, attach.filename)) {
          if (inElectron) {
            try {
              // eslint-disable-next-line no-await-in-loop
              const result = await window.electronLib.fsManage.parseTNEFFile(attach.content, encoding);
              console.log('[parse eml] html from .dat attachment', result);
              // eslint-disable-next-line max-depth
              if (typeof result === 'string') {
                parsedMail.html = result;
              } else if (Array.isArray(result)) {
                parsedMail.attachments.push(...result);
              } else {
                console.warn('[parse eml] html from .dat attachment get nothing');
              }
            } catch (e) {
              console.log('[parse eml] html from .dat attachment error', e);
            }
          }
        }
      }
    }
    return parsedMail;
  }

  private parsedMailToResponseContent(parseMail: FsParsedMail): ResponseMailContentEntry {
    const { cc = [], html, subject = '', headerLines = [], date, from, to = [], bcc = [], replyTo, text = '' } = parseMail;
    const attachments: ResponseAttachment[] = parseMail.attachments
      .filter(v => !isWinmailDatAttachment(v.contentType, v.filename))
      .map((v, index) => ({
        filename: v.filename || '',
        contentId: v.contentId || '',
        estimateSize: v.size,
        contentLength: v.content.length,
        id: index + 1,
        contentType: v.contentType,
        inlined: v.contentDisposition === 'inline' || v.related,
        content: v.content,
      }));
    const xPriority = headerLines.find(v => v.key === 'x-priority');
    const priority = xPriority && xPriority.line ? xPriority.line.match(/X-Priority:\s*(\d+)/) : null;
    const contentHtml: ResponseAttachment = {
      filename: 'ATT00002.html',
      content: typeof html === 'string' ? html : '',
      contentLength: typeof html === 'string' ? html.length : 0,
      contentType: 'text/html',
      id: 1,
      inlined: false,
    };
    const contentText = {
      ...contentHtml,
      content: text,
    };
    return {
      id: parseMail.id,
      attachments,
      html: contentHtml,
      text: contentText,
      subject,
      priority: Array.isArray(priority) && priority[1] !== undefined ? +priority[1] : 3,
      sentDate: date ? util.formatDate(new Date(date).getTime()) : '',
      from: Array.isArray(from) ? from.map(v => v.text) : [from ? from.text : ''],
      to: Array.isArray(to) ? to.map(v => v.text) : [to.text],
      cc: Array.isArray(cc) ? cc.map(v => v.text) : [cc.text],
      bcc: Array.isArray(bcc) ? bcc.map(v => v.text) : [bcc.text],
      replyTo: Array.isArray(replyTo) ? replyTo.map(v => v.text) : [replyTo ? replyTo.text : ''],
    };
  }

  // 获取邮件分发详情
  getMailDeliveryDetail(mid: string, _account?: string): Promise<DeliveryDetail> {
    return this.mailContentHandler.getMailDeliveryDetail(mid, _account);
  }

  // 获取星标联系人列表
  async doListStarContact(_account?: string): Promise<ListStarContactRes> {
    const starList = await this.mailDbHandler.doListStarContact(_account);
    console.log('[star mail] star List', starList);
    return starList;
  }

  handleEmailListStringToParsedContent(listStr: string, ret: ContactProcessingItem) {
    return this.contactHandler.handleEmailListStringToParsedContent(listStr, ret);
  }

  /**
   *
   * @param tid
   * @returns
   */
  async getMailReadList(tid: string, _account?: string) {
    try {
      if (!tid) {
        return {
          success: false,
          errorMsg: 'tid is null',
        };
      }
      const url = this.systemApi.getAccountUrl('mailReadList', _account);
      const data = await this.impl.post(url, { tid }, { _account }).then(data => data.data);
      if (data && data.code && data.code.toString() === '200') {
        const timeZone = this.mailConfApi.getTimezone();
        const readList: Array<IMailReadListItem> = (data.result && data.result.data) || [];
        return {
          success: true,
          data: readList.map(item => {
            const timeZoneDate = this.systemApi.getDateByTimeZone(item.readTime, timeZone);
            item.readTime = dayjs(timeZoneDate).format('MM-DD HH:mm:ss');
            item.localReadTime = dayjs(item.localReadTime).format('MM-DD HH:mm:ss');
            return item;
          }),
        };
      }
      return {
        success: false,
        errorMsg: '未知错误',
      };
    } catch (ex: any) {
      const errorMsg = typeof ex === 'string' ? ex : (ex && ex.message) || '未知错误';
      return {
        success: false,
        errorMsg,
      };
    }
  }

  getMailHeaders(mid: string, _account?: string): Promise<string> {
    return this.mailContentHandler.getMailHeaders(mid, _account);
  }

  private getExePath() {
    return window.electronLib.appManage.getPath('exe');
  }

  private async getShouldUseInstallDir(): Promise<boolean> {
    if (!process.env.BUILD_ISELECTRON) return false;
    const isWin = !window.electronLib.env.isMac;
    if (isWin) {
      const exePath = await this.getExePath();
      if (exePath && exePath.toLowerCase().indexOf('c:') === 0) {
        return false;
      }
      return true;
    }
    return false;
  }

  private async getExeDir(): Promise<string> {
    return this.getExePath().then((exeDir: string) => {
      if (exeDir && exeDir.includes('.exe') && exeDir.includes('\\')) {
        const lastPathSplitInx = exeDir.lastIndexOf('\\');
        return exeDir.substring(0, lastPathSplitInx);
      }
      return '';
    });
  }

  private async getDefaultMailCachePath() {
    const shouldUseInstallDir = await this.getShouldUseInstallDir();
    let cacheDir = '';
    if (shouldUseInstallDir) {
      const exeDir = await this.getExeDir();
      try {
        cacheDir = await window.electronLib.fsManage.mkDir('download', exeDir);
      } catch (ex) {
        cacheDir = await window.electronLib.fsManage.normalizePath(`${exeDir}/download`);
      }
    } else {
      try {
        cacheDir = await window.electronLib.fsManage.mkDir('download');
      } catch (ex) {
        const userDataPath = await window.electronLib.appManage.getPath('userData');
        cacheDir = await window.electronLib.fsManage.normalizePath(`${userDataPath}/download`);
      }
    }
    return cacheDir;
  }

  async getMailCachePath() {
    try {
      if (!process.env.BUILD_ISELECTRON) return '';
      const data = this.storeApi.getSync(MAIL_CACHE_CUSTOMDIRKEY, globalStoreConfig);
      if (data && data.suc && data.data) {
        return data.data;
      }
      return this.getDefaultMailCachePath();
    } catch (ex) {
      console.error('getMailCachePath-error', ex);
      return this.getDefaultMailCachePath();
    }
  }

  async setMailCachePath(path: string) {
    try {
      this.storeApi.putSync(MAIL_CACHE_CUSTOMDIRKEY, path, globalStoreConfig);
      this.setMailContentDbCachePath();
      window.electronLib.fsManage.mkDir('', path);
      return {
        success: true,
      };
    } catch (ex: any) {
      console.error('setMailCachePath-catch', ex);
      return {
        success: false,
        errorMsg: (ex && ex.message) || '未知原因',
      };
    }
  }

  async selectMailCacheDirPath() {
    try {
      const res = await window.electronLib.windowManage.select({ properties: ['openDirectory'], buttonLabel: '使用该目录' });
      if (res.success) {
        const selectPath = res.path[0];
        if (selectPath.length === 3 && selectPath.endsWith('\\')) {
          return {
            success: true,
            path: selectPath,
          };
        }
        const exeDir = await this.getExeDir();
        const blackFolders = [exeDir];
        const isBlackFolder = blackFolders.find(blackStr => selectPath.toLowerCase().includes(blackStr.toLowerCase()));
        if (isBlackFolder) {
          return {
            success: false,
            errorMsg: getIn18Text('UNABLE_CACHE_PATH_TIP'),
          };
        }
        let hasPermisssion = false;
        try {
          const accessRes = await window.electronLib.fsManage.getIsFolderHasFullAccess(selectPath);
          if (accessRes.success && accessRes.createRes) {
            hasPermisssion = true;
          }
        } catch (ex: any) {
          console.error('fs getIsFolderHasFullAccess error', ex);
          hasPermisssion = false;
        }
        if (hasPermisssion) {
          return {
            success: true,
            path: selectPath,
          };
        }
        return {
          success: false,
          errorMsg: getIn18Text('NO_ACCESS_CACHE_PATH_TIP'),
        };
      }
      return {
        success: true,
        path: '',
      };
    } catch (ex: any) {
      return {
        success: false,
        errorMsg: (ex && ex.message) || '未知原因',
      };
    }
  }

  async doGetFoldersForPushConfig(_account?: string) {
    try {
      const mailBoxs = await this.doListMailBox(true, undefined, undefined, _account);
      const allMailBoxs: Array<MailBoxModel> = [];
      traverseMailBoxs(mailBoxs, allMailBoxs);
      const shouldConfigFolders = allMailBoxs.filter(mailBoxItem => {
        if (mailBoxItem && mailBoxItem.children && mailBoxItem.children.length) {
          mailBoxItem.children = [];
        }
        const { mailBoxId } = mailBoxItem;
        if (!mailBoxId) {
          return false;
        }
        if (mailBoxId === 1) {
          return true;
        }
        if (Number.parseInt(mailBoxId.toString()) >= 100) {
          return true;
        }
        return false;
      });
      return {
        success: true,
        data: shouldConfigFolders,
      };
    } catch (ex: any) {
      return {
        success: false,
        errorMsg: (ex && ex.message) || '',
      };
    }
  }

  async cleanPushConfig(_account?: string) {
    this.pushApi!.cleanPushConfig(_account);
  }

  async getPushConfig(type = 0, _account?: string) {
    return this.pushApi!.getCurrentPushConfig(type, _account);
  }

  async setPushConfig(config: IPushConfigSetRequest, _account?: string) {
    return this.pushApi!.setCurrentConfig(config, _account);
  }

  async doGetAllAccountsPushConfig() {
    try {
      const mailAndSubAccounts = await this.accountApi.getMainAndSubAccounts({ expired: false });
      const promises = mailAndSubAccounts.map(accountItem => {
        if (accountItem.accountType === 'mainAccount') {
          return this.getPushConfig(undefined, undefined).then(res => ({ email: accountItem.loginAccount || accountItem.id, ...res }));
        }
        return this.getPushConfig(undefined, accountItem.id).then(res => ({ email: accountItem.agentEmail || accountItem.id, ...res }));
      });
      const pushConfigResArr = await Promise.all(promises);
      const resArr: Array<IMailPushConfigItem> = [];
      pushConfigResArr.forEach(pushConfigItem => {
        if (pushConfigItem.success && pushConfigItem.data) {
          resArr.push({
            email: pushConfigItem.email,
            data: pushConfigItem.data,
          });
        }
      });
      return {
        success: true,
        data: resArr,
      };
    } catch (ex: any) {
      return {
        success: false,
        errorMsg: (ex && ex.message) || '',
      };
    }
  }

  async doGetAllAccountsFoldersForConfig() {
    try {
      const mailAndSubAccounts = await this.accountApi.getMainAndSubAccounts({ expired: false });
      const promises = mailAndSubAccounts.map(accountItem => {
        if (accountItem.accountType === 'mainAccount') {
          return this.doGetFoldersForPushConfig().then(res => ({ email: accountItem.loginAccount || accountItem.id, ...res }));
        }
        return this.doGetFoldersForPushConfig(accountItem.id).then(res => ({ email: accountItem.agentEmail || accountItem.id, ...res }));
      });
      const foldersConfigResArr = await Promise.all(promises);
      const res: Array<ISubAccountMailFoldersConfigItem> = [];
      foldersConfigResArr.forEach(configRes => {
        if (configRes.success) {
          res.push({
            email: configRes.email,
            folders: configRes.data!,
          });
        }
      });
      return {
        success: true,
        data: res,
      };
    } catch (ex: any) {
      console.log('doGetAllAccountsFoldersForConfig-error', ex);
      return {
        success: false,
        errorMsg: (ex && ex.messsage) || '',
      };
    }
  }

  async handleRawMailContent(id: string, rawContent: ResponseMailContentEntry) {
    return this.mailContentHandler.handleRawMailContent(id, rawContent);
  }

  async doGetMailContentInquiry(handoverEmailId: string): Promise<MailEntryModel> {
    if (!handoverEmailId) {
      return Promise.reject(new Error('no handoverEmailId input'));
    }
    const result = await this.mailContentHandler.doGetMailContentInquiry(handoverEmailId);
    // 邮件详情中过滤掉钓鱼邮件标签
    if (result && result.tags) {
      result.tags = result.tags.filter(tag => !tag.startsWith('%') && !tag.endsWith('%'));
    }
    if (result && !result.sender) {
      result.sender = this.contactHandler.buildEmptyContact(false)[0];
    }
    return result;
  }
}

const mailApiImpl: Api = new MailApiImpl();
api.registerLogicalApi(mailApiImpl);
export default mailApiImpl;
