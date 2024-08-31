import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AiMarketingContact, PrevScene, GetDiagnosisDetailRes } from 'api';

interface AiHostingInitObj {
  type?: 'new' | 'create' | 'normal' | 'filter' | 'write' | 'automatic' | 'contactAdd';
  handleType?: 'create' | 'normal' | 'bigData' | 'assembly';
  contacts?: AiMarketingContact[];
  taskId?: string;
  filter?: boolean;
  from?: PrevScene;
  back?: string;
  ids?: string[];
  completeCallback?: (planId: string, groupId: string, groupName: string, ids?: string[], hideToast?: boolean) => void;
  ruleId?: string;
  product?: string;
  customerProducts?: string;
  country?: string;
  onCreateSuccess?: (data: { planId: string; product: string; country: string }) => void;
  trackFrom?: string;
}

export interface AiWriteMailReducer {
  /**
   * 是否展示ai写信入口
   */
  showAiWriteModal: boolean;
  /**
   * 是否展示ai润色入口
   */
  showAiOptimizeModal: boolean;
  /**
   * 是否存在ai营销托管缓存
   */
  aiHostingCache: boolean;
  /**
   * 跳转营销托管页面所携带的参数 结构不确定
   */
  aiHostingInitObj: AiHostingInitObj;
  diagnosisDetail?: GetDiagnosisDetailRes;
}

const initialState: AiWriteMailReducer = {
  showAiOptimizeModal: false,
  showAiWriteModal: false,
  aiHostingCache: false,
  aiHostingInitObj: {} as AiHostingInitObj,
  diagnosisDetail: undefined,
};

const AiWriteMailSlice = createSlice({
  name: 'AiWriteMailReducer',
  initialState,
  reducers: {
    changeShowAiWriteModal: (
      state,
      action: PayloadAction<{
        show: boolean;
      }>
    ) => {
      const { show } = action.payload;
      state.showAiWriteModal = show;
    },
    changeShowAiOptimizeModal: (
      state,
      action: PayloadAction<{
        show: boolean;
      }>
    ) => {
      const { show } = action.payload;
      state.showAiOptimizeModal = show;
    },
    updateAiHostingCache: (
      state,
      action: PayloadAction<{
        cache: boolean;
      }>
    ) => {
      const { cache } = action.payload;
      state.aiHostingCache = cache;
    },
    changeAiHostingInitObj: (state, action: PayloadAction<AiHostingInitObj>) => {
      const aiHostingInitObj = { ...action.payload };
      state.aiHostingInitObj = aiHostingInitObj;
    },
    changeDiagnosisDetail: (
      state,
      action: PayloadAction<{
        diagnosisDetail: GetDiagnosisDetailRes;
      }>
    ) => {
      state.diagnosisDetail = action.payload.diagnosisDetail;
    },
  },
});

export const { actions } = AiWriteMailSlice;
export default AiWriteMailSlice.reducer;
