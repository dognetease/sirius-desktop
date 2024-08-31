import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class MailSignUrl {
  /**
   *    邮件签名相关
   */
  getSignList: string = (host + config('getSignList')) as string;

  getSignTemplate: string = (host + config('getSignTemplate')) as string;

  getSignTemplateAndProfile: string = (host + config('getSignTemplateAndProfile')) as string;

  getSignDetail: string = (host + config('getSignDetail')) as string;

  getSignPreview: string = (host + config('getSignPreview')) as string;

  addSign: string = (host + config('addSign')) as string;

  addCustomizeSign: string = (host + config('addCustomizeSign')) as string;

  setDefaultSign: string = (host + config('setDefaultSign')) as string;

  delSign: string = (host + config('delSign')) as string;

  updateSign: string = (host + config('updateSign')) as string;

  updateCustomizeSign: string = (host + config('updateCustomizeSign')) as string;

  uploadSignAvatar: string = (host + config('uploadSignAvatar')) as string;
}
export type MailSignUrlKeys = keyof MailSignUrl;
const urlConfig = new MailSignUrl();
const urlsMap = new Map<MailSignUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as MailSignUrlKeys, urlConfig[item as MailSignUrlKeys]);
});
export default urlsMap;
