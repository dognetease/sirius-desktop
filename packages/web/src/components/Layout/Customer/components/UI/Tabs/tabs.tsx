import React from 'react';
import classnames from 'classnames';
import { Tabs, TabsProps, TabPaneProps } from 'antd';
import style from './tabs.module.scss';

const { TabPane } = Tabs;

interface TabsTypes extends React.FC<TabsProps> {
  TabPane: React.FC<TabPaneProps>;
}

const CustomerTabs: TabsTypes = props => {
  const { className, children, ...restProps } = props;

  return (
    <Tabs className={classnames(style.customerTabs, className)} {...restProps}>
      {children}
    </Tabs>
  );
};

CustomerTabs.TabPane = TabPane;

export default CustomerTabs;
