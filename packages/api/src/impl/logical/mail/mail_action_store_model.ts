import {
  DecryptedMailsCacheMap,
  EntityMailBox,
  MailAttrExchangeType,
  MailBoxEntryContactInfoModel,
  MailBoxModel,
  MailEncodings,
  MailEntryModel,
  MailFileAttachmentType,
  MailFileAttachModel,
  MailFlags,
  MailOpRecordActions,
  MailOrderedField,
  MailSearchCondition,
  MailSearchModelCondition,
  MailSendOperation,
  MailStatResult,
  // MailStatType,
  MemberType,
  ParsedContact,
  // StatResult,
  TaskInternalMap,
  TaskMail,
  ThreadCheckMode,
} from '@/api/logical/mail';
import { MedalInfo } from '@/api/logical/mail_praise';
import { NumberTypedMap, SequenceHelper, StringTypedMap } from '@/api/commonModel';
import { ContactModel, intBool, resultObject } from '@/api/_base/api';
import { SystemEvent } from '@/api/data/event';
import { ApiRequestConfig, CachePolicy, ResponseData } from '@/api/data/http';
import { StoredLock } from '@/api/data/store';
import { DBList } from '@/api/data/new_db';
import { getIn18Text } from '@/api/utils';

export type ResponseWithDrawResult = {
  recallresult: StringTypedMap<number>;
};

export const mailTable = {
  data: {
    dbName: 'mail_new' as DBList,
    tableName: 'mail_data',
  },
  content: {
    dbName: 'mail_new' as DBList,
    tableName: 'mail_content',
  },
  attachment: {
    dbName: 'mail_new' as DBList,
    tableName: 'mail_attachment',
  },
  status: {
    dbName: 'mail_new' as DBList,
    tableName: 'mail_status',
  },
  attr: {
    dbName: 'mail_new' as DBList,
    tableName: 'mail_attr',
  },
  statistic: {
    dbName: 'mail_new' as DBList,
    tableName: 'mail_statistic',
  },
  tpMail: {
    dbName: 'mail_new' as DBList,
    tableName: 'third_party_mail',
  },
  tpMailContent: {
    dbName: 'mail_new' as DBList,
    tableName: 'third_party_mail_content',
  },
};

export const mailBoxTable = {
  dbName: 'mail_new' as DBList,
  tableName: 'mail_box',
};

export const mailOperationTable = {
  dbName: 'mail_new' as DBList,
  tableName: 'operation',
};

export const mailComposeDataTable = {
  dbName: 'mail_new' as DBList,
  tableName: 'composed_mail',
};

export const mailUnfinishedMailTable = {
  dbName: 'mail_new' as DBList,
  tableName: 'unfinished_mail',
};

export type ResponseDeliverStatus = {
  result: number;
  msgType: number;
  modtime: string;
  msgid: string;
  rclResult: number;
  to: string;
  subj: string;
  tid: string;
  inner?: boolean;
};

export type ResponseGpKey = 'fid' | 'fromAddress' | 'flags.read' | 'sentDate' | 'flags.attached' | 'all';

/**
 * 统计信息定义
 */
export type Stats = {
  messageCount?: number;
  unreadThreadCount?: number;
  unreadMessageSize?: number;
  unreadMessageCount?: number;
  threadCount?: number;
  messageSize?: number;
};

/**
 *
 */
export type RequestAttachmentUpload = {
  fileName: string; // 文件名
  offset: number; // 上传偏移量
  size: number; // 文件长度
  attachmentId: number; // 附件id
  composeId: string; // 组信id
  contentType: string; // 文件类型
  _subAccount?: string; // 子账号
};
/**
 *
 */
export type ResponseFolderDef = {
  parent: number;
  name: string;
  id: number;
  auth2Locked?: boolean;
  flags: MailFlags;
  stats: Stats;
  keepPeriod?: number;
};

export interface ResponseContactStatsItem {
  address: string; // 联系人地址
  msgCnt: number; // 往来邮件总数
  newMsgCnt: number; // 未读邮件总数
  initialized: boolean; // 是否初始化完成
}

export interface ResponseContactStatsIAll {
  msgCnt: number; // 往来邮件总数 注：不同联系人下邮件可能有重叠,这里计数会重复计算
  newMsgCnt: number; // 未读邮件总数 注：同上，不同联系人下往来邮件有重叠时会重复计算
}

export interface ResponseContactStats {
  stats: ResponseContactStatsItem[];
  all: ResponseContactStatsIAll;
}

export interface MessageStat {
  msgcnt: number;
  msgsize: number;
  newmsgcnt: number;
  newmsgsize: number;
}

export type ResponseMessageStat = {
  all: MessageStat;
};

// type FolderResponse = ResponseData<ResponseFolderDef[]>;

export type RequestListMailEntry = {
  // checkThreadDetail 的 邮件id
  id?: string;
  fid?: number | number[]; // corp下可能为数组
  fids?: number[];
  start: number;
  limit: number;
  summaryWindowSize: number;
  returnTotal?: boolean;
  returnTag?: boolean;
  returnTid?: boolean;
  returnAttachments?: boolean;
  order?: MailOrderedField;
  desc?: boolean;
  skipLockedFolders?: boolean;
  filter?: MailSearchModelCondition;
  offsetmid?: string;
  ids?: string[];
  mode?: ThreadCheckMode;
  tag?: string[];
  topFlag?: string;
  relatedEmail?: string[];
  operator?: string;
  /**
   * 处理过程中参数，非调用接口参数
   * 标识是否处理联系人，用于减少获取邮件详情时的联系人重复处理
   */
  // ignoreContact?: boolean;
};

// https://sirius-dev1.qiye.163.com/doc.html#/mail-snapshot-server/search-email-controller/searchUsingPOST
export interface RequestCustomerListMailEntry {
  fids?: number[];
  exchangeType: 'all' | 'send' | 'receive';
  searchItems: RequestCustomerListMailEntryItem[];
  limit?: number;
  endTime: string;
  mid: string;
}

export interface RequestSubordinateListMailEntry {
  fids?: number[];
  exchangeType: 'all' | 'send' | 'receive';
  searchItems: RequestSubordinateListMailEntryItem[];
}

// https://lingxi.office.163.com/doc/#id=19000003349574&from=PERSONAL&parentResourceId=19000001355861&spaceId=505505527&ref=534674905&type=doc
export interface RequestCustomerMailUnreadEntry {
  companyIdList: string[];
  returnAll: 0 | 1; // 是否返回全部未读数 1-返回全部未读数，0-不返回全部未读数
}

