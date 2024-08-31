import React from 'react';
import { Moment } from 'moment';
import { DatePicker, DatePickerProps } from 'antd';
import { RangePickerProps } from 'antd/lib/date-picker/generatePicker';
import { ReactComponent as RangeDate } from '@/images/icons/edm/range-date.svg';

const { RangePicker } = DatePicker;

interface CustomerDatePickerTypes extends React.FC<DatePickerProps> {
  RangePicker: React.FC<RangePickerProps<Moment>>;
}

const defaultProps = {
  suffixIcon: <RangeDate />,
  dropdownClassName: 'edm-date-picker-dropdown-wrap',
};

const CustomerDatePicker: CustomerDatePickerTypes = props => <DatePicker {...defaultProps} {...props} />;

const CustomerRangePicker = props => <RangePicker {...defaultProps} {...props} />;

CustomerDatePicker.RangePicker = CustomerRangePicker;

export default CustomerDatePicker;
