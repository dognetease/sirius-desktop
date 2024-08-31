import { Api } from '../_base/api';
import { DeviceInfo } from '../system/system';

export interface deviceInfo {
  deviceId: string;
  deviceName: string;
  system: string;
  deviceType: string;
  loginTime: string; //yyyy-MM-dd HH:mm:ss
  dev_product: string;
}

export interface DeviceListReq {
  product: string;
  _deviceId: string;
  _systemVersion: string;
  _system: string;
  lastLoginTime: string; // 刚开始填当前时间，达到分页后取最后一条记录的登录时间，格式：yyyy-MM-dd HH:mm:ss
  pageSize: string; // 默认50
}

export interface DeviceDeleteReq extends DeviceInfo {
  product?: string; // 默认灵犀办公
  _deviceId: string;
}

export interface ConfigSettingApi extends Api {
  doGetDeviceList(): Promise<deviceInfo[]>;

  doDeleteDevice(deviceId: string, deviceProduct?: string): Promise<boolean>;
}
