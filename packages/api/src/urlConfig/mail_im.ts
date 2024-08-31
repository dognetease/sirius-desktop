import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class MailIMUrl {
  /**
   * 邮件讨论组相关接口
   */

  createDiscuss: string = host + config('createDiscuss');

  getDiscussMail: string = host + config('getDiscussMail');

  getDiscussMailDetail: string = host + config('getDiscussMailDetail');

  getMailDiscuss: string = host + config('getMailDiscuss');

  cancelDiscussBind: string = host + config('cancelDiscussBind');

  discussMailAttach: string = host + config('discussMailAttach');

  shareMail: string = host + config('shareMail');
}
export type MailIMUrlKeys = keyof MailIMUrl;
const urlConfig = new MailIMUrl();
const urlsMap = new Map<MailIMUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as MailIMUrlKeys, urlConfig[item as MailIMUrlKeys]);
});
export default urlsMap;
