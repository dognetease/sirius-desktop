import React, { FC, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DatePicker, Dropdown, Input, Popover, Select, Skeleton, Table, Tabs, Tooltip, Menu, Space, Pagination, Empty, message, Spin, Checkbox } from 'antd';
import { ExpandableConfig } from 'rc-table/lib/interface';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import {
  getIn18Text,
  EdmEmailInfo,
  apiHolder,
  apis,
  EdmSendBoxApi,
  ResponseSendBoxInfo,
  ResponseReservedCount,
  WorktableApi,
  EdmStatInfo,
  isFFMS,
  SystemApi,
  SendBoxConfRes,
  EdmSendConcatInfo,
} from 'api';
import moment, { Moment } from 'moment';
import { timeZoneMap, getWeekdayWithTimeZoneOffset } from '@web-common/utils/constant';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import { navigate, useLocation } from '@reach/router';
import _ from 'lodash';
import toast from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import queryString from 'query-string';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
// import Tag from '@web-common/components/UI/Tag';
import Tag from '@lingxi-common-component/sirius-ui/Tag';
import { ReactComponent as MoreIcon0 } from '@/images/icons/edm/mail0.svg';
import { ReactComponent as MoreIcon1 } from '@/images/icons/edm/mail1.svg';
import { ReactComponent as MoreIcon3 } from '@/images/icons/edm/mail3.svg';
import { ReactComponent as MoreIcon4 } from '@/images/icons/edm/mail4.svg';
import { ReactComponent as MoreIcon5 } from '@/images/icons/edm/mail5.svg';
import { ReactComponent as MoreIcon6 } from '@/images/icons/edm/mail6.svg';
import { ReactComponent as UpLine } from '@/images/icons/edm/up-line.svg';
import { ReactComponent as QuestionIcon } from '@/images/icons/edm/question.svg';
import { ReactComponent as ArrowRightBlueIcon } from '@/images/icons/edm/arrow_right_blue.svg';
import { ReactComponent as SendedOperation1 } from '@/images/icons/edm/sended_operation1.svg';
import { ReactComponent as SendedOperation2 } from '@/images/icons/edm/sended_operation2.svg';
import { ReactComponent as SendedOperation3 } from '@/images/icons/edm/sended_operation3.svg';
import { ReactComponent as SendedOperationRight } from '@/images/icons/edm/sended_operation_right.svg';
import defaultImg from '@/images/icons/edm/default-edm-thumb.png';
import { PermissionCheckPage, PrivilegeCheck, usePermissionCheck } from '@/components/UI/PrivilegeEnhance';
import { ColumnType } from 'antd/lib/table';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import ImagePreview from '@web-common/components/UI/ImagePreview';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import { isOwnerDataPrivilegeSelector } from '@web-common/state/reducer/privilegeReducer';
import { ReactComponent as CaretDownOutlined } from '@/images/icons/edm/caretDownOutlined.svg';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import MoreActionIcon from '@/components/UI/Icons/svgs/MoreAction';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { ReactComponent as LinkTraceSvg } from '@/images/icons/edm/link-trace.svg';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
import NoDataIcon from '@/images/icons/edm/yingxiao/no-data.png';
import { AihostingBanner } from '../components/AihostingBanner';
import { AihostingModal } from '../components/AihostingModal';
import AiMarketingEnter from '../components/AiMarketingEnter/aiMarketingEnter';

import {
  EdmStatColumns,
  columnsFilter,
  handlePreviewImage,
  onHttpError,
  StatItemData,
  toStatItem,
  transformStatus,
  MarketingVideo,
  timeFormat,
  getPercent,
} from '../utils';
import { useCancelToken } from '../fetchHook';
import { ATTACHMENT_CONFIG } from '../send/contentEditor';
import { renderTraceLinkPopup } from '../components/linkTrackModal/infoPopup';
import CustomerTabs from '../Tabs/tabs';
import { EdmDetail } from '../detail/detailV2';
import { DetailTabOption } from '../detail/detailEnums';
import { StatisticItem } from '../components/statistics/statisticsItem';
import { Interface, MarketingClassroom } from '../MarketingClassroom';
import { WarmUpDetail } from './detail';

const { isMac } = apiHolder.env;
// 自定义新增部分
import { Header } from './Header';
import { AccountData } from './AccountData';

import styles from './SenderRotateList.module.scss';

const { RangePicker } = DatePicker;
const dateFormat = 'YYYY-MM-DD';
const systemApi = apiHolder.api.getSystemApi();
const storeApi = apiHolder.api.getDataStoreApi();
const { TabPane } = Tabs;
const inElectron = apiHolder.api.getSystemApi().isElectron;
const inFFMS = isFFMS();
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const isWindows = systemApi.isElectron() && !isMac;

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

