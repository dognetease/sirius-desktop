/* eslint-disable no-param-reassign */
import { MailApi, apiHolder, apis, MailConfApi } from 'api';
import { AsyncThunkConfig } from '@web-common/state/createStore';
import { MailBoxReducerState, thunksStore, refreshPageParam } from '../../../types';
import { thunkHelperFactory, reduxMessage, isMainAccount, getTreeStatesByAccount, checkLocalHk } from '../../../util';
import { idIsTreadMail, getIsSearchingMailByState } from '../../customize';
import { MailListThunks, MailListExtraReducersList } from './listThunk';
import { FolderThunks, FolderExtraReducersList } from './folderThunks';
import { mailManageThunks, mailManageReducersList } from './mailManageThunks';
import { mailStateManageThunks, mailStateManageReducersList } from './mailStateManage';
import { searchThunk, searchReducersList } from './searchThunk';

import { MailListThunks_cm, MailListExtraReducersList_cm } from '@web-mail/state/slice/customerMailReducer/thunks/listThunk_cm';
import { FolderThunks_cm, FolderExtraReducersList_cm } from '@web-mail/state/slice/customerMailReducer/thunks/folderThunks_cm';
import { MailBoxThunks_cm, MailBoxExtraReducersList_cm } from '@web-mail/state/slice/customerMailReducer/thunks/mailBoxThunks_cm';

import { FolderThunks_sd, FolderExtraReducersList_sd } from '@web-mail/state/slice/subordinateMailReducer/thunks/folderThunks_sd';
import { MailBoxThunks_sd, MailBoxExtraReducersList_sd } from '@web-mail/state/slice/subordinateMailReducer/thunks/mailBoxThunks_sd';
import { getIn18Text } from 'api';

const mailApis = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const systemApi = apiHolder.api.getSystemApi();
const mailManagerApi = apiHolder.api.requireLogicalApi('mailConfApiImpl') as unknown as MailConfApi;
const ReducerName = 'MailReducer';
const Thunks: thunksStore = {};
const MailBoxExtraReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, MailBoxExtraReducersList);

// 请求邮件标签
// tag-todo: 先简单请求，再做频次控制
thunkHelper({
  name: 'requestTaglist',
  request: async (params: { account?: string }, thunkAPI) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    const { account } = params;
    if (account) {
      dispatch(Thunks.requestTaglistByAccount({ account }));
    } else {
      const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
      const mailTreeStateMap = state?.mailTreeStateMap || {};
      for (let i in mailTreeStateMap) {
        if ((mailTreeStateMap[i] && !mailTreeStateMap[i].expired) || i == 'main') {
          dispatch(Thunks.requestTaglistByAccount({ account: i == 'main' ? '' : i }));
        }
      }
    }
  },
  fulfilled: (state: MailBoxReducerState, action) => {},
});

thunkHelper({
  name: 'requestTaglistByAccount',
  request: async (params: { account?: string }) => {
    const { account } = params;
    return mailManagerApi.requestTaglist(account);
  },
  fulfilled: (state: MailBoxReducerState, action) => {
    const res = action.payload;
    const account = action?.meta?.arg?.account;
    if (res) {
      if (res.length > 300) {
        if (isMainAccount(account)) {
          state.mailTreeStateMap.main.mailTagList = res.slice(0, 300);
        } else {
          const map = getTreeStatesByAccount(state.mailTreeStateMap, account);
          if (map) {
            map.mailTagList = res.slice(0, 300);
          }
        }
      } else {
        if (isMainAccount(account)) {
          state.mailTreeStateMap.main.mailTagList = res || [];
        } else {
          const map = getTreeStatesByAccount(state.mailTreeStateMap, account);
          if (map) {
            map.mailTagList = res || [];
          }
        }
      }
      // 校对本地标签快捷键
      // checkLocalHk(res);
    }
  },
});

