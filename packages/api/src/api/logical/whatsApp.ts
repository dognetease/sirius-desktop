/* eslint-disable camelcase */
import { Api } from '@/api/_base/api';
import { QueryConfig } from '@/api/data/new_db';
// import { getLabel } from '../../utils/global_label';
import { getIn18Text } from '@/api/utils';

export interface WhatsAppApi extends Api {
  getQuota(req: RequestWhatsAppQuota): Promise<WhatsAppQuota>;
  reportWhatsAppOpportunity(req: any): Promise<any>;
  getOrderQuota(req: RequestWhatsAppOrderQuota): Promise<ResponseWhatsAppOrderQuota>;
  pullContact(): Promise<WhatsAppContact[]>;
  pullMessage(req: RequestWhatsAppPullMessage): Promise<ResponseWhatsAppPullMessage>;
  sendMessage(req: RequestWhatsAppSendMessage): Promise<WhatsAppMessage>;
  getContacts(query: QueryConfig): Promise<WhatsAppContact[]>;
  getMessages(query: QueryConfig): Promise<WhatsAppMessage[]>;
  getTemplates(req: RequestWhatsAppTemplates): Promise<ResponseWhatsAppTemplates>;
  getApprovedTemplates(req: RequestWhatsAppApprovedTemplates): Promise<ResponseWhatsAppApprovedTemplates>;
  getTemplateDetail(req: { id: string }): Promise<WhatsAppTemplate>;
  getTemplateCategories(): Promise<{ value: string; desc: string }[]>;
  getTemplateLanguages(): Promise<{ value: string; desc: string }[]>;
  getPublicTemplates(): Promise<WhatsAppTemplate[]>;
  createTemplateDraft(req: WhatsAppTemplate): Promise<WhatsAppTemplate>;
  updateTemplateDraft(req: WhatsAppTemplate): Promise<WhatsAppTemplate>;
  deleteTemplateDraft(req: { id: string }): Promise<null>;
  submitTemplate(req: WhatsAppTemplate): Promise<WhatsAppTemplate>;
  getJobTemplateLink(): Promise<string>;
  extractJobReceiverFile(req: FormData): Promise<WhatsAppFileExtractResult>;
  extractJobReceiverText(req: { text: string }): Promise<WhatsAppFileExtractResult>;
  createJob(req: RequestEditWhatsAppJob): Promise<ResponseEditWhatsAppJob>;
  editJob(req: RequestEditWhatsAppJob): Promise<ResponseEditWhatsAppJob>;
  deleteJob(req: { jobId: string }): Promise<null>;
  revertJob(req: { jobId: string }): Promise<null>;
  getJobDetail(req: { jobId: string }): Promise<WhatsAppJobDetail>;
  getJobs(req: RequestWhatsAppJobs): Promise<ResponseWhatsAppJobs>;
  getJobsStat(req: RequestWhatsAppJobsStat): Promise<WhatsAppJobStat>;
  getJobReportReceivers(req: RequestWhatsAppJobReport): Promise<ResponseWhatsAppJobReportReceivers>;
  getJobReportStat(req: RequestWhatsAppJobReportStat): Promise<WhatsAppJobStat>;
  doAiSearch(req: WhatsAppAiSearchParams): Promise<WhatsAppAiSearchResponse>;
  getChatList(req: WhatsAppChatListRequest): Promise<WhatsAppChatListResponse>;
  getChatListByIds(req: WhatsAppChatListByIdsReq): Promise<WhatsAppChatListByIdsRes>;
  getChatInitAround(req: WhatsAppChatInitAroundRequest): Promise<WhatsAppChatInitAroundResponse>;
  getMessageList(req: WhatsAppMessageListRequest): Promise<WhatsAppMessageListReponse>;
  getMessageListCRM(req: WhatsAppMessageListCRMReq): Promise<WhatsAppMessageListCRMRes>;
  getMessageListCRMAround(req: WhatsAppMessageListCRMAroundReq): Promise<WhatsAppMessageListCRMAroundRes>;
  getNosUploadToken(req: { fileName: string }): Promise<SnsNosUploadInfo>;
  getNosDownloadUrl(req: { fileName: string; nosKey: string }): Promise<string>;

  getContactsByCompanyId(resourceId: string, resourceType?: number): Promise<PersonalMessageContact>;
  getPersonalMessageHistory(req: ReqPersonalMessageHistory): Promise<PersonalMessageHistory>;
  getBusinessMessageContacts(req: WhatsAppBusinessMessageContactsRequest): Promise<WhatsAppBusinessMessageContactsResponse>;
  getBusinessMessageHistory(req: WhatsAppBusinessMessageRequest): Promise<WhatsAppBusinessMessageResponse>;

