import React from 'react';
import classnames, { Argument as classnamesType } from 'classnames';
import style from './detailHeader.module.scss';
import { getTransText } from '@/components/util/translate';
interface DetailHeaderProps {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  className?: classnamesType;
}
const DetailHeader = ({ onPrev, onNext, prevDisabled, nextDisabled }: DetailHeaderProps) => {
  return (
    <div className={style.headerWrap}>
      <h1 className={style.title}>{getTransText('TIEZIXIANGQING')}</h1>
      <div className={style.handlerBox}>
        <span onClick={() => !prevDisabled && onPrev()} className={classnames(style.prev, prevDisabled ? style.prevDisabled : '')}></span>
        <span onClick={() => !nextDisabled && onNext()} className={classnames(style.next, nextDisabled ? style.nextDisabled : '')}></span>
      </div>
    </div>
  );
};

export { DetailHeader };
