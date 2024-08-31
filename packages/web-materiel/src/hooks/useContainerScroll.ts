import { MutableRefObject, useCallback, useEffect, useState } from 'react';

interface IContainerScrollOption {
  /** 距离底部多少距离触发触底 */
  safeBottomHeight: number;
}

interface IContainerScrollState {
  /** 滚动条横向高度 */
  scrollLeft: number;
  /** 滚动条高度 */
  scrollTop: number;
  /** 是否触底 */
  reachBottom: boolean;
  /** scroll to top */
  scrollToTop: () => void;
  /** scroll to left */
  scrollToLeft: () => void;
}

/**
 * 获取dom对应的scrollLeft & scrollTop
 * @param container Ref<HTMLElement> | string 容器（不传，默认body）
 * @param options 额外配置参数
 * @returns scrollState IContainerScrollState
 */
export default function useContainerScroll(container: MutableRefObject<HTMLElement> | string, options?: IContainerScrollOption) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [reachBottom, setReachBottom] = useState(false);
  const { safeBottomHeight = 50 } = options || {};

  const getContainer = useCallback(() => {
    let theContainer: HTMLElement | null = null;
    if (container && (container as MutableRefObject<HTMLDivElement>).current) {
      theContainer = (container as MutableRefObject<HTMLDivElement>).current;
    }
    if (container && typeof container === 'string') {
      theContainer = document.querySelector(container);
    }
    return theContainer || document.body;
  }, [container]);

  const onScroll = useCallback(() => {
    const theContainer = getContainer();
    setX(theContainer.scrollLeft);
    setY(theContainer.scrollTop);
    // 滚动条卷曲的高度 + 当前显示元素的高度  >= 内容区的整个高度 - 安全高度
    setReachBottom(theContainer.scrollTop + theContainer.offsetHeight >= theContainer.scrollHeight - safeBottomHeight);
  }, [getContainer, safeBottomHeight]);

  const resetScroll = (type: 'top' | 'left' = 'top') => {
    const theContainer = getContainer();
    const scrollKey = type === 'left' ? 'scrollLeft' : 'scrollTop';
    let timer: number;

    const step = () => {
      theContainer[scrollKey] -= 130;

      if (theContainer[scrollKey] > 0) {
        timer = window.requestAnimationFrame(step);
      } else {
        window.cancelAnimationFrame(timer);
      }
    };

    timer = window.requestAnimationFrame(step);
  };

  useEffect(() => {
    const theContainer = getContainer();
    theContainer.addEventListener('scroll', onScroll);

    return () => {
      theContainer.removeEventListener('scroll', onScroll);
    };
  }, [onScroll, getContainer]);

  return {
    scrollLeft: x,
    scrollTop: y,
    reachBottom,
    scrollToTop: () => {
      resetScroll('top');
    },
    scrollToLeft: () => {
      resetScroll('left');
    },
  } as IContainerScrollState;
}
