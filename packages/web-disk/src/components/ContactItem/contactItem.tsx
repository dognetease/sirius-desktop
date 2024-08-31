import React from 'react';
import { api, apis, ContactAndOrgApi, ContactModel, EntityOrg, EntityTeamOrg } from 'api';
import PrivilegeDropdown from '../PrivilegeDropdown/dropdown';
import { highlightName, highlightEmail } from '@web-mail-write/util';
import GroupSvg from '@web-common/components/UI/Icons/svgs/GroupSvg';
import { FolderSvg } from '@web-common/components/UI/Icons/svgs/ReadListSvgs';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { TeamAvatar } from '@web-im/common/imUserAvatar';
import styles from './contactItem.module.scss';
import { CoactorPrivilege } from './../../utils';
import { getIn18Text } from 'api';
const GroupIcon: React.FC<{}> = () => (
  <div className={styles.groupIcon}>
    <GroupSvg />
  </div>
);
export interface OptionItemProps<T> {
  item: T;
  search?: string;
  privilege?: CoactorPrivilege;
  coactorPrivileges?: CoactorPrivilege[];
  showPrivilege?: boolean;
  operPrivilege?: boolean;
  changePrivilege?: Function;
  removeItem?: Function;
}
const contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
const PersonItem: React.FC<OptionItemProps<ContactModel>> = props => {
  const { item, search, coactorPrivileges, privilege, showPrivilege = false, operPrivilege = false } = props;
  if (!item?.contact) {
    return null;
  }
  const {
    contact: { contactName, hitQuery, position = [], avatar, color, id },
    contactInfo,
  } = item;
  const org = (position[0] || []).join('-');
  const htmlName = highlightName(contactName, hitQuery, search, styles.hitText);
  const highlightedEmail = highlightEmail(contactApi.doGetModelDisplayEmail(item), contactInfo, search, styles.hitText);
  const htmlEmail = htmlName ? `（${highlightedEmail}）` : highlightedEmail;
  return (
    <div className={styles.optionItem} key={item.contact.id}>
      <AvatarTag
        style={{ marginRight: '12px', marginLeft: '4px' }}
        size={32}
        contactId={id}
        user={{
          name: contactName,
          avatar,
          color,
        }}
      />
      <div className={styles.contactInfo}>
        <div className={styles.infoLine}>
          <span
            className={styles.optionContactName}
            dangerouslySetInnerHTML={{
              __html: htmlName + htmlEmail,
            }}
          />
          {showPrivilege &&
            (privilege ? (
              <span className={styles.privilege}>
                {getIn18Text('YISHOUYU')}
                {privilege}
                {getIn18Text('QUANXIAN')}
              </span>
            ) : (
              <span className={styles.privilege}>{item.privilege}</span>
            ))}
          {operPrivilege && (
            <PrivilegeDropdown
              item={item}
              privileges={coactorPrivileges}
              privilege={item.privilege}
              linkStyle={styles.dropdownLink}
              changePrivilege={props.changePrivilege}
              removeItem={props.removeItem}
            />
          )}
        </div>
        <div className={styles.optionOrg}>{org}</div>
      </div>
    </div>
  );
};
const OrgItem: React.FC<OptionItemProps<EntityOrg>> = props => {
  const { item, search, coactorPrivileges, privilege, showPrivilege = false, operPrivilege = false } = props;
  if (!item?.orgName) {
    return null;
  }
  const htmlName = highlightName(item.orgName, [], search, styles.hitText);
  return (
    <div className={styles.optionItem} key={item.id}>
      <GroupIcon />
      <div className={styles.contactInfo}>
        <div className={styles.infoLine}>
          <span
            className={styles.optionContactName}
            dangerouslySetInnerHTML={{
              __html: htmlName,
            }}
          />
          {showPrivilege &&
            (privilege ? (
              <span className={styles.privilege}>
                {getIn18Text('YISHOUYU')}
                {privilege}
                {getIn18Text('QUANXIAN')}
              </span>
            ) : (
              <span className={styles.privilege}>{item.privilege}</span>
            ))}
          {operPrivilege && (
            <PrivilegeDropdown
              item={item}
              privileges={coactorPrivileges}
              privilege={item.privilege}
              linkStyle={styles.dropdownLink}
              changePrivilege={props.changePrivilege}
              removeItem={props.removeItem}
            />
          )}
        </div>
      </div>
    </div>
  );
};
const TeamItem: React.FC<OptionItemProps<EntityTeamOrg>> = props => {
  const { item, search, coactorPrivileges, privilege, showPrivilege = false, operPrivilege = false } = props;
  if (!item?.owner) {
    return null;
  }
  const { orgName, memberNum, topUsers } = item;
  const htmlName = highlightName(orgName, ['owner'], search, styles.hitText);
  // electron本地通讯录同步存在差异会导致topUsers中 contact 为undefined的情况，导致白屏，临时加个容错
  const names = !topUsers?.length ? '' : topUsers.map(item => item.contact?.contactName || '');
  const intro = !topUsers?.length ? '' : `${names.join('/')}${memberNum > 3 && topUsers.length > 0 ? ` 等共${memberNum}人` : ''}`;
  return (
    <div className={styles.optionItem} key={item.id}>
      <TeamAvatar style={{ width: '32px', height: '32px', marginRight: '12px' }} teamId={item.id.substr(item.id.indexOf('_') + 1, item.id.length)} teamInfo={item} />
      <div className={styles.contactInfo}>
        <div className={styles.infoLine}>
          <span
            className={styles.optionContactName}
            dangerouslySetInnerHTML={{
              __html: htmlName,
            }}
          />
          {showPrivilege &&
            (privilege ? (
              <span className={styles.privilege}>
                {getIn18Text('YISHOUYU')}
                {privilege}
                {getIn18Text('QUANXIAN')}
              </span>
            ) : (
              <span className={styles.privilege}>{item.privilege}</span>
            ))}
          {operPrivilege && (
            <PrivilegeDropdown
              item={item}
              privileges={coactorPrivileges}
              privilege={item.privilege}
              linkStyle={styles.dropdownLink}
              changePrivilege={props.changePrivilege}
              removeItem={props.removeItem}
            />
          )}
        </div>
        <div className={styles.optionOrg}>{intro}</div>
      </div>
    </div>
  );
};
const FolderIcon: React.FC<{}> = () => (
  <div className={styles.folderIcon}>
    <FolderSvg />
  </div>
);
export const ContactItem: React.FC<OptionItemProps<ContactModel | EntityOrg | string>> = props => {
  const { item } = props;
  if ((item as ContactModel)?.contact) {
    return <PersonItem {...props} item={item as ContactModel} />;
  }
  // 群组 也有orgName 用owner区分
  if ((item as EntityTeamOrg)?.owner) {
    return <TeamItem {...props} item={item as EntityTeamOrg} />;
  }
  if ((item as EntityOrg)?.orgName) {
    return <OrgItem {...props} item={item as EntityOrg} />;
  }
  if (typeof item === 'string') {
    return (
      <div className={styles.optionItem}>
        <FolderIcon />
        <div className={styles.contactInfo}>
          <div className={styles.infoLine}>
            <span className={styles.optionContactName}>{item}</span>
            <span className={styles.privilege}>{getIn18Text('LAIZIGAIWENJIAN')}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
export default ContactItem;
