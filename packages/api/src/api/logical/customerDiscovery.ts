import { Api } from '../_base/api';

/**
 * 自动任务列表 TableRow
 */
export interface CustomerAutoTaskRow {
  taskId: string;
  taskName: string;
  conditionType: string[];
  totalDomainCount: number;
  validDomainCount: number;
  invalidDomainCount: number;
  taskStatus: string;
  createTime: string | number;
  finishTime: number | string;
  expectTime: string;
  startTime: string | number;
  endTime: string | number;
  ruleContent: string;
  isLoading?: boolean;
  opFlag?: number;
}

export interface CustomerAutoTaskReq {
  startDate?: number;
  endDate?: number;
  taskStatus?: string;
  page: number;
  pageSize: number;
}

export interface CustomerAutoTaskList {
  data: Array<CustomerAutoTaskRow>;
  total: number;
}

/**
 * 定制任务列表 TableRow
 */
export interface CustomerManualTaskRow {
  taskId: string;
  taskName: string;
  conditionType: string[];
  totalDomainCount: number;
  validDomainCount: number;
  invalidDomainCount: number;
  prepareTime: string;
  taskStatus: string;
  expectTime: string;
  createTime: string | number;
  startTime: string | number;
  endTime: string | number;
  finishTime: number | string;
  ruleContent: string;
  isLoading?: boolean;
  opFlag?: number;
}

export interface CustomerManualTaskListReq {
  taskName?: string;
  conditionType?: string;
  taskStatus?: string;
  page: number;
  pageSize: number;
}

export interface CustomerManualTaskList {
  data: Array<CustomerManualTaskRow>;
  total: number;
  prepareCount: number;
}

/**
 * 老客列表 TableRow
 */
export interface CustomerRow {
  regularCustomerId: string;
  regularCustomerDomain: string;
  companyName: string;
  sendCount: number;
  receiveCount: number;
  fromCount: number;
  toCount: number;
  taskType: string;
  syncInfo?: {
    type: string;
    referId: string;
    owner: string;
  };
  validInfo: Array<{
    accountId: string;
    flag: string;
    nickname: string;
    time: string;
  }>;
  validFlag: string;
  grantInfo?: {
    status: string;
    grantId: string;
  };
  isLoading?: boolean;
}

export interface RegularCustomerListReq {
  taskId?: string;
  validFlag: string;
  page: number;
  pageSize: number;
}

export interface RegularCustomerListAllReq {
  startDate?: number;
  endDate?: number;
  validFlag: string;
  page: number;
  pageSize: number;
}

export interface RegularCustomerList {
  data: Array<CustomerRow>;
  total: number;
}

/** 老客详情 */
export interface CustomerDisDetail {
  regularCustomerId: string;
  regularCustomerDomain: string;
  companyName: string;
  receiverList: Array<{ name: string; email: string }>;
  sendCount: number;
  receiveCount: number;
  fromCount: number;
  toCount: number;
  taskType: string;
  syncInfo?: {
    type: string;
    referId: string;
  };
  validFlag?: string;
  validInfo: Array<{
    accountId: string;
    flag: string;
    nickname: string;
    time: string;
  }>;
  grantInfo?: {
    status: string;
    grantId: string;
  };
}

export interface CustomerManualTaskRule {
  field: string | undefined;
  fieldName: string;
  op: string | undefined;
  value: string;
}

export interface CustomerManualTask {
  taskName: string;
  dataRange: string;
  startDate: number;
  endDate: number;
  conditionList: Array<CustomerManualTaskRule>;
}

export interface CustomerAuthorizationSearch {
  account?: string;
  beginTime?: number;
  endTime?: number;
  page: number;
  pageSize: number;
}

/**
 * 数据类型 1-线索公海 2-线索私海 3-客户 4-商机 5-老客
 */
export enum CustomerAuthDataType {
  Clue = 'clue',
  Company = 'company',
  Opportunity = 'opportunity',
  OpenSea = 'open_sea',
  RegularCustomer = 'regular_customer',
  CustomerOpenSea = 'customer_open_sea',
  Address = 'address',
}

