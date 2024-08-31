/**
 *  邮件分发
 */
import React, { useState, useEffect, useMemo } from 'react';
import message from '@web-common/components/UI/Message/SiriusMessage';
import style from './MailDelivery.module.scss';
import ContactScheduleModal from '@web-common/components/UI/SiriusContact/scheduleModal';
import { AccountApi, apiHolder as api, apis, ContactTreeType, DataTrackerApi, MailApi, MailModelEntries, SystemApi } from 'api';
import { ContactItem } from '@web-common/utils/contact_util';
import { verifyEmail } from '@web-mail-write/util';
import { isMainAccount } from '@web-mail/util';
import cloneDeep from 'lodash/cloneDeep';
import SiriusModal from '@web-common/components/UI/Modal/SiriusModal';
import { MailActions, useAppDispatch } from '@web-common/state/createStore';
import { getIn18Text } from 'api';

const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const systemApi = api.api.getSystemApi() as SystemApi;
const trackApi: DataTrackerApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

// 限制数
const MAX_NUM = 500;
// 根据ContactItem[]形成邮件分发，bcc参数的函数
const transContactItem2DeliveryBcc = (arr: ContactItem[]): string[] => {
  const result = arr.map(a => {
    const { email, name } = a || {};
    if (!email) {
      return '';
    }
    return name ? `"${name}" <${email}>` : email;
  });
  return result.filter(s => !!s);
};

export interface MailDeliveryProps {
  mailId: string; // 操作邮件的id
  account: string; // 操作邮件的的账号
  way: string; // 弹窗触发方式
  visible: boolean;
  setVisible: (visible: boolean) => void;
}
export const MailDelivery = (props: MailDeliveryProps) => {
  const dispatch = useAppDispatch();
  const { visible, setVisible, mailId, account, way } = props;
  // 错误提示
  const [errText, setErrText] = useState<string>('');
  // 联系人
  const [bcc, setBcc] = useState<ContactItem[]>([]);
  // 发送中
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setBcc([]);
      setErrText('');
    }
  }, [visible]);
  // 关闭
  const handleCancel = () => {
    setVisible(false);
  };
  // 确认
  const handleOk = () => {
    const bccArr: string[] = transContactItem2DeliveryBcc(bcc);
    setLoading(true);
    // 设置当前账号，处理获取sid不正确
    // accountApi.setCurrentAccount({ email: account });
    mailApi
      .requestDelivery(mailId, bccArr, account)
      .then(res => {
        if (res === true) {
          // 成功
          message.success(getIn18Text('deliveryMailSuccess'));
          setVisible(false);
          // 成功之后延迟2s，再更新redux和本地库，防止邮件分发详情接口没有同步到
          setTimeout(async () => {
            // 从服务器同步本地库
            const result = await mailApi.doListMailBoxEntities(
              {
                mids: [mailId],
                count: 1,
                returnModel: true,
              },
              true
            );
            // 同步redux状态
            dispatch(
              MailActions.updateMailEntities({
                mailList: (result as MailModelEntries).data,
              })
            );
          }, 2000);
        } else {
          message.error(getIn18Text('deliveryMailFailed'));
        }
        setLoading(false);
      })
      .catch(err => {
        // 失败
        message.error(getIn18Text('deliveryMailFailed'));
        setLoading(false);
      });
    // 打点
    try {
      trackApi.track('waimao_mail_click_distribute', { way });
    } catch (error) {
      console.log('[mail delivery] error', error);
    }
  };
  // 修改收件人
  const handleChange = (ContactItemArr: ContactItem[]) => {
    const value = ContactItemArr.map(c => c.email);
    const valited = Array.isArray(value) && value.reduce((prev, curv) => prev && verifyEmail(curv?.trim()), true);
    const limited = Array.isArray(value) && value.length <= MAX_NUM;
    if (!valited) {
      setErrText(getIn18Text('YOUXIANGGESHICUO1'));
    }
    if (!limited) {
      setErrText(getIn18Text('deliveryMaxNum'));
    }
    // 没有错误就清除掉
    if (valited && limited) {
      setErrText('');
    }
    if (ContactItemArr.length <= MAX_NUM) {
      setBcc(ContactItemArr);
    } else {
      const bccCp = cloneDeep(ContactItemArr);
      setBcc(bccCp.splice(0, MAX_NUM));
    }
  };

  // 是否使用edm数据，控制是否展示联系人弹窗中的客户联系人
  const useEdm = systemApi.inEdm();
  // 非主账号，挂载的163或者qq，通讯录下期望只保留最近联系人和我的群组
  // const ContactScheduleModalProp = {} as any;
  // if (account) {
  //   const emailDomain = account?.split('@')[1];
  //   if (!isMainAccount(account) && (emailDomain === 'qq.com' || emailDomain === '163.com')) {
  //     ContactScheduleModalProp.type = ['team', 'recent'];
  //   }
  // }

  const treeType: ContactTreeType[] | undefined = useMemo(() => {
    if (isMainAccount(account)) {
      return undefined;
    }
    const isQy = accountApi.getAccountsEmailType(account) === 'NeteaseQiYeMail';
    if (isQy) {
      return ['personal', 'recent', 'customer', 'enterprise'];
    }
    return ['personal', 'recent', 'customer'];
  }, [account]);

  return (
    <>
      <SiriusModal
        maskStyle={{ top: 0 }}
        wrapClassName={style.wrap}
        closable={false}
        visible={visible}
        title={getIn18Text('deliveryMailTitle')}
        onCancel={handleCancel}
        onOk={handleOk}
        okButtonProps={{ disabled: bcc.length === 0 || loading || errText === getIn18Text('YOUXIANGGESHICUO1') }}
        cancelButtonProps={{ disabled: loading }}
        okText={getIn18Text('FASONG')}
        cancelText={getIn18Text('QUXIAO')}
        width={480}
        maskClosable={false}
        className={style.mailDelivery}
      >
        <ContactScheduleModal
          accountRootKey={account}
          includeSelf
          useEdm={useEdm}
          disabled={loading}
          showClear
          onChange={handleChange}
          defaultSelectList={bcc}
          ceiling={MAX_NUM}
          type={treeType}
          placeholder={getIn18Text('deliveryPlaceholder')}
        />
        {errText && <span className={style.warn}>{errText}</span>}
        <div className={style.tip}>
          <div>
            1、{getIn18Text('deliveryTip1')}
            <span className={style.warn}>{getIn18Text('deliveryTip2')}</span>
            {getIn18Text('deliveryTip3')}
            <span className={style.warn}>{getIn18Text('deliveryTip4')}</span>
          </div>
          <div>2、{getIn18Text('deliveryTip5')}</div>
        </div>
      </SiriusModal>
    </>
  );
};
export default MailDelivery;
