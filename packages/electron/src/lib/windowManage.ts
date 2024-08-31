import { OpenDialogOptions } from 'electron';
import type { WinType } from 'env_def';
import { ipcChannelManage } from './ipcChannelManage';
// import * as remote from '@electron/remote';
import {
  CommonWinRequestParam,
  CreateWindowReq,
  CreateWindowRes,
  ExchangeData,
  ExchangeDataListener,
  LocalStorageType,
  OpenFileListener,
  ResponseWinInfo,
  WinCloseParams,
  WindowHooksCallback,
  WindowHooksEventData,
  WindowHooksObserverConf,
  WindowManage,
  WindowManageRenderer,
  IRemoveBrowserViewParam,
  ICreateBrowserViewParam,
} from '../declare/WindowManage';
import { FsSaveDialogOptions, FsSaveRes, FsSelectRes } from '../declare/FsManage';

const debugLibWinManager = true;
// import { AbstractManager } from '../main/abstractManager';
class windowManageImpl implements WindowManage, WindowManageRenderer {
  // winId?: number;
  // win?: BrowserWindow;
  constructor() {
    // this.getCurrentWindow();
  }

  async getCurWindow(): Promise<ResponseWinInfo | undefined> {
    return this.getWinInfo(0);
  }

  async prepareWindow(url: WinType): Promise<void> {
    await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'prepareWindow',
      params: url,
    });
  }

  async openExternalUrl(url: string): Promise<void> {
    await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'openExternalUrl',
      params: url,
    });
  }

  addExchangeDataListener(lts: ExchangeDataListener) {
    const channelName = ipcChannelManage.rendererDataExchangeChannel;
    ipcChannelManage.removeListener(channelName);
    ipcChannelManage.receive({
      channel: channelName,
      listener: async data => {
        const win = await this.getCurWindow();
        if (win) {
          return await lts({
            webId: win?.webId,
            eventName: ipcChannelManage.rendererDataExchangeEvent,
            data,
          });
        }
        return Promise.reject('窗口不存在');
      },
    });
  }

  addOpenFileListener(listener: OpenFileListener): any {
    const channelName = ipcChannelManage.openEmilFileEvent;
    ipcChannelManage.removeListener(channelName);
    return ipcChannelManage.receive({
      channel: channelName,
      listener: filePaths => listener(filePaths),
    });
  }

  async setHooksConfig(params: WindowHooksObserverConf[]) {
    // const win = await this.getCurrentWindow();
    // params.observerWinId = params.observerWinId || -1;
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'setHooksConfig',
        hookParam: params,
      } as CommonWinRequestParam,
    });
  }

  addHooksListener(
    // conf: WindowHooksObserverConf,
    // sendTo: SendToWindow,
    callbacks: WindowHooksCallback
  ) {
    // this.setHooksConfig(conf).then();
    this.removeHooksListener();
    ipcChannelManage.receive({
      channel: 'window-hooks',
      listener: async (res: WindowHooksEventData) => {
        console.log('hooks event received!!!', res);
        const { data, hooksName, winId, extData } = res;
        const handle = callbacks[hooksName!];
        handle && handle(winId, data, extData);
      },
    });
  }

  removeHooksListener() {
    ipcChannelManage.removeListener('window-hooks');
  }

  async clearLocalData(type?: LocalStorageType): Promise<void> {
    // const win = await this.getCurrentWindow();
    // const options = type ? { storages: [type] } : {};
    return await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'clearLocalData',
      params: type,
    });
  }

  reload(winId?: number) {
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'reload',
      } as CommonWinRequestParam,
    });
  }

  async getWinInfo(winId: number): Promise<ResponseWinInfo | undefined> {
    const res = await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'getWinInfo',
      } as CommonWinRequestParam,
    });
    console.log('[electron] getWinInfo', res);
    return res as ResponseWinInfo;
  }

  async getPrimaryScreen(): Promise<Electron.Display> {
    const res = await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'getPrimaryScreen',
      } as CommonWinRequestParam,
    });
    console.log('[electron] getPrimaryScreen', res);
    return res;
  }

  async getWinBounds(winId?: number): Promise<Electron.Rectangle> {
    const res = await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'getWinBounds',
      } as CommonWinRequestParam,
    });
    return res;
  }

  async createWindow(params: CreateWindowReq): Promise<CreateWindowRes> {
    // params.parent = this.winId;
    // params.sendTo = params.sendTo || 'parent';
    // if (params.callbacks) {
    //   params.hooks = Object.keys(params.callbacks) as CreateWindowReq['hooks'];
    //   this.addHooksListener(params.callbacks, params.sendTo);
    //   delete params.callbacks;
    // }
    const res = await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'createWindow',
        createParam: params,
      } as CommonWinRequestParam,
    });
    return res as CreateWindowRes;
  }

  async openWindow(url: string): Promise<boolean> {
    const res = await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'openWindow',
      params: url,
    });
    return Boolean(res);
  }

  async prepareAllWindow(): Promise<void> {
    return await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'prepareAllWindow',
      params: undefined,
    });
  }

  async testMainWindowAlive(): Promise<boolean> {
    return await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'testMainWindowAlive',
      params: undefined,
    });
  }

  async closeAllWindowExceptMain(force?: boolean): Promise<void> {
    console.log('!!do close other window!!', force);
    return await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'closeAllWindowExceptMain',
      params: force,
      // quit: force,
    });
  }

  async exchangeData(req: ExchangeData) {
    let { id } = req;
    const win = await this.getCurWindow();
    if (!id) {
      if (win) {
        id = win.parent;
      } else {
        // id = AbstractManager.winIdMap[-1]?.id;
      }
    }
    if (!id) {
      console.warn('error occurred for exchage data', req);
      return;
    }
    // const win = await this.getCurrentWindow();
    if (win) {
      ipcChannelManage.sendTo({
        id,
        channel: ipcChannelManage.rendererDataExchangeChannel,
        data: {
          webId: win?.webId,
          eventName: ipcChannelManage.rendererDataExchangeEvent,
          data: req.data,
        },
      });
    } else {
      console.warn('未找到窗口');
    }
  }

  setTitle(title: string): void {
    ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'setTitle',
        data: title,
      } as CommonWinRequestParam,
    });
  }

  async setSize(data: { width: number; height: number }): Promise<void> {
    ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'setSize',
        data: JSON.stringify(data),
      },
    });
  }

  async setPosition(data: { x: number; y: number }): Promise<void> {
    ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'setPosition',
        data: JSON.stringify(data),
      },
    });
  }

  async setBounds(data: Electron.Rectangle): Promise<void> {
    ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'setBounds',
        data: JSON.stringify(data),
      },
    });
  }

  async isVisible(winId?: number): Promise<boolean | undefined> {
    const ret = await this.getWinInfo(winId || 0);
    return ret ? ret.isVisible : undefined;
  }

  async isFullScreen(winId?: number): Promise<boolean | undefined> {
    const ret = await this.getWinInfo(winId || 0);
    return ret ? ret.isFullScreen : undefined;
  }

  async isFocused(winId?: number): Promise<boolean | undefined> {
    const ret = await this.getWinInfo(winId || 0);
    return ret ? ret.isFocused : undefined;
  }

  // reliableShow(winId: number) {
  //   const win = remote.BrowserWindow.fromId(winId);
  //   if (win) {
  //     win.show();
  //     return !0;
  //   }
  //   return false;
  // }

  // 窗口从不可看，最小化，不聚焦
  show(winId?: number) {
    if (debugLibWinManager) {
      console.trace('[electron lib] show winid:', winId);
    }
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'show',
      } as CommonWinRequestParam,
    });
  }

  // 窗口闪烁
  flashFrame(winId?: number): Promise<boolean | undefined> {
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'flashFrame',
      } as CommonWinRequestParam,
    });
  }

  // 隐藏窗口
  hide(winId?: number) {
    if (debugLibWinManager) {
      console.trace('[electron lib] hide winid:', winId);
    }
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'hide',
      } as CommonWinRequestParam,
    });
  }

  hideForClose(params: WinCloseParams = {}): void {
    ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'hideForClose',
        closeParam: params,
      } as CommonWinRequestParam,
    });
  }

  // 退出窗口
  close(params: WinCloseParams = {}) {
    if (debugLibWinManager) {
      console.trace('[electron lib] close winid:', params);
    }
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'close',
        closeParam: params,
      } as CommonWinRequestParam,
    });
  }

  invalidate(winId?: number) {
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'invalidate',
      } as CommonWinRequestParam,
    });
  }

  // 窗口最小化
  minimize(winId?: number) {
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'minimize',
      } as CommonWinRequestParam,
    });
  }

  // 窗口最大化
  maximize(winId?: number) {
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'maximize',
      } as CommonWinRequestParam,
    });
  }

  // 退出最大化
  unmaximize(winId?: number) {
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'unmaximize',
      } as CommonWinRequestParam,
    });
  }

  // 切换最大化
  toggleMaximize(winId?: number) {
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'toggleMaximize',
      } as CommonWinRequestParam,
    });
  }

  // 切换全屏
  toggleFullScreen(winId?: number) {
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'toggleFullScreen',
      } as CommonWinRequestParam,
    });
  }

  // 将最小化的窗口恢复为之前的状态
  restore(winId?: number) {
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'restore',
      } as CommonWinRequestParam,
    });
  }

  // 开启或者关闭开发者模式
  toggleDevTools(winId?: number) {
    return ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId,
        funcName: 'toggleDevTools',
      } as CommonWinRequestParam,
    });
  }

  // 开启所有的开发控制台
  // openAllDevTools() {
  //   // remote.BrowserWindow.getAllWindows().forEach((win: BrowserWindow) => {
  //   //   win.webContents.openDevTools({ mode: 'right' });
  //   // });
  // }

  async saveDialog(config: FsSaveDialogOptions): Promise<FsSaveRes> {
    const res = ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'saveDialog',
        dailogParam: {
          save: config,
        },
      } as CommonWinRequestParam,
    });
    return res;
  }

  async select(config: OpenDialogOptions): Promise<FsSelectRes> {
    const res = ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'select',
        dailogParam: {
          select: config,
        },
      } as CommonWinRequestParam,
    });
    return res;
  }

  async setCookieToSpecificDomain(url: string): Promise<string> {
    const res = ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'setCookieToSpecificDomain',
        data: url,
      } as CommonWinRequestParam,
    });
    return res;
  }

  async getAllWinInfo(): Promise<ResponseWinInfo[]> {
    return (await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'getAllWinInfo',
      params: [],
    })) as ResponseWinInfo[];
  }

  async createBrowserView(param: ICreateBrowserViewParam) {
    return (await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'createBrowserView',
      params: param,
    })) as { viewId: number };
  }

  async removeBrowserView(param: IRemoveBrowserViewParam) {
    return (await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'removeBrowserView',
      params: param,
    })) as undefined;
  }

  async flushAllSession() {
    return (await ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'flushAllSession',
      params: [],
    })) as undefined;
  }

  async setMainWindowZoomFactor(val: number) {
    const res = ipcChannelManage.invoke({
      channel: 'browserInvoke',
      functionName: 'dispatch',
      params: {
        winId: 0,
        funcName: 'setMainWindowZoomFactor',
        data: val,
      },
    });
    return res;
  }
}

export const windowManage = new windowManageImpl();
