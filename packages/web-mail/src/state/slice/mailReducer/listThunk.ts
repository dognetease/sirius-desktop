import { PayloadAction } from '@reduxjs/toolkit';
import { apiHolder, apis, MailApi, MailModelEntries, MailEntryModel, MailSearchResult, mailPerfTool, SystemApi, queryMailBoxParam, DataTrackerApi } from 'api';
import { AsyncThunkConfig, MailActions } from '@web-common/state/createStore';
import { refreshParams, MailBoxReducerState, loadMailListParam, thunksStore, loadMailListRequestParam, MailTreeState } from '../../../types';
import {
  thunkHelperFactory,
  debounceMailListRequest,
  reduxMessage,
  ERROR_REQUEST_CANCLE,
  getMailListByIdFromStore,
  folderIdIsContact,
  getMapConfigBySameAccountKey,
} from '../../../util';
import {
  getMailListReqParams,
  getAdvanceSearchReqParams,
  getSearchListReqParams,
  asyncMailList,
  isMerge,
  conactMailList,
  getTopMailSumHeight,
  getFilterCondParams,
  mailListDiff,
  getNewMailsFromList,
  formateMailList,
  separateUpdateIdAndStore,
  getIsSearchingMailByState,
  needTimeRangeByMailOrderType,
  getIsUseRealList,
} from '../../customize';
import { MAIL_FILL_RANG_NUM, MAIL_NOTICE_BAR_HEIGHT, MAIL_LIST_INIT_RANGE_COUNT, MAIL_LIST_MORE_RANGE_COUNT, FLOLDER } from '../../../common/constant';
import { getIn18Text } from 'api';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
/**
 * thunk
 */
