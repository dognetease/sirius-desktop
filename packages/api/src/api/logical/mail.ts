/* eslint-disable camelcase */
/**
 读信写信使用API模块定义
 写信的几个入口：
 回复、回复全部：doReplayMail
 转发 doForwardMail
 写信给指定联系人/ 无联系人 doWriteMailToContact
 */
/**
 * 使用联系人api
 */
import { ParsedMail } from 'mailparser';
import {
  Api,
  CommonBatchResult,
  ContactModel,
  Entity,
  EntityContact,
  EntityContactItem,
  intBool,
  PopUpMessageInfo,
  Properties,
  resultObject,
  SimpleContactModel,
} from '../_base/api';

import { TaskMailModel } from '@/api/logical/taskmail';

import { CloudUploaderCommonArgs, FileAttachModel, FsSaveRes, LoaderResult, UploadPieceHandler } from '../system/fileLoader';
import { LoaderActionConf } from '../data/http';
import { StringMap, StringTypedMap } from '../commonModel';
// import { ContactItem } from '../../../../web-common/src/components/util/contact';
// import {
//   EntityMailStatus,
//   RequestMailTagRequest,
//   ResponseMailUploadCloudToken,
//   SearchCacheInfo,
//   TaskInternalMap,
// } from '@/impl/logical/mail/mail_action_store_model';
import { MedalInfo } from '@/api/logical/mail_praise';
import { EmailListPriority, StrangerModel } from './mail_stranger';
import { MailItemRes } from '@/api/logical/im_discuss';
import { SystemEvent } from '@/api/data/event';
import { AccountMailInfo, MailAliasAccountModel } from '@/api/logical/account';
import { CustomerEntityForMail, CustomerOrgType } from '@/api/logical/contact_edm';
import { DbRefer } from '@/api/data/new_db';
import { SignDetail } from '@/api/logical/mail_signature';
import {
  MailAttrType,
  ContactProcessingItem,
  MethodMap,
  ResponseAttachment,
  ReqMailReadCount,
  ReqMailReadDetail,
  ActionStore,
  SubActionsType,
  ResponseMailUploadCloud,
  ResponseMailContentEntry as ResponseMailContentEntryOri,
} from '@/impl/logical/mail/mail_action_store_model';
import type { IPushConfigSetRequest, IPushConfigGetRes, IPushConfigSetRes } from '@/api/logical/push';
import { ResponseData } from '@/api/data/http';
import { accountType, AccountTypes, IMailClientConfig } from './login';
// import { SystemEvent } from '@/api/data/event';
// import {ModelHelper} from "../commonModel";
// import { ResponseData } from '../data/http';

// FIXME:下面这种方式webpack会报错,原因是？
// export { ResponseMailContentEntry } from '@/impl/logical/mail/mail_action_store_model';
export type ResponseMailContentEntry = ResponseMailContentEntryOri;
export class MailSettingKeysClass {
  // 文件夹设置
  public readonly nFolderSetting = 'ntes_defined';

  // 回复转发头设置
  public readonly nReplay = 'replyf';

  public readonly nForward = 'ntes_option';

  // public readonly nAutoSaveAccount = 'aftersend_saveaddr';
  // 聚合邮件，本地存储
  public readonly nShowMergedMail = 'mail_showMerged';

  // 自动保存联系人
  public readonly nAutoAddMailContact = 'aftersend_saveaddr';

  // 展示发信者昵称或姓名
  public readonly nDefaultSendingAccount = 'ntes_defaultsender';

  public readonly nRefuseList = 'refuselist';

  public readonly nSaveList = 'safelist';

  public readonly nOriginalAccount = 'original_account';

  // 勋章信息
  public readonly nPraiseMedals = 'praise_medals';

  // 智能收件箱
  // public readonly nIntelligentInbox = 'intelligent_inbox';

  // 智能收件箱默认展示列表
  // public readonly nIntBoxDisplayList = 'intbox_display_list';

  // 通栏布局
  public readonly nBannerLayout = 'banner_layout';

  // 邮件显示摘要
  public readonly nShowDesc = 'show_desc';

  // 邮件显示附件
  public readonly nShowAttachment = 'show_attachment';

  // 邮件显示头像
  public readonly nShowAvator = 'show_avator';

  // 写信具体时间
  public readonly nShowConcreteTime = 'show_concrete_time';

  // 邮件显示头像
  public readonly nMailListTightness = 'mail_list_tightness';

  // 邮件显示头像
  public readonly nMailListShowCustomerTab = 'mail_list_show_customer_tab';

  public readonly nSenderName = 'true_name';

  // 邮件撤回开关
  public readonly nPermRecallMail = 'perm_recall_mail';

  // 版本id
  public readonly nCosId = 'cos_id';

  // 用户配置的时区
  public readonly nTimezone = 'time_zone';

  // 是否使用本地时区
  public readonly nLocalTimezone = 'local_time_zone';

  // 是否使用实体列表
  public readonly nIsUseReaList = 'isUseMailRealList';

  public readonly nMailRealListPageSize = 'mailRealListPageSize';

  // 发信查看阅读状态，天数限制
  public readonly nNormalDayLimit = 'normalDayLimit';
  // 三方发信查看打开记录，天数限制
  public readonly nThirdDayLimit = 'thirdDayLimit';
}

export const MailSettingKeys = new MailSettingKeysClass();

// 本地附件最大限制
export const upload_size_local: number = 100 * 1024 * 1024;
// 本地附件总大小限制
export const upload_total_size_local: number = 100 * 1024 * 1024;
// 邮件总大小限制
export const smtp_max_send_mail_size_local: number = 100 * 1024 * 1024;

// 免费版
export const free_upload_size_local: number = 100 * 1024 * 1024;
export const free_upload_total_size_local: number = 100 * 1024 * 1024;
export const free_smtp_max_send_mail_size_local: number = 100 * 1024 * 1024;

/**
 * 用户属性字符串
 */
export type userAttr = // MailSettingKeysClass;

    | 'ntes_defined' // 文件夹设置
    | 'replyf' // 回复转发头设置
    | 'ntes_option' //
    | 'displaysender' // 展示发信者昵称或姓名
    | 'ntes_defaultsender' // 默认发信人
    | 'aftersend_saveaddr' // 自动保存联系人
    | 'refuselist' // 黑名单
    | 'safelist' // 白名单;
    | 'intelligent_inbox' // 智能收件箱;
    | 'system_sender_list' // 系统发件人
    | 'original_account' // 原登录账号
    | 'true_name' // 发件人昵称
    | 'forwarddes' // 自动转发
    | 'perm_recall_mail' // 邮件撤回开关
    | 'time_zone' // 时区
    | 'local_time_zone'
    | 'cos_id' // 版本id
    | 'pref_smtp_max_num_rcpts' // 收件人数量限制/单封
    | 'pref_smtp_max_send_mail_size' // 邮件大小限制/单封
    | 'pref_upload_size' // 本地附件最大限制
    | 'upload_size' // 本地附件最大限制 四舍五入取小
    | 'smtp_max_send_mail_size'; // 邮件大小限制/单封 四舍五入取小

/**
 [标记名]            [IMAP]
 read                Seen        已读
 Recent      未读 (没有read标记)
 scheduleDelivery                标记为定时发送的信
 attached                        有附件
 inlineAttached                  有内嵌附件
 linkAttached                    有 URL 附件（超大附件，中转站附件）
 signed                          有数字签名
 encrypted                       已加密
 replied             Answered    已被回复
 - squotaWarning                 deprecated 容量超过Soft Quota的警告信
 - hquotaWarning                 deprecated 容量超过Hard Quota的警告信
 forwarded                       已被转发
 draft               Draft       草稿
 voice                           语音邮件
 fax                             Fax邮件
 flagged             Flagged     标记 (星标)
 deleted             Deleted     标记为删除 (以后可通过purge指令真正删除)
 system                          系统邮件
 top                             置顶邮件
 vip                             重要邮件   (CM-15567)
 autodel                         邮件自销毁 (CM-6355)
 rcptQueued                      信件投递状态跟踪 - 进入队列
 rcptFailed                      信件投递状态跟踪 - 失败
 rcptSucceed                     信件投递状态跟踪 - 成功
 rcptRead                        信件投递状态跟踪 - 对方已读
 deferHandle                     信件延迟处理标志位 (CM-15574)
 locked                          加锁信件 (CM-15006) - 只读标志位
 */
export type MailFlags = {
  read?: boolean;
  inlineAttached?: boolean;
  attached?: boolean;
  system?: boolean;
  forwarded?: boolean;
  replied?: boolean;
  linkAttached?: boolean;
  draft?: boolean;
  top?: boolean;
  deleted?: boolean;
  scheduleDelivery?: boolean;
  deferHandle?: boolean;
  customerMail?: boolean; // 是否是我的客户，仅外贸通下使用
  [k: string]: boolean | undefined;
};
export type UpdateMailCountTaskType = 'time' | 'push' | 'default' | 'resume';
export type MailOrderedField =
  | 'date' // 按日期(发送日期)
  | 'receivedDate' // 按接收日期
  | 'modifiedDate' // 按最后修改时间(CM-13897)
  | 'deferredDate' // 按延迟处理时间(CMNE-374)
  | 'from' // 按发件人
  | 'to' // 按收件人
  | 'size' // 按大小
  | 'subject' // 按主题
  | 'status'; //  按状态
export type MailSendOperation =
  | 'continue' //    仅更新数据 (继续编辑)
  | 'autosave' //    自动保存
  | 'save' //    存原稿并继续编辑
  | 'save_auto' //    自动存原稿并继续编辑
  | 'schedule' //    定时投递
  | 'deliver'; //    立即投递
export type MailFolderType = 'sys' | 'customer';
export type MailSendStatus = 'sending' | 'sent' | 'sentFailed' | 'sentNetworkFailed' | 'saved';
export type MarkStatus = 'none' | 'redFlag';
export type MailReadType = 'read' | 'unread';
export type MailStatusType = 'ALL' | 'SENT' | 'RECEIVED' | 'redFLag' | 'ATTACHMENT';
/**
 * 标记已读未读，标记红旗，标记垃圾邮件
 */
export type MailOperationType = 'read' | 'redFlag' | 'spam' | 'top' | 'preferred' | 'requestReadReceiptLocal' | 'defer' | 'memo';
export interface MarkPayload {
  memo?: string;
}
export type TypeMailState = MailOperationType | MailReadType | MailStatusType;
/**
 * 发送标识正常被发送的人员
 * 密送，抄送如字面意思
 * 空字符串表示非收件人
 * 发送: 'to', 抄送: 'cc', 密送: 'bcc',
 */
export type MemberType = 'to' | 'cc' | 'bcc' | '';
export const AllMemberType = ['to', 'cc', 'bcc', ''];
/**
 * 邮件附件类型
 */
export type MailFileAttachmentType =
  /** 普通本地上传的附件* */
  | 'upload'
  /** 内部附件, 如邮件html内嵌的image* */
  | 'internal'
  /** 来自其他邮件的附件 */
  | 'fromInternalMail'
  /** 上传的云附件 */
  | 'netfolder'
  /** 转发或回复原邮件带的附件 */
  | 'url'
  /** 从网盘中选择个人/企业空间的文件 */
  | 'netUrl'
  /** 多媒体内容* 暂未使用 */
  | 'mmc'
  /** 从网盘中选择云附件 */
  | 'trs'
  /** 日志 */
  | 'log'
  | 'download';

export type KeyOfMailEntryInfo = keyof MailEntryInfo;
/**
 * 发信方式
 */
export type WriteLetterPropType =
  | 'replyWithAttach' // 带附件回复
  | 'replyAllWithAttach' // 带附件回复全部
  | 'reply' // 回复
  | 'replyAll' // 回复全部
  | 'forward' // 转发
  | 'forwardAsAttach' // 作为附件转发
  | 'common' // 普通写信
  | 'edit' // 编辑再次发送
  | 'editDraft'; // 编辑草稿
/**
 * 信件来源
 */
export type MailContentType = 'common' | 'draft';
export type DoWriteMailPayload = {
  draft?: boolean;
  noPopup?: boolean;
  _account?: string;
  isThread?: boolean;
};
/**
 * 写邮件初始化请求参数
 */
export type WriteMailInitModelParams = {
  /**
   * 邮件标题，会自动填写到写信页邮件的title字段中
   */
  title?: string;
  /**
   * 写信时时候显示 placeholder
   */
  withoutPlaceholder?: boolean;
  /**
   * 邮件收件人的email列表，会自动填写到写信页邮件的收件人当中
   */
  contact?: string[];
  /**
   * 邮件回复，转发的原邮件id
   */
  id?: string;
  /**
   * 作为附件转发邮件id数组
   */
  asAttachIds?: string[];
  /**
   * 邮件是否是草稿
   */
  mailType?: MailContentType;
  /**
   * 发信方式
   */
  writeType?: WriteLetterPropType;
  /**
   * 额外操作，目前主要用于处理客服反馈邮件相关的附件上传
   */
  extraOperate?: string;
  /**
   * 额外参数
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  extraData?: {
    draftVersionId: string;
  };
  /**
   * 需要添加的内容，回复转发等环节填写此内容，内容会在正文中被添加，下方是回复转发的邮件引文
   */
  originContent?: string;
  /**
   * 邮件实体，如包含此参数，则会直接使用该model渲染写信页面，不在请求相关接口
   */
  result?: MailEntryModel;
  /**
   * 邮件抄送人员的email列表，会自动填写到写信页邮件的cc列表当中
   */
  ccContact?: string[];
  writeWay?: string;
  optSenderStr?: string; // 传输选中的发信人
  mailFormClickWriteMail?: string; // 在不同收信箱点击发信，发信人。会同步到写信左下角和current mail 的sender
  appointAccount?: string;
  _account?: string; // 账号
  owner?: string; // 三方账号，下属邮件所属账号
};
/**
 * 非通讯录联系人模型，可调用 {@link MailApi.buildRawContactItem  } 构建为通用联系人模型
 */
export type ParsedContact = {
  /**
   * 原始数据
   */
  item: string;
  /**
   * 邮箱的联系人昵称
   */
  name?: string;
  /**
   * 邮箱email
   */
  email: string;
  /**
   * 头像 url
   */
  avatar?: string;
  /**
   * 该条目联系人类型
   */
  type: MemberType;
  // accid
  id?: string;
  // 非法的Email地址
  isIllegalEmail?: boolean;
};
/**
 * 发信后查询发送结果的返回结构
 *
 */
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

export interface MailOperationBaseParams {
  // isThread 是否聚合邮件
  isThread?: boolean;
  // needCheckThread 混合模式下，不信任isThread参数，自行去数据库查询是否为聚合邮件
  needCheckThread?: boolean;
  // 挂载账号
  _account?: string;
}

