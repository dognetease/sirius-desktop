import { CookieStore } from 'env_def';
import { ErrMsgType } from '../errMap';
import { ContactTeamMember } from '@/api/logical/contactAndOrg';
import { AccountInfoTable, AccountTable, SubAccountTableModel } from '@/api/data/tables/account';
import { CustomerOrgModel } from '@/api/logical/contact_edm';

export type ApiLifeCycleApi = Omit<keyof Api, 'name'>;

export interface ApiLifeCycleEvent {
  event: ApiLifeCycleApi;
  curPath?: Location;
  prePath?: Location;
  user?: User;
  evData?: Event;
  data?: any;
  ignorePath?: boolean;
}

/**
 * api的基类,
 * api引入时机早于页面加载
 */
export interface Api {
  __isProxy?: string;
  /**
   * api 名称，api的唯一标识，@link{ apis } 中定义
   */
  name: string;
  /**
   * 初始化函数，调用时机，api被引入时就会调用
   */
  init: () => string;
  /**
   * 后置初始化函数，调用时机，待所有api init调用完毕后调用
   */
  afterInit?: (ev?: ApiLifeCycleEvent) => string;

  /**
   * 待页面加载完毕后调用
   */
  afterLoadFinish?: (ev?: ApiLifeCycleEvent) => string;
  /**
   * 登录后的事件回调
   * @param user 当前登录用户
   */
  afterLogin?: (ev?: ApiLifeCycleEvent) => string;
  /**
   * 登出前的事件回调
   */
  beforeLogout?: (ev?: ApiLifeCycleEvent) => string;
  /**
   * 整个窗口重新获得焦点事件
   */
  onFocus?: (ev?: ApiLifeCycleEvent) => string;
  /**
   * 整个窗口失去焦点事件
   */
  onBlur?: (ev?: ApiLifeCycleEvent) => string;
  /**
   * 路径变化事件
   * @param ev.prePath 原路径
   * @param ev.curPath 新路径
   */
  onPathChange?: (ev?: ApiLifeCycleEvent) => string;
}

export const KEY_API_LOADED_TIMESTAMP = 'keyApiLoadedTimestamp';

export type intBool = 0 | 1;

export type anonymousFunction<T = void, P = any> = (params?: P) => T;

export type stringOrNumber = string | number;

/**
 * k -v 结构存储
 */
export interface Properties {
  [key: string]: string | string[];
}

/**
 * 反馈类型：弹窗、简单消息、组件内提示、无提示、自定义处理、展示推送通知
 */
export type PopUpType = 'window' | 'toast' | 'inline' | 'ignore' | 'customer' | 'notification' | 'loading' | 'finish';
/**
 * 通知的业务类型
 */
export type NotificationType = 'mail' | 'im' | 'sys' | 'whatsApp' | 'facebook';

export type EventLevel = 'warn' | 'error' | 'info' | 'debug' | 'confirm';

/**
 * 错误弹窗数据结构/推送数据结构
 */
export interface PopUpMessageInfo<T = any> {
  /**
   * 通知的条目数量
   */
  num?: number;
  /**
   * 接受事件后的处理方式
   */
  popupType?: PopUpType;
  /**
   * 事件等级，用于定义弹窗的
   */
  popupLevel?: EventLevel;
  /**
   * 推送使用，定义聚合标签
   */
  tag?: NotificationType;
  /**
   * 推送使用，定义图标
   */
  icon?: string;
  /**
   * 标题
   */
  title: string;
  /**
   * 内容
   */
  content?: string;
  /**
   * 程序预定义的编码
   */
  code: string;
  /**
   * 额外的显示确认checkbox
   */
  hasShowCheckBox?: boolean;
  /**
   * checkbox的文案
   */
  checkBoxLabel?: string;
  /**
   * 确认按钮文本
   */
  btnConfirmTxt?: string;
  /**
   * 取消按钮文本
   */
  btnCancelTxt?: string;
  /**
   * 确认回调，推送时为click事件回调
   */
  confirmCallback?: (ev: any) => void;
  /**
   * 取消回调，推送时为关闭事件回调
   */
  cancelCallback?: (ev: any) => void;
  /**
   * 额外数据
   */
  data?: T;
  /**
   * 强制弹出
   */
  forcePopup?: boolean;
  success?: boolean;
  duration?: number;
  /**
   * "code": "FA_OVERFLOW" 的补充code
   */
  overflowReason?: string;
}

