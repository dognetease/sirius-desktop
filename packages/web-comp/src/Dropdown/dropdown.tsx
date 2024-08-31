/**
 * 未开发完，暂时不要使用
 */
import React, { useMemo } from 'react';
import { Dropdown, DropDownProps } from 'antd';
import variables from '../styles/export.module.scss';
import classNames from 'classnames';

export interface IDropdownProps extends DropDownProps {
  children: React.ReactNode;
}

export const IDropdown: React.FC<IDropdownProps> = props => {
  const { children, className, ...restProps } = props;
  const classes = useMemo(() => classNames(`${variables.classPrefix}-dropdown`, className), [className]);
  return (
    <Dropdown className={classes} {...restProps}>
      {children}
    </Dropdown>
  );
};

IDropdown.defaultProps = {};

export default IDropdown;
