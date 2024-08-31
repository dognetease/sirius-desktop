import React, { useEffect, useState } from 'react';
import { isElectron as forElectron } from 'api';
import { InputProps } from 'antd';
import { CustomerInput, CustomerTextArea } from './cname';
import { TextAreaProps } from 'antd/lib/input';
import InputRightContextMenu from './InputContextMenuAll';

interface comsProps extends InputProps {}
/**
 *  @value 受控组件
 *
 */
const Input = ({ value, onChange, ...rest }: comsProps) => {
  const [inputValue, setInputValue] = useState<string | number | readonly string[] | undefined>();
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  const onInnerChange = (e: any) => {
    onChange && onChange(e);
    setInputValue(e.target.value);
  };
  return forElectron() ? (
    <InputRightContextMenu onChange={setInputValue}>
      <CustomerInput value={inputValue} onChange={onInnerChange} {...rest} />
    </InputRightContextMenu>
  ) : (
    <CustomerInput value={value} onChange={onChange} {...rest} />
  );
};

const TextArea = ({ value, onChange, ...rest }: TextAreaProps) => {
  const [inputValue, setInputValue] = useState<string | number | readonly string[] | undefined>();
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  const onInnerChange = (e: any) => {
    onChange && onChange(e);
    setInputValue(e.target.value);
  };
  return forElectron() ? (
    <InputRightContextMenu onChange={setInputValue}>
      <CustomerTextArea value={inputValue} onChange={onInnerChange} {...rest} />
    </InputRightContextMenu>
  ) : (
    <CustomerTextArea value={value} onChange={onChange} {...rest} />
  );
};

Input.TextArea = TextArea;
Input.Group = CustomerInput.Group;
Input.Search = CustomerInput.Search;

export default Input;
