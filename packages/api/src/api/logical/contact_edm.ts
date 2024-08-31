import { ContactModel, CustomerId, Entity, EntityOrg, resultObject } from '@/api/_base/api';
import { DBList } from '../data/new_db';
import { EmailRoles, RelatedCompanyInfo } from './mail_plus_customer';
import { SocialPlatform } from './customer';

export type CustomerOrgType = 'customer' | 'clue' | 'openSea';

export type CustomerContactType = 'customer_contact' | 'clue_contact';

export type CustomerRole = 'manager' | 'colleague' | 'openSea' | 'other';

export type CustomerRoleExtra = CustomerRole | 'noRoleManager' | 'noRoleColleague';

export type CustomerType = CustomerOrgType | CustomerContactType;

export interface CustomerListParams {
  lastId?: number;
  lastMailTime?: number;
  limit: number;
}

export interface MyCustomerListParams {
  lastId?: string;
  limit: number;
}

export interface SearchCustomerParams extends CustomerListParams {
  query: string;
}

export interface EntityCustomerOrg extends EntityOrg {
  id: string;
  area: string; // 地区
  zone: string; // 时区
  website?: string; // 网址
  cLevelName: string; // 客户等级名称
  cLevel?: string; // 客户等级
  number?: string; // 客户编号
  logo?: string; // 客户图
  domain: string; // 客户公司域名
  companyName: string; // 公司名称
  shortName?: string; // 公司简称
  starLevel?: string; // 公司星级
  sourceName?: string; // 来源
  // managerIds: string[], // 客户所有负责人
  managerNames: string[]; // 客户所属者
  labelNames: string[]; // 客户标签
  _lastUpdateTime: number; // 最后修改时间，用来删除
  lastUpdateTime: number; // 服务端数据时间戳
  customerType: CustomerType;
  _company: string;
  type: number;
  createTime?: number;
  customerRole?: EmailRoles;
  orgName: string;
  status?: string;
  // 所属企业ID
  enterpriseId?: number;
}

export interface EntityClueOrg extends EntityOrg {
  id: string;
  area: string; // 地区
  website?: string; // 网址
  domain: string; // 公司域名
  companyName: string; // 公司名称
  createType?: number; // 创建类型 1直接创建 2数据导入 3往来邮件推荐 4个人通讯录导入 5EDM收件人
  status?: string; // 1 未处理 2无效 3跟进中 4转客户 5关闭
  number?: number; // 编号
  sourceName?: string; // 来源
  // managerIds:string[], // 线索所有负责人
  managerNames: string[]; // 公司管理者
  _lastUpdateTime: number; // 最后修改时间，用来删除
  lastUpdateTime: number; // 服务端数据时间戳
  customerType: CustomerType;
  _company: string;
  type: number;
  createTime?: number;
  isSelf?: boolean;
  customerRole?: EmailRoles;
  orgName: string;
  // 所属企业ID
  enterpriseId?: number;
}

export interface EntityCustomerOrgContact extends Entity {
  orgId: string; // 客户或者线索id
  contactId: string; // 联系人id
  account: string; // 联系人账号
  isMainContact: boolean; // 是否是主要联系人
  _lastUpdateTime: number; // 最后修改时间，用来删除
  customerType: CustomerType;
  _company: string;
}

export interface EntityCustomerContact extends Entity {
  originId: string; // 原始id
  name: string; // 联系人姓名
  contactPYName: string; // 联系人姓名拼音
  // contactPinyin: string,
  contactPYLabelName: string; // 联系人姓名拼音首字母
  contactLabel: string; // 联系人首字母
  avatar: string; // 头像
  account: string; // 联系人账号
  // labelNames: string[], // 标签名称集合
  whatsApp?: string;
  phones?: string[];
  gender?: string; // 性别
  birthday?: string; // 生日
  homePage?: string; // 主页
  job?: string;
  remark?: string; // 备注
  pictures?: string; // 图片展示
  _lastUpdateTime: number; // 最后修改时间，用来删除
  customerType: CustomerType;
  _company: string;
}

