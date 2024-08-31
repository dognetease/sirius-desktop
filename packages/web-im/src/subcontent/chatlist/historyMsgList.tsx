import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import classnames from 'classnames/bind';
import { apiHolder, IMMessage, NIMApi, MailListRes } from 'api';
import debounce from 'lodash/debounce';
import lodashGet from 'lodash/get';
import { useObservable, useEventCallback } from 'rxjs-hooks';
import { filter, fromEventPattern, map, Observable, take, withLatestFrom, mapTo, switchMap, race } from 'rxjs';
import { useLocation } from '@reach/router';
import styles from '../imChatList.module.scss';
import { Context as MessageContext } from '../store/messageProvider';
import { PureMsgList } from './pureMsgList';
import { CurrentMsgLine, ScrollIntoViewOptions } from '../msglines/currentMsgLine';
import { Context as CurrentIdClientContext } from '../store/currentIdClientProvider';
import { UnreadCountAnchor } from '../msglines/unreadAnchor';
import { openSession, getParams } from '../../common/navigate';
import { ReplyMsgContext } from '../store/replingMsg';
import { TeamInternalMailBtn } from './TeamInternalMailBtn';
import { RecentShareMail } from './recentShareMail';

const realStyle = classnames.bind(styles);

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

interface ChatCommonHistoryApi {
  sessionId: string;
  idClient?: string;
  teamType?: string;
  total?: number; // 邮件列表数量
  list?: MailListRes['msgs']; // 邮件列表
  isAdmin?: boolean;
  isOwner?: boolean;
}

