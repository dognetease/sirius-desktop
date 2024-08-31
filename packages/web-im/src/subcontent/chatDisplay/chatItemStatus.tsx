import React, { useState, useEffect } from 'react';
import { IMMessage, apiHolder, NIMApi } from 'api';
import { useObservable } from 'rxjs-hooks';
import { Observable, iif, of, mergeMap, map, filter, take } from 'rxjs';
import { MessageFlagReaded, MessageFlagUnread, MessageFlagFailed, MessageFlagSending } from '../../common/icon/messageFlag';
import MsgReadAccount from './msgReadAccount';
import MsgReadDetail from './msgReadDetail';
import styles from './chatItem.module.scss';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

interface StatusApi {
  msg: IMMessage;
  className?: string;
  onClickIcon?: (status: string) => any;
}

const ChatItemStatus: React.FC<StatusApi> = props => {
  const { msg, className = '', onClickIcon = str => {} } = props;

  const [readed, setReaded] = useState<boolean>(false);

  // 消息最新接受时间(群聊会话不需要关注)
  const $msgReceiptTime = useObservable(
    (_, $props) =>
      $props.pipe(
        map(([id]) => id),
        mergeMap(val => iif(() => /^p2p/i.test(val), nimApi.sessionStream.getSessionField($props) as Observable<number>, of(0)))
      ),
    0,
    [msg.sessionId, 'msgReceiptTime']
  );

  // 判断当前消息是否已读
  useEffect(() => {
    const time = msg.resend ? msg.userUpdateTime : msg.time;
    setReaded(time <= $msgReceiptTime);
  }, [$msgReceiptTime, msg.idClient]);

  const [status, setStatus] = useState<string>('');
  useEffect(() => {
    if (msg.status !== 'success') {
      setStatus(msg.status);
    } else if (msg.scene === 'team' && msg.needMsgReceipt) {
      setStatus('team-count');
    } else if (readed) {
      setStatus('readed');
    } else {
      setStatus('unread');
    }
  }, [msg.status, readed]);

  const teamMemeberCount = useObservable(() => {
    const teamInfo = nimApi.imteamStream.getSubject();
    return teamInfo!.pipe(
      filter(teamList => {
        return Object.keys(teamList).includes(msg.to);
      }),
      map(teamList => {
        return teamList[msg.to].memberNum;
      }),
      take(1)
    );
  }, 1);

  // 如果是外部接受的信息或者自发自收的消息
  if (msg.flow !== 'out' || msg.from === msg.to) {
    return null;
  }

  if (teamMemeberCount > 500) {
    return null;
  }

  return (
    <span
      data-test-id={'im_list_sessionitem_status_' + status}
      className={`${className} ${status} ${status !== 'unread' ? 'dark-invert-brightness' : ''}`}
      onClick={e => {
        e.preventDefault();
        onClickIcon(status);
      }}
    >
      {status === 'fail' && <MessageFlagFailed />}
      {status === 'sending' && <MessageFlagSending />}
      {status === 'team-count' && Reflect.has(msg, 'idServer') && <MsgReadAccount idServer={msg.idServer as string} msg={msg} overlay={<MsgReadDetail msg={msg} />} />}
      {/* {status === 'unread' && <MessageFlagUnread />} */}
      {status === 'unread' && <i className={styles.unreadWrap} />}
      {/* 暗黑模式需要对未读图标特殊处理，所以改为背景图片了 */}
      {status === 'readed' && <MessageFlagReaded />}
    </span>
  );
};

export default ChatItemStatus;
