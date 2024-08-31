/* eslint-disable no-param-reassign */
import { PayloadAction } from '@reduxjs/toolkit';
import { MailBoxModel, MailEntryModel, MailSearchTypes, SystemEvent, MailSearchResult, MailSearchStatesMap, SelectedKeysModel, MailTag } from 'api';
import {
  MailBoxReducerState,
  fromValues,
  showMailMoveModalParam,
  doMailReplay,
  mailListStateTabSelected,
  showMailImportModalParam,
  mailListStateTabs,
  TreeSelectedKey,
  MailSelectedKey,
  MailMoveKeys,
  SearchSelectedKeyMap,
  RootMailBoxReducerState,
  EdmMailKeys,
  OrderDateRange,
} from '../../../types';
import { mailIdinList, getMailListByIdFromStore, getMainAccount, isMainAccount, getTreeId2Node, getChooseMailId } from '../../../util';
import { cloneDeep } from 'lodash';
import { guideConfig } from '../../config';
import {
  getCanActiveMailId,
  updateMailStore,
  updateMailStoreNoMerge,
  separateUpdateIdAndStore,
  formatMailDataList,
  getIsSearchingMailByState,
  filterNotMainFolder,
} from '../../customize';
import { MAIL_STORE_REDUX_STATE, FLOLDER, LIST_MODEL, filterTabMap, MAIL_LIST_CHOOSE_TYPE, FOLDER_EXPAND_ACCOUNT } from '../../../common/constant';
import { reducerHelper } from '@web-mail/state/slice/mailReducer/helper';
import _set from 'lodash/set';
import { getStateFromLocalStorage } from '@web-mail/hooks/useUserLocalStorageState';
import message from '@web-common/components/UI/Message/SiriusMessage';

import { apiHolder as api, apis, MailApi, MailConfApi } from 'api';
import { customerReducers } from '@web-mail/state/slice/customerMailReducer/reducers';
import { subordinateReducers } from '@web-mail/state/slice/subordinateMailReducer/reducers';
import { CustomerAsideDetail, CommonAsideDetail } from '@web-mail/state/slice/customerMailReducer/types';
import { tabId } from '@web-common/state/reducer/mailTabReducer';
import { genCustomerState } from '@web-mail/state/slice/customerMailReducer/states';
import { genSubordinateState } from '@web-mail/state/slice/subordinateMailReducer/states';
// import { sliceStateCheck } from '@web-mail/utils/slice';
import { getIn18Text } from 'api';
const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const mailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const storageApi = api.api.getDataStoreApi();

const defaultSelectedKeys: TreeSelectedKey = {
  id: FLOLDER.DEFAULT,
  accountId: getMainAccount(),
};
const defaultGuidePageStatus = (() => {
  const status = {
    1: '',
    3: '',
    '-1': '',
    '-100': '',
  };
  const key = defaultSelectedKeys.id;
  status[key] = guideConfig[key].sort[0];
  return status;
})();
const defaultGuidePage = (() => {
  const key = defaultSelectedKeys.id;
  const type = guideConfig[key].sort[0];
  return guideConfig[key].config[type];
})();

export const mainAccountState = {};

export const defaultTreeState = {
  // 邮件列表-文件夹-树形结构-list
  mailFolderTreeList: [],
  // 邮件列表-文件夹-自定义文件夹：从mailFolderTreeList过滤出的自定义文件
  // mailCustomFolderTreeList: [],
  // 邮件列表-文件夹-id2data对照map
  MailFolderTreeMap: {},
  // 邮件-文件夹树-展开的key
  expandedKeys: [FLOLDER.OTHERS, FLOLDER.STAR],
  // 文件夹-树-是否包含用户自定义文件夹
  hasCustomFolder: false,
  // 邮件-文件夹树-拖拽模式 drag | move
  // folderTreeDragModel: 'move',
  sort: 0,
  // 所属的账号=需要改为accountId
  accountId: '',
  // 邮箱类型，api层透传
  emailType: '',
  // 失效状态，api层透传
  expired: false,
  // 文件夹的全标已读状态
  allReadLoadingMap: {},
  // 邮件标签数据
  mailTagList: [],
  // agentName
  accountName: '',
};

export const defaultSelectedMailId: MailSelectedKey = {
  id: '',
  accountId: '',
};

/**
 * 获取主账号文件夹tree的状态
 */
const getMailAccountInitTreeState = () => {
  const state = cloneDeep(defaultTreeState);
  const localExpandKeys = getStateFromLocalStorage<{ [key: string]: number[] }>(FOLDER_EXPAND_ACCOUNT);
  // 根据本地存储的状态，初始化文件夹展开状态,此处只恢复主账号
  if (localExpandKeys?.main?.length && Array.isArray(localExpandKeys?.main)) {
    state.expandedKeys = [...new Set([...state.expandedKeys, ...localExpandKeys?.main])];
  }
  return state;
};

