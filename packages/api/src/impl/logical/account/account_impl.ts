/* eslint-disable max-lines */
import cloneDeep from 'lodash/cloneDeep';
import { CreateWindowReq, CreateWindowRes, WinType } from 'env_def';
import { apis, inWindow } from '@/config';
import { anonymousFunction, Api, EmailAccountDomainInfo, PopUpMessageInfo, resultObject, User } from '@/api/_base/api';
import { api } from '@/api/api';
import { EventApi } from '@/api/data/event';
import { IntervalEventParams, SystemApi } from '@/api/system/system';
import { DataStoreApi } from '@/api/data/store';
import { ApiResponse, DataTransApi, ResponseData } from '@/api/data/http';
import { ProductAuthApi } from '@/api/logical/productAuth';
import { SUB_ACCOUNT_ERRCODE_MAPS } from '../_login/login_const';
import type { SystemEventTypeNames } from '@/api/data/event';
import {
  AccountApi,
  AccountCommonRes,
  AccountModel,
  AccountRes,
  AccountTableUpdateParams,
  BindAccountInfo,
  FetchAccountByEmailApiRet,
  MailAliasAccountModel,
  MobileAccountInfo,
  IWinInfoQuery,
  GetMailAliasConf,
  ICurrentAccountAndSharedAccount,
  ISharedAccount,
} from '@/api/logical/account';
import { util, wait } from '@/api/util';
import { AdQueryCondition, DbApiV2, DBList, QueryConfig, AdQueryConfig } from '@/api/data/new_db';
import { AccountInfoModel, MailConfApi, MailApi } from '@/api/logical/mail';
import {
  AccountInfoTable,
  AccountTable,
  AliasMailAccountInfoTable,
  lastLoginTimeOrder,
  MobileAccountInfoTable,
  DomainTable,
  SubAccountTableModel,
  SubAccountQuery,
  ICurrentAccountInfo,
  SubAccountServerModel,
  IServerPersonalSubAccount,
  MailSendReceiveInfo,
  SubAccountWinCreateInfo,
} from '@/api/data/tables/account';
import { accountType, AccountTypes, LoginApi, SimpleResult, SubAccountBindInfo } from '@/api/logical/login';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { ErrMsgCodeMap, ErrMsgType } from '@/api/errMap';
import { PerformanceApi } from '@/api/system/performance';
import { FetchAccountEmailListApi, FetchAccountReqApi } from '@/api/logical/im';
import { ContactAndOrgApi } from '@/api/logical/contactAndOrg';
import { StringMap } from '@/api/commonModel';
import { corpMailTransformResponse } from '../mail/corp_mail_utils';

const defaultHeader = {
  'Qiye-Header': 'sirius',
};

const defaultParams = {
  product: 'sirius',
};

const accountItemFilterName = 'accountItemFilterName';
const APP_SIDEBAR_DOCK_ACCOUNT_LIST = 'app_sidebar_dock_account_list'; // app侧侧边栏的账号列表

let subAccountsCache: Array<SubAccountTableModel> = [];

let sharedAccountInfoCache: ICurrentAccountAndSharedAccount | null = null;

let subAccountIdToAgentCache: { [key: string]: string } = {};

class AccountApiImp implements AccountApi {
  name: string;

  eventApi: EventApi;

  systemApi: SystemApi;

  contactApi: ContactAndOrgApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

  storeApi: DataStoreApi;

  httpApi: DataTransApi;

  productAuthApi: ProductAuthApi;

  private loginApi: LoginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;

  private performanceApi: PerformanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;

  mailConfigApi: MailConfApi;

  private readonly DBApi: DbApiV2;

  private dbName: DBList = 'account';

  private tableName = 'account';

  private subAccountTableName = 'subAccount';

  private domainTableName = 'domain';

  private infoTableName = 'accountInfo';

  private readonly encryptedPwdHead = 'encrypted:[';

  private readonly encryptedPwdTail = ']';

  private readonly subAccountDataCompleteKey = 'sub_account_data_complete';

  isInited = false;

  static isSaveCurrentUser: AccountTable | undefined;

  static subAccountIsSaveCurrentUserMap: { [key: string]: AccountTable | undefined } = {};

  initModule: Set<string> = new Set<string>();

  private isSyncAccountInfo = false;

  private requestAccountInfoList: Array<anonymousFunction<void, MailAliasAccountModel[] | undefined>> = [];

  static readonly RndSyncRate = Math.floor(6 * Math.random());

  private isSubAccountInited = false;

  dataTrackApi: DataTrackerApi;

  mailApi: MailApi;

  subAccounts: string[]; // 需要同步数据的挂载账号

  syncSubAccountTimer: NodeJS.Timeout | null;

  private loggerApi: DataTrackerApi;

  private sideBarDockAccountList: any = {};

  private updateAccountRefreshTokenHandle: IntervalEventParams = {
    eventPeriod: 'extLong',
    handler: ob => {
      // 90s 后执行自动同步
      if (ob.seq > 1 && ob.seq % 24 === AccountApiImp.RndSyncRate) {
        const currentUser = this.systemApi.getCurrentUser();
        if (currentUser) {
          this.doUpdateAccountRefreshToken();
          this.productAuthApi.saveAuthConfigFromNet();
        }
      }
    },
    id: 'refreshTokenAndUpdateAuthConfig',
    seq: 0,
  };

  currentDomainList: DomainTable[] = [];

  constructor() {
    this.name = apis.accountApiImpl;
    this.eventApi = api.getEventApi();
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.httpApi = api.getDataTransApi();
    this.DBApi = api.getNewDBApi();
    this.mailConfigApi = api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
    this.dataTrackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
    this.productAuthApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
    this.mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
    this.loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as unknown as DataTrackerApi;
    this.subAccounts = [];
    this.syncSubAccountTimer = null;
  }

  private getSid(email?: string) {
    const currentUser = this.systemApi.getCurrentUser(email);
    return currentUser?.sessionId || '';
  }

  // 这里也要调用accountInfo 但是只是要更新accountInfo中的domainShare字段
  async doSyncDomainShareList() {
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    if (isCorpMail) {
      return {};
    }

    const isMainAccount = !this.getIsAccountBg();
    if (!isMainAccount) {
      return {};
    }

    const url = this.systemApi.getUrl('getAccountInfo');
    const sid = this.getSid();
    const res = (await this.httpApi.get(url, { sid, needUnitNamePath: false })) as Record<'data', ResponseData<AccountInfoModel>>;

    const { domainShareList, authAccountType } = res.data.data!;

    // 设置domainShareList
    if (Array.isArray(domainShareList)) {
      const domainShareMap = Object.fromEntries(domainShareList!.map(item => [item.orgId, item.domain]));
      this.storeApi.setUserProp('domainShareList', domainShareMap, true);
      return domainShareMap;
    }
    if (typeof authAccountType === 'number') {
      this.storeApi.setUserProp('authAccountType', authAccountType + '');
    }
    return {};
  }

  async getAccountWinInfosFromMainProcess(query: IWinInfoQuery) {
    console.log(query);
    return [];
  }

  getAccountWinInfos(query?: IWinInfoQuery) {
    console.log(query);
    return [];
  }
  /**
   * 获取别名邮件v2
   * TODO : !! move to account api !!
   */
  async doGetMailAliasAccountListV2({ noMain = false, showProxyEmails = false, email = '' }: GetMailAliasConf = {}): Promise<MailAliasAccountModel[]> {
    const isSubAccount = !!email;
    if (this.isSyncAccountInfo && !isSubAccount) {
      return new Promise((res, rej) => {
        this.requestAccountInfoList.push((data: MailAliasAccountModel[] | undefined) => {
          if (data) {
            res(data);
          }
          rej(new Error('request error'));
        });
      });
    }
    const mainAccount = this.systemApi.getCurrentUser(email)?.id;
    const url = this.systemApi.getUrl('getAccountInfo');
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    let _defaultSender: string;
    if (!isCorpMail) {
      _defaultSender = await this.mailConfigApi.getDefaultSendingAccount(email);
    }
    const sid = this.getSid(email);
    if (!isSubAccount) {
      this.isSyncAccountInfo = true;
    }
    // v1.20版本不返回部门路径
    return this.httpApi
      .get(url, { sid, needUnitNamePath: false }, { _account: email })
      .then(res => {
        const isCorpMail = this.systemApi.getIsCorpMailMode();
        if (isCorpMail) {
          corpMailTransformResponse(res);
        }
        const data = res.data as ResponseData;
        return data;
      })
      .then(async (res: ResponseData<AccountInfoModel>) => {
        const {
          // 如果res.data.aliasList为null，aliasList不会赋值为默认值
          aliasList = [],
          domainList = [],
          domainLogo = '',
          popAccountList = [],
          accountName = '',
          // 主邮箱
          email = '',
          nickName = '',
          senderName = '',
          defaultSender,
          qiyeAccountId,
          domainShareList,
          node,
          authAccountType,
        } = res.data || {};

        // 设置domainShareList
        if (Array.isArray(domainShareList)) {
          const domainShareMap = domainShareList!.map(item => [item.orgId, item.domain]);
          this.storeApi.setUserProp('domainShareList', Object.fromEntries(domainShareMap), false, email);
          this.storeApi.setUserProp('companyId', `org_${res.data?.orgId || 0}`, false, email);
        }
        if (Array.isArray(domainList)) {
          this.storeApi.setUserProp('domainList', domainList, false, email);
        }

        if (node) {
          this.storeApi.setCurrentNode(node, isSubAccount ? email : undefined);
        }

        // v1.20修改 设置用户属性不需要实时写入 最后一步会执行写入
        if (qiyeAccountId) {
          this.storeApi.setUserProp('contactId', qiyeAccountId + '', false, email);
        }
        if (typeof authAccountType === 'number') {
          this.storeApi.setUserProp('authAccountType', authAccountType + '', false, email);
        }

        if (domainLogo) {
          this.storeApi.setUserProp('domainLogo', domainLogo, false, email);
        }

        const defaultAliasList: MailAliasAccountModel[] = !aliasList
          ? []
          : aliasList.map(alias => ({
              id: alias?.email,
              name: alias?.email?.split('@')[0] || '',
              domain: alias?.email?.split('@')[1] || '',
              nickName: alias?.nickName,
              senderName: alias?.senderName,
              // 是否为主邮箱
              isMainEmail: alias?.email === email,
              isDefault: alias?.email === defaultSender?.email,
              mailEmail: email,
            }));
        const domainAliasList: MailAliasAccountModel[] = !domainList
          ? []
          : domainList
              // .filter(domain=>domain!==email.split('@')[1])
              .map(domain => ({
                id: `${accountName}@${domain}`,
                name: accountName || nickName,
                domain,
                senderName,
                // 是否为主邮箱
                isMainEmail: `${accountName}@${domain}` === email,
                isDefault: defaultSender?.email === `${accountName}@${domain}`,
                mailEmail: email,
                nickName,
              }));
        const popoAliasList: MailAliasAccountModel[] = !popAccountList
          ? []
          : popAccountList?.map(({ email, nickName, senderName = '' }) => ({
              id: email,
              name: nickName,
              domain: email?.split('@')[1],
              isProxy: true,
              nickName,
              senderName,
              // 代发邮箱不可能是主邮箱
              isMainEmail: false,
              mailEmail: email,
              isDefault: email === _defaultSender, // _defaultSender[MailSettingKeys.nDefaultSendingAccount],
            }));

        /** 别名不展示代收邮箱 */
        const _result = showProxyEmails ? [...defaultAliasList, ...domainAliasList, ...popoAliasList] : [...defaultAliasList, ...domainAliasList];
        let result = _result
          // eslint-disable-next-line no-nested-ternary
          .sort((a, b) => (a.isDefault ? -1 : b.isDefault ? 1 : 0))
          // 去重
          .reduce<MailAliasAccountModel[]>((acc, item) => {
            if (acc.some(_item => _item.id === item.id)) {
              return acc;
            }
            return [...acc, item];
          }, []);

        if (isCorpMail) {
          // corpMail模式下将主账号加入accountAlias里
          const currentUser = this.systemApi.getCurrentUser();
          const hasMainAccount = !!result.find(item => item.id === currentUser?.id);
          if (!hasMainAccount) {
            result.push({
              nickName: currentUser?.nickName || currentUser?.accountName || accountName,
              name: accountName,
              id: currentUser?.id as string,
              domain: currentUser?.domain as string,
            });
          }
        }
        this.storeApi.setUserProp(
          'accountAlias',
          result.filter(info => !info.isProxy).map(info => info.id),
          true,
          email
        );
        if (noMain) {
          result = result.filter(aliasInfo => aliasInfo.id !== mainAccount);
        }
        if (!isSubAccount) {
          this.isSyncAccountInfo = false;
          this.requestAccountInfoList.forEach(_callback => {
            _callback(result);
          });
        }
        return result;
      })
      .catch(err => {
        console.error(err);
        if (!isSubAccount) {
          this.isSyncAccountInfo = false;
          this.requestAccountInfoList.forEach(_callback => {
            _callback(undefined);
          });
        }
        return [];
      });
  }

