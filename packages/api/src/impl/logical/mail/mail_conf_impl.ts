// import { decode } from 'html-entities';
import { config } from 'env_def';
import { Api, ContactModel, PopUpMessageInfo } from '@/api/_base/api';
import debounce from 'lodash/debounce';
import { api } from '@/api/api';
import { storeOps } from '@/api/store/api_store';
import {
  MailConfApi,
  MailEntryModel,
  MailFileAttachModel,
  MailSettingKeys,
  MailTag,
  reDefinedColorList,
  ResponseSignature,
  SettingUpdateParam,
  userAttr,
  ResponseMailClassify,
  MailApi,
  NewTagOpItem,
  GetSetttingParams,
  AccountInfoModel,
  MailConfigQuickSettingModel,
  MailView,
  reDefinedColorListNew,
  AccountTokensType,
  MailLimit,
  ReqMailLimitRes,
  free_upload_size_local,
  free_upload_total_size_local,
  free_smtp_max_send_mail_size_local,
  upload_size_local,
  upload_total_size_local,
  smtp_max_send_mail_size_local,
  EdmRelatedPageParams,
  ReqGetFjFileUrlParams,
} from '@/api/logical/mail';
import { apis, inWindow } from '@/config';
import { ApiResponse, DataTransApi, ResponseData, ApiRequestConfig } from '@/api/data/http';
import { EntSignature, methodMap, MethodMap, TagItem } from './mail_action_store_model';
import { SystemApi } from '@/api/system/system';
import { ArrayMap, StringMap } from '@/api/commonModel';
import { DataStoreApi, ISubAccountEmailOnlyInfo, StoreConfig, StoreMethod } from '@/api/data/store';
import { EventApi, SystemEvent } from '@/api/data/event';
import { HtmlApi } from '@/api/data/html';
import { util } from '@/api/util';
import corpMailUtils from './corp_mail_utils';
import { AccountApi, MailAliasAccountModel } from '@/api/logical/account';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { updateTrackerAttributes } from '../../api_system/data_tracker/data_tracker_impl';
import { ProductAuthApi } from '@/api/logical/productAuth';

// import { conf } from '../../../common';
//
// interface test {
//   a: number,
//   b: string
// }
const SHOULD_AUTO_READMAILKEY = 'shouldAutoReadMail';
const SHOULD_AUTO_READMAILSERVERKEY = 'mail.autoMarkRead';

const globalStoreConfig = { noneUserRelated: true };
interface ResponseAliasAccount {
  aliases: MailAliasAccountModel[];
}

class ActionStore {
  // signatureMap: NumberTypedMap<number>;
  signatures: ArrayMap<ResponseSignature>;

  // testArrayMap: ArrayMap<test>;
  entSignature: ResponseSignature | undefined;

  mailConf: StringMap;

  tagsUpdated: boolean;

  lastAttrSyncTime: number;

  shouldAutoReadMail: boolean;

  // signatureCount: number;
  constructor() {
    // this.signatureMap = {};
    this.signatures = new ArrayMap<ResponseSignature>(it => String(it.id));
    // this.testArrayMap = new ArrayMap<test>((i: Partial<test>) => {
    //   return i.b;
    // });
    this.mailConf = {};
    this.tagsUpdated = false;
    this.lastAttrSyncTime = 0;
    // this.signatureCount = 0;
    this.shouldAutoReadMail = true;
  }

  otherMailConfigListElements: Array<string> = [];
}

class MailConfApiImpl implements MailConfApi {
  static readonly sOk: string = 'S_OK';

  static readonly comNotExist: string = config('notExistUrl') as string;

  static readonly webMailUrlMap: StringMap = {
    hz: config('webMailHZUrl') as string,
    hzHost: config('webMailHZHost') as string,
    bj: config('webMailBJUrl') as string,
    bjHost: config('webMailBJHost') as string,
  };

  static readonly nReplayEnMap: StringMap = {
    original: 'Original',
    fw: 'Forwarded message',
    from: 'From',
    date: 'Date',
    to: 'To',
    cc: 'Cc',
    subject: 'Subject',
  };

  static readonly nReplayChnMap: StringMap = {
    original: '原始邮件',
    fw: '转发邮件信息',
    from: '发件人',
    date: '发送日期',
    to: '收件人',
    cc: '抄送',
    subject: '主题',
  };

  static readonly host = config('host') as string;

  static readonly contextPath = config('contextPath') as string;

  static isUseRealList: boolean | null = null;

  readonly name: string;

  readonly defaultSignature: ResponseSignature;

  readonly sidRegexp = /sid=[^&]+/i;

  systemApi: SystemApi;

  accountApi: AccountApi;

  httpApi: DataTransApi;

  htmlApi: HtmlApi;

  storeApi: DataStoreApi;

  productAuthApi: ProductAuthApi;

  eventApi: EventApi;

  mailApi: MailApi;

  action: ActionStore;

  subAccountAction: Map<string, ActionStore>;

  waitCondition?: Promise<void>;

  private tagList: MailTag[] = [];

  private tagNameMap: StringMap = {};

  private tagBgMap: StringMap = {};

  private tagNameFontColorMap: StringMap = {};

  private dataTracker: DataTrackerApi;

  accountTokens: AccountTokensType[];

  accountTokensTimer: null | NodeJS.Timeout;

  private debouncedDoGetUserAttr: any;

  constructor() {
    this.name = apis.mailConfApiImpl;
    this.systemApi = api.getSystemApi();
    this.httpApi = api.getDataTransApi();
    this.storeApi = api.getDataStoreApi();
    this.eventApi = api.getEventApi();
    this.htmlApi = api.requireLogicalApi(apis.htmlApi) as HtmlApi;
    this.mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    this.action = new ActionStore();
    this.subAccountAction = new Map();
    this.dataTracker = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
    this.productAuthApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
    this.debouncedDoGetUserAttr = debounce(this.doGetUserAttr.bind(this), 5000, { leading: true, trailing: false });
    this.defaultSignature = {
      content: '',
      id: 0,
      isDefault: false,
      isHtml: false,
      name: '',
      enable: true,
    };
    this.accountTokens = [];
    this.accountTokensTimer = null;
  }

  async getAccountToken(_account: string): Promise<string> {
    try {
      const url = this.systemApi.getUrl('accountGetToken');
      const resData = await this.httpApi.post(url, undefined, { _account, headers: { 'Qiye-Header': 'sirius' } }).then(res => res.data);
      if (resData?.code && [200, '200'].includes(resData?.code)) {
        return resData.result.token;
      }
      return Promise.reject(JSON.stringify(resData));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async updateAccountTokens(payload: { accountsParam?: string[]; forceUpdate?: boolean }) {
    if (process.env.BUILD_ISELECTRON) return [];
    const { accountsParam = [], forceUpdate } = payload;
    // token30分钟过期, 20分钟执行一次
    // 如果token获取超过8分钟，就更新token，保证所有token有效
    // 删除 this.accountTokens 中存在但是accounts中不存在的token数据
    let accounts = accountsParam;
    let isUpdateAll = false;
    if (!accountsParam || !accountsParam.length) {
      const subAccounts: ISubAccountEmailOnlyInfo[] = this.storeApi.getSubAccountList() || [];
      accounts = subAccounts.map(subAccount => subAccount.email);
      isUpdateAll = true;
    }
    if (isUpdateAll && this.accountTokensTimer) {
      clearTimeout(this.accountTokensTimer);
      this.accountTokensTimer = null;
    }

    await Promise.all(
      accounts.map(async account => {
        try {
          const tokenObj = this.accountTokens.find(item => item.account === account);
          const nowDate = new Date().getTime();
          let updateDate = null;
          if (tokenObj) updateDate = tokenObj.updateDate;
          if (!updateDate || nowDate - updateDate > 1000 * 60 * 8 || forceUpdate) {
            const res = await this.getAccountToken(account);
            const newTokenInfo = {
              account,
              token: res,
              updateDate: new Date().getTime(),
            };
            this.updateAccountToken(newTokenInfo);
          }
        } catch (ex) {
          return Promise.resolve();
        }
      })
    );
    // 20分钟更新一次
    if (isUpdateAll && !this.accountTokensTimer) {
      this.accountTokensTimer = setTimeout(() => {
        this.updateAccountTokens({});
      }, 1000 * 60 * 20) as unknown as NodeJS.Timeout;
    }
    return this.accountTokens;
  }

  private updateAccountToken(tokenInfo: { account: string; token: string; updateDate: number }) {
    if (!tokenInfo || !tokenInfo.account) return;
    const existInfo = this.accountTokens.find(item => item.account === tokenInfo.account);
    if (existInfo) {
      existInfo.token = tokenInfo.token;
      existInfo.updateDate = tokenInfo.updateDate;
    } else {
      this.accountTokens.push(tokenInfo);
    }
  }

  getTimezone(): number {
    // 首次加载页面非mailbox 会导致conf里没有值
    if (!Number.isNaN(Number(this.action.mailConf[MailSettingKeys.nTimezone]))) {
      return Number(this.action.mailConf[MailSettingKeys.nTimezone]);
    }
    this.loadConfFromServer();
    return 8;
  }

  setTimezone(timezone: number): Promise<boolean> {
    const key = MailSettingKeys.nTimezone;
    return this.doSetUserAttr({
      [key]: timezone > 0 ? `+${timezone}` : `${timezone}`,
    });
  }

  getLocalTimezone(): boolean {
    const useLocalTimeZone = this.action.mailConf[MailSettingKeys.nLocalTimezone];
    return !!(useLocalTimeZone === null || useLocalTimeZone === '' || useLocalTimeZone === 'true' || useLocalTimeZone) || false;
  }

  setLocalTimezone(timezone: boolean): Promise<boolean> {
    const key = MailSettingKeys.nLocalTimezone;
    const attrs = {
      [key]: timezone,
    };
    return this.httpApi
      .post(
        this.buildUrl('setAttr'),
        {
          attrs,
        },
        {
          contentType: 'json',
          useCacheResultPeriod: 600000,
          cachePolicy: 'refresh',
        }
      )
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<StringMap>) => {
        console.log('doSetUserAttr', res);
        if (res.code === MailConfApiImpl.sOk) {
          return true;
        }
        return false;
      })
      .catch(reason => {
        console.warn(reason);
        return false;
      });
  }

