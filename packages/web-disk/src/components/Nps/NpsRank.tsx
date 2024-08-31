import React from 'react';
import styles from './index.module.scss';
import { getIn18Text } from 'api';
interface NpsRankProps {
  levels: number;
  onFeedback: (score: number, str: string) => void;
}
export const NpsRank: React.FC<NpsRankProps> = ({ levels, onFeedback }) => {
  function onClick(level: number) {
    onFeedback(level, JSON.stringify({ score: level }));
  }
  return (
    <div>
      <div className={styles.npsRankCells}>
        {Array(levels + 1)
          .fill(1)
          .map((_, idx) => (
            <div className={styles.npsRankCell} key={`level-${idx}`} onClick={() => onClick(idx)}>
              {idx}
            </div>
          ))}
      </div>
      <div className={styles.npsRankDescs}>
        <div className={styles.npsRankDesc}>{getIn18Text('WANQUANBUKENENG')}</div>
        <div className={styles.npsRankDesc}>{getIn18Text('FEICHANGKENENG')}</div>
      </div>
    </div>
  );
};