  /**
   * 获取当前用户的email
   * */
  getEmail() {
    const user = this.systemApi.getCurrentUser();
    return user?.id;
  }

  // eslint-disable-next-line class-methods-use-this
  getBindAccounts(params: any) {
    console.log(params);
    return [];
  }

  init(): string {
    const accountItemFilter = (item: resultObject, param?: QueryConfig) => {
      if (!param?.additionalData || !param.additionalData.mobile || !param.additionalData.accountId) {
        return false;
      }
      if (param?.additionalData?.type === 'mobile') {
        return item.type === 'mobile' && item.mobile === param?.additionalData?.mobile;
      }
      if (param?.additionalData?.type === 'alias') {
        return item.type === 'alias' && item.accountId === param?.additionalData?.accountId;
      }
      return (item.type === 'mobile' && item.mobile === param?.additionalData?.mobile) || (item.type === 'alias' && item.accountId === param?.additionalData?.accountId);
    };
    this.DBApi.addFilterRegistry({
      filterFunc: accountItemFilter,
      name: accountItemFilterName,
    });
    this.eventApi.registerSysEventObserver('updateUserInfo', {
      name: 'loginChangeAccountOb',
      func: async () => {
        const user = this.systemApi.getCurrentUser();
        if (user) {
          await this.doSaveCurrentAccount(user);
          this.eventApi.sendSimpleSysEvent('accountNotify');
        }
      },
    });
    this.eventApi.registerSysEventObserver('initModule', {
      name: 'initModuleOb',
      func: ev => {
        ev.eventStrData && this.initModule.add(ev.eventStrData);
      },
    });
    this.updateLocalSubAccountsCache();
    this.handleSubAccountDeleted();
    this.handleSubAccountDBChanged();
    const isMainPage = this.systemApi.isMainPage();
    if (isMainPage) {
      this.eventApi.registerSysEventObserver('sharedAccountLogout', {
        name: 'accountapi-sharedAccountLogout',
        func: ev => {
          if (!ev || !ev.eventData) return;
          const email = ev.eventData.id as string;
          this.handleSharedAccountLogout(email);
        },
      });
    }
    if (isMainPage || process.env.BUILD_ISWEB) {
      this.eventApi.registerSysEventObserver('SubAccountAdded', {
        name: 'accountapi-SubAccountAdded',
        func: ev => {
          setTimeout(() => {
            if (!ev || !ev.eventData) return;
            const { subAccount } = ev.eventData;
            if (subAccount) {
              this.doGetMailAliasAccountListV2({
                email: subAccount,
              });
            }
          }, 0);
        },
      });
    }
    return this.name;
  }

  private handleSubAccountDBChanged() {
    const events: Array<SystemEventTypeNames> = ['subAccountDBChanged', 'SubAccountDeleted', 'SubAccountWindowReady'];
    events.forEach(eventName => {
      this.eventApi.registerSysEventObserver(eventName, {
        name: 'accountApi-' + eventName,
        func: _ => {
          this.updateLocalSubAccountsCache();
        },
      });
    });
  }

  private handleSubAccountDeleted() {
    if (this.systemApi.isMainPage() || (window && window.isBridgeWorker)) {
      this.eventApi.registerSysEventObserver('SubAccountDeleted', {
        name: 'accountApi-handleSubAccountDeleted',
        func: ev => {
          if (ev && ev.eventData) {
            const { subAccount } = ev.eventData;
            const accountMD5 = this.systemApi.md5(subAccount, true);
            this.DBApi.removeAccountAction(accountMD5);
          }
        },
      });
    }
  }
  async updateSidebarDockUnreadStatus(accountList: string[], isUnread: boolean): Promise<void> {
    if (this.systemApi.getCurrentUser() && this.systemApi.isMainWindow()) {
      // const user = this.systemApi.getCurrentUser();
      // 侧边栏左下角用户列表
      const accountStoreData = await this.storeApi.getFromDB(APP_SIDEBAR_DOCK_ACCOUNT_LIST, { noneUserRelated: true });
      let list: any = {};
      try {
        if (accountStoreData && accountStoreData.suc && accountStoreData.data) {
          list = JSON.parse(accountStoreData.data) || {};
        }
        accountList.forEach(accountId => {
          list[accountId] = isUnread;
        });
        this.sideBarDockAccountList = { ...this.sideBarDockAccountList, ...list };
        this.storeApi.putToDB(APP_SIDEBAR_DOCK_ACCOUNT_LIST, JSON.stringify(list), { noneUserRelated: true });
      } catch (error) {
        console.warn('updateSidebarDockUnreadStatus parse error', error);
      }
    }
  }

  async getSidebarDockAccountList(cached = true): Promise<any> {
    // if (cached) {
    // if (this.systemApi.getCurrentUser() && this.systemApi.isMainWindow()) {
    // const user = this.systemApi.getCurrentUser();
    // 侧边栏左下角用户列表
    try {
      if (cached && Object.keys(this.sideBarDockAccountList).length > 0) {
        return { ...this.sideBarDockAccountList };
      }
      const accountStoreData = await this.storeApi.getFromDB(APP_SIDEBAR_DOCK_ACCOUNT_LIST, { noneUserRelated: true });
      if (accountStoreData && accountStoreData.suc && accountStoreData.data) {
        const res = JSON.parse(accountStoreData.data) || {};
        Object.keys(res).forEach(key => {
          this.sideBarDockAccountList[key] = res[key];
        });
      } else {
        this.storeApi.putToDB(APP_SIDEBAR_DOCK_ACCOUNT_LIST, JSON.stringify({}), { noneUserRelated: true });
      }
      return { ...this.sideBarDockAccountList };
    } catch (error) {
      console.warn('getSidebarDockAccountList parse error', error);
      return {};
    }
    // }
    // }
    // return {};
  }

  afterInit(): string {
    // if (this.systemApi.isElectron() && !isAccountBg) {
    // web 端也支持切换账号，需要获取手机号的绑定信息
    if (this.systemApi.getCurrentUser() && this.systemApi.isMainPage()) {
      this.productAuthApi.saveAuthConfigFromNet();
    }
    if (this.systemApi.getCurrentUser() && !process.env.BUILD_ISPREVIEWPAGE) {
      this.doGetAccountBindInfo().then(() => {
        this.updateServerMobileList();
      });
      this.updateSidebarDockUnreadStatus([this.systemApi.getCurrentUser()!.id], false);
      this.getServerDomainList().then(({ success, data }) => {
        if (success && data) {
          this.currentDomainList = data;
        }
      });
    }
    if (!process.env.BUILD_ISPREVIEWPAGE) {
      this.updateLocalSubAccountsCache();
    }
    console.warn('[register_impl] afterInit');
    return this.name;
  }

  afterLogin(): string {
    return this.name;
  }

  beforeLogout(): string {
    return this.name;
  }

  async updateServerAliasList() {
    try {
      const current = this.systemApi.getCurrentUser();
      const aliasMobileList = await this.doGetMailAliasAccountListV2({
        noMain: false,
        showProxyEmails: true,
      });
      const list = this.transAlias(aliasMobileList, current!.id);
      const { deleteDiff } = await this.checkAccountInfoListDiff(list, 'alias');
      await Promise.all([this.doDeleteAccountInfoList(deleteDiff), this.storeAccountInfoList(list)]);
      this.eventApi.sendSimpleSysEvent('accountNotify');
    } catch (e) {
      console.error('[account_impl] updateServerAliasList error', e);
    }
  }

  async updateServerMobileList() {
    try {
      const mobileList = await this.getServerMobileBindAccountList();
      const accountInfoList = this.transMobile(mobileList);
      const { deleteDiff } = await this.checkAccountInfoListDiff(accountInfoList, 'mobile');
      await this.doDeleteAccountInfoList(deleteDiff);
      await this.storeAccountInfoList(accountInfoList);
      this.eventApi.sendSimpleSysEvent('accountNotify');
    } catch (e) {
      console.error('[account_impl] updateServerMobileList error', e);
    }
  }

  async doGetAccountIsAdmin(): Promise<boolean> {
    try {
      // corp账号不是管理员，返回false即可。
      const isCorpMail = this.systemApi.getIsCorpMailMode();
      if (isCorpMail) {
        return Promise.resolve(false);
      }
      const url = this.systemApi.getUrl('getIsAdmin');
      const res = await this.httpApi.post(
        url,
        {
          ...defaultParams,
        },
        {
          headers: { ...defaultHeader },
          timeout: 20 * 1000,
        }
      );
      const { code = '', result } = res.data || {};
      if (String(code) === '200' && result) {
        return Boolean(result.data?.admin);
      }
      console.error('[account_impl] doGetAccountIsAdmin error', code, result);
      return false;
    } catch (e) {
      console.error('[account_impl] doGetAccountIsAdmin error', e);
      return false;
    }
  }

  async doGetAccountIsNewAccount(): Promise<boolean> {
    try {
      const url = this.systemApi.getUrl('getIsNewAccount');
      const res = await this.httpApi.get(url);
      const { success, data } = res.data || {};

      if (success && data) {
        return Boolean(data?.newAccount);
      }
      console.error('[account_impl] doGetAccountIsNewAccount error', success, data);
      return false;
    } catch (e) {
      console.error('[account_impl] doGetAccountIsNewAccount error', e);
      return false;
    }
  }

  // 获取手机号绑定及邮件转发权限信息
  async doGetAccountBindAndForwardInfo(): Promise<Record<string, any>> {
    const url = this.systemApi.getUrl('getBindAndForwardInfo');
    const res = await this.httpApi.post(
      url,
      {
        ...defaultParams,
      },
      {
        headers: { ...defaultHeader },
        timeout: 20 * 1000,
      }
    );
    const { code = '', result, error } = res.data || {};
    if (String(code) === '200' && result) {
      return result;
    }
    return {
      error: error || 'otherError',
    };
  }

