/* eslint-disable linebreak-style */
import React, { useState, useEffect } from 'react';
import { PageProps } from 'gatsby';
// @ts-ignore
import { apiHolder as api, apis, EventApi, inWindow, MailEntryModel, MailStatusType, SystemEvent, LoggerApi, getIn18Text } from 'api';
import '../styles/global.scss';
import MailRelatedBox from '@web-mail/mailRelatedBox/mailRelatedBox';
import CustomerMailRelatedBox from '@web-mail/mailRelatedBox/customerMailRelatedBox';
import listenWriteMail from '@web-mail/components/listenWriteMail';
// import Alert from '@web-common/components/UI/Alert/Alert';
// import Toast from '@web-common/components/UI/Message/SiriusMessage';
import { EditorTooltipType } from '@web-common/state/state';
import { useAppDispatch } from '@web-common/state/createStore';
import { useCommonErrorEvent, useEventObserver } from '@web-common/hooks/useEventObserver';
import { getParameterByName, safeDecodeURIComponent } from '@web-common/utils/utils';
import SiriusLayout from '../layouts';

console.info('---------------------from read letter page------------------');
const eventApi: EventApi = api.api.getEventApi();
const loggerApi = api.api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;

interface Props {
  currentMail: MailEntryModel;
  title: string;
  editorTooltip: EditorTooltipType;
}

export interface CheckStatus {
  startDate?: string;
  offset?: number;
  status: MailStatusType;
  needRefresh: boolean;
  contactList: string[];
  mailAccount?: string;
}

// const contactList: string[] = [];
// if (inWindow()) {
//   const hash = safeDecodeURIComponent(location.hash);
//   if (hash && hash.length > 0) { contactList.push(...hash.replace('#', '').split(',')); }
// }

const ReadMailPage: React.FC<PageProps & Props> = ({ title, location }) => {
  const dispatch = useAppDispatch();
  const [startData, setStartData] = useState<CheckStatus>({
    status: 'ALL',
    needRefresh: true,
    contactList: [],
  });

  const [customerData, setCustomerData] = useState<{ customerId: string; selectedEmail: string } | null>(null);
  const [mailAccount, setMailAccount] = useState<string>();
  useCommonErrorEvent('relatedMailErrorOb');
  useEffect(() => {
    inWindow() && (window.document.title = title || getIn18Text('WANGLAIYOUJIAN'));
  }, [title]);

  useEffect(() => {
    try {
      if (inWindow()) {
        const hash = safeDecodeURIComponent(location.hash);
        const search = safeDecodeURIComponent(location.search);
        const account = getParameterByName('account', search) || '';
        const customerId = getParameterByName('customerId', search) || '';
        const selectedEmail = getParameterByName('selectedEmail', search) || '';
        if (customerId && selectedEmail) {
          setCustomerData({
            customerId,
            selectedEmail,
          });
        }
        if (account) {
          setMailAccount(account);
        }
        if (hash && hash.length > 0) {
          setStartData(res => ({
            ...res,
            contactList: hash.replace('#', '').split(','),
          }));
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
      loggerApi.track('readMailCombPageInitOb', { data: ev });
      const { eventData, _account } = ev;
      if (eventData) {
        const { list, fromAccount, customerId, selectedEmail } = eventData;
        if (list?.length) {
          setStartData(_startData => ({
            needRefresh: true,
            contactList: _startData.contactList.concat(list as string[]),
            status: 'ALL',
          }));
        }
        if (customerId && selectedEmail) {
          setCustomerData({
            customerId,
            selectedEmail,
          });
        }
        // _account兜底
        const account = fromAccount || _account;
        account && setMailAccount(account);
        console.log(`**** setup init data :${JSON.stringify(startData)}`);
      }
    },
  });

  const visibleCustomer = process.env.BUILD_ISEDM && mailAccount && customerData !== null;
  return (
    <>
      <SiriusLayout.ContainerLayout isLogin={false} className="extheme">
        {!visibleCustomer && mailAccount && <MailRelatedBox mailAccount={mailAccount} startData={startData} setStartData={setStartData} />}
        {visibleCustomer && (
          <CustomerMailRelatedBox mailAccount={mailAccount} customerId={customerData.customerId} selectedCustomerContact={customerData.selectedEmail} />
        )}
      </SiriusLayout.ContainerLayout>
    </>
  );
};

export default ReadMailPage;
console.info('---------------------end read mail page------------------');
