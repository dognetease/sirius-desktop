import React from 'react';
import styles from './morelinkcontent.module.scss';
import { getIn18Text } from 'api';

export const renderMoreLinkContent = ({ num }) => <span className={styles.morelink}>{`${getIn18Text('HAIYOU')}${num}${getIn18Text('GERICHENG')}`}</span>;
