import { Api, ContactModel, CustomerId, EMAIL, _ACCOUNT } from '../_base/api';
import { CustomerListParams, ServerCustomerModel, ServerCustomerContactModel } from './contact_edm';

// 同事＞自己的客户>同事的客户>公海客户>自己的线索>同事的线索>公海线索＞个人联系人＞陌生人

// 暂时未添加线索
export type EmailRoles =
  | 'myCustomer' // 我的客户
  | 'myClue' // 我的线索（0715未对接）
  | 'colleagueCustomer' // 同事的客户（『仅仅包含』有权限查看的同事的客户），
  | 'colleagueCustomerNoAuth' // 同事的客户（无权限），本期0715把此类数据忽略，进行下一个优先级的匹配
  | 'colleagueClue' // 同事的线索（0715未对接）
  | 'colleagueClueNoAuth' // 同事的线索（无权限）
  | 'enterprise' // 同事（企业联系人）
  | 'openSeaCustomer' // 公海客户
  | 'openSeaClue' // 公海线索（0715未对接）
  | 'personal' // 个人联系人
  | 'external'; // 陌生人

export type EmailRoleBaseScoreMap = Map<string, { score: number; data: EmailRoleBase }>;
// 客户id到角色的映射关系
export type TCustomerRoleMap = Record<CustomerId, EmailRoles>;

export interface RelatedCompanyInfo {
  companyId: string;
  companyName: string;
}

export interface EmailRoleBase {
  role: EmailRoles;
  email: string;
  companyId: string; // 客户ID、线索ID
  companyName: string; // 客户名称、线索名称
  contactId: string; // 与 email 匹配的联系人Id
  contactName: string; // 与 email 匹配的联系人姓名
  contactAvatar?: string; // 灵犀联系人有，外贸联系人没有
  customerCreateTime?: number; // 客户创建时间
  relatedCompanyInfo: RelatedCompanyInfo[]; // 匹配到的其他客户、线索下信息
}

export type EmailRoleBaseRes = Record<string, EmailRoleBase>;

export interface EmailPlusLabelServerRes {
  contact_email: string;
  id: number;
  company_name: string;
  contact_id: number;
  contact_name: string;
  create_time: number;
  // 4个人客户 5同事客户（服务端会返回，但是前端不处理） 7公海客户 8有权限的同事客户 9无权限的同事客户, 1:我的线索 10：同事线索 3：公海线索 11:无权限的同事线索
  email_label: 4 | 7 | 8 | 9 | 1 | 3 | 10 | 11;
}

export interface GetMyCustomerSearchPageSeverRes {
  page: number;
  page_size: number;
  total_page: number;
  total_size: number;
  content: Array<{ company_id: string; company_name: string; create_time: number }>;
}

export interface GetMyCustomerSearchSeverRes {
  contact_list: Array<{ company_id: number; contact_email: string; contact_id: number; contact_name: string; create_time: number }>;
  customer_list: Array<{ company_id: number; company_name: string; create_time: number }>;
}

export interface CustomerBaseInfo {
  customerId: string;
  customerName: string;
  customerCreateTime: number;
}

export interface OpportunityBaseInfo {
  opportunity_id: string;
  name: string;
  total_amount: string;
  status: number; // 商机状态 1-询盘, 2-方案报价，3-谈判，4-赢单，5-输单，6-无效, 服务端会加接口，返回映射关系
  settlement_currency: number; // 币种id
}

export interface CustomerContactBaseInfo {
  customerId: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactCreateTime?: number;
}

export interface SearchCustomerRes {
  customerList: CustomerBaseInfo[];
  customerContactList: CustomerContactBaseInfo[];
}

export interface SearchCustomerPageRes {
  data: CustomerBaseInfo[];
  pageSize: number; // 页码大小
  pageNum: number; // 页码数
  totalSize: number; // 总命中数
  totalNum: number; // 总页数
}

export interface OpportunityListRes {
  data: OpportunityBaseInfo[];
  pageSize: number; // 页码大小
  pageNum: number; // 页码数
  totalSize: number; // 总命中数
  totalNum: number; // 总页数
}

export interface statusBaseInfo {
  id: number;
  label: string;
  reserved: boolean;
  value?: string;
}

export interface OpportunityStatusRes {
  status: statusBaseInfo[];
  settlement_currency: statusBaseInfo[];
}

export interface ClueStatusRes {
  company_level: statusBaseInfo[];
  customer_stage?: statusBaseInfo[];
  status?: statusBaseInfo[];
  source?: statusBaseInfo[];
  star_level?: statusBaseInfo[];
}

export type SearchCustomerModule = 'customer' | 'customer_contact' | 'all';

