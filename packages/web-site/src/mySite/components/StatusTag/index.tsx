import React from 'react';
import styles from './style.module.scss';
import { STATUS_ENUM, STATUS_LABEL } from '@web-site/mySite/constants';

const StatusTag = (props: { status: STATUS_ENUM }) => {
  const { status } = props;
  return <span className={status === STATUS_ENUM.ONLINE ? styles.online : styles.offline}>{STATUS_LABEL[status]}</span>;
};

export default StatusTag;
