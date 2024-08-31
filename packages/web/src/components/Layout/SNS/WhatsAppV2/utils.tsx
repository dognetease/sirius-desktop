import { WhatsAppPhoneV2, getIn18Text } from 'api';
import React from 'react';
import {
  api,
  SystemApi,
  WhatsAppVariable,
  WhatsAppVariableType,
  WhatsAppFileExtractResult,
  WhatsAppTemplateV2Component,
  WhatsAppTemplateV2,
  WhatsAppJobDetailV2,
  WhatsAppTemplateParamV2,
  WhatsAppChatItemV2,
  WhatsAppMessageTypeV2,
  WhatsAppMessageV2,
  WhatsAppMessageDirection,
  WhatsAppMessageTypeNameV2,
  WhatsAppMessageContentV2,
} from 'api';
import { config } from 'env_def';
import { SnsImChat, SnsImMessage, SnsImMessageType, SnsImMessageFile, SnsImMessageStatus, SnsImMessageDirection, SnsImLoadDirection } from '@web-sns-im';
import { cloneDeep } from 'lodash';
import { navigate } from '@reach/router';
import { openWebUrlWithLoginCode } from '@web-common/utils/utils';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import TemplatePreview, { showTemplatePreviewModal } from './components/template/templatePreview';
import CssVariables from '@web-common/styles/export.module.scss';
import Modal from '@web-common/components/UI/Modal/SiriusModal';

const stage = config('stage') as string;
const systemApi = api.getSystemApi() as SystemApi;
const isElectron = systemApi.isElectron();

export const variableRegExp = /\{\{(.*?)\}\}/g;

export const initialComponents: WhatsAppTemplateV2Component[] = [
  {
    type: 'HEADER',
    format: 'IMAGE',
    text: '',
    example: {},
  },
  {
    type: 'BODY',
    text: '',
    example: {
      body_text: [[]],
    },
  },
  {
    type: 'FOOTER',
    text: '',
  },
  {
    type: 'BUTTONS',
    buttons: [
      {
        type: 'URL',
        text: '',
        url: '',
      },
    ],
  },
];

export const orderComponents = (template: WhatsAppTemplateV2, completeItems?: boolean) => {
  const nextComponents = cloneDeep(initialComponents).map(initialItem => {
    const templateItem = template.components.find(item => item.type === initialItem.type);

    return templateItem ? templateItem : completeItems ? initialItem : null;
  });
  return {
    ...template,
    components: nextComponents.filter(item => item) as unknown as WhatsAppTemplateV2Component[],
  };
};
export const getComponentsItems = (template: WhatsAppTemplateV2) => {
  const header = template.components.find(item => item.type === 'HEADER');
  const body = template.components.find(item => item.type === 'BODY');
  const footer = template.components.find(item => item.type === 'FOOTER');
  const buttons = template.components.find(item => item.type === 'BUTTONS');

  return { header, body, footer, buttons };
};
export const getPreviewTextFromTemplate = (template: WhatsAppTemplateV2) => {
  let text = '';
  const { header, body, footer, buttons } = getComponentsItems(template);

  if (header && header.format === 'TEXT') {
    text += header.text;
  }
  if (body) {
    text += body.text;
  }
  if (footer) {
    text += footer.text;
  }
  return text;
};

export const orderTemplateParams = (job: WhatsAppJobDetailV2) => {
  const types = ['header', 'body', 'button'];

  job = cloneDeep(job);

  if (!job.templateParams) return job;

  job.templateParams = job.templateParams.sort((a, b) => {
    const aIndex = types.indexOf(a.type);
    const bIndex = types.indexOf(b.type);

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    } else {
      if (a.type !== 'button') {
        return 1;
      } else {
        return (a.index || 0) - (b.index || 0);
      }
    }
  });

  return job;
};

export const getVariablesByText: (text: string) => WhatsAppVariable[] = text => {
  const variableNames = text.match(variableRegExp) || [];
  return variableNames.map(() => ({
    type: WhatsAppVariableType.FIXED,
    value: '',
  }));
};

export const getTemplateParams = (template: WhatsAppTemplateV2) => {
  const templateParams: WhatsAppTemplateParamV2[] = [];

  template.components.forEach(item => {
    if (item.type === 'HEADER') {
      if (item.format === 'IMAGE') {
        templateParams.push({
          type: 'header',
          parameters: [
            {
              type: WhatsAppVariableType.FIXED,
              value: item.example?.custom_header_handle_url,
            },
          ],
        });
      }
      if (item.format === 'TEXT') {
        templateParams.push({
          type: 'header',
          parameters: getVariablesByText(item.text || ''),
        });
      }
    }
    if (item.type === 'BODY') {
      templateParams.push({
        type: 'body',
        parameters: getVariablesByText(item.text || ''),
      });
    }
  });

  return templateParams;
};

