import React from 'react';
import { Checkbox } from 'antd';
import { CheckboxProps, CheckboxOptionType } from 'antd/lib/checkbox';
import { CheckboxValueType, CheckboxGroupProps } from 'antd/lib/checkbox/Group';
// import { CheckboxProps, CheckboxGroupProps, CheckboxValueType, CheckboxOptionType } from './types';
import classnames from 'classnames';
import './siriusCheckbox.scss';

export interface SiriusCheckboxProps extends CheckboxProps {
  className?: string;
}

export const prefixCls = 'sirius-checkbox-ehc';
interface SiriusCheckboxGroupProps extends CheckboxGroupProps {
  value?: CheckboxValueType[];
}
const Component = (props: SiriusCheckboxProps, ref: React.Ref<HTMLInputElement> | undefined) => {
  const { className = '', children, ...rest } = props;
  return (
    <Checkbox className={classnames(prefixCls, className)} {...rest} ref={ref}>
      {children}
    </Checkbox>
  );
};

const Group = (props: SiriusCheckboxGroupProps) => {
  const { className = '', children, ...rest } = props;
  return (
    <span className={classnames(prefixCls, className)}>
      <Checkbox.Group {...rest}>{children}</Checkbox.Group>
    </span>
  );
};

const CheckboxRef = React.forwardRef(Component) as <T>(props: SiriusCheckboxProps & { ref?: React.LegacyRef<T> }) => React.ReactElement;

type CheckboxType = typeof CheckboxRef;

export interface CheckboxInterface extends CheckboxType {
  Group: typeof Group;
}

const SiriusCheckbox = CheckboxRef as CheckboxInterface;

SiriusCheckbox.Group = Group;

export { CheckboxOptionType };
export default SiriusCheckbox;
