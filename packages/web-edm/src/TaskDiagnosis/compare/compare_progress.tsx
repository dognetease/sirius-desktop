import React from 'react';
import { Progress } from 'antd';
import styles from './compare.module.scss';

export interface CompareProgressProps {
  title: string;
  value: { intro: string; percent: number; strokeColor: string | { from: string; to: string } }[];
}

const CompareProgress = (props: CompareProgressProps) => {
  const { title, value } = props;

  return (
    <div className={styles.progressWrapper}>
      <p className={styles.title}>
        <span className={styles.line}></span>
        {title}
      </p>
      <div className={styles.progressList}>
        {value.map(({ intro, percent, strokeColor }) => {
          return (
            <div className={styles.progressItem}>
              <p className={styles.intro}>{intro}</p>
              <Progress
                percent={percent}
                strokeColor={strokeColor}
                trailColor="#F0F2F7"
                strokeWidth={12}
                strokeLinecap="square"
                className={styles.progress}
                format={percent => <span className={styles.progressFormat}>{percent}%</span>}
              />
            </div>
          );
        })}
        <p
          className={styles.line}
          style={{
            height: 60,
          }}
        ></p>
      </div>
    </div>
  );
};

export default CompareProgress;
