import React from 'react';
import classnames from 'classnames';
import style from './stat.module.scss';

interface StatProps {
  className?: string;
  icon: React.ReactChild;
  name: string;
  title?: string | number;
  subTitle?: string | number;
}

export const getNum = (num: any) => {
  if (typeof num !== 'number') return '-';

  return num;
};

export const getRatio = (num: any) => {
  if (typeof num !== 'number') return '-';

  return `${(num * 100).toFixed(2)}%`;
};

const Stat: React.FC<StatProps> = props => {
  const { className, icon, name, title, subTitle } = props;

  return (
    <div className={classnames(style.stat, className)}>
      <div className={style.icon}>{icon}</div>
      <div className={style.content}>
        <div className={style.name}>{name}</div>
        <div className={style.title}>{title}</div>
        <div className={style.subTitle}>{subTitle}</div>
      </div>
    </div>
  );
};

export default Stat;
