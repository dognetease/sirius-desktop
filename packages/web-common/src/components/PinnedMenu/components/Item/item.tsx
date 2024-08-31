import React from 'react';
import styles from './item.module.scss';
import { ReactComponent as AddIcon } from '../../icons/add.svg';
import { ReactComponent as SubIcon } from '../../icons/sub.svg';

interface IItemProps {
  id: string;
  label: string;
  type: 'add' | 'sub';
  onSub?: (id: string) => void;
  onAdd?: (id: string) => void;
}

export default function (props: IItemProps) {
  const { label, type, id, onSub, onAdd } = props;
  const onItemClick = () => {
    if (type === 'add' && onAdd) {
      onAdd(id);
    }
    if (type === 'sub' && onSub) {
      onSub(id);
    }
  };
  const iconJSX = type === 'add' ? <AddIcon /> : <SubIcon />;
  return (
    <div className={styles.item}>
      <div className={styles.label}>{label}</div>
      <div onClick={onItemClick} className={styles.icon}>
        {iconJSX}
      </div>
    </div>
  );
}
