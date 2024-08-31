import { MailEntryModel, MailModelEntries, queryMailBoxParam } from 'api';
import { getMailListByIdFromStore, reduxMessage, thunkHelperFactory, ERROR_REQUEST_CANCLE } from '@web-mail/util';
import { MailBoxReducerState, PayloadMeta, thunksStore, loadEdmMailListParam } from '@web-mail/types';
import { PayloadAction } from '@reduxjs/toolkit';
import { sliceStateCheck, getToListAndUpdateTree, getEdmMailListReq } from '@web-mail/utils/slice';
import {
  asyncMailList,
  formateMailList,
  getIsSearchingMailByState,
  getMailListReqParams,
  getTopMailSumHeight,
  mailListDiff,
  separateUpdateIdAndStore,
} from '@web-mail/state/customize';

import { request } from '@web-mail/state/slice/request';
import { MAIL_NOTICE_BAR_HEIGHT } from '@web-mail/common/constant';
import { getIn18Text } from 'api';
import { MailListThunks } from '@web-mail/state/slice/mailReducer/listThunk';

const ReducerName = 'CustomerMailListReducer';

const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);

// 加载邮件列表
// 原先 loadMailList_cm、loadMailList_sd 都改为调用 loadMailList_edm
thunkHelper<loadEdmMailListParam, MailBoxReducerState>({
  name: 'loadMailList_edm',
  request: async (params, thunkAPI) => {
    const { dispatch } = thunkAPI;
    const { noCache = false, sliceId, type } = params;
    const state = thunkAPI.getState().mailReducer;
    if (!sliceStateCheck(state, sliceId, type)) {
      return;
    }
    // 客户邮件
    if (type === 'customer') {
      const isSearching = getIsSearchingMailByState(state, sliceId, type);
      let to = isSearching ? state[type][sliceId].selectedSearchContacts.list : state[type][sliceId].selectedContacts.list;
      if (to.length === 0) {
        const result = {
          data: [],
          total: 0,
          query: {},
        };
        if (isSearching) {
          return { result, params, noCache };
        }
        // setCurrentAccount();
        to = await getToListAndUpdateTree(isSearching, dispatch, state, sliceId, type);
        if (to.length === 0) {
          return { result, params, noCache };
        }
      }
      const reqParams = getEdmMailListReq(state, params, sliceId, to);
      // setCurrentAccount();
      const result = await request.doListMailBoxEntities(reqParams, noCache);
      // 列表批量请求邮件阅读状态
      if (result && result.data && Array.isArray(result.data)) {
        dispatch(
          MailListThunks.getMailListReadStatus({
            mailIds: result.data.map(item => item?.entry?.id).filter(item => item),
            req: reqParams,
          })
        );
      }
      console.log('[loadMailList] customer mails', result);
      return { result, reqParams, noCache };
    }
    // 下属邮件
    if (!state.subordinate[sliceId].selectedKeys.id || !state.subordinate[sliceId].selectedKeys.accountName) {
      const result = {
        data: [],
        total: 0,
        query: {},
      };
      return { result, params, noCache };
    }
    const reqParams: queryMailBoxParam = getEdmMailListReq(state, params, sliceId);
    // setCurrentAccount();
    const result = await request.doListMailBoxEntities(reqParams, noCache);
    console.log('[loadMailList] customer mails', result);
    return { result, reqParams, noCache };
  },
  pending: (state, action: PayloadAction<loadEdmMailListParam, string, PayloadMeta<loadEdmMailListParam>>) => {
    const { showLoading = true, startIndex = 0, refresh, sliceId, type } = action.meta.arg || {};
    if (!sliceStateCheck(state, sliceId, type)) {
      return;
    }
    const isSearching = getIsSearchingMailByState(state, sliceId, type);
    if (startIndex === 0) {
      state[type][sliceId].scrollTop = 0;
      if (showLoading) {
        state[type][sliceId].listLoading = true;
      }
      if (!refresh) {
        if (isSearching) {
          if (type === 'customer') {
            state[type][sliceId].searchList = [];
            state[type][sliceId].selectedMailId = {
              id: '',
            };
          }
        } else {
          state[type][sliceId].mailDataList = [];
          state[type][sliceId].selectedMailId = {
            id: '',
          };
        }
      }
    }
  },
  fulfilled: (
    state: MailBoxReducerState,
    action: PayloadAction<
      {
        result: MailModelEntries;
        reqParams: ReturnType<typeof getMailListReqParams>;
        noCache: boolean;
      },
      string,
      PayloadMeta<loadEdmMailListParam>
    >
  ) => {
    const res = action.payload?.result;
    const { startIndex = 0, showLoading = true, refresh, sliceId, type } = action.meta.arg || {};
    if (!sliceStateCheck(state, sliceId, type)) {
      return;
    }
    const isSearching = getIsSearchingMailByState(state, sliceId, type);
    const oldMailDataList = [...state[type][sliceId].mailDataList];
    state[type][sliceId].mailListInitIsFailed = false;
    state[type][sliceId].listLoading = false;
    if (!res?.query || !res?.data) {
      showLoading && reduxMessage.error({ content: getIn18Text('FUWUDUANWEIFAN') });
      state[type][sliceId].mailListInitIsFailed = true;
      return;
    }
    const totalKeys = isSearching && type === 'customer' ? 'searchTotal' : 'mailTotal';
    const listKey = isSearching && type === 'customer' ? 'searchList' : 'mailDataList';
    state[type as 'customer'][sliceId][totalKeys] = res.total >= 0 ? res.total : 0;
    let list = startIndex === 0 ? [] : getMailListByIdFromStore(state[type as 'customer'][sliceId][listKey], state.mailEntities);
    list = list.length > 0 ? asyncMailList(list, res.data) : res.data;
    separateUpdateIdAndStore(state, listKey, formateMailList(list), {
      key: listKey,
      exclude: ['receiver'],
      sliceId,
      type,
    });
    if (refresh) {
      state[type][sliceId].refreshBtnLoading = false;
      if (!isSearching) {
        const newMailDataList = res.data.map(mail => mail.id || mail?.entry?.id);
        state[type][sliceId].refreshHasNewMail = newMailDataList.some(id => !oldMailDataList.includes(id));
      }
    }
  },
  rejected: (state, action) => {
    const { showLoading = true, refresh, sliceId, type } = (action.meta.arg || {}) as loadEdmMailListParam;
    if (!sliceStateCheck(state, sliceId, type)) {
      return;
    }
    const error = action?.error?.message || action.payload || action.error;
    console.warn('[loadMailList] customer mails rejected', error);
    if (error !== ERROR_REQUEST_CANCLE) {
      state[type][sliceId].listLoading = false;
      if (refresh) {
        state[type][sliceId].refreshBtnLoading = false;
      }
      if (error?.code === 'FA_NEED_AUTH2') {
        state[type][sliceId].mailDataList = [];
      } else {
        state[type][sliceId].mailListInitIsFailed = true;
        showLoading && reduxMessage.error({ content: getIn18Text('JIAZAISHIBAI') });
      }
    }
  },
});

