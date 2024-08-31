import React from 'react';
import { Checkbox } from 'antd';
import { CheckboxProps, CheckboxOptionType as ICheckboxOptionType } from 'antd/lib/checkbox';
import { CheckboxValueType, CheckboxGroupProps } from 'antd/lib/checkbox/Group';
import ConfigProvider from '../configProvider';
import classnames from 'classnames';
import './antd.scss';
import './siriusCheckbox.scss';

export interface SiriusCheckboxProps extends CheckboxProps {
  className?: string;
}

export const prefixCls = 'sirius-checkbox-ehc-ui';
interface SiriusCheckboxGroupProps extends CheckboxGroupProps {
  value?: CheckboxValueType[];
}
const Component = (props: SiriusCheckboxProps, ref: React.Ref<HTMLInputElement> | undefined) => {
  const { className = '', children, ...rest } = props;
  return (
    <ConfigProvider>
      <Checkbox className={classnames(prefixCls, className)} {...rest} ref={ref}>
        {children}
      </Checkbox>
    </ConfigProvider>
  );
};

const Group = (props: SiriusCheckboxGroupProps) => {
  const { className = '', children, ...rest } = props;
  return (
    <span className={classnames(prefixCls, className)}>
      <ConfigProvider>
        <Checkbox.Group {...rest}>{children}</Checkbox.Group>
      </ConfigProvider>
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

export type CheckboxOptionType = ICheckboxOptionType;
export default SiriusCheckbox;
