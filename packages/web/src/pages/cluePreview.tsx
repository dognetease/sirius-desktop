import React, { useState, useEffect } from 'react';
import { PageProps } from 'gatsby';
import { apiHolder, apis, CustomerApi, ClueDetail as ClueDetailType, ContactDetail, SystemEvent } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import FoldCard from '@/components/Layout/Customer/components/foldCard/foldCard';
import BaseInfo from '@/components/Layout/Customer/Clue/components/ClueDetail/components/baseInfo';
import Contacts from '@/components/Layout/Customer/components/contacts/contacts';
import SiriusLayout from '../layouts';
import { useEventObserver, useCommonErrorEvent } from '@web-common/hooks/useEventObserver';

const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

const CluePreview: React.FC<PageProps> = props => {
  const [detail, setDetail] = useState<ClueDetailType>({} as ClueDetailType);
  const [contacts, setContacts] = useState<ContactDetail[]>([]);

  useCommonErrorEvent();

  const fetchClueDetail = id => {
    customerApi.getClueDetail({ id }).then(data => {
      if (data) {
        const { contact_list, ...rest } = data;

        setContacts(contact_list || []);
        setDetail(rest as ClueDetailType);
      } else {
        Toast.error({ content: '未查询到线索详情' });
      }
    });
  };

  // for web
  useEffect(() => {
    const query = new URLSearchParams(props.location.search);
    const clue_id = query.get('clue_id');

    clue_id && fetchClueDetail(clue_id);
  }, [props.location.search]);

  // for electron
  useEventObserver('initPage', {
    name: 'cluePreview',
    func: (event: SystemEvent) => {
      if (event && event.eventData) {
        event.eventData.clue_id && fetchClueDetail(event.eventData.clue_id);
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

CluePreview.defaultProps = {};

export default CluePreview;
