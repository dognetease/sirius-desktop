import { getIn18Text } from 'api';
import React from 'react';
import { ReactComponent as FbEmpty } from '@/images/icons/edm/fb-empty.svg';
import styles from './index.module.scss';

export const EmptyPublicPage = () => {
  return (
    <div className={styles.fbEmpty}>
      <FbEmpty />
      <div className={styles.content}>{getIn18Text('ZANWUNEIRONG')}</div>
      <div className={styles.desc}>
        {getIn18Text('NINHAIMEIYOUGONGGONGZHU')}
        <span>{getIn18Text('DIANJIZHELI')}</span>
        {getIn18Text('KUAIQUCHUANGJIANBA')}
      </div>
    </div>
  );
};
