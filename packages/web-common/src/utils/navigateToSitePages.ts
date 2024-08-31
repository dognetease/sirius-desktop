import { api, apiHolder, apis, SiteApi, SystemApi } from 'api';
import { config } from 'env_def';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const jzHost = config('jzHost') as string;

// 跳转url map
export const SitePagesUrl = {
  productEditPage: '/site/web/productEdit.html',
};

// 跳转建站页面公共方法
export const navigateToSitePages = async (url: string) => {
  const isElectron = systemApi.isElectron();
  const path = url; // `/site/editor/landing?siteId=1&page=1`;
  if (isElectron) {
    try {
      const code = await siteApi.genLoginCode();
      const redirectUrl = jzHost + path;
      systemApi.openNewWindow(`${jzHost}/site/api/pub/login/jump?code=${code}&redirectUrl=${redirectUrl}`, false);
    } catch (e) {
      systemApi.openNewWindow(jzHost + path);
    }
  } else {
    window.open(path, '_blank');
  }
};
