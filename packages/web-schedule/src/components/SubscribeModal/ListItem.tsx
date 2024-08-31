import { List } from 'antd';
import React from 'react';
import classnames from 'classnames';
import styles from './listitem.module.scss';
import { splitSearchHit } from '@web-contact/util';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { ContactItem } from '@web-common/utils/contact_util';

export interface ListItemProps {
  contact: ContactItem;
  onSelect?(c: ContactItem): void;
  searchText?: string;
  currentSelectedId?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ListItem: React.FC<ListItemProps> = ({ contact, onSelect, searchText, currentSelectedId, className, style }) => {
  const renderHighLight = (text: string) => {
    if (!searchText) {
      return text;
    }
    const result = splitSearchHit(searchText, text);
    if (!result) {
      return text;
    }
    return (
      <>
        {result.head}
        <b className={styles.hitText}>{result.target}</b>
        {result.tail}
      </>
    );
  };
  const renderDepartment = () => {
    if (contact.position === undefined) {
      return '';
    }
    return contact.position.map(de => de.join('/')).join('-');
  };
  return (
    <List.Item
      style={style}
      onClick={() => {
        onSelect && onSelect(contact);
      }}
      className={classnames(styles.item, className, {
        [styles.itemSelect]: currentSelectedId === contact.id,
        [styles.itemSelectDisable]: onSelect === undefined,
      })}
    >
      <List.Item.Meta
        title={renderHighLight(contact.name)}
        avatar={
          <AvatarTag
            size={56}
            contactId={contact.id}
            user={{
              name: contact.name,
              avatar: contact.avatar,
            }}
          />
        }
        description={
          <>
            <p className={styles.subtitle}>{renderHighLight(contact.name)}</p>
            <p className={styles.subtitle}>{renderDepartment()}</p>
          </>
        }
      />
    </List.Item>
  );
};

export default ListItem;