// export default function ApiFactory():()=>Api{
//     let impl=ApiFactory.getImpl();
//     return ()=>new ApiBridge(impl);
// }
// ApiFactory.prototype={
//     realImpl:undefined,
//     register:function (realImpl:Api):void{
//         this.realImpl=realImpl;
//     },
//     getImpl:function ():Api{
//         return this.realImpl;
//     }
// }
// export default class ApiFactory{
//     create(impl:string):Api{
//         Api i=require(impl);
//         return new ApiBridge(i);
//     }
// }let
/**
 * 通用返回
 */
export type commonMessageReturn = '' | ErrMsgType | PopUpMessageInfo | string; // 成功 | 错误码
export type DataCachedType = 'localStorage' | 'appStorage' | 'dbStorage' | 'noCache';

/**
 * 通用批量处理结果返回
 */
export interface CommonBatchResult {
  succ: boolean;
  partlySucc?: boolean;
  failedId?: string[];
  succeedCount?: number;
  failedCount?: number;
  data?: resultObject;
  failReason?: Error;
}

export interface resultObject {
  [props: string]: any;
}

export type identityObject<T = resultObject> = {
  [props: string]: T;
};

export interface CatchErrorRes<T = any> {
  success: boolean;
  error?: any;
  data?: T;
}

/**
 * 当前登录用户的数据结构
 */
export interface User {
  /**
   * 用户的域名
   */
  domain: string;
  /**
   * 用户的展示姓名
   */
  nickName: string;
  /**
   * 用户账户名，id中包含
   */
  accountName: string;
  /**
   * 用户的sessionId ， 部分网络请求需要使用的sid
   */
  sessionId: string;
  /**
   * 用户的唯一标识
   */
  id: string;
  /**
   * 别名id
   */
  bmId?: string;
  /**
   * 用户头像
   */
  avatar: string;
  /**
   * 用户手机号
   */
  mobile?: string;
  /**
   * 手机号登录用来 重登的token
   */
  refreshToken?: string;
  /**
   * 手机号登录用来 重登的token过期时间
   */
  refreshTokenExpire?: number;
  /*
   * 服务端返回的id
   * */
  originId?: string;
  /**
   * d当前登录的账号
   */
  loginAccount?: string;
  /**
   * 最后登录时间
   */
  lastLoginTime: number;
  /**
   * 账户md5，用于作为前缀后缀区分用户数据
   */
  accountMd5: string;
  /**
   * 公司信息
   */
  company: string;
  /**
   * 其他附加属性
   */
  prop?: Properties;
  /**
   * 用户联系人属性
   */
  contact?: ContactModel;
  /**
   * 用户登录成功后的cookies，仅Electron环境有
   */
  cookies?: CookieStore[];
  /**
   * 用户认证用cookie
   */
  cnName?: string;

  /**
   * 主账号，只用于子账号
   */
  mainAccount?: string;

  isSharedAccount?: boolean;

  /**
   * 用户节点
   */
  node?: string;

  originAccount?: {
    email: string;
    nickName: string;
    avatar: string;
  };

  isSubAccount?: boolean;

  isThirdAccount?: boolean;

  agentEmail?: string;

  mainAccountEmail?: string;

  unread?: boolean;
}

export type PageInitData = {
  hashPageName: string;
  idPart: string;
};

