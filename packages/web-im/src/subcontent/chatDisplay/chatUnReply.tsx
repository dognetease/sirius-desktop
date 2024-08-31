import React, { useContext, useEffect, useRef } from 'react';
import classnames from 'classnames/bind';
import lodashGet from 'lodash/get';
import { useObservable } from 'rxjs-hooks';
import { NIMApi, apiHolder } from 'api';
import { Observable } from 'rxjs';
import { take, filter } from 'rxjs/operators';
import style from '../imChatList.module.scss';
import { ReplyMsgContext } from '../store/replingMsg';
import { SummaryChatContent } from '../../common/summaryChatContent';
import { useYunxinAccount } from '../../common/hooks/useYunxinAccount';
import { getMsg } from '../../common/getMsg';

const realStyle = classnames.bind(style);
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
// 待回复消息
const ChatToBeReply: React.FC<any> = () => {
  const { replyMsg, setReplyMsg } = useContext(ReplyMsgContext);

  const $sessionId = useObservable(() => nimApi.currentSession.getSubject() as Observable<string>, '');
  const $draftReplyMsg = useObservable(
    (_, $props) => {
      const $msgId = nimApi.sessionStream.getSessionField($props) as Observable<{ replyMsgId: string; replyMsgTime: number }>;
      return $msgId.pipe(
        filter(item => lodashGet(item, 'replyMsgId.length', 0) !== 0),
        take(1)
      );
    },
    {} as { replyMsgId: string; replyMsgTime: number },
    [$sessionId, 'localCustom.draft']
  );
  useEffect(() => {
    if (lodashGet($draftReplyMsg, 'replyMsgId.length', 0) === 0) {
      return () => {};
    }

    const { replyMsgId, replyMsgTime } = $draftReplyMsg;

    getMsg(replyMsgId, {
      sessionId: $sessionId,
      time: replyMsgTime,
    }).then(msg => {
      msg.sessionId === $sessionId && setReplyMsg(msg);
    });
    return () => {};
  }, [lodashGet($draftReplyMsg, 'replyMsgId', '')]);

  // 主动保存被引用状态
  useEffect(() => {
    if (lodashGet(replyMsg, 'idClient.length', 0) === 0 || replyMsg?.idClient === $draftReplyMsg?.replyMsgId || '') {
      return () => {};
    }
    nimApi.sessionStream.updateLocalCustom($sessionId, {
      draft:
        lodashGet(replyMsg, 'idClient.length', 0) !== 0
          ? {
              replyMsgId: replyMsg!.idClient,
              replyMsgTime: replyMsg!.time,
            }
          : {},
    });
    return () => {};
  }, [lodashGet(replyMsg, 'idClient', '')]);

  useEffect(() => {
    if (lodashGet(replyMsg, 'idClient.length', 0) === 0) {
      return () => {};
    }
    const $id = nimApi.interceptor.request.use(([command, options]) => {
      const _id = replyMsg!.sessionId;
      if (/^send/i.test(command)) {
        try {
          nimApi.sessionStream.updateLocalCustom(_id, {
            draft: {},
          });
        } catch (ex) {}
      }
      return Promise.resolve([command, options]);
    });
    return () => {
      nimApi.interceptor.request.eject($id);
    };
  }, [lodashGet(replyMsg, 'idClient', '')]);

  const clearReply = () => {
    nimApi.sessionStream.updateLocalCustom($sessionId, {
      draft: {},
    });
    setReplyMsg(null);
  };
  const fromUser = useYunxinAccount(lodashGet(replyMsg, 'from', ''));

  if (!replyMsg) {
    return null;
  }
  return (
    <div className={`${realStyle('replyWrapper')} chat-un-reply-warpper`}>
      <SummaryChatContent fromNick={fromUser?.nick} msg={replyMsg} className={realStyle('replyMsg')} />
      <span onClick={clearReply} className={`${realStyle('close')} close`} />
    </div>
  );
};

export default ChatToBeReply;
