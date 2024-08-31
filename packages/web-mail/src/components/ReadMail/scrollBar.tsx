/**
 * 虚拟滚动条组件
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import './scrollBar.scss';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';
import { useUpdateEffect } from 'ahooks';

interface Props {
  /**
   * 距离左边的距离
   */
  scrollLeft: number;
  /**
   * 所代表目标区域元素的宽度
   */
  scrollWidth: number;
  /**
   * 滚动事件
   */
  onScroll: (position: number) => void;
  /**
   * 水平边距
   * 虚拟滚动条未必就要铺满整个元素，有的时候需要两边有一些边距
   */
  horizontalPadding?: number;
  /**
   * 是否展示
   */
  show?: boolean;
  /**
   * 滑动目标区域的key
   * 用于所带表的区域切换的时候，滚动条的平滑移动
   */
  tabKey?: string;
  /**
   * 是否处于windows系统
   * 用于一些特殊样式的展示
   */
  inWindows?: boolean;
  /**
   * 滚动条的用户操作滑动状态变化
   */
  onScrollChange?: (state: boolean) => void;
}

const HorizontalScrollBar: React.FC<Props> = props => {
  const { scrollLeft = 0, scrollWidth = 0, onScroll, show = true, tabKey, horizontalPadding = 0, onScrollChange, inWindows = false } = props;

  /**
   * 滚动条的内部-距离左边位置
   */
  const [thumbPosition, setThumbPosition] = useState(0);
  /**
   * 滚动条的容器宽度
   */
  const [thumbWidth, setThumbWidth] = useState(0);
  /**
   * 容器DomRef
   */
  const trackRef = useRef<HTMLElement>(null);
  /**
   * 模拟滚动条滑块DomRef
   */
  const thumbRef = useRef<HTMLElement>(null);
  /**
   * 锁-用于在拖拽的过程中屏蔽sl触发的位置重新计算
   */
  const lock = useRef(false);
  /**
   * 是否显示平滑滚动动画
   */
  const [showAn, setShowAn] = useState(false);
  // 为了解决位置和展示不同步造成的闪动
  const [localShow, setLocalShow] = useState(show);

  const onScrollChangeRef = useCreateCallbackForEvent((state: boolean) => onScrollChange && onScrollChange(state));

  const onScrollRef = useCreateCallbackForEvent(onScroll);

  /**
   * 处理虚拟滚动条的横向滚动事件
   */
  const handleScroll = useCallback(() => {
    if (trackRef.current && thumbRef.current && trackRef.current?.getBoundingClientRect && thumbRef.current?.getBoundingClientRect) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const thumbRect = thumbRef.current.getBoundingClientRect();
      // 计算滑块可以滑动的最大值
      const thumbMax = trackRect.width - horizontalPadding * 2 - thumbRect.width;
      const scrollPos = scrollLeft || 0;
      // 计算滑块的当前缩放位置
      const thumbPos = Math.max(0, Math.min((scrollPos / scrollWidth) * trackRect.width, thumbMax));
      setThumbPosition(thumbPos);
    }
  }, [scrollLeft, scrollWidth]);

  /**
   * 处理滑块的拖拽移动
   */
  const handleDragMove = useCallback(
    event => {
      onScrollChangeRef(true);
      if (trackRef.current && thumbRef.current && trackRef.current?.getBoundingClientRect && thumbRef.current?.getBoundingClientRect) {
        const trackRect = trackRef.current.getBoundingClientRect();
        const thumbRect = thumbRef.current.getBoundingClientRect();
        const thumbMax = trackRect.width - horizontalPadding * 2 - thumbRect.width;
        const thumbX = event.clientX - trackRect.left - thumbRect.width / 2;
        const thumbPos = Math.max(0, Math.min(thumbX, thumbMax));
        const scrollPos = (thumbPos / trackRect.width) * scrollWidth;
        setThumbPosition(thumbPos);
        onScrollRef(scrollPos);
      }
    },
    [scrollWidth, horizontalPadding]
  );
  const handleDragMoveRef = useCreateCallbackForEvent(handleDragMove);

  /**
   * 处理拖拽结束事件
   */
  const handleDragEnd = useCallback(() => {
    onScrollChangeRef(false);
    lock.current = false;
    document.removeEventListener('mousemove', handleDragMoveRef);
    document.removeEventListener('mouseup', handleDragEndRef);
  }, []);
  const handleDragEndRef = useCreateCallbackForEvent(handleDragEnd);

  /**
   * 处理滑块的拖拽开始
   */
  const handleDragStart = useCallback(event => {
    event.preventDefault();
    event.stopPropagation();
    lock.current = true;
    document.addEventListener('mousemove', handleDragMoveRef);
    document.addEventListener('mouseup', handleDragEndRef);
  }, []);

  const updateBarPosition = () => {
    if (trackRef.current && !lock.current) {
      // const trackRect = trackRef.current.width;
      const thumbMaxWidth = trackRef.current.clientWidth - horizontalPadding * 2;
      const thumbWidth = Math.max(20, (thumbMaxWidth / scrollWidth) * thumbMaxWidth);
      setThumbWidth(thumbWidth);
      handleScroll();
    }
  };
  const updateBarPositionRef = useCreateCallbackForEvent(updateBarPosition);

  // 宽度，距离左边变化的收，重新计算位置
  useEffect(() => {
    updateBarPositionRef();
  }, [scrollLeft, scrollWidth]);

  /**
   * 监听结构宽度变化,同步滚动条的状态
   */
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      updateBarPositionRef();
    });
    if (trackRef?.current) {
      observer.observe(trackRef?.current);
      return () => {
        if (trackRef?.current) {
          observer.unobserve(trackRef?.current);
        }
      };
    }
  }, []);

  /**
   * 监听tabKey的变化以实现动画的平滑滚动
   */
  useUpdateEffect(() => {
    if (tabKey) {
      setShowAn(true);
      setTimeout(() => {
        setShowAn(false);
      }, 500);
    }
  }, [tabKey]);

  /**
   * 装填变化的时候，重新计算一下滚动条的位置
   */
  useEffect(() => {
    updateBarPositionRef();
    setLocalShow(show);
  }, [show]);

  return (
    <div
      className={` vscrollbar-readmail horizontal ${localShow ? 'show' : 'hidden'} ${inWindows ? 'vst_inWindow' : ''}`}
      style={{ margin: `0px ${horizontalPadding}px` }}
    >
      <div className="track" ref={trackRef}>
        <div
          className={`thumb ${showAn ? 'scrollAn' : ''}`}
          ref={thumbRef}
          style={{ left: `${thumbPosition}px`, width: `${thumbWidth}px` }}
          onMouseDown={handleDragStart}
        />
      </div>
    </div>
  );
};

export default HorizontalScrollBar;
