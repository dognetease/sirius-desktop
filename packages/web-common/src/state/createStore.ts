/*
 * @Author: your name
 * @Date: 2022-03-23 11:07:28
 * @LastEditTime: 2022-03-23 11:16:49
 * @LastEditors: your name
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/web-common/src/state/createStore.ts
 */
/* eslint-disable max-len */
import { bindActionCreators, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useMemo } from 'react';
import { config } from 'env_def';
import { storeOpRegister, StoreMailOps, apiHolder as api, locationHelper, inWindow, AccountApi, apis, MailEntryModel, getIn18Text } from 'api';

import rootReducer, {
  AppActions,
  GlobalActions,
  AttachmentActions,
  ContactActions,
  TempContactActions,
  MailActions,
  ReadCountActions,
  ScheduleActions,
  MailConfigActions,
  MailTemplateActions,
  MailClassifyActions,
  DiskActions,
  DiskAttActions,
  StrangerActions,
  ReadMailActions,
  NiceModalActions,
  AutoReplyActions,
  MailProductActions,
  HollowOutGuideAction,
  MailTabActions,
  AiWriteMailReducer,
  SalesPitchActions,
  ConfigActions,
} from './reducer';
import { Thunks } from '@web-common/state/reducer/mailReducer';
import { resetMailWithDraft as resetMailWithDraftAsync } from '@web-mail-write/components/SendMail/utils';
import { FLOLDER, INIT_TASK_KEY, INIT_TASK_TIME_KEY, INIT_STATE_KEY } from '@web-mail/common/constant';
const eventApi = api.api.getEventApi();
const storageApi = api.api.getDataStoreApi();
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

// 创建store
const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }),
  // preloadedState:{},
  devTools: config('stage') !== 'prod',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const userAppSelectorShallowEqual = shallowEqual;
export const useActions = <T extends {}>(actions: T) => {
  const dispatch = useAppDispatch();
  return useMemo(() => bindActionCreators(actions, dispatch), [actions, dispatch]);
};

export type AsyncThunkConfig = {
  /** return type for `thunkApi.getState` */
  state?: unknown;
  /** type for `thunkApi.dispatch` */
  dispatch: AppDispatch;
  /** type of the `extra` argument for the thunk middleware, which will be passed in as `thunkApi.extra` */
  extra?: unknown;
  /** type to be passed into `rejectWithValue`'s first argument that will end up on `rejectedAction.payload` */
  rejectValue?: unknown;
  /** return type of the `serializeError` option callback */
  serializedErrorType?: unknown;
  /** type to be returned from the `getPendingMeta` option callback & merged into `pendingAction.meta` */
  pendingMeta?: unknown;
  /** type to be passed into the second argument of `fulfillWithValue` to finally be merged into `fulfilledAction.meta` */
  fulfilledMeta?: unknown;
  /** type to be passed into the second argument of `rejectWithValue` to finally be merged into `rejectedAction.meta` */
  rejectedMeta?: unknown;
  getState: () => RootState;
  rejectWithValue: (err?: any) => any;
};

export {
  AppActions,
  GlobalActions,
  AttachmentActions,
  ContactActions,
  TempContactActions,
  MailActions,
  ReadCountActions,
  ScheduleActions,
  MailConfigActions,
  DiskActions,
  MailTemplateActions,
  MailClassifyActions,
  DiskAttActions,
  StrangerActions,
  ReadMailActions,
  NiceModalActions,
  AutoReplyActions,
  MailProductActions,
  HollowOutGuideAction,
  MailTabActions,
  AiWriteMailReducer,
  SalesPitchActions,
  ConfigActions,
};

const pKey2IkeyMap: { [key: string]: any } = {
  // 邮件-文件夹
  fid: {
    type: 'mailReducer',
    keyPath: 'selectedKeys.id',
  },
  // 邮件，当期打开的邮件id
  mid: {
    type: 'mailReducer',
    keyPath: 'selectedMailId.id',
  },
  // 外贸下属联系人
  fid_sd: {
    type: 'mailReducer',
    keyPath: 'selectedKeys_sd.id',
  },
};

