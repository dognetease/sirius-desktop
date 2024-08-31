import React from 'react';
import { Button } from 'antd';
import Modal from '@web-common/components/UI/Modal/SiriusModal';
import { getTransText } from '@/components/util/translate';
import { ReactComponent as FbOutTips } from '@/images/icons/edm/fb-out-tips.svg';
import styles from './index.module.scss';

interface IProps {
  visible: boolean;
  onCancel: () => void;
  onOk: () => void;
  loading: boolean;
}

export const OffsiteModal: React.FC<IProps> = props => {
  const { visible, onCancel, onOk, loading } = props;
  return (
    <Modal visible={visible} onCancel={onCancel} onOk={onOk} footer={null} closable={false} width={400}>
      <div className={styles.container}>
        <div className={styles.title}>
          <FbOutTips />
          <span>{getTransText('WANGYIWAIMAOTONGWENXIN')}</span>
        </div>
        <div className={styles.desc}>{getTransText('YEMIANJIANGTIAOZHUAN')}</div>
        <div className={styles.btn}>
          <Button className={styles.cancelAction} onClick={onCancel}>
            {getTransText('QUXIAO')}
          </Button>
          <Button className={styles.doAction} type="primary" loading={loading} onClick={onOk}>
            {getTransText('LIJITIAOZHUAN')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
