import React from 'react';
// import { Input } from '@web-common/components/UI/Input';
import Input from '@lingxi-common-component/sirius-ui/Input';
import type { InputProps } from 'antd';

interface Props extends InputProps {
  value?: string;
  onChange?: (value: string) => void;
}

const InputName: React.FC<Props> = ({ value, onChange, ...rest }) => <Input value={value} onChange={e => onChange(e.target.value.trim())} {...rest} />;
export default InputName;