let isInitedRequest = true;
const ReducerName = 'MailReducer';
const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const dataTrackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
/**
 * 包装邮件请求
 * 被同一个包装器包装过得请求，前一个请求padding状态，后续请求发起会取消前一个请求
 */
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const debouceReuestGroupWarp = debounceMailListRequest();
const doListMailBoxEntities = debouceReuestGroupWarp(mailApi.doListMailBoxEntities.bind(mailApi), 'doListMailBoxEntities') as typeof mailApi.doListMailBoxEntities;
const doListThreadMailBoxEntities = debouceReuestGroupWarp(
  mailApi.doListThreadMailBoxEntities.bind(mailApi),
  'doListThreadMailBoxEntities'
) as typeof mailApi.doListThreadMailBoxEntities;
const doSearchMail = debouceReuestGroupWarp(mailApi.doSearchMail.bind(mailApi), 'doSearchMail') as typeof mailApi.doSearchMail;
const doAdvanceSearchMail = debouceReuestGroupWarp(mailApi.doAdvanceSearchMail.bind(mailApi), 'doAdvanceSearchMail') as typeof mailApi.doAdvanceSearchMail;
const doListMailBoxEntitiesFromDB = debouceReuestGroupWarp(
  mailApi.doListMailEntitiesFromDb.bind(mailApi),
  'doListMailEntitiesFromDb'
) as typeof mailApi.doListMailEntitiesFromDb;
// const doGetTaskMailList = mailApi.doGetTaskMailList;
// const doGetTaskMailListFromNet = mailApi.doGetTaskMailListFromNet;
// const handleMailModel = mailApi.handleMailModel;
// 刷新邮件列表
thunkHelper({
  name: 'refreshMailList',
  request: async (params: refreshParams, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    const { showLoading = true, noCache = false } = params || {};
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { mailSearchKey, mailSearchStateMap, mailSearchAccount, selectedSearchKeys, realListCurrentPage, realListCurrentPageSize, selectedKeys, mailDataList } = state;
    const isUseRealList = state.useRealList;
    const filterCond = getFilterCondParams(state);
    const searchType = mailSearchStateMap[mailSearchAccount];
    const startIndex = !isUseRealList ? 0 : (realListCurrentPage - 1) * realListCurrentPageSize;
    const isSearching = getIsSearchingMailByState(state);
    // 如果当前文件夹类型为三方挂载邮箱
    if (selectedKeys?.authAccountType != null && selectedKeys?.authAccountType != '0' && !isSearching && mailDataList?.length == 0) {
      const folderId = parseInt(selectedKeys?.id + ''); // 转换为十进制数字
      if (!isNaN(folderId)) {
        // setCurrentAccount(selectedKeys?.accountId);
        // 发送插队请求
        mailApi
          .triggerReceive({
            folderId: folderId,
            _account: selectedKeys?.accountId || '',
          })
          .then(() => {
            reduxMessage.success({
              content: getIn18Text('ZHENGZAIWEININJIASTB'),
            });
          });
      }
    }

    if (['local', 'server'].includes(searchType) && mailSearchKey) {
      dispatch(
        Thunks.loadSearchMailList({
          startIndex: startIndex,
          noCache,
          showLoading,
          filterCond,
        })
      );
    } else if (searchType === 'advanced') {
      dispatch(Thunks.loadAdvanceSearchMailList({ startIndex: startIndex, noCache, showLoading, filterCond }));
    } else {
      const oldMailDataList = [...state.mailDataList];
      dispatch(Thunks.loadMailList({ startIndex: startIndex, noCache, showLoading })).then(res => {
        if (res.payload?.result.data) {
          const newMailDataList = res.payload?.result.data.map(mail => mail.id || mail?.entry?.id);
          const hasNew = newMailDataList.some(id => !oldMailDataList.includes(id));
          dispatch(MailActions.doUpdateRefreshHasNewMail(hasNew));
        }
      });
    }
  },
  pending: (state: MailBoxReducerState, action: PayloadAction<refreshParams>) => {
    const { toTop = true } = action.meta.arg || {};
    if (toTop) {
      state.scrollTop = 0;
    }
    // state.selectedMailId = '';
    // if (showLoading) {
    //   state.listLoading = true;
    // }
  },
  rejected: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    console.log(action);
  },
});
// 加载邮件列表
thunkHelper({
  name: 'loadMailList',
  request: async (params: loadMailListParam, thunkAPI: AsyncThunkConfig) => {
    const { rejectWithValue, dispatch } = thunkAPI;
    const { startIndex = 0, noCache = false } = params;
    const rootState = thunkAPI.getState();
    const state: MailBoxReducerState = rootState.mailReducer;
    const { mailTreeStateMap } = state;
    // 如果不传，默认设置为当期那选中的文件夹下列表
    const { accountId = state.selectedKeys.accountId } = params;
    const isCorpMail = rootState.loginReducer.loginInfo.isCorpMailMode;
    const isThread = isMerge(state.selectedKeys.id, state.selectedKeys.accountId, Object.keys(state.mailSearchStateMap).length > 0);
    const reqFn = isThread ? doListThreadMailBoxEntities : doListMailBoxEntities;
    const reqParams = getMailListReqParams(state, startIndex, isCorpMail, params.noContactRace);
    // 包含邮件排序条件并且联网状况良好情况下noCache为true
    // 标签现在不走缓存，因为本地缓存存在排序不一致的问题
    const isTagReq = Array.isArray(reqParams.tag) && reqParams.tag.length > 0;
    const isMyCustomerReq = !!reqParams.filter?.flags?.customerMail; // 是筛选“我的客户”的请求，也不走缓存
    const _noCache =
      !!(
        (state.selectedKeys.id === FLOLDER.UNREAD || isTagReq || isMyCustomerReq || needTimeRangeByMailOrderType(state.mailListStateTab)) &&
        systemApi.isNetworkAvailable()
      ) || noCache;
    mailPerfTool.mailList('start', {
      isThread,
      noCache: _noCache,
      startIndex: reqParams.index,
      folder: reqParams.id,
      read: reqParams.filter?.flags?.read,
      label0: reqParams.filter?.label0 || 0,
    });
    // setCurrentAccount(accountId);
    // 是否有客户权限
    const hasCustomerAuth: boolean = getModuleAccessSelector(rootState.privilegeReducer, 'CONTACT', 'VIEW');
    // 如果没有客户权限，但是是筛选的我的客户，直接返回空
    if (!hasCustomerAuth && isMyCustomerReq) {
      return {
        result: {
          building: 0,
          count: 30,
          data: [],
          index: 0,
          query: reqParams,
          total: 0,
        },
        reqParams,
        _noCache,
      };
    }
    // 如果是根据附件筛选，则调用高级搜索的接口
    if (state.mailListStateTab === 'ATTACHMENT') {
      const searchModel = {
        // pattern: values.content,
        start: startIndex,
        limit: 30,
        fid: state?.selectedKeys?.id,
        fids: [state?.selectedKeys?.id],
        conditions: [
          {
            flags: {
              attached: true,
            },
            sentDate: [moment().subtract(6, 'months').format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')],
          },
        ],
        // 不需要分组统计信息，查询速度快很多
        ignoreGroup: true,
      };

      const result = await doAdvanceSearchMail(searchModel, noCache, state?.selectedKeys?.accountId);
      if (result) {
        return {
          result: {
            data: result.entities,
            query: searchModel,
            total: result?.total,
          },
          _noCache,
        };
      }
    }

    const result: MailModelEntries | MailEntryModel[] = await reqFn({ ...reqParams, _account: accountId }, _noCache).then((res: MailModelEntries | MailEntryModel[]) => {
      // 账号类型
      let emailType = '';
      if (accountId && getMapConfigBySameAccountKey<MailTreeState>(mailTreeStateMap, accountId)) {
        emailType = getMapConfigBySameAccountKey<MailTreeState>(mailTreeStateMap, accountId)?.emailType || '';
      }
      if (Array.isArray(res)) {
        res = res.map(item => {
          return { ...item, emailType };
        });
      } else {
        res.data = res.data.map(item => {
          return { ...item, emailType };
        });
      }

      if (!isThread) {
        const mailEntreis = res as MailModelEntries;
        if ((reqParams.order && reqParams.order !== 'date') || (reqParams.desc !== undefined && !reqParams.desc)) {
          const data = mailApi.orderByMailList(mailEntreis.data, reqParams);
          if (Array.isArray(data)) {
            mailEntreis.data = data;
          } else {
            return {
              total: data.total,
              data: data.data,
              index: reqParams.index,
              query: reqParams,
            } as MailModelEntries;
          }
        }
      }
      return res;
    });
    // 列表批量请求邮件阅读状态
    if (result && result.data && Array.isArray(result.data) && !isThread) {
      dispatch(
        Thunks.getMailListReadStatus({
          mailIds: result.data.map(item => item?.entry?.id).filter(item => item),
          req: { ...reqParams, _account: accountId },
        })
      );
    }
    if (result) {
      return { result, reqParams, _noCache };
    }
  },
  pending: (state: MailBoxReducerState, action: PayloadAction<MailModelEntries>) => {
    const params: loadMailListParam = action.meta.arg || {};
    const isUseRealList = state.useRealList;
    const { showLoading = true, startIndex = 0 } = params;
    if (isUseRealList) {
      state.listLoading = true;
      if (startIndex === 0) {
        state.mailTotal = 0;
        state.realListCurrentPage = 1;
      }
    } else {
      if (showLoading && startIndex === 0) {
        state.listLoading = true;
      }
    }
  },
  fulfilled: (
    state: MailBoxReducerState,
    action: PayloadAction<{
      result: MailModelEntries;
      reqParams: ReturnType<typeof getMailListReqParams>;
      noCache: boolean;
    }>
  ) => {
    const params: loadMailListParam = action.meta.arg || {};

    const res = action.payload?.result;
    const { reqParams, noCache } = action.payload || {};
    const { startIndex = 0, showLoading = true } = params;
    if (startIndex === 0 && state.mailListStateTab === 'ALL') {
      state.lastFetchFirstIndexTime = new Date().getTime();
    }
    const mailDataList = getMailListByIdFromStore(state.mailDataList, state.mailEntities);
    if (startIndex === 0 && state.selectedKeys.id === FLOLDER.UNREAD) {
      if (res?.total === 0 && state.mailTreeStateMap?.main?.MailFolderTreeMap[FLOLDER.UNREAD]?.entry?.mailBoxUnread !== 0) {
        dataTrackApi.track('pa_mail_unread_folder_count_error', {
          type: 'unread',
          data: { req: reqParams, res },
        });
      }
    }
    const isSearching = getIsSearchingMailByState(state);
    const isTaskFolder = state.selectedKeys && state.selectedKeys.id === FLOLDER.TASK;
    state.mailListInitIsFailed = false;
    if (!res?.query || !res?.data) {
      showLoading &&
        reduxMessage.error({
          content: getIn18Text('FUWUDUANWEIFAN'),
        });
      state.listLoading = false;
      state.mailListInitIsFailed = true;
      return;
    }
    // 某些情况下接口会返回total为-1的情况，为了防止奔溃做处理
    if (!(isInitedRequest && reqParams?.isRealList && startIndex === 0 && state.mailTotal !== 0)) {
      state.mailTotal = res.total >= 0 ? res.total : 0;
    }
    if (isInitedRequest) {
      isInitedRequest = false;
    }
    // 由于邮件列表的滑动特性，对重复项进行拼接
    let list = (reqParams?.isRealList && !isTaskFolder) || startIndex === 0 ? [] : mailDataList;
    list = list.length > 0 ? asyncMailList(list, res.data) : res.data;
    // 针对聚合邮件进行处理
    if (isMerge(state.selectedKeys.id, state.selectedKeys.accountId, isSearching) && res?.building === 1) {
      state.showThreadBuildingTip = true;
    } else {
      state.showThreadBuildingTip = false;
    }
    // 星标联系人是否显示构建中tip
    if ((folderIdIsContact(state.selectedKeys?.id) || state.selectedKeys?.id == FLOLDER?.STAR) && res?.building === 1) {
      state.showStarContactBuildingTip = true;
    } else {
      state.showStarContactBuildingTip = false;
    }

    // 分离写入邮件id与store
    // separateUpdateIdAndStore(state, 'mailDataList', formateMailList(list));
    separateUpdateIdAndStore(state, 'mailDataList', formateMailList(list), {
      key: 'mailList',
      exclude: ['receiver'],
    });

    state.listLoading = false;

    mailPerfTool.mailList('end', {
      count: list.length,
      isThread: isMerge(state.selectedKeys.id, state.selectedKeys.accountId, isSearching),
      noCache,
      read: reqParams?.filter?.flags?.read,
      label0: reqParams?.filter?.label0 || 0,
    });
  },
  rejected: (state: MailBoxReducerState, action) => {
    const params: loadMailListParam = action.meta.arg || {};
    const { showLoading = true } = params;
    const error = action?.error?.message || action.payload || action.error;
    if (error !== ERROR_REQUEST_CANCLE) {
      state.listLoading = false;
      state.listIsRefresh = false;
      if (error?.code === 'FA_NEED_AUTH2') {
        state.mailFolderIsLock = true;
        state.mailDataList = [];
      } else {
        state.mailListInitIsFailed = true;
        showLoading &&
          reduxMessage.error({
            content: getIn18Text('JIAZAISHIBAI'),
          });
      }
    }
    console.error('MailListError', 'loadMailList-rejected', error);
  },
});
// 加载高级搜索邮件列表
thunkHelper({
  name: 'loadAdvanceSearchMailList',
  request: async (params: loadMailListParam, thunkAPI: AsyncThunkConfig) => {
    const { rejectWithValue } = thunkAPI;
    const { startIndex = 0, noCache = false, filterCond } = params;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const searchModel = getAdvanceSearchReqParams(state, filterCond, startIndex);
    if (startIndex === 0) {
      mailPerfTool.searchMail('advanced', 'start', {
        noCache: true,
        searchRange: 'all',
      });
    }
    // setCurrentAccount(state.mailSearchAccount);
    return doAdvanceSearchMail(searchModel, noCache, state.mailSearchAccount);
  },
  pending: (state: MailBoxReducerState) => {
    state.advancedSearchLoading = true;
    if (state.refreshLoading) {
      state.refreshLoading = false;
    }
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<MailSearchResult>) => {
    const params: loadMailListParam = action.meta.arg || {};
    const res = action.payload;
    const { startIndex = 0, noCache } = params;
    const searchList = getMailListByIdFromStore(state.searchList, state.mailEntities);
    state.mailListInitIsFailed = false;
    if (noCache) {
      state.scrollTop = 0;
    }
    state.searchingRequestId = res.searchId;
    let list = startIndex === 0 ? [] : searchList;
    list = list.length > 0 ? asyncMailList(list, res.entities) : res.entities;
    separateUpdateIdAndStore(state, 'searchList', formateMailList(list), {
      key: 'search',
      exclude: ['entry.title', 'receiver'],
    });
    state.searchResultObj = res;
    state.listLoading = false;
    state.searchLoading = false;
    state.advancedSearchLoading = false;
    if (startIndex === 0) {
      mailPerfTool.searchMail('advanced', 'end', {
        noCache: true,
        count: list.length,
        searchRange: 'all',
      });
    }
  },
  rejected: (state: MailBoxReducerState, action) => {
    const params: loadMailListParam = action.meta.arg || {};
    const { showLoading = true } = params;
    const error = action?.error?.message || action.payload;
    if (error !== ERROR_REQUEST_CANCLE) {
      state.listLoading = false;
      if (error?.code === 'FA_NEED_AUTH2') {
        state.mailFolderIsLock = true;
        state.mailDataList = [];
      } else {
        state.mailListInitIsFailed = true;
        showLoading &&
          reduxMessage.error({
            content: getIn18Text('JIAZAISHIBAI'),
          });
      }
    }
    state.advancedSearchLoading = false;
    console.error('MailListError', 'loadAdvanceSearchMailList-rejected', error);
  },
});
// 加载邮件搜索列表
thunkHelper({
  name: 'loadSearchMailList',
  request: async (params: loadMailListParam, thunkAPI: AsyncThunkConfig) => {
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { mailSearchKey, mailSearchStateMap, searchingRequestId, mailSearchAccount } = state;
    const filterCond = getFilterCondParams(state);
    const { startIndex = 0 } = params;
    // 是否是本地搜索
    const isLocalSearch = mailSearchStateMap[mailSearchAccount] === 'local';
    // 参数
    const query = getSearchListReqParams(state, startIndex);
    const searchingId = searchingRequestId && searchingRequestId > -1 ? searchingRequestId : undefined;
    // 云端
    if (!isLocalSearch) {
      // setCurrentAccount(mailSearchAccount);
      params.noCache = !(await mailApi.doGetSearchCacheInfo(mailSearchKey, { ...query, filterCond }, searchingId, true, mailSearchAccount));
    }
    if (startIndex === 0) {
      mailPerfTool.searchMail(isLocalSearch ? 'local' : 'sever', 'start', {
        noCache: !!params.noCache,
        searchWord: mailSearchKey,
        fid: query.id,
        searchRange: query.searchType,
      });
    }
    // setCurrentAccount(mailSearchAccount);
    // 本地 + 远端
    return doSearchMail(mailSearchKey, { ...query, accountId: mailSearchAccount, _account: mailSearchAccount, filterCond }, isLocalSearch, searchingId);
  },
  pending: (state: MailBoxReducerState) => {
    if (state.refreshLoading) {
      state.refreshLoading = false;
    }
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<MailSearchResult>) => {
    const params: loadMailListParam = action.meta.arg || {};
    const res = action.payload;
    const { startIndex = 0, noCache, account } = params;
    const { mailSearchStateMap } = state;
    // 已有
    const searchList = getMailListByIdFromStore(state.searchList, state.mailEntities);
    const searchType = mailSearchStateMap[account];
    const isLocalSearch = searchType === 'local';
    state.mailListInitIsFailed = false;
    let list = startIndex === 0 ? [] : searchList;
    // 合并
    list = list.length > 0 ? asyncMailList(list, res.entities) : res.entities;
    // 存储
    separateUpdateIdAndStore(state, 'searchList', formateMailList(list), {
      key: 'search',
      exclude: ['entry.title', 'receiver', 'entry.brief'],
    });
    state.searchResultObj = res;
    state.searchingRequestId = res.searchId;
    state.listLoading = false;
    // console.log('loadSearchMailList fullfilled', res);
    state.searchLoading = false;
    if (startIndex === 0) {
      const query = getSearchListReqParams(state, startIndex);
      mailPerfTool.searchMail(isLocalSearch ? 'local' : 'sever', 'end', {
        noCache: !!noCache,
        count: list.length,
        fid: query.id,
        searchRange: query.searchType,
      });
    }
  },
  rejected: (state: MailBoxReducerState, action) => {
    const params: loadMailListParam = action.meta.arg || {};
    const { showLoading = true, startIndex = 0, noCache } = params;
    const error = action?.error?.message || action.payload;
    let { listLoading, mailFolderIsLock, mailDataList, mailListInitIsFailed, mailSearchStateMap, mailSearchAccount } = state;
    if (error !== ERROR_REQUEST_CANCLE) {
      listLoading = false;
      if (error?.code === 'FA_NEED_AUTH2') {
        mailFolderIsLock = true;
        mailDataList = [];
      } else {
        mailListInitIsFailed = true;
        showLoading &&
          reduxMessage.error({
            content: getIn18Text('JIAZAISHIBAI'),
          });
      }
    }
    const isLocalSearch = mailSearchStateMap[mailSearchAccount] === 'local';
    if (startIndex === 0) {
      const query = getSearchListReqParams(state, startIndex);
      mailPerfTool.searchMail(isLocalSearch ? 'local' : 'sever', 'end', {
        noCache: !!noCache,
        count: 0,
        fid: query.id,
        searchRange: query.searchType,
      });
    }
    console.error('MailListError', 'loadSearchMailList-rejected', error);
  },
});
thunkHelper({
  // 额外搜索云端邮件
  name: 'searchCloudMailListExtra',
  request: async (params: loadMailListParam, thunkAPI: AsyncThunkConfig) => {
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { mailSearchKey, mailSearchAccount } = state;
    const filterCond = getFilterCondParams(state);
    const { startIndex = 0 } = params;
    const query = getSearchListReqParams(state, startIndex);
    // setCurrentAccount(mailSearchAccount);
    return mailApi.doSearchMail(mailSearchKey, { ...query, accountId: mailSearchAccount, _account: mailSearchAccount, filterCond }, false, Math.random());
  },
  pending: (state: MailBoxReducerState) => {
    state.extraSearchCloudMailListObjStatus = 'pending';
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<MailSearchResult>) => {
    const res = action.payload;
    state.extraSearchCloudMailListObj = res;
    state.extraSearchCloudMailListObjStatus = 'success';
  },
  rejected: (state: MailBoxReducerState, action) => {
    state.extraSearchCloudMailListObjStatus = 'fail';
  },
});
// 从本地DB中加载邮件列表
thunkHelper({
  name: 'loadMailListFromDB',
  request: async (params: loadMailListParam, thunkAPI: AsyncThunkConfig) => {
    console.log('syncAndResendMailEntry====loadMailListFromDB', params);
    // const { dispatch, rejectWithValue } = thunkAPI;
    const { startIndex = 0, accountId } = params;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { mailDataList } = state;
    const reqParams = getMailListReqParams(state, startIndex, undefined, params.noContactRace);
    // 如果是我的客户筛选，不请求本地
    if (!!reqParams.noSync) {
      // 直接结束即可
      console.log('loadMailListFromDB return false, because noSync is true');
      return false;
    }
    const isUseRealList = state.useRealList;
    reqParams.count = mailDataList && mailDataList.length ? mailDataList.length : isUseRealList ? state.realListCurrentPageSize : 100;
    if (!isUseRealList && reqParams.count < MAIL_LIST_INIT_RANGE_COUNT) {
      reqParams.count = MAIL_LIST_INIT_RANGE_COUNT;
    }
    if (reqParams.count > 500) {
      reqParams.count = 500;
    }
    // try {
    // 在请求api层之前，设置为主账号
    // setCurrentAccount(accountId);
    let result = await doListMailBoxEntitiesFromDB({ _account: accountId, ...reqParams }, accountId);
    return result;
    // if (result) {
    // const taskMailMap = await doGetTaskMailList({
    //   index: 0,
    //   count: 20,
    // });
    // const isThread = isMerge(state.selectedKeys.id, Object.keys(mailSearchStateMap).length > 0);
    // if (!isThread) {
    //   const taskMailMap = await doGetTaskMailListFromNet({
    //     index: 0,
    //     count: 20,
    //   });
    //
    //   const data = await handleMailModel(result, taskMailMap)
    //   // result = await this.setTaskInfoToMailModel(result, false)
    //   // const data = await firstSetTaskModel(cloneDeep(result), taskMailMap);
    //   result.data = data
    // }
    // return result;
    //   }
    // } catch (err) {
    //   return rejectWithValue(err);
    // }
  },
  pending: (state: MailBoxReducerState, action) => {
    const params: loadMailListParam = action.meta.arg || {};
    const { showLoading = true, startIndex = 0 } = params;
    if (showLoading && startIndex === 0) {
      state.listLoading = true;
    }
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<MailEntryModel>) => {
    const params: loadMailListParam = action.meta.arg || {};
    const res = action.payload;
    // const isUseRealList = state.useRealList;
    // const { startIndex = 0 } = params;
    const mailDataList = getMailListByIdFromStore(state.mailDataList, state.mailEntities);
    state.mailListInitIsFailed = false;
    if (res) {
      if (!res.query || !res.data) {
        console.error('loadMailListFromDB error');
        return false;
      }
      if (res.data.length >= 500 || mailDataList.length > res.data.length) {
        try {
          const list = conactMailList(mailDataList, res.data);
          state.mailDataList = formateMailList(list).map(v => v.id);
          // if (!isUseRealList) {
          //   // state.mailTotal = res.total >= 0 ? res.total : 0;
          // }
          // state.listLoading = false;
        } catch (e) {
          console.error('loadMailListFromDB-conactMailList', e);
        }
      } else {
        separateUpdateIdAndStore(state, 'mailDataList', formateMailList(res.data), {
          key: 'mailList',
          exclude: ['receiver'],
        });
        // if (!isUseRealList) {
        //   // state.mailTotal = res.total >= 0 ? res.total : 0;
        // }
        // state.listLoading = false;
      }
    }
  },
  rejected: (state: MailBoxReducerState, action) => {
    const error = action?.error?.message || action.payload;
    const params: loadMailListParam = action.meta.arg || {};
    const { showLoading = true } = params;
    if (error !== ERROR_REQUEST_CANCLE) {
      state.listLoading = false;
      state.mailListInitIsFailed = true;
      showLoading &&
        reduxMessage.error({
          content: getIn18Text('JIAZAISHIBAI'),
        });
    }
    console.error('MailListError', 'loadMailListFromDB-rejected', error);
  },
});
/**
 * 拉取最新邮件
 * 获取当前文件夹的头部邮件，经过对比后插入到邮件列表前部
 * warn： 该请求无竞态，不会被取消
 * todo: 当前只对比头部的不同，应该改为整体对比
 */
thunkHelper({
  name: 'pullLastMail',
  request: async (params: void, thunkAPI: AsyncThunkConfig) => {
    const { rejectWithValue } = thunkAPI;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const reqParams = getMailListReqParams(state, 0);
    const useRealList = getIsUseRealList(state);
    const currentPageSize = state.realListCurrentPageSize;
    reqParams.count = useRealList ? currentPageSize : MAIL_LIST_INIT_RANGE_COUNT;
    try {
      // setCurrentAccount(state.selectedKeys?.accountId);
      reqParams._account = state.selectedKeys?.accountId;
      const result = await mailApi.doListMailBoxEntities(reqParams, true);
      if (result) {
        if (Array.isArray(result.data)) {
          // 聚合邮件的id拼接了--fid,需要做兼容统一
          const dataList = result.data.map(item => {
            if (item && item?.isThread && item?.entry?.id && !item?.entry?.id.includes('--')) {
              return {
                ...item,
                id: item.id + '--' + item.entry.folder,
                entry: {
                  ...item.entry,
                  id: item.entry.id + '--' + item.entry.folder,
                },
              };
            }
            return item;
          });
          return {
            ...result,
            data: dataList,
          };
        }

        return result;
      }
    } catch (err) {
      return rejectWithValue(err);
    }
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<MailModelEntries>) => {
    const res = action.payload;
    const { scrollTop, noticeNum, mailTotal } = state;
    const mailDataList = getMailListByIdFromStore(state.mailDataList, state.mailEntities);
    console.log('[listThunks] pullLastMail res', res);
    if (res) {
      const isUseRealList = getIsUseRealList(state);
      const currentPage = state.realListCurrentPage;
      const isFirstPage = currentPage === 1;
      const shouldUpdateMailList = isUseRealList && isFirstPage;
      if (!res.query) return;
      const _res: MailEntryModel[] = res.data;
      // 如果列表处于初始状态 或者列表处于顶部区域且无多选 直接替换列表
      if (
        (isUseRealList && isFirstPage && state.activeIds && state.activeIds.length < 1) ||
        (!isUseRealList &&
          (state.mailDataList.length <= MAIL_LIST_INIT_RANGE_COUNT || (state.scrollTop <= MAIL_LIST_MORE_RANGE_COUNT && state.activeIds && state.activeIds.length > 1)))
      ) {
        separateUpdateIdAndStore(state, 'mailDataList', formateMailList(_res), {
          key: 'mailList',
          exclude: ['receiver'],
        });
        if (!isUseRealList) {
          state.mailTotal = mailTotal;
        } else {
          state.mailTotal = res.total;
          state.lastFetchFirstIndexTime = new Date().getTime();
        }
      } else {
        // 列表已经向下滑动了进行对比插入
        // const diffParams =  mailListDiff(_res, mailDataList);
        const diffParams = !isUseRealList ? mailListDiff(_res, mailDataList) : getNewMailsFromList(_res, state.lastFetchFirstIndexTime);
        // const topMailSumHeight = getTopMailSumHeight(mailDataList);
        // const mailNoticeOffset = MAIL_NOTICE_BAR_HEIGHT;
        if (diffParams != null) {
          // 对比成功
          const { sumNewMail, insertPosi } = diffParams;
          const _mailDatalist = !isUseRealList ? [..._res.slice(0, insertPosi), ...mailDataList.slice(insertPosi)] : isFirstPage ? _res : [];
          // 邮件高度保持
          // if (scrollTop > topMailSumHeight + mailNoticeOffset) {
          //   // state.scrollTop = scrollTop + sumHeight;
          //   state.noticeNum = noticeNum + sumNewMail;
          // } else {
          //   // 主动触发一下列表滑动,已解决列表某些情况下列表不渲染的问题 -
          //   // 为了性能优化-st已于列表脱钩，该逻辑无效
          //   // state.scrollTop = state.scrollTop % 2 === 0 ? state.scrollTop + 1 : state.scrollTop - 1;
          // }
          state.noticeNum = noticeNum + sumNewMail;
          if (!isUseRealList) {
            state.mailTotal = mailTotal + sumNewMail;
          } else {
            state.noticeNum = sumNewMail;
          }
          if (!isUseRealList || shouldUpdateMailList) {
            separateUpdateIdAndStore(state, 'mailDataList', formateMailList(_mailDatalist), {
              key: 'mailList',
              exclude: ['receiver'],
            });
          }
        }
      }
    }
  },
});
// 如果列表中的邮件不满1屏幕，加载邮件
thunkHelper({
  name: 'loadMailListIfNotFullScreen',
  request: async (params: { accountId?: string; ids: Array<string> | null }, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    const { accountId, ids } = params;
    const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
    const { mailDataList, searchList, mailTotal, searchResultObj, useRealList, realListCurrentPageSize, realListCurrentPage } = state;
    const isSearching = getIsSearchingMailByState(state);
    const list = isSearching ? searchList : mailDataList;
    const total = isSearching ? searchResultObj.total : mailTotal;
    if (!useRealList) {
      if (list && list.length - 1 < MAIL_FILL_RANG_NUM && total > MAIL_FILL_RANG_NUM) {
        dispatch(Thunks.refreshMailList({ showLoading: false }));
      }
    } else {
      if (realListCurrentPage > 1) {
        const mailIdsLens = Array.isArray(ids) ? ids.length : 0;
        if (mailIdsLens) {
          const leftCount = total - mailIdsLens;
          if (leftCount) {
            if (realListCurrentPageSize * (realListCurrentPage - 1) >= leftCount) {
              dispatch(MailActions.doUpdateRealListPage({ page: realListCurrentPage - 1 }));
            }
          }
        }
      }
      dispatch(Thunks.refreshMailList({ showLoading: false }));
    }
  },
});

// 如果列表中的邮件不满1屏幕，加载邮件
thunkHelper({
  name: 'resetRealListStateAndLoadList',
  request: async (params: { noLoad?: boolean }, thunkAPI: AsyncThunkConfig) => {
    const { dispatch } = thunkAPI;
    dispatch(MailActions.doUpdateRealListPage({ page: 1 }));
    dispatch(MailActions.doUpdateMailListScrollTop(0));
    if (!params || !params.noLoad) {
      dispatch(Thunks.loadMailList({ startIndex: 0, noCache: true }));
    }
  },
});

//获取当前列表请求参数
thunkHelper({
  name: 'getMailListRequestParams',
  request: (params: loadMailListRequestParam, thunkAPI: AsyncThunkConfig): any => {
    const { startIndex = 0, noCache = false, id = '' } = params;
    const rootState = thunkAPI.getState();
    const state: MailBoxReducerState = rootState.mailReducer;
    const useRealList = state.useRealList;
    const currentPageSize = state.realListCurrentPageSize;
    const currentPage = state.realListCurrentPage;
    const isSearching = !!state.mailSearching;
    const dataList = isSearching ? state.searchList : state.mailDataList;
    const midList = dataList || [];
    const _idx = midList.indexOf(id);
    const { accountId = state.selectedKeys.accountId } = params;
    const isCorpMail = rootState.loginReducer.loginInfo.isCorpMailMode;
    const isThread = isMerge(state.selectedKeys.id, state.selectedKeys.accountId, Object.keys(state.mailSearchStateMap).length > 0);
    const reqParams = getMailListReqParams(state, _idx, isCorpMail, params.noContactRace);
    return { ...reqParams, _account: accountId, isThread, midList, index: useRealList ? (currentPage - 1) * currentPageSize + _idx : _idx };
  },
  rejected: (state: MailBoxReducerState, action) => {
    const error = action?.error?.message || action.payload || action.error;
    console.error('getMailListRequestParams', error);
  },
});

// 请求列表midList
thunkHelper({
  name: 'getMailIdList',
  request: async (params: { isThread: boolean; reqParams: queryMailBoxParam }, thunkAPI: AsyncThunkConfig) => {
    const { isThread = false, reqParams } = params;
    const reqFn = params?.isThread ? doListThreadMailBoxEntities : doListMailBoxEntities;
    // setCurrentAccount(reqParams._account);

    const result: MailModelEntries | MailEntryModel[] = await reqFn({ ...reqParams, _account: reqParams._account }, true).then(
      (res: MailModelEntries | MailEntryModel[]) => {
        if (!isThread) {
          const mailEntreis = res as MailModelEntries;
          if ((reqParams.order && reqParams.order !== 'date') || (reqParams.desc !== undefined && !reqParams.desc)) {
            const data = mailApi.orderByMailList(mailEntreis.data, reqParams);
            if (Array.isArray(data)) {
              mailEntreis.data = data;
            } else {
              return {
                total: data.total,
                data: data.data,
                index: reqParams.index,
                query: reqParams,
              } as MailModelEntries;
            }
          }
        }
        return res;
      }
    );
    if (result) {
      return { result, reqParams, _noCache: true };
    }
  },
  fulfilled: (
    state: MailBoxReducerState,
    action: PayloadAction<{
      result: MailModelEntries;
      reqParams: ReturnType<typeof getMailListReqParams>;
      noCache: boolean;
    }>
  ) => {
    const res = action.payload?.result;
    return res;
  },
  rejected: (state: MailBoxReducerState, action) => {
    const error = action?.error?.message || action.payload || action.error;
    console.error('getMailListRequestParams', error);
  },
});

/**
 * 请求邮件列表中的阅读状态
 */
thunkHelper({
  name: 'getMailListReadStatus',
  request: async (params: { mailIds: string[]; req: queryMailBoxParam }, thunkAPI: AsyncThunkConfig) => {
    const { mailIds = [], req } = params;
    //延迟请求，防止redux中的邮件model没有更新，防止请求阻塞
    const mailTid2readStateMap = await new Promise(async (r, j) => {
      let res = {};
      setTimeout(async () => {
        {
          try {
            // mailId转mailEntryModal
            const state: MailBoxReducerState = thunkAPI.getState().mailReducer;
            const { mailEntities } = state;
            const mailEntryList = getMailListByIdFromStore(mailIds, mailEntities);
            res = await mailApi.checkReadStatusOfSentMail(mailEntryList, req);
          } catch (e) {
            console.error('getMailListReadStatus', e);
          }
          r(res);
        }
      }, 500);
    });
    return {
      mailIds,
      mailTid2readStateMap,
    };
  },
  fulfilled: (
    state: MailBoxReducerState,
    action: PayloadAction<{
      mailTid2readStateMap: {
        [key in string]: {
          rcptCount?: number;
          readCount?: number;
          innerCount?: number;
          innerRead?: number;
          openCount?: number;
        };
      };
      mailIds: string[];
    }>
  ) => {
    const { mailTid2readStateMap, mailIds } = action.payload;

    if (mailIds && mailIds.length && mailTid2readStateMap) {
      const mailEntryList = getMailListByIdFromStore(mailIds, state.mailEntities);
      mailEntryList.forEach(i => {
        const obj = mailTid2readStateMap[i.entry.tid as string];
        i.entry.rcptCount = obj?.rcptCount || 0;
        i.entry.readCount = obj?.readCount || 0;
        i.entry.innerCount = obj?.innerCount || 0;
        i.entry.innerRead = obj?.innerRead || 0;
        i.entry.openCount = obj?.openCount || 0;
        return i;
      });
    }
  },
  rejected: (state: MailBoxReducerState, action) => {
    const error = action?.error?.message || action.payload || action.error;
    console.error('getMailListReadStatus', error);
  },
});

export const MailListThunks = Thunks;
export const MailListExtraReducersList = ReducersList;
