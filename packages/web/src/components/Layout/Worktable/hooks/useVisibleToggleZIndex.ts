import { useRef } from 'react';

/**
 * 处理再未关闭上一个下拉列表时就直接点击另一个下拉列表的问题
 * 处理下拉列表层级被遮挡的问题
 */
const useVisibleToggleZIndex = (containerRef: React.RefObject<HTMLDivElement>) => {
  const prevContainerZIndex = useRef('-1');
  const visibleCount = useRef(0);
  const handleDropDownVisibleChange = (open: boolean) => {
    if (!containerRef.current || !containerRef.current.parentElement) return;
    if (open) {
      visibleCount.current += 1;
      prevContainerZIndex.current === '-1' && (prevContainerZIndex.current = containerRef.current.parentElement.style.zIndex);
      containerRef.current.parentElement.style.zIndex = '20';
    } else {
      visibleCount.current -= 1;
      if (visibleCount.current > 0) return;
      window.setTimeout(() => {
        if (!containerRef.current || !containerRef.current.parentElement || !containerRef.current.parentElement) return;
        containerRef.current.parentElement.style.zIndex = prevContainerZIndex.current;
      }, 150);
    }
  };

  return {
    handleDropDownVisibleChange,
  };
};

export default useVisibleToggleZIndex;
