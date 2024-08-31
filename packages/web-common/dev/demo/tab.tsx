import React, { useState } from 'react';
import { Divider, Space } from 'antd';
import { Radio } from 'antd';
import { Tabs } from '@web-common/components/UI/Tabs';
import { BianjiDayinji, BianjiHuifu, TongyongGuanbiXian } from '@sirius/icons';
import AppleOutlined from '@ant-design/icons/AppleOutlined';
// import AndroidOutlined from '@ant-design/icons/AndroidOutlined';
// import { ReactComponent as CloseIcon } from '@web-common/components/UI/Tabs/icon/close.svg';
import style from './tab.module.scss';

const { TabPane } = Tabs;

export const TabComponent = () => {
  const onChange = checked => {
    console.log(`switch to ${checked}`);
  };
  let [size, setSize] = useState('');
  let [bg, setBg] = useState('white');

  return (
    <>
      <Divider orientation="left">大小</Divider>
      <Space>
        <Radio.Group
          value={size}
          onChange={({ target: { value } }) => {
            setSize(value);
          }}
        >
          <Radio value="small">small: 24</Radio>
          <Radio value="middle">middle: 32</Radio>
          <Radio value="default">default: 40</Radio>
          <Radio value="max">max: 48(特殊case)</Radio>
        </Radio.Group>
      </Space>
      <br />
      <Divider orientation="left">底色</Divider>
      <Space>
        <Radio.Group
          value={bg}
          onChange={({ target: { value } }) => {
            setBg(value);
          }}
        >
          <Radio value="white">white</Radio>
          <Radio value="gray">gray</Radio>
        </Radio.Group>
      </Space>
      <br />
      <br />
      <Divider orientation="left">基础选项卡</Divider>
      <Space>
        <Tabs size={size} defaultActiveKey="1" onChange={onChange}>
          <TabPane tab="Tab 1" key="1">
            默认选项1
          </TabPane>
          <TabPane tab="Tab 2" key="2">
            默认选项2
          </TabPane>
          <TabPane tab="Tab 3" key="3">
            Content of Tab Pane 3
          </TabPane>
        </Tabs>
      </Space>
      <br />
      <Divider orientation="left">图标型选项卡</Divider>
      <Space>
        <Tabs size={size} defaultActiveKey="1" onChange={onChange}>
          <TabPane
            tab={
              <span>
                <BianjiHuifu className="anticon" />
                Tab 111
              </span>
            }
            key="1"
          >
            默认选项1
          </TabPane>
          <TabPane
            tab={
              <span>
                <AppleOutlined />
                Tab 2
              </span>
            }
            key="2"
          >
            默认选项2
          </TabPane>
          <TabPane tab="Tab 3" key="3">
            Content of Tab Pane 3
          </TabPane>
        </Tabs>
      </Space>
      <br />
      <Divider orientation="left">胶囊型选项卡</Divider>
      <Space>
        <Tabs bgmode={bg} size={size} type={'capsule'} defaultActiveKey="1" onChange={onChange}>
          <TabPane tab="Tab 1" key="1">
            默认选项1
          </TabPane>
          <TabPane tab="Tab 2" key="2">
            默认选项2
          </TabPane>
          <TabPane tab="Tab 3" key="3">
            Content of Tab Pane 3
          </TabPane>
        </Tabs>
      </Space>
      <br />
      <Divider orientation="left">增减型选项卡</Divider>
      <Space>
        <Tabs className={style.tabWithClose} hideAdd type="editable-card" size={size} defaultActiveKey="1" onChange={onChange}>
          <TabPane closeIcon={<TongyongGuanbiXian style={{ fontSize: 16 }} />} tab="Tab 1" key="1">
            默认选项1
          </TabPane>
          <TabPane closeIcon={<TongyongGuanbiXian style={{ fontSize: 16 }} />} tab="Tab 2" key="2">
            默认选项2
          </TabPane>
          <TabPane closeIcon={<TongyongGuanbiXian style={{ fontSize: 16 }} />} tab="Tab 3" key="3">
            Content of Tab Pane 3
          </TabPane>
        </Tabs>
      </Space>
      <br />
      <Divider orientation="left">纵向型选项卡</Divider>
      <Space>
        <Tabs size={size} tabPosition="left" defaultActiveKey="1" onChange={onChange}>
          <TabPane tab="Tab 1" key="1">
            默认选项1
          </TabPane>
          <TabPane
            tab={
              <span>
                <BianjiHuifu className="anticon" />
                Tab 2
              </span>
            }
            key="2"
          >
            默认选项2
          </TabPane>
          <TabPane tab="Tab 3" key="3">
            Content of Tab Pane 3
          </TabPane>
        </Tabs>
      </Space>
    </>
  );
};
