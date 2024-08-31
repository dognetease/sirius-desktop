import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class RegisterUrl {
  /*
   *  注册相关
   * */
  registerValidateCode: string = (host + config('registerValidateCode')) as string;

  registerCheckDomain: string = (host + config('registerCheckDomain')) as string;

  registerSubmit: string = (host + config('registerSubmit')) as string;

  registerDemandList: string = (host + config('registerDemandList')) as string;

  registerAppendDemand: string = (host + config('registerAppendDemand')) as string;

  registerMailDomainInfo: string = (host + config('registerMailDomainInfo')) as string;
}
export type RegisterUrlKeys = keyof RegisterUrl;
const urlConfig = new RegisterUrl();
const urlsMap = new Map<RegisterUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as RegisterUrlKeys, urlConfig[item as RegisterUrlKeys]);
});
export default urlsMap;
