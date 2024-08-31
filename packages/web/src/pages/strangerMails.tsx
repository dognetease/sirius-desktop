import React, { useEffect } from 'react';
import { PageProps } from 'gatsby';
// @ts-ignore
import { inWindow, apiHolder, apis, MailApi, getIn18Text } from 'api';
import { safeDecodeURIComponent } from '@web-common/utils/utils';
import '../styles/global.scss';
import StrangerMailsBox from '@web-mail/strangerMailsBox/strangerMailsBox';
import { useCommonErrorEvent } from '@web-common/hooks/useEventObserver';
import listenWriteMail from '@web-mail/components/listenWriteMail';
import { useAppDispatch } from '@web-common/state/createStore';
import SiriusLayout from '../layouts';
import PageContentLayout from '@/layouts/Main/pageContentLayout';

const writeToPattern = /writeMailToContact=([0-9a-zA-Z%_#@\-.]+)/i;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const eventApi = apiHolder.api.getEventApi();
console.info('---------------------from index page------------------');
interface Props {
  title: string;
}
const StrangerMailsPage: React.FC<PageProps & Props> = ({ title }) => {
  const dispatch = useAppDispatch();
  // 设置标题
  useEffect(() => {
    inWindow() && (window.document.title = title || getIn18Text('BIAOJIMOSHENGFA11'));
  }, [title]);
  useEffect(() => {
    const eventId = listenWriteMail(dispatch);
    if (inWindow() && window.location.hash && writeToPattern.test(window.location.hash)) {
      const exec = writeToPattern.exec(window.location.hash);
      if (exec && exec[1]) {
        const writeTo = safeDecodeURIComponent(exec[1]);
        mailApi.doWriteMailToContact([writeTo]);
      }
    }
    return () => {
      eventApi.unregisterSysEventObserver('writeLatter', eventId);
    };
  }, []);
  useCommonErrorEvent('strangerMailsCommonErrorOb', ev => {
    console.log('strangerMailsCommonErrorOb', ev);
  });
  return (
    <>
      <SiriusLayout.ContainerLayout isLogin={false}>
        <StrangerMailsBox />
      </SiriusLayout.ContainerLayout>
    </>
  );
};
export default StrangerMailsPage;
console.info('---------------------end stranger mails page------------------');
