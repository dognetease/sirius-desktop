import { config } from 'env_def';
import { fromEventPattern, from, Observable, interval, of /* , timer */ } from 'rxjs';
import {
  map,
  switchMap,
  tap,
  shareReplay,
  withLatestFrom,
  distinctUntilChanged,
  mergeMap,
  take,
  defaultIfEmpty,
  timeout,
  catchError,
  combineLatestWith,
  filter,
  debounceTime,
  bufferWhen,
  mapTo,
  delay,
} from 'rxjs/operators';
import lodashGet from 'lodash/get';
import { IM_STREAM, SessionInterface, SessionParams } from '@/api/logical/im_stream';
import { NIMApi, Session, IMUser } from '@/api/logical/im';
import { inWindow } from '@/config';
import { EventApi } from '@/api/data/event';
import { api } from '@/api/api';
import { ApiResponse } from '@/api/data/http';
import { EntityContactItem } from '@/api/_base/api';
/**
 * 1.7.0之前IM所有的数据(sessionlist/mutelist/teamlist等)数据都是杂糅在im_impl
 * 为了降低代码的复杂度.准备解构im_impl吧对应的数据都脱离出来装成Rxjsstream数据流
 * 1.7.0版本支持 sessionlist/mutelist/teamlist?/userlist?
 */

type SessionCallback = (sessions: Session[]) => void;
type UpdateSessionCallback = (session: Session[]) => void;

// 优先使用msgtime作为sessiontime
const replaceMsgTime2Updatetime: (session: Session) => Session = session => {
  const msgtime = lodashGet(session, 'lastMsg.time', 0) as number;
  const draftTime = lodashGet(session, 'localCustom.time', 0) as number;
  if (msgtime !== 0 && msgtime > draftTime) {
    session.updateTime = msgtime;
  }
  return session;
};

const replaceUpdatetimeBydraft: (param: Session) => Session = session => {
  const draftTime = lodashGet(session, 'localCustom.time', 0);
  if (Math.max(draftTime, session.updateTime) === draftTime) {
    session.updateTime = draftTime;
  }
  return session;
};
const switchLocalCustom: (session: Session) => Session = session => {
  if (typeof session.localCustom !== 'string') {
    return session;
  }
  try {
    session.localCustom = JSON.parse(session.localCustom);
  } catch (ex) {
    session.localCustom = {};
  }

  return session;
};

// 过滤掉无效的消息
const filterInvalidLocalMsg: (session: Session) => Session = (session: Session) => {
  if (lodashGet(session, 'lastMsg.text', '') === 'CREATE_CONVERSATION_MSG') {
    session.lastMsg = undefined;
  }
  return session;
};

const isInValidSession: (session: Session, myAccount: string) => boolean = (session, myAccount) => {
  const attachType = lodashGet(session, 'lastMsg.attach.type', 'none');
  if (attachType === 'dismissTeam') {
    return false;
  }
  if (attachType === 'leaveTeam') {
    const users = lodashGet(session, 'lastMsg.attach.users', []) as IMUser[];
    return !users.map(item => item.account).includes(myAccount);
  }

  if (attachType === 'removeTeamMembers') {
    const accounts = lodashGet(session, 'lastMsg.attach.accounts', []) as string[];
    return !accounts.includes(myAccount);
  }
  return true;
};

export class SessionStream implements IM_STREAM<Session[]>, SessionInterface {
  private sdk: NIMApi | null = null;

  private subject: Observable<Session[]> | null = null;

  private sessionList: Record<'list', Session[]> = { list: [] };

  private eventApi: EventApi = api.getEventApi();

  private systemApi = api.getSystemApi();

  private httpApi = api.getDataTransApi();

  init(sdk: NIMApi): void {
    this.sdk = sdk;
    const $source = new Observable(o => {
      this.sessionList = new Proxy(this.sessionList, {
        set(target, key, value) {
          if (key === 'list') {
            o.next(value);
          }
          return Reflect.set(target, key, value);
        },
      });
    }) as Observable<Session[]>;

    const $t = $source.pipe(
      // 转热数据
      shareReplay(1)
    );

    this.subject = $t;
    const $myInfo = sdk.imself.getSubject() as Observable<IMUser>;
    // 删除无效(退群/解散/)的会话
    $t.pipe(
      debounceTime(100),
      map(sessions => sessions.filter(session => lodashGet(session, 'lastMsg.attach.type.length', 0) !== 0)),
      combineLatestWith($myInfo),
      map(([sessions, myinfo]) => {
        const toDeletedIds = sessions.filter(session => !isInValidSession(session, myinfo.account)).map(session => session.id);
        return toDeletedIds;
      }),
      filter(toDeletedIds => toDeletedIds.length > 0)
    ).subscribe(toDeletedIds => {
      this.sessionList.list = this.sessionList.list.filter(item => !toDeletedIds.includes(item.id));
      toDeletedIds.forEach(id => {
        this.sdk!.excute('deleteLocalSession', {
          id,
        });
      });
    });

    this._onsessions();
    this._onupdatesessions();
    this._onnetworkchanged();
  }

