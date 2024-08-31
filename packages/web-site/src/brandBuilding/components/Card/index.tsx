import React from 'react';
import styles from './index.module.scss';

interface Props {
  title: string;
  ops?: React.ReactNode;
  children: React.ReactNode;
}

export const Card = (props: Props) => {
  const { title, ops, children } = props;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.line}></div>
        <div className={styles.title}>{title}</div>
        {ops ? <div>{ops}</div> : null}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
};
