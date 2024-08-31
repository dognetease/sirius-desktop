import { useState, useRef, useEffect } from 'react';
import style from './useResponsiveTable.module.scss';

type ScrollY = number | undefined;

type UseResponsiveTable = () => {
  layout: Record<'container' | 'static' | 'grow', string>;
  growRef: React.RefObject<HTMLDivElement>;
  scrollY: ScrollY;
};

const getCalculatedHeight = (element: Element | null) => {
  if (!element) return 0;

  const computedStyle = getComputedStyle(element);
  const calculatedHeight = parseInt(computedStyle.height) + parseInt(computedStyle.marginTop) + parseInt(computedStyle.marginBottom);

  return calculatedHeight;
};

const useResponsiveTable: UseResponsiveTable = () => {
  const layout = {
    container: style.container,
    static: style.static,
    grow: style.grow,
  };

  const growRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLDivElement | null>(null);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const [scrollY, setScrollY] = useState<ScrollY>(undefined);

  useEffect(() => {
    theadRef.current = growRef.current?.querySelector('.ant-table-thead') || null;
    paginationRef.current = growRef.current?.querySelector('.ant-pagination') || null;
  });

  useEffect(() => {
    if (ResizeObserver && growRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
          const { height } = entry.contentRect;

          if (growRef.current) {
            const theadHeight = getCalculatedHeight(theadRef.current);
            const paginationHeight = getCalculatedHeight(paginationRef.current);
            const nextScrollY = Math.max(height - theadHeight - paginationHeight - 1, 0);

            setScrollY(nextScrollY);
          }
        });
      });

      resizeObserver.observe(growRef.current);

      return () => resizeObserver.disconnect();
    }
  }, [ResizeObserver, growRef.current, theadRef.current, paginationRef.current]);

  return { layout, growRef, scrollY };
};

export { useResponsiveTable };
