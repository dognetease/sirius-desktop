/* eslint-disable camelcase */
// ---------------------------- db define start ---------------------------------- //
import {
  Api,
  CatchErrorRes,
  ContactInfoType,
  ContactModel,
  ContactType,
  EntityContact,
  EntityContactItem,
  EntityOrg,
  EntityOrgContact,
  EntityOrgTeamContact,
  EntityPersonalOrg,
  EntityPersonalOrgContact,
  EntityTeamOrg,
  identityObject,
  intBool,
  KeyOfEntityContact,
  KeyOfEntityContactItem,
  OrgModel,
  OrgModel2,
  resultObject,
  SearchTeamOrgModel,
  SimpleContactModel,
  YunxinContactModel,
  EntityPersonalMark,
  ContactId,
  OrgContactModel,
} from '../_base/api';
import { MeetingRoomApi } from './catalog';
import { ResponseData } from '@/api/data/http';
import { DBList, SearchConditionFilter, SearchFilter } from '../data/new_db';
import { URLKey } from '@/config';
import { MailBoxEntryContactInfoModel, MemberType } from './mail';
import { Team, TeamMember } from '@/api/logical/im';
import { ContactServer } from '@/impl/logical/contact/contact_server';
import {
  CustomerListParams,
  CustomerOrg,
  CustomerOrgType,
  CustomerEntityForMail,
  CustomerSearchContactMemoryRes,
  // CustomerSearchRes,
  CustomerOrgSearch,
  EntityCustomerOrg,
  MyCustomerListParams,
} from '@/api/logical/contact_edm';
import { EmailRoles } from './mail_plus_customer';
// import { MeetingRoomApi } from './catalog';
// ---------------------------- db define end ---------------------------------- //

export interface ContactCommonRes<T = any> {
  success: boolean;
  data?: T;
  message?: any;
  code?: number | string;
}

export interface PersonalImportParams {
  // 文件内容
  file: File;
  // 文件大小
  fileSize: number;
  // 分组id
  groupId?: string;
  // 0：不导入，1:覆盖，2：重复导入
  type: 0 | 1 | 2;
  // 1:csv,2:vcf
  fileType: 1 | 2;
}

export interface PersonalExportParams {
  // 分组id
  groupId?: string;
  // 1:csv,2:vcf
  fileType: 1 | 2;
}

export interface handleSyncParams {
  success: boolean;
  idList: string[];
  action: 'update' | 'insert' | 'delete';
}
export interface contactCondition {
  isIM?: boolean;
  showDisable?: boolean; // 默认为true
  type: ContactInfoType;
  filterType?: ContactType;
  value: Array<string | number>;
  _account?: string;
  generateContactModelType?: 'chunked' | 'simpleModel' | 'oldModel';
}

export interface HandleContactListParams {
  contactList: EntityContact[];
  orderByIdList?: string[];
  needOrgData?: boolean;
  _account?: string;
}

export type contactTableNames = 'org' | 'contact' | 'orgContact' | 'contactItem' | 'orgpathlist';

export type ContactPersonalMarkSimpleModel = {
  name: string;
  type: 1 | 2; // 1:个人 2:分组
  value: string; // type=1 value表示contactId type=2 表示orgId
  emails: string[]; // 当type=2时候 emails=[]
  marked: number;
  unreadMailCount?: number;
  originId?: string;
};

export type SearchContactTablesNames = contactTableNames | 'contact_search' | 'org_search';
export type ContactAndOrgType = 'contactItemVal' | 'contactName' | 'contactPYName' | 'accountName' | 'orgName' | 'orgPYName' | 'contactPYLabelName';

export type pluginSearchCondition = Partial<{
  // 是否过滤管理那企业数据
  noRelateEnterprise: boolean;
  // 是否拍平所有的emails(只对个人通讯录生效)
  flattenMuliptleEmails: boolean;
  // 是否使用频率进行排序
  useFrequentOrder: boolean;
  frequentChannel: 'im' | 'mail';
  frequentOrderCount: number;
}>;

export interface SearchCondition extends pluginSearchCondition {
  // 是否搜索外贸数据
  useEdmData?: boolean;
  // 搜索的东西
  query: string;
  // 联系人类型
  contactType?: ContactType;
  // 是否过滤禁用联系人
  showDisable?: boolean;
  // 是否展示非主显账号 (默认不展示)
  showNotDisplayEmail?: boolean;
  // 搜索的结果是否过滤非IM
  isIM?: boolean;
  // 搜索的时候需要过滤的表
  exclude?: Array<ContactAndOrgType>;
  // 搜索的结果过滤条件
  filter?: {
    [key in contactTableNames]?: Array<SearchConditionFilter>;
  };
  // 搜索的时候需要过滤的条件
  searchExclude?: {
    [key in contactTableNames]?: Array<SearchConditionFilter>;
  };
  searchInclude?: {
    [key in contactTableNames]?: Array<SearchConditionFilter>;
  };
  noLock?: boolean;
  // 查询的个数
  maxItem?: number;
  // 上一次返回值的最后一个id
  lastId?: string;
  _account?: string;
  curAccountId?: string;
}

export interface MemorySearchCondition extends pluginSearchCondition {
  // 是否搜索外贸数据
  useEdmData?: boolean;
  // 搜索的东西
  query: string;
  // 联系人类型
  contactType?: ContactType;
  // 是否过滤禁用联系人
  showDisable?: boolean;
  // 是否展示非主显账号 (默认不展示)
  showNotDisplayEmail?: boolean;
  // 搜索的结果是否过滤非IM
  isIM?: boolean;
  // 搜索的时候需要过滤的表
  exclude?: Array<ContactAndOrgType>;
  noLock?: boolean;
  // 查询的个数
  maxItem?: number;
  // 上一次返回值的最后一个id
  lastId?: string;
  _account?: string;
  curAccountId?: string;
  enableUseMemory?: boolean;
  // edmUseMainAccount参数控制是否使用主账号，默认是true，会覆盖传入的_account,如果需要使用传入的_account,则需要设置edmUseMainAccount为false
  edmUseMainAccount?: boolean;
}

export interface MyCustomerSearchCondition {
  // 搜索的东西
  query: string;
  // 搜索数量
  limit?: number;
  // 上一次返回值的最后一个id
  lastId?: string;
  _account?: string;
}

