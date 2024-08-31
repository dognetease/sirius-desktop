import React from 'react';
import style from './style.module.scss';
import classnames from 'classnames';

interface Props {
  color: string;
  text: string;
}
const Tag: React.FC<Props> = ({ color, text }) => {
  return <span className={classnames(style.tag, style[color])}>{text}</span>;
};
export default Tag;
