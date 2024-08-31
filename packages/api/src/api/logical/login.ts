import { CookieStore, CreateWindowRes } from 'env_def';
import { Api, commonMessageReturn, intBool, User } from '../_base/api';
import { MailAliasAccountModel, MobileAccountInfo } from '@/api/logical/account';

// ---------------------------- request define start ---------------------------------- //
/**
 对应/domain/preLogin接口输入
 */
export interface RequestPreLoginData {
  p: string;
  account?: string;
  domain?: string;
  account_name?: string;
  mobile?: string;
  type?: 0 | 1;
  sendCodeType?: 0 | 1 | 2;
  code?: string;
  callback?: string;
  isSubAccount?: boolean;
  sessionName?: string;
  email?: string;
  _session?: string;
}

/**
 对应/domain/preLogin接口输出
 */
export interface ResponsePreLoginData {
  rand?: string;
  pubid?: string;
  sys?: string;
  modulus?: string;
  exponent?: string;
  node?: string;
  verify_code?: boolean;
  locked?: boolean;
  err: boolean;
  errmsg?: string;
  isCorpMailMode?: boolean;
  sid?: string;
  isSubAccount?: boolean;
  sessionName?: string;
  email?: string;
}

/**
 * 1 明文 | 2 md5 hashed | 3 rsa encrypted
 */
export type LoginPasswordType = 1 | 2 | 3;
/**
 * ZH_CN 中文简体 | ZH_TW 中文繁体 | EN_US 英文
 */
export type LanguageOfHost = 'zh_CN' | 'zh_TW' | 'en_US';
export type StoredAccount = {
  account_name: string;
  password: string;
  user?: User;
  failedTime?: string;
  needVerify?: boolean;
  canLogin?: boolean;
  aliasEmailList?: MailAliasAccountModel[];
  isCurrent?: boolean;
  lastLogin: number;
};

/**
 * 对应domain/domainEntLogin接口输入
 */
export interface RequestLoginData {
  p: string;
  domain: string;
  account_name: string;
  password: string;
  passtype: LoginPasswordType;
  secure: intBool;
  all_secure: intBool;
  hl: LanguageOfHost;
  output?: string;
  support_verify_code: intBool;
  deviceid: string;
  verify_code?: string;
  mockErrCode?: string;
  uid?: string;
  sessionName?: string;
  isSubAccount?: boolean;
  autoEntry?: boolean;
  excludeCookie?: string;
  authResponse?: string;
}

/**
 * 对应domain/domainEntLogin接口输出
 */
export interface ResponseLoginData {
  cookieName?: string;
  location?: string;
  nickname?: string;
  pass?: boolean;
  redirect?: string;
  smsVerifySuccessPath?: string;
  mobile?: string;
  eauthEmail?: string;
  uid?: string;
  errMsg?: string;
  errCode?: string;
  /**
   * 企业名称
   */
  orgName?: string;
  // corp新增
  sid?: string;
  accessToken?: string;
  accessSecret?: string;
  nonce?: string;
  // 手机号登录用来 重登的token
  refreshToken?: string;
  // 手机号登录用来 重登的token过期时间
  refreshTokenExpire?: number;

  isSharedAccountSwitch?: boolean;

  originAccount?: string;

  noEnableBackDb?: boolean;

  isSubAccount?: boolean;

  isThirdAccount?: boolean;

  agentEmail?: string;

  sessionName?: string;

  token?: string;

  mCoremail?: string;

  coremail?: string;

  sess?: string;
}

export interface RequestMobileLoginData {
  p: string;
  domain: string;
  account_name: string;
  pass_2fa: intBool;
  code: string;
  output?: string;
  sessionName?: string;
  email?: string;
  isSubAccount?: boolean;
  autoEntry?: boolean;
}

// ---------------------------- request define end ---------------------------------- //
export interface LoginCommonModel {
  /**
   * 错误信息
   */
  errmsg: string;
  errCode?: string;
}

/**
 * 反馈ui侧的登录返回Model
 */
