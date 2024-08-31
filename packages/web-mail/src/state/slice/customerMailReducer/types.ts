import { ICustomerManagerModel, MailSearchStatesMap } from 'api';
import { LIST_MODEL } from '@web-mail/common/constant';
import { CustomerTreeData, mailListStateTabs, MailSelectedKey, TreeSelectedContacts, TreeSelectedKey, CustomerMailListStateTabSelected } from '@web-mail/types';

export interface ExpandedKeysNoContacts {
  customerId: string;
  managerList?: ICustomerManagerModel[];
  contacts?: CustomerTreeData[];
}

export type customerTabMenuKey = 'ALL' | 'Receive' | 'Send';

export interface SearchCustomerParam {
  query?: string;
  lastId?: number;
  lastMailTime?: number;
  limit: number;
}

// 使用mailPlusApi搜索客户，入参
export interface SearchCustomerUseMailPlusApiParam {
  query?: string;
  pageSize?: number;
  pageNum?: number;
  sliceId?: string;
}

export interface SyncCustomerListParams {
  showLoading: boolean;
  lastId?: number;
  lastMailTime?: number;
  limit?: number;
  refresh?: boolean;
}

export interface UpdateCustomerTreeListParams {
  id: string | number;
  data: CustomerTreeData;
  isSearching: boolean;
}

// ‘’ 查看，detail是编辑，clueDetail线索详情，contactInfo编辑联系人
export type CustomerAsideDetailType = '' | 'detail' | 'clueDetail' | 'contactInfo';

export interface CustomerAsideDetail {
  email?: string;
  type: CustomerAsideDetailType;
}

export interface CommonAsideDetail {
  aiDetailMap: {
    [key: string]: {
      companyName: string;
      area: string;
      webapp: string;
      socialMediaList: any[];
      location: string;
    };
  };
  aiMidMap: {
    [key: string]: string; // mid：gid（mid到轮询id的映射关系）
  };
}

export interface CustomerMailState {
  refreshBtnLoading: boolean;
  listLoading: boolean;
  customerListLoading: boolean;
  customerSearchListLoading: boolean;
  mailSearching: string;
  mailSearchStateMap: MailSearchStatesMap;
  mailSearchKey: string;
  expandedSearchKeys: number[];
  selectedSearchKeys: TreeSelectedKey;
  selectedSearchContacts: TreeSelectedContacts;
  searchTreeList: CustomerTreeData[];
  searchTreeListPageSize: number;
  searchTreeListPageNum: number;
  selectedKeys: TreeSelectedKey;
  selectedContacts: TreeSelectedContacts;
  customerTreeList: CustomerTreeData[];
  customerTreeIdList: string[];
  expandedKeys: (number | string)[];
  expandedKeysNoContacts: Record<string, ExpandedKeysNoContacts>;
  // activeSearchMailId: MailSelectedKey;
  mailDataList: string[];
  searchList: string[];
  searchTotal: number;
  mailTotal: number;
  scrollTop: number;
  noticeNum: number;
  activeIds: string[];
  mailListMenuVisible: boolean;
  mailListStateTab: CustomerMailListStateTabSelected;
  searchListStateTab: CustomerMailListStateTabSelected;
  mailListTabMenu: customerTabMenuKey;
  mailListTabMenuSearch: customerTabMenuKey;
  selectedMailId: MailSelectedKey;
  mailListInitIsFailed: boolean;
  mailListResizeProcessing: boolean;
  advancedSearchVisible: boolean;
  advancedSearchLoading: boolean;
  mailTabs: mailListStateTabs[];
  readMailWindowActiveMailId: string | null;
  defaultMailListSelectedModel: LIST_MODEL;
  refreshHasNewMail: boolean;
  customerTreeListHasMore: boolean;
  searchTreeListHasMore: boolean;
  customerAsideDetail: CustomerAsideDetail;
  searchValue: string;
}

export type CustomerMailSliceState = Record<string, CustomerMailState>;
