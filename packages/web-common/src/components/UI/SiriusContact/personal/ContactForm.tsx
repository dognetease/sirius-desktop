import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Form, Button, Checkbox, Row, Input, Popover, DatePicker } from 'antd';
import { FormItemProps, FormListProps } from 'antd/lib/form';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { AccountApi, api, apis, ContactAndOrgApi, contactInsertParams, ContactModel, DataTrackerApi, InsertPersonalOrgRes, getIn18Text } from 'api';
import classnames from 'classnames';
import styles from './contactform.module.scss';
// @ts-ignore
import { CreateGroupRef, CreatePersonalGroup } from '@web-contact/component/EditPersonalOrg/createGroup';
import { ContactActions, useActions, useAppDispatch } from '@web-common/state/createStore';
import { tarnsEntityContact2ContactItem, isEqualPersonalContact } from '@web-common/components/util/contact';
import { contactFormToParams } from '@web-contact/util';
// @ts-ignore
import { getPersonalOrgList } from '@web-contact/_mock_';
import { ContactItem } from '@web-common/utils/contact_util';
import { emailPattern } from '@web-common/utils/constant';
import { PersonaMarkCheckbox } from '../personalMark/markTip';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import useCreateCallbackForEvent from '@web-common/hooks/useCreateCallbackForEvent';

import InputContextMenu from '@web-common/components/UI/InputContextMenu/InputContextMenu';
// import { Input as LxInput } from '@web-common/components/UI/Input';
import LxInput from '@lingxi-common-component/sirius-ui/Input';
import { refreshContactDataByEmails } from '@web-common/state/reducer/contactReducer';
import { ReactComponent as TongyongJiantouShang } from '@web-common/images/newIcon/tongyong_jiantou_shang.svg';
import { ReactComponent as TongyongJiantouXia } from '@web-common/images/newIcon/tongyong_jiantou_xia1.svg';
import moment, { Moment } from 'moment';
import lodashGet from 'lodash/get';

const eventApi = api.getEventApi();

export interface ContactFormField {
  emailList: string[];
  contactName: string;
  mobileList: string[];
  remark?: string;
  personalOrg: string[];
  isMark?: boolean;
  adrList?: string[];
  pref?: string;
  birthday?: Moment | '';
  role?: string;
  title?: string;
  org?: string;
  orgname?: string;
}

interface ContactFormProps {
  from?: 'personalOrgModal' | 'create' | 'edit';
  contact?: ContactModel;
  contactId?: string;
  _account?: string;

  onCancel(): void;

  onChangeVisible?(visible: boolean): void;
  onChangeTitle?(title: string): void;

  onSave?(formData: ContactFormField): Promise<void>;

  onSuccess?(item: ContactItem): void;
}

