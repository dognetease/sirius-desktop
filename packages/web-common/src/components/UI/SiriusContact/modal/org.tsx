import React, { useState, useEffect } from 'react';
import { Modal, ModalProps } from 'antd';
import { SearchContactType } from '@web-common/components/util/contact';
import SelectList from '../selectList/org';
import SelectedList from '../selectedList/org';
import styles from './index.module.scss';
import { useOrgItemEffect } from '@web-common/components/UI/SiriusContact/useContactItemEffect';
import { OrgItem } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';

interface OrgModalProps {
  visible: boolean;
  isIM?: boolean;
  searchType?: SearchContactType;
  showFooter?: boolean;
  showTitle?: boolean;
  defaultSelectList?: OrgItem[];
  defaultDisableCheckList?: OrgItem[];
  onCancel?(item: OrgItem[]): void;
  onSure?(item: OrgItem[]): void;
  onSelect?(item: OrgItem[], data: OrgItem[]): void;
  modalProps?: ModalProps;
  noRelateEnterprise?: boolean;
  showAddTeamBtn?: boolean;
}
const SiriusContactModal: React.FC<OrgModalProps> = props => {
  const {
    showFooter = true,
    showTitle = true,
    searchType,
    isIM,
    visible = true,
    onCancel,
    onSure,
    onSelect,
    defaultSelectList = [],
    defaultDisableCheckList: disableCheckList = [],
    modalProps,
    noRelateEnterprise,
    showAddTeamBtn = true,
  } = props;
  const [selectList, setSelectList] = useState<OrgItem[]>([]);
  const [needScrollBottom, setNeedScrollBottom] = useState<boolean>(true);
  // 产品要求，选中的个数为0，当有默认值（defaultSelectList）的时候可以点击确定，没有默认值不能确定
  const [canSure, setSure] = useState<boolean>(true);
  const handleSelect = (itemList: OrgItem[], contactList: OrgItem[]) => {
    setSelectList(itemList);
    setNeedScrollBottom(true);
    onSelect && onSelect(itemList, contactList);
  };
  const handleDelete = (itemList: OrgItem[], contactList: OrgItem[]) => {
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
  useOrgItemEffect(defaultSelectList, () => {
    if (defaultSelectList.length) {
      setSure(true);
    }
    setSelectList(defaultSelectList);
    setNeedScrollBottom(true);
  });
  useEffect(() => {
    if (selectList.length > 0) {
      setSure(true);
    } else {
      setSure(false);
    }
  }, [selectList]);
  return (
    <Modal visible={visible} closable={false} width={680} footer={null} title={null} destroyOnClose bodyStyle={{ padding: 0 }} {...modalProps}>
      <div className={styles.modalContainer}>
        <div className={styles.modalTitle} hidden={!showTitle}>
          <span>{getIn18Text('XUANZELIANXIREN')}</span>
          <span className={`dark-invert ${styles.close}`} onClick={handleCancel} />
        </div>
        <div className={styles.modalBody}>
          <div className={styles.bodyLeft}>
            <SelectList
              isIM={isIM}
              searchType={searchType}
              disableCheckList={disableCheckList}
              defaultSelectList={selectList}
              onSelect={handleSelect}
              noRelateEnterprise={noRelateEnterprise}
              showAddTeamBtn={showAddTeamBtn}
            />
          </div>
          <div className={styles.bodyRight}>
            <SelectedList
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
