import React, { useState } from 'react';
import classnames from 'classnames';
import { Table, Button, Spin, message, Modal } from 'antd';
import { CustomerAuthWhitelistRecord, CustomerAuthWhitelistSearch, CustomerAuthWhitelist, apiHolder, apis, CustomerDiscoveryApi, EntityContact } from 'api';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import Input from '@/components/Layout/Customer/components/UI/Input/customerInput';
import { PermissionCheckPage } from '@/components/UI/PrivilegeEnhance';
import { DateFormat } from '../../../components/dateFormat';
import { ConcatSelectModal } from '../../components/ConcatSeletModal';
import { useTableSearch } from '../../hooks/useTableSearch';
import { regularCustomerTracker } from '../../report';
import style from './style.module.scss';
import { getIn18Text } from 'api';

const customerDiscoveryApi = apiHolder.api.requireLogicalApi(apis.customerDiscoveryApi) as CustomerDiscoveryApi;
export const AuthWhitelist: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const fetchTableData = async (search: CustomerAuthWhitelistSearch): Promise<[number, CustomerAuthWhitelist]> => {
    const res = await customerDiscoveryApi.getAuthWhiteList(search);
    return [res.total || 0, res];
  };
  const { loading, data, reload, setData, searchParams, setSearchParams } = useTableSearch<CustomerAuthWhitelistSearch, CustomerAuthWhitelist>(fetchTableData, {}, 500);
  const accountChange = async (account: string) => setSearchParams({ ...searchParams, account });
  const onConfirm = async (concatInfo: EntityContact[]) => {
    setModalVisible(false);
    await customerDiscoveryApi.addAuthWhitelist({
      owners: concatInfo.map(concat => ({
        ownerAccId: concat.id,
        ownerAccNickname: concat.contactName,
        ownerAccEmail: concat.accountName,
      })),
    });
    message.success(getIn18Text('TIANJIACHENGGONG'));
    reload();
  };
  const removeWhitelist = (row: CustomerAuthWhitelistRecord) => {
    Modal.confirm({
      centered: true,
      content: `是否确认将${row.ownerAccNickname}移除白名单？`,
      onOk: async () => {
        try {
          Object.assign(row, { loading: true });
          setData({ ...data });
          await customerDiscoveryApi.removeAuthWhitelist(row.ownerAccId);
          message.success(getIn18Text('SHANCHUCHENGGONG'));
          reload();
        } finally {
          Object.assign(row, { loading: false });
          setData({ ...data });
        }
      },
    });
  };
  const columns = [
    {
      title: getIn18Text('RENYUAN'),
      dataIndex: 'ownerAccNickname',
      key: 'ownerAccNickname',
      render(_: string, row: CustomerAuthWhitelistRecord) {
        return (
          <>
            <div className={style.nickName}>{row.ownerAccNickname}</div>
            <div className={style.nickEmail}>{row.ownerAccEmail}</div>
          </>
        );
      },
    },
    {
      title: getIn18Text('TIANJIASHIJIAN'),
      render(_: string, row: CustomerAuthWhitelistRecord) {
        return <DateFormat value={row.createTime} format="YYYY-MM-DD" />;
      },
    },
    {
      title: getIn18Text('CAOZUO'),
      align: 'right' as 'right',
      render(_: string, row: CustomerAuthWhitelistRecord) {
        if (row.loading) {
          return <Spin />;
        }
        return (
          <span className={style.linkBtn} onClick={() => removeWhitelist(row)}>
            {getIn18Text('YICHU')}
          </span>
        );
      },
    },
  ];
  return (
    <PermissionCheckPage resourceLabel="ORG_SETTINGS" accessLabel="PREVIOUS_CONTACT_WHITELIST_SETTING" menu="ORG_SETTINGS_WHITELIST_SETTING">
      <div className={classnames(style.ruleDetail, style.flex1, style.flex, style.flexCol)}>
        <div className={classnames([style.searchLine, style.flex])}>
          <Input
            style={{ width: '200px' }}
            placeholder={getIn18Text('SOUSUOZHANGHAO')}
            onChange={({ target: { value } }) => accountChange(value)}
            prefix={<SearchOutlined />}
          />
          <div className={classnames([style.searchBtn, style.flex1])}>
            <Button
              type="primary"
              onClick={() => {
                regularCustomerTracker.trackWhitelistAdd();
                setModalVisible(true);
              }}
            >
              {getIn18Text('XINZENG')}
            </Button>
          </div>
        </div>
        <div className={style.table}>
          <Table columns={columns} className={style.recommendTable} rowKey="ownerAccId" dataSource={data.data} loading={loading} pagination={false} />
        </div>

        <ConcatSelectModal visible={modalVisible} onCancel={() => setModalVisible(false)} onConfirm={onConfirm} />
      </div>
    </PermissionCheckPage>
  );
};
