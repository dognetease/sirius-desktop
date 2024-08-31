import React, { useMemo, useRef, useState, useEffect } from 'react';
import styles from './compare.module.scss';

export interface CompareNumProps {
  title: string;
  value: number;
  controlValue: number;
  info: string;
}

const recommendWidth = 146;

const CompareNum = (props: CompareNumProps) => {
  // value 应该是真实的值，controlValue 是推荐值
  const { title, value, controlValue, info } = props;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [wrapWidth, setWrapWidth] = useState(0);
  // const maxValue = useMemo(() => Math.max(value, controlValue) * 1.25, [value, controlValue]);
  useEffect(() => {
    setWrapWidth((wrapRef.current?.offsetWidth || 0) * 0.36);
  }, [wrapRef.current]);

  return (
    <div className={styles.numWrapper}>
      <p className={styles.title}>
        <span className={styles.line}></span>
        {title}
      </p>
      <div className={styles.numProgress}>
        <div className={styles.progress} ref={wrapRef}>
          <div className={styles.percent} style={{ width: wrapWidth }}>
            <span className={styles.start}>0</span>
            <span className={styles.info}>{info}</span>
            <span className={styles.end}>{controlValue}</span>
          </div>
          <div className={styles.valueCircle} style={{ left: `${Math.min((value / controlValue) * wrapWidth, wrapRef.current?.offsetWidth || 0)}px` }}>
            <p className={styles.valueCircleInfo}>
              <span>{value}</span>
              <span className={styles.unit}>个</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareNum;
