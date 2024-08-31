/* eslint-disable no-debugger */
/* eslint-disable */
// @ts-nocheck
import path from 'path';
import fs from 'fs';
import AutoLaunch from 'auto-launch';
import {
  app,
  BrowserWindow,
  screen,
  clipboard,
  globalShortcut,
  ipcMain,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  powerMonitor,
  Tray,
  desktopCapturer,
  systemPreferences,
  shell,
  WebContents,
  IpcMainInvokeEvent,
  PrintToPDFOptions,
  crashReporter,
} from 'electron';
import { windowManage } from './windowManage';
import { interceptManage } from './NetManage';
import { fsManage } from './fsManage';
import { isMac, rootURL, isEdm, userDataPath } from './config';
import {
  AppManage,
  AppManageType,
  ClipboardInterface,
  CookieStore,
  GlobalKeyboardMap,
  PathTypeName,
  setCookieParams,
  SystemStatus,
  getSessionCookieParams,
  IFolderSizeResult,
  IWindowCrashInfo,
} from '../declare/AppManage';
// import { config } from 'env_def';
import { AbstractManager } from './abstractManager';
import { storeManage } from './storeManage';
import appUpdater, { AppAutoUpdater } from './appUpdate';
import { bridgeManageImpl } from './bridgeManage';
import { downloadManage } from './downloadManage';
// import shell=Electron.Common.shell;
// import { WinType } from '../declare/WindowManage';
import utils from './utils';
import { useCapture, captureScreen } from './capture-main';
import { stage, productName } from 'envDef';