const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const dataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const systemApi = api.getSystemApi();
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const ContactForm: React.FC<ContactFormProps> = props => {
  const {
    from = 'create',
    onCancel: _oncancel,
    contactId: propContactId,
    contact: propContact,
    onSuccess,
    onChangeVisible,
    onChangeTitle,
    _account = systemApi.getCurrentUser()?.id || '',
  } = props;
  const isFromPersonalOrg = from === 'personalOrgModal';
  const dispatch = useAppDispatch();
  const contactActions = useActions(ContactActions);
  // const contact = propContact || useContactModel({contactId});
  const [form] = Form.useForm<ContactFormField>();
  const createGroupRef = useRef<CreateGroupRef>();
  const [contact, setContact] = useState<ContactModel | undefined>(propContact);
  // 被选中的checkedIds
  const [personalGroupList, setPersonalGroupList] = useState<InsertPersonalOrgRes[]>([]);
  const [checkedGroupIds, setCheckedGroupIds] = useState<string[]>([]);
  const [isCreatingPersonalGroup, setIsCreatingPersonalGroup] = useState(false);
  const [isEdit, setEdit] = useState<boolean>(from === 'edit');
  const contactNameInputRef = useRef(null);
  const remarkInputRef = useRef(null);

  const [showExtraInfo, setShowExtraInfo] = useState(false);

  const contactPrefInputRef = useRef(null);
  const contactBirthdayInputRef = useRef(null);
  const contactRoleInputRef = useRef(null);
  const contactTitleInputRef = useRef(null);
  const contactOrgInputRef = useRef(null);
  const contactOrgnameInputRef = useRef(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (propContactId) {
      contactApi.doGetContactById(propContactId, _account).then(res => {
        const model = res[0];
        if (model) {
          setContact(model);
          const personalList = model?.contact.personalOrg;
          setCheckedGroupIds(personalList || []);
        }
      });
    }
  }, [propContactId]);
  const handleSubmit = async () => {
    // 如果当前窗口在等待分组创建成功
    if (isCreatingPersonalGroup && createGroupRef.current && createGroupRef.current.addBlurCreateLock) {
      // 添加阻塞
      createGroupRef.current!.addBlurCreateLock();
      await createGroupRef.current!.createNewGroup();
    }
    setCheckedGroupIds(ids => {
      submit(ids || []);
      return ids;
    });
  };

  const requestData = async (params: contactInsertParams, values: ContactFormField, accountId?: string) => {
    let promise;
    let successTxt = getIn18Text('XINZENGCHENGGONG');
    let errorTxt = getIn18Text('XINZENGSHIBAI');
    const phoneList: string[] = [];
    params.phoneList?.forEach(item => {
      const phone = item.trim();
      if (phone) {
        phoneList.push(phone);
      }
    });
    // accountApi.setCurrentAccount({ email: _account });
    if (accountId) {
      promise = contactApi.doUpdateContact({
        params: { ...params, phoneList, accountId },
        _account,
      });
      successTxt = getIn18Text('BIANJICHENGGONG');
      errorTxt = getIn18Text('BIANJISHIBAI');
    } else {
      promise = contactApi.doInsertContact({
        list: { ...params, phoneList },
        _account,
      });
    }
    const { success, data, error } = await promise;
    if (success && data?.length) {
      if (params.emailList) {
        // 更新emailList对应的角色信息
        const emailNameMap = params.emailList.reduce((res, email) => {
          res.set(email, params.name || email);
          return res;
        }, new Map<string, string>());
        await refreshContactDataByEmails({ [_account]: params.emailList }, emailNameMap);
      }
      const contact = data[0].contact;
      onSuccess && onSuccess(tarnsEntityContact2ContactItem(contact));
      message.success(isEdit ? getIn18Text('BIANJICHENGGONG') : getIn18Text('XINZENGCHENGGONG'));

      eventApi.sendSysEvent({
        eventName: 'sendSelectedContactIdOnContactPage',
        eventData: {
          id: contact.id,
        },
      });
    } else {
      message.error(error || (isEdit ? getIn18Text('BIANJISHIBAI') : getIn18Text('XINZENGSHIBAI')));
      return;
    }
    const contentArr: string[] = [];
    if (values.contactName) {
      contentArr.push(getIn18Text('YOUXINGMING'));
    }
    if (values.emailList.length > 1) {
      contentArr.push(getIn18Text('YOUXINGMING'));
    }
    if (values.mobileList.length > 1) {
      contentArr.push(getIn18Text('YOUDIANHUA'));
    }
    if (values.remark) {
      contentArr.push(getIn18Text('YOUBEIZHU'));
    }
    dataTrackerApi.track('pcContact_click_complete_addContactsPage', {
      content: contentArr.join('，'),
      mailDressCount: values.emailList.length,
      phoneNumberCount: values.mobileList.length,
    });
  };

  const submit = useCreateCallbackForEvent(async (ids: string[]) => {
    try {
      setSubmitLoading(true);
      const values = await form.validateFields();
      values.personalOrg = ids;
      if (values.birthday && values.birthday.format) {
        values.birthday = values.birthday.valueOf();
      } else {
        values.birthday = undefined;
      }
      const params = contactFormToParams(values);
      if (!isEdit && params.emailList?.length === 1 && params.name) {
        const email = params.emailList[0];
        const data = await contactApi.doGetContactByEmail({ emails: [email], _account, useData: 'db' });
        const modelList = data[email];
        const sameItem = modelList.find(item => isEqualPersonalContact({ name: params.name, email, contactId: contact?.contact.id }, item));
        if (sameItem) {
          onChangeVisible && onChangeVisible(false);
          const model = SiriusModal.error({
            title: getIn18Text('personalContactReplyToastTitle'),
            content: getIn18Text('personalContactReplyToastContent'),
            cancelText: getIn18Text('personalContactReplyToastCancelBtn'),
            okText: getIn18Text('personalContactReplyToastSaveBtn'),
            maskClosable: false,
            keyboard: false,
            closable: true,
            cancelButtonProps: {
              onClick: async () => {
                await requestData(params, values);
                model.destroy();
              },
            },
            onOk: () => {
              setContact(sameItem);
              const personalList = sameItem?.contact.personalOrg;
              setCheckedGroupIds(personalList || []);
              setEdit(true);
              onChangeTitle && onChangeTitle(getIn18Text('BIANJILIANXIREN'));
            },
            afterClose: () => {
              onChangeVisible && onChangeVisible(true);
            },
          });
          return;
        }
      }
      const accountId = contact?.contact?.type === 'personal' ? contact?.contact.id : undefined;
      await requestData(params, values, accountId);
    } catch (ex) {
      const isValidateError = lodashGet(ex, 'errorFields[0].errors.length', 0);
      let errMsg = lodashGet(ex, 'message', `${ex}`);
      if (isValidateError) {
        errMsg = (lodashGet(ex, 'errorFields', []) as Record<'errors', string[]>[])
          .flatMap(item => {
            return item.errors.join(',');
          })
          .join(';');
      }

      eventApi.sendSysEvent({
        eventName: 'error',
        eventLevel: 'error',
        eventStrData: '',
        eventData: {
          popupType: 'toast',
          popupLevel: 'error',
          title: (from === 'edit' ? '更新联系人失败:' : '新增联系人失败:') + errMsg,
          code: 'PARAM.ERR',
        },
        eventSeq: 0,
      });
    } finally {
      setSubmitLoading(false);
    }
  });
  const onCancel = useCallback(() => {
    // 如果当前窗口在等待分组创建成功
    if (isCreatingPersonalGroup && createGroupRef.current && createGroupRef.current.addBlurCreateLock) {
      // 添加阻塞
      createGroupRef.current!.addBlurCreateLock();
    }
    _oncancel();
  }, [isCreatingPersonalGroup]);
  const clearExternal = useCallback(() => {
    contactActions.doCreateFormExternal(undefined);
  }, []);
  useEffect(() => {
    form.setFieldsValue(getInitValues(contact));
  }, [contact, form]);
  useEffect(
    () => () => {
      clearExternal();
    },
    [clearExternal]
  );
  const renderItemList: RenderItemList =
    params =>
    (fields, { add, remove }) =>
      (
        <>
          {fields.map((field, index) => {
            const listInputRef = { current: null };
            return (
              <InputContextMenu
                inputOutRef={listInputRef}
                changeVal={val => {
                  const list = form.getFieldValue(params.name);
                  list[index] = val;
                  form.setFieldsValue({ [params.name]: list });
                }}
              >
                <Form.Item key={field.key} hidden={params.hidden} label={index === 0 ? params.label : ' '} className={styles.listItem}>
                  <Form.Item {...field} rules={params.rules} validateTrigger={params.validateTrigger} noStyle>
                    <LxInput
                      maxLength={Number.isSafeInteger(params.maxlength) ? params.maxlength : undefined}
                      ref={listInputRef}
                      placeholder={params.placeholder}
                      data-test-id={`modal_personal_${params.type}`}
                      openFix={false}
                    />
                  </Form.Item>
                  {fields.length > 1 ? (
                    <i
                      className={`dark-invert ${styles.close}`}
                      data-test-id={`modal_personal_btn_reomve_${params.type}`}
                      onClick={() => {
                        remove(field.name);
                      }}
                    />
                  ) : null}
                </Form.Item>
              </InputContextMenu>
            );
          })}
          <span className={styles.add} onClick={() => add('')} data-test-id={`modal_personal_btn_add_${params.type}`} hidden={params.hidden}>
            {params.addText}
          </span>
        </>
      );
  const togglePersonalGroupCheckbox = (flag: boolean, itemId: string) => {
    setCheckedGroupIds(ids => {
      const idSets = new Set(ids);
      if (flag) {
        idSets.add(itemId);
      } else {
        idSets.delete(itemId);
      }
      return [...idSets];
    });
  };
  const createGroupSuccess = (data: InsertPersonalOrgRes, isChecked: boolean) => {
    isChecked &&
      setCheckedGroupIds(list => {
        const idSets = new Set(list);
        idSets.add(data.id);
        return [...idSets];
      });
    setPersonalGroupList(list => {
      list.push(data);
      return list;
    });
    setIsCreatingPersonalGroup(false);
  };
  const cancelCreateGroup = () => {
    setIsCreatingPersonalGroup(false);
  };
  const addNewPersonalGroup = useCallback(async () => {
    if (isCreatingPersonalGroup && createGroupRef.current && createGroupRef.current.addBlurCreateLock) {
      // 添加阻塞
      createGroupRef.current!.addBlurCreateLock();
      await createGroupRef.current!.createNewGroup();
    }
    setIsCreatingPersonalGroup(true);
  }, [isCreatingPersonalGroup]);
  useEffect(() => {
    if (!isFromPersonalOrg) {
      getPersonalOrgList(_account).then(res => {
        setPersonalGroupList(res.map(item => ({ name: item.orgName, id: item.id })));
      });
    }
  }, [isFromPersonalOrg]);
  return (
    <Form<ContactFormField>
      form={form}
      className={classnames(styles.form, {
        [styles.isFromPersonalOrg]: isFromPersonalOrg,
      })}
      colon={false}
    >
      <div className={`ant-allow-dark ${styles.content}`}>
        <InputContextMenu inputOutRef={contactNameInputRef} changeVal={val => form.setFieldsValue({ contactName: val })}>
          <Form.Item
            required={false}
            label={getIn18Text('YONGHUXINGMING')}
            name="contactName"
            validateTrigger={['onChange', 'onBlur']}
            rules={[
              { required: true, message: getIn18Text('QINGSHURUYONGHU') },
              {
                max: 100,
                message: getIn18Text('QINGSHURUBUCHAO'),
              },
            ]}
          >
            <LxInput ref={contactNameInputRef} placeholder={getIn18Text('QINGSHURUYONGHU')} data-test-id="modal_personal_name" openFix={false} />
          </Form.Item>
        </InputContextMenu>
        <Form.List name="emailList">
          {renderItemList({
            type: 'account',
            name: 'emailList',
            label: getIn18Text('DIANZIYOUXIANG'),
            addText: getIn18Text('TIANJIAYOUXIANG'),
            placeholder: getIn18Text('QINGSHURUYOUXIANGZHANG'),
            validateTrigger: ['onChange', 'onBlur'],
            normalize: value => value.trim(),
            rules: [
              {
                required: !0,
                message: getIn18Text('QINGSHURUYOUXIANGZHANG'),
              },
              {
                // pattern: /^([a-zA-Z0-9][a-zA-Z0-9_\-.+#']+)@([a-zA-Z0-9_\-.]+\.[a-zA-Z]{2,})$/,
                pattern: emailPattern,
                message: getIn18Text('QINGSHURUZHENGQUE11'),
              },
            ],
          })}
        </Form.List>
        <Form.Item label="" noStyle name="isMark">
          <PersonaMarkCheckbox data-test-id="modal_personal_personalMark_checkbox" style={{ marginLeft: 80, marginBottom: 16 }} />
        </Form.Item>
        <Form.List name="mobileList">
          {renderItemList({
            type: 'phone',
            name: 'mobileList',
            label: getIn18Text('DIANHUAHAOMA'),
            addText: getIn18Text('TIANJIAHAOMA'),
            placeholder: getIn18Text('XUANTIAN\uFF0CQINGSHU11'),
          })}
        </Form.List>
        <InputContextMenu inputOutRef={remarkInputRef} changeVal={val => form.setFieldsValue({ remark: val })}>
          <Form.Item
            label={getIn18Text('BEIZHUXINXI')}
            name="remark"
            rules={[
              {
                max: 1000,
                type: 'string',
                message: getIn18Text('BEIZHUBUCHAOGUO'),
              },
            ]}
          >
            <Input.TextArea
              ref={remarkInputRef}
              style={{ height: 70, resize: 'none' }}
              placeholder={getIn18Text('XUANTIAN\uFF0CQINGSHU')}
              data-test-id="modal_personal_remark"
            />
          </Form.Item>
        </InputContextMenu>
        {!isFromPersonalOrg && (
          <Form.Item label={getIn18Text('XUANZEFENZU')} className={styles.personalOrgWrapper}>
            {personalGroupList.length > 0 ? (
              <div className={styles.personalOrgGroup} data-test-id="modal_personal_personalOrg">
                {personalGroupList.map(item => {
                  const checked = checkedGroupIds.includes(item.id);
                  return (
                    <Row key={item.id} className={styles.personalOrgItem} data-test-id="modal_personal_personalOrg_item">
                      <Checkbox
                        value={item.id}
                        data-test-id="modal_personal_personalOrg_item_checkbox"
                        data-test-check={checked}
                        checked={checked}
                        onChange={e => {
                          togglePersonalGroupCheckbox(e.target.checked, e.target.value);
                        }}
                      >
                        {item.name}
                      </Checkbox>
                    </Row>
                  );
                })}
              </div>
            ) : null}

            {isCreatingPersonalGroup && (
              <Row style={{ paddingLeft: '12px' }}>
                <CreatePersonalGroup
                  _account={_account}
                  groupNames={personalGroupList.map(item => item.name)}
                  ref={createGroupRef}
                  success={createGroupSuccess}
                  cancel={cancelCreateGroup}
                  customInputClass={styles.newGroupInput}
                />
              </Row>
            )}
            <Row>
              <span data-test-id="modal_personal_btn_addPersonalOrg" className={styles.addPersonalGroupBtn} onMouseDown={addNewPersonalGroup}>
                {getIn18Text('TIANJIAGERENFEN')}
              </span>
            </Row>
          </Form.Item>
        )}
        <Form.Item>
          <Row>
            <span
              onClick={() => {
                setShowExtraInfo(!showExtraInfo);
              }}
              className={styles.showmore}
            >
              {getIn18Text('GENGDUOXUANXIANG')}
              {showExtraInfo ? <TongyongJiantouShang /> : <TongyongJiantouXia />}
            </span>
          </Row>
        </Form.Item>

        {/* 联系地址 */}
        <Form.List name="adrList">
          {renderItemList({
            maxlength: 200,
            type: 'address',
            name: 'adrList',
            normalize: value => value.trim().replace(/;/g, ''),
            label: getIn18Text('LIANXIDIZHI'),
            addText: getIn18Text('TIANJIADIZHI'),
            placeholder: getIn18Text('XUANTIAN') + '，' + getIn18Text('QINGSHURULIANXIDZ'),
            hidden: !showExtraInfo,
            // '选填，请输入联系地址',
          })}
        </Form.List>
        {/* 生日 */}
        <Form.Item label={getIn18Text('SHENGRI')} rules={[]} name="birthday" hidden={!showExtraInfo}>
          {/* <LxInput ref={contactBirthdayInputRef} placeholder="选填，请选择生日信息" openFix={false} maxLength={200} /> */}
          <DatePicker
            className={styles.birithdayPicker}
            placeholder={getIn18Text('XUANTIAN') + ',' + getIn18Text('QINGXUANZESHENGRIXX')}
            format="YYYY/MM/DD"
          ></DatePicker>
        </Form.Item>

        <Form.Item label={getIn18Text('GERENZHUYE')} rules={[]} name="pref" hidden={!showExtraInfo}>
          <LxInput ref={contactPrefInputRef} placeholder={getIn18Text('XUANTIAN') + '，' + getIn18Text('QINGSHURUGERENZY')} openFix={false} maxLength={200} />
        </Form.Item>

        <Form.Item label={getIn18Text('GONGSIMINGCHENG')} rules={[]} name="orgname" hidden={!showExtraInfo}>
          <LxInput ref={contactOrgnameInputRef} placeholder={getIn18Text('XUANTIAN') + '，' + getIn18Text('QINGSHURUGONGSIMC')} openFix={false} maxLength={200} />
        </Form.Item>
        <Form.Item label={getIn18Text('BUMENMINGCHENG')} rules={[]} name="org" hidden={!showExtraInfo}>
          <LxInput ref={contactOrgInputRef} placeholder={getIn18Text('XUANTIAN') + '，' + getIn18Text('QINGSHURUBUMENMC')} openFix={false} maxLength={200} />
        </Form.Item>
        <Form.Item label={getIn18Text('ZHIWEI')} rules={[]} name="title" hidden={!showExtraInfo}>
          <LxInput ref={contactTitleInputRef} placeholder={getIn18Text('XUANTIAN') + '，' + getIn18Text('QINGSHURUZHIWEIXX')} openFix={false} maxLength={200} />
        </Form.Item>

        <Form.Item label={getIn18Text('JUESE')} rules={[]} name="role" hidden={!showExtraInfo}>
          <LxInput ref={contactRoleInputRef} placeholder={getIn18Text('XUANTIAN') + '，' + getIn18Text('QINGSHURUJUESEXX')} openFix={false} maxLength={200} />
        </Form.Item>
      </div>
      <div className={styles.footer}>
        <Button data-test-id="modal_personal_btn_cancel" type="default" className={`ant-allow-dark ${styles.cancelBtn}`} onMouseDown={onCancel}>
          {getIn18Text('QUXIAO')}
        </Button>
        <Button loading={submitLoading} data-test-id="modal_personal_btn_save" type="primary" className={styles.mainBtn} onMouseDown={handleSubmit}>
          {getIn18Text('BAOCUN')}
        </Button>
      </div>
    </Form>
  );
};
type RenderItemList = (params: {
  type: 'phone' | 'account' | 'address';
  label?: string;
  placeholder?: string;
  addText?: string;
  rules?: FormItemProps['rules'];
  validateTrigger?: FormItemProps['validateTrigger'];
  normalize?: FormItemProps['normalize'];
  name: string;
  maxlength?: number;
  hidden?: boolean;
}) => FormListProps['children'];

