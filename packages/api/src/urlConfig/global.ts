import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class GlobalUrl {
  // 全局
  getAllAuthorities: string = host + config('getAllAuthorities');

  /**
   * 邮件别名
   */
  getAccountInfo: string = (host + config('getAccountInfo')) as string;

  getMailReadCount: string = (host + config('getMailReadCount')) as string;

  getMailReadCountBatch: string = (host + config('getMailReadCountBatch')) as string;

  getMailReadDetail: string = (host + config('getMailReadDetail')) as string;

  getMailLimit: string = (host + config('getMailLimit')) as string;

  /**
   * 更新app
   */
  UpgradeApp: string = (host + config('UpgradeApp')) as string;

  newUpgradeApp: string = (host + config('newUpgradeApp')) as string;

  /**
   *  多账号设备绑定
   */
  bindAccountDevice: string = (host + config('bindAccountDevice')) as string;

  /**
   *  配置设置
   */
  getDeviceList: string = (host + config('getDeviceList')) as string;

  deleteDevice: string = (host + config('deleteDevice')) as string;

  /**
   * 推送相关
   */
  mailPushRegister: string = (host + config('mailPushRegister')) as string;

  mailPushUnregister: string = (host + config('mailPushUnregister')) as string;

  getPushConfig: string = (host + config('getPushConfig')) as string;

  setPushConfig: string = (host + config('setPushConfig')) as string;

  cleanPushConfig: string = (host + config('cleanPushConfig')) as string;

  // sentry 接口
  webSentry: string = config('sentryWebUrl') as string;

  electronSentry: string = config('sentryElectronUrl') as string;

  // 获取AB开关
  getABSwitch: string = host + config('getABSwitch');

  getProductVideos: string = host + config('getProductVideos');
}
export type GlobalUrlKeys = keyof GlobalUrl;
const urlConfig = new GlobalUrl();
const urlsMap = new Map<GlobalUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as GlobalUrlKeys, urlConfig[item as GlobalUrlKeys]);
});
export default urlsMap;
