import React, { useState } from 'react';
import moment, { isMoment, Moment } from 'moment';
import DatePicker, { ReactDatePickerProps } from 'react-datepicker';
import classnames from 'classnames';
import { CustomDatePickerInput } from './ScheduleDatePicker';
import './timesteppicker.scss';

export interface TimeStepPickerProps {
  style?: React.CSSProperties;
  onChange?(date: Moment | null): void;
  value?: Moment;
  className?: string;
  timeIntervals?: number;
  disabled?: boolean;
  defaultTime?: boolean; // 默认是当前时间，也可以是为null
  filterTime?: (time: Date) => boolean;
  onKeyDown?(event: React.KeyboardEvent<HTMLDivElement>): void;
}

const TimeStepPicker: React.FC<TimeStepPickerProps> = ({
  style,
  className,
  onChange,
  timeIntervals = 15,
  disabled,
  defaultTime = true,
  filterTime,
  onKeyDown,
  ...props
}) => {
  const [selected, setSelected] = useState<ReactDatePickerProps['selected']>(defaultTime ? new Date() : null);
  const handleChange: ReactDatePickerProps['onChange'] = date => {
    if (!Array.isArray(date)) {
      if (onChange) {
        onChange(date ? moment(date) : null);
      } else {
        setSelected(date);
      }
    }
  };
  const value = isMoment(props.value) ? props.value.toDate() : selected;
  return (
    <div className="sirius-time-picker-wrapper">
      <DatePicker
        disabled={disabled}
        closeOnScroll={!0}
        customInput={<CustomDatePickerInput disabled={disabled} className="input" style={{ ...style }} />}
        // popperProps={{ strategy: 'fixed' }}
        isClearable={false}
        showPopperArrow={false}
        selected={value}
        onChange={handleChange}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={timeIntervals}
        dateFormat="HH:mm"
        timeFormat="HH:mm"
        renderCustomHeader={() => <span />}
        timeCaption=""
        timeClassName={() => 'sirius-time-picker-timeli'}
        filterTime={filterTime}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

export default TimeStepPicker;
