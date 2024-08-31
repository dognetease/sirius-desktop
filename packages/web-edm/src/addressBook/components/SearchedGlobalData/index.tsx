import React from 'react';
import styles from './index.module.scss';
import { ReactComponent as ExclamationIcon } from '../../assets/exclamation.svg';
import { getIn18Text } from 'api';

export function DisplayGlobalSearchedData(props: { onGoDetail: () => void }) {
  const { onGoDetail } = props;
  return (
    <div className={styles.box}>
      <div style={{ height: 20 }}>
        <ExclamationIcon />
      </div>
      <span className={styles.boxText}>{getIn18Text('ZAIQUANQIUSOUZHONGZHAODAODUIYINGLIANXIRENJIQIGONGSIXINXI，CHAKANXIANGQING')}</span>
      <span onClick={onGoDetail} className={styles.boxLink}>
        {getIn18Text('CHAKANXIANGQING1')}
      </span>
    </div>
  );
}
