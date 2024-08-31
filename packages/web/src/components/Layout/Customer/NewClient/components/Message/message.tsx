/*
 * @Author: sunmingxin
 * @Date: 2021-10-22 17:01:11
 * @LastEditTime: 2021-10-22 18:19:49
 * @LastEditors: sunmingxin
 */

import React from 'react';
import style from './message.module.scss';
import { ReactComponent as AlertClose } from '@/images/icons/edm/alert-close.svg';
import { ReactComponent as AlertRed } from '@/images/icons/edm/alert-red.svg';
import { ReactComponent as AlertBlue } from '@/images/icons/edm/alert-blue.svg';
import { ReactComponent as AlertYellow } from '@/images/icons/edm/alert-error.svg';
import classNames from 'classnames';

interface ComsProps {
  alertClose?: (param?: boolean) => void;
  message: string;
  type: 'fail' | 'info' | 'warning'; // fail info
  className?: string;
}

const Message: React.FC<ComsProps> = ({ alertClose, message, type, className, children }) => {
  const Icon = (type: string) => {
    switch (type) {
      case 'fail':
        return <AlertRed />;
      case 'info':
        return <AlertBlue />;
      case 'warning':
        return <AlertYellow />;
      default:
        return <AlertYellow />;
    }
  };
  return (
    <div className={`${style.alertCommonWrap} ${className}`}>
      <div
        className={classNames(style.alertBox, {
          [style.alertFail]: type === 'fail',
          [style.alertInfo]: type === 'info',
          [style.alertWarning]: type === 'warning',
        })}
      >
        <div>
          {Icon(type)}
          <span style={{ paddingRight: 8 }}>{message}</span>
          {children}
        </div>
        <AlertClose onClick={alertClose} />
      </div>
    </div>
  );
};
export default Message;
