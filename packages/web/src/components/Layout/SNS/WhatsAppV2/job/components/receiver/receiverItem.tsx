import React from 'react';
import classnames from 'classnames';
import { WhatsAppFileExtractIndex, WhatsAppFileExtractStatus, WhatsAppFileExtractStatusName } from 'api';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import CloseIcon from '@web-common/components/UI/Icons/svgs/ClosePreview';
import style from './receiverItem.module.scss';
import variables from '@web-common/styles/export.module.scss';

interface ReceiverItemProps {
  className?: string;
  whatsApp: string;
  status: WhatsAppFileExtractStatus;
  content: Record<number, string>;
  onRemove: (whatsApp: string) => void;
}

const ReceiverItem: React.FC<ReceiverItemProps> = props => {
  const { className, whatsApp, status, content, onRemove } = props;

  const contactName = content[WhatsAppFileExtractIndex.CONTACT_NAME];

  return (
    <div className={classnames(style.receiverItem, className)}>
      <AvatarTag
        className={style.avatar}
        size={32}
        user={{
          name: contactName || whatsApp,
          color: `${variables.avatar3}`,
        }}
      />
      <div className={style.content}>
        <div className={style.contactName}>{contactName || whatsApp}</div>
        {contactName && <div className={style.whatsApp}>{whatsApp}</div>}
      </div>
      {/* {status !== WhatsAppFileExtractStatus.SUCCESS && (
        <div className={style.errorStatusName}>
          {WhatsAppFileExtractStatusName[status]}
        </div>
      )} */}
      <CloseIcon onClick={() => onRemove(whatsApp)} />
    </div>
  );
};

export default ReceiverItem;
