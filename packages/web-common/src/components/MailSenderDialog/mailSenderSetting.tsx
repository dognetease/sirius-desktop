import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Modal, Input, Divider, Select, Form, Space } from 'antd';
import styles from './mailSenderSetting.module.scss';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { apiHolder as api, apis, MailAliasAccountModel, MailConfApi, util } from 'api';
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import TriangleDownIcon from '@web-common/components/UI/Icons/svgs/TriangleDown';
import { ReactComponent as DeleteIcon } from '@/images/icons/modal_close_temp.svg';
import { useAppSelector } from '@web-common/state/createStore';
import { getIn18Text } from 'api';
const { Option } = Select;
export enum SenderSettingType {
  NICKNAME_SETTING = 'NICKNAME_SETTING',
  SENDER_SETTING = 'SENDER_SETTING',
}
interface MailSenderSettingProps {
  isShow: boolean;
  type: SenderSettingType;
  handleSubmit?: Function;
  setVisible?: Function;
}
const mailConfApi: MailConfApi = api.api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
const MailSenderSetting: React.FC<MailSenderSettingProps> = ({ isShow, handleSubmit = () => {}, setVisible = () => {}, type }) => {
  const tag = '[MailSenderSetting]';
  const [mailAliasAccount, setMailAliasAccount] = useState<MailAliasAccountModel[]>([]);
  const [mailProxyAccount, setMailProxyAccount] = useState<MailAliasAccountModel[]>([]);
  const [list, setList] = useState<MailAliasAccountModel[]>([]);
  const [curId, setCurId] = useState<MailAliasAccountModel>({ name: '', id: '', domain: '', nickName: '', senderName: '' });
  const [defaultSenderId, setDefaultSenderId] = useState<string>('');
  const { currentMail } = useAppSelector(state => state.mailReducer);
  const [form] = Form.useForm();

  const getMailAliasAccountList = () => {
    mailConfApi.getMailSenderInfo().then((rs: MailAliasAccountModel[]) => {
      if (rs && rs.length > 0) {
        setMailAliasAccount(
          rs
            .filter(item => !item.isProxy)
            .sort((a, b) => {
              if (a.isMainEmail) {
                return -1;
              }
              if (b.isMainEmail) {
                return 1;
              }
              return 0;
            })
        );
        const popoAccounts = rs.filter(item => item.isProxy);
        setMailProxyAccount(popoAccounts);
        form.setFieldsValue({ popoAccounts });
        setList(rs);
        const mainSender = rs.find(item => item.isMainEmail);
        if (mainSender) {
          setCurId(mainSender);
          form.setFieldsValue({ senderName: mainSender.senderName });
        }
        const defualtSender = rs.find(item => item.isDefault);
        if (defualtSender) {
          setDefaultSenderId(defualtSender.id);
          form.setFieldsValue({ defulatSender: defualtSender.id });
        }
      }
    });
  };
  useMsgRenderCallback('mailAliasAccountListChange', ev => {
    if (ev?.eventData?.mailId === currentMail.cid) {
      getMailAliasAccountList();
    }
  });

  useEffect(() => {
    if (isShow) {
      getMailAliasAccountList();
    }
  }, [isShow]);
  const handleOk = useCallback(async () => {
    form
      .validateFields()
      .then(async values => {
        console.log('Received values of form:', values);
        const { popoAccounts = [], defulatSender, senderName } = values;
        let hasChanged = false;
        const validProxyAccounts = popoAccounts.filter((item: any, idx: number) => item.senderName !== mailProxyAccount[idx].senderName);
        if (validProxyAccounts.length > 0) {
          hasChanged = true;
          await mailConfApi.doUpdatePOPAccounts(validProxyAccounts.map((item: any) => ({ id: item.editId, name: item.senderName?.trim() })));
        }
        if (senderName && senderName !== curId.senderName) {
          hasChanged = true;
          await mailConfApi.setMailSenderName(senderName?.trim());
        }
        if (defulatSender && defulatSender !== defaultSenderId) {
          hasChanged = true;
          await mailConfApi.setDefaultSender(defulatSender);
        }
        setVisible(false);
        handleSubmit(hasChanged);
        // form.resetFields();
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  }, [mailProxyAccount]);

  const handleCancel = useCallback(() => {
    setVisible(false);
  }, []);
  const handleSenderSelectChange = useCallback(val => {
    // setVisible(false);
    console.log('handleSenderSelectChange', val);
    setDefaultSenderId(val);
    // mailConfApi.setDefaultSender(val);
  }, []);
  const handleInputBlur = useCallback(
    (e, key, index?) => {
      console.log(tag, 'handleInputBlur', e.target.value, key, index);
      const val = e.target.value;
      if (!val) {
        if (key === 'popoAccounts') {
          const originVal = mailProxyAccount[index];
          form.setFieldsValue({ popoAccounts: form.getFieldValue('popoAccounts').map((item: any, idx: any) => (index === idx ? originVal : item)) });
        } else {
          form.resetFields([key]);
        }
      }
    },
    [mailProxyAccount]
  );
  const senderContent = (
    <div className={styles.mailSenderContent}>
      <Form.Item name="defulatSender" initialValue={defaultSenderId} label="默认发件人" className={styles.mailSenderContentSelect}>
        <Select dropdownClassName={styles.selectDropdown} value={defaultSenderId} suffixIcon={<TriangleDownIcon />} onChange={handleSenderSelectChange}>
          {list.map(item => (
            <Option key={item.id} default={item.isDefault} value={item.id}>
              {item.id}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </div>
  );
  return (
    <Modal
      onOk={handleOk}
      onCancel={handleCancel}
      className={`ant-allow-dark ${styles.mailNicknameContainer}`}
      closeIcon={<DeleteIcon />}
      title={type === SenderSettingType.NICKNAME_SETTING ? getIn18Text('XIUGAIFAJIANREN') : getIn18Text('FAJIANRENSHEZHI')}
      okText={getIn18Text('BAOCUN')}
      cancelText={getIn18Text('QUXIAO')}
      visible={isShow}
      width="745px"
      destroyOnClose={true}
    >
      <OverlayScrollbarsComponent style={{ maxHeight: '350px' }}>
        <Form preserve={false} requiredMark={false} form={form} name="mail_sender_setting" colon={false}>
          <div className={styles.mailNicknameContent}>
            {/*发件人设置 */}
            {type === SenderSettingType.SENDER_SETTING && senderContent}
            {type === SenderSettingType.SENDER_SETTING && <span className={styles.mailNicknameContentTitle}>{getIn18Text('BIANJIFAJIANREN')}</span>}
            {/*发件人昵称列表 */}
            <div className={styles.mailListItem}>
              <div className={styles.mailListItemInputField}>
                <Form.Item name="senderName" initialValue={curId.senderName} label={getIn18Text('FAJIANRENNICHENG')}>
                  <Input maxLength={50} className={styles.mailListItemInput} />
                </Form.Item>
              </div>
              <div className={styles.mailListItemAddr}>
                {mailAliasAccount.map(item => (
                  <div className={styles.mailListItemAddrItem}>
                    <label>{item.isMainEmail ? getIn18Text('YOUXIANGDEZHI') : getIn18Text('YOUXIANGBIEMING')}</label>
                    <span>{item.id}</span>
                  </div>
                ))}
              </div>
            </div>
            {type === SenderSettingType.NICKNAME_SETTING && mailProxyAccount.length > 0 && <Divider />}
            <Form.List name="popoAccounts" initialValue={mailProxyAccount}>
              {fields =>
                fields.map(({ name, key, ...rest }) => (
                  <Space key={key} align="baseline">
                    <div className={styles.mailListItem}>
                      <div className={styles.mailListItemInputField}>
                        <Form.Item name={[name, 'senderName']} label={getIn18Text('FAJIANRENNICHENG')} {...rest}>
                          <Input maxLength={12} onBlur={e => handleInputBlur(e, 'proxy_account', key)} className={styles.mailListItemInput} />
                        </Form.Item>
                        <label>{getIn18Text('(DAIFA)YOU')}</label>
                        <span>{form.getFieldValue('popoAccounts')[key].id}</span>
                      </div>
                    </div>
                  </Space>
                ))
              }
            </Form.List>
          </div>
        </Form>
      </OverlayScrollbarsComponent>
    </Modal>
  );
};

export default MailSenderSetting;
