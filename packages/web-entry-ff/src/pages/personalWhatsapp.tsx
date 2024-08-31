import React, { useEffect, useState } from 'react';
import { PageProps } from 'gatsby';
import querystring from 'querystring';
import { api, EventApi, SystemEvent } from 'api';
import { useAppDispatch } from '@web-common/state/createStore';
import { getAreaSelectAsync, getBaseSelectAsync } from '@web-common/state/reducer/customerReducer';
import listenWriteMail from '@web-mail/components/listenWriteMail';
import { useCommonErrorEvent, useEventObserver } from '@web-common/hooks/useEventObserver';
import SiriusLayout from '@/layouts';
import PageContentLayout from '@/layouts/Main/pageContentLayout';
import { PersonalWhatsapp } from '@/components/Layout/SNS/WhatsApp/personalWhatsapp';

const eventApi: EventApi = api.getEventApi();

const personalWhatsApp: React.FC<PageProps> = props => {
  const { location } = props;
  const [qs, setQs] = useState<Record<string, string>>({});
  const dispatch = useAppDispatch();

  useCommonErrorEvent();

  // for web
  useEffect(() => {
    const params = querystring.parse(location.search.split('?')[1]) as Record<string, string>;
    setQs(params);
  }, [location.search]);

  // for electron
  useEventObserver('initPage', {
    name: 'opportunityPreview',
    func: (event: SystemEvent) => {
      if (event && event.eventData) {
        setQs(event.eventData);
      }
    },
  });

  useEffect(() => {
    const eventId = listenWriteMail(dispatch);
    dispatch(getBaseSelectAsync());
    dispatch(getAreaSelectAsync());
    return () => {
      eventApi.unregisterSysEventObserver('writeLatter', eventId);
    };
  }, []);
  return (
    <SiriusLayout.ContainerLayout isLogin={false}>
      <PageContentLayout>
        <PersonalWhatsapp qs={qs} />
      </PageContentLayout>
    </SiriusLayout.ContainerLayout>
  );
};

export default personalWhatsApp;
