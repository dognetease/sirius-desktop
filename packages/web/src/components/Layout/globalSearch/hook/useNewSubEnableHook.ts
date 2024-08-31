import { GlobalSearchApi, api, apis } from 'api';
import { useContext, useEffect, useState } from 'react';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

export const useNewSubEnable = (getList: boolean = false) => {
  const [subState, setSubState] = useState<[boolean, boolean | undefined]>([false, undefined]);
  useEffect(() => {
    if (getList) {
      Promise.all([
        globalSearchApi.doGetNewSubAuth(),
        globalSearchApi.doGetSubList({
          page: 0,
          size: 1,
        }),
      ]).then(([newSubAuth, subList]) => {
        setSubState([newSubAuth, subList.length > 0]);
      });
    } else {
      globalSearchApi.doGetNewSubAuth().then(newSubAuth => {
        setSubState([newSubAuth, undefined]);
      });
    }
  }, [getList]);
  // [是否有权限（灰度），是否已有订阅列表]
  return subState;
};
