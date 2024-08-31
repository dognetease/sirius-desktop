import React from 'react';
import classnames from 'classnames';
import { SnsImAvatar, SnsImMessage, SnsImMessageDirection, SnsImMessageStatus, SnsImPlatform } from '../types';
import Avatar from './Avatar';
import { commonDateUnitFormat } from '@web-common/utils/commonDateUnitFormat';
import { MessageRenderer } from './MessageRenderer';
import { ReactComponent as SendingIcon } from '../icons/sending.svg';
import { ReactComponent as SentIcon } from '../icons/sent.svg';
import { ReactComponent as ErrorIcon } from '../icons/error.svg';
import { ReactComponent as DeliveredIcon } from '../icons/delivered.svg';
import { ReactComponent as SeenIcon } from '../icons/seen.svg';
import style from './Message.module.scss';

const StatusIconMap: Record<SnsImMessageStatus, React.ReactElement> = {
  [SnsImMessageStatus.SENDING]: <SendingIcon className={classnames(style.status, style.spining)} />,
  [SnsImMessageStatus.SENT]: <SentIcon className={style.status} />,
  [SnsImMessageStatus.ERROR]: <ErrorIcon className={style.status} />,
  [SnsImMessageStatus.DELIVERED]: <DeliveredIcon className={style.status} />,
  [SnsImMessageStatus.SEEN]: <SeenIcon className={style.status} />,
};

const renderAvatar = (avatar?: SnsImAvatar) => {
  return !avatar || typeof avatar === 'string' ? <Avatar avatar={(avatar || '') as string} size={32} /> : avatar;
};

interface MessageProps {
  className?: string;
  style?: React.CSSProperties;
  message: SnsImMessage;
}

export const Message: React.FC<MessageProps> = props => {
  const { className, style: styleFromProps, message } = props;

  const { messageDirection, messageTime, messageStatus, contactName, contactAvatar, accountName, accountAvatar } = message;

  if (messageDirection === SnsImMessageDirection.RECEIVE) {
    return (
      <div className={classnames(style.messageWrapper, style.receive, className)} style={styleFromProps}>
        <div className={style.avatar}>{renderAvatar(contactAvatar)}</div>
        <div className={style.content}>
          <div className={classnames(style.title, style.ellipsis)}>
            <span className={style.name}>{contactName}</span>
            <span className={style.time}>{commonDateUnitFormat(messageTime, 'precise')}</span>
          </div>
          <div className={style.message}>
            <MessageRenderer message={message} />
          </div>
        </div>
      </div>
    );
  }

  if (messageDirection === SnsImMessageDirection.SEND)
    return (
      <div className={classnames(style.messageWrapper, style.send, className)} style={styleFromProps}>
        <div className={style.content}>
          <div className={classnames(style.title, style.ellipsis)}>
            <span className={style.time}>{commonDateUnitFormat(messageTime, 'precise')}</span>
            <span className={style.name}>{accountName}</span>
          </div>
          <div className={style.message}>
            <MessageRenderer message={message} />
          </div>
          {StatusIconMap[messageStatus]}
        </div>
        <div className={style.avatar}>{renderAvatar(accountAvatar)}</div>
      </div>
    );

  return null;
};
