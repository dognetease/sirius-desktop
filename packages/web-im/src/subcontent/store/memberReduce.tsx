// 处理数据 & 初始化数据
import { TeamMember, IMUser } from 'api';

export interface TeamMemberInfo extends TeamMember {
  user?: IMUser;
  isMe?: boolean;
}
export type InitStateApi = TeamMemberInfo[];

export enum TeamMemberAction {
  CLEAN_TEAM_MEMBERS,
  INIT_TEAM_MEMBERS,
  PREPEND_TEAM_MEMBERS,
  UPDATE_TEAM_MEMBERS,
  REMOVE_MEMBER,
  UPDATE_OWNER,
}

export const reduce = (state: InitStateApi, action) => {
  const { type, payload } = action;
  let members = [...state];
  switch (type) {
    case TeamMemberAction.CLEAN_TEAM_MEMBERS:
      members = [];
      break;
    case TeamMemberAction.INIT_TEAM_MEMBERS:
      members = [];
      break;
    case TeamMemberAction.PREPEND_TEAM_MEMBERS:
      const tempMembers = new Map([...members, ...payload.members].map(member => [member.account, member]));

      members = [...tempMembers.values()];
      break;
    case TeamMemberAction.REMOVE_MEMBER:
      if (!members.length) {
        break;
      }
      payload.accounts.forEach(account => {
        const curAccounts = members.map(item => item.account);
        const index = curAccounts.indexOf(account);

        if (index !== -1) {
          members.splice(index, 1);
        }
      });
      break;
    // 更新群成员
    case TeamMemberAction.UPDATE_TEAM_MEMBERS:
      payload.members.forEach(member => {
        // 当前没有返回account 使用id(`${teamId}-${account}`)
        const { id } = member;
        const [teamId, account] = id.split('-');
        const curAccounts = members.map((item: TeamMember) => item.account);
        const index = curAccounts.indexOf(account);

        if (index !== -1) {
          members[index] = { ...members[index], ...member };
        }
      });
      break;
    case TeamMemberAction.UPDATE_OWNER:
      const originOwnerIndex = members.findIndex(item => item.type === 'owner');
      const realOwnerIndex = members.findIndex(item => item.account === payload.account);
      members[originOwnerIndex] = {
        ...members[originOwnerIndex],
        type: 'normal',
      };

      members[realOwnerIndex] = {
        ...members[realOwnerIndex],
        type: 'owner',
      };

      break;
    default:
      break;
  }

  return members;
};
export const initState: InitStateApi = [];