export interface SearchTableParams {
  // 查询的个数
  filterLimit?: number;
  // 分片查询每次从数据库中取的个数 默认10000
  count?: number;
  // 上一次返回值的最后一个id
  lastId?: string;
  searchFilterList: SearchFilter[];
  _account?: string;
  dbName?: DBList;
  tableName: SearchContactTablesNames;
  noRelateEnterprise?: boolean;
}

export interface SearchMemoryTransModel {
  // 表名
  tableName: SearchContactTablesNames;
  // 过滤条件
  searchFilterList: SearchFilter[];
  // 以那个key区分
  searchKey: string;
}

export interface SearchTransModel {
  // 表名
  tableName: contactTableNames;
  // 过滤条件
  searchFilterList: SearchFilter[];
  // 以那个key区分
  searchKey: string;
  // idMap返回数组还是对象
  returnList?: boolean;
}
/**
 * id:orgContact表id
 * contactId:联系人id
 * yunxinId:云信id
 * orgId:(群组,组织)id列表
 * imId:群组拼接云信组成的id（teamId + yunxinId）
 */
export type OrgContactIndex = 'contactId' | 'yunxinId' | 'id' | 'orgId' | 'imId';

export interface OrgContactCondition {
  idList?: string[];
  needGroup?: boolean; // 是否需要分组
  needContactData?: boolean; // 是否需要联系人基本信息
  needContactModelData?: boolean; // 是否需要联系人详细信息
  filterSelf?: boolean; // 是否过滤自己
  orderBy?: TableOrderByType; // 排序
}

export interface OrgContactListParams extends OrgContactCondition {
  idList?: string[];
  type: OrgContactIndex;
  filterTeamOrg?: boolean;
  filterOrg?: boolean;
  filterPersonalOrg?: boolean;
  includeType?: 'team_' | 'personal_org_';
  asSoon?: boolean;
  _account?: string;
}

export interface SearchAllContactRes {
  frequentContactList: ContactModel[];
  contactList: ContactModel[];
  orgList: EntityOrg[];
  personalOrgList: EntityPersonalOrg[];
  teamList: EntityTeamOrg[];
}

export interface SearchContactMemoryRes {
  frequentContactList: ContactSearch[];
  contactList: ContactSearch[];
  orgList: OrgSearch[];
  personalOrgList: OrgSearch[];
  teamList: OrgSearch[];
}

export type SearchContactMermoryTableRes = Partial<Record<SearchContactTablesNames, ContactSearch[] | OrgSearch[]>>;

export interface SearchTeamContactRes {
  contactList: ContactModel[];
  teamList: SearchTeamOrgModel[];
}

export interface ContactOrgOption {
  // 组织id
  orgId?: string;
  // 查询到第几层
  level?: number;
  // 是否只展示im数据
  isIM?: boolean;
  // 是否展示禁止的数据
  showDisable?: boolean;
  // 多账号查询
  _account?: string;
  needLog?: boolean;
}

export interface OrgListOption {
  // 组织id
  idList?: string | string[];
  // 组织类型
  typeList?: Array<string | number>;
  // 原始组织id
  originIdList?: Array<string | number>;
  showDisable?: boolean;
  _account?: string;
}

export interface PersonalContactOption {
  // 是否只展示可以im
  isIM?: boolean;
  // 是否只展示联系人可展示的（联系人被删除，禁用状态。。）
  showDisable?: boolean;
  _account?: string;
  needLog?: boolean;
}

export interface contactInsertParams {
  name: string;
  groupIdList?: string[];
  auto?: intBool;
  comment?: string;
  emailList?: string[];
  phoneList?: string[];
  _account?: string;
  isMark?: boolean;
  marked?: number;
}

export interface ContactEntityUpdateParams extends Partial<EntityContact> {
  id: string;
}

interface contactAddRecentSingleParam {
  contactlist: Record<'contactId' | 'email', string>[];
  conditionType: number;
  contactType?: number;
}
export interface ContactAddRecentParams {
  memberParams: Record<'to' | 'cc' | 'bcc', contactAddRecentSingleParam>;
  _account: string;
}

export interface recentContactListRes {
  email: string;
  accountId?: string;
  iconUrl?: string;
  name?: string;
  nickname?: string;
  index?: number;
}

export interface FrequentContactParams {
  id: string;
  contactId: string;
  email: string | 'yunxin';
  timestamp: number;
  sendcount: number;
  channel: 'mail' | 'im';
  type: 'enterprise' | 'personal';
}

export interface memberList {
  account_name: string;
  domain: string;
  nickname: string;
  type: number;
  contact?: ContactModel;
}

export interface unitList {
  unit_id: string;
  unit_name: string;
  unit_path: string;
}

export interface mailListMemberResult {
  contentType?: string;
  data?: mailListMemberResultData;
}

export interface OperateMailListParams {
  domain: string;
  accountName: string;
  qiyeAccountId?: string;
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'QUERY'; // add:新增，update:更新，delete:删除,query:查询
}

export interface mailListMemberResultData {
  account_name: string;
  domain: string;
  has_external: boolean;
  member_list: memberList[];
  unit_list: unitList[];
}
export interface maillistMemberRes {
  code?: number;
  error?: string;
  errorCode?: string;
  success?: boolean;
  message?: string;
  data?: mailListMemberResult;
}

export interface MailListMember {
  // 邮件列表id
  id?: string;
  // 邮件列表名称
  nickname: string;
  // 账号名称
  account_name: string;
  // 域名
  domain: string;
  // 可见范围
  // 0-允许所有人，2-允许列表中的用户和授权用户，3-只允许授权用户,4-只允许企业内内所有用户
  maillist_right: string;
  // 授权用户列表
  safe_list: string[];
  // 成员列表
  member_list: string[];
  // 部门列表
  unit_list: string[];
  // 邮件列表管理员列表
  maintainer_list: string[];
  // 归属部门 整数 0-公开（类似默认部门）；1-指定部门
  org_level: string;
  // 归属部门列表
  scope_unit_list: string[];
  // 通讯录可见性 1：可见 0：不可见
  addr_visible: string;
  // 列表成员可见性 1：可见 0：不可见
  member_visible: string;
}