  // 发送手机验证码，用于来信分类
  async doSendVerificationCode(): Promise<Record<string, any>> {
    const url = this.systemApi.getUrl('sendVerificationCode');
    const res = await this.httpApi.post(
      url,
      {
        ...defaultParams,
      },
      {
        headers: { ...defaultHeader },
        timeout: 20 * 1000,
      }
    );
    const { code = '', result, error } = res.data || {};
    if (String(code) === '200' && result) {
      return {
        success: true,
        result,
      };
    }
    return {
      success: false,
      error: error || '验证码获取失败，请稍后再试',
    };
  }

  // 验证手机验证码，用于来信分类
  async doCheckVerificationCode(vcode: string): Promise<Record<string, any>> {
    const url = this.systemApi.getUrl('checkVerificationCode');
    const res = await this.httpApi.get(
      url,
      {
        vcode,
      },
      {
        headers: { ...defaultHeader },
        contentType: 'json',
      }
    );
    const { code = '', result, error } = res.data || {};
    if (String(code) === '200' && result) {
      return {
        success: true,
        result,
      };
    }
    return {
      success: false,
      error: error || 'otherError',
    };
  }

  async doGetAccountBindInfo(): Promise<string> {
    if (!this.systemApi.getCurrentUser()) {
      return '';
    }
    try {
      const url = this.systemApi.getUrl('getBindInfo');
      const res = await this.httpApi.post(
        url,
        {
          ...defaultParams,
        },
        {
          headers: { ...defaultHeader },
          timeout: 20 * 1000,
        }
      );
      const { code = '', result, error } = res.data || {};
      if (String(code) === '200' && result) {
        const { mobile, mobile_login_enable: enabledMobileLogin, mobile_login_time: lastLoginTime = 0 } = result?.bindInfo || {};
        mobile &&
          (await this.updateCurrentAccount({
            mobile,
            lastLoginTime,
            enabledMobileLogin,
          }));
        return mobile;
      }
      console.error('[account_impl] doGetAccountBindInfo error', code, result);
      return error || 'otherError';
    } catch (e) {
      console.error('[account_impl] doGetAccountBindInfo error', e);
      return 'otherError';
    }
  }

  async getServerMobileBindAccountList(): Promise<BindAccountInfo[]> {
    try {
      const url = this.systemApi.getUrl('getBindAccountList');
      const bjUrl = this.systemApi.getUrl('getBJBindAccountList');
      const user = this.systemApi.getCurrentUser();
      const [res, bjRes] = await Promise.all([
        this.httpApi.post(
          url,
          {
            ...defaultParams,
            mobile: user?.mobile,
          },
          {
            headers: { ...defaultHeader },
            timeout: 20 * 1000,
          }
        ),
        this.httpApi.post(
          bjUrl,
          {
            ...defaultParams,
            mobile: user?.mobile,
          },
          {
            headers: { ...defaultHeader },
            timeout: 20 * 1000,
          }
        ),
      ]);
      const { code = '', result } = res.data || {};
      const { code: bjcode = '', result: bjResult } = bjRes.data || {};
      if ((String(code) === '200' && result) || (String(bjcode) === '200' && bjResult)) {
        return [...(result?.data || []), ...(bjResult?.data || [])] as BindAccountInfo[];
      }
      console.error('[account_impl] getServerMobileBindAccountList error', code, result, bjcode, bjResult);
      return [];
    } catch (e) {
      console.error('[account_impl] getServerMobileBindAccountList error', e);
      return [];
    }
  }

  async checkAccountInfoListDiff(newInfoList: AccountInfoTable[], type?: 'mobile' | 'alias') {
    const oldInfoList = await this.getStoreAccountInfoList(type);
    const oldList = util.getKeyListByList(oldInfoList, 'id', true);
    const newList = util.getKeyListByList(newInfoList, 'id', true);
    return util.getDiff<string>(oldList, newList);
  }

  doGetAllAccountList(): Promise<[AccountTable[], AccountInfoTable[]]> {
    const tableName = this.getAccountTableName();
    return Promise.all([
      this.DBApi.getByEqCondition({
        dbName: this.dbName,
        tableName,
      }),
      this.DBApi.getByEqCondition({
        dbName: this.dbName,
        tableName: this.infoTableName,
      }),
    ]) as Promise<[AccountTable[], AccountInfoTable[]]>;
  }

  storeAccountList(params: AccountTable[]) {
    const noSharedAccounts = params && params.length ? params.filter(item => !item.isSharedAccount) : [];
    if (!noSharedAccounts || !noSharedAccounts.length) {
      return Promise.resolve([]);
    }
    const tableName = this.getAccountTableName();
    return this.DBApi.putAll(
      {
        dbName: this.dbName,
        tableName,
      },
      noSharedAccounts
    ) as Promise<AccountTable[]>;
  }

  storeAccountInfoList(params: AccountInfoTable[]) {
    return this.DBApi.putAll(
      {
        dbName: this.dbName,
        tableName: this.infoTableName,
      },
      params
    ) as Promise<AccountInfoTable[]>;
  }

  async doDeleteAccountList(params: string[]) {
    if (!params.length) {
      return true;
    }
    try {
      await this.DBApi.deleteById(
        {
          dbName: this.dbName,
          tableName: this.tableName,
        },
        params
      );
    } catch (e) {
      console.error('[account] db delete:', params, e);
      return false;
    }
    return true;
  }

  doDeleteAccountInfoList(params: string[]) {
    return this.DBApi.deleteById(
      {
        dbName: this.dbName,
        tableName: this.infoTableName,
      },
      params
    );
  }

  private getAccountTableName(isSubAccount?: boolean): string {
    if (typeof isSubAccount !== 'undefined') {
      return isSubAccount ? this.subAccountTableName : this.tableName;
    }
    const isAccountBg = !!(window && window.isAccountBg);
    return isAccountBg ? this.subAccountTableName : this.tableName;
  }

  async getStoreAccountList(): Promise<AccountModel> {
    try {
      const tableName = this.getAccountTableName();
      const [accountList, infoList] = await Promise.all([
        this.DBApi.getByEqCondition({
          dbName: this.dbName,
          tableName,
        }),
        this.getStoreAccountInfoList(),
      ]);
      const sharedAccountInfo = await this.getSharedAccountsInfoAsync();
      return this.transModal(accountList as AccountTable[], infoList as AccountInfoTable[], sharedAccountInfo);
    } catch (e) {
      console.error('[account_impl] getStoreAccountList error', e);
      return Promise.reject(e);
    }
  }

  async getStoreAccountInfoList(type?: 'mobile' | 'alias') {
    const current = this.systemApi.getCurrentUser();
    if (!current) {
      return [];
    }
    const { mobile, id: accountId } = current;

    const list = await this.DBApi.getByEqCondition({
      dbName: this.dbName,
      tableName: this.infoTableName,
      additionalData: {
        mobile,
        accountId,
        type,
      },
      filter: [accountItemFilterName],
    });
    return list as AccountInfoTable[];
  }

  transModal(accountList: AccountTable[], infoList: AccountInfoTable[], sharedAccountInfo?: ICurrentAccountAndSharedAccount | null) {
    const accountInfoList = infoList as Array<MobileAccountInfoTable & AliasMailAccountInfoTable>;
    const current = this.systemApi.getCurrentUser() as AccountTable;
    let localList = this.orderByLastLoginTime<AccountTable>(accountList);
    let mobileList: MobileAccountInfoTable[] = [];
    let showMobileList = true;
    const aliasList: AliasMailAccountInfoTable[] = [];
    if (current) {
      accountInfoList.forEach(item => {
        if (item.type === 'alias' && !item.isDefault) {
          aliasList.push(item);
        } else if (item.type === 'mobile') {
          if (current?.id === item.accountId) {
            current.enabledMobileLogin = item.enabledMobileLogin;
            current.lastLoginTime = item.lastLoginTime || 0;
            if (!(current.enabledMobileLogin && current.lastLoginTime > 0)) {
              showMobileList = false;
              mobileList = [];
            }
          }
          // 手机号当（1.主账号未验证未开启手机号登录，和手机号未验证 2.在本地账号中的账号）不展示
          if (showMobileList && !accountList.some(account => account.id === item.accountId)) {
            mobileList.push(item);
          }
        }
      });
      // 不展示主账号，和别名账号
      localList = localList
        .filter(item => item.id !== current.id && !aliasList.some(alias => alias.accountId === item.id))
        .filter(item => {
          if (!sharedAccountInfo) {
            return true;
          }
          if (sharedAccountInfo.isSharedAccountLogin) {
            if (item.id === sharedAccountInfo.email) {
              return false;
            }
          }
          return true;
        });
      mobileList = this.orderByLastLoginTime<MobileAccountInfoTable>(mobileList);
    }
    return cloneDeep({
      current,
      localList,
      mobileList,
      aliasList,
    });
  }

  transAlias(list: MailAliasAccountModel[], accountId: string): AliasMailAccountInfoTable[] {
    return list.map(item => {
      const { name, id, domain, isProxy, isDefault } = item;
      return {
        id: util.getUnique(accountId, 'alias', name, domain),
        originId: id,
        accountId,
        type: 'alias',
        domain,
        accountName: name,
        isDefault,
        isProxy,
        updateTime: new Date().getTime(),
      };
    });
  }

  transMobile(list: BindAccountInfo[]) {
    const accountInfoList: MobileAccountInfoTable[] = [];
    list.forEach(item => {
      const { account_id, domain, account_name, mobile, mobile_login_time, mobile_login_enable, status } = item;
      const accountId = this.doGetAccount({
        accountName: account_name,
        domain,
      });
      accountInfoList.push({
        id: util.getUnique(accountId, 'mobile', mobile),
        accountId,
        originId: account_id,
        type: 'mobile',
        mobile,
        status,
        enabledMobileLogin: mobile_login_enable,
        lastLoginTime: mobile_login_time,
        updateTime: new Date().getTime(),
      });
    });
    return accountInfoList;
  }

  transUser(user: AccountTable) {
    const { id, avatar, lastLoginTime, originId, mobile } = user;
    let infoList: MobileAccountInfoTable | undefined;
    const isSubAccount = !!user.isSubAccount;
    // 账号后台不存储mobile的info
    if (!isSubAccount) {
      if (mobile) {
        infoList = {
          id: util.getUnique(id, 'mobile', mobile),
          accountId: id,
          type: 'mobile',
          originId,
          mobile,
          avatar,
          lastLoginTime,
          enabledMobileLogin: true,
          updateTime: new Date().getTime(),
        } as MobileAccountInfoTable;
      }
    }
    return {
      accountList: cloneDeep(user),
      infoList,
    };
  }

  private testPwdStyleIsNew(pwd: string) {
    return pwd.startsWith(this.encryptedPwdHead) && pwd.endsWith(this.encryptedPwdTail);
  }

  decryptByKey(pwd: string) {
    const newPwd = pwd.replace(this.encryptedPwdHead, '').replace(this.encryptedPwdTail, '');
    return this.systemApi.decryptByKey(newPwd, this.storeApi.getUUID());
  }

  transStorageAccount(list: accountType[]): AccountTable[] {
    return list.map(({ a, k, lastLogin, t, tExpire, mobile, user }) => {
      let pwd = '';
      if (k) {
        if (this.testPwdStyleIsNew(k)) {
          const pwdTxt = this.decryptByKey(k);
          pwd = this.systemApi.md5(pwdTxt);
        } else {
          pwd = k;
        }
      }
      let account: AccountTable;
      if (user) {
        account = { ...user, lastLoginTime: lastLogin, pwd };
      } else {
        const { account: accountName, domain } = this.systemApi.handleAccountAndDomain(a) as unknown as EmailAccountDomainInfo;
        account = {
          id: a,
          pwd,
          accountName,
          domain,
          accountMd5: this.systemApi.md5(a, true),
          company: '',
          nickName: '',
          avatar: '',
          refreshToken: t,
          refreshTokenExpire: tExpire,
          mobile,
          lastLoginTime: lastLogin,
          sessionId: '',
        };
      }
      return account;
    });
  }

