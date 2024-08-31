import React from 'react';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api, apiHolder, apis, MailApi, MailEntryModel, MailModelEntries, ProductAuthApi, queryMailBoxParam } from 'api';
import { thunkHelperFactory } from '@web-mail/util';
import { thunksStore } from '@web-mail/types';
import { AsyncThunkConfig } from 'state/createStore';
import { FLOLDER } from '@web-mail/common/constant';
import { getIn18Text } from 'api';
const storageApi = apiHolder.api.getDataStoreApi();
const productApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;

const doListMailBoxEntities = mailApi.doListMailBoxEntities.bind(mailApi);
const doListThreadMailBoxEntities = mailApi.doListThreadMailBoxEntities.bind(mailApi);
export enum tabType {
  // 智能收件箱/收件箱 首页
  readMain = 'readMain',
  // 读信页签
  read = 'read',
  // 回复写信页签
  reply = 'reply',
  // 回复全部写信页签
  replyAll = 'replyAll',
  // 转发写信页签
  forward = 'forward',
  // 普通写信页签
  writeCommon = 'common',
  // 带附件回复
  replyWithAttach = 'replyWithAttach',
  replyAllWithAttach = 'replyAllWithAttach',
  forwardAsAttach = 'forwardAsAttach',
  edit = 'edit',
  editDraft = 'editDraft', // 编辑草稿
  temp = 'temp', // 临时tab
  // 客户类型页签
  customer = 'customer',
  // 下属类型页签
  subordinate = 'subordinate',
}
export enum tabId {
  readMain = '-1',
  readCustomer = '-1/-10',
  subordinate = '-1/-11',
}
// 写信type数组
export const WriteMailTypes = ['reply', 'replyAll', 'forward', 'common', 'replyWithAttach', 'replyAllWithAttach', 'forwardAsAttach', 'edit', 'editDraft'];
export interface MailTabModel {
  // 页签id 包含读信页签与写信页签，此处不做类型抹平
  id: string;
  // 页签标题
  title: string;
  // 父级tab代理的子tabtitle
  proxyTitle?: string;
  // 页签类型
  type: tabType;
  // 是否可关闭
  closeable: boolean;
  // 是否将页签设置为active
  // ps：新增的页签不一定要设置为active状态
  isActive: boolean;
  // tab页携带的额外属性
  // 目前包括
  // from: 标识从哪个列表页打开
  extra?: {
    [key: string]: any;
  };
  // 自定义渲染结构
  render?: (data: MailTabModel, isActive: boolean) => React.ReactElement;
  // 二级页签
  subTabs?: MailTabModel[];
}

export interface ReadTabMaiList {
  // key : mid , value: title
  [key: string]: string;
}

export interface IMailTabReducer {
  currentTab: MailTabModel;
  tabList: MailTabModel[];
  showMailSidebar: boolean;
  readTabList: ReadTabModel[];
  readTabMidList: ReadTabMidList;
  readTabMailList: ReadTabMaiList;
}
/**
 * 读信页签数据，提供上下翻页使用
 */
export interface ReadTabModel {
  // 读信页签id
  id: string;
  // 当前页签id
  currentMid: string;
  isThread: boolean;

  // 页签中的邮件列表id, 不断更新
  midList: string[];
  // 该页签id初始查询条件
  query: any;
  // 总数量
  total: number;

  isSearching: boolean;
}

export interface ReadTabMidList {
  // 读信页签id
  [key: string]: string[];
}

// 『外贸』客户Tab
export const customerTab: MailTabModel = {
  id: tabId.readCustomer,
  title: getIn18Text('KEHU'),
  type: tabType.customer,
  closeable: false,
  isActive: false,
  proxyTitle: getIn18Text(['KEHU', 'YOUJIAN']),
  extra: {
    unRead: 0,
  },
};

// 『外贸』下属邮件Tab
export const SubordinateTab: MailTabModel = {
  id: tabId.subordinate,
  title: getIn18Text('XIASHU'),
  type: tabType.subordinate,
  closeable: false,
  isActive: false,
  proxyTitle: getIn18Text(['XIASHU', 'YOUJIAN']),
  extra: {},
};

