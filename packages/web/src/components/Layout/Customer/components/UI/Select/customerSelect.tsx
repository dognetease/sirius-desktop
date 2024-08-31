import React from 'react';
import { Select, SelectProps } from 'antd';
import { SelectValue } from 'antd/lib/select/index';
import { OptionProps } from 'rc-select/lib/Option';
import DownTriangle from '@web-common/components/UI/Icons/svgs/disk/DownTriangle';
import style from './customerSelect.module.scss';
import { getIn18Text } from 'api';
const { Option } = Select;
interface SelectTypes extends React.FC<SelectProps<SelectValue>> {
  Option: React.FC<OptionProps>;
}
const defaultProps: SelectProps<SelectValue> = {
  suffixIcon: <DownTriangle />,
  dropdownClassName: style.selectorDropdown,
  getPopupContainer: triggerNode => triggerNode.parentNode,
};
const CustomerSelect: SelectTypes = props => {
  const { children, ...restProps } = props;
  return (
    <Select {...defaultProps} {...restProps} listHeight={232} notFoundContent={<div style={{ fontSize: 12 }}>{getIn18Text('ZANWUSHUJU')}</div>}>
      {children}
    </Select>
  );
};
CustomerSelect.Option = Option;
export default CustomerSelect;
