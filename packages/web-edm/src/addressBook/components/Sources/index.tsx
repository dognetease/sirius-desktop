import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Table, Space } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { apis, apiHolder, AddressBookApi, AddressBookSource } from 'api';
import { navigate } from '@reach/router';
import EditAutoGroup from '../EditAutoGroup';
import Message from '@web-common/components/UI/Message/SiriusMessage';
import { getBodyFixHeight } from '@web-common/utils/constant';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import addressBookStyle from '../../addressBook.module.scss';
import style from './index.module.scss';
import variables from '@web-common/styles/export.module.scss';
import { getIn18Text } from 'api';
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
interface SourcesProps {}
const Sources: React.FC<SourcesProps> = props => {
  const [data, setData] = useState<AddressBookSource[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingData, setEditingData] = useState<AddressBookSource | null>(null);
  const handleSourcesFetch = () => {
    setLoading(true);
    addressBookApi
      .getSources()
      .then(nextData => {
        setData(nextData);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    handleSourcesFetch();
  }, []);
  const handleDetailNavigate = (source: AddressBookSource) => {
    navigate(`#edm?page=addressBookSourceDetail&sourceType=${source.sourceType}&sourceName=${source.sourceName}`);
  };
  const columns: ColumnsType<any> = [
    {
      title: getIn18Text('CHUANGJIANFANGSHI'),
      dataIndex: 'sourceName',
      render: (text: string, item: AddressBookSource) => {
        return <a onClick={() => handleDetailNavigate(item)}>{text}</a>;
      },
    },
    {
      title: getIn18Text('LIANXIRENSHU'),
      dataIndex: 'addressNum',
    },
    {
      title: getIn18Text('ZIDONGFENZU'),
      width: 200,
      dataIndex: 'operations',
      render: (text: string, item: AddressBookSource) => {
        if (!item.isSystem) return null;
        if (!item.existRule) {
          return (
            <PrivilegeCheck accessLabel="OP" resourceLabel="ADDRESS_BOOK">
              <a onClick={() => setEditingData(item)}>{getIn18Text('CHUANGJIANGUIZE')}</a>
            </PrivilegeCheck>
          );
        }
        return (
          <PrivilegeCheck accessLabel="OP" resourceLabel="ADDRESS_BOOK">
            <Space size={20}>
              <a onClick={() => setEditingData(item)}>{getIn18Text('BIANJIGUIZE')}</a>
              {item.sourceStatus ? (
                <span style={{ color: '#00CCAA' }}>{getIn18Text('YIQIYONG')}</span>
              ) : (
                <span style={{ color: `${variables.label62}` }}>{getIn18Text('WEIQIYONG')}</span>
              )}
            </Space>
          </PrivilegeCheck>
        );
      },
    },
  ];
  return (
    <div className={style.sources}>
      <div className={style.content}>
        <div className={style.title}>{getIn18Text('QUANBUCHUANGJIANFANGSHI')}</div>
        <Table<AddressBookSource>
          className={classnames(addressBookStyle.table, addressBookStyle.tableDeepHead)}
          scroll={{ x: 'max-content', y: `calc(100vh - ${getBodyFixHeight(true) ? 286 : 318}px)` }}
          columns={columns}
          loading={loading}
          dataSource={data}
          pagination={false}
        />
      </div>
      <EditAutoGroup
        title={editingData?.existRule ? getIn18Text('BIANJIGUIZE') : getIn18Text('CHUANGJIANGUIZE')}
        visible={!!editingData}
        existRule={editingData?.existRule || false}
        groupIdList={editingData?.existRule ? editingData?.groupIdList || [] : []}
        sourceName={editingData?.sourceName || ''}
        sourceType={editingData?.sourceType || 0}
        enable={!!editingData?.sourceStatus}
        onCancel={() => setEditingData(null)}
        onSuccess={() => {
          setEditingData(null);
          handleSourcesFetch();
          Message.success({ content: getIn18Text('CAOZUOCHENGGONG') });
        }}
      />
    </div>
  );
};
export default Sources;
