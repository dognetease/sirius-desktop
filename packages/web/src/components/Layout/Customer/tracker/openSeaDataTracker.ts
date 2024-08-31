import { apiHolder, apis, DataTrackerApi } from 'api';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

type Attributes = { [key: string]: any };

export const openSeaDataTracker = {
  trackOpenSeaSearch(type: OpenSearchType) {
    trackerApi.track('pc_markting_public_leads_my_click', {
      type,
    });
  },
  trackTableBatchOperation(from: BatchOperationType, nums?: number) {
    trackerApi.track('pc_markting_public_leads_batch_operation​', {
      buttonname: from,
      selectNum: nums,
    });
  },
  trackClueDetailTopbar(buttonname: string) {
    trackerApi.track('pc_markting_public_leads_detail_topbar', { buttonname });
  },
  trackClueDetailTab(buttonname: string) {
    trackerApi.track('pc_markting_public_leads_detail_tab', { buttonname });
  },
  trackClueDetailContact(buttonname: string) {
    trackerApi.track('pc_markting_public_leads_detail_contact', { buttonname });
  },
  trackClueDetailEmailsFilter(type: string) {
    trackerApi.track('pc_markting_public_leads_detail_email_tab_filterbar', { type });
  },
  trackClueDetailEmailsContent(buttonname: string) {
    trackerApi.track('pc_markting_public_leads_detail_email_tab', { buttonname });
  },
  trackClueDetailSchedule(buttonname: string, scheduleTime: string, clickTime: string) {
    trackerApi.track('pc_markting_leads_detail_email_schedule', { buttonname, scheduleTime, clickTime });
  },
  trackClueDetailScheduleSubmit(buttonname: string, scheduleTime: string, operateTime: string) {
    trackerApi.track('pc_markting_leads_detail_email_schedule_popups', { buttonname, scheduleTime, operateTime });
  },
  trackClueDetailOperateOption(buttonname: string) {
    trackerApi.track('pc_markting_public_leads_detail_log_tab', { buttonname });
  },

  trackeDocFilter(type: string) {
    trackerApi.track('pc_markting_public_leads_detail_doc_tab_filterbar', { type });
  },
  trackDocOperation(buttonname: string) {
    trackerApi.track('pc_markting_public_leads_detail_doc_tab', { buttonname });
  },
};

export enum OpenSearchType {
  Status = 'leadsstatus',
  CreateType = 'createtype',
  Creattime = 'creattime',
  Backtime = 'backtime',
  Search = 'search',
}

export enum HandlerOpenSeaType {
  New = 'createleads',
  Synchronous = 'synchronous',
  Import = 'import',
  Marketing = 'oneclickmarketing',
}

export enum BatchOperationType {
  Delete = 'batchDelete',
  Claim = 'batchClaim', // 领取
  Assign = 'batchAssign', // 分配
}
