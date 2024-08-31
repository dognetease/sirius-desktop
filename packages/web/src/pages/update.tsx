import * as React from 'react';
import { PageProps } from 'gatsby';
import SiriusLayout from '../layouts';
// import Upgrade from '../components/Electron/Upgrade';

const UpgradePage: React.FC<PageProps> = () => (
  <SiriusLayout.ContainerLayout isLogin showMin={false} showMax={false}>
    {/* <Upgrade /> */}
  </SiriusLayout.ContainerLayout>
);

export default UpgradePage;
