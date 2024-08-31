import { EventEmitter } from 'events';
import { fromEventPattern, Observable, from, of, merge, timer, race, iif, defer } from 'rxjs';
import {
  timeout,
  take,
  catchError,
  map,
  distinctUntilChanged,
  filter,
  switchMap,
  defaultIfEmpty,
  withLatestFrom,
  mergeMap,
  scan,
  shareReplay,
  bufferToggle,
  throttleTime,
  tap,
  retryWhen,
  delay,
} from 'rxjs/operators';
import lodashGet from 'lodash/get';
import { Team, NIMApi, Session, IMUser } from '@/api/logical/im';
import { IM_STREAM, IMTeamInterface } from '@/api/logical/im_stream';
import { TEAM_EVENT_NAME } from '@/api/logical/im_team';

interface On_Team_Handler {
  (teams: Team[]): void;
}

type TeamParams = { teamId: string } & Partial<Omit<Team, 'teamId'>>;
interface On_Update_Team_Handler {
  (team: TeamParams): void;
}

const switchTeamCustomName: (param: Team) => Team = param => {
  if (param.name.indexOf('LINGXI_IM_TEAM_DEFAULT_NAME') === -1) {
    param.customTeamName = param.name;
    return param;
  }
  const { serverCustom } = param;
  let customTeamName = param.name;
  try {
    const result = JSON.parse(serverCustom || '');
    customTeamName = result.auto_team_name as string;
  } catch (ex) {
    console.warn('[im] ', ex);
  }
  param.customTeamName = customTeamName;
  return param;
};

export class ImTeamStream implements IM_STREAM, IMTeamInterface {
  private sdk: null | NIMApi = null;

  private eventEmitter = new EventEmitter();

  contactEventEmitter = new EventEmitter();

  static Event_Names = {
    request: 'request',
    onSyncTeams: 'onSyncTeams',
  };

  static readonly Contact_Eventnames = {
    teamEvent: 'IM_TEAM',
  };

  private observable: Observable<Record<string, Team>>;

  constructor() {
    const onSyncTeams = (handler: () => unknown) => {
      this.eventEmitter.addListener(ImTeamStream.Event_Names.onSyncTeams, handler);
    };
    const offSyncTeams = (handler: () => unknown) => {
      this.eventEmitter.removeListener(ImTeamStream.Event_Names.onSyncTeams, handler);
    };
    const $stream = fromEventPattern(onSyncTeams, offSyncTeams) as Observable<Team[] | Team>;

    this.observable = $stream.pipe(
      map(teams => {
        if (Array.isArray(teams)) {
          return teams.map(item => switchTeamCustomName(item));
        }
        return switchTeamCustomName(teams);
      }),
      scan((total, teams) => {
        if (Array.isArray(teams)) {
          const teamMaps = teams.reduce(
            (total, team) => ({
              ...total,
              [team.teamId]: team,
            }),
            {} as Record<string, Team>
          );
          return {
            ...total,
            ...teamMaps,
          };
        }
        return {
          ...total,
          [teams.teamId]: teams,
        };
      }, {} as Record<string, Team>),
      shareReplay(1)
    );
  }

  init(sdk: NIMApi) {
    this.sdk = sdk;
    const $teams = this._onteams();
    this.syncContact();
    this.syncIM();

    // 批量获取群组
    $teams.subscribe(teams => {
      this.eventEmitter.emit(ImTeamStream.Event_Names.onSyncTeams, teams);
    });
  }

