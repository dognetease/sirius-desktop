import { CustomerBaseInfo, CustomerBoxUnread, queryCusterUnreadParam } from 'api';
import { PayloadAction } from '@reduxjs/toolkit';
import { thunkHelperFactory, formatNumberByMax } from '@web-mail/util';
import { MailBoxReducerState, PayloadMeta, thunksStore, stringMap, UnreadMap, SliceIdParams } from '@web-mail/types';
import { SearchCustomerUseMailPlusApiParam, SyncCustomerListParams } from '@web-mail/state/slice/customerMailReducer/types';

import { sliceStateCheck, transCustomerBaseInfo2CustomerTreeData } from '@web-mail/utils/slice';
import { getIsSearchingMailByState } from '@web-mail/state/customize';

import { request } from '@web-mail/state/slice/request';
import { actions as mailTabActions, tabId } from '@web-common/state/reducer/mailTabReducer';
import { doGetMyCustomerListFromReducer } from '@web-common/state/reducer/contactReducer';

const ReducerName = 'CustomerListReducer';
const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);

// 客户搜索
// thunkHelper<SliceIdParams<SearchCustomerParam>, MailBoxReducerState>({
//   name: 'doSearchCustomers_cm',
//   request: async (params, thunkAPI) => {
//     const { query, lastId, lastMailTime, limit, sliceId } = params || {};
//     const state = thunkAPI.getState().mailReducer;
//     if (!sliceStateCheck(state, sliceId, 'customer')) {
//       return;
//     }
//     setCurrentAccount();
//     const res = await request.doSearchCustomers({
//       limit,
//       lastMailTime,
//       lastId,
//       query: query || state.customer[sliceId].searchValue,
//     });
//     console.log('[doSearchCustomers_cm]', res);
//     return {
//       res,
//       lastMailTime,
//       lastId,
//       sliceId,
//     };
//   },
//   fulfilled: (
//     state: MailBoxReducerState,
//     action: PayloadAction<
//       {
//         res: ListCustomerPageRes;
//         lastId?: number;
//         lastMailTime?: number;
//         sliceId: string;
//       },
//       string,
//       PayloadMeta<queryCusterUnreadParam>
//     >
//   ) => {
//     const { res, lastMailTime, lastId, sliceId } = action.payload || {};
//     const { data, loadMore } = res || {};
//     const newTreeList = formatCustomerTreeData(data as CustomerBoxModel[]);
//     const map: stringMap = {};
//     if (!sliceStateCheck(state, sliceId, 'customer')) {
//       return;
//     }
//     if (state.customer[sliceId].searchTreeList && state.customer[sliceId].searchTreeList.length) {
//       state.customer[sliceId].searchTreeList.forEach(item => {
//         map[item.key] = true;
//       });
//     }
//     state.customer[sliceId].searchTreeListHasMore = loadMore;
//     // 如果是下滑加载
//     if (lastMailTime || lastId) {
//       state.customer[sliceId].searchTreeList = [...state.customer[sliceId].searchTreeList, ...newTreeList.filter(item => !map[item.key])];
//     } else {
//       state.customer[sliceId].searchTreeList = newTreeList;
//     }
//     state.customer[sliceId].customerSearchListLoading = false;
//   },
//   rejected: (state, action) => {
//     const params = action.meta.arg || {};
//     const { sliceId } = params;
//     if (!sliceStateCheck(state, sliceId, 'customer')) {
//       return;
//     }
//     if (state.customer[sliceId]) {
//       state.customer[sliceId].customerSearchListLoading = false;
//     }
//   },
// });