export interface DelMailListParams {
  account_name: string;
  domain: string;
  id?: string;
}

export interface UserMailListResultData {
  account_name: string;
  domain: string;
  maintainer_type: 1 | 2;
}

export interface GetMailListParams {
  account_name: string;
  domain: string;
}

export interface PersonalMarkParams {
  type: 1 | 2;
  id: string;
}
export interface MailListConfig {
  // 邮箱地址
  email: string;
  // 邮件列表配置信息
  // eslint-disable-next-line @typescript-eslint/ban-types
  maillist_config: {
    // 是否允许创建邮件列表 1：是 0：否
    create_maillist: number;
    // 是否还能创建邮件列表 1：是 0：否
    has_maillist_quota: number;
    // 是否允许外域邮箱 1：是 0：否，默认：1
    add_external: number;
    // 邮件列表额度
    maillist_max_num: number;
    // 已创建的邮件列表数
    maillist_used_num: number;
  };
}

export interface recentContactListParams {
  page: number;
  pageSize: number;
  conditionType: number;
  contactType?: number;
  _account?: string;
}

export interface SyncTeamListParams {
  teamList?: Team[];
  force?: boolean;
}

export type TeamMemberMap = {
  [key: string]: ContactTeamMember[];
};

export interface ServerTeamRes {
  teamList: ContactTeam[];
  teamMemberMap: TeamMemberMap;
}

export type ContactTeamKey =
  | 'serverCustom'
  | 'name'
  | 'teamId'
  | 'avatar'
  | 'intro'
  | 'announcement'
  | 'owner'
  | 'memberNum'
  | 'memberUpdateTime'
  | 'createTime'
  | 'updateTime';

export type ContactTeam = Pick<Team, ContactTeamKey>;

export type ContactTeamMemberKey = 'type' | 'nickInTeam' | 'joinTime' | 'teamId' | 'account';

export type ContactTeamMember = Pick<TeamMember, ContactTeamMemberKey>;

export interface uploadIconParams {
  file: File;
  fileName: string;
}

export interface uploadIconRes {
  success?: boolean;
  message?: string;
  data?: {
    bigUrl: string;
    mediumUrl: string;
    smallUrl: string;
  };
}

export type TableOrderByType = Array<string | [string, boolean]>;

export interface OrgListParams {
  // 是否只展示可以im
  isIM?: boolean;
  // 是否只展示联系人可展示的（联系人被删除，禁用状态。。）
  showDisable?: boolean;
  showSearchable?: boolean;
  idList?: any[];
  typeList?: any[];
  originIdList?: any[];
  orderByItem?: TableOrderByType;
  exclude?: SearchConditionFilter[];
  needLog?: boolean;
  _account: string;
  needOrder?: boolean;
}

export interface ContactListParams {
  contactType?: ContactType; // 联系人类型
  isIM?: boolean; // 是否只展示im数据
  showDisable?: boolean; // 是否展示所有数据
  idList?: any[]; // 联系人id集合
  orderByItem?: TableOrderByType; // 排序条件
  noRelateEnterprise?: boolean; // 只返回主企业信息
  exclude?: SearchConditionFilter[];
  _account?: string; // 多账号区分账号
  needLog?: boolean;
  needOrder?: boolean;
}

export interface ContactListTypeParams {
  contactType: ContactType;
  isIM?: boolean; // 是否只展示im数据
  showAll?: boolean; // 是否展示所有数据
}

export interface DeletePersonalOrgParams {
  orgIdList: string[];
  markedList?: string[];
  deletePersonContact?: boolean;
}

// 2021/4/26 当前版本没有personal类型
export type contactCategory = 'dept' | 'account' | 'personal';
export type contactMode = 'increment' | 'full';
export type contactOP = 'dept_new' | 'dept_update' | 'dept_delete' | 'account_new' | 'account_update' | 'account_delete';
export type contactAction = contactOP | 'unit_update';

export interface CustomerContactPushMsg {
  mode: 'increment' | 'full'; // 更新通讯录的方式
  org_id: number; // 企业id
  lastUnitUpdateTime: number; // 服务端部门最新版本号
  lastContactUpdateTime: number; // 服务端通讯录最新版本号
  category: contactCategory; // 事件的类型： dept 部门；account账号
  domain: string; // 域名
}

export interface CustomerUpdatePushMsg {
  companyIds: string[];
}

export interface contactUpdateParams extends contactInsertParams {
  accountId: string;
}

export interface contactDeleteParams {
  accountIdList: string[];
}

export type PersonalOrgContactModel = Record<string, EntityPersonalOrgContact[]>;

export interface InsertPersonalOrgRes {
  name: string;
  id: string;
}
export interface PersonalOrgParams {
  idList?: string[];
  _account?: string;
}

export interface RequestContactOrgParams {
  orgId?: string | string[];
  showDisable?: boolean;
  _account?: string;
}

export type ContactDataFrom = 'db' | 'memory';

export interface GetEmailDatatParams {
  emails: string[];
  useLx?: boolean;
  useEdm?: boolean;
  needGroup?: boolean;
  _account?: string;
  useData?: ContactDataFrom;
}

export interface doGetContactInMailListRespose {
  id: Record<string, boolean>;
  mail: Record<string, boolean>;
}

export interface OrgApi extends Api {
  /**
   * 列出当前节点的下层组织树
   * @param option 获取组织树参数
   * @param option.orgId 根组织的id，不输入标识全局根节点, -1标识从根开始
   * @param option.level 输出下级组织的层级，1标识展开下层一级，以此类推，-1标识展开所有层级
   * @param option.isIM 是否过滤不是im的数据
   */
  doGetContactOrg(option?: ContactOrgOption): Promise<OrgModel>;

  doGetOrgContactListByContactId(idList: ContactId[]): Promise<Array<OrgContactModel>>;

  doGetContactOrgMap(params?: { showDisable?: boolean; _account?: string; isIM?: boolean }): Promise<OrgModel2>;

  /**
   * 判断当前联系人是否在邮件列表中
   * @param condition idList emailList 必须有一个
   */
  doGetContactInMailList(condition: { idList?: string[]; emailList?: string[] }): Promise<doGetContactInMailListRespose>;

  /**
   * 判断组织类型是否是邮件列表
   * @param type
   */
  isMailListByAccountType(type: number): boolean;

