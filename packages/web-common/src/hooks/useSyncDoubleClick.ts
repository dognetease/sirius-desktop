/**
 * 自定义区分单击双击事件
 * 通过提供一个key来当做判断依据，解决单击事件中改变状态让组件的重新渲染导致的双击事件无法跟踪。
 */
// todo：实现太丑，待重构
import { useState, useEffect, useRef } from 'react';

function useSyncSingleAndDoubleClick(actionSimpleClick, actionDoubleClick, delay = 200) {
  const [click, setClick] = useState(0);
  const eventRef = useRef(null);
  const timerRef = useRef<any>(null);
  const clickRef = useRef(click);
  const keyRef = useRef(null);
  const preKeyRef = useRef(null);

  useEffect(() => {
    if (click != 0) {
      let isDouble = false;
      const params = eventRef.current ? eventRef.current : [];
      if (timerRef.current) clearTimeout(timerRef.current);
      if (keyRef.current) {
        if (preKeyRef.current === keyRef.current) {
          actionDoubleClick(...params);
          timerRef.current && clearTimeout(timerRef.current);
          timerRef.current = null;
          eventRef.current = null;
          keyRef.current = null;
          preKeyRef.current = null;
          // 清除
          isDouble = true;
        }
      }
      if (!isDouble) {
        preKeyRef.current = keyRef.current;
        actionSimpleClick(...params);
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          eventRef.current = null;
          keyRef.current = null;
          preKeyRef.current = null;
        }, delay);
      }
    }

    return () => clearTimeout(timerRef.current);
  }, [click]);

  return (key, ...args) => {
    keyRef.current = key;
    eventRef.current = args;
    setClick(prev => prev + 1);
  };
}

export default useSyncSingleAndDoubleClick;
