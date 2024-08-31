import React, { PropsWithChildren } from 'react';
import NoData from '@web/images/icons/edm/yingxiao/no-data.png';
import style from './style.module.scss';

interface Props {}

export const Empty: React.FC<PropsWithChildren<Props>> = props => {
  const { children } = props;
  return (
    <div className={style.wrapper}>
      <img className={style.icon} src={NoData} alt="" />
      <div className={style.text}>暂无数据</div>
      {children ? <div className={style.slot}>{children}</div> : null}
    </div>
  );
};
