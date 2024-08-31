import React from 'react';
import { Tabs } from 'antd';
import { TabsProps, TabPaneProps as ITabPaneProps } from 'antd/lib/tabs';
import ConfigProvider from '../configProvider';
import './antd.scss';
import style from './tabs.module.scss';
import classNames from 'classnames';
// import { ReactComponent as CloseIcon } from './icon/close.svg';
// import { TabsType } from 'antd/lib/tabs';

const { TabPane } = Tabs;
export type SiriusTabsProps = Omit<TabsProps, 'type' | 'size'> & {
  bgmode?: 'white' | 'gray';
  type?: TabsProps['type'] | 'capsule';
  size?: TabsProps['size'] | 'max';
};

export function SiriusTabs(props: SiriusTabsProps) {
  let { type, size, bgmode = 'white', className, tabBarGutter = 12 } = props;

  // for (let iterator of props.children) {
  //   iterator.props.closeIcon = <CloseIcon/>
  // }

  return (
    <>
      <ConfigProvider>
        <Tabs
          {...props}
          type={type as TabsProps['type']}
          tabBarGutter={tabBarGutter}
          className={classNames(
            {
              // [style.capsule]: type === 'capsule',
              [style.white]: bgmode === 'white' && type === 'capsule',
              [style.gray]: bgmode === 'gray' && type === 'capsule',
              'sirius-tabs-capsule': type === 'capsule',
              [style.siriusTabsUi]: true,
              // [style.siriusTabs+`-${size}`]: size,
            },
            className
          )}
          size={(size || 'default') as unknown as TabsProps['size']}
          // renderTabBar={(navProps)=>{

          //   console.log(navProps);
          //   return <>1212</>
          // }}
        />
      </ConfigProvider>
    </>
  );
}

const ITabPane = (props: ITabPaneProps) => {
  return (
    <ConfigProvider>
      <TabPane {...props} />
    </ConfigProvider>
  );
};

SiriusTabs.TabPane = ITabPane;

export type TabPaneProps = ITabPaneProps;
