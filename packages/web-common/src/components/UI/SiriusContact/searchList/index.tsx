import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { HotKeys, KeyMap } from 'react-hotkeys';
import { VariableSizeList as VirtualList } from 'react-window';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { api, StringMap, CustomerSearchContactMemoryRes, MemorySearchCondition } from 'api';
import styles from './index.module.scss';
import debounce from 'lodash/debounce';
import {
  EntityOrgAndContact,
  getContactItemKey,
  getSelectedItemBySelectOrg,
  isOrg,
  SearchContactType,
  SelectedContactMap,
  SelectedContactOrgMap,
  transCustomerSearchData,
  transOrgSearch2OrgItem,
} from '@web-common/components/util/contact';
import { SpinIcon } from '../../Icons/icons';
import { contactApi, ContactItem, OrgItem } from '@web-common/utils/contact_util';
import ListItem from '../listItem';
import useContactItemEffect from '@web-common/components/UI/SiriusContact/useContactItemEffect';
import { ContactOrgItem, transContactSearch2ContactItem } from '@web-common/components/util/contact';
// @ts-ignore
import MemberList from '@web-contact/component/MemberList/MemberList';
import { getIn18Text } from 'api';

export interface ContactListRefs {
  handleInputEnter(e: any): void;

  handleInputKeyDown(e: any): void;

  handleInputChange(e: any): void;
}

