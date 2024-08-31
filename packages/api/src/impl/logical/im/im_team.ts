import { EventEmitter } from 'events';
import lodashGet from 'lodash/get';
import { Team, NIMApi, NIMEventOptions, TeamMember } from '@/api/logical/im';
import { api as masterApi } from '@/api/api';
import { TEAM_EVENT_NAME, Im_Team, TeamEventCallback } from '@/api/logical/im_team';
import { EntityContactItem } from '@/api/_base/api';
import { inWindow } from '@/config';
// import { fromEvent } from 'rxjs';
// import { map } from 'rxjs/operators';

export class ImTeamManager implements Im_Team {
  static MAX_CALL_FREQ = 30;

  teamList: Team[] = [];

  readonly eventName = 'IM_TEAM';

  eventEmitter = new EventEmitter();

  $niminstance: NIMApi | null = null;

  private systemApi = masterApi.getSystemApi();

  private eventApi = masterApi.getEventApi();

  private targetDataWinId: '-1' | number = '-1';

  init($nimInstance: NIMApi) {
    this.$niminstance = $nimInstance;

    // 更新群信息(群名称/群公告)
    $nimInstance.subscrible('onUpdateTeam', async (params: { teamId: string; [key: string]: any }) => {
      await new Promise(resolve => {
        setTimeout(resolve, 100);
      });
      // 获取全量群信息
      const teamInfo = await this.requestTeamInfo($nimInstance, params);
      this.sendTeamNotify2Datawin({
        action: TEAM_EVENT_NAME.UPDATE_TEAM,
        team: Object.assign(teamInfo, params),
      });
    });
    this.systemApi
      .getAllWindow()
      .then(list => {
        this.targetDataWinId = list.find(item => item.type === 'bkStable')?.webId || '-1';
      })
      .catch(ex => {
        console.log('[im.team]init.getWindowsError:', ex);
      });

    // 更换群主
    $nimInstance.subscrible('onTransferTeam', (params: { team: Team; [key: string]: any }) => {
      const { team, from, to } = params;
      const $index = this.teamList.findIndex(item => item.teamId === team.teamId);
      if ($index !== -1) {
        Object.assign(this.teamList[$index], params);
      }
      const accounts = [];
      const fromAccount = from.id.split('-')[1];
      const toAccount = to.id.split('-')[1];
      fromAccount && accounts.push(fromAccount);
      toAccount && accounts.push(toAccount);
      this.sendTeamNotify2Datawin({
        action: TEAM_EVENT_NAME.TRANSFER_TEAM,
        team,
        accounts,
      });
    });
    // 添加减少群成员
    ['onAddTeamMembers', 'onRemoveTeamMembers'].forEach(key => {
      $nimInstance.subscrible(key as keyof NIMEventOptions, async (params: { team: Pick<Team, 'memberNum' | 'memberUpdateTime' | 'teamId'>; accounts: string[] }) => {
        const { teamId } = params.team;
        const $index = this.teamList.findIndex(team => team.teamId === teamId);
        if ($index !== -1) {
          Object.assign(this.teamList[$index], params);
        }
        const curUser = this.getMyAccount();
        if (key === 'onRemoveTeamMembers' && params.accounts.includes(curUser)) {
          // 如果被移除的用户是自己
          this.sendTeamNotify2Datawin({
            action: TEAM_EVENT_NAME.LEAVE_TEAM,
            team: params.team,
          });
        } else if (key === 'onAddTeamMembers' && params.accounts.includes(curUser)) {
          // 如果被添加的用户是自己
          const teamInfo = await this.requestTeamInfo($nimInstance, params.team);
          this.sendTeamNotify2Datawin({
            action: TEAM_EVENT_NAME.JOIN_TEAM,
            team: teamInfo,
          });
        } else {
          this.sendTeamNotify2Datawin({
            action: key === 'onRemoveTeamMembers' ? TEAM_EVENT_NAME.REMOVE_TEAM_MEMBERS : TEAM_EVENT_NAME.ADD_TEAM_MEMBERS,
            team: params.team,
            accounts: params.accounts,
          });
        }
      });
    });

    // 解散群
    $nimInstance.subscrible('onDismissTeam', (params: Pick<Team, 'teamId'>) => {
      const { teamId } = params;
      const $index = this.teamList.findIndex(team => team.teamId === teamId);
      if ($index !== -1) {
        this.teamList.splice($index, 1);
      }
      this.sendTeamNotify2Datawin({
        action: TEAM_EVENT_NAME.LEAVE_TEAM,
        team: params,
      });
    });
  }

  private async sendTeamNotify2Datawin(param: { action: TEAM_EVENT_NAME; team: Partial<Team>; accounts?: string[] }) {
    if (this.targetDataWinId === '-1' && inWindow()) {
      const list = await this.systemApi.getAllWindow('bkStable');
      this.targetDataWinId = list.find(item => item.type === 'bkStable')?.webId || '-1';
    }
    this.eventApi.sendSysEvent({
      eventName: 'imTeamEvents',
      eventStrData: param.action,
      eventData: param,
      eventTarget: `${this.targetDataWinId}`,
    });
  }

  getMyAccount() {
    const contactInfo = this.systemApi.getCurrentUser();
    const $index = (lodashGet(contactInfo, 'contact.contactInfo', []) as EntityContactItem[]).findIndex(item => item.contactItemType === 'yunxin');
    return lodashGet(contactInfo, `contact.contactInfo[${$index}].contactItemVal`, '') as string;
  }

  subscrible(callback: TeamEventCallback) {
    this.eventEmitter.on(this.eventName, callback);
  }

  async requestTeamInfo($instance: NIMApi, teamInfo: { teamId: string; [key: string]: any }): Promise<Team> {
    const { teamId } = teamInfo;
    const $index = this.teamList.findIndex(team => team.teamId === teamId);

    if ($index !== -1) {
      this.teamList[$index] = Object.assign(this.teamList[$index], teamInfo);
      return this.teamList[$index];
    }
    const remoteTeamInfo = (await $instance.excute('getTeam', {
      teamId,
    })) as Team;

    this.teamList.push(remoteTeamInfo);
    return remoteTeamInfo;
  }

  _sleep(serial = 0) {
    return new Promise(resolve => {
      setTimeout(resolve, serial * 60 * 1000);
    });
  }

  // 根据群ID
  async getTeamMembersByIds(ids: string[]) {
    // 因为云信getTeamMembersById的调用策略限制。1min内只能调用60次

    // 对ids进行分组 30一组
    console.log('[teamManage] getTeamMembersByIds', ids);
    const _ids: string[][] = ids
      .filter(item => item.length && /\d+/.test(item))
      .reduce((total, cur) => {
        if (!Array.isArray(total[total.length - 1]) || total[total.length - 1].length >= ImTeamManager.MAX_CALL_FREQ) {
          total.push([]);
        }
        const _subArr = total[total.length - 1];
        _subArr.push(cur);
        return total;
      }, [] as string[][]);
    const results = await Promise.all(
      _ids.map(async (subIds, index) => {
        await this._sleep(index);
        return this._getTeamMembers(subIds);
      })
    );

    return results.reduce((total, cur) => total.concat(cur), []);
  }

  async _getTeamMembers(ids: string[]): Promise<{ teamId: string; members: TeamMember[] }[]> {
    return Promise.all(
      ids.map(
        id =>
          this.$niminstance?.excute('getTeamMembers', {
            teamId: id,
          }) as Promise<{
            teamId: string;
            members: TeamMember[];
          }>
      )
    );
  }
}
