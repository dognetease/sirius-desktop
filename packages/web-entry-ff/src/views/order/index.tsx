import React, { useEffect, useState, useContext } from 'react';
import { Tabs } from 'antd';
import { apiHolder, apis, FFMSApi, FFMSOrder } from 'api';
import { useAntdTable } from 'ahooks';
import { OrderTable } from './table';
import style from './style.module.scss';
const ffmsApi = apiHolder.api.requireLogicalApi(apis.ffmsApi) as FFMSApi;
import { GlobalContext } from '@web-entry-ff/layouts/WmMain/globalProvider';

const ORDER_TYPE_LIST = [
  {
    tab: '待跟进',
    key: FFMSOrder.ORDER_TYPE['NOT_FOLLOWED'],
  },
  {
    tab: '跟进中',
    key: FFMSOrder.ORDER_TYPE['FOLLOWING'],
  },
  {
    tab: '已完成',
    key: FFMSOrder.ORDER_TYPE['COMPLETED'],
  },
];
// Terminal client.同行:CO_LOADER
export const Order = () => {
  const [active, setActive] = useState<FFMSOrder.ORDER_TYPE>(FFMSOrder.ORDER_TYPE['NOT_FOLLOWED']);
  const { state, dispatch } = useContext(GlobalContext);

  useEffect(() => {
    dispatch({
      type: 'followStatus',
      payload: {
        hasFollow: false,
      },
    });
  }, []);

  async function getOrderList(pageInfo: { pageSize: number; current: number }) {
    const res = await ffmsApi.ffBookList({
      pageSize: pageInfo.pageSize,
      page: pageInfo.current,
      followStatus: active,
    });
    return {
      list: res?.content || [],
      total: res?.totalSize || 0,
    };
  }
  const { tableProps, refresh } = useAntdTable(getOrderList, { defaultPageSize: 20, refreshDeps: [active] });
  tableProps.pagination.showTotal = (total: number) => `共${total}条`;

  return (
    <div className={style.levleAdmin}>
      <header className={style.levleAdminHeader}>
        <div className={style.levleAdminHeaderLeft}>订舱申请管理</div>
      </header>
      <div className={style.levleAdminContent}>
        <Tabs activeKey={active} onChange={key => setActive(key as FFMSOrder.ORDER_TYPE)}>
          {ORDER_TYPE_LIST.map(item => (
            <Tabs.TabPane tab={item.tab} key={item.key}>
              <OrderTable rowKey="bookingId" discountType={state?.discountType} followStatus={active} refresh={refresh} {...tableProps} />
            </Tabs.TabPane>
          ))}
        </Tabs>
      </div>
    </div>
  );
};
