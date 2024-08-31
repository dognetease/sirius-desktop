import React from 'react';
import classnames from 'classnames';
import { ReactComponent as LeftArrow } from '@web-sns-marketing/images/left-arrow.svg';
import { ReactComponent as RightArrow } from '@web-sns-marketing/images/right-arrow.svg';
import style from './QuickSwitch.module.scss';

interface QuickSwitchProps {
  className?: string;
  prevDisabled: boolean;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const QuickSwitch: React.FC<QuickSwitchProps> = props => {
  const { className, prevDisabled, nextDisabled, onPrev, onNext } = props;

  return (
    <div className={classnames(style.quickSwitch, className)}>
      <div
        className={classnames(style.item, {
          [style.disabled]: prevDisabled,
        })}
        onClick={() => !prevDisabled && onPrev()}
      >
        <LeftArrow className={style.icon} />
      </div>
      <div className={style.separator} />
      <div
        className={classnames(style.item, {
          [style.disabled]: nextDisabled,
        })}
        onClick={() => !nextDisabled && onNext()}
      >
        <RightArrow className={style.icon} />
      </div>
    </div>
  );
};

export default QuickSwitch;
