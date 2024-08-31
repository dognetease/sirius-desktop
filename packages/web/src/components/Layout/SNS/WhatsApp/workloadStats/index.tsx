import classnames from 'classnames';
import { DataTrackerApi, WaMessageType, getIn18Text } from 'api';
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useState } from 'react';
import moment, { Moment } from 'moment';
import { api, InsertWhatsAppApi, WAContentItem, apis, StatisticsListReq, WaWorkloadResKey } from 'api';
import { ColumnsType } from 'antd/lib/table';
// import SiriusTable from '@lingxi-common-component/sirius-ui/Table';
import SiriusTable from '@web-common/components/UI/Table';
import Tooltip from '@lingxi-common-component/sirius-ui/Tooltip';
import DatePicker from '@lingxi-common-component/sirius-ui/DatePicker';
import { TongyongCuowutishiXian } from '@sirius/icons';
import { RefreshSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import EllipsisTooltip from '@/components/Layout/Customer/components/ellipsisTooltip/ellipsisTooltip';
import style from './index.module.scss';
import { useResponsiveTable } from '@/hooks/useResponsiveTable';
import { ReactComponent as NewChatIcon } from '@/images/icons/SNS/workload/new-chat.svg';
import { ReactComponent as ClueIcon } from '@/images/icons/SNS/workload/clue.svg';
import { ReactComponent as CustomerIcon } from '@/images/icons/SNS/workload/customer.svg';
import { ReactComponent as MessageIcon } from '@/images/icons/SNS/workload/message.svg';
import { ReactComponent as SendMessageIcon } from '@/images/icons/SNS/workload/send-message.svg';

import OrgTreeSelect from './OrgTreeSelect';

const { RangePicker } = DatePicker;
const whatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const trackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const dateFormat = 'YYYY-MM-DD';
interface StatItem {
  key: string[];
  icon: React.ReactNode;
  title: string;
  value: number[];
  tooltip?: string;
}
export const WorkloadStats = () => {
  const [loading, setLoading] = useState(false);
  // const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<WAContentItem[]>([]);
  const [request, setRequest] = useState<StatisticsListReq>({
    startTime: moment().format(dateFormat),
    endTime: moment().format(dateFormat),
    accountFilters: [],
    pageSize: 20,
    page: 1,
  });

  const { layout, growRef, scrollY } = useResponsiveTable();
  const [statData, setStatData] = useState<StatItem[]>([
    {
      key: ['newChatCount', 'retainedChatCount'],
      icon: <NewChatIcon />,
      title: '新增会话/会话留存数',
      value: [0, 0],
      tooltip: '统计员工的WA在筛选时间段内新增会话和留存会话。tips：留存会话不包含已删除数据',
    },
    {
      key: ['receiveMessageCount'],
      icon: <MessageIcon />,
      title: '收消息条数',
      value: [0],
      tooltip: '筛选时间段内的收到的消息数（不包含删除）',
    },
    {
      key: ['sendMessageCount'],
      icon: <SendMessageIcon />,
      title: '发消息条数',
      value: [0],
      tooltip: '筛选时间段内发出的消息数（不包含删除）',
    },
    {
      key: ['newClueCount', 'retainedClueCount'],
      icon: <ClueIcon />,
      title: '新建线索/线索留存数',
      value: [0, 0],
      tooltip: '统计员工在筛选时间段内WA上创建的新增线索和留存线索。tips：留存线索不包含已删除数据，管理员使用员工号码新建线索计入管理员新建数量',
    },
    {
      key: ['newCustomerCount', 'retainedCustomerCount'],
      icon: <CustomerIcon />,
      title: '新建客户/客户留存数',
      value: [0, 0],
      tooltip: '统计员工在筛选时间段内WA上创建的新增客户和留存客户数。tips：留存线索不包含已删除和合并数据，管理员使用员工号码新建客户计入管理员新建数量',
    },
  ]);

  const [sortField, setSortField] = useState<string>();
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>();

  const columns: ColumnsType<WAContentItem> = [
    {
      key: 'number',
      title: '员工WA号码',
      dataIndex: 'number',
      ellipsis: true,
      width: 200,
      render: (text, row) => `${row.accName} (${text})`,
    },
    {
      key: 'newChatCount',
      title: '新增会话',
      dataIndex: 'newChatCount',
      sorter: true,
      width: 150,
      render: text => text,
    },
    {
      key: 'retainedChatCount',
      title: '会话留存数',
      dataIndex: 'retainedChatCount',
      sorter: true,
      width: 150,
      render: text => text,
    },
    {
      key: 'receiveMessageCount',
      title: '收消息数',
      dataIndex: 'receiveMessageCount',
      sorter: true,
      width: 150,
      render: text => text,
    },
    {
      key: 'sendMessageCount',
      title: '发消息数',
      dataIndex: 'sendMessageCount',
      width: 150,
      sorter: true,
      render: text => text,
    },
    {
      key: 'newClueCount',
      title: '新建线索',
      sorter: true,
      dataIndex: 'newClueCount',
      width: 150,
      render: text => text,
    },
    {
      key: 'retainedClueCount',
      title: '线索留存数',
      sorter: true,
      dataIndex: 'retainedClueCount',
      width: 150,
      render: text => text,
    },
    {
      key: 'newCustomerCount',
      title: '新建客户',
      sorter: true,
      dataIndex: 'newCustomerCount',
      width: 150,
      render: text => text,
    },
    {
      key: 'retainedCustomerCount',
      title: '客户留存数',
      sorter: true,
      dataIndex: 'retainedCustomerCount',
      width: 150,
      render: text => text,
    },
  ];

  const handleDateChange = (d: [Moment | null, Moment | null] | null) => {
    if (d == null || d[0] === null || d[1] === null) {
      setRequest(last => ({
        ...last,
        startTime: '',
        endTime: '',
      }));
    } else {
      setRequest(last => ({
        ...last,
        startTime: d[0]!.format('YYYY-MM-DD'),
        endTime: d[1]!.format('YYYY-MM-DD'),
      }));
    }
    trackApi.track('personal_WA_chat_statistics', { opera_type: 'date', opera_way: 'workload_statistics' });
  };

  // `${p.accountId}_${p.whatsApp}_${uuid(10)}`,
  const onTreeChange = (value: string[]) => {
    const filter = value?.map(item => {
      const account = item.split('_');
      return {
        accId: account[0],
        userId: account[1],
      };
    });
    setRequest(last => ({
      ...last,
      accountFilters: filter,
    }));
    trackApi.track('personal_WA_chat_statistics', { opera_type: 'accounts', opera_way: 'workload_statistics' });
  };

  const getWorkload = (params: StatisticsListReq) => {
    whatsAppApi
      .getWaWorkload(params)
      .then(res => {
        if (res?.statistics) {
          setStatData(statData =>
            statData.map(item => ({
              ...item,
              value: item.key.map(key => res.statistics[key as WaWorkloadResKey]),
            }))
          );
          setList(res?.list?.content?.map(item => ({ ...item, id: `${item.accId}-${item.userId}` })) || []);
          setTotal(res?.list?.totalSize);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const getStatsData = (params?: Partial<StatisticsListReq>) => {
    getWorkload({
      direction: sortOrder,
      orderBy: sortField,
      ...request,
      ...params,
    });
  };
  const handleRefresh = () => {
    setRequest(last => ({ ...last, page: 1 }));
    getStatsData({ page: 1 });
  };

  useEffect(() => {
    getStatsData();
  }, [request, sortField, sortOrder]);

  return (
    <PermissionCheckPage resourceLabel="WHATSAPP_PERSONAL_MANAGE" accessLabel="WA_WORK_STAT" menu="WA_CHAT_WORKLOAD_STATS">
      <div className={classnames(style.page, layout.container)}>
        <header className={classnames(style.header, layout.static)}>
          <span className={style.curr}>工作量统计</span>
          <a onClick={handleRefresh} style={{ marginLeft: 8 }}>
            <RefreshSvg />
          </a>
        </header>
        <div className={classnames(style.tableHeader, layout.static)}>
          <RangePicker
            allowClear={false}
            defaultValue={[moment().subtract(0, 'days'), moment()]}
            onChange={handleDateChange}
            ranges={{
              近一周: [moment().subtract(7, 'days'), moment()],
              近一个月: [moment().subtract(1, 'month'), moment()],
              近三个月: [moment().subtract(3, 'month'), moment()],
              近半年: [moment().subtract(6, 'month'), moment()],
            }}
          />
          <OrgTreeSelect className={style.treeWidth} onChange={onTreeChange} />
        </div>
        <div className={classnames(style.statWrap, layout.static)}>
          <h3 className={style.subTitle}>数据总览</h3>
          <div className={style.cardWrap}>
            {statData.map(item => (
              <div className={classnames(style.stat)} key={item.key[0]}>
                <div className={style.icon}>{item.icon}</div>
                <div className={style.content}>
                  <div className={style.header}>
                    <span className={style.title}>
                      <EllipsisTooltip>{item.title}</EllipsisTooltip>
                    </span>
                    {item.tooltip && (
                      <Tooltip title={item.tooltip}>
                        <TongyongCuowutishiXian wrapClassName="wmzz" style={{ fontSize: 16 }} />
                      </Tooltip>
                    )}
                  </div>
                  <div className={style.body}>{item.value.map((value, index) => `${index ? '/' : ''}${value.toLocaleString('en-US', { style: 'decimal' })}`)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={classnames(style.tableWrap, layout.grow)} ref={growRef}>
          <SiriusTable
            bordered
            sortDirections={['ascend', 'descend']}
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            scroll={{ x: 'max-content', y: scrollY }}
            onChange={(pagination, _, sorter: any) => {
              const page = pagination.current as number;
              const pageSize = pagination.pageSize as number;
              const sortField = sorter.field;
              const sortOrder = sorter.order;
              if (sortField && sortOrder) {
                setSortField(sortField);
                setSortOrder(sortOrder === 'ascend' ? 'ASC' : 'DESC');
              } else {
                setSortField(undefined);
                setSortOrder(undefined);
              }
              setRequest(last => ({ ...last, pageSize, page: last.pageSize === pageSize ? page : 1 }));
            }}
            pagination={{
              total,
              current: request.page,
              pageSize: request.pageSize,
              showTotal: (total: number) => `共 ${total} 条数据`,
              showQuickJumper: true,
              showSizeChanger: true,
              pageSizeOptions: ['20', '50', '100'],
            }}
          />
        </div>
      </div>
    </PermissionCheckPage>
  );
};
