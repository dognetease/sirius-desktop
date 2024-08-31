import React from 'react';
import { Modal } from 'antd';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import styles from './confirmModal.module.scss';
import { getIn18Text } from 'api';

interface PopconfirmProps {
  showConfirm: boolean;
  setShowConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  handleConfirm: () => void;
}
/** 删除二次确认弹窗 */
const Popconfirm = (props: PopconfirmProps) => {
  const { showConfirm, setShowConfirm, handleConfirm } = props;
  return (
    <Modal width={400} centered={true} title={null} closable={false} visible={showConfirm} footer={null}>
      <p className={styles.confirmTitle}>
        <ExclamationCircleOutlined style={{ color: '#F74F4F', marginRight: '8px' }} />
        {getIn18Text('QUEDINGYAOFANGQI')}
      </p>
      <p className={styles.confirmBtn}>
        <span
          onClick={() => {
            setShowConfirm(false);
          }}
        >
          {getIn18Text('QUXIAO')}
        </span>
        <span onClick={handleConfirm}>{getIn18Text('QUEDING')}</span>
      </p>
    </Modal>
  );
};
export default Popconfirm;
