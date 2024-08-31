import { config, Lib } from 'env_def';
// import { res } from 'support/dist/def';
import { StringMap, StringTypedMap } from '@/api/commonModel';
import { LoginApi, LoginJumpConfig } from '@/api/logical/login';
import { NIMInterface } from '@/api/logical/im';
import { Kf } from '@/api/logical/kf';
import { ApiPolicy, ApiResposity } from '@/api/api';
import { DATracker } from '@/api/data/dataTracker';
import { lf } from './api/data/lovefield';
import { GetLocalLabel, Lang } from './utils/global_label';
import { URLMap, urlMap } from './urlConfig/index';
import { CommonMailHostPlaceHolder, WebMailHostPlaceHolder } from '@/const';
import { host } from './urlConfig/url_common';
import { locationHelper } from '@/api/util/location_helper';
import { inWindowTool } from './utils/inWindow';
import { getOs as _getOs } from './utils/confOs';
import { MasterBridge } from './bridge/interface/proxy';
import { WorkerBridge } from './bridge/interface/register';
import { ApiManager } from './api_manager';
// import type { ApiManager } from './api_manager';

if (inWindowTool()) {
  if (!window.apiUtils) {
    // @ts-ignore
    window.apiUtils = {};
  }
  window.apiUtils.inWindow = inWindowTool;
}

// export const getShouldInitMemoryDBInMainPage = () => { if (locationHelper.isMainPage()) { return true; } return false; }
export const getShouldInitMemoryDBInMainPage = () => process.env.BUILD_ISWEB && (locationHelper.isMainPage() || locationHelper.isJumpPage());
export const getIsMainPage = () => locationHelper.isMainPage();
// import { conf, lf } from '.';
export const urlStore = urlMap;
export type URLKey = URLMap;

// const host = (config('host') || '') as string;
const forElectron = config('build_for') === 'electron';
export const customerSysConfig: StringMap = {};
/**
 * 所有实现的name定义
 */
