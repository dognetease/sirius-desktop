import React, { useState, useEffect, useRef, useMemo, CSSProperties } from 'react';
import styles from './index.module.scss';
interface Props {
  contentList: string[];
  width: number;
  pause?: number;
  duration?: number;
}

const TextRoll: React.FC<Props> = ({ width, pause = 3000, duration = 500, contentList }) => {
  const timer1 = useRef(0);
  const timer2 = useRef(0);
  const curIndex = useRef(0);

  const [animateStyle, setAnimateStyle] = useState<CSSProperties>({});

  const list = useMemo(() => [...contentList, contentList[0]], [contentList]);

  const startAnimate = (interval: number) => {
    timer1.current = setTimeout(() => {
      const isLast = curIndex.current === list.length - 1;
      curIndex.current = isLast ? 0 : curIndex.current + 1;
      const currentHeight = curIndex.current * Math.floor(100 / list.length);
      setAnimateStyle({
        transform: `translateY(-${currentHeight}%)`,
        transition: `linear all ${duration}ms`,
      });
      if (isLast) {
        timer2.current = setTimeout(() => {
          curIndex.current = 0;
          setAnimateStyle({
            transform: 'translateY(0)',
            transition: 'none',
          });
        }, 0);
        startAnimate(50);
      } else {
        startAnimate(pause);
      }
    }, interval);
  };

  const clearAnimate = () => {
    window.clearTimeout(timer1.current);
    window.clearTimeout(timer2.current);
  };

  useEffect(() => {
    startAnimate(pause);
    return () => {
      clearAnimate();
    };
  }, []);

  return (
    <div className={styles.textRoll}>
      <div className={styles.animationContainer} style={{ width, ...animateStyle }}>
        {list.map((v, index) => (
          <p className={styles.item} key={index}>
            {v}
          </p>
        ))}
      </div>
    </div>
  );
};

export default TextRoll;
