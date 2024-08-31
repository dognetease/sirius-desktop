import { useState, useEffect } from 'react';
import { apis, apiHolder, NetStorageApi, DataStoreApi, api, inWindow } from 'api';
import { BehaviorSubject, from, timer } from 'rxjs';
import { delayWhen, first, retryWhen, take, tap } from 'rxjs/operators';

const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const dataStoreApi: DataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;
const systemApi = api.getSystemApi();

let hasFetched = false; // 是否已经发送请求
const STORE_KEY = 'disk_check_create_unitable_available';
const storeData = dataStoreApi.getSync(STORE_KEY)?.data;
const initState = storeData == undefined ? true : storeData === 'true';

export const unitableAvailable$ = new BehaviorSubject<boolean>(initState);

const fetchData = () =>
  from(diskApi.checkCreateUnitableAvailable())
    .pipe(
      retryWhen(errors =>
        errors.pipe(
          // log error message
          tap(e => console.error(`[useCheckCreateUnitableAvailable] fetch request failed, will retry after 3 seconds, error`, e)),
          // restart in 3 seconds
          delayWhen(() => timer(3 * 1000)),
          take(3) // only retry 3 times
        )
      ),
      first()
    )
    .subscribe(res => {
      unitableAvailable$.next(res);
      hasFetched = true;
      dataStoreApi.put(STORE_KEY, `${res}`);
    });

if (inWindow()) {
  fetchData();
}

// 用途: 检测当前用户是否有权限使用 unitable
export const useCheckCreateUnitableAvailable = () => {
  const [available, setAvailable] = useState(unitableAvailable$.getValue());
  useEffect(() => {
    if (!hasFetched) {
      fetchData();
    }
    const subscription = unitableAvailable$.subscribe(res => {
      if (res !== available) {
        setAvailable(res);
      }
    });
    return () => {
      try {
        subscription.unsubscribe();
      } catch (e) {
        console.error('fix unitable bugs', e);
      }
    };
  }, [available]);
  return [available, hasFetched];
};
