import React, { useState, useRef } from 'react';
import classnames from 'classnames';
import { Tabs } from 'antd';
import { NoPermissionPage } from '@/components/UI/PrivilegeEnhance';
import { useAppSelector } from '@web-common/state/createStore';
import { getModuleAccessSelector } from '@web-common/state/reducer/privilegeReducer';
import BlacklistTable, { BlacklistRef } from './blacklistTable';
import NsBlacklistTable from './nsBlacklistTable';
import tabsStyle from '../Tabs/tabs.module.scss';
import style from './blacklist.module.scss';
import { getIn18Text } from 'api';

const { TabPane } = Tabs;

const tabs = [
  { key: 'blacklist', name: getIn18Text('GERENYOUXIANGHEIMINGDAN') },
  { key: 'nsblacklist', name: getIn18Text('GERENYUMINGHEIMINGDAN') },
  { key: 'enterpriseBlacklist', name: getIn18Text('QIYEYOUXIANGHEIMINGDAN') },
  { key: 'enterpriseNsblacklist', name: getIn18Text('QIYEYUMINGHEIMINGDAN') },
];

const NoPermissionPageWithPadding = () => (
  <div style={{ padding: '80px 0' }}>
    <NoPermissionPage />
  </div>
);

const Blacklist = () => {
  const [activeTab, setActiveTab] = useState('blacklist');
  const blacklistRef = useRef<BlacklistRef>(null);
  const nsblacklistRef = useRef<BlacklistRef>(null);
  const hasPersonalPermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'EDM', 'VIEW'));
  const hasEnterprisePermission = useAppSelector(state => getModuleAccessSelector(state.privilegeReducer, 'EP_MARKET_BLACKLIST', 'VIEW'));
  const filteredTabs = !hasEnterprisePermission ? tabs.filter(item => !item.key.startsWith('enterprise')) : tabs;

  return (
    <div className={classnames(style.blacklist)}>
      <div className={style.tabs}>
        <Tabs className={tabsStyle.customerTabs} activeKey={activeTab} onChange={setActiveTab}>
          {filteredTabs.map(item => (
            <TabPane key={item.key} tab={item.name} />
          ))}
        </Tabs>
      </div>
      {activeTab === 'blacklist' && (hasPersonalPermission ? <BlacklistTable ref={blacklistRef} /> : <NoPermissionPageWithPadding />)}
      {activeTab === 'nsblacklist' && (hasPersonalPermission ? <NsBlacklistTable ref={nsblacklistRef} /> : <NoPermissionPageWithPadding />)}
      {activeTab === 'enterpriseBlacklist' && (hasEnterprisePermission ? <BlacklistTable isEnterprise /> : <NoPermissionPageWithPadding />)}
      {activeTab === 'enterpriseNsblacklist' && (hasEnterprisePermission ? <NsBlacklistTable isEnterprise /> : <NoPermissionPageWithPadding />)}
    </div>
  );
};
export default Blacklist;
