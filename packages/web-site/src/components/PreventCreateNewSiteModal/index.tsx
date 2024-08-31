import React from 'react';
import SiriusModal from '@web-site/../../web-common/src/components/UI/Modal/SiriusModal';
import { Button, ModalProps } from 'antd';
import styles from './index.module.scss';
import { ReactComponent as Error } from '../../images/error.svg';

export interface PreventCreateNewSiteModalProps extends ModalProps {
  onFreeConsule?: () => void;
}

const PreventCreateNewSiteModal: React.FC<PreventCreateNewSiteModalProps> = props => {
  const { onFreeConsule = () => {}, ...modalProps } = props;
  return (
    <SiriusModal footer={null} width={400} maskClosable={false} className={styles.preventCreateNewSiteModal} {...modalProps}>
      <div className={styles.title}>
        <div className={styles.errorIcon}>
          <Error />
        </div>
        <span>建站服务数量不足，无法新建站点</span>
      </div>
      <div className={styles.info}>可联系客服或销售增购建站服务</div>
      <div className={styles.buttonRow}>
        <Button className={styles.freeConsuleButton} onClick={onFreeConsule}>
          免费咨询
        </Button>
      </div>
    </SiriusModal>
  );
};

export default PreventCreateNewSiteModal;
