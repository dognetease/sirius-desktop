import { Input, Select, Table, DatePicker, Button, PaginationProps } from 'antd';
import moment from 'moment';
import classnames from 'classnames';
import { navigate } from '@reach/router';
import { useMount } from 'ahooks';
import React, { useEffect, useRef, useState, useReducer } from 'react';
import { api, apis, InsertWhatsAppApi, getIn18Text, MarketingTaskResponse, MarketChannelState, WaMultiSendQuotaRes } from 'api';
import HollowOutGuide from '@web-common/components/UI/HollowOutGuideNew/hollowOutGuide';
// import WhatsAppSendMessage from '@web-unitable-crm/components/WhatsAppSendMessage';
import style from '@web-edm/edm.module.scss';
import { EdmPageProps } from '@web-edm/pageProps';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import { EmptyList } from '@web-edm/components/empty/empty';
import { ColumnsType } from 'antd/lib/table/interface';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { TongyongBofang } from '@sirius/icons';
import { ConfigActions } from '@web-common/state/reducer';
import { useAppDispatch } from '@web-common/state/createStore';
import { PrivilegeCheck, PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { ReactComponent as CreateJobIcon } from '@/images/icons/whatsApp/create-job.svg';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import Notice from '../../WhatsApp/components/notice/notice';
import { getTransText } from '@/components/util/translate';
import localStyle from './index.module.scss';
import { track } from '../tracker/index';

const { Option } = Select;
const { RangePicker } = DatePicker;
interface IFilter {
  page: number;
  pageSize: number;
  searchTaskName?: string;
  startTime?: number;
  endTime?: number;
  taskStatus?: string;
  searchUserId?: string;
}
const dateFormat = 'YYYY-MM-DD';

export const taskStatusMap = {
  RUNNING: '发送中',
  FINISHED: '已发送',
};

const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;

const WaBulkIndex: React.FC<EdmPageProps> = () => {
  const dispatch = useAppDispatch();

  // table 外层容器
  const container = useRef<HTMLDivElement>(null);
  // loading状态
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<MarketingTaskResponse[]>([]);
  // 每次请求条数
  const [pageSize, setPageSize] = useState<number | undefined>(20);
  // 总条数
  const [totalRecords, setTotalRecords] = useState<number>(0);
  // 表格高度
  const [tableHeight, setTableHeight] = useState(456);
  const mainRef = useRef<HTMLDivElement>(null);
  const [quota, setQuota] = useState<WaMultiSendQuotaRes>();
  const [channels, setChannels] = useState<MarketChannelState[]>([]);
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
        default:
          return {
            ...state,
            ...action.payload,
          };
      }
    },
    {
      page: 1,
    }
  );
  const getMarketList = () => {
    if (loading) {
      return;
    }
    const params = {
      pageSize,
      ...filters,
    };
    Object.keys(params).forEach(k => {
      if (params[k] === undefined || params[k] === '') {
        delete params[k];
      }
    });
    setLoading(true);
    whatsAppApi
      .marketTaskList(params)
      .then(res => {
        setList(res?.content || []);
        setTotalRecords(res.totalSize);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    getMarketList();
  }, [filters]);
  // 是否为客户 select options
  const optionList = [
    {
      name: getIn18Text('FASONGZHONG'),
      id: 'RUNNING',
    },
    {
      name: getIn18Text('YIFASONG'),
      id: 'FINISHED',
    },
  ];
  // 任务名称
  const searchJobName = (e: React.FormEvent<HTMLInputElement>) => {
    track.waBlulkTrack('search');
    const value = (e.target as HTMLInputElement).value;
    if (value !== filters.searchTaskName) {
      setFilters({ type: 'update', payload: { searchTaskName: value, page: 1 } });
    }
  };
  // 任务状态
  const jobStateChange = (value: number) => {
    track.waBlulkTrack('state');
    setFilters({
      type: 'update',
      payload: {
        page: 1,
        taskStatus: value,
      },
    });
  };
  // 搜索的wa
  const searchUserId = (id: string) => {
    track.waBlulkTrack('account');
    setFilters({
      type: 'update',
      payload: {
        page: 1,
        searchUserId: id,
      },
    });
  };

  const columns: ColumnsType<MarketingTaskResponse> = [
    {
      title: getTransText('RENWUMINGCHENG'),
      ellipsis: true,
      width: 216,
      fixed: 'left',
      dataIndex: 'taskName',
    },
    {
      title: getTransText('ZHUANGTAI'),
      width: 80,
      ellipsis: true,
      dataIndex: 'taskStatusName',
    },
    {
      title: getTransText('MUBIAORENSHU'),
      width: 80,
      dataIndex: 'targetCount',
    },
    {
      title: getTransText('CHUDARENSHU'),
      width: 80,
      ellipsis: true,
      dataIndex: 'reachCount',
    },
    {
      title: getTransText('CHENGGONGLV'),
      width: 80,
      dataIndex: 'successRate',
    },
    {
      title: getTransText('ZHIXINGSHIJIAN'),
      width: 160,
      dataIndex: 'createAt',
    },
    {
      title: getTransText('FASONGZHANGHAO'),
      width: 130,
      dataIndex: 'senders',
      render: (data: string[]) => <EllipsisTooltip>{data.join(',') || '-'}</EllipsisTooltip>,
    },
    {
      title: getTransText('CAOZUO'),
      width: 90,
      fixed: 'right',
      dataIndex: 'taskId',
      render(id: string) {
        return <a onClick={() => navigate(`#edm?page=marketBulkDetail&taskId=${id}`)}>{getTransText('CHAKAN')}</a>;
      },
    },
  ];
  // 排序改变
  const handleTableChange = (pagination: PaginationProps) => {
    setFilters({
      type: 'update',
      payload: {
        page: pagination.current,
      },
    });
    setPageSize(pagination.pageSize);
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

  useMount(() => {
    track.waBlulkTrack('show');
    whatsAppApi.getMarketSendList().then(res => {
      setChannels(res?.channels || []);
    });
    whatsAppApi.getWaMultiSendQuota().then(res => {
      setQuota(res);
    });
  });

  const onPlayVideo = () => {
    dispatch(ConfigActions.showVideoDrawer({ videoId: 'V27', source: 'whatsapp', scene: 'whatsapp_1' }));
  };

  return (
    <PermissionCheckPage resourceLabel="WHATSAPP_GROUP_SEND" accessLabel="VIEW" menu="WHATSAPP_MARKETING_GROUP_SEND">
      <div ref={container} className={classnames(style.container, localStyle.container)}>
        <div className={localStyle.head}>
          <div className={style.pageHeader}>
            <span className={style.title}>营销群发</span>
            <span className={localStyle.subTitle}>
              共<span className={localStyle.subTitleNum}>{quota?.totalCount || 0}</span>发送总额，还可发
              <span className={localStyle.subTitleNum}>{quota?.remainCount || 0}</span>封
            </span>
            <span className={style.videoEntry} onClick={() => onPlayVideo()}>
              <TongyongBofang wrapClassName={style.videoEntryIconWrap} className={style.videoEntryIcon} />
              <span>如何利用WhatsApp群发获客</span>
            </span>
            <PrivilegeCheck accessLabel="GROUP_SEND" resourceLabel="WHATSAPP_GROUP_SEND">
              <HollowOutGuide guideId="wa-multi-send-marketing" type="3" title="创建群发任务" placement="bottomRight" padding={[8, 10, 8, 10]}>
                <Button
                  className={classnames(localStyle.headerButton, 'sirius-no-drag')}
                  type="primary"
                  icon={<CreateJobIcon className={style.createJobIcon} />}
                  onClick={() => {
                    navigate('#edm?page=createMarketBulk');
                    track.waBlulkTrack('add');
                  }}
                >
                  {getIn18Text('CHUANGJIANRENWU')}
                </Button>
              </HollowOutGuide>
            </PrivilegeCheck>
          </div>
          <Notice type="info" style={{ marginTop: 30, marginBottom: 12 }}>
            {'请先扫码登录个人WhatsApp号码，才可进行群发；每个帐号上限发送50条，频繁发送易造成封号。'}
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
              value={filters.startTime && filters.endTime ? [moment(filters.startTime), moment(filters.endTime)] : undefined}
              onChange={values => {
                if (values && values[0] && values[1]) {
                  setFilters({
                    type: 'update',
                    payload: {
                      startTime: values[0].format(dateFormat),
                      endTime: values[1].format(dateFormat),
                      page: 1,
                    },
                  });
                } else {
                  setFilters({
                    type: 'update',
                    payload: {
                      startTime: undefined,
                      endTime: undefined,
                      page: 1,
                    },
                  });
                }
                track.waBlulkTrack('date');
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
            <Select
              style={{ width: 200, marginLeft: 8, fontSize: 12 }}
              allowClear
              placeholder={'请输入wa号码'}
              optionFilterProp="children"
              onChange={searchUserId}
              suffixIcon={<DownTriangle />}
              dropdownClassName="edm-selector-dropdown"
              className="no-border-select"
            >
              {channels.map(item => (
                <Option value={item.whatsApp as string} key={item.whatsApp}>
                  {`${item.whatsAppNumber}${item.ban ? '(疑似封号)' : ''}`}
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
          {list.length === 0 && <EmptyList />}
        </div>
      </div>
    </PermissionCheckPage>
  );
};
export default WaBulkIndex;
