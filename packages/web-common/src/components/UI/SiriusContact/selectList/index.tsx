import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
// import { Input } from 'antd';
// import { Input as LxInput } from '@web-common/components/UI/Input';
import LxInput from '@lingxi-common-component/sirius-ui/Input';
import SearchIcon from '../../Icons/svgs/SearchSvg';
import { ContactOrgItem, ContactTreeOrgNodeType, SearchContactType } from '@web-common/components/util/contact';
import SearchList, { ContactListProp, ContactListRefs } from '../searchList';
import ContactTree from '../tree';
import { ContactTreeProp } from '../tree/data';
import styles from './index.module.scss';
import { useAppSelector } from '@web-common/state/createStore';
import useContactItemEffect from '@web-common/components/UI/SiriusContact/useContactItemEffect';
import { StaticRootNodeKey } from '@web-common/utils/contact_util';
import debounce from 'lodash/debounce';
import { api, apis, NIMApi, ContactTreeType, ProductAuthApi } from 'api';
import { getIn18Text } from 'api';

const productApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

interface SelectContainerProps {
  // 容器高度
  containerHeight?: string;
  // 多账号下某个账号
  accountRootKey?: string;
  // 是否显示外贸数据
  useEdm?: boolean;
  // 是否客户联系人优先展示
  isCustomerFirst?: boolean;
  // 是否是多账号模式
  useMultiAccount?: boolean;
  // 是否把自己加入不可选中的联系人
  excludeSelf?: boolean;
  // 是否只使用im联系人数据
  isIM?: boolean;
  // 搜索展示的联系人类型
  searchType?: SearchContactType;
  // 搜索框是否自动聚焦
  searchAutoFocus?: boolean;
  // 使用联系人id作为最小key
  useContactId?: boolean;
  // 组织是否可以当作一个最小单位选中
  useOrgUnit?: boolean;
  // 是否可以多选
  multiple?: boolean;
  // 是否展示选中框
  showCheckbox?: boolean;
  // 是否展示选择组织
  showAddOrgBtn?: boolean;
  // 是否展示选择群组
  showAddTeamBtn?: boolean;
  // 是否展示部门人数信息
  showOrgMemberNum?: boolean;
  // 是否展示选择个人分组
  showAddPersonalBtn?: boolean;
  // 是否展示分隔线
  showSeparator?: boolean;
  // 是否展示查看邮件列表群成员按钮
  showMailListEye?: boolean;
  // 默认选中的联系人列表
  defaultSelectList?: ContactOrgItem[];
  // 默认的搜索值
  defaultSearchVal?: string;
  // 默认不可选中的联系人列表
  disableCheckList?: ContactOrgItem[];
  // 默认展开的树的节点
  defaultExpandedKeys?: Array<StaticRootNodeKey>;
  // 需要展示的联系人类型
  type?: ContactTreeType[];
  // 展示的联系人类型的排列顺序
  order?: ContactTreeType[];
  // 展开树的父节点回调
  onExpand?(type: ContactTreeOrgNodeType, isOpen: boolean): void;
  // 不展示关联企业的数据
  noRelateEnterprise?: boolean;
  // 是否可以将个人通讯录下的email拍平
  flattenPersonalEmails?: boolean;
  // contactModel(个人)是否要根据email去重
  deduplicationByEmail?: boolean;
  /**
   * 选中返回的值
   * @param item 以email为key，是唯一值
   * @param data 以contact.hitQueryEmail || contact.accountName 为唯一值 (data可能会有相同的id)
   */
  onSelect?(item: ContactOrgItem[], data: ContactOrgItem[]): void;

  // 搜索的值发生变化
  onInputChange?(value: string): void;

  // 联系人树的option
  treeProps?: ContactTreeProp;

  // 联系人搜索列表的option
  searchListProps?: ContactListProp;
  // 是否展示企业通讯录联系人
  shouldShowOrgContact?: boolean;
  // 无数据是否展示空数据状态
  showNoDataPlaceholder?: boolean;
}

const nimApi = api.requireLogicalApi(apis.imApiImpl) as NIMApi;

