import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationProps {
  name?: string; // 通知名称，用于缓存
  type: 'render' | 'carousel'; // 支持自定义渲染、轮播、大弹窗
  component?: React.ReactNode;
  module?: string; // 渲染所在模块路由
  pages?: string[]; // 渲染所在页面路由
  config?: {
    title: string;
    label: string;
    list: {
      key: string;
      icon: React.ReactNode;
      title: string;
      content: string;
      image: string;
    }[];
  };
}
interface NotificationState {
  newbieTask: boolean | null;
  globalNotification: NotificationProps | null;
  moduleNotifications: NotificationProps[];
}

const initialState: NotificationState = {
  newbieTask: null,
  globalNotification: null,
  moduleNotifications: [],
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    showNewbieTask(state) {
      state.newbieTask = true;
    },
    removeNewbieTask(state) {
      state.newbieTask = null;
    },
    showGlobalNotification(state, action: PayloadAction<NotificationProps>) {
      state.globalNotification = action.payload;
    },
    hideGlobalNotification(state) {
      state.globalNotification = null;
    },
    addModuleNotification(state, action: PayloadAction<NotificationProps>) {
      state.moduleNotifications.push(action.payload);
    },
    removeModuleNotification(state, action: PayloadAction<Number>) {
      state.moduleNotifications.splice(action.payload, 1);
    },
  },
});

export const { showNewbieTask, removeNewbieTask, showGlobalNotification, hideGlobalNotification, addModuleNotification, removeModuleNotification } =
  notificationSlice.actions;
export const { actions } = notificationSlice;

export default notificationSlice.reducer;