export interface RequestCustomerMailTotalUnreadEntry {
  returnAll: 1; // 是否返回全部未读数 1-返回全部未读数，0-不返回全部未读数
}

export interface RequestCustomerListMailEntryItem {
  from: string;
  toList: string[];
}

export interface RequestSubordinateListMailEntryItem {
  from: string;
  toList: string[];
  limit: number;
  startTime?: string;
  endTime?: string;
}

// 查询聚合邮件列表参数 http://jira.netease.com/browse/QIYE163-14862
export type RequestThreadListMailEntry = {
  fids?: number[]; // 文件夹列表
  topFirst?: boolean;
  topFlag?: string;
  returnTag?: boolean; // 是否返回邮件的tag
  start: number;
  limit: number;
  summaryWindowSize: number; // 返回摘要的邮件数
  skipLockedFolders?: boolean; // 跳过安全锁文件夹
  returnAttachments?: boolean; // 返回附件列表
  filterFlags?: {
    read?: boolean;
    label0?: number; // 旗帜
  };
  tag?: string[]; // 标签列表
  mode?: ThreadCheckMode; // 返回模式列举方式count(默认), listid, listinfo
  returnTotal?: boolean; // 是否返回总数
  returnTid?: boolean; // 是否返回tid
};

// 查询聚合邮件详情参数 http://jira.netease.com/browse/QIYE163-14862
export type RequestThreadMailDetailEntry = {
  ids: string[];
  summaryWindowSize: number; // 返回摘要的邮件数
  order: MailOrderedField; // 排序字段,目前只有时间
  desc: boolean; // 是否为逆序
  returnTag: boolean; // 是否返回邮件的tag
  returnTotal: boolean; // 是否返回总数
  start: number;
  limit: number;
  returnConvInfo?: boolean; // 表示是否返回会话的基本信息,返回基本信息与返回会话下的邮件列表只能二选一，为true时会话id支持多个最多限制100，为false时，会话列表只支持1个；如果不满足,服务端会返回参数不合法
};

export type MailSearchConditionGp = {
  condistions: MailSearchCondition[];
  operator: 'and' | 'or';
};
export type MailSearchConditions = MailSearchCondition | MailSearchConditionGp;

export type RequestSearch = RequestListMailEntry & {
  pattern: string;
  'fts.ext': boolean;
  'fts.fields': string;
  windowSize: number;
  groupings: Partial<Record<ResponseGpKey, string>>;
  conditions: MailSearchConditions[];
};

export type ResponseUploadedAttachment = {
  actualSize: number;
  attachmentId: number;
  composeId: string;
  contentType: string;
  crc: number;
  crcOK: boolean;
  fileName: string;
  size: number;
};

export type ResponseMailCommonPart = {
  id: string;
  attachments: ResponseAttachment[];
  subject: string;
  priority: number;
  sentDate: string;
  from: string | string[];
  to: string | string[];
  cc: string[];
  bcc: string[];
  replyTo: string[];
  flags?: MailFlags;
  memo?: string;
};

export type ResponseMailContentEntry = ResponseMailCommonPart & {
  requestReadReceipt?: boolean;
  html?: ResponseAttachment;
  text?: ResponseAttachment;
  rtf?: ResponseAttachment;
  tid?: string;
  /**
   * 返回额外的信头, 每个信头都必须指定
   */
  headers?: any;
};

export type ReqMailReadCount = {
  tid: string;
  mid: string;
  fromEmail: string;
  _account?: string;
};

export type ReqMailReadDetail = {
  tid: string;
  mid: string;
  fromEmail: string;
  _account?: string;
};

export type ResponseMailListEntry = ResponseMailContentEntry & {
  isThread?: boolean;
  threadId?: string; // 会话ID
  threadMessageFirstId?: string; // 聚合邮件中第一封实体邮件ID
  threadMessageIds?: string[]; // 聚合邮件关联实体邮件ID
  threadMessageCount?: number;
  fid?: number;
  convFids?: number[];
  summary?: string;
  backgroundColor?: number;
  composeExtra?: any;
  antiVirusStatus?: string;
  /**
   * 扩展分类, 取值范围为 0 ~ 15; Client自己解释各个值的含义, 例如:
   0 : 未归类
   1 : 重要  --- 等同于红旗
   2 : 公司
   3 : 业务
   4 : 资讯
   5 : 亲友
   6 : 同学
   7 : 休闲
   8 : 趣闻
   9 - 14: 未定义, 应视同0
   15: 杂项
   */
  label0?: number;
  size?: number;
  encpwd?: string | null;
  recallable?: boolean;
  modifiedDate?: string;
  tag?: string[];
  // "from": string,
  // "to": string,
  receivedDate?: string;
  /**
   * 邮件召回结果
   */
  rclStatus?: number;
  /**
   * 邮件发送结果
   */
  sndStatus?: number;
  // 发信事务id
  tid?: string;
  // 收件人总数
  rcptCount?: number;
  // 已读数量
  readCount?: number;
  // 内域收件人总数
  innerCount?: number;
  // 内域已读数量
  innerRead?: number;
  /**
   * 是否群发单显
   */
  isOneRcpt?: boolean;
  // 任务邮件id
  taskId?: number;
  // 是否优先处理邮件
  preferred?: number;
  // 表扬信id，如果有值则是表扬信，没有则不是
  praiseId?: number;
  sentMailId?: string;
  langType?: string;
  langListMap?: Record<string, any>;
  eTeamType?: number;
  // 待办邮件的处理时间
  defer?: string;
  // 待办邮件的 im 通知
  deferNotice?: boolean;
  /**
   * 反垃圾信息返回
   */
  antispamInfo?: {
    RulesType?: string;
    asIgnoreReason?: string;
    asMailType?: string;
  };
  // 所属人 email 地址
  owner?: string;
  clientTimeZone?: string;
};

// interface ListEntryResponse extends ResponseData<ResponseMailListEntry[]> {
//     total: number,
//     midoffset: number
// }

export type ResponseThreadMailListEntry = {
  fid?: number;
  convFids?: number[]; // 会话所属于文件夹列表
  id: string; // 聚合邮件中第一封实体邮件ID
  convId: number; // 聚合邮件会话ID
  summary?: string;
  backgroundColor?: number;
  antiVirusStatus?: string;
  subject: string;
  flags?: MailFlags;
  priority: number;
  sentDate?: string;
  attachments?: ResponseAttachment[];
  /**
   * 扩展分类, 取值范围为 0 ~ 15; Client自己解释各个值的含义, 例如:
   0 : 未归类
   1 : 重要  --- 等同于红旗
   2 : 公司
   3 : 业务
   4 : 资讯
   5 : 亲友
   6 : 同学
   7 : 休闲
   8 : 趣闻
   9 - 14: 未定义, 应视同0
   15: 杂项
   */
  label0?: number;
  size?: number;
  encpwd?: any;
  recallable?: boolean;
  modifiedDate?: string;
  threadMessageCount?: number;
  threadMessageIds?: string[];
  tag?: string[];
  receivedDate?: string;
  from: string | string[];
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  memo?: string;
  tid?: string;
  eTeamType?: number;
};

