import { Api, commonMessageReturn, EventLevel, NotificationType } from '../_base/api';
import { inWindow } from '@/config';
import { locationHelper } from '@/api/util/location_helper';

export enum IFrameIdMap {
  'contactSyncIframe' = 'accountBgEntry',
  'contactEdmSyncIframe' = 'accountBgEntry',
}
// import * as Events from 'events';
/**
 * web worker 调用通用参数
 */
export type DataMsg = {
  methodName: string;
  methodArg: {
    [k: string]: number | string | boolean | string[] | number[] | boolean[] | undefined;
  };
  methodExtArgs?: Blob | File;
};
export const parentWindowIframeTarget = ':parent';
export type ObFunction = (ev: SystemEvent) => void;
export type ObObject = {
  name?: string;
  func: ObFunction;
  prepend?: boolean;
  postObId?: number;
  electronObId?: number;
  nameFilter?: RegExp | string;
  eventName?: SystemEventTypeNames;
  _account?: string;
};
export type ObHandler = ObObject;
/**
 * web worker 调用通用返回
 */
export type DataRet<T = any> = {
  status: string;
  data?: T;
  msg?: string;
};
export const allAvailableNotificationType: NotificationType[] = ['mail', 'im'];
export type PersistLevel = 'memory' | 'disk' | 'none';

export type EventType = 'innerMsg' | 'workerMsg' | 'electronMsg' /* | 'postMsgRet' | 'electronMsgRet' */ | 'iframeMsg' | 'sysFeedback';

const DynamicEventType = process.env.BUILD_ISELECTRON ? 'electronMsg' : 'innerMsg';
/**
 * 系统事件基础字段
 */
export type SystemEventTypeBaseDef = {
  /**
   * 事件唯一标识
   */
  eventKey: string;
  /**
   * 事件描述
   */
  eventName: string;
  /**
   * 事件发起者,记录以便于管理
   */
  emitter: string | string[];
  /**
   * 事件接受者,记录以便于管理
   */
  receiver: string | string[];
  /**
   * 事件类型
   * innerMsg表示只在浏览器页面内部传递并被接受的事件
   * postMsg表示需要使用Message.post接口传递至webworker，由webworker进行异步处理
   * electronMsg 表示需要 在electron process 间传递的消息
   * postMsgRet标识从webWorker返回的异步处理结果
   * sysFeedback标识系统自动发送的回复消息，此类消息不可通过sendSysEvent调用发送
   */
  eventType: EventType;
  eventTypes?: EventType[];
  /**
   * 该事件是否可用
   */
  enable: boolean;
  /**
   * 是否持久化事件
   * persist=none(默认) 标识瞬时事件，即发送后立刻到达处理方，无论是否处理完毕，事件都会自动销毁
   * persist=memory 标识非持久化事件，事件保存于内存中，不重启应用会持续存在
   * persist=disk 标识持久化事件，事件除了保存在内存，还会持久化到磁盘等非易失存储上，保存在持久化存储上的数据会在应用启动后自动加载回来
   * 非瞬时类型事件在没有接受者之前，会将事件保存在系统中，待添加第一个接受者，会受到全部信息
   * 非瞬时类型类型事件可以添加回复确认机制，实现窗口化接受事件，
   * 例如窗口设置为2 ，则发送两个事件后，除非确认一个事件处理完毕后，才会发送下一个
   */
  persist?: PersistLevel;
  /**
   * 最多保存的消息数目
   */
  maxPersistNum?: number;
  /**
   * 接收方接受窗口大小，当前并无完整的滑动窗口机制支持，目前仅支持单窗口协议
   */
  acceptCount?: number;
  /**
   * 过滤函数
   * 通过自定义逻辑确认是否发送此消息
   */
  filter?: (ev: SystemEvent) => boolean;
  /**
   * 对于需要发送到其他窗口或iframe或类似组件的消息，是否在本窗口内也进行发送
   */
  asInnerMsg?: boolean;
  /**
   * 发送给全部其他窗口
   */
  toAllWin?: boolean;
  /**
   * 发送给特定类型的窗口
   */
  toType?: string[];

  /**
   * 多账号使用，发送到特定账号窗口
   */
  toAllAccount?: boolean;

  /**
   * 消息持久化生存周期
   * 发送失败的消息会被录入持久化存储中，生存周期则记录此消息的有效周期，超过有效周期的消息将被移除
   * 如设置为0或负数，则不会在发送失败后录入本地持久化存储
   */
  persistTTL?: number;
  /**
   * 消息生存周期，用于检测消息是否有效的标识，如不设置，则采用persistTTL
   */
  ttl?: number;
  /**
   * 针对：1.eventType为electronMsg，2.toAllWin为true的情况
   * 需要在web端生效时，可以将此属性设为true，此时在web环境下，eventType会重置为innerMsg，toAllWin设为false
   */
  enableInWeb?: boolean;
  /**
   * 不采样率，0标识全部采样，1 标识不采样 , 默认 50%采样记录本地日志
   */
  recordSample?: number;
  /**
   * log记录事件的最大文本长度， 默认 2048
   */
  recordLen?: number;
};
/**
 * web workder类型事件所需额外信息
 * postMsg类型系统事件，需要使用web workder完成，需额外声明web worker所需属性
 */
export type SystemEventTypeWebWorkerDef = {
  /**
   * 对于 postMsg 类型 需要指定处理的web worker 脚本
   */
  handlerWorkScript?: string;
  /**
   * post 类型 的webworker 对应的id;
   *
   */
  handlerWorkerId?: number;
  /**
   * 是否使用shared web worker
   */
  shared?: boolean;
};
export type SystemEventTypeIframeDef = {
  iframeElementId?: () => string;
  iframeUrl?: string;
};
export type SystemEventTypeElectronDef = Record<string, any>;
/**
 * 系统事件类型
 */
export type SystemEventTypeDef = SystemEventTypeBaseDef & SystemEventTypeWebWorkerDef & SystemEventTypeIframeDef;
/**
 * 事件类型定义
 * 详见 {@link systemEventAllType}
 *
 */