  async doUpdateAccountList(list: AccountTableUpdateParams[]) {
    const idList = util.getKeyListByList<string>(list, 'id', true);
    const accountList = await this.doGetAccountInfo(idList);
    const accountMap = util.listToMap(accountList, 'id');
    const storeList = list.map(item => ({
      ...(accountMap[item.id] || {}),
      ...item,
    }));
    return this.storeAccountList(storeList as AccountTable[]);
  }

  doGetAccount(params: { accountName?: string; domain?: string }) {
    const { accountName, domain } = params;
    if (!accountName || !domain) {
      console.error('accountName domain cannot be none');
      return '';
    }
    return accountName + '@' + domain;
  }

  doGetMobileAndArea(mobile?: string) {
    if (!mobile) {
      return {
        mobile: '',
        mobileArea: '',
      };
    }
    if (mobile.indexOf(')') === -1) {
      return {
        mobile,
        mobileArea: '86',
      };
    }
    const arr = mobile.split(')');
    return {
      mobile: arr[1],
      mobileArea: arr[0].slice(1),
    };
  }

  doGetMobileAccountInfo(id: string) {
    return this.DBApi.getByEqCondition({
      dbName: this.dbName,
      tableName: this.infoTableName,
      query: {
        id,
      },
    }) as Promise<MobileAccountInfoTable[]>;
  }

  async doGetAllMainAndSubAccounts(): Promise<AccountTable[]> {
    const mainAccounts = (await this.doGetAccountInfo()) || [];
    const subAccounts: AccountTable[] = (await this.getSubAccounts({ expired: false })) || [];
    return subAccounts.concat(mainAccounts);
  }

  async doGetAccountInfo(idList?: string[], isSubAccount = false) {
    try {
      let adCondition: AdQueryCondition | undefined;
      const tableName = this.getAccountTableName(isSubAccount);
      const currentUser = this.systemApi.getCurrentUser();
      if (idList && idList.length) {
        if (isSubAccount) {
          if (currentUser) {
            adCondition = {
              type: 'anyOf',
              args: [idList.map(idStr => [currentUser.id, idStr])],
              field: '[mainAccount+id]',
            };
          } else {
            return [];
          }
        } else {
          adCondition = {
            type: 'anyOf',
            args: [idList],
            field: 'id',
          };
        }
      }
      return this.DBApi.getByRangeCondition({
        dbName: this.dbName,
        tableName,
        adCondition,
      }) as Promise<AccountTable[]>;
    } catch (e) {
      console.error('[contact_impl] doGetAccountInfo error', e);
      return [];
    }
  }

  private getIsAccountBg() {
    return inWindow() ? window && window.isAccountBg : false;
  }

  async doSaveCurrentAccount(user: AccountTable) {
    try {
      const { isSubAccount } = user;
      const subAccountEmailId = isSubAccount ? user.id : '';
      const saveUser = { ...user, ...((subAccountEmailId ? AccountApiImp.subAccountIsSaveCurrentUserMap[subAccountEmailId] : AccountApiImp.isSaveCurrentUser) || {}) };
      if (!isSubAccount) {
        AccountApiImp.isSaveCurrentUser = saveUser;
      } else {
        AccountApiImp.subAccountIsSaveCurrentUserMap[subAccountEmailId] = saveUser;
      }
      const { accountList, infoList } = this.transUser(saveUser);
      const arr: Array<Promise<Array<AccountTable | AccountInfoTable>>> = [];
      if (isSubAccount && !accountList.mainAccount) {
        // 填充默认的mainAccount
        if (accountList) {
          const mainAccountEmail = this.systemApi.getCurrentUser()?.id;
          if (mainAccountEmail) {
            accountList.mainAccount = mainAccountEmail;
          }
        }
      }
      if (accountList.mainAccount) {
        // 主账号中更新的情况
        arr.push(this.addOrUpdateLocalSubAccounts([accountList as SubAccountTableModel]));
      } else {
        arr.push(this.doUpdateAccountList([accountList]));
      }
      if (infoList) {
        arr.push(this.storeAccountInfoList([infoList]));
      }
      await Promise.all(arr);
      if (!isSubAccount) {
        AccountApiImp.isSaveCurrentUser = undefined;
      } else {
        AccountApiImp.subAccountIsSaveCurrentUserMap[subAccountEmailId] = undefined;
      }
      console.log('doSaveCurrentAccount success');
      return {
        success: true,
      };
    } catch (e) {
      return {
        success: false,
        message: (e as Error).message,
      };
    }
  }

  async doGetAccountList(isCache = true): Promise<AccountModel> {
    try {
      const isCorpMail = this.systemApi.getIsCorpMailMode();
      const current = this.systemApi.getCurrentUser();
      if (!isCache && !isCorpMail && current) {
        current.mobile && this.updateServerMobileList().then();
        this.updateServerAliasList().then();
      }
      const res = await this.getStoreAccountList();
      // 在web端去掉手机关联账号逻辑
      if (!this.systemApi.isElectron() && res) {
        res.mobileList = [];
      }
      return res;
    } catch (e) {
      console.error('[account_impl] doGetAccountList error', e);
      return Promise.reject(e);
    }
  }

  doTransMobileBindAccountList(list: BindAccountInfo[]): MobileAccountInfo[] {
    try {
      return list.map(item => {
        const { domain, account_name, status, token, mobile_login_enable, mobile_login_time, mobile, account_exp, area, nickname } = item;
        return {
          domain,
          accountName: account_name,
          status,
          expired: account_exp,
          enabledMobileLogin: mobile_login_enable,
          lastLoginTime: mobile_login_time,
          nickName: nickname,
          token,
          mobile,
          area,
        };
      });
    } catch (e) {
      console.error('[account_impl] doTransMobileBindAccountList error', e);
      return [];
    }
  }

  async doCleanAllAccount(): Promise<AccountCommonRes> {
    try {
      // await window.electronLib.windowManage.clearLocalData();
      const data = await this.doGetAccountList();
      const localList: string[] = util.getKeyListByList(data.localList, 'id', true);
      if (data.current) {
        localList.push(data.current.id);
      }
      const mobileList: string[] = util.getKeyListByList(data.mobileList, 'id', true);
      await Promise.all([this.doDeleteAccountList(localList), this.doDeleteAccountInfoList(mobileList)]);
      return {
        success: true,
      };
    } catch (e) {
      return {
        success: false,
        message: '清除失败',
      };
    }
  }

  async doGetVerifyCode(mobile: string, isCancel?: boolean): Promise<AccountCommonRes> {
    try {
      const url = this.httpApi.buildUrl(this.systemApi.getUrl(isCancel ? 'getCancelVerifyCode' : 'getVerifyCode'), { ...defaultParams, mobile });
      const { data } = await this.httpApi.post(
        url,
        {},
        {
          headers: { ...defaultHeader },
        }
      );
      return {
        success: String(data?.code) === '200',
        message: data?.error,
      };
    } catch (e) {
      return {
        success: false,
        message: (e as Error).message,
      };
    }
  }

  updateCurrentAccount(params: Partial<AccountTable>) {
    const user = this.systemApi.getCurrentUser();
    const current = Object.assign(user, params);
    return Promise.all([this.storeApi.setLastAccount(current), this.doSaveCurrentAccount(current)]);
  }

  async doBindMobile(code: string, mobile: string): Promise<AccountCommonRes> {
    try {
      const url = this.httpApi.buildUrl(this.systemApi.getUrl('bindMobile'), {
        ...defaultParams,
        code,
      });
      const { data } = await this.httpApi.post(
        url,
        {
          ...defaultParams,
        },
        {
          headers: { ...defaultHeader },
        }
      );
      if (String(data?.code) === '200') {
        await this.updateCurrentAccount({ mobile });
        return {
          success: true,
        };
      }
      return {
        success: false,
        message: ErrMsgCodeMap[data?.error as ErrMsgType] || data?.error,
      };
    } catch (e) {
      console.error('[account_impl] doUnBindMobile error', e);
      return {
        success: false,
        message: (e as Error).message,
      };
    }
  }

  async doUpdateBindMobile(code: string, mobile: string): Promise<AccountCommonRes> {
    try {
      const url = this.httpApi.buildUrl(this.systemApi.getUrl('updateBindMobile'), {
        ...defaultParams,
        code,
      });
      const { data } = await this.httpApi.post(
        url,
        {
          ...defaultParams,
        },
        {
          headers: { ...defaultHeader },
        }
      );
      if (String(data?.code) === '200') {
        await this.updateCurrentAccount({ mobile });
        return {
          success: true,
        };
      }
      return {
        success: false,
        message: ErrMsgCodeMap[data?.error as ErrMsgType] || data?.error,
      };
    } catch (e) {
      console.error('[account_impl] doUnBindMobile error', e);
      return {
        success: false,
        message: (e as Error).message,
      };
    }
  }

  async doUnBindMobile(code: string): Promise<AccountCommonRes> {
    try {
      const url = this.httpApi.buildUrl(this.systemApi.getUrl('unbindMobile'), {
        ...defaultParams,
        code,
      });
      const { data } = await this.httpApi.post(
        url,
        {
          ...defaultParams,
        },
        {
          headers: { ...defaultHeader },
        }
      );
      if (String(data?.code) === '200') {
        await this.removeCurrentMobile();
        return {
          success: true,
        };
      }
      return {
        success: false,
        message: ErrMsgCodeMap[data?.error as ErrMsgType] || (data?.error === 'ERR.FORBIDDEN' ? '账号开启了二次验证，无法解绑手机号' : data?.error),
      };
    } catch (e) {
      console.error('[account_impl] doUnBindMobile error', e);
      return {
        success: false,
        message: (e as Error).message,
      };
    }
  }

  doSaveStorageAccount(list: accountType[]) {
    console.log('[account] save login ', list);
    const accountList = this.transStorageAccount(list);
    return this.storeAccountList(accountList);
  }

  async removeCurrentMobile() {
    const user = this.systemApi.getCurrentUser();
    try {
      if (user?.mobile) {
        const current = { ...user, mobile: undefined };
        const mobileId = this.getMobileAccountInfoId(user);
        await Promise.all([this.storeApi.setLastAccount(current), this.doSaveCurrentAccount(current), this.doDeleteAccountInfoList([mobileId])]);
      }
    } catch (e) {
      console.error('[account_impl removeCurrentMobile error]', e);
    }
  }

  async getCurrentAccountInfo(emailAddress: string, account?: string): Promise<FetchAccountByEmailApiRet> {
    const url = this.systemApi.getUrl('getYunxinInfoByEmail');
    return this.fetchAccountAndToken(url, {
      emailList: emailAddress,
      account: account || '',
    });
  }