export interface LoginModel extends LoginCommonModel {
  /**
   * 是否通过
   */
  pass: boolean;
  /**
   * 是否超时
   */
  timeout?: boolean;
  /**
   * 是否需要二次验证
   */
  secondCheck?: boolean;
  /**
   * 二次验证方式
   */
  checkType?: 'mobile' | 'mail';
  /**
   * 二次验证用于展示的mobile用户信息
   */
  mobile?: string;
  /**
   * 二次验证用于展示的email
   */
  eauthEmail?: string;
  /**
   * 登录成功后的跳转地址
   */
  redirectUrl?: string;
  /**
   * 需要设置二次登录方式
   */
  showConfig?: boolean;
  /**
   * 需要重新设置密码
   *
   */
  showResetPass?: boolean;
  /**
   * 企业名称
   */
  orgName?: string;

  isSharedAccoutnSwitch?: boolean;

  noEnableBackDb?: boolean;

  isSubAccount?: boolean;

  isThirdAccount?: boolean;

  agentEmail?: string;

  sessionName?: string;

  uid?: string;

  spamLock?: boolean;
  spamType?: 'auto' | 'apply';
}

export interface LoginParams {
  account: string; // 用户账号
  pwd: string; // 用户密码
  isAutoLogin?: boolean; // 是否自动登录
  verifyCode?: string; // 图形验证码
  mockErrCode?: string; // 测试功能，用于返回指定错误码，仅当实现为LoginMockApi时可用
  isUnLockApp?: boolean;
  isSubAccount?: boolean;
  sessionName?: string;
  noEnableBackDb?: boolean;
}

export interface LoginEncryptParams {
  originPwd: string; // 原来的密码
  originAccount: string; // 原来的账号
  rsaEncrypt?: boolean; // rsa加密
  md5Encrypt?: boolean; //  md5加密
  isSubAccount?: boolean;
  email?: string;
}
export interface LoginEncryptRes {
  pwd: string;
  type: 'md5' | 'rsa' | 'plain';
}

/**
 * 密码验证规则
 */
export interface PwdRule {
  /**
   检查密码是否包含用户名
   */
  checkAccountName: boolean;
  /**
   * 检查密码是否包含姓名全拼大小写
   */
  checkNickName: boolean;
  /**
   * 连续数字长度, 0 不生效
   */
  seqNumLen: number;
  /**
   * 密码所含字符种类（大写、小写、数字、特殊字符）个数, 0 不生效
   */
  charTypeNum: number;
  /**
   * 连续字母长度，0 不生效
   */
  seqCharLen: number;
  /**
   * 连续相同字符长度
   */
  seqSameChar: number;
  /**
   * 密码最小长度
   */
  minLen: number;
  /**
   * 密码最大长度
   */
  maxLen: number;
  /**
   * 是否启用规则
   */
  enable: boolean;
}

export interface PwdRuleModel extends LoginCommonModel {
  /**
   * sign参数，后续改密码需传递该参数
   */
  sign?: string;
  /**
   * 密码验证规则
   */
  pwdrule?: PwdRule;
  /**
   * 当前用户的姓名转化为拼音
   */
  nickname?: string;
}

export interface MobileLoginValidateMailParams {
  account: string;
  password: string;
  currentAccountNode?: string;
  reg_code?: string;
  reg_mobile?: string;
}

export interface MobileTokenLoginParams {
  token: string;
  domain: string;
  account_name: string;
  autoEntry?: boolean;
}
export interface MobileCodeLoginParams {
  mobile: string;
  domain: string;
  code: string;
  account_name: string;
  type?: 0 | 1;
}

export interface MobileBindAccountLoginParams {
  domain: string;
  account_name: string;
}

export interface RefreshTokenLoginParams {
  domain: string;
  account_name: string;
  token: string;
  tokenExpire: number;
  isSubAccount?: boolean;
  autoEntry?: boolean;
  noEnableBackDb?: boolean;
}

