import { Api } from '@/api/_base/api';
import { ApiRequestConfig } from '@/api/data/http';

export enum AddressRepeatedAction {
  OVERRIDE = 'OVERRIDE',
  DISCARD = 'DISCARD',
  APPEND = 'APPEND',
}

export enum AddressRepeatedActionName {
  OVERRIDE = '以新联系人为准',
  DISCARD = '以历史联系人为准',
  APPEND = '合并',
}

export enum AddressBookEnumDemo {
  X = 'X',
  Y = 'Y',
}

export enum AddressBookContactAddressType {
  EMAIL = 1,
  WHATSAPP = 2,
}
// 地址来源类型
export enum AddressBookContactSourceType {
  '复制粘贴' = 1,
  '文件导入' = 2,
  '个人通讯录' = 101,
  '外贸通助手' = 102,
  '全球搜索' = 103,
  '海关数据' = 104,
  '客户联系人同步' = 105,
  '邮件营销导入' = 106,
  '智能引擎搜索' = 107,
  '营销托管' = 108,
  '领英搜索' = 109,
  '智能推荐' = 110,
  '线索联系人同步' = 111,
}

export interface AddressBookContactInfo {
  id: number;
  contactName: string;
  tels: string[];
  remark: string;
  groupIds: number[];
  createTime: string;
  updateTime: string;
  continent: string;
  country: string;
  province: string;
  city: string;
  companyName: string;
  companySite: string;
  verifyStatus: number;
  snsInfos: {
    name: string;
    type: number;
    value: string;
  }[];
  jobTitle: string;
}

export interface AddressBookAddressInfo {
  id: number;
  contactId: number;
  contactAddressInfo: string;
  contactSourceType: number;
  contactType: AddressBookContactAddressType;
  createTime: string;
  updateTime: string;
}

export enum AddressBookGroupType {
  SYSTEM = 0,
  USER = 1,
}

export interface AddressBookGroup {
  groupId: number;
  groupName: string;
  groupType: AddressBookGroupType;
  addressNum: number;
  createTime: string;
  hasAutoMarket: boolean;
  top: boolean;
}

export interface AddressBookMarketingInfo {
  openCnt: number;
  receivedCnt: number;
  replyCnt: number;
  sendCnt: number;
  unsubscribeCnt: number;
  latestSendTime: string;
}

export interface AddressBookCustomerInfo {
  uniCustomerId: string;
}

export interface AddressBookContact {
  contactInfo: AddressBookContactInfo;
  addressInfo: AddressBookAddressInfo;
  groupInfos: AddressBookGroup[];
  marketingInfo?: AddressBookMarketingInfo;
  customerInfo?: AddressBookCustomerInfo;
}

export type AddressBookFilterType = 'ordinary' | 'advanced';

export interface AddressBookContactsParams {
  quickFilter?: {
    relation: string;
    subs: Array<object>;
  };
  filter?: {
    relation: string;
    subs: Array<object>;
  };
  page?: number;
  page_size?: number;
  sort?: {
    field: string;
    direction: string;
  };
  groupFilter?: {
    relation: string;
    subs: Array<object>;
  } | null;
  resetFormFilter?: boolean;
}

export interface AddressBookNewContactsParams {
  quickFilter?: {
    relation: string;
    subs: Array<object>;
  };
  page: number;
  page_size: number;
  sort?: {
    field_id: string;
    reverse: boolean;
  };
}

export interface AddressBookSource {
  sourceName: string;
  sourceType: number;
  sourceStatus: number;
  isSystem: boolean;
  addressNum: number;
  groupIdList?: number[];
  existRule: boolean;
}

export interface AddressBookReturnOpenSeaParams {
  ids: number[];
  returnReason: string;
  returnRemark: string;
}

export interface AddressBookGroupsParams {
  groupName: string;
  groupType?: 0 | 1;
  page: number;
  pageSize: number;
}

export interface AddressBookGroupTopParams {
  groupId: number;
  top: boolean;
  param: {
    page: number;
    pageSize: number;
    groupName: string;
  };
}

export interface AddressBookEditAutoGroupParams {
  groupIdList: number[];
  sourceType: number;
  sourceStatus: number;
}

export interface AddressBookImportLxContactsRes {
  contactSuccessCnt: number;
  contactTotalCnt: number;
}

