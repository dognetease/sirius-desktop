import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { Filters, getAllFollowsPanelAsync, getFollowsPanelAsync } from '@web-common/state/reducer/worktableReducer';
import { WorktableActions } from '@web-common/state/reducer';
import { FollowsPanelItem, RequestBusinessaAddCompany as customerType } from 'api';
import { WorktableModal } from './modal';
import modalStyle from './modal.module.scss';
import { Table } from 'antd';
import { ColumnsType, TablePaginationConfig } from 'antd/lib/table';
import { navigate } from 'gatsby';
import { CustomerFollowOperate, fromCardFilters, worktableDataTracker } from '../worktableDataTracker';
import { StarRate } from '../followsCard/FollowsCard';
import { getSortOrder, SortableProps } from '../worktableUtils';
import { SorterResult } from 'antd/lib/table/interface';
import UniDrawerWrapper from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { getIn18Text } from 'api';
const tableScroll = {
  y: 220,
  x: 460,
};
export const FollowsPanelModal = (props: { type: 'myCustomerFollows' | 'allCustomerFollows' }) => {
  const { type } = props;
  const appDispatch = useAppDispatch();
  const { showModal, filters, data, loading } = useAppSelector(state =>
    type === 'myCustomerFollows' ? state.worktableReducer.myCustomerFollows : state.worktableReducer.allCustomerFollows
  );
  const [uniVisible, setUniVisible] = useState(false);
  const [customerData, setCustomerData] = useState<Partial<customerType>>({} as Partial<customerType>);
  const [modalFilters, setModalFilters] = useState<Filters>(filters);
  const [sortOrder, setSortOrder] = useState<SortableProps>({
    order_by: 'follow_time',
    is_desc: true,
  });
  useEffect(() => {
    setModalFilters(filters);
  }, [filters]);
  // 关闭时同步筛选条件到卡片
  useEffect(() => {
    if (!showModal) {
      appDispatch(
        WorktableActions.setFilter({
          panelKey: type,
          filters: modalFilters,
        })
      );
    }
  }, [showModal]);
  const fetchData = useCallback(
    (filters: Filters) => {
      appDispatch(type === 'myCustomerFollows' ? getFollowsPanelAsync(filters) : getAllFollowsPanelAsync(filters));
    },
    [type]
  );
  const handleFilterChange = (changes: Record<string, string | string[]>) => {
    const newFilters = {
      ...modalFilters,
      ...changes,
    };
    setModalFilters(newFilters);
    fetchData(newFilters);
    const filterType = fromCardFilters(changes);
    filterType && worktableDataTracker.trackCustomerFollowFilter(type === 'myCustomerFollows' ? 'my' : 'all', filterType);
  };
  const filterVisbile = useMemo(() => {
    return {
      company: true,
      account: type === 'allCustomerFollows',
    };
  }, [type]);
  const handleChange = (
    pagination: TablePaginationConfig,
    _: any,
    sorter: SorterResult<FollowsPanelItem> | SorterResult<FollowsPanelItem>[],
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
        const { field, order } = sorter as SorterResult<FollowsPanelItem>;
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
  const handleClickCompanyName = (item: FollowsPanelItem) => {
    // navigate('/#customer?page=customer&id=' + item.company_id);
    setUniVisible(true);
    setCustomerData({
      company_name: item.company_name,
      company_id: item.company_id,
    });
    worktableDataTracker.trackCustomerFollowOperate(type === 'myCustomerFollows' ? 'my' : 'all', CustomerFollowOperate.customerDataClick);
  };
  const columns: ColumnsType<FollowsPanelItem> = [
    {
      title: getIn18Text('GONGSIMINGCHENG'),
      dataIndex: 'company_name',
      ellipsis: true,
      render(name, item) {
        return <a onClick={() => handleClickCompanyName(item)}>{name}</a>;
      },
    },
    {
      title: getIn18Text('GONGSIXINGJI'),
      dataIndex: 'star_level',
      sorter: true,
      sortDirections: ['descend', 'ascend'],
      sortOrder: getSortOrder(sortOrder, 'star_level'),
      render(value: number) {
        return <StarRate nums={+value} />;
      },
    },
    {
      title: getIn18Text('KEHUFENJI'),
      dataIndex: 'company_level',
      sorter: true,
      sortDirections: ['descend', 'ascend'],
      sortOrder: getSortOrder(sortOrder, 'company_level'),
      width: 84,
    },
    {
      title: getIn18Text('SHIJIAN'),
      dataIndex: 'follow_time',
      ellipsis: true,
      sorter: true,
      sortOrder: getSortOrder(sortOrder, 'follow_time'),
    },
    // {
    //   title: '操作',
    //   render(_, item) {
    //     return <>
    //       <a>跟进</a>
    //       <a onClick={() => handlePickContact(item.company_id)}>邮件</a>
    //     </>
    //   }
    // }
  ];
  if (type === 'allCustomerFollows') {
    columns.splice(4, 0, {
      title: getIn18Text('FUZEREN'),
      dataIndex: 'manager_name',
      ellipsis: true,
    });
  }
  const handleRefresh = () => {
    fetchData(modalFilters);
    worktableDataTracker.trackCustomerFollowOperate(type === 'myCustomerFollows' ? 'my' : 'all', CustomerFollowOperate.refresh);
  };
  const prefixText = type === 'myCustomerFollows' ? getIn18Text('WODE') : getIn18Text('QUANBU');
  return (
    <WorktableModal
      visible={showModal}
      subText={prefixText + getIn18Text('KEHUDONGTAI\uFF1ATONGGUOKEHUBIANJISHIJIANHEGENJINSHIJIANGAIBIAN\uFF0CGONGSIXINGJIHEKEHUFENJISHAIXUANCHUKEHUDONGTAI\u3002')}
      onRefresh={handleRefresh}
      onClose={() => appDispatch(WorktableActions.closeModal(type))}
      filterValues={filters}
      filterVisbile={filterVisbile}
      onFilterChange={handleFilterChange}
    >
      <Table
        className="edm-table"
        columns={columns}
        dataSource={data?.content || []}
        rowKey="company_id"
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
        loading={loading}
        scroll={tableScroll}
        onChange={handleChange}
      />
      <UniDrawerWrapper
        visible={uniVisible}
        source={'worktableCustomer'}
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
