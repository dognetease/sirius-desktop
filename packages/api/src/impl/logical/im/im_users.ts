import { defer, from, fromEventPattern, iif, merge, Observable, of, timer } from 'rxjs';
import {
  startWith,
  scan,
  map,
  shareReplay,
  filter,
  withLatestFrom,
  mergeMap,
  distinct,
  combineLatestWith,
  distinctUntilChanged,
  bufferToggle,
  throttleTime,
  switchMap,
  toArray,
  mergeWith,
  catchError,
  tap,
  delay,
  take,
} from 'rxjs/operators';
import { EventEmitter } from 'events';
import lodashGet from 'lodash/get';
import { convertToPinyin } from 'tiny-pinyin';
import { api as masterApi } from '@/api/api';
import { IM_STREAM, IMUserInterface } from '@/api/logical/im_stream';
import { NIMApi, IMUser } from '@/api/logical/im';
import { apis } from '@/config';
// import { apis } from '../../../config';
import { ContactAndOrgApi } from '@/api/logical/contactAndOrg';
import { ContactModel } from '@/index';

type ON_USER_HANLDER = (users: IMUser[]) => void;
type ON_REQUEST_HANDLER = (account: string) => void;

const switchContact2IMUser: (list: ContactModel[]) => IMUser[] = list => {
  const _switch = (contact: ContactModel) => {
    const contactInfo = contact.contactInfo.filter(item => item.contactItemType === 'yunxin')[0];

    return {
      avatar: contact.contact.avatar,
      account: contactInfo.contactItemVal,
      email: contact.contact.accountName,
      nick: contact.contact.contactName,
      pinyinname: contact.contact.contactPYName,
      color: contact.contact.color,
      status: contact.contact.accountStatus,
      tel: '',
      contactId: contact.contact.id,
    } as IMUser;
  };
  return list.filter(item => lodashGet(item, 'contactInfo.length', 0) !== 0 && lodashGet(item, 'contact.enableIM', true) !== false).map(item => _switch(item));
};

// 这个user列表表示云信中的用户(通知助手/云文档助手)
export class IM_Users implements IM_STREAM<Record<string, IMUser>>, IMUserInterface {
  private sdk: NIMApi | null = null;

  private subject: Observable<Record<string, IMUser>> | null = null;

  private myEvent = new EventEmitter();

  private contactApi = masterApi.requireLogicalApi(apis.contactApiImpl) as unknown as ContactAndOrgApi;

  static Event_Names = {
    // 增加用户
    onusers: 'onusers',
    // 发送请求
    request: 'request',
  };

  init(sdk: NIMApi) {
    this.sdk = sdk;

    const onusers = (handler: ON_USER_HANLDER) => {
      this.myEvent.on(IM_Users.Event_Names.onusers, handler);
    };
    const offusers = (handler: ON_USER_HANLDER) => {
      this.myEvent.off(IM_Users.Event_Names.onusers, handler);
    };
    this.subject = (fromEventPattern(onusers, offusers) as Observable<IMUser[]>).pipe(
      scan((total, current) => [...total, ...current], [] as IMUser[]),
      map(list =>
        list.reduce((total, current) => {
          total = {
            ...total,
            [current.account]: current,
          };
          return total;
        }, {} as Record<string, IMUser>)
      ),
      startWith({} as Record<string, IMUser>),
      shareReplay(1)
    );

    const onrequest = (handler: ON_REQUEST_HANDLER) => {
      this.myEvent.on(IM_Users.Event_Names.request, handler);
    };
    const offrequest = (handler: ON_REQUEST_HANDLER) => {
      this.myEvent.off(IM_Users.Event_Names.request, handler);
    };

    const $event = fromEventPattern(onrequest, offrequest) as Observable<string>;

    const $eventBuffer = $event.pipe(throttleTime(50));
    $event
      .pipe(
        tap(val => {
          console.log('[im.users]request.item', val);
        }),
        bufferToggle($eventBuffer, () => timer(50))
      )
      .pipe(
        withLatestFrom(this.subject),
        map(([accounts, userMap]) => {
          console.log('im_user:', accounts);

          const _accounts = [...new Set(accounts)];
          const keys = Object.keys(userMap);
          return _accounts.filter(account => !keys.includes(account));
        }),
        mergeMap(accounts => {
          const contactAccounts = accounts.filter(item => item.indexOf('lx_') === -1).map(id => id.replace(/@\d+$/, ''));
          const yunxinAccounts = accounts.filter(item => item.indexOf('lx_') !== -1).map(id => id.replace(/@\d+$/, ''));

          return this._queryContactUsers(contactAccounts).pipe(mergeWith(this._queryYunxinUsers(yunxinAccounts)));
        }),
        map(users =>
          users.map(item => {
            item.pinyin = convertToPinyin(item.nick, '-', true);
            return item;
          })
        ),
        catchError(error => {
          console.log('[im.users]request.failed', error);
          return from(Promise.resolve([] as IMUser[]));
        })
      )
      .subscribe(users => {
        console.log('[im.users]request.complete', users);
        this.myEvent.emit(IM_Users.Event_Names.onusers, users);
      });
  }

