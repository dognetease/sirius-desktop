import { getIn18Text } from 'api';
import React, { FC, useState, useEffect, useRef } from 'react';
import { Input, Button, Tooltip } from 'antd';
import classnames from 'classnames/bind';

import styles from './mailInput.module.scss';
import { OverflowShowTooltips } from '../OverflowShowTooltips';

const realStyle = classnames.bind(styles);

let timer: NodeJS.Timeout;
let timer2: NodeJS.Timeout;
let flag = false;
export const MailInput: FC<{
  defaultValue: string;
  valueChange: (value: string) => void;
  needInput: boolean;
  displayClassName?: string;
}> = props => {
  const { defaultValue, valueChange, needInput, displayClassName } = props;
  const [value, setValue] = useState<string>(defaultValue);
  const [showOp, setShowOp] = useState<boolean>(false);
  const [showInput, setShowInput] = useState<boolean>(false);
  const [showTip, setShowTip] = useState(false);
  const ref = useRef<Input | null>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const node = (
    <Input
      ref={ref}
      className={`${styles.inputWrapper} ${showOp ? styles.inputWrapper2 : ''}`}
      onChange={e => {
        setValue(e.target.value);
      }}
      value={value}
      onBlur={e => {
        clearTimeout(timer);
        clearTimeout(timer2);
        timer2 = setTimeout(() => {
          setShowOp(false);
          setShowInput(false);
        }, 400);
        if (flag) {
          flag = false;
          return;
        }
        // 失去焦点不能保存数据
        const value = e.target.value;
        // setValue(defaultValue);
        timer = setTimeout(() => {
          if (value === '') {
            // 非空需要延迟设置，方便保存操作
            setValue(defaultValue);
          } else {
            // setValue(value);
            valueChange(value);
          }
        }, 500);
      }}
      onFocus={() => setShowOp(true)}
      suffix={
        <>
          {showOp ? (
            <>
              <a
                className={value === '' ? styles.disabledLink : ''}
                onClick={e => {
                  clearTimeout(timer);
                  clearTimeout(timer2);
                  if (value === '') {
                    return;
                  }
                  flag = true;
                  ref?.current?.blur();
                  valueChange(value);
                }}
                style={{
                  fontSize: 12,
                }}
              >
                {getIn18Text('BAOCUN')}
              </a>
              <a
                onClick={e => {
                  clearTimeout(timer);
                  clearTimeout(timer2);
                  flag = true;
                  ref?.current?.blur();
                  setValue(defaultValue);
                }}
                style={{
                  marginLeft: 10,
                  fontSize: 12,
                }}
              >
                {getIn18Text('setting_system_switch_cancel')}
              </a>
            </>
          ) : null}
        </>
      }
    />
  );

  return (
    <>
      {showInput && needInput ? (
        node
      ) : (
        <OverflowShowTooltips
          onClick={() => {
            setShowInput(true);
            setTimeout(() => {
              ref.current?.focus();
            }, 300);
          }}
          className={realStyle(
            {
              inputWrapper: needInput,
              displayWrapper: true,
              displayWrapper2: needInput,
            },
            displayClassName ?? ''
          )}
          value={value}
        />
      )}
    </>
  );
};
