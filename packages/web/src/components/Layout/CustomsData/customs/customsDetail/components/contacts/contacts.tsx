import React from 'react';
import classnames, { Argument as ClassnamesType } from 'classnames';
import { ContactDetail, customsContactItem as contactsType } from 'api';
import { Empty } from 'antd';
import ContactCard, { OptionsType } from '../contactCard/contactCard';
// import ContactCard, { OptionsType } from '@/components/Layout/Customer/components/contactCard/contactCard';
import style from './contacts.module.scss';

interface ContactsProps {
  className?: ClassnamesType;
  list: contactsType[];
  mode: 'simple' | 'complete';
  options?: OptionsType;
  hiddenFields?: string[];
  completeHeight?: number;
  onWriteMail?: (email: string) => void;
  onEdit?: (contactId: string) => void;
  onDelete?: (contactId: string) => void;
}

const Contacts: React.FC<ContactsProps> = props => {
  const { className, list, mode, options, hiddenFields, completeHeight, onWriteMail, onEdit, onDelete } = props;

  if (!(Array.isArray(list) && list.length)) {
    return <Empty className={style.empty} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  if (mode === 'simple') {
    return (
      <div className={classnames(style.simple, className)}>
        {list.map((item, index) => (
          <ContactCard
            key={index}
            className={style.contactCard}
            data={item}
            mode={mode}
            options={options}
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
              key={item.email}
              className={style.contactCard}
              data={item}
              mode={mode}
              options={options}
              hiddenFields={hiddenFields}
              completeHeight={completeHeight}
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
  options: ['mail', 'edit'],
};

export default Contacts;
