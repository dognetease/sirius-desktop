import React from 'react';
import classnames, { Argument as ClassnamesType } from 'classnames';
import { ContactDetail } from 'api';
import ContactCard, { OptionsType } from '@/components/Layout/Customer/components/contactCard/contactCard';
import style from './contacts.module.scss';

interface ContactsProps {
  className?: ClassnamesType;
  list: ContactDetail[];
  mode: 'simple' | 'complete';
  options: OptionsType;
  readOnly?: boolean;
  onWriteMail: (email: string) => void;
  onEdit: (contactId: string) => void;
  onDelete: (contactId: string) => void;
}

const Contacts: React.FC<ContactsProps> = props => {
  const { className, list, mode, options, readOnly, onWriteMail, onEdit, onDelete } = props;

  if (mode === 'simple') {
    return (
      <div className={classnames(style.simple, className)}>
        {list.map(item => (
          <ContactCard
            key={item.contact_id}
            className={style.contactCard}
            data={item}
            mode={mode}
            readOnly={readOnly}
            onWriteMail={onWriteMail}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  if (mode === 'complete') {
    return (
      <div className={classnames(style.complete, className)}>
        <div className={style.completeLayout}>
          {list.map(item => (
            <ContactCard
              key={item.contact_id}
              className={style.contactCard}
              data={item}
              mode={mode}
              options={options}
              readOnly={readOnly}
              onWriteMail={onWriteMail}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

Contacts.defaultProps = {
  list: [],
  mode: 'simple',
  readOnly: false,
  options: ['mail', 'edit'],
  onWriteMail: () => {},
  onEdit: () => {},
  onDelete: () => {},
};

export default Contacts;
