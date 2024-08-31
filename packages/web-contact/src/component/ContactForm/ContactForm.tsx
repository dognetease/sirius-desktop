/**
 * 整个文件已经废弃。通讯录表单整体功能迁到personal/contactForm
 */

import React, { useCallback, useEffect } from 'react';
import { Form, Input, Button } from 'antd';
import { FormItemProps, FormListProps } from 'antd/lib/form';
import { AccountApi, api, apis, ContactAndOrgApi, ContactModel } from 'api';
import classnames from 'classnames';
import styles from './contactform.module.scss';

import ContactTrackerIns from '../../tracker';
import { ContactActions, useActions } from '@web-common/state/createStore';
import { tarnsEntityContact2ContactItem } from '@web-common/components/util/contact';
import { contactFormToParams } from '@web-contact/util';
import { ContactItem } from '@web-common/utils/contact_util';
import { emailPattern } from '@web-common/utils/constant';

export interface ContactFormField {
  emailList: string[];
  contactName: string;
  mobileList: string[];
  remark?: string;
  personalOrg?: string[];
  isMark?: boolean;
  adrList?: string[];
  pref?: string;
  birthday?: string;
  role?: string;
  title?: string;
  org?: string;
  orgname?: string;
}

interface ContactFormProps {
  from?: 'personalOrgModal' | 'create' | 'edit';
  onCancel(): void;
  _account?: string;
  onSave?(formData: ContactFormField): Promise<void>;
  onSuccess?(item: ContactItem): void;
  contact?: ContactModel;
}

const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const systemApi = api.getSystemApi();

/**
 * @deprecated:已经废弃
 * @param props
 * @returns
 */

const ContactForm: React.FC<ContactFormProps> = props => {
  const { from = 'create', onCancel, onSave, contact, onSuccess, _account = systemApi.getCurrentUser()?.id || '' } = props;
  const isFromPersonalOrg = from === 'personalOrgModal';
  const contactActions = useActions(ContactActions);

  const [form] = Form.useForm<ContactFormField>();
  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (onSave) {
      await onSave(values);
    } else {
      // TODO:  去保存联系人
      // accountApi.setCurrentAccount({ email: _account });
      const { success, data } = await contactApi.doInsertContact({
        list: contactFormToParams(values),
        _account,
      });
      if (success && data?.length) {
        const contact = data[0].contact;
        onSuccess && onSuccess(tarnsEntityContact2ContactItem(contact));
      }
    }
    const contentArr: string[] = [];
    if (values.contactName) {
      contentArr.push('有姓名');
    }
    if (values.emailList.length > 1) {
      contentArr.push('有姓名');
    }
    if (values.mobileList.length > 1) {
      contentArr.push('有电话');
    }
    if (values.remark) {
      contentArr.push('有备注');
    }
    ContactTrackerIns.tracker_contact_save_click({
      content: contentArr.join('，'),
      mailDressCount: values.emailList.length,
      phoneNumberCount: values.mobileList.length,
    });
  };

  const clearExternal = useCallback(() => {
    contactActions.doCreateFormExternal(undefined);
  }, []);

  useEffect(() => {
    form.setFieldsValue(getInitValues(contact));
    // return () => {
    //     cleanup
    // }
  }, [contact, form]);

  useEffect(
    () => () => {
      clearExternal();
    },
    [clearExternal]
  );
  return (
    <Form<ContactFormField>
      form={form}
      className={classnames(styles.form, {
        [styles.isFromPersonalOrg]: isFromPersonalOrg,
      })}
      colon={false}
    >
      {!isFromPersonalOrg && <p className={styles.title}>{getFormTitle(contact)}</p>}
      <div className={styles.content}>
        <Form.Item
          required={false}
          normalize={value => value.trim()}
          label="用户姓名"
          name="contactName"
          validateTrigger={['onChange', 'onBlur']}
          rules={[
            { required: true, message: '请输入用户姓名' },
            {
              max: 25,
              message: '请输入不超过25个字符文案',
            },
          ]}
        >
          <Input placeholder="请输入用户姓名" />
        </Form.Item>
        <Form.List name="emailList">
          {renderItemList({
            label: '电子邮箱',
            addText: '添加邮箱',
            placeholder: '请输入邮箱账号',
            validateTrigger: ['onChange', 'onBlur'],
            normalize: value => value.trim(),
            rules: [
              {
                required: !0,
                message: '请输入邮箱账号',
              },
              {
                // pattern: /^([a-zA-Z0-9][a-zA-Z0-9_\-.+#']+)@([a-zA-Z0-9_\-.]+\.[a-zA-Z]{2,})$/,
                pattern: emailPattern,
                message: '请输入正确的邮箱账号',
              },
            ],
          })}
        </Form.List>
        <Form.List name="mobileList">
          {renderItemList({
            label: '电话号码',
            addText: '添加号码',
            placeholder: '选填，请输入号码',
          })}
        </Form.List>
        <Form.Item
          label="备注信息"
          name="remark"
          rules={[
            {
              max: 1000,
              type: 'string',
              message: '备注不超过1000字',
            },
          ]}
        >
          <Input.TextArea style={{ height: 70, resize: 'none' }} placeholder="选填，请输入要备注的文案" />
        </Form.Item>
      </div>
      <div className={styles.handleBtn}>
        <div
          className={classnames(styles.btnWrap, {
            [styles.isFromPersonalOrg]: isFromPersonalOrg,
          })}
        >
          <Button type="default" className={styles.cancelBtn} onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" className={styles.mainBtn} onClick={handleSubmit}>
            保存
          </Button>
        </div>
      </div>
    </Form>
  );
};

