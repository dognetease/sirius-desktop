import React from 'react';
import styles from './index.module.scss';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { getIn18Text } from 'api';

interface SeoExampleProps {
  visible: boolean;
  onClose: () => void;
}

export const SeoExample: React.FC<SeoExampleProps> = props => {
  return (
    <Modal
      visible={props.visible}
      getContainer={false}
      width={503}
      closable={false}
      title={null}
      maskClosable={false}
      className={styles.seoExample}
      destroyOnClose={true}
      okText={getIn18Text('ZHIDAOLE')}
      onOk={props.onClose}
      onCancel={props.onClose}
    >
      <img src="https://cowork-storage-public-cdn.lx.netease.com/common/2023/03/08/bdf7521d023b4e6e8caf5dfe66ab6bfc.png" />
    </Modal>
  );
};
