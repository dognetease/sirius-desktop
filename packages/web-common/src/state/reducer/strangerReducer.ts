import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MailEntryModel, StrangerModel } from 'api';

export interface StrangerReducer {
  strangers: StrangerModel[];
  // 当前陌生人
  curStranger: StrangerModel | null;
  // 邮件列表
  // mailList: MailEntryModel[];
  // 当前选中邮件id
  // selectedMail: string;
  // activeStrangerIds: string[];
}

const InitialState: StrangerReducer = {
  strangers: [],
  curStranger: null,
  // mailList: [],
  // selectedMail: '',
  // activeStrangerIds: []
};

const strangerSlice = createSlice({
  name: 'strangerReducer',
  initialState: InitialState,
  reducers: {
    setStrangers: (state, action: PayloadAction<StrangerModel[]>) => {
      state.strangers = action.payload;
    },
    setCurStranger: (state, action: PayloadAction<StrangerModel | null>) => {
      state.curStranger = action.payload;
    },
    // setMailList: (state, action: PayloadAction<MailEntryModel[]>) => {
    //   state.mailList = action.payload;
    // },
    // setSelectedMail: (state, action: PayloadAction<string>) => {
    //   state.selectedMail = action.payload;
    // },
    // setActiveStrangerIds: (state, action: PayloadAction<string[]>) => {
    //   state.activeStrangerIds = action.payload;
    // },
    removeStrangers: (state, action: PayloadAction<string[]>) => {
      const removedAccountNames = action.payload;
      state.strangers = state.strangers.filter(item => {
        const { accountName } = item;
        return !!removedAccountNames.includes(accountName) ? false : true;
      });
    },
  },
});

export const { actions } = strangerSlice;
export default strangerSlice.reducer;
