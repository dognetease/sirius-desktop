import React, { useEffect } from 'react';
import style from './headerLayout.module.scss';

interface ComsProps {
  title: string;
  subTitle?: string | React.ReactElement;
  className?: string;
  onTitleCick?: () => void;
  // RightDom?: React.ReactNode
}
const HeaderLayout: React.FC<ComsProps> = ({ title, subTitle, children, className, onTitleCick }) => {
  return (
    <div className={`${style.layoutHeader} ${className}`}>
      <div className={style.layoutHeaderLeft}>
        <span className={style.title} onClick={() => onTitleCick && onTitleCick()}>
          {title}
        </span>
        <span className={style.subTitle}>{subTitle}</span>
      </div>
      <div className={style.layoutHeaderRight}>{children}</div>
    </div>
  );
};

export default HeaderLayout;