export interface AddressBookApi extends Api {
  getContacts(req: AddressBookContactsParams): Promise<{ list: AddressBookContact[]; total: number }>;
  deleteContacts(req: { ids: number[] }): Promise<any>;
  returnContactsToOpenSea(req: AddressBookReturnOpenSeaParams): Promise<{ result: boolean }>;
  getGroups(req: AddressBookGroupsParams): Promise<{ list: AddressBookGroup[]; total: number }>;
  postAddressBookGroupTop(req: AddressBookGroupTopParams): Promise<{ list: AddressBookGroup[]; total: number }>;
  getGroupDetail(req: { groupId: number }): Promise<AddressBookGroup>;
  deleteGroup(req: { groupId: number }): Promise<any>;
  updateGroupName(req: { groupId: number; groupName: string }): Promise<any>;
  getSources(): Promise<AddressBookSource[]>;
  addAutoGroup(req: AddressBookEditAutoGroupParams): Promise<any>;
  editAutoGroup(req: AddressBookEditAutoGroupParams): Promise<any>;
  removeContactsFromGroup(req: { groupIds: number[]; addressIds: number[] }): Promise<any>;
  checkLxContactsHasSync(): Promise<{ result: boolean }>;
  scanContactsFromLxContacts(): Promise<{ contactNum: number; notInContactAddressNum: number }>;
  importContactsFromLxContacts(): Promise<AddressBookImportLxContactsRes>;

  addressBookGetMarketGroups(): Promise<IGroupResp[]>;

  getAddressRecycleList(req: RecycleListReq): Promise<RecycleListRes>;
  removeRecycle(req: RecycleOperateReq): Promise<void>;
  reviveRecycle(req: RecycleOperateReq): Promise<void>;
  getImportHistoryList(req: ImportHistoryReq): Promise<ImportHistoryRes>;
  getPublicHistoryList(req: PublicHistoryImportListReqModel): Promise<PublicHistoryImportListResModel>;
  addNewGroup(req: { groupName?: string; addressIdList?: number[] }): Promise<number>;

  getContactsByGroupId(req: { groupId: number }): Promise<IContactsResp>;

  uploadContactsByFile(req: FormData, config?: ApiRequestConfig): Promise<IAddressBookUploadResp>;

  uploadContactsByPaste(req: {
    groupList?: number[];
    pasteList?: {
      email?: string;
      name?: string;
    }[];
    addressRepeatedAction?: AddressRepeatedAction;
  }): Promise<IAddressBookUploadResp>;

  addressBookSearchContacts(req: TSearchContactsReq): Promise<TSearchContactsResp[]>;

  getMemberList(req: IAddressMemberListReq): Promise<IAddressMemberListRes>;
  getAddressMembers(
    req: AddressBookContactsParams & {
      memberParam: {
        contactAddressType?: number | string;
        listKey: number | string;
        listType: number | string;
      };
    }
  ): Promise<{ list: AddressBookContact[]; total: number }>;
  getAddressGroupList(): Promise<IAddressGroupListItem[]>;
  getAddressOriginList(): Promise<IAddressOriginListItem[]>;
  getImportSelectList(req: IImportSelectListReq): Promise<IImportSelectListRes>;
  addressBookGetContactById(req: { id: number }): Promise<IContactAddressResp>;

  addressBookAdd2Recycle(req: IAddressBookAdd2RecycleReq): Promise<void>;

  addressBookAddContact2Group(req: IAddressBookContactReq): Promise<void>;

  addressBookContactTransfer(req: IAddressBookContactReq): Promise<void>;

  addressBookBatchAddGroup(req: { groupNameList: string[] }): Promise<
    {
      groupId: number;
      groupName: string;
    }[]
  >;

