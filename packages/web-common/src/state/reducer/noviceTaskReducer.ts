import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { apiHolder, apis, TaskCenterApi, NoviceTaskHandleItem } from 'api';

const eventApi = apiHolder.api.getEventApi();
const taskCenterApi = apiHolder.api.requireLogicalApi(apis.taskCenterApiImpl) as unknown as TaskCenterApi;

export interface NoviceTaskState {
  isNovice: Boolean;
  taskMap: Record<string, NoviceTaskHandleItem>;
}

const initState: NoviceTaskState = {
  isNovice: false,
  taskMap: {},
};

const createNoviceTaskKey = (moduleType: string, taskType: string) => `${moduleType}+${taskType}`;

const noviceTaskSlicer = createSlice({
  name: 'noviceTaskSlicer',
  initialState: initState,
  reducers: {
    registerNoviceTask: (state, action: PayloadAction<NoviceTaskHandleItem>) => {
      const { moduleType, taskType } = action.payload;
      const taskKey = createNoviceTaskKey(moduleType, taskType);

      state.taskMap[taskKey] = action.payload;
    },
    startNoviceTask: (
      state,
      action: PayloadAction<{
        moduleType: string;
        taskType: string;
        startStep?: number;
      }>
    ) => {
      const { moduleType, taskType, startStep = 1 } = action.payload;
      const taskKey = createNoviceTaskKey(moduleType, taskType);

      if (state.taskMap[taskKey]) {
        state.taskMap[taskKey] = {
          ...state.taskMap[taskKey],
          step: startStep,
        };
      }
    },
    commitNoviceTask: (
      state,
      action: PayloadAction<{
        moduleType: string;
        taskType: string;
        commitStep: number;
      }>
    ) => {
      const { moduleType, taskType, commitStep } = action.payload;
      const taskKey = createNoviceTaskKey(moduleType, taskType);

      if (state.taskMap[taskKey] && state.taskMap[taskKey].step === commitStep) {
        const isFinished = commitStep >= state.taskMap[taskKey].steps.length;

        if (isFinished) {
          noviceTaskSlicer.caseReducers.finishNoviceTask(state, {
            payload: { moduleType, taskType },
            type: '',
          });
        } else {
          state.taskMap[taskKey] = {
            ...state.taskMap[taskKey],
            step: commitStep + 1,
          };
        }
      }
    },
    finishNoviceTask: (
      state,
      action: PayloadAction<{
        moduleType: string;
        taskType: string;
      }>
    ) => {
      const { moduleType, taskType } = action.payload;
      const taskKey = createNoviceTaskKey(moduleType, taskType);

      if (state.taskMap[taskKey]) {
        state.taskMap[taskKey] = {
          ...state.taskMap[taskKey],
          step: 0,
          handling: false,
        };

        const { taskId, taskName } = state.taskMap[taskKey];

        taskCenterApi.finishNoviceTask({ taskId }).then(() => {
          taskCenterApi.getNoviceTaskRemind().then(shouldRemind => {
            eventApi.sendSysEvent({
              eventName: 'NoviceTaskFinished',
              eventStrData: '',
              eventData: { taskName, shouldRemind },
            });
          });
        });
      }
    },
    quitNoviceTask: (
      state,
      action: PayloadAction<{
        moduleType: string;
        taskType: string;
      }>
    ) => {
      const { moduleType, taskType } = action.payload;
      const taskKey = createNoviceTaskKey(moduleType, taskType);

      if (state.taskMap[taskKey]) {
        state.taskMap[taskKey] = {
          ...state.taskMap[taskKey],
          step: 0,
          handling: false,
        };
      }
    },
    updateNoviceState: (state, action: PayloadAction<Boolean>) => {
      state.isNovice = action.payload;
    },
  },
});

export const getNoviceTask = createSelector(
  (state: NoviceTaskState, moduleType: string, taskType: string) => {
    const taskKey = createNoviceTaskKey(moduleType, taskType);
    const task = state.taskMap[taskKey];

    return task || null;
  },
  data => data
);

export const { actions } = noviceTaskSlicer;
export default noviceTaskSlicer.reducer;