export interface DelMailParams extends MailOperationBaseParams {
  // 被删文件所在文件夹id
  fid: number;
  // id 要删除的邮件id
  id?: string | string[];
  // delFolder 是否为删除文件夹
  delFolder?: boolean;
}

export interface MoveMailParams extends MailOperationBaseParams {
  //  要移动到的文件夹id
  fid: number;
  // 要操作的邮件id，可传入多个
  id: string | string[];
  // RequestModifyMail.needFilter
  needFilter?: boolean;
}

export interface SaveMailsPutParams<T = any> {
  table: DbRefer;
  idSet: Set<string>;
  data: T;
  reserveKeys?: string[];
  mapKey?: string;
}

export interface SaveMailsPutFileParams {
  idSet: Set<string>;
  data: Map<string, FileTask>;
  taskType: UpdateMailCountTaskType;
  reserveKeys?: string[];
  _account?: string;
}

/**
 * 邮箱文件夹数据结构
 */
export interface EntityMailBox extends Entity {
  /**
   * 邮箱文件夹名称
   */
  mailBoxName: string;
  /**
   * 本邮箱的未读数目
   */
  mailBoxCurrentUnread: number;
  /**
   * 本邮箱的未读数目（聚合邮件）
   */
  threadMailBoxCurrentUnread: number;
  /**
   * 邮箱文件夹未读数目
   */
  mailBoxUnread: number;
  /**
   * 邮箱文件夹未读数目（聚合邮件）
   */
  threadMailBoxUnread: number;
  /**
   * 待办邮件数
   */
  deferCount?: number;
  /**
   * 邮箱文件夹包含邮件数量
   */
  mailBoxTotal: number;
  /**
   * 邮箱文件夹包含邮件数量（聚合邮件）
   */
  threadMailBoxTotal: number;
  /**
   * 邮箱文件夹类型
   */
  mailBoxType: MailFolderType;
  /**
   * 邮箱标识
   */
  mailBoxId: number | string;
  /**
   * 邮箱上级（上级id）
   */
  mailBoxParent: number;
  /**
   * 邮箱文件夹上锁
   */
  locked?: boolean;
  /**
   * 父级邮箱id
   */
  pid?: number;
  /**
   * 保留期限
   */
  keepPeriod?: number;
  /**
   * 邮箱最近一封邮件
   */
  latestMailEntry?: MailEntryModel;
  /**
   * 邮箱文件排序
   */
  sort: number;
  /**
   * 文件夹编辑状态  0 展示  1 新增  2 编辑
   * 仅在UI层做为中间状态
   */
  _state?: string;
  /**
   * 当前节点在tree中的深度
   * 仅在UI层做约束计算使用
   */
  _deep?: number;
  /**
   * 是否是临时节点
   * 仅在UI层做约束计算使用
   */
  _isTempNode?: boolean;
  statModel?: {
    type: 'personal' | 'org';
  };
}

/**
 * 邮箱文件夹返回实体
 */
export interface MailBoxModel {
  mailBoxId?: number | string;
  entry: EntityMailBox;
  childrenCount: number;
  children?: MailBoxModel[];
  _account?: string;
  authAccountType?: string;
  // 星标联系人信息
  starInfo?: {
    id: string;
    type: 'personal' | 'org';
    emailList?: string[];
  };
}

export interface CustomerBoxModel {
  orgName: string;
  id: string;
  lastUpdateTime: number;
  lastSetTopTime?: number;
  lastMailTime?: number;
  contacts?: EntityContact[];
  managerList?: SimpleContactModel[];
}

export interface ListCustomerPageRes {
  data: CustomerBoxModel[];
  loadMore: boolean;
}

export interface CompareCustomerListRes {
  changedModels: Map<string, CustomerEntityForMail>;
  delModels: Map<string, CustomerEntityForMail>;
  isDiff: boolean;
}

export interface CustomerBoxUnread {
  total: number;
  initialized: boolean;
  items?: CustomerUnread[];
}

export interface ContactUnread {
  contactId: string;
  email: string;
  unread: number;
  initialized: boolean;
}

export type CustomerUnreadItem = Record<string, ContactUnread>;

export interface CustomerUnread {
  customerId: string;
  unread: number;
  contacts?: CustomerUnreadItem;
  initialized: boolean;
}

export type MailAttrExchangeType = 'send' | 'receive' | '';

export interface MailAttrQuery {
  from?: string;
  to: string | string[];
}

export interface MailAttrQueryFilter {
  type?: MailAttrExchangeType;
}

export interface TpMailContentParams {
  owner?: string;
  mid: string;
}

export interface MailAttrDbRes {
  rcTime: number;
  mid: string;
  isTpMail: boolean;
}

export interface SelectedKeysModel {
  boxNames: number[];
  tabName: string;
}

export type MailEncodings = 'default' | 'GB2312' | 'Big5' | 'UTF-8' | 'ISO-8859-1' | 'EUC-JP' | 'Shift_JIS' | 'ISO-2022-KR';

/**
 * 邮件内容实体
 */
export interface MailContentModel {
  contentId: string;
  /**
   * 是否为html富文本（基本都是）
   */
  isHtml?: boolean;
  /**
   * 真实内容数据
   */
  content: string;
  contentLen?: number;
  /**
   * 内容md5
   */
  md5?: string;
  // 邮件正文编码
  encoding?: MailEncodings;
  _account?: string;
}

export interface SettingUpdateParam {
  /**
   * 提醒类型:1-异地登录提醒,2-账号锁定提醒,3-灵犀新设备登录提醒,4-陌生人来信提醒
   */
  type: number;
  status: number;
  mail_alert: string;
  sms_alert: string;
}

/**
 * 拓展文件附件，增加邮件附件的特有属性
 */
export interface MailFileAttachModel extends FileAttachModel {
  fileHandledName?: string;
  /**
   * docId 从云文档得到的id,由于web逻辑层记录了此id，故需要保持
   */
  docId?: number;
  /**
   * 针对某些无服务端id的场景，使用realId标识附件，生成逻辑为随机数+时间戳后六位
   * 全流程id，由api层或者ui层生成（建议ui层）
   */
  realId?: number;
  /**
   * attachmentId, 上传后api层设置，对应服务端attachmentId
   */
  id: number;
  /**
   * 云文档id,生成云附件卡片使用
   */
  cloudIdentity?: string;
  /**
   * 附件名称
   */
  name?: string;

  // file?: File;

  type: MailFileAttachmentType;
  /**
   * ui层用这个做了附件所述信件的信息
   */
  downloadContentId?: string;
  downloadId?: string;
  /**
   * 原始和mid相同，后用法混乱，拟废弃
   */
  contentId?: string;
  /**
   * 是否为内联附件，内联附件多为图片，嵌入到邮件正文中，以<img src="内联附件地址"> 形式存在
   */
  inlined?: boolean;
  contentLocation?: string;
  /**
   * url类型附件上传服务器后，会拿到对应的id,此时标记fromServer = true
   * 其他附件经过一次continue操作后，也会记录 fromServer = true
   */
  fromServer?: boolean;
  /**
   * 附件被删除后，从返回的服务端接口中拿到deleted状态计入此字段
   */
  serverDel?: boolean;
  /**
   * 删除标志位
   */
  deleted?: boolean;
  /**
   * 上传完毕标示位
   */
  ready?: boolean;
  /**
   * 已经从预处理接口拿到id
   */
  idFilled?: boolean;
  /**
   * 过期时间
   */
  expired?: number;
  /**
   * 文件的上传顺序
   */
  index?: number;
  /**
   * 已将附件内容填入邮件正文
   */
  contentFilled?: boolean;
  /**
   * 云附件上传偏移量
   */
  uploadOffset?: number;
  /**
   云附件上传 context
   */
  uploadContext?: string;
  /**
   * 是否是云附件
   */
  cloudAttachment?: boolean;
  /**
   * 文件类型
   */
  contentType?: string;
  /**
   * 添加其他邮件的附件到当前邮件时，记录的来源邮件的mid
   */
  midOfSourceMail?: string;
  /**
   * 添加其他邮件的附件到当前邮件时，记录的来源邮件的id,attachmentID ， 即part
   */
  partOfSourceMail?: number;
  /**
   * 附件检测结果
   */
  mailCheckResult?: MailAttachmentCheckResult;
  /**
   * 当前附件文件在本地的路径
   */
  attachPath?: string;

  unDecrypted?: boolean; // 未解密

  _account?: string;
}

/**
 * 信件信息主体结构
 */
export interface MailEntryInfo {
  /**
   * 所在邮箱id
   */
  folder: number;
  /**
   * 邮件标题
   */
  title: string;
  /**
   * 写信时时候显示 placeholder
   */
  withoutPlaceholder?: boolean;
  /**
   * 发信者发送时间
   */
  sendTime?: string; // 时间戳？
  /**
   * 接受时间
   */
  receiveTime?: string;
  /**
   * 邮件标记
   */
  mark?: MarkStatus;
  /**
   * 已回复
   */
  replayed?: boolean;
  /**
   * 已转发
   */
  forwarded?: boolean;
  /**
   * 是否原信转发
   */
  directForwarded?: boolean;
  /**
   * 可撤回
   */
  canRecall?: boolean;
  /**
   * 草稿
   */
  isDraft?: boolean;
  /**
   * 附件
   */
  attachment?: MailFileAttachModel[];
  /**
   * 附件数量
   */
  attachmentCount: number;
  /**
   * 发送状态
   */
  sendStatus?: MailSendStatus;
  /**
   * 读信状态，已读/未读
   */
  readStatus?: MailReadType;
  /**
   * 摘抄
   */
  brief?: string;
  /**
   * 邮件正文
   */
  content: MailContentModel;
  /**
   * 邮件id, 外部结构中id与此字段相同
   */
  id: string;
  /**
   * 作为附件转发
   */
  asAttachIds?: string[];
  /**
   * 要求已读回执 本地数据 requestReadReceipt
   */
  requestReadReceiptLocal?: boolean;
  /**
   * 要求已读回执 服务端数据
   */
  requestReadReceipt?: boolean;
  /**
   * 搜索命中词条
   */
  hitQuery?: KeyOfMailEntryInfo; // 此处设计可能会变 --- 因为
  /**
   * 信件属性
   */
  writeLetterProp?: WriteLetterPropType;
  /**
   * 邮件备注 (CM-6467)
   */
  memo?: string;
  /**
   * 聚合邮件中第一封实体邮件ID
   */
  threadMessageFirstId?: string;
  /**
   * 聚合邮件数量,查询类型为checkThread时有意义
   */
  threadMessageCount: number;
  /**
   * 聚合邮件id集合,查询类型为checkThread时有意义
   */
  threadMessageIds?: string[];
  /**
   * 邮件撤回状态
   * 3表示成功撤回，4表示撤回失败，5表示部分成功
   */
  rclStatus?: number;
  /**
   * 邮件发送状态
   */
  sndStatus?: number;
  /**
   * 是否钓鱼邮件
   */
  suspiciousSpam?: boolean;
  /**
   * 置顶邮件
   */
  top?: boolean;
  /**
   * 是否是系统邮件
   */
  system?: boolean;
  /**
   * 是否日程邮件
   */
  isIcs?: boolean;
  // @todo tid
  traceId?: string;
  /**
   * 权限
   */
  priority?: number;
  /**
   * 是否定时发送
   */
  isScheduleSend?: boolean;
  /**
   * 发信事务id
   */
  tid?: string;
  /**
   * 收件人总数
   */
  rcptCount?: number;
  /**
   * 发信已读数量
   */
  readCount?: number;
  /**
   * 内域收件人总数
   */
  innerCount?: number;
  /**
   * 内域已读数量
   */
  innerRead?: number;
  /**
   * 三方账号发出信的打开次数
   */
  openCount?: number;
  /**
   * 任务邮件id
   */
  taskId?: number;
  /**
   * 任务邮件是否置顶
   */
  taskTop?: boolean;
  /**
   * 任务邮件数量
   */
  taskNum?: number;
  /**
   * 是否优先处理邮件0=优先邮件，其他非优先
   */
  preferred?: number;
  /**
   * 表扬信id，如果有值则是表扬信，没有则不是
   */
  praiseId?: number;

  /**
   * 发送邮件的mid
   */
  sentMailId?: string;

  /**
   * 当前邮件的语言类型
   */
  langType?: string;
  /**
   * 当前邮件的各种语言类型
   */
  langListMap?: Record<string, any>;
  // langListMap?: object;
  /**
   * 是否有讨论组
   */
  eTeamType?: number;
  /**
   * 是否设置待办
   */
  isDefer?: boolean;
  /**
   * 待办时间
   */
  deferTime?: string;
  /**
   * 是否设置待办提醒
   */
  deferNotice?: boolean;
  /**
   * 是否已被POP收取
   */
  popRead: boolean;
  /**
   * 发信失败
   */
  rcptFailed: boolean;
  /**
   * 发信成功
   */
  rcptSucceed: boolean;
  // 是否有云附件
  linkAttached?: boolean;
  // 加密邮件的密码
  encpwd?: string;
  // 邮件附件数据来源 只有明确从接口来的会有值
  attSource?: 'list' | 'content';
}

export interface MailSendErrMsgInfo {
  reason: string;
  code: string;
  email: string;
}

export enum FolderTreeEditState {
  DEFAULT = 'DEFAULT',
  ADD = 'ADD',
  UPDATE = 'UPDATE',
  LOADING = 'LOADING',
}

export interface MailBoxEntryContactInfoModel {
  /**
   * 联系人信息
   */
  contact: ContactModel;
  /**
   * 联系人使用的email信息
   */
  contactItem: EntityContactItem;
  /**
   * 发送、抄送、密送
   */
  mailMemberType: MemberType;
  /**
   * 是否在通讯录中
   */
  inContactBook: boolean;
  /**
   * 原始联系人姓名
   */
  originName?: string;
}

// /**
//  * 聚合邮件模型
//  */
// export interface MailEntryGroupModel {
//   /**
//    * 聚合邮件的id,取第一封聚合邮件的id为聚合邮件id
//    */
//   mid: string;
//   /**
//    * 聚合邮件的文件夹
//    */
//   fid: number;
//   /**
//    * 聚合邮件的主题
//    */
//   commonSubject: string;
//   /**
//    * 聚合邮件详情
//    */
//   entries: MailEntryModel[];
//   /**
//    * 聚合的邮件数量
//    */
//   entryCount: number;
//   /**
//    * 已回复
//    */
//   replayed?: boolean;
//   /**
//    * 读信状态，已读/未读
//    */
//   readStatus?: MailReadType;
//   /**
//    * 邮件标记
//    */
//   mark?: MarkStatus;
// }

export interface ErrMsg {
  code: string;
  msg?: string;
  msgItem?: MailSendErrMsgInfo[];
}

export type UploadAttachmentFlag = {
  inline?: boolean;
  usingCloud?: boolean;
  _account?: string;
};

export type UploadReq = {
  index: number;
  // eslint-disable-next-line @typescript-eslint/ban-types
  fun: Function;
};

