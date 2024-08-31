import React from 'react';
import { Input, InputProps } from 'antd';
import InputRightContextMenu from '@/components/UI/ContextMenu/InputContextMenu';

interface comsProps extends InputProps {}
const InputMenu = ({ value, onChange, ...rest }: comsProps) => {
  return (
    <InputRightContextMenu>
      <Input value={value} onChange={onChange} {...rest} />
    </InputRightContextMenu>
  );
};

export default InputMenu;
