import * as React from 'react';
import { PageProps } from 'gatsby';
import { Modal } from 'antd';
import { useState } from 'react';
import { apis } from 'api';
import About from '../components/Electron/About';
import SiriusLayout from '../layouts';

console.info('---------------------from about page------------------');
// window.apiPolicies = {};
// window.apiPolicies[apis.mailApiImpl] = {exclude: true};
// window.apiPolicies[apis.pushApiImpl] = {exclude: true};
// window.apiPolicies[apis.updateAppApiImpl] = {exclude: true};
// window.apiPolicies[apis.imApiImpl] = {exclude: true};
// window.apiPolicies[apis.imTeamApiImpl] = {exclude: true};
// window.apiPolicies[apis.contactApiImpl]={exclude:true};
// window.apiPolicies[apis.contactDbImpl]={exclude:true};
const AboutPage: React.FC<PageProps> = props => (
  <SiriusLayout.ContainerLayout isLogin showMax={false} showMin={false}>
    <About isElectron isVisible />
  </SiriusLayout.ContainerLayout>
);

export default AboutPage;
console.info('---------------------end about page------------------');
