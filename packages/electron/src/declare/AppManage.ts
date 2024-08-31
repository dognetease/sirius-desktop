import type { UpdateCheckResult } from 'electron-updater';
import type { AppAutoUpdater } from 'src/main/appUpdate';
import type { ProcessMetric, Display, desktopCapturer, PrintToPDFOptions, IpcMainInvokeEvent, CrashReport } from 'electron';

export type AppManageType = keyof AppManage | keyof AppAutoUpdater;
export type PathTypeName =
  | 'home'
  | 'appData'
  | 'userData'
  | 'temp'
  | 'exe'
  | 'module'
  | 'desktop'
  | 'documents'
  | 'downloads'
  | 'music'
  | 'pictures'
  | 'videos'
  | 'recent'
  | 'logs'
  | 'crashDumps';

export type SystemStatus = 'suspend' | 'resume';

export interface IFolderSizeResult {
  size: number;
  dir?: string;
}

export interface CookieStore {
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

export type GlobalKeyboardMap = Record<string, boolean>;

export type setCookieParams = {
  cookies: CookieStore[];
  sessionName?: string;
};

export interface getSessionCookieParams {
  sessionName?: string;
  domain?: string;
}

export interface ICpuMemInfo {
  cpu: {
    name: string;
    coreNum: number;
  };
  memory: {
    total: number;
    free: number;
  };
}

export interface AppManage {
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

  getCurrentdWindowBounds(): Promise<{ x: number; y: number; width: number; height: number }>;

  getAllScreenDisplays(): Promise<Display[]>;

  getCursorScreenPoint(): Promise<{ x: number; y: number }>;

  desktopCapturerSources(): Promise<typeof desktopCapturer.getSources>;

  getPath(name: PathTypeName): Promise<string>;

  isAppAutoLaunch(): Promise<boolean>;

  setAppAutoLaunch(autoLaunch: boolean): Promise<void>;

  getName(): Promise<string>;

  getSystemStatus(): Promise<SystemStatus>;

  isAppLockScreen(): Promise<boolean>;

  getGlobalKeyboard(): Promise<GlobalKeyboardMap>;

  setGlobalKeyboard(params: GlobalKeyboardMap): Promise<void>;

  setUpdateFeedURL(info: { url: string; channel?: string }): void;

  setAutoInstallOnAppQuit(val: boolean): void;

  getUpdateFeedURL(): Promise<string | null | undefined>;

  checkForUpdates(): Promise<UpdateCheckResult | null>;

  downloadUpdate(): Promise<any>;

  quitAndInstallUpdate(): void;

  getWinUserHasAdminUserGroup(): Promise<{ success: boolean; hasAdimUserGroup: boolean }>;

  getAppMetrics(): Promise<Array<ProcessMetric>>;

  reLaunchApp(): Promise<void>;

  getSessionCookieStore(params: getSessionCookieParams): Promise<CookieStore[]>;

  getFolderSize(folderPath: string): Promise<Array<IFolderSizeResult> | undefined>;

  getCpuMemInfo(): Promise<ICpuMemInfo>;

  getIsInApplicationFolder(): Promise<boolean>;

  getIsRunningUnderRosetta(): Promise<boolean>;

  setAppAutoLaunchToTray(isAutoLaunchToTray: boolean): Promise<void>;

  printToPdf(options: PrintToPDFOptions, ev?: IpcMainInvokeEvent): Promise<{ filePath: string }>;

  deleteWinCrashInfos(): Promise<boolean>;
  getWindowCrashInfos(): Promise<Array<IWindowCrashInfo>>;
  writeWindowCrashInfo(info: IWindowCrashInfo): Promise<boolean>;
  crashMainProcess(): Promise<void>;
  getUploadedReports(): Promise<Array<CrashReport>>;
  getLastCrashReport(): Promise<CrashReport>;
}

export interface AppManageRender {
  getDeviceInfo(): Promise<DeviceInfo>;

  // isAppAutoLaunch(): boolean;
  //
  // setAppAutoLaunch(autoLaunch: boolean): void;

  setPageZoomValue(val: number): void;
}

export interface DeviceInfo {
  p: string;
  _deviceId: string;
  _device: string;
  _systemVersion: string;
  _system: string;
  _manufacturer: string;
  _deviceName: string;
  _appName: string;
}

export interface ClipboardInterface {
  // Docs: https://electronjs.org/docs/api/clipboard

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

  // readImage(type?: 'selection' | 'clipboard'): NativeImage;
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

  // writeImage(image: NativeImage, type?: 'selection' | 'clipboard'): void;
  /**
   * Writes the `text` into the clipboard in RTF.
   */
  writeRTF(text: string, type?: 'selection' | 'clipboard'): void;

  /**
   * Writes the `text` into the clipboard as plain text.
   */
  writeText(text: string, type?: 'selection' | 'clipboard'): void;
}

export interface IWindowCrashInfo {
  url: string;
  reason: string;
  exitCode: string;
}
