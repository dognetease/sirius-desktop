import { ContactModel, MemberType } from 'api';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MailActions } from './index';

export interface IContactReducer {
  contact: { external?: ContactModel; createFlag?: string };
  selector: {
    focused: string;
    add: boolean;
    pendingItem: any;
  };
  selectedTags: {
    type: MemberType;
    emails: string[];
  };
  currentEditingMail: {
    type: string;
    current: string;
  };
}

const InitialState: IContactReducer = {
  contact: {},
  selector: {
    focused: '',
    add: false,
    pendingItem: null,
  },
  selectedTags: {
    type: '',
    emails: [],
  },
  /** 当前正在编辑的联系人 */
  currentEditingMail: {
    type: '',
    current: '',
  },
};

const contactSlice = createSlice({
  name: 'tempContactReducer',
  initialState: InitialState,
  reducers: {
    doCreateFormExternal: (state, action: PayloadAction<any>) => {
      state.contact.external = action.payload;
    },
    doCreateAfterFlag: (state, action: PayloadAction<any>) => {
      state.contact.createFlag = action.payload;
    },
    doFocusSelector: (state, action: PayloadAction<any>) => {
      state.selector.focused = action.payload;
      state.selectedTags = { emails: [], type: '' };
    },
    doAddItemToSelector: (
      state,
      action: PayloadAction<{
        add: any;
        pendingItem: any;
      }>
    ) => {
      const { add, pendingItem } = action.payload;
      state.selector.add = add;
      state.selector.pendingItem = pendingItem;
    },
    doSelectTags: (
      state,
      action: PayloadAction<{
        type: MemberType;
        emails: string[];
      }>
    ) => {
      const { type, emails } = action.payload;
      state.selectedTags.type = type;
      state.selectedTags.emails = Array.from(new Set(emails));
      state.selector.focused = type;
    },
    doSetCurrentEditingMail: (state, action: PayloadAction<{ type: string; current: string }>) => {
      const { type, current } = action.payload;
      state.currentEditingMail = { type, current };
    },
  },
  /** 异步操作 */
  extraReducers: builder => {
    builder.addCase(MailActions.doCloseMail, state => {
      state.selectedTags = { emails: [], type: '' };
    });
  },
});

export const { actions } = contactSlice;
export default contactSlice.reducer;
