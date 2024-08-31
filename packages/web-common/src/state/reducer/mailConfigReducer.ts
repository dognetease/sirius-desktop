/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { createSlice, PayloadAction, createAsyncThunk, isAnyOf } from '@reduxjs/toolkit';
import { NiceModalActions } from '@web-common/state/reducer';
import { ModalIdList } from '@web-common/state/reducer/niceModalReducer';
import {
  apiHolder as api,
  apis,
  MailSignatureApi,
  SignDetail,
  AddSignReq,
  AddCustomizeSignReq,
  UpdateSignReq,
  UpdateCustomizeSignReq,
  SignPreviewReq,
  SetDefaultReq,
  SignTemplate,
} from 'api';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { RootState } from '../createStore';
import { isMainAccount, setCurrentAccount } from '@web-mail/util';
import { getIn18Text } from 'api';
export interface IMailConfigReducer {
  /** 主账号签名列表 */
  signList: SignDetail[];
  /** 第三方账号签名列表 */
  signListOther: SignDetail[];
  /** 签名模板ids */
  signTemplates: SignTemplate[];
  /** 签名预览 html */
  signPriviewContent: string;
  /** 主账号签名list加载loading */
  signListLoading: boolean;
  /** 第三方账号list加载loading */
  signListOtherLoading: boolean;
  /** cud loading状态 */
  signActionLoading: boolean;
  /** 自定义签名内容 */
  signContent: string;
  /** 签名 modal是否可见 */
  // signModalVisible: boolean;
  /** 签名列表 modal */
  // signListModalVisible: boolean;
  /** 签名预览 modal */
  signPreviewModalVisible: boolean;
  /** 正在编辑的sign item */
  signItem: SignDetail | null;
  errMsg: string;
  /** 默认头像 */
  defaultAvatar: string;
  mailTemplateContent: any[];
  selectSign: number;
  // 编辑器是否有内容
  hasContent: boolean;
  currentMail: string;
  nickname: string;
  displayMail: string;
}
const InitialState: IMailConfigReducer = {
  // 主账号签名列表
  signList: [],
  // 第三方账号签名列表
  signListOther: [],
  signTemplates: [],
  signPriviewContent: '',
  signListLoading: false,
  signListOtherLoading: false,
  signActionLoading: false,
  // signModalVisible: false,
  // signListModalVisible: false,
  signPreviewModalVisible: false,
  signContent: '',
  signItem: null,
  errMsg: '',
  defaultAvatar: '',
  mailTemplateContent: [],
  selectSign: -1,
  hasContent: false,
  currentMail: '',
  nickname: '',
  displayMail: '',
};
const signatureApi = api.api.requireLogicalApi(apis.mailSignatureImplApi) as MailSignatureApi;
const REDUCER_NAME_SPACE = 'mailConfigReducer';
/** 获取模板 */
export const getSignTemplatesAsync = createAsyncThunk(
  `${REDUCER_NAME_SPACE}/getSignTemplate`,
  async (params: undefined | { email: string }, { rejectWithValue, getState }) => {
    const { currentMail } = (getState() as RootState).mailReducer;
    const defAccount = currentMail.optSender;
    const curAccountEmail = params?.email || defAccount?.mailEmail;
    // curAccountEmail && setCurrentAccount(curAccountEmail);
    const res = await signatureApi.doGetSignTemplateAndProfile(undefined, curAccountEmail);
    return res?.success ? res.data : rejectWithValue(getIn18Text('HUOQUQIANMINGMO'));
  }
);
/** 获取签名预览 html 富文本本地预览 */
export const previewSignAsync = createAsyncThunk(`${REDUCER_NAME_SPACE}/previewSign`, async (param: SignPreviewReq, { rejectWithValue, dispatch, getState }) => {
  dispatch(mailConfigSlice.actions.doToggleSignPreviewModal(true));
  const { signTemplateId } = (param.signInfo as any) || {};
  const { signContent } = (getState() as RootState).mailConfigReducer;
  if (signTemplateId === 0) {
    return signContent;
  }
  // 多账号先将传入的邮箱信息设置为当前默认
  // setCurrentAccount(currentMail);
  const { currentMail } = (getState() as RootState).mailReducer;
  // currentMail?.optSender && setCurrentAccount(currentMail?.optSender?.id);
  const res = await signatureApi.doGetSignPreview(param, currentMail?.optSender?.id);
  if (res.success) {
    return res.data?.divHtml || '';
  }
  return rejectWithValue(getIn18Text('YULANQIANMINGSHI'));
});
// 在新建签名等操作后重新获取签名列表的操作
const reGetSignListAsync = createAsyncThunk(`${REDUCER_NAME_SPACE}/reGetSignList`, async (params: { email: string }, { dispatch, getState }) => {
  const { currentMail } = (getState() as RootState).mailConfigReducer;
  const curAccountEmail = params?.email;
  if (isMainAccount(curAccountEmail) || !currentMail) {
    await dispatch(getSignListAsync({ email: curAccountEmail }));
  } else {
    await dispatch(getSignListOtherAsync({ email: curAccountEmail }));
  }
});
/** 获取签名列表 */
export const getSignListAsync = createAsyncThunk(`${REDUCER_NAME_SPACE}/getSignList`, async (params: undefined | { email: string }, { rejectWithValue, getState }) => {
  const { currentMail } = (getState() as RootState).mailReducer;
  const defAccount = currentMail.optSender;
  const curAccountEmail = params?.email === undefined ? defAccount?.mailEmail : params?.email;
  // curAccountEmail && setCurrentAccount(curAccountEmail);
  const res = await signatureApi.doGetSignList({}, curAccountEmail);
  if (res?.success) {
    res.data?.map(sign => {
      sign._account = curAccountEmail || '';
    });
    return res.data;
  }
  return rejectWithValue(getIn18Text('HUOQUQIANMINGLIE'));
});
/** 获取第三方账号签名列表，仅用于邮箱设置页展示外露的默认签名 */
export const getSignListOtherAsync = createAsyncThunk(`${REDUCER_NAME_SPACE}/getSignListOther`, async (params: { email: string }, { rejectWithValue, getState }) => {
  const curAccountEmail = params?.email;
  // setCurrentAccount(curAccountEmail);
  const res = await signatureApi.doGetSignList({}, curAccountEmail);
  if (res?.success) {
    res.data?.map(sign => {
      sign._account = curAccountEmail || '';
    });
    return res.data;
  }
  return rejectWithValue(getIn18Text('HUOQUQIANMINGLIE'));
});
/** 新建签名 */
export const addSignAsync = createAsyncThunk(
  `${REDUCER_NAME_SPACE}/addSign`,
  async (param: AddSignReq & AddCustomizeSignReq & { _account?: string; modalId: ModalIdList }, { dispatch, rejectWithValue }) => {
    const currentAccount = param._account || '';
    // setCurrentAccount(currentAccount);
    const reqParams: any = { ...param };
    delete reqParams._account;
    delete reqParams.isDefault;
    delete reqParams.isSetDefault;
    delete reqParams.modalId;
    const res = await signatureApi.doAddSign(reqParams, currentAccount);
    if (res.success) {
      dispatch(NiceModalActions.hideModal({ modalId: param.modalId }));
      await dispatch(reGetSignListAsync({ email: currentAccount }));
      res?.data?.signId && dispatch(mailConfigSlice.actions.doSetSelectSign(res?.data?.signId));
      return true;
    }
    const errMsg = getIn18Text('XINZENGQIANMINGSHI');
    message.error({ content: errMsg });
    dispatch(reGetSignListAsync({ email: currentAccount }));
    return rejectWithValue(errMsg);
  }
);
/**
 * 编辑签名
 */
