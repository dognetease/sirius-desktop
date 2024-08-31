import React from 'react';
import classNames from 'classnames';
import style from './badge.module.scss';

export enum ColorType {
  purple = 'purple',
  blue = 'blue',
  gray = 'gray',
  yellow = 'yellow',
  green = 'green',
  blue2 = 'blue2',
  red = 'red',
  bule3 = 'bule3',
}

export interface Props {
  // 颜色类型
  colorType: ColorType;
  // 文本
  text: string;

  className?: string;
}

export default function Badge(props: Props) {
  const { colorType = 'blue', text = '', className = '' } = props;
  return <span className={classNames(style.badge, className, style[colorType])}>{text}</span>;
}
