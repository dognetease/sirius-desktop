import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

export class MailProductUrl {
  getWaimaoProductList: string = (host + config('getWaimaoProductList')) as string;

  getWaimaoProductTable: string = (host + config('getWaimaoProductTable')) as string;

  genProductLinks: string = (host + config('genProductLinks')) as string;
}
export type MailProductUrlKeys = keyof MailProductUrl;
const urlConfig = new MailProductUrl();
const urlsMap = new Map<MailProductUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as MailProductUrlKeys, urlConfig[item as MailProductUrlKeys]);
});
export default urlsMap;
