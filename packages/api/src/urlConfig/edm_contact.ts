import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class EdmContactUrl {
  getCustomerList: string = (host + config('getCustomerList')) as string;

  getClueList: string = (host + config('getClueList')) as string;

  getColleagueList: string = (host + config('getColleagueList')) as string;

  getCustomerListPage: string = (host + config('getCustomerListPage')) as string;

  getCustomerDetailBatch: string = (host + config('getCustomerDetailBatch')) as string;

  getCompanyDetailById: string = (host + config('getCompanyDetailById')) as string;

  getClueDetailById: string = (host + config('getClueDetailById')) as string;

  getOpenSeaClueDetailById: string = (host + config('getOpenSeaClueDetailById')) as string;

  getOpenSeaCustomerDetailBatch: string = (host + config('getOpenSeaCustomerDetailBatch')) as string;

  getCompanyCustomerList: string = (host + config('getCompanyCustomerList')) as string;

  getClueContactList: string = (host + config('getClueContactList')) as string;

  getOpenSeaCustomerList: string = (host + config('getOpenSeaCustomerList')) as string;

  getCustomerListByMangerId: string = (host + config('getCustomerListByMangerId')) as string;

  getSubMailNew: string = (host + config('getSubMailNew')) as string;

  // 营销联系人分组相关接口
  addMarktingGroup: string = (host + config('addMarktingGroup')) as string;
  addMarktingContact2Group: string = (host + config('addMarktingContact2Group')) as string;
  associateEdm: string = (host + config('associateEdm')) as string;
  deleteMarktingGroup: string = (host + config('deleteMarktingGroup')) as string;
  editMarktingGroup: string = (host + config('editMarktingGroup')) as string;
  addMarktingGroup2Group: string = (host + config('addMarktingGroup2Group')) as string;
  getMarktingGroupList: string = (host + config('getMarktingGroupList')) as string;
  getMarktingGroupListWithPage: string = (host + config('getMarktingGroupListWithPage')) as string;
  transferMarktingContact2Groups: string = (host + config('transferMarktingContact2Groups')) as string;
  cancelGroupEdm: string = (host + config('cancelGroupEdm')) as string;

  // 营销引导相关接口
  getQuickMarktingList: string = (host + config('getQuickMarktingList')) as string;
  getQuickMarktingGuide: string = (host + config('getQuickMarktingGuide')) as string;
  getQuickMarktingGroupCount: string = (host + config('getQuickMarktingGroupCount')) as string;
  createQuickMarktingGroup: string = (host + config('createQuickMarktingGroup')) as string;
  deleteQuickMarktingGroup: string = (host + config('deleteQuickMarktingGroup')) as string;
  getEdmContactList: string = (host + config('getEdmContactList')) as string;
  getGroupCountByFilter: string = (host + config('getGroupCountByFilter')) as string;

  // 回收站相关接口
  emptyAddressRecycle: string = (host + config('emptyAddressRecycle')) as string;
  deleteAddressRecycle: string = (host + config('deleteAddressRecycle')) as string;
  addressRecycleList: string = (host + config('addressRecycleList')) as string;
  recoverAddressRecycle: string = (host + config('recoverAddressRecycle')) as string;
  getAddressRecycleDetail: string = (host + config('getAddressRecycleDetail')) as string;
}
export type EdmContactUrlKeys = keyof EdmContactUrl;
const urlConfig = new EdmContactUrl();
const urlsMap = new Map<EdmContactUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as EdmContactUrlKeys, urlConfig[item as EdmContactUrlKeys]);
});
export default urlsMap;
