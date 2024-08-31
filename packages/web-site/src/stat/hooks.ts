import { useEffect, useRef, useState } from 'react';
import throttle from 'lodash/throttle';

// 监听 dom 元素宽度变化
export const useObserveWidth = (domRef: React.RefObject<HTMLDivElement>) => {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const resizeObserverRef = useRef<any>();

  useEffect(() => {
    if (domRef.current) {
      widthRef.current = domRef.current.offsetWidth;
      try {
        resizeObserverRef.current = new ResizeObserver(
          throttle(entries => {
            let _width = entries[0]?.contentRect.width;
            if (Math.abs(widthRef.current - _width) > 10) {
              widthRef.current = _width;
              setWidth(_width);
            }
          }, 20)
        );
        resizeObserverRef.current.observe(domRef.current);
      } catch (e) {
        console.log(e);
      }
    }

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  return width;
};