  doGetTableCount(tableName: contactTableNames): Promise<number>;

  doGet(orgId?: string, level?: number): Promise<OrgModel>;

  /**
   * 通过条件获得组织列表
   * @param option idList：组织id列表（不传代表所有的数据）
   */
  doGetOrgList(option: OrgListOption): Promise<EntityOrg[]>;

  /**
   * 根据id搜索群组
   * @param list
   */
  doGetTeamList(list: string[]): Promise<EntityTeamOrg[]>;

  getContactSyncTimes(): number;

  getContactSyncState(type: 'contact' | 'customer' | 'colleague'): boolean;

  doGetAllContactList(account?: string): Promise<ContactModel[]>;
  doGetAllOrgContact(account?: string): Promise<EntityOrgContact[]>;

  doGetOrgContactListByOrgId(list: string[], _account?: string): Promise<EntityOrgTeamContact[]>;

  doGetContactReadySync(source?: 'enterprise' | 'org' | 'personal' | 'personalOrg'): Promise<boolean>;

  handlePushCustomerMgs(params: CustomerUpdatePushMsg): void;

  /**
   * 同步全账号通讯录和组织
   */
  syncAllAccount(force?: boolean): Promise<any>;
  /**
   * 同步客户下属联系人数据
   */
  syncContactColleague(): Promise<unknown[]>;

  /**
   * 获取个人分组列表
   */
  doGetPersonalOrg(params: ContactAccountsOptionWithPartial<PersonalOrgParams>): Promise<ContactCommonRes<EntityPersonalOrg[]>>;

  /**
   * 删除个人分组
   */
  doDeletePersonalOrg(params: ContactAccountsOption<DeletePersonalOrgParams>): Promise<ContactCommonRes>;

  /**
   * 增加个人分组
   */
  doInsertPersonalOrg(
    params: ContactAccountsOptionWithPartial<{ groupName: string; idList?: string[]; isMark?: boolean }>
  ): Promise<ContactCommonRes<InsertPersonalOrgRes>>;

  /**
   * 修改个人分组信息
   */
  doUpdatePersonalOrg(
    params: ContactAccountsOptionWithPartial<{ orgId: string; groupName: string; idList: string[]; isMark?: boolean }>
  ): Promise<ContactCommonRes<InsertPersonalOrgRes>>;

  /**
   * 通过分组id获取关联联系人详情
   * @param id
   */
  doGetPersonalOrgContactByOrgId(params: ContactAccountsOption<{ id: string | string[] }>): Promise<ContactCommonRes<PersonalOrgContactModel>>;

  /**
   * 通过分组id新增联系人
   * @param idList 联系人id
   * @param orgIdList 分组id列表
   */
  doInsertContactByPersonalOrgId(params: ContactAccountsOptionWithPartial<{ orgIdList: string[]; idList: string[] }>): Promise<ContactCommonRes>;

  /**
   * 记录通讯录相关信息
   */
  contactLog(key: string, data?: resultObject): void;
}

export type typeOrTypeArray<T, U> = T extends string ? U : Array<U>;

export interface ContactApi extends Api {
  contactServer: ContactServer;
  doGetBKContactReady(): Promise<boolean>;
  /**
   * 更新用户
   * @param params 更新需要的参数
   */
  doUpdateContact(params: ContactAccountsOptionWithPartial<{ params: contactUpdateParams }>): Promise<CatchErrorRes<ContactModel[]>>;

  /**
   * 删除用户
   * @param params 删除需要的参数
   */
  doDeleteContact(params: ContactAccountsOptionWithPartial<contactDeleteParams>): Promise<boolean>;

  /**
   * 新增用户
   * @param params 新增需要的参数
   */
  doInsertContact(params: ContactAccountsOptionWithPartial<{ list: contactInsertParams | contactInsertParams[] }>): Promise<CatchErrorRes<ContactModel[]>>;

  /**
   * 更新用户头像
   * @param params 更新需要的参数
   */
  uploadIcon(params: ContactAccountsOptionWithPartial<uploadIconParams>): Promise<uploadIconRes>;

  deleteAvatarIcon(): Promise<ResponseData>;

  /**
   * 增量修改个人通讯录数据
   * @param condition: httpApi掉用后服务器返回的数据
   * @param _account: 账号
   */
  doInsertOrReplacePersonal(params?: ContactAccountsOptionWithPartial<{ data: ResponseData<resultObject[]> }>): Promise<CatchErrorRes<ContactModel[]>>;

  /**
   * 通过组织id获取下属的联系人
   */
  doGetColleagueByOrgIds(params: { idList: string[] }): Promise<Record<string, ContactModel[]>>;

  /**
   * 获取所有下属联系人
   */
  doGetColleagueList(): Promise<ContactModel[]>;

  /**
   * 使用联系人的联系条目信息获取联系人数据
   * @param params
   */
  doGetContactByEmailsAdvance(params: GetEmailDatatParams): Promise<{
    listRes: ContactModel[];
    mapRes: Record<string, ContactModel[]>;
  }>;
  /**
   * 使用联系人的联系条目信息获取联系人数据
   * @param condition
   */
  doGetContactByItem(condition: contactCondition): Promise<ContactModel[]>;

  doGetContactByEmail(params: { emails: string[]; _account?: string; useData?: ContactDataFrom }): Promise<Record<string, ContactModel[]>>;

  doGetContactByEmailFilter(params: { emails: string[]; _account?: string }): Promise<Record<string, ContactModel>>;

  doGetContactByYunxin(accounts: string[], showDisabled?: boolean): Promise<YunxinContactModel>;

  doGetServerContactByYunxin(accounts: string[]): Promise<ContactModel[]>;
  doGetServerContactByEmails(emails: string[], account?: string): Promise<ContactModel[]>;

  /**
   *  根据 emails 获取联系人
   * @param emails
   * @param type
   */
  doGetContactByEmails(emails: { mail: string; contactName?: string }[], type: MemberType): Promise<MailBoxEntryContactInfoModel[]>;
  /**
   * 获取企业通讯录列表
   * @param params orgId 所属组织id
   */
  doGetContactByOrgId(params: RequestContactOrgParams): Promise<ContactModel[]>;

