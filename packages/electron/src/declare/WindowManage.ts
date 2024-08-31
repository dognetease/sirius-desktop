import { BrowserView, BrowserWindow, BrowserWindowConstructorOptions, OpenDialogOptions } from 'electron';
import { WinType } from 'env_def';
import { FsSaveDialogOptions, FsSaveRes, FsSelectRes } from './FsManage';

export interface WinIdMap {
  [props: number]: WinInfo;
}

export interface BrowserViewIdMap {
  [props: number | string]: BrowserView | null;
}

export interface ICreateBrowserViewParam {
  winId: number;
  req: CreateWindowReq;
}

export interface IRemoveBrowserViewParam {
  winId: number;
  viewId: number;
}

/**
 * 窗口返回数据类型，对外返回的数据结构
 */
export interface ResponseWinInfo {
  /**
   * 窗口id,来源于BrowserWindow.id
   */
  id: number;
  /**
   * 窗口类型
   */
  type: WinType;
  /**
   * webContent id，来源于BrowserWindow.webContents.id
   */
  webId: number;
  /**
   * 是否主窗口
   */
  isMain?: boolean;
  /**
   * 父级窗口id，主窗口无父窗口为-1
   */
  parent: number;
  /**
   * 子窗口id列表
   */
  children: number[];
  /**
   * 是否当前聚焦窗口
   */
  isFocused: boolean;
  /**
   * 是否可见
   */
  isVisible: boolean;
  /**
   * 是否全屏
   */
  isFullScreen: boolean;
  /**
   * 监控窗口状态的定义
   */
  hooks: WindowHooksObserverConf[];

  isMaximized: boolean;

  sessionName: string;
}

export type HookAndInterceptorObj = {
  hooks: Map<number, WindowHooksObserverConf>;
  interceptors?: WindowHooksObserverConf;
};

/**
 * 窗口数据对象，应仅在主进程中维护，非对外暴露对象
 */
export interface WinInfo extends SimpleWinInfo {
  /**
   * 控制标识位，强制退出时设置
   */
  isQuit?: boolean;
  /**
   * 实际窗体对象
   */
  win: BrowserWindow;
  /**
   * 监听器或拦截器，监听器不影响窗口行为，拦截器会组织当前的行为发生，拦截器仅允许设置一个，允许任意窗口添加任意窗口的监听器
   */
  hooks: Map<WindowHooksName, HookAndInterceptorObj>;

  sessionName?: string;

  // sendTo: SendToWindow,
  // type:WinType
}

/**
 * 窗口数据对象，应仅在主进程中维护，非对外暴露对象
 */
export interface SimpleWinInfo {
  /**
   * 窗口id,来源于BrowserWindow.id
   */
  id: number;
  /**
   * 窗口类型
   */
  type: WinType;
  /**
   * webContent id，来源于BrowserWindow.webContents.id
   */
  webId: number;
  /**
   * 是否主窗口
   */
  isMain?: boolean;
  /**
   * 父级窗口id，主窗口无父窗口为-1
   */
  parent: number;
  /**
   * 子窗口id列表
   */
  children: number[];
}

export interface WinCloseParams {
  /**
   * 关闭的窗口的winId
   */
  winId?: number;
  /**
   * 不处理拦截器
   */
  force?: boolean;
  /**
   * 强制退出（需同时设置不处理拦截器）
   */
  quit?: boolean;
}