  _onsessions() {
    // 获取全量session列表
    const onsession = (handler: SessionCallback) => {
      this.sdk!.subscrible('onsessions', handler);
    };
    const onremovesession = (handler: SessionCallback) => {
      this.sdk!.unSubcrible('onsessions', handler);
    };

    const activeUpdateSession = () =>
      interval(10000).pipe(
        take(5),
        switchMap(() => {
          const $request = this._fetchSessionList({ limit: 100 });
          return from($request).pipe(
            timeout(8000),
            map(result => (Array.isArray(result) ? result : [])),
            catchError(() => of().pipe(defaultIfEmpty([] as Session[])))
          );
        }),
        tap(sessions => {
          console.log('[im.sessions]getlocalsessions', sessions);
        })
      );

    const $event = (fromEventPattern(onsession, onremovesession) as Observable<Session[]>).pipe(
      take(1),
      // startWith([] as Session[]),\
      tap(list => {
        console.log('[im.sessions]init', list);
      }),
      timeout({
        first: 60 * 1000,
      }),
      catchError(error => {
        console.log('[im.sessions]onsessionfailed', error);
        //  发送im绘画列表ready事件
        this.eventApi.sendSysEvent({
          eventName: 'initModule',
          eventStrData: 'im',
        });
        return activeUpdateSession();
      }),
      map(sessions =>
        sessions.map(session =>
          [
            // 转换本地数据
            switchLocalCustom,
            // 优先使用lastmsg的time字段排序
            replaceMsgTime2Updatetime,
            // 比较草稿时间和消息updatetime 取大
            replaceUpdatetimeBydraft,
            // 不展示文本=CREATE_CONVERSATION_MSG的文本
            filterInvalidLocalMsg,
          ].reduce((total, current) => current(total), session)
        )
      )
    );

    const fetchyunxinId = async () => {
      const user = this.systemApi.getCurrentUser();

      const yxIndex = (lodashGet(user, 'contact!.contactInfo', []) as EntityContactItem[]).findIndex(({ contactItemType }) => contactItemType === 'yunxin');
      if (yxIndex !== -1) {
        return lodashGet(user, `contact.contactInfo[${yxIndex}].contactItemVal`, '') as string;
      }
      // contactInfo这个时候可能没有灌入 需要调用服务端接口去获取
      const accountUrl = this.systemApi.getUrl('getAccountInfo');
      const result = (await this.httpApi.get(accountUrl, { needUnitNamePath: false })) as ApiResponse<{
        yunxinAccountId: string;
      }>;
      return lodashGet(result, 'data.data.yunxinAccountId', '') as string;
    };

    const url = this.systemApi.getUrl('getHasSession');
    const appkey = config('NIMSID') as string;
    const MAX_DAYS = appkey.startsWith('13af9') ? 7 : 30;

    from(fetchyunxinId())
      .pipe(
        switchMap(yxId => {
          const $request = this.httpApi.get(url, {
            yxId,
            minTimestamp: new Date().getTime() - MAX_DAYS * 24 * 60 * 60 * 1000,
          }) as Promise<ApiResponse<boolean>>;
          return from($request).pipe(map(res => lodashGet(res, 'data.data', true) === false));
        }),
        catchError(error => {
          console.error(`[im.sessionlist]server:${url}.error:`, error);
          return of(false);
        }),
        filter(flag => flag),
        mapTo([] as Session[])
      )
      .subscribe(() => {
        this.sessionList.list = [] as Session[];
      });

    $event.subscribe({
      next: async list => {
        this.sessionList.list = await this.sdk!.excuteSync('mergeSessions', this.sessionList.list, list);
      },
      error(error) {
        console.error('[im.sessionlist]onsession.caughterror', error);
      },
    });
  }

  _onupdatesessions() {
    // session更新
    const onupdatesession = (handler: UpdateSessionCallback) => {
      this.sdk!.subscrible('onupdatesession', handler);
    };
    const onremoveupdatesession = (handler: UpdateSessionCallback) => {
      this.sdk!.unSubcrible('onupdatesession', handler);
    };

    const $event = fromEventPattern(onupdatesession, onremoveupdatesession) as Observable<Session>;
    return $event
      .pipe(
        tap(session => {
          console.log('[im.session]onupdatesession', session);
        }),
        // 没有updateTime的会话统一都认为是无效会话
        filter(item => lodashGet(item, 'updateTime', 0) !== 0)
      )
      .pipe(
        map(session =>
          [
            // 转换本地数据
            switchLocalCustom,
            // 优先使用消息的lastmsg字段排序
            replaceMsgTime2Updatetime,
            // 比较草稿时间和消息updatetime 取大
            replaceUpdatetimeBydraft,
            // 不展示文本=CREATE_CONVERSATION_MSG的文本
            filterInvalidLocalMsg,
          ].reduce((total, current) => current(total), session)
        )
      )
      .subscribe(async session => {
        const sessions = (await this.sdk!.excuteSync('mergeSessions', this.sessionList.list, session)) as Session[];
        this.sessionList.list = sessions;
      });
  }

