import React from 'react';
import { WhatsAppContact } from 'api';
import classnames from 'classnames';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import style from './chatHeader.module.scss';
import variables from '@web-common/styles/export.module.scss';
interface ChatHeaderProps {
  className?: string;
  contact: WhatsAppContact;
}

const ChatHeader: React.FC<ChatHeaderProps> = props => {
  const { className, contact } = props;

  return (
    <div className={classnames(style.chatHeader, className)}>
      <div className={style.avatar}>
        <AvatarTag
          user={{
            name: contact.contactName || contact.contactWhatsApp,
            color: `${variables.avatar3}`,
          }}
          size={40}
        />
      </div>
      <div className={style.content}>
        <span className={style.contactName}>{contact.contactName || contact.contactWhatsApp}</span>
        {contact.contactName && <span className={style.contactWhatsApp}>({contact.contactWhatsApp})</span>}
      </div>
    </div>
  );
};

export default ChatHeader;
