// system.ts
/**
 * 系统通用功能定义
 * 包括
 * -查询当前登录用户，
 * -加密解密数据（使用本地存储的随机秘钥），
 * -md5数据
 * -获取当前系统的服务器节点
 * -获取与当前服务器节点匹配的请求url
 * -生成随机字符串
 * -判断运行环境，是否在electron内，是否在webworker内
 * -创建窗口，关闭窗口
 * -全局定时器管理
 * -免登录跳转支持
 */
/**
 * 基础api导入
 */
import { ClipboardInterface, CreateWindowReq, CreateWindowRes, OnActiveFunc, ResponseWinInfo, WindowHooksName, WindowHooksObserverConf, WinType } from 'env_def';
import { Moment } from 'moment';
import { anonymousFunction, Api, commonMessageReturn, PopUpMessageInfo, Properties, User } from '../_base/api';

/**
 * url相关配置导入
 */
import { SYSTEM_PROXY_TYPE, URLKey } from '@/config';
import { SystemEvent } from '../data/event';
import { StringMap } from '../commonModel';
import type { Lang } from '../../utils/global_label/index';
// import { SimpleWinInfo } from 'sirius-desktop/src/declare/WindowManage';
// import {SystemEvent, SystemEventTypeDef, SystemEventTypeNames} from "./event";
export type IntervalEventPeriod = 'long' | 'short' | 'mid' | 'extLong';
export type EventHandler = (handler: IntervalEventParams) => void;
export type IntervalEventParams = {
  /** eventPeroid 事件周期，short 为 1s, long 为 90s , mid 为 10s* */
  eventPeriod: IntervalEventPeriod;
  /** id 执行器处理函数的唯一标识 ,逻辑上用于去重* */
  id?: string;
  /** handler 执行器函数,执行器被调用时，可以拿到自己的id（确认任务结束可以调用cancelEvent移除）* */
  handler: EventHandler;
  /**
   * 处理函数的id
   */
  _id?: number;
  /**
   * 重复调用次数，从1开始，最大 1000 0000，然后回到0
   */
  seq: number;
  /**
   * 不需要用户登录
   */
  noUserAuth?: boolean;
};
export type NotificationPerm = 'denied' | 'granted' | 'default' | 'unavailable';

export interface DeviceInfo {
  p?: string;
  _deviceId: string;
  _device: string;
  _systemVersion: string;
  _system: string;
  _manufacturer: string;
  _deviceName: string;
  _appName?: string;
  _version?: string;
}

export interface AccountAttrs {
  field: string;
  value: string;
}
export type CurrentModuleType = 'schedule' | 'message' | 'contact' | 'disk' | 'setting' | 'mailbox' | 'other';

/**
 * 浏览器版本信息
 */
export interface BrowserInfo {
  name: string;
  version: string;
}

/**
 * electron中打开链接的配置
 */
export type UrlHandleConfig = {
  handleUrl?: (url: string, urlHandler?: UrlHandleConfig) => string;
  /**
   * 在electron中打开该链接
   */
  openInElectron?: boolean;
  /**
   * 忽略转换api调用，当不在electron环境时
   */
  ignoreApiCallWhenNotInElectron?: boolean;
  // /**
  //  * 使用自定义窗口打开链接
  //  */
  // openInElectronUsingCustomerUrl?:boolean,
  /**
   * 调用 redirect service api 获取新的url
   */
  needTransferUseApi?: boolean;
  /**
   * 需要上传账户信息
   */
  needUploadAccountInfo?: boolean;
  /**
   * 解析url获取的数据，或用户自定义的数据，如打开electron窗口可通过消息系统传递
   */
  data?: SystemEvent;
  /**
   * 打开内部页面,此项设置为true，会检测url是否匹配内部页面的模式，如匹配将打开内部页面
   */
  openInternalPage?: boolean;

  originUrl?: string;
};
/**
 * 可使用的通知用户手段
 */
export type NotificationNumType = 'macDocker' | 'macTray' | 'macDockerBounce' | 'windowsFlush' | 'windowsTrayDisplayBalloon' | 'browserTitle' | 'appFunctionIcon';
export type NotificationContent = {
  // num: number,
  type: NotificationNumType | NotificationNumType[];
  content?: PopUpMessageInfo;
};

export interface TimeZoneItem {
  key: number;
  value: string;
}

export interface WindowInfo {
  win: CreateWindowRes;
  type: WinType;
  initData: any;
}

/**
 * 系统级API
 */
export interface SystemApi extends Api {
  readonly notificationAvailableLabel: number;
  readonly currentShowedNotification: number;
  contextPath: string;
  isMsiBuild: boolean;

