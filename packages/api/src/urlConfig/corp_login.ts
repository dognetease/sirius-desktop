import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class CorpLoginUrl {
  // #region corp登录相关接口
  corpMailGetVerifyCode: string = host + config('corpMailGetVerifyCode');

  corpMailPwdLogin: string = host + config('corpMailPwdLogin');

  coreMailSendPhoneCode: string = host + config('coreMailSendPhoneCode');

  corpMailPhoneCodeLogin: string = host + config('corpMailPhoneCodeLogin');

  corpMailRenewSid: string = host + config('corpMailRenewSid');
  // #endregion

  // #region corp登录设备相关
  corpGetDeviceList: string = (host + config('corpGetDeviceList')) as string;

  corpDeleteDevice: string = (host + config('corpDeleteDevice')) as string;
  // #endregion
}
export type CorpLoginUrlKeys = keyof CorpLoginUrl;
const urlConfig = new CorpLoginUrl();
const urlsMap = new Map<CorpLoginUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as CorpLoginUrlKeys, urlConfig[item as CorpLoginUrlKeys]);
});
export default urlsMap;