export interface ContactListProp {
  // 每个list-item 所占的位置大小
  itemSize?: number;
  //
  isIM?: boolean;
  ref?: React.Ref<ContactListRefs>;
  // 是否展示头像
  showAvatar?: boolean;
  // 是否展示复选框
  showCheckbox?: boolean;
  // 是否展示选择组织按钮
  showAddOrgBtn?: boolean;
  // 是否展示选群组按钮
  showAddTeamBtn?: boolean;
  // 是否展示选择分组按钮
  showAddPersonalBtn?: boolean;
  // 是否展示部门
  showPosition?: boolean;
  // 默认选中的列表
  defaultSelectList?: ContactOrgItem[];
  // 不可以选中的列表
  disableCheckList?: ContactOrgItem[];
  // 是否是多选状态
  multiple?: boolean;
  // 搜索联系人的类型
  type?: SearchContactType;
  // 是否使用联系人id当作key
  useContactId?: boolean;
  // 是否可以展示组织
  useOrgUnit?: boolean;
  // 是否不包括自己
  excludeSelf?: boolean;
  // 是否展示客户数据
  useEdm?: boolean;
  isCustomerFirst?: boolean; // 是否把客户联系人提到最前面展示，需要useEdm为true,默认为false
  // 是否是使用多账号能力
  useMultiAccount?: boolean;
  // 搜索多账号下的那个账号
  accountRootKey?: string;
  // 不展示挂载企业账号
  noRelateEnterprise?: boolean;
  // 是否将个人名下的多email拍平展示
  flattenPersonalEmails?: boolean;
  // email的contactModel(个人)是否要去重展示
  deduplicationByEmail?: boolean;
  // 选中返回
  onSelect?(allList: ContactOrgItem[], cur: ContactOrgItem[]): void;
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
const sysApi = api.getSystemApi();

const textMap: StringMap = {
  noCondition: 'WUFUHETIAOJIAN',
  noMore: 'DAODILA~',
};
const tranText = (text: string) => {
  return getIn18Text(textMap[text]);
};

const ContactList = React.forwardRef((props: ContactListProp, ref) => {
  const {
    isIM = true,
    showAvatar = true,
    showCheckbox = true,
    showPosition = true,
    showAddTeamBtn,
    showAddPersonalBtn,
    multiple = true,
    type = 'all',
    useContactId,
    useOrgUnit,
    useEdm,
    isCustomerFirst = false,
    accountRootKey: _account,
    onSelect,
    defaultSelectList = [],
    disableCheckList: defaultDisableCheckList,
    noRelateEnterprise = false,
    excludeSelf,
    showAddOrgBtn,
    deduplicationByEmail = true,
    flattenPersonalEmails = false,
  } = props;
  // 是否展示邮件列表成员
  const [showMemberList, setShowMemberList] = useState<boolean>(false);
  // 点击需要查看邮件列表成员的
  const [selectedMailList, setSelectedMailList] = useState<ContactItem>();
  // 当前选中的联系人
  const [selectedContact, setSelectedContact] = useState<ContactOrgItem>();
  // 多选时选中的集合
  const [selectedMap, setSelectedMap] = useState<SelectedContactOrgMap>(new Map());
  // 不可选中的集合
  const [disabledMap, setDisabledMap] = useState<SelectedContactOrgMap>(new Map());
  // 搜索返回的结果
  const [searchList, setSearchList] = useState<ContactOrgItem[]>([]);
  // 搜索时的loading
  const [searchListLoading, setSearchListLoading] = useState<boolean>(false);
  // 搜索值
  const [searchValue, setSearchValue] = useState<string>();
  // 用来处理快捷键的组件ref
  const hotKeyInnerRef = useRef<HTMLElement>(null);
  // 虚拟list的ref
  const listRef = useRef<VirtualList>(null);
  // 虚拟list用来滚动的ref
  const listScrollRef = useRef<any>(null);
  // 输入框的ref
  const inputValueRef = useRef<string>('');
  useContactItemEffect(
    defaultSelectList,
    () => {
      const itemMap = new Map();
      defaultSelectList.forEach(item => {
        const key = isOrg(item) ? item.id : getContactItemKey(item as ContactItem, useContactId);
        itemMap.set(key, item);
      });
      setSelectedMap(itemMap);
    },
    useContactId
  );
  useEffect(() => {
    if (defaultDisableCheckList?.length) {
      const itemMap = new Map();
      defaultDisableCheckList.forEach(item => {
        const key = isOrg(item) ? item.id : getContactItemKey(item as ContactItem, useContactId);
        itemMap.set(key, item);
      });
      setDisabledMap(itemMap);
    }
  }, [defaultDisableCheckList]);
  /**
   * 处理键盘Enter选中或者选中列表中的某一条数据
   * @param params: 不传代表键盘enter
   * @param checked
   */
  const handleSelectedItem = (params?: ContactOrgItem, checked: boolean = true) => {
    const data = params || selectedContact || searchList[0];
    if (!data) {
      return;
    }
    if (isOrg(data)) {
      handleOrgSelect(data as OrgItem, checked);
    } else {
      handleContactSelect(data as ContactItem);
    }
  };

  /**
   * 处理选中的企业组织
   * @param data: 选中的企业组织
   * @param checked
   */
  const handleOrgSelect = async (data: OrgItem, checked: boolean) => {
    if (useOrgUnit) {
      if (multiple) {
        selectedMap.set(data.id, data);
        setSelectedMap(selectedMap);
        onSelect && onSelect([...selectedMap.values()], [data]);
      } else {
        onSelect && onSelect([data], [data]);
      }
    } else {
      const { contactItem, selectContactItem } = await getSelectedItemBySelectOrg({
        checked,
        selectedList: [],
        idList: [data.id],
        selectedMap: selectedMap as SelectedContactMap,
        useEdm: data?.orgType === 'customer' || data?.orgType === 'clue',
      });
      const orgTypeList = ['team', 'customer', 'personalOrg'];
      if (orgTypeList.includes(data?.orgType)) {
        const index = searchList.findIndex(item => item.id === data.id);
        if (index !== -1) {
          setSearchList(_data => {
            _data.splice(index, 1, { ...data, children: selectContactItem });
            return _data;
          });
        }
      }
      if (multiple) {
        setSelectedMap(contactItem);
        onSelect && onSelect([...contactItem.values()], selectContactItem);
      } else {
        onSelect && onSelect(selectContactItem, selectContactItem);
      }
    }
  };
  /**
   * 处理选中的个人
   * @param data: 选中的个人数据
   */
  const handleContactSelect = async (data: ContactItem) => {
    setSelectedContact(data);
    if (multiple) {
      const key = getContactItemKey(data, useContactId);
      const isDisabled = disabledMap.has(key);
      if (isDisabled) {
        return;
      }
      const isSelected = selectedMap.has(key);
      isSelected ? selectedMap.delete(key) : selectedMap.set(key, data);
      setSelectedMap(selectedMap);
      onSelect && onSelect([...selectedMap.values()], [data]);
    } else {
      onSelect && onSelect([data], [data]);
    }
  };
  /**
   * 处理列表的上下选中
   * @param stepNum
   */
  const handleListMove = (stepNum: number) => {
    let step = stepNum;
    if (searchList?.length === 0) {
      return;
    }
    let currentIndex = 0;
    console.warn('selectedContact', selectedContact);
    if (selectedContact) {
      currentIndex = searchList.findIndex(item => {
        return selectedContact.id === item.id;
      });
    } else {
      step = 0;
    }
    const targetIndex = currentIndex + step;
    if (targetIndex < searchList.length && searchList[targetIndex]) {
      setSelectedContact(searchList[targetIndex]);
      listRef.current?.scrollToItem(targetIndex);
    }
  };
  /**
   * 搜素输入框enter事件
   */
  const handleInputEnter: React.KeyboardEventHandler<HTMLInputElement> = () => {
    handleSelectedItem();
  };
  /**
   * 搜素输入框上下键操作
   * @param e
   */
  const handleInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.keyCode === 38 || e.keyCode === 40) {
      let step;
      if (e.keyCode === 38) {
        step = -1;
      } else {
        step = 1;
      }
      handleListMove(step);
    }
  };
  /**
   * 搜素输入框值发生变化
   * @param e
   */
  const handleInputChange = (e: any) => {
    if (typeof e === 'string') {
      setSearchValue(e);
      return;
    }
    const { value } = e.target;
    setSearchValue(value);
  };

