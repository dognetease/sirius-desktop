import React from 'react';
import styles from './empty.module.scss';
import { getIn18Text } from 'api';
interface EmptyProps {
  emptyText?: string;
}
const Empty: React.FC<EmptyProps> = ({ emptyText }) => (
  <div className={styles.empty}>
    <div className="sirius-empty sirius-empty-doc" />
    <span className={styles.emptyText}>{emptyText || getIn18Text('ZANWUWENJIAN')}</span>
  </div>
);
export default Empty;
