import { Tooltip } from 'antd';
import classnames from 'classnames';
import React from 'react';
import style from './ellipsis.module.scss';

export const EllipsisText = ({ text, footerLength, tooltip = true, ...props }) => {
  let inner: JSX.Element | null = null;

  if (footerLength >= text.length || footerLength === 0) {
    inner = <div className={classnames([props.className, style.ellipsis])}>{text}</div>;
  }
  const text1 = text.substring(0, text.length - footerLength);
  const text2 = text.substring(text.length - footerLength);

  inner = (
    <div className={classnames([props.className, style.ellipsisWrap])}>
      <span className={style.ellipsis}>{text1}</span>
      <span className={style.indent}>{text2}</span>
    </div>
  );
  if (tooltip) {
    return <Tooltip title={text}>{inner}</Tooltip>;
  }
  return inner;
};
