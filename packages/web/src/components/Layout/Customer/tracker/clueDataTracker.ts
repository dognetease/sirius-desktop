import { apiHolder, apis, DataTrackerApi } from 'api';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

type Attributes = { [key: string]: any };

export const clueDataTracker = {
  trackClueSearch(type: ClueSearchType) {
    trackerApi.track('pc_markting_leads_my_click', {
      type,
    });
  },
  trackHandlerClue(from: HandlerClueType) {
    trackerApi.track('pc_markting_leads_list_operation', {
      buttonname: from,
    });
  },
  trackTableBatchOperation(from: BatchOperationType, nums?: number) {
    trackerApi.track('pc_markting_leads_batch_operation', {
      buttonname: from,
      selectNum: nums,
    });
  },
  trackClueDetailTopbar(buttonname: string) {
    trackerApi.track('pc_markting_leads_detail_topbar', { buttonname });
  },
  trackClueDetailTab(buttonname: string) {
    trackerApi.track('pc_markting_leads_detail_tab', { buttonname });
  },
  trackClueDetailContact(buttonname: string) {
    trackerApi.track('pc_markting_leads_detail_contact', { buttonname });
  },
  trackClueDetailEmailsFilter(type: string) {
    trackerApi.track('pc_markting_leads_detail_email_tab_filterbar', { type });
  },
  trackClueDetailEmailsContent(buttonname: string) {
    trackerApi.track('pc_markting_leads_detail_email_tab', { buttonname });
  },
  trackClueDetailSchedule(buttonname: string, scheduleTime: string, clickTime: string) {
    trackerApi.track('pc_markting_leads_detail_email_schedule', { buttonname, scheduleTime, clickTime });
  },
  trackClueDetailScheduleSubmit(buttonname: string, scheduleTime: string, operateTime: string) {
    trackerApi.track('pc_markting_leads_detail_email_schedule_popups', { buttonname, scheduleTime, operateTime });
  },
  trackClueDetailOperateOption(buttonname: string) {
    trackerApi.track('pc_markting_leads_detail_log_tab', { buttonname });
  },
  trackeDocFilter(type: string) {
    trackerApi.track('pc_markting_leads_detail_doc_tab_filterbar', { type });
  },
  trackDocOperation(buttonname: string) {
    trackerApi.track('pc_markting_leads_detail_doc_tab', { buttonname });
  },
};

export enum ClueSearchType {
  Status = 'leadsstatus',
  CreateType = 'createtype',
  Creattime = 'creattime',
  UpdateTime = 'updatetime',
  Search = 'search',
  ClueBatchList = 'cluebatchlist',
}

export enum HandlerClueType {
  New = 'createleads',
  ConfirmNew = 'createleads_confirm',
  ConfirmClueToCustomer = 'transfer_confirm',
  Synchronous = 'synchronous',
  Import = 'import',
  Marketing = 'oneclickmarketing',
}

export enum BatchOperationType {
  Delete = 'batchDelete',
  Status = 'changeLeadsStatus',
  Marketing = 'oneClickMarketing',
  TransferLeads = 'transferLeads',
}
