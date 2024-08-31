import { Api } from '../_base/api';
import { ResponseData } from '@/api/data/http';

export enum ProductTagEnum {
  /** 待办 */
  TODO = 'TODO',
  /** @联系人 */
  AT_CONTACT = 'AT_CONTACT',
  /** 云文档附件 */
  NETDISK_ATTACHMENT = 'NETDISK_ATTACHMENT',
  /** 点赞邮件 */
  EMAIL_LIKE = 'EMAIL_LIKE',
  /** 邮件模版 */
  EMAIL_TEMPLATE = 'EMAIL_TEMPLATE',
  /** 收件人支持添加IM群组 */
  EMAIL_RECEIVER_IM_GROUP = 'EMAIL_RECEIVER_IM_GROUP',
  /** 企业外收件人阅读状态追踪 */
  READ_STATUS_TRACK = 'READ_STATUS_TRACK',
  /** 会议室设定 */
  MEETING_SETTING = 'MEETING_SETTING',
  /** 日程规则设定 */
  SCHEDULE_SETTING = 'SCHEDULE_SETTING',
  /** 日历共享和订阅 */
  CALENDAR_SHARING_SUBSCRIBE = 'CALENDAR_SHARING_SUBSCRIBE',
  /** 通讯录外来信提醒 */
  CONTACT_RECV_NOTIFY = 'CONTACT_RECV_NOTIFY',
  /** 新设备登录提醒 */
  LOGIN_DEVICE_NOTIFY = 'LOGIN_DEVICE_NOTIFY',
  /** 在线资料包 */
  ONLINE_RESOURCE = 'ONLINE_RESOURCE',
  /** 高级搜索 */
  ADVANCED_SEARCH = 'ADVANCED_SEARCH',
  /** 聚合邮件 */
  AGGREGATION_EMAIL = 'AGGREGATION_EMAIL',
  /** 邮件列表 */
  EMAIL_LIST = 'EMAIL_LIST',
}

export type ProductVersionId =
  // 尊享版
  | 'sirius'
  // 旗舰版
  | 'ultimate'
  // 校园版
  | 'education'
  // 标准版
  | 'standard_1g'
  // 商务版
  | 'standard_3g'
  // 免费版
  | 'free'
  // 其他
  | 'others';

export interface SubAccountProductInfo {
  // 产品id
  productId: string;
  // 产品版本id
  productVersionId: ProductVersionId;
  // 是否显示版本入口
  showVersionTag: boolean;
  // 产品版本名称
  productVersionName: string;
}

export interface ProductVersionInfo {
  // 产品id
  productId: string;
  // 产品版本id
  productVersionId: ProductVersionId;
  // 是否显示版本入口
  showVersionTag: boolean;
  // 产品版本名称
  productVersionName: string;
  // 子账号版本信息
  subAccountProductInfo?: Map<string, SubAccountProductInfo>;
}

export interface ProductAuthTagInfo {
  // 标签信息
  tagName: ProductTagEnum;
  // 是否展示
  needDisplay: boolean;
}

export interface ReqGetGlobalAuths {
  productId: string;
  productVersionId: string;
  orgId?: string;
  accId?: string;
}

// 权限模块下的子权限
export interface ChildP {
  accessId: string;
  accessLabel: string;
  accessName: string;
}

// 权限模块
export interface ModulePs {
  resourceId: string;
  resourceLabel: string;
  resourceName: string;
  accessList: ChildP[];
}
export interface ResGetGlobalAuths {
  productId: string;
  productVersionId: string;
  orgId: string;
  privileges: ModulePs[];
}

export interface ResGetGlobalAuthsWithCache {
  success: boolean;
  source: 'cache' | 'net';
  val: ModulePs[] | null;
  changed: boolean;
  error?: unknown;
}

export interface ResGetGlobalAuthsWithoutCache {
  success: boolean;
  source: 'cache' | 'net';
  val: ModulePs[] | null;
  error?: unknown;
}