// 客户列表搜索新逻辑
thunkHelper<SliceIdParams<SearchCustomerUseMailPlusApiParam>, MailBoxReducerState>({
  name: 'doSearchCustomers_useMailPlusApi',
  request: async (params, thunkAPI) => {
    // query没有传递，用来标示加载更多的情况
    const { query, pageSize, pageNum, sliceId } = params || {};
    const state = thunkAPI.getState().mailReducer;
    // 如果redux标签不存在，或者搜索关键词是空，则直接返回
    if (!sliceStateCheck(state, sliceId, 'customer')) {
      return;
    }
    const res = await request.doSearchCustomerPage(query || state.customer[sliceId].searchValue, pageSize as number, pageNum as number);
    console.log('[doSearchCustomers_useMailPlusApi]', res);
    const { data, pageNum: pageNumRes, pageSize: pageSizeRes, totalNum, totalSize } = res;
    return {
      res: data,
      query,
      pageSize: pageSizeRes,
      pageNum: pageNumRes,
      totalNum,
      totalSize,
      sliceId,
    };
  },
  fulfilled: (
    state: MailBoxReducerState,
    action: PayloadAction<
      {
        res: CustomerBaseInfo[];
        query: string;
        pageSize: number;
        pageNum: number;
        totalSize: number;
        totalNum: number;
        sliceId: string;
      },
      string,
      PayloadMeta<queryCusterUnreadParam>
    >
  ) => {
    const { res, query, pageNum, totalNum, sliceId } = action.payload || {};
    const newTreeList = transCustomerBaseInfo2CustomerTreeData(res as CustomerBaseInfo[]);
    const map: stringMap = {};
    if (!sliceStateCheck(state, sliceId, 'customer')) {
      return;
    }
    if (state.customer[sliceId].searchTreeList && state.customer[sliceId].searchTreeList.length) {
      state.customer[sliceId].searchTreeList.forEach(item => {
        map[item.key] = true;
      });
    }
    // 如果返回的数据是空，或者长度小于，分页大小，则认为没有更多数据了
    const noMore = pageNum < totalNum;
    state.customer[sliceId].searchTreeListHasMore = !noMore;
    // 修改分页数据
    if (!noMore) {
      state.customer[sliceId].searchTreeListPageNum = pageNum;
    }
    // 如果是下滑加载
    if (!query) {
      state.customer[sliceId].searchTreeList = [...state.customer[sliceId].searchTreeList, ...newTreeList.filter(item => !map[item.key])];
    } else {
      state.customer[sliceId].searchTreeList = newTreeList;
    }
    state.customer[sliceId].customerSearchListLoading = false;
    state.customer[sliceId].refreshBtnLoading = false;
  },
  rejected: (state, action) => {
    const params = action.meta.arg || {};
    const { sliceId } = params;
    if (!sliceStateCheck(state, sliceId, 'customer')) {
      return;
    }
    state.customer[sliceId].customerSearchListLoading = false;
    state.customer[sliceId].refreshBtnLoading = false;
  },
});

// 同步客户列表数据
// thunkHelper<SliceIdParams<SyncCustomerListParams>, MailBoxReducerState>({
//   name: 'syncCustomerList_cm',
//   request: async (params, thunkAPI) => {
//     const { limit, sliceId } = params || {};
//     const { dispatch } = thunkAPI;
//     const state = thunkAPI.getState().mailReducer;
//     if (!sliceStateCheck(state, sliceId, 'customer')) {
//       return;
//     }
//     setCurrentAccount();
//     const res = await request.doListCustomersFromDb({ limit });
//     console.log('[syncCustomerList_cm]', res);
//     // 刷新未读数
//     const customerIds = res.data.map(v => v.id);
//     dispatch(Thunks.getUnread_cm({ customerIds }));
//     return res;
//   },
//   fulfilled: (state, action: PayloadAction<ListCustomerPageRes, string, PayloadMeta<SliceIdParams<queryCusterUnreadParam>>>) => {
//     const { sliceId } = action.meta.arg || {};
//     const { data, loadMore } = action.payload || {};
//     if (!sliceStateCheck(state, sliceId, 'customer')) {
//       return;
//     }
//     const newTreeList = formatCustomerTreeData(data);
//     state.customer[sliceId].customerTreeListHasMore = loadMore;
//     state.customer[sliceId].customerTreeList = newTreeList;
//     state.customer[sliceId].customerListLoading = false;
//   },
//   rejected: (state, action) => {
//     const params = action.meta.arg || {};
//     const { sliceId } = params;
//     if (state.customer[sliceId]) {
//       state.customer[sliceId].customerListLoading = false;
//     }
//   },
// });

