import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class CatalogUrl {
  /**
   * 日历相关
   */
  catalogList: string = (host + config('catalogList')) as string;

  // 第三方日历
  thirdCatalogList: string = (host + config('thirdCatalogList')) as string;

  // 删除第三方账号日历
  deleteThirdAccountCatalog: string = (host + config('deleteThirdAccountCatalog')) as string;

  getSetting: string = (host + config('getSetting')) as string;

  updateSetting: string = (host + config('updateSetting')) as string;

  getSubscribeCatalogList: string = (host + config('getSubscribeCatalogList')) as string;

  subscribeCatalog: string = (host + config('subscribeCatalog')) as string;

  unsubscribeCatalog: string = (host + config('unsubscribeCatalog')) as string;

  deleteCatalog: string = (host + config('deleteCatalog')) as string;

  deleteMyCatalog: string = (host + config('deleteMyCatalog')) as string;

  scheduleList: string = (host + config('scheduleList')) as string;

  scheduleAdd: string = (host + config('scheduleAdd')) as string;

  zoneList: string = (host + config('zoneList')) as string;

  scheduleDetail: string = (host + config('scheduleDetail')) as string;

  scheduleUpdate: string = (host + config('scheduleUpdate')) as string;

  scheduleDelete: string = (host + config('scheduleDelete')) as string;

  scheduleOperate: string = (host + config('scheduleOperate')) as string;

  icsParse: string = (host + config('icsParse')) as string;

  icsInfo: string = (host + config('icsInfo')) as string;

  icsOperate: string = (host + config('icsOperate')) as string;

  freebusyList: string = (host + config('freebusyList')) as string;

  scheduleUploadFile: string = (host + config('scheduleUploadFile')) as string;

  scheduleDownloadFile: string = (host + config('scheduleDownloadFile')) as string;
}
export type CatalogUrlKeys = keyof CatalogUrl;
const urlConfig = new CatalogUrl();
const urlsMap = new Map<CatalogUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as CatalogUrlKeys, urlConfig[item as CatalogUrlKeys]);
});
export default urlsMap;
