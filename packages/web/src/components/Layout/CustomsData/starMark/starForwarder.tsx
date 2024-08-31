import React, { useEffect, useState } from 'react';
import { Breadcrumb } from 'antd';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { CompanyCollectItem, getIn18Text } from 'api';
import { ReadCountActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { ReactComponent as SeparatorSvg } from '@/images/icons/edm/separator.svg';
import style from './star.module.scss';
import { globalSearchApi } from '../../globalSearch/constants';
import StarTableForwarder from './table/starTableForwarder';
import { batchAddSuccessMessage$ } from '../../globalSearch/hook/useLeadsAdd';
import { GrubProcessTypeEnum } from '../../globalSearch/search/GrubProcess/constants';

const StarForwarder: React.FC<any> = () => {
  const [tableList, setTableList] = useState<CompanyCollectItem[]>([]);
  const currentCount = useAppSelector(state => state.readCountReducer.unreadCount.customsData) || 0;
  const readAction = useActions(ReadCountActions);
  const [fissionDetail, setFissionDetail] = useState<number | null>(null);

  const [pagination, setPagination] = useState<{ current: number; total: number }>({
    current: 1,
    total: 0,
  });
  const [reqBuyParams, setReqBuyParams] = useState<{ page: number; size: number }>({
    page: 1,
    size: 20,
  });
  const [isLoading, setIsloading] = useState<boolean>(true);

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

  const onTableChange = (currentPagination: any) => {
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
  const deleteStar = (ids: Array<string | number>, onSuccess?: () => void) => {
    globalSearchApi.doDeleteCollectById({ collectIds: ids.join(',') }).then(() => {
      Toast.success({
        content: '已取消订阅，系统将不再向您推送该公司动态',
      });
      fetchTableData();
      onSuccess?.();
    });
  };

  const handleChangeItem = (id: string | number, params: any) => {
    setTableList(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            ...(params || {}),
          };
        }
        return item;
      })
    );
  };

  const onFissionDetail = (fissionId: number | null) => {
    setFissionDetail(fissionId);
  };

  useEffect(() => {
    fetchTableData();
  }, [reqBuyParams]);

  useEffect(() => {
    const r = batchAddSuccessMessage$.subscribe(event => {
      if (event?.eventData?.type === GrubProcessTypeEnum.fission) {
        Toast.success({
          content: `${event?.eventData?.data?.name || ''}裂变成功`,
        });
        fetchTableData();
      }
    });
    return () => {
      r.unsubscribe();
    };
  }, []);

  return (
    <div className={style.starContainer}>
      {fissionDetail && (
        <Breadcrumb separator={<SeparatorSvg />}>
          <Breadcrumb.Item className={style.breadcrumbItem}>
            <span
              onClick={e => {
                e.preventDefault();
                setFissionDetail(null);
              }}
            >
              {getIn18Text('GONGSIDINGYUE')}
            </span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>裂变潜客列表</Breadcrumb.Item>
        </Breadcrumb>
      )}
      <StarTableForwarder
        fissionId={fissionDetail}
        changeItem={handleChangeItem}
        tableList={tableList}
        pagination={pagination}
        onChange={onTableChange}
        deleteStar={deleteStar}
        onRefreshData={fetchTableData}
        onFissionDetail={onFissionDetail}
        loading={isLoading}
      />
    </div>
  );
};
export default StarForwarder;
