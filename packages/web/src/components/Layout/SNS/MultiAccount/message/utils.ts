import { apiHolder } from 'api';
import { config } from 'env_def';

const systemApi = apiHolder.api.getSystemApi();
const lang = systemApi.getSystemLang();
const stage = config('stage') as string;
const profile = config('profile') as string;

export const makeStageUrl = (): string => {
  const version = config('version');
  const urls: Record<string, string> = {
    test: `https://sirius-it-wa-multisend-web.cowork.netease.com?v=${version}`,
    prod: `https://wa-multisend.office.163.com/?v=${version}`,
    prev: `https://wa-multisend-pre.office.163.com/?v=${version}`,
  };
  let url = urls[stage] || urls.prod;
  if (profile === 'edm_test_prod') {
    url = urls.prev;
  }
  return url + `&lang=${lang}`;
};