export type ResponseThreadMailDetailEntry = {
  convId: number;
  convFids?: number[];
  antiVirusStatus?: string;
  backgroundColor?: number;
  threadMessageCount?: number;
  threadMessageIds?: string[];
  encpwd?: any;
  fid?: number;
  flags?: {
    read?: boolean;
    replied?: boolean;
    suspiciousSpam?: boolean | undefined;
  };
  from: string | string[];
  id: string;
  label0?: number;
  modifiedDate?: string;
  priority: number;
  receivedDate?: string;
  recallable?: boolean;
  sentDate?: string;
  size?: number;
  subject: string;
  summary: string;
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  memo?: string;
  tag?: string[];
  attachments?: ResponseAttachment[];
  taskId: number;
  tid?: string;
  sentMailId?: string;
  langType?: string;
  langListMap?: Record<string, any>;
  eTeamType?: number;
};

export type ListEntryResponse = ResponseData<ResponseMailListEntry[]> & {
  total: number;
  midoffset: number;
  building?: boolean; // 往来邮件构建中
};

export interface CustomerListEntryResponse {
  code: number;
  data?: {
    emailInfos: ResponseMailListEntry[];
    noPermission?: string[];
    notColleague?: string[]; // 无权限的下属email列表
    notPartner?: string[]; // 无权限的同事email列表
    over: boolean; // 是否拉完，但是此字段和企业邮的任务是否结束无关
  };
}

export interface CustomerUnreadItemResponse {
  customerId: string;
  num: number;
  initialized: boolean; // 是否完成初始化
  contacts: ContactUnreadItemResponse[];
}

export interface ContactUnreadItemResponse {
  contactId: string;
  email: string;
  num: number;
  initialized: boolean; // 是否完成初始化
}

// https://lingxi.office.163.com/doc/#id=19000003349574&from=PERSONAL&parentResourceId=19000001355861&spaceId=505505527&ref=534674905&type=doc
export interface CustomerListUnreadResponse {
  code: number;
  data?: {
    num: number;
    initialized: boolean; // 是否完成初始化
    customers?: CustomerUnreadItemResponse[];
  };
}

export interface CustomerListUnreadTotalResponse {
  code: number;
  data?: {
    num: number;
    initialized: boolean; // 是否完成初始化
  };
}

// https://lingxi.office.163.com/doc/#id=19000003349574&from=PERSONAL&parentResourceId=19000001355861&spaceId=505505527&ref=534674905&type=doc
export interface CheckTpMailResponse {
  code: number;
  data?: {
    emailInfos: ResponseMailListEntry[];
  };
}

export interface TpMailContentResponse {
  code: number;
  data?: ResponseMailContentEntry;
}

export type ThreadListEntryResponse = ResponseData<ResponseThreadMailListEntry[]> & {
  total: number;
  building: boolean; // 会话是否在构建中
};

export type ThreadDetailEntryResponse = ResponseData<ResponseThreadMailDetailEntry[]> & {
  total: number;
};

export type ContactProcessingItem = {
  origin: string[];
  parsed: ParsedContact[];
  result?: MailBoxEntryContactInfoModel[];
  type?: MemberType;
};

export type MailEntryProcessingInfo = {
  // ------------additional info using in process----------------//
  // id: string,
  senderContactMap: ContactProcessingItem;
  sender: MailBoxEntryContactInfoModel[];
  receiverContactMap: ContactProcessingItem;
  receiver: MailBoxEntryContactInfoModel[];
  isTpMail?: boolean;
  owner?: string; // 第三方邮件所属人
};

export type MailEntryProcessingItem = ResponseMailListEntry & ResponseMailContentEntry & MailEntryProcessingInfo;

export type ResponseAttachment = {
  filename: string;
  contentId?: string;
  estimateSize?: number;
  contentLength: number;
  isMsg?: boolean;
  id: number;
  contentLocation?: any;
  encoding?: string;
  contentType?: string;
  inlined: boolean;
  content?: any;
  width?: number;
  height?: number;
  _account?: string;
};
export type RequestComposeMailAttachment = {
  id?: number;
  type?: MailFileAttachmentType;
  name?: string;
  displayName?: string;
  size?: number;
  inlined?: boolean;
  mixed?: boolean;
  description?: string;
  deleted?: boolean;
  mode?: string;
  fromServer?: boolean;
  _part?: number;
  _mid?: string;
};

// 发信请求体
export type RequestComposeMailAttrs = {
  id?: string;
  account?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  'reply-to'?: string[];
  subject: string;
  content?: string;
  isHtml?: boolean;
  priority?: number;
  saveSentCopy?: boolean;
  attachments?: RequestComposeMailAttachment[];
  showOneRcpt?: boolean;
  charset?: string;
  scheduleDate?: string | undefined; // 定时发信时间, 用于定时发信操作
  clientTimeZone?: string; // 定时发送时区
  xMailerExt?: string;
};

// todo 更新状态码
export interface IMailRecpErrMap {
  FA_MTA_MULTI_ERROR: string;
  FA_MTA_RCPT_ERROR: string;
  FA_MTA_USER_BLACK_LIST: string;
}

// todo 更新状态码
export const MailRecpErrMap: IMailRecpErrMap = {
  FA_MTA_MULTI_ERROR: '该邮箱将您设为黑名单',
  FA_MTA_RCPT_ERROR: '该邮箱不存在',
  FA_MTA_USER_BLACK_LIST: '该邮箱将您设为黑名单',
};

export type AttachmentFromServerModel = {
  id: number;
  name: string;
  deleted: boolean;
  size: number;
  type?: string;
  _mid?: string;
  _part?: string;
};
export type ResponseVarModel = {
  attachments: AttachmentFromServerModel[];
  account: string;
  content?: string;
  priority?: number;
  subject: string;
};

export type ResponseComposeMail = {
  success?: boolean;
  message?: string;
  code?: string | number;
  suc?: boolean;
  var: string | ResponseVarModel;
  msgCode?: string;
  msgCodeDesc?: string;
  msg?: string;
  draftId?: string;
  savedSent?: {
    imapID: number;
    mid: string;
    imapFolder: string;
  };
  sentTInfo?: string;
  errorRcpts?:
    | {
        [k in keyof IMailRecpErrMap]: string[];
      }
    | string;
  mtaCode: number;
  data?: {
    errorRcpts: {
      [k in string]: string;
    };
  };
  /**
   * "code": "FA_OVERFLOW" 的补充code
   */
  overflowReason?: string;
};

