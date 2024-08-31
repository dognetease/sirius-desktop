import { PayloadAction } from '@reduxjs/toolkit';
import { TreeSelectedContacts, SliceIdParams, RootMailBoxReducerState } from '@web-mail/types';
import { CustomerAsideDetail, CustomerMailState, UpdateCustomerTreeListParams } from '@web-mail/state/slice/customerMailReducer/types';
import { genCustomerState } from '@web-mail/state/slice/customerMailReducer/states';
import { sliceStateCheck } from '@web-mail/utils/slice';
import { filterTabMap } from '@web-mail/common/constant';

// !!!!! 约定：为了避免与其他模块的 reducer 重复，客户模块的 reducer 名称后都会增加 _cm 后缀
export const customerReducers = {
  /************ 创建、移除Slice ************/
  doCreateNewSlice_cm(state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{}>>) {
    const { sliceId } = action.payload;
    if (!state.customer[sliceId]) {
      state.customer[sliceId] = genCustomerState();
    }
  },
  doRemoveSlice_cm(state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{}>>) {
    const { sliceId } = action.payload;
    if (state.customer[sliceId]) {
      delete state.customer[sliceId];
    }
  },
  doUpdateSliceAny_cm(state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{ name: keyof CustomerMailState; data: any; type?: string }>>) {
    const { sliceId, name, data } = action.payload;
    const isSliceExist = sliceStateCheck(state, sliceId, 'customer');
    if (isSliceExist) {
      if (name) {
        try {
          if (!state.customer[sliceId]) {
            state.customer[sliceId] = genCustomerState();
          }
          (state.customer[sliceId][name] as any) = data;
        } catch (e) {
          console.warn('[customer doUpdateSliceAny Error]', name, e);
        }
      } else {
        console.warn('[customer doUpdateSliceAny Error]', name);
      }
    }
  },
  /************ 单一业务状态 ************/
  // 设置搜索列表-文件夹-选中的联系人Email
  doUpdateSelectedSearchContacts_cm: (state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{ data: TreeSelectedContacts }>>) => {
    const { sliceId, data } = action.payload;
    const isSliceExist = sliceStateCheck(state, sliceId, 'customer');
    if (isSliceExist) {
      state.customer[sliceId].selectedSearchContacts = data;
    }
  },
  // 设置邮件列表-文件夹-选中的联系人Email
  doUpdateSelectedContacts_cm: (state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{ data: TreeSelectedContacts }>>) => {
    const { sliceId, data } = action.payload;
    const isSliceExist = sliceStateCheck(state, sliceId, 'customer');
    if (isSliceExist) {
      state.customer[sliceId].selectedContacts = data;
    }
  },
  /************ 组合业务状态 ************/
  // 设置邮件列表-文件夹-选中的key
  doUpdateCustomerTreeListById_cm: (state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{ data: UpdateCustomerTreeListParams }>>) => {
    const { sliceId, data: payloadData } = action.payload;
    const isSliceExist = sliceStateCheck(state, sliceId, 'customer');
    if (isSliceExist) {
      const { id, data, isSearching } = payloadData;
      if (isSearching) {
        const index = state.customer[sliceId].searchTreeList.findIndex(v => v.key === id);
        if (index > -1) {
          state.customer[sliceId].searchTreeList[index] = data;
        }
      } else {
        const index = state.customer[sliceId].customerTreeList.findIndex(v => v.key === id);
        if (index > -1) {
          state.customer[sliceId].customerTreeList[index] = data;
        }
      }
    }
  },
  // 客户搜索
  doStartMailSearch_cm: (state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{ data: string }>>) => {
    const { sliceId, data } = action.payload;
    const isSliceExist = sliceStateCheck(state, sliceId, 'customer');
    if (isSliceExist) {
      state.customer[sliceId].mailSearchKey = data;
      state.customer[sliceId].scrollTop = 0;
      state.customer[sliceId].selectedSearchKeys = { id: '' };
      state.customer[sliceId].expandedSearchKeys = [];
      state.customer[sliceId].mailTabs = filterTabMap.customer;
      state.customer[sliceId].searchList = [];
      state.customer[sliceId].searchTotal = 0;
      state.customer[sliceId].searchListStateTab = 'ME';
      state.customer[sliceId].mailListTabMenuSearch = 'ALL';
      state.customer[sliceId].selectedMailId = { id: '' };
    }
  },
  // 客户搜索关键词为空
  doResetMailSearch_cm: (state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{}>>) => {
    const { sliceId } = action.payload;
    const isSliceExist = sliceStateCheck(state, sliceId, 'customer');
    if (isSliceExist) {
      state.customer[sliceId].mailSearching = '';
      state.customer[sliceId].mailSearchStateMap = {};
      state.customer[sliceId].selectedSearchKeys = { id: '' };
      state.customer[sliceId].expandedSearchKeys = [];
      state.customer[sliceId].searchTreeList = [];
      state.customer[sliceId].searchTotal = 0;
      state.customer[sliceId].searchList = [];
      state.customer[sliceId].searchListStateTab = 'ME';
      state.customer[sliceId].mailListTabMenuSearch = 'ALL';
      state.customer[sliceId].customerSearchListLoading = false;
      state.customer[sliceId].searchTreeListHasMore = true;
      state.customer[sliceId].searchValue = '';
    }
  },
  // appendNewCustomerMail_cm: (state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{ data: CustomerBoxModel[] }>>) => {
  //   const { sliceId = '', data: payloadData } = action.payload;
  //   const isSliceExist = sliceStateCheck(state, sliceId, 'customer');
  //   if (isSliceExist) {
  //     const data = formatCustomerTreeData(payloadData) || [];
  //     const keys = data.map(item => item?.key);
  //     state.customer[sliceId].customerTreeList = [...data, ...state.customer[sliceId].customerTreeList.filter(item => !keys.includes(item?.key))];
  //   }
  // },
  // 三栏，通栏布局变化的时候，清楚各模块下的所有的activeIds
  // clearAllCustomerMailActiveIds: (state: RootMailBoxReducerState, action: PayloadAction<any>) => {},
  updateCustomerAsideDetail_cm: (state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{ data: Partial<CustomerAsideDetail> }>>) => {
    const { sliceId, data } = action.payload;
    const isSliceExist = sliceStateCheck(state, sliceId, 'customer');
    if (isSliceExist) {
      state.customer[sliceId].customerAsideDetail = {
        ...state.customer[sliceId].customerAsideDetail,
        ...data,
      };
    }
  },
};
