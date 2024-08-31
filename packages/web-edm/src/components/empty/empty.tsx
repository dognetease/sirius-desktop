import React from 'react';
import style from './empty.module.scss';
import classnames from 'classnames';

export const EmptyList = props => {
  return (
    <div className={`${props.className || ''} ${style.emptyContainer}`} style={props.style || {}}>
      <div className={`${props.bodyClassName || ''} ${style.emptyWrap}`}>
        <div className={classnames(style.emptyImg, { [style.emptyImgCustoms]: props.isCustoms })}></div>
        {props.children}
      </div>
    </div>
  );
};

EmptyList.defaultProps = {
  isCustoms: false,
};
