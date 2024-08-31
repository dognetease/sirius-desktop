import React from 'react';
// import { Helmet } from 'react-helmet';
// import { withPrefix } from 'gatsby';
import { api, SystemApi } from 'api';
import Launch from '@web-account/Launch/launch';
import Banner from '@web-account/Login/banner';
import BannerWaimao from '@web-account/Login/bannerWaimao';

import SiriusLayout from '../layouts';
import styles from '../styles/pages/login.module.scss';

const systemApi = api.getSystemApi() as SystemApi;

console.info('---------------------from launch page------------------');

const LaunchPage = () => (
  <SiriusLayout.ContainerLayout isLogin from="launch">
    <SiriusLayout.LoginLayout>
      <div className={styles.loginPage}>
        <div className={styles.loginPageLeft}>{systemApi.inEdm() ? <BannerWaimao /> : <Banner />}</div>
        <div className={styles.loginPageRight}>
          <Launch from="launch" />
        </div>
      </div>
    </SiriusLayout.LoginLayout>
  </SiriusLayout.ContainerLayout>
);

export default LaunchPage;

console.info('---------------------end launch page------------------');
