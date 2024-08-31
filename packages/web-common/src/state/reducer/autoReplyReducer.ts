import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AutoReplyModel } from 'api';
export interface AutoReplyReducer {
  /** 邮件任务卡片详情 */
  //   taskDetail: TaskMailModel;
  autoReplyDetail: AutoReplyModel;
}

const InitialState: AutoReplyReducer = {
  autoReplyDetail: {} as AutoReplyModel,
};

const readMailSlice = createSlice({
  name: 'autoReplyReducer',
  initialState: InitialState,
  reducers: {
    updateAutoReplyDetail: (state, action: PayloadAction<any>) => {
      state.autoReplyDetail = action.payload;
    },
  },
});

export const { actions } = readMailSlice;
export default readMailSlice.reducer;
