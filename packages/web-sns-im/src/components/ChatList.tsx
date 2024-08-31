import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import classnames from 'classnames';
import { getIn18Text } from 'api';
import Avatar from '../components/Avatar';
import { commonDateUnitFormat } from '@web-common/utils/commonDateUnitFormat';
import { SnsImChat, SnsImMessage } from '@web-sns-im';
import { getMessageText } from '../utils';
import { ReactComponent as LoadingIcon } from '../icons/loading.svg';
import { BackToTopNewIcon } from '@web-common/components/UI/Icons/icons';
import ChatListEmpty from '../icons/chat-list-empty.png';
import style from './ChatList.module.scss';

const CHAT_LOADING_HEIGHT = 50;

export interface ChatListProps<C = any, M = any> {
  className?: string;
  style?: React.CSSProperties;
  chatId: string | null;
  chatList: SnsImChat[];
  chatIniting: boolean;
  showBackTop?: boolean;
  bottomHasMore?: boolean;
  bottomLoading?: boolean;
  topHasMore?: boolean;
  topLoading?: boolean;
  chatListEmptyTitle?: string;
  chatListEmptyTip?: string;
  renderChat?: (chat: SnsImChat<C, M>) => React.ReactChild;
  renderChatListEmpty?: () => React.ReactChild;
  customMessageText?: (message: SnsImMessage<M>) => string;
  onChange: (chatId: string) => void;
  onItemClick?: (chatId: string) => void;
  onScrollToBottom?: () => void;
  onScrollToTop?: () => void;
  onBackTop?: () => void;
}

export const ChatList = forwardRef((props: ChatListProps, ref) => {
  const {
    className,
    style: styleFromProps,
    chatId,
    chatList,
    chatIniting,
    showBackTop,
    bottomHasMore,
    bottomLoading,
    topHasMore,
    topLoading,
    chatListEmptyTitle,
    chatListEmptyTip,
    renderChat,
    renderChatListEmpty,
    customMessageText,
    onChange,
    onItemClick,
    onScrollToBottom,
    onScrollToTop,
    onBackTop,
  } = props;

  const [backTopVisible, setBackTopVisible] = useState<boolean>(false);
  const [redPointVisible, setRedPointVisible] = useState<boolean>(false);
  const [scrollChatId, setScrollChatId] = useState<string | null>(null);
  const scrollChatRef = useRef<HTMLDivElement | null>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const lastScrollHeightRef = useRef<number>(0);
  const lastChatListRef = useRef<SnsImChat[]>([]);

  useImperativeHandle(ref, () => ({
    scrollToChat: (chatId: string, scrollArgs?: any) => {
      setScrollChatId(chatId);
      setTimeout(() => {
        if (scrollChatRef.current) {
          scrollChatRef.current?.scrollIntoView(
            scrollArgs || {
              block: 'center',
              behavior: 'instant',
            }
          );
        }
        setScrollChatId(null);
      });
    },
    setRedPointVisible,
  }));

  const handleScroll: React.UIEventHandler<HTMLDivElement> = event => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

    lastScrollHeightRef.current = scrollHeight;

    if (clientHeight === scrollHeight - scrollTop && chatList.length && bottomHasMore && !bottomLoading) {
      onScrollToBottom && onScrollToBottom();
    }
    if (scrollTop === 0 && chatList.length && topHasMore && !topLoading) {
      onScrollToTop && onScrollToTop();
    }
    setBackTopVisible(scrollTop > 100);
  };

  useEffect(() => {
    if (scrollWrapperRef.current) {
      // 数量增加，判断增加方向
      if (chatList.length > lastChatListRef.current.length) {
        const newerChat = chatList[0];
        const lastNewerChat = lastChatListRef.current[0];

        if (newerChat && lastNewerChat) {
          // 插入了新的会话
          if (newerChat.chatTime > lastNewerChat.chatTime) {
            const { scrollHeight } = scrollWrapperRef.current;
            scrollWrapperRef.current.scrollTop = scrollHeight - lastScrollHeightRef.current - CHAT_LOADING_HEIGHT;
          }
        }
      }
    }

    lastChatListRef.current = chatList;
  }, [chatList]);

  return (
    <div className={classnames(style.chatListContainer, className)} style={styleFromProps}>
      {chatIniting ? (
        <div className={style.initingWrapper}>
          <LoadingIcon className={style.loadingIcon} />
        </div>
      ) : !chatList.length ? (
        <div className={style.emptyWrapper}>
          {renderChatListEmpty ? (
            renderChatListEmpty()
          ) : (
            <div className={style.empty}>
              <img className={style.emptyImage} src={ChatListEmpty} />
              <div className={style.emptyTitle}>{chatListEmptyTitle || getIn18Text('ZANWUSHUJU')}</div>
              <div className={style.emptyTip}>{chatListEmptyTip || getIn18Text('chatListEmptyTip')}</div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className={style.chatListWrapper} ref={scrollWrapperRef} onScroll={handleScroll}>
            {topLoading && (
              <div className={style.topLoading} style={{ height: CHAT_LOADING_HEIGHT }}>
                <LoadingIcon className={style.loadingIcon} />
              </div>
            )}
            <div className={style.chatList}>
              {chatList.map((chat, index) => {
                const active = chat.chatId === chatId;
                let messageText = '';

                if (chat.latestMessage) {
                  if (customMessageText) {
                    messageText = customMessageText(chat.latestMessage);
                  } else {
                    messageText = getMessageText(chat.latestMessage);
                  }
                }

                return (
                  <div
                    className={classnames(style.chat, {
                      [style.active]: active,
                    })}
                    key={chat.chatId}
                    ref={chat.chatId === scrollChatId ? scrollChatRef : null}
                    onClick={() => {
                      !active && onChange(chat.chatId);
                      onItemClick && onItemClick(chat.chatId);
                    }}
                  >
                    {renderChat ? (
                      renderChat(chat)
                    ) : (
                      <>
                        <div className={style.avatar}>
                          {!chat.contactAvatar || typeof chat.contactAvatar === 'string' ? (
                            <Avatar avatar={(chat.contactAvatar || '') as string} size={36} platform={chat.platform} />
                          ) : (
                            chat.contactAvatar
                          )}
                        </div>
                        <div className={style.content}>
                          <div className={style.header}>
                            <div className={classnames(style.contactName, style.ellipsis)}>{chat.contactName}</div>
                            <div className={style.chatTime}>{commonDateUnitFormat(chat.chatTime, 'precise')}</div>
                          </div>
                          <div className={style.body}>
                            <div className={classnames(style.message, style.ellipsis)}>{messageText}</div>
                            {!!chat.unreadCount && <div className={style.unreadCount}>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</div>}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            {bottomLoading && (
              <div className={style.bottomLoading} style={{ height: CHAT_LOADING_HEIGHT }}>
                <LoadingIcon className={style.loadingIcon} />
              </div>
            )}
          </div>
          {showBackTop && backTopVisible && (
            <BackToTopNewIcon
              className={classnames(style.backTop, {
                [style.redPoint]: redPointVisible,
              })}
              onClick={onBackTop}
            />
          )}
        </>
      )}
    </div>
  );
});

export interface ChatListMethods {
  scrollToChat: (chatId: string, scrollArgs?: any) => void;
  setRedPointVisible: (visible: boolean) => void;
}
