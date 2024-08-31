import { apiHolder, apis, DataTrackerApi } from 'api';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

type Attributes = { [key: string]: any };

export const businessDataTracker = {
  trackClueSearch(type: BusinessSearchType) {
    trackerApi.track('pc_markting_business_my_click', {
      type,
    });
  },
  trackHandlerBusiness(from: HandlerBusinessType) {
    trackerApi.track('pc_markting_business_list_operation', {
      buttonname: from,
    });
  },
  trackTableBatchOperation(from: BatchOperationType, nums?: number) {
    trackerApi.track('pc_markting_business_batch_operation​', {
      buttonname: from,
      selectNum: nums,
    });
  },
  trackOpportunityDetailTopbar(buttonname: string) {
    trackerApi.track('pc_markting_business_detail_topbar', { buttonname });
  },
  trackOpportunityDetailStageChange(buttonname: string, stagename: string) {
    trackerApi.track('pc_markting_business_detail_salestage', { buttonname, stagename });
  },
  trackOpportunityDetailTab(buttonname: string) {
    trackerApi.track('pc_markting_business_detail_tab', { buttonname });
  },
  trackOpportunityDetailContact(buttonname: string) {
    trackerApi.track('pc_markting_business_detail_contact', { buttonname });
  },
  trackOpportunityDetailEmailsFilter(type: string) {
    trackerApi.track('pc_markting_business_detail_email_tab_filterbar', { type });
  },
  trackOpportunityDetailEmailsContent(buttonname: string) {
    trackerApi.track('pc_markting_business_detail_email_tab', { buttonname });
  },
  trackOpportunityDetailSchedule(buttonname: string, scheduleTime: string, clickTime: string) {
    trackerApi.track('pc_markting_business_detail_email_schedule', { buttonname, scheduleTime, clickTime });
  },
  trackOpportunityDetailScheduleSubmit(buttonname: string, scheduleTime: string, operateTime: string) {
    trackerApi.track('pc_markting_business_detail_email_schedule_popups', { buttonname, scheduleTime, operateTime });
  },
  trackOpportunityDetailOperateOption(buttonname: string) {
    trackerApi.track('pc_markting_business_detail_log_tab', { buttonname });
  },

  trackeDocFilter(type: string) {
    trackerApi.track('pc_markting_business_detail_doc_tab_filterbar', { type });
  },
  trackDocOperation(buttonname: string) {
    trackerApi.track('pc_markting_business_detail_doc_tab', { buttonname });
  },
};

export enum BusinessSearchType {
  Stage = 'salestage',
  Creattime = 'creattime',
  UpdateTime = 'updatetime',
  Search = 'search',
}

export enum HandlerBusinessType {
  New = 'createbusiness',
  ConfirmNew = 'createbusiness_confirm', // 新建商机
  Import = 'import',
  Marketing = 'oneclickmarketing',
}

export enum BatchOperationType {
  Delete = 'batchDelete',
  Marketing = 'oneClickMarketing',
}