  /**
   * 获取行高
   */
  const getRowHeight = useCallback(
    index => {
      const item = searchList[index];
      let size = 60;
      if (item) {
        if (!('orgType' in item)) {
          if (item.type === 'enterprise' && item.position) {
            size = 72;
          }
        }
      }
      return size;
    },
    [searchList]
  );

  /**
   * 给搜索输入框挂载方法
   */
  useImperativeHandle(ref, () => ({
    handleInputEnter,
    handleInputKeyDown,
    handleInputChange,
  }));
  // const getCurrentAccount = () => {
  //   return sysApi.getCurrentUser()?.id || '';
  // }
  /*
   * 2021/12/23/21:37 zoumingliang
   * 搜索联系人相关数据，返回命中的人和群组
   * TODO:返回命中的部门 以及点击部门的操作
   * */
  const doSearch = async (query: string) => {
    setSearchListLoading(!0);
    const condition: MemorySearchCondition = {
      query,
      showDisable: false,
      isIM,
      useEdmData: useEdm && process.env.BUILD_ISEDM,
      _account,
      noRelateEnterprise,
      flattenMuliptleEmails: flattenPersonalEmails,
    };
    type !== 'all' && (condition.contactType = type);
    if (showAddOrgBtn) {
      window.bridgeApi.master.forbiddenBridgeOnce();
      condition.enableUseMemory = false;
    }

    // const { main, edm } = await contactApi.doSearchNew(condition);
    const { main, edm } = await contactApi.doSearchAllContactNew(condition);
    if (inputValueRef.current !== query) {
      return;
    }

    // 外贸数据处理
    let myCustomerContacts: ContactOrgItem[] = [];
    let myClueContacts: ContactOrgItem[] = [];
    let myCustomerOrgs: ContactOrgItem[] = [];
    let myClueOrgs: ContactOrgItem[] = [];
    if (useEdm && edm) {
      const orderEdmData = transCustomerSearchData(edm as CustomerSearchContactMemoryRes);
      myCustomerContacts = orderEdmData['myCustomerContact'];
      myCustomerOrgs = orderEdmData['myCustomer'];
      // myClueContacts = orderEdmData['myClueContact'];
      // myClueOrgs = orderEdmData['myClueOrg'];
    }

    // 一般数据处理
    const personalContacts: ContactOrgItem[] = [];
    const enterpriseContacts: ContactOrgItem[] = [];
    const otherContacts: ContactOrgItem[] = [];
    let teams: OrgItem[] = [];
    let personalOrgs: OrgItem[] = [];
    Object.keys(main).forEach(account => {
      const data = main[account] || {};
      const { contactList, teamList, personalOrgList } = data;
      // 联系人
      if (contactList?.length) {
        data.contactList.forEach(item => {
          const { type } = item;
          const transferedItem = transContactSearch2ContactItem(item);
          if (type === 'enterprise') {
            enterpriseContacts.push(transferedItem);
          } else if (type === 'personal') {
            personalContacts.push(transferedItem);
          } else {
            otherContacts.push(transferedItem);
          }
        });
      }
      // 群组
      if (showAddTeamBtn && teamList?.length) {
        teams = teamList.map(item => transOrgSearch2OrgItem(item));
      }
      // 个人分组
      if (showAddPersonalBtn && personalOrgList?.length) {
        personalOrgs = personalOrgList.map(transOrgSearch2OrgItem);
      }
    });

    console.log(
      'searchList datas',
      { main, edm },
      enterpriseContacts,
      myCustomerContacts,
      myClueContacts,
      personalContacts,
      otherContacts,
      teams,
      myCustomerOrgs,
      myClueOrgs
    );

    // 企业通讯录 > 我的客户联系人 > 我的线索联系人 > 个人通讯录 > 陌生人
    // 联系人去重
    const allContactSet = new Set();
    let sortContacts = [];
    if (useEdm && isCustomerFirst) {
      // 外贸通0510，此处针对写信页通讯录搜索，客户联系人提取到最前面，顺序变为：我的客户联系人 > 我的线索联系人 > 企业通讯录 >  个人通讯录 > 陌生人
      sortContacts = [...myCustomerContacts, ...myClueContacts, ...enterpriseContacts, ...personalContacts, ...otherContacts];
    } else {
      sortContacts = [...enterpriseContacts, ...myCustomerContacts, ...myClueContacts, ...personalContacts, ...otherContacts];
    }
    const duplicateRemContacts: ContactOrgItem[] = sortContacts.reduce((total: ContactOrgItem[], cur: ContactOrgItem) => {
      const { email: emailAddr } = cur as ContactItem;
      // 非个人通讯录 || deduplicationByEmail=true的场景下都要执行去重
      const enablededuplicate = cur.type !== 'personal' || deduplicationByEmail;
      // 已存在
      if (allContactSet.has(emailAddr) && enablededuplicate) {
        return total;
      }
      allContactSet.add(emailAddr);
      total.push(cur);
      return total;
    }, []);
    allContactSet.clear();

    // 联系人 > 群组 > 我的客户 > 我的线索 > 个人分组
    const searchedList = [...duplicateRemContacts, ...teams, ...myCustomerOrgs, ...myClueOrgs, ...personalOrgs];
    setSearchList(searchedList);
    // 默认第一个选中
    setSelectedContact(searchedList[0]);
    setSearchListLoading(false);
  };