const getSearch = (key: string): string => {
  if (inWindow()) {
    const search = new URLSearchParams(window.location.search);
    return search.get(key) || '';
  }
  return '';
};

// 将外部带参的key转换到内部的状态值
const switchParamsKey2InnerKey = (key: string): string => {
  return pKey2IkeyMap[key];
};

// 获取链接中#module=后面的字符串
const getModule = () => {
  let module = '';
  if (inWindow()) {
    const hash = window.location.hash;
    const reg = /module=(\S*)/;
    const regVal = hash.match(reg);
    if (regVal) {
      module = decodeURIComponent(regVal[0] || '')?.replace(/(\S*)\|/, '');
    }
  }
  return module;
};

// 统一来源普通参数结构
const unifiedInitState = () => {
  try {
    const module = getModule();
    const fid = JSON.parse(module || '{}')?.fid;
    const state = getSearch(INIT_STATE_KEY);
    const stateMap: { [key: string]: any } = JSON.parse(state || '{}');
    return fid ? Object.assign(stateMap, { fid }) : stateMap;
  } catch (e) {
    console.error('[unifiedInitState error]', e);
    return {};
  }
};
// 统一来源任务参数结构
const unifiedInitTask = () => {
  try {
    let taskList = [];
    const module = getModule();
    const mid = getSearch('mid') || JSON.parse(module || '{}')?.mid;
    if (mid) {
      taskList.push({ type: 'readMailTab', id: mid });
      return JSON.stringify(taskList);
    }
    const task = getSearch(INIT_TASK_KEY);
    if (task) {
      taskList = JSON.parse(task) || [];
      if (taskList.length > 0) {
        return JSON.stringify(taskList);
      }
    }
    return '';
  } catch (e) {
    console.error('[unifiedInitTask error]', e);
    return '';
  }
};

/**
 * 处理Web下URL中的带参状态预置
 * 只在web下生效
 * 来源1：网易OA（hash形式）
 * ex: 打开邮件详情页 #module=read.ReadModule|{"mid":"AEUAGQCOFkSjMFLIuEKeoKrk","id":"AEUAGQCOFkSjMFLIuEKeoKrk"}
 * ex: 打开文件夹 #module=mbox.ListModule|{"fid":3,"order":"date","desc":true}
 * 来源2：外贸（search形式）
 * ex: ?initState={a:1,b:2,c:3}
 * ex: &initTask=[{type:"readMailTab", id:"AOUAtgCZADECl6hPRIIAEqpp"}]
 * 来源3：其他（search形式）
 * ex: ?mid=AOUAtgCZADECl6hPRIIAEqpp
 */
if (process.env.BUILD_ISWEB && inWindow()) {
  try {
    const stateMap = unifiedInitState();
    if (Object.keys(stateMap).length > 0) {
      const keyList: string[] = [];
      if (stateMap) {
        for (let i in stateMap) {
          keyList.push(i);
        }
      }
      // 进行转换, 将对外稳定暴露的状态 修改为 内部对应的状态值
      const module2ConfigMap: { [key: string]: any } = {};
      keyList.forEach(key => {
        const innerConfig = switchParamsKey2InnerKey(key);
        if (innerConfig && innerConfig?.type) {
          if (module2ConfigMap[innerConfig?.type]) {
            module2ConfigMap[innerConfig?.type].push({
              keyPath: innerConfig?.keyPath,
              value: stateMap[key],
            });
          } else {
            module2ConfigMap[innerConfig?.type] = [
              {
                keyPath: innerConfig?.keyPath,
                value: stateMap[key],
              },
            ];
          }
        }
      });
      /**
       * 将值转换写入到对应模块的reducer中
       */
      for (let moduleName in module2ConfigMap) {
        // 先仅支持邮件模块
        if (moduleName === 'mailReducer') {
          store.dispatch(MailActions.doUpdateStateByURL(module2ConfigMap[moduleName]));
        }
      }
    }
    // 查找动态任务，写入localStroage
    const task = unifiedInitTask();
    if (task) {
      // const taskList = JSON.parse(task);
      storageApi.putSync(INIT_TASK_KEY, task, { noneUserRelated: true });
      // 设置更新时间，超过1分钟的任务就会被抛弃掉
      storageApi.putSync(INIT_TASK_TIME_KEY, new Date().getTime() + '', { noneUserRelated: true });
    }
  } catch (e) {
    console.warn('[PreSetState Error]', e);
  }
}

