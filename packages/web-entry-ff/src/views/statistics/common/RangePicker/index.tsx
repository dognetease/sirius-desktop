import React from 'react';
import { DatePicker } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import moment from 'moment';

const { RangePicker: AntRangePicker } = DatePicker;

export const RangePicker: React.FC<RangePickerProps> = props => {
  return (
    <AntRangePicker
      {...props}
      ranges={{
        本周: [moment().startOf('week'), moment().endOf('week')],
        近半个月: [moment().add(-15, 'day'), moment()],
        本月: [moment().startOf('month'), moment().endOf('month')],
      }}
    />
  );
};