export const MailBoxInitialState: RootMailBoxReducerState = {
  /************多账号相关************/
  // 主账号的内部状态
  mainAccountState: cloneDeep(mainAccountState),
  // 子账号状态map
  childAccountStateMap: {},
  // 主账号文件夹树相关- 废弃
  // mailAccountTreeState: cloneDeep(defaultTreeState),
  // 文件夹树Map
  mailTreeStateMap: {
    // 主账号文件夹树相关
    main: getMailAccountInitTreeState(),
  },
  // 多账号，失效账号列表
  expiredAccountList: [],
  // 多账号，账号展开状态
  accountActiveKey: [],
  /************搜索相关状态************/
  // 邮件-搜索-账号
  mailSearchAccount: '',
  // 邮件-搜索-关键字
  mailSearchKey: '',
  // 搜索类型，非空为搜索模式下，normal为正常搜索，advanced为高级搜索
  mailSearching: '',
  // 邮件搜索类别对象
  mailSearchStateMap: {},
  // 邮件搜索范围
  mailSearchType: 'all',
  // 邮件搜索关键字是否需要记录
  mailSearchRecord: true,
  // 邮件搜索文件夹id数组，单文件夹只有一项，父子文件夹打平
  mailSearchFolderIds: [],
  // 邮件搜索关键字是否被记录过了（一个关键词被记录一遍后就不再记录了，除非搜索词或类别改变）
  isSearchRecorded: false,
  // 是否显示高级搜索弹窗
  advancedSearchVisible: false,
  // 邮件-高级搜索-loading状态
  advancedSearchLoading: false,
  // 高级搜索表单字段集合
  advanceSearchFromValues: {},
  // 搜索-邮件id表
  searchList: [],
  // 搜索列表-本次选中的key和默认选中的key（默认选中根据搜索结果动态变化）
  selectedSearchKeys: {},
  defaultSelectedSearchKeyMap: {},
  // 搜索列表-上部-二级tab选中
  searchListStateTab: 'ALL',
  // 搜索结果结构，作为搜索返回的只读数据，写在一个结构里
  // fid筛选文件夹id
  // filterCond文件夹外筛选条件数组
  // searchTreeList文件夹数据
  // searchStatsObj其他数据
  // searchAccount所属账号
  // searchTotal搜索总数
  searchResultObj: {
    total: 20,
  },
  extraSearchCloudMailListObj: {},
  extraSearchCloudMailListObjStatus: '',
  // 邮件-搜索-选中邮件的id
  activeSearchMailId: { ...defaultSelectedMailId },
  // 当期搜索请求的id，用于保持搜素请求的唯一性减少消耗
  searchingRequestId: null,
  /************搜索相关状态结束************/
  // 邮件标签列表-选中的标签名称
  mailTagFolderActiveKey: {
    key: null,
    accountId: '',
  },
  // 邮件实体Map
  [MAIL_STORE_REDUX_STATE]: {},
  // 邮件搜索是否处于loading（控制左侧搜索结果展示区域）
  searchLoading: true,
  // 邮件列表是否处于loading
  listLoading: true,
  // 邮件列表-文件夹-选中的key
  selectedKeys: { ...defaultSelectedKeys },
  // // 邮件列表-文件夹-树形结构-list
  // mailFolderTreeList: [],
  // // 邮件列表-文件夹-自定义文件夹：从mailFolderTreeList过滤出的自定义文件
  // mailCustomFolderTreeList: [],
  // 收信按钮-loading状态
  refreshBtnLoading: false,
  // // 邮件列表-文件夹-id2data对照map
  // MailFolderTreeMap: {},
  // // 邮件标签列表-选中的标签名称
  // mailTagFolderActiveKey: null,
  // 文件夹树-右键操作-文件夹id
  // mailFolderCmActiveId: { mailBoxId: null },
  // 是否处于拖拽模式
  isDragModel: null,
  // 邮件-文件夹-右键菜单-当前显示文件夹的id
  // folderDropDownVisiableId: null,
  // 邮件-文件夹-拖拽hover的folderId
  // folderDragHoverId: null,
  // 搜索-文件夹树-展开的key
  expandedSearchKeys: [],
  // // 邮件-文件夹树-展开的key
  // expandedKeys: [-2],
  // 邮件-邮件id列表
  mailDataList: [],
  // 邮件-刷新是否有新邮件
  refreshHasNewMail: false,
  // 邮件-邮件列表-总数
  mailTotal: 0,
  // 邮件-选中邮件map-id2mail
  // checkedMails: new Map(),
  // 邮件列表-选中的邮件idlist
  activeIds: [],
  // 通用提示弹窗是否展示-ex：删除，删除全部
  commonModalVisible: false,
  // 邮件列表-上部-二级tab选中
  mailListStateTab: 'ALL',
  // 邮件列表宽高
  scrollTop: 0,
  // // 邮件-文件夹树-拖拽模式 drag | move
  folderTreeDragModel: null,
  // 邮件-文件夹-移动弹窗-是否展示
  folderModveModalVisiable: false,
  // 邮件-文件夹-移动-正在移动的id
  folderMoveId: null,
  // 邮件-导入邮件-文件夹id
  importFolderId: null,
  // 当前邮件文件夹是否处于锁定
  mailFolderIsLock: false,
  // 邮件-移动文件夹-是否显示
  mailMoveModalVisiable: false,
  // 邮件-导入文件夹-是否显示
  mailImportModalVisible: false,
  // 邮件-移动-当前移动邮件-所属的文件夹
  mailMoveFid: null,
  // 邮件-移动-弹窗-文件夹树-选中的目标文件夹id
  mfModalSelectedFids: [],
  // 邮件-移动-弹窗-文件夹树-展开的目录ids
  mfModalExpandFids: [],
  // 邮件列表-筛选菜单
  // mailTabs: [getIn18Text("QUANBU"), getIn18Text("HONGQI"), getIn18Text("WEIDU")],
  mailTabs: filterTabMap.normal as mailListStateTabs[],
  // 邮件列表-当前选中的邮件id
  selectedMailId: { ...defaultSelectedMailId },
  // 邮件列表-当前选中的邮件MailIds
  // selectedThreadMailIds: '',
  // 当前选中邮件-所处的文件夹id
  // activeMailFid: 1,
  // 邮件-刷新按钮-是否处于loading状态
  refreshLoading: false,
  // 新邮件提醒-邮件数量
  noticeNum: 0,
  // 当前邮件目录-邮件删除后保留的天数
  keepPeriod: 30,
  // 读信页-是否处于拖动状态
  mailListResizeProcessing: false,
  // 邮件移动-移动的邮件id
  mailMoveMid: { mailId: [], accountId: '' },
  // 邮件导入-导入的邮件id
  mailImportMid: '',
  // 邮件移动-移动的邮件是否是聚合邮件
  mailMoveIsThread: false,
  // 邮件标签-添加弹窗-是否显示
  mailTagAddModalVisible: {
    accountId: '',
    visible: false,
  },
  // 多选操作-是否显示邮件多选操作面板
  mailMultPanelVisible: false,
  // 移动邮件-弹窗-显示的真实邮件数量
  mfModalReadMailNum: 0,
  // 邮件列表-首次加载-是否失败
  mailListInitIsFailed: false,
  // 对话弹窗-配置项
  dialogConfig: null,
  // 邮箱模板-静态引导页-各文件夹状态
  guidePageStatus: defaultGuidePageStatus,
  // 邮箱模板-当前展示引导页
  onGuidePage: defaultGuidePage,
  // 邮件列表-邮件菜单的显示状态
  mailListMenuVisiable: false,
  // 邮件文件夹-强化提醒的folderid list
  activeFolderList: [],
  // 是否展示聚合邮件-构建中-tip
  showThreadBuildingTip: false,
  // 是否展示性白哦联系人是否在构建中-tip
  showStarContactBuildingTip: false,
  // 是否展示邮件-全局阻塞-loading
  showGlobalLoading: false,
  // 已读未读、红旗，标签等状态修改是否展示toast
  hideMessage: false,
  // 标签修改自定义toast文案（成功）
  successMsg: '',
  // 标签修改自定义toast文案（失败）
  failMsg: '',
  // 任务邮件 0 全部 1 进行中
  // taskMailTabs: [getIn18Text("QUANBU"), getIn18Text("JINXINGZHONG")],
  //taskMailTabs: [
  // //全部
  //  { type: 'ALL', title: getIn18Text('QUANBU') },
  // //进行中
  //  { type: 'ON', title: getIn18Text('JINXINGZHONG') }
  //],
  //taskMailListStateTab: 'ALL',
  // 稍后处理
  //deferMailTabs: [
  // //全部
  //  { type: 'ALL', title: getIn18Text('QUANBU') },
  // //已逾期/今日
  //  { type: 'DEFER', title: getIn18Text('YIYUQI/JIN') }
  //],
  //deferMailListStateTab: 'DEFER',
  // 邮件列表是否展示，智能提示
  // showSmartMailboxTip: true,
  // 邮件分享到IM
  shareMail: {},
  // 邮件的mid，用于创建邮件讨论组
  shareMailMid: '',
  // 读信页-聚合邮件-子邮件列表
  readMailChildMailList: [],
  // 独立读信页-填充的邮件id
  readMailWindowActiveMailId: null,
  // 往来邮件-选中的邮件id
  mailRelateActiveMialId: null,
  // 往来邮件-邮件列表
  mailRelateMailList: [],
  // 陌生人往来邮件-选中的陌生人id
  activeStrangerIds: [],
  // 陌生人往来邮件-读信页激活的邮件id
  mailRelateStrangerActiveId: '',
  // 陌生人往来邮件-邮件列表
  mailRelateStrangeMailList: [],
  // 邮件的额外字段-缓存
  mailExcludeKeyMap: {},
  // 三栏邮件列表-邮件多选状态
  defaultMailListSelectedModel: LIST_MODEL.INIT,
  // 邮件标签列表
  // mailTagList: [],
  // 邮件操作菜单-缓存状态
  mailMenuItemState: {},

  // 邮箱快捷设置----
  // 快捷设置抽屉是否展示
  configMailShow: false,
  // 快捷设置，列表是否展示头像
  configMailListShowAvator: true,
  // 快捷设置，列表是否展示具体时间
  configMailListShowConcreteTime: false,
  // 快捷设置,列表视图：左右分栏:'1'/通栏: '2'
  configMailLayout: '1',
  // 快捷设置，列表是否展示附件
  configMailListShowAttachment: true,
  // 快捷设置，列表是否展示摘要
  configMailListShowDesc: true,
  // 快捷设置，邮件列表密度： 1：宽松。2：适中， 3，紧凑
  configMailListTightness: 2, // 默认适中
  // 邮件列表设置，支持客户邮件列表筛选，仅外贸通展示
  configMailListShowCustomerTab: true, // 默认展示
  /************ uni弹窗 邮件+1010版本后，不再使用了，稳定2个版本后删除 ************/
  uniCustomerParam: { visible: false, source: 'mailListStrangerSideBar' },
  /************ uni商机弹窗 邮件+1010版本后，不再使用了，稳定2个版本后删除 ************/
  uniOpportunityParam: { visible: false },
  /************ uni线索弹窗（新建线索，编辑线索） 邮件+1010版本后，不再使用了，稳定2个版本后删除 ************/
  uniClueParam: { visible: false },
  /************ uni线索弹窗,添加到原有客户，添加到原有线索 ************/
  uniToCustomerOrClueParam: { visible: false },
  /************ uni线索弹窗,查看线索 邮件+1010版本后，不再使用了，稳定2个版本后删除 ************/
  uniClueViewParam: { visible: false },
  // 客户邮件未读数
  unReadMap_cm: { customerMap: {}, contentMap: {} },
  // 客户侧边栏展示状态
  newGuideForCustomerAside_cm: false,
  // 右侧边栏，在我发出的邮件下，当前选中的联系人详情,在发件人不是自己的时候需要置空
  rightSideSelectedDetail: {
    email: '',
    name: '',
  },
  customer: {
    [tabId.readCustomer]: genCustomerState(),
  },
  subordinate: {
    [tabId.subordinate]: genSubordinateState(),
  },
  customerAsideDetail: {
    email: '',
    type: '',
  },
  orderDateRange: {
    endDate: '2023-01-15',
    startDate: '2022-12-17',
  },
  // 非客户侧边栏存储信息，目前只有AI查询到的智能建议信息
  commonAsideDetail: {
    aiDetailMap: {},
    aiMidMap: {},
  },
  // 实体列表
  useRealList: mailConfApi.getIsUseRealListSync(),
  realListDefaultPageSize: 20,
  realListPageSizes: ['10', '20', '30', '40', '50', '100'],
  realListCurrentPageSize: mailConfApi.getMailRealListPageSize() || 20,
  realListCurrentPage: 1,
  lastFetchFirstIndexTime: 0,
  // 星标联系人-添加
  addContactModelVisiable: false,
  // 邮件列表-是否处于远程加载中
  listIsRefresh: false,
  // 聚合邮件-是否按时间正序排列
  mergeMailOrderDesc: true,
  // 邮件多账号-别名Map
  mailAccountAliasMap: {},
};
const staticSlice = {
  doUpdateConfigMailListShowCustomerTab(state: MailBoxReducerState, action: PayloadAction<boolean>) {
    state.configMailListShowCustomerTab = action.payload;
  },
  doUpdateUseRealList(state: MailBoxReducerState, action: PayloadAction<boolean>) {
    state.useRealList = action.payload;
  },
  doUpdateRealListPageSize(state: MailBoxReducerState, action: PayloadAction<{ pageSize: number }>) {
    if (action.payload && action.payload.pageSize) {
      state.realListCurrentPageSize = action.payload.pageSize;
    }
  },
  doUpdateRealListPage(state: MailBoxReducerState, action: PayloadAction<{ page: number }>) {
    if (action.payload && action.payload.page) {
      state.realListCurrentPage = action.payload.page;
    }
  },
  /**
   * useState2ReduxMock 的默认写入reducer
   * 用于根据stateName快速设置
   */
  doUpdateAny: (state: MailBoxReducerState, action: PayloadAction<{ name: keyof MailBoxReducerState; data: any }>) => {
    const { name, data } = action.payload || {};
    if (name && state && state[name] !== undefined) {
      try {
        state[name] = data;
      } catch (e) {
        console.warn('[doUpdateAny Error]', name, e);
      }
    } else {
      console.warn('[doUpdateAny Error]', name);
    }
  },
  ...customerReducers,
  ...subordinateReducers,
  // 快捷设置，抽屉是否展示
  doUpdateConfigMailShow: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.configMailShow = action.payload;
  },
  // 设置快捷设置，列表是否展示附件
  doUpdateConfigMailListShowAttachment: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.configMailListShowAttachment = action.payload;
  },
  // 快捷设置，邮件列表密度：
  doUpdateConfigMailListTightness: (state: MailBoxReducerState, action: PayloadAction<number>) => {
    state.configMailListTightness = action.payload;
  },
  // 设置快捷设置，列表是否展示摘要
  doUpdateConfigMailListShowDesc: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.configMailListShowDesc = action.payload;
  },
  // 设置快捷设置，列表是否展示头像
  doUpdateConfigMailListShowAvator: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.configMailListShowAvator = action.payload;
  },
  // 设置快捷设置，列表是否展示具体时间
  doUpdateConfigMailListShowConcreteTime: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.configMailListShowConcreteTime = action.payload;
  },
  //
  doUpdateConfigMailLayout: (state: MailBoxReducerState, action: PayloadAction<string>) => {
    state.configMailLayout = action.payload;
  },
  // 设置搜索loading状态
  doUpdateMailSearchLoading: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.searchLoading = action.payload;
  },
  // 设置邮件列表loading状态
  doUpdateMailListLoading: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.listLoading = action.payload;
  },
  // 获取邮件标签列表
  doUpdateMailTagList: (state: MailBoxReducerState, action: PayloadAction<{ value: MailTag[]; accountId?: string }>) => {
    const { accountId, value = [] } = action.payload;
    const isMain = isMainAccount(accountId);
    if (accountId && !isMain) {
      state.mailTreeStateMap[accountId]['mailTagList'] = value;
    } else {
      state.mailTreeStateMap.main.mailTagList = value;
    }
    state.mailTreeStateMap = { ...state.mailTreeStateMap };
  },
  // 设置搜索列表-文件夹-选中的key
  doUpdateSelectedSearchKey: (state: MailBoxReducerState, action: PayloadAction<SearchSelectedKeyMap>) => {
    state.selectedSearchKeys = action.payload;
  },
  // 设置搜索列表-文件夹外其他-默认选中的key
  doUpdateDefaultSelectedSearchKeyMap: (state: MailBoxReducerState, action: PayloadAction<SearchSelectedKeyMap>) => {
    state.defaultSelectedSearchKeyMap = action.payload;
  },
  // 搜索结果
  doUpdateSearchResultObj: (state: MailBoxReducerState, action: PayloadAction<MailSearchResult>) => {
    state.searchResultObj = action.payload;
  },
  // 设置邮件列表-文件夹-选中的key
  doUpdateSelectedKey: (state: MailBoxReducerState, action: PayloadAction<TreeSelectedKey>) => {
    state.realListCurrentPage = 1;
    if (!action.payload?.accountId) {
      state.selectedKeys = {
        ...action.payload,
        accountId: getMainAccount(),
      };
    } else {
      state.selectedKeys = action.payload;
    }
  },
  // 设置任务邮件的二级标签
  doUpdateTaskMailListStateTab: (state: MailBoxReducerState, action: PayloadAction<SelectedKeysModel>) => {
    state.mailListStateTab = action.payload;
  },
  // 设置收信按钮-loading状态
  doUpdateRefershBtnLoading: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.refreshBtnLoading = action.payload;
  },
  // 更新邮件列表-文件夹-id2data对照map
  // doUpdateMailFolderTreeMap: (state: MailBoxReducerState, action: PayloadAction<object>) => {
  //   state.MailFolderTreeMap = action.payload as Record<string, MailBoxModel>;
  // },
  // 更新邮件标签列表-选中的标签名称
  doUpdateMailTagFolderActiveKey: (state: MailBoxReducerState, action: PayloadAction<{ accountId?: string; key?: string | null }>) => {
    const { accountId = '', key } = action.payload;
    state.mailTagFolderActiveKey = {
      key: key,
      accountId: accountId,
    };
  },
  // 更新是否显示高级搜索弹窗
  doUpdateAdvancedSearchVisible: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.advancedSearchVisible = action.payload;
  },
  // 更新文件夹树-右键操作-文件夹id
  // doUpdateMailFolderCmActiveID: (state: MailBoxReducerState, action: PayloadAction<mailFolderCmActiveId>) => {
  //     state.mailFolderCmActiveId = action.payload;
  // },
  // 更新是否处于拖拽模式
  // doUpdateIsDragModel: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
  //   state.isDragModel = action.payload;
  // },
  // 更新邮件-文件夹-右键菜单-是否显示
  // doUpdateFolderDropDownVisiableId: (state: MailBoxReducerState, action: PayloadAction<number | null>) => {
  //     state.folderDropDownVisiableId = action.payload;
  // },
  // 更新邮件-文件夹-拖拽hover的folderId
  // doUpdateFolderDragHoverId: (state: MailBoxReducerState, action: PayloadAction<string | null>) => {
  //     state.folderDragHoverId = action.payload;
  // },
  // 更新搜索-文件夹树-展开的key
  doUpdateExpandedSearchKeys: (state: MailBoxReducerState, action: PayloadAction<number[]>) => {
    state.expandedSearchKeys = action.payload;
  },
  // 更新搜索-文件夹树-展开的key
  doUpdateMainTreeExpandedKeys: (state: MailBoxReducerState, action: PayloadAction<number[]>) => {
    state.mailAccountTreeState.expandedKeys = action.payload;
  },
  // 更新搜索-邮件列表
  doUpdateSeatchList: (state: MailBoxReducerState, action: PayloadAction<MailEntryModel[]>) => {
    const list = formatMailDataList(action.payload);
    separateUpdateIdAndStore(state, 'searchList', list);
  },
  // 更新邮件-邮件列表
  doUpdateMailDataList: (state: MailBoxReducerState, action: PayloadAction<MailEntryModel[]>) => {
    const list = formatMailDataList(action.payload);
    separateUpdateIdAndStore(state, 'mailDataList', list);
  },
  // 更新邮件-邮件列表-总数
  doUpdateMailTotal: (state: MailBoxReducerState, action: PayloadAction<number>) => {
    state.mailTotal = action.payload;
  },
  // 更新邮件-刷新是否有新邮件
  doUpdateRefreshHasNewMail: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.refreshHasNewMail = action.payload;
  },
  // 更新邮件-选中邮件map-id2mail
  // doUpdateMailChecksMap: (state: MailBoxReducerState, action: PayloadAction<object>) => {
  //   state.checkedMails = action.payload;
  // },
  // 更新邮件列表-选中的邮件idlist
  doUpdateActiveIds: (state: MailBoxReducerState, action: PayloadAction<string[]>) => {
    state.activeIds = action.payload;
  },
  // 更新通用提示弹窗是否展示-ex：删除，删除全部
  doUpdateCommonModalVisible: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.commonModalVisible = action.payload;
  },
  // 更新邮件列表-上部-二级tab选中
  doUpdateMailListStateTab: (state: MailBoxReducerState, action: PayloadAction<mailListStateTabSelected>) => {
    state.mailListStateTab = action.payload;
  },
  // 更新邮件列表宽高设置
  doUpdateMailListScrollTop: (state: MailBoxReducerState, action: PayloadAction<number>) => {
    state.scrollTop = action.payload;
  },
  // 更新搜索列表-上部-二级tab选中
  doUpdateSearchListStateTab: (state: MailBoxReducerState, action: PayloadAction<mailListStateTabSelected>) => {
    state.searchListStateTab = action.payload;
  },
  // 更新搜邮件-文件夹树-拖拽模式
  doUpdateFolderTreeDragModel: (
    state: MailBoxReducerState,
    action: PayloadAction<{
      mailId: string;
      accountId: string;
      folderId: number;
    }>
  ) => {
    state.folderTreeDragModel = action.payload;
  },
  // 邮件-文件夹-移动弹窗-是否展示
  doUpdateFolderModveModalVisiable: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.folderModveModalVisiable = action.payload;
  },
  // 邮件-文件夹-移动-正在移动的id
  doUpdateFolderMoveId: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    state.folderMoveId = action.payload;
  },
  // 邮件-文件夹-邮件导入-导入文件夹ID
  doUpdateImportFolderId: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    state.importFolderId = action.payload;
  },
  // 邮件-文件夹-移动-正在移动的id
  doUpdateMailCustomFolderTreeList: () => {
    // 该值应该由文件夹treeList 过滤而来 不需要主动设置
    // 如有需要主动设置，注意走treeList的包装逻辑，添加_state 等内部字段
    // state.mailCustomFolderTreeList = action.payload
  },
  // 邮件中正在搜索账号
  doUpdateMailSearchAccount: (state: MailBoxReducerState, action: PayloadAction<string>) => {
    state.mailSearchAccount = action.payload;
  },
  // 更新邮件-搜索-关键字
  doUpdateMailSearchKey: (state: MailBoxReducerState, action: PayloadAction<string>) => {
    state.mailSearchKey = action.payload;
  },
  // 更新邮件-搜索-范围
  doUpdateMailSearchType: (state: MailBoxReducerState, action: PayloadAction<MailSearchTypes>) => {
    state.mailSearchType = action.payload;
  },
  // 更新邮件-搜索-类型
  doUpdateMailSearching: (state: MailBoxReducerState, action: PayloadAction<string>) => {
    state.mailSearching = action.payload;
  },
  // 更新邮件-搜索-方式Map
  doUpdateMailSearchStateMap: (state: MailBoxReducerState, action: PayloadAction<MailSearchStatesMap>) => {
    state.mailSearchStateMap = action.payload;
  },
  // 更新邮件-搜索-是否记录
  doUpdateMailSearchRecord: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.mailSearchRecord = action.payload;
  },
  // 更新邮件-搜索-选中文件夹包含的所有文件夹id
  doUpdateMailSearchFolderIds: (state: MailBoxReducerState, action: PayloadAction<number[]>) => {
    state.mailSearchFolderIds = action.payload;
  },
  // 邮件-搜索-选中的邮件id
  doUpdateActiveSearchMailId: (state: MailBoxReducerState, action: PayloadAction<MailSelectedKey>) => {
    state.activeSearchMailId = action.payload;
  },
  // 更新-当前邮件文件夹是否处于锁定
  doUpdateMailFolderIsLock: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.mailFolderIsLock = action.payload;
  },
  // 更新-邮件-高级搜索-loading状态
  doUpdateAdvancedSearchLoading: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.advancedSearchLoading = action.payload;
  },
  // 更新-邮件-移动文件夹-是否显示
  doUpdateMailMoveModalVisiable: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.mailMoveModalVisiable = action.payload;
  },
  // 更新-邮件-移动文件夹-（用于邮件导入）
  doUpdateMailImportModalVisible: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.mailImportModalVisible = action.payload;
  },
  // 更新-邮件-移动文件夹-是否显示
  doUpdateMailMoveFid: (state: MailBoxReducerState, action: PayloadAction<number | null>) => {
    state.mailMoveFid = action.payload;
  },
  // 更新-邮件-移动-弹窗-文件夹树-选中的目标文件夹id
  doUpdateMfModalSelectedFids: (state: MailBoxReducerState, action: PayloadAction<number[]>) => {
    state.mfModalSelectedFids = action.payload;
  },
  // 更新-邮件-移动-弹窗-文件夹树-展开的目录ids
  doUpdateMfModalExpandFids: (state: MailBoxReducerState, action: PayloadAction<number[]>) => {
    state.mfModalExpandFids = action.payload;
  },
  // 更新-邮件列表-筛选菜单
  doUpdateMailTabs: (state: MailBoxReducerState, action: PayloadAction<mailListStateTabs[]>) => {
    state.mailTabs = action.payload;
  },
  // 更新-邮件列表-当前选中的邮件id
  doUpdateSelectedMail: (state: MailBoxReducerState, action: PayloadAction<MailSelectedKey>) => {
    state.selectedMailId = action.payload;
  },
  // 更新- 邮件列表 - 当前选中的聚合邮件Ids corp邮箱需要
  // doUpdateThreadMailIds: (state: MailBoxReducerState, action: PayloadAction<Array<string>>) => {
  //   state.selectedThreadMailIds = action.payload;
  // },
  // 更新-当前选中邮件-所处的文件夹id
  // doUpdateActiveMailFid: (state: MailBoxReducerState, action: PayloadAction<any>) => {
  //   state.activeMailId = action.payload;
  // },
  // 更新-邮件-刷新按钮-是否处于loading状态
  doUpdateRefreshLoading: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.refreshLoading = action.payload;
  },
  // 更新-新邮件提醒-邮件数量
  doUpdateNoticeNum: (state: MailBoxReducerState, action: PayloadAction<number>) => {
    state.noticeNum = action.payload;
  },
  // 当前邮件目录-邮件删除后保留的天数
  doUpdateKeepPeriod: (state: MailBoxReducerState, action: PayloadAction<number>) => {
    state.keepPeriod = action.payload;
  },
  // 读信页-是否处于拖动状态
  doUpdateMailListResizeProcessing: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.mailListResizeProcessing = action.payload;
  },
  // 邮件移动-移动的邮件id
  doUpdateMailMoveMid: (state: MailBoxReducerState, action: PayloadAction<MailMoveKeys>) => {
    state.mailMoveMid = action.payload;
  },
  // 邮件移动-移动的邮件id
  doUpdateMailImportMid: (state: MailBoxReducerState, action: PayloadAction<string | string[]>) => {
    state.mailImportMid = action.payload;
  },
  // 邮件移动-移动的邮件是否是聚合邮件
  doUpdateMailMoveIsThread: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.mailMoveIsThread = action.payload;
  },
  // 邮件标签-添加弹窗-是否显示
  doUpdateMailTagAddModalVisible: (
    state: MailBoxReducerState,
    action: PayloadAction<{
      accountId?: string;
      visible: boolean;
    }>
  ) => {
    state.mailTagAddModalVisible = action.payload;
  },
  // 多选操作-是否显示邮件多选操作面板
  doUpdateMailMultPanelVisible: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.mailMultPanelVisible = action.payload;
  },
  // 更新 移动邮件-弹窗-显示的真实邮件数量
  doUpdateMfModalReadMailNum: (state: MailBoxReducerState, action: PayloadAction<number>) => {
    state.mfModalReadMailNum = action.payload;
  },
  // 邮件列表-首次加载-是否失败
  doUpdateMailListInitIsFailed: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.mailListInitIsFailed = action.payload;
  },
  // 对话弹窗配置项
  doUpdatedialogConfig: (state: MailBoxReducerState, action: PayloadAction<object | null>) => {
    state.dialogConfig = action.payload;
  },
  // 邮件列表-右键菜单-是否显示
  doUpdateMailListMenuVisiable: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.mailListMenuVisiable = action.payload;
  },
  // 邮件文件夹-强化提醒的folderid list
  doUpdateActiveFolderList: (state: MailBoxReducerState, action: PayloadAction<number[]>) => {
    state.activeFolderList = action.payload;
  },
  // 是否展示聚合邮件-构建中-tip
  doUpdateShowTbTip: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.showThreadBuildingTip = action.payload;
  },
  // 是否展示邮件-全局阻塞-loading
  doUpdateShowGlobalLoading: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.showGlobalLoading = action.payload;
  },
  // 更新高级搜索-表单字段
  doUpdateAdvanceSearchFromValues: (state: MailBoxReducerState, action: PayloadAction<fromValues>) => {
    state.advanceSearchFromValues = action.payload;
  },
  doUpdateIsSearchRecordeds: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.isSearchRecorded = action.payload;
  },
  doUpdateMsgHideMessage: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.hideMessage = action.payload;
  },
  doUpdateMsgSuccessStr: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.successMsg = action.payload;
  },
  doUpdateMsgFailStr: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.failMsg = action.payload;
  }, // 合并处理
  //doUpdateTaskMailTabs: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
  //  state.taskMailTabs = action.payload;
  //},
  //doUpdateTaskMailListStateTab: (state: MailBoxReducerState, action: PayloadAction<taskMailListStateTabSelected>) => {
  //  state.taskMailListStateTab = action.payload;
  //},
  //doUpdateDeferMailTabs: (state: MailBoxReducerState, action: PayloadAction<deferMailListTabs[]>) => {
  //  state.deferMailTabs = action.payload;
  //},
  //doUpdateDeferMailListStateTab: (state: MailBoxReducerState, action: PayloadAction<deferMailListStateTabSelected>) => {
  //  state.deferMailListStateTab = action.payload;
  //},
  // 17版本智能模式下线
  // doUpdateShowSmartMailboxTip: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
  //   state.showSmartMailboxTip = action.payload;
  // },
  doUpdateShareMail: (state: MailBoxReducerState, action: PayloadAction<MailEntryModel>) => {
    state.shareMail = action.payload;
  },
  doUpdateShareMailMid: (state: MailBoxReducerState, action: PayloadAction<string>) => {
    state.shareMailMid = action.payload;
  },
  doUpdateReadMailWindowActiveMailId: (state: MailBoxReducerState, action: PayloadAction<string | null>) => {
    state.readMailWindowActiveMailId = action.payload;
  },
  doUpdateMailRelateActiveMialId: (state: MailBoxReducerState, action: PayloadAction<string | null>) => {
    state.mailRelateActiveMialId = action.payload;
  },
  doUpdateMailRelateStrangerActiveId: (state: MailBoxReducerState, action: PayloadAction<string | null>) => {
    state.mailRelateStrangerActiveId = action.payload;
  },
  doUpdateActiveStrangerIds: (state: MailBoxReducerState, action: PayloadAction<string[]>) => {
    state.activeStrangerIds = action.payload;
  },
  doUpdateMailRelateMailList: (state: MailBoxReducerState, action: PayloadAction<string[]>) => {
    state.mailRelateMailList = action.payload;
  },
  doUpdateMailListSelectedModel: (state: MailBoxReducerState, action: PayloadAction<LIST_MODEL>) => {
    state.defaultMailListSelectedModel = action.payload;
  },
  doUpdateListIsRefresh: (state: MailBoxReducerState, action: PayloadAction<boolean>) => {
    state.listIsRefresh = action.payload;
  },
  // 分账号修改文件夹状态
  doUpdateMailTreeState: (state: MailBoxReducerState, action: PayloadAction<{ accountId?: string; name: string; value: any }>) => {
    const { accountId, name, value } = action.payload;
    const isMain = isMainAccount(accountId);
    // 非主文件夹
    if (accountId && !isMain) {
      // 如果是写入文件夹，则级联计算衍生变量
      if (name === 'mailFolderTreeList') {
        if (state.mailTreeStateMap[accountId]?.MailFolderTreeMap && state.mailTreeStateMap[accountId]?.hasCustomFolder) {
          const _value = filterNotMainFolder(value);
          state.mailTreeStateMap[accountId].mailFolderTreeList = _value;
          state.mailTreeStateMap[accountId].MailFolderTreeMap = getTreeId2Node(_value);
          state.mailTreeStateMap[accountId].hasCustomFolder = _value.some((item: MailBoxModel) => item?.entry?.mailBoxId >= 100);
        }
      } else if (name == 'expandedKeys') {
        state.mailTreeStateMap[accountId][name] = value.filter(
          (item: number) => item != FLOLDER.TASK && item != FLOLDER.WAITINGISSUE && item != FLOLDER.READYISSUE && item != FLOLDER.DEFER
        );
      } else if (name == 'remKey') {
        delete state.mailTreeStateMap[accountId];
      }
    } else {
      // 主文件夹
      if (name === 'mailFolderTreeList') {
        if (state.mailTreeStateMap.main.MailFolderTreeMap && state.mailTreeStateMap.main.hasCustomFolder) {
          state.mailTreeStateMap.main.mailFolderTreeList = value;
          state.mailTreeStateMap.main.MailFolderTreeMap = getTreeId2Node(value);
          state.mailTreeStateMap.main.hasCustomFolder = value.some((item: MailBoxModel) => item?.entry?.mailBoxId >= 100);
        }
      } else if (name == 'expandedKeys') {
        state.mailTreeStateMap.main[name] = value;
      }
    }
    // 将expandedKeys存储到localStorage
    if (name == 'expandedKeys') {
      try {
        // 从mailTreeStateMap 中过滤出expandedKeys并保持结构
        const localCace: {
          [key: string]: number[];
        } = {};
        for (let key in state.mailTreeStateMap) {
          localCace[key] = state.mailTreeStateMap[key].expandedKeys;
        }
        const serializedState = JSON.stringify(localCace);
        storageApi.putSync(FOLDER_EXPAND_ACCOUNT, serializedState);
      } catch (e) {
        console.error('[Error thunk FOLDER_EXPAND_ACCOUNT]', e);
      }
    }
    state.mailTreeStateMap = { ...state.mailTreeStateMap };
  },
  // 更新失效账号列表
  doUpdateExpiredAccountList: (state: MailBoxReducerState, action: PayloadAction<string[]>) => {
    state.expiredAccountList = action.payload;
  },
  // 更新多账号，账号展开状态
  doUpdateAccountActiveKey: (state: MailBoxReducerState, action: PayloadAction<string[]>) => {
    state.accountActiveKey = action.payload;
  },
  // todo: 临时处理
  reseOnSearchChange: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const { mailSearchStateMap } = state;
    if (Object.values(mailSearchStateMap).some(item => item === 'server')) {
      // setCurrentAccount();
      mailApi.doClearSearchCache();
    }
  },
  resetExtraSearchCloudMailList: (state: MailBoxReducerState) => {
    state.extraSearchCloudMailListObj = {};
    state.extraSearchCloudMailListObjStatus = '';
  },
  // todo: 临时处理
  onSearchMailUpdateTreeStateMap: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const { mailSearchStateMap, mailSearching } = state;
    const { account, value } = action.payload;
    state.mailSearchAccount = account;
    state.mailSearchKey = value;
    state.mailSearching = 'normal';
    state.mailSearchStateMap = {
      ...mailSearchStateMap,
      // 非高级搜索状态且非重置某个账号搜索时，重新发起本地搜索，不管上一次搜索状态是什么
      [account]: mailSearchStateMap[account] || 'local',
    };
  },
  // 搜索云端之前的数据处理
  beforeSearchServer: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const { defaultSelectedSearchKeyMap, selectedSearchKeys, mailSearchStateMap } = state;
    const { account } = action.payload;
    // 更新当前账号搜索类型为云端搜索
    state.mailSearchStateMap = {
      ...mailSearchStateMap,
      [account]: 'server',
    };
    // 更换为云端搜索，清除该账号的默认选中和当前选中记录数据
    const defaultSelectedKey = { ...defaultSelectedSearchKeyMap };
    delete defaultSelectedKey[account];
    const selectedKeys = { ...selectedSearchKeys };
    delete selectedKeys[account];
    state.selectedSearchKeys = selectedKeys;
    state.defaultSelectedSearchKeyMap = defaultSelectedKey;
    state.mailSearchAccount = account;
    state.mailSearchFolderIds = [];
  },
  // 带参改变state
  doUpdateStateByURL: (state: MailBoxReducerState, action: PayloadAction<{ keyPath: string; value: any } | { keyPath: string; value: any }[]>) => {
    const payload = action.payload;
    if (payload) {
      if (Array.isArray(payload)) {
        // 批量写回
        const list = payload;
        list.forEach(item => {
          const { keyPath, value } = item || {};
          _set(state, keyPath, value);
        });
      } else {
        // 写回单个变量
        const { keyPath, value } = payload;
        // name有可能是深层的路径
        _set(state, keyPath, value);
        // state[name] = value;
      }
    }
  },
};
const logicSlice = {
  // 切换文件夹
  doSwitchFolder: (state: MailBoxReducerState, action: PayloadAction<TreeSelectedKey>) => {
    state.realListCurrentPage = 1;
    const selectd = action.payload;
    const isSearching = getIsSearchingMailByState(state);
    // 非搜索状态下，如果文件夹id和账号和之前都不同，则更新
    if (!isSearching && (selectd.id !== state.selectedKeys.id || selectd.accountId !== state.selectedKeys.accountId)) {
      state.selectedKeys = {
        id: selectd.id,
        accountId: selectd.accountId,
        authAccountType: selectd.authAccountType,
      };
      // state.checkedMails = new Map();
      state.listLoading = true;
      state.mailListStateTab = 'ALL';
    }
    // 搜索状态下，如果选中和之前不同，则更新
    if (isSearching) {
      state.listLoading = true;
      state.searchListStateTab = 'ALL';
    }
    /**
     * 1:收件箱 3:发件箱 -1:红旗邮件 -100:其他文件夹
     * 引导页循环展示
     */
    const key = selectd.id;
    let onKey;
    if ([FLOLDER.DEFAULT, FLOLDER.SENT, FLOLDER.REDFLAG].indexOf(key) !== -1) {
      onKey = key.toString();
    } else {
      onKey = '-100';
    }
    const onStatus = state.guidePageStatus[onKey];
    const onSort = guideConfig[onKey].sort;
    const nextStatus = guideConfig[onKey].sort[(onSort.indexOf(onStatus) + 1) % onSort.length];
    state.guidePageStatus[onKey] = nextStatus;
    state.onGuidePage = guideConfig[onKey].config[nextStatus];
    state.mailTagFolderActiveKey = {
      accountId: '',
      key: '',
    };
    state.scrollTop = 0;
  },
  /*
   *  设置邮件列表-文件夹-树形结构-list
   *  进行包装，添加UI状态字段
   *  UI状态字段用于记录文件夹编辑，新增等中间状态
   *  _state： DEFAULT 展示    ADD 新增  UPDATE 更新
   */
  // doUpdateMailTreeList: (state: MailBoxReducerState, action: PayloadAction<MailBoxModel[]>) => {
  //   if (action.payload) {
  //     // const packageTree = treeReplaceDFS(action.payload, (node, { deep }) => {
  //     //   node.entry._state = FolderTreeEditState.DEFAULT;
  //     //   node.entry._deep = deep;
  //     //   return node;
  //     // });
  //     state.mailFolderTreeList = action.payload;
  //     // 构造treeMap
  //     state.MailFolderTreeMap = getTreeId2Node(action.payload);
  //     // 过滤出自定义文件夹列表并缓存
  //     // state.mailCustomFolderTreeList = getChildTreeByRule(packageTree, node => isCustomFolder(node.entry.mailBoxId));
  //   }
  // },
  // 邮件操作检测-如果操作的是多选邮件-取消多选态
  mailOperCheck: (state: MailBoxReducerState, action: PayloadAction<any>) => {
    const id = action.payload;
    if (mailIdinList(id, state.activeIds)) {
      state.activeIds = [];
    }
  },
  // 文件夹变化后，重置邮件列表及文件夹状态
  resetMailList: (state: MailBoxReducerState) => {
    state.activeIds = [];
    // state.activeMailFid = 1;
    state.selectedMailId = {
      ...defaultSelectedMailId,
    };
  },
  // 选中当前id的下一封邮件
  activeNextMailById: (state: MailBoxReducerState, action: PayloadAction<string | string[]>) => {
    const mailId = action.payload;
    const { searchList, mailDataList, selectedMailId, activeSearchMailId } = state;
    const isSearching = getIsSearchingMailByState(state);
    const mailIdList = isSearching ? searchList : mailDataList;
    const mailList = getMailListByIdFromStore(mailIdList, state.mailEntities);
    const activeMialId = isSearching ? activeSearchMailId.id : selectedMailId.id;
    const ids = typeof mailId === 'string' ? [mailId] : mailId;
    const nextMailId = getCanActiveMailId(mailList, ids, activeMialId);
    if (nextMailId) {
      state.activeIds = [nextMailId];
      if (isSearching) {
        state.activeSearchMailId = {
          id: nextMailId,
          accountId: '',
        };
      } else {
        state.selectedMailId = {
          id: nextMailId,
          accountId: '',
        };
      }
    } else {
      state.activeIds = [];
      if (isSearching) {
        state.activeSearchMailId = {
          id: '',
          accountId: '',
        };
      } else {
        state.selectedMailId = {
          id: '',
          accountId: '',
        };
      }
    }
  },
  // 显示邮件移动弹窗
  showMailMoveModal: (state: MailBoxReducerState, action: PayloadAction<showMailMoveModalParam>) => {
    const { mailId, folderId, accountId } = action.payload || {};
    const { mailEntities } = state;
    const key = Array.isArray(mailId) ? mailId[0] : mailId;
    if (mailId && folderId != null) {
      state.mailMoveFid = folderId;
      state.mailMoveMid = {
        mailId: mailId,
        accountId: accountId || (mailEntities[key] ? mailEntities[key]?._account : ''),
      };
      state.mfModalSelectedFids = [];
      state.mfModalExpandFids = [-2];
      state.mailMoveModalVisiable = true;
    }
  },
  // 显示导入邮件弹窗
  showMailImportModal: (state: MailBoxReducerState, action: PayloadAction<showMailImportModalParam>) => {
    const { mailId } = action.payload || {};
    if (mailId) {
      state.mailMoveFid = -100001;
      state.mailImportMid = mailId;
      state.mfModalSelectedFids = [];
      state.mfModalExpandFids = [-2];
      state.mailImportModalVisible = true;
    }
  },
  // 设置邮件为replay状态
  doMailReplay: (state: MailBoxReducerState, action: PayloadAction<doMailReplay>) => {
    const { id, replayed, forwarded } = action.payload || {};
    const mail = state.mailEntities[id];
    if (mail) {
      mail.entry.replayed = replayed;
      mail.entry.forwarded = forwarded;
    }
  },
  // 邮件-搜索关键词为空
  doResetMailSearch: (state: MailBoxReducerState) => {
    state.mailSearching = '';
    state.mailSearchStateMap = {};
    state.selectedSearchKeys = {};
    state.defaultSelectedSearchKeyMap = {};
    state.expandedSearchKeys = [-2];
    state.listLoading = false;
    state.advanceSearchFromValues = {};
    state.searchResultObj = {} as MailSearchResult;
    state.mailSearchAccount = '';
    state.searchList = [];
    state.searchListStateTab = 'ALL' as mailListStateTabSelected;
    state.mailSearchKey = '';
    // advancedSearchForm.resetFields();
  },
  doMailDragStart: (state: MailBoxReducerState, action: PayloadAction<{ mailId: string; accountId: string; folderId: number }>) => {
    state.folderTreeDragModel = action.payload;
    state.isDragModel = 'mail';
  },
  doMailDragEnd: (state: MailBoxReducerState) => {
    state.folderTreeDragModel = null;
    state.isDragModel = null;
  },
  /**
   *  处理邮件状态的反向变更
   *  warn: 不要在api层的状态同步中弹出toast，这会造成多个窗口都出现该toast
   *  todo: 反向回调的消息中应该都是有账户id的，综合判断
   */
  doMailOperation: (state: MailBoxReducerState, action: PayloadAction<SystemEvent<any>>) => {
    const event = action.payload;
    const { eventData, eventStrData, _account } = event;
    const { selectedKeys, selectedMailId, hideMessage, successMsg, failMsg } = state;
    const isSearching = getIsSearchingMailByState(state);
    let list = getMailListByIdFromStore(isSearching ? state.searchList : state.mailDataList, state.mailEntities);
    if (eventStrData === 'redFlag') {
      const { id, mark } = eventData.params;
      const key = typeof id === 'string' || typeof id === 'number' ? id : id.join(',');
      const ids = typeof id === 'string' || typeof id === 'number' ? [id] : id;
      if (eventData.status === 'success') {
        // !hideMessage && reduxMessage.success({
        //   content: mark ? '标为红旗成功' : '取消红旗成功',
        //   duration: 1,
        //   key,
        // });
        // 当处于当前账号的红旗邮件分类下时，过滤取消红旗的列表
        if (selectedKeys && selectedKeys.id === FLOLDER.REDFLAG && !mark && _account == selectedKeys.accountId) {
          list = list.filter(item => !ids.includes(item.entry.id));
          // 如果被取消的邮件处于选中状态，则取消选中态
          if (selectedMailId.id && ids.includes(selectedMailId.id)) {
            // todo:代码重复，待重构
            const { searchList, mailDataList, activeSearchMailId } = state;
            const mailList = isSearching ? searchList : mailDataList;
            const activeMialId = isSearching ? activeSearchMailId.id : selectedMailId.id;
            const nextMailId = getCanActiveMailId(getMailListByIdFromStore(mailList, state.mailEntities), ids, activeMialId);
            if (nextMailId) {
              state.activeIds = [nextMailId];
              if (isSearching) {
                state.activeSearchMailId = {
                  id: nextMailId,
                  accountId: '',
                };
              } else {
                state.selectedMailId = {
                  id: nextMailId,
                  accountId: '',
                };
              }
            } else {
              state.activeIds = [];
              if (isSearching) {
                state.activeSearchMailId = {
                  id: '',
                  accountId: '',
                };
              } else {
                state.selectedMailId = {
                  id: '',
                  accountId: '',
                };
              }
            }
          }
        }
        // 成功后根据事件同步一次mailEntity,处理高级搜索邮件result不存在的情况
        if (!eventData.result || eventData.result.size === 0) {
          reducerHelper.updateMailEntityByEvent(state.mailEntities, 'redFlag', eventData);
        }
      } else if (eventData.status === 'local' || eventData.status === 'fail') {
        reducerHelper.updateMailEntity(state.mailEntities, 'redFlag', eventData.result);
      }
      // if (eventData.status === 'fail' && !hideMessage) {
      //   reduxMessage.success({
      //     content: mark ? '标为红旗失败' : '取消红旗失败',
      //     duration: 1,
      //     key,
      //   });
      // }
    } else if (eventStrData === 'preferred') {
      const { id, mark } = eventData.params;
      const key = typeof id === 'string' || typeof id === 'number' ? id : id.join(',');
      if (eventData.status === 'success') {
        // !hideMessage && reduxMessage.success({
        //   content: mark ? '可以在优先处理中查看' : '已从优先处理中移除',
        //   duration: 1,
        //   key,
        // });
      } else if (eventData.status === 'local' || eventData.status === 'fail') {
        reducerHelper.updateMailEntity(state.mailEntities, 'preferred', eventData.result);
      }
      if (eventData.status === 'fail') {
        // !hideMessage && reduxMessage.success({
        //   content: mark ? '设为优先失败' : '取消优先失败',
        //   duration: 1,
        //   key,
        // });
      }
    } else if (eventStrData === 'read') {
      const { id, mark } = eventData.params;
      const key = typeof id === 'string' || typeof id === 'number' ? id : id.join(',');
      if (eventData.status === 'success') {
        // !hideMessage && reduxMessage.success({
        //   content: mark ? '标记已读成功' : '标记未读成功',
        //   duration: 1,
        //   key,
        // });

        // 成功后根据事件同步一次mailEntity,处理高级搜索邮件result不存在的情况
        if (!eventData.result || eventData.result.size === 0) {
          reducerHelper.updateMailEntityByEvent(state.mailEntities, 'read', eventData);
        }
      } else if (eventData.status === 'local' || eventData.status === 'fail') {
        reducerHelper.updateMailEntity(state.mailEntities, 'read', eventData.result);
      } else if (eventData.status === 'start') {
        // start 阶段就改变 redux 中的已读状态
        const simpleResult = new Map();
        simpleResult.set(id, { readStatus: mark ? 'read' : 'unread' });
        console.log('zzzzzzzh simpleResult', simpleResult);
        reducerHelper.updateMailEntity(state.mailEntities, 'read', simpleResult);
      }
      if (eventData.status === 'fail') {
        // !hideMessage && reduxMessage.success({
        //   content: mark ? '标记已读失败' : '标记未读失败',
        //   duration: 1,
        //   key,
        // });
      }
    } else if (eventStrData === 'tag') {
      const { add, delete: _delete, isNewTag } = eventData.params;
      const tagNames = add || _delete || [];
      const _key = tagNames.join(',');
      if (eventData.status === 'success') {
        // const addTip = isNewTag ? '新建并标记成功' : '打标签成功';
        // reduxMessage.success({ content: successMsg || (add ? addTip : '取消标签成功'), duration: 1, key: _key });
        // setTimeout(() => {
        //   mailManagerApi.requestTaglist();
        // }, 2000);

        // 成功后根据事件同步一次mailEntity,处理高级搜索邮件result不存在的情况
        if (!eventData.result || eventData.result.size === 0) {
          reducerHelper.updateMailEntityByEvent(state.mailEntities, 'tag', eventData);
        }
      } else if (eventData.status === 'local' || eventData.status === 'fail') {
        reducerHelper.updateMailEntity(state.mailEntities, 'tag', eventData.result);
      }
      // if (eventData.status === 'fail' && !hideMessage) {
      //   reduxMessage.error({ content: failMsg || (add ? '打标签失败' : '取消标签失败'), duration: 1, key: _key });
      // }
    } else if (eventStrData === 'reply') {
      if (eventData.status === 'local' || eventData.status === 'success' || eventData.status === 'fail') {
        reducerHelper.updateMailEntity(state.mailEntities, 'reply', eventData.result);
      }
    } else if (eventStrData === 'defer') {
      // 邮件待办 稍后处理
      if (eventData.status === 'local' || eventData.status === 'fail') {
        reducerHelper.updateMailEntity(state.mailEntities, 'defer', eventData.result);
      } else if (eventData.status === 'success') {
        if (!eventData.result || eventData.result.size === 0) {
          reducerHelper.updateMailEntityByEvent(state.mailEntities, 'defer', eventData);
        }
      }
    } else if (eventStrData === 'completeTrust') {
      reducerHelper.updateMailEntity(state.mailEntities, 'suspiciousSpam', eventData.result);
    } else if (eventStrData === 'requestReadReceiptLocal') {
      if (eventData.result) {
        reducerHelper.updateMailEntity(state.mailEntities, 'requestReadReceiptLocal', eventData.result);
      }
    } else if (eventStrData === 'memo') {
      if (eventData.result) {
        reducerHelper.updateMailEntity(state.mailEntities, 'memo', eventData.result);
      }
    }
  },
  // 处理邮件列表中的任务状态变更
  doTaskMailOperation: (state: MailBoxReducerState, action: PayloadAction<SystemEvent<any>>) => {
    const event = action.payload;
    const { eventData, eventStrData } = event;
    const { taskMailList } = eventData;
    const isSearching = getIsSearchingMailByState(state);
    let list = getMailListByIdFromStore(isSearching ? state.searchList : state.mailDataList, state.mailEntities);
    if (eventStrData === 'refreshTaskList') {
      list.forEach(item => {
        const isChange = item.taskId && taskMailList.get(item.taskId);
        if (isChange) {
          item.taskInfo = taskMailList.get(item.taskId);
        }
      });
    }
  },
  // 用于useMailStore hook 的状态回写
  doUpdateMailId: (
    state: MailBoxReducerState,
    action: PayloadAction<{
      stateName: 'mailDataList' | 'searchList';
      mailList: MailEntryModel[];
      sliceId?: string;
      type?: EdmMailKeys;
    }>
  ) => {
    const { sliceId = '', stateName = '', mailList = [], type } = action.payload;
    const targetState = stateName && sliceId && type ? state[type][sliceId] : state;
    if (stateName && targetState[stateName as 'mailDataList'] != null && mailList) {
      const idList: string[] = [];
      const idMap: { [id: string]: boolean } = {};
      // 需要对id列表进行去重，兜底保证邮件不会重复
      mailList.forEach(mail => {
        const mailId = mail?.entry?.id;
        if (mailId && !idMap[mailId]) {
          idMap[mailId] = true;
          idList.push(mailId);
        }
      });
      if (sliceId && type && state[type][sliceId]) {
        state[type][sliceId][stateName as 'mailDataList'] = idList;
      } else {
        state[stateName] = idList;
      }
      updateMailStore(state, mailList);
    }
  },
  // 写入邮件到mailEntities
  updateMailEntities(
    state: MailBoxReducerState,
    action: PayloadAction<{
      mailList: MailEntryModel[];
    }>
  ) {
    if (state[MAIL_STORE_REDUX_STATE]) {
      const { mailList = [] } = action.payload;
      updateMailStore(state, mailList);
    }
  },
  // 写入邮件到mailEntities-无融合过程-废弃
  updateMailEntitiesNoMerge(
    state: MailBoxReducerState,
    action: PayloadAction<{
      mailList: MailEntryModel[];
    }>
  ) {
    if (state[MAIL_STORE_REDUX_STATE]) {
      const { mailList = [] } = action.payload;
      updateMailStoreNoMerge(state, mailList);
    }
  },
  // 区分字段融合到mailEntities中
  updateMailEntitiesExclude(
    state: MailBoxReducerState,
    action: PayloadAction<{
      mailList: MailEntryModel[];
      exclude: string[];
    }>
  ) {
    if (state[MAIL_STORE_REDUX_STATE]) {
      const { mailList = [], exclude } = action.payload;
      updateMailStore(state, mailList, exclude);
    }
  },
  // 触发邮件列表重新渲染
  reDrawMailList(state: MailBoxReducerState) {
    try {
      state.scrollTop = state.scrollTop % 2 === 0 ? state.scrollTop + 1 : state.scrollTop - 1;
    } catch (e) {
      console.error('[reDrawMailList err]', e);
    }
  },
  // useState2ReduxByAccount 的分 account 状态回写
  setStateByAccount(
    state: MailBoxReducerState,
    action: PayloadAction<{
      stateName: string;
      payload: any;
    }>
  ) {
    const accountId = state.selectedKeys.accountId;
    const { stateName, payload } = action.payload;
    // todo: 如果账号等于主账号
    if (!accountId) {
      state.mainAccountState[stateName] = payload;
    } else {
      // todo: 需要做错误兜底
      state.childAccountStateMap[accountId][stateName] = payload;
    }
  },
  // 更新tree的全标已读loading状态
  updateAllReadLoading(
    state: MailBoxReducerState,
    action: PayloadAction<{
      accountId?: string;
      folderId: string;
      loading: boolean;
    }>
  ) {
    const { folderId, loading, accountId } = action.payload;
    if (isMainAccount(accountId)) {
      if (state.mailTreeStateMap?.main?.allReadLoadingMap) {
        const loadingMap = {
          ...(state.mailTreeStateMap?.main?.allReadLoadingMap || {}),
        };
        loadingMap[folderId] = loading;
        state.mailTreeStateMap.main.allReadLoadingMap = loadingMap;
      }
    } else {
      if (state.mailTreeStateMap[accountId]?.allReadLoadingMap) {
        const loadingMap = {
          ...(state.mailTreeStateMap[accountId]?.allReadLoadingMap || {}),
        };
        loadingMap[folderId] = loading;
        state.mailTreeStateMap[accountId].allReadLoadingMap = loadingMap;
      }
    }
  },
  // useTreeState2ReduxByAccount 的状态回写reducer - 已废弃
  // setMailTreeStateByAccount(
  //   state: MailBoxReducerState,
  //   action: PayloadAction<{
  //     stateName: string;
  //     payload: any;
  //   }>
  // ) {
  //   const accountId = state.selectedKeys.accountId;
  //   const { stateName, payload } = action.payload;
  //   // todo: 如果账号等于主账号
  //   if (!accountId) {
  //     state.mailTreeStateMap.main[stateName] = payload;
  //   } else {
  //     // todo: 需要做错误兜底
  //     state.mailTreeStateMap[accountId][stateName] = payload;
  //   }
  // },
  doUpdateOrderDateRange: (state: OrderDateRange, action: PayloadAction<{ startDate: string; endDate: string }>) => {
    state.orderDateRange = action.payload;
  },
  updateCustomerAsideDetail: (state: MailBoxReducerState, action: PayloadAction<Partial<CustomerAsideDetail>>) => {
    state.customerAsideDetail = {
      ...state.customerAsideDetail,
      ...action.payload,
    };
  },
  updateCommonAsideDetail: (state: MailBoxReducerState, action: PayloadAction<Partial<CommonAsideDetail>>) => {
    const { aiDetailMap, aiMidMap } = state.commonAsideDetail;
    state.commonAsideDetail = {
      aiDetailMap: {
        ...aiDetailMap,
        ...(action.payload.aiDetailMap || {}),
      },
      aiMidMap: {
        ...aiMidMap,
        ...(action.payload.aiMidMap || {}),
      },
    };
  },
  updateOuterFileDragEntry: (state: MailBoxReducerState, action: PayloadAction<void>) => {
    state.isDragModel = 'eml';
    state.folderTreeDragModel = null;
  },
  updateOuterFileDragLeave: (state: MailBoxReducerState, action: PayloadAction<void>) => {
    state.isDragModel = null;
    state.folderTreeDragModel = null;
  },
  /**
   * 邮件列表-下拉弹窗选中对应的邮件列表中的邮件
   */
  chooseMailFromList: (state: MailBoxReducerState, action: PayloadAction<{ key: MAIL_LIST_CHOOSE_TYPE }>) => {
    const { key } = action.payload;
    const { mailEntities, mailDataList, searchList } = state;
    const isSearching = getIsSearchingMailByState(state);
    let idList = [];
    if (isSearching) {
      idList = getChooseMailId(searchList, mailEntities, key);
      state.activeIds = idList;
    } else {
      idList = getChooseMailId(mailDataList, mailEntities, key);
      state.activeIds = idList;
    }
    if (key == MAIL_LIST_CHOOSE_TYPE.READ && idList?.length == 0) {
      message.warn({
        content: getIn18Text('MEIYOUYIDUYOUJ'),
        duration: 1,
      });
    }
    if (key == MAIL_LIST_CHOOSE_TYPE.UNREAD && idList?.length == 0) {
      message.warn({
        content: getIn18Text('MEIYOUWEIDUYOUJ'),
        duration: 1,
      });
    }
  },
};

export const MailBoxSlice = {
  ...staticSlice,
  ...logicSlice,
};
export * from './mailboxThunks';
