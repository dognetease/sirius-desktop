import React, { FC } from 'react';
import { Modal } from 'antd';

import styles from './DoubleTrackWrite.module.scss';

export const DoubleTrackWrite: FC<{
  header: JSX.Element;
  footer: JSX.Element;
  visible: boolean;
  className?: string;
}> = props => {
  const { children, className, footer, header, visible } = props;

  return (
    <div className={`${styles.modalWrapper} ${className ?? ''}`} hidden={!visible}>
      {header}
      <div className={styles.content}>{children}</div>
      <div className={styles.footer}>{footer}</div>
    </div>
  );
};
