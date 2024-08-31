import classNames from 'classnames';
import React, { ReactNode } from 'react';
import styles from './searchtab.module.scss';
// import { Tabs } from '@web-common/components/UI/Tabs';
import Tabs from '@lingxi-common-component/sirius-ui/Tabs';

interface SearchTabListItem {
  label: ReactNode;
  value: string;
}

interface SearchTabProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultActiveKey?: string;
  tabList?: Array<SearchTabListItem>;
  activeKey?: string;
  onChange?(p: any): void;
}

const SearchTab: React.FC<SearchTabProps> = ({ tabList, className, ...rest }) => {
  return (
    <Tabs type="capsule" size="small" bgmode="gray" className={classNames(styles.searchTab, className)} {...rest}>
      {tabList?.map(item => (
        <Tabs.TabPane tab={item.label} key={item.value} />
      ))}
    </Tabs>
  );
};

export default SearchTab;
