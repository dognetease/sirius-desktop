import React, { useEffect, useState, useMemo } from 'react';
import classnames from 'classnames/bind';
import style from './line.module.scss';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(style);
const ArrowUp = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 8L8 3.5L3 8" stroke="#386EE7" strokeWidth="1.25" strokeLinejoin="round" />
    <path d="M13 12.5L8 8L3 12.5" stroke="#386EE7" strokeWidth="1.25" strokeLinejoin="round" />
  </svg>
);
const ArrowDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8L8 12.5L13 8" stroke="#386EE7" strokeWidth="1.25" strokeLinejoin="round" />
    <path d="M3 3.5L8 8L13 3.5" stroke="#386EE7" strokeWidth="1.25" strokeLinejoin="round" />
  </svg>
);
export const UnreadCountAnchor: React.FC<{
  count: number;
  classnames: string;
  [key: string]: any;
}> = props => {
  const { count, classnames, ...restProps } = props;
  return (
    <p {...restProps} className={realStyle('msgAnchorPoint', 'arrow-down', classnames)}>
      <ArrowDown />
      <span className={realStyle('text')}>
        {count > 999 ? '999+' : count}
        {getIn18Text('TIAOXINXIAOXI')}
      </span>
    </p>
  );
};
interface MsgUnreadAnchorApi {
  entries: IntersectionObserverEntry[];
  checkIdClientList: string[];
  scroll2AnchorPoint(idList: string[]): void;
  ignoreReadedIdClientList?: string[];
  direction?: 'up' | 'down';
}
export const MsgUnreadAnchor: React.FC<MsgUnreadAnchorApi> = props => {
  const { entries, checkIdClientList, direction = 'down', ignoreReadedIdClientList = [], scroll2AnchorPoint } = props;
  const [anchorVisible, setAnchorVisible] = useState(true);
  const [readedIdClientList, setReadedIdclientList] = useState<string[]>([]);
  // 当新消息mark可见的时候 锚点消失
  useEffect(() => {
    const readedList = entries
      .filter(item => item.target.hasAttribute('data-uidclient') && item.intersectionRatio > 0)
      .map(item => item.target.getAttribute('data-uidclient') as string);
    setReadedIdclientList(args => {
      const state = [...args];
      return [...readedList.filter(idClient => !state.includes(idClient)), ...state];
    });
  }, [entries]);
  // 忽略某条消息(强制判断他为已读)
  useEffect(() => {
    if (!ignoreReadedIdClientList.length) {
      return;
    }
    setReadedIdclientList(args => {
      const _state = [...args, ...ignoreReadedIdClientList];
      return [...new Set(_state)];
    });
  }, [ignoreReadedIdClientList]);
  const unreadCount = useMemo(() => {
    if (!checkIdClientList.length) {
      return 0;
    }
    const needReadIdClient = direction === 'up' ? checkIdClientList[0] : checkIdClientList[checkIdClientList.length - 1];
    return readedIdClientList.includes(needReadIdClient) ? 0 : checkIdClientList.length;
  }, [readedIdClientList, checkIdClientList, direction]);
  // 观察未读数 如果未读数量===0立即消失。如果!==0延迟展示()
  useEffect(() => {
    if (unreadCount === 0) {
      setAnchorVisible(false);
      return;
    }
    const $t = setTimeout(() => {
      setAnchorVisible(true);
    }, 300);
    return () => {
      clearTimeout($t);
    };
  }, [unreadCount]);
  // 滚动到新消息位置
  const go2anchorPoint = () => {
    scroll2AnchorPoint(checkIdClientList);
  };
  return (
    <p
      onClick={go2anchorPoint}
      className={realStyle('msgAnchorPoint', `arrow-${direction}`, {
        visible: anchorVisible,
      })}
    >
      {direction === 'up' ? <ArrowUp /> : <ArrowDown />}
      <span className={realStyle('text')}>
        {unreadCount > 999 ? '999+' : unreadCount}
        {getIn18Text('TIAOXINXIAOXI')}
      </span>
    </p>
  );
};
