import React, { useEffect, useState, useCallback } from 'react';
import styles from './netwatcher.module.scss';
import { inWindow } from 'api';
import { getIn18Text } from 'api';
export interface NetWatcherProps {}
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
const NetWatcher: React.FC<NetWatcherProps> = ({ children }) => {
  const online = useNetStatus();
  if (online) {
    return null;
  }
  if (children) {
    return <>{children}</>;
  }
  return (
    <div className={styles.netwatcherWrapper} data-test-id="mail-net-error-bar">
      <span className={styles.wifiIcon} />
      <span>{getIn18Text('WANGLUOYICHANG~')}</span>
    </div>
  );
};
export default NetWatcher;
