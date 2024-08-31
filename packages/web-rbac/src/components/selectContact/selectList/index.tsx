import React, { useState, useRef, useEffect } from 'react';
import { Input } from 'antd';
import { ContactModel } from 'api';
import SearchIcon from '../../Icons/svgs/SearchSvg';
import { ContactItem, UIContactModel } from '@web-common/components/util/contact';
import SearchList, { ContactListProp, ContactListRefs } from '../searchList';
import ContactTree, { ContactTreeProp, treeType } from '../tree';
import './index.scss';
import { useAppSelector } from '@web-common/state/createStore';

interface SelectContainerProps {
  isIM?: boolean;
  type?: 'enterprise' | 'all' | 'personal';
  multiple?: boolean;
  showCheckbox?: boolean;
  showAddOrgBtn?: boolean;
  showAddTeamBtn?: boolean;
  showSeparator?: boolean;
  defaultSelectList?: ContactItem[];
  defaultSearchVal?: string;
  disableCheckList?: ContactItem[];
  defaultExpandedKeys?: Array<'-1' | 'personalRoot' | 'teamRoot'>;
  order?: [treeType, treeType, treeType, treeType];
  onExpand?(type: 'enterprise' | 'personal' | 'team', isOpen: boolean): void;

  /**
   * 选中返回的值
   * @param item 以email为key，是唯一值
   * @param data 以contact.hitQueryEmail || contact.accountName 为唯一值 (data可能会有相同的id)
   */
  onSelect?(item: ContactItem[], data: ContactModel[]): void;

  onInputChange?(value: string): void;

  treeProps?: ContactTreeProp;
  excludeSelf?: boolean;
  searchListProps?: ContactListProp;
  // 是否展示企业通讯录
  shouldShowOrgContact?: boolean;
}

const SelectList: React.FC<SelectContainerProps> = props => {
  const {
    showAddOrgBtn,
    showAddTeamBtn,
    showSeparator,
    defaultExpandedKeys,
    order,
    defaultSelectList,
    defaultSearchVal,
    disableCheckList,
    onSelect,
    isIM,
    treeProps,
    multiple = true,
    showCheckbox = true,
    type = 'all',
    searchListProps,
    onInputChange,
    onExpand,
    excludeSelf,
    // shouldShowOrgContact = true
  } = props;
  const [searchValue, setSearchValue] = useState<string>(defaultSearchVal || '');
  const [selectList, setSelectList] = useState<ContactItem[]>([]);
  const [originList, setOriginList] = useState<UIContactModel[]>([]);
  const inputRef = useRef<null>(null);
  const contactListRef = useRef<ContactListRefs>(null);
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);

  const handleSelect = (itemList: ContactItem[], data: UIContactModel[]) => {
    console.warn('handleSelect', itemList, data);
    setSelectList(itemList);
    if (!onSelect) {
      return;
    }
    if (multiple) {
      const list: UIContactModel[] = [];
      const emailList = itemList.map(item => item.email);
      [...data, ...originList].forEach(item => {
        const hitQueryEmail = item.contact.hitQueryEmail || item.contact.accountName;
        if (emailList.includes(hitQueryEmail)) {
          list.push(item);
        }
      });
      setOriginList(list);
      onSelect(itemList, list);
    } else {
      onSelect(itemList, data);
    }
  };
  useEffect(() => {
    if (defaultSelectList) {
      setSelectList(defaultSelectList);
    }
  }, [defaultSelectList]);
  return (
    <div className="contact-select-container">
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
      <div className="contact-list-tab" hidden={searchValue === ''}>
        <SearchList
          excludeSelf={excludeSelf}
          isIM={isIM}
          type={type}
          showCheckbox={showCheckbox}
          showAddTeamBtn={showAddTeamBtn}
          multiple={multiple}
          ref={contactListRef}
          disableCheckList={disableCheckList}
          defaultSelectList={selectList}
          onSelect={handleSelect}
          {...searchListProps}
        />
      </div>
      <div className="contact-tree-tab" hidden={searchValue !== ''}>
        <ContactTree
          excludeSelf={excludeSelf}
          isIM={isIM}
          type={type}
          noEnterpriseContact={isCorpMail}
          noRecentContact={isCorpMail}
          multiple={multiple}
          order={order}
          defaultExpandedKeys={defaultExpandedKeys}
          showAddOrgBtn={showAddOrgBtn}
          showAddTeamBtn={showAddTeamBtn}
          showSeparator={showSeparator}
          showCheckbox={showCheckbox}
          disableCheckList={disableCheckList}
          defaultSelectList={selectList}
          onContactSelect={handleSelect}
          onExpand={onExpand}
          {...treeProps}
        />
      </div>
    </div>
  );
};
export default SelectList;
