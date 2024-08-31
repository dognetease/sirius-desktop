import { Skeleton, DatePicker, Row } from 'antd';
// import SiriusTable from '@web-common/components/UI/Table';
// import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import Table from '@/components/Layout/Customer/components/UI/Table/table';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import { EnhanceSelect, InSingleOption } from '@web-common/components/UI/Select';
import { EnhanceSelect, InSingleOption } from '@lingxi-common-component/sirius-ui/Select';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import React, { useEffect, useReducer, useRef, useState } from 'react';
// import Pagination from '@web-common/components/UI/Pagination';
import Pagination from '@lingxi-common-component/sirius-ui/Pagination';
import { AddressBookApi, apiHolder, apis, EdmSendBoxApi, isFFMS, AddressBookContactLabel, ResponseCustomerNewLabelByEmail, ContactInfo, IStatsEmailItem } from 'api';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { ColumnType, SorterResult } from 'antd/lib/table/interface';
import { getModuleAccessSelector, isOwnerDataPrivilegeSelector } from '@web-common/state/reducer/privilegeReducer';
import { useAppSelector, useActions, ConfigActions } from '@web-common/state/createStore';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { getTransText } from '@/components/util/translate';
import style from '../edm.module.scss';
import contactStyle from './style.module.scss';
import { EdmPageProps } from '../pageProps';
import { ContactTrackingFilterType, edmDataTracker, EDMPvType, HistoryActionTrigger } from '../tracker/tracker';
import { MailReplyListModal } from '../components/historyAction/replyModal';
import { ArriveModal } from '../components/historyAction/arriveModal';
import { ReadSummaryModal } from '../components/historyAction/readSummaryModal';
import { SendOperateModal } from '../components/historyAction/sendModal';
import { TableFilter } from './filter';
import CustomerTabs from '../Tabs/tabs';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import moment, { Moment } from 'moment';
import { ReactComponent as RangeDate } from '@/images/icons/edm/range-date.svg';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import { ReactComponent as VideoIcon } from '@/images/icons/edm/video.svg';
import { getIn18Text } from 'api';
import { EdmStatKey, StatItemData } from './../../src/utils';
import { StatisticItem } from './../components/statistics/statisticsItem';
import { SiriusCustomerTagByEmail } from '@lxunit/app-l2c-crm';
import useEdmSendCount from '@/components/Layout/Customer/components/hooks/useEdmSendCount';

// const { Option } = Select;
const { RangePicker } = DatePicker;
const inFFMS = isFFMS();
const dateShowFormat = 'yyyy.MM.DD';

function disabledDate(current: Moment) {
  return current && (current > moment().endOf('day') || current < moment('1900-01-01').endOf('day'));
}

interface IMarketItem {
  contactName: string;
  contactEmail: string;
}

interface contactInfo extends Omit<AddressBookContactLabel, 'email'> {
  contactEmail: string;
  contactName: string;
  sendCount: number;
  arriveCount: number;
  readCount: number;
  replyCount: number;
  unsubscribeCount: number;
  recentlyUpdateTime: string;
  parentArriveCount?: number;
  deliverTime: string;
}
interface IContactFilter {
  page: number;
  sent?: boolean;
  traceStatus?: number;
  minSendCount?: number;
  minReadCount?: number;
}
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
let fetchDataTimestamp = 0;

import { ReactComponent as Statistics0 } from '@/images/icons/edm/statistics0.svg';
import { ReactComponent as Statistics2 } from '@/images/icons/edm/statistics2.svg';
import { ReactComponent as Statistics3 } from '@/images/icons/edm/statistics3.svg';
import { ReactComponent as Statistics4 } from '@/images/icons/edm/statistics4.svg';

const emdStaticsList: Array<EdmStatKey> = [
  {
    title: getIn18Text('FAJIANZONGSHU'),
    dataIndex: 'sendCount',
    position: 'list',
    Icon: Statistics0,
  },
  {
    title: getIn18Text('SONGDAZONGSHU'),
    dataIndex: 'arriveCount',
    position: 'list',
    Icon: Statistics2,
    url: '/d/1640684506989031426.html',
  },
  {
    title: getIn18Text('DAKAIRENSHU'),
    dataIndex: 'readCount',
    position: 'list',
    Icon: Statistics3,
    url: '/d/1674041360610545665.html',
  },
  {
    title: getIn18Text('HUIFURENSHU'),
    dataIndex: 'replyCount',
    position: 'list',
    Icon: Statistics4,
  },
];

