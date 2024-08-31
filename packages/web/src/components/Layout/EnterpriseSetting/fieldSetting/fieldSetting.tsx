/* eslint-disable jsx-a11y/anchor-is-valid */
import { Skeleton } from 'antd';
import Table, { ColumnsType } from 'antd/lib/table';
import { api, apis, FieldItem, FieldSettingApi, FieldTableList } from 'api';
import classnames from 'classnames';
import React, { useState, useEffect } from 'react';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { EditFieldModal } from './EditFieldModal';
import style from './fieldSetting.module.scss';
import { getIn18Text } from 'api';
const fieldSettingApi = api.requireLogicalApi(apis.fieldSettingApiImpl) as FieldSettingApi;
export const FieldSetting = () => {
  const [editItem, setEditItem] = useState<FieldItem>();
  const [data, setData] = useState<FieldTableList[]>([]);
  const [loading, setLoading] = useState(false);
  const handleEdit = (item: FieldItem) => {
    setEditItem(item);
  };
  const fetchData = () => {
    setLoading(true);
    fieldSettingApi
      .getList()
      .then(setData)
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(fetchData, []);
  const columns: ColumnsType<FieldItem> = [
    {
      title: getIn18Text('ZIDUANMINGCHENG'),
      dataIndex: 'field_label',
      width: '48%',
    },
    {
      title: getIn18Text('ZIDUANLEIXING'),
      dataIndex: 'view_type',
      render() {
        return getIn18Text('DANXUAN');
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      width: 120,
      render(_, field) {
        return <a onClick={() => handleEdit(field)}>{getIn18Text('BIANJI')}</a>;
      },
    },
  ];
  return (
    <PermissionCheckPage resourceLabel="ORG_SETTINGS" accessLabel="CONTACT_FIELD_SETTING" menu="ORG_SETTINGS_FIELD_SETTING">
      <div className={style.pageContainer}>
        <h3 className={style.pageTitle}>{getIn18Text('ZIDUANSHEZHI')}</h3>
        <Skeleton loading={loading} active>
          <div>
            {data.map(resource => (
              <div key={resource.part_name}>
                <h4 className={style.resourceName}>{resource.part_label}</h4>
                <Table className={classnames('edm-table', style.fieldTable)} columns={columns} dataSource={resource.field_list} pagination={false} />
              </div>
            ))}
          </div>
        </Skeleton>
        <EditFieldModal
          visible={editItem !== undefined}
          item={editItem}
          onClose={() => setEditItem(undefined)}
          onOk={() => {
            setEditItem(undefined);
            fetchData();
          }}
        />
      </div>
    </PermissionCheckPage>
  );
};
