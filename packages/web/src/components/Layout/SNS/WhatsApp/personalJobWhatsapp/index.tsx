import { Input, Select, Table, DatePicker, Button } from 'antd';
import _ from 'lodash';
import moment from 'moment';
import classnames from 'classnames';
import { navigate } from '@reach/router';
import React, { useEffect, useRef, useState, useReducer } from 'react';
import { apiHolder, apis, WhatsAppApi, PersonalJobTask } from 'api';
import style from '@web-edm/edm.module.scss';
import { EdmPageProps } from '@web-edm/pageProps';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { ReactComponent as CreateJobIcon } from '@/images/icons/whatsApp/create-job.svg';
import { EmptyList } from '@web-edm/components/empty/empty';
import { ColumnsType, SorterResult } from 'antd/lib/table/interface';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import { getRatio } from './detail';
import Notice from '../components/notice/notice';
import { getTransText } from '@/components/util/translate';
import localStyle from './index.module.scss';
import { getIn18Text } from 'api';

const { Option } = Select;
const { RangePicker } = DatePicker;
interface IFilter {
  page: number;
  pageSize: number;
  jobName?: string;
  beginTime?: number;
  endTime?: number;
  jobState?: number;
}

const systemApi = apiHolder.api.getSystemApi();
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

let fetchDataTimestamp = 0;
const PersonalJobWhatsApp: React.FC<EdmPageProps> = () => {
  // table 外层容器
  const container = useRef<HTMLDivElement>(null);
  // loading状态
  const [loading, setLoading] = useState(false);
  // 列表数据
  const [list, setList] = useReducer(
    (
      state: PersonalJobTask[],
      action: {
        type: string;
        payload: PersonalJobTask[];
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
  const [filters, setFilters] = useReducer(
    (
      state: IFilter,
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
            page: 1,
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
      page: 1,
    }
  );
  // 获取列表数据
  const getListData = () => {
    if (loading) {
      return;
    }
    const params: {
      [key: string]: number | string;
    } = {
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
    whatsAppApi
      .getPersonalJobWhatsAppList(params)
      .then(data => {
        if (_lastFetchTime !== fetchDataTimestamp) {
          return;
        }
        setList({ type: 'update', payload: data.jobInfoList || [] });
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
  // 是否为客户 select options
  const optionList = [
    {
      name: getIn18Text('FASONGZHONG'),
      id: 0,
    },
    {
      name: getIn18Text('YIFASONG'),
      id: 1,
    },
  ];
  // 任务名称
  const searchJobName = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    if (value !== filters.jobName) {
      setFilters({ type: 'update', payload: { jobName: value, page: 1 } });
    }
  };
  // 任务状态
  const jobStateChange = (value: number) => {
    setSort('');
    setFilters({
      type: 'update',
      payload: {
        page: 1,
        jobState: value,
        sort: undefined,
      },
    });
  };

  const columns: ColumnsType<PersonalJobTask> = [
    {
      title: getTransText('RENWUMINGCHENG'),
      ellipsis: true,
      width: 216,
      fixed: 'left',
      dataIndex: 'jobName',
    },
    {
      title: getTransText('ZHUANGTAI'),
      width: 80,
      ellipsis: true,
      dataIndex: 'jobStatus',
    },
    {
      title: getTransText('MUBIAORENSHU'),
      width: 80,
      dataIndex: 'receiverCount',
    },
    {
      title: getTransText('CHUDARENSHU'),
      width: 80,
      ellipsis: true,
      dataIndex: 'deliveryCount',
    },
    {
      title: getTransText('CHENGGONGLV'),
      width: 80,
      dataIndex: 'successRadio',
      render(val: number) {
        return getRatio(val);
      },
    },
    {
      title: getTransText('ZHIXINGSHIJIAN'),
      width: 160,
      dataIndex: 'executeTime',
    },
    {
      title: getTransText('FASONGZHANGHAO'),
      width: 130,
      dataIndex: 'sender',
    },
    {
      title: getTransText('CAOZUO'),
      width: 90,
      fixed: 'right',
      dataIndex: 'jobId',
      render(id: string) {
        return <a onClick={() => navigate(`#edm?page=personalJobWhatsAppDetail&jobId=${id}`)}>{getTransText('CHAKAN')}</a>;
      },
    },
  ];
  // 排序改变
  const handleTableChange = (pagination: any, _: any, sorterResult: SorterResult<PersonalJobTask> | SorterResult<PersonalJobTask>[]) => {
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
          page: 1,
        },
      });
    } else {
      setFilters({
        type: 'update',
        payload: {
          page: pagination.current,
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

  return (
    <div ref={container} className={classnames(style.container, localStyle.container)}>
      <div className={localStyle.head}>
        <div className={style.pageHeader}>
          <span className={style.title}>{getTransText('WAGERENQUNFA')}</span>
          <Button
            className={classnames(localStyle.headerButton, 'sirius-no-drag')}
            type="primary"
            icon={<CreateJobIcon className={style.createJobIcon} />}
            onClick={() => {
              whatsAppTracker.trackPersonalSend();
              if (systemApi.isElectron()) {
                systemApi.createWindowWithInitData('personalWhatsapp', { eventName: 'initPage', eventData: { tab: 'job' } });
              } else {
                window.open('/personalWhatsapp/?tab=job', 'personalWhatsapp');
              }
              // navigate('#sns?page=pernsonalWhatsapp&tab=job');
            }}
          >
            {getIn18Text('CHUANGJIANRENWU')}
          </Button>
        </div>
        <Notice type="info" style={{ marginTop: 30, marginBottom: 12 }}>
          {getTransText('QINGXIANSAOMADENGLUGERENWACAIEKJINXINGQUNFA')}
        </Notice>
        <div
          className={style.contactSearch}
          style={{
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          <Input
            placeholder={getTransText('QINGSHURUYAOSOUSUODERENWUMINGCHENG')}
            style={{ width: 220, fontSize: 12 }}
            prefix={<SearchIcon />}
            onPressEnter={searchJobName}
            onBlur={searchJobName}
          />
          <RangePicker
            className="edm-range-picker"
            dropdownClassName="edm-date-picker-dropdown-wrap"
            placeholder={[getTransText('KAISHIRIQI'), getTransText('JIESHURIQI')]}
            style={{
              height: 32,
              border: 'none',
              marginLeft: 8,
            }}
            value={filters.beginTime && filters.endTime ? [moment(filters.beginTime), moment(filters.endTime)] : undefined}
            onChange={values => {
              if (values && values[0] && values[1]) {
                setFilters({
                  type: 'update',
                  payload: {
                    beginTime: values[0].startOf('day').valueOf(),
                    endTime: values[1].endOf('day').valueOf(),
                    page: 1,
                  },
                });
              } else {
                setFilters({
                  type: 'update',
                  payload: {
                    beginTime: undefined,
                    endTime: undefined,
                    page: 1,
                  },
                });
              }
            }}
          />
          <Select
            style={{ width: 200, marginLeft: 8, fontSize: 12 }}
            allowClear
            placeholder={getTransText('XUANZEZHUANGTAI')}
            optionFilterProp="children"
            onChange={jobStateChange}
            suffixIcon={<DownTriangle />}
            dropdownClassName="edm-selector-dropdown"
            className="no-border-select"
          >
            {optionList.map(item => (
              <Option value={item.id} key={item.id}>
                {item.name}
              </Option>
            ))}
          </Select>
        </div>
      </div>
      <div className={localStyle.body} ref={mainRef}>
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
            current: filters.page,
            pageSize,
            pageSizeOptions: ['20', '50', '100'],
            showSizeChanger: true,
          }}
        />
        {list.length === 0 && <EmptyList></EmptyList>}
      </div>
    </div>
  );
};
export default PersonalJobWhatsApp;
