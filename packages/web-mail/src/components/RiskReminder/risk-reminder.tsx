import React, { useState, useEffect, useMemo } from 'react';
import { Button, Modal } from 'antd';
import message from '@web-common/components/UI/Message/SiriusMessage';
import cn from 'classnames';
import {
  apiHolder,
  apis,
  ContactApi,
  OrgApi,
  MailBlacklistApi,
  MailConfApi,
  SystemApi,
  DataTrackerApi,
  ProductAuthApi,
  apiHolder as api,
  AccountApi,
  ContactAddReq,
} from 'api';
import { useAppSelector } from '@web-common/state/createStore';
import { ReactComponent as IconClose } from '@/images/icons/mail/icon-close1.svg';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import IconCard from '@web-common/components/UI/IconCard';
import style from './risk.reminder.module.scss';
// import { addToExistedCustomerModal } from '@/components/Layout/Customer/NewClient/components/CreateNewClientModal/addToExistedCustomerModal';
import { ContactDetailProps } from '@web-contact/component/Detail/data';
import { useContactModel } from '@web-common/hooks/useContactModel';

import { getIn18Text } from 'api';
import { PrivilegeCheckForMailPlus } from '@/components/UI/PrivilegeEnhance';
import { refreshContactDataByEmails } from '@web-common/state/reducer/contactReducer';
import { getMainAccount } from '@web-common/components/util/contact';
import useState2RM from '@web-mail/hooks/useState2ReduxMock';
import { scenes } from '@/components/Layout/CustomsData/components/uniDrawer/uniDrawerLeads2';
import { PublicMailDomainList } from '@web-edm/utils/utils';
import { UniDrawerModuleId, showUniDrawer } from '@lxunit/app-l2c-crm';
import type { BusinessContactVO } from '@lxunit/app-l2c-crm/models';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const mailConfApi = apiHolder.api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
const mailBlacklistApi = apiHolder.api.requireLogicalApi(apis.mailBlacklistApiImpl) as MailBlacklistApi;
const trackApi = apiHolder.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const productApi = apiHolder.api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

