import { Select, SelectProps } from 'antd';
import { ContactModel, EntityScheduleAndContact } from 'api';
import classnames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { UIContactModel } from '@web-contact/data';
import { getCharAvatar, splitSearchHit } from '@web-contact/util';
import { contactApi, getSearchContact } from '@web-contact/_mock_';
import { verifyEmail } from '@web-mail-write/util';
import styles from './memberselect.module.scss';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { SearchGroupKey } from '@web-common/utils/contact_util';

export interface MemberSelectProps extends SelectProps<string[]> {
  initMembers?: EntityScheduleAndContact[];
}

export interface ContactItem {
  name: string;
  email: string;
  position?: string[][];
}

interface OptionItemProps {
  item: ContactItem;
  searchValue?: string;
}

interface OptionLabel {
  key?: string;
  value: string;
  label: React.ReactElement;
}

const renderOptionHighlight = (res: ReturnType<typeof splitSearchHit>, def: any) => {
  if (!res) {
    return def;
  }
  const { head, target, tail } = res;
  return (
    <>
      {head}
      <b>{target}</b>
      {tail}
    </>
  );
};

const renderTagFunc = props => {
  const { value, label, onClose } = props;
  let name = value;
  let email = value;
  if (React.isValidElement<OptionItemProps>(label)) {
    name = label.props.item.name;
    email = label.props.item.email;
  }

  const valiteEmail = verifyEmail(String(email?.trim()));
  const color = valiteEmail ? contactApi.getColor(name) : '#F74F4F';
  return (
    <div
      className={classnames(styles.tagWrapper, {
        [styles.tagWrapperError]: !valiteEmail,
      })}
    >
      <AvatarTag user={{ name, email, color }} />
      <div
        title={name}
        className={classnames(styles.tagName, {
          [styles.tagNameError]: !valiteEmail,
        })}
      >
        {name}
      </div>
      <span onClick={onClose} className={styles.tagClose}>
        x
      </span>
    </div>
  );
};

const OptionItem: React.FC<OptionItemProps> = ({ item, searchValue = '' }) => {
  const { email, name, position } = item;
  return (
    <span className={styles.optionWrapper}>
      {renderOptionHighlight(splitSearchHit(searchValue, name), name)}（{renderOptionHighlight(splitSearchHit(searchValue, email), email)}）
      <span className={styles.optionDepart}>{Array.isArray(position) && <span>{position.map(e => e.join('/')).join('-')}</span>}</span>
    </span>
  );
};

const transContactInfo2ContactItem = (item?: EntityScheduleAndContact[]) => {
  const contactItems: ContactItem[] = [];
  if (item) {
    item.forEach(e => {
      contactItems.push({
        name: e.simpleInfo.extNickname || e.simpleInfo.extDesc || '',
        email: e.simpleInfo.extDesc || '',
      });
    });
  }
  return contactItems;
};

const transContactModel2ContactItem = (item: ContactModel) => {
  const contactItems: ContactItem = {
    name: item.contact.contactName,
    email: item.contact.accountName,
    position: item.contact.position,
  };
  return contactItems;
};

const MemberSelect: React.FC<MemberSelectProps> = ({ className, onChange, value, dropdownClassName, initMembers, ...props }) => {
  const [members, setMembers] = useState<UIContactModel[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [maxTagCount, setMaxTagCount] = useState<'responsive'>();
  const [scrollFlag, setScrollFlag] = useState<number>(0);
  const ref = useRef<any>(null);

  const [selectValue, setSelectValue] = useState<OptionLabel[]>(
    transContactInfo2ContactItem(initMembers).map(e => ({
      key: e.email,
      value: e.email,
      label: <OptionItem searchValue={searchValue} item={e} />,
    }))
  );
  const handleSearch = (str: string) => {
    setSearchValue(str);
    if (str) {
      getSearchContact(str, '').then(res => {
        if (res) {
          // const systemApi = apiHolder.api.getSystemApi() as SystemApi
          // const user = systemApi.getCurrentUser()
          setMembers(res[SearchGroupKey.ALL].filter(e => !selectValue.map(s => s.value).includes(e.contact.accountName)));
        }
      });
    }
    setMembers([]);
  };

  const handleChange = (v: any, p: any) => {
    if (onChange) {
      setSelectValue(v);
      const triggerValue = Array.isArray(v) ? v.map(e => e.value) : [];
      if (Array.isArray(value) && value.length < triggerValue.length) {
        setScrollFlag(pre => pre + 1);
      }
      onChange(triggerValue, p);
    }
    setMembers([]);
    setSearchValue('');
  };

  const options = members.map(m => ({
    key: m.contact.id,
    value: m.contact.accountName,
    label: <OptionItem searchValue={searchValue} item={transContactModel2ContactItem(m)} />,
  }));

  const handleBlur = () => {
    setTimeout(() => {
      setMaxTagCount('responsive');
      ref.current?.blur();
    }, 100);
  };
  const handleFocus = () => {
    setMaxTagCount(undefined);
    setTimeout(() => {
      ref.current?.focus();
    }, 100);
  };
  useEffect(() => {
    if (typeof window !== undefined) {
      const sel = document.querySelector(`.${styles.selectWrapper} .ant-select-selector`);
      if (sel) {
        sel.scrollTop = sel.scrollHeight;
      }
    }
    return () => {
      // cleanup
    };
  }, [scrollFlag]);

  return (
    <Select
      ref={ref}
      mode="tags"
      allowClear
      dropdownClassName={classnames(styles.dropDownWrapper, dropdownClassName)}
      onSearch={handleSearch}
      tagRender={renderTagFunc}
      notFoundContent={null}
      value={selectValue as any}
      // autoClearSearchValue
      searchValue={searchValue}
      maxTagCount={maxTagCount}
      className={classnames(className, styles.selectWrapper)}
      maxTagPlaceholder={<span>{`共${selectValue.length}人`}</span>}
      menuItemSelectedIcon={null}
      // open
      open={Boolean(searchValue && options.length)}
      onChange={handleChange}
      labelInValue
      /** 显示全部 */
      optionFilterProp="label"
      // filterOption={false}
      filterOption={(_, option) => !selectValue.map(e => e.value).includes(option?.value)}
      {...props}
      onBlur={handleBlur}
      onFocus={handleFocus}
      options={options}
    />
  );
};

export default MemberSelect;