export type MailAttachmentCheckResult = {
  pass: boolean;
  attachmentId: number;
  failReason?: string;
};

export interface MailStatus {
  cc?: boolean;
  bcc?: boolean;
  userBusyFreeShow?: boolean; // 是否显示忙闲
  showContact?: boolean;
  keyword: string;
  init: boolean;
  conferenceSetting: boolean;
  conferenceShow: boolean;
  praiseMailShow: boolean;
  praiseMailSetting: boolean;
  taskMailShow: boolean;
  puretext: boolean;
  taskMailSetting: boolean;
}

export interface MailEntryModel {
  /**
   * 为 true 时，为聚合邮件
   */
  isThread?: boolean;
  /**
   * 聚合邮件会话ID，如果是聚合邮件时，与mid相同
   */
  threadId?: string;
  /**
   * 客户端生成的邮件id记录，api层负责生成，为了保障某些无任何id的场景下唯一标识邮件
   */
  cid?: string;
  /**
   * 临时id : compose_id , 使用 save / continue 等操作由服务端获取，由服务端设置，客户端无需更改
   */
  _id?: string;
  /**
   * mid , 邮件的存档id , 与entry中的id相同，由服务端设置，客户端无需更改
   */
  id: string;
  /**
   * 聚合邮件所属文件夹列表
   */
  convFids?: number[];
  /**
   * draftId , 邮件的草稿id，由服务端设置，客户端无需更改
   */
  draftId?: string;
  // 本地草稿版本ID
  draftVersionId?: string;
  // 无法恢复得附件数目
  unableRecoverAttCount?: number;
  // 需要恢复的本地cid
  recoverCid?: string;
  /**
   * 发信人
   */
  sender: MailBoxEntryContactInfoModel;
  /**
   * 发件人组，聚合邮件使用
   */
  senders?: MailBoxEntryContactInfoModel[];
  /**
   * 收信人
   */
  receiver: MailBoxEntryContactInfoModel[];
  /**
   * 邮件信息
   */
  entry: MailEntryInfo;
  /**
   * 报错信息
   */
  errMsg?: ErrMsg;
  /**
   * 邮件占用总体积,含正在上传的附件体积
   */
  totalSize: number;
  /**
   * 新上传邮件普通附件的偏移量
   */
  attachmentOffset?: number;
  /**
   * 邮件云附件占用总体积
   */
  totalCloudAttachmentSize?: number;
  /**
   * 邮件创建时间，数据入库时记录
   */
  createTime?: number;
  /**
   * 邮件更新时间，刷新状态时记录
   */
  updateTime?: number;
  /**
   * 新上传附件数量
   */
  newUploadedAttachment?: number;
  /**
   * 聚合邮件详情
   */
  threadMails?: MailEntryModel[];
  /**
   * 聚合邮件主邮件
   */
  mainMail?: MailEntryModel;
  /**
   * 邮件标签
   */
  tags?: string[];
  /**
   * 处理次数
   */
  handleTime?: number;
  /**
   * 是否开启外域邮件追踪
   */
  mailTrace?: boolean;
  /**
   * 别名发信数据
   */
  aliasSender?: MailAliasAccountModel;

  extraOperate?: string;
  /**
   * 定时发信时间时区
   */
  scheduleDateTimeZone?: number;
  /**
   * 定时发信时间, 用于定时发信操作（北京）
   */
  scheduleDate?: string | undefined;
  /**
   * 返回额外的信头, 每个信头都必须指定
   */
  headers?: any;
  /**
   * 重发邮件，设置此属性为true，将在本地存储的时候去掉 _id等信息
   */
  resend?: boolean;
  /**
   * 转发，回复，编辑等操作发生时，原邮件id
   */
  originMailId?: string;
  /**
   * 信件额外控制数据
   */
  extData?: StringMap;
  /**
   * 是否开启已读提醒
   */
  senderReceivers?: boolean;
  /**
   * 是否开启已读回执 本地数据
   */
  requestReadReceiptLocal?: boolean;
  /**
   * 是否开启已读回执 服务端数据
   */
  requestReadReceipt?: boolean;
  /**
   * 任务邮件
   */
  task?: TaskMail;
  /**
   * 任务邮件id
   */
  taskId?: number;
  /**
   * 任务邮件详情
   */
  taskInfo?: TaskMailModel;
  /**
   * 表扬信内容
   */
  praiseLetter?: any;
  /**
   * 是否群发单显
   */
  isOneRcpt?: boolean;

  sentMailId?: string;

  eventTarget?: string;

  // 从本地打开的邮件具有这个属性
  localFilePath?: string;

  getAtts?: boolean;

  /**
   * 多账号添加，用于标识此邮件所属于的账号
   */
  _account?: string;

  // /**
  //  * 邮件检查结果
  //  */
  // mailCheckResult?: MailCheckResult;
  tabTempId?: string;

  optSenderStr?: string;

  optSender?: null | MailAliasAccountModel;

  conference?: any; // 会议

  mailFormClickWriteMail?: string; // 在不同收信箱点击发信，发信人。会同步到写信左下角和current mail 的sender

  /**
   * 反垃圾信息返回
   */
  antispamInfo?: {
    RulesType?: string;
    asIgnoreReason?: string;
    asMailType?: string;
  };

  isTpMail?: boolean; // 是否为第三方邮件

  owner?: string; // 第三方邮件所属人

  mailFrom?: 'subordinate'; // 第三方邮件的业务来源，本字段不参与落库，比对逻辑，目前仅有邮件+下属邮件会有这个字段

  size?: number;

  sentTInfo?: string;

  status?: MailStatus; // 写信的各种状态

  emailType?: string;

  isEncryptedMail?: boolean; // 是否是加密邮件(是否存在加密邮件)

  isDecrypted?: boolean; // 加密邮件是否被解密了

  setEncrypt?: boolean; // 是否以加密方式发出

  savePassword?: boolean;

  authAccountType?: string | null; // 账号类型 0:普通账号，1:三方企业账号，2:三方个人账号

  // 邮件异常情况
  // 1 list接口附件的inline情况与详情接口inline情况不一致
  // 2 list接口附件的inline情况与详情接口inline情况不一致，且是由于图片无后缀名导致的内联附件被解析为非内联附件
  mailIllegal?: number[];
  checkPass?: boolean;
}

export interface ReUploadInfo {
  fromAccount: {
    account: string;
    sid: string;
    node: string;
    coremail: string;
    qiyeToken: string;
  };
  toAccount: {
    account: string;
    sid: string;
    node: string;
    coremail: string;
    qiyeToken: string;
  };
  fromComposeId?: string;
  toComposeId?: string;
  attachments?: any[];
  excludeAttachment?: string[];
}

export interface RespDoTransferAtts {
  attachments: any[];
  originalAttachmentCount: number;
  fromAccount: string;
  toAccount: string;
  toComposeId: string;
  draftId?: string;
}

export interface ReqDoSaveAttachmentToDB {
  cid: string;
  _account: string | undefined;
  attachment: MailFileAttachModel[];
}

export interface DoSaveTempParams {
  content: MailEntryModel;
  saveDraft?: boolean;
  auto?: boolean;
  _account?: string;
  callPurpose?: string;
}

export interface DecryptedResult {
  passed: boolean;
  data?: DecryptedResultData;
  code?: string;
  errMsg?: string;
}

export interface DecryptedResultData {
  html: {
    content: string;
    contentId: string;
    contentLength: number;
  };
  attachments: ResponseAttachment[];
}

export interface DeleteAttachmentRes {
  success?: boolean;
  code?: string;
  title?: string;
}

export interface DecryptedContentResult {
  passed: boolean;
  data?: MailEntryModel;
  code?: string;
  errMsg?: string;
}

export interface StarContactModel {
  contactId: string;
  emailList: string[];
}

export interface DoCancelDeliverParams {
  tid: string;
  tinfo: string;
  mailTrace: boolean;
}

export interface DoImmediateDeliverParams {
  tinfo: string;
}

export interface DoUploadAttachmentParams {
  cid: string;
  attach: File | string;
  uploader?: LoaderActionConf;
  flag?: UploadAttachmentFlag;
  realId?: number;
  _account?: string; // 根flag的_account是同一个 建议干掉
}

export interface DoAbortAttachmentRes {
  success: boolean;
  message?: string;
}

// 三方邮件
export interface EntityTpMail extends resultObject {
  mid: string;
  owner: string;
  entryModel: MailEntryModel;
  rcTime: number;
}

/**
 *  外域邮件状态
 */
export interface MailExternalDeliverStatusItem {
  to: string;
  toType: number;
  sentStatus: number;
  deliverCode: number;
  read: boolean;
  readTime: number;
  inner: boolean;
}

/**
 * 签名返回结构
 */
export interface ResponseSignature {
  content: string; // 签名内容
  id?: number; // 签名id
  isDefault?: boolean; // 是否为默认的签名
  name?: string; // 签名档名称
  isHtml?: boolean; // 签名档内容是否为html文本
  enable?: boolean;
  defaultSignChange?: boolean; // 获取默认签名时，当发现服务端的默认签名与DB中的不同时，返回新的默认签名
  personalSignList?: SignDetail[];
}

/**
 * 来信分类相关
 */
export interface MailClassifyRuleFlags {
  read?: boolean;
  top?: boolean;
  label0?: number;
}

/**
 * 来信分类规则条件
 */

export type MailClassifyRuleCondition =
  | MailClassifyRuleConditionAccounts
  | MailClassifyRuleConditionNormal
  | {
      field: string | string[] | number | Date[];
      ignoreCase?: boolean;
      flagOperatorOr?: boolean;
      operator: string;
      operand: string[];
    };

export interface MailClassifyRuleConditionAccounts {
  field: 'accounts';
  ignoreCase: boolean;
  flagOperatorOr?: boolean;
  operator: string;
  operand: string[];
}

export interface MailClassifyRuleConditionNormal {
  field: string;
  ignoreCase: boolean;
  flagOperatorOr?: boolean;
  operator: string;
  operand: string[];
}

/**
 * 来信分类规则行为
 */
export interface MailClassifyRuleBehavior {
  disabled?: boolean;
  type: string;
  value?: string | string[] | number | boolean | MailClassifyRuleFlags;
  content?: string;
  target?: string;
  keepLocal?: boolean;
}

/**
 * 来信分类规则返回结构
 */
export interface ResponseMailClassify {
  continue?: boolean;
  name?: string;
  disabled?: boolean;
  id?: number;
  _id?: number;
  condictions?: MailClassifyRuleCondition[];
  actions?: MailClassifyRuleBehavior[];
}

/**
 * 邮件搜索条件
 */
export interface MailSearchModelCondition {
  // field: 'range' | 'from' | 'to' | 'attachment' | 'subj' | 'cont'  | 'redFlag';
  // operand:any;
  // operator?: string
  /**
   * 邮件标示位
   */
  flags?: MailFlags;
  /**
   * 邮件发件人
   */
  from?: string;
  /**
   * 邮件收件人
   */
  to?: string;
  /**
   * 邮件备注
   */
  memo?: string;
  /**
   * 主题
   */
  subject?: string;
  /**
   * 红旗邮件
   */
  label0?: number;
  /**
   * 已读未读
   */
  read?: boolean;
  /**
   * 发送日期 2021-06-28:2021-06-29 只有开始或者结束日期 冒号也不能省略
   * mbox:listMessages  filter sentDate格式为string
   * 具体参考 http://qiye-wmsvr.netease.com/api-docs/wmsvr.html#mbox:listMessages
   */
  sentDate?: string[] | string;
  /**
   * 优先邮件列表标志位 0=优先分类标签，其他值预留
   */
  preferred?: number;
  /**
   * 任务邮件标签页
   */
  taskTab?: number;
  /**
   * 待办邮件时间
   */
  defer?: string;
}

export interface MailSearchModel {
  /**
   * 全文搜索文字
   */
  pattern?: string;
  /**
   * 开始位置
   */
  start: number;
  /**
   * 返回条数
   */
  limit: number;
  /**
   * 返回全部信息的条目数量，超过此数目的条目会仅返回mailId
   */
  windowSize?: number;
  /**
   * 返回摘要的条目数量
   */
  summaryWindowSize?: number;
  /**
   * 搜索条件
   */
  conditions: MailSearchModelCondition[];
  /**
   * 排序字段
   */
  order?: MailOrderedField;
  /**
   * 是否降序
   */
  desc?: boolean;
  /**
   * 搜索所在文件夹
   */
  fids?: number[];
  /**
   * 是否忽略统计信息
   */
  ignoreGroup?: boolean;
}

/**
 * fid: '',
 * 'flags.read': '',
 * sentDate: '',
 * 'flags.attached': '',
 *  fromAddress: '',
 */

export type MailStatType = 'flags.read' | 'sendDate' | 'flags.attached' | 'fromAddress';

export type MailSearchType = 'folder' | 'flags.read' | 'sendDate' | 'flags.attached' | 'fromAddress' | 'resetDisable';

export type StatResult = {
  name: string;
  items: Record<string, StatResultItem>;
  total?: number;
};

export type MailSearchCondition = {
  field: searchableFields;
  operator: searchableOperator;
  operand: string | number | MailFlags;
};
export type StatResultItem = {
  label: string;
  value: number;
  key: string;
  filterCond: MailSearchCondition;
  contactLabel?: string; // 发信人添加拼音首字符字段
};

export type MailStatResult = Partial<Record<MailStatType, StatResult>>;

export interface MailSearchResult {
  /**
   * 搜索到的邮件
   */
  entities: MailEntryModel[];
  /**
   * 文件夹信息
   */
  folders: MailBoxModel[];
  /**
   * 分项统计数据
   */
  stats?: MailStatResult;
  /**
   * 搜索id
   */
  searchId: number;
  readCount: number;
  unreadCount: number;
  total: number;
  _account: string;
  // 搜索输入的关键词，也返回
  key: string;
  // 搜索的筛选条件返回,本地搜索和服务端搜索有，高级搜索没有
  filterCond: MailSearchCondition[];
  // 搜索条件的文件夹id
  fid: number | undefined;
}

// 邮件搜索范围
export type MailSearchTypes = 'all' | 'title' | 'sender' | 'receiver' | 'attachment';

// 邮件搜索方式
export type MailSearchStates = '' | 'local' | 'server' | 'advanced';

// 多账号邮件搜索方式Map
export type MailSearchStatesMap = {
  [key: string]: MailSearchStates;
};

// 邮件操作
export type MailOpRecordActions = 'search';

export type MailOpRecordStatus = 'pending' | 'success' | 'fail';

export interface MailSearchRecord {
  id: string;
  type: MailSearchTypes;
  content: string;
}

export type MailSearchRecordPayload = Omit<MailSearchRecord, 'id'>;

export interface MailSearchRecordUpdatePayload {
  id: string[];
  deleteFlag: 0 | 1;
}

