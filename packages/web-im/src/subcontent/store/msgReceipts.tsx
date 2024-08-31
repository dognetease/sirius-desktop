import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import debounce from 'lodash/debounce';
import { IMMessage, apiHolder, NIMApi } from 'api';
import lodashGet from 'lodash/get';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

interface MsgReceiptContextApi {
  addReceiptMsg: (msg: IMMessage) => void;
  setSessionId: React.Dispatch<string>;
}

// 当前会话中的用户信息
export const MsgReceiptContext = createContext<MsgReceiptContextApi>({} as MsgReceiptContextApi);
type SingleMsgReceipt = Pick<IMMessage, 'to' | 'idServer' | 'idClient'>;
// 发送群消息已读通知
export const TeamMsgReceipt: React.FC<any> = props => {
  // const [lastMsg, setLastMsg] = useState<IMMessage | null>(null);
  const [list, setList] = useState<SingleMsgReceipt[]>([]);
  const [documentVisible, setDocumentVisible] = useState<VisibilityState>('visible');
  const [sessionId, setSessionId] = useState('');
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      setDocumentVisible(document.visibilityState);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);
  const sendReceiptMsg = debounce(async () => {
    let index = 0;
    const totalList: SingleMsgReceipt[][] = [];
    while (index < list.length) {
      totalList.push(list.slice(index, 50 + index));
      index += 50;
    }
    // 执行发送
    // 单次允许发送最多50条数据
    totalList.forEach(subList => {
      nimApi.excute('sendTeamMsgReceipt', {
        teamMsgReceipts: subList.map(item => ({
          teamId: item.to,
          idServer: item.idServer,
          idClient: item.idClient,
        })),
      });
    });
    // 清空数据
    if (!isMountedRef.current) return;
    setList([]);
  }, 30);

  // 发送已读回执
  useEffect(() => {
    if (!list.length || documentVisible !== 'visible') {
      return;
    }
    sendReceiptMsg();
  }, [list, documentVisible]);

  // 设置当前会话。会话中所有的消息都是已读状态
  useEffect(() => {
    if (documentVisible === 'visible' && sessionId.length) {
      nimApi.excuteSync('setCurrSession', sessionId);
    }
    return () => {
      nimApi.excuteSync('setCurrSession', '');
    };
  }, [documentVisible, sessionId]);

  const addReceiptMsg = (msg: IMMessage) => {
    setList(state => {
      const list = [...state];
      if (!msg.hasRead as boolean) {
        list.push({
          to: msg.to,
          idClient: msg.idClient,
          idServer: msg.idServer,
        });
      }

      return list;
    });
  };

  return <MsgReceiptContext.Provider value={{ addReceiptMsg, setSessionId }}>{props.children}</MsgReceiptContext.Provider>;
};

export const P2PMsgReceipt: React.FC<any> = props => {
  const [lastMsg, setLastMsg] = useState<IMMessage | null>(null);
  const [documentVisible, setDocumentVisible] = useState<VisibilityState>('visible');
  const [sessionId, setSessionId] = useState('');
  // 监视程序可视状态
  useEffect(() => {
    const onVisibilityChange = () => {
      setDocumentVisible(document.visibilityState);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // 设置当前会话。会话中所有的消息都是已读状态
  useEffect(() => {
    if (documentVisible === 'visible' && sessionId.length) {
      nimApi.excuteSync('setCurrSession', sessionId);
    }
    return () => {
      nimApi.excuteSync('setCurrSession', '');
    };
  }, [documentVisible, sessionId]);

  // 发送已读回执(P2P只需要发送最后一条消息.Team需要每条消息发送已读回执)
  const sendReceiptMsg = debounce(async () => {
    // 执行发送
    nimApi.excute('sendMsgReceipt', {
      msg: lastMsg,
    });
  }, 50);

  useEffect(() => {
    if (lastMsg && documentVisible === 'visible') {
      sendReceiptMsg();
    }
  }, [lastMsg, documentVisible]);

  const addReceiptMsg = (msg: IMMessage) => {
    setLastMsg(state => {
      // 如果新消息时间>当前消息 或者当前消息为null.返回新消息
      const currentTime = lodashGet(state, 'time', false) || 0;
      if (msg.time >= currentTime) {
        return msg;
      }
      return { ...state };
    });
  };

  return <MsgReceiptContext.Provider value={{ addReceiptMsg, setSessionId }}>{props.children}</MsgReceiptContext.Provider>;
};
