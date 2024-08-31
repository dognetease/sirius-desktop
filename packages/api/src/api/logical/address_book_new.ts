import type { GroupedFilter } from '@lxunit/app-l2c-crm';
import { ApiRequestConfig } from '@/api/data/http';
import { Api } from '@/api/_base/api';

export type QuickMarktingGroupType = 'INITITAL' | 'CUSTOMIZE';

export enum AddressBookNewGroupType {
  SYSTEM = 0,
  USER = 1,
}

export interface AddressBookNewGroup {
  groupId: number;
  groupName: string;
  groupType: AddressBookNewGroupType;
  addressNum: number;
  createTime: string;
  hasAutoMarket: boolean;
  top: boolean;
}

// 分组类型，0:默认分组 1:用户分组
export type marktingGroupType = 0 | 1;
export interface GetGroupListParams {
  // 模糊匹配组名
  group_name_fuzzy?: string;
  // 组名
  group_names?: string;
  group_type?: marktingGroupType;
  ids?: number[];
  page: number;
  page_size: number;
}

export interface MarktingContactGroup {
  count: number;
  edm_plan_id: string;
  group_name: string;
  group_type: number;
  id: number;
  all_group_key: string[];
  create_time: string;
  group_key: string;
}

export interface MarktingGroupPageInfo {
  firstSortValue: unknown[];
  lastSortValues: unknown[];
  order_by: string;
  // 原始数据大小 不随着筛选条件改变
  original_size: number;
  page: number;
  page_size: number;
  total_page: number;
  total_size: number;
}

export interface AssociateMarktingParam {
  group_id: number;
  edm_plan_id: string;
}

export interface AddGroup2GroupParams {
  src_group_id: number;
  target_group_ids: number[];
}

export interface TransferContact2GroupParmas {
  contact_ids: number[];
  target_group_ids: number[];
}

export interface QuickMarktingGroup {
  group_filter_settings: {
    grouped_filter: GroupedFilter;
  };
  group_id: number;
  group_name: string;
  type: QuickMarktingGroupType;
}

export interface QuickMarktingGuideItem {
  guide_content: string;
  guide_filter: GroupedFilter;
  guide_number: number;
}
export interface QuickMarktingGuideList {
  guides: QuickMarktingGuideItem[];
  suggest: string;
}

export interface IAddressBookGroupItem {
  count: number;
  edmPlanId: string;
  groupName: string;
  groupType: number;
  id: number;
}

export interface IAddressBookCreateType {
  id: string;
  label: string;
}

export interface IAddressBookContactListItem {
  email: string;
  contactId: string;
  contactName: string;
  groupNames: Array<{
    groupId: string;
    groupName: string;
  }>;
  mailMarketHistoryStatus: 'success' | 'warn' | '';
  mailMarketingHistory: string;
  area: string;
  companyName: string;
  job: string;
  createTypeId: string;
  createTypeName: string;
  createTime: string;
  lastSendTime: string;
  leadsId: string;
  leadsName: string;
  valid: boolean;
  source_name: string;
}

export interface CustomerContactInfo {
  contact_content: string;
  contact_type: string; // 联系方式类型， EMAIL 邮箱， TEL 电话，WHATSAPP
  valid: boolean;
  verify_status: number;
}

export interface EdmEmailStatisticVO {
  [key: string]: unknown;
}

export interface ContactExtInfo {
  [key: string]: unknown;
}

export interface LeadsContactGroupVO {
  [key: string]: unknown;
}

export interface SocialPlatformVO {
  [key: string]: unknown;
}
export interface BusinessContactVO {
  address: string[];
  area: string[];
  attachment: string;
  birthday: string;
  blacklist: boolean;
  city: string;
  department: string;
  home_page: string;
  label_list: string[];
  gender: string;
  contact_icon: string;
  contact_id: string;
  contact_infos: CustomerContactInfo[];
  contact_name: string;
  continent: string;
  country: string;
  create_time: string;
  create_type: number;
  edm_email_statistic: EdmEmailStatisticVO[];
  decision_maker: boolean;
  email: string;
  ext_infos: ContactExtInfo[];
  groups: LeadsContactGroupVO[];
  homepage: string;
  job: string;
  leads_company_name: string;
  leads_id: number;
  leads_name: string;
  main_contact: boolean;
  province: string;
  rejected: boolean;
  remark: string;
  social_platform: SocialPlatformVO[];
  source_name: string;
  telephone: string;
  valid: boolean;
  verify_status: number;
  whats_app: string;
}

export interface IAddressBookContactList {
  ascFlag: boolean;
  totalCount: number;
  pageSize: number;
  page: number;
  list: Array<IAddressBookContactListItem>;
}

