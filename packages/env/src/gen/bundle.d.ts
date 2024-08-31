import { DownloadManage as DownloadManage$1 } from 'src/declare/downloadManage';
import { UpdateCheckResult } from 'electron-updater';
import { AppAutoUpdater } from 'src/main/appUpdate';
import { Display, desktopCapturer, ProcessMetric, PrintToPDFOptions, IpcMainInvokeEvent, CrashReport, SaveDialogOptions, OpenDialogOptions, Rectangle } from 'electron';
import { WinType } from 'env_def';
import { WriteStream, Stats } from 'fs';
import { WriteFileOptions } from 'fs-extra';
import { SimpleParserOptions, ParsedMail } from 'mailparser';

declare type AppManageType = keyof AppManage | keyof AppAutoUpdater;
declare type PathTypeName = 'home' | 'appData' | 'userData' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps';
declare type SystemStatus = 'suspend' | 'resume';
interface IFolderSizeResult {
    size: number;
    dir?: string;
}
interface CookieStore {
    /**
     * set cookie need url
     */
    url?: string;
    /**
     * The domain of the cookie; this will be normalized with a preceding dot so that
     * it's also valid for subdomains.
     */
    domain?: string;
    /**
     * The expiration date of the cookie as the number of seconds since the UNIX epoch.
     * Not provided for session cookies.
     */
    expirationDate?: number;
    expirationStr?: string;
    /**
     * Whether the cookie is a host-only cookie; this will only be `true` if no domain
     * was passed.
     */
    hostOnly?: boolean;
    /**
     * Whether the cookie is marked as HTTP only.
     */
    httpOnly?: boolean;
    /**
     * The name of the cookie.
     */
    name: string;
    /**
     * The path of the cookie.
     */
    path?: string;
    /**
     * The Same Site policy applied to this cookie.  Can be `unspecified`,
     * `no_restriction`, `lax` or `strict`.
     */
    sameSite: 'unspecified' | 'no_restriction' | 'lax' | 'strict';
    /**
     * Whether the cookie is marked as secure.
     */
    secure?: boolean;
    /**
     * Whether the cookie is a session cookie or a persistent cookie with an expiration
     * date.
     */
    session?: boolean;
    /**
     * The value of the cookie.
     */
    value: string;
}
declare type GlobalKeyboardMap = Record<string, boolean>;
declare type setCookieParams = {
    cookies: CookieStore[];
    sessionName?: string;
};
interface getSessionCookieParams {
    sessionName?: string;
    domain?: string;
}
interface ICpuMemInfo {
    cpu: {
        name: string;
        coreNum: number;
    };
    memory: {
        total: number;
        free: number;
    };
}
interface AppManage {
    copyText(text: string): void;
    setBadgeCount(count: number): void;
    setTrayTitle(title: string): void;
    quit(force: boolean): void;
    getCookieStore(domain?: string): Promise<CookieStore[]>;
    setCookieStore(params: setCookieParams | setCookieParams['cookies'], sessionName?: string): Promise<void>;
    clearCookieStore(sessionName?: string): Promise<void>;
    getNetState(url: string): Promise<string[]>;
    getClipBoard(): ClipboardInterface;
    screenCaptureShortcut(data?: string): void;
    setMinimizeGlobalShortcut(data?: string): void;
    screenCapture(data?: string): void;
    toggleCaptureScreenAccess(): void;
    hideCurrentWindow(): void;
    setOpacityShowCurrentWindow(): void;
    getShotScreenImg(screen: Display): Promise<string>;
    getCurrentdWindowBounds(): Promise<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    getAllScreenDisplays(): Promise<Display[]>;
    getCursorScreenPoint(): Promise<{
        x: number;
        y: number;
    }>;
    desktopCapturerSources(): Promise<typeof desktopCapturer.getSources>;
    getPath(name: PathTypeName): Promise<string>;
    isAppAutoLaunch(): Promise<boolean>;
    setAppAutoLaunch(autoLaunch: boolean): Promise<void>;
    getName(): Promise<string>;
    getSystemStatus(): Promise<SystemStatus>;
    isAppLockScreen(): Promise<boolean>;
    getGlobalKeyboard(): Promise<GlobalKeyboardMap>;
    setGlobalKeyboard(params: GlobalKeyboardMap): Promise<void>;
    setUpdateFeedURL(info: {
        url: string;
        channel?: string;
    }): void;
    setAutoInstallOnAppQuit(val: boolean): void;
    getUpdateFeedURL(): Promise<string | null | undefined>;
    checkForUpdates(): Promise<UpdateCheckResult | null>;
    downloadUpdate(): Promise<any>;
    quitAndInstallUpdate(): void;
    getWinUserHasAdminUserGroup(): Promise<{
        success: boolean;
        hasAdimUserGroup: boolean;
    }>;
    getAppMetrics(): Promise<Array<ProcessMetric>>;
    reLaunchApp(): Promise<void>;
    getSessionCookieStore(params: getSessionCookieParams): Promise<CookieStore[]>;
    getFolderSize(folderPath: string): Promise<Array<IFolderSizeResult> | undefined>;
    getCpuMemInfo(): Promise<ICpuMemInfo>;
    getIsInApplicationFolder(): Promise<boolean>;
    getIsRunningUnderRosetta(): Promise<boolean>;
    setAppAutoLaunchToTray(isAutoLaunchToTray: boolean): Promise<void>;
    printToPdf(options: PrintToPDFOptions, ev?: IpcMainInvokeEvent): Promise<{
        filePath: string;
    }>;
    deleteWinCrashInfos(): Promise<boolean>;
    getWindowCrashInfos(): Promise<Array<IWindowCrashInfo>>;
    writeWindowCrashInfo(info: IWindowCrashInfo): Promise<boolean>;
    crashMainProcess(): Promise<void>;
    getUploadedReports(): Promise<Array<CrashReport>>;
    getLastCrashReport(): Promise<CrashReport>;
}
interface AppManageRender {
    getDeviceInfo(): Promise<DeviceInfo>;
    setPageZoomValue(val: number): void;
}
interface DeviceInfo {
    p: string;
    _deviceId: string;
    _device: string;
    _systemVersion: string;
    _system: string;
    _manufacturer: string;
    _deviceName: string;
    _appName: string;
}
interface ClipboardInterface {
    /**
     * An array of supported formats for the clipboard `type`.
     */
    availableFormats(type?: 'selection' | 'clipboard'): string[];
    /**
     * Clears the clipboard content.
     */
    clear(type?: 'selection' | 'clipboard'): void;
    /**
     * Whether the clipboard supports the specified `format`.
     *
     * @experimental
     */
    has(format: string, type?: 'selection' | 'clipboard'): boolean;
    /**
     * Reads `format` type from the clipboard.
     *
     * @experimental
     */
    read(format: string): string;
    /**
     * Reads `format` type from the clipboard.
     *
     * @experimental
     */
    readBuffer(format: string): Buffer;
    /**
     * The text on the find pasteboard, which is the pasteboard that holds information
     * about the current state of the active application’s find panel.
     *
     * This method uses synchronous IPC when called from the renderer process. The
     * cached value is reread from the find pasteboard whenever the application is
     * activated.
     *
     * @platform darwin
     */
    readFindText(): string;
    /**
     * The content in the clipboard as markup.
     */
    readHTML(type?: 'selection' | 'clipboard'): string;
    /**
     * The image content in the clipboard.
     */
    /**
     * The content in the clipboard as RTF.
     */
    readRTF(type?: 'selection' | 'clipboard'): string;
    /**
     * The content in the clipboard as plain text.
     */
    readText(type?: 'selection' | 'clipboard'): string;
    /**
     * Writes `data` to the clipboard.
     */
    write(data: any, type?: 'selection' | 'clipboard'): void;
    /**
     * Writes the `buffer` into the clipboard as `format`.
     *
     * @experimental
     */
    writeBuffer(format: string, buffer: Buffer, type?: 'selection' | 'clipboard'): void;
    /**
     * Writes the `text` into the find pasteboard (the pasteboard that holds
     * information about the current state of the active application’s find panel) as
     * plain text. This method uses synchronous IPC when called from the renderer
     * process.
     *
     * @platform darwin
     */
    writeFindText(text: string): void;
    /**
     * Writes `markup` to the clipboard.
     */
    writeHTML(markup: string, type?: 'selection' | 'clipboard'): void;
    /**
     * Writes `image` to the clipboard.
     */
    /**
     * Writes the `text` into the clipboard in RTF.
     */
    writeRTF(text: string, type?: 'selection' | 'clipboard'): void;
    /**
     * Writes the `text` into the clipboard as plain text.
     */
    writeText(text: string, type?: 'selection' | 'clipboard'): void;
}
interface IWindowCrashInfo {
    url: string;
    reason: string;
    exitCode: string;
}