export interface MailOperationRecord {
  action: MailOpRecordActions;
  count: number;
}

export type ThreadCheckMode =
  | 'count' //  只需要对话的信件数,不传默认为count
  | 'listid' // 需要对话的所有信件标识 (msid + ':' + mid)
  | 'listinfo'; // 需要对话信件的具体信息 (msginfo)
// export interface MailSendResult {
//     /**
//      邮件id
//      */
//     id: string;
// {
//   "data": [
//       {
//        name: ALL ,
//        title: 全部
//       },
//       {
//        name: SENT,
//        title: 发出的
//       }, {
//        name: RECEIVED,
//        title：收到的，
//       }, {
//        name: FLAG,
//        title:红旗
//       }, {
//        name: ATTACHMENT
//        title:带附件
//       }],
//   "success": true,
//   "message": "success",
//   "code": 200
// }
// }
/**
 * 列出邮件列表所用的查询参数
 */
export type queryMailBoxParam = {
  /**
   * id 邮箱文件夹id标识 checkThreadDetail时为聚合邮件头封的id
   */
  id?: number;
  /**
   * 多个邮件文件夹id标识
   */
  ids?: number[];
  /**
   * startId 开始查询的邮件id （不包含此id的邮件）--- 请求后会额外返回 midoffset，后续可以直接使用 index=midoffset查询
   */
  startId?: string;
  /**
   * count 返回多少封邮件 （count 取负数表示取之前的若干封邮件）
   */
  count: number;
  /**
   * status 按状态筛选Mail, send / receive / attachment 目前仅支持 checkType=checkRelatedMail
   */
  status?: TypeMailState;
  /**
   * index 在总数中属于第几封，便于服务端通过分页进行查找
   */
  index?: number;
  /**
   * 过滤参数，见 {@link MailSearchModelCondition},可实现比status指定更强大的功能
   */
  filter?: MailSearchModelCondition;
  /**
   * 多封邮件的id,传入此参数，其他过滤参数将失效，聚合邮件详情需传入此参数
   */
  mids?: string[];
  /**
   * 前端处理参数，忽略联系人数据处理
   */
  ignoreContact?: boolean;
  /**
   * 是否添加本地未发送的邮件
   */
  addSentContent?: boolean;
  /**
   * 查询类型，查聚合列表，查聚合详情，查关联邮件
   */
  checkType?: 'checkStarMail' | 'checkThread' | 'checkThreadDetail' | 'normal' | 'checkCustomerMail' | 'checkSubordinateMail' | 'checkRelatedMail';
  /**
   * 返回对象而非数组，如果传入true，返回类型将变为 {@see MailModelEntries}
   */
  returnModel?: boolean;
  /**
   * 返回邮件标签
   */
  returnTag?: boolean;
  /**
   * 聚合邮件返回模式
   */
  mode?: ThreadCheckMode;
  /**
   * 关联联系人，只支持checkRelatedMail
   */
  relatedEmail?: string[];
  /**
   * 截止日期，只支持checkRelatedMail（根据邮件属性获取邮件列表也会用到)
   */
  startDate?: string;
  /**
   * 截止日期，只支持checkRelatedMail（根据邮件属性获取邮件列表也会用到)
   */
  endDate?: string;
  /**
   * 列表最后一封的 mid
   */
  endMid?: string;
  /**
   * 邮件所打的标签
   */
  tag?: string[];
  /**
   * 请求序列号,由接口层生成
   */
  querySeq?: number;
  /**
   * 排序参数
   */
  topFlag?: string;
  /**
   * 搜索类别
   */
  searchType?: MailSearchTypes;
  /**
   * 根据邮件属性获取邮件列表
   */
  attrQuery?: MailAttrQuery | MailAttrQuery[];
  // api 层根据 attrQuery 查询得到的
  attrConf?: MailAttrConf;
  /**
   * 第三方
   */
  tpMids?: SyncTpMailParamItem[];
  /**
   * 根据邮件属性获取邮件列表时的筛选条件
   */
  attrQueryFilter?: MailAttrQueryFilter;
  // 搜索账号
  accountId?: string;
  // 额外筛选条件
  filterCond?: MailSearchCondition[];
  // 联系人 4s 竞速
  noContactRace?: boolean;
  // 账号信息
  _account?: string;
  // 邮件排序字段 参考 http://qiye-wmsvr.netease.com/api-docs/wmsvr.html#mbox:listMessages 中order参数
  order?: MailOrderedField;
  // 邮件排序字段 降序（defualt)/升序
  desc?: boolean;

  isRealList?: boolean;
  // 只请求远程，不再同步本地
  noSync?: boolean;
};

export interface contentMakeModelParams {
  id: string;
  noFlagInfo?: boolean;
  noCache?: boolean;
  ignoreContact?: boolean;
  noContactRace?: boolean;
  checkType?: queryMailBoxParam['checkType'];
  attrQuery?: queryMailBoxParam['attrQuery'];
  tpMids?: SyncTpMailParamItem;
  _account?: string;
}

/**
 * 查询客户列表参数
 */
export interface queryCusterListParam {
  type?: CustomerOrgType;
  idList?: string[];
  noContacts?: boolean;
}

export interface SyncTpMailParamItem {
  email: string;
  mids: string[];
}

/**
 * 查询客户列表未读数参数
 */
export interface queryCusterUnreadParam {
  customerIds?: string[];
  returnAll?: boolean;
}

// 查询聚合邮件关联邮件的查询参数
export type queryThreadMailDetailParam = {
  start?: number;
  limit?: number;
  summaryWindowSize?: number; // 返回摘要的邮件数
  order?: MailOrderedField; // 排序字段,目前只有时间
  desc?: boolean; // 是否为逆序
  returnTag?: boolean; // 是否返回邮件的tag
  returnTotal?: boolean; // 是否返回总数
  returnModal?: boolean;
  returnConvInfo?: boolean; // 表示是否返回会话的基本信息,返回基本信息与返回会话下的邮件列表只能二选一
};

// ai写信 - start
// export interface AiWriteMailModel {
//   type: string; // 类型，(1：开发信，2：产品介绍，3：节日祝福，0：其他)
//   tone: string | null; // 语气
//   otherTone?: string; // 其他语气
//   language: string; // 语言
//   company: string; // 公司名称
//   product: string; // 产品名称
//   mustContains: string; // 必须包含的语句
//   extraDesc: string; // 额外描述
//   originalContent?: string; // 原文内容
//   wordCountLevel?: number; // 限制字数
//   first?: boolean | undefined; // 是否是首次请求
//   taskId?: string; // 任务ID
// }
// export interface AiWriteMailResModel {
//   prompt: string;
//   text: string;
//   gptRecordId: string;
// }

// export interface GPTDayLeft {
//   dayLimit: number;
//   dayLeft: number;
//   aiContentDayLimit: number; // ai内容日限额
//   aiContentDayLeft: number; // ai内容当日剩余次数
// }
// export interface GptAiContentTranslateReq {
//   htmlList: string[];
//   from: string;
//   to: string;
// }
// export interface GPTAiContentTranslateRes {
//   data: { translations: string[] };
//   code: number;
//   success: boolean;
//   message: string;
//   token: number;
// }
// -----数据报告-----
// export interface GenerateReportReq {
//   edmEmailIds: Array<string>;
// }
// export interface GenerateReportRes {
//   dataReportId: string;
// }

export type listAttachmentsParam = {
  order: 'date'; // 目前只支持date
  desc: boolean; // 是否降序
  start: number; // 分页参数: 开始位置
  limit: number; // 分页参数: 页面大小
  returnTotal: boolean; // 是否返回总数
  skipLockedFolders?: boolean; // 是否跳过被锁的邮件
  filter?: {
    attType: string; // 附件类型过滤，具体类型对照见上表
  };
};

