/* eslint-disable max-statements */
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { isElectron } from 'api';
import { Menu, Input } from 'antd';
import copy from 'copy-to-clipboard';
import LxPopover from '@web-common/components/UI/LxPopover/LxPopover';
import styles from './index.module.scss';
import classnames from 'classnames';
import { getIn18Text } from 'api';
interface Props {
  changeVal?: (val: string) => void; // 如果input设置了value的双向绑定，需要将setvalue传过来
  inputOutRef: React.Ref<HTMLElement> | Input; // 就靠这个实现了
}

const InputContextMenu: React.FC<Props> = props => {
  const { children, changeVal, inputOutRef } = props;
  const [visible, setVisible] = useState(false);
  const [onlyPaste, setOnlyPaste] = useState(true);
  const [pos, setPos] = useState({
    top: 0,
    left: 0,
  });
  const inputRef = useRef(null);
  // 在 antd Select 组件中 虽然也是操作input标签 但是input的width 很小，不能正常出发contextmenu，所以用input的外层ref触发
  const toggleContextMenuRef = useRef(null);
  const [inputRefFlag, setInputRefFlag] = useState(0);
  const contextMenuFn = e => {
    e.preventDefault();
    let inputEle = inputRef.current;
    if (inputEle) {
      setOnlyPaste(inputEle.selectionStart === inputEle.selectionEnd);
    }
    setVisible(true);
    setPos({ top: e.clientY, left: e.clientX });
  };

  const setNativeValue = (element, value, lastValue) => {
    // 在此方法内取 lastValue 只会触发input 不能触发change
    // let lastValue = element.value;
    element.value = value;
    let event = new Event('input', { bubbles: true });
    // React 15
    event.simulated = true;
    // React 16
    let tracker = element._valueTracker;
    if (tracker) {
      tracker.setValue(lastValue);
    }
    element.dispatchEvent(event);
  };

  const changeInputVal = (inputEle, newValue, val) => {
    setTimeout(() => {
      // focus(); 要在 changeVal 前
      // changeVal 必须在 setVisible前，否则antd 的 Select组件不能正常显示 newValue
      // 定时器也是为了 antd 的 Select组件，那边会有操作将input的值设为空
      inputEle.focus();
      changeVal && changeVal(newValue);
      setVisible(false);
      setNativeValue(inputEle, newValue, val);
    }, 300);
  };

  const onTagCopy = () => {
    if (!inputRef.current) return;
    let inputEle = inputRef.current;
    const val = inputEle?.value === undefined ? '' : inputEle?.value;
    if (val) {
      copy(val.slice(inputEle.selectionStart, inputEle.selectionEnd));
    }
  };
  const onTagCut = () => {
    if (!inputRef.current) return;
    let inputEle = inputRef.current;
    const val = inputEle?.value === undefined ? '' : inputEle?.value;
    if (val) {
      copy(val.slice(inputEle.selectionStart, inputEle.selectionEnd));
      const newValue = val.slice(0, inputEle.selectionStart) + val.slice(inputEle.selectionEnd);
      changeInputVal(inputEle, newValue, val);
    }
  };
  const onTagPaste = async e => {
    if (!inputRef.current) return;
    let inputEle = inputRef.current;
    const val = inputEle?.value === undefined ? '' : inputEle?.value;
    if (inputEle) {
      // inputEle.focus();
      const clipboardData = await navigator.clipboard.readText();
      const newValue = val.slice(0, inputEle.selectionStart) + clipboardData + val.slice(inputEle.selectionEnd);
      changeInputVal(inputEle, newValue, val);
    }
  };

  const hideMenu = () => {
    setVisible(false);
  };

  useEffect(() => {
    if (!toggleContextMenuRef.current) return;
    // if (!inputRef.current || !isElectron()) return;
    let toggleEle = toggleContextMenuRef.current;
    toggleEle.addEventListener('contextmenu', contextMenuFn);
    document.addEventListener('click', hideMenu);
    return () => {
      toggleEle.removeEventListener('contextmenu', contextMenuFn);
      document.removeEventListener('click', hideMenu);
    };
  }, [hideMenu, contextMenuFn, inputRefFlag]);

  useEffect(() => {
    // 常规操作拿不到 inputOutRef?.current 变化
    const timer = setInterval(() => {
      if (inputOutRef?.current) {
        clearInterval(timer);
        // inputOutRef 来源情况
        // antd 的Input 组件
        // antd 的Input.textarea 组件
        // 原生input 标签
        // 原生input 某一层父级原生标签 这个主要是适配 antd Select组件，拿不到里面的input 就曲线救国 给Select包一层div 在从div里面找input
        if (inputOutRef.current?.input) {
          inputRef.current = inputOutRef.current.input;
          toggleContextMenuRef.current = inputOutRef.current.input;
        }
        if (inputOutRef.current?.resizableTextArea) {
          inputRef.current = inputOutRef.current.resizableTextArea.textArea;
          toggleContextMenuRef.current = inputOutRef.current.resizableTextArea.textArea;
        }
        if (inputOutRef.current && inputOutRef.current instanceof HTMLElement) {
          const refTagName = inputOutRef.current.tagName;
          toggleContextMenuRef.current = inputOutRef.current;
          if (['INPUT', 'TEXTAREA'].includes(refTagName)) {
            inputRef.current = inputOutRef.current;
          } else {
            const mayInput = inputOutRef.current.querySelector('input');
            const mayText = inputOutRef.current.querySelector('textarea');
            inputRef.current = mayInput || mayText;
          }
        }
        // inputRef 更新后不能render页面，加个辅助变量刷新页面
        setInputRefFlag(pre => ++pre);
      }
    }, 300);
    return () => {
      clearInterval(timer);
    };
  }, [children]);

  return (
    <>
      {children}
      <LxPopover top={pos.top} left={pos.left} visible={visible}>
        <Menu className={classnames(styles.menu, 'sirius-no-drag')}>
          <Menu.Item onClick={onTagCopy} hidden={onlyPaste}>
            {getIn18Text('FUZHI')}
          </Menu.Item>
          <Menu.Item onClick={onTagCut} hidden={onlyPaste}>
            {getIn18Text('JIANQIE')}
          </Menu.Item>
          <Menu.Item onClick={onTagPaste}>{getIn18Text('ZHANTIE')}</Menu.Item>
        </Menu>
      </LxPopover>
    </>
  );
};
export default InputContextMenu;