  getPersonalJobWhatsAppList(params: { [key: string]: string | number }): Promise<PersonalJobWhatsAppRes>;
  getPersonalJobWhatsAppDetail(params: { jobId: string }): Promise<PersonalJobWhatsAppDetailRes>;
  getPersonalJobWhatsAppStatistic(params: { jobId: string }): Promise<PersonalJobWhatsAppStatisticRes>;
  getPersonalJobWhatsAppDetailTable(req: PersonalJobWhatsAppDetailTableReq): Promise<PersonalJobWhatsAppDetailTableRes>;
  getPersonalJobWhatsAppDetailExport(params: { jobId: string }): Promise<PersonalJobWhatsAppDetailExportRes>;
  personalJobCreate(req: any): Promise<any>;
  personalJobUpdate(req: any): Promise<any>;

  verifyWhatsappNumber(req: string[]): Promise<ResVerifyWhatsappNumber>;
  getGlobalAreaForAISearch(): Promise<{ label: string; code: string }[]>;

  // v2
  createJobV2(req: RequestEditWhatsAppJobV2): Promise<ResponseEditWhatsAppJob>;
  deleteJobV2(req: { jobId: string }): Promise<null>;
  editJobV2(req: RequestEditWhatsAppJobV2): Promise<ResponseEditWhatsAppJob>;
  getJobDetailV2(req: { jobId: string }): Promise<WhatsAppJobDetailV2>;
  revertJobV2(req: { jobId: string }): Promise<null>;
  getJobsV2(req: RequestWhatsAppJobs): Promise<ResponseWhatsAppJobsV2>;
  getJobsStatV2(req: RequestWhatsAppJobsStat): Promise<WhatsAppJobStat>;
  getTemplatesV2(req: RequestWhatsAppTemplatesV2): Promise<ResponseWhatsAppTemplatesV2>;
  getTemplateCategoriesV2(): Promise<{ value: string; desc: string }[]>;
  getTemplateLanguagesV2(): Promise<{ value: string; desc: string }[]>;
  editTemplateDraftV2(req: WhatsAppTemplateV2): Promise<WhatsAppTemplateV2>;
  deleteTemplateDraftV2(req: { id: string }): Promise<null>;
  submitTemplateV2(req: WhatsAppTemplateV2): Promise<WhatsAppTemplateV2>;
  getTemplateDetailV2(req: { id: string }): Promise<WhatsAppTemplateV2>;
  getApprovedTemplatesV2(req: RequestWhatsAppApprovedTemplatesV2): Promise<ResponseWhatsAppApprovedTemplatesV2>;
  getJobReportStatV2(req: RequestWhatsAppJobReportStat): Promise<WhatsAppJobStat>;
  getJobReportReceiversV2(req: RequestWhatsAppJobReport): Promise<ResponseWhatsAppJobReportReceivers>;
  getBsp(): Promise<WhatsAppBSP>;
  getOrgStatusV2(): Promise<WhatsAppOrgStatusV2>;
  getTplStatusV2(): Promise<WhatsAppTplStatusV2>;
  createAppV2(): Promise<WhatsAppCreateAppResV2>;
  noticeRegisterFinishV2(): Promise<void>;
  getManagerPhones(req: WhatsAppManagerPhonesReq): Promise<WhatsAppManagerPhonesRes>;
  getAllotPhones(): Promise<WhatsAppPhoneV2[]>;
  getPhoneAllotAccounts(req: WhatsAppPhoneAllotAccountsReq): Promise<WhatsAppPhoneAllotAccountsRes>;
  getPhoneAllotSelect(req: WhatsAppPhoneAllotSelectReq): Promise<WhatsAppPhoneAllotSelectRes>;
  allotPhoneToAccounts(req: WhatsAppAllotPhoneReq): Promise<void>;
  recycleAllotPhone(req: WhatsAppRecycleAllotPhoneReq): Promise<void>;
  getStatisticV2(req: WhatsAppStatisticReqV2): Promise<WhatsAppStatisticResV2>;
  getQuotaV2(): Promise<WhatsAppQuotaV2>;
  getChatListV2(req: WhatsAppChatListReqV2): Promise<WhatsAppChatListResV2>;
  getChatListByIdsV2(req: WhatsAppChatListByIdsReqV2): Promise<WhatsAppChatListByIdsResV2>;
  getChatInitAroundV2(req: WhatsAppChatInitAroundReqV2): Promise<WhatsAppChatInitAroundResV2>;
  getMessageListV2(req: WhatsAppMessageListReqV2): Promise<WhatsAppMessageListResV2>;
  sendMessageV2(req: WhatsAppSendMessageReqV2): Promise<WhatsAppSendMessageResV2>;
}

export interface WhatsAppMessageListReqV2 {
  chatId: string;
  direction: 'DESC' | 'ASC';
  lastSeqNo: string;
  limit: number;
}

export interface WhatsAppMessageListResV2 {
  hasMore: boolean;
  recorders: WhatsAppMessageV2[];
}