export const apis = {
  defaultApiImpl: config('dataHttpApi') as string,
  defaultDataStoreApiImpl: config('defaultDataStoreApiImpl') as string,
  defaultSystemApiImpl: config('defaultSystemApiImpl') as string,
  defaultEventApi: config('defaultEventApi') as string,
  defaultFileApi: config('defaultFileApi') as string,
  loginApiImpl: config('loginApiImpl') as string,
  contactApiImpl: config('contactApiImpl') as string,
  // contactRealApiImpl: config('contactRealApiImpl') as string,
  contactDbImpl: config('contactDbImpl') as string,
  mailApiImpl: config('mailApiImpl') as string,
  mailSignatureImplApi: config('mailSignatureImplApi') as string,
  mailTemplateImplApi: config('mailTemplateImplApi') as string,
  mailProductImplApi: config('mailProductImplApi') as string,
  newDbApiImpl: config('newDbApiImpl') as string,
  catalogApiImpl: config('catalogApiImpl') as string,
  icsApiImpl: config('icsApiImpl') as string,
  imTeamApiImpl: config('imTeamApiImpl') as string,
  imDiscussApiImpl: config('imDiscussApiImpl') as string,
  imApiImpl: config('imApiImpl') as string,
  pushApiImpl: config('pushApiImpl') as string,
  upgradeAppApiImpl: config('upgradeAppApiImpl') as string,
  mailConfApiImpl: config('mailConfApiImpl') as string,
  mailBlacklistApiImpl: config('mailBlacklistApiImpl') as string,
  netStorageImpl: config('netStorageImpl') as string,
  netStorageShareImpl: config('netStorageShareImpl') as string,
  errorReportImpl: config('errorReportImpl') as string,
  performanceImpl: config('performanceImpl') as string,
  dataTrackerApiImp: config('dataTrackerApiImp') as string,
  dexieDbApi: config('dexieDbApi') as string,
  dbCacheApiImpl: config('dbCacheApiImpl') as string,
  dbInterfaceApiImpl: config('dbInterfaceApiImpl') as string,
  dbMemoryApiImpl: config('dbMemoryApiImpl') as string,
  configSettingApiImpl: config('configSettingApiImpl') as string,
  htmlApi: config('htmlApi') as string,
  loggerApiImpl: config('loggerApiImpl') as string,
  taskApiImpl: config('taskApiImpl') as string,
  keyboardApiImpl: config('keyboardApiImpl') as string,
  kfApiImpl: config('kfApiImpl') as string,
  convertApiImpl: config('convertApiImpl') as string,
  registerApiImpl: config('registerApiImpl') as string,
  accountApiImpl: config('accountApiImpl') as string,
  taskCenterApiImpl: config('taskCenterApiImpl') as string,
  productAuthApiImpl: config('productAuthApiImpl') as string,
  mailPraiseApiImpl: config('mailPraiseApiImpl') as string,
  mailDraftApiImpl: config('mailDraftApiImpl') as string,
  mailStrangerApiImpl: config('mailStrangerApiImpl') as string,
  autoReplyApiImpl: config('autoReplyApiImpl') as string,
  feedbackApiImpl: config('feedbackApiImpl') as string,
  edmSendBoxApiImpl: config('edmSendBoxApiImpl') as string,
  customerApiImpl: config('customerApiImpl') as string,
  edmRoleApiImpl: config('edmRoleApiImpl') as string,
  edmCustomsApiImpl: config('edmCustomsApiImpl') as string,
  fieldSettingApiImpl: config('fieldSettingApiImpl') as string,
  saleStageApiImpl: config('saleStageApiImpl') as string,
  globalSearchApiImpl: config('globalSearchApiImpl') as string,
  whatsAppApiImpl: config('whatsAppApiImpl') as string,
  insertWhatsAppApiImpl: config('insertWhatsAppApiImpl') as string,
  facebookApiImpl: config('facebookApiImpl') as string,
  snsMarketingApiImpl: config('snsMarketingApiImpl') as string,
  materielApiImpl: config('materielApiImpl') as string,
  customerDiscoveryApi: config('customerDiscoveryApi') as string,
  edmNotifyApiImpl: config('edmNotifyApiImpl') as string,
  autoMarketApiImpl: config('autoMarketApiImpl') as string,
  addressBookApiImpl: config('addressBookApiImpl') as string,
  addressBookNewApiImpl: config('addressBookNewApiImpl') as string,
  salesPitchApiImpl: config('salesPitchApiImpl') as string,
  mailPlusCustomerApiImpl: config('mailPlusCustomerApiImpl') as string,

  taskMailImplApi: config('taskMailImplApi') as string,
  webmailApiImpl: config('webmailApiImpl') as string,
  edmProductDataImpl: config('edmProductDataImpl') as string,
  advertApiImpl: config('advertApiImpl') as string,
  siteApiImpl: config('siteApiImpl') as string,

  aiHostingApiImpl: config('aiHostingApiImpl') as string,

  edmMenusApiImpl: config('edmMenusApiImpl') as string,

  ffmsApi: config('ffmsApi') as string,

  autoTestApi: config('autoTestApi') as string,

  globalGuideApiImpl: config('globalGuideApiImpl') as string,
  AddressBookNewApi: 'addressBookNewApiImpl',

  remindersImpl: config('remindersImpl') as string,

  emptyApiImpl: 'emptyApi',
  /**
   defaultApiImpl: "dataHttpApi",
   defaultDataStoreApiImpl: "dataStoreApi",
   defaultSystemApiImpl: "systemApi",
   defaultEventApi: "eventApi",
   loginApiImpl: "loginApi",
   contactApiImpl: "contactApi",
   contactDbImpl: "contact_db_impl",
   */
};
/**
 * 根据多组条件判断是否在electron客户端内部运行
 */
export const isElectron = () => typeof window !== 'undefined' && typeof navigator === 'object' && navigator.userAgent.toLowerCase().indexOf('sirius-desktop') >= 0;

export const getOs = _getOs;

// eslint-disable-next-line no-nested-ternary
export const globalAdSpaceCode = '188';
// eslint-disable-next-line no-nested-ternary
export const bannerSpaceCode = '166';
// eslint-disable-next-line no-nested-ternary
export const selectedAppsSpaceCode = '177';
// 企业周报
export const edmWeeklyReportSpaceCode = '1222';

// 测试环境广告位
// eslint-disable-next-line camelcase
export const surveySpaceCode_dev = '13579';
// 桌面端 广告位
// eslint-disable-next-line camelcase
export const surveySpaceCode_electron = '20230222';
// 新版灵犀web（从webmail切换来的）广告位
// eslint-disable-next-line camelcase
export const surveySpaceCode_web_new = '2023021302';
// 旧版灵犀web（lingxi域名）广告位
// eslint-disable-next-line camelcase
export const surveySpaceCode_web_old = '20230221';

