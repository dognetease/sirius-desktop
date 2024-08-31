import React, { useCallback } from 'react';
import { getIn18Text } from 'api';
import { Menu, Dropdown } from 'antd';
import CaretDownOutlined from '@ant-design/icons/CaretDownOutlined';
import { MailSearchTypes, apiHolder as api, apis, DataTrackerApi } from 'api';
import './index.scss';

const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
interface BaseSearchFilterProp {
  searchType: MailSearchTypes;
  setSearchType: (searchType: MailSearchTypes) => void;
  onSearchChange: (inputValue: string) => void;
  searchWord: string;
}
interface SearchItem {
  key: MailSearchTypes;
  name: string;
  exclude?: boolean;
}
type SearchTypeConfig = Record<MailSearchTypes, SearchItem>;
const SEARCH_TYPES: SearchTypeConfig = {
  all: { key: 'all', name: getIn18Text('QUANBUJIEGUO') },
  title: { key: 'title', name: getIn18Text('ZHUTI') },
  sender: { key: 'sender', name: getIn18Text('FAJIANREN') },
  receiver: { key: 'receiver', name: getIn18Text('SHOUJIANREN') },
  attachment: { key: 'attachment', name: getIn18Text('FUJIANMINGCHENG') },
};
const SEARCH_TYPES_OPTIONS: SearchItem[] = Object.keys(SEARCH_TYPES).map(key => SEARCH_TYPES[key as MailSearchTypes]);
const BaseSearchFilter: React.FC<BaseSearchFilterProp> = ({ searchWord, searchType, setSearchType, onSearchChange }) => {
  const onItemSearchClick = useCallback(
    (item: SearchItem) => {
      setSearchType(item.key);
      onSearchChange(searchWord);
      trackApi.track('pcMail_select_leftOptions_mailSearchResultPage', {
        searchRange: SEARCH_TYPES[searchType].name,
      });
    },
    [searchWord]
  );
  const DropdownOverlay = (
    <Menu defaultSelectedKeys={[SEARCH_TYPES.all.key]} selectedKeys={[searchType]} className="base-search-filter-menu">
      {SEARCH_TYPES_OPTIONS.map(it => (
        <Menu.Item key={it.key} onClick={() => onItemSearchClick(it)}>
          {it.name}
        </Menu.Item>
      ))}
    </Menu>
  );
  return (
    <Dropdown overlay={DropdownOverlay} trigger={['click']} placement="bottomRight">
      <div className="base-search-filter">
        <span className="search-filter-label">{getIn18Text('BAOHANSOUSUOCI')}</span>
        <div className="search-filter-trigger">
          <span className="search-filter-name">{SEARCH_TYPES[searchType].name}</span>
          <CaretDownOutlined style={{ color: '#386EE7' }} className="dark-invert search-filter-icon" />
        </div>
      </div>
    </Dropdown>
  );
};
export default BaseSearchFilter;
