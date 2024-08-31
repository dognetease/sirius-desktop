import React from 'react';
import classnames, { Argument as ClassnamesType } from 'classnames';
import { AttachmentItem } from 'api';
import IconCard, { IconMapKey } from '@web-common/components/UI/IconCard';
import style from './attachments.module.scss';

interface AttachmentsProps {
  className: ClassnamesType;
  list: AttachmentItem[];
  onItemClick: () => void;
}

const Attachments: React.FC<AttachmentsProps> = props => {
  const { className, list, onItemClick } = props;

  if (!(Array.isArray(list) && !!list.length)) return null;

  return (
    <div className={classnames([style.attachments, className])}>
      {list.map(item => (
        <div className={style.item} key={item.id} onClick={onItemClick}>
          <IconCard type={item.file_type as IconMapKey} width={16} height={16} />
          <div className={style.filename}>{item.file_name}</div>
        </div>
      ))}
    </div>
  );
};

Attachments.defaultProps = {};

export default Attachments;