// urls = {
//     preLogin: host + "/__prefix__domain/preLogin",
//     login: host + "/__prefix__domain/domainEntLogin",
//     sendCode: host + "/__prefix__domain/action/mobileSendCode",
//     mobileLogin: host + "/__prefix__domain/mobileLogin",
//     urlPrefixReplace: {
//         "hz": "",
//         "bj": "bj"
//     }
// };
export const urlPrefixReplace: StringMap = {
  hz: config('node_hz') as string,
  bj: config('node_bj') as string,
};

export const webMailURLPrefixReplace: StringMap = {
  hz: config('webMailHZHost') as string,
  bj: config('webMailBJHost') as string,
};

export const deployContextPath = config('contextPath') as string;
export const deployApiContextPath = config('apiContextPath') as string;
/**
 * url转换函数 , url 路径转换核心，针对 electron和web走两套不同逻辑
 * @param url 待转换的url
 * @param currentNode 当前的节点
 */
export const getUrl = (url: URLKey, currentNode: string) => {
  let ret: string = urlStore.get(url) as string;
  if (!ret) {
    throw new Error('url config illegal:' + url);
  }
  // 邮件附件相关，在最终request阶段替换
  // __wmail_prefix__ 或  __wmail_prefix__/__prefix__
  if (ret.startsWith(WebMailHostPlaceHolder)) {
    // electron环境
    if (
      forElectron &&
      isElectron() &&
      window.electronLib && // 在electron环境，
      !window.apiResposity.getSystemApi().getProxyOn() // 并未设置禁止转发其他域名，
    ) {
      const urlPrefixReplaceElement = webMailURLPrefixReplace[currentNode] || ''; // 使用存储的节点信息获取到目标host
      return ret
        .replace(WebMailHostPlaceHolder, urlPrefixReplaceElement) // 直接替换为目标host
        .replace(CommonMailHostPlaceHolder, ''); // 预留的节点前缀替换为空字符，返回结果
    }

    ret = ret.replace(WebMailHostPlaceHolder, host); // web中，依然使用原始域名
  }
  // __prefix__
  const urlPrefixReplaceElement = urlPrefixReplace[currentNode];
  const urlPrefix = forElectron && isElectron() ? '' : deployApiContextPath; // electron目前不需要添加contextPath , 转发走根路径， web需要所有请求添加contextPath ,便于部署到目标服务器后，可以通过前缀进行转发
  // 替换为 bj 或 ''
  const result = urlPrefix + ret.replace(CommonMailHostPlaceHolder, urlPrefixReplaceElement);
  return result;
};

export const getUrlPre = (url: URLKey, currentNode: string) => {
  let ret: string = urlStore.get(url) as string;
  if (!ret) {
    throw new Error('url config illegal:' + url);
  }
  // 邮件附件相关，在最终request阶段替换
  // __wmail_prefix__ 或  __wmail_prefix__/__prefix__
  if (ret.startsWith(WebMailHostPlaceHolder)) {
    // electron环境
    if (
      forElectron &&
      isElectron() &&
      window.electronLib && // 在electron环境，
      !window.apiResposity.getSystemApi().getProxyOn() // 并未设置禁止转发其他域名，
    ) {
      return ret;
    }
    ret = ret.replace(WebMailHostPlaceHolder, host); // web中，依然使用原始域名
  }
  // __prefix__
  const urlPrefixReplaceElement = urlPrefixReplace[currentNode];
  const urlPrefix = forElectron && isElectron() ? '' : deployApiContextPath; // electron目前不需要添加contextPath , 转发走根路径， web需要所有请求添加contextPath ,便于部署到目标服务器后，可以通过前缀进行转发
  // 替换为 bj 或 ''
  const result = urlPrefix + ret.replace(CommonMailHostPlaceHolder, urlPrefixReplaceElement);
  return result;
};

export const getUrlFinal = (ret: string, currentNode: string) => {
  const urlPrefixReplaceElement = webMailURLPrefixReplace[currentNode] || ''; // 使用存储的节点信息获取到目标host
  return ret
    .replace(WebMailHostPlaceHolder, urlPrefixReplaceElement) // 直接替换为目标host
    .replace(CommonMailHostPlaceHolder, ''); // 预留的节点前缀替换为空字符，返回结果
};

/**
 * 外部跳转功能页面地址
 */
