import React from 'react';
import style from './footerBar.module.scss';

interface Props {
  keys: React.Key[];
  children: React.ReactNode;
  className?: string;
}
const FooterBar: React.FC<Props> = props => {
  const { keys, children } = props;
  if (keys.length) {
    return <div className={style.footerBar}>{children}</div>;
  }
  return null;
};
export default FooterBar;
