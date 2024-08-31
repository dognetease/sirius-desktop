import { app, BrowserWindow, dialog, ipcMain, OpenDialogOptions, Rectangle, RenderProcessGoneDetails, shell, BrowserView, screen } from 'electron';
import debounce from 'lodash/debounce';
import path from 'path';
import utils from './utils';
import type { WinType } from 'env_def';
import {
  CommonWinRequestParam,
  CreateWindowReq,
  CreateWindowRes,
  HookAndInterceptorObj,
  ICreateBrowserViewParam,
  IRemoveBrowserViewParam,
  LocalStorageType,
  ResponseWinInfo,
  WinCloseParams,
  WindowHooksName,
  WindowHooksObserverConf,
  WindowManage,
  WindowManageHandle,
  WindowManageHandleType,
  WinInfo,
  WinTypeDef,
} from '../declare/WindowManage';
import { isMac, isWeb, webURL, QIYEURL } from './config';
import { IpcMainChannelManage, IpcRendererRes } from '../declare/IpcChannelManage';
// import { config } from 'env_def';
// import {fsManage} from './fsManage';
import { getDownloadPath, storeManage } from './storeManage';
import { FsSaveDialogOptions, FsSaveRes, FsSelectRes } from '../declare/FsManage';
import { AbstractManager } from './abstractManager';
import { interceptManage } from './NetManage';
import { util } from '../util';
import { getIsUpdatingQuit } from './app-state';
import { fsManage } from './fsManage';
import { appManage } from './appManage';

function logToFile(message: string) {
  fsManage.writeToLogFile({ data: message });
}

import { stage, host, profile } from 'envDef';
// type WinInfoHolder={
//   type:WinType,
//   id: number,
//   webId: number,
//   isMain:boolean,
//   win:BrowserWindow,
//   parent:number,
//   children: WinInfoHolder[],
//   isInterceptClose: false,
type Protocol = 'http' | 'https' | 'file' | 'ftp';
// }
/**
 * 窗口功能
 * */
