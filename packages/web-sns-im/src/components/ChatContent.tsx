import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { getIn18Text } from 'api';
import classnames from 'classnames';
import { SnsImRules, SnsImChat, SnsImChatContent, SnsImMessage } from '../types';
import Avatar from '../components/Avatar';
import { ChatEditor, ChatEditorMethods } from './ChatEditor';
import { Message } from './Message';
import { ReactComponent as LoadingIcon } from '../icons/loading.svg';
import ChatContentEmpty from '../icons/chat-content-empty.png';
import style from './ChatContent.module.scss';

const MESSAGE_LOADING_HEIGHT = 50;

export interface ChatContentProps<C = any, M = any> {
  className?: string;
  style?: React.CSSProperties;
  chat?: SnsImChat<C, M> | null;
  chatContent?: SnsImChatContent | null;
  rules: SnsImRules;
  extraContent?: React.ReactChild | null;
  editorDisabled?: boolean;
  editorTimeExceeded?: boolean;
  sidebarContent?: React.ReactChild | null;
  chatContentEmptyTitle?: string;
  chatContentEmptyTip?: string;
  renderChatPlaceholder?: (chat: SnsImChat<C, M>) => string;
  renderChatContentEmpty?: () => React.ReactChild;
  renderMessage?: (message: SnsImMessage<M>) => React.ReactChild;
  onScrollToTop: (chat: SnsImChat) => void;
  onFileSend: (chat: SnsImChat, file: File) => void;
  onTextSend: (chat: SnsImChat, text: string) => void;
}

export const ChatContent: React.FC<ChatContentProps> = props => {
  const {
    className,
    style: styleFromProps,
    chat,
    chatContent,
    rules,
    extraContent,
    editorDisabled,
    editorTimeExceeded,
    sidebarContent,
    chatContentEmptyTitle,
    chatContentEmptyTip,
    renderChatPlaceholder,
    renderChatContentEmpty,
    renderMessage,
    onScrollToTop,
    onFileSend,
    onTextSend,
  } = props;

  const lastScrollHeightRef = useRef<number>(0);
  const lastMessageListRef = useRef<SnsImMessage[]>([]);
  const lastChatRef = useRef<SnsImChat | null>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const chatEditorRef = useRef<ChatEditorMethods>(null);

  const initing = chatContent?.messageIniting;
  const topLoading = chatContent?.messageLoading.EARLIER;
  const topHasMore = chatContent?.messageHasMore.EARLIER;
  const messageList = chatContent?.messageList || [];
  const messageInited = chatContent?.messageInited;

  useLayoutEffect(() => {
    if (scrollWrapperRef.current) {
      // 对话切换，滚动至最新消息
      if (chat !== lastChatRef.current) {
        bottomAnchorRef.current?.scrollIntoView();
      } else {
        // 数量相同，认定为更新消息状态
        if (messageList.length === lastMessageListRef.current.length) {
          scrollWrapperRef.current.scrollTop = lastScrollHeightRef.current;
        }
        // 数量增加，判断增加方向
        if (messageList.length > lastMessageListRef.current.length) {
          // 数量从无到有
          if (!lastMessageListRef.current.length) {
            bottomAnchorRef.current?.scrollIntoView();
          } else {
            const newerMessage = messageList.slice(-1)[0];
            const lastNewerMessage = lastMessageListRef.current.slice(-1)[0];

            if (newerMessage && lastNewerMessage) {
              // 插入了新的消息
              if (newerMessage.messageTime > lastNewerMessage.messageTime) {
                bottomAnchorRef.current?.scrollIntoView();
              } else {
                const { scrollHeight } = scrollWrapperRef.current;
                // 插入了旧的消息
                scrollWrapperRef.current.scrollTop = scrollHeight - lastScrollHeightRef.current - MESSAGE_LOADING_HEIGHT;
              }
            }
          }
        }
      }
    }

    lastChatRef.current = chat || null;
    lastMessageListRef.current = messageList;
  }, [chat, messageList]);

  useEffect(() => {
    console.log('rerere');
  }, []);

  const handleScroll: React.UIEventHandler<HTMLDivElement> = event => {
    if (chat && chatContent) {
      const { scrollTop, scrollHeight } = event.currentTarget;

      lastScrollHeightRef.current = scrollHeight;

      if (scrollTop === 0 && messageInited && messageList.length && topHasMore && !topLoading) {
        onScrollToTop(chat);
      }
    }
  };

  return (
    <div className={classnames(style.chatContent, className)} style={styleFromProps}>
      {!chat || !chatContent ? (
        <div className={style.emptyWrapper}>
          {renderChatContentEmpty ? (
            renderChatContentEmpty()
          ) : (
            <div className={style.empty}>
              <img className={style.emptyImage} src={ChatContentEmpty} />
              <div className={style.emptyTitle}>{chatContentEmptyTitle || getIn18Text('ZANWUSHUJU')}</div>
              <div className={style.emptyTip}>{chatContentEmptyTip || getIn18Text('chatContentEmptyTip')}</div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className={style.header}>
            <div className={style.avatar}>
              {!chat.contactAvatar || typeof chat.contactAvatar === 'string' ? (
                <Avatar avatar={(chat.contactAvatar || '') as string} size={44} platform={chat.platform} />
              ) : (
                chat.contactAvatar
              )}
            </div>
            <div className={style.title}>
              <div className={classnames(style.contactName, style.ellipsis)}>{chat.contactName}</div>
              {chat.contactDescription && <div className={classnames(style.contactDescription, style.ellipsis)}>{chat.contactDescription}</div>}
            </div>
          </div>
          <div className={style.body}>
            <div className={style.content}>
              <div className={style.messageListWrapper} ref={scrollWrapperRef} onScroll={handleScroll}>
                {topLoading && !initing && (
                  <div className={style.topLoading} style={{ height: MESSAGE_LOADING_HEIGHT }}>
                    <LoadingIcon className={style.loadingIcon} />
                  </div>
                )}
                {initing && (
                  <div className={style.initingWrapper}>
                    <LoadingIcon className={style.loadingIcon} />
                  </div>
                )}
                {!!chatContent.messageList.length && (
                  <div className={style.messageList}>
                    {chatContent.messageList.map(message =>
                      renderMessage ? renderMessage(message) : <Message className={style.message} key={message.messageId} message={message} />
                    )}
                  </div>
                )}
                <div ref={bottomAnchorRef} />
              </div>
              {extraContent && <div className={style.extraContent}>{extraContent}</div>}
              <ChatEditor
                className={style.editor}
                ref={chatEditorRef}
                rules={rules}
                disabled={editorDisabled}
                timeExceeded={editorTimeExceeded}
                placeholder={renderChatPlaceholder ? renderChatPlaceholder(chat) : `发送给 ${chat.contactName}`}
                onFileSend={file => onFileSend(chat, file)}
                onTextSend={text => onTextSend(chat, text)}
              />
            </div>
            {sidebarContent && <div className={style.sidebarContent}>{sidebarContent}</div>}
          </div>
        </>
      )}
    </div>
  );
};
