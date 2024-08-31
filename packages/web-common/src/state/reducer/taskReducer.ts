import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ITaskState {
  taskCount: number;
}

const initialState: ITaskState = {
  taskCount: 0,
};

const slice = createSlice({
  name: 'taskReducer',
  initialState,
  reducers: {
    updateTaskCount(state, action: PayloadAction<ITaskState>) {
      const { taskCount } = action.payload;
      state.taskCount = taskCount;
    },
  },
});

export const TaskActions = slice.actions;
export default slice.reducer;