export type GetMailDiscussParams = {
  emailTid?: string;
  emailMid?: string;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type ResponseGetMailDiscuss = {};

export type MailAttachment = {
  attn: string; // 附件名称
  fid: number; // 所属邮件所属文件夹
  partId: string; // 附件在邮件中ID(下载时候需要邮件ID+该ID)
  attsize: number; // 附件大小(byte)
  subject: string; // 所属邮件主题
  flags: {
    // 所属邮件属性标签，详见邮件属性
    rcptQueued: boolean;
    read: boolean;
    attached: boolean;
    rcptSucceed: boolean;
  };
  priority: number; // 所属邮件属性
  label0: number; // 所属邮件旗帜信息
  sentDate: string; // 所属邮件发信时间
  size: number; // 所属邮件大小(byte)
  from: string; // 所属邮件发信人
  id: string; // 所属邮件ID
  to: string; // 所属邮件收信人列表
  receivedDate: string; // 所属邮件到信时间
  attEncoding: string; // 附件编码类型，没有什么实际用途
  attId?: string; // 附件没有唯一id 用邮件id和partId拼接
};

export type ApiResponseListAttachments = {
  code: string; // 状态码
  var: MailAttachment[];
  total: number; // 附件总数
  notReady: boolean;
};

export type ResponseListAttachments = {
  success: boolean;
  notReady?: boolean;
  list?: MailAttachment[];
  total?: number;
  error?: PopUpMessageInfo;
};

export type ResponseUploadMail = {
  mailId: string; // 对应的内部 mid
  mailUniqueId: string; // 对应的外部 mid，使用这个参数来去列表接口等查询数据
};

export type UploadMailResult = {
  mid: string;
};

export type ImportMailsResult = {
  mid?: string;
  fileName?: string;
  mailMd5?: string;
  success: boolean;
  reason?: string;
};

export type MailUploadParams = {
  // 文件对象，由用户在浏览器选择时，从input元素中取得
  fileList?: File[];
  // 邮件文件夹id
  fid: number;
  // 桌面端重复上传忽略已删除文件夹id，在已删除中不被列为重复邮件， 默认为已删除fid = 4
  ignoreDuplicateFid?: number;
  _account?: string;
};

export interface FsParsedMail extends ParsedMail {
  id: string;
  lastModified: number;
}

export type updateThreadMailStateParam = {
  ids: string[];
  attrs: {
    fid?: number; // 文件夹id[移动文件夹]
    label0?: number; // 旗帜属性
    flags?: {
      read?: boolean;
      top?: boolean;
      flagged?: boolean; // 红旗操作需带此属性
    };
  };
};

/**
 *成功 | 邮件不存在 | 不支持召回 | 邮件已过期(发送时间超过限制)
 */
export type MailOperationStatus = 'S_OK' | 'FA_MAIL_NOT_FOUND' | 'FA_UNSUPPORT_RECALL' | 'FA_MAIL_EXPIRED';

export interface MailDeliverStatusItem {
  email: string;
  contactName?: string;
  avatar?: string;
  result: number;
  contact?: ContactModel;
  mid: string;
  rclResult: number;
  modifiedTime?: string;
  msgType?: number;
}

export interface MailDeliverStatus {
  status: MailOperationStatus;
  detail: MailDeliverStatusItem[];
  tid: string;
}

export interface MailEmoticonInfoModel {
  email_tid: string;
  count: number;
  participated: boolean;
  type: number;
  email_tid_type: number;
  // first_participated\sender_is_internal\email_id_type 为点赞的返回字段
  first_participated?: boolean;
  sender_is_internal?: boolean;
  email_id_type?: number;
  involvedRecords?: InvolvedRecordsModel[];
}
// 邮箱快捷设置接口格式
type MailConfigQuickSettingListElement = 'ABSTRACT' | 'ATTACH_DETAIL' | 'SENDER_ICON' | 'DISPLAY_PAGING_WEB' | 'DISPLAY_PAGING_DESKTOP' | 'DISPLAY_MAIL_SEND_TIME';
export type MailView = 'SUB_FIELD' | 'FULL_FIELD' | 'UP_DOWN_FIELD' | null;
export interface MailConfigQuickSettingModel {
  // mailView 取值为：SUB_FIELD（左右分栏）、FULL_FIELD（通栏），互斥
  // displayMode 取值为：SMART_TOTAL（智能模式-全部）、SMART_PRIOR（智能模式-优先）、TOPIC_AGG（主题聚合），互斥
  // listSpace 取值为：LOOSE（宽松）、SUITABLE（适中）、COMPACT（紧凑），互斥
  // mailView 取值为：ABSTRACT（摘要）、ATTACH_DETAIL（附件明细）、SENDER_ICON（发件人头像），不互斥
  // displayMode: 在17版本智能模式下线后，会变成主题聚合和普通模式两个值，NORMAL
  available?: boolean | null;
  mailView?: MailView;
  // displayMode?: 'SMART_TOTAL' | 'SMART_PRIOR' | 'TOPIC_AGG' | null;
  displayMode?: 'NORMAL' | 'TOPIC_AGG' | null;
  listSpace?: 'LOOSE' | 'SUITABLE' | 'COMPACT' | null;
  listElements?: MailConfigQuickSettingListElement[] | null;
  sendRevoke?: 'ON' | 'OFF';
  sendRevokeIn?: 0 | 5 | 10 | 15 | 30 | 60;
}

export interface MailConfigDefaultCCBCCModel {
  cc: string[];
  bcc: string[];
}

export interface InvolvedRecordsModel {
  acc_id: string;
  acc_email: string;
  nick_name: string;
  nick_name_slice?: string;
}

export interface EmoticonCreateModel {
  email_tid?: string;
  email_mid: string;
  type: number;
  participated: boolean;
  email_title?: string;
  sender_email?: string;
  sender_mid?: string;
  _account?: string;
}

export interface TaskMail {
  type: 0 | 1 | 2; // 任务邮件提醒类型, 0-无截止时间，1-时间点，2-全天
  alertTime?: number; // 提前提醒时间, 单位分钟
  alertAt?: number; // 固定提醒时间，单位秒
  deadline: number; // 截止时间，单位秒
  alert: boolean; // 是否逾期提醒
  title: string; // 任务标题
  executorList: string[]; // String, 执行人列表(注：accountId)
  focusList: string[]; // String, 关注人列表，本次新增(注：accountId)
}

export interface createUserFolderParams {
  parent: number;
  name: string;
  flag?: Record<string, any>;
  keepPeriod?: number; // corp需要，0表示取消原用户自设定，-1表示强制不清理
}

export interface createUserFolderParamsCondig {
  syncMailFolder?: boolean;
}

export interface updateUserFolderParams {
  id: number;
  parent?: number;
  name?: string;
  flag?: Record<string, any>;
  keepPeriod?: number; // corp需要，0表示取消原用户自设定，-1表示强制不清理
  sorts?: string;
}

export interface updateMessageInfosParams {
  ids: string[];
  attrs: {
    memo: string;
  };
}

export interface GetFilePreviewUrlParams {
  url: string;
  mid: string;
  _account?: string;
}

export interface Recent3StrangersRes {
  strangerCount: number;
  recent3Strangers: StrangerModel[];
}

export interface newUsersIntoEmailListParam {
  accountName: string;
  priority: EmailListPriority | null;

  [params: string]: unknown;
}

// 系统账号
// 临时写死
export const SystemAccounts = [
  'kf@qiye.163.com',
  'kf@office.163.com',
  'notice@qiye.163.com',
  'postmaster@qiye.163.com',
  'Postmaster@qiye.163.com',
  'join163@qiye.163.com',
  'service@v.qiye.163.com',
  'abuse@qiye.163.com',
  'mail@ym.163.com',
];

export interface RecombineDataType {
  startPos: number;
  textStartPos: number;
  correctChunk: string;
  orgChunk: string;
  detailReason: string;
}

interface GrammarErrorCode {
  '0': string;
  '101': string;
  '102': string;
  '103': string;
  '104': string;
  '105': string;
  '106': string;
  '107': string;
  '108': string;
  '109': string;
  '110': string;
  '111': string;
  '112': string;
  '113': string;
  '114': string;
  '201': string;
  '202': string;
  '203': string;
  '205': string;
  '206': string;
  '207': string;
  '301': string;
  '302': string;
  '303': string;
  '304': string;
  '401': string;
  '402': string;
  '411': string;
  '412': string;
  '29001': string;
  '29002': string;
  '29003': string;
  '29004': string;
  '29005': string;
  '29006': string;
  '29007': string;
  '29008': string;
  '29009': string;
  '29301': string;
}

export interface GrammarResponse {
  RequestId: string;
  errorCode: keyof GrammarErrorCode;
  Result: GrammarResult;
}

export interface GrammarResult {
  rawEssay: string;
  sentNum: number;
  uniqueKey: string;
  essayAdvice: string;
  title: string;
  totalScore: number;
  writeType: number;
  essayLangName: string;
  majorScore: MajorScore;
  allFeatureScore: AllFeatureScore;
  paraNum: number;
  essayFeedback: EssayFeedback;
  wordNum: number;
  fullScore: number;
  totalEvaluation: string;
  stLevel: string;
  conjWordNum: number;
  writeModel: number;
}

interface EssayFeedback {
  sentsFeedback: SentsFeedback[];
}

interface SentsFeedback {
  rawSent: string;
  paraId: number;
  sentId: number;
  errorPosInfos: (ErrorPosInfo | ErrorPosInfos2 | ErrorPosInfos3)[];
  sentFeedback: string;
  sentStartPos: number;
  correctedSent: string;
  rawSegSent: string;
  isContainGrammarError: boolean;
  isContainTypoError: boolean;
  sentScore: number;
  isValidLangSent: boolean;
  synInfo?: SynInfo[];
}

interface SynInfo {
  source: Source[];
  synId: number;
  synType: string;
  target: Target[][];
}

interface Target {
  word: string;
  tran: string;
  startPos: number;
  endPos: number;
  stuLevel: number[];
}

interface Source {
  word: string;
  startPos: number;
  endPos: number;
  stuLevel: number[];
}

interface ErrorPosInfos3 {
  newSubErrorType: number;
  knowledgeExp: string;
  reason: string;
  isValidLangChunk: boolean;
  orgChunk: string;
  exampleCases: ExampleCase[];
  errBaseInfo: string;
  newErrorType: number;
  errorTypeTitle: string;
  type: string;
  detailReason: string;
  startPos: number;
  endPos: number;
  errorTypeCode: string;
  errorTypeId: string;
  cardSubtitle: string;
  errToBBasicType: string;
  correctChunk: string;
}

interface ErrorPosInfos2 {
  newSubErrorType: number;
  knowledgeExp: string;
  reason: string;
  isValidLangChunk: boolean;
  orgChunk: string;
  exampleCases: ExampleCase[];
  errBaseInfo: string;
  newErrorType: number;
  errorTypeTitle: string;
  type: string;
  detailReason: string;
  startPos: number;
  endPos: number;
  rvalidChunk: string;
  errorTypeCode: string;
  errorTypeId: string;
  cardSubtitle: string;
  errToBBasicType: string;
  correctChunk: string;
}

interface ErrorPosInfo {
  newSubErrorType: number;
  knowledgeExp: string;
  reason: string;
  isValidLangChunk: boolean;
  orgChunk: string;
  exampleCases: ExampleCase[];
  errBaseInfo: string;
  newErrorType: number;
  errorTypeTitle: string;
  type: string;
  detailReason: string;
  startPos: number;
  endPos: number;
  errorTypeCode: string;
  errorTypeId: string;
  cvalidChunk: string;
  cardSubtitle: string;
  errToBBasicType: string;
  correctChunk: string;
}

interface ExampleCase {
  right: string;
  error: string;
}

interface AllFeatureScore {
  neuralScore: number;
  grammar: number;
  conjunction: number;
  spelling: number;
  advanceVocab: number;
  wordNum: number;
  topic: number;
  lexicalSubs: number;
  wordDiversity: number;
  sentComplex: number;
  structure: number;
}

interface MajorScore {
  grammarAdvice: string;
  wordScore: number;
  grammarScore: number;
  topicScore: number;
  wordAdvice: string;
  structureScore: number;
  structureAdvice: string;
}
export interface MailContentLangResModel {
  detected: boolean;
  lang: string;
}

export interface TranslatResModel {
  code: number;
  message: string;
  success: boolean;
  data?: TranslatResDataModel;
}

export interface TranslatResDataModel {
  translation: string[];

  [params: string]: unknown;
}

export interface TranslatStatusInfo {
  status: '' | 'process' | 'success' | 'error';
  code?: number;
  errorMessage?: string;
  from?: string;
  to?: string;
}

export type MailMsgCenterTypes = 'syncMail';
// export type MailRefreshTypes = 'regularMail' | 'task' | 'contentMail';
export type MailRefreshTypes = 'regularMail';
export type MailRefresh = Record<MailRefreshTypes, { received: boolean; diff: boolean }>;
export type MailMsgCenter = Record<MailMsgCenterTypes, MailRefresh>;

export interface MailMsgCenterParams {
  type: MailMsgCenterTypes;
  data?: Partial<queryMailBoxParam>;
  msgCenter?: {
    merge?: boolean;
    refreshType?: string;
    diff?: boolean;
  };
  checkType?: queryMailBoxParam['checkType'];
}

export type MailOpResult = Map<string, resultObject>;

export interface MailOpReplyPayload {
  mid: string;
  replyStatus: number;
  forwardStatus: number;
}

export interface MailOpEventParams {
  eventStrData:
    | 'read'
    | 'redFlag'
    | 'spam'
    | 'top'
    | 'markFolder'
    | 'requestReadReceiptLocal'
    | 'move'
    | 'delete'
    | 'tag'
    | 'preferred'
    | 'reply'
    | 'defer'
    | 'deferAll'
    | 'memo';
  status: 'start' | 'local' | 'success' | 'partial' | 'fail' | [boolean, boolean];
  params: any;
  result?: Array<Array<resultObject | MailOpReplyPayload> | undefined>;
  reason?: Error | string;
  _account?: string;
}

export interface MailDeferParams {
  deferTime: number;
  deferNotice: boolean;
}

export interface GetSetttingParams {
  name: string;
  inLocal?: boolean;
  isCorpMail?: boolean;
  urlType: { params?: { [k: string]: string } };
}

export type TagManageOps = 'add' | 'replace' | 'delete' | 'update';

export interface NewTagOpItem {
  tag: string;
  alias?: string;
}

export interface MailLimit {
  upload_size: number;
  upload_total_size: number;
  smtp_max_send_mail_size: number;
}

export interface ReqMailLimitRes {
  upload_size: number;
  smtp_max_send_mail_size: number;
}

export interface ReqGetFjFileUrlParams {
  partIds: string[];
  pack?: boolean;
  filename?: string;
}
export interface MailConfApi extends Api {
  doOpenRelatedPage(contact: ContactModel, fromAccount?: string): void;

  doOpenEdmRelatedPage(params: EdmRelatedPageParams): void;

  doOpenStrangerPage(): void;

  accountTokens: AccountTokensType[];

  /**
   * 更新子账号token
   */
  updateAccountTokens(payload: { tokenList?: string[]; forceUpdate?: boolean }): Promise<AccountTokensType[]>;

  /**
   * 获取用户设置的属性
   * @param attrs
   */
  doGetUserAttr(attrs: userAttr[]): Promise<StringMap>;

  doSetUserAttr(
    attrs: Partial<{
      [key in userAttr]: '0' | '1' | '2' | string;
    }>
  ): Promise<boolean>;

  // 请求邮件大小限制
  reqMailLimit(params?: { _account?: string }): Promise<ReqMailLimitRes | undefined>;

  // 获取邮件大小限制
  getMailLimit(params?: { _account?: string }): MailLimit;

  /**
   * 列出用户签名
   */
  listUserSignature(onlyGetDefault?: boolean, useCache?: boolean): Promise<ResponseSignature[] | undefined>;

  /**
   * 创建用户签名
   * @param item
   */
  createUserSignature(item: ResponseSignature): Promise<PopUpMessageInfo>;

  /**
   * 更新用户签名
   * @param items
   */
  updateUserSignature(items: ResponseSignature[] | ResponseSignature): Promise<PopUpMessageInfo>;

  /**
   * 删除用户签名
   * @param ids
   */
  deleteUserSignature(ids: number | number[]): Promise<PopUpMessageInfo>;

  /**
   * 设置默认签名
   */
  markDefaultSignature(id: number): Promise<PopUpMessageInfo>;

  /**
   * 获取特定签名
   */
  getUserSignature(id?: number): Promise<ResponseSignature | undefined>;

  /**
   * 将企业签名和个人签名整合后返回可用的组合签名
   * @param id
   */
  // getUserSignatureForUse(id?: number): Promise<ResponseSignature>;

  /**
   * 获取企业签名
   * @param useCache
   */
  getEntSignature(useCache?: boolean, _account?: string): Promise<ResponseSignature>;

  getMailClassifyRule(): Promise<ResponseMailClassify[]>;

  addMailClassifyRule(items: ResponseMailClassify[]): Promise<PopUpMessageInfo>;

  editMailClassifyRule(items: ResponseMailClassify[]): Promise<PopUpMessageInfo>;

  sortMailClassifyRule(id: number, value: number): Promise<PopUpMessageInfo>;

  deleteMailClassifyRule(ids: number[]): Promise<PopUpMessageInfo>;

  effectHistoryMail(id: number, ruleIds?: number[]): Promise<PopUpMessageInfo>;

  isSubAccount(_account?: string): boolean;

  getReadMailPackUrl(mail: MailEntryModel, atts: MailFileAttachModel[], filename?: string): string;

  getFjFileUrl(params: ReqGetFjFileUrlParams): string;

  getReplayStyle(title: string): string;

  getForwardStyle(title: string): string;

  getConfigByNreplay(): StringMap;

  getFolderSettings(_account?: string): Promise<string>;

  /**
   * 调用接口，加载服务器端配置
   */
  loadMailConf(_account?: string): Promise<void>;

  setMailMergeSettings(showMerged?: boolean, notAsync?: boolean): void;

  getMailMergeSettings(_account?: string): string;
  // 获取是否智能模式，17版本下线
  // isShowAIMailBox(): Promise<boolean>;
  // 设置是否智能模式，17版本下线
  // setShowAIMailBox(status: boolean): Promise<boolean>;
  // 获取智能模式，默认展示全部优先，17版本下线
  // getIntBoxDefaultDisplayList(): Promise<boolean>;
  // 设置智能模式，默认展示全部优先，17版本下线
  // setIntBoxDefaultDisplayList(value: boolean): Promise<void>;

  getCorpSettingUrl(name: string, params?: StringMap): string;

  getSettingUrl(name: string, urlType?: { params?: StringMap; url?: string }): string;

  getWebMailHost(hostOnly?: boolean, _account?: string): string;

  getNewWebMailHost(): string;

  getWebSettingUrlInLocal(name: string, urlType: { params?: StringMap; url?: string }): Promise<string | undefined>;

  getWebSettingUrl(name: string): Promise<string | undefined>;

  getSettingUrlCommon(params: GetSetttingParams): Promise<string | undefined>;

  doGetMailAliasAccountList(noMain?: boolean): Promise<MailAliasAccountModel[]>;

  getDefaultSendingAccount(_account?: string): Promise<string>;

  requestTaglist(_account?: string): Promise<any>;

  manageTag(type: 'add' | 'replace' | 'delete' | 'update', params: any, tagName?: string, _account?: string): Promise<any>;

  getTaglist(): MailTag[];

  updateMessageTags(params: any): Promise<any>;

  setMailAutoAddContact(value?: boolean): void;

  /**
   * 设置邮箱回复前缀 中英文
   * @param value '0' | '2'
   */
  setReplyForwardSetting(value: '0' | '2'): void;

  /**
   * 获取邮箱回复前缀设置 '2' | '0'
   */
  getReplySetting(): Promise<string>;

  getMailAutoAddContact(): Promise<string>;

  getPermRecallMail(): boolean;

  getRiskReminderStatus(type?: number, _account?: string): any;

  setBlackListOrWhiteList(email: string, block: boolean): any;

  updateRiskReminderStatus(enable: boolean): any;

  /**
   * @param name 标签名
   * @param getTagColor 从新标签映射获取色值
   */
  getTagColor(name: string, getTagColor?: boolean): string;

  getTagFontColor(name: string): string;
  /**
   * 设置邮箱页面布局
   * @param value 1 分栏布局， 2通栏布局, 3上下布局
   */
  setMailPageLayout(value: string): void;

  // 设置邮箱列表密度
  setMailListTightness(value: string): void;

  // 获取邮箱列表密度
  getMailListTightness(): string;

  getMailTabGuide(key: string): string;

  setMailTabGuide(key: string, val: boolean): void;

  /**
   * 获取当前邮箱页面布局
   * @returns '1' 分栏布局， '2' 通栏布局 '3' 上下布局
   */
  getMailPageLayout(): string;

  // 设置邮箱展示摘要
  setMailShowDesc(value: boolean): void;

  // 获取邮箱展示摘要
  getMailShowDesc(): boolean;

  // 设置邮箱展示附件
  setMailShowAttachment(value: boolean): void;

  // 获取邮箱展示附件
  getMailShowAttachment(): boolean;

  // 设置邮箱展示头像
  setMailShowAvator(value: boolean): void;

  // 获取邮箱展示头像
  getMailShowAvator(): boolean;

  // 设置是否展示具体时间
  setShowConcreteTime(value: boolean): void;

  // 获取是否展示具体时间
  getShowConcreteTime(): boolean;

  // 设置邮件列表支持客户邮件筛选
  setShowCustomerTab(value: boolean): void;

  // 获取邮件列表支持客户邮件筛选
  getShowCustomerTab(): boolean;

  // 获取当前登录帐号原帐号
  doGetOriginAccount(): string;

  // 设置默认发件人
  setDefaultSender(email: string): Promise<boolean>;

  // 设置主邮箱发件人昵称
  setMailSenderName(name: string, _account?: string): Promise<boolean>;

  /**
   * 绑定（代发）邮箱设置
   * @param items 邮箱列表[{id:邮箱id， name:邮箱昵称}]
   * @returns 是否成功
   */
  doUpdatePOPAccounts(items: Array<{ id: number; name: string }>, _account?: string): Promise<boolean>;

  // 获取邮箱发件人昵称列表
  getMailSenderInfo(_account?: string): Promise<MailAliasAccountModel[]>;

  setMailConfig(): Promise<boolean>;

  getTimezone(): number;

  setTimezone(timezone: number): Promise<boolean>;

  getLocalTimezone(): boolean;

  setLocalTimezone(timezone: boolean): Promise<boolean>;

  setMailBlackList(parasm: { blackList?: string[]; whiteList?: string[] }): Promise<ResponseData<StringMap>>;

  setMailDefaultEncoding(key: string): Promise<boolean>;

  getIsUseRealListSync(): boolean;

  setIsUseRealList(val: boolean): Promise<boolean>;

  setMailRealListPageSize(val: number): void;

  getMailRealListPageSize(): number;

  setShouldAutoReadMail(val: boolean): Promise<boolean>;

  getShouldAutoReadMailSync(): boolean;

  getTokenBySubAccount(subAccount: string): string;

  getMailDayLimit(): { normalDayLimit: number; thirdDayLimit: number };
}

/**
 * 总数及邮件详情列表
 */
export interface MailModelEntries {
  data: MailEntryModel[];
  total: number;
  index: number;
  count: number;
  additionalInfo?: Properties;
  query: queryMailBoxParam;
  building?: number; // -1 从本地返回，0 不在构建，1 正在构建
}

export interface EdmMailModelEntries extends MailModelEntries {
  over: boolean;
}

export interface AccountInfoEntries {
  success: boolean;
  message: string;
  code: number;
  data: Partial<AccountInfoModel>;
}

// export interface AccountMailInfo {
//   email: string;
//   nickName: string;
//   delegatedSend?: boolean;
// }

export interface AccountInfoModel {
  orgId: number;
  qiyeAccountId: number;
  email: string;
  /** 别名 */
  accountName: string;
  /** 账号别名 */
  nickName: string;
  /** 别名邮箱列表 */
  aliasList: AccountMailInfo[];
  /** 域名列表，包括主域名和别名域名 */
  domainList: string[];
  /** 默认发件人 */
  defaultSender: AccountMailInfo;
  /** Popo邮件列表 */
  popAccountList: AccountMailInfo[];
  /** 账号别名新增字段 */
  senderName: string;
  // 企业logo
  domainLogo: string;
  domainShareList: { domain: string; orgId: number }[];
  node: string;
  authAccountType: string; // 账号类型 0:普通账号，1:三方企业账号，2:三方个人账号
}

export interface MailApi extends Api {
  /**
   * 批量删除用户文件夹
   * @param ids 文件夹idlist
   */
  deleteUserFolder(ids: string[], _account?: string): Promise<boolean>;

  /**
   * 添加/编辑 邮件备注
   */
  updateMessageInfos(items: updateMessageInfosParams, _account?: string): Promise<boolean>;

  /**
   * 批量更新用户文件夹
   * @items 文件夹信息list
   */
  updateUserFolder(items: updateUserFolderParams[], _account?: string): Promise<boolean>;

  /**
   * 批量创建用户文件夹
   * @items  文件夹信息list
   */
  createUserFolder(items: createUserFolderParams[], config: createUserFolderParamsCondig, _account?: string): Promise<number[]>;

  /**
   * 列出所有邮箱文件夹，部分文件夹可能包含子文件夹
   * @param noCache 不使用缓存结果，强制刷新
   * @param updateStat 仅统计数据
   */

  /**
   * 同步文件夹信息到DB
   */

  syncMailFolder(account?: string): void;

  doListMailBox(noCache?: boolean, updateStat?: boolean, from?: string, _account?: string): Promise<MailBoxModel[]>;

  /**
   * 列出某个邮箱下的所有邮件
   * @param param 查询参数
   * @param noCache 不使用缓存结果，强制刷新
   */
  doListMailBoxEntities(param: queryMailBoxParam, noCache?: boolean): Promise<MailEntryModel[] | MailModelEntries>;

  /**
   * 批量请求邮件列表的阅读状态
   */
  checkReadStatusOfSentMail(result: MailEntryModel[] | MailModelEntries, param: queryMailBoxParam): any;

  /**
   * 刷新邮箱 seq 函数
   */
  refreshPageSequential(): Promise<any>;

  /**
   * 查询客户列表
   * @param param 查询参数
   * @param noCache 查询参数
   */
  // doListCustomers(param: CustomerListParams, noCache?: boolean): Promise<ListCustomerPageRes>;

  /**
   * 从DB查询客户列表
   * @param param 查询参数
   */
  // doListCustomersFromDb(param: CustomerListParams): Promise<ListCustomerPageRes>;

  // /**
  //  * 搜索客户列表
  //  * @param param 查询参数
  //  */
  // doSearchCustomers(param: SearchCustomerParams): Promise<ListCustomerPageRes>;

  /**
   * 更新客户邮件列表和未读数
   */
  doUpdateCustomersByNewMail(models: MailEntryModel[], type?: 'list' | 'mail' | 'unread'): Promise<void>;

  /**
   * 查询客户列表未读数
   * @param param 查询参数
   */
  doCustomersUnread(param: queryCusterUnreadParam): Promise<CustomerBoxUnread>;

  /**
   * 查询客户下的联系人
   * @param customerId 客户ID
   */
  // doListCustomerContactsById(customerId: string): Promise<EntityContact[]>;

  /**
   * 查询客户下的负责人
   * @param customerId 客户ID
   * @param excludeSelf 是否排除当前用户
   */
  // doListCustomerManagersById(customerId: string, excludeSelf?: boolean): Promise<SimpleContactModel[]>;

  /**
   * 列出某个邮箱下的所有聚合邮件
   * @param param 查询参数
   * @param noCache 不使用缓存结果，强制刷新
   */
  doListThreadMailBoxEntities(param: queryMailBoxParam, noCache?: boolean, _account?: string): Promise<MailModelEntries>;

  /**
   * 根据聚合邮件ID获取某一封聚合邮件
   *
   * @param threadId 获取聚合邮件的会话id
   */
  doGetThreadMailById(threadId: string, _account?: string): Promise<MailEntryModel | undefined>;

  /**
   * 获取邮件详情
   * @param ids 获取邮件的id
   * @param noFlagInfo 是否需要红旗，已读未读，所在文件夹等数据信息
   * @param noCache 不使用缓存结果，强制刷新
   * @param taskType 任务类型（主要区分是不是邮件推送触发的）
   * @param conf 配置项
   */
  doGetMailContent(
    ids: string,
    noFlagInfo?: boolean,
    noCache?: boolean,
    taskType?: UpdateMailCountTaskType,
    conf?: { noContactRace?: boolean; _account?: string; decrypted?: boolean }
  ): Promise<MailEntryModel>;

  /**
   * 插入加密内容
   * @param result 邮件model
   * @param id 邮件id
   */
  insertDecryptedContent(result: MailEntryModel, id: string): Promise<MailEntryModel>;

  /**
   * 获取加密邮件的解密内容
   * @param mid 获取邮件的id
   * @param encpwd 密码
   */
  doGetDecryptedContent(mid: string, encpwd: string): Promise<DecryptedContentResult>;

  /**
   * 清理加密邮件的解密结果的缓存
   */
  cleanDecryptedCached(): Promise<void>;

  /**
   * 已读回执
   */
  handleSendMDN(id: string, _account?: string): Promise<any>;

  /**
   * 更改邮件正文编码
   * @param mid 获取邮件的id
   * @param encoding 邮件编码
   * @param conf 配置项
   */
  doChangeMailEncoding(mid: string, encoding: MailEncodings, conf?: { _account?: string }): Promise<MailEntryModel>;

  /**
   * 获取第三方邮件详情
   * @param params
   * @param params.mid 邮件ID
   * @param params.owner 邮件所有者
   * @param noCache
   */
  doGetTpMailContent(params: TpMailContentParams, noCache?: boolean): Promise<MailEntryModel>;

  /**
   * 更新客户邮件未读数
   * @param model
   */
  // refreshCustomerUnread(model: MailEntryModel[]): Promise<void>;

  /**
   * 邮件讨论，邮件消息详情
   * @param emailMid 邮件的id
   * @param teamId 邮件讨论组的teamid
   */
  doGetMailContentIM(emailMid: string, teamId?: string): Promise<MailEntryModel>;

  /**
   * 获取聚合邮件详情
   * @param threadId 获取聚合邮件的会话id
   * @param params 其他查询参数
   * @param noCache 不使用缓存结果，强制刷新
   * @param threadMailIds
   */
  doGetThreadMailContent(
    threadId: string,
    params: queryThreadMailDetailParam,
    noCache?: boolean,
    threadMailIds?: string[],
    _account?: string
  ): Promise<MailEntryModel[] | MailModelEntries>;

  /**
   * 搜索邮件缓存情况
   * @param key  搜索关键词
   * @param param 查询参数，同 doSearchMail 中的 param
   * @param searchId 搜索ID，同 doSearchMail 中的 searchId
   * @param noData 为 true 时仅仅返回是否有缓存，否则返回具体的缓存信息
   */
  doGetSearchCacheInfo(key: string, param: queryMailBoxParam, searchId?: number, noData?: boolean): Promise<SearchCacheInfo | boolean>;

  /**
   * 删除邮件缓存
   * @param useBridge 使用跨窗口API
   */
  doClearSearchCache(_account?: string, useBridge?: boolean): Promise<void>;

  // ai 写信
  // getMailGPTWrite(req: AiWriteMailModel): Promise<AiWriteMailResModel>;

  // // ai 润色
  // getMailGPTPolish(req: AiWriteMailModel): Promise<AiWriteMailResModel>;

  // // ai 写信 润色 可使用次数
  // getMailGPTQuote(): Promise<GPTDayLeft>;

  // getMailGPTConfig(): Promise<any>;

  // getMailGPTHistory(req: GenerateReportReq): Promise<GenerateReportRes>;

  /**
   * 搜索邮件接口
   * @param key  搜索关键词
   * @param param 查询参数，与{@link doListMailBoxEntities}的查询参数相同
   * @param localSearch 是否使用本地搜索
   * @param searchId 搜索ID，同一次搜索切换红旗，文件夹等查询状态时，可以传回接口返回的searchId，用于查询缓存内容
   * @param useBridge 使用跨窗口API
   */
  doSearchMail(key: string, param: queryMailBoxParam, localSearch?: boolean, searchId?: number, useBridge?: boolean): Promise<MailSearchResult>;

  // doAdvanceSearchMail(search: MailSearchModel): Promise<MailEntryModel[]>;
  /**
   * 标注全部为已读或未读
   * @param mark 标注
   * @param fid 文件夹id
   * @param isThread 是否为聚合邮件
   */
  doMarkMailInfFolder(mark: boolean, fid: number, isThread?: boolean, _account?: string): Promise<CommonBatchResult>;

  /**
   * 联系人优先级变更历史邮件处理
   * @param email 联系人地址,一个联系人可能有多个地址
   * @param priority 修改后优先级 0=高 1=普通 2=低优 -1=撤销标记优先
   * @param op 引起变更的行为 "new"=首次标识未标记 "create"=新建联系人 "edit"=编辑,包括编辑陌生人/个人联系人/公共联系人 "remove"=删除联系人
   */
  doMarkMailPerferred(email: string[], priority: EmailListPriority, op: MailPerferedOpType, _account?: string): Promise<CommonBatchResult>;

  /**
   * 标记邮件接口 ，使用type字段区分标记红旗邮件
   * @param mark 是否标记
   * @param id 被标记的邮件的id，传入列表即为批量
   * @param type 确认操作类型，标记为已读未读，还是标记为红旗非红旗,设置/取消优先
   * @param isThread 是否为聚合邮件，仅当 mailModel.entry.threadMessageCount>1时传入 true
   * @param needCheckThread 混合模式下，不信任isThread参数，自行去数据库查询是否为聚合邮件
   */
  doMarkMail(
    mark: boolean,
    id: string[] | string,
    type: MailOperationType,
    isThread?: boolean,
    needCheckThread?: boolean,
    payload?: MarkPayload,
    _account?: string
  ): Promise<CommonBatchResult>;

  /**
   * 标记邮件接口 ，使用type字段区分标记红旗邮件
   * @param id 被标记的邮件的id，传入列表即为批量
   */
  recordMailRead(id: string[] | string, _account?: string): Promise<CommonBatchResult>;

  /**
   * 标记待办邮件
   * @param mid {string | string[]} 邮件ID
   * @param isDefer { boolean } 设为待办时为 true
   * @param conf { MailDeferParams } 配置参数
   * @param conf.deferTime { string } 待办时间 '2022-01-01 12:23:23
   * @param conf.deferNotice { MailDeferParams } 是否IM通知
   * @param markAll { boolean } 全部标记
   */
  doMarkMailDefer(mid: string | string[], isDefer: boolean, conf?: MailDeferParams, markAll?: boolean, _account?: string): Promise<CommonBatchResult>;

  /**
   * 标记全部邮件
   */
  doMarkMailDeferAll(deferTime?: string, _account?: string): Promise<CommonBatchResult>;

  /**
   * 标记某个星标联系人或者星标联系人组的全部邮件
   */
  doMarkStarMailAll(mailboxId: string): Promise<CommonBatchResult>;

  /**
   * 删除邮件
   * @param params
   */
  doDeleteMail(params?: DelMailParams): Promise<CommonBatchResult>;

  /**
   * 删除聚合邮件
   * @param id 被删除的邮件ID
   * @param fakeThreadIds 构造的聚合邮件ID
   */
  doDeleteThreadMail(id: string | string[], fakeThreadIds?: string[], _account?: string): Promise<CommonBatchResult>;

  /**
   * 移动邮件
   * @param id 要操作的邮件id，可传入多个
   * @param fid 要移动到的文件夹id
   * @param isThread 是否为聚合邮件，仅当 mailModel.entry.threadMessageCount>1时传入 true
   * @param needCheckThread 混合模式下，不信任isThread参数，自行去数据库查询是否为聚合邮件
   */
  doMoveMail(id: string | string[], fid: number, isThread?: boolean, needCheckThread?: boolean, _account?: string): Promise<CommonBatchResult>;

  /**
   * 移动聚合邮件
   * @param id 要操作的邮件id，可传入多个
   * @param fid 要移动到的文件夹id
   */
  doMoveThreadMail(id: string | string[], fid: number, fakeThreadIds?: string[], _account?: string): Promise<CommonBatchResult>;

  // 新建子action
  createSubActions(_account: string): { suc: boolean; msg?: string };

  // 获取action
  getActions(params: { _account?: string; actions: ActionStore; subActions?: SubActionsType }): { suc: boolean; account?: string; val: any | null; msg?: string };

  // 移除子action
  removeSubActions(_account: string): void;

  /**
   * 完全信任邮件
   * @param id 邮件id
   */
  doCompleteTrustMail(id: string | string[]): Promise<CommonBatchResult>;

  /**
   * 举报/信任邮件（不支持聚合邮件）
   * @param id 邮件id
   * @param fid
   * @param spamType 是否触发弹窗
   * @param isTread 是否触发弹窗
   * @param needCheckThread 混合模式下，不信任isThread参数，自行去数据库查询是否为聚合邮件
   */
  doReportOrTrustMail(id: string | string[], fid: number, spamType?: string, isTread?: boolean, needCheckThread?: boolean, _account?: string): Promise<CommonBatchResult>;

  /**
   * 回复邮件，
   * @param id 被回复的邮件id
   * @param all 是否回复全部
   * @param noPopup 是否触发弹窗
   * @param additionalContent 用户的录入数据，通常从快捷回复到写信窗口会出现
   * @param owner 邮件所属账号，下属邮件才有，其他为空
   */
  doReplayMail(id: string, all?: boolean, noPopup?: boolean, additionalContent?: string, _account?: string, owner?: string): Promise<WriteMailInitModelParams>;

  /**
   * 带附件回复邮件，不支持聚合邮件的带附件回复
   * @param id 被回复的邮件id
   * @param all 是否回复全部
   * @param noPopup 是否触发弹窗
   * @param additionalContent 用户的录入数据，通常从快捷回复到写信窗口会出现
   * @param _account 账号
   * @param owner 邮件所属账号，下属邮件才有，其他为空
   */
  doReplayMailWithAttach(id: string, all?: boolean, noPopup?: boolean, additionalContent?: string, _account?: string, owner?: string): WriteMailInitModelParams;

  /**
   * 转发邮件
   * @param id 被转发的邮件id
   * @param noPopup 是否触发弹窗
   * @param additionalContent 用户的录入数据，通常从快捷回复到写信窗口会出现
   * @param owner 邮件所属账号，下属邮件才有，其他为空
   */
  doForwardMail(id: string, payload?: { noPopup?: boolean; additionalContent?: string; _account?: string; owner?: string }): Promise<WriteMailInitModelParams>;

  /**
   * 作为邮件转发
   * @param id 被转发的邮件id
   * @param asAttach 是否作为邮件转发
   * @param noPopup 是否触发弹窗
   * @param additionalContent 用户的录入数据，通常从快捷回复到写信窗口会出现
   * @param owner 邮件所属账号，下属邮件才有，其他为空
   */
  doForwardMailAsAttach(
    id: string,
    payload?: { asAttach?: boolean; asAttachIds?: string[]; noPopup?: boolean; additionalContent?: string; _account?: string; owner?: string; title?: string }
  ): Promise<WriteMailInitModelParams>;

  /**
   * 编辑邮件
   * @param id 被编辑的邮件id
   * @param draft 是否为草稿
   * @param noPopup 是否触发弹窗
   */
  doEditMail(id: string, payload?: DoWriteMailPayload): Promise<WriteMailInitModelParams>;

  /**
   * 是否需要暂存草稿
   * @param content 要暂存的邮件的内容
   */
  doNeedSaveTemp(content: MailEntryModel): Promise<boolean>;

  /**
   * 邮件存草稿
   * @param content 邮件内容
   * @param saveDraft 是否保存草稿
   * @param auto 是否为自动保存
   */
  doSaveTemp(params: DoSaveTempParams): Promise<MailEntryModel>;

  /**
   * 获取最新的草稿id
   * @param content 邮件内容
   */
  doGetLatestedDraftId(params: { content: MailEntryModel; oldCid: string }): Promise<string>;

  /**
   * 邮件本地草稿
   * @param content 邮件内容
   */
  doSaveDraftLocal(content: MailEntryModel): Promise<void>;

  /**
   * 获取写信在DB中存储内容
   */
  doGetContentFromDB(cid: string, _account?: string): Promise<MailEntryModel>;

  doGetMailFromDB(cid: string, _account?: string): Promise<MailEntryModel>;

  doSaveAttachmentToDB(params: ReqDoSaveAttachmentToDB): Promise<boolean>;

  /**
   * 保存写信内容到DB中
   */
  doSaveContentToDB(item: MailEntryModel): Promise<boolean>;

  /**
   * 批量重传附件
   */
  doTransferAtts(item: ReUploadInfo): Promise<RespDoTransferAtts>;

  /**
   * 发送邮件
   * @param content 邮件内容
   */
  doSendMail(content: MailEntryModel): Promise<MailEntryModel>;

  /**
   * 取消邮件
   */
  doCancelDeliver(content: DoCancelDeliverParams): Promise<any>;

  /**
   * 立即发信
   */
  doImmediateDeliver(content: DoImmediateDeliverParams): Promise<any>;

  /**
   * 附件重传前重新生成邮件
   */
  doReSendInitMail(cid: string, resendAccount?: string, withCloudAtt?: boolean, latestedCont?: string): Promise<MailEntryModel>;

  // 获取不需要重传的附件id
  doGetExcludeAttIds(cid: string, latestedCont: string): Promise<string[]>;

  /**
   * 上传附件
   */
  doUploadAttachment(params: DoUploadAttachmentParams): Promise<MailFileAttachModel>;

  buildUploadedAttachmentDownloadUrl(
    content: MailEntryModel,
    attachId: number,
    cloudAdditional?: ResponseMailUploadCloud,
    _session?: string,
    agentNode?: string | null
  ): string;

  /**
   * 获取分片上传参数
   */
  buildAttachmentSliceUploader(
    uploader: LoaderActionConf | undefined,
    item: MailFileAttachModel,
    cloudUploaderCommonArgs: CloudUploaderCommonArgs,
    qrs: ResponseMailUploadCloudToken
  ): UploadPieceHandler;

  /**
   * 删除附件
   */
  doDeleteAttachment(params: { cid: string; attachId: number; _account?: string }): Promise<DeleteAttachmentRes>;

  /**
   * 撤回邮件
   * @param mid
   */
  doWithdrawMail(mid: string, tid?: string, _account?: string): Promise<MailDeliverStatus>;

  /**
   * 查询阅读状态
   * @param mid
   */
  doCheckReadStatus(mid: string, _account?: string): Promise<MailDeliverStatus>;

  /**
   * 查询阅读状态
   * @param mid
   */
  doGetMailReadCount(params: ReqMailReadCount): Promise<any>;

  /**
   * 查询阅读状态
   * @param mid
   */
  doGetMailReadDetail(params: ReqMailReadDetail): Promise<any>;

  /**
   * 查询详情页点赞信息
   * @param mid
   */
  getThumbUpInfo(mid: string, tid?: string, page?: number, _account?: string): Promise<MailEmoticonInfoModel>;

  /**
   * 点赞/取消点赞
   * @param mid
   */
  setThumbUpCreate(params: EmoticonCreateModel): Promise<MailEmoticonInfoModel>;

  // 获取邮箱快捷设置配置
  getMailConfig(): Promise<MailConfigQuickSettingModel>;

  // 设置邮箱快捷设置配置
  setMailConfig(params: MailConfigQuickSettingModel): Promise<boolean>;

  // 获取默认抄送密送人
  getDefaultCCBCC(): Promise<MailConfigDefaultCCBCCModel>;

  // 设置默认抄送密送人
  setDefaultCCBCC(params: MailConfigDefaultCCBCCModel): Promise<boolean>;

  // 邮件收信插队
  triggerReceive(params: { folderId: number; _account?: string }): Promise<boolean>;

  /**
   * 调用写信功能
   */
  doWriteMailToContact(contact?: string[], _account?: string): WriteMailInitModelParams;

  /**
   * mailto:调用写信功能
   */
  doWriteMailFromLink(contact: string[], title: string, originContent: string, _account?: string): WriteMailInitModelParams;

  /**
   * 写信给外贸通客服
   */
  doWriteMailToWaimaoServer(): Promise<void>;

  /**
   * 写信给外贸通客服
   */
  doWriteMailToWaimaoServer(): Promise<void>;

  /**
   * 写信给客服
   */
  doWriteMailToServer(): Promise<void>;

  /**
   * 构造联系人信息
   * @param item
   */
  buildRawContactItem(item?: ParsedContact): MailBoxEntryContactInfoModel;

  /**
   * 构造空白model
   * @param param
   */
  buildEmptyMailEntryModel(param: WriteMailInitModelParams, noStore?: boolean): MailEntryModel;

  // 构建云附件邮件需要的model, 直接使用initModel方法即可，此方法废弃
  // @Deprecated
  buildCloudAttMailEntryModel(param: WriteMailInitModelParams): Promise<MailEntryModel>;

  /**
   * 初始化写信model
   */
  initModel(param: WriteMailInitModelParams): Promise<MailEntryModel>;

  // 邮件分发
  requestDelivery(id: string, bcc: string[], _account: string): Promise<boolean>;
  /**
   * 生成一个MailEntryModel
   */
  doBuildEmptyMailEntryModel(param: WriteMailInitModelParams): MailEntryModel;

  /**
   * 使用email构建写信需使用的contact model
   * @param id
   * @param type
   */
  getContractItemByEmail(id: string[], type: MemberType): Promise<MailBoxEntryContactInfoModel[]>;

  // /**
  //  * 获取用户签名，废弃，initModel将直接附带签名数据
  //  */
  // getUserSignature(): Promise<ResponseSignature>;
  /**
   * 取消写信，清理服务器资源
   * @param cid  取消写信的 clientId , 对应{@link MailEntryModel._id}
   * @param deleteDraft 是否同时删除草稿，默认false
   */
  doCancelCompose(cid: string, deleteDraft?: boolean, _account?: string): Promise<string>;

  /**
   * 获取所有正在编辑信件id
   */
  doGetAllComposingMailId(): number[];

  /**
   * 更新邮件的数据统计
   */
  doUpdateMailBoxStat(taskType?: UpdateMailCountTaskType): void;

  /**
   * 临时接口，写信的electron弹窗加载完毕后调用此接口
   */
  electronLoaded(): void;

  /**
   * 调起写信弹窗的入口函数
   * @param params
   */
  callWriteLetterFunc(params: WriteMailInitModelParams): WriteMailInitModelParams;

  doSaveMailLocal(content: MailEntryModel): void;

  doGetMailByReplyMId(mid: string): Promise<MailEntryModel>;

  doLoadMailInitParamLocal(mid: string): WriteMailInitModelParams | undefined;

  doSaveMailInitParamLocal(content: WriteMailInitModelParams): void;

  /**
   * 写信签名切换
   * @param signHtml
   */
  doTransferSign(signHtml: string): string;

  /**
   * 快速回复
   * @param content
   */
  doFastSend(content: WriteMailInitModelParams): Promise<MailEntryModel>;

  /**
   * 点赞回复第三方邮件
   * @param id
   * @param all
   * @param noPopup
   * @param additionalContent
   */
  replyExternalThumbMail(id: string, all?: boolean, noPopup?: boolean, additionalContent?: string, _account?: string): Promise<MailEntryModel>;

  /**
   * 获取要回信的邮件详情，包含联系人，内容等信息
   * @param content
   */
  doGetReplayContentModel(content: WriteMailInitModelParams): Promise<MailEntryModel>;

  doGetGroupMailStatus(id: string, noCache?: boolean): Promise<MailEntryModel>;

  addNewContact(receiver?: MailBoxEntryContactInfoModel[]): void;

  /**
   * 查询往来邮件
   * @param param
   * @param noCache
   */
  getRelatedMail(param: queryMailBoxParam, noCache: boolean | undefined): Promise<MailModelEntries>;

  /**
   * 获取邮件附件预览链接
   * @param params
   */
  getFilePreviewUrl(params: GetFilePreviewUrlParams): Promise<any>;

  // /**
  //  * 查询别名邮件
  //  */
  // getMailAliasAccountListV2(noMain?: boolean): Promise<MailAliasAccountModel[]>;

  /**
   * 给邮件打标签
   * @param params
   * @param isThread
   * @param needCheckThread 混合模式下，不信任isThread参数，自行去数据库查询是否为聚合邮件
   */
  updateMessageTags(params: RequestMailTagRequest, isThread?: boolean, needCheckThread?: boolean, _account?: string): Promise<CommonBatchResult | ''>;

  /**
   * 标签操作后，更新本地邮件
   * @param newTag
   * @param type
   */
  refreshDbMailsByTag(newTag: NewTagOpItem[], type: TagManageOps, _account?: string): Promise<void>;

  /**
   * 邮件高级搜索
   * @param search
   * @param noCache
   */
  doAdvanceSearchMail(search: MailSearchModel, noCache?: boolean, _account?: string): Promise<MailSearchResult>;

  /**
   * 从数据库中获取邮件内容
   * @param ids 邮件id
   */
  getMailContentInDb(ids: string, noContactRace?: boolean, _account?: string): Promise<MailEntryModel | undefined>;

  /**
   * 从数据库中获取mail_content表中获取数据
   * @param ids 邮件id
   */
  getMailContentTableInDb(ids: string): Promise<any>;

  /**
   * 翻译邮件
   * @param content
   * @param form
   * @param to
   */
  getTranslateContent(content: string, form: string, to: string, _account?: string): Promise<TranslatResModel>;

  /**
   * 检测原始邮件语言
   * @param content 邮件内容
   */
  detectMailContentLang(mid: string, content: string): Promise<MailContentLangResModel | null>;

  /**
   * 英文语法纠错
   * @param content
   * @param form
   * @param to
   */
  getEnglishGrammar(content: string, _account?: string): Promise<GrammarResponse | null>;

  /**
   * 翻译邮件
   * @param mid
   * @param langType
   * @param conditions
   * conditions 根据是否传入，更改map中的值
   */
  syncTranslateContentToDb(mid: string, langType: string, conditions?: string, _account?: string): Promise<boolean>;

  /**
   * 存原文的语言
   * @param mid 邮件id
   * @param originLang 原文语言
   * @param _account
   */
  syncContentLangToDb(mid: string, originLang: string, _account?: string): Promise<boolean>;

  /**
   * 获取最后一次更新邮件的时间
   * @param key 邮件更新类型
   */
  getLastMailSyncTime(key: string, _account?: string): Promise<number>;

  /**
   * 设置最新更新邮件的时间
   * @param key 邮件更新类型
   */
  setLastMailSyncTime(key: string, action?: ActionStore, _account?: string): number;

  /**
   * 触发同步所有邮件
   * @param total
   * @param start
   * @param useBridge 使用跨窗口API
   */
  syncAllMails(total?: number, start?: number, _account?: string): Promise<void>;

  /**
   * 从数据库中加载邮件列表
   * @param param
   */
  doListMailEntitiesFromDb(param: queryMailBoxParam, _account?: string): Promise<MailModelEntries | undefined>;

  /**
   * 从数据库中加载聚合邮件详情
   * @param threadId 聚合邮件ID
   * @param params 查询非参数
   */
  doGetThreadMailContentFromDb(threadId: string, params?: queryThreadMailDetailParam, _account?: string): Promise<MailEntryModel[]>;

  /**
   * 邮件本地搜索
   * @param key
   * @param param
   * @param searchId
   */
  doLocalSearchMail(key: string, param: queryMailBoxParam, searchId?: number): Promise<MailSearchResult>;

  doAbortAttachment(id: string): DoAbortAttachmentRes;

  doAddAttachment(cid: string, attach: MailFileAttachModel[], flag?: UploadAttachmentFlag, _acount?: string): Promise<MailFileAttachModel[]>;

  doExportMail(id: string | string[], fileName: string, dialogConfirmText?: string, _acount?: string): Promise<LoaderResult | FsSaveRes>;

  doExportMailAsEml(id: string, fileName: string, _account?: string): Promise<LoaderResult | FsSaveRes>;

  doExportThreadMailAsZip(threadId: string | string[], fileName: string, _account?: string): Promise<LoaderResult | FsSaveRes>;

  doGetMailTypeById(id: string): Promise<MailTypes>;

  doGetMailTypeByIds(ids: string[]): Promise<MailTypesGroup>;

  doSaveMailSearchRecord(content: MailSearchRecordPayload | MailSearchRecordPayload[], _account?: string): Promise<void>;

  doGetMailSearchRecords(count?: number, _account?: string): Promise<MailSearchRecord[]>;

  doDeleteMailSearchRecord(id: string | string[], isDel?: boolean, _account?: string): Promise<void>;

  generateRndId(): number;

  /**
   * 获取勋章列表
   */
  doGetPraiseMedals(): Promise<MedalInfo[]>;

  // 扫描本地邮件放入陌生人
  scanMailsSetStrangers(): Promise<void>;

  // 获取所有陌生人
  doGetAllStrangers(): Promise<StrangerModel[]>;

  // 收到新邮件放入陌生人
  newMailIntoStrangers(newComer: MailEntryModel | MailEntryModel[]): Promise<void>;

  newUsersIntoEmailList(users: newUsersIntoEmailListParam[], occasion?: string): Promise<boolean>;

  // // 获取邮件列表接口
  // doGetTaskMailList(param: queryMailBoxParam): Promise<TaskInternalMap>;
  // 获取邮件列表接口 ==临时
  doGetFullTaskMailList(param: queryMailBoxParam): Promise<TaskInternalMap>;

  // doCheckDeliverStatus(cid: string):Promise<ResponseData<ResponseDeliverStatus>>;

  // // 处理邮件列表接口第一次
  // handleMailModel(mailModel: MailModelEntries, maps:TaskInternalMap) : Promise<MailEntryModel[]>

  // 获取最新的3个陌生人
  doGetRecent3Strangers(): Promise<Recent3StrangersRes>;

  // getMailEntryByIds(param: queryMailBoxParam, noCache: boolean | undefined): Promise<MailEntryModel[] | MailModelEntries>;

  // 获取邮件默认下载地址
  mkDownloadDir(type: 'inline' | 'regular', config: { fid: number; mid: string; _account?: string }, fallbackToDefault?: boolean): Promise<string>;

  // 获取往来附件
  listAttachments(params: listAttachmentsParam): Promise<ResponseListAttachments>;

  assembleMail(data: MailItemRes): Promise<MailEntryModel>;

  // 解析本地 eml 邮件
  doParseEml(filePath: string, encoding?: string): Promise<MailEntryModel | null>;

  // 在数据库中查找 eml 邮件内容
  doGetParsedEmlFromDb(cid: string): Promise<MailEntryModel>;

  // 导入邮件
  doUploadMail(cid: string, fid: number): Promise<UploadMailResult>;

  doCallMailMsgCenter(params: MailMsgCenterParams): void;

  mailOperationEmailListChange(ev: SystemEvent<unknown>): Promise<void>;

  /**
   * 按邮件文件夹批量标记已读
   * @param fids 邮件文件夹列表
   */
  doMarkMailFolderRead(fids: number[], isThread: boolean): Promise<CommonBatchResult>;

  /**
   * 排序文件夹
   * @param list 原始数据
   * @param param queryMailBoxParam
   */
  orderByMailList(list: MailEntryModel[], param: queryMailBoxParam): MailEntryModel[] | { total: number; data: MailEntryModel[] };

  // 邮件分发详情
  getMailDeliveryDetail(mid: string, _account?: string): Promise<DeliveryDetail>;
  /**
   * 批量导入邮件，不需要解析直接上传
   * @param conf MailUploadParams
   */
  doImportMails(conf: MailUploadParams, useDragImport?: boolean): Promise<ImportMailsResult[]>;

  // 星标联系人列表（文件夹中）
  doListStarContact(_account?: string): Promise<ListStarContactRes>;

  handleEmailListStringToParsedContent(listStr: string, ret: ContactProcessingItem): ContactProcessingItem;

  getMailReadList(tid: string, _account?: string): Promise<IMailReadListRes>;

  getMailHeaders(mid: string, _account?: string): Promise<string>;

  getIsSendAttachmentWritePage(): boolean;

  getStoreFilesByKey(key: string): Promise<Array<string>>;

  setMailCachePath(path: string): Promise<{ success: boolean; errorMsg?: string }>;

  getMailCachePath(): Promise<string>;

  selectMailCacheDirPath(): Promise<{ success: boolean; path?: string; errorMsg?: string }>;

  doGetFoldersForPushConfig(_account?: string): Promise<{ success: boolean; errorMsg?: string; data?: Array<MailBoxModel> }>;

  doGetAllAccountsFoldersForConfig(): Promise<{ success: boolean; errorMsg?: string; data?: Array<ISubAccountMailFoldersConfigItem> }>;

  getPushConfig(type?: number, _account?: string): Promise<IPushConfigGetRes>;

  setPushConfig(config: IPushConfigSetRequest, _account?: string): Promise<IPushConfigSetRes>;

  doGetAllAccountsPushConfig(): Promise<{ success: boolean; data?: Array<IMailPushConfigItem>; errorMsg?: string }>;

  cleanPushConfig(_account?: string): Promise<void>;

  getAuthCodeDesc(): Promise<AuthCodeDesc[]>;

  // 通过邮箱获取邮箱配置
  guessUserSetting(account: string): Promise<GuessUserSettingModel | null>;

  // 解析接口返回的原始邮件内容,生成MailEntryModel
  handleRawMailContent(id: string, rawContent: ResponseMailContentEntry): Promise<MailEntryModel>;

  /**
   * 邮件询盘邮件详情
   * @param handoverEmailId 邮件的询盘转交id
   */
  doGetMailContentInquiry(handoverEmailId: string): Promise<MailEntryModel>;

  updateDisplayEmail(params: { bindEmail: string; bindUserName: string }): Promise<AuthCodeDesc[]>;

  getDisplayName(emailList: string[]): Promise<AuthCodeDesc[]>;
}

export interface ISubAccountMailFoldersConfigItem {
  email: string;
  folders: Array<MailBoxModel>;
}

export interface IMailPushConfigItem {
  email: string;
  data: IPushConfigSetRequest;
}

export interface IMailReadListItem {
  toAddr: string;
  toName: string;
  sendTime: string;
  readTime: string;
  inner: boolean;
  clientIp: string;
  location: string;
  localReadTime: string;
}

export interface IMailReadListRes {
  success: boolean;
  errorMsg?: string;
  data?: Array<IMailReadListItem>;
}

export interface StarAddressContactItem {
  contactsBelong: Set<string>;
}

// { email1: { contactsBelong: Set<contact1> }, email2: { contactsBelong: Set<contact1> }}
export type StarAddressContactMap = Record<string, StarAddressContactItem>;

export interface ListStarContactRes {
  starList: MailBoxModel[];
  addressContactMap: StarAddressContactMap;
}

export interface AuthCodeDesc {
  desc: string;
  url: string;
}

export interface GuessUserSettingModel {
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  receiveSsl: boolean; // 1 | 0
  sendSsl: boolean; // 1 | 0
  domainType: AccountTypes;
}

export interface StarMailUnreadParams {
  addresses: string[]; // 需要返回统计的地址
  returnAll: boolean; // 是否需要返回总计数据 true=需要 false=不需要
  addressType: 1 | 2; // 1 = 外贸客户管理 2 = 星标联系人
}

export type MailTypes = 'thread' | 'normal';

// "new"=首次标识未标记 "create"=新建联系人 "edit"=编辑,包括编辑陌生人/个人联系人/公共联系人 "remove"=删除联系人
export type MailPerferedOpType = 'new' | 'create' | 'edit' | 'remove';

export type MailTypesGroup = Record<MailTypes, string[]>;

// 通讯录的陌生人 数据来源是邮件
export interface StrangerOfContactModel {
  accountName: string;
  priority: EmailListPriority | null;
  contactName: string;
  mailIds: string[];
  sendTime: number;

  [param: string]: unknown;
}

export type MailTag = [
  string,
  {
    color: number;
    show?: 0 | 1;
    // corp新增
    alias?: string;
    isShow?: 0 | 1;
    name?: string;
    tagId?: string;
  },
  number,
  number,
  number,
  number,
  number,
  number
];
// {
//   name: string;
//   color: number;
//   show: 0 | 1;
//   messageCount: number;
//   messageSize?: number;
//   threadCount?: number;
//   unreadMessageCount: number;
//   unreadMessageSize?: number;
//   unreadThreadCount?: number;
// }
// tag 颜色值到样式类名的映射,样式类强制覆盖ant组件中部分样式,需要明确的颜色值。如果tag的颜色增加了，类名对应也需要做增加
export const reDefinedColorList = [
  {
    color: '#6BA9FF',
    nums: [3, 8],
    className: 'color1',
  },
  {
    color: '#70CCAB',
    nums: [15, 16, 1, 10],
    className: 'color2',
  },
  {
    color: '#AA90F4',
    nums: [9, 12],
    className: 'color3',
  },
  {
    color: '#F7A87C',
    nums: [16, 7, 11, 2],
    className: 'color4',
  },
  {
    color: '#F77C7C',
    nums: [17, 5, 4, 0],
    className: 'color5',
  },
  {
    color: '#A8AAAD',
    nums: [19, 18, 14, 13],
    className: 'color6',
  },
];
// 新版标签值，还只修改一部分业务组件，所以老值保留
export const reDefinedColorListNew = [
  {
    color: '#DEEBFD',
    nums: [3, 8],
    fontColor: '#4759B2',
    className: 'color1',
  },
  {
    color: '#D6F7F1',
    nums: [15, 16, 1, 10],
    fontColor: '#398E80',
    className: 'color2',
  },
  {
    color: '#EDE4FF',
    nums: [9, 12],
    fontColor: '#7A51CB',
    className: 'color3',
  },
  {
    color: '#FFF3E2',
    nums: [16, 7, 11, 2],
    fontColor: '#CC913D',
    className: 'color4',
  },
  {
    color: '#FFE5E2',
    nums: [17, 5, 4, 0],
    fontColor: '#CB493D',
    className: 'color5',
  },
  {
    color: '#E7EBF1',
    nums: [19, 18, 14, 13],
    fontColor: '#4E5A70',
    className: 'color6',
  },
];
export type searchableFields = 'subject' | 'to' | 'from' | 'sentDate' | 'flags' | 'label0' | 'receiveDate' | 'fromAddress' | 'priority' | 'size';
export type searchableOperator = '=' | '!=' | 'contains' | 'startsWith' | 'endsWith' | 'in_range' | 'excludes' | '>' | '<' | '>=' | '<=';

export interface SearchCacheInfo {
  hasCache: boolean;
  srId: number;
  reqKey: string;
  searchMidsCacheElement: StringTypedMap<string[]>;
  savedFolderRes: MailBoxModel[];
  mailStat: MailStatResult;
}

export type ResponseMailUploadCloudToken = {
  bucketName: string;
  context: string;
  fileId: number;
  new: boolean;
  nosKey: string;
  token: string;
};
export type RequestMailTagRequest = {
  ids: string[];
  set: string[];
  add: string[];
  delete: string[];
};
export type TopTaskModel = {
  todoId: number;
  mid?: string;
  model?: MailEntryModel;
  pos: number;
};

export type DecryptedMailsCacheMap = Map<string, DecryptedMailsCache>;

export interface DecryptedMailData {
  content: MailContentModel;
  attachments: MailFileAttachModel[];
}

export interface DecryptedMailsCache {
  encpwd: string;
  data: DecryptedMailData;
}

export interface TaskInternalMap {
  /**
   *  mid -> todoId , 信件id到任务id的映射
   */
  mailIdMap: Map<string, string>;
  /**
   * 拿到的tasks数据
   */
  taskMap: Map<number, TaskMailModel>;
  // taskList: any;
  /**
   * 置顶两个task模型
   */
  twoTaskIds: Map<string, TopTaskModel>;
  hasMore: number;
  // mIdToTidMap: Map<string, string>;
}

export interface FileTask {
  taskType?: FileDownloadTaskType;
  file: MailFileAttachModel;
  mailInfo: { fid: number; mid: string; part: string };
}

export type FileDownloadTaskType = 'pushTask' | 'defaultTask';

export interface FileDownloadConf {
  taskIds: string[];
  taskMap: Map<string, FileTask>;
  runningTaskId: string;
  fileDownloadDir: Record<string, FileDownloadDir>;
  taskEnable: boolean;
}

export interface FileDownloadDir {
  inline: Record<string, Record<string, string>>;
  regular: Record<string, Record<string, string>>;
}

export interface MailAttrConf {
  id: string; // 星标联系人场景下是联系人 ID，或者联系人组 ID
  emailList: string[];
  attrValue: string;
  attrType: MailAttrType;
}

export interface AccountTokensType {
  account: string;
  token: string;
  updateDate: number;
}

export interface DeliveryDetail {
  distributeCount: number;
  distributeList: {
    distributeTime: number;
    distributeMember: {
      email: string;
      contactName?: string;
    }[];
  }[];
}

export interface MarkStarMailTask {
  id: string | number;
  task: () => Promise<any>;
}

export interface MarkStarMailQueue {
  queue: MarkStarMailTask[];
  runningId: string | number;
}

export interface RequestSequentialParams {
  func: keyof MethodMap;
  var?: any;
}

export interface EdmRelatedPageParams {
  // 用来区分多账号，不传则使用主账号，建议传
  _account?: string;
  // 客户id
  customerId: string;
  // 客户联系人email
  selectedEmail: string;
  isSelf: boolean;
}