export interface ReqPubClueCreate {
  mobile: string;
  nickName: string;
  contactRole: string; // 联系人角色
  productType?: string; // 产品类型 尊享版：Sirius
  clueSource?: string; // 线索来源 桌面端: LX_DESKTOP
  clueType?: string; // 线索类型
  subOrigin?: string; // 点击来源
}

// 权限类型对
type AccessValuePair<T = unknown> =
  | {
      accessValueType: 'BOOL';
      accessValue: boolean;
    }
  | {
      accessValueType: 'INT';
      accessValue: number;
    }
  | {
      accessValueType: 'DOUBLE';
      accessValue: number;
    }
  | {
      accessValueType: 'STRING';
      accessValue: string;
    }
  | {
      accessValueType: 'JSON';
      accessValue: T;
    };

export interface AccessItem {
  accessLabel: string;
  accessName: string;
  accessValueType: string;
  accessValue: unknown;
}

export interface Privileges<T> {
  resourceLabel: AuthorityFeatureKey;
  resourceName: string;
  accessList: Array<AccessItem & AccessValuePair<T>>;
}

export interface ResGetPrivilegeAll<T = unknown> {
  productId: string;
  productVersionId: ProductVersionId;
  productVersionName: string;
  privileges: Array<Privileges<T>>;
}

export interface ResGetPrivilege<T = unknown> {
  productId: string;
  productVersionId: ProductVersionId;
  productVersionName: string;
  resourceLabel: string;
  resourceName: string;
  accessList: Array<
    {
      accessLabel: string;
      accessName: string;
      // accessValueType: string;
      // accessValue: unknown;
    } & AccessValuePair<T>
  >;
}

export type EdmMenuVideoKeys = 'CUSTOMER_PROSPECTING' | 'CUSTOMER_EXLOIT' | 'CUSTOMER_MANAGE' | 'CUSTOMER_PROMISE' | 'WA';

export interface EdmMenuVideoItem {
  post: string;
  video: string;
}

export type EdmMenuVideo = Record<EdmMenuVideoKeys, EdmMenuVideoItem>;

export interface EdmVideoInfoBase {
  title: string;
  content: string;
  coverUrl: string;
  videoUrl: string;
}

export interface EdmVideoItem extends EdmVideoInfoBase {
  relevant: EdmVideoInfoBase[];
  leanMore: string;
}

export type EdmVideos = Record<string, EdmVideoItem>;

export type ABSwitch = Record<
  | 'forbidden_writelog'
  | 'contact_cache'
  | 'longtask'
  | 'localdb'
  | 'cache_contact'
  | 'edm_mail'
  | 'show_new_web_entry_guide'
  | 'skip_full_enterprise'
  | 'disable_ui_binding_outlook'
  | 'disable_ui_binding_gmail'
  | 'disable_ui_binding_qiyeqq'
  | 'build_unitpath_local'
  | 'edm_menu_video'
  | 'address_transfer2_crm_done',
  // | 'ws_personal',
  boolean | string
>;

export type ProductConfigKeys = 'learning_video';

export type ProductConfig = Record<ProductConfigKeys, unknown>;

export type ABSwitchResult = boolean | string;

export interface ProductAuthApi extends Api {
  // 获取版本权限标签
  doGetProductAuthTags(): Promise<Array<ProductAuthTagInfo>>;
  // 获取产品版本信息
  doGetProductVersion(): Promise<ProductVersionInfo>;
  // 获取产品版本ID
  doGetProductVersionId(): string;
  asyncGetProductVersionId(params?: { _account?: string }): Promise<string>;
  // 请求全局权限
  doGetGlobalAuths(req?: ReqGetGlobalAuths): Promise<ResGetGlobalAuths>;

  // 获取并存储全局权限（未过期从缓存中获取）
  getGlobalAuthsWithCache(): Promise<ResGetGlobalAuthsWithCache>;

  // 获取并存储全局权限（即时）
  getGlobalAuthsWithoutCache(): Promise<ResGetGlobalAuthsWithoutCache>;

