import React, { useCallback, useEffect, useState } from 'react';
import styles from './netwatcher.module.scss';
import { inWindow } from 'api';
import { getIn18Text } from 'api';
export interface NetWatcherProps {
  style: object;
}
export const useNetStatus = () => {
  const [online, setOnline] = useState<boolean>(inWindow() ? window.navigator.onLine : true);
  const changeNetStatusOnline = useCallback(() => {
    setOnline(!0);
  }, []);
  const changeNetStatusOffline = useCallback(() => {
    setOnline(false);
  }, []);
  useEffect(() => {
    window.addEventListener('online', changeNetStatusOnline);
    window.addEventListener('offline', changeNetStatusOffline);
    return () => {
      window.removeEventListener('online', changeNetStatusOnline);
      window.removeEventListener('offline', changeNetStatusOffline);
    };
  }, [changeNetStatusOffline, changeNetStatusOnline]);
  return online;
};
const NetWatcher: React.FC<NetWatcherProps> = ({ children, style }) => {
  const online = useNetStatus();
  if (online) {
    return <>{children}</>;
  }
  return (
    <div className={styles.offlineGuardWrap} style={style}>
      <div className={styles.content}>
        <div className={styles.bgImg} />
        <div className={styles.tip}>{getIn18Text('AIYADUANWANG')}</div>
        {/* <div className={styles.retry} onClick={()=>{handleRetry?handleRetry():''}}>重试</div> */}
      </div>
    </div>
  );
};
export default NetWatcher;
