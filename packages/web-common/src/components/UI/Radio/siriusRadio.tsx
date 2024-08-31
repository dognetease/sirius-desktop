import React from 'react';
import { Radio } from 'antd';
import { RadioButtonProps } from 'antd/lib/radio/radioButton';
import { RadioProps, RadioGroupProps, RadioChangeEvent } from 'antd/lib/radio';
// import { RadioProps, RadioGroupProps, RadioButtonProps, RadioChangeEvent } from './types';
import classnames from 'classnames';
import './siriusRadio.scss';

export interface SiriusRadioProps extends RadioProps {
  className?: string;
}

export { RadioChangeEvent, RadioGroupProps };

// interface GroupProps extends RadioGroupProps {
//   className?: string;
// }

export const prefixCls = 'sirius-radio-ehc';

const Component = (props: SiriusRadioProps, ref: React.Ref<HTMLInputElement> | undefined) => {
  const { className = '' } = props;
  return <Radio className={classnames(prefixCls, className)} {...props} ref={ref} />;
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
  Group: React.MemoExoticComponent<React.ForwardRefExoticComponent<RadioGroupProps & React.RefAttributes<HTMLDivElement>>>;
  Button: React.ForwardRefExoticComponent<RadioButtonProps & React.RefAttributes<any>>;
}

const SiriusRadio = RadioRef as RadioInterface;

SiriusRadio.Group = Radio.Group;
SiriusRadio.Button = Radio.Button;

export default SiriusRadio;
