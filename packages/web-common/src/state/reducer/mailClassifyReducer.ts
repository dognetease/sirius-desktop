import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IMailClassifyReducer {
  showMailClassifyModal: boolean;
  // 来信分类弹窗类型
  modalType: 'list' | 'edit';
  // 是否存在来信分类列表
  isClassifyList: boolean;
  // 来信分类移动至
  mailFolderId: string;
  // 来信分类包含邮箱
  mailSender: string;
  // 标题
  mailTitle: string;
  // 自定义标签
  mailTag: string;
}

const InitialState: IMailClassifyReducer = {
  showMailClassifyModal: false,
  modalType: 'list',
  isClassifyList: true,
  mailFolderId: '',
  mailSender: '',
  mailTitle: '',
  mailTag: '',
};

const mailClassifySlice = createSlice({
  name: 'mailClassifyReducer',
  initialState: InitialState,
  reducers: {
    changeShowClassifyModal: (state, action: PayloadAction<boolean>) => {
      state.showMailClassifyModal = action.payload;
    },
    setModalType: (state, action: PayloadAction<'list' | 'edit'>) => {
      state.modalType = action.payload;
    },
    setIsClassifyList: (state, action: PayloadAction<boolean>) => {
      state.isClassifyList = action.payload;
    },
    setMailFolderId: (state, action: PayloadAction<string>) => {
      state.mailFolderId = action.payload;
    },
    setMailSender: (state, action: PayloadAction<string>) => {
      state.mailSender = action.payload;
    },
    setMailTitle: (state, action: PayloadAction<string>) => {
      state.mailTitle = action.payload;
    },
    setMailTag: (state, action: PayloadAction<string>) => {
      state.mailTag = action.payload;
    },
  },
});

export const { actions } = mailClassifySlice;
export default mailClassifySlice.reducer;
