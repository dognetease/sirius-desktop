import React, { useCallback, useContext, useMemo, useEffect } from 'react';
import lodashGet from 'lodash/get';
import classnames from 'classnames/bind';
import message from '@web-common/components/UI/Message/SiriusMessage';
import { IMMessage } from 'api';
import { Context } from '../store/replyMsgProvider';
import { SummaryChatContent } from '../../common/summaryChatContent';
import style from '../imChatList.module.scss';
import { Context as TreadDrawerContext } from '../store/treadDrawerVisbleProvider';
import { useYunxinAccount } from '../../common/hooks/useYunxinAccount';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
interface ChatItemReplyApi {
  idClient: string;
  time: number;
  scene: string;
  to: string;
  from: string;
  quoteMsg: IMMessage;
}
export const ChatItemReply: React.FC<ChatItemReplyApi> = props => {
  const { idClient, time, scene, to, from, quoteMsg } = props;
  const { replyMap, requestReply } = useContext(Context);
  const fromUser = useYunxinAccount(from, 'p2p');
  useEffect(() => {
    requestReply({
      idClient,
      from,
      scene,
      to,
      endTime: time + 10,
      beginTime: time - 10,
    });
  }, []);
  const { requestTreadInfo } = useContext(TreadDrawerContext);
  const openTreadTree = useCallback(
    async e => {
      try {
        await requestTreadInfo(quoteMsg);
      } catch (ex) {
        message.info(getIn18Text('GAIHUIFUCHUSHI'));
      }
    },
    [quoteMsg]
  );
  const customMsgContent = (msg: IMMessage) => (msg.type === 'tip' ? getIn18Text('CIXIAOXIYICHE') : false);
  return useMemo(() => {
    const replyMsg = replyMap[idClient];
    return replyMsg ? (
      <SummaryChatContent
        testId="im_session_content_single_msg_reply_msg"
        fromNick={fromUser?.nick || ''}
        msg={replyMsg}
        className={realStyle('traceMsg')}
        onClick={openTreadTree}
        customMsgContent={customMsgContent}
      />
    ) : (
      <div className={realStyle('traceMsg')}>loading...</div>
    );
  }, [lodashGet(replyMap, `${idClient}.idClient`), fromUser?.account || '']);
};
