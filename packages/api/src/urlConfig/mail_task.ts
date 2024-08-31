import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class MailTaskUrl {
  /**
   * 任务邮件
   */
  getTaskMailList: string = (host + config('getTaskMailList')) as string;

  getTaskMailContent: string = (host + config('getTaskMailContent')) as string;

  operateTask: string = (host + config('operateTask')) as string;

  urgeTask: string = (host + config('urgeTask')) as string;

  createTask: string = (host + config('createTask')) as string;
}
export type MailTaskUrlKeys = keyof MailTaskUrl;
const urlConfig = new MailTaskUrl();
const urlsMap = new Map<MailTaskUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as MailTaskUrlKeys, urlConfig[item as MailTaskUrlKeys]);
});
export default urlsMap;
