/* eslint-disable camelcase */
import { Api } from '../_base/api';

export interface InsertWhatsAppApi extends Api {
  // 获取列表
  getSenderList(): Promise<SenderList>;
  // 新增
  addSender(req: Sender): Promise<Sender>;
  // 删除
  deleteSender(req: { sender: string }): Promise<Sender>;
  // 更新
  updateSender(req: Sender): Promise<Sender>;
  // 更新状态
  updateSenderStatus(req: { sender: string; status: string | number }): Promise<boolean>;
  // 查询绑定状态
  queryBindStatus(): Promise<SenderStatus>;
  // 查询我的统计数据
  getWhatsAppStatisticList(req: IStatisticReq): Promise<IStatisticResp>;
  // 查询全部统计数据
  getWhatsAppAllStatisticList(req: IStatisticReq): Promise<IStatisticResp>;
  // 获取已分配列表
  getAllotList(req: { sender: string }): Promise<AllotList>;
  // 获取可分配人员列表
  getAllotPersonList(req: { sender: string }): Promise<AllotList>;
  // 添加分配
  addAllot(req: AddAllotReq): Promise<boolean>;
  // 取消分配
  deleteAllot(req: AddAllotReq): Promise<boolean>;
  // 获取个人号发送列表
  getPersonalSenderList(): Promise<PersonalSenderList>;
  // 获取个人号发送列表分页
  getPersonalSenderListV2(req: PersonalSenderListDataReq): Promise<PersonalSenderListData>;
  // 获取个人号联系人列表
  getPersonalContactList(req: PersonalWAContactReq): Promise<any>;
  // 获取个人号消息记录
  getPersonalMessageList(req: any): Promise<any>;
  // 查询个人号近x天联系人
  getPersonalRecentlyContactCount(req: PersonalWARecentlyContactReq): Promise<PersonalWARecentlyContactRes>;
  // 查询个人号近x天消息
  getPersonalRecentlyMessageCount(req: PersonalWARecentlyMessageReq): Promise<PersonalWARecentlyMessageRes>;
  // 获取商业号联系人列表
  getBusinessContactList(req: any): Promise<any>;
  // 获取商业号消息记录
  getBusinessMessageList(req: any): Promise<any>;
  loginPersonalWA(req: any): Promise<any>;
  logoutPersonalWA(req: any): Promise<any>;
  getWhatsAppAccountList(): Promise<any>;
  getWhatsAppAccountListV2(whatsApp: string): Promise<WhatsAppSenderItemRes>;
  // 获取两个账号直接是否聊天过
  getWhatsAppChatted(req: WAChattedReq): Promise<any>;
  // 获取通道配额列表
  getChannelList(req: ChannelParams): Promise<ChannelListRes>;
  // 分配通道配额
  addChannelQuota(req: { quotas: AddChannelQuotaReqItem[] }): Promise<void>;
  // 获取下属列表
  getSubList(resourceLabel?: ResourceLabel): Promise<UserItemInfo[]>;
  // 重新分配通道配额
  updateChannelQuota(req: UpdateChannelQuotaReq): Promise<void>;
  // 解除绑定whatsapp号码
  unbindChannel(req: UnbindChannelReq): Promise<void>;

  getOperateLog(req: {
    page: number;
    pageSize: number;
    filterType?: string;
    endTime?: string;
    startTime?: string;
    accountId?: string[];
    orderBy?: string;
    direction?: string;
  }): Promise<{ content: WAOperationLog[]; totalSize: number; totalPage: number }>;
  getWhatsAppList(): Promise<WANumberList[]>;
  recordExport(req: { endTime: string; filterType?: string; startTime: string; accountId?: string[] }): Promise<RecordExport>;
  waAccConfig(): Promise<EditAccConfigRequest>;
  waAccConfigEdit(req: EditAccConfigRequest): Promise<boolean>;
  getOperateLogDetail(req: { id: string }): Promise<WAOperationLog>;
  getOperateLogType(): Promise<Array<{ label: string; value: string }>>;
  addKeyword(req: WaAddKeywordReq): Promise<boolean>;
  deleteKeyword(id: string): Promise<boolean>;
  getKeywordList(): Promise<WaOrgKeywordRes>;

