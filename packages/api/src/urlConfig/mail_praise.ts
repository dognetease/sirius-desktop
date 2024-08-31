import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class MailPraiseUrl {
  /**
   * 表扬信相关
   */
  setPendant: string = (host + config('setPendant')) as string;

  cancelPendant: string = (host + config('cancelPendant')) as string;

  getPersonMedalDetail: string = (host + config('getPersonMedalDetail')) as string;

  getMedals: string = (host + config('getMedals')) as string;

  sendPraise: string = (host + config('sendPraise')) as string;
}
export type MailPraiseUrlKeys = keyof MailPraiseUrl;
const urlConfig = new MailPraiseUrl();
const urlsMap = new Map<MailPraiseUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as MailPraiseUrlKeys, urlConfig[item as MailPraiseUrlKeys]);
});
export default urlsMap;