export const fillTemplateWithTemplateParams: (params: {
  extraction?: WhatsAppFileExtractResult;
  template: WhatsAppTemplateV2;
  templateParams: WhatsAppTemplateParamV2[];
}) => WhatsAppTemplateV2 = ({ extraction, template, templateParams }) => {
  template = cloneDeep(template);

  const { header, body } = getComponentsItems(template);
  const headerParams = templateParams.find(item => item.type === 'header');
  const bodyParams = templateParams.find(item => item.type === 'body');
  const nextComponents = template.components.map(item => {
    if (item.type === 'HEADER') {
      if (item.format === 'IMAGE') {
        const imageValue = headerParams?.parameters?.[0]?.value || headerParams?.parameters?.[0]?.image?.link || undefined;

        item.example = { custom_header_handle_url: imageValue };
      }
      if (item.format === 'TEXT') {
        const variables = headerParams?.parameters || [];

        variables.forEach((variable, index) => {
          const variableName = `{{${index + 1}}}`;
          const textValue = header?.text || '';

          if (variable.type === WhatsAppVariableType.FIXED) {
            if (variable.value) {
              item.text = textValue.replace(variableName, variable.value);
            }
          }
          if (variable.type === WhatsAppVariableType.FILE_FIELD) {
            if (variable.value !== undefined) {
              const variableFieldName = extraction?.header[variable.value] || '';

              item.text = textValue.replace(variableName, variableFieldName);
            }
          }
          if (variable.type === 'text') {
            if (variable.text) {
              item.text = textValue.replace(variableName, variable.text);
            }
          }
        });
      }
    }
    if (item.type === 'BODY') {
      const variables = bodyParams?.parameters || [];

      variables.forEach((variable, index) => {
        const variableName = `{{${index + 1}}}`;
        const textValue = body?.text || '';

        if (variable.type === WhatsAppVariableType.FIXED) {
          if (variable.value) {
            item.text = textValue.replace(variableName, variable.value);
          }
        }
        if (variable.type === WhatsAppVariableType.FILE_FIELD) {
          if (variable.value !== undefined) {
            const variableFieldName = extraction?.header[variable.value] || '';

            item.text = textValue.replace(variableName, variableFieldName);
          }
        }
        if (variable.type === 'text') {
          if (variable.text) {
            item.text = textValue.replace(variableName, variable.text);
          }
        }
      });
    }
    return item;
  });

  return {
    ...template,
    components: nextComponents,
  };
};

export const messageTypeRecoverMap: Record<SnsImMessageType, WhatsAppMessageTypeV2> = {
  [SnsImMessageType.AUDIO]: WhatsAppMessageTypeV2.audio,
  [SnsImMessageType.IMAGE]: WhatsAppMessageTypeV2.image,
  [SnsImMessageType.VIDEO]: WhatsAppMessageTypeV2.video,
  [SnsImMessageType.FILE]: WhatsAppMessageTypeV2.document,
  [SnsImMessageType.TEXT]: WhatsAppMessageTypeV2.text,
  [SnsImMessageType.JSX]: WhatsAppMessageTypeV2.text,
};

export const chatLoadDirectionConvertMap: Record<SnsImLoadDirection, 'EARLIER' | 'LATER'> = {
  [SnsImLoadDirection.EARLIER]: 'EARLIER',
  [SnsImLoadDirection.NEWER]: 'LATER',
};

export const messageContentRecoverer: (message: SnsImMessage) => WhatsAppMessageContentV2 = message => {
  switch (message.messageType) {
    case SnsImMessageType.TEXT:
      return {
        text: {
          body: message.messageText,
        },
      } as WhatsAppMessageContentV2;
    case SnsImMessageType.IMAGE:
      return {
        image: {
          link: message.messageFile!.src,
          caption: message.messageFile!.fileName,
        },
      } as WhatsAppMessageContentV2;
    case SnsImMessageType.VIDEO:
      return {
        video: {
          link: message.messageFile!.src,
          caption: message.messageFile!.fileName,
        },
      } as WhatsAppMessageContentV2;
    case SnsImMessageType.FILE:
      return {
        document: {
          link: message.messageFile!.src,
          filename: message.messageFile!.fileName,
        },
      } as WhatsAppMessageContentV2;
  }

  return {} as WhatsAppMessageContentV2;
};

export const messageDirectionConvertMap: Record<WhatsAppMessageDirection, SnsImMessageDirection> = {
  [WhatsAppMessageDirection.LX_TO_WHATSAPP]: SnsImMessageDirection.SEND,
  [WhatsAppMessageDirection.WHATSAPP_TO_LX]: SnsImMessageDirection.RECEIVE,
};

export const loadDirectionConvertMap: Record<SnsImLoadDirection, 'DESC' | 'ASC'> = {
  [SnsImLoadDirection.EARLIER]: 'DESC',
  [SnsImLoadDirection.NEWER]: 'ASC',
};

export const getAvatarByName = (name: string) => <AvatarTag user={{ name, color: getAvatarColor(name) }} size={32} />;