// overview 配置
const overviewConf: Array<{
  title: string;
  key: keyof EdmStatInfo;
  subTitle?: string;
  subKey?: keyof EdmStatInfo;
}> = [
  {
    title: getIn18Text('YINGXIAORENSHU'),
    key: 'contactsCount',
  },
  {
    title: getIn18Text('FASONGFENGSHU'),
    key: 'sendCount',
  },
  {
    title: getIn18Text('SONGDAFENGSHU'),
    key: 'arriveCount',
    subTitle: getIn18Text('SONGDALV：'),
    subKey: 'arriveRatio',
  },
  {
    title: getIn18Text('DAKAIRENSHU'),
    key: 'readCount',
    subTitle: getIn18Text('DAKAILV：'),
    subKey: 'readRatio',
  },
  {
    title: getIn18Text('HUIFUZONGSHU'),
    key: 'replyCount',
  },
];

const SEND_TASK_GUIDE = 'sendTaskGuide';
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const worktableApi = apiHolder.api.requireLogicalApi('worktableApiImpl') as WorktableApi;

let fetchDataTimestamp = 0;
let fetchStatTimestamp = 0;

interface DetailProp {
  qs: Record<string, string | number>;
  visible: boolean;
  index?: number;
  target?: DetailTabOption;
}

const defaultSearchCondition = {
  sendTime: null,
  recentlyUpdateTime: null,
  page: 1,
  pageSize: 20,
  isDel: '0',
};