  _queryContactUsers(accounts: string[]) {
    return of(...accounts).pipe(
      toArray(),
      filter(arr => arr.filter(item => item.length > 0).length > 0),
      switchMap(ids => {
        const requestPromise = this.contactApi.doGetContactByYunxin(ids);
        return from(requestPromise);
      }),
      mergeMap(({ needRequestAccounts, contactModelList }) =>
        iif(
          () => Array.isArray(needRequestAccounts) && needRequestAccounts.length > 0,
          merge(from(Promise.resolve(contactModelList)), from(this.contactApi.doGetServerContactByYunxin(needRequestAccounts))),
          from(Promise.resolve(contactModelList))
        )
      ),
      map(users => switchContact2IMUser(users))
    );
  }

  _queryYunxinUsers(accounts: string[]) {
    return from(Promise.resolve(accounts)).pipe(
      filter(item => item.length > 0),
      switchMap(ids => {
        const $request = defer(() => {
          const request = this.sdk!.excute('getUsers', {
            accounts: ids,
          }) as Promise<IMUser[]>;
          return from(request);
        });
        return $request.pipe(
          catchError((err, caught) => {
            console.log('[im.users]request.yunxunaccounts.error', err);
            return caught.pipe(delay(2000), take(10));
          })
        );
      })
    );
  }

  getUserById($account: Observable<string>) {
    return (this.subject as Observable<Record<string, IMUser>>).pipe(
      combineLatestWith($account),
      map(([userMap, account]) => userMap[account]),
      distinctUntilChanged((prev, next) => ['account', 'nick', 'avatar'].every(field => lodashGet(prev, field, '') === lodashGet(next, field, '')))
    );
  }

  getUsersByIds($ids: Observable<string[]>) {
    return (this.subject as Observable<Record<string, IMUser>>).pipe(
      combineLatestWith(from($ids)),
      map(([users, accounts]) => accounts.filter(account => lodashGet(users, `${account}.nick.length`, 0) !== 0).map(item => users[item])),
      map(checkedUser =>
        checkedUser.reduce(
          (total, current) => ({
            ...total,
            [current.account]: current,
          }),
          {} as Record<string, IMUser>
        )
      ),
      distinctUntilChanged((prev, next) => Object.keys(prev || {}).join('-') === Object.keys(next || {}).join('-'))
    );
  }

  // 获取用户属性
  getUserProp($id: Observable<string>, $prop: Observable<keyof IMUser>) {
    const $result = (this.subject as Observable<Record<string, IMUser>>).pipe(
      combineLatestWith(from($id)),
      filter(([userMap, account]) => Reflect.has(userMap, account)),
      map(([userMap, account]) => userMap[account]),
      withLatestFrom($prop),
      distinct(([user, key]) => user[key]),
      map(([user, key]) => user[key])
    );
    return $result;
  }

  // 查询账号信息
  requestUser(account: string | string[]) {
    this.myEvent.emit(IM_Users.Event_Names.request, account);
  }

  getSubject() {
    return this.subject;
  }
}