interface FsDownloadConfig {
    receivedProgressWinId?: number;
    channel?: string;
    url: string;
    realUrl?: string;
    downloadUrl?: string;
    filePath?: string;
    dirPath?: string;
    fileName: string;
    start?: number;
    sessionName?: string;
    progress?: (receivedBytes: number, totalBytes: number, progress: number) => void;
}
interface FsZipConfig {
    /**
     * 文件路径
     */
    files: string[];
    /**
     * 打包后的文件保存地址
     */
    filePath?: string;
    /**
     * 保存的文件名（会自动加上.zip后缀）
     */
    fileName: string;
}
interface FsDownloadRes$1 {
    success: boolean;
    filePath: string;
    fileName: string;
    totalBytes: number;
    message?: string;
    error?: Error;
    md5?: string;
}
declare type FsZipRes = Omit<FsDownloadRes$1, 'md5' | 'totalBytes'>;
interface FsSelectRes {
    path: string | string[];
    success: boolean;
}
interface FsSaveRes {
    path: string;
    success: boolean;
}
interface logsToArrayBufRes {
    success: boolean;
    name?: string;
    path?: string;
    data?: ArrayBuffer;
}
interface FsSaveDialogOptions extends SaveDialogOptions {
    fileName?: string;
    winId?: number;
    openAsMainWindow?: boolean;
}
interface FsParsedMail extends ParsedMail {
    id: string;
    lastModified: number;
    encoding?: string;
}
interface FsManageHandle {
    getCookie(domain?: string): Promise<string>;
    /**
     * 打包并压缩文件
     * @param cofig 压缩打包配置
     */
    zip(cofig: FsZipConfig): Promise<FsZipRes>;
    writeToLogFile(conf: {
        data: string[] | string;
        appendix?: string;
    }): void;
}
interface FsManage {
    dragFile(filePath: string): void;
}
interface FsManageRenderer {
    /**
     * 在文件夹中展示当前文件
     * @param path 文件地址
     */
    show(path: string): void;
    createWriteStream(fileName: string, dirName?: string): Promise<WriteStream>;
    /**
     *  文件｜目录存在
     *  @param path:文件｜目录地址
     */
    isExist(path: string): boolean;
    /**
     * 以桌面默认方式打开文件
     * @param path 文件地址
     */
    open(path: string): Promise<string>;
    /**
     * 删除文件
     * @param path 文件地址
     */
    remove(path: string): Promise<void>;
    /**
     * 读取文件
     * @param path 文件地址
     */
    readFile(path: string): Promise<Buffer>;
    /**
     * 递归获取该文件夹下所有文件路径
     * @param path 文件夹地址
     * @param fileExtension 特定文件
     * @param deep 是否需要递归子文件夹
     */
    loopDirPath(path: string, fileExtension?: string, deep?: boolean): Promise<string[]>;
    /**
     * 移动文件
     * @param from 文件原地址
     * @param to 文件需要移动的地址
     */
    move(from: string, to: string): Promise<void>;
    /**
     * 复制文件
     * @param from 文件原地址
     * @param to 文件需要复制的地址
     */
    copy(from: string, to: string): Promise<void>;
    /**
     * 路径标准化
     * @param path 原地址
     */
    normalizePath(path: string): string;
    /**
     * 计算文件 md5
     * @param filePath 文件路径
     */
    getFileMd5(filePath: string): string;
    /**
     * 创建临时目录
     * @param prefix 前缀
     */
    mktempdir(prefix: string): Promise<string>;
    /**
     * 创建目录
     * @param dirName
     * @param path
     */
    mkDir(dirName: string, path?: string): Promise<string>;
    /**
     * 设置下载文件名
     * @param downloadPath
     * @param fileName
     * @param extName
     * @param fileMaxCount
     */
    setDownloadFileName(downloadPath: string, fileName?: string, extName?: string, fileMaxCount?: number): string;
    /**
     * 复制图片到剪贴板
     * @param dataURL
     */
    clipboardWriteImage(dataURL: string): void;
    /**
     * 保存base64格式的文件
     * @param path 保存路径
     * @param data base 64 数据
     */
    saveBase64File(path: string, data: string): Promise<any>;
    /**
     * 写入本地文件
     * @param file 文件二进制
     * @param path 路径
     */
    writeFile(file: string | Buffer | Uint8Array, path: string, options: WriteFileOptions | string, callback: (err: Error) => void): void;
    /**
     * 将最近log文件打包并转为ArrayBuffer
     */
    logsToArrayBuf(period?: number): Promise<logsToArrayBufRes>;
    /**
     * 文件拖拽
     */
    dragFile(filePath: string, iconPath?: string): void;
    /**
     * 获取文件状态
     */
    stat(filePath: string): Promise<Stats>;
    /**
     * 解析 eml 文件
     */
    parseEml(filePath: string, lastModified: number, options?: SimpleParserOptions): Promise<FsParsedMail>;
    /**
     * 解析 TNEF 文件
     * https://www.npmjs.com/package/node-tnef
     */
    parseTNEFFile(file: Buffer | string, encoding: string): Promise<string | ParsedMail['attachments']>;
    /**
     * 是否为文件夹
     * @param filePath 文件路径
     */
    isDir(filePath: string): Promise<boolean>;
    getBaseName(filePath: string): string;
    getIsFolderHasFullAccess(testPath: string): {
        success: boolean;
        createRes: boolean;
        deleteRes?: boolean;
        errorMsg?: string;
        errorCode?: string;
    };
}
declare type FsManageFunctionName = FsManageHandleType | FsManageType;
declare type FsManageHandleType = keyof FsManageHandle;
declare type FsManageType = keyof FsManage;

