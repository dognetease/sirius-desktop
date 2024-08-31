import React from 'react';
import cls from 'classnames';
// import { Checkbox } from 'antd';
import Checkbox from '../../Checkbox';
import { OptionProps } from '../enhanceSelect';
import { BaseOptionProps, prefixCls } from '../type';
import './inOption.scss';

export type InMultiOptionProps = BaseOptionProps & OptionProps;
const InMultiOption = (props: InMultiOptionProps) => {
  const { children, iconName, disabled } = props;
  return (
    <div className={cls(`${prefixCls}-multi`)}>
      <span className={`${prefixCls}-front`}>
        <span className={`${prefixCls}-checkbox`}>
          <Checkbox disabled={disabled} checked className={`${prefixCls}-checked`} />
          <Checkbox disabled={disabled} checked={false} className={`${prefixCls}-no-checked`} />
        </span>
        <span className={`${prefixCls}-main-option`}>
          {/** icon 占位 **/}
          {iconName ? <>icon</> : null}
          {React.isValidElement(children) || typeof children === 'string' ? children : props.value}
        </span>
      </span>
    </div>
  );
};

export default InMultiOption;