  getWAReddot(): Promise<{ redDot: boolean }>;

  getAllocationMode(): Promise<ModeType>;
  updateAllocationMode(mode: { mode: ModeType }): Promise<void>;
  addWaMarketingTask(req: FormData): Promise<boolean>;
  marketTaskList(req: MarketTaskListReq): Promise<PageListVoMarketingTaskResponse>;
  marketTaskDetailList(req: MarketTaskDetailReq): Promise<PageListVoMarketingTaskDetailResponse>;
  marketTaskDetail(id: string): Promise<MarketingTaskResponse>;
  marketTaskImportTemplate(): Promise<ExportResponse>;
  marketTaskTemplateAnalyze(req: FormData): Promise<string[]>;
  getMarketChannelList(type: 'MULTI_SEND' | 'JOIN_GROUP'): Promise<MarketChannelsState>;
  getMarketSendList(): Promise<MarketChannelsState>;
  getWAChannelContactList(number: string): Promise<WAChannelContactListRes>;
  maskVerifyWhatsappNumber(req: string[]): Promise<MaskResVerifyWhatsappNumber>;
  getOrdersWa(): Promise<GetOrdersWaRes>;
  getWaGPTQuota(): Promise<WaGPTQuotaRes>;
  getWaGPTConfig(): Promise<WaGPTConfigRes>;
  getWaGPTMsg(req: WaGPTMsgReq): Promise<WaGPTMsgRes>;
  getGroupQrCode(transportId: string, orgId: string): Promise<WaGroupAccount>;
  reconnectGroupQrCode(transportId: string, orgId: string): Promise<boolean>;
  logoutWa(transportId: string, orgId: string): Promise<boolean>;
  createWaGroupTask(req: WaGroupTask): Promise<boolean>;
  getNewChannelId(type: 'MULTI_SEND' | 'JOIN_GROUP'): Promise<string>;
  groupHistoryKeywords(): Promise<HistoryKeywords>;
  getWaGroupList(req: GroupListReq): Promise<GroupListRes>;
  getWaGroupNumberList(req: GroupNunberListReq): Promise<GroupNunberListRes>;
  getGroupTaskList(req: GroupTaskListReq): Promise<GroupTaskListRes>;
  getGroupTaskSummary(taskId: string): Promise<GroupTaskItem>;
  getGroupTaskDetail(req: { taskId: string; page: number; pageSize: number }): Promise<GroupTaskDetail>;

  checkJoinGroupResult(req: { taskId: string; link: string; groupId?: string }): Promise<JoinGroupResult>;
  getWaMultiSendQuota(): Promise<WaMultiSendQuotaRes>;

  getMgmtChannelList(): Promise<{ bind: boolean; channels: WaMgmtChannel[] }>;
  getMgmtChannelId(): Promise<string>;
  getMgmtQrCode(req: { transportId: string }): Promise<WaMgmtQrCodeRes>;
  getMgmtChatList(req: WaMgmtChatListReq): Promise<WaMgmtChatListRes>;
  sendMgmtImgByUrl(req: WaMgmtSendImgByUrlReq): Promise<WaMgmtSendImgByUrlRes>;
  logoutMgmt(req: { transportId: string }): Promise<boolean>;

  getWaOrgStat(req: WaOrgStatReq): Promise<WaOrgStatRes>;
  // getStatisticsList(req: StatisticsListReq): Promise<StatisticsListRes>;
  getWaWorkload(req: StatisticsListReq): Promise<AllWaWorkloadRes>;
  getWaChannelAllList(): Promise<AllChannelListRes>;
}