  // useEffect(() => {
  //   let searchList: ContactOrgItem[] = [];
  //   searchDataMap.forEach(val => {
  //     searchList = [...searchList, ...val];
  //   })
  //   setSearchList(searchList);
  //   setSelectedContact(searchList[0]);
  //   setSearchListLoading(false);
  // }, [searchDataMap])

  const debounceSearch = useCallback(
    debounce(
      value => {
        doSearch(value);
      },
      700,
      {
        leading: true,
      }
    ),
    []
  );
  useEffect(() => {
    if (!searchValue) {
      setSearchListLoading(false);
      setSearchList([]);
    } else {
      inputValueRef.current = searchValue;
      debounceSearch(searchValue);
    }
  }, [searchValue]);
  /**
   * 给搜索列表绑定快捷键
   */
  const listHotKeyHandler = {
    [ListHotKey.KEY_UP]: (e?: KeyboardEvent) => {
      e && e.preventDefault();
      handleListMove(-1);
    },
    [ListHotKey.KEY_DOWN]: (e?: KeyboardEvent) => {
      e && e.preventDefault();
      handleListMove(1);
    },
    [ListHotKey.KEY_ENTER]: (e?: KeyboardEvent) => {
      e && e.preventDefault();
      handleSelectedItem();
    },
  };
  /**
   * 无数据展示
   */
  const renderNoData = () => <div className={styles.noData}>{tranText('noCondition')}</div>;
  /**
   * 数据列表
   */
  const renderData = () => (
    <AutoSizer>
      {({ width, height }) => (
        <HotKeys keyMap={keyMap} handlers={listHotKeyHandler} allowChanges innerRef={hotKeyInnerRef}>
          <VirtualList
            itemSize={getRowHeight}
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
                  <div className={styles.noMore} style={{ ...style }}>
                    {tranText('noMore')}
                  </div>
                );
              }
              const item = searchList[index];
              const hiddenItem = excludeSelf && item.id === sysApi.getCurrentUser()?.contact?.contact.id;
              if (hiddenItem) {
                return null;
              }
              const isLeaf = !isOrg(item);
              const selected = selectedContact?.id === item.id;
              let checked: boolean = false;
              let disableCheck: boolean;
              if (isLeaf) {
                const contactKey = getContactItemKey(item as ContactItem, useContactId, item.type === 'personal' && !deduplicationByEmail);
                disableCheck = disabledMap.has(contactKey);
                if (multiple) {
                  checked = selectedMap.has(contactKey);
                }
              } else {
                const org = item as EntityOrgAndContact;
                disableCheck = disabledMap.has(org.id);
                if (org.children?.length) {
                  checked = !org.children.some(contactItem => !selectedMap.has(getContactItemKey(contactItem, useContactId)));
                  if (checked) {
                    console.warn('searchList checked', checked, org, selectedMap);
                  }
                } else {
                  checked = false;
                }
              }
              return (
                <div className={styles.listItem} key={item.id + '::' + (item as ContactItem)?.email} style={{ ...style }}>
                  <ListItem
                    testId="contact_selectList_search_list_item"
                    onSelect={() => {
                      !disableCheck && handleSelectedItem(item, !checked);
                    }}
                    onSelectMailListIcon={data => {
                      setShowMemberList(true);
                      setSelectedMailList(data);
                    }}
                    type="search"
                    showAvatar={showAvatar}
                    showCheckbox={showCheckbox}
                    showPosition={showPosition}
                    showMailListIcon
                    checked={checked}
                    disableCheck={disableCheck}
                    selected={selected}
                    isLeaf={isLeaf}
                    item={item}
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
  /**
   * 数据加载中
   */
  const renderLoading = () => (
    <div className={styles.listLoading}>
      <SpinIcon className="sirius-spin" />
    </div>
  );
  /**
   * 组建内容
   */
  const content = searchListLoading ? renderLoading() : renderList();
  return (
    <>
      <div className={styles.listContainer} data-test-id="contact_selectList_search_list">
        {content}
      </div>
      {showMemberList && selectedMailList && (
        <MemberList
          showDetail={false}
          user={selectedMailList.email}
          _account={_account}
          contactName={selectedMailList.name}
          showModel={showMemberList}
          closeModel={() => {
            setShowMemberList(false);
          }}
        />
      )}
    </>
  );
});
export default ContactList;
