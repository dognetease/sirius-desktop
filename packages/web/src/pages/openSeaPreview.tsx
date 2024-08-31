import React, { useState, useEffect } from 'react';
import { PageProps } from 'gatsby';
import { apiHolder, apis, CustomerApi, openSeaDetail as openSeaDetailType, ContactDetail, SystemEvent } from 'api';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import FoldCard from '@/components/Layout/Customer/components/foldCard/foldCard';
import BaseInfo from '@/components/Layout/Customer/SeaClue/components/SeaClueDetail/components/baseInfo';
import Contacts from '@/components/Layout/Customer/components/contacts/contacts';
import SiriusLayout from '../layouts';
import { useEventObserver } from '@web-common/hooks/useEventObserver';

const customerApi = apiHolder.api.requireLogicalApi(apis.customerApiImpl) as CustomerApi;

const OpenSeaPreview: React.FC<PageProps> = props => {
  const [detail, setDetail] = useState<openSeaDetailType>({} as openSeaDetailType);
  const [contacts, setContacts] = useState<ContactDetail[]>([]);

  const fetchOpenSeaDetail = id => {
    customerApi
      .openSeaDetail({ id })
      .then(data => {
        if (data) {
          const { contact_list, ...rest } = data;

          setContacts(contact_list || []);
          setDetail(rest as openSeaDetailType);
        } else {
          Toast.error({ content: '未查询到线索详情' });
        }
      })
      .catch(res => {
        Toast.error({ content: `线索详情接口异常: ${res?.data?.message}` });
      });
  };

  // for web
  useEffect(() => {
    const query = new URLSearchParams(props.location.search);
    const clue_open_sea_id = query.get('clue_open_sea_id');

    clue_open_sea_id && fetchOpenSeaDetail(clue_open_sea_id);
  }, [props.location.search]);

  // for electron
  useEventObserver('initPage', {
    name: 'openSeaPreview',
    func: (event: SystemEvent) => {
      if (event && event.eventData) {
        event.eventData.clue_open_sea_id && fetchOpenSeaDetail(event.eventData.clue_open_sea_id);
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

OpenSeaPreview.defaultProps = {};

export default OpenSeaPreview;