export const editSignAsync = createAsyncThunk(
  `${REDUCER_NAME_SPACE}/editSign`,
  async (param: UpdateSignReq & UpdateCustomizeSignReq & { _account?: string; modalId: ModalIdList }, { dispatch, rejectWithValue }) => {
    const currentAccount = param._account || '';
    // setCurrentAccount(currentAccount);
    const reqParams: any = { ...param };
    delete reqParams._account;
    reqParams.isDefault = [];
    delete reqParams.isDefault;
    delete reqParams.isSetDefault;
    delete reqParams.modalId;
    const res = await signatureApi.doUpdateSign(reqParams, currentAccount);
    if (res.success) {
      dispatch(NiceModalActions.hideModal({ modalId: param.modalId }));
      dispatch(reGetSignListAsync({ email: currentAccount }));
      return true;
    }
    const errMsg = getIn18Text('BAOCUNQIANMINGSHI');
    message.error({ content: errMsg });
    dispatch(reGetSignListAsync({ email: currentAccount }));
    return rejectWithValue(errMsg);
  }
);
/**
 * 删除签名
 */
export const deleteSignAsync = createAsyncThunk(
  `${REDUCER_NAME_SPACE}/deleteSign`,
  async (
    {
      id,
      refresh = true,
      _account = '',
    }: {
      id: number;
      refresh?: boolean;
      _account?: string;
    },
    { dispatch, rejectWithValue, getState }
  ) => {
    // setCurrentAccount(_account);
    const result = await signatureApi.doDeleteSign(id, _account);
    if (result.success) {
      refresh && dispatch(reGetSignListAsync({ email: _account }));
      return result.data;
    }
    const errMsg = getIn18Text('SHANCHUQIANMINGSHI');
    message.error({ content: errMsg });
    dispatch(reGetSignListAsync({ email: _account }));
    return rejectWithValue(errMsg);
  }
);
/**
 * 使用签名
 */
