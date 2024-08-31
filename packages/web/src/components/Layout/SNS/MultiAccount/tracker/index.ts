import { apiHolder, apis, DataTrackerApi } from 'api';

const originOrgId = apiHolder.api.getSystemApi()?.getCurrentUser()?.prop?.companyId as string;
const orgId = originOrgId?.split('_')[1];

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

type WaBlulkTrackType = 'show' | 'add' | 'state' | 'search' | 'date' | 'account' | 'AI_conversational_assistant' | 'Picture' | 'video_upload' | 'send';
type WaGroupCrawlerType = 'show' | 'search' | 'date' | 'details' | 'bulk_sender';
type WaSearchType = 'search_wa_number' | 'search_wa_group' | 'show';
export type WaAddContactsType = 'enter' | 'stencil' | 'group';

class WaTrack {
  trackerApi: DataTrackerApi;
  orgId: string;
  constructor(api: DataTrackerApi, id: string) {
    this.trackerApi = api;
    this.orgId = id;
  }
  mergeCommonAttr() {
    return { orgId: this.orgId };
  }
  waBlulkTrack(type: WaBlulkTrackType) {
    this.trackerApi.track('WA_Bulk_Sender', { opera_type: type, ...this.mergeCommonAttr() });
  }
  waGroupTrack(type: WaGroupCrawlerType) {
    this.trackerApi.track('WA_Group _Crawler', { opera_type: type, ...this.mergeCommonAttr() });
  }
  waBlulkSearchTrack(type: WaSearchType) {
    this.trackerApi.track('WA_Bulk_Search', { opera_type: type, ...this.mergeCommonAttr() });
  }
  waAddContactsTrack(type: WaAddContactsType, opera_way: string = 'WA_Bulk_Sender_add_task') {
    this.trackerApi.track('WA_Add _contacts', { opera_type: type, opera_way, ...this.mergeCommonAttr() });
  }
}

export const track = new WaTrack(trackerApi, orgId);
