import React from 'react';
import styles from './filterList.module.scss';
import { ReactComponent as RemoveIcon } from '@/images/icons/close_modal.svg';
import { getIn18Text } from 'api';
export const FilterResultList = (props: {
  hideLabel?: boolean;
  filters: {
    name: string;
    id: string;
    content: string;
  }[];
  onClear: (type: string) => void;
}) => {
  const { filters = [], onClear, hideLabel = false } = props;
  return (
    <div className={styles.filterResult}>
      <div hidden={hideLabel} className={styles.label}>
        {getIn18Text('GUOJIA/DEQU')}
      </div>
      <div className={styles.box}>
        {filters.map(({ name, id, content }) => (
          <div className={styles.wrapper} key={id}>
            <span className={styles.tag}>{name}</span>
            <span className={styles.content}>{content}</span>
            <RemoveIcon onClick={() => onClear(id)} />
          </div>
        ))}
      </div>
    </div>
  );
};
