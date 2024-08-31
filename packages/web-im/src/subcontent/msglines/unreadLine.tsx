import React, { useRef, useEffect, useState, useContext } from 'react';
import classnames from 'classnames/bind';
import { IMMessage, apiHolder, NIMApi } from 'api';
import style from './line.module.scss';
import { CurSessionContext } from '../store/currentSessioProvider';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
const realStyle = classnames.bind(style);

interface UnreadMsgLineApi {
  msg: IMMessage;
  intersection: IntersectionObserver;
}
// 当前可视窗口前的未读消息
export const UnreadTeamMsgLine: React.FC<UnreadMsgLineApi> = props => {
  const { msg, intersection } = props;
  const lineRef = useRef<HTMLParagraphElement>(null);

  const [isUnread] = useState(() => {
    if (msg.flow === 'out') {
      return false;
    }

    if (msg.scene === 'team' && msg.hasRead !== true) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    const lineNode = lineRef.current as unknown as HTMLParagraphElement;
    if (msg.flow === 'out' || !lineNode) {
      return;
    }
    intersection.observe(lineRef.current as unknown as HTMLParagraphElement);
  }, []);
  if (!isUnread) {
    return null;
  }
  /**
   * 为什么要加data-watchonce
   * 是因为这个节点被observe之后要取消observe
   * 但是因为这个component被插入到pureMsgList中
   * pureMsglist使用了useMemo([msglist])
   * 所以entry变化之后没有办法监听.
   * 使用data-watchonce数据允许最外层的intersection实例手动的去unobserve它
   * data-uidclient同理
   */
  return <p ref={lineRef} data-watchonce="visible" data-uidclient={msg.idClient} className={realStyle('unreadMsglineMark')} />;
};

export const UnreadP2PMsgLine: React.FC<UnreadMsgLineApi> = props => {
  const { msg, intersection } = props;
  const { getMsgReceiptTime } = useContext(CurSessionContext);
  const [isUnread] = useState(() => {
    const msgReceiptTime = getMsgReceiptTime();
    return msg.time > msgReceiptTime && msg.flow === 'in';
  });
  const lineRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const lineNode = lineRef.current as unknown as HTMLParagraphElement;
    if (msg.flow === 'out' || !lineNode) {
      return;
    }
    intersection.observe(lineRef.current as unknown as HTMLParagraphElement);
  }, []);
  if (!isUnread) {
    return null;
  }
  return <p ref={lineRef} data-watchonce="visible" data-uidclient={msg.idClient} className={realStyle('unreadMsglineMark')} />;
};

export const UnreadMsgLine: React.FC<UnreadMsgLineApi> = props => {
  const { msg } = props;
  return msg.scene === 'p2p' ? <UnreadP2PMsgLine {...props} /> : <UnreadTeamMsgLine {...props} />;
};
