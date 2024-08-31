/**
 * 蒙层引导
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import HasMaskGuideContent, { HasMaskGuideContentProps } from './hasMaskGuideContent';
import useWindowSize from '@web-common/hooks/windowResize';
import ReactDOM from 'react-dom';

interface HollowOutGuideProps {
  guideId: string;
  step?: number;
  title: React.ReactNode;
  intro?: string | JSX.Element;
  refresh?: number;
  renderFooter?: JSX.Element;
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  padding?: number[];
  borderRadius?: number;
  children: React.ReactNode;
  targetWidth?: number;
  targetHeight?: number;
  arrowDistance?: number;
  okText?: string;
  showSideBar?: boolean;
  showArrow?: boolean;
  onClose?: () => void;
  show?: boolean;
  onStep: number;
}

let calcPosTimer = null;

const HasMaskGuide: React.FC<HollowOutGuideProps> = props => {
  const {
    guideId,
    step,
    title,
    intro,
    refresh,
    renderFooter,
    placement,
    padding = [0, 0, 0, 0],
    borderRadius,
    children,
    okText,
    targetWidth,
    targetHeight,
    arrowDistance,
    showSideBar,
    showArrow,
    show,
    onStep,
    onClose,
    className,
  } = props;

  const [position, setPosition] = useState<any>();

  const paddingTop = useMemo(() => padding[0], [padding]);
  const paddingRight = useMemo(() => padding[1], [padding]);
  const paddingBottom = useMemo(() => padding[2], [padding]);
  const paddingLeft = useMemo(() => padding[3], [padding]);

  const rangestartRef = useRef<any>(null);
  const rangeendRef = useRef<any>(null);
  const range = useMemo(() => {
    if (rangestartRef.current && rangeendRef.current) {
      const range = typeof Range === 'function' ? new Range() : document.createRange();
      range.setStartBefore(rangestartRef.current);
      range.setEndAfter(rangeendRef.current);
      return range;
    }
    return null;
  }, [rangestartRef.current, rangeendRef.current]);

  // 窗口缩放
  const offset = useWindowSize(false);

  // 获取目标元素位置
  const calcPos = useCallback(() => {
    if (!show || !range) {
      return;
    }
    const triggerRefDom = Array.from(range.commonAncestorContainer.childNodes).slice(range.startOffset + 1, range.endOffset - 1);
    if (triggerRefDom) {
      // 300ms的定时器是为了解决 getBoundingClientRect 在dom未渲染完成时候，拿到数据不准确问题，但是 300ms 并不是一个绝对能解决问题的延时。正确的方式，是目标元素要css设置宽高。
      calcPosTimer = setTimeout(() => {
        let minx = 100000;
        let miny = 100000;
        let maxx = 0;
        let maxy = 0;
        triggerRefDom.forEach((node: any) => {
          if (node.nodeType !== 3) {
            // 文本节点会跳过计算，目标元素文本最好被标签包裹
            const { x, y, width, height } = node.getBoundingClientRect();
            if (width > 0 && height > 0) {
              if (x < minx) {
                minx = x;
              }
              if (y < miny) {
                miny = y;
              }
              if (x + width > maxx) {
                maxx = x + width;
              }
              if (y + height > maxy) {
                maxy = y + height;
              }
            }
          }
        });
        if (minx !== 100000) {
          let width = targetWidth ? targetWidth : maxx - minx + paddingLeft + paddingRight;
          let height = targetHeight ? targetHeight : maxy - miny + paddingTop + paddingBottom;
          setPosition({
            x: minx - paddingLeft,
            y: miny - paddingTop,
            height: height,
            width: width,
          });
        }
      }, 300);
    } else {
      setPosition(null);
    }
  }, [show, range, refresh, targetWidth, targetHeight, paddingLeft, paddingRight, paddingBottom, paddingTop]);

  // 锚点元素发生变化 切换聚焦点
  useEffect(() => calcPos(), [show, range, refresh, offset]);

  // 弹窗
  const Content = useCallback(() => {
    const maskProps: HasMaskGuideContentProps = {
      show,
      position,
      showSideBar,
      borderRadius,
      placement,
      showArrow,
      arrowDistance,
      title,
      intro,
      renderFooter,
      guideId,
      step,
      onStep,
      okText,
      onClose,
      className,
    };
    return <HasMaskGuideContent {...maskProps} />;
  }, [show, position, showSideBar, borderRadius, placement, showArrow, arrowDistance, title, intro, renderFooter, guideId, step, onStep, okText, onClose]);

  return (
    <>
      <span ref={rangestartRef} style={{ display: 'none' }}></span>
      {children}
      <span ref={rangeendRef} style={{ display: 'none' }}></span>
      {document?.body ? ReactDOM.createPortal(<Content />, document.body) : <Content />}
    </>
  );
};
export default HasMaskGuide;