export interface MobileLoginParams {
  domain: string;
  account_name: string;
  password: string;
  passtype: 1 | 2 | 3;
  unq_code?: string;
  reg_code?: string;
  reg_mobile?: string;
  pubid: string;
}

export interface PassWordType {
  plain: 1;
  md5: 2;
  rsa: 3;
}

export interface LoginSucceedRes {
  uid: string;
  nickname?: string;
  cookieName?: string;
  orgName?: string;
  cnName?: string;
  accessToken?: string;
  accessSecret?: string;
  isCorpMail?: boolean;
  mobile?: string;
  nonce?: string;
  isSharedAccountSwitch?: boolean;
  originAccountEmail?: string;
  noEnableBackDb?: boolean;
  isSubAccount?: boolean;
  isThirdAccount?: boolean;
  agentEmail?: string;
  sessionName?: string;
}

export type LoginType = 'mobile' | 'mail';

export interface LoginCommonRes<T = any> {
  success: boolean;
  message?: string;
  code?: string;
  data?: T;
}

export type QrcodeCreateParams = {
  w: number;
  h: number;
  type: number;
  domain: string;
};

export interface LoginApi extends Api {
  // /**
  //  * 预登录
  //  * @param req
  //  */
  // preLogin(req: RequestPreLoginData): Promise<ResponsePreLoginData>;
  // /**
  //  * 实际的业务逻辑
  //  * @param req  登录请求接口输入
  //  */
  // login(req: RequestLoginData): Promise<ResponseLoginData>;
  /**
   * 用户输入账号后预登录
   * @param account  用户账号
   */
  doPreLogin(account: string, isSubAccount?: boolean, sessionName?: string): Promise<string | undefined | ResponsePreLoginData>;

  /**
   * 手机号预登录
   * @param mobile 手机号
   * @param sendCodeType 默认1 参数类型，0用于2fa，1是验证码登录，2是注册
   */
  doMobilePreLogin(mobile: string, sendCodeType?: 0 | 1 | 2): Promise<string | undefined | ResponsePreLoginData>;

  /**
   * 用户输入账号密码正式登录
   * @LoginParams 登录参数
   */
  doLogin(params: LoginParams): Promise<LoginModel>;

  doMobileVerifyCode(code: string, isRegister?: boolean): Promise<LoginCommonRes<MobileAccountInfo[]>>;

  /* 用户手机号登录 */
  doMobileValidateAccountLogin(params: MobileLoginValidateMailParams): Promise<LoginModel>;

  /*
   * 用户手机号token登录lo
   *  */
  doMobileTokenLogin(params: MobileTokenLoginParams): Promise<LoginModel>;

  /**
   * 用户注册成功后通过已经验证过的code，和手机号等登录
   */

  doMobileCodeLogin(params: MobileCodeLoginParams): Promise<LoginModel>;

  /**
   * 用户手机号关联账号登录
   */
  doMobileBindAccountLogin(params: MobileBindAccountLoginParams): Promise<LoginModel>;

  /**
   * 用户RefreshToken登录
   */
  doRefreshTokenLogin(params: RefreshTokenLoginParams): Promise<LoginModel>;

  /**
   * 用户更新refreshToken
   */
  doUpdateRefreshToken(params: RefreshTokenLoginParams): Promise<LoginCommonRes>;

  /**
   * 跳转忘记密码页面
   * @param isCorpMail 是否是corp
   * @param email 邮箱
   */
  doOpenForgetPwdUrl(isCorpMail?: boolean, email?: string): commonMessageReturn;

  /**
   * 跳转试用页面
   */
  doOpenPromptPage(): commonMessageReturn;

  /**
   * 跳转配置二次验证界面
   */
  doOpenConfigPage(): commonMessageReturn;

  /**
   * 发送二次验证短信验证码
   */
  doSendVerifyCode(email?: string, sessionName?: string): Promise<string>;

  /**
   * 发送二次验证邮件
   */
  doSendVerifyMail(): Promise<string>;

  /**
   * 验证验证码，登录
   * @param code 验证码
   * @param needPersist 60天内免登录验证
   */
  doLoginWithCode(code: string, needPersist?: intBool): Promise<LoginModel>;

