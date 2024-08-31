import React, { useState, useEffect } from 'react';
import { apis, apiHolder, WhatsAppApi, WhatsAppContact } from 'api';
import ChatHeader from './chatHeader';
import ChatBody from './chatBody';
import style from './chat.module.scss';

const eventApi = apiHolder.api.getEventApi();
const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

interface ChatProps {
  contactWhatsApp: string;
}

const Chat: React.FC<ChatProps> = props => {
  const { contactWhatsApp } = props;

  const [contact, setContact] = useState<WhatsAppContact | null>(null);

  const handleContactQuery = () => {
    whatsAppApi
      .getContacts({
        query: { contactWhatsApp },
      })
      .then(contacts => {
        contacts[0] && setContact(contacts[0]);
      });
  };

  useEffect(() => {
    handleContactQuery();
  }, [contactWhatsApp]);

  useEffect(() => {
    const id = eventApi.registerSysEventObserver('whatsAppContactsUpdate', {
      func: event => {
        const { updatedContactWhatsApps } = event.eventData;

        if (updatedContactWhatsApps.includes(contactWhatsApp)) {
          handleContactQuery();
        }
      },
    });

    return () => {
      eventApi.unregisterSysEventObserver('whatsAppContactsUpdate', id);
    };
  }, [contactWhatsApp]);

  return (
    <div className={style.chat}>
      {contact && (
        <>
          <ChatHeader className={style.chatHeader} contact={contact} />
          <ChatBody className={style.chatBody} contact={contact} />
        </>
      )}
    </div>
  );
};

export default Chat;
