import { Api } from '../_base/api';
import { HostingPlanListModel, EmailTemplatesResModel, SavePlanReqModel, DelPlanReqModel } from './edm_marketing';

export interface AddContactReq {
  taskId: string; // 任务id
  contacts: Array<Record<string, string>>; // 操作邮箱列表
  check: number;
}

// 类型定义-获取联系人状态
export interface ContactStatusReq {
  taskId: string; // 任务id
}

export interface ContactStatus {
  status: number;
  desc: string;
}

export interface ContactStatusRes {
  displayStatus: ContactStatus[];
}

// 类型定义-删除联系人
export interface DeleteContactReq {
  taskId: string; // 任务id
  emailList: string[]; // 操作邮箱列表
}

// 类型定义-开启/关闭联系人营销状态
export interface SwitchContactReq {
  taskId: string; // 任务id
  emailList: string[]; // 操作邮箱列表
  status: number; // 0:关闭，1:开启
}

// 类型定义-联系人列表
export interface ContactListReq {
  taskId: string; // 任务id
  page: number;
  pageSize: number;
  displayStatus?: number; // 联系人状态
  email?: string; // 查询邮箱
  groupId?: string;
  planId?: string;
  taskStatus?: number; // 开启状态
  userSource?: number; // 联系人来源 0:手动添加，1:自动挖掘
  taskRound?: number; // 营销轮次
  userEmailStatus?: number; // 营销状态
}

export interface ReplyContactListReq {
  taskId: string; // 任务id
  // page: number;
  // pageSize: number;
  planId?: string;
  contactEmail?: string; // 查询邮箱
  edmEmailIds?: string[]; // 邮件id列表
}

export interface ReplyContactListItem {
  edmEmailIds: string[]; // 邮件id列表,
  email: string; // 邮箱地址,
  name: string; // 联系人姓名,
  userSource: 0 | 1; // 0，手动营销 1，自动营销
  userSourceName: string; // 联系人来源,
  edmSubject: string; // 邮件主题,
  replyCount: number; // 回复次数,
  lastReplyTime: string;
  rank: number; // 排序
}
export interface ReplyContactListRes {
  replyList: ReplyContactListItem[];
}

export interface HostingContactItem {
  email: string; // 邮件地址
  name: number; // 联系人姓名
  displayPlanName: string; // 营销方案名称
  displayStatus: number; // 联系人状态
  displayStatusDesc: string; // 联系人状态描述
  createTime: number; // 添加时间,时间戳
  recentSendTime: number; // 最近发信时间，时间戳
  nextSendTime: number; // 下次发信，时间戳
  sendNum: number; // 发件次数
  arriveNum: number; // 送达次数
  readNum: number; // 打开次数
  reply: number; // 是否回复，0:未回复，1:已恢复
  unsubscribe: number; // 是否退订,0:未退订，1:已退订
  userTaskStatus: number; // 营销状态，0：开启，1：关闭
  userSource: number; // 联系人来源
  recReason: string; // 推荐理由
  sourceName: string;
  planId: string;
}

export interface ContactListRes {
  userList: HostingContactItem[];
  totalPage: number;
  page: number;
  pageSize: number;
  totalSize: number;
}

// 类型定义-联系人详情统计
export interface ContactDetailStatReq {
  taskId: string; // 任务id
  email: string; // 查询邮箱
}

export interface ContactDetailStat {
  userStatsDetail: {
    sendNum: number; // 发件次数
    arriveNum: number; // 送达次数
    readNum: number; // 打开次数
    replyNum: number; // 回复次数(手动回复)
    unsubscribe: number; // 是否退订,0:未退订，1:已退订
    productClickNum: number; // 商品点击数
    traceClickNum: number; // 链接点击数
  };
}

export interface ContactDetailStatRes {
  userStatsDetail: ContactDetailStat;
}

// 类型定义-联系人详情列表
export interface ContactDetailListReq {
  taskId: string; // 任务id
  page: number;
  pageSize: number;
  email: string; // 查询邮箱
}

export interface ContactDetailItem {
  email: string; // 邮件地址
  name: string; // 联系人姓名
  sendTime: number; // 发送时间,时间戳
  arrive: number; // 是否送达，0:未送达，1：送达
  read: number; // 是否打开，0:未打开，1：打开
  reply: number; // 是否回复，0:未回复，1:已经回复
  unsubscribe: number; // 是否退订，0:未退订，1：已退订
  productClickNum: number; // 商品点击数
  traceClickNum: number; // 链接点击数
  emailMid: string; // 邮件mid，通过这个字段去查邮件内容详情
  edmEmailId: string;
}

export interface ContactDetailListRes {
  userList: ContactDetailItem[];
  totalPage: number;
  page: number;
  pageSize: number;
  totalSize: number;
}

export type ContactSource = 'manage' | 'autoTask' | 'handTask';
export interface AiHostingApi extends Api {
  getAiHostingContactStatus(req: ContactStatusReq): Promise<ContactStatusRes>;
  deleteAiHostingContact(req: DeleteContactReq): Promise<string>;
  switchAiHostingContact(req: SwitchContactReq): Promise<string>;
  getAiHostingContactList(req: ContactListReq): Promise<ContactListRes>;
  getAiHostingReplyContactList(req: ReplyContactListReq): Promise<ReplyContactListRes>;
  getAiHostingContactDetailStatistics(req: ContactDetailStatReq): Promise<ContactDetailStatRes>;
  getAiHostingContactDetailList(req: ContactDetailListReq): Promise<ContactDetailListRes>;
  addAiHostingContact(req: AddContactReq): Promise<string>;
  getAiHostingPlanInfos(req: ContactStatusReq): Promise<HostingPlanListModel>;
  getAiHostingPlanV2Infos(req: ContactStatusReq): Promise<HostingPlanListModel>;
  getAiHostingPlanEmailTemplates(): Promise<EmailTemplatesResModel>;
  saveAiHostingPlan(req: SavePlanReqModel): Promise<string>;
  delAiHostingPlan(req: DelPlanReqModel): Promise<string>;
}