export const HistoryChatlist: React.FC<ChatCommonHistoryApi> = props => {
  const { sessionId, idClient: recordIdClient, teamType, total, list, isAdmin = false, isOwner = false } = props;
  const isDiscuss = teamType === 'discuss';
  const { getMoreMsgs, state: MessageState } = useContext(MessageContext);
  const [loadComplete, setLoadComplete] = useState<boolean>(false);
  // 历史消息是否处于加载中
  const [uploading, setUploading] = useState<boolean>(false);
  // 是否所有历史消息均已加载完成
  const [upLoadEnd, setUpLoadEnd] = useState<boolean>(false);
  // 新消息是否处于加载中
  const [downloading, setDownloading] = useState<boolean>(false);
  // 是否所有新消息均已加载完成
  const [downLoadEnd, setDownLoadEnd] = useState<boolean>(false);
  // 获取是否处于回复内容状态
  const { replyMsg } = useContext(ReplyMsgContext);
  // 邮件讨论在有顶部最近邮件时上间距要增加
  const [specialPadding, setSpecialPadding] = useState<boolean>(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrollIntoViewOption, setScrollIntoViewOption] = useState<ScrollIntoViewOptions>({
    behavior: 'smooth',
    block: 'center',
  });

  const location = useLocation();

  // 设置当前消息ID(当前消息ID一直都可视)
  // 请求更多消息
  const { setCurrentIdClient } = useContext(CurrentIdClientContext);
  useEffect(() => {
    setCurrentIdClient(`${recordIdClient as string}-high`);
  }, []);

  // 在页面滚动和拉取新消息时，新id与当前id比较，不同再set
  const setCurrentId = (newIdClient: string) => {
    if (recordIdClient === newIdClient) {
      return;
    }
    setCurrentIdClient(newIdClient);
  };

  const requestMoreMsgs = async (direction: 'up' | 'down', msg: IMMessage) => {
    const wrapperNode = wrapperRef.current as unknown as HTMLDivElement;
    const firstMsgNode = wrapperNode.childNodes[2];
    const limit = 30;
    if (direction === 'up') {
      const list = await getMoreMsgs(
        {
          sessionId,
          end: msg.time,
          limit,
          desc: true,
        },
        true
      );
      setUploading(false);
      setCurrentId(lodashGet(list, '[0].idClient', msg.idClient));
      setScrollIntoViewOption(true);
      const timer = setTimeout(() => {
        firstMsgNode.scrollIntoView();
        clearTimeout(timer);
      }, 100);
      if ((list || []).length === 0) {
        setUpLoadEnd(true);
      }
    } else {
      const list = await getMoreMsgs(
        {
          sessionId,
          // 从start开始查
          desc: false,
          start: msg.time,
          limit,
        },
        false
      );
      setCurrentId(lodashGet(list, '[0].idClient', msg.idClient));
      setScrollIntoViewOption(false);
      setDownloading(false);
      if ((list || []).length === 0) {
        setDownLoadEnd(true);
      }
    }
  };

  const initMsglist = async () => {
    // 获取idClient对应的本地消息
    const msgTime = getParams(location.hash, 'msgTime');
    if (typeof msgTime !== 'string' || !/^\d+$/.test(msgTime)) {
      return;
    }
    // 从当前消息的时间向前查21条，从当前消息向后查21条
    Promise.all(
      [
        {
          sessionId,
          desc: false,
          start: Number(msgTime) - 1,
          limit: 21,
        },
        {
          sessionId,
          desc: true,
          end: Number(msgTime) + 1,
          limit: 21,
        },
      ].map(option => getMoreMsgs(option, true))
    )
      .then(() => {
        setLoadComplete(!loadComplete);
      })
      .catch(() => {
        setLoadComplete(!loadComplete);
      });
  };

  useEffect(() => {
    initMsglist();
  }, []);

  const onscroll = debounce(async e => {
    const wrapperNode = wrapperRef.current as unknown as HTMLElement;
    const { msgList } = MessageState;
    if (!wrapperNode) {
      return;
    }

    if (wrapperNode.scrollTop === 0 && !uploading && !upLoadEnd) {
      const endMsg = msgList[0];
      setUploading(true);
      requestMoreMsgs('up', endMsg);
      setCurrentId(endMsg.idClient);
    } else if (wrapperNode.scrollHeight - wrapperNode.scrollTop === wrapperNode.clientHeight && !downloading && !downLoadEnd) {
      const startMsg = msgList[msgList.length - 1];
      setDownloading(true);
      requestMoreMsgs('down', startMsg);
      setCurrentId(startMsg.idClient);
    }
  }, 20);
  const entryCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries
      .filter(entry => entry.intersectionRatio > 0 && entry.target.hasAttribute('data-watchonce'))
      .forEach(entry => {
        intersectionInstance?.unobserve(entry.target);
      });
  }, []);
  const [intersectionInstance, setIntersectionInstance] = useState<IntersectionObserver | null>(null);

  useEffect(() => {
    const $instance = new IntersectionObserver(entryCallback, {
      root: wrapperRef.current,
    });
    setIntersectionInstance($instance);
    return () => {
      $instance.disconnect();
      setIntersectionInstance(null);
    };
  }, []);

  const go2NormalChat = () => {
    openSession({
      mode: 'normal',
      sessionId,
      hideanchor: '1',
    });
  };

  const hasNewMsg = useObservable(
    (_, $props) => {
      const onmsg = handler => {
        nimApi.subscrible('onmsg', handler);
      };
      const offmsg = handler => {
        nimApi.unSubcrible('onmsg', handler);
      };
      const $sessionId = $props.pipe(map(([id]) => id));
      const $onmsg = fromEventPattern(onmsg, offmsg) as Observable<IMMessage>;
      return $onmsg.pipe(
        withLatestFrom($sessionId),
        filter(([msg, id]) => msg.sessionId === id),
        take(1),
        mapTo(true)
      );
    },
    false,
    [sessionId]
  );

  const unreadCount = useObservable(
    (_, $props) => {
      const $flag = $props.pipe(map(([flag]) => flag));
      const $params = $props.pipe(map(([, ...args]) => args));
      return $flag.pipe(
        filter(flag => flag),
        switchMap(() => nimApi.sessionStream.getSessionField($params) as Observable<number>)
      );
    },
    0,
    [hasNewMsg, sessionId, 'unread']
  );

  const [pureMsgVisible, setPureMsgVisible] = useState(false);
  return (
    <div className={realStyle('mainChat')}>
      {isDiscuss && <RecentShareMail teamId={sessionId.replace('team-', '')} setSpecialPadding={setSpecialPadding} />}
      <div
        ref={wrapperRef}
        className={realStyle('mainChatInner', {
          visible: pureMsgVisible,
          mailDiscussion: isDiscuss, // 邮件讨论样式
          mailDiscussionPadding: specialPadding,
        })}
        onScroll={onscroll}
      >
        {uploading && (
          <div className={realStyle('loadingMoreWrapper')}>
            <span className={realStyle('loadingMoreIcon')} />
          </div>
        )}
        <PureMsgList>
          {(params: { msglist: IMMessage[]; index: number }) => {
            const { msglist, index } = params;
            const msg = msglist[index];
            return (
              <CurrentMsgLine
                toggleVisible={flag => {
                  setPureMsgVisible(flag);
                }}
                loadComplete={loadComplete}
                idClient={msg.idClient}
                scrollIntoViewOption={scrollIntoViewOption}
              />
            );
          }}
        </PureMsgList>
        {downloading && (
          <div className={realStyle('loadingMoreWrapper')}>
            <span className={realStyle('loadingMoreIcon')} />
          </div>
        )}
        {/* 未读消息Anchor */}
        {unreadCount ? <UnreadCountAnchor classnames={realStyle('historyUnreadAnchor')} count={unreadCount} onClick={go2NormalChat} /> : null}

        {/* 群内邮件button，需要加外层的wrapper，防止透明穿透 */}
        {isDiscuss &&
          replyMsg == null && ( // 回复状态不能展示该按钮
            <TeamInternalMailBtn needDelete={isAdmin || isOwner} total={total} list={list} teamId={sessionId.split('-')[1] ?? ''} />
          )}
      </div>
    </div>
  );
};