export type RequestComposeMail = {
  id?: string;
  attrs: RequestComposeMailAttrs;
  action: MailSendOperation;
  returnInfo?: boolean;
  delayTime?: number;
  mailTrace?: boolean;
  noticeSenderReceivers?: string[];
  flagLinkAttached?: boolean; // 发信是否包含云附件
  encryptPassword?: string;
  savePassword?: boolean;
  xMailerExt?: string;
  _subAccount?: string;
};

export type RequestComposePraiseMail = {
  compose: RequestComposeMail;
  praiseLetter: any;
  id?: string;
  flagLinkAttached?: boolean; // 发信是否包含云附件
  _subAccount?: string;
};

export type RequestComposeTaskMail = {
  compose: RequestComposeMail;
  task: TaskMail;
  from: string;
  flagLinkAttached?: boolean; // 发信是否包含云附件
  _subAccount?: string;
};

export type ResponseMailUploadCloud = {
  exist: boolean;
  existlen: number;
  dupname: boolean;
  fileName: string;
  fid: number;
  url: string;
  preview: false;
  expireTime: number;
  oid: number;
  nud: boolean;
  downloadUrl: string;
  fileSize: number;
  fileType: string;
  identity: number;
};
/**
 *     mailDownload:string = host +
 * config("?sid=W0bAEA*Aa988c60CPXM-VqZOwZQSQ3GB&mid=AAcA8AAJDlRJRwzkH5Q4Bars&part=3&mode=download&l=read&action=download_attach")
 */

export type RequestDownloadAttachment = {
  sid?: string;
  mid: string;
  part: number;
  mode: 'download' | 'inline';
  l: 'read';
  action: 'download_attach';
  uid?: string;
};

export type RequestExportMailAsEml = {
  sid: string;
  mid: string;
  mode: 'download';
  l: 'read';
  action: 'download_eml';
  _token?: string;
};

export type RequestExportGroupMailAsZip = {
  sid: string;
  func: 'mbox:packMessages';
  _token?: string;
};

export type EntSignature = {
  apply: intBool;
  content: string;
  position: intBool;
};

export type ResponseRelatedMail = {
  timestamp: string;
  offset: number;
  emailInfoList: ResponseMailListEntry[];
};

export type SpamType = 'spam' | 'notspam';

export type RequestModifyMail = {
  ids: string[];
  attrs: {
    /**
     * 要移动邮件到某文件夹的ID
     */
    fid?: number;
    backgroundColor?: number;
    /**
     * 修改扩展分类,红旗邮件=1 ，非红旗邮件=0
     */
    label0?: number;
    priority?: number;
    antiVirusStatus?: string;
    flags?: MailFlags;
    memo?: string;
    defer?: string;
    deferNotice?: boolean;
    preferred?: number; // 修改是否优先，0 优先，-1取消优先
  };
  /**
   'spam'    - 这是垃圾邮件
   'notspam' - 这不是垃圾邮件
   */
  reportType?: SpamType;
  spamType?: string;
  isThread?: boolean;
  needFilter?: boolean;
  _account?: string;
};

// class MailEntryMap{
//
// }

export type ResponseSearchEntry = ResponseMailListEntry | string;

export interface ResponseGpItem {
  val: number | boolean | string;
  cnt: number;
  threadCount?: number;
  nickName?: string; // 邮箱昵称
  contactLabel?: string; // 邮箱昵称拼音首字母
}

export type ResponseGroupResult = Partial<Record<ResponseGpKey, ResponseGpItem[]>>;

export type ResponseFolderStat = {
  messageCount: number;
  unreadThreadCount: number;
  unreadMessageSize: number;
  unreadMessageCount: number;
  threadCount: number;
  messageSize: number;
};

export interface ResponseSearch {
  code: string;
  var: ResponseSearchEntry[];
  keywords: string[];
  groupings: ResponseGroupResult;
}

export class MethodMap {
  listFolder = 'mbox:getAllFolders'; // 获取文件夹

  createUserFolder = 'mbox:createUserFolders'; // 添加用户文件夹

  updateUserFolder = 'mbox:updateFolders'; // 修改文件夹属性

  deleteUserFolder = 'mbox:deleteFolders'; // 删除文件夹

  updateMessageInfos = 'mbox:updateMessageInfos'; // 添加/编辑 邮件备注

  updateFolderPosition = 'mbox:setFolderPosition'; // 调整文件夹顺序

  listItem = 'mbox:listMessages'; // 获取邮件列表

  listContent = 'mbox:readMessage'; // 获取邮件详情

  decryptedContent = 'mbox:decryptMessage'; // 获取加密邮件解密后的详情

  sendMDN = 'mbox:sendMDN'; // 发送回执

  postMail = 'mbox:compose'; // 发信

  cancelDeliver = 'mbox:cancelDeliver'; // 取消发信

  immediateDeliver = 'mbox:immediateDeliver'; // 立即发信

  checkPostMail = 'user:listDeliveryHistory'; // 查询发送状态

  updateMail = 'mbox:updateMessageInfos'; // 设置邮件属性，红旗，已读未读，文件夹

  deleteMail = 'mbox:deleteMessages'; // 删除邮件

  searchMail = 'mbox:searchMessages'; // 搜索邮件

  searchMailInfo = 'mbox:getMessageSummaryInfos'; // 获取搜索邮件命中详情

  getMailPart = 'mbox:getMessageData'; // 获取邮件中嵌套部分数据，用于展示，图片附件预览也是用此接口，预览

  getDecryptedMailPart = 'mbox:decryptMessagePart'; // 获获取邮件中嵌套部分数据，用于展示，图片附件预览也是用此接口，预览

  replyMail = 'mbox:replyMessage'; // 回复邮件

  forwardMail = 'mbox:forwardMessages'; // 转发邮件

  uploadPrepare = 'upload:prepare'; // 上传预备

  upload = 'upload:directData'; // 上传文件

  uploadLegacy = 'mbox:uploadAttach'; // 传统上传附件方法

  loadTemp = 'mbox:getComposeInfo'; // 获取临时文件

  downloadTmpAttachment = 'mbox:getComposeData'; // 下载上传附件

  cancelCompose = 'mbox:cancelComposes'; // 取消写信，删除草稿

  markAllMail = 'mbox:markSeen'; // 标记所有新建为已读/未读