// | 'asyncApi';
export type WinTypeDef = {
  /**
   * 窗口内容的url，为sirius:// 协议
   */
  url: string;
  /**
   * 开发启动时使用weburl加载该窗口内容
   */
  webUrl: string;
  /**
   * 如果出现报错，则适用此url重新创建窗口，应对electron ERR_ABORTED (-3) 错误异常
   */
  failUrl?: string;
  failWebUrl?: string;
  /**
   *
   */
  preload?: boolean;
  /**
   * 创建该类型窗口时的默认配置
   */
  option?: BrowserWindowConstructorOptions;
  /**
   * true标识该窗口为单例窗口，全应用仅存在一个，关闭时仅做隐藏，不存在时创建，存在时仅从隐藏变为展示
   */
  singleInstance?: boolean;
  /**
   * 添加主窗口的所有cookie
   */
  setMainWindowCookie?: boolean;
  /**
   * 添加主窗口的所有LocalStorage(暂未实现)
   */
  setMainLocalStorage?: boolean;
  /**
   * 该类型窗口提前启动的窗口数目，此数值不为0则表示会有一定数量的此类型窗口关闭时隐藏，以便于下次创建该类型窗口时复用
   */
  prepareCount?: number;
  /**
   * 该类型窗口个数超过此数值后，关闭窗口将销毁该窗口，不会隐藏以备复用
   */
  maxPreparedCount?: number;
  /**
   * 该类型窗口已经被启动，可供复用的窗口数组
   */
  preparedWindow?: WinInfo[];
  /**
   * 该类型窗口当前存在未被销毁的总数
   */
  allWindowCount?: number;

  /**
   * 是否自动提前预备窗口
   */
  autoPrepare?: number;
  /**
   *
   */
  sessions?: string;

  // 上次创建的过期时间
  lastCreateOutDateTime?: number;

  minHeight?: number;
};
export type WinTypeMap = {
  [key in WinType]: WinTypeDef;
};

export type WinInterceptorOrHookMap = {
  [key in WindowHooksName]: WindowHooksObserverConf[];
};

export type OnActiveFunc = (winId: number, data?: any, extData?: {}) => void;

export interface WindowHooksCallback {
  onAfterLoad?: OnActiveFunc;
  onBeforeClose?: OnActiveFunc;
  onAfterClose?: OnActiveFunc;
  onShow?: OnActiveFunc;
  onHide?: OnActiveFunc;
  onActive?: OnActiveFunc;
  onBlur?: OnActiveFunc;
  onResize?: OnActiveFunc;
  onOpenExternalUrl?: OnActiveFunc;
  onLockScreen?: OnActiveFunc;
  onUnlockScreen?: OnActiveFunc;
  // 电脑休眠
  onLaptopSuspend?: OnActiveFunc;
  // 休眠恢复
  onLaptopResume?: OnActiveFunc;
}

export type WindowHooksName = keyof WindowHooksCallback;

/**
 * 窗口监听器及拦截器定义
 */
export type WindowHooksObserverConf = {
  /**
   * 拦截器名称，intercept =true是必须设置，暂无逻辑意义，用于调试时确认拦截器位置
   */
  hookObjName?: string;
  /**
   * 监控的窗口id,此窗口在目标窗口触发规定事件时可以接收到信息
   */
  observerWinId: number;
  /**
   * 被监控的目标窗口id,此窗口触发事件，会通知关注的窗口
   */
  targetWinId?: number;
  /**
   * 事件名称
   */
  hooksName: WindowHooksName;
  /**
   * 发送事件数据时，额外携带的参数，会在extData中随事件数据一起返回
   */
  hooksEventExtraData?: {};
  /**
   * 是否启动此监听，由主程序窗口管理逻辑控制，入参无需设置
   */
  enable?: boolean;
  /**
   * 是否拦截应用行为，设置为true则会拦截默认行为，并触发事件，
   * 需要接受到事件的业务逻辑自行再次触发事件，拦截逻辑只可以在同窗口内触发，且单一时间全局仅有一个拦截器，
   * 监听拦截器的业务逻辑可以有多处，各处可以自己进行判定并执行后续操作
   */
  intercept?: boolean;
};

export interface WindowHooksEventData {
  winId: number;
  hooksName: WindowHooksName;
  data?: any;
  extData?: {};
}

// export interface WindowInterceptorData {
//   hooksName: WindowHooksName,
//   hooksEventExtraData: {}
// }

export type SendToWindow = 'parent' | 'current';

