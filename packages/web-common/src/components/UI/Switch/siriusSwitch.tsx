import React from 'react';
import { Switch } from 'antd';
import { SwitchProps } from 'antd/lib/switch';
// import { SwitchProps } from './types';
import classnames from 'classnames';
import './siriusSwitch.scss';

export interface SiriusSwitchProps extends SwitchProps {
  className?: string;
}

export const prefixCls = 'sirius-switch';

type CompoundedComponent = React.ForwardRefExoticComponent<SiriusSwitchProps & React.RefAttributes<HTMLElement>>;

const SiriusSwitch = React.forwardRef<HTMLButtonElement, SiriusSwitchProps>(({ className, ...props }, ref) => {
  return <Switch className={classnames(prefixCls, className)} {...props} ref={ref} />;
}) as CompoundedComponent;

export default SiriusSwitch;
