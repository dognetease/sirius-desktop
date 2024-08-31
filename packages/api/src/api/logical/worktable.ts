import { Api } from '../_base/api';
import { MailEntryModel } from './mail';

/* eslint-disable camelcase */

export interface WorktableApi extends Api {
  getUnreadCount(): Promise<{ unreadCount: number }>;
  getEmailPanel(req: ReqDateRange): Promise<ResEmailPanel>;
  getWorktableArticleList(req: ReqWorktableArticleList): Promise<ResWroktableArticleList>;
  getWorktableSendCount(): Promise<ResWorktableSendCount>;
  getWorkBenchKnowledgeList(): Promise<ResWorkbenchKnwoledgeList>;
  getWorkBenchCurrencyList(): Promise<ResWorkbenchCurrencyList>;
  getWorkBenchExchangeRate(req: { currencyCode: string }): Promise<ResWorkbenchExchangeRate>;
  getWorkBenchCityList(): Promise<ResWorkbenchCityList>;
  getWorkBenchCityInfo(req: { id: number }): Promise<ResWorkbenchCityInfo>;
  postWorkBenchNoticeIgnoreAll(): Promise<null>;
  getWorkBenchNoticeList(req: ReqWorkbenchNoticeListParams): Promise<ResWorkbenchNoticeList>;
  getEmployeePkList(req: ReqWorktableEmployeeList): Promise<ResWorktableEmployeeList>;
  getEmployeePkMemberList(): Promise<ResWorktableEmployeeMemberList>;
  getEdmPanel(req: ReqDateRange): Promise<ResEdmPanel>;
  getAllEdmPanel(req: ReqDateRange & { account_id_list?: string[] }): Promise<ResEdmPanel>;
  getCustomerPanel(req: ReqDateRange & { account_id_list?: string[] }): Promise<ResCustomerPanel>;
  getAllCustomerPanel(req: ReqDateRange & { account_id_list?: string[] }): Promise<ResCustomerPanel>;
  getFollowsPanel(req: ReqFollowsPanel): Promise<ResFollowsPanel>;
  getAllFollowsPanel(req: ReqFollowsPanel): Promise<ResFollowsPanel>;
  getSchedulePanel(req: ReqDateRange & PageAndSortParam): Promise<ResSchedulePanel>;
  getAccountRange(label: string): Promise<ResAccountRange>;
  getUnreadMail(req: { receiveDate: number; page: number; pageSize?: number }): Promise<ResTodoPanel>;
  getContactMail(req: { receiveDate: number; page: number; pageSize?: number }): Promise<ResTodoPanel>;
  ignoreEmail(mid: string | undefined, nid: number | undefined): Promise<boolean>;

  getNotice(): Promise<ResNotice>;

  getPlayContext(req: { mediaId: string; mediaName: string; totalTime?: number }): Promise<{ playId: string }>;
  reportPlayTime(req: { playTime: number; playId: string }): Promise<void>;
  reportPlayTime(req: { playTime: number; playId: string }): Promise<void>;
  getSysUsageView(): Promise<ResWorktableSysUsage[]>;
  getMyStagePanel(): Promise<ResMyStagePanel>;
  getAllStagePanel(req: { account_id_list: string[] }): Promise<ResAllStagePanel>;

  getEmailInquirySwitch(): Promise<ResEmailInquirySwitch>;
  getEmailInquiry(): Promise<ResEmailInquiryItem[]>;
  markEmailInquiryRead(id: string): Promise<void>;
  isUrlNeedToEncrypt(url: string, encryptFlag?: string): boolean;
  encryptedReportUrl(url: string, encryptKey?: string): Promise<string>;
}

export interface ReqDateRange {
  start_date: string;
  end_date: string;
}

export interface PageAndSortParam {
  is_desc?: boolean;
  order_by?: string;
  page?: number;
  page_size?: number;
}

export interface ResEmailPanel {
  my_reply_count: number;
  my_reply_rate: string;
  other_open_rate: string;
  other_open_count: number;
  other_reply_rate: string;
  other_reply_count: number;
  receive_count: number;
  sent_count: number;
}

export interface ResWorktableEmployeeMemberList {
  accList: {
    accId: number;
    email: string;
    name: string;
  }[];
}

export interface ReqWorktableEmployeeList {
  page: number;
  pageSize: number;
  sort?: string;
  timeScope?: string;
  searchAccIds: string | undefined;
  searchDateScope: string;
}
export interface WorktableEmployeeListItem {
  avatar: string;
  name: string;
  accId: number;
  edmEmailSendCount?: number; //邮件营销发件数
  customerEmailSendCount?: number; //客户邮件发送数
  customerEmailReplyCount?: number; //回复客户邮件数
  newCreatedCustomerCount?: number; //新建客户数
  newCreatedContactCount?: number; //新建客户联系人数
  newCreatedFollowCount?: number; //新建跟进动态数
  newCreatedOrderCount?: number; //新增订单数
  champion?: number; //二进制表示
}
export interface ResWorktableEmployeeList {
  page: number;
  pageSize: number;
  totalSize: number;
  sort: string;
  content: WorktableEmployeeListItem[];
}

export interface ResWorkbenchCityInfo {
  currentTimeMillis: number;
  city: WorkbenchCityDetailInfo;
}

export interface WorkbenchCityDetailInfo {
  cityId: number;
  cityName: string;
  countryName: string;
  continent: string;
  timezone: {
    timezoneName: string;
    utc: string;
    name: string;
    timezoneId: string;
    momentId: string;
  };
}

