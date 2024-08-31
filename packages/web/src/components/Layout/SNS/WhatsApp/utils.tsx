import React from 'react';
import qs from 'querystring';
import {
  apiHolder,
  apis,
  SystemApi,
  ContactApi,
  OrgApi,
  WhatsAppTemplate,
  WhatsAppTemplateParams,
  WhatsAppVariable,
  WhatsAppVariableType,
  WhatsAppFileExtractResult,
  WhatsAppTemplatePlaceholders,
  WhatsAppMessage,
  WhatsAppMessageType,
  WhatsAppMessageTypeName,
  WhatsAppMessageDirection,
  WhatsAppChatItem,
} from 'api';
import { SnsImChat, SnsImMessage, SnsImMessageType, SnsImMessageFile, SnsImMessageStatus, SnsImMessageDirection, SnsImLoadDirection } from '@web-sns-im';
import { SnsMessage, SnsMessageDirection, SnsMessageType, SnsMessageStatus } from '@/components/Layout/SNS/types';
import { cloneDeep } from 'lodash';
import Toast from '@web-common/components/UI/Message/SiriusMessage';
import TemplatePreview, { showTemplatePreviewModal } from '@/components/Layout/SNS/WhatsApp/components/template/templatePreview';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { ChatImage } from './components/chat/ChatItem/ChatImage';
import { ChatVideo } from './components/chat/ChatItem/ChatVideo';
import { ChatAudio } from './components/chat/ChatItem/ChatAudio';
import { ChatFile } from './components/chat/ChatItem/ChatFile';
import variablesC from '@web-common/styles/export.module.scss';
import { getTransText } from '@/components/util/translate';
import { getIn18Text } from 'api';
const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
export const AppToken = 'App 216da61c97340e775c3594af365ba67d-4581f279-b856-4a6a-839a-8a7eb4adf51b';
export const variableRegExp = /\{\{(.*?)\}\}/g;
export const numericalStringSortFunction = (a: string, b: string, order: 'ASC' | 'DESC' = 'ASC') => {
  const result = order === 'ASC' ? -1 : 1;
  if (a.length < b.length) return result;
  if (a.length > b.length) return result * -1;
  for (let i = 0; i < a.length; i++) {
    if (+a[i] < +b[i]) return result;
    if (+a[i] > +b[i]) return result * -1;
    continue;
  }
  return result;
};
export const getTemplateAvailable = (template: WhatsAppTemplate) => {
  const { structure } = template;
  return structure.body.text !== undefined;
};
export const getPreviewTextFromTemplate = (template: WhatsAppTemplate) => {
  let text = '';
  const { structure } = template;
  if (!getTemplateAvailable(template)) return getIn18Text('BUZHICHIDEMOBANLEIXING');
  if (structure.header && structure.header.format === 'TEXT') {
    text += structure.header.text;
  }
  if (structure.body) {
    text += structure.body.text;
  }
  if (structure.footer) {
    text += structure.footer.text;
  }
  return text;
};
export const fillTemplateWithTemplateParams: (params: {
  extraction: WhatsAppFileExtractResult;
  template: WhatsAppTemplate;
  templateParams: WhatsAppTemplateParams;
}) => WhatsAppTemplate | null = ({ extraction, template, templateParams }) => {
  const templateAvailable = getTemplateAvailable(template);
  if (!templateAvailable) {
    Toast.error({ content: getIn18Text('BUZHICHIDEMOBANLEIXING') });
    return null;
  }
  template = cloneDeep(template);
  const { structure } = template;
  if (structure.header) {
    if (structure.header.format === 'IMAGE') {
      const mediaUrl = templateParams.header?.mediaUrl;
      structure.header.mediaUrl = mediaUrl || undefined;
    }
    if (structure.header.format === 'TEXT') {
      const variables = templateParams.header?.variables as WhatsAppVariable[];
      if (Array.isArray(variables)) {
        variables.forEach((variable, index) => {
          const variableName = `{{${index + 1}}}`;
          if (structure.header.text) {
            if (variable.type === WhatsAppVariableType.FIXED) {
              if (variable.value) {
                structure.header.text = structure.header.text.replace(variableName, variable.value);
              }
            }
            if (variable.type === WhatsAppVariableType.FILE_FIELD) {
              if (variable.value !== undefined) {
                const variableFieldName = extraction.header[variable.value] || '';
                structure.header.text = structure.header.text.replace(variableName, variableFieldName);
              }
            }
          }
        });
      }
    }
  }
  if (structure.body) {
    const variables = templateParams.body?.variables as WhatsAppVariable[];
    if (Array.isArray(variables)) {
      variables.forEach((variable, index) => {
        const variableName = `{{${index + 1}}}`;
        if (variable.type === WhatsAppVariableType.FIXED) {
          if (variable.value) {
            structure.body.text = structure.body.text.replace(variableName, variable.value);
          }
        }
        if (variable.type === WhatsAppVariableType.FILE_FIELD) {
          if (variable.value !== undefined) {
            const variableFieldName = extraction.header[variable.value] || '';
            structure.body.text = structure.body.text.replace(variableName, variableFieldName);
          }
        }
      });
    }
  }
  return template;
};
export const fillTemplateWithTemplatePlaceholders: (params: { template: WhatsAppTemplate; templatePlaceholders: WhatsAppTemplatePlaceholders }) => WhatsAppTemplate = ({
  template,
  templatePlaceholders,
}) => {
  template = cloneDeep(template);
  const { structure } = template;
  if (structure.header) {
    if (structure.header.format === 'IMAGE') {
      const mediaUrl = templatePlaceholders.header?.mediaUrl;
      structure.header.mediaUrl = mediaUrl || undefined;
    }
    if (structure.header.format === 'TEXT') {
      const placeholder = templatePlaceholders.header?.placeholder;
      const variableName = '{{1}}';
      if (structure.header.text && placeholder) {
        structure.header.text = structure.header.text.replace(variableName, placeholder as string);
      }
    }
  }
  if (structure.body) {
    const placeholders = templatePlaceholders.body?.placeholders;
    if (Array.isArray(placeholders)) {
      placeholders.forEach((placeholder, index) => {
        const variableName = `{{${index + 1}}}`;
        structure.body.text = structure.body.text.replace(variableName, placeholder);
      });
    }
  }
  return template;
};
export const renderMessageTime = (timestamp: number) => {
  const currentMoment = moment();
  const messageMoment = moment(timestamp);

  if (moment(currentMoment).subtract(3, 'minute') <= messageMoment) {
    const GANGGANG = getIn18Text('GANGGANG');

    return GANGGANG;
  }

  if (moment(currentMoment).startOf('day') <= messageMoment) {
    return messageMoment.format('HH:mm');
  }

  if (moment(currentMoment).startOf('day').subtract(1, 'day') <= messageMoment) {
    const ZUOTIAN = getIn18Text('ZUOTIAN');

    return `${ZUOTIAN} ${messageMoment.format('HH:mm')}`;
  }

  if (moment(currentMoment).startOf('year') <= messageMoment) {
    return messageMoment.format('MM-DD HH:mm');
  }

  return messageMoment.format('YYYY-MM-DD HH:mm');
};

