import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { apis, apiHolder, WhatsAppApi, WhatsAppMessage, WhatsAppContact, WhatsAppMessageType, WhatsAppMessageTypeName } from 'api';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { numericalStringSortFunction, renderMessageTime } from '@/components/Layout/SNS/WhatsApp/utils';
import style from './conversation.module.scss';
import variables from '@web-common/styles/export.module.scss';
interface ConversationProps {
  contact: WhatsAppContact;
  disabled: boolean;
  onChat: (contactWhatsApp: string) => void;
}

const eventApi = apiHolder.api.getEventApi();
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

const renderMessage = (message: WhatsAppMessage) => {
  if (message.messageType === WhatsAppMessageType.TEXT) {
    return JSON.parse(message.content).text;
  }

  return `[${WhatsAppMessageTypeName[message.messageType]}消息]`;
};

const Conversation: React.FC<ConversationProps> = props => {
  const { contact, disabled, onChat } = props;
  const { contactWhatsApp } = contact;

  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);

  const handleMessagesQuery = () => {
    whatsAppApi
      .getMessages({
        query: { contactWhatsApp },
      })
      .then(nextMessages => {
        setMessages(nextMessages.sort((a, b) => numericalStringSortFunction(a.seqNo, b.seqNo, 'DESC')).slice(0, 1));
      });
  };

  useEffect(() => {
    handleMessagesQuery();
  }, [contactWhatsApp]);

  useEffect(() => {
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

  return (
    <div
      className={classnames(style.conversation, {
        [style.disabled]: disabled,
      })}
      onClick={() => !disabled && onChat(contactWhatsApp)}
    >
      <div className={style.avatar}>
        <AvatarTag
          user={{
            name: contact.contactName || contact.contactWhatsApp,
            color: `${variables.avatar3}`,
          }}
          size={32}
        />
      </div>
      <div className={style.content}>
        <div className={style.contentHeader}>
          <span className={style.contactName}>{contact.contactName || contact.contactWhatsApp}</span>
          {contact.contactName && <span className={style.contactWhatsApp}>({contact.contactWhatsApp})</span>}
          {messages[0] && <div className={style.conversationTime}>{renderMessageTime(messages[0].sentAt)}</div>}
        </div>
        <div className={style.messages}>
          {messages.map(message => (
            <div className={style.message} key={message.messageId}>
              <div className={style.messageContent}>{renderMessage(message)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Conversation;
