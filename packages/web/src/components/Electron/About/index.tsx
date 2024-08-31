import React, { useState } from 'react';
import './index.scss';
import { anonymousFunction, apiHolder } from 'api';
import { ProductProtocols } from '@web-common/utils/constant';
import logo from '../../../images/electron/logo.svg';
import logoWaimao from '@/images/favicon_edm.png';
import aboutClose from '../../../images/electron/about_close.svg';
import wyLogo from '../../../images/wylogo.png';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi();
const isWebWmEntry = systemApi.isWebWmEntry();

interface Props {
  isVisible: boolean;
  isElectron: boolean;
  // ref?: RefObject<typeof About>
  toggle?: (toggle: anonymousFunction<boolean>) => void;
}
const About: React.FC<Props> = props => {
  const { isElectron, isVisible, toggle } = props;
  const [visible, setVisible] = useState(isVisible);
  const toggleHandle = () => {
    setVisible(!visible);
    return visible;
  };
  if (toggle) toggle(toggleHandle);
  const openProtocol = (type: string) => {
    let url = '';
    if (type === 'service') {
      url = ProductProtocols.agreement;
    } else if (type === 'legal') {
      url = ProductProtocols.privacy;
    }
    systemApi.openNewWindow(url);
  };
  const logoSrc = systemApi.inEdm() ? logoWaimao : logo;
  const productName = systemApi.inEdm() ? getIn18Text('WANGYIWAIMAOTONG') : getIn18Text('WANGYILINGXIBAN');

  return visible ? (
    <div className={`${isWebWmEntry ? 'web-wm-entry' : ''} about-mask ${isElectron ? ' no-mask' : ''}`}>
      <div className="about-container">
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        {isElectron ? null : <img alt="" src={aboutClose} onClick={toggleHandle} className="about-close" />}
        <div className="about-wrap">
          <img src={logoSrc} className="logo" alt="" width="56" />
          <div className="name">{productName}</div>
          <div className="version">
            {getIn18Text('BANBENHAO\uFF1A')}
            {window.siriusVersion}
          </div>
          <div className="protocol-wrap">
            <span onClick={() => openProtocol('service')}>{getIn18Text('FUWUTIAOKUAN')}</span>
            <span onClick={() => openProtocol('legal')}>{getIn18Text('YINSIZHENGCE')}</span>
          </div>

          <div className="footer-wrap">
            <div className="footer-content">
              <img className="about-logo" src={wyLogo} alt="" />
              <div className="about-links">
                163网易免费邮
                <span>|</span>
                188财富邮
                <span>|</span>
                126网易免费邮
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div />
  );
};
export default About;
