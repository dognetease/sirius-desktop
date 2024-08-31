import { EventEmitter } from 'events';
import { fromEventPattern, Observable, from } from 'rxjs';
import { tap, shareReplay, map, scan, startWith, mergeWith, timeout, catchError, take, switchMap } from 'rxjs/operators';
import lodashGet from 'lodash/get';
import { IM_STREAM, P2PMuteInterface } from '@/api/logical/im_stream';
import { NIMApi } from '@/api/logical/im';

interface MuteParam {
  account: string;
  isAdd: boolean;
}
type OnMuteCallback = (param: {}) => void;
type OnSyncMuteCallback = (param: MuteParam) => void;
export class P2PMuteStream implements IM_STREAM<string[]>, P2PMuteInterface {
  private sdk: NIMApi | null = null;

  private toggleSubject: Observable<MuteParam>;

  private subject: Observable<string[]> | null = null;

  private myEvent = new EventEmitter();

  static Event_Name_Collections = {
    updateMute: 'updateMute',
  };

  constructor() {
    const { updateMute } = P2PMuteStream.Event_Name_Collections;
    const onUpdateMute = (handler: (e: MuteParam) => void) => {
      this.myEvent.addListener(updateMute, handler);
    };
    const offUpdateMute = (handler: (e: MuteParam) => void) => {
      this.myEvent.removeListener(updateMute, handler);
    };
    this.toggleSubject = fromEventPattern(onUpdateMute, offUpdateMute);
  }

  init(sdk: NIMApi): void {
    this.sdk = sdk;
    // 合并数据
    this.subject = (this._onmutelist() as Observable<string[]>).pipe(
      mergeWith(this._onsyncmarkinmutelist(), this.toggleSubject),
      tap(args => {
        console.log('[im.p2pmute]combineLatest', args);
      }),
      scan(this._computeTotalMute, [] as string[]),
      catchError(() => from(Promise.resolve([] as string[]))),
      startWith([] as string[]),
      shareReplay(1)
    );

    this.subject.subscribe(args => {
      console.log('[im.p2pmute]subscribe', args);
    });
  }

  private _computeTotalMute(total: string[], current: string[] | MuteParam): string[] {
    // 将onmute的列表数据全部合并到total中
    const _list = new Set([...total, ...(Array.isArray(current) ? current : [])]);

    if (lodashGet(current, 'isAdd', undefined) === true) {
      _list.add((current as MuteParam).account);
    } else if (lodashGet(current, 'isAdd', undefined) === false) {
      _list.delete((current as MuteParam).account);
    }

    return [..._list];
  }

  // 获取当前用户静音列表
  _onmutelist() {
    const onconnect = (handler: (e: unknown) => void) => {
      this.sdk!.subscrible('onconnect', handler);
    };
    const offconnect = (handler: (e: unknown) => void) => {
      this.sdk!.subscrible('onconnect', handler);
    };

    const onmute = (handler: OnMuteCallback) => {
      this.sdk!.subscrible('onmutelist', handler);
    };
    const offmute = (handler: OnMuteCallback) => {
      this.sdk!.unSubcrible('onmutelist', handler);
    };

    const $event = fromEventPattern(onconnect, offconnect).pipe(
      switchMap(() => fromEventPattern(onmute, offmute).pipe(timeout(30 * 1000))),
      take(1)
    );

    return $event
      .pipe(
        catchError(error => {
          console.log('[im.p2pmutelist]error', error);
          const $request = this.sdk!.excute('getRelations', {}) as Promise<{
            blacklist: unknown[];
            mutelist: MuteParam[];
          }>;
          return from($request).pipe(map(({ mutelist }) => mutelist));
        }),
        map(list => (list as MuteParam[]).map(item => item.account)),
        tap((args: unknown) => {
          console.log('[im.p2pmute]onmute', args);
        })
      )
      .pipe(
        catchError(() => from(Promise.resolve([] as string[]))),
        startWith([])
      );
  }

  // 静音列表增量更新
  _onsyncmarkinmutelist() {
    const onsyncmarkinmutelist = (handler: OnSyncMuteCallback) => {
      this.sdk!.subscrible('onsyncmarkinmutelist', handler);
    };
    const offsyncmarkinmutelist = (handler: OnSyncMuteCallback) => {
      this.sdk!.unSubcrible('onsyncmarkinmutelist', handler);
    };
    return (fromEventPattern(onsyncmarkinmutelist, offsyncmarkinmutelist) as Observable<MuteParam>).pipe(
      tap(args => {
        console.log('[im.p2pmute]onsync', args);
      })
    );
  }

  // 设置静音状态
  async toggleMute(params: { isAdd: boolean; account: string }) {
    // todo:调用服务端接口设置静音状态(设置移动端的推送状态)
    const { account, isAdd } = await this.sdk!.excute('markInMutelist', params);
    const { updateMute: eventName } = P2PMuteStream.Event_Name_Collections;
    this.myEvent.emit(eventName, { account, isAdd });
  }

  getSubject() {
    return this.subject;
  }
}