  /**
   * 是否是第一次加载
   */
  isFirstInit(bool?: boolean): boolean;
  /**
   * 处理账号中的名称和域名信息，
   * @param account 要处理的账号，通常为 xxx@xxx.com的格式
   * @return {@link Properties} 样例：
   * ```{"account": "shisheng", "domain": "qy.163.com"}```
   */
  handleAccountAndDomain(account: string): Properties;

  /**
   * 获取当前登录用户，返回undefined或null表明无当前登录用户
   */
  getCurrentUser(email?: string): User | undefined;

  /**
   * 获取当前用户的全部别名邮箱
   */
  getCurrentUserAccountAlias(email?: string): string[];

  /**
   * 获取当前登录用户的mailMode
   */
  getCurrentUserMailMode(): string;

  /**
   * 获取当前登录用户是否是corpMailMode
   */
  getIsCorpMailMode(_account?: string): boolean;

  getIsMainAccount(email?: string): boolean;

  /**
   * 打开新窗口，
   * @param url 新窗口地址
   * @param openInElectron 是否使用electron弹窗弹出，仅electron内该参数有效
   * @param callbacks 使用electron弹窗弹出的各类回调
   */
  openNewWindow(url: string, openInElectron?: boolean, callbacks?: WindowHooksObserverConf[], initData?: SystemEvent, haveJquery?: boolean): commonMessageReturn;

  /**
   * web下载资源
   * @param url 新窗口地址
   */
  webDownloadLink(url: string, fileName?: string): void;

  // timeoutEvent(ms: number, id: string): Promise<any>;
  //
  /**
   * 注册定时器处理函数 ，全局仅需要存在三个定时器，其余定时任务需注册到这三个定时器内执行
   * @param ev 事件处理参数
   *
   */
  intervalEvent(ev: IntervalEventParams): number | undefined;

  /**
   * 删除定时器处理函数，全部函数删除后，会删除定时器
   * @param peroid
   * @param id 注册处理函数时提供的id
   * @param disable
   */
  cancelEvent(peroid: IntervalEventPeriod, id: number | string, disable?: boolean): boolean;

  /**
   * 加密信息
   * @param content
   */
  encryptMsg(content: string): Promise<string>;

  /**
   * 解密信息
   * @param content
   */
  decryptMsg(content: string): Promise<string>;

  /**
   * 使用md5算法将数据处理成hex的格式
   * @param content 需要md5的字符串
   * @param short true则使用 base64编码，减少长度
   */
  md5(content: string, short?: boolean): string;

  /**
   * 使用sha1算法获取数据的散列值
   * @param content 需要sha1的字符串
   * @param isBase64Type 返回的字符串格式是否是base64格式
   */
  sha1(content: string, isBase64Type?: boolean): string;

  /**
   * 生成随机字符串
   * @param len  字符串长度
   */
  generateKey(len: number): string;

  /**
   * 是否在electron环境
   */
  isElectron(): boolean;

  /**
   * 是否在主窗口
   */
  isMainWindow(): boolean;

  /**
   * 是否是移动端
   */
  isInMobile(): boolean;

  /**
   * 是否是主页面
   */
  isMainPage(): boolean;

  /**
   * 系统入口是否为web-entry-wm
   */
  isWebWmEntry(): boolean;

  /**
   * 系统入口是否为web-entry-ff
   */
  isWebFfEntry(): boolean;

  /**
   * 获取当前预登录得到的系统环境
   */
  getCurrentNode(email?: string): string;

  /**
   * 获取访问接口的url
   */
  getUrl(url: URLKey, currentNode?: string, splitReq?: boolean, _account?: string): string;

  /**
   * 判断脚本运行环境是否在web worker中
   */
  isInWebWorker(): boolean;

  /**
   * 判断当前环境是否可联网
   */
  isNetworkAvailable(): boolean;

  /**
   * 获取当前网络联网指数，0标识良好，0-4表示有部分请求错误，5-10表示部分断网，>999标识断网
   */
  getNetworkFailIndex(): number;

  /**
   * 播放系统提示音
   */
  playSystemAudio(): void;

  /**
   * 展示通知
   * @param info 通知内容
   */
  showSysNotification(info: PopUpMessageInfo): Promise<boolean>;

  /**
   * 通知是否被允许
   */
  isSysNotificationAvailable(): NotificationPerm;

  /**
   * 申请允许通知
   */
  requestSysNotificationPerm(): Promise<boolean>;

  /**
   * 更新app提示信息,包括更新角标，标题 ，图标数据值 等
   */
  updateAppNotification(content: NotificationContent): void;

  /**
   * 设置用户属性
   * @param key
   * @param value
   * @param store
   */
  setUserProp(key: string, value: string, store?: boolean): void;

  /**
   * @deprecated 功能被{@link DataStoreApi.setLastAccount} 取代
   * @param ev
   */
  watchLogin(ev: SystemEvent): void;