  /**
   * 邮箱验证码，登录
   * @param code 验证码
   * @param needPersist 60天内免登录验证
   */
  doLoginWithMail(code: string, needPersist?: intBool): Promise<LoginModel>;

  /**
   * 登出
   */
  doLogout(notDeleteAccount?: boolean, clearCookies?: boolean, noClearActionStore?: boolean): Promise<commonMessageReturn>;

  /**
   * 自动登录之前记录的已登录账户
   * @param account 要登录的账号
   */
  doAutoLogin(account: string, noLoginEvent?: boolean, noEnableBackDb?: boolean): Promise<LoginModel>;

  // doSwitchAccountBack(): void;

  /**
   * 自动授权登录
   * @param loginInfoKey 登录使用的授权key
   */
  doLoadDataAndAutoLogin(loginInfoKey: string): Promise<LoginModel>;

  /**
   * 绑定设备，多账号推送使用
   */
  bindAccountDevice(): Promise<void>;

  /**
   * 跳转登录，不包含清理数据逻辑，慎用
   */
  jumpLogin(): void;

  /**
   * 获取密码规则
   */
  doGetPasswordRules(): Promise<PwdRuleModel>;

  /**
   * 更新当前账号密码
   * @param pass 更新后的密码
   * @param sign 登录时修改密码需要传入 doGetPasswordRules 返回的sign，登录后的不需要
   * @param oldPass 原始密码，登录时修改密码可不传
   */
  doUpdatePassword(pass: string, sign: string, oldPass?: string): Promise<LoginModel>;

  /**
   * 检测账户密码是否与本地存储的相同
   * @param pwd  检测的密码
   * @param account  要检测的账号，不传则检查当前账号
   */
  doCheckPasswordMatch(pwd: string, account?: string): Promise<boolean>;

  refreshStatus(): void;

  /**
   * 获取图形验证码Url，仅在corpMail模式下支持
   */
  getVerifyCodeUrl(accountName: string, accountDomain: string, sid: string): string;

  reportLogoutToUser(jumpConfig?: LoginJumpConfig): void;

  doTryLoginWithCurrentState(emailAccount: string, sid: string, originAccount?: string): Promise<LoginModel>;

  setDeviceId(deviceId: string): Promise<void>;

  showCreateAccountPage(email?: string): void;

  setPreLoginPassed(val: boolean): void;

  getMailClientConfig(domain: string): Promise<IMailClientConfig | null>;

  stopBindAccount(): void;

  bindSubAccount(bindInfo: SubAccountBindInfo): Promise<SimpleResult>;

  sendBindAccountVerifyCode(): Promise<SimpleResult>;

  bindAccountLoginWithCode(code: string): Promise<SimpleResult>;

  qrcodeCheck(uuid?: string, n?: number): Promise<SimpleResult>;

  getLoginQrCodeImgUrl(options?: { w: number; h: number }): string;

  getQRCodeStatus(uuid?: string, isUnLockApp?: boolean): Promise<QRCodeCheckResult>;

  loginByQRCode(loginUrl: string, node: string): Promise<LoginModel>;

  createBKStableWindow(force?: boolean): Promise<CreateWindowRes | void>;

  switchSharedAccount(email: string, noReload?: boolean): Promise<SimpleResult>;

  getLoginCode(): Promise<string>;

  // getJumpUrl(code: string, redirectUrl: string): string;

  getEntranceVisibleConfig(): Promise<EntranceVisibleConfig>;

  setEntrancePopupVisible(source: string): Promise<boolean>;

  doAutoLoginInCurrentPage(email: string, shouldReload?: boolean): Promise<LoginModel>;
  sendSelfUnBlockingCode(): Promise<SimpleResult>;
  selfUnBlockingWithCode(code: string): Promise<SimpleResult>;
  sendUnBlockingEmailToAdmin(): Promise<SimpleResult>;
  reportEdmLogin(): Promise<void>;
}