// store实例子生成后向api层注入操作方法
// todo: 迁移到其他单独的文件中
// todo: sliceId type
storeOpRegister('mail', {
  updateMailModelEntriesFromDb: ev => {
    const { mailReducer } = store.getState();
    const params = ev.eventData;
    const { _account } = ev;

    // 列表完成同步下消息的时候关闭主动loading装填
    if (params?.checkType === 'checkCustomerMail') {
      // 外贸暂无该功能
    } else if (params?.checkType === 'checkSubordinateMail') {
      // 外贸暂无该功能
    } else {
      store.dispatch(MailActions.doUpdateListIsRefresh(false));
    }

    if (params?.diff) {
      const forCustomer = params?.checkType === 'checkCustomerMail';
      const forSubordinate = params?.checkType === 'checkSubordinateMail';
      if (forCustomer || forSubordinate) {
        store.dispatch(
          Thunks.loadMailListFromDB_edm({
            startIndex: 0,
            showLoading: false,
            sliceId: params.sliceId,
            type: params.type,
          })
        );
        return;
      }

      if (params?.diff) {
        const forCustomer = params?.checkType === 'checkCustomerMail';
        const forSubordinate = params?.checkType === 'checkSubordinateMail';
        if (forCustomer || forSubordinate) {
          store.dispatch(
            Thunks.loadMailListFromDB_edm({
              startIndex: 0,
              showLoading: false,
              sliceId: params.sliceId,
              type: params.type,
            })
          );
          return;
        }

        const currentFid = mailReducer.selectedKeys.id;
        const currentTag = mailReducer.mailTagFolderActiveKey;
        const isCurrentSelected = params?.id === currentFid;
        const isCurrentAccount = _account == mailReducer.selectedKeys.accountId;
        const isTagSelected =
          currentFid === FLOLDER.TAG &&
          Array.isArray(params?.tag) &&
          params?.tag[0] === currentTag?.key &&
          accountApi.getIsSameSubAccountSync(_account, currentTag?.accountId || '');
        if (isCurrentAccount && (isCurrentSelected || isTagSelected)) {
          store.dispatch(
            Thunks.loadMailListFromDB({
              startIndex: 0,
              showLoading: false,
              accountId: _account,
            })
          );
        }
      }
    }
  },
  // 改反向回调不受到 多账号的影响
  updateMailEntities: list => {
    store.dispatch(
      MailActions.updateMailEntities({
        mailList: list,
      })
    );
  },
  resetMailWithDraft: ({ cid }) => {
    resetMailWithDraftAsync(+cid);
  },
  // TODO：参数需要重构，需要UI配合
  updateMailEntity: ev => {
    const { _account } = ev;
    if (ev.eventName === 'mailStoreRefresh' && ev.eventStrData === 'mailOp') {
      // top 会影响邮件列表的排序，需要在thunk中处理
      if (ev.eventData.opType === 'top') {
        if (ev.eventData.status === 'success' || ev.eventData.status === 'fail') {
          store.dispatch(
            Thunks.syncMailTop({
              ...ev,
              eventStrData: ev.eventData.opType,
            })
          );
        }
      }
      if (ev.eventData.opType === 'delete') {
        store.dispatch(
          Thunks.syncMailDeleted({
            ...ev,
            eventStrData: ev.eventData.opType,
          })
        );
        // 如果是独立读信页，发送窗体关闭消息
        if (locationHelper.isReadMail() && ev.eventData.status === 'success') {
          const mailIds = ev.eventData.params.id;
          eventApi.sendSysEvent({
            eventName: 'mailMenuOper',
            eventStrData: 'closeMailWindow',
            eventData: mailIds,
            _account,
          });
        }
        // 通栏模式下，关闭对也的页签
        if (ev.eventData?.params?.id) {
          const idList: string[] = Array.isArray(ev.eventData.params.id) ? ev.eventData?.params?.id : [ev.eventData?.params?.id];
          store.dispatch(MailTabActions.doBatchCloseTab(idList));
        }
      } else if (ev.eventData.opType === 'move') {
        store.dispatch(
          Thunks.syncMailMove({
            ...ev,
            eventStrData: ev.eventData.opType,
          })
        );
      } else {
        store.dispatch(
          MailActions.doMailOperation({
            ...ev,
            eventStrData: ev.eventData.opType,
          })
        );
      }
    }
  },
  // 标签操作的同步
  updateMailTag: payload => {
    // console.log(payload.type);
    // console.log(payload.params);
    store.dispatch(Thunks.syncMailTagOper(payload));
  },
} as StoreMailOps);

