import React from 'react';
import style from './style.module.scss';

interface Props {
  title: string;
  subTitle?: string;
  handler?: React.ReactElement;
}

const Header: React.FC<Props> = ({ title, handler, subTitle }) => (
  <header className={style.ffPriceHeader}>
    <div className={style.ffPriceHeaderLeft}>
      {title}
      {subTitle ? <span className={style.ffPriceHeaderSubTitle}>{subTitle}</span> : null}
    </div>
    {handler ? <div className={style.ffPriceHeaderRight}>{handler}</div> : null}
  </header>
);
export default Header;