  getABSwitch(field?: keyof ABSwitch): Promise<ABSwitchResult | ABSwitch>;

  getABSwitchSync(field?: keyof ABSwitch): ABSwitchResult | ABSwitch;

  // 升级留咨询
  createPubClue(req: ReqPubClueCreate): Promise<ResponseData | undefined>;

  // 判断是否超时
  isOverTimeByPubClue(): Promise<boolean>;
  // 保存升级留咨的时间
  savePubClueTime(): Promise<void>;
  // 获取账号版本功能权限（单功能维度）
  doGetPrivilege<T = unknown>(resourceLabel: string): Promise<ResponseData<ResGetPrivilege<T>>>;

  // 从网络获取系统权限
  saveAuthConfigFromNet(retry?: number): Promise<boolean>;

  /**
   * 获取权限配置
   * @param key 功能唯一key
   */
  getAuthConfig(key: ProductAuthorityFeatureKey): AuthorityConfig | null;

  getStoreAuthInfo(): string | undefined;

  setStoreAuthInfo(authInfoStr: string): void;

  doGetProductTags(): Promise<{
    tags: Array<Record<string, unknown>>;
  }>;

  /**
   * 获取视频配置
   * @param videoId 视频ID
   */
  doGetProductVideos(videoId: string): Promise<EdmVideoItem | null>;
}

/**
 * localStorge 存储的权限名称
 */
export const AUTH_CONFIG = 'AUTH_CONFIG';

/**
 * 业务枚举-分功能
 * 只用在接口返回的数据-到内部权限表示的映射中
 *
 * localStorge 存储的权限版本信息
 */
export const AUTH_TYPE_CONFIG = 'AUTH_TYPE_CONFIG';

/**
 * 业务枚举-分功能
 * 只用在接口返回的数据-到内部权限表示的映射中
 */
export enum AuthorityFeature {
  /**
   * 表扬信-写信页入口
   */
  PRAISE_EMAIL_WRITE_EMAIL_ENTRANCE = 'PRAISE_EMAIL_WRITE_EMAIL_ENTRANCE',
  /**
   * 表扬信-勋章
   */
  PRAISE_EMAIL_MEDAL = 'PRAISE_EMAIL_MEDAL',
  /**
   * 读信页
   */
  READ_EMIAIL = 'READ_EMIAIL',
  /**
   * VIP专属客服入口
   */
  VIP_CS_ENTRANCE = 'VIP_CS_ENTRANCE',
  /**
   * VIP客服能够发送自定义消息
   */
  VIP_CS_SEND_MESSAGE = 'VIP_CS_SEND_MESSAGE',
  /**
   * 陌生人提醒-设置
   */
  STRANGER_NOTIFY_SETTING_PAGE = 'STRANGER_NOTIFY_SETTING_PAGE',
  /**
   * 陌生人提醒设置
   */
  STRANGER_NOTIFY = 'STRANGER_NOTIFY',
  /**
   * 邮件追踪-发件箱详情展示阅读状态
   */
  MAIL_TRACE_SHOW_READ_STATUS = 'MAIL_TRACE_SHOW_READ_STATUS',
  /**
   * 邮件追踪-写信页设置
   */
  MAIL_TRACE_WRITE_EMAIL = 'MAIL_TRACE_WRITE_EMAIL',
  /**
   * 管理后台-入口
   */
  ADMIN_SITE_ENTRANCE = 'ADMIN_SITE_ENTRANCE',
}

/**
 * 业务实际使用的功能枚举
 */
