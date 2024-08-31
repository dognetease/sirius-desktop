import React from 'react';
import styles from './popconfirm.module.scss';
import { getIn18Text } from 'api';
interface PopconfirmProps {
  setShowDeletePop: React.Dispatch<React.SetStateAction<boolean>>;
  handleDelete: () => void;
}
/** 删除二次确认弹窗 */
const Popconfirm = (props: PopconfirmProps) => {
  const { setShowDeletePop, handleDelete } = props;
  return (
    <div className={styles.mailTemplateDeleteConfirmBox}>
      <p className={styles.confirmTitle}>{getIn18Text('QUEDINGYAOSHANCHU13')}</p>
      <p className={styles.confirmBtn}>
        <span
          onClick={() => {
            setShowDeletePop(false);
          }}
        >
          {getIn18Text('QUXIAO')}
        </span>
        <span onClick={handleDelete}>{getIn18Text('SHANCHU')}</span>
      </p>
    </div>
  );
};
export default Popconfirm;
