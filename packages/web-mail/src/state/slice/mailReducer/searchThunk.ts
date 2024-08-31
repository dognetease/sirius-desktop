/* eslint-disable no-param-reassign */
import { PayloadAction } from '@reduxjs/toolkit';
import { MailSearchResult } from 'api';
import { AsyncThunkConfig } from '@web-common/state/createStore';
import { MailBoxReducerState, thunksStore, mailListStateTabs } from '../../../types';
import { thunkHelperFactory } from '../../../util';
import { MailListThunks } from './listThunk';
import { filterTabMap } from '../../../common/constant';

/**
 * thunk
 */
const ReducerName = 'MailReducer';
const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);
// 从0开始请求搜索邮件
// 中转站 设值
thunkHelper({
  name: 'searchMail',
  request: async (params: any, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    const { value, extraCloud } = params;
    if (value) {
      dispatch(
        MailListThunks.loadSearchMailList({
          startIndex: 0,
        })
      );
      // 额外搜索云端
      if (extraCloud) {
        dispatch(
          MailListThunks.searchCloudMailListExtra({
            startIndex: 0,
          })
        );
      }
    }
  },
  pending: (state: MailBoxReducerState, action: PayloadAction<string>) => {
    const { value, extraCloud } = action.meta.arg || {};
    if (value) {
      // 搜索词
      state.mailSearchKey = value;
      state.isSearchRecorded = false;
      state.scrollTop = 0;
      state.listLoading = true;
      // 当前账号可展示的 3级筛选项
      state.searchResultObj = {} as MailSearchResult;
      state.selectedSearchKeys = {};
      // 各界别的默认选中状态
      state.defaultSelectedSearchKeyMap = {};
      // 选中文件夹包含id
      state.mailSearchFolderIds = [];
      // 默认的列表二级筛选
      state.searchListStateTab = 'ALL';
      state.mailTabs = filterTabMap.normal as mailListStateTabs[];
      state.searchingRequestId = null;
    } else {
      state.activeSearchMailId = {
        id: '',
        accountId: '',
      };
    }
    // 重置 额外搜索云端数据
    if (extraCloud) {
      state.extraSearchCloudMailListObj = {};
      state.extraSearchCloudMailListObjStatus = '';
    }
  },
});
export const searchThunk = Thunks;
export const searchReducersList = ReducersList;
