import { Checkbox, DatePicker, Dropdown, Input, Popover, Select, Skeleton, Table, Tabs, Tooltip, Menu, Space, Pagination, Empty, message, Spin } from 'antd';
import { ExpandableConfig } from 'rc-table/lib/interface';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import React, { useState, useRef, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import moment, { Moment } from 'moment';
import { timeZoneMap, getWeekdayWithTimeZoneOffset } from '@web-common/utils/constant';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import { navigate, useLocation } from '@reach/router';
import _ from 'lodash';
import {
  api,
  apiHolder,
  apis,
  EdmEmailInfo,
  EdmSendBoxApi,
  ResponseSendBoxInfo,
  ResponseReservedCount,
  WorktableApi,
  EdmStatInfo,
  isFFMS,
  SendBoxConfRes,
  EdmSendConcatInfo,
  AiMarketingContact,
  traceLogItem,
  RemarketingDataSourceRes,
  ResponseSendBoxDetail,
  MarketingSuggestResMarketing,
  EdmRewardTaskStateResp,
  ErrorReportApi,
  GetDiagnosisDetailRes,
} from 'api';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import queryString from 'query-string';
import style from './edm.module.scss';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { StatisticItem } from './components/statistics/statisticsItem';
import { ReactComponent as MoreIcon0 } from '@/images/icons/edm/mail0.svg';
import { ReactComponent as MoreIcon1 } from '@/images/icons/edm/mail1.svg';
import { ReactComponent as MoreIcon3 } from '@/images/icons/edm/mail3.svg';
import { ReactComponent as MoreIcon4 } from '@/images/icons/edm/mail4.svg';
import { ReactComponent as MoreIcon5 } from '@/images/icons/edm/mail5.svg';
import { ReactComponent as UpLine } from '@/images/icons/edm/up-line.svg';
import { ReactComponent as ArrowRightBlueIcon } from '@/images/icons/edm/arrow_right_blue.svg';
import { ReactComponent as SendedOperation1 } from '@/images/icons/edm/sended_operation1.svg';
import { ReactComponent as SendedOperation2 } from '@/images/icons/edm/sended_operation2.svg';
import { ReactComponent as SendedOperation3 } from '@/images/icons/edm/sended_operation3.svg';
import { ReactComponent as SendedOperationRight } from '@/images/icons/edm/sended_operation_right.svg';
import { EdmPageProps } from './pageProps';
import { EdmStatColumns, columnsFilter, handlePreviewImage, onHttpError, StatItemData, toStatItem, transformStatus, MarketingVideo, timeFormat } from './utils';
import defaultImg from '@/images/icons/edm/default-edm-thumb.png';
import { useCancelToken } from './fetchHook';
import { ATTACHMENT_CONFIG } from './send/contentEditor';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import MoreActionIcon from '@/components/UI/Icons/svgs/MoreAction';
import { edmDataTracker, EDMPvType, EdmSendListFilterType, EdmSendListOperateType } from './tracker/tracker';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { ReactComponent as LinkTraceSvg } from '@/images/icons/edm/link-trace.svg';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
import { renderTraceLinkPopup } from './components/linkTrackModal/infoPopup';
import CustomerTabs from './Tabs/tabs';
import { PermissionCheckPage, PrivilegeCheck, usePermissionCheck } from '@/components/UI/PrivilegeEnhance';
import { ColumnType } from 'antd/lib/table';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import ImagePreview from '@web-common/components/UI/ImagePreview';
import { useAppSelector, AiWriteMailReducer, useActions, ConfigActions } from '@web-common/state/createStore';
import AutoMarketingEnter from './components/AutoMarketingEnter/autoMarketingEnter';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { isOwnerDataPrivilegeSelector } from '@web-common/state/reducer/privilegeReducer';
import { ReactComponent as ExplanationIcon } from '@/images/icons/edm/yingxiao/explanation-gray16px.svg';
import { EdmDetail } from './detail/detailV2';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
// import { Input as SiriusInput } from '@web-common/components/UI/Input';
import SiriusInput from '@lingxi-common-component/sirius-ui/Input';
import { DetailTabOption } from './detail/detailEnums';
import NoDataIcon from '@/images/icons/edm/yingxiao/no-data.png';
import { getIn18Text } from 'api';
import { Interface, MarketingClassroom } from './MarketingClassroom';
import { AihostingBanner } from './components/AihostingBanner';
// import { AihostingModal } from './components/AihostingModal';
// import { RewardTaskModalComponent } from './components/RewardTaskModal';
import AiMarketingEnter from './components/AiMarketingEnter/aiMarketingEnter';
// import { SendedErrorTips } from './components/SendedErrorTips';
import { EdmTabs } from './components/EdmTabs';
import RemarketingDrawer, { remarketingType } from './components/RemarketingDrawer/remarketingDrawer';
import lodashGet from 'lodash/get';
import _debounce from 'lodash/debounce';
import { ReactComponent as MarketingSuggestIcon } from '@/images/icons/edm/yingxiao/marketing_suggest_light.svg';
import TongyongJianTouYou from '@web-common/images/newIcon/tongyong_jiantou_you';
import { ReactComponent as VideoIcon } from '@/images/icons/edm/video.svg';
import { SUGGEST_MODAL } from './components/MarketingModalList/marketingModalList';
import { TaskDiagnosis } from './TaskDiagnosis';
import { useTaskDiagnosis } from './TaskDiagnosis/useTaskDiagnosis';

const systemApi = apiHolder.api.getSystemApi();
const storeApi = apiHolder.api.getDataStoreApi();
const sentryReportApi = apiHolder.api.requireLogicalApi(apis.errorReportImpl) as ErrorReportApi;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const inElectron = apiHolder.api.getSystemApi().isElectron;
const inFFMS = isFFMS();
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';

interface SearchCondition {
  sendTime: [Moment, Moment] | null;
  recentlyUpdateTime: [Moment, Moment] | null;
  createTime: [Moment, Moment] | null;
  edmSubject?: string;
  emailStatus?: string;
  searchAccIds?: string[];
  page: number;
  pageSize: number;
  contactEmail?: string;
  isDel: string;
  edmMode?: string;
  /**
   * 最近打开
   */
  recentRead?: boolean;
  /**
   * 最近回复
   */
  recentReply?: boolean;
  /**
   * 任务类型
   * 0 单发件人 1 多发件人
   */
  senderMode?: '0' | '1';
}

const marketingState = [
  { status: '-1', text: getIn18Text('QUANBU') },
  { status: '0', text: getIn18Text('DAIFASONG') },
  { status: '1', text: getIn18Text('FASONGZHONG') },
  { status: '2', text: getIn18Text('YIFASONG') },
  { status: '4', text: getIn18Text('YICHEXIAO') },
  // { status: '5', text: '垃圾邮件' },
];
// 是否二次营销配置
const secondSendConf = [
  { value: '', text: getIn18Text('QUANBU') },
  { value: '0', text: '非多轮营销' },
  { value: '1', text: '多轮营销' },
];

// 任务类型配置
const sendboxTypeConf = [
  { value: '', text: getIn18Text('QUANBU') },
  { value: '0', text: '普通任务' },
  { value: '1', text: '多发件地址任务' },
];

// 时间select配置
const TimeSelectConf = [
  {
    label: getIn18Text('QUANBUSHIJIAN'),
    key: '',
  },
  {
    label: getIn18Text('CHUANGJIANSHIJIAN'),
    key: 'createTime',
  },
  {
    label: getIn18Text('KAISHIFASONG'),
    key: 'sendTime',
  },
  {
    label: getIn18Text('ZUIJINGENGXIN'),
    key: 'recentlyUpdateTime',
  },
];

interface DetailProp {
  qs: Record<string, string | number | undefined>;
  visible: boolean;
  index?: number;
  target?: DetailTabOption;
  // info?: Record<string, string | number>;
}

const SEND_TASK_GUIDE = 'sendTaskGuide';
const dateFormat = 'YYYY-MM-DD';
const eventApi = api.getEventApi();
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const worktableApi = apiHolder.api.requireLogicalApi('worktableApiImpl') as WorktableApi;
const videoDrawerConfig = { videoId: 'V14', source: 'kehukaifa', scene: 'kehukaifa_6' };
// const REWARD_TASK_RESP_CACHE = 'rewardTaskRespCache';
// const REWARD_TASK_NOT_JOIN_MODAL = 'rewardTaskNotJoinModal';
// const REWARD_TASK_JOINED_MODAL = 'rewardTaskJoinedModal';

function disabledDateFuture(current: Moment) {
  return current && current < moment('1900-01-01').endOf('day');
}

let fetchDataTimestamp = 0;
let fetchStatTimestamp = 0;

const defaultSearchCondition = {
  sendTime: null,
  recentlyUpdateTime: null,
  page: 1,
  pageSize: 20,
  isDel: '0',
  createTime: null,
  // senderMode: '',
};

interface FromType {
  /**
   * 来源页面；list 是任务列表页；templateList 是模板列表页
   */
  from?: 'list' | 'templateList';
  /**
   * 跳转详情回调
   */
  toDetail?: (qs: object) => void;
  /**
   * 存为模板回调
   */
  saveTemplate?: (edmEmailId: string) => void;
  /**
   * 保存模板文案
   */
  saveTemplateTxt?: string;

  visiable?: boolean;
}

interface MarketingSuggestDataModel {
  show: boolean;
  data: MarketingSuggestResMarketing;
  unMarketing: boolean;
}

export const SendedMarketing: React.FC<EdmPageProps & FromType> = ({ qs, from = 'list', toDetail, visiable = true, saveTemplate, saveTemplateTxt = '存为模板' }) => {
  const { changeAiHostingInitObj } = useActions(AiWriteMailReducer);
  const container = useRef<HTMLDivElement>(null);
  const pageHeader = useRef<HTMLDivElement>(null);
  const filterBlock = useRef<HTMLDivElement>(null);
  const statisticsList = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [activeTaskTab, setActiveTaskTab] = useState<string>('0'); // 0:普通任务 1:分批任务 2: 多域名任务
  // 表格头部日期
  const [tableHeaderTitle, setTableHeaderTitle] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchCondition, setSearchCondition] = useState<SearchCondition>(defaultSearchCondition);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<any>([]);
  const [sendBoxInfo, setSendBoxInfo] = useState<ResponseSendBoxInfo | null>(null);
  const [statData, setStatData] = useState<Array<StatItemData | StatItemData[]> | null>(null);
  const [statInfo, setStatInfo] = useState<EdmStatInfo | null>(null);
  const [tableData, setTableData] = useState<Array<EdmEmailInfo>>([]);
  const [total, setTotal] = useState<number>(0);
  const [topItem, setTopItem] = useState<EdmEmailInfo | null>(null);
  const [readCountKey, setReadCountKey] = useState(getIn18Text('DAKAIRENSHU'));
  const [managerOptions, setManagerOptions] = useState<Array<{ account_id: string; account_name: string; nick_name: string }>>();
  const [detailProp, setDetailProp] = useState<DetailProp>({ visible: false, qs: { page: '', id: '', transId: qs?.transId } });
  // 操作状态
  const [copyLoading, setCopyLoading] = useState(false);
  const [againMarketingLoading, setAgainMarketingLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [curActionId, setCurActionId] = useState('');
  // 是否展示引导
  const [showGuide, setShowGuide] = useState<boolean>(false);
  // 是否有查看全部任务权限
  const [hasAllPrivilege, setHasAllPrivilege] = useState<boolean>(false);
  // 时间类型
  const [timeType, setTimeType] = useState('');
  const [timeRange, setTimeRange] = useState<[moment.Moment, moment.Moment] | null>(null);
  const classroomRef = useRef<Interface>();
  // 托管营销信息
  const [sendBoxCof, setSendBoxCof] = useState<SendBoxConfRes>();
  const [hasRecord, setHasRecord] = useState(false);
  // 托管营销入口按钮
  const aiMarketingEnterRef = useRef<any>();
  const [aiMarketingEnterContacts, setAiMarketingEnterContacts] = useState<Array<EdmSendConcatInfo>>();
  const [curtEdmEmailId, setCurtEdmEmailId] = useState('');
  // 是否展示二次营销抽屉
  const [showMarketingDrawer, setShowMarketingDrawer] = useState<boolean>(false);
  const [remarketingDataSourceRes, setRemarketingDataSourceRes] = useState<RemarketingDataSourceRes>();
  // 营销建议相关数据
  const [marketingSuggestData, setMarketingSuggestData] = useState<MarketingSuggestDataModel>();
  // const [showRewardTaskModal, setShowRewardTaskModal] = useState<boolean>(false);
  // const [rewardTaskStateResp, setRewardTaskStateResp] = useState<EdmRewardTaskStateResp>();
  // 诊断与建议显示隐藏
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  // const diagnosisDetail = useAppSelector(state => state.aiWriteMailReducer.diagnosisDetail);
  const { data: diagnosisDetail, hasRead } = useTaskDiagnosis(visiable);

  const { showVideoDrawer } = useActions(ConfigActions);
  // 是否展示多账号筛选
  // const hasSenderPermission = usePermissionCheck('VIEW', 'EDM', 'EDM_MULTI_ACCOUNT_INFO');
  // const [showSenderRotate, setShowSenderRotate] = useState(false);
  // useEffect(() => {
  //   // 模板弹窗&有权限才展示
  //   if (from === 'templateList' && hasSenderPermission) {
  //     setShowSenderRotate(true);
  //   }
  // }, [hasSenderPermission, from]);

  useEffect(() => {
    if (aiMarketingEnterContacts) {
      aiMarketingEnterRef.current?.handleHosting();
    }
  }, [aiMarketingEnterContacts]);

  function disabledDate(current: Moment) {
    if (timeType === 'createTime' || timeType === 'recentlyUpdateTime') {
      return current && (current > moment().endOf('day') || current < moment('1900-01-01').endOf('day'));
    }
    return false;
  }

  const hasEdmPermission = usePermissionCheck('VIEW', 'EDM', 'EDM_SENDBOX');

  const locationTag = useLocation();
  // TODO: 进入到页面之后, 要不要主动刷新数据(待定) @hanxu
  useEffect(() => {
    if (visiable) {
      if (!location.hash.includes('detailId')) {
        setDetailProp({ visible: false, qs: {} });
      } else {
        setShowDiagnosis(false);
      }
      if (location.hash.includes('zhenduan')) {
        setShowDiagnosis(true);
      }
      forceUpdate();
      fetchSendCount();
      fetchMarketingSuggest();
    }
  }, [visiable]);

  const isCircle = useMemo(() => {
    return +activeTaskTab === 1;
  }, [activeTaskTab]);
  const isSenderRotate = useMemo(() => {
    return +activeTaskTab === 2;
  }, [activeTaskTab]);
  useEffect(() => {
    setSelectedRowKeys([]);
    setTableData([]);
    setTotal(0);
  }, [activeTaskTab]);
  const flattenTableData = useMemo(() => {
    if (isCircle) {
      return tableData.reduce<Array<EdmEmailInfo>>((acc, value) => {
        acc.push(value);
        if (Array.isArray(value.sendboxList)) {
          acc = acc.concat(value.sendboxList);
        }
        return acc;
      }, []);
    }
    return tableData;
  }, [isCircle, tableData]);

  /**
   * 对tabledata进行转换，给二次营销任务添加标记
   */
  const transformTableData = useCallback((tableData: Array<EdmEmailInfo>): Array<EdmEmailInfo> => {
    return tableData.map(item => {
      if (item.subList && item.subList.length > 0) {
        const newSubList = item.subList.map((subItem, index) => {
          if (index > 0) {
            subItem.isChild = 'true';
          }
          return subItem;
        });
        item.subList = newSubList;
      }
      return item;
    });
  }, []);

  // 请求是否有托管营销信息
  useEffect(() => {
    edmApi.getSendBoxConf({ type: 1 }).then(setSendBoxCof);
  }, [setSendBoxCof, visiable]);

  useEffect(() => {
    setExpandedRowKeys(flattenTableData.map(item => item.batchId));
  }, [flattenTableData]);
  const cancelToken = useCancelToken();
  const handleSendTimeChange = (values: any) => {
    setSearchCondition({
      ...searchCondition,
      sendTime: values,
      recentlyUpdateTime: null,
      page: 1,
      pageSize: 20,
      recentRead: false,
      recentReply: false,
    });
    edmDataTracker.trackSendBoxFilterClick(EdmSendListFilterType.SendTime);
  };

  const getCurrentTime = (key: string, value: any) => {
    const empty = {
      sendTime: null,
      recentlyUpdateTime: null,
      createTime: null,
    };

    if (key === '') {
      return empty;
    }

    return {
      ...empty,
      [key]: value,
    };
  };

  const timeToggle = (values: any) => {
    setTimeRange(values);
    setSearchCondition({
      ...searchCondition,
      ...getCurrentTime(timeType, values),
      page: 1,
      pageSize: 20,
      recentRead: false,
      recentReply: false,
    });
  };

  const timeTypeChange = (value: string) => {
    setTimeType(value);
    setTimeRange(null);
    setSearchCondition({
      ...searchCondition,
      ...getCurrentTime('', ''),
      page: 1,
      pageSize: 20,
      recentRead: false,
      recentReply: false,
    });
  };

  const handleUpdateTimeChange = (values: any) => {
    setSearchCondition({
      ...searchCondition,
      sendTime: null,
      recentlyUpdateTime: values,
      page: 1,
      pageSize: 20,
      recentRead: false,
      recentReply: false,
    });
    edmDataTracker.trackSendBoxFilterClick(EdmSendListFilterType.UpdateTime);
  };
  // 增加debounce，缓存函数使debounce生效
  const debounceQueryChange = useCallback(
    _debounce(val => {
      setSearchCondition(val);
      edmDataTracker.trackSendBoxFilterClick(EdmSendListFilterType.Search);
    }, 300),
    []
  );
  const handleQueryChange = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== searchCondition.edmSubject) {
      debounceQueryChange({
        ...searchCondition,
        edmSubject: value,
        page: 1,
        pageSize: 20,
        recentRead: false,
        recentReply: false,
      });
    }
  };
  // 增加debounce，缓存函数使debounce生效
  const debounceContactEmailChange = useCallback(
    _debounce(val => {
      setSearchCondition(val);
      edmDataTracker.trackSendBoxFilterClick(EdmSendListFilterType.ContactEmail);
    }, 300),
    []
  );
  const handleContactEmailChange = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== searchCondition.contactEmail) {
      debounceContactEmailChange({
        ...searchCondition,
        contactEmail: value,
        page: 1,
        pageSize: 20,
        recentRead: false,
        recentReply: false,
      });
    }
  };
  const handleIsDelChange = (e: CheckboxChangeEvent) => {
    const value = e?.target?.checked;
    const isDel = value ? '-1' : '0';
    setSearchCondition({
      ...searchCondition,
      isDel,
      page: 1,
      pageSize: 20,
      recentRead: false,
      recentReply: false,
    });
    edmDataTracker.trackSendBoxFilterClick(EdmSendListFilterType.DelState);
  };

  // 点击只看新增打开，只能保留recentReply的值
  const handleRecentRead = (e: CheckboxChangeEvent) => {
    edmDataTracker.marktingEdmTaskListNewbox('read');
    const value = e?.target?.checked;
    setTimeRange(null);
    setTimeType('');
    setSearchCondition({
      ...defaultSearchCondition,
      ...(searchCondition.recentReply != null
        ? {
            recentReply: searchCondition.recentReply,
          }
        : {}),
      page: 1,
      pageSize: 20,
      recentRead: value,
    });
  };

  // 点击只查看新增回复，只能保留 recentRead 的值
  const handleRecentReply = (e: CheckboxChangeEvent) => {
    edmDataTracker.marktingEdmTaskListNewbox('reply');
    const value = e?.target?.checked;
    setTimeRange(null);
    setTimeType('');
    setSearchCondition({
      ...defaultSearchCondition,
      ...(searchCondition.recentRead != null
        ? {
            recentRead: searchCondition.recentRead,
          }
        : {}),
      page: 1,
      pageSize: 20,
      recentReply: value,
    });
  };

  const handleMarketingStateChange = (value: string) => {
    setSearchCondition({
      ...searchCondition,
      emailStatus: value,
      page: 1,
      pageSize: 20,
      recentRead: false,
      recentReply: false,
    });
    edmDataTracker.trackSendBoxFilterClick(EdmSendListFilterType.State);
  };

  const handleSecondSendFilte = (value: string) => {
    edmDataTracker.secondSendFilter(secondSendConf.find(item => item.value === value)?.text || '');
    setSearchCondition({
      ...searchCondition,
      edmMode: value,
      page: 1,
      pageSize: 20,
      recentRead: false,
      recentReply: false,
    });
  };

  const handleTaskType = (value: '0' | '1') => {
    setSearchCondition({
      ...searchCondition,
      senderMode: value,
      page: 1,
      pageSize: 20,
      recentRead: false,
      recentReply: false,
    });
  };

  const handleManagerChange = (ids: any) => {
    const newCondition = {
      ...searchCondition,
      searchAccIds: ids,
      page: 1,
      pageSize: 20,
      recentRead: false,
      recentReply: false,
    };
    setSearchCondition(newCondition);
    edmDataTracker.trackSendBoxFilterClick(EdmSendListFilterType.Manager);
  };

  const handleCronEdit = (item: EdmEmailInfo) => {
    navigate(`${routerWord}?page=write&type=cronEdit&edmEmailId=${item.edmEmailId}
      ${item.multipleContentInfo ? `&isMultiple={${item.multipleContentInfo != null}}` : ''}
      `);
  };

  // 刷新列表
  const fetchData = () => {
    // 请求
    const isAll = +activeTab === 2;
    const conditions: { [key: string]: any } = {};
    Object.keys(searchCondition).forEach(key => {
      const v = (searchCondition as any)[key];
      if (key === 'searchAccIds') {
        if (isAll && v) {
          conditions.searchAccIds = v.join(':');
        }
        return;
      }
      if (key === 'isDel') {
        if (isAll) {
          conditions.isDel = v;
        } else {
          // 非全部任务默认不查已删除
          conditions.isDel = '0';
        }
        return;
      }
      if (Array.isArray(v)) {
        conditions[key] = [v[0].startOf('day').format('yyyy.MM.DD'), v[1].endOf('day').format('yyyy.MM.DD')].join('-');
      } else if (v) {
        conditions[key] = v;
      }
    });
    // 模板管理页定制列表
    if (from === 'templateList') {
      conditions.page = 1;
      conditions.pageSize = 60;
    }
    setLoading(true);
    const _lastFetchTime = (fetchDataTimestamp = +new Date());
    let promise;
    if (isCircle) {
      if (isAll) {
        promise = edmApi.getCircleSendBoxAllPageList(conditions, {
          operator: cancelToken(),
        });
      } else {
        promise = edmApi.getCircleSendBoxPageList(conditions, {
          operator: cancelToken(),
        });
      }
    } else {
      // 可能是多域名营销和普通营销数据
      conditions.sendboxType = isSenderRotate ? 6 : 0;
      if (isAll) {
        promise = edmApi.getSendBoxAllPageList(conditions, {
          operator: cancelToken(),
        });
      } else {
        promise = edmApi.getSendBoxPageList(conditions, {
          operator: cancelToken(),
        });
      }
    }
    promise.then(
      data => {
        if (_lastFetchTime !== fetchDataTimestamp) {
          // 只响应最新请求，防止tab数据窜
          return;
        }
        const dataSource = data.sendboxList || data.batchList || [];
        if (dataSource.length) {
          setTableData(dataSource);
          setTotal(data.totalSize);
          setLoading(false);
        } else if (data.totalSize && +data.totalSize > 0 && +conditions.page > 0) {
          // 删除最后一页数据后，为避免空列表出现，请求上一页数据
          setSearchCondition({
            ...searchCondition,
            page: +conditions.page - 1,
            recentRead: false,
            recentReply: false,
          });
        } else {
          setTableData([]);
          setTotal(0);
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    setSearchCondition({
      ...searchCondition,
      page: 1,
      pageSize: 20,
      recentRead: false,
      recentReply: false,
    });
  }, [activeTaskTab]);

  // 监听url中时间和accountIds变化，刷新页面
  useEffect(() => {
    const time = qs?.sendTime ? qs.sendTime.split(',') : null;
    setSearchCondition({
      ...searchCondition,
      sendTime: time ? [moment(time[0]), moment(time[1])] : searchCondition.sendTime,
      searchAccIds: qs?.accountIds ? qs?.accountIds.split(',') : undefined,
      recentRead: false,
      recentReply: false,
    });
  }, [qs]);

  const fetchStatData = () => {
    // 如果选择了只查看新增打开或者只查看新增回复，不能去请求预览
    if (searchCondition.recentRead || searchCondition.recentReply) {
      return;
    }
    // 请求
    const isAll = +activeTab === 2;
    const conditions: { [key: string]: any } = {};
    Object.keys(searchCondition).forEach(key => {
      const v = (searchCondition as any)[key];
      if (key === 'page' || key === 'pageSize') return;

      if (key === 'searchAccIds') {
        if (isAll && v) {
          conditions.searchAccIds = v.join(':');
        }
        return;
      }
      if (key === 'isDel') {
        if (isAll) {
          conditions.isDel = v;
        } else {
          // 非全部任务默认不查已删除
          conditions.isDel = '0';
        }
        return;
      }
      if (Array.isArray(v)) {
        conditions[key] = [v[0].startOf('day').format('yyyy.MM.DD'), v[1].endOf('day').format('yyyy.MM.DD')].join('-');
      } else if (v) {
        conditions[key] = v;
      }
    });
    // 模板管理页定制列表
    if (from === 'templateList' && conditions.page) {
      conditions.page = 1;
      conditions.pageSize = 60;
    }
    const _lastStatFetchTime = (fetchStatTimestamp = +new Date());
    const promise = isAll
      ? edmApi.getSendBoxAllStatInfo(conditions, {
          operator: cancelToken(),
        })
      : edmApi.getSendBoxStatInfo(conditions, {
          operator: cancelToken(),
        });
    promise.then(data => {
      if (_lastStatFetchTime !== fetchStatTimestamp) return;

      setStatData(toStatItem(data, columnsFilter(EdmStatColumns)));
      setStatInfo(data);
    });
  };

  useEffect(() => {
    if (qs.tab) {
      const params = new URLSearchParams(location.hash.split('?')[1]);
      setActiveTab(params.get('tab') === null ? 2 : (params.get('tab') as unknown as number));
    }
  }, [locationTag]);

  useEffect(() => {
    // todo请求数据进行区分
    fetch();
  }, [searchCondition]);

  useEffect(() => {
    if (visiable) {
      edmDataTracker.trackPv(EDMPvType.SendList);
    }
  }, [visiable]);

  useEffect(() => {
    if (Number(activeTab) === 2) {
      worktableApi.getAccountRange('EDM').then(res => {
        setManagerOptions(res.principalInfoVOList);
      });
    }
  }, [activeTab]);

  const location = useLocation();

  // 缓存函数使debounce生效
  const fetch = () => {
    if (!hasEdmPermission) {
      return;
    }
    if (!visiable) {
      return;
    }
    fetchData();
    fetchStatData();
    classroomRef.current?.refresh();
  };

  const refreshTableData = () => {
    const isAll = +activeTab === 2;
    const _lastFetchTime = (fetchDataTimestamp = +new Date());
    const edmEmailIds = tableData.map(item => item.edmEmailId).join(',');
    const batchIds = tableData.map(item => item.batchId).join(',');
    let promise;
    if (isCircle) {
      promise = isAll ? edmApi.refreshCircleSendBoxAllPageList({ batchIds }) : edmApi.refreshCircleSendBoxPageList({ batchIds });
    } else {
      promise = isAll ? edmApi.refreshSendBoxAllPageList({ edmEmailIds }) : edmApi.refreshSendBoxPageList({ edmEmailIds });
    }
    promise.then(data => {
      if (_lastFetchTime !== fetchDataTimestamp) return;

      const dataSource = data.sendboxList || data.batchList;
      const uniqKey = isCircle ? 'batchId' : 'edmEmailId';
      const refreshedDataMap: { [edmEmailId: string]: EdmEmailInfo } = dataSource.reduce(
        (accumulator, item) => ({
          ...accumulator,
          [item[uniqKey]]: item,
        }),
        {}
      );

      const nextTableData = tableData.map(item => refreshedDataMap[item[uniqKey]] || item);

      setTableData([...nextTableData]);
    });
  };

  // const whetherShowRewardTaskModal = (data: EdmRewardTaskStateResp) => {
  //   const displayedNotJoinModal = storeApi.getSync(REWARD_TASK_NOT_JOIN_MODAL)?.data;
  //   const displayedJoinedModal = storeApi.getSync(REWARD_TASK_JOINED_MODAL)?.data;
  //   if (data.state === 0 && displayedNotJoinModal !== 'true') {
  //     // 活动进度是未领取且未展示过说明弹窗，显示弹窗Modal
  //     storeApi.putSync(REWARD_TASK_NOT_JOIN_MODAL, 'true');
  //     setRewardTaskStateResp(data);
  //     setShowRewardTaskModal(true);
  //   } else if (data.state === 3 && displayedJoinedModal !== 'true') {
  //     // 活动进度是已领取且未展示过恭喜弹窗，显示弹窗Modal
  //     storeApi.putSync(REWARD_TASK_JOINED_MODAL, 'true');
  //     setRewardTaskStateResp(data);
  //     setShowRewardTaskModal(true);
  //   } else {
  //     // 活动进度是无权限、不可见或其他活动进度不显示福利Modal
  //     setShowRewardTaskModal(false);
  //   }
  // };

  // const requestRewardTaskState = () => {
  //   edmApi
  //     .getRewardTaskState()
  //     .then(data => {
  //       whetherShowRewardTaskModal(data);
  //       // 活动进度状态-1：无权限不做缓存，无权限会变为有权限状态
  //       if (data.state !== -1) {
  //         storeApi.putSync(REWARD_TASK_RESP_CACHE, JSON.stringify(data));
  //       }
  //     })
  //     .catch(() => {
  //       setShowRewardTaskModal(false);
  //     })
  //     .finally(() => {});
  // };

  // useEffect(() => {
  //   if (location.hash === '#edm' || location.hash.startsWith('#edm?page=index')) {
  //     const stateResp = storeApi.getSync(REWARD_TASK_RESP_CACHE)?.data;
  //     if (stateResp) {
  //       const data = JSON.parse(stateResp);
  // 进度随时会更新为3已领取奖励状态，需要请求服务端，有如下两种场景
  // 场景1：当前活动进度2：活动已结束
  // 场景2：当前时间大于活动结束时间
  // const currentDate = Date.now();
  // if (data.state === 4) {
  //         return;
  //       } else if (data.state === 2 || currentDate > data.expireTimestamp) {
  //   requestRewardTaskState();
  // } else {
  // whetherShowRewardTaskModal(data);
  //       }
  //     } else {
  //       requestRewardTaskState();
  //     }
  //   }
  // }, [location.hash]);

  useEffect(() => {
    if (location.hash === routerWord || location.hash.startsWith(`${routerWord}?page=index`)) {
      const duration = 60 * 1000;

      const timer = setInterval(() => {
        fetchStatData();
        refreshTableData();
      }, duration);

      return () => clearInterval(timer);
    }
  }, [location.hash, fetchStatData, refreshTableData]);

  useEffect(() => {
    if (qs && qs.transId) {
      const id = parseInt(qs.transId, 10) as number;
      const transExist = sentryReportApi.getTransById(id);
      if (transExist) sentryReportApi.endTransaction({ id });
    }
    if (location.hash.includes(routerWord)) {
      const qs1 = queryString.parse(location.hash.replace(routerWord, ''));
      if (location.hash.includes('detailId') && qs1.detailId) {
        setDetailProp({
          visible: true,
          qs: {
            edmEmailId: qs1.detailId as string,
            page: 'detail',
            id: qs1.detailId as string,
            owner: 'true',
            isParent: qs1.isParent as string,
          },
          index: 0,
        });
      } else if (location.hash.includes('transId') && qs1.transId) {
        const id = parseInt((qs1.transId || '0') as string, 10) as number;
        sentryReportApi.getTransById(id) && sentryReportApi.endTransaction({ id });
      }
    }
  }, [location]);

  const handleAddNew = (pageName: string) => {
    edmDataTracker.trackSendListOperation(EdmSendListOperateType.NewObject, {
      buttonname: pageName === 'write' ? getIn18Text('XINJIANPUTONGRENWU') : getIn18Text('XINJIANFENPIRENWU'),
    });
    navigate(`${routerWord}?page=${pageName}`);
  };
  const handelCoverImageClick = (item: EdmEmailInfo) => {
    edmDataTracker.trackSendListOperation(EdmSendListOperateType.ViewThumbnail, {
      buttonname: getIn18Text('CHAKANSUOLVETU'),
    });
    handlePreviewImage(item.emailThumbnail, item.edmSubject);
  };

  // table每一行数据
  const renderTableRowData = (item: EdmEmailInfo) => {
    const confs: Array<{
      detailIndex: number;
      icon: any;
      title: string;
      key: keyof EdmEmailInfo;
      detailKey: DetailTabOption;
      unSendShow?: true;
    }> = [
      {
        detailIndex: 0,
        icon: MoreIcon1,
        title: getIn18Text('YINGXIAORENSHU'),
        key: 'contactsCount',
        detailKey: DetailTabOption.Marketing,
        unSendShow: true,
      },
      {
        detailIndex: 0,
        icon: MoreIcon0,
        title: getIn18Text('FAJIANZONGSHU'),
        key: 'sendCount',
        detailKey: DetailTabOption.Receiver,
      },
      {
        detailIndex: 2,
        icon: MoreIcon3,
        key: 'arriveCount',
        title: getIn18Text('SONGDAZONGSHU'),
        detailKey: DetailTabOption.Sended,
      },
      {
        detailIndex: 3,
        icon: MoreIcon4,
        key: readCountKey === getIn18Text('DAKAIRENSHU') ? 'readCount' : 'readNum',
        title: readCountKey,
        detailKey: DetailTabOption.Open,
      },
      {
        detailIndex: 4,
        icon: MoreIcon5,
        key: 'replyCount',
        title: getIn18Text('HUIFUZONGSHU'),
        detailKey: DetailTabOption.Reply,
      },
    ];

    return confs.map(conf => {
      const Comp = conf.icon;
      return (
        <span className={style.left24} onClick={() => openTabDetail(item, conf.detailKey)} key={conf.key}>
          <Comp className={style.highlightIcon} />
          <span className={style.highlightText}>{conf.title}</span>
          <span className={style.highlight}>
            {item.emailStatus === 0 && !conf.unSendShow ? '-' : item[conf.key]}
            {from === 'list' && conf.detailIndex === 3 && !!item.recentReadCount && <span className={style.markData}>+{Math.min(999, item.recentReadCount!)}</span>}
            {from === 'list' && conf.detailIndex === 4 && !!item.recentReplyCount && <span className={style.markData}>+{Math.min(999, item.recentReplyCount!)}</span>}
            {/* {(conf.detailIndex === 3 || conf.detailIndex === 4) && <span className={style.markData}>+1</span>} */}
          </span>
        </span>
      );
    });
  };
  // table 每一行时间
  const renderTableRowTime = (item: EdmEmailInfo) => {
    const { emailStatus } = item;
    const confs: Array<{
      title: string;
      key: keyof EdmEmailInfo;
      needTimeZone?: boolean;
      timeZoneKey?: keyof EdmEmailInfo;
      status: Array<number>;
      toolTip?: JSX.Element;
    }> = [
      {
        title: getIn18Text('CHUANGJIANSHIJIAN'),
        key: 'createTime',
        status: [0, 1, 2, 3, 4],
      },
      {
        title: getIn18Text('KAISHIFASONG'),
        key: 'sendTime',
        needTimeZone: true,
        timeZoneKey: 'sendTimeZone',
        status: [0, 1, 2],
      },
      {
        title: getIn18Text('YUJIWANCHENG'),
        key: 'expectCompleteTime',
        status: [0, 1],
      },
      {
        title: getIn18Text('FASONGWANCHENG'),
        key: 'completeTime',
        status: [2],
      },
      {
        title: getIn18Text('ZUIJINGENGXIN'),
        key: 'recentlyUpdateTime',
        status: [0, 1, 2],
        toolTip: (
          <Tooltip title={'任务的发送及保存、打开数/回复数/退订数/点击数有变化时均会更新及记录时间'}>
            <ExplanationIcon style={{ marginLeft: 8, marginBottom: '-4px' }} />
          </Tooltip>
        ),
      },
    ];

    return confs.map(conf => {
      const times = timeFormat(item[conf.key] as string).split(' ');
      return (
        <>
          {item[conf.key] != null && conf.status.includes(emailStatus) ? (
            <span key={conf.key} className={style.sendTimeItem}>
              <span>{conf.title}：</span>
              {conf.needTimeZone && <>{`${timeZoneMap[item[conf.timeZoneKey!] as string]?.split('：')[0] || ''} `}</>}
              <span>{times[0]}</span>
              <span className={style.secondsTime}>{times[1]}</span>
              {conf.toolTip}
            </span>
          ) : null}
        </>
      );
    });
  };

  const renderTableItemState = (status: { statusKey: string; statusName: string; showPercent: string | false; percent: string }) => {
    const { statusKey, statusName, showPercent, percent } = status;

    let type = 'label-6-1';
    switch (statusKey) {
      case 'sending':
        type = 'warning-6';
        break;
      case 'trash':
        type = 'label-6-1';
        break;
      case 'canceled':
        type = 'label-6-1-2';
        break;
      case 'error':
        type = 'error-6';
        break;
      case '0':
        type = 'brand-6';
        break;
      case '2':
        type = 'success-6';
        break;
    }

    return (
      <>
        {statusName && (
          <span className={`${style.tableStateWrap}`}>
            <Tag type={type as any}>
              {statusName}
              {showPercent ? `...${percent}%` : ''}
            </Tag>
          </span>
        )}
      </>
    );
  };

  // 列表标签
  const renderTableTag = (item: EdmEmailInfo) => {
    // todo标签整理为按需添加
    return (
      <>
        {item.emailStatus === 3 && (
          <span className={`${style.tableItemIcon}`}>
            <Tooltip placement="topLeft" title={item.failReason}>
              <InfoCircleOutlined />
            </Tooltip>
          </span>
        )}
        {item.sendboxType === 1 && <span className={`${style.tableItemState} batch`}>{getIn18Text('XUNHUANFASONG')}</span>}
        {item.isDel === 1 && <span className={`${style.tableItemState} state-3`}>{getIn18Text('YISHANCHU')}</span>}
        {/* 安全发信 */}
        {item.sendStrategyOn && (
          <span className={`${style.tableStateWrap}`}>
            <Tag type="label-4-1">安全发信</Tag>
          </span>
        )}
        {/* 二次营销 */}
        {item.subList != null && item.subList.length > 0 && (
          <span className={`${style.tableStateWrap}`}>
            <Tag type="label-1-1">{'多轮营销'}</Tag>
          </span>
        )}
        {/* 多版本 */}
        {/* {item.multipleContentInfo != null && <div className={classnames(style.tableItemTag2, style.tableItemTagMultiple)}>千邮千面</div>} */}
        {item.multipleContentInfo != null && (
          <span className={`${style.tableStateWrap}`}>
            <Tag type="label-2-1">千邮千面</Tag>
          </span>
        )}
        {/* 多域名营销tag */}
        {item.senderMode === 1 && (
          <span className={`${style.tableStateWrap}`}>
            <Tag type="label-3-1" hideBorder>
              多发件地址
            </Tag>
          </span>
        )}
      </>
    );
  };

  // 计算营销进度 舍弃百分比后的小数
  const getPercent = (item: EdmEmailInfo) => {
    let percentNumber = 0;
    let totalContactsCount = item.receiverCount || 0;
    let totalSendCount = item.sendCount;
    // 是否有营销人数为空的子任务，这种情况下如果percentNumber>=100时不展示百分比
    let emptySub = false;
    // 无有二次营销 进度 = 已经发送 / 过滤后营销人数
    // 有二次营销 进度 = （父任务已经发送 + 二次营销已经发送） /（父任务过滤后营销人数 + 二次营销过滤后营销人数）
    if (item.subList && item.subList.length > 0) {
      totalContactsCount = 0;
      totalSendCount = 0;
      item.subList.forEach(itm => {
        if (item.emailStatus !== 4) {
          totalContactsCount += itm.receiverCount || 0;
          totalSendCount += itm.sendCount || 0;
        }
        if (itm.receiverCount === 0) {
          emptySub = true;
        }
      });
    }
    percentNumber = (totalSendCount * 100) / totalContactsCount;
    // 意外情况取100
    percentNumber = percentNumber >= 100 ? 100 : percentNumber;
    if ((percentNumber >= 100 && emptySub) || !totalContactsCount) {
      return '';
    }
    // 任务进度正常情况直接向上取整，但是向上取整为100的情况例如99.1则向下取整
    const ceilNumber = Math.ceil(percentNumber);
    const floorNumber = Math.floor(percentNumber);
    percentNumber = percentNumber <= 99 ? ceilNumber : floorNumber;
    return percentNumber + '';
  };

  const afterClick = () => {
    // 调接口
    const promise = +activeTab === 1 ? edmApi.setHostingStatus({ edmEmailId: curtEdmEmailId }) : edmApi.setAllHostingStatus({ edmEmailId: curtEdmEmailId });
    promise.then(res => {
      refreshTableData();
    });
  };

  const renderEntryBtn = (item: EdmEmailInfo) => (
    <Button
      disabled={item.hostingStatus !== 0}
      onClick={() => {
        edmApi
          .getParentDetail({
            edmEmailId: item.edmEmailId,
            hideAutoReply: false,
          })
          .then(res => {
            const arriveList: any = res.arriveList.map(contact => ({
              ...contact,
              increaseSourceName: '邮件营销任务',
            }));
            setAiMarketingEnterContacts(arriveList);
            setCurtEdmEmailId(item.edmEmailId);
          });
      }}
      size="small"
      btnType="default"
    >
      {item.hostingStatus === 0 ? '营销托管' : '已托管'}
    </Button>
  );

  const columns: ColumnType<EdmEmailInfo>[] = [
    // {
    //   key: 'emailThumbnail',
    //   dataIndex: 'emailThumbnail',
    //   width: 92,
    //   render: (src: string | undefined, item) => {
    //     const images = (item.emailThumbnail || '').split(',');
    //     // 分批任务的子任务不展示封面
    //     // if (isCircle && !item.batchId) {
    //     //     return null;
    //     // }
    //     return (
    //       // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    //       <img
    //         src={images[0] || defaultImg}
    //         style={{ width: 72, height: 72, marginRight: 0 }}
    //         alt={item.edmSubject}
    //         className={style.coverImage}
    //         onClick={() => handelCoverImageClick(item)}
    //       />
    //     );
    //   }
    // },
    {
      title: '',
      dataIndex: '',
      key: 'edmSubject',
      ellipsis: true,
      className: style.contentColumn,
      render(__: any, item) {
        console.log('[marketing-trans]', qs);

        const status = transformStatus(item.emailStatus);
        // const key: 'readCount' | 'readNum' = readCountKey === '打开人数' ? 'readCount' : 'readNum';
        const percent = getPercent(item);
        const showPercent = item.emailStatus === 1 && percent;
        const images = (item.emailThumbnail || '').split(',');
        return (
          <div className={style.contentWrap}>
            <img
              src={images[0] || defaultImg}
              style={{ width: 72, height: 72 }}
              alt={item.edmSubject}
              className={style.coverImage}
              onClick={() => handelCoverImageClick(item)}
            />
            <div className={style.tableContent2}>
              <div className={style.mainTitle}>
                <span className={style.tableItemName}>{item.edmSubject}</span>
                {item.traceLinks && item.traceLinks.length > 0 && (
                  <Dropdown overlay={() => renderTraceLinkPopup(item.edmEmailId)} destroyPopupOnHide>
                    <span className={style.linkTraceEntry}>
                      <span>
                        <LinkTraceSvg />
                      </span>
                      <span>{getIn18Text('FANGWEN')}</span>
                    </span>
                  </Dropdown>
                )}
                {/* {status.statusName && status.statusKey !== 'canceled' && (
                  <span className={`${style.tableItemState} ${status.statusKey}`}>
                    {status.statusName}
                    {showPercent ? `...${percent}%` : ''}
                  </span>
                )}
                {status.statusName && status.statusKey === 'canceled' && (
                  <span className={`${style.tableStateWrap}`}>
                    <Tag type="label-1-1">已撤销</Tag>
                  </span>
                )} */}
                {renderTableItemState({
                  ...status,
                  showPercent,
                  percent,
                })}

                {renderTableTag(item)}
              </div>

              <div className={style.mailState}>
                {/* todo详情传参 */}
                {renderTableRowData(item)}

                {/* todo 需要修改打开详情的传参 */}
                {/* <span onClick={() => openTabDetail(item, 0)}>
                <MoreIcon1 className={style.highlightIcon} />
                <span className={style.highlightText}>营销人数</span>
                <span className={style.highlight}>{item.emailStatus === 0 ? '-' : item.sendCount}</span>
              </span>
              <span className={style.left24} onClick={() => openTabDetail(item, 0)}>
                <MoreIcon1 className={style.highlightIcon} />
                <span className={style.highlightText}>{getIn18Text('SHOUJIANRENSHU')}</span>
                <span className={style.highlight}>{item.emailStatus === 0 ? '-' : item.sendCount}</span>
              </span> */}
                {/* <span className={style.left24} onClick={() => openTabDetail(item, 1)}>
                                <MoreIcon2 className={style.highlightIcon}/>
                                <span className={style.highlightText}>{getIn18Text("FASONG")}</span>
                                <span className={style.highlight}>
                                    {item.emailStatus === 0 ? '-' : item.sendCount}
                                </span>
                            </span> */}
                {/* <span className={style.left24} onClick={() => openTabDetail(item, 2)}>
                <MoreIcon3 className={style.highlightIcon} />
                <span className={style.highlightText}>送达人数</span>
                <span className={style.highlight}>{item.emailStatus === 0 ? '-' : item.arriveCount}</span>
              </span>
              <span className={style.left24} onClick={() => openTabDetail(item, 3)}>
                <MoreIcon4 className={style.highlightIcon} />
                <span className={style.highlightText}>{'打开人数'}</span>
                <span className={style.highlight}>{item.emailStatus === 0 ? '-' : item[key]}</span>
              </span>
              <span className={style.left24} onClick={() => openTabDetail(item, 4)}>
                <MoreIcon5 className={style.highlightIcon} />
                <span className={style.highlightText}>{'回复人数'}</span>
                <span className={style.highlight}>{item.emailStatus === 0 ? '-' : item.replyCount}</span>
              </span> */}
                {/* <span className={style.left24} onClick={() => openTabDetail(item, 5)}>
                <MoreIcon6 className={style.highlightIcon} />
                <span className={style.highlightText}>{'退订人数'}</span>
                <span className={style.highlight}>{item.emailStatus === 0 ? '-' : item.unsubscribeCount}</span>
              </span> */}
              </div>
              {/* 时间区域 */}
              <div className={style.sendTime}>
                {renderTableRowTime(item)}

                {/* <span>
                <span>{getIn18Text('FASONGSHIJIAN')}</span>
                {`${timeZoneMap[item.sendTimeZone]?.split('：')[0]} `}
                {item.sendTime}
                {`(${getWeekdayWithTimeZoneOffset(moment(item.sendTime.replace(' ', 'T') + item.sendTimeZone), item.sendTimeZone)})`}
              </span> */}
                {/* <span>
                <span>{getIn18Text('ZUIJINGENGXIN')}</span>
                {item.recentlyUpdateTime}
              </span> */}
                {/* <Tooltip
                  title={'任务的发送及保存、打开数/回复数/退订数/点击数有变化时均会更新及记录时间'}
                >
                  <QuestionCircleOutlined style={{ marginLeft: 8, color: '#7D8085' }} />
                </Tooltip> */}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: '',
      dataIndex: '',
      width: 1,
      key: 'recentlyUpdateTime',
      className: style.actionColumn,
      render(_: string, item: EdmEmailInfo) {
        const hasDelPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'EDM', 'DELETE'));
        const hasOperation = hasDelPermisson || (item.emailStatus === 0 && item.sendType === 2 && item.sendboxType === 0) || item.emailStatus === 0;
        return (
          <div className={style.rowRight} key={item.edmEmailId}>
            <a onClick={() => openDetail(item)}>{getIn18Text('XIANGQING')}</a>
            {from === 'list' && !item.batchId && item.isDel != 1 && item.level != 2 && (
              <PrivilegeCheck accessLabel="OP" resourceLabel="EDM">
                {/* loading={curActionId == item.id} */}
                <a onClick={() => handleCopy(item)}>{getIn18Text('FUZHI')}</a>
              </PrivilegeCheck>
            )}
            {from === 'templateList' && (
              <a
                onClick={() => {
                  saveTemplate && saveTemplate(item.edmEmailId);
                }}
              >
                {saveTemplateTxt}
              </a>
            )}
            {/* 撤销操作，待发送的二次营销任务 */}
            {item.level === 2 && [0, 1].includes(item.emailStatus) && <a onClick={() => handleRevert(item)}>撤销</a>}
            {/* 托管营销入口：1. 模板弹窗不能展示 */}
            {from === 'list' && activeTaskTab === '0' && item.level !== 2 && item.arriveCount > 0 && item.emailStatus === 2 && (
              // 渲染这么多次，怎么能使用ref呢？ref每次都指向了最后一次！！！
              <AiMarketingEnter
                key={item.edmEmailId}
                ref={aiMarketingEnterRef}
                contacts={aiMarketingEnterContacts}
                btnType="default"
                text="营销托管"
                handleType="normal"
                afterCompleteClick={() => afterClick()}
                trackFrom="listTask"
                renderBtn={() => (
                  <>
                    {item.hostingStatus === 0 ? <Tooltip title="对已送达联系人自动进行多轮邮件营销，提升回复率">{renderEntryBtn(item)}</Tooltip> : renderEntryBtn(item)}
                  </>
                )}
              />
            )}
            {from === 'list' && item.level != 2 && (
              <div className={style.rightTopOp}>
                <>
                  {from === 'list' && hasOperation && !item.batchId && item.isDel != 1 && (
                    <PrivilegeCheck accessLabel="OP|DELETE" resourceLabel="EDM">
                      <Popover getPopupContainer={node => node} content={renderOverlay(item)} placement="bottomRight" trigger="click" overlayClassName="hide-arrow">
                        <span>
                          <MoreActionIcon />
                        </span>
                      </Popover>
                    </PrivilegeCheck>
                  )}
                </>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  // 获取模板列表页列表
  const getColumns = (): ColumnType<EdmEmailInfo>[] => {
    return [
      {
        title: '',
        dataIndex: 'empty',
        width: 40,
      },
      ...columns,
    ];
  };

  // 获取展开配置
  const getExpandableConf = (): ExpandableConfig<EdmEmailInfo> => {
    if (!isCircle) {
      // return {
      //   expandedRowRender: (record) => <p style={{ margin: 0 }}>{'测试测试'}</p>,
      //   rowExpandable: (record) => true,
      // };
      return {
        defaultExpandAllRows: true,
        childrenColumnName: 'subList',
        onExpandedRowsChange: setExpandedRowKeys,
        columnWidth: 44,
        expandIcon: ({ expanded, onExpand, record }) => {
          if (record.subList == null || record.subList.length === 0) {
            return null;
          }
          return <UpLine className={expanded ? style.expanded : style.collapse} onClick={e => onExpand(record, e)} />;
        },
      };
    }

    return {
      defaultExpandAllRows: true,
      childrenColumnName: 'sendboxList',
      onExpandedRowsChange: setExpandedRowKeys,
      columnWidth: 44,
      expandIcon: ({ expanded, onExpand, record }) => {
        if (!record.hasOwnProperty('sendboxList')) {
          return null;
        }
        return <UpLine className={expanded ? style.expanded : style.collapse} onClick={e => onExpand(record, e)} />;
      },
    };
  };

  const renderOverlay = (item: EdmEmailInfo) => {
    return (
      <div className={style.popoverContent}>
        {/* 发送中的不能删除 */}
        <PrivilegeCheck accessLabel="DELETE" resourceLabel="EDM">
          {item.emailStatus !== 1 && (
            <div onClick={() => handleDelete(item)} className={style.popoverContentTitle}>
              {getIn18Text('SHANCHU')}
            </div>
          )}
        </PrivilegeCheck>
        <PrivilegeCheck accessLabel="OP" resourceLabel="EDM">
          {/* <div onClick={() => handleCopy(item)} className={style.popoverContentTitle}>复制</div> */}
          {item.emailStatus === 0 && item.sendType === 2 && item.sendboxType === 0 && (
            <div className={style.popoverContentTitle} onClick={() => handleCronEdit(item)}>
              {getIn18Text('XIUGAI')}
            </div>
          )}
          {/* 待发送和发送中的支持撤销 */}
          {[0, 1].includes(item.emailStatus) && (
            <div className={style.popoverContentTitle} onClick={() => handleRevert(item)}>
              {getIn18Text('CHEXIAO')}
            </div>
          )}
        </PrivilegeCheck>
      </div>
    );
  };
  const rowSelection = {
    selectedRowKeys,
    // checkStrictly: false,
    preserveSelectedRowKeys: true,
    onChange: (keys: any[]) => {
      setSelectedRowKeys(keys);
    },
    getCheckboxProps: (record: any) => ({
      disabled: record.isChild === 'true', // Column configuration not to be checked
      // name: record.level,
    }),
  };
  const onCheckAllChange = (e: CheckboxChangeEvent) => {
    setSelectedRowKeys(e.target.checked ? flattenTableData.map(i => String(i.edmEmailId || i.batchId)) : []);
  };
  const showConfirmDelete = (onOk: () => void) => {
    SiriusModal.confirm({
      title: getIn18Text('SHIFOUQUERENSHANCHU'),
      okText: getIn18Text('SHANCHU'),
      onOk,
    });
  };
  const handleDelete = (item: EdmEmailInfo) => {
    showConfirmDelete(() => {
      edmDataTracker.trackSendListOperation(EdmSendListOperateType.Delete, {
        buttonname: getIn18Text('SHANCHU'),
      });
      edmApi.delFromSendBox({ edmEmailIds: item.edmEmailId as string }).then((data: any) => {
        if (data.success) {
          setSelectedRowKeys(previous => previous.filter(edmEmailId => edmEmailId !== item.edmEmailId));
          fetch();
        } else {
          toast.error({ content: data?.message || getIn18Text('SHANCHUSHIBAI') });
          console.log('[toast]', data.message);
        }
      });
    });
  };
  const handleBatchDelete = (ids: string[]) => {
    // 过滤掉可能是分批任务的父任务数据
    ids = ids.filter(id => !tableData.some(row => row.batchId === id));
    showConfirmDelete(() => {
      edmDataTracker.trackSendListOperation(EdmSendListOperateType.Delete, {
        buttonname: getIn18Text('PILIANGSHANCHU'),
      });
      edmApi.delFromSendBox({ edmEmailIds: ids.join(',') }).then((data: any) => {
        if (data.success) {
          setSelectedRowKeys([]);
          fetch();
        } else {
          toast.error({ content: data?.message || getIn18Text('SHANCHUSHIBAI') });
        }
      });
    });
  };

  // 复制回调
  const handleCopy = (item: EdmEmailInfo) => {
    const transId = sentryReportApi.startTransaction({
      name: 'marketing_sendtask_copy',
      op: 'click',
    });
    edmDataTracker.trackSendListOperation(EdmSendListOperateType.Copy, {
      buttonname: getIn18Text('FUZHIRENWU'),
    });
    setCurActionId(item.id + '');
    setCopyLoading(true);
    handleCopyDraft(item.edmEmailId, item, transId).finally(() => {
      setCopyLoading(false);
      setCurActionId('');
    });
  };
  const handleRevert = (item: EdmEmailInfo) => {
    SiriusModal.confirm({
      title: getIn18Text('QUEDINGYAOCHEXIAOMA'),
      okText: getIn18Text('CHEXIAO'),
      onOk: () => {
        edmDataTracker.trackSendListOperation(EdmSendListOperateType.Revert, {
          buttonname: getIn18Text('CHEXIAO'),
        });
        edmApi
          .revertFromSendBox({ edmEmailId: item.edmEmailId })
          .then(() => {
            fetch();
          })
          .catch(err => {
            console.log(err);
            if (err && err.code === 430) {
              return message.error('无可撤销邮件');
            }
            onHttpError(err);
          });
      },
    });
  };
  const openDetail = (item: EdmEmailInfo) => {
    edmDataTracker.trackSendListOperation(EdmSendListOperateType.Detail, {
      buttonname: getIn18Text('FUZHIRENWU'),
    });
    const qs: Record<string, string | number> = {
      page: 'detail',
      id: String(item.batchId || item.edmEmailId),
    };

    // 父任务
    if (item.subList) {
      qs.parent = 'true';
    }

    if (item.batchId != null) {
      qs.batchId = item.batchId;
    }

    if (item.level) {
      qs.level = item.level;
    }

    if (item.batchId) {
      qs.circle = 'true';
    }

    if (+activeTaskTab === 1) {
      qs.loop = 'true';
    }

    if (+activeTab === 1) {
      qs.owner = 'true';
    }

    if (item.edmEmailId) {
      qs.edmEmailId = item.edmEmailId;
    }

    if (from === 'templateList') {
      // 模板列表详情跳转
      toDetail && toDetail({ ...qs, target: DetailTabOption.Marketing });
    } else {
      // 详情页返回需要保留列表分页以及滚动状态，详情页改为在本页面展示
      setDetailProp({ visible: true, qs });
    }
  };
  const openTabDetail = (item: EdmEmailInfo, target: DetailTabOption) => {
    const qs: Record<string, string | number> = {
      page: 'detail',
      id: String(item.batchId || item.edmEmailId),
    };

    // 父任务
    if (item.subList) {
      qs.parent = 'true';
    }

    if (item.level) {
      qs.level = item.level;
    }

    if (item.batchId != null) {
      qs.batchId = item.batchId;
    }

    if (item.batchId) {
      qs.circle = 'true';
    }
    if (+activeTab === 1) {
      qs.owner = 'true';
    }
    if (+activeTaskTab === 1) {
      qs.loop = 'true';
    }

    if (item.edmEmailId) {
      qs.edmEmailId = item.edmEmailId;
    }
    if (from === 'templateList') {
      // 模板列表详情跳转
      toDetail && toDetail({ ...qs, target });
    } else {
      // 详情页返回需要保留列表分页以及滚动状态，详情页改为在本页面展示
      setDetailProp({ visible: true, qs, target });
    }
  };

  // 选择任务拦截器
  const selectInterceptor = useCallback(
    callback => {
      if (selectedRowKeys.length === 0) {
        return toast.warning({
          content: getIn18Text('QINGXIANXUANZERENWU!'),
        });
      }
      callback();
    },
    [selectedRowKeys]
  );

  // 生成报告
  const generateReport = useCallback(async () => {
    // 埋点
    edmDataTracker.generateReportClick(selectedRowKeys.length);

    // todo发送请求
    try {
      const result = await edmApi.generateReport({
        edmEmailIds: selectedRowKeys,
      });
      if (inElectron()) {
        // todo 桌面端待验证
        systemApi.createWindow({
          type: 'marketingDataViewer',
          additionalParams: {
            id: result.dataReportId,
            count: selectedRowKeys.length,
          },
        });
      } else {
        if (systemApi.getContextPath().includes('https')) {
          window.open(`${systemApi.getContextPath()}/marketingDataViewer/?id=${result.dataReportId}&count=${selectedRowKeys.length}`);
        } else {
          window.open(`${location.origin}/marketingDataViewer/?id=${result.dataReportId}&count=${selectedRowKeys.length}`);
        }
      }
    } catch (err) {
      toast.error(err.message || '未知原因，请重试');
    }
  }, [selectedRowKeys]);

  useEffect(() => {
    const topItem = tableData.find((item, index) => {
      // 排除 待发送、发送中、撤销
      return index >= tableHeaderTitle && item.emailStatus !== 0 && item.emailStatus !== 1 && item.emailStatus !== 4;
    });
    topItem && setTopItem(topItem);
  }, [tableHeaderTitle, tableData]);
  const isOwner = useAppSelector(state => isOwnerDataPrivilegeSelector(state.privilegeReducer, 'EDM'));
  const tabs = isOwner || inFFMS ? [getIn18Text('WODERENWU')] : [getIn18Text('WODERENWU'), getIn18Text('QUANBURENWU')];
  const [sendCount, setSendCount] = useState<ResponseReservedCount | null>(null);
  const fetchSendCount = () => {
    edmApi.getSendCount().then(data => {
      setSendCount(data);
    });
  };

  // 顶部tab切换
  const handleChangeActiveTab = (nextActiveTab: number) => {
    setActiveTab(nextActiveTab);
    setSearchCondition({ ...defaultSearchCondition, isDel: searchCondition.isDel });
    setTimeRange(null);
    setTimeType('');
    setSelectedRowKeys([]);
  };

  // 营销建议相关逻辑
  const handleMarketingSuggestModal = (type: 'none' | 'once') => {
    eventApi.sendSysEvent({
      eventName: 'displayMarketingModal',
      eventData: { modalKey: SUGGEST_MODAL },
    });
    edmDataTracker.track('pc_markting_edm_list_edmGuide_click', { type });
  };
  const fetchMarketingSuggest = async () => {
    const result = await edmApi.getMarketingSuggest();
    if (result) {
      setMarketingSuggestData({
        show: !!result.available,
        data: (result.marketing0 || result.marketing1) as MarketingSuggestResMarketing,
        unMarketing: !!result.marketing0,
      });
    }
  };
  const MarketingSuggestComp = () => {
    // 接口未查询到营销建议数据、未命中未营销、未命中一次营销均不展示该入口
    return marketingSuggestData?.show ? (
      // 点击弹出营销建议弹窗
      <div className={style.marketingSuggest} onClick={() => handleMarketingSuggestModal(marketingSuggestData.unMarketing ? 'none' : 'once')}>
        <MarketingSuggestIcon />
        <span className={style.marketingSuggestTitle}>营销推荐</span>
        {/* 命中策略的地址总量，需按地址去重 */}
        <span>
          {lodashGet(marketingSuggestData, 'data.full.0.count', 0)}个联系人{marketingSuggestData.unMarketing ? '未营销' : '仅营销1次'}
        </span>
        <TongyongJianTouYou />
      </div>
    ) : (
      <></>
    );
  };

  const renderDiagnosisCount = () => {
    if (!hasRead && diagnosisDetail && diagnosisDetail.lastPeriodAccSendCount != null) {
      if (diagnosisDetail.lastPeriodAccSendCount < 4000) {
        return <div className={style.diagnosisCount}>1</div>;
      }
      return <>{diagnosisDetail.diagnosisList.length > 0 && <div className={style.diagnosisCount}>{diagnosisDetail.diagnosisList.length}</div>}</>;
    }
    return null;
  };

  const CreateEdmTaskButtonComp = () => {
    return (
      <>
        {!showGuide && (
          <Button
            className={style.diagnosisBtn}
            btnType="minorLine"
            onClick={() => {
              setShowDiagnosis(true);
              // edmDataTracker.taskDiagnosisClick();
              // 记录一下hash
              navigate(`${location.hash}&zhenduanentry=true`);
            }}
          >
            诊断与建议
            {renderDiagnosisCount()}
          </Button>
        )}
        <PrivilegeCheck accessLabel="OP" resourceLabel="EDM">
          <Button
            btnType="primary"
            className={classnames('ant-btn-wide', 'sirius-no-drag', style.dropdownButton)}
            style={{ float: 'right', minWidth: 'auto', marginLeft: 0 }}
            onClick={() => handleAddNew('write')}
          >
            {getIn18Text('XINJIANRENWU')}
          </Button>
        </PrivilegeCheck>
      </>
    );
  };

  const TaskListFilterComp = () => {
    return (
      <div ref={filterBlock} className={style.filterBlock}>
        <Space wrap={false}>
          {/* <RangePicker
            separator=" - "
            style={{ width: 186 }}
            className={searchCondition.sendTime ? '' : 'edm-range-picker'}
            placeholder={[getIn18Text('FASONGSHIJIAN'), '']}
            locale={cnlocale}
            value={searchCondition.sendTime}
            format={dateFormat}
            onChange={handleSendTimeChange}
            disabledDate={disabledDateFuture}
            dropdownClassName="edm-date-picker-dropdown-wrap"
          />
          <RangePicker
            separator=" - "
            style={{ width: 186 }}
            className={searchCondition.recentlyUpdateTime ? '' : 'edm-range-picker'}
            placeholder={[getIn18Text('ZUIJINGENGXINSHIJIAN'), '']}
            locale={cnlocale}
            value={searchCondition.recentlyUpdateTime}
            format={dateFormat}
            onChange={handleUpdateTimeChange}
            disabledDate={disabledDate}
            dropdownClassName="edm-date-picker-dropdown-wrap"
          /> */}
          <div tabIndex={0} className={style.dateWrap}>
            <Select
              suffixIcon={<DownTriangle />}
              style={{
                height: 32,
              }}
              value={timeType}
              dropdownClassName="edm-selector-dropdown"
              onChange={timeTypeChange as any}
            >
              {TimeSelectConf.map(conf => (
                <Select.Option key={conf.key} value={conf.key}>
                  {conf.label}
                </Select.Option>
              ))}
            </Select>
            <div className={style.splitLine}></div>
            <RangePicker
              separator=""
              style={{ width: 272, height: 32 }}
              // className={searchCondition.recentlyUpdateTime ? '' : 'edm-range-picker'}
              placeholder={[getIn18Text('KAISHISHIJIAN'), getIn18Text('JIESHUSHIJIAN')]}
              locale={cnlocale}
              value={timeRange}
              format={dateFormat}
              onChange={timeToggle}
              disabledDate={disabledDate}
              dropdownClassName="edm-date-picker-dropdown-wrap"
              className={style.rangePicker}
            />
          </div>

          {activeTab == 2 ? (
            <Select
              maxTagCount={'responsive'}
              mode="multiple"
              showArrow={true}
              allowClear={true}
              style={{ width: 112, verticalAlign: 'top' }}
              placeholder={getIn18Text('XUANZEFUZEREN')}
              dropdownClassName="edm-selector-dropdown"
              suffixIcon={<DownTriangle />}
              value={searchCondition.searchAccIds}
              onChange={handleManagerChange}
            >
              {managerOptions &&
                managerOptions.map((item, index) => {
                  return (
                    <Select.Option key={index} value={item.account_id}>
                      {item.nick_name}
                    </Select.Option>
                  );
                })}
            </Select>
          ) : null}
          <SiriusInput
            style={{ width: 192 }}
            maxLength={100}
            max={100}
            placeholder={getIn18Text('RENWUZHUTI')}
            prefix={<SearchIcon />}
            suffix={null}
            allowClear
            onPressEnter={handleQueryChange}
            onBlur={handleQueryChange}
            onChange={handleQueryChange}
            className={style.font12Input}
          />
          <EnhanceSelect
            style={{ width: 156 }}
            placeholder={getIn18Text('RENWUXINJIANZHUANGTAI')}
            // suffixIcon={<DownTriangle />}
            value={searchCondition.emailStatus}
            onChange={handleMarketingStateChange}
            // dropdownClassName="edm-selector-dropdown"
            className={style.borderSelect}
          >
            {marketingState.map(item => (
              <InSingleOption value={item.status} key={item.status}>
                {item.text}
              </InSingleOption>
            ))}
          </EnhanceSelect>
          <SiriusInput
            style={{ width: 192 }}
            maxLength={200}
            max={200}
            placeholder={getIn18Text('LIANXIRENYOUXIANG')}
            prefix={<SearchIcon />}
            suffix={null}
            allowClear
            onPressEnter={handleContactEmailChange}
            onBlur={handleContactEmailChange}
            onChange={handleContactEmailChange}
            className={style.font12Input}
          />
          {activeTaskTab !== '1' && (
            <EnhanceSelect
              style={{ width: 156 }}
              placeholder={'任务类型'}
              suffixIcon={<DownTriangle />}
              value={searchCondition.senderMode}
              onChange={handleTaskType}
              // dropdownClassName="edm-selector-dropdown"
              // className="no-border-select"
            >
              {sendboxTypeConf.map(item => (
                <InSingleOption value={item.value} key={item.value}>
                  {item.text}
                </InSingleOption>
              ))}
            </EnhanceSelect>
          )}
          {!inFFMS && (
            <EnhanceSelect
              style={{ width: 156 }}
              placeholder={'是否多轮营销'}
              suffixIcon={<DownTriangle />}
              value={searchCondition.edmMode}
              onChange={handleSecondSendFilte}
              // dropdownClassName="edm-selector-dropdown"
              // className="no-border-select"
            >
              {secondSendConf.map(item => (
                <InSingleOption value={item.value} key={item.value}>
                  {item.text}
                </InSingleOption>
              ))}
            </EnhanceSelect>
          )}
        </Space>
      </div>
    );
  };

  const OverviewComp = () => {
    if (statData == null) {
      // if (true) {
      return (
        <div className={style.overviewEmpty}>
          <Skeleton active loading></Skeleton>
        </div>
      );
    }

    return (
      <div ref={statisticsList} className={style.statisticsList}>
        {statData?.map((item, index) => {
          let Icon: typeof React.Component;
          if (Array.isArray(item)) {
            Icon = item[0].Icon;
          } else {
            Icon = item.Icon;
          }
          return (
            <StatisticItem
              key={index}
              data={item}
              style={{ flex: '1 0 148px', padding: '10px 6px 10px 12px' }}
              icon={<Icon className={`${style.statisticsIcon}`} />}
              onKeyChange={title => {
                if (title === getIn18Text('DAKAIRENSHU') || title === getIn18Text('DAKAICISHU')) {
                  setReadCountKey(title);
                }
              }}
            />
          );
        })}
      </div>
    );
  };

  // 引导及我的任务为空时的了解视频
  const handleMore = () => {
    ImagePreview.preview({ data: [MarketingVideo.marketing], startIndex: 0 });
  };

  const ContentListComp = () => {
    return (
      <div className={style.mainContent}>
        {tableData.length >= 0 && (
          <>
            <div className={style.tableHeader}>
              <EdmTabs
                activeKey={activeTaskTab}
                onChange={setActiveTaskTab}
                tabConf={[
                  {
                    title: getIn18Text('PUTONGRENWU'),
                    key: '0',
                  },
                  {
                    title: getIn18Text('FENPIRENWU'),
                    key: '1',
                  },
                ]}
              />
              <div className={style.tableHeaderRight}>
                {
                  // 只有普通任务有这俩按钮
                  activeTaskTab === '0' && activeTab == 1 && (
                    <>
                      <Checkbox onChange={handleRecentRead} checked={searchCondition.recentRead ?? false}>
                        只看新增打开
                      </Checkbox>
                      <Checkbox onChange={handleRecentReply} checked={searchCondition.recentReply ?? false}>
                        只看新增回复
                      </Checkbox>
                    </>
                  )
                }
                {activeTab == 2 ? (
                  <div className={style.secondCheck}>
                    <Checkbox onChange={handleIsDelChange} checked={searchCondition.isDel === '-1'}>
                      {getIn18Text('XIANSHIQUANBULISHIRENWU')}
                    </Checkbox>
                    <Tooltip title={getIn18Text('QUANBULISHIRENWU\uFF0CBAOHANWEISHANCHUHEYISHANCHUDERENWU')}>
                      <ExplanationIcon className={style.isDelCheckTipIcon} />
                    </Tooltip>
                  </div>
                ) : null}
              </div>
            </div>
            <div className={style.tableContent} ref={pdfRef}>
              {/* 是否展示托管营销banner */}
              {sendBoxCof?.edmHostingState == 0 && <AihostingBanner />}
              {/* <AihostingBanner /> */}
              <div className={style.btnHeader}>
                <div className={style.hasSelected}>
                  {getIn18Text('YIXUAN')}
                  {selectedRowKeys.length}
                  {getIn18Text('GE')}
                </div>
                <div className={style.btnWrapper}>
                  <Button btnType="minorLine" inline onClick={() => selectInterceptor(() => handleBatchDelete(selectedRowKeys))}>
                    {getIn18Text('PILIANGSHANCHU')}
                  </Button>
                  {!isCircle && (
                    <Button
                      btnType="minorLine"
                      inline
                      style={{
                        marginLeft: 8,
                      }}
                      onClick={() => selectInterceptor(generateReport)}
                    >
                      {getIn18Text('SHENGCHENGBAOGAO')}
                    </Button>
                  )}
                  {!isCircle && (
                    <Button
                      style={{
                        marginLeft: 8,
                      }}
                      btnType="minorLine"
                      inline
                      onClick={() => selectInterceptor(() => handleAgainMarketing(selectedRowKeys))}
                    >
                      {'再次营销'}
                    </Button>
                  )}
                </div>
              </div>
              <Table
                className={classnames(style.table, style.sendListTable, style.circle, +activeTaskTab === 0 ? style.secondTable : '')}
                rowKey={record => record.edmEmailId || record.batchId}
                loading={loading}
                rowSelection={rowSelection}
                rowClassName={record => {
                  return expandedRowKeys.includes(record.edmEmailId || record.batchId) ? style.rowExpanded : '';
                }}
                expandable={getExpandableConf()}
                pagination={false}
                columns={columns}
                dataSource={transformTableData(tableData)}
                showHeader={true}
                locale={{
                  emptyText: (
                    <Empty
                      image={NoDataIcon}
                      description={
                        <span className={style.noDataDesc}>
                          暂无任务
                          {+activeTab === 1 ? (
                            <>
                              {getIn18Text('，XUEXIXIA')}
                              <span className={style.noDataLink} onClick={handleMore}>
                                {getIn18Text('RUHEFAYINGXIAOYOUJIAN')}
                              </span>
                              {getIn18Text('BA！')}
                            </>
                          ) : (
                            <></>
                          )}
                        </span>
                      }
                    />
                  ),
                }}
              />
            </div>
          </>
        )}
      </div>
    );
  };

  const PagingComp = () => {
    return (
      <div hidden={detailProp.visible} className={style.paginationWrap}>
        <Pagination
          size="small"
          total={total}
          current={searchCondition.page}
          pageSize={searchCondition.pageSize}
          pageSizeOptions={['20', '50', '100']}
          showSizeChanger
          onChange={(current, pageSize) => {
            setSearchCondition(previous => ({
              ...searchCondition,
              page: pageSize === previous.pageSize ? (current as number) : 1,
              pageSize: pageSize as number,
              recentRead: false,
              recentReply: false,
            }));
          }}
        />
      </div>
    );
  };

  const toAutoMarketingPage = () => {
    //su-desktop-web.cowork.netease.com:8000/#edm?page=autoMarketTask
    https: navigate('#edm?page=autoMarketTask');
  };

  const TaskTypeTabComp = () => {
    return (
      <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <CustomerTabs tabNameList={tabs} defaultActiveKey="1" activeKey={String(activeTab)} onChange={handleChangeActiveTab} className="" />
        <div
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => {
            toAutoMarketingPage();
          }}
        >
          <div>自动化营销</div>
          <TongyongJianTouYou />
        </div>
      </div>
    );
  };

  // 获取是否有营销记录（包括普通任务和分批任务），以决定是否展示营销运营页面
  const fetchRecordData = async () => {
    const result = await edmApi.getSendBoxRecord();
    // 如果有全部任务查看权限，引导页面展示查看全部任务按钮
    setHasAllPrivilege(result?.hasPrivilege);
    // 请求未正常返回或者有营销记录，继续后续请求
    if (!result || result.hasEdmRecord) {
      return true;
    }
    return false;
  };

  const forceUpdate = async () => {
    if (!visiable) {
      return;
    }
    if (!hasEdmPermission) {
      return;
    }
    const hasRecord = await fetchRecordData();
    setHasRecord(hasRecord);
    // 无我的发件任务并且未展示过引导页面则展示
    const res = await storeApi.get(SEND_TASK_GUIDE);
    setShowGuide(!hasRecord && !res?.suc);
    // 无我的发件任务，不请求数据
    if (hasRecord) {
      fetch();
      fetchSendCount();
    }
  };

  // 模板列表页定制列表
  if (from === 'templateList') {
    return (
      <div className={style.mainContent}>
        {tableData.length >= 0 && (
          <>
            <div className={style.tableHeader}>
              <Tabs size="small" className={style.tableFilterTabs} activeKey={activeTaskTab} onChange={setActiveTaskTab}>
                <TabPane tab={getIn18Text('PUTONGRENWU')} key="0"></TabPane>
                <TabPane tab={getIn18Text('FENPIRENWU')} key="1"></TabPane>
              </Tabs>
            </div>
            <div className={`${style.tableContent} ${style.tableContent2}`}>
              <Table
                className={classnames(style.table, style.sendListTable, style.circle, +activeTaskTab === 0 ? style.secondTable : '')}
                rowKey={record => record.edmEmailId || record.batchId}
                loading={loading}
                rowClassName={record => {
                  return expandedRowKeys.includes(record.edmEmailId || record.batchId) ? style.rowExpanded : '';
                }}
                expandable={{
                  defaultExpandAllRows: true,
                  childrenColumnName: 'sendboxList',
                  onExpandedRowsChange: setExpandedRowKeys,
                  expandIcon: ({ expanded, onExpand, record }) => {
                    if (!record.hasOwnProperty('sendboxList')) {
                      return null;
                    }
                    return <UpLine className={expanded ? style.expanded2 : style.collapse2} onClick={e => onExpand(record, e)} />;
                  },
                }}
                pagination={false}
                columns={getColumns()}
                dataSource={tableData}
                showHeader={true}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  // 营销运营页面，展示条件：发件任务中无普通任务和分批任务
  const sendedOperationComp = () => {
    const handleAllTask = () => {
      handleChangeActiveTab(2);
      storeApi.put(SEND_TASK_GUIDE, 'true');
      setShowGuide(false);
    };
    return (
      <div className={style.sendedOperation} style={{ display: visiable ? 'flex' : 'none' }}>
        <div className={style.operationLeft}>
          <p className={style.operationTitle}>{getIn18Text('YOUJIANYINGXIAO')}</p>
          <p className={style.operationDesc}>
            {getIn18Text('YIJIANSHENGCHENGQUNFAYOU')}
            <span className={style.operationMore} onClick={handleMore}>
              {getIn18Text('LIAOJIEGENGDUO')}
              <ArrowRightBlueIcon />
            </span>
          </p>
          <div className={style.operationDetail}>
            <div className={style.detailItem}>
              <SendedOperation1 />
              <div>
                <p className={style.itemTitle}>{getIn18Text('SHENGSHISHENGLIYIJIANYING')}</p>
                <p className={style.itemDesc}>{getIn18Text('PILIANGQUNFAYINGXIAOYOU')}</p>
              </div>
            </div>
            <div className={style.detailItem}>
              <SendedOperation2 />
              <div>
                <p className={style.itemTitle}>{getIn18Text('GAOZHUANHUALVYINGXIAOYOU')}</p>
                <p className={style.itemDesc}>{getIn18Text('YOUZHIHAIWAIIP、')}</p>
              </div>
            </div>
            <div className={style.detailItem}>
              <SendedOperation3 />
              <div>
                <p className={style.itemTitle}>{getIn18Text('XIAOGUOSHUJUSHISHIZHUI')}</p>
                <p className={style.itemDesc}>{getIn18Text('YINGXIAOXIAOGUOSHUJUYI')}</p>
              </div>
            </div>
          </div>
          <div className={style.operationBtn}>
            {CreateEdmTaskButtonComp()}
            {hasAllPrivilege ? (
              <Button btnType="minorLine" onClick={handleAllTask}>
                {getIn18Text('CHAKANQUANBURENWU')}
              </Button>
            ) : (
              <></>
            )}
          </div>
        </div>
        <div className={style.operationRight}>
          <SendedOperationRight />
        </div>
        {/* {showRewardTaskModal && (
          <RewardTaskModalComponent
            rewardTaskStateRespFromProp={rewardTaskStateResp}
            showRewardTaskModal={showRewardTaskModal}
            setShowRewardTaskModal={setShowRewardTaskModal}
          />
        )} */}
      </div>
    );
  };

  const MarketingClassroomComp = () => {
    return <MarketingClassroom sendBoxCof={sendBoxCof} ref={classroomRef} visiable={visiable} />;
  };

  const handleAgainMarketing = async (ids: string[]) => {
    edmDataTracker.track('pc_markting_edm_taskList_remarkting');
    setAgainMarketingLoading(true);
    try {
      const res = await edmApi.fetchRemarketingContacts({ edmEmailIds: ids });
      if (res) {
        if (
          lodashGet(res, 'unreadList.length', 0) === 0 &&
          lodashGet(res, 'unReplyList.length', 0) === 0 &&
          lodashGet(res, 'arriveUnReplyList.length', 0) === 0 &&
          lodashGet(res, 'multipleReadList.length', 0) === 0
        ) {
          toast.error('无联系人无法再次营销');
        } else {
          setRemarketingDataSourceRes(res);
          setShowMarketingDrawer(true);
        }
      }
    } catch (error) {
    } finally {
      setAgainMarketingLoading(false);
    }
  };

  const handleReSendEdm = async (contacts: traceLogItem[]) => {
    const id = await edmApi.createDraft();
    await edmApi.saveDraft({
      draftId: id,
      draftType: 0, // 列表页只有普通任务才有再次营销功能，sendboxType: 0 | 1 | 6; // 0:普通草稿 1:分批任务草稿 6: 大发信任务
      currentStage: 0,
      contentEditInfo: {
        emailContent: '',
        emailAttachment: '',
      },
      sendSettingInfo: {},
      receiverInfo: {
        contacts: contacts.map(i => ({ name: i.contactName || '', email: i.contactEmail || '' })),
      },
    });
    navigate(`${routerWord}?page=write&resend=1&id=${id}`);
    setShowMarketingDrawer(false);
  };

  const handleDropdownReWriteClick = (propType?: remarketingType) => {
    const propList = propType ? lodashGet(remarketingDataSourceRes, propType, []) : [];
    if (propList.length > 50000) {
      toast.error('选中的任务联系人过多超过单次发信上限');
      return;
    }
    handleReSendEdm(propList);
  };

  const RemarketingDrawerComp = () => {
    return (
      <RemarketingDrawer
        visible={showMarketingDrawer}
        listData={remarketingDataSourceRes as ResponseSendBoxDetail}
        handleClick={(type?: remarketingType, key?: string) => {
          setShowMarketingDrawer(false);
          handleDropdownReWriteClick(type);
        }}
        onCancel={() => setShowMarketingDrawer(false)}
      />
    );
  };

  return (
    <PermissionCheckPage resourceLabel="EDM" accessLabel="VIEW" menu="EDM_SENDBOX">
      {showGuide ? (
        sendedOperationComp()
      ) : (
        // 添加一个全局的loading
        <div className={style.outWrap} style={{ display: visiable ? 'block' : 'none' }}>
          <Spin className={style.spinWrap} indicator={antIcon} spinning={copyLoading || againMarketingLoading} tip={copyLoading ? '正在复制任务' : ''}>
            <div ref={container} className={classnames(style.container, style.listContainer, detailProp.visible ? style.container2 : '')} style={{ minHeight: 'auto' }}>
              <div ref={pageHeader} className={classnames(style.pageHeader, style.pageHeader2)}>
                <div className={style.rightHeader}>
                  <span className={style.title}>{getIn18Text('FAJIANRENWU')}</span>
                  {statInfo && sendCount && (
                    <>
                      <span className={style.subTitle}>
                        {getIn18Text('GONG')}
                        <span className={style.num}>{statInfo.sendEdmCount}</span>
                        {getIn18Text('CIFAJIANRENWU\uFF0C                            SHENGYUFAJIANZONGLIANG')}
                        <span className={style.num}>{sendCount.orgAvailableSendCount}</span>
                        {getIn18Text('FENG')}
                      </span>
                      <a
                        onClick={() => {
                          forceUpdate();
                        }}
                        className="edm-page-refresh"
                      >
                        <RefreshSvg />
                      </a>
                    </>
                  )}
                </div>
                <div className={style.rightOperation}>
                  <p className={style.videoTip} onClick={() => showVideoDrawer(videoDrawerConfig)}>
                    <VideoIcon /> <span className={style.videoContent}></span>
                  </p>
                  {MarketingSuggestComp()}
                  {CreateEdmTaskButtonComp()}
                </div>
              </div>
              {/* 异常通知 */}
              {/* <SendedErrorTips visiable={visiable} /> */}

              {TaskTypeTabComp()}
              {TaskListFilterComp()}
              <div className={style.contentListWrap}>
                <div className={style.contentOverview}>
                  <div className={style.overviewTitle}>任务数据总览</div>
                  {OverviewComp()}
                  {MarketingClassroomComp()}
                </div>
                {ContentListComp()}
              </div>
            </div>
          </Spin>
          {PagingComp()}
          {detailProp.visible ? (
            <div className={style.detailWrapper}>
              <EdmDetail
                target={detailProp.target}
                qs={detailProp.qs}
                index={detailProp.index}
                goBack={() => {
                  setDetailProp({ visible: false, qs: {} });
                  // 返回任务列表需要刷新列表
                  fetchData();
                  window.location.hash = routerWord + '?page=index';
                }}
              ></EdmDetail>
            </div>
          ) : null}
          {/* 诊断与建议 */}
          {showDiagnosis && (
            <div className={style.detailWrapper}>
              <TaskDiagnosis
                goBack={() => {
                  setShowDiagnosis(false);
                  let hash = location.hash;
                  hash = hash.replace('&zhenduanentry=true', '');
                  navigate(hash);
                }}
              />
            </div>
          )}
          {/* {renderEdmDetail()} */}
          {/* 是否展示托管营销弹窗 */}
          {/* {!showRewardTaskModal && hasRecord && sendBoxCof?.edmHostingState === 0 && <AihostingModal visible={visiable} />} */}
          {/* {showRewardTaskModal && (
            <RewardTaskModalComponent
              rewardTaskStateRespFromProp={rewardTaskStateResp}
              showRewardTaskModal={showRewardTaskModal}
              setShowRewardTaskModal={setShowRewardTaskModal}
            />
          )} */}
          {/* <AihostingModal visible={visiable} /> */}
          {RemarketingDrawerComp()}
        </div>
      )}
    </PermissionCheckPage>
  );
};
export const handleCopyDraft = async (edmEmailId: string, item?: EdmEmailInfo, transId?: number) => {
  try {
    const body = await edmApi.copyFromSendBox({ edmEmailId });
    const id = await edmApi.createDraft();
    await edmApi.saveDraft({
      draftId: id,
      currentStage: 0,
      draftType: body.sendboxType,
      contentEditInfo: {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        emailContent: getContentWithoutAttachment(body.contentEditInfo.emailContent),
        emailAttachment: body.contentEditInfo.emailAttachment,
      },
      sendSettingInfo: body.sendSettingInfo,
      receiverInfo: {
        contacts: body.receiverInfo.contactInfoList.map(({ contactName, contactEmail, contactIcon, contactStatus, ...rest }) => ({
          name: contactName,
          email: contactEmail,
          ...rest,
        })),
      },
      push: (body as any).push === undefined ? true : (body as any).push,
      secondSendInfo: body.secondSendInfo,
      sendDomainLimit: body.sendDomainLimit,
      sendStrategyOn: body.sendStrategyOn,
    });
    let typeStr = body.sendboxType === 6 ? '&channel=senderRotate' : '';
    let copy = '';
    if (item) {
      let rootCopyId = !item.rootCopyId || item.rootCopyId === '0' ? item.edmEmailId : item.rootCopyId;
      let copyId = item.edmEmailId;
      copy = `&rootCopyId=${rootCopyId}&copyId=${copyId}`;
    }

    if (transId) {
      copy += `&copyTransId=${transId}&copyTransCount=${body.receiverInfo.contactInfoList.length}`;
    }

    navigate(`${routerWord}?page=write${typeStr}&from=copyTask&id=${id}` + copy);
  } catch (e) {
    if (e && (e as any).code !== 40101) {
      onHttpError(e);
    }
  }
};
const getContentWithoutAttachment = (content: string) => {
  const appendStart = ATTACHMENT_CONFIG.prefix;
  const appendEnd = ATTACHMENT_CONFIG.subfix;
  try {
    if (!content || content.length <= appendEnd.length + appendStart.length) return content;
    let startIndex = content.indexOf(appendStart);
    let endIndex = content.indexOf(appendEnd);
    let c = content;
    while (startIndex > -1 && endIndex > -1) {
      c = c.substring(0, startIndex) + c.substring(endIndex + appendEnd.length);
      startIndex = c.indexOf(appendStart);
      endIndex = content.indexOf(appendEnd);
    }
    return c;
  } catch (err) {
    return content;
  }
};