  async setMailBlackList(params: { blackList?: string[]; whiteList?: string[] }): Promise<ResponseData<StringMap>> {
    const { blackList, whiteList } = params || {};
    const blackListKey = MailSettingKeys.nRefuseList;
    const whiteListKey = MailSettingKeys.nSaveList;
    const attrs = {
      [blackListKey]: blackList ? blackList.join(',') : undefined,
      [whiteListKey]: whiteList ? whiteList.join(',') : undefined,
    };
    return this.httpApi
      .post(
        this.buildUrl('setAttr'),
        {
          attrs,
        },
        {
          contentType: 'json',
          useCacheResultPeriod: 600000,
          cachePolicy: 'refresh',
        }
      )
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<StringMap>) => {
        console.log('doSetUserAttr', res);
        if (res.code === MailConfApiImpl.sOk) {
          return res;
        }
        return Promise.reject(res);
      })
      .catch(reason => {
        console.warn(reason);
        return Promise.reject(reason);
      });
  }

  async setMailDefaultEncoding(key: string): Promise<boolean> {
    const EcodingKey = MailSettingKeys.nForward;
    const attrs = {
      [EcodingKey]: key,
    };
    return this.httpApi
      .post(
        this.buildUrl('setAttr'),
        {
          attrs,
        },
        {
          contentType: 'json',
          useCacheResultPeriod: 600000,
          cachePolicy: 'refresh',
        }
      )
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<StringMap>) => {
        console.log('doSetUserAttr', res);
        if (res.code === MailConfApiImpl.sOk) {
          return true;
        }
        return Promise.reject(res);
      })
      .catch(reason => {
        console.warn(reason);
        return false;
      });
  }

  async getMailSenderInfo(_account?: string): Promise<MailAliasAccountModel[]> {
    const url = this.systemApi.getUrl('getMailSenderInfo');
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    let _defaultSender: string;
    if (!isCorpMail) {
      // corp没有该属性
      _defaultSender = await this.getDefaultSendingAccount(_account); // this.doGetUserAttr([MailSettingKeys.nDefaultSendingAccount]);
    }
    const sid = this.getSid(_account);
    return this.httpApi
      .get(url, { sid }, { _account })
      .then(res => {
        const isCorpMail = this.systemApi.getIsCorpMailMode();
        if (isCorpMail) {
          corpMailUtils.corpMailTransformResponse(res);
        }
        const data = res.data as ResponseData;
        return data;
      })
      .then(async (res: ResponseData<AccountInfoModel>) => {
        const {
          // 如果res.data.aliasList为null，aliasList不会赋值为默认值
          aliasList = [],
          domainList = [],
          popAccountList = [],
          accountName = '',
          // 主邮箱
          email = '',
          nickName = '',
          senderName = '',
          defaultSender,
        } = res.data || {};
        const mailEmail = email;
        const defaultAliasList: MailAliasAccountModel[] = !aliasList
          ? []
          : aliasList.map(alias => ({
              id: alias?.email,
              name: alias?.email?.split('@')[0] || '',
              domain: alias?.email?.split('@')[1] || '',
              nickName: alias?.nickName,
              senderName: alias?.senderName,
              mailEmail,
              // 是否为主邮箱
              isMainEmail: alias?.email === email,
              isDefault: alias?.email === defaultSender?.email,
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
                mailEmail,
                // 是否为主邮箱
                isMainEmail: `${accountName}@${domain}` === email,
                isDefault: defaultSender?.email === `${accountName}@${domain}`,
                nickName,
              }));
        const popoAliasList: MailAliasAccountModel[] = !popAccountList
          ? []
          : popAccountList?.map(({ id, email, nickName, senderName = '' }) => ({
              id: email,
              editId: id,
              name: nickName,
              domain: email?.split('@')[1],
              isProxy: true,
              nickName,
              senderName,
              mailEmail,
              // 代发邮箱不可能是主邮箱
              isMainEmail: false,
              isDefault: email === _defaultSender, // _defaultSender[MailSettingKeys.nDefaultSendingAccount],
            }));
        /** 别名不展示代收邮箱 */
        const _result = [...defaultAliasList, ...domainAliasList, ...popoAliasList];
        const result = _result
          .sort((a, b) =>
            // eslint-disable-next-line no-nested-ternary
            a.isDefault ? -1 : b.isDefault ? 1 : 0
          )
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
          _account
        );
        return result;
      })
      .catch(err => {
        console.error(err);
        return [];
      });
  }
  // tag-zpy: 无引用，暂不处理多账号
  doGetOriginAccount() {
    return this.action.mailConf[MailSettingKeys.nOriginalAccount];
  }

  setMailPageLayout(value: string): void {
    const key = MailSettingKeys.nBannerLayout;
    this.putLocalSettingValue(value, key);
    // 调用新接口同步
    this.setMailConfig();
  }

  getMailPageLayout(): string {
    const key = MailSettingKeys.nBannerLayout;
    // 首次配置还没设置过，在桌面端显示分栏'1'，web端显示通栏'2'
    const defaultVal = this.systemApi.isElectron() ? '1' : '2';
    const res = this.getLocalSettingValue(key, defaultVal);
    if (res) {
      // v1.18版本前使用 true false 存储变量，保持兼容性需要做一个转换
      if (res === 'true') {
        return '1';
      }
      if (res === 'false') {
        return '2';
      }
      return this.getLocalSettingValue(key);
    }
    // 应该是走不到这个return，后续可以考虑去掉
    return defaultVal;
  }

  // 设置邮箱展示摘要
  setMailShowDesc(value: boolean): void {
    // const ev = {
    //   eventName: 'mailChanged',
    //   eventData: value,
    //   eventStrData: 'showDescChange',
    // } as SystemEvent;
    const key = MailSettingKeys.nShowDesc;
    this.putLocalSettingValue(value, key);
    // 调用新接口同步
    this.setMailConfig();
  }

  // 获取邮箱展示摘要
  getMailShowDesc(): boolean {
    const key = MailSettingKeys.nShowDesc;
    if (key in this.action.mailConf) {
      const ret = this.action.mailConf[key];
      return ret === 'true';
    }
    // 获取不到，默认返回true
    const sync = this.storeApi.getSync(key);
    const ret = sync && sync.data && sync.suc ? sync.data : 'true';
    this.action.mailConf[key] = ret;
    return ret === 'true';
  }

  // 设置邮箱展示附件
  setMailShowAttachment(value: boolean): void {
    // const ev = {
    //   eventName: 'mailChanged',
    //   eventData: value,
    //   eventStrData: 'showAttachmentChange',
    // } as SystemEvent;
    const key = MailSettingKeys.nShowAttachment;
    this.putLocalSettingValue(value, key);
    // 调用新接口同步
    this.setMailConfig();
  }

  // 获取邮箱展示附件
  getMailShowAttachment(): boolean {
    const key = MailSettingKeys.nShowAttachment;
    if (key in this.action.mailConf) {
      const ret = this.action.mailConf[key];
      return ret === 'true';
    }
    // 获取不到，默认返回true
    const sync = this.storeApi.getSync(key);
    const ret = sync && sync.data && sync.suc ? sync.data : 'true';
    this.action.mailConf[key] = ret;
    return ret === 'true';
  }

  // 设置邮箱展示头像
  setMailShowAvator(value: boolean): void {
    const key = MailSettingKeys.nShowAvator;
    this.putLocalSettingValue(value, key);
    // 调用新接口同步
    this.setMailConfig();
  }

  // 获取邮箱展示固件
  getMailShowAvator(): boolean {
    const key = MailSettingKeys.nShowAvator;
    if (key in this.action.mailConf) {
      const ret = this.action.mailConf[key];
      return ret === 'true';
    }
    // 获取不到，默认返回true,默认展示头像
    const sync = this.storeApi.getSync(key);
    const ret = sync && sync.data && sync.suc ? sync.data : 'true';
    this.action.mailConf[key] = ret;
    return ret === 'true';
  }

  // 设置写信具体时间
  setShowConcreteTime(value: boolean): void {
    const key = MailSettingKeys.nShowConcreteTime;
    this.putLocalSettingValue(value, key);
    // 调用新接口同步
    this.setMailConfig();
  }

  // 获取写信具体时间
  getShowConcreteTime(): boolean {
    const key = MailSettingKeys.nShowConcreteTime;
    if (key in this.action.mailConf) {
      const ret = this.action.mailConf[key];
      return ret === 'true';
    }
    // 获取不到，默认返回true,默认展示头像
    const sync = this.storeApi.getSync(key);
    const ret = sync && sync.data && sync.suc ? sync.data : 'true';
    this.action.mailConf[key] = ret;
    return ret === 'true';
  }

  // 设置邮件列表支持客户邮件筛选
  setShowCustomerTab(value: boolean): void {
    const key = MailSettingKeys.nMailListShowCustomerTab;
    this.putLocalSettingValue(value, key);
  }

  // 获取邮件列表支持客户邮件筛选
  getShowCustomerTab(): boolean {
    const key = MailSettingKeys.nMailListShowCustomerTab;
    if (key in this.action.mailConf) {
      const ret = this.action.mailConf[key];
      return ret === 'true';
    }
    // 获取不到，默认返回true,默认支持客户邮件列表筛选
    const sync = this.storeApi.getSync(key);
    const ret = sync && sync.data && sync.suc ? sync.data : 'true';
    this.action.mailConf[key] = ret;
    return ret === 'true';
  }

  // 设置邮箱列表密度
  setMailListTightness(value: string): void {
    const key = MailSettingKeys.nMailListTightness;
    this.action.mailConf[key] = String(value);
    this.storeApi.putSync(key, String(value));
    // 发送事件
    // const ev = {
    //   eventName: 'mailChanged',
    //   eventData: value,
    //   eventStrData: 'mailListTightnessChange',
    // } as SystemEvent;
    // this.eventApi.sendSysEvent(ev);
    // 调用新接口同步
    // 紧凑模式下，会自动调用一次不展示附件，可以不用调用
    if (+value !== 3) {
      this.setMailConfig();
    }
  }

  // 获取邮箱列表密度
  getMailListTightness(): string {
    const key = MailSettingKeys.nMailListTightness;
    return this.getLocalSettingValue(key, '2'); // 默认适中
  }

  private getIsUseRealListKey() {
    return process.env.BUILD_ISELECTRON ? 'DISPLAY_PAGING_DESKTOP' : 'DISPLAY_PAGING_WEB';
  }

  private getIsUseRealListOtherKey() {
    return process.env.BUILD_ISELECTRON ? 'DISPLAY_PAGING_WEB' : 'DISPLAY_PAGING_DESKTOP';
  }

  // 服务端获取邮箱快捷设置的配置，返回true说明使用服务端配置，返回false说明：服务端请求失败/配置不可用
  async getMailConfig(): Promise<boolean> {
    const result = this.mailApi
      .getMailConfig()
      .then(res => {
        // 默认设置
        // mailView 取值为：SUB_FIELD（左右分栏）、FULL_FIELD（通栏），互斥
        // listSpace 取值为：LOOSE（宽松）、SUITABLE（适中）、COMPACT（紧凑），互斥
        // mailView 取值为：ABSTRACT（摘要）、ATTACH_DETAIL（附件明细）、SENDER_ICON（发件人头像），不互斥
        // const defaultSet = {
        //   displayMode: 'SMART_TOTAL',
        //   mailView: this.systemApi.isElectron() ? 'FULL_FIELD' : 'SUB_FIELD',
        //   listSpace: 'SUITABLE',
        //   listElements: ['ABSTRACT', 'ATTACH_DETAIL', 'SENDER_ICON'],
        // }
        // 如果服务端设置可用,则使用服务端配置，注意需要单独判断，因为有可能某些配置没有。此处仅同步本地
        if (res.available) {
          const set = { ...res };
          // 展示模式
          // displayMode 取值为：SMART_TOTAL（智能模式-全部）、SMART_PRIOR（智能模式-优先）、TOPIC_AGG（主题聚合），互斥
          if (set.displayMode) {
            // 先设置是否聚合模式
            // const key = MailSettingKeys.nIntelligentInbox;
            // 17版本智能模式下线后，只需要判断是否聚合模式即可
            const value = Boolean(set.displayMode === 'TOPIC_AGG');
            const isMerge = this.getMailMergeSettings() === 'true';
            // 如果远程和本地不一致则同步一次
            if (value !== isMerge) {
              this.setMailMergeSettings(value, true);
            }
            // 设置是否默认展示优先tab
            // const key1 = MailSettingKeys.nIntBoxDisplayList;
            // const value1 = Boolean(set.displayMode === 'SMART_PRIOR');
            // this.putLocalSettingValue(value1, key1);
          }
          // 邮件视图 { 1: 'SUB_FIELD', 2: 'FULL_FIELD', 3: 'UP_DOWN_FIELD' }
          if (set.mailView) {
            const key = MailSettingKeys.nBannerLayout;
            const jsonView = { SUB_FIELD: '1', FULL_FIELD: '2', UP_DOWN_FIELD: '3' };
            this.putLocalSettingValue(jsonView[set.mailView], key);
            this.action.mailConf[key] = jsonView[set.mailView];
          }
          // 列表密度
          if (set.listSpace) {
            const json = { LOOSE: 1, SUITABLE: 2, COMPACT: 3 } as unknown as StringMap;
            const key = MailSettingKeys.nMailListTightness;
            const value = json[set.listSpace];
            this.action.mailConf[key] = String(value);
            this.storeApi.putSync(key, String(value));
          }
          // 列表元素，此处待商议
          if (Array.isArray(set.listElements)) {
            // 摘要
            const key = MailSettingKeys.nShowDesc;
            this.putLocalSettingValue(set.listElements.includes('ABSTRACT'), key);
            // 附件
            const key1 = MailSettingKeys.nShowAttachment;
            this.putLocalSettingValue(set.listElements.includes('ATTACH_DETAIL'), key1);
            // 头像
            const key2 = MailSettingKeys.nShowAvator;
            this.putLocalSettingValue(set.listElements.includes('SENDER_ICON'), key2);
            // 显示发信具体时间
            const key3 = MailSettingKeys.nShowConcreteTime;
            this.putLocalSettingValue(set.listElements.includes('DISPLAY_MAIL_SEND_TIME'), key3);

            const useRealListKey = MailSettingKeys.nIsUseReaList;
            const isUseRealList = set.listElements.includes(this.getIsUseRealListKey());
            MailConfApiImpl.isUseRealList = isUseRealList;
            this.putLocalSettingValue(isUseRealList, useRealListKey, undefined, this.getUseRealListStoreConfig());

            const otherRealListKey = this.getIsUseRealListOtherKey();
            const isOtherRealList = set.listElements.includes(otherRealListKey);
            if (isOtherRealList) {
              this.action.otherMailConfigListElements.push(otherRealListKey);
            }
          }
          // 快捷设置打点一次
          // 获取快捷设置当前配置
          const params = this.getQuickSettingParam();
          // 打点
          this.quickSettingTrack(params);
        } else {
          // 服务端不可用则打点null
          this.quickSettingTrack({}, true);
        }
        const sendRevoke = res.sendRevoke || 'OFF';
        const sendRevokeIn = res.sendRevokeIn || 15;
        this.storeApi.putSync('sendRevoke', sendRevoke);
        this.storeApi.putSync('sendRevokeIn', String(sendRevokeIn));
        return res.available as boolean;
      })
      .catch(() => false);
    return result;
  }

  // 设置配置,调用新的接口
  async setMailConfig(): Promise<boolean> {
    // 获取快捷设置当前配置
    const params = this.getQuickSettingParam();
    // 打点
    this.quickSettingTrack(params);
    // 请求
    return this.mailApi.setMailConfig(params);
  }

  // 获取快捷设置本地配置,打点和设置需要
  private getQuickSettingParam(): MailConfigQuickSettingModel {
    // const key = MailSettingKeys.nIntelligentInbox; // 智能/聚合
    // const key1 = MailSettingKeys.nIntBoxDisplayList; // 全部/优先
    const key2 = MailSettingKeys.nBannerLayout; // 通栏分栏
    const key3 = MailSettingKeys.nMailListTightness; // 列表密度
    const key4 = MailSettingKeys.nShowDesc; // 摘要
    const key5 = MailSettingKeys.nShowAttachment; // 附件
    const key6 = MailSettingKeys.nShowAvator; // 头像
    const key7 = MailSettingKeys.nShowConcreteTime; // 展示具体时分
    const isUseRealListKey = MailSettingKeys.nIsUseReaList;
    const displayMode = this.getMailMergeSettings() === 'true' ? 'TOPIC_AGG' : 'NORMAL';
    // const mailView = this.getLocalSettingValue(key2) === 'true' ? 'SUB_FIELD' : 'FULL_FIELD';
    const jsonView: { [key: string]: MailView } = { 1: 'SUB_FIELD', 2: 'FULL_FIELD', 3: 'UP_DOWN_FIELD' };
    const mailView = jsonView[this.getLocalSettingValue(key2)] || 2; // 兼容老版本 true false
    const json = { 1: 'LOOSE', 2: 'SUITABLE', 3: 'COMPACT' } as StringMap;
    const listSpace = json[this.getLocalSettingValue(key3, '2')];
    const listElements: string[] = [];
    // 如果本地目前设置显示摘要，则添加
    if (this.getLocalSettingValue(key4, 'true') === 'true') {
      listElements.push('ABSTRACT');
    }
    // 如果本地目前设置显示附件，则添加
    if (this.getLocalSettingValue(key5, 'true') === 'true') {
      listElements.push('ATTACH_DETAIL');
    }
    // 如果本地目前设置显示头像，则添加
    if (this.getLocalSettingValue(key6, 'true') === 'true') {
      listElements.push('SENDER_ICON');
    }
    if (this.getLocalSettingValue(isUseRealListKey, 'false', undefined, this.getUseRealListStoreConfig()) === 'true') {
      listElements.push(this.getIsUseRealListKey());
    }
    // 设置展示具体时分，则添加
    if (this.getLocalSettingValue(key7, 'false') === 'true') {
      listElements.push('DISPLAY_MAIL_SEND_TIME');
    }
    if (this.action && this.action.otherMailConfigListElements && this.action.otherMailConfigListElements.length) {
      const otherListElementKeys = this.action.otherMailConfigListElements.filter(item => !listElements.includes(item));
      if (otherListElementKeys && otherListElementKeys.length) {
        listElements.push(...otherListElementKeys);
      }
    }
    let sendRevoke = this.storeApi.getSync('sendRevoke').data;
    sendRevoke = sendRevoke && ['ON', 'OFF'].includes(sendRevoke) ? sendRevoke : 'OFF';
    let sendRevokeIn = Number(this.storeApi.getSync('sendRevokeIn').data);
    sendRevokeIn = sendRevokeIn && [5, 10, 15, 30, 60].includes(sendRevokeIn) ? sendRevokeIn : 0;
    const params = {
      displayMode,
      mailView,
      listSpace,
      listElements,
      sendRevoke,
      sendRevokeIn,
    } as MailConfigQuickSettingModel;
    return params as MailConfigQuickSettingModel;
  }

  // 快捷设置相关打点getMailConfig触发一次，setMailConfig每次都触发
  private quickSettingTrack(param: MailConfigQuickSettingModel, isNull?: boolean) {
    const { displayMode, mailView, listSpace, listElements } = param || {};
    let json = {};
    if (isNull) {
      json = {
        thread: null,
        layout: null,
        space: null,
        showDigest: null,
        showAttachment: null,
        showHeadPortrait: null,
      };
    } else {
      // 列表密度映射表
      const tightnessObj = {
        LOOSE: '宽松',
        SUITABLE: '适中',
        COMPACT: '紧凑',
      };
      // 展示模式,优先/全部tab
      const layoutJson = { SUB_FIELD: '左右分栏', FULL_FIELD: '通栏', UP_DOWN_FIELD: '上下分栏' };
      json = {
        thread: displayMode === 'TOPIC_AGG' ? '按主题聚合' : '普通模式',
        layout: mailView ? layoutJson[mailView] : '通栏',
        space: (listSpace && tightnessObj[listSpace]) || '适中',
        showDigest: listElements && listElements.includes('ABSTRACT') ? 'on' : 'off',
        showAttachment: listElements && listElements.includes('ATTACH_DETAIL') ? 'on' : 'off',
        showHeadPortrait: listElements && listElements.includes('SENDER_ICON') ? 'on' : 'off',
        showPagingDevice: listElements && listElements.includes(this.getIsUseRealListKey()) ? 'on' : 'off',
        showPointInTime: listElements && listElements.includes('DISPLAY_MAIL_SEND_TIME') ? 'on' : 'off',
      };
    }
    this.dataTracker.track('pcMail_view_mailListPage', json);
  }

  doOpenRelatedPage(contact: ContactModel, fromAccount?: string): void {
    // fromAccount不传则使用主账号
    const mainEmail = this.systemApi.getMainAccount1().email;
    const sinceAccount = (fromAccount || mainEmail) as string;
    // 往来联系人
    const list: string[] = [];
    if (contact && contact.contactInfo && contact.contactInfo.length > 0) {
      contact.contactInfo.forEach(it => {
        if (it.contactItemType === 'EMAIL') {
          list.push(it.contactItemVal);
        }
      });

      if (list.length > 0) {
        // 桌面端 通知
        if (this.systemApi.isElectron()) {
          this.systemApi.createWindowWithInitData('readMailComb', {
            eventData: {
              fromAccount: sinceAccount,
              list,
            },
            eventName: 'initPage',
          });
        } else {
          // 网页端 链接
          this.systemApi.openNewWindow(MailConfApiImpl.contextPath + '/readMailComb/?account=' + encodeURIComponent(sinceAccount) + `#${list.join(',')}`, false);
        }
      }
    }
  }

  doOpenEdmRelatedPage(params: EdmRelatedPageParams): void {
    const { _account, customerId, selectedEmail, isSelf } = params;
    if (!customerId || !selectedEmail) {
      throw new Error('必须传入客户id以及客户联系人');
    }
    const mainEmail = this.systemApi.getMainAccount1().email;
    const account = _account || mainEmail;
    if (!isSelf) {
      const list = [selectedEmail];
      // 桌面端 通知
      if (this.systemApi.isElectron()) {
        this.systemApi.createWindowWithInitData('readMailComb', {
          eventData: {
            fromAccount: account,
            list,
          },
          eventName: 'initPage',
        });
      } else {
        // 网页端 链接
        this.systemApi.openNewWindow(MailConfApiImpl.contextPath + '/readMailComb/?account=' + encodeURIComponent(account) + `#${list.join(',')}`, false);
      }
      return;
    }

    if (this.systemApi.isElectron()) {
      this.systemApi.createWindowWithInitData('readMailComb', {
        eventData: {
          fromAccount: _account,
          customerId,
          selectedEmail,
        },
        eventName: 'initPage',
      });
    } else {
      const search = `account=${account}&customerId=${customerId}&selectedEmail=${selectedEmail}`;
      this.systemApi.openNewWindow(`${MailConfApiImpl.contextPath}/readMailComb/?${encodeURIComponent(search)}`, false);
    }
  }

  doOpenStrangerPage(): void {
    if (this.systemApi.isElectron()) {
      this.systemApi
        .createWindowWithInitData('strangerMails', {
          eventName: 'initPage',
        })
        .then();
    } else {
      this.systemApi.openNewWindow(MailConfApiImpl.contextPath + '/strangerMails/', false);
    }
  }

  /**
   * 聚合邮件模式切换 ，使用 refresh 消息
   * @param value
   */
  setMailMergeSettings(value?: boolean, notAsync?: boolean) {
    const ev = {
      eventName: 'mailChanged',
      eventData: value,
      eventSeq: 0,
      eventStrData: 'mailMergeModelChange',
    } as SystemEvent;
    const key = MailSettingKeys.nShowMergedMail;
    this.putLocalSettingValue(value, key, ev);
    // 调用新接口同步
    if (!notAsync) {
      this.setMailConfig();
    }
  }

  setMailAutoAddContact(enable: boolean): Promise<boolean> {
    const key = MailSettingKeys.nAutoAddMailContact;
    return this.doSetUserAttr({
      [key]: enable ? '1' : '0',
    });
  }

  setReplyForwardSetting(_value: '0' | '2') {
    // throw new Error('Method not implemented.');
    return this.doSetUserAttr({
      [MailSettingKeys.nForward]: _value,
      [MailSettingKeys.nReplay]: _value,
    });
  }

  async setBlackListOrWhiteList(email: string, block: boolean): Promise<boolean | string> {
    try {
      // todo 黑白名单超出限制问题
      const white = MailSettingKeys.nSaveList;
      const black = MailSettingKeys.nRefuseList;
      const currentList = await this.doGetUserAttr([white, black]);
      const { refuselist = '', safelist = '' } = currentList;
      if ((refuselist?.includes(email) && block) || (safelist?.includes(email) && !block)) {
        return 'exist';
      }
      let whiteList: string[] = [];
      let blackList: string[] = [];
      if (block) {
        blackList = refuselist.includes(email) ? refuselist.split(',') : [...refuselist.split(','), email];
        whiteList = safelist.split(',').filter(r => r !== email);
      } else {
        blackList = refuselist?.split(',').filter(r => r !== email);
        whiteList = whiteList.includes(email) ? safelist.split(',') : [...safelist.split(','), email];
      }
      // console.log('currentListcurrentList', { currentList, whiteList, blackList });
      return this.doSetUserAttr({
        [white]: whiteList.join(',') as any,
        [black]: blackList.join(',') as any,
      });
    } catch (error) {
      return false;
    }
  }

  private putLocalSettingValue(value: string | undefined | boolean, key: string, ev?: SystemEvent<any>, config?: StoreConfig) {
    // value = !!value;
    const data = String(value);
    this.action.mailConf[key] = data;
    this.storeApi.put(key, data, config).then(() => {
      if (ev) {
        this.eventApi.sendSysEvent(ev)?.catch(err => {
          console.error(err);
        });
        //  发送模式切换完成消息 , ev是上层调用传入的，不需要二次发送
        // this.eventApi
        //   .sendSysEvent({
        //     eventName: 'mailChanged',
        //     eventData: value,
        //     eventSeq: 0,
        //     eventStrData: 'mailMergeModelChange',
        //   })
        //   ?.catch(err => {
        //     console.error(err);
        //   });
      }
      console.log('[mail-conf] setting value stored ' + key + '->' + value);
    });
  }

  getMailMergeSettings(_account?: string): string {
    const key = MailSettingKeys.nShowMergedMail;
    return this.getLocalSettingValue(key, _account);
  }

  async getMailAutoAddContact(): Promise<string> {
    const defaultValue = '0';
    try {
      const key = MailSettingKeys.nAutoAddMailContact;
      if (this.action.mailConf && this.action.mailConf[key]) {
        return this.action.mailConf[key];
      }
      await this.loadConfFromServer();
      if (this.action.mailConf && this.action.mailConf[key]) {
        return this.action.mailConf[key];
      }
      return defaultValue;
    } catch (error) {
      return Promise.resolve(defaultValue);
    }
  }

  getPermRecallMail(): boolean {
    try {
      const key = MailSettingKeys.nPermRecallMail;
      const result = this.getLocalSettingValue(key);
      return typeof result === 'boolean' ? result : true;
    } catch (error) {
      return true;
    }
  }

  // 根据key获取对应的配置值，此方法存在缺陷
  // 需要注意，肯定会有返回值，因为默认的defaultVal为‘false’
  private getLocalSettingValue(key: string, defaultVal = 'false', _account?: string, storeConfig?: StoreConfig) {
    const action = this.systemApi.getActions({
      actions: this.action,
      subActions: this.subAccountAction,
      _account,
    })?.val;
    if (key in action.mailConf) {
      return action.mailConf[key];
    }
    const sync = this.storeApi.getSync(key, storeConfig ? { _account, ...storeConfig } : { _account });
    const ret = sync && sync.data && sync.suc ? sync.data : defaultVal;
    // this.action.mailConf[key] = ret;
    action.mailConf[key] = ret;
    return ret;
  }

  async getFolderSettings(_account?: string): Promise<string> {
    return this.getSettings(MailSettingKeys.nFolderSetting, _account);
  }

  private async getSettings(key: string, _account?: string) {
    const action = this.systemApi.getActions({
      actions: this.action,
      subActions: this.subAccountAction,
      _account,
    })?.val;
    let mailConfElement = action.mailConf[key];
    if (!mailConfElement) {
      await this.loadMailConf(_account);
      mailConfElement = action.mailConf[key];
    }
    return mailConfElement;
  }

  getReplayStyle(title: string): string {
    if (['Re:', 'RE:', '回复:', 'Re：', 'RE：', '回复：'].includes(title.substring(0, 3))) {
      return '';
    }
    return String(this.action.mailConf[MailSettingKeys.nReplay]) === '0' ? 'Re:' : '回复：';
  }

  getForwardStyle(title: string): string {
    if (['Fw:', 'FW:', '转发:', 'Fw：', 'FW：', '转发：'].includes(title.substring(0, 3))) {
      return '';
    }
    return String(this.action.mailConf[MailSettingKeys.nReplay]) === '0' ? 'Fw:' : '转发：';
  }

  getConfigByNreplay(): StringMap {
    return String(this.action.mailConf[MailSettingKeys.nReplay]) === '0' ? MailConfApiImpl.nReplayEnMap : MailConfApiImpl.nReplayChnMap;
  }

  async getDefaultSendingAccount(_account?: string): Promise<string> {
    // fix: getSettings内循环调用loadMailConf
    let mailConfElement = this.systemApi.getActions({
      actions: this.action,
      subActions: this.subAccountAction,
      _account,
    }).val?.mailConf[MailSettingKeys.nDefaultSendingAccount];
    if (!mailConfElement) {
      await this.loadConfFromServer(_account);
      mailConfElement = this.systemApi.getActions({
        actions: this.action,
        subActions: this.subAccountAction,
        _account,
      }).val?.mailConf[MailSettingKeys.nDefaultSendingAccount];
    }
    return mailConfElement;
  }

  /**
   * 选项 ntes_option 十六位字符串，默认值 Null，00000000，0000000000000000，在前端做初始化兼容
   * <p>
   * 【使用说明：专用 “选项/设置” 模块 】
   * <ul>
   * <li>左起第一位(forward)，表示转发邮件时前缀 0-Fw: , 1-Forward , 2-转发
   * <li>左起第二位(schedule_notify)，表示定时发信后邮件提醒， 0-默认发送，1-默认不发送
   * <li>左起第三位(readreplystatus)，表示阅读回复邮件时，是否显示原邮件内容 0-原邮件内容默认隐藏, 1-显示
   * <li>左起第四位(pop3show)，表示登录和点收信时，收取完成后右下角是否显示提示 0-显示 1-不显示
   * <li>左起第五位(flashupload)，表示是否使用Flash上传， 0-使用 1-不使用
   * <li>左起第六位(mailencode)，表示是否使用utf-8编码， （0-不使用 1-使用，免费邮箱）（0-使用 1-不使用，企业邮箱）
   * <li>左起第七位(sendershow)，表示是收件箱发件人显示， 0-优先显示通讯录中备注姓名（企业），优先显示发件人自定义姓名（非企业）
   * 1-优先显示发件人自定义姓名 2-优先显示通讯录中备注名
   * <li>左起第八位(sizeshow)，表示是收件箱大小显示， 0-不显示大小 1-显示大小
   * <li>左起第九位(soundalert)，拓展字段，详细请看拓展ud页面
   * <li>左起第十位(requirereceipt)，请求读信方发送已读回执，0-关闭 1-启用
   * <li>左起第十一位(thread)，是否开启会话，免费邮：0-开启 1-关闭，收费邮：0-关闭 1-开启
   * <li>左起第十二位(useTab)，是否开启多标签窗口，0-关闭 1-开启
   * <li>左起第十三位(deliver)，自定义投递规则，取值范围0-7；十进制数字转换成二进制
   * ，垃圾，广告，订阅分别占用二进制从左到右三位，每位0代表默认，1代表不投递到对应文件夹。
   * <li>左起第十四位(ext1)，本字段位扩展字段，前3位是签名相关设置，第4位表示是否开启chrome桌面通知，详细情况参见扩展字段中相应说明。
   * <li>左起第十五位(ext2)，本字段位扩展字段，详细情况参见扩展字段中相应说明。
   * <li>左起第十六位(ext3)，本字段位扩展字段，详细情况参见扩展字段中相应说明。
   * </ul>
   */
  private async loadConfFromServer(_account?: string): Promise<any> {
    const stamp = Date.now();
    if (stamp - this.action.lastAttrSyncTime < 120000) {
      return Promise.resolve();
    }
    const res: StringMap = await this.debouncedDoGetUserAttr(
      [
        MailSettingKeys.nForward,
        MailSettingKeys.nReplay,
        MailSettingKeys.nFolderSetting,
        MailSettingKeys.nAutoAddMailContact,
        MailSettingKeys.nDefaultSendingAccount,
        MailSettingKeys.nOriginalAccount,
        MailSettingKeys.nPermRecallMail,
        MailSettingKeys.nCosId,
        MailSettingKeys.nTimezone,
        MailSettingKeys.nLocalTimezone,
      ],
      _account
    );
    if (res && res[MailSettingKeys.nFolderSetting] !== undefined && res[MailSettingKeys.nDefaultSendingAccount] !== undefined) {
      const currentAction = this.systemApi.getActions({
        actions: this.action,
        subActions: this.subAccountAction,
        _account,
      }).val;
      if (currentAction) {
        currentAction.mailConf = Object.assign(currentAction.mailConf, res);
        currentAction.lastAttrSyncTime = Date.now();
      }
      // 更新埋点配置
      if (res[MailSettingKeys.nCosId]) {
        updateTrackerAttributes({
          mailVersion: res[MailSettingKeys.nCosId],
        });
      }
    }
    return res;
    // return {};
  }

  async loadMailConf(_account?: string): Promise<void> {
    if (this.systemApi.getCurrentUser(_account)) {
      this.getMailMergeSettings(_account);
      try {
        await this.loadConfFromServer(_account);
        // this.accountApi.doGetMailAliasAccountListV2({}).then();
        this.initData();
      } catch (e) {
        console.error(e);
      }
    }
    // this.getEntSignature(false).then();
  }

  buildUrl(key: keyof MethodMap, additionalParam?: StringMap, _account?: string) {
    const sid = this.getSid(_account);
    if (!sid) {
      return MailConfApiImpl.comNotExist;
    }

    const isCorpMailModeUser = this.systemApi.getIsCorpMailMode();
    if (isCorpMailModeUser) {
      const params = { sid, ...(additionalParam || {}) };
      const url = corpMailUtils.getUrlByMailFuncName(key);
      return this.httpApi.buildUrl(url, params);
    }

    let req = {
      func: methodMap[key],
      sid,
    };
    if (additionalParam) {
      req = Object.assign(req, additionalParam);
    }
    return this.httpApi.buildUrl(this.systemApi.getAccountUrl('mailOperation', _account), req);
  }

  unpackData(res: ApiResponse): ResponseData {
    // console.log('return from network:');
    console.log('[mail-conf] return from network:', res);
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    if (isCorpMail) {
      corpMailUtils.corpMailTransformResponse(res);
    }
    const data = res.data as ResponseData;
    return data;
  }

  createSubActions(_account: string) {
    // 已存在
    if (this.subAccountAction.has(_account)) {
      return { suc: true, msg: 'existed' };
    }
    this.subAccountAction.set(_account, new ActionStore());
    return { suc: true, msg: 'suc' };
  }

  initData() {
    console.log('initModule send account');
  }

  afterLoadFinish() {
    this.loadMailConf().then().catch(console.error);
    // 获取一次配置
    this.getMailConfig();
    // 获取一次发信邮件的阅读状态/打开记录过期时间配置
    this.getMailLimitFromServer();
    // 子账号新增 添加store
    this.eventApi.registerSysEventObserver('SubAccountAdded', {
      name: 'SubAccountAdded-MailConfImpl',
      func: ev => {
        if (ev && ev.eventData) {
          const { eventData } = ev;
          const { subAccount } = eventData;
          this.updateAccountTokens({ accountsParam: [subAccount], forceUpdate: true });
          if (subAccount && !this.subAccountAction.has(subAccount)) {
            this.subAccountAction.set(subAccount, new ActionStore());
          }
        }
      },
    });
    // 子账号删除 删除store
    this.eventApi.registerSysEventObserver('SubAccountDeleted', {
      name: 'SubAccountDeleted-MailConfImpl',
      func: ev => {
        if (ev && ev.eventData) {
          const { eventData } = ev;
          const { subAccount } = eventData;
          if (subAccount && this.subAccountAction.has(subAccount)) {
            this.subAccountAction.delete(subAccount);
          }
        }
      },
    });
    if (!process.env.BUILD_ISELECTRON) {
      this.eventApi.registerSysEventObserver('subAccountLogin', {
        name: 'subAccountLogin-MailConfImpl',
        func: ev => {
          if (ev && ev.eventData) {
            const { id: subAccount } = ev.eventData;
            if (!subAccount) return;
            this.updateAccountTokens({ accountsParam: [subAccount], forceUpdate: true });
          }
        },
      });
    }
    return this.name;
  }

  afterLogin(): string {
    // const user: User | undefined = ev?.user;
    // console.log(user);
    this.action = new ActionStore();
    this.loadMailConf().then();
    // 获取一次配置
    this.getMailConfig();
    return this.name;
  }

  init(): string {
    this.updateShouldAutoReadMail();
    return this.name;
  }

  afterInit() {
    try {
      const subAccounts: ISubAccountEmailOnlyInfo[] = this.storeApi.getSubAccountList();
      if (subAccounts?.length > 0) {
        subAccounts.forEach((subAccount: ISubAccountEmailOnlyInfo) => this.createSubActions(subAccount.email));
      }

      setTimeout(() => {
        this.updateAccountTokens({});
      }, 10);
    } catch (error) {
      console.log('获取子账号并设置 error', error);
    }
    return this.name;
  }

  doGetUserAttr(attrs: userAttr[], _account?: string): Promise<StringMap> {
    return this.httpApi
      .post(
        this.buildUrl('getAttr', undefined, _account),
        { attrIds: attrs },
        {
          contentType: 'json',
          useCacheResultPeriod: 600000,
          cachePolicy: 'refresh',
          _account,
        }
      )
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<StringMap>) => {
        if (res.code === MailConfApiImpl.sOk) {
          return res.var as StringMap;
        }
        return {};
      })
      .catch(reason => {
        console.warn(reason);
        return {};
      });
  }

  /**
   * 更改用户设置属性
   * ps: 接口获取nReply返回的值是 0｜2,
   * MailSettingKeys.nDefaultSendingAccount 设置value 是默认邮箱，所以attrs加上string
   * local_time_zone属性为布尔值，加上boolean
   */
  doSetUserAttr(
    attrs: Partial<{
      [key in userAttr]: '0' | '1' | '2' | string;
    }>,
    _account?: string
  ): Promise<boolean> {
    return this.httpApi
      .post(
        this.buildUrl('setAttr', undefined, _account),
        {
          attrs,
        },
        {
          contentType: 'json',
          useCacheResultPeriod: 600000,
          cachePolicy: 'refresh',
          ...{ _account },
        }
      )
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<StringMap>) => {
        console.log('doSetUserAttr', res);
        if (res.code === MailConfApiImpl.sOk) {
          const currentAction = this.systemApi.getActions({
            actions: this.action,
            subActions: this.subAccountAction,
            _account,
          }).val;
          currentAction && (currentAction.mailConf = { ...currentAction.mailConf, ...attrs });
          return true;
        }
        return false;
      })
      .catch(reason => {
        console.warn(reason);
        return false;
      });
  }

  // 请求邮件大小限制
  async reqMailLimit(params?: { _account?: string }): Promise<ReqMailLimitRes | undefined> {
    const { _account } = params || {};
    // 附件大小 + 邮件大小
    try {
      const attrs = await this.doGetUserAttr(['upload_size', 'smtp_max_send_mail_size'], _account);
      const { upload_size, smtp_max_send_mail_size } = attrs;
      if (typeof upload_size !== 'number' || typeof smtp_max_send_mail_size !== 'number') return;
      // 存储
      const storeConf = { storeMethod: 'localStorage' as StoreMethod, ...(_account ? { _account } : {}) };
      this.storeApi.putSync('upload_size', JSON.stringify(upload_size * 1024), storeConf);
      this.storeApi.putSync('upload_total_size', JSON.stringify(upload_size * 1024), storeConf);
      this.storeApi.putSync('smtp_max_send_mail_size', JSON.stringify(smtp_max_send_mail_size * 1024), storeConf);
      return { upload_size, smtp_max_send_mail_size };
    } catch (error) {
      console.error('请求邮件大小限制失败', error);
    }
  }

  // 获取邮件大小限制(主账号本地限制兜底)
  getMailLimit(params?: { _account?: string }): MailLimit {
    const { _account } = params || {};
    const curVersionId = this.productAuthApi.doGetProductVersionId();
    // 先取本地
    let mailLimit =
      curVersionId === 'free'
        ? {
            upload_size: free_upload_size_local,
            upload_total_size: free_upload_total_size_local,
            smtp_max_send_mail_size: free_smtp_max_send_mail_size_local,
          }
        : {
            upload_size: upload_size_local,
            upload_total_size: upload_total_size_local,
            smtp_max_send_mail_size: smtp_max_send_mail_size_local,
          };

    // 线上获取的
    try {
      const storeConf = { storeMethod: 'localStorage' as StoreMethod, ...(_account ? { _account } : {}) };
      const storeData0 = this.storeApi.getSync('upload_size', storeConf);
      const storeData1 = this.storeApi.getSync('upload_total_size', storeConf);
      const storeData2 = this.storeApi.getSync('smtp_max_send_mail_size', storeConf);
      if (storeData0.suc && storeData0.data) mailLimit.upload_size = Number(storeData0.data);
      if (storeData1.suc && storeData1.data) mailLimit.upload_total_size = Number(storeData1.data);
      if (storeData2.suc && storeData2.data) mailLimit.smtp_max_send_mail_size = Number(storeData2.data);
    } catch (error) {
      console.error('get upload_size error', error);
    }
    return mailLimit;
  }

  /**
   * 绑定（代发）邮箱设置
   * @param items 邮箱列表[{id:邮箱id， name:邮箱昵称}]
   * @returns 是否成功
   */
  doUpdatePOPAccounts(items: Array<{ id: number; name: string }>, _account?: string): Promise<boolean> {
    return this.httpApi
      .post(
        this.buildUrl('updatePOPAccounts'),
        {
          items,
        },
        {
          contentType: 'json',
          useCacheResultPeriod: 600000,
          cachePolicy: 'refresh',
          _account,
        }
      )
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<StringMap>) => {
        console.log('doUpdatePOPAccounts', res);
        if (res.code === MailConfApiImpl.sOk) {
          // this.action.mailConf = { ...this.action.mailConf, ...attrs };
          return true;
        }
        return false;
      })
      .catch(reason => {
        console.warn(reason);
        return false;
      });
  }

  isSubAccount(_account?: string): boolean {
    if (!_account || !_account.length) return false;
    const subAccountEmailId = this.storeApi.getEmailIdByEmail(_account);
    return !!subAccountEmailId;
  }

  getReadMailPackUrl(mail: MailEntryModel, atts: MailFileAttachModel[], filename?: string): string {
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    // 打包附件导出
    const urlKey = isCorpMail ? 'corpMailGetPackData' : 'readPack';
    let url = this.systemApi.getUrl(urlKey);
    const _token = this.accountTokens.find((token: AccountTokensType) => token.account === mail._account)?.token || '';
    const sid = this.getSid(mail._account);
    const partIds = atts.map(at => at.id).filter(e => e);
    const mailId = mail.entry.id;
    let pUrl = '';
    if (partIds && partIds.length > 0) {
      if (this.isSubAccount(mail._account) && !this.systemApi.getIsCorpMailMode() && !this.systemApi.isElectron()) {
        // 打包附件下载
        url = this.systemApi.getUrl('readPackProxy');
        pUrl += `${url}?mid=${mailId}&sid=${sid}&part=${partIds.join('&part=')}&_token=${_token}`;
      } else {
        pUrl += `${url}?mid=${mailId}&sid=${sid}&part=${partIds.join('&part=')}`;
      }
    }
    if (filename) {
      pUrl += `&filename=${encodeURIComponent(filename)}`;
    }
    console.log('getReadMailPackUrl', pUrl);
    return pUrl;
  }

  // https://mailh.qiye.163.com/js6/fj/getFile.jsp?sid=60vAL8M3F2kEyBuFEaPnARUNM*mZ74rO&mode=download&pack=true&part=AJoAVQDGGGfLnNGJF9IYJarb/3&part=ADsAGgBTGErIZ9LpleU3rqqA/3
  getFjFileUrl(params: ReqGetFjFileUrlParams) {
    const { partIds, pack = true, filename } = params;
    const user = this.systemApi.getCurrentUser();
    if (!user) {
      return '';
    }
    const { sessionId: sid } = user;
    let pUrl = `${this.systemApi.getUrl('getFjFile')}?sid=${sid}&mode=download&pack=${String(pack)}&part=${partIds.join('&part=')}`;
    if (filename) pUrl += `&filename=${encodeURIComponent(filename)}`;
    console.log('getFjFileUrl', pUrl);
    return pUrl;
  }

  // "&lt;p&gt;    &lt;img src=&#039;http://mailhz.qiye.163.com/qiyeimage/logo/469518531/1535599401643.jpg&#039;
  // _src=&#039;http://mailhz.qiye.163.com/qiyeimage/logo/469518531/1535599401643.jpg&#039;/&gt;&lt;br/&gt;&lt;a
  // href=&#039;https://www.163email.com.cn/&#039;&gt;https://www.163email.com.cn&lt;/a&gt;&lt;/p&gt;"
  getEntSignature(useCache?: boolean, _account?: string): Promise<ResponseSignature> {
    const currentAction = this.systemApi.getActions({
      actions: this.action,
      subActions: this.subAccountAction,
      _account,
    }).val;

    if (useCache && currentAction && currentAction.entSignature) {
      return Promise.resolve(currentAction.entSignature);
    }
    const entUrl = this.systemApi.getAccountUrl('entSignatureForMail', _account);
    {
      const sid = this.getSid(_account);
      if (!sid) {
        return Promise.reject(new Error('未登录？'));
      }
      return this.httpApi
        .get(
          entUrl,
          { sid },
          {
            useCacheResultPeriod: 600000,
            responseType: 'text',
            expectedResponseType: 'json',
            cachePolicy: 'useAndRefresh',
            ...{ _account },
          }
        )
        .then(this.unpackData.bind(this))
        .then((res: ResponseData<EntSignature>) => {
          if (res.msg === MailConfApiImpl.sOk || res.code === 200) {
            const data = res.data || res.result;
            const signature = {
              content: data?.content,
              enable: data?.apply === 1,
              isDefault: data?.position === 1,
            } as ResponseSignature;
            currentAction.entSignature = signature;
            return signature;
          }
          console.warn('got enterprise signature fail:', res);
          return {
            content: '',
            enable: false,
          } as ResponseSignature;
        })
        .catch(reason => {
          console.warn('got enterprise signature fail:', reason);
          return {
            content: '',
            enable: false,
          } as ResponseSignature;
        });
    }
  }

  // zpy-tag: 没有搜到引用。2023-8-28
  getUserSignature(id?: number): Promise<ResponseSignature | undefined> {
    if (!id) {
      return Promise.reject(new Error('no id set'));
    }
    const key = String(id);
    if (this.action.signatures && this.action.signatures.containsKey(key)) {
      return Promise.resolve(this.action.signatures.getByKey(key));
    }
    return this.listUserSignature(false).then(() => {
      if (this.action.signatures && this.action.signatures.containsKey(key)) {
        return this.action.signatures.getByKey(key);
      }
      return undefined;
    });
  }

  /**
   * 获取是否开启风险提示
   * 0 开启 1禁用 2 强制开启
   */
  getRiskReminderStatus(type = 4, _account?: string): Promise<number> {
    const url = this.systemApi.getUrl('getRiskReminderStatus');
    return this.httpApi
      .get(url, { type }, { _account })
      .then(res => res?.data?.result?.setting?.status || 0)
      .catch(() => 0);
  }

  /**
   * 更新是否开启风险提示
   */
  updateRiskReminderStatus(enable: boolean): Promise<any> {
    const status = enable ? 0 : 1;
    const param: SettingUpdateParam = {
      type: 4,
      status,
      mail_alert: status?.toString(),
      sms_alert: status?.toString(),
    };
    const url = this.systemApi.getUrl('updateRiskReminderStatus');
    return this.httpApi
      .post(url, param)
      .then(res => {
        this.storeApi.putSync('riskReminderStatus', String(status));
        return res?.data?.result?.suc;
      })
      .catch(() => false);
  }

  // getUserSignatureForUse(id?: number): Promise<ResponseSignature> {
  //   // console.log(id);
  //   // const now = new Date().getTime();
  //   // if (now - this.actions.lastSignatureUpdateTime < 60000) {
  //   //   return Promise.resolve(this.actions.defaultSignature);
  //   // }
  //   const ent = this.getEntSignature(true);
  //   const personal = this.listUserSignature(false, true);
  //   return Promise.all([personal, ent])
  //     .then(r => {
  //       const rr: ResponseSignature[] = r[0] as ResponseSignature[];
  //       const rs = rr && rr.length > 0 ? rr.filter(it => (id ? it.id === id : it.isDefault)).shift() : undefined;
  //       if (r[1] && r[1].content) {
  //         const entHtmlContent = decode(r[1].content, { level: 'html5' });
  //         r[1].content = entHtmlContent;
  //       }
  //       if (r[1] && rs) {
  //         // const s = r[1].isDefault
  //         //   ? '<p>' + rs.content + '</p><p>' + r[1].content + '</p>'
  //         //   : '<p>' + r[1].content + '</p><p>' + rs.content + '</p>';
  //         const s = r[1].isDefault ? this.htmlApi.mergeHtmlStr(rs.content, r[1].content) : this.htmlApi.mergeHtmlStr(r[1].content, rs.content);
  //         const content = r[1].enable ? s : rs.content;
  //         const ret: ResponseSignature = {
  //           content,
  //           enable: true,
  //         };
  //         // this.actions.lastSignatureUpdateTime = new Date().getTime();
  //         // this.actions.defaultSignature = ret;
  //         return ret;
  //       }
  //       if (rs || r[1]) {
  //         const ret = rs || r[1];
  //         // this.actions.lastSignatureUpdateTime = new Date().getTime();
  //         // this.actions.defaultSignature = ret;
  //         return ret;
  //       }
  //       return this.defaultSignature;
  //     })
  //     .catch(reason => {
  //       console.error(reason);
  //       return this.defaultSignature;
  //     });
  // }

  // zpy-tag: 无引用。2023-8-28
  createUserSignature(item: ResponseSignature): Promise<PopUpMessageInfo> {
    const url = this.buildUrl('createSignature');
    item.name = item.name || 'auto-' + (new Date().getTime() % 10000000);
    item.isHtml = true;
    return this.httpApi
      .post(url, { items: [item] }, { contentType: 'json' })
      .then((res: ApiResponse) => this.unpackData(res))
      .then((res: ResponseData) => {
        if (res.code === MailConfApiImpl.sOk) {
          item.id = res.var[0];
          this.action.signatures.add(item);
        }
        return {
          code: res.code,
          title: res.code === MailConfApiImpl.sOk ? res.var : res.message,
        } as PopUpMessageInfo;
      });
  }

  // zpy-tag: 无引用。2023-8-28
  deleteUserSignature(ids: number | number[]): Promise<PopUpMessageInfo> {
    if (!ids || (Array.isArray(ids) && ids.length === 0)) {
      return Promise.reject(new Error('参数错误'));
    }
    const url = this.buildUrl('deleteSignature');
    return this.httpApi
      .post(url, Array.isArray(ids) ? { ids } : { ids: [ids] }, {
        contentType: 'json',
      })
      .then(res => {
        const responseData = this.unpackData(res);
        if (responseData.code === MailConfApiImpl.sOk) {
          const items = Array.isArray(ids) ? ids.map(it => ({ id: Number(it) } as Partial<ResponseSignature>)) : [{ id: ids } as Partial<ResponseSignature>];
          this.action.signatures.removeAll(items);
        }
        return {
          code: responseData.code,
          title: responseData.message,
        } as PopUpMessageInfo;
      });
  }

  getMailClassifyRule(): Promise<ResponseMailClassify[]> {
    const url = this.buildUrl('getMailClassifyRule');
    return this.httpApi
      .post(url, { category: 'sirius_filter' }, { contentType: 'json' })
      .then((res: ApiResponse) => this.unpackData(res))
      .then((res: ResponseData) => res?.var || []);
  }

  addMailClassifyRule(items: ResponseMailClassify[]): Promise<PopUpMessageInfo> {
    const url = this.buildUrl('addMailClassifyRule');
    return this.httpApi
      .post(url, { items }, { contentType: 'json' })
      .then((res: ApiResponse) => this.unpackData(res))
      .then((res: ResponseData) => {
        let message = '规则保存成功！';
        const isSuc = res.code === 'S_OK';
        if (!isSuc) {
          message = '规则保存失败！请稍后重试！';
          if (res.exist && res.limit && res.exist >= res.limit) {
            message = `规则保存失败，最多支持创建${res.limit}条！`;
          }
        }
        return {
          code: res.code,
          data: res.var ?? [],
          title: message,
          success: isSuc,
        } as PopUpMessageInfo;
      });
  }

  editMailClassifyRule(items: ResponseMailClassify[]): Promise<PopUpMessageInfo> {
    const url = this.buildUrl('editMailClassifyRule');
    return this.httpApi
      .post(url, { items }, { contentType: 'json' })
      .then((res: ApiResponse) => this.unpackData(res))
      .then((res: ResponseData) => {
        let message = '规则保存成功！';
        const isSuc = res.code === 'S_OK';
        if (!isSuc) {
          message = '规则保存失败！请稍后重试！';
        }
        return {
          code: res.code,
          title: message,
          success: isSuc,
        } as PopUpMessageInfo;
      });
  }

  sortMailClassifyRule(id: number, value: number): Promise<PopUpMessageInfo> {
    const url = this.buildUrl('sortMailClassifyRule');
    return this.httpApi
      .post(url, { id, value }, { contentType: 'json' })
      .then((res: ApiResponse) => this.unpackData(res))
      .then(
        (res: ResponseData) =>
          ({
            code: res.code,
            title: res.message,
          } as PopUpMessageInfo)
      );
  }

  deleteMailClassifyRule(ids: number[]): Promise<PopUpMessageInfo> {
    const url = this.buildUrl('deleteMailClassifyRule');
    return this.httpApi
      .post(url, { ids }, { contentType: 'json' })
      .then((res: ApiResponse) => this.unpackData(res))
      .then(
        (res: ResponseData) =>
          ({
            code: res.code,
            title: res.message,
          } as PopUpMessageInfo)
      );
  }

  effectHistoryMail(rule: number, ruleIds?: number[]): Promise<PopUpMessageInfo> {
    const url = this.buildUrl('effectHistoryMail');

    const params = ruleIds
      ? {
          ruleIds,
        }
      : { rule: `@${rule}` };

    return this.httpApi
      .post(url, params, { contentType: 'json' })
      .then((res: ApiResponse) => this.unpackData(res))
      .then((res: ResponseData) => {
        let message = '';
        if (res.code === 'FA_OVERFLOW') {
          message = '历史邮件暂未生效，系统繁忙，请稍后重试。';
        } else if (res.code === 'FA_DUPLICATED_TASK') {
          message = '历史邮件暂未生效，当前有规则正在执行，请稍后重试。';
        } else if (res.code !== 'S_OK') {
          message = '历史邮件暂未生效，操作失败，请稍后重试。';
        }
        return {
          code: res.code,
          title: message,
          success: res.code === 'S_OK',
        } as PopUpMessageInfo;
      });
  }
  // zpy-tag: 上层无引用。2023-8-28
  listUserSignature(onlyGetDefault?: boolean, useCache?: boolean): Promise<ResponseSignature[] | undefined> {
    if (useCache && this.action.signatures.size() > 0) {
      const all = this.action.signatures.getAll();
      return Promise.resolve(this.sortSig(all));
    }
    const url = this.buildUrl('getSignature');
    return this.httpApi
      .post(
        url,
        {
          onlyGetId: false, // 是否只返回签名id
          onlyGetDefault: !!onlyGetDefault, // 是否只返回默认签名
        },
        {
          contentType: 'json',
          useCacheResultPeriod: 600000,
          cachePolicy: useCache ? 'useDirect' : 'refresh',
        }
      )
      .then(this.unpackData.bind(this))
      .then((res: ResponseData<ResponseSignature[]>) => {
        if (res.code === MailConfApiImpl.sOk) {
          // if (res.var && res.var.length > 0) return res.var[0];
          // else return this.actions.defaultSignature;
          if (res.var && res.var.length > 0) {
            this.storeSignature(this.sortSig(res.var));
            return res.var;
          }
        }
        return undefined;
      })
      .catch(() => undefined);
  }

  sortSig(items: ResponseSignature[]): ResponseSignature[] {
    return items.reverse();
  }
  // zpy-tag: 无引用。2023-8-28
  markDefaultSignature(id: number): Promise<PopUpMessageInfo> {
    return this.listUserSignature(false, false).then((res: ResponseSignature[] | undefined) => {
      if (res) {
        const lastItem = res.filter(it => it.isDefault).pop();
        const curItem = res.filter(it => it.id === id).pop();
        if (!curItem) {
          return {
            code: 'PARAM.ERR',
            title: '参数错误，请查证后重试',
            popupType: 'window',
          };
        }
        curItem.isDefault = true;

        if (lastItem) {
          lastItem.isDefault = false;
        }
        return this.updateUserSignature(lastItem ? [lastItem, curItem] : curItem);
      }
      return {
        code: 'SERVER.ERR',
        title: '服务器错误，请稍后再次尝试',
        popupType: 'window',
      };
    });
  }
  // zpy-tag: 无引用。2023-8-28
  updateUserSignature(items: ResponseSignature[] | ResponseSignature): Promise<PopUpMessageInfo> {
    const url = this.buildUrl('updateSignature');
    const data = Array.isArray(items) ? { items } : { items: [items] };
    data.items.forEach(it => {
      it.isHtml = true;
    });
    return this.httpApi.post(url, data, { contentType: 'json' }).then(res => {
      const data = this.unpackData(res);
      if (data.code === MailConfApiImpl.sOk) {
        if (Array.isArray(items)) {
          this.action.signatures.addAll(items, true);
        } else {
          this.action.signatures.update(items);
        }
      }
      return {
        code: data.code,
        title: data.message,
      } as PopUpMessageInfo;
    });
  }

  setDefaultSender(email: string) {
    const key = MailSettingKeys.nDefaultSendingAccount;
    return this.doSetUserAttr({
      [key]: email,
    });
  }

  setMailSenderName(name: string, _account?: string) {
    const key = MailSettingKeys.nSenderName;
    return this.doSetUserAttr(
      {
        [key]: name,
      },
      _account
    );
  }

  private getSid(_account?: string) {
    const currentUser = this.systemApi.getCurrentUser(_account);
    return currentUser?.sessionId || '';
  }
  // zpy-tag: 无引用。2023-8-28
  private storeSignature(res: ResponseSignature[]) {
    if (res && res.length > 0) {
      this.action.signatures.addAll(res, true);
    }
  }

  getWebMailHost(hostOnly?: boolean, _account?: string) {
    const currentNode = this.systemApi.getCurrentNode(_account);
    return hostOnly ? MailConfApiImpl.webMailUrlMap[currentNode + 'Host'] : MailConfApiImpl.webMailUrlMap[currentNode];
  }

  getNewWebMailMainUrl() {
    const inWebMail = this.systemApi.inWebMail();
    if (inWebMail) {
      return `${this.getNewWebMailHost()}/js6/main.jsp`;
    }
    return this.getWebMailHost();
  }

  getNewWebMailHost() {
    if (typeof window !== 'undefined' && !process.env.BUILD_ISELECTRON) {
      const isWebmail = this.systemApi.inWebMail();
      if (isWebmail) {
        const { location } = window;
        return `${location.protocol}//${location.host}`;
      }
      this.getWebMailHost(true);
    }
    return this.getWebMailHost(true);
  }

  /**
   * 拼接重定向的redirect请求，redirect会将需要的cookie种cookie中，以达到跳转免登
   * 杭州线上host：mailh.qiye.163.com
   * 北京线上host：mail.qiye.163.com
   * api地址：https://${host}/redirect?tk=${tk}&s=${s}&c=${c}&u=${u}&l=${l}
   * tk: cookie中的QIYE_TOKEN值，需要urlencode
   * s: cookie中的QIYE_SESS值，需要urlencode
   * c: cookie中的Coremail值，需要urlencode
   * u: 登录用户的完整有效地址，例如admin@devtest.com
   * l：重定向目标地址，需要urlencode
   */
  async getWebSettingUrlInLocal(name: string, urlType: { params?: StringMap; url?: string }) {
    const currentUser = this.systemApi.getCurrentUser();
    if (!currentUser) {
      return '';
    }
    const cookies = await this.systemApi.doGetCookies(true);
    const { QIYE_TOKEN, QIYE_SESS, Coremail } = cookies;
    const host = this.getNewWebMailHost() + '/redirect.jsp';
    const tkValue = QIYE_TOKEN ? `?tk=${escape(QIYE_TOKEN)}` : '?tk=';
    const sValue = QIYE_SESS ? `&s=${escape(QIYE_SESS)}` : '';
    const cValue = Coremail ? `&c=${escape(Coremail)}` : '';
    const uValue = `&u=${currentUser.id}`;
    const hl = inWindow() && window.systemLang === 'en' ? 'en_US' : 'zh_CN';
    let lValue = '';
    if (urlType.url) {
      lValue = '&l=' + escape(urlType.url);
    } else if (urlType.params) {
      lValue = '&l=' + escape(`${this.getNewWebMailMainUrl()}?sid=${currentUser.sessionId}&hl=${hl}#module=${name}${escape('|' + JSON.stringify(urlType.params))}`);
    }
    return host + tkValue + sValue + cValue + uValue + lValue;
  }

  async getWebSettingUrl(name: string) {
    const url = this.systemApi.getUrl('genMailOnlineJumpURL');
    const hl = inWindow() && window.systemLang === 'en' ? 'en_US' : 'ZH';
    try {
      const data = await this.httpApi.get(url, {
        sid: this.getSid(),
        module: name,
        hl,
      });
      if (data.data && data.data.success) {
        return data.data.data.url;
      }
    } catch (e) {
      console.warn(e);
    }
    return undefined;
  }

  async getSettingUrlCommon(params: GetSetttingParams) {
    const { name, inLocal, urlType, isCorpMail } = params;
    // eslint-disable-next-line no-nested-ternary
    const url: string | undefined = this.systemApi.isElectron()
      ? this.getSettingUrl(name, urlType)
      : // eslint-disable-next-line no-nested-ternary
      isCorpMail
      ? this.getCorpSettingUrl(name, urlType.params)
      : inLocal
      ? await this.getWebSettingUrlInLocal(name, urlType)
      : await this.getWebSettingUrl(name);
    return url;
  }

  getMailTabGuide(key: string) {
    return this.getLocalSettingValue(key);
  }

  setMailTabGuide(key: string, val: boolean) {
    this.putLocalSettingValue(val, key);
  }

  getCorpSettingUrl(name: string, params?: StringMap) {
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    if (isCorpMail) {
      const webUrl = corpMailUtils.getWebUrlByFeatureName(params?.subModName ? params.subModName : name);
      if (webUrl) {
        return webUrl;
      }
    }
    return '';
  }

  getSettingUrl(name: string, urlType?: { params?: StringMap; url?: string }) {
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    if (isCorpMail) {
      return this.getCorpSettingUrl(name, urlType?.params);
    }
    if (urlType?.url) {
      return urlType.url;
    }
    const currentUser = this.systemApi.getCurrentUser();
    const hl = inWindow() && window.systemLang === 'en' ? 'en_US' : 'zh_CN';
    // const currentNode = this.systemApi.getCurrentNode();
    if (currentUser) {
      let paramsValue = '';
      if (urlType?.params) {
        paramsValue = escape('|' + JSON.stringify(urlType?.params));
      }
      return this.getNewWebMailMainUrl() + '?sid=' + currentUser.sessionId + `&hl=${hl}#module=${name}${paramsValue}`;
    }
    return '';
  }

  async doGetMailAliasAccountList(noMain?: boolean): Promise<MailAliasAccountModel[]> {
    const url = this.buildUrl('aliasAccount');
    const res: ApiResponse = await this.httpApi.get(
      url,
      {},
      {
        // responseType: 'text',
        // expectedResponseType: 'json',
        cachePolicy: 'useAndRefresh',
      }
    );
    const currentUser = this.systemApi.getCurrentUser();
    if (!currentUser || !currentUser.sessionId) {
      return [];
    }
    const defaultSendingAccount = await this.getDefaultSendingAccount();
    if (!currentUser.accountName) {
      const nad = this.systemApi.handleAccountAndDomain(currentUser.id);
      currentUser.accountName = nad.account as string;
    }
    let rettt: MailAliasAccountModel[] = [];
    if (!noMain) {
      rettt.push({
        fid: 1,
        color: 1,
        name: currentUser.nickName || currentUser.accountName,
        id: currentUser.id,
        domain: currentUser.domain,
        isDefault: currentUser.id === defaultSendingAccount,
      } as MailAliasAccountModel);
    }
    if (res.data && res.data.code === MailConfApiImpl.sOk) {
      const result = res.data as ResponseData<ResponseAliasAccount[]>;
      if (result && result.var && result.var.length > 0) {
        const ret = result.var[0];
        // const domain = this.systemApi.handleAccountAndDomain(defaultSendingAccount);
        const mailAliasAccountModels = ret.aliases;
        mailAliasAccountModels.forEach(it => {
          if (it.id === defaultSendingAccount) {
            it.isDefault = true;
          }
          it.domain = currentUser.domain;
          rettt.push(it);
        });
        // return mailAliasAccountModels;
      }
      // return [];
    } else {
      // return Promise.reject(res.data?.code);
    }
    const strings = rettt.map(info => info.id) as string[];
    if (
      !currentUser.prop ||
      !('accountAlias' in currentUser.prop) ||
      !currentUser.prop.accountAlias ||
      !util.compareArray(strings, currentUser.prop.accountAlias as string[], false)
    ) {
      this.storeApi.setUserProp('accountAlias', strings, true);
    }
    rettt = rettt.sort((a, b) => {
      if (a.isDefault) {
        return -1;
      }
      return b.isDefault ? 1 : 0;
    });
    return rettt;
  }

  // 标签列表
  async requestTaglist(_account?: string): Promise<{
    code: string;
    var: MailTag[];
  }> {
    const key = 'getTaglist';
    const url = this.buildUrl(key, undefined, _account);
    const requestData = {
      stats: true,
      threads: true,
    };
    const requestConfig = {
      cachePolicy: this.action.tagsUpdated ? 'useAndRefresh' : 'refresh',
      _account,
    } as ApiRequestConfig;

    const isCorpMail = this.systemApi.getIsCorpMailMode();
    const ret = isCorpMail
      ? await this.httpApi.post(url, requestData, {
          ...requestConfig,
          contentType: 'json',
          _account,
        })
      : await this.httpApi.get(url, requestData, requestConfig);

    if (isCorpMail) {
      corpMailUtils.corpMailTransformResponse(ret);
    }

    if (ret.status !== 200 || ret.data?.code !== 'S_OK') {
      return Promise.reject(new Error(ret.data?.message || '请求错误'));
    }
    this.tagList = ret.data.var;
    const tagList = ret.data.var;
    tagList.forEach((item: TagItem) => {
      const strokeColor = reDefinedColorList.find(innerItem => innerItem.nums.includes(item[1]?.color))?.color || '#6BA9FF';
      const newBgColor = reDefinedColorListNew.find(innerItem => innerItem.nums.includes(item[1]?.color))?.color || '#6BA9FF';
      const fontColor = reDefinedColorListNew.find(innerItem => innerItem.nums.includes(item[1]?.color))?.fontColor || '#fff';
      this.tagNameMap[item[0]] = strokeColor;
      this.tagBgMap[item[0]] = newBgColor;
      this.tagNameFontColorMap[item[0]] = fontColor;
    });
    this.action.tagsUpdated = false;
    return Promise.resolve(tagList);
  }

  // 给邮件打标签
  // TODO: 补定义
  async updateMessageTags(params: any, _account?: string) {
    const key = 'updateMessageTags';
    const url = this.buildUrl(key, undefined, _account);
    const ret = await this.httpApi.post(
      url,
      {
        ...params,
      },
      {
        contentType: 'json',
        _account,
      }
    );
    if (ret.status !== 200 || ret.data?.code !== 'S_OK') {
      return Promise.reject(new Error(ret.data?.message || '操作失败'));
    }
    return Promise.resolve('');
  }

  getTaglist() {
    return this.tagList as unknown as MailTag[];
  }

  getTagColor(name: string, getNewColor?: boolean) {
    if (getNewColor) {
      return this.tagBgMap[name];
    }
    return this.tagNameMap[name];
  }

  getTagFontColor(name: string) {
    return this.tagNameFontColorMap[name];
  }

  // 管理标签
  async manageTag(
    type: 'add' | 'replace' | 'delete' | 'update',
    params: Array<[string, { color: number; alias: string; isShow: number }]> | string[],
    alias?: string,
    _account?: string
  ) {
    const key = 'manageTag';
    const url = this.buildUrl(key, undefined, _account);
    this.action.tagsUpdated = true;

    const EXIST_ERROR_MSG = '已存在同名标签（不区分英文大小写）';

    if (['add'].includes(type) && this.tagList.map(item => (item[0] || '').toLowerCase()).includes((alias as string).toLowerCase())) {
      return Promise.reject(new Error(EXIST_ERROR_MSG));
    }
    const ret = await this.httpApi.post(
      url,
      {
        [type]: params,
      },
      {
        contentType: 'json',
        _account,
        noEnqueue: true,
      }
    );
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    if (isCorpMail) {
      corpMailUtils.corpMailTransformResponse(ret);
    }
    if (ret.status !== 200 || ret.data?.code !== 'S_OK') {
      // eslint-disable-next-line no-nested-ternary
      const message = ret.data?.message ? ret.data?.message : ret.data?.code === 'FA_NAME_EXISTS' ? EXIST_ERROR_MSG : '操作失败';
      return Promise.reject(new Error(message));
    }
    this.action.tagsUpdated = true;
    // 延迟请求 避免数据读写不同步的问题
    setTimeout(() => {
      this.requestTaglist(_account);
      const newParams: NewTagOpItem[] = params.map(v => {
        if (typeof v === 'string') {
          return {
            tag: v,
            alias: '',
          };
        }
        return {
          tag: v[0],
          alias: v[1].alias || '',
        };
      });
      this.mailApi.refreshDbMailsByTag(newParams, type, _account).then(() => {
        storeOps.mail.updateMailTag({
          params,
          type,
          _account,
        });
        // 发送跨窗口消息
        if (this.systemApi.isElectron()) {
          this.eventApi.sendSysEvent({
            eventName: 'mailStoreRefresh',
            eventStrData: 'mailTag',
            eventData: {
              params,
              type,
            },
            _account,
          } as SystemEvent);
        }
      });
    }, 500);
    return Promise.resolve('');
  }

  // 获取默认是否展示智能收件箱
  // async isShowAIMailBox(): Promise<boolean> {
  //   const key = MailSettingKeys.nIntelligentInbox;
  //   let temp = this.action.mailConf[key];
  //   // 如果没有获取过
  //   if (temp === undefined) {
  //     const res: StringMap = await this.doGetUserAttr([key]);
  //     if (res && res[key] !== undefined) {
  //       temp = res[key] ? 'true' : 'false';
  //       this.action.mailConf = Object.assign(this.action.mailConf, {
  //         [key]: temp === 'true' ? '1' : '0',
  //       });
  //       this.action.lastAttrSyncTime = Date.now();
  //     }
  //     this.putLocalSettingValue(temp === 'true', key);
  //   }
  //   return Promise.resolve(temp === 'true');
  // }

  async getReplySetting(): Promise<string> {
    const key = MailSettingKeys.nReplay;
    const res: StringMap = await this.doGetUserAttr([key]);
    return res[key];
  }

  setMailRealListPageSize(val: number) {
    try {
      this.storeApi.putSync(MailSettingKeys.nMailRealListPageSize, val.toString());
    } catch (ex) {
      console.error('setMailRealListPageSize-catch', ex);
    }
  }

  getMailRealListPageSize(): number {
    const deault_size = 20;
    try {
      const val = this.storeApi.getSync(MailSettingKeys.nMailRealListPageSize);
      if (val && val.suc && val.data) {
        return Number.parseInt(val.data, 10);
      }
      return deault_size;
    } catch (ex) {
      return deault_size;
    }
  }

  getIsUseRealListSync(): boolean {
    // 外贸暂时屏蔽实体列表
    try {
      if (typeof MailConfApiImpl.isUseRealList === 'boolean') {
        return MailConfApiImpl.isUseRealList;
      }
      const val = this.storeApi.getSync(MailSettingKeys.nIsUseReaList, this.getUseRealListStoreConfig());
      if (val && val.suc && val.data) {
        const res = val.data === 'true';
        MailConfApiImpl.isUseRealList = res;
        return res;
      }
      return false;
    } catch (ex) {
      return false;
    }
  }

  private getUseRealListStoreConfig(): StoreConfig | undefined {
    return process.env.BUILD_ISLINGXI && process.env.BUILD_ISWEB && config('profile') && (config('profile') as string).startsWith('webmail')
      ? globalStoreConfig
      : undefined;
  }

  async setIsUseRealList(val: boolean) {
    try {
      this.putLocalSettingValue(val, MailSettingKeys.nIsUseReaList, undefined, this.getUseRealListStoreConfig());
      MailConfApiImpl.isUseRealList = val;
      this.setMailConfig();
      return true;
    } catch (ex) {
      console.error('setIsUseRealList error', ex);
      return false;
    }
  }

  private async updateShouldAutoReadMail() {
    try {
      const currentUser = this.systemApi.getCurrentUser();
      if (!currentUser) return;
      const serverVals = await this.systemApi.getUserConfig([SHOULD_AUTO_READMAILSERVERKEY]);
      if (!serverVals || !serverVals.length) {
        return;
      }
      const shouldAutoReadMailItem = serverVals.filter(item => item.field === SHOULD_AUTO_READMAILSERVERKEY);
      if (shouldAutoReadMailItem && shouldAutoReadMailItem[0]) {
        const shouldAutoReadMail = shouldAutoReadMailItem[0].value !== 'false';
        await this.storeApi.put(SHOULD_AUTO_READMAILKEY, shouldAutoReadMail ? 'true' : 'false');
        this.action.shouldAutoReadMail = shouldAutoReadMail;
      }
    } catch (ex) {
      console.error('getShouldAutoReadMail-catch', ex);
    }
  }

  getShouldAutoReadMailSync() {
    try {
      return this.action.shouldAutoReadMail;
    } catch (ex) {
      return true;
    }
  }

  async setShouldAutoReadMail(val: boolean) {
    try {
      try {
        await this.storeApi.put(SHOULD_AUTO_READMAILKEY, val.toString());
      } catch (ex) {
        console.error('put-catch', ex);
      }
      this.action.shouldAutoReadMail = val;
      const res = await this.systemApi.setUserConfig([
        {
          field: SHOULD_AUTO_READMAILSERVERKEY,
          value: val.toString(),
        },
      ]);
      return res;
    } catch (ex) {
      console.error('setShouldAutoReadMail-catch', ex);
      return false;
    }
  }

  getTokenBySubAccount(subAccount: string): string {
    if (!subAccount || !subAccount.length) return '';
    if (!this.accountTokens || !this.accountTokens.length) return '';
    const subAccountId = this.accountApi.getEmailIdByEmail(subAccount);
    if (!subAccountId) return '';
    const accountTokenInfo = this.accountTokens.filter(item => item.account === subAccountId);
    if (accountTokenInfo && accountTokenInfo.length) {
      return accountTokenInfo[0].token;
    }
    return '';
  }

  // 获取一次发信邮件的阅读状态/打开记录过期时间配置
  private getMailLimitFromServer() {
    const url = this.systemApi.getUrl('getMailLimit');
    return this.httpApi
      .post(url, {})
      .then(res => {
        const { success, data } = res.data as any;
        if (success) {
          const key1 = MailSettingKeys.nNormalDayLimit;
          const key2 = MailSettingKeys.nThirdDayLimit;
          const normalDayLimit = data?.normalDayLimit?.dayLimit || 60;
          const thirdDayLimit = data?.thirdDayLimit?.dayLimit || 60;
          this.putLocalSettingValue(normalDayLimit, key1);
          this.putLocalSettingValue(thirdDayLimit, key2);
        }
      })
      .catch(e => {
        console.log('getMailLimitFromServer error:', e);
      });
  }
  // 获取发信，阅读状态/打开记录配置，过期时间配置
  getMailDayLimit() {
    const key1 = MailSettingKeys.nNormalDayLimit;
    const key2 = MailSettingKeys.nThirdDayLimit;
    const normalDayLimit = +this.getLocalSettingValue(key1, '60');
    const thirdDayLimit = +this.getLocalSettingValue(key2, '60');
    return { normalDayLimit, thirdDayLimit };
  }
  // 设置是否展示智能收件箱
  // setShowAIMailBox(enable: boolean): Promise<boolean> {
  //   const ev = {
  //     eventName: 'mailChanged',
  //     eventData: enable,
  //     eventStrData: 'intBoxChanged',
  //   } as SystemEvent;
  //   const key = MailSettingKeys.nIntelligentInbox;
  //   // const res = { [key]: enable ? '1' : '0' };
  //   // this.action.mailConf = Object.assign(this.action.mailConf, res);
  //   this.putLocalSettingValue(enable, key, ev);
  //   // 原接口
  //   this.doSetUserAttr({
  //     [key]: enable ? '1' : '0',
  //   });
  //   // 调用新接口同步
  //   return this.setMailConfig();
  // }

  // async getIntBoxDefaultDisplayList(): Promise<boolean> {
  //   const key = MailSettingKeys.nIntBoxDisplayList;
  //   const temp = this.action.mailConf[key];
  //   if (temp === undefined) {
  //     const cached = await this.storeApi.get(key);
  //     if (!cached.suc) {
  //       let result;
  //       // webmail环境默认展示全部tab，不再请求服务端
  //       const isWebmail = config('profile') && config('profile').toString().startsWith('webmail');
  //       if (isWebmail) {
  //         result = false;
  //       } else {
  //         const configInfoRes = await this.httpApi.get(
  //           this.systemApi.getUrl('clientInfo')
  //         );
  //         result = Boolean(
  //           configInfoRes?.data?.data?.configCollection?.smartMailPriorityFlag
  //         );
  //       }
  //       this.putLocalSettingValue(result, key);
  //     }
  //   }
  //   return this.getLocalSettingValue(key) === 'true';
  // }

  // async setIntBoxDefaultDisplayList(value: boolean): Promise<void> {
  //   const ev = {
  //     eventName: 'mailChanged',
  //     eventData: value,
  //     eventStrData: 'intBoxDisplayChanged',
  //   } as SystemEvent;
  //   const key = MailSettingKeys.nIntBoxDisplayList;
  //   // this.action.mailConf[key] = String(value);
  //   this.putLocalSettingValue(value, key, ev);
  //   // 调用新接口同步
  //   this.setMailConfig();
  // }
}

const mailConfApi: Api = new MailConfApiImpl();
api.registerLogicalApi(mailConfApi);
export default mailConfApi;
