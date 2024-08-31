import React, { CSSProperties, useState } from 'react';
import { DatePicker, DatePickerProps } from 'antd';
// import Radio from '@web-common/components/UI/Radio';
import Radio from '@lingxi-common-component/sirius-ui/Radio';
import type { RadioChangeEvent } from 'antd';
import moment from 'moment';
import type { Moment } from 'moment';
import style from './quickTime.module.scss';

const { RangePicker } = DatePicker;
const dateFormat = 'YYYY/MM/DD';

interface Props {
  // value?: string;
  onChange?: (time: string | null) => void;
}

const TIME_LIST = [
  {
    lebel: '全部',
    value: 'all',
  },
  {
    lebel: '7天内',
    value: '0-6',
  },
  {
    lebel: '7-14天内',
    value: '7-13',
  },
  {
    lebel: '14-30天内',
    value: '14-29',
  },
  {
    lebel: '30-90天内',
    value: '30-89',
  },
  {
    lebel: '90天以上',
    value: '90',
  },
  {
    lebel: '自定义',
    value: 'CUSTOM',
  },
];

const QuickTime: React.FC<Props> = ({ onChange }) => {
  const [timeType, setTimeType] = useState(TIME_LIST[0].value);
  const [timeRange, setTimeRange] = useState<Moment[] | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onTimeChange = (e: RadioChangeEvent) => {
    setTimeType(e.target.value);
    setTimeRange(undefined);
    if (e.target.value === 'CUSTOM') {
      setShowDatePicker(true);
      return;
    }
    setShowDatePicker(false);
    onChange && onChange(getFormatTime(e.target.value));
  };

  const onChangeTimeRange = (momnet: Moment[]) => {
    if (momnet) {
      setTimeRange(momnet);
      onChange && onChange(`${momnet[0].format(dateFormat)}:${momnet[1].format(dateFormat)}`);
    } else {
      setTimeType(TIME_LIST[0].value);
      setTimeRange(undefined);
      setShowDatePicker(false);
      onChange && onChange(getFormatTime('0-6'));
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Radio.Group className={style.group} onChange={onTimeChange} value={timeType}>
        {TIME_LIST.map(item => (
          <Radio value={item.value}>{item.lebel}</Radio>
        ))}
      </Radio.Group>
      {showDatePicker && <RangePicker value={timeRange ? [timeRange[0], timeRange[1]] : [null, null]} onChange={time => onChangeTimeRange(time as Moment[])} />}
    </div>
  );
};

export default QuickTime;

export const DepartureDate: React.FC<Props> = ({ onChange }) => {
  const onChangeTimeRange = (momnet: Moment[]) => {
    if (momnet) {
      onChange && onChange(`${momnet[0].format(dateFormat)}:${momnet[1].format(dateFormat)}`);
    } else {
      onChange && onChange(null);
    }
  };
  return <RangePicker style={{ height: 36, width: '100%' }} placeholder={['出发时间', '']} onChange={time => onChangeTimeRange(time as Moment[])} />;
};

interface IFfDatePicker extends Omit<DatePickerProps, 'onChange'> {
  onChange?: (time?: string) => void;
}

export const FfDatePicker: React.FC<IFfDatePicker> = ({ value, onChange, ...restProps }) => {
  const onChangeTimeRange = (momnet: Moment) => {
    if (momnet) {
      onChange && onChange(momnet.format(dateFormat));
    } else {
      onChange && onChange(undefined);
    }
  };
  return <DatePicker style={{ width: '100%' }} value={value ? moment(value) : undefined} onChange={time => onChangeTimeRange(time as Moment)} {...restProps} />;
};

FfDatePicker.defaultProps = {
  format: 'YYYY/MM/DD',
};

export const getFormatTime = (rang: string) => {
  if (rang === 'all') return null;
  const timeRange = rang.split('-');
  if (timeRange.length === 1) {
    const end = moment().subtract(timeRange[0], 'days').format(dateFormat);
    return `:${end}`;
  }
  if (timeRange.length === 2) {
    const end = moment().subtract(timeRange[0], 'days').format(dateFormat);
    const start = moment().subtract(timeRange[1], 'days').format(dateFormat);
    return `${start}:${end}`;
  }
  return '';
};
