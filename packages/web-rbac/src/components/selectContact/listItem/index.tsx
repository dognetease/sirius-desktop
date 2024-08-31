import { List, Tooltip } from 'antd';
import React from 'react';
import classnames from 'classnames';
import { EntityTeamOrg, SimpleTeamInfo } from 'api';
import { UIContactModel } from '@web-contact/data';
import { splitSearchHit } from '@web-contact/util';
import { TeamAvatar } from '@web-im/common/imUserAvatar';
import { ContactItem, getColor } from '@web-common/components/util/contact';
import Avatar, { AvatarContact } from '@web-common/components/UI/Avatar';
import styles from './index.module.scss';
import Checkbox from '../Checkbox';

export interface ListItemProps {
  isLeaf?: boolean;
  type: 'normal' | 'search';
  showAvatar?: boolean;
  showCheckbox?: boolean;
  showDelete?: boolean;
  checked?: boolean;
  disableCheck?: boolean;
  selected?: boolean;
  item?: UIContactModel | EntityTeamOrg;
  contactItem?: ContactItem;

  onSelect?(c: UIContactModel | EntityTeamOrg, isChecked?: boolean): void;

  onDelete?(c: ContactItem): void;

  searchText?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ListItem: React.FC<ListItemProps> = props => {
  const {
    isLeaf = true,
    showAvatar,
    item,
    contactItem,
    onSelect,
    onDelete,
    searchText,
    checked,
    disableCheck,
    selected,
    showCheckbox,
    showDelete,
    className,
    style,
    type,
  } = props;
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
  const renderDepartment = (contact: UIContactModel) => {
    if (contact.contact.position === undefined) {
      return '';
    }
    return contact.contact.position.map(de => de.join('/')).join('-');
  };
  const avatarContact = (): AvatarContact => {
    if (!isLeaf) {
      const team = item as EntityTeamOrg;
      return {
        contact: {
          avatar: team!.avatar,
          contactName: team!.orgName,
          color: getColor(team!.originId),
        },
      };
    }
    if (type === 'normal') {
      return {
        contact: {
          avatar: contactItem!.avatar,
          contactName: contactItem!.name,
          color: getColor(contactItem!.email),
          email: contactItem!.email,
        },
      };
    }
    return item as UIContactModel;
  };
  const renderAvatar = () => {
    let teamInfo: SimpleTeamInfo;
    if (!isLeaf) {
      const { id, avatar } = item as EntityTeamOrg;
      const teamId = id.startsWith('team_') ? id.split('team_')[1] : id;
      teamInfo = { teamId, avatar };
    }
    return (
      <div className={styles.itemAvatarContainer}>
        {showCheckbox ? (
          <div className={styles.itemAvatarCheckbox}>
            <Checkbox checked={checked} disabled={disableCheck} />
          </div>
        ) : null}
        <div className={styles.itemAvatarWrap}>{isLeaf ? <Avatar item={avatarContact()} /> : <TeamAvatar teamId={teamInfo!.teamId} teamInfo={teamInfo!} />}</div>
      </div>
    );
  };
  const renderDelete = () => (
    <div
      className={styles.itemDelete}
      onClick={() => {
        onDelete && onDelete(contactItem!);
      }}
    />
  );
  let subtitle;
  let title;
  let titleTip;
  let department = <></>;
  if (!isLeaf) {
    const org = item as EntityTeamOrg;
    title = renderHighLight(org.orgName);
    titleTip = org.orgName;
    subtitle = org.memberNum + '人';
  } else if (type === 'normal') {
    title = contactItem!.name;
    titleTip = contactItem!.name;
    subtitle = contactItem!.email;
  } else if (type === 'search') {
    const model = item as UIContactModel;
    title = renderHighLight(model.contact.contactName);
    titleTip = model.contact.contactName;
    subtitle = renderHighLight(model.contact.hitQueryEmail || model.contact.accountName);
    department = <p className={styles.subtitle}>{renderDepartment(model)}</p>;
  }
  return (
    <List.Item
      style={style}
      onClick={() => {
        onSelect && onSelect(item!, checked);
      }}
      className={classnames(styles.item, styles[type], className, {
        [styles.itemSelect]: selected,
        [styles.itemSelectDisable]: disableCheck,
      })}
    >
      <List.Item.Meta
        className={showDelete ? 'p-right' : ''}
        title={
          <Tooltip title={titleTip} mouseEnterDelay={1}>
            <span>{title}</span>
          </Tooltip>
        }
        avatar={showAvatar ? renderAvatar() : null}
        description={
          <>
            <Tooltip title={isLeaf ? subtitle : ''} mouseEnterDelay={1}>
              <p className={styles.subtitle}>{subtitle}</p>
            </Tooltip>
            {department}
          </>
        }
      />
      {showDelete ? renderDelete() : null}
    </List.Item>
  );
};

export default ListItem;
