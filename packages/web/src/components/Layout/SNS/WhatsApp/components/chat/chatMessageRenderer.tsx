import React from 'react';
import classnames from 'classnames';
import { WhatsAppMessage, WhatsAppMessageType, WhatsAppMessageTypeName, WhatsAppTemplate, WhatsAppTemplatePlaceholders } from 'api';
import TemplatePreview, { showTemplatePreviewModal } from '../template/templatePreview';
import { fillTemplateWithTemplatePlaceholders } from '@/components/Layout/SNS/WhatsApp/utils';
import { ChatImage } from './ChatItem/ChatImage';
import { ChatFile } from './ChatItem/ChatFile';
import { getTransText } from '@/components/util/translate';
import style from './chatMessageRenderer.module.scss';
import { getIn18Text } from 'api';
interface ChatMessageRendererProps {
  className?: string;
  message: WhatsAppMessage;
}
const ChatMessageRenderer: React.FC<ChatMessageRendererProps> = props => {
  const { className, message } = props;
  const { messageType, content: contentString } = message;
  let children: React.ReactElement | React.ReactChild = getTransText('BUZHICHIDEXIAOXILEIXING');
  let content = {} as Record<string, any>;
  try {
    content = JSON.parse(contentString);
  } catch (error) {
    // 兼容旧数据模板格式不正确，导致的 JSON.parse 转化异常
  }
  if (messageType === WhatsAppMessageType.TEXT) {
    children = content.text;
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
      children = (
        <div className={style.templatePreview} onClick={() => showTemplatePreviewModal(templateFilled)}>
          <TemplatePreview template={templateFilled} />
        </div>
      );
    } catch (error) {
      // 兼容旧数据模板格式不正确，导致的模板渲染异常
      children = getIn18Text('[BUZHICHIDEMOBANLEIXING]');
    }
  }
  if (messageType === WhatsAppMessageType.IMAGE) {
    children = <ChatImage content={content} />;
  }
  if (messageType === WhatsAppMessageType.DOCUMENT) {
    children = <ChatFile content={content} />;
  }
  if (messageType === WhatsAppMessageType.VIDEO) {
    children = `${getTransText('BUZHICHIDEXIAOXILEIXING')}-${WhatsAppMessageTypeName.VIDEO}`;
  }
  if (messageType === WhatsAppMessageType.LOCATION) {
    children = `${getTransText('BUZHICHIDEXIAOXILEIXING')}-${WhatsAppMessageTypeName.LOCATION}`;
  }
  if (messageType === WhatsAppMessageType.STICKER) {
    children = `${getTransText('BUZHICHIDEXIAOXILEIXING')}-${WhatsAppMessageTypeName.STICKER}`;
  }
  if (messageType === WhatsAppMessageType.CONTACT) {
    children = `${getTransText('BUZHICHIDEXIAOXILEIXING')}-${WhatsAppMessageTypeName.CONTACT}`;
  }
  if (messageType === WhatsAppMessageType.AUDIO) {
    children = `${getTransText('BUZHICHIDEXIAOXILEIXING')}-${WhatsAppMessageTypeName.AUDIO}`;
  }
  return <div className={classnames(style.chatMessageRenderer, className)}>{children}</div>;
};
export default ChatMessageRenderer;