  transContactModel2ContactItem(item: ContactModel): ContactItem;

  /**
   * 获取个人通讯录列表
   */
  doGetPersonalContact(option?: PersonalContactOption): Promise<ContactModel[]>;

  /**
   * 获取个人通讯录无分组列表
   */
  doGetPersonalNoGroupContact(_account?: string): Promise<ContactModel[]>;

  // 获取最近联系人接口
  getRecentContactList(params: recentContactListParams, noCache?: boolean): Promise<recentContactListRes[]>;
  // 添加最近联系人接口
  addRecentContact(params: ContactAddRecentParams): Promise<boolean>;
  // 查看邮件列表成员
  getMaillistMember(accountName: string): Promise<maillistMemberRes>;
  // 新建邮件列表成员 临时
  createMaillist(maillistMember: MailListMember): Promise<any>;
  // 编辑邮件列表成员 临时
  updateMaillist(maillistMember: MailListMember): Promise<any>;
  // 删除邮件列表成员 临时
  deleteMaillist(delMailListParams: DelMailListParams): Promise<maillistMemberRes>;
  // 获取域名列表
  listUserDomain(): Promise<any>;
  // 我管理的邮件列表
  listUserMaillist(type?: number): Promise<ContactCommonRes<UserMailListResultData[]>>;
  // 查看邮件列表详情
  getMaillist(getMailListParams: GetMailListParams): Promise<any>;
  // 获取用户基本信息
  getMaillistConfig(): Promise<any>;
  // 校验邮箱列表账号
  checkMaillistAccountName(mailListMember: MailListMember): Promise<any>;
  /**
   * 搜索通讯录群组名称或者群成员名称
   * @param query 搜索关键字
   */
  doSearchTeamContact(query: string): Promise<SearchTeamContactRes>;

  /**
   * 集合搜索
   */
  doSearch(condition: SearchCondition): Promise<SearchGroupRes>;

  /**
   * 集合搜索，在外贸通场景下代替doSearchNew，不去代理，直接在前台完成
   */
  doSearchAllContactNew(condition: MemorySearchCondition): Promise<MemorySearchGroupRes>;
  /**
   * 集合搜索在内存中
   */
  doSearchNew(condition: MemorySearchCondition): Promise<MemorySearchGroupRes>;
  /**
   * 集合搜索在内存中
   */
  doSearchInMemory(condition: MemorySearchCondition): Promise<MemorySearchGroupRes>;

  /**
   * 搜索通讯录所有内容
   * @param condition 搜索条件
   * @param noLock 是否上锁
   */
  doSearchAllContact(condition: SearchCondition, noLock?: boolean): Promise<SearchAllContactRes>;

  /**
   * 搜索通讯录
   * @param query 搜索内容
   * @param isIM 是否处理im数据
   * @param noLock 是否上锁
   */
  doSearchContact(query: string, isIM?: boolean, noLock?: boolean): Promise<ContactModel[]>;

  /**
   * 搜索通讯录
   * @param query 搜索内容
   * @param isIM 是否处理im数据
   * @param maxItem 查询数量
   */
  doSearchContactNew(query: string, isIM?: boolean, maxItem?: number): Promise<SearchContactMemoryRes>;

  /**
   * 多账号通讯录搜索
   * @param condition 搜索内容
   */
  doSearchContactByAccounts(condition: SearchCondition): Promise<Record<string, SearchAllContactRes>>;

  /**
   * 获取通讯录详情
   * @param id
   */
  doGetContactById(id: string | string[], _account?: string): Promise<ContactModel[]>;

  /**
   * 从内存数据中获取通讯录详情失败之后的前台兜底方案
   */

  doGetContactByIdsNew(id: string | string[]): Promise<ContactModel[]>;

  /**
   * 通过IM(teamId + yunxinId)查找 联系人关联表信息
   * @param params.idList: 群成员id列表
   * @param params.orderBy: 是否按照joinTime排序
   */
  doGetOrgContactListByIM(params: OrgContactCondition): Promise<Array<EntityOrgTeamContact | EntityOrgTeamContact[]>>;

  /**
   * 通过teamId查找 联系群成员关联信息
   * @param params.idList: 群成员id列表('team_' 拼接的)
   * @param params.orderBy: 是否按照joinTime排序
   * @param params.needGroup: 是否按照id分组排序
   * @param params.needContactData: 得到的数据是否关联contact详细信息
   */
  doGetOrgContactListByTeamId(params: OrgContactCondition): Promise<Array<EntityOrgTeamContact | EntityOrgTeamContact[]>>;

  /**
   * 更新单个联系人信息
   * @param params 来信人id必传，加上需要更新的信息
   */
  doUpdateContactById(params: ContactEntityUpdateParams): Promise<boolean>;

  /**
   * 更新联系人的信息
   */
  doUpdateContactModel(params: Partial<ContactModel>[]): Promise<boolean>;

  /**
   * 根据联系人email获取联系人展示背景颜色
   * @param email
   */
  getColor(email: string): string;

  isInited(): boolean;

  doGetModelDisplayEmail(model: ContactModel | EntityContact): string;

  doGetContactLastUpdateTime(_account?: string): number;
  // 获取星标列表
  doGetPersonalMarkList(
    args?: (string | number)[],
    field?: 'value' | 'email',
    options?: {
      needMemberEmail?: boolean;
    },
    _account?: string
  ): Promise<ContactPersonalMarkSimpleModel[]>;

  // 获取通讯录星标列表
  doGetContactPersonalMarkList(): Promise<ContactOrgItem[]>;

  // 批量操作星标
  doBatchOperatePersonalMark(params: PersonalMarkParams[], action?: 'add' | 'cancel'): Promise<{ success: boolean; msg: string }>;

  // 通过email获取星标数据列表
  doGetPersonalMarklistByEmail(params: { emails: string[]; _account?: string }): Promise<Map<string, EntityPersonalMark[]>>;

  /**
   * 导入个人联系人
   * @param params：联系人分组id，文件格式，
   * @returns 是否成功
   */
  doImportPersonalContact(params: PersonalImportParams): Promise<ContactCommonRes<number>>;

  /**
   * 导出个人联系人
   * @param params 联系人分组id，文件格式
   * @returns 下载地址
   */
  doExportPersonalContact(params: PersonalExportParams): Promise<ContactCommonRes<string>>;

