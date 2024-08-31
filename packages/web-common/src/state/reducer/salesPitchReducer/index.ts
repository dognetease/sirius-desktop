import { createSlice } from '@reduxjs/toolkit';
import { salesPitchInitialState } from './state';
import { salesPitchReducers } from './reducer';
import { SalesPitchExtraReducers, SalesPitchThunks } from './thunk';

const salesPitchSlice = createSlice({
  name: 'salesPitch',
  initialState: salesPitchInitialState,
  reducers: {
    // mailbox相关reducer
    ...salesPitchReducers,
  },
  /** 异步操作 or 监听 action */
  extraReducers: builder => {
    SalesPitchExtraReducers(builder);
  },
});

export const Thunks = {
  ...SalesPitchThunks,
};

export const { actions } = salesPitchSlice;
export default salesPitchSlice.reducer;
