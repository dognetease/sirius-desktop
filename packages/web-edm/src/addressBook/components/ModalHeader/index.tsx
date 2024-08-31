import React from 'react';
import styles from './index.module.scss';
import { ReactComponent as CloseIcon } from '../../assets/modalClose.svg';

export interface IModalHeaderProps {
  title: string | React.ReactNode;
  onClick: () => void;
}

export function ModalHeader(props: IModalHeaderProps) {
  const { title, onClick } = props;
  return (
    <div className={styles.header}>
      {title}
      <div className={styles.headerClose}>
        <CloseIcon onClick={onClick} />
      </div>
    </div>
  );
}