export interface WhatsAppMessageListCRMReq {
  direction: 'DESC' | 'ASC';
  from: string;
  to: string;
  lastSeqNo?: number;
  resourceId: string;
  resourceType: 1 | 2 | 3; // 资源类型：1-客户，2-线索，3-商机
  size?: number;
}

export interface WhatsAppMessageListCRMAroundReq {
  seqNo: string;
}

export interface WhatsAppMessageListCRMRes {
  page: number;
  pageSize: number;
  totalPage: number;
  totalSize: number;
  content: BusinessWhatsAppMessage[];
}
export interface WhatsAppMessageListCRMAroundRes {
  page: number;
  pageSize: number;
  totalPage: number;
  totalSize: number;
  content: BusinessWhatsAppMessage[];
}

export interface BusinessWhatsAppMessage {
  orgId: number;
  accountId: number;
  accountName: string;
  seqNo: string;
  messageId: string;
  id?: string;
  content: {
    text: {
      body: string;
    };
  };
  messageType: string;
  template: any;
  from: string;
  to: string;
  toName: string;
  messageDirection: number;
  sentAt: number;
  deliveryAt: number;
  seenAt: number;
  quoteMessageId: string;
  status: string;
}

export interface WhatsAppMessageListResV2 {
  hasMore: boolean;
  recorders: WhatsAppMessageV2[];
}

export interface WhatsAppSendMessageReqV2 {
  chatId: string;
  content: WhatsAppMessageContentV2;
  messageType: WhatsAppMessageTypeV2;
}

export interface WhatsAppSendMessageResV2 {
  seqNo: string;
  messageId: string;
}

export interface WhatsAppChatListByIdsReqV2 {
  chatIds: string[];
  query: string;
}

export interface WhatsAppChatListByIdsResV2 {
  contacts: WhatsAppChatItemV2[];
}

export interface WhatsAppChatListReqV2 {
  from: string;
  direction: 'EARLIER' | 'LATER';
  lastSeqNo: string;
  limit: number;
  query: string;
}

export interface WhatsAppChatListResV2 {
  chats: WhatsAppChatItemV2[];
  hasMore: boolean;
}

export interface WhatsAppChatInitAroundReqV2 {
  chatId: string;
  limit: number;
}

export interface WhatsAppChatInitAroundResV2 {
  chats: WhatsAppChatItemV2[];
  hasMore: boolean;
  newerHasMore: boolean;
  earlierHasMore: boolean;
}

export interface WhatsAppChatItemV2 {
  chatId: string;
  from: string;
  to: string;
  toName: string;
  lastMsg: WhatsAppMessageV2;
  lastMsgTime: number;
  latestReceiveMsgTime: number;
}

export interface WhatsAppMessageV2 {
  messageId: string;
  messageType: WhatsAppMessageTypeV2;
  messageDirection: WhatsAppMessageDirection;
  seqNo: string;
  orgId: string;
  accountId: string;
  accountName: string;
  from: string;
  to: string;
  toName: string;
  sentAt: number;
  deliveryAt: number;
  seenAt: number;
  template: WhatsAppTemplateV2;
  quoteMessageId: string;
  content: WhatsAppMessageContentV2;
}

export interface WhatsAppMessageContentV2 {
  text?: {
    body: string;
    preview_url: string;
  };
  image?: {
    id: string;
    link: string;
    caption: string;
  };
  video?: {
    id: string;
    link: string;
    caption: string;
  };
  audio?: {
    id: string;
    link: string;
  };
  sticker?: {
    id: string;
    link: string;
  };
  document?: {
    id: string;
    link: string;
    filename: string;
  };
  location?: {
    name: string;
    address: string;
    latitude: string;
    longitude: string;
  };
  template?: {
    components: WhatsAppTemplateParamV2[];
  };
}

export enum WhatsAppMessageTypeV2 {
  text = 'text',
  image = 'image',
  video = 'video',
  audio = 'audio',
  sticker = 'sticker',
  document = 'document',
  location = 'location',
  template = 'template',
}

export enum WhatsAppMessageTypeNameV2 {
  text = '文本',
  image = '图片',
  video = '视频',
  audio = '音频',
  sticker = '表情',
  document = '文件',
  location = '坐标',
  template = '模板',
}

export interface WhatsAppQuotaV2 {
  quotaCount: number;
  usedCount: number;
}

export interface WhatsAppStatisticReqV2 {
  type: string;
  page: number;
  pageSize: number;
  contactName?: string;
  deliveryCountGt?: string;
  isCustomer?: boolean;
  readCountGt?: string;
  replyCountGt?: string;
}

export interface WhatsAppStatisticItemV2 {
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactType: 'CUSTOMER' | 'CLUE' | 'UNKNOWN';
  deliveryCount: number;
  readCount: number;
  replyCount: number;
  totalSendCount: number;
}

export interface WhatsAppStatisticResV2 {
  accId: string;
  orgId: string;
  pageInfo: { totalSize: number };
  detail: WhatsAppStatisticItemV2[] | null;
}

