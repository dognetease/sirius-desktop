import React, { FC } from 'react';
import NoDataImg from '@/images/icons/edm/yingxiao/no-data.png';
import styles from './Nodata.module.scss';
import { getIn18Text } from 'api';

export const NoData: FC = props => {
  return (
    <div className={styles.nodata}>
      <img src={NoDataImg} alt="" />
      <span className={styles.info}>{getIn18Text('ZANWUSHUJU')}</span>
    </div>
  );
};