export interface WorkbenchNoticeListItem {
  id: number; //lastId，分页用id
  notifyId: number;
  subject: string;
  content: string;
  type: number;
  jumpUrl: string;
  bizId: string;
  notifyAt: string;
}
export interface ResWorkbenchNoticeList {
  notifications: WorkbenchNoticeListItem[];
  leftCount: number;
}

export interface ReqWorkbenchNoticeListParams {
  lastId?: number;
  pageSize: number;
}

export interface WorkbenchCityListItem {
  cityId: number;
  cityName: string;
  countryName: string;
  continent: string;
  timezone: {
    timezoneName: string;
    utc: string;
    name: string;
    timezoneId: string;
    momentId: string;
  };
}
export interface ResWorkbenchCityList {
  currentTimeMillis: number;
  defaultCity: WorkbenchCityDetailInfo;
  cityList: WorkbenchCityListItem[];
}

export interface WorkbenchCurrencyListItem {
  currencyCode: string;
  currencyCnName: string;
}
export interface ResWorkbenchCurrencyList {
  currencyList: WorkbenchCurrencyListItem[];
}

export interface ResWorkbenchExchangeRate {
  currencyCode: string;
  currencyCNName: string;
  rate: string;
  updateAt: string;
}

export interface ResWorkbenchKnwoledgeListItem {
  title: string;
  url: string;
}

export interface ResWorkbenchArticleListItem {
  createTime: string;
  url: string;
  title: string;
  id: number;
}

export interface ResWorkbenchKnwoledgeList {
  help: {
    centerUrl: string;
    helpDocList: ResWorkbenchKnwoledgeListItem[];
  };
  knowledge: {
    centerUrl: string;
    docList: ResWorkbenchKnwoledgeListItem[];
    fameHallList: ResWorkbenchArticleListItem[];
  };
}

export interface ResWorktableSendCount {
  availableSendCount: number;
  orgAvailableSendCount: number;
  sendCount: number;
  singleSendCount: number;
  totalSendCount: number;
}
export interface ReqWorktableArticleList {
  status?: number;
  typeId?: number;
  pageSize?: number;
  pageNumber?: number;
  tagId?: number;
}

export interface ReqAllStagePanel {
  account_id_list: string[];
}

export interface WkStageItem {
  customerCount: number;
  stageId: string;
  stageName: string;
}

export interface ResMyStagePanel {
  stageList: WkStageItem[];
}

export interface ResAllStagePanel {
  stageList: WkStageItem[];
}

export interface ResWroktableArticleList {
  total: number;
  rows: WorktableArticleList[];
}

export interface WorkTableActionsItem {
  action: string;
  description: string;
  num: number;
}

export interface WorktableFunctionsItem {
  actions: WorkTableActionsItem[];
  description: string;
  function: string;
  menu: string;
  menu2: string;
}

export interface ResWorktableSysUsage {
  description: string;
  functions: WorktableFunctionsItem[];
  module: string;
}

export interface WorktableArticleList {
  id: number;
  title: string;
  status: number;
  createTime: string;
  updateTime: string;
}

export interface ResCustomerPanel {
  new_company_count: number;
  new_contact: number;
  new_follow_count: number;
  new_opportunity_count: number;
  new_order_count: number;
}

export interface ReqFollowsPanel extends ReqDateRange, PageAndSortParam {
  account_id_list?: string[];
  company_level?: string;
  star_level?: string;
}

export interface ResFollowsPanel {
  asc_flag: boolean;
  order_by: string;
  origin_size: number;
  page: number;
  page_size: number;
  total_page: number;
  total_size: number;
  content: Array<FollowsPanelItem>;
}

export interface FollowsPanelItem {
  company_id: string;
  company_name: string;
  company_level: string;
  follow_time: string;
  star_level: string;
}

export interface ResSchedulePanel {
  asc_flag: boolean;
  order_by: string;
  origin_size: number;
  page: number;
  page_size: number;
  total_page: number;
  total_size: number;
  content: Array<SchedulePanelItem>;
}

export interface SchedulePanelItem {
  id: string;
  relate_id: string;
  relate_name: string;
  relate_type: string;
  schedule_id: number;
  catalog_id: number;
  recurrence_id: number;
  schedule_time: string;
  subject: string;
}

export interface ResAccountRange {
  principalInfoVOList: Array<{
    account_id: string;
    account_name: string;
    nick_name: string;
  }>;
}

export interface ResEdmPanel {
  sendCount: number;
  arriveCount: number;
  arriveRatio: number;
  readNum: number;
  readRatio: number;
  replyCount: number;
  unsubscribeCount: number;
  traceCount: number;
}

export interface ResNotice {
  id: string;
  closeable: boolean;
  code: number;
  content: string;
  message: string;
}

export interface TodoEmailItem {
  subject: string;
  sender: string;
  summary: string;
  receiveAt: string;
  mid: string;
  tid: string;
}

export interface ResTodoPanel {
  page: number;
  pageSize: number;
  totalSize: number;
  emailList: TodoEmailItem[];
}

export interface ResEmailInquirySwitch {
  entranceSwitch: boolean;
  subscribeCustomerSwitch: boolean;
}

export interface ResEmailInquiryItem {
  id: string;
  email: string;
  timestamp: number;
  unread: boolean;
  mail: MailEntryModel;
}
