import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { apiHolder, apis, SnsMarketingApi, SnsTaskAiQuota } from 'api';

const snsMarketingApi = apiHolder.api.requireLogicalApi(apis.snsMarketingApiImpl) as unknown as SnsMarketingApi;

const initState: SnsTaskAiQuota = {
  dateOfDay: '',
  totalQuota: 0,
  remainQuota: 0,
};

export const fetchSnsAiQuota = createAsyncThunk('sns-marketing/fetchSnsAiQuota', async () => {
  return snsMarketingApi.getSnsTaskQuota();
});

const snsAiQuotaSlicer = createSlice({
  name: 'noviceTaskSlicer',
  initialState: initState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchSnsAiQuota.pending, state => {})
      .addCase(fetchSnsAiQuota.fulfilled, (state, action) => {
        state.dateOfDay = action.payload.dateOfDay;
        state.totalQuota = action.payload.totalQuota;
        state.remainQuota = action.payload.remainQuota;
      });
  },
});

export const getSnsAiQuota = createSelector(
  (state: SnsTaskAiQuota) => state,
  state => state
);
export const { actions } = snsAiQuotaSlicer;
export default snsAiQuotaSlicer.reducer;
