import React from 'react';
import { apis, apiHolder, WhatsAppApi, WhatsAppMessageDirection, WhatsAppMessage } from 'api';
import { numericalStringSortFunction } from '../utils';

const whatsAppApi = apiHolder.api.requireLogicalApi(apis.whatsAppApiImpl) as unknown as WhatsAppApi;

const initMessage = () => {
  whatsAppApi.pullContact().then(contacts => {
    whatsAppApi.pullMessage({
      data: contacts.map(contact => ({
        contactWhatsApp: contact.contactWhatsApp,
        lastSeqNo: contact.lastSeqNo,
        limit: 1,
      })),
    });
  });
};

const pullMessageByWhatsApp = (contactWhatsApp: string) => {
  whatsAppApi
    .getContacts({
      query: { contactWhatsApp },
    })
    .then(contacts => {
      const contact = contacts[0];

      if (contact) {
        whatsAppApi.pullMessage({
          data: [
            {
              contactWhatsApp: contact.contactWhatsApp,
              lastSeqNo: contact.lastSeqNo,
              limit: 1000,
            },
          ],
        });
      }
    });
};

const getLastReceivedMessage = (contactWhatsApp: string) => {
  return whatsAppApi
    .getMessages({
      query: { contactWhatsApp },
    })
    .then(messages => {
      const message = messages
        .filter(item => item.messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX)
        .sort((a, b) => numericalStringSortFunction(a.seqNo, b.seqNo, 'DESC'))[0];

      return message || null;
    });
};

const getLastReceivedSender = (contactWhatsApp: string) => {
  return getLastReceivedMessage(contactWhatsApp).then(receivedMessage => (receivedMessage ? receivedMessage.to : null));
};

export const messageContext = {
  initMessage,
  pullMessageByWhatsApp,
  getLastReceivedMessage,
};

interface MessageContextType {
  initMessage: () => void;
  pullMessageByWhatsApp: (contactWhatsApp: string) => void;
  getLastReceivedMessage: (contactWhatsApp: string) => Promise<WhatsAppMessage | null>;
}

const MessageContext = React.createContext<MessageContextType>(messageContext);

export default MessageContext;
