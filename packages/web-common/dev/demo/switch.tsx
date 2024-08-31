import React from 'react';
import { Divider, Space } from 'antd';
import { Switch } from '@web-common/components/UI/Switch';

export const SwitchComponent = () => {
  const onChange = checked => {
    console.log(`switch to ${checked}`);
  };
  return (
    <>
      <Divider orientation="left">默认状态【大】</Divider>
      <Space>
        <Switch defaultChecked onChange={onChange} />
        <Switch defaultChecked disabled onChange={onChange} />
        <Switch onChange={onChange} />
        <Switch disabled onChange={onChange} />
      </Space>
      <br />
      <br />
      <Divider orientation="left">默认状态【小】</Divider>
      <Space>
        <Switch defaultChecked size="small" onChange={onChange} />
        <Switch defaultChecked disabled size="small" onChange={onChange} />
        <Switch size="small" onChange={onChange} />
        <Switch disabled size="small" onChange={onChange} />
      </Space>
      <Space></Space>
    </>
  );
};