export const externalJumpUrls: StringMap = {
  bindNewPwd: config('bindNewPwd') as string, // "https://mailhz.qiye.163.com/mailapp/qiyeurs/#/info",
  forgetPwd: config('forgetPwd') as string, // "https://mail.qiye.163.com/mailapp/qiyeurs/?from=http%3A%2F%2Fmail.qiye.163.com%2F#/resetPwd",
  prompt: config('prompt') as string, // "https://qiye.163.com/"
};

/**
 * 联系人db配置
 */
export const contactDbInfo = {
  getTableName(usrSign?: string) {
    return 'contactDb_' + (usrSign || 'all');
  },
  version: 1,
};
/**
 *  程序在window中运行，
 *  由于systemApi等api函数也需要使用此判定，估无法使用systemApi支持
 */
export const inWindow = inWindowTool;
/**
 * detect mobile browser
 * http://detectmobilebrowsers.com/
 */
export const isInMobile = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const ua = window.navigator.userAgent || window.navigator.vendor;
  if (
    // eslint-disable-next-line max-len
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
      ua
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
      ua.substr(0, 4)
    )
  ) {
    return true;
  }
  return false;
};
const contextPath = config('contextPath') as string;
const profile = config('profile') as string;
export const loginPage: string = config('loginPage') as string;
export const mloginPage: string = config('mloginPage') as string;
export const loginPageExt: string = (contextPath + config('loginPageExt')) as string;
export const loginFlag = {
  canJump: true,
  needJump: false,
};
const logout = async () => {
  if (window.apiResposity.getSystemApi().getCurrentUser()) {
    const loginApi = window.apiResposity.requireLogicalApi(apis.loginApiImpl) as LoginApi;
    await loginApi.doLogout(true, true);
  }
};

function buildLogoutPageUrl() {
  const isWebmail = profile && profile.startsWith('webmail');
  if (isWebmail) {
    return window.apiResposity.getDataTransApi().getLogoutPage();
  }
  return isInMobile() ? mloginPage : loginPage;
}

export const jumpLogin = (jumpConfig?: LoginJumpConfig, callback?: () => void) => {
  if (window.location.href.indexOf('init=true') > 0 && locationHelper.isMainPage()) {
    // loginFlag.needJump = true;
    return;
  }
  const page = buildLogoutPageUrl();
  if (['/share/', '/doc/', '/sheet/', 'unitable'].some(path => location.href.indexOf(path) >= 0)) {
    logout()
      .then(() => {
        window.location.assign(page + '#' + encodeURIComponent(window.location.pathname + window.location.hash));
      })
      .catch(() => {
        window.location.assign(page + '#' + encodeURIComponent(window.location.pathname + window.location.hash));
      });
  } else if (jumpConfig?.jumpTo === 'setting' && isElectron() && window.electronLib) {
    // const url = loginPageExt + '?blocking';
    window.apiResposity
      .getEventApi()
      .sendSysEvent({
        eventName: 'routeChange',
        eventData: {
          url: loginPageExt,
          state: { blocking: true, ...(jumpConfig || {}), currentTab: 'account' },
          replace: true,
        },
        eventStrData: 'gatsbyStateNav',
        asInnerMsg: true,
      })
      ?.then(() => {
        if (callback) {
          callback();
        }
      });
  } else {
    logout()
      .then(() => {
        if (process.env.BUILD_ISEDM) {
          window.location.assign(page + `?redirect_url=${encodeURIComponent(window.location.href)}`);
          return;
        }
        window.location.assign(page);
      })
      .catch(() => {
        window.location.assign(page);
      });
  }
};
/**
 * 全局标识位的key定义
 * 全局定义需要使用的storage-key , 方便多处复用
 */
export type ConfigKeys = {
  type: 'localStorageKey' | 'localStorageGlobalKey' | 'memoryKey' | 'settingTableKey';
  keyStr: string;
  valueType?: 'bool' | 'number' | 'string' | 'url';
};
/**
 * 全局标识位存储
 * 全局定义需要使用的storage-key , 方便多处复用
 */
export const configKeyStore: {
  [k: string]: ConfigKeys;
} = {
  scheduleTabOpenInWindow: {
    type: 'localStorageKey',
    keyStr: 'scheduleTabOpenInWindow',
    valueType: 'bool',
  },
};

// export const rsaEncrypt = (m: string, e: string, rand: string, con: string) => {
//   // eslint-disable-next-line @typescript-eslint/ban-types
//   const rsaFunc = config('', 'encryptRSA') as Function;
//   const func = rsaFunc();
//   return func(m, e, rand, con);
// };

