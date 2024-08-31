import { Rectangle } from 'electron';
import { WinType } from 'env_def';

export type YMStoreModuleName = 'window' | 'app' | 'account' | 'user' | 'performanceLog' | 'bridge' | 'event' | 'download' | 'memory';

export type WindowStoreBounds = {
  [props in WinType]?: Partial<Rectangle>;
};

export interface IWindowCreateInfo {
  lastCreateTime: number;
}

export type WindowCreateInfos = {
  [props in WinType]: IWindowCreateInfo;
};

export interface WindowStoreData {
  bounds: WindowStoreBounds;
  createInfos?: WindowCreateInfos;
  [props: string]: any;
}

export interface AppStoreData {
  autoLaunch: boolean;
  downloadPath: string;
  initAccount: string | undefined;
  autoLaunchToTray: boolean;
  isTransferToAutoLaunch: boolean;
  appPageZoomVal: number;
  [props: string]: any;
}

export type AccountItemDef = {
  sessionName: string;
  isDefault?: boolean;
};

export interface UserStoreData {
  account: Record<string, AccountItemDef>;
  current?: string;
  currentSession?: string;
  lowMemoryMode?: boolean;
  useSystemProxy?: boolean;
  useInProcessGPU?: boolean;
  useSystemProxyType?: SYSTEM_PROXY_TYPES;
}

export interface BridgeStoreDataItem {
  winId: number;
  webId: number;
  winName: string;
  markId: string;
}

export type WindowStoreDataKey = keyof WindowStoreData;
export type AppStoreDataKey = keyof AppStoreData;
export type UserStoreDataKey = keyof UserStoreData;
export type StoreDataKey = WindowStoreDataKey | AppStoreDataKey | UserStoreDataKey;

export interface StoreData {
  window: WindowStoreData;
  app: AppStoreData;
  user: UserStoreData;
  account: Record<string, string>;
  performanceLog: Record<string, any>;
  bridge: Record<string, BridgeStoreDataItem>;
  event: Record<string, any>;
  download: Record<string, any>;
  memory: Record<string, any>;
}

export interface StoreManageRender {
  get(moduleName: YMStoreModuleName, attr?: StoreDataKey): Promise<any>;

  set(moduleName: YMStoreModuleName, attr: StoreDataKey, value: any): Promise<void>;
}

export type StoreManageFuncNames = keyof StoreManageRender;

export type SYSTEM_PROXY_TYPES = 'systemProxy-useDirect' | 'systemProxy-useSystem' | 'systemProxy-smartProxy';

export interface StoreManage {
  InitData: StoreData;

  get(moduleName: YMStoreModuleName, attr: StoreDataKey): any;

  get(moduleName: 'window', attr: 'bounds'): WindowStoreBounds;

  set(moduleName: YMStoreModuleName, attr: StoreDataKey, value: any): void;

  set(moduleName: 'window', attr: 'bounds', value: WindowStoreBounds): void;

  setBounds(type: WinType, value: Partial<Rectangle>): void;

  getBounds(type: WinType): Partial<Rectangle> | undefined;

  setLowMemoryMode(val: boolean): void;

  getIsLowMemoryMode(): boolean;

  getIsUseSystemProxy(): boolean;

  getIsUseINProcessGPU(): boolean;

  getSystemProxyType(): SYSTEM_PROXY_TYPES;

  setSystemProxyType(type: string): void;

  setHasTransferAutoLaunch(val: boolean): void;

  getHasTransferAutoLaunch(): boolean;

  getAppZoomVal(): number;
}
