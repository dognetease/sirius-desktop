import { config } from 'env_def';
import { WebMailHostPlaceHolder } from '@/const';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class LoginUrl {
  /**
   * 登录相关
   */

  mobileVerifyCode: string = (host + config('mobileVerifyCode')) as string;

  mobileLoginActive: string = (host + config('mobileLoginActive')) as string;

  refreshToken: string = (host + config('refreshToken')) as string;

  refreshTokenLogin: string = (host + config('refreshTokenLogin')) as string;

  getMobileLoginToken: string = (host + config('getMobileLoginToken')) as string;

  mobileTokenLogin: string = (host + config('mobileTokenLogin')) as string;

  preLoginCheck: string = (host + config('preLoginCheck')) as string;

  newPreLoginCheck: string = (host + config('newPreLoginCheck')) as string;

  qrcodeCheck: string = (host + config('qrcodeCheck')) as string;

  qrCodeCreate: string = (host + config('qrCodeCreate')) as string;

  preLogin: string = (host + config('preLogin')) as string;

  corpPreLogin: string = (host + config('corpPreLogin')) as string;

  mobileLogin: string = (host + config('mobileLogin')) as string;

  emailLogin: string = (host + config('emailLogin')) as string;

  sendCode: string = (host + config('sendCode')) as string;

  emailSendCode: string = (host + config('emailSendCode')) as string;

  edmLoginReport: string = (host + config('edmLoginReport')) as string;

  login: string = (host + config('login')) as string;

  logout: string = host + config('logout'); // from=mailhz.qiye.163.com&uid=shisheng@qy.163.com&domain=qiye.163.com"

  loginDoor: string = (host + config('loginDoor')) as string;

  clientEnableIM: string = host + config('clientEnableIM');

  clientInfo: string = host + config('clientInfo');

  clientTagInfo: string = host + config('clientTagInfo');

  getPwdRule: string = host + config('getPwdRule');

  getPwdRuleAfterLogin: string = WebMailHostPlaceHolder + config('getPwdRuleAfterLogin');

  updatePwd: string = host + config('updatePwd');

  updatePwdAfterLogin: string = WebMailHostPlaceHolder + config('updatePwdAfterLogin');

  notifyLoginSuc: string = host + config('notifyLoginSuc');

  // 获取账号版本全部功能权限
  getPrivilegeAll: string = (host + config('getPrivilegeAll')) as string;

  // 获取账号版本功能权限（单功能维度）
  getPrivilege: string = (host + config('getPrivilege')) as string;

  // 获取版本过能耐信息
  getProductTags: string = (host + config('getProductTags')) as string;

  // 登录代理账号
  loginAgentEmail: string = (host + config('loginAgentEmail')) as string;

  getMailClientConfig: string = ((process.env.BUILD_ISWEB ? host : (config('webMailHZHost') as string)) + config('getMailClientConfig')) as string;

  // -----webmail活动相关-----
  // 获取活动详情
  getActivityInfo: string = (host + config('getActivityInfo')) as string;

  // 报名参加活动
  joinActivity: string = (host + config('joinActivity')) as string;

  // 触发活动
  invokeActivity: string = (host + config('invokeActivity')) as string;
  // -------------

  switchSharedAccount: string = (host + config('switchSharedAccount')) as string;

  loginGetAccount: string = (host + config('loginGetAccount')) as string;

  getLoginCode: string = (host + config('getLoginCode')) as string;

  // loginJump: string = (host + config('loginJump')) as string;

  getEntranceVisibleConfig: string = (host + config('getEntranceVisibleConfig')) as string;

  setEntrancePopupVisible: string = (host + config('setEntrancePopupVisible')) as string;

  selfUnBlocking: string = (host + config('selfUnBlocking')) as string;
  applyUnBlocking: string = (host + config('applyUnBlocking')) as string;
}
export type LoginUrlKeys = keyof LoginUrl;
const urlConfig = new LoginUrl();
const urlsMap = new Map<LoginUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as LoginUrlKeys, urlConfig[item as LoginUrlKeys]);
});
export default urlsMap;
