import * as React from 'react';
import { DatePicker as AntdDatePicker } from 'antd';
import { DatePickerProps } from 'antd/lib/date-picker';
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
export type IDatePickerProps = BaseDatePickerProps & DatePickerProps;

/**
 * 日期选择器
 */
const DatePicker: React.FC<IDatePickerProps> = props => {
  const { className, width, ...restProps } = props;

  const classes = React.useMemo(() => classNames(`${variables.classPrefix}-date-picker`, className), [className]);
  return (
    <ConfigProvider>
      <AntdDatePicker className={classes} {...restProps} style={{ ...(width ? { width: `${width}px` } : {}) }} />
    </ConfigProvider>
  );
};

DatePicker.defaultProps = {
  locale: locale,
  width: 224,
  dropdownClassName: `${variables.classPrefix}-date-picker-dropdown`,
};

export default DatePicker;
