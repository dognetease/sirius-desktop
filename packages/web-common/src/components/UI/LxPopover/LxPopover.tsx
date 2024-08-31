/*
 * @Author: your name
 * @Date: 2021-11-01 15:40:04
 * @LastEditTime: 2022-10-20 12:06:18
 * @LastEditors: zhangbinbin zhangbinbin03@corp.netease.com
 * @Description: In User Settings Edit
 * @FilePath: /dev-wlj/packages/@web-common/components/UI/LxPopover/LxPopover.tsx
 */
import React, { ReactNode, useRef, useEffect, useState, Dispatch, SetStateAction, ReactElement } from 'react';
import ReactDOM from 'react-dom';
import { inWindow } from 'api';

interface Props {
  top: number;
  left: number;
  right?: number;
  bottom?: number;
  children: ReactElement | undefined;
  visible: boolean;
  acceptTopBottom?: boolean;
  setVisible?: Dispatch<SetStateAction<boolean>>;
  offset?: [number, number];
  height?: number;
  resetStyle?: React.CSSProperties;
}

/**
 * @description: 在坐标处(光标),展示内容。需要根据内容调整在上下左右显示
 * @param {top, left, right, bottom} 光标位置
 * @param {acceptTopBottom} 是children组件是否接收 top bottom 参数自己调整位置
 * @param {offset} 自定义偏移量
 * @return {*}
 */
const LxPopover: React.FC<Props> = ({ top, left, right, bottom, resetStyle = {}, children, visible, setVisible, acceptTopBottom, offset = [], height = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  // 内容的left
  const [leftCur, setLeftCur] = useState(0);
  const [topCur, setTopCur] = useState(0);
  const [offsetX = 0, offsetY = 0] = offset;
  const leftAfterOffset = left + +offsetX;
  const rightAfterOffset = top + +offsetY;
  // 内容在anchor的上方还是下方
  const [mailAtResultPos, setMailAtResultPos] = useState<'top' | 'bottom'>('bottom');
  const [childrenWithProps, setChildrenWithProps] = useState('');
  useEffect(() => {
    if (ref.current) {
      const { clientWidth } = ref.current;
      let { clientHeight } = ref.current;
      if (height) {
        clientHeight = height;
      }
      setLeftCur(leftAfterOffset);
      setTopCur(rightAfterOffset);
      setMailAtResultPos('bottom');
      if (right && clientWidth > right) {
        // 内容需要在左边 12是@的宽度 确保内容不盖住@符号
        setLeftCur(leftAfterOffset - clientWidth - 12);
      }

      if (bottom && clientHeight > bottom) {
        // 内容需要在上方
        if (acceptTopBottom) {
          // children组件接收top bottom 参数自己调整位置
          setMailAtResultPos('top');
          return;
        }
        // 调整到上方
        let topPos = rightAfterOffset - clientHeight - offsetY;
        // 如果children top最高到距离浏览器20像素处，主要防止内容超出浏览器 20为了好看
        if (topPos < 20) {
          topPos = 20;
        }
        setTopCur(topPos);
      }
    }
  }, [right, bottom, acceptTopBottom, offsetX, offsetY, leftAfterOffset, rightAfterOffset, height]);

  const delegateVisible = e => {
    if (!ref.current?.contains(e.target)) {
      setVisible && setVisible(false);
    }
  };

  useEffect(() => {
    document.body.addEventListener('click', delegateVisible);
    return () => {
      document.body.removeEventListener('click', delegateVisible);
    };
  }, []);

  useEffect(() => {
    const childMap = React.Children.map(children, child => React.cloneElement(child, { resultPos: mailAtResultPos }));
    setChildrenWithProps(childMap);
  }, [children, mailAtResultPos]);

  const child = (
    <div
      className="lx-popover"
      style={{
        position: 'absolute',
        zIndex: '1051',
        background: '#FFFFFF',
        boxShadow: '0px 4px 8px rgb(38 42 51 / 20%)',
        borderRadius: '6px',
        top: topCur - 5,
        left: leftCur,
        ...resetStyle,
      }}
      ref={ref}
      hidden={!visible}
    >
      {childrenWithProps}
    </div>
  );
  if (!inWindow()) return <></>;
  return ReactDOM.createPortal(child, document.body);
};

export default LxPopover;
