/**
 * 自动获取容器高度
 */
import { useEffect, useState, useRef } from 'react';
import { debounce } from 'lodash';

export function useContainerHeight(minHeight: number = -1, maxHeight: number = -1) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setHeight] = useState(minHeight);

  const calculateHeight = debounce(() => {
    const bounding = containerRef?.current?.getBoundingClientRect();

    if (bounding) {
      let { height } = bounding;
      if (minHeight > -1) {
        height = Math.max(minHeight, height);
      }
      if (maxHeight > -1) {
        height = Math.min(maxHeight, height);
      }
      setHeight(height);
    }
  }, 200);

  useEffect(() => calculateHeight(), [containerRef]);

  useEffect(() => {
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  });

  return { containerHeight, containerRef, calculateHeight };
}