export interface RecycleListReqV2 {
  asc: boolean;
  order_by: string;
  page: number;
  page_size: number;
}

export interface RecycleContactVO {
  contact_email: string;
  contact_id: number;
  contact_name: string;
  create_time: string;
  delete_time: string;
  recycle_contact_id: number;
}
export interface RecycleListResV2 {
  asc_flag: boolean;
  content: RecycleContactVO[];
  firstSortValues: string[];
  lastSortValues: string[];
  order_by: string;
  original_size: number;
  page: number;
  page_size: number;
  total_page: number;
  total_size: number;
}

export interface AddressBookApiRequestConfig extends ApiRequestConfig {
  timeout?: number;
  toastError?: boolean;
  hideErrorToast?: boolean; // 后期补充维http_impl 服务
  errorTitle?: string;
}

export interface AddressBookNewApi extends Api {
  // 获取快捷营销列表
  getQuickMarktingList(): Promise<QuickMarktingGroup[]>;
  // 获取快捷营销列表对应的数量
  getQuickMarktingGroupCount(params: { type: QuickMarktingGroupType; groupId: number }): Promise<number>;

  // 创建快捷营销分群
  createQuickMarktingGroup(parmas: Pick<QuickMarktingGroup, 'group_filter_settings' | 'group_name'>): Promise<number>;

  // 删除快捷营销分群
  deleteQuickMarktingGroup(parmas: { groupId: number }): Promise<void>;

  // 获取引导
  getQuickMarktingGuideList(params: { groupId: number }): Promise<QuickMarktingGuideList>;

  // deleteAllFromRecycle(): Promise<void>;

  // 获取营销联系人群组
  getGroupList(params: Partial<GetGroupListParams>): Promise<MarktingContactGroup[]>;

  // 分页方式获取营销群组列表
  getGroupListWithPage(params: Partial<GetGroupListParams>): Promise<
    {
      content: MarktingContactGroup[];
    } & MarktingGroupPageInfo
  >;

  // 查询筛选条件下的email列表
  getMarktingFiltedEmails(
    params: Partial<{ groupedFilter: GroupedFilter; page_size?: number; group?: MarktingContactGroup }>,
    config?: AddressBookApiRequestConfig
  ): Promise<BusinessContactVO[]>;

  // 新建分组
  createGroup(name: string): Promise<MarktingContactGroup>;

  // 关联营销托管任务
  associateEdm(params: AssociateMarktingParam[]): Promise<void>;

  // 将联系人添加到分组
  addContact2Group(params: { contact_ids: number[]; target_group_ids: number[] }): Promise<void>;

  // 删除分组
  deleteGroup(groupId: number): Promise<void>;
  updateGroup(groupId: number, groupName: string): Promise<void>;

  // 批量将分组内添加到另外一个分组
  addGroup2Group(params: AddGroup2GroupParams): Promise<void>;

  // 转移分组
  transferContact2Group(params: TransferContact2GroupParmas): Promise<void>;

  // 取消营销托管任务绑定
  cancelGroupEdm(groupIds: number[]): Promise<void>;

  getAllContactGroupList(filterDefaultGroup?: boolean): Promise<MarktingContactGroup[]>;

  getAllCreateTypeList(): Promise<IAddressBookCreateType[]>;

  searchContactList(param: any): Promise<IAddressBookContactList>;

  searchContactCount(param: any[]): Promise<number>;

  deleteContacts(req: { contact_ids: number[]; leads_id: number }): Promise<any>;

  batchDeleteContacts(req: { deleteList: Array<{ contact_id: number; leads_id: number }> }): Promise<any>;

  asyncDeleteContactsByEmails(req: { emails: Array<string> }): Promise<any>;

  addContactsToGroup(req: { contact_ids: Array<number>; target_group_ids: Array<number> }): Promise<void>;

  transferContactsToGroups(req: { contact_ids: Array<number>; target_group_ids: Array<number> }): Promise<void>;

  batchAddGroups(req: { groupNames: Array<string> }): Promise<MarktingContactGroup[]>;

  // 回收站相关功能
  getNewAddressRecycleList(req: Partial<RecycleListReqV2>): Promise<RecycleListResV2>;

  // 清空回收站
  emptyAddressRecycle(): Promise<void>;

  // 恢复回收站数据
  recoverAddressRecycle(recycleContactIds: number[]): Promise<void>;

  // 彻底删除回收站联系人
  deleteAddressRecycle(recycleContactIds: number[]): Promise<void>;

  // 获取营销联系人详情
  getRecycleDetail(recycleContactId: number): Promise<BusinessContactVO>;

  // 查询分群数量
  getGroupCountByFilter(params: Partial<{ group: MarktingContactGroup; filter: GroupedFilter }>): Promise<number>;
}
