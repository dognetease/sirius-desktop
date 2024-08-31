import React from 'react';
import { Tabs } from 'antd';
import { TabsProps, TabPaneProps } from 'antd/lib/tabs';
// import { TabsProps, TabPaneProps } from './types';
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
      <Tabs
        {...props}
        type={type as TabsProps['type']}
        tabBarGutter={tabBarGutter}
        className={classNames(
          {
            // [style.capsule]: type === 'capsule',
            [style.white]: bgmode === 'white' && type === 'capsule',
            [style.gray]: bgmode === 'gray' && type === 'capsule',
            capsule: type === 'capsule',
            [style.siriusTabs]: true,
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
    </>
  );
}

SiriusTabs.TabPane = TabPane;

export { TabPaneProps };