export type SystemEventTypeNames =
  | 'login'
  | 'preLogin'
  | 'logout'
  | 'loginExpired'
  | 'loginRetry'
  | 'error'
  | 'networkFail'
  | 'dbOperation'
  | 'dbOperationRet'
  | 'electronClose'
  | 'electronClosed'
  | 'electronActive'
  | 'electronBlur'
  | 'electronIpcRet'
  | 'electronShow'
  | 'electronHide'
  | 'notificationChange'
  | 'updateUserInfo'
  | 'upgradeApp'
  | 'initPage'
  | 'launchSuccessed'
  | 'attachmentPreviewInitData'
  | 'accountNotify'
  | 'contactNotify'
  | 'contactPersonalMarkNotify'
  | 'contactEdmNotify'
  | 'colleagueEdmNotify'
  | 'contactAccountNotify'
  | 'contactOrgNotify'
  | 'selectContactNotify'
  | 'recentContactNotify'
  | 'customerMapChangeNotify'
  | 'selectOrgNotify'
  | 'catalogNotify'
  | 'writeLatter'
  | 'attachToCloud'
  | 'writePageDataExchange'
  | 'preCreateWriteTab'
  | 'destoryWriteTab'
  | 'refreshLocalDraft'
  // TODO：mailStoreRefresh 替换完成后删除
  | 'mailMsgCenter'
  // TODO：替换mailMsgCenter
  | 'mailStoreRefresh'
  | 'mailChanged'
  | 'mailPushNotify'
  // TODO：mailStoreRefresh 替换完成后删除
  | 'mailOperation'
  // TODO：mailStoreRefresh 替换完成后删除
  | 'mailOperationWeb'
  | 'electronTest'
  | 'accountAdded'
  | 'hiddenActiveIcon'
  | 'fsDownloadNotify'
  | 'settingShow'
  | 'mailSwitch'
  | 'mailTagChanged'
  | 'mailStatesChanged'
  | 'mailTranslateChanged'
  | 'chooseMailTag'
  | 'loginBlock'
  | 'diskInnerCtc'
  | 'emailListChange'
  | 'setPriorities'
  | 'tabsDrop'
  | 'tabsOperation'
  | 'initModule'
  | 'keyboard'
  | 'mailAliasAccountListChange'
  /** 通知主窗口打开写信窗口 */
  | 'openWritePageFromMain'
  | 'deleteMailById'
  | 'iframeTest'
  // | 'moveMailById'
  | 'syncSchedule'
  | 'syncScheduleState'
  | 'loginCrossWindow'
  | 'loginExpiredCrossWindow'
  | 'toSaveDraft'
  | 'toSendMail'
  | 'messageDoubleClick'
  | 'noLoginStatus'
  | 'routeChange'
  | 'diskNps'
  | 'todoChange'
  | 'mailMenuOper'
  | 'bkStableSwitchAccount'
  | 'acrossWinBridge'
  | 'imTeamEvents'
  | 'shouldUpdateAppChanged'
  | 'storeChangeEvent'
  | 'storeUserChangeEvent'
  | 'initAddAccountPageEvent'
  | 'addAccountPageReturnEvent'
  | 'edmGlobalNotice'
  | 'whatsAppContactsUpdate'
  | 'whatsAppMessagesUpdate'
  | 'whatsAppMessageStatus'
  | 'whatsAppMessagesUpdateV2'
  | 'whatsAppMessageStatusV2'
  | 'whatsAppProxyWarning'
  | 'facebookNewMessage'
  | 'facebookAccountExpires'
  | 'socialMediaNewMsg'
  | 'regularCustomerMenuUpdate'
  | 'globalSearchSubscribeUpdate'
  | 'globalSearchCheckAllAiKeywords'
  | 'subAccountPageReturnEvent'
  | 'initBindSubAccountPageEvent'
  | 'initSubAccountBgPageEvent'
  | 'addSubAccountPageReturnEvent'
  | 'addSubAccountPageSendMobileCode'
  | 'addSubAccountPageSendMobileCodeReturnEvent'
  | 'addSubAccountPageVerifyMobileCode'
  | 'addSubAccountPageVerifyMobileCodeReturnEvent'
  | 'initAddSubAccountPageEvent'
  | 'initAddPersonalSubAccountPageEvent'
  | 'SubAccountDeleted'
  | 'SubAccountAdded'
  | 'SubAccountWindowReady'
  | 'SubAccountWindowClosed'
  | 'SubAccountLoginExpired'
  | 'subAccountLogin'
  | 'subAccountLoginHttpExpired'
  | 'SubAccountLoginPreExpired'
  | 'contactCurrentAccountNotify'
  | 'initBkLoginPage'
  | 'subAccountDBChanged'
  | 'subAccountLogout'
  | 'syncSubAccountUnreadCount'
  | 'customDataStarUpdate'
  | 'sharedAccountLogout'
  | 'globalSearchGrubTaskAdd'
  | 'globalSearchGrubTaskFinish'
  | 'openMarketingDetail'
  | 'sendingMail'
  | 'mailRealListTotalChanged'
  | 'SystemTaskNewTask'
  | 'SystemTaskStatusUpdate'
  | 'NoviceTaskRemind'
  | 'NoviceTaskRegister'
  | 'NoviceTaskFinished'
  | 'changeCoreContactSyncStatus'
  | 'coreOrgPathlistReady'
  | 'onAppLockChanged'
  | 'setDATrackerToken'
  | 'aiTimesUpdate'
  | 'initSendAttachmentsWritePage'
  | 'subCoreOrgContactReady'
  | 'sendSelectedContactIdOnContactPage'
  | 'customNotification'
  | 'subAccountLoginExpiredCrossWindow'
  | 'detectContactException'
  | 'detectContactExceptionInWeb'
  | 'syncSubAccountState'
  | 'closeSchedulerReminder'
  | 'lockScreen'
  | 'unlockScreen'
  | 'laptopSuspend'
  | 'laptopResume'
  | 'upgradeVersion'
  | 'requireModuleGuide'
  | 'edmPrivilegeReady'
  | 'toMuchOrToSlowLogger'
  | 'changeQuickMarktingGroup'
  | 'displayMarketingModal'
  | 'whatsappSubscribeUpdate';

export type SystemEventTypes = Record<SystemEventTypeNames, SystemEventTypeDef>;
/**
 * 全局预定义事件类型，
 * 部分复杂事件会额外定义处理的脚本等信息，
 * 此信息会在{@link SystemApi }的实现中被初始化
 */
