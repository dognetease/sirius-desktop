import React, { useState, useEffect } from 'react';
import { Modal, ModalProps } from 'antd';
import { apiHolder } from 'api';
import { SearchContactType, transContactModel2ContactItem } from '@web-common/components/util/contact';
import SelectList from '../selectList';
import SelectedList from '../selectedList';
import styles from './index.module.scss';
import { ContactItem, ContactTreeType } from '@web-common/utils/contact_util';

interface ContactModalProps {
  visible: boolean;
  isIM?: boolean;
  from: string;
  type?: ContactTreeType[];
  searchType?: SearchContactType;
  showFooter?: boolean;
  showTitle?: boolean;
  showAddOrgBtn?: boolean;
  showAddTeamBtn?: boolean;
  defaultSelectList?: ContactItem[];

  onCancel?(item: ContactItem[]): void;

  onSure?(item: ContactItem[]): void;

  onSelect?(item: ContactItem[], data: ContactItem[]): void;

  modalProps?: ModalProps;
  includeSelf?: boolean;
  firstPositionNotDelEmail?: string;
  noRelateEnterprise?: boolean;
}

const systemApi = apiHolder.api.getSystemApi();
const SiriusContactModal: React.FC<ContactModalProps> = props => {
  const {
    showAddOrgBtn,
    showAddTeamBtn,
    showFooter = true,
    showTitle = true,
    type,
    searchType,
    isIM,
    visible = true,
    onCancel,
    onSure,
    onSelect,
    defaultSelectList,
    modalProps,
    includeSelf,
    firstPositionNotDelEmail,
    noRelateEnterprise,
  } = props;
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
  useEffect(() => {
    if (defaultSelectList) {
      console.info('modal-handleSelect', defaultSelectList);
      setSelectList([...defaultSelectList]);
      setNeedScrollBottom(true);
    }
  }, [defaultSelectList]);
  useEffect(() => {
    if (!includeSelf) {
      user?.contact && setDisableCheckList([transContactModel2ContactItem(user.contact)]);
    }
  }, [user, includeSelf]);
  useEffect(() => {
    if (defaultSelectList?.length) {
      setSure(true);
    } else if (selectList.length > 0) {
      setSure(true);
    } else {
      setSure(false);
    }
  }, [defaultSelectList, selectList]);
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
          <span>选择联系人</span>
          <span className={styles.close} onClick={handleCancel} />
        </div>
        <div className={styles.modalBody}>
          <div className={styles.bodyLeft}>
            <SelectList
              isIM={isIM}
              type={type}
              searchType={searchType}
              showAddOrgBtn={showAddOrgBtn}
              showAddTeamBtn={showAddTeamBtn}
              disableCheckList={disableCheckList}
              defaultSelectList={selectList}
              onSelect={handleSelect}
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
              showFooter={showFooter}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default SiriusContactModal;
