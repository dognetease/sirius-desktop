import { ERROR_REQUEST_CANCLE, thunkHelperFactory, reduxMessage } from '@web-mail/util';
import { thunksStore } from '@web-mail/types';
import { ReqParamsSalesPitchList, SalesPitchConfig, SalesPitchDataMap, SearchSalesPitchParams, SortSalesPitchParams } from 'api';
import { PayloadAction } from '@reduxjs/toolkit';

import { SalesPitchReducerState, OnSortReqParams } from './types';
import { salesPitchRequest as request } from './request';
import { genDefaultPitchDataMap } from '@web-common/state/reducer/salesPitchReducer/config';
import { getIn18Text } from 'api';

const ReducerName = 'SalesPitchReducer';
const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);

// 话术库全量数据请求
thunkHelper<ReqParamsSalesPitchList, SalesPitchReducerState>({
  name: 'getSalesPitchData',
  request: async params => {
    return request.getSalesPitchData(params);
  },
  pending: state => {
    state.isLoading = true;
    state.isFetchFailed = false;
    state.dataMap = genDefaultPitchDataMap();
  },
  fulfilled: (state, action: PayloadAction<SalesPitchDataMap>) => {
    const result = action.payload;
    state.isLoading = false;
    state.isFetchFailed = false;
    if (result) {
      state.dataMap = result;
    }
  },
  rejected: (state, action) => {
    const error = action?.error?.message || action.payload || action.error;
    if (error !== ERROR_REQUEST_CANCLE) {
      state.isLoading = false;
      state.isFetchFailed = true;
      reduxMessage.error({ content: getIn18Text('JIAZAISHIBAI') });
    }
  },
});

// 话术排序
thunkHelper<OnSortReqParams, SalesPitchReducerState>({
  name: 'sortSalesPitch',
  request: async (params, thunkAPI) => {
    const { dispatch } = thunkAPI;
    const reqParams: SortSalesPitchParams = {
      order: params.newList.map(v => ({ discourseID: v.id, type: v.type })),
      stage: params.stageId,
    };
    try {
      const success = await request.sortSalesPitch(reqParams);
      if (!success) {
        reduxMessage.error({ content: getIn18Text('QINGQIUSHIBAI') });
        dispatch(Thunks.getSalesPitchData({}));
      }
    } catch (e) {
      reduxMessage.error({ content: getIn18Text('QINGQIUSHIBAI') });
      dispatch(Thunks.getSalesPitchData({}));
    }
  },
});

// 话术搜索
thunkHelper<SearchSalesPitchParams, SalesPitchReducerState>({
  name: 'searchSalesPitch',
  request: async params => {
    return request.searchSalesPitch(params);
  },
  pending: state => {
    state.isLoading = true;
    state.isFetchFailed = false;
    state.searchDataMap = genDefaultPitchDataMap();
  },
  fulfilled: (state, action: PayloadAction<SalesPitchDataMap>) => {
    const result = action.payload;
    state.isLoading = false;
    state.isFetchFailed = false;
    if (result) {
      state.searchDataMap = result;
    }
  },
  rejected: (state, action) => {
    const error = action?.error?.message || action.payload || action.error;
    if (error !== ERROR_REQUEST_CANCLE) {
      state.isLoading = false;
      state.isFetchFailed = true;
      reduxMessage.error({ content: getIn18Text('JIAZAISHIBAI') });
    }
  },
});

// 获取数据通用接口（自动区分搜索状态和非搜索状态）
thunkHelper<undefined, SalesPitchReducerState>({
  name: 'fetchData',
  request: async (_params, thunkAPI) => {
    const { dispatch } = thunkAPI;
    const state = thunkAPI.getState().salesPitchReducer;
    if (state.searchInput) {
      dispatch(Thunks.searchSalesPitch({ queryKey: state.searchInput }));
    } else {
      dispatch(Thunks.getSalesPitchData({}));
    }
  },
});

// 获取数据通用接口（自动区分搜索状态和非搜索状态）
thunkHelper<undefined, SalesPitchReducerState>({
  name: 'getSalesPitchConfig',
  request: async () => {
    return request.getSalesPitchConfig();
  },
  fulfilled: (state, action: PayloadAction<SalesPitchConfig>) => {
    state.config = action.payload;
  },
  rejected: (state, action) => {
    const error = action?.error?.message || action.payload || action.error;
    console.error('getSalesPitchConfig error', error);
    state.config = {
      showEnterprise: true,
    };
  },
});

export const SalesPitchThunks = Thunks;
export const SalesPitchExtraReducersList = ReducersList;
export const SalesPitchExtraReducers = (builder: any) => {
  SalesPitchExtraReducersList.forEach((fn: any) => fn(builder));
};