const ReducerName = 'MailTabReducer';
const Thunks: thunksStore = {};
const ReducersList: (() => void)[] = [];
const thunkHelper = thunkHelperFactory(ReducerName, Thunks, ReducersList);
const mainTab: MailTabModel = {
  id: tabId.readMain,
  title: getIn18Text('SHOUJIANXIANG'),
  type: tabType.readMain,
  closeable: false,
  isActive: true,
  extra: {},
  subTabs: [
    {
      id: '-1/-1',
      title: getIn18Text('YOUJIAN'),
      proxyTitle: getIn18Text('SHOUJIANXIANG'),
      type: tabType.readMain,
      closeable: false,
      isActive: true,
      extra: {},
    },
  ],
};
export interface ReadTabMailModel {
  mid: string;
  title: string;
}
export interface ReadTabPreNextModel {
  prevMail: ReadTabMailModel | undefined;
  currentMail: ReadTabMailModel | undefined;
  nextMail: ReadTabMailModel | undefined;
}

export type MailTabState = Record<string, IMailTabReducer>;
const InitialState: IMailTabReducer = {
  // 当前页签
  currentTab: mainTab,
  // TODO: SubordinateTab 选项需要接口数据动态判断，是否有次tab
  tabList: process.env.BUILD_ISEDM ? [mainTab] : [mainTab],
  // 是否展开详情客户侧边栏，用于三栏拖拽缩放的
  showMailSidebar: process.env.BUILD_ISEDM ? true : false,
  readTabList: [],
  readTabMidList: {},
  readTabMailList: {},
};

