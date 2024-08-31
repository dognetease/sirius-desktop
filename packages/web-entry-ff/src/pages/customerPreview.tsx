import React, { useState, useEffect } from 'react';
import { PageProps } from 'gatsby';
import { apiHolder, apis, CustomerApi, CustomerDetail as CustomerDetailType, ContactDetail, SystemEvent } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import FoldCard from '@/components/Layout/Customer/components/foldCard/foldCard';
import BaseInfo from '@/components/Layout/Customer/NewClient/components/CustomerDetail/components/baseInfo';
import Contacts from '@/components/Layout/Customer/components/contacts/contacts';
import SiriusLayout from '../layouts';
import { useEventObserver, useCommonErrorEvent } from '@web-common/hooks/useEventObserver';

const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

const CustomerPreview: React.FC<PageProps> = props => {
  const [detail, setDetail] = useState<CustomerDetailType>({} as CustomerDetailType);
  const [contacts, setContacts] = useState<ContactDetail[]>([]);

  useCommonErrorEvent();

  const fetchCustomerDetail = company_id => {
    customerApi.getCustomerDetail({ company_id }).then(data => {
      if (data) {
        const { contact_list, ...rest } = data;
        setContacts(contact_list ?? []);
        setDetail(rest as CustomerDetailType);
      } else {
        Toast.error({ content: '未查询到客户详情' });
      }
    });
  };

  // for web
  useEffect(() => {
    const query = new URLSearchParams(props.location.search);
    const company_id = query.get('company_id');

    company_id && fetchCustomerDetail(company_id);
  }, [props.location.search]);

  // for electron
  useEventObserver('initPage', {
    name: 'customerPreview',
    func: (event: SystemEvent) => {
      if (event && event.eventData) {
        event.eventData.company_id && fetchCustomerDetail(event.eventData.company_id);
      }
    },
  });

  return (
    <SiriusLayout.ContainerLayout isLogin={true}>
      <div
        style={{
          height: '100vh',
          padding: '30px 24px',
          overflow: 'auto',
          backgroundColor: '#ffffff',
        }}
      >
        <FoldCard title="基本信息">
          <BaseInfo data={detail} />
        </FoldCard>
        <div style={{ height: 16 }} />
        <FoldCard title={`联系人(${contacts.length})`}>
          <Contacts list={contacts} mode="complete" options={[]} />
        </FoldCard>
      </div>
    </SiriusLayout.ContainerLayout>
  );
};

CustomerPreview.defaultProps = {};

export default CustomerPreview;
