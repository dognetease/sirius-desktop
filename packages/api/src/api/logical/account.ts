/**
 * 用户账户相关的api，可获取各种用户的服务器端及本地的设置选项
 */

import { CreateWindowRes } from 'env_def';
import { Api, intBool } from '../_base/api';
import {
  AccountInfoTable,
  AccountTable,
  AliasMailAccountInfoTable,
  MobileAccountInfoTable,
  SubAccountTableModel,
  SubAccountQuery,
  ICurrentAccountInfo,
  SubAccountServerModel,
  SubAccountWinCreateInfo,
} from '@/api/data/tables/account';
import { accountType, AccountTypes, SimpleResult } from '@/api/logical/login';
import { StringMap } from '@/api/commonModel';

export interface BindAccountInfo {
  account_id: string; // 账号id
  domain: string; // 域名
  account_name: string; // 邮箱账号前缀
  status: number; // 账号状态：http://doc.hz.netease.com/pages/viewpage.action?pageId=276004008
  account_exp: boolean; // 账号是否过期
  mobile_login_enable: boolean; // 是否启用手机验证码登录功能
  mobile_login_time: number; // 最近使用手机验证码登录的时间，为0表示未登录过，或者被重置为需要验证一次账号密码
  token: string; // 登录token，不一定返回，仅当对应账号可以登录系统时出现
  mobile: string; // 手机号码
  area: string; // 地区
  nickname?: string;
}

export interface AccountMailInfo {
  id: number;
  senderName: string;
  email: string;
  nickName: string;
  delegatedSend?: boolean;
}

export interface OrgUnitList {
  contactCount: number;
  oriUnitId: string;
  parentUnitId: string;
  showCode: intBool;
  showReason: string;
  status: intBool;
  type: number;
  unitId: string;
  unitName: string;
  unitRank: number;
}

export interface FetchAccountByEmailApiRet {
  /** 企业id * */
  orgId: number;
  /** 企业账号id */
  qiyeAccountId: number;
  /** 访问节点 */
  node: 'hz' | 'bj';
  /** 邮箱账号 * */
  email: string;
  /** 账号名称，email账号的前半部分 */
  accountName: string;
  /** 昵称 */
  nickName: string;
  /** 别名邮箱列表 */
  aliasList: AccountMailInfo[];
  /** 域名列表，包括主域名和别名域名 */
  domainList: string[];
  /** 默认发件人 */
  defaultSender: AccountMailInfo;
  /** Pop代收代发邮件列表 */
  popAccountList: AccountMailInfo[];
  /** 云信 id * */
  yunxinAccountId: string;
  /** 云信 token */
  yunxinToken: string;
  /** 云信 token 过期时间 */
  yunxinTokenExpireTime: number;
  /** 头像 */
  iconVO: {
    bigUrl: string;
    mediumUrl: string;
    smallUrl: string;
    pendantUrl: string;
  };
  unitPathList: OrgUnitList[];
  [key: string]: any;
}

export interface AccountCommonRes {
  success: boolean;
  message?: string;
}

export interface AccountRes<T = any> extends AccountCommonRes {
  data?: T;
}

export interface MobileAccountInfo {
  domain: string;
  accountName: string;
  // 当前账号状态
  status: number;
  // 是否过期
  expired: boolean;
  // 是否开启手机号登录
  enabledMobileLogin: boolean;
  // 最后登录时间
  lastLoginTime: number;
  mobile: string;
  // 登录的token
  token: string;
  area: string;
  nickName?: string;
}

export type GetMailAliasConf = {
  // 是否展示添加主账号
  noMain?: boolean;
  // 是否展示代收账号
  showProxyEmails?: boolean;
  email?: string;
};

export type AccountInfo = Omit<AccountTable, 'token' | 'cookies'>;

export interface AccountModel {
  current?: AccountInfo;
  localList: AccountInfo[];
  mobileList: MobileAccountInfoTable[];
  aliasList: AliasMailAccountInfoTable[];
}

export interface MailAliasAccountModel {
  senderName?: string; // 昵称
  fid?: number;
  color?: number;
  name: string;
  id: string; // 邮箱地址
  editId?: number;
  domain: string;
  isProxy?: boolean;
  isDefault?: boolean; // 默认
  isMainEmail?: boolean; // 主邮箱 or 别名
  mailEmail?: string; // 主邮箱
  isMainAccount?: boolean; // 主账号 or 挂载账号
  nickName?: string;
  isSubAccount?: boolean;
  agentEmail?: string;
  currentMailCid?: number;
}
export interface AccountTableUpdateParams extends Partial<AccountTable> {
  id: string;
  expired?: boolean;
}

export interface AccountWinInfo {
  email: string;
  winId: number;
  webId: number;
  agentEmail?: string;
}

export interface IWinInfoQuery {
  email?: string;
  winId?: number;
}

export interface ISharedAccount {
  email: string;
  nickName: string;
  units: Array<string>;
  enabled: boolean;
  isCurrentAccount: boolean;
  avatar?: string;
  unread?: boolean;
}

export interface ICurrentAccountAndSharedAccount {
  email: string;
  nickName: string;
  alias: Array<string>;
  isSharedAccountLogin: boolean;
  isSharedAccount: boolean;
  sharedAccounts: Array<ISharedAccount>;
  isSharedAccountExpired?: boolean;
  unread?: boolean;
}

/**
 *
 */

export interface AccountApi extends Api {
  doGetInitModule(): Set<string>;

  doGetAccountList(isCache?: boolean): Promise<AccountModel>;

