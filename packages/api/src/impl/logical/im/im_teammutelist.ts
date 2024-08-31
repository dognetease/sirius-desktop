import { from, fromEventPattern, Observable } from 'rxjs';
import { tap, shareReplay, mergeWith, map, filter, switchMap, startWith, scan, timeout, catchError, take } from 'rxjs/operators';
import lodashGet from 'lodash/get';
import has from 'lodash/has';
import { IM_STREAM } from '@/api/logical/im_stream';
import { NIMApi, Team } from '@/api/logical/im';

const lodashHas = has;

interface MuteParam {
  account: string;
  isAdd: boolean;
}
type OnMuteCallback = (param: {}) => void;
type OnSyncMuteCallback = (param: MuteParam) => void;
export class TeamMuteStream implements IM_STREAM<string[]> {
  private sdk: NIMApi | null = null;

  private subject: Observable<string[]> | null = null;

  init(sdk: NIMApi): void {
    this.sdk = sdk;
    // 合并数据
    this.subject = this._initTeamMutelist().pipe(
      mergeWith(this._onupdateteam()),
      // 合并数据
      scan((total, current) => {
        const _mutelist = new Set([...(Array.isArray(current) ? current : []), ...total]);

        if (lodashGet(current, 'muteTeam', undefined) === true) {
          _mutelist.add((current as Team).teamId);
        } else if (lodashGet(current, 'muteTeam', undefined) === false) {
          _mutelist.delete((current as Team).teamId);
        }

        return [..._mutelist];
      }, [] as string[]),
      catchError(() => from(Promise.resolve([] as string[]))),
      tap(result => {
        console.log('[im.teammute]result:', result);
      }),
      shareReplay(1)
    );

    this.subject.subscribe(args => {
      console.log('[im.teammute]subscribe', args);
    });
  }

  // 获取当前用户静音列表
  _initTeamMutelist() {
    const onconnect = (handler: (e: unknown) => void) => {
      this.sdk!.subscrible('onconnect', handler);
    };
    const offconnect = (handler: (e: unknown) => void) => {
      this.sdk!.subscrible('onconnect', handler);
    };
    const onteams = (handler: OnMuteCallback) => {
      this.sdk!.subscrible('onteams', handler);
    };
    const offteams = (handler: OnMuteCallback) => {
      this.sdk!.unSubcrible('onteams', handler);
    };
    // 先获取到所有的群组数据 然后在根据teamid列表查询群信息
    const $event = fromEventPattern(onconnect, offconnect).pipe(
      switchMap(() => {
        const $onteams = fromEventPattern(onteams, offteams) as Observable<Team[]>;
        return $onteams.pipe(timeout({ first: 30 * 1000 }));
      }),
      take(1)
    );

    return $event.pipe(
      catchError(() => {
        const request = this.sdk!.excute('getTeams', {}) as Promise<Team[]>;
        return from(request);
      }),
      map(list => (list as Team[]).filter(item => item.valid && item.validToCurrentUser).map(item => item.teamId)),
      filter(list => list.length > 0),
      switchMap(teamIds => {
        const $promise = this.sdk?.excute('notifyForNewTeamMsg', {
          teamIds,
        }) as Promise<Record<string, '0' | '1'>>;
        return from($promise);
      }),
      map(result => Object.keys((result || {}) as Record<string, '0' | '1'>).filter(key => !!Number(result[key]))),
      catchError(() => from(Promise.resolve([] as string[]))),
      startWith([] as string[])
    ) as Observable<string[]>;
  }

  // 静音列表增量更新
  _onupdateteam() {
    const onupdateteammember = (handler: OnSyncMuteCallback) => {
      this.sdk!.subscrible('onupdateteammember', handler);
    };
    const offupdateteammember = (handler: OnSyncMuteCallback) => {
      this.sdk!.unSubcrible('onupdateteammember', handler);
    };
    const $event = fromEventPattern(onupdateteammember, offupdateteammember) as Observable<Team>;
    return $event.pipe(
      filter(team =>
        // 一直跳过
        lodashHas(team, 'muteTeam')
      ),
      tap(args => {
        console.log('[im.teammute]updateteaminfo', args);
      }),
      startWith({} as Team)
    );
  }

  getSubject() {
    return this.subject;
  }
}
