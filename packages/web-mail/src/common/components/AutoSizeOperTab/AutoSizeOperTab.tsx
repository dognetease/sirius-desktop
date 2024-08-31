/**
 * 自适应操作面板
 * 测量容器的宽度，提供给子元素三种尺寸变化，实现在尺寸变化的过程中，子元素可以自适应的变化。
 * 用法：AutoSizeOperTab 请赋予flex布局，子元素不要设置flex：1之类的会占满剩余空间的属性。
 * AutoSizeOperTabItem 请赋予预估的宽度数据，用于首次计算。不用非常精确，能够梯度区分尺寸即可。在渲染过程中会测量校正。
 * AutoSizeOperTabItem 接收组件或者参数为size的回调函数，回调函数返回对应的组件。
 * size有三种尺寸，mini, small, normal，对应的数字为 0, 1, 2
 *
 */
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import useDebounceForEvent from '@web-common/hooks/useDebounceForEvent';
import useThrottleForEvent from '@web-mail/hooks/useThrottleForEvent';
import useStateRef from '@web-mail/hooks/useStateRef';
import React, { useEffect, useCallback, useMemo, useState, useContext, useRef } from 'react';
import LevelQueue, { TAB_SIZE } from './levelQueue';

const tabSizeValues = Object.values(TAB_SIZE).filter(item => typeof item === 'number') as number[];

const getLocalKey = () => {
  // 根据时间返回个字符串
  return new Date().getTime().toString() + Math.random().toString().slice(2);
};

type sizeWidthMap = { [key: number]: number };

type tabItemOperFn = { setTapSize: (size: number) => void; getKey: () => string };

interface contextProps {
  // 通知父组件，子元素的尺寸变化
  onOperTabItemResize: (key: string, config: { width: number; level: number; size: number }) => void;
  // 获取本地key
  getLocalKey: () => string;
  // 子元素的init
  onItemInit: (key: string, config: { level: number; size: number; sizeWidthMap: sizeWidthMap }, fn: tabItemOperFn) => void;
  // 子元素的卸载
  onItemUnmount: (key: string) => void;
}

const TabContext = React.createContext<contextProps>({
  onOperTabItemResize: () => {},
  getLocalKey,
  // 子元素的init
  onItemInit: () => {},
  // 子元素的卸载
  onItemUnmount: () => {},
});

/**
 * 自适应操作面板容器
 */

