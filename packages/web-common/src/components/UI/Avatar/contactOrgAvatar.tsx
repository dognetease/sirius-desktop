import { ContactOrgItem, isOrg } from '@web-common/components/util/contact';
import React from 'react';
import { OrgItem } from '@web-common/utils/contact_util';
import AvatarTag from './avatarTag';
import { ContactItem, SimpleTeamInfo, util } from 'api';
import { TeamAvatar } from '@web-im/common/imUserAvatar';
import CustomerAvatar from '@/images/icons/contact/customer_avatar.svg';
import ClueAvatar from '@/images/icons/contact/clue_avatar.svg';
import { ReactComponent as OrgIcon } from '@/images/icons/contact/org_icon.svg';

interface Props {
  item: ContactOrgItem;
  styles?: React.CSSProperties;
  className?: string;
}

export const ContactOrgAvatar: React.FC<Props> = props => {
  const { item: _item, className } = props;
  let Avatar = null;
  if (!isOrg(_item)) {
    const item = _item as ContactItem;
    Avatar = <AvatarTag className={className} size={32} propEmail={item.email} contactId={item.id} user={{ name: item.name }} />;
  } else {
    const item = _item as OrgItem;
    // 个人分组/企业组织
    Avatar = <AvatarTag className={className} size={32} user={{ name: item.orgName, color: util.getColor(item.id || item.orgName) }} avatarImg={<OrgIcon />} />;
    if (item.type === 2000) {
      // 群组
      const { id, avatar } = item;
      const teamId = id.startsWith('team_') ? id.split('team_')[1] : id;
      const teamInfo: SimpleTeamInfo = { teamId, avatar };
      Avatar = <TeamAvatar teamId={teamInfo!.teamId} teamInfo={teamInfo!} />;
    } else if (item.type === 2002) {
      // 客户
      Avatar = (
        <AvatarTag
          className={className}
          user={{
            avatar: CustomerAvatar,
          }}
        />
      );
    } else if (item.type === 2003) {
      // 线索
      Avatar = (
        <AvatarTag
          className={className}
          user={{
            avatar: ClueAvatar,
          }}
        />
      );
    }
  }
  return Avatar;
};
