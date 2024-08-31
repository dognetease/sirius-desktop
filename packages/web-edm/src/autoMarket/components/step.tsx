import React from 'react';
import classnames from 'classnames';
import style from './step.module.scss';

export interface StepProps {
  className?: string;
  name?: string;
  index?: number;
  active?: boolean;
  isLast?: boolean;
  isDash?: boolean;
  children?: React.ReactElement;
}

const Step: React.FC<StepProps> = props => {
  const { className, name, index, active, isLast, children } = props;

  return (
    <div
      className={classnames(style.step, className, {
        [style.stepActive]: active,
      })}
    >
      {!isLast && <div className={style.line} />}
      {/* {
        (!isLast && isDash) &&  <div className={style.lineDash} />
      } */}
      <div className={style.index}>
        <span className={style.indexText}>{index}</span>
      </div>
      <div className={style.name}>{name}</div>
      <div className={style.children}>{children}</div>
    </div>
  );
};

export default Step;
