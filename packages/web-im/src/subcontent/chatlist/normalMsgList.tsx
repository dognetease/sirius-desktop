import React, { useContext, useEffect, useRef, useState, WheelEventHandler, useMemo } from 'react';
import classnames from 'classnames/bind';
import { IMMessage, Session, MailListRes } from 'api';
import debounce from 'lodash/debounce';
import lodashGet from 'lodash/get';
import { useEventCallback } from 'rxjs-hooks';
import { throttleTime, tap, bufferToggle, map } from 'rxjs/operators';
import { Observable, timer } from 'rxjs';
import { useLocation } from '@reach/router';
import { Context as MessageContext } from '../store/messageProvider';
import styles from '../imChatList.module.scss';
import { MsgReceiptContext } from '../store/msgReceipts';
import { NewmsgMarkline } from '../msglines/newmsgMarkline';
import { BottomlineManager } from '../msglines/bottomline';
import { MsgUnreadAnchor } from '../msglines/unreadAnchor';
import { UnreadMsgLine } from '../msglines/unreadLine';
import { CurrentMsgLine } from '../msglines/currentMsgLine';
import { Context as CurrentIdClientContext } from '../store/currentIdClientProvider';
import { CurSessionContext } from '../store/currentSessioProvider';
import { PureMsgList } from './pureMsgList';
import { getParams } from '../../common/navigate';
import { Context as StatisticsRenderContext } from '../../store/list/saveDraftBeforeDestroy';
import { ReplyMsgContext } from '../store/replingMsg';
import { TeamInternalMailBtn } from './TeamInternalMailBtn';
import { RecentShareMail } from './recentShareMail';

const realStyle = classnames.bind(styles);

function getHistoryUnreadList<T = string>(session: Session, list: IMMessage[], mapFunc: (msg: IMMessage) => T): T[] {
  if (!lodashGet(session, 'unread', 0)) {
    return [];
  }

  const needReadList = list.filter(msg => msg.flow === 'in' && msg.time <= lodashGet(session, 'lastMsg.time', 0)).map(mapFunc);
  return needReadList.length > session.unread ? needReadList.splice(-session.unread) : [];
}

function getHistoryUnreadIdClientList(session: Session, list: IMMessage[]) {
  return getHistoryUnreadList(session, list, msg => msg.idClient);
}

interface ChatCommonHistoryApi {
  sessionId: string;
  teamType?: string;
  total?: number; // 邮件列表数量
  list?: MailListRes['msgs']; // 邮件列表
  isAdmin?: boolean;
  isOwner?: boolean;
}

export interface ScrollIntoViewOptions {
  behavior: 'auto' | 'smooth';
  block: 'start' | 'center' | 'end' | 'nearest';
  inline: 'start' | 'center' | 'end' | 'nearest';
}

