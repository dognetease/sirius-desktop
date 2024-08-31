import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class IMUrl {
  /**
   * 云信配置 @author:guochao
   */
  getYunxinInfoByEmail: string = (host + config('getYunxinToken')) as string;

  getHasSession: string = (host + config('getHasSession')) as string;

  // 获取云信服务号
  getYunxinServiceNum: string = host + config('getYunxinServiceNum');

  // 批量获取文档内容
  getEdiskContents: string = host + config('getEdiskContents');

  createPubClue: string = host + config('createPubClue');

  /**
   * 群相关接口
   */
  createTeam: string = host + config('createTeam');

  removeTeam: string = host + config('removeTeam');

  addMember: string = host + config('addMember');

  removeMember: string = host + config('removeMember');

  addManager: string = host + config('addManager');

  removeManager: string = host + config('removeManager');

  changeOwner: string = host + config('changeOwner');

  quitTeam: string = host + config('quitTeam');

  updateProfile: string = host + config('updateProfile');

  updateName: string = host + config('updateName');

  queryProfile: string = host + config('queryProfile');

  queryDetailProfile: string = host + config('queryDetailProfile');

  muteMessage: string = host + config('muteMessage');

  memberBelongs: string = host + config('memberBelongs');

  toggleSessionMute: string = host + config('toggleSessionMute');

  getTeamList: string = host + config('getTeamList');

  getTeamMembers: string = host + config('getTeamMembers');

  addSessionLater: string = host + config('addSessionLater');

  completeSessionLater: string = host + config('completeSessionLater');

  syncSessionLater: string = host + config('syncSessionLater');

  toggleTeamPublic: string = host + config('toggleTeamPublic');

  searchTeamPublic: string = host + config('searchTeamPublic');

  getCustomEmoji: string = host + config('getCustomEmoji');
}
export type IMUrlKeys = keyof IMUrl;
const urlConfig = new IMUrl();
const urlsMap = new Map<IMUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as IMUrlKeys, urlConfig[item as IMUrlKeys]);
});
export default urlsMap;
