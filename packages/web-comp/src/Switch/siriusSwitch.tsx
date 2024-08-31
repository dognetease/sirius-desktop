import React from 'react';
import { Switch } from 'antd';
import { SwitchProps } from 'antd/lib/switch';
import classnames from 'classnames';
import ConfigProvider from '../configProvider';
import './antd.scss';
import './siriusSwitch.scss';

export interface SiriusSwitchProps extends SwitchProps {
  className?: string;
}

export const prefixCls = 'sirius-switch-ui';

type CompoundedComponent = React.ForwardRefExoticComponent<SiriusSwitchProps & React.RefAttributes<HTMLElement>>;

const SiriusSwitch = React.forwardRef<HTMLButtonElement, SiriusSwitchProps>(({ className, ...props }, ref) => {
  return (
    <ConfigProvider>
      <Switch className={classnames(prefixCls, className)} {...props} ref={ref} />
    </ConfigProvider>
  );
}) as CompoundedComponent;

export default SiriusSwitch;
