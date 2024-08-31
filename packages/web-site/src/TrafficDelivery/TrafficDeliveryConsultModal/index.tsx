import React from 'react';
import styles from './index.module.scss';
import { ReactComponent as CloseIcon } from '@web-site/images/close-contact.svg';
import SiriusModal from '@web-site/../../web-common/src/components/UI/Modal/SiriusModal';

export interface TrafficDeliveryConsultModalProps {
  onClose?: () => void;
  open: boolean;
}

const TrafficDeliveryConsultModal: React.FC<TrafficDeliveryConsultModalProps> = props => {
  const onCancel = () => {
    props.onClose && props.onClose();
  };

  return (
    <SiriusModal
      className={styles.trafficDeliveryConsultModal}
      title={null}
      footer={null}
      visible={props.open}
      closeIcon={null}
      maskClosable={false}
      centered={true}
      onCancel={onCancel}
    >
      <div className={styles.container}>
        <div className={styles.title}>扫码添加企业微信</div>
        <div className={styles.subTitle}>品牌建设顾问为您1v1提供咨询服务</div>
        <div className={styles.qrCode}></div>
        <div className={styles.closeIcon} onClick={onCancel}>
          <CloseIcon />
        </div>
      </div>
    </SiriusModal>
  );
};

export default TrafficDeliveryConsultModal;
