/**
 * 在正文内容超高超宽的情况下，底部的横向滚动条会超出当前可是区域。
 * 显示一个悬浮与底部的虚拟滚动条来解决这个问题。
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';

interface WrapCompenentProps {
  [key: string]: any;
}

interface VrticalScrollWrapProps {
  [key: string]: any;
}

interface HorizontalScrollWrapProps {
  [key: string]: any;
}

interface ConfigProps {
  /**
   * 内容上边框判断偏移
   */
  contentRectTopOffset?: number;
  /**
   * 内容下边框判断偏移
   */
  contentRectBottomOffset?: number;
}

const useFixedScroolBar = (config: ConfigProps) => {
  const { contentRectTopOffset = 0, contentRectBottomOffset = 0 } = config || {};

  /**
   * 横向滚动区域 key2ref 的map
   */
  const contentRefMap = useRef<{ [key: string]: HTMLElement }>({});
  /**
   * 存储横向滚动条距离左边的距离
   */
  const [stateMap, setStateMap] = useState<{ [key: string]: number }>({});
  /**
   * 虚拟滚动条显示的是哪块content的横向距离
   * 也可以说，基线现在处于哪块content的范围中
   */
  const [activeTab, setActiveTab] = useState<string | null>(null);
  /**
   * 上下滑动区域wrap的ref
   */
  const vrticalScrollWrapRef = useRef<HTMLDivElement | undefined | null>();
  /**
   * content变化区域
   */
  const contentGroupWrapRef = useRef<HTMLDivElement | undefined | null>();
  /**
   * 用于存储子元素的宽度
   */
  const [contentWidthMap, setContentWidthMap] = useState<{ [key: string]: number }>({});

  /**
   * ************************************************** 用于导出的业务状态
   */

  /**
   * 虚拟滚动条是否展示
   */
  const vScrollBarShow = useMemo(() => {
    return (
      !!activeTab && !!(contentWidthMap[activeTab] && contentRefMap.current[activeTab] && contentWidthMap[activeTab] > contentRefMap.current[activeTab]?.clientWidth)
    );
  }, [activeTab, contentWidthMap]);

  /**
   * 当前滚动条距离左边的距离
   */
  const vScrollBarLeft = useMemo(() => {
    return activeTab ? stateMap[activeTab] || 0 : 0;
  }, [activeTab, stateMap]);

  /**
   * 虚拟滚动条需要表示的真实内容范围
   */
  const vScrollBarWidth = useMemo(() => {
    return activeTab && contentWidthMap ? contentWidthMap[activeTab] : 0;
  }, [activeTab, contentWidthMap]);

  /**
   * 设置于Content的宽度
   */
  const setContentWidth = useCallback((key, value) => {
    if (key) {
      setContentWidthMap(map => {
        return {
          ...map,
          [key]: value,
        };
      });
    }
  }, []);
  const setContentWidthRef = useCreateCallbackForEvent(setContentWidth);

  /**
   * 重建元素的高度范围，并根据st进行基线对比判断是否进入了content的范围
   */
  const updateScrollBarState = useCallback(() => {
    if (!vrticalScrollWrapRef?.current || vrticalScrollWrapRef?.current?.clientHeight == null) {
      return false;
    }
    // 获取基线（视窗˝底边的st表示）
    const aimRect = vrticalScrollWrapRef?.current?.getBoundingClientRect();
    const line = aimRect?.top + aimRect.height;

    // 根据当前可是范围，设置选中的值
    const rangList = [];
    // 根据ref遍历出元素的高度，距离顶部的st,
    if (contentRefMap.current) {
      for (let i in contentRefMap.current) {
        const item = contentRefMap.current[i];
        if (item) {
          const config = item.getBoundingClientRect();
          rangList.push({
            start: config.top + contentRectTopOffset,
            end: config.height + config.top + contentRectBottomOffset,
            key: i,
          });
        }
      }
    }
    // 判断st是否进入了范围
    const res = rangList.find(item => line > item.start && line < item.end);
    if (res) {
      setActiveTab(res.key);

      if (stateMap && stateMap[res.key] != null && contentRefMap.current[res.key] != null && stateMap[res.key] != contentRefMap.current[res.key]?.scrollLeft) {
        // 直接改引用
        setStateMap(map => {
          map[res.key] = contentRefMap.current[res.key]?.scrollLeft;
          return map;
        });
      }
    } else {
      setActiveTab(null);
    }
  }, [stateMap, setStateMap, contentRectTopOffset, contentRectBottomOffset]);

  const updateScrollBarStateRef = useCreateCallbackForEvent(updateScrollBarState);

  /**
   * 处理虚拟滚动条的滑动事件
   */
  const handleVScrollOnScroll = useCallback(
    sl => {
      if (activeTab && contentRefMap.current[activeTab]) {
        contentRefMap.current[activeTab].scrollLeft = sl;
      }
      setStateMap(res => {
        res[activeTab] = sl;
        return res;
      });
    },
    [activeTab]
  );
  const handleVScrollOnScrollRef = useCreateCallbackForEvent(handleVScrollOnScroll);

  /**
   * 最外层的包裹元素
   */
  const WrapCompenent = useCallback((props: WrapCompenentProps) => {
    const { className } = props;
    return (
      <div {...props} className={className ? className + ' vscrollbar-wrap-readmail' : ''}>
        {props.children}
      </div>
    );
  }, []);

  /**
   * 上下滑动区域
   */
  const VrticalScrollWrapComponent = useCallback(
    forwardRef((props: VrticalScrollWrapProps, ref) => {
      const { onScroll } = props;
      return (
        <div
          {...props}
          ref={_ref => {
            if (vrticalScrollWrapRef) {
              vrticalScrollWrapRef.current = _ref;
            }
            if (ref && ref.current !== undefined) {
              ref.current = _ref;
            }
          }}
          onScroll={event => {
            updateScrollBarStateRef(event);
            // 对原有绑定的onScroll 进行调用
            if (onScroll && typeof onScroll === 'function') {
              onScroll(event);
            }
          }}
        >
          {props.children}
        </div>
      );
    }),
    []
  );

  /**
   * 横向滚动区域
   */

  const HorizontalScrollWrapComponent = useCallback((props: HorizontalScrollWrapProps) => {
    const { onScroll, refkey } = props;

    return (
      <div
        {...props}
        ref={_ref => {
          contentRefMap.current[refkey] = _ref;
        }}
        // 可能需要默认的滚动样式
        onScroll={event => {
          const target = event.target;
          const leftOffset = target.scrollLeft;
          setStateMap(res => {
            return {
              ...res,
              [refkey]: leftOffset,
            };
          });
          // 对原有绑定的onScroll 进行调用
          if (onScroll && typeof onScroll === 'function') {
            onScroll(event);
          }
        }}
      >
        {props.children}
      </div>
    );
  }, []);

  /**
   * 内容集合高度变化测量
   */

  const ContentMeasurement = useMemo(
    () => (props: HorizontalScrollWrapProps) => {
      /**
       * 监听结构宽度变化
       */
      useEffect(() => {
        const observer = new ResizeObserver(entries => {
          // 处理尺寸变化事件
          updateScrollBarStateRef();
        });
        if (contentGroupWrapRef?.current) {
          observer.observe(contentGroupWrapRef?.current);
          return () => {
            observer.unobserve(contentGroupWrapRef?.current);
          };
        }
      }, []);

      return (
        <div {...props} ref={contentGroupWrapRef}>
          {props.children}
        </div>
      );
    },
    []
  );

  // 也返回对应的绑定方法，提供定制化
  return {
    /**
     * 最外层的包裹层，用于实现鼠标进入才显示滚动条
     */
    WrapCompenent,
    /**
     * 上下滑动区域，监听当前到底处于哪个content
     */
    VrticalScrollWrapComponent,
    /**
     * 水平滑动区域监听，用于同步滚动条位置
     */
    HorizontalScrollWrapComponent,
    /**
     * 监听结构宽度，同步滚动条
     */
    ContentMeasurement,
    /**
     * 当前处在哪个区域
     */
    activeTab,
    /**
     * 处理虚拟滚动条的横向滚动
     */
    handleVScrollOnScroll: handleVScrollOnScrollRef,
    /**
     * 设置内容宽度
     */
    setContentWidth: setContentWidthRef,
    /**
     * 虚拟滚动条是否展示
     */
    vScrollBarShow,
    /**
     * 虚拟滚动条距离左边的距离
     */
    vScrollBarLeft,
    /**
     * 虚拟滚动条的宽度
     */
    vScrollBarWidth,
  };
};

export default useFixedScroolBar;