  private async fetchAccountAndToken(remoteUrl: string, params: FetchAccountReqApi): Promise<FetchAccountByEmailApiRet> {
    // const user = this.systemApi.getCurrentUser();
    const properties = this.systemApi.handleAccountAndDomain(params.emailList);
    const subAccount = params.account || '';
    const apiResponse = await this.httpApi.get(
      remoteUrl,
      {
        domain: properties.domain,
        emailList: params.emailList,
      },
      {
        _account: subAccount,
      }
    );
    // const retry = 0;
    const retryFunc = async (retry: number): Promise<FetchAccountByEmailApiRet> => {
      const { data: res } = apiResponse as ApiResponse<FetchAccountEmailListApi<FetchAccountByEmailApiRet>>;
      /** 请求失败 通知外层 */
      if (!res || String(res.code) !== '200' || !res.data) {
        console.error('getYunxinInfoByEmail Failed:', apiResponse);
        // await wait(1000 * retry + 500);
      } else {
        // 可能会出现多账号情况(过滤非法账号)
        const accountList = (res!.data?.itemList || []).filter(item => item.status === 0);
        if (accountList.length) {
          return accountList[0];
        }
        // await wait(1000 * retry + 500);
      }
      await wait(1000 * retry + 500);
      if (retry < 3) {
        return retryFunc(retry + 1);
      }
      if (!subAccount) {
        this.eventApi.sendSysEvent({
          eventName: 'error',
          eventLevel: 'error',
          eventStrData: '',
          eventData: {
            popupType: 'toast',
            popupLevel: 'error',
            title: ErrMsgCodeMap.IM_AUTH_FAIL,
            code: 'IM_AUTH_FAIL',
          } as PopUpMessageInfo,
          eventSeq: 0,
        });
      }
      return Promise.reject(new Error('超过重试次数'));
    };

    return retryFunc(0);
    // throw new Error('无法获取初始化云信长连接的信息');
  }

  private getMobileAccountInfoId(user: User) {
    return util.getUnique(user.id, 'mobile', user.mobile);
  }

  private orderByLastLoginTime<T>(data: lastLoginTimeOrder[]): Array<T> {
    if (data?.length > 1) {
      data.sort((a, b) => {
        if (a?.lastLoginTime) {
          return b?.lastLoginTime ? -(a.lastLoginTime - b.lastLoginTime) : -1;
        }
        return b?.lastLoginTime ? 1 : 0;
      });
    }
    return data as unknown as Array<T>;
  }

  async doUpdateAccountRefreshToken() {
    const currentUser = this.systemApi.getCurrentUser();
    if (!currentUser || !process.env.BUILD_ISELECTRON) {
      return;
    }
    const now = Date.now();
    const { domain, accountName, refreshTokenExpire: tokenExpire = 0, refreshToken = '' } = currentUser;
    if (tokenExpire - now <= 3 * 24 * 60 * 60 * 1000) {
      const { success } = await this.loginApi.doUpdateRefreshToken({
        account_name: accountName,
        domain,
        tokenExpire,
        token: refreshToken,
      });
      this.performanceApi.point({
        statKey: 'update_refreshToken',
        statSubKey: success ? 'success' : 'fail',
        value: 1,
        valueType: 4,
      });
    }
  }

  async transDomainList(list: resultObject[]): Promise<DomainTable[]> {
    const orgId = await this.getCurrentOrgId();
    if (orgId) {
      return list.map(item => ({
        id: util.getUnique(orgId, item.domain),
        orgId,
        domain: item.domain,
        type: item.type === undefined ? -1 : item.type,
      }));
    }
    return [];
  }

  storeDomainList(params: DomainTable[]): Promise<DomainTable[]> {
    return this.DBApi.putAll(
      {
        dbName: this.dbName,
        tableName: this.domainTableName,
      },
      params
    ) as Promise<DomainTable[]>;
  }

  async getServerDomainList(): Promise<AccountRes<DomainTable[]>> {
    try {
      const { data } = await this.httpApi.get(this.systemApi.getUrl('getDomainListByOrg'));
      if (data?.success && data?.data?.domainList) {
        const domainList = await this.transDomainList(data.data.domainList);
        await this.storeDomainList(domainList);
        return {
          success: true,
          data: domainList,
        };
      }
      return {
        success: false,
      };
    } catch (e) {
      console.error('[account_impl] getServerDomainList error', e);
      return {
        success: false,
        message: (e as Error).message,
      };
    }
  }

  async getCurrentOrg() {
    const list = await this.contactApi.doGetOrgList({ typeList: [99] });
    return list[0];
  }

  async getCurrentOrgId() {
    const org = await this.getCurrentOrg();
    return org?.originId;
  }

  doGetEmailInCurrentDomain(email: string): boolean {
    const { domain } = this.systemApi.handleAccountAndDomain(email) as unknown as EmailAccountDomainInfo;
    return this.currentDomainList.some(item => item.domain === domain);
  }

  async doGetDomainList(): Promise<DomainTable[]> {
    const id = await this.getCurrentOrgId();
    if (!id) {
      return [];
    }
    const domainList = (await this.DBApi.getByEqCondition({
      dbName: this.dbName,
      tableName: this.domainTableName,
      query: {
        orgId: id,
      },
    })) as DomainTable[];
    this.currentDomainList = domainList;
    return domainList;
  }

  doGetInitModule() {
    return this.initModule;
  }

  private putSubAccounts(models: Array<SubAccountTableModel>): Promise<SubAccountTableModel[]> {
    return this.DBApi.putAll(
      {
        dbName: this.dbName,
        tableName: this.subAccountTableName,
      },
      models
    );
  }

  /**
   * 删除本地数据库的SubAccounts
   * @param query
   * @returns
   */
  async deleteLocalSubAccounts(query?: SubAccountQuery): Promise<boolean> {
    try {
      const deleteCondition = this.getSubAccountQueryConfig(query);
      await this.DBApi.deleteByByRangeCondition(deleteCondition);
      this.updateLocalSubAccountsCache();
      return true;
    } catch (ex) {
      console.error('deleteSubAccounts error', ex);
      return false;
    }
  }

  /**
   * 删除子账号相关的DB
   * @param email
   */
  private deleteAllSubAccountDB(email: string) {
    if (!email || !email.length) return;
    const dbNames = ['catalog_dexie', 'contact_dexie', 'fileop', 'mail_new', 'task_mail'];
    const emailMD5 = this.systemApi.md5(email, true);
    dbNames.forEach(dbName => {
      const accountDbName = dbName + '_' + emailMD5;
      this.DBApi.deleteDB(accountDbName);
    });
  }

  /**
   * 添加或更新本地数据库的subAccounts
   * @param models
   * @returns
   */
  async addOrUpdateLocalSubAccounts(models: Array<SubAccountTableModel>): Promise<SubAccountTableModel[]> {
    if (!models || !models.length) return [];
    const query: AdQueryConfig = {
      dbName: this.dbName,
      tableName: this.subAccountTableName,
    };
    const subAccounts: Array<SubAccountTableModel> = await this.DBApi.getByRangeCondition(query);
    // 处理已经存在的值
    if (subAccounts && subAccounts.length) {
      models.forEach((model, inx) => {
        const existedSubAccount = subAccounts.find(item => item.id === model.id && item.mainAccount === model.mainAccount);
        if (model.rowId) {
          delete model.rowId;
        }
        if (existedSubAccount) {
          models[inx] = { ...existedSubAccount, ...model };
        }
      });
    }
    const res = await this.putSubAccounts(models);
    setTimeout(() => {
      this.updateLocalSubAccountsCache();
    }, 10);
    return res;
  }

  private getSubAccountQueryConfig(query?: SubAccountQuery): AdQueryConfig {
    const queryConfig: AdQueryConfig = {
      dbName: this.dbName,
      tableName: this.subAccountTableName,
    };
    if (!query || !query.mainAccountEmail) {
      const currentUser = this.systemApi.getCurrentUser();
      const mainAccountEmail = currentUser?.id as string;
      if (!query) {
        query = { mainAccountEmail };
      }
      if (!query.mainAccountEmail) {
        query.mainAccountEmail = mainAccountEmail;
      }
    }
    if (query) {
      if (query.mainAccountEmail && query.subAccountEmail) {
        queryConfig.adCondition = {
          field: '[mainAccount+id]',
          type: 'equals',
          args: [[query.mainAccountEmail, query.subAccountEmail]],
        };
      } else if (query.mainAccountEmail) {
        queryConfig.adCondition = {
          field: 'mainAccount',
          type: 'equals',
          args: [query.mainAccountEmail],
        };
      } else if (query.subAccountEmail) {
        queryConfig.adCondition = {
          field: 'id',
          type: 'equals',
          args: [query.subAccountEmail],
        };
      }
    }
    return queryConfig;
  }

  /**
   * 获取主账号 + 子账号列表。主账号信息来自于currentUser
   * @param query
   * @returns
   */
  async getMainAndSubAccounts(query?: SubAccountQuery): Promise<Array<SubAccountTableModel>> {
    const currentUser = this.systemApi.getCurrentUser();
    if (!currentUser) return [];

    const subAccounts = await this.getSubAccounts(query);
    const currentAccount: SubAccountTableModel = {
      accountType: 'mainAccount',
      ...currentUser,
      emailType: 'NeteaseQiYeMail',
      mainAccount: currentUser?.id,
      expired: false,
      agentEmail: currentUser?.id,
    };
    subAccounts.unshift(currentAccount);
    return subAccounts;
  }

  /**
   * 获取内存中的子账号列表
   * @param query
   * @returns
   */
  getLocalSubAccountsFromCache(query?: SubAccountQuery): Array<SubAccountTableModel> {
    const subAccounts = subAccountsCache || [];
    if (!subAccounts || !subAccounts?.length) return [];
    return subAccounts
      .filter(item => {
        let mainAccountParam = query && query.mainAccountEmail ? query.mainAccountEmail : '';
        if (!mainAccountParam) {
          const currentUser = this.systemApi.getCurrentUser();
          mainAccountParam = currentUser?.id as string;
        }
        return item.mainAccount === mainAccountParam;
      })
      .filter(item => {
        const subAccountId = query && query.subAccountEmail ? query.subAccountEmail : '';
        if (!subAccountId) return true;
        return subAccountId === item.agentEmail || item.id === subAccountId;
      })
      .filter(item => {
        const expired = query && typeof query.expired !== 'undefined' ? query.expired : '';
        if (expired === '') {
          return true;
        }
        return item.expired === expired;
      });
  }

  getIsSameSubAccountSync(email1?: string, email2?: string): boolean {
    if (window.isAccountBg) {
      return true;
    }
    if (!email1 && !email2) {
      return true;
    }
    let email1Real: string | undefined = email1;
    if (!email1) {
      email1Real = this.systemApi.getCurrentUser()?.id;
    }
    let email2Real: string | undefined = email2;
    if (!email2) {
      email2Real = this.systemApi.getCurrentUser()?.id;
    }
    if ((!email1 && email2) || (!email2 && email1)) {
      return email2Real === email1Real;
    }
    if (email1 && email2 && email1 === email2) {
      return true;
    }
    const email2InCache = subAccountIdToAgentCache[email1Real!];
    return email2Real === email2InCache;
  }

  /**
   * 根据当前账号，返回所有等价的账号标识
   */
  getSubAccountInfo(name: string) {
    try {
      const subAccounts = subAccountsCache;
      if (!subAccounts || !subAccounts.length) return null;
      const targetAccount = subAccounts.find(item => item.id === name || item.agentEmail === name);
      if (targetAccount) {
        return targetAccount;
      }
    } catch (ex) {
      console.error('[Errorf]getSubAccountInfo', ex);
    }
    return null;
  }

  private async updateLocalSubAccountsCache() {
    try {
      subAccountsCache = await this.getSubAccounts();
      subAccountIdToAgentCache = {};
      if (subAccountsCache && subAccountsCache.length) {
        subAccountsCache.forEach(subAccount => {
          if (subAccount.id) {
            subAccountIdToAgentCache[subAccount.id] = subAccount.agentEmail || subAccount.id;
            if (subAccount.agentEmail && subAccount.id !== subAccount.agentEmail) {
              subAccountIdToAgentCache[subAccount.agentEmail] = subAccount.id || subAccount.agentEmail;
            }
          }
        });
      }
    } catch (ex) {
      console.error('updateLocalSubAccountsCache-error', ex);
    }
  }

