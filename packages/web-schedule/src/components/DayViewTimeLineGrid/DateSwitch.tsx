import React from 'react';
import moment from 'moment';
import { DateSwitchProps } from './data';
import styles from './dayviewtimelinegrid.module.scss';
import IconCard from '@web-common/components/UI/IconCard';
import { getIn18Text } from 'api';
const DateSwitch: React.FC<DateSwitchProps> = ({ date, onChange, onClose }) => {
  // 点击今天
  const onToday = () => {
    if (!moment().isSame(date.clone().startOf('day'), 'day')) {
      onChange(moment().startOf('day'));
    }
  };
  const renderClose = () => {
    if (onClose !== undefined) {
      return (
        <span className={styles.headerClose}>
          <IconCard type="close" onClick={onClose} />
        </span>
      );
    }
    return null;
  };
  return (
    <div className={`${styles.header} header`}>
      <button
        type="button"
        onClick={() => {
          onToday();
        }}
        style={{ width: 46 }}
        className={styles.headerBtn}
      >
        {getIn18Text('JINTIAN')}
      </button>
      <button
        type="button"
        onClick={() => {
          onChange(date.clone().subtract(1, 'day'));
        }}
        style={{ width: 28, marginLeft: 16 }}
        className={styles.headerBtn}
      >
        <i className={styles.left} />
      </button>
      <button
        type="button"
        onClick={() => {
          onChange(date.clone().add(1, 'day'));
        }}
        style={{ width: 28, marginLeft: 8 }}
        className={`${styles.headerBtn} headerBtn`}
      >
        <i className={`${styles.right} right`} />
      </button>
      <span className={styles.headerTitle}>{date.format(getIn18Text('NIANYUERIXINGQI'))}</span>
      {renderClose()}
    </div>
  );
};
export default DateSwitch;