export type ContactInfoType = 'EMAIL' | 'TEL' | 'MOBILE' | 'FAX' | 'OTHER' | 'WX' | 'QQ' | 'yunxin' | 'whatsApp';
// export interface EntityCommonItemTag extends Entity{
//     // id:number;
//     tagVal:string;
//     itemId:number;
//     itemType: ItemType;
// }
export type KeyOfEntityContactItem = keyof EntityContactItem;
export type KeyOfEntityContact = keyof EntityContact;
export type contactType = keyof (EntityContact & EntityContactItem & EntityOrg & EntityOrgContact);

/**
 * 扩展KV的配置
 */
export type ItemType = 'ContactItem' | 'Contact' | 'Org';

/**
 * 通用数据库表，主要实体的扩展 k-v 表
 */
export interface EntityAttachedInfo extends Entity {
  // id:number;
  infoKey: string;
  infoVal: string;
  itemId: number;
  itemType: ItemType;
}

/**
 * 数据库实体基类
 */
export interface Entity {
  /**
   * 各个表的id
   */
  id: string;
  // 数据来源 core-精简数据 full完整数据
  source?: 'core' | 'full';
  /**
   * 各个表的附加K-V值
   */

  additionalInfo?: EntityAttachedInfo[] | undefined;
  enterpriseId?: number;
}

export interface EntityContact extends Entity {
  // id: string;(accountId_enterpriseId)
  /**
   * 标签：A-Z | # | $ /｜
   */
  contactLabel: string;
  /**
   * 拼音姓名
   */
  contactPYName: string;
  /**
   * 拼音首字母
   */
  contactPYLabelName: string;
  /**
   * 拼音-分隔
   */
  contactPinyin?: string;
  /**
   * 昵称
   */
  contactName: string;
  /**
   * 账号类型 (-1:管理员 0:邮件列表 1:别名账号 2:普通账号 4:动态邮件列表 101:公共联系人)
   */
  accountType: number;
  /**
   * 主显账号
   */
  displayEmail: string;
  /**
   * 账号外显
   */
  accountName: string;
  /**
   * 账号是否显示
   * 0 正常
   * 1 禁用
   * 2 删除
   * 4 离职
   * 5 交接中
   * 6 已交接
   */
  accountStatus?: number;
  /**
   * 账号是否可见
   * 1 可见
   * 0 不可见
   */
  accountVisible?: number;
  /**
   * 备注
   */
  remark?: string;
  /**
   * 职务
   */
  position?: string[][];

  /**
   * 个人通讯录所属的分组
   */
  personalOrg?: string[];

  /**
   * 类型
   */
  type: ContactType;
  /**
   * 头像url
   */
  avatar?: string;
  /**
   * 头像挂饰
   */
  avatarPendant?: string;
  /**
   * 账户标识---唯一
   */
  accountId: string;
  /**
   * 企业id
   */
  enterpriseId?: number;
  /**
   * 原始数据的accountId
   */
  accountOriginId?: string;

  hitQuery?: KeyOfEntityContact[];

  // 命中的邮箱
  hitQueryEmail?: string;

  updateTime?: number;
  createTime?: number;
  /**
   * 根据账户id计算得到的用户展示颜色
   */
  color?: string;

  visibleCode: number;

  // 是否可以IM
  enableIM: boolean;

  // 个人联系人展示优先级 优先级，撤回-1,高0，中1，低2
  priority?: number;

  // 是否星标
  marked?: number;

  // 职位信息
  job?: string;

  adrList?: string[];
  pref?: string;
  birthday?: string;
  role?: string;
  title?: string;
  org?: string;
  orgname?: string;

  // 最后修改时间，用于删除
  _lastUpdateTime: number;
}