const mailSlice = createSlice({
  name: ReducerName,
  initialState: InitialState,
  reducers: {
    /**
     * 设置新页签
     * @param state<IMailTabReducer>
     * @param action<MailTabModel> 判断 action.payload.isActive来决定是否将新增页签设为activeTab
     */
    doSetTab: (state: IMailTabReducer, action: PayloadAction<MailTabModel>) => {
      const tabIndex = state.tabList.findIndex(item => item.id === action.payload.id);
      const copy = [...state.tabList];
      if (tabIndex !== -1) {
        if (action.payload) {
          const oldTab = state.tabList[tabIndex] || {};
          const newTab = {
            ...oldTab,
            ...action.payload,
          };
          copy.splice(tabIndex, 1, newTab);
          state.tabList = copy;
        }
      } else {
        const id = action.payload.id;
        if (id != null) {
          if (id.includes('/')) {
            const path = id.split('/');
            const tab = state.tabList.find(item => item.id == path[0]);
            const subTab = tab?.subTabs?.find(item => item.id == path[0] + '/' + path[1]);
            if (subTab) {
              state.currentTab = subTab;
            } else if (tab) {
              tab?.subTabs?.push(action.payload);
            }
          } else {
            state.tabList.push(action.payload);
          }
        }
      }
      // 为所有页签设置来源 - 可以业务中手动设置，如果没有设置，则默认为当前选中的页签
      if (action.payload) {
        const extra = action.payload?.extra || {};
        let fromTabId = state.currentTab?.id;
        if (action.payload?.type == tabType?.read && state.currentTab?.type == tabType.customer) {
          fromTabId = tabId.readCustomer;
        }
        if (action.payload?.type == tabType?.read && state.currentTab?.type == tabType.subordinate) {
          fromTabId = tabId.subordinate;
        }
        action.payload.extra = {
          from: fromTabId,
          ...extra,
        };
      }
      if (action.payload.isActive) {
        state.currentTab = action.payload;
      }
    },
    /**
     * 根据页签id 关闭并删除页签
     * @param state: IMailTabReducer
     * @param action: PayloadAction<number | undefined>
     * @returns
     */
    doCloseTab: (state: IMailTabReducer, action: PayloadAction<MailTabModel['id']>) => {
      const index = state.tabList.findIndex(item => item.id === action.payload);
      const deletedTab = state.tabList[index];
      state.tabList = state.tabList.filter(item => item.id !== action.payload);
      if (action.payload !== state.currentTab.id) {
        return;
      }
      // 如果是写信页
      if (WriteMailTypes.includes(deletedTab?.type)) {
        let aimTab;
        if (deletedTab?.extra && deletedTab?.extra?.from?.includes('/')) {
          const path = deletedTab?.extra?.from?.split('/');
          const tab = state.tabList.find(item => item.id == path[0]);
          const subTab = tab?.subTabs?.find(item => item.id == path[0] + '/' + path[1]);
          if (subTab) {
            aimTab = subTab;
          }
        } else {
          aimTab = state.tabList.find(item => item.id === deletedTab?.extra?.from);
        }
        if (aimTab) {
          state.currentTab = aimTab;
          return;
        }
      }
      if (state.tabList[index]) {
        state.currentTab = state.tabList[index];
        return;
      }
      // 如果是最后一个tab，则返回对应的来源列表
      if (deletedTab && deletedTab?.extra?.from) {
        let aimTab;
        if (deletedTab?.extra && deletedTab?.extra?.from?.includes('/')) {
          const path = deletedTab?.extra?.from?.split('/');
          const tab = state.tabList.find(item => item.id == path[0]);
          const subTab = tab?.subTabs?.find(item => item.id == path[0] + '/' + path[1]);
          if (subTab) {
            aimTab = subTab;
          }
        } else {
          aimTab = state.tabList.find(item => item.id === deletedTab?.extra?.from);
        }
        if (aimTab) {
          state.currentTab = aimTab;
          return;
        }
      }
      state.currentTab = InitialState.currentTab;
    },
    // todo: 该方法过于陈旧，已无引用，带后续删除
    // doCloseTabAndBack: (state: IMailTabReducer, action: PayloadAction<MailTabModel['id']>) => {
    //   state.tabList = state.tabList.filter(item => item.id !== action.payload);
    //   state.currentTab = InitialState.currentTab;
    // },
    /**
     *  根据id，批量关闭删除页签
     * @param state  IMailTabReducer
     * @param action PayloadAction<string []>
     */
    doBatchCloseTab: (state: IMailTabReducer, action: PayloadAction<MailTabModel['id'][]>) => {
      // todo: 需要考虑传入 -1 异常关闭列表标签的问题
      const idList = action.payload;
      let activeTabId = state.currentTab.id;
      let readTabdId = '';
      // 读信页签被特殊处理加了_时间戳
      if (state.currentTab.type === 'read' && activeTabId.includes('_')) {
        readTabdId = state.currentTab.extra?.originMid || activeTabId.split('_')[0];
      }
      if (idList && Array.isArray(idList) && idList.length) {
        // 当前页签为读信页签(mid_时间戳)
        if (readTabdId !== '' && idList.includes(readTabdId)) {
          idList.push(activeTabId);
        }
        // 如果被关闭的页签处于选中状态，回到列表中
        if (idList.includes(activeTabId)) {
          let nextTab = null;
          // 标签当期那所处的index
          const activeTabIndex = state.tabList.findIndex(item => item.id === activeTabId);
          // 如果不是处于列表页
          if (activeTabIndex !== 0) {
            // 向后查找，找到一个没有被删除的tab
            for (let i = activeTabIndex + 1; i < state.tabList.length; i++) {
              const tabId = state.tabList[i]?.id;
              if (tabId && !idList.includes(tabId)) {
                nextTab = state.tabList[i];
                break;
              }
            }
            // 向前查找 - 如果全部删除，必然会留下 id为-1的只能收件箱标签，对该情况不做其他处理
            if (!nextTab) {
              for (let n = activeTabIndex - 1; n >= 0; n--) {
                const tabId = state.tabList[n]?.id;
                if (tabId && !idList.includes(tabId)) {
                  nextTab = state.tabList[n];
                  break;
                }
              }
            }
            if (nextTab) {
              state.currentTab = nextTab;
            }
          }
        }
        state.tabList = state.tabList.filter(item => !idList.includes(item.id));
      }
    },
    // 清除一些tab
    doClearTabs: (state: IMailTabReducer, action: PayloadAction<MailTabModel['id'][]>) => {
      state.tabList = state.tabList.filter(item => !action.payload.includes(item.id));
    },
    /**
     * 关闭全部页签 但保留closeable为true的页签
     * @param state
     */
    doCleanTabs: (state: IMailTabReducer) => {
      const leftTab = state.tabList.filter(item => !item.closeable);
      state.tabList = [...leftTab];
      state.currentTab = mainTab;
    },
    doUpdateCurrentTab: (state: IMailTabReducer, payload: PayloadAction<MailTabModel>) => {
      const id = payload.payload.id;
      if (!id) {
        return;
      }
      const currentTab = state.currentTab;
      if (currentTab) {
        const currentId = currentTab.id;
        let currentTabInx = state.tabList.findIndex(item => item.id === currentId);
        const oldTabInfo = state.tabList[currentTabInx];
        const newCurrentTab = { ...oldTabInfo, ...payload.payload };
        state.tabList.splice(currentTabInx, 1, newCurrentTab);
        state.currentTab = newCurrentTab;
      }
    },
    /**
     * 替换state.currentTab
     * @param state: IMailTabReducer
     * @param action: PayloadAction<number | string> 页签id
     */
    doChangeCurrentTab: (state: IMailTabReducer, action: PayloadAction<MailTabModel['id']>) => {
      const id = action.payload;
      if (id.includes('/')) {
        const path = id.split('/');
        const tab = state.tabList.find(item => item.id === path[0]);
        const subTab = tab?.subTabs?.find(item => item.id === path[0] + '/' + path[1]);
        if (subTab) {
          state.currentTab = subTab;
          // 如果命中二级页签，则二级页签活跃状态设置一下
          state.tabList[0].subTabs = tab?.subTabs?.map(sub => {
            sub.isActive = sub.id === subTab.id;
            return sub;
          });
        }
      } else if (id === tabId.readMain) {
        // 如果是外贸通下，切换回第一个页签，需要主动设置当前页签为二级页签
        const subTab = state.tabList[0].subTabs?.find(item => !!item.isActive);
        if (subTab) {
          state.currentTab = subTab;
        }
      } else {
        const tab = state.tabList.find(item => item.id === id);
        if (tab) {
          state.currentTab = tab;
        }
      }
    },
    /**
     * 根据id修改tab
     */
    doChangeTabById: (
      state: IMailTabReducer,
      action: PayloadAction<{
        id: string;
        tabModel: MailTabModel;
        setCurrent?: boolean;
      }>
    ) => {
      const { id, tabModel, setCurrent } = action.payload;
      if (id?.includes('/')) {
        const path = id.split('/');
        const tab = state.tabList.find(item => item.id === path[0]);
        if (tab?.subTabs) {
          tab.subTabs = tab?.subTabs?.map(item => {
            if (item.id === id) {
              const newTab = {
                ...item,
                ...tabModel,
              };
              if (setCurrent) {
                state.currentTab = newTab;
              }
              return newTab;
            }
            return item;
          });
          state.tabList = [...state.tabList];
        }
      } else {
        state.tabList = state.tabList.map(item => {
          if (item.id === id) {
            const newTab = {
              ...item,
              ...tabModel,
            };
            if (setCurrent) {
              state.currentTab = newTab;
            }
            return newTab;
          }
          return item;
        });
      }
    },
    /**
     * 根据id替换tab
     */
    doReplaceTabById: (
      state: IMailTabReducer,
      action: PayloadAction<{
        id: string;
        recoverCid: string;
      }>
    ) => {
      const { recoverCid, id } = action.payload;
      state.tabList = state.tabList.map(item => {
        if (item.id === recoverCid) {
          const newTab = {
            ...item,
            id,
          };
          if (state.currentTab.id === recoverCid) {
            state.currentTab = {
              ...state.currentTab,
              id,
            };
          }
          return newTab;
        }
        return item;
      });
    },
    /**
     * 替换id
     */
    doReplaceTabId: (
      state: IMailTabReducer,
      action: PayloadAction<{
        oldId: string;
        newId: string;
      }>
    ) => {
      const { oldId, newId } = action.payload;
      state.tabList = state.tabList.map(item => {
        if (item.id === oldId) {
          const newTab = {
            ...item,
            id: newId,
          };
          return newTab;
        }
        return item;
      });
      if (state.currentTab.id === oldId) {
        state.currentTab.id = newId;
      }
    },
    /**
     * 删除页签
     * @param state
     * @param action
     */
    doDeleteTabById: (state: IMailTabReducer, action: PayloadAction<MailTabModel['id']>) => {
      const index = state.tabList.findIndex(item => item.id === action.payload);
      // TODO 删除tab如果是当前tab 需要把currentTab重置为哪一个？
      if (state.tabList[index - 1].id) {
        state.currentTab = state.tabList[index - 1];
      }
      state.tabList = state.tabList.filter(item => item.id !== action.payload);
    },
    /**
     * 展示|关闭-外贸-客户页签
     */
    configCustomerTab: (state: IMailTabReducer, action: PayloadAction<boolean>) => {
      if (!productApi.getABSwitchSync('edm_mail')) {
        return;
      }
      const isShow = action.payload;
      const subTabList = state.tabList[0].subTabs || [];
      if (isShow) {
        // 如果外贸页签还没有被打开-插入到智能收件箱后面
        if (!subTabList.find(tab => tab.id === tabId.readCustomer)) {
          const tabConfig = { ...customerTab };
          // 判断是否有URL中携带的指令参数
          try {
            const localTask = storageApi.getSync('atCtTab')?.data;
            if (localTask && new Date().getTime() - new Date(+localTask).getTime() < 60000) {
              tabConfig.isActive = true;
              state.currentTab = tabConfig;
              storageApi.del('atCtTab');
            }
          } catch (e) {
            storageApi.del('atCtTab');
            console.error('[configCustomerTab localTask Error]', e);
          }
          subTabList.splice(1, 0, tabConfig);
        }
      } else {
        if (state.currentTab?.id == tabId.readCustomer) {
          state.currentTab = state.tabList[0];
        }
        if (state.tabList && state.tabList.length && state.tabList[0]?.subTabs) {
          state.tabList[0].subTabs = state.tabList[0]?.subTabs.filter(tab => tab.id !== tabId.readCustomer);
        }
      }
    },
    /**
     * 展示|关闭-外贸-下属邮件页签
     */
    configSdTab: (state: IMailTabReducer, action: PayloadAction<boolean>) => {
      if (!productApi.getABSwitchSync('edm_mail')) {
        return;
      }
      const isShow = action.payload;
      const subTabList = state.tabList[0].subTabs || [];
      if (isShow) {
        // 如果外贸页签还没有被打开-插入到智能收件箱后面
        let index = 0;
        subTabList.forEach((tab, i) => {
          if (tab.id === tabId.readCustomer) {
            index = i;
          }
        });
        if (!subTabList.find(tab => tab.id === tabId.subordinate)) {
          const tabConfig = { ...SubordinateTab };
          // 判断是否有URL中携带的指令参数
          try {
            const localTask = storageApi.getSync('atSdTab')?.data;
            if (localTask && new Date().getTime() - new Date(+localTask).getTime() < 60000) {
              tabConfig.isActive = true;
              state.currentTab = tabConfig;
              storageApi.del('atSdTab');
            }
          } catch (e) {
            storageApi.del('atSdTab');
            console.error('[configSdTab localTask Error]', e);
          }
          // 查找有readCustomer吗
          subTabList.splice(index + 1, 0, tabConfig);
        }
      } else {
        if (state.currentTab?.id == tabId.subordinate) {
          state.currentTab = state.tabList[0];
        }
        // state.tabList = tabList.filter(tab => tab.id !== tabId.subordinate);
        // 去掉二级tab标签
        if (state.tabList && state.tabList.length && state.tabList[0]?.subTabs) {
          state.tabList[0].subTabs = state.tabList[0]?.subTabs.filter(tab => tab.id !== tabId.subordinate);
        }
      }
    },
    /**
     * 邮件详情sidebar 已打开
     */
    doChangeMailSidebar: (state: IMailTabReducer, action: PayloadAction<boolean>) => {
      state.showMailSidebar = action.payload;
    },
    doSetReadTab: (state: IMailTabReducer, action: PayloadAction<ReadTabModel>) => {
      const tabIndex = state.readTabList.findIndex(item => item.id === action.payload.id);
      const copy = [...state.readTabList];
      if (tabIndex !== -1) {
        if (action.payload) {
          const oldTab = state.readTabList[tabIndex] || {};
          const newTab = {
            ...oldTab,
            ...action.payload,
          };
          copy.splice(tabIndex, 1, newTab);
          state.readTabList = copy;
        }
      } else {
        state.readTabList.push(action.payload);
      }
    },
    doSetReadTabMailList: (state: IMailTabReducer, action: PayloadAction<{ id: string; title: string }[]>) => {
      if (action.payload?.length) {
        action.payload.forEach(item => {
          state.readTabMailList[item.id] = item.title;
        });
      }
    },
    doSetReadTabMidList: (state: IMailTabReducer, action: PayloadAction<{ id: ReadTabModel['id']; midList: ReadTabModel['midList'] }>) => {
      // const tabIndex = state.readTabList.findIndex(item => item.id === action.payload.id);
      // const copy = [...state.readTabList];
      state.readTabMidList[action.payload.id] = [...action.payload.midList];
    },
    doSetReadTabCurrentMid: (state: IMailTabReducer, action: PayloadAction<{ id: ReadTabModel['id']; currentMid: ReadTabModel['currentMid'] }>) => {
      const tabIndex = state.readTabList.findIndex(item => item.id === action.payload.id);
      const copy = [...state.readTabList];
      if (tabIndex !== -1) {
        const oldTab = state.readTabList[tabIndex] || {};
        const newTab = {
          ...oldTab,
          currentMid: action.payload.currentMid,
        };
        copy.splice(tabIndex, 1, newTab);
        state.readTabList = copy;
      }
    },
    /**
     * 根据读信页签extra.currentMid删除页签（服务上下翻页）
     * @param state
     * @param action
     */
    doDeleteReadTabByCurrentMid: (state: IMailTabReducer, action: PayloadAction<string>) => {
      const index = state.readTabList.findIndex(item => item.currentMid === action.payload);
      if (index !== -1 && state.readTabMidList[state.readTabList[index].id]) {
        state.readTabMidList[state.readTabList[index].id] = [];
      }
      state.readTabList = state.readTabList.filter(item => item.currentMid !== action.payload);
    },
    /**
     * 根据读信页签id删除页签（服务上下翻页）
     * @param state
     * @param action
     */
    doDeleteReadTabById: (state: IMailTabReducer, action: PayloadAction<MailTabModel['id']>) => {
      const index = state.readTabList.findIndex(item => item.id === action.payload);
      if (index !== -1 && state.readTabMidList[state.readTabList[index].id]) {
        state.readTabMidList[state.readTabList[index].id] = [];
      }
      if (state.readTabMidList[action.payload]) {
        state.readTabMidList[action.payload] = [];
      }
      state.readTabList = state.readTabList.filter(item => item.id !== action.payload);
    },
    /**
     * 清除读信页签（服务上下翻页）
     * @param state
     */
    doCleanReadTab: (state: IMailTabReducer) => {
      // const leftTab = state.readTabList.map(item => item.id) ;//.filter(item => !item.closeable);
      // if (leftTab.length) {
      state.readTabMidList = {};
      // }
      state.readTabList = [];

      state.readTabMailList = {};
      // state.currentTab = mainTab;
    },
  },
});