export interface EntityCustomerOrgManager extends Entity {
  orgId: string; // 线索/客户id
  companyId: string; // 管理者公司id
  managerId: string; // 管理者id
  managerName: string; // 管理者姓名
  managerAccount: string; // 管理者账号
  customerType: CustomerType;
  _lastUpdateTime: number; // 最后修改时间，用来删除（DB自己维护的时间戳，记录最新更新DB的时间）
  _company: string;
  lastUpdateTime: number; // 服务端数据时间戳
  lastSetTopTime: number; // 设置置顶的时间戳
  lastMailTime: number; // 新邮件时间戳
  sortWeight: number; // 用于排序的权重，lastSetTopTime * 5 + lastMailTime * 2 + orgId
}

export interface EntityCustomerLabel extends Entity {
  orgId?: string; // 线索客户id
  contactId?: string; // 联系人id
  color: string; // 颜色
  originId: string; // label的原始id
  name: string; // label名称
  createTime: number; // label创建时间
  customerType: CustomerType; // 是和客户标签还是联系人标签
  type: number; // label类型
  _lastUpdateTime: number; // 最后修改时间，用来删除
  _company: string;
}

export interface EntityCustomerUnitContact extends Entity {
  contactId: string;
  orgId: string;
  email: string;
  nickname: string;
  status: number;
  _lastUpdateTime: number;
}

export interface TransContactRes {
  contactList: EntityCustomerContact[];
  // labelList: EntityCustomerLabel[],
  orgContactList: EntityCustomerOrgContact[];
}

export type CustomerOrg = EntityClueOrg | EntityCustomerOrg;

export interface CustomerEmailModelRes {
  modelRes: Record<string, ContactModel>;
  modelListRes: Record<string, ContactModel[]>;
}

export interface CustomerOrgModel {
  createTime?: number; // 客户创建时间
  role: EmailRoles; // 客户的角色
  companyId: CustomerId; // 客户id
  relatedCompanyInfo?: RelatedCompanyInfo[]; // 当前客户联系人的其他客户信息
  currentModel?: ICustomerContactModel; // 当前客户联系人详情数据
  // data: CustomerOrg; // 客户或者线索详情数据（需要通过id换取）
}

export interface CustomerSearchCondition {
  query: string;
  // 查询的个数
  limit?: number;
  // 上一次返回值的最后一个id
  lastId?: string;
  // 分片查询每次从数据库中取的个数 默认10000
  count?: number;
  // 多账号使用，搜索哪个账号数据
  _account?: string;
  dbName?: DBList;
  tableName?: string;
  filterName?: string;
  // edmUseMainAccount参数控制是否使用主账号，默认是true，会覆盖传入的_account,如果需要使用传入的_account,则需要设置edmUseMainAccount为false
  edmUseMainAccount?: boolean;
}

export interface HandleOrgListParams {
  data: resultObject[];
  // 是否需要在添加后删除之前的数据
  needDeleteLastData?: boolean;
  sendEvent?: boolean;
  _lastUpdateTime?: number;
}

export interface SaveCustomerListToDBParams {
  orgList: CustomerOrg[];
  contactList: EntityCustomerContact[];
  orgContactList: EntityCustomerOrgContact[];
  managerList: EntityCustomerOrgManager[];
  idList: string[];
  needDeleteLastData?: boolean; // 是否需要在添加后删除之前的数据
}

export type CustomerFilterType = 'searchContact' | 'searchOrg' | 'searchMyCustomer' | 'searchMemoryContact';

export interface CustomerSearchRes {
  contact: ContactModel[];
  customer: EntityCustomerOrg[];
  clue: EntityClueOrg[];
}

export interface CustomerSyncRes extends CustomerSaveDBRes {
  orgList: CustomerOrg[];
  managerList: EntityCustomerOrgManager[];
  contactList: EntityCustomerContact[];
  orgContactList: EntityCustomerOrgContact[];
  contactModelList?: ContactModel[];
  // labelList: EntityCustomerLabel[]
}

export interface CustomerSaveDBRes {
  updateContactIdList: string[];
  updateOrgContactIdList: string[];
  updateOrgManagerIdList: string[];
}

