import React from 'react';
import classnames from 'classnames/bind';
import { IM_SEARCH_TABS } from './searchTabEnum';
import style from './index.module.scss';
import { getIn18Text } from 'api';
interface Props {
  checkedTab: IM_SEARCH_TABS;
  onSwitchTab(tab: IM_SEARCH_TABS): void;
}
// IM_SEARCH_TABS.ALL, IM_SEARCH_TABS.CONTACT, IM_SEARCH_TABS.RECORD, IM_SEARCH_TABS.TEAM
const tabs = [
  {
    key: IM_SEARCH_TABS.ALL,
    text: getIn18Text('ZONGHE'),
  },
  {
    key: IM_SEARCH_TABS.CONTACT,
    text: getIn18Text('TONGXUNLU'),
  },
  {
    key: IM_SEARCH_TABS.TEAM,
    text: getIn18Text('QUNZU'),
  },
  {
    key: IM_SEARCH_TABS.MSGS,
    text: getIn18Text('LIAOTIANJILU'),
  },
  {
    key: IM_SEARCH_TABS.SERVICE_ACCOUNT,
    text: getIn18Text('FUWUHAO'),
  },
];
const realStyle = classnames.bind(style);
const getTabname = (str: string) => {
  const reg = /\?\w+$/;
  return str.replace(reg, '');
};
export const SearchTab: React.FC<Props> = props => {
  const { checkedTab, onSwitchTab } = props;
  return (
    <div className={realStyle('searchSelect')}>
      {tabs.map(item => (
        <div
          data-test-id="im_seach_modal_tab_type_item"
          className={realStyle('selectTab', `${getTabname(checkedTab) === item.key ? 'action' : ''}`)}
          onClick={() => {
            onSwitchTab(item.key);
          }}
          key={item.key}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};
