import React, { useEffect, useState, useRef } from 'react';
import { Progress } from 'antd';
import styles from './fetching.module.scss';
import { getIn18Text } from 'api';
interface FetchingProps {}
const Fetching: React.FC<FetchingProps> = props => {
  const [progressNum, setProgressNum] = useState<number>(0); // 进度值
  const [reqId, setReqId] = useState<number>(0);
  const progressNumRef = useRef<number>(progressNum);
  progressNumRef.current = progressNum;
  // 进度增加
  const progressAdd = () => {
    if (progressNumRef.current < 90) {
      setProgressNum(progressNumRef.current + 1);
      window.requestAnimationFrame(progressAdd);
    } else {
      window.cancelAnimationFrame(reqId);
    }
  };
  // 开始进度
  const progressStart = () => {
    const rafId = window.requestAnimationFrame(progressAdd);
    setReqId(rafId);
  };
  useEffect(() => {
    progressStart();
  }, []);
  return (
    <div className={styles.fetching}>
      <div className={styles.percent}>{progressNum}%</div>
      <Progress className={styles.progress} percent={progressNum} showInfo={false} strokeColor={'#386EE7'} strokeWidth={8} trailColor={'rgba(38, 42, 51, 0.16)'} />
      <p className={styles.fetchingIntro}>{getIn18Text('JIANCEDAOJIAOCHANG')}</p>
    </div>
  );
};
export default Fetching;
