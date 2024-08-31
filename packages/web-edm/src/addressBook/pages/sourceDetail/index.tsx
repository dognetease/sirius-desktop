import React, { useState, useRef } from 'react';
import { apiHolder, apis, AddressBookApi, AddressBookContact, AddressBookContactAddressType, AddressBookFilterType, AddressBookContactsParams } from 'api';
import { navigate } from '@reach/router';
import { Breadcrumb, Space } from 'antd';
import Contacts from '../../components/Contacts';
import { getBodyFixHeight } from '@web-common/utils/constant';
import classnames from 'classnames';
import addressBookStyle from '../../addressBook.module.scss';
import style from './index.module.scss';
import { getIn18Text } from 'api';
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
interface SourceDetailProps {
  qs: {
    sourceType: string;
    sourceName: string;
  };
}
const SourceDetail: React.FC<SourceDetailProps> = props => {
  const { qs } = props;
  const [data, setData] = useState<AddressBookContact[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const contactsRef = useRef<any>(null);
  return (
    <div className={classnames(style.sourceDetail, addressBookStyle.addressBook)}>
      <div className={style.breadcrumb}>
        <Breadcrumb separator=">">
          <Breadcrumb.Item className={style.breadcrumbLink} onClick={() => navigate('#edm?page=addressBookIndex&defaultTabKey=sources')}>
            {getIn18Text('YINGXIAOLIANXIREN')}
          </Breadcrumb.Item>
          <Breadcrumb.Item>{qs.sourceName}</Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <div className={style.title}>{qs.sourceName}</div>
      <Contacts
        ref={contactsRef}
        data={data}
        total={total}
        loading={loading}
        scrollHeight={`calc(100vh - ${getBodyFixHeight(true) ? 364 : 396}px)`}
        onFetch={(type: AddressBookFilterType, params: AddressBookContactsParams) => {
          setLoading(true);
          addressBookApi
            .getAddressMembers({
              ...params,
              memberParam: {
                contactAddressType: AddressBookContactAddressType.EMAIL,
                listKey: qs.sourceType,
                listType: 3,
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
                listKey: qs.sourceType,
                listType: 3,
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
              </Space>
              {table}
            </>
          );
        }}
      </Contacts>
    </div>
  );
};
export default SourceDetail;