export const getMessageText = (message: WhatsAppMessage) => {
  const { messageType, content: contentString } = message;
  let content = {} as Record<string, any>;

  try {
    content = JSON.parse(contentString);
  } catch (error) {}

  if (messageType === WhatsAppMessageType.TEXT) {
    return content.text;
  }

  if (messageType === WhatsAppMessageType.TEMPLATE) {
    return `[${WhatsAppMessageTypeName.TEMPLATE}]`;
  }

  if (messageType === WhatsAppMessageType.IMAGE) {
    return `[${WhatsAppMessageTypeName.IMAGE}]`;
  }

  if (messageType === WhatsAppMessageType.DOCUMENT) {
    return `[${WhatsAppMessageTypeName.DOCUMENT}]`;
  }

  if (messageType === WhatsAppMessageType.VIDEO) {
    return `[${WhatsAppMessageTypeName.VIDEO}]`;
  }

  if (messageType === WhatsAppMessageType.LOCATION) {
    return `[${WhatsAppMessageTypeName.LOCATION}]`;
  }

  if (messageType === WhatsAppMessageType.STICKER) {
    return `[${WhatsAppMessageTypeName.STICKER}]`;
  }

  if (messageType === WhatsAppMessageType.CONTACT) {
    return `[${WhatsAppMessageTypeName.CONTACT}]`;
  }

  if (messageType === WhatsAppMessageType.AUDIO) {
    return `[${WhatsAppMessageTypeName.AUDIO}]`;
  }

  return '';
};

export const getSnsMessageStatus = (message: WhatsAppMessage) => {
  let status;

  if (message.sentAt) {
    status = SnsMessageStatus.SENT;
  }
  if (message.deliveryAt) {
    status = SnsMessageStatus.DELIVERY;
  }
  if (message.seenAt) {
    status = SnsMessageStatus.SEEN;
  }

  return status;
};

