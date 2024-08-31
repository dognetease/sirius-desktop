import React from 'react';
import classnames from 'classnames';
import style from './empty.module.scss';

interface EmptyProps {
  className?: string;
  classImageName?: string;
}

const Empty: React.FC<EmptyProps> = props => {
  return (
    <div className={classnames(style.empty, props.className)}>
      <div className={classnames(style.imgBox, props.classImageName)}></div>
      {props.children}
    </div>
  );
};
export { Empty };
