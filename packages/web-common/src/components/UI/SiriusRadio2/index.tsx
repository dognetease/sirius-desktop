import { Radio } from 'antd';
import React from 'react';
import classnames from 'classnames/bind';
import style from './index.module.scss';

const realStyle = classnames.bind(style);

interface SiriusRadio2Props {
  value: string;
  className?: string;
}

export const SiriusRadio2: React.FC<SiriusRadio2Props> = props => {
  const { value, children } = props;
  return (
    <Radio value={value} className={realStyle('siriusSettingRadio', props.className)}>
      {children}
    </Radio>
  );
};