  /**
   * 导出个人联系人模板
   * @param type: 1 csv,2 vcs
   * @returns 下载地址
   */
  doExportPersonalContactTemplate(type?: 1 | 2): Promise<ContactCommonRes<string>>;

  // 更新星标未读邮件数
  doUpdateMarkUnreadMailCount(idMap: Record<string, number>, _account?: string): Promise<EntityPersonalMark[]>;

  // 从服务端查询通讯录数据
  doGetContactByQiyeAccountId(query: { idList: string[]; domain?: string; _account?: string; enablePutLocal?: boolean }): Promise<ContactModel[]>;

  // 检测DB是否OK
  detectCoreEnterpriseHasData(from?: 'enterprise' | 'org' | 'personal' | 'personalOrg'): Promise<'none' | 'core' | 'all'>;

  findContactInfoVal(contactInfoList: EntityContactItem[], type?: ContactInfoType): string;

  // 查询通讯录个人分组下成员数量(这个功能没有必要集成到API中 UI调用就可以)
  queryPersonalMemberCount(ids: string[], account?: string): Promise<Record<string, number>>;

  deleteTrashContactByManual(): Promise<boolean>;

  addFrequentContact(params: ContactAccountsOption<{ list: Record<'contactId' | 'email', string>[]; type?: 'im' | 'mail' }>): Promise<void>;
}

/**
 * @deprecated
 * @date 05/07/2023
 * @interface EdmContactApi
 */
export interface EdmContactApi {
  /**
   * 搜索我的客户列表
   */
  doSearchMyCustomer(condition: MemorySearchCondition): Promise<CustomerOrgSearch[]>;
  /**
   * 同步客户信息
   */
  syncCustomer(): Promise<any>;
  /**
   * 线索转为客户
   */
  doUpdateClueToCustomer(params: { clueId: string; email: string; customerData: resultObject }): Promise<ContactModel | undefined>;
  /**
   * 陌生人添加客户
   */
  doInsertCustomer(params: { customerData: resultObject; customerType?: CustomerOrgType }): Promise<ContactModel[] | undefined>;
  /**
   * 通过id删除DB中的客户数据
   */
  deleteDataByOrgId(params: { idList: string[] }): Promise<{ success: boolean; err?: any }>;
  doSetLastEdmRoleData(params: { privilegeMap?: Map<string, Set<string>>; contactPrivilegeRangeData?: string[] }): void;
  /**
   * 获取客户/线索列表
   */
  doGetCustomerOrgList(params?: { type?: CustomerOrgType; idList?: string[] }): Promise<CustomerOrg[]>;
  // 获取客户最后更新时间
  doGetEdmLastUpdateTime(): number;
  // 将本地的客户id转服务端使用的id
  doTransLocal2ServerCustomerId(id: string): string;
  /**
   * 分页获取本地我的客户列表
   */
  doGetMyCustomerList(params: MyCustomerListParams): Promise<EntityCustomerOrg[]>;

  /**
   * 分页获取本地客户列表
   */
  doGetCustomerListFromDb(params: CustomerListParams): Promise<CustomerEntityForMail[]>;

  /**
   * 分页获取远端客户列表
   */
  doGetCustomerListFromServer(params: CustomerListParams): Promise<CustomerEntityForMail[]>;

  /**
   * 批量查询远端客户列表
   */
  doGetCustomersFromServerBatch(params: { idList: string[] }): Promise<CustomerEntityForMail[]>;

  /**
   * 保存客户数据
   */
  doSaveCustomerToDb(data: CustomerEntityForMail[]): Promise<void>;

  /**
   * 删除我的客户数据（将当前用户从负责人中去除）
   */
  doDelCustomerManager(params: { idList: string[] }): Promise<void>;

  /**
   * 通过 ID 获取客户数据
   */
  doGetCustomerFromDbByIds(params: { idList: string[] }): Promise<CustomerEntityForMail[]>;

  doGetCustomerContactByEmails(params: { emails: string[] }): Promise<Record<string, ContactModel>>;

  /**
   * 通过idList 获取列表
   */
  doGetCustomerContactByIds(params: { idList: string[] }): Promise<ContactModel[]>;
  /**
   * 通过客户/线索id  获取对应的联系人
   * @param params
   */
  doGetCustomerContactByOrgIds(params: { idList: string[] }): Promise<Record<string, ContactModel[]>>;

  /**
   * 通过客户/线索id  获取对应负责人的信息
   * @param params 线索客户id
   */
  doGetCustomerManagerByIds(params: { idList: string[] }): Promise<Record<string, SimpleContactModel[]>>;
}

export type ContactAndOrgApi = ContactApi & OrgApi & MeetingRoomApi;
// ---------------------------- db contact impl define start ----------------------- //
export type ContactLastTimeKey = 'enterprise' | 'org' | 'personal' | 'client' | 'personalOrg';
export type ContactDBFnName = 'enterpriseAllInto' | 'orgAllInto' | 'personalAllInto' | 'personalOrgAllInto';
export type timeKeyMap = Record<ContactLastTimeKey, string>;
export type ContactDBFnNameMap = Record<ContactServerSyncType, ContactDBFnName>;
export type ContactSyncErrorTimes = {
  [key in ContactServerSyncType | 'team' | 'local']?: number;
};
export type fnName = 'enterpriseInto' | 'orgInto' | 'personalInto';
export type ContactServerSyncType = Exclude<ContactLastTimeKey, 'client'>;
export type ContactServerUrlMap = Record<ContactServerSyncType, URLKey>;

export interface OrgEntityMap {
  [contactId: string]: EntityOrg[];
}

export interface OrgIdContactModelMap {
  [orgId: string]: ContactModel[];
}

export interface transformData {
  contactList?: EntityContact[];
  contactInfoList?: EntityContactItem[];
  orgData?: OrgEntityMap;
  needOrgData?: boolean;
  orderByIdList?: string[];
  contactIdMap?: identityObject<EntityContact>;
  contactInfoIdMap?: identityObject<EntityContactItem[]>;
  flattenMuliptleEmails?: boolean;
  _account?: string;
}

