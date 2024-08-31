import React from 'react';
import style from './customerWrap.module.scss';
import { getBodyFixHeight } from '@web-common/utils/constant';

const CustomerWrap: React.FC = ({ children }) => {
  return (
    <div className={style.customerPageContainer} style={getBodyFixHeight(true) ? { minHeight: 608 } : { minHeight: 640 }}>
      {children}
    </div>
  );
};
export default CustomerWrap;
