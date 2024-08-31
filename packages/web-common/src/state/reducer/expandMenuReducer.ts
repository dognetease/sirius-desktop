import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiHolder } from 'api';

const storageApi = apiHolder.api.getDataStoreApi();
const STORAGE_KEY = 'MenuFold';

export interface ExpandMenuState {
  isFold: boolean;
}

const expandMenuSlice = createSlice({
  name: 'expandMenuSlice',
  initialState: () => {
    return {
      isFold: storageApi.getSync(STORAGE_KEY).data === '1',
    };
  },
  reducers: {
    setIsFold: (state, action: PayloadAction<boolean>) => {
      state.isFold = action.payload;
      storageApi.put(STORAGE_KEY, action.payload ? '1' : '0', {
        noneUserRelated: false,
      });
    },
  },
});

export const { actions } = expandMenuSlice;
export default expandMenuSlice.reducer;
