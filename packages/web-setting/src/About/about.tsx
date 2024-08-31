import React from 'react';
import './about.scss';
import { apiHolder, inWindow } from 'api';
import { navigate } from 'gatsby';
import { ProductProtocols } from '@web-common/utils/constant';
import logo from '@/images/electron/logo.svg';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi();
interface Props {
  isVisible?: boolean;
}
const About: React.FC<Props> = props => {
  const { isVisible = false } = props;
  const openProtocol = (type: string) => {
    let url = '';
    if (type === 'service') {
      url = ProductProtocols.agreement;
    } else if (type === 'legal') {
      url = ProductProtocols.privacy;
    } else if (type === 'icp') {
      url = ProductProtocols.ICP;
    }
    systemApi.openNewWindow(url);
  };
  return (
    <div className="about-setting-container" hidden={!isVisible}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div className="config-title">
        <div className="config-title-name">{getIn18Text('GUANYU')}</div>
        <div onClick={() => navigate(-1)} className="config-title-icon" />
      </div>
      <div className="about-wrap">
        <div className="version">
          {getIn18Text('BANBENHAO\uFF1A')}
          {inWindow() && window.siriusVersion}
        </div>
        <div className="protocol-wrap">
          <span onClick={() => openProtocol('service')}>{getIn18Text('FUWUTIAOKUAN')}</span>
          <span className="protocal-span">{getIn18Text('YU')}</span>
          <span onClick={() => openProtocol('legal')}>{getIn18Text('YINSIZHENGCE')}</span>
        </div>
        <div className="footer-wrap">
          <span onClick={() => openProtocol('icp')}>{getIn18Text('ICPBEIANH：ZICPB2020041961H-4A&GT;')}</span>
        </div>
      </div>
    </div>
  );
};
export default About;
