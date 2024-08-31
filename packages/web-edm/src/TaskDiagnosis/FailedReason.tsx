import React, { FC } from 'react';

import { PieMap } from './PieMap';
import styles from './TaskDiagnosis.module.scss';

// 看来UI是没给颜色顺序
const colors = ['#4C6AFF', '#1ACADA', '#FFCA7E', '#FE6B5E', '#6557FF', '#A259FF', '#83B3F7', '#FE9D94'];

export const FailedReason: FC<{
  title: string;
  resultTitle: string;
  bestCount: string;
  currentCount?: number;
  data: Array<{
    value: number;
    name: string;
  }>;
}> = props => {
  const { title, resultTitle, bestCount, currentCount, data } = props;

  return (
    <div className={styles.reasonItem}>
      <div className={styles.reasonItemTitle}>{title}</div>
      <PieMap data={data} />
      <div className={styles.reasonSuggest}>
        <div className={styles.reasonSuggestTop}>
          <div className={styles.reasonIcon}></div>
          <div className={styles.reasonTitle}>{resultTitle}</div>
        </div>
        <div className={styles.reasonSuggestBottom}>
          <div className={styles.bottomItem}>
            <div className={styles.bottomItemLabel}>贵公司：</div>
            <div className={styles.bottomItemCount}>{currentCount ?? '0'}%</div>
          </div>
          <div className={styles.bottomItem}>
            <div className={styles.bottomItemLabel}>优秀企业：</div>
            <div className={styles.bottomItemCount}>{`<${bestCount}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
