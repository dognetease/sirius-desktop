import React, { useState, useEffect, useCallback } from 'react';
import { Radio, RadioChangeEvent } from 'antd';
import { MailEncodings, apiHolder } from 'api';
import { ENCODING_MAP } from '@web-mail/common/constant';
import './index.scss';

const eventApi = apiHolder.api.getEventApi();

interface MailEncodingProps {
  mid: string;
  encodingValue?: MailEncodings;
  account?: string;
  close?: () => void;
}

interface Option {
  value: string;
  label: string;
}

const OPTIONS: Option[] = (Object.keys(ENCODING_MAP) as MailEncodings[]).reduce((total, key) => {
  total.push({
    value: key,
    label: ENCODING_MAP[key],
  });
  return total;
}, [] as Option[]);

const MailEncodingComp: React.FC<MailEncodingProps> = ({ close, encodingValue, mid, account }) => {
  const [value, setValue] = useState<MailEncodings>('default');

  // 控制可见性，获取联想记录
  useEffect(() => {
    setValue(encodingValue || 'default');
  }, [encodingValue]);

  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value);
    console.log(mid);
    changeEncodingDebounce(mid, e.target.value);
    if (close) {
      close();
    }
  };

  const changeEncodingDebounce = useCallback((mid: string, encoding: MailEncodings) => {
    eventApi.sendSysEvent({
      eventName: 'mailMenuOper',
      eventStrData: 'mailEncoding',
      eventData: {
        mid,
        encoding,
        account,
      },
    });
  }, []);

  return (
    <Radio.Group options={OPTIONS} value={value} onChange={onChange} className="mailEncodingContainer">
      {OPTIONS.map(v => (
        <Radio value={v.value} key={v.value}>
          {v.label}
        </Radio>
      ))}
    </Radio.Group>
  );
};

export default MailEncodingComp;