const getInitValues = (contact: ContactModel | undefined) => {
  let initValues: ContactFormField = {
    contactName: '',
    emailList: [''],
    mobileList: [''],
    adrList: [''],
    personalOrg: [],
    isMark: false,
  };
  if (contact !== undefined) {
    if (contact.contact.type === 'external') {
      initValues = {
        ...initValues,
        contactName: contact.contact.contactName,
        emailList: [contact.contact.accountName],
      };
    } else if (contact.contact.type === 'personal') {
      const marked = contact.contact.marked || 0;

      // 第一个优先展示主邮箱(和通讯录详情展示规则保持一致)
      const emaillist = new Set([contact.contact.accountName]);
      contact.contactInfo.forEach(item => {
        item.contactItemType === 'EMAIL' && emaillist.add(item.contactItemVal);
      });

      initValues = {
        contactName: contact.contact.contactName,
        emailList: [...emaillist],
        mobileList: contact.contactInfo.filter(e => e.contactItemType === 'MOBILE' || e.contactItemType === 'TEL').map(e => e.contactItemVal),
        remark: contact.contact.remark,
        personalOrg: contact.contact.personalOrg || [],
        isMark: marked > 0,
        adrList: (contact.contact?.adrList || [])
          .filter(item => {
            return item && item.trim().length > 0;
          })
          .map(adr => {
            return adr.replace(/;/g, '');
          }),
        pref: contact.contact.pref || '',
        birthday: contact.contact.birthday ? moment(contact.contact.birthday) : '',
        role: contact.contact.role || '',
        title: contact.contact.title || '',
        org: contact.contact.org || '',
        orgname: contact.contact.orgname || '',
      };
      if (initValues.emailList.length === 0) {
        initValues.emailList.push('');
      }
      if (initValues.mobileList.length === 0) {
        initValues.mobileList.push('');
      }

      if (initValues.adrList?.length === 0) {
        initValues.adrList.push('');
      }
    } else if (['customer', 'clue'].includes(contact.contact.type)) {
      initValues = {
        contactName: contact.contact.contactName || contact.contact.accountName,
        emailList: [contact.contact.accountName],
        mobileList: contact.contactInfo.filter(e => e.contactItemType === 'MOBILE' || e.contactItemType === 'TEL').map(e => e.contactItemVal),
        remark: contact.contact.remark,
        personalOrg: contact.contact.personalOrg || [],
      };
      if (initValues.mobileList.length === 0) {
        initValues.mobileList.push('');
      }
    }
  }
  return initValues;
};

export default ContactForm;
