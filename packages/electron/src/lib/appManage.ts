import { clipboard, webFrame, Display, desktopCapturer, PrintToPDFOptions, CrashReport } from 'electron';
import os from 'os';
import { host, domain, stage } from 'envDef';
import {
  AppManage,
  AppManageRender,
  ClipboardInterface,
  CookieStore,
  DeviceInfo,
  GlobalKeyboardMap,
  PathTypeName,
  setCookieParams,
  SystemStatus,
  getSessionCookieParams,
  IWindowCrashInfo,
} from '../declare/AppManage';
import { ipcChannelManage } from './ipcChannelManage';
// import {Session,Electron} from 'electron';
// import * as electron from 'electron';

import { env } from './env';
import { isMac } from '../common/config';
// import * as remote from '@electron/remote';

class appManageImpl implements AppManage, AppManageRender {
  host: string = host as string;
  domain: string = domain as string;

  isAppAutoLaunch(): Promise<boolean> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'isAppAutoLaunch',
      params: undefined,
    });
  }

  setAppAutoLaunch(autoLaunch: boolean): Promise<void> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'setAppAutoLaunch',
      params: autoLaunch,
    });
  }

  getSystemStatus(): Promise<SystemStatus> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getSystemStatus',
      params: undefined,
    });
  }

  isAppLockScreen(): Promise<boolean> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'isAppLockScreen',
      params: undefined,
    });
  }

  quit(force: boolean): void {
    ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'quit',
      params: force,
    });
  }

  copyText(text: string): void {
    ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'copyText',
      params: text,
    });
  }

  setBadgeCount(count: number): void {
    ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'setBadgeCount',
      params: count,
    });
  }

  setTrayTitle(title: string): void {
    ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'setTrayTitle',
      params: title,
    });
  }

  screenCapture(data?: string): void {
    ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'screenCapture',
      params: data || '',
    });
  }

  toggleCaptureScreenAccess(): void {
    ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'toggleCaptureScreenAccess',
      params: undefined,
    });
  }

  getCurrentdWindowBounds(): Promise<{ x: number; y: number; width: number; height: number }> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getCurrentdWindowBounds',
    });
  }

  getAllScreenDisplays(): Promise<Display[]> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getAllScreenDisplays',
    });
  }

  desktopCapturerSources(): Promise<typeof desktopCapturer.getSources> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'desktopCapturerSources',
    });
  }

  getShotScreenImg(screen: Display): Promise<string> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getShotScreenImg',
      params: screen,
    });
  }

  screenCaptureShortcut(data: string): Promise<string> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'screenCaptureShortcut',
      params: data,
    });
  }

  setMinimizeGlobalShortcut(data: string): Promise<string> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'setMinimizeGlobalShortcut',
      params: data,
    });
  }

  getCursorScreenPoint(): Promise<{ x: number; y: number }> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getCursorScreenPoint',
    });
  }

  getClipBoard(): ClipboardInterface {
    return clipboard as ClipboardInterface;
  }

  //检查网络状态
  getNetState(url: string): Promise<string[]> {
    let tasks = [];
    const dns = require('dns');
    tasks.push(
      new Promise((resolve, reject) => {
        dns.lookup(url, { family: 4 }, (err: any, addressV4: string) => {
          if (err) {
            reject('');
          }
          resolve(addressV4);
        });
      })
    );
    tasks.push(
      new Promise((resolve, reject) => {
        dns.lookup(url, { family: 6 }, (err: any, addressV6: string) => {
          if (err) {
            reject('');
          }
          resolve(addressV6);
        });
      })
    );
    tasks.push(
      new Promise((resolve, reject) => {
        dns.resolveAny(url, (err: any, records: object[]) => {
          if (err) {
            resolve('');
          }
          try {
            if (!records || !records.length) {
              resolve('');
            }
            let res = '';
            records.forEach(item => {
              res += [...Object.values(item)].join(' - ') + ',';
            });
            resolve(res);
          } catch (e) {
            resolve('');
          }
        });
      })
    );
    const exec = require('child_process');
    tasks.push(
      new Promise((resolve, reject) => {
        //区分系统
        if (env.isMac) {
          exec.exec(`traceroute  -w 1 -m 20 ${url}`, { timeout: 10000 }, (err: any, stdout: string) => {
            resolve(stdout);
          });
        } else {
          exec.exec(`tracert  -w 1000 -h 20 ${url}`, { timeout: 10000 }, (err: any, stdout: string) => {
            resolve(stdout);
          });
        }
      })
    );
    return Promise.all(tasks as []);
  }

  getCookieStore(domain?: string): Promise<CookieStore[]> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getCookieStore',
      params: domain,
    });
    /*const cookieJar = remote.session.defaultSession.cookies;
     domain = domain || this.domain;
     return cookieJar.get(domain ? { domain } : { domain: this.domain }).then((res: Cookie[]) => {
     const ret: CookieStore[] = [];
     if (res && res.length > 0) {
     res.forEach(it => {
     ret.push(Object.assign({}, it) as CookieStore);
     });
     }
     return ret;
     });*/
  }

  clearCookieStore(sessionName?: string): Promise<void> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'clearCookieStore',
      params: sessionName,
    });
  }

  hideCurrentWindow() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'hideCurrentWindow',
    });
  }

  setOpacityShowCurrentWindow() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'setOpacityShowCurrentWindow',
    });
  }

  getSessionCookieStore(params: getSessionCookieParams): Promise<CookieStore[]> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getSessionCookieStore',
      params: params,
    });
  }

  setCookieStore(params: setCookieParams | setCookieParams['cookies'], sessionName?: string): Promise<void> {
    let cookieParams: setCookieParams;
    if (Array.isArray(params)) {
      cookieParams = {
        cookies: params,
      };
    } else {
      cookieParams = params;
    }
    if (sessionName) {
      cookieParams.sessionName = sessionName;
    }
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'setCookieStore',
      params: cookieParams,
    });
    /*const cookieJar = remote.session.defaultSession.cookies;
     console.log('will set cookie:', cookies);
     if (cookies && cookies.length > 0) {
     const cookieStorePromise = cookies.reduce(((promise: Promise<void>, cur: CookieStore) => {
     const setCookie = () => {
     const newVar = {
     url: this.host,
     name: cur.name,
     value: cur.value,
     httpOnly: !!cur.hostOnly,
     secure: !!cur.secure,
     path: cur.path || '/'
     } as CookiesSetDetails;
     if (cur.domain) {
     newVar.domain = cur.domain;
     }
     if (cur.sameSite) {
     newVar.sameSite = cur.sameSite;
     }
     if (cur.expirationDate) {
     newVar.expirationDate = cur.expirationDate;
     }
     console.log('###! set cookie:', newVar);
     return cookieJar.set(newVar).catch((ex:any) => {
     console.warn(ex);
     return Promise.resolve();
     });
     };
     return promise.then(() => {
     return setCookie();
     }).catch((reason) => {
     console.warn(reason);
     return setCookie();
     });
     }), Promise.resolve());
     return cookieStorePromise;
     }
     return Promise.reject('参数错误，需要传入需设置的cookie');*/
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    const netObj = os.networkInterfaces();
    let _deviceId: string = '';
    const _device = this.getDevice();
    const _systemVersion = process.getSystemVersion();
    const _system = isMac ? 'mac' : 'windows';
    const user = process.env.USER;
    const _deviceName = (user ? user + '的' : '') + (isMac ? 'MacOS' : 'Windows');
    if (netObj) {
      Object.values(netObj).forEach(item => {
        if (item) {
          item.forEach((item2: any) => {
            if (item2.mac !== '00:00:00:00:00:00' && !item2.internal) {
              _deviceId += item2.mac;
            }
          });
        }
      });
    }
    const _appName = await this.getName();
    const stageVal = stage as string;
    _deviceId += '_' + _appName + '_' + stageVal;
    console.warn('_deviceId!!!!', _deviceId);
    return {
      p: 'sirius',
      _deviceId,
      _device,
      _systemVersion,
      _system: _system,
      _manufacturer: isMac ? 'Apple' : 'other',
      _deviceName,
      _appName,
    };
  }

  getDevice() {
    let name = os.hostname();
    if (name.endsWith('.local')) {
      name = name.split('.local')[0];
    }
    return name;
  }

  getName(): Promise<string> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getName',
      params: undefined,
    });
  }

  getPath(name: PathTypeName): Promise<string> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getPath',
      params: name,
    });
  }
  getGlobalKeyboard(): Promise<GlobalKeyboardMap> {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getGlobalKeyboard',
      params: undefined,
    });
  }
  setGlobalKeyboard(params: GlobalKeyboardMap) {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'setGlobalKeyboard',
      params,
    });
  }

  setUpdateFeedURL(info: { url: string; channel?: string }) {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'setUpdateFeedURL',
      params: info,
    });
  }

  setAutoInstallOnAppQuit(val: boolean) {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'setAutoInstallOnAppQuit',
      params: val,
    });
  }

  getUpdateFeedURL() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getUpdateFeedURL',
      params: undefined,
    });
  }

  checkForUpdates() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'checkForUpdates',
      params: undefined,
    });
  }

  downloadUpdate() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'downloadUpdate',
      params: undefined,
    });
  }

  quitAndInstallUpdate() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'quitAndInstallUpdate',
      params: undefined,
    });
  }

  async getWinUserHasAdminUserGroup() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getWinUserHasAdminUserGroup',
      params: undefined,
    });
  }

  getAppMetrics() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getAppMetrics',
      params: undefined,
    });
  }

  reLaunchApp() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'reLaunchApp',
      params: undefined,
    });
  }

  getFolderSize(folderPath: string) {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getFolderSize',
      params: folderPath,
    });
  }

  getCpuMemInfo() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getCpuMemInfo',
      params: undefined,
    });
  }

  getIsInApplicationFolder() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getIsInApplicationFolder',
      params: undefined,
    });
  }

  getIsRunningUnderRosetta() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getIsRunningUnderRosetta',
      params: undefined,
    });
  }

  setAppAutoLaunchToTray(val: boolean) {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'setAppAutoLaunchToTray',
      params: val,
    });
  }

  setPageZoomValue(val: number) {
    try {
      let zoomNum = val;
      if (zoomNum < 0) {
        zoomNum = 1;
      }
      webFrame.setZoomFactor(zoomNum);
    } catch (ex) {
      console.error('setPageZoomValue-Error: ', ex);
    }
  }

  printToPdf(options: PrintToPDFOptions) {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'printToPdf',
      params: options,
    }) as Promise<{ filePath: string }>;
  }

  async deleteWinCrashInfos() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'deleteWinCrashInfos',
      params: undefined,
    }) as Promise<boolean>;
  }

  async getWindowCrashInfos() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getWindowCrashInfos',
      params: undefined,
    }) as Promise<Array<IWindowCrashInfo>>;
  }

  async writeWindowCrashInfo() {
    console.error('writeWindowCrashInfo not implement in render process');
    return false;
  }

  async crashMainProcess() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'crashMainProcess',
      params: undefined,
    });
  }

  async getUploadedReports() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getUploadedReports',
      params: undefined,
    }) as Promise<Array<CrashReport>>;
  }

  async getLastCrashReport() {
    return ipcChannelManage.invoke({
      channel: 'appCall',
      functionName: 'getLastCrashReport',
      params: undefined,
    }) as Promise<CrashReport>;
  }
}

export const appManage = new appManageImpl();
