/**
 * 通用组件-快捷键录入
 * 功能：从键盘录入用户按下的快捷键
 * 支持编辑，自定义异常
 * 2023-12-05
 */

/**
 * doc:
 *  1.value 设计为 原始值字符数组，是考虑到，用于显示的值可能会变化，但绑定的键位不会变，所以存储一定要存储原始值。
 */

import React, { useEffect, useCallback, useMemo, useState, useContext, useRef } from 'react';
import { Input } from 'antd';
// import IconCard from '@web-common/components/UI/IconCard';
import { getIn18Text } from 'api';
import classnames from 'classnames';
import styles from './KeySwiftInput.module.scss';
import { formatHotKey } from '@web-mail/util';

interface KeySwiftInputProps {
  // 快捷键的默认值
  defaultValue?: string[];
  // 快捷键的值
  value?: string[];
  // 快捷键的值改变时触发
  onChange?: (value: string[]) => void;
  // 合法检测
  valid?: (value: string[]) => boolean;
  // 提示文字
  placeholder?: string;
  // 类名
  className?: string;
  // 样式
  style?: React.CSSProperties;
  // 测试标记id
  _data_test_id?: string;
  // 验证出现错误
  onValidError?: (value: string[]) => void;
  // 验证成功
  onValidSuccess?: (value: string[]) => void;
}

const specialKey = ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'];

// 用于存储的原始值字符串
const globalShortcutKey = ['Command', 'Ctrl', 'Shift', 'Alt'];

const KeySwiftInput = (props: KeySwiftInputProps) => {
  const { value, onChange, valid, placeholder = getIn18Text('QINGSHURUBIANQIANKJJ'), className, style, _data_test_id, onValidError, onValidSuccess } = props;
  // 当前操作的快捷键显示值
  const [editCaptureInputVal, setEditCaptureInputVal] = useState(value);
  // 是否展示错误状态
  const [conflict, setConflict] = useState(false);

  // 获取用户按下的组合键
  const getPressKey = (e: React.KeyboardEvent) => {
    const key = e.key;

    const registerKeys = [];
    specialKey.forEach((item, index) => {
      if (e[item]) {
        registerKeys.push(globalShortcutKey[index]);
      }
    });
    if (/^\w$/.test(key) || key === 'Enter') {
      registerKeys.push(key.toUpperCase());
      return registerKeys;
    }
    return [];
  };

  // 处理key值改变
  const handleKeyChange = (keys: string[]) => {
    onChange && onChange(keys);
  };

  // 监听键盘按下事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 拦截快捷键的默认功能
    e.preventDefault();
    e.stopPropagation();
    // 如果是删除键
    if (e.keyCode === 8) {
      setEditCaptureInputVal([]);
      handleKeyChange([]);
      return;
    }
    // 提取事件中的按键
    const validKeys = getPressKey(e);

    setEditCaptureInputVal(validKeys);

    handleKeyChange(validKeys);
  };

  const hotKeyStr = useMemo(() => {
    return formatHotKey(editCaptureInputVal);
  }, [editCaptureInputVal]);

  useEffect(() => {
    if (value != editCaptureInputVal) {
      setEditCaptureInputVal(value);
    }
  }, [value]);

  useEffect(() => {
    if (valid) {
      // 显示判断 是否为false
      if (valid(editCaptureInputVal || []) === false) {
        setConflict(true);
        onValidError && onValidError(editCaptureInputVal || []);
      } else {
        setConflict(false);
        onValidSuccess && onValidSuccess(editCaptureInputVal || []);
      }
    }
  }, [editCaptureInputVal]);

  return (
    <Input
      data-test-id={_data_test_id}
      onKeyDown={handleKeyDown}
      value={hotKeyStr}
      // onClick={e => e.nativeEvent.stopImmediatePropagation()}
      placeholder={placeholder}
      style={style}
      className={classnames(className, {
        [styles.error]: conflict,
      })}
      // suffix={
      //   <span
      //     // className={styles.editCaptureEditIcon}
      //     onClick={e => {
      //       setEditCaptureInputVal([]);
      //     }}
      //   >
      //     <IconCard type="closeCircle" />
      //   </span>
      // }
    />
  );
};

export default KeySwiftInput;