  _onnetworkchanged() {
    if (!inWindow()) {
      return;
    }
    // 网络重连之后拉取最新数据
    const onconnect = (handler: (e: unknown) => void) => {
      this.sdk!.subscrible('onconnect', handler);
    };
    const offconnect = (handler: (e: unknown) => void) => {
      this.sdk!.unSubcrible('onconnect', handler);
    };

    const $connect = fromEventPattern(onconnect, offconnect);

    const onwillconnect = (handler: (e: unknown) => void) => {
      this.sdk!.subscrible('onwillreconnect', handler);
    };
    const offwillconnect = (handler: (e: unknown) => void) => {
      this.sdk!.unSubcrible('onwillreconnect', handler);
    };
    const $reconnect = fromEventPattern(onwillconnect, offwillconnect);

    $reconnect
      .pipe(
        mapTo(1),
        bufferWhen(() => $connect),
        filter(list => list.includes(1)),
        switchMap(() =>
          interval(3000).pipe(
            take(3),
            mergeMap(() => this._fetchSessionList())
          )
        ),
        map(sessions => sessions.map(session => replaceUpdatetimeBydraft(switchLocalCustom(session))))
      )
      .subscribe(async list => {
        const mergedlist = (await this.sdk!.excuteSync('mergeSessions', this.sessionList.list, list as Session[])) as Session[];
        this.sessionList.list = mergedlist;
      });
  }

  async _fetchSessionList(options: SessionParams = {}): Promise<Session[]> {
    if (!this.sdk || !this.sdk.getInstance()) {
      return [];
    }
    try {
      const res = (await this.sdk.excute('getLocalSessions', {
        limit: 50,
        ...options,
      })) as {
        sessions: Session[];
      };
      return res.sessions;
    } catch (e) {
      console.warn('[im]', e);
      return [];
    }
  }

  async getMoreSessions(options = {}) {
    const sessions = (await this._fetchSessionList(options)) as Session[];
    const list = (await this.sdk?.excuteSync('mergeSessions', this.sessionList.list, sessions)) as Session[];
    this.sessionList.list = list;
    return Promise.resolve();
  }

  async deleteSession(id: string | string[]) {
    await this.sdk!.excute('deleteLocalSession', {
      id,
      isLogic: true,
    });
    this.sessionList.list = this.sessionList.list.filter(item => {
      if (Array.isArray(id)) {
        return !id.includes(item.id);
      }
      return id !== item.id;
    });
  }

  getSubject() {
    return this.subject;
  }

  getSession($ids: Observable<string | string[]>) {
    const $sessionId = $ids.pipe(map(args => (Array.isArray(args) ? args[0] : args)));
    return this.subject!.pipe(
      withLatestFrom($sessionId),
      map(args => {
        const [sessionList, ids] = args;
        const targetSession = sessionList.find(session => {
          if (Array.isArray(ids)) {
            return session.id === ids[0];
          }
          return session.id === ids;
        }) as Session;
        return targetSession;
      })
    );
  }

  getSessionField($args: Observable<[string, string]>, $hash?: Observable<string>): Observable<unknown> {
    const $sessionId = $args.pipe(map(args => args[0]));
    const $key = $args.pipe(map(args => args[1]));

    const $val = this.subject!.pipe(
      withLatestFrom($sessionId),
      map(args => {
        const [sessionList, sessionId] = args;
        const targetSession = sessionList.find(session => session.id === sessionId) as Session;
        return targetSession;
      }),
      withLatestFrom($key),
      map(args => {
        const [session, key] = args;
        return lodashGet(session, key);
      }),
      distinctUntilChanged()
    );

    if ($hash) {
      const $hashChanged = $hash.pipe(
        delay(20),
        map(val => val.includes('message')),
        distinctUntilChanged()
      );
      return $val.pipe(
        combineLatestWith($hashChanged),
        filter(([, flag]) => flag),
        map(([data]) => data)
      );
    }
    return $val;
  }

  updateLocalCustom(sessionId: string, info: Record<string, unknown>) {
    const $args = of().pipe(defaultIfEmpty([sessionId, 'localCustom'])) as Observable<[string, string]>;
    this.getSessionField($args)
      .pipe(take(1))
      .subscribe(localCustom => {
        let _customObj = localCustom;
        try {
          _customObj = JSON.parse(localCustom as string);
        } catch (ex) {}
        this.sdk?.excute('updateLocalSession', {
          id: sessionId,
          localCustom: JSON.stringify(Object.assign(_customObj || {}, info)),
        });
      });
  }
}
