import { getIn18Text } from 'api';
import React, { useState, useCallback, useEffect } from 'react';
import { Space, Radio, DatePicker } from 'antd';
import type { RadioChangeEvent } from 'antd';
import moment from 'moment';
import style from './style.module.scss';

interface Props {
  onChange?: (start: string, end: string) => void;
  value?: [string, string];
  defaultRange?: string;
}

const { RangePicker: AntRangePicker } = DatePicker;

/**
 * 获取最新的范围map
 * @returns
 */
export function getRangeMap(): Record<string, [string, string]> {
  return {
    week: [String(moment().startOf('week').valueOf()), String(moment().endOf('week').valueOf())],
    month: [String(moment().startOf('month').valueOf()), String(moment().endOf('month').valueOf())],
    quarterly: [String(moment().startOf('quarter').valueOf()), String(moment().endOf('quarter').valueOf())],
  };
}

export const RangePicker: React.FC<Props> = props => {
  const { value, onChange, defaultRange = 'week' } = props;
  const [range, setRange] = useState(defaultRange);
  const [rangeValue, setRangeValue] = useState<[string, string] | null>(null);

  const onRadioChange = useCallback((e: RadioChangeEvent) => {
    setRange(e.target.value);
    switch (e.target.value) {
      case 'week':
      case 'month':
      case 'quarterly':
        const map = getRangeMap();
        const rangeVal = map[e.target.value];
        setRangeValue(rangeVal);
        handleChange([moment(+rangeVal[0]), moment(+rangeVal[1])]);
        break;
      default:
    }
  }, []);

  const handleChange = useCallback(range => {
    if (onChange) {
      const [start, end] = range || [];
      onChange(start.startOf('day').valueOf(), end.endOf('day').valueOf());
    }
  }, []);

  useEffect(() => {
    if (value && value[0]) {
      setRangeValue(value);
    }
  }, [value]);

  return (
    <Space className={style.wrapper}>
      <Radio.Group onChange={onRadioChange} value={range}>
        <Radio.Button value="week">{getIn18Text('BENZHOU')}</Radio.Button>
        <Radio.Button value="month">{getIn18Text('BENYUE')}</Radio.Button>
        <Radio.Button value="quarterly">{getIn18Text('BENJIDU')}</Radio.Button>
      </Radio.Group>
      <AntRangePicker
        value={rangeValue ? [moment(+rangeValue[0]), moment(+rangeValue[1])] : null}
        onChange={val => {
          handleChange(val);
          setRange('');
        }}
        allowClear={false}
      />
    </Space>
  );
};
