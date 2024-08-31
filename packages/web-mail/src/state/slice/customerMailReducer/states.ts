import type { CustomerMailState } from '@web-mail/state/slice/customerMailReducer/types';
import { filterTabMap, LIST_MODEL } from '@web-mail/common/constant';

export const genCustomerState: () => CustomerMailState = () => {
  return {
    /************ loading状态 ************/
    listLoading: false,
    customerListLoading: false,
    customerSearchListLoading: false,
    refreshBtnLoading: false,
    /************ 搜索相关状态 ************/
    mailSearching: '', // ''为非搜索状态，normal为普通搜索，advanced为高级搜索
    mailSearchStateMap: {},
    mailSearchKey: '',
    selectedSearchKeys: { id: '', accountId: '' },
    selectedSearchContacts: { list: [], accountId: '' },
    searchTreeList: [],
    searchTreeListPageSize: 20,
    searchTreeListPageNum: 1,
    expandedSearchKeys: [],
    searchList: [],
    searchTotal: 20,
    advancedSearchVisible: false,
    advancedSearchLoading: false,
    /************ 文件夹树相关 ************/
    selectedKeys: { id: '', accountId: '' },
    selectedContacts: { list: [], accountId: '' },
    customerTreeList: [],
    customerTreeIdList: [],
    expandedKeys: [],
    expandedKeysNoContacts: {},
    // activeSearchMailId: { id: '', accountId: '' },
    /************ 邮件列表相关 ************/
    refreshHasNewMail: false,
    mailDataList: [],
    mailTotal: 20,
    scrollTop: 0,
    noticeNum: 0,
    activeIds: [],
    mailListMenuVisible: false,
    mailListStateTab: 'ALL',
    searchListStateTab: 'ME',
    mailListTabMenu: 'ALL',
    mailListTabMenuSearch: 'ALL',
    selectedMailId: { id: '', accountId: '' },
    mailListInitIsFailed: false,
    mailListResizeProcessing: false,
    mailTabs: filterTabMap.customer,
    defaultMailListSelectedModel: LIST_MODEL.INIT,
    readMailWindowActiveMailId: null,
    customerTreeListHasMore: true,
    searchTreeListHasMore: true,
    customerAsideDetail: {
      email: '',
      type: '',
    },
    // 客户邮件-搜素关键词
    searchValue: '',
  };
};
