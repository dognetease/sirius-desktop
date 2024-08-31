import React from 'react';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import styles from './delete_confirm.module.scss';
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
    <div className={styles.mailTemplateAbandon} hidden={!showConfirm}>
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
    </div>
  );
};
export default Popconfirm;
