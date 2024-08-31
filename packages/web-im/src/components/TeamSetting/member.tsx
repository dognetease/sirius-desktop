import React from 'react';
import classnames from 'classnames/bind';
import { UserAvatar } from '../../common/imUserAvatar';
import { TeamMemberInfo } from '../../subcontent/store/memberProvider';
import styles from './member.module.scss';
import AddMangerIcon from '@web-common/components/UI/Icons/svgs/AddManager';
import RemoveManagerIcon from '@web-common/components/UI/Icons/svgs/RemoveManager';
import RemoveMemberIcon from '@web-common/components/UI/Icons/svgs/RemoveMember';
import { PopoverUser } from '../../common/usercard/userCard';
import { Tooltip } from 'antd';
import { getIn18Text } from 'api';
const realStyle = classnames.bind(styles);
type myRoleType = 'owner' | 'manager' | 'normal';
interface Props {
  member: TeamMemberInfo;
  removeMember(member: TeamMemberInfo): any;
  addManager(member: TeamMemberInfo): any;
  removeManager(member: TeamMemberInfo);
  myRoleType: myRoleType;
  avatarSize?: number;
}
const roleWeights = {
  owner: 7,
  manager: 3,
  normal: 1,
};
export const MemberItem: React.FC<Props> = props => {
  const { member, removeMember, removeManager, addManager, myRoleType, avatarSize } = props;
  return (
    <div data-test-id="im_session_setting_member_item" className={realStyle('memberItemWrapper')}>
      <PopoverUser user={member.user}>
        <div>
          <UserAvatar user={member.user} avatarSize={avatarSize} />
        </div>
      </PopoverUser>
      <p data-test-id="im_session_setting_member_item_name" className={realStyle('memberName')}>
        {member.user?.nick}
      </p>
      {member.type === 'owner' && (
        <span data-test-id="im_session_setting_member_item_rolename" className={realStyle('role')}>
          {getIn18Text('QUNZHU')}
        </span>
      )}
      {member.type === 'manager' && (
        <span data-test-id="im_session_setting_member_item_rolename" className={realStyle('role')}>
          {getIn18Text('GUANLIYUAN')}
        </span>
      )}

      {/* 添加为管理员 */}
      {myRoleType === 'owner' && member.type === 'normal' && (
        <Tooltip title={getIn18Text('SHEWEIGUANLIYUAN')} getPopupContainer={parentNode => parentNode}>
          <span
            data-test-id="im_session_setting_member_item_addmanager"
            onClick={() => {
              addManager(member);
            }}
            className={realStyle('addManager', 'icon')}
          >
            <AddMangerIcon />
          </span>
        </Tooltip>
      )}
      {/* 移除管理员 */}
      {myRoleType === 'owner' && member.type === 'manager' && (
        <Tooltip title={getIn18Text('QUXIAOGUANLIYUAN')} getPopupContainer={parentNode => parentNode}>
          <span
            data-test-id="im_session_setting_member_item_remove"
            onClick={() => {
              removeManager(member);
            }}
            className={realStyle('removeManager', 'icon')}
          >
            <RemoveManagerIcon />
          </span>
        </Tooltip>
      )}
      {/* 移除群成员 */}
      {roleWeights[myRoleType] > roleWeights[member.type] && (
        <Tooltip title={getIn18Text('YICHUQUNCHENGYUAN')} getPopupContainer={parentNode => parentNode}>
          <span
            onClick={() => {
              removeMember(member);
            }}
            className={realStyle('removeMember', 'icon')}
          >
            <RemoveMemberIcon />
          </span>
        </Tooltip>
      )}
    </div>
  );
};
