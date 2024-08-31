import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import classnames from 'classnames';
import { Dropdown } from 'antd';
import style from './ellipsisMore.module.scss';

const pixelToNumber: (pixel: string) => number = pixel => parseInt(pixel.replace('px', ''), 10);

interface EllipsisMoreProps {
  className?: string;
  dots?: React.ReactElement;
  renderEllipsisDropdown?: (ellipsisCount: number) => React.ReactChild;
  [propName: string]: any;
  dropdownStyle?: CSSProperties;
  addElement?: React.ReactElement;
  ellipsisColor?: string;
  ellipsisBgColor?: string;
}

const defaultDots: React.ReactElement = <span className={style.ellipsisMoreDefaultDots} />;
const SELECTOR = 'ellipsisMore-module--ellipsis-more-mirror-atom';
const EllipsisMore: React.FC<EllipsisMoreProps> = props => {
  const { className, children, dots, renderEllipsisDropdown, addElement, ellipsisColor, ellipsisBgColor, ...restProps } = props;
  // 整个容器宽度
  const [width, setWidth] = useState<number>(0);
  // 最后一个镜像元素的index
  const [lastIndex, setLastIndex] = useState<number>(0);
  // 是否展示...
  const [dotsVisible, setDotsVisible] = useState<boolean>(false);
  // ...中的标签数量
  const [ellipsisCount, setEllipsisCount] = useState<number>(0);
  // 整个容器
  const ellipsisRef = useRef<HTMLDivElement>(null);
  // 镜像标签容器
  const mirrorRef = useRef<HTMLDivElement>(null);
  // ...元素容器
  const dotsRef = useRef<HTMLDivElement>(null);
  // 标签数量大于可展示的标签数量时，展示...并计算收入...的标签数
  useEffect(() => {
    const count = React.Children.count(children);
    setDotsVisible(count > lastIndex + 1);
    setEllipsisCount(count - lastIndex - 1);
  }, [children, lastIndex]);

  useEffect(() => {
    let timeout = setTimeout(() => {
      if (!mirrorRef.current) return () => {};
      // 获取所有根据标签创建的镜像元素
      const mirrorNodes: NodeListOf<HTMLSpanElement> = mirrorRef.current.querySelectorAll(`.${SELECTOR}`);
      // const mirrorNodes: NodeListOf<HTMLSpanElement> = mirrorRef.current.querySelectorAll(`.${style.ellipsisMoreMirrorItem}`);
      let lastIndex = 0;
      let lastOffsetLeft = -1;
      // 遍历镜像元素 最终获取到与容器左侧距离最大的镜像标签的index和它与容器左侧的距离
      for (let index = 0; index < mirrorNodes.length; index++) {
        const { offsetLeft } = mirrorNodes[index];

        if (offsetLeft > lastOffsetLeft) {
          lastIndex = index;
          lastOffsetLeft = offsetLeft;
        } else {
          break;
        }
      }
      if (!dotsRef.current) {
        setLastIndex(lastIndex);
      } else {
        const lastChild = mirrorNodes[lastIndex];
        if (!lastChild) return () => {};
        // 设置
        const { offsetLeft, offsetWidth } = lastChild;
        const { marginRight } = getComputedStyle(lastChild, null);
        const dotsStartLeft = offsetLeft + offsetWidth + pixelToNumber(marginRight);
        const dotsRemainWidth = width - dotsStartLeft;
        const shouldReduceVisibleCount = lastIndex !== mirrorNodes.length - 1 && dotsRemainWidth - dotsRef.current.offsetWidth < 0;
        // 在...和添加按钮都展示的场景下，index左移为添加按钮留出位置
        const baseIndex = shouldReduceVisibleCount ? lastIndex - 1 : lastIndex;
        // if (mirrorNodes.length > baseIndex + 1) {
        //   baseIndex -= 1;
        // }
        setLastIndex(baseIndex);
      }
    }, 100);

    return () => {
      timeout && clearTimeout(timeout);
    };
  }, [width, children, mirrorRef.current]);

  // 创建对整个容器的观察对象
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    let resizeObserver: ResizeObserver | null = null;
    timeout = setTimeout(() => {
      if (ellipsisRef.current) {
        resizeObserver = new ResizeObserver(entries => {
          entries.forEach(entry => {
            setWidth(entry.contentRect.width);
          });
        });

        resizeObserver.observe(ellipsisRef.current);
      }
    });
    return () => {
      timeout && clearTimeout(timeout);
      resizeObserver && resizeObserver.disconnect();
    };
  }, [children]);

  return (
    <div className={classnames(style.ellipsisMore, className)} ref={ellipsisRef} {...restProps}>
      {React.Children.map(children as React.ReactElement[], (child, index) =>
        index <= lastIndex
          ? React.cloneElement(child, {
              className: classnames(style.ellipsisMoreItem, child.props.className),
            })
          : null
      )}
      {dotsVisible && (
        <Dropdown overlayClassName={style.ellipsisMoreDropdown} overlayStyle={props.dropdownStyle} overlay={<>{renderEllipsisDropdown?.(ellipsisCount)}</>}>
          {React.cloneElement(dots as React.ReactElement, {
            className: classnames(style.ellipsisMoreDots, dots?.props.className),
            ref: dotsRef,
            style: { color: ellipsisColor, backgroundColor: ellipsisBgColor },
          })}
        </Dropdown>
      )}
      {addElement}
      <div className={style.ellipsisMoreMirror} ref={mirrorRef} style={{ width }}>
        {React.Children.map(children as React.ReactElement[], child =>
          React.cloneElement(child, {
            className: classnames(style.ellipsisMoreMirrorItem, SELECTOR, style.ellipsisMoreItem, child.props.className),
          })
        )}
      </div>
    </div>
  );
};

EllipsisMore.defaultProps = {
  dots: defaultDots,
  renderEllipsisDropdown: ellipsisCount => `剩余 ${ellipsisCount} 项`,
};

export default EllipsisMore;