export interface transformOrgDataConfig {
  level?: number;
  orgId?: string; // 当前组织id
  orgAllList: EntityOrg[]; // 所有组织列表
  orgAllMap: identityObject<EntityOrg | undefined>; // 所有组织列表以id对应的map
  _account?: string;
}

export interface ContactInitModel {
  orgs: OrgModel | resultObject;
  personal: ContactModel[];
}

export type diffList<T = any> = Array<T>;

export interface GetDiffParams {
  list: resultObject[];
  tableName: string;
  type?: ContactType;
}

export interface diffRes<T = any> {
  deleteDiff?: diffList<T>;
  insertDiff?: diffList<T>;
  updateDiff?: diffList<T>;
}

export type tableType =
  | 'contact_personal'
  | 'contactItem_personal'
  | 'contact_enterprise'
  | 'contactItem_enterprise'
  | 'contact'
  | 'org'
  | 'org_personal'
  | 'orgContact_personal'
  | 'orgContact_enterprise';
export type syncRes<T = string> = {
  [props in tableType]?: diffRes<T>;
} & {
  isAll?: boolean;
  syncStatus?: SyncResponseStatus;
  hasDiff?: boolean;
  contactSyncTimes?: number;
  _account?: string;
  emails?: string[];
  insertCountMap?: Partial<Record<contactTableNames, number>>;
};

export interface ContactEdmSyncRes {
  contactList?: string[];
  orgList?: string[];
  customerSyncTimes?: number;
  needSync?: boolean;
  type?: 'customer' | 'clue';
  isForce?: boolean;
}
export type SyncFrom = 'enterprise' | 'org' | 'personal' | 'team' | 'local' | 'personalOrg' | 'customer' | 'clue';
export type OmitSyncFrom = 'enterprise' | 'org' | 'personal' | 'team' | 'local' | 'personalOrg';
export type SyncResponseStatus = {
  [props in SyncFrom]?: boolean;
};

export interface CoreSyncResponseModal extends SyncResponseModal {
  count: number;
}

export interface SyncResponseModal {
  from: OmitSyncFrom;
  success: boolean;
  data?: syncRes[];
  message?: string;
  error?: Error;
  count?: number;
  _account?: string;
}

export interface DeleteListParams {
  list: resultObject[];
  tableName: string;
  type?: ContactType;
}

export interface AccountNameAndContactName {
  accountName: string;
  contactName: string;
}

export interface hitQueryConfig {
  // 原始数据
  originList: ContactModel[];
  // 命中的表
  hitTable: contactTableNames[];
  // 搜索的值集合
  hitQueryList: Array<any>;
  // 命中key
  hit: Array<KeyOfEntityContactItem | KeyOfEntityContact>;
}
export interface UtilHitQueryConfig<T> {
  // 原始数据
  data: T[];
  // 搜索的值集合
  queryList: string[];
  // 命中key (可以是对象下的属性，也可以是对象下面的某个对象的属性 eg: {a: {b:'c'}, d: 'e'} [['a', 'b'],'d'])
  hitList: Array<[string, string] | string>;
}

export type UtilHitParams = Array<[string, string] | string>;

export interface UtilHitQueryConfigItem<T> {
  // 原始数据
  data: T;
  // 搜索的值集合
  queryList: string[];
  // 命中key (可以是对象下的属性，也可以是对象下面的某个对象的属性 eg: {a: {b:'c'}, d: 'e'} [['a', 'b'],'d'])
  hitList: Array<[string, string] | string>;
}

export interface defaultHit {
  hitQuery?: string[];
  [props: string]: any;
}

export interface CorpApiContactItem {
  orgId: number;
  domain: string;
  qiyeAccountId: string;
  qiyeAccountName: string;
  qiyeNickName: string;
  email: string;
  job: string;
  mobile: string;
  // 账号类型type: -1-管理员；0-邮件列表；2-普通账号；4-动态邮件列表；101-公共联系人
  type: number;
  addrVisible: number;
  addrRight: number;
  gender: string;
  state: string;
  // 账号状态枚举值，0 正常状态；1-禁用；2-删除；3-物理删除；4-离职；5-交接中；6-已交接
  status: number;
  tel: string;
  qiyeAccountRank: number;
  unitIdList: Array<string>;
  oriUnitIdList: Array<string>;
  yunxinAccountId: string;
  yunxinToken: string;
  yunxinTokenExpireTime: number;
  iconVO: {
    bigUrl: string;
    mediumUrl: string;
    smallUrl: string;
  };
  pinyinName: Array<string>;
  enableIM: boolean;
  // 0-展示；1-通讯录设置为不可展示；2-无限先查看通讯录；3-无权限查看部门；4-用户状态非正常不可查看;
  // 5-用户设置为他人不可见；6-部门状态为删除状态，不可见；
  showCode: number;
  showReason: string;
}

export interface UpdateContactModelRes {
  personalIdList: string[];
  enterpriseIdList: string[];
}

export interface SearchGroupRes {
  main: Record<string, SearchAllContactRes>;
  // 出参调整一下
  // edm?: CustomerSearchRes;
  edm?: CustomerSearchContactMemoryRes;
}

export interface MemorySearchGroupRes {
  main: Record<string, SearchContactMemoryRes>;
  edm?: CustomerSearchContactMemoryRes;
}

export interface ContactUnitPathNameModel {
  contactCount: number;
  orgId: number;
  oriUnitId: string;
  parentUnitId: string;
  showCode: number;
  showReason: string;
  status: number;
  type: number;
  unitId: string;
  unitName: string;
  unitRank: number;
}

export interface ContactAccountInfo {
  orgId: number;
  qiyeAccountId: string;
  accountName: 'guochao03';
  email: 'guochao03@office.163.com';
  nickName: string;
  senderName: '郭超';
  display: true;
  yunxinAccountId: string;
  yunxinToken: string;
  yunxinTokenExpire: '1631186965187';
  iconVO: Record<'bigUrl' | 'mediumUrl' | 'smallUrl' | 'pendantUrl', string>;
  unitNameList: string[];
  node: 'hz';
  unitPathList: ContactUnitPathNameModel[][];
  domainShareList: [];
  domainLogo: string;
  [key: string]: unknown;
}

