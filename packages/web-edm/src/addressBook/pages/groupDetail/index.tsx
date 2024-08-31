import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  apiHolder,
  apis,
  AddressBookApi,
  AddressBookContact,
  AddressBookContactAddressType,
  AddressBookFilterType,
  AddressBookGroupType,
  AddressBookContactsParams,
  AddressBookGroup,
} from 'api';
import { navigate } from '@reach/router';
import { Breadcrumb, Space, Button } from 'antd';
import Contacts from '../../components/Contacts';
import { AddContact } from '../../views/AddContact/index';
import { getBodyFixHeight } from '@web-common/utils/constant';
import classnames from 'classnames';
import { AutoMarketPanel } from './automarketPanel';
import addressBookStyle from '../../addressBook.module.scss';
import style from './index.module.scss';
import { getIn18Text } from 'api';
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
interface GroupDetailProps {
  qs: {
    groupId: string;
    groupType: string;
  };
}
const GroupDetail: React.FC<GroupDetailProps> = props => {
  const { qs } = props;
  const [data, setData] = useState<AddressBookContact[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [groupDetail, setGroupDetail] = useState<AddressBookGroup | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>('');
  const [addContactVisible, setAddContactVisible] = useState<boolean>(false);
  // const isSystemGroup = +qs.groupType === AddressBookGroupType.SYSTEM;
  const contactsRef = useRef<any>(null);
  useEffect(() => {
    contactsRef.current?.reset();
    addressBookApi.getGroupDetail({ groupId: +qs.groupId }).then(data => {
      if (data) {
        setGroupDetail(data);
        setGroupName(data?.groupName || '--');
      }
    });
  }, [qs.groupId]);

  const isSystemGroup = useMemo(() => {
    return groupDetail?.groupType === AddressBookGroupType.SYSTEM;
  }, [groupDetail]);

  return (
    <div className={classnames(style.groupDetail, addressBookStyle.addressBook)}>
      <div className={style.breadcrumb}>
        <Breadcrumb separator=">">
          <Breadcrumb.Item className={style.breadcrumbLink} onClick={() => navigate('#edm?page=addressBookIndex&defaultTabKey=groups')}>
            {getIn18Text('YINGXIAOLIANXIREN')}
          </Breadcrumb.Item>
          <Breadcrumb.Item>{groupName || '-'}</Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <div className={style.title}>{groupName || '-'}</div>
      <AutoMarketPanel groupId={qs.groupId} groupDetail={groupDetail} />
      <Contacts
        ref={contactsRef}
        data={data}
        total={total}
        loading={loading}
        groupId={+qs.groupId}
        isSystemGroup={isSystemGroup}
        scrollHeight={`calc(100vh - ${getBodyFixHeight(true) ? 383 : 415}px)`}
        onFetch={(type: AddressBookFilterType, params: AddressBookContactsParams) => {
          setLoading(true);
          addressBookApi
            .getAddressMembers({
              ...params,
              memberParam: {
                contactAddressType: AddressBookContactAddressType.EMAIL,
                listKey: qs.groupId,
                listType: 2,
              },
            })
            .then(res => {
              setData(res.list);
              setTotal(res.total);
            })
            .finally(() => {
              setLoading(false);
            });
        }}
        onFetchBatchDataList={(params: AddressBookContactsParams) =>
          addressBookApi
            .getAddressMembers({
              ...params,
              memberParam: {
                contactAddressType: AddressBookContactAddressType.EMAIL,
                listKey: qs.groupId,
                listType: 2,
              },
            })
            .then(res => ({
              dataList: res.list || [],
              total: res.total || 0,
            }))
        }
      >
        {(filter, operations, table) => {
          return (
            <>
              {filter}
              <Space
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  margin: '20px 0 16px',
                }}
              >
                {operations}
                <Space>
                  <Button type="primary" onClick={() => setAddContactVisible(true)}>
                    {getIn18Text('XINJIANLIANXIREN')}
                  </Button>
                </Space>
              </Space>
              {table}
            </>
          );
        }}
      </Contacts>
      <AddContact
        visible={addContactVisible}
        id={1}
        onSuccess={() => {
          setAddContactVisible(false);
          contactsRef.current?.reset();
        }}
        onError={() => {}}
        onClose={() => setAddContactVisible(false)}
      />
    </div>
  );
};
export default GroupDetail;
