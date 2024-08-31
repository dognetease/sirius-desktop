import React from 'react';
import LikeOutlined from '@ant-design/icons/LikeOutlined';
import DislikeOutlined from '@ant-design/icons/DislikeOutlined';
import styles from './index.module.scss';
import { getIn18Text } from 'api';
interface NpsLikeProps {
  onFeedback: (score: number, str: string) => void;
}
export const NpsLike: React.FC<NpsLikeProps> = ({ onFeedback }) => {
  function onClick(desc: string) {
    onFeedback(desc === 'good' ? 10 : 0, JSON.stringify({ like: desc === 'good' }));
  }
  return (
    <div className={styles.npsLikeWrapper}>
      <div className={styles.npsLikeBtn} onClick={() => onClick('good')}>
        <LikeOutlined />
        <div className={styles.npsLikeText}>{getIn18Text('HAO')}</div>
      </div>
      <div className={styles.npsLikeBtn} onClick={() => onClick('bad')}>
        <DislikeOutlined />
        <div className={styles.npsLikeText}>{getIn18Text('CHA')}</div>
      </div>
    </div>
  );
};