  getSubAccountSid(email: string): string {
    try {
      const subAccounts = subAccountsCache;
      if (!subAccounts || !subAccounts.length) return '';
      const targetAccount = subAccounts.find(item => item.id === email || item.agentEmail === email);
      if (targetAccount) {
        return targetAccount.sessionId;
      }
      return '';
    } catch (ex) {
      console.error('getSubAccountSid-error', ex);
      return '';
    }
  }

  getNodeInfoByEmail(email: string, _account?: string): string {
    const defaultNode = '';
    try {
      if (_account) {
        const node = this.storeApi.getCurrentNode(_account);
        return node;
      }
      const subAccounts = subAccountsCache;
      if (!subAccounts || !subAccounts.length) return defaultNode;
      const targetAccount = subAccounts.find(item => item.id === email || item.agentEmail === email);
      if (targetAccount) {
        return targetAccount.node || defaultNode;
      }
      return defaultNode;
    } catch (ex) {
      console.error('getNodeInfoByEmail-error', ex);
      return defaultNode;
    }
  }

  private addEmailTypeToSubAccount(item: SubAccountTableModel | SubAccountServerModel) {
    try {
      if (item) {
        if (item.emailType) return;
        if (item.accountType === 'qyEmail' || item.accountType === 'mainAccount') {
          item.emailType = 'NeteaseQiYeMail';
          return;
        }
        const { agentEmail } = item;
        if (agentEmail) {
          const emailDomain = agentEmail.split('@')[1];
          switch (emailDomain) {
            case 'qq.com':
              item.emailType = 'QQMail';
              break;
            case '163.com':
              item.emailType = '163Mail';
              break;
            case '126.com':
              item.emailType = '126Mail';
              break;
            case 'gmail.com':
              item.emailType = 'Gmail';
              break;
            case 'outlook.com':
              item.emailType = 'Outlook';
              break;
            default:
              if ((item as SubAccountServerModel)?.sendHost?.endsWith('exmail.qq.com')) {
                item.emailType = 'TencentQiye';
              } else {
                item.emailType = 'Others';
              }
              break;
          }
        }
      }
    } catch (ex) {
      console.error(ex);
    }
  }

  async getSubAccounts(query?: SubAccountQuery): Promise<Array<SubAccountTableModel>> {
    const queryConfig = this.getSubAccountQueryConfig(query);
    const result = await this.DBApi.getByRangeCondition(queryConfig);
    let retResult = result as Array<SubAccountTableModel>;
    if (query && typeof query.expired !== 'undefined') {
      retResult = result.filter(item => item.expired === query.expired) as Array<SubAccountTableModel>;
    }
    retResult.forEach(item => {
      this.addEmailTypeToSubAccount(item);
    });
    return retResult as Array<SubAccountTableModel>;
  }

  async deleteBindAccount(account: { email: string; agentEmail: string; accountType: string }): Promise<SimpleResult> {
    try {
      if (!account || !account.email || !account.agentEmail) {
        return this.getParamErrorResult();
      }

      const { email, agentEmail } = account;
      const { accountType } = account;
      let url = '';
      if (accountType === 'qyEmail') {
        url = this.systemApi.getUrl('deleteQiyeMailSubAccount');
      } else if (accountType === 'personalEmail') {
        url = this.systemApi.getUrl('deletePersonalSubAccount');
      } else {
        return {
          success: false,
          errMsg: '不支持的账号类型',
          errCode: 200,
        };
      }
      if (email && email.includes('.third.') && email !== agentEmail) {
        try {
          // this.setCurrentAccount({ email });
          await this.mailApi.cleanPushConfig(email);
        } catch (ex) {
          console.error('cleanPushConfig-catch', ex);
        }
      }
      const res = await this.httpApi.post(url, { email: agentEmail }, { headers: defaultHeader }).then(res => res.data);
      if (res?.code?.toString() === '200') {
        const currentUser = this.systemApi.getCurrentUser();
        await this.deleteLocalSubAccounts({
          mainAccountEmail: currentUser?.id!,
          subAccountEmail: email,
        });
        await this.deleteSubAccountLocalStateByEmail(email);
        this.sendSubAccountDeletedEvent(currentUser?.id as string, email, agentEmail);
        return {
          success: true,
        };
      }
      return {
        success: false,
        errMsg: res?.err_msg,
        errCode: res?.errorCode,
      };
    } catch (ex: any) {
      return {
        success: false,
        errMsg: ex.message,
        errCode: 'deleteBindAccount-catch',
      };
    }
  }

  getCurrentAccount(): ICurrentAccountInfo | null {
    return { email: '' };
  }

  setCurrentAccount(param: ICurrentAccountInfo) {
    console.log(param);
  }

  /**
   * 获取所有账号列表，包含server上其它设备上绑定的账号
   * @returns
   */
  async getAllSubAccounts(): Promise<Array<SubAccountServerModel>> {
    const currentUser = this.systemApi.getCurrentUser();
    if (!currentUser) return [];
    const subAccountsFromServer = (await this.getBindAccountsFromServer()) || [];
    const localSubAccounts = await this.getSubAccounts({
      mainAccountEmail: currentUser.id,
    });
    subAccountsFromServer.forEach(item => {
      const isQyEmail = item.accountType === 'qyEmail';
      const itemEmail = isQyEmail ? item.accountEmail : item.accountEmail;
      const localItem = localSubAccounts.find(item => item.id === itemEmail);
      item.password = isQyEmail ? '' : localItem ? localItem.mainSendReceiveInfo?.password || '' : '';
      item.expired = localItem ? localItem.expired : true;
      this.addEmailTypeToSubAccount(item);
    });
    return subAccountsFromServer;
  }

  /**
   * 判断某个email地址是否为子账号
   * @returns
   */
  async isSubAccount(email: string): Promise<boolean> {
    const allSubAccounts: SubAccountTableModel[] = await this.getSubAccounts({
      expired: false,
    });
    const findRes = allSubAccounts.find(item => item.id === email);
    return !!findRes;
  }

  async getBindAccountsFromServer(): Promise<Array<SubAccountServerModel> | null> {
    try {
      return Promise.all([this.getQiyeMailBindAccountsFromServer(), this.getPersonalBindAccountsFromServer()]).then(res => {
        const qiyeMainBindAccounts = res[0];
        const personalBindAccounts = res[1];
        if (qiyeMainBindAccounts === null || personalBindAccounts === null) {
          // 服务端错误
          return null;
        }
        const qiyeMailSubAccounts = res[0] || [];
        const personalMailSubAccounts = res[1] || [];
        return qiyeMailSubAccounts.concat(personalMailSubAccounts);
      });
    } catch (ex) {
      console.error('getBindAccountsFromServer error', ex);
      return null;
    }
  }

  private async getQiyeMailBindAccountsFromServer(): Promise<Array<SubAccountServerModel> | null> {
    try {
      const currentUser = this.systemApi.getCurrentUser();
      const url = this.systemApi.getUrl('getQiyeMailBindSubAccounts');
      const res = await this.httpApi.get(url, {}, { headers: defaultHeader }).then(res => res.data);
      if (res?.code?.toString() === '200') {
        const serverList = (res?.result?.data || []) as Array<{
          email: string;
        }>;
        return serverList.map(item => {
          const accountInfo = this.systemApi.handleAccountAndDomain(item.email);
          const res: SubAccountServerModel = {
            accountType: 'qyEmail',
            agentEmail: item.email,
            mainAccount: currentUser?.id,
            accountName: accountInfo.account as string,
            domain: accountInfo.domain as string,
            accountEmail: item.email as string,
            emailType: 'NeteaseQiYeMail',
          };
          return res;
        });
      }
      return null;
    } catch (ex) {
      console.error('getQiyeMailBindAccountsFromServer error', ex);
      return null;
    }
  }

  async getPersonalBindAccountsFromServer(): Promise<Array<SubAccountServerModel> | null> {
    try {
      const currentUser = this.systemApi.getCurrentUser();
      const url = this.systemApi.getUrl('getBindPersonalSubAccounts');
      const res = await this.httpApi.post(url, {}, { headers: defaultHeader }).then(res => res.data);
      if (res?.code?.toString() === '200') {
        const serverList = (res?.result?.data || []) as Array<IServerPersonalSubAccount>;
        return serverList.map(item => {
          const res = {
            accountType: 'personalEmail',
            accountEmail: item.account_name + '@' + item.domain,
            mainAccount: currentUser?.id,
            accountName: item.account_name,
            domain: item.domain,
            agentEmail: item.agent_email,
            agentNickname: item.agent_nickname,
            sendHost: item.send_host,
            sendPort: item.send_port,
            sendSsl: item.send_ssl,
            receivePort: item.receive_port,
            receiveHost: item.receive_host,
            receiveSsl: item.receive_ssl,
          } as SubAccountServerModel;
          this.addEmailTypeToSubAccount(res);
          return res;
        });
      }
      return null;
    } catch (ex) {
      return null;
    }
  }

  async editSubAccount(param: SubAccountServerModel): Promise<SimpleResult> {
    try {
      const { accountType } = param;
      let editResult: SimpleResult;
      if (accountType === 'personalEmail') {
        editResult = await this.editPersonSubAccount(param);
        if (editResult.success) {
          const bindParam: SubAccountBindInfo = {
            ...param,
            password: param.password!,
            agentEmail: param.agentEmail!,
            accountType: 'Others',
            isEditMode: true,
          };
          const currentUser = this.systemApi.getCurrentUser();
          const subAccounts = await this.getSubAccounts({
            mainAccountEmail: currentUser?.id,
            subAccountEmail: param.accountEmail,
          });
          const targetSubAccount = subAccounts.find(item => item.mainSendReceiveInfo && item.mainSendReceiveInfo.agentEmail === param.agentEmail);
          if (targetSubAccount) {
            targetSubAccount.mainSendReceiveInfo = {
              ...targetSubAccount.mainSendReceiveInfo,
              ...(param as MailSendReceiveInfo),
            };
            targetSubAccount.nickName = param.agentNickname!;
            targetSubAccount.expired = false;
            await this.addOrUpdateLocalSubAccounts([targetSubAccount]);
          }
          editResult = await this.loginApi.bindSubAccount(bindParam);
        }
      } else if (accountType === 'qyEmail') {
        editResult = await this.editQiyeMailSubAccount(param);
      } else {
        return {
          success: false,
          errCode: 100,
          errMsg: '不支持的账号类型',
        };
      }

      return editResult;
    } catch (ex: any) {
      return {
        success: false,
        errMsg: ex.message,
        errCode: 'editSubAccounts-error',
      };
    }
  }

  private async editQiyeMailSubAccount(param: SubAccountServerModel): Promise<SimpleResult> {
    try {
      const email = param.agentEmail as string;
      const password = param.password as string;
      if (!email || !password) {
        return this.getParamErrorResult();
      }

      return await this.loginApi.bindSubAccount({
        accountType: 'NeteaseQiYeMail',
        agentEmail: email,
        password,
        isEditMode: true,
      });
    } catch (ex: any) {
      return {
        success: false,
        errCode: 'editQiyeMailSubAccount-catch',
        errMsg: ex.message,
      };
    }
  }