  markPreferred = 'mbox:markPreferred'; // 联系人优先级变更历史邮件处理

  getAttr = 'user:getAttrs'; // 获取用户属性

  setAttr = 'user:setAttrs'; // 更改用户属性

  updatePOPAccounts = 'user:updatePOPAccounts'; // 更新代发邮箱账户

  emptyFolder = 'mbox:emptyFolder'; // 清空文件夹

  editDraft = 'mbox:restoreDraft'; // 编辑草稿

  editMail = 'mbox:editMessage'; // 编辑未发送成功

  statMailCount = 'mbox:statMessages'; // 统计发件数目

  attachmentPreview = 'preview:convert'; // 附件预览 --- 废弃

  getContentByIds = 'mbox:getMessageInfos'; // 按id拉取列表

  getFolderStat = 'mbox:getFolderStats'; // 统计文件夹数据

  withdrawSending = 'mbox:recallMessage'; // 撤回发送

  threadMail = 'mbox:listThreads'; // 聚合邮件

  threadMailDetailV2 = 'ntes:mbox:getThreadMessagesInfos'; // 聚合邮件详情

  threadMailDetail = 'mbox:getThreadMessageInfos'; // 聚合邮件详情

  updateMailThread = 'ntes:mbox:updateThreadInfos'; // 批量更新聚合邮件

  getSignature = 'user:getSignatures'; // 获取用户签名

  createSignature = 'user:createSignatures'; // 创建签名

  updateSignature = 'user:updateSignatures'; // 更新签名

  deleteSignature = 'user:deleteSignatures'; // 删除签名

  getMailClassifyRule = 'user:getMailRules'; // 获取来信分类规则

  addMailClassifyRule = 'user:addMailRules'; // 添加来信分类规则

  editMailClassifyRule = 'user:updateMailRules'; // 编辑来信分类规则

  sortMailClassifyRule = 'user:adjustMailRuleOrder'; // 来信分类规则排序

  deleteMailClassifyRule = 'user:removeMailRules'; // 删除来信分类规则

  effectHistoryMail = 'mbox:updateMessageInfos'; // 来信分类规则对历史邮件生效

  aliasAccount = 'user:getAliasWithSeed'; // 获取别名账号列表

  // 获取tag列表
  getTaglist = 'mbox:listTags';

  // 标签管理
  manageTag = 'mbox:manageTags';

  // 设置邮件的标签
  updateMessageTags = 'mbox:updateMessageTags';

  threadMailList = 'mbox:listConvs'; // 查询邮件会话列表（聚合邮件列表）

  threadMailInfoDetail = 'mbox:getConvInfos'; // 查询邮件会话详情（聚合邮件详情）

  // 更新邮件会话属性（聚合邮件详情）
  updateThreadInfo = 'mbox:updateConvInfos';

  // 更新邮件会话标签（聚合邮件标签）
  updateThreadTags = 'mbox:updateConvTags';

  // 获取往来附件
  listAttachments = 'mbox:listAttachments';

  // 导入邮件
  uploadMail = 'mbox:uploadMail';

  // 联系人未读数统计查询
  contactStats = 'contact:stats';

  // js6 串行接口
  sequential = 'global:sequential';
}

export interface methodConf {
  updateStatus: boolean;
  cache: boolean;
  immutable?: boolean;
}

export type WatchMethod = Partial<Record<keyof MethodMap, methodConf>>;
export const watchConf: WatchMethod = {
  attachmentPreview: { updateStatus: false, cache: false },
  cancelCompose: { updateStatus: false, cache: false },
  checkPostMail: { updateStatus: false, cache: false },
  deleteMail: { updateStatus: true, cache: false },
  downloadTmpAttachment: { updateStatus: false, cache: false },
  editDraft: { updateStatus: false, cache: false },
  editMail: { updateStatus: false, cache: false },
  emptyFolder: { updateStatus: true, cache: false },

  getAttr: { updateStatus: false, cache: true },
  getContentByIds: { updateStatus: false, cache: true },
  getFolderStat: { updateStatus: false, cache: false },

  listContent: { updateStatus: false, cache: true, immutable: true },
  listFolder: { updateStatus: false, cache: true },
  contactStats: { updateStatus: false, cache: true },
  createUserFolder: { updateStatus: false, cache: true },
  updateUserFolder: { updateStatus: false, cache: true },
  deleteUserFolder: { updateStatus: false, cache: true },
  updateFolderPosition: { updateStatus: false, cache: true },
  listItem: { updateStatus: false, cache: true },
  getMailPart: { updateStatus: false, cache: true, immutable: true },

  loadTemp: { updateStatus: false, cache: false },
  markAllMail: { updateStatus: true, cache: false },
  postMail: { updateStatus: true, cache: false },
  cancelDeliver: { updateStatus: true, cache: false },
  immediateDeliver: { updateStatus: true, cache: false },
  replyMail: { updateStatus: false, cache: false, immutable: false },
  forwardMail: { updateStatus: false, cache: false, immutable: false },
  searchMail: { updateStatus: false, cache: true },
  searchMailInfo: { updateStatus: false, cache: true, immutable: true },
  statMailCount: { updateStatus: false, cache: false },
  updateMail: { updateStatus: true, cache: false },
  updateMailThread: { updateStatus: true, cache: false },
  upload: { updateStatus: false, cache: false },
  uploadLegacy: { updateStatus: false, cache: false },
  uploadPrepare: { updateStatus: false, cache: false },

  withdrawSending: { updateStatus: false, cache: false },

  getSignature: { updateStatus: false, cache: true },
  createSignature: { updateStatus: false, cache: false },
  updateSignature: { updateStatus: false, cache: false },
  deleteSignature: { updateStatus: false, cache: false },

  threadMailDetailV2: { updateStatus: false, cache: true },
  threadMailDetail: { updateStatus: false, cache: true },
  threadMail: { updateStatus: false, cache: true },

  aliasAccount: { updateStatus: false, cache: true },
  getTaglist: { updateStatus: false, cache: true },
  manageTag: { updateStatus: false, cache: true },
  updateMessageTags: { updateStatus: true, cache: false },
  listAttachments: { updateStatus: false, cache: true },
};

export interface methodStatusConf {
  currentCachePolicy?: CachePolicy;
  refreshedKeys?: Set<string>;
  latestReq?: StringTypedMap<ApiRequestConfig>;
}

export type MethodStatus = Partial<Record<keyof MethodMap, methodStatusConf>>;

export type ResponseMailSearchSummaryInfoItem = {
  summary: string;
  mid: string;
  id?: string;
};

