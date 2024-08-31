import { api, apiHolder, apis, SiteApi, SystemApi } from 'api';
import { config } from 'env_def';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const jzHost = config('jzHost') as string;

// 跳转营销落地页编辑器
export const navigateToEditor = async (siteId: string, pageId: string) => {
  const isElectron = systemApi.isElectron();
  const path = `/site/editor/#/landing?siteId=${siteId}&page=${pageId}`;
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
