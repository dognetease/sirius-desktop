import React, { useRef } from 'react';
import classnames from 'classnames';
import { getHandyTime } from '@/components/Layout/SNS/utils';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { getAvatarColor } from '@/components/Layout/SNS/utils';
import { SnsChatId, SnsChatItem } from '@/components/Layout/SNS/types';
import ChatListEmpty from '@/images/icons/SNS/chat-list-empty.png';
import { getTransText } from '@/components/util/translate';
import style from './index.module.scss';

interface ChatListProps {
  className?: string;
  style?: React.CSSProperties;
  id: SnsChatId | null;
  list: SnsChatItem[];
  loading?: boolean;
  emptyTip?: string;
  bottomHasMore?: boolean;
  bottomLoading?: boolean;
  onIdChange: (id: SnsChatId | null) => void;
  onChatItemClick?: (id: SnsChatId | null) => void;
  onScrollToBottom?: () => void;
}

const LOADING_MORE_HEIGHT = 50;

const ChatList: React.FC<ChatListProps> = props => {
  const { className, style: styleFromProps, id, list, loading, emptyTip, bottomHasMore, bottomLoading, onIdChange, onChatItemClick, onScrollToBottom } = props;

  const bodyRef = useRef<HTMLDivElement>(null);

  const handleScroll: React.UIEventHandler<HTMLDivElement> = event => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

    if (clientHeight === scrollHeight - scrollTop && list.length && bottomHasMore && !bottomLoading) {
      onScrollToBottom && onScrollToBottom();
    }
  };

  return (
    <div className={classnames(style.chatList, className)} style={styleFromProps} ref={bodyRef} onScroll={handleScroll}>
      {list.map(item => {
        const active = item.id === id;

        return (
          <div
            className={classnames(style.chatItem, {
              [style.active]: active,
            })}
            onClick={() => {
              onChatItemClick && onChatItemClick(item.id);
              !active && onIdChange(item.id);
            }}
          >
            <div className={style.avatar}>
              {item.avatar ? (
                typeof item.avatar === 'string' ? (
                  <img className={style.avatarImg} src={item.avatar} />
                ) : (
                  item.avatar
                )
              ) : (
                <AvatarTag
                  user={{
                    name: item.name,
                    color: getAvatarColor(item.name),
                  }}
                  size={32}
                />
              )}
            </div>
            <div className={style.content}>
              <div className={style.header}>
                <div className={classnames(style.name, style.ellipsis)}>{item.name}</div>
                <div className={style.time}>{typeof item.time === 'number' ? getHandyTime(item.time) : item.time}</div>
              </div>
              <div className={style.body}>
                <div className={classnames(style.message, style.ellipsis)}>{item.message?.text}</div>
                {!!item.unreadCount && <div className={style.unreadCount}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</div>}
              </div>
            </div>
          </div>
        );
      })}
      {!list.length &&
        (loading ? (
          <div className={style.loadingContent} />
        ) : (
          <div className={style.emptyContent}>
            <img className={style.emptyImage} src={ChatListEmpty} />
            <div className={style.emptyTitle}>{getTransText('ZANWUSHUJU')}</div>
            {emptyTip && <div className={style.emptyTip}>{emptyTip}</div>}
          </div>
        ))}
      {bottomLoading && <div className={style.loadingMore} style={{ height: LOADING_MORE_HEIGHT }} />}
    </div>
  );
};

export default ChatList;
