import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import ReadMail from '../ReadMail/ReadMail';
import MailSyncModal from '@web-mail/components/MailSyncModal/MailSyncModal';
import MailBoxEventHander from '@web-mail/components/mailBoxEventHander/readMailEventHandler';
import listenWriteMail from '@web-mail/components/listenWriteMail';
import { useAppDispatch } from '@web-common/state/createStore';
import useState2RM from '../../hooks/useState2ReduxMock';
import { isMainAccount, tpMailAttConfig, edmReplyMailAttConfig, setCurrentAccount } from '@web-mail/util';
import { apiHolder, environment, inWindow, MailApi, apis, EdmSendBoxApi } from 'api';
// import { useEventObserver } from '@web-common/hooks/useEventObserver';
const writeToPattern = /writeMailToContact=([0-9a-zA-Z%_#@\-.]+)/i;
const mailApi = apiHolder.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
const edmApi = apiHolder.api.requireLogicalApi(apis.edmSendBoxApiImpl) as EdmSendBoxApi;
const eventApi = apiHolder.api.getEventApi();
const systemApi = apiHolder.api.getSystemApi();
import useMsgRenderCallback from '@web-common/hooks/useMsgRenderCallback';
import MailDetailLoading from '@web-mail/components/ReadMail/component/Loadings';
import useStateRef from '@web-mail/hooks/useStateRef';
import { safeDecodeURIComponent } from '@web-common/utils/utils';

interface props {
  id: string;
  from?: string;
  mailAccount: string;
  forceUpdate?: string;
  tpMailConfig?: { isTpMail: boolean; owner: string } | null;
  edmReplyConfig?: { edmEmailId: string; operateId?: string; bounceId?: string; isBounced?: boolean; isPrivilege?: boolean } | null;
}

const ReadMailWindow: React.FC<props> = props => {
  const { id, from, mailAccount, forceUpdate, tpMailConfig, edmReplyConfig } = props;
  const dispatch = useAppDispatch();
  const MailBoxEventHanderMemo = useMemo(() => <MailBoxEventHander account={mailAccount} />, [mailAccount]);
  const [localMailId, setLocalMailId] = useState2RM('readMailWindowActiveMailId', 'doUpdateReadMailWindowActiveMailId');
  const mailAccountRef = useStateRef(mailAccount);

  useEffect(() => {
    const eventId = listenWriteMail(dispatch);
    if (inWindow() && window.location.hash && writeToPattern.test(window.location.hash)) {
      const exec = writeToPattern.exec(window.location.hash);
      if (exec && exec[1]) {
        const writeTo = safeDecodeURIComponent(exec[1]);
        // setCurrentAccount(mailAccountRef.current);
        mailApi.doWriteMailToContact([writeTo], mailAccountRef.current);
      }
    }
    return () => {
      eventApi.unregisterSysEventObserver('writeLatter', eventId);
    };
  }, []);

  useEffect(() => {
    if (id) {
      setLocalMailId(id);
    }
  }, [id, forceUpdate]);

  /**
   * 窗口关闭前，清清除id以恢复状态
   */
  useMsgRenderCallback('electronClose', () => {
    setLocalMailId(null);
  });

  const doGetTpMailContent = useCallback(
    (id, noFlagInfo, noCache) => {
      return mailApi.doGetTpMailContent(
        {
          mid: id,
          owner: tpMailConfig?.owner,
        },
        noCache
      );
    },
    [tpMailConfig?.owner]
  );

  const getReplyContent = useCallback(
    (id, noFlagInfo, noCache) => {
      if (edmReplyConfig?.edmEmailId && edmReplyConfig?.bounceId) {
        const bounceList = edmReplyConfig?.bounceId.split('|');
        if (edmReplyConfig.isBounced) {
          return edmApi.getBounceContent({
            edmEmailId: edmReplyConfig?.edmEmailId || '',
            contactEmail: bounceList[0] || '',
            tid: bounceList[1] || '',
          });
        }
        return edmApi.getSendedContent({
          edmEmailId: edmReplyConfig?.edmEmailId || '',
          contactEmail: bounceList[0] || '',
          tid: bounceList[1] || '',
        });
      }
      if (edmReplyConfig?.isPrivilege) {
        return edmApi.getPrivilegeReplyContent({
          mid: id,
          edmEmailId: edmReplyConfig?.edmEmailId || '',
          operateId: edmReplyConfig?.operateId || '',
        });
      }
      return edmApi.getReplyContent({
        mid: id,
        edmEmailId: edmReplyConfig?.edmEmailId || '',
        operateId: edmReplyConfig?.operateId || '',
      });
    },
    [edmReplyConfig]
  );

  const readOnly = useMemo(() => {
    return !!(
      (tpMailConfig && tpMailConfig?.isTpMail) ||
      (edmReplyConfig?.edmEmailId && edmReplyConfig?.operateId) ||
      (edmReplyConfig?.edmEmailId && edmReplyConfig?.bounceId)
    );
  }, [tpMailConfig?.isTpMail, edmReplyConfig?.edmEmailId, edmReplyConfig?.operateId, edmReplyConfig?.bounceId]);

  const featureConfig = useMemo(() => {
    const isMailAccount = isMainAccount(mailAccount);
    return {
      mailDiscuss: false,
      // 屏蔽往来邮件功能
      relatedMail: isMailAccount,
      // 屏蔽邮件标签的删除
      // mailTagIsCloseAble: isMailAccount,
      // 屏蔽邮件阅读状态
      readStatus: isMailAccount,
      // 附件卡片配置
      attachCard: tpMailConfig?.isTpMail ? tpMailAttConfig : edmReplyConfig?.edmEmailId ? edmReplyMailAttConfig : undefined,
    };
  }, [mailAccount, tpMailConfig?.isTpMail]);

  const LoadingElement = useMemo(() => {
    return <MailDetailLoading />;
  }, []);

  return useMemo(() => {
    const isMailAccount = isMainAccount(mailAccount);
    return (
      <>
        <ReadMail
          mailId={{
            id: localMailId,
            account: mailAccount,
          }}
          openInNewWindow
          from={from}
          featureConfig={featureConfig}
          getSignMailContent={edmReplyConfig?.edmEmailId ? getReplyContent : tpMailConfig?.isTpMail ? doGetTpMailContent : null}
          readOnly={readOnly}
          emptyRender={LoadingElement}
        />
        <MailSyncModal />
        {MailBoxEventHanderMemo}
      </>
    );
  }, [localMailId, from, readOnly, featureConfig]);
};

export default ReadMailWindow;
