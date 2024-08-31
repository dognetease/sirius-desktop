import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class FFMSUrl {
  getOrderDetail: string = (host + config('getOrderDetail')) as string;

  addFfCustomerLevel: string = (host + config('addFfCustomerLevel')) as string;

  getFfCustomerLevelList: string = (host + config('getFfCustomerLevelList')) as string;

  deleteFfCustomerLevel: string = (host + config('deleteFfCustomerLevel')) as string;

  getDiscount: string = (host + config('getDiscount')) as string;

  getFfGlobalDiscountList: string = (host + config('getFfGlobalDiscountList')) as string;

  saveDiscount: string = (host + config('saveDiscount')) as string;

  deleteFfCustomer: string = (host + config('deleteFfCustomer')) as string;

  saveFfCustomerType: string = (host + config('saveFfCustomerType')) as string;

  getFfCustomerTypeList: string = (host + config('getFfCustomerTypeList')) as string;

  deleteFfCustomerType: string = (host + config('deleteFfCustomerType')) as string;

  changeCustomerType: string = (host + config('changeCustomerType')) as string;

  getFfCustomerList: string = (host + config('getFfCustomerList')) as string;

  saveFfCustomer: string = (host + config('saveFfCustomer')) as string;

  changeFfCustomerLevel: string = (host + config('changeFfCustomerLevel')) as string;

  ffCustomerTemplate: string = (host + config('ffCustomerTemplate')) as string;

  ffCustomerUpload: string = (host + config('ffCustomerUpload')) as string;

  ffRateTemplate: string = (host + config('ffRateTemplate')) as string;

  ffRateList: string = (host + config('ffRateList')) as string;

  saveFfRate: string = (host + config('saveFfRate')) as string;

  deleteFfRate: string = (host + config('deleteFfRate')) as string;

  ffRateUpload: string = (host + config('ffRateUpload')) as string;

  ffPortList: string = (host + config('ffPortList')) as string;

  ffCarrierList: string = (host + config('ffCarrierList')) as string;

  saveFfUploadData: string = (host + config('saveFfUploadData')) as string;

  ffRateDraftList: string = (host + config('ffRateDraftList')) as string;

  ffRateDraftDetail: string = (host + config('ffRateDraftDetail')) as string;

  deleteFfRateDraft: string = (host + config('deleteFfRateDraft')) as string;

  ffImportRecallInfo: string = (host + config('ffImportRecallInfo')) as string;

  ffImportRecall: string = (host + config('ffImportRecall')) as string;

  ffOverviewList: string = (host + config('ffOverviewList')) as string;

  ffWhiteList: string = (host + config('ffWhiteList')) as string;

  ffGetShareLink: string = (host + config('ffGetShareLink')) as string;

  ffBookList: string = (host + config('ffBookList')) as string;

  changeffBookStatus: string = (host + config('changeffBookStatus')) as string;

  saveFfFollow: string = (host + config('saveFfFollow')) as string;

  getFfBookDetail: string = (host + config('getFfBookDetail')) as string;

  getFfBookingStatus: string = (host + config('getFfBookingStatus')) as string;

  deleteFfBook: string = (host + config('deleteFfBook')) as string;

  getPortState: string = (host + config('getPortState')) as string;

  getPortStateList: string = (host + config('getPortStateList')) as string;

  getVisiteList: string = (host + config('getVisiteList')) as string;

  getVisiteDetail: string = (host + config('getVisiteDetail')) as string;

  getVisiteState: string = (host + config('getVisiteState')) as string;

  checkSiteId: string = (host + config('checkSiteId')) as string;

  getOrgSiteId: string = (host + config('getOrgSiteId')) as string;

  saveSiteId: string = (host + config('saveSiteId')) as string;

  getCustomerTypeOptions: string = (host + config('getCustomerTypeOptions')) as string;

  ffmsAnalyzePicture: string = (host + config('ffmsAnalyzePicture')) as string;

  saveFfmsAnalyzePicture: string = (host + config('saveFfmsAnalyzePicture')) as string;

  getFfmsPriceTitle: string = (host + config('getFfmsPriceTitle')) as string;

  changeFfmsDiscountType: string = (host + config('changeFfmsDiscountType')) as string;

  getFfmsDiscountType: string = (host + config('getFfmsDiscountType')) as string;

  getFfmsCustomerConfigType: string = (host + config('getFfmsCustomerConfigType')) as string;

  getFFmsRateHistoryList: string = (host + config('getFFmsRateHistoryList')) as string;

  ffPermissionsPortList: string = (host + config('ffPermissionsPortList')) as string;

  ffPermissionsDeparturePort: string = (host + config('ffPermissionsDeparturePort')) as string;

  ffAnalyzeText: string = (host + config('ffAnalyzeText')) as string;

  batchSaveFfPrice: string = (host + config('batchSaveFfPrice')) as string;

  getPushedCustomerList: string = (host + config('getPushedCustomerList')) as string;

  pushToCustomer: string = (host + config('pushToCustomer')) as string;

  getEdmJobList: string = (host + config('getEdmJobList')) as string;

  getEdmJobDetail: string = (host + config('getEdmJobDetail')) as string;

  getDefaultCustomerList: string = (host + config('getDefaultCustomerList')) as string;
}

export type FFMSUrlKeys = keyof FFMSUrl;
const urlConfig = new FFMSUrl();
const urlsMap = new Map<FFMSUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as FFMSUrlKeys, urlConfig[item as FFMSUrlKeys]);
});
export default urlsMap;
