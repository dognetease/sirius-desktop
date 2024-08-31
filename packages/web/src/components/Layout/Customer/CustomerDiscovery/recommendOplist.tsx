import React, { useReducer, useState } from 'react';
import classnames from 'classnames';
import { Tabs, Table, TablePaginationConfig, DatePicker } from 'antd';
import { Moment } from 'moment';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import { CustomerRow, RegularCustomerListAllReq, RegularCustomerList, apiHolder, apis, CustomerDiscoveryApi, getIn18Text } from 'api';
import { useVersionCheck } from '@web-common/hooks/useVersion';

import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { CustomerDiscoveryContext, initialState, reducer } from './context';
import { DateFormat } from '../components/dateFormat';
import { CustomerTags } from './components/CustomerTags';
import { CustomerDetail } from './containers/CustomerDetail';
import { useTableSearch } from './hooks/useTableSearch';
import { useContainerHeight } from './hooks/useContainerHeight';

import style from './oplist.module.scss';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
const RecommendOplist: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [drawer, setDrawer] = useState<{
    visible: boolean;
    row: CustomerRow;
  }>({ visible: false, row: {} as CustomerRow });
  const { containerRef, containerHeight } = useContainerHeight();
  /** 展示详情 */
  const showCustomDetail = (row: CustomerRow) => {
    setDrawer({ visible: true, row });
  };
  const fetchTableData = async (search: RegularCustomerListAllReq, pagination: TablePaginationConfig): Promise<[number, RegularCustomerList]> => {
    const res = await customerDiscoveryApi.getRegularCustomerListAll({
      ...search,
      page: pagination.current as number,
      pageSize: pagination.pageSize as number,
    });
    return [res.total || 0, res];
  };
  const { pagination, pageChange, loading, data, searchParams, setSearchParams } = useTableSearch<RegularCustomerListAllReq, RegularCustomerList>(fetchTableData, {
    validFlag: 'all',
  });
  const dateChange = async (date: Moment[]) => {
    const [start, end] = date || [];
    const startDate = start?.startOf('day')?.valueOf();
    const endDate = end?.endOf('day')?.valueOf();
    setSearchParams({ ...searchParams, startDate, endDate });
  };
  const columns = [
    {
      title: getIn18Text('YUMING'),
      width: 300,
      render(_: string, row: CustomerRow) {
        const Domin = (
          <span className={style.linkBtn} onClick={() => showCustomDetail(row)}>
            {row.regularCustomerDomain}
          </span>
        );
        return (
          <>
            {Domin}
            <div>
              <CustomerTags data={row} />
            </div>
          </>
        );
      },
    },
    {
      title: getIn18Text('FASONG'),
      dataIndex: 'sendCount',
      key: 'sendCount',
    },
    {
      title: getIn18Text('FASONGREN'),
      dataIndex: 'sendCount',
      key: 'sendCount',
    },
    {
      title: getIn18Text('HUIFU'),
      dataIndex: 'receiveCount',
      key: 'receiveCount',
    },
    {
      title: getIn18Text('LIANXIREN'),
      dataIndex: 'toCount',
      key: 'toCount',
    },
    {
      title: getIn18Text('SHAIXUANSHIJIAN'),
      width: 120,
      dataIndex: 'readyTime',
      render: (v: string) => <DateFormat value={v} />,
    },
  ];
  const menuVersion = useVersionCheck();
  const isV2 = menuVersion === 'v2';
  const els = (
    <CustomerDiscoveryContext.Provider value={{ state, dispatch }}>
      <div className={classnames([style.wrapper, style.flex, style.flexCol])}>
        <div className={style.top}>{isV2 ? undefined : <div className={style.title}>{getIn18Text('SHAIXUANJILUZONGLAN')}</div>}</div>
        <div className={classnames([style.content, style.flex1, style.flex, style.flexCol])}>
          <div className={classnames(style.ruleDetail, style.flex1, style.flex, style.flexCol)}>
            <div className={isV2 ? style.mt1 : undefined}>
              <Tabs
                defaultActiveKey={searchParams.validFlag}
                onChange={validFlag => setSearchParams({ ...searchParams, validFlag })}
                tabBarExtraContent={{
                  right: (
                    <RangePicker
                      separator=" - "
                      placeholder={[getIn18Text('KAISHISHIJIAN'), getIn18Text('JIESHUSHIJIAN')]}
                      locale={cnlocale}
                      format="YYYY/MM/DD"
                      onChange={date => dateChange(date as Moment[])}
                    />
                  ),
                }}
              >
                <TabPane tab={getIn18Text('QUANBU')} key="all" />
                <TabPane tab={getIn18Text('YOUXIAO')} key="valid" />
                <TabPane tab={getIn18Text('WUXIAO')} key="invalid" />
              </Tabs>
            </div>
            <div className={style.table} ref={containerRef}>
              <Table
                columns={columns}
                className={style.recommendTable}
                scroll={{
                  y: `${containerHeight - 110}px`,
                }}
                rowKey="regularCustomerId"
                dataSource={data.data}
                loading={loading}
                pagination={{
                  ...pagination,
                  onChange: pageChange,
                }}
              />
            </div>
          </div>
        </div>

        {/* 详情抽屉 */}
        <CustomerDetail
          id={drawer.row.regularCustomerId}
          visible={drawer.visible}
          onClose={() => {
            setDrawer({ visible: false, row: {} as CustomerRow });
          }}
        />
      </div>
    </CustomerDiscoveryContext.Provider>
  );
  if (isV2) {
    return els;
  }
  return (
    <PermissionCheckPage resourceLabel="PREVIOUS_CONTACT" accessLabel="AUTO_RECOMMEND" menu="PREVIOUS_CONTACT_AUTO_RECOMMEND">
      {els}
    </PermissionCheckPage>
  );
};
export default RecommendOplist;