// 常规消息列表
export const NormalChatList: React.FC<ChatCommonHistoryApi> = props => {
  const { sessionId, teamType, total, list, isAdmin = false, isOwner = false } = props;
  const isDiscuss = teamType === 'discuss';
  const { firstFrameSession } = useContext(CurSessionContext);
  const { getMoreMsgs, state: MessageState } = useContext(MessageContext);
  // 历史消息是否处于加载中
  const [loading, setLoading] = useState<boolean>(false);
  // 是否所有历史消息均已加载完成
  const [loadEnd, setLoadEnd] = useState<boolean>(false);
  const location = useLocation();

  // 获取是否处于回复内容状态
  const { replyMsg } = useContext(ReplyMsgContext);
  // 邮件讨论在有顶部最近邮件时上间距要增加
  const [specialPadding, setSpecialPadding] = useState<boolean>(false);

  // 设置当前会话
  const { setSessionId: setCurrSessionId } = useContext(MsgReceiptContext);
  useEffect(() => {
    setCurrSessionId(sessionId);
  }, []);

  const wrapperRef = useRef<HTMLDivElement>(null);
  // 设置当前消息ID(这里使用Context是因为需要在msglist不更新的情况下更新children.需要借助useContext)
  const { setCurrentIdClient } = useContext(CurrentIdClientContext);

  // 向上请求历史消息
  const requestPrevMsgs = async (limit = 30, msg: IMMessage) => {
    const wrapperNode = wrapperRef.current as unknown as HTMLDivElement;
    const firstMsgNode = wrapperNode.childNodes[2];
    getMoreMsgs(
      {
        sessionId,
        end: msg.time,
        limit,
        desc: true,
      },
      true
    )
      .then(resultList => {
        // 最后一页加载完成
        if ((resultList || []).length === 0) {
          setLoadEnd(true);
        }
      })
      .finally(() => {
        firstMsgNode.scrollIntoView();
        setLoading(false);
      });
    // 从后往前找 第一条消息是时间最新的消息
    setCurrentIdClient(msg.idClient);
  };
  // 滚动到顶部之后加载新消息
  const onscroll = debounce(() => {
    const wrapperNode = wrapperRef.current as unknown as HTMLDivElement;

    if (!wrapperNode || loadEnd) {
      return;
    }
    if ((wrapperRef.current as unknown as HTMLDivElement).scrollTop === 0 && !loading) {
      setLoading(true);
      requestPrevMsgs(30, MessageState.msgList[0]);
    }
  }, 20);

  // 常量数据 不需要响应式
  const [CURRENT_SESSION, setCurrentSession] = useState<Session>({} as Session);
  useEffect(() => {
    if (lodashGet(firstFrameSession, 'id.length', 0) === 0) {
      return;
    }
    setCurrentSession(firstFrameSession);
  }, [lodashGet(firstFrameSession, 'id.length', 0)]);
  // 请求消息列表
  useEffect(() => {
    if (lodashGet(CURRENT_SESSION, 'id.length', 0) === 0) {
      return;
    }
    getMoreMsgs(
      {
        sessionId,
        end: Infinity,
        limit: Math.max(30, lodashGet(CURRENT_SESSION, 'unread', 30)),
      },
      true
    );
  }, [lodashGet(CURRENT_SESSION, 'id.length', 0)]);

  const [unreadMsgStartTime, setUnreadMsgStartTime] = useState(Infinity);

  const [intersectionInstance, setIntersectionInstance] = useState<null | IntersectionObserver>(null);

  const [entryCallback, entries] = useEventCallback(($event: Observable<IntersectionObserverEntry[]>) => {
    const $bufferToggle = $event.pipe(throttleTime(20));
    const $bufferEvents = $event.pipe(
      tap(entries => {
        // 先将所有的entries全部卸载 避免重复触发
        entries
          .filter(entry => entry.intersectionRatio > 0 && entry.target.hasAttribute('data-watchonce'))
          .forEach(entry => {
            intersectionInstance?.unobserve(entry.target);
          });
      }),
      bufferToggle($bufferToggle, () => timer(20)),
      map(args => args.reduce((total, current) => [...total, ...current], [] as IntersectionObserverEntry[]))
    );
    return $bufferEvents;
  }, []);

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
  const [pureMsgVisible, setPureMsgVisible] = useState(false);
  const [cancelWatchBottom, setCancelWatchBottom] = useState(false);
  const onWheel: WheelEventHandler<HTMLDivElement> = e => {
    if (e.deltaY > 0) {
      return;
    }
    setCancelWatchBottom(true);
  };

  // 目前总有场景消息加载完成但是visible没有办法set成true。这个是一个兜底方案
  const hasMsgs = useMemo(() => MessageState.msgList.length !== 0, [MessageState.msgList.length]);
  useEffect(() => {
    if (!hasMsgs) {
      return;
    }
    let tid = setTimeout(() => {
      setPureMsgVisible(true);
    }, 1000);
    return () => {
      if (tid) {
        clearTimeout(tid);
      }
    };
  }, [hasMsgs]);

  // 统计当前会话完成渲染时长
  const { setRenderCompleteTime } = useContext(StatisticsRenderContext);
  useEffect(() => {
    pureMsgVisible && setRenderCompleteTime(new Date().getTime());
  }, [pureMsgVisible]);

  // 最后一条消息ID
  const lastMsgIdClient = useMemo(() => {
    const { msgList } = MessageState;
    return lodashGet(msgList, `${msgList.length - 1}.idClient`, '');
  }, [MessageState.msgList]);
  const bottomlineRef = useRef<{
    go2Bottom(): void;
  }>(null);

  // 如果是自己发送的最后一条消息
  useEffect(() => {
    if (!MessageState.msgList.length) {
      return;
    }
    const { msgList } = MessageState;
    const lastMsg = msgList[msgList.length - 1];
    if (lastMsg.flow === 'out' || !cancelWatchBottom) {
      setTimeout(() => {
        bottomlineRef.current && bottomlineRef.current!.go2Bottom();
      }, 20);
    }
  }, [lastMsgIdClient]);

  // 新增的未读消息列表(进入会话之后接受到的不可视的消息列表)
  const newIncreasedUnreadMsgList: string[] = useMemo(
    () => MessageState.msgList.filter(item => item.time > unreadMsgStartTime && item.flow === 'in').map(item => item.idClient),
    [MessageState.msgList]
  );

  // 获取未读消息开始的IDClient(根据msglist和unreadMsgStartTime交叉运算)
  const startUnreadIdClient = useMemo(() => {
    if (!MessageState.msgList.length) {
      return '';
    }
    const { msgList } = MessageState;
    if (unreadMsgStartTime === Number.POSITIVE_INFINITY) {
      const historyList = getHistoryUnreadList(CURRENT_SESSION, msgList, msg => msg);
      const historyLastIdClient = lodashGet(historyList, `[${historyList.length - 1}].idClient`, 'historyIdClient');
      const curLastIdClient = lodashGet(msgList, `[${msgList.length - 1}].idClient`, 'curLastIdClient');
      // 如果一致 表示没有新接受到的消息 设置历史未读(从session.unread中拉倒的)消息第一条为新消息开始时间
      if (historyLastIdClient === curLastIdClient) {
        return lodashGet(historyList, '[0].idClient', 'historyStartIdClient');
      }
      return 'none';
    }
    const curUnreadMsgList = msgList.filter(item => item.time > unreadMsgStartTime).filter(item => item.flow === 'in' && item?.subType !== 1002);
    return lodashGet(curUnreadMsgList, '[0].idClient', 'curUnreadidClient');
  }, [
    lodashGet(MessageState, 'msgList[0].idClient', ''),
    lodashGet(MessageState, `msgList[${MessageState.msgList.length - 1}].idClient`, ''),
    lodashGet(MessageState, `msgList[${MessageState.msgList.length - 1}].subType`, ''),
  ]);

  return (
    <div className={realStyle('mainChat')} id="mainChat">
      {isDiscuss && <RecentShareMail teamId={sessionId.replace('team-', '')} setSpecialPadding={setSpecialPadding} />}
      <div
        ref={wrapperRef}
        className={realStyle('mainChatInner', {
          visible: pureMsgVisible,
          mailDiscussion: isDiscuss, // 邮件讨论样式
          mailDiscussionPadding: specialPadding,
        })}
        data-test-id="im_session_content_scroll_wrap"
        onScroll={onscroll}
        onWheel={onWheel}
      >
        {loading && (
          <div className={realStyle('loadingMoreWrapper')} data-test-id="im_session_content_loadingmoreicon">
            <span className={realStyle('loadingMoreIcon')} />
          </div>
        )}
        {MessageState.msgList.length ? (
          <PureMsgList>
            {(item: { msg: IMMessage; [key: string]: any }) => {
              const { msg } = item;
              return (
                <>
                  {/* 滚动到当前这条消息 */}
                  <CurrentMsgLine idClient={msg.idClient} />

                  {/* 新消息标志线(如果没有有新来消息的话就默认为当前unread消息中第一条) */}
                  <NewmsgMarkline visible={startUnreadIdClient === msg.idClient} />

                  {/* 未读消息 */}
                  <UnreadMsgLine msg={msg} intersection={intersectionInstance as IntersectionObserver} />
                </>
              );
            }}
          </PureMsgList>
        ) : null}
        {MessageState.msgList.length && getParams(location.hash, 'hiddenanchor') !== '1' ? (
          <BottomlineManager
            ref={bottomlineRef}
            msgList={MessageState.msgList}
            cancelWatch={cancelWatchBottom}
            updateEntry={(visible, msglist, canceledWatch) => {
              /**
               * 如果底线可见:
               * 重新恢复观察
               * 列表可见(避免抖动)
               * 未读消息时间Infinity
               * 如果底部线不可见&用户自己手动翻上去-onwheel/anchor:
               * 设置当前最后一条消息未未读消息起始线
               */
              if (visible) {
                setPureMsgVisible(true);
                setCancelWatchBottom(false);
                // setUnreadMsgStartTime(Infinity);
              } else if (canceledWatch) {
                const lastMsgTime = lodashGet(msglist, `${msglist.length - 1}.time`, Infinity);
                setUnreadMsgStartTime(lastMsgTime);
              } else if (bottomlineRef.current) {
                bottomlineRef.current?.go2Bottom();
              }
            }}
          />
        ) : null}
      </div>

      {/* 群内邮件button，需要加外层的wrapper，防止透明穿透 */}
      {isDiscuss && replyMsg == null && (
        <TeamInternalMailBtn
          needDelete={
            isAdmin || isOwner // 回复状态不能展示该按钮
          }
          teamId={sessionId.split('-')[1] ?? ''}
          total={total}
          list={list}
        />
      )}

      {/* 向上查看最新未读消息 */}
      {MessageState.msgList.length ? (
        <MsgUnreadAnchor
          checkIdClientList={getHistoryUnreadIdClientList(CURRENT_SESSION, MessageState.msgList)}
          entries={entries}
          // 当用户向上滚动或者有新增的未读消息的时候 历史未读全部忽略
          ignoreReadedIdClientList={cancelWatchBottom || newIncreasedUnreadMsgList.length ? getHistoryUnreadIdClientList(CURRENT_SESSION, MessageState.msgList) : []}
          scroll2AnchorPoint={idList => {
            const idClient = idList[0];
            // 清空待监听列表
            setCurrentSession(state => {
              const data = { ...state };
              data.unread = 0;
              return data;
            });
            setCancelWatchBottom(true);
            window.requestAnimationFrame(() => {
              setCurrentIdClient(idClient);
            });
          }}
          direction="up"
        />
      ) : null}

      {/* 向下查看最新未读消息 */}
      {sessionId.indexOf('lx_') !== -1 ? null : (
        <MsgUnreadAnchor
          checkIdClientList={newIncreasedUnreadMsgList}
          entries={entries}
          scroll2AnchorPoint={idList => {
            const idClient = idList[idList.length - 1];
            setCurrentIdClient(idClient);
          }}
          direction="down"
        />
      )}
    </div>
  );
};