export interface WhatsAppPhoneAllotAccount {
  allotTime: string;
  accountInfo: {
    accEmail: string;
    accId: string;
    accName: string;
  };
}

export interface WhatsAppPhoneAllotAccountsReq {
  phone: string;
}

export type WhatsAppPhoneAllotAccountsRes = WhatsAppPhoneAllotAccount[];

export interface WhatsAppPhoneAllotSelectReq {
  phone: string;
}

export type WhatsAppPhoneAllotSelectRes = WhatsAppPhoneAllotAccount[];

export interface WhatsAppAllotPhoneReq {
  allotAccIds: string[];
  phone: string;
}

export interface WhatsAppRecycleAllotPhoneReq {
  accId: string;
  phone: string;
}

export enum WhatsAppQuotaUserType {
  OFFICIAL = 0,
  TRIAL = 1,
}

export enum WhatsAppQuotaUserTypeName {
  '正式' = 0,
  '试用' = 1,
}

export enum WhatsAppAuthenticateState {
  NOT_EXIST = -1,
  NOT_AUTHENTICATED = 0,
  AUTHENTICATED = 1,
}

export enum WhatsAppAuthenticateStateName {
  '不存在' = -1,
  '未认证' = 0,
  '认证通过' = 1,
}

export interface RequestWhatsAppQuota {
  productId: 'WhatsApp';
}

export interface WhatsAppQuotaDetail {
  quotaCount: number; // 总量
  usedCount: number; // 已用量
  deliCountPer24h: number; // 总量【字段已废弃】
}

export interface RequestWhatsAppOrderQuota {
  productId: 'WhatsApp';
}

export interface WhatsAppOrderQuotaDetail {
  moneyPerYear: number;
  deliCountPer24h: number;
  probationTime: number;
  templateNum: number;
}

export type WhatsAppOrderQuotaTypeMap = Record<'FREE' | 'PREMINUM', WhatsAppOrderQuotaDetail>;

export interface ResponseWhatsAppOrderQuota {
  quotaPerTypeMap: WhatsAppOrderQuotaTypeMap;
}

export interface WhatsAppQuota {
  userType: WhatsAppQuotaUserType;
  authenticateState: WhatsAppAuthenticateState;
  basePackage: WhatsAppQuotaDetail; // 企业 24h 用量描述
  whatsappSendCount: WhatsAppQuotaDetail; // 企业总用量描述
  templateNum: WhatsAppQuotaDetail;
  expireDay: number;
  payOnceMonthUsed: number; // 在本月，一共用了流量包中的多少
  freeCycleMonthQuota: WhatsAppQuotaDetail; // 每月赠送的量
}

export type ResponseWhatsAppContact = {
  contactName: string;
  to: string;
}[];

export enum WhatsAppMessageDirection {
  LX_TO_WHATSAPP = 0, // 0: 灵犀 -> 客户
  WHATSAPP_TO_LX = 1, // 1: 客户 -> 灵犀
}

export interface WhatsAppTemplateStructure {
  header: {
    format: 'IMAGE' | 'TEXT';
    text?: string;
    example?: string;
    mediaUrl?: string;
  };
  body: {
    text: string;
    examples?: string[];
  };
  footer?: {
    text: string;
  };
  buttons?: {
    type: string | 'URL';
    text: string;
    url: string;
  }[];
}

export interface WhatsAppTemplate {
  category: string;
  createBy: string;
  createTime: string;
  id: string;
  language: string;
  name: string;
  status: string;
  structure: WhatsAppTemplateStructure;
}

export interface WhatsAppTemplateV2Component {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  text?: string;
  format?: 'IMAGE' | 'TEXT';
  example?: {
    header_text?: string[];
    custom_header_handle_url?: string;
    body_text?: string[][];
  };
  buttons?: {
    type: 'URL';
    text: string;
    url: string;
  }[];
}

export interface WhatsAppTemplateV2 {
  category: string;
  createBy: string;
  createTime: string;
  id: string;
  language: string;
  name: string;
  status: string;
  qualityScore: string;
  rejectedReason: string;
  components: WhatsAppTemplateV2Component[];
}

export enum WhatsAppVariableType {
  FIXED = 0,
  FILE_FIELD = 1,
}

export const getWhatsAppVariableTypeName: () => Record<WhatsAppVariableType, string> = () => ({
  0: getIn18Text('GUDINGZHI'),
  1: getIn18Text('DAORUWENJIANZIDUAN'),
});

export interface WhatsAppVariable {
  type: WhatsAppVariableType | 'text' | 'image';
  value: string | number | any;
  text?: string;
  image?: {
    link: string;
  };
}

export interface WhatsAppTemplateParams {
  header?: {
    type?: 'IMAGE' | 'TEXT';
    mediaUrl?: string;
    filename?: string;
    latitude?: number;
    longitude?: number;
    variables?: WhatsAppVariable[];
  };
  body?: {
    variables: WhatsAppVariable[];
  };
  buttons?: {
    type: string;
    variables: WhatsAppVariable[];
  }[];
}

