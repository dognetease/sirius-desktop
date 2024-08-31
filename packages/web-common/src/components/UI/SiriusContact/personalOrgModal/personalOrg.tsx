import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Input, Button } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { tarnsEntityContact2ContactItem } from '@web-common/components/util/contact';
import SelectList from '../selectList';
import SelectedList from '../selectedList';
import styles from './index.module.scss';
import { SiriusHtmlModal } from '@web-common/components/UI/Modal/SiriusModal';
import { AccountApi, api, apis, ContactAndOrgApi, contactInsertParams, SystemApi } from 'api';
import ContactForm from '@web-common/components/UI/SiriusContact/personal/ContactForm';
import { PersonaMarkCheckbox } from '../personalMark/markTip';
import { ContactItem, StaticRootNodeKey } from '@web-common/utils/contact_util';
import { getIn18Text } from 'api';
import useStateRef from '@web-mail/hooks/useStateRef';
interface PersonalOrgModalProps {
  personalOrgId?: string;
  onCancel(): void;
  onSure(key: string, title: string, _account?: string): void;
  _account?: string;
  defaultSelectedContact?: ContactItem[];
  modelZIndex?: number;
}
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const systemApi = api.getSystemApi() as SystemApi;
const EmptySelectedContact: ContactItem[] = [];

