import { useState, useEffect } from 'react';
import { apis, apiHolder, NetStorageApi, DataStoreApi, ResponseGetUserApp } from 'api';
import { BehaviorSubject, from, timer } from 'rxjs';
import { delayWhen, first, retryWhen, take, tap } from 'rxjs/operators';
import { AppIdArray, AppIdTypes } from '../pageMapConf';
import isEqual from 'lodash/isEqual';

const diskApi = apiHolder.api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
const dataStoreApi: DataStoreApi = apiHolder.api.getDataStoreApi() as DataStoreApi;

const STORE_KEY = 'apps_app_info';
const getStoreKey = (appId: AppIdTypes) => `${STORE_KEY}_${appId}`;
const getStoreData = (appId: AppIdTypes) => {
  try {
    const storeData = dataStoreApi.getSync(getStoreKey(appId));
    if (storeData?.data) {
      return JSON.parse(storeData.data);
    }
  } catch (e) {
    return null;
  }
};
const setStoreData = (appId: AppIdTypes, data: ResponseGetUserApp) => {
  dataStoreApi.put(getStoreKey(appId), JSON.stringify(data));
};
type AppInfoState = Record<
  AppIdTypes,
  {
    data: ResponseGetUserApp | null;
    fetched: boolean;
  }
>;
const initState = AppIdArray.reduce((acc, appId) => {
  const storeData = getStoreData(appId);
  acc[appId] = { fetched: false, data: storeData };
  return acc;
}, {} as AppInfoState);
const lastState$ = new BehaviorSubject<AppInfoState>(initState);
const fetchData = (appId: AppIdTypes) => {
  from(diskApi.getUserApp({ appId }))
    .pipe(
      retryWhen(errors =>
        errors.pipe(
          // log error message
          tap(e => console.error(`[useAppInfo] fetch request failed, will retry after 3 seconds, error`, e)),
          // restart in 3 seconds
          delayWhen(() => timer(3 * 1000)),
          take(3) // only retry 3 times
        )
      ),
      first()
    )
    .subscribe(res => {
      lastState$.next({
        ...lastState$.value,
        [appId]: {
          data: res,
          fetched: true,
        },
      });
      setStoreData(appId, res);
    });
};

export const useAppInfo = (appId: AppIdTypes) => {
  const [appInfo, setAppInfo] = useState(lastState$.value[appId]);
  const hasFetched = appInfo.fetched;
  const data = appInfo.data;
  useEffect(() => {
    if (!hasFetched) {
      fetchData(appId);
    }
    const subscription = lastState$.subscribe(newState => {
      const newAppInfo = newState[appId];
      if (!isEqual(appInfo, newAppInfo)) {
        setAppInfo(newAppInfo);
      }
    });
    return subscription.unsubscribe;
  }, [appId, hasFetched, appInfo]);
  return data;
};
