import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import classnames from 'classnames';
import { TeamMember } from 'api';
import MemberSelectedIcon from '@web-common/components/UI/Icons/svgs/MemberSelected';
import { TeamContactModel } from '../TeamSetting/teamSetting';
import AvatarTag from '@web-common/components/UI/Avatar/avatarTag';
import styles from './ownerTransfer.module.scss';
import { UserAvatar } from '../../common/imUserAvatar';
import { getIn18Text } from 'api';
interface MemberItemProps {
  member: TeamMember;
  ownerId?: string;
  setOwner(string): void;
  style: React.CSSProperties;
}
const MemberItem: React.FC<MemberItemProps> = props => {
  const { member, setOwner, style, ownerId } = props;
  return (
    <div className={styles.memberItem} style={style} onClick={() => setOwner(member.account)}>
      {member.account === ownerId ? <MemberSelectedIcon /> : <div className={styles.unchecked} />}
      <UserAvatar size={28} user={member.user} />

      <div className={styles.memberName}>{member.user?.nick || ''}</div>
    </div>
  );
};
interface OwnerTransferProps {
  onConfirm: Function;
  onCancel: Function;
  members: TeamMember[];
  ownerId: string;
}
const OwnerTransfer: React.FC<OwnerTransferProps> = props => {
  const { onConfirm, onCancel, members } = props;
  const [ownerId, setOwnerId] = useState(props.ownerId);
  const memberItems = members
    .filter(item => item.type !== 'owner')
    .map(member => <MemberItem key={member.account} member={member} ownerId={ownerId} setOwner={setOwnerId} style={{ width: '50%' }} />);
  return (
    <>
      <div className={styles.transferMemberList}>
        <div className={styles.dividerLine} />
        {memberItems}
      </div>
      <div className={styles.transferFooter}>
        <Button type="default" className={classnames(styles.button, styles.cancelButton)} onClick={() => onCancel && onCancel()}>
          {getIn18Text('QUXIAO')}
        </Button>
        <Button
          type="primary"
          className={classnames(styles.button, styles.confirmButton)}
          onClick={() => onConfirm && onConfirm(ownerId)}
          disabled={ownerId === props.ownerId}
        >
          {getIn18Text('QUEDING')}
        </Button>
      </div>
    </>
  );
};
export default OwnerTransfer;
