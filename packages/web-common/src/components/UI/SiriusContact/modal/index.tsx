import React, { useState, useEffect } from 'react';
import { Modal, ModalProps } from 'antd';
import { apiHolder } from 'api';
import { SearchContactType, transContactModel2ContactItem } from '@web-common/components/util/contact';
import SelectList from '../selectList';
import SelectedList from '../selectedList';
import styles from './index.module.scss';
import useContactItemEffect from '@web-common/components/UI/SiriusContact/useContactItemEffect';
import { ContactItem, ContactTreeType } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';
interface ContactModalProps {
  visible: boolean;
  isIM?: boolean;
  type?: ContactTreeType[];
  useEdm?: boolean;
  searchType?: SearchContactType;
  showFooter?: boolean;
  showTitle?: boolean;
  showAddOrgBtn?: boolean;
  showAddTeamBtn?: boolean;
  showAddPersonalBtn?: boolean;
  defaultSelectList?: ContactItem[];
  onCancel?(item: ContactItem[]): void;
  onSure?(item: ContactItem[]): void;
  onSelect?(item: ContactItem[], data: ContactItem[]): void;
  modalProps?: ModalProps;
  includeSelf?: boolean;
  multiple?: boolean;
  showCheckbox?: boolean;
  firstPositionNotDelEmail?: string;
  noRelateEnterprise?: boolean;
  accountRootKey?: string; // 使用的是哪个账号的通讯录
}
const systemApi = apiHolder.api.getSystemApi();
const SiriusContactModal: React.FC<ContactModalProps> = props => {
  const {
    showAddOrgBtn,
    showAddTeamBtn,
    showAddPersonalBtn,
    showFooter = true,
    showTitle = true,
    type,
    useEdm,
    searchType,
    isIM,
    visible = true,
    onCancel,
    onSure,
    onSelect,
    defaultSelectList = [],
    modalProps,
    includeSelf,
    firstPositionNotDelEmail,
    noRelateEnterprise,
    accountRootKey,
  } = props;
  const { multiple, showCheckbox } = props;
  const [selectList, setSelectList] = useState<ContactItem[]>([]);
  const [needScrollBottom, setNeedScrollBottom] = useState<boolean>(true);
  const [disableCheckList, setDisableCheckList] = useState<ContactItem[]>([]);
  // 产品要求，选中的个数为0，当有默认值（defaultSelectList）的时候可以点击确定，没有默认值不能确定
  const [canSure, setSure] = useState<boolean>(true);
  const user = systemApi.getCurrentUser();
  const handleSelect = (itemList: ContactItem[], contactList: ContactItem[]) => {
    setSelectList(itemList);
    setNeedScrollBottom(true);
    onSelect && onSelect(itemList, contactList);
  };
  const handleDelete = (itemList: ContactItem[], contactList: ContactItem[]) => {
    setSelectList(itemList);
    setNeedScrollBottom(false);
    onSelect && onSelect(itemList, contactList);
  };
  const handleCancel = () => {
    setSelectList(defaultSelectList ? [...defaultSelectList] : []);
    onCancel && onCancel(selectList);
  };
  const handleSure = () => {
    onSure && onSure(selectList);
  };
  useContactItemEffect(defaultSelectList, () => {
    if (defaultSelectList.length) {
      setSure(true);
    }
    setSelectList(defaultSelectList);
    setNeedScrollBottom(true);
  });
  useEffect(() => {
    if (!includeSelf) {
      user?.contact && setDisableCheckList([transContactModel2ContactItem(user.contact)]);
    }
  }, [user, includeSelf]);
  useEffect(() => {
    if (selectList.length > 0) {
      setSure(true);
    } else {
      setSure(false);
    }
  }, [selectList]);
  return (
    <Modal
      visible={visible}
      closable={false}
      width={680}
      footer={null}
      title={null}
      destroyOnClose
      bodyStyle={{ padding: 0 }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...modalProps}
    >
      <div className={styles.modalContainer}>
        <div className={styles.modalTitle} hidden={!showTitle}>
          <span>{getIn18Text('XUANZELIANXIREN')}</span>
          <span className={`dark-invert ${styles.close}`} onClick={handleCancel} />
        </div>
        <div className={styles.modalBody}>
          <div className={styles.bodyLeft}>
            <SelectList
              accountRootKey={accountRootKey || user?.id}
              showNoDataPlaceholder
              useEdm={useEdm}
              isIM={isIM}
              searchType={searchType}
              type={type}
              showAddOrgBtn={showAddOrgBtn}
              showAddTeamBtn={showAddTeamBtn}
              showAddPersonalBtn={showAddPersonalBtn}
              disableCheckList={disableCheckList}
              defaultSelectList={selectList}
              onSelect={handleSelect}
              containerHeight="100%"
              multiple={multiple}
              showCheckbox={showCheckbox}
              noRelateEnterprise={noRelateEnterprise}
            />
          </div>
          <div className={styles.bodyRight}>
            <SelectedList
              firstPositionNotDelEmail={firstPositionNotDelEmail}
              needScrollBottom={needScrollBottom}
              selectList={selectList}
              onDelete={handleDelete}
              onCancel={handleCancel}
              onSure={handleSure}
              canSure={canSure}
              showPosition
              showFooter={showFooter}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default SiriusContactModal;