type RenderItemList = (params: {
  label?: string;
  placeholder?: string;
  addText?: string;
  rules?: FormItemProps['rules'];
  validateTrigger?: FormItemProps['validateTrigger'];
  normalize?: FormItemProps['normalize'];
}) => FormListProps['children'];

const renderItemList: RenderItemList =
  params =>
  (fields, { add, remove }) =>
    (
      <>
        {fields.map((field, index) => (
          <Form.Item key={field.key} label={index === 0 ? params.label : ' '} className={styles.listItem}>
            <Form.Item {...field} rules={params.rules} validateTrigger={params.validateTrigger} noStyle>
              <Input placeholder={params.placeholder} />
            </Form.Item>
            {fields.length > 1 ? (
              <i
                className={styles.close}
                onClick={() => {
                  remove(field.name);
                }}
              />
            ) : null}
          </Form.Item>
        ))}
        <span className={styles.add} onClick={() => add('')}>
          {params.addText}
        </span>
      </>
    );

const getFormTitle = (contact: ContactModel | undefined) => `${contact === undefined || contact.contact.type === 'external' ? '新建' : '编辑'}联系人`;

const getInitValues = (contact: ContactModel | undefined) => {
  let initValues: ContactFormField = {
    contactName: '',
    emailList: [''],
    mobileList: [''],
  };
  if (contact !== undefined) {
    if (contact.contact.type === 'external') {
      initValues = {
        ...initValues,
        contactName: contact.contact.contactName,
        emailList: [contact.contact.accountName],
      };
    } else if (contact.contact.type === 'personal') {
      initValues = {
        contactName: contact.contact.contactName,
        emailList: contact.contactInfo.filter(e => e.contactItemType === 'EMAIL').map(e => e.contactItemVal),
        mobileList: contact.contactInfo.filter(e => e.contactItemType === 'MOBILE' || e.contactItemType === 'TEL').map(e => e.contactItemVal),
        remark: contact.contact.remark,
        adrList: contact.contact.adrList || [],
        pref: contact.contact.pref,
        brithday: contact.contact.birthday,
        role: contact.contact.role,
        title: contact.contact.title,
        org: contact.contact.org,
        orgname: contact.contact.orgname,
      };
      if (initValues.emailList.length === 0) {
        initValues.emailList.push('');
      }
      if (initValues.mobileList.length === 0) {
        initValues.mobileList.push('');
      }
    }
  }
  return initValues;
};

export default ContactForm;