export interface EntityContactItem extends Entity {
  // id:string;(contactId_contactItemType_contactItemVal)
  /**
   * 联系人信息条目值(云信token，手机号的真实值)
   */
  contactItemVal: string;
  /**
   联系人信息条目标注 (云信account，手机号别名之类的存这个字段)
   * */
  contactItemRefer: string;
  /**
   * 联系人信息条目值
   */
  contactItemType: ContactInfoType;
  /**
   * 多条同类型信息中，用作主xian5账号
   */
  isDefault: intBool;
  /**
   * 企业邮箱账号类型，主账号1， 别名账号2，未知-1
   */
  emailType?: number;
  /**
   * 关联的用户id
   */
  contactId: string;
  /**
   *
   */
  type: ContactType;
  /**
   * 此条目的未读信息条数
   */
  unreadItemCount?: number;
  updateTime?: number;
  createTime?: number;
  /**
   * 使用频率
   */
  useFrequency?: number;

  hitQuery?: KeyOfEntityContactItem[];

  enterpriseId?: number;

  /**
   * 最后更新时间，用于删除
   */
  _lastUpdateTime: number;
}

export interface EntityOrg extends Entity {
  // id:string;(orgId)
  /**
   * 原始组织的id
   */
  originId: string;
  /**
   * 组织名称
   */
  orgName: string;
  /**
   * 组织拼音名称
   */
  orgPYName: string;
  /**
   * 上级组织id
   */
  parent: string;
  /**
   * 组织所在层级
   */
  level?: number;
  /**
   * 组织类型（用来判断是否可以用于im，写信等）
   * 0:普通部门
   * 1:公共联系人
   * 2:邮件列表
   * 99:企业顶级部门
   * 2000: 群组
   * 2001: 个人分组
   * 2002: 客户
   * 2003： 线索
   */
  type: number;
  /**
   * 组织排序值
   */
  orgRank: number;
  /**
   * 部门展示 (0展示，1:不展示)
   */
  visibleCode: number;
  /**
   * 组织下级组织数目
   */
  childrenCount?: number;
  hitQuery?: string[];
  memberNum?: number;
  /**
   * 最后更新时间，用于删除
   */
  _lastUpdateTime: number;
  // 所属企业ID
  enterpriseId?: number;
  source?: 'core' | 'full';
  idPathList?: string[];
  namePathList?: string[];
}

export interface SimpleTeamInfo {
  avatar?: string;
  teamId: string;
}
export interface SearchTeamOrgModel extends EntityTeamOrg {
  contactList?: ContactModel[];
}

export interface EntityTeamOrg extends EntityOrg {
  avatar: string; // 群头像
  intro: string; // 群简介
  announcement: string; // 群公告
  owner: string; // 群主
  memberNum: number; // 群成员数量
  memberUpdateTime: number; // 群成员最后更新时间
  createTime: number; // 群创建时间
  updateTime: number; // 群最后更新时间
}

export interface EntityOrgContact extends Entity {
  // id:string;(contactId_orgId)
  contactId: string;
  orgId: string;
  yunxinId: string;
  // 全量数据下的排序序号
  rankNum?: number;
  // 精简数据下的排序序号
  coreRankNum?: number;
  contact?: EntityContact;
  model?: ContactModel;
  enterpriseId?: number;
  type: 'enterprise' | 'personal' | string;
  _lastUpdateTime: number;
}

export interface EntityOrgTeamContact extends EntityOrgContact {
  imId: string; // (orgId + yunxinId)
  type: 'owner' | 'manager' | 'normal' | string; // 群成员类型
  nickInTeam: string; // 在群里面的昵称
  joinTime: number; // 入群时间
}

export interface EntityPersonalOrgContact extends Partial<EntityOrgContact> {
  id: string;
  updateTime?: number;
  orgId: string;
  contactId: string;
}

export interface EntityPersonalOrg extends EntityOrg {
  marked?: number;
  updateTime: number; // 分组最后更新时间
  memberNum?: number; // 群成员数量
  _lastUpdateTime: number; // 最后修改时间，用来删除
}

export interface EntityPersonalMark extends Entity {
  type: 1 | 2;
  value: string;
  name: string;
  emails: string[];
  marked: number;
  // contactId & orgId在企业邮的对应ID
  originId?: string;
  unreadMailCount?: number;
  _lastUpdateTime: number; // 最后修改时间，用来删除
}

