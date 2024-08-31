import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class CorpContactUrl {
  // #region corp通讯录相关
  corpSearchContact: string = (host + config('corpSearchContact')) as string;

  corpGetContactsByYunXinIds: string = (host + config('corpGetContactsByYunXinIds')) as string;

  corpGetContactsByEmails: string = (host + config('corpGetContactsByEmails')) as string;
  // #endregion
}
export type CorpContactUrlKeys = keyof CorpContactUrl;
const urlConfig = new CorpContactUrl();
const urlsMap = new Map<CorpContactUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as CorpContactUrlKeys, urlConfig[item as CorpContactUrlKeys]);
});
export default urlsMap;