export const CustomerEmailListCondition = CustomerAuthDataType;

export const CustomerAuthTypeMap = {
  [CustomerAuthDataType.OpenSea]: '线索公海',
  [CustomerAuthDataType.Clue]: '线索私海',
  [CustomerAuthDataType.Company]: '客户',
  [CustomerAuthDataType.Opportunity]: '商机',
  [CustomerAuthDataType.RegularCustomer]: '定制推荐',
  [CustomerAuthDataType.CustomerOpenSea]: '客户公海',
  [CustomerAuthDataType.Address]: '营销联系人',
};

export interface CustomerAuthRecord {
  recordId: string;
  accId: string;
  accNickname: string;
  accEmail: string;
  relationId: string;
  relationName: string;
  relationType: CustomerAuthDataType;
  relationDomain: string;
  totalEmailNum: number;
  applyTime: number;
  verifyTime: number;
  state: number;
  relationView: string;
  fromNicknameSet: Array<string>;
  toNicknameSet: Array<string>;
  fromSet: Array<{
    email: string;
    nickName: string;
  }>;
  toSet: Array<{
    email: string;
    nickName: string;
  }>;
}

export interface CustomerAuthList {
  total: number;
  data: Array<CustomerAuthRecord>;
}

export interface CustomerAuthDetailReq {
  dataId: string;
  dataType: CustomerAuthDataType;
}

export interface CustomerAuthDetail {
  recordId: string;
  accId: string;
  accNickname: string;
  accEmail: string;
  relationId: string;
  relationName: string;
  relationType: CustomerAuthDataType;
  relationDomain: string;
  totalEmailNum: number;
  applyTime: number;
  verifyTime: number;
  state: number;
  fromSet: Array<{
    email: string;
    nickName: string;
  }>;
  toSet: Array<{
    email: string;
    nickName: string;
  }>;
}

export interface CustomerAuthHistorySearch {
  account: string;
  beginTime?: number;
  state?: string;
  endTime?: number;
  verifyAccId?: string;
  page: number;
  pageSize: number;
}

export interface CustomerAuthHistoryRecord {
  recordId: string;
  accId: string;
  accNickname: string;
  accEmail: string;
  relationId: string;
  relationName: string;
  relationType: CustomerAuthDataType;
  relationDomain: string;
  totalEmailNum: number;
  applyTime: number;
  verifyTime: number;
  state: number;
  relationView: string;
  fromNicknameSet: Array<string>;
  toNicknameSet: Array<string>;
  verifyAccNickname: string;
  verifyAccEmail: string;
  fromSet: Array<{
    email: string;
    nickName: string;
  }>;
  toSet: Array<{
    email: string;
    nickName: string;
  }>;
}

export interface CustomerAuthHistoryList {
  total: number;
  data: Array<CustomerAuthHistoryRecord>;
}

export interface CustomerAuthWhitelistSearch {
  account?: string;
}

export interface CustomerAuthWhitelistRecord {
  ownerAccId: string;
  ownerAccNickname: string;
  ownerAccEmail: string;
  createTime: number;
  operateAccId: string;
  operateAccNickname: string;
  operateAccEmail: string;
  loading?: boolean;
}

export interface CustomerAuthWhitelist {
  total: number;
  data: Array<CustomerAuthWhitelistRecord>;
}

export const CustomerAuthGrantStateMap: Record<number, string> = {
  0: '待审批',
  1: '已通过',
  2: '已驳回',
};

export interface CustomerAuthGrantRecord {
  resourceId: string;
  from: string;
  fromNickname: string;
  to: string;
  toNickname: string;
  state: number; // 0-待审批 1-通过 2-驳回
  emailNum: number; // 邮件数量
}

export interface AddAuthWhitelistReq {
  owners: Array<{
    ownerAccId: string;
    ownerAccNickname: string;
    ownerAccEmail: string;
  }>;
}

export interface CreateAuthReq {
  relationId: string;
  relationName: string;
  relationDomain: string;
  relationType: string;
  resources: string[];
}