export interface ContactServerVOModel {
  orgId: number;
  domain: string;
  qiyeAccountId: number;
  qiyeNickName: string;
  type: 2;
  totalPage: number;
  source: 'lingxi' | '';
  addrVisible: 1 | 0; // 通讯是否可见， 1可见；0不可见；(是否可见是指是否在通讯录中出现)
  status: 0 | 1 | 2 | 3 | 4 | 5;
  tel: string;
  qiyeAccountRank: number;
  unitNamePathList: ContactUnitPathNameModel[][];
  yunxinAccountId: string; // 运行ID
  yunxinToken: string; // 云信Token，只能查看到自己的token
  yunxinTokenExpireTime: number; // token过期时间，只能查看到自己的过期时间
  unitIdList: string[];
  oriUnitIdList: string[];
  pinyinName: string[];
  enableIM: boolean; // 是否可以进行IM聊天
  iconVO: Record<'bigUrl' | 'mediumUrl' | 'smallUrl' | 'pendantUrl', string>;
  showCode: number; // 0：通讯录可以展示； 非0：不可展示
  showReason: string; // 不可展示原因
  email: string;
  displayEmail: string;
  job: string;
  accountRankList: { accountRank: number; unitId: string }[];
}

export interface ContactServerModel {
  totalPage: number; // 总共页数
  pageIndex: number; // 当前请求页
  source: 'qiye' | 'lingxi' | 'unknown'; // 数据来源， 用于下次请求的参数, 见上表格
  extVersion: string; // 强制更新全量数据的版本
  defaultPriority: 0;
  contactVOList: ContactServerVOModel[];
}

// ---------------------------- db contact impl define end ----------------------- //

export interface ContactSearch {
  /**
   * 联系人id
   */
  id: string;
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
   * 职务
   */
  position?: string[][];
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
   * 账号是否可见
   */
  visibleCode: number;

  // 是否可以IM
  enableIM: boolean;

  // im通信id
  yunxin: string;

  /**
   * 账号类型 (-1:管理员 0:邮件列表 1:别名账号 2:普通账号 4:动态邮件列表 101:公共联系人)
   */
  accountType: number;
  isDefault?: number;
  hitQueryEmail?: string;
  hitQuery?: string[];
  remark?: string;
  emailCount?: number;
}

export interface OrgSearch {
  id: string;
  originId?: string;
  // 当前这个组织属于哪个关联企业
  enterpriseId?: number;
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
   * 0:普通部门
   * 1:公共联系人
   * 2:邮件列表
   * 99:企业顶级部门
   * 2000: 群组
   * 2001: 个人分组
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
  hitQuery?: string[];
  memberNum?: number;
}
// 企业 | 个人 | 群组 | 最近 | 陌生人
export type ContactTreeType = 'enterprise' | 'personal' | 'team' | 'recent' | 'external' | 'customer' | 'clue' | 'other' | 'openSea';

export type ContactTreeOrgType = 'org' | 'team' | 'personalOrg' | 'customer' | 'clue' | 'openSea';

export type ContactMultileAccountOption<T = Record<string | number | symbol, unknown>> = {
  isMainAccount?: boolean;
  _account: string;
} & T;

export type ContactAccountsOption<T = Record<string | number | symbol, unknown>> = {
  isMainAccount?: boolean;
  _account: string;
} & T;

export type ContactAccountsOptionWithPartial<T> = Omit<ContactAccountsOption<T>, '_account'> & Partial<Pick<ContactAccountsOption<T>, '_account'>>;

export interface ContactItem {
  renderKey?: string;
  parentId?: string;
  id?: string;
  type: ContactTreeType;
  avatar?: string;
  name: string;
  email: string;
  accountType?: number;
  position?: string[][];
  customerRole?: EmailRoles;
  createTime?: number;
  hitQuery?: string[];
  marked?: number;
  /**
   * 头像挂饰
   */
  avatarPendant?: string;
  mailMemberType?: MemberType;
  emailList?: string[];
  labelPoint?: string;
  // 加入redux的时间
  reduxUpdateTime?: number;
  emailCount?: number;
  remark?: string;
  _account?: string;
}

export interface OrgItem {
  id: string;
  originId: string;
  orgType: ContactTreeOrgType;
  type: number;
  customerRole?: EmailRoles;
  orgRank: number;
  orgName: string;
  hitQuery?: string[];
  avatar?: string;
  createTime?: number;
  children?: ContactItem[];
  marked?: number;
  memberNum?: number; // 群组需要
}

export type ContactOrgItem = ContactItem | OrgItem;

export interface ContactPersonalMarkNotifyEventData {
  actionType: 'update' | 'delete';
  isAll?: boolean;
  data: EntityPersonalMark[];
  noNewMarkData?: boolean;
}

export interface CoreContactServerResponse {
  statusCode: number;
  message: string;
  source: 'lingxi' | 'qiye';
  orgId: number;
  iconPrefix: string;
  lastUpdateTime: number;
  incTimeInternal: number;
  contactVOList: CoreContactServerRawData[];
}

export interface CoreContactServerRawData {
  domain: string;
  accountId: string;
  accountName: string;
  nickName: string;
  type: number;
  mediumIconUrl: string;
  smallIconUrl: string;
  email: string;
  orgId: number;
  rankList: {
    unitId: string;
    accountRank: number;
  }[];
}

export interface CoreOrgServerResponse {
  statusCode: number;
  message: string;
  source: 'lingxi' | 'qiye';
  orgId: number;
  lastUpdateTime: number;
  incTimeInternal: number;
  unitVOList: CoreOrgServerRawData[];
}

export interface CoreOrgServerRawData {
  unitId: string;
  unitName: string;
  oriUnitId: string;
  parentUnitId: string;
  unitRank: number;
  rank: number;
  type: number;
}

export interface EntityOrgPathList {
  id: string;
  parentId: string;
  pathIdList: string[];
  pathNameList: string[];
  enterpriseId: number;
}

export interface CoreContactEvent {
  status: 'start' | 'finish' | 'clean';
  from: 'db' | 'server';
  isMainAccount?: boolean;
  _account?: string;
  // 是否可以跳过全量同步
  enableSkipFullSync?: boolean;
  coreCount?: number;
}

export interface CustomerLstFromManagerIdRes {
  loadMore: boolean;
  list: resultObject[];
  from: 'all' | 'filter';
}
