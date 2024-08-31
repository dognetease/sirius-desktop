import { createSlice, PayloadAction } from '@reduxjs/toolkit';
export interface MailProductReducer {
  imgColumns: string[];
  tableColumns: string[];
}

const InitialState: MailProductReducer = {
  imgColumns: ['product_name_en'],
  tableColumns: ['product_name_en', 'price', 'color', 'volume'],
};

const mailProductSlice = createSlice({
  name: 'mailProductReducer',
  initialState: InitialState,
  reducers: {
    updateImgColumns: (state, action: PayloadAction<any>) => {
      state.imgColumns = action.payload;
    },
    resetImgColumns: state => {
      state.imgColumns = InitialState.imgColumns;
    },
    updateTableColumns: (state, action: PayloadAction<any>) => {
      state.tableColumns = action.payload;
    },
    resetTableColumns: state => {
      state.tableColumns = InitialState.tableColumns;
    },
  },
});

export const { actions } = mailProductSlice;
export default mailProductSlice.reducer;
