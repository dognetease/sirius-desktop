import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class AdvertUrl {
  // getAdvertResources: string = ('https://silk-dev.cowork.netease.com' + config('getAdvertResources')) as string;
  getAdvertResources: string = (host + config('getAdvertResources')) as string;
}

export type AdvertUrlKeys = keyof AdvertUrl;
const urlConfig = new AdvertUrl();
const urlsMap = new Map<AdvertUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as AdvertUrlKeys, urlConfig[item as AdvertUrlKeys]);
});
export default urlsMap;