export interface WaAddKeywordReq {
  keyword: string;
  triggerType: WaOrgKeywordTriggerType;
}

export type WaOrgKeywordTriggerType = 'ALL' | 'RECEIVE' | 'SEND';

export interface WaOrgKeyword {
  id: string;
  keyword: string;
  triggerType: WaOrgKeywordTriggerType;
}

export interface WaOrgKeywordRes {
  content: WaOrgKeyword[];
}

export interface WaOrgStatReq {
  startTime?: string;
  endTime?: string;
  accountId?: string[];
}

export type WaOrgStatRes = Record<WaOrgStatKey, number>;

export interface WaMgmtChannel {
  accountName: string;
  avatarUrl: string;
  channelId: string;
  whatsApp: string;
  whatsAppNumber: string;
  loginStatus: 'LOGIN' | 'LOGOUT';
  bindStatus: string;
}

export enum WaMgmtPageState {
  INIT = 'INIT',
  QRCODE = 'QRCODE',
  AUTH = 'AUTH',
  LOGIN = 'LOGIN',
  READY = 'READY',
  BIND_ERROR = 'BIND_ERROR',
}

export interface WaMgmtQrCodeRes {
  pageState: WaMgmtPageState;
  qrCode?: string;
  errorMessage?: string;
}

export interface WaMgmtChatListReq {
  userId: string;
  replied?: boolean;
}

export interface WaMgmtChat {
  avatarUrl: string;
  chatId: string;
  group: boolean;
  formattedTitle: string;
}

export interface WaMgmtChatListRes {
  content?: WaMgmtChat[];
}

export interface WaMgmtSendImgByUrlReq {
  transportId: string;
  chatId: string;
  url: string;
  caption?: string;
}

export interface WaMgmtSendImgByUrlRes {
  id: {
    id: string;
  };
}

export interface UnbindChannelReq {
  channelId: string;
  whatsApp: string;
}

export interface UpdateChannelQuotaReq {
  accountId: number;
  quotas: UpdateChannelQuotaReqItem[];
}

export interface UpdateChannelQuotaReqItem {
  accountId: number;
  quota: number;
}

export interface AddChannelQuotaReqItem {
  accountId: number;
  quota: number;
}

export interface ChannelParams {
  pageSize: number;
  page: number;
}

export interface ChannelBindItem {
  channelId: string; // 通道ID
  leftUnbindNum: number; // 剩余解绑次数
  whatsApp: string; // whatsApp
  whatsAppNumber: string; // whatsApp号码，去掉后缀，仅展示
}

export interface ChannelListItem {
  accountId: number; // 被分配员工ID
  accountName: string; // 被分配员工昵称
  avatarUrl: string; // 被分配员工头像
  leftQuota: number; // 剩余额度
  quota: number; // 全部额度
  time: number; // 分配时间
  bindWhatsApps: ChannelBindItem[]; // 绑定号码
}

export interface ChannelListResPage {
  direct: string;
  orderBy: string;
  page: number;
  pageSize: number;
  totalPage: number;
  totalSize: number;
  content: ChannelListItem[];
}

export interface ChannelListRes {
  leftChannelQuota: number; // 企业剩余通道数量
  totalChannelQuota: number; // 企业全部通道数量
  pages?: ChannelListResPage;
}

export interface Sender {
  id?: string;
  orgName: string;
  fbmId: string;
  wabaId: string;
  sender: string;
  status?: string | number;
}

export interface SenderStatus {
  orgStatus: string;
  senderStatus: boolean;
  templateStatus: string;
}

export type SenderList = Array<Sender>;

export interface IStatisticReq {
  page: number;
  pageSize: number;
  contactName?: string;
  deliveryCountGt?: number;
  readCountGt?: number;
  replyCountGt?: number;
  type?: string;
}
export interface IContact {
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactType: string;
  deliveryCount: number;
  readCount: number;
  replyCount: number;
  totalSendCount: number;
}

