import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { getBodyFixHeight } from '@web-common/utils/constant';

interface WindowOffsetSize {
  height: number;
  width: number;
}

const useWindowSize = (needFixHeight: boolean = false) => {
  const [offset, setOffset] = useState<WindowOffsetSize>({
    height: 0,
    width: 0,
  });

  const handleResize = useCallback(() => {
    if (typeof window !== undefined) {
      const fixdHeight = needFixHeight ? getBodyFixHeight(true, true) : 0;
      setOffset({
        height: window.document.body.offsetHeight - fixdHeight,
        width: window.document.body.offsetWidth,
      });
    }
  }, [needFixHeight]);
  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);
  return offset;
};

export default useWindowSize;
