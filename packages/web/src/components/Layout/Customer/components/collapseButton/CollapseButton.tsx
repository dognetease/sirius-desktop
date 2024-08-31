import React from 'react';
import style from './CollapseButtion.module.scss';
import classnames from 'classnames';
import { ReactComponent as UpLine } from '@/images/icons/edm/up-line.svg';

interface ComsProps {
  foldText: string;
  unFoldText: string;
  expand: boolean;
  className?: string;
  onClick: () => void;
  noIcon?: boolean;
}

const collapseButton = (props: ComsProps) => {
  const { foldText, unFoldText, className, onClick, expand, noIcon } = props;

  return (
    <div className={classnames([style.handlerItem], [className])} onClick={onClick}>
      {expand ? (
        <>
          {unFoldText} {noIcon ? null : <UpLine />}
        </>
      ) : (
        <>
          {foldText} {noIcon ? null : <UpLine />}
        </>
      )}
    </div>
  );
};
export default collapseButton;
