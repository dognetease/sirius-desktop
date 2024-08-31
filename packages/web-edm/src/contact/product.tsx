// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import React, { useEffect, useRef, useState, useReducer } from 'react';
import { apiHolder, apis, EdmProductDataApi, ResponseProductAnalyticsDataItem, RequestProductAnalyticsData } from 'api';
// import { navigate } from '@reach/router';
import { ColumnsType, TablePaginationConfig } from 'antd/lib/table/interface';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import style from '../edm.module.scss';
import { EmptyList } from '../components/empty/empty';
import { productStayTimeFormat } from '../detail/product';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { showUniDrawer, UniDrawerModuleId } from '@lxunit/app-l2c-crm';
import { LeaveMessageModal } from '../components/leaveMessageModal/leaveMessageModal';
import { getIn18Text } from 'api';

const edmProductApi = apiHolder.api.requireLogicalApi(apis.edmProductDataImpl) as EdmProductDataApi;
let fetchDataTimestamp = 0;

interface IProductData {
  productRef: React.MutableRefObject<any>;
}
export const ProductData: React.FC<IProductData> = ({ productRef }) => {
  // loading状态
  const [loading, setLoading] = useState(false);
  // 列表数据
  const [list, setList] = useReducer((state: ResponseProductAnalyticsDataItem[], action: { type: string; payload: ResponseProductAnalyticsDataItem[] }) => {
    switch (action.type) {
      case 'update':
        return action.payload;
      case 'append':
        return [...state, ...action.payload];
      default:
    }
    return state;
  }, []);
  // 每次请求条数
  const [pageSize, setPageSize] = useState(20);
  // 总条数
  const [totalRecords, setTotalRecords] = useState<number>(10000);
  // 表格高度
  const [tableHeight, setTableHeight] = useState(456);
  const mainRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useReducer(
    (state: RequestProductAnalyticsData, action: { type: string; payload?: Partial<RequestProductAnalyticsData> }) => {
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
            page: 1,
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
      page: 1,
    } as RequestProductAnalyticsData
  );

  // 获取列表数据
  const getListData = () => {
    if ((loading || list.length >= totalRecords) && filters.page > 1) {
      return;
    }
    const params: RequestProductAnalyticsData = {
      pageSize,
      ...filters,
    };

    Object.keys(params).forEach(k => {
      const key = k as keyof RequestProductAnalyticsData;
      if (params[key] === undefined) {
        delete params[key];
      }
    });
    setLoading(true);
    const _lastFetchTime = (fetchDataTimestamp = +new Date());
    const promise = edmProductApi.getEdmProductClickData(params);
    promise
      .then(data => {
        if (_lastFetchTime !== fetchDataTimestamp) {
          return;
        }
        setList({ type: 'update', payload: data.clickData });
        setTotalRecords(data.totalSize || 0);
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
    setFilters({ type: 'update', payload: { page: 1 } });
    getListData();
    productRef.current = {
      refresh: () => {
        setFilters({ type: 'refresh', payload: { page: 1 } });
      },
    };
  }, []);

  // 产品编号input改变
  const searchKey = (e: React.FormEvent<HTMLInputElement>) => {
    const { value } = e.target as HTMLInputElement;
    if (value !== filters.productCondition) {
      setFilters({ type: 'update', payload: { productCondition: value, page: 1 } });
    }
  };

  // 任务次数input改变
  const searchTaskNum = (e: React.FormEvent<HTMLInputElement>) => {
    const { value } = e.target as HTMLInputElement;
    const finalValue = value ? Number(value) : undefined;
    if (finalValue !== filters.taskNum) {
      setFilters({ type: 'update', payload: { taskNum: finalValue, page: 1 } });
    }
  };
  // 打开邮件次数input改变
  const searchReadNum = (e: React.FormEvent<HTMLInputElement>) => {
    const { value } = e.target as HTMLInputElement;
    const finalValue = value ? Number(value) : undefined;
    if (finalValue !== filters.readNum) {
      setFilters({ type: 'update', payload: { readNum: finalValue, page: 1 } });
    }
  };
  // 点击产品次数input改变
  const searchUserNum = (e: React.FormEvent<HTMLInputElement>) => {
    const { value } = e.target as HTMLInputElement;
    const finalValue = value ? Number(value) : undefined;
    if (finalValue !== filters.clickUserNum) {
      setFilters({ type: 'update', payload: { clickUserNum: finalValue, page: 1 } });
    }
  };

  const onClickProductId = (productId: string) => {
    // TODO 跳转到产品详情页
  };

  const showDetail = (id: string) => {
    if (!id) return;
    const list = id.split('#');
    if (isNaN(Number(list[0]))) {
      Toast.error(getIn18Text('GAISHUJUYIBEIXIUGAI'));
      return;
    }
    if (list[2] == 'lead') {
      // 打开线索表抽屉（新留资数据提交在线索表）
      showUniDrawer({
        moduleId: UniDrawerModuleId.LeadsView,
        moduleProps: {
          visible: true,
          leadsId: list[0] as any,
          onClose: () => {},
          source: 'websitePotentialCustomer',
        },
      });
    } else {
      // 打开客户表抽屉（老留资数据提交在客户表）
      showUniDrawer({
        moduleId: UniDrawerModuleId.CustomerView,
        moduleProps: {
          visible: true,
          customerId: list[0] as any,
          onClose: () => {},
        },
      });
    }
  };

  // 跳转到客户列表
  const onClickClueNum = (ids: string[]) => {
    if (ids.length === 0) return;
    if (ids.length === 1) {
      showDetail(ids[0]);
    }
    if (ids.length > 1) {
      setClueIds(ids);
      setLeaveMessageVisible(true);
    }
    // navigate('#customer?page=clue&clueId=' + ids.join(','));
  };

  const columns: ColumnsType<ResponseProductAnalyticsDataItem> = [
    {
      title: getIn18Text('SHANGPINMINGCHENG'),
      width: 216,
      fixed: 'left',
      dataIndex: 'productName',
      render: value => <EllipsisTooltip>{value}</EllipsisTooltip>,
    },
    {
      title: getIn18Text('SHANGPINBIANHAO'),
      width: 175,
      dataIndex: 'productCode',
      // render(value: string, record) {
      //   return value ? <a onClick={() => onClickProductId(record.productId)}>{value}</a> : '-';
      // }
    },
    {
      title: getIn18Text('RENWUCISHU'),
      width: 90,
      dataIndex: 'taskNum',
    },
    {
      title: getIn18Text('DAKAI'),
      width: 90,
      dataIndex: 'emailReadNum',
    },
    {
      title: getIn18Text('DIANJIRENSHU'),
      width: 90,
      dataIndex: 'productClickUserNum',
    },
    {
      title: getIn18Text('clickTimes'),
      width: 90,
      dataIndex: 'productClickNum',
    },
    {
      title: getIn18Text('RENJUNSHICHANG'),
      width: 110,
      dataIndex: 'avgStayTime',
      render: productStayTimeFormat,
    },
    {
      title: getIn18Text('RENJUNFANGWENWEIZHI'),
      width: 110,
      dataIndex: 'avgViewPosition',
      render: value => (!value ? '-' : `${value}%`),
    },
    {
      title: getIn18Text('LIUZIKEHU'),
      width: 90,
      dataIndex: 'clueNum',
      render: (value, record) => {
        if (!value || !record.clueIds?.length) return '-';
        return <a onClick={() => onClickClueNum(record.clueIds)}>{value}</a>;
      },
    },
  ];

  // 排序改变
  const handleTableChange = (pagination: TablePaginationConfig) => {
    setFilters({
      type: 'update',
      payload: {
        page: pagination.current,
      },
    });
    setPageSize(pagination.pageSize || 20);
  };

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

  const [taskNum, setTaskNum] = useState<string>('');
  const [readNum, setReadNum] = useState<string>('');
  const [userNum, setUserNum] = useState<string>('');

  const [clueIds, setClueIds] = useState<string[]>([]);
  const [leaveMessageVisible, setLeaveMessageVisible] = useState(false);

  const handleFilterCountChange = (event: React.FormEvent<HTMLInputElement>, changeHandler: Function) => {
    const { value } = event.target as HTMLInputElement;
    const isValueValid = /^\d*$/.test(value);

    isValueValid && changeHandler(value);
  };

  return (
    <>
      <div
        className={style.contactSearch}
        style={{
          marginBottom: 4,
          height: 82,
          overflow: 'hidden',
          transition: 'height 0.3s',
        }}
      >
        <Input
          placeholder={getIn18Text('QINGSHURUSHANGPIN/BIAN')}
          style={{
            width: 160,
            fontSize: 12,
            marginRight: 8,
            marginBottom: 8,
          }}
          prefix={<SearchIcon />}
          onPressEnter={searchKey}
          onBlur={searchKey}
        />

        <Input
          placeholder={getIn18Text('RENWUCISHU')}
          suffix={getIn18Text('YISHANG')}
          style={{
            width: 160,
            fontSize: 12,
            marginRight: 8,
            marginBottom: 8,
          }}
          value={taskNum}
          onChange={event => handleFilterCountChange(event, setTaskNum)}
          onPressEnter={searchTaskNum}
          onBlur={searchTaskNum}
        />

        <Input
          placeholder={getIn18Text('DAKAIYOUJIAN')}
          suffix={getIn18Text('YISHANG')}
          style={{
            width: 160,
            fontSize: 12,
            marginRight: 8,
            marginBottom: 8,
          }}
          value={readNum}
          onChange={event => handleFilterCountChange(event, setReadNum)}
          onPressEnter={searchReadNum}
          onBlur={searchReadNum}
        />

        <Input
          placeholder={getIn18Text('DIANJIRENSHU')}
          suffix={getIn18Text('YISHANG')}
          style={{
            width: 160,
            fontSize: 12,
            marginRight: 8,
            marginBottom: 8,
          }}
          value={userNum}
          onChange={event => handleFilterCountChange(event, setUserNum)}
          onPressEnter={searchUserNum}
          onBlur={searchUserNum}
        />
      </div>
      <div className="main" style={{ flexGrow: 1, overflow: 'hidden' }} ref={mainRef}>
        <Table
          className={`${style.contactTable}`}
          style={{ display: list.length === 0 ? 'none' : '' }}
          rowKey="contactEmail"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ y: tableHeight }}
          onChange={handleTableChange}
          pagination={{
            style: {
              display: 'flex',
              alignItems: 'center',
              height: 56,
              margin: 0,
            },
            size: 'small',
            total: totalRecords,
            current: filters.page,
            pageSize,
            pageSizeOptions: ['20', '50', '100'],
            showSizeChanger: true,
          }}
        />
        {list.length === 0 && (
          <EmptyList>
            <p>{getIn18Text('ZANWUSHUJU')}</p>
          </EmptyList>
        )}
      </div>
      <LeaveMessageModal visible={leaveMessageVisible} clueIds={clueIds} onClose={() => setLeaveMessageVisible(false)} showDetail={showDetail} />
    </>
  );
};
