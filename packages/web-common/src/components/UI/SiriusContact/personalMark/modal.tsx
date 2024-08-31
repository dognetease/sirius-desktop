import React, { useState, useMemo, useEffect } from 'react';
import { Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import SelectList from '../selectList';
import SelectedList from '../selectedList';
import styles from './modal.module.scss';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import { AccountApi, api, apis, ContactAndOrgApi, contactInsertParams, DataTrackerApi, PersonalMarkParams, SystemApi } from 'api';
import { ContactItem, StaticRootNodeKey } from '@web-common/utils/contact_util';

import { ContactOrgItem, isOrg, transContactModel2ContactItem } from '@web-common/components/util/contact';
import { getIn18Text } from 'api';
interface PersonalMarkModalProps {
  onCancel(): void;
  onSure(updateList: PersonalMarkParams[]): void;
  _account?: string;
}
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const systemApi = api.getSystemApi() as SystemApi;
const dataTracker = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const PersonalMarkModal: React.FC<PersonalMarkModalProps> = props => {
  const { onCancel, onSure, _account = systemApi.getCurrentUser()?.id || '' } = props;
  const [needScrollBottom, setNeedScrollBottom] = useState<boolean>(true);
  const [selectList, setSelectList] = useState<ContactOrgItem[]>([]);
  const [defaultSelectList, setDefaultSelectList] = useState<ContactOrgItem[]>([]);

  useEffect(() => {
    contactApi.doGetContactPersonalMarkList().then(list => {
      setDefaultSelectList(list);
    });
  }, []);
  // 是否可以确认
  const canSure = useMemo(() => selectList.length > 0, [selectList.length]);
  /**
   * 删除选中列表数据
   * @param itemList
   */
  const handleDelete = (itemList: ContactOrgItem[]) => {
    setSelectList(itemList);
    setNeedScrollBottom(false);
  };
  /**
   * 当选中列表发生变化
   * @param itemList
   */
  const handleSelect = (itemList: ContactOrgItem[]) => {
    setSelectList(list => [...list, ...itemList]);
    setNeedScrollBottom(true);
  };
  /**
   * 点击取消按钮
   */
  const handleCancel = () => {
    onCancel();
  };
  /**
   * 点击确认按钮
   */
  const handleSure = async () => {
    const updateMarkedList: PersonalMarkParams[] = [];
    const enterpriseEmailMap = new Map<string, ContactItem>();
    // 将选中的人和列表分类
    selectList.forEach(item => {
      if (item?.id) {
        updateMarkedList.push({
          id: item.id,
          type: isOrg(item) ? 2 : 1,
        });
        if (item.type === 'enterprise') {
          enterpriseEmailMap.set(item.email, item);
        }
      }
    });
    dataTracker.track('pcMail_click_submit_addStarContactPage');
    if (enterpriseEmailMap.size) {
      // 从选中的企业的邮箱，获取同时存在个人通讯录中的相同邮箱
      const personalEmailList = await contactApi.doGetContactByItem({
        type: 'EMAIL',
        value: [...enterpriseEmailMap.keys()],
        filterType: 'personal',
        _account,
      });
      // 分类和企业相同邮箱的个人联系人：已存在的个人联系人 + 可以新建的个人联系人（剩余的企业联系人）
      personalEmailList.forEach(item => {
        const {
          contact: { contactName: name, id },
          contactInfo,
        } = item;
        const email = contactApi.doGetModelDisplayEmail(item);
        if (enterpriseEmailMap.has(email)) {
          const currentItem = enterpriseEmailMap.get(email)!;
          if (email === currentItem.email && currentItem.name === name) {
            const len = contactInfo.filter(info => info.contactItemType === 'EMAIL').length;
            if (len > 1) {
              const index = updateMarkedList.findIndex(item => item.id === currentItem.id);
              if (index > -1) {
                updateMarkedList.splice(index, 1, { id, type: 1 });
                enterpriseEmailMap.delete(email);
              }
            }
          }
        }
      });

      // 不存在的个人联系人调用新增联系人
      const enterpriseList: contactInsertParams[] = [];
      enterpriseEmailMap.forEach(item => {
        enterpriseList.push({
          name: item.name,
          emailList: [item.email],
          groupIdList: [],
          isMark: true,
        });
      });

      if (enterpriseList.length) {
        // accountApi.setCurrentAccount({ email: _account });
        const {
          success,
          data: insertPersonalList,
          error,
        } = await contactApi.doInsertContact({
          list: enterpriseList,
          _account,
        });
        if (success && insertPersonalList) {
          insertPersonalList.forEach(item => {
            const { email, id } = transContactModel2ContactItem(item);
            const currentItem = enterpriseEmailMap.get(email);
            const index = updateMarkedList.findIndex(item => item.id === currentItem?.id);
            if (index > -1 && id) {
              updateMarkedList.splice(index, 1, { id, type: 1 });
            }
          });
        } else {
          message.error(error || getIn18Text('TIANJIASHIBAI'));
          return;
        }
      }
    }
    if (updateMarkedList.length) {
      // 已经存在的个人联系人/分组 调用编辑接口
      const { success, msg } = await contactApi.doBatchOperatePersonalMark(updateMarkedList, 'add');
      if (success) {
        message.success(getIn18Text('TIANJIACHENGGONG'));
        onSure && onSure(updateMarkedList);
      } else {
        message.error(msg || getIn18Text('TIANJIASHIBAI'));
      }
    }
  };
  const disableCheckList = useMemo(() => {
    return [...defaultSelectList, ...selectList];
  }, [defaultSelectList, selectList]);
  return (
    <SiriusHtmlModal visible width={640} zIndex={100} destroyOnClose closable={false} title={null} footer={null}>
      <div className={styles.wrap}>
        <div className={styles.modalTitle}>
          <div className={styles.titleName}>
            <span data-test-id="modal_personalMark_title"> {getIn18Text('addMarkContactAndOrg')}</span>
          </div>
          <div className={styles.close} data-test-id="modal_personalMark_btn_close" onClick={handleCancel} />
        </div>
        <div className={styles.modalContent}>
          <div className={styles.modalContent} data-test-id="modal_personalMark_content">
            <div className={styles.modalBody}>
              <div className={styles.bodyLeft}>
                <SelectList
                  useMultiAccount={false}
                  multiple={false}
                  accountRootKey={_account}
                  isIM={false}
                  useContactId
                  disableCheckList={disableCheckList}
                  searchAutoFocus={false}
                  type={['personal', 'enterprise']}
                  defaultExpandedKeys={[StaticRootNodeKey.PERSON]}
                  showNoDataPlaceholder
                  useOrgUnit
                  showAddOrgBtn={false}
                  showAddPersonalBtn
                  showAddTeamBtn={false}
                  showCheckbox={false}
                  onSelect={handleSelect}
                />
              </div>
              <div className={styles.bodyRight}>
                <SelectedList
                  useContactId
                  useOrgUnit
                  showPosition={false}
                  selectList={selectList}
                  onDelete={handleDelete}
                  needScrollBottom={needScrollBottom}
                  showFooter={false}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button
                type="default"
                data-test-id="modal_personalMark_btn_cancel"
                className={styles.cancelBtn}
                onClick={() => {
                  handleCancel();
                }}
              >
                {getIn18Text('QUXIAO')}
              </Button>
              <Button
                disabled={!canSure}
                data-test-id="modal_personalMark_btn_sure"
                type="primary"
                className={styles.sureBtn}
                onClick={() => {
                  handleSure();
                }}
              >
                {getIn18Text('QUEDING')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SiriusHtmlModal>
  );
};
export default PersonalMarkModal;