export interface CreateWindowReq {
  /**
   * 窗口类型，预定义在 WinType {@link WinType}
   */
  type: WinType;
  // sendTo?: SendToWindow,
  parent?: number;
  /**
   * 创建 electron 内嵌浏览器时使用此url加载外部页面
   */
  url?: string;
  setMainWindowCookie?: boolean;
  specifyCookieDomain?: string;
  setMainLocalStorage?: boolean;
  forPrepare?: boolean;
  hooks?: WindowHooksObserverConf[];
  /**
   * 创建窗口后不自动展示，处于隐藏状态
   */
  manualShow?: boolean;
  additionalParams?: Record<string, string>;
  /**
   * 传入非空值，则创建非默认session的窗口，用以同时处理多用户
   */
  sessionName?: string;
  // interceptor?: WinInterceptorOrHookMap
  haveJquery?: boolean;

  bounds?: Electron.Rectangle;
}

export interface CreateWindowRes {
  success: boolean;
  message?: Error;
  winId?: number;
  webId?: number;
}

export interface ExchangeData {
  id?: number;
  data?: any;
}

export interface WindowEventData {
  webId: number;
  eventName: string;
  data?: any;
}

export type WindowEventListener = (res: WindowEventData) => Promise<any>;
export type ExchangeDataListener = (res: WindowEventData) => any | Promise<any>;
export type OpenFileListener = (files: { type: 'send' | 'open'; paths: Array<string> }) => any | Promise<any>;
export type WindowEventReceive = (res: WindowEventData) => Promise<WindowEventData>;
export type LocalStorageType = 'appcache' | 'cookies' | 'filesystem' | 'indexdb' | 'localstorage' | 'shadercache' | 'websql' | 'serviceworkers' | 'cachestorage';

/**
 * 内部调用模型，不对外暴露
 */
export interface CommonWinRequestParam {
  winId: number;
  funcName: string;
  hookParam?: WindowHooksObserverConf[];
  closeParam?: WinCloseParams;
  createParam?: CreateWindowReq;
  data?: string;
  clearStorageParam?: {
    type?: LocalStorageType;
  };
  dailogParam?: {
    select?: OpenDialogOptions;
    save?: FsSaveDialogOptions;
  };
}

export interface WindowHooksParams {
  observeWinId?: number;
  hooks: WindowHooksName[];
  // sendTo: SendToWindow
}

/**
 * 窗口管理接口
 * 主进程，render进程都需实现的接口
 */
export interface WindowManage {
  /** 获取全部窗口信息* */
  getAllWinInfo(): Promise<ResponseWinInfo[]>;

  /**
   * 关闭除主窗口外全部窗口
   * @param force 是否强制关闭
   */
  closeAllWindowExceptMain(force?: boolean): Promise<void>;

  /**
   * 预加载各类需要的窗口，需配置prepareCount>0
   */
  prepareAllWindow(): Promise<void>;

  /** 清除数据* */
  clearLocalData(type?: LocalStorageType): Promise<void>;

  /** 测试主窗口是否存活* */
  testMainWindowAlive(): Promise<boolean>;

  /** 通过默认浏览器打开地址* */
  openWindow(url: string): Promise<boolean>;

  /**
   * 打开外部链接
   * @param url
   */
  openExternalUrl(url: string): Promise<void>;

  prepareWindow(type: WinType): Promise<void>;

  createBrowserView(createParam: ICreateBrowserViewParam): Promise<{ viewId: number }>;

  removeBrowserView(removeParam: IRemoveBrowserViewParam): Promise<void>;

  // 持久化所有session的内容
  flushAllSession(): void;
}

/**
 * 窗口管理接口
 * 仅主进程需实现
 */
export interface WindowManageHandle {
  dispatch(params: CommonWinRequestParam): Promise<any>;
}

/**
 * 窗口管理接口
 * 仅render进程需实现
 */
export interface WindowManageRenderer {
  /** 设置窗口回调* */
  setHooksConfig(params: WindowHooksObserverConf[]): Promise<void>;

  /** 窗口闪烁* */
  flashFrame(winId?: number): Promise<boolean | undefined>;

  /** 窗口从不可看，最小化，不聚焦 到展示，聚焦* */
  show(winId?: number): Promise<boolean | undefined>;

