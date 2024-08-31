import { Input, Select, Table, Button, Checkbox } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import _ from 'lodash';
import React, { useEffect, useRef, useState, useReducer } from 'react';
import { api, apis, InsertWhatsAppApi } from 'api';
import { navigate } from '@reach/router';
import style from '@web-edm/edm.module.scss';
import { EdmPageProps } from '@web-edm/pageProps';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { EmptyList } from '@web-edm/components/empty/empty';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import CustomerTabs from '@/components/Layout/Customer/components/Tabs/tabs';
import { ColumnsType, SorterResult, TablePaginationConfig } from 'antd/lib/table/interface';
import { getModuleAccessSelector, isOwnerDataPrivilegeSelector } from '@web-common/state/reducer/privilegeReducer';
import { useAppSelector } from '@web-common/state/createStore';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import Notice from '../components/notice/notice';
import UniDrawer from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { getIn18Text } from 'api';
import { BusinessPermissionCheck } from '@/components/Layout/SNS/components/BusinessPermissionCheck';

const { Option } = Select;
interface contactInfo {
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactType: string;
  deliveryCount: number;
  readCount: number;
  replyCount: number;
}
interface IContactFilter {
  page: number;
  traceStatus?: number;
  deliveryCountGt?: number;
  replyCountGt?: number;
  minReadCount?: number;
}
const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
type contactTypeKeys = 'CUSTOMER' | 'CLUE' | 'UNKNOWN';
const contactTypeNameMap = {
  CUSTOMER: getIn18Text('KEHU'),
  CLUE: getIn18Text('XIANSUO'),
  UNKNOWN: '-',
};
let fetchDataTimestamp = 0;
const WhatsAppStatistic: React.FC<EdmPageProps> = () => {
  const [uniDetailVisible, setUniDetailVisible] = useState(false);
  const [uniDetailCustomerId, setUniDetailCustomerId] = useState<string | undefined>(undefined);
  const handleCustomerDetailClick = (customerId: string) => {
    setUniDetailVisible(true);
    setUniDetailCustomerId(customerId);
  };
  // table 外层容器
  const container = useRef<HTMLDivElement>(null);
  // loading状态
  const [loading, setLoading] = useState(false);
  // 列表数据
  const [list, setList] = useReducer(
    (
      state: contactInfo[],
      action: {
        type: string;
        payload: contactInfo[];
      }
    ) => {
      switch (action.type) {
        case 'update':
          return action.payload;
        case 'append':
          return [...state, ...action.payload];
      }
      return state;
    },
    []
  );
  // 排序字段
  const [sort, setSort] = useState(''); // 排序字段，格式形如xxx:desc/asc，根据某个字段升序或降序。支持排序字段为：sendCount（发送数）、readCount（阅读数）、replyCount（回复数）、recentlyUpdateTime（最新动态时间）
  // 每次请求条数
  const [pageSize, setPageSize] = useState(20);
  // 总条数
  const [totalRecords, setTotalRecords] = useState<number>(10000);
  // 表格高度
  const [tableHeight, setTableHeight] = useState(456);
  const mainRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [filters, setFilters] = useReducer(
    (
      state: IContactFilter,
      action: {
        type: string;
        payload?: any;
      }
    ) => {
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
  // 获取列表数据
  const getListData = () => {
    if ((loading || list.length >= totalRecords) && filters.page > 0) {
      return;
    }
    const params: {
      [key: string]: number | string;
    } = {
      type: 'WhatsApp',
      pageSize,
      sort,
      ...filters,
    };
    Object.keys(params).forEach(k => {
      if (params[k] === undefined || params[k] === '') {
        delete params[k];
      }
    });
    setLoading(true);
    const _lastFetchTime = (fetchDataTimestamp = +new Date());
    const promise = activeTab == 2 ? insertWhatsAppApi.getWhatsAppAllStatisticList(params) : insertWhatsAppApi.getWhatsAppStatisticList(params);
    promise
      .then(data => {
        if (_lastFetchTime !== fetchDataTimestamp) {
          return;
        }
        setList({ type: 'update', payload: data.detail || [] });
        setTotalRecords(data.pageInfo.totalSize || 0);
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
  useEffect(() => {
    setFilters({
      type: 'update',
      payload: {
        page: 0,
      },
    });
    getListData();
  }, [activeTab]);
  // 是否为客户 select options
  const optionList = [
    {
      name: getIn18Text('SHI'),
      id: true,
    },
    {
      name: getIn18Text('FOU'),
      id: false,
    },
  ];
  // 发送数input改变
  const searchContactName = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== filters.contactName) {
      setFilters({ type: 'update', payload: { contactName: value, page: 0 } });
    }
  };
  // 是否为客户改变
  const mailStateChange = (value: number) => {
    setSort('');
    setFilters({
      type: 'update',
      payload: {
        page: 0,
        isCustomer: value,
        sort: undefined,
      },
    });
  };
  // 触达数input改变
  const searchSendCount = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== filters.deliveryCountGt) {
      setFilters({ type: 'update', payload: { deliveryCountGt: value, page: 0 } });
    }
  };
  // 送达数input改变
  const searchReplyCountGt = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== filters.replyCountGt) {
      setFilters({ type: 'update', payload: { replyCountGt: value, page: 0 } });
    }
  };
  // 阅读数input改变
  const searchReadCountGt = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== filters.readCountGt) {
      setFilters({ type: 'update', payload: { readCountGt: value, page: 0 } });
    }
  };
  const columns: ColumnsType<contactInfo> = [
    {
      title: 'WhatsApp',
      ellipsis: true,
      width: 216,
      fixed: 'left',
      dataIndex: 'contactPhone',
    },
    {
      title: getIn18Text('LIANXIREN'),
      width: 116,
      ellipsis: true,
      dataIndex: 'contactName',
    },
    {
      title: getIn18Text('CHUDACISHU'),
      width: 110,
      dataIndex: 'deliveryCount',
    },
    {
      title: getIn18Text('DUQUCISHU'),
      width: 110,
      ellipsis: true,
      dataIndex: 'readCount',
    },
    {
      title: getIn18Text('HUIFUCISHU'),
      width: 110,
      dataIndex: 'replyCount',
    },
    {
      title: getIn18Text('LEIXING'),
      width: 90,
      dataIndex: 'contactType',
      render(contactType: contactTypeKeys) {
        return contactTypeNameMap[contactType] || '-';
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 90,
      fixed: 'right',
      dataIndex: 'contactId',
      render(id: string, record: contactInfo) {
        return id && record.contactType === 'CUSTOMER' ? (
          <PrivilegeCheck accessLabel="OP" resourceLabel="WHATSAPP">
            <a onClick={() => handleCustomerDetailClick(record.contactId)}>{getIn18Text('CHAKAN')}</a>
          </PrivilegeCheck>
        ) : (
          '-'
        );
      },
    },
  ];
  // 排序改变
  const handleTableChange = (pagination: any, _: any, sorterResult: SorterResult<contactInfo> | SorterResult<contactInfo>[]) => {
    const sorter = Array.isArray(sorterResult) ? sorterResult[0] : sorterResult;
    const { field, order } = sorter;
    const sortMap = {
      ascend: 'asc',
      descend: 'desc',
    };
    setSort(order ? `${field}:${sortMap[order]}` : '');
    if (order) {
      setFilters({
        type: 'update',
        payload: {
          page: 0,
        },
      });
    } else {
      setFilters({
        type: 'update',
        payload: {
          page: pagination.current - 1,
        },
      });
      setPageSize(pagination.pageSize);
    }
  };
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const dimensions = entry.contentRect;
        setTableHeight(dimensions.height - 80);
      }
    });
    if (mainRef.current) {
      setTableHeight(mainRef.current.clientHeight - 80);
      observer.observe(mainRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [mainRef.current]);
  const isOwner = useAppSelector(state => isOwnerDataPrivilegeSelector(state.privilegeReducer, 'EDM'));
  // const tabs =  isOwner ? ['我的数据'] : ['我的数据', '全部数据'];
  const tabs = [getIn18Text('WODESHUJU')];
  const [deliveryCountGt, setDeliveryCountGt] = useState<string>('');
  const [replyCountGt, setReplyCountGt] = useState<string>('');
  const [readCountGt, setReadCountGt] = useState<string>('');
  const handleFilterCountChange = (event: React.FormEvent<HTMLInputElement>, changeHandler: Function) => {
    const { value } = event.target as HTMLInputElement;
    const isValueValid = /^\d*$/.test(value);
    isValueValid && changeHandler(value);
  };
  return (
    <PermissionCheckPage resourceLabel="WHATSAPP" accessLabel="VIEW" menu="WHATSAPP_DATA_STAT">
      <BusinessPermissionCheck>
        <div ref={container} className={style.container} style={{ paddingRight: 24 }}>
          <div className={style.pageHeader}>
            <span className={style.title}>{getIn18Text('WhatsApp SHUJUTONGJI')}</span>
            {list.length > 0 && (
              <span className={style.subTitle}>
                {getIn18Text('GONG')}
                <em className={style.num}>{totalRecords}</em>
                {getIn18Text('GELIANXIREN')}
              </span>
            )}
            <a
              className="edm-page-refresh sirius-no-drag"
              onClick={() => {
                setFilters({ type: 'refresh' });
              }}
            >
              <RefreshSvg />
            </a>
          </div>
          <Notice type="info" style={{ marginTop: 12 }}>
            {getIn18Text('TONGJIXIANSHISUOYOU WhatsApp YINGXIAOCHUDAYONGHUDUQUQINGKUANG\uFF0CFANGBIANQIYECHAZHAOGAOYIXIANGKEHU\uFF0CJINXINGJINGXIHUAYUNYING')}
          </Notice>
          <div style={{ margin: '16px 0 18px' }}>
            <CustomerTabs tabNameList={tabs} defaultActiveKey="1" onChange={setActiveTab} className="" />
          </div>
          <div
            className={style.contactSearch}
            style={{
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            <Input
              placeholder={getIn18Text('QINGSHURULIANXIRENXINGMING')}
              style={{ width: 176, fontSize: 12 }}
              prefix={<SearchIcon />}
              onPressEnter={searchContactName}
              onBlur={searchContactName}
            />

            <Input
              placeholder={getIn18Text('TIANXIECHUDACISHU')}
              suffix={getIn18Text('YISHANG')}
              style={{ width: 176, marginLeft: 8, fontSize: 12 }}
              value={deliveryCountGt}
              onChange={event => handleFilterCountChange(event, setDeliveryCountGt)}
              onPressEnter={searchSendCount}
              onBlur={searchSendCount}
            />

            <Input
              placeholder={getIn18Text('TIANXIEDUQUCISHU')}
              suffix={getIn18Text('YISHANG')}
              style={{ width: 176, marginLeft: 8, fontSize: 12 }}
              value={readCountGt}
              onChange={event => handleFilterCountChange(event, setReadCountGt)}
              onPressEnter={searchReadCountGt}
              onBlur={searchReadCountGt}
            />

            <Input
              placeholder={getIn18Text('TIANXIEHUIFUCISHU')}
              suffix={getIn18Text('YISHANG')}
              style={{ width: 176, marginLeft: 8, fontSize: 12 }}
              value={replyCountGt}
              onChange={event => handleFilterCountChange(event, setReplyCountGt)}
              onBlur={searchReplyCountGt}
              onPressEnter={searchReplyCountGt}
            />

            <Select
              style={{ width: 200, marginLeft: 8, fontSize: 12 }}
              allowClear
              placeholder={getIn18Text('SHIFOUWEIKEHU')}
              optionFilterProp="children"
              onChange={mailStateChange}
              suffixIcon={<DownTriangle />}
              dropdownClassName="edm-selector-dropdown"
              className="no-border-select"
            >
              {optionList.map(item => {
                return (
                  <Option value={item.id} key={item.id}>
                    {item.name}
                  </Option>
                );
              })}
            </Select>
          </div>
          <div className="main" style={{ position: 'absolute', left: 24, right: 24, bottom: 24, top: 195 }} ref={mainRef}>
            <Table
              className={`${style.contactTable}`}
              style={{ display: list.length === 0 ? 'none' : '' }}
              onChange={handleTableChange}
              loading={loading}
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
              pagination={{
                className: 'pagination-wrap',
                size: 'small',
                total: totalRecords,
                current: filters.page + 1,
                pageSize,
                pageSizeOptions: ['20', '50', '100'],
                showSizeChanger: true,
              }}
            />
            {list.length === 0 && (
              <EmptyList>
                <p>{getIn18Text('DANGQIANMEIYOURENHELIANXIREN')}</p>
              </EmptyList>
            )}
          </div>
          <UniDrawer
            visible={uniDetailVisible}
            source="waStats"
            customerId={uniDetailCustomerId as unknown as number}
            onClose={() => {
              setUniDetailVisible(false);
              setUniDetailCustomerId(undefined);
            }}
            onSuccess={() => {}}
          />
        </div>
      </BusinessPermissionCheck>
    </PermissionCheckPage>
  );
};
export default WhatsAppStatistic;