  addressBookOpenSeaFileImport(req: FormData): Promise<void>;
  addressBookOpenSeaTextImport(req: IAddressBookOpenSeaTextImportReq): Promise<void>;
  addressBookOpenSeaList(req: IAddressBookOpenSeaListReq): Promise<IAddressBookOpenSeaListRes>;
  addressBookOpenSeaDetail(req: IAddressBookOpenSeaDetailReq): Promise<IAddressBookOpenSeaDetail>;
  addressBookOpenSeaReceive(req: IAddressBookOpenSeaIdsReq): Promise<IAddressBookOpenSeaBoolRes>;
  addressBookOpenSeaReceiveNew(req: IAddressBookOpenSeaIdsNewReq): Promise<IAddressBookOpenSeaBoolRes>;
  addressBookOpenSeaAssign(req: IAddressBookOpenSeaAssignReq): Promise<IAddressBookOpenSeaBoolRes>;
  addressBookOpenSeaDelete(req: IAddressBookOpenSeaIdsReq): Promise<IAddressBookOpenSeaBoolRes>;
  addressBookOpenSeaReturnRecordList(req: IAddressBookOpenSeaReturnRecordListReq): Promise<IAddressBookOpenSeaReturnRecordListRes>;

  addContact2AddressBook(req: IAddContact2AddressBookReq): Promise<void>;

  addressBookUpdateContact(req: Partial<IAddressBookUpdateContactReq>): Promise<void>;

  addressBookGetGroupRule(req: { sourceType: number }): Promise<IAddressBookGetRuleResp>;

  addressBookGetEmailList(req: { addressId: number }): Promise<AddressBookEmailListResp[]>;

  // 黑名单相关
  getEdmBlacklist(req: any): Promise<any>;
  getEdmNSBlacklist(req: any): Promise<any>;
  addEdmBlacklist(req: any): Promise<any>;
  addEdmNSBlacklist(req: any): Promise<any>;
  removeEdmBlacklist(req: any): Promise<any>;
  removeEdmNSBlacklist(req: any): Promise<any>;
  exportBlacklist(req: any): Promise<any>;
  exportNSBlacklist(req: any): Promise<any>;

  // 导出
  exportContactsCheck(req: { addressIds: number[] }): Promise<{ isAsync: boolean }>;
  exportContactsCheckOpenSea(req: { openSeaIds: number[] }): Promise<{ isAsync: boolean }>;
  getAddressSyncConfigList(): Promise<AddressBookSyncConfig[]>;
  updateAddressSyncConfig(req: AddressBookSyncConfigUpdateReq): Promise<void>;

  getContactsLabels(req: { emails: string[] }): Promise<{ labels?: AddressBookContactLabel[] }>;
  getStopService(): Promise<boolean>;
}

export interface AddressBookContactLabel {
  email: string;
  groupNameList?: string[];
  importName?: string;
  contactSourceType?: AddressBookContactSourceType;
}

export enum AddressBookSyncType {
  CRM = 'CRM',
}

export interface AddressBookSyncConfig {
  id: number;
  type: AddressBookSyncType;
  status: boolean;
}

export interface AddressBookSyncConfigUpdateReq {
  type: AddressBookSyncType;
  status: boolean;
}

export interface AddressBookEmailListResp {
  antiVirusStatus: string;
  attachments: {
    contentId: string;
    contentLength: number;
    contentLocation: string;
    contentType: string;
    encoding: string;
    estimateSize: number;
    filename: string;
    id: string;
    inlined: boolean;
    isMsg: boolean;
    content: Object;
  }[];
  label0: number;
  backgroundColor: number;
  fid: number;
  from: string;
  id: string;
  modifiedDate: string;
  owner: string;
  priority: number;
  receivedDate: string;
  sentDate: string;
  size: string;
  subject: string;
  summary: string;
  tag: number;
  taskId: number;
  tid: string;
  to: string;
}

export interface IGroupResp {
  addressNum: number;
  createTime: string;
  groupId: number;
  groupName: string;
}

export interface IContacts {
  addressId: number;
  contactId: number;
  contactAddressInfo: string;
  contactName: string;
  contactSourceType: number;
  contactAddressType: number;
  createTime: string;
  updateTime: string;
}

export interface IContactsResp extends IGroupResp {
  addressList: (IContacts & {
    companyName: string;
    continent: string;
    country: string;
    province: string;
    city: string;
  })[];
}

export interface RecycleListReq {
  asc?: boolean;
  order?: string;
  page: number;
  pageSize: number;
  addressIdList?: string[];
}

export interface RecycleRow {
  addressId: number;
  contactAddressInfo: string;
  contactName: string;
  contactSourceType: number;
  contactAddressType: number;
  createTime: string;
  deleteTime: string;
  remainingDay: string;
  loading?: boolean;
}