  doCleanAllAccount(): Promise<AccountCommonRes>;

  doTransMobileBindAccountList(list: BindAccountInfo[]): MobileAccountInfo[];

  doBindMobile(code: string, mobile: string): Promise<AccountCommonRes>;

  doUpdateBindMobile(code: string, mobile: string): Promise<AccountCommonRes>;

  doUnBindMobile(code: string): Promise<AccountCommonRes>;

  doGetVerifyCode(mobile: string, isCancel?: boolean): Promise<AccountCommonRes>;

  doSaveCurrentAccount(user: AccountTable): Promise<AccountCommonRes>;

  doGetAccount(params: { accountName?: string; domain?: string }): string;

  doGetMobileAndArea(mobile?: string): { mobileArea: string; mobile: string };

  doGetMobileAccountInfo(id: string): Promise<MobileAccountInfoTable[]>;

  doGetAccountInfo(id?: string[], isSubAccount?: boolean): Promise<AccountTable[]>;

  doUpdateAccountList(params: AccountTableUpdateParams[]): Promise<any>;

  doDeleteAccountList(params: string[]): Promise<boolean>;

  doDeleteAccountInfoList(params: string[]): any;

  doSaveStorageAccount(list: accountType[]): Promise<AccountTable[]>;

  doGetAccountIsAdmin(): Promise<boolean>;

  doGetAccountIsNewAccount(): Promise<boolean>;

  doGetAccountBindInfo(): Promise<string>;

  doGetAccountBindAndForwardInfo(): Promise<Record<string, any>>;

  doSendVerificationCode(): Promise<Record<string, any>>;

  doCheckVerificationCode(vcode: string): Promise<Record<string, any>>;

  storeAccountList(params: AccountTable[]): Promise<AccountTable[]>;

  storeAccountInfoList(params: AccountInfoTable[]): Promise<AccountInfoTable[]>;

  doGetAllAccountList(): Promise<[AccountTable[], AccountInfoTable[]]>;

  getCurrentAccountInfo(emailAddress: string, account?: string): Promise<FetchAccountByEmailApiRet>;

  /**
   * 获取当前email是否在当前domain
   */
  doGetEmailInCurrentDomain(email: string): boolean;

  /**
   * 列出用户邮箱别名
   */
  doGetMailAliasAccountListV2(conf?: GetMailAliasConf): Promise<MailAliasAccountModel[]>;

  getBindAccounts(params: any): any[];

  deleteLocalSubAccounts(query?: SubAccountQuery): Promise<boolean>;

  addOrUpdateLocalSubAccounts(models: Array<SubAccountTableModel>): Promise<SubAccountTableModel[]>;

  getSubAccounts(query?: SubAccountQuery): Promise<Array<SubAccountTableModel>>;

  getMainAndSubAccounts(query?: SubAccountQuery): Promise<Array<SubAccountTableModel>>;

  isSubAccount(email: string): Promise<boolean>;

  deleteBindAccount(account: { email: string; agentEmail: string; accountType: string }): Promise<SimpleResult>;

  getCurrentAccount(): ICurrentAccountInfo | null;

  setCurrentAccount(param: ICurrentAccountInfo): void;

  editSubAccount(param: SubAccountServerModel): Promise<SimpleResult>;

  getBindAccountsFromServer(): Promise<Array<SubAccountServerModel> | null>;

  getPersonalBindAccountsFromServer(): Promise<Array<SubAccountServerModel> | null>;

  setQiyeMailSubAccoutNickName(param: { email: string; nickName: string }): Promise<SimpleResult>;

  getQiyeMailSubAccountNickName(param: { email: string }): Promise<SimpleResult>;

  getAllSubAccounts(): Promise<Array<SubAccountServerModel>>;

  createSubAccountWin(info: SubAccountWinCreateInfo): Promise<CreateWindowRes | undefined>;

  getSubAccountSid(email: string): string;

  getLocalSubAccountsFromCache(query?: SubAccountQuery): Array<SubAccountTableModel>;

  doGetAllMainAndSubAccounts(): Promise<AccountTable[]>;

  editSubAccountNickName(param: { email: string; nickName: string }): Promise<SimpleResult>;

  getAccountWinInfosFromMainProcess(query: IWinInfoQuery): Promise<Array<AccountWinInfo>>;

  getSharedAccountsInfoAsync(refresh?: boolean): Promise<ICurrentAccountAndSharedAccount | null>;

  getIsSharedAccountAsync(): Promise<boolean>;

  getIsSameSubAccountSync(email1?: string, email?: string): boolean;

  getIsSharedAccountLoginAsync(): Promise<boolean>;

  getNodeInfoByEmail(email: string, _account?: string): string;

  doSyncDomainShareList(): Promise<Record<string, string>>;

  getSubAccountInfo(name: string): SubAccountTableModel | null;

  getSubAccountsEmailType(email: string): AccountTypes;
  // 获取账号类型
  getAccountsEmailType(email: string): AccountTypes;

  sendCosUpgrade(type: number): Promise<{ code?: number | string; result?: StringMap }>;

  getEmailIdByEmail(email: string, returnExpired?: boolean): string;

  getAccountWinInfos(query?: IWinInfoQuery): Array<AccountWinInfo>;

  getAgentEmailByEmail(email: string): string;

  deleteSubAccountLocalStateByEmail(email: string): Promise<boolean>;

  updateSidebarDockUnreadStatus(accountList: string[], isUnread: boolean): Promise<void>;

  getSidebarDockAccountList(cached?: boolean): Promise<any>;
}
