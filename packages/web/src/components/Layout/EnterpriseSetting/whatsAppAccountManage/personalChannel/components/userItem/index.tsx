import React, { CSSProperties } from 'react';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import { UserItemInfo } from 'api';
import styles from './style.module.scss';

interface Props {
  user: UserItemInfo;
  style?: CSSProperties;
  avatarSize?: number;
}

const UserItem: React.FC<Props> = ({ user, style, avatarSize }) => (
  <div className={styles.userItem} style={style}>
    <AvatarTag className={styles.avatar} user={{ name: user.nickName, avatar: user.avatarUrl }} size={avatarSize} />
    <span className={styles.nickName}>{user.nickName}</span>
  </div>
);

export default UserItem;
