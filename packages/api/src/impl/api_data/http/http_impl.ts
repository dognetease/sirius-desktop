/* eslint-disable max-depth */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-param-reassign */
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
// import adapter from '';
import { config as confFunc, ignoreLoginPath } from 'env_def';
import { api } from '@/api/api';
import { apis, environment, getPageName, isElectron, inWindow } from '@/config';
import { ErrMsgCodeMap, ErrMsgCodeMapType } from '@/api/errMap';
import {
  ApiRequestConfig,
  ApiResponse,
  BlackUrlList,
  CachePolicy,
  constHttpCanceledToken,
  DataTransApi,
  HttpTransMethod,
  RequestHandleConfig,
  ResponseData,
  URLBuilderConf,
} from '@/api/data/http';
// import {SystemApi} from "../../../api/system/system";
import { EventApi, SystemEvent } from '@/api/data/event';
import { SequenceHelper, StringTypedMap } from '@/api/commonModel';
import { DeviceInfo, SystemApi } from '@/api/system/system';
// import HttpCacheDb from './http_cache_dbl';
import { ApiLifeCycleEvent, PopUpMessageInfo, PopUpType, resultObject } from '@/api/_base/api';
import { httpCacheImpl, HttpCacheNewDbl } from './dexie_db_api_impl_new';
import { DataTrackerApi, LoggerApi } from '@/api/data/dataTracker';
import { DataStoreApi } from '@/api/data/store';
import { PerformanceApi } from '@/api/system/performance';
import { pathNotInArrJudge, util, getCurrentPageEnv, getReLoginUpTime } from '@/api/util';
import { locationHelper } from '@/api/util/location_helper';
import { SubAccountExpired } from '@/const';
// import { conf } from '@/common';

const blackList = confFunc('blackUrlList') as unknown as BlackUrlList;
const config = {
  timeout: 30000,
  // httpsAgent: new https.Agent({
  //     rejectUnauthorized: conf.stage != 'dev'
  // }),
  // adapter:adapter
};

export class NetworkErr extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const httpClient = axios.create(config);
const formHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
};
const jsonHeaders = {
  'Content-Type': 'application/json;charset=UTF-8',
};
const xmlHeaders = {
  'Content-Type': 'application/xml;charset=UTF-8',
};
const fileHeader = {
  'Content-Type': 'application/octet-stream',
};
const methodConf: { [key: string]: any } = {
  get: {
    body: false,
  },
  delete: {
    body: false,
  },
  head: {
    body: false,
  },
  post: {
    body: true,
  },
  put: {
    body: true,
  },
  patch: {
    body: true,
  },
};
// const httpConsoleLog= (...msg: any) => {
//   console.log(...msg);
// };
class ReqHttpError extends Error {
  request: ApiRequestConfig;

  originRequest: ApiRequestConfig;

  constructor(message: string, request: ApiRequestConfig, origin: ApiRequestConfig) {
    super(message);
    this.request = request;
    this.originRequest = origin;
  }
}

class ProcessingReq {
  // key:string;
  res?: ApiResponse;

  error?: any;

  reqs: ((res?: ApiResponse, error?: any) => void)[];

  originReq: ApiRequestConfig;

  config?: RequestHandleConfig[];

  httpApi: HttpImpl;

  constructor(o: ApiRequestConfig, httpApi: HttpImpl) {
    // this.key=o.rqKey||"";
    this.reqs = [];
    this.originReq = o;
    this.httpApi = httpApi;
  }

  dequeueReq(res?: ApiResponse, error?: any): void {
    console.log('[http] request returned :' + (res?.uri || error?.request?.uri), res, error, this);
    this.res = res;
    this.error = error;
    if (this.reqs.length > 0) {
      let it;
      while (true) {
        it = this.reqs.pop();
        if (it) {
          it(res, error);
        } else {
          break;
        }
      }
    }
  }

  respond(res: ApiResponse<any> | Promise<ApiResponse> | undefined, r: (value: PromiseLike<ApiResponse> | ApiResponse) => void, error: any, j: (reason?: any) => void) {
    if (res) {
      r(res);
    } else if (error) {
      j(error);
    }
  }

  enqueueReq(req: ApiRequestConfig): Promise<ApiResponse> {
    req.enqueued = 1;
    if (this.res) {
      return Promise.resolve(this.res);
    }
    if (this.error) {
      return Promise.reject(this.error);
    }
    // console.log('request enqueue:', req, this);
    return new Promise<ApiResponse>((r, j) => {
      // const that = this;
      if (!this.res && !this.error) {
        const multiple = this.originReq.reLoginProcessing ? 2 : 3;
        const timeout = req.timeout ? req.timeout * multiple : HttpImpl.MAX_CACHE_REQ_TIME * 7 * multiple;
        console.log('[http] enqueue request timeout:' + timeout, req);
        let tid = -1;
        const handler = () => {
          if (this.res) {
            r(this.res);
          } else if (this.error) {
            j(this.error);
          } else {
            const e = { massage: 'timeout', request: req, origin: this.originReq };
            this.httpApi.dequeueReq(this, undefined, e);
            // this.dequeueReq(undefined,)
          }
        };
        tid = window.setTimeout(handler, timeout);
        this.reqs.push((res, error) => {
          this.respond(res, r, error, j);
          clearTimeout(tid);
        });
      } else {
        this.respond(this.res, r, this.error, j);
      }
    });
  }
}

// const allPrintableUnicode = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590
// \u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-
// \u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6
// \u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E
// -\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5
// \u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-
// \u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-
// \u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77
// \u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11
// \u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-
// \u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0
// \u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-
// \u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7
// \u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D
// \u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F
// \u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F
// \u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17
// \u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-
// \u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F
// \u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF
// \u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF
// \u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-
// \uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F
// \uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF
// \uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F
// \uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1
// \uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;
const defaultConfig: Partial<ApiRequestConfig> = {
  headers: {},
  contentType: 'form',
  responseType: 'json',
  cachePolicy: 'noCache',
};
// const loginRequestUrl: Set<String> = new Set<String>(
//   [
//     urlStore['newPreLoginCheck'],
//     urlStore['preLogin'],
//     urlStore['mobileLogin'],
//     urlStore['sendCode'],
//     urlStore['login'],
//     urlStore['loginDoor'],
//     urlStore['updatePwd'],
//     urlStore['clientEnableIM'],
//     urlStore['getPwdRule']
//   ]
// );
const debugging = confFunc('disableReLogin') === '1';
const version = confFunc('version') as string;
const lxTrafficLabel = confFunc('lxTrafficLabel') as string;

const createNewUrl = (input: string | undefined) => {
  if (!input) throw new Error('not input url');
  const urlstr = input.startsWith('http') ? input : HttpImpl.host + input;
  const url = new URL(urlstr);
  return url;
};

// const profile = confFunc('profile') as string;

class HttpImpl implements DataTransApi {
  static readonly noRelogin = debugging && confFunc('stage') !== 'prod';

  static profile = confFunc('profile') as string;

  static loginPageBase = HttpImpl.profile && HttpImpl.profile.startsWith('webmail') ? (confFunc('logoutPage') as string) : (confFunc('loginPage') as string);

  static logoutPage = HttpImpl.loginPageBase;

  static readonly MAX_CACHE_REQ_TIME = 1500;

  static readonly MAX_RE_LOGIN_EXPIRED_TIME = 2 * 60 * 1000;

  static readonly MAX_RETRY_TIMES: number = 25;

  static readonly EACH_REQ_MAX_RETRY_TIMES: number = 3;

  static readonly MAX_CACHE_FAILED_TIMES: number = 40;

  static readonly host = confFunc('host') as string;

  static readonly comNotExist: string = confFunc('notExistUrl') as string;

  static cacheFailedTime = 0;

  static cacheSubAccountFailedTime: { [key: string]: number } = {};

  static focused = true;

  static reLoginTimeMap: StringTypedMap<number> = {};

  static reLoginSubAccountTimeMap: { [key: string]: StringTypedMap<number> } = {};

  static urlConfigMap: StringTypedMap<RequestHandleConfig[]> = {};

  static UrlConfigs: RequestHandleConfig[] = [];

  static processingReqs: StringTypedMap<ProcessingReq> = {};

  static processingSubAccountReqs: { [key: string]: StringTypedMap<ProcessingReq> } = {};

  static seq: SequenceHelper = new SequenceHelper();

  static requestFailedEntry: Set<string> = new Set<string>();

  static reLoginProcessing = false;

  static reLoginSubaccountProcessing: { [key: string]: boolean } = {};

  static reLoginRequest: ((ev: SystemEvent) => void)[] = [];

