import React from 'react';
import { Button, Tag } from 'antd';
import { getTransText } from '@/components/util/translate';

import Intro1 from './images/intro-1.png';
import Intro2 from './images/intro-2.png';
import Intro3 from './images/intro-3.png';
import ExportIcon from './images/export.svg';
import styles from './index.module.scss';

interface Props {}
const IntroExtension: React.FC<Props> = props => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.banner}>
          <div className={styles.text}>
            <h3 className={styles.title}>{getTransText('ANZHUANGWANGYIWAIMAOTONGZHUSHOU')}</h3>
            <ul>
              <li>{getTransText('SHIYONGWhatsAppGOUTONGSHI')}</li>
              <li>{getTransText('GENJUWhatsAppLIANXIREN')}</li>
              <li>{getTransText('TONGBULIAOTIANJILUDAOXIANGQINGYE')}</li>
            </ul>
          </div>
          <img className={styles.picture} src={Intro1} width={245} />
        </div>

        <div className={styles.main}>
          <h3 className={styles.title}>{getTransText('JIERUWhatsAppANZHUANGBUZHOU')}</h3>
          <div className={styles.stepList}>
            <div className={styles.step1}>
              <div>
                <Tag>Step1</Tag>
                {getTransText('WhatsAppZHUSHOUANZHUANGSTEP1')}
              </div>
              <a
                href="https://chrome.google.com/webstore/search/%E7%BD%91%E6%98%93%E5%A4%96%E8%B4%B8%E9%80%9A"
                target="_blank"
                rel="noreferrer"
                style={{ marginTop: 10, display: 'block' }}
              >
                <Button type="primary" className={styles.installBtn}>
                  {getTransText('WhatsAppZHUSHOUANZHUANGSTEP1_1')}
                  <img className={styles.export} src={ExportIcon} />
                </Button>
              </a>
            </div>
            <div className={styles.step2}>
              <div>
                <Tag>Step2</Tag>
                {getTransText('WhatsAppZHUSHOUANZHUANGSTEP2')}
              </div>
              <img className={styles.picture2} src={Intro2} width={185} />
            </div>
            <div className={styles.step3}>
              <div>
                <Tag>Step3</Tag>
                {getTransText('WhatsAppZHUSHOUANZHUANGSTEP3')}
              </div>
              <img className={styles.picture3} src={Intro3} width={280} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroExtension;
