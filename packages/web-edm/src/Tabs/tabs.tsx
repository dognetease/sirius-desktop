import React from 'react';
import { Tabs } from 'antd';
import style from './tabs.module.scss';
const { TabPane } = Tabs;

interface ComsProps {
  defaultActiveKey: string;
  onChange: (param) => void;
  className: string;
  tabNameList?: string[];
  tabKeys?: string[];
  activeKey?: string;
  value?: number;
  tabList?: { label: string; value: string }[];
}

const CustomerTabs: React.FC<ComsProps> = ({ onChange, className, tabNameList, tabKeys, activeKey, tabList }) => {
  const callback = index => {
    console.log('index', index);
    onChange(index);
  };
  if (tabList && tabList.length) {
    return (
      <Tabs defaultActiveKey={'1'} className={`${style.customerTabs} ${className}`} onChange={callback} activeKey={activeKey}>
        {tabList.map(item => {
          return <TabPane tab={item.label} key={item.value}></TabPane>;
        })}
      </Tabs>
    );
  }
  return (
    <Tabs defaultActiveKey={'1'} className={`${style.customerTabs} ${className}`} onChange={callback} activeKey={activeKey}>
      {tabNameList &&
        tabNameList.map((item, index) => {
          return <TabPane tab={item} key={tabKeys ? tabKeys[index] : index + 1}></TabPane>;
        })}
    </Tabs>
  );
};

export default CustomerTabs;
