import { Api } from '../_base/api';
import { ResponseData } from '../data/http';

export interface CreateTeamOption {
  // 创建群组
  name?: string;
  owner: string;
  members: string;
  anno?: string;
  icon?: string;
  intro?: string;
  init_team_name?: string;
}

export interface TeamMemberOption {
  // 群组加人、踢人、任命管理员、移除管理员
  members: string;
  owner: string;
  team_id: string;
}

export interface RemoveTeamOption {
  // 解散群
  owner: string;
  team_id: string;
}

export interface ChangeOwnerOption {
  // 转让群主
  new_owner: string;
  owner: string;
  team_id: string;
}

export interface QuitTeamOption {
  // 主动退群
  acc_id: string;
  team_id: string;
}

export interface TeamProfileOption {
  // 编辑群资料
  owner: string;
  team_id: string;
  anno?: string;
  icon?: string;
  intro?: string;
  name?: string;
}

export interface MuteMessageOption {
  // 消息免打扰
  accid: string;
  team_id: string;
  ope: MuteMessageType;
}

/**
 * 1 关闭消息提醒 | 2 打开消息提醒
 */
export type MuteMessageType = 1 | 2;

export interface IMTeamIntro {
  // 群公告、群介绍
  text: string;
  accid: string;
  create_time: string;
}

export interface IMMuteOptions {
  session_id: string;
  owner: string;
  type: 1 | 2;
  ope: 1 | 2;
}

export interface IMLaterOptions {
  session_id: string;
  session_type: string;
}

export interface IMTeamPublicOptions {
  tid: string;
  public_team: boolean;
}
export interface IMTeamApi extends Api {
  /**
   * 创建群组
   * @param option
   */
  createTeam(option: CreateTeamOption, blockedError?: boolean): Promise<ResponseData>;

  /**
   * 解散群
   * @param option
   */
  removeTeam(option: RemoveTeamOption): Promise<ResponseData>;

  /**
   * 群组加人
   * @param option
   */
  addMember(option: TeamMemberOption, blockedError?: boolean): Promise<ResponseData>;

  /**
   * 群组踢人
   * @param option
   */
  removeMember(option: TeamMemberOption, blockedError?: boolean): Promise<ResponseData>;

  /**
   * 任命管理员
   * @param option
   */
  addManager(option: TeamMemberOption): Promise<ResponseData>;

  /**
   * 移除管理员
   * @param option
   */
  removeManager(option: TeamMemberOption): Promise<ResponseData>;

  /**
   * 转让群主
   * @param option
   */
  changeOwner(option: ChangeOwnerOption): Promise<ResponseData>;

  /**
   * 主动退群
   * @param option
   */
  quitTeam(option: QuitTeamOption): Promise<ResponseData>;

  /**
   * 编辑群资料
   * @param option
   */
  updateProfile(option: TeamProfileOption): Promise<ResponseData>;

  /**
   * 编辑群名
   * @param option
   */
  updateName(option: TeamProfileOption): Promise<ResponseData>;

  /**
   * 查询群信息
   * @param team_id
   * @param ope
   */
  queryProfile(team_id: string, ope?: number): Promise<ResponseData>;

  /**
   * 查询群详细信息
   * @param team_id
   */
  queryDetailProfile(team_id: string): Promise<ResponseData>;

  /**
   * 消息免打扰
   * @param option
   */
  muteMessage(option: MuteMessageOption): Promise<ResponseData>;

  /**
   * 获取用户所在群
   * @param accid
   */
  memberBelongs(accid: string): Promise<ResponseData>;

  /**
   *
   */
  toggleMute(options: IMMuteOptions): Promise<ResponseData>;

  /**
   * 稍后处理相关接口
   * @param sessionId
   */
  addLater(options: IMLaterOptions): Promise<ResponseData>;
  completeLater(session_id: string): Promise<ResponseData>;
  syncLater(): Promise<ResponseData>;

  /**
   * 公开群相关接口
   */
  toggleTeamPublic(options: IMTeamPublicOptions): Promise<ResponseData>;
  searchTeamPublic(tid: string): Promise<ResponseData>;
}