// 客户数据变更事件传递数据
export interface CustomerMapChangeEvent {
  // 监听事件中，需要处理这个事件的地方
  target: 'myCustomerList' | 'all'; // 我的客户列表数据更新, 全量更新
  // 更新的客户id
  idList?: string[];
}

// 邮件+需要的模块权限
export interface MailPlusEdmPrivilegeViewData {
  customer: boolean; // 客户模块的查看权限
  openSeaCustomer: boolean; // 公海客户模块的查看权限
  clue: boolean; // 线索模块的查看权限
  openSeaClue: boolean; // 公海线索模块的查看权限
}

// 邮件+需要的数据权限
export interface MailPlusEdmPrivilegeRangeData {
  customer: string[] | undefined; // 客户模块的数据权限
  clue: string[] | undefined; // 线索模块的数据权限
}

// 获取联系人需要的参数
export interface IGetContactListParams {
  // 公海客户id, 客户id
  id: string;
  // 暂时只支持的3个类型
  emailRole: Extract<EmailRoles, 'myCustomer' | 'colleagueCustomer' | 'openSeaCustomer' | 'myClue' | 'colleagueClue' | 'openSeaClue'>;
  // 分页的页码
  page?: number;
  // 分页的一页数量 最大500一次
  pageSize?: number;
}

// 获取联系人返回的数据
export interface IGetContactListReturn {
  // 总大小
  totalSize: number;
  // 当前页码
  page: number;
  // 当前页数据
  data: ServerCustomerContactModel[];
  // 错误码
  error?: string;
  // 错误消息
  message?: string;
  // 是否请求成功
  success: boolean;
}

export interface MailPlusCustomerApi extends Api {
  // 根据 email 判断角色
  doGetRoleByEmail(params: { emails: string[]; _account?: string; useLx?: boolean; useEdm?: boolean }): Promise<EmailRoleBaseRes>;
  // 比较多个 contactModel，返回优先级最高的
  doCompareContactModelRoles(contactModels: ContactModel[]): ContactModel;
  // 比较多个 EmailRoleBase，返回优先级最高的
  doCompareEmailRoles(dataList: EmailRoleBase[]): EmailRoleBase;
  // 我的客户搜索（带分页），仅支持搜索客户名称
  doSearchCustomerPage(keyword: string, pageSize: number, page: number): Promise<SearchCustomerPageRes>;
  // 我的客户搜索（不带分页，带有limit），支持搜索客户名称
  doSearchCustomerAndContact(keyword: string, module: SearchCustomerModule, limit: number): Promise<SearchCustomerRes>;
  // 根据客户id批量获取客户详情数据
  doGetCustomerDataByIds(ids: CustomerId[], updateCustomerIdRoleMap?: TCustomerRoleMap): Promise<ServerCustomerModel[]>;
  // 根据客户详情数据获取客户角色
  doGetCustomerRoleByModel(model: ServerCustomerModel): EmailRoles;
  // 设置外贸相关权限
  doSetLastEdmPrivilegeData(params: { privilegeMap?: Map<string, Set<string>>; contactPrivilegeRangeData?: string[]; cluePrivilegeRangeData?: string[] }): void;
  // 获取外贸相关模块权限
  doGetLastEdmPrivilegeViewData(params: { privilegeMap?: Map<string, Set<string>>; contactPrivilegeRangeData?: string[] }): void;
  // 分页获取远端我的客户列表
  doGetCustomerListFromServer(params: CustomerListParams): Promise<ServerCustomerModel[]>;
  // 分页获取客户下的商机
  doGetOpportunityByCompany(page: number, size: number, companyId: string, status?: number[]): Promise<OpportunityListRes>;
  // 商机状态映射关系
  doGetOpportunityStatus(): Promise<OpportunityStatusRes>;
  // 通过id分页形式获取联系人信息
  doGetContactListByCompanyId(params: IGetContactListParams): Promise<IGetContactListReturn>;
  // 获取当前redux中展示的所有的邮件标签角色
  doGetDisplayEmailLabelMap(): Map<_ACCOUNT, Map<EMAIL, string>>;
  // 设置当前redux中展示的邮件标签角色
  doUpdateDisplayEmailLabelMap(params: { email: string; _account: string; name?: string; action?: 'add' | 'delete' }): void;
  // 线索状态映射关系
  doGetClueStatus(table: 'leads' | 'customer'): Promise<ClueStatusRes>;
  // 获取读信页是否需要弹窗标记营销有效回复
  doGetReplyMark(mid: string): Promise<{ visible: boolean }>;
  // 读信页弹窗标记营销有效回复
  doGetReplyMarkConfirm(mid: string, valid: boolean): Promise<any>;
}
