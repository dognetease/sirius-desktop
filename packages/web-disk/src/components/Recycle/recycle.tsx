import React, { useMemo, useState, useEffect, ReactElement } from 'react';
import { Tabs } from 'antd';
import styles from './recycle.module.scss';
import RecycleTable from '../RecycleTable/recycleTable';
import { getIn18Text } from 'api';
const { TabPane } = Tabs;
interface RecycleProps {
  tab?: string; // personal | ent
  contentWidth: number;
}
export enum tabEnum {
  personal = 'personal',
  ent = 'ent',
}
const descContent = {
  [tabEnum.personal]: getIn18Text('HUISHOUZHANBUZHAN'),
  [tabEnum.ent]: getIn18Text('QIYEKONGJIANHUI'),
};
const tabList = {
  [tabEnum.personal]: getIn18Text('GERENKONGJIAN'),
  [tabEnum.ent]: getIn18Text('QIYEKONGJIAN'),
};
const recycleDesc = (tabType: string) => <span className={styles.desc}>{descContent[tabType]}</span>;
const recycleTable = (type, contentWidth) => <RecycleTable type={type} contentWidth={contentWidth} />;
const tabElement = (tabType: string) => (
  <div className={styles.tabName}>
    <span>{tabList[tabType]}</span>
    <div className={styles.tabLink} />
  </div>
);
const Recycle: React.FC<RecycleProps> = props => {
  const { tab, contentWidth } = props;
  const [tabs, setTabs] = useState([tabEnum.personal, tabEnum.ent]);
  const [activeKey, setActiveKey] = useState(tab || tabEnum.personal);
  const tabPaneSlot = useMemo(() => {
    if (tabs.length === 0) return null;
    return tabs.map(key => (
      <TabPane tab={tabElement(tabEnum[key])} key={tabEnum[key]}>
        {recycleTable(tabEnum[key], contentWidth)}
      </TabPane>
    ));
  }, [tabs, contentWidth]);
  return (
    <div className={styles.container}>
      <span
        className={styles.title}
        onClick={() => {
          // setCurrentPage && setCurrentPage('index');
        }}
      >
        {getIn18Text('HUISHOUZHAN')}
      </span>
      {recycleDesc(activeKey)}
      <Tabs destroyInactiveTabPane activeKey={activeKey} className={styles.tab} onChange={setActiveKey}>
        {tabPaneSlot}
      </Tabs>
    </div>
  );
};
export default Recycle;
