import { useEffect, useState, useCallback, useMemo } from 'react';
import { getIn18Text, api } from 'api';
const sysApi = api.getSystemApi();
import { globalSearchDataTracker } from '@/components/Layout/globalSearch/tracker';
import { useLocation } from '@reach/router';
import qs from 'querystring';
interface useInterCollectProp {
  data: Array<{
    name: string;
    country: string;
    id?: string | number;
    companyId?: string | number;
  }>;
  keywords?: string;
  origin: string;
  pageKeywords: string;
  module: string;
}

const useInterCollectData = (props: useInterCollectProp) => {
  const { data, keywords, origin, pageKeywords, module } = props;
  const locationHash = useLocation().hash;

  const [updata, setUpdata] = useState<number>(0);

  const [page] = useMemo(() => {
    const moduleName = locationHash.substring(1).split('?')[0];
    if (![module, pageKeywords].includes(moduleName)) {
      return [''];
    }
    const params = qs.parse(locationHash.split('?')[1]);
    if (params.page && typeof params.page === 'string') {
      return [params.page];
    }
    return [''];
  }, [locationHash, props]);

  useEffect(() => {
    let timer: any;
    if (data.length > 0 && page === pageKeywords) {
      // 页面未发生跳转，缓存数据未变化的情况下，十分钟上上报一次
      timer = setInterval(() => {
        globalSearchDataTracker.trackCollectData({
          info: data,
          keywords,
          count: data.length,
          origin: origin,
        });
        console.log(
          {
            info: data,
            keywords,
            count: data.length,
          },
          'location-hash-hree'
        );
        setUpdata(new Date().getTime());
      }, 600000);
    }

    return () => {
      if (timer) {
        timer && clearInterval(timer);
      }
    };
  }, [locationHash, data, keywords]);

  return [updata];
};
export default useInterCollectData;
