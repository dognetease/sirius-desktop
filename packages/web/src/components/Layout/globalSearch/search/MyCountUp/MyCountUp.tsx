import classNames from 'classnames';
import React, { useRef } from 'react';
import CountUp, { CountUpProps, useCountUp } from 'react-countup';
import style from './countup.module.scss';

interface MyCountUpProps extends CountUpProps {
  date?: string;
  hiddenCountUp?: boolean;
}

const MyCountUp: React.FC<MyCountUpProps> = ({ end, prefix, className, date, hiddenCountUp, ...rest }) => {
  const props: CountUpProps = {
    end,
    duration: 2.75,
    separator: ',',
    className: style.count,
    ...rest,
  };

  return (
    <div className={classNames(style.wrapper, className)}>
      {(date || hiddenCountUp) && (
        <span className={style.iconWrapper}>
          <span className={style.icon} /> <span className={style.iconText}>{`${date + (hiddenCountUp ? '' : ',')}`}</span>{' '}
        </span>
      )}
      {prefix && <span className={style.prefix}>{prefix}</span>}
      {!hiddenCountUp && <CountUp {...props}></CountUp>}
    </div>
  );
};

export default MyCountUp;

function useEffect(arg0: () => void, arg1: number[]) {
  throw new Error('Function not implemented.');
}
