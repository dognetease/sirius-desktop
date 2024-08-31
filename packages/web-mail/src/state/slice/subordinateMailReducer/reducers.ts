import { PayloadAction } from '@reduxjs/toolkit';
import { RootMailBoxReducerState, SliceIdParams } from '@web-mail/types';
import { genSubordinateState } from '@web-mail/state/slice/subordinateMailReducer/states';
import { sliceStateCheck } from '@web-mail/utils/slice';
import { SubordinateMailState } from '@web-mail/state/slice/subordinateMailReducer/types';

// !!!!! 约定：为了避免与其他模块的 reducer 重复，下属模块的 reducer 名称后都会增加 _sd 后缀
export const subordinateReducers = {
  /************ 创建、移除Slice ************/
  doCreateNewSlice_sd(state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{}>>) {
    const { sliceId } = action.payload;
    if (!state.subordinate[sliceId]) {
      state.subordinate[sliceId] = genSubordinateState();
    }
  },
  doRemoveSlice_sd(state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{}>>) {
    const { sliceId } = action.payload;
    if (state.subordinate[sliceId]) {
      delete state.subordinate[sliceId];
    }
  },
  doUpdateSliceAny_sd(state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{ name: keyof SubordinateMailState; data: any }>>) {
    const { sliceId, name, data } = action.payload;
    const isSliceExist = sliceStateCheck(state, sliceId, 'subordinate');
    if (isSliceExist) {
      if (name) {
        try {
          if (!state.subordinate[sliceId]) {
            state.subordinate[sliceId] = genSubordinateState();
          }
          (state.subordinate[sliceId][name] as any) = data;
        } catch (e) {
          console.warn('[subordinate doUpdateSliceAny Error]', name, e);
        }
      } else {
        console.warn('[subordinate doUpdateSliceAny Error]', name);
      }
    }
  },
  /************ 单一业务状态 ************/
  doUpdateRefreshBtnLoading_sd: (state: RootMailBoxReducerState, action: PayloadAction<SliceIdParams<{ data: boolean }>>) => {
    const { sliceId, data } = action.payload;
    const isSliceExist = sliceStateCheck(state, sliceId, 'subordinate');
    if (isSliceExist) {
      state.subordinate[sliceId].refreshBtnLoading = data;
    }
  },
};