interface ICreateBrowserViewParam {
    winId: number;
    req: CreateWindowReq;
}
interface IRemoveBrowserViewParam {
    winId: number;
    viewId: number;
}
/**
 * 窗口返回数据类型，对外返回的数据结构
 */
interface ResponseWinInfo {
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
/**
 * 窗口数据对象，应仅在主进程中维护，非对外暴露对象
 */
interface SimpleWinInfo {
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
interface WinCloseParams {
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
declare type OnActiveFunc = (winId: number, data?: any, extData?: {}) => void;
interface WindowHooksCallback {
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
    onLaptopSuspend?: OnActiveFunc;
    onLaptopResume?: OnActiveFunc;
}
declare type WindowHooksName = keyof WindowHooksCallback;
/**
 * 窗口监听器及拦截器定义
 */
declare type WindowHooksObserverConf = {
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
interface CreateWindowReq {
    /**
     * 窗口类型，预定义在 WinType {@link WinType}
     */
    type: WinType;
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
    haveJquery?: boolean;
    bounds?: Electron.Rectangle;
}
interface CreateWindowRes {
    success: boolean;
    message?: Error;
    winId?: number;
    webId?: number;
}
interface ExchangeData {
    id?: number;
    data?: any;
}
interface WindowEventData {
    webId: number;
    eventName: string;
    data?: any;
}
declare type WindowEventListener = (res: WindowEventData) => Promise<any>;
declare type ExchangeDataListener = (res: WindowEventData) => any | Promise<any>;
declare type OpenFileListener = (files: {
    type: 'send' | 'open';
    paths: Array<string>;
}) => any | Promise<any>;
declare type WindowEventReceive = (res: WindowEventData) => Promise<WindowEventData>;
declare type LocalStorageType = 'appcache' | 'cookies' | 'filesystem' | 'indexdb' | 'localstorage' | 'shadercache' | 'websql' | 'serviceworkers' | 'cachestorage';
/**
 * 内部调用模型，不对外暴露
 */
interface CommonWinRequestParam {
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
/**
 * 窗口管理接口
 * 主进程，render进程都需实现的接口
 */
interface WindowManage {
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
    createBrowserView(createParam: ICreateBrowserViewParam): Promise<{
        viewId: number;
    }>;
    removeBrowserView(removeParam: IRemoveBrowserViewParam): Promise<void>;
    flushAllSession(): void;
}
/**
 * 窗口管理接口
 * 仅主进程需实现
 */
interface WindowManageHandle {
    dispatch(params: CommonWinRequestParam): Promise<any>;
}
/**
 * 窗口管理接口
 * 仅render进程需实现
 */
interface WindowManageRenderer {
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
    setSize(data: {
        width: number;
        height: number;
    }): Promise<void>;
    /**
     * 设置窗口位置
     * @param x y 中心点 只支持整数
     */
    setPosition(data: {
        x: number;
        y: number;
    }): Promise<void>;
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
    getPrimaryScreen(): Promise<Electron.Display>;
    getWinBounds(winId?: number): Promise<Electron.Rectangle | undefined>;
    flushAllSession(): void;
    setMainWindowZoomFactor(val: number): Promise<void>;
}
declare type WindowManageType = keyof WindowManage;
declare type WindowManageHandleType = keyof WindowManageHandle | 'dispatch';
declare type WindowManageFunctionName = WindowManageHandleType | WindowManageType | 'dispatch';

declare type YMStoreModuleName = 'window' | 'app' | 'account' | 'user' | 'performanceLog' | 'bridge' | 'event' | 'download' | 'memory';
declare type WindowStoreBounds = {
    [props in WinType]?: Partial<Rectangle>;
};
interface IWindowCreateInfo {
    lastCreateTime: number;
}
declare type WindowCreateInfos = {
    [props in WinType]: IWindowCreateInfo;
};
interface WindowStoreData {
    bounds: WindowStoreBounds;
    createInfos?: WindowCreateInfos;
    [props: string]: any;
}
interface AppStoreData {
    autoLaunch: boolean;
    downloadPath: string;
    initAccount: string | undefined;
    autoLaunchToTray: boolean;
    isTransferToAutoLaunch: boolean;
    appPageZoomVal: number;
    [props: string]: any;
}
declare type AccountItemDef = {
    sessionName: string;
    isDefault?: boolean;
};
interface UserStoreData {
    account: Record<string, AccountItemDef>;
    current?: string;
    currentSession?: string;
    lowMemoryMode?: boolean;
    useSystemProxy?: boolean;
    useInProcessGPU?: boolean;
    useSystemProxyType?: SYSTEM_PROXY_TYPES;
}
declare type WindowStoreDataKey = keyof WindowStoreData;
declare type AppStoreDataKey = keyof AppStoreData;
declare type UserStoreDataKey = keyof UserStoreData;
declare type StoreDataKey = WindowStoreDataKey | AppStoreDataKey | UserStoreDataKey;
interface StoreManageRender {
    get(moduleName: YMStoreModuleName, attr?: StoreDataKey): Promise<any>;
    set(moduleName: YMStoreModuleName, attr: StoreDataKey, value: any): Promise<void>;
}
declare type StoreManageFuncNames = keyof StoreManageRender;
declare type SYSTEM_PROXY_TYPES = 'systemProxy-useDirect' | 'systemProxy-useSystem' | 'systemProxy-smartProxy';

declare type BridgeTaskPriority = 'high' | 'medium' | 'low';
declare type BridgeManageFuncName = keyof WorkerBridgeMange | keyof MasterBridgeManage;
declare type SupportNamespaces = string;
interface DispatchTaskRequestContent {
    namespace: SupportNamespaces;
    apiname: string;
    args: unknown[];
    account: string;
}
interface ResponseExchange {
    type: 'response';
    ackNo: string;
    code: number;
    data?: unknown;
    errorMsg: string | Error;
    duration?: number[];
}
declare type TaskResponse = Omit<ResponseExchange, 'type'>;
interface MasterBridgeManage {
    dispatchTask(args: DispatchTaskRequestContent, ackNo: string, winType?: string): Promise<unknown>;
    flush(account: string): Promise<void>;
    getAllTasks(): Promise<unknown>;
    getConfigureTaskPriority(): unknown;
    configureApiPriority(taskInfo: Omit<DispatchTaskRequestContent, 'args' | 'account'>, priority: BridgeTaskPriority, overtime?: number): void;
    getBridgeConnected(): boolean;
    checkBgAlive(account: string): Promise<unknown>;
    removeBridgeWin(webId: number): Promise<unknown>;
}
interface ReturnTaskParams {
    response: TaskResponse;
    options: {
        count: number;
        type: string;
        account: string;
        forcePullTask?: boolean;
    };
}
interface WorkerBridgeMange {
    returnTaskResult(params: ReturnTaskParams): Promise<unknown>;
    ping(id: string): Promise<unknown>;
}

interface FsDownloadRes {
    success: boolean;
    filePath: string;
    fileName: string;
    totalBytes: number;
    message?: string;
    error?: Error;
    md5?: string;
}
interface DownloadManageHandle {
    /**
     * 使用Electron原生下载文件至本地，平替fsManage.download
     * @param config 下载配置
     */
    download(config: FsDownloadConfig): Promise<FsDownloadRes>;
    downloadAbort(url: string): void;
}
interface DownloadManage {
    downloadAbort(url: string): void;
    /**
     * 下载文件至本地
     * @param config 下载配置
     */
    download(config: FsDownloadConfig): Promise<FsDownloadRes>;
}
declare type DownloadManageFunctionName = DownloadManageHandleType | DownloadManageType;
declare type DownloadManageHandleType = keyof DownloadManageHandle;
declare type DownloadManageType = keyof DownloadManage;

declare type sendChannelType = 'fsManage' | 'browserInvoke' | 'fsManageInvoke' | 'appCall' | 'storeInvoke' | 'ondragstart' | 'bridgeInVoke' | 'downloadManageInvoke' | 'downloadManage';
declare type receiveChannelType = 'renderer-data-exchange' | 'window-hooks' | 'bridge-data-exchange' | 'open-file-channel';
declare type functionNameType = WindowManageFunctionName | FsManageFunctionName | AppManageType | StoreManageFuncNames | BridgeManageFuncName | DownloadManageFunctionName;
interface IpcRendererReq {
    channel: sendChannelType;
    functionName: functionNameType;
    params?: any;
}
interface IpcRendererSendTo {
    id: number;
    channel: receiveChannelType;
    data?: WindowEventData;
    sent?: boolean;
}
interface IpcRendererReceive {
    channel: receiveChannelType;
    listener: (data: any) => Promise<any>;
}
interface IpcChannelManage {
    sendTo(req: IpcRendererSendTo): void;
    receive(listener: IpcRendererReceive): void;
    send(req: IpcRendererReq): void;
}

interface Env {
    isMac: boolean;
    userDataPath: string;
    version: string;
    showVersion: string;
    stage: string;
}
interface Lib {
    env: Env;
    appManage: AppManage & AppManageRender;
    windowManage: WindowManage & WindowManageRenderer;
    fsManage: FsManage & FsManageHandle & FsManageRenderer;
    ipcChannelManage: IpcChannelManage;
    storeManage: StoreManageRender;
    masterBridgeManage: MasterBridgeManage;
    workerBridgeManage: WorkerBridgeMange;
    downloadManage: DownloadManage$1;
}
declare class libImpl implements Lib {
    env: Env;
    appManage: AppManage & AppManageRender;
    windowManage: WindowManage & WindowManageRenderer;
    fsManage: FsManage & FsManageHandle & FsManageRenderer;
    ipcChannelManage: IpcChannelManage;
    storeManage: StoreManageRender;
    masterBridgeManage: MasterBridgeManage;
    workerBridgeManage: WorkerBridgeMange;
    downloadManage: DownloadManage$1;
    constructor();
}

declare const electronLib: libImpl;
declare global {
    interface Window {
        electronLib: Lib;
        siriusVersion: string;
        os: string;
    }
}

export { ClipboardInterface, CookieStore, CreateWindowReq, CreateWindowRes, Env, ExchangeDataListener, FsDownloadConfig, FsManageHandleType, FsSelectRes, Lib, OnActiveFunc, PathTypeName, ResponseWinInfo, SimpleWinInfo, StoreManageFuncNames, StoreManageRender, WindowEventData, WindowEventListener, WindowEventReceive, WindowHooksCallback, WindowHooksName, WindowHooksObserverConf, YMStoreModuleName, electronLib };