thunkHelper({
  name: 'getCurrentReadMail',
  request: async (params: { originTabId: string; currentMid: string; offset: number }, thunkAPI: AsyncThunkConfig): Promise<ReadTabPreNextModel> => {
    const { originTabId = '', currentMid = '', offset = 0 } = params;
    const rootState = thunkAPI.getState();
    const state = rootState.mailTabReducer;
    const { dispatch } = thunkAPI;
    const exceptedFolderIds = [FLOLDER.TASK, FLOLDER.DRAFT, FLOLDER.UNREAD];

    const readTab = state.readTabList.find(item => item.id === originTabId);
    if (readTab) {
      const canLoadMore = !exceptedFolderIds.includes(readTab.query.id) && !readTab.isSearching; // && (readTab.query.index - 1 === 0 || readTab.query.index;
      const tabMidList = state.readTabMidList[originTabId];
      const readMailList = state.readTabMailList;
      if (tabMidList) {
        const currIdx = tabMidList.indexOf(currentMid);
        const prevIdx = currIdx - 1;
        const nextIdx = currIdx + 1;
        if (canLoadMore && !tabMidList[prevIdx]) {
          dispatch(Thunks.loadMoreReadTabMail({ originTabId, loadPrev: true, index: readTab.query.index - 1 }));
        } else if (canLoadMore && !tabMidList[nextIdx]) {
          dispatch(Thunks.loadMoreReadTabMail({ originTabId, loadNext: true, index: readTab.query.index + 1 }));
        } else if (offset !== 0) {
          dispatch(mailSlice.actions.doSetReadTab({ ...readTab, currentMid, query: { ...readTab.query, index: readTab.query.index + offset } }));
        }
        return {
          prevMail: tabMidList[prevIdx] ? { mid: tabMidList[prevIdx], title: readMailList[tabMidList[prevIdx]] } : undefined,
          currentMail: { mid: currentMid, title: readMailList[currentMid] }, //  { mid: tabMidList[currIdx], title: readMailList[tabMidList[currIdx]] },
          nextMail: tabMidList[nextIdx] ? { mid: tabMidList[nextIdx], title: readMailList[tabMidList[nextIdx]] } : undefined,
        };
      }
    }

    return { prevMail: undefined, currentMail: { mid: currentMid, title: '' }, nextMail: undefined };
  },
  fulfilled: (state: MailTabState, action: PayloadAction<{}>) => {
    const res = action.payload || {};
    return res;
  },
  rejected: (state: MailTabState, action) => {
    const error = action?.error?.message || action.payload || action.error;
    console.warn('getMailListRequestParams', error);
  },
});