  static reLoginSubAccountRequest: { [key: string]: ((ev: SystemEvent) => void)[] } = {};

  static lastReLoginTime?: number;

  static lastSubAccountReLoginTime: { [key: string]: number } = {};

  private commonHeader: Record<string, string> = {};

  disableCache: boolean;

  readonly name: string;

  private eventApi: EventApi;

  private systemApi: SystemApi;

  private httpCacheDb: HttpCacheNewDbl;

  dataTrackerApi: DataTrackerApi;

  loggerApi: LoggerApi;

  deviceConfig?: DeviceInfo;

  alreadyLogout: boolean;

  subAccountAlreadLogoutMap: { [key: string]: boolean } = {};

  storeApi: DataStoreApi;

  performanceApi: PerformanceApi;

  pageName: string;

  static isInited = false;

  constructor() {
    this.name = apis.defaultApiImpl;
    this.eventApi = api.getEventApi();
    this.systemApi = api.getSystemApi();
    // this.httpCacheDb = new HttpCacheDb(HttpImpl.host);
    this.disableCache = false;
    this.httpCacheDb = httpCacheImpl;
    this.dataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
    this.loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as unknown as LoggerApi;
    this.alreadyLogout = false;
    this.storeApi = api.getDataStoreApi();
    this.performanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
    this.pageName = getPageName();
  }

  addCommonHeader(key: string, value: string) {
    this.commonHeader[key] = value;
  }

  removeCommonHeader(key: string) {
    delete this.commonHeader[key];
  }

  getDeviceInfo() {
    return this.deviceConfig;
  }

  getSubAccountByReqConfig(req?: ApiRequestConfig): string {
    if (req && req._account) {
      return req._account || '';
    }
    return '';
  }

  private trackReLoginToHubble(res: ApiResponse) {
    try {
      if (!process.env.BUILD_ISELECTRON) {
        return;
      }
      const pageEnv = getCurrentPageEnv();
      const upTime = getReLoginUpTime();
      if (!pageEnv) return;
      this.dataTrackerApi.track('pc_login_error_and_try_re_login', {
        retryTimes: res.config.retryTimes,
        env: pageEnv,
        failedUrlPath: res.config.urlPath,
        uptime: upTime,
      });
    } catch (ex) {
      console.error('trackReLoginParam ex', ex);
    }
  }

  private trackReLoginSuccessToHubble(res: ApiResponse) {
    try {
      if (!process.env.BUILD_ISELECTRON) return;
      this.dataTrackerApi.track('pc_login_re_login_success', {
        failedUrlPath: res.config.urlPath,
      });
    } catch (ex) {
      console.error('trackReLoginSuccessToHubble ex', ex);
    }
  }

  private trackLogoutToHubble() {
    try {
      if (!process.env.BUILD_ISELECTRON) return;
      const upTime = getReLoginUpTime();
      this.dataTrackerApi.track('pc_login_logout_occurred', {
        uptime: upTime,
        subType: 'forcelogout',
      });
    } catch (ex) {
      console.error('trackLogoutToHubble ex', ex);
    }
  }

  // eslint-disable-next-line max-statements
  private handleReLogin(res: ApiResponse): Promise<ApiResponse> {
    // eslint-disable-next-line prefer-promise-reject-errors
    const subAccount = this.getSubAccountByReqConfig(res.config);
    const currentUser1 = this.systemApi.getCurrentUser(subAccount);
    console.warn('[http relogin] noRelogin: ', HttpImpl.noRelogin, 'currentUser: ', currentUser1);
    const alreadyLogout = !subAccount ? this.alreadyLogout : this.subAccountAlreadLogoutMap[subAccount] || false;
    if (
      HttpImpl.noRelogin ||
      alreadyLogout ||
      this.storeApi.isLogout(subAccount) ||
      this.systemApi.isTransferringData() ||
      this.systemApi.isBkLoginInit() ||
      this.systemApi.getIsAddAccountPage()
    ) {
      return Promise.reject(new Error('not login'));
    }

    this.trackReLoginToHubble(res);

    if (currentUser1 == null) {
      this.triggerLogout(true, subAccount);
      return Promise.reject(new NetworkErr('ERR.ILLEGAL', 403));
    }

    this.performanceApi.time({ statKey: 're_login' }).then();
    const { config } = res;
    console.warn('[http] &&&&&& start re-login for:' + (config.urlPath || config.url) + ' result: ' + JSON.stringify(res.data), config);
    this.loggerApi.track('re_Login_in_http_request', { configPath: config.url, result: res.data });
    // 拆成两个判断 更便于之后修改和阅读
    if (!subAccount && HttpImpl.profile && HttpImpl.profile.startsWith('webmail')) {
      this.triggerLogout(true, subAccount);
      return Promise.reject(new NetworkErr('ERR.ILLEGAL', 403));
    }

    if (currentUser1?.isSharedAccount && !process.env.BUILD_ISELECTRON) {
      this.triggerLogout(true, subAccount);
      return Promise.reject(new NetworkErr('ERR.ILLEGAL', 403));
    }

    if (!config) {
      throw new NetworkErr('ERR.ILLEGAL', 500);
    }
    this.dataTrackerApi.track('occur_autoLogin', { reason: config.url, span: this.systemApi.getStartTimeSpan() });
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    const reLoginProcessing = !subAccount ? HttpImpl.reLoginProcessing : HttpImpl.reLoginSubaccountProcessing[subAccount] || false;
    if (reLoginProcessing) {
      return this.enqueueRequestWhenReLogin(config);
    }
    //
    // const url = config.url || '';
    // const [key, _] = this.getUrlPath(url);
    const key = config!.urlPath || '';
    // config.reLoginProcessing = true;
    let reLoginTimeMap = !subAccount ? HttpImpl.reLoginTimeMap : HttpImpl.reLoginSubAccountTimeMap[subAccount];
    if (!reLoginTimeMap && subAccount) {
      // eslint-disable-next-line no-multi-assign
      reLoginTimeMap = HttpImpl.reLoginSubAccountTimeMap[subAccount] = {};
    }
    if (reLoginTimeMap[key]) {
      reLoginTimeMap[key]++;
    } else {
      reLoginTimeMap[key] = 1;
    }
    const retryTime = reLoginTimeMap[key];
    if (retryTime > HttpImpl.MAX_RETRY_TIMES) {
      console.warn('[http] &&&&&& re-login failed ,max retry times exceed :' + config.url + ' for ' + config.retryTimes, config);
      reLoginTimeMap[key] = 0;
      this.triggerLogout(true, subAccount);
      this.loggerApi.track('re_login_exceed_all_max_times', config);
      return Promise.reject(new NetworkErr('ERR.LOGIN.SMSSESSEXP', 403));
    }
    if (config.retryTimes && config.retryTimes > HttpImpl.EACH_REQ_MAX_RETRY_TIMES) {
      console.warn('[http] &&&&&& re-login failed ,max retry times exceed :' + config.url + ' for ' + config.retryTimes, config);
      this.loggerApi.track('re_login_exceed_max_times', config);
      this.triggerLogout(true, subAccount);
      return Promise.reject(new NetworkErr('ERR.LOGIN.SMSSESSEXP', 403));
    }
    const nowTs = new Date().getTime();
    if (!subAccount) {
      HttpImpl.reLoginProcessing = true;
      HttpImpl.lastReLoginTime = nowTs;
    } else {
      HttpImpl.reLoginSubaccountProcessing[subAccount] = true;
      HttpImpl.lastSubAccountReLoginTime[subAccount] = nowTs;
    }

    return new Promise<ApiResponse>((r, j) => {
      let loginEventId: number;
      const eventName = !subAccount ? 'login' : 'subAccountLogin';
      const tid = window.setTimeout(() => {
        this.performanceApi
          .point({
            statKey: 're_login_ev',
            statSubKey: 're_login_timeout-' + this.pageName,
            value: 1,
            valueType: 4,
            flushAndReportImmediate: true,
          })
          .then();
        that.eventApi.unregisterSysEventObserver(eventName, loginEventId);
        this.triggerLogout(false, subAccount);
        this.returnReLoginFailed(config, j);
        this.loggerApi.track('re_login_timeout', config);
        console.warn('[http] re-login failed for re_login_timeout ' + config.url, config);
      }, HttpImpl.MAX_RE_LOGIN_EXPIRED_TIME);

      loginEventId = that.eventApi.registerSysEventObserver(eventName, {
        name: 'httpLoginOb' + new Date().getTime(),
        func: (ev: SystemEvent) => {
          that.eventApi.unregisterSysEventObserver(eventName, loginEventId);
          if (!subAccount) {
            HttpImpl.reLoginProcessing = false;
          } else {
            HttpImpl.reLoginSubaccountProcessing[subAccount] = false;
          }
          window.clearTimeout(tid);
          console.warn('[http] &&&&&&&& finish re-login for:' + config.url + ' got ' + !!ev.eventData, config);
          // 处理当前请求
          this.handleReloginPromiseExecutor.bind(this)(ev, config, r, j);
        },
      });

      if (currentUser1 == null) {
        this.triggerLogout(false, subAccount);
        this.returnReLoginFailed(config, j);
        return;
      }
      // if (!HttpImpl.reLoginProcessing) {
      const loginExpiredEventName = !subAccount ? 'loginExpired' : 'subAccountLoginHttpExpired';
      const eventData = !subAccount ? '' : { subAccount, agentEmail: currentUser1.agentEmail, mainAccount: currentUser1.mainAccount };
      if (config.retryTimes && config.retryTimes > 1) {
        setTimeout(() => {
          this.loggerApi.track('re_login_loginExpired_again', {
            isBkLoginInit: this.systemApi.isBkLoginInit(),
            isBkStableWindow: this.systemApi.isBkStableWindow(),
          });
          // if (!this.systemApi.isBkLoginInit()) {
          this.eventApi.sendSysEvent({
            eventName: loginExpiredEventName,
            eventStrData: 'warn',
            eventData,
            eventSeq: 0,
          });
          // }
        }, config.retryTimes * 200 + 500);
      } else {
        this.loggerApi.track('re_login_loginExpired', {
          isBkLoginInit: this.systemApi.isBkLoginInit(),
          isBkStableWindow: this.systemApi.isBkStableWindow(),
        });
        // if (!this.systemApi.isBkLoginInit()) {
        this.eventApi.sendSysEvent({
          eventName: loginExpiredEventName,
          eventStrData: 'warn',
          eventData,
          eventSeq: 0,
        });
        // }
      }
      // }
    });
  }