export const messageConverter: (chat: WhatsAppChatItemV2, message: WhatsAppMessageV2, activePhone?: WhatsAppPhoneV2) => SnsImMessage = (chat, message, activePhone) => {
  let messageType: SnsImMessageType | undefined = undefined;
  let messageText: string = '';
  let messageFile: SnsImMessageFile | undefined = undefined;
  let messageJsx: React.ReactChild | undefined = undefined;

  switch (message.messageType) {
    case WhatsAppMessageTypeV2.text:
      messageType = SnsImMessageType.TEXT;
      messageText = message.content.text!.body;
      break;
    case WhatsAppMessageTypeV2.image:
      messageType = SnsImMessageType.IMAGE;
      messageFile = {
        src: message.content.image!.link,
        fileName: message.content.image!.caption,
      };
      break;
    case WhatsAppMessageTypeV2.video:
      messageType = SnsImMessageType.VIDEO;
      messageFile = {
        src: message.content.video!.link,
        fileName: message.content.video!.caption,
      };
      break;
    case WhatsAppMessageTypeV2.audio:
      messageType = SnsImMessageType.AUDIO;
      messageFile = {
        src: message.content.audio!.link,
      };
      break;
    case WhatsAppMessageTypeV2.sticker:
      messageType = SnsImMessageType.TEXT;
      messageText = `[${WhatsAppMessageTypeNameV2.sticker}消息]`;
      break;
    case WhatsAppMessageTypeV2.document:
      messageType = SnsImMessageType.FILE;
      messageFile = {
        src: message.content.document!.link,
        fileName: message.content.document!.filename,
      };
      break;
    case WhatsAppMessageTypeV2.location:
      messageType = SnsImMessageType.TEXT;
      messageText = `[${WhatsAppMessageTypeNameV2.location}消息]`;
      break;
    case WhatsAppMessageTypeV2.template:
      const filledTemplate = fillTemplateWithTemplateParams({
        template: message.template,
        templateParams: message.content.template!.components,
      });
      messageType = SnsImMessageType.JSX;
      messageJsx = (
        <div
          style={{
            border: `0.5px solid ${CssVariables.fill3}`,
            borderRadius: 8,
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={() => showTemplatePreviewModal(filledTemplate)}
        >
          <TemplatePreview template={filledTemplate} />
        </div>
      );
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

  const verifiedAccountName = activePhone?.verified_name;
  const defaultAccountName = message.accountName || message.from;
  const accountName = verifiedAccountName ? `${verifiedAccountName} (${defaultAccountName})` : defaultAccountName;
  const accountAvatar = getAvatarByName(defaultAccountName);
  const contactName = chat.toName || chat.to;
  const contactAvatar = getAvatarByName(contactName);

  return {
    chatId: chat.chatId,
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

export const getAvatarColor = (name: string) => {
  const colors = ['#6557FF', '#00CCAA', '#FE6C5E', '#00C4D6', '#A259FF', '#4C6AFF'];
  const emailMd5 = systemApi.md5(name);

  return colors[parseInt(emailMd5[emailMd5.length - 1], 16) % colors.length];
};

export const chatConverter: (chat: WhatsAppChatItemV2) => SnsImChat = chat => {
  const accountName = chat.from;
  const contactName = chat.toName || chat.to;
  const contactAvatar = getAvatarByName(contactName);

  return {
    chatId: chat.chatId,
    chatTime: chat.lastMsgTime,
    platform: undefined,
    accountName,
    accountAvatar: '',
    contactName,
    contactAvatar,
    contactDescription: chat.to,
    latestMessage: messageConverter(chat, chat.lastMsg),
    latestReceivedMessageTime: chat.latestReceiveMsgTime,
    unreadCount: 0,
    rawData: chat,
  };
};

export const handleRegisterStart = (type: 'register' | 'add_phone', callback: () => void) => {
  if (isElectron) {
    const webUrlMap: Record<string, string> = {
      prod: 'https://waimao.office.163.com/#whatsAppRegister?page=whatsAppRegister&from=electron',
      prev: 'https://waimao-pre.office.163.com/#whatsAppRegister?page=whatsAppRegister&from=electron',
      test: 'https://waimao-classic-test1.cowork.netease.com/#whatsAppRegister?page=whatsAppRegister&from=electron',
    };
    const webUrl = webUrlMap[stage] || webUrlMap.test;

    const registerHandler = () => {
      openWebUrlWithLoginCode(webUrl);

      Modal.info({
        title: getIn18Text('CAOZUOTISHI'),
        content: type === 'register' ? getIn18Text('SHIFOUZHUCECHENGGONG？') : getIn18Text('SHIFOUTIANJIACHENGGONG？'),
        okText: type === 'register' ? getIn18Text('YIZHUCE') : getIn18Text('YITIANJIA'),
        cancelText: type === 'register' ? getIn18Text('ZHUCESHIBAI') : getIn18Text('TIANJIASHIBAI'),
        onOk: callback,
      });
    };

    registerHandler();
  } else {
    navigate('#whatsAppRegister?page=whatsAppRegister&from=web');
  }
};
