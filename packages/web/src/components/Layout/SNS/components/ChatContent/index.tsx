import React, { useRef, useLayoutEffect, useContext } from 'react';
import classnames from 'classnames';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { getAvatarColor } from '@/components/Layout/SNS/utils';
import ChatMessage from '../ChatMessage';
import { SnsMessage } from '@/components/Layout/SNS/types';
import ChatEditor from '../ChatEditor';
import { ChatContext } from '@/components/Layout/SNS/context';
import { getTransText } from '@/components/util/translate';
import style from './index.module.scss';

export type MessageUpdateType = 'prepend' | 'append' | 'update';

interface ChatContentProps {
  className?: string;
  style?: React.CSSProperties;
  id: number | string;
  name: string;
  avatar?: string | React.ReactChild | null;
  account: number | string;
  messageList: SnsMessage[];
  messageUpdateType: MessageUpdateType;
  topHasMore: boolean;
  topLoading: boolean;
  extraContent?: React.ReactChild | null;
  sidebarContent?: React.ReactChild | null;
  editorDisabled: boolean;
  onScrollToTop: () => void;
  onSend: (text: string) => void;
  onSendFile: (file: File) => void;
}

const MESSAGE_LOADING_HEIGHT = 50;

const ChatContent: React.FC<ChatContentProps> = props => {
  const {
    className,
    style: styleFromProps,
    id,
    name,
    avatar,
    account,
    messageList,
    messageUpdateType,
    topHasMore,
    topLoading,
    extraContent,
    sidebarContent,
    editorDisabled,
    onScrollToTop,
    onSend,
    onSendFile,
  } = props;

  const { chatBodyColor, chatEditorColor } = useContext(ChatContext);

  const bodyRef = useRef<HTMLDivElement>(null);
  const bottomAnchor = useRef<HTMLDivElement>(null);
  const lastScrollHeight = useRef<number>(0);

  const handleScroll: React.UIEventHandler<HTMLDivElement> = event => {
    const { scrollTop, scrollHeight } = event.currentTarget;

    lastScrollHeight.current = scrollHeight;

    if (scrollTop === 0 && messageList.length && topHasMore && !topLoading) {
      onScrollToTop();
    }
  };

  useLayoutEffect(() => {
    if (bodyRef.current) {
      const { scrollHeight } = bodyRef.current;

      if (messageUpdateType === 'prepend') {
        bodyRef.current.scrollTop = scrollHeight - lastScrollHeight.current - MESSAGE_LOADING_HEIGHT;
      }
      if (messageUpdateType === 'append') {
        bottomAnchor.current?.scrollIntoView();
      }
      if (messageUpdateType === 'update') {
        // do nothing
      }
    }
  }, [messageList, messageUpdateType]);

  return (
    <div className={classnames(style.chatContent, className)} style={styleFromProps}>
      <div className={style.header}>
        <div className={style.avatar}>
          {avatar ? (
            typeof avatar === 'string' ? (
              <img className={style.avatarImg} src={avatar} />
            ) : (
              avatar
            )
          ) : (
            <AvatarTag user={{ name, color: getAvatarColor(name) }} size={40} />
          )}
        </div>
        <div className={style.content}>
          <div className={classnames(style.name, style.ellipsis)}>{name}</div>
          <div className={classnames(style.account, style.ellipsis)}>{account}</div>
        </div>
      </div>
      <div className={style.main}>
        <div className={style.content}>
          <div className={style.body} style={{ backgroundColor: chatBodyColor }} ref={bodyRef} onScroll={handleScroll}>
            {topLoading && <div className={style.messageLoading} style={{ height: MESSAGE_LOADING_HEIGHT }} />}
            <div className={style.messageList}>
              {messageList.map(message => (
                <ChatMessage className={style.message} key={message.id} message={message} />
              ))}
            </div>
            <div ref={bottomAnchor} />
          </div>
          {extraContent && <div className={style.extraContent}>{extraContent}</div>}
          <div className={style.footer} style={{ backgroundColor: chatEditorColor }}>
            <ChatEditor
              key={id}
              className={style.editor}
              placeholder={`${getTransText('FASONGGEI')} ${name}`}
              disabled={editorDisabled}
              onSend={onSend}
              onSendFile={onSendFile}
            />
          </div>
        </div>
        <div className={style.sidebar}>{sidebarContent}</div>
      </div>
    </div>
  );
};

export default ChatContent;
