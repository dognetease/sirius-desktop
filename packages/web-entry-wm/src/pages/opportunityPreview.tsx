import React, { useState, useEffect } from 'react';
import { PageProps } from 'gatsby';
import { apiHolder, apis, CustomerApi, OpportunityDetail as OpportunityDetailType, ContactDetail, SystemEvent } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import FoldCard from '@/components/Layout/Customer/components/foldCard/foldCard';
import BaseInfo from '@/components/Layout/Customer/Business/components/OpportunityDetail/components/baseInfo';
import Contacts from '@/components/Layout/Customer/components/contacts/contacts';
import SiriusLayout from '../layouts';
import { useEventObserver, useCommonErrorEvent } from '@web-common/hooks/useEventObserver';

const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

const OpportunityPreview: React.FC<PageProps> = props => {
  const [detail, setDetail] = useState<OpportunityDetailType>({} as OpportunityDetailType);
  const [contacts, setContacts] = useState<ContactDetail[]>([]);

  useCommonErrorEvent();

  const fetchOpportunityDetail = id => {
    customerApi.getOpportunityDetail({ id }).then(data => {
      if (data) {
        const { contact_list, ...rest } = data;

        setContacts(contact_list ?? []);
        setDetail(rest as OpportunityDetailType);
      } else {
        Toast.error({ content: '未查询到商机详情' });
      }
    });
  };

  // for web
  useEffect(() => {
    const query = new URLSearchParams(props.location.search);
    const opportunity_id = query.get('opportunity_id');

    opportunity_id && fetchOpportunityDetail(opportunity_id);
  }, [props.location.search]);

  // for electron
  useEventObserver('initPage', {
    name: 'opportunityPreview',
    func: (event: SystemEvent) => {
      if (event && event.eventData) {
        event.eventData.opportunity_id && fetchOpportunityDetail(event.eventData.opportunity_id);
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
          <BaseInfo detail={detail} />
        </FoldCard>
        <div style={{ height: 16 }} />
        <FoldCard title={`联系人(${contacts.length})`}>
          <Contacts list={contacts} mode="complete" options={[]} />
        </FoldCard>
      </div>
    </SiriusLayout.ContainerLayout>
  );
};

OpportunityPreview.defaultProps = {};

export default OpportunityPreview;