  /** 窗口隐藏* */
  hide(winId?: number): Promise<boolean | undefined>;

  /** 退出窗口* */
  close(params?: WinCloseParams): Promise<boolean | undefined>;

  /** 窗口最小化* */
  minimize(winId?: number): Promise<boolean | undefined>;

  /** 触发网页内部视图刷新机制,调用此方法将会触发一个重绘事件 * */
  invalidate(winId?: number): Promise<boolean | undefined>;

  /** 窗口最大化* */
  maximize(winId?: number): Promise<boolean | undefined>;

  /** 退出最大化* */
  unmaximize(winId?: number): Promise<boolean | undefined>;

  /** 切换最大化* */
  toggleMaximize(winId?: number): Promise<boolean | undefined>;

  /** 切换全屏* */
  toggleFullScreen(winId?: number): Promise<boolean | undefined>;

  /** 将最小化的窗口恢复为之前的状态* */
  restore(winId?: number): Promise<boolean | undefined>;

  /** 开启或者关闭开发者模式* */
  toggleDevTools(winId?: number): Promise<boolean | undefined>;

  /** 重新加载界面* */
  reload(winId?: number): Promise<boolean | undefined>;

  /** 是否全屏* */
  isFullScreen(): Promise<boolean | undefined>;

  /** 是否聚焦* */
  isFocused(): Promise<boolean | undefined>;

  /** 窗口是否在展示中* */
  isVisible(winId?: number): Promise<boolean | undefined>;

  /**
   *  选择文件夹并返回地址
   * @param config 选择的配置
   */
  select(config: OpenDialogOptions): Promise<FsSelectRes>;

  /**
   *  选择文件夹确定文件位置并返回地址
   * @param config 保存的配置
   */
  saveDialog(config: FsSaveDialogOptions): Promise<FsSaveRes>;

  /**
   * 暂无用，类似close
   * @param params
   */
  hideForClose(params: WinCloseParams): void;

  /** 按id获取窗口信息* */
  getWinInfo(winId: number): Promise<ResponseWinInfo | undefined>;

  getCurWindow(): Promise<ResponseWinInfo | undefined>;

  /**
   * 设置窗口标题
   * @param title
   */
  setTitle(title: string): void;

  /**
   * 设置窗口尺寸
   * @param width height 只支持整数
   */
  setSize(data: { width: number; height: number }): Promise<void>;

  /**
   * 设置窗口位置
   * @param x y 中心点 只支持整数
   */
  setPosition(data: { x: number; y: number }): Promise<void>;

  /**
   * 重置窗口，并且移动窗口到指定的位置
   */
  setBounds(bounds: Electron.Rectangle): Promise<void>;

  /**
   * 添加数据监听逻辑
   * @param listener
   */
  addExchangeDataListener(listener: ExchangeDataListener): void;

  /**
   * 添加文件打开监听逻辑
   */
  addOpenFileListener(listener: OpenFileListener): void;

  /**
   * 添加hook事件处理器，仅对api暴露，且保障窗口创建后只调用一次
   * @param callbacks
   */
  addHooksListener(callbacks: WindowHooksCallback): void;

  /**
   * 交换数据
   * @param req
   */
  exchangeData(req: ExchangeData): Promise<void>;

  /** 创建窗口* */
  createWindow(config: CreateWindowReq): Promise<CreateWindowRes>;

  /** 将cookie复用到其他host* */
  setCookieToSpecificDomain(url: string): Promise<string>;

  // getCurrentWindow(): Promise<SimpleWinInfo | undefined>;

  // 获取主屏信息
  getPrimaryScreen(): Promise<Electron.Display>;

  getWinBounds(winId?: number): Promise<Electron.Rectangle | undefined>;

  // 持久化所有session的内容
  flushAllSession(): void;

  setMainWindowZoomFactor(val: number): Promise<void>;
}

export type WindowManageType = keyof WindowManage;
export type WindowManageHandleType = keyof WindowManageHandle | 'dispatch';
export type WindowManageFunctionName = WindowManageHandleType | WindowManageType | 'dispatch';