export interface CustomerSyncTempRes {
  orgList: CustomerOrg[];
  managerList: EntityCustomerOrgManager[];
  contactList: EntityCustomerContact[];
  orgContactList: EntityCustomerOrgContact[];
  customerIdList: string[];
}

// 我的客户列表分页数据结构
export interface CustomerEntityForMail extends EntityCustomerOrg {
  contactList: EntityCustomerContact[];
  managerList: EntityCustomerOrgManager[];
  orgContactList: EntityCustomerOrgContact[];
}

// 服务端返回客户数据
export interface CustomerResFromServer {
  company_domain: string;
  company_id: number;
  company_name: string;
  create_time: string;
  delFlag: boolean;
  lastUpdateTime: number;
  lastId: number;
  size: number;
  contact_list: CustomerListContactRes[];
  manager_list: CustomerListManagerRes[];
}

// 服务端返回客户联系人数据
export interface CustomerListContactRes {
  contact_id: string;
  contact_name: string;
  email: string;
  main_contact: boolean;
  telephones: string[];
}

// 服务端返回负责人数据
export interface CustomerListManagerRes {
  email: string;
  id: string;
  manager_name: string;
  name: boolean;
  lastSetTopTime: number;
  lastMailTime: number;
}

export type CustomerSyncDeleteRes = Record<keyof CustomerSyncRes, string[]>;

export interface CustomerListCommonRes<T = resultObject[]> {
  data: T;
  loadMore: boolean;
}

export type ContactEdmTableName = 'contact' | 'org' | 'orgContact' | 'orgManager' | 'label' | 'colleagueContact';

export interface CustomerSearchContactMemoryRes {
  contact: CustomerContactSearch[];
  customer: CustomerOrgSearch[];
  clue: CustomerOrgSearch[];
}

export interface CustomerContactSearch {
  /**
   * 客户，线索联系人id
   */
  id: string;
  /**
   * 所属的客户id
   */
  orgId: string;
  /**
   * 拼音姓名
   */
  contactPYName: string;
  /**
   * 拼音首字母
   */
  contactPYLabelName: string;
  /**
   * 昵称
   */
  contactName: string;
  /**
   * 账号外显（email）
   */
  accountName: string;
  /**
   * 类型
   */
  type: CustomerOrgType;
  /**
   * 是否是我的
   */
  managerList?: string[];
  /**
   * 用来做数据的更新，删除
   */
  _lastUpdateTime: number;
  hitQuery?: string[];
  customerRole?: EmailRoles;
  createTime?: number;
}

export interface CustomerOrgSearch {
  /**
   * 客户线索id
   */
  id: string;
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
   * 组织类型（用来判断是否可以用于im，写信等）
   * 2002: 客户
   * 2003： 线索
   */
  type: number;
  /**
   * 组织排序值
   */
  orgRank: number;
  /**
   * 最后修改时间，用来删除
   */
  _lastUpdateTime: number;
  /**
   * 域名
   */
  _company: string;
  /**
   * 是否是我的
   */
  managerList?: string[];
  customerType: CustomerOrgType;
  hitQuery?: string[];
  customerRole?: EmailRoles;
}

// 服务端返回的客户联系人模型
export interface ServerCustomerContactModel {
  contact_id: string;
  contact_name: string;
  email: string;
  rejected: boolean;
  blacklist: boolean;
  valid: boolean;
  verify_status: number;
  main_contact: boolean;
  contact_icon: string;
  telephones: string[];
  whats_app: string;
  social_platform: {
    name: string;
    number: string;
    // 0:其他; 1:Skype; 2:Facebook; 3:Linkedin; 4:Youtube; 5,Twitter; 6: Instagram; 7:Zalo; 8: Viber; 9: Wechat; 10:QQ; 11:旺旺; 12:钉钉;
    type: string;
  }[];
  job: string;
  home_page: string;
  gender: string;
  birthday: string;
  remark: string;
  pictures: string;
  label_list: ServerCustomerLabelModel[];
  attachment: any;
  area: string[];
  continent: string;
  country: string;
  province: string;
  city: string;
  contact_infos: {
    // 联系方式内容，比如 l@ling.com, +5076-87088708
    contact_content: string;
    // 联系方式类型， EMAIL 邮箱， TEL 电话，WHATSAPP
    contact_type: string;
    // 邮箱是否有效
    valid: boolean;
    // 邮箱有效性code，-1：未检测； 0：地址不存在；1：有效地址；2：长期不活跃；3：域名服务器错误
    verify_status: number;
  }[];
  address: string;
  department: string;
  decision_maker: boolean;
  ext_infos: {
    key: string;
    value: string;
  }[];
  source_name: string;
  create_time: number;
  telephone: string;
}

