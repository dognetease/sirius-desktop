import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class AccountUrl {
  /*
   * 账号管理相关
   * */

  getBindInfo: string = (host + config('getBindInfo')) as string;

  getBindAndForwardInfo: string = (host + config('getBindAndForwardInfo')) as string;

  sendVerificationCode: string = (host + config('sendVerificationCode')) as string;

  checkVerificationCode: string = (host + config('checkVerificationCode')) as string;

  getIsAdmin: string = (host + config('getIsAdmin')) as string;

  getIsNewAccount: string = (host + config('getIsNewAccount')) as string;

  getBindAccountList: string = (host + config('getBindAccountList')) as string;

  getBJBindAccountList: string = (host + config('getBJBindAccountList')) as string;

  getVerifyCode: string = (host + config('getVerifyCode')) as string;

  getCancelVerifyCode: string = (host + config('getCancelVerifyCode')) as string;

  bindMobile: string = (host + config('bindMobile')) as string;

  updateBindMobile: string = (host + config('updateBindMobile')) as string;

  unbindMobile: string = (host + config('unbindMobile')) as string;

  addQiyeMailSubAccount: string = (host + config('addQiyeMailSubAccount')) as string;

  createPersonalSubAccount: string = (host + config('createPersonalSubAccount')) as string;

  getBindPersonalSubAccounts: string = (host + config('getBindPersonalSubAccounts')) as string;

  getQiyeMailBindSubAccounts: string = (host + config('getQiyeMailBindSubAccounts')) as string;

  deletePersonalSubAccount: string = (host + config('deletePersonalSubAccount')) as string;

  deleteQiyeMailSubAccount: string = (host + config('deleteQiyeMailSubAccount')) as string;

  editPersonalSubAccount: string = (host + config('editPersonalSubAccount')) as string;

  getSharedAccounts: string = (host + config('getSharedAccounts')) as string;

  getUserConfig: string = (host + config('getUserConfig')) as string;

  setUserConfig: string = (host + config('setUserConfig')) as string;

  sendCosUpgrade: string = (host + config('sendCosUpgrade')) as string;

  accountGetToken: string = (host + config('accountGetToken')) as string;

  getAccountRight: string = (host + config('getAccountRight')) as string;
}
export type AccountUrlKeys = keyof AccountUrl;
const urlConfig = new AccountUrl();
const urlsMap = new Map<AccountUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as AccountUrlKeys, urlConfig[item as AccountUrlKeys]);
});
export default urlsMap;
