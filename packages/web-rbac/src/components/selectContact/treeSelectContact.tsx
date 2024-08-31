import React, { useState, useRef, useEffect } from 'react';
import { Input } from 'antd';
import classnames from 'classnames';

import { apiHolder, apis, ContactApi, ContactModel, EntityOrg, OrgApi, SearchCondition } from 'api';
import { useAppSelector } from '@web-common/state/createStore';
import SearchIcon from '@web-common/components/UI/Icons/svgs/SearchSvg';
import { ContactItem, transContactModel2ContactItem, UIContactModel } from '@web-common/components/util/contact';
import ContactTree, { ContactTreeProp } from './tree';
import '@web-common/components/UI/SiriusContact/selectedList/index.scss';
import styles from './index.module.scss';
import SearchList, { ContactListProp, ContactListRefs } from './searchList/index';

interface SelectContainerProps {
  isIM?: boolean;
  type?: 'enterprise' | 'all' | 'personal';
  multiple?: boolean;
  showCheckbox?: boolean;
  showAddOrgBtn?: boolean;
  defaultSelectList?: ContactModel[];
  disableCheckList?: ContactItem[];
  defaultSelectOrgList?: EntityOrg[];
  showSearch?: boolean;

  onSelect?(item: ContactItem[], data: ContactModel[]): void;
  onSelectOrg?: (list: EntityOrg[]) => void;

  onInputChange?(value: string): void;

  treeProps?: ContactTreeProp;
  searchListProps?: ContactListProp;
}

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;

export const TreeSelectContact: React.FC<SelectContainerProps> = props => {
  const {
    showAddOrgBtn,
    defaultSelectList,
    disableCheckList,
    showSearch = true,
    onSelect,
    isIM,
    treeProps,
    multiple = true,
    showCheckbox = true,
    type = 'enterprise',
    searchListProps,
    onInputChange,
  } = props;
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectList, setSelectList] = useState<ContactItem[]>([]);
  const [originList, setOriginList] = useState<UIContactModel[]>([]);
  const inputRef = useRef<null>(null);
  const contactListRef = useRef<ContactListRefs>(null);
  const edmContactIdMap = useAppSelector(state => state.edmUserReducer.contactIds);

  const handleSelect = (itemList: ContactItem[], data: UIContactModel[]) => {
    setSelectList(itemList);
    if (!onSelect) {
      return;
    }
    if (multiple) {
      let list: UIContactModel[] = [...originList];
      data.forEach(item => {
        const idx = originList.findIndex(origin => origin.contact.id === item.contact.id);
        if (idx === -1) {
          list.push(item);
        } else {
          list.splice(idx, 1);
        }
      });
      setOriginList(list);
      onSelect(itemList, list);
    } else {
      onSelect(itemList, data);
    }
  };

  const handleSearch = async (condition: SearchCondition) => {
    const data = await contactApi.doSearchAllContact(condition);
    data.contactList = data.contactList.filter(i => i.contact.accountOriginId && edmContactIdMap[i.contact.accountOriginId]);
    return data;
  };

  useEffect(() => {
    if (defaultSelectList) {
      const list = defaultSelectList.map(i => transContactModel2ContactItem(i));
      setSelectList(list);
      setOriginList(defaultSelectList);
    }
  }, [defaultSelectList]);

  return (
    <div className="contact-select-container">
      {showSearch && (
        <div className="contact-search-wrap">
          <Input
            className="contact-search"
            ref={inputRef}
            autoFocus
            onKeyDown={e => {
              contactListRef?.current?.handleInputKeyDown(e);
            }}
            onPressEnter={e => {
              contactListRef?.current?.handleInputEnter(e);
            }}
            onChange={e => {
              const { value } = e.target;
              setSearchValue(value);
              onInputChange && onInputChange(value);
              contactListRef?.current?.handleInputChange(e);
            }}
            placeholder="请输入搜索内容"
            prefix={<SearchIcon />}
            value={searchValue}
            allowClear
          />
        </div>
      )}
      <div className="contact-list-tab" hidden={searchValue === ''}>
        <SearchList
          isIM={isIM}
          type={type}
          showCheckbox={showCheckbox}
          showAddOrgBtn={showAddOrgBtn}
          multiple={multiple}
          ref={contactListRef}
          disableCheckList={disableCheckList}
          defaultSelectList={selectList}
          onSelect={handleSelect}
          onSearch={handleSearch}
          {...searchListProps}
        />
      </div>
      <div className={classnames(['contact-tree-tab', styles.contactTree])} hidden={searchValue !== ''}>
        <ContactTree
          isIM={isIM}
          multiple={multiple}
          showAddOrgBtn={showAddOrgBtn}
          showCheckbox={showCheckbox}
          disableCheckList={disableCheckList}
          defaultSelectList={selectList}
          defaultSelectOrgList={props.defaultSelectOrgList}
          // disableCheckOrgIds={['3993514_0_1828302']}
          onContactSelect={handleSelect}
          onOrgSelect={props.onSelectOrg}
          {...treeProps}
        />
      </div>
    </div>
  );
};
