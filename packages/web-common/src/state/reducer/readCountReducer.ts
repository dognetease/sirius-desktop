import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PageName } from '@/components/Layout/model';

export interface IReadCountReducer {
  unreadCount: {
    [key in PageName]?: number;
  };
}
const InitialState: IReadCountReducer = {
  unreadCount: {},
};

const readCountSlice = createSlice({
  name: 'readCountReducer',
  initialState: InitialState,
  reducers: {
    updateMailboxUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount.mailbox = action.payload;
    },
    addMailboxUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount.mailbox = (state.unreadCount.mailbox ?? 0) + (action.payload ?? 1);
    },

    updateGloablSearchUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount.globalSearch = action.payload;
    },

    updateWmdataUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount.wmData = action.payload;
    },

    updateCustomStarUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount.customsData = action.payload;
    },

    minusMailboxUnreadCount: (state, action: PayloadAction<number>) => {
      if (state.unreadCount.mailbox === undefined || state.unreadCount.mailbox === 0) {
        return;
      }
      state.unreadCount.mailbox = (state.unreadCount.mailbox ?? 0) - (action.payload ?? 1);
      if ((state.unreadCount.mailbox as number) < 0) {
        state.unreadCount.mailbox = 0;
      }
    },
    updateIMUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount.message = action.payload;
    },
    addIMUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount.message = (state.unreadCount.message ?? 0) + (action.payload ?? 1);
    },

    minusIMUnreadCount: (state, action: PayloadAction<number>) => {
      if (state.unreadCount.message === undefined || state.unreadCount.message === 0) {
        return;
      }
      state.unreadCount.message = (state.unreadCount.message ?? 0) - (action.payload ?? 1);
      if ((state.unreadCount.message as number) < 0) {
        state.unreadCount.message = 0;
      }
    },

    updateWAReddot: (state, action: PayloadAction<boolean>) => {
      state.unreadCount.wa = Number(action.payload);
    },
  },
  /** 异步操作 */
  extraReducers: {},
});

export const { actions } = readCountSlice;
export default readCountSlice.reducer;
