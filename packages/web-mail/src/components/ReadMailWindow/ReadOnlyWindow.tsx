import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import ReadMail from '../ReadMail/ReadMail';
import MailSyncModal from '@web-mail/components/MailSyncModal/MailSyncModal';
import MailBoxEventHander from '@web-mail/components/mailBoxEventHander/readMailEventHandler';
import listenWriteMail from '@web-mail/components/listenWriteMail';
import { useAppDispatch } from '@web-common/state/createStore';
import { Button } from 'antd';
import { isMainAccount } from '@web-mail/util';
import { apiHolder, environment, inWindow, MailApi, apis } from 'api';
import { getIn18Text } from 'api';
import MailDetailLoading from '@web-mail/components/ReadMail/component/Loadings';
import useStateRef from '@web-mail/hooks/useStateRef';
import { setCurrentAccount } from '@web-mail/util';
const writeToPattern = /writeMailToContact=([0-9a-zA-Z%_#@\-.]+)/i;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const eventApi = apiHolder.api.getEventApi();
import { safeDecodeURIComponent } from '@web-common/utils/utils';

interface props {
  id: string;
  from?: string;
  teamId?: string;
  handoverEmailId?: string; // 如果有handoverEmailId，则表示是询盘转发的邮件
  mailAccount: string;
}
const ReadMailWindow: React.FC<props> = props => {
  const { id, from, teamId, mailAccount, handoverEmailId } = props;
  const dispatch = useAppDispatch();
  const MailBoxEventHanderMemo = useMemo(() => <MailBoxEventHander />, []);
  const teamIdRef = useRef(teamId);
  teamIdRef.current = teamId;

  const isMailAccount = isMainAccount(mailAccount);
  const mailAccountRef = useStateRef(mailAccount);

  // 接受写信页显示消息
  useEffect(() => {
    const eventId = listenWriteMail(dispatch);
    if (inWindow() && window.location.hash && writeToPattern.test(window.location.hash)) {
      const exec = writeToPattern.exec(window.location.hash);
      if (exec && exec[1]) {
        const writeTo = safeDecodeURIComponent(exec[1]);
        // setCurrentAccount(mailAccountRef.current);
        mailApi.doWriteMailToContact([writeTo]);
      }
    }
    return () => {
      eventApi.unregisterSysEventObserver('writeLatter', eventId);
    };
  }, []);

  const fileRender = useCallback(({ error, retry }) => {
    const isAvailable = error?.message == 'availableFail';
    return (
      <div className="mail-detail-error-warp">
        <div className="sirius-empty sirius-empty-doc" />
        <div className="md-error-tip">{isAvailable ? getIn18Text('GAIYOUJIANYIBEI') : getIn18Text('JIAZAISHIBAI')}</div>
        {isAvailable ? (
          <></>
        ) : (
          <div className="md-btn-warp">
            <Button type="link" onClick={() => retry()}>
              {getIn18Text('ZHONGSHI')}
            </Button>
          </div>
        )}
      </div>
    );
  }, []);

  const featureConfig = useMemo(() => {
    return {
      mailDiscuss: false,
      relatedMail: isMailAccount,
      // 屏蔽邮件标签的删除
      // mailTagIsCloseAble: isMailAccount,
      // 屏蔽邮件阅读状态
      readStatus: isMailAccount,
    };
  }, [isMailAccount]);

  const doGetMailContentIM = useCallback(id => {
    // setCurrentAccount();
    return mailApi.doGetMailContentIM(id, teamIdRef.current);
  }, []);

  const doGetMailContentInquiry = useCallback(
    id => {
      return mailApi.doGetMailContentInquiry(handoverEmailId!);
    },
    [handoverEmailId]
  );

  const LoadingElement = useMemo(() => {
    return <MailDetailLoading />;
  }, []);

  return (
    <>
      <ReadMail
        mailId={{
          id,
          account: mailAccount,
        }}
        openInNewWindow
        getSignMailContent={handoverEmailId ? doGetMailContentInquiry : doGetMailContentIM}
        readOnly
        failRender={fileRender}
        featureConfig={featureConfig}
        emptyRender={LoadingElement}
      />
      <MailSyncModal />
      {MailBoxEventHanderMemo}
    </>
  );
};
export default ReadMailWindow;
