import { getIn18Text } from 'api';
import {
  SnsMarketingChat,
  SnsMarketingMedia,
  SnsMarketingMediaType,
  SnsMarketingMessage,
  SnsMarketingMessageDirection,
  SnsMarketingPlatform,
  SnsPlatformName,
} from 'api';
import { SnsImPlatform, SnsImChat, SnsImMessage, SnsImMessageType, SnsImMessageFile, SnsImMessageStatus, SnsImMessageDirection } from '@web-sns-im';

export const messageTypeConvertMap: Record<SnsMarketingMediaType, SnsImMessageType> = {
  [SnsMarketingMediaType.AUDIO]: SnsImMessageType.AUDIO,
  [SnsMarketingMediaType.IMAGE]: SnsImMessageType.IMAGE,
  [SnsMarketingMediaType.VIDEO]: SnsImMessageType.VIDEO,
  [SnsMarketingMediaType.FILE]: SnsImMessageType.FILE,
  [SnsMarketingMediaType.GIF]: SnsImMessageType.FILE,
};

export const messageTypeRecoverMap: Record<SnsImMessageType, SnsMarketingMediaType | undefined> = {
  [SnsImMessageType.AUDIO]: SnsMarketingMediaType.AUDIO,
  [SnsImMessageType.IMAGE]: SnsMarketingMediaType.IMAGE,
  [SnsImMessageType.VIDEO]: SnsMarketingMediaType.VIDEO,
  [SnsImMessageType.FILE]: SnsMarketingMediaType.FILE,
  [SnsImMessageType.TEXT]: undefined,
  [SnsImMessageType.JSX]: undefined,
};

export const messageDirectionConvertMap: Record<SnsMarketingMessageDirection, SnsImMessageDirection> = {
  [SnsMarketingMessageDirection.OUT]: SnsImMessageDirection.SEND,
  [SnsMarketingMessageDirection.IN]: SnsImMessageDirection.RECEIVE,
};

export const messageFileConverter: (file: SnsMarketingMedia) => SnsImMessageFile = file => {
  return {
    src: file.url,
  };
};

export const messageConverter: (chat: SnsMarketingChat, message: SnsMarketingMessage) => SnsImMessage = (chat, message) => {
  let messageType: SnsImMessageType | undefined = undefined;
  let messageFile: SnsImMessageFile | undefined = undefined;

  if (message.messageText) {
    messageType = SnsImMessageType.TEXT;
  } else if (message.mediaType) {
    messageType = messageTypeConvertMap[message.mediaType];
    messageFile = message.mediaList[0] ? messageFileConverter(message.mediaList[0]) : undefined;
  } else {
    messageType = SnsImMessageType.TEXT;
    message.messageText = `[不支持的消息格式,请在 ${SnsPlatformName[chat.platform]} 查看]`;
  }

  const messageDirection = messageDirectionConvertMap[message.direction];
  let messageStatus = SnsImMessageStatus.SENT;
  let messageTime = message.messageTime;

  if (message.messageDelivery) {
    messageStatus = SnsImMessageStatus.DELIVERED;
    messageTime = message.deliveryTime;
  }
  if (message.messageRead) {
    messageStatus = SnsImMessageStatus.SEEN;
    messageTime = message.readTime;
  }

  return {
    chatId: message.dialogId,
    accountName: chat.accountName,
    accountAvatar: chat.accountAvatar,
    contactName: chat.contactName,
    contactAvatar: chat.contactAvatar,
    messageId: message.messageId,
    messageText: message.messageText,
    messageJsx: undefined,
    messageDirection,
    messageType,
    messageFile,
    messageStatus,
    messageTime,
    quoteMessageId: undefined,
    rawData: message,
  };
};

export const chatConverter: (chat: SnsMarketingChat) => SnsImChat = chat => {
  return {
    chatId: chat.dialogId,
    chatTime: chat.latestMsgTime,
    platform: chat.platform as unknown as SnsImPlatform,
    accountName: chat.accountName,
    accountAvatar: chat.accountAvatar,
    contactName: chat.contactName,
    contactAvatar: chat.contactAvatar,
    contactDescription: `粉丝所属 ${SnsPlatformName[chat.platform]} ${
      chat.platform === SnsMarketingPlatform.INSTAGRAM ? getIn18Text('YEWUZHANGHAO') : getIn18Text('GONGGONGZHUYE')
    }：${chat.accountName}`,
    latestMessage: messageConverter(chat, chat.latestMsgInfo),
    latestReceivedMessageTime: chat.latestReceiveMsgTime,
    unreadCount: chat.msgUnReadCount,
    rawData: chat,
  };
};
