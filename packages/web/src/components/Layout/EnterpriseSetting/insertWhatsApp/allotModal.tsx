import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Divider, Select } from 'antd';
// import Button from '@web-common/components/UI/Button';
import Button from '@lingxi-common-component/sirius-ui/Button';
// import Table from '@web-common/components/UI/Table';
import Table from '@lingxi-common-component/sirius-ui/Table';
import { ColumnsType } from 'antd/lib/table';
import { commonDateUnitFormat } from '@web-common/utils/commonDateUnitFormat';
import { api, apis, InsertWhatsAppApi, AllotList, AllotItem, DataTrackerApi } from 'api';
import { PrivilegeCheck } from '@/components/UI/PrivilegeEnhance';
import style from './allotModal.module.scss';

const insertWhatsAppApi = api.requireLogicalApi(apis.insertWhatsAppApiImpl) as InsertWhatsAppApi;
const trackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface Person {
  label: string;
  value: string;
}
export interface AllotModalProps {
  sender: string;
  openChat: (accId: string) => void;
  onModify: () => void;
}
export const AllotModal: React.FC<AllotModalProps> = props => {
  const [loading, setLoading] = useState<boolean>(false);
  const [opening, setOpening] = useState<boolean>(false);
  const [allotList, setAllotList] = useState<AllotList>([]);
  const [personList, setPersonList] = useState<Person[]>([]);
  const [newPerson, setNewPerson] = useState<any>(null);
  const columns: ColumnsType<AllotItem> = [
    {
      title: '使用人员',
      dataIndex: 'accId',
      ellipsis: true,
      render: (_, field) => `${field.accountInfo.accName}(${field.accountInfo.accEmail})`,
    },
    {
      title: '分配时间',
      dataIndex: 'allotTime',
      ellipsis: true,
      render: (timestamp: number) => commonDateUnitFormat(timestamp, 'precise'),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 200,
      render: (_, field) => (
        <>
          <PrivilegeCheck resourceLabel="WHATSAPP_BUSINESS_ACCOUNT" accessLabel="VIEW_MESSAGE_RECORD">
            <a
              className={style.btn}
              onClick={() => {
                props.openChat(field.accountInfo.accId);
              }}
            >
              查看聊天记录
            </a>
          </PrivilegeCheck>
          <Divider type="vertical" />
          <PrivilegeCheck resourceLabel="WHATSAPP_BUSINESS_ACCOUNT" accessLabel="ALLOT">
            <a className={style.btn} onClick={() => deleteAllot(field.accountInfo.accId)}>
              取消分配
            </a>
          </PrivilegeCheck>
        </>
      ),
    },
  ];
  useEffect(() => {
    getAllotList();
    insertWhatsAppApi.getAllotPersonList({ sender: props.sender }).then(data => {
      if (Array.isArray(data)) {
        setPersonList(
          data.map(item => ({
            label: `${item.accountInfo.accName}(${item.accountInfo.accEmail})`,
            value: item.accountInfo.accId,
          }))
        );
      }
    });
  }, []);
  useEffect(() => {
    if (!opening) {
      setNewPerson(null);
    } else {
      trackerApi.track('WA_account_management_business_add_assign');
    }
  }, [opening]);
  const getAllotList = () => {
    setLoading(true);
    insertWhatsAppApi
      .getAllotList({ sender: props.sender })
      .then(setAllotList)
      .finally(() => setLoading(false));
  };
  const handleSavePerson = () => {
    props.onModify();
    insertWhatsAppApi
      .addAllot({
        accId: newPerson,
        sender: props.sender,
      })
      .then(() => {
        getAllotList();
        setOpening(false);
      });
  };
  const deleteAllot = (accId: string) => {
    props.onModify();
    insertWhatsAppApi
      .deleteAllot({
        accId,
        sender: props.sender,
      })
      .then(getAllotList);
    trackerApi.track('WA_account_management_business_cancel_assign');
  };
  return (
    <div className={style.container}>
      <PrivilegeCheck resourceLabel="WHATSAPP_BUSINESS_ACCOUNT" accessLabel="ALLOT">
        <div style={{ marginBottom: '12px' }}>
          <Button btnType="primary" onClick={e => setOpening(true)}>
            添加分配
          </Button>
        </div>
      </PrivilegeCheck>
      <Table columns={columns} dataSource={allotList} pagination={false} loading={loading}></Table>
      {opening && (
        <div className={style.allotAction}>
          <Select
            size="middle"
            showSearch
            options={personList}
            value={newPerson}
            onChange={value => setNewPerson(value)}
            filterOption={(input, option) =>
              String(option?.label || '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
          <Button btnType="primary" disabled={!newPerson} onClick={handleSavePerson}>
            保存
          </Button>
          <Button onClick={e => setOpening(false)}>取消</Button>
        </div>
      )}
    </div>
  );
};
