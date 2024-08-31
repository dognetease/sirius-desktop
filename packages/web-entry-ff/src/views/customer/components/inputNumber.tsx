import React, { useContext } from 'react';
import { InputNumber, InputNumberProps } from 'antd';
import { GlobalContext } from '@web-entry-ff/layouts/WmMain/globalProvider';

interface Props extends Omit<InputNumberProps, 'value' | 'onChange'> {
  value?: number;
  onChange?: (nums: number) => void;
  ref?: React.Ref<HTMLInputElement>;
}

const FfInputNumber: React.FC<Props> = ({ value, onChange, ...rest }) => {
  const { state } = useContext(GlobalContext);

  if (state?.discountType === 'PERCENT') {
    return (
      <InputNumber
        {...rest}
        value={value}
        formatter={value => `${value ? (String(value).indexOf('-') > -1 ? value + '%' : '+' + value + '%') : value}`}
        parser={value => value!.replace(/[%+]/g, '')}
        onChange={num => onChange && onChange(num as number)}
      />
    );
  } else {
    return (
      <InputNumber
        {...rest}
        value={value}
        formatter={value => `$ ${String(value).indexOf('-') > -1 || !value ? value : '+' + value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        parser={value => value!.replace(/\$\s?\+?|(,*)/g, '')}
        onChange={num => onChange && onChange(num as number)}
      />
    );
  }
};

export default FfInputNumber;
