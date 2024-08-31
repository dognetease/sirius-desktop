import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ICardSnapshot {
  editView: string; // 'detail', 'contact'
  formValues: Record<string, any>;
}

export interface ICustomerCardState {
  snapshots: Record<string, ICardSnapshot>;
  lastResourceId: Record<string, string>;
  sideBarEditView: string;
}
const initialState: ICustomerCardState = {
  snapshots: {},
  lastResourceId: {},
  sideBarEditView: '',
};

const slice = createSlice({
  name: 'customerCardReducer',
  initialState,
  reducers: {
    updateSnapshot(state, action: PayloadAction<{ snapshot: ICardSnapshot; key: string }>) {
      const { snapshot, key } = action.payload;
      state.snapshots[key] = snapshot;
    },

    removeKey(state, action: PayloadAction<string>) {
      delete state.snapshots[action.payload];
    },

    updateLastResourceId(state, action: PayloadAction<{ email: string; id: string }>) {
      const { email, id } = action.payload;
      state.lastResourceId[email] = id;
    },
  },
});

export const CustomerCardActions = slice.actions;
export default slice.reducer;
