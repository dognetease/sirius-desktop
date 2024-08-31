import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { CompanyCollectItem, getIn18Text } from 'api';
import { ReadCountActions, useActions, useAppSelector } from '@web-common/state/createStore';
import StarTable from './table/starTable';
import HeaderLayout from '@/components/Layout/Customer/components/headerLayout/headerLayout';
import { useIsForwarder } from '../customs/ForwarderSearch/useHooks/useIsForwarder';
import StarForwarder from './starForwarder';
import style from './star.module.scss';
import { globalSearchApi } from '../../globalSearch/constants';

const Star: React.FC<any> = () => {
  const [tableList, setTableList] = useState<CompanyCollectItem[]>([]);
  const currentCount = useAppSelector(state => state.readCountReducer.unreadCount.customsData) || 0;
  const readAction = useActions(ReadCountActions);

  const [pagination, setPagination] = useState<{ current: number; total: number }>({
    current: 1,
    total: 0,
  });
  const [reqBuyParams, setReqBuyParams] = useState<{ page: number; size: number }>({
    page: 1,
    size: 20,
  });
  const [isLoading, setIsloading] = useState<boolean>(true);
  useEffect(() => {
    fetchTableData();
  }, [reqBuyParams]);

  const fetchTableData = () => {
    if (currentCount > 0) {
      readAction.updateGloablSearchUnreadCount(0);
    }
    const params = {
      ...reqBuyParams,
      page: reqBuyParams.page - 1,
      randomKey: new Date().getTime(),
    };
    setIsloading(true);
    globalSearchApi.doGetCollectList(params).then(res => {
      const { totalElements: total, content: list } = res;
      setPagination({
        ...pagination,
        total,
      });
      setTableList(list);
      setIsloading(false);
      if (total !== 0 && list.length === 0) {
        setReqBuyParams({
          ...reqBuyParams,
          page: 1,
        });
      }
    });
  };

  const onTableChange = (currentPagination: any, filter: any, sorter: any) => {
    console.log('currentPagination', currentPagination, sorter);
    const { current, pageSize } = currentPagination;
    current &&
      setPagination({
        ...pagination,
        current,
      });
    current &&
      pageSize &&
      setReqBuyParams({
        ...reqBuyParams,
        page: current,
        size: pageSize,
      });
  };
  const deleteStar = (id: string | number) => {
    globalSearchApi.doDeleteCollectById({ collectId: id }).then(() => {
      Toast.success({
        content: '已取消订阅，系统将不再向您推送该公司动态',
      });
      fetchTableData();
    });
  };

  const handleChangeStatus = (id: string | number, status: number) => {
    setTableList(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status,
          };
        }
        return item;
      })
    );
  };

  return (
    <div className={classnames(style.container, style.starContainer)}>
      <HeaderLayout title={getIn18Text('GONGSIDINGYUE')} subTitle="当订阅的公司有信息更新时，系统将及时通知" />
      <div className={classnames(style.customsBody)}>
        <StarTable
          changeStatus={handleChangeStatus}
          tableList={tableList}
          pagination={pagination}
          onChange={onTableChange}
          deleteStar={deleteStar}
          onRefreshData={fetchTableData}
          loading={isLoading}
        />
      </div>
    </div>
  );
};

const StarRouter: React.FC<any> = () => {
  const isForwarder = useIsForwarder();
  return isForwarder ? <StarForwarder /> : <Star />;
};

export default StarRouter;