export type MailBoxConf = {
  id: number;
  sort: number;
  /**
   * 是否折叠, 0 折叠， 1 显示
   */
  fold: number;
  hide?: boolean;
  name?: string;
  getUnreadNumber?: (item: MailBoxModel) => {
    currentUnread: number;
    unread: number;
    threadUnread: number;
    currentThreadUnread: number;
  };
};

export class MailEntryContactMap {
  data: {
    [k: string]: ContactModel;
  };

  total: number;

  constructor() {
    this.total = 0;
    this.data = {};
  }
}

export interface ResponsePieceUploadMailAttachment extends ResponseData<ResponseMailUploadCloud> {
  offset: number;
  context: string;
  ext: {
    offset: number;
    length: number;
  };
}

export const mailBoxOfAllRes: MailBoxConf = {
  id: -33,
  sort: -1,
  fold: 1,
  name: getIn18Text('QUANBUJIEGUO'),
};

export const mailBoxOfDefault: MailBoxConf = {
  id: 1,
  sort: 0,
  fold: 1,
};

export const mailBoxOfSent: MailBoxConf = {
  id: 3,
  sort: 10,
  fold: 1,
  name: getIn18Text('FAJIANXIANG'),
};

// 红旗邮件
export const mailBoxOfRdFlag: MailBoxConf = {
  id: -1,
  sort: 20,
  fold: 1,
  name: getIn18Text('HONGQIYOUJIAN'),
};

// 未读邮件
export const mailBoxOfUnread: MailBoxConf = {
  id: -4,
  sort: 1,
  fold: 1,
  name: getIn18Text('WEIDUYOUJIAN'),
};

// 任务邮件
export const mailBoxOfTask: MailBoxConf = {
  id: -9,
  sort: 30,
  fold: 1,
  name: getIn18Text('RENWUYOUJIAN'),
};

// 待办邮件
export const mailBoxOfDefer: MailBoxConf = {
  id: -3,
  sort: 35,
  fold: 1,
  name: getIn18Text('SHAOHOUCHULI'),
};

// 星标联系人
export const mailBoxOfStar: MailBoxConf = {
  id: -5,
  sort: 3,
  fold: 1,
  name: getIn18Text('XINGBIAOLIANXIREN'),
};

export const mailBoxOfDraft: MailBoxConf = {
  id: 2,
  sort: 40,
  fold: 1,
};

export const mailBoxOfWaitingIssue: MailBoxConf = {
  id: 17,
  sort: 50,
  fold: 1,
  name: getIn18Text('WEISHENHE'),
};

export const mailBoxOfReadyIssue: MailBoxConf = {
  id: 19,
  sort: 60,
  fold: 1,
  name: getIn18Text('YISHENHE'),
};

export const mailBoxOfSpam: MailBoxConf = {
  id: 5,
  sort: 80,
  fold: 1,
  hide: false,
};

export const mailBoxOfAd: MailBoxConf = {
  id: 7,
  sort: 70,
  fold: 1,
  name: getIn18Text('GUANGGAOYOUJIAN'),
};

export const mailBoxOfVirus: MailBoxConf = {
  id: 6,
  sort: 90,
  fold: 1,
  hide: true,
};

export const mailBoxOfDeleted: MailBoxConf = {
  id: 4,
  sort: 100,
  fold: 1,
};

export const mailBoxOfOthers: MailBoxConf = {
  id: -2,
  sort: 99999,
  fold: 1,
  name: getIn18Text('ZIDINGYIWENJIAN11'),
};

export const mailBoxOfFakeThread = {
  id: -100001,
};

// 星标联系人往来邮件需要过滤掉的文件夹
export const mailBoxOfFilterStar = {
  [mailBoxOfSpam.id]: true,
  [mailBoxOfDraft.id]: true,
  [mailBoxOfDeleted.id]: true,
};

export interface MailModelDbEntry extends MailEntryModel {
  /**
   * {
            name: 'id',
            name: 'folder',
            name: 'deleted',
            name: 'readStatus',
            name: 'markStatus',
            name: 'titleMd5',
            name: 'tags',
            name: 'sdTime',
            name: 'rcTime',
   */
  folder: number;
  deleted: boolean;
  readStatus: number;
  markStatus: number;
  titleMd5: string;
  sdTime: number;
  rcTime: number;
  senderEmail?: string;
  receiverEmail?: string[];
}

// TODO action 加注解
export class ActionStore {
  // 是否启用db存储（全局）搜索时禁用？
  static dbEnable = true;

  static readonly dbEnableKey = 'mailDbEnable';

  static keyMailSyncTime = '-mailSyncTimestamp-';

  static keyCustomerUnreadSyncTime = '-customerUnreadSyncTimestamp-';

  static keyMailContentSyncTime = '-mailContentSyncTimestamp-';

  static minUpdateSpan = 5 * 24 * 3600 * 1000;

  static maxUpdateSpan = 60 * 24 * 3600 * 1000;

  // contactCache: MailEntryContactMap;
  // mailBoxCache?: MailBoxModel[];
  // 服务端返回文件夹原生结构
  mailBoxOriginData?: ResponseFolderDef[];
  // 邮件文件夹
  mailBoxDic?: NumberTypedMap<EntityMailBox>;

  lastMailBoxUpdateTime: StringTypedMap<number>;
  // 写信时cache
  mailEntryCache: StringTypedMap<MailEntryModel>;

  lastUserAttrUpdateTime: number;

  lastSignatureUpdateTime: number;

  writingMailIds: Set<string>;

  // defaultSignature: ResponseSignature;
  searchResCache: NumberTypedMap<StringTypedMap<MailBoxModel[]>>;

  searchMidsCache: NumberTypedMap<StringTypedMap<string[]>>;

  searchStatCache: NumberTypedMap<StringTypedMap<MailStatResult>>;

  // 搜索工具方法
  searchSeq: SequenceHelper;

  searchWord: StringTypedMap<number>;

  paramDispatched: Set<number>;

  paramReceivedSucc: Set<number>;

  mailParamMap: NumberTypedMap<any>;

  writeMailPageDataReceived?: boolean;

  writeMailPageWebId?: number;

  indexPageWebId?: number;

  needSendWriteMail: boolean;

  writeEventData?: SystemEvent;

  mailBoxConfs: NumberTypedMap<MailBoxConf>;

  methodStatus: MethodStatus;

  updateMethodTriggered: boolean;

  threadMailIdMap: StringTypedMap<string[]>;

  // mailsCache:StringTypedMap<MailEntryModel>;

  // mailsCache: ArrayMap<MailEntryModel>;

  commonAttachmentUploadApiLock?: StoredLock;

