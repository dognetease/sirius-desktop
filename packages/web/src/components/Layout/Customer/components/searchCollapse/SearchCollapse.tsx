import React, { useState, useRef, useEffect } from 'react';
import style from './SearchCollapse.module.scss';
import classnames from 'classnames';
interface comsProps {
  expand: boolean;
  calssName?: string;
  minHeight?: number;
}

const SearchCollapse: React.FC<comsProps> = ({ expand, children, calssName, minHeight }) => {
  const [height, setHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const { height: offsetHeight } = entry.contentRect;
        setHeight(offsetHeight);
      });
    });
    if (expand) {
      contentRef.current && resizeObserver.observe(contentRef.current);
    } else {
      setHeight(minHeight ? minHeight : 0);
    }
    return () => resizeObserver.disconnect();
  }, [expand]);

  return (
    <div
      className={classnames([style.collapseWrap, calssName], {
        [style.show]: expand,
      })}
      style={{ height }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

export default SearchCollapse;