  triggerCurrentUserLogout(forceLogout: boolean) {
    this.triggerLogout(forceLogout);
  }

  private triggerLogout(forceLogout?: boolean, subAccount?: string) {
    const { systemApi } = this;
    const noLogoutEventPage =
      systemApi.getIsAddAccountPage() ||
      systemApi.isBkLoginInit() ||
      systemApi.getIsAddSubAccountPage() ||
      systemApi.getIsSubAccountInitPage() ||
      systemApi.getIsAddPersonalSubAccountPage();

    if (!subAccount && inWindow() && process.env.BUILD_ISWEB && locationHelper.isBkPage()) {
      try {
        const retrycountParam = locationHelper.getParam('retrycount');

        const retrycount = Number.isInteger(Number(retrycountParam)) ? Number(retrycountParam) : 0;
        if (retrycount < 10) {
          setTimeout(() => {
            const newUrl = new URL(location.href);
            newUrl.searchParams.set('retrycount', `${retrycount + 1}`);
            location.href = newUrl.href;
          }, 1000);
          return;
        }
      } catch (ex) {
        console.warn('[http_impl]triggerLogout refresh failed', ex);
      }
    }

    if (!noLogoutEventPage) {
      if (forceLogout || subAccount) {
        this.takeLogoutAction(subAccount);
      }
      if (subAccount) return;
      try {
        if (!subAccount) {
          this.storeApi.loadUser();
        } else {
          this.storeApi.loadSubAccountsUser();
        }
        const currentUser = this.systemApi.getCurrentUser(subAccount);
        if (!currentUser || !currentUser.sessionId) {
          this.takeLogoutAction(subAccount);
        } else if (!subAccount) {
          const event = {
            eventName: 'loginRetry',
            eventData: currentUser,
            eventSeq: 0,
            eventStrData: 'event',
          } as SystemEvent;
          this.eventApi.sendSysEvent(event);
        }
      } catch (e) {
        console.warn(e);
      }
    } else {
      console.warn('[http] logout triggered and been ignored', forceLogout);
    }
  }

  private takeLogoutAction(subAccount?: string) {
    const currentUser = this.systemApi.getCurrentUser(subAccount || '');
    const isSharedAccount = currentUser?.isSharedAccount;
    if (isSharedAccount) {
      this.eventApi.sendSysEvent({
        eventName: 'sharedAccountLogout',
        eventData: currentUser,
      });
    }
    if (HttpImpl.profile.startsWith('webmail') || isSharedAccount) {
      this.storeApi.setLastAccount(undefined, subAccount).then();
    }
    this.trackLogoutToHubble();
    if (!subAccount) {
      this.eventApi.sendSimpleSysEvent('logout');
      this.systemApi.unLockApp();
    } else {
      if (!currentUser) {
        return;
      }
      this.eventApi.sendSysEvent({
        eventName: 'subAccountLogout',
        eventData: {
          subAccount: currentUser?.id,
          agentEmail: currentUser?.agentEmail,
          mainAccount: currentUser?.mainAccount,
        },
      });
    }
  }

  private enqueueRequestWhenReLogin(config: ApiRequestConfig) {
    console.warn('[http] &&&&&& re-login enqueue for:' + (config.urlPath || config.url), config);
    this.loggerApi.track('enqueue_http_request_when_re_login', { url: config.url, retry: config.retryTimes, data: config.data });
    return new Promise<ApiResponse>((r, j) => {
      const subAccount = this.getSubAccountByReqConfig(config);
      const tid = window.setTimeout(() => {
        this.triggerLogout(false, subAccount);
        this.returnReLoginFailed(config, j);
      }, HttpImpl.MAX_RE_LOGIN_EXPIRED_TIME);
      if (subAccount && !HttpImpl.reLoginSubAccountRequest[subAccount]) {
        HttpImpl.reLoginSubAccountRequest[subAccount] = [];
      }
      const reLoginRequest = !subAccount ? HttpImpl.reLoginRequest : HttpImpl.reLoginSubAccountRequest[subAccount];
      reLoginRequest.push((ev: SystemEvent) => {
        this.handleReloginPromiseExecutor.bind(this)(ev, config, r, j);
        window.clearTimeout(tid);
      });
    });
  }

  private handleReloginPromiseExecutor(
    ev: SystemEvent<any>,
    config: ApiRequestConfig,
    r: (value: PromiseLike<ApiResponse> | ApiResponse) => void,
    j: (reason?: any) => void
  ) {
    const subAccount = this.getSubAccountByReqConfig(config);
    if (ev && ev.eventData) {
      if (ev.eventStrData && ev.eventStrData === 'timeout_event') {
        this.performanceApi
          .point({
            statKey: 're_login_ev',
            statSubKey: 're_login_timeout_no_logout-' + this.pageName,
            value: 1,
            valueType: 4,
            flushAndReportImmediate: true,
          })
          .then();
        const processingReq = config.rqKey
          ? !subAccount
            ? HttpImpl.processingReqs[config.rqKey]
            : HttpImpl.processingSubAccountReqs[subAccount][config.rqKey]
          : undefined;
        this.triggerLogout(false, subAccount);
        j(this.buildTimeoutErrorReturn(config, processingReq));
      } else {
        if (!subAccount) {
          HttpImpl.lastReLoginTime = Date.now();
          this.storeApi.loadUser();
        } else {
          HttpImpl.lastSubAccountReLoginTime[subAccount] = Date.now();
          this.storeApi.loadSubAccountsUser();
        }
        const promise = this.handleRequest(config);
        this.loggerApi.track('http_request_re_login_success', { url: config.url, retry: config.retryTimes, data: config.data });
        this.performanceApi.timeEnd({ statKey: 're_login' }).then();
        r(promise);
      }
    } else {
      const urlPath = config!.urlPath || '';
      // const key = this.getUrlPath(url);
      if (!subAccount) {
        HttpImpl.reLoginTimeMap[urlPath] = 0;
      } else {
        if (!HttpImpl.reLoginSubAccountTimeMap[subAccount]) {
          HttpImpl.reLoginSubAccountTimeMap[subAccount] = {};
        }
        HttpImpl.reLoginSubAccountTimeMap[subAccount][urlPath] = 0;
      }
      this.performanceApi.timeEnd({ statKey: 're_login' }, true).then();
      this.performanceApi
        .point({
          statKey: 're_login_ev',
          statSubKey: 're_login_failed-' + this.pageName,
          value: 1,
          valueType: 4,
          flushAndReportImmediate: true,
        })
        .then();
      // 无意义，到此处大概率都已经触发过logout逻辑了，保留作为保险策略
      this.triggerLogout(true, subAccount);
      this.returnReLoginFailed(config, j);
    }
    return config;
  }

