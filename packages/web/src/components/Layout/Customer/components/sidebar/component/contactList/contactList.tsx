import React from 'react';
import classnames from 'classnames';
import { ContactDetail } from 'api';
import ContactCard from './contactCard';
import style from './contactCard.module.scss';
import { EmptyTips } from '../emptyTips';
import { getIn18Text } from 'api';
interface ContactListProps {
  list?: ContactDetail[];
  onEdit?: (id: string, email?: string) => void;
  readonly?: boolean;
}
export const ContactList = (props: ContactListProps) => {
  const { list, onEdit, readonly } = props;
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className={classnames(style.contactList, 'sirius-scroll')}>
        {list?.map(item => (
          <ContactCard data={item} onEdit={() => onEdit && onEdit(item.contact_id, item.email)} readonly={readonly} />
        ))}
        {!list || list.length === 0 ? <EmptyTips text={getIn18Text('ZANWULIANXIREN')} /> : null}
      </div>
    </div>
  );
};