export interface CustomerEmailListReq {
  page: number;
  page_size: number; // eslint-disable-line
  condition: CustomerAuthDataType;
  main_resource_id: string; // eslint-disable-line
  data_source?: string;
  start_date?: string; // eslint-disable-line
  end_date?: string; // eslint-disable-line
  from?: string;
  to?: string;
  labels?: string[];
  type?: string;
  noErrorMsgEmit?: boolean;
}

export interface CustomerEmailAttachment {
  attachment_id: string; // eslint-disable-line
  attachment_url: string; // eslint-disable-line
  content_id: string; // eslint-disable-line
  content_length: string; // eslint-disable-line
  content_type: string; // eslint-disable-line
  encoding: string;
  estimate_size: string; // eslint-disable-line
  file_name: string; // eslint-disable-line
  file_type: string; // eslint-disable-line
  id: string;
  inlined: boolean;
  is_msg: boolean; // eslint-disable-line
  snapshot_id: string; // eslint-disable-line
}

export interface CustomerEmailItem {
  attachments: CustomerEmailAttachment[];
  id: string;
  mail_id: string; // eslint-disable-line
  fid: number;
  from: string;
  to: string;
  belongToOthers: boolean;
  isSelf: boolean;
  received_date: string; // eslint-disable-line
  sent_date: string; // eslint-disable-line
  snapshot_id: string; // eslint-disable-line
  subject: string;
  summary: string;
  hide: boolean;
  hideState: string;
}

export enum CustomerEmailItemHideState {
  NoNeedAuth = 'NO_NEED_AUTH',
  NeedAuth = 'NEED_AUTH',
  InAuth = 'AUTHING',
}

export interface CustomerEmailEmailList {
  content: CustomerEmailItem[];
  need_permission: string[]; // eslint-disable-line
  need_permission_publisher: string[]; // eslint-disable-line
  need_permission_receiver: string[]; // eslint-disable-line
  total_size: number; // eslint-disable-line
  hide_size: number; // eslint-disable-line
  grantRecord: {
    fromSet: Array<{ email: string; nickname: string }>;
    toSet: Array<{ email: string; nickname: string }>;
    fromNicknameSet: string[];
    toNicknameSet: string[];
    totalEmailNum: number;
  };
}

export interface CustomerEmailTagItem {
  labelId: string;
  name: string;
  color: string;
}

export interface CustomerEmailsContactItem {
  email: string;
  name: string;
}

export interface CustomerEmailsContact {
  from_email_list: Array<CustomerEmailsContactItem>; // eslint-disable-line
  to_email_list: Array<CustomerEmailsContactItem>; // eslint-disable-line
}

export interface CustomerEmailsPreviewInfo {
  email: string;
  name: string;
}

export interface CustomerEmailAuthManager {
  accId: string;
  accNickname: string;
  accEmail: string;
}

export interface RegularCustomerMenuData {
  type: string;
  auto: number;
  manual: number;
  count: number;
}

export interface RuleViewPermissionData {
  allEmails: string[];
  accId: string;
  accEmail: string;
  accNickname: string;
  state: number;
  loading?: boolean;
}

export interface RuleViewPermissionList {
  data: RuleViewPermissionData[];
  total: number;
}

export interface RuleViewPermissionReq {
  keyword?: string;
  page: number;
  pageSize: number;
  state?: number;
}

export interface AutoTaskRuleRes {
  isOpen: boolean;
  interval: string;
  limit: string;
  dataRange: string;
  emailRuleDescription: string;
  screenDescription: string;
  conditionList: Array<CustomerManualTaskRule>;
}

export interface RecommendTaskInfoData {
  conditionType: [];
  createTime: number;
  endTime: number;
  expectTime: string;
  finishTime: number;
  invalidDomainCount: number;
  ruleContent: string;
  startTime: number;
  taskId: string;
  taskName: string;
  taskStatus: string;
  totalDomainCount: number;
  validDomainCount: number;
  unmarkDomainCount: number;
}

export interface ChangeValidFlagRes {
  regularCustomerVOList: Array<{
    regularCustomerId: string;
    validFlag: string;
  }>;
}

