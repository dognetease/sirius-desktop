import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import classnames from 'classnames';
import { apis, apiHolder, WhatsAppApi, WhatsAppMessage, WhatsAppContact } from 'api';
import ChatMessage from './chatMessage';
import { numericalStringSortFunction } from '@/components/Layout/SNS/WhatsApp/utils';
import style from './chatMessages.module.scss';

interface ChatMessagesProps {
  className?: string;
  contact: WhatsAppContact;
}

const PARAGRAPH_SPACING = 5 * 60 * 1000;

const eventApi = apiHolder.api.getEventApi();
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

const ChatMessages: React.FC<ChatMessagesProps> = props => {
  const { className, contact } = props;
  const { contactWhatsApp } = contact || {};

  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);

  const anchorMessagesRef = useRef<HTMLDivElement>(null);

  const handleMessagesQuery = () => {
    whatsAppApi
      .getMessages({
        query: { contactWhatsApp },
      })
      .then(nextMessages => {
        setMessages(nextMessages.sort((a, b) => numericalStringSortFunction(a.seqNo, b.seqNo)));
      });
  };

  useEffect(() => {
    contactWhatsApp && handleMessagesQuery();
  }, [contactWhatsApp]);

  useEffect(() => {
    if (!contactWhatsApp) return () => {};

    const id = eventApi.registerSysEventObserver('whatsAppMessagesUpdate', {
      func: event => {
        const { updatedContactWhatsApps } = event.eventData;

        if (updatedContactWhatsApps.includes(contactWhatsApp)) {
          handleMessagesQuery();
        }
      },
    });

    return () => {
      eventApi.unregisterSysEventObserver('whatsAppMessagesUpdate', id);
    };
  }, [contactWhatsApp]);

  useLayoutEffect(() => {
    anchorMessagesRef.current?.scrollIntoView();
  }, [messages]);

  return (
    <div className={classnames(style.chatMessages, className, 'wm-chat-scroller')}>
      {messages.map((message, index) => {
        const lastMessage = messages[index - 1];
        const showTime = !lastMessage || message.sentAt - lastMessage.sentAt > PARAGRAPH_SPACING;
        const propsExtends = index === messages.length - 1 ? { ref: anchorMessagesRef } : {};

        return <ChatMessage className={style.chatMessage} key={message.messageId} showTime={showTime} contact={contact} message={message} {...propsExtends} />;
      })}
    </div>
  );
};

export default ChatMessages;
