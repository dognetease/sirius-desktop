import React, { useMemo } from 'react';
import classNames from 'classnames/bind';
import { MD5 } from 'crypto-js';
import { IMUser, SearchTeamOrgModel, SimpleTeamInfo, Team } from 'api';
import lodashGet from 'lodash/get';
import { FoldIcon, UnfoldIcon } from './icon/foldAvatar';
import styles from './imUserAvatar.module.scss';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import IconCard from '@web-common/components/UI/IconCard';

const realStyles = classNames.bind(styles);
const computeAvatarColor = (str: string): number => {
  let numStr: string = str.replace(/[^\d]/g, '');

  const strlMd5 = MD5(numStr).toString();
  const finalCharcode = strlMd5.charCodeAt(strlMd5.length - 1);
  return finalCharcode % 6;
};

interface FoldAvatarProps {
  fold: boolean;
}

export const FoldAvatar: React.FC<FoldAvatarProps> = ({ fold }) => (
  <div style={{ backgroundColor: '#F4F4F5' }} className={realStyles('defaultAvatar')}>
    {fold ? <FoldIcon /> : <UnfoldIcon />}
  </div>
);

interface UserAvatarApi {
  user: Partial<IMUser> | undefined;
  enableClick?: boolean;
  avatarSize?: number;
  testId?: string;
  [key: string]: any;
}

// im 头像相关
export const UserAvatar: React.FC<UserAvatarApi> = props => {
  const { enableClick = false, user, avatarSize = 32, testId = '' } = props;
  // const subNickname = (name) => name.substring(0, 1).toUpperCase();
  if (lodashGet(props, 'user.avatar.length', 0) !== 0) {
    return (
      <AvatarTag
        className={realStyles('defaultAvatar', {
          enableClick,
        })}
        testId={testId}
        size={avatarSize}
        contactId={user?.contactId}
        propEmail={user?.email}
        user={{
          name: user?.nick || '',
          avatar: user!.avatar,
          email: user?.email || '',
        }}
      />
    );
  }
  return (
    <AvatarTag
      className={realStyles('defaultAvatar', {
        enableClick,
      })}
      testId={testId}
      size={avatarSize}
      contactId={user?.contactId}
      propEmail={user?.email}
      user={{
        name: user?.nick || '',
        color: user?.color || '#6557FF',
        email: user?.email || '',
      }}
    />
  );
};

interface TeamAvatarApi {
  teamId: string;
  enableClick?: boolean;
  teamInfo?: Partial<SearchTeamOrgModel | Team> | SimpleTeamInfo;
  hasHover?: boolean;
  avatarSize?: number;
  discussGroup?: boolean;
  testId?: string;
  [key: string]: any;
}

export const TeamAvatar: React.FC<TeamAvatarApi> = props => {
  const { teamId, enableClick, teamInfo = null, hasHover = false, avatarSize = 32, discussGroup = false, testId = '', ...restProps } = props;
  const avatarIndex = computeAvatarColor(teamId) || 0;
  const avatar = useMemo(() => {
    if (lodashGet(teamInfo, 'avatar.length', 0)) {
      return <img src={teamInfo?.avatar} className={realStyles('teamAvatar')} alt="" />;
    }
    if (discussGroup) {
      return <div className={`im-user-avatar-color ${realStyles('teamAvatarColor')} ${realStyles('teamDiscussGroup')}`} />;
    }
    return <div className={`im-user-avatar-color ${realStyles('teamAvatarColor')} ${realStyles('teamAvatarColor' + avatarIndex)}`} />;
  }, [teamId, teamInfo]);
  return (
    <div
      className={realStyles('defaultAvatar', {
        enableClick,
      })}
      style={{ width: avatarSize, height: avatarSize }}
      {...restProps}
      data-test-id={testId}
    >
      {hasHover && (
        <div className={styles.hoverBg}>
          <IconCard type="camera" />
        </div>
      )}
      {avatar}
    </div>
  );
};
