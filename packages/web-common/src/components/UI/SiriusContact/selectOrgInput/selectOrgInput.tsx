import { Select, Tooltip } from 'antd';
import { apis, api, ContactAndOrgApi, inWindow } from 'api';
import classnames from 'classnames';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import debounce from 'lodash/debounce';
import TagCloseIcon from '@web-common/components/UI/Icons/svgs/TagCloseSvg';
import { TeamAvatar } from '@web-im/common/imUserAvatar';
import { splitSearchHit, transOrgSearch2OrgItem } from '@web-common/components/util/contact';
import { useOrgItemEffect } from '@web-common/components/UI/SiriusContact/useContactItemEffect';
import { OrgItem } from '@web-common/utils/contact_util';
import styles from './index.module.scss';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { ReactComponent as OrgIcon } from '@/images/icons/contact/org_icon.svg';
import { getIn18Text } from 'api';

export interface OrgSelectProps {
  defaultSelectList?: OrgItem[];
  showSuffix?: boolean;
  showClear?: boolean;
  useSuffixIcon?: boolean;
  isIM?: boolean;
  className?: string;
  dropdownClassName?: string;
  noRelateEnterprise?: boolean;
  onClickSuffix?(): void;
  changeHandle?(item: OrgItem[], data: OrgItem[]): void;
  onChange?(value: OrgItem[], option?: OrgItem[]): void;
  enableSearchEntityOrg?: boolean;
  // 是否隐藏头像
  hideAvatar?: boolean;
  // tag限制字符个数
  characterLimit?: number;
  // 添加上限，超过后成员icon不可点并置灰
  ceiling?: number;
  placeholder?: string;
  showAddTeamBtn?: boolean;
}
interface OptionItemProps {
  item: OrgItem;
  searchValue?: string;
}
interface OptionLabel {
  key?: string;
  value: string;
  label?: React.ReactElement;
}
interface OtherArgs {
  hideAvatar?: boolean;
  characterLimit?: number;
}
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

const renderTagFunc = (params: OtherArgs) => (props: any) => {
  const { label, onClose } = props;
  const { characterLimit, hideAvatar } = params;
  let Avatar = <></>;
  let title = '';
  if (label?.props?.item) {
    const item = label.props.item as OrgItem;
    const { id, orgName, avatar, orgType } = item;
    title = orgName;
    if (orgType === 'team') {
      const teamId = id.startsWith('team_') ? id.split('team_')[1] : id;
      const teamInfo = { teamId, avatar };
      Avatar = <TeamAvatar style={{ width: 20, height: 20 }} teamId={teamInfo.teamId} teamInfo={teamInfo} />;
    } else {
      Avatar = <AvatarTag user={{ name: id }} avatarImg={<OrgIcon />} />;
    }
  }
  return (
    <div className={classnames(styles.tagWrapper)} data-test-id="contact_select_input_tag_item">
      {hideAvatar ? null : <div className={styles.tagAvatar}>{Avatar}</div>}
      <Tooltip title={title} placement="bottom">
        <div
          className={classnames(styles.tagName, {
            [styles.tagNameWidth]: params?.characterLimit,
          })}
        >
          {characterLimit && title?.length > characterLimit ? `${title.slice(0, characterLimit)}...` : title}
        </div>
      </Tooltip>
      <span onClick={onClose} data-test-id="contact_select_input_btn_tagClose" className={styles.tagClose}>
        <TagCloseIcon />
      </span>
    </div>
  );
};

