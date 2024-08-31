import React from 'react';
import styles from './index.module.scss';

// import Modal from '@web-common/components/UI/SiriusModal';
import Modal from '@lingxi-common-component/sirius-ui/SiriusModal';
import { ReactComponent as RightArrowIcon } from '@web-site/images/right-arrow.svg';
import IpipImg from '@web-site/images/right-card/ipip.png';
import WaitingImg from '@web-site/images/right-card/waiting.png';
import PageSpeedImg from '@web-site/images/right-card/pagespeed.png';
import { getIn18Text } from 'api';

interface SemFormModalParams {
  visible: boolean;
  onClose: () => void;
}

export const ToolboxModal: React.FC<SemFormModalParams> = props => {
  return (
    <Modal
      visible={props.visible}
      width={512}
      title={getIn18Text('WAIMAOSHIYONGGONGJUXIANG')}
      maskClosable={false}
      className={styles.toolbox}
      destroyOnClose={true}
      onCancel={props.onClose}
      footer={null}
      headerBottomLine={false}
      isGlobal
    >
      <div className={styles.toolbox}>
        <a className={styles.toolboxCard} href="https://tools.ipip.net/ping.php" target="_blank">
          <img src={IpipImg} />
          <div className={styles.toolboxCardCenter}>
            <div className={styles.toolboxCardItem1}>{getIn18Text('MONIHAIWAIFANGWEN')}</div>
            <div className={styles.toolboxCardItem2}>{getIn18Text('YANZHENGHAIWAIFANGWENSUDU')}</div>
          </div>
          <RightArrowIcon />
        </a>
        <a className={styles.toolboxCard}>
          <img src={WaitingImg} />
          <div className={styles.toolboxCardCenter}>
            <div className={styles.toolboxCardItem1}>{getIn18Text('JINGQINGQIDAI')}</div>
            <div className={styles.toolboxCardItem2}>{getIn18Text('SITE_GENGDUOGONGNENGJIJIANGSHANGXIAN')}</div>
          </div>
        </a>
        {/* <a className={styles.toolboxCard} href="https://pagespeed.web.dev" target="_blank">
          <img src={PageSpeedImg} />
          <div className={styles.toolboxCardCenter}>
            <div className={styles.toolboxCardItem1}>{getIn18Text('GUGEZHANDIANYANZHENG')}</div>
            <div className={styles.toolboxCardItem2}>{getIn18Text('GUANFANGZHANDIANPINGPANBIAOZHUN')}</div>
          </div>
          <RightArrowIcon />
        </a> */}
      </div>
    </Modal>
  );
};
