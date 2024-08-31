import React, { useEffect } from 'react';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import styles from './footer.module.scss';
import { getIn18Text } from 'api';

export interface FooterProps {
  onCheck?(check: boolean): void;
  width: number;
  onCancel(): void;
  totalCount: number;
  checkedCount: number;
}
const ContactFooter: React.FC<FooterProps> = props => {
  const { totalCount, checkedCount, onCheck, width, onCancel } = props;
  const checked = Boolean(totalCount && checkedCount && totalCount === checkedCount);
  const isIndeterminate = !checked && !!checkedCount;
  useEffect(() => {
    checkedCount === 0 && onCancel();
  }, [checkedCount]);
  return (
    <>
      <div className={styles.footer} style={{ width }}>
        <div className={styles.checkBox}>
          <Checkbox
            indeterminate={isIndeterminate}
            onChange={() => {
              if (onCheck) {
                onCheck(!checked);
              }
            }}
            checked={checked}
          >
            {`${getIn18Text('YIXUANZE')}（${checkedCount}）`}
          </Checkbox>
        </div>
        <div className={styles.operations}>
          <span className={styles.cancelBtn} onClick={onCancel}>
            {getIn18Text('QUXIAO')}
          </span>
        </div>
      </div>
    </>
  );
};
export default ContactFooter;
