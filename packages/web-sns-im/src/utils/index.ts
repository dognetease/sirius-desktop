import { api, SystemApi } from 'api';
import { SnsImChat, SnsImMessage, SnsImMessageType, SnsImMessageFile, SnsImMessageStatus, SnsImMessageDirection, SnsImRules } from '../types';

const systemApi = api.getSystemApi() as SystemApi;

export const getAvatarColor = (name: string) => {
  const colors = ['#6557FF', '#00CCAA', '#FE6C5E', '#00C4D6', '#A259FF', '#4C6AFF'];
  const emailMd5 = systemApi.md5(name);

  return colors[parseInt(emailMd5[emailMd5.length - 1], 16) % colors.length];
};

export const getMessageText = (message: SnsImMessage) => {
  const MessageTextMap: Partial<Record<SnsImMessageType, string>> = {
    [SnsImMessageType.TEXT]: message.messageText || '',
    [SnsImMessageType.IMAGE]: '[图片]',
    [SnsImMessageType.AUDIO]: '[音频]',
    [SnsImMessageType.VIDEO]: '[视频]',
    [SnsImMessageType.FILE]: '[文件]',
  };

  return MessageTextMap[message.messageType] || '';
};

export function createTempMessage<M = any>(chat: SnsImChat, payload?: Partial<SnsImMessage<M>>): SnsImMessage<M> {
  const now = Date.now();

  return {
    isTemp: true,
    chatId: chat.chatId,
    accountName: chat.accountName,
    accountAvatar: chat.accountAvatar,
    contactName: chat.contactName,
    contactAvatar: chat.contactAvatar,
    messageId: `${now}`,
    messageText: '',
    messageType: SnsImMessageType.TEXT,
    messageFile: undefined,
    messageJsx: undefined,
    messageTime: now,
    messageStatus: SnsImMessageStatus.SENDING,
    messageDirection: SnsImMessageDirection.SEND,
    quoteMessageId: undefined,
    rawData: {} as M,
    ...payload,
  };
}

export const getFileBlobURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsArrayBuffer(file);
    reader.onload = event => {
      if (event.target && event.target.result) {
        const blob = new Blob([event.target.result], { type: file.type });
        const blobURL = window.URL.createObjectURL(blob);

        resolve(blobURL);
      }
    };
    reader.onerror = error => {
      reject(error);
    };
  });

export const DefaultSnsImRules: SnsImRules = {
  textMaxLength: Infinity,
  imageSupport: true,
  imageTypes: ['jpg', 'png'],
  imageMaxSize: Infinity,
  videoSupport: true,
  videoTypes: ['mp4', 'mov'],
  videoMaxSize: Infinity,
  fileSupport: true,
  fileTypes: true,
  fileMaxSize: Infinity,
};

export const mergeWithDefaultRules = (rules: Partial<SnsImRules> | undefined) => {
  const ret = {
    ...DefaultSnsImRules,
    ...rules,
  };
  if (ret.imageTypes.includes('jpg') && !ret.imageTypes.includes('jpeg')) {
    ret.imageTypes.push('jpeg');
  }
  return ret;
};

export const getFileMessageType = (file: File, rules: SnsImRules) => {
  const fileName = file.name;
  const fileType = fileName.split('.').pop() || '';

  if (rules.imageSupport) {
    if ((rules.imageTypes || []).includes(fileType)) {
      return SnsImMessageType.IMAGE;
    }
  }

  if (rules.videoSupport) {
    if ((rules.videoTypes || []).includes(fileType)) {
      return SnsImMessageType.VIDEO;
    }
  }

  return SnsImMessageType.FILE;
};

export const extractFileToMessage = (file: File, rules: SnsImRules) =>
  new Promise<{
    messageType: SnsImMessageType;
    messageFile: SnsImMessageFile;
  }>((resolve, reject) => {
    getFileBlobURL(file)
      .then(blobURL => {
        const messageType = getFileMessageType(file, rules);
        const messageFile: SnsImMessageFile = {
          src: blobURL,
          fileName: file.name,
          fileSize: file.size,
        };

        resolve({ messageType, messageFile });
      })
      .catch(error => {
        reject(error);
      });
  });

export const getLatestNonTempMessage = (messageList: SnsImMessage[]) => {
  return messageList.findLast(item => !item.isTemp) || null;
};