type URLParsed = {
  url: string;
  protocol: Protocol;
  domain: string;
  port: number;
  path: string;
  query: string;
  hash: string;
};
const UrlPattern = /^((?:https?)|(?:file)|(?:ftp)):\/\/\/?([a-z0-9_\-.]{0,100})(:[0-9]{2,5})?\/?([a-z0-9_\-.\/]*)(?:\?([^#?\\\/]+))?(?:#(.*))?$/i;
// const parseQuery(query:string):{}{
//
// }
const parseUrl = (url: string): URLParsed | undefined => {
  const exec = UrlPattern.exec(url);
  if (exec) {
    const [whole, protocol, domain, port, path, query, hash] = exec;
    return {
      url: whole,
      protocol,
      domain,
      port: Number(port),
      path,
      query,
      hash,
    } as URLParsed;
  }
  return undefined;
};

const MEMORY_SESSION_PREFIX = 'memory';

class windowManageImpl extends AbstractManager implements WindowManage, WindowManageHandle, IpcMainChannelManage {
  host: string = host;
  // debug: boolean = stage != 'prod' && (
  //   config('debug') == 'true' || stage == 'local'
  // );

  showDevToolsList: WinType[] = ['bkLogin', 'main', 'bkStable'];

  sessionNames: Set<string> = new Set();

  constructor() {
    super();
    this.initIpcChannel();
  }

  async createBrowserView(createParam: ICreateBrowserViewParam) {
    const { winId, req } = createParam;
    const win = BrowserWindow.fromId(winId);
    if (!win) {
      return Promise.reject(new Error(`${winId} not exist.`));
    }
    const { type, url: reqUrl, sessionName } = req;
    const item = this.winTypeMap[type];
    const { webUrl, url: prodUrl, option } = item;

    const pageUrl = reqUrl && reqUrl.length > 0 ? reqUrl : isWeb ? webUrl : prodUrl;
    const webPreferences = { ...this.commonWebPreferences, ...(option?.webPreferences || {}) };
    if (sessionName) {
      const session = this.getSession(sessionName);
      interceptManage.initFileIntercept(sessionName);
      webPreferences.session = session;
    }

    const view = new BrowserView({ webPreferences });
    win.addBrowserView(view);
    const winBounds = win.getBounds();
    view.setBounds({
      x: 0,
      y: 0,
      width: winBounds.width,
      height: winBounds.height,
    });
    await view.webContents.loadURL(pageUrl);
    // todo test code
    if (true || this.debug) {
      view.webContents.openDevTools();
    }
    const { browserViewId } = AbstractManager;
    AbstractManager.browserViewIdMap[browserViewId] = view;
    AbstractManager.browserViewId++;
    return {
      viewId: browserViewId,
      webId: view.webContents.id,
    };
  }

  async removeBrowserView(removeParam: IRemoveBrowserViewParam) {
    const { winId, viewId } = removeParam;
    const win = BrowserWindow.fromId(winId);
    if (!win) {
      throw new Error(`${winId} not exist.`);
    }

    const browserView = AbstractManager.browserViewIdMap[viewId];
    if (!browserView) {
      throw new Error(`${viewId} not exist.`);
    }

    win.removeBrowserView(browserView);
    AbstractManager.browserViewIdMap[viewId] = null;
  }

  async createWindow(req: CreateWindowReq): Promise<CreateWindowRes> {
    try {
      AbstractManager.windowCreating = true;
      const { type } = req;
      const winType = this.winTypeMap[type];
      // 只要调用createWindow就更新创建信息
      logToFile(`${type} - lastCreateTime: ${new Date().getTime()}`);
      storeManage.setWindowCreateInfos(type, { lastCreateTime: new Date().getTime() });
      let curWin;
      winType.preparedWindow = winType.preparedWindow || [];
      if (winType && (curWin = winType.preparedWindow.pop())) {
        console.log(
          'window status:',
          /* winType.usedWindow?.map(it => it.id), */ winType.preparedWindow.map(it => it.id)
        );
        // winType.usedWindow = winType.usedWindow || [];
        // winType.usedWindow.push(curWin);
        const { win } = curWin;
        return {
          success: true,
          winId: win.id,
          webId: win.webContents.id,
        };
      }
      if (winType.singleInstance) {
        const curWin = Object.values(AbstractManager.winIdMap).find(item => item.type === type);
        if (curWin) {
          if (!req.manualShow) this.show(curWin.id);
          return {
            success: true,
            winId: curWin.id,
            webId: curWin.webId,
          };
        }
      }
      const createWindowRet = await this.doCreateWindow(req);
      console.log('[electron] create window', createWindowRet);
      return createWindowRet;
    } catch (ex: any) {
      this.writeLog('createWindow error catch', { message: ex.message, stack: ex.stack });
      // const { type } = req;
      // if (type === 'main') {
      //   dialog.showMessageBoxSync({
      //     message:'应用主窗口创建失败，大多数情况下是因为本地配置导致的，是否清空本地配置(这不会影响到您的邮箱账号及数据)？'
      //   })
      // }
      return Promise.reject(ex);
    }
  }

  setMainWindowZoomFactor(winId: number, val: number) {
    const window = BrowserWindow.fromId(winId);
    if (window) {
      let zoomVal: number = val;
      if (!val) {
        zoomVal = 1;
      } else {
        if (val < 0) {
          zoomVal = 1;
        }
      }
      window.webContents.setZoomFactor(zoomVal);
    }
    return true;
  }

  private handlePageZoom(windowOps: Electron.BrowserWindowConstructorOptions, type: WinType) {
    if (!type || type === 'customer' || type === 'about') {
      return;
    }
    const zoomVal = storeManage.getAppZoomVal();
    if (!zoomVal || zoomVal <= 0 || zoomVal === 1) {
      return;
    }
    if (!windowOps.webPreferences) {
      windowOps.webPreferences = {};
    }
    windowOps.webPreferences.zoomFactor = zoomVal;
    if (zoomVal < 1) {
      if (windowOps.minWidth) {
        windowOps.minWidth = Number.parseInt((windowOps.minWidth * zoomVal).toString());
      }
      if (windowOps.minHeight) {
        windowOps.minHeight = Number.parseInt((windowOps.minHeight * zoomVal).toString());
      }
      if (windowOps.width) {
        windowOps.width = Number.parseInt((windowOps.width * zoomVal).toString());
      }
      if (windowOps.height) {
        windowOps.height = Number.parseInt((windowOps.height * zoomVal).toString());
      }
    }
  }

  // eslint-disable-next-line max-statements
  async doCreateWindow(req: CreateWindowReq): Promise<CreateWindowRes> {
    const { type, hooks, url: reqUrl, sessionName, manualShow, haveJquery, bounds: reqBounds } = req;
    const isMain = type === 'main';
    const parent = isMain ? -1 : req.parent || -1;
    const item = this.winTypeMap[type];
    let { webUrl, url: prodUrl, option, setMainWindowCookie, failUrl, failWebUrl } = item;
    let isSameWinTypeExist = false;
    if (!reqBounds) {
      const bounds = storeManage.getBounds(type);
      if (bounds) {
        option = Object.assign(option, { width: bounds.width, height: bounds.height });
        const allWinInfo = await this.getAllWinInfo();
        isSameWinTypeExist = allWinInfo.some(item => item.type === type && item.isVisible);
        console.log('isSameWinTypeExist:', isSameWinTypeExist, ' type:', type);
      }
    } else {
      option = Object.assign(option, {
        x: reqBounds.x,
        y: reqBounds.y,
        width: reqBounds.width,
        height: reqBounds.height,
      });
    }
    // 图片位置在当前主窗口
    const mainWinInfo = this.getMainWinInfo();
    if (type !== 'main' && type !== 'bkInit' && type !== 'bkStable' && !isSameWinTypeExist && !reqBounds) {
      const mainBounds = mainWinInfo?.win.getBounds();
      const windowCounts = Object.keys(AbstractManager.webIdMap).length;
      const dis = windowCounts * 30;
      if (mainBounds) {
        option = Object.assign(option, { x: mainBounds.x! + dis, y: mainBounds.y! + dis });
      }
    }
    const originUrl = reqUrl && reqUrl.length > 0 ? reqUrl : isWeb ? webUrl : prodUrl;
    const windowOps = { ...this.defaultConfig, ...(option || {}) };
    if (type !== 'customer' && (!item.sessions || item.sessions != 'default')) {
      windowOps.webPreferences = Object.assign(windowOps.webPreferences, this.commonWebPreferences);
    }
    if (sessionName) {
      console.log('download [main] create session', sessionName);
      const session = this.getSession(sessionName);
      interceptManage.initFileIntercept(sessionName);
      windowOps.webPreferences = Object.assign(windowOps.webPreferences, { session, partition: undefined });
      console.log('[win] change win ', sessionName);
      this.sessionNames.add(sessionName);
    }
    if (haveJquery) {
      windowOps.webPreferences || (windowOps.webPreferences = {});
      windowOps.webPreferences.nodeIntegration = false;
    }
    if (manualShow) {
      windowOps.show = false;
    }
    console.log('create window of ', type, windowOps, req, option);
    this.handlePageZoom(windowOps, type);
    if (windowOps.frame === false) {
      delete windowOps['titleBarStyle'];
    }
    const win = new BrowserWindow(windowOps);
    // const image = nativeImage.createFromPath(appIconPath)
    // win.setOverlayIcon(image,'');
    const winId = win.id;
    const webId = win.webContents.id;
    const curWin: WinInfo = {
      type,
      id: winId,
      webId,
      isMain,
      win,
      parent,
      children: [],
      isQuit: false,
      hooks: new Map<WindowHooksName, HookAndInterceptorObj>(),
      sessionName: req.sessionName,
      // interceptor: new Map<WindowHooksName, WindowHooksObserverConf>(),
      // interceptor:req.hooks
    };
    this.assembleHookAndIntercept(curWin, hooks);
    // this.assembleHookAndIntercept(true, curWin, interceptor);
    const newCurWin = Object.assign(curWin, AbstractManager.winIdMap[winId] || {});
    AbstractManager.winIdMap[winId] = newCurWin;
    AbstractManager.webIdMap[webId] = newCurWin;
    if (isMain) {
      // curWin.id = -1;
      AbstractManager.winIdMap[-1] = newCurWin;
    } else {
      const parentWin = AbstractManager.winIdMap[parent];
      if (parentWin && parentWin.children) {
        parentWin.children.push(winId);
      }
      if (req.setMainWindowCookie || setMainWindowCookie) {
        console.log('set cookie of main window');
        if (mainWinInfo) {
          await this.setCookieFromMain({
            curWin,
            url: originUrl,
            specifyDomain: req.specifyCookieDomain,
            srcWin: mainWinInfo,
          });
        }
      }
    }
    try {
      const url = req.additionalParams ? this.buildUrl(originUrl, req.additionalParams) : originUrl;
      console.log('[main] [windowManage] before loadUrl open devtools debug:', this.debug, ' isWeb:', isWeb, ' url:', url, '\n', req);
      this.writeLog('__create_window', { isWeb, url, req }).then();
      if (this.debug) {
        win.webContents.openDevTools({ mode: 'detach', activate: this.showDevToolsList.includes(type) });
        console.log('__extensions', profile, stage, win.webContents.session.getAllExtensions());
      }
      await win.loadURL(url);
      console.log('[main] [windowManage] load url finish ', url);
      this.bindListener(curWin.id);
    } catch (error) {
      console.log('createWindow Error', error);
      this.writeLog('__create_window_error_caught', { error }).then();
      if ((error as any)?.code === 'ERR_ABORTED' || ((error as any)?.code === 'ERR_FAILED' && AbstractManager.windowCreateRetry < 5)) {
        const newUrl = isWeb ? failWebUrl : failUrl;
        console.log('[main] [windowManage] ', newUrl);
        AbstractManager.windowCreateRetry += 1;
        if (newUrl) {
          AbstractManager.windowCreating = true;
          // setTimeout(() => {
          this.writeLog('__create_Window_Error_rebuild', { newUrl }).then();
          req.url = newUrl;
          setTimeout(() => {
            try {
              win.close();
            } catch (ex) {
              console.warn(ex);
            }
          }, 50);
          return this.createWindow(req);
          // }, 0);
        }
        return {
          success: false,
          winId: -1,
          webId: -1,
        };
      }
      return Promise.reject(error);
    }
    const winRes = {
      success: true,
      winId: win.id,
      webId,
    };
    if (req.forPrepare) {
      this.addPreparedWin(winRes, item);
    } else {
    }
    item.allWindowCount = item.allWindowCount ? item.allWindowCount + 1 : 1;
    AbstractManager.windowCreating = false;
    AbstractManager.windowCreateRetry = 0;
    return winRes;
  }

  private addPreparedWin(winRes: { winId: number }, item: WinTypeDef) {
    item.preparedWindow = item.preparedWindow || [];
    if (winRes && winRes.winId && item.prepareCount && item.prepareCount > 0) {
      const winIdMapElement = AbstractManager.winIdMap[winRes.winId];
      if (winIdMapElement && winIdMapElement.win) {
        const maxCount = item.maxPreparedCount || item.prepareCount;
        if (item.preparedWindow.length < maxCount) {
          item.preparedWindow.push(winIdMapElement);
        }
      }
    }
  }

  setHooksConfig(ps: WindowHooksObserverConf[]) {
    ps.forEach(params => {
      const winId = params.targetWinId;
      if (winId && AbstractManager.winIdMap[winId]) {
        const win = AbstractManager.winIdMap[winId];
        this.assembleHookAndIntercept(win, [params]);
      }
    });
    // win.hooks = Object.assign(win.hooks || {}, params.hooks);
    //
    // AbstractManager.winIdMap[winId]! = win;
  }

  handleHooks(hooksName: WindowHooksName, curWin: WinInfo, data?: any): boolean {
    // const sendToWinInfo = curWin.sendTo === 'parent' ? AbstractManager.winIdMap[curWin.parent] : curWin;
    let ignoreSelfCall = false;
    if (curWin.hooks && curWin.hooks.has(hooksName)) {
      const instance = curWin.hooks.get(hooksName);
      console.log(
        'hooksName!!!',
        hooksName,
        {
          winid: curWin.id,
          webId: curWin.webId,
          hooks: JSON.stringify(instance),
        },
        data
      );
      this.writeLog('hooks_trigger', { hook: hooksName, data, instance }).then();
      if (instance) {
        // 此处判断是否被拦截并返回拦截结果，如果返回true,则事件处理应preventDefault，阻止事件继续执行
        if (
          instance.interceptors &&
          instance.interceptors.enable &&
          !curWin.isQuit &&
          !curWin.win.isDestroyed() &&
          curWin.win.webContents &&
          !curWin.win.webContents.isDestroyed()
        ) {
          try {
            curWin.win.webContents.send('window-hooks', {
              winId: curWin.id,
              hooksName,
              data,
              extData: instance.interceptors.hooksEventExtraData,
            });
          } catch (e) {
            console.warn(e);
          }
          console.log('[electron] hooks interceptor occured', hooksName, instance.interceptors);
          return true;
        }
        ignoreSelfCall = !!instance.interceptors && !instance.interceptors.enable;

        // const winIdSet: Set<number> = new Set<number>();
        // 遍历发送给所有关注此窗口变化的窗口
        instance.hooks &&
          instance.hooks.size > 0 &&
          instance.hooks.forEach(it => {
            if (it && it.observerWinId && it.observerWinId != curWin.id) {
              const sendToWinInfo = AbstractManager.winIdMap[it.observerWinId];
              if (sendToWinInfo && !sendToWinInfo.win.isDestroyed() && !sendToWinInfo.win.webContents.isDestroyed() && !sendToWinInfo.isQuit) {
                try {
                  sendToWinInfo.win.webContents.send('window-hooks', {
                    winId: curWin.id,
                    hooksName,
                    data,
                    extData: it.hooksEventExtraData,
                  });
                } catch (e) {
                  console.warn(e);
                }
              }
              // winIdSet.add(it.observerWinId);
            }
          });
      }
    }

    const instance = curWin.hooks.get(hooksName);
    // 默认发给自己
    const selfConf = instance && instance.hooks.get(curWin.id);
    if (!ignoreSelfCall) {
      // setTimeout(() => {
      if (curWin && !curWin.win.isDestroyed() && curWin.win.webContents && !curWin.win.webContents.isDestroyed() && !curWin.isQuit) {
        try {
          curWin.win.webContents.send('window-hooks', {
            winId: curWin.id,
            hooksName,
            data,
            exData: selfConf ? selfConf.hooksEventExtraData : undefined,
          });
        } catch (e) {
          console.warn(e);
        }
      }
      // }, 0);
    }
    return false;
  }

  bindListener(id: number) {
    const curWin = AbstractManager.winIdMap[id];
    const { win, type, hooks, webId } = curWin;
    const winType = this.winTypeMap[type];
    win.on('show', () => {
      const hooksName = 'onShow';
      this.handleHooks(hooksName, curWin);
    });
    win.on('hide', () => {
      const hooksName = 'onHide';
      this.handleHooks(hooksName, curWin);
    });
    win.on('focus', () => {
      const hooksName = 'onActive';
      this.handleHooks(hooksName, curWin);
      win.flashFrame(false);
    });
    win.on('blur', () => {
      const hooksName = 'onBlur';
      this.handleHooks(hooksName, curWin);
      // win.flashFrame(false);
    });
    // TODO will-download
    win.on(
      'will-resize',
      debounce((event: Event, bounds: Rectangle) => {
        console.log('[main] windowManage resize', bounds);
        const hooksName = 'onResize';
        storeManage.setBounds(type, bounds);
        if (windowManage.handleHooks(hooksName, curWin, bounds)) {
          event.preventDefault();
        }
      }, 200)
    );
    win.on('moved', () => {
      const bounds = win.getBounds();
      console.log('[main] windowManage moved type', type, bounds);
      storeManage.setBounds(type, bounds);
    });
    win.on('close', event => {
      if (getIsUpdatingQuit()) {
        return;
      }
      console.log(id, 'close');
      const hooksName = 'onBeforeClose';
      // if (curWin.hooks.has(hooksName)) {
      // win.show();
      console.log(AbstractManager.winIdMap[id], 'intercept-window-close');
      if (this.handleHooks(hooksName, curWin)) {
        event.preventDefault();
        return;
      }
      const isLowMemoryMode = storeManage.getIsLowMemoryMode();
      // } else {
      const needMorePreparedWin = this.needMorePreparedWin(winType);
      const windowNeeded = !isLowMemoryMode && (!!winType.singleInstance || needMorePreparedWin) && this.testMainWindowAlive();
      if ((type === 'main' || windowNeeded) && !curWin.isQuit) {
        this.hideWin(win);
        if (needMorePreparedWin) {
          this.addPreparedWin({ winId: curWin.id }, winType);
        }
        const hooksName2 = 'onAfterClose';
        console.log('afterclose !! ', id, hooks);
        this.handleHooks(hooksName2, curWin);
        this.updateHookEnableFlag(curWin, hooksName, true);
        event.preventDefault();
      } else {
        curWin.isQuit = true;
      }
      // }
    });
    win.on('closed', () => {
      try {
        const hooksName = 'onAfterClose';
        this.handleHooks(hooksName, curWin);
        // if (winType.usedWindow) winType.usedWindow = winType.usedWindow.filter(it => it.id != id);
        if (curWin.isMain) {
          this.getSession().flushStorageData();
          if (!AbstractManager.windowCreating) app.quit();
        }
        if (curWin.sessionName && !curWin.sessionName.startsWith(MEMORY_SESSION_PREFIX)) {
          this.getSession(curWin.sessionName).flushStorageData();
        }
      } catch (e) {
        console.warn(e);
      } finally {
        delete AbstractManager.winIdMap[id];
        delete AbstractManager.webIdMap[webId];
        const winType = this.winTypeMap[curWin.type];
        if (winType.preparedWindow) {
          winType.preparedWindow = winType.preparedWindow.filter(it => it.id != id);
        }
        winType.allWindowCount = winType.allWindowCount ? winType.allWindowCount - 1 : 0;
      }
    });
    this.bindEventsToWebContents(win.webContents, curWin);
  }

  private hideWin(win: Electron.BrowserWindow) {
    if (isMac && win.isFullScreen()) {
      console.log('[main] windowManage hideWin', win);
      win.setFullScreen(false);
      setTimeout(() => {
        win.hide();
      }, 1000);
    } else {
      win.hide();
    }
  }

  testMainWindowAlive() {
    const mainWinInfo = this.getMainWinInfo();
    const ret = !!mainWinInfo && !!mainWinInfo.win && !mainWinInfo.win.isDestroyed();
    return Promise.resolve(ret);
  }

  private needMorePreparedWin(winType: WinTypeDef) {
    return (
      winType.prepareCount && winType.prepareCount > 0 && winType.preparedWindow && winType.preparedWindow.length < (winType.maxPreparedCount || winType.prepareCount)
    );
  }

  private bindEventsToWebContents(webContents: Electron.WebContents, curWin: WinInfo) {
    // const { interceptor } = curWin;
    webContents.on('before-input-event', (event, input) => {
      const { control, meta, alt, shift, key } = input;
      const canOpenDevTools = (control || meta) && shift && key.toLowerCase() === 'i' && (this.debug || alt);
      canOpenDevTools && this.toggleDevTools(curWin.id) && event.preventDefault();
    });
    webContents.on('did-finish-load', () => {
      const hooksName = 'onAfterLoad';
      this.handleHooks(hooksName, curWin);
    });
    webContents.on('destroyed', () => {
      console.log('destroyed');
    });
    webContents.on('render-process-gone', (ev, detail: RenderProcessGoneDetails) => {
      console.log('render-process-gone', ev);
      this.writeLog('main_process_render_error_caught', { detail }).then();
      try {
        const info = {
          url: webContents.getURL(),
          reason: detail.reason,
          exitCode: String(detail.exitCode || ''),
        };
        appManage.writeWindowCrashInfo(info);
      } catch (ex) {
        this.writeCatchError('gone-writeWindowCrashInfo-catch', ex);
      }
    });
    webContents.on('will-navigate', (ev, url: string) => {
      // 拦截#hd-a 类型的锚点链接，对于这种内部跳转，不打开新窗口
      if (url && url.trim().startsWith('#')) {
        console.log('click Anchor Link: ' + url);
      } else {
        this.openUrlNew(ev, url, curWin);
      }
    });
    webContents.setWindowOpenHandler(details => {
      this.openUrlNew(
        {
          preventDefault: () => {},
        } as Electron.Event,
        details.url,
        curWin
      );
      return { action: 'deny' };
    });
    // webContents.on('new-window', (ev, url, frame) => {
    //   console.log('new-window', frame);
    //   this.openUrlNew(ev, url, curWin);
    //   // if (!this.canOpen(url)) {
    //   //   console.log('blocking!', event);
    //   //   event.preventDefault();
    //   // }
    //   // if (url.startsWith('http') && url.indexOf(webURL) === -1/*url.indexOf(this.host) < 0*/) {
    //   //   console.log('open browser!', event);
    //   //   event.preventDefault();
    //   //   if(hooks.includes('onOpenExternalUrl')){
    //   //
    //   //   }else {
    //   //     this.openExternalUrl(url);
    //   //   }
    //   // }
    // });
    webContents.on('did-frame-finish-load', (ev: Event, isMain: boolean, frameProcessId: number, frameRoutingId: number) => {
      console.log('did-frame-finish-load', !ev);
      this.writeLog('main_process_render_load_finish', { isMain, frameProcessId, frameRoutingId }).then();
    });
  }

  private openUrlNew(
    ev: Electron.Event,
    url: string,
    // hooks: WindowHooksName[],
    curWin: WinInfo
  ) {
    console.log('got navigate event:', url, ev.type, curWin.id, curWin.webId);
    this.writeLog('electron-navigate', { url, winId: curWin?.id, type: ev.type }).then();
    if (!this.canOpen(url)) {
      console.log('blocking!', ev);
      this.writeLog('electron-navigate-blocked', { url, winId: curWin?.id }).then();
      ev.preventDefault();
      return;
    }
    if (url.startsWith('sirius')) {
      return;
    }
    if (url.startsWith('http') /* && !isWeb */) {
      if (url.startsWith(webURL) || url.indexOf(QIYEURL) !== -1) {
        return;
      }
      console.log('open browser!', url);
      ev.preventDefault();
      const hookName = 'onOpenExternalUrl';
      // if (hooks.includes(hookName)) {
      this.handleHooks(hookName, curWin, url);
      // } else {
      //   this.openExternalUrl(url);
      // }
    } else {
      ev.preventDefault();
      this.openExternalUrl(url);
    }
  }

  private canOpen(url: string) {
    let res =
      url.startsWith('http') ||
      url.startsWith('mailto') ||
      url.startsWith('file') ||
      url.startsWith('cache') ||
      url.startsWith('sirius') ||
      url.startsWith('ctrprint') ||
      url.startsWith('ftp');
    try {
      const urlObj = new URL(url);
      console.log('get url checked ', urlObj);
    } catch (e) {
      res = false;
    }
    return res;
  }

  openExternalUrl(url: string) {
    // Windows 中文file协议的url需要特殊方式打开
    const decodeUrl = decodeURIComponent(url);
    if (!isMac && url.startsWith('file:') && /[\u4e00-\u9fa5]/.test(decodeUrl)) {
      try {
        utils.execShellCmd(`start ${decodeUrl}`);
        return Promise.resolve();
      } catch (error) {
        this.writeLog('jump_url_failed_in_electron_bycmd', { error, url }).then();
      }
    }
    return shell
      .openExternal(url)
      .then()
      .catch(reason => {
        this.writeLog('jump_url_failed_in_electron', { reason, url }).then();
        console.log('open external url failed', reason);
      });
  }

  // 打开网页链接
  async openWindow(url: string): Promise<boolean> {
    const res = await shell.openExternal(url);
    return Boolean(res);
  }

  isVisible(winId?: number): Promise<boolean> {
    return Promise.resolve(this.isVisibleSync(winId));
  }

  isVisibleSync(winId?: number): boolean {
    const win = this.getWindow(winId);
    if (win) {
      return win.isVisible();
    }
    return false;
  }

  isMinimizedSync(winId?: number): boolean {
    const win = this.getWindow(winId);
    if (win) {
      return win.isMinimized();
    }
    return false;
  }

  getWinInfo(winId: number): ResponseWinInfo | undefined {
    const info = this.getWin(winId);
    let ret;
    if (info) {
      ret = {
        type: info.type,
        id: info.id,
        webId: info.webId,
        parent: info.parent,
        children: info.children,
        isFocused: info.win.isFocused(),
        isVisible: info.win.isVisible(),
        isFullScreen: info.win.isFullScreen(),
        hooks: this.toHooksArray(info.hooks),
        isMaximized: info.win.isMaximized(),
        isOffscreen: info.win.webContents.isOffscreen(),
        isPainting: info.win.webContents.isPainting(),
        getFrameRate: info.win.webContents.getFrameRate(),
        sessionName: info.sessionName,
      } as ResponseWinInfo;
    } else {
      ret = undefined;
    }
    return ret;
  }

  // 窗口从不可看，最小化，不聚焦
  show(winId?: number): boolean {
    const win = this.getWindow(winId);
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      }
      win.show();
      console.log('[win] window showed', win.id);
      return true;
    }
    return false;
  }

  // 窗口闪烁
  flashFrame(winId?: number): void {
    const win = this.getWindow(winId);
    if (win) {
      win.flashFrame(true);
    }
  }

  toggle(winId?: number) {
    const win = this.getWindow(winId);
    if (win) {
      if (!win.isVisible()) {
        win.show();
      } else {
        win.hide();
      }
    }
  }

  hideForClose(param: WinCloseParams) {
    console.log(param);
    return Promise.resolve(true);
  }

  // 隐藏窗口
  hide(winId?: number) {
    const win = this.getWindow(winId);
    if (win) {
      console.log('[win] window hide', win.id);
      this.hideWin(win);
    }
  }

  // 退出窗口
  close(params: WinCloseParams) {
    const winId = params.winId || -1;
    const { force } = params;
    const { quit } = params;
    const winInfo = AbstractManager.winIdMap[winId];
    if (!winInfo) {
      return false;
    }
    const { win } = winInfo;

    winInfo.isQuit = quit;
    if (force || quit) {
      console.log('close remove onBeforeClose');
      this.updateHookEnableFlag(winInfo, 'onBeforeClose', false);
      // win.close();
      // delete abstractManager.winIdMap[winId];
    } /* else if (winInfo.isMain) {
     if (isMac && win.isFullScreen()) {
     win.setFullScreen(false);
     setTimeout(() => {
     win.hide();
     }, 200);
     }
     win.hide();
     } */
    // else {
    win.close();
    // }
    return true;
  }

  private updateHookEnableFlag(winInfo: WinInfo, hookName: WindowHooksName, flag: boolean) {
    if (winInfo.hooks.has(hookName)) {
      const instance = winInfo.hooks.get(hookName);
      if (instance && instance.interceptors) {
        instance.interceptors.enable = flag;
      }
    }
  }

  // 窗口最小化
  minimize(winId?: number) {
    const win = this.getWindow(winId);
    if (win) {
      win.minimize();
    }
  }

  // 窗口最大化
  maximize(winId?: number) {
    const win = this.getWindow(winId);
    if (win) {
      win.maximize();
    }
  }

  // 退出最大化
  unmaximize(winId?: number) {
    const win = this.getWindow(winId);
    if (win) {
      win.unmaximize();
    }
  }

  // 切换最大化
  toggleMaximize(winId?: number) {
    const win = this.getWindow(winId);
    if (win) {
      console.log('[main] windowManage ,toggleMaximize', win.isMaximized());
      win.isMaximized() ? win.unmaximize() : win.maximize();
    }
  }

  // 切换全屏
  toggleFullScreen(winId?: number) {
    const win = this.getWindow(winId);
    if (win) {
      if (isMac) {
        win.setFullScreen(!win.isFullScreen());
      } else {
        win.isMaximized() ? win.unmaximize() : win.maximize();
      }
    }
  }

  // 将最小化的窗口恢复为之前的状态
  restore(winId?: number) {
    const win = this.getWindow(winId);
    if (win) {
      win.restore();
    }
  }

  // 开启或者关闭开发者模式
  toggleDevTools(winId?: number) {
    const win = this.getWindow(winId);
    if (win) {
      win.webContents.toggleDevTools();
    }
  }

  reliableShow(id: number) {
    const win = BrowserWindow.fromId(id);
    if (win) {
      win.show();
      return !0;
    }
    return false;
  }

  async select(config: OpenDialogOptions): Promise<FsSelectRes> {
    config = config || {};
    config.defaultPath = config.defaultPath || getDownloadPath();
    const res = await dialog.showOpenDialog(config);
    return {
      path: res.filePaths,
      success: !res.canceled,
    };
  }

  async saveDialog(config: FsSaveDialogOptions): Promise<FsSaveRes> {
    config = config || {};
    const { fileName } = config;
    const title = fileName ? 'Custom File Type' : 'All Files';
    const ext = fileName ? path.extname(fileName) : '.';
    if (!config.defaultPath) {
      const realName = util.setDownloadFileName(getDownloadPath(), fileName, ext);
      config.defaultPath = getDownloadPath() + (realName ? '/' + realName : '');
    }
    const filters = [
      {
        name: title,
        extensions: [ext.split('.')[1] || '*'],
      },
    ];
    if (config.filters?.length) {
      config.filters = filters.concat(config.filters);
    } else {
      config.filters = filters;
    }
    const mainWinId = this.getMainWinInfo()?.id;
    const win = this.getWindow(config.openAsMainWindow ? mainWinId : config.winId);
    if (win) {
      const res = await dialog.showSaveDialog(win, config);
      if (!res.canceled && res.filePath) {
        storeManage.set('app', 'downloadPath', path.dirname(res.filePath));
      }
      return {
        path: res.filePath || '',
        success: !res.canceled,
      };
    }
    return {
      path: '',
      success: false,
    };
  }

  async closeAllWindowExceptMain(force?: boolean): Promise<void> {
    console.log('!!do close other window!!', force);
    const mainWindow = this.getMainWinInfo();
    if (mainWindow) {
      for (const key in AbstractManager.winIdMap) {
        if (AbstractManager.winIdMap.hasOwnProperty(key)) {
          const winInfo = AbstractManager.winIdMap[key];
          if (winInfo && winInfo.win && !winInfo.isMain) {
            console.log('!!do close other window : ' + winInfo.type + ' ' + winInfo.id, force);
            if (force) {
              console.log('closeAllWindowExceptMain remove onBeforeClose');
              winInfo.hooks.delete('onBeforeClose');
              winInfo.isQuit = true;
            }
            winInfo.win.close();
          }
        }
      }
    }
  }

  reload(winId: number): void {
    const win = this.getWindow(winId);
    if (win) {
      win.reload();
    }
  }

  invalidate(winId: number): void {
    const win = this.getWindow(winId);
    if (win) {
      win.webContents.invalidate();
    }
  }

  async clearLocalData(type?: LocalStorageType): Promise<void> {
    const win = this.getWindow();
    if (win) {
      const options = type ? { storages: [type] } : {};
      await win.webContents.session.clearStorageData(options);
    }
    return Promise.resolve();
  }

  async setCookieToSpecificDomain(winId: number, url: string): Promise<string> {
    const winIdMapElement = AbstractManager.winIdMap[winId];
    const window = winIdMapElement && winIdMapElement.win ? winIdMapElement.win : BrowserWindow.getFocusedWindow();
    if (window) {
      await this.transferCookies({
        winFrom: window,
        winTo: window,
        url,
      });
    }
    return 'done';
  }

  private async setCookieFromMain(options: { curWin: WinInfo; srcWin: WinInfo; url: string; specifyDomain?: string }) {
    const { curWin, srcWin, url, specifyDomain } = options;
    if (!curWin || !srcWin || !curWin.win || !srcWin.win) {
      return;
    }
    const winFrom = srcWin.win;
    const winTo = curWin.win;
    await this.transferCookies({
      winFrom,
      winTo,
      url,
      specifyDomain,
    });
  }

  private async transferCookies(options: { winFrom: Electron.BrowserWindow; winTo: Electron.BrowserWindow; url: string; specifyDomain?: string }) {
    const { winFrom, winTo, url, specifyDomain } = options;
    const cookies = await this.getCookieFromCookieJar(winFrom.webContents.session.cookies, undefined);
    if (this.debug) {
      console.log('got cookies from main ,', cookies);
    }
    if (cookies && cookies.length > 0) {
      const parseUrl1 = parseUrl(url);
      if (this.debug) {
        console.log('parse url got ', parseUrl1);
      }
      if (parseUrl1) {
        const { protocol, domain, port } = parseUrl1;
        const newUrl = protocol + '://' + domain + (port ? ':' + port : '') + '/';
        await this.setCookieToCookieJar({
          cookies,
          cookieJar: winTo.webContents.session.cookies,
          url: newUrl,
          domain: specifyDomain || domain,
        });
      }
    }
  }

  async prepareWindow(type: WinType) {
    const item = this.winTypeMap[type];
    const mainWindow = this.getMainWinInfo();
    if (mainWindow) {
      const parent = mainWindow.win.id;
      this.doPrepareWinItem(item, type, parent, true);
    }
  }

  async prepareAllWindow() {
    const mainWindow = this.getMainWinInfo();
    if (mainWindow) {
      const parent = mainWindow.win.id;
      /* for (let key in this.winTypeMap) */
      Object.keys(this.winTypeMap).forEach((key, i) => {
        if (this.winTypeMap.hasOwnProperty(key)) {
          const item = this.winTypeMap[key as WinType];
          // 5秒钟启动一个窗口
          setTimeout(() => {
            this.doPrepareWinItem(item, key, parent);
          }, i * 5000);
        }
      });
    }
  }

  private doPrepareWinItem(item: WinTypeDef, key: string, parent: number, forcePrepare?: boolean) {
    if (item.prepareCount && item.prepareCount > 0) {
      item.preparedWindow = item.preparedWindow || [];
      let condition = (item.allWindowCount || 0) < item.prepareCount && ((item.autoPrepare || 0) >= 1 || forcePrepare);
      if (!forcePrepare) {
        if (item.lastCreateOutDateTime) {
          const lastCreateInfo = storeManage.getWindowCreateInfos(key as WinType);
          if (!lastCreateInfo) {
            logToFile(`doPrepareWinItem：${key} - lastCreateInfo is null, do not create!`);
            condition = false;
          } else {
            const lastCreateTime = lastCreateInfo.lastCreateTime || 0;
            const nowTs = new Date().getTime();
            if (lastCreateTime + item.lastCreateOutDateTime < nowTs) {
              logToFile(`doPrepareWinItem：${key} - lastCreateOutDateTime out of date, do not create!`);
              condition = false;
            }
          }
        }
      }
      if (condition) {
        for (let i = 0; i < item.prepareCount; ++i) {
          this.doCreatePrepareWindow(key, parent)
            .then()
            .catch(e => {
              console.warn(e);
            });
          if (item.autoPrepare == 1) break; // 设置该标志位标识每次只prepare一个窗口
          if ((item.allWindowCount || 0) >= item.prepareCount) break; // prepare的窗口不应该超过总共应prepare的窗口总数
        }
      }
    }
    // return i;
  }

  private async doCreatePrepareWindow(key: string, parent: number) {
    const windowRes = await this.createWindow({
      type: key as WinType,
      parent,
      forPrepare: true,
      manualShow: true,
    } as CreateWindowReq);
    if (windowRes && windowRes.winId) {
      this.hide(windowRes.winId);
    }
    console.log('prepare win for type ' + key, windowRes);
  }

  getAllWinInfo(): Promise<ResponseWinInfo[]> {
    const re: ResponseWinInfo[] = [];
    const allWindows = BrowserWindow.getAllWindows();
    const winids: Set<number> = new Set<number>(allWindows.map(it => it.id));
    const delId: string[] = [];
    // for (let winIdMapKey in AbstractManager.winIdMap)
    Object.keys(AbstractManager.winIdMap).forEach((winIdMapKey: string) => {
      // if (AbstractManager.winIdMap.hasOwnProperty(winIdMapKey) && AbstractManager.winIdMap[winIdMapKey]) {
      const item = AbstractManager.winIdMap[Number(winIdMapKey)];
      if (winids.has(item.id)) {
        re.push({
          id: item.id,
          isMain: item.isMain,
          children: Array.from(item.children),
          parent: item.parent,
          type: item.type,
          webId: item.webId,
          isFocused: item.win.isFocused(),
          isVisible: item.win.isVisible(),
          isFullScreen: item.win.isFullScreen(),
        } as ResponseWinInfo);
      } else {
        delId.push(winIdMapKey);
      }
      // }
    });
    if (delId.length > 0) {
      delId.forEach((it: string) => {
        const element = AbstractManager.winIdMap[Number(it)];
        if (element) {
          delete AbstractManager.webIdMap[Number(element.webId)];
          delete AbstractManager.winIdMap[Number(it)];
        }
      });
    }
    return Promise.resolve(re);
  }

  getCurWindow(id: number): ResponseWinInfo | undefined {
    return this.getWinInfo(id);
  }

  initIpcChannel() {
    // ipcMain.on(
    //   'browser',
    //   (
    //     event,
    //     functionName: WindowManageType,
    //     args,
    //   ) => {
    //     windowManage[functionName](args as number & string & WindowHooksParams);
    //   },
    // );
    ipcMain.handle('browserInvoke', async (event, functionName: WindowManageHandleType, args) => {
      const selfId = event.sender.id;
      const curWin = AbstractManager.webIdMap[selfId];
      let func;
      if (curWin) {
        if (functionName == 'dispatch' && args) {
          const param = args as CommonWinRequestParam;
          const winId = param.winId || curWin.id;
          switch (param.funcName) {
            case 'setCookieToSpecificDomain':
              if (param.data) {
                return { data: await this.setCookieToSpecificDomain(winId, param.data) };
              }
              break;
            case 'prepareWindow':
              if (param.data) {
                return { data: await this.prepareWindow(param.data as WinType) };
              }
              break;
            case 'select':
              if (param.dailogParam && param.dailogParam.select) {
                const data2 = await this.select(param.dailogParam.select);
                return { data: data2 };
              }
              break;
            case 'saveDialog':
              if (param.dailogParam && param.dailogParam.save) {
                param.dailogParam.save.winId = param.dailogParam.save.winId || winId;
                const data3 = await this.saveDialog(param.dailogParam.save);
                return { data: data3 };
              }
              break;
            case 'createWindow':
              if (param.createParam) {
                param.createParam.parent = param.createParam.parent || winId;
                const data4 = await this.createWindow(param.createParam);
                return { data: data4 };
              }
              break;
            case 'close':
              if (param.closeParam) {
                param.closeParam.winId = param.closeParam.winId || winId;
                const data5 = await this.close(param.closeParam);
                return { data: data5 };
              }
              break;
            case 'hideForClose':
              if (param.closeParam) {
                param.closeParam.winId = param.closeParam.winId || winId;
                const data6 = await this.hideForClose(param.closeParam);
                return { data: data6 };
              }
              break;
            case 'setHooksConfig':
              if (param.hookParam && param.hookParam.length > 0) {
                param.hookParam.map(hookParam => {
                  hookParam.observerWinId = hookParam.observerWinId > 0 ? hookParam.observerWinId : winId;
                  hookParam.targetWinId = hookParam.targetWinId || winId;
                  return hookParam;
                });
                this.setHooksConfig(param.hookParam);
                return { data: undefined };
              }
              break;
            case 'setTitle':
              if (param.data) {
                return { data: this.setTitle(winId, param.data) };
              }
              break;
            case 'setMainWindowZoomFactor':
              if (param.data) {
                return { data: this.setMainWindowZoomFactor(winId, Number.parseFloat(param.data!)) };
              }
              break;
            case 'setSize':
              if (param.data) {
                return { data: this.setSize(winId, param.data) };
              }
              break;
            case 'setPosition':
              if (param.data) {
                return { data: this.setPosition(winId, param.data) };
              }
              break;
            case 'setBounds':
              if (param.data) {
                return { data: this.setBounds(winId, param.data) };
              }
              break;
            default:
              /**
               * toggleDevTools,restore,reload,toggleMaximize,unmaximize,maximize,minimize,hide,show,flashFrame,getWinInfo 等只需要一个winid的函数均会走此分支
               * */
              func = this[param.funcName as keyof windowManageImpl] as Function;
              const data1 = await func.apply(this, [winId]);
              return { data: data1 };
          }
        }
        func = this[functionName] as Function;
        const data = await func.apply(this, [args]);
        return { data } as IpcRendererRes;
      }
      return { data: undefined };
    });
  }

  /**
   * fake method , just for define
   * @param params
   */
  dispatch(params: CommonWinRequestParam): Promise<any> {
    return Promise.resolve(params);
  }

  setTitle(winId: number, data: string) {
    const win = this.getWindow(winId);
    if (win) {
      win.setTitle(data);
    }
    return true;
  }

  setSize(winId: number, data: string) {
    const win = this.getWindow(winId);
    if (win) {
      const obj = JSON.parse(data);
      win.setSize(Number(obj.width), Number(obj.height));
    }
    return true;
  }

  setPosition(winId: number, data: string) {
    const win = this.getWindow(winId);
    if (win) {
      const obj = JSON.parse(data);
      win.setPosition(Number(obj.x), Number(obj.y));
    }
    return true;
  }

  setBounds(winId: number, data: string) {
    const win = this.getWindow(winId);
    if (win) {
      const obj = JSON.parse(data);
      win.setBounds(obj);
    }
    return true;
  }

  async getPrimaryScreen() {
    const primaryDisplay = screen.getPrimaryDisplay();
    return primaryDisplay;
  }

  async getWinBounds(winId?: number) {
    const win = this.getWindow(winId);
    if (win) {
      const bounds = win.getBounds();
      return bounds;
    }
  }

  private assembleHookAndIntercept(
    // isHooks: boolean,
    curWin: WinInfo,
    hooks: WindowHooksObserverConf[] | undefined
  ) {
    if (!hooks) {
      return;
    }
    hooks.forEach(it => {
      if (it) {
        it.targetWinId = curWin.id;
        const { hooksName } = it;
        const obj = curWin.hooks.get(hooksName) || ({ hooks: new Map<number, WindowHooksObserverConf>(), interceptors: undefined } as HookAndInterceptorObj);
        if (!it.intercept) {
          obj.hooks.set(it.observerWinId, it);
        } else if (it.observerWinId === curWin.id) {
          it.enable = true;
          if (!it.hookObjName) {
            console.warn('[win] intercept no name wont set', it);
          } else {
            console.warn('[win] interceptor set ', it);
            obj.interceptors = it;
          }
        }
        curWin.hooks.set(hooksName, obj);
      }
    });
  }

  private toHooksArray(hooks: Map<WindowHooksName, HookAndInterceptorObj>) {
    const ret = [] as WindowHooksObserverConf[];
    hooks.forEach(v => {
      if (v.hooks && v.hooks.size > 0) {
        ret.push(...v.hooks.values());
      }
      if (v.interceptors) {
        ret.push(v.interceptors);
      }
    });
    return ret;
  }

  private buildFormQueryContent(data: Record<string, string>) {
    let ret = '';
    let first = true;
    // for (const i in data)
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(i => {
        if (typeof data[i] !== 'undefined') {
          if (first) {
            first = false;
          } else {
            ret += '&';
          }
          ret = ret + i + '=' + String(data[i]);
        }
      });
    }
    return ret;
  }

  private buildUrl(url: string, additionalParams: Record<string, string>) {
    const hasParam = url.indexOf('?') > 0;
    if (hasParam && !url.endsWith('&')) {
      url += '&';
    }
    if (!hasParam) {
      url += '?';
    }
    return url + this.buildFormQueryContent(additionalParams);
  }

  flushAllSession() {
    try {
      //默认session的flushStorageData
      this.getSession().flushStorageData();
      if (this.sessionNames && this.sessionNames.size) {
        for (const sessionName of this.sessionNames.keys()) {
          if (!sessionName.startsWith(MEMORY_SESSION_PREFIX)) {
            this.getSession(sessionName).flushStorageData();
          }
        }
      }
    } catch (ex: any) {
      fsManage.writeLog('flushAllSession-error', ex.message);
    }
  }
}

export const windowManage = new windowManageImpl();
