import { api, AdvertConfig, apis, AdvertApi } from 'api';
import { useEffect, useState } from 'react';

const advertApi = api.requireLogicalApi(apis.advertApiImpl) as AdvertApi;

// 全局活动广告banner spaceCode
// export const GlobalAdvertSpaceCode = '149'  // 测试环境
export const GlobalAdvertSpaceCode = '2017'; // 线上环境

export function useGlobalAdvertList(spaceCode: string) {
  const [adList, setAdList] = useState<AdvertConfig[]>([]);

  const fetchAdList = async () => {
    try {
      const response = await advertApi.fetchConfig(spaceCode);
      if (response.data) {
        setAdList((response.data as any)?.itemList ?? []);
      } else {
        setAdList([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAdList();
  }, []);

  return {
    adList,
  };
}