// 从本地DB中加载邮件列表
// 原先 loadMailListFromDB_sd、loadMailListFromDB_cm 都改为调用 loadMailListFromDB_edm
thunkHelper<loadEdmMailListParam, MailBoxReducerState>({
  name: 'loadMailListFromDB_edm',
  request: async (params, thunkAPI) => {
    console.log('[loadMailListFromDB edm]', params);
    const { sliceId, type } = params;
    const state = thunkAPI.getState().mailReducer;
    if (!sliceStateCheck(state, sliceId, type)) {
      return;
    }
    const { mailDataList } = state[type][sliceId];
    const reqParams = getEdmMailListReq(state, params, sliceId);
    reqParams.count = mailDataList && mailDataList.length ? mailDataList.length : 100;
    if (reqParams.count < 30) {
      reqParams.count = 30;
    }
    if (reqParams.count > 500) {
      reqParams.count = 500;
    }
    // setCurrentAccount();
    const result = await request.doListMailBoxEntitiesFromDB(reqParams);
    console.log('[loadMailListFromDB edm] mails', result);
    return result;
  },
  pending: (state, action) => {
    const { showLoading = true, startIndex = 0, sliceId, type } = (action.meta.arg || {}) as loadEdmMailListParam;
    if (!sliceStateCheck(state, sliceId, type)) {
      return;
    }
    if (showLoading && startIndex === 0) {
      state[type][sliceId].listLoading = true;
    }
  },
  fulfilled: (state, action: PayloadAction<MailModelEntries, string, PayloadMeta<SliceIdParams<loadEdmMailListParam>>>) => {
    const { sliceId, type } = action.meta.arg || {};
    const res = action.payload;
    if (!sliceStateCheck(state, sliceId, type)) {
      return;
    }
    const mailDataList = getMailListByIdFromStore(state[type][sliceId].mailDataList, state.mailEntities);
    state[type][sliceId].mailListInitIsFailed = false;
    if (res) {
      if (!res.query || !res.data) {
        console.warn('[loadMailListFromDB edm] error');
        return;
      }
      if (res.data.length >= 500 && mailDataList.length > res.data.length) {
        try {
          const list = conactMailList(mailDataList, res.data);
          state[type][sliceId].mailDataList = formateMailList(list).map(v => v.id);
          state[type][sliceId].mailTotal = res.total >= 0 ? res.total : 0;
          state[type][sliceId].listLoading = false;
        } catch (e) {
          console.warn('[loadMailListFromDB edm] error', e);
        }
      } else {
        separateUpdateIdAndStore(state, 'mailDataList', formateMailList(res.data), {
          key: 'mailDataList_cm',
          exclude: ['receiver'],
          sliceId,
          type,
        });
        state[type][sliceId].mailTotal = res.total >= 0 ? res.total : 0;
        state[type][sliceId].listLoading = false;
      }
    }
  },
  rejected: (state, action) => {
    const error = action?.error?.message || action.payload || action.error;
    const { showLoading = true, sliceId, type } = (action.meta.arg || {}) as loadEdmMailListParam;
    if (!sliceStateCheck(state, sliceId, type)) {
      return;
    }
    if (error !== ERROR_REQUEST_CANCLE) {
      state[type][sliceId].listLoading = false;
      if (error?.code === 'FA_NEED_AUTH2') {
        state[type][sliceId].mailDataList = [];
      } else {
        state[type][sliceId].mailListInitIsFailed = true;
        showLoading && reduxMessage.error({ content: getIn18Text('JIAZAISHIBAI') });
      }
    }
    console.warn('MailListError', 'loadMailListFromDB edm rejected', error);
  },
});