export const getPageName = () => {
  if (!inWindow()) {
    return '';
  }
  const currPagePath = location.pathname;
  let currPageName;
  if (currPagePath) {
    currPageName = currPagePath.replace(/\//g, '').replace('.html', '').toLowerCase();
  }
  return currPageName || 'index';
};

if (inWindow()) {
  window.apiUtils.getPageName = getPageName;
}

export const environment = config('stage');

const noLoginPath: string[] = [];
noLoginPath.push('/about');
noLoginPath.push('/login');
noLoginPath.push('/mlogin');
noLoginPath.push('/share_anonymous');
noLoginPath.push('/password_reset');
noLoginPath.push('/compDoc');
noLoginPath.push('/launch');
noLoginPath.push('/kf');
noLoginPath.push('/api.html');
noLoginPath.push('/account-bg.html');
// const imApi=apiHolder.api.requireLogicalApi(apis.imApiImpl);

if (!String.prototype.replaceAll) {
  // eslint-disable-next-line no-extend-native
  String.prototype.replaceAll = function (str: string | RegExp, newStr: string | ((substring: string, ...args: any[]) => string)) {
    // If a regex pattern
    if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]' && typeof newStr === 'string') {
      return this.replace(str, newStr);
    }
    if (typeof str === 'string' && typeof newStr === 'string') {
      // If a string
      return this.replace(new RegExp(str, 'g'), newStr);
    }
    if (typeof newStr === 'function') {
      console.warn('what the hell for using such function in a so old browser');
    }
    throw new Error('not support from polyfill');
  };
}

Promise.allSettled =
  Promise.allSettled ||
  function (arr: Promise<unknown>[]) {
    // eslint-disable-next-line consistent-return
    return new Promise((resolve, reject) => {
      // 非数组 报错
      if (Object.prototype.toString.call(arr) !== '[object Array]') {
        return reject(new TypeError(typeof arr + ' ' + arr + ' ' + ' is not iterable(cannot read property Symbol(Symbol.iterator))'));
      }
      const args = Array.prototype.slice.call(arr);
      if (args.length === 0) return resolve([]);
      let arrCount: number = args.length;

      function resolvePromise(index: number, value: Promise<unknown>) {
        if (typeof value === 'object') {
          const { then } = value;
          if (typeof then === 'function') {
            then.call(
              value,
              function (val) {
                args[index] = { status: 'fulfilled', value: val };
                arrCount -= 1;
                if (arrCount === 0) {
                  resolve(args);
                }
              },
              function (e) {
                args[index] = { status: 'rejected', reason: e };
                arrCount -= 1;
                if (arrCount === 0) {
                  resolve(args);
                }
              }
            );
          }
        }
      }

      for (let i = 0; i < args.length; i++) {
        // 轮流执行Promise
        resolvePromise(i, args[i]);
      }
    });
  };
inWindow() && (window.BuildData = config('build_date') as string);
export const ignoreLoginPath: string[] = noLoginPath;
if (inWindowTool()) {
  window.apiUtils.ignoreLoginPath = ignoreLoginPath;
}
// const profile = config('profile') as string;
export const isEdm = () => !!profile && profile.includes('edm');
export const isFFMS = () => !!profile && profile.includes('ffmsedm');
export const isLowMemoryMode = inWindow() ? navigator.userAgent.includes('lx-low-memory-mode') : false;
export const isUseSystemProxy = inWindow() ? !navigator.userAgent.includes('no-system-proxy') : false;
export type SYSTEM_PROXY_TYPE = 'systemProxy-useDirect' | 'systemProxy-useSystem' | 'systemProxy-smartProxy';
export const defaultSystemProxyType: SYSTEM_PROXY_TYPE = 'systemProxy-smartProxy';
export const SYSTEM_PROXY_TYPES: Array<SYSTEM_PROXY_TYPE> = ['systemProxy-smartProxy', 'systemProxy-useSystem', 'systemProxy-useDirect'];
export const systemProxyType: SYSTEM_PROXY_TYPE = inWindow()
  ? SYSTEM_PROXY_TYPES.find(item => navigator.userAgent.indexOf(item) !== -1) || defaultSystemProxyType
  : defaultSystemProxyType;
