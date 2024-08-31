import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import { Select, Tag, Spin } from 'antd';
import debounce from 'lodash/debounce';
import { ContactModel, EntityOrg } from 'api';
import ContactItem from '../ContactItem/contactItem';
import { searchContact, SearchGroupKey } from '@web-common/utils/contact_util';
import TagCloseIcon from '@web-common/components/UI/Icons/svgs/TagCloseSvg';
import { CoactorContext, ContactItemModel } from '../SharePage/sharePage';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import styles from './selector.module.scss';
import { getIn18Text } from 'api';
const LIST_ITEM_HEIGHT = 50;
const LIST_HEIGHT = LIST_ITEM_HEIGHT * 6;
export interface OptionLabel {
  key?: string;
  value: string;
  label: React.ReactElement;
}
const getContactModelKey: (ContactItemModel) => string = item => `${item?.contact?.id || item?.id || '_'}`;
const buildOptionLabel = (item: ContactItemModel, search: string, coactors: ContactItemModel[]): OptionLabel => {
  const key = getContactModelKey(item);
  const coactor = coactors.find(elem => getContactModelKey(elem) === key);
  const privilege = coactor?.privilege;
  const showPrivilege = !!privilege;
  return {
    value: key,
    label: <ContactItem key={key} item={item} search={search} showPrivilege={showPrivilege} privilege={privilege} />,
  };
};
export interface ChipProps {
  value: any;
  item: ContactItemModel;
}
const Chip: React.FC<ChipProps> = props => {
  const { item } = props;
  if (!item) {
    return null;
  }
  const { orgName } = item as EntityOrg;
  const { contact } = item as ContactModel;
  const { contactName, avatar, color = '#386EE7', id } = contact || {};
  const name = contactName || orgName;
  const truncateName = name?.length > 20 ? `${name.slice(0, 18)}...` : name;
  return (
    <div className={styles.capsuleTag}>
      <AvatarTag
        size={20}
        contactId={id}
        user={{
          name,
          avatar,
          color,
        }}
      />
      <span className={styles.label}>{truncateName}</span>
    </div>
  );
};
const search = (value: string) =>
  searchContact({
    query: value,
    isIM: true,
    showDisable: false,
    filter: {
      contact: [{ key: 'type', val: 'personal' }],
      org: [{ key: 'type', val: 99 }],
    },
    noRelateEnterprise: true,
  });
export interface SelectorProps {
  ref?: any;
  curCoactors?: ContactItemModel[];
  className?: string;
}
const Selector: React.FC<SelectorProps> = props => {
  const { curCoactors = [], className } = props;
  const [keyword, setKeyword] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<OptionLabel[]>([]);
  const [fetching, setFetching] = useState(false);
  const [contactList, setContactList] = useState<ContactModel[]>([]);
  const [orgList, setOrgList] = useState<EntityOrg[]>([]);
  const [teamList, setTeamList] = useState<any>([]);
  const { dispatch, coactors } = useContext(CoactorContext);
  const fetchRef = useRef(0);
  const refSelect = useRef(null);
  const debouncedSearch = useMemo(() => {
    const loadOptions = (value: string) => {
      const fetchId = fetchRef.current;
      setFetching(true);
      search(value).then(searchContactList => {
        if (fetchId !== fetchRef.current) {
          return;
        }
        console.log('111----searchContactList', searchContactList);
        const contactList = (searchContactList && searchContactList[SearchGroupKey.PERSON]) || [];
        const orgList = (searchContactList && searchContactList[SearchGroupKey.CORP]) || [];
        let teamList = (searchContactList && searchContactList[SearchGroupKey.TEAM]) || [];
        teamList = teamList.map(item => ({
          ...item,
          id: item.id.split('_')[1],
          originId: item.originId.split('_')[1],
        }));
        setContactList(contactList);
        setOrgList(orgList);
        setTeamList(teamList);
        setFetching(false);
      });
    };
    return debounce(loadOptions, 200);
  }, []);
  const changeKeyword = (value: string) => {
    console.log('value changed', value);
    setKeyword(value);
    setFetching(true);
  };
  const handleChange = (items: OptionLabel[]) => {
    // console.log(`selected`, items.length);
    const contactItems = items.map(item => item.label.props.item).filter(item => !curCoactors.find(coactor => getContactModelKey(coactor) === getContactModelKey(item)));
    dispatch({ type: 'change', payload: contactItems });
    const selector = document.querySelector(`.${styles.selectorWrapper} .ant-select-selector`);
    if (selector) {
      setTimeout(() => {
        selector.scrollTo({ top: selector.scrollHeight });
      }, 100);
    }
  };
  useEffect(() => {
    setSelectedItems(coactors.map(item => buildOptionLabel(item, '', curCoactors)));
  }, [coactors]);
  const selectItem = useCallback((value, option) => {
    console.log('selectItem', value, `keyword is ${keyword}`, option);
    setKeyword('');
  }, []);
  const tagRender = useCallback((props: any) => {
    const { value, label, closable, onClose } = props;
    const item = label?.props?.item;
    return (
      <Tag closable={closable} onClose={onClose} closeIcon={<TagCloseIcon />}>
        <Chip value={value} item={item} />
      </Tag>
    );
  }, []);
  useEffect(() => {
    debouncedSearch(keyword);
    return () => {
      fetchRef.current += 1;
    };
  }, [keyword]);
  const contactOptions = contactList.map(item => buildOptionLabel(item, keyword, curCoactors));
  const orgOptions = orgList.map(item => buildOptionLabel(item, keyword, curCoactors));
  const teamOptions = teamList.map(item => buildOptionLabel(item, keyword, curCoactors));
  let options = contactOptions
    .concat(teamOptions)
    .concat(orgOptions)
    .filter(option => !selectedItems.find(item => item.value === option.value));
  let notFoundContent;
  if (fetching) {
    notFoundContent = (
      <div className={styles.notFound}>
        <Spin size="small" />
      </div>
    );
  } else if (keyword && !options.length) {
    notFoundContent = (
      <div className={styles.notFound}>
        <div className="sirius-empty sirius-empty-doc" />
        <div className={styles.notFoundText}>{getIn18Text('WEIZHAODAOXIANGGUAN')}</div>
      </div>
    );
  } else {
    notFoundContent = null;
  }
  const selectBlur = () => {
    setKeyword('');
    options = [];
  };
  return (
    <>
      <Select
        placeholder={getIn18Text('SOUSUOYONGHU/')}
        dropdownClassName={`${className} ${styles.selectorDropdown}`}
        className={styles.selectorWrapper}
        listHeight={LIST_HEIGHT}
        mode="multiple"
        notFoundContent={notFoundContent}
        bordered={false}
        // searchValue={keyword}
        value={selectedItems}
        onChange={handleChange}
        onBlur={selectBlur}
        onSelect={selectItem as any}
        onSearch={changeKeyword}
        tagRender={tagRender}
        maxTagPlaceholder={() => `等${selectedItems.length}人`}
        autoFocus
        options={options}
        filterOption={false}
        labelInValue
        ref={refSelect}
      />
    </>
  );
};
export default Selector;