  private static refactorRequestAfterLogin(config: ApiRequestConfig) {
    const { urlPath } = config;
    if (!urlPath) {
      return config;
    }
    const mapElement = HttpImpl.urlConfigMap[urlPath];
    console.log('[http] intercept ' + urlPath + ' using config :', mapElement);
    if (mapElement && mapElement.length > 0) {
      // for (const e of mapElement)
      mapElement.forEach(e => {
        if (e && e.reLoginUrlHandler) {
          config = e.reLoginUrlHandler(config);
        }
      });
    }
    return config;
  }

  // http://fs.qiye.163.com/fs/display/?p=X-NETEASE-HUGE-ATTACHMENT&
  // file=iQ1wm60-iGe9IRvoE_KytmBAHoZUMjSSWRis71cCuWcYCz2Vd691NWH5WD0raYlwuayf3ThvOoBos4XuWACleg&title=%E5%A4%8D%E4%BB%B6(3).zip
  private returnReLoginFailed(config: ApiRequestConfig, j: (reason?: any) => void) {
    console.warn(' &&&&&&failed re-login for:' + config.url, config);
    this.loggerApi.track('http_request_re_login_failed', { url: config.url, retry: config.retryTimes, data: config.data });
    /* if (config.handleReLogin) {
      j(new NetworkErr('ERR.LOGIN.SMSSESSEXP', 403));
    } else */
    if (pathNotInArrJudge(window.location, ignoreLoginPath)) {
      // HttpImpl.reLoginTimeMap[url] = 0;
      // location.assign(confFunc("loginPage") as string);
      // j(new NetworkErr(ErrMsgCodeMap["ERR.LOGIN.SMSSESSEXP"], 403));
      console.warn('[http] will logout for request :' + config.url, config);
      // this.triggerLogout(true);
    }
    j(new NetworkErr('ERR.LOGIN.SMSSESSEXP', 403));
    // else {
    //   j(new NetworkErr("ERR.LOGIN.SMSSESSEXP", 403));
    // }
  }

  private filterRequestTrack(logKey: string, req: ApiRequestConfig, data: unknown) {
    // if (isElectron()) {
    try {
      if (req?.parsedUrl?.pathname) {
        const {
          parsedUrl: { pathname },
        } = req;
        if (!blackList[pathname]) {
          this.loggerApi.track(logKey, data as resultObject);
        }
      }
    } catch (e) {
      console.error('track error', e);
    }
  }

  private getAlreadyLogoutBySubAccount(subAccount?: string): boolean {
    if (!subAccount) {
      return this.alreadyLogout;
    }
    return this.subAccountAlreadLogoutMap[subAccount] || false;
  }

  // eslint-disable-next-line max-statements
  request(method: HttpTransMethod, urlPre: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse> {
    let url = urlPre;

    if (config) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      config._account = (data && data._subAccount ? data._subAccount : config._account) || '';
      const reqAccount = this.getSubAccountByReqConfig(config);
      if (reqAccount) {
        config._account = this.storeApi.getEmailIdByEmail(reqAccount, true);
      }
      if (config._account === SubAccountExpired) {
        return Promise.reject('ERR.SUBACCOUNT.EXPIRED');
      }
    }

    config = { ...defaultConfig, ...config };

    const subAccount = this.getSubAccountByReqConfig(config);
    const alreadyLogout = this.getAlreadyLogoutBySubAccount(subAccount);

    if ((alreadyLogout || !this.systemApi.getCurrentUser(subAccount)) && this.judgeUrlNeedAuth(url)) {
      this.sendErrorMsg(config || { url, data }, 'customer', ErrMsgCodeMap['ERR.CANCELED'], 'ERR.CANCELED');
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject('ERR.CANCELED.NO.AUTH');
    }
    if (HttpImpl.comNotExist === url) {
      this.sendErrorMsg(config || { url, data }, 'customer', ErrMsgCodeMap['ERR.CANCELED'], 'ERR.CANCELED');
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject('ERR.CANCELED');
    }
    const m: string = method.toLowerCase();
    if (!methodConf[m].body && data) {
      url = this.buildUrl(url, data);
    } else if (config.contentType === 'form') {
      data = HttpImpl.buildFormQueryContent(data);
    }
    config.url = config.url || url;
    const { deviceConfig } = this;
    config.url = this.buildUrl(
      config.url,
      deviceConfig
        ? { ...deviceConfig, p: this.systemApi.isWebWmEntry() ? 'sirius' : deviceConfig.p }
        : {
            _version: version,
          }
    );
    // header中添加灰度环境标识
    this.addLxTrafficLabelToHeader(config);
    // 后端灰度测试标记等全局header
    // web环境下，只有灵犀域名添加commonHeader
    if (config.url.startsWith(HttpImpl.host) || config.url.startsWith('/')) {
      config.headers = { ...this.commonHeader, ...config.headers };
    }
    config.data = data;
    config.method = method;
    this.getUrlPath(config);
    const key = config!.urlPath || '';
    if (!HttpImpl.urlConfigMap[key] && HttpImpl.UrlConfigs) {
      config.parsedUrl && this.buildUrlInterceptor(key, config.parsedUrl.pathname);
    }
    // if (!config.headers) {
    // config.headers = config.headers || {};
    // config.
    // }
    if (config.operator) {
      const cancelSource = axios.CancelToken.source();
      const conf: AxiosRequestConfig = config as AxiosRequestConfig;
      conf.cancelToken = cancelSource.token;
      config.operator(operation => {
        if (operation === 'abort') {
          config!.canceled = true;
          cancelSource.cancel(constHttpCanceledToken + JSON.stringify(data));
        }
      });
    }
    config.rqKey = this.buildRequestKey(config);
    config.seq = HttpImpl.seq.next();
    config.responseType = config.responseType || 'json';
    // web端不打event日志
    // if (isElectron()) {
    //   this.loggerApi.track('http_request', config);
    // }
    this.filterRequestTrack('http_request', config, config);
    config.cachePolicy = 'noCache';
    return this.handleRequest(config);
  }

  buildRequestKey(config: ApiRequestConfig) {
    if (config.rqKey && config.rqKey.length > 5) {
      return config.rqKey;
    }
    if (config.urlPath && HttpImpl.urlConfigMap[config.urlPath]) {
      const element = HttpImpl.urlConfigMap[config.urlPath];
      if (element.length > 0 && element[0].cachePolicyGenerator && typeof element[0].cachePolicyGenerator === 'function') {
        return element[0].cachePolicyGenerator(config).cacheKey;
      }
    }
    const mainRq: Partial<ApiRequestConfig> = {
      url: config.url,
      data: ['stream', 'arraybuffer'].includes(config?.contentType || '') ? new Date().getTime() : config.data,
      method: config.method,
      _account: config._account || '',
    };
    return this.systemApi.md5(JSON.stringify(mainRq), true);
  }

  private getReLoginProcessingBySubAccount(subAccount?: string) {
    if (!subAccount || !subAccount.length) {
      return HttpImpl.reLoginProcessing;
    }
    return HttpImpl.reLoginSubaccountProcessing[subAccount] || false;
  }

