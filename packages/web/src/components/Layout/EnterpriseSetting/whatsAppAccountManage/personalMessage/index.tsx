import React, { useState, useEffect, useMemo } from 'react';
import { Skeleton, PaginationProps } from 'antd';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { ColumnsType } from 'antd/lib/table';
import { api, apis, InsertWhatsAppApi, PersonalSender, PersonalSenderList, DataTrackerApi } from 'api';
import { ChatModal } from '../chatModal';
import { whatsAppTracker } from '@/components/Layout/SNS/tracker';
import { commonDateUnitFormat } from '@web-common/utils/commonDateUnitFormat';
import { PermissionCheckPage, PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import style from './style.module.scss';

const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

const defaultPageSize = 20;

export const PersonalMessage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<PersonalSenderList>([]);
  const [visible, setVisible] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [item, setItem] = useState<any>();
  const fetchData = () => {
    const params = {
      page: currentPage - 1,
      pageSize: defaultPageSize,
    };
    setLoading(true);
    insertWhatsAppApi
      .getPersonalSenderListV2(params)
      .then(res => {
        setData(res?.content || []);
        setTotal(res.totalSize);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchData();
  }, [currentPage]);
  useEffect(() => {
    whatsAppTracker.trackSetting('show');
  }, []);
  const handleCloseModal = () => {
    setVisible(false);
    setItem(void 0);
  };
  const onTableEventChange = (pagination: PaginationProps) => {
    setCurrentPage(pagination?.current || 1);
  };
  const columns: ColumnsType<PersonalSender> = [
    {
      title: 'WhatsApp号码',
      dataIndex: 'sender',
    },
    {
      title: '外贸通账号',
      dataIndex: 'accId',
      render: (_, field) => `${field.accountInfo.accName}(${field.accountInfo.accEmail})`,
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      render: (timestamp: number) => commonDateUnitFormat(timestamp, 'precise'),
    },
    {
      title: '首次沟通时间',
      dataIndex: 'firstSendTime',
      render: (timestamp: number) => commonDateUnitFormat(timestamp, 'precise'),
    },
    {
      title: '结束沟通时间',
      dataIndex: 'lastSendTime',
      render: (timestamp: number) => commonDateUnitFormat(timestamp, 'precise'),
    },
    {
      title: typeof window !== 'undefined' ? window.getLocalLabel('CAOZUO') : '',
      dataIndex: 'action',
      fixed: 'right',
      width: 120,
      render: (_, field) => (
        <PrivilegeCheck resourceLabel="WHATSAPP_PERSONAL_ACCOUNT" accessLabel="VIEW_MESSAGE_RECORD">
          <a
            className={style.btn}
            onClick={() => {
              setItem({
                searchAccId: field.accountInfo.accId,
                sender: field.sender,
                startTime: field.loginTime,
                endTime: field.logoutTime || undefined,
                name: field.accountInfo.accName,
              });
              setVisible(true);
              trackerApi.track('WA_account_management_personal_chatrecord');
            }}
          >
            查看聊天记录
          </a>
        </PrivilegeCheck>
      ),
    },
  ];
  return (
    <PermissionCheckPage resourceLabel="WHATSAPP_PERSONAL_ACCOUNT" accessLabel="VIEW" menu="ORG_SETTINGS_PEER_SETTING">
      <div className={style.pageContainer}>
        <div className={style.pageContent}>
          <Skeleton loading={loading} active>
            <Table
              className={style.table}
              columns={columns}
              dataSource={data}
              onChange={onTableEventChange}
              pagination={{
                size: 'small',
                total,
                current: currentPage,
                pageSize: defaultPageSize,
                showSizeChanger: false,
              }}
            />
          </Skeleton>
        </div>
        <ChatModal visible={visible} data={item} onClose={handleCloseModal} />
      </div>
    </PermissionCheckPage>
  );
};