export interface EntranceVisibleConfig {
  showTab: boolean;
  showPopup: boolean;
}

export interface LoginJumpConfig {
  jumpTo?: 'setting' | 'login';
  clearCookies?: boolean;
  notDeleteAccount?: boolean;
}

export interface accountType {
  a: string;
  k?: string;
  t?: string;
  tExpire?: number;
  user?: User;
  mobile?: string;
  failedTime?: string;
  needVerify?: boolean;
  lastLogin: number;
}

/**
 * 关闭多账号登陆弹窗
 * @param refresh 是否创建成功
 * @param email bind成功的email。单纯关闭则不传
 */
export type CloseMultAccountLoginInfo = {
  refresh: boolean;
  email?: string;
  norebind?: boolean;
  agentEmail?: string;
  password?: string;
};

export type CloseMultAccountLoginFun = (info: CloseMultAccountLoginInfo) => void;

export type AccountTypes = 'NeteaseQiYeMail' | 'QQMail' | 'TencentQiye' | 'Outlook' | 'Microsoft' | 'MicrosoftGlobal' | 'Gmail' | '163Mail' | '126Mail' | 'Others';
export interface BaseLoginInfo {
  accountType: AccountTypes;
  agentEmail: string;
  agentNickname?: string;
  password: string;
}

export type EmailAndPass = Pick<BaseLoginInfo, 'agentEmail' | 'password'>;

export type MultAccountsLoginWay = 'mailSetting' | 'mailList';
/**
 * 新建多账号登陆
 * @param type bind是绑定（仅传此参数）， rebind 是当前失效再次绑定
 * @param way 邮箱列表页：mailList， 设置页：mailSetting
 */
export interface MultAccountsLoginInfo {
  type: 'bind' | 'rebind';
  way: MultAccountsLoginWay;
  agentEmail?: string;
  accountType: AccountTypes;
  agentNickname?: string;
  password?: string;
}

export interface SubAccountBindInfo extends BaseLoginInfo {
  // agentEmail: string,
  // password: string,
  addSceneName?: 'mailList' | 'mailSetting'; // 埋点使用，添加的场景值
  agentNickname?: string;
  sendHost?: string;
  sendPort?: number;
  sendSsl?: 0 | 1;
  receiveProtocol?: 0 | 1;
  receiveHost?: string;
  receivePort?: number;
  receiveSsl?: 0 | 1;
  isEditMode?: boolean;
}

export interface IAddPersonalSubAccountModel {
  agent_email?: string;
  agent_nickname?: string;
  password?: string;
  send_host?: string;
  send_port?: number;
  send_ssl?: number;
  receive_protocol?: number;
  receive_host?: string;
  receive_port?: number;
  receive_ssl?: number;
}

export interface SimpleBindResult {
  success: boolean;
  errMsg?: string;
  errCode?: number;
}

export interface SimpleResult {
  success: boolean;
  errMsg?: string;
  errCode?: number | string;
  data?: any;
}

export interface QRCodeCheckResult {
  success: boolean;
  errCode?: number | string;
  errMsg?: string;
  data?: {
    uuid: string;
    status: 0 | 1 | 2; // 0，初始，1，被扫描，2，已验证，3，过期
    loginUrl?: string;
    node?: 'bj' | 'hz';
    loginSuc?: boolean;
    loginMsg?: string;
    pass2fa?: string;
  };
}

export interface ISubAccountEventData {
  mainAccount: string;
  subAccount: string;
  agentEmail?: string;
  winId?: number;
  webId?: number;
}
export interface ISubAccountPageInitEventData {
  currentHostType: 'smartDNSHost' | 'domestic';
  browserUUId: string;
  bindInfo: SubAccountBindInfo;
  sessionName: string;
  cookies?: CookieStore[];
  currentUser?: User;
  currentNode?: string;
}

export interface IMailClientConfig {
  smtp: {
    host: string;
    port: number;
    sslPort: number;
  };
  imap: {
    host: string;
    port: number;
    sslPort: number;
  };
}