export interface WhatsAppTemplateParamV2 {
  type: 'header' | 'body' | 'button';
  sub_type?: 'url';
  index?: number;
  parameters?: WhatsAppVariable[];
}

export interface WhatsAppTemplatePlaceholders {
  header?: {
    type: 'IMAGE' | 'TEXT';
    mediaUrl?: string;
    filename?: string;
    latitude?: number;
    longitude?: number;
    placeholder: string;
  };
  body?: {
    placeholders: string[];
  };
  buttons?: {
    type: string;
    parameter: string;
  }[];
}

export enum WhatsAppTemplateStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  IN_APPEAL = 'IN_APPEAL',
  REJECTED = 'REJECTED',
}

export const getWhatsAppTemplateStatusName: () => Record<WhatsAppTemplateStatus, string> = () => ({
  DRAFT: getIn18Text('CAOGAO'),
  APPROVED: getIn18Text('YITONGGUO'),
  IN_APPEAL: getIn18Text('SHENHEZHONG'),
  REJECTED: getIn18Text('WEITONGGUO'),
});

export enum WhatsAppTemplateStatusColor {
  DRAFT = 'rgba(38, 42, 51, 0.08)',
  APPROVED = '#F1FAF7',
  IN_APPEAL = 'rgba(107, 169, 255, 0.1)',
  REJECTED = 'rgba(247, 79, 79, 0.1)',
}

export enum WhatsAppFileExtractIndex {
  WHATSAPP = 0,
  CONTACT_NAME = 1,
  COMPANY_NAME = 2,
}

export enum WhatsAppFileExtractStatus {
  SUCCESS = 0,
  REPEAT = 1,
  INVALID = 2,
}

export enum WhatsAppFileExtractStatusName {
  '成功' = 0,
  '重复' = 1,
  '格式有误' = 2,
}

export interface WhatsAppFileExtractResult {
  header: string[];
  body: {
    rowId: number;
    status: WhatsAppFileExtractStatus;
    content: Record<number, string>;
  }[];
}

export enum WhatsAppMessageType {
  TEXT = 'TEXT',
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  LOCATION = 'LOCATION',
  STICKER = 'STICKER',
  TEMPLATE = 'TEMPLATE',
  CONTACT = 'CONTACT',
  AUDIO = 'AUDIO',
}

export enum WhatsAppMessageTypeName {
  TEXT = '文本',
  DOCUMENT = '文件',
  IMAGE = '图片',
  VIDEO = '视频',
  LOCATION = '坐标',
  STICKER = '表情',
  TEMPLATE = '模板',
  CONTACT = '联系人',
  AUDIO = '音频',
}

export interface WhatsAppMessageContent {
  text?: 'string';
}

export interface WhatsAppMessage {
  seqNo: string;
  orgId: string;
  accountId: string;
  accountName: string;
  accountAvatar: string;
  messageId: string;
  messageType: WhatsAppMessageType;
  messageDirection: WhatsAppMessageDirection;
  content: string;
  quoteMessageId?: string; // 引用消息
  from: string;
  fromName: string;
  to: string;
  toAvatar: string;
  contactName: string;
  contactWhatsApp?: string;
  sentAt: number; // 发送时间
  deliveryAt: number; // 送达时间
  seenAt: number; // 已读时间
}

export interface WhatsAppContact {
  contactWhatsApp: string;
  contactName: string;
  lastSeqNo: string;
}

export interface RequestWhatsAppPullMessage {
  data: {
    contactWhatsApp: string;
    lastSeqNo: string;
    limit: number;
  }[];
}

export interface ResponseWhatsAppPullMessage {
  recorders: WhatsAppMessage[];
}

export interface RequestWhatsAppSendMessage {
  from: string;
  to: string;
  messageType: WhatsAppMessageType;
  content: {
    text?: string;
    mediaUrl?: string;
    filename?: string;
    fileSize?: number;
    fileType?: string;
  };
}

export interface RequestWhatsAppTemplates {
  templateName: string;
  templateStatus?: string;
  start: number;
  limit: number;
}

export interface RequestWhatsAppTemplatesV2 {
  templateName: string;
  templateStatus?: string;
  page: number;
  pageSize: number;
}

export interface ResponseWhatsAppTemplates {
  templates: WhatsAppTemplate[];
  size: number;
}

export interface ResponseWhatsAppTemplatesV2 {
  content: WhatsAppTemplateV2[] | null;
  totalSize: number;
}

export interface RequestWhatsAppApprovedTemplates {
  templateName: string;
  start: number;
  limit: number;
}

export interface RequestWhatsAppApprovedTemplatesV2 {
  templateName: string;
  page: number;
  pageSize: number;
}

export interface ResponseWhatsAppApprovedTemplates {
  templates: WhatsAppTemplate[];
  size: number;
}

