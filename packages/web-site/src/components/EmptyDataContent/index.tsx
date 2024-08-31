import React from 'react';
import EmptyDataImg from '../../images/empty-data.svg';
import styles from './index.module.scss';
import { getIn18Text } from 'api';

export const EmptyDataContent = (props: { style?: React.CSSProperties }) => {
  return (
    <div className={styles.emptyData} style={props.style}>
      <img src={EmptyDataImg} />
      {getIn18Text('ZANWUSHUJU')}
    </div>
  );
};
