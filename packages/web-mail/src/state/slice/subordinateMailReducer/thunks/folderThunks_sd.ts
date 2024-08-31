import { PayloadAction } from '@reduxjs/toolkit';
import { ContactModel } from 'api';
import { thunksStore, MailBoxReducerState, SliceIdParams, PayloadMeta } from '@web-mail/types';
import { thunkHelperFactory } from '@web-mail/util';
import { getIsSearchingMailByState } from '@web-mail/state/customize';
import { RefreshFolderSdParams } from '@web-mail/state/slice/subordinateMailReducer/types';
import { request } from '@web-mail/state/slice/request';
import { sliceStateCheck } from '@web-mail/utils/slice';
import SubordinateIcon from '@web-common/components/UI/Icons/svgs/edm/SubordinateIcon';
import CustomerContactIcon from '@web-common/components/UI/Icons/svgs/edm/CustomerContactIcon';

/**
 * thunk
 */
const ReducerName = 'SubordinateListReducer';
const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);

// 刷新件夹数据
thunkHelper<SliceIdParams<RefreshFolderSdParams>, MailBoxReducerState>({
  name: 'refreshFolder_sd',
  request: async () => {
    // setCurrentAccount();
    const res: ContactModel[] = await request.doGetColleagueList();
    console.log('[refreshFolder_sd]', res);
    return res;
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<ContactModel[], string, PayloadMeta<SliceIdParams<RefreshFolderSdParams>>>) => {
    const res = action.payload || {};
    const { sliceId } = action.meta.arg || {};
    if (!sliceStateCheck(state, sliceId, 'subordinate')) {
      return;
    }
    state.subordinate[sliceId].customerTreeList = [
      {
        title: '所有下属',
        key: 'all',
        icon: SubordinateIcon(),
        isLeaf: false,
        children: res.map(item => {
          return {
            title: item.contact?.contactName,
            key: item.contact?.id,
            icon: CustomerContactIcon(),
            isLeaf: true,
            accountName: item.contact?.accountName,
            data: item,
            email: item.contact?.accountName,
          };
        }),
      },
    ];
    state.subordinate[sliceId].subordinateListLoading = false;
    state.subordinate[sliceId].expandedKeys = [...state.subordinate[sliceId].expandedKeys];
  },
  pending: (state, action) => {
    const params = action.meta.arg || {};
    const { showLoading = true, sliceId } = params;
    if (!sliceStateCheck(state, sliceId, 'subordinate')) {
      return;
    }
    const isSearching = getIsSearchingMailByState(state, sliceId, 'subordinate');
    if (!isSearching && showLoading) {
      state.subordinate[sliceId].subordinateListLoading = true;
    }
  },
  rejected: (state, action) => {
    const params = action.meta.arg || {};
    const { sliceId } = params;
    if (!sliceStateCheck(state, sliceId, 'subordinate')) {
      return;
    }
    if (state.subordinate[sliceId]) {
      state.subordinate[sliceId].subordinateListLoading = false;
    }
  },
});

export const FolderThunks_sd = Thunks;
export const FolderExtraReducersList_sd = ReducersList;
