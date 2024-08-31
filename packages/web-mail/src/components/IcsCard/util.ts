import { EntityScheduleAndContact, IcsModel } from 'api';
import { PartStat } from './index';

const transInviteType = (inviteType: PartStat) => {
  switch (inviteType) {
    case 'NEEDS-ACTION':
      return 1;
    case 'ACCEPTED':
      return 2;
    case 'DECLINED':
      return 3;
    case 'TENTATIVE':
      return 4;
    case 'DELEGATED':
      return 5;
    default:
      return 1;
  }
};

export const transInviteData = (icsData: IcsModel) => {
  const {
    event: { organizer, invitees },
  } = icsData;
  const data: EntityScheduleAndContact[] = [
    {
      id: organizer.extDesc,
      contactId: '',
      // 联系人email
      email: organizer.extDesc,
      // 日程id
      scheduleId: '',
      // 日程操作 （需要操作1，接受2，拒绝3，暂定4，已委派5）
      partStat: transInviteType('ACCEPTED'),
      // 是否是拥有者
      isOwner: 1,
      // 是否是组织者
      isOrganizer: 1,
      // 是否是创建者
      isCreator: 1,
      // 是否是被邀请者
      isInviter: 0,
      // 联系人简要信息
      simpleInfo: organizer,
    },
  ];
  invitees.forEach(item => {
    if (item.email !== organizer.extDesc) {
      data.push({
        id: item.email,
        contactId: '',
        // 联系人email
        email: item.email,
        // 日程id
        scheduleId: '',
        // 日程操作 （需要操作1，接受2，拒绝3，暂定4，已委派5）
        partStat: transInviteType(item.partStat as PartStat),
        // 是否是拥有者
        isOwner: 0,
        // 是否是组织者
        isOrganizer: 0,
        // 是否是创建者
        isCreator: 0,
        // 是否是被邀请者
        isInviter: 1,
        // 联系人简要信息
        simpleInfo: {
          extDesc: item.email,
          extNickname: item.nickname,
          accountId: item.email as any,
        },
      });
    }
  });
  return data;
};
