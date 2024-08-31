import { YMStoreModuleName, StoreDataKey, StoreManageRender } from '../declare/StoreManage';
import { ipcChannelManage } from './ipcChannelManage';

// import {CommonWinRequestParam} from "../declare/WindowManage";

class StoreManageImpl implements StoreManageRender {
  async get(moduleName: YMStoreModuleName, attr: StoreDataKey): Promise<any> {
    const res = await ipcChannelManage.invoke({
      channel: 'storeInvoke',
      functionName: 'get',
      params: [moduleName, attr],
    });
    return res;
  }

  async set(moduleName: YMStoreModuleName, attr: StoreDataKey, value: any): Promise<void> {
    const res = await ipcChannelManage.invoke({
      channel: 'storeInvoke',
      functionName: 'set',
      params: [moduleName, attr, value],
    });
    return Promise.resolve(res);
  }
}

export const storeManageImpl = new StoreManageImpl() as StoreManageRender;
