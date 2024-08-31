import React, { useEffect, useState } from 'react';
import styles from './RevokeToasts.module.scss';
import { AccountApi, apiHolder as api, apis, DataTrackerApi, MailApi, MailEntryModel } from 'api';
import { useAppDispatch, useAppSelector } from '@web-common/state/createStore';
import { actions as mailActions, SendingMail } from '@web-common/state/reducer/mailReducer';
import IconCard from '@web-common/components/UI/IconCard';
import RevokeCountDown from '@web-mail/components/RevokeCountDown/RevokeCountDown';
import SiriusMessage from '@web-common/components/UI/Message/SiriusMessage';
import { openMailInWinow, reOpenMail } from '@web-mail/util';
import { getIn18Text } from 'api';

const mailApi: MailApi = api.api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
const accountApi = api.api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
const trackApi = api.api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

interface RevokeToastsProps {}

const RevokeToasts: React.FC<RevokeToastsProps> = React.forwardRef(() => {
  const [sendingMailLen, setSendingMailLen] = useState<number>(0);
  const { sendingMails } = useAppSelector(state => state.mailReducer);
  const dispatch = useAppDispatch();

  // 撤销
  const revoke = async (item: SendingMail) => {
    trackApi.track('pcMail_click_button_cancelSendMailToast', { buttonName: '撤销发送' });
    const { id, tid, sentTInfo } = item;
    // 清除redux
    dispatch(mailActions.doRemoveSendingMail(id));
    try {
      const cancelRes = await mailApi.doCancelDeliver({ tid, tinfo: sentTInfo, mailTrace: true });
      // 撤回失败
      if (!cancelRes.success) {
        return;
      }
      reOpenMail(item);
    } catch (error) {
      console.log('撤销失败', error);
    }
  };

  // 查看邮件
  const checkMail = async (item: SendingMail) => {
    trackApi.track('pcMail_click_button_cancelSendMailToast', { buttonName: '查看邮件' });
    const { id } = item;
    const accounts = await accountApi.getMainAndSubAccounts();
    const mainAccount = accounts[0].mainAccount;
    openMailInWinow({ id, _account: mainAccount } as MailEntryModel);
  };

  // 立即发送
  const sendImmediately = async (item: SendingMail) => {
    const { id, sentTInfo } = item;
    // 清除redux
    dispatch(mailActions.doRemoveSendingMail(id));
    try {
      const sendRes = await mailApi.doImmediateDeliver({ tinfo: sentTInfo });
      // 立即发送失败
      if (sendRes.success) {
        SiriusMessage.success({ content: '立即发送成功' });
      } else {
        SiriusMessage.error({ content: '立即发送失败' });
      }
    } catch (error) {
      console.log('立即发送失败', error);
    }
  };

  // 关闭toast
  const closeToast = (closeId: string) => {
    trackApi.track('pcMail_click_button_cancelSendMailToast', { buttonName: '关闭' });
    const newSendingMails = sendingMails.map(item => {
      const { id } = item;
      if (id === closeId) {
        return {
          ...item,
          toastShow: false,
        };
      }
      return item;
    });
    dispatch(mailActions.doUpdateSendingMails(newSendingMails));
  };

  useEffect(() => {
    // 新增发送中邮件
    if (sendingMails.length > sendingMailLen) {
      trackApi.track('pcMail_show_cancelSendMailToast', {});
    }
    setSendingMailLen(sendingMails.length);
  }, [sendingMails.length]);

  return (
    <div className={styles.revokeToasts}>
      {sendingMails.map(item => {
        return (
          <>
            {item.toastShow !== false && (
              <div className={styles.revokeToast}>
                <RevokeCountDown
                  id={item.id}
                  createTime={item.createTime}
                  attrs={{
                    strokeColor: '#94A6FF',
                    strokeLinecap: 'butt',
                    trailColor: 'white',
                    strokeWidth: 7.5,
                    width: 21,
                  }}
                  leftSecStyle={{
                    fontWeight: 400,
                    fontSize: '12px',
                    color: 'white',
                  }}
                />
                <span>发送中</span>
                <div className={styles.revoke} onClick={() => revoke(item)}>
                  {getIn18Text('CHEXIAO')}
                </div>
                <div className={styles.checkMail} onClick={() => checkMail(item)}>
                  {getIn18Text('CHAKANYOUJIAN')}
                </div>
                <div className={styles.sendImmediately} onClick={() => sendImmediately(item)}>
                  {getIn18Text('LIJIFASONG')}
                </div>
                <IconCard type="close" style={{ cursor: 'pointer' }} strokeStyle={{ stroke: 'white' }} onClick={() => closeToast(item.id)} />
              </div>
            )}
          </>
        );
      })}
    </div>
  );
});

export default RevokeToasts;
