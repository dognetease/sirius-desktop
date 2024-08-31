import { PayloadAction } from '@reduxjs/toolkit';
import { MailBoxModel, MailApi, apiHolder, apis, updateUserFolderParams, MailConfApi, AccountApi } from 'api';
import { AsyncThunkConfig } from '@web-common/state/createStore';
import { thunksStore, MailBoxReducerState, moveSortUserFolderParams, IResponseError, MailTreeMap, MailTreeState, stringMap } from '../../../types';
import { getTreeId2Node, thunkHelperFactory, reduxMessage, getFolderErrorMsg, getTreeIdPathById, getMapConfigBySameAccountKey } from '../../../util';
import { folderOperErrCode2Msg, filterNotMainFolder } from '../../customize';
import { MailTabActions } from '@web-common/state/reducer';
import { defaultTreeState } from './mailReducer';
import { cloneDeep } from 'lodash';
import { FOLDER_EXPAND_ACCOUNT } from '@web-mail/common/constant';
import { getIn18Text } from 'api';
import { getStateFromLocalStorage } from '@web-mail/hooks/useUserLocalStorageState';
/**
 * thunk
 */
const ReducerName = 'MailReducer';
const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);
const MailApis = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const accountApi = apiHolder.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

// 远程请求账号列表数据缓存，每1小时更新一次
let allSubAccountsCache: { data: any; time: number } = {
  data: [],
  time: 0,
};