  /**
   * @deprecated 功能被{@link DataStoreApi.setCurrentNode}取代
   * @param ev
   */
  watchPreLogin(ev: SystemEvent): void;

  /**
   * 关闭当前窗口，electron中有效
   * @param needIntercept 是否需要出发onClose回调
   * @param forceClose 强制关闭
   */
  closeWindow(needIntercept?: boolean, forceClose?: boolean): void;

  /**
   * 关闭其他窗口
   * @param winId 要关闭的窗口id
   * @param needIntercept 是否需要执行onClose逻辑，传入true会执行自定义拦截逻辑
   * @param forceClose 确定必须关闭窗口
   */
  closeSubWindow(winId: number, needIntercept?: boolean, forceClose?: boolean): void;

  /**
   * 获取当前窗口的信息
   */
  getCurrentWinInfo(noStatus?: boolean): Promise<ResponseWinInfo>;

  /**
   * 获取当前窗口所在模块
   */
  getCurrentModule(): CurrentModuleType;

  doGetCookies(refresh?: boolean, _account?: string): Promise<StringMap>;

  /**
   * 清理认证cookie
   * @param reserveMsgCodeCookie
   * @param shouldDeleteAllCookies 是否需要删除所有cookie
   */
  clearUserAuthCookie(reserveMsgCodeCookie?: boolean, shouldDeleteAllCookies?: boolean): void;

  getStartTimeSpan(): number;

  getDeviceInfo(): Promise<DeviceInfo>;

  /**
   * 创建新窗口，electron中有效
   * @param type
   */
  createWindow(type: WinType | CreateWindowReq): Promise<CreateWindowRes>;

  /**
   * 使用初始数据创建窗口，
   * @param type 窗口类型或状态所需信息
   * @param data 创建窗口后传入的参数
   */

  createWindowWithInitData(type: WinType | CreateWindowReq, data: SystemEvent): Promise<CreateWindowRes>;

  /**
   * 处理跳转url，将外部链接变为可自动登录的url,并执行跳转，会调用 {@link buildJumpUrl}
   * @param winid 保留参数，暂无效
   * @param url 跳转目的地url
   * @param customerHandler 自定义链接处理函数
   */
  handleJumpUrl(winid: number, url: any, customerHandler?: UrlHandleConfig): void;

  /**
   * 使用指定key解密数据
   * @param content
   * @param key
   * @param useFormat
   */
  decryptByKey(content: string, key: string, useFormat?: boolean): string;

  /**
   * AES ECB模式加密
   * @param content
   * @param key
   */
  encryptByECB(content: string, key: string): string;

  /**
   * AES ECB模式解密
   * @param content
   * @param key
   */
  decryptByECB(content: string, key: string): string;

  /**
   * 使用指定key加密数据
   * @param content
   * @param key
   * @param useFormat
   */
  encryptByKey(content: string, key: string, useFormat?: boolean): string;

  /**
   * 处理跳转url，
   * @param url 要跳转的目标url
   * @param customerHandler 自定义处理参数
   * @return 得到的结构中包含url为跳转地址，succ为true,表示成功进行转换，false时，返回url与入参相同
   */
  buildJumpUrl(url: any, customerHandler?: UrlHandleConfig): Promise<{ url: string; succ: boolean; h?: UrlHandleConfig }>;

  getBrowserInfo(): BrowserInfo;

  // @deprecated
  hideWindow(needIntercept?: boolean): void;

  /**
   * 获取electron内部的clipboard支持
   */
  getNativeClipBoard(): ClipboardInterface | undefined;

  /**
   *
   * @param m  rsa 的module
   * @param e  rsa 的
   * @param rand 随机数据
   * @param con  加密内容
   */
  rsaEncrypt(m: string, e: string, rand: string, con: string): string;

  getAutoLaunch(): Promise<boolean>;

  setAutoLaunch(val: boolean): Promise<void>;

  /**
   * 获取所有窗口数据，包括隐藏窗口
   * @param type
   */
  getAllWindow(type?: WinType): Promise<ResponseWinInfo[]>;
  /**
   * 展示主窗口
   */
  showMainWindow(): void;
  /**
   * 提供账户密码，获取本地的自动登录token
   * @param account 账号
   * @param pass 密码
   */
  getLocalLoginToken(account: string, pass: string): Promise<string>;

  /**
   * 添加窗口事件回调监听
   * @param type
   * @param callback
   * @param targetWinId
   */
  addWindowHooks(type: WindowHooksName, callback: OnActiveFunc, targetWinId?: number, intercept?: boolean): Promise<number>;

  addWindowHookConf(conf: WindowHooksObserverConf | WindowHooksObserverConf[]): Promise<void>;

  navigateToSchedule(frameNavCallback?: anonymousFunction): Promise<CreateWindowRes | boolean>;