  // 附件上传锁
  attachmentLock: StoredLock[] = [];

  curMailListReqSeq: number;

  curRealListReqSeq: number;

  curMailContentReqSeq: number;

  curMailSearchReqSeq: number;

  curMailSequenceGen: SequenceHelper;

  lastSaveTmpTimestamp: number;

  praiseMedals: MedalInfo[];

  taskMailMap: TaskInternalMap | null;

  decryptedMailsCache: DecryptedMailsCacheMap = new Map();

  constructor() {
    // this.contactCache = new MailEntryContactMap();
    this.curMailSequenceGen = new SequenceHelper();
    this.curMailListReqSeq = this.curMailSequenceGen.next();
    this.curMailContentReqSeq = this.curMailSequenceGen.next();
    this.curMailSearchReqSeq = this.curMailSequenceGen.next();
    this.curRealListReqSeq = this.curMailSequenceGen.next();
    this.searchResCache = {};
    this.searchWord = {};
    this.searchMidsCache = {};
    this.searchStatCache = {};
    this.mailEntryCache = {};
    this.mailBoxDic = {};
    this.praiseMedals = [];
    // this.mailBoxCache = [];
    this.lastMailBoxUpdateTime = {};
    this.lastUserAttrUpdateTime = -1;
    this.lastSignatureUpdateTime = -1;
    this.writingMailIds = new Set<string>();
    this.paramDispatched = new Set<number>();
    this.paramReceivedSucc = new Set<number>();
    this.mailParamMap = {};
    this.threadMailIdMap = {};
    this.lastSaveTmpTimestamp = 0;
    this.mailBoxConfs = ((param: MailBoxConf[]) => {
      const ret: NumberTypedMap<MailBoxConf> = {};
      // eslint-disable-next-line no-restricted-syntax
      for (const item of param) {
        ret[item.id] = item;
        if (item === mailBoxOfDraft) {
          item.getUnreadNumber = (mbIt: MailBoxModel) => ({
            currentUnread: mbIt.entry.mailBoxTotal,
            unread: mbIt.entry.mailBoxTotal,
            threadUnread: mbIt.entry.mailBoxTotal,
            currentThreadUnread: mbIt.entry.mailBoxTotal,
          });
        } else if (item === mailBoxOfSpam || item === mailBoxOfDeleted) {
          item.getUnreadNumber = () => ({
            currentUnread: 0,
            unread: 0,
            threadUnread: 0,
            currentThreadUnread: 0,
          });
        } else if (item === mailBoxOfSent) {
          const number = this.checkAllFailToSendMails();
          item.getUnreadNumber = () => ({
            currentUnread: number,
            unread: number,
            threadUnread: number,
            currentThreadUnread: number,
          });
        } else if (item === mailBoxOfDefer) {
          item.getUnreadNumber = (mbIt: MailBoxModel) => {
            const { deferCount = 0 } = mbIt.entry;
            return {
              currentUnread: deferCount,
              unread: deferCount,
              threadUnread: deferCount,
              currentThreadUnread: deferCount,
            };
          };
        } else if (item === mailBoxOfStar) {
          // TODO：本期未读数不做
          item.getUnreadNumber = () => ({
            currentUnread: 0,
            unread: 0,
            threadUnread: 0,
            currentThreadUnread: 0,
          });
        }
      }
      for (let i = 8; i < 50; ++i) {
        if (!ret[i] || !ret[i].id) {
          ret[i] = {
            id: i,
            sort: 2 + i,
            fold: 1,
          };
        }
      }
      return ret;
    })([
      mailBoxOfAllRes,
      mailBoxOfDefault,
      mailBoxOfSent,
      mailBoxOfRdFlag,
      mailBoxOfUnread,
      mailBoxOfTask,
      mailBoxOfDeleted,
      mailBoxOfDraft,
      mailBoxOfOthers,
      mailBoxOfSpam,
      mailBoxOfAd,
      mailBoxOfVirus,
      mailBoxOfReadyIssue,
      mailBoxOfWaitingIssue,
      mailBoxOfDefer,
      mailBoxOfStar,
    ]);
    // this.defaultSignature = {
    //     content: '',
    //     id: 0,
    //     isDefault: false,
    //     isHtml: false,
    //     name: '',
    //     enable: true,
    // };
    this.searchSeq = new SequenceHelper(1, 1000000);
    this.needSendWriteMail = false;
    this.updateMethodTriggered = false;
    this.methodStatus = {
      // attachmentPreview: {},
      // cancelCompose: {},
      // checkPostMail: {},
      // createSignature: {},
      // deleteMail: {},
      // deleteSignature: {},
      // downloadTmpAttachment: {},
      // editDraft: {},
      // editMail: {},
      // emptyFolder: {},
      // forwardMail: {},
      // getAttr: {},
      // getContentByIds: {},
      // getFolderStat: {},
      // getMailPart: {},
      // getSignature: {},
      // listContent: {},
      // listFolder: {},
      // listItem: {},
      // loadTemp: {},
      // markAllMail: {},
      // postMail: {},
      // replyMail: {},
      // searchMail: {},
      // searchMailInfo: {},
      // statMailCount: {},
      // threadMail: {},
      // threadMailDetail: {},
      // threadMailDetailV2: {},
      // updateMail: {},
      // updateMailThread: {},
      // updateSignature: {},
      // upload: {},
      // uploadLegacy: {},
      // uploadPrepare: {},
      // withdrawSending: {},
      // aliasAccount: {},
      // getTaglist: {},
      // manageTag: {},
      // updateMessageTags: {},
      // listAttachments: {},
    };
    // this.mailsCache = new ArrayMap<MailEntryModel>(
    //   (item: Partial<MailEntryModel>) => item.id,
    // );
    this.attachmentLock = [];
    this.taskMailMap = null;
  }

  searchContentOfEntry(content: MailEntryModel, search: string) {
    if (content.entry.title && content.entry.title.indexOf(search) >= 0) {
      return true;
    }
    if (content.entry.content && content.entry.content.content && content.entry.content.content.indexOf(search) >= 0) {
      return true;
    }
    if (content.entry.attachment && content.entry.attachment.length >= 0) {
      const attachModels = content.entry.attachment;
      // for (const it of attachModels) {
      //   if (it.fileName.indexOf(search) >= 0) {
      //     return true;
      //   }
      // }
      const found = attachModels.find(it => it.fileName.indexOf(search) >= 0);
      return found !== undefined;
    }
    if (content.sender && (content.sender.contactItem?.contactItemVal?.indexOf(search) >= 0 || content.sender.contact?.contact.contactName?.indexOf(search) >= 0)) {
      return true;
    }
    if (content.receiver && content.receiver.length > 0) {
      /* for (const it of content.receiver) */
      // const hit = false;
      const found = content.receiver.find(it => it.contactItem?.contactItemVal?.indexOf(search) >= 0 || it.contact?.contact.contactName?.indexOf(search) >= 0);
      return found !== undefined;
    }
    return false;
  }