export interface IStatisticResp {
  accId: number;
  orgId: number;
  detail: Array<IContact>;
  pageInfo: {
    page: number;
    pageSize: number;
    totalPage: number;
    totalSize: number;
  };
}
type AccountInfo = {
  accId: string;
  accName: string;
  accEmail: string;
};
export interface AllotItem {
  accountInfo: AccountInfo;
  allotTime: number;
}
export type AllotList = Array<AllotItem>;

export interface AddAllotReq {
  accId: string;
  sender: string;
}

export interface PersonalSender {
  accountInfo: AccountInfo;
  firstSendTime: number;
  lastSendTime: number;
  loginStatus: 0 | 1; // 0-登录中、1-退出登录
  logoutTime: number;
  loginTime: number;
  sender: string;
}

export type PersonalSenderList = Array<PersonalSender>;

export interface PersonalSenderListData {
  page: number;
  pageSize: number;
  totalPage: number;
  totalSize: number;
  content: PersonalSenderList;
}

export interface PersonalSenderListDataReq {
  page: number; // 0
  pageSize: number; // 20
}

export interface PersonalWAContactReq {
  searchAccId: string;
  sender: string;
  startTime?: number;
  endTime?: number;
}

export interface PersonalWARecentlyContactReq {
  searchAccId: string;
  sender: string;
}

export interface PersonalWARecentlyContactRes {
  recentlyDays: number;
  contactCount: number;
}

export interface PersonalWARecentlyMessageReq {
  searchAccId: string;
  sender: string;
  toWaSender: string;
}

export interface PersonalWARecentlyMessageRes {
  recentlyDays: number;
  totalMessageCount: number;
  recentlyDaysMessageCount: number;
}

export interface PersonalWAContactItem {
  contactName: string;
  to: string;
  recorders: {
    toAvatar: string;
    to: string;
    content: string;
  }[];
}

export type PersonalWAContactRes = Array<PersonalWAContactItem>;

export interface WAChattedReq {
  sender: string;
  toWaSender: string;
}

export interface UserItemInfo {
  accId: number;
  nickName: string;
  avatarUrl?: string;
}

export type ResourceLabel = 'WHATSAPP_PERSONAL_MANAGE' | 'WHATSAPP_EMPHASIS_MANAGE_LIST' | 'WHATSAPP_GROUP_SEND';
export interface WAOperationLog {
  id: string;
  bizId: string;
  bizName: string;
  bizType: number;
  operateAt: string;
  operateContent: string;
  operator: string;
  uniqueId: string;
  userId: string; // 用户id
  type: WaMessageType;
  chatId: string; // 会话
  messageId: string; // 消息id
  content: string;
}

/** 操作类型：
 * CHAT_MESSAGE_REVOKE_EVERYONE-单聊消息删除（在所有设备上），
 * CHAT_MESSAGE_REVOKE_ME-单聊消息删除（本机），
 * CHAT_REMOVED-会话删除，
 * CHAT_TRANSFER-会话转移，
 * SEND_KEYWORD-发送消息包含关键字
 */
export enum WaMessageType {
  CHAT_MESSAGE_REVOKE_EVERYONE = 'CHAT_MESSAGE_REVOKE_EVERYONE',
  CHAT_MESSAGE_REVOKE_ME = 'CHAT_MESSAGE_REVOKE_ME',
  CHAT_REMOVED = 'CHAT_REMOVED',
  CHAT_TRANSFER = 'CHAT_TRANSFER',
  SEND_KEYWORD = 'SEND_KEYWORD',
}