export const convertToSnsMessage = (message: WhatsAppMessage) => {
  const { messageType, messageDirection, content: contentString } = message;
  let content = {} as Record<string, any>;
  let snsMessage: SnsMessage = {
    id: message.seqNo,
    name: '',
    time: message.sentAt,
    type: SnsMessageType.TEXT,
    avatar: null,
    content: { text: '' },
    direction: message.messageDirection as unknown as SnsMessageDirection,
    originMessage: message,
    status: undefined,
  };

  try {
    content = JSON.parse(contentString);

    if (messageType === WhatsAppMessageType.TEXT) {
      snsMessage.content = { text: content.text };
    }

    if (messageType === WhatsAppMessageType.TEMPLATE) {
      try {
        let template = content.template as WhatsAppTemplate;
        const structure = JSON.parse(template.structure as unknown as string);
        template = { ...template, structure };
        const templateFilled = fillTemplateWithTemplatePlaceholders({
          template,
          templatePlaceholders: JSON.parse(content.params) as WhatsAppTemplatePlaceholders,
        });
        snsMessage.type = SnsMessageType.JSX;
        snsMessage.content = {
          jsx: (
            <div
              style={{
                border: `0.5px solid ${variablesC.fill2}`,
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'pointer',
              }}
              onClick={() => showTemplatePreviewModal(templateFilled)}
            >
              <TemplatePreview template={templateFilled} />
            </div>
          ),
        };
      } catch (error) {
        snsMessage.type = SnsMessageType.TEXT;
        snsMessage.content = {
          text: getTransText('[BUZHICHIDEMOBANLEIXING]'),
        };
      }
    }

    if (messageType === WhatsAppMessageType.IMAGE) {
      if (messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
        snsMessage.type = SnsMessageType.JSX;
        snsMessage.content = {
          jsx: <ChatImage content={content} />,
        };
      }
      if (messageDirection === WhatsAppMessageDirection.LX_TO_WHATSAPP) {
        const downloadUrl = content.mediaUrl;
        const query = qs.parse(downloadUrl);

        snsMessage.type = SnsMessageType.IMAGE;
        snsMessage.content = {
          fileName: content.filename || query.download || '',
          fileType: content.fileType || '',
          fileSize: content.fileSize || 0,
          src: downloadUrl,
        };
      }
    }

    if (messageType === WhatsAppMessageType.VIDEO) {
      if (messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
        snsMessage.type = SnsMessageType.JSX;
        snsMessage.content = {
          jsx: <ChatVideo content={content} />,
        };
      }
      if (messageDirection === WhatsAppMessageDirection.LX_TO_WHATSAPP) {
        const downloadUrl = content.mediaUrl;
        const query = qs.parse(downloadUrl);

        snsMessage.type = SnsMessageType.VIDEO;
        snsMessage.content = {
          fileName: content.filename || query.download || '',
          fileType: content.fileType || '',
          fileSize: content.fileSize || 0,
          src: downloadUrl,
        };
      }
    }

    if (messageType === WhatsAppMessageType.DOCUMENT) {
      if (messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
        snsMessage.type = SnsMessageType.JSX;
        snsMessage.content = {
          jsx: <ChatFile content={content} />,
        };
      }
      if (messageDirection === WhatsAppMessageDirection.LX_TO_WHATSAPP) {
        const downloadUrl = content.mediaUrl;
        const query = qs.parse(downloadUrl);

        snsMessage.type = SnsMessageType.DOCUMENT;
        snsMessage.content = {
          fileName: content.filename || query.download || '',
          fileType: content.fileType || '',
          fileSize: content.fileSize || 0,
          downloadUrl,
        };
      }
    }

    if (messageType === WhatsAppMessageType.LOCATION) {
      snsMessage.content = { text: getMessageText(message) };
    }

    if (messageType === WhatsAppMessageType.STICKER) {
      snsMessage.content = { text: getMessageText(message) };
    }

    if (messageType === WhatsAppMessageType.CONTACT) {
      snsMessage.content = { text: getMessageText(message) };
    }

    if (messageType === WhatsAppMessageType.AUDIO) {
      if (messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
        snsMessage.type = SnsMessageType.JSX;
        snsMessage.content = {
          jsx: <ChatAudio content={content} />,
        };
      }
      if (messageDirection === WhatsAppMessageDirection.LX_TO_WHATSAPP) {
        snsMessage.content = { text: getMessageText(message) };
      }
    }

    if (message.messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
      snsMessage.name = message.contactName || message.to;

      return Promise.resolve(snsMessage);
    }

    if (message.messageDirection === WhatsAppMessageDirection.LX_TO_WHATSAPP) {
      snsMessage.status = getSnsMessageStatus(message);

      return contactApi.doGetContactById(message.accountId).then(accounts => {
        if (accounts[0]) {
          const accountInfo = accounts[0].contact;
          const name = accountInfo?.contactName;
          const email = accountInfo?.accountName;

          snsMessage.name = name;
          snsMessage.avatar = <AvatarTag user={{ name, email }} size={32} />;
        }

        return snsMessage;
      });
    }
  } catch (error) {
    snsMessage.content = { text: '[解析出错]' };
  }

  return Promise.resolve(snsMessage);
};

