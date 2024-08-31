import { GlobalSearchApi, api, apis } from 'api';
import moment from 'moment';
import memoize from 'lodash/memoize';
import { useCallback, useEffect, useState } from 'react';

const LINKEDIN_PROXY_TIP = 'LINKEDIN_PROXY_TIP';

const globalSearchApi = api.requireLogicalApi(apis.globalSearchApiImpl) as GlobalSearchApi;
const storeApi = api.getDataStoreApi();

enum ProxyCheckStatus {
  UNKNOW,
  MIAN_LAND,
  PROXYED,
}

const format = 'YYYY-MM-DD';

const close = () => {
  storeApi.putSync(LINKEDIN_PROXY_TIP, moment().format(format));
};

const timeFlag = () => {
  const curTimeFlag = moment().format(format);
  const { data: preStoreTimeFlag } = storeApi.getSync(LINKEDIN_PROXY_TIP);
  return curTimeFlag !== preStoreTimeFlag;
};

const generateApiMemoKey = (time: number) => () => `${Math.round(Date.now() / time)}}`;
const fetchApi = memoize(() => globalSearchApi.checkIpIsMainLand(), generateApiMemoKey(3000));

export const useMainLandIpHook = (enable: boolean = true) => {
  const [ipIsMainLand, setIpIsMainLand] = useState<ProxyCheckStatus>(ProxyCheckStatus.UNKNOW);
  useEffect(() => {
    if (enable && timeFlag()) {
      fetchApi().then(res => {
        setIpIsMainLand(res ? ProxyCheckStatus.MIAN_LAND : ProxyCheckStatus.PROXYED);
      });
    }
  }, [enable]);
  const showTip = useCallback(() => ipIsMainLand && timeFlag(), [ipIsMainLand]);

  return {
    showTip,
    close,
  };
};
