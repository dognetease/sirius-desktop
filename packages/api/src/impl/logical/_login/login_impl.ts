/* eslint-disable max-lines */
import { CookieStore, config } from 'env_def';
import { api } from '@/api/api';
import {
  accountType,
  LanguageOfHost,
  LoginApi,
  LoginCommonRes,
  LoginEncryptParams,
  LoginEncryptRes,
  LoginJumpConfig,
  LoginModel,
  LoginParams,
  LoginPasswordType,
  MobileBindAccountLoginParams,
  MobileCodeLoginParams,
  MobileLoginParams,
  MobileLoginValidateMailParams,
  MobileTokenLoginParams,
  PassWordType,
  PwdRuleModel,
  RefreshTokenLoginParams,
  RequestLoginData,
  RequestMobileLoginData,
  RequestPreLoginData,
  ResponseLoginData,
  ResponsePreLoginData,
  StoredAccount,
  SubAccountBindInfo,
  // SimpleBindResult,
  ISubAccountEventData,
  SimpleResult,
  IAddPersonalSubAccountModel,
  IMailClientConfig,
  QRCodeCheckResult,
  LoginSucceedRes,
  EntranceVisibleConfig,
} from '@/api/logical/login';
import { apis, environment, externalJumpUrls, ignoreLoginPath, inWindow, jumpLogin, loginPageExt, URLKey } from '@/config';
import { ErrMsgCodeMap, ErrMsgType } from '@/api/errMap';
import { ApiResponse, DataTransApi, ResponseData } from '@/api/data/http';
import {
  Api,
  ApiLifeCycleEvent,
  commonMessageReturn,
  EmailAccountDomainInfo,
  intBool,
  PopUpMessageInfo,
  User,
  addAccountPageReturnDataType,
  bindSubAccountPageReturnDataType,
  BkLoginInitData,
  BkLoginResultData,
} from '@/api/_base/api';
import { DataStoreApi, globalStoreConfig, ISubAccountEmailOnlyInfo, StoreData } from '@/api/data/store';
import { IntervalEventParams, SystemApi } from '@/api/system/system';
import { EventApi, SystemEvent } from '@/api/data/event';
import { MailConfApi } from '@/api/logical/mail';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { getCurrentPageEnv, getReLoginUpTime, pathNotInArrJudge, util, wait } from '@/api/util';
import { AccountApi, ICurrentAccountAndSharedAccount, MobileAccountInfo } from '@/api/logical/account';
import { ProductAuthApi } from '@/api/logical/productAuth';
import type { SubAccountTableModel } from '@/api/data/tables/account';

import loginUtils from './login_utils';
import corpLoginUtils from './login_corp_utils';
import account, { AccountTable } from '@/api/data/tables/account';
import { PerformanceApi } from '@/api/system/performance';
import { locationHelper } from '@/api/util/location_helper';
import {
  SUB_ACCOUNT_TYPES,
  SUB_ACCOUNT_ERRCODE_MAPS,
  DEFAULT_API_ERROR,
  DEFAULT_BIND_ACCOUNT_ERR,
  SEND_CODE_DEFAULT_ERROR,
  SELF_UNBLOCK_DEFAULT_ERROR,
} from './login_const';

const noHeaderTokenConfig = {
  noHeaderCookie: true,
};

const profile = config('profile') as string;
const isWebmail = profile && profile.startsWith('webmail');
let productCode = '';
if (isWebmail) {
  productCode = 'web';
} else if (profile && profile.startsWith('edm')) {
  productCode = 'sirius';
} else if (inWindow() && window.electronLib) {
  productCode = 'sirius';
} else {
  productCode = 'web';
}

const LOGIN_EXCLUDECOOKIE = 'QIYE_SESS,QIYE_TOKEN,mail_idc,Coremail,mCoremail,qiye_uid';
const LOGIN_AUTHRESPONSECOOKIES = 'token,refreshToken,sid,coremail,mCoremail,sess';

// import {wait} from "../../../api/util";
const defaultLoginInfo = {
  hl: 'zh_CN' as LanguageOfHost,
  all_secure: 1 as intBool,
  secure: 1 as intBool,
  deviceid: '--',
  // domain: "qy.163.com",
  p: productCode,
  support_verify_code: 1 as intBool,
  output: 'json',
};

const defaultPreLoginInfo = {
  p: productCode,
  output: 'json',
  // domain:"qy.163.com",
};
const defaultLoginDoor = {
  p: productCode,
  hl: 'zh_CN' as LanguageOfHost,
  uid: '',
  all_secure: 1 as intBool,
  output: 'json',
  origin: '',
};
const PassWordTypeMap: PassWordType = {
  plain: 1,
  md5: 2,
  rsa: 3,
};

const QrCheckStatus = {
  init: 0,
  scaning: 1,
  pass: 2,
  expire: 3,
};

const COMMON_WEB_HEADER = {
  'Qiye-Header': 'sirius',
};

const defauleNode = 'hz';

class ActionStore {
  currentPreloginRequest: RequestPreLoginData | undefined;

  subAccountCurrentPreLoginRequestMap: { [key: string]: RequestPreLoginData } = {};

  currentPreloginResponse: ResponsePreLoginData | undefined;

  currentSubAccountPreLoginResponse: { [key: string]: ResponsePreLoginData } = {};

  preLoginPassed = false;

  currentNode = defauleNode;

  subAccountNodeMap: { [key: string]: 'hz' | 'bj' } = {};

  keyOfAccount = '';

  currentAccount: accountType | undefined = undefined;

  currentSubAccount: { [key: string]: accountType } = {};

  codeRetryTime = 0;

  loginMethod: 'pass' | 'code' | 'mail' = 'pass';

  subAccountLoginMethodMap: { [key: string]: 'code' | 'pass' } = {};

  autoLogin = false;

  subAccountAutoLoginMap: { [key: string]: boolean } = {};

  logout = false;

  subAccountLogoutMap: { [key: string]: boolean } = {};

  mailMode: string = loginUtils.getDefaulaMailModeVal();

  // corp login过程中的sid
  corpSid = '';

  unqCode = '';

  currentAccountPwd = '';

  loginIssueConfirmShowed = false;

  currentWillLoginAccount = '';

  currentWillLoginSubAccount = '';

  bindSubAccountInfo?: {
    winId?: number;
    webId?: number;
    sessionName?: string;
    email?: string;
  } = {};

  bindSubAccountCookieMapInfo: { [key: string]: { [key: string]: string } } = {};
}

interface LoginModelExt extends LoginModel {
  res: ResponseLoginData;
}

class LoginApiImpl implements LoginApi {
  static accountPwdAutoFilled: string = config('accountPwdAutoFilled') as string;

  static maxLoginNoRefreshSpan = 1800000;

  static isInited = false;

  public static defaultErrInfo: string = ErrMsgCodeMap['SERVER.ERR'];

  public static keyDeviceUUID: string = config('browerDeviceUUID') as string;

  public static edmLoginReportKey = 'edmLoginReportKey';

  public static edmLoginReportKeyFlag = '0';

  private subAccountBindInfo: SubAccountBindInfo | null = null;

  private static readonly storeConfig = globalStoreConfig;

  private readonly changeHashUrl = /^#\/?((?:doc)|(?:sheet)|(?:share)|(?:unitable))/i;

  private readonly encryptedPwdHead = 'encrypted:[';

  private readonly encryptedPwdTail = ']';

  private autoFillPwdMd5 = '';

  impl: DataTransApi;

  systemApi: SystemApi;

  eventApi: EventApi;

  storeApi: DataStoreApi;

  name: string;

  actions: ActionStore;

  accountApi: AccountApi;

  dataTrackApi: DataTrackerApi;

  loggerApi: DataTrackerApi;

  mailConfApi: MailConfApi;

  noLoginStatus: boolean;

  subAccountNoLoginStatusMap: { [key: string]: boolean } = {};

  logoutProcessing: boolean;

  subAccountLogoutProcessingMap: { [key: string]: boolean } = {};

  performanceApi: PerformanceApi;

  productAuthApi: ProductAuthApi;

  addAccountEventId = 0;

  private noLoginEvent = false;

  constructor() {
    this.impl = api.getDataTransApi();
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    // TODO action改造
    this.actions = new ActionStore();
    this.eventApi = api.getEventApi();
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    this.dataTrackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
    this.loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as unknown as DataTrackerApi;
    this.mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
    this.performanceApi = api.requireLogicalApi(apis.performanceImpl) as unknown as PerformanceApi;
    this.name = apis.loginApiImpl;
    this.noLoginStatus = false;
    this.logoutProcessing = false;
    this.productAuthApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
  }

  private unpackLoginData(res: ApiResponse): ResponseData {
    console.log('[login] return from network:' + res?.data?.code, JSON.stringify(res.data), JSON.stringify(res.config.data));
    this.loggerApi.track('login_request_returned', { res });
    const data = res.data as ResponseData;
    return data;
  }

  private static commonCatch(reason: any): string {
    if (reason instanceof Error) {
      return LoginApiImpl.getErrMsg(reason.message);
    }
    if (typeof reason === 'string') {
      return LoginApiImpl.getErrMsg(reason);
    }
    return LoginApiImpl.defaultErrInfo;
  }

  static getErrMsgCode(errCode: string): string {
    if (errCode) {
      if (errCode === 'LOGIN.PERMDENY' && inWindow() && window.electronLib) {
        return 'LINGXI.LOGIN.PERMDENY';
      }
    }
    return errCode;
  }

  private static getErrMsg(errMsg: string | undefined, defaultMsg?: string): string {
    if (errMsg && errMsg in ErrMsgCodeMap) {
      const errCode = LoginApiImpl.getErrMsgCode(errMsg);
      return ErrMsgCodeMap[errCode as ErrMsgType] || ErrMsgCodeMap[errMsg as ErrMsgType];
    }
    return errMsg || defaultMsg || LoginApiImpl.defaultErrInfo;
  }

  handleAccountAndDomain(account: string): EmailAccountDomainInfo {
    return this.systemApi.handleAccountAndDomain(account) as unknown as EmailAccountDomainInfo;
  }

  getUrl(url: URLKey, email?: string) {
    let node;
    if (!email) {
      node = this.actions.currentNode || this.storeApi.getCurrentNode();
    } else {
      node = this.actions.subAccountNodeMap[email] || this.storeApi.getCurrentNode(email) || defauleNode;
    }
    return this.systemApi.getUrl(url, node);
  }

  async loadStorageToDB(): Promise<boolean> {
    try {
      return true;
    } catch (e) {
      console.error('[login] loadStorageToDB error', e);
      return false;
    }
  }

  private fillAutoEntryAndNoCookieInfo(req: any) {
    if (req && process.env.BUILD_ISWEB) {
      req.autoEntry = true;
      req.excludeCookie = LOGIN_EXCLUDECOOKIE;
      req.authResponse = LOGIN_AUTHRESPONSECOOKIES;
    }
  }

  isPreloginNeedUpdate(req: RequestPreLoginData) {
    const { currentPreloginRequest, preLoginPassed, currentPreloginResponse } = this.actions;
    if (preLoginPassed && currentPreloginResponse && currentPreloginRequest) {
      if (currentPreloginRequest.type === 1) {
        return !(req.mobile === currentPreloginRequest.mobile && req.sendCodeType === currentPreloginRequest.sendCodeType);
      }
      return !(req.domain === currentPreloginRequest.domain && req.account_name === currentPreloginRequest.account_name);
    }
    return true;
  }

  preLoginCheck(account: string): Promise<boolean> {
    return this.impl
      .get(this.getUrl('newPreLoginCheck') + '?email=' + account)
      .then((rs: ApiResponse) => {
        const resData = rs.data;

        if (!resData?.data) {
          return false;
        }

        return resData.data;
      })
      .catch(reason => {
        console.log('[login] pre login check error', reason);
        return true;
      });
  }

  private getUseSessionInfo(sessionName: string, setSessioName: string) {
    const ret: any = {};
    if (process.env.BUILD_ISELECTRON) {
      if (sessionName) {
        ret._session = sessionName;
      }
      if (setSessioName) {
        ret._setsession = setSessioName;
      }
    }
    return ret as { _session?: string; _setsession?: string };
  }

  async preLogin(req: RequestPreLoginData): Promise<ResponsePreLoginData> {
    // 缓存机制，如果之前的preLoginPassed，且domain和account_name相同，则直接返回上一次的响应值
    const isSubAccount = !!req.isSubAccount;
    if (!isSubAccount && !this.isPreloginNeedUpdate(req)) {
      return Promise.resolve(this.actions.currentPreloginResponse as ResponsePreLoginData);
    }

    const type = req.type || 0;
    let rs = true;
    const isEmailPreLogin = type === 0;
    if (isEmailPreLogin) {
      rs = await this.preLoginCheck('a@' + req.domain);
    }
    if (rs) {
      if (!isSubAccount) {
        this.actions.currentPreloginRequest = req;
      } else if (req.email) {
        this.actions.subAccountCurrentPreLoginRequestMap[req.email] = req;
      }
      const isNeteaseDomain = corpLoginUtils.getIsNeteaseDomain(req.domain as string);
      const preLoginUrlKey = isNeteaseDomain ? 'corpPreLogin' : 'preLogin';
      let reqUrl = this.getUrl(preLoginUrlKey, isSubAccount ? req.email : undefined);
      if (isSubAccount && req.sessionName) {
        const sessionInfo = this.getUseSessionInfo(req.sessionName, req.sessionName);
        reqUrl = this.impl.buildUrl(reqUrl, sessionInfo);
      }
      const data = await this.impl.post(reqUrl, req);
      const res = this.unpackLoginData(data);
      const { actions } = this;
      // sys字段标识 mailMode
      const mailMode = loginUtils.getMaiModeFromPreLoginResponse(res);
      if (!isSubAccount) {
        actions.mailMode = mailMode;
      }
      const isCorpMailMode = loginUtils.getIsCorpMailMode(mailMode);
      const reqEmail = req.email || '';
      if (String(res.code) === '200') {
        res.data.err = false;
        if (!isSubAccount) {
          actions.preLoginPassed = true;
          actions.currentPreloginResponse = res.data;
          if (isCorpMailMode) {
            // corpMail需要保存sid
            actions.corpSid = res.data?.sid;
          }
        } else {
          actions.currentSubAccountPreLoginResponse[reqEmail] = res.data;
        }
        res.data.isSubAccount = isSubAccount;
        res.data.sessionName = req.sessionName;
        res.data.email = reqEmail;
        return res.data as ResponsePreLoginData;
      }

      if (!isSubAccount) {
        actions.preLoginPassed = false;
        actions.currentPreloginResponse = undefined;

        if (isCorpMailMode) {
          // 出错，清空sid
          actions.corpSid = '';
        }
      } else {
        actions.currentSubAccountPreLoginResponse[reqEmail] = {} as ResponsePreLoginData;
      }
      res.data.isSubAccount = isSubAccount;
      res.data.sessionName = req.sessionName;
      res.data.email = reqEmail;
      // return {err: true};
      res.data.err = true;
      res.data.errmsg = LoginApiImpl.getErrMsg(res.msgCode);
      return res.data as ResponsePreLoginData;
    }
    return Promise.resolve({
      err: true,
      errmsg: ErrMsgCodeMap['ERR.LOGIN.DOMAINDENY'],
    });
  }

  doPreLogin(account: string, isSubAccount?: boolean, sessionName?: string): Promise<string | undefined | ResponsePreLoginData> {
    const dna = this.handleAccountAndDomain(account);
    if (!loginUtils.checkAccountAndDomain(dna)) {
      return Promise.resolve(loginUtils.getInputEmailErrorMsg());
    }

    const req = {
      ...defaultPreLoginInfo,
      account,
      account_name: dna.account,
      domain: dna.domain,
      mobile: this.actions.currentPreloginRequest?.mobile,
      isSubAccount: !!isSubAccount,
      sessionName: sessionName || '',
      email: account,
    };

    return this.preLogin(req).then(this.handlePreLoginData.bind(this)).catch(LoginApiImpl.commonCatch);
  }

  async doMobilePreLogin(mobile: string, sendCodeType: 0 | 1 | 2 = 1): Promise<string | undefined | ResponsePreLoginData> {
    try {
      const res = await this.preLogin({
        ...defaultPreLoginInfo,
        mobile,
        type: 1,
        sendCodeType,
      });
      return this.handlePreLoginData(res);
    } catch (e) {
      return LoginApiImpl.commonCatch(e);
    }
  }

