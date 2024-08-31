import React, { useState, useEffect } from 'react';
import { SearchContactType } from '@web-common/components/util/contact';
import SelectList from '../selectList';
import SelectedList from '../selectedList';
import styles from './index.module.scss';
import { ContactItem, ContactTreeType } from '@web-common/utils/contact_util';

interface ContactIMModalProps {
  type?: ContactTreeType[];
  searchType?: SearchContactType;
  disableCheckList?: ContactItem[];
  onCancel?(item: ContactItem[], data?: ContactItem[]): void;
  onSure?(item: ContactItem[]): void;
  onChange?(item: ContactItem[], data?: ContactItem[]): void;
  defaultSelectList?: ContactItem[];
  order?: [ContactTreeType, ContactTreeType, ContactTreeType, ContactTreeType];
  showAddTeamBtn?: boolean;
  accountRootKey?: string;
  useEdm?: boolean;
}

const SiriusContactIMModal: React.FC<ContactIMModalProps> = props => {
  const {
    onCancel,
    onSure,
    onChange,
    type = ['enterprise'],
    disableCheckList,
    searchType = 'enterprise',
    defaultSelectList,
    order,
    accountRootKey,
    showAddTeamBtn,
    useEdm,
  } = props;
  const [needScrollBottom, setNeedScrollBottom] = useState<boolean>(true);
  const [selectList, setSelectList] = useState<ContactItem[]>([]);
  const handleDelete = (itemList: ContactItem[], contactList: ContactItem[]) => {
    setSelectList(itemList);
    setNeedScrollBottom(false);
    onChange && onChange(itemList, contactList);
  };

  const handleSelect = (itemList: ContactItem[], contactList: ContactItem[]) => {
    setSelectList(itemList);
    setNeedScrollBottom(true);
    onChange && onChange(itemList, contactList);
  };
  const handleCancel = () => {
    onCancel && onCancel(selectList);
  };
  const handleSure = (itemList: ContactItem[]) => {
    setSelectList(itemList);
    onSure && onSure(selectList);
  };

  useEffect(() => {
    if (defaultSelectList != null) {
      setSelectList(defaultSelectList);
    }
  }, [defaultSelectList]);

  return (
    <div className={styles.wrap}>
      <div className={styles.bodyLeft}>
        <SelectList
          containerHeight="100%"
          isIM
          showNoDataPlaceholder
          order={order}
          type={type}
          searchType={searchType}
          defaultSelectList={selectList}
          disableCheckList={disableCheckList}
          useEdm={useEdm}
          showAddTeamBtn={showAddTeamBtn}
          showAddOrgBtn
          onSelect={handleSelect}
          accountRootKey={accountRootKey}
          noRelateEnterprise={true}
        />
      </div>
      <div className={styles.bodyRight}>
        <SelectedList
          selectList={selectList}
          onDelete={handleDelete}
          onCancel={handleCancel}
          onSure={handleSure}
          needScrollBottom={needScrollBottom}
          showFooter={false}
          showPosition={false}
        />
      </div>
    </div>
  );
};
export default SiriusContactIMModal;
