import fse from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { ipcMain, Rectangle } from 'electron';
import { WinType } from 'env_def';
import { userDataPath } from './config';
import {
  UserStoreData,
  AppStoreData,
  StoreDataKey,
  StoreManage,
  StoreManageFuncNames,
  WindowStoreData,
  YMStoreModuleName,
  IWindowCreateInfo,
  SYSTEM_PROXY_TYPES,
} from '../declare/StoreManage';
// import {fsManage} from './fsManage';
import { AbstractManager, getDefaultDownloadPath } from './abstractManager';

const debugStoreManager = false;
const LOW_MEMORY_MODE_KEY = 'lowMemoryMode';
const SYSTEM_TYPE_KEY = 'useSystemProxyType';
const USE_SYSTEM_PROXY_KEY = 'useSystemProxy';
const USE_IN_PROCESS_GPU = 'useInProcessGPU';
const IS_TRANSFER_AUTOLAUNCH = 'isTransferToAutoLaunch';
const APPPAGE_ZOOMKEY = 'appPageZoomVal';
class StoreManageImpl extends AbstractManager implements StoreManage {
  InitPath: any = {
    window: path.join(userDataPath, 'config/window.yaml'),
    app: path.join(userDataPath, 'config/app.yaml'),
    user: path.join(userDataPath, 'config/user.yaml'),
  };

  constructor() {
    super();
    this.initStoreFile('window');
    this.initStoreFile('app');
    this.initStoreFile('user');
  }

  initStoreFile(moduleName: YMStoreModuleName) {
    const filePath = this.InitPath[moduleName];
    let storeData = this.InitData[moduleName];
    try {
      const isExists = fse.pathExistsSync(filePath);
      if (isExists) {
        const yamlData = fse.readFileSync(filePath, 'utf8');
        if (!yamlData) {
          this.storeFile(moduleName, storeData);
          return;
        }
        const fileStoreData = yaml.load(yamlData, { json: true }) as WindowStoreData | AppStoreData;
        // console.log('[main] storeData', storeData)
        const storeDataMerged = Object.assign(storeData || {}, fileStoreData || {});

        if (moduleName === 'window') this.InitData[moduleName] = storeDataMerged as WindowStoreData;
        else if (moduleName === 'app') this.InitData[moduleName] = storeDataMerged as AppStoreData;
        else if (moduleName === 'user') this.InitData[moduleName] = storeDataMerged as UserStoreData;
      } else {
        this.storeFile(moduleName, storeData);
      }
    } catch (e) {
      this.storeFile(moduleName, storeData);
      this.writeLog('__caught_exception_when_load_conf', { e }).then();
    }
  }

  set(moduleName: YMStoreModuleName, attr: StoreDataKey, value: any) {
    if (debugStoreManager) console.log('[main] [store] set', moduleName, attr, value);
    this.storeFile(moduleName, {
      [attr]: value,
    });
  }

  storeFile(moduleName: YMStoreModuleName, data: any) {
    if (debugStoreManager) console.log('[main] data ' + moduleName, '\n', this.InitData[moduleName], '\n', data);
    this.InitData[moduleName] = { ...this.InitData[moduleName], ...data };
    const filePath = this.InitPath[moduleName];
    if (typeof filePath === 'string' && filePath.length > 0) {
      try {
        const yamlData = yaml.dump(this.InitData[moduleName]);
        if (debugStoreManager) console.log('[main] storeFile', filePath, '\n', yamlData);
        if (!yamlData) {
          return;
        }
        fse.outputFile(filePath, yamlData).then();
      } catch (ex) {
        this.writeLog('__caught_exception_when_write_conf', { ex }).then();
      }
    }
  }

  setBounds(type: WinType, value: Partial<Rectangle>) {
    const bounds = { ...this.InitData.window?.bounds };
    bounds[type] = { ...(bounds[type] || {}), ...value };
    this.set('window', 'bounds', bounds);
  }

  getBounds(type: WinType): Partial<Rectangle> | undefined {
    const bounds = { ...this.InitData.window.bounds };
    return bounds[type] || undefined;
  }

  getWindowCreateInfos(type: WinType): IWindowCreateInfo | null {
    const createInfos = { ...this.InitData.window.createInfos };
    return createInfos[type] || null;
  }

  setWindowCreateInfos(type: WinType, createInfo: IWindowCreateInfo) {
    if (!createInfo) return;
    const createInfos = { ...this.InitData.window.createInfos };
    createInfos[type] = createInfo;
    this.set('window', 'createInfos', createInfos);
  }

  initIpcChannel() {
    ipcMain.handle('storeInvoke', async (event, functionName: StoreManageFuncNames, args) => {
      if (debugStoreManager) console.log('storeInvoke', args);
      const func = this[functionName as keyof StoreManageImpl] as Function;
      const data1 = await func.apply(this, args);
      return { data: data1 };
    });
  }

  setLowMemoryMode(value: boolean) {
    this.set('user', LOW_MEMORY_MODE_KEY, value);
  }

  getIsLowMemoryMode() {
    return this.get('user', LOW_MEMORY_MODE_KEY) as boolean;
  }

  getSystemProxyType() {
    return (this.get('user', SYSTEM_TYPE_KEY) as SYSTEM_PROXY_TYPES) || 'systemProxy-smartProxy';
  }

  setSystemProxyType(type: string) {
    this.set('user', USE_SYSTEM_PROXY_KEY, type);
  }

  getIsUseSystemProxy() {
    return this.get('user', USE_SYSTEM_PROXY_KEY) as boolean;
  }

  getIsUseINProcessGPU() {
    return this.get('user', USE_IN_PROCESS_GPU) as boolean;
  }

  setHasTransferAutoLaunch(val: boolean) {
    return this.set('app', IS_TRANSFER_AUTOLAUNCH, val);
  }

  getHasTransferAutoLaunch() {
    return this.get('app', IS_TRANSFER_AUTOLAUNCH) as boolean;
  }

  getAppZoomVal() {
    return Number.parseFloat(this.get('app', APPPAGE_ZOOMKEY)) as number;
  }
}

export const storeManage = new StoreManageImpl();
// export const userDataPath = path.join(app.getPath('home'),'.sirius-desktop');
/**
 * getPath 目录不存在会直接抛异常
 * @returns
 */
export const getDownloadPath = () => {
  const downloadPath = storeManage.get('app', 'downloadPath') as string;
  if (!downloadPath || !fse.pathExistsSync(downloadPath)) {
    const defaultPath = getDefaultDownloadPath();
    storeManage.set('app', 'downloadPath', defaultPath);
    return defaultPath;
  }
  return downloadPath;
};
