import React, { useState, useEffect, forwardRef } from 'react';
import classnames from 'classnames';
import { apiHolder, apis, ContactApi, OrgApi, WhatsAppMessage, WhatsAppMessageDirection, WhatsAppContact, EntityContact } from 'api';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import ChatMessageRenderer from './chatMessageRenderer';
import { renderMessageTime } from '@/components/Layout/SNS/WhatsApp/utils';
import style from './chatMessage.module.scss';
import variables from '@web-common/styles/export.module.scss';
interface ChatMessageProps {
  className?: string;
  showTime: boolean;
  contact: WhatsAppContact;
  message: WhatsAppMessage;
}

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;

const { LX_TO_WHATSAPP, WHATSAPP_TO_LX } = WhatsAppMessageDirection;

const ChatMessage: React.FC<ChatMessageProps> = forwardRef<HTMLDivElement, ChatMessageProps>((props, ref) => {
  const { className, showTime, contact, message } = props;
  const { sentAt, messageDirection } = message;

  const contactName = contact.contactName || contact.contactWhatsApp;

  const [accountInfo, setAccountInfo] = useState<EntityContact | null>(null);

  useEffect(() => {
    contactApi.doGetContactById(message.accountId).then(accounts => {
      accounts[0] && setAccountInfo(accounts[0].contact);
    });
  }, [message.accountId]);

  return (
    <div className={classnames(style.chatMessage, className)} ref={ref}>
      {showTime && <div className={classnames(style.time)}>{renderMessageTime(sentAt)}</div>}
      {messageDirection === LX_TO_WHATSAPP && (
        <div className={classnames(style.row, style.rowAlignRight)}>
          <div className={classnames(style.content)}>
            <div className={classnames(style.contactName)}>{accountInfo?.contactName}</div>
            <div className={classnames(style.bubbleWrapper)}>
              <div className={classnames(style.bubble)}>
                <ChatMessageRenderer message={message} />
              </div>
            </div>
          </div>
          <div className={classnames(style.avatar)}>
            <AvatarTag
              user={{
                name: accountInfo?.contactName,
                email: accountInfo?.accountName,
              }}
              size={32}
            />
          </div>
        </div>
      )}
      {messageDirection === WHATSAPP_TO_LX && (
        <div className={classnames(style.row, style.rowAlignLeft)}>
          <div className={classnames(style.avatar)}>
            <AvatarTag
              user={{
                name: contact.contactName || contact.contactWhatsApp,
                color: `${variables.avatar3}`,
              }}
              size={32}
            />
          </div>
          <div className={classnames(style.content)}>
            <div className={classnames(style.contactName)}>{contactName}</div>
            <div className={classnames(style.bubbleWrapper)}>
              <div className={classnames(style.bubble)}>
                <ChatMessageRenderer message={message} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ChatMessage;