const SelectList: React.FC<SelectContainerProps> = props => {
  const {
    searchAutoFocus = true,
    showAddOrgBtn,
    showAddTeamBtn,
    showAddPersonalBtn,
    showMailListEye,
    showNoDataPlaceholder,
    showSeparator,
    defaultExpandedKeys,
    order,
    defaultSelectList = [],
    defaultSearchVal,
    disableCheckList,
    onSelect,
    isIM,
    treeProps,
    multiple = true,
    showCheckbox = true,
    type = ['personal', 'enterprise', 'team', 'recent'],
    searchType = 'all',
    searchListProps,
    onInputChange,
    onExpand,
    excludeSelf,
    useContactId,
    useEdm,
    isCustomerFirst = false,
    useMultiAccount,
    accountRootKey,
    noRelateEnterprise,
    containerHeight,
    useOrgUnit,
    showOrgMemberNum = false,
    flattenPersonalEmails = false,
    deduplicationByEmail = true,
    // shouldShowOrgContact = true
  } = props;
  const [searchValue, setSearchValue] = useState<string>(defaultSearchVal || '');
  // const [propSearchValue, setPropSearchValue] = useState<string>(defaultSearchVal || '');
  const [selectList, setSelectList] = useState<ContactOrgItem[]>([]);
  const inputRef = useRef<null>(null);
  const contactListRef = useRef<ContactListRefs>(null);
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);

  const showAndUseEdm = useEdm && !!productApi.getABSwitchSync('edm_mail');

  const handleSelect = (itemList: ContactOrgItem[], data: ContactOrgItem[]) => {
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
  };

  // const debounceMailChange = debounce((keyword) => {
  //   contactListRef?.current?.handleInputChange(keyword);
  // }, 200);
  //
  const searchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);
    debounceSearchChange(value);
  };

  useContactItemEffect(
    defaultSelectList,
    () => {
      setSelectList(defaultSelectList);
    },
    useContactId
  );

  // debounceMailChange(searchKeyword);

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
  const treeType: ContactTreeType[] = useMemo(() => {
    const typeSet = new Set(type);
    if (isCorpMail) {
      typeSet.delete('recent');
      typeSet.delete('enterprise');
    }
    if (!nimApi.getIMAuthConfig()) {
      typeSet.delete('team');
    }
    return [...typeSet];
  }, [isCorpMail, type]);

  return (
    <div className={styles.selectContainer}>
      <div className={styles.contactSearchWrap}>
        <LxInput
          data-test-id="contact_selectList_search_input"
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
      <div className={styles.contactListTab} style={{ height: containerHeight || undefined }} hidden={searchValue === ''}>
        <SearchList
          accountRootKey={accountRootKey}
          useEdm={showAndUseEdm}
          isCustomerFirst={showAndUseEdm && isCustomerFirst}
          excludeSelf={excludeSelf}
          isIM={isIM}
          type={searchType}
          useContactId={useContactId}
          useOrgUnit={useOrgUnit}
          showCheckbox={showCheckbox}
          showAddTeamBtn={showAddTeamBtn}
          showAddPersonalBtn={showAddPersonalBtn}
          multiple={multiple}
          ref={contactListRef}
          disableCheckList={disableCheckList}
          defaultSelectList={selectList}
          onSelect={handleSelect}
          noRelateEnterprise={noRelateEnterprise}
          flattenPersonalEmails={flattenPersonalEmails}
          deduplicationByEmail={deduplicationByEmail}
          {...searchListProps}
        />
      </div>
      <div className={styles.contactTreeTab} style={{ height: containerHeight || undefined }} hidden={searchValue !== ''}>
        <ContactTree
          accountRootKey={accountRootKey}
          useEdm={showAndUseEdm}
          useMultiAccount={useMultiAccount}
          excludeSelf={excludeSelf}
          isIM={isIM}
          type={treeType}
          useContactId={useContactId}
          useOrgUnit={useOrgUnit}
          multiple={multiple}
          order={order}
          defaultExpandedKeys={defaultExpandedKeys}
          showAddOrgBtn={showAddOrgBtn}
          showAddTeamBtn={showAddTeamBtn}
          showAddPersonalBtn={showAddPersonalBtn}
          showSeparator={showSeparator}
          showMailListEye={showMailListEye}
          showNoDataPlaceholder={showNoDataPlaceholder}
          showCheckbox={showCheckbox}
          disableCheckList={disableCheckList}
          defaultSelectList={selectList}
          onContactSelect={handleSelect}
          onExpand={onExpand}
          noRelateEnterprise={noRelateEnterprise}
          showOrgMemberNum={showOrgMemberNum}
          {...treeProps}
        />
      </div>
    </div>
  );
};
export default SelectList;
