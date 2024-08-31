import { api, AdvertConfig, apis, AdvertApi } from 'api';
import { useEffect, useState } from 'react';
import { config } from 'env_def';
import { useLocation } from '@reach/router';
import { TopMenuPath } from '@web-common/conf/waimao/constant';

const advertApi = api.requireLogicalApi(apis.advertApiImpl) as AdvertApi;

// 顶部广告banner spaceCode
// export const WorktableAdBannerCode = '147'; // 测试环境
// export const WorktableAdBannerCode = '2015'; // 线上环境
export const WorktableAdBannerCode = config('stage') === 'prod' ? '2015' : '147';

// 热门课程spaceCode
// export const WorktablePopularCourseBannerCode = '148'  // 测试环境
// export const WorktablePopularCourseBannerCode = '2016'  // 线上环境
export const WorktablePopularCourseBannerCode = config('stage') === 'prod' ? '2016' : '148';

export function useAdvertListData(spaceCode: string) {
  const [adList, setAdList] = useState<AdvertConfig[]>([]);
  const location = useLocation();

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
    const moduleName = location.hash.substring(1).split('?')[0];
    if (moduleName === TopMenuPath.worktable) {
      fetchAdList();
    }
  }, [location]);

  return {
    adList,
  };
}
