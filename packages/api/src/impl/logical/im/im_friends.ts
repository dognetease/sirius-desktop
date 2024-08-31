import { from, fromEventPattern, Observable, map, merge } from 'rxjs';
import { timeout, catchError, switchMap, startWith, filter, mergeMap, scan, withLatestFrom, shareReplay } from 'rxjs/operators';
import { IM_STREAM } from '@/api/logical/im_stream';
import { IMUser, NIMApi, Session } from '@/index';

interface IMFriend {
  account: string;
  createTime: number;
  updateTime: number;
  valid: true;
}

interface SYNC_IMFriends_Options {
  type: 'addFriend' | string;
  friend: IMFriend;
  account: string;
}
type ON_Friends_Handler = (list: IMFriend[]) => void;

type ONSYNC_Friend_Handler = (param: SYNC_IMFriends_Options) => void;
export class IM_Friends implements IM_STREAM {
  private sdk: null | NIMApi = null;

  private observable: Observable<IMUser[]> | null = null;

  init(sdk: NIMApi) {
    this.sdk = sdk;
    this.initFriends();

    this.observable = merge(this.initFriends(), this.onsyncFriend(), this.addFriends())
      .pipe(scan((total, current) => [...total, ...current], [] as IMUser[]))
      .pipe(shareReplay(1));
  }

  private initFriends() {
    const onfriends = (handler: ON_Friends_Handler) => {
      this.sdk!.subscrible('onfriends', handler);
    };
    const offfriends = (handler: ON_Friends_Handler) => {
      this.sdk!.unSubcrible('onfriends', handler);
    };

    const $event = (fromEventPattern(onfriends, offfriends) as Observable<IMFriend[]>).pipe(
      timeout(3000),
      catchError(error => {
        console.log('[im.friends]on timeout', error);
        const $request = this.sdk!.excute('getFriends', {}) as Promise<IMFriend[]>;
        return from($request);
      }),
      switchMap(list => {
        const accounts = list.map(item => item.account);
        const $request = this.sdk!.excute('getUsers', {
          accounts,
        }) as Promise<IMUser[]>;
        return from($request);
      }),
      startWith([] as IMUser[])
    );
    return $event;
  }

  private onsyncFriend() {
    const onsyncFriend = (handler: ONSYNC_Friend_Handler) => {
      this.sdk!.subscrible('onsyncfriendaction', handler);
    };
    const offsyncFriend = (handler: ONSYNC_Friend_Handler) => {
      this.sdk!.subscrible('onsyncfriendaction', handler);
    };
    const $event = fromEventPattern(onsyncFriend, offsyncFriend) as Observable<SYNC_IMFriends_Options>;

    return $event.pipe(
      filter(item => item.type === 'addFriend'),
      switchMap(friend => {
        console.log('[im.friends]sync', friend);
        const $request = this.sdk?.excute('getUser', {
          account: friend.account,
          sync: true,
        }) as Promise<IMUser>;
        return from($request);
      }),
      map(user => [user])
    );
  }

  private addFriends() {
    const $sessionStream = this.sdk?.sessionStream.getSubject() as Observable<Session[]>;

    return $sessionStream.pipe(
      map(list => list.filter(item => item.scene === 'p2p' && /^lx_/i.test(item.to)).map(item => item.to)),
      filter(list => list.length > 0),
      withLatestFrom(this.observable as Observable<IMUser[]>),
      // 筛选出不在好友列表中的用户
      map(([toList, friends]) => {
        const friendAccounts = friends.map(item => item.account);
        return toList.filter(to => !friendAccounts.includes(to));
      }),
      filter(list => list.length > 0),
      mergeMap(toList => {
        const $request = Promise.all(
          toList.map(
            to =>
              this.sdk!.excute('addFriend', {
                account: to,
                ps: 'hello',
              }) as Promise<SYNC_IMFriends_Options>
          )
        );
        return from($request);
      }),
      mergeMap(friends => {
        const accounts = friends.map(friend => friend.account);
        const $request = this.sdk!.excute('getUsers', {
          accounts,
        }) as Promise<IMUser[]>;
        return from($request);
      })
    );
  }

  getSubject() {
    return this.observable;
  }
}