export const getAvatarColor = (name: string) => {
  const colors = ['#6557FF', '#00CCAA', '#FE6C5E', '#00C4D6', '#A259FF', '#4C6AFF'];
  const emailMd5 = systemApi.md5(name);

  return colors[parseInt(emailMd5[emailMd5.length - 1], 16) % colors.length];
};

export const getAvatarByName = (name: string) => <AvatarTag user={{ name, color: getAvatarColor(name) }} size={32} />;

export const messageTypeRecoverMap: Record<SnsImMessageType, WhatsAppMessageType> = {
  [SnsImMessageType.AUDIO]: WhatsAppMessageType.AUDIO,
  [SnsImMessageType.IMAGE]: WhatsAppMessageType.IMAGE,
  [SnsImMessageType.VIDEO]: WhatsAppMessageType.VIDEO,
  [SnsImMessageType.FILE]: WhatsAppMessageType.DOCUMENT,
  [SnsImMessageType.TEXT]: WhatsAppMessageType.TEXT,
  [SnsImMessageType.JSX]: WhatsAppMessageType.TEXT,
};

export const messageContentRecoverer: (message: SnsImMessage) => any = message => {
  switch (message.messageType) {
    case SnsImMessageType.TEXT:
      return { text: message.messageText };
    case SnsImMessageType.IMAGE:
    case SnsImMessageType.VIDEO:
    case SnsImMessageType.FILE:
      return {
        mediaUrl: message.messageFile?.src,
        filename: message.messageFile?.fileName,
        fileSize: message.messageFile?.fileSize,
        fileType: '',
      };
  }

  return {};
};

export const messageDirectionConvertMap: Record<WhatsAppMessageDirection, SnsImMessageDirection> = {
  [WhatsAppMessageDirection.LX_TO_WHATSAPP]: SnsImMessageDirection.SEND,
  [WhatsAppMessageDirection.WHATSAPP_TO_LX]: SnsImMessageDirection.RECEIVE,
};

export const messageLoadDirectionConvertMap: Record<SnsImLoadDirection, 'DESC' | 'ASC'> = {
  [SnsImLoadDirection.EARLIER]: 'DESC',
  [SnsImLoadDirection.NEWER]: 'ASC',
};

export const chatLoadDirectionConvertMap: Record<SnsImLoadDirection, 'EARLIER' | 'LATER'> = {
  [SnsImLoadDirection.EARLIER]: 'EARLIER',
  [SnsImLoadDirection.NEWER]: 'LATER',
};

