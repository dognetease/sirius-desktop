import React, { useRef } from 'react';
import classnames from 'classnames';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { getAvatarColor, getHandyTime } from '@/components/Layout/SNS/utils';
import { Tooltip } from 'antd';
import {
  SnsMessage,
  SnsMessageDirection,
  SnsMessageType,
  SnsMessageTextContent,
  SnsMessageImageContent,
  SnsMessageVideoContent,
  SnsMessageAudioContent,
  SnsMessageDocumentContent,
  SnsMessageJsxContent,
  SnsMessageStatus,
} from '@/components/Layout/SNS/types';
import ChatText from './chatText';
import ChatImage from './chatImage';
import ChatVideo from './chatVideo';
import ChatAudio from './chatAudio';
import ChatFile from './chatFile';
import { ReactComponent as SendingIcon } from '@/images/icons/SNS/chat-message-sending.svg';
import { ReactComponent as SentIcon } from '@/images/icons/SNS/chat-message-sent.svg';
import { ReactComponent as DeliveryIcon } from '@/images/icons/SNS/chat-message-delivery.svg';
import { ReactComponent as SeenIcon } from '@/images/icons/SNS/chat-message-seen.svg';
import { getTransText } from '@/components/util/translate';

import style from './index.module.scss';

const renderAvatar = (message: SnsMessage) => {
  const { avatar, name } = message;

  return avatar ? (
    typeof avatar === 'string' ? (
      <img className={style.avatarImg} src={avatar} />
    ) : (
      avatar
    )
  ) : (
    <AvatarTag user={{ name, color: getAvatarColor(name) }} size={32} />
  );
};

const renderMessage = (message: SnsMessage) => {
  const { type, content, direction } = message;

  if (type === SnsMessageType.TEXT) {
    return <ChatText text={(content as SnsMessageTextContent).text} direction={direction} />;
  }

  if (type === SnsMessageType.IMAGE) {
    return <ChatImage src={(content as SnsMessageImageContent).src} />;
  }

  if (type === SnsMessageType.VIDEO) {
    return <ChatVideo src={(content as SnsMessageVideoContent).src} />;
  }

  if (type === SnsMessageType.AUDIO) {
    return <ChatAudio src={(content as SnsMessageAudioContent).src} />;
  }

  if (type === SnsMessageType.DOCUMENT) {
    return (
      <ChatFile
        fileName={(content as SnsMessageDocumentContent).fileName}
        fileSize={(content as SnsMessageDocumentContent).fileSize}
        fileType={(content as SnsMessageDocumentContent).fileType}
        downloadUrl={(content as SnsMessageDocumentContent).downloadUrl}
      />
    );
  }

  if (type === SnsMessageType.JSX) {
    return (content as SnsMessageJsxContent).jsx;
  }

  return null;
};

interface MessageStatusProps {
  className?: string;
  message: SnsMessage;
  getContainer: () => HTMLDivElement | HTMLElement;
}

const MessageStatus: React.FC<MessageStatusProps> = props => {
  const { className, message, getContainer } = props;
  const { status } = message;

  if (status === SnsMessageStatus.SENDING) {
    return <SendingIcon className={classnames(style.sendingIcon, className)} />;
  }

  if (status === SnsMessageStatus.SENT) {
    return (
      <Tooltip title={getTransText('YIFASONG')} getTooltipContainer={getContainer}>
        <SentIcon className={className} />
      </Tooltip>
    );
  }

  if (status === SnsMessageStatus.DELIVERY) {
    return (
      <Tooltip title={getTransText('YISONGDA')} getTooltipContainer={getContainer}>
        <DeliveryIcon className={className} />
      </Tooltip>
    );
  }

  if (status === SnsMessageStatus.SEEN) {
    return (
      <Tooltip title={getTransText('YIDU')} getTooltipContainer={getContainer}>
        <SeenIcon className={className} />
      </Tooltip>
    );
  }

  return null;
};

interface ChatMessageProps {
  className?: string;
  style?: React.CSSProperties;
  message: SnsMessage;
}

const ChatMessage: React.FC<ChatMessageProps> = props => {
  const { className, style: styleFromProps, message } = props;

  const { name, time, avatar, direction } = message;

  const containerRef = useRef<HTMLDivElement | null>(null);

  if (direction === SnsMessageDirection.RECEIVE)
    return (
      <div className={classnames(style.chatMessage, style.receive, className)} style={styleFromProps}>
        <div className={style.avatar}>{renderAvatar(message)}</div>
        <div className={style.content}>
          <div className={classnames(style.title, style.ellipsis)}>
            <span className={style.name}>{name}</span>
            <span className={style.time}>{getHandyTime(time)}</span>
          </div>
          <div className={style.message}>{renderMessage(message)}</div>
        </div>
      </div>
    );

  if (direction === SnsMessageDirection.SEND)
    return (
      <div className={classnames(style.chatMessage, style.send, className)} style={styleFromProps} ref={containerRef}>
        <div className={style.content}>
          <div className={classnames(style.title, style.ellipsis)}>
            <span className={style.time}>{getHandyTime(time)}</span>
            <span className={style.name}>{name}</span>
          </div>
          <div className={style.message}>{renderMessage(message)}</div>
        </div>
        <div className={style.avatar}>{renderAvatar(message)}</div>
        <MessageStatus className={style.messageStatus} message={message} getContainer={() => containerRef.current || document.body} />
      </div>
    );

  return null;
};

export default ChatMessage;
