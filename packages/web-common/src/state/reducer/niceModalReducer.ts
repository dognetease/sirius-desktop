import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ModalIdList =
  | 'mailTodo'
  | 'signList'
  | 'signEditOnSetting'
  | 'signEditOnWrite'
  | 'signEditOnWaimao'
  | 'selectSignOnWrite'
  | 'selectSignOnWaimao'
  | 'paidGuide';
export type NiceModalIdStatus = {
  /**
   * false: 页面不渲染弹窗  true: 页面渲染弹窗，是否展示依赖 hiding 中 mailTodo 是否为true 其他: 弹窗入参
   */
  mailTodo: any;
  signList: any;
  selectSignOnWrite: any;
  selectSignOnWaimao: any;
  signEditOnSetting: any;
  signEditOnWrite: any;
  signEditOnWaimao: any;
  paidGuide: any;
};
export type NiceModalIdHidingStatus = {
  mailTodo: boolean;
  signList: boolean;
  selectSignOnWrite: boolean;
  selectSignOnWaimao: boolean;
  signEditOnSetting: boolean;
  signEditOnWrite: boolean;
  signEditOnWaimao: boolean;
  paidGuide: boolean;
};
export interface NiceModalReducer extends NiceModalIdStatus {
  hiding: NiceModalIdHidingStatus;
}

const InitialState: NiceModalReducer = {
  mailTodo: false,
  signList: false,
  selectSignOnWrite: false,
  selectSignOnWaimao: false,
  signEditOnSetting: false,
  signEditOnWrite: false,
  signEditOnWaimao: false,
  paidGuide: false,
  hiding: {
    mailTodo: false,
    signList: false,
    selectSignOnWrite: false,
    selectSignOnWaimao: false,
    signEditOnSetting: false,
    signEditOnWrite: false,
    signEditOnWaimao: false,
    paidGuide: false,
  },
};

const niceModalSlice = createSlice({
  name: 'niceModalReducer',
  initialState: InitialState,
  reducers: {
    showModal: (state, action: PayloadAction<{ modalId: ModalIdList; args?: any }>) => {
      const { modalId, args } = action.payload;
      state[modalId] = args || true;
      // TODO：处理弹窗重叠问题，弹窗show之前，应该先关闭其他弹窗，但是关闭的弹窗应该像路由的history一样记录下来，用于回退状态
      state.hiding[modalId] = false;
    },
    hideModal: (state, action: PayloadAction<{ modalId: ModalIdList; force?: boolean }>) => {
      const { modalId, force } = action.payload;
      if (force) {
        state[modalId] = false;
        state.hiding[modalId] = false;
      } else {
        state.hiding[modalId] = true;
      }
    },
  },
});

export const { actions } = niceModalSlice;
export default niceModalSlice.reducer;
