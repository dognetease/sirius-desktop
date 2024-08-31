import { thunksStore, MailBoxReducerState, SliceIdParams } from '@web-mail/types';
import { thunkHelperFactory, reduxMessage } from '@web-mail/util';
import { FolderThunks_sd } from '@web-mail/state/slice/subordinateMailReducer/thunks/folderThunks_sd';
import { MailListThunks_cm } from '@web-mail/state/slice/customerMailReducer/thunks/listThunk_cm';
import { getIsSearchingMailByState } from '@web-mail/state/customize';
import { MailActions } from '@web-common/state/reducer';
import { sliceStateCheck, SyncTimerFactory } from '@web-mail/utils/slice';
import { request } from '@web-mail/state/slice/request';
import { getIn18Text } from 'api';

/**
 * thunk
 */
const ReducerName = 'SubordinateBoxReducer';
const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);

export const syncSubordinateTimer = new SyncTimerFactory(request.syncContactColleague, getIn18Text(['XIASHU', 'LIEBIAO', 'QINGQIUCHAOSHI']));

thunkHelper<SliceIdParams<{ successCb: () => void }>, MailBoxReducerState>({
  name: 'refreshPage_sd',
  request: async ({ sliceId }, thunkAPI) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    const state = thunkAPI.getState().mailReducer;
    const isSliceExist = sliceStateCheck(state, sliceId, 'subordinate');
    if (!isSliceExist) {
      return;
    }
    const isSearching = getIsSearchingMailByState(state, sliceId, 'subordinate');
    try {
      if (!isSearching) {
        await Promise.all([
          syncSubordinateTimer.startSyncRace(() => {
            dispatch(MailActions.doUpdateRefreshBtnLoading_sd({ data: false, sliceId }));
          }),
          dispatch(
            FolderThunks_sd.refreshFolder_sd({
              noCache: true,
              showLoading: false,
              sliceId,
            })
          ),
          dispatch(
            MailListThunks_cm.loadMailList_edm({
              showLoading: false,
              noCache: true,
              refresh: true,
              type: 'subordinate',
              sliceId,
            })
          ),
        ]);
      } else {
        await dispatch(
          MailListThunks_cm.loadMailList_edm({
            showLoading: true,
            noCache: true,
            refresh: true,
            type: 'subordinate',
            sliceId,
          })
        );
      }
    } catch (err) {
      return rejectWithValue(err);
    }
  },
  pending: (state, action) => {
    const params = action.meta.arg || {};
    const { sliceId } = params;
    const isSliceExist = sliceStateCheck(state, sliceId, 'subordinate');
    if (!isSliceExist) {
      return;
    }
    state.subordinate[sliceId].refreshBtnLoading = true;
    state.subordinate[sliceId].listLoading = true;
  },
  fulfilled: (state, action) => {
    const { successCb, sliceId } = action.meta.arg || {};
    const { refreshHasNewMail } = state.subordinate[sliceId];
    if (successCb) {
      successCb(refreshHasNewMail);
    }
    state.subordinate[sliceId].refreshHasNewMail = false;
    state.subordinate[sliceId].refreshBtnLoading = false;
    state.subordinate[sliceId].listLoading = false;
  },
  rejected: (state, action) => {
    const { showMessage = true, sliceId } = action.meta.arg || {};
    if (showMessage) {
      const errorMessage = action?.error?.message || action.payload || action.error;
      reduxMessage.success({ content: errorMessage });
    }
    state.subordinate[sliceId].refreshHasNewMail = false;
    state.subordinate[sliceId].refreshBtnLoading = false;
    state.subordinate[sliceId].listLoading = false;
  },
});

export const MailBoxThunks_sd = Thunks;
export const MailBoxExtraReducersList_sd = ReducersList;
