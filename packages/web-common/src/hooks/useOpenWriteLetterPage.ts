/**
 * 主窗口组件中监听从非主窗口发送打开写信窗口的消息
 * 在 mailImpl 已经实现了
 import {
  api, apis, EventApi, MailApi
} from 'api';
 import { useEffect } from 'react';
const useOpenWriteLetterPage = () => {
  const eventApi = api.getEventApi() as EventApi;
  const mailApi = (api.requireLogicalApi(apis.mailApiImpl) as unknown) as MailApi;

  useEffect(() => {
    const eventId = eventApi.registerSysEventObserver('openWritePageFromMain', ev => {
      if (location.pathname === '/') {
        mailApi.callWriteLetterFunc(ev.eventData);
      }
    });

    return () => {
      eventApi.unregisterSysEventObserver('openWritePageFromMain', eventId);
    };
  }, []);
};

export default useOpenWriteLetterPage;

 * */
