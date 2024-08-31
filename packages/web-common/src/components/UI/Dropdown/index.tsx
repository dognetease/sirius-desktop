/**
 * 下拉菜单组件
 * author: lujiajian@office.163.com
 * 未开发完，暂时不要使用
 */
import React from 'react';
import IDropdown, { IDropdownProps } from './dropdown';
import IDropdownButton, { IDropdownButtonProps } from './dropdownButton';

export type IDropdownComponent = React.FC<IDropdownProps> & {
  Button: React.FC<IDropdownButtonProps>;
};

const Dropdown = IDropdown as IDropdownComponent;
Dropdown.Button = IDropdownButton;

export default Dropdown;
