import { api, apis, ContactDetail, CustomerApi, FollowsPanelItem, isElectron, MailApi, platform, RequestBusinessaAddCompany as customerType } from 'api';
import { useAppSelector } from '@web-common/state/createStore';
import { Filters, getAllFollowsPanelAsync, getFollowsPanelAsync } from '@web-common/state/reducer/worktableReducer';
import { Table, Drawer, TablePaginationConfig } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getFilterText, WorktableCard } from '../card';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import cardStyle from '../index.module.scss';
import { ReactComponent as StarIcon } from '@/images/icons/edm/star.svg';
import { WorktableActions } from '@web-common/state/reducer';
import ContactPicker from '../../Customer/components/contactPicker/contactPicker';
import { navigate } from 'gatsby-link';
import { Follows } from '../../Customer/components/moments/follows';
import { ColumnsType, SorterResult } from 'antd/lib/table/interface';
import { CustomerFollowOperate, worktableDataTracker } from '../worktableDataTracker';
import classnames from 'classnames';
import { getSortOrder, SortableProps } from '../worktableUtils';
import UniDrawerWrapper from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawer';
import { createPortal } from 'react-dom';
import { getIn18Text } from 'api';

export interface FollowsCardProps {
  type?: 'my' | 'all';
}
const isWindowsAndEletron = isElectron() && !platform.isMac();
const mailApi = api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const customerApi = api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;
const handleWriteMail = (contacts: string[]) => {
  mailApi.doWriteMailToContact(contacts);
};
export const FollowsCard: React.FC<FollowsCardProps> = props => {
  const { type = 'my' } = props;
  const { loading, data, filters } = useAppSelector(state => (type === 'my' ? state.worktableReducer.myCustomerFollows : state.worktableReducer.allCustomerFollows));
  const appDispatch = useDispatch();
  const [uniVisible, setUniVisible] = useState(false);
  const [customerData, setCustomerData] = useState<Partial<customerType>>({} as Partial<customerType>);
  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const [contactPickerVisible, setContactPickerVisible] = useState(false);
  const [editItem, setEditItem] = useState<FollowsPanelItem | null>(null);
  const [refreshAfterDrawerClose, setRefreshAfterDrawerClose] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortableProps>({
    order_by: 'follow_time',
    is_desc: true,
  });
  const fetchData = useCallback(
    (filters: Filters) => {
      appDispatch(type === 'my' ? getFollowsPanelAsync(filters) : getAllFollowsPanelAsync(filters));
    },
    [filters, type]
  );
  useEffect(() => fetchData(filters), []);
  const fetchCustomerDetail = (id: string) => {
    const currentUser = api.getSystemApi().getCurrentUser();
    const config = { params: { sid: currentUser?.sessionId } };
    return customerApi.getCustomerDetail({ company_id: id }, config).then(data => {
      if (data) {
        return data.contact_list;
      } else {
        Toast.error({ content: getIn18Text('WEICHAXUNDAOKEHUXIANGQING') });
        return null;
      }
    });
  };
  const handlePickContact = (company_id: string) => {
    fetchCustomerDetail(company_id).then(contacts => {
      if (contacts !== null) {
        if (!contacts.length) return Toast.info({ content: getIn18Text('ZANWULIANXIREN') });
        if (contacts.length === 1) return handleWriteMail([contacts[0].email]);
        setContacts(contacts);
        setContactPickerVisible(true);
      }
    });
    worktableDataTracker.trackCustomerFollowOperate(type, CustomerFollowOperate.mail);
  };
  const handleFollowUp = (item: FollowsPanelItem) => {
    setEditItem(item);
    worktableDataTracker.trackCustomerFollowOperate(type, CustomerFollowOperate.followup);
  };
  const handleClickCompanyName = (item: FollowsPanelItem) => {
    // navigate('/#customer?page=customer&id=' + item.company_id);
    setUniVisible(true);
    setCustomerData({
      company_name: item.company_name,
      company_id: item.company_id,
    });
    worktableDataTracker.trackCustomerFollowOperate(type, CustomerFollowOperate.customerDataClick);
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
      sorter: true,
      sortDirections: ['descend', 'ascend'],
      sortOrder: getSortOrder(sortOrder, 'company_level'),
      dataIndex: 'company_level',
    },
    {
      title: getIn18Text('SHIJIAN'),
      sorter: true,
      sortOrder: getSortOrder(sortOrder, 'follow_time'),
      dataIndex: 'follow_time',
      ellipsis: true,
      width: '29.4%',
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 92,
      render(_, item) {
        return (
          <>
            <a className={cardStyle.tableAction} onClick={() => handleFollowUp(item)}>
              {getIn18Text('GENJIN')}
            </a>
            <a className={cardStyle.tableAction} onClick={() => handlePickContact(item.company_id)}>
              {getIn18Text('YOUJIAN')}
            </a>
          </>
        );
      },
    },
  ];
  if (type === 'all') {
    columns.splice(4, 0, {
      title: getIn18Text('FUZEREN'),
      dataIndex: 'manager_name',
      ellipsis: true,
    });
  }
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
  const handleRefresh = () => {
    fetchData(filters);
    worktableDataTracker.trackCustomerFollowOperate(type, CustomerFollowOperate.refresh);
  };
  const handleDrawerClose = () => {
    setEditItem(null);
    if (refreshAfterDrawerClose) {
      setRefreshAfterDrawerClose(false);
      // 刷新列表？
      // fetchData(filters);
    }
  };
  const filterNode = useMemo(() => {
    return getFilterText(filters, 'CONTACT', type === 'all');
  }, [filters]);
  return (
    <WorktableCard
      title={type === 'my' ? getIn18Text('WODEKEHUDONGTAI') : getIn18Text('QUANBUKEHUDONGTAI')}
      loading={loading}
      headerToolsConfig={[
        {
          onRefresh: handleRefresh,
        },
      ]}
    >
      <div className={cardStyle.cardContainer}>
        <div className={cardStyle.cardFilter}>{filterNode}</div>
        <div>
          <Table
            className="edm-table"
            columns={columns}
            dataSource={data?.content || []}
            rowKey="company_id"
            scroll={{
              x: type === 'my' ? 544 : 608,
            }}
            pagination={{
              pageSize: data?.page_size || 20,
              total: data?.total_size,
              current: data?.page,
              hideOnSinglePage: true,
              size: 'small',
              className: 'pagination-wrap',
            }}
            onChange={handleChange}
          />
        </div>
        <ContactPicker
          getContainer={() => document.body}
          visible={contactPickerVisible}
          data={contacts}
          onCancel={() => setContactPickerVisible(false)}
          onSubmit={(pickedIds, pickedEmails) => {
            setContactPickerVisible(false);
            handleWriteMail(pickedEmails);
          }}
        />
        <Drawer
          title={getIn18Text('GENJINDONGTAI')}
          placement="right"
          getContainer={() => document.getElementById('worktable-page-root')!}
          visible={editItem !== null}
          onClose={handleDrawerClose}
          className={classnames(cardStyle.followsDrawerContainer, isWindowsAndEletron ? cardStyle.winDrawer : '')}
        >
          {editItem && (
            <Follows
              id={editItem?.company_id as string}
              type="customer"
              visible={editItem !== null}
              options={{ autoOpen: true }}
              onSave={() => setRefreshAfterDrawerClose(true)}
            />
          )}
        </Drawer>

        {uniVisible &&
          createPortal(
            <UniDrawerWrapper
              visible={uniVisible}
              source="worktableCustomer"
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
export const StarRate = ({ nums }: { nums: number }) => {
  if (nums) {
    return (
      <>
        {new Array(nums).fill(1).map((key, index) => {
          return <StarIcon key={index} />;
        })}
      </>
    );
  }
  return null;
};