  private handlePreLoginData(rs: ResponsePreLoginData) {
    if (rs.locked) {
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventData: ErrMsgCodeMap.EXP_AUTH_USER_STATUS_LOCKED,
        eventSeq: 0,
        eventStrData: 'warn',
      });
      return Promise.reject(new Error('prelogin fail , account locked'));
      // return "EXP_AUTH_USER_STATUS_LOCKED";
    }
    const isSubAccount = !!rs.isSubAccount;
    const reqEmail = rs.email || '';
    if (rs.node) {
      if (isWebmail && isSubAccount) {
        return 'Web端暂不支持跨hz/bj节点绑定账号，请下载桌面客户端进行绑定。';
      }
      if (!isSubAccount) {
        this.actions.preLoginPassed = false;
        this.actions.currentPreloginResponse = undefined;
      } else {
        this.actions.currentSubAccountPreLoginResponse[reqEmail] = {} as ResponsePreLoginData;
      }
      const currentActionNode = !isSubAccount ? this.actions.currentNode : this.actions.subAccountNodeMap[reqEmail] || defauleNode;
      // 不同的node，设置node，再doPreLogin一次
      if (currentActionNode !== rs.node) {
        const allowNodes = ['hz', 'bj'];
        const isAllowNode = allowNodes.includes(rs.node);
        if (!isAllowNode) {
          return {
            errMsg: `不支持的节点${rs.node}`,
            err: true,
          };
        }
        this.setupNodeInfo(rs.node, false, isSubAccount ? reqEmail : undefined).then();
        const { account, mobile, type = 'mail' } = !isSubAccount ? (this.actions.currentPreloginRequest as RequestPreLoginData) : { account: reqEmail, mobile: '' };
        if (type === 'mail') {
          return this.doPreLogin(account!, isSubAccount, rs.sessionName);
        }
        return this.doMobilePreLogin(mobile!);
      }
      // 如果node相同，理论上不会走到这里，返回错误
      return LoginApiImpl.defaultErrInfo;
    }
    // this.setupNodeInfo(this.actions.currentNode).then();
    const currentNode = isSubAccount ? this.actions.subAccountNodeMap[reqEmail] : this.actions.currentNode;
    this.setupNodeInfo(currentNode, false, isSubAccount ? reqEmail : undefined).then();
    // this.storeApi.setCurrentNode(this.actions.currentNode);
    // 有错误，转换错误
    const errMsg = rs.errmsg ? LoginApiImpl.getErrMsg(rs.errmsg) : '';
    if (errMsg) {
      rs.err = true;
      rs.errmsg = errMsg;
    } else {
      // 返回mailMode
      rs.isCorpMailMode = loginUtils.getIsCorpMailMode(this.actions.mailMode);
      rs.sid = this.actions.corpSid;
    }
    return rs;
  }

  private async setupNodeInfo(node: string, noEvent?: boolean, email?: string) {
    if (!email) {
      this.actions.currentNode = node;
      this.storeApi.setCurrentNode(node);
    } else {
      this.actions.subAccountNodeMap[email] = node as 'hz' | 'bj';
      this.storeApi.setCurrentNode(node, email);
    }

    if (!noEvent) {
      const ev = {
        eventName: 'preLogin',
        eventData: node,
        eventSeq: 0,
        eventStrData: 'warn',
      } as SystemEvent;
      await (this.eventApi.sendSysEvent(ev) || Promise.resolve());
    }
  }

  private disableBackgroundDB(removeSubPage?: boolean) {
    try {
      if (inWindow() && window.bridgeApi && window.bridgeApi.master) {
        window.bridgeApi.master.forbiddenBbWin4CurrPage();
        if (!this.systemApi.isElectron() && removeSubPage) {
          window.bridgeApi.master.removeSubPageInWeb();
        }
      }
      if (process.env.BUILD_ISELECTRON) {
        window.electronLib.masterBridgeManage.flush('');
      }
    } catch (ex) {
      console.error('diableBackgroundDBWin', ex);
    }
  }

  private enableBackgroundDB() {
    try {
      const isLowMemoryMode = this.systemApi.getIsLowMemoryModeSync();
      if (isLowMemoryMode) {
        return;
      }
      if (inWindow() && window.bridgeApi && window.bridgeApi.master) {
        window.bridgeApi.master.enableBbWin4CurrPage();
      }
    } catch (ex) {
      console.error('enableBackgroundDB', ex);
    }
  }

  async doAutoLogin(account: string, noLoginEvent?: boolean, noEnableBackDb?: boolean): Promise<LoginModel> {
    const tid = setTimeout(() => {
      if (environment === 'prod') {
        util.reload();
      }
    }, 95000);
    try {
      this.noLoginEvent = !!noLoginEvent;
      if (!this.isSameAccount(account) && !this.systemApi.isBkLoginInit()) {
        await this.doLogout(true, true);
      }
      console.log('[login] finish logout !!!!!- ');
      if (this.systemApi.isElectron() && window.electronLib) {
        const storedAccount = await this.getAccountStored(account);
        if (loginUtils.getIsCorpMailMode(storedAccount?.prop?.mailMode as string)) {
          await window.electronLib.appManage.clearCookieStore();
        }
        const cookies = storedAccount?.cookies;
        if (cookies && cookies.length > 0) {
          try {
            if (this.systemApi.isBkLoginInit()) {
              const currentSessionName = this.systemApi.getCurrentSessionName();
              await window.electronLib.appManage.setCookieStore({
                cookies,
                sessionName: currentSessionName || '',
              });
            } else {
              await window.electronLib.appManage.setCookieStore(cookies);
            }
            console.log('[login]  finish seting cookies !!!!!- ', cookies);
          } catch (e) {
            console.warn('[login] setCookieStore error', e);
          }
        }
      }
      const res = await this.autoLogin(account, false, noEnableBackDb);
      return res;
    } catch (e) {
      return { pass: false, errmsg: LoginApiImpl.commonCatch(e) || '未知错误' };
    } finally {
      this.noLoginEvent = false;
      clearTimeout(tid);
    }
  }

  // doSwitchAccountBack() {
  //   if (this.systemApi.isElectron()) {
  //     //load cookie again;
  //   }
  // }

  async corpAutoLogin(accountInfo: {
    domain: string;
    accountName: string;
    sessionId: string;
    accessToken: string;
    accessSecret: string;
  }): Promise<LoginModel | LoginModelExt> {
    const timeStampStr = Math.floor(new Date().getTime() / 1000).toString();

    const requestData = {
      account_name: accountInfo.accountName,
      domain: accountInfo.domain,
      sid: accountInfo.sessionId,
      accessToken: accountInfo.accessToken,
      timestamp: timeStampStr,
      signature: corpLoginUtils.getSignForCorpRenewSid(accountInfo.accessToken, accountInfo.accessSecret, timeStampStr),
    };

    const reNewSidUrl = this.getUrl('corpMailRenewSid');

    return this.impl
      .post(reNewSidUrl, requestData)
      .then(res => res.data)
      .then(res => {
        const resCode = String(res?.code);
        if (resCode === corpLoginUtils.CONSTANTS.CORP_API_SUCCESS_CODE) {
          return {
            pass: true,
            res: res?.data,
          } as LoginModelExt;
        }
        return {
          pass: false,
          errmsg: LoginApiImpl.getErrMsg(res?.msgCode),
          res,
        } as LoginModelExt;
      })
      .then(async rs => {
        if (rs.pass) {
          const email = accountInfo.accountName + '@' + accountInfo.domain;
          const newSid = rs.res?.sid as string;
          const newUser = await this.corpGetNewUserWithNewSid(email, newSid);
          if (newUser) {
            const loginData = corpLoginUtils.getResponseLoginDataFromUser(newUser as User);
            await this.corpLoginSucceed(loginData);
          } else {
            rs.pass = false;
          }
        }
        return rs;
      })
      .catch(err => {
        if (err && typeof err === 'string' && err === 'NETWORK.ERR.TIMEOUT') {
          return {
            pass: false,
            timeout: true,
            errmsg: '请求超时',
          } as LoginModel;
        }
        return {
          pass: false,
          errmsg: LoginApiImpl.commonCatch(err),
        } as LoginModel;
      });
  }

  isSameAccount(account: string) {
    const currentUser = this.systemApi.getCurrentUser();
    return account === currentUser?.id;
  }

  private async doSubAccountAutoLogin(_account?: string): Promise<LoginModel> {
    try {
      const agentAccount = _account;
      if (!agentAccount) {
        return {
          pass: false,
          errmsg: '无子账号',
        };
      }

      const currentUser = this.systemApi.getCurrentUser();

      const res = await this.loginAgentEmail(
        agentAccount,
        process.env.BUILD_ISWEB ? '' : 'persist:sirius',
        process.env.BUILD_ISWEB ? '' : this.getSessionNameOfSubAccount(agentAccount, currentUser ? currentUser.id : '')
      );
      return {
        pass: res.success,
        errmsg: res.errMsg || '',
      };
    } catch (ex) {
      console.error('doSubAccountAutoLogin-error', ex);
      return {
        pass: false,
        errmsg: (ex as any).mesage || '子账号登录接口出错',
      };
    }
  }

  async autoLogin(_account?: string, isSubAccount?: boolean, noEnableBackDb?: boolean): Promise<LoginModel> {
    try {
      const loginAccount = await this.getAccountStored(_account, isSubAccount);
      console.warn('[login autoLogin] account', loginAccount, this.systemApi.getCurrentUser(_account));
      if (!loginAccount) {
        return {
          errmsg: '无登录账号',
          pass: false,
        };
      }
      const sessionName = !isSubAccount ? '' : this.systemApi.getSessionNameOfSubAccount(loginAccount.id);
      this.loggerApi.track('login_start_autoLogin', { loginAccount });
      const { refreshToken, refreshTokenExpire, id, pwd, prop, loginAccount: willLoginAccount } = loginAccount;
      console.log('[login] re login using account info:', loginAccount);
      // 后台窗口如果一旦出现登录失效，需要关闭，正常逻辑不会走到这个地方，因为发送的loginExpired事件，在处理时会被转发到主窗口，其余主动调用的页面也不会出现是后台调用的情况
      if (window.isBridgeWorker) {
        this.systemApi.closeWindow(false, true);
      }
      if (isSubAccount && _account) {
        const isThirdAccount = this.systemApi.getIsThirdSubAccountByEmailId(_account);
        if (isThirdAccount) {
          return this.doSubAccountAutoLogin(loginAccount.agentEmail);
        }
      }

      const accountMailMode = prop?.mailMode as string;
      if (!isSubAccount && loginUtils.getIsCorpMailMode(accountMailMode)) {
        const params = corpLoginUtils.getCorpAutoLoginParams(loginAccount);
        return this.corpAutoLogin(params);
      }
      const { account: account_name, domain } = this.handleAccountAndDomain(willLoginAccount || id);
      let res: LoginModel | undefined;
      if (refreshToken && refreshTokenExpire) {
        // refreshToken登录成功需要把密码也存进去
        pwd && this.storePwd(pwd!, 2, isSubAccount, isSubAccount ? _account : undefined);
        this.loggerApi.track('login_doRefreshTokenLogin_autoLogin', {
          loginAccount,
        });
        res = await this.doRefreshTokenLogin({
          tokenExpire: refreshTokenExpire || 0,
          token: refreshToken || '',
          account_name,
          domain,
          isSubAccount,
          noEnableBackDb,
        });
        if (res.pass) {
          return res;
        }
      }

      if (pwd && pwd !== LoginApiImpl.accountPwdAutoFilled && pwd !== this.autoFillPwdMd5) {
        this.loggerApi.track('login_pwd_autoLogin', { loginAccount });
        return this.doLogin(
          {
            account: id,
            isAutoLogin: true,
            pwd: LoginApiImpl.accountPwdAutoFilled,
            isSubAccount: !!isSubAccount,
            sessionName,
            noEnableBackDb,
          },
          res?.timeout ? 1 : 2
        ); // 前一个请求已经超时了，少重试一次
      }
      return {
        pass: false,
        errmsg: '无登录账号',
      };
    } catch (e) {
      console.warn('[login] error occured when autoLogin:', e);
      return {
        errmsg: (e as any)?.msg || '预登录接口发生未知错误',
        pass: false,
      };
    }
  }

  async getAccountStored(currentAccountId?: string, isSubAccount = false): Promise<AccountTable | undefined> {
    let accountId = currentAccountId;
    const currentUser = this.systemApi.getCurrentUser();
    if (!accountId) {
      accountId = currentUser?.id;
    }
    if (accountId === currentUser?.id && currentUser?.isSharedAccount) {
      return currentUser;
    }
    if (accountId) {
      const accountList = await this.accountApi.doGetAccountInfo([accountId], isSubAccount);
      return accountList[0];
    }
    return undefined;
  }

  async corpLoginSucceed(res: ResponseLoginData, beforeUserInfo?: User | null) {
    let user: User | null = null;
    if (beforeUserInfo) {
      user = beforeUserInfo;
    }
    // 之前登录过，是信任设备，接口返回的信息少，需要之前的用户信息
    await this.loginSucceed({
      isCorpMail: true,
      uid: res.uid as string,
      nickname: res.nickname || user?.nickName,
      cookieName: res.sid as string,
      orgName: res.orgName || (user?.company as string),
      cnName: res.cookieName,
      accessToken: res.accessToken || (user?.prop?.accessToken as string),
      accessSecret: res.accessSecret || (user?.prop?.accessSecret as string),
      nonce: res.nonce,
      mobile: res.mobile as string,
    });
  }

  // 获得有新sid的user对象
  async corpGetNewUserWithNewSid(email: string, newSid: string): Promise<User | null | undefined> {
    try {
      const accountUser = await this.getAccountStored(email);
      if (!accountUser) {
        return null;
      }
      accountUser.sessionId = newSid;
      return accountUser;
    } catch (ex) {
      console.error('[login] corpReNewSidSucceed', ex);
      return null;
    }
  }

  private async clearCookies(shouldDeleteAllCookies = false): Promise<void> {
    try {
      if (this.systemApi.isElectron() && window.electronLib) {
        return window.electronLib.windowManage.clearLocalData('cookies');
      }
      return this.systemApi.clearUserAuthCookie(false, shouldDeleteAllCookies);
    } catch (ex) {
      console.error('clearCookies error', ex);
      return Promise.resolve();
    }
  }

  tryReportLoginSuccess(account: string): void {
    const logPrefix = '[login] report-error';
    try {
      this.requestReportSuccApi(account).catch(err => {
        console.error(logPrefix, err);
      });
    } catch (ex) {
      console.error(logPrefix, ex);
    }
  }

  async doCorpLogin(account: string, password: string, verifyCode?: string): Promise<LoginModelExt | LoginModel> {
    const { corpSid } = this.actions;

    const accountInfo = this.handleAccountAndDomain(account);
    const corpParams = await corpLoginUtils.getRequestParamsAsync({
      sid: corpSid,
      account: accountInfo.account,
      domain: accountInfo.domain,
      deviceId: defaultLoginInfo.deviceid,
    });
    const beforeLoginInfo = await this.getAccountStored(account);
    let reloginParams = {};
    if (beforeLoginInfo) {
      // 之前登录过，走信任设备登录
      reloginParams = corpLoginUtils.getReLoginParams(beforeLoginInfo);
    }

    const requestData = {
      ...(reloginParams || {}),
      ...defaultLoginInfo,
      ...corpParams,
      support_verify_code: 1, // 登录时需要验证码
      verify_code: verifyCode,
      password,
    };

    const loginUrl = this.getUrl('corpMailPwdLogin');

    return this.impl
      .post(loginUrl, requestData)
      .then(res => res.data)
      .then(res => {
        const resCodeStr = String(res?.code);
        if (resCodeStr === corpLoginUtils.CONSTANTS.CORP_API_SUCCESS_CODE) {
          this.storeCurrentAccount({
            account,
            pwd: corpLoginUtils.CONSTANTS.CORP_DEFAULT_PASSWORD,
          });
          return res!.data as LoginModel;
        }
        return {
          pass: false,
          err: true,
          errMsg: res?.msgCodeDesc,
          errCode: res?.msgCode,
        } as unknown as LoginModel;
      })
      .then(res => this.handleLoginResponse(res))
      .then(async rs => {
        if (rs.pass) {
          await this.corpLoginSucceed(rs.res, beforeLoginInfo);
        } else if (rs.errCode === 'ERR.SESSIONNULL') {
          // 会话失效，preLoginPassed设为false
          this.actions.preLoginPassed = false;
        }
        return rs;
      })
      .catch(err => {
        console.error('[login] doCorpLogin error:', err);
        return {
          errmsg: LoginApiImpl.commonCatch(err),
          pass: false,
        } as LoginModel;
      });
  }

  // 注意sameAccount参数用来区分是否为自动登录同一个账号
  async doLogin(params: LoginParams, retry?: number): Promise<LoginModel> {
    const { account, pwd, isAutoLogin, verifyCode, isUnLockApp = false, isSubAccount = false, sessionName, noEnableBackDb } = params;
    const dna = this.handleAccountAndDomain(account);
    if (!loginUtils.checkAccountAndDomain(dna)) {
      return {
        errmsg: loginUtils.getInputEmailErrorMsg(),
        pass: false,
      };
    }
    if (!isSubAccount && loginUtils.getIsCorpMailMode(this.actions.mailMode)) {
      // corpMail的登录模式，走doCorpLogin即可,corpMail登录需要验证码，无法支持自动登录
      return this.doCorpLogin(account, pwd, verifyCode);
    }
    let needPreLogin = false;
    if (!isSubAccount && !isAutoLogin) {
      needPreLogin = !this.actions.preLoginPassed;
    }
    if (needPreLogin) {
      const res = await this.doPreLogin(account);
      if (typeof res === 'object' && res.errmsg?.length) {
        return {
          errmsg: ErrMsgCodeMap['LOGIN.ILLEGAL.STATE'] + ':' + res.errmsg,
          pass: false,
        };
      }
    }
    // 不同账户第一次登录使用rsa登录，后续重登录使用md5登录，md5登录不需要额外调用prelogin，减少两个请求可以提高登录成功率
    const { pwd: password, type } = await this.getS({
      originPwd: pwd,
      originAccount: account,
      rsaEncrypt: !isAutoLogin,
      md5Encrypt: isAutoLogin,
      isSubAccount,
      email: account,
    });
    const pubid = (!isSubAccount ? this.actions.currentPreloginResponse : this.actions.currentSubAccountPreLoginResponse[account])?.pubid || '';
    const req = {
      ...defaultLoginInfo,
      passtype: PassWordTypeMap[type],
      account_name: dna.account as string,
      domain: dna.domain as string,
      password,
      pubid,
      isSubAccount,
    };
    if (type === 'rsa' && !pubid) {
      return {
        errmsg: ErrMsgCodeMap['PRELOGIN.ERR'],
        pass: false,
      };
    }
    this.storePwd(type === 'md5' ? password : pwd, PassWordTypeMap[type], isSubAccount, account);
    if (!isSubAccount) {
      this.actions.loginMethod = 'pass';
    } else {
      this.actions.subAccountLoginMethodMap[account] = 'pass';
    }
    if (!isSubAccount) {
      this.actions.currentWillLoginAccount = account;
    } else {
      this.actions.currentWillLoginSubAccount = account;
    }
    if (isUnLockApp) {
      // @ts-ignore
      req.sessionName = `memory-${new Date().getTime()}`;
    } else if (sessionName) {
      // @ts-ignore
      req.sessionName = sessionName;
    }
    try {
      const res = await this.login(req, retry || 1);
      const errorCode = res.msgCode || '';
      const IPERRORS = ['ERR.LOGINRULE.IPDENY', 'ERR.LOGIN.IPDENY'];
      let ipInfo = '';
      if (errorCode && IPERRORS.includes(errorCode)) {
        if (res && res.data && res.data.blockIp) {
          ipInfo = 'IP: ' + res.data.blockIp;
        }
      }
      if (isUnLockApp) {
        const data = res.data || {};
        if (res.msgCode) {
          data.errMsg = res.msgCode;
        }
        this.actions.preLoginPassed = false;
        return {
          pass: ['entry', 'mauth', 'eauth', '2fa', 'gauth', 'passchange', 'webmail'].includes(data.location),
          errmsg: LoginApiImpl.getErrMsg(data.errMsg),
        };
      }
      if (isSubAccount) {
        this.fillSubAccountInfo(res, account, false, sessionName);
      }
      if (res.data) {
        res.data.noEnableBackDb = !!noEnableBackDb;
      }
      const ret = await this.processLoginResult(res);
      if (ret?.pass && !isAutoLogin) {
        this.tryReportLoginSuccess(account);
      }
      if (!ret.pass && ret.errmsg && ipInfo) {
        ret.errmsg += ipInfo;
      }
      return ret;
    } catch (e) {
      if (e && typeof e === 'string' && e === 'NETWORK.ERR.TIMEOUT') {
        return {
          pass: false,
          timeout: true,
          errmsg: '请求超时',
        } as LoginModel;
      }
      return Promise.reject(e);
    }
    // return responseLoginDataPromise.then(
    //   rs => this.handleLoginResponse(rs),
    // ).then(
    //   rs => this.loginDoorEnter(rs),
    // ).then(rs => {
    //   result = rs;
    //   return rs;
    // }).catch(reason => {
    //   console.log('[login] login error:', reason);
    //   return {
    //     errmsg: LoginApiImpl.commonCatch(reason),
    //     pass: false,
    //   } as LoginModel;
    // })
    //   .finally(() => {
    //     if (!result || (
    //       !result.secondCheck && !result.showResetPass
    //     )) {
    //       this.actions.preLoginPassed = false;
    //       // this.actions.currentPreloginRequest = undefined;
    //       // this.actions.currentPreloginResponse = undefined;
    //     }
    //   });
  }

  async doMobileValidateAccountLogin(params: MobileLoginValidateMailParams) {
    const { account, password: originPwd, reg_code, reg_mobile, currentAccountNode } = params;
    const { account: account_name, domain } = this.handleAccountAndDomain(account);
    if (!account_name || !domain) {
      console.warn('input data illegal');
      return Promise.reject(ErrMsgCodeMap['ERR.LOGIN.ILLEGALINPUT']);
    }
    if (currentAccountNode && currentAccountNode !== this.storeApi.getCurrentNode()) {
      await this.doPreLogin(account);
    }
    const { pwd: password, type } = await this.getS({
      originAccount: account,
      originPwd,
      rsaEncrypt: true,
    });
    const pubid = this.actions.currentPreloginResponse?.pubid || '';
    return this.mobileLogin({
      reg_code,
      reg_mobile,
      unq_code: this.actions.unqCode,
      domain,
      account_name,
      password,
      pubid,
      passtype: PassWordTypeMap[type],
    });
  }

  async doMobileTokenLogin(params: MobileTokenLoginParams): Promise<LoginModel> {
    try {
      if (this.systemApi.getCurrentUser()) {
        await this.doLogout(true, true);
      }
      this.loggerApi.track('login_doMobileTokenLogin_request', params);
      params.autoEntry = true;
      const { data } = await this.impl.post(this.systemApi.getUrl('mobileTokenLogin'), { ...defaultPreLoginInfo, ...params });
      const { code, msgCode, data: res } = data || {};
      this.loggerApi.track('login_doMobileTokenLogin_return', res);
      console.log('[login web] doMobileTokenLogin', res, code);
      if (String(code) === '200' && res) {
        const { refreshToken, refreshTokenExpire } = res;
        const { account_name, domain } = params;
        this.storeCurrentAccount({
          account: account_name + '@' + domain,
          refreshToken,
          refreshTokenExpire,
          mobile: this.actions.currentPreloginRequest?.mobile,
        });
        console.log('[login_impl] doMobileTokenLogin', res);
        return this.loginDoorEnter({
          ...res,
          pass: true,
          res,
        });
      }
      return {
        pass: false,
        errmsg: LoginApiImpl.getErrMsg(msgCode),
        errCode: msgCode,
      };
    } catch (e) {
      console.error('[login_impl] doMobileTokenLogin error', e, 'params', params);
      return {
        pass: false,
        errmsg: LoginApiImpl.commonCatch(e),
      };
    }
  }

  async mobileLogin(params: MobileLoginParams): Promise<LoginModel> {
    let ret: LoginModel = { pass: false, errmsg: '' };
    try {
      this.loggerApi.track('login_doMobileValidateAccountLogin_mobileLoginActive', params);
      const { data } = await this.impl.post(this.systemApi.getUrl('mobileLoginActive'), {
        ...params,
        ...defaultLoginInfo,
      });
      const { code = '', data: res, msgCode } = data || {};
      if (String(code) === '200' && res) {
        const { token, account_name, domain } = res;
        ret = await this.doMobileTokenLogin({
          token,
          account_name,
          domain,
        });
      } else {
        console.error('[login_impl] mobileLogin error', data);
        this.refreshStatus();
        let errmsg = LoginApiImpl.getErrMsg(msgCode!);
        if (msgCode === 'ERR.SESSIONNULL') {
          errmsg = '您长时间未操作，请您返回登录页面重新登录';
        }
        ret = {
          ...ret,
          errmsg,
        };
      }
    } catch (e) {
      console.error('[login_impl] mobileLogin error', e);
      ret = {
        ...ret,
        errmsg: LoginApiImpl.commonCatch(e),
      };
    }
    return ret;
  }

  async getMobileLoginToken(params: Partial<MobileCodeLoginParams>): Promise<LoginCommonRes> {
    try {
      const { data } = await this.impl.post(this.systemApi.getUrl('getMobileLoginToken'), {
        ...params,
        ...defaultPreLoginInfo,
      });
      console.log('zzzzzzzzzh getMobileLoginToken', data);
      const { code = '', data: res, msgCode } = data || {};
      if (String(code) === '200' && res) {
        return {
          success: true,
          data: res,
        };
      }
      return {
        success: false,
        message: LoginApiImpl.getErrMsg(msgCode),
        code: msgCode,
      };
    } catch (e) {
      console.error('[login_impl] getMobileLoginToken error', e);
      return {
        success: false,
        message: LoginApiImpl.commonCatch(e),
      };
    }
  }

  async doMobileCodeLogin(params: MobileCodeLoginParams) {
    const { success, message, code, data } = await this.getMobileLoginToken(params);
    console.log('[login web] getMobileLoginToken', data, success);
    if (success) {
      const { token, account_name, domain } = data;
      return this.doMobileTokenLogin({
        token,
        account_name,
        domain,
      });
    }
    return {
      pass: false,
      errmsg: message,
      errCode: code,
    } as LoginModel;
  }

  async doMobileBindAccountLogin(params: MobileBindAccountLoginParams) {
    await this.doPreLogin(
      this.accountApi.doGetAccount({
        accountName: params.account_name,
        domain: params.domain,
      })
    );
    const { success, message, data } = await this.getMobileLoginToken({
      ...params,
      type: 1,
    });
    if (success) {
      const { token, account_name, domain } = data;
      return this.doMobileTokenLogin({
        token,
        account_name,
        domain,
      });
    }
    return {
      pass: false,
      errmsg: message,
    } as LoginModel;
  }

  async doUpdateRefreshToken(params: RefreshTokenLoginParams): Promise<LoginCommonRes> {
    this.loggerApi.track('login_checkRefreshToken_request', params);
    const { data } = await this.impl.post(this.systemApi.getUrl('refreshToken'), { ...defaultPreLoginInfo, ...params });
    const { code, msgCode, data: res } = data || {};
    this.loggerApi.track('login_checkRefreshToken_return', {
      code,
      msgCode,
      res,
    });
    if (String(code) === '200' && res) {
      const { token, expire } = res;
      await this.accountApi.doUpdateAccountList([
        {
          id: this.accountApi.doGetAccount({
            accountName: params.account_name,
            domain: params.domain,
          }),
          refreshToken: token,
          refreshTokenExpire: expire,
        },
      ]);
      return {
        success: true,
        data: {
          ...params,
          token,
        },
      };
    }
    return {
      success: false,
      message: LoginApiImpl.getErrMsg(msgCode),
    };
  }

  async doRefreshTokenLogin(params: RefreshTokenLoginParams) {
    try {
      const { isSubAccount, noEnableBackDb } = params;
      const email = this.accountApi.doGetAccount({
        accountName: params.account_name,
        domain: params.domain,
      });
      const sessionName = isSubAccount ? this.systemApi.getSessionNameOfSubAccount(email) : '';
      await this.doPreLogin(email, isSubAccount, sessionName);

      this.loggerApi.track('login_refreshTokenLogin_request', params);

      const currentNode = !isSubAccount ? undefined : this.actions.subAccountNodeMap[email] || defauleNode;
      let url = this.systemApi.getUrl('refreshTokenLogin', currentNode);
      if (process.env.BUILD_ISELECTRON && isSubAccount && sessionName) {
        const sessionInfo = this.getUseSessionInfo(sessionName, sessionName);
        url = this.impl.buildUrl(url, sessionInfo);
      }
      const req = { ...defaultPreLoginInfo, ...params };
      req.autoEntry = true;
      if (process.env.BUILD_ISWEB && isSubAccount) {
        this.fillAutoEntryAndNoCookieInfo(req);
      }
      const { data } = await this.impl.post(url, req);
      const { code, msgCode, data: res } = data || {};
      this.loggerApi.track('login_refreshTokenLogin_return', data);
      if (String(code) === '200' && res) {
        const { refreshToken, refreshTokenExpire, mobile } = res;
        const { account_name, domain } = params;
        const curAccount = account_name + '@' + domain;
        if (!isSubAccount) {
          this.actions.currentWillLoginAccount = curAccount;
        } else {
          this.actions.currentWillLoginSubAccount = curAccount;
        }
        this.storeCurrentAccount({
          account: curAccount,
          refreshToken,
          refreshTokenExpire,
          mobile: mobile || this.actions.currentPreloginRequest?.mobile,
          isSubAccount,
          email,
        });
        const currentUser = this.systemApi.getCurrentUser();
        let isSharedAccountSwitch = false;
        let originAccount;
        if (currentUser && currentUser.isSharedAccount) {
          isSharedAccountSwitch = true;
          originAccount = currentUser.originAccount?.email || '';
        }
        console.log('[login_impl] doRefreshTokenLogin', res);
        if (isSubAccount) {
          if (!res.data) {
            res.data = {};
          }
          res.isSubAccount = isSubAccount;
          res.agentEmail = email;
          this.fillSubAccountInfo(res, email, false, sessionName);
        }
        const doorParam = {
          ...res,
          pass: true,
          res: { originAccount, noEnableBackDb, isSharedAccountSwitch, ...res, ...(isSubAccount ? res.data || {} : {}) },
        };
        return this.loginDoorEnter(doorParam);
      }
      return {
        pass: false,
        errmsg: LoginApiImpl.getErrMsg(msgCode),
      };
    } catch (e) {
      console.error('[login_impl] doRefreshTokenLogin error', e, 'params', params);
      if (e && typeof e === 'string' && e === 'NETWORK.ERR.TIMEOUT') {
        this.loggerApi.track('login_refreshTokenLogin_request_timeout', {
          params,
        });
        return {
          pass: false,
          timeout: true,
          errmsg: '请求超时',
        } as LoginModel;
      }
      const errmsg = LoginApiImpl.commonCatch(e);
      this.loggerApi.track('login_refreshTokenLogin_request_failed', {
        params,
        error: errmsg,
      });
      return {
        pass: false,
        errmsg,
      };
    }
  }

  private storePwd(pwd: string, pwdType: LoginPasswordType = 1, isSubAccount?: boolean, email?: string) {
    let password = pwd;
    if (pwdType !== 2) {
      if (this.testPwdStyleIsNew(password)) {
        const newPwd = password.replace(this.encryptedPwdHead, '').replace(this.encryptedPwdTail, '');
        password = this.systemApi.decryptByKey(newPwd, this.storeApi.getUUID());
      }
      password = this.systemApi.md5(pwd);
    }
    this.storeCurrentAccount({
      pwd: password,
      isSubAccount,
      email,
    });
  }

  private storeCurrentAccount(params: {
    account?: string;
    pwd?: string;
    refreshToken?: string;
    refreshTokenExpire?: number;
    mobile?: string;
    isSubAccount?: boolean;
    email?: string;
  }) {
    const isSubAccount = !!params.isSubAccount;
    const email = params.email || '';
    if (isSubAccount && email) {
      if (!this.actions.currentSubAccount[email]) {
        this.actions.currentSubAccount[email] = {} as accountType;
      }
    }
    const { a, k, tExpire, t, mobile: m, lastLogin = Date.now() } = (!isSubAccount ? this.actions.currentAccount : this.actions.currentSubAccount[email]) || {};
    const { account = a, refreshToken = t, mobile = m, refreshTokenExpire = tExpire, pwd = k } = params;
    const newInfo = {
      a: account || '',
      t: refreshToken,
      k: pwd,
      mobile,
      tExpire: refreshTokenExpire,
      lastLogin,
    };
    if (!isSubAccount) {
      this.actions.currentAccount = newInfo;
    } else {
      this.actions.currentSubAccount[email] = newInfo;
    }
  }

  private storeCurrentSubAccount(params: { account?: string; pwd?: string; refreshToken?: string; refreshTokenExpire?: number; mobile?: string }) {
    const subAccountEmail = (params && params.account) || '';
    if (!subAccountEmail) {
      return;
    }
    if (!this.actions.currentSubAccount) {
      this.actions.currentSubAccount = {};
    }
    const { a, k, tExpire, t, mobile: m, lastLogin = Date.now() } = this.actions.currentSubAccount[subAccountEmail] || {};
    const { account = a, refreshToken = t, mobile = m, refreshTokenExpire = tExpire, pwd = k } = params;
    this.actions.currentSubAccount[subAccountEmail] = {
      a: account || '',
      t: refreshToken,
      k: pwd,
      mobile,
      tExpire: refreshTokenExpire,
      lastLogin,
    };
  }

  async login(req: RequestLoginData, retry: number): Promise<ResponseData<any>> {
    retry = retry === undefined ? 2 : retry;
    try {
      const hash = decodeURIComponent(window.location.hash);
      const matchArr = hash.match(this.changeHashUrl);
      const len = matchArr?.length || 0;
      const _from = len > 1 ? matchArr![1] : 'login';
      let urlParam = { _from };
      if (req.sessionName && req.sessionName.length) {
        const sessionInfo = this.getUseSessionInfo(req.sessionName, req.sessionName);
        urlParam = Object.assign(urlParam, sessionInfo);
      }
      const isSubAccount = !!req.isSubAccount;
      req.autoEntry = true;
      if (isSubAccount && process.env.BUILD_ISWEB) {
        this.fillAutoEntryAndNoCookieInfo(req);
      }

      const response = await this.impl.post(this.impl.buildUrl(this.getUrl('login', isSubAccount ? `${req.account_name}@${req.domain}` : undefined), urlParam), req, {});
      // debugger
      const data = this.unpackLoginData(response);
      return data;
      // return LoginApiImpl.processLogin(data);
    } catch (error) {
      if (error && typeof error === 'string' && error === 'NETWORK.ERR.TIMEOUT') {
        if (retry > 0) {
          await wait(1500 * (3 - retry) + 500);
          return this.login(req, retry - 1);
        }
      }
      return Promise.reject(error);
    }
  }

  private static processLogin(data: ResponseData) {
    const content = data.data || {};
    if (data.msgCode) {
      content.errMsg = data.msgCode;
    }
    return content as ResponseLoginData;
  }

  private loginDoorEnter(res: LoginModelExt) {
    if (res.pass) {
      const {
        nickname,
        uid,
        sid,
        coremail,
        orgName,
        cookieName,
        isSharedAccountSwitch,
        noEnableBackDb,
        sessionName,
        isSubAccount,
        isThirdAccount,
        agentEmail,
        token,
        sess,
      } = res.res;
      if (agentEmail) {
        let cooikeInfo = this.actions.bindSubAccountCookieMapInfo[agentEmail];
        if (!cooikeInfo) {
          cooikeInfo = this.actions.bindSubAccountCookieMapInfo[agentEmail] = {};
        }
        const uidStr = uid || '';
        cooikeInfo.qiye_uid = uidStr;
        cooikeInfo['qiye-uid'] = uidStr;
        const qiyeTokenStr = token || '';
        cooikeInfo.qiye_token = qiyeTokenStr;
        cooikeInfo['qiye-token'] = qiyeTokenStr;
        cooikeInfo.coremail = coremail || '';
        cooikeInfo['qiye-sess'] = sess || '';
      }
      return this.loginSucceed({
        noEnableBackDb,
        isSharedAccountSwitch,
        uid: uid!,
        nickname,
        cookieName: sid,
        orgName,
        cnName: cookieName,
        sessionName,
        isSubAccount,
        isThirdAccount,
        agentEmail,
      })
        .then(_ => {
          res.uid = uid;
          return res;
        })
        .catch(err => {
          console.error(err);
          return {
            pass: false,
            errmsg: err && err.message ? err.message : '登录错误',
          } as LoginModel;
        });
    }
    return res;
  }

  requestDoorApi(res: LoginModelExt): Promise<LoginModel> {
    const { nickname, uid, orgName, cookieName, isSharedAccountSwitch, originAccount, noEnableBackDb, sessionName, isSubAccount, isThirdAccount, agentEmail } = res.res;
    const req = defaultLoginDoor;
    const uid1 = uid || '';
    res.uid = uid;
    req.uid = uid1;
    if (isSharedAccountSwitch) {
      if (originAccount) {
        req.origin = originAccount;
      } else {
        const currentUser = this.systemApi.getCurrentUser();
        if (currentUser) {
          req.origin = currentUser.id;
        }
      }
    }

    const urlKey = 'loginDoor';
    let url;
    if (sessionName && sessionName.length) {
      const sessionInfo = this.getUseSessionInfo(sessionName, sessionName);
      url = this.impl.buildUrl(this.getUrl(urlKey, agentEmail), sessionInfo);
    } else {
      url = this.getUrl(urlKey);
    }
    return this.impl
      .get(url, req, noHeaderTokenConfig)
      .then(this.unpackLoginData.bind(this))
      .then(async r => {
        if (String(r.code) === '200') {
          const { sid } = r.data;
          await this.loginSucceed({
            noEnableBackDb,
            isSharedAccountSwitch,
            uid: uid1,
            nickname,
            cookieName: sid,
            orgName,
            cnName: cookieName,
            sessionName,
            isSubAccount,
            isThirdAccount,
            agentEmail,
          });
          return res;
        }
        return {
          errmsg: LoginApiImpl.getErrMsg(r.msgCode),
          pass: false,
        } as LoginModel;
      })
      .catch(reason => {
        console.log('[login] door api error', reason);
        return {
          errmsg: LoginApiImpl.commonCatch(reason),
          pass: false,
        } as LoginModel;
      });
  }

  private handleLoginResponse(res: ResponseLoginData): LoginModelExt {
    this.loggerApi.track('login_network_return', res);
    console.log('[login] login_network_return:' + JSON.stringify(res));
    const {
      pass,
      location,
      errMsg,
      mobile,
      eauthEmail,
      uid,
      refreshToken,
      refreshTokenExpire,
      isSharedAccountSwitch,
      noEnableBackDb,
      isSubAccount,
      isThirdAccount,
      agentEmail,
      sessionName,
    } = res;
    // uid为email全称
    if (!isSubAccount && uid && this.actions.currentPreloginRequest) {
      const accounts = this.systemApi.handleAccountAndDomain(uid);
      this.actions.currentPreloginRequest.account_name = accounts.account as string;
      this.actions.currentPreloginRequest.domain = accounts.domain as string;
    }
    if (location === 'webmail' && pass) {
      const accountInfo = {
        account: uid,
        refreshToken,
        refreshTokenExpire,
      };
      if (!isSubAccount) {
        this.storeCurrentAccount(accountInfo);
      } else {
        this.storeCurrentSubAccount(accountInfo);
      }
      return {
        errmsg: errMsg || '',
        pass: true,
        res,
        isSharedAccountSwitch,
        noEnableBackDb,
        isSubAccount,
        isThirdAccount,
        agentEmail,
        sessionName,
      } as LoginModelExt;
    }
    if (!isSubAccount && this.actions.loginMethod === 'code') {
      this.actions.codeRetryTime += 1;
    }
    this.dataTrackApi.track('login_not_pass_occurred', { location });
    // 需要短信二次验证
    if (location === 'mauth') {
      return {
        errmsg: '',
        secondCheck: true,
        checkType: 'mobile',
        mobile,
        showConfig: false,
        pass: false,
        res,
      } as LoginModelExt;
    }
    // 需要邮箱二次验证
    if (location === 'eauth') {
      return {
        errmsg: '',
        secondCheck: true,
        checkType: 'mail',
        eauthEmail,
        showConfig: false,
        pass: false,
        res,
      } as LoginModelExt;
    }
    if (location === 'spamauto' || location === 'spamapply') {
      const typeMap = {
        spamauto: 'auto',
        spamapply: 'apply',
      };
      return {
        errmsg: '',
        secondCheck: false,
        pass: false,
        mobile,
        spamLock: true,
        spamType: typeMap[location],
        res,
      } as LoginModelExt;
    }
    if (location === '2fa') {
      return {
        errmsg: '',
        secondCheck: true,
        showConfig: true,
        pass: false,
        res,
      } as LoginModelExt;
    }
    if (location === 'gauth') {
      return {
        errmsg: '暂不支持将军令登录',
        pass: false,
        res,
      } as LoginModelExt;
    }
    if (location === 'passchange') {
      return {
        errmsg: '',
        showResetPass: true,
        pass: false,
        res,
      } as LoginModelExt;
    }
    const msg = LoginApiImpl.getErrMsg(errMsg);
    return {
      errmsg: msg,
      pass: false,
      errCode: res.errCode,
      res,
    } as LoginModelExt;
  }

  private getIsAddAccountPage() {
    return this.systemApi.getIsAddAccountPage() || this.systemApi.getIsAddSubAccountPage() || this.systemApi.getIsAddPersonalSubAccountPage();
  }

  private addSubAccountsToDataStore(emailInfo: ISubAccountEmailOnlyInfo) {
    this.storeApi.addSubAccountToList(emailInfo);
  }

  private getSessionNameOfSubAccount(subAccount: string, mainAccount: string) {
    return `persist:${mainAccount}-${subAccount}`;
  }

  private async loginSucceed(data: LoginSucceedRes) {
    const { uid, isSharedAccountSwitch = false, isCorpMail = false, noEnableBackDb = false, isSubAccount = false, sessionName = '', agentEmail = '' } = data;
    if (!isSubAccount) {
      this.impl.setLogoutStatus(false);
    } else {
      this.impl.setSubAccountLogoutStatus(uid, false);
    }
    // 获取登录邮箱在db的存储数据
    const storeCurrentUser = await this.getAccountStored(uid, isSubAccount);
    // 设置登录的cookie;
    const cookies = await this.setLoginSucceedCookie(sessionName, isSubAccount, agentEmail);
    // 构建登录成功的user
    const user = this.setLoginSucceedUser({ storeCurrentUser, data, cookies });
    if (process.env.BUILD_ISELECTRON && isSubAccount && sessionName && cookies && cookies.length) {
      const subAccountSessionName = this.getSessionNameOfSubAccount(uid, user.mainAccount || '');
      await window.electronLib.appManage.setCookieStore(cookies, subAccountSessionName);
    }
    if (isSubAccount) {
      this.addSubAccountsToDataStore({ email: uid, agentEmail: user.agentEmail || uid });
      if (user.node) {
        this.setupNodeInfo(user.node, true, uid);
      }
    }
    // 将构建成功的user存入localStorage
    await this.storeApi.setLastAccount(user, isSubAccount ? uid : '');
    console.log('[login] login account stored ', user);
    // 发送登录成功事件
    if (!isSubAccount) {
      await this.sendLoginEvent(user).catch(err => {
        this.loggerApi.track('login_sendLoginEvent_error', err);
      });
    }
    // 获取权限数据存到本地
    if (!isSubAccount) {
      await this.productAuthApi.saveAuthConfigFromNet();
    }
    // 设置登录成功的内部状态
    this.setLoginSucceedAccountStatus(isSubAccount ? uid : '');
    // 发送account初始化成功消息
    if (!isSubAccount) {
      this.eventApi.sendSysEvent({
        eventName: 'initModule',
        eventStrData: 'account',
      });
    }
    // 处理登录成功（数据后台,子账号，iframe）的状态
    await this.handleLoginSucceedBgAccount({ isSharedAccountSwitch, user, noEnableBackDb });
    // 绑定设备信息
    if (!isCorpMail) {
      this.bindAccountDevice()
        .then()
        .catch(ex => {
          console.warn('[login] bind account ', ex);
        });
    }
    this.mailConfApi.reqMailLimit({ _account: uid });
    // 打点
    this.systemApi.getActiveUserTrackParams(isSharedAccountSwitch).then(params => {
      console.log('zzzzzzh4');
      this.dataTrackApi.track('pc_dailyActiveUser', {
        type: 'loginResult',
        ...(params || {}),
      });
    });
    // 外贸主账号调用接口，上报首次登录
    if (process.env.BUILD_ISEDM && !isSubAccount) {
      const rs: StoreData = await this.storeApi.get(LoginApiImpl.edmLoginReportKey);
      if (!rs.suc || !rs.data) {
        await this.storeApi.put(LoginApiImpl.edmLoginReportKey, LoginApiImpl.edmLoginReportKeyFlag);
      }
    }
  }

  // 外贸主账号调用接口，上报首次登录
  async reportEdmLogin(): Promise<void> {
    setTimeout(() => {
      this.storeApi.get(LoginApiImpl.edmLoginReportKey).then(rs => {
        if (rs.suc && rs.data === LoginApiImpl.edmLoginReportKeyFlag) {
          const url = this.systemApi.getUrl('edmLoginReport');
          this.impl
            .post(url)
            .then((res: ApiResponse<string>) => {
              const resData = res.data;
              if (resData?.code === 0 && resData?.data) {
                this.storeApi.put(LoginApiImpl.edmLoginReportKey, Date.now() + '');
              } else {
                console.error('edm login report error code !== 0');
              }
            })
            .catch(e => {
              console.error('edm login report error', e);
            });
        }
      });
    }, 5000);
  }

  private setOriginAccount(params: { isSharedAccountSwitch?: boolean; originAccountEmail?: string }) {
    const { isSharedAccountSwitch, originAccountEmail } = params;
    const currentUser = this.systemApi.getCurrentUser();
    let originAccount: { email: string; nickName: string; avatar: string } | undefined;
    if (isSharedAccountSwitch && originAccountEmail) {
      if (!currentUser || currentUser.id === originAccountEmail) {
        const emailInfo = this.handleAccountAndDomain(originAccountEmail);
        originAccount = {
          email: originAccountEmail,
          nickName: emailInfo.account,
          avatar: '',
        };
      } else {
        originAccount = {
          email: originAccountEmail,
          nickName: currentUser?.nickName,
          avatar: currentUser?.avatar,
        };
      }
    } else if (isSharedAccountSwitch && currentUser) {
      if (!currentUser.originAccount) {
        originAccount = { email: currentUser.id || '', nickName: currentUser.nickName || '', avatar: currentUser.avatar || '' };
      } else {
        originAccount = currentUser.originAccount;
      }
    }
    return originAccount;
  }

  private setLoginSucceedUser(params: { data: LoginSucceedRes; storeCurrentUser: AccountTable | undefined; cookies?: CookieStore[] }) {
    const { data, storeCurrentUser, cookies } = params;
    const {
      uid,
      nickname = '',
      cookieName = '',
      orgName = '',
      cnName,
      accessToken = '',
      accessSecret = '',
      isCorpMail = false,
      nonce = '',
      mobile = '',
      isSharedAccountSwitch = false,
      originAccountEmail = '',
      isSubAccount = false,
      isThirdAccount = false,
      agentEmail = '',
    } = data;
    const accountMd5 = this.systemApi.md5(uid || '__', true);
    const {
      mobile: m,
      t,
      tExpire,
      a,
    } = ((isSubAccount ? (!this.actions.currentSubAccount ? {} : this.actions.currentSubAccount[uid]) : this.actions.currentAccount) || {}) as accountType;
    const originAccount = this.setOriginAccount({ isSharedAccountSwitch, originAccountEmail });
    const { account: accountName, domain } = uid ? this.handleAccountAndDomain(uid) : ({} as EmailAccountDomainInfo);
    const currentUser = isSubAccount ? this.systemApi.getCurrentUser() : undefined;
    const mainAccountEmail = currentUser && currentUser.id ? currentUser.id : '';
    const user: User = {
      nickName: nickname,
      avatar: storeCurrentUser?.avatar || '',
      contact: storeCurrentUser?.contact,
      lastLoginTime: Date.now(),
      sessionId: cookieName,
      id: uid,
      loginAccount: isSubAccount ? agentEmail : this.actions.currentWillLoginAccount,
      domain,
      accountName,
      accountMd5,
      cookies,
      node: isSubAccount && !isThirdAccount ? this.actions.subAccountNodeMap[agentEmail] || this.actions.currentNode : this.actions.currentNode,
      mobile: isCorpMail ? mobile : m,
      refreshToken: t,
      refreshTokenExpire: tExpire,
      company: orgName,
      isSharedAccount: isSharedAccountSwitch,
      originAccount,
      cnName,
      prop: {
        company: orgName,
        // corpMail新增的属性
        mailMode: isCorpMail ? loginUtils.getCorpMailModeVal() : loginUtils.getHMailModeVal(),
        accessToken,
        accessSecret,
        nonce,
      },
      isSubAccount,
      isThirdAccount,
      agentEmail: isSubAccount && !isThirdAccount ? uid : agentEmail,
      mainAccount: mainAccountEmail,
      mainAccountEmail,
    };
    if (a !== user.id) {
      user.bmId = a;
    }
    return user;
  }

  private async setLoginSucceedCookie(sessionNameParam?: string, isSubAccount?: boolean, agentEmail?: string) {
    let cookies: CookieStore[] | undefined;
    const asyncCookie = async (retry: number) => {
      if (process.env.BUILD_ISELECTRON) {
        try {
          const isAddAccountPage = this.getIsAddAccountPage();
          const isBkLoginPage = this.systemApi.isBkLoginInit();
          if (isAddAccountPage || isBkLoginPage || (sessionNameParam && sessionNameParam.length)) {
            const sessionName = sessionNameParam || this.systemApi.getCurrentSessionName();
            if (sessionName && sessionName.length) {
              cookies = await window.electronLib.appManage.getSessionCookieStore({
                sessionName,
              });
            }
          } else {
            cookies = await window.electronLib.appManage.getCookieStore();
          }
        } catch (e) {
          console.warn(e);
          if (retry > 0) {
            await asyncCookie(retry - 1);
          }
        }
      }
      if (process.env.BUILD_ISWEB && isSubAccount && agentEmail) {
        cookies = [];
        const cookieInfo = this.actions.bindSubAccountCookieMapInfo[agentEmail];
        if (cookieInfo) {
          return Object.keys(cookieInfo).forEach(currKey => {
            cookies!.push({
              name: currKey,
              value: cookieInfo[currKey],
              sameSite: 'no_restriction',
            });
          });
        }
      }
    };
    await asyncCookie(2);
    return cookies;
  }

  private setLoginSucceedAccountStatus(emailParam?: string) {
    if (!emailParam) {
      this.actions.logout = false;
      this.noLoginStatus = false;
      this.logoutProcessing = false;
    } else {
      this.actions.subAccountLogoutMap[emailParam] = false;
      this.subAccountNoLoginStatusMap[emailParam] = false;
      this.subAccountLogoutProcessingMap[emailParam] = false;
    }
  }

  private async handleLoginSucceedBgAccount(params: { user: User; isSharedAccountSwitch?: boolean; noEnableBackDb?: boolean }) {
    // TODO: 修改当存储到第20个的时候需要删除lastLoginTime最后一个
    const { user, isSharedAccountSwitch, noEnableBackDb } = params;
    const isBkLoginPage = this.systemApi.isBkLoginInit();
    const isAddAccountPage = this.getIsAddAccountPage();
    if (user.isSubAccount) {
      user.mainAccount = user.mainAccountEmail;
    }
    const isSubAccount = !!user.isSubAccount;
    const isMainAccount = !isAddAccountPage && !isSubAccount && !isBkLoginPage;
    // 登录成功后不用再次初始化账号
    if (!noEnableBackDb && isMainAccount && process.env.BUILD_ISELECTRON) {
      await window.electronLib.storeManage.set('app', 'initAccount', 'true');
      await this.createBKStableWindow();
      this.enableBackgroundDB();
    }

    if (!isSharedAccountSwitch) {
      await this.accountApi.doSaveCurrentAccount({
        ...user,
        expired: false,
        pwd: isSubAccount && this.actions.currentSubAccount ? this.actions.currentSubAccount[user.agentEmail || '']?.k : this.actions.currentAccount?.k,
      });
    }

    if (!noEnableBackDb && isMainAccount && !this.systemApi.isElectron() && window?.bridgeApi?.master) {
      this.enableBackgroundDB();
      window.bridgeApi.master.createSubPageInWeb();
    }

    if (isSubAccount && !isAddAccountPage) {
      this.eventApi.sendSysEvent({
        eventName: 'subAccountDBChanged',
      });
    }
  }

  public async createBKStableWindow(force?: boolean) {
    if (!force) {
      const isLowMemoryMode = this.systemApi.getIsLowMemoryModeSync();
      if (isLowMemoryMode) {
        return Promise.resolve();
      }
    }
    return window.electronLib.windowManage
      .createWindow({ type: 'bkStable', manualShow: true })
      .then(res => {
        console.log('!!! -- build app init window success -- !!!');
        return res;
      })
      .catch(err => {
        this.loggerApi.track('login_createBKStableWindow_error', err);
      });
  }

  private async sendLoginEvent(user: User | undefined, timeout?: boolean) {
    const isAddAccountPage = this.getIsAddAccountPage();
    if (isAddAccountPage || this.systemApi.isBkLoginInit() || this.noLoginEvent) {
      return Promise.resolve('');
    }
    const event = {
      eventName: 'login',
      eventData: user,
      eventSeq: 0,
      eventStrData: timeout ? 'timeout_event' : 'event',
    } as SystemEvent;
    // this.systemApi.watchLogin(event);
    try {
      const sendSysEvent = this.eventApi.sendSysEvent(event) || Promise.resolve('');
      // if (sendSysEvent) {
      const ret = await sendSysEvent;
      // }
      // if (!noCross && this.systemApi.isElectron() && window.electronLib && user) {
      //   const crossEvent = {
      //     eventName: 'loginCrossWindow',
      //     eventData: user,
      //     eventSeq: 0,
      //     eventStrData: 'event',
      //   } as SystemEvent;
      //   const sendEventCross = this.eventApi.sendSysEvent(crossEvent) || Promise.resolve('');
      //   // if (sendEventCross) {
      //   await sendEventCross;
      //   // }
      // }
      return ret;
    } catch (e) {
      return '';
    }
  }

  /**
   * 密码处理函数
   */
  private async getS(params: LoginEncryptParams): Promise<LoginEncryptRes> {
    const { originPwd, originAccount, rsaEncrypt, md5Encrypt, isSubAccount, email } = params;
    // 获取当前帐户信息
    if (!originAccount) {
      throw new Error('无法找到账户信息');
    }
    // 如未提供密码，获取密码
    if (originPwd === LoginApiImpl.accountPwdAutoFilled) {
      const storedAccount = !isSubAccount ? await this.getAccountStored(originAccount) : await this.getAccountStored(originAccount, isSubAccount);
      const pwd = storedAccount?.pwd;
      if (!pwd) {
        throw new Error('无法获取用户密码');
      }
      console.log('[login] got password for ' + account, pwd);
      return { pwd, type: 'md5' };
    }
    let decryptPwd = originPwd;
    // 解密密码
    if (this.testPwdStyleIsNew(originPwd)) {
      const newPwd = originPwd.replace(this.encryptedPwdHead, '').replace(this.encryptedPwdTail, '');
      decryptPwd = this.systemApi.decryptByKey(newPwd, this.storeApi.getUUID());
      if (environment === 'dev' || environment === 'test' || environment === 'local') {
        console.log('[login] got real pwd ' + decryptPwd);
      }
    }
    // 按需要返回加密密码
    if (rsaEncrypt) {
      const emailRsaInfo =
        (!isSubAccount ? this.actions.currentPreloginResponse : this.actions.currentSubAccountPreLoginResponse[email || '']) || ({} as ResponsePreLoginData);
      const m = emailRsaInfo.modulus || '';
      const e = emailRsaInfo.exponent || '';
      const rand = emailRsaInfo.rand || '';
      return {
        pwd: this.systemApi.rsaEncrypt(m, e, rand, decryptPwd),
        type: 'rsa',
      };
    }
    if (md5Encrypt) {
      return { pwd: this.systemApi.md5(decryptPwd, false), type: 'md5' };
    }
    return { pwd: decryptPwd, type: 'plain' };
  }

  private testPwdStyleIsNew(pwd: string) {
    return pwd ? pwd.startsWith(this.encryptedPwdHead) && pwd.endsWith(this.encryptedPwdTail) : undefined;
  }

  doOpenForgetPwdUrl(isCorpMail?: boolean, email?: string): commonMessageReturn {
    let url = externalJumpUrls.forgetPwd;
    if (isCorpMail && email) {
      const dna = this.handleAccountAndDomain(email as string);
      const isNeteaseDoamin = corpLoginUtils.getIsNeteaseDomain(dna.domain);
      // netease的域的特殊逻辑
      if (isNeteaseDoamin) {
        url = corpLoginUtils.CONSTANTS.NETEASE_RESET_PWD_URL;
      }
    }
    const webMailHParam = this.systemApi.getWebMailLangStr();
    const urlWithLang = url && url.indexOf('?') ? url.replace('?', `?hl=${webMailHParam}&`) : url;
    this.systemApi.openNewWindow(urlWithLang);
    return '';
  }

  doOpenPromptPage(): commonMessageReturn {
    // console.log('open window:', externalJumpUrls.prompt);
    this.systemApi.openNewWindow(externalJumpUrls.prompt);
    return '';
  }

  async doLoadDataAndAutoLogin(loginInfoKey: string): Promise<LoginModel> {
    if (this.systemApi.getCurrentUser()) {
      await this.doLogout(true, false);
    }
    return this.storeApi
      .get(loginInfoKey, { prefix: 'lg-', noneUserRelated: true })
      .then(rs => {
        if (rs && rs.suc && rs.data) {
          const content = this.systemApi.decryptByKey(rs.data, loginInfoKey);
          const data = JSON.parse(content) as StoredAccount;
          return data;
        }
        return undefined;
      })
      .then(rs => {
        if (rs) {
          return rs;
        }
        const url = this.systemApi.getUrl('getData');
        return this.impl.get(url).then((res: ApiResponse<string>) => {
          if (res.data && res.data.success) {
            const dt = res.data.data;
            if (dt) {
              const content = this.systemApi.decryptByKey(dt, loginInfoKey);
              const data = JSON.parse(content) as StoredAccount;
              return data;
            }
          }
          return Promise.reject(new Error('未取得必要登录数据'));
        });
      })
      .then(({ account_name, password }) =>
        this.doLogin({
          account: account_name,
          pwd: password,
        })
      );
  }

  doOpenConfigPage(): commonMessageReturn {
    this.systemApi.openNewWindow(externalJumpUrls.bindNewPwd);
    return '';
  }

  private getIsLingxiWeb() {
    if (!inWindow()) return false;
    if (window && window.electronLib) return false;
    const isWebMail = profile && profile.startsWith('webmail');
    if (isWebMail) return false;
    return true;
  }

  sendVerifyCode(req: RequestPreLoginData, sessionName?: string): Promise<string> {
    // 发送邮件和预登录的type不一样：预登录的type 0邮箱 1手机号。 发送验证码的type: 0图形码 1验证码 2注册用的验证码
    const isLingXiWeb = this.getIsLingxiWeb();
    if (isLingXiWeb) {
      req.p = 'sirius';
    }
    let isSubAccount = false;
    if (sessionName) {
      isSubAccount = true;
      const sessionInfo = this.getUseSessionInfo(sessionName, sessionName);
      req = Object.assign(req, sessionInfo);
      req.sendCodeType = 0;
    }
    const url = this.impl.buildUrl(this.getUrl('sendCode', isSubAccount ? req.account : undefined), {
      ...req,
      type: req.sendCodeType,
    });
    return this.impl
      .get(url, {}, {})
      .then(this.unpackLoginData.bind(this))
      .then(({ code, msgCode }: ResponseData) => {
        if (String(code) === '200') {
          return '';
        }
        return msgCode === 'ERR.LOGIN.MLOGINSMSREQ' && req.sendCodeType === 2
          ? '今日此手机验证码获取次数已达到10次上限'
          : LoginApiImpl.getErrMsg(msgCode) || '发送失败，请重试';
      })
      .catch(reason => {
        console.warn(reason);
        return '发送失败，请重试';
      });
  }

  sendVerifyMail(req: RequestPreLoginData): Promise<string> {
    console.log('[login] sendVerifyMail', req);
    const url = this.impl.buildUrl(this.getUrl('emailSendCode'), { ...req });
    return this.impl
      .get(url, {}, {})
      .then(this.unpackLoginData.bind(this))
      .then(({ code, msgCode }: ResponseData) => {
        if (String(code) === '200') {
          return '';
        }
        return LoginApiImpl.getErrMsg(msgCode) || '发送失败，请重试';
      })
      .catch(reason => {
        console.warn(reason);
        return '发送失败，请重试';
      });
  }

  private async doCorpSendMobileCode(): Promise<string> {
    const { corpSid, currentPreloginRequest } = this.actions;
    const account = currentPreloginRequest?.account_name as string;
    const domain = currentPreloginRequest?.domain as string;
    const corpParams = await corpLoginUtils.getRequestParamsAsync({
      sid: corpSid,
      account,
      domain,
      deviceId: defaultLoginInfo.deviceid,
    });
    const requestData = { ...defaultLoginInfo, ...corpParams };
    const defaultErrMsg = '发送失败，请重试';

    const corpSendPhoneCodeUrl = this.getUrl('coreMailSendPhoneCode');
    return this.impl
      .post(corpSendPhoneCodeUrl, requestData)
      .then(res => res.data)
      .then(res => {
        if (typeof res === 'object' && String(res.code) === corpLoginUtils.CONSTANTS.CORP_API_SUCCESS_CODE) {
          return '';
        }
        return LoginApiImpl.getErrMsg(res?.msgCode, defaultErrMsg);
      })
      .catch(err => {
        console.error('[login] doCorpSendMobileCode error', err);
        return defaultErrMsg;
      });
  }

  async doMobileVerifyCode(verifyCode: string, isRegister?: boolean): Promise<LoginCommonRes<MobileAccountInfo[]>> {
    try {
      const url = this.impl.buildUrl(this.getUrl('mobileVerifyCode'), {
        code: verifyCode,
        p: productCode,
      });
      const res = await this.impl.post(url);
      const { code = '', msgCode, data } = this.unpackLoginData(res);
      if (code.toString() === '200') {
        const { accounts, unq_code } = data;
        this.actions.unqCode = unq_code;
        return {
          success: true,
          data: this.accountApi.doTransMobileBindAccountList(accounts),
        };
      }
      console.error('[login_impl] doMobileVerifyCode error', res);
      let message = LoginApiImpl.getErrMsg(msgCode);
      if (code === 500) {
        if (msgCode === 'ERR. LOGIN. MLOGINSMSREO') {
          message = isRegister ? '当天已发送已发送10次' : '当天已发送已发送20次';
        } else if (msgCode === 'ERR.SESSIONNULL') {
          message = '验证码已失效，请重新获取验证码';
        }
      }
      return {
        success: false,
        message,
        code: code.toString(),
      };
    } catch (e) {
      console.error('[login_impl] doMobileVerifyCode error', e);
      return {
        success: false,
        message: LoginApiImpl.commonCatch(e),
      };
    }
  }

  doSendVerifyCode(email?: string, sessionName?: string): Promise<string> {
    if (!email && this.actions.preLoginPassed && this.actions.currentPreloginRequest) {
      this.actions.codeRetryTime = 0;
      // corp走corp的发送验证码的逻辑
      if (this.actions.currentPreloginRequest.type !== 1 && loginUtils.getIsCorpMailMode(this.actions.mailMode)) {
        return this.doCorpSendMobileCode();
      }
      return this.sendVerifyCode(this.actions.currentPreloginRequest).catch(LoginApiImpl.commonCatch);
    }
    if (email) {
      return this.sendVerifyCode(this.actions.subAccountCurrentPreLoginRequestMap[email]!, sessionName).catch(LoginApiImpl.commonCatch);
    }
    return Promise.resolve(ErrMsgCodeMap['ERR.ILLEGAL']);
  }

  doSendVerifyMail(): Promise<string> {
    if (this.actions.preLoginPassed && this.actions.currentPreloginRequest) {
      return this.sendVerifyMail(this.actions.currentPreloginRequest).catch(LoginApiImpl.commonCatch);
    }
    return Promise.resolve(ErrMsgCodeMap['ERR.ILLEGAL']);
  }

  loginWithCode(req: RequestMobileLoginData): Promise<ResponseData<any>> {
    let url = '';
    const { isSubAccount } = req;
    req.autoEntry = true;
    if (isSubAccount) {
      if (process.env.BUILD_ISELECTRON && req && req.email && req.sessionName) {
        const sessionInfo = this.getUseSessionInfo(req.sessionName, req.sessionName);
        url = this.impl.buildUrl(this.getUrl('mobileLogin', req.email), sessionInfo);
      }
      if (process.env.BUILD_ISWEB) {
        url = this.getUrl('mobileLogin', req.email!);
        this.fillAutoEntryAndNoCookieInfo(req);
      }
    } else {
      url = this.getUrl('mobileLogin');
    }
    return this.impl.post(url, req, {}).then(this.unpackLoginData.bind(this));
  }

  loginWithMail(req: RequestMobileLoginData): Promise<ResponseData<any>> {
    let url = '';
    req.autoEntry = true;
    url = this.getUrl('emailLogin');
    return this.impl.post(url, req, {}).then(this.unpackLoginData.bind(this));
  }

  //
  async doCorpLoginWithCode(phoneCode: string): Promise<LoginModel | LoginModelExt> {
    const { corpSid, currentPreloginRequest } = this.actions;
    const account = currentPreloginRequest?.account_name as string;
    const domain = currentPreloginRequest?.domain as string;
    const corpParams = await corpLoginUtils.getRequestParamsAsync({
      sid: corpSid,
      account,
      domain,
      deviceId: defaultLoginInfo.deviceid,
    });

    const requestData = {
      ...defaultLoginInfo,
      ...corpParams,
      code: phoneCode,
      passtype: 2,
    };

    const requestUrl = this.getUrl('corpMailPhoneCodeLogin');

    return this.impl
      .post(requestUrl, requestData)
      .then(res => res.data)
      .then(res => {
        const codeStr = String(res?.code as string);
        if (codeStr === corpLoginUtils.CONSTANTS.CORP_API_SUCCESS_CODE) {
          return this.handleLoginResponse(res?.data as ResponseLoginData);
        }
        return {
          pass: false,
          errmsg: LoginApiImpl.getErrMsg(res?.msgCode),
          errCode: res?.msgCode,
          res,
        } as LoginModelExt;
      })
      .then(async rs => {
        if (rs.pass) {
          await this.corpLoginSucceed(rs?.res);
        }
        return rs;
      })
      .catch(ex => {
        console.log('[login] corp-login with code error:', ex);
        return {
          errmsg: LoginApiImpl.commonCatch(ex),
          pass: false,
        } as LoginModel;
      });
  }

  async doLoginWithCode(code: string, needPersist?: intBool, email?: string, sessionName?: string): Promise<LoginModel> {
    const isSubAccount = !!email;
    if ((!isSubAccount && this.actions.preLoginPassed && this.actions.currentPreloginRequest) || isSubAccount) {
      const req = !isSubAccount ? this.actions.currentPreloginRequest : this.actions.subAccountCurrentPreLoginRequestMap[email];
      this.actions.loginMethod = 'code';
      if (!isSubAccount && this.actions.codeRetryTime > 3) {
        return Promise.resolve({
          errmsg: ErrMsgCodeMap['ERR.MOBILEAUTH.RETRYFAILED'],
          pass: false,
        } as LoginModel);
      }

      if (loginUtils.getIsCorpMailMode(this.actions.mailMode)) {
        return this.doCorpLoginWithCode(code);
      }
      let reqDomain = '';
      let reqAccounName = '';
      if (isSubAccount) {
        const accountAndDomain = this.handleAccountAndDomain(email);
        reqDomain = accountAndDomain.domain;
        reqAccounName = accountAndDomain.account;
      }

      const res = await this.loginWithCode({
        p: req!.p || productCode,
        domain: !isSubAccount ? req!.domain! : reqDomain,
        account_name: !isSubAccount ? req!.account_name! : reqAccounName,
        pass_2fa: (needPersist || 0) as intBool,
        code,
        output: 'json',
        sessionName,
        email: isSubAccount ? email : '',
        isSubAccount,
      });
      if (isSubAccount) {
        this.fillSubAccountInfo(res, email, false, sessionName);
      }
      return this.processLoginResult(res).then(ret => {
        if (ret?.pass) {
          if (!isSubAccount) {
            const { currentPreloginRequest } = this.actions;
            const account = currentPreloginRequest?.account_name + '@' + currentPreloginRequest?.domain;
            this.tryReportLoginSuccess(account);
          } else {
            this.tryReportLoginSuccess(email);
          }
        }
        return ret;
      });
      //   .then(
      //   this.handleLoginResponse.bind(this),
      // ).then(
      //   this.loginDoorEnter.bind(this),
      // ).catch(ex => {
      //   console.log('[login] login with code error:', ex);
      //   return {
      //     errmsg: LoginApiImpl.commonCatch(ex),
      //     pass: false,
      //   } as LoginModel;
      // });
      // return loginModelPromise;
    }
    return Promise.resolve({
      errmsg: ErrMsgCodeMap['ERR.ILLEGAL'],
      pass: false,
    } as LoginModel);
  }

  async doLoginWithMail(code: string, needPersist?: intBool): Promise<LoginModel> {
    if (this.actions.preLoginPassed && this.actions.currentPreloginRequest) {
      const req = this.actions.currentPreloginRequest;
      this.actions.loginMethod = 'mail';
      const res = await this.loginWithMail({
        p: req!.p || productCode,
        domain: req!.domain!,
        account_name: req!.account_name!,
        pass_2fa: (needPersist || 0) as intBool,
        code,
        output: 'json',
      });
      return this.processLoginResult(res).then(ret => {
        if (ret?.pass) {
          const { currentPreloginRequest } = this.actions;
          const account = currentPreloginRequest?.account_name + '@' + currentPreloginRequest?.domain;
          this.tryReportLoginSuccess(account);
        }
        return ret;
      });
    }
    return Promise.resolve({
      errmsg: ErrMsgCodeMap['ERR.ILLEGAL'],
      pass: false,
    } as LoginModel);
  }

  async doGetPasswordRules(): Promise<PwdRuleModel> {
    try {
      const currentUser = this.systemApi.getCurrentUser();
      const isAddAccountPage = this.systemApi.getIsAddAccountPage();
      if (currentUser && currentUser.id && (!this.actions.preLoginPassed || !this.actions.currentPreloginResponse)) {
        await this.doPreLogin(currentUser.id);
      }
      const pwdKey = (currentUser && !isAddAccountPage ? 'getPwdRuleAfterLogin' : 'getPwdRule') as URLKey;
      const resp = await this.impl.post(this.getUrl(pwdKey), { output: 'json' }, { headers: { 'Qiye-Header': 'anticsrf' } });
      const data = this.unpackLoginData(resp);
      if (data && data.code && String(data.code) === '200') {
        if (data.result) {
          return {
            pwdrule: data.result,
            nickname: currentUser?.nickName || '',
            sign: '',
          } as PwdRuleModel;
        }
        if (data.data) {
          return data.data;
        }
        return {} as PwdRuleModel;
      }
      return {
        errmsg: LoginApiImpl.getErrMsg(data.msgCode),
      };
    } catch (ex) {
      console.warn('[login] getPwdRul error:', ex);
      return {
        errmsg: LoginApiImpl.commonCatch(ex),
      };
    }
  }

  async doCheckPasswordMatch(pwd: string, account?: string): Promise<boolean> {
    if (account) {
      this.storeCurrentAccount({ account });
    }
    const currentUser = this.systemApi.getCurrentUser();
    if (!currentUser) {
      return false;
    }
    const { pwd: curPwd, type } = await this.getS({
      originPwd: LoginApiImpl.accountPwdAutoFilled,
      originAccount: account || currentUser.id,
      md5Encrypt: true,
    });
    if (type !== 'plain' && type !== 'md5') {
      return false;
    }
    return !!pwd && !!curPwd && curPwd !== LoginApiImpl.accountPwdAutoFilled && (curPwd === pwd || curPwd === this.systemApi.md5(pwd));
  }

  async doUpdatePassword(pass: string, sign: string, oldPass?: string): Promise<LoginModel> {
    try {
      const currentUser = this.systemApi.getCurrentUser();
      const isAddAccountPage = this.systemApi.getIsAddAccountPage();
      const hasLogin = currentUser && !isAddAccountPage;
      const pwdKey = (hasLogin ? 'updatePwdAfterLogin' : 'updatePwd') as URLKey;
      const loginedVar = {
        password: pass,
        old_pass: oldPass,
        passType: 0,
        passchange_req: 0,
        autoEntry: true,
      };
      const unloginVar = {
        output: 'json',
        pass,
        sign,
        autoEntry: true,
      };
      const dt = hasLogin ? loginedVar : unloginVar;
      const resp = await this.impl.post(this.getUrl(pwdKey), dt, {
        headers: { 'Qiye-Header': 'anticsrf' },
        noHeaderCookie: true,
      });
      const data = this.unpackLoginData(resp);
      if (String(data.code) === '200') {
        this.storePwd(pass);
        if (pwdKey === 'updatePwd') {
          const ret = await this.processLoginResult(data);
          if (ret?.pass) {
            const preloginRequest = this.actions.currentPreloginRequest;
            const account = preloginRequest?.account_name + '@' + preloginRequest?.domain;
            this.tryReportLoginSuccess(account);
          }
          if (ret) {
            ret.redirectUrl = 'entry';
          }
          return ret;
        }
        return { pass: true, errmsg: '' };
      }
      return {
        // errmsg: LoginApiImpl.getErrMsg(data?.msgCode),
        errmsg: data?.message as string,
        pass: false,
      };
    } catch (ex) {
      console.warn('[login] getPwdRul error:', ex);
      return Promise.resolve({
        errmsg: LoginApiImpl.commonCatch(ex),
        pass: false,
      });
    }
  }

  private async processLoginResult(data: ResponseData<any>) {
    let result: LoginModel | LoginModelExt | undefined;
    let loginResult: LoginModelExt | undefined;
    const isSubAccount = !!data?.data?.isSubAccount;
    try {
      const rs = LoginApiImpl.processLogin(data);
      loginResult = this.handleLoginResponse(rs);
      result = await this.loginDoorEnter(loginResult);
    } catch (e) {
      console.log('[login] login error:', e);
      if (e && typeof e === 'string' && e === 'NETWORK.ERR.TIMEOUT') {
        result = {
          pass: false,
          timeout: true,
          errmsg: '请求超时',
        } as LoginModel;
      } else {
        result = {
          errmsg: LoginApiImpl.commonCatch(e),
          pass: false,
        } as LoginModel;
      }
    } finally {
      if (!isSubAccount) {
        if (loginResult?.pass && !result?.pass) {
          // 第一步成功，第二步失败了
          this.clearCookies(false);
        }
        if (result && this.actions.loginMethod !== 'code' && this.actions.loginMethod !== 'mail') {
          // 二次验证，或重置密码，需要保留 preloginPassed状态，其他情况应当清除
          const { secondCheck, showResetPass } = result;
          if (!(secondCheck || showResetPass)) {
            this.actions.preLoginPassed = false;
          }
        }
      }
    }
    return result;
  }

  setPreLoginPassed(val: boolean) {
    if (this.actions) {
      this.actions.preLoginPassed = val;
    }
  }

  async doLogout(notDeleteAccount?: boolean, clearCookies?: boolean, noClearActionStore?: boolean): Promise<commonMessageReturn> {
    if (this.systemApi.isTransferringData() || this.systemApi.isBkLoginInit()) {
      return Promise.reject(new Error('not proper time to logout'));
    }
    try {
      console.trace('logout and clear cookie:', notDeleteAccount, clearCookies);
      this.dataTrackApi.track('pc_logout_occurred', {
        notDeleteAccount,
        clearCookies,
      });
      const currentUser = this.systemApi.getCurrentUser();
      if (!currentUser) {
        return '';
      }
      this.impl.setLogoutStatus(true);
      if (!notDeleteAccount) {
        await this.accountApi.doDeleteAccountList([currentUser.id]);
      }
      // dologout会关掉后台DB页面
      this.disableBackgroundDB(true);
      const res = await this.sendLoginEvent(undefined);
      await this.storeApi.setLastAccount(undefined);
      const isCorpMailUser = this.systemApi.getIsCorpMailMode();
      await this.clearCookies(isCorpMailUser);
      return res;
    } catch (e) {
      console.error('[login] logout error ', e);
      return 'SERVER.ERR';
    } finally {
      this.storeApi.setCurrentNode(undefined);
      if (!noClearActionStore) {
        this.actions = new ActionStore();
      }
    }
  }

  private async getLoginAccountInfo(emailAddress: string) {
    const domainInfo = this.handleAccountAndDomain(emailAddress);
    const url = this.systemApi.getUrl('loginGetAccount');
    const res = await this.impl
      .get(url, {
        domain: domainInfo.domain,
        account_name: domainInfo.account,
        output: 'json',
        p: productCode,
      })
      .then(res => res.data);
    const isSuccess = res?.code?.toString() === '200';
    const userInfo = res?.result?.data;
    if (isSuccess && userInfo) {
      return {
        success: true,
        data: {
          email: userInfo.email,
          orgName: userInfo.orgName,
          nickname: userInfo.nickName,
          cookieName: '',
        },
      };
    }
    return {
      success: false,
      error: {
        errorCode: res?.code?.toString() || '',
        errorMsg: '',
      },
    };
  }

  private async doTryNewLoginWithCurrentState(emailAccount: string, sid: string, originAccount?: string): Promise<LoginModel> {
    try {
      const res = await this.getLoginAccountInfo(emailAccount);
      const resData = res.data;
      if (!res.success || !resData) {
        return {
          pass: false,
          errmsg: res.error?.errorMsg || '认证异常，请登录后重试',
          errCode: res.error?.errorCode,
        };
      }
      this.actions.currentAccount = {
        a: resData.email,
        k: LoginApiImpl.accountPwdAutoFilled,
        lastLogin: Date.now(),
      };
      const originAccountEmail = originAccount && originAccount.includes('@') ? originAccount : '';
      await this.loginSucceed({
        uid: resData.email,
        nickname: resData.nickname,
        cookieName: sid,
        orgName: resData.orgName,
        cnName: resData.cookieName,
        accessToken: '',
        accessSecret: '',
        isCorpMail: false,
        nonce: '',
        mobile: '',
        isSharedAccountSwitch: !!originAccountEmail,
        originAccountEmail,
      });
      return {
        pass: true,
        errmsg: '',
      };
    } catch (ex) {
      console.error('doTryNewLoginWithCurrentState error', ex);
      return {
        pass: false,
        errmsg: '认证异常，请登录后重试',
      };
    }
  }

  async doTryLoginWithCurrentState(emailAccount: string, sid: string, originAccount?: string): Promise<LoginModel> {
    try {
      const shouldUseNewGetAccountInfo = typeof window !== 'undefined' ? window.loginUserNewAccountInfo : false;
      if (shouldUseNewGetAccountInfo) {
        return this.doTryNewLoginWithCurrentState(emailAccount, sid, originAccount);
      }
      const ret = await this.accountApi.getCurrentAccountInfo(emailAccount);
      await this.setupNodeInfo(ret.node);
      this.actions.currentAccount = {
        a: ret.email,
        k: LoginApiImpl.accountPwdAutoFilled,
        lastLogin: Date.now(),
      };
      let orgName = '';
      if (ret.unitPathList && ret.unitPathList.length > 0) {
        orgName = ret.unitPathList[0]?.unitName || '';
      }
      const originAccountEmail = originAccount && originAccount.includes('@') ? originAccount : '';

      await this.loginSucceed({
        uid: ret.email,
        nickname: ret.nickName,
        cookieName: sid,
        orgName,
        cnName: '',
        accessToken: '',
        accessSecret: '',
        isCorpMail: false,
        nonce: '',
        mobile: '',
        isSharedAccountSwitch: !!originAccountEmail,
        originAccountEmail,
      });
      return {
        pass: true,
        errmsg: '',
      };
    } catch (e) {
      console.warn('[login] error load user info using cookies ', e);
      return {
        pass: false,
        errmsg: '认证异常，请登录后重试',
      };
    }
  }

  private sendSubAccountExpiredEvent(info?: ISubAccountEventData) {
    this.eventApi.sendSysEvent({
      eventName: 'SubAccountLoginPreExpired',
      toType: ['main'],
      eventData: {
        mainAccount: info?.mainAccount,
        subAccount: info?.subAccount,
        agentEmail: info?.agentEmail,
      },
    });
  }

  private watchLogout(ev: SystemEvent) {
    const isSubAccount = ev.eventName === 'subAccountLogout';
    if (isSubAccount && ev && ev.eventData) {
      this.sendSubAccountExpiredEvent(ev.eventData);
      return;
    }
    if (this.systemApi.isBkStableWindow()) {
      this.systemApi.closeWindow(false, true);
      return;
    }
    if (ev && pathNotInArrJudge(window.location, ignoreLoginPath) && !locationHelper.testPathMatch('/jump/')) {
      const eventData = ev?.eventData || ({} as LoginJumpConfig);
      this.logoutAndJump({ jumpTo: 'setting', ...eventData });
    }
  }

  private async logoutAndJump(jumpConfig?: LoginJumpConfig) {
    const { clearCookies = false, notDeleteAccount = true, jumpTo = 'setting' } = jumpConfig || {};
    console.trace('[login] logout called:', jumpConfig);
    // debugger;
    if (this.systemApi.isBkLoginInit()) {
      return;
    }
    if (jumpTo === 'setting' && this.systemApi.isMainPage() && this.systemApi.isElectron() && window.electronLib) {
      const func = (retry: number) => {
        jumpLogin(jumpConfig);
        setTimeout(() => {
          console.warn('[login] logout navigate called:', jumpConfig, retry);
          if (!locationHelper.testHrefMatch(loginPageExt)) {
            if (retry > 0) {
              func(retry - 1);
            } else {
              jumpLogin();
            }
          }
        }, 2000);
      };
      func(3);
      return;
    } // Promise.resolve('already logout-ing');
    this.showAccountLogoutTip();
    // debugger;
    this.doLogout(notDeleteAccount, clearCookies)
      .then(() => {
        this.jumpLogin();
      })
      .catch(ex => {
        console.error('logout occurred:', ex);
        this.dataTrackApi.track('auto_logout_exception_occured', { msg: ex?.message });
        // location.assign(LoginApiImpl.loginPage);
        this.jumpLogin();
      });
  }

  private showAccountLogoutTip() {
    if (process.env.BUILD_ISWEB) {
      this.eventApi.sendSysEvent({
        eventName: 'error',
        eventData: {
          popupType: 'toast',
          popupLevel: 'error',
          title: '登录账号已失效，即将跳转到登录页',
        },
      });
    }
  }

  async jumpLogin(jumpConfig?: LoginJumpConfig) {
    this.noLoginStatus = true;
    await this.performanceApi.saveLog();
    if (jumpConfig?.jumpTo === 'login') {
      this.logoutProcessing = true;
      await this.doLogout(jumpConfig.notDeleteAccount, jumpConfig.clearCookies);
      this.logoutProcessing = false;
    }
    jumpLogin(jumpConfig, () => {
      console.warn('[login] handle jump login finish and set flag');
      this.logoutProcessing = true;
    });
  }

  // eslint-disable-next-line no-unused-vars
  onPathChange(_?: ApiLifeCycleEvent) {
    return this.name;
  }

  reportLogoutToUser(jumpConfig?: LoginJumpConfig) {
    this.doLogout(!!jumpConfig?.notDeleteAccount, !!jumpConfig?.clearCookies).then();
  }

  refreshStatus() {
    this.actions.preLoginPassed = false;
  }

  private async autoLoginSharedAccount(originEmail: string, sharedEmail: string): Promise<{ pass: boolean; errMsg?: string }> {
    return new Promise(async (resolve, _) => {
      try {
        const [account, accountInfo] = await this.accountApi.doGetAllAccountList();
        const swictAccount = (account || []).filter(item => item.id === originEmail);
        const browserUUId = this.storeApi.getUUID();
        const sessionName = `memory-${new Date().getTime().toString()}`;
        const { winId } = await this.systemApi.createWindowWithInitData(
          {
            type: 'bkLogin',
            additionalParams: {
              bkLoginInit: 'true',
              sessionName,
            },
            manualShow: true,
            sessionName,
          },
          {
            eventName: 'initBkLoginPage',
            eventData: {
              account: swictAccount,
              accountInfo,
              browserUUId,
              accountId: originEmail,
              isSharedAccountSwitch: true,
              targetSharedAccount: sharedEmail,
            } as BkLoginInitData,
          }
        );

        let hasTimeout = false;
        const tid = setTimeout(() => {
          hasTimeout = true;
          resolve({
            pass: false,
            errMsg: '重登陆超时',
          });
        }, 30 * 1000);

        const eventName = 'bkStableSwitchAccount';
        const eventId = this.eventApi.registerSysEventObserver(eventName, {
          name: 'hanldSharedAccountLoginExpired-result',
          func: async (ev: SystemEvent<BkLoginResultData>) => {
            if (hasTimeout) return;
            if (tid) {
              window.clearTimeout(tid);
            }
            if (winId) {
              this.systemApi.closeSubWindow(winId!, false, true);
            }

            if (eventId) {
              this.eventApi.unregisterSysEventObserver(eventName, eventId);
            }

            const data = ev.eventData;
            const { currentUser, pass, account } = data!;
            if (pass) {
              if (currentUser) {
                const newCurrentUser = this.systemApi.getCurrentUser();
                if (newCurrentUser) {
                  this.storeApi.setLastAccount(newCurrentUser);
                  if (newCurrentUser.cookies && newCurrentUser.cookies.length) {
                    await window.electronLib.appManage.clearCookieStore();
                    await window.electronLib.appManage.setCookieStore(newCurrentUser.cookies);
                  }
                }
              }
              if (account && account.length) {
                await this.accountApi.storeAccountList(account);
              }
              resolve({
                pass: true,
              });
            } else {
              return resolve({
                pass: false,
              });
            }
          },
        });
      } catch (ex: any) {
        resolve({
          pass: false,
          errMsg: ex.message,
        });
      }
    });
  }

  private sendSubAccountLoginEvent(user: User, isTimeout?: boolean) {
    this.eventApi.sendSysEvent({
      eventName: 'subAccountLogin',
      eventData: user,
      eventStrData: isTimeout ? 'timeout_event' : 'event',
    });
  }

  watchLoginExpired(ev: SystemEvent) {
    console.log('got re-login ev:', ev);
    const { eventName } = ev;
    const isSubAccount = ev.eventName === 'subAccountLoginHttpExpired' || ev.eventName === 'subAccountLoginExpiredCrossWindow';
    const subAccount = ev.eventData && ev.eventData.subAccount ? ev.eventData.subAccount : '';
    const isMailPage = this.systemApi.isMainPage();
    if (
      process.env.BUILD_ISELECTRON &&
      !this.systemApi.isBkLoginInit() && // 非后台登录页面，则应当发送信息给首页处理
      (eventName === 'loginExpired' || isSubAccount)
    ) {
      if (!isSubAccount) {
        this.eventApi.sendSimpleSysEvent('loginExpiredCrossWindow');
      } else if (!isMailPage) {
        this.eventApi.sendSysEvent({
          eventName: 'subAccountLoginExpiredCrossWindow',
          eventData: ev.eventData,
        });
      }
    }
    const isLogout = !subAccount ? this.actions.logout : this.actions.subAccountLogoutMap[subAccount] || false;
    if (isLogout || this.systemApi.isTransferringData()) {
      console.log('[login] will not handle re-login ev:', ev);
      return;
    }
    const isAutoLogin = !subAccount ? this.actions.autoLogin : this.actions.subAccountAutoLoginMap[subAccount] || false;
    if (!isAutoLogin) {
      if (!subAccount) {
        this.actions.autoLogin = true;
      } else {
        this.actions.subAccountAutoLoginMap[subAccount] = true;
      }
      console.warn('[login] handle re-login ev:', ev);
      const isMailPage = this.systemApi.isMainPage();
      // 只有electron的主页面，或者在web中触发重登陆
      if ((isMailPage && process.env.BUILD_ISELECTRON) || !process.env.BUILD_ISELECTRON) {
        const currentUser = this.systemApi.getCurrentUser();
        if (!subAccount && currentUser && currentUser.isSharedAccount && currentUser.originAccount) {
          this.autoLoginSharedAccount(currentUser.originAccount.email, currentUser.id)
            .then(res => {
              if (res.pass) {
                const currentUser = this.systemApi.getCurrentUser();
                if (currentUser) {
                  this.sendLoginEvent(currentUser, false);
                }
              } else {
                this.trackReLoginFailedToHubble('sharedAccount autoLogin error ' + (res.errMsg || ''));
                this.triggerLogoutLogical(false);
              }
            })
            .finally(() => {
              this.actions.autoLogin = false;
            });
          return;
        }
        this.autoLogin(subAccount, isSubAccount)
          .then(res => {
            if (res.pass) {
              // this.actions.autoLogin = false;
              if (isSubAccount) {
                this.sendSubAccountLoginEvent(this.systemApi.getCurrentUser(subAccount)!);
              }
              console.log('[login] re-login success', ev, res);
              return;
            }
            if (res.timeout) {
              if (!subAccount) {
                const currentUser = this.systemApi.getCurrentUser();
                if (currentUser) {
                  this.sendLoginEvent(currentUser, true).then();
                  return;
                }
              } else {
                const currentUser = this.systemApi.getCurrentUser(subAccount);
                if (currentUser) {
                  this.sendSubAccountLoginEvent(currentUser, true);
                  return;
                }
              }
            }
            this.trackReLoginFailedToHubble('autoLogin error ' + (res.errmsg || ''));
            this.triggerLogoutLogical(isSubAccount, isSubAccount ? ev.eventData : undefined);
          })
          .catch(res => {
            console.warn('[login] re-login failed with exception :', res);
            this.trackReLoginFailedToHubble('autoLogin catch error ' + (res.message || ''));
            this.triggerLogoutLogical(isSubAccount, isSubAccount ? ev.eventData : undefined);
          })
          .finally(() => {
            if (!isSubAccount) {
              this.actions.autoLogin = false;
            } else {
              this.actions.subAccountAutoLoginMap[subAccount] = false;
            }
          });
      }
    } else {
      console.warn('[login] re-login processing', ev);
    }
  }

  private trackReLoginFailedToHubble(errMsg: string) {
    try {
      const upTime = getReLoginUpTime();
      const env = getCurrentPageEnv();
      this.dataTrackApi.track('pc_login_re_login_failed', {
        msg: errMsg,
        uptime: upTime,
        env,
        subType: 'reloginfailed',
      });
    } catch (ex) {
      console.error('trackReLoginFailedToHubble ex', ex);
    }
  }

  private trackLogoutToHubble() {
    try {
      const upTime = getReLoginUpTime();
      this.dataTrackApi.track('pc_login_logout_occurred', {
        uptime: upTime,
        subType: 'reloginfailed',
      });
    } catch (ex) {
      console.error('trackLogoutToHubble login error', ex);
    }
  }

  private triggerLogoutLogical(isSubAccount: boolean, subAccountIndfo?: ISubAccountEventData) {
    this.trackLogoutToHubble();
    if (isSubAccount) {
      subAccountIndfo && this.sendSubAccountExpiredEvent(subAccountIndfo);
      return;
    }
    this.systemApi.unLockApp();
    this.logoutAndJump({
      clearCookies: true,
      notDeleteAccount: true,
      jumpTo: 'setting',
    });
  }

  init(): string {
    if (inWindow()) {
      this.loadUUID();
      if (this.systemApi.isMainPage()) {
        !LoginApiImpl.isInited &&
          this.eventApi.registerSysEventObserver('loginExpiredCrossWindow', {
            name: 'loginWatchLoginExpiredCross',
            func: this.watchLoginExpired.bind(this),
          });
        !LoginApiImpl.isInited &&
          this.eventApi.registerSysEventObserver('subAccountLoginExpiredCrossWindow', {
            name: 'loginImpl-subAccountLoginExpiredCrossWindow',
            func: this.watchLoginExpired.bind(this),
          });
      }
    }
    !LoginApiImpl.isInited &&
      this.eventApi.registerSysEventObserver('loginExpired', {
        name: 'loginWatchLoginExpired',
        func: this.watchLoginExpired.bind(this),
      });
    !LoginApiImpl.isInited &&
      this.eventApi.registerSysEventObserver('subAccountLoginHttpExpired', {
        name: 'subAccountLoginWatchLoginExpired',
        func: this.watchLoginExpired.bind(this),
      });
    !LoginApiImpl.isInited &&
      this.eventApi.registerSysEventObserver('logout', {
        name: 'loginWatchLogout',
        func: this.watchLogout.bind(this),
      });
    !LoginApiImpl.isInited &&
      this.eventApi.registerSysEventObserver('subAccountLogout', {
        name: 'loginImpl-subAccountLogout',
        func: this.watchLogout.bind(this),
      });
    !LoginApiImpl.isInited &&
      this.eventApi.registerSysEventObserver('loginBlock', {
        name: 'loginNoLoginStatusOb',
        func: ev => {
          if (ev && ev.eventData !== undefined) {
            this.noLoginStatus = String(ev.eventData) === 'true';
          }
        },
      });
    !LoginApiImpl.isInited &&
      this.eventApi.registerSysEventObserver('loginRetry', {
        name: 'loginWatchRetryOb',
        func: async () => {
          try {
            const user = this.systemApi.getCurrentUser();
            if (user && user.id) {
              const ret = await this.accountApi.getCurrentAccountInfo(user?.id);
              if (ret.email) {
                this.impl.afterLogin &&
                  this.impl.afterLogin({
                    event: 'afterLogin',
                    data: {
                      eventName: 'login',
                      eventData: user,
                      eventSeq: 0,
                      eventStrData: 'timeout_event',
                    } as SystemEvent,
                  });
              }
              console.warn('[login] login retry succeed', ret);
            }
          } catch (e) {
            console.error('[login] login retry failed', e);
            this.triggerLogoutLogical(false);
          }
        },
      });
    !LoginApiImpl.isInited &&
      this.systemApi.intervalEvent({
        eventPeriod: 'mid',
        seq: 0,
        id: 'login_watch_dog',
        noUserAuth: true,
        handler: (ev: IntervalEventParams) => {
          if (ev.seq > 7 && ev.seq % 3 === 0) {
            if (!this.noLoginStatus) {
              this.handleNoCurrentUser();
            }
          }
        },
      });
    LoginApiImpl.isInited = true;
    return this.name;
  }

  private handleNoCurrentUser() {
    if (this.systemApi.getCurrentUser() == null) {
      setTimeout(() => {
        if (this.systemApi.getCurrentUser() == null && !this.noLoginStatus) {
          this.notifyNoLogin();
        }
      }, 7700);
    }
  }

  notifyNoLogin() {
    if (pathNotInArrJudge(window.location, ignoreLoginPath)) {
      if (this.actions.loginIssueConfirmShowed) {
        this.actions.loginIssueConfirmShowed = true;
        this.eventApi.sendSysEvent({
          eventName: 'error',
          eventLevel: 'error',
          eventStrData: '',
          eventData: {
            popupType: 'window',
            popupLevel: 'error',
            title: '登录状态异常',
            content: '将跳转至账号管理页，跳转后可尝试重新登录',
            code: 'PARAM.ERR',
            auto: false,
            // btnCancelTxt: '否',
            btnConfirmTxt: '立即跳转',
            confirmCallback: () => {
              if (this.systemApi.isMainPage()) {
                this.actions.loginIssueConfirmShowed = false;
                this.jumpLogin({
                  jumpTo: 'setting',
                  clearCookies: false,
                  notDeleteAccount: true,
                });
              } else if (window.electronLib && this.systemApi.isElectron()) {
                this.systemApi.closeWindow(true);
              }
            },
            cancelCallback: () => {
              this.actions.loginIssueConfirmShowed = false;
              console.warn('user cancel the dialog of login alert');
              this.dataTrackApi.track('pc_logout_alerted_and_canceled_by_user', {
                location: window.location.href,
              });
            },
          } as PopUpMessageInfo,
          eventSeq: 0,
        });
      } else {
        this.eventApi.sendSysEvent({
          eventName: 'error',
          eventLevel: 'error',
          eventStrData: '',
          eventData: {
            popupType: 'toast',
            popupLevel: 'error',
            title: '登录状态异常',
            content: '请确认是否请求出现异常',
            code: 'PARAM.ERR',
            auto: false,
          } as PopUpMessageInfo,
          eventSeq: 0,
        });
      }
    }
    if (this.systemApi.isBkStableWindow()) {
      this.systemApi.closeWindow(false, true);
    }
  }

  afterInit() {
    this.autoFillPwdMd5 = this.systemApi.md5(LoginApiImpl.accountPwdAutoFilled, true);
    return this.name;
  }

  private sendAccountInitModuleEvent() {
    this.eventApi.sendSysEvent({
      eventName: 'initModule',
      eventStrData: 'account',
    });
  }

  afterLoadFinish() {
    this.loadStorageToDB()
      .then(_ => {
        const isCorpMail = this.systemApi.getIsCorpMailMode();
        !isCorpMail && this.bindAccountDevice().then();
        const user = this.systemApi.getCurrentUser();
        if (user?.id) {
          return this.getAccountStored(user.id);
        }
        return undefined;
      })
      .then(storedAccount => {
        if (storedAccount) {
          this.storeCurrentAccount({
            account: storedAccount.id,
            pwd: storedAccount.pwd,
            mobile: storedAccount.mobile,
            refreshToken: storedAccount.refreshToken,
            refreshTokenExpire: storedAccount.refreshTokenExpire,
          });
        }
        if (environment !== 'prod') {
          console.log('[login] current account:', storedAccount);
        }
        if (process.env.BUILD_ISELECTRON && storedAccount?.id && !storedAccount?.cookies) {
          try {
            const sessionName = this.systemApi.getCurrentSessionName();
            const param = sessionName ? { sessionName } : undefined;
            // @ts-ignore
            window.electronLib.appManage.getCookieStore(param).then(res => {
              this.accountApi.doUpdateAccountList([
                {
                  id: storedAccount?.id,
                  cookies: res,
                },
              ]);
            });
          } catch (e) {
            console.warn(e);
          }
        }
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        this.sendAccountInitModuleEvent();
        this.logoutProcessing = false;
      });
    return this.name;
  }

  async setDeviceId(deviceId: string) {
    defaultLoginInfo.deviceid = deviceId;
    return this.storeUUID(deviceId)
      .then(() => this.storeApi.loadUUID())
      .then(() => this.impl.updateDeviceInfo())
      .catch(err => {
        console.error('setDeviceId error', err);
      });
  }

  private storeUUID(uuid: string) {
    return this.storeApi.put(LoginApiImpl.keyDeviceUUID, uuid, LoginApiImpl.storeConfig);
  }

  private loadUUID() {
    this.storeApi.get(LoginApiImpl.keyDeviceUUID, LoginApiImpl.storeConfig).then((rs: StoreData) => {
      if (rs.suc && rs.data) {
        defaultLoginInfo.deviceid = rs.data;
      } else {
        const uuid = 'i-' + new Date().getTime().toString(16) + '-' + this.systemApi.generateKey(16);
        this.storeUUID(uuid).then(() => {
          defaultLoginInfo.deviceid = uuid;
        });
      }
    });
  }

  async bindAccountDevice() {
    const currentUser = this.systemApi.getCurrentUser();
    const deviceInfo = await this.systemApi.getDeviceInfo();
    // web暂时放开
    // if (!currentUser || !deviceInfo._deviceId || !this.systemApi.isElectron()) {
    if (!currentUser || !deviceInfo._deviceId) {
      return;
    }
    try {
      const accountList = await this.accountApi.doGetAllMainAndSubAccounts();
      const mainAccountId = currentUser.id;
      let sharedAccounts: any[] = [];
      const sharedAccountInfo = await this.accountApi.getSharedAccountsInfoAsync();
      if (sharedAccountInfo?.sharedAccounts?.length) {
        sharedAccounts = sharedAccountInfo.sharedAccounts.map(item => ({
          bizAccountId: item.email,
          bindType: 'EMAIL',
          loginStatus: mainAccountId === item.email ? 1 : 0,
        }));
      }
      const bindAccountList = accountList.map(item => ({
        bizAccountId: item.id,
        bindType: 'EMAIL',
        loginStatus: mainAccountId === item.id ? 1 : 0,
      }));
      const { data } = await this.impl.post(
        this.getUrl('bindAccountDevice'),
        {
          bindAccountList: sharedAccounts.length ? [...sharedAccounts, ...bindAccountList] : bindAccountList,
        },
        {
          contentType: 'json',
        }
      );
      if (data && data.success) {
        console.log('[login] bindAccountDevice Success! bindAccountList', bindAccountList);
      } else {
        console.error('[login] bindAccountDeviceError', data?.message);
      }
    } catch (ex) {
      console.error('[login] +bindAccountDeviceError', ex);
    }
  }

  private requestReportSuccApi(account: string) {
    return this.impl.post(this.systemApi.getUrl('notifyLoginSuc'), { account });
  }

  getVerifyCodeUrl(accountName: string, accountDomain: string, sid: string): string {
    const baseUrl = this.getUrl('corpMailGetVerifyCode');
    return corpLoginUtils.getNewImgVerifyCodeUrl({
      baseUrl,
      accountName,
      accountDomain,
      sid,
    });
  }

  private async registerAddAccountPageReturnEvent() {
    if (this.addAccountEventId) {
      return;
    }
    this.addAccountEventId = this.eventApi.registerSysEventObserver('addAccountPageReturnEvent', {
      func: async (ev: SystemEvent<addAccountPageReturnDataType>) => {
        const { eventData } = ev;
        if (eventData) {
          this.disableBackgroundDB();
          const { currentUser, currentNode, originAccount: newAccounts, originAccountInfo: newAccountInfos, authInfo } = eventData;
          this.systemApi.switchLoading(true);
          await this.eventApi.sendSysEvent({
            eventName: 'loginBlock',
            eventData: true,
            eventSeq: 0,
          });
          await wait(10);
          this.impl.setLogoutStatus(true);
          if (currentUser) {
            this.storeApi.setLastAccount(currentUser);
          }
          if (currentNode) {
            this.storeApi.setCurrentNode(currentNode);
          }
          if (newAccounts && newAccounts.length) {
            this.accountApi.doUpdateAccountList(newAccounts);
          }
          if (newAccountInfos && newAccountInfos.length) {
            this.accountApi.storeAccountInfoList(newAccountInfos);
          }
          if (authInfo) {
            this.productAuthApi.setStoreAuthInfo(authInfo);
          }
          if (window && window.electronLib && currentUser) {
            this.systemApi.switchLoading(true);
            const { electronLib } = window;
            await electronLib.windowManage.show();
            await electronLib.appManage.clearCookieStore();
            await electronLib.appManage.setCookieStore(currentUser.cookies!);
            await electronLib.windowManage.closeAllWindowExceptMain(true);
            try {
              await electronLib.masterBridgeManage.flush('');
            } catch (ex) {
              console.error('masterBridgeManage.flush error', ex);
            }
            setTimeout(async () => {
              await this.createBKStableWindow();
              this.systemApi.reloadToMainPage();
            }, 200);
          }
        }
      },
    });
  }

  async showCreateAccountPage(email?: string) {
    if (!window) return;
    const currentHostType = this.systemApi.getCurrentHostType();
    const currentUser = this.systemApi.getCurrentUser();
    const browserUUId = this.storeApi.getUUID();
    const sessionName = `memory-${new Date().getTime().toString()}`;
    this.registerAddAccountPageReturnEvent();
    const allVisibleWins = await this.getAllWindowsByVisible(true, ['addAccount']);
    this.toggleAllWindows(allVisibleWins, false);
    const bounds = await window.electronLib.windowManage.getWinBounds();
    this.systemApi.createWindowWithInitData(
      {
        type: 'addAccount',
        additionalParams: {
          'add-account-page': 'true',
          'lang-str': window.systemLang,
          ...(email ? { 'login-email': email } : {}),
        },
        sessionName,
        bounds,
      },
      {
        eventName: 'initAddAccountPageEvent',
        eventData: {
          currentHostType,
          currentUser,
          browserUUId,
          sessionName,
          visibileWinIds: allVisibleWins,
        },
      }
    );
  }

  private async getAllWindowsByVisible(visible: boolean, blackWinTypes: string[] = []): Promise<number[]> {
    if (!window || !window.electronLib) return [];
    const { windowManage } = window.electronLib;
    const allWinInfos = await windowManage.getAllWinInfo();
    const winIds: number[] = [];
    allWinInfos.forEach(winInfo => {
      const currentWinId = winInfo.id;
      if (winInfo.isVisible === visible && !winIds.includes(currentWinId)) {
        const inBlackList = !blackWinTypes || !blackWinTypes.length ? false : blackWinTypes.includes(winInfo.type);
        if (!inBlackList) {
          winIds.push(currentWinId);
        }
      }
    });
    return winIds;
  }

  async toggleAllWindows(winIds: number[], visible: boolean) {
    if (!winIds || !winIds.length) return;
    if (!window || !window.electronLib) return;
    const { windowManage } = window.electronLib;
    winIds.forEach(winId => {
      if (visible) {
        windowManage.show(winId);
      } else {
        windowManage.hide(winId);
      }
    });
  }

  private getCommonBindWinData() {
    const sessionName = `memory-${new Date().getTime().toString()}`;
    return {
      sessionName,
    };
  }

  private sendSubAccountAddedEvent(param: ISubAccountEventData) {
    this.eventApi.sendSysEvent({
      eventName: 'SubAccountAdded',
      eventData: param,
    });
    setTimeout(() => {
      this.eventApi.sendSysEvent({
        eventName: 'SubAccountWindowReady',
        eventData: param,
      });
    }, 1000);
  }

  private async handleAddSubAccountSuccess(uid: string, resolve: any, bindInfo: SubAccountBindInfo | string) {
    const currentUser = this.systemApi.getCurrentUser();
    const mainAccount = currentUser ? currentUser.id : '';
    if (!mainAccount) {
      resolve({
        success: false,
        errMsg: DEFAULT_API_ERROR,
        errCode: 100,
      });
      return;
    }
    const accountTypeFromParam = typeof bindInfo === 'string' ? bindInfo : bindInfo.accountType;
    // 企业邮的登录成功后，调用添加账号的接口
    if (accountTypeFromParam === SUB_ACCOUNT_TYPES.NETEASE_QIYE_MAIL) {
      // 编辑账号时，不再次调用添加账号接口
      const isEditSubAccount = typeof bindInfo === 'object' && bindInfo.isEditMode;
      if (!isEditSubAccount) {
        const res = await this.addQiyeMailSubAccount(uid);
        if (!res.success) {
          this.accountApi.deleteSubAccountLocalStateByEmail(uid);
          resolve(res);
          return;
        }
      }
    }

    const agentEmail = typeof bindInfo === 'string' ? uid : bindInfo.agentEmail;
    if (currentUser) {
      const accountType = accountTypeFromParam === SUB_ACCOUNT_TYPES.NETEASE_QIYE_MAIL ? 'qyEmail' : 'personalEmail';
      const newSubAccount = {
        mainAccount: currentUser.id,
        accountType,
        mainSendReceiveInfo: typeof bindInfo === 'string' ? {} : bindInfo,
        agentEmail: accountTypeFromParam === SUB_ACCOUNT_TYPES.NETEASE_QIYE_MAIL ? uid : agentEmail,
        id: uid,
        expired: false,
      };
      await this.accountApi.addOrUpdateLocalSubAccounts([newSubAccount as SubAccountTableModel]);
    }

    const eventParam = {
      mainAccount,
      subAccount: uid,
      agentEmail,
    };

    this.sendSubAccountAddedEvent(eventParam);

    resolve({
      success: true,
    });
  }

  private bindSubAccountMail(bindInfo: SubAccountBindInfo): Promise<SimpleResult> {
    return new Promise(async (resolve, _) => {
      try {
        if (bindInfo) {
          if (bindInfo.agentEmail) {
            bindInfo.agentEmail = bindInfo.agentEmail.trim();
          }
          if (bindInfo.password) {
            bindInfo.password = bindInfo.password.trim();
          }
        }
        const mainAccount = this.systemApi.getCurrentUser();
        if (!mainAccount) {
          resolve({
            success: false,
            errMsg: '获取主账号失败',
            errCode: 300,
          });
          return;
        }

        const { sessionName } = this.getCommonBindWinData();

        if (bindInfo.accountType !== 'NeteaseQiYeMail') {
          const res = bindInfo.isEditMode ? { success: true } : await this.addPersonalMailSubAccount(bindInfo);
          if (!res.success) {
            resolve(res);
            return;
          }

          this.loginAgentEmail(bindInfo.agentEmail, '', sessionName)
            .then(res => {
              if (res.success) {
                const uid = res.data ? res.data.email : '';
                this.handleAddSubAccountSuccess(uid, resolve, bindInfo);
              } else {
                resolve(res);
              }
            })
            .catch(err => {
              resolve({
                success: false,
                errCode: 'loginAgentEmail-Catch',
                errMsg: (err && err.message) || '登录失败',
              });
            });
          return;
        }
        if (bindInfo.accountType === SUB_ACCOUNT_TYPES.NETEASE_QIYE_MAIL) {
          const { agentEmail: email, password } = bindInfo;
          const isSubAccount = true;
          this.doPreLogin(email, isSubAccount, sessionName)
            .then(res => {
              if (!res) return true;
              const eventInfo: SimpleResult = {
                success: false,
              };
              if (typeof res === 'object' && res.err) {
                eventInfo.errMsg = res.errmsg;
              } else if (typeof res === 'string') {
                eventInfo.errMsg = res;
              } else {
                return true;
              }
              resolve(eventInfo);
              return false;
            })
            .then(pass => {
              if (pass) {
                this.doLogin({
                  account: email,
                  pwd: password,
                  isSubAccount: true,
                  sessionName,
                }).then(async res => {
                  const eventInfo: bindSubAccountPageReturnDataType = {
                    success: false,
                  };
                  if (res.pass) {
                    const uid = res.uid ? res.uid : '';
                    this.handleAddSubAccountSuccess(uid, resolve, bindInfo);
                    return;
                  }
                  if (res.errmsg) {
                    eventInfo.errMsg = res.errmsg;
                    eventInfo.errCode = 400;
                  } else if (res.secondCheck) {
                    if (res.showConfig) {
                      eventInfo.errMsg = '检测到您需要开启二次登录验证，请去Web端开启';
                      eventInfo.errCode = 500;
                    } else {
                      if (!this.actions.bindSubAccountInfo) {
                        this.actions.bindSubAccountInfo = {};
                      }
                      if (this.actions.bindSubAccountInfo) {
                        this.actions.bindSubAccountInfo.email = email;
                        this.actions.bindSubAccountInfo.sessionName = sessionName;
                      }
                      eventInfo.errMsg = res.mobile || '***********';
                      eventInfo.errCode = 600;
                    }
                  } else if (res.showResetPass) {
                    eventInfo.errMsg = '为保障帐户安全，管理员请您修改邮箱密码';
                    eventInfo.errCode = 700;
                  }
                  resolve(eventInfo);
                });
              }
            });
        }
      } catch (ex) {
        resolve({
          success: false,
          errMsg: DEFAULT_API_ERROR,
          errCode: 101,
        });
      }
    });
  }

  async bindAccountLoginWithCode(code: string): Promise<SimpleResult> {
    return new Promise((resolve, _) => {
      if (!this.actions.bindSubAccountInfo) {
        resolve({
          success: false,
          errMsg: '获取账号信息失败',
          errCode: 'LoginWithCode-Error',
        });
        return;
      }
      const sendEmail = this.actions.bindSubAccountInfo!.email;
      const sendSessionName = this.actions.bindSubAccountInfo!.sessionName;
      this.doLoginWithCode(code, 1, sendEmail, sendSessionName).then(res => {
        const eventData: bindSubAccountPageReturnDataType = {
          success: res.pass,
        };
        if (res.pass) {
          const uid = res.uid ? res.uid : '';
          this.handleAddSubAccountSuccess(uid, resolve, this.subAccountBindInfo || SUB_ACCOUNT_TYPES.NETEASE_QIYE_MAIL);
          return;
        }
        if (res.errmsg) {
          eventData.errMsg = res.errmsg;
        } else if (res.showResetPass) {
          eventData.errMsg = '为保障帐户安全，管理员请您修改邮箱密码';
          eventData.errCode = 700;
        }
        resolve(eventData);
      });
    });
  }

  async sendBindAccountVerifyCode(): Promise<SimpleResult> {
    return new Promise(async (resolve, _) => {
      if (!this.actions.bindSubAccountInfo) {
        resolve({
          success: false,
          errMsg: '获取账号信息失败',
          errCode: 'SendCode-Error',
        });
        return;
      }
      const sendEmail = this.actions.bindSubAccountInfo!.email;
      const sendSessionName = this.actions.bindSubAccountInfo!.sessionName;
      this.doSendVerifyCode(sendEmail, sendSessionName).then(res => {
        const retVal = {
          success: !res,
          errMsg: res,
          errCode: 300,
        };
        resolve(retVal);
      });
    });
  }

  async bindSubAccount(bindInfo: SubAccountBindInfo): Promise<SimpleResult> {
    const { agentEmail } = bindInfo;
    await this.stopBindAccount(agentEmail);
    this.subAccountBindInfo = bindInfo;
    const res = await this.bindSubAccountMail(bindInfo);
    if (!res.success) {
      if (!res.errMsg) {
        res.errMsg = DEFAULT_BIND_ACCOUNT_ERR;
      }
    }
    if (res.success || res.errCode?.toString() !== '600') {
      await this.stopBindAccount(agentEmail);
    }
    return res;
  }

  // 清空绑定过程中的子账号信息
  async stopBindAccount(email?: string) {
    this.subAccountBindInfo = null;
    const { actions } = this;
    if (actions.bindSubAccountInfo) {
      actions.bindSubAccountInfo = {};
    }
    if (email && actions.bindSubAccountCookieMapInfo) {
      actions.bindSubAccountCookieMapInfo[email] = {};
    }
  }

  private async addQiyeMailSubAccount(email: string): Promise<SimpleResult> {
    try {
      const url = this.systemApi.getUrl('addQiyeMailSubAccount');
      const res = await this.impl.post(url, { email }, { ...this.getCommonWebConfig() }).then(res => res.data);
      if (!res) {
        return {
          success: false,
          errMsg: DEFAULT_API_ERROR,
          errCode: 200,
        };
      }
      const code = res.code?.toString();
      if (code === '200') {
        return {
          success: true,
        };
      }
      const errCode = res?.errorCode!;
      if (errCode === 'ACCOUNT.LOGINREF.CREATE.OVERFLOW') {
        this.sendAgentAccountLimitToServer();
      }
      return {
        success: false,
        errMsg: SUB_ACCOUNT_ERRCODE_MAPS[errCode] || res.error || DEFAULT_BIND_ACCOUNT_ERR,
        errCode,
      };
    } catch (ex: any) {
      console.error('addQiyeMailSubAccount error', ex);
      return {
        success: false,
        errMsg: ex?.message || '',
        errCode: 'addQiyeMailSubAccount-catch',
      };
    }
  }

  private getBindAccountErrorMsg(res: ResponseData<any> | undefined) {
    const errorCode = res?.errorCode;
    const errorMsg = errorCode ? SUB_ACCOUNT_ERRCODE_MAPS[errorCode] || res?.err_msg || DEFAULT_API_ERROR : DEFAULT_API_ERROR;
    return errorMsg;
  }

  private getCommonWebConfig() {
    return {
      headers: COMMON_WEB_HEADER,
    };
  }

  private async addPersonalMailSubAccount(bindInfo: SubAccountBindInfo): Promise<SimpleResult> {
    try {
      const url = this.systemApi.getUrl('createPersonalSubAccount');
      const sendData: IAddPersonalSubAccountModel = {
        agent_email: bindInfo.agentEmail,
        agent_nickname: bindInfo.agentNickname,
        password: bindInfo.password,
        send_host: bindInfo.sendHost,
        send_port: bindInfo.sendPort,
        send_ssl: bindInfo.sendSsl,
        receive_protocol: bindInfo.receiveProtocol,
        receive_host: bindInfo.receiveHost,
        receive_ssl: bindInfo.receiveSsl,
        receive_port: bindInfo.receivePort,
      };
      const result = await this.impl.post(url, sendData, { ...this.getCommonWebConfig() }).then(res => res.data);
      if (result?.code?.toString() === '200') {
        return {
          success: true,
        };
      }
      if (result?.errorCode === 'AGENTACCOUNT.CREATE.BIND.OVERFLOW') {
        this.sendAgentAccountLimitToServer();
      }
      return {
        success: false,
        errCode: result?.errorCode,
        errMsg: this.getBindAccountErrorMsg(result),
      };
    } catch (ex: any) {
      return {
        success: false,
        errCode: 'addPersonalMailSubAccount-catch',
        errMsg: ex.message,
      };
    }
  }

  private fillSubAccountInfo(res: ResponseData<any>, agentEmail: string, isThirdAccount: boolean, sessionName?: string) {
    if (res && res.data) {
      res.data.isSubAccount = true;
      res.data.isThirdAccount = isThirdAccount;
      res.data.agentEmail = agentEmail;
      res.data.sessionName = sessionName;
    }
  }

  private async loginAgentEmail(email: string, sessionName?: string, setCookieSessionName?: string): Promise<SimpleResult> {
    try {
      const url = this.systemApi.getUrl('loginAgentEmail');
      const urlParamArr = process.env.BUILD_ISELECTRON
        ? [sessionName ? '_session=' + sessionName : '', setCookieSessionName ? '_setsession=' + setCookieSessionName : ''].filter(item => item)
        : [];

      const req = {
        agent_email: email,
        p: 'sirius-desktop',
        output: 'json',
        autoEntry: true,
      };
      if (process.env.BUILD_ISWEB) {
        this.fillAutoEntryAndNoCookieInfo(req);
      }

      const result = await this.impl.post(url + `${urlParamArr && urlParamArr.length ? '?' + urlParamArr.join('&') : ''}`, req).then(res => res.data);
      if (result?.code?.toString() === '200') {
        this.fillSubAccountInfo(result, email, true, setCookieSessionName);
        const ret = await this.processLoginResult(result);
        const uid = ret.uid || '';
        return {
          success: ret.pass,
          errCode: ret.errCode,
          errMsg: ret.errmsg,
          data: {
            email: uid,
          },
        };
      }
      return {
        success: false,
        errCode: result?.msgCode,
        errMsg: result?.msgCodeDesc,
      };
    } catch (ex: any) {
      return {
        success: false,
        errCode: 'loginAgentEmail-catch',
        errMsg: ex.message,
      };
    }
  }

  private sendAgentAccountLimitToServer() {
    this.dataTrackApi.track('pcMail_limit_LoginDetailPage_agent');
  }

  async getMailClientConfig(mailDomain: string): Promise<IMailClientConfig | null> {
    try {
      const url = process.env.BUILD_ISWEB ? (config('getMailClientConfig') as string) : this.systemApi.getUrl('getMailClientConfig');
      const result = await this.impl.get(url, { domain: mailDomain }).then(res => res.data);
      if (result?.code?.toString() === '200') {
        return result.data as IMailClientConfig;
      }
      return null;
    } catch (ex: any) {
      console.log('getMailClientConfig-catch', ex);
      return null;
    }
  }

  static waitTime(time: number) {
    return new Promise(resolve => {
      setTimeout(resolve, time);
    });
  }

  async getQRCodeStatus(uuid?: string): Promise<QRCodeCheckResult> {
    try {
      let qrCodeUuid: string;
      if (!uuid) {
        const cookies = await this.systemApi.doGetCookies(true);
        qrCodeUuid = cookies.miniapp_qrcode_uuid;
      } else {
        qrCodeUuid = uuid;
      }

      if (!qrCodeUuid) {
        return {
          success: false,
          errCode: 'No-QrCode-Uuid',
          errMsg: '未获取到二维码Id，请刷新',
        };
      }
      const res = await this.impl.get(this.systemApi.getUrl('qrcodeCheck'), { p: 'sirius', uuid: qrCodeUuid }).then(res => res.data);
      if (!res?.suc) {
        return {
          success: false,
          errCode: res?.error_code as string,
          errMsg: res?.error_msg as string,
        };
      }

      if (res.con) {
        const conData = res.con;
        if (conData.node) {
          this.setupNodeInfo(conData.node);
        }
        let errMsg = '';
        if (conData.loginMsg) {
          errMsg = LoginApiImpl.getErrMsg(conData.loginMsg);
        }
        const result: QRCodeCheckResult = {
          success: !errMsg,
          errMsg,
          data: {
            uuid: conData.uuid,
            status: conData.status,
            loginUrl: conData.loginUrl,
            node: conData.node,
            loginSuc: conData.loginSuc,
            loginMsg: errMsg,
          },
        };
        return result;
      }

      return {
        success: false,
        errCode: 'No-Con-Data',
        errMsg: '没有Con数据，请刷新',
      };
    } catch (ex) {
      console.error('getQRCodeStatus Error', ex);
      return {
        success: false,
        errCode: 'Catch',
      };
    }
  }

  async loginByQRCode(loginUrl: string, node: string): Promise<LoginModel> {
    try {
      const domainIndex = loginUrl.indexOf('/domain');
      let loginPath = domainIndex >= 0 ? loginUrl.substring(domainIndex) : '';
      if (!loginPath) {
        return {
          pass: false,
          errCode: 'no-login-path',
          errmsg: '获取登录信息失败',
        };
      }
      loginPath += '&autoEntry=true';
      const isDomesticHostType = this.systemApi.getIsDomesticHostType();
      const newLoginUrl = `${process.env.BUILD_ISWEB ? '' : isDomesticHostType ? config('domesticHost') : config('host')}${
        node === 'bj' ? loginPath.replace('/domain', '/bjdomain') : loginPath
      }`;
      const loginRes = await this.impl.post(newLoginUrl).then(res => res.data);
      const ret = await this.processLoginResult(loginRes!);
      if (ret.pass) {
        const loginUid = loginRes?.data?.uid;
        if (loginUid) {
          this.tryReportLoginSuccess(loginUid);
        }
      } else {
        if (ret.secondCheck) {
          if (ret.checkType === 'mobile') {
            ret.errmsg = '需要二次验证，请使用其它方式登录';
          }
          if (ret.checkType === 'mail') {
            ret.errmsg = '需要二次验证，请使用其它方式登录';
          }
        }
      }
      return ret;
    } catch (ex: any) {
      console.error('QRCodeLogin-error', ex);
      return {
        pass: false,
        errCode: 'catch',
        errmsg: ex.message,
      };
    }
  }

  async qrcodeCheck(uuid?: string, maxN = 720): Promise<SimpleResult> {
    let qrCookie = uuid;
    if (!uuid) {
      const cookies = await this.systemApi.doGetCookies(true);
      qrCookie = cookies.miniapp_qrcode_uuid;
    }
    if (maxN === 0) {
      return {
        success: false,
        errMsg: `超时${maxN / 2}次`,
      };
    }
    return this.impl
      .get(this.getUrl('qrcodeCheck'), { p: 'sirius', uuid: qrCookie })
      .then(async (rs: ApiResponse) => {
        const resData = rs.data;
        if (!resData?.suc) {
          return {
            success: false,
            errMsg: resData?.error_msg,
            errCode: resData?.error_code,
          };
        }
        if (resData.con) {
          if (resData.con.status === QrCheckStatus.init || resData.con.status === QrCheckStatus.scaning) {
            // 因为接口间隔太短， 所以maxN 为100 只能执行50次
            await LoginApiImpl.waitTime(1000);
            return this.qrcodeCheck(qrCookie, maxN - 1);
          }
          // 扫码成功/已过期
          return {
            success: true,
            data: resData.con,
          };
        }
        return {
          success: false,
        };
      })
      .catch(reason => {
        console.log('[login] qrcodeCheck check error', reason);
        return {
          success: false,
          errMsg: `${reason}`,
        };
      });
  }

  getLoginQrCodeImgUrl(params?: { w: number; h: number }): string {
    const imgWidth = params && params.w ? params.w : 200;
    const imgHeight = params && params.h ? params.h : 200;
    const type = inWindow() && window && window.electronLib ? 7 : 6;
    // type 6 灵犀web 7 桌面端
    return this.systemApi.getUrl('qrCodeCreate') + `?w=${imgWidth}&h=${imgHeight}&type=${type}&ts=${new Date().getTime()}`;
  }

  private customHostSwitchSharedAccount(account: string, domain: string): SimpleResult {
    try {
      const currentNode = (this.systemApi.getCurrentNode() || 'hz') as 'hz' | 'bj';
      const nodeUrlMap = {
        hz: 'hz',
        bj: '',
      };
      const nodeUrl = nodeUrlMap[currentNode] || '';
      const stage = config('stage');
      const isPrevOrProd = stage === 'prev' || stage === 'prod';
      const switchHost = isPrevOrProd ? `https://entry${nodeUrl}.qiye.163.com` : 'https://entrydev.qiye.163.com';
      location.href = switchHost + `/login/sharedSwitchLogin?account_name=${account}&domain=${domain}&autoEntry=true`;
      return {
        success: true,
      };
    } catch (ex) {
      return {
        success: false,
        errCode: 'customHostSwitchSharedAccount-catcherror',
        errMsg: '切换公共账号失败',
      };
    }
  }

  /**
   * 切换账号
   * @param email 需要切换的email
   * @returns
   */
  async switchSharedAccount(email: string, noReload?: boolean): Promise<SimpleResult> {
    try {
      const emailInfo = this.handleAccountAndDomain(email);
      if (!emailInfo.account || !emailInfo.domain) {
        return {
          success: false,
          errCode: 'ParamError',
          errMsg: '参数错误，邮箱格式错误',
        };
      }
      if (process.env.BUILD_ISWEB && process.env.BUILD_ISLINGXI) {
        const isCustomHost = this.systemApi.getIsWebCustomHost();
        if (isCustomHost) {
          return this.customHostSwitchSharedAccount(emailInfo.account, emailInfo.domain);
        }
      }
      let isSharedAccountLogin = false;
      let sharedAccountInfo: ICurrentAccountAndSharedAccount | null = null;
      let originAccount = '';
      if (!noReload) {
        sharedAccountInfo = await this.accountApi.getSharedAccountsInfoAsync();
        if (sharedAccountInfo) {
          isSharedAccountLogin = sharedAccountInfo.isSharedAccountLogin;
          originAccount = sharedAccountInfo.isSharedAccountLogin && !sharedAccountInfo.isSharedAccountExpired ? sharedAccountInfo.email : '';
        }
      }
      const url = this.systemApi.getUrl('switchSharedAccount');
      if (!noReload) {
        this.systemApi.switchLoading(true);
        this.disableBackgroundDB();
        this.impl.setLogoutStatus(true);
        this.noLoginEvent = true;
        if (process.env.BUILD_ISELECTRON) {
          try {
            await window.electronLib.windowManage.closeAllWindowExceptMain(true);
          } catch (ex: any) {
            console.error('closeAllWindowExceptMain error', ex);
          }
        }
      }

      const resData = await this.impl
        .get(
          url,
          {
            ...defaultLoginInfo,
            ...{ account_name: emailInfo.account, domain: emailInfo.domain, autoEntry: true },
          },
          noHeaderTokenConfig
        )
        .then(res => res.data!);
      // 是否切换到公共账号
      resData.data!.isSharedAccountSwitch = noReload
        ? true
        : sharedAccountInfo && sharedAccountInfo.sharedAccounts && sharedAccountInfo.sharedAccounts.some(item => item.email === email)
        ? true
        : !isSharedAccountLogin;
      resData.data!.originAccount = originAccount;

      const currentNode = this.storeApi.getCurrentNode();
      if (currentNode && currentNode !== this.actions.currentNode) {
        this.actions.currentNode = currentNode;
      }
      resData.data!.noEnableBackDb = true;
      const loginResult = await this.processLoginResult(resData!);
      if (!loginResult || !loginResult.pass) {
        if (!noReload) {
          this.enableBackgroundDB();
          this.systemApi.switchLoading(false);
          this.impl.setLogoutStatus(false);
          this.noLoginEvent = false;
        }
        return {
          success: false,
          errCode: loginResult.errCode,
          errMsg: loginResult.errmsg,
        };
      }
      if (window) {
        if (!noReload) {
          this.systemApi.switchLoading(true);
          if (process.env.BUILD_ISELECTRON) {
            setTimeout(() => {
              this.createBKStableWindow();
            }, 0);
            await wait(300);
          }
          this.systemApi.reloadToMainPage();
        }
      }
      return {
        success: true,
      };
    } catch (ex: any) {
      this.systemApi.switchLoading(false);
      this.enableBackgroundDB();
      this.impl.setLogoutStatus(false);
      this.noLoginEvent = false;
      console.error('switchSharedAccount error', ex);
      const res: SimpleResult = {
        success: false,
        errCode: 'Catch-Error',
        errMsg: ex.message,
      };
      return res;
    }
  }

  // 获取登陆态的code
  getLoginCode(): Promise<string> {
    const url = this.systemApi.getUrl('getLoginCode');
    return this.impl.get(url).then((rs: ApiResponse<string>) => {
      const resData = rs.data;
      if (resData?.code === 0 && resData?.data) {
        return resData.data;
      }
      return '';
    });
  }

  // 获取是否展示跳转外贸体验版的入口
  getEntranceVisibleConfig(): Promise<EntranceVisibleConfig> {
    const url = this.systemApi.getUrl('getEntranceVisibleConfig');
    return this.impl.get(url).then((rs: ApiResponse<{ show: boolean; showPopup: boolean }>) => {
      const resData = rs.data;
      if (resData?.code === 0 && resData?.data) {
        return {
          showTab: resData.data.show,
          showPopup: resData.data.showPopup,
        };
      }
      return {
        showTab: false,
        showPopup: false,
      };
    });
  }

  // 获取是否展示跳转外贸体验版的入口
  setEntrancePopupVisible(source: string): Promise<boolean> {
    const url = this.systemApi.getUrl('setEntrancePopupVisible');
    return this.impl.post(url, { source }).then((rs: ApiResponse<boolean>) => {
      const resData = rs.data;
      return resData?.code === 0 && !!resData?.data;
    });
  }

  private resetLoginState() {
    this.impl.setLogoutStatus(false);
    this.systemApi.switchLoading(false);
    this.enableBackgroundDB();
  }

  private async setStateBeforeSwitchLogin() {
    this.systemApi.switchLoading(true);
    this.impl.setLogoutStatus(true);
    this.disableBackgroundDB();
    if (process.env.BUILD_ISELECTRON) {
      try {
        await window.electronLib.windowManage.closeAllWindowExceptMain(true);
      } catch (ex: any) {
        console.error('closeAllWindowExceptMain error', ex);
      }
    }
  }

  private async createNewAccountBkStableWindow(noEnableDb?: boolean) {
    try {
      if (process.env.BUILD_ISELECTRON) {
        setTimeout(() => {
          this.createBKStableWindow();
        }, 0);
        await wait(300);
      }
      if (noEnableDb) {
        this.enableBackgroundDB();
      }
    } catch (ex) {
      console.error('ex');
    }
  }

  async doAutoLoginInCurrentPage(email: string, shouldReload?: boolean) {
    const defaultErrorRes: LoginModel = {
      pass: false,
      errmsg: '',
    };
    try {
      if (!email) {
        return defaultErrorRes;
      }
      await this.setStateBeforeSwitchLogin();
      const res = await this.doAutoLogin(email, true, true);
      if (!res.pass) {
        this.resetLoginState();
        return res;
      }
      await this.createNewAccountBkStableWindow(true);
      if (shouldReload) {
        this.systemApi.reloadToMainPage();
      } else {
        this.resetLoginState();
      }
      return res;
    } catch (ex) {
      this.resetLoginState();
      console.error('doAutoLoginInCurrentPage-error', ex);
      return defaultErrorRes;
    }
  }

  async sendSelfUnBlockingCode(): Promise<SimpleResult> {
    try {
      const url = this.impl.buildUrl(this.getUrl('sendCode'), {
        ...(this.actions && this.actions.currentPreloginRequest ? this.actions.currentPreloginRequest : {}),
        output: 'json',
        type: 3,
      });

      return this.impl
        .get(url, {}, {})
        .then(this.unpackLoginData.bind(this))
        .then(({ code, msgCode }: ResponseData) => {
          if (String(code) === '200') {
            return {
              success: true,
            };
          }
          const errorStr = msgCode === 'ERR.LOGIN.MLOGINSMSREQ' ? '今日此手机验证码获取次数已达到上限' : LoginApiImpl.getErrMsg(msgCode) || SEND_CODE_DEFAULT_ERROR;
          return {
            success: false,
            errMsg: errorStr,
          };
        })
        .catch(reason => {
          console.error(reason);
          return {
            success: false,
            errMsg: SEND_CODE_DEFAULT_ERROR,
          };
        });
    } catch (ex) {
      return {
        success: false,
        errMsg: SEND_CODE_DEFAULT_ERROR,
      };
    }
  }

  async selfUnBlockingWithCode(code: string): Promise<SimpleResult> {
    try {
      const url = this.getUrl('selfUnBlocking');
      return this.impl
        .post(url, {
          p: productCode,
          code,
          output: 'json',
        })
        .then(this.unpackLoginData.bind(this))
        .then(res => {
          if (res && res.code && res.code.toString() === '200') {
            return {
              success: true,
            };
          }
          const msgCode = res.msgCode || '';
          const errorMsg = msgCode ? LoginApiImpl.getErrMsg(msgCode, SELF_UNBLOCK_DEFAULT_ERROR) : SELF_UNBLOCK_DEFAULT_ERROR;
          return {
            success: false,
            errMsg: errorMsg,
          };
        })
        .catch(err => {
          console.error(err);
          return {
            success: false,
            errMsg: SELF_UNBLOCK_DEFAULT_ERROR,
          };
        });
    } catch (ex) {
      console.error(ex);
      return {
        success: false,
        errMsg: SELF_UNBLOCK_DEFAULT_ERROR,
      };
    }
  }

  async sendUnBlockingEmailToAdmin(): Promise<SimpleResult> {
    try {
      const url = this.getUrl('applyUnBlocking');
      return this.impl
        .post(url, {
          p: productCode,
          output: 'json',
        })
        .then(this.unpackLoginData.bind(this))
        .then(res => {
          if (res && res.code && res.code.toString() === '200') {
            return {
              success: true,
            };
          }
          const msgCode = res.msgCode || '';
          const errorMsg = msgCode ? LoginApiImpl.getErrMsg(msgCode, SELF_UNBLOCK_DEFAULT_ERROR) : SELF_UNBLOCK_DEFAULT_ERROR;
          return {
            success: false,
            errMsg: errorMsg,
          };
        })
        .catch(err => {
          console.error(err);
          return {
            success: false,
            errMsg: SELF_UNBLOCK_DEFAULT_ERROR,
          };
        });
    } catch (ex) {
      console.error(ex);
      return {
        success: false,
        errMsg: SELF_UNBLOCK_DEFAULT_ERROR,
      };
    }
  }
}

const loginApiImpl: Api = new LoginApiImpl();
api.registerLogicalApi(loginApiImpl);
export default loginApiImpl;