  switchLoading(bool: boolean): void;

  switchAppLoading(bool: boolean): void;

  inWebMail(): boolean;

  invalidate(): void;

  showWin(winid?: number): Promise<void>;

  hideWin(winid?: number): Promise<void>;

  prepareWindow(type: WinType): Promise<void>;

  isStartWindow(): boolean;

  isTransferringData(): boolean;

  isBkLoginInit(): boolean;

  isBkStableWindow(): boolean;

  getProxyOn(): boolean;

  setProxyOn(on: boolean): Promise<boolean>;

  getIsDomesticHostType(): boolean;

  getCurrentHostType(): string;

  setCurrentHostType(hostType: 'domestic' | 'smartDNSHost'): void;

  reLaunchApp(): void;

  getIsAddAccountPage(): boolean;

  jumpToWebHostLogin(): void;

  setCurrentSessionName(sessionName: string): void;

  getCurrentSessionName(_account?: string): string | null;

  decodeSessionName(_session: string): { mainEmail: string; subEmail: string } | null;

  getFolderSize(folderPath: string): Promise<number | undefined>;

  inEdm(): boolean;

  getScreenCapture(data: { from?: string; hideCur?: '0' | '1' }): void;

  setScreenCaptureAccess(): void;

  setScreenCaptureShortcut(data: { newShortcut?: string; oldShortcut?: string }): void;

  getIsAddSubAccountPage(): boolean;

  getIsSubAccountPage(): boolean;

  getIsSubAccountInitPage(): boolean;

  getIsAddPersonalSubAccountPage(): boolean;

  getUrlSearchValue(key: string): string | null;

  getMainAccount(email?: string): { email: string };

  getMainAccount1(): { email: string };

  getCurrentSubAccount(): { email: string };

  getCurrentAgentAccount(): { email: string };

  getSessionNameOfSubAccount(subAccountEmail: string): string;

  getIsLowMemoryMode(): Promise<boolean>;

  setIsLowMemoryMode(value: boolean): Promise<void>;

  getIsLowMemoryModeSync(): boolean;

  inElectronBuild(): boolean;

  inWebBuild(): boolean;

  inLingXiBuild(): boolean;

  getActiveUserTrackParams(isShareAccount?: boolean): Promise<object>;

  getIsWebCustomHost(): boolean;

  getCurrentCompanyId(email?: string): number;

  timeZoneTrans(timeStr: string, fromTimeZone: number | string, toTimeZone: number | string): Moment | null;

  getSystemProxyTypeSync(): SYSTEM_PROXY_TYPE;

  setSystemProxyType(value: string): Promise<void>;

  getContextPath(): string;

  /**
   * 根据时区参数生成新时区时间
   * @param originDate 时间戳/原始时间格式
   * @param timeDiff 时差与get:attrs 接口返回结果（-12 ~ +12 分别代表 GMT-12:00 ~ GMT+12:00）一致
   */
  getDateByTimeZone(originDate: number | string | Date, timeDiff: number, isMailDate?: boolean): number;

  getSystemTimeZone(): TimeZoneItem | undefined;

  getTimeZoneList(): TimeZoneItem[];

  /**
   * 接口文档 https://lingxi.office.163.com/doc/#id=19000006284564&from=PERSONAL&parentResourceId=19000000622996&spaceId=505014219&ref=515611056
   * 用户配置，可以传入多个k/v对
   * @param keys string
   */
  getUserConfig(keys: string[]): Promise<AccountAttrs[]>;

  /**
   * 接口文档 https://lingxi.office.163.com/doc/#id=19000006284564&from=PERSONAL&parentResourceId=19000000622996&spaceId=505014219&ref=515611056
   * 设置用户配置
   * @param attrs AccountAttrs
   */
  setUserConfig(attrs: AccountAttrs[]): Promise<boolean>;

  getSystemLang(): Lang;

  setSystemLang(val: Lang): boolean;

  getIsLockApp(): boolean;

  lockApp(): boolean;

  unLockApp(): boolean;

  getIsAutoLaunchToTray(): Promise<boolean>;

  setIsAutoLaunchToTray(val: boolean): Promise<{ success: boolean; errorMsg?: string }>;

  getPageZoomValue(): Promise<number>;

  setPageZoomValue(val: number): Promise<boolean>;

  // 获取action
  getActions(params: { _account?: string; actions: any; subActions?: any }): { suc: boolean; account?: string; val: any | null; msg?: string };

  getIsThirdSubAccountByEmailId(emailId: string): boolean;

  getAccountUrl(url: URLKey, account?: string): string;

  reloadToMainPage(): void;

  getWebMailLangStr(): string;

  openWaimaoUrlWithLoginInfo(url: string): Promise<void>;
}
