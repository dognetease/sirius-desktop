import { Select, SelectProps, Tooltip } from 'antd';
import { apiHolder, SystemApi, apis, ContactApi, OrgApi, SimpleTeamInfo, CustomerSearchContactMemoryRes, inWindow, CustomerOrgType } from 'api';
import classnames from 'classnames';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import debounce from 'lodash/debounce';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import TagCloseIcon from '@web-common/components/UI/Icons/svgs/TagCloseSvg';
// @ts-ignore
import { TeamAvatar } from '@web-im/common/imUserAvatar';
import {
  getColor,
  getContactItemKey,
  getSelectedItemBySelectOrg,
  SelectedContactMap,
  splitSearchHit,
  verifyEmail,
  creatExternalContentItem,
  transContactSearch2ContactItem,
  transOrgSearch2OrgItem,
  SearchContactOrgItem,
  transCustomerSearchData,
  isOrg,
} from '@web-common/components/util/contact';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import customerAvatar from '@/images/icons/contact/customer_avatar.svg';
import clueAvatar from '@/images/icons/contact/clue_avatar.svg';
import useContactItemEffect from '@web-common/components/UI/SiriusContact/useContactItemEffect';
import { ContactItem, OrgItem } from '@web-common/utils/contact_util';
import Avatar from '../../Avatar';
import styles from './index.module.scss';
import { FetchLock } from '@web-common/utils/utils';
import InputContextMenu from '@web-common/components/UI/InputContextMenu/InputContextMenu';
import IconCard from '@web-common/components/UI/IconCard';
import lodashGet from 'lodash/get';
import { getIn18Text } from 'api';
import { CustomerLabelByRole } from '@web-mail/components/ReadMail/component/CustomerLabel';

