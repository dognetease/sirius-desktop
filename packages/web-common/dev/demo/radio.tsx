import React from 'react';
import { Divider, Space } from 'antd';
import { Radio } from '@web-common/components/UI/Radio';
import type { RadioChangeEvent } from 'antd';

export const RadioComponent = () => {
  const [value, setValue] = React.useState(1);
  const onChange = e => {
    console.log('radio checked', e.target.value);
    setValue(e.target.value);
  };

  return (
    <>
      <Divider orientation="center">基本使用</Divider>
      <Space>
        <Radio>Radio</Radio> <Radio checked>Radio</Radio>
      </Space>
      <br />
      <Space style={{ marginTop: 10 }}>
        <Radio disabled>Radio</Radio>{' '}
        <Radio disabled checked>
          Radio
        </Radio>
      </Space>
      <Divider orientation="center">单选组合</Divider>
      <Radio.Group onChange={onChange} value={value}>
        <Radio value={1}>A</Radio>
        <Radio value={2}>B</Radio>
        <Radio value={3}>C</Radio>
        <Radio value={4}>D</Radio>
      </Radio.Group>
    </>
  );
};
