import React, { useEffect } from 'react';
import { Modal } from 'antd';
import CloseIcon from '@web-common/components/UI/Icons/svgs/CloseMailSvg';
import FeedbackContent from './feedbackContent';
import styles from './feedbackModal.module.scss';

interface FeedBackModalProps {
  visible: boolean;
  cancel: () => void;
}

const FeedbackModal: React.FC<FeedBackModalProps> = props => {
  const { visible, cancel } = props;

  return (
    <Modal visible={visible} centered footer={null} width={800} closeIcon={<CloseIcon />} onCancel={cancel} className={`${styles.feedbackModal} extheme`} destroyOnClose>
      <FeedbackContent cancel={cancel} />
    </Modal>
  );
};

export default FeedbackModal;
