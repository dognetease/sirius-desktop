import { api, apis, GlobalSearchApi, IGlobalSearchStat } from 'api';
import moment from 'moment';
import { useCallback, useEffect, useState } from 'react';

const sysApi = api.getSystemApi();

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;

const getDateString = () => {
  return moment().format('YYYY年MM月DD日');
};

export function useGlobalSearchStat(visible: boolean = false) {
  const [stat, setStat] = useState<IGlobalSearchStat & { date: string }>({
    companyNums: 0,
    rollInfos: [],
    date: getDateString(),
  });
  const updateFunc = useCallback(() => {
    globalSearchApi.doGetStat().then(res => {
      setStat({
        ...res,
        date: getDateString(),
      });
    });
  }, []);
  useEffect(() => {
    if (visible) {
      updateFunc();
    }
  }, [visible, updateFunc]);
  useEffect(() => {
    const id = sysApi.intervalEvent({
      eventPeriod: 'long',
      handler: () => {
        updateFunc();
      },
      seq: 0,
    });

    return () => {
      id && sysApi.cancelEvent('long', id);
    };
  }, [updateFunc]);

  return stat;
}
