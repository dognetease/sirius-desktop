import React from 'react';
import { getIn18Text } from 'api';
import { ReactComponent as NoDataIcon } from '@/images/no_data.svg';
import styles from './index.module.scss';

const NoData: React.FC<any> = () => (
  <div className={styles.noData}>
    <NoDataIcon />
    <span className={styles.noDataText}>{getIn18Text('ZANWUXUNPAN')}</span>
  </div>
);

export default NoData;
