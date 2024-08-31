import { EventEmitter } from 'events';
import { Team, NIMApi, TeamMember } from './im';

export enum TEAM_EVENT_NAME {
  TEAM_LIST = 'TEAM_LIST',
  UPDATE_TEAM = 'UPDATE_TEAM',
  TRANSFER_TEAM = 'TRANSFER_TEAM',
  ADD_TEAM_MEMBERS = 'ADD_TEAM_MEMBERS',
  REMOVE_TEAM_MEMBERS = 'REMOVE_TEAM_MEMBERS',
  UPDATE_TEAM_MEMBERS = 'UPDATE_TEAM_MEMBERS',
  LEAVE_TEAM = 'LEAVE_TEAM',
  JOIN_TEAM = 'JOIN_TEAM',
}

export type TeamEventCallbackParmas = {
  action: TEAM_EVENT_NAME.TEAM_LIST;
  teamList: Team[] | null;
} & {
  action: Omit<TEAM_EVENT_NAME, 'TEAM_LIST'>;
  team: Team;
  accounts?: string[];
};
export type TeamEventCallback = (params: TeamEventCallbackParmas) => any;

export interface Im_Team {
  teamList: Team[];
  eventName: 'IM_TEAM';
  eventEmitter: EventEmitter;
  init(instance: NIMApi): void;
  subscrible(callback: TeamEventCallback): void;
  getMyAccount(): string;
  /**
   *
   * @deprecated 因为WEBSDK获取成员有频率限制 该功能迁移到到服务端接口 1.11.x废弃
   */
  getTeamMembersByIds(ids: string[]): Promise<{ teamId: string; members: TeamMember[] }[]>;
}
