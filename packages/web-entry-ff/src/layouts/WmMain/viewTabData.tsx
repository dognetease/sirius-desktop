import { nanoid } from '../utils/nanoId';
import React from 'react';
import { TabItemProps } from './viewTab';
import MailBox from '@web-mail/mailBox';
import { inWindow } from 'api';
import {
  CalenderIcon,
  ContactIcon,
  AppsIcon,
  DiskTabIcon,
  IMIcon,
  MailBoxIcon,
  EdmIcon,
  CustomerIcon,
  WorktableIcon,
  CustomsDataIcon,
  GlobalSearchIcon,
  EnterpriseIcon,
  SnsIcon,
} from '@web-common/components/UI/Icons/icons';
import { getIn18Text } from 'api';
let cachedList: TabItemProps[] = [];

if (inWindow()) {
  cachedList.push({
    id: nanoid(),
    index: 0,
    path: '#mailbox?page=mailbox',
    title: '邮件管理',
    isActive: true,
    isCached: false,
    component: <MailBox name="mailbox" tag={getIn18Text('YOUXIANG')} icon={MailBoxIcon} />,
  });
}

export { cachedList };
