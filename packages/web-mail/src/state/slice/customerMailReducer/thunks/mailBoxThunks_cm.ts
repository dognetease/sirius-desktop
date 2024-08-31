import { thunkHelperFactory, reduxMessage } from '@web-mail/util';
import { MailBoxReducerState, thunksStore, SliceIdParams } from '@web-mail/types';

import { sliceStateCheck } from '@web-mail/utils/slice';
import { getIsSearchingMailByState } from '@web-mail/state/customize';

// import { request } from '@web-mail/state/slice/request';
import { FolderThunks_cm } from '@web-mail/state/slice/customerMailReducer/thunks/folderThunks_cm';
import { MailListThunks_cm } from '@web-mail/state/slice/customerMailReducer/thunks/listThunk_cm';
import { getPrivilegeAsync } from '@web-common/state/reducer/privilegeReducer';
// import { getIn18Text } from 'api';
import { refreshContactData } from '@web-common/state/reducer/contactReducer';

const ReducerName = 'CustomerBoxReducer';
const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);

// export const syncCustomerTimer = new SyncTimerFactory(request.syncCustomer, getIn18Text(['KEHU', 'LIEBIAO', 'QINGQIUCHAOSHI']));

thunkHelper<SliceIdParams, MailBoxReducerState>({
  name: 'refreshPage_cm',
  request: async ({ sliceId }, thunkAPI) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    const state = thunkAPI.getState().mailReducer;
    if (!sliceStateCheck(state, sliceId, 'customer')) {
      return;
    }
    const isSearching = getIsSearchingMailByState(state, sliceId, 'customer');
    try {
      if (!isSearching) {
        await dispatch(getPrivilegeAsync());
        // TODO 要刷新全量数据
        await refreshContactData(true);
        // await Promise.all([
        //   // syncCustomerTimer
        //   //   .startSyncRace(() => {
        //   //     dispatch(MailActions.doUpdateRefreshBtnLoading_edm({ data: false, sliceId }));
        //   //   })
        //   //   .then((res: any) => {
        //   //     if (res?.syncFinish) {
        //   //       dispatch(MailActions.doUpdateRefreshBtnLoading_edm({ data: false, sliceId }));
        //   //     }
        //   //     if (res?.error) {
        //   //       console.error('sync error', res?.error);
        //   //     }
        //   //   }),
        //   dispatch(
        //     FolderThunks_cm.loadCustomerList_cm({
        //       showLoading: false,
        //       limit: 30,
        //       refresh: true,
        //       sliceId,
        //     })
        //   ),
        //   dispatch(
        //     MailListThunks_cm.loadMailList_edm({
        //       showLoading: false,
        //       noCache: true,
        //       refresh: true,
        //       sliceId,
        //       type: 'customer',
        //     })
        //   ),
        // ]);
        // 先请求客户列表，在请求邮件列表，因为邮件列表请求入参依赖客户列表的返回
        await dispatch(
          FolderThunks_cm.loadCustomerList_cm({
            showLoading: false,
            limit: 30,
            refresh: true,
            sliceId,
          })
        );
        await dispatch(
          MailListThunks_cm.loadMailList_edm({
            showLoading: false,
            noCache: true,
            refresh: true,
            sliceId,
            type: 'customer',
          })
        );
      } else {
        await dispatch(
          MailListThunks_cm.loadMailList_edm({
            showLoading: true,
            noCache: true,
            refresh: true,
            sliceId,
            type: 'customer',
          })
        );
      }
    } catch (err) {
      return rejectWithValue(err);
    }
  },
  pending: (state, action) => {
    const { sliceId } = action.meta.arg || {};
    if (!sliceStateCheck(state, sliceId, 'customer')) {
      return;
    }
    state.customer[sliceId].refreshBtnLoading = true;
    const isSearching = getIsSearchingMailByState(state, sliceId, 'customer');
    if (!isSearching) {
      state.customer[sliceId].customerListLoading = true;
    }
    state.customer[sliceId].listLoading = true;
  },
  fulfilled: (state, action) => {
    const { sliceId } = action.meta.arg || {};
    if (!sliceStateCheck(state, sliceId, 'customer')) {
      return;
    }
    const { refreshHasNewMail } = state.customer[sliceId];
    const successCb = (action as any)?.meta?.arg?.successCb;
    if (successCb) {
      successCb(refreshHasNewMail);
    }
    state.customer[sliceId].refreshHasNewMail = false;
    state.customer[sliceId].customerListLoading = false;
    state.customer[sliceId].refreshBtnLoading = false;
  },
  rejected: (state, action) => {
    const { showMessage = true, sliceId } = action.meta.arg || {};
    if (!sliceStateCheck(state, sliceId, 'customer')) {
      return;
    }
    if (showMessage) {
      const errorMessage = action?.error?.message || action.payload || action.error;
      reduxMessage.success({ content: errorMessage });
    }
    state.customer[sliceId].refreshHasNewMail = false;
    state.customer[sliceId].customerListLoading = false;
    state.customer[sliceId].refreshBtnLoading = false;
  },
});

export const MailBoxThunks_cm = Thunks;
export const MailBoxExtraReducersList_cm = ReducersList;
