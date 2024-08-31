import { FacebookMessage, FacebookMessageType, FacebookMessageTypeName, FacebookMessageDirection } from 'api';
import { SnsMessage, SnsMessageType, SnsMessageDirection } from '@/components/Layout/SNS/types';
import { getTransText } from '@/components/util/translate';

export const convertToSnsMessage = (message: FacebookMessage) => {
  let snsMessage: SnsMessage = {
    id: message.messageId,
    name: '',
    time: new Date(message.messageTime).valueOf(),
    type: SnsMessageType.TEXT,
    avatar: null,
    content: { text: `[${getTransText('BUZHICHIDEXIAOXILEIXING')}]` },
    direction: message.messageDirection as unknown as SnsMessageDirection,
    originMessage: message,
  };

  if (message.messageDirection === FacebookMessageDirection.LX_TO_FACEBOOK) {
    snsMessage.name = message.pageName;
    snsMessage.avatar = message.pageAvatar;
  }

  if (message.messageDirection === FacebookMessageDirection.FACEBOOK_TO_LX) {
    snsMessage.name = message.contactName;
    snsMessage.avatar = message.contactAvatar;
  }

  if (message.messageType === FacebookMessageType.TEXT) {
    snsMessage.content = { text: message.messageText };
  }

  if (message.messageType === FacebookMessageType.AUDIO) {
    snsMessage.type = SnsMessageType.AUDIO;
    snsMessage.content = {
      fileName: '',
      fileType: '',
      fileSize: 0,
      src: message.messageMediaUrlList?.[0] || '',
    };
  }

  if (message.messageType === FacebookMessageType.IMAGE) {
    snsMessage.type = SnsMessageType.IMAGE;
    snsMessage.content = {
      fileName: '',
      fileType: '',
      fileSize: 0,
      src: message.messageMediaUrlList?.[0] || '',
    };
  }

  if (message.messageType === FacebookMessageType.VIDEO) {
    snsMessage.type = SnsMessageType.VIDEO;
    snsMessage.content = {
      fileName: '',
      fileType: '',
      fileSize: 0,
      src: message.messageMediaUrlList?.[0] || '',
    };
  }

  if (message.messageType === FacebookMessageType.DOCUMENT) {
    snsMessage.type = SnsMessageType.DOCUMENT;
    snsMessage.content = {
      fileName: '',
      fileType: '',
      fileSize: 0,
      downloadUrl: message.messageMediaUrlList?.[0] || '',
    };
  }

  return snsMessage;
};

export const getMessageText = (message: FacebookMessage) => {
  const { messageType } = message;

  if (messageType === FacebookMessageType.TEXT) {
    return message.messageText;
  }

  return `[${FacebookMessageTypeName[messageType] || getTransText('WEIZHILEIXING')}]`;
};
