import React from 'react';
import style from '../globalSearch.module.scss';

export default (props: { names?: string[] }) => {
  if (props.names) {
    return (
      <span className={style.historyExtra}>
        <span className={style.historyExtraTitle}>扩展词</span>
        <span className={style.historyExtraText}>{props.names.join(', ')}</span>
      </span>
    );
  }
  return null;
};
