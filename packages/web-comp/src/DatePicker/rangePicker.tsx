import * as React from 'react';
import { DatePicker } from 'antd';
import { RangePickerProps } from 'antd/lib/date-picker';
import ConfigProvider from '../configProvider';
import locale from './locale';
import variables from '../styles/export.module.scss';
import classNames from 'classnames';
import './antd.scss';
import './style.scss';

export interface BaseDatePickerProps {
  /**用户自定义 css class */
  className?: string;
  /**宽度 */
  width?: number;
}
export type IRangePickerProps = BaseDatePickerProps & RangePickerProps;
const { RangePicker } = DatePicker;

/**
 * 日期选择器
 */
const IRangePicker: React.FC<IRangePickerProps> = props => {
  const { className, width, ...restProps } = props;

  const classes = React.useMemo(() => classNames(`${variables.classPrefix}-date-picker-range`, className), [className]);
  return (
    <ConfigProvider>
      <RangePicker className={classes} {...restProps} style={{ ...(width ? { width: `${width}px` } : {}) }} />
    </ConfigProvider>
  );
};

IRangePicker.defaultProps = {
  locale: locale,
  separator: <span className="separator"></span>,
  dropdownClassName: `${variables.classPrefix}-date-picker-dropdown`,
};

export default IRangePicker;
