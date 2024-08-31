import { api, apis, CustomerApi, CustomerScheduleEditParams, SchedulePanelItem, RequestBusinessaAddCompany as customerType } from 'api';
import { useAppSelector } from '@web-common/state/createStore';
import { Filters, getSchedulePanelAsync } from '@web-common/state/reducer/worktableReducer';
import { Table, Tooltip } from 'antd';
import { ColumnsType, TablePaginationConfig } from 'antd/lib/table';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getFilterText, WorktableCard } from '../card';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import moment from 'moment';
import cardStyle from '../workTable.module.scss';
import EditSchedule, { ScheduleSubmitData } from '../../Customer/components/editSchedule/editSchedule';
import { navigate } from 'gatsby-link';
import UniDrawerWrapper from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { SorterResult } from 'antd/lib/table/interface';
import { getSortOrder, pushNavigateCrossMultiClient, SortableProps, workTableTrackAction } from '../worktableUtils';
import { getTransText } from '@/components/util/translate';
import NoDataIcon from '../icons/NoData';
import { createPortal } from 'react-dom';
import style from './ScheduleCard.module.scss';
import { getIn18Text } from 'api';
export const mapRelateTypeToText: Record<string, string> = {
  1: getIn18Text('XIANSUO'),
  2: getIn18Text('KEHU'),
  3: getIn18Text('SHANGJI'),
};
const keyFn = (item: SchedulePanelItem) => item.schedule_id + item.schedule_time;
const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const sysApi = api.getSystemApi();

const defaultDateRange = {
  start_date: moment().startOf('month').format('YYYY-MM-DD'),
  end_date: moment().endOf('month').format('YYYY-MM-DD'),
};

const ScheduleIcon = () => {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="31" height="31" rx="1.5" fill="white" />
      <path
        d="M10.9583 15.1818H21.0417M11 22H21C21.2761 22 21.5 21.7761 21.5 21.5V12.5C21.5 12.2239 21.2761 12 21 12H11C10.7239 12 10.5 12.2239 10.5 12.5V21.5C10.5 21.7761 10.7239 22 11 22Z"
        stroke="#6F7485"
      />
      <path d="M13.5 10.5V13" stroke="#6F7485" stroke-linecap="round" />
      <path d="M18.5 10.5V13" stroke="#6F7485" stroke-linecap="round" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="1.5" stroke="#E1E3E8" />
    </svg>
  );
};

const DefaultNoData = () => {
  return (
    <div className={style.emptyData}>
      <NoDataIcon />
      <span>{getTransText('ZANWUSHUJU')}</span>
    </div>
  );
};