  private async editPersonSubAccount(param: SubAccountServerModel): Promise<SimpleResult> {
    try {
      const url = this.systemApi.getUrl('editPersonalSubAccount');
      const data: IServerPersonalSubAccount = {
        current_email: param.agentEmail,
        email: param.agentEmail,
        password: param.password,
        send_host: param.sendHost as string,
        send_port: param.sendPort as number,
        send_ssl: param.sendSsl as 0 | 1,
        receive_host: param.receiveHost as string,
        receive_port: param.receivePort as number,
        receive_ssl: param.receiveSsl as 0 | 1,
        agent_nickname: param.agentNickname as string,
      };

      const res = await this.httpApi.post(url, data, { headers: defaultHeader }).then(res => res.data);
      if (res?.code?.toString() === '200') {
        return {
          success: true,
        };
      }
      const errorCode = res?.errorCode as string;
      return {
        success: false,
        errCode: res?.errorCode,
        // @ts-ignore
        errMsg: SUB_ACCOUNT_ERRCODE_MAPS[errorCode] || res?.err_msg,
      };
    } catch (ex: any) {
      return {
        success: false,
        errCode: 'editPersonSubAccount-catch',
        errMsg: ex.message,
      };
    }
  }

  async createSubAccountWin(info: SubAccountWinCreateInfo) {
    try {
      const { mainAccountEmail, subAccountEmail, sessionName, eventName, agentEmail, param, eventData } = info;
      const sessionNameUsed = sessionName || `persist:${mainAccountEmail}-${subAccountEmail}`;
      const urlParams = {
        'open-account-bg-page': 'true',
        'main-account': mainAccountEmail,
        'sub-account': subAccountEmail,
        'agent-account': agentEmail,
        sessionName: sessionNameUsed,
        ...(param || {}),
      };

      const SUB_ACCOUNT_TYPE = 'subAccountBg' as WinType;
      const createWinReq = {
        type: SUB_ACCOUNT_TYPE,
        additionalParams: urlParams,
        manualShow: true,
        sessionName: sessionNameUsed,
      } as CreateWindowReq;

      let winRes: CreateWindowRes;
      if (eventName) {
        const commonEventData = { sessionName: sessionNameUsed };
        winRes = await this.systemApi.createWindowWithInitData(createWinReq, {
          eventName,
          eventData: eventData ? { ...commonEventData, ...eventData } : commonEventData,
        });
      } else {
        winRes = await this.systemApi.createWindow(createWinReq);
      }
      return winRes;
    } catch (ex) {
      console.error('doCreateSubAccountWin-error', ex);
      return undefined;
    }
  }

  private sendSubAccountDeletedEvent(mainEmail: string, subEmail: string, agentEmail: string) {
    this.eventApi.sendSysEvent({
      eventName: 'SubAccountDeleted',
      eventData: {
        mainAccount: mainEmail,
        subAccount: subEmail,
        agentEmail,
      },
    });
  }

  /**
   * 初始化删除本地的subAccounts
   * @returns
   */
  private async initDeleteLocalSubAccounts() {
    try {
      const currentUser = this.systemApi.getCurrentUser();
      if (!currentUser) return;
      const localSubAccounts = await this.getSubAccounts({
        mainAccountEmail: currentUser.id,
      });
      if (!localSubAccounts || !localSubAccounts.length) return;
      const subAccountsFromServer = await this.getBindAccountsFromServer();
      if (subAccountsFromServer === null) {
        // 服务端错误，不做账号删除
        return;
      }
      const deleteEmails: Array<string> = [];
      localSubAccounts.forEach(item => {
        // 服务器返回子账号为空，则直接删除即可
        if (!subAccountsFromServer || !subAccountsFromServer.length) {
          deleteEmails.push(item.id);
          return;
        }
        const subAccountInServer = subAccountsFromServer.find(serverItem => {
          if (serverItem.accountType === 'qyEmail') {
            return serverItem.accountEmail === item.id;
          }
          if (serverItem.accountType === 'personalEmail') {
            return serverItem.accountEmail === item.id && serverItem.agentEmail === item.agentEmail;
          }
          return false;
        });
        if (!subAccountInServer) {
          deleteEmails.push(item.id);
        }
      });
      if (deleteEmails && deleteEmails.length) {
        await Promise.all(
          deleteEmails.map(email => {
            this.deleteSubAccountLocalStateByEmail(email);
          })
        );
      }
    } catch (ex) {
      console.error('deleteLocalSubAccounts-error', ex);
    }
  }

  deleteSubAccountLocalStateByEmail(email: string) {
    try {
      this.deleteAllSubAccountDB(email);
      const emailMD5 = this.systemApi.md5(email, true);
      this.DBApi.removeAccountAction(emailMD5);
      this.removeSubAccountFromStore(email);
      return this.deleteLocalSubAccounts({ subAccountEmail: email });
    } catch (ex) {
      console.error('deleteSubAccountByEmail-catch', ex);
      return Promise.resolve(false);
    }
  }

  private sendSubAccountExpiredEvent(eventData: any) {
    this.eventApi.sendSysEvent({
      eventName: 'SubAccountLoginExpired',
      eventData: eventData || {},
    });
  }

  private async closeAllSubAccountWindows() {
    try {
      if (!window || !window.electronLib) {
        return;
      }
      const allWinInfos = await window.electronLib.windowManage.getAllWinInfo();
      const subAccountWins = allWinInfos.filter(winItem => winItem.type === 'subAccountBg');
      subAccountWins.forEach(winItem => {
        const winId = winItem.id;
        this.systemApi.closeSubWindow(winId, true, false);
      });
    } catch (ex: any) {
      console.error('closeAllSubAccountWindows-catch', ex);
    }
  }

  async subAccountLoginPreExpiredHandle(val: { mainAccount?: string; subAccount?: string; agentEmail?: string }) {
    const { mainAccount = '', subAccount = '', agentEmail = '' } = val;
    const subAccounts = await this.getSubAccounts({
      mainAccountEmail: mainAccount,
      subAccountEmail: subAccount,
    });
    subAccounts.forEach(item => {
      item.expired = true;
    });
    await this.addOrUpdateLocalSubAccounts(subAccounts);
    this.removeSubAccountFromStore(subAccount);
    this.sendSubAccountExpiredEvent(val);
    this.sendSubAccountExpiredToServer(mainAccount, agentEmail);
  }

  private async initSubAccountWins() {
    if (this.isSubAccountInited) return;
    this.loggerApi.track('initSubAccountWins');
    this.isSubAccountInited = true;
    const isMainPage = this.systemApi.isMainPage();
    if (isMainPage || process.env.BUILD_ISWEB) {
      if (process.env.BUILD_ISWEB) {
        this.sendSyncSubAccountInitEvent();
      }
      const currentUser = this.systemApi.getCurrentUser();
      if (!currentUser) return;
      const shouldCreateSubAccountWin = this.getShouldCreateSubAccountWins();
      if (shouldCreateSubAccountWin) {
        await this.closeAllSubAccountWindows();
      }
      // 先关闭所有subAccount的后台窗口
      await this.initDeleteLocalSubAccounts();
      if (currentUser) {
        const subAccounts = await this.getSubAccounts({
          mainAccountEmail: currentUser.id,
          expired: false,
        });
        try {
          this.acceptSubAccountWinData(subAccounts, currentUser);
        } catch (e) {
          console.error('acceptSubAccountWinData error', e);
        }
        subAccounts.forEach(item => {
          const eventParam = {
            mainAccount: currentUser.id,
            subAccount: item.id!,
            agentEmail: item.agentEmail!,
          };
          if (shouldCreateSubAccountWin) {
            this.createSubAccountWin({
              mainAccountEmail: currentUser.id,
              agentEmail: item.agentEmail!,
              subAccountEmail: item.id!,
            });
          } else {
            this.eventApi.sendSysEvent({
              eventName: 'SubAccountWindowReady',
              eventData: eventParam,
            });
          }
        });
      }
      // 子账号失效，更新数据库
      this.eventApi.registerSysEventObserver('SubAccountLoginPreExpired', {
        func: async ev => {
          if (ev && ev.eventData) {
            const { eventData } = ev;
            await this.subAccountLoginPreExpiredHandle(eventData);
          }
        },
      });
    }
  }

  private removeSubAccountFromStore(subAccount: string) {
    this.storeApi.setLastAccount(undefined, subAccount);
    this.storeApi.removeSubAccountFromList(subAccount);
  }

  private sendSubAccountExpiredToServer(mainAccountEmail: string, agentEmail: string) {
    this.dataTrackApi.track('pcMail_accountFailure_agent', {
      mainAccount: mainAccountEmail,
      agentEmail,
    });
  }

  private getParamErrorResult(): SimpleResult {
    return {
      success: false,
      errCode: 'Param-Error',
      errMsg: '参数错误',
    };
  }

  private getCatchErrorResult(fnName: string, ex: Error): SimpleResult {
    return {
      success: false,
      errCode: `${fnName}-Catch`,
      errMsg: ex.message,
    };
  }

  private async updateLocalNickName(param: { email: string; nickName: string }) {
    const subAccounts = await this.getSubAccounts({
      subAccountEmail: param.email,
    });
    if (subAccounts && subAccounts.length) {
      const subAccount = subAccounts[0];
      subAccount.nickName = param.nickName;
      if (subAccount.mainSendReceiveInfo) {
        subAccount.mainSendReceiveInfo.agentNickname = param.nickName;
      }
      await this.addOrUpdateLocalSubAccounts([subAccount]);
    }
  }

  async editSubAccountNickName(param: { email: string; nickName: string }): Promise<SimpleResult> {
    try {
      const subAccountEmail = param.email;
      const subAccounts = await this.getSubAccounts({
        subAccountEmail,
        expired: false,
      });
      if (!subAccounts || !subAccounts.length) {
        return {
          success: true,
          errMsg: 'SubAccount not exist',
          errCode: 100,
        };
      }
      //
      const subAccount = subAccounts[0];
      const { accountType } = subAccount;
      let res: SimpleResult | null = null;
      if (accountType === 'personalEmail') {
        subAccount.mainSendReceiveInfo!.agentNickname = param.nickName;
        const editParam = Object.assign(subAccount, subAccount.mainSendReceiveInfo || {});
        res = await this.editPersonSubAccount(editParam);
      } else if (accountType === 'qyEmail') {
        res = await this.setQiyeMailSubAccoutNickName(param);
      } else {
        res = {
          success: false,
          errMsg: 'AccountType not support',
        };
      }

      if (res && res.success) {
        await this.updateLocalNickName(param);
      }

      return (
        res || {
          success: false,
        }
      );
    } catch (ex: any) {
      console.error('editSubAccountNickName-error', ex);
      return {
        success: false,
      };
    }
  }

  async setQiyeMailSubAccoutNickName(param: { email: string; nickName: string }): Promise<SimpleResult> {
    try {
      if (!param || !param.email || !param.nickName) {
        return this.getParamErrorResult();
      }
      // this.setCurrentAccount({ email: param.email });
      const res = await this.mailConfigApi.setMailSenderName(param.nickName.trim(), param.email);
      if (res) {
        await this.updateLocalNickName(param);
      }
      return {
        success: res,
      };
    } catch (ex: any) {
      return this.getCatchErrorResult('setQiyeMailSubAccoutNickName', ex);
    }
  }

  async getQiyeMailSubAccountNickName(param: { email: string }): Promise<SimpleResult> {
    try {
      if (!param || !param.email) {
        return this.getParamErrorResult();
      }

      // this.setCurrentAccount({ email: param.email });
      const res = await this.mailConfigApi.getMailSenderInfo(param.email);
      const mainAccounts = res.filter(item => item.isMainEmail);
      if (mainAccounts && mainAccounts.length) {
        const firstMainAccount = mainAccounts[0];
        const senderName = firstMainAccount.senderName as string;
        return {
          success: true,
          data: {
            nickName: senderName,
          },
        };
      }
      return {
        success: false,
        errCode: 'no-main-acount',
        errMsg: '获取主账号失败',
      };
    } catch (ex: any) {
      return this.getCatchErrorResult('getQiyeMailSubAccountNickName', ex);
    }
  }