const PersonalOrgModal: React.FC<PersonalOrgModalProps> = props => {
  const { personalOrgId, modelZIndex = 100, onCancel, onSure, _account = systemApi.getCurrentUser()?.id || '', defaultSelectedContact = EmptySelectedContact } = props;
  const [needScrollBottom, setNeedScrollBottom] = useState<boolean>(true);
  const [canSure, setCanSure] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [personalMarked, setPersonalMarked] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string>('');
  const [visibleCreateContact, setVisibleCreateContact] = useState<boolean>(false);
  const [selectList, setSelectList] = useState<ContactItem[]>(defaultSelectedContact);
  const defaultSelectedContactRef = useStateRef(defaultSelectedContact);

  // useEffect(()=>{
  //   setSelectList(defaultSelectedContact);
  // },[defaultSelectedContact]);
  // 是否编辑分组
  const isEdit = !!personalOrgId;
  /**
   * 删除选中列表数据
   * @param itemList
   */
  const handleDelete = (itemList: ContactItem[]) => {
    setSelectList(itemList);
    setNeedScrollBottom(false);
  };
  /**
   * 当选中列表发生变化
   * @param itemList
   */
  const handleSelect = (itemList: ContactItem[]) => {
    setSelectList(itemList);
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
    if (nameError) {
      return;
    }
    const personalIdSet = new Set<string>();
    const enterpriseEmailMap = new Map<string, ContactItem>();
    selectList.forEach(item => {
      if (item.type === 'enterprise') {
        enterpriseEmailMap.set(item.email, item);
      } else {
        item.id && personalIdSet.add(item.id);
      }
    });
    if (enterpriseEmailMap.size) {
      const personalEmailList = await contactApi.doGetContactByItem({
        type: 'EMAIL',
        value: [...enterpriseEmailMap.keys()],
        filterType: 'personal',
        _account,
      });
      personalEmailList.forEach(item => {
        const {
          contact: { accountName: email, contactName: name, id },
          contactInfo,
        } = item;
        if (enterpriseEmailMap.has(email)) {
          const currentItem = enterpriseEmailMap.get(email)!;
          if (email === currentItem.email && currentItem.name === name) {
            const len = contactInfo.filter(info => info.contactItemType === 'EMAIL').length;
            if (len === 1) {
              personalIdSet.add(id);
              enterpriseEmailMap.delete(email);
            }
          }
        }
      });
      const enterpriseList: contactInsertParams[] = [];
      enterpriseEmailMap.forEach(item => {
        enterpriseList.push({
          name: item.name,
          emailList: [item.email],
          groupIdList: [],
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
            personalIdSet.add(item.contact.id);
          });
        } else {
          message.error(error || `${isEdit ? getIn18Text('BIANJI') : getIn18Text('TIANJIA')}分组失败`);
          return;
        }
      }
    }
    // accountApi.setCurrentAccount({ email: _account });
    const {
      success,
      data,
      message: error,
    } = isEdit
      ? await contactApi.doUpdatePersonalOrg({
          groupName: name?.trim(),
          orgId: personalOrgId,
          idList: [...personalIdSet],
          isMark: personalMarked,
          _account,
        })
      : await contactApi.doInsertPersonalOrg({
          groupName: name?.trim(),
          idList: [...personalIdSet],
          isMark: personalMarked,
          _account,
        });
    if (success && data) {
      message.success(`${isEdit ? getIn18Text('BIANJI') : getIn18Text('TIANJIA')}分组成功`);
      onSure(data.id, data.name, _account);
    } else {
      message.error(error || `${isEdit ? getIn18Text('BIANJI') : getIn18Text('TIANJIA')}分组失败`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target?.value;
    setName(newName);
    const trimName = newName?.trim();
    const zhReg = /[\u4e00-\u9fa5]/g;
    const zhLen = trimName.match(zhReg)?.length || 0;
    if (trimName.length + zhLen <= 40) {
      setNameError('');
    } else {
      setNameError(getIn18Text('ZUIDUOKESHURU'));
    }
  };
  /**
   * 点击新增联系人按钮
   * @param item
   */
  const onCreateContact = (item: ContactItem) => {
    setVisibleCreateContact(false);
    setSelectList([...selectList, item]);
  };
  useEffect(() => {
    setCanSure(!!name && !nameError);
  }, [name, nameError]);
  useEffect(() => {
    if (personalOrgId) {
      contactApi.doGetPersonalOrg({ idList: [personalOrgId], _account }).then(({ success, data }) => {
        if (success && data?.length) {
          setName(data[0].orgName);
          const isMark = data[0].marked && data[0].marked > 0;
          setPersonalMarked(!!isMark);
        }
      });
      contactApi.doGetContactByOrgId({ orgId: personalOrgId, _account }).then(res => {
        setSelectList(res.map(item => tarnsEntityContact2ContactItem(item.contact)));
      });
    } else {
      setName('');
      setSelectList(defaultSelectedContactRef.current);
    }
  }, [personalOrgId]);
  return (
    <SiriusHtmlModal visible width={640} zIndex={modelZIndex} destroyOnClose closable={false} title={null} footer={null}>
      <div className={styles.wrap} data-test-id="modal_personalOrg">
        <div className={styles.modalTitle}>
          <div className={styles.titleName}>
            <i className={`dark-invert ${styles.icon}`} hidden={!visibleCreateContact} onClick={() => setVisibleCreateContact(false)}></i>
            <span data-test-id="modal_personalOrg_title">
              {visibleCreateContact ? getIn18Text('XINJIANLIANXIREN') : isEdit ? getIn18Text('BIANJIGERENFEN') : getIn18Text('XINJIANGERENFEN')}
            </span>
          </div>
          <div className={styles.close} onClick={handleCancel} />
        </div>
        <div className={styles.modalContent}>
          <div className={styles.createFormWrap} hidden={!visibleCreateContact}>
            {visibleCreateContact && (
              <ContactForm
                _account={_account}
                from="personalOrgModal"
                onCancel={() => {
                  setVisibleCreateContact(false);
                }}
                onSuccess={onCreateContact}
              />
            )}
          </div>
          <div className={styles.modalContent} hidden={visibleCreateContact}>
            <div className={styles.modalInputContainer}>
              <div className={`ant-allow-dark ${styles.modalInputWrap}`}>
                <Input
                  data-test-id="modal_personalOrg_name"
                  autoFocus
                  placeholder={getIn18Text('QINGSHURUXINFEN')}
                  onChange={handleInputChange}
                  value={name}
                  className={classnames(styles.modalInput, {
                    [styles.error]: nameError,
                  })}
                />
                <div className={styles.inputError}>{nameError}</div>
              </div>
              <PersonaMarkCheckbox
                testId="modal_personalOrg_mark_checkbox"
                style={{ marginLeft: 16, marginBottom: 16 }}
                onChange={(isMarked: boolean) => setPersonalMarked(isMarked)}
                value={personalMarked}
              />
            </div>
            <div className={styles.subTitle}>
              <span className={styles.subName} datat-test-id="modal_personalOrg_select_title">
                {getIn18Text('XUANZEZUCHENGYUAN')}
              </span>
              <span data-test-id="modal_personalOrg_btn_addContact" className={styles.createContact} onClick={() => setVisibleCreateContact(true)}>
                {getIn18Text('XINJIANLIANXIREN')}
              </span>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.bodyLeft}>
                <SelectList
                  showNoDataPlaceholder
                  useMultiAccount={false}
                  accountRootKey={_account}
                  isIM={false}
                  useContactId
                  searchAutoFocus={false}
                  type={['personal', 'enterprise']}
                  defaultSelectList={selectList}
                  defaultExpandedKeys={[StaticRootNodeKey.ENTERPRISE, StaticRootNodeKey.PERSON]}
                  showAddOrgBtn
                  showAddPersonalBtn
                  onSelect={handleSelect}
                />
              </div>
              <div className={styles.bodyRight}>
                <SelectedList useContactId showPosition={false} selectList={selectList} onDelete={handleDelete} needScrollBottom={needScrollBottom} showFooter={false} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button
                data-test-id="modal_personalOrg_btn_cancel"
                type="default"
                className={styles.cancelBtn}
                onClick={() => {
                  handleCancel();
                }}
              >
                {getIn18Text('QUXIAO')}
              </Button>
              <Button
                data-test-id="modal_personalOrg_btn_save"
                disabled={!canSure}
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
export default PersonalOrgModal;