export const reLoginCodeList = {
  FA_SECURITY: 1,
  FA_INVALID_SESSION: 1,
  FA_UNAUTHORIZED: 1,
  NS_411: 1,
  NF_401: 1,
  NF_403: 1,
  'ERR.SESSIONNULL': 1,
  EXP_AUTH_COOKIE_TIMEOUT: 1,
};
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BUILD_ISEDM: boolean;
      BUILD_ISLINGXI: boolean;
      BUILD_ISWEB: boolean;
      BUILD_ISELECTRON: boolean;
      BUILD_ISPREVIEWPAGE: boolean;
      BUILD_CONTEXTPATH: string;
    }
  }
  interface Window {
    apiResposity: ApiResposity;
    electronLib: Lib;
    BuildData: string;
    siriusVersion: string;
    fs: any;
    apiManager: ApiManager;
    apiUtils: {
      pathNotInArrJudge(location: Location, paths: string[]): boolean;
      inWindow(): boolean;
      ignoreLoginPath: string[];
      getPageName(): string;
    };
    SDK: {
      Chatroom: any;
      NIM: NIMInterface;
      util: {
        [k: string]: any;
      };
    };
    DATracker: DATracker;
    ysf: Kf;
    env_def: {
      // eslint-disable-next-line @typescript-eslint/ban-types
      config: (type: string, generate?: string) => string | string[] | Function;
    };
    lf: {
      Order: lf.Order;
      Type: lf.Type;
      TransactionStats: lf.TransactionStats;
      PredicateProvider: lf.PredicateProvider;
      Row: lf.Row;
      Database: lf.Database;
      schema: {
        DataStoreType: lf.schema.Database;
        DatabasePragma: lf.schema.DatabasePragma;
        Database: lf.schema.Database;
        Column: lf.schema.Column;
        Table: lf.schema.Table;
        ConnectOptions: lf.schema.ConnectOptions;
        Builder: lf.schema.Builder;
        IndexedColumn: lf.schema.IndexedColumn;
        TableBuilder: lf.schema.TableBuilder;
        create: any;
      };
    };
    apiPolicies: StringTypedMap<ApiPolicy>;
    performance: Performance & {
      memory: {
        totalJSHeapSize: number;
        usedJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    process: {
      getCPUUsage: () => Promise<{
        /**
         * The number of average idle CPU wakeups per second since the last call to
         * getCPUUsage. First call returns 0. Will always return 0 on Windows.
         */
        idleWakeupsPerSecond: number;
        /**
         * Percentage of CPU used since the last call to getCPUUsage. First call returns 0.
         */
        percentCPUUsage: number;
      }>;
      getHeapStatistics: () => Promise<{
        totalHeapSize: number;
        totalHeapSizeExecutable: number;
        totalPhysicalSize: number;
        totalAvailableSize: number;
        usedHeapSize: number;
        heapSizeLimit: number;
        mallocedMemory: number;
        peakMallocedMemory: number;
        doesZapGarbage: boolean;
      }>;
      getProcessMemoryInfo: () => Promise<{
        /**
         * The amount of memory not shared by other processes, such as JS heap or HTML
         * content in Kilobytes.
         */
        private: number;
        /**
         * The amount of memory currently pinned to actual physical RAM in Kilobytes.
         *
         * @platform linux,win32
         */
        residentSet: number;
        /**
         * The amount of memory shared between processes, typically memory consumed by the
         * Electron code itself in Kilobytes.
         */
        shared: number;
      }>;
    };
    isBridgeWorker: boolean;
    isAccountBg: boolean;
    loginUserNewAccountInfo: boolean;
    // eslint-disable-next-line @typescript-eslint/ban-types
    getSpConf: (data: string) => string | string[] | Function;
    getLocalLabel: GetLocalLabel;
    langJson: { [key: string]: string };
    addLangInfo: (langInfo: { [key: string]: string }) => void;
    systemLang: Lang;

    // API定义
    bridgeApi: {
      master: MasterBridge;
      worker: WorkerBridge;
    };
    apiUtil: Record<string, any>;

    featureSupportInfo: {
      supportNativeProxy: boolean;
      supportCrypto: boolean;
    };

    jumpErr: {
      msg: string;
    };
    // cypress 测试框架需要
    Cypress: any;
    appReady: boolean;
  }
}

export const supportLocalIndexedDB = () => {
  // note: 1.16版本支持快速搜索。暂时关闭平替indexedDB入口
  if (inWindow() && !isElectron() && Date.now() > 2524579200000) {
    return false;
  }
  return true;
};

export const addAccountPageEmailsKey = 'addAccountPageCurrentEmails';