  // IM内部数据同步(IM中大部分场景下数据来源都是从syncIM中获取.只有搜索群组数据是来源自contact中)
  syncIM() {
    const $updateTeam = this._onupdateteam();
    const $addTeamMember = this._onAddTeamMember();
    const $removeTeamMember = this._onRemoveTeamMember();
    const $transferTeam = this._onTransferTeam();
    const $dismissTeam = this._onDissmissTeam();

    const $teamEvent = merge(
      $updateTeam,
      $addTeamMember.pipe(map(param => param.team)),
      $removeTeamMember.pipe(map(param => param.team)),
      $transferTeam.pipe(map(param => param.team)),
      $dismissTeam
    );

    const $teamEventBuffer = $teamEvent.pipe(
      map(team => team.teamId),
      bufferToggle($teamEvent.pipe(throttleTime(100)), () => timer(100))
    );
    const onRequstTeam = (handler: (teamId: string) => void) => {
      this.eventEmitter.addListener(ImTeamStream.Event_Names.request, handler);
    };
    const offRequestTeam = (handler: (teamId: string) => void) => {
      this.eventEmitter.removeListener(ImTeamStream.Event_Names.request, handler);
    };

    const $requestEvent = fromEventPattern(onRequstTeam, offRequestTeam) as Observable<{
      teamId: string;
      isForceUpdate: boolean;
    }>;

    $requestEvent.subscribe(teamId => {
      console.log('[im.team]request', teamId);
    });

    const $requestEventBuffer = $requestEvent.pipe(
      tap(({ teamId }) => {
        console.log('[im.team]request', teamId);
      }),
      filter(({ teamId }) => /^\d+$/.test(teamId)),
      withLatestFrom(this.observable),
      filter(([teamUpdateInfo, teamMap]) => {
        const { teamId, isForceUpdate } = teamUpdateInfo;
        if (isForceUpdate) {
          return true;
        }
        const tids = Object.keys(teamMap);
        return Object.keys(teamMap).length > 0 && !tids.includes(teamId);
      }),
      map(([teamUpdateInfo]) => teamUpdateInfo.teamId),
      bufferToggle($requestEvent.pipe(throttleTime(50)), () => timer(50)),
      filter(teamIds => teamIds.length > 0)
    );

    merge($teamEventBuffer, $requestEventBuffer)
      .pipe(
        // 去重
        map(_ids => [...new Set(_ids)].filter(_id => /^[\d]+$/.test(_id))),
        filter(tids => tids.length > 0),
        mergeMap(teamIds => {
          const $request = defer(() => {
            const _request = this.sdk!.excute('getTeamsById', {
              teamIds,
            }) as Promise<{ teams: Team[]; tids: string[] }>;
            return from(_request);
          });
          // 请求失败之后重试
          return $request.pipe(
            retryWhen($error =>
              $error.pipe(
                tap(err => {
                  console.log('[im.team]batchrequest.failed', err);
                }),
                delay(1000),
                take(10)
              )
            )
          );
        }),
        map(({ teams, tids }) => [
          ...teams,
          // 这块逻辑先简单处理一下(不知道有没有群没有解散 但是tids里面包含了场景)
          ...tids.map(
            tid =>
              ({
                teamId: tid,
                valid: false,
                name: '未知群组',
              } as Team)
          ),
        ]),
        catchError(() => from(Promise.resolve([] as Team[])))
      )
      .subscribe(teams => {
        this.eventEmitter.emit(ImTeamStream.Event_Names.onSyncTeams, teams);
      });
  }

