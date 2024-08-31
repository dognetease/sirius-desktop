// import { map, withLatestFrom, single, tap } from 'rxjs/operators';
import { map, switchMap, shareReplay, exhaustMap, mergeWith, scan } from 'rxjs/operators';
import { from, fromEventPattern, Observable, of, distinct, mapTo, catchError, timeout, take, defer } from 'rxjs';
import lodashGet from 'lodash/get';
import { NIMApi, IMUser } from '@/api/logical/im';
import { api as masterApi } from '@/api/api';
import { IM_STREAM, MyinfoInterface } from '@/api/logical/im_stream';
import { apis } from '../../../config';
import { ContactAndOrgApi } from '@/api/logical/contactAndOrg';
import { ApiResponse } from '@/api/data/http';

type OnConnectHandler = (params: unknown) => void;
export class IM_Self implements IM_STREAM<IMUser>, MyinfoInterface {
  sdk: NIMApi | null = null;

  observable: Observable<IMUser> | null = null;

  private systemApi = masterApi.getSystemApi();

  private eventApi = masterApi.getEventApi();

  private httpApi = masterApi.getDataTransApi();

  private contactApi = masterApi.requireLogicalApi(apis.contactApiImpl) as unknown as ContactAndOrgApi;

  getSubject() {
    return this.observable;
  }

  init(sdk: NIMApi) {
    this.sdk = sdk;
    const onconnect = (handler: OnConnectHandler) => {
      this.sdk!.subscrible('onconnect', handler);
    };
    const offconnect = (handler: OnConnectHandler) => {
      this.sdk!.subscrible('onconnect', handler);
    };

    const fetchAccountInfo: () => Promise<Record<string, unknown>> = async () => {
      const url = this.systemApi.getUrl('getAccountInfo');
      const user = this.systemApi.getCurrentUser();

      const sid = lodashGet(user, 'sessionId', '');
      try {
        const res = (await this.httpApi.get(url, { sid, needUnitNamePath: false })) as ApiResponse<Record<'yunxinAccountId', string>>;
        return {
          nick: lodashGet(res, 'data.data.nickName', '') as string,
          account: lodashGet(res, 'data.data.yunxinAccountId', '') as string,
        };
      } catch (ex) {}

      return {};
    };

    const $observable = fromEventPattern(onconnect, offconnect).pipe(
      exhaustMap(() => this.subscribeContactReady()),
      switchMap(() => {
        console.log('[im.myaccount]contactReady');

        const user = this.systemApi.getCurrentUser();
        const account = user?.contact?.contactInfo.find(item => item.contactItemType === 'yunxin')?.contactItemVal || '';
        const color = user?.contact?.contact?.color || 'transparent';
        const pinyinname = user?.contact?.contact?.contactPYName || '';

        return of({
          nick: user?.nickName || '',
          email: user?.id || '',
          account,
          color: color,
          pinyinname,
        }).pipe(
          mergeWith(
            defer(() => {
              return from(fetchAccountInfo());
            })
          ),
          scan((total, current) => {
            total = { ...total, ...current };
            if (current.account && !total.account) {
              total.account = current.account as string;
            }
            return total;
          }, {} as IMUser)
        );
      }),
      shareReplay(1)
    );

    this.observable = $observable;
  }

  private subscribeContactReady() {
    const onnotify = (handler: (count: unknown) => void) => {
      this.eventApi.registerSysEventObserver('updateUserInfo', { func: handler });
    };

    const $notify = fromEventPattern(onnotify).pipe(
      take(1),
      mapTo(true),
      timeout({
        first: 5000,
      }),
      catchError($error => {
        console.warn('[im.myaccount]notify', $error);
        return from(Promise.resolve(true));
      })
    );

    return of(this.contactApi.getContactSyncTimes()).pipe(
      map(time => {
        if (time > 0) {
          return true;
        }
        throw new Error('contactUnSync');
      }),
      catchError(() => $notify)
    );
  }

  getMyField(field: keyof IMUser = 'account') {
    return this.observable!.pipe(
      distinct(info => info[field]),
      map(user => user[field])
    );
  }
}
