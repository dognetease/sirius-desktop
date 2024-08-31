import React from 'react';
import { Radio } from 'antd';
import { RadioButtonProps } from 'antd/lib/radio/radioButton';
import { RadioProps, RadioGroupProps as IRadioGroupProps, RadioChangeEvent as IRadioChangeEvent } from 'antd/lib/radio';
import ConfigProvider from '../configProvider';
import classnames from 'classnames';
import './antd.scss';
import './siriusRadio.scss';

export interface SiriusRadioProps extends RadioProps {
  className?: string;
}

export type RadioChangeEvent = IRadioChangeEvent;
export type RadioGroupProps = IRadioGroupProps;

// interface GroupProps extends RadioGroupProps {
//   className?: string;
// }

export const prefixCls = 'sirius-radio-ehc-ui';

const Component = (props: SiriusRadioProps, ref: React.Ref<HTMLInputElement> | undefined) => {
  const { className = '' } = props;
  return (
    <ConfigProvider>
      <Radio className={classnames(prefixCls, className)} {...props} ref={ref} />
    </ConfigProvider>
  );
};

// const Group = (props: GroupProps) => {
//   const { className = '' } = props;
//   return <span className={classnames(prefixCls, className)}>
//     <Radio.Group {...props} />
//   </span>
// }

const RadioRef = React.forwardRef(Component) as <T>(props: SiriusRadioProps & { ref?: React.LegacyRef<T> }) => React.ReactElement;

type RadioType = typeof RadioRef;

export interface RadioInterface extends RadioType {
  Group: typeof IGroup;
  Button: typeof IButton;
}

const SiriusRadio = RadioRef as RadioInterface;

const IGroup = React.forwardRef((props: RadioGroupProps, ref: React.ForwardedRef<HTMLDivElement>) => {
  return (
    <ConfigProvider>
      <Radio.Group {...props} ref={ref} />
    </ConfigProvider>
  );
});

const IButton = React.forwardRef((props: RadioButtonProps, ref: React.ForwardedRef<any>) => {
  return (
    <ConfigProvider>
      <Radio.Button {...props} ref={ref} />
    </ConfigProvider>
  );
});

SiriusRadio.Group = IGroup;
SiriusRadio.Button = IButton;

export default SiriusRadio;