// 服务端返回的客户负责人模型
export interface ServerCustomerManagerModel {
  // 负责人id
  id: string;
  // 负责人姓名+邮箱, 格式: 张三(zhangsan@lx.net.com)
  name: string;
  // 负责人邮箱
  email: string;
  // 负责人姓名
  manager_name: string;
  // 最后沟通时间
  lastMailTime: number;
  // 头像链接
  iconUrl: string;
}

// 服务端返回的标签模型
export interface ServerCustomerLabelModel {
  label_id: number;
  label_name: string;
  label_type: number;
  label_color: string;
  label_color_origin?: string;
  label_remark: string;
  label_company_count: number;
  label_contact_count: number;
  label_create_time: number;
  create_account_id: string;
  create_account: ServerCustomerManagerModel;
}

// 服务端返回的客户模型
export interface ServerCustomerModel {
  company_type?: 'customer' | 'clue' | 'openSea';
  originCompanyId?: string;
  company_id: string;
  company_name: string;
  company_logo: string;
  company_number: string;
  company_domain: string;
  short_name: string;
  purchase_amount: number;
  website: string;
  area: string[];
  continent: string; // 洲
  country: string; // 国家
  province: string;
  city: string;
  zone: string;
  destination_port: any;
  main_industry: number;
  scale: number;
  source: number;
  source_name: string;
  sales_type: number;
  star_level: number;
  label_list: ServerCustomerLabelModel[];
  customer_stage: number;
  company_level: number;
  company_level_name: string;
  intent: number;
  customer_follow_status: number;
  manager_list: ServerCustomerManagerModel[];
  fax: string;
  address: string;
  telephone: string;
  social_media_list: string;
  remark: string;
  attachment: string;
  exchange_cnt: number;
  recent_follow_at: string;
  recent_follow_by: string;
  recent_follow_by_id: string;
  next_follow_at: string;
  create_time: string;
  create_by: string;
  create_by_id: string;
  create_type: number;
  enter_time: string; // 进入私海时间
  update_time: string;
  update_by: string;
  update_by_id: string;
  contact_list: ServerCustomerContactModel[];
  label_names: string[];
  require_product: string;
  product_require_level: number;
  customized_field_value: {
    field_id: string;
    value: string;
  }[];
  require_product_type: number;
  social_media: SocialPlatform[];
  pictures: string;
  hasBindOpportunity: boolean;
  // 线索相关属性开始----------------
  // leads_id?: number; // 线索ID company_id
  leads_name?: string; // 线索名称
  // leads_number?: string; // 线索编号company_number
  leads_score?: string; // 线索资料完善度
  status?: string; // 线索状态
  create_source?: {
    // 线索创建方式
    edm_key: string; // 营销任务key跳转使用
    edm_name: string; // 营销任务名称
    source_name: string; // 数据来源标记
  };
  import_batch?: string; // 导入批次
  invalid_reason?: string; // 无效原因备注
  invalid_status?: string; // 无效原因状态
  main_contact?: ServerCustomerContactModel;
  relation_company_deleted?: boolean; // 转客户后的客户是否被删除
  relation_company_id?: number; // 转客户后的id
  relation_company_name?: string; // 转客户后客户名称
  // 线索相关属性结束----------------
  // 公海线索相关开始----------------
  return_managers?: ServerCustomerManagerModel[];
  return_time?: string;
  return_reason?: string;
  return_remark?: string;
  return_source?: number; // 公海来源1.手动退回 2，自动退回
  // 公海线索相关结束----------------
}

