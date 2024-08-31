import * as React from 'react';
import { PageProps } from 'gatsby';
import SiriusLayout from '../layouts';
import Upgrade from '../components/Electron/Upgrade';
import { getIn18Text } from 'api';
const ContactSyncPage: React.FC<PageProps> = props => (
  <SiriusLayout.ContainerLayout isLogin showMin={false} showMax={false}>
    <div>{getIn18Text('TONGXUNLUTONGBU')}</div>
  </SiriusLayout.ContainerLayout>
);
export default ContactSyncPage;