export interface IRiskReminder {
  senderMail: string;
  senderName: string;
  visible: boolean;
  alwaysShow?: boolean;
  setVisible: (v: boolean) => void;
}
/**风险提醒添加已有客户&添加客户 入口，所需要的props */
export type RiskReminderCustomerProps = Pick<ContactDetailProps, '_account' | 'contactId' | 'contact' | 'email'>;
export const RiskReminder = (props: IRiskReminder & RiskReminderCustomerProps) => {
  const { senderMail, senderName, visible, setVisible, _account = getMainAccount(), email, contactId } = props;
  const [noMorePromptVis, setNoMorePromptVis] = useState(false);
  const [addToBLVis, setAddToBLVis] = useState(false);
  const isCorpMail = useAppSelector(state => state.loginReducer.loginInfo.isCorpMailMode);
  // const isMainAccount = systemApi.getCurrentUser()?.id === _account;
  // const contact = useContactModel({ email, contactId, isMainAccount });
  const contactName = props.contact?.contact?.contactName || email;
  const contact = useContactModel({ email, contactId, _account, name: contactName });
  // useUpdateContactModel({ email, contactId, _account, name: props.contact?.contact?.contactName, model: contact });
  // Uni弹窗
  // const [, setUniCustomerParam] = useState2RM('uniCustomerParam');
  // uni添加到原有客户
  const [, setUniToCustomerOrClueParam] = useState2RM('uniToCustomerOrClueParam');

  /** 是否是客户*/
  const isCustomer = useMemo(() => !!contact?.customerOrgModel, [contact]);

  // 外贸通0510，挂载账号如果是客户则不再展示风险提示
  useEffect(() => {
    if (isCustomer) {
      setVisible(false);
    }
  }, [isCustomer]);

  // 添加到通讯录
  const addToContact = async () => {
    trackApi.track('pcMail_click_add_mailcontacts', {});
    try {
      // accountApi.setCurrentAccount({ email: _account });
      const res = await contactApi?.doInsertContact({
        list: { name: senderName, emailList: [senderMail] },
        _account,
      });
      if (res?.success) {
        message.success(getIn18Text('GAILIANXIRENYI'));
        setVisible(false);
      } else {
        message.error(getIn18Text('TIANJIASHIBAI'));
      }
    } catch (error) {
      message.error(getIn18Text('TIANJIASHIBAI'));
    }
  };
  // 关闭
  const handleClose = () => {
    setVisible(false);
  };
  // 查看黑名单
  const checkBL = async () => {
    const url = await mailConfApi.getSettingUrlCommon({
      name: 'options.AntiSpamModule',
      inLocal: false,
      urlType: {},
      isCorpMail,
    });
    if (url && url.length > 0) {
      systemApi.openNewWindow(url, true);
    } else {
      Toast.warn({
        content: getIn18Text('WUFADAKAIZHI'),
        duration: 3,
      });
    }
  };
  const cont = () => {
    return (
      <span>
        {getIn18Text('GAILIANXIRENYI11')}
        <span className={style.checkBL} onClick={checkBL}>
          {getIn18Text('CHAKAN')}
        </span>
      </span>
    );
  };
  // 添加到黑名单
  const addToBL = async () => {
    setAddToBLVis(false);
    trackApi.track('pcMail_click_join_blacklists', {});
    try {
      const res = await mailBlacklistApi.addBlacklist(senderMail);
      if (res) {
        setVisible(false);
        message.success(cont());
      } else {
        message.error(getIn18Text('TIANJIADAOHEIMING'));
      }
    } catch (error) {
      console.log(getIn18Text('TIANJIADAOHEIMING'), error);
      message.error(getIn18Text('TIANJIADAOHEIMING'));
    }
  };
  // 不再提醒
  const noMorePrompt = async () => {
    setNoMorePromptVis(false);
    const result = await mailConfApi.updateRiskReminderStatus(false);
    if (result) {
      setVisible(false);
      message.success(getIn18Text('NINDECAOZUOYI'));
    } else {
      message.warn(getIn18Text('GUANLIYUANYISHE'));
    }
  };
  /** 添加到已有客户 */
  const addToExistedCustomer = React.useCallback(() => {
    if (contact) {
      trackApi.track('uni_external_detail_iframe', {
        button: 'E+_read_add_contact',
      });
      trackApi.track('pcMail_click_stranger_mailDetailPage', {
        action: 'existingCustomer',
      });
      // addToExistedCustomerModal(contact, undefined, 'tip', _account);
      const { contact: contactObj } = contact;
      const { contactName, accountName, displayEmail } = contactObj;
      const email = displayEmail || accountName;
      setUniToCustomerOrClueParam({
        visible: true,
        type: 'customer',
        way: scenes.Email_Read,
        contacts: [
          {
            email,
            contact_name: contactName || email,
          },
        ],
        onOk: () => {
          refreshContactDataByEmails(
            {
              [_account]: [email],
            },
            new Map([[email, contactName]])
          );
        },
      });
    }
  }, [contact]);

  // 新建客户,所需数据
  const customerData = useMemo(() => {
    const emailDomain = email?.split('@')[1] || '';
    const webapp = PublicMailDomainList.includes(emailDomain) ? '' : emailDomain;
    return {
      company_name: '',
      website: webapp,
      contact_list: [
        {
          email: props.email,
          condition: 'company',
          contact_name: props.senderName,
        } as unknown as BusinessContactVO,
      ],
    };
  }, [props.email, props.senderName]);
  /** 新建客户 */
  const addToCustomer = React.useCallback(() => {
    trackApi.track('uni_external_detail_iframe', {
      button: 'E+_read_create',
    });
    trackApi.track('pcMail_click_stranger_mailDetailPage', {
      action: 'addCustomer',
    });
    // setUniCustomerParam({
    //   visible: true,
    //   source: 'mailListRead',
    //   customerData,
    //   onSuccess: () => {
    //     console.log('添加客户成功');
    //     setVisible(false);
    //     refreshContactDataByEmails(
    //       {
    //         [_account]: [email || senderMail],
    //       },
    //       new Map([[email || senderMail, senderName]])
    //     );
    //   },
    //   onClose: () => {},
    // });
    // 新建客户
    showUniDrawer({
      moduleId: UniDrawerModuleId.CustomerDetail,
      moduleProps: {
        visible: true,
        onClose: () => {},
        onSuccess: () => {
          setVisible(false);
          refreshContactDataByEmails(
            {
              [_account]: [email || senderMail],
            },
            new Map([[email || senderMail, senderName]])
          );
        },
        customerData,
        source: 'mailListRead',
      },
    });
  }, []);

  if (!email) {
    return <></>;
  }

  return (
    <>
      <div className={style.riskReminder} hidden={!visible}>
        <div className={style.btnClose} onClick={handleClose}>
          <IconClose />
        </div>
        <div className={style.intro}>
          <IconCard type="warnYellow" class={style.warn} />
          <span className={style.text}>
            {getIn18Text('JIANCEDAO')}
            {senderMail}
            {getIn18Text('BUZAINIDETONG')}
          </span>
        </div>
        <div className={style.funs}>
          <div>
            <span className={style.funBtn} onClick={addToContact}>
              {getIn18Text('TIANJIAZHITONGXUN')}
            </span>
            {
              // 如果已经是客户了则不展示这两个按钮，挂载账号需要也需要可以添加客户
              // !isCustomer && isMainAccount && systemApi.inEdm() && productApi.getABSwitchSync('edm_mail') ? <>
              !isCustomer && systemApi.inEdm() && productApi.getABSwitchSync('edm_mail') ? (
                <>
                  <PrivilegeCheckForMailPlus resourceLabel="CONTACT" accessLabel="OP">
                    <span className={style.funBtn} onClick={addToCustomer}>
                      {getIn18Text('addCustomer')}
                    </span>
                  </PrivilegeCheckForMailPlus>
                  <PrivilegeCheckForMailPlus resourceLabel="CONTACT" accessLabel="OP">
                    <span className={style.funBtn} onClick={addToExistedCustomer}>
                      {getIn18Text('TIANJIADAOYIYOUKEHU')}
                    </span>
                  </PrivilegeCheckForMailPlus>
                </>
              ) : null
            }
            <span className={style.funBtn} onClick={() => setAddToBLVis(true)}>
              {getIn18Text('JIARUHEIMINGDAN')}
            </span>
          </div>
          <div>
            <span className={cn(style.funBtn, style.funBtnNoWarn)} onClick={() => setNoMorePromptVis(true)}>
              {getIn18Text('BUZAITIXING')}
            </span>
          </div>
        </div>
      </div>

      {/* 黑名单 */}
      <Modal visible={addToBLVis} footer={null} closable={false} closeIcon={false} wrapClassName={style.reminderModal} centered={true} destroyOnClose>
        <div>
          <div className={style.title}>
            <IconCard type="downloadFail" class={style.warn} />
            {getIn18Text('QUERENJIAHEIMING')}
          </div>
          <div className={style.intro}>
            {getIn18Text('QUEDINGJIANGXIAOMING')}
            {senderMail}
            {getIn18Text('JIARUHEIMINGDAN11')}
          </div>
          <div className={style.footer}>
            <Button onClick={() => setAddToBLVis(false)}>{getIn18Text('QUXIAO')}</Button>
            <Button type="primary" style={{ marginLeft: 16 }} onClick={addToBL}>
              {getIn18Text('QUEDING')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 不再提醒 */}
      <Modal visible={noMorePromptVis} footer={null} closable={false} closeIcon={false} wrapClassName={style.reminderModal} centered={true} destroyOnClose>
        <div>
          <div className={style.title}>
            <IconCard type="downloadFail" class={style.warn} />
            {getIn18Text('QUERENBUZAITI')}
          </div>
          <div className={style.intro}>{getIn18Text('XIACIJINRUBU')}</div>
          <div className={style.footer}>
            <Button onClick={() => setNoMorePromptVis(false)}>{getIn18Text('QUXIAO')}</Button>
            <Button type="primary" style={{ marginLeft: 16 }} onClick={noMorePrompt}>
              {getIn18Text('QUEDING')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
