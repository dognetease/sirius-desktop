import React from 'react';
import classnames from 'classnames';
import { WhatsAppContact } from 'api';
import ChatMessages from './chatMessages';
import ChatEditor from './chatEditor';
import style from './chatBody.module.scss';

interface ChatBodyProps {
  className?: string;
  contact: WhatsAppContact;
}

const ChatBody: React.FC<ChatBodyProps> = props => {
  const { className, contact } = props;

  return (
    <div className={classnames(style.chatBody, className)}>
      <div className={style.chatContent}>
        <ChatMessages className={style.chatMessages} contact={contact} />
        <ChatEditor className={style.chatEditor} contact={contact} />
      </div>
      <div className={style.chatSidebar}></div>
    </div>
  );
};

export default ChatBody;
