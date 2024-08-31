import React from 'react';
import { ReactComponent as LoadingIcon } from '../../images/loading.svg';
import styles from './index.module.scss';

export default function Loading() {
  return (
    <div className={styles.loading}>
      <LoadingIcon />
      <div>正在加载中，请稍等...</div>
    </div>
  );
}