const renderHighLight = (text: string, searchValue: string = '') => {
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

const OptionItem: React.FC<OptionItemProps> = ({ item, searchValue = '' }) => {
  const { id, orgName, avatar, memberNum, orgType } = item as OrgItem;
  let renderAvatar = <AvatarTag size={20} user={{ name: id }} avatarImg={<OrgIcon />} />;
  const isTeam = orgType === 'team';
  if (isTeam) {
    const teamId = id.startsWith('team_') ? id.split('team_')[1] : id;
    const teamInfo = { teamId, avatar };
    renderAvatar = <TeamAvatar style={{ width: 20, height: 20 }} teamId={teamInfo.teamId} teamInfo={teamInfo} />;
  }
  const title = renderHighLight(orgName, searchValue);
  const subtitle = memberNum ? `（${memberNum}${getIn18Text('REN')}）` : '';
  return (
    <div className={styles.optionWrapper} data-test-id="contact_select_input_option_item">
      <div className={styles.optionAvatarWrap}>{renderAvatar}</div>
      <span>{title}</span>
      {subtitle && (
        <span>
          {/* subtitle 可能是一个组件 如果用  `${subtitle}` 去表示会转换成字符 [object Object] */}
          {subtitle}
        </span>
      )}
    </div>
  );
};

const SelectInput: React.FC<OrgSelectProps> = prop => {
  const {
    className,
    isIM = true,
    showSuffix,
    showClear,
    useSuffixIcon = true,
    onClickSuffix,
    changeHandle,
    dropdownClassName,
    defaultSelectList = [],
    hideAvatar = false,
    characterLimit = 0,
    ceiling = 0,
    noRelateEnterprise,
    enableSearchEntityOrg = false,
    showAddTeamBtn = true,
    ...props
  } = prop;
  // 搜索列表
  const [searchList, setSearchList] = useState<OrgItem[]>([]);
  // 搜索关键字
  const [searchValue, setSearchValue] = useState<string>('');
  // 最大个数
  const [maxTagCount, setMaxTagCount] = useState<'responsive' | undefined>('responsive');
  // 滚动
  const [scrollFlag, setScrollFlag] = useState<number>(0);
  // 当前组件的node
  const ref = useRef<any>(null);
  // 选中的条目
  const [selectValue, setSelectValue] = useState<OrgItem[]>([]);

  /**
   * 选中item
   * @param values
   */
  const handleChange = async (values: OptionLabel[]) => {
    if (Array.isArray(defaultSelectList) && defaultSelectList.length < values.length) {
      setScrollFlag(pre => pre + 1);
    }
    if (Array.isArray(values)) {
      const orgList: OrgItem[] = [];
      values.forEach(({ label }) => {
        const props = label?.props as OptionItemProps;
        if (props?.item) {
          orgList.push(props.item);
        }
      });
      setSelectValue(orgList);
      changeHandle && changeHandle(orgList, orgList);
    } else {
      changeHandle && changeHandle([], []);
    }
    setSearchValue('');
  };

  /**
   * 搜索组织
   * @param query
   */
  const doSearch = async (query: string) => {
    if (enableSearchEntityOrg && inWindow()) {
      window.bridgeApi.master.forbiddenBridgeOnce();
    }

    const { main } = await contactApi.doSearchNew({
      query,
      isIM,
      showDisable: false,
      useEdmData: false,
      noRelateEnterprise,
      enableUseMemory: enableSearchEntityOrg ? false : true,
      exclude: ['contactName', 'contactPYName', 'contactPYLabelName', 'accountName'],
    });
    const list: OrgItem[] = [];
    Object.keys(main).forEach(account => {
      const data = main[account] || {};
      const { orgList, personalOrgList, teamList } = data;
      [...orgList, ...personalOrgList]?.forEach(item => {
        list.push(transOrgSearch2OrgItem(item));
      });

      // 如果支持群组搜索 将群组数据也灌入到搜索列表中
      if (showAddTeamBtn) {
        teamList.forEach(item => {
          list.push(transOrgSearch2OrgItem(item));
        });
      }
    });
    setSearchList(list);
  };

  const debounceSearch = useCallback(
    debounce(
      val => {
        doSearch(val);
      },
      300,
      {
        leading: true,
      }
    ),
    []
  );

  // 失焦
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setSearchValue('');
      setMaxTagCount('responsive');
      ref.current?.blur();
    }, 300);
  }, [setMaxTagCount, setSearchValue]);

  // 聚焦
  const handleFocus = useCallback(() => {
    setMaxTagCount(undefined);
    setTimeout(() => {
      ref.current?.focus();
    }, 100);
  }, [setMaxTagCount]);

  // 点击后缀
  const handleSuffixClick = useCallback(() => {
    showSuffix && onClickSuffix && onClickSuffix();
  }, []);

  // 默认选中的条目
  useOrgItemEffect(defaultSelectList, () => {
    setSelectValue(defaultSelectList);
  });

  // 当滚动flag变化，滚动到最底下
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sel = document.querySelector(`.${styles.selectWrapper} .ant-select-selector`);
      if (sel) {
        sel.scrollTop = sel.scrollHeight;
      }
    }
    return () => {
      // cleanup
    };
  }, [scrollFlag]);

  // 当搜索的关键字变化时
  useEffect(() => {
    if (searchValue) {
      debounceSearch(searchValue);
    }
  }, [searchValue]);

  // 搜索结果
  const options: OptionLabel[] = useMemo(() => {
    const list: OptionLabel[] = [];
    if (searchValue && searchList.length) {
      searchList.forEach(item => {
        list.push({
          key: item.id,
          value: item.orgName,
          label: <OptionItem searchValue={searchValue} item={item} />,
        });
      });
    }
    return list;
  }, [searchList, searchValue]);

  // 选中列表
  const selectedOptions = useMemo(() => {
    const list: OptionLabel[] = [];
    selectValue.forEach(item => {
      list.push({
        key: item.id,
        value: item.orgName,
        label: <OptionItem searchValue={searchValue} item={item} />,
      });
    });
    return list;
  }, [selectValue, searchValue]);

  const handleClear = useCallback(() => {
    setSelectValue([]);
    setSearchValue('');
    changeHandle && changeHandle([], []);
  }, [setSelectValue, changeHandle]);

  const suffixDisable = ceiling && selectedOptions.length >= ceiling;

  const visibleClearBtn = useMemo(() => {
    return Boolean(showClear && !maxTagCount && (searchValue || selectValue.length));
  }, [searchValue, maxTagCount, showClear, selectValue]);
  return (
    <div className={styles.contactSelectWrap} data-test-id="contact_select_input">
      <Select
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        ref={ref}
        mode="multiple"
        dropdownClassName={classnames(styles.dropDownWrapper, dropdownClassName)}
        className={classnames(className, styles.contactSelectWrap, {
          [styles.suffixPadding]: showSuffix && useSuffixIcon,
          [styles.suffixPaddingTxt]: !useSuffixIcon && showSuffix,
          [styles.clearPadding]: showClear && !showSuffix,
          [styles.clearSuffixIconPadding]: showClear && showSuffix && useSuffixIcon,
          [styles.clearSuffixTxtPadding]: showClear && showSuffix && !useSuffixIcon,
        })}
        onSearch={setSearchValue}
        tagRender={renderTagFunc({ hideAvatar, characterLimit })}
        notFoundContent={null}
        value={selectedOptions as any}
        // autoClearSearchValue
        searchValue={searchValue}
        maxTagCount={maxTagCount}
        maxTagPlaceholder={<span>{`${getIn18Text('GONG')}${selectedOptions.length}${getIn18Text('BUMEN')}`}</span>}
        menuItemSelectedIcon={null}
        // open
        // open={Boolean(searchValue && options.length)}
        onChange={handleChange as any}
        labelInValue
        /** 显示全部 */
        optionFilterProp="label"
        // filterOption={false}
        filterOption={(_, option: any) => !selectValue.includes(option.key)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        options={options}
      />
      {visibleClearBtn && (
        <div data-test-id="contact_select_input_btn_clear" className={styles.contactSelectClearIcon} style={{ right: !useSuffixIcon ? 92 : 36 }} onClick={handleClear} />
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
          {!useSuffixIcon ? getIn18Text('TIANJIABUMENCHENGYUAN') : ''}
        </div>
      )}
    </div>
  );
};
export default SelectInput;
