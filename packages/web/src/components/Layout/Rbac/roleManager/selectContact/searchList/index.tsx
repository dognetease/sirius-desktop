import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { HotKeys, KeyMap } from 'react-hotkeys';
import { FixedSizeList as VirtualList } from 'react-window';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { ContactModel, EntityTeamOrg, SearchCondition, api, SearchAllContactRes } from 'api';
import './index.scss';
import debounce from 'lodash/debounce';
import { UIContactModel } from '@web-contact/data';
import {
  ContactItem,
  filterSameEmailAndHitQueryContact,
  getTeamAndMemberByTeam,
  OrgAndContact,
  transContactModel2ContactItem,
} from '@web-common/components/util/contact';
import { SpinIcon } from '@web-common/components/UI/Icons/icons';
import { contactApi } from '@web-common/utils/contact_util';
import ListItem from '../listItem';
import { getIn18Text } from 'api';
const sysApi = api.getSystemApi();
export interface ContactListRefs {
  handleInputEnter(e: any): void;
  handleInputKeyDown(e: any): void;
  handleInputChange(e: any): void;
}
export interface ContactListProp {
  // 每个list-item 所占的位置大小
  itemSize?: number;
  isIM?: boolean;
  ref?: React.Ref<ContactListRefs>;
  showAvatar?: boolean;
  showCheckbox?: boolean;
  showAddOrgBtn?: boolean;
  showAddTeamBtn?: boolean;
  defaultSelectList?: ContactItem[];
  disableCheckList?: ContactItem[];
  multiple?: boolean;
  type?: 'all' | 'enterprise' | 'personal';
  excludeSelf?: boolean;
  onSelect?(allList: ContactItem[], cur: UIContactModel[]): void;
  onSearch?(condition: SearchCondition): Promise<SearchAllContactRes>;
}
enum ListHotKey {
  KEY_UP,
  KEY_DOWN,
  KEY_ENTER,
}
const keyMap: KeyMap = {
  [ListHotKey.KEY_UP]: 'up',
  [ListHotKey.KEY_DOWN]: 'down',
  [ListHotKey.KEY_ENTER]: 'enter',
};
const ContactList = React.forwardRef((props: ContactListProp, ref) => {
  const {
    itemSize = 68,
    isIM = true,
    showAvatar = true,
    showCheckbox = true,
    showAddTeamBtn,
    multiple = true,
    type = 'all',
    onSelect,
    defaultSelectList,
    disableCheckList,
    excludeSelf,
  } = props;
  const [selectedContact, setSelectedContact] = useState<OrgAndContact>();
  const [selectedList, setSelectedList] = useState<ContactItem[]>([]);
  const [searchList, setSearchList] = useState<OrgAndContact[]>([]);
  const [searchListLoading, setSearchListLoading] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>();
  const hotKeyInnerRef = useRef<HTMLElement>(null);
  const listRef = useRef<VirtualList>(null);
  const listScrollRef = useRef<OverlayScrollbarsComponent>(null);
  useEffect(() => {
    defaultSelectList && setSelectedList(defaultSelectList);
  }, [defaultSelectList]);
  const listMove = (stepNum: number) => {
    let step = stepNum;
    if (searchList?.length === 0) {
      return;
    }
    let currentIndex = 0;
    console.warn('selectedContact', selectedContact);
    if (selectedContact) {
      currentIndex = searchList.findIndex(item => {
        if (selectedContact.contact) {
          return selectedContact.contact.id === item.contact?.id;
        }
        return selectedContact.id === item.id;
      });
    } else {
      step = 0;
    }
    const targetIndex = currentIndex + step;
    if (targetIndex < searchList.length && searchList[targetIndex]) {
      setSelectedContact(searchList[targetIndex]);
      listRef.current?.scrollToItem(targetIndex);
      // listScrollRef.current?.osInstance().scroll({
      //   y: `${targetIndex > currentIndex ? "+" : "-"}= ${LIST_ITEM_HEIGHT}`,
      // });
    }
  };
  const handleListMove = (step: number) => (e?: KeyboardEvent) => {
    e && e.preventDefault();
    listMove(step);
  };
  const handleListSelect = async (contactData?: ContactModel | EntityTeamOrg, checked?: boolean) => {
    let data = contactData as OrgAndContact;
    console.warn('handleListSelect!!!!', data);
    data = data || selectedContact || searchList[0];
    setSelectedContact(data);
    // 某些场景下data为空
    if (!data) return;
    if (data.id) {
      // TODO: 按照部门往下找
      // 处理点击群组
      // data.checked = checked;
      // const { contactItem, originContactModel } = await getSelectedMemberBySelectTeam(
      //   [data], [...selectedList, ...disableCheckList || []]
      // );
      // setSelectedList(contactItem);
      // onSelect && onSelect(contactItem, originContactModel);
      return;
    }
    if (multiple) {
      const email = data.contact.hitQueryEmail || data.contact.accountName;
      if (disableCheckList?.some(item => item.email === email)) {
        return;
      }
      const list = [...selectedList];
      const index = list.findIndex(item => item.email === email);
      index !== -1 ? list.splice(index, 1) : list.push(transContactModel2ContactItem(data));
      setSelectedList(list);
      onSelect && onSelect(list, [data]);
    } else {
      onSelect && onSelect([transContactModel2ContactItem(data)], [data]);
    }
  };
  const onListItemSelect = (contactData: ContactModel | EntityTeamOrg, checked?: boolean) => {
    handleListSelect(contactData, checked);
  };
  const handleInputEnter: React.KeyboardEventHandler<HTMLInputElement> = () => {
    handleListSelect();
  };
  const handleInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.keyCode === 38 || e.keyCode === 40) {
      let step;
      if (e.keyCode === 38) {
        step = -1;
      } else {
        step = 1;
      }
      listMove(step);
    }
  };
  const handleInputChange = (e: any) => {
    const { value } = e.target;
    setSearchValue(value);
  };
  useImperativeHandle(ref, () => ({
    handleInputEnter,
    handleInputKeyDown,
    handleInputChange,
  }));
  /*
   * 2021/12/23/21:37 zoumingliang
   * 搜索联系人相关数据，返回命中的人和群组
   * TODO:返回命中的部门 以及点击部门的操作
   * */
  const doSearch = async (query: string) => {
    setSearchListLoading(!0);
    const condition: SearchCondition = {
      query,
      showDisable: false,
      isIM,
    };
    type !== 'all' && (condition.contactType = type);
    console.warn('searchList start!!!');
    let data: SearchAllContactRes;
    if (props.onSearch) {
      data = await props.onSearch(condition);
    } else {
      data = await contactApi.doSearchAllContact(condition);
    }
    let { teamList } = data;
    if (showAddTeamBtn && teamList?.length) {
      teamList = await getTeamAndMemberByTeam(teamList);
    } else {
      teamList = [];
    }
    console.warn('searchList!!!', data.contactList);
    const contactList = filterSameEmailAndHitQueryContact(data.contactList);
    const searchData = [...contactList, ...teamList] as OrgAndContact[];
    console.warn('searchList2!!!', searchData);
    let resultData: OrgAndContact[] = [];
    if (excludeSelf) {
      resultData = searchData.filter(e => (e.contact?.hitQueryEmail || e.contact?.accountName) !== sysApi.getCurrentUser()?.id);
    } else {
      resultData = searchData;
    }
    setSearchList(resultData);
    setSelectedContact(resultData[0]);
    setSearchListLoading(false);
  };
  const debounceSearch = useCallback(
    debounce(value => {
      doSearch(value);
    }, 700),
    []
  );
  useEffect(() => {
    if (!searchValue) {
      setSearchListLoading(false);
      setSearchList([]);
    } else {
      debounceSearch(searchValue);
    }
  }, [searchValue]);
  const listHotKeyHandler = {
    [ListHotKey.KEY_UP]: handleListMove(-1),
    [ListHotKey.KEY_DOWN]: handleListMove(1),
    [ListHotKey.KEY_ENTER]: (e: any) => {
      e.preventDefault();
      handleListSelect();
    },
  };
  const renderNoData = () => <div className="no-data">{getIn18Text('WUFUHETIAOJIANDELIANXIREN')}</div>;
  const renderData = () => (
    <AutoSizer>
      {({ width, height }) => (
        <HotKeys keyMap={keyMap} handlers={listHotKeyHandler} allowChanges innerRef={hotKeyInnerRef}>
          <VirtualList
            itemSize={itemSize}
            itemCount={searchList.length + (searchValue && searchList.length === 0 ? 0 : 1)}
            height={height}
            width={width}
            ref={listRef}
            outerRef={listScrollRef}
            className="sirius-scroll"
          >
            {({ index, style }) => {
              if (index === searchList.length) {
                return (
                  <div className="no-more" style={{ ...style }}>
                    {getIn18Text('DAODILA~')}
                  </div>
                );
              }
              const item = searchList[index];
              const isLeaf = Boolean(item.contact);
              let selected;
              let checked;
              let disableCheck;
              if (item.id) {
                if (selectedContact?.id) {
                  selected = selectedContact.id === item.id;
                }
                const membersMailList: string[] = [];
                if (item.children?.length) {
                  item.children.forEach(member => {
                    const email = member.model?.contact.accountName;
                    if (email) {
                      membersMailList.push(email);
                    }
                  });
                }
                checked = membersMailList.every(email => selectedList.some(cur => cur.email === email));
              }
              if (item.contact) {
                const email = item.contact.hitQueryEmail || item.contact.accountName;
                if (selectedContact?.contact) {
                  const selectedEmail = selectedContact?.contact.hitQueryEmail || selectedContact?.contact.accountName;
                  selected = selectedEmail === email;
                }
                if (multiple) {
                  checked = selectedList.some(cur => cur.email === email);
                  if (disableCheckList) {
                    disableCheck = disableCheckList.some(cur => cur.email === email);
                  }
                }
              }
              return (
                <div className="contact-list-item" key={item.id || item.contact?.id} style={{ ...style }}>
                  <ListItem
                    type="search"
                    showAvatar={showAvatar}
                    showCheckbox={showCheckbox}
                    checked={checked}
                    disableCheck={disableCheck}
                    selected={selected}
                    isLeaf={isLeaf}
                    item={item}
                    onSelect={onListItemSelect}
                    searchText={searchValue}
                  />
                </div>
              );
            }}
          </VirtualList>
        </HotKeys>
      )}
    </AutoSizer>
  );
  const renderList = () => (searchList.length === 0 ? renderNoData() : renderData());
  const renderLoading = () => (
    <div className="contact-list-loading">
      <SpinIcon className="sirius-spin" />
    </div>
  );
  const content = searchListLoading ? renderLoading() : renderList();
  return <div className="sirius-contact-list-container">{content}</div>;
});
export default ContactList;
