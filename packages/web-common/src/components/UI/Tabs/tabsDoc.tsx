import React from 'react';
import { Tabs } from './index';
import Divider from '../Divider/index';
import CompDoc from '../CompDoc/index';
import { BianjiHuifu, TongyongGuanbiXian } from '@sirius/icons';
import AppleOutlined from '@ant-design/icons/AppleOutlined';

const { TabPane } = Tabs;

const ButtonDoc: React.FC = () => {
  const describe = `## Tabs 标签页
    当前组件是基于antd 的 Tabs 组件包装生成的，所以支持 antd Tabs 组件所有API。`;
  const onChange = (checked: any) => {
    console.log(`Tabs to ${checked}`);
  };

  return (
    <>
      <CompDoc>
        <CompDoc.Describe describe={describe} />
        <CompDoc.Link href="https://3x.ant.design/components/tabs-cn/">antd Tabs 文档</CompDoc.Link>
        <CompDoc.Use
          npmPath="import Tabs, { TabsProps, TabPaneProps } from '@lingxi-common-component/sirius-ui/Tabs';"
          path="import { Tabs } from '@web-common/components/UI/Tabs';"
        />
        <CompDoc.RenderCode describe="#### 基础选项卡">
          <Tabs defaultActiveKey="1" onChange={onChange}>
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
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### size 大小，提供 small: 24、middle: 32、default: 40、max: 48(特殊case) 四种大小，默认为 default">
          <Tabs size="small" defaultActiveKey="1" onChange={onChange}>
            <TabPane tab="Tab 1" key="1">
              small-1
            </TabPane>
            <TabPane tab="Tab 2" key="2">
              small-2
            </TabPane>
            <TabPane tab="Tab 3" key="3">
              small-3
            </TabPane>
          </Tabs>
          <Divider />
          <Tabs size="middle" defaultActiveKey="1" onChange={onChange}>
            <TabPane tab="Tab 1" key="1">
              middle-1
            </TabPane>
            <TabPane tab="Tab 2" key="2">
              middle-2
            </TabPane>
            <TabPane tab="Tab 3" key="3">
              middle-3
            </TabPane>
          </Tabs>
          <Divider />
          <Tabs defaultActiveKey="1" onChange={onChange}>
            <TabPane tab="Tab 1" key="1">
              default-1
            </TabPane>
            <TabPane tab="Tab 2" key="2">
              default-2
            </TabPane>
            <TabPane tab="Tab 3" key="3">
              default-3
            </TabPane>
          </Tabs>
          <Divider />
          <Tabs size="max" defaultActiveKey="1" onChange={onChange}>
            <TabPane tab="Tab 1" key="1">
              max-1
            </TabPane>
            <TabPane tab="Tab 2" key="2">
              max-2
            </TabPane>
            <TabPane tab="Tab 3" key="3">
              max-3
            </TabPane>
          </Tabs>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 图形选项卡，tab 定制选项卡头显示文字可以插入图标">
          <Tabs defaultActiveKey="1" onChange={onChange}>
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
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 胶囊型选项卡，设置 type 为 capsule">
          <Tabs type="capsule" defaultActiveKey="1" onChange={onChange}>
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
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### bgmode 底色，胶囊型选项卡可设置，white 和 gray 两个可选，默认是 white">
          <Tabs type="capsule" defaultActiveKey="1" onChange={onChange}>
            <TabPane tab="Tab 1" key="1">
              white-1
            </TabPane>
            <TabPane tab="Tab 2" key="2">
              white-2
            </TabPane>
            <TabPane tab="Tab 3" key="3">
              white-3
            </TabPane>
          </Tabs>
          <Divider />
          <Tabs type="capsule" bgmode="gray" defaultActiveKey="1" onChange={onChange}>
            <TabPane tab="Tab 1" key="1">
              gray-1
            </TabPane>
            <TabPane tab="Tab 2" key="2">
              gray-2
            </TabPane>
            <TabPane tab="Tab 3" key="3">
              gray-3
            </TabPane>
          </Tabs>
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 增减型选项卡，设置 type 为 editable-card">
          <Tabs type="editable-card" defaultActiveKey="1" onChange={onChange}>
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
        </CompDoc.RenderCode>
        <CompDoc.RenderCode describe="#### 纵向型选项卡，通过设置 tabPosition 页签位置，可实现纵向选项卡">
          <Tabs tabPosition="left" defaultActiveKey="1" onChange={onChange}>
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
        </CompDoc.RenderCode>
      </CompDoc>
    </>
  );
};

export default ButtonDoc;
