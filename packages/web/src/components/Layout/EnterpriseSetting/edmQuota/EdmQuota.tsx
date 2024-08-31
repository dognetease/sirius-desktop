import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { Skeleton } from 'antd';
import Table, { ColumnsType, TablePaginationConfig } from 'antd/lib/table';
import { api, apis, EdmSendBoxApi, QuotaForMember, ResQuotaList } from 'api';
import classnames from 'classnames';
import React, { useState, useEffect, useCallback } from 'react';
import { EditQuotaModal } from './EditQuotaModal';
import style from './index.module.scss';
import { getIn18Text } from 'api';
const edmApi = api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
export const EdmQuota = () => {
  const [editItem, setEditItem] = useState<QuotaForMember>();
  const [data, setData] = useState<ResQuotaList>();
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
  });
  const handleEdit = (item: QuotaForMember) => {
    setEditItem(item);
  };
  const fetchData = () => {
    setLoading(true);
    edmApi
      .getQuotaList(pagination.current, 20)
      .then(data => {
        setData(data);
        setPagination({
          current: data.page,
          total: data.totalSize,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const onTableEventChange = useCallback((paging: TablePaginationConfig) => {
    setPagination({
      current: paging.current || 1,
      total: paging.total || pagination.total,
    });
  }, []);
  useEffect(fetchData, []);
  useEffect(fetchData, [pagination.current]);
  const columns: ColumnsType<QuotaForMember> = [
    {
      title: getIn18Text('XINGMING'),
      dataIndex: 'name',
    },
    {
      title: getIn18Text('YOUXIANG'),
      dataIndex: 'email',
    },
    {
      title: getIn18Text('XIANE(FENG)'),
      dataIndex: 'totalQuota',
      render(n, field) {
        return field.defaultTotalQuota ? getIn18Text('MOREN') : Number(n).toLocaleString();
      },
    },
    {
      title: getIn18Text('DANCIXIANE(FENG)'),
      dataIndex: 'singleQuota',
      render(n) {
        return Number(n).toLocaleString();
      },
    },
    {
      title: getIn18Text('DANRIXIANE(FENG)'),
      dataIndex: 'dayQuota',
      render(n) {
        return Number(n).toLocaleString();
      },
    },
    {
      title: getIn18Text('CHUANGJIANSHIJIAN'),
      dataIndex: 'createAt',
    },
    {
      title: getIn18Text('BIANJISHIJIAN'),
      dataIndex: 'editAt',
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 120,
      render(_, field) {
        return <a onClick={() => handleEdit(field)}>{getIn18Text('BIANJIPEIE')}</a>;
      },
    },
  ];
  return (
    <PermissionCheckPage resourceLabel="ORG_SETTINGS" accessLabel="EDM_QUOTA_SETTING" menu="ORG_SETTINGS_QUOTA_SETTING">
      <div className={style.pageContainer}>
        <h3 className={style.pageTitle}>
          {getIn18Text('YOUJIANYINGXIAOPEIE')}
          <span style={{ float: 'right' }} className={style.titleRight}>
            {getIn18Text('ZONGPEIE\uFF1A')}
            {data ? Number(data.totalQuota).toLocaleString() : '-'}
            {getIn18Text('FENG  YIYONG\uFF1A')}
            {data?.totalUsed.toLocaleString()}
            {getIn18Text('FENG  YOUXIAOQI\uFF1A')}
            {data?.expireAt}
          </span>
        </h3>
        <p className={style.subtitle}>
          {getIn18Text('XIANZHIBUTONGZHANGHU\uFF0CYINGXIAOYOUJIANDEFASONGEDU\u3002\uFF08XIANE\u201CMOREN\u201DZHIYONGHUKESHIYONGQIYESHENGYUFENGSHU\uFF09')}
        </p>
        <Skeleton loading={loading} active>
          <div>
            <Table
              className={classnames('edm-table', style.fieldTable)}
              columns={columns}
              pagination={
                pagination.total > 20
                  ? {
                      ...pagination,
                      showSizeChanger: false,
                      size: 'small',
                      pageSize: 20,
                      className: 'pagination-wrap',
                    }
                  : false
              }
              dataSource={data?.quotaAdminList}
              onChange={onTableEventChange}
            />
          </div>
        </Skeleton>
        <EditQuotaModal
          visible={!!editItem}
          item={editItem}
          onClose={() => setEditItem(void 0)}
          onOk={() => {
            setEditItem(void 0);
            setPagination({ current: 1, total: pagination.total });
            fetchData();
          }}
        />
      </div>
    </PermissionCheckPage>
  );
};
