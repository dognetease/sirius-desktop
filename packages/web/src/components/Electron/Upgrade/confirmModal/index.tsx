import React from 'react';
import { getIn18Text } from 'api';
import Button from '@web-common/components/UI/Button';
import { TongyongCuowutishiMian } from '@sirius/icons';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import styles from './index.module.scss';

interface Props {
  visible: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const UpgradeConfirmModal: React.FC<Props> = ({ visible, loading, onConfirm, onCancel }) => (
  <SiriusModal visible={visible} width={400} maskClosable={false} closable={false} keyboard={false} footer={null} destroyOnClose>
    <div className={styles.confirmModal}>
      <div className={styles.title}>
        <TongyongCuowutishiMian wrapClassName={styles.titleIconWrapper} className={styles.titleIcon} />
        <span className={styles.titleText}>{getIn18Text('WUANZHAUNGQUANXIAN')}</span>
      </div>
      <div className={styles.content}>{getIn18Text('FAXIANXINBANBEN')}</div>
      <div className={styles.footer}>
        <Button loading={loading} disabled={loading} btnType="minorLine" onClick={onConfirm}>
          {getIn18Text('JIXUGENGXIN')}
        </Button>
        <Button disabled={loading} btnType="primary" onClick={onCancel}>
          {getIn18Text('ZHIDAOLE')}
        </Button>
      </div>
    </div>
  </SiriusModal>
);
export default UpgradeConfirmModal;
