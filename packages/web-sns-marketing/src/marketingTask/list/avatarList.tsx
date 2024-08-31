import React from 'react';
import { Popover } from 'antd';
import { SnsAccountInfoShort } from 'api';

import Avatar from '../../components/Avatar';
import style from './avatarList.module.scss';

export interface AvatarListProps {
  accounts: SnsAccountInfoShort[];
  maxCount?: number;
  className?: string;
  avatarSize?: number;
}

export const AvatarList = (props: AvatarListProps) => {
  const { maxCount = 3, accounts, className, avatarSize = 28 } = props;

  const moreIconStyle = {
    width: avatarSize,
    height: avatarSize,
    lineHeight: avatarSize + 'px',
  };

  return (
    <div style={{ display: 'flex', gap: 8 }} className={className}>
      {accounts.slice(0, accounts.length === maxCount + 1 ? maxCount + 1 : maxCount).map(account => (
        <Avatar key={account.accountId} avatar={account.avatar} platform={account.platform} size={avatarSize} />
      ))}
      {accounts.length > maxCount + 1 && (
        <Popover
          destroyTooltipOnHide
          content={
            <div style={{ maxWidth: 400, padding: '8px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {accounts.slice(maxCount).map(account => (
                <Avatar key={account.accountId} avatar={account.avatar} platform={account.platform} size={avatarSize} />
              ))}
            </div>
          }
        >
          <div className={style.more} style={moreIconStyle}>
            <img src={accounts[maxCount].avatar} alt="" />
            <div className={style.mask}>+{accounts.length - maxCount}</div>
          </div>
        </Popover>
      )}
    </div>
  );
};