export interface ContactSelectProps extends SelectProps<string[]> {
  useEdm?: boolean;
  defaultSelectList?: ContactItem[];
  showSuffix?: boolean;
  showClear?: boolean;
  useSuffixIcon?: boolean;
  showNoData?: boolean;
  isIM?: boolean;
  className?: string;
  dropdownClassName?: string;
  onClickSuffix?(): void;
  changeHandle?(item: ContactItem[], data: ContactItem[]): void;
  onChange?(value: Array<any>, option?: any): void;
  includeSelf?: boolean;
  // 第一个联系人不能删除的email
  firstPositionNotDelEmail?: string;
  // 是否隐藏头像
  hideAvatar?: boolean;
  // tag限制字符个数
  characterLimit?: number;
  // 联想是否默认选中，为false选中第一个，true则在输入关键词已输入的情况下才选中第一个
  unSelect?: boolean;
  // select内容失焦后是否单行展示，false为单行
  multiRow?: boolean;
  // 添加上限，超过后成员icon不可点并置灰
  ceiling?: number;
  noRelateEnterprise?: boolean;
  // 是否有输入重复toast
  repeatToast?: boolean;
  // 账号信息，限制仅仅搜索某个账号下的信息
  _account?: string;
}
interface OptionItemProps {
  item: SearchContactOrgItem;
  searchValue?: string;
  isOrg: boolean;
  noData?: boolean;
}
interface OptionNoDataItemProps {
  searchValue: string;
  noData?: boolean;
}
interface OptionLabel {
  search?: string;
  key?: string;
  value: string;
  isLeaf: boolean;
  noData?: boolean;
  label?: React.ReactElement;
}
interface OtherArgs {
  hideAvatar?: boolean;
  characterLimit?: number;
}
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as ContactApi & OrgApi;
// const renderOptionHighlight = (res: ReturnType<typeof splitSearchHit>, def: any) => {
//   if (!res) {
//     return def;
//   }
//   const {
//     head,
//     target,
//     tail
//   } = res;
//   return (
//     <>
//       {head}
//       <b>{target}</b>
//       {tail}
//     </>
//   );
// };
const renderTagFunc = (emailNotDel?: string, otherArgs?: OtherArgs) => (props: any) => {
  const { value, label, onClose } = props;
  let name = value;
  let email = value;
  let avatar;
  if (label.props && React.isValidElement<OptionItemProps>(label) && label.props.item) {
    const item = label.props.item as ContactItem;
    name = item.name;
    email = item.email;
    avatar = item.avatar;
  }
  const valiteEmail = verifyEmail(String(email?.trim()));
  return (
    <div
      data-test-id="contact_select_input_tag_item"
      className={classnames(styles.tagWrapper, {
        [styles.tagWrapperError]: !valiteEmail,
      })}
    >
      {otherArgs?.hideAvatar ? null : (
        <div className={styles.tagAvatar}>
          <Avatar
            item={{
              contact: {
                avatar,
                contactName: name,
                color: getColor(email),
              },
            }}
          />
        </div>
      )}
      <Tooltip title={email} placement="bottom">
        <div
          className={classnames(styles.tagName, {
            [styles.tagNameError]: !valiteEmail,
            [styles.tagNameWidth]: otherArgs?.characterLimit,
          })}
        >
          {otherArgs?.characterLimit && name?.length > otherArgs?.characterLimit ? `${name.slice(0, otherArgs?.characterLimit)}...` : name}
        </div>
      </Tooltip>
      {emailNotDel !== email && (
        <span onClick={onClose} data-test-id="contact_select_input_btn_tagClose" className={styles.tagClose}>
          <TagCloseIcon className="dark-invert" />
        </span>
      )}
    </div>
  );
};
const OptionItem: React.FC<OptionItemProps> = ({ item, searchValue = '', isOrg }) => {
  let teamInfo: SimpleTeamInfo;
  const renderHighLight = (text: string) => {
    if (!searchValue) {
      return text;
    }
    const result = splitSearchHit(searchValue, text);
    if (!result) {
      return text;
    }
    return (
      <>
        {result.head}
        <b className={styles.hitText}>{result.target}</b>
        {result.tail}
      </>
    );
  };
  const renderDepartment = (department: string[][]) => department.map(de => de.join('/')).join('-');
  let subtitle;
  let title;
  let department = '';
  let renderAvatar = <></>;
  let titleLabelRole; // 渲染lable需要的EmailRole
  let isContact; // 是客户联系人还是客户
  if (!isOrg) {
    const { email, name, position, avatar, id, type, customerRole } = item as ContactItem;
    title = renderHighLight(name || email);
    subtitle = renderHighLight(email);
    titleLabelRole = customerRole;
    isContact = true;
    if (Array.isArray(position)) {
      department = renderDepartment(position);
    }
    renderAvatar = <AvatarTag size={20} contactId={id} user={{ email, name, avatar }} />;
  } else {
    const { id, orgName, avatar, memberNum, type, orgType, customerRole } = item as OrgItem;
    title = renderHighLight(orgName);
    subtitle = memberNum !== undefined ? memberNum + getIn18Text('REN') : '';
    if (type === 2002 || type === 2003) {
      titleLabelRole = customerRole;
    }
    if (type === 2000) {
      const teamId = id.startsWith('team_') ? id.split('team_')[1] : id;
      teamInfo = { teamId, avatar };
      renderAvatar = <TeamAvatar style={{ width: 20, height: 20 }} teamId={teamInfo.teamId} teamInfo={teamInfo} />;
    } else if (type === 2001) {
      // 复用TeamAvatar
      renderAvatar = <TeamAvatar style={{ width: 20, height: 20 }} teamId={'5117576620'} teamInfo={{ teamId: '5117576620' }} />;
    } else if (item.type === 2002) {
      // customer
      renderAvatar = <IconCard type="crmClient" />;
    } else if (item.type === 2003) {
      // 线索
      renderAvatar = <IconCard type="hintClient" />;
    }
  }
  return (
    <div className={styles.optionWrapper} data-test-id="contact_select_input_option_item">
      <div className={styles.optionAvatarWrap}>{renderAvatar}</div>
      <span>{title}</span>
      <span hidden={!subtitle}>（{subtitle}）</span>
      <span className={styles.optionDepart} hidden={!department}>
        {department}
      </span>
      {/* <span
        hidden={!titleLabel}
        className={classnames(styles.titleLabel, {
          [styles.isMy]: isCustomer,
        })}
      >
        {titleLabel}
      </span> */}
      {titleLabelRole && <CustomerLabelByRole role={titleLabelRole} isContact={isContact} style={{ marginLeft: 8 }} />}
    </div>
  );
};

