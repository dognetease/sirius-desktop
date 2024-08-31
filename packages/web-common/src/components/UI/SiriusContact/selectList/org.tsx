import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Input } from 'antd';
import SearchIcon from '../../Icons/svgs/SearchSvg';
import { SearchContactType } from '@web-common/components/util/contact';
import OrgSearchList, { OrgListProp, OrgListRefs } from '../searchList/org';
import OrgTree from '../tree/OrgTree';
import styles from './index.module.scss';
import { useOrgItemEffect } from '@web-common/components/UI/SiriusContact/useContactItemEffect';
import { OrgItem } from '@web-common/utils/contact_util';
import debounce from 'lodash/debounce';
import { getIn18Text } from 'api';

interface SelectContainerProps {
  isIM?: boolean;
  searchType?: SearchContactType;
  multiple?: boolean;
  showCheckbox?: boolean;
  searchAutoFocus?: boolean;
  defaultSelectList?: OrgItem[];
  defaultSearchVal?: string;
  disableCheckList?: OrgItem[];
  defaultExpandedKeys?: Array<'-1'>;
  noRelateEnterprise?: boolean;
  showAddTeamBtn?: boolean;

  /**
   * 选中返回的值
   * @param item 以email为key，是唯一值
   * @param data 以contact.hitQueryEmail || contact.accountName 为唯一值 (data可能会有相同的id)
   */
  onSelect?(item: OrgItem[], data: OrgItem[]): void;

  onInputChange?(value: string): void;

  searchListProps?: OrgListProp;
}

const SelectList: React.FC<SelectContainerProps> = props => {
  const {
    defaultSelectList = [],
    defaultSearchVal,
    disableCheckList,
    onSelect,
    isIM,
    multiple = true,
    showCheckbox = true,
    onInputChange,
    searchAutoFocus,
    noRelateEnterprise,
    showAddTeamBtn = true,
  } = props;
  const [searchValue, setSearchValue] = useState<string>(defaultSearchVal || '');
  const [selectList, setSelectList] = useState<OrgItem[]>([]);
  const inputRef = useRef<null>(null);
  const contactListRef = useRef<OrgListRefs>(null);
  // const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);

  const handleSelect = useCallback((itemList: OrgItem[], data: OrgItem[]) => {
    console.info('handleSelect', itemList, data);
    setSelectList(itemList);
    if (!onSelect) {
      return;
    }
    if (multiple) {
      onSelect(itemList, data);
    } else {
      onSelect(itemList, data);
    }
  }, []);

  const searchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);
    debounceSearchChange(value);
  };

  useOrgItemEffect(defaultSelectList, () => {
    setSelectList(defaultSelectList);
  });

  const debounceSearchChange = useCallback(
    debounce(value => {
      onInputChange && onInputChange(value);
      contactListRef?.current?.handleInputChange(value);
    }, 700),
    []
  );

  useEffect(() => {
    if (defaultSearchVal) {
      setSearchValue(defaultSearchVal);
      contactListRef?.current?.handleInputChange(defaultSearchVal);
    }
  }, [defaultSearchVal]);

  return (
    <div className={styles.selectContainer}>
      <div className={styles.contactSearchWrap}>
        <Input
          className={styles.contactSearch}
          ref={inputRef}
          value={searchValue}
          autoFocus={searchAutoFocus}
          onKeyDown={e => {
            contactListRef?.current?.handleInputKeyDown(e);
          }}
          onPressEnter={e => {
            contactListRef?.current?.handleInputEnter(e);
          }}
          onChange={e => searchChange(e)}
          placeholder={getIn18Text('QINGSHURUSOUSUO')}
          prefix={<SearchIcon className="dark-invert" />}
          allowClear
        />
      </div>
      <div className={styles.contactListTab} hidden={searchValue === ''}>
        <OrgSearchList
          isIM={isIM}
          showCheckbox={showCheckbox}
          multiple={multiple}
          ref={contactListRef}
          disableCheckList={disableCheckList}
          defaultSelectList={selectList}
          onSelect={handleSelect}
          noRelateEnterprise={noRelateEnterprise}
          showAddTeamBtn={showAddTeamBtn}
        />
      </div>
      <div className={styles.contactTreeTab} hidden={searchValue !== ''}>
        <OrgTree
          // multiple={multiple}
          showCheckbox={showCheckbox}
          disableCheckList={disableCheckList}
          defaultSelectList={selectList}
          onContactSelect={handleSelect}
        />
      </div>
    </div>
  );
};
export default SelectList;
