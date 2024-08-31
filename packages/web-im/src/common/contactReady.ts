/**
 * 多个地方使用了用户信息(nick,avatar,email...)
 * 统一在这个地方维护(添加/删除/更新)
 */
import { apiHolder, apis, ContactApi, OrgApi } from 'api';
import { of, fromEventPattern } from 'rxjs';
import { catchError, mapTo, map, timeout } from 'rxjs/operators';

const contactApi = apiHolder.api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
const eventApi = apiHolder.api.getEventApi();

// 异步判断通讯录是否已经OK
export const subscribleContactReady = () => {
  const onnotify = handler => {
    eventApi.registerSysEventObserver('contactNotify', handler);
  };

  const $notify = fromEventPattern(onnotify).pipe(
    mapTo(true),
    timeout(3000),
    catchError($error => of(true))
  );

  return of(contactApi.getContactSyncTimes()).pipe(
    map(time => {
      if (time > 0) {
        return true;
      }
      throw new Error('contactUnSync');
    }),
    catchError($error => $notify)
  );
};