// 刷新件夹数据
thunkHelper({
  name: 'refreshFolder',
  request: async (params: { noCache?: boolean; account?: string; from?: string }, thunkAPI: AsyncThunkConfig) => {
    const { noCache = false, account = '', from } = params || {};
    const { dispatch, rejectWithValue } = thunkAPI;
    // 1。获取所有没有失效的账号，默认主账号第一个
    const allAccounts = await accountApi.getMainAndSubAccounts();
    // getMainAndSubAccounts返回的是本地缓存的账号信息，先返回，在异步请求远程账号信息，防止不一致
    if (allAccounts) {
      // 使用服务端账号缓存信息，此处不必判断过期，可直接使用，防止账号乱跳
      let moreAccounts = [];
      if (allSubAccountsCache.data && allSubAccountsCache.data.length) {
        const allAccountsAgentEmail = allAccounts.map(account => account.agentEmail);
        // 过滤出缓存中存在，但本地没返回的账号
        moreAccounts = allSubAccountsCache.data.filter((a: { agentEmail: any }) => !allAccountsAgentEmail.includes(a.agentEmail));
      }

      if (moreAccounts && moreAccounts.length && !noCache) {
        // 即是失败也不要阻塞后续流程
        try {
          await dispatch(Thunks.refreshFolderByAccounts({ noCache, accounts: [...allAccounts, ...moreAccounts], from }));
        } catch (e) {
          console.error('[error] Thunks.refreshFolderByAccounts', e);
        }
      } else {
        try {
          await dispatch(Thunks.refreshFolderByAccounts({ noCache, accounts: [...allAccounts], from }));
        } catch (e) {
          console.error('[error] Thunks.refreshFolderByAccounts', e);
        }
      }

      // 客户端支持多账号
      // if (systemApi.isElectron()) {
      let allSubAccountsFromServer = [];
      // 如果服务端账号信息有缓存，并且没有过期（过期时间暂定一小时），则直接使用
      if (!noCache && allSubAccountsCache.data && allSubAccountsCache.data.length && Date.now() - allSubAccountsCache.time < 3600000) {
        allSubAccountsFromServer = allSubAccountsCache.data;
      } else {
        // 重新获取服务端账号信息，并且缓存
        allSubAccountsFromServer = await accountApi.getAllSubAccounts();
        allSubAccountsCache = {
          data: allSubAccountsFromServer || [],
          time: Date.now(),
        };
      }
      if (allSubAccountsFromServer) {
        const allAccountsAgentEmail = allAccounts.map(a => a.agentEmail);
        const moreAccounts = allSubAccountsFromServer.filter(a => !allAccountsAgentEmail.includes(a.agentEmail));
        if (moreAccounts && moreAccounts.length) {
          try {
            await dispatch(Thunks.refreshFolderByExpiredAccounts({ accounts: [...moreAccounts] }));
          } catch (e) {
            console.error('[error] Thunks.refreshFolderByExpiredAccounts', e);
          }
        }
      }
      // return rejectWithValue();
      // }
    }
    // return rejectWithValue();
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<any>) => {},
  rejected: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    console.error('[refreshFolder Error]', action);
  },
});
// 根据给定的账号列表刷新文件夹
thunkHelper({
  name: 'refreshFolderByAccounts',
  request: async (params?: { noCache?: boolean; accounts: any[]; from?: string }) => {
    const { noCache = false, accounts = [], from } = params || {};
    // todo: 设置账号数据-再请求
    const treeList = await Promise.allSettled(
      accounts.map(account => {
        // 失效的直接返回空数组
        if (account.expired) {
          return Promise.resolve([]);
        } else {
          // 未失效的正常返回即可
          // setCurrentAccount(account.id);
          return new Promise(resolve => {
            MailApis.doListMailBox(noCache, undefined, from, account.id)
              .then(res => {
                resolve(res);
              })
              .catch(() => {
                resolve([]);
              });
          });
        }
      })
    );
    return { res: accounts.map((accountInfo, idx) => [accountInfo, treeList[idx]]) };
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const { res } = action.payload || {};
    const reqParams = action?.meta?.arg;
    if (res) {
      let treeMap: { [accountId: string]: MailTreeState };
      // 如果是本地账号卸载，则不叠加数据额，直接覆盖
      if (reqParams?.from === 'getExpiredAccountListAndRefreshFolder') {
        treeMap = {};
      } else {
        treeMap = { ...state.mailTreeStateMap };
      }
      const { mailTreeStateMap } = state;
      const expiredAccountList: string[] = [];
      // 根据账号分别写入
      res.forEach((cres: [any, any], idx: number) => {
        const [accountInfo, value] = cres;
        // 维护一下失效账号列表数据
        if (accountInfo && accountInfo.expired) {
          expiredAccountList.push(accountInfo.agentEmail);
        }
        if (value.status === 'fulfilled') {
          const accountId = idx === 0 ? 'main' : accountInfo.agentEmail || accountInfo.accountEmail || accountInfo.id;
          // 非主账号过滤
          if (idx > 0 && value?.value && value?.value.length) {
            value.value = filterNotMainFolder(value.value);
          }
          if (value?.value) {
            const oldTreeMap = getMapConfigBySameAccountKey<MailTreeState>(mailTreeStateMap, accountId) || cloneDeep(defaultTreeState);
            treeMap[accountId] = {
              ...oldTreeMap,
              mailFolderTreeList: value.value,
              MailFolderTreeMap: getTreeId2Node(value.value),
              sort: idx,
              accountId: accountInfo.agentEmail,
              accountName: accountInfo.agentEmail,
              emailType: accountInfo.emailType,
              expired: accountInfo.expired,
              hasCustomFolder: value.value.some((item: MailBoxModel) => item?.entry?.mailBoxId >= 100),
            };
            // 从本地读取FOLDER_EXPAND_ACCOUNTS，如果有，则展开
            try {
              const folderExpandAccounts = getStateFromLocalStorage<{ [key: string]: number[] }>(FOLDER_EXPAND_ACCOUNT);
              if (folderExpandAccounts && folderExpandAccounts[accountId] && treeMap[accountId]) {
                treeMap[accountId].expandedKeys = folderExpandAccounts[accountId];
              }
            } catch (e) {
              console.error('[Error refreshFolderByAccounts  FOLDER_EXPAND_ACCOUNT]', e);
            }
          }
        }
      });
      state.expiredAccountList = expiredAccountList;
      const treeMapKeys = Object.keys(treeMap);
      // 防止主账号返回失败，置空
      if (treeMapKeys.length && treeMapKeys.includes('main')) {
        state.mailTreeStateMap = treeMap as MailTreeMap;
      }
    }
  },
  rejected: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    console.log(action);
  },
});
// 远程服务的返回的比本地多的账号都是失效的，可以不用对本地的账号重新刷新，直接更新失效账号即可
thunkHelper({
  name: 'refreshFolderByExpiredAccounts',
  request: async (params?: { noCache?: boolean; accounts: any[] }) => {
    const { accounts = [] } = params || {};
    // todo: 设置账号数据-再请求
    const treeList = await Promise.allSettled(
      accounts.map(account => {
        // 都是失效的直接返回空数组即可
        return Promise.resolve([]);
      })
    );
    return { res: accounts.map((accountInfo, idx) => [accountInfo, treeList[idx]]) };
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const { res } = action.payload || {};
    if (res) {
      const treeMap: { [accountId: string]: MailTreeState } = {};
      const { mailTreeStateMap } = state;
      const expiredAccountList: string[] = [];
      // 根据账号分别写入
      res.forEach((cres: [any, any], idx: number) => {
        const [accountInfo, value] = cres;
        // 维护一下失效账号列表数据
        if (accountInfo) {
          expiredAccountList.push(accountInfo.agentEmail);
        }
        const treeMapKeyLength = Object.keys(mailTreeStateMap).length; // redux中原来有几个账号
        if (value.status === 'fulfilled') {
          const accountId = accountInfo.agentEmail || accountInfo.accountEmail || accountInfo.id;
          // 非主账号过滤
          if (idx > 0 && value?.value && value?.value.length) {
            value.value = filterNotMainFolder(value.value);
          }
          // 非主账号过滤
          if (value?.value) {
            const oldTreeMap = getMapConfigBySameAccountKey<MailTreeState>(mailTreeStateMap, accountId) || cloneDeep(defaultTreeState);
            treeMap[accountId] = {
              ...oldTreeMap,
              mailFolderTreeList: [],
              MailFolderTreeMap: {},
              sort: treeMapKeyLength + idx, // 第几个需要处理
              accountId: accountInfo.agentEmail,
              accountName: accountInfo.agentEmail,
              emailType: accountInfo.emailType,
              expired: true,
              hasCustomFolder: false,
            };
            // 从本地读取FOLDER_EXPAND_ACCOUNTS，如果有，则展开
            try {
              const folderExpandAccounts = getStateFromLocalStorage<{ [key: string]: number[] }>(FOLDER_EXPAND_ACCOUNT);
              if (folderExpandAccounts && folderExpandAccounts[accountId] && treeMap[accountId]) {
                treeMap[accountId].expandedKeys = folderExpandAccounts[accountId];
              }
            } catch (e) {
              console.error('[Error refreshFolderByAccounts  FOLDER_EXPAND_ACCOUNT]', e);
            }
          }
        }
      });
      // 去重添加失效账号
      state.expiredAccountList = [...new Set([...state.expiredAccountList, ...expiredAccountList])];
      // 覆盖添加失效账号
      state.mailTreeStateMap = {
        ...mailTreeStateMap,
        ...treeMap,
      };
    }
  },
  rejected: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    console.log(action);
  },
});
// 邮件-文件夹-创建文件夹
thunkHelper({
  name: 'createUserFolder',
  request: async (params: { name: string; parent: number; accountId?: string; sort: number[]; _tempId: number }[], thunkAPI: AsyncThunkConfig) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    const accountId = params && params.length ? params[0]?.accountId : undefined;
    const folder = params.map(item => {
      const { parent, name } = item;
      return {
        name,
        parent: parent >= 0 ? parent : 0,
      };
    });
    // 所有的文件夹都只能在一个账号下创建
    // setCurrentAccount(accountId);
    // 关闭穿件文件夹时的级联同步，因为业务上是复合操作-新建，排序后才需要同步
    const res = await MailApis.createUserFolder(folder, { syncMailFolder: false }, accountId);
    try {
      // 创建后，按位置对文件夹进行排序，排序的成功与否不影响创建
      const sortParams: updateUserFolderParams[] = [];
      params.forEach((item, index) => {
        const { parent, sort, _tempId } = item;
        const readFid = res[index];
        // 等返回真实地文件夹id之后，将临时id替换为真是id进行排序操作
        let sorts = sort.join(',').replace(_tempId + '', readFid + '');
        if (sort && readFid) {
          sortParams.push({
            id: parent >= 0 ? parent : 0,
            sorts: sorts,
          });
        }
      });
      // setCurrentAccount(accountId);
      await MailApis.updateUserFolder(sortParams, accountId);
    } catch (e) {
      console.log('[createUserFolder - sort] error');
    }
    if (res) {
      dispatch(Thunks.refreshFolder({ noCache: true, account: accountId }));
      return { params, res };
    }
    return rejectWithValue();
  },
  fulfilled: () => {
    // 静默成功
  },
  rejected: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const errorMsg = getFolderErrorMsg(action.error as IResponseError) || getIn18Text('CHUANGJIANWENJIANJIA');
    reduxMessage.error({ content: errorMsg });
  },
});
// 邮件-文件夹-更新文件夹信息
thunkHelper({
  name: 'updateUserFolder',
  request: async (params, thunkAPI: AsyncThunkConfig) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    const accountId = params && params.length ? params[0]?.accountId : null;
    const folder = params.map(item => ({
      ...item,
      parent: item.parent >= 0 ? item.parent : 0,
      accountId: undefined,
    }));
    // setCurrentAccount(accountId);
    const res = await MailApis.updateUserFolder(folder, accountId);
    if (res) {
      dispatch(Thunks.refreshFolder({ noCache: true, account: accountId }));
      return { params, res };
    }
    return rejectWithValue();
  },
  fulfilled: () => {
    // 刷新文件树
  },
  rejected: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const errorMsg = getFolderErrorMsg(action.error as IResponseError) || getIn18Text('GENGXINWENJIANJIA');
    reduxMessage.error({ content: errorMsg });
  },
});
// 邮件-文件夹-移动文件夹层级
thunkHelper({
  name: 'moveUserFolder',
  request: async (params, thunkAPI: AsyncThunkConfig) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    const accountId = params && params.length ? params[0]?.accountId : null;
    const folder = params.map(item => ({
      ...item,
      parent: item.parent >= 0 ? item.parent : 0,
    }));
    // setCurrentAccount(accountId);
    const res = await MailApis.updateUserFolder(folder, accountId);
    if (res) {
      dispatch(Thunks.refreshFolder({ noCache: true, account: accountId }));
      return { params, res };
    }
    return rejectWithValue();
  },
  fulfilled: () => {
    // 刷新文件树
  },
  rejected: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const errorMsg = getFolderErrorMsg(action.error as IResponseError) || getIn18Text('YIDONGWENJIANJIA');
    reduxMessage.error({ content: errorMsg });
  },
});
// 邮件-文件夹-文件夹删除
thunkHelper({
  name: 'deleteUserFolder',
  request: async (params, thunkAPI: AsyncThunkConfig) => {
    const ids = params?.mailIds ?? [];
    const { accountId } = params;
    // 直接删除文件夹
    // setCurrentAccount(accountId);
    const res = await MailApis.deleteUserFolder(ids, accountId);
    if (res) {
      reduxMessage.success({ content: getIn18Text('SHANCHUWENJIANJIA11') });
      thunkAPI.dispatch(Thunks.refreshFolder({ noCache: true, account: accountId }));
      return res;
    }
    reduxMessage.error({ content: getIn18Text('SHANCHUWENJIANJIA') });
    return {
      params,
    };
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<any>) => {},
  rejected: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const errorMsg = getFolderErrorMsg(action.error as IResponseError) || getIn18Text('SHANCHUWENJIANJIA');
    reduxMessage.error({ content: errorMsg });
  },
});
// 邮件-清空文件夹
thunkHelper({
  name: 'doMailAllDelete',
  request: async (params, thunkAPI: AsyncThunkConfig) => {
    const { rejectWithValue } = thunkAPI;
    const { fid, accountId } = params;
    if (fid != null) {
      // setCurrentAccount(accountId);
      const res = await MailApis.doDeleteMail({ fid, _account: accountId }).catch(r => rejectWithValue(r));
      if (res && res.succ) {
        // 如果页签有当前所清空文件夹下的邮件，则关闭对应页签
        const state = thunkAPI.getState().mailReducer;
        const tabState = thunkAPI.getState().mailTabReducer;
        const idArr = tabState.tabList
          .map(m => m.id)
          .filter(id => {
            const folder = state.mailEntities[id]?.entry.folder;
            return folder && folder == fid;
          });
        if (idArr && idArr.length) {
          thunkAPI.dispatch(MailTabActions.doBatchCloseTab(idArr));
        }
        return res;
      }
      return rejectWithValue({ params, res });
    }
    return rejectWithValue({ params });
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const fid = action.meta.arg;
    if (fid != null && state.selectedKeys.id === fid) {
      state.mailDataList = [];
      state.mailTotal = 0;
      state.activeIds = [];
      const layout = mailConfApi.getMailPageLayout();
      // 不是通栏布局，才会设置selectedMailId为空
      if (layout !== '2') {
        state.selectedMailId = {
          id: '',
          accountId: '',
        };
      }
    }
    state.commonModalVisible = false;
  },
  rejected: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    state.commonModalVisible = false;
    const { res } = action.payload;
    if (res && res.code === 'NETWORK.ERR') {
      reduxMessage.error({ content: getIn18Text('CAOZUOSHIBAI\uFF0C') });
    } else {
      reduxMessage.error({ content: getIn18Text('QINGKONGSHIBAI') });
    }
  },
});
// 邮件-文件夹-拖拽移动排序
thunkHelper({
  name: 'moveSortUserFolder',
  request: async (params, thunkAPI: AsyncThunkConfig) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    const { id, parent, sorts, accountId }: moveSortUserFolderParams = params;
    // 由于接口限制，跨层级的移动排序需要拆解为移动，排序两个原子操作
    const reqParamsList: updateUserFolderParams[] = [
      {
        id: parent,
        sorts: sorts.join(','),
      },
    ];
    // 服务端限制，id为负数的虚拟文件夹，只能记录排序，不能有任何操作, 所以操作中不带有移动操作
    if (id > 0) {
      reqParamsList.unshift({
        id,
        parent,
      });
    }
    // 发起请求
    // setCurrentAccount(accountId);
    const res = await MailApis.updateUserFolder(reqParamsList, accountId);
    if (res) {
      dispatch(Thunks.refreshFolder({ noCache: true }));
      return res;
    }
    return rejectWithValue();
  },
  pending: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const params = action.meta.arg;
  },
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const { id, parent }: moveSortUserFolderParams = action.meta.arg;
    const res = action.payload;
    if (res && res.succ && id) {
      // todo: 需要根据当前操作的账号，获取对应的树
      // 操作成功的时候展开节点
      const path = getTreeIdPathById(state.mailTreeStateMap.main.mailFolderTreeList, id);
      if (path) {
        // state.expandedKeys = [...new Set([...state.expandedKeys, ...path])];
        const accountId = state.selectedKeys.accountId;
        // todo: 判断是否是主账号
        // todo: 这些判断，需要封装
        if (accountId) {
          state.mailTreeStateMap.main.expandedKeys = [...new Set([...state.mailTreeStateMap.main.expandedKeys, ...path])];
        } else {
          state.mailTreeStateMap[accountId].expandedKeys = [...new Set([...state.mailTreeStateMap.main.expandedKeys, ...path])];
        }
      }
    }
  },
  rejected: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const { code } = action.error || {};
    const msg = folderOperErrCode2Msg(code);
    reduxMessage.error({ content: msg });
  },
});
// 邮件-文件夹-更新挂载邮箱别名
thunkHelper({
  name: 'updateUserFolderAlias',
  request: async (params, thunkAPI: AsyncThunkConfig) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    const { account, name }: { account: string; name: string } = params;
    // 发起请求
    // setCurrentAccount(accountId);
    const res = await MailApis.updateDisplayEmail({ bindEmail: account, bindUserName: name });
    if (res) {
      return res;
    }
    return rejectWithValue();
  },
  pending: (state: MailBoxReducerState, action: PayloadAction<any>) => {},
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const { account, name }: moveSortUserFolderParams = action.meta.arg;
    const res = action.payload;
    if (res) {
      state.mailAccountAliasMap[account] = name;
    }
  },
  rejected: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    console.error('[updateUserFolderAlias Error reject]', action.error);
    reduxMessage.error({ content: getIn18Text('GENGXINZHANGHAONICSB') });
  },
});
// 邮件-文件夹-获取挂载邮箱别名
thunkHelper({
  name: 'getUserFolderAlias',
  request: async (params, thunkAPI: AsyncThunkConfig) => {
    const { dispatch, rejectWithValue } = thunkAPI;
    const { accountList }: { accountList: string[] } = params;
    // setCurrentAccount(accountId);
    const res = await MailApis.getDisplayName(accountList);
    if (res) {
      return res;
    }
    return rejectWithValue();
  },
  pending: (state: MailBoxReducerState, action: PayloadAction<any>) => {},
  fulfilled: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    // const { accountList }: moveSortUserFolderParams = action.meta.arg;
    const res = action.payload;
    if (res) {
      if (res.bindUserDetail) {
        const map: stringMap = {};
        for (let item of res.bindUserDetail) {
          map[item.bindEmail] = item.bindUserName;
        }
        state.mailAccountAliasMap = map;
      }
    }
  },
  rejected: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    console.error('[getUserFolderAlias Error reject]', action.error);
  },
});

export const FolderThunks = Thunks;
export const FolderExtraReducersList = ReducersList;