  /**
   * 同步通讯录
   */
  private syncContact() {
    const $myinfo = this.sdk!.imself.getSubject() as Observable<IMUser>;

    const $updateTeam = this._onupdateteam();
    const $addTeamMember = this._onAddTeamMember();
    const $removeTeamMember = this._onRemoveTeamMember();
    const $transferTeam = this._onTransferTeam();
    const $dismissTeam = this._onDissmissTeam();

    /**
     * 通讯录相关逻辑
     * 将群组数据变更同步给通讯录
     */

    // 同步通讯录群信息变更
    const $contactUpdateTeam = $updateTeam.pipe(
      map(teamInfo => ({
        action: TEAM_EVENT_NAME.UPDATE_TEAM,
        team: teamInfo,
      }))
    );
    // 转让群主
    const $contactTransferTeam = $transferTeam.pipe(
      map(param => ({
        action: TEAM_EVENT_NAME.TRANSFER_TEAM,
        team: param.team,
        accounts: [param.from.id, param.to.id].map(item => item.replace(/^\d+-/, '')),
      }))
    );

    // 离开群组(群解散 & 个人离开群聊)
    const $contactLeaveTeam = merge(
      $dismissTeam.pipe(
        map(param => ({
          action: TEAM_EVENT_NAME.LEAVE_TEAM,
          team: param,
        }))
      ),
      $removeTeamMember.pipe(
        withLatestFrom($myinfo),
        filter(([param, { account: myAccount }]) => param.accounts.includes(myAccount)),
        map(([param]) => ({
          action: TEAM_EVENT_NAME.LEAVE_TEAM,
          team: param.team,
        }))
      )
    );

    // 加入群聊
    const $contactJoinTeam = $addTeamMember.pipe(
      withLatestFrom($myinfo),
      filter(([param, { account: myAccount }]) => param.accounts.includes(myAccount)),
      map(([param]) => ({
        action: TEAM_EVENT_NAME.JOIN_TEAM,
        team: param.team,
      }))
    );

    // 群组加人
    const $contactAddMember = $addTeamMember.pipe(
      withLatestFrom($myinfo),
      filter(([param, { account: myAccount }]) => !param.accounts.includes(myAccount)),
      map(([param]) => ({
        action: TEAM_EVENT_NAME.ADD_TEAM_MEMBERS,
        team: param.team,
        accounts: param.accounts,
      }))
    );

    // 群组删人
    const $contactRemoveMember = $removeTeamMember.pipe(
      withLatestFrom($myinfo),
      filter(([param, { account: myAccount }]) => !param.accounts.includes(myAccount)),
      map(([param]) => ({
        action: TEAM_EVENT_NAME.REMOVE_TEAM_MEMBERS,
        team: param.team,
        accounts: param.accounts,
      }))
    );

    // 需要群的全量信息
    const $contactTeamFull = merge($contactUpdateTeam, $contactAddMember, $contactJoinTeam, $contactRemoveMember, $contactTransferTeam).pipe(
      tap(args => {
        console.log('[im.team]contact.update', args);
      }),
      withLatestFrom(this.observable),
      mergeMap(([teamParams, teamMap]) => {
        const { team } = teamParams;

        const $requestTeam = defer(() => {
          const _request = this.sdk!.excute('getTeam', {
            teamId: team.teamId,
          }) as Promise<Team>;
          return from(_request);
        });

        return iif(() => lodashGet(teamMap, `${team.teamId}.teamId.length`, 0) !== 0, of(lodashGet(teamMap, `${team.teamId}`, {})), $requestTeam).pipe(
          map(team => ({
            ...teamParams,
            team: Object.assign(team, teamParams.team),
          }))
        );
      })
    );

    merge($contactTeamFull, $contactLeaveTeam)
      .pipe(
        tap(args => {
          console.log('[im.team]contactevent', args);
        })
      )
      .subscribe(param => {
        this.contactEventEmitter.emit(ImTeamStream.Contact_Eventnames.teamEvent, param);
      });
  }

  // 全量获取群组数据
  private _onteams() {
    const onteams = (handler: On_Team_Handler) => {
      this.sdk!.subscrible('onteams', handler);
    };
    const offteams = (handler: On_Team_Handler) => {
      this.sdk!.unSubcrible('onteams', handler);
    };

    const $event = fromEventPattern(onteams, offteams) as Observable<Team[]>;
    const $sessionReady = this.sdk!.sessionStream.getSubject() as unknown as Observable<Session[]>;
    const $pull = $sessionReady.pipe(
      map(sessions => sessions.length !== 0),
      filter(flag => flag),
      distinctUntilChanged(),
      switchMap(() => {
        const request = this.sdk?.excute('getTeams', {}) as Promise<Team[]>;
        return from(request).pipe(
          timeout(10 * 1000),
          catchError(() => of().pipe(defaultIfEmpty([] as Team[])))
        );
      })
    );
    // 谁先获取到数据使用谁
    // 转热 因为request获取数据的时候需要监听
    return race($event, $pull).pipe(take(1));
  }

