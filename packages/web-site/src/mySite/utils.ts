import { navigate } from '@reach/router';
import { config as envDefConfig } from 'env_def';
import { api, apiHolder, apis, SiteApi, SystemApi } from 'api';

const systemApi = apiHolder.api.getSystemApi() as SystemApi;
const siteApi = api.requireLogicalApi(apis.siteApiImpl) as SiteApi;
const jzHost = envDefConfig('jzHost') as string;

// 跳转我的站点页面
export const goMySitePage = () => {
  navigate('#site?page=mySite');
};

// 跳转订单管理
export const goOrderManage = () => {
  navigate('#site?page=orderManage');
};

/**
 * 验证用域名是否合法
 * @param url
 */
export const isValidDomain = (url: string) => {
  const reg = /^(?=^.{3,255}$)[a-z0-9][-a-z0-9]{0,62}(\.[a-z0-9][-a-z0-9]{0,62})+$/;
  return reg.test(url);
};

/**
 * 支付中转页url
 * @param id 订单id
 * @returns
 */
export const getPayUrl = async (id: string, platform: number) => {
  const isElectron = systemApi.isElectron();
  const path =
    envDefConfig('stage') === 'prod'
      ? `https://sirius-it-site.lx.netease.com/pay?orderId=${id}&platform=${platform}`
      : `https://sirius-it-site.cowork.netease.com/pay?orderId=${id}&platform=${platform}`;
  if (isElectron) {
    try {
      const code = await siteApi.genLoginCode();
      systemApi.openNewWindow(`${jzHost}/site/api/pub/login/jump?code=${code}&redirectUrl=${encodeURIComponent(path)}`, false);
    } catch (e) {
      systemApi.openNewWindow(path);
    }
  } else {
    window.open(path, '_blank');
  }
};