// 想window绑定翻译方法
try {
  if (inWindow() && window && !window['__getIn18Text']) {
    window['__getIn18Text'] = getIn18Text;
  }
} catch (e) {
  console.error('[window.__getIn18Text error]', e);
}

/**
 * 向全局变量暴露redux实例以提供调试方法
 * key: __sirius_redux_store
 */
try {
  if (inWindow() && window && !window.__sirius_redux_store) {
    window.__sirius_redux_store = {
      store,
      getState: () => {
        return store.getState();
      },
      // 获取mailReducer的状态
      getMailState: (key?: string) => {
        const state = store.getState().mailReducer;
        if (key) {
          return state[key];
        }
        return state;
      },
      // 打印出所有mailReducer的状态
      showMailState: () => {
        const state = store.getState().mailReducer;
        // 特殊写法，绕开正式构建的屏蔽
        window.console['log']('[mailReducer]', state);
        return state;
      },
      // 根据id查找redux中的邮件model
      getMailModalById: (id: string) => {
        if (id) {
          const state = store.getState().mailReducer;
          const map = state.mailEntities as { [key: string]: MailEntryModel };
          return map[id];
        }
      },
      // 展示邮件的关键节点信息
      showMailInfo: () => {
        const state = store.getState().mailReducer;
        const data = [
          { name: '选中文件夹', value: state.selectedKeys },
          { name: '选中邮件id', value: state.selectedMailId },
          { name: '选中的邮件model', value: state.mailEntities[state.selectedMailId?.id] },
          { name: '邮件激活id', value: state.activeIds },
          { name: '账号信息', value: state.mainAccountState },
          { name: '文件夹信息', value: state.mailTreeStateMap },
          { name: '子账号信息', value: state.childAccountStateMap },
          { name: '失效账号列表', value: state.expiredAccountList },
          { name: '列表二级筛选', value: state.mailListStateTab },
          { name: '列表到顶部高度-虚拟', value: state.scrollTop },
          { name: '邮件列表id', value: state.mailDataList },
          { name: '搜索接过id', value: state.searchList },
          { name: '邮件列表总数', value: state.mailTotal },
          { name: '文件夹展开', value: state.expandedSearchKeys },
          { name: '列表到顶部高度-虚拟', value: state.scrollTop },
        ];
        // 特殊写法，绕开正式构建的屏蔽
        window.console['table'](data);
        return data;
      },
    };
  }
} catch (e) {
  console.error('[window.__sirius_redux_store error]', e);
}

export default store;
