import { PayloadAction } from '@reduxjs/toolkit';
import { PayloadUpdateDataMapByStage, SalesPitchReducerState, SalesPitchReducerKeys } from './types';
import { genDefaultPitchDataMap } from '@web-common/state/reducer/salesPitchReducer/config';
import { salesPitchRequest as request } from '@web-common/state/reducer/salesPitchReducer/request';
import { SalesPitchStages } from 'api';

export const salesPitchReducers = {
  /**
   * useState2ReduxMock 的默认写入reducer
   * 用于根据stateName快速设置
   */
  doUpdateAny: (state: SalesPitchReducerState, action: PayloadAction<{ name: SalesPitchReducerKeys; data: any }>) => {
    const { name, data } = action.payload || {};
    if (name && state && state[name] !== undefined) {
      try {
        (state[name] as any) = data;
      } catch (e) {
        console.warn('[doUpdateAny Error]', name, e);
      }
    } else {
      console.warn('[doUpdateAny Error]', name);
    }
  },
  doUpdateDataMapByStage(state: SalesPitchReducerState, action: PayloadAction<PayloadUpdateDataMapByStage>) {
    const { stageId, newList } = action.payload;
    state.dataMap = {
      ...state.dataMap,
      [stageId]: newList,
    };
  },
  doResetPage(state: SalesPitchReducerState) {
    state.isLoading = false;
    state.isFetchFailed = false;
    state.selectedStageId = '';
    state.config = request.getLocalSalesPitchConfig();
    state.searchDataMap = genDefaultPitchDataMap();
    state.searchInput = '';
    state.dataMap = genDefaultPitchDataMap();
  },
  doCloseDrawer(state: SalesPitchReducerState) {
    state.drawerType = '';
    state.drawerVisible = false;
    state.drawerDataId = '';
  },
};
