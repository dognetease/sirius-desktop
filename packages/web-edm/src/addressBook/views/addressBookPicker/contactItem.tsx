import React, { MouseEventHandler } from 'react';
import classnames from 'classnames';
import { Checkbox } from 'antd';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import CloseIcon from '@web-common/components/UI/Icons/svgs/ClosePreview';
import style from './contactItem.module.scss';

interface ContactItemProps {
  name: string;
  email: string;
  checked?: boolean;
  checkable?: boolean;
  disabled?: boolean;
  closable?: boolean;
  interactive?: boolean;
  onClick?: MouseEventHandler;
  onClose?: () => void;
}

const ContactItem: React.FC<ContactItemProps> = props => {
  const { name, email, checked, checkable, disabled, closable, interactive, onClick, onClose } = props;

  return (
    <div
      className={classnames(style.contactItem, {
        [style.disabled]: disabled,
        [style.interactive]: interactive,
      })}
      onClick={event => !disabled && onClick && onClick(event)}
    >
      {checkable && <Checkbox checked={checked} disabled={disabled} />}
      <AvatarTag className={style.avatar} user={{ name, email }} size={32} innerStyle={{ border: 'none' }} />
      <div className={style.content}>
        <div className={style.name}>{name || email}</div>
        {name && <div className={style.email}>{email}</div>}
      </div>
      {closable && <CloseIcon onClick={onClose} />}
    </div>
  );
};

ContactItem.defaultProps = {};

export default ContactItem;