export const SenderRotateList: FC<{
  qs: Record<string, string>;
  visiable?: boolean;
}> = ({ qs, visiable = true }) => {
  const container = useRef<HTMLDivElement>(null);
  const pageHeader = useRef<HTMLDivElement>(null);
  const filterBlock = useRef<HTMLDivElement>(null);
  const statisticsList = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [activeTaskTab, setActiveTaskTab] = useState<string>('0'); // 0:普通任务 1:分批任务
  // 表格头部日期
  const [tableHeaderTitle, setTableHeaderTitle] = useState(0);
  const [loading, setLoading] = useState(false);
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
  const [detailProp, setDetailProp] = useState<DetailProp>({ visible: false, qs: { page: '', id: '' } });
  // 操作状态
  const [copyLoading, setCopyLoading] = useState(false);
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
  // 多账号列表
  const [showWarmUpDetail, setShowWarmUpDetail] = useState(false);

  // 托管营销信息
  const [sendBoxCof, setSendBoxCof] = useState<SendBoxConfRes>();
  // 托管营销入口按钮
  const aiMarketingEnterRef = useRef<any>();
  const [aiMarketingEnterContacts, setAiMarketingEnterContacts] = useState<Array<EdmSendConcatInfo>>();
  const [curtEdmEmailId, setCurtEdmEmailId] = useState('');

  function disabledDate(current: Moment) {
    if (timeType === 'createTime' || timeType === 'recentlyUpdateTime') {
      return current && (current > moment().endOf('day') || current < moment('1900-01-01').endOf('day'));
    }
    return false;
  }

  // todo真实权限 EDM_MULTI_ACCOUNT_INFO
  const hasEdmPermission = usePermissionCheck('VIEW', 'EDM', 'EDM_MULTI_ACCOUNT_INFO');

  const locationTag = useLocation();
  // TODO: 进入到页面之后, 要不要主动刷新数据(待定) @hanxu
  useEffect(() => {
    if (visiable) {
      setDetailProp({ visible: false, qs: {} });
      forceUpdate();
    }
  }, [visiable]);

  // 请求是否有托管营销信息
  useEffect(() => {
    edmApi.getSendBoxConf({ type: 1 }).then(setSendBoxCof);
  }, [setSendBoxCof, visiable]);

  useEffect(() => {
    if (aiMarketingEnterContacts) {
      aiMarketingEnterRef.current?.handleHosting();
    }
  }, [aiMarketingEnterContacts]);

  const isCircle = useMemo(() => {
    return +activeTaskTab === 1;
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
    });
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
    });
  };

  const handleUpdateTimeChange = (values: any) => {
    setSearchCondition({
      ...searchCondition,
      sendTime: null,
      recentlyUpdateTime: values,
      page: 1,
      pageSize: 20,
    });
  };
  const handleQueryChange = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== searchCondition.edmSubject) {
      setSearchCondition({
        ...searchCondition,
        edmSubject: value,
        page: 1,
        pageSize: 20,
      });
    }
  };
  const handleContactEmailChange = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== searchCondition.contactEmail) {
      setSearchCondition({
        ...searchCondition,
        contactEmail: value,
        page: 1,
        pageSize: 20,
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
    });
  };

  const handleMarketingStateChange = (value: string) => {
    setSearchCondition({
      ...searchCondition,
      emailStatus: value,
      page: 1,
      pageSize: 20,
    });
  };

  const handleSecondSendFilte = (value: string) => {
    setSearchCondition({
      ...searchCondition,
      edmMode: value,
      page: 1,
      pageSize: 20,
    });
  };

  const handleManagerChange = (ids: any) => {
    const newCondition = {
      ...searchCondition,
      searchAccIds: ids,
      page: 1,
      pageSize: 20,
    };
    setSearchCondition(newCondition);
  };

  const handleCronEdit = (item: EdmEmailInfo) => {
    navigate(`#edm?page=write&type=cronEdit&edmEmailId=${item.edmEmailId}
      ${item.multipleContentInfo ? `&isMultiple={${item.multipleContentInfo != null}}` : ''}
      `);
  };

  const fetchData = () => {
    // 请求
    const isAll = +activeTab === 2;
    const conditions: { [key: string]: any } = {
      sendboxType: 6,
    };
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
      conditions.sendboxType = 6;
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
    });
  }, [activeTaskTab]);

  // 监听url中时间和accountIds变化，刷新页面
  useEffect(() => {
    const time = qs?.sendTime ? qs.sendTime.split(',') : null;
    setSearchCondition({
      ...searchCondition,
      sendTime: time ? [moment(time[0]), moment(time[1])] : searchCondition.sendTime,
      searchAccIds: qs?.accountIds ? qs?.accountIds.split(',') : undefined,
    });
  }, [qs]);

  const fetchStatData = () => {
    // 请求
    const isAll = +activeTab === 2;
    const conditions: { [key: string]: any } = {
      sendboxType: 6,
    };
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
    fetch();
  }, [searchCondition]);

  useEffect(() => {
    if (Number(activeTab) === 2) {
      worktableApi.getAccountRange('EDM').then(res => {
        setManagerOptions(res.principalInfoVOList);
      });
    }
  }, [activeTab]);

  const location = useLocation();

  const fetch = () => {
    // if (!hasEdmPermission) {
    //   return;
    // }
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
      promise = isAll ? edmApi.refreshSendBoxAllPageList({ edmEmailIds }) : edmApi.refreshSendBoxPageList({ edmEmailIds, sendboxType: 6 });
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

      setTableData(nextTableData);
    });
  };

  useEffect(() => {
    if (location.hash === '#edm' || location.hash.startsWith('#edm?page=index')) {
      const duration = 60 * 1000;

      const timer = setInterval(() => {
        fetchStatData();
        refreshTableData();
      }, duration);

      return () => clearInterval(timer);
    }
  }, [location.hash, fetchStatData, refreshTableData]);

  useEffect(() => {
    if (location.hash.includes('#intelliMarketing') && location.hash.includes('detailId')) {
      const qs = queryString.parse(location.hash.replace('#intelliMarketing', ''));
      if (qs.detailId) {
        setDetailProp({
          visible: true,
          qs: {
            edmEmailId: qs.detailId as string,
            page: 'detail',
            id: qs.detailId as string,
            owner: 'true',
            isParent: qs.isParent as string,
          },
          index: 0,
        });
      }
    }
  }, [location]);

  const handleAddNew = (pageName: string) => {
    navigate(`#edm?page=${pageName}`);
  };
  const handelCoverImageClick = (item: EdmEmailInfo) => {
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
        <span className={styles.left24} onClick={() => openTabDetail(item, conf.detailKey)} key={conf.key}>
          <Comp className={styles.highlightIcon} />
          <span className={styles.highlightText}>{conf.title}</span>
          <span className={styles.highlight}>{item.emailStatus === 0 && !conf.unSendShow ? '-' : item[conf.key]}</span>
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
            <QuestionCircleOutlined style={{ marginLeft: 8, color: '#7D8085' }} />
          </Tooltip>
        ),
      },
    ];

    return confs.map(conf => (
      <>
        {item[conf.key] != null && conf.status.includes(emailStatus) ? (
          <span key={conf.key} className={styles.sendTimeItem}>
            <span>{conf.title}：</span>
            {conf.needTimeZone && <>{`${timeZoneMap[item[conf.timeZoneKey!] as string]?.split('：')[0] || ''} `}</>}
            {timeFormat(item[conf.key] as string)}
            {conf.toolTip}
          </span>
        ) : null}
      </>
    ));
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
          <span className={`${styles.tableStateWrap}`}>
            <Tag type={type as any}>
              {statusName}
              {showPercent ? `...${percent}%` : ''}
            </Tag>
          </span>
        )}
      </>
    );
  };

  const afterClick = () => {
    // 调接口
    const promise = +activeTab === 1 ? edmApi.setHostingStatus({ edmEmailId: curtEdmEmailId }) : edmApi.setAllHostingStatus({ edmEmailId: curtEdmEmailId });
    promise.then(res => {
      refreshTableData();
    });
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
    //         className={styles.coverImage}
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
      className: styles.contentColumn,
      render(__: any, item) {
        const status = transformStatus(item.emailStatus);
        // const key: 'readCount' | 'readNum' = readCountKey === '打开人数' ? 'readCount' : 'readNum';
        const percent = getPercent(item);
        const showPercent = item.emailStatus === 1 && percent;
        const images = (item.emailThumbnail || '').split(',');
        return (
          <div className={styles.contentWrap}>
            <img
              src={images[0] || defaultImg}
              style={{ width: 72, height: 72 }}
              alt={item.edmSubject}
              className={styles.coverImage}
              onClick={() => handelCoverImageClick(item)}
            />
            <div className={styles.tableContent2}>
              <div className={styles.mainTitle}>
                <span className={styles.tableItemName}>{item.edmSubject}</span>
                {item.traceLinks && item.traceLinks.length > 0 && (
                  <Dropdown overlay={() => renderTraceLinkPopup(item.edmEmailId)} destroyPopupOnHide>
                    <span className={styles.linkTraceEntry}>
                      <span>
                        <LinkTraceSvg />
                      </span>
                      <span>{getIn18Text('FANGWEN')}</span>
                    </span>
                  </Dropdown>
                )}
                {/* {status.statusName && status.statusKey !== 'canceled' && (
                  <span className={`${styles.tableItemState} ${status.statusKey}`}>
                    {status.statusName}
                    {showPercent ? `...${percent}%` : ''}
                  </span>
                )}
                {status.statusName && status.statusKey === 'canceled' && (
                  <span className={`${styles.tableStateWrap}`}>
                    <Tag type="label-1-1">已撤销</Tag>
                  </span>
                )} */}
                {renderTableItemState({
                  ...status,
                  showPercent,
                  percent,
                })}

                {item.emailStatus === 3 && (
                  <span className={`${styles.tableItemIcon}`}>
                    <Tooltip placement="topLeft" title={item.failReason}>
                      <InfoCircleOutlined />
                    </Tooltip>
                  </span>
                )}
                {item.sendboxType === 1 && <span className={`${styles.tableItemState} batch`}>{getIn18Text('XUNHUANFASONG')}</span>}
                {item.isDel === 1 && <span className={`${styles.tableItemState} state-3`}>{getIn18Text('YISHANCHU')}</span>}
                {/* 安全发信 */}
                {item.sendStrategyOn && (
                  <span className={`${styles.tableStateWrap}`}>
                    <Tag type="label-4-1">{getIn18Text('ANQUANFAXIN')}</Tag>
                  </span>
                )}
                {/* 二次营销 */}
                {item.subList != null && item.subList.length > 0 && (
                  <span className={`${styles.tableStateWrap}`}>
                    <Tag type="label-1-1">{'多轮营销'}</Tag>
                  </span>
                )}
                {/* 多版本 */}
                {/* {item.multipleContentInfo != null && <div className={classnames(styles.tableItemTag2, styles.tableItemTagMultiple)}>千邮千面</div>} */}
                {item.multipleContentInfo != null && (
                  <span className={`${styles.tableStateWrap}`}>
                    <Tag type="label-2-1">{getIn18Text('QIANYOUQIANMIAN')}</Tag>
                  </span>
                )}
              </div>

              <div className={styles.mailState}>
                {/* todo详情传参 */}
                {renderTableRowData(item)}

                {/* todo 需要修改打开详情的传参 */}
                {/* <span onClick={() => openTabDetail(item, 0)}>
                <MoreIcon1 className={styles.highlightIcon} />
                <span className={styles.highlightText}>营销人数</span>
                <span className={styles.highlight}>{item.emailStatus === 0 ? '-' : item.sendCount}</span>
              </span>
              <span className={styles.left24} onClick={() => openTabDetail(item, 0)}>
                <MoreIcon1 className={styles.highlightIcon} />
                <span className={styles.highlightText}>{getIn18Text('SHOUJIANRENSHU')}</span>
                <span className={styles.highlight}>{item.emailStatus === 0 ? '-' : item.sendCount}</span>
              </span> */}
                {/* <span className={styles.left24} onClick={() => openTabDetail(item, 1)}>
                                <MoreIcon2 className={styles.highlightIcon}/>
                                <span className={styles.highlightText}>{getIn18Text("FASONG")}</span>
                                <span className={styles.highlight}>
                                    {item.emailStatus === 0 ? '-' : item.sendCount}
                                </span>
                            </span> */}
                {/* <span className={styles.left24} onClick={() => openTabDetail(item, 2)}>
                <MoreIcon3 className={styles.highlightIcon} />
                <span className={styles.highlightText}>送达人数</span>
                <span className={styles.highlight}>{item.emailStatus === 0 ? '-' : item.arriveCount}</span>
              </span>
              <span className={styles.left24} onClick={() => openTabDetail(item, 3)}>
                <MoreIcon4 className={styles.highlightIcon} />
                <span className={styles.highlightText}>{'打开人数'}</span>
                <span className={styles.highlight}>{item.emailStatus === 0 ? '-' : item[key]}</span>
              </span>
              <span className={styles.left24} onClick={() => openTabDetail(item, 4)}>
                <MoreIcon5 className={styles.highlightIcon} />
                <span className={styles.highlightText}>{'回复人数'}</span>
                <span className={styles.highlight}>{item.emailStatus === 0 ? '-' : item.replyCount}</span>
              </span> */}
                {/* <span className={styles.left24} onClick={() => openTabDetail(item, 5)}>
                <MoreIcon6 className={styles.highlightIcon} />
                <span className={styles.highlightText}>{'退订人数'}</span>
                <span className={styles.highlight}>{item.emailStatus === 0 ? '-' : item.unsubscribeCount}</span>
              </span> */}
              </div>
              {/* 时间区域 */}
              <div className={styles.sendTime}>
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
      className: styles.actionColumn,
      render(_: string, item: EdmEmailInfo) {
        const hasDelPermisson = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'EDM', 'DELETE'));
        const hasOperation = hasDelPermisson || (item.emailStatus === 0 && item.sendType === 2 && item.sendboxType === 6) || item.emailStatus === 0;
        return (
          <div className={styles.rowRight}>
            <a onClick={() => openDetail(item)}>{getIn18Text('XIANGQING')}</a>
            {!item.batchId && item.isDel != 1 && item.level != 2 && (
              <PrivilegeCheck accessLabel="OP" resourceLabel="EDM">
                {/* loading={curActionId == item.id} */}
                <a onClick={() => handleCopy(item)}>{getIn18Text('FUZHI')}</a>
              </PrivilegeCheck>
            )}
            {/* 撤销操作，待发送的二次营销任务 */}
            {item.level === 2 && [0, 1].includes(item.emailStatus) && <a onClick={() => handleRevert(item)}>{getIn18Text('CHEXIAO')}</a>}
            {/* 托管营销入口：1. 模板弹窗不能展示 */}
            {activeTaskTab === '0' && item.level !== 2 && item.arriveCount > 0 && item.emailStatus === 2 && (
              // 渲染这么多次，怎么能使用ref呢？ref每次都指向了最后一次！！！
              <AiMarketingEnter
                key={item.edmEmailId}
                ref={aiMarketingEnterRef}
                contacts={aiMarketingEnterContacts}
                btnType="default"
                text={getIn18Text('YINGXIAOTUOGUAN')}
                handleType="normal"
                afterCompleteClick={() => afterClick()}
                trackFrom="listTask"
                renderBtn={() => (
                  <Button
                    disabled={item.hostingStatus !== 0}
                    onClick={() => {
                      edmApi
                        .getParentDetail({
                          edmEmailId: item.edmEmailId,
                          hideAutoReply: false,
                        })
                        .then(res => {
                          const arriveList: any = res.arriveList;
                          setAiMarketingEnterContacts(arriveList);
                          setCurtEdmEmailId(item.edmEmailId);
                        });
                    }}
                    btnType="default"
                  >
                    {item.hostingStatus === 0 ? getIn18Text('YINGXIAOTUOGUAN') : getIn18Text('YITUOGUAN')}
                  </Button>
                )}
              />
            )}
            {item.level != 2 && (
              <div className={styles.rightTopOp}>
                <>
                  {hasOperation && !item.batchId && item.isDel != 1 && (
                    <PrivilegeCheck accessLabel="OP|DELETE" resourceLabel="EDM">
                      <Popover content={renderOverlay(item)} placement="bottomRight" trigger="click" overlayClassName="hide-arrow">
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
          return <UpLine className={expanded ? styles.expanded : styles.collapse} onClick={e => onExpand(record, e)} />;
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
        return <UpLine className={expanded ? styles.expanded : styles.collapse} onClick={e => onExpand(record, e)} />;
      },
    };
  };

  const renderOverlay = (item: EdmEmailInfo) => {
    return (
      <div className={styles.popoverContent}>
        {/* 发送中的不能删除 */}
        <PrivilegeCheck accessLabel="DELETE" resourceLabel="EDM">
          {item.emailStatus !== 1 && (
            <div onClick={() => handleDelete(item)} className={styles.popoverContentTitle}>
              {getIn18Text('SHANCHU')}
            </div>
          )}
        </PrivilegeCheck>
        <PrivilegeCheck accessLabel="OP" resourceLabel="EDM">
          {/* <div onClick={() => handleCopy(item)} className={styles.popoverContentTitle}>复制</div> */}
          {item.emailStatus === 0 && item.sendType === 2 && item.sendboxType === 6 && (
            <div className={styles.popoverContentTitle} onClick={() => handleCronEdit(item)}>
              {getIn18Text('XIUGAI')}
            </div>
          )}
          {/* 待发送和发送中的支持撤销 */}
          {[0, 1].includes(item.emailStatus) && (
            <div className={styles.popoverContentTitle} onClick={() => handleRevert(item)}>
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
  const handleCopy = (item: EdmEmailInfo) => {
    setCurActionId(item.id + '');
    setCopyLoading(true);
    handleCopyDraft(item.edmEmailId).finally(() => {
      setCopyLoading(false);
      setCurActionId('');
    });
  };
  const handleRevert = (item: EdmEmailInfo) => {
    SiriusModal.confirm({
      title: getIn18Text('QUEDINGYAOCHEXIAOMA'),
      okText: getIn18Text('CHEXIAO'),
      onOk: () => {
        edmApi
          .revertFromSendBox({ edmEmailId: item.edmEmailId })
          .then(() => {
            fetch();
          })
          .catch(err => {
            console.log(err);
            if (err && err.code === 430) {
              return message.error(getIn18Text('WUKECHEXIAOYOUJIAN'));
            }
            onHttpError(err);
          });
      },
    });
  };
  const openDetail = (item: EdmEmailInfo) => {
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

    // 详情页返回需要保留列表分页以及滚动状态，详情页改为在本页面展示
    setDetailProp({ visible: true, qs });
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
    // 详情页返回需要保留列表分页以及滚动状态，详情页改为在本页面展示
    setDetailProp({ visible: true, qs, target });
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
  useEffect(() => {
    if (visiable) {
      fetchSendCount();
    }
  }, [visiable]);
  const indeterminateStatus = useMemo(() => {
    return selectedRowKeys.length > 0 && selectedRowKeys.length < flattenTableData.length;
  }, [selectedRowKeys]);
  const allCheckedStatus = useMemo(() => {
    return selectedRowKeys.length === flattenTableData.length;
  }, [selectedRowKeys]);

  // 顶部tab切换
  const handleChangeActiveTab = (nextActiveTab: number) => {
    setActiveTab(nextActiveTab);
    setSearchCondition({ ...defaultSearchCondition, isDel: searchCondition.isDel });
    setTimeRange(null);
    setTimeType('');
    setSelectedRowKeys([]);
  };

  const CreateEdmTaskButtonComp = () => {
    return (
      <PrivilegeCheck accessLabel="OP" resourceLabel="EDM">
        <Button
          btnType="primary"
          className={classnames('ant-btn-wide', 'sirius-no-drag', styles.dropdownButton)}
          style={{ float: 'right', minWidth: 'auto' }}
          onClick={() => handleAddNew('write')}
        >
          {getIn18Text('XINJIANRENWU')}
        </Button>
      </PrivilegeCheck>
    );
  };

  const TaskListFilterComp = () => {
    return (
      <div ref={filterBlock} className={styles.filterBlock}>
        <Space wrap={false}>
          <div tabIndex={0} className={styles.dateWrap}>
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
            <div className={styles.splitLine}></div>
            <RangePicker
              separator=""
              style={{ width: 218, height: 32 }}
              // className={searchCondition.recentlyUpdateTime ? '' : 'edm-range-picker'}
              placeholder={[getIn18Text('KAISHISHIJIAN'), getIn18Text('JIESHUSHIJIAN')]}
              locale={cnlocale}
              value={timeRange}
              format={dateFormat}
              onChange={timeToggle}
              disabledDate={disabledDate}
              dropdownClassName="edm-date-picker-dropdown-wrap"
              className={styles.rangePicker}
            />
          </div>

          {/* {activeTab == 2 ? (
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
          ) : null} */}
          <Input
            style={{ width: 110 }}
            maxLength={100}
            max={100}
            placeholder={getIn18Text('RENWUZHUTI')}
            prefix={<SearchIcon />}
            suffix={null}
            allowClear
            onPressEnter={handleQueryChange}
            onBlur={handleQueryChange}
            value={searchCondition.edmSubject}
            onChange={handleQueryChange}
          />
          <EnhanceSelect
            style={{ width: 114 }}
            placeholder={getIn18Text('RENWUXINJIANZHUANGTAI')}
            // suffixIcon={<DownTriangle />}
            value={searchCondition.emailStatus}
            onChange={handleMarketingStateChange}
            // dropdownClassName="edm-selector-dropdown"
            className={styles.borderSelect}
          >
            {marketingState.map(item => (
              <InSingleOption value={item.status} key={item.status}>
                {item.text}
              </InSingleOption>
            ))}
          </EnhanceSelect>
          <Input
            style={{ width: 120 }}
            maxLength={200}
            max={200}
            placeholder={getIn18Text('LIANXIRENYOUXIANG')}
            prefix={<SearchIcon />}
            suffix={null}
            allowClear
            onPressEnter={handleContactEmailChange}
            onBlur={handleContactEmailChange}
            value={searchCondition.contactEmail}
            onChange={handleContactEmailChange}
          />
          {!inFFMS && (
            <EnhanceSelect
              style={{ width: 120 }}
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
    if (statInfo == null) {
      // if (true) {
      return (
        <div className={styles.overviewEmpty}>
          <Skeleton active loading></Skeleton>
        </div>
      );
    }

    return (
      <div className={styles.statisticsList}>
        {overviewConf?.map((item, index) => {
          let percentage: string | number | undefined = '';
          if (item.subKey) {
            const subnum = statInfo[item.subKey];
            percentage = typeof subnum === 'number' ? subnum / 100 : subnum;
          }
          return (
            <div key={index} className={styles.statisticsItem}>
              <div key={index} className={styles.statisticsTitle}>
                {item.title}
              </div>
              <div key={index} className={styles.statisticsCount}>
                {statInfo[item.key]}
              </div>
              {item.subKey != null && item.subTitle != null && (
                <div key={index} className={styles.statisticsInfo}>
                  <div key={index} className={styles.statisticsInfoTitle}>
                    {item.subTitle}
                  </div>
                  <div key={index} className={styles.statisticsInfoCount}>
                    {percentage}%
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );

    return (
      <div ref={statisticsList} className={styles.statisticsList}>
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
              icon={<Icon className={`${styles.statisticsIcon}`} />}
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
      <div className={styles.mainContent}>
        {tableData.length >= 0 && (
          <>
            <div className={styles.tableHeader}>
              {activeTab == 2 ? (
                <div className={styles.isDelCheck}>
                  <Checkbox onChange={handleIsDelChange} checked={searchCondition.isDel === '-1'}>
                    {getIn18Text('XIANSHIQUANBULISHIRENWU')}
                  </Checkbox>
                  <Tooltip title={getIn18Text('QUANBULISHIRENWU\uFF0CBAOHANWEISHANCHUHEYISHANCHUDERENWU')}>
                    <QuestionIcon className={styles.isDelCheckTipIcon} />
                  </Tooltip>
                </div>
              ) : null}
              <Tabs size="small" className={styles.tableFilterTabs} activeKey={String(activeTab)} onChange={tab => handleChangeActiveTab(+tab)}>
                <TabPane tab={getIn18Text('WODERENWU')} key="1"></TabPane>
                {isOwner || inFFMS ? '' : <TabPane tab={getIn18Text('QUANBURENWU')} key="2"></TabPane>}
              </Tabs>
            </div>
            <div className={styles.tableContent} ref={pdfRef}>
              {/* 是否展示托管营销banner */}
              {/* <AihostingBanner /> */}
              {sendBoxCof?.edmHostingState == 0 && <AihostingBanner />}
              <div className={styles.btnHeader}>
                <div className={styles.hasSelected}>
                  {getIn18Text('YIXUAN')}
                  {selectedRowKeys.length}
                  {getIn18Text('GE')}
                </div>
                <div className={styles.btnWrapper}>
                  <Button btnType="minorLine" inline onClick={() => selectInterceptor(() => handleBatchDelete(selectedRowKeys))}>
                    {getIn18Text('PILIANGSHANCHU')}
                  </Button>
                </div>
              </div>
              <Table
                className={classnames(styles.table, styles.sendListTable, styles.circle, +activeTaskTab === 0 ? styles.secondTable : '')}
                rowKey={record => record.edmEmailId || record.batchId}
                loading={loading}
                rowSelection={rowSelection}
                rowClassName={record => {
                  return expandedRowKeys.includes(record.edmEmailId || record.batchId) ? styles.rowExpanded : '';
                }}
                expandable={getExpandableConf()}
                pagination={false}
                columns={columns}
                dataSource={transformTableData(tableData)}
                showHeader={true}
                locale={{
                  emptyText: <Empty image={NoDataIcon} description={<span className={styles.noDataDesc}>{getIn18Text('ZANWURENWU')}</span>} />,
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
      <div hidden={detailProp.visible} className={styles.paginationWrap}>
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
            }));
          }}
        />
      </div>
    );
  };

  const TaskTypeTabComp = () => {
    return (
      <div style={{ margin: '16px 0 6px' }}>
        <CustomerTabs tabNameList={tabs} defaultActiveKey="1" activeKey={String(activeTab)} onChange={handleChangeActiveTab} className="" />
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
    // 无我的发件任务并且未展示过引导页面则展示
    const res = await storeApi.get(SEND_TASK_GUIDE);
    setShowGuide(!hasRecord && !res?.suc);
    // 无我的发件任务，不请求数据
    if (hasRecord) {
      fetch();
      fetchSendCount();
    }
  };

  // 营销运营页面，展示条件：发件任务中无普通任务和分批任务
  const sendedOperationComp = () => {
    const handleAllTask = () => {
      handleChangeActiveTab(2);
      storeApi.put(SEND_TASK_GUIDE, 'true');
      setShowGuide(false);
    };
    return (
      <div className={styles.sendedOperation} style={{ display: visiable ? 'flex' : 'none' }}>
        <div className={styles.operationLeft}>
          <p className={styles.operationTitle}>{getIn18Text('YOUJIANYINGXIAO')}</p>
          <p className={styles.operationDesc}>
            {getIn18Text('YIJIANSHENGCHENGQUNFAYOU')}
            <span className={styles.operationMore} onClick={handleMore}>
              {getIn18Text('LIAOJIEGENGDUO')}
              <ArrowRightBlueIcon />
            </span>
          </p>
          <div className={styles.operationDetail}>
            <div className={styles.detailItem}>
              <SendedOperation1 />
              <div>
                <p className={styles.itemTitle}>{getIn18Text('SHENGSHISHENGLIYIJIANYING')}</p>
                <p className={styles.itemDesc}>{getIn18Text('PILIANGQUNFAYINGXIAOYOU')}</p>
              </div>
            </div>
            <div className={styles.detailItem}>
              <SendedOperation2 />
              <div>
                <p className={styles.itemTitle}>{getIn18Text('GAOZHUANHUALVYINGXIAOYOU')}</p>
                <p className={styles.itemDesc}>{getIn18Text('YOUZHIHAIWAIIP、')}</p>
              </div>
            </div>
            <div className={styles.detailItem}>
              <SendedOperation3 />
              <div>
                <p className={styles.itemTitle}>{getIn18Text('XIAOGUOSHUJUSHISHIZHUI')}</p>
                <p className={styles.itemDesc}>{getIn18Text('YINGXIAOXIAOGUOSHUJUYI')}</p>
              </div>
            </div>
          </div>
          <div className={styles.operationBtn}>
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
        <div className={styles.operationRight}>
          <SendedOperationRight />
        </div>
      </div>
    );
  };

  return (
    <PermissionCheckPage resourceLabel="EDM" accessLabel="VIEW" menu="EDM_MULTI_ACCOUNT_INFO">
      <div className={styles.root}>
        <Header sendEdmCount={statInfo?.sendEdmCount} orgAvailableSendCount={sendCount?.orgAvailableSendCount} forceUpdate={forceUpdate} />
        <AccountData openDetail={() => setShowWarmUpDetail(true)} />
        <div className={styles.listWrap}>
          <div className={styles.header}>
            <div className={styles.title}>{getIn18Text('DUOYUMINGYINGXIAOSHUJU')}</div>
            {/* <div className={styles.right}>
              <div tabIndex={0} className={styles.dateWrap}>
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
                <div className={styles.splitLine}></div>
                <RangePicker
                  separator=""
                  style={{ width: 244, height: 32 }}
                  // className={searchCondition.recentlyUpdateTime ? '' : 'edm-range-picker'}
                  placeholder={[getIn18Text('KAISHISHIJIAN'), getIn18Text('JIESHUSHIJIAN')]}
                  locale={cnlocale}
                  value={timeRange}
                  format={dateFormat}
                  onChange={timeToggle}
                  disabledDate={disabledDate}
                  dropdownClassName="edm-date-picker-dropdown-wrap"
                  className={styles.rangePicker}
                />
              </div>
            </div> */}
          </div>
          {TaskListFilterComp()}
          {OverviewComp()}
        </div>
        {ContentListComp()}
        {PagingComp()}
        {detailProp.visible ? (
          <div className={styles.detailWrapper} style={isWindows ? { paddingTop: '32px' } : {}}>
            <EdmDetail
              target={detailProp.target}
              qs={detailProp.qs}
              index={detailProp.index}
              goBack={() => {
                setDetailProp({ visible: false, qs: {} });
                // location.hash = '#edm?page=index';
                const routerWord = systemApi.isWebWmEntry() ? '#intelliMarketing' : '#edm';
                window.location.hash = routerWord + '?page=senderRotateList';
              }}
            ></EdmDetail>
          </div>
        ) : null}
        {showWarmUpDetail && (
          <div className={styles.detailWrapper} style={isWindows ? { paddingTop: '32px' } : {}}>
            <WarmUpDetail onClose={() => setShowWarmUpDetail(false)} />
          </div>
        )}
      </div>
    </PermissionCheckPage>
  );
};

export const handleCopyDraft = async (edmEmailId: string) => {
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
    navigate('#edm?page=write&channel=senderRotate&from=copyTask&id=' + id);
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

export default SenderRotateList;
