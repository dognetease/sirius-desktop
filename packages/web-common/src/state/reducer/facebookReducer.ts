import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SourceType = 'authPage' | 'accManage' | 'table';

export interface FaceBookState {
  offsiteModalShow: boolean;
  accModalShow: boolean;
  source: SourceType;
  isAuthorized: boolean;
  authorizedLoading: boolean;
  fresh: boolean;
}

const initialState: FaceBookState = {
  offsiteModalShow: false,
  accModalShow: false,
  source: 'authPage',
  isAuthorized: false,
  authorizedLoading: false,
  fresh: false,
};

const slice = createSlice({
  name: 'facebookReducer',
  initialState,
  reducers: {
    setFacebookModalShow(state, action: PayloadAction<{ offsiteModal?: boolean; accModal?: boolean; source?: SourceType }>) {
      const { offsiteModal, accModal, source } = action.payload;
      state.offsiteModalShow = offsiteModal ?? state.offsiteModalShow;
      state.accModalShow = accModal ?? state.accModalShow;
      state.source = source ?? state.source;
    },
    updateOAuth(state, action: PayloadAction<{ isAuthorized?: boolean; authorizedLoading?: boolean }>) {
      const { isAuthorized, authorizedLoading } = action.payload;
      state.isAuthorized = isAuthorized ?? state.isAuthorized;
      state.authorizedLoading = authorizedLoading ?? state.authorizedLoading;
    },
    freshFacebookPages(state, action: PayloadAction<{ fresh: boolean }>) {
      const { fresh } = action.payload;
      state.fresh = fresh;
    },
  },
});

export const FacebookActions = slice.actions;
export default slice.reducer;