export interface ReactionResponse {
  id?: string;
  msgId?: string;
  reaction?: string;
  senderId?: string;
  timestamp?: number;
}
export interface MessageResponse {
  ack?: number;
  author?: string;
  body?: string;
  caption?: string;
  chatId?: string;
  duration?: string;
  filename?: string;
  forwarded?: boolean;
  from?: string;
  fromMe?: boolean;
  height?: number;
  id?: string;
  isNewMsg?: boolean;
  lat?: string;
  lng?: string;
  loc?: string;
  mimetype?: string;
  nosUrl?: string;
  /** 翻译原文 */
  original?: string;
  pageCount?: number;
  quotedMsg?: MessageResponse;
  reactionList?: Array<ReactionResponse>;
  recipients?: Array<string>;
  /** 删除消息id */
  revokedMessageId?: string;
  rowId?: number;
  self?: string;
  /** 敏感词类别 */
  sensitiveType?: number;
  serializedId?: string;
  size?: number;
  star?: boolean;
  subtype?: string;
  t?: number;
  to?: string;
  /** 消息转移通知，转移发起人id */
  transferFromUserId?: string;
  type?: string;
  vcardList?: Array<Record<string, any>>;
  waveform?: Record<string, any>;
  width?: number;
}
export interface MessengerData {
  /** 列表内容 */
  content?: Array<MessageResponse>;
  /** 排序方向 */
  direct?: string;
  /** 排序字段 */
  orderBy?: string;
  /** 页码 */
  page?: number;
  /** 当前页大小 */
  pageSize?: number;
  /** 当前时间戳 */
  timestamp?: string;
  /** 总页数 */
  totalPage?: number;
  /** 总大小 */
  totalSize?: number;
}

export interface WANumberList {
  /** 账号名称 */
  accountName?: string;
  /** 头像 */
  avatarUrl?: string;
  /** 是否封禁 */
  ban?: boolean;
  /** 绑定状态 */
  bindStatus?: string;
  /** 通道id */
  channelId?: string;
  /** 登陆状态 */
  loginStatus?: string;
  /** whatsApp */
  whatsApp?: string;
  /** whatsApp号码，去掉后缀，仅展示 */
  whatsAppNumber?: string;
}

export interface RecordExport {
  filename?: string;
  nosUrl?: string;
  size?: number;
}

export enum ModeType {
  free = 'free',
  limit = 'limit',
  allocation = 'allocation',
}

export interface MarketTaskListReq {
  endTime: string;
  page: number;
  pageSize: number;
  searchTaskName: string;
  startTime: string;
  taskStatus: 'WAIT' | 'RUNNING' | 'FINISHED';
}
export interface MarketingTaskAttach {
  filename?: string;
  mimetype?: string;
  type?: string;
  url?: string;
}
export interface MarketingTaskResponse {
  /** 附件链接 */
  attach?: MarketingTaskAttach;
  /** 消息内容 */
  content?: string;
  /** 任务创建时间 */
  createAt?: string;
  /** 触达人数 */
  reachCount?: number;
  /** 发信号码列表 */
  senders?: Array<string>;
  /** 发送人数 */
  sentCount?: number;
  /** 成功率 */
  successRate?: string;
  /** 目标人数 */
  targetCount?: number;
  /** 任务id */
  taskId?: string;
  /** 任务名称 */
  taskName?: string;
  /** 任务状态 */
  taskStatus?: string;
  taskStatusName: string;
}
export interface PageListVoMarketingTaskResponse {
  /** 列表内容 */
  content?: Array<MarketingTaskResponse>;
  /** 排序方向 */
  direct?: string;
  /** 排序字段 */
  orderBy?: string;
  /** 页码 */
  page?: number;
  /** 当前页大小 */
  pageSize?: number;
  /** 当前时间戳 */
  timestamp?: string;
  /** 总页数 */
  totalPage?: number;
  /** 总大小 */
  totalSize: number;
}

export interface MarketTaskDetailReq {
  taskId: string;
  page: number;
  pageSize: number;
  searchNumber: string;
  sendStatus: 'SUCCESS' | 'FAILURE';
}

