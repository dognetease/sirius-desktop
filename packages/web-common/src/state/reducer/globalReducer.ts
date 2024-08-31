import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { inWindow, ModeType } from 'api';
import store from '@web-common/state/createStore';

export type ActiveKeys = 'mailbox' | 'message' | 'schedule' | 'disk' | 'contact' | 'icon';

export interface GlobalReducer {
  debugComponents: Record<string, boolean | undefined>;
  activeKey: ActiveKeys;
  globalPrivileges: Privilege[];
  showWhatsAppNotify: boolean; // 默认展示 WhatsApp 气泡提示
  waModeType: ModeType; // wa 分配模式
}

// 权限
interface Privilege {
  accessId: string;
  accessName: string;
  resourceId: string;
  resourceName: string | null;
}

// resourceId：2-企业空间，3-个人空间，权限：1-企业空间使用权限，2-企业空间分享权限，3-个人空间使用权限，4-个人空间分享权限

const InitialState: GlobalReducer = {
  debugComponents: {},
  activeKey: 'mailbox',
  globalPrivileges: [],
  showWhatsAppNotify: true,
  waModeType: ModeType.free,
};

const GlobalSlice = createSlice({
  name: 'globalReducer',
  initialState: InitialState,
  reducers: {
    setActiveKey: (state, action: PayloadAction<ActiveKeys>) => {
      state.activeKey = action.payload;
    },
    setGlobalPrivileges: (state, action: PayloadAction<Privilege[]>) => {
      state.globalPrivileges = action.payload;
    },
    setWhatsAppNotify: (state, action: PayloadAction<boolean>) => {
      console.log('notify status', action.payload);
      state.showWhatsAppNotify = action.payload;
    },
    updateWaModeType: (state, action: PayloadAction<ModeType>) => {
      state.waModeType = action.payload;
    },
    setDebugComponents: (state, action: PayloadAction<Record<string, boolean | undefined>>) => {
      state.debugComponents = Object.assign(state.debugComponents, action.payload);
    },
  },
});

if (inWindow() && !window.__SIRIUS_DEBUG_COMPONENTS__) {
  window.__SIRIUS_DEBUG_COMPONENTS__ = (parmas: Record<string, boolean | undefined>) => {
    store.dispatch(actions.setDebugComponents(parmas || {}));
  };
}

export const { actions } = GlobalSlice;
export default GlobalSlice.reducer;
