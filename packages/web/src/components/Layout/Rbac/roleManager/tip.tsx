import React, { useState } from 'react';
import { ReactComponent as AlertError } from '@/images/icons/edm/alert-error.svg';
import { ReactComponent as AlertClose } from '@/images/icons/edm/alert-close.svg';
import style from './index.module.scss';

export const RoleMessageTip: React.FC<{}> = ({ children }) => {
  const [showTip, setShowTip] = useState(true);
  if (!showTip) {
    return null;
  }
  return (
    <div className={style.alertInfo}>
      <div>
        <AlertError />
        <span>{children}</span>
      </div>
      <AlertClose onClick={() => setShowTip(false)} />
    </div>
  );
};
