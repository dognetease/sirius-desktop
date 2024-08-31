import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class MailSmartUrl {
  // 优先级
  getSmartGetPriorities: string = (host + config('getSmartGetPriorities')) as string;

  getSmartGetPriority: string = (host + config('getSmartGetPriority')) as string;

  setSmartPriorities: string = (host + config('setSmartPriorities')) as string;
}
export type MailSmartUrlKeys = keyof MailSmartUrl;
const urlConfig = new MailSmartUrl();
const urlsMap = new Map<MailSmartUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as MailSmartUrlKeys, urlConfig[item as MailSmartUrlKeys]);
});
export default urlsMap;
