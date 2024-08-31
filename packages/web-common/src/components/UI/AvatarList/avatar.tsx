import React from 'react';
import { Tooltip } from 'antd';
import { UserAccount } from './avatar-list';
import styles from './avatar.module.scss';
import AvatarTag from '../Avatar/avatarTag';

interface IAvatarProps {
  user: UserAccount;
  onClick?: () => void;
  /** 是否展示红点 */
  showRedDot?: boolean;
  isSwitching: boolean;
}

export const SimpleAvatar = (props: IAvatarProps) => {
  const { user, onClick, showRedDot = false, isSwitching } = props;
  const { email, isMobileBindAccount } = user;
  return (
    <Tooltip title={email || ''} key={email} trigger={['hover']} placement="right">
      <div className={styles.avatarWrapper} onClick={onClick}>
        {isSwitching && (
          <div className={styles.avatarLoadingWrap}>
            {' '}
            <div className={styles.avatarLoading}></div>{' '}
          </div>
        )}
        <AvatarTag size={32} user={user} />
        {isMobileBindAccount && <div className={styles.avatarLink} />}
        {showRedDot && <div className={styles.avatarRedDot} />}
      </div>
    </Tooltip>
  );
};
