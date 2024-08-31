import React, { useContext, useState, useEffect } from 'react';
import classnames from 'classnames/bind';
import { apiHolder, IMMessage, NIMApi } from 'api';
import lodashGet from 'lodash/get';
import style from './chatItem.module.scss';
import { Context as MessageContext, MessageAction } from '../store/messageProvider';
import { judgeMsgType } from '@web-im/utils/im_team_util';
import { ChatItemReply } from './chatItemReply';
import ChatItemStatus from './chatItemStatus';
import ChatTimeline from './chatTimeline';
import { ChatTypeTip, ChatTypeSys } from './chatItemTypes';
import { QuickComments } from './chatItemComments';
import { CommentsContext } from '../store/quickCommentsList';
import { PopoverUser } from '../../common/usercard/userCard';
import { MsgReceiptContext } from '../store/msgReceipts';
import { useYunxinAccount } from '../../common/hooks/useYunxinAccount';
import { ChatItemContent } from './chatItemContent';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const realStyle = classnames.bind(style);

interface ChatItemApi {
  msg: IMMessage;
}

const getAllAccounts = (msg: IMMessage) =>
  [
    () => msg.from,
    () => msg.to,
    () => lodashGet(msg, 'attach.account', '') as string,
    () => lodashGet(msg, 'attach.accounts', []) as string[],
    () => lodashGet(msg, 'apns.accounts', []) as string[],
    () => {
      try {
        const msgCustomContent = JSON.parse(msg.custom as string);
        return lodashGet(msgCustomContent, 'mentions', []);
      } catch (ex) {}
      return [];
    },
  ]
    .reduce((total: string[], cur: () => string | string[]) => {
      const result = cur() as string[] | string | undefined;
      const curList = (Array.isArray(result) ? result : [result]) as string[];
      return [...new Set([...total, ...curList])];
    }, [] as string[])
    .filter(item => item && item.length);

const ChatItem: React.FC<ChatItemApi> = props => {
  const { msg } = props;
  const fromUser = useYunxinAccount(msg.from);
  // 进来之后对方发送的消息发送已读回执
  const { addReceiptMsg } = useContext(MsgReceiptContext);
  useEffect(() => {
    if (msg.flow === 'in') {
      addReceiptMsg(msg);
    }
  }, []);

  // 重发逻辑
  const { dispatch } = useContext(MessageContext);
  const { commentsMap } = useContext(CommentsContext);
  const updateMsg = (msg: IMMessage) => {
    dispatch({
      type: MessageAction.REPLACE_MSG,
      payload: {
        msg,
      },
    });
  };
  const retrySendMsg = async () => {
    const retryMsg = await nimApi.excute('resendMsg', {
      needReturn: true,
      done(error, result) {
        updateMsg(result);
      },
      msg,
    });
    updateMsg(retryMsg);
  };

  const onClickIcon = status => {
    if (status === 'fail') {
      retrySendMsg();
    }
  };

  return (
    <section className={realStyle('msgSection')}>
      {/* 时间线 */}
      {msg.timeTagIndex === 0 && <ChatTimeline time={msg.time} testId="im_session_content_msg_time_line" />}
      {/* 提醒消息 */}
      {msg.type === 'tip' && <ChatTypeTip msg={msg} />}
      {/* 通知类消息 */}
      {msg.type === 'notification' && <ChatTypeSys msg={msg} SubComponent={PopoverUser} type="content" placement="bottom" />}
      {/* 常规展示消息 */}
      {!['tip', 'system', 'notification'].includes(msg.type) && (
        <>
          <ChatItemContent
            user={fromUser}
            msg={msg}
            displayNick={msg.flow === 'in' && msg.scene === 'team'}
            timeTag={
              <ChatTimeline
                testId="im_session_content_single_msg_time"
                time={msg.time}
                classnames={realStyle('singleMsgTime', msg.scene === 'team' && msg.flow === 'in' ? 'follow' : 'alone')}
                alias={{}}
              />
            }
            quotedMsgContent={
              msg.replyMsgIdClient ? (
                <ChatItemReply
                  scene={msg.scene}
                  idClient={msg.replyMsgIdClient}
                  to={msg.replyMsgToAccount as string}
                  time={msg.replyMsgTime as number}
                  from={msg.replyMsgFromAccount as string}
                  quoteMsg={msg}
                />
              ) : null
            }
            quickComments={
              <QuickComments msg={msg} bgColor={judgeMsgType(msg, 'type', 1014) ? '#f4f4f5' : msg.flow === 'out' || msg.from === msg.to ? '#CEDDFD' : '#EBEBEB'} />
            }
            containComplexEle={lodashGet(commentsMap, `${msg.idClient}.length`, 0) !== 0 || lodashGet(msg, 'replyMsgIdClient.length', 0) !== 0}
            containerMsgMenu={msg.from.indexOf('lx_') === -1 && msg.status === 'success' && !msg.isLocal}
            // containerMsgMenu={msg.status === 'success'}
          >
            {/* 消息发送状态 */}
            <ChatItemStatus className={realStyle('msgStatus')} msg={msg} onClickIcon={onClickIcon} />
          </ChatItemContent>
        </>
      )}
    </section>
  );
};

export default ChatItem;
