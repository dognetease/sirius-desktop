import React, { useContext } from 'react';
import classnames from 'classnames/bind';
import { IMMessage } from 'api';
import lodashGet from 'lodash/get';
import style from './chatItem.module.scss';
import { ChatTypeTip } from './chatItemTypes';
import { QuickComments } from './chatItemComments';
import { CommentsContext } from '../store/quickCommentsList';
import { useYunxinAccount } from '../../common/hooks/useYunxinAccount';
import { ChatItemContent } from './chatItemContent';

const realStyle = classnames.bind(style);

interface ChatItemApi {
  msg: IMMessage;
  wrapperClassname?: string;
  displayNick?: boolean;
  timeTag?: React.ReactElement | null;
  [key: string]: any;
  quickCommentsBg?: string;
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

export const ChatTreadItem: React.FC<ChatItemApi> = props => {
  const { msg, wrapperClassname = '', displayNick = false, timeTag = null, quickCommentsBg = '' } = props;

  // 获取可能需要获取人员信息
  const fromUser = useYunxinAccount(msg.from);

  const { commentsMap } = useContext(CommentsContext);

  return (
    <section className={realStyle('msgSection')}>
      {/* 提醒消息 */}
      {msg.type === 'tip' && <ChatTypeTip msg={msg} />}
      {/* 常规展示消息 */}
      {!['tip'].includes(msg.type) && (
        <ChatItemContent
          user={fromUser}
          msg={msg}
          quotedMsgContent={null}
          displayNick={displayNick}
          timeTag={timeTag}
          quickComments={<QuickComments msg={msg} bgColor={quickCommentsBg} />}
          containComplexEle={lodashGet(commentsMap, `${msg.idClient}.length`, 0) !== 0}
          containerMsgMenu={false}
          wrapperClassname={wrapperClassname}
        />
      )}
    </section>
  );
};
