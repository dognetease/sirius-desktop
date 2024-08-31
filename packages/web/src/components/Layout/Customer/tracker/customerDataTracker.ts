import { apiHolder, apis, DataTrackerApi } from 'api';

const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

type Attributes = { [key: string]: any };

export const customerDataTracker = {
  track(eventId: string, attributes?: Attributes) {
    trackerApi.track(eventId, attributes);
  },

  trackPv(pvType: CustomerPvType, attributes?: Attributes) {
    trackerApi.track(pvType, attributes);
  },

  trackMenuClick(type: CustomerMenuClick) {
    trackerApi.track(type);
  },

  trackCustomerSearch(type: CustomerSearchType) {
    trackerApi.track('pc_markting_customer_my_click', {
      type,
    });
  },

  trackAddCustomer(from: AddCustomerType) {
    trackerApi.track('pc_markting_customer_my_newoperation', {
      buttonname: from,
    });
  },

  trackCustomerListAction(action: CustomerListAction) {
    trackerApi.track('pc_markting_customer_my_list_click', {
      click: action,
    });
  },

  trackLabelListAction(type: LabelListAction, attributes?: Attributes) {
    trackerApi.track('pc_markting_customer_labellist_operation', {
      buttonname: type,
      ...attributes,
    });
  },
  // 潜在用户搜索
  trackUnprocessedSearch(type: CustomerSearchType) {
    trackerApi.track('pc_markting_customer_unprocessed_my_click', {
      type,
    });
  },
  // 个人通讯导入和完善资料
  trackUnprocessedOperation(type: UnprocessedOperation) {
    trackerApi.track('pc_markting_customer_unprocessed_list_operation', {
      type,
    });
  },
  // 客户批量操作
  trackCustomerBatchOperation(type: CustomerBatchOperation, attributes?: Attributes) {
    trackerApi.track('pc_markting_customer_batch_operation', {
      buttonname: type,
      ...attributes,
    });
  },
  // 客户合并点击事件
  trackCustomerMergeClick() {
    trackerApi.track('pc_markting_customer_merge_click');
  },
  // 合并客户对应字段
  trackCustomerMergePopUp(fieldName: string) {
    trackerApi.track('pc_markting_customer_merge_popup', {
      fieldName,
    });
  },
  trackCustomerDetailTopbar(buttonname: string) {
    trackerApi.track('pc_markting_customer_detail_topbar', { buttonname });
  },
  trackCustomerDetailTab(buttonname: string) {
    trackerApi.track('pc_markting_customer_detail_tab', { buttonname });
  },
  trackCustomerDetailCustomsDataTab(buttonname: string) {
    trackerApi.track('pc_markting_customer_detail_cutoms_data_filterbar', { type: buttonname });
  },
  trackCustomerDetailBusiness(buttonname: string) {
    trackerApi.track('pc_markting_customer_detail_business', { buttonname });
  },
  trackCustomerDetailContact(buttonname: string) {
    trackerApi.track('pc_markting_customer_detail_contact', { buttonname });
  },
  trackCustomerDetailEmailTabFilter(type: string) {
    trackerApi.track('pc_markting_customer_detail_email_tab_filterbar', { type });
  },
  trackCustomerDetailEmailTab(buttonname: string) {
    trackerApi.track('pc_markting_customer_detail_email_tab', { buttonname });
  },
  trackCustomerDetailSchedule(buttonname: string, scheduleTime: string, clickTime: string) {
    trackerApi.track('pc_markting_customer_detail_email_schedule', { buttonname, scheduleTime, clickTime });
  },
  trackCustomerDetailScheduleSubmit(buttonname: string, scheduleTime: string, clickTime: string) {
    trackerApi.track('pc_markting_customer_detail_email_schedule_popups', { buttonname, scheduleTime, clickTime });
  },
  trackCustomerDetailLogTab(buttonname: string) {
    trackerApi.track('pc_markting_customer_detail_log_tab', { buttonname });
  },

  trackFollowAdd(type: string, attributes: Attributes) {
    trackerApi.track(`pc_markting_${type}_detail_followup`, {
      buttonname: 'ManulAdd',
      ...attributes,
    });
  },
  trackCustomerMatketing() {
    trackerApi.track('pc_markting_customer_oneclickmarketing_click');
  },
  trackCustomerBusinessClick() {
    trackerApi.track('pc_markting_customer_business_click');
  },

  trackeDocFilter(type: string) {
    trackerApi.track('pc_markting_customer_detail_doc_tab_filterbar', { type });
  },
  trackDocOperation(buttonname: string) {
    trackerApi.track('pc_markting_customer_detail_doc_tab', { buttonname });
  },
};
export enum CustomerPvType {
  Customer = 'pc_markting_customer_my_view',
  Unprocess = 'pc_markting_customer_unprocessed_view',
}

export enum CustomerMenuClick {
  Customer = 'pc_markting_customer_click',
  Label = 'pc_markting_customer_label',
  Clue = 'pc_markting_leads_click',
  Business = 'pc_markting_business_click',
  AutoRecommend = 'pc_markting_autorecommend_click',
  CustomRecommend = 'pc_markting_customrecommend_click',
  RecommendOperateList = 'pc_markting_recommendoperatelist_click',
}

export enum CustomerSearchType {
  CreateTime = 'createtime',
  UpdateTime = 'updateTime',
  Search = 'search',
  Label = 'label',
}

export enum AddCustomerType {
  Manual = 'manual',
  ConfirmNew = 'manual_confirm',
  Synchronous = 'synchronous',
  Import = 'import',
}

export enum CustomerListAction {
  ClickName = 'customername',
  Edit = 'detail',
}

export enum LabelListAction {
  Create = 'create',
  Del = 'del',
  Edit = 'edit',
  BatchDel = 'batchDel',
}

export enum UnprocessedOperation {
  Synchronous = 'synchronous',
  CompleteMaterial = 'completeMaterial',
}

export enum CustomerBatchOperation {
  BatchDelete = 'batchDelete',
  BatchLabel = 'batchLabel',
  Marketing = 'oneClickMarketing',
  Transfer = 'transfer',
  AddResPeople = 'addResPeople',
}