export const ScheduleCard: React.FC<{}> = () => {
  const { loading, data, filters } = useAppSelector(state => state.worktableReducer.schedule);
  const appDispatch = useDispatch();
  const [uniVisible, setUniVisible] = useState(false);
  const [customerData, setCustomerData] = useState<Partial<customerType>>({} as Partial<customerType>);
  const fetchData = (filters: Filters) => {
    appDispatch(
      getSchedulePanelAsync({
        ...filters,
        start_date: dateRange.current[0],
        end_date: dateRange.current[1],
        page: 1,
        page_size: 999,
      })
    );
  };
  useEffect(() => fetchData(filters), []);
  const [editItem, setEditItem] = useState<SchedulePanelItem | null>(null);
  const dateRange = useRef<[string, string]>([defaultDateRange.start_date, defaultDateRange.end_date]);
  const [sortOrder, setSortOrder] = useState<SortableProps>({
    order_by: 'schedule_time',
    is_desc: true,
  });

  const handleClickRelated = (item: SchedulePanelItem) => {
    if (!item.relate_id) return;
    const pageMap: Record<string, string> = {
      1: 'clue',
      2: 'customer',
      3: 'business',
    };
    if (pageMap[item.relate_type] === 'customer') {
      setUniVisible(true);
      workTableTrackAction('waimao_worktable_schedule', 'customers');
      setCustomerData({
        company_id: item.relate_id,
      });
    } else {
      navigate(`#customer?page=${pageMap[item.relate_type]}&id=${item.relate_id}`);
    }
  };
  const columns: ColumnsType<SchedulePanelItem> = [
    {
      title: getIn18Text('RIQI'),
      dataIndex: 'schedule_time',
      sorter: true,
      sortOrder: getSortOrder(sortOrder, 'schedule_time'),
      width: '25.2%',
    },
    {
      title: getIn18Text('ZHUTI'),
      dataIndex: 'subject',
      width: '29.8%',
      ellipsis: true,
    },
    {
      title: getIn18Text('KEHU'),
      dataIndex: 'relate_name',
      width: '29.8%',
      ellipsis: {
        showTitle: false,
      },
      render(name: string, item: SchedulePanelItem) {
        return item.relate_type == '2' ? (
          <>
            <Tooltip title={name}>
              <a onClick={() => handleClickRelated(item)}>{name}</a>
            </Tooltip>
          </>
        ) : (
          '-'
        );
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      width: '15.2%',
      render(_, item) {
        return item.relate_id ? (
          <>
            <a onClick={() => setEditItem(item)} className={cardStyle.tableAction}>
              {getIn18Text('BIANJI')}
            </a>
            <a onClick={() => handleDeleteSchedule(item.relate_type, item.id)} className={cardStyle.tableAction}>
              {getIn18Text('SHANCHU')}
            </a>
          </>
        ) : null;
      },
    },
  ];
  const handleChange = (
    pagination: TablePaginationConfig,
    _: any,
    sorter: SorterResult<SchedulePanelItem> | SorterResult<SchedulePanelItem>[],
    extra: {
      action: string;
    }
  ) => {
    switch (extra.action) {
      case 'paginate':
        fetchData({
          ...filters,
          page: pagination.current,
          page_size: pagination.pageSize,
        });
        break;
      case 'sort': {
        const { field, order } = sorter as SorterResult<SchedulePanelItem>;
        let currentOrder: SortableProps = {};
        if (order) {
          // order undefined 为取消该字段排序
          currentOrder = {
            order_by: field as string,
            is_desc: order === 'descend',
          };
        }
        setSortOrder(currentOrder);
        const params = {
          ...filters,
          page: 1,
          page_size: pagination.pageSize,
          ...currentOrder,
        };
        fetchData(params);
        break;
      }
    }
  };
  const handleScheduleSubmit = (data: ScheduleSubmitData) => {
    if (!editItem || !editItem.relate_id) {
      return;
    }
    const params: CustomerScheduleEditParams = {
      subject: data.subject,
      start: data.start,
      // company_id: editItem?.relate_id,
      schedule_id: editItem?.id as any,
    };
    const keyMaps: Record<string, string> = {
      10: 'clue_id',
      2: 'company_id',
      9: 'opportunity_id',
    };
    customerApi
      .updateCustomerSchedule({
        ...params,
        [keyMaps[editItem.relate_type]]: editItem.relate_id,
      })
      .then(() => {
        fetchData(filters);
      })
      .finally(() => {
        setEditItem(null);
      });
  };
  const handleDeleteSchedule = (relateType: string, schedule_id: number | string) => {
    const keyMaps: Record<string, 'clue' | 'company' | 'opportunity'> = {
      10: 'clue',
      2: 'company',
      9: 'opportunity',
    };
    Modal.confirm({
      className: cardStyle.scheduleDeleteConfirm,
      title: getIn18Text('QUEDINGSHANCHURICHENG'),
      content: '',
      okText: getIn18Text('SHANCHU'),
      okButtonProps: {
        type: 'default',
        danger: true,
      },
      onOk: () => {
        customerApi
          .deleteCustomerSchedule({
            schedule_id: schedule_id as number,
            condition: keyMaps[relateType],
          })
          .then(() => {
            fetchData(filters);
          });
      },
    });
  };

  const handleScheduleClick = () => {
    workTableTrackAction('waimao_worktable_schedule', 'calendar');
    if (sysApi.isWebWmEntry()) {
      pushNavigateCrossMultiClient('#schedule');
    } else {
      sysApi.createWindow('schedule');
    }
  };
  return (
    <WorktableCard
      title={getTransText('RICHENG')}
      loading={loading}
      headerToolsConfig={[
        {
          onDatePickerChange: (changes: any) => {
            dateRange.current = [changes.start_date, changes.end_date];
            workTableTrackAction('waimao_worktable_schedule', 'time_selection');
            fetchData(filters);
          },
        },
        {
          tools: (
            <div className={cardStyle.scheduleIcon} onClick={handleScheduleClick}>
              <ScheduleIcon />
            </div>
          ),
        },
        {
          onRefresh: () => fetchData(filters),
        },
      ]}
    >
      <div style={{ height: '100%', width: '100%' }}>
        <div className={style.scheduleTable} style={{ marginTop: 12, paddingLeft: 20 }}>
          <Table
            className="edm-table"
            columns={columns}
            dataSource={data?.content || []}
            rowKey={keyFn}
            pagination={false}
            onChange={handleChange}
            scroll={{ y: 138 }}
            locale={{ emptyText: <DefaultNoData /> }}
          />
        </div>
        <EditSchedule
          visible={editItem !== null}
          title={getIn18Text('BIANJIRICHENG')}
          data={editItem}
          onSubmit={handleScheduleSubmit}
          onCancel={() => {
            setEditItem(null);
          }}
          getContainer={document.body}
        />

        {uniVisible &&
          createPortal(
            <UniDrawerWrapper
              visible={uniVisible}
              source="worktableSchedule"
              customStatus={getIn18Text('XIANSUOKEHU')}
              customerId={customerData.company_id as unknown as number}
              onClose={() => {
                setUniVisible(false);
              }}
              onSuccess={() => {
                setUniVisible(false);
                fetchData(filters);
              }}
            />,
            document.getElementById('worktable-page-root')
          )}
      </div>
    </WorktableCard>
  );
};