export interface MarketingTaskDetailResponse {
  /** 发信wa号码 */
  fromNumber?: string;
  /** 发送时间 */
  sendAt?: string;
  /** 发送状态 */
  sendStatus?: string;
  sendStatusName: string;
  /** 收信wa号码 */
  toNumber?: string;
}
export interface PageListVoMarketingTaskDetailResponse {
  /** 列表内容 */
  content?: Array<MarketingTaskDetailResponse>;
  /** 排序方向 */
  direct?: string;
  /** 排序字段 */
  orderBy?: string;
  /** 页码 */
  page?: number;
  /** 当前页大小 */
  pageSize?: number;
  /** 当前时间戳 */
  timestamp?: string;
  /** 总页数 */
  totalPage?: number;
  /** 总大小 */
  totalSize?: number;
}

export interface ExportResponse {
  filename?: string;
  nosUrl?: string;
  size?: number;
}

export interface MarketChannelState {
  /** 账号名称 */
  accountName?: string;
  /** 头像 */
  avatarUrl?: string;
  /** 绑定状态 */
  bindStatus?: string;
  /** 通道id */
  channelId?: string;
  /** 登陆状态 */
  loginStatus?: string;
  /** whatsApp */
  whatsApp?: string;
  /** whatsApp号码，去掉后缀，仅展示 */
  whatsAppNumber?: string;
  ban: boolean;
}
export interface MarketChannelsState {
  /** 是否可绑定 */
  bind?: boolean;
  /** 通道绑定whatsapp列表 */
  channels?: Array<MarketChannelState>;
}

export interface WAChannelContactListItem {
  avatarUrl: string;
  channelId: string;
  lastContactAt: string;
  loginStatus: string;
  name: string;
  number: string;
  userId: string;
  timestamp: string;
}

export interface WAChannelContactListRes {
  content: WAChannelContactListItem[];
}

export interface MaskResVerifyWhatsappNumberItem {
  number: string;
  exists: boolean;
  filterCode: string;
  filterDesc: string;
}

export interface MaskResVerifyWhatsappNumber {
  filterId: string;
  whatsAppFilterResults: MaskResVerifyWhatsappNumberItem[];
}
export interface GetOrdersWaRes {
  bizWA: boolean;
  personWA: boolean;
}

export interface WaGPTQuotaRes {
  total: number;
  available: number;
}
type Language = {
  label: string;
  languageEng: string;
  value: string;
};
export interface WaGPTConfigRes {
  languages: Language[];
  tones: string[];
}

export interface WaGPTMsgReq {
  language: string;
  originalContent: string;
  tone: string;
  wordCountLevel: number;
}

export interface WaGPTMsgRes {
  prompt: string;
  text: string;
  gptRecordId: number;
}

export interface WaGroupAccount {
  pageState: 'QRCODE' | 'INIT' | 'READY' | 'LOGIN' | 'CLOSED';
  qr: string;
  info: { id: string; name: string; waId: string; avatarUrl?: string };
  error: { code: number; message: string };
}

export interface WaGroupTask {
  keyword: string;
  links: string[];
}

export interface HistoryKeywords {
  content: {
    keyword: string;
  }[];
}

export interface GroupListReq {
  keyword: string;
  createAtStart?: string;
  createAtEnd?: string;
}

export interface GroupListItem {
  groupId: string;
  groupName: string;
  taskId: string;
  waCount: string;
}

export interface GroupListRes {
  content: GroupListItem[];
}

export interface GroupNunberListReq {
  groupId: string;
  taskId: string;
}

export interface GroupNunberListItem {
  number: string;
  sentCount: number;
}

export interface GroupNunberListRes {
  content: GroupNunberListItem[];
}
export interface GroupTaskListReq {
  createAtStart?: string;
  createAtEnd?: string;
  page: number;
  pageSzie: number;
  searchKeyword?: string;
}

export interface GroupTaskItem {
  createAt: string;
  keyword: string;
  linkCount: number;
  linkErrorCount: number;
  linkFailureCount: number;
  linkSuccessCount: number;
  taskId: string;
  taskStatus: string;
  waCount: number;
}