// 分页加载客户列表数据 or 刷新客户列表
thunkHelper<SliceIdParams<SyncCustomerListParams>, MailBoxReducerState>({
  name: 'loadCustomerList_cm',
  request: async (params, thunkAPI) => {
    const { dispatch } = thunkAPI;
    const { lastId, limit, sliceId, refresh } = params || {};
    const state = thunkAPI.getState().mailReducer;
    if (!sliceStateCheck(state, sliceId, 'customer')) {
      return;
    }
    // setCurrentAccount();
    // const res = await request.doListCustomers({ lastId, lastMailTime, limit }, noCache);
    const refreshLimit = refresh && !limit ? state.customer[sliceId].customerTreeIdList.length : limit;
    const limitNum = refreshLimit || 30;
    const result = await doGetMyCustomerListFromReducer({ lastId: lastId as string | undefined, limit: Math.max(limitNum, 30) });
    console.log('[loadCustomerList_cm]', result);
    // 刷新未读数
    // const customerIds = res.data.map(v => v.id);
    dispatch(Thunks.getUnread_cm({ customerIds: result.idList }));
    return result;
  },
  pending: (state, action) => {
    const params = action.meta.arg || {};
    const { showLoading = true, sliceId } = params;
    const isSliceExist = sliceStateCheck(state, sliceId, 'customer');
    if (!isSliceExist) {
      return;
    }
    const isSearching = getIsSearchingMailByState(state, sliceId, 'customer');
    if (!isSearching && showLoading && params?.lastId == null) {
      state.customer[sliceId].customerListLoading = true;
    }
  },
  fulfilled: (state, action) => {
    const { sliceId, refresh = false, lastId } = action.meta.arg || {};
    const { idList, loadMore } = action.payload || {};
    if (!sliceStateCheck(state, sliceId, 'customer')) {
      return;
    }
    // const newTreeList = formatCustomerTreeData(data as CustomerBoxModel[]);
    state.customer[sliceId].customerTreeListHasMore = loadMore;
    state.customer[sliceId].customerListLoading = false;
    state.customer[sliceId].refreshBtnLoading = false;
    if (refresh) {
      // state.customer[sliceId].customerTreeList = newTreeList;
      state.customer[sliceId].customerTreeIdList = idList;
    } else {
      if (!lastId && !loadMore && !idList?.length) {
        // 客户db无数据返回
        state.customer[sliceId].customerTreeIdList = [];
      } else {
        // 进行去重
        // const map: stringMap = {};
        // if (state.customer[sliceId].customerTreeList && state.customer[sliceId].customerTreeList.length) {
        //   state.customer[sliceId].customerTreeList.forEach(item => {
        //     map[item.key] = true;
        //   });
        // }
        // state.customer[sliceId].customerTreeList = [...state.customer[sliceId].customerTreeList, ...newTreeList.filter(item => !map[item.key])];
        // 进行去重
        const map: stringMap = {};
        if (state.customer[sliceId].customerTreeIdList && state.customer[sliceId].customerTreeIdList.length) {
          state.customer[sliceId].customerTreeIdList.forEach(item => {
            map[item] = true;
          });
        }
        state.customer[sliceId].customerTreeIdList = [...state.customer[sliceId].customerTreeIdList, ...idList.filter((item: string) => !map[item])];
      }
    }
    // 如果客户列表有
    if (state.customer[sliceId].customerTreeIdList.length) {
      const selectedKeysId = state.customer[sliceId].selectedKeys.id;
      // 如果没有选中，或者选中的不在当前客户列表里面，则选中第一个
      if (!selectedKeysId) {
        state.customer[sliceId].selectedKeys.id = state.customer[sliceId].customerTreeIdList[0];
        state.customer[sliceId].selectedContacts.list = []; // 清空一下选中的联系人，让邮件列表根据selectedKeys.id去初始化，因为此时selectedContacts.list已经不正确了
      }
    }
    // 如果客户列表是空，则选中的客户置空，选中的联系人置空,右侧边栏置空,当前在读邮件置空
    if (state.customer[sliceId].customerTreeIdList.length === 0) {
      state.customer[sliceId].selectedKeys.id = '';
      state.customer[sliceId].selectedContacts.list = [];
      state.customer[sliceId].customerAsideDetail = { email: '', type: '' };
      state.customer[sliceId].selectedMailId = { id: '' };
    }
  },
  rejected: (state, action) => {
    const params = action.meta.arg || {};
    const { sliceId } = params;
    if (!sliceStateCheck(state, sliceId, 'customer')) {
      return;
    }
    if (state.customer[sliceId]) {
      state.customer[sliceId].customerListLoading = false;
      state.customer[sliceId].refreshBtnLoading = false;
    }
  },
});

// 刷新未读数
thunkHelper<queryCusterUnreadParam, MailBoxReducerState>({
  name: 'getUnread_cm',
  request: async (params, thunkAPI) => {
    const { dispatch } = thunkAPI;
    const { customerIds = [], returnAll = true } = params || {};
    const isOnlyForTotal = customerIds.length === 0;
    // setCurrentAccount();
    const res: CustomerBoxUnread = await request.doCustomersUnread({ customerIds, returnAll });
    // 更新tab中的未读数
    dispatch(
      mailTabActions.doChangeTabById({
        id: tabId.readCustomer,
        tabModel: {
          extra: {
            unRead: (res.total && formatNumberByMax(res.total, 999)) || '',
          },
        } as any,
      })
    );
    console.log('[getUnread_cm]', res);
    return { res, isOnlyForTotal };
  },
  fulfilled: (
    state: MailBoxReducerState,
    action: PayloadAction<
      {
        res: CustomerBoxUnread;
        isOnlyForTotal: boolean;
      },
      string,
      PayloadMeta<queryCusterUnreadParam>
    >
  ) => {
    const { res, isOnlyForTotal } = action.payload || {};
    if (isOnlyForTotal) {
      return;
    }
    const customerMap: UnreadMap = {};
    const contentMap: UnreadMap = {};
    if (res && res.items?.length) {
      res.items.forEach(customItem => {
        if (customItem) {
          const { customerId, unread: customerUnread, initialized: customerInitialized, contacts } = customItem;
          customerMap[customerId] = { unread: customerUnread, initialized: customerInitialized };
          for (const contactId in contacts) {
            const id = customerId + contactId;
            const targetContact = contacts[contactId];
            contentMap[id] = { unread: targetContact.unread, initialized: targetContact.initialized };
          }
        }
      });
    }
    state.unReadMap_cm.customerMap = { ...state.unReadMap_cm.customerMap, ...customerMap };
    state.unReadMap_cm.contentMap = { ...state.unReadMap_cm.contentMap, ...contentMap };
  },
});

export const FolderThunks_cm = Thunks;
export const FolderExtraReducersList_cm = ReducersList;
