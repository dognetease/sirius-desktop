import { DownloadManage } from 'src/declare/downloadManage';
// import { WinType } from 'env_def';
import { AppManage, AppManageRender, ClipboardInterface, CookieStore, PathTypeName } from '../declare/AppManage';
import {
  CreateWindowReq,
  CreateWindowRes,
  ExchangeDataListener,
  OnActiveFunc,
  ResponseWinInfo,
  SimpleWinInfo,
  WindowEventData,
  WindowEventListener,
  WindowEventReceive,
  WindowHooksCallback,
  WindowHooksName,
  WindowHooksObserverConf,
  WindowManage,
  WindowManageRenderer,
} from '../declare/WindowManage';
import { FsDownloadConfig, FsManage, FsManageHandle, FsManageHandleType, FsManageRenderer, FsSelectRes } from '../declare/FsManage';
import { IpcChannelManage } from '../declare/IpcChannelManage';
import { windowManage } from './windowManage';
import { appManage } from './appManage';
import { fsManage } from './fsManage';
import { ipcChannelManage } from './ipcChannelManage';
import { env } from './env';
import { StoreManageRender, StoreManageFuncNames, YMStoreModuleName } from '../declare/StoreManage';
import { storeManageImpl } from './storeManage';
import { bridgeManageImpl } from './bridgeManage';
import { bridgeWorkerImpl } from './bridgeWorkerManage';
import { WorkerBridgeMange, MasterBridgeManage } from '../declare/BridgeManage';
import { downloadManage } from './downloadManage';

// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = String(0)
export interface Env {
  isMac: boolean;
  userDataPath: string;
  version: string;
  showVersion: string;
  stage: string;
}

export interface Lib {
  env: Env;
  appManage: AppManage & AppManageRender;
  windowManage: WindowManage & WindowManageRenderer;
  fsManage: FsManage & FsManageHandle & FsManageRenderer;
  ipcChannelManage: IpcChannelManage;
  storeManage: StoreManageRender;
  masterBridgeManage: MasterBridgeManage;
  workerBridgeManage: WorkerBridgeMange;
  downloadManage: DownloadManage;
}

class libImpl implements Lib {
  env: Env;

  appManage: AppManage & AppManageRender;

  windowManage: WindowManage & WindowManageRenderer;

  fsManage: FsManage & FsManageHandle & FsManageRenderer;

  ipcChannelManage: IpcChannelManage;

  storeManage: StoreManageRender;

  masterBridgeManage: MasterBridgeManage;

  workerBridgeManage: WorkerBridgeMange;

  downloadManage: DownloadManage;

  constructor() {
    this.appManage = appManage;
    this.windowManage = windowManage;
    this.fsManage = fsManage;
    this.downloadManage = downloadManage;
    this.ipcChannelManage = ipcChannelManage;
    this.env = env;
    this.storeManage = storeManageImpl;

    this.masterBridgeManage = bridgeManageImpl;
    this.workerBridgeManage = bridgeWorkerImpl;

    this.appManage.getPath('userData').then(rs => {
      this.env.userDataPath = rs;
    });
    window.addEventListener(
      'keydown',
      e => {
        if (e.keyCode === 73 && (e.metaKey || e.ctrlKey) && e.shiftKey && (this.env.stage !== 'prod' || e.altKey)) {
          console.log('open devtools');
          this.windowManage.toggleDevTools();
        }
        if ((e.metaKey || e.ctrlKey) && e.keyCode === 87 && !e.shiftKey && !e.altKey) {
          this.windowManage.close();
        }
      },
      false
    );
  }
}

export {
  PathTypeName,
  WindowEventListener,
  WindowEventData,
  ExchangeDataListener,
  WindowEventReceive,
  CreateWindowRes,
  // WinType,
  SimpleWinInfo,
  FsSelectRes,
  FsDownloadConfig,
  FsManageHandleType,
  CookieStore,
  CreateWindowReq,
  OnActiveFunc,
  WindowHooksCallback,
  WindowHooksName,
  ClipboardInterface,
  ResponseWinInfo,
  WindowHooksObserverConf,
  StoreManageRender,
  StoreManageFuncNames,
  YMStoreModuleName,
};
export const electronLib = new libImpl();

try {
  electronLib.storeManage.get('app', 'appPageZoomVal').then(zoomVal => {
    const zoomNum = Number(zoomVal);
    electronLib.appManage.setPageZoomValue(zoomNum);
    electronLib.windowManage.setMainWindowZoomFactor(zoomNum);
  });
} catch (ex) {
  console.error('electronLib initZoomPage error: ', ex);
}
declare global {
  interface Window {
    electronLib: Lib;
    siriusVersion: string;
    os: string;
  }
}
