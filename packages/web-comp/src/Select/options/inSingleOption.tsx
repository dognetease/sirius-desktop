import React from 'react';
import cls from 'classnames';
import { BaseOptionProps, prefixCls } from '../type';
import { OptionProps } from '../enhanceSelect';
import './inOption.scss';

export type InSingleOptionProps = BaseOptionProps & OptionProps;
const InSingleOption = (props: InSingleOptionProps) => {
  const { children, className } = props;
  return (
    <div className={cls(className, `${prefixCls}-single`)}>
      <div className={`${prefixCls}-front`}>
        {/* {iconName ? <span>icon</span> : null} */}
        {React.isValidElement(children) || typeof children === 'string' ? children : props.value}
      </div>
    </div>
  );
};

export default InSingleOption;