export const messageConverter: (chat: WhatsAppChatItem, message: WhatsAppMessage) => SnsImMessage = (chat, message) => {
  let messageType: SnsImMessageType | undefined = undefined;
  let messageText: string = '';
  let messageFile: SnsImMessageFile | undefined = undefined;
  let messageJsx: React.ReactChild | undefined = undefined;
  let content = {} as Record<string, any>;

  try {
    content = JSON.parse(message.content);
  } catch {
    content = { text: '[消息解析出错]' };
  }

  switch (message.messageType) {
    case WhatsAppMessageType.TEXT:
      messageType = SnsImMessageType.TEXT;
      messageText = content.text;
      break;
    case WhatsAppMessageType.IMAGE:
      if (message.messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
        messageType = SnsImMessageType.JSX;
        messageJsx = <ChatImage content={content} />;
      } else {
        messageType = SnsImMessageType.IMAGE;
        messageFile = {
          src: content.mediaUrl,
          fileName: content.filename || '',
        };
      }
      break;
    case WhatsAppMessageType.VIDEO:
      if (message.messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
        messageType = SnsImMessageType.JSX;
        messageJsx = <ChatVideo content={content} />;
      } else {
        messageType = SnsImMessageType.VIDEO;
        messageFile = {
          src: content.mediaUrl,
          fileName: content.filename || '',
          fileSize: content.fileSize || 0,
        };
      }
      break;
    case WhatsAppMessageType.AUDIO:
      if (message.messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
        messageType = SnsImMessageType.JSX;
        messageJsx = <ChatAudio content={content} />;
      } else {
        messageType = SnsImMessageType.AUDIO;
        messageFile = {
          src: content.mediaUrl,
          fileName: content.filename || '',
          fileSize: content.fileSize || 0,
        };
      }
      break;
    case WhatsAppMessageType.DOCUMENT:
      if (message.messageDirection === WhatsAppMessageDirection.WHATSAPP_TO_LX) {
        messageType = SnsImMessageType.JSX;
        messageJsx = <ChatFile content={content} />;
      } else {
        messageType = SnsImMessageType.FILE;
        messageFile = {
          src: content.mediaUrl,
          fileName: content.filename || '',
          fileSize: content.fileSize || 0,
        };
      }
      break;
    case WhatsAppMessageType.STICKER:
      messageType = SnsImMessageType.TEXT;
      messageText = `[${WhatsAppMessageTypeName.STICKER}消息]`;
      break;
    case WhatsAppMessageType.LOCATION:
      messageType = SnsImMessageType.TEXT;
      messageText = `[${WhatsAppMessageTypeName.LOCATION}消息]`;
      break;
    case WhatsAppMessageType.TEMPLATE:
      try {
        let template = content.template as WhatsAppTemplate;
        const structure = JSON.parse(template.structure as unknown as string);
        template = { ...template, structure };
        const templateFilled = fillTemplateWithTemplatePlaceholders({
          template,
          templatePlaceholders: JSON.parse(content.params) as WhatsAppTemplatePlaceholders,
        });
        messageType = SnsImMessageType.JSX;
        messageJsx = (
          <div
            style={{
              border: `0.5px solid ${variablesC.fill2}`,
              borderRadius: 8,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={() => showTemplatePreviewModal(templateFilled)}
          >
            <TemplatePreview template={templateFilled} />
          </div>
        );
      } catch (error) {
        messageType = SnsImMessageType.TEXT;
        messageText = `[${getTransText('[BUZHICHIDEMOBANLEIXING]')}]`;
      }
      break;
  }

  if (!messageType) {
    messageType = SnsImMessageType.TEXT;
    messageText = '[不支持的消息格式,请在 WhatsApp 查看]';
  }

  let messageDirection = messageDirectionConvertMap[message.messageDirection];
  let messageStatus = SnsImMessageStatus.SENT;
  let messageTime = message.sentAt;

  if (message.deliveryAt) {
    messageStatus = SnsImMessageStatus.DELIVERED;
  }
  if (message.seenAt) {
    messageStatus = SnsImMessageStatus.SEEN;
  }

  const accountName = message.accountName || message.fromName || message.from;
  const accountAvatar = message.accountAvatar || getAvatarByName(accountName);
  const contactName = chat.toName || chat.to;
  const contactAvatar = message.toAvatar || getAvatarByName(contactName);

  return {
    chatId: chat.to,
    accountName,
    accountAvatar,
    contactName,
    contactAvatar,
    messageId: message.messageId,
    messageType,
    messageText,
    messageFile,
    messageJsx,
    messageDirection,
    messageStatus,
    messageTime,
    quoteMessageId: undefined,
    rawData: message,
  };
};

export const chatConverter: (chat: WhatsAppChatItem) => SnsImChat = chat => {
  const { lastMsg } = chat;
  const accountName = lastMsg.accountName || lastMsg.fromName || lastMsg.from;
  const accountAvatar = lastMsg.accountAvatar || getAvatarByName(accountName);
  const contactName = chat.toName || chat.to;
  const contactAvatar = lastMsg.toAvatar || getAvatarByName(contactName);

  return {
    chatId: chat.to,
    chatTime: lastMsg.sentAt,
    platform: undefined,
    accountName,
    accountAvatar,
    contactName,
    contactAvatar,
    contactDescription: chat.to,
    latestMessage: messageConverter(chat, chat.lastMsg),
    latestReceivedMessageTime: chat.latestReceiveMsgTime,
    unreadCount: 0,
    rawData: chat,
  };
};