const videoDrawerConfig = { videoId: 'V19', source: 'kehukaifa', scene: 'kehukaifa_11' };

export const Contact: React.FC<EdmPageProps> = props => {
  const [statData, setStatData] = useState<Array<StatItemData> | null>(null);

  const OverviewComp = () => {
    if (statData == null) {
      return (
        <div className={style.overviewEmpty}>
          <Skeleton active loading></Skeleton>
        </div>
      );
    }

    return (
      <div className={style.statisticsList} style={{ gap: '12px' }}>
        {statData.map((item, index) => {
          let Icon: typeof React.Component = item.Icon;
          return (
            <StatisticItem key={index} data={item} style={{ flex: '1 0 148px', padding: '10px 6px 10px 12px' }} icon={<Icon className={`${style.statisticsIcon}`} />} />
          );
        })}
      </div>
    );
  };
  // table 外层容器
  const container = useRef<HTMLDivElement>(null);
  // loading状态
  const [loading, setLoading] = useState(false);
  const hasEditPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'EDM', 'OP'));
  // 列表数据
  const [list, setList] = useReducer((state: contactInfo[], action: { type: string; payload: contactInfo[] }) => {
    switch (action.type) {
      case 'update':
        return action.payload;
      case 'append':
        return [...state, ...action.payload];
      default:
    }
    return state;
  }, []);
  // 排序字段
  const [sort, setSort] = useState(''); // 排序字段，格式形如xxx:desc/asc，根据某个字段升序或降序。支持排序字段为：sendCount（发送数）、readCount（阅读数）、replyCount（回复数）、recentlyUpdateTime（最新动态时间）
  // 每次请求条数
  const [pageSize, setPageSize] = useState(20);
  // 总条数
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [modalData, setModalData] = useState<Array<any>>([]);
  const [replyModal, setReplyModal] = useState<{
    data?: any[];
    visible: boolean;
  }>({
    visible: false,
  });

  const [sendModal, setSendModal] = useState<{
    data?: any[];
    visible: boolean;
  }>({
    visible: false,
  });

  // 表格高度
  const [tableHeight, setTableHeight] = useState(456);
  const mainRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(1);

  const [showRowSelection, setShowRowSelection] = useState<boolean>(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<contactInfo[]>([]);
  const [allRowMap, setAllRowMap] = useState<{ [key: string]: contactInfo } | null>(null);
  const [arriveModal, setArriveModal] = useState<{ visible: boolean; data?: any }>({ visible: false });
  const productRef = useRef<{ refresh: () => void }>(null);

  const { showVideoDrawer } = useActions(ConfigActions);

  const [marketList, setMarketList] = useState<Array<IMarketItem>>([]);

  useEdmSendCount(marketList, undefined, undefined, undefined, undefined, 'addressBook');

  const handleResend = () => {
    const list = (selectedRows || []).map(item => {
      return {
        contactName: item.contactName,
        contactEmail: item.contactEmail,
      };
    });
    setMarketList(list);
  };

  const defaultSelectMenus = [
    {
      page: 1,
      pageSize: -1,
      text: getIn18Text('QUANXUAN'),
      checked: false,
    },
  ];

  const [selectMenus, setSelecteMenus] = useState(defaultSelectMenus);

  const resetSelect = (noSelectMenu?: boolean) => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
    setAllRowMap(null);
    if (!noSelectMenu) {
      setSelecteMenus(defaultSelectMenus);
    }
  };

  const [filters, setFilters] = useReducer(
    (state: IContactFilter, action: { type: string; payload?: any }) => {
      switch (action.type) {
        case 'loadMore': {
          return {
            ...state,
            page: state.page + 1,
          };
        }
        case 'refresh': {
          return {
            ...state,
            page: 0,
          };
        }
        case 'update': {
          return {
            ...state,
            ...action.payload,
          };
        }
        default:
      }
      return {
        ...state,
        ...action.payload,
      };
    },
    {
      page: 0,
    }
  );

  const getStatData = async () => {
    const params: { [key: string]: number | string | Array<string> } = {
      ...filters,
    };

    delete params.page;
    delete params.sort;
    //@ts-ignore
    if (params.sendTime && params.sendTime[0].length) {
      params.sendTime = params.sendTime.join('-');
    } else {
      delete params.sendTime;
    }

    let promise;
    if (activeTab == 2) {
      promise = edmApi.getEdmTraceStatsAll(params);
    } else {
      promise = edmApi.getEdmTraceStats(params);
    }

    setStatData(null);

    promise
      .then(data => {
        const listData = emdStaticsList.map(item => {
          return Object.assign({}, item, {
            //@ts-ignore
            num: data[item.dataIndex],
          });
        });
        setStatData(listData);
      })
      .catch(err => {
        setStatData([]);
        console.error(err);
      });
  };

  useEffect(() => {
    getStatData();
  }, [filters]);

  const getEmailList = async () => {
    try {
      if (!totalRecords) {
        return [];
      }
      const params: { [key: string]: number | string | Array<string> } = {
        pageSize: totalRecords + 100,
        ...filters,
        page: 0,
      };
      const listParams = getListParam(params);
      let promise;
      if (activeTab == 2) {
        promise = edmApi.getEdmTraceStatsEmailListAll(listParams);
      } else {
        promise = edmApi.getEdmTraceStatsEmailList(listParams);
      }

      return promise
        .then(data => {
          if (!data || !data.length) {
            return [];
          }
          const emailFilteList = data.filter(emailItem => {
            if (emailItem && emailItem.contactEmail) {
              return true;
            }
            return false;
          });
          const set = new Set();
          const emailList: Array<IStatsEmailItem> = [];
          emailFilteList.forEach(emailItem => {
            if (set.has(emailItem.contactEmail)) {
              return;
            }
            emailList.push(emailItem);
            set.add(emailItem.contactEmail);
          });
          return emailList;
        })
        .catch(err => {
          console.error(err);
          return [];
        });
    } catch (ex) {
      return [];
    }
  };

  const [emailLabelMap, setEmailLabelMap] = useState<{ [key: string]: ResponseCustomerNewLabelByEmail }>({});

  const refreshEmailLabelsMap = async (emails: Array<string>) => {
    return edmApi.getCustomerNewLabelByEmail({ email_list: emails }).then(res => {
      let result: { [key: string]: ResponseCustomerNewLabelByEmail } = {};
      res.forEach(item => {
        result[item.contact_email] = item;
      });
      setEmailLabelMap(result);
    });
  };

  const getListParam = (params: { [key: string]: number | string | Array<string> }) => {
    const mailTraceMap: { [key: string]: { [key: string]: number } } = {
      undefined: {
        true: 2,
        false: 4,
      },
      true: {
        undefined: 1,
        true: 6,
        false: 7,
      },
      false: {
        undefined: 3,
        true: 8,
        false: 5,
      },
    };
    if (typeof params.reply === 'undefined' && typeof params.unsubscribe === 'undefined') {
      params.traceStatus = '';
    } else {
      params.traceStatus = (mailTraceMap[params.reply as string] || {})[params.unsubscribe as string] || '';
    }

    delete params.reply;
    delete params.unsubscribe;
    //@ts-ignore
    if (params.sendTime && params.sendTime[0].length) {
      //@ts-ignore
      params.sendTime = params.sendTime.join('-');
    } else {
      delete params.sendTime;
    }

    Object.keys(params).forEach(k => {
      if (params[k] === undefined || params[k] === '') {
        delete params[k];
      }
    });
    return params;
  };

  // 获取列表数据
  const getListData = async () => {
    if ((loading || list.length >= totalRecords) && filters.page > 0) {
      return;
    }

    setTotalRecords(0);
    const params: { [key: string]: number | string | Array<string> } = {
      pageSize,
      sort,
      ...filters,
    };

    const listParam = getListParam(params);
    setLoading(true);
    const _lastFetchTime = (fetchDataTimestamp = +new Date());

    let promise;

    if (activeTab == 2) {
      promise = edmApi.getEdmTraceListAll(listParam);
    } else {
      promise = edmApi.getEdmTraceList(listParam);
    }

    setList({ type: 'update', payload: [] });
    promise
      //@ts-ignore
      .then(async data => {
        if (_lastFetchTime !== fetchDataTimestamp) {
          return;
        }
        if (activeTab == 2) {
          if (data.contactInfoList && data.contactInfoList.length) {
            await refreshEmailLabelsMap(data.contactInfoList.map(item => item.contactEmail));
          }
          setList({ type: 'update', payload: data.contactInfoList });
          setTotalRecords(data.totalContactCount || 0);
        } else {
          let nextList = data.contactInfoList;
          let nextTotal = data.totalContactCount || 0;
          if (nextTotal === 0) {
            setList({ type: 'update', payload: [] });
            setTotalRecords(nextTotal);
            return;
          }

          if (nextList && nextList.length) {
            await refreshEmailLabelsMap(nextList.map(item => item.contactEmail));
          }
          setList({ type: 'update', payload: nextList });
          setTotalRecords(nextTotal);
        }
      })
      .catch(e => {
        console.log(e);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getListData();
  }, [filters]);

  const receiveStatusList = [
    {
      name: getIn18Text('YISONGDA'),
      id: 1,
    },
    {
      name: getIn18Text('WEISONGDA'),
      id: 0,
    },
  ];

  const openStatusList = [
    {
      name: getIn18Text('YIDAKAI'),
      id: 1,
    },
    {
      name: getIn18Text('WEIDAKAI'),
      id: 0,
    },
  ];

  const replyStatusList = [
    {
      name: getIn18Text('YIHUIFU'),
      id: 1,
    },
    {
      name: getIn18Text('WEIHUIFU'),
      id: 0,
    },
  ];

  const unsubscribeStatusList = [
    {
      name: getIn18Text('YITUIDING'),
      id: 1,
    },
    {
      name: getIn18Text('WEITUIDING'),
      id: 0,
    },
  ];

  const searchEmailKey = (e: React.FormEvent<HTMLInputElement>) => {
    const { value } = e.target as HTMLInputElement;
    if (value !== filters.contactEmailKey) {
      setFilters({ type: 'update', payload: { contactEmailKey: value, page: 0 } });
      resetSelect();
    }
  };

  const onStateChange = (value: number, type: 'receive' | 'open' | 'reply' | 'unsubscribe') => {
    let targetKey = '';
    let targetVal = value === undefined ? undefined : !!value;
    switch (type) {
      case 'open':
        targetKey = 'read';
        break;
      case 'receive':
        targetKey = 'arrive';
        edmDataTracker.trackContactFilterClick(ContactTrackingFilterType.Sent);
        break;
      case 'reply':
        targetKey = 'reply';
        break;
      case 'unsubscribe':
        targetKey = 'unsubscribe';
        break;
    }
    if (!targetKey) return;
    setSort('');
    setFilters({
      type: 'update',
      payload: {
        page: 0,
        [targetKey]: targetVal,
        sort: '',
      },
    });
    resetSelect();
    edmDataTracker.trackContactFilterClick(ContactTrackingFilterType.State);
  };

  let columns: ColumnType<contactInfo>[] = [
    {
      title: getIn18Text('YOUXIANG'),
      ellipsis: true,
      width: 256,
      dataIndex: 'contactEmail',
      render: (text: string, item: contactInfo) => {
        const emailStr = item.contactEmail;
        const labelInfo = emailLabelMap[emailStr];
        if (labelInfo) {
          return (
            <div className={contactStyle.cellContainer}>
              <span title={text} className={contactStyle.contactEmail}>
                {text}
              </span>
              <SiriusCustomerTagByEmail email={emailStr} labelInfos={[labelInfo]}></SiriusCustomerTagByEmail>
            </div>
          );
        }
        return text;
      },
    },
    {
      title: getIn18Text('LIANXIREN'),
      width: 150,
      ellipsis: true,
      dataIndex: 'contactName',
    },
    {
      title: getIn18Text('RECENT_SEND_MAIL_TIME'),
      width: 180,
      ellipsis: true,
      dataIndex: 'deliverTime',
      render: (_, row) => row.deliverTime || '-',
    },
    {
      title: getIn18Text('FAJIANCISHU'),
      width: 110,
      dataIndex: 'sendCount',
      ellipsis: true,
      render(sendCount: number, item: contactInfo) {
        return sendCount > 0 ? <a onClick={() => openSendModal(item, HistoryActionTrigger.Send)}>{sendCount}</a> : '-';
      },
      sorter: (a: contactInfo, b: contactInfo) => a.sendCount - b.sendCount,
      filteredValue: filters.minSendCount,
      filterDropdown: ({ confirm, clearFilters }) => (
        <TableFilter
          clearFilters={clearFilters}
          confirm={confirm}
          inputLabel={getIn18Text('FAJIANCISHU≥')}
          onChange={value => setFilters({ type: 'update', payload: { minSendCount: value, page: 0 } })}
        />
      ),
    },
    {
      title: getIn18Text('SONGDACISHU'),
      width: 110, // setArriveModal({ visible: false })
      dataIndex: 'arriveCount',
      ellipsis: true,
      sorter: (a: contactInfo, b: contactInfo) => a.arriveCount - b.arriveCount,
      render(arriveCount: number, item: contactInfo) {
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        if (item.parentArriveCount != null && item.parentArriveCount > 0) {
          return <a onClick={() => openArraiveModal(item, HistoryActionTrigger.Arrive)}>{arriveCount}</a>;
        }
        return arriveCount > 0 ? <a onClick={() => openArraiveModal(item, HistoryActionTrigger.Arrive)}>{arriveCount}</a> : '-';
      },
      filteredValue: filters.minArriveCount,
      filterDropdown: ({ confirm, clearFilters }) => (
        <TableFilter
          clearFilters={clearFilters}
          confirm={confirm}
          // showSwitch
          // switchLabel="是否送达"
          inputLabel={getIn18Text('SONGDACISHU≥')}
          onChange={value => setFilters({ type: 'update', payload: { minArriveCount: value, page: 0 } })}
        />
      ),
    },
    {
      title: getIn18Text('DAKAICISHU'),
      width: 110,
      ellipsis: true,
      dataIndex: 'readCount',
      sorter: (a: contactInfo, b: contactInfo) => a.readCount - b.readCount,
      render(readCount: number, item: contactInfo) {
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        return readCount > 0 ? <a onClick={() => openMenuFor(item, HistoryActionTrigger.ReadCount)}>{readCount}</a> : '-';
      },
      filteredValue: filters.minReadCount,
      filterDropdown: ({ confirm, clearFilters }) => (
        <TableFilter
          clearFilters={clearFilters}
          confirm={confirm}
          inputLabel={getIn18Text('DAKAICISHU≥')}
          onChange={value => setFilters({ type: 'update', payload: { minReadCount: value, page: 0 } })}
        />
      ),
    },
    {
      title: getIn18Text('HUIFUCISHU'),
      width: 110,
      dataIndex: 'replyCount',
      ellipsis: true,
      sorter: (a: contactInfo, b: contactInfo) => a.replyCount - b.replyCount,
      render(replyCount: number, item: contactInfo) {
        return replyCount > 0 ? <a onClick={() => openReplyListModal(item, HistoryActionTrigger.Reply)}>{replyCount}</a> : '-';
      },
    },
    {
      title: getIn18Text('SHIFOUTUIDING'),
      width: 90,
      ellipsis: true,
      dataIndex: 'unsubscribeCount',
      render(unsubscribeCount: number) {
        return unsubscribeCount > 0 ? getIn18Text('SHI') : '-';
      },
    },
  ];
  if (activeTab == 2) {
    columns = columns.filter(item => {
      const dataIndex = (item.dataIndex || item.key || '') as string;

      return !['groupNameList', 'importName', 'contactSourceType'].includes(dataIndex);
    });
  }
  if (!hasEditPermission) {
    columns.splice(columns.length - 1, 1);
  }
  const openMenuFor = (detail: contactInfo, from: HistoryActionTrigger) => {
    edmDataTracker.trackHistoryAction('contactTracking', from);

    const promise =
      activeTab == 2 ? edmApi.getReadOperateListAll({ contactEmail: detail.contactEmail }) : edmApi.getReadOperateList({ contactEmail: detail.contactEmail });

    promise.then(data => {
      const arr: any[] = data.operateInfoList.map(i => ({
        ...i,
        edmSubject: (i as any).edmSubject || '',
      }));
      setModalData(arr);
    });
  };

  const openReplyListModal = (detail: contactInfo, from: HistoryActionTrigger) => {
    edmDataTracker.trackHistoryAction('contactTracking', from);

    const promise =
      activeTab == 2 ? edmApi.getReplyOperateListAll({ contactEmail: detail.contactEmail }) : edmApi.getReplyOperateList({ contactEmail: detail.contactEmail });

    promise.then(data => {
      setReplyModal({
        visible: true,
        data: data.operateInfoList,
      });
    });
  };

  const openArraiveModal = async (detail: contactInfo, from: HistoryActionTrigger) => {
    edmDataTracker.trackHistoryAction('contactTracking', from);
    let res;
    if (activeTab == 2) {
      res = await edmApi.getArriveOperatesAll({ contactEmail: detail.contactEmail });
    } else {
      res = await edmApi.getArriveOperates({ contactEmail: detail.contactEmail });
    }
    setArriveModal({ visible: true, data: res?.arriveInfoList ?? [] });
  };

  const openSendModal = async (detail: contactInfo, from: HistoryActionTrigger) => {
    edmDataTracker.trackHistoryAction('contactTracking', from);
    let res;
    if (activeTab == 2) {
      res = await edmApi.getSendOperateListAll({ contactEmail: detail.contactEmail });
    } else {
      res = await edmApi.getSendOperateList({ contactEmail: detail.contactEmail });
    }
    setSendModal({ visible: true, data: res?.sendInfoList ?? [] });
  };

  // 排序改变
  const handleTableChange = (_: any, __: any, sorterResult: SorterResult<contactInfo> | SorterResult<contactInfo>[]) => {
    const sorter = Array.isArray(sorterResult) ? sorterResult[0] : sorterResult;
    const { field, order } = sorter;
    const sortMap = {
      ascend: 'asc',
      descend: 'desc',
    };
    setSort(order ? `${field}:${sortMap[order]}` : '');
  };
  useEffect(() => {
    edmDataTracker.trackPv(EDMPvType.ContactTracking);
  });
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const dimensions = entry.contentRect;
        setTableHeight(dimensions.height - 101);
      }
    });
    if (mainRef.current) {
      setTableHeight(mainRef.current.clientHeight - 101);
      observer.observe(mainRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [mainRef.current]);

  const isOwner = useAppSelector(state => isOwnerDataPrivilegeSelector(state.privilegeReducer, 'EDM'));
  // const tabs = isOwner ? ['我的数据', '商品数据'] : ['我的数据', '全部数据', '商品数据'];
  let tabs;
  if (inFFMS) {
    tabs = [getIn18Text('WODESHUJU')];
  } else {
    tabs = isOwner ? [getIn18Text('WODESHUJU')] : [getIn18Text('WODESHUJU'), getIn18Text('QUANBUSHUJU')];
  }

  const onChangeUpdateTime = (_, dateString: string[]) => {
    setSort('');

    setFilters({
      type: 'update',
      payload: {
        sendTime: dateString,
        // sendTime: dateString,
        page: 0,
      },
    });
    resetSelect();
  };

  function tabChange(tab: number) {
    setActiveTab(tab);
    setFilters({
      type: 'update',
      payload: {
        page: 0,
      },
    });
    resetSelect();
  }
  const [batchLoading, setBatchLoading] = useState(false);
  return (
    <>
      <div
        className={style.container}
        ref={container}
        style={{
          paddingBottom: 16,
          paddingRight: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div className={`${style.pageHeader} ${style.pageHeader2}`}>
          <div>
            <span className={style.title}>{getIn18Text('SHUJUTONGJI')}</span>
            {list.length > 0 && (
              <span className={style.subTitle}>
                {getIn18Text('GONG')}
                <em className={style.num}>{totalRecords}</em>
                {getIn18Text('GELIANXIREN')}
              </span>
            )}
            <a
              className="edm-page-refresh"
              onClick={() => {
                setFilters({ type: 'refresh' });
                setShowRowSelection(true);
                setSelectedRowKeys([]);
                setSelectedRows([]);
                productRef.current?.refresh();
              }}
            >
              <RefreshSvg />
            </a>
          </div>
          <p className={style.videoTip} onClick={() => showVideoDrawer(videoDrawerConfig)}>
            <VideoIcon /> <span>快速了解邮件营销如何提升送达效果</span>
          </p>
        </div>
        <div style={{ margin: '16px 0 18px' }}>
          <CustomerTabs tabNameList={tabs} defaultActiveKey="1" onChange={tabChange} className="" />
        </div>
        {
          <>
            <div
              className={contactStyle.search}
              style={{ height: 'auto', paddingLeft: '0', paddingTop: '0', paddingRight: '0', marginBottom: '4px', borderRadius: '4px', backgroundColor: 'transparent' }}
            >
              <Row>
                <div className={contactStyle.colNew}>
                  <span className={contactStyle.filterLabelNew} title={getTransText('YOUXIANGDEZHI')}>
                    {getTransText('YOUXIANGDEZHI')}
                  </span>
                  <Input
                    placeholder={getTransText('QINGSHURUYOUXIANG')}
                    className={contactStyle.inputWrapper}
                    style={{ width: 236 }}
                    prefix={<SearchIcon />}
                    onPressEnter={searchEmailKey}
                    onBlur={searchEmailKey}
                    allowClear
                  />
                </div>
                <div className={contactStyle.colNew}>
                  <span className={contactStyle.filterLabelNew}>{getTransText('SHIFOUSONGDA')}</span>
                  <EnhanceSelect
                    style={{ width: 236 }}
                    placeholder={getTransText('QINGXUANZE')}
                    optionFilterProp="children"
                    onChange={val => {
                      onStateChange(val as number, 'receive');
                    }}
                    suffixIcon={<DownTriangle />}
                    dropdownClassName="edm-selector-dropdown"
                    allowClear
                  >
                    {receiveStatusList.map(item => (
                      <InSingleOption value={item.id} key={item.id}>
                        {item.name}
                      </InSingleOption>
                    ))}
                  </EnhanceSelect>
                </div>
                <div className={contactStyle.colNew}>
                  <span className={contactStyle.filterLabelNew}>{getTransText('SHIFOUDAKAI')}</span>
                  <EnhanceSelect
                    style={{ width: 236 }}
                    placeholder={getTransText('QINGXUANZE')}
                    optionFilterProp="children"
                    onChange={val => {
                      onStateChange(val as number, 'open');
                    }}
                    suffixIcon={<DownTriangle />}
                    dropdownClassName="edm-selector-dropdown"
                    allowClear
                  >
                    {openStatusList.map(item => (
                      <InSingleOption value={item.id} key={item.id}>
                        {item.name}
                      </InSingleOption>
                    ))}
                  </EnhanceSelect>
                </div>
                <div className={contactStyle.colNew}>
                  <span className={contactStyle.filterLabelNew} title={getTransText('FASONGSHIJIAN')}>
                    {getTransText('FASONGSHIJIAN')}
                  </span>
                  <RangePicker
                    separator={' - '}
                    style={{ width: 236 }}
                    className={filters.sendTime ? '' : 'edm-range-picker'}
                    placeholder={[getIn18Text('KAISHI'), getIn18Text('JIESHU')]}
                    locale={cnlocale}
                    format={dateShowFormat}
                    suffixIcon={<RangeDate />}
                    disabledDate={disabledDate}
                    onChange={onChangeUpdateTime}
                    dropdownClassName="edm-date-picker-dropdown-wrap"
                  />
                </div>
                <div className={contactStyle.colNew}>
                  <span className={contactStyle.filterLabelNew}>{getTransText('SHIFOUHUIFU')}</span>
                  <EnhanceSelect
                    style={{ width: 236 }}
                    placeholder={getTransText('QINGXUANZE')}
                    optionFilterProp="children"
                    onChange={val => {
                      onStateChange(val as number, 'reply');
                    }}
                    suffixIcon={<DownTriangle />}
                    dropdownClassName="edm-selector-dropdown"
                    allowClear
                  >
                    {replyStatusList.map(item => (
                      <InSingleOption value={item.id} key={item.id}>
                        {item.name}
                      </InSingleOption>
                    ))}
                  </EnhanceSelect>
                </div>
                <div className={contactStyle.colNew}>
                  <span className={contactStyle.filterLabelNew}>{getTransText('SHIFOUTUIDING')}</span>
                  <EnhanceSelect
                    style={{ width: 236 }}
                    placeholder={getTransText('QINGXUANZE')}
                    optionFilterProp="children"
                    onChange={val => {
                      onStateChange(val as number, 'unsubscribe');
                    }}
                    suffixIcon={<DownTriangle />}
                    dropdownClassName="edm-selector-dropdown"
                    allowClear
                  >
                    {unsubscribeStatusList.map(item => (
                      <InSingleOption value={item.id} key={item.id}>
                        {item.name}
                      </InSingleOption>
                    ))}
                  </EnhanceSelect>
                </div>
              </Row>
            </div>
            <div className={contactStyle.markerDataContainer}>
              <div className={contactStyle.markerDataContainerTitle}>{getIn18Text('SHUJUZONGLAN')}</div>
              {OverviewComp()}
              <div className="main" style={{ flexGrow: 1, overflow: 'hidden', marginTop: '12px' }} ref={mainRef}>
                <Table
                  className={`${contactStyle.table}`}
                  rowKey="contactEmail"
                  onChange={handleTableChange}
                  loading={loading || batchLoading}
                  columns={columns}
                  dataSource={list}
                  scroll={{ y: tableHeight }}
                  sortDirections={['descend', 'ascend']}
                  locale={{
                    sortTitle: getIn18Text('PAIXU'),
                    triggerDesc: getIn18Text('DIANJIJIANGXU'),
                    triggerAsc: getIn18Text('DIANJISHENGXU'),
                    cancelSort: getIn18Text('QUXIAOPAIXU'),
                  }}
                  rowSelection={
                    showRowSelection && activeTab == 1
                      ? {
                          selectedRowKeys,
                          preserveSelectedRowKeys: true,
                          selections: selectMenus.map(ele => {
                            return {
                              key: ele.text,
                              text: ele.text,
                              onSelect: (_: number[]) => {
                                if (ele.checked) {
                                  resetSelect(true);
                                  setSelecteMenus(pre => {
                                    return pre.map(each => {
                                      if (ele.text === each.text) {
                                        return {
                                          ...each,
                                          checked: !each.checked,
                                        };
                                      }
                                      return {
                                        ...each,
                                        checked: false,
                                      };
                                    });
                                  });
                                } else {
                                  setBatchLoading(true);
                                  getEmailList()
                                    .then(emailList => {
                                      setSelectedRowKeys(emailList.map(item => item.contactEmail));
                                      setSelectedRows(emailList as Array<contactInfo>);
                                      const map: { [key: string]: contactInfo } = {};
                                      //@ts-ignore
                                      emailList.forEach(item => {
                                        //@ts-ignore
                                        map[item.contactEmail as string] = item;
                                      });
                                      setAllRowMap(map);
                                    })
                                    .finally(() => {
                                      setBatchLoading(false);
                                    });
                                  setSelecteMenus(pre => {
                                    return pre.map(each => {
                                      if (ele.text === each.text) {
                                        return {
                                          ...each,
                                          checked: !each.checked,
                                        };
                                      }
                                      return {
                                        ...each,
                                        checked: false,
                                      };
                                    });
                                  });
                                }
                              },
                            };
                          }),
                          onChange: (rowKeys, rows) => {
                            setSelectedRowKeys(rowKeys as string[]);
                            if (rows && rows.length && !rows[0]) {
                              if (allRowMap) {
                                setSelectedRows(
                                  rowKeys.map(email => {
                                    return allRowMap[email];
                                  })
                                );
                                return;
                              }
                            }
                            setSelectedRows(rows as Array<contactInfo>);
                          },
                        }
                      : undefined
                  }
                  pagination={false}
                />
                <div style={{ display: 'flex', height: '46px', alignItems: 'center', marginTop: '4px' }}>
                  <div>
                    {
                      <PrivilegeCheck accessLabel="OP" resourceLabel="ADDRESS_BOOK">
                        {activeTab == 1 && (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Button type="primary" disabled={!(selectedRowKeys && selectedRowKeys.length)} onClick={() => handleResend()}>
                              {getTransText('ZAICIFAJIAN')}
                            </Button>
                            {selectedRowKeys && selectedRowKeys.length ? (
                              <span style={{ marginLeft: '4px' }}>
                                {getIn18Text('YIXUAN')}
                                {selectedRowKeys.length}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </PrivilegeCheck>
                    }
                  </div>
                  {!(totalRecords && totalRecords > 0) ? null : (
                    <div style={{ flex: '1' }}>
                      <Pagination
                        style={{ float: 'right' }}
                        total={totalRecords}
                        current={filters.page + 1}
                        pageSize={pageSize}
                        pageSizeOptions={['20', '50', '100']}
                        showSizeChanger={true}
                        showTotal={total => {
                          return <span>共{total}条数据</span>;
                        }}
                        onChange={(page, pageSize) => {
                          setFilters({
                            type: 'update',
                            payload: {
                              page: page - 1,
                            },
                          });
                          setPageSize(pageSize!);
                        }}
                      ></Pagination>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ReadSummaryModal visible={modalData.length > 0} data={modalData} onCancel={() => setModalData([])} />
            <MailReplyListModal isPrivilege={activeTab == 2} onCancel={() => setReplyModal({ visible: false })} data={replyModal.data} visible={replyModal.visible} />
            <ArriveModal onCancel={() => setArriveModal({ visible: false })} data={arriveModal.data} visible={arriveModal.visible} />
            <SendOperateModal onCancel={() => setSendModal({ visible: false })} data={sendModal.data || []} visible={sendModal.visible} />
          </>
        }
      </div>
    </>
  );
};

export default Contact;