interface AutoSizeOperTabProps {
  // 兼容其他属性
  [key: string]: any;
}
const AutoSizeOperTab: React.FC<AutoSizeOperTabProps> = props => {
  // 容器的ref
  const wrapRef = useRef<HTMLDivElement>(null);
  // 元素的key2sizeMap
  const key2sizeMapRef = useRef<Record<string, TAB_SIZE | null>>({});
  // 元素的key2levelMap
  const key2levelMapRef = useRef<Record<string, number | null>>({});
  // 元素的key2widthMap
  // const key2widthMapRef = useRef<Record<string, number | null>>({});
  // 子元素的key2refMap
  const key2refMapRef = useRef<Record<string, tabItemOperFn | null>>({});
  // 子元素的size2widthMap
  const size2widthMapRef = useRef<{ [key: string]: sizeWidthMap }>({});
  // 存贮组件的init顺序,ref 存储
  const initOrderRef = useRef<string[]>([]);
  // 多级队列
  const [levelQueue] = useState(new LevelQueue(tabSizeValues));

  /**
   *  根据key获取当前尺寸下的宽度
   */
  const getWidthBySize = useCreateCallbackForEvent((key: string) => {
    const curSize = key2sizeMapRef.current[key] || TAB_SIZE.NORMAIL;
    return size2widthMapRef.current[key][curSize];
  });

  /**
   * 根据key获取size2widthMap
   */
  const getWidthMapBySize = useCreateCallbackForEvent((key: string) => {
    return size2widthMapRef.current[key];
  });

  /**
   * 判断元素的总宽度是否超过容器的宽度
   */
  // const isOverFlow = useCreateCallbackForEvent((_key?: string, value?: number) => {
  //   //
  //   const wrapWidth = wrapRef.current?.offsetWidth || 0;
  //   // 计算总宽度
  //   let totalWidth = 0;
  //   initOrderRef.current.forEach(key => {
  //     const width = getWidthBySize(key);
  //     // key2widthMapRef.current[key];
  //     if (_key === key) {
  //       totalWidth += value || 0;
  //     } else if (width) {
  //       totalWidth += width;
  //     }
  //   });

  //   return totalWidth > wrapWidth;
  // });

  /**
   * 重新计算子元素的尺寸
   * // todo: 该方法有问题，因为原来的数据流量循环已经切断了，该方法只是单项计算一个状态的方法不适用了
   */
  // const reComputeTabSize = useCreateCallbackForEvent(() => {

  //   const argList = initOrderRef.current.map((key, index) => {
  //     const size = key2sizeMapRef.current[key];
  //     const level = key2levelMapRef.current[key];
  //     const width = getWidthBySize(key);
  //     return {
  //       size,
  //       level,
  //       width,
  //       index,
  //       key,
  //     };
  //   });
  //   levelQueue.update(argList);
  //   // 缺少方向判断

  //   // 获取权重最低的元素
  //   // let minLevel = +Infinity;
  //   // let minLevelKey = null;
  //   // // 求出当前最小的size
  //   // let minSize = +Infinity;
  //   // initOrderRef.current.forEach(key => {
  //   //   const size = key2sizeMapRef.current[key];
  //   //   if (size != null && size <= minLevel) {
  //   //     minLevel = minSize;
  //   //   }
  //   // });

  //   // // 当权重相同的时候，初始化越靠后的，权重越小
  //   // initOrderRef.current.forEach(key => {
  //   //   const level = key2levelMapRef.current[key];
  //   //   if (level != null && level <= minLevel) {
  //   //     minLevel = level;
  //   //     minLevelKey = key;
  //   //   }
  //   // });

  //   // 如果空间不足
  //   const isOver = isOverFlow();
  //   if (isOver) {
  //     const min = levelQueue.getMinValue();
  //     if (!min) return;

  //     const minLevelKey = min?.key;
  //     if (minLevelKey) {
  //       const operateItem = key2refMapRef.current[minLevelKey];
  //       const operateItemsize = key2sizeMapRef.current[minLevelKey];
  //       if (operateItem?.setTapSize) {
  //         const size = operateItemsize != null ? (operateItemsize - 1 >= TAB_SIZE.MINI ? operateItemsize - 1 : TAB_SIZE.MINI) : TAB_SIZE.MINI;
  //         key2sizeMapRef.current[minLevelKey] = size;
  //         operateItem?.setTapSize(size);
  //       }
  //     }
  //   } else {
  //     // 如果空间充足
  //     const min = levelQueue.getMaxValue();
  //     if (!min) return;

  //     const minLevelKey = min?.key;
  //     if (minLevelKey) {
  //       const operateItem = key2refMapRef.current[minLevelKey];
  //       const operateItemsize = key2sizeMapRef.current[minLevelKey];
  //       if (operateItem?.setTapSize) {
  //         const size = operateItemsize != null ? (operateItemsize + 1 <= TAB_SIZE.NORMAIL ? operateItemsize + 1 : TAB_SIZE.NORMAIL) : TAB_SIZE.NORMAIL;

  //         // 检测扩展后的空间是否足够
  //         if (size2widthMapRef.current[minLevelKey] != null && !isOverFlow(minLevelKey, size2widthMapRef.current[minLevelKey][size] || 0)) {
  //           key2sizeMapRef.current[minLevelKey] = size;
  //           operateItem?.setTapSize(size);
  //         }
  //       }
  //     }
  //   }
  // });
  // const reComputeTabSizeDebounce = useDebounceForEvent(reComputeTabSize, 300, { leading: false, trailing: true });

  // 初始化的时候，计算并构建内部组件的状态
  // init，unmount 防抖后沿触发
  // 知道自己wrap的尺寸，根据子元素的优先级，计算出当前子元素的size值。并传递设置
  const buildSizeState = useCreateCallbackForEvent(() => {
    // 迭代调用，知道获得最终的size状态
    const wrapWidth = wrapRef.current?.offsetWidth || 0;
    const argList = initOrderRef.current.map((key, index) => {
      // const size = key2sizeMapRef.current[key];
      const level = key2levelMapRef.current[key] || 0;
      const width = getWidthBySize(key);
      return {
        size: TAB_SIZE.NORMAIL,
        level,
        width,
        index,
        key,
        size2widthMap: getWidthMapBySize(key),
      };
    });
    // 重建状态
    levelQueue.update(argList);
    // 迭代到最终状态
    levelQueue.getChabuduodeState(wrapWidth);
    // 获取最终状态
    const resList = levelQueue.getFinalState();
    // 更新状态
    resList.forEach(item => {
      const operateItem = key2refMapRef.current[item.key];
      if (operateItem?.setTapSize) {
        key2levelMapRef.current[item.key] = item.level;
        if (key2sizeMapRef.current[item.key] != item.size) {
          operateItem?.setTapSize(item.size);
          key2sizeMapRef.current[item.key] = item.size;
        }
      }
    });
  });

  // 防抖后延触发
  const buildSizeStateDebounce = useDebounceForEvent(buildSizeState, 300, { leading: false, trailing: true });
  // 节流前后都触发
  const buildSizeStateThrottle = useThrottleForEvent(buildSizeState, 200, { leading: false, trailing: true });

  /**
   * 响应子元素的宽度尺寸变化
   * @param width
   * @param level
   */
  const onOperTabItemResize = useCreateCallbackForEvent((key, config) => {
    if (key && size2widthMapRef.current[key]) {
      // 按照当前尺寸，进行宽度校准。
      const { size, width } = config;
      if (size2widthMapRef.current[key][size] != width) {
        // 校准准确宽度
        size2widthMapRef.current[key][size] = width;
        buildSizeStateDebounce();
      }
    }
  });

  /**
   * 子元素的初始化
   */
  const onItemInit = useCallback((key: string, { level, sizeWidthMap }, refConfig) => {
    // 判断是否重复
    if (!key2refMapRef.current[key]) {
      // 按顺序写入
      initOrderRef.current.push(key);
      // 存储子元素的操作方法
      key2refMapRef.current[key] = refConfig;
    }
    // 创建
    size2widthMapRef.current[key] = sizeWidthMap;
    // 初始化key2widthMap宽度
    // key2widthMapRef.current[key] = width;
    // 初始化key2sizeMap
    // 不在init的阶段初始化
    // key2sizeMapRef.current[key] = size;
    // 初始化key2levelMap
    key2levelMapRef.current[key] = level;
    // 重新构建内部状态
    buildSizeStateDebounce();
    // 从小计算一下元素的尺寸变化
    // todo: 调用时机必须晚于构建时机
    // reComputeTabSizeDebounce();
  }, []);

  /**
   * 子元素的卸载
   */
  const onItemUnmount = useCallback((key: string) => {
    initOrderRef.current = initOrderRef.current.filter(item => item !== key);

    key2refMapRef.current[key] = null;
    // 初始化key2widthMap宽度
    // key2widthMapRef.current[key] = null;
    // 删除对应的key内部状态
    key2sizeMapRef.current[key] = null;
    size2widthMapRef.current[key];
    // 删除对应的level内部状态
    key2levelMapRef.current[key] = null;
    // 重新构建内部状态
    buildSizeStateDebounce();
  }, []);

  // 监听 wrapRef的宽度变化
  useEffect(() => {
    const wrap = wrapRef?.current;
    if (!wrap) return;
    const resizeObserver = new ResizeObserver(entries => {
      // const { width } = entries[0].contentRect;

      // 节流计算
      buildSizeStateThrottle();
      // 当宽度变化的收，进行重新计算，判断是否需要对子元素进行尺寸变化
      // reComputeTabSizeDebounce();
    });
    resizeObserver.observe(wrap);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 在子元素变化的时候，存储子元素的引用及顺序
  // 该方案废弃，不直接依赖props.children
  // useEffect(() => {
  //   if (!props.children) return;
  //   try {
  //     const map = {};
  //     const childrenArray = Array.isArray(props.children) ? props.children : [props.children];

  //     for (let i = 0; i < childrenArray.length; i++) {
  //       const child = childrenArray[i];
  //       const key = child?.getKey?.();
  //       if (key) {
  //         map[key] = child;
  //       }
  //     }

  //     setKey2refMap(map);
  //   } catch(e) {
  //
  //   }
  // }, [props.children]);

  /**
   * 计算用于透传的props
   */
  const domProps = useMemo(() => {
    return {
      ...props,
      // tabkey: undefined,
      // level: undefined,
      // gapSize: undefined,
      children: undefined,
      // defaultWidth: undefined,
      // smallWidth: undefined,
      // miniWidth: undefined,
    };
  }, [props]);

  return (
    <TabContext.Provider
      value={{
        onOperTabItemResize,
        getLocalKey,
        onItemInit,
        onItemUnmount,
      }}
    >
      <div {...domProps} ref={wrapRef}>
        {props?.children}
      </div>
    </TabContext.Provider>
  );
};

/**
 * 自适应操作面板-项目
 * 用法：包裹需要测量的元素
 * prosp传入 几个尺寸宽度的预估值，差距不太大即可
 * 传入一个回调函数，该函数接收一个size参数，返回一个节点
 * 在尺寸放不下的时候，就会自动回调，传入不同的尺寸值
 */

interface AutoSizeOperTabItemProps {
  // 尺寸
  // size?: 'small' | 'normal';
  // 权重
  level?: number; // 1-10
  // key - 调试用，如果不传入，则自动生成
  tabkey?: string;
  // 预估的尺寸到宽度的映射
  // sizeWidthMap?: sizeWidthMap;
  // 兼容用的间隔
  gapSize?: number;
  // style
  style?: React.CSSProperties;
  // 内容
  children?: React.ReactNode | ((size: TAB_SIZE) => React.ReactNode);
  // 默认宽度 - 预估，相差的不多即可   持续必须严格遵守大小顺序， 不能出现 smallWidth 比 defaultWidth 大的情况
  defaultWidth?: number;
  // small宽度- 预估，相差的不多即可
  smallWidth?: number;
  // 最小宽度- 预估，相差的不多即可
  miniWidth?: number;
  // 兼容其他属性
  [key: string]: any;
}

const AutoSizeOperTabItem = (props: AutoSizeOperTabItemProps) => {
  /**
   * 从控制件获取的属性
   */
  const TabProps = useContext(TabContext);

  const { onOperTabItemResize, getLocalKey, onItemInit, onItemUnmount } = TabProps;

  const { level = 0, tabkey, gapSize = 0, defaultWidth, smallWidth, miniWidth } = props;

  // 组件的尺寸
  const [size, setSize] = useState(TAB_SIZE.NORMAIL);
  // 组件容器的的ref
  const itemWrapRef = useRef<HTMLDivElement>(null);
  // 防抖合并上报尺寸变化-前沿触发，后沿屏蔽
  const onOperTabItemResizeRef = useCreateCallbackForEvent(onOperTabItemResize);
  // useDebounceForEvent(onOperTabItemResize, 300, { leading: true, trailing: false });

  // 本地的key, 用于标识当前组件，如果props没有传入key，则直接使用本地key
  const [localKey] = useState(!tabkey ? getLocalKey() : tabkey);
  // key的ref
  const keyRef = useStateRef(localKey);
  // size的ref
  const sizeRef = useStateRef(size);
  // level的ref
  const levelRef = useStateRef(level);

  /**
   * 外部修改当前组件的尺寸
   */
  const setTapSize = useCallback((size: TAB_SIZE) => {
    setSize(size);
  }, []);

  /**
   * 补全后的sizeWidthMap
   * 补齐为所有key
   */
  const localSizeWidthMap = useMemo(() => {
    return {
      [TAB_SIZE.MINI]: miniWidth || smallWidth || defaultWidth,
      [TAB_SIZE.SMALL]: smallWidth || defaultWidth,
      [TAB_SIZE.NORMAIL]: defaultWidth,
    } as sizeWidthMap;
    // 初始化所有size的宽度状态
    // tabSizeValues.forEach(item => {
    //   res[item] = null;
    // });
    // if (sizeWidthMap) {
    //   tabSizeValues.forEach(item => {
    //     res[item] = sizeWidthMap[item];
    //   });
    // }
    // return res;
  }, [defaultWidth, smallWidth, miniWidth]);

  const localSizeWidthMapRef = useStateRef(localSizeWidthMap);

  /**
   * 外部获取本地key
   */
  const getKey = useCallback(() => {
    return keyRef.current;
  }, []);

  // 组件初始化
  useEffect(() => {
    const resMap: sizeWidthMap = {};

    // tabSizeValues 倒序遍历
    let curWidth = (itemWrapRef.current?.offsetWidth || 0) + gapSize;
    for (let i = tabSizeValues.length - 1; i >= 0; i--) {
      const key = tabSizeValues[i];
      /**
       * 补齐确实的size到宽度的映射
       * 1，全都缺失，使用当前测量尺寸
       * 2.低尺寸确实，使用已有的高尺寸补全
       */
      if (localSizeWidthMapRef?.current[key] == null) {
        resMap[key] = curWidth;
      } else {
        resMap[key] = localSizeWidthMapRef.current[key];
        curWidth = localSizeWidthMapRef.current[key];
      }
    }

    // 通知父组件，当前组件的初始化
    onItemInit?.(
      keyRef.current,
      {
        // width: (itemWrapRef.current?.offsetWidth || 0) + gapSize,
        level: levelRef.current,
        size: sizeRef.current,
        sizeWidthMap: resMap,
      },
      {
        setTapSize,
        getKey,
      }
    );

    return () => {
      // 通知父组件，当前组件的卸载
      onItemUnmount?.(keyRef.current);
    };
  }, []);

  /**
   * 监听item-wrap 的宽度变化 - 上报给父组件
   */
  useEffect(() => {
    const itemWrap = itemWrapRef?.current;
    if (!itemWrap) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;

      onOperTabItemResizeRef?.(keyRef.current, {
        width: width + gapSize,
        level: levelRef.current,
        size: sizeRef.current,
      });
    });

    resizeObserver.observe(itemWrap);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /**
   * 根据props生成内容节点
   * 1.如果是函数，则调用函数
   * 2.如果是节点，则直接返回
   */
  const childrenContent = useMemo(() => {
    if (typeof props.children === 'function') {
      try {
        const fn = props.children;
        return fn(size);
      } catch (e) {
        return <></>;
      }
    }
    return props.children;
  }, [props.children, size]);

  /**
   * 获取当前尺寸下的声明宽度
   */
  // const width = useMemo(() => {
  //   if (sizeWidthMap) {
  //     return sizeWidthMap[size];
  //   }
  //   return null;
  // }, [sizeWidthMap, size]);

  // 将宽度混合到style中
  // const localStyle = useMemo(() => {
  //   if (width != null) {
  //     return {
  //       ...(props?.style || {}),
  //       maxWidth: width,
  //     };
  //   }
  //   return props?.style;
  // }, [props?.style, width]);

  /**
   * 项外部暴露方法
   */
  // useImperativeHandle(Propsref, () => ({
  //   setTapSize,
  //   getKey,
  // }));

  /**
   * 计算用于透传的props
   */
  const domProps = useMemo(() => {
    return {
      ...props,
      tabkey: undefined,
      level: undefined,
      gapSize: undefined,
      children: undefined,
      defaultWidth: undefined,
      smallWidth: undefined,
      miniWidth: undefined,
    };
  }, [props]);

  return (
    <div
      {...domProps}
      ref={itemWrapRef}
      // style={localStyle}
    >
      {childrenContent}
    </div>
  );
};

export { AutoSizeOperTabItem };

export default AutoSizeOperTab;
