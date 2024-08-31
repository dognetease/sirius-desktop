import React from 'react';
import { ReportCard } from '../ReportCard';
import styles from './index.module.scss';

export const ManageTab: React.FC<{}> = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <ReportCard type="daily" editable />
      </div>
      <div className={styles.card}>
        <ReportCard type="weekly" editable />
      </div>
    </div>
  );
};
