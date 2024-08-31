import {
  MailBoxModel,
  MailEntryModel,
  MailSearchStatesMap,
  MailSearchTypes,
  MailSearchResult,
  MailSearchType,
  MailTag,
  RequestBusinessaAddCompany,
  queryMailBoxParam,
  ISimpleCustomerConatctModel,
  ICustomerManagerModel,
} from 'api';
import { AsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type React from 'react';
import { AsyncThunkConfig } from '@web-common/state/createStore';
import { MAIL_MENU_ITEM, LIST_MODEL, MAIL_SORT_ITEM } from './common/constant';
import type { CustomerMailSliceState } from '@web-mail/state/slice/customerMailReducer/types';
import { DataSource } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { SubordinateMailSliceState } from '@web-mail/state/slice/subordinateMailReducer/types';
import { CustomerAsideDetail, CommonAsideDetail } from '@web-mail/state/slice/customerMailReducer/types';
import { UniDrawerOpportunityProps } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer2';
import { UniDrawerLeadsDetailProps, UniDrawerLeadsViewProps } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads';
import { addToCustomerOrClueProps } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads2';

export interface CustomerTreeData {
  title: string | React.ReactElement;
  key: string;
  icon: React.ReactNode;
  isLeaf: boolean; // true 时为叶子节点，对应联系人数据，false 时为父节点，对应客户数据
  /* 客户有而联系人没有的数据 */
  nodeData?: CustomerBoxModel;
  children?: CustomerTreeChildData[];
  /* 联系人有而客户没有的数据 */
  email?: string;
  managerList?: ICustomerManagerModel[];
}

export interface CustomerTreeChildData {
  title: string;
  key: string;
  icon: React.ReactNode;
  email: string;
  isLeaf: boolean;
  nodeData?: CustomerBoxModel;
  managerList?: ICustomerManagerModel[];
}

export interface CustomerBoxModel {
  orgName: string;
  id: string;
  lastMailTime?: number;
  contacts?: ISimpleCustomerConatctModel[];
  managerList?: ICustomerManagerModel[];
}

export interface ListCustomerPageRes {
  data: CustomerBoxModel[];
  loadMore: boolean;
}

export type loadMailListParam = {
  startIndex: number;
  noCache?: boolean;
  showLoading?: boolean;
  accountId?: string;
  noContactRace?: boolean;
};

export type loadMailListRequestParam = {
  startIndex: number;
  noCache?: boolean;
  showLoading?: boolean;
  accountId?: string;
  noContactRace?: boolean;
  id?: string;
};

export type loadEdmMailListParam = SliceIdParams<{
  startIndex?: number;
  noCache?: boolean;
  showLoading?: boolean;
  refresh?: boolean;
  noContactRace?: boolean;
  type: EdmMailKeys;
}>;

export type loadAdvancedSearchMailListParam = {
  startIndex: number;
  noCache?: boolean;
  showLoading?: boolean;
};

export type refreshParams = {
  noCache?: boolean;
  showLoading?: boolean;
  accountId: string;
  toTop?: boolean;
};

export interface ConfigDetail {
  title: string;
  desc: string;
  imgUrl: string;
  btn?: {
    txt: string;
    url: string;
  };
}

export type searchResultType = {
  [key: string]: MailBoxModel[];
};

// export type mailFolderCmActiveId = { mailBoxId: number | null };

export type fromValues = {
  [key: string]: string | number;
};
// 邮件顶部tab，支持搜索
// 目前状态：普通（'ALL:全部' | PREFERRED:'优先'（17版本去掉） | UNREAD:'未读' | REDFLAG:'红旗'），任务（ALL: 全部, ON: 进行中），稍后处理：（ALL: 全部, DEFER: 已逾期/今日）
// 邮件排序prefix: ORDER_BY_XXX
export type mailListStateTabSelected =
  | 'ALL'
  | 'UNREAD'
  | 'REDFLAG'
  | 'MY_CUSTOMER'
  | 'ON'
  | 'DEFER'
  | 'COLLEAGUE'
  | 'RECEIVE'
  | 'ORDER_BY_DATE_ASC'
  | 'ORDER_BY_SENDER_CAPITAL_DESC'
  | 'ORDER_BY_SENDER_CAPITAL_ASC'
  | 'ORDER_BY_RECEIVER_CAPITAL_DESC'
  | 'ORDER_BY_RECEIVER_CAPITAL_ASC'
  | 'ORDER_BY_SUBJECT_CAPITAL_DESC'
  | 'ORDER_BY_SUBJECT_CAPITAL_ASC'
  | 'ORDER_BY_SIZE_DESC'
  | 'ORDER_BY_SIZE_ASC' // ;
  | 'SENT'
  | 'RECEIVED'
  | 'ATTACHMENT';

export type mailListStateTabs = { type: mailListStateTabSelected | CustomerMailListStateTabSelected; title: string };
// 邮件顶部tab，任务邮件，合并到mailListStateTabSelected处理
// export type taskMailListStateTabSelected = 'ALL' | 'ON'; // ALL: 全部, ON: 进行中
// export type taskMailListStateTabs = { type: taskMailListStateTabSelected, title: string };
// 邮件顶部tab，稍后处理，合并到mailListStateTabSelected处理
// export type deferMailListStateTabSelected = 'ALL' | 'DEFER';// ALL: 全部, DEFER: 已逾期/今日
// export type deferMailListTabs = { type: deferMailListStateTabSelected, title: string };

export type CustomerMailListStateTabSelected = 'ALL' | 'COLLEAGUE' | 'ME' | 'SEND';
/**
 * startDate: 'YYYY-MM-DD'
 * endDate: 'YYYY-MM-DD'
 */
export type OrderDateRange = {
  startDate: string;
  endDate: string;
};

export interface TreeSelectedKey {
  id: string | number;
  accountId?: string;
  accountName?: string;
  managerList?: ICustomerManagerModel[];
  authAccountType?: string;
}

export type SearchSelectedKeyObj = Record<MailSearchType, string | boolean>;
export interface SearchSelectedKeyMap {
  [key: string]: SearchSelectedKeyObj;
}

export interface TreeSelectedContacts {
  list: string[];
  accountId?: string;
}

export interface MailSelectedKey {
  id: string;
  accountId?: string;
}

export interface MailMoveKeys {
  mailId: string | string[];
  accountId?: string;
}

export interface DefaultAccountState {}

export interface AccountStateMap {
  [accountId: string]: DefaultAccountState;
}

export interface UnreadItem {
  unread: number;
  initialized: boolean;
}

export type UnreadMap = Record<string, UnreadItem>;

export interface MailTreeState {
  mailFolderTreeList: MailBoxModel[];
  // mailCustomFolderTreeList: MailBoxModel[];
  MailFolderTreeMap: Record<string, MailBoxModel>;
  // mailTagFolderActiveKey: string | null;
  hasCustomFolder: boolean;
  expandedKeys: number[];
  // folderTreeDragModel: string;
  // 账号排序
  sort: number;
  // 账号邮箱
  accountId: string;
  // 账号邮箱类型，api层透传
  emailType: string;
  // 账号失效状态，api层透传
  expired: boolean;
  // 文件夹的全标已读状态
  allReadLoadingMap: { [key: string]: boolean };
  // 账号名称
  accountName: string;
  // 标签信息
  mailTagList: MailTag[];
}

export interface MailTreeMap {
  main: MailTreeState;
  [accountId: string]: MailTreeState;
}

export interface RootMailBoxReducerState {
  mainAccountState: DefaultAccountState;
  childAccountStateMap: AccountStateMap;
  expiredAccountList: string[];
  accountActiveKey: string[];
  mailEntities: MailStore;
  searchLoading: boolean;
  listLoading: boolean;
  selectedSearchKeys: SearchSelectedKeyMap;
  defaultSelectedSearchKeyMap: SearchSelectedKeyMap;
  mailSearchAccount: string;
  searchResultObj: MailSearchResult;
  extraSearchCloudMailListObj: MailSearchResult;
  extraSearchCloudMailListObjStatus: string;
  selectedKeys: TreeSelectedKey;
  // mailAccountTreeState: MailTreeState
  mailTreeStateMap: MailTreeMap;
  // mailFolderTreeList: MailBoxModel[];
  // mailCustomFolderTreeList: MailBoxModel[];
  refreshBtnLoading: boolean;
  // MailFolderTreeMap: Record<string, MailBoxModel>;
  mailTagFolderActiveKey: {
    key?: string | null;
    accountId: string | null;
  };
  advancedSearchVisible: boolean;
  // mailFolderCmActiveId: mailFolderCmActiveId;
  isDragModel: 'mail' | 'eml' | null;
  // folderDropDownVisiableId: number | null;
  // folderDragHoverId: string | null;
  expandedSearchKeys: number[];
  // expandedKeys: number[];
  searchList: string[];
  mailDataList: string[];
  refreshHasNewMail: boolean;
  mailTotal: number;
  checkedMails: Map<any, MailEntryModel>;
  activeIds: string[];
  commonModalVisible: boolean;
  mailListStateTab: mailListStateTabSelected;
  scrollTop: number;
  searchListStateTab: mailListStateTabSelected;
  folderTreeDragModel?: {
    mailId: string;
    accountId: string;
    folderId: number;
  } | null;
  folderModveModalVisiable: boolean;
  folderMoveId: {
    folderId: string;
    accountId: string;
  } | null;
  importFolderId: {
    folderId: string;
    accountId: string;
  } | null;
  mailSearchKey: string;
  mailSearchType: MailSearchTypes;
  mailSearching: string;
  mailSearchStateMap: MailSearchStatesMap;
  mailSearchRecord: boolean;
  mailSearchFolderIds: number[];
  activeSearchMailId: MailSelectedKey;
  mailFolderIsLock: boolean;
  advancedSearchLoading: boolean;
  mailMoveModalVisiable: boolean;
  mailImportModalVisible: boolean;
  mailMoveFid: number | null;
  mfModalSelectedFids: number[];
  mfModalExpandFids: number[];
  mailTabs: mailListStateTabs[];
  selectedMailId: MailSelectedKey;
  // selectedThreadMailIds: string[];
  // activeMailFid: number;
  refreshLoading: boolean;
  noticeNum: number;
  keepPeriod: number;
  mailListResizeProcessing: boolean;
  mailMoveMid: MailMoveKeys;
  mailImportMid: string;
  mailMoveIsThread: boolean;
  mailTagAddModalVisible: {
    accountId?: string;
    visible: boolean;
  };
  mailMultPanelVisible: boolean;
  mfModalReadMailNum: number;
  mailListInitIsFailed: boolean;
  dialogConfig: object | null;
  guidePageStatus: Map<string, string>;
  onGuidePage: ConfigDetail;
  mailListMenuVisiable: boolean;
  activeFolderList: number[];
  showThreadBuildingTip: boolean;
  showStarContactBuildingTip: boolean;
  showGlobalLoading: boolean;
  searchingRequestId: number | null;
  advanceSearchFromValues: fromValues;
  isSearchRecorded: boolean;
  // 合并mailListStateTab处理
  // taskMailTabs: taskMailListStateTabs[];
  // taskMailListStateTab: taskMailListStateTabSelected;
  // deferMailTabs: deferMailListTabs[],
  // deferMailListStateTab: deferMailListStateTabSelected,
  // showSmartMailboxTip: boolean;
  shareMail: MailEntryModel;
  shareMailMid: string;
  readMailChildMailList: string[];
  readMailWindowActiveMailId: string | null;
  mailRelateActiveMialId: string | null;
  activeStrangerIds: string[];
  mailRelateStrangerActiveId: string | null;
  mailRelateMailList: string[];
  mailRelateStrangeMailList: string[];
  mailExcludeKeyMap: { [key: string]: { [key: string]: { [key: string]: any } } };
  defaultMailListSelectedModel: LIST_MODEL;
  // mailTagList: MailTag[];
  configMailShow: boolean; // 快捷设置,抽屉是否展示
  configMailListShowAvator: boolean; // 快捷设置，邮箱列表是否展示头像
  configMailListShowConcreteTime: boolean; // 快捷设置，邮箱列表是否展示具体时间
  configMailLayout: string; // 快捷设置，视图模式：左右分栏：’1‘，通栏：’2‘
  configMailListShowAttachment: boolean; // 快捷设置，邮箱列表是否展示附件
  configMailListShowDesc: boolean; // 快捷设置，邮箱列表是否展示摘要
  configMailListTightness: number; // 快捷设置，邮件列表密度
  configMailListShowCustomerTab: boolean; // 邮件列表设置，是否支持我的客户筛选，仅外贸通支持
  mailMenuItemState: mailMenuItemState;
  hideMessage: boolean;
  successMsg: string;
  failMsg: string;
  // 筛选排序条件中的开始/结束时间
  useRealList: boolean;
  realListDefaultPageSize: number;
  realListPageSizes: Array<string>;
  realListTotalCount: number;
  realListCurrentPageSize: number;
  realListCurrentPage: number;
  lastFetchFirstIndexTime: number;
  uniCustomerParam: UniCustomerParam; // 邮件+1010版本后，不再使用了，稳定2个版本后删除
  uniOpportunityParam: UniDrawerOpportunityProps; // 邮件+1010版本后，不再使用了，稳定2个版本后删除
  uniClueParam: UniDrawerLeadsDetailProps; // 新建或者编辑线索 // 邮件+1010版本后，不再使用了，稳定2个版本后删除
  uniToCustomerOrClueParam: addToCustomerOrClueProps; // 添加到原有客户，添加到原有线索
  uniClueViewParam: UniDrawerLeadsViewProps; // 添加到原有客户，查看线索 // 邮件+1010版本后，不再使用了，稳定2个版本后删除
  unReadMap_cm: { customerMap: UnreadMap; contentMap: UnreadMap };
  newGuideForCustomerAside_cm: boolean; // 邮件+231222版本，下线右侧边栏新手引导
  rightSideSelectedDetail: { email: string; name: string }; // 右侧边栏，在发件箱下，当前选中的联系人详情
  customer: CustomerMailSliceState;
  subordinate: SubordinateMailSliceState;
  customerAsideDetail: CustomerAsideDetail;
  commonAsideDetail: CommonAsideDetail;
  // 是否展示添加联系人弹窗
  addContactModelVisiable: boolean;
  orderDateRange: OrderDateRange;
  listIsRefresh?: boolean;
  queryParams?: queryMailBoxParam;
  mergeMailOrderDesc?: boolean;
  mailAccountAliasMap: stringMap;
}

export type EdmMailKeys = 'customer' | 'subordinate';

export type MailBoxReducerKey = keyof MailBoxReducerState;

export interface mailMenuItemState {
  [mailId: string]: { [menuKey: string]: boolean };
}

export type MailBoxReducerState = CustomerMailSliceState & SubordinateMailSliceState & RootMailBoxReducerState;

export interface PayloadMeta<T> {
  arg: T;
  requestId: string;
  requestStatus: string;
}

export interface UniCustomerParam {
  visible: boolean;
  source: keyof typeof DataSource;
  customerData?: Partial<RequestBusinessaAddCompany>; // 打开详情页的预置数据(录入客户场景和添加联系人到已有客户场景都需要传预置数据)
  customerId?: number; // 打开/编辑已有客户目前需要有id字段
  contactId?: number; // 打开/编辑已有客户联系人id
  scenario?: 'leadConvertCustomer'; // 传递了就是转客户
  uniType?: 'editCustomer' | 'editContact' | 'editClueContact'; // 弹窗类型，目前支持：编辑联系人，编辑客户，别的保持原有逻辑
  onSuccess?: Function;
  onClose?: Function;
}

export type ThunkHelperParamsMeta<Params> = PayloadMeta<Params extends unknown ? any : SliceIdParams<Params>>;

export type thunkHelperParams<S, Params> = {
  name: string;
  request: (params: Params, thunkAPI: AsyncThunkConfig) => void;
  pending?: (state: S, payload: PayloadAction<Params, string, ThunkHelperParamsMeta<Params>>) => void;
  fulfilled?: (state: S, payload: PayloadAction<any, string, ThunkHelperParamsMeta<Params>>) => void;
  rejected?: (state: S, payload: PayloadAction<any, string, ThunkHelperParamsMeta<Params>, IResponseError>) => void;
};
export type thunkHelper = <Params, S = RootMailBoxReducerState>(params: thunkHelperParams<S, Params>) => void;

export interface thunksStore {
  [key: string]: AsyncThunk<void, any, {}>;
}

export interface IResponseError {
  message: string;
}

export type moveSortUserFolderParams = {
  id: number;
  parent: number;
  sorts: number[];
  accountId?: string;
};

export type deleteMailParam = {
  id: string | string[];
  detail?: boolean;
  realDeleteNum?: number;
  showLoading?: boolean | 'global';
  isScheduleSend?: boolean;
  folderId: number;
};

export type deleteMailFromListParam = {
  id: string | string[];
  showLoading?: boolean;
  accountId?: string;
};

export type showMailMoveModalParam = {
  mailId: string | string[];
  folderId: number;
  accountId?: string;
};

export type showMailImportModalParam = {
  mailId: string;
};

export type doMoveMailParam = {
  mailId: string | string[];
  folderId: number;
  showLoading: boolean | 'global';
};

export type doImportMailParam = {
  cid: string;
  fid: number;
};

export type doTopMailParam = {
  mark: boolean;
  id: string;
};

export type doMailReplay = {
  id: string;
  replayed: boolean;
  forwarded: boolean;
};

export type refreshPageParam = {
  showLoading?: boolean;
};

interface EventCallback {
  (e: React.MouseEvent): void;
}

// 卡片列表-卡片的props
export interface ListCardComProps<T> {
  data: T;
  active?: boolean;
  checked?: boolean;
  // onClick: EventCallback;
  // onMouseEnter?: EventCallback;
  // onMouseLeave?: EventCallback;
  // onContextMenu?: EventCallback;
  [other: string]: any;
}

// 卡片列表-邮件卡片的props
export interface MailListCardComProps {}

export type stringMap = {
  [key: string]: any;
};

export type GetRowHeight<T> = (params: T) => number;

export type GetReactElement = (...params: any) => React.ReactElement;

export type VlistLoadMore<T> = (start: number) => Array<T>;

export type VoidEventCallBack = () => Promise<void>;

export type VlistPullRefreshRenderState = 'default' | 'loading' | 'success' | 'failed';

export type VlistPullRefreshRender = (state: VlistPullRefreshRenderState) => React.ReactElement;

export type RowRenderer = (params: { index: number; key: string | number; style: Object; parent: any }) => React.ReactElement;

export type CardListTopExtraData = {
  height: number;
  element: React.ReactElement;
  key?: string | number;
};

export interface VlistComProps<T> {
  /**
   * 列表渲染所需的数据
   */
  data: Array<T>;
  /**
   * 数据的总数，用于判断是否需要继续加载
   */
  total: number;
  /**
   * 列表的宽度
   */
  width: number;
  /**
   * 列表的高度
   */
  height: number;
  /**
   * 计算列表每一项的高度
   */
  rowHeight: GetRowHeight<T>;
  /**
   * 首屏数据是否自动请求
   */
  initLoadMore?: boolean;
  /**
   * 每次分页加载的数量
   */
  batchSize?: number;
  /**
   * 距离底边多选的时候开始加载下一页
   */
  threshold?: number;
  /**
   * 列表距离顶部的距离
   */
  scrollTop: number;
  /**
   * 样式
   */
  containerStyle?: Object;
  /**
   * 附加到列表外层的自定义类名
   */
  className?: string;
  /**
   * 当列表截止的时候-渲染的没有更多区域
   */
  noMoreRender?: GetReactElement;
  /**
   * 下滑刷新的时候，自定义的显示区域
   */
  pullRefreshRender?: VlistPullRefreshRender;
  /**
   * 加载更多的时候，自定义展示区域
   */
  loadMoreLoadingRender?: GetReactElement;
  /**
   * 渲染在列表顶部的额外区域，随列表滑动，但不参与列表元素的功能计算
   */
  topExtraData?: CardListTopExtraData[];
  /**
   * 分页加载更多
   */
  onLoadMore?: VlistLoadMore<T>;
  /**
   * 当列表滚动的时候
   */
  onScroll?: EventCallback;
  /**
   *  下拉刷新
   */
  onPullRefresh?: VoidEventCallBack;
  /**
   * 分页加载失败的显示Render
   */
  loadMoreLoadingFailRender?: () => JSX.Element;
  /**
   * 首次加载，加载失败的显示Render
   */
  initLoadLoadingFailRender?: () => JSX.Element;
  /**
   * 列表没有数据的时候显示
   */
  noRowsRenderer?: () => JSX.Element;
  /**
   * 行渲染函数
   */
  rowRenderer: RowRenderer;
  /**
   * 下拉刷新显示的区域高度
   */
  pullRefreshLoadingHeight?: number;
  /**
   * 加载更多加载区域的显示高度
   */
  loadMoreLoadingHeight: number;
  /**
   * 滑动的时候，合并渲染的时间庄口
   */
  scrollingResetTimeInterval?: number;
  /**
   * 每次渲染的元素数量
   */
  overscanRowCount?: number;
}

export type CardEventHandle = (keys: Array<string>, data: any, index: number, event?: React.MouseEvent | React.KeyboardEvent) => void;

export type CardCheckedEventHandle = (checked: boolean, keys: Array<string>, data: any, index: number, event?: React.MouseEvent | React.KeyboardEvent) => void;

export type CardGroupDecorateRenderResult = {
  index: number;
  element: React.ReactElement;
  height: number;
  position?: 'bottom' | 'top';
  fixed?: {
    height?: number;
    style?: stringMap;
    element?: React.ReactElement;
  };
};

export type CardGroupDecorateRender<T> = (data: Array<T>, prevDecorateIndex: number) => CardGroupDecorateRenderResult | CardGroupDecorateRenderResult[] | null;

export type GetUniqKey<T> = (index: number, data: T) => string;
// 虚拟卡片列表-props
export interface CardListComProps<T> extends VlistComProps<T> {
  activeId: Array<string>;
  card: React.ComponentType<ListCardComProps<T>> | React.FC<ListCardComProps<T>>;
  cardMargin?: number;
  getUniqKey?: GetUniqKey<T>;
  cardWrap?: React.ComponentType<CardWrapProps<T>> | React.FC<CardWrapProps<T>>;
  cardGroupDecorate?: Array<CardGroupDecorateRender<T>>;
  onSelect?: CardEventHandle;
  onDoubleClick?: CardEventHandle;
  onContextMenu?: CardEventHandle;
  // 列表是否处于多选模式
  isMultiple?: boolean;
  data: T[];
  onChecked?: CardCheckedEventHandle;
  selectIsCapture?: boolean;
  listFouceRender?: number;
  useRealList?: boolean;
  realListPager?: React.ReactNode;
  realListClassName?: string;
  onRealListScroll?: (scrollTop: number) => {};
  isRefresh?: boolean;
  /**
   * 高度变化的时候，不满1屏幕
   * 在状态变化的时候，可能会多次调用，请业务层做好屏蔽与防抖
   */
  onContentInsufficientHeight?: () => void;

  // onMouseEnter?: CardEventHandle;
  // onMouseLeave?: CardEventHandle;
}

// 可拖拽虚拟卡片列表-props
export interface DragCardListComProps<T> extends CardListComProps<T> {
  dragable?: boolean;
  onDragStart?: (e: React.DragEvent, data: T, index: number) => void;
  onDragEnd?: (e: React.DragEvent, data: T, index: number) => void;
  [other: string]: any;
}
// 卡片包裹层props
export interface CardWrapProps<T> {
  data: T;
  // key: string | number;
  index: number;
  // style: Object;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  children?: any;
  fixed?: {
    height?: number;
    style?: stringMap;
    element?: React.ReactElement;
  };
}

export interface MailCardListProps extends DragCardListComProps<MailEntryModel> {}

export interface MailCardComProps extends ListCardComProps<MailEntryModel> {
  // data: MailEntryModel;
  // active: boolean;

  avatar?: React.FC<MailCardComProps> | null;
  desc?: React.FC<MailCardComProps> | null;
  from?: React.FC<MailCardComProps> | null;
  fromFlagAfter?: React.FC<MailCardComProps> | null;
  customerLabelAfter?: React.FC<MailCardComProps> | null;
  deadLine?: React.FC<MailCardComProps> | null;
  time?: React.FC<MailCardComProps> | null;
  summary?: React.FC<MailCardComProps> | null;
  summaryExtra?: React.FC<MailCardComProps> | null;
  attachments?: React.FC<MailCardComProps> | null;
  status?: React.FC<MailCardComProps> | null;
  tag?: React.FC<MailCardComProps> | null;
  summaryPreExtra?: React.FC<MailCardComProps> | null;
  sendReadStatus?: React.FC<MailCardComProps> | null;
  // 现在还不知道这是个什么东西
  // attachmentActions: any;

  className?: object;
  hideTagName?: string;
  // onAttachmentClick?: (attachment: MailFileAttachModel[], file: MailFileAttachModel, index: number) => void;
  // 红旗的点击事件直接暴露出来吧
  // onReadFlagClick?: (data:MailEntryModel)=>void;
  onChecked?: (checked: boolean, e?: React.MouseEvent | React.KeyboardEvent) => void;
  forceShowAttachment?: boolean;
  // 额外数据
  extraData?: string;
}

export type MailMenuItemRender = (mail: MailEntryModel | MailEntryModel[], callBack?: (visible: boolean) => void) => React.ReactElement | string | number;

export type MailMenuIsShowCallBack = (mail: MailEntryModel | MailEntryModel[]) => boolean;

export type MailMenuOnClickCallBack = (mail: MailEntryModel | MailEntryModel[], callBack?: MailMenuOnClickCallBack) => any;

export type CommonMailSubMenu = CommonMailMenuConfig[] | MailMenuItemRender;

export type MailSortIsShowCallBack = (folder: number) => boolean;

export type MailSortOnClickCallBack = () => any;

// 通用邮件菜单配置项
export interface CommonMailMenuConfig {
  /**
   * 菜单项的唯一key，用于识别与融合
   */
  key?: string | number | MAIL_MENU_ITEM;
  /**
   * 分组-用于菜单项渲染的时候横线分隔
   */
  group?: string | number;
  /**
   * 菜单的名称
   */
  name?: string | number | MailMenuItemRender;
  /**
   * 图标-具体如何渲染由各render决定
   */
  icon?: React.ReactElement | MailMenuItemRender;
  /**
   * 二级标题-具体如何渲染由各render决定
   */
  tip?: string | number | React.ReactElement | MailMenuItemRender;
  /**
   * 用于tooltip的内容-具体如何渲染由各render决定
   */
  tooltip?: string | number | MailMenuItemRender;
  /**
   * 自定义的渲染函数
   */
  render?: MailMenuItemRender;
  /**
   * 是否展示
   */
  show?: boolean | ((mail: MailEntryModel | MailEntryModel[], defaultShow?: MailMenuIsShowCallBack) => boolean);
  /**
   * 点击事件
   */
  onClick?: MailMenuOnClickCallBack;
  /**
   * 子菜单配置
   */
  subMenus?: CommonMailSubMenu;
  /**
   * 仅打开配置，用于文字按钮下，仅作为展开按钮，例如：标记为、更多
   */
  onlyUnfold?: boolean;
}

// 通用邮件排序配置项
export interface CommonMailSortConfig {
  /**
   * 菜单项的唯一key，用于识别与融合
   */
  key: MAIL_SORT_ITEM;
  /**
   * 分组-用于控制展示在几级展示
   */
  level: number;
  /**
   * 菜单的名称
   */
  name: string;
  /**
   * 作为tab展示时菜单的名称
   */
  tabName?: string;
  /**
   * 一级目录是否需要分组的横线
   */
  needDivider?: boolean;
  /**
   * 是否展示
   */
  show?: (folderId: number, defaultShow?: MailSortIsShowCallBack) => boolean;
  /**
   * 点击事件
   */
  onClick?: MailSortOnClickCallBack;
  /**
   * 用于控制展示顺序
   */
  sort?: number;
  /**
   * 用于控制默认选中
   */
  default?: boolean;
}

// 基础邮件菜单map
export type DefaultMailMenuConfigMap = {
  [key in MAIL_MENU_ITEM]?: CommonMailMenuConfig;
};

// 邮件加载性能打点记录
export type mailIdChangeRecord = {
  id: string;
  time: number;
};

// 聚合邮件-分页参数
export type TreadMailPageConfig = {
  current: number;
  pageSize: number;
  total: number;
};

export interface AttachCardConfig {
  // 隐藏打包下载
  hidePackDownload?: boolean;
  // 隐藏云预览
  hideCloudPreview?: boolean;
  // 隐藏打开文件
  hideChatOpenFile?: boolean;
  // 隐藏打开文件夹
  hideChatOpenDir?: boolean;
  hideActionOperate?: boolean;
  // 隐藏更多按钮
  hideMoreOperate?: boolean;
  // 隐藏保存到个人空间
  hideSaveForward?: boolean;
  // disabled?: boolean;
  // onClick?: ()=>void;
}

// 邮件读信页-功能开关配置
export type FeatureConfig = {
  // 是否启用邮件讨论功能
  mailDiscuss?: boolean;
  // 是否展示往来邮件的跳转入口 - 联系人卡片中
  relatedMail?: boolean;
  // 邮件标签是否可以在标签上关闭
  mailTagIsCloseAble?: boolean;
  // 是否展示阅读状态
  readStatus?: boolean;
  // 附件行为的自定义
  attachCard?: AttachCardConfig;
  // 是否是上下分栏
  isUpDown?: boolean;
};

export type MailStore = {
  [id: string]: MailEntryModel;
};

export type accountObj = {
  key: string;
  value: string;
  keyType?: string;
};
export type SliceIdParams<T = {}> = T & { sliceId: string };

// 用于在邮件操作按钮的HtmlElement 上附加一些属性
export type DOMProps = stringMap | ((mails: MailEntryModel | MailEntryModel[], meunConfig: CommonMailMenuConfig) => stringMap);