export const useSignAsync = createAsyncThunk(`${REDUCER_NAME_SPACE}/useSign`, async (param: SetDefaultReq, { dispatch, rejectWithValue }) => {
  const currentAccount = param._account || '';
  // setCurrentAccount(currentAccount);
  const reqParams = { ...param };
  delete reqParams._account;
  const res = await signatureApi.doSetDefaultSign(reqParams, currentAccount);
  if (res.success) {
    dispatch(reGetSignListAsync({ email: currentAccount }));
    return res.data;
  }
  const errMsg = getIn18Text('JIEKOUDIAOYONGSHI');
  message.error({ content: errMsg });
  dispatch(reGetSignListAsync({ email: currentAccount }));
  return rejectWithValue(errMsg);
});
/**
 *
 */
const validateCRUDAction = (type: 'pending' | 'fulfilled' | 'rejected') =>
  isAnyOf(useSignAsync[type], deleteSignAsync[type], editSignAsync[type], addSignAsync[type], getSignTemplatesAsync[type], previewSignAsync[type]);
const mailConfigSlice = createSlice({
  name: REDUCER_NAME_SPACE,
  initialState: InitialState,
  reducers: {
    /** sign editor content */
    doChangeContent: (state, action: PayloadAction<string>) => {
      state.signContent = action.payload;
    },
    /** Toggle编辑签名弹窗 */
    // doToggleModal: (
    //   state,
    //   action: PayloadAction<{
    //     visble: boolean;
    //     signItem?: SignDetail | null;
    //   }>
    // ) => {
    //   const { visble, signItem } = action.payload;
    //   state.signItem = signItem || null;
    //   if (!visble) state.signItem = null;
    //   state.signModalVisible = visble;
    // },
    /** Toggle 签名列表弹窗 */
    // doToggleSignListModal: (state, action: PayloadAction<boolean>) => {
    //   if (action.payload) {
    //     state.selectSign = -1;
    //   }
    //   state.signListModalVisible = action.payload;
    // },
    /** Toggle 签名预览弹窗 */
    doToggleSignPreviewModal: (state, action: PayloadAction<boolean>) => {
      state.signPreviewModalVisible = action.payload;
    },
    doSetSelectSign: (state, action: PayloadAction<number>) => {
      state.selectSign = action.payload;
    },
    doSetHasContent: (state, action: PayloadAction<boolean>) => {
      state.hasContent = action.payload;
    },
    doSetCurrentMail: (state, action: PayloadAction<string>) => {
      state.currentMail = action.payload;
    },
    doSetNickname: (state, action: PayloadAction<string>) => {
      state.nickname = action.payload;
    },
    doSetDisplayMail: (state, action: PayloadAction<string>) => {
      state.displayMail = action.payload;
    },
    doSetSignList: (state, action: PayloadAction<SignDetail[]>) => {
      if (action.payload) {
        state.signList = action.payload;
      }
    },
    doSetSignListOtherMap: (state, action: PayloadAction<SignDetail[]>) => {
      state.signListOther = action.payload;
    },
    doSetSignListLoading: (state, action: PayloadAction<boolean>) => {
      state.signListLoading = !!action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getSignListAsync.pending, state => {
        state.signListLoading = true;
      })
      .addCase(getSignListAsync.fulfilled, (state, action) => {
        state.signContent = '';
        state.signListLoading = false;
        state.signItem = null;
        if (!action.payload) return;
        state.signList = action.payload;
      })
      .addCase(getSignListAsync.rejected, (state, action) => {
        state.signListLoading = false;
      })
      .addCase(getSignListOtherAsync.pending, state => {
        state.signListOtherLoading = true;
      })
      .addCase(getSignListOtherAsync.fulfilled, (state, action) => {
        state.signListOtherLoading = false;
        if (!action.payload) return;
        state.signListOther = action.payload;
      })
      .addCase(getSignListOtherAsync.rejected, (state, action) => {
        state.signListOtherLoading = false;
      })
      .addCase(getSignTemplatesAsync.fulfilled, (state, action) => {
        const { profile = '', templatePics = [] } = action.payload || {};
        state.signTemplates = templatePics || [];
        state.defaultAvatar = profile;
      })
      .addCase(previewSignAsync.fulfilled, (state, action) => {
        state.signPriviewContent = action.payload || '';
      })
      .addMatcher(validateCRUDAction('pending'), state => {
        state.signActionLoading = true;
      })
      .addMatcher(validateCRUDAction('fulfilled'), state => {
        state.signActionLoading = false;
      })
      .addMatcher(validateCRUDAction('rejected'), state => {
        state.signActionLoading = false;
      });
  },
});
export const { actions } = mailConfigSlice;
export default mailConfigSlice.reducer;
