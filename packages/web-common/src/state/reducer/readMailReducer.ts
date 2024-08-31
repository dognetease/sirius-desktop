import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TaskMailModel } from 'api';

export interface ReadMailReducer {
  /** 邮件任务卡片详情 */
  taskDetail: TaskMailModel;
  scrollToAttachments: { mailId: string } | null;
}

const InitialState: ReadMailReducer = {
  taskDetail: {} as TaskMailModel,
  scrollToAttachments: null,
};

const readMailSlice = createSlice({
  name: 'readMailReducer',
  initialState: InitialState,
  reducers: {
    updateTaskDetail: (state, action: PayloadAction<any>) => {
      state.taskDetail = action.payload;
    },
    updateScrollToAttachments: (state, action: PayloadAction<string>) => {
      state.scrollToAttachments = {
        mailId: action.payload,
      };
    },
  },
});

export const { actions } = readMailSlice;
export default readMailSlice.reducer;