export interface GroupTaskListRes {
  content: GroupTaskItem[];
  page: number;
  pageSize: number;
  totalSize: number;
  orderBy: string;
  direct: string;
}

export interface JoinGroupResult {
  groupName: string;
  groupId: string;
  link: string;
  linkStatus: string;
  waCount: number;
}

export interface GroupTaskDetail {
  page: number;
  pageSize: number;
  totalSize: number;
  content: Array<JoinGroupResult>;
}

export interface WaMultiSendQuotaRes {
  remainCount: number; // 可发送量
  singleTotalCount: number;
  totalCount: number; // 总发送量
}

export interface WhatsAppSenderItem {
  /** 会话id */
  chatId?: string;
  /** 最近联系时间戳 */
  lastContactAt?: string;
  /** WhatsApp账号 */
  sender?: string;
  /** sender类型，PERSONAL-个人号、BUSINESS-商业号 */
  senderType?: string;
}
export interface WhatsAppSenderItemRes {
  whatsAppSenderList: Array<WhatsAppSenderItem>;
}

export interface EditAccConfigRequest {
  /** 自动回复是否开启，为空代表不变更 */
  autoReplyTurnOn?: boolean;
  /** 重点关注通知类型 */
  operateNotifyType?: 'NOT_NOTIFY' | 'NOTIFY' | 'GROUP_NOTIFY';
}
export type WaOrgStatKey = 'totalCount' | 'chatRemovedCount' | 'messageRevokedCount' | 'keywordCount' | 'transferCount';

export interface AccountFilterItem {
  accId: string;
  userId: string;
}
export interface StatisticsListReq {
  accountFilters: AccountFilterItem[];
  endTime: string;
  page?: number;
  pageSize?: number;
  startTime: string;
  direction?: 'DESC' | 'ASC';
  orderBy?: string;
}
export interface StatisticsListRes {
  /** 列表内容 */
  content?: Array<WAContentItem>;
  /** 排序方向 */
  direct?: string;
  /** 排序字段 */
  orderBy?: string;
  /** 页码 */
  page?: number;
  /** 当前页大小 */
  pageSize?: number;
  /** 当前时间戳 */
  timestamp?: string;
  /** 总页数 */
  totalPage?: number;
  /** 总大小 */
  totalSize: number;
}
export interface WAContentItem {
  accId: number;
  accName: string;
  newChatCount: number;
  newClueCount: number;
  newCustomerCount: number;
  number: string;
  receiveMessageCount: number;
  retainedChatCount: number;
  retainedClueCount: number;
  retainedCustomerCount: number;
  sendMessageCount: number;
  userId: string;
}

export interface WaWorkloadRes {
  newChatCount: number;
  newClueCount: number;
  newCustomerCount: number;
  receiveMessageCount: number;
  retainedChatCount: number;
  retainedClueCount: number;
  retainedCustomerCount: number;
  sendMessageCount: number;
}

export type WaWorkloadResKey = keyof WaWorkloadRes;

export interface AllWaWorkloadRes {
  list: StatisticsListRes;
  statistics: WaWorkloadRes;
}

export interface Channel {
  accountId: string;
  accountName: string;
  avatarUrl: string;
  ban: boolean;
  bindStatus: string;
  channelId: string;
  loginStatus: string;
  whatsApp: string;
  whatsAppNumber: string;
  unitPathList: UnitOrgType[];
}

export interface AllChannelListRes {
  bind: boolean;
  channels: Channel[];
}

export interface UnitListType {
  parentUnitId: string;
  unitId?: string;
  unitName?: string;
  title: any;
  key: string;
  value: string;
  checkable: boolean;
  children?: UnitListType[];
  selectable?: boolean;
  isLeaf: boolean;
  rawData: Channel;
  className?: string;
}
export interface UnitOrgType {
  unitList: UnitListType[];
}