export enum ProductAuthorityFeature {
  /**
   * 表扬信-写信页入口-是否显示
   */
  PRAISE_EMAIL_WRITE_EMAIL_ENTRANCE_SHOW = 'PRAISE_EMAIL_WRITE_EMAIL_ENTRANCE_SHOW',
  /**
   * 表扬信-勋章-是否可操作
   */
  PRAISE_EMAIL_MEDAL_OP = 'PRAISE_EMAIL_MEDAL_OP',
  /**
   * 表扬信-勋章-是否可查看
   */
  PRAISE_EMAIL_MEDAL_VIEW = 'PRAISE_EMAIL_MEDAL_VIEW',
  /**
   * 表扬信-勋章-是否可取消
   */
  PRAISE_EMAIL_MEDAL_CANCEL = 'PRAISE_EMAIL_MEDAL_CANCEL',
  /**
   * 表扬信-勋章-是否可设为挂饰
   */
  PRAISE_EMAIL_MEDAL_DECORATE = 'PRAISE_EMAIL_MEDAL_DECORATE',
  /**
   * 读信页-翻译
   */
  READ_EMIAIL_TRANSLATIONS = 'READ_EMIAIL_TRANSLATIONS',
  /**
   * VIP专属后台-入口-是否展示
   */
  VIP_CS_ENTRANCE_SHOW = 'VIP_CS_ENTRANCE_SHOW',
  /**
   * VIP专属后台-入口-是否可以发送自定义消息
   */
  VIP_CS_ENTRANCE_SEND = 'VIP_CS_ENTRANCE_SEND',
  /**
   * 陌生人提心-设置-是否可开启
   */
  STRANGER_NOTIFY_SETTING_PAGE_VIEW = 'STRANGER_NOTIFY_SETTING_PAGE_VIEW',
  /**
   * 发件箱-是否展示邮件阅读状态-域内
   */
  MAIL_TRACE_SHOW_READ_STATUS_INNER_DOMAIN = 'MAIL_TRACE_SHOW_READ_STATUS_INNER_DOMAIN',
  /**
   * 发件箱-是否展示邮件阅读状态-域外
   */
  MAIL_TRACE_SHOW_READ_STATUS_INNER_OUT_DOMAIN = 'MAIL_TRACE_SHOW_READ_STATUS_INNER_OUT_DOMAIN',
  /**
   * 是否展示写信页设置
   */
  MAIL_TRACE_WRITE_EMAIL_SHOW = 'MAIL_TRACE_WRITE_EMAIL_SHOW',
  /**
   * 管理后台-入口-是否展示
   */
  ADMIN_SITE_ENTRANCE_SHOW = 'ADMIN_SITE_ENTRANCE_SHOW',
  /**
   * 管理后台-IM-是否展示
   */
  IM_SHOW = 'IM_SHOW',
  /**
   * 外贸-下属邮件-是否可以查看下属邮件
   */
  COLLEAGUE_EMAIL_VIEW = 'COLLEAGUE_EMAIL_VIEW',
  /**
   * 外贸-客户邮件-是否可以查看客户邮件
   */
  CONTACT_EMAIL_VIEW = 'CONTACT_EMAIL_VIEW',
  /**
   * 管理后台企业设置
   * 是否展示修改密码入口
   */
  ORG_SETTING_UPDATE_PASSWORD_SHOW = 'ORG_SETTING_UPDATE_PASSWORD_SHOW',
  /**
   * 是否允许使用云附件
   */
  ORG_SETTING_BIG_ATTACH_SHOW = 'ORG_SETTING_BIG_ATTACH_SHOW',
}

export type AuthorityConfigDesc = {
  [key: string]: any;
};

export type AuthorityFeatureKey = keyof typeof AuthorityFeature;

export type ProductAuthorityFeatureKey = keyof typeof ProductAuthorityFeature;

// 内部权限配置
export interface AuthorityConfig {
  name: ProductAuthorityFeatureKey;
  show: boolean;
  desc: AuthorityConfigDesc | null;
  // extra: ProductVersionInfo | null;
}

export type ParseConfigFn = (config: any) => AuthorityConfig;
export type DefaultParseConfigFn = (key: AuthorityFeatureKey, config: any) => AuthorityConfig;

export type ParseConfigMap = {
  [key in AuthorityFeatureKey]?: ParseConfigFn;
};

export type LocalAuthorityConfigType = {
  [key in ProductAuthorityFeature]?: AuthorityConfig;
};
