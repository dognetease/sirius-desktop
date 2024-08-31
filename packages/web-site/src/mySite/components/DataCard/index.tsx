import React from 'react';
import moment from 'moment';
import { ReactComponent as SwordIcon } from '../../../images/sword.svg';
import { ReactComponent as RedIcon } from '../../../images/red.svg';
import { ReactComponent as GreenIcon } from '../../../images/green.svg';
import styles from './index.module.scss';
import { getIn18Text } from 'api';

interface DataCardprops {
  goStat?: () => void;
  browseCount: number;
  browseProportion: string;
  submitCount: number;
  submitCountProportion: string;
}

export const DataCard: React.FC<DataCardprops> = props => {
  const { goStat, browseCount, browseProportion, submitCount, submitCountProportion } = props;

  // 同比类名
  const browseClass = Number(browseProportion) > 0 ? styles.red : Number(browseProportion) === 0 ? styles.grey : styles.green;
  const submitClass = Number(submitCountProportion) > 0 ? styles.red : Number(submitCountProportion) === 0 ? styles.grey : styles.green;

  return (
    <div className={styles.dataCard}>
      <div className={styles.dataBlock}>
        <div className={styles.inner}>
          <span className={styles.title}>今日浏览数:</span>
          <span className={styles.number}>{browseCount}</span>
          <span className={styles.detail}>
            {getIn18Text('TONGBI')}
            <span className={browseClass}>{browseProportion}%</span>
            {Number(browseProportion) > 0 ? <RedIcon /> : Number(browseProportion) === 0 ? null : <GreenIcon />}
          </span>
        </div>
        <div className={styles.inner}>
          <span className={styles.title}>今日留资客户数:</span>
          <span className={styles.number}>{submitCount}</span>
          <span className={styles.detail}>
            {getIn18Text('TONGBI')}
            <span className={submitClass}>{submitCountProportion}%</span>
            {Number(submitCountProportion) > 0 ? <RedIcon /> : Number(submitCountProportion) === 0 ? null : <GreenIcon />}
          </span>
        </div>
        <div className={styles.goStat}>
          <a className={styles.link} onClick={goStat}>
            {getIn18Text('XIANGQING')}
          </a>
        </div>
      </div>
    </div>
  );
};
