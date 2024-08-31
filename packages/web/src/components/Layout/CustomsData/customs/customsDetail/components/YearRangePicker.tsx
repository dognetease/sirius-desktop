import React, { useCallback, useEffect, useState } from 'react';
import cnlocale from 'antd/es/date-picker/locale/zh_CN';
import moment, { Moment } from 'moment';
import { DatePicker } from 'antd';
import { getIn18Text } from 'api';

interface Props {
  onChangeYear: (year: number[]) => void;
  year: number[];
  classNames?: string;
}
const { RangePicker } = DatePicker;
const YEAR_RANGE_LEFT = 2001;
const isYearDisabled = (current: any) => {
  if (!current) return false;
  const targetYear = moment(current).year();
  const currYear = moment().year();
  return targetYear > currYear || targetYear < YEAR_RANGE_LEFT;
};
const formatYear2Moment = (year: number[]) => year.map(item => moment(item, 'YYYY'));
export const YearRangePicker = ({ year, onChangeYear, classNames }: Props) => {
  const [yearRange, setYearRange] = useState(formatYear2Moment(year));
  const onYearRangeChange = useCallback(
    (newRange: [Moment | null, Moment | null] | null) => {
      if (!newRange?.filter(Boolean).length) return;
      setYearRange(newRange as [Moment, Moment]);
      onChangeYear((newRange as [Moment, Moment]).map(item => Number(item.format('YYYY'))));
    },
    [onChangeYear]
  );
  useEffect(() => {
    setYearRange(formatYear2Moment(year));
  }, [year]);
  return (
    <RangePicker
      style={{ border: '1px solid #E1E3E8' }}
      separator=" - "
      picker="year"
      className={classNames}
      allowClear={false}
      placeholder={[getIn18Text('SHIJIANFANWEI'), '']}
      locale={cnlocale}
      value={yearRange as [Moment, Moment]}
      disabledDate={isYearDisabled}
      onChange={onYearRangeChange}
    />
  );
};