  private checkAllFailToSendMails() {
    const { mailEntryCache } = this;
    let num = 0;
    Object.keys(mailEntryCache).forEach((i: string) => {
      const cacheElement = mailEntryCache[Number(i)];
      if (cacheElement && cacheElement.entry.sendStatus && cacheElement.cid && cacheElement.id) {
        num += 1;
      }
    });
    // }
    return num;
  }
}

export const methodMap = new MethodMap();

export interface EntityMailData extends resultObject {
  mid: string;
  title: string;
  titleMd5: string;
  attachmentCount: number;
  sdTime: number;
  rcTime: number;
  brief?: string;
  contactData: ParsedContact[];
  fromEmail: string;
  fromName: string;
  toContactName: string[];
  sendersEmail?: string[];
  sendersName?: string[];
  // ccContactName? :string[];
  // bccContactName? :string[];
  toEmail: string[];
  // ccEmail?: string[];
  // bccEmail?: string[];
  allInfo?: number;
  createTime: number;
  isIcs?: number;
  requestReadReceipt?: boolean;
  traceId?: string;
  suspiciousSpam?: boolean;
  changeAble?: boolean;
  isThread?: number;
  isScheduleSend?: boolean;
  scheduleDateTimeZone?: number;
  tid?: string;
  taskId?: number;
  sentMailId?: string;
  langType?: string;
  langListMap?: Record<string, any>;
  linkAttached?: boolean;
  size?: number;
  mailIllegal?: string;
}

export interface EntityMailContent extends resultObject {
  isThread?: number;
  threadItemsId?: string[];
  mid: string;
  title: string;
  titleMd5: string;
  contactData: ParsedContact[];
  fromEmail: string;
  fromName: string;
  toContactName: string[];
  ccContactName?: string[];
  bccContactName?: string[];
  toEmail: string[];
  ccEmail?: string[];
  bccEmail?: string[];
  sendersEmail?: string[];
  sendersName?: string[];
  brief: string;
  content: string;
  isHtml?: boolean;
  contentMd5: string;
  createTime: number;
  contentId: string;
  keywords?: string[];
  sentMailId?: string;
  langType?: string;
  langListMap?: Record<string, any>;
  antispamInfo?: {
    RulesType?: string;
    asIgnoreReason?: string;
    asMailType?: string;
  };
  encoding?: MailEncodings;
}

export interface EntityMailStatus extends resultObject {
  isThread: number;
  mid: string;
  threadId?: string; // 所属的聚合邮件的ID
  convFids?: number[];
  threadMessageFirstId?: string;
  threadMessageIds?: string[];
  threadMessageCount?: number;
  title: string;
  titleMd5: string;
  rank: number;
  folder: number;
  tags?: string[];
  redFlag: number;
  readStatus: number;
  sdTime: number;
  rcTime: number;
  replyStatus: number;
  forwardStatus: number;
  rclStatus?: number;
  sndStatus?: number;
  updateTime: number;
  memo?: string;
  canRecall?: number;
  brief?: string;
  attachmentsZipPath?: string; // 邮件附件“全部保存”生成的压缩包目录
  rcptCount?: number; // 收件人总数
  readCount?: number; // 已读数
  innerCount?: number; // 内域收件人总数
  innerRead?: number; // 内域已读数量
  isOneRcpt?: boolean; // 是否群发单显
  preferred?: number; // 是否优先处理邮件
  eTeamType?: number; // 是否有讨论组
  top?: boolean;
  isDefer?: number; // 是否是待办邮件
  deferTime?: number; // 待办时间
  deferNotice?: number; // 待办提醒
  popRead: number; // 是否已被POP收取
  rcptFailed: number; // 发信失败
  rcptSucceed: number; // 发信成功
}

export interface EntityMailAttr extends resultObject {
  aid: string;
  attrType: MailAttrType;
  attrValue: string;
  mid: string;
  rcTime: number;
  filterValues: {
    from?: string[];
    to?: string[];
  };
  readStatus: number; // 1已读 0未读
}

export interface CustomerUnreadEntity extends resultObject {
  id: string;
  type: string;
  unread: number;
  parent: string;
  sort: number;
  updateTime: number;
}

// export interface MailAddressQuery {
//   value: string;
//   count: number;
//   endTime?: number;
//   filterValues?: string[];
// }

export interface TpMailListQuery {
  from: string;
  toList: string[];
  count: number;
  endTime?: number;
  exchangeType?: MailAttrExchangeType;
}

export interface EntityMailAttachment extends resultObject {
  mid: string;
  title: string;
  titleMd5: string;
  attachment: MailFileAttachModel[];
  attachmentNames: string[];
  isThread?: number;
}

export type ResponseMailEntryModelWithTotal = {
  d: ResponseMailListEntry[];
  t: number;
  b?: number;
};

export type ResponseThreadMailEntryModelWithTotal = {
  d: ResponseThreadMailListEntry[];
  t: number;
  b?: number;
};

export type ResponseThreadDetailEntryModelWithTotal = {
  d: ResponseThreadMailDetailEntry[];
  t: number;
};

export type TagItem = [string, { color: number }, any];

export interface ClassifyThreadMailsResult {
  threadIds: string[];
  normalIds: string[];
  fakeThreadIds: string[];
}

export interface EntityMailOperation extends resultObject {
  oid: string;
  operationType: MailOpRecordActions;
  operationName?: string;
  createTime: number;
  updateTime: number;
  finishTime?: number;
  operationRetryTime?: number;
  operationContent: string;
  operationTitle?: string;
  delFlag: 0 | 1;
}

export type MailAttrType = 'customer' | 'star';

export const tpMailFilterName = 'tpMailFilterName';
export const mailAttrFilterName = 'mailAttrFilterName';
export const mailContentFilterName = 'mailContentFilter';
export const mailContentFolderFilterName = 'mailContentFolderFilter';
export const mailDbCommonQueryFilterName = 'mailDbCommonQueryFilter';
export const localSearchDataFilterName = 'localSearchDataFilterName';
export const mailSearchAttachmentFilterName = 'mailSearchAttachmentFilterName';
export const mailAttachmentOfContentFilterName = 'mailAttachmentOfContentFilterName';

export type SubActionsType = Map<string, ActionStore>;
