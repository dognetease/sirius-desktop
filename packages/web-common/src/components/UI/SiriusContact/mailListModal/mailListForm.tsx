import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, Select, Tooltip } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import classnames from 'classnames';
import { apiHolder, apis, ContactApi, OrgApi, MailListMember, ContactItem, ContactModel } from 'api';
import styles from './mailListForm.module.scss';
import ContactScheduleModal from '../scheduleModal';
import OrgSelectModal from '../orgSelectModal/orgSelectModal';
import ContactTrackerIns from '@web-contact/tracker';
import { OrgItem } from '@web-common/utils/contact_util';
import { verifyEmail } from '@web-mail-write/util';
import { creatExternalContentItem, transContactModel2ContactItem, transEntityOrg2OrgItem } from '@web-common/components/util/contact';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { getIn18Text } from 'api';

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;

export interface MailListFormField {
  nickname: string;
  account_name: string;
  domain: string;
  maillist_right: string;
  mailListVis: boolean;
  memberVis: boolean;
  member_list: string[];
  unit_list: string[];
  maintainer_list: string[];
  safe_list: string[];
  org_level: string;
  scope_unit_list: string[];
}

interface MailListFormProps {
  id?: string;
  purpose: 'create' | 'update';
  email?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

// 使用范围
const maillist_rights = [
  { text: getIn18Text('QiYEYUHEYUWAI'), val: '0' },
  { text: getIn18Text('JINQIYEYU'), val: '4' },
  { text: getIn18Text('LIEBIAOCHENGYUANHEZIDINGYIYONGHU'), val: '2' },
  { text: getIn18Text('JINZIDINGYIYONGHU'), val: '3' },
];
const CustomUserRights = ['2', '3'];
const ALIAS_ERROE_CODE = 'ERR.EMAILLIST.ALIASERR';

const Option = Select.Option;

const MailListForm: React.FC<MailListFormProps> = props => {
  const { purpose, email, onCancel, onSuccess, id } = props;
  const [advancedSettingOpen, setAdvancedSettingOpen] = useState<boolean>(false);
  const [domains, setDomains] = useState<string[]>([]);
  const [showCustomizeUser, setShowCustomizeUser] = useState<boolean>(false);

  const [initMemberList, setInitMemberList] = useState<ContactItem[]>([]);
  const [initMaintainerList, setInitMaintainerList] = useState<ContactItem[]>([]);
  const [initSafeList, setInitSafeList] = useState<ContactItem[]>([]);

  const [initUnitList, setInitUnitList] = useState<OrgItem[]>([]);

  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [form] = Form.useForm<MailListFormField>();

  // 打开高级设置
  const openAdvancedSetting = () => {
    setAdvancedSettingOpen(true);
  };

  // 取消
  const onCkCancel = () => onCancel();

  // 新建提交
  const createSubmit = async (params: MailListMember) => {
    try {
      setConfirmLoading(true);
      const res = await contactApi.createMaillist(params);
      setConfirmLoading(false);
      const { success, message: msg, errorCode } = res;
      if (success) {
        message.success({ content: getIn18Text('XINJIANYOUJIANLIEBIAOCHENGGONG') });
        onSuccess();
        ContactTrackerIns.tracker_mail_list_save_click('保存成功');
        return;
      }
      // 别名邮箱错误
      if (errorCode && errorCode.includes(ALIAS_ERROE_CODE)) {
        const aliasStr = errorCode.split(':')[1] || '';
        SiriusModal.error({
          title: getIn18Text('BUZHICHIYUBIEMINGYOUXIANG'),
          hideCancel: true,
          content: aliasStr || '',
        });
        return;
      }
      message.error({ content: msg || getIn18Text('XINJIANYOUJIANLIEBIAOSHIBAI') });
      ContactTrackerIns.tracker_mail_list_save_click('保存失败');
    } catch (error) {
      setConfirmLoading(false);
      console.log('createMaillistError', error);
      message.error({ content: getIn18Text('XINJIANYOUJIANLIEBIAOSHIBAI') });
      ContactTrackerIns.tracker_mail_list_save_click('保存失败');
    }
  };

  // 编辑提交
  const updateSubmit = async (params: MailListMember) => {
    try {
      setConfirmLoading(true);
      const res = await contactApi.updateMaillist(params, id);
      setConfirmLoading(false);
      const { success, message: msg, errorCode } = res;
      if (success) {
        message.success({ content: getIn18Text('BIANJIYOUJIANLIEBIAOCHENGGONG') });
        onSuccess();
        ContactTrackerIns.tracker_mail_list_save_click('保存成功');
        return;
      }
      // 别名邮箱错误
      if (errorCode && errorCode.includes(ALIAS_ERROE_CODE)) {
        const aliasStr = errorCode.split(':')[1] || '';
        SiriusModal.error({
          title: getIn18Text('BUZHICHIYUBIEMINGYOUXIANG'),
          hideCancel: true,
          content: aliasStr || '',
        });
        return;
      }
      message.error({ content: msg || getIn18Text('BIANJIYONGJIANLIEBIAOSHIBAI') });
      ContactTrackerIns.tracker_mail_list_save_click('保存失败');
    } catch (error) {
      setConfirmLoading(false);
      console.log('updateMaillistError', error);
      message.error({ content: getIn18Text('BIANJIYONGJIANLIEBIAOSHIBAI') });
      ContactTrackerIns.tracker_mail_list_save_click('保存失败');
    }
  };

  // 确定
  const onCkSubmit = async () => {
    try {
      const validateRes = await form.validateFields();
      const { nickname, account_name, domain, maillist_right, mailListVis, memberVis, member_list, unit_list, maintainer_list, safe_list, org_level, scope_unit_list } =
        validateRes;

      const params = {
        nickname,
        account_name,
        domain,
        maillist_right, // 可见范围
        safe_list: safe_list || [], // 可见范围所选成员
        unit_list: unit_list || [], // 部门成员
        member_list: member_list || [], // 个体成员
        maintainer_list: maintainer_list || [], // 管理员
        addr_visible: !!mailListVis ? '1' : '0',
        member_visible: !!memberVis ? '1' : '0',
        // 占位 不用
        org_level: org_level || '0', // 默认公开
        scope_unit_list: scope_unit_list || [], // 默认为空
      };

      if (purpose === 'create') {
        createSubmit(params);
      }
      if (purpose === 'update') {
        updateSubmit(params);
      }
    } catch (error) {
      console.log('校验失败', error);
      ContactTrackerIns.tracker_mail_list_save_click('保存失败');
    }
  };

  // 获取域名
  const getDomain = async () => {
    try {
      const res = await contactApi.listUserDomain();
      const { code, result } = res;
      if (code === 200 && result) {
        const { data } = result;
        const domains = (data || []).map(item => item.domain);
        setDomains(domains);
        if (purpose === 'create') {
          // 使用首个
          const firDomain = domains[0];
          form.setFieldsValue({ domain: firDomain });
        }
      }
    } catch (error) {
      console.error('获取domain失败', error);
    }
  };

  const normalizeFun = (itemList: unknown[]) => {
    if (Array.isArray(itemList)) {
      return Array.from(
        new Set(
          itemList
            .map(e => {
              if (e.email && typeof e.email === 'string') {
                return e.email;
              }
              return e;
            })
            .filter(e => !!e)
        )
      );
    }
    return [];
  };

  const normalizeUnitFun = (itemList: unknown[]) => {
    if (Array.isArray(itemList)) {
      return Array.from(
        new Set(
          itemList
            .map(e => {
              if (e.originId && typeof e.originId === 'string') {
                return e.originId;
              }
              return e;
            })
            .filter(e => !!e)
        )
      );
    }
    return [];
  };

  // 新建刚进入的初始化操作
  const createInit = () => {
    form.setFieldsValue({
      maillist_right: maillist_rights[0].val,
      mailListVis: true,
      memberVis: true,
    });
  };

  // 转换为ContactItem
  const transfer2ContactItems = async (emails: string[]) => {
    const res = await contactApi.doGetContactByEmailFilter({ emails });
    const contactList: ContactItem[] = [];
    emails.forEach(email => {
      const contact = res[email];
      if (contact) {
        contactList.push(transContactModel2ContactItem(contact as ContactModel));
      } else {
        // console.log('转换为ContactItem存在失败 before:', emails, ' after:', contactList);
        contactList.push(creatExternalContentItem(email));
      }
    });
    // 有转换失败的
    // if(contactList.length !== emails.length) {
    //   console.log('转换为ContactItem存在失败 before:', emails, ' after:', contactList);
    // };
    return contactList;
  };

  // 转换为OrgItem
  const transfer2OrgItems = async (originIdList: string[]) => {
    if (!originIdList.length) {
      return [];
    }
    const res2 = await contactApi.doGetOrgList({ originIdList });
    const unitList: OrgItem[] = [];
    res2.forEach(unit => {
      unit && unitList.push(transEntityOrg2OrgItem(unit));
    });
    // 有转换失败的
    if (unitList.length !== originIdList.length) {
      console.log('转换为OrgItem存在失败 before:', originIdList, ' after:', unitList);
    }
    return unitList;
  };

  // 编辑刚进入的初始化操作
  const updateInit = async () => {
    if (!email) return;
    try {
      const emailArr = email?.split('@');
      if (emailArr?.length) {
        const params = {
          account_name: emailArr[0],
          domain: emailArr[1],
        };
        // 获取详情
        const res = await contactApi.getMaillist(params);
        const { success, message: msg, data } = res;
        if (!success) {
          message.error({ content: msg || '获取详情失败' });
          onCancel();
        }
        const {
          nickname,
          account_name,
          domain,
          maillist_right,
          safe_list,
          member_list,
          unit_list,
          maintainer_list,
          org_level,
          scope_unit_list,
          member_visible,
          addr_visible,
        } = data.data;
        const memberListEmails = (member_list || []).map(item => item.email);
        const safeListEmails = safe_list || [];
        const maintainerListEmails = (maintainer_list || []).map(item => item.email);
        const scopeUnitListEmails = (scope_unit_list || []).map(item => item.unit_id);
        const unitIds = (unit_list || []).map(item => item.unit_id);

        form.setFieldsValue({
          nickname,
          account_name,
          domain,
          maillist_right: String(maillist_right),
          safe_list: safeListEmails,
          member_list: memberListEmails,
          unit_list: unitIds,
          maintainer_list: maintainerListEmails,
          org_level: String(org_level),
          scope_unit_list: scopeUnitListEmails,
          mailListVis: String(addr_visible) === '1',
          memberVis: String(member_visible) === '1',
        });

        if (CustomUserRights.includes(String(maillist_right))) {
          setShowCustomizeUser(true);
        }

        Promise.all([
          transfer2ContactItems(memberListEmails),
          transfer2ContactItems(maintainerListEmails),
          transfer2ContactItems(safeListEmails),
          transfer2OrgItems(unitIds),
        ]).then(arr => {
          setInitMemberList(arr[0]);
          setInitMaintainerList(arr[1]);
          setInitSafeList(arr[2]);
          setInitUnitList(arr[3]);
        });
      }
    } catch (error) {
      console.log('获取详情失败', error);
    }
  };

  // 适用范围变化
  const onUseRangeChange = (val: string) => {
    if (CustomUserRights.includes(val)) {
      setShowCustomizeUser(true);
      return;
    }
    setShowCustomizeUser(false);
    // 清空自定义用户
    form.setFieldsValue({
      safe_list: [],
    });
  };

  // 刚进入 获取域名
  useEffect(() => {
    getDomain();
  }, []);

  useEffect(() => {
    if (purpose === 'create') {
      createInit();
    }
    if (purpose === 'update') {
      updateInit();
    }
  }, [purpose]);

  return (
    <Form form={form} requiredMark={false} colon={false} className={styles.mailListForm}>
      <div className={styles.formContent}>
        {/* 邮件列表名称（必填） */}
        <Form.Item
          required={true}
          label={<i className={classnames(styles.icon, styles.listName)} />}
          name="nickname"
          validateTrigger={['onChange', 'onBlur']}
          rules={[
            { required: true, message: getIn18Text('QINGSHURUYOUJIANLIEBIAO') },
            { max: 100, message: getIn18Text('QINGSHURUBUCHAO') },
          ]}
        >
          <Input data-test-id="modal_mailList_name" placeholder={getIn18Text('YOUJIANLIEBIAOBITIAN')} />
        </Form.Item>
        {/* 邮箱地址（必填） */}
        <Form.Item required={true} label={<i className={classnames(styles.icon, styles.email)} />} name="email">
          <div className={styles.emailArea} data-test-id="modal_mailList_select_emailArea">
            <Form.Item
              name="account_name"
              className={styles.emailPrefixItem}
              validateTrigger={['onChange', 'onBlur']}
              rules={[{ required: true, message: getIn18Text('QINGSHURUYOUXIANG2') }]}
            >
              <Input disabled={purpose === 'update'} data-test-id="modal_mailList_account" placeholder={getIn18Text('YOUXIANGDIZHIBITIAN')} />
            </Form.Item>
            <span className={styles.at}>@</span>
            <Form.Item name="domain" className={styles.domainItem}>
              <Select
                disabled={purpose === 'update'}
                data-test-id="modal_mailList_select_list"
                dropdownClassName={styles.selectDropDown}
                suffixIcon={<i className={styles.expandIcon} />}
              >
                {domains.map(item => (
                  <Option data-test-id="modal_mailList_select_item" className={styles.selectOption} key={item} value={item}>
                    {item}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </Form.Item>
        {/* 邮件列表成员 */}
        <Form.Item required={true} label={<i className={classnames(styles.icon, styles.member)} />}>
          <div className={styles.memberArea} data-test-id="modal_mailList_selectInput_memberArea">
            {/* 部门 */}
            <Form.Item label="" name="unit_list" className={styles.unitListItem} normalize={normalizeUnitFun}>
              <OrgSelectModal
                showClear
                defaultSelectList={initUnitList}
                showSuffix
                isIM
                useSuffixIcon={false}
                enableSearchEntityOrg={true}
                showAddTeamBtn={false}
                placeholder={getIn18Text('SHURUZHENGGEBUMEN')}
              />
            </Form.Item>
            <p className={styles.remark}>{getIn18Text('BUMENNEIFASHENGBIANGENG')}</p>
            {/* 成员 */}
            <Form.Item
              label=""
              name="member_list"
              className={styles.memberListItem}
              normalize={normalizeFun}
              rules={[
                {
                  validator: (_, value) => {
                    if (Array.isArray(value)) {
                      const valited = value.reduce((prev, curv) => prev && verifyEmail(curv?.trim()), true);
                      if (!valited) {
                        return Promise.reject('邮件格式错误');
                      }
                      return Promise.resolve();
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <ContactScheduleModal
                defaultSelectList={initMemberList}
                includeSelf
                listItemHeight={30}
                placeholder={getIn18Text('SHURUDANGECHENGYUANYOUXIANG')}
                useSuffixIcon={false}
                showClear
                showSuffix
                noRelateEnterprise={true}
              />
            </Form.Item>
          </div>
        </Form.Item>

        {/* 高级设置 */}
        <div className={styles.advancedSetting} style={{ display: !!advancedSettingOpen ? 'block' : 'none' }}>
          <p className={styles.advancedSettingText}>{getIn18Text('GAOJISHEZHI')}</p>
          {/* 管理员 */}
          <Form.Item label={<i className={classnames(styles.icon, styles.admin)} />}>
            <div className={styles.adminArea} data-test-id="modal_mailList_selectInput_adminArea">
              <span className={styles.adminText}>{getIn18Text('GUANLIYUAN')}</span>
              <Form.Item
                label=""
                name="maintainer_list"
                className={styles.maintainerListItem}
                normalize={normalizeFun}
                rules={[
                  {
                    type: 'array',
                    max: 3,
                    validateTrigger: ['onChange', 'onBlur'],
                    message: '管理员最多输入3个',
                  },
                ]}
              >
                <ContactScheduleModal
                  defaultSelectList={initMaintainerList}
                  includeSelf
                  showNoData={false}
                  type={['enterprise']}
                  listItemHeight={30}
                  placeholder={getIn18Text('QINGSHURUGUANLIYUAN')}
                  showSuffix
                  showClear
                  noRelateEnterprise={true}
                />
              </Form.Item>
            </div>
          </Form.Item>

          {/* 使用范围 */}
          <Form.Item label={<i className={classnames(styles.icon, styles.lock)} />}>
            <div className={styles.useRangeArea} data-test-id="modal_mailList_select_useRangeArea">
              <span className={styles.rangeText}>{getIn18Text('SHIYONGFANWEI')}</span>
              <Tooltip overlayClassName="show-arrow" title={getIn18Text('KESHEZHINAXIEREN')}>
                <i className={classnames(styles.icon, styles.info)} />
              </Tooltip>
              <Form.Item name="maillist_right" className={styles.useRangeItem}>
                <Select
                  data-test-id="modal_mailList_select_list"
                  dropdownClassName={styles.selectDropDown}
                  suffixIcon={<i className={styles.expandIcon} />}
                  onChange={val => onUseRangeChange(val)}
                >
                  {maillist_rights.map(item => (
                    <Option data-test-id="modal_mailList_select_item" className={styles.selectOption} key={item.val} value={item.val}>
                      {item.text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            {/* 自定义用户 */}
            <div className={styles.customUserArea} style={{ display: !!showCustomizeUser ? 'block' : 'none' }} data-test-id="modal_mailList_selectInput_customerUserArea">
              <p className={styles.customUserTitle}>{getIn18Text('ZIDINGYIYONGHU')}：</p>
              <Form.Item
                label=""
                name="safe_list"
                className={styles.safeListItem}
                normalize={normalizeFun}
                rules={[
                  {
                    type: 'array',
                    validateTrigger: ['onChange', 'onBlur'],
                    validator: (_, value: string[]) => {
                      const curRight = form.getFieldValue('maillist_right');

                      if (!CustomUserRights.includes(curRight)) {
                        return Promise.resolve();
                      }

                      // 仅在使用范围是自定义用户的时候做空检查
                      if (curRight === '3' && (!value || !value.length)) {
                        return Promise.reject('请添加自定义用户');
                      }
                      // 邮件格式检查
                      const valited = value.reduce((prev, curv) => prev && verifyEmail(curv?.trim()), true);
                      if (!valited) {
                        return Promise.reject('邮件格式错误');
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <ContactScheduleModal defaultSelectList={initSafeList} includeSelf listItemHeight={30} placeholder={getIn18Text('YOUXIANGDOUHAO')} showSuffix showClear />
              </Form.Item>
            </div>
          </Form.Item>

          {/* 邮件列表在通讯录中可见 */}
          <Form.Item name="mailListVis" valuePropName="checked">
            <Checkbox data-test-id="modal_mailList_checkbox_mailListVis">{getIn18Text('YOUJIANLIEBIAOTONGXUNLUKEJIAN')}</Checkbox>
          </Form.Item>
          {/* 允许查看邮件列表成员 */}
          <Form.Item name="memberVis" valuePropName="checked">
            <Checkbox data-test-id="modal_mailList_checkbox_memberVis">{getIn18Text('YUNXUCHAKANYOUJIANLIEBIAOCHENGYUAN')}</Checkbox>
          </Form.Item>
        </div>
      </div>
      <div className={styles.footer}>
        {!advancedSettingOpen && (
          <Button type="default" data-test-id="modal_mailList_btn_setting" className={styles.advancedSetting} onMouseDown={openAdvancedSetting}>
            {getIn18Text('GAOJISHEZHI')}
          </Button>
        )}
        <Button type="default" data-test-id="modal_mailList_btn_cancel" className={styles.cancelBtn} onMouseDown={onCkCancel}>
          {getIn18Text('QUXIAO')}
        </Button>
        <Button type="primary" data-test-id="modal_mailList_btn_sure" className={styles.mainBtn} onMouseDown={onCkSubmit} loading={confirmLoading}>
          {getIn18Text('QUEREN')}
        </Button>
      </div>
    </Form>
  );
};

export default MailListForm;