  private _onupdateteam() {
    const onupdateTeam = (handler: On_Update_Team_Handler) => {
      this.sdk!.subscrible('onUpdateTeam', handler);
    };
    const offupdateTeam = (handler: On_Update_Team_Handler) => {
      this.sdk!.unSubcrible('onUpdateTeam', handler);
    };

    return fromEventPattern(onupdateTeam, offupdateTeam) as Observable<TeamParams>;
  }

  private _onRemoveTeamMember() {
    const onAddTeamMembers = (handler: On_Update_Team_Handler) => {
      this.sdk!.subscrible('onRemoveTeamMembers', handler);
    };
    const offAddTeamMembers = (handler: On_Update_Team_Handler) => {
      this.sdk!.unSubcrible('onRemoveTeamMembers', handler);
    };

    return fromEventPattern(onAddTeamMembers, offAddTeamMembers) as Observable<{
      team: TeamParams;
      accounts: string[];
    }>;
  }

  private _onAddTeamMember() {
    const onAddTeamMembers = (handler: On_Update_Team_Handler) => {
      this.sdk!.subscrible('onAddTeamMembers', handler);
    };
    const offAddTeamMembers = (handler: On_Update_Team_Handler) => {
      this.sdk!.unSubcrible('onAddTeamMembers', handler);
    };

    return fromEventPattern(onAddTeamMembers, offAddTeamMembers) as Observable<{
      team: TeamParams;
      accounts: string[];
    }>;
  }

  private _onTransferTeam() {
    const onTransferTeam = (handler: On_Update_Team_Handler) => {
      this.sdk!.subscrible('onTransferTeam', handler);
    };
    const offTransferTeam = (handler: On_Update_Team_Handler) => {
      this.sdk!.unSubcrible('onTransferTeam', handler);
    };
    return fromEventPattern(onTransferTeam, offTransferTeam) as Observable<{
      team: TeamParams;
      from: { id: string; type: string; updateTime: number };
      to: { id: string; type: string; updateTime: number };
    }>;
  }

  private _onDissmissTeam() {
    const onDismissTeam = (handler: On_Update_Team_Handler) => {
      this.sdk!.subscrible('onDismissTeam', handler);
    };
    const offDismissTeam = (handler: On_Update_Team_Handler) => {
      this.sdk!.unSubcrible('onDismissTeam', handler);
    };
    return fromEventPattern(onDismissTeam, offDismissTeam) as Observable<TeamParams>;
  }

  getSubject() {
    return this.observable;
  }

  requestTeamById(teamId: string, _isForceUpdate = false) {
    this.eventEmitter.emit(ImTeamStream.Event_Names.request, {
      teamId,
      isForceUpdate: _isForceUpdate,
    });
  }

  getTeamById($teamId: Observable<string>) {
    return this.observable.pipe(
      withLatestFrom($teamId),
      map(([teamMap, teamId]) => teamMap[teamId])
    );
  }

  getTeamField($props: Observable<[string, string]>) {
    const $teamId = $props.pipe(map(([teamId]) => teamId));
    const $field = $props.pipe(map(([, field]) => field));
    return this.observable.pipe(
      withLatestFrom($teamId, $field),
      map(([teamMap, teamId, field]) => lodashGet(teamMap, `[${teamId}].${field}`, '')),
      distinctUntilChanged()
    );
  }

  _excuteGetTeam(id: string) {
    return this.sdk!.excute('getTeam', {
      teamId: id,
    }) as Promise<Team>;
  }
}