  private handleRequest(config: ApiRequestConfig): Promise<ApiResponse> {
    if (!config.rqKey || !config.url) {
      return Promise.reject(new Error('illegal.request'));
    }

    const subAccount = this.getSubAccountByReqConfig(config);
    // 不会发生，仅做防护
    // console.log('handle request start:', config);
    config.retryTimes = config.retryTimes ? config.retryTimes + 1 : 1;
    if (subAccount && !HttpImpl.processingSubAccountReqs[subAccount]) {
      HttpImpl.processingSubAccountReqs[subAccount] = {};
    }
    // config.cacheMissed=true;
    const inProcessReq = !subAccount ? config.rqKey in HttpImpl.processingReqs : config.rqKey in HttpImpl.processingSubAccountReqs[subAccount];
    if (inProcessReq && !config.noEnqueue) {
      const prq = !subAccount ? HttpImpl.processingReqs[config.rqKey] : HttpImpl.processingSubAccountReqs[subAccount][config.rqKey];
      if (prq.originReq.seq !== config.seq) {
        // console.log('enqueue same request http: ' + config.url, config);
        return prq.enqueueReq(config);
      }
    }
    const processingReq = new ProcessingReq(config, this);
    if (
      config.useCacheResultPeriod &&
      config.useCacheResultPeriod > HttpImpl.MAX_CACHE_REQ_TIME &&
      (config.cachePolicy === 'useDirect' || config.cachePolicy === 'useAndRefresh') &&
      !config.cacheMissed &&
      !this.disableCache
    ) {
      // console.log('use cache: ', config);
      return this.useCachedResult(processingReq, undefined, config);
    }
    if (!subAccount) {
      HttpImpl.processingReqs[config.rqKey] = processingReq;
    } else {
      HttpImpl.processingSubAccountReqs[subAccount][config.rqKey] = processingReq;
    }
    console.log('[http] request http: ' + config.url.replace(HttpImpl.host, ''), config);
    HttpImpl.initHttpContentType(config);
    // const url = new URL(config.url);
    const reLoginProcessing = this.getReLoginProcessingBySubAccount(subAccount);
    if (reLoginProcessing && this.judgeUrlNeedAuth(config.url)) {
      return this.enqueueRequestWhenReLogin(config);
    }

    const lastReLoginTime = !subAccount ? HttpImpl.lastReLoginTime : HttpImpl.lastSubAccountReLoginTime[subAccount] || 0;
    // 发生过重登录后的2倍于重登录超时时间区域内，需要对请求进行重构，即主动替换sid等信息
    if (lastReLoginTime && lastReLoginTime + 2 * HttpImpl.MAX_RE_LOGIN_EXPIRED_TIME > Date.now()) {
      config = HttpImpl.refactorRequestAfterLogin(config);
      console.log('[http] refactor request http: ' + (config?.url?.replace(HttpImpl.host, '') || '[error]'), config);
      this.loggerApi.track('refactor_request_when_re_login', { url: config.url, retry: config.retryTimes, data: config.data });
    }

    return this.addTokenToHeader(config).then(newConfig =>
      httpClient
        .request(newConfig)
        .then(res => this.buildApiResponse(res, processingReq))
        .catch((error: any) => this.handleError(error, processingReq))
    );
  }

  private async addTokenToHeader(requestConfig: ApiRequestConfig) {
    const targetUrl = requestConfig.url;
    const href = requestConfig?.parsedUrl?.href;
    if (!process.env.BUILD_ISELECTRON && targetUrl) {
      const filter = {
        urls: [HttpImpl.host, confFunc('webMailHZHost') + '', confFunc('webMailBJHost') + ''],
      };
      const isValidUrl = filter.urls.some(url => targetUrl.startsWith(url) || href?.startsWith(url));
      if (isValidUrl) {
        const subAccount = this.getSubAccountByReqConfig(requestConfig);
        const lastReLoginTime = !subAccount ? HttpImpl.lastReLoginTime : HttpImpl.lastSubAccountReLoginTime[subAccount] || 0;
        const needRefresh = !!(lastReLoginTime && lastReLoginTime + 2 * HttpImpl.MAX_RE_LOGIN_EXPIRED_TIME > Date.now());
        let cookies = (await this.systemApi.doGetCookies(needRefresh, requestConfig._account)) || {};
        if (cookies && !subAccount) {
          // web端主账号不再发送任何 cookie-header
          cookies = {};
        }
        if (cookies) {
          const originHeaders = requestConfig.headers || {};
          requestConfig.headers = {
            ...originHeaders,
            ...cookies,
          };
        }
      }
    } else if (requestConfig._account) {
      // 取出_account对应数据，拼到url里
      const _session = await this.systemApi.getSessionNameOfSubAccount(requestConfig._account);
      if (requestConfig.url && !locationHelper.getSessioNameByUrl(requestConfig.url, _session)) {
        requestConfig.url = this.buildUrl(requestConfig.url, { _session });
      }
    }
    return requestConfig;
  }

  // header中添加灰度环境标识
  // https://lingxi.office.163.com/doc/#id=19000003516951&from=QIYE&parentResourceId=19000002334006&spaceId=3993514&ref=515262669
  private addLxTrafficLabelToHeader(requestConfig: ApiRequestConfig): ApiRequestConfig {
    if (lxTrafficLabel) {
      const originHeaders = requestConfig.headers || {};
      requestConfig.headers = {
        ...originHeaders,
        'lx-traffic-label': lxTrafficLabel,
      };
    }
    return requestConfig;
  }

  handleError(error: any, processingReq: ProcessingReq): Promise<ApiResponse> {
    this.loggerApi.track('http_request_failed', error);
    console.warn('[http] request got error:' + processingReq.originReq.url, error, error.response, error.request, processingReq.originReq);
    if (error.response) {
      const res: AxiosResponse = error.response;
      if (Number(res.status) === 401) {
        return this.handleReLogin(res as ApiResponse);
      }
      let code: keyof ErrMsgCodeMapType | undefined;
      let title;
      try {
        if (res.data && typeof res.data === 'object') {
          const data = res.data as ResponseData;
          // IM/空间的错误信息code放在res.data下
          const ntcode =
            (data.code as keyof ErrMsgCodeMapType) ||
            (data.msgCode as keyof ErrMsgCodeMapType) ||
            (data.data?.code as keyof ErrMsgCodeMapType) ||
            (data.data?.msgCode as keyof ErrMsgCodeMapType);
          const codeAvailable = ntcode in ErrMsgCodeMap;
          title = codeAvailable ? ErrMsgCodeMap[ntcode] : data.msg || data.msgCodeDesc || title;
          code = codeAvailable ? ntcode : code;
          if (code === 'FS_UNKNOWN') {
            this.dataTrackerApi.track('occur_unknown_error', { span: this.systemApi.getStartTimeSpan(), code });
          }
        }
      } catch (e) {
        console.warn(e);
      }
      if (res.status == 502 || res.status == 503 || res.status == 504) {
        this.sendErrorMsg(processingReq.originReq, 'toast', ErrMsgCodeMap['SERVER.ERR'], 'SERVER.ERR');
        this.dequeueReq(processingReq, undefined, error);
        return this.buildTimeoutErrorReturn(processingReq.originReq, processingReq, error); // this.useCachedResult(processingReq, error, res.config);
      }
      if (res.status == 500 || res.status >= 505) {
        if (title) {
          this.sendErrorMsg(processingReq.originReq, 'toast', title || ErrMsgCodeMap['SERVER.ERR'], code || 'SERVER.ERR');
        }
        this.dataTrackerApi.track('occur_unknown_error', { span: this.systemApi.getStartTimeSpan(), code: '500' });
        this.dequeueReq(processingReq, undefined, error);
        return Promise.reject(res);
      }
      if (res.status != 401 && res.status >= 400 && res.status < 500) {
        if (title) {
          this.sendErrorMsg(processingReq.originReq, 'toast', title || ErrMsgCodeMap['ERR.PARAM'], code || 'ERR.PARAM');
        }
        this.dataTrackerApi.track('occur_unknown_error', {
          span: this.systemApi.getStartTimeSpan(),
          code: res.status,
        });
        // throw new NetworkErr("ERR.PARAM", res.status);
        this.dequeueReq(processingReq, undefined, error);
        return Promise.reject(res);
      }
      if (environment !== 'prod') {
        this.sendErrorMsg(processingReq.originReq, 'toast', '发生未知的服务器错误', code || 'SERVER.ERR');
      }
      this.dequeueReq(processingReq, undefined, error);
      return Promise.reject(res);
      // throw new NetworkErr("NETWORK.ERR", res.status);
    }
    if (error.request) {
      // console.warn('network return failed:' + error.request.readyState);
      // if (Math.random() > 0.9) {
      //   this.eventApi.sendSysEvent({
      //     eventSeq: 0,
      //     eventName: 'networkFail',
      //     eventStrData: 'warn',
      //     eventData: undefined,
      //     noLog: true,
      //   });
      // }
      this.sendErrorMsg(processingReq.originReq, 'toast', '网络错误', 'NETWORK.ERR', ErrMsgCodeMap['NETWORK.ERR']);
      this.dequeueReq(processingReq, undefined, error);
      return this.buildTimeoutErrorReturn(error.request?.config, processingReq, error); // this.useCachedResult(processingReq, error,
      // processingReq.originReq);
    }
    // this.eventApi.sendSysEvent({
    //   eventSeq: 0,
    //   eventName: 'networkFail',
    //   eventStrData: 'warn',
    //   eventData: undefined,
    // });
    this.sendErrorMsg(processingReq.originReq, 'customer', ErrMsgCodeMap['ERR.CANCELED'], 'ERR.CANCELED', '');
    // this.dequeueReq(processingReq, undefined, error);
    console.warn('[http] canceled?', error); // 这种情况也不应该出现，出现的话，属于框架内部问题？

    // processingReq.dequeueReq(undefined, error);
    this.dequeueReq(processingReq, undefined, error);
    return Promise.reject(error);
  }

