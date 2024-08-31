/**
 * 日期选择器
 * author: lujiajian@office.163.com
 */
import IDatePicker, { IDatePickerProps } from './datePicker';
import IRangePicker, { IRangePickerProps } from './rangePicker';

export type IDatePickerComponent = React.FC<IDatePickerProps> & {
  RangePicker: React.FC<IRangePickerProps>;
};

const DatePicker = IDatePicker as IDatePickerComponent;
DatePicker.RangePicker = IRangePicker;

export type DatePickerProps = IDatePickerProps;
export default DatePicker;