// redux存储的客户/客户联系人标签模型
export interface ICustomerLabelModel {
  // 客户/客户联系人 标签Id
  id: string;
  // 标签名称
  name: string;
  // 标签类型，0-客户个人标签，1-联系人标签
  type: number;
  // 标签颜色
  color: string;
  // 标签备注
  remark: string;
  // 标签下企业数量
  companyCount: number;
  // 标签下联系人数量
  contactCount: number;
  // 标签创建时间
  createTime: number;
  // 标签创建人id
  createAccountId: string;
  // 标签创建人信息
  createAccount?: ServerCustomerManagerModel;
}
// 简单的客户模型
export interface ISimpleCustomerModel {
  // 客户id
  id: string;
  // 客户名称
  name: string;
}
// 简单的客户联系人模型
export interface ISimpleCustomerConatctModel {
  // 客户联系人id
  id: string;
  // 客户联系人名称
  name: string;
  // 客户联系人邮箱
  email: string;
  // 是否是主联系人
  isMain?: boolean;
}

// 客户负责人模型
export interface ICustomerManagerModel {
  // 负责人id
  managerId: string;
  // 负责人email
  managerAccount: string;
  // 负责人姓名+邮箱, 格式: 张三(zhangsan@lx.net.com)
  managerName: string;
  // 负责人头像
  iconUrl: string;
  // 最后沟通时间
  lastMailTime: number;
  // 负责人姓名
  managerOriginName?: string;
}

// redux存储的客户联系人模型
export interface ICustomerContactModel extends EntityCustomerContact {
  // 联系人id
  id: string;
  originId: string; // 原始id
  name: string; // 联系人姓名
  contactPYName: string; // 联系人姓名拼音
  contactPYLabelName: string; // 联系人姓名拼音首字母
  contactLabel: string; // 联系人首字母
  avatar: string; // 头像
  account: string; // 联系人账号
  whatsApp?: string; // whatsApp 数据 （似乎废弃）
  phones?: string[]; // 电话（似乎废弃）
  gender?: string; // 性别
  birthday?: string; // 生日
  homePage?: string; // 主页
  job?: string;
  remark?: string; // 备注
  pictures?: string; // 图片展示
  _lastUpdateTime: number; // 最后修改时间，用来删除
  // 加入redux的时间
  reduxUpdateTime?: number;
  // 地址
  address?: string;
  // 是否被退订
  rejected?: boolean;
  // 是否是黑名单
  blacklist?: boolean;
  // 邮箱是否有效
  valid?: boolean;
  // 邮箱有效性状态，-1：未检测； 0：地址不存在；1：有效地址；2：长期不活跃；3：域名服务器错误
  verify_status?: number;
  // 主要联系人
  mainContact: boolean;
  // 社交平台
  social_platform?: {
    name: string;
    number: string;
    // 0:其他; 1:Skype; 2:Facebook; 3:Linkedin; 4:Youtube; 5,Twitter; 6: Instagram; 7:Zalo; 8: Viber; 9: Wechat; 10:QQ; 11:旺旺; 12:钉钉;
    type: string;
  }[];
  // 标签列表，废弃字段，不用关注
  labelList?: ICustomerLabelModel[];
  // 附件 json数组字符串
  attachment?: string;
  // 洲
  continent?: string;
  // 国家
  country?: string;
  // 省
  province?: string;
  // 城市
  city?: string;
  // 联系方式（似乎废弃）
  contact_infos?: {
    // 联系方式内容，比如 l@ling.com, +5076-87088708
    contact_content: string;
    // 联系方式类型， EMAIL 邮箱， TEL 电话，WHATSAPP
    contact_type: string;
    // 邮箱是否有效
    valid: boolean;
    // 邮箱有效性code，-1：未检测； 0：地址不存在；1：有效地址；2：长期不活跃；3：域名服务器错误
    verify_status: number;
  }[];
  // 部门
  department?: string;
  // 是否为主要决策人
  decision_maker?: boolean;
  // 附加信息
  ext_infos?: {
    key: string;
    value: string;
  }[];
  // 联系人数据来源
  source_name?: string;
  // 创建时间
  createTime?: number;
  // 联系人电话
  telephones?: string[];
}