const menuConf: Array<MenuItemConstructorOptions | MenuItem> = [
  {
    label: productName,
    submenu: [
      {
        label: `关于${productName}`,
        click: () => {
          windowManage.createWindow({ type: 'about', parent: -1 });
        },
      },
      // {
      //   type: 'separator'
      // },
      // {
      //   label: '偏好设置...',
      //   accelerator: 'Command+,',
      //   type: 'normal'
      // },
      {
        type: 'separator',
      },
      {
        label: `退出${productName}`,
        accelerator: 'Command+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  },
  {
    label: '编辑',
    submenu: [
      {
        label: '撤销',
        accelerator: 'Command+Z',
        role: 'undo',
      },
      {
        label: '重做',
        accelerator: 'shift+Command+Z',
        role: 'redo',
      },
      { type: 'separator' },
      {
        label: '剪切',
        accelerator: 'Command+X',
        role: 'cut',
      },
      {
        label: '复制',
        accelerator: 'Command+C',
        role: 'copy',
      },
      {
        label: '粘贴',
        accelerator: 'Command+V',
        role: 'paste',
      },
      {
        label: '全选',
        accelerator: 'Command+A',
        role: 'selectAll',
      },
    ],
  },
  {
    label: '窗口',
    submenu: [
      {
        label: '最小化',
        accelerator: 'Command+M',
        role: 'minimize',
        // click: () => { }
      },
      {
        label: '全屏',
        accelerator: 'Control+Command+F',
        role: 'togglefullscreen',
      },
      { type: 'separator' },
      {
        label: '前置窗口',
        accelerator: 'shift+Command+M',
        click: () => {
          windowManage.show();
        },
      },
    ],
  },
];

const AutoLaunchToTrayKey = 'autoLaunchToTray';

const crashEncodingParam = { encoding: 'utf8' };

class appManageImpl extends AbstractManager implements AppManage {
  private tray: Tray | undefined;

  stage: string = stage;

  isLockScreen = false;

  systemStatus: SystemStatus = 'resume';

  cookies: Map<string, CookieStore>;

  AutoLaunchSetting!: AutoLaunch;

  AutoLaunchSettingOld!: AutoLaunch;

  autoLaunchName = 'sirius-desktop';

  appName: string = productName || '网易灵犀办公';

  productNameEn: string = isEdm ? 'edm' : '';

  autoUpdater: AppAutoUpdater;

  constructor() {
    super();
    this.initAutoLaunchSetting();
    this.cookies = new Map<string, CookieStore>();
    this.autoUpdater = appUpdater;
  }

  private initAutoLaunchSetting() {
    const isAutoLaunchToTray = storeManage.get('app', AutoLaunchToTrayKey);
    this.AutoLaunchSetting = new AutoLaunch({
      name: 'sirius-desktop',
      isHidden: isAutoLaunchToTray,
      mac: {
        useLaunchAgent: true,
      },
    });
    const hasTransferAutoLaunch = storeManage.getHasTransferAutoLaunch();
    if (process.platform === 'darwin' && !hasTransferAutoLaunch) {
      this.AutoLaunchSettingOld = new AutoLaunch({
        name: 'sirius-desktop',
      });
    }
  }

  private setGlobalShortcut(callback, data?: string) {
    try {
      const dataObj = JSON.parse(data);
      const { oldShortcut, newShortcut } = dataObj;
      let isReg = null;
      if (oldShortcut && oldShortcut !== 'noncapture') {
        isReg = globalShortcut.isRegistered(oldShortcut);
      }
      if (isReg) {
        globalShortcut.unregister(oldShortcut);
      }
      if (newShortcut && typeof callback === 'function') {
        globalShortcut.register(newShortcut, callback);
        // storeManage.set('app', 'captureScreenglobalKey', newShortcut);
      }
      return true;
    } catch (error) {
      console.log('capturescreenlog screenCaptureShortcut error', error);
    }
  }

  quit(force: boolean) {
    if (force) {
      app.exit();
    } else {
      app.quit();
    }
  }

  getClipBoard(): ClipboardInterface {
    return clipboard as ClipboardInterface;
  }

  screenCapture(data, event) {
    let dataObj = {};
    try {
      dataObj = JSON.parse(data);
    } catch (error) {
      console.log('capturescreenlog start>>>>>>> error', error);
    }
    const currentWindow = BrowserWindow.fromWebContents(event.sender);
    captureScreen({ ...dataObj, winId: currentWindow.id });
  }

  screenCaptureShortcut(data?: string) {
    this.setGlobalShortcut(captureScreen, data);
    return false;
  }

  async getShotScreenImg(...args) {
    const argsstring = args.map(item => {
      if (item) {
        if (['string', 'number', 'function'].includes(typeof item)) return String(item);
        const res = {};
        Object.keys(item).forEach(key => {
          res[key] = String(item[key]);
        });
        return JSON.stringify(res).slice(0, 500);
      }
      return 'item不存在';
    });
    this.writeLog('captureScreen', { type: '进入getShotScreenImg', args: argsstring }).then();
    console.log('getShotScreenImg1');
    try {
      const event = args.pop();
      const currentWindow = BrowserWindow.fromWebContents(event.sender);
      // 新创建的窗口如果setOpacity(0) 在最后不能设置成setOpacity(1) 导致截图不显示，原因未知
      // 但是没有setOpacity(0) 白屏闪烁又很明显 所以做个判断处理
      if (!currentWindow.newCreateWin) {
        currentWindow?.setOpacity(0);
      }
      const screenCap = JSON.parse(args[0]);
      // const allscreeen = screen.getAllDisplays();
      // const currentScreen = allscreeen.find(item => item.id === screenCap.id);
      const { size, scaleFactor } = screenCap;
      const { width, height } = {
        // desktopCapturer.getSources 不能接受小数否则报错，一个隐蔽隐蔽的bug
        width: parseInt(size.width * scaleFactor),
        height: parseInt(size.height * scaleFactor),
      };
      this.writeLog('captureScreen', { type: 'getShotScreenImgwidth,height', height, width }).then();
      const screenPremis = systemPreferences.getMediaAccessStatus('screen');
      console.log('getShotScreenImg2', screenPremis);
      if (screenPremis !== 'granted') {
        fsManage.writeLog('captureScreen', { type: '权限', screenPremis }).then();
        if (isMac) {
          const fromWinId = currentWindow.fromWinId;
          const allWindows = BrowserWindow.getAllWindows();
          const targetWin =
            allWindows.find(win => {
              return win.id === fromWinId;
            }) || allWindows[0];
          // 快捷键的情况下可能不会弹窗，应为没有 fromWinId
          // 提醒没有权限
          targetWin.webContents.send('get-screen-access');
          // shell.openExternal(`x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture`);
        }
        currentWindow?.hide();
        return '';
      }
      console.log('getShotScreenImg3');
      this.writeLog('captureScreen', { type: 'getShotScreenImg getSourcesfn', getSources: String(desktopCapturer.getSources) }).then();
      const sources = [
        ...(await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: {
            width,
            height,
          },
        })),
      ];
      const sourcesstring = sources.map(item => {
        if (item) {
          if (['string', 'number', 'function'].includes(typeof item)) return String(item);
          const res = {};
          Object.keys(item).forEach(key => {
            res[key] = String(item[key]);
          });
          return JSON.stringify(res).slice(0, 500);
        }
        return 'item不存在';
      });
      this.writeLog('captureScreen', { type: 'getShotScreenImg getSourcesfn', sourcesstring }).then();
      this.writeLog('captureScreen', { type: 'desktopCapturer执行完成', screenCap }).then();
      console.log('captureScreen screen', screenCap);
      // win7 单屏幕下没有 display_id 神奇
      const source = sources.find(source => String(source.display_id) === String(screenCap.id)) || sources[0];
      this.writeLog('captureScreen', { type: 'desktopCapturer source', source: String(source.thumbnail.toDataURL) }).then();
      const img = source.thumbnail.toDataURL();
      currentWindow.show();
      // fsManage.writeLog('captureScreen', { type: 'desktopCapturer执行完成', source, screen }).then();
      // 渲染完成后再显示，否则有闪烁
      return img;
    } catch (error) {
      console.log('getShotScreenImg4', error);
      this.writeLog('captureScreen', { type: '进入getShotScreenImg后报错', error }).then();
    }
  }

  toggleCaptureScreenAccess(...args) {
    shell.openExternal(`x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture`);
  }

  hideCurrentWindow(...args) {
    const event = args.pop();
    const currentWindow = BrowserWindow.fromWebContents(event.sender);
    currentWindow.hide();
  }
  setOpacityShowCurrentWindow(...args) {
    const event = args.pop();
    const currentWindow = BrowserWindow.fromWebContents(event.sender);
    currentWindow?.setOpacity(1);
    currentWindow.setAlwaysOnTop(true, 'screen-saver');
    currentWindow.setVisibleOnAllWorkspaces(true);
    currentWindow.setFullScreenable(false);
  }

  getCurrentdWindowBounds(...args) {
    console.log('captureScreen args', args);
    const event = args.pop();
    const currentWindow = BrowserWindow.fromWebContents(event.sender);
    return currentWindow?.getBounds();
  }

  getAllScreenDisplays() {
    return screen.getAllDisplays();
  }

  getCursorScreenPoint() {
    return screen.getCursorScreenPoint();
  }

  desktopCapturerSources(): Promise<typeof desktopCapturer.getSources> {
    return desktopCapturer.getSources;
  }

  setBadgeCount(count: number) {
    const num = count < 0 ? 0 : count;
    if (isMac) {
      app.setBadgeCount(num);
      this.setTrayTitle();
    } else {
      console.log('[main] [app] setBadgeCount', num, this.getTrayIcon(num));
      this.setTrayIcon(this.getTrayIcon(num));
    }
  }

  setTrayTitle(title?: string) {
    const num = app.getBadgeCount();
    const _title = num > 9999 ? '9999+' : num === 0 ? '' : num + '';
    this.tray?.setTitle(title || _title);
  }

  // 检查网络状态
  getNetState(url: string): Promise<string[]> {
    // 空实现
    return Promise.resolve([]);
  }

  // 复制文本
  copyText(text: string) {
    clipboard.writeText(text);
  }

  init() {
    console.warn('init electron start');
    this.tray = this.createTray();
    this.initPowerMonitorListener();
    this.initAppListener();
    this.createShortcut();
    this.initMenu();
    this.initProtocol();
    this.initIpcChannel();
    this.initNativeTheme();
    // this.initNetHandler();
    this.initAutoLaunch();
    this.initStore();
    // 截图初始化
    useCapture();
  }

  /**
   * 程序开机自启动
   */
  async initAutoLaunch() {
    const isAppAutoLaunch = await this.isAppAutoLaunch();
    const isEnableAutoLaunch = await this.AutoLaunchSetting.isEnabled();
    const hasTransferAutoLaunch = storeManage.getHasTransferAutoLaunch();
    if (!hasTransferAutoLaunch) {
      if (this.AutoLaunchSettingOld) {
        const isOldEnableAutoLaunch = await this.AutoLaunchSettingOld.isEnabled();
        if (isOldEnableAutoLaunch) {
          this.AutoLaunchSettingOld.disable();
        }
      }
      if (process.platform === 'win32' && isEnableAutoLaunch) {
        this.AutoLaunchSetting.enable().catch(err => {
          fsManage.writeToLogFile({ data: 'enable error' + (err && err.message ? err.message : '') });
        });
      }
      storeManage.setHasTransferAutoLaunch(true);
    }
    isAppAutoLaunch
      ? !isEnableAutoLaunch &&
        this.AutoLaunchSetting.enable().catch(err => {
          fsManage.writeToLogFile({ data: 'enable error' + (err && err.message ? err.message : '') });
        })
      : isEnableAutoLaunch &&
        this.AutoLaunchSetting.disable().catch(err => {
          fsManage.writeToLogFile({ data: 'disable error' + (err && err.message ? err.message : '') });
        });
  }

  /** *
   * 初始化菜单
   */
  initMenu() {
    if (isMac) {
      const menu = Menu.buildFromTemplate(menuConf);
      Menu.setApplicationMenu(menu);
    } else {
      Menu.setApplicationMenu(null);
    }
  }

  /**
   * 初始化系统托盘
   */
  createTray(): Tray {
    const tray = new Tray(this.getTrayIcon());
    tray.on('click', () => {
      const id = windowManage.getMainWinInfo()?.id;
      windowManage.show(id);
    });
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '打开面板',
        click: () => {
          const id = windowManage.getMainWinInfo()?.id;
          windowManage.show(id);
        },
      },
      {
        label: '强行退出',
        click: () => {
          app.exit();
        },
      },
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip(this.appName);
    return tray;
  }

  getTrayIcon(badgeCount?: number) {
    let trayIcon;
    // const isDark = nativeTheme.shouldUseDarkColors;
    if (isMac) {
      trayIcon = path.join(rootURL, `static/${this.productNameEn ? this.productNameEn + '_' : this.debug ? 'beta_' : ''}trayMacTemplate.png`);
    } else {
      trayIcon = path.join(rootURL, `static/tray${this.productNameEn ? '_' + this.productNameEn : this.debug ? '_beta' : ''}${badgeCount ? '_badge' : ''}.png`);
    }
    return trayIcon;
  }

  setTrayIcon(icon?: string) {
    this.tray?.setImage(icon || this.getTrayIcon());
  }

  async getGlobalKeyboard(): Promise<GlobalKeyboardMap> {
    return storeManage.get('app', 'globalKeyboardMap');
  }

  async setGlobalKeyboard(keyMap: GlobalKeyboardMap) {
    this.setMinimizeGlobalShortcut(JSON.stringify({ newShortcut: keyMap.minimize }));
    console.log('[app] setGlobalKeyboard', keyMap);
    return storeManage.set('app', 'globalKeyboardMap', keyMap);
  }

  setMinimizeGlobalShortcut(data?: string) {
    this.setGlobalShortcut(() => {
      const mainWin = windowManage.getMainWinInfo();
      const isVisible = mainWin && !windowManage.isMinimizedSync(); //mainWin.id
      console.warn('[app] setGlobalKeyboard isReg tigger CommandOrControl+M', isVisible);
      this.writeLog('setMinimizeGlobalShortcut', { type: '1', isVisible });
      if (isVisible) {
        windowManage.minimize();
      } else {
        this.writeLog('setMinimizeGlobalShortcut', { type: '2' });
        this.writeLog('setMinimizeGlobalShortcut', { type: '3', restore: JSON.stringify(windowManage.restore), unminimize: JSON.stringify(windowManage.unminimize) });
        windowManage.show();
      }
    }, data);
  }

  /**
   * 初始化全局快捷键
   */
  createShortcut() {
    this.getGlobalKeyboard().then(res => {
      const keyMap = res || {};

      if (keyMap.minimize || keyMap.minimize === undefined) {
        keyMap.minimize = true;
        // zoumingliang 2022-10-27 修改 win暂时没有全局快捷键
        isMac && this.setGlobalKeyboard(keyMap);
      }
    });
  }

  /**
   * 初始化全局协议
   * 2021-01-18 不再使用拦截方式处理协议，自定义协议处理各种本地请求需求
   */
  initProtocol() {
    interceptManage.initFileIntercept();
  }

  // showNotification(title: string, content: string) { }

  async setAutoInstallOnAppQuit(val: boolean) {
    return this.autoUpdater.setAutoInstallOnAppQuit(val);
  }

  async setUpdateFeedURL(urlInfo: { url: string; channel?: string }) {
    return this.autoUpdater.setFeedUrl(urlInfo.url, urlInfo.channel);
  }

  async getUpdateFeedURL() {
    return this.autoUpdater.getFeedUrl();
  }

  async checkForUpdates() {
    return this.autoUpdater.checkForUpdates();
  }

  async downloadUpdate() {
    return this.autoUpdater.downloadUpdate();
  }

  async quitAndInstallUpdate() {
    return this.autoUpdater.quitAndInstall();
  }

  async printToPdf(options: PrintToPDFOptions, ev: IpcMainInvokeEvent) {
    if (ev && ev.sender) {
      const webCotent = ev.sender;
      return webCotent
        .printToPDF(
          Object.assign(
            {
              landscape: false,
              displayHeaderFooter: true,
              printBackground: false,
              scale: 1,
              pageSize: 'A4',
              margins: {
                top: 1.5,
                bottom: 1.5,
                left: 1.5,
                right: 1.5,
              },
              preferCSSPageSize: true,
            },
            options || {}
          )
        )
        .then(async pdfData => {
          const appDataPath = await this.getPath('userData');
          const pdfPath = path.resolve(appDataPath, `./printpdf-${new Date().getTime()}.pdf`);
          fs.writeFileSync(pdfPath, pdfData);
          return { filePath: pdfPath };
        })
        .catch(err => {
          console.error('printToPdf error', err);
          return err;
        });
    }
  }

  /**
   * 初始化ipcChannel
   */

  initIpcChannel() {
    // ipcMain.on(
    //   'app',
    //   (
    //     event,
    //     functionName: AppManageType,
    //     args: number | string,
    //   ) => {
    //     let func = this[functionName as keyof appManageImpl] as Function;
    //     func(args as number & string);
    //   },
    // );

    ipcMain.handle('appCall', async (event, functionName: AppManageType, ...args: any[]) => {
      const func = this[functionName as keyof appManageImpl] as Function;
      console.log('[app] appCall', functionName, args);
      args.push(event);
      const result = await func.apply(this, args);
      return { data: result };
    });
    fsManage.initIpcChannel();
    console.log('[bridge]initIpcChannel');
    bridgeManageImpl.initIpcChannel();
    downloadManage.initIpcChannel();
  }

  getAppPath() {
    const appPath = app.getAppPath();
    console.log('[main] got ', appPath);
    return { appPath };
  }

  initNativeTheme() {
    // nativeTheme.addListener('updated', () => {
    //   this.tray?.setImage(this.getTrayIcon());
    // });
  }

  async getSessionCookieStore(params: getSessionCookieParams): Promise<CookieStore[]> {
    const { sessionName, domain } = params;
    const cookieJar = this.getSession(sessionName).cookies;
    const cookieStores = await this.getCookieFromCookieJar(cookieJar, domain);
    return cookieStores;
  }

  async getCookieStore(domain?: string): Promise<CookieStore[]> {
    const cookieJar = this.getSession().cookies;
    const cookieStores = await this.getCookieFromCookieJar(cookieJar, domain);
    // console.log('[electron] get cookies:', cookieStores);
    return cookieStores;
  }

  async setCookieStore(params: setCookieParams): Promise<void> {
    const { sessionName, cookies } = params;
    console.log('[app] setCookieStore', sessionName, cookies);
    const cookieJar = this.getSession(sessionName).cookies;
    await this.setCookieToCookieJar({
      cookies,
      cookieJar,
      url: this.host,
      from: 'appSetCookie',
      noBuildExtraCookie: true,
    });
    this.flushSession();
  }

  async clearCookieStore(sessionName?: string): Promise<void> {
    const session = this.getSession(sessionName);
    await session.clearStorageData({ storages: ['cookies'] });
  }

  private initAppListener() {
    app.on('activate', () => {
      const allWindows = BrowserWindow.getAllWindows();
      const mainWinInfo = this.getMainWinInfo();
      if (!mainWinInfo || mainWinInfo.win.isDestroyed()) {
        windowManage.createWindow({ type: 'main' }).then(() => {
          this.writeLog('__recreate_main', { remainWindow: allWindows.length });
          if (allWindows && allWindows.length) {
            windowManage.closeAllWindowExceptMain(true).then();
          }
        });
      } else if (mainWinInfo && mainWinInfo.win) {
        windowManage.show(mainWinInfo.win.id);
      }
    });
    app.on('web-contents-created', (event, contents) => {
      console.log('[electron] webContent created:', contents.getType(), contents.id, contents.getProcessId());
    });
    app.on('window-all-closed', (e: Event) => {
      e.preventDefault();
      console.log('window-all-closed');
      fsManage.writeLog('__all_window_closed', {}).then();
      // if (!AbstractManager.windowCreating)
      setTimeout(() => {
        if (BrowserWindow.getAllWindows().length == 0) app.exit();
      }, 0);

      // }
    });
    app.on('before-quit', () => {
      /* for (let key in AbstractManager.winIdMap) */
      Object.keys(AbstractManager.winIdMap).forEach(key => {
        if (AbstractManager.winIdMap.hasOwnProperty(key)) {
          const item = AbstractManager.winIdMap[Number(key)];
          item.isQuit = true;
        }
      });
      fsManage.writeLog('__app_will_quit', {}).then();
    });
    app.on('will-quit', () => {
      this.flushSession();
      fsManage.writeLog('__app_quit', {}).then();
    });
  }

  private flushSession() {
    try {
      windowManage.flushAllSession();
    } catch (ex) {
      console.warn(ex);
    }
  }

  private initPowerMonitorListener() {
    powerMonitor.on('lock-screen', () => {
      console.log('[main] app lock-screen');
      this.isLockScreen = true;
      windowManage.handleHooks('onLockScreen', windowManage.getMainWinInfo()!);
    });
    powerMonitor.on('unlock-screen', () => {
      console.log('[main] app unlock-screen');
      this.isLockScreen = false;
      windowManage.handleHooks('onUnlockScreen', windowManage.getMainWinInfo()!);
    });
    powerMonitor.on('suspend', () => {
      console.log('[main] app suspend');
      this.systemStatus = 'suspend';
      windowManage.handleHooks('onLaptopSuspend', windowManage.getMainWinInfo()!);
    });
    powerMonitor.on('resume', () => {
      console.log('[main] app resume');
      this.systemStatus = 'resume';
      windowManage.handleHooks('onLaptopResume', windowManage.getMainWinInfo()!);
    });
  }

  /*
   * 获取锁屏状态
   */
  async isAppLockScreen() {
    return this.isLockScreen;
  }

  /*
   * 获取系统状态
   */
  async getSystemStatus() {
    return this.systemStatus;
  }

  getPath(name: PathTypeName) {
    return Promise.resolve(app.getPath(name as any));
  }

  getName(): Promise<string> {
    // 这个是appId 和 this.appName不一样 ！！！！！！
    const appId = app.getName(); // 这个是appId 和 this.appName不一样 ！！！！！！
    return Promise.resolve(appId);
  }

  async isAppAutoLaunch(): Promise<boolean> {
    const autoLaunch = storeManage.get('app', 'autoLaunch');
    return autoLaunch;
  }

  private enableAutoLaunch() {
    this.initAutoLaunchSetting();
    return this.AutoLaunchSetting.enable();
  }

  private disableAutoLaunch() {
    return this.AutoLaunchSetting.disable();
  }

  async setAppAutoLaunch(autoLaunch: boolean): Promise<void> {
    autoLaunch ? await this.enableAutoLaunch() : await this.disableAutoLaunch();
    await storeManage.set('app', 'autoLaunch', autoLaunch);
  }

  async setAppAutoLaunchToTray(isAutoLaunchToTray: boolean): Promise<void> {
    storeManage.set('app', AutoLaunchToTrayKey, isAutoLaunchToTray);
  }

  private initStore() {
    storeManage.initIpcChannel();
  }

  async getWinUserHasAdminUserGroup(): Promise<{ success: boolean; hasAdimUserGroup: boolean }> {
    const defaultHasAdminUserGroup = true;
    const { execShellByCmd } = utils;
    return new Promise(async (resolve, reject) => {
      try {
        if (process.platform !== 'win32') {
          resolve({
            success: true,
            hasAdimUserGroup: defaultHasAdminUserGroup,
          });
          return;
        }
        const ADMIN = 'Administrators';
        const groupResult = await execShellByCmd('net localgroup');
        const groupList = groupResult.result;
        const hasAdmin = groupList.find(groupName => groupName.toUpperCase() === ('*' + ADMIN).toUpperCase());
        if (!hasAdmin) {
          resolve({
            success: true,
            hasAdimUserGroup: false,
          });
          return;
        }

        const currentUserResult = await execShellByCmd('whoami');
        if (currentUserResult.success) {
          const currentUser = currentUserResult.result[0];

          const userInfo = { fullName: currentUser, group: '', name: '' };
          const userParts = currentUser.split('\\');
          if (userParts.length) {
            userInfo.group = userParts[0];
            userInfo.name = userParts[1];
          }

          const adminGroupListResult = await execShellByCmd(`net localgroup ${ADMIN}`);
          if (adminGroupListResult.success) {
            const inAdminGroup = adminGroupListResult.result.find(lineVal => {
              const upcaseLineVal = lineVal.toUpperCase();
              return upcaseLineVal === userInfo.fullName.toUpperCase() || upcaseLineVal === userInfo.name.toUpperCase();
            });
            resolve({
              success: true,
              hasAdimUserGroup: !!inAdminGroup,
            });
            return;
          }
        }

        resolve({
          success: true,
          hasAdimUserGroup: defaultHasAdminUserGroup,
        });
      } catch (ex) {
        resolve({
          success: false,
          hasAdimUserGroup: defaultHasAdminUserGroup,
        });
      }
    });
  }

  async getAppMetrics(): Promise<Array<Electron.ProcessMetric>> {
    if (process.platform === 'win32') {
      return app.getAppMetrics();
    }
    if (process.platform === 'darwin') {
      const processMetrics = await app.getAppMetrics();
      const pidArgs = processMetrics.map(process => `-pid ${process.pid}`);
      const topResultStr = await utils.execShellCmd(`top -l 1 -ncols 15 ${pidArgs.join(' ')}`);
      let colNames: Array<string> = [];
      const topPorcessInfoMap: { [key: string]: any } = {};

      topResultStr
        .split('\n')
        .filter(lineStr => {
          if (!lineStr) return false;
          return /^PID\s+/.test(lineStr) || /^[0-9]+\*?\s+/.test(lineStr);
        })
        .forEach((lineStr, inx) => {
          if (inx === 0) {
            colNames = lineStr.split(/\s+/);
          } else {
            const colVals = lineStr.split(/\s+/);
            const info: { [key: string]: string } = {};
            colVals.forEach((colVal, inx) => {
              const colName = colNames[inx];
              if (!colName) return;
              if (colName === 'PID') {
                colVal = Number.parseInt(colVal).toString();
              }
              info[colName] = colVal;
            });
            topPorcessInfoMap[info.PID] = info;
          }
        });
      processMetrics.forEach(processMetric => {
        const { pid } = processMetric;
        const topProcessInfo = topPorcessInfoMap[pid] || {};
        const memoryUsed = Number.parseFloat(topProcessInfo.MEM) * 1024;
        if (!memoryUsed) return;
        // 覆写privateBytes
        processMetric.memory.privateBytes = memoryUsed;
      });
      return processMetrics;
    }
    return [];
  }

  async reLaunchApp() {
    app.relaunch();
    app.exit();
  }

  async getFolderSize(folderPath: string) {
    if (isEdm) {
      return;
    }
    try {
      if (!folderPath || !fs.existsSync(folderPath)) {
        return;
      }
      if (process.platform === 'darwin') {
        const cmd = 'du -d 1 -k';
        const cmdResult = await utils.execShellCmd(cmd, folderPath);
        const cols = ['size', 'dir'];
        const result: Array<IFolderSizeResult> = [];
        cmdResult.split('\n').forEach(lineStr => {
          if (!lineStr) return;
          const colVals = lineStr.split(/\s+/);
          const item: any = {};
          colVals.forEach((part, inx) => {
            const colName = cols[inx];
            item[colName] = part;
          });
          result.push(item);
        });
        return result;
      }
      if (process.platform === 'win32') {
        const cmdStr = `Get-ChildItem -Path '${folderPath}' -Recurse | measure -s Length`;
        const cmdResult = await utils.execShellCmd(cmdStr, null, 'powershell.exe');
        if (!cmdResult) return;
        const cmdResultArr = cmdResult.split('\r\n');
        if (!cmdResultArr || !cmdResultArr.length) {
          return;
        }
        const result: any = {};
        cmdResultArr.forEach(lineStr => {
          if (lineStr && lineStr.toLowerCase().indexOf('sum') === 0) {
            const sizeBytes = Number.parseInt(lineStr.split(':')[1], 10);
            const sizeKb = Math.round(sizeBytes / 1024);
            result.size = sizeKb;
          }
        });
        return [result];
      }
      return;
    } catch (ex) {
      console.error('getFolderSize', ex);
    }
  }

  async getCpuMemInfo() {
    const os = require('os');
    const cpuInfos = os.cpus();
    const res = { cpu: { name: '', coreNum: 0 }, memory: { total: 0, free: 0 } };
    if (cpuInfos && cpuInfos.length) {
      const firstCpu = cpuInfos[0];
      res.cpu.name = firstCpu.model;
      res.cpu.coreNum = cpuInfos.length;
    }

    const totalMemNum = utils.getNumInGB(os.totalmem());
    const freeMemNum = utils.getNumInGB(os.freemem());
    if (totalMemNum || freeMemNum) {
      res.memory.total = totalMemNum;
      res.memory.free = freeMemNum;
    }
    return res;
  }

  async getIsInApplicationFolder() {
    if (process.platform === 'darwin') {
      return app.isInApplicationsFolder();
    }
    return true;
  }

  async getIsRunningUnderRosetta() {
    if (process.platform === 'darwin') {
      return app.runningUnderARM64Translation;
    }
    return false;
  }

  private getCrashInfoPath() {
    return path.join(userDataPath, './window-crash-info.json');
  }

  async deleteWinCrashInfos() {
    try {
      const path = this.getCrashInfoPath();
      fs.unlinkSync(path);
      return true;
    } catch (ex) {
      this.writeCatchError('deleteWinCrashInfos-catch', ex);
      return false;
    }
  }

  async getWindowCrashInfos(): Promise<Array<IWindowCrashInfo>> {
    try {
      const path = this.getCrashInfoPath();
      if (fs.existsSync(path)) {
        const content = fs.readFileSync(path, crashEncodingParam).toString();
        const existArr = JSON.parse(content);
        return existArr;
      }
      return [];
    } catch (ex) {
      this.writeCatchError('getWindowCrashInfos-catch', ex);
      return [];
    }
  }

  async writeWindowCrashInfo(info: IWindowCrashInfo) {
    try {
      const existInfos = await this.getWindowCrashInfos();
      const encodingParam = { encoding: 'utf8' };
      existInfos.push(info);
      const path = this.getCrashInfoPath();
      fs.writeFileSync(path, JSON.stringify(existInfos), crashEncodingParam);
      return true;
    } catch (ex) {
      this.writeCatchError('writeWindowCrashInfo-error', ex);
      return false;
    }
  }

  async crashMainProcess() {
    process.crash();
  }

  async getUploadedReports() {
    try {
      const reports = crashReporter.getUploadedReports();
      return reports;
    } catch (ex) {
      this.writeCatchError('getUploadedReports-error', ex);
      return [];
    }
  }

  async getLastCrashReport() {
    try {
      const lastCrashReport = crashReporter.getLastCrashReport();
      return lastCrashReport;
    } catch (ex) {
      this.writeCatchError('getLastCrashReport-error', ex);
      return null;
    }
  }
}

export const appManage = new appManageImpl();