const OptionNoDataItem: React.FC<OptionNoDataItemProps> = ({ searchValue }) => (
  <div className={styles.contactSelectNoData} data-test-id="contact_select_input_option_noData">
    <span className={styles.contactIcon} />
    <span className={classnames(styles.contactValue, 'sirius-flex-ellipsis-text')}>
      {getIn18Text('WAIBULIANXIREN')}
      {searchValue}
    </span>
  </div>
);

const SelectInput: React.FC<ContactSelectProps> = prop => {
  const {
    className,
    isIM = true,
    showSuffix,
    showClear,
    useSuffixIcon = true,
    onClickSuffix,
    changeHandle,
    dropdownClassName,
    includeSelf,
    firstPositionNotDelEmail,
    hideAvatar = false,
    unSelect = false,
    multiRow = false,
    characterLimit = 0,
    ceiling = 0,
    repeatToast = false,
    showNoData = true,
    noRelateEnterprise = false,
    useEdm = true,
    _account,
    ...props
  } = prop;
  const [searchList, setSearchList] = useState<SearchContactOrgItem[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [maxTagCount, setMaxTagCount] = useState<'responsive' | undefined>('responsive');
  const [scrollFlag, setScrollFlag] = useState<number>(0);
  const ref = useRef<any>(null);
  const [selectValue, setSelectValue] = useState<SelectedContactMap>(new Map());
  const fetchLock = useMemo(() => new FetchLock(), []);
  const refRorInput = useRef(null);

  const defaultSelectList = useMemo(() => {
    return props.defaultSelectList?.filter(item => {
      return item;
    });
  }, [props.defaultSelectList?.length]);
  /**
   * 选中item
   * @param values
   */
  const handleChange = async (values: OptionLabel[]) => {
    // 新建日程的情况下 第一个人不能被删除
    if (firstPositionNotDelEmail && values?.length === 0) {
      return;
    }
    if (Array.isArray(defaultSelectList) && defaultSelectList.length < values.length) {
      setScrollFlag(pre => pre + 1);
    }
    if (Array.isArray(values)) {
      const orgList: OrgItem[] = [];
      const contactItemList: ContactItem[] = [];
      values.forEach(({ label }) => {
        const props = label?.props as OptionItemProps;
        if (props) {
          const { item, isOrg, searchValue, noData } = props;
          if (noData) {
            searchValue && contactItemList.push(creatExternalContentItem(searchValue));
          } else if (!isOrg) {
            contactItemList.push(item as ContactItem);
          } else {
            orgList.push(item as OrgItem);
          }
        }
      });
      let oldMap: SelectedContactMap = new Map();
      if (orgList.length) {
        const idList: string[] = [];
        const edmIdList: string[] = [];
        orgList.forEach(org => {
          if (org?.children) {
            org.children.forEach(item => {
              const itemKey = getContactItemKey(item, false);
              oldMap.set(itemKey, item);
            });
          } else {
            if (org.type === 2002 || org.type === 2003) {
              edmIdList.push(org.id);
            } else {
              idList.push(org.id);
            }
          }
        });
        if (idList.length) {
          const res = await getSelectedItemBySelectOrg({
            selectedMap: oldMap,
            idList,
            checked: true,
          });
          res.contactItem.forEach((item, itemKey) => {
            oldMap.set(itemKey, item);
          });
        }
        if (edmIdList.length) {
          const res = await getSelectedItemBySelectOrg({
            selectedMap: oldMap,
            idList: edmIdList,
            checked: true,
            useEdm: true,
          });
          res.contactItem.forEach((item, itemKey) => {
            oldMap.set(itemKey, item);
          });
        }
      }
      contactItemList.forEach(item => {
        const key = getContactItemKey(item);
        const isSelected = oldMap.has(key);
        // isSelected ? oldMap.delete(key) : oldMap.set(key, item);
        if (isSelected) {
          oldMap.delete(key);
        } else {
          // 超过ceiling的时候，也不让输入
          if (!!ceiling && oldMap.size < ceiling) {
            oldMap.set(key, item);
          } else if (!ceiling) {
            oldMap.set(key, item);
          }
        }
      });
      setSelectValue(oldMap);
      const list = [...oldMap.values()];
      changeHandle && changeHandle(list, list);
    } else {
      changeHandle && changeHandle([], []);
    }
    setSearchValue('');
  };
  const handleSearch = (str: string) => {
    setSearchValue(str);
  };

  const doSearchContact = async (query: string) => {
    const fetchId = fetchLock.setFetchId();
    // const { main, edm } = await contactApi.doSearchNew({
    const { main, edm } = await contactApi.doSearchAllContactNew({
      query,
      isIM,
      showDisable: false,
      useEdmData: useEdm && process.env.BUILD_ISEDM,
      noRelateEnterprise,
      _account,
    });
    if (fetchId !== fetchLock.getFetchId()) {
      return;
    }
    // 外贸数据处理
    let myCustomerContacts: ContactItem[] = [];
    let myClueContacts: ContactItem[] = [];
    let myCustomerOrgs: SearchContactOrgItem[] = [];
    let myClueOrgs: SearchContactOrgItem[] = [];
    if (useEdm && edm) {
      const orderEdmData = transCustomerSearchData(edm as CustomerSearchContactMemoryRes);
      myCustomerContacts = orderEdmData['myCustomerContact'] as ContactItem[];
      myCustomerOrgs = orderEdmData['myCustomer'];
      // myClueContacts = orderEdmData['myClueContact'] as ContactItem[];
      // myClueOrgs = orderEdmData['myClue'];
    }

    // 一般数据处理
    const personalContacts: ContactItem[] = [];
    const enterpriseContacts: ContactItem[] = [];
    const otherContacts: ContactItem[] = [];
    const teams: OrgItem[] = [];
    const personalGroups: OrgItem[] = [];
    const allAccountsOrgIdMap = Object.keys(main).reduce((total, subEmail) => {
      const { personalOrgList } = main[subEmail]!;

      if (!personalOrgList || !personalOrgList.length) {
        return total;
      }
      total[subEmail] = personalOrgList.map(item => {
        return item.id;
      });
      return total;
    }, {} as Record<string, string[]>);

    // 请求个人分组成员数量数据
    try {
      const promiseRequestList = Object.keys(allAccountsOrgIdMap).map(subAccount => {
        return contactApi.queryPersonalMemberCount(allAccountsOrgIdMap[subAccount]!, subAccount);
      });

      const allPersonalGroupList = await Promise.all(promiseRequestList);

      Object.keys(allAccountsOrgIdMap).forEach((subAccount, index) => {
        const personalGroupMap = allPersonalGroupList[index]!;
        main[subAccount].personalOrgList = main[subAccount].personalOrgList
          .filter(orgItem => {
            const { id } = orgItem;
            return lodashGet(personalGroupMap, `[${id}]`, 0);
          })
          .map(orgItem => {
            const { id } = orgItem;
            orgItem.orgName = `${orgItem.orgName}(联系组)`;
            orgItem.memberNum = lodashGet(personalGroupMap, `[${id}]`, 0);
            return orgItem;
          });
      });
    } catch (ex) {}

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
      if (teamList?.length) {
        teamList.forEach(item => {
          teams.push(transOrgSearch2OrgItem(item));
        });
      }

      if (personalOrgList && personalOrgList.length) {
        personalOrgList.forEach(item => {
          personalGroups.push(transOrgSearch2OrgItem(item));
        });
      }
    });

    // 整合
    const email = systemApi.getCurrentUser()?.id;
    // 企业通讯录 > 我的客户联系人 > 我的线索联系人 > 个人通讯录 > 陌生人
    // 联系人去重
    const allContactSet = new Set();
    const duplicateRemContacts: ContactItem[] = [...enterpriseContacts, ...myCustomerContacts, ...myClueContacts, ...personalContacts, ...otherContacts].reduce(
      (total: ContactItem[], cur: ContactItem) => {
        const { email: emailAddr } = cur;
        // 已存在
        const isSelected = selectValue.has(getContactItemKey(cur));
        const isSelf = includeSelf && cur.email === email;
        if (!allContactSet.has(emailAddr) && (!isSelected || isSelf)) {
          allContactSet.add(emailAddr);
          return [...total, cur];
        }
        return [...total];
      },
      []
    );
    allContactSet.clear();

    // 联系人 > 群组 > 我的客户 > 我的线索
    const searchedList: SearchContactOrgItem[] = [...duplicateRemContacts, ...personalGroups, ...teams, ...myCustomerOrgs, ...myClueOrgs];
    setSearchList(searchedList);
  };

  const debounceSearch = useCallback(
    debounce(
      val => {
        doSearchContact(val);
      },
      500,
      {
        leading: true,
      }
    ),
    []
  );
  const handleBlur = () => {
    setTimeout(() => {
      setSearchValue('');
      setMaxTagCount('responsive');
      ref.current?.blur();
    }, 300);
  };
  const handleFocus = () => {
    setMaxTagCount(undefined);
    setTimeout(() => {
      ref.current?.focus();
    }, 100);
  };
  const handleSuffixClick = () => {
    showSuffix && onClickSuffix && onClickSuffix();
  };
  useContactItemEffect(defaultSelectList, () => {
    const itemMap = new Map();
    defaultSelectList.forEach(item => {
      const key = getContactItemKey(item);
      itemMap.set(key, item);
    });
    setSelectValue(itemMap);
    // 这里为啥要加上获取焦点， 这样做可能会破坏使用他的表单的焦点逻辑 使得只能获得这个组件焦点
    // 先去掉了 后面有问题再讨论
    // handleFocus();
  });
  useEffect(() => {
    if (searchValue) {
      debounceSearch(searchValue);
    }
  }, [searchValue]);

  const selectValueList = useMemo(() => {
    const list: OptionLabel[] = [];
    selectValue.forEach(item => {
      const key = getContactItemKey(item);
      list.push({
        key,
        value: item.email?.trim(),
        isLeaf: true,
        label: <OptionItem searchValue={searchValue} item={item} isOrg={false} />,
      });
    });
    return list;
  }, [selectValue]);

  const options = useMemo(() => {
    const list: OptionLabel[] = [];
    if (searchValue) {
      const trimSearchValue = searchValue?.trim();
      searchList?.forEach(item => {
        if (item) {
          if (isOrg(item)) {
            list.push({
              search: searchValue,
              key: item.id,
              value: item.id!,
              isLeaf: false,
              label: <OptionItem key={item.id} searchValue={searchValue} item={item} isOrg />,
            });
          } else {
            const key = getContactItemKey(item as ContactItem);
            list.push({
              search: searchValue,
              key,
              value: key?.trim(),
              isLeaf: true,
              label: <OptionItem searchValue={searchValue} item={item} isOrg={false} />,
            });
          }
        }
      });
      if (showNoData) {
        const isExist = selectValueList.some(item => item.value === trimSearchValue);
        if (!isExist && unSelect && trimSearchValue) {
          list.unshift({
            key: `noData${trimSearchValue}`,
            value: trimSearchValue,
            isLeaf: false,
            noData: true,
            label: <OptionNoDataItem searchValue={trimSearchValue} noData />,
          });
        } else if (!isExist && !list.length && trimSearchValue) {
          list.push({
            key: `noData${trimSearchValue}`,
            value: trimSearchValue,
            isLeaf: false,
            noData: true,
            label: <OptionNoDataItem searchValue={trimSearchValue} noData />,
          });
        }
      }
    }
    return list;
  }, [searchList, searchValue, showNoData, selectValueList]);

  useEffect(() => {
    if (inWindow()) {
      const sel = document.querySelector(`.${styles.selectWrapper} .ant-select-selector`);
      if (sel) {
        sel.scrollTop = sel.scrollHeight;
      }
    }
    return () => {
      // cleanup
    };
  }, [scrollFlag]);

  const isExist = selectValueList.some(item => item.value === searchValue.trim());
  const dropDownHideFirstChild = unSelect && options.length > 1 && !isExist;
  const undropDownHideFirstChild = unSelect && options.length <= 1 && isExist;
  const handleKeydown = (e: React.KeyboardEvent) => {
    const keycode = e.nativeEvent.key;
    if (keycode === 'Enter' && selectValueList?.length && searchValue && (dropDownHideFirstChild || undropDownHideFirstChild) && isExist) {
      SiriusMessage.warn({ content: getIn18Text('YIYOUZHONGFUNEI') });
      setSearchValue('');
    }
  };
  const handleClear = useCallback(() => {
    setSelectValue(new Map());
    changeHandle && changeHandle([], []);
  }, [setSelectValue, changeHandle]);
  const visibleClearBtn = useMemo(() => {
    return Boolean(showClear && !maxTagCount && (searchValue || selectValue.size));
  }, [searchValue, maxTagCount, showClear, selectValue]);
  const suffixDisable = ceiling && selectValueList.length >= ceiling;
  return (
    <div className={styles.contactSelectWrap} ref={refRorInput} data-test-id="contact_select_input">
      <InputContextMenu inputOutRef={refRorInput} changeVal={handleSearch}>
        <Select
          {...props}
          ref={ref}
          mode="multiple"
          dropdownClassName={classnames(styles.dropDownWrapper, dropdownClassName, {
            [styles.dropDownHideFirstChild]: dropDownHideFirstChild,
          })}
          className={classnames(className, styles.contactSelectWrap, {
            [styles.suffixPadding]: showSuffix && useSuffixIcon,
            [styles.suffixPaddingTxt]: !useSuffixIcon && showSuffix,
            [styles.clearPadding]: showClear && !showSuffix,
            [styles.clearSuffixIconPadding]: showClear && showSuffix && useSuffixIcon,
            [styles.clearSuffixTxtPadding]: showClear && showSuffix && !useSuffixIcon,
            [styles.contactSelectScroll]: multiRow,
          })}
          onSearch={handleSearch}
          tagRender={renderTagFunc(firstPositionNotDelEmail, { hideAvatar, characterLimit })}
          notFoundContent={null}
          value={selectValueList as any}
          // autoClearSearchValue
          searchValue={searchValue}
          {...(!multiRow && { maxTagCount })}
          maxTagPlaceholder={<span>{`${getIn18Text('GONG')}${selectValueList.length}${getIn18Text('REN')}`}</span>}
          menuItemSelectedIcon={null}
          // open
          // open={Boolean(searchValue && options.length)}
          onChange={handleChange as any}
          labelInValue
          /** 显示全部 */
          optionFilterProp="label"
          // filterOption={false}
          filterOption={(_, option: any) => !selectValue.has(option.key)}
          onBlur={handleBlur}
          onFocus={handleFocus}
          options={options}
          {...(repeatToast && { onKeyDown: handleKeydown })}
        />
      </InputContextMenu>
      {visibleClearBtn && (
        <div
          data-test-id="contact_select_input_btn_clear"
          className={styles.contactSelectClearIcon}
          style={{ right: !useSuffixIcon ? 92 : 36 }}
          onClick={handleClear}
        ></div>
      )}
      {showSuffix && (
        <div
          data-test-id="contact_select_input_btn_openModal"
          className={classnames({
            [styles.contactSelectSuffixIcon]: useSuffixIcon,
            [styles.contactSelectSuffixTxt]: !useSuffixIcon,
            [styles.contactSelectSuffixIconDisable]: useSuffixIcon && suffixDisable,
            [styles.contactSelectSuffixTxtDisable]: !useSuffixIcon && suffixDisable,
          })}
          onClick={() => (suffixDisable ? {} : handleSuffixClick())}
        >
          {!useSuffixIcon ? getIn18Text('TIANJIAGERENCHENGYUAN') : ''}
        </div>
      )}
    </div>
  );
};
export default SelectInput;