thunkHelper({
  name: 'loadMoreReadTabMail',
  request: async (params: { originTabId: string; loadPrev?: boolean; loadNext?: boolean; index: number }, thunkAPI: AsyncThunkConfig) => {
    const { originTabId = '', loadPrev = false, loadNext = false, index: currentIdex } = params;
    const rootState = thunkAPI.getState();
    const state = rootState.mailTabReducer;
    const { dispatch } = thunkAPI;
    const _readTab: ReadTabModel | undefined = state.readTabList.find(item => item.id === originTabId);
    const midList = state.readTabMidList[originTabId];
    if (_readTab) {
      const {
        query: { count, ...other },
        total,
        isThread,
      } = _readTab;
      let _idx = loadPrev && currentIdex !== 0 ? currentIdex - count : currentIdex;
      // 跳过更新请求接口
      if (_idx < 0 || (loadNext && _idx >= total)) {
        return;
      }
      // if(_idx * count < total){
      const reqFn = isThread ? doListThreadMailBoxEntities : doListMailBoxEntities;
      reqFn({ ...other, count, index: _idx, _account: other._account }, true)
        .then((res: MailModelEntries | MailEntryModel[]) => {
          if (!isThread) {
            const mailEntreis = res as MailModelEntries;
            if ((other.order && other.order !== 'date') || (other.desc !== undefined && !other.desc)) {
              const data = mailApi.orderByMailList(mailEntreis.data, { ...other, count });
              if (Array.isArray(data)) {
                mailEntreis.data = data;
              } else {
                return {
                  total: data.total,
                  data: data.data,
                  index: _idx,
                  query: other,
                } as MailModelEntries;
              }
            }
          }
          return res as MailModelEntries;
        })
        .then(res => {
          const readTabMailList = (res?.data as MailEntryModel[])?.map(item => {
            return {
              id: item?.id,
              title: item?.entry?.title.replace(/<b>/g, '').replace(/<\/b>/g, '') || getIn18Text('WUZHUTI'),
            };
          });

          const newReadTab: ReadTabModel = {
            ..._readTab,
            total: res?.total || total,
          };
          const readTabMidList = (res?.data as MailEntryModel[])?.map(item => item.id);
          if (readTabMailList?.length) {
            dispatch(mailSlice.actions.doSetReadTabMailList(readTabMailList));
          }
          if (readTabMidList?.length && midList) {
            const midListRes = [...new Set(loadPrev ? readTabMidList.concat(midList) : midList.concat(readTabMidList))];
            newReadTab.midList = midListRes;
            dispatch(mailSlice.actions.doSetReadTabMidList({ id: originTabId, midList: midListRes }));
          }

          dispatch(mailSlice.actions.doSetReadTab(newReadTab));
        });
      // }
    }
  },
  rejected: (state: MailTabState, action) => {
    const error = action?.error?.message || action.payload || action.error;
    console.warn('loadMoreReadTabMail', error);
  },
});

thunkHelper({
  name: 'getReadMailTabIdByMid',
  request: async (params: { mid: string }, thunkAPI: AsyncThunkConfig): Promise<string | undefined> => {
    const { mid = '' } = params;
    const rootState = thunkAPI.getState();
    const state = rootState.mailTabReducer;
    const readTab = state.readTabList.find(item => item.currentMid === mid);
    const tab = readTab ? state.tabList.find(item => item.id === readTab.id) : undefined;
    if (readTab && tab) {
      return readTab.id;
    }
  },
  rejected: (state: MailTabState, action) => {
    const error = action?.error?.message || action.payload || action.error;
    console.warn('getMailListRequestParams', error);
  },
});

export const { actions } = mailSlice;
export const MailTabThunks = Thunks;
export default mailSlice.reducer;