export interface CustomerDiscoveryApi extends Api {
  /** ---------------------------- 往来邮件相关 --------------------*/
  getCustomerEmailList(req: CustomerEmailListReq): Promise<CustomerEmailEmailList>;
  // eslint-disable-next-line
  getCustomerEmailTags(condition: string, main_resource_id: string, data_source: string): Promise<Array<CustomerEmailTagItem>>;
  // eslint-disable-next-line
  getCustomerEmailContacts(condition: string, main_resource_id: string, data_source: string): Promise<CustomerEmailsContact>;
  // eslint-disable-next-line
  getCustomerEmailPreviewUrl(condition: string, mailSnapshotId: string, mainResourceId: string, data_source: string): Promise<string>;

  /** ---------------------------- 授权相关 --------------------*/
  createAuth(req: CreateAuthReq): Promise<void>;
  getCustomerAuthList(req: CustomerAuthorizationSearch): Promise<CustomerAuthList>;
  getCustomerAuthHistoryList(req: CustomerAuthHistorySearch): Promise<CustomerAuthHistoryList>;
  getCustomerAuthGrantRecords(recordId: string): Promise<{ data: Array<CustomerAuthGrantRecord> }>;
  passAuth(recordIds: string[]): any;
  rejectAuth(recordIds: string[]): any;
  passAuthResource(recordId: string, resourceIds: string[]): any;
  rejectAuthResource(recordId: string, resourceIds: string[]): any;
  getAuthWhiteList(req: CustomerAuthWhitelistSearch): Promise<CustomerAuthWhitelist>;
  addAuthWhitelist(req: AddAuthWhitelistReq): Promise<void>;
  removeAuthWhitelist(ownerAccId: string): Promise<void>;
  getAuthManagerList(): Promise<Array<CustomerEmailAuthManager>>;

  /** ---------------------------- 老客相关 --------------------*/
  getCustomerAutoTaskList(req: CustomerAutoTaskReq): Promise<CustomerAutoTaskList>;
  getCustomerManualTaskList(req: CustomerManualTaskListReq): Promise<CustomerManualTaskList>;
  getRegularCustomerList(req: RegularCustomerListReq): Promise<RegularCustomerList>;
  getRegularCustomerListAll(req: RegularCustomerListAllReq): Promise<RegularCustomerList>;
  getRegularCustomerDetail(regularCustomerId: string): Promise<{ data: CustomerDisDetail }>;
  addManualTask(req: CustomerManualTask): Promise<void>;
  deleteManualTask(taskId: string): Promise<void>;
  suspendManualTask(taskId: string): Promise<void>;
  restartManualTask(taskId: string): Promise<void>;
  changeCustomerTaskStatus(taskId: string, status: string): Promise<void>;
  unFinishCustomerTask(taskId: string): Promise<{ data: { taskStatus: string } }>;
  changeValidFlag(regularCustomerIdList: string[], validFlag: string | number): Promise<ChangeValidFlagRes>;
  syncClue(regularCustomerIdList: string[]): Promise<void>;
  assignClue(regularCustomerIdList: string[], acceptorId: string): Promise<void>;
  syncOpenSea(regularCustomerIdList: string[]): Promise<void>;
  syncCustomer(customer: any): Promise<void>;
  getRegularCustomerMenuData(): Promise<RegularCustomerMenuData>;

  getRuleRecommendKeyword(): Promise<string[]>;
  getRuleViewPermissionList(state: number): Promise<RuleViewPermissionData[]>;
  getRuleViewPermissionPage(req: RuleViewPermissionReq): Promise<RuleViewPermissionList>;
  changeRuleViewPermission(accIds: string[], state: number): Promise<void>;
  getAutoTaskRule(): Promise<AutoTaskRuleRes>;
  changeAutoTaskStatus(isOpen: boolean): Promise<void>;
  getRecommendTaskInfo(taskId: string): Promise<RecommendTaskInfoData>;
  synCustomerStatus(regularCustomerId: string, customerId: number): Promise<void>;
}