  private checkShareAccountExpired(force?: boolean) {
    const isMainPage = this.systemApi.isMainPage();
    if (!isMainPage) return;
    const currentUser = this.systemApi.getCurrentUser();
    if (currentUser?.isSharedAccount) {
      if (!force) {
        this.getSharedAccountsInfoAsync(true).then(sharedAccountInfo => {
          if (sharedAccountInfo && !sharedAccountInfo.isSharedAccountLogin) {
            this.httpApi.triggerCurrentUserLogout(true);
          }
        });
      } else {
        this.httpApi.triggerCurrentUserLogout(true);
      }
    }
  }

  // 1.27 版本升级是否需要同步挂载账号窗口的账号数据
  private getShouldCreateSubAccountWins() {
    if (!process.env.BUILD_ISELECTRON) {
      return false;
    }
    const res = this.storeApi.getSync(this.subAccountDataCompleteKey);
    if (res && res.suc && res.data === 'false') {
      // 数据已同步
      return false;
    }
    return true;
  }

  private setShouldCreateSubAccountWins(val: boolean) {
    return this.storeApi.putSync(this.subAccountDataCompleteKey, `${val}`);
  }

  private sendSyncSubAccountInitEvent(restartApp?: boolean) {
    this.eventApi.sendSysEvent({
      eventName: 'initModule',
      eventStrData: 'syncSubAccount',
      eventData: {
        restartApp: !!restartApp,
      },
    });
  }

  private acceptSubAccountWinData(subAccounts: SubAccountTableModel[], currentUser: User) {
    if (process.env.BUILD_ISWEB) return;
    const isMainPage = this.systemApi.isMainPage();
    if (!isMainPage) {
      return;
    }
    const shouldCreateSubAccountWin = this.getShouldCreateSubAccountWins();
    this.loggerApi.track('acceptSubAccountWinData_state', { shouldCreateSubAccountWin, subAccounts });
    if (subAccounts.length <= 0 || !shouldCreateSubAccountWin || !this.systemApi.isElectron() || !currentUser) {
      // 1.27之前web端没有多账号能力，所以不需要同步账号后台数据
      this.setShouldCreateSubAccountWins(false);
      this.sendSyncSubAccountInitEvent(false);
      return;
    }
    this.subAccounts = subAccounts.map(_ => _.id);
    this.eventApi.registerSysEventObserver('syncSubAccountState', {
      func: async ev => {
        this.loggerApi.track('acceptSubAccountWinData_event', { subAccounts: this.subAccounts, ev });
        if (ev && ev.eventData) {
          // 将数据更新datastore中
          if (this.subAccounts.includes(ev.eventData.userId)) {
            // 将数据更新datastore中
            await this.storeApi.putSubAccountState(ev.eventData);
            // this.subAccounts 删除 ev.eventData.userId
            this.subAccounts = this.subAccounts.filter(_ => _ !== ev.eventData.userId);
          }
        }
        if (this.subAccounts.length <= 0) {
          this.loggerApi.track('acceptSubAccountWinData_event_initModule');
          // 已经同步完所有的挂载账号数据
          this.setShouldCreateSubAccountWins(false);
          this.syncSubAccountTimer && clearTimeout(this.syncSubAccountTimer);
          this.syncSubAccountTimer = null;
          this.sendSyncSubAccountInitEvent(true);
        }
      },
    });
    this.syncSubAccountTimer = setTimeout(async () => {
      // 10s超时，超时不再等待挂载账号同步数据
      // 挂载账号失效
      this.loggerApi.track('syncSubAccountTimer', { subAccounts: this.subAccounts });
      this.setShouldCreateSubAccountWins(false);
      const allHandle = [];
      for (let i = 0; i < this.subAccounts.length; i++) {
        // const subAccountUser = this.systemApi.getCurrentUser(this.subAccounts[i]);
        const subAccountUser = subAccounts.find(_ => _.id === this.subAccounts[i]);
        const val = {
          mainAccount: currentUser?.id,
          subAccount: subAccountUser?.id,
          agentEmail: subAccountUser?.agentEmail,
        };
        allHandle.push(this.subAccountLoginPreExpiredHandle({ ...val }));
      }
      await Promise.allSettled(allHandle);
      this.loggerApi.track('syncSubAccountTimer_initModule');
      // 发送同步完成事件

      this.sendSyncSubAccountInitEvent(true);
    }, 10000) as unknown as NodeJS.Timeout;
  }

  private async sendSubAccountWinData() {
    if (window.isAccountBg) {
      // 子窗口发送数据
      const currentUser = this.systemApi.getCurrentUser();
      if (currentUser) {
        // 获取需要发送的数据
        const res = this.storeApi.getSubAccountState();
        this.loggerApi.track('sendSubAccountWinData_getSubAccountState', { res });
        if (res) {
          const eventData = {
            userId: currentUser.id,
            ...res,
          };
          this.eventApi.sendSysEvent({
            eventName: 'syncSubAccountState',
            eventData,
          });
        }
      }
    }
  }

  afterLoadFinish() {
    const isMainPage = this.systemApi.isMainPage();
    if (isMainPage) {
      this.systemApi.intervalEvent(this.updateAccountRefreshTokenHandle);
    }
    // 子账号
    // if (isAccountBg) {
    this.doGetMailAliasAccountListV2();
    // }
    this.initSubAccountWins();
    try {
      this.sendSubAccountWinData();
    } catch (e) {
      console.error('sendSubAccountWinData error', e);
    }
    this.checkShareAccountExpired();
    const subAccounts = this.storeApi.getSubAccountList();
    subAccounts.forEach(subAccount => {
      if (subAccount.email) {
        this.doGetMailAliasAccountListV2({ email: subAccount.email });
      }
    });

    return this.name;
  }

  async getIsSharedAccountLoginAsync(): Promise<boolean> {
    try {
      if (sharedAccountInfoCache) {
        return sharedAccountInfoCache.isSharedAccountLogin;
      }
      const sharedAccountInfo = await this.getSharedAccountsInfoAsync(true);
      if (sharedAccountInfo) {
        return sharedAccountInfo.isSharedAccountLogin;
      }
      return false;
    } catch (ex) {
      console.error('getIsSharedAccountLoginAsync error', ex);
      return false;
    }
  }

  async getIsSharedAccountAsync(): Promise<boolean> {
    try {
      if (sharedAccountInfoCache) {
        return sharedAccountInfoCache.isSharedAccount;
      }
      const sharedAccountInfo = await this.getSharedAccountsInfoAsync(true);
      if (sharedAccountInfo) {
        return sharedAccountInfo.isSharedAccount;
      }
      return false;
    } catch (ex: any) {
      return false;
    }
  }

  private handleSharedAccountLogout(email?: string) {
    if (sharedAccountInfoCache) {
      sharedAccountInfoCache.isSharedAccountLogin = false;
      sharedAccountInfoCache.isSharedAccountExpired = true;
      if (email && sharedAccountInfoCache.sharedAccounts && sharedAccountInfoCache.sharedAccounts.length) {
        sharedAccountInfoCache.sharedAccounts = sharedAccountInfoCache.sharedAccounts.filter(item => item.email !== email);
      }
    }
  }

  async getSharedAccountsInfoAsync(refresh = false): Promise<ICurrentAccountAndSharedAccount | null> {
    try {
      if (sharedAccountInfoCache && !refresh) {
        return cloneDeep(sharedAccountInfoCache);
      }
      const url = this.systemApi.getUrl('getSharedAccounts');
      const resData = await this.httpApi.post(url).then(res => res.data);
      const resCode = resData?.code?.toString();
      if (resCode === '200') {
        const resResult = resData!.result;
        const sharedAccounts: Array<ISharedAccount> = resResult?.sharedAccounts || [];
        const currentUser = this.systemApi.getCurrentUser();
        const currentUserEmail = currentUser?.id || '';
        let isSharedAccountLogin = false;
        const accounts = sharedAccounts
          .filter(item => item.enabled)
          .map(item => {
            if (item.email === currentUserEmail) {
              item.isCurrentAccount = true;
              isSharedAccountLogin = true;
            } else {
              item.isCurrentAccount = false;
            }
            return item;
          });
        const res: ICurrentAccountAndSharedAccount = {
          isSharedAccount: isSharedAccountLogin ? true : resResult?.pub || false,
          isSharedAccountExpired: false,
          email: resResult?.email,
          nickName: resResult?.nickName,
          alias: resResult?.alias || [],
          isSharedAccountLogin,
          sharedAccounts: accounts,
        };
        sharedAccountInfoCache = res;
        if (process.env.BUILD_ISELECTRON) {
          if (currentUser && currentUser.isSharedAccount) {
            if (!res.isSharedAccountLogin) {
              // 主账号过期
              const newRes: ICurrentAccountAndSharedAccount = {
                isSharedAccount: true,
                isSharedAccountExpired: true,
                email: currentUser.originAccount?.email || '',
                nickName: currentUser.originAccount?.nickName || '',
                alias: [],
                isSharedAccountLogin: true,
                sharedAccounts: [
                  {
                    email: res.email,
                    nickName: res.nickName,
                    units: [''],
                    enabled: true,
                    isCurrentAccount: true,
                    avatar: '',
                  },
                ],
              };
              return newRes;
            }
          }
        }
        return cloneDeep(res);
      }
      if (resCode === '403') {
        this.checkShareAccountExpired(true);
        return null;
      }
      console.error('getSharedAccountsAsync response error', resData);
      return null;
    } catch (ex) {
      console.error('getSharedAccountsAsync catch error', ex);
      return null;
    }
  }

  // 获取挂载账号，账号类型
  getSubAccountsEmailType(email: string): AccountTypes {
    const result = subAccountsCache.find(v => v.id === email || v.agentEmail === email);
    return result?.emailType || 'Others';
  }

  // 获取账号类型
  getAccountsEmailType(email: string): AccountTypes {
    const currentUser = this.systemApi.getCurrentUser();
    // 如果主账号都获取不到，则直接返回其他
    if (!currentUser) {
      return 'Others';
    }
    const currentAccount: SubAccountTableModel = {
      accountType: 'mainAccount',
      ...currentUser,
      emailType: 'NeteaseQiYeMail',
      mainAccount: currentUser?.id,
      expired: false,
      agentEmail: currentUser?.id,
    };
    const result = [currentAccount, ...subAccountsCache].find(v => v.id === email || v.agentEmail === email);
    return result?.emailType || 'Others';
  }

  getEmailIdByEmail(email: string, returnExpired?: boolean) {
    return this.storeApi.getEmailIdByEmail(email, returnExpired);
  }

  getAgentEmailByEmail(email: string): string {
    return this.storeApi.getAgentEmailByEmail(email);
  }

  // 免费版发送升级邮箱版本通知信，朱小舒的接口
  async sendCosUpgrade(type: number): Promise<{ code?: number | string; result?: StringMap }> {
    try {
      const url = this.systemApi.getUrl('sendCosUpgrade');
      const resData = await this.httpApi
        .post(
          url,
          { type },
          {
            headers: { ...defaultHeader },
          }
        )
        .then(res => res.data);
      if (resData?.code === 200 || resData?.code === '200') {
        return resData;
      }
      return Promise.reject(new Error('请求失败'));
    } catch (e) {
      console.error('[account_impl] sendCosUpgrade error', e);
      return Promise.reject(e);
    }
  }
}

const impl: Api = new AccountApiImp();
api.registerLogicalApi(impl);
export default impl;
