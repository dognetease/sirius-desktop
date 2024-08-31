import React, { useMemo } from 'react';
import { ContactModel } from 'api';
import { getCharAvatar } from '@web-contact/util';
import { UserCardPopover } from '../UserCard';
import { Tooltip } from 'antd';

import styles from './index.module.scss';

export interface AvatarProps {
  info: ContactModel;
  cursorColor: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  info: {
    contact: { avatar, color, contactName },
  },
  cursorColor,
}) => {
  const name = useMemo(() => getCharAvatar(contactName), [contactName]);

  return (
    <div className={styles.coordinatorAvatarWrapper}>
      {avatar ? (
        <img className={styles.avatarImg} src={avatar} alt={contactName} />
      ) : (
        <div className={styles.avatarColorImg} style={{ background: color || '#8dd6bc' }}>
          {name}
        </div>
      )}
      {color && <span className={styles.avatarCursor} style={{ backgroundColor: cursorColor }}></span>}
    </div>
  );
};

export const AvatarWithPopover: React.FC<AvatarProps> = ({ info, cursorColor }) => {
  return (
    <UserCardPopover contactInfo={info}>
      <div>
        <Avatar info={info} cursorColor={cursorColor} />
      </div>
    </UserCardPopover>
  );
};

export interface AvatarWithPopoverTooltipProps extends AvatarProps {
  tooltipPlacement?: 'bottom' | 'left';
  tooltipTrigger?: 'hover';
  zIndex?: number;
}

export const AvatarWithPopoverTooltip: React.FC<AvatarWithPopoverTooltipProps> = ({
  tooltipPlacement = 'bottom',
  tooltipTrigger = 'hover',
  zIndex = 998,
  info,
  cursorColor,
}) => {
  return (
    <UserCardPopover contactInfo={info}>
      <Tooltip overlayClassName={styles.coordinatorTooltip} placement={tooltipPlacement} title={info.contact.contactName} trigger={tooltipTrigger} zIndex={zIndex}>
        <div>
          <Avatar info={info} cursorColor={cursorColor} />
        </div>
      </Tooltip>
    </UserCardPopover>
  );
};
