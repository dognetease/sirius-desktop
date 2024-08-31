import React, { useState } from 'react';
import { AddressBookApi, AddressBookContact, AddressBookContactsParams, AddressBookFilterType, apiHolder, apis } from 'api';
import { Breadcrumb, Space } from 'antd';
import Contacts from '../../components/Contacts';
import { getBodyFixHeight } from '@web-common/utils/constant';
import { navigate } from 'gatsby-link';
import classnames from 'classnames';
import addressBookStyle from '../../addressBook.module.scss';
import style from './style.module.scss';
import { getIn18Text } from 'api';
interface Props {
  qs: Record<string, string>;
}
const addressBookApi = apiHolder.api.requireLogicalApi(apis.addressBookApiImpl) as unknown as AddressBookApi;
export const AddressHistoryDetail: React.FC<Props> = props => {
  const [data, setData] = useState<AddressBookContact[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  // useEffect(() => {
  //   console.log('@@@ qs', qs)
  // }, [qs.id]);
  return (
    <div className={classnames(style.container, addressBookStyle.addressBook)}>
      <div className={style.head}>
        <Breadcrumb separator=">">
          <Breadcrumb.Item onClick={() => navigate('#edm?page=addressBookIndex')}>{getIn18Text('YINGXIAOLIANXIREN')}</Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => navigate('#edm?page=addressHistoryIndex')}>{getIn18Text('LISHIDAORUMINGDAN')}</Breadcrumb.Item>
          <Breadcrumb.Item>{getIn18Text('DAORUMINGDANXIANGQING')}</Breadcrumb.Item>
        </Breadcrumb>
        <div className={style.title}>{getIn18Text('DAORUMINGDANXIANGQING')}</div>
      </div>
      <div className={style.contacts}>
        <Contacts
          data={data}
          total={total}
          loading={loading}
          scrollHeight={`calc(100vh - ${getBodyFixHeight(true) ? 360 : 392}px)`}
          onFetch={(type: AddressBookFilterType, params: AddressBookContactsParams) => {
            setLoading(true);
            addressBookApi
              .getAddressMembers({
                ...params,
                memberParam: {
                  contactAddressType: 1,
                  listKey: props?.qs?.id,
                  listType: 5,
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
          onFetchBatchDataList={params =>
            addressBookApi
              .getAddressMembers({
                ...params,
                memberParam: {
                  contactAddressType: 1,
                  listKey: props?.qs?.id,
                  listType: 5,
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
    </div>
  );
};

export default AddressHistoryDetail;
