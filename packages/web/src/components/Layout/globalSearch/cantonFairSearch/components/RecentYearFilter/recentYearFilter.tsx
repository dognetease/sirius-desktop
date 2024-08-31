import classNames from 'classnames';
import React from 'react';
import { getIn18Text } from 'api';
import styles from './recentyearfilter.module.scss';
import { CantonFairRecentYear } from '../../constants';

interface ContomFairRecentYearFilterProps {
  value?: number[];
  onChange?(v: number[]): void;
  rootKey: string;
}

const recentYearMap: Array<{
  label: string;
  value: number;
}> = new Array(12).fill(CantonFairRecentYear).map((lastedYear, index) => ({
  label: `${lastedYear - index}`,
  value: lastedYear - index,
}));

const ContomFairRecentYearFilter: React.FC<ContomFairRecentYearFilterProps> = ({ value, onChange, rootKey }) => {
  const handleToggle = (v: number) => {
    const set = new Set(value);
    if (set.has(v)) {
      set.delete(v);
    } else {
      set.add(v);
    }
    onChange?.(Array.from(set));
  };
  const clearVal = () => {
    onChange?.([]);
  };
  return (
    <div className={styles.container}>
      <span className={styles.title} style={{ color: '#545A6E', fontWeight: 'normal' }}>
        {getIn18Text('CANZHANSHIJIAN')}
      </span>
      <div className={styles.listWrapper}>
        {rootKey !== 'all' && (
          <span
            onClick={clearVal}
            className={classNames(styles.label, {
              [styles.labelChecked]: !value || value.length === 0,
            })}
          >
            {getIn18Text('BUXIAN')}
          </span>
        )}
        {recentYearMap.map(({ value: thisValue, label }) => (
          <span
            key={thisValue}
            onClick={() => {
              handleToggle(thisValue);
            }}
            className={classNames(styles.label, {
              [styles.labelChecked]: value?.includes(thisValue),
            })}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ContomFairRecentYearFilter;