export interface YunxinContactModel {
  contactModelList: ContactModel[];
  needRequestAccounts: string[];
}

export interface ContactModel {
  contact: EntityContact;
  contactInfo: EntityContactItem[];
  // redux 中必存在
  isFull?: boolean;
  orgs?: EntityOrg[];
  // 外贸所有客户联系人数据都会带有这个字段
  customerOrgModel?: CustomerOrgModel;
  _account?: string;
  // 加入redux的时间
  reduxUpdateTime?: number;
}

export interface ContactMemoryModel {
  id: string;
  isDefault: number;
  contactName: string;
  contactPYName: string;
  contactPYLabelName: string;
  accountName: string;
  avatar: string;
  avatarPendant: string;
  visibleCode: number;
  position: [string[]];
  enableIM: boolean;
  type: string;
  hitQueryEmail?: string;
  yunxinId: string;
}

export interface SimpleContactModel {
  account: string;
  contactId: string;
  contactName: string;
}

export interface OrgModel {
  org: EntityOrg;
  children: OrgModel[];
  orgList: EntityOrg[];
}

export type OrgModel2 = Record<string, { children: EntityOrg[]; orgList: EntityOrg[] }>;

export type OrgContactModel = EntityOrgTeamContact & EntityOrgContact;

export interface NeedUpdateTeamOrgList {
  needDeleteTeamList: string[];
  needUpdateTeamList: EntityTeamOrg[];
  needUpdateMemberTeamIdList: string[];
  needUpdateTeamMemberList: ContactTeamMember[];
}

// 个人通讯录 | 企业通讯录 | 其他（陌生人） | 客户 | 线索（准客户）
export type ContactType = 'personal' | 'enterprise' | 'external' | 'customer' | 'clue' | 'openSea';

export type ContactOrgType = 'personalOrg' | 'enterprise' | 'team' | 'customer' | 'clue' | 'openSea';

// 邮箱
export type EMAIL = string;
// 多账号下邮箱 '_account&&&email' 格式
export type ACCOUNT_EMAIL = string;
// 灵犀联系人id
export type ContactId = string;
// 灵犀组织id(企业，分组，群组)
export type OrgId = string;
// 外贸客户id，
export type CustomerId = string;
// 外贸客户联系人id，
export type CustomerContactId = string;
// 外部联系人id
export type ExternalContactId = string;
// 多账号对应的账号
export type _ACCOUNT = string;

// 暂时用于窗口位置大小的记录
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 邮件解析为账号和domain
export interface EmailAccountDomainInfo {
  account: string;
  domain: string;
}

export interface BkLoginInitData {
  account: AccountTable[];
  accountInfo: AccountInfoTable[];
  browserUUId: string;
  accountId: string;
  sessionName?: string;
  isSharedAccountSwitch?: boolean;
  targetSharedAccount?: string;
}

export interface BkLoginResultData {
  pass: boolean;
  accountId: string;
  account: AccountTable[];
  accountInfo: AccountInfoTable[];
  errorType?: string;
  currentUser?: User;
  currentNode?: string;
  authInfo?: string;
}

export interface AddAccountPageInitDataType {
  currentHostType: 'smartDNSHost' | 'domestic';
  currentUser: User | undefined;
  browserUUId: string;
  loginEmail?: string;
  sessionName?: string;
  visibileWinIds?: number[];
}

export interface addAccountPageReturnDataType {
  currentUser: User;
  currentNode: string;
  originAccount: AccountTable[];
  originAccountInfo: AccountInfoTable[];
  authInfo: string;
}

export interface bindSubAccountPageReturnDataType {
  success: boolean;
  errMsg?: string;
  errCode?: number | string;
  currentUser?: User;
  currentNode?: string;
  originAccount?: SubAccountTableModel[];
  originAccountInfo?: AccountInfoTable[];
  authInfo?: string;
}