  private buildTimeoutErrorReturn(conf?: ApiRequestConfig, processingReq?: ProcessingReq, error?: any) {
    console.log('[http] timeout for request :' + processingReq?.originReq?.url, error, conf, processingReq);
    this.dataTrackerApi.track('http_request_time_out', {
      url: processingReq?.originReq?.url,
      error,
      conf,
    });
    const reason = 'NETWORK.ERR.TIMEOUT';
    if (processingReq) this.dequeueReq(processingReq, undefined, reason);
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject(reason);
  }

  private sendErrorMsg(config: ApiRequestConfig, type: PopUpType, title: string, code: string, content?: string) {
    try {
      if (environment !== 'prod') {
        this.eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventStrData: '',
          eventData: {
            popupType: config.noErrorMsgEmit ? 'customer' : type,
            popupLevel: 'error',
            // =: "用户取消",
            title,
            content:
              (content || '') +
              (environment === 'prod'
                ? ''
                : config.url?.replace(HttpImpl.host, '') + '||' + (typeof config.data === 'object' ? JSON.stringify(config.data) : config.data)),
            code,
          } as PopUpMessageInfo,
          auto: true,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  private getCacheFailedTimeBySubAccount(subAccount?: string) {
    const cacheFailedTime = !subAccount ? HttpImpl.cacheFailedTime : HttpImpl.cacheSubAccountFailedTime[subAccount];
    return cacheFailedTime || 0;
  }

  private setCacheFailedTimeBySubAccount(newFailedTime: number, subAccount?: string) {
    if (!subAccount) {
      HttpImpl.cacheFailedTime = newFailedTime;
    } else {
      HttpImpl.cacheSubAccountFailedTime[subAccount] = newFailedTime;
    }
  }

  useCachedResult(processingReq: ProcessingReq, error: any, req: ApiRequestConfig): Promise<ApiResponse> {
    const subAccount = this.getSubAccountByReqConfig(req);
    const config = req || processingReq.originReq;
    if (config.cacheMissed) {
      return this.useCacheResultFailed(processingReq, error, req);
    }
    console.log('[http] start use cache:' + processingReq.originReq.url);
    if (!subAccount && !this.systemApi.getCurrentUser()) {
      return this.useCacheResultFailed(processingReq, error, req);
    }
    if (subAccount && !this.systemApi.getCurrentUser(subAccount)) {
      return this.useCacheResultFailed(processingReq, error, req);
    }
    // req =  processingReq.originReq;
    return this.httpCacheDb
      .get(req)
      .then((res: resultObject | undefined) => {
        if (res && res.content && res.expiredTime && res.createTime) {
          const expired = Number(res.expiredTime);
          const created = Number(res.createTime);
          const now = new Date().getTime();
          const expirePeriod = req.useCacheResultPeriod || HttpImpl.MAX_CACHE_REQ_TIME + 500;
          const canUse = error || (expired > now && created + expirePeriod > now);
          if (canUse) {
            try {
              const parse = JSON.parse(res.content) as ApiResponse;
              if (parse && parse.status && parse.status >= 200 && parse.status <= 210) {
                // console.log('use cache to return ,', parse, processingReq);
                req.useCacheReturn = true;
                processingReq.originReq.useCacheReturn = true;
                this.dequeueReq(processingReq, parse, undefined);
                // console.log('use cache entry:', res);
                const cacheFailedTime = this.getCacheFailedTimeBySubAccount(subAccount);
                this.setCacheFailedTimeBySubAccount(cacheFailedTime < 0 ? 0 : HttpImpl.cacheFailedTime - 1, subAccount);
                return parse;
              }
            } catch (e) {
              console.warn('use cache failed for exception ', e);
            }
          }
        }
        return this.useCacheResultFailed(processingReq, error, req);
      })
      .catch(rs => {
        // this.dequeueReq(processingReq, undefined, error);
        // throw error;
        const cacheFailedTime = this.getCacheFailedTimeBySubAccount(subAccount);
        // console.log('use cache failed for exception ', rs);
        if (cacheFailedTime > HttpImpl.MAX_CACHE_FAILED_TIMES / 2 + 1) {
          this.setDisableCache(true);
          console.log('[http] use cache failed too much,will close cache function ' + HttpImpl.cacheFailedTime);
        }
        return this.useCacheResultFailed(processingReq, rs, error, req);
      });
  }

  private useCacheResultFailed(processingReq: ProcessingReq, reason: any, error: any, req?: ApiRequestConfig): Promise<ApiResponse> {
    const subAccount = this.getSubAccountByReqConfig(req);
    console.log('[http] use cache failed for ' + processingReq.originReq.url, reason, error, req);
    const cacheFailedTime = this.getCacheFailedTimeBySubAccount(subAccount);
    const newCacheFailedTime = cacheFailedTime > HttpImpl.MAX_CACHE_FAILED_TIMES ? HttpImpl.MAX_CACHE_FAILED_TIMES : cacheFailedTime + 1;
    this.setCacheFailedTimeBySubAccount(newCacheFailedTime, subAccount);
    req && (req.cacheMissed = true);
    processingReq.originReq.cacheMissed = true;
    if (error) {
      this.dequeueReq(processingReq, undefined, error);
      // return this.handleError(error, processingReq);
      return Promise.reject(error);
    }
    // processingReq.originReq.cacheMissed = true;
    return this.handleRequest(req || processingReq.originReq);
  }

  private makeSubAccountMapSafe(map: { [key: string]: any }, subAccount: string) {
    if (!map[subAccount]) {
      map[subAccount] = {};
    }
  }

  buildApiResponse(res: AxiosResponse, processingReq: ProcessingReq): ApiResponse | Promise<ApiResponse> {
    const apiConfig = res.config as ApiRequestConfig;
    if (apiConfig.canceled) {
      throw new Error('ERR.CANCELED');
    }
    // console.log("got web return:", res);
    if (res.status == 401) {
      // debugger;
      return this.handleReLogin(res as ApiResponse);
    }
    try {
      const uri = res.config.url;
      const req = processingReq.originReq;
      const realData = this.getAndParseData(res, req);
      const subAccount = this.getSubAccountByReqConfig(apiConfig);
      const ret = {
        uri,
        config: res.config,
        data: (req.responseType === 'json' || req.expectedResponseType === 'json') && (realData as ResponseData),
        rawData: req.responseType !== 'json' && req.expectedResponseType !== 'json' && realData,
        headers: res.headers,
        // contentLength:res.headers['contentLength'].value,
        status: res.status,
        statusText: res.statusText,
      } as ApiResponse;
      // const codeList = ['FA_SECURITY',"FA_INVALID_SESSION","FA_UNAUTHORIZED",-11,-16]
      let mapElement;
      let key;
      if (uri) {
        // [key] = this.getUrlPath(uri);
        // [key] = this.getUrlPath(uri);
        key = apiConfig.urlPath || '';
        mapElement = HttpImpl.urlConfigMap[key];
      }
      if (mapElement && this.testReLoginPolicy(mapElement, ret)) {
        return this.handleReLogin(res as ApiResponse);
      }
      if ((res.status >= 200 && res.status <= 210) || res.status == 302 || res.status == 304 || res.status == 307) {
        if (key && HttpImpl.reLoginTimeMap[key]) {
          if (!subAccount) {
            HttpImpl.reLoginTimeMap[key] = 0;
          } else {
            this.makeSubAccountMapSafe(HttpImpl.reLoginSubAccountTimeMap, subAccount);
            HttpImpl.reLoginSubAccountTimeMap[subAccount][key] = 0;
          }
        }
        // if (Math.random() > 0.9) {
        //   this.eventApi
        //     .sendSysEvent({
        //       eventSeq: 0,
        //       eventName: 'networkFail',
        //       eventStrData: 'suc',
        //       eventData: undefined,
        //       noLog: true,
        //     })
        //     ?.then();
        // }
      }
      processingReq.config = mapElement;
      this.dequeueReq(processingReq, ret, undefined);

      if (ret.config.retryTimes && ret.config.retryTimes > 1) {
        this.trackReLoginSuccessToHubble(ret);
      }

      return ret;
    } catch (e) {
      console.error('[http] error found when request ' + res?.config?.url, e);
      this.loggerApi.track('http-request-error-caught', { processingReq, res });
      this.sendErrorMsg(res.config, 'toast', '接口返回数据有误，无法解析，请稍后再试', 'ERR.SERVER');
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject('ERR.SERVER');
    }
  }

  // static singleQuotePattern=/'[a-zA-Z_\s]+'\s*:\s*'/i;
  private getAndParseData(res: AxiosResponse<any>, originReq: ApiRequestConfig) {
    if (!res || res.data === undefined) {
      return null;
    }
    this.filterRequestTrack('http_request_return', originReq, {
      status: res.status,
      data: !!res.data,
      headers: res.headers,
      config: originReq,
    });
    if (originReq.responseType === 'text' && typeof res.data === 'string' && originReq.expectedResponseType === 'json') {
      res.data = String(res.data);
      const dt = res.data.substr(res.data.indexOf('{'));
      // dt = dt.replace(allPrintableUnicode, '');
      console.log('[http] not regular json to handle:', dt);
      // if(HttpImpl.singleQuotePattern.test(dt)){
      // dt=dt.replaceAll('\'', '"');
      // }else {
      try {
        res.data = dt;
        return JSON.parse(res.data);
      } catch (e) {
        console.warn('http request not valid json ,return ' + dt, e);
      }
      try {
        return (
          // 多包裹一层，避免内部代码访问window和document这些敏感变量
          // eslint-disable-next-line no-new-func
          new Function('var window={},document={};return (function(){return ' + dt + ';})()').bind({})()
        );
      } catch (e) {
        console.warn('http request not valid json, can not parse ,return ' + dt, e);
        throw e;
      }
      // }
    }
    if (originReq.responseType === 'text' && originReq.expectedResponseType === 'text') {
      return typeof res.data === 'string' || typeof res.data === 'number' ? String(res.data) : JSON.stringify(res.data);
    }

    return res.data;
  }

  dequeueReq(processingReq: ProcessingReq, ret?: ApiResponse<any>, error?: any) {
    processingReq.dequeueReq(ret, error);
    // const that = this;
    const { originReq } = processingReq;
    const reqKey = originReq.rqKey || '';
    const subAccount = originReq._account || '';
    if (ret) {
      setTimeout(() => {
        if (!subAccount) {
          delete HttpImpl.processingReqs[reqKey];
        } else {
          delete (HttpImpl.processingSubAccountReqs[subAccount] || {})[reqKey];
        }
        if (!processingReq.originReq.useCacheReturn || processingReq.originReq.cachePolicy === 'useAndRefresh') {
          this.handleCache(processingReq);
        }
      }, HttpImpl.MAX_CACHE_REQ_TIME);
    } else {
      if (!subAccount) {
        delete HttpImpl.processingReqs[reqKey];
      } else {
        delete (HttpImpl.processingSubAccountReqs[subAccount] || {})[reqKey];
      }
      if (error && error instanceof ReqHttpError) {
        console.warn('error when handle request:', error);
      }
    }
  }

  handleCache(req: ProcessingReq) {
    // debugger
    const subAccount = req.originReq._account || '';
    if (req && req.originReq && req.originReq.cachePolicy === 'useAndRefresh') {
      // const newConf = HttpImpl.refactorRequestAfterLogin(Object.assign({}, req.originReq, { cachePolicy: 'refresh' }));
      const newConf = { ...req.originReq, cachePolicy: 'refresh' as CachePolicy };
      newConf.useCacheReturn = false;
      this.handleRequest(newConf)
        .then(() => {
          console.log('[http] refresh cache done');
        })
        .catch(re => {
          console.warn('catch error when write http cache', re);
        });
    }
    const needCache = !!this.systemApi.getCurrentUser(subAccount) && req.originReq.cachePolicy !== 'noCache';
    const resultReady = req && req.originReq && req.res;
    let canCache = true;
    if (req.originReq.urlPath && HttpImpl.urlConfigMap[req.originReq.urlPath] && resultReady) {
      const element = HttpImpl.urlConfigMap[req.originReq.urlPath];
      /* for (const it of element) */
      canCache = element.some(it => it && it.canCache && it.canCache(req.res!));
    }
    // let cacheKey=undefined;
    // if (req.config && needCache) {
    //   for (let it of req.config) {
    //     if (it.requestAutoCache && !it.requestAutoCache(req.originReq)) {
    //       needCache = false;
    //       break;
    //     }
    //   }
    // }
    if (needCache && canCache && resultReady && !req.originReq.useCacheReturn && !req.originReq.requestFailed) {
      this.httpCacheDb.put(req.originReq, req.res!).then().catch(console.error);
    }
    if (needCache && resultReady && req.originReq.useCacheReturn && (req.originReq.cacheMissed || req.originReq.requestFailed || !canCache)) {
      this.cleanCacheEntry(req.originReq);
    }
  }

  delete(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
    return this.request('delete', url, data, config);
  }

  get(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
    return this.request('get', url, data, config);
  }

  head(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
    return this.request('head', url, data, config);
  }

  options(url: string, config?: ApiRequestConfig): Promise<ApiResponse> {
    return this.request('options', url, undefined, config);
  }

  patch(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
    return this.request('patch', url, data, config);
  }

  post(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
    return this.request('post', url, data, config);
  }

  put(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse> {
    return this.request('put', url, data, config);
  }

  addConfig(conf: RequestHandleConfig) {
    if (conf) {
      const had = HttpImpl.UrlConfigs.findIndex(item => util.regexEqual(item.matcher, conf.matcher));
      if (had < 0) {
        HttpImpl.UrlConfigs.push(conf);
      }
    }
  }

  cleanCacheEntry(req: Partial<ApiRequestConfig>) {
    if (!req.rqKey) {
      req.rqKey = this.buildRequestKey(config);
    }
    if (req.rqKey) {
      console.log('[http] cache missed, and delete ', req.url);
      this.httpCacheDb
        .deleteItem(req.rqKey)
        .then()
        .catch(err => {
          console.error(err);
        });
    }
  }

  private static buildFormQueryContent(data: any, addHost?: boolean, url?: string) {
    const curDomain = locationHelper.getHost();
    let ret = addHost && !isElectron() ? '_host=' + encodeURIComponent(curDomain) : '';
    // const first = true;
    // for (const i in data)
    // if (data && 'host' in data && !addHost) {
    //   ret += ret.length > 0 ? '&' : '';
    //   ret = ret + 'host=' + this.paramToString(data.host);
    // }
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(i => {
        if (i === '_session' && !data[i]) {
          return;
        }
        if (typeof data[i] !== 'undefined' && i !== '_host') {
          if (url && url.includes(`${i}=`)) {
            return;
          }
          ret += ret.length > 0 ? '&' : '';
          ret = ret + i + '=' + this.paramToString(data[i]);
        }
      });
    }
    return ret;
  }

  private static paramToString(datum: any): string {
    if (typeof datum === 'string' || typeof datum === 'number') {
      return encodeURIComponent(datum);
    }
    if (typeof datum === 'boolean') {
      return datum ? 'true' : 'false';
    }
    if (typeof datum === 'object') {
      const isArray = Array.isArray(datum);
      if (!isArray) {
        return encodeURIComponent(JSON.stringify(datum));
      }
      let ret = '';
      let first = true;
      /* for (const i of datum) */
      datum.forEach(i => {
        if (first) {
          first = false;
        } else {
          ret += ',';
        }
        ret += this.paramToString(i);
      });
      return ret;
    }
    if (typeof datum === 'symbol' || typeof datum === 'function') {
      return encodeURIComponent(String(datum));
    }
    return '';
  }

  buildUrl(url: string, req: any, conf?: URLBuilderConf): string {
    const hasParam = url.indexOf('?') > 0;
    if (hasParam && !url.endsWith('&') && !url.endsWith('?')) {
      url += '&';
    }
    if (!hasParam) {
      url += '?';
    }
    return url + HttpImpl.buildFormQueryContent(req, url.indexOf('_host=') < 0 && !conf?.noAddingHost, url);
  }

  private static initHttpContentType(config: ApiRequestConfig) {
    if (config.contentType === '') {
      Object.assign(config.headers, { 'Content-Type': '' });
    } else {
      config.contentType = config.contentType || 'form';
      if (config.contentType === 'form') {
        Object.assign(config.headers, formHeaders);
      } else if (config.contentType === 'json') {
        config.headers = { ...config.headers, ...jsonHeaders };
      } else if (config.contentType === 'xml') {
        Object.assign(config.headers, xmlHeaders);
      } else if (config.contentType === 'stream') {
        if (config.headers['Content-Type'] && config.headers['Content-Type'].length > 0) {
          console.log('[http] content type original:', config.headers['Content-Type']);
        } else {
          Object.assign(config.headers, fileHeader);
        }
      }
    }
    Object.assign(config.headers, { Accept: 'application/json' });
  }

  private buildUrlInterceptor(urlPath: string, urlStr: string) {
    HttpImpl.urlConfigMap[urlPath] = HttpImpl.urlConfigMap[urlPath] || [];
    HttpImpl.UrlConfigs.forEach(it => {
      if (it.matcher.test(urlStr)) {
        const confg = HttpImpl.urlConfigMap[urlPath];
        confg.push(it);
      }
    });
  }

  private testReLoginPolicy(mapElement: RequestHandleConfig[], ret: ApiResponse<any>) {
    if (!mapElement || mapElement.length === 0) {
      return false;
    }

    return mapElement.some(el => el && el.requestAutoReLogin && el.requestAutoReLogin(ret));
  }

  getUrlPath(config: ApiRequestConfig) {
    if (!config || !config.url) {
      return;
    }
    const { url } = config;
    config.parsedUrl = createNewUrl(url);
    const urlStr = config.parsedUrl.pathname + (config.tag || '');
    config.urlPath = urlStr;
  }

  onBlur() {
    HttpImpl.focused = false;
    return this.name;
  }

  onFocus() {
    HttpImpl.focused = true;
    return this.name;
  }

  setLogoutStatus(flag: boolean) {
    this.alreadyLogout = flag;
  }

  setSubAccountLogoutStatus(subAccount: string, flag: boolean) {
    this.subAccountAlreadLogoutMap[subAccount] = flag;
  }

  watchLoginExpired() {
    // HttpImpl.lastReLoginTime = new Date().getTime();
    HttpImpl.reLoginProcessing = true;
  }

  watchSubAccountLoginExpired(ev: SystemEvent) {
    if (ev && ev.eventData) {
      const { eventData } = ev;
      const emailId = eventData.subAccount;
      HttpImpl.reLoginSubaccountProcessing[emailId] = true;
    }
  }

  afterLogin(ev?: ApiLifeCycleEvent) {
    if (ev && ev.data) {
      HttpImpl.reLoginProcessing = false;
      HttpImpl.cacheFailedTime = 0;
      HttpImpl.reLoginTimeMap = {};
      // HttpImpl.urlConfigMap = {};
      // HttpImpl.UrlConfigs: RequestHandleConfig[] = [];
      HttpImpl.processingReqs = {};
      this.alreadyLogout = false;
      HttpImpl.lastReLoginTime = new Date().getTime();
      // 处理过程中被加入等待队列的请求
      let it;
      while (true) {
        it = HttpImpl.reLoginRequest.pop();
        if (it) {
          it(ev.data as SystemEvent);
        } else {
          break;
        }
      }
      this.buildLogoutPage();
    }
    this.httpCacheDb.init();
    return this.name;
  }

  private resetSubAccountState(subAccount: string) {
    HttpImpl.reLoginSubaccountProcessing[subAccount] = false;
    this.setCacheFailedTimeBySubAccount(0, subAccount);
    HttpImpl.reLoginSubAccountTimeMap[subAccount] = {};
    HttpImpl.processingSubAccountReqs[subAccount] = {};
    this.subAccountAlreadLogoutMap[subAccount] = false;
    HttpImpl.lastSubAccountReLoginTime[subAccount] = new Date().getTime();
  }

  private handleSubAccountLogin(ev: SystemEvent) {
    if (ev && ev.eventData) {
      const { id: subAccount } = ev.eventData;
      if (!subAccount) return;
      this.resetSubAccountState(subAccount);

      let it;
      while (true) {
        it = (HttpImpl.reLoginSubAccountRequest[subAccount] || []).pop();
        if (it) {
          it(ev);
        } else {
          break;
        }
      }
    }
  }

  beforeLogout() {
    this.httpCacheDb.close();
    return this.name;
  }

  setDisableCache(disable: boolean) {
    this.disableCache = disable;
  }

  init(): string {
    if (!HttpImpl.isInited) {
      this.eventApi.registerSysEventObserver('loginExpiredCrossWindow', {
        name: 'HttpWatchLoginExpiredCross',
        func: this.watchLoginExpired.bind(this),
      });

      this.eventApi.registerSysEventObserver('subAccountLoginExpiredCrossWindow', {
        name: 'httpImpl-subAccountLoginExpiredCrossWindow',
        func: this.watchSubAccountLoginExpired.bind(this),
      });

      this.eventApi.registerSysEventObserver('subAccountLogin', {
        name: 'httpImpl-subAccountLogin',
        func: this.handleSubAccountLogin.bind(this),
      });
      this.eventApi.registerSysEventObserver('SubAccountLoginExpired', {
        name: 'httpImpl-SubAccountLoginExpired',
        func: this.handleSubAccountLoginExpired.bind(this),
      });
    }
    HttpImpl.isInited = true;
    return this.name;
  }

  handleSubAccountLoginExpired(ev: SystemEvent) {
    if (ev && ev.eventData && ev.eventData.subAccount) {
      const { subAccount } = ev.eventData;
      this.resetSubAccountState(subAccount);
      HttpImpl.reLoginSubAccountRequest[subAccount] = [];
    }
  }

  updateDeviceInfo() {
    return this.systemApi.getDeviceInfo().then(res => {
      if (!this.deviceConfig) {
        this.deviceConfig = res;
      } else {
        // 新session的更新deviceid的问题
        if (res && res._deviceId !== this.deviceConfig._deviceId) {
          this.deviceConfig._deviceId = res._deviceId;
        }
      }
    });
  }

  afterInit() {
    this.updateDeviceInfo();
    if (this.systemApi.getCurrentUser()) {
      this.httpCacheDb.init();
    } else {
      // this.httpCacheDb.close();
    }
    return this.name;
  }

  getLogoutPage() {
    return HttpImpl.logoutPage;
  }

  afterLoadFinish() {
    // if (inWindow()) {
    //
    //   // this.eventApi.registerSysEventObserver('login', this.watchLogin.bind(this));
    // }
    this.buildLogoutPage();
    return this.name;
  }

  private buildLogoutPage() {
    if (this.systemApi.getCurrentUser()) {
      const currentAccount = this.systemApi.getCurrentUser();
      HttpImpl.logoutPage = this.buildUrl(HttpImpl.loginPageBase, {
        from: locationHelper.getHost(),
        uid: currentAccount?.id,
        domain: currentAccount?.domain,
      });
    }
  }

  private judgeUrlNeedAuth(input: string) {
    // const urlstr = input.startsWith('http') ? input : HttpImpl.host + input;
    const url = createNewUrl(input);
    let pathName = url.pathname;
    if (pathName.startsWith('/lx-web/')) {
      pathName = pathName.slice(7);
    }

    const noAuth =
      pathName.startsWith('/domain/') ||
      pathName.startsWith('/bjdomain/') ||
      pathName.startsWith('/lxdomain/') ||
      pathName.startsWith('/bjlxdomain/') ||
      pathName.startsWith('/login/') ||
      pathName.startsWith('/entry/') ||
      pathName.startsWith('/bjentry/') ||
      pathName.startsWith('/commonweb/') ||
      pathName.startsWith('/bjcommonweb/') ||
      pathName.startsWith('/config/api/') ||
      pathName.startsWith('/service/register') ||
      pathName.indexOf('/edisk/api/biz/external') >= 0 ||
      // pathName.indexOf('/config/api/pub/client/identify/domain') >= 0 ||
      pathName.indexOf('/corp-mail/auth') >= 0 ||
      pathName.indexOf('/cowork/api/biz/enter/accountInfo') >= 0 ||
      pathName.indexOf('/cowork/api/biz/enter/emailContactList') >= 0 ||
      pathName.indexOf('/corp-mail/bind_hosts/auth/preLogin') >= 0 ||
      pathName.indexOf('/privilege/api/biz/privilege/sirius/getAll') >= 0 ||
      pathName.indexOf('/privilege/api/biz/product/version/feature/privilege/getAll') >= 0 ||
      // pathName.indexOf('/config/api/biz/client/tag/info') >= 0 ||
      pathName.indexOf('/miniapp/qrcode/check') >= 0 ||
      pathName.indexOf('/customer/api/biz/config/notice') >= 0 ||
      pathName.indexOf('/commonweb/account/getAccountBaseInfo') >= 0 ||
      pathName.indexOf('/sirius/it-others/api/biz/sirius/login/code') >= 0 ||
      pathName.indexOf('/privilege/api/biz/product/menu/account/menuVersion') >= 0;
    return !noAuth;
  }
}

const httpImpl: DataTransApi = new HttpImpl();
// const init = function () {
//     httpImpl = new HttpImpl();
api.registerDataTransApi(httpImpl);
// return httpImpl.name;
// }q
/* const name = */
// init();
export default httpImpl;
