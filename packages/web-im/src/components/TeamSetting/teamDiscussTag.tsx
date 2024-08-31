import React from 'react';
import styles from './teamDiscussTag.module.scss';
import { getIn18Text } from 'api';
interface TeamDiscussTagProps {}
export const TeamDiscussTag: React.FC<TeamDiscussTagProps> = props => {
  return <span className={styles.teamDiscussTag}>{getIn18Text('YOUJIANTAOLUN')}</span>;
};