export const systemEventAllType: SystemEventTypes = {
  dbOperation: {
    eventKey: 'dbOperation',
    eventName: '数据库操作',
    emitter: [],
    receiver: [],
    eventType: 'workerMsg',
    handlerWorkScript: '/worker/db.bundle.min.js',
    enable: false,
  },
  dbOperationRet: {
    eventKey: 'dbOperationRet',
    eventName: '数据库操作返回',
    emitter: [],
    receiver: [],
    eventType: 'workerMsg',
    enable: false,
  },
  error: {
    eventKey: 'error',
    eventName: '错误信息',
    emitter: [],
    receiver: [],
    toAllAccount: false,
    eventType: 'innerMsg',
    enable: true,
  },
  login: {
    eventKey: 'login',
    eventName: '登录/登出事件',
    emitter: 'login_impl',
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 0,
    ttl: 30000,
    persist: 'memory',
    asInnerMsg: true,
    enableInWeb: true,
    toAllWin: true,
    recordLen: 102400,
    recordSample: 0,
    // persist:"memory"
  },
  subAccountLogin: {
    eventKey: 'subAccountLogin',
    eventName: '登录/登出事件',
    emitter: 'login_impl',
    receiver: [],
    eventType: DynamicEventType,
    enable: true,
    persistTTL: 0,
    ttl: 30000,
    persist: 'memory',
    asInnerMsg: true,
    enableInWeb: true,
    toAllWin: true,
    recordLen: 102400,
    recordSample: 0,
    // persist:"memory"
  },
  logout: {
    eventKey: 'logout',
    eventName: '主动触发登出事件',
    emitter: '',
    receiver: ['login_impl'],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 5000,
    persist: 'memory',
    asInnerMsg: true,
    enableInWeb: true,
    toAllWin: true,
    recordLen: 10240,
    recordSample: 0,
  },
  subAccountLogout: {
    eventKey: 'subAccountLogout',
    eventName: '主动触发登出事件',
    emitter: '',
    receiver: ['login_impl'],
    eventType: DynamicEventType,
    enable: true,
    persistTTL: 5000,
    persist: 'memory',
    asInnerMsg: true,
    enableInWeb: true,
    toAllWin: true,
    recordLen: 10240,
    recordSample: 0,
  },
  preLogin: {
    eventKey: 'preLogin',
    eventName: '预登录事件',
    emitter: 'login_impl',
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
  },
  loginExpired: {
    eventKey: 'loginExpired',
    eventName: '登录失效事件',
    emitter: ['http_impl', 'contact_impl'],
    receiver: ['login_impl'],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
    recordLen: 10240,
    recordSample: 0,
  },
  subAccountLoginHttpExpired: {
    eventKey: 'subAccountLoginHttpExpired',
    eventName: '登录失效事件',
    emitter: ['http_impl', 'contact_impl'],
    receiver: ['login_impl'],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
    recordLen: 10240,
    recordSample: 0,
  },
  loginRetry: {
    eventKey: 'loginRetry',
    eventName: '登录重试',
    emitter: ['http_impl'],
    receiver: ['login_impl'],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
    recordLen: 10240,
    recordSample: 0,
  },
  // loginRetry: {
  //   eventKey: 'loginRetry',
  //   eventName: '登录重试',
  //   emitter: ['http_impl'],
  //   receiver: ['login_impl'],
  //   eventType: 'innerMsg',
  //   enable: true,
  //   persist: 'memory',
  //   recordLen: 10240,
  //   recordSample: 0
  // },
  networkFail: {
    eventKey: 'networkFail',
    eventName: '网络失效事件',
    emitter: ['http_impl'],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
    recordLen: 1024,
    recordSample: 0.9,
  },
  keyboard: {
    eventKey: 'keyboard',
    eventName: '窗口键盘事件触发',
    emitter: ['keyboard_impl'],
    receiver: ['web'],
    eventType: 'innerMsg',
    enable: true,
    persistTTL: 0,
    persist: 'memory',
    recordSample: 0.8,
  },
  initModule: {
    eventKey: 'initModule',
    eventName: '各个模块初始化完成',
    emitter: ['api'],
    receiver: ['web'],
    eventType: 'innerMsg',
    enable: true,
    persistTTL: 60 * 1000,
    maxPersistNum: 10,
    persist: 'memory',
    recordSample: 0,
  },
  launchSuccessed: {
    eventKey: 'launchSuccessed',
    eventName: '进度条完成加载',
    emitter: [],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
  },
  syncSchedule: {
    eventName: '日程主界面同步',
    eventKey: 'syncSchedule',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 5000,
    persist: 'memory',
  },
  syncScheduleState: {
    eventName: '跨窗口同步日历模块redux状态，跨窗口同步日历模块数据',
    eventKey: 'syncScheduleState',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 5000,
    persist: 'memory',
  },
  accountNotify: {
    eventName: '账号信息同步',
    eventKey: 'accountNotify',
    emitter: ['account_impl'],
    receiver: ['setting'],
    eventType: 'innerMsg',
    enable: true,
    persistTTL: 2000,
    persist: 'memory',
    recordSample: 0,
  },
  contactNotify: {
    eventKey: 'contactNotify',
    eventName: '通讯更改通知',
    emitter: ['contact_impl'],
    receiver: [],
    eventType: 'electronMsg',
    eventTypes: ['electronMsg', 'innerMsg', 'iframeMsg'],
    enable: true,
    asInnerMsg: true,
    enableInWeb: true,
    toAllAccount: true,
    toAllWin: true,
    persist: 'memory',
    persistTTL: 30000,
    maxPersistNum: 1,
    recordSample: 0,
    iframeElementId: () => {
      if (!inWindow) {
        return 'no-key';
      }
      if (locationHelper.isMainPage()) {
        return IFrameIdMap.contactSyncIframe;
      }
      return parentWindowIframeTarget;
    },
  },
  contactPersonalMarkNotify: {
    eventKey: 'contactPersonalMarkNotify',
    eventName: '个人/分组星标更改通知',
    emitter: ['contact_impl'],
    receiver: [],
    eventType: 'electronMsg',
    eventTypes: ['electronMsg', 'innerMsg', 'iframeMsg'],
    enable: true,
    asInnerMsg: true,
    enableInWeb: true,
    toAllAccount: true,
    toAllWin: true,
    persist: 'memory',
    persistTTL: 30000,
    maxPersistNum: 1,
    recordSample: 0,
    iframeElementId: () => {
      if (!inWindow) {
        return 'no-key';
      }
      if (locationHelper.isMainPage()) {
        return IFrameIdMap.contactSyncIframe;
      }
      return parentWindowIframeTarget;
    },
  },
  contactEdmNotify: {
    eventKey: 'contactEdmNotify',
    eventName: '客户通讯更改通知',
    emitter: ['contact_edm_helper'],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    asInnerMsg: true,
    enableInWeb: true,
    toAllAccount: true,
    toAllWin: true,
    persist: 'memory',
    persistTTL: 30000,
    maxPersistNum: 1,
    recordSample: 0,
    iframeElementId: () => {
      if (!inWindow()) {
        return 'no-key';
      }
      if (locationHelper.isMainPage()) {
        return IFrameIdMap.contactEdmSyncIframe;
      }
      return parentWindowIframeTarget;
    },
  },
  colleagueEdmNotify: {
    eventKey: 'colleagueEdmNotify',
    eventName: '客户下属通讯更改通知',
    emitter: ['contact_edm_helper'],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    asInnerMsg: true,
    enableInWeb: true,
    toAllAccount: true,
    toAllWin: true,
    persist: 'memory',
    persistTTL: 30000,
    maxPersistNum: 1,
    recordSample: 0,
    iframeElementId: () => {
      if (!inWindow()) {
        return 'no-key';
      }
      if (locationHelper.isMainPage()) {
        return IFrameIdMap.contactEdmSyncIframe;
      }
      return parentWindowIframeTarget;
    },
  },
  contactAccountNotify: {
    eventKey: 'contactAccountNotify',
    eventName: '通讯账户更改通知',
    emitter: ['contact_impl'],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    asInnerMsg: true,
    enableInWeb: true,
    toAllAccount: true,
    toAllWin: true,
    persist: 'memory',
    persistTTL: 30000,
    maxPersistNum: 1,
    recordSample: 0,
    iframeElementId: () => {
      if (!inWindow()) {
        return 'no-key';
      }
      if (locationHelper.isMainPage()) {
        return IFrameIdMap.contactEdmSyncIframe;
      }
      return parentWindowIframeTarget;
    },
  },
  // 占位
  contactCurrentAccountNotify: {
    eventKey: 'contactCurrentAccountNotify',
    eventName: 'xxxx',
    emitter: ['contact_impl'],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    asInnerMsg: true,
    enableInWeb: true,
    toAllAccount: true,
    toAllWin: true,
    persist: 'memory',
    persistTTL: 30000,
    maxPersistNum: 1,
    recordSample: 0,
    iframeElementId: () => {
      if (!inWindow()) {
        return 'no-key';
      }
      if (locationHelper.isMainPage()) {
        return IFrameIdMap.contactEdmSyncIframe;
      }
      return parentWindowIframeTarget;
    },
  },
  contactOrgNotify: {
    eventKey: 'contactOrgNotify',
    eventName: '通讯群组更改通知',
    emitter: ['contact_impl'],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    asInnerMsg: true,
    enableInWeb: true,
    toAllAccount: true,
    toAllWin: true,
    persist: 'memory',
    persistTTL: 30000,
    maxPersistNum: 1,
    recordSample: 0,
    iframeElementId: () => {
      if (!inWindow()) {
        return 'no-key';
      }
      if (locationHelper.isMainPage()) {
        return IFrameIdMap.contactEdmSyncIframe;
      }
      return parentWindowIframeTarget;
    },
  },
  recentContactNotify: {
    eventKey: 'recentContactNotify',
    eventName: '最近联系人通讯更改通知',
    emitter: ['contact_impl'],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    asInnerMsg: true,
    enableInWeb: true,
    toAllWin: true,
    persist: 'memory',
    persistTTL: 30000,
    maxPersistNum: 1,
    recordSample: 0,
  },
  customerMapChangeNotify: {
    eventKey: 'customerMapChangeNotify',
    eventName: '客户详情更改通知',
    emitter: ['contactReducer_customerMap'],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    asInnerMsg: true,
    enableInWeb: true,
    toAllWin: true,
    persist: 'memory',
    persistTTL: 30000,
    maxPersistNum: 1,
    recordSample: 0,
  },
  mailAliasAccountListChange: {
    eventKey: 'mailAliasAccountListChange',
    eventName: '写信发件人配置更改通知',
    emitter: ['account_impl'],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    asInnerMsg: true,
    enableInWeb: true,
    toAllWin: true,
    persist: 'memory',
    persistTTL: 30000,
    recordSample: 0,
  },
  selectContactNotify: {
    eventKey: 'selectContactNotify',
    eventName: '通讯录查询通知',
    emitter: ['contact_impl'],
    receiver: ['contactReducer'],
    eventType: 'innerMsg',
    enable: true,
    asInnerMsg: true,
    persist: 'memory',
    recordSample: 0.3,
    recordLen: 20480,
    persistTTL: 5000,
  },
  selectOrgNotify: {
    eventKey: 'selectOrgNotify',
    eventName: '通讯录组织查询通知',
    emitter: ['contact_impl'],
    receiver: ['contactReducer'],
    eventType: 'innerMsg',
    enable: true,
    asInnerMsg: true,
    persist: 'memory',
    recordSample: 0.3,
    recordLen: 20480,
    persistTTL: 5000,
  },
  catalogNotify: {
    eventKey: 'catalogNotify',
    eventName: '日历更新通知',
    emitter: ['catalog_impl'],
    receiver: ['catalog'],
    eventType: 'innerMsg',
    enable: true,
    persistTTL: 0,
    persist: 'memory',
  },
  fsDownloadNotify: {
    eventKey: 'fsDownloadNotify',
    eventName: '文件下载进度更新通知',
    emitter: ['file_impl'],
    receiver: ['downloadCard'],
    eventType: 'innerMsg',
    enable: true,
    persistTTL: 0,
    recordSample: 0.8,
    persist: 'memory',
  },
  writeLatter: {
    eventKey: 'writeLatter',
    eventName: '触发写信弹窗事件',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
    toAllAccount: true,
    recordSample: 0,
  },
  attachToCloud: {
    eventKey: 'attachToCloud',
    eventName: '附件转为云附件',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
    toAllAccount: true,
    recordSample: 0,
  },
  electronClose: {
    eventKey: 'electronClose',
    eventName: '桌面端窗口即将关闭',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 0,
    enable: true,
    recordSample: 0,
  },
  electronActive: {
    eventKey: 'electronActive',
    eventName: '桌面端窗口获得焦点',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 0,
    enable: true,
  },
  electronBlur: {
    eventKey: 'electronBlur',
    eventName: '桌面端窗口失去焦点',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 0,
    enable: true,
  },
  electronClosed: {
    eventKey: 'electronClosed',
    eventName: '桌面端窗口关闭',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 0,
    enable: true,
    recordSample: 0,
  },
  electronIpcRet: {
    eventKey: 'electronIpcRet',
    eventName: '其他窗口接受到消息后回复',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
  },
  electronShow: {
    eventKey: 'electronShow',
    eventName: '桌面端窗口展示',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 0,
    enable: true,
    recordSample: 0,
  },
  electronHide: {
    eventKey: 'electronHide',
    eventName: '桌面端窗口隐藏',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 0,
    enable: true,
    recordSample: 0,
  },
  notificationChange: {
    eventKey: 'notificationChange',
    eventName: '通知角标变化，会导致一级导航的角标出现更新',
    emitter: [''],
    receiver: [],
    eventType: 'electronMsg',
    // toAllWin: true,
    enable: true,
    enableInWeb: true,
    asInnerMsg: true,
    toType: ['main'],
    persist: 'memory',
    persistTTL: 5000,
    recordSample: 0.3,
  },
  updateUserInfo: {
    eventKey: 'updateUserInfo',
    eventName: '通知用户信息出现变化，需要更新展示当前用户数据的组件',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
    recordSample: 0,
  },
  mailMsgCenter: {
    eventKey: 'mailMsgCenter',
    eventName: '邮件列表消息中心',
    emitter: [''],
    receiver: ['mailBox.tsx'],
    eventType: 'innerMsg',
    enable: true,
    recordSample: 0,
    asInnerMsg: true,
  },
  // 配合重构的 api redux 使用
  mailStoreRefresh: {
    eventKey: 'mailStoreRefresh',
    eventName: '刷新邮件列表',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    asInnerMsg: true,
    enableInWeb: true,
    toAllAccount: true,
    toType: ['main', 'mail', 'readMail', 'readMailComb', 'strangerMails'],
    enable: true,
    recordSample: 0,
  },
  mailChanged: {
    eventKey: 'mailChanged',
    eventName: '通知邮件数据出现变化，需要更新邮件列表',
    emitter: [''],
    receiver: ['mailBox.tsx'],
    eventType: 'electronMsg',
    // toAllWin: true,
    enable: true,
    enableInWeb: true,
    asInnerMsg: true,
    toType: ['main', 'writeMail', 'readMailComb', 'readMail', 'strangerMails', 'mail'],
    recordSample: 0,
  },
  mailPushNotify: {
    eventKey: 'mailPushNotify',
    eventName: '邮件推送消息',
    emitter: [''],
    receiver: ['mailBox.tsx'],
    eventType: 'electronMsg',
    enable: true,
    enableInWeb: true,
    asInnerMsg: true,
    toType: ['main'],
    recordSample: 0,
  },
  upgradeApp: {
    eventKey: 'upgradeApp',
    eventName: '展示升级app弹窗',
    emitter: [''],
    receiver: ['index.ts'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  bkStableSwitchAccount: {
    eventKey: 'bkStableSwitchAccount',
    eventName: '后台页面切换账号是否成功',
    emitter: ['bkStable'],
    receiver: ['loginReducer'],
    eventType: 'electronMsg',
    persist: 'memory',
    persistTTL: 5000,
    maxPersistNum: 1,
    enable: true,
    toAllAccount: true,
    toAllWin: true,
  },
  initPage: {
    eventKey: 'initPage',
    eventName: '初始化页面数据',
    emitter: ['mainLayout.tsx'],
    receiver: [''],
    eventType: 'electronMsg',
    persist: 'memory',
    enable: true,
    recordSample: 0,
    recordLen: 10240,
  },
  initBkLoginPage: {
    eventKey: 'initPage',
    eventName: '初始化页面数据',
    emitter: ['mainLayout.tsx'],
    receiver: [''],
    eventType: 'electronMsg',
    persist: 'memory',
    enable: true,
    toAllAccount: true,
    toAllWin: true,
    persistTTL: 3000,
    maxPersistNum: 1,
  },
  attachmentPreviewInitData: {
    eventKey: 'attachmentPreviewInitData',
    eventName: '初始化attachmentPreview页面数据',
    emitter: [''],
    receiver: [''],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
    persistTTL: 5000,
  },
  electronTest: {
    eventKey: 'electronTest',
    eventName: '测试electron消息收发',
    emitter: [],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
  },
  accountAdded: {
    eventKey: 'accountAdded',
    eventName: '账号操作',
    emitter: [''],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
  },
  settingShow: {
    eventKey: 'settingShow',
    eventName: '设置界面显示隐藏切换',
    emitter: [''],
    receiver: ['avatar.tsx'],
    eventType: 'innerMsg',
    enable: true,
  },
  messageDoubleClick: {
    eventKey: 'messageDoubleClick',
    eventName: '消息tab双击',
    emitter: [''],
    receiver: ['imSessionList.tsx'],
    eventType: 'innerMsg',
    enable: true,
  },
  mailSwitch: {
    eventKey: 'mailSwitch',
    eventName: '邮件切换状态',
    emitter: [''],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
  },
  mailRealListTotalChanged: {
    eventKey: 'mailRealListTotalChanged',
    eventName: '邮件列表总数变化',
    emitter: [''],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
  },
  hiddenActiveIcon: {
    eventKey: 'hiddenActiveIcon',
    eventName: '隐藏toolbar上的active图标',
    emitter: [''],
    receiver: ['sideBar.tsx'],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
  },
  writePageDataExchange: {
    eventKey: 'writePageDataExchange',
    eventName: '写信页面与主页面交互',
    emitter: [],
    receiver: [''],
    eventType: 'electronMsg',
    persistTTL: 30000,
    enable: true,
    asInnerMsg: true,
    recordSample: 0,
    enableInWeb: true,
    toAllAccount: true,
  },
  preCreateWriteTab: {
    eventKey: 'preCreateWriteTab',
    eventName: '预创建写信标签',
    emitter: [],
    receiver: [''],
    eventType: 'electronMsg',
    persistTTL: 30000,
    enable: true,
    asInnerMsg: true,
    recordSample: 0,
    enableInWeb: true,
  },
  destoryWriteTab: {
    eventKey: 'destoryWriteTab',
    eventName: '销毁写信标签',
    emitter: [],
    receiver: [''],
    eventType: 'electronMsg',
    persistTTL: 30000,
    enable: true,
    asInnerMsg: true,
    recordSample: 0,
    enableInWeb: true,
  },
  refreshLocalDraft: {
    eventKey: 'refreshLocalDraft',
    eventName: '刷新本地草稿',
    emitter: [],
    receiver: [''],
    eventType: 'electronMsg',
    persistTTL: 30000,
    enable: true,
    asInnerMsg: true,
    recordSample: 0,
    enableInWeb: true,
  },
  sendingMail: {
    eventKey: 'sendingMail',
    eventName: '邮件发信中',
    emitter: [],
    receiver: [''],
    eventType: 'electronMsg',
    persistTTL: 30000,
    enable: true,
    asInnerMsg: true,
    recordSample: 0,
    enableInWeb: false,
  },
  loginBlock: {
    eventKey: 'loginBlock',
    eventName: '登录封锁必要操作',
    emitter: [],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
  },
  chooseMailTag: {
    eventKey: 'chooseMailTag',
    eventName: '选择邮件标签',
    emitter: [],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
  },
  mailTagChanged: {
    eventKey: 'mailTagChanged',
    eventName: '邮件标签设置',
    emitter: [],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
    recordSample: 0,
  },
  mailTranslateChanged: {
    eventKey: 'mailTranslateChanged',
    eventName: '一键翻译设置',
    emitter: [],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
  },
  mailStatesChanged: {
    eventKey: 'mailStatesChanged',
    eventName: '邮件-红旗邮件设置',
    emitter: [],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
    asInnerMsg: true,
    // toAllWin: true,
    enableInWeb: true,
    // toType: [
    //   'main',
    //   'writeMail',
    //   'readMailComb',
    //   'readMail',
    //   'strangerMails',
    //   'mail',
    // ],
    recordSample: 0,
  },
  openWritePageFromMain: {
    eventKey: 'openWritePageFromMain',
    eventName: '从非主窗口打开写信页面',
    emitter: [],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 5000,
    persist: 'memory',
    toAllAccount: true,
  },
  deleteMailById: {
    eventKey: 'deleteMailById',
    eventName: '通知主窗口删除邮件',
    emitter: [],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    persist: 'memory',
  },
  iframeTest: {
    eventKey: 'iframeTest',
    eventName: 'iframe测试消息',
    emitter: [],
    receiver: [''],
    eventType: 'iframeMsg',
    enable: true,
    persist: 'memory',
    iframeElementId: () => {
      if (!inWindow()) {
        return 'no-key';
      }
      if (locationHelper.isMainPage()) {
        return IFrameIdMap.contactEdmSyncIframe;
      }
      return parentWindowIframeTarget;
    },
  },
  loginCrossWindow: {
    eventKey: 'loginCrossWindow',
    eventName: '跨窗口发送登录信息',
    emitter: ['login'],
    receiver: [''],
    eventType: 'electronMsg',
    persist: 'memory',
    toAllWin: true,
    persistTTL: 5000,
    enable: true,
  },
  subAccountLoginExpiredCrossWindow: {
    eventKey: 'subAccountLoginExpiredCrossWindow',
    eventName: '跨窗口发送登录过期信息',
    emitter: ['login'],
    receiver: [''],
    eventType: 'electronMsg',
    persist: 'memory',
    persistTTL: 1000,
    ttl: 10000,
    enable: true,
    toAllWin: true,
    recordSample: 0,
    toAllAccount: true,
  },
  loginExpiredCrossWindow: {
    eventKey: 'loginExpiredCrossWindow',
    eventName: '跨窗口发送登录过期信息',
    emitter: ['login'],
    receiver: [''],
    eventType: 'electronMsg',
    persist: 'memory',
    persistTTL: 1000,
    ttl: 10000,
    enable: true,
    toAllWin: true,
    recordSample: 0,
  },
  toSaveDraft: {
    eventKey: 'toSaveDraft',
    eventName: '保存草稿',
    emitter: [],
    receiver: [''],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 0,
    enable: true,
  },
  toSendMail: {
    eventKey: 'toSendMail',
    eventName: '发信',
    emitter: [],
    receiver: [''],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 0,
    enable: true,
  },
  // moveMailById: {
  //   eventKey: 'moveMailById',
  //   eventName: '通知主窗口移动邮件',
  //   emitter: [],
  //   receiver: [''],
  //   eventType: 'electronMsg',
  //   enable: true,
  //   persist: 'memory',
  // },
  diskInnerCtc: {
    eventKey: 'diskInnerCtc',
    eventName: '网盘内部通讯',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
  },
  emailListChange: {
    eventName: '本地陌生人列表变化',
    eventKey: 'emailListChange',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 5000,
    persist: 'memory',
    toAllWin: true,
    asInnerMsg: true,
    enableInWeb: true,
    toType: ['main', 'writeMail', 'readMailComb', 'readMail', 'strangerMails', 'mail'],
  },
  setPriorities: {
    eventName: '设置优先级',
    eventKey: 'setPriorities',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 5000,
    persist: 'memory',
    // toAllWin: true,
    toType: ['main', 'writeMail', 'readMailComb', 'readMail', 'strangerMails', 'mail'],
    asInnerMsg: true,
    enableInWeb: true,
    recordSample: 0,
  },
  noLoginStatus: {
    eventKey: 'noLoginStatus',
    eventName: '正常退出登录状态且停留在界面内',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
  },
  sharedAccountLogout: {
    eventKey: 'sharedAccountLogout',
    eventName: '正常退出登录状态且停留在界面内',
    emitter: ['http_impl'],
    receiver: ['account_impl'],
    eventType: 'innerMsg',
    enable: true,
  },
  routeChange: {
    eventName: '通知主窗口，路由变化',
    eventKey: 'routeChange',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    persist: 'memory',
    persistTTL: 5000,
    toAllWin: true,
    asInnerMsg: true,
    enable: true,
    recordSample: 0,
    enableInWeb: true,
  },
  tabsDrop: {
    eventName: '多页签夸窗口拖拽',
    eventKey: 'tabsDrop',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    persist: 'memory',
    persistTTL: 5000,
    // toAllWin: true,
    toType: ['main', 'disk', 'resources'],
    asInnerMsg: false,
    enable: true,
  },
  tabsOperation: {
    eventName: '通知主窗口，操作页签',
    eventKey: 'tabsOperation',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    persist: 'memory',
    persistTTL: 5000,
    // toAllWin: true,
    toType: ['main'],
    asInnerMsg: false,
    enable: true,
  },
  diskNps: {
    eventName: '云文档NPS通知',
    eventKey: 'diskNps',
    emitter: [],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
  },
  mailOperation: {
    eventName: '邮件操作信息同步',
    eventKey: 'mailOperation',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 5000,
    persist: 'memory',
    // toAllWin: true,
    toType: ['main', 'writeMail', 'readMailComb', 'readMail', 'strangerMails', 'mail', 'bkStable'],
    asInnerMsg: true,
    recordSample: 0,
  },
  shouldUpdateAppChanged: {
    eventName: '展示升级版本图标',
    eventKey: 'shouldUpdateAppChanged',
    emitter: [],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
  },
  acrossWinBridge: {
    eventName: '跨窗口数据传送',
    eventKey: 'acrossWinBridge',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 5000,
    persist: 'memory',
    // toAllWin: true,
    asInnerMsg: false,
    recordSample: 0.95,
    recordLen: 3072,
  },
  imTeamEvents: {
    eventName: 'IM群组变更推送',
    eventKey: 'imTeamEvents',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 5000,
    persist: 'memory',
    // toAllWin: true,
    asInnerMsg: false,
    enableInWeb: true,
  },
  mailOperationWeb: {
    eventName: '邮件操作信息同步（Web）',
    eventKey: 'mailOperationWeb',
    emitter: [],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
    persistTTL: 5000,
    persist: 'memory',
  },
  todoChange: {
    eventName: '任务详情信息同步',
    eventKey: 'todoChange',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 5000,
    persist: 'memory',
    toAllWin: true,
    asInnerMsg: true,
    enableInWeb: true,
  },
  mailMenuOper: {
    eventName: '邮件菜单弹窗逻辑的调用（移动|举报|打印等',
    eventKey: 'mailMenuOper',
    emitter: [],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 5000,
    maxPersistNum: 1,
    enable: true,
  },
  storeChangeEvent: {
    eventName: '',
    eventKey: 'data_store_impl.ts',
    emitter: [],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 5000,
    maxPersistNum: 10,
    enable: true,
  },
  storeUserChangeEvent: {
    eventName: '',
    eventKey: 'storeUserChangeEvent',
    emitter: [],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 5000,
    maxPersistNum: 10,
    enable: true,
  },
  initAddAccountPageEvent: {
    eventName: '初始化添加账号页面数据初始化事件',
    eventKey: 'initAddAccountPageEvent',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    persist: 'memory',
    enable: true,
    maxPersistNum: 1,
    toAllAccount: true,
    persistTTL: 1000,
  },
  addAccountPageReturnEvent: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'addAccountPageReturnEvent',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    persist: 'memory',
    enable: true,
    maxPersistNum: 1,
    toAllAccount: true,
    persistTTL: 1000,
  },
  edmGlobalNotice: {
    eventKey: 'edmGlobalNotice',
    eventName: '全局通知',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  whatsAppContactsUpdate: {
    eventKey: 'whatsAppContactsUpdate',
    eventName: 'whatsApp 联系人更新',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  whatsAppMessagesUpdate: {
    eventKey: 'whatsAppMessagesUpdate',
    eventName: 'whatsApp 消息更新',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    enable: true,
  },
  whatsAppMessageStatus: {
    eventKey: 'WhatsAppMessageStatus',
    eventName: 'whatsApp 消息状态变更',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    enable: true,
  },
  whatsAppMessagesUpdateV2: {
    eventKey: 'whatsAppMessagesUpdateV2',
    eventName: 'whatsApp 消息更新',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    enable: true,
  },
  whatsAppMessageStatusV2: {
    eventKey: 'WhatsAppMessageStatusV2',
    eventName: 'whatsApp 消息状态变更',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    enable: true,
  },
  whatsAppProxyWarning: {
    eventKey: 'whatsAppProxyWarning',
    eventName: 'whatsApp IP 异常',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  facebookNewMessage: {
    eventKey: 'facebookNewMessage',
    eventName: 'facebook 新消息',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  facebookAccountExpires: {
    eventKey: 'facebookAccountExpires',
    eventName: 'facebook 账号失效',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  socialMediaNewMsg: {
    eventKey: 'socialMediaNewMsg',
    eventName: '社媒新消息',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  initBindSubAccountPageEvent: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'initBindSubAccountPageEvent',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    toAllAccount: true,
    persistTTL: 1000,
  },
  subAccountPageReturnEvent: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'subAccountPageReturnEvent',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    toAllAccount: true,
    persistTTL: 1000,
  },
  initSubAccountBgPageEvent: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'initSubAccountBgPageEvent',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    toAllAccount: true,
    persistTTL: 1000,
  },
  addSubAccountPageReturnEvent: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'addSubAccountPageReturnEvent',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    toAllAccount: true,
    persistTTL: 1000,
  },
  addSubAccountPageSendMobileCode: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'addSubAccountPageSendMobileCode',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    toAllAccount: true,
    persistTTL: 1000,
  },
  addSubAccountPageSendMobileCodeReturnEvent: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'addSubAccountPageSendMobileCodeReturnEvent',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    toAllAccount: true,
    persistTTL: 1000,
  },
  addSubAccountPageVerifyMobileCode: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'addSubAccountPageVerifyMobileCode',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    toAllAccount: true,
    persistTTL: 1000,
  },
  addSubAccountPageVerifyMobileCodeReturnEvent: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'addSubAccountPageVerifyMobileCodeReturnEvent',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    toAllAccount: true,
    persistTTL: 1000,
  },
  initAddSubAccountPageEvent: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'initAddSubAccountPageEvent',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    toAllAccount: true,
    persistTTL: 1000,
  },
  initAddPersonalSubAccountPageEvent: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'initAddPersonalSubAccountPageEvent',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    toAllAccount: true,
    persistTTL: 1000,
  },
  SubAccountDeleted: {
    eventName: '子账号删除事件',
    eventKey: 'SubAccountDeleted',
    emitter: [''],
    receiver: [''],
    eventType: DynamicEventType,
    enable: true,
    toAllAccount: true,
    toAllWin: true,
    persistTTL: 5000,
    asInnerMsg: true,
  },
  SubAccountAdded: {
    eventName: '子账号添加成功事件',
    eventKey: 'SubAccountAdded',
    emitter: [''],
    receiver: [''],
    eventType: DynamicEventType,
    enable: true,
    toAllAccount: true,
    toAllWin: true,
    persistTTL: 5000,
    asInnerMsg: true,
  },
  SubAccountWindowReady: {
    eventName: '子账号窗口ready',
    eventKey: 'SubAccountWindowReady',
    emitter: [''],
    receiver: [''],
    eventType: DynamicEventType,
    enable: true,
    toAllAccount: true,
    toAllWin: true,
    persistTTL: 3000,
    asInnerMsg: true,
  },
  SubAccountWindowClosed: {
    eventName: '子账号窗口关闭',
    eventKey: 'SubAccountWindowClosed',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    toAllWin: true,
    toAllAccount: true,
    persistTTL: 3000,
    asInnerMsg: true,
  },
  SubAccountLoginExpired: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'SubAccountLoginExpired',
    emitter: [''],
    receiver: [''],
    eventType: DynamicEventType,
    enable: true,
    toAllAccount: true,
    toAllWin: true,
    persistTTL: 3000,
    asInnerMsg: true,
  },
  SubAccountLoginPreExpired: {
    eventName: '添加账号页面数据返回事件',
    eventKey: 'SubAccountLoginPreExpired',
    emitter: [''],
    receiver: [''],
    eventType: DynamicEventType,
    enable: true,
    toAllAccount: true,
    toAllWin: true,
    persistTTL: 3000,
    asInnerMsg: true,
  },
  subAccountDBChanged: {
    eventName: '子账号DB信息变更事件',
    eventKey: 'subAccountDBChanged',
    emitter: [''],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
    toAllAccount: false,
    toAllWin: false,
    persistTTL: 3000,
  },
  regularCustomerMenuUpdate: {
    eventKey: 'regularCustomerMenuUpdate',
    eventName: 'regularCustomerMenuUpdate',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  syncSubAccountUnreadCount: {
    eventKey: 'syncSubAccountUnreadCount',
    eventName: 'syncSubAccountUnreadCount',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    toType: ['main'],
    persistTTL: 5000,
    asInnerMsg: false,
  },
  globalSearchSubscribeUpdate: {
    eventKey: 'globalSearchSubscribeUpdate',
    eventName: 'globalSearchSubscribeUpdate',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  globalSearchCheckAllAiKeywords: {
    eventKey: 'globalSearchCheckAllAiKeywords',
    eventName: 'globalSearchCheckAllAiKeywords',
    emitter: [],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'none',
    enable: true,
  },
  customDataStarUpdate: {
    eventKey: 'customDataStarUpdate',
    eventName: 'customDataStarUpdate',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  globalSearchGrubTaskAdd: {
    eventKey: 'globalSearchGrubTaskAdd',
    eventName: 'globalSearchGrubTaskAdd',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'none',
    enable: true,
  },
  globalSearchGrubTaskFinish: {
    eventKey: 'globalSearchGrubTaskFinish',
    eventName: 'globalSearchGrubTaskFinish',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'none',
    enable: true,
  },
  openMarketingDetail: {
    eventKey: 'openMarketingDetail',
    eventName: 'openMarketingDetail',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'electronMsg',
    persist: 'memory',
    enable: true,
  },
  SystemTaskNewTask: {
    eventKey: 'SystemTaskNewTask',
    eventName: '系统任务新任务',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  SystemTaskStatusUpdate: {
    eventKey: 'SystemTaskStatusUpdate',
    eventName: '系统任务状态更新',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  NoviceTaskRemind: {
    eventKey: 'NoviceTaskRemind',
    eventName: '新手任务提醒',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  NoviceTaskRegister: {
    eventKey: 'NoviceTaskRegister',
    eventName: '注册新手任务到 redux',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  NoviceTaskFinished: {
    eventKey: 'NoviceTaskRegister',
    eventName: '完成新手任务',
    emitter: [''],
    receiver: ['index.tsx'],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  changeCoreContactSyncStatus: {
    eventKey: 'changeCoreContactSyncStatus',
    eventName: 'changeCoreContactSyncStatus',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 1000,
    asInnerMsg: true,
    enableInWeb: true,
    persist: 'memory',
    toType: ['bkStable', 'main'],
  },
  coreOrgPathlistReady: {
    eventKey: 'coreOrgPathlistReady',
    eventName: 'coreOrgPathlistReady',
    emitter: [''],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
    persistTTL: 5000,
    asInnerMsg: true,
  },
  setDATrackerToken: {
    eventKey: 'setDATrackerToken',
    eventName: 'setDATrackerToken',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    persist: 'memory',
    persistTTL: 5000,
    asInnerMsg: false,
  },
  onAppLockChanged: {
    eventKey: 'onAppLockChanged',
    eventName: 'onAppLockChanged',
    emitter: [''],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
    persistTTL: 1000,
    asInnerMsg: false,
  },
  subCoreOrgContactReady: {
    eventKey: 'coreOrgPathlistReady',
    eventName: 'coreOrgPathlistReady',
    emitter: [''],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
    persistTTL: 5000,
    asInnerMsg: true,
  },
  // 邮件营销ai使用次数更新
  aiTimesUpdate: {
    eventKey: 'aiTimesUpdate',
    eventName: 'aiTimesUpdate',
    emitter: [''],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
  },
  initSendAttachmentsWritePage: {
    eventKey: 'initSendAttachmentsWritePage',
    eventName: 'initSendAttachmentsWritePage',
    emitter: [''],
    receiver: [''],
    eventType: 'electronMsg',
    enable: true,
    persist: 'memory',
    persistTTL: 1000,
    asInnerMsg: false,
  },
  sendSelectedContactIdOnContactPage: {
    eventKey: 'sendSelectedContactIdOnContactPage',
    eventName: '设置默认选中的通讯录ID',
    emitter: [''],
    receiver: [''],
    eventType: 'innerMsg',
    enable: true,
    persist: 'memory',
    persistTTL: 1000,
    asInnerMsg: false,
  },
  customNotification: {
    eventName: '桌面端全局消息通知',
    eventKey: 'customNotification',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    persist: 'memory',
    persistTTL: 5000,
    // toAllWin: true,
    toType: ['scheduleReminder', 'downloadReminder', 'advertisingReminder'],
    asInnerMsg: false,
    enable: true,
  },
  detectContactException: {
    eventName: '检测到通讯录数据异常',
    eventKey: 'detectContactException',
    emitter: [],
    receiver: [],
    toAllWin: true,
    eventType: 'electronMsg',
    persistTTL: 100,
    asInnerMsg: true,
    enable: true,
  },
  detectContactExceptionInWeb: {
    eventName: '检测到通讯录数据异常',
    eventKey: 'detectContactExceptionInWeb',
    emitter: [],
    receiver: [],
    eventType: 'innerMsg',
    persistTTL: 100,
    asInnerMsg: true,
    enable: true,
  },
  syncSubAccountState: {
    eventName: '同步子账号窗口的登录数据到主账号窗口',
    eventKey: 'syncSubAccountState',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    enable: true,
    persistTTL: 5000,
  },
  closeSchedulerReminder: {
    eventName: '关闭日历提醒消息通知',
    eventKey: 'closeSchedulerReminder',
    emitter: [],
    receiver: [],
    eventType: 'electronMsg',
    persist: 'memory',
    persistTTL: 5000,
    // toAllWin: true,
    toType: ['main'],
    asInnerMsg: false,
    enable: true,
  },
  lockScreen: {
    eventKey: 'lockScreen',
    eventName: '系统锁屏',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 0,
    enable: true,
    recordSample: 0,
  },
  unlockScreen: {
    eventKey: 'unlockScreen',
    eventName: '系统解锁',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 0,
    enable: true,
    recordSample: 0,
  },
  laptopSuspend: {
    eventKey: 'laptopSuspend',
    eventName: '电脑休眠',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 0,
    enable: true,
    recordSample: 0,
  },
  laptopResume: {
    eventKey: 'laptopResume',
    eventName: '电脑休眠恢复',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    persistTTL: 0,
    enable: true,
    recordSample: 0,
  },
  upgradeVersion: {
    eventKey: 'upgradeVersion',
    eventName: '升级版本',
    emitter: [],
    receiver: [''],
    eventType: 'electronMsg',
    persistTTL: 30000,
    enable: true,
    asInnerMsg: true,
    recordSample: 0,
    enableInWeb: true,
  },
  requireModuleGuide: {
    eventKey: 'requireModuleGuide',
    eventName: '全局使用指引Modal',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    persist: 'memory',
    enable: true,
  },
  edmPrivilegeReady: {
    eventKey: 'edmPrivilegeReady',
    eventName: 'edmPrivilegeReady',
    emitter: ['edm_role_impl'],
    receiver: ['customerMailRelatedBox.tsx'],
    eventType: 'innerMsg',
    enable: true,
  },
  toMuchOrToSlowLogger: {
    eventName: '日志打点太频繁或者太慢',
    eventKey: 'toMuchOrToSlowLogger',
    emitter: [],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
  },
  changeQuickMarktingGroup: {
    eventName: '切换营销联系人快捷营销Tab',
    eventKey: 'changeQuickMarktingGroup',
    emitter: [],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
  },
  displayMarketingModal: {
    eventKey: 'displayMarketingModal',
    eventName: '营销弹窗展示',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
  },
  whatsappSubscribeUpdate: {
    eventKey: 'whatsappSubscribeUpdate',
    eventName: 'WA一级菜单红点',
    emitter: [''],
    receiver: [],
    eventType: 'innerMsg',
    enable: true,
  },
};

export interface SystemEvent<T = any> extends SystemEventControlData {
  /**
   * 多账号场景下，可在事件监听处通过此字段判断事件来源
   */
  _account?: string;

  /**
   * 发起请求的源url pathname
   */
  _fromPage?: string;
  /**
   * 事件的字符串数据,通常作为二级key区分事件用途
   */
  eventStrData?: string;
  /**
   * 事件的传输数据
   */
  eventData?: T;
  /**
   * 该事件不记录log
   */
  noLog?: boolean;
  /**
   * 标识事件发送目标，ElectronMsg用于区分发送的目标窗口,IframeMsg用来区分发送的iframe
   */
  eventTarget?: string;
  /**
   * 自动触发事件
   * 自动触发事件当窗体不在前台时，不会发生效果
   */
  auto?: boolean;
  /**
   * 对于需要发送到其他窗口或iframe或类似组件的消息，设置是否在本窗口内也进行发送，
   * 如设置此属性，则属性将覆盖eventType类型中的同名设置
   * iframe msg 以及 electron msg 只会在目标窗口或iframe内扩散，但设置此属性为true, 将在发送的窗口内也想innerMsg一样发送给接受者
   */
  asInnerMsg?: boolean;
  /**
   * iframeId ,发送iframe消息时，设置此id可确认发送的目标iframe,
   * 如设置此属性，则属性将覆盖eventType类型中的同名设置
   */
  iframeElementId?: string;
  /**
   * 图片预览等窗口，同一张图片不宜打开多个窗口
   * 会先查找和uniqueId匹配的win.id窗口显示，没有则新建
   */
  uniqueId?: string;
  /**
   * 发送给特定类型的窗口
   */
  toType?: string[];

  toAccount?: string[];
  /**
   * 粘滞消息
   */
  isStick?: boolean;
  /**
   * 信息不发送
   */
  noPost?: boolean;
}

/**
 * 全局系统事件包装类
 */
export interface SystemEventControlData {
  /**
   * 事件的名称，名称对应事件的类型定义
   */
  eventName: SystemEventTypeNames;
  /**
   * 序列号，由框架层维护
   */
  eventSeq?: number;
  /**
   * 标识事件发送来源，由框架维护
   */
  eventFrom?: string;
  /**
   * 事件源
   */
  eventSourceId?: string;
  /**
   * 事件等级，暂无用
   */
  eventLevel?: EventLevel;
  /**
   * 事件信息，用于传递自动返回信息，由框架维护
   */
  eventMsg?: {
    feedbackFrom: string;
    msg?: string;
    code: string;
    feedbackSeq: number;
    retryTime?: number;
  };
  /**
   * 事件发生时间，由框架层维护
   */
  eventTime?: number;
  /**
   * toAllWindow类消息，会按照打开窗口数量分成若干小消息再发送，此字段记录主消息的seq
   */
  eventSubItem?: number;
  /**
   * 非业务数据的附加信息
   */
  ext?: {
    msgCenter?: {
      merge?: boolean;
      refreshType?: string;
      diff?: boolean;
    };
  };
}

export interface EventApi extends Api {
  /**
   * 注册系统事件监听器
   * @param eventName 事件类型
   * @param ob 监听器逻辑，入参为通用事件包装
   * @param _account 多账号场景需传入对应账号emailid
   * @return 返回该监听器的id ，移除监听器时使用
   */
  registerSysEventObserver(eventName: SystemEventTypeNames, ob: ObHandler): number;

  /**
   * 注销系统事件监听器
   * @param eventName 事件类型
   * @param id 监听器id
   */
  unregisterSysEventObserver(eventName: SystemEventTypeNames, id: number): void;

  /**
   * 发布系统事件，
   * @param ev 系统事件
   * @return 返回undefined 标识输入有误，未执行，否则返回Promise
   */
  sendSysEvent(ev: SystemEvent): Promise<commonMessageReturn> | undefined;

  /**
   * 简化版发送系统事件方法
   * @param eventName  事件名称
   */
  sendSimpleSysEvent(eventName: SystemEventTypeNames): Promise<commonMessageReturn> | undefined;

  /**
   * 设置web worker并开启web worker
   * @param param web worker通常用于处理事件，此处使用postMsg类型事件类型定义web worker,参考{@link SystemEventTypeDef}
   * @param name
   * @return web worker的标识id，关闭web worker时使用
   */
  setupWebWorker(param: SystemEventTypeDef, name?: string): number;

  /**
   * 关闭 web worker
   * @param id 设置web worker时返回的id
   */
  terminateWebWorker(id: number): void;

  /**
   * 使用post接口发送信息给 iframe或者popup window，或者electron内的其他组件及进程
   * @param ev 信息定义
   */
  postMessage(ev: SystemEvent): Promise<string>;

  /**
   * 确认执行事件，用于控制系统中同时在作用的event数目，调用sendEvent进入系统的事件在被注册的回调函数处理前会反馈
   * @param ev
   */
  confirmEvent(ev: SystemEvent): void;

  /**
   * 针对持久化消息，调用此接口可以从队列中将缓存的数据发送给接受者
   * @param eventName
   * @param num
   */
  dumpMessageFromQueue(eventName: SystemEventTypeNames, num?: number): void;

  /**
   * 通过name获取已经注册的Observer对象
   * @param eventName
   * @param obName
   */
  getObserverByName(eventName: SystemEventTypeNames, obName: string): ObObject | undefined;

  // doReportMessage(error: {}): void;
}