// 加载推送邮件
thunkHelper<loadEdmMailListParam, MailBoxReducerState>({
  name: 'pullLastMail_cm',
  request: async (params, thunkAPI) => {
    const { dispatch } = thunkAPI;
    const { noCache = true, sliceId } = params;
    console.log('[pullLastMail_cm] request', params);
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    if (!sliceStateCheck(state, sliceId, 'customer')) {
      return;
    }
    const isSearching = getIsSearchingMailByState(state, sliceId, 'customer');
    let to = isSearching ? state.customer[sliceId].selectedSearchContacts.list : state.customer[sliceId].selectedContacts.list;
    if (to.length === 0) {
      const result = {
        data: [],
        total: 0,
        query: {},
      };
      if (isSearching) {
        return { result, params, noCache };
      }
      // setCurrentAccount();
      to = await getToListAndUpdateTree(isSearching, dispatch, state, sliceId, 'customer');
      if (to.length === 0) {
        return { result, params, noCache };
      }
    }
    const reqParams = getEdmMailListReq(state, params, sliceId, to);
    // setCurrentAccount();
    const result = await request.doListMailBoxEntities(reqParams, noCache);
    console.log('[pullLastMail_cm] customer mails', result);
    return { result, reqParams, noCache };
  },
  fulfilled: (
    state: MailBoxReducerState,
    action: PayloadAction<
      {
        result: MailModelEntries;
        reqParams: ReturnType<typeof getMailListReqParams>;
        noCache: boolean;
      },
      string,
      PayloadMeta<loadEdmMailListParam>
    >
  ) => {
    const { sliceId } = action.meta.arg || {};
    const res = action.payload?.result;
    if (!sliceStateCheck(state, sliceId, 'customer')) {
      return;
    }
    const isSearching = getIsSearchingMailByState(state, sliceId, 'customer');
    if (res?.data && res?.data?.length && !isSearching) {
      const { mailTotal, scrollTop } = state.customer[sliceId];
      const mailDataList = getMailListByIdFromStore(state.customer[sliceId].mailDataList, state.mailEntities);
      const _res: MailEntryModel[] = res.data;
      if (
        state.customer[sliceId].mailDataList.length <= 30 ||
        (state.customer[sliceId].scrollTop <= 100 && state.customer[sliceId].activeIds && state.customer[sliceId].activeIds.length > 1)
      ) {
        separateUpdateIdAndStore(state, 'mailDataList', formateMailList(_res), {
          key: 'mailList_cm',
          exclude: ['receiver'],
          sliceId,
          type: 'customer',
        });
        state.customer[sliceId].mailTotal = mailTotal;
      } else {
        // 列表已经向下滑动了进行对比插入
        const diffParams = mailListDiff(_res, mailDataList);
        const topMailSumHeight = getTopMailSumHeight(mailDataList);
        if (diffParams != null) {
          // 对比成功
          const { sumHeight, sumNewMail, insertPosi } = diffParams;
          const _mailDatalist = [..._res.slice(0, insertPosi), ...mailDataList.slice(insertPosi)];
          // 邮件高度保持
          if (scrollTop > topMailSumHeight + MAIL_NOTICE_BAR_HEIGHT) {
            state.customer[sliceId].scrollTop = scrollTop + sumHeight;
          } else {
            // 主动触发一下列表滑动,已解决列表某些情况下列表不渲染的问题
            state.customer[sliceId].scrollTop =
              state.customer[sliceId].scrollTop % 2 === 0 ? state.customer[sliceId].scrollTop + 1 : state.customer[sliceId].scrollTop - 1;
          }
          state.customer[sliceId].mailTotal = mailTotal + sumNewMail;
          separateUpdateIdAndStore(state, 'mailDataList', formateMailList(_mailDatalist), {
            key: 'mailDataList_cm',
            exclude: ['receiver'],
            sliceId,
            type: 'customer',
          });
        }
      }
    }
  },
});

export const MailListThunks_cm = Thunks;
export const MailListExtraReducersList_cm = ReducersList;