// redux存储的客户模型
export interface ICustomerModel extends EntityOrg {
  // 客户id
  id: string; // 公海客户下的id，客户下的company_id
  // 客户原始id
  originId: string;
  originCompanyId: string; // 只在公海客户下存在，对应的是公海company_id
  /**
   * 组织名称
   */
  orgName: string;
  /**
   * 组织拼音名称
   */
  orgPYName: string;
  /**
   * 上级组织id('customer','clue')
   */
  parent: string;
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
  visibleCode: 0;
  area: string; // 地区
  zone: string; // 时区
  website?: string; // 网址
  cLevelName: string; // 客户等级名称
  cLevel?: string; // 客户等级
  number?: string; // 客户编号
  logo?: string; // 客户图
  domain: string; // 客户公司域名
  companyName: string; // 公司名称
  shortName?: string; // 公司简称
  starLevel?: string; // 公司星级
  sourceName?: string; // 来源
  sourceId?: string; // 来源number
  contactList: ISimpleCustomerConatctModel[]; // 客户联系人id列表
  managerList: ICustomerManagerModel[]; // 客户负责人列表
  labelList: ICustomerLabelModel[]; // 客户标签列表
  managerNames: string[]; // 客户所属者
  labelNames: string[]; // 客户标签
  lastMailTime?: number; // 最后邮件更新时间
  _lastUpdateTime: number; // 服务端数据时间戳
  reduxUpdateTime?: number; // 加入redux时间
  // 创建时间，时间戳类型
  createTime?: string;
  /**
   * 不常用字段
   */
  status?: string;
  // 创建人姓名
  create_by?: string;
  // 创建人id
  create_by_id?: string;
  // 创建方式单选项id
  create_type?: number;
  // 客户跟进状态
  customer_follow_status?: number;
  // 客户阶段单选项id
  customer_stage?: number;
  // 目的地港口
  destination_port?: string;
  // 进入私海时间
  enter_time?: string;
  // 往来邮件数量
  exchange_cnt?: number;
  // 是否有关联商机
  hasBindOpportunity?: boolean;
  // 传真
  fax?: string;
  // 客户意向单选项id
  intent?: number;
  // 标签列表
  label_names?: string[];
  // 主行业单选项id
  main_industry?: number;
  // 下次跟进时间
  next_follow_at?: string;
  // 年采购额
  purchase_amount?: number;
  // 最近跟进时间
  recent_follow_at?: string;
  // 最近跟进人姓名
  recent_follow_by?: string;
  // 最近跟进人id
  recent_follow_by_id?: string;
  // 需求商品描述
  require_product?: string;
  // 规模单选项id
  scale?: number;
  // 销售方式单选项id
  sales_type?: number;
  // 社交媒体
  social_media_list?: string;
  // 社交媒体
  social_media: SocialPlatform[];
  // 更新人姓名
  update_by?: string;
  // 更新人id
  update_by_id?: string;
  // 更新时间
  update_time?: string;
  // 备注
  remark?: string;
  address?: string; // 公司地址
  // source?: number; // 来源
  telephone?: string; // 电话
  // 线索相关属性开始----------------
  leads_name?: string; // 线索
  leads_score?: string; // 线索资料完善度
  create_source?: {
    // 线索创建方式
    edm_key: string; // 营销任务key跳转使用
    edm_name: string; // 营销任务名称
    source_name: string; // 数据来源标记
  };
  import_batch?: string; // 导入批次
  invalid_reason?: string; // 无效原因备注
  invalid_status?: string; // 无效原因状态
  main_contact?: ServerCustomerContactModel;
  relation_company_deleted?: boolean; // 转客户后的客户是否被删除
  relation_company_id?: number; // 转客户后的id
  relation_company_name?: string; // 转客户后客户名称
  // 线索相关属性结束----------------
  // 公海线索相关开始----------------
  return_managers?: ServerCustomerManagerModel[];
  return_time?: string;
  return_reason?: string;
  return_remark?: string;
  return_source?: number; // 公海来源1.手动退回 2，自动退回
}
