import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import debounce from 'lodash/debounce';

type ComputeApi = (key: Element, node: Element, func?: (height: number) => number) => void;
interface ContextApi {
  compute: ComputeApi;
  unObserver(node: Element): void;
  widthMap: Map<Element, number>;
}

export const Context = React.createContext<ContextApi>({
  compute(key, node, func) {},
  unObserver(node) {},
  widthMap: new Map([]),
});
export const Provider: React.FC<any> = props => {
  const [widthMap, setWidthMap] = useState<Map<Element, number>>(new Map([]));
  const [observeNodeMap, setObserverNodeMap] = useState<
    Map<
      Element,
      {
        target: Element;
        func(height: number): number;
      }
    >
  >(new Map([]));
  // const callback = useCallback(
  //     ()=>{},
  //     [setObserverNodeMap]
  // );

  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const callback = useCallback(
    entries => {
      entries.forEach(entry => {
        const target = entry.target;

        const value = observeNodeMap.get(target);
        const width = value?.func(entry.contentRect.width);
        if (!width) {
          return;
        }
        const _map = new Map(widthMap);
        _map.set(target, width as number);
        console.log('[maxSize]callback', observeNodeMap, entry.contentRect, width);
        if (!isMountedRef.current) return;
        setWidthMap(_map);
      });
    },
    [observeNodeMap]
  );

  const observer = new ResizeObserver(debounce(callback, 50));
  useEffect(() => {
    return () => {
      observer.disconnect();
    };
  }, []);
  const compute: ComputeApi = useCallback(
    (key, target, func = (height: number) => height) => {
      setObserverNodeMap(
        new Map(
          observeNodeMap.set(target, {
            target: key,
            func,
          })
        )
      );
      console.log('[maxSize]observer');
      observer.observe(target);
    },
    [observeNodeMap]
  );
  const unObserver = (node: HTMLElement) => {
    observer.unobserve(node);
  };

  return (
    <Context.Provider
      value={{
        widthMap: widthMap,
        unObserver,
        compute,
      }}
    >
      {props.children}
    </Context.Provider>
  );
};

export const useMaxsize = (node: Element): number[] => {
  const [width, setWidth] = useState(0);
  const { widthMap } = useContext(Context);
  useEffect(() => {
    if (!node) {
      return;
    }
    const width = [...widthMap.keys()]
      .filter(item => {
        return item.contains(node);
      })
      .map(item => {
        return widthMap.get(item) as number;
      })
      .reduce((total, cur) => {
        if (total === 0) {
          return cur;
        }
        return Math.min(total, cur);
      }, 0);

    if (width !== 0) {
      setWidth(width);
    }
  }, [node, widthMap]);

  return [width];
};
