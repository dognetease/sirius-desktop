import { apiHolder } from 'api';
import { config } from 'env_def';

const systemApi = apiHolder.api.getSystemApi();
const lang = systemApi.getSystemLang();
const stage = config('stage') as string;
const profile = config('profile') as string;
// 参数异步，获取不到
function handlerPrams(restParams?: Record<string, string>) {
  let params: string = '';
  if (!restParams) return params;
  const rest = Object.entries(restParams) || { transportId: '1212' };
  if (rest.length) {
    rest.forEach(item => {
      params += item[0] + '=' + item[1] + '&';
    });
    params = params.slice(0, -1);
  }
  return params;
}

export const makeStageUrl = (routes: string[] = [], needLang: boolean = true, restParams?: Record<string, string>): string => {
  const version = config('version');
  const urlPath = routes.join('/');
  const urls: Record<string, string> = {
    test: `https://wa.cowork.netease.com/${urlPath}?v=${version}`,
    prod: `https://wa.office.163.com/${urlPath}?v=${version}`,
    prev: `https://wa-pre.office.163.com/${urlPath}?v=${version}`,
  };
  let url = urls[stage] || urls.prod;
  if (profile === 'edm_test_prod') {
    url = urls.prev;
  }
  return url + (needLang ? `&lang=${lang}` : '') + '&' + handlerPrams(restParams);
};
