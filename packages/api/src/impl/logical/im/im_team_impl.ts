import lodashGet from 'lodash/get';
import { api } from '@/api/api';
import {
  ChangeOwnerOption,
  CreateTeamOption,
  IMMuteOptions,
  IMLaterOptions,
  IMTeamPublicOptions,
  IMTeamApi,
  MuteMessageOption,
  QuitTeamOption,
  RemoveTeamOption,
  TeamMemberOption,
  TeamProfileOption,
} from '@/api/logical/imTeam';
import { apis, URLKey } from '@/config';
import { ApiResponse, DataTransApi, ResponseData } from '@/api/data/http';
import { Api } from '@/api/_base/api';
import { SystemApi } from '@/api/system/system';
// import { ResponseData } from '../../api_data/http';

class IMTeamApiImpl implements IMTeamApi {
  name: string;

  httpApi: DataTransApi;

  systemApi: SystemApi;

  constructor() {
    this.name = apis.imTeamApiImpl;
    this.httpApi = api.getDataTransApi();
    this.systemApi = api.getSystemApi();
  }

  init(): string {
    return this.name;
  }

  getUrl(url: URLKey) {
    return this.systemApi.getUrl(url);
  }

  parseResult(res: ApiResponse<any>) {
    return res.data;
    // if (res.status == 200 && res.data.success) {
    //     return res.data;
    // } else {
    //     return res.data;
    // }
  }

  catchError(reason: any) {
    return reason;
  }

  createTeam(option: CreateTeamOption, blockedError = true) {
    let $request = this.httpApi.post(this.getUrl('createTeam'), option).then(res => {
      if (lodashGet(res, 'data.code', 999) !== 0) {
        throw new Error(lodashGet(res, 'data.message', '创建失败'));
      }
      return res.data as ResponseData<any>;
    });
    if (blockedError) {
      $request = $request.catch(this.catchError);
    }
    return $request;
  }

  removeTeam(option: RemoveTeamOption) {
    return this.httpApi.post(this.getUrl('removeTeam'), option).then(this.parseResult).catch(this.catchError);
  }

  addMember(option: TeamMemberOption, blockedError = true) {
    let $request = this.httpApi.post(this.getUrl('addMember'), option).then(res => {
      if (lodashGet(res, 'data.code', 999) !== 0) {
        throw new Error(lodashGet(res, 'data.message', '添加失败'));
      }
      return res.data as ResponseData<any>;
    });
    if (blockedError) {
      $request = $request.catch(this.catchError);
    }
    return $request;
  }

  removeMember(option: TeamMemberOption) {
    return this.httpApi.post(this.getUrl('removeMember'), option).then(this.parseResult).catch(this.catchError);
  }

  addManager(option: TeamMemberOption) {
    return this.httpApi.post(this.getUrl('addManager'), option).then(this.parseResult).catch(this.catchError);
  }

  removeManager(option: TeamMemberOption) {
    return this.httpApi.post(this.getUrl('removeManager'), option).then(this.parseResult).catch(this.catchError);
  }

  changeOwner(option: ChangeOwnerOption) {
    return this.httpApi.post(this.getUrl('changeOwner'), option).then(this.parseResult).catch(this.catchError);
  }

  quitTeam(option: QuitTeamOption) {
    return this.httpApi.post(this.getUrl('quitTeam'), option).then(this.parseResult).catch(this.catchError);
  }

  updateProfile(option: TeamProfileOption) {
    return this.httpApi.post(this.getUrl('updateProfile'), option).then(this.parseResult).catch(this.catchError);
  }

  updateName(option: TeamProfileOption) {
    return this.httpApi.post(this.getUrl('updateName'), option).then(this.parseResult).catch(this.catchError);
  }

  queryProfile(team_id: string, ope = 0) {
    const url = this.getUrl('queryProfile');
    return this.httpApi.get(url, { team_id, ope }).then(this.parseResult).catch(this.catchError);
  }

  queryDetailProfile(team_id: string) {
    const url = this.getUrl('queryDetailProfile');
    return this.httpApi.get(url, { team_id }).then(this.parseResult).catch(this.catchError);
  }

  muteMessage(option: MuteMessageOption) {
    console.log('[im-team] get mute mesage ', this.getUrl('muteMessage'));
    return this.httpApi.post(this.getUrl('muteMessage'), option).then(this.parseResult).catch(this.catchError);
  }

  memberBelongs(accid: string) {
    const url = this.getUrl('memberBelongs');
    return this.httpApi.get(url, { accid }).then(this.parseResult).catch(this.catchError);
  }

  async toggleMute(options: IMMuteOptions) {
    const url = this.getUrl('toggleSessionMute');
    return this.httpApi.post(url, options).then(this.parseResult).catch(this.catchError);
  }

  async addLater(options: IMLaterOptions) {
    const url = this.getUrl('addSessionLater');
    return this.httpApi.post(url, options).then(this.parseResult).catch(this.catchError);
  }

  async completeLater(session_id: string) {
    const url = this.getUrl('completeSessionLater');
    return this.httpApi.post(url, { session_id }).then(this.parseResult).catch(this.catchError);
  }

  async syncLater() {
    const url = this.getUrl('syncSessionLater');
    return this.httpApi.get(url).then(this.parseResult).catch(this.catchError);
  }

  async toggleTeamPublic(options: IMTeamPublicOptions) {
    const url = this.getUrl('toggleTeamPublic');
    return this.httpApi.post(url, options).then(this.parseResult).catch(this.catchError);
  }

  async searchTeamPublic(tid: string) {
    const url = this.getUrl('searchTeamPublic');
    return this.httpApi.get(url, { tid }).then(this.parseResult).catch(this.catchError);
  }
}

const imTeamApiImpl: Api = new IMTeamApiImpl();
api.registerLogicalApi(imTeamApiImpl);

export default imTeamApiImpl;
