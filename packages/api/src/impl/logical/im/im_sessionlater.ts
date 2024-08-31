import { map, switchMap, filter, withLatestFrom, catchError, debounceTime, pairwise, combineLatestWith, take } from 'rxjs/operators';
import { fromEventPattern, Observable, from, timeout, merge } from 'rxjs';
import lodashGet from 'lodash/get';
import { EventEmitter } from 'events';
import { NIMApi, SystemMessage, Session } from '@/api/logical/im';
import { api as masterApi } from '@/api/api';
import { apis } from '@/config';
import { IMTeamApi } from '@/api/logical/imTeam';
import { IM_STREAM, SissionLaterParams, SessionLaterInterface } from '@/api/logical/im_stream';

interface laterItem {
  session_type: string;
  session_id: string;
}
type OnConnectHandler = (params: unknown) => void;
export class IM_Later implements IM_STREAM<string[]>, SessionLaterInterface {
  sdk: NIMApi | null = null;

  observable: Observable<string[]> | null = null;

  private imHttpApi: IMTeamApi;

  private nimApi: NIMApi;

  private myEvent = new EventEmitter();

  static EventDeclare = {
    sessionRenderComplete: 'sessionRenderComplete',
  };

  constructor() {
    this.imHttpApi = masterApi.requireLogicalApi(apis.imTeamApiImpl) as unknown as IMTeamApi;
    this.nimApi = masterApi.requireLogicalApi('NIM') as unknown as NIMApi;
  }

  getSubject() {
    return this.observable;
  }

  init(sdk: NIMApi) {
    this.sdk = sdk;
    const oncustomsysmsg = (handler: OnConnectHandler) => {
      this.sdk!.subscrible('oncustomsysmsg', handler);
    };
    const offcustomsysmsg = (handler: OnConnectHandler) => {
      this.sdk!.unSubcrible('oncustomsysmsg', handler);
    };

    const onconnect = (handler: OnConnectHandler) => {
      this.sdk!.subscrible('onconnect', handler);
    };
    const offconnect = (handler: OnConnectHandler) => {
      this.sdk!.unSubcrible('onconnect', handler);
    };

    const $sessionStream = this.sdk.sessionStream.getSubject() as Observable<Session[]>;
    const $sessionReady = $sessionStream.pipe(
      map(list => list.length),
      filter(len => len > 0),
      take(1)
    );

    const onsessionRenderComplete = (handler: (e: void) => void) => {
      this.myEvent.addListener(IM_Later.EventDeclare.sessionRenderComplete, handler);
    };
    const offsessionRenderComplete = (handler: (e: void) => void) => {
      this.myEvent.removeListener(IM_Later.EventDeclare.sessionRenderComplete, handler);
    };

    const $sessionRenderComplete = fromEventPattern(onsessionRenderComplete, offsessionRenderComplete);

    const $sessionConnect = fromEventPattern(onconnect, offconnect);

    const $request = merge($sessionRenderComplete, $sessionConnect).pipe(
      debounceTime(200),
      switchMap(() => {
        const _request = this.getRealIdList() as Promise<string[]>;
        return from(_request).pipe(timeout(15000));
      }),
      catchError(err => {
        console.warn('[im.later]interface error', err);
        return $sessionStream!.pipe(map(sessionList => sessionList.filter(item => lodashGet(item, 'localCustom.later', false)).map(item => item.id)));
      })
    );

    const _notify = fromEventPattern(oncustomsysmsg, offcustomsysmsg).pipe(
      debounceTime(200),
      filter(data => {
        const msgType = JSON.parse((data as SystemMessage)?.content || '{}')?.subType;
        return msgType === 'session_later';
      }),
      map(data => {
        const laterMsg = JSON.parse(JSON.parse((data as SystemMessage)?.content || '{}')?.data || '{}');
        const idList = Array.isArray(laterMsg?.sessions) ? laterMsg?.sessions.map((item: laterItem) => `${item.session_type}-${item.session_id}`) : [];
        return idList as string[];
      })
    );

    const $notify = $sessionReady.pipe(switchMap(() => _notify));

    const $observable = merge($request, $notify);

    // 接口返回的是稍后处理但是本地不是稍后处理-更新本地消息为稍后处理
    $observable
      .pipe(withLatestFrom($sessionStream))
      .pipe(
        filter(([, sessionList]) => sessionList.length > 0),
        map(([laterIdList, sessionList]) => {
          const sessionIdList = sessionList.filter(item => !lodashGet(item, 'localCustom.later', false)).map(item => item.id);
          return laterIdList.filter((item: string) => sessionIdList.includes(item));
        }),
        filter(laterIdList => laterIdList.length > 0)
      )
      .subscribe(laterIdList => {
        laterIdList.forEach((item: string) => this.nimApi.sessionStream.updateLocalCustom(item, { later: true }));
      });

    // 接口返回的不是稍后处理（也就是没有返回该id）但是本地是稍后处理-更新本地消息完成稍后处理
    // 如果当前会话列表不是完整的可能会有写入异常的问题(暂时先不考虑)
    $observable
      .pipe(withLatestFrom($sessionStream))
      .pipe(
        filter(([, sessionList]) => sessionList.length > 0),
        map(([laterIdList, sessionList]) => {
          const sessionIdList = sessionList.filter(item => lodashGet(item, 'localCustom.later', false)).map(item => item.id);
          return sessionIdList.filter((item: string) => !laterIdList.includes(item));
        }),
        filter(sessionIdList => sessionIdList.length > 0)
      )
      .subscribe(sessionIdList => {
        sessionIdList.forEach((item: string) => this.nimApi.sessionStream.updateLocalCustom(item, { later: false }));
      });

    // 会话数量非连续增加(>-=2表示是通过getLocalSession拉过来的会话)的时候持续写入
    $sessionStream
      .pipe(
        map(sessions => sessions.length),
        pairwise(),
        filter(([prevCount, nextCount]) => nextCount - prevCount >= 2),
        combineLatestWith($request),
        filter(([, idList]) => idList.length > 0),
        take(10)
      )
      .subscribe(([, idList]) => {
        idList.forEach(id => {
          this.nimApi.sessionStream.updateLocalCustom(id, { later: true });
        });
      });

    this.observable = $observable;
  }

  private getRealIdList = async () => {
    const laterRes = await this.imHttpApi.syncLater();
    const idList = Array.isArray(laterRes?.data?.sessions) ? laterRes?.data?.sessions.map((item: laterItem) => `${item.session_type}-${item.session_id}`) : [];
    return idList as string[];
  };

  // 接口操作稍后处理/已处理
  updateLater = (params: SissionLaterParams) => {
    const { sessionId, sessionType, isLater } = params;
    const numSessionId = sessionId.split('-')[1];
    // 调用接口，通知后端
    if (isLater) {
      this.imHttpApi.completeLater(numSessionId);
    } else {
      const addParams = {
        session_id: numSessionId,
        session_type: sessionType,
      };
      this.imHttpApi.addLater(addParams);
    }
  };

  // 获取later列表
  getLaterList() {
    this.myEvent.emit(IM_Later.EventDeclare.sessionRenderComplete, '');
  }
}