// 刷新页面
thunkHelper({
  name: 'refreshPage',
  request: async (_params: refreshPageParam, thunkAPI: AsyncThunkConfig) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    // const { showMessage = trye } = params;
    // const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { selectedKeys, mailDataList, mailTreeStateMap } = state;
    const isCorpMail = thunkAPI.getState().loginReducer.loginInfo.isCorpMailMode;
    if (!isCorpMail) {
      dispatch(Thunks.requestTaglist({}));
    }
    // 刷新页面的时候，每次都出触发三方账号的插队请求
    // 与refreshMailList 中的插队请求根据mailDataList长度互斥，防止发送两次
    try {
      const isSearching = getIsSearchingMailByState(state);
      if (selectedKeys?.authAccountType != null && selectedKeys?.authAccountType != '0' && !isSearching && mailDataList?.length != 0) {
        const folderId = parseInt(selectedKeys?.id + ''); // 转换为十进制数字
        if (!isNaN(folderId)) {
          // 发送插队请求
          mailApis.triggerReceive({
            folderId: folderId,
            _account: selectedKeys?.accountId || '',
          });
        }
      }
    } catch (err) {
      console.log('[Error refreshPage-triggerReceive]', e);
    }
    try {
      const accountList: string[] = [];
      if (mailTreeStateMap) {
        for (let i in mailTreeStateMap) {
          // 主账号没有别名
          if (i != 'main') {
            accountList.push(i);
          }
        }
      }
      await Promise.all([
        // mailApis.syncMailFolder(),
        dispatch(FolderThunks.refreshFolder({ noCache: true })),
        // isCorpMail不走缓存  普通请求也不走缓存
        dispatch(MailListThunks.refreshMailList({ showLoading: false, noCache: true })),
        // mailApis.cleanDecryptedCached(),
        // 刷新多账号文件夹昵称
        dispatch(FolderThunks.getUserFolderAlias({ accountList })),
      ]);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
  pending: (state: MailBoxReducerState) => {
    state.refreshBtnLoading = true;
  },
  fulfilled: (state: MailBoxReducerState, action) => {
    // 作为参数传递给回调函数
    const { refreshHasNewMail } = state;
    const successCb = action?.meta?.arg?.successCb;
    if (successCb) {
      successCb(refreshHasNewMail);
    }
    state.refreshHasNewMail = false;
    state.refreshBtnLoading = false;
    state.noticeNum = 0;
    state.refreshLoading = false;
  },
  rejected: (state: MailBoxReducerState, action) => {
    const showMessage = action.meta.arg || true;
    if (showMessage) {
      reduxMessage.success({
        content: getIn18Text('SHOUXINSHIBAI'),
      });
    }
    state.refreshBtnLoading = false;
    state.refreshLoading = false;
  },
});
// 新窗口打开
thunkHelper({
  name: 'openMailInNewWindow',
  request: async (params: string, thunkAPI: AsyncThunkConfig) => {
    // const { dispatch, rejectWithValue } = thunkAPI;
    const id = params;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { _account, isTpMail } = state.mailEntities[id] || {};
    if (id) {
      const isThread = idIsTreadMail(id);
      if (systemApi.isElectron()) {
        systemApi.createWindowWithInitData(
          { type: 'readMail', additionalParams: { account: _account } },
          { eventName: 'initPage', eventData: { id: id, accountId: _account, isTpMail }, eventStrData: isThread ? 'isthread' : '' }
        );
      } else {
        window.open(
          `${systemApi.getContextPath()}/readMail/?id=${id}${_account ? '&account=' + _account : ''}${isThread ? '&isthread=1' : ''}${isTpMail ? '&isTpMail=1' : ''}`,
          'readMail',
          'menubar=0,scrollbars=1,resizable=1,width=800,height=600'
        );
      }
    }
  },
});

export const MailBoxThunks = {
  ...Thunks,
  ...MailListThunks,
  ...FolderThunks,
  ...mailManageThunks,
  ...mailStateManageThunks,
  ...searchThunk,
  ...MailListThunks_cm,
  ...FolderThunks_cm,
  ...MailBoxThunks_cm,
  ...FolderThunks_sd,
  ...MailBoxThunks_sd,
};
export const MailBoxExtraReducers = (builder: any) => {
  MailBoxExtraReducersList.forEach((fn: any) => fn(builder));
  MailListExtraReducersList.forEach((fn: any) => fn(builder));
  FolderExtraReducersList.forEach((fn: any) => fn(builder));
  mailManageReducersList.forEach((fn: any) => fn(builder));
  mailStateManageReducersList.forEach((fn: any) => fn(builder));
  searchReducersList.forEach((fn: any) => fn(builder));
  MailListExtraReducersList_cm.forEach((fn: any) => fn(builder));
  FolderExtraReducersList_cm.forEach((fn: any) => fn(builder));
  MailBoxExtraReducersList_cm.forEach((fn: any) => fn(builder));
  FolderExtraReducersList_sd.forEach((fn: any) => fn(builder));
  MailBoxExtraReducersList_sd.forEach((fn: any) => fn(builder));
};
