import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import styles from './contact.module.scss';
import ContactTrackerIns from '@web-contact/tracker';
import { useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';

const TabPanes = [
  { key: 'all', name: getIn18Text('QUANBU') },
  { key: 'manager', name: getIn18Text('WOGUANLIDE') },
];

export type MailListKeyType = 'all' | 'manager';

export const ContactMaillistHeader: React.FC<{
  onMyManagerEmails: (params: { type: MailListKeyType }) => void;
  visible: boolean;
  activeKey?: string;
}> = props => {
  const { onMyManagerEmails, visible, activeKey } = props;

  const onMailTabChange = (activeKey: string) => {
    onMyManagerEmails({ type: activeKey as MailListKeyType });
    const curPane = TabPanes.find(item => item.key === activeKey);
    curPane && ContactTrackerIns.tracker_mail_list_top_click(curPane.name);
  };

  return (
    <>
      {visible ? (
        <Tabs activeKey={activeKey} onChange={onMailTabChange} className={styles.mailListTabs} tabBarGutter={20}>
          {TabPanes.map(item => (
            <Tabs.TabPane tab={<span data-test-id="contact_list_btn_mailListTab">{item.name}</span>} key={item.key} />
          ))}
        </Tabs>
      ) : (
        <div className={styles.mailListTitle}>{getIn18Text('YOUJIANLIEBIAO')}</div>
      )}
    </>
  );
};