export interface ResponseWhatsAppApprovedTemplatesV2 {
  content: WhatsAppTemplateV2[] | null;
  totalSize: number;
}

export enum WhatsAppJobSubmitType {
  DRAFT = 0,
  SUBMIT = 1,
}

export enum WhatsAppJobSendType {
  SEND_NOW = 0,
  CRON_SEND = 1,
}

export const getWhatsAppJobSendTypeName: () => Record<WhatsAppJobSendType, string> = () => ({
  0: getIn18Text('LIJIFASONG'),
  1: getIn18Text('DINGSHIFASONG'),
});

export enum WhatsAppJobState {
  DRAFT = 0,
  TO_BE_SEND = 1,
  SENDING = 2,
  SENT = 3,
  REVERT = 4,
  FAILED = 5,
}

export const getWhatsAppJobStateName: () => Record<WhatsAppJobState, string> = () => ({
  0: getIn18Text('CAOGAO'),
  1: getIn18Text('DAIFASONG'),
  2: getIn18Text('FASONGZHONG'),
  3: getIn18Text('YIFASONG'),
  4: getIn18Text('YICHEXIAO'),
  5: getIn18Text('SHIBAI'),
});

export const WhatsAppJobStateColor: Record<WhatsAppJobState, { color: string; backgroundColor: string }> = {
  0: { color: '#3081F2', backgroundColor: '#F2F7FE' },
  1: { color: '#4C6AFF', backgroundColor: '#F2F5FF' },
  2: { color: '#ED8A2F', backgroundColor: '#FFF8ED' },
  3: { color: '#00A870', backgroundColor: '#E7FBF3' },
  4: { color: '#4F4F61', backgroundColor: '#F0F3F5' },
  5: { color: '#e45244', backgroundColor: '#ffdedb' },
};

export interface RequestEditWhatsAppJob {
  jobId: string;
  jobName: string;
  receivers: WhatsAppFileExtractResult;
  sendTime: number;
  sendTimeZone: string;
  sendType: WhatsAppJobSendType;
  submit: WhatsAppJobSubmitType;
  templateId: string;
  templateParams: WhatsAppTemplateParams;
}

export interface RequestEditWhatsAppJobV2 {
  businessPhone: string;
  jobId?: string;
  jobName: string;
  receivers: WhatsAppFileExtractResult;
  sendTime: number;
  sendTimeZone: string;
  sendType: WhatsAppJobSendType;
  submit: WhatsAppJobSubmitType;
  templateId: string;
  templateParams: WhatsAppTemplateParamV2[];
}

export interface ResponseEditWhatsAppJob {
  jobId: string;
  jobName: string;
  receiverNum: number;
}

export interface WhatsAppJobDetail {
  createAccId: number;
  createAccName: string;
  createTime: number;
  id: string;
  jobId: string;
  jobName: string;
  jobState: WhatsAppJobState;
  receivers: WhatsAppFileExtractResult;
  sendTime: number;
  sendTimeZone: string;
  sendType: WhatsAppJobSendType;
  templateId: string;
  templateParams: WhatsAppTemplateParams;
  deliveryNum?: number;
  readNum?: number;
  receiverNum?: number;
  replyNum?: number;
}

export interface WhatsAppJobDetailV2 {
  businessPhone: string;
  createAccId: number;
  createAccName: string;
  createTime: number;
  id: string;
  jobId: string;
  jobName: string;
  jobState: WhatsAppJobState;
  receivers: WhatsAppFileExtractResult;
  sendTime: number;
  sendTimeZone: string;
  sendType: WhatsAppJobSendType;
  templateId: string;
  templateParams: WhatsAppTemplateParamV2[] | null;
  deliveryNum?: number;
  readNum?: number;
  receiverNum?: number;
  replyNum?: number;
}

export interface RequestWhatsAppJobs {
  page: number;
  pageSize: number;
  keyWord?: string;
  beginTime?: number;
  endTime?: number;
  jobState?: WhatsAppJobState;
  sendType?: WhatsAppJobSendType;
}

export interface ResponseWhatsAppJobs {
  jobList: WhatsAppJobDetail[];
  pageInfo: {
    totalSize: number;
  };
}

export interface ResponseWhatsAppJobsV2 {
  jobList: WhatsAppJobDetailV2[];
  pageInfo: {
    totalSize: number;
  };
}

export type WhatsAppOrgStatusV2 = 'UNPURCHASED' | 'UNREGISTERED' | 'REGISTERED';

export type WhatsAppTplStatusV2 = 'NOT_APPLY' | 'IN_APPEAL' | 'APPROVED' | 'REJECTED';

export interface WhatsAppPhoneV2 {
  allotNum?: number;
  code_verification_status: string;
  current_limit: string;
  name_status: string;
  phone: string;
  quality_rating: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOW';
  register_status: string;
  status: string;
  verified_name: string;
  createBy?: string;
  createTime?: string;
}