export interface RecycleListRes {
  list: RecycleRow[];
  total: number;
}

export interface RecycleOperateReq {
  addressIdList: number[];
}

export interface TSearchContactsReq {
  contactAddressType: number;
  searchParam: {
    relation?: 'AND' | 'OR';
    searchItems?: {
      field?: string;
      rule?: 'EQ' | 'GTE' | 'LTE' | 'LIKE' | 'NOT_LIKE';
      timeRange?: 'one_week' | 'one_month' | 'three_month' | 'six_month';
      searchKeys?: string[];
    }[];
  };
}

export interface TSearchContactsResp {
  contactId: number;
  contactAddressInfo: string;
  contactName: string;
  contactSourceType: number;
  contactAddressType: number;
  createTime: string;
  updateTime: string;
  id: number;
}

export interface ImportHistoryReq {
  asc?: boolean;
  order?: string;
  page: number;
  pageSize: number;
  importName?: string;
}

export interface ImportHistoryRow {
  addressNum: string;
  createTime: string;
  deletedAddressNum: string;
  importId: number;
  wpUrl: string;
  importName: string;
}

export interface ImportHistoryRes {
  list: Array<ImportHistoryRow>;
  total: number;
}

// 地址簿公海-导入名单列表接口
export interface PublicHistoryImportListReqModel {
  asc?: boolean;
  beginTime?: string;
  endTime?: string;
  importName?: string;
  order?: string;
  page: number;
  pageSize: number;
}

export interface PublicHistoryImportListRowModel {
  addressNum: number;
  createTime: number;
  deletedAddressNum: number;
  importId: number;
  importName: string;
}

export interface PublicHistoryImportListResModel {
  list: PublicHistoryImportListRowModel[];
  page: number;
  pageSize: number;
  total: number;
}

export interface IContactAddressResp {
  addressInfo: {
    contactId: number;
    contactAddressInfo: string;
    contactName: string;
    contactSourceType: number;
    contactAddressType: number;
    createTime: string;
    id: number;
    updateTime: string;
  };
  contactInfo: {
    id: number;
    city: string;
    companyName: string;
    companySite: string;
    contactName: string;
    continent: string;
    country: string;
    createTime: string;
    groupIds: number[];
    province: string;
    remark: string;
    snsInfos: {
      accountId: string;
      type: number;
    }[];
    personalSnsInfos: {
      accountId: string;
      type: number;
    }[];
    jobTitle: string;
    tels: string[];
    updateTime: string;
  };
  globalSearchCompanyInfo: {
    count: number;
    country: string;
    email: string;
    id: string;
    name: string;
  };
  groupInfos: ({
    addressList: IContacts & {
      id: number;
    };
  } & IGroupResp)[];
}

export interface IAddressBookAdd2RecycleReq {
  addressIdList?: number[];
  asc?: boolean;
  order?: boolean;
  page?: number;
  pagesize?: number;
}

export interface IAddressBookContactReq {
  addressIds: number[];
  groupIds: number[];
}

export interface ITransferContactsToGroup {
  contact_ids: number[];
  target_group_ids: number[];
}

export interface IAddCotactsToGroup {
  contact_ids: number[];
  target_group_ids: number[];
}

export interface IAddressMemberListReq {
  listType?: number;
  listKey?: number;
  contactAddressType?: number;
}
export interface IAddressMemberListItem {
  contactAddressInfo: string;
}
export interface IAddressMemberListRes {
  list: IAddressMemberListItem[];
  total: number;
}

export interface IAddressGroupListItem {
  groupId: string;
  groupName: string;
}

export interface IAddressOriginListItem {
  sourceStatus: number;
  sourceName: string;
  sourceType: number;
}

export interface IImportSelectListItem {
  importId: number;
  importName: string;
}

export interface IImportSelectListRes {
  list: IImportSelectListItem[];
  total: number;
}

export interface IImportSelectListReq {
  importId?: number | string;
  importName?: string;
  page: number;
  pageSize: number;
  importIdList?: Array<number | string>;
}

