import { apiHolder, apis, DataTrackerApi, CustomerManualTask } from 'api';
const trackerApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

export enum RegularCustomerMenuType {
  auto = 'auto',
  manual = 'manual',
  record = 'record',
  auth = 'auth',
}

export enum SyncType {
  OpenSea = 'open_sea', // 同步公海
  Clue = 'clue', // 同步线索
  Company = 'company', // 同步客户
  OtherClue = 'other_clue', // 分配指定人
  CompanySea = 'company_sea',
  CancelMark = 'cancelmark', // 取消无效
  MarkInValid = 'markinvalid', // 标记无效
}

export const regularCustomerTracker = {
  trackMenuClick(type: RegularCustomerMenuType) {
    trackerApi.track('pc_customer_inoutmail', { type });
  },

  trackSwitch(isOpen: boolean) {
    trackerApi.track('pc_customer_inoutmail_auto_switch', { isOpen });
  },

  trackNewTask(taskInfo: CustomerManualTask) {
    trackerApi.track('pc_customer_inoutmail_manual_new', taskInfo);
  },

  trackAutoFinish() {
    trackerApi.track('pc_customer_inoutmail_auto_task_finish');
  },

  trackManualFinish() {
    trackerApi.track('pc_customer_inoutmail_manual_task_finish');
  },

  trackSync(type: string) {
    trackerApi.track('pc_customer_inoutmail__task_mark', { type });
  },

  trackMailAuthApply(condition: string) {
    trackerApi.track('pc_customer_inoutmail__task_checkmail', { condition });
  },

  trackAuthAgree() {
    trackerApi.track('pc_customer_inoutmail_grant_agree');
  },

  trackWhitelistAdd() {
    trackerApi.track('pc_customer_inoutmail_ whitelist_Add');
  },

  trackPermissionListReject() {
    trackerApi.track('pc_customer_inoutmail_ personlist_prohibit');
  },
};
