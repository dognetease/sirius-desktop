import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api, SnsAccountInfoShort, SnsMarketingApi, SnsMarketingPlan, SnsMarketingPost, SnsTaskStatus } from 'api';

const snsMarketingApi = api.requireLogicalApi('snsMarketingApiImpl') as unknown as SnsMarketingApi;

export interface SnsTaskEditModel {
  taskId: string;
  taskName: string;
  accounts: SnsAccountInfoShort[];
  plan?: SnsMarketingPlan;
  aiGeneratePostParam?: {
    companyName: string;
    companyProfile: string;
    goods: Array<{ id: string; name: string }>;
    industry: string;
    language: string;
    tone: string;
    companyUrls: string[];
    companyVideoUrls?: string[];
    wordsUpperLimit?: number;
  };
}

export interface SnsTaskPosts {
  loading: boolean;
  action?: 'try' | 'createAll' | 'retry' | 'retryCreateAll';
  hasError: boolean;
  posts: Array<SnsMarketingPost>;
}

export interface SnsMarketingTaskState {
  loadingCurrent: boolean;
  currentTask: SnsTaskEditModel;
  currentPosts: SnsTaskPosts;
  currentTaskStatus: SnsTaskStatus;
}

const initialState: SnsMarketingTaskState = {
  loadingCurrent: false,
  currentTask: {
    taskId: '',
    taskName: '',
    accounts: [],
  },
  currentTaskStatus: SnsTaskStatus.DRAFT,
  currentPosts: {
    loading: false,
    hasError: false,
    posts: [],
  },
};

export const getSnsTaskBaseInfoSync = createAsyncThunk('sns-marketing/getBaseInfo', async () => {
  return snsMarketingApi.createSnsTask();
});

export const getSnsTaskPlanSync = createAsyncThunk('sns-marketing/getTaskPlan', async (accounts: SnsAccountInfoShort[]) => {
  return snsMarketingApi.getDefaultPlan({ accounts });
});

export const getSnsTaskDetailSync = createAsyncThunk('sns-marketing/getSnsTaskDetail', async (id: string) => {
  return snsMarketingApi.getSnsTaskDetail(id);
});

const SnsMarketingTaskSlice = createSlice({
  name: 'SnsMarketingTaskReducer',
  initialState,
  reducers: {
    resetCurrent(state) {
      state.currentTask = {
        taskId: '',
        taskName: '',
        accounts: [],
      };
      state.currentTaskStatus = SnsTaskStatus.DRAFT;
      state.currentPosts = {
        loading: false,
        hasError: false,
        posts: [],
      };
    },
    setTaskName(state, action: PayloadAction<string>) {
      state.currentTask.taskName = action.payload;
    },
    setAccounts(state, action: PayloadAction<SnsAccountInfoShort[]>) {
      state.currentTask.accounts = action.payload;
    },
    setAiParam(
      state,
      action: PayloadAction<
        Partial<{
          companyName: string;
          companyProfile: string;
          goods: Array<{ id: string; name: string }>;
          industry: string;
          language: string;
          tone: string;
          companyUrls: string[];
          companyVideoUrls?: string[];
          wordsUpperLimit?: number;
        }>
      >
    ) {
      state.currentTask.aiGeneratePostParam = {
        companyName: '',
        companyProfile: '',
        goods: [],
        industry: '',
        language: '',
        tone: '',
        companyUrls: [],
        companyVideoUrls: [],
        ...state.currentTask.aiGeneratePostParam,
        ...action.payload,
        wordsUpperLimit: action.payload.wordsUpperLimit === 0 ? undefined : action.payload.wordsUpperLimit,
      };
    },

    setCurrentPosts(state, action: PayloadAction<Partial<SnsTaskPosts>>) {
      state.currentPosts = {
        ...state.currentPosts,
        ...action.payload,
      };
    },

    setTaskStatus(state, action: PayloadAction<SnsTaskStatus>) {
      state.currentTaskStatus = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getSnsTaskBaseInfoSync.pending, state => {
        state.loadingCurrent = true;
      })
      .addCase(getSnsTaskBaseInfoSync.fulfilled, (state, action) => {
        state.currentTask.taskId = action.payload.taskId;
        state.currentTask.taskName = action.payload.taskName;
        state.loadingCurrent = false;
      });

    builder.addCase(getSnsTaskPlanSync.fulfilled, (state, { payload }) => {
      state.currentTask.plan = payload;
    });

    builder
      .addCase(getSnsTaskDetailSync.pending, state => {
        state.loadingCurrent = true;
      })
      .addCase(getSnsTaskDetailSync.fulfilled, (state, action) => {
        state.currentTask = {
          ...action.payload,
          plan: action.payload.taskExecPlan,
        };
        state.currentTaskStatus = action.payload.status;
        state.loadingCurrent = false;
      });
  },
});

export const actions = SnsMarketingTaskSlice.actions;
export default SnsMarketingTaskSlice.reducer;