export interface IAddressBookOpenSeaTextImportReq {
  pasteList: { email: string; name: string }[];
}
export interface IAddressBookOpenSeaListReq {
  contactAddressType: AddressBookContactAddressType;
  importName?: string;
  importId?: number;
  page: number;
  pageSize: number;
  searchParam?: {
    relation?: 'AND' | 'OR';
    searchItems: {
      field: string;
      module: 'address' | 'edm';
      rule: string;
      searchKeys: string[];
      timeRange?: string;
    }[];
  };
  sort?: {
    field: string;
    direction: string;
  };
}
export interface IAddressBookOpenSeaDetail {
  addressInfo: AddressInfo;
  contactInfo: ContactInfo;
  groupInfos: GroupInfo[];
  customerInfo?: {
    uniCustomerId: string;
  };
  marketingInfo?: {};
  id: number;
  importId: number;
  importName: string;
  returnReason: string;
  returnTime: string;
}
export interface IAddressBookOpenSeaListRes {
  list: IAddressBookOpenSeaDetail[];
  total: number;
}
export interface IAddressBookOpenSeaDetailReq {
  id: number;
}
export type IAddressBookOpenSeaIdsReq = number[];
export interface IAddressBookOpenSeaIdsNewReq {
  addressRepeatedAction?: AddressRepeatedAction;
  ids: number[];
}
export interface IAddressBookOpenSeaBoolRes {
  result: boolean;
}
export interface IAddressBookOpenSeaAssignReq {
  ids: IAddressBookOpenSeaIdsReq;
  managerId: string;
  addressRepeatedAction?: AddressRepeatedAction;
}
export interface IAddressBookOpenSeaReturnRecordListReq {
  asc?: boolean;
  id: number;
  order?: string;
  page?: number;
  pageSize?: number;
}
export interface IAddressBookOpenSeaReturnRecordItem {
  changeManagerId: string;
  changeManagerName: string;
  openSeaId: number;
  reason: string;
  remark: string;
  returnTime: string;
}
export interface IAddressBookOpenSeaReturnRecordListRes {
  list: IAddressBookOpenSeaReturnRecordItem[];
  total: number;
}
export interface AddressInfo {
  contactAddressInfo: string;
  contactAddressType: number;
  contactId: number;
  contactName: string;
  contactSourceType: number;
  createTime: string;
  groupIds: any[];
  id: number;
  importName: string;
  updateTime: string;
}

export interface ContactInfo {
  city: string;
  companyName: string;
  companySite: string;
  contactName: string;
  continent: string;
  country: string;
  createTime: string;
  groupIds: any[];
  id: number;
  province: string;
  remark: string;
  snsInfos: SnsInfo[];
  tels: any[];
  updateTime: string;
  jobTitle: string;
}

export interface SnsInfo {
  accountId: string;
  name: string;
  type: number;
}

export interface GroupInfo {
  addressList: AddressList[];
  addressNum: number;
  createTime: string;
  groupId: number;
  groupName: string;
}

export interface AddressList {
  addressId: number;
  contactId: number;
  contactInfo: string;
  contactName: string;
  contactSourceType: number;
  contactType: number;
  createTime: string;
  updateTime: string;
}
export interface IAddContact2AddressBookReq {
  addressRepeatedAction?: AddressRepeatedAction;
  contactAddressInfos: {
    addressInfos: {
      contactAddressType: number;
      contactAddressInfo: string;
      contactSourceType: number;
      groupIds: number[];
      contactName?: string;
      verifyStatus?: number;
    }[];
    contactInfo?: Partial<IContactAddressResp['contactInfo']>;
  }[];
}

export interface IAddressBookUpdateContactReq {
  addressInfo: Partial<IContactAddressResp['addressInfo']>;
  contactInfo: Partial<IContactAddressResp['contactInfo']>;
  groupInfos: {
    groupId: number;
    groupName: string;
  }[];
  marketingInfo: {
    openCnt: number;
    receivedCnt: number;
    replyCnt: number;
    sendCnt: number;
    unsubscribeCnt: number;
  };
}

export interface IAddressBookGetRuleResp {
  groupList: GroupInfo[];
  sourceName: string;
  sourceStatus: number;
  sourceType: number;
}

export interface IAddressBookUploadResp {
  fail: number;
  message: string;
  status: 1 | 2 | 3;
  success: number;
  total: number;
}
