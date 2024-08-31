import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { WorktableModal } from './modal';
import { Filters, getSchedulePanelAsync } from '@web-common/state/reducer/worktableReducer';
import { WorktableActions } from '@web-common/state/reducer';
import { Table, Tooltip } from 'antd';
import { ColumnsType, TablePaginationConfig } from 'antd/lib/table';
import { SchedulePanelItem, RequestBusinessaAddCompany as customerType } from 'api';
import UniDrawerWrapper from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { navigate } from '@reach/router';
import modalStyle from './modal.module.scss';
import { SorterResult } from 'antd/lib/table/interface';
import { getSortOrder, SortableProps } from '../worktableUtils';
import { getIn18Text } from 'api';
const keyFn = (item: SchedulePanelItem) => item.schedule_id + item.schedule_time;
const tableScroll = {
  y: 220,
};
export const mapRelateTypeToText: Record<string, string> = {
  1: getIn18Text('XIANSUO'),
  2: getIn18Text('KEHU'),
  3: getIn18Text('SHANGJI'),
};

export const SchedulePanelModal = () => {
  const appDispatch = useAppDispatch();
  const { showModal, filters, data } = useAppSelector(state => state.worktableReducer.schedule);
  const [modalFilters, setModalFilters] = useState<Filters>(filters);
  const [sortOrder, setSortOrder] = useState<SortableProps>({
    order_by: 'schedule_time',
    is_desc: true,
  });
  const [uniVisible, setUniVisible] = useState(false);
  const [customerData, setCustomerData] = useState<Partial<customerType>>({} as Partial<customerType>);
  useEffect(() => {
    setModalFilters(filters);
  }, [filters]);
  // 关闭时同步筛选条件到卡片
  useEffect(() => {
    if (!showModal) {
      appDispatch(
        WorktableActions.setFilter({
          panelKey: 'schedule',
          filters: modalFilters,
        })
      );
    }
  }, [showModal]);
  const handleClickRelated = (item: SchedulePanelItem) => {
    if (!item.relate_id) return;
    const pageMap: Record<string, string> = {
      1: 'clue',
      2: 'customer',
      3: 'business',
    };
    if (pageMap[item.relate_type] === 'customer') {
      setUniVisible(true);
      setCustomerData({
        company_id: item.relate_id,
      });
    } else {
      navigate(`#customer?page=${pageMap[item.relate_type]}&id=${item.relate_id}`);
    }
  };
  const fetchData = (filters: Filters) => {
    appDispatch(getSchedulePanelAsync(filters));
  };
  const handleFilterChange = (changes: Record<string, string | string[]>) => {
    const newFilters = {
      ...modalFilters,
      ...changes,
    };
    setModalFilters(newFilters);
    fetchData(newFilters);
  };
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
  const columns: ColumnsType<SchedulePanelItem> = [
    {
      title: getIn18Text('RICHENG'),
      dataIndex: 'subject',
      ellipsis: true,
    },
    {
      title: getIn18Text('GUANLIANSHUJU'),
      dataIndex: 'relate_id',
      ellipsis: true,
      render(id: string, item: SchedulePanelItem) {
        return item.relate_type == '2' ? (
          <>
            <span>{mapRelateTypeToText[item.relate_type]}：</span>
            <Tooltip title={item.relate_name}>
              <a onClick={() => handleClickRelated(item)}>{item.relate_name}</a>
            </Tooltip>
          </>
        ) : (
          '-'
        );
      },
    },
    {
      title: getIn18Text('RICHENGSHIJIAN'),
      dataIndex: 'schedule_time',
      sorter: true,
      sortOrder: getSortOrder(sortOrder, 'schedule_time'),
    },
    // {
    //   title: '操作',
    //   render(_, item) {
    //     return item.relate_id ? <>
    //       <a onClick={() => setEditItem(item)} className={cardStyle.tableAction}>编辑</a>
    //       <a onClick={() => handleDeleteSchedule(item.relate_type, item.schedule_id)} className={cardStyle.tableAction}>删除</a>
    //     </> : null
    //   }
    // }
  ];
  return (
    <WorktableModal
      visible={showModal}
      subText={getIn18Text('ZUIJINRICHENG\uFF1ACHAKANSHIJIANFANWEINEIWEIGUOQIDERICHENG\uFF0CYIJIGUANLIANDEXIANSUO\u3001KEHU\u3001SHANGJISHUJU\u3002')}
      onRefresh={() => fetchData(modalFilters)}
      onClose={() => appDispatch(WorktableActions.closeModal('schedule'))}
      filterValues={filters}
      onFilterChange={handleFilterChange}
    >
      <Table
        className="edm-table"
        columns={columns}
        dataSource={data?.content || []}
        rowKey={keyFn}
        pagination={{
          pageSize: data?.page_size || 20,
          total: data?.total_size,
          current: data?.page,
          hideOnSinglePage: true,
          size: 'small',
          className: 'pagination-wrap',
          locale: {
            items_per_page: getIn18Text('TIAO/YE'),
          },
        }}
        onChange={handleChange}
        scroll={tableScroll}
      />
      <UniDrawerWrapper
        visible={uniVisible}
        source={'worktableSchedule'}
        customStatus={getIn18Text('XIANSUOKEHU')}
        customerId={customerData.company_id as unknown as number}
        onClose={() => {
          setUniVisible(false);
        }}
        onSuccess={() => {
          setUniVisible(false);
          fetchData(filters);
        }}
      />
    </WorktableModal>
  );
};