export enum WhatsAppBSP {
  IB = 'IB',
  NX = 'NX',
}

export interface WhatsAppCreateAppResV2 {
  app_id: string;
  app_name: string;
  token: string;
}

export interface WhatsAppManagerPhonesReq {
  page: number;
  pageSize: number;
}

export interface WhatsAppManagerPhonesRes {
  content: WhatsAppPhoneV2[];
  totalSize: number;
}

export type RequestWhatsAppJobsStat = Omit<RequestWhatsAppJobs, 'page' | 'pageSize'>;

export interface WhatsAppJobStat {
  jobNum: number;
  deliveryNum: number;
  deliveryRatio: number;
  readNum: number;
  readRatio: number;
  replyNum: number;
  replyRatio: number;
  sendNum: number;
}

export enum WhatsAppJobReceiverSendState {
  TO_BE_SEND = -1,
  SUCCESS = 0,
  FAILURE = 1,
  REVERT = 2,
  SENT = 3,
}

export const getWhatsAppJobReceiverSendStateName: () => Record<WhatsAppJobReceiverSendState, string> = () => ({
  '-1': getIn18Text('DAIFASONG'),
  0: getIn18Text('CHENGGONG'),
  1: getIn18Text('SHIBAI'),
  2: getIn18Text('YICHEXIAO'),
  3: getIn18Text('FASONGZHONG'),
});

export enum WhatsAppJobReceiverSendStateColor {
  '#5FC375' = 0,
  '#F74F4F' = 1,
}

export enum WhatsAppJobReceiverSendStateV2 {
  TO_BE_SEND = 0,
  SENT = 1,
  SUCCESS = 2,
  FAILURE = 3,
  REVERT = 4,
}

export const getWhatsAppJobReceiverSendStateNameV2: () => Record<WhatsAppJobReceiverSendStateV2, string> = () => ({
  0: getIn18Text('DAIFASONG'),
  1: getIn18Text('FASONGZHONG'),
  2: getIn18Text('CHENGGONG'),
  3: getIn18Text('SHIBAI'),
  4: getIn18Text('YICHEXIAO'),
});

export enum WhatsAppJobReceiverSendStateColorV2 {
  '#5FC375' = 2,
  '#F74F4F' = 3,
}

export interface RequestWhatsAppJobReport {
  jobId: string;
  page: number;
  pageSize: number;
  beginTime?: number;
  endTime?: number;
  receiverName?: string;
  sendState?: WhatsAppJobReceiverSendState | undefined;
  version?: number;
}

export interface ResponseWhatsAppJobReportReceivers {
  receiverList: WhatsAppJobReportReceiver[];
  pageInfo: {
    totalSize: number;
  };
}

export enum WhatsAppJobReportReceiverType {
  CUSTOMER = 'CUSTOMER',
  OPPORTUNITY = 'OPPORTUNITY',
  CLUE = 'CLUE',
}

export const getWhatsAppJobReportReceiverTypeName: () => Record<WhatsAppJobReportReceiverType, string> = () => ({
  CUSTOMER: getIn18Text('KEHU'),
  OPPORTUNITY: getIn18Text('SHANGJI'),
  CLUE: getIn18Text('XIANSUO'),
});

export interface WhatsAppJobReportReceiver {
  isRead: number;
  isReply: number;
  latestReplyTime: number;
  readTime: number;
  receiverName: string;
  receiverPhone: string;
  receiverType: WhatsAppJobReportReceiverType;
  replyTime: number;
  sendState: number;
  sender: string;
  chatId?: string;
}

export type RequestWhatsAppJobReportStat = Omit<RequestWhatsAppJobReport, 'page' | 'pageSize'>;

export interface WhatsAppAiSearchParams {
  page: number;
  pageSize: number;
  content: string;
  countryList?: string[];
  siteList: string[];
  tagList: string[];
  isAllMatch: number;
}

export interface WhatsAppAiSearchExportParams {
  content: string;
  countryList?: string[];
  siteList: string[];
  tagList: string[];
  isAllMatch: number;
  includePhoneNumberList: string[];
}

export enum WhatsAppAiSearchTaskStatus {
  SEARCHING = 1,
  STOP = 2,
}

export enum WhatsAppAiSearchTag {
  DELIVERED = 'DELIVERED',
}

export enum WhatsAppAiSearchTagName {
  DELIVERED = '触达过',
}

export enum WhatsAppAiSearchTagColor {
  DELIVERED = '#398E80',
}

export enum WhatsAppAiSearchTagBackgroundColor {
  DELIVERED = '#D6F7F1',
}

export interface WhatsAppAiSearchResult {
  linkUrl: string;
  phoneNumber: string;
  countryCname: string;
  country: string;
  title: string;
  tagList: WhatsAppAiSearchTag[];
  createTime: string;
  updateTime: string;
}

export interface WhatsAppAiSearchResponse {
  taskStatus: WhatsAppAiSearchTaskStatus;
  total: string;
  list: WhatsAppAiSearchResult[];
}

