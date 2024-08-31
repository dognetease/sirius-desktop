import React, { createContext, useState, useEffect, useRef } from 'react';
import { IMMessage, apiHolder, IMUser, NIMApi } from 'api';
// 回复信息

interface ReplyMsgContextApi {
  replyMsg: IMMessage | null;
  setReplyMsg: React.Dispatch<any>;
}

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

// 当前会话中的用户信息
export const ReplyMsgContext = createContext<ReplyMsgContextApi>({} as ReplyMsgContextApi);
// 发送群消息已读通知
export const ReplyMsgProvider: React.FC<any> = props => {
  const [replyMsg, setReplyMsg] = useState<IMMessage | null>(null);
  useEffect(() => {
    if (!replyMsg) {
      return () => {};
    }
    const id = nimApi.interceptor.request.use(([methodname, options]) => {
      options.replyMsg = replyMsg;
      // 如果不是本地消息不消除待回复信息
      if (options.isLocal !== true) {
        setReplyMsg(null);
      }
      return Promise.resolve([methodname, options]);
    });
    return () => {
      nimApi.interceptor.request.eject(id);
    };
  }, [replyMsg]);
  return (
    <ReplyMsgContext.Provider
      value={{
        replyMsg,
        setReplyMsg,
      }}
    >
      {props.children}
    </ReplyMsgContext.Provider>
  );
};
