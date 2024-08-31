/**
 * 未开发完，暂时不要使用
 */
import React, { useMemo } from 'react';
import { DropdownButtonProps } from 'antd/lib/dropdown/dropdown-button';
import { Dropdown } from 'antd';
import variables from '@web-common/styles/export.module.scss';
import classNames from 'classnames';

export interface IDropdownButtonProps extends DropdownButtonProps {
  children: React.ReactNode;
}

export const IDropdown: React.FC<IDropdownButtonProps> = props => {
  const { children, className, ...restProps } = props;
  const classes = useMemo(() => classNames(`${variables.classPrefix}-dropdown-button`, className), [className]);
  return (
    <Dropdown.Button className={classes} {...restProps}>
      {children}
    </Dropdown.Button>
  );
};

IDropdown.defaultProps = {};

export default IDropdown;
