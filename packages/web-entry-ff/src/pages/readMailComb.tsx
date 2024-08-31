/* eslint-disable linebreak-style */
import React, { useState, useEffect } from 'react';
import { PageProps } from 'gatsby';
// @ts-ignore
import { apiHolder as api, EventApi, inWindow, MailEntryModel, MailStatusType, SystemEvent } from 'api';
import '../styles/global.scss';
import MailRelatedBox from '@web-mail/mailRelatedBox/mailRelatedBox';
import listenWriteMail from '@web-mail/components/listenWriteMail';
// import Alert from '@web-common/components/UI/Alert/Alert';
// import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { EditorTooltipType } from '@web-common/state/state';
import { useAppDispatch } from '@web-common/state/createStore';
import { useCommonErrorEvent, useEventObserver } from '@web-common/hooks/useEventObserver';
import { getParameterByName, safeDecodeURIComponent } from '@web-common/utils/utils';
import SiriusLayout from '../layouts';
import { getIn18Text } from 'api';

console.info('---------------------from read letter page------------------');
const eventApi: EventApi = api.api.getEventApi();
interface Props {
  currentMail: MailEntryModel;
  title: string;
  editorTooltip: EditorTooltipType;
}

type CheckStatus = {
  startDate?: string;
  offset?: number;
  status: MailStatusType;
  needRefresh: boolean;
  contactList: string[];
  mailAccount: string;
};

// const contactList: string[] = [];
// if (inWindow()) {
//   const hash = decodeURIComponent(location.hash);
//   if (hash && hash.length > 0) { contactList.push(...hash.replace('#', '').split(',')); }
// }

const ReadMailPage: React.FC<PageProps & Props> = ({ title, location }) => {
  const dispatch = useAppDispatch();
  const [startData, setStartData] = useState<CheckStatus>({
    status: 'ALL',
    needRefresh: true,
    contactList: [],
  });
  const [mailAccount, setMailAccount] = useState(() => getParameterByName('account', location.search) || '');
  useCommonErrorEvent('relatedMailErrorOb');
  useEffect(() => {
    inWindow() && (window.document.title = title || getIn18Text('WANGLAIYOUJIAN'));
  }, [title]);

  useEffect(() => {
    try {
      if (inWindow()) {
        const hash = safeDecodeURIComponent(location.hash);
        if (hash && hash.length > 0) {
          setStartData(res => {
            return {
              ...res,
              contactList: hash.replace('#', '').split(','),
            };
          });
        }
      }
    } catch (e) {
      console.error('[error mailreleate]', e);
    }
    const eventId = listenWriteMail(dispatch);
    return () => {
      eventApi.unregisterSysEventObserver('writeLatter', eventId);
    };
  }, []);

  useEventObserver('initPage', {
    name: 'readMailCombPageInitOb',
    func: (ev: SystemEvent) => {
      console.log('**** init page event received :', ev);
      const { eventData, _account } = ev;
      if (eventData) {
        setStartData(startData => {
          startData.contactList.push(...(ev.eventData as string[]));
          return {
            needRefresh: true,
            contactList: startData.contactList,
            status: 'ALL',
          };
        });
        _account && setMailAccount(_account);
        console.log(`**** setup init data :${JSON.stringify(startData)}`);
      }
    },
  });

  return (
    <>
      <SiriusLayout.ContainerLayout isLogin={false}>
        {mailAccount && <MailRelatedBox mailAccount={mailAccount} startData={startData} setStartData={setStartData} />}
      </SiriusLayout.ContainerLayout>
    </>
  );
};

export default ReadMailPage;
console.info('---------------------end read mail page------------------');
