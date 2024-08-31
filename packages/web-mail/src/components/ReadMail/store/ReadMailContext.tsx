import React, { createContext, useEffect, useState } from 'react';
import { apiHolder as api, apis, MailApi, MailEntryModel } from 'api';
// import { setCurrentAccount } from '../../../util';

export interface ReadMailContextData {
  /** 是否已读 */
  isRead: boolean;
  /** 是否星标红旗 */
  isFlagged: boolean;
  /** 切换阅读状态 */
  toggleReadStatus: () => void;
  /** 切换星标状态 */
  toggleFlagStatus: () => void;
  /** 是否为聚合邮件 todo */
  isMerge: boolean;
}

export const ReadMailContext = createContext<ReadMailContextData>({} as ReadMailContextData);

interface ReadMailContextProviderProps {
  /** 邮件id */
  mailId: string;
  isMerge?: boolean;
}

export const ReadMailContextProvider: React.FC<ReadMailContextProviderProps> = props => {
  const { mailId, isMerge } = props;
  const [isRead, setIsReadStatus] = useState<boolean>(true);
  const [isFlagged, setIsFlaggedStatus] = useState<boolean>(false);
  const mailApi = api.api.requireLogicalApi(apis.mailApiImpl) as MailApi;
  const eventApi = api.api.getEventApi();

  // useEffect(() => {
  //   const mailSwitchId = eventApi.registerSysEventObserver('mailSwitch', (ev: SystemEvent) => {
  //     // do nothing just prevent page crash
  //   });

  //   return () => {
  //     eventApi.unregisterSysEventObserver('mailSwitch', mailSwitchId);
  //   };
  // }, []);

  /** 获取初始服务器端单封邮件未读、红旗状态 */
  useEffect(() => {
    if (mailId && !isMerge) {
      // setCurrentAccount();
      // 聚合邮件调用此接口会报错
      mailApi.doGetMailContent(mailId, false, true).then((content: MailEntryModel) => {
        // const _isRead = content?.entry?.readStatus === 'read';
        const _isFlagged = content?.entry?.mark === 'redFlag';
        // setIsReadStatus(_isRead);
        setIsFlaggedStatus(_isFlagged);
      });
    }
  }, [mailId]);

  /** 乐观更新 */
  const hanldleSetRedFlag = () => {
    setIsFlaggedStatus(!isFlagged);
    if (window.location.pathname.indexOf('readMail') === -1) {
      return;
    }
    // 只有主账号有
    eventApi.sendSysEvent({
      eventName: 'mailStatesChanged',
      eventData: {
        mark: isFlagged,
        id: mailId,
        hideMessage: true,
      },
      _account: '',
      eventStrData: isFlagged ? 'mark' : 'unmark',
    });
    // setCurrentAccount();
    mailApi
      .doMarkMail(!isFlagged, mailId, 'redFlag')
      .then(res => (res.succ ? setIsFlaggedStatus(!isFlagged) : setIsFlaggedStatus(isFlagged)))
      .catch(_ => setIsFlaggedStatus(isFlagged));
  };
  // 该方法已经无实际引用了
  const hanldleSetReadStatus = () => {
    setIsReadStatus(!isRead);

    if (window?.location?.pathname?.indexOf('readMail') === -1) {
      return;
    }
    eventApi.sendSysEvent({
      eventName: 'mailStatesChanged',
      eventData: {
        mark: !isRead,
        id: mailId,
        hideMessage: true,
        tagOnly: true,
      },
      _account: '',
      eventStrData: 'read',
    });

    // todo
    // setCurrentAccount();
    mailApi
      .doMarkMail(!isRead, mailId, 'read')
      .then(res => (res.succ ? setIsReadStatus(!isRead) : setIsReadStatus(isRead)))
      .catch(err => {
        console.warn('[mail-page][mark] error', err);
        setIsReadStatus(isRead);
      });
  };

  return (
    <ReadMailContext.Provider
      value={{
        isRead,
        isFlagged,
        toggleReadStatus: hanldleSetReadStatus,
        toggleFlagStatus: hanldleSetRedFlag,
      }}
    >
      {props.children}
    </ReadMailContext.Provider>
  );
};
