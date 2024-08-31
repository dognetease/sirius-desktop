import React from 'react';
import { PageProps } from 'gatsby';
import { api, configKeyStore, locationHelper, getIn18Text } from 'api';
import { useEventObserver } from '@web-common/hooks/useEventObserver';
import Schedule from '@web-schedule/schedule';
import SiriusLayout from '@/layouts';
import '@/styles/global.scss';
// import Config from '../components/Layout/MailConfig/menuIcon';
import IndexPageWrapper from '@/layouts/Main/IndexWrapper';

const storeApi = api.getDataStoreApi();
const sysApi = api.getSystemApi();
const { scheduleTabOpenInWindow } = configKeyStore;
if (sysApi.isElectron() && locationHelper.testPathMatch('/schedule/')) {
  sysApi.addWindowHookConf({
    hooksName: 'onBeforeClose',
    hookObjName: 'schedulePageOb',
    intercept: true,
    observerWinId: -1,
  });
}
console.info('---------------------from schedule index page------------------');
const IndexPage: React.FC<PageProps> = pageProps => {
  useEventObserver('electronClose', {
    name: 'scheduleIndepenedWindowCloseOb',
    func: () => {
      storeApi.put(scheduleTabOpenInWindow?.keyStr || '', String(false)).then(() => {
        sysApi.closeWindow();
      });
    },
  });
  return (
    <IndexPageWrapper>
      <SiriusLayout.ContainerLayout pageProps={pageProps} name="schedule" hideSideBar>
        <Schedule name="schedule" tag={getIn18Text('RILI')} />
      </SiriusLayout.ContainerLayout>
    </IndexPageWrapper>
  );
};
export default IndexPage;
console.info('---------------------end schedule index page------------------');