export interface WhatsAppChatItem {
  to: string;
  toName: string;
  lastMsg: WhatsAppMessage;
  lastSeqNo: string;
  latestReceiveMsgTime: number;
  latestReceiveMsgSender: string;
}

export interface WhatsAppChatListRequest {
  direction: 'EARLIER' | 'LATER';
  lastSeqNo: string;
  limit: number;
  query: string;
}

export interface WhatsAppChatListResponse {
  chats: WhatsAppChatItem[];
  hasMore: boolean;
}

export interface WhatsAppChatListByIdsReq {
  tos: string[];
  query: string;
}

export interface WhatsAppChatListByIdsRes {
  chats: WhatsAppChatItem[];
}

export interface WhatsAppChatInitAroundRequest {
  to: string;
  limit: number;
}

export interface WhatsAppChatInitAroundResponse {
  chats: WhatsAppChatItem[];
  hasMore: boolean;
  newerHasMore: boolean;
  earlierHasMore: boolean;
}

export interface WhatsAppMessageListRequest {
  contactWhatsApp: string;
  direction: 'DESC' | 'ASC';
  lastSeqNo: string;
  limit: number;
}

export interface WhatsAppMessageListReponse {
  hasMore: boolean;
  recorders: WhatsAppMessage[];
}
export interface PersonalMessageContact {
  accounts: Array<{
    accountId: string;
    accountName: string;
    accountWhatsApp: string;
  }>;
  contacts: Array<{
    contactWhatsapp: string;
    contactName: string;
  }>;
}

export interface MessageHistoryModel {
  seqNo: string;
  orgId: string;
  accountId: string;
  accountName: string;
  messageId: string;
  content: any;
  messageType: string;
  from: string;
  fromName: string;
  to: string;
  toAvatar: string;
  contactName: string;
  messageDirection: number;
  sentAt: number;
  deliveryAt: number;
  seenAt: number;
  quoteMessageId: string;
}

export interface PersonalMessageHistory {
  count: number;
  page: number;
  recorders: MessageHistoryModel[];
}

export interface ReqPersonalMessageHistory {
  start?: number;
  limit?: number;
  whatsappId: string;
  accountId: string;
  accountWhatsApp: string;
  resourceId: string;
  resourceType?: number;
}

export interface WhatsAppBusinessMessageAccount {
  accountId: string;
  accountName: string;
}

export interface WhatsAppBusinessMessageContact {
  contactWhatsapp: string;
  contactName: string;
}

export interface WhatsAppBusinessMessageContactsRequest {
  resourceId: string;
  resourceType: 0 | 1 | 2 | 3;
}

export interface WhatsAppBusinessMessageContactsResponse {
  accounts: WhatsAppBusinessMessageAccount[];
  contacts: WhatsAppBusinessMessageContact[];
}

export interface WhatsAppBusinessMessageRequest {
  resourceId: string;
  resourceType: 0 | 1 | 2 | 3;
  accountIds: string[];
  contactWhatsApps: string[];
  start: number;
  limit: number;
}

export interface WhatsAppBusinessMessageResponse {
  recorders: WhatsAppMessage[];
  count: number;
}
export interface PersonalJobTask {
  jobId: string;
  jobName: string;
  jobStatus: string;
  receiverCount: number;
  deliveryCount: string;
  successRadio: number;
  executeTime: string;
  sender: string;
  creator: string;
}
export interface PersonalJobWhatsAppRes {
  jobInfoList: PersonalJobTask[];
  pageInfo: {
    totalSize: number;
  };
}

export interface PersonalJobWhatsAppDetailRes {
  jobName: string;
  jobStatus: string;
  executeTime: string;
  content: string;
}

export interface PersonalJobWhatsAppStatisticRes {
  sentCount: string;
  deliveryCount: string;
  successRadio: number;
}

export interface PersonalJobWhatsAppDetailTableReq {
  jobId: string;
  page: number;
  pageSize: number;
  receiver?: string;
  taskState?: number;
}

export interface TaskInfo {
  jobId: string;
  taskId: string;
  receiverName: string;
  receiverPhone: string;
  taskStatus: string;
  sendTime: string;
  sender: string;
}
export interface PersonalJobWhatsAppDetailTableRes {
  taskInfoList: TaskInfo[];
  pageInfo: {
    totalSize: number;
  };
}

export interface PersonalJobWhatsAppDetailExportRes {
  downloadUrl: string;
}

export interface SnsNosUploadInfo {
  bucketName: string;
  context: string;
  fileId: number;
  new: boolean;
  nosKey: string;
  token: string;
}

export interface VerifyWhatsappNumberResult {
  number: string;
  exists: boolean;
  filterCode: string;
  filterDesc: string;
}

export interface ResVerifyWhatsappNumber {
  filterId: string;
  whatsAppFilterResults: VerifyWhatsappNumberResult[];
}
