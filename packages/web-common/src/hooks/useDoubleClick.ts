// 双击默认值改为500ms了，原来的200ms，用户双击比较慢，经常会被反馈双击操作不生效。500ms的依据是微软Windows默认双击延迟时间
import { useState, useEffect, useRef } from 'react';

function useSingleAndDoubleClick(actionSimpleClick, actionDoubleClick, delay = 500, leading = false) {
  const [click, setClick] = useState(0);
  const eventRef = useRef(null);
  const timerRef = useRef<any>(null);
  const clickRef = useRef(click);
  clickRef.current = click;

  useEffect(() => {
    if (!eventRef.current) return;
    if (!timerRef || !timerRef.current) {
      if (leading && click === 1) {
        actionSimpleClick(...eventRef.current);
      }
      timerRef.current = setTimeout(() => {
        if (clickRef.current === 1 && !leading) actionSimpleClick(...eventRef.current);
        setClick(0);
        timerRef.current = null;
        eventRef.current = null;
      }, delay);
    }

    if (click === 2) {
      actionDoubleClick(...eventRef.current);
      timerRef.current = null;
      eventRef.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
      setClick(0);
    }

    return () => clearTimeout(timerRef.current);
  }, [click]);

  return (...args) => {
    // e.persist();
    eventRef.current = args;
    setClick(prev => prev + 1);
  };
}

export default useSingleAndDoubleClick;
