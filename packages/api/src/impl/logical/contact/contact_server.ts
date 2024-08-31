import lodashGet from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import { AxiosError } from 'axios';
import { api } from '@/api/api';
import {
  ContactCommonRes,
  contactDeleteParams,
  contactInsertParams,
  ContactServerSyncType,
  ContactServerUrlMap,
  contactUpdateParams,
  DeletePersonalOrgParams,
  syncRes,
  SyncResponseModal,
  timeKeyMap,
  uploadIconParams,
  uploadIconRes,
  RequestContactOrgParams,
  ContactSearch,
  MemorySearchCondition,
  SearchCondition,
  maillistMemberRes,
  DelMailListParams,
  MailListMember,
  GetMailListParams,
  UserMailListResultData,
  OperateMailListParams,
  PersonalImportParams,
  PersonalExportParams,
  EntityOrgPathList,
  CoreContactServerResponse,
  CoreOrgServerResponse,
  CoreSyncResponseModal,
  ContactAccountInfo,
  CoreContactServerRawData,
  CustomerLstFromManagerIdRes,
  ContactMultileAccountOption,
  recentContactListParams,
  recentContactListRes,
} from '@/api/logical/contactAndOrg';
import { ContactModel, resultObject } from '@/api/_base/api';
import { util, wait } from '@/api/util';
import { ContactDB, ContactDBInstance } from './contact_dbl';
import { ResponseData, ApiResponse } from '@/api/data/http';
import ContactUtilInterface, { ContactConst, ContactSyncStorePageInfo } from './contact_util';
import { CustomerListCommonRes, CustomerListParams, CustomerResFromServer } from '@/api/logical/contact_edm';
import db_tables from '@/api/data/db_tables';
import { ContactTransform, ContactTransformInstance } from './contact_transform';
import { apis, inWindow } from '@/config';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { SystemEvent } from '@/api/data/event';
import { ProductAuthApi } from '@/api/logical/productAuth';
// import mockCoreContactList from './coreContactMock.json';
// import mockCoreOrgList from './coreOrgMock.json';
// console.log('[contact_server]contact.core.mock', mockCoreContactList, mockCoreOrgList);

interface insertPersonalOrgRes {
  personContactGroup: {
    groupId: string;
    groupName: string;
  };
  accountIdList: string[];
}

export class ContactServer {
  systemApi = api.getSystemApi();

  store = api.getDataStoreApi();

  http = api.getDataTransApi();

  contactDB: ContactDB = ContactDBInstance;

  contactUtil: ContactConst = ContactUtilInterface;

  contactTrans: ContactTransform = ContactTransformInstance;

  private syncSource = 'server_sync_source';

  dataTrackerApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

  loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;

  eventApi = api.getEventApi();

  productApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

  private lastSyncTimeKeyMap: timeKeyMap = {
    enterprise: 'server_sync_enterprise_last_time_',
    client: 'client_sync_last_time_',
    personal: 'server_sync_personal_last_time_',
    org: 'server_sync_org_last_time_',
    personalOrg: 'server_sync_personal_org_last_time_',
  };

  selfCustomerSyncLastTime = 'server_sync_self_customer_last_time_';

  selfCustomerSyncLastId = 'server_sync_self_customer_last_id_';

  customerSyncLastTime = 'server_sync_customer_last_time_';

  customerSyncLastId = 'server_sync_customer_last_id_';

  clueSyncLastTime = 'server_sync_clue_last_time_';

  clueSyncLastId = 'server_sync_clue_last_id_';

  contactGlobalDB = 'contact_global_db_upgrade_version';

  syncPullVersionCustomer = 'sync_pull_version_customer';

  syncPullVersionClue = 'sync_pull_version_clue';

  contactServerUrlMap: ContactServerUrlMap & Record<'enterpriseNew', 'getFullEnterpriseContactList'> = {
    enterpriseNew: 'getFullEnterpriseContactList',
    enterprise: 'getEnterpriseContactList',
    personal: 'getPersonContactList',
    org: 'getOrgList',
    personalOrg: 'getPersonalOrgList',
  };

  /**
   * 获取当前用户的Domain
   * */
  getDomain(email?: string) {
    const user = this.systemApi.getCurrentUser(email);
    return user?.domain;
  }

  /**
   * 获取当前用户的email
   * */
  getEmail(email?: string) {
    const user = this.systemApi.getCurrentUser(email);
    return user?.id;
  }

  getStoreData(key: string) {
    const { data, suc } = this.store.getSync(key);
    if (suc && data) {
      return data;
    }
    return '';
  }

  async getStoreSource(): Promise<string> {
    const { suc, data } = await this.store.get(this.syncSource);
    const res = suc && data;
    return res || 'unknown';
  }

  // 获取上次更新时间
  private async getStoredLastTime(storeInfoInDB: ContactSyncStorePageInfo | undefined, from: ContactServerSyncType) {
    let lastUpdateTime = 0;
    if (lodashGet(storeInfoInDB, 'lastUpdateTime', 0) !== 0) {
      // 企业通讯录获取lastUpdateTime的时候利用lastupdateTime(全量更新接口)和fullLastupdateTime作比较(增量更新接口)
      // 这个需要给一个lastUpdateTime比较大的值给增量更新使用
      // lastUpdateTime = Math.max(storeInfoInDB!.lastUpdateTime!, storeInfoInDB?.fullLastUpdateTime || 0);
      lastUpdateTime = storeInfoInDB!.lastUpdateTime!;
    } else {
      const oldUpdateTime = await this.contactUtil.getStoreLastTime(from);
      lastUpdateTime = typeof oldUpdateTime === 'number' && oldUpdateTime > 0 ? oldUpdateTime : 0;
    }

    return lastUpdateTime;
  }

  async getSyncServerParams(
    options: ContactMultileAccountOption<{
      from: ContactServerSyncType;
      force?: boolean;
      subDomain?: string;
    }>
  ): Promise<resultObject> {
    const { force = false, subDomain, from, isMainAccount, _account } = options;
    const source = force ? 'unknown' : await this.getStoreSource();
    const email = this.getEmail(_account);
    const domain = typeof subDomain === 'string' && subDomain.length > 0 ? subDomain : this.getDomain(_account);

    switch (from) {
      case 'enterprise': {
        // 如果force=true 表示用户强制更新OR本地没有数据
        if (force) {
          return {
            domain,
            source: 'unknown',
            last_update_time: 0,
            page_index: 1,
            pageIndex: 1,
            fetch_mode: 'increment',
          };
        }

        const lastSyncRecord = await this.contactUtil.getStoreContactSyncPageInfo({
          from,
          domain: domain!,
          isMainAccount,
          _account,
        });

        const lastUpdateTime = await this.getStoredLastTime(lastSyncRecord, from);

        if (lastSyncRecord?.source === 'lingxi') {
          const { lastMaxId } = lastSyncRecord!;
          return {
            domain,
            last_update_time: lastUpdateTime || 0,
            fetch_mode: 'increment', // 没啥用
            source: 'lingxi',
            lastMaxId,
            page_index: 1,
            pageIndex: 1,
          };
        }

        if ((lastSyncRecord?.source || 'unknown') === 'qiye') {
          const { pageIndex = 0 } = lastSyncRecord!;
          const page_index = typeof pageIndex === 'number' && Number.isSafeInteger(pageIndex) ? pageIndex + 1 : 1;
          return {
            domain,
            last_update_time: lastUpdateTime || 0,
            fetch_mode: 'increment', // 没啥用
            source: 'qiye',
            // 两种页码数据都传(等增量和全量接口字段统一之后改成一致)
            page_index,
            pageIndex: page_index,
            isAll: 1, // 是否返回全量数据（包括禁用，删除，离职，或者规则不可见的账号等）——没啥用
          };
        }
        // zuo
        return {
          domain,
          source: 'unknown',
          fetch_mode: 'increment',
          last_update_time: lastUpdateTime,
          pageIndex: 1,
          page_index: 1,
          isAll: 1,
        };
      }

      case 'org': {
        const lastSyncRecord = await this.contactUtil.getStoreContactSyncPageInfo({
          from,
          domain: domain!,
          isMainAccount,
          _account,
        });
        const { pageIndex } = lastSyncRecord!;
        let lastUpdateTime = 0;
        if (!force) {
          lastUpdateTime = await this.getStoredLastTime(lastSyncRecord, from);
        }
        const page_index = typeof pageIndex === 'number' && Number.isSafeInteger(pageIndex) ? pageIndex + 1 : 1;
        return {
          domain,
          lastUpdateTime, // this.getLastUpdateTime(lastUpdateTime, 'enterprise'),
          fetch_mode: 'increment',
          source,
          page_index,
          // 老接口字段 新街口无效
          // isAll: 1, // 是否返回全量数据（包括禁用，删除，离职，或者规则不可见的账号等）
        };
      }

      default: {
        const lastSyncRecord = await this.contactUtil.getStoreContactSyncPageInfo({
          from,
          domain: domain!,
          isMainAccount,
          _account,
        });
        let lastUpdateTime = 0;
        if (!force) {
          lastUpdateTime = await this.getStoredLastTime(lastSyncRecord, from);
        }
        const data: Record<Exclude<ContactServerSyncType, 'org' | 'enterprise'>, resultObject> = {
          personal: {
            email,
            lastUpdateTime, // this.getLastUpdateTime(lastUpdateTime, 'personal'),
          },
          personalOrg: {
            email,
            lastUpdateTime,
          },
        };

        return data[from as Exclude<ContactServerSyncType, 'org' | 'enterprise'>];
      }
    }
  }

  private async excuteContactServerWithRetry<T>(
    options: ContactMultileAccountOption<{
      url: string;
      params: Record<string, unknown>;
    }>,
    config?: {
      retryDuration?: number;
      maxRetryTimes?: number;
      requestTimeoutDuration?: number;
      correctCodes?: number[];
      validateRes?: (res: T) => boolean;
    }
  ) {
    const { url, params } = options;
    const maxRetryTimes = lodashGet(config, 'maxRetryTimes', 3) as number;
    const requestTimeoutDuration = lodashGet(config, 'requestTimeoutDuration', 2 * 60 * 1000) as number;
    const retryDuration = lodashGet(config, 'retryDuration', 1000);
    const correctCodes = lodashGet(config, 'correctCodes', [0, 107000]);

    // 如果前台核心数据正在同步 阻塞请求
    if (inWindow() && window.isBridgeWorker && !this.contactDB.getContactWritePriority()) {
      throw new Error('coreContactRequesting');
    }

    const retryFunc = async () => {
      let res: ApiResponse<T>;
      try {
        res = (await this.http.get(url, params, {
          timeout: requestTimeoutDuration,
          _account: options._account,
        })) as ApiResponse<T>;
      } catch (ex) {
        this.dataTrackerApi.track('pc_contact_sync_server_error', {
          _account: options._account,
          from: url,
          code: lodashGet(ex as AxiosError, 'code', 'networkError'),
          msg: lodashGet(ex as AxiosError, 'message', 'networkError'),
          domain: this.getDomain(options._account),
          enableTrackInBg: true,
        });
        throw ex instanceof Error ? ex : new Error(`${ex}`);
      }

      const serverCode = lodashGet(res, 'data.data.statusCode', -1);

      // 只有0 107000(仅搜索可见)两种状态码是suc
      if (correctCodes.includes(serverCode) && res.data?.data && (typeof config?.validateRes !== 'function' || config.validateRes(res.data.data))) {
        return res.data!.data;
      }
      this.dataTrackerApi.track('pc_contact_sync_server_error', {
        _account: options._account,
        from: url,
        code: serverCode,
        enableTrackInBg: true,
        domain: this.getDomain(options._account),
      });

      throw new Error(lodashGet(res, 'data.data.message', '') + '(' + serverCode + ')');
    };

    let request = retryFunc();

    let retryTimes = 1;

    while (retryTimes < maxRetryTimes) {
      retryTimes += 1;
      request = request.catch(async (err: Error) => {
        if ((lodashGet(err, 'message', '') as string).indexOf('106000') !== -1) {
          throw err;
        }
        await wait(retryDuration);
        return retryFunc();
      });
    }

    return request;
  }

  // 获取当前用户信息
  private async fetchSelfInfo(_account?: string): Promise<CoreContactServerRawData[]> {
    // 如果返回的列表为空 返回当前用户的信息
    const url = this.systemApi.getUrl('getAccountInfo');
    const sid = this.systemApi.getCurrentUser(_account)?.sessionId || '';

    // v1.20版本不返回部门路径
    const accountRes: ApiResponse<ContactAccountInfo> = await this.http.get(
      url,
      { sid, needUnitNamePath: true },
      {
        _account,
      }
    );

    if (!lodashGet(accountRes, 'data.data.email.length', 0)) {
      return [];
    }

    const accountInfoData = accountRes.data!.data!;

    return [
      {
        domain: '',
        accountId: accountInfoData.qiyeAccountId,
        accountName: accountInfoData.email,
        nickName: accountInfoData.nickName,
        type: 2,
        mediumIconUrl: lodashGet(accountInfoData, 'iconVO.mediumUrl', '') as string,
        smallIconUrl: lodashGet(accountInfoData, 'iconVO.mediumUrl', '') as string,
        email: accountInfoData.email,
        orgId: Number(accountInfoData.qiyeAccountId),
        rankList: [],
      },
    ];
  }

  // 同步精简通讯录信息
  async doSyncCoreContactData(options: ContactMultileAccountOption<{ subDomain?: string; enableFastCleanInvalidContact?: boolean }>): Promise<CoreSyncResponseModal> {
    const { subDomain, enableFastCleanInvalidContact, ...restOptions } = options;

    const url = this.systemApi.getUrl('coreEnterpriseContactList');
    const domain = typeof subDomain === 'string' && subDomain.length > 0 ? subDomain : this.getDomain(options._account);

    // 执行请求
    try {
      const res = await this.excuteContactServerWithRetry<CoreContactServerResponse>({
        url,
        params: { domain },
        ...restOptions,
      });

      const { contactVOList, orgId: enterpriseId, lastUpdateTime = Date.now() - 1000 * 5, incTimeInternal } = res;

      let { iconPrefix = '' } = res;

      const orgpathlist = await this.subscribleOrgPathlistRawdata({
        enterpriseId,
        ...restOptions,
      });

      this.contactUtil.setContactSyncIntervalSeq(incTimeInternal);

      let realContactList = contactVOList;

      // 如果核心接口返回空 从accountInfo里面补充当前用户自己的信息(只有主企业有这个逻辑)
      // 1.27版本修改:只有主账号才可以塞入默认数据(子账号可以不用考虑 因为之前主要的考虑愿意是因为设置不可见之后 全量接口的同步压力大。但是子账号不执行全量同步先不考虑这个case)
      if (lodashGet(contactVOList, 'length', 0) === 0 && !subDomain && this.systemApi.getIsMainAccount(options._account)) {
        realContactList = await this.fetchSelfInfo(options._account);
        // 1.29版本补充:如果通讯录不可见，调用了accountInfo之后不能在使用iconPrefix字段进行头像拼接了，因为accountInfo返回的是一个完整的邮箱URL
        iconPrefix = '';
      }

      await this.contactDB.coreContactAllInto(
        {
          list: realContactList,
          orgpathlist,
          ...restOptions,
        },
        {
          enterpriseId,
          iconPrefix,
          enableFastCleanInvalidContact,
        }
      );
      await this.contactUtil.setStoreContactSyncPageInfo({
        from: 'enterprise',
        domain: domain!,
        step: 'core',
        done: true,
        source: 'unknown',
        lastUpdateTime,
        coreCount: contactVOList.length,
        ...restOptions,
      });
      return {
        from: 'enterprise',
        success: true,
        count: lodashGet(contactVOList, 'length', 0) as number,
      };
    } catch (ex) {
      return {
        from: 'enterprise',
        success: false,
        message: lodashGet(ex, 'message', `${ex}`),
        count: 0,
      };
    }
  }

  // 订阅通讯录组织完整路径同步状态
  private async subscribleOrgPathlistRawdata(options: ContactMultileAccountOption<{ enterpriseId: number }>): Promise<EntityOrgPathList[]> {
    const { enterpriseId, ...restOptions } = options;
    // 检查当前pathlist数据同步完成.如果没有同步完成 等待数据同步完成
    // 当前这次操作不执行代理
    inWindow() && window.bridgeApi.master.forbiddenBridgeOnce();
    const count = await this.contactDB.getTableCount({
      tableName: this.contactUtil.orgpathlistTable,
      dbName: this.contactUtil.contactSearchDbName,
      enterpriseId,
      _account: options._account,
    });
    // 如果数据没有灌入 等待数据灌入完成
    if (!count) {
      await new Promise(resolve => {
        const eid = this.eventApi.registerSysEventObserver('coreOrgPathlistReady', {
          name: 'coreOrgPathlistReady' + options._account,
          func: (e: SystemEvent<{ enterpriseId: number; _account: string }>) => {
            const currentEnterpriseId = lodashGet(e, 'eventData.enterpriseId', 0);
            console.log('[contact_server]subscribleOrgPathlistRawdata', e.eventData);
            if (enterpriseId !== currentEnterpriseId) {
              return;
            }
            resolve(true);
            this.eventApi.unregisterSysEventObserver('coreOrgPathlistReady', eid);
          },
          _account: options._account,
        });
      });
    }
    return this.contactDB.getTotalLokiData<EntityOrgPathList>({
      tableName: this.contactUtil.orgpathlistTable,
      enableProxy: false,
      ...restOptions,
    });
  }

  // 同步精简组织信息
  async doSyncCoreOrgData(options: ContactMultileAccountOption<{ subDomain?: string; enableFastCleanInvalidContact?: boolean }>): Promise<CoreSyncResponseModal> {
    const url = this.systemApi.getUrl('coreEnterpriseOrgList');
    const { subDomain, enableFastCleanInvalidContact, ...restOptions } = options;
    const domain = typeof subDomain === 'string' && subDomain.length > 0 ? subDomain : this.getDomain(options._account);

    try {
      const res = await this.excuteContactServerWithRetry<CoreOrgServerResponse>({
        url,
        params: { domain },
        ...restOptions,
      });

      const { unitVOList, orgId: enterpriseId, lastUpdateTime, incTimeInternal } = res;
      this.contactUtil.setContactSyncIntervalSeq(incTimeInternal);

      let realUnitList = unitVOList;

      // 如果服务端没有返回部门信息(主企业) 默认塞入一个
      if (lodashGet(unitVOList, 'length', 0) === 0 && !subDomain) {
        const mainCompanyId = this.systemApi.getCurrentCompanyId(options._account);
        realUnitList = [
          {
            oriUnitId: `org_${mainCompanyId}`,
            parentUnitId: '',
            rank: 0,
            type: 99,
            unitId: `org_${mainCompanyId}`,
            unitName: lodashGet(this.systemApi.getCurrentUser(options._account), 'company', ''),
            unitRank: 0,
          },
        ];
      }

      // 插入到DB中
      await this.contactDB.coreOrgAllInto(
        {
          list: realUnitList,
          ...restOptions,
        },
        {
          visibleCode: res.statusCode,
          enterpriseId,
          enableFastCleanInvalidContact,
        }
      );
      await this.contactUtil.setStoreContactSyncPageInfo({
        from: 'org',
        domain: domain!,
        step: 'core',
        done: true,
        lastUpdateTime,
        source: 'unknown',
        ...restOptions,
      });
      return {
        success: false,
        from: 'org',
        count: lodashGet(unitVOList, 'length', 0) as number,
      };
    } catch (ex) {
      return {
        success: false,
        from: 'org',
        count: 0,
      };
    }
  }

  syncListAliasName(from: ContactServerSyncType) {
    const data: Record<ContactServerSyncType, string> = {
      personal: 'personContactVOList',
      enterprise: 'contactVOList',
      org: 'unitVOList',
      personalOrg: 'personContactGroupList',
    };
    return data[from];
  }

  // 根据关键字从服务端搜索企业通讯录
  async searchContactByServer(query: { keyword: string; limit?: string; domain?: string }): Promise<resultObject[]> {
    const $url = this.systemApi.getUrl('searchContact');
    const defaultDomain = this.systemApi.getCurrentUser()?.domain || '';
    try {
      const { data } = await this.http.get($url, {
        limit: 200,
        domain: defaultDomain,
        ...query,
      });
      return data?.data?.contactVOList || ([] as resultObject[]);
    } catch (e) {
      console.warn('[contact_server] get server contact', e);
      return Promise.resolve([] as resultObject[]);
    }
  }

  // 从服务端查询部门下的通讯录
  async getContactsByUnitId(query: { unitId: string; domain?: string; pageSize?: number; lastQiyeAccountId?: string; _account?: string }) {
    const $url = this.systemApi.getUrl('getContactByUnitId');
    const defaultDomain = this.systemApi.getCurrentUser()?.domain || '';
    const params = {
      domain: defaultDomain,
      pageSize: 100,
      ...query,
    };
    try {
      const { data } = await this.http.get($url, params, { _account: query._account });
      return data?.data?.contactVOList || ([] as resultObject[]);
    } catch (e) {
      console.warn('[contact_server] get server contact', e);
      return Promise.resolve([] as resultObject[]);
    }
  }

  // 根据ID查询用户详情
  async getContactByQiyeAccountId(query: { idList: string[]; domain?: string; _account?: string }): Promise<ContactModel[]> {
    const idList = query?.idList || [];
    if (!idList.length) {
      return [];
    }
    const $url = this.systemApi.getUrl('getContactByQiyeAccountId');
    const defaultDomain = this.systemApi.getCurrentUser()?.domain || '';
    const params = {
      domain: defaultDomain,
      qiyeAccountIdList: idList,
    };
    try {
      const { data } = await this.http.post($url, params, {
        _account: query._account,
        contentType: 'json',
      });
      const itemList = data?.data?.contactVOList || ([] as resultObject[]);
      return this.transServer2ContactModel({
        list: itemList,
        _account: query._account,
      });
    } catch (e) {
      console.warn('[contact_server] get server contact', e);
      return [];
    }
  }

  async doSearch(condition: MemorySearchCondition): Promise<ContactSearch[]> {
    const { query, showDisable, contactType, isIM, showNotDisplayEmail } = condition;
    const list = await this.searchContactByServer({ keyword: query });
    const modelList = this.contactTrans.transServerSearch(list);
    const filterContactModelList: ContactSearch[] = [];
    modelList.forEach(item => {
      const imFlag = !isIM || (isIM && item.enableIM);
      const visibleFlag = !showDisable || (showDisable && item.visibleCode === 0);
      const typeFlag = !contactType || (contactType && item.type === contactType);
      const diplayEmailFlag = !showNotDisplayEmail || (showNotDisplayEmail && (item.visibleCode === 7 || item.visibleCode === 0));
      if (imFlag && visibleFlag && typeFlag && diplayEmailFlag) {
        filterContactModelList.push(item);
      }
    });
    return filterContactModelList;
  }

  async doSearchAllContact(condition: SearchCondition): Promise<ContactModel[]> {
    const { query, showDisable, isIM } = condition;
    const list = await this.searchContactByServer({ keyword: query });
    const modelList = this.transServer2ContactModel({
      list,
      _account: condition._account,
    });
    const filterContactModelList: ContactModel[] = [];
    modelList.forEach(item => {
      const imFlag = !isIM || (isIM && item.contact.enableIM);
      const visibleFlag = !showDisable || (showDisable && item.contact.visibleCode === 0);
      if (imFlag && visibleFlag) {
        filterContactModelList.push(item);
      }
    });
    return filterContactModelList;
  }

  async getContactByYunxin(accounts: string[], _account?: string): Promise<resultObject[]> {
    if (!accounts || !accounts.length) {
      return [];
    }
    try {
      const yunxinAccIdList = accounts.filter(item => !!item).join(',');
      const { data } = await this.http.post(this.systemApi.getUrl('getContactByYunxin'), { yunxinAccIdList });
      return data?.data?.itemList;
    } catch (e) {
      console.error('[contact_server] getContactByYunxin error', e, _account);
      return [];
    }
  }

  async doGetContactByYunxin(accounts: string[], _account?: string): Promise<ContactModel[]> {
    const itemList = await this.getContactByYunxin(accounts, _account);
    if (itemList?.length) {
      return this.transServer2ContactModel({ list: itemList });
    }
    return [];
  }

  transServer2ContactModel(params: { list: resultObject[]; _account?: string }): ContactModel[] {
    const { list: itemList, _account } = params;
    if (!itemList?.length) {
      return [];
    }
    const contactList = this.contactTrans.transEnterpriseListToContact(itemList, Date.now(), {
      _account,
    });
    const contactInfoList = this.contactTrans.transEnterpriseListToContactItem(itemList);
    return this.contactTrans.transformContactModel({
      contactList,
      contactInfoList,
    });
  }

  async doGetContactByEmails(emails: string[], _account?: string): Promise<ContactModel[]> {
    try {
      const emailSet = new Set();
      emails.forEach(item => {
        if (item) {
          emailSet.add(item);
        }
      });
      const emailList = [...emailSet].join(',');
      const domain = this.getDomain();
      const { data } = await this.http.get(this.systemApi.getUrl('getYunxinInfoByEmail'), { emailList, domain }, { _account });
      const itemList = data?.data?.itemList;
      if (itemList?.length) {
        return this.transServer2ContactModel({
          list: itemList,
          _account,
        });
      }
    } catch (e) {
      console.error('[contact_server] doGetContactByEmails error', e);
    }
    console.log(emails, _account);
    return [];
  }

  async doGetContactByOrgId(params: RequestContactOrgParams): Promise<{
    orgMap: Record<string, ContactModel[]>;
    uniqueList: ContactModel[];
  }> {
    const { orgId, showDisable, _account } = params;
    const orgIds = util.singleToList(orgId as string | string[]);
    const emailMap: Record<string, ContactModel> = {};
    const orgMap: Record<string, ContactModel[]> = {};
    const promiseList = orgIds.map(id =>
      this.getContactsByUnitId({ unitId: id, _account }).then(itemList => {
        const modelList = this.transServer2ContactModel({
          list: itemList,
          _account: params._account,
        });
        const orgEmailList = orgMap[id] || [];
        modelList.forEach(item => {
          const email = item.contact.displayEmail || item.contact.accountName;
          if (showDisable || (!showDisable && item.contact.visibleCode === 0)) {
            emailMap[email] = item;
            orgEmailList.push(item);
          }
        });
        orgMap[id] = orgEmailList;
      })
    );
    await Promise.all(promiseList);
    return {
      orgMap,
      uniqueList: Object.values(emailMap),
    };
  }

  // 获取企业通讯录增量OR全量接口
  private getServerUrl(from: ContactServerSyncType, params: resultObject) {
    const needNewEnterpriseUrl = from === 'enterprise' && lodashGet(params, 'force', false) === true;
    return needNewEnterpriseUrl ? this.contactServerUrlMap.enterpriseNew : this.contactServerUrlMap[from];
  }

  // 判断分页数据是否同步完成
  private isDone4Enterprise(
    list: resultObject[],
    options: {
      isAll?: boolean;
      source?: 'unknown' | 'qiye' | 'lingxi';
      pageIndex?: number;
      totalPage?: number;
      pageSize?: number;
    }
  ) {
    const { isAll: isSyncAll, source = 'unknown' } = options;
    if (source === 'lingxi' && isSyncAll) {
      const { pageSize = 5000 } = options;
      return list.length === 0 || (typeof pageSize === 'number' && list.length < pageSize);
    }
    const { pageIndex = 0, totalPage = 0 } = options;
    return pageIndex && totalPage && pageIndex === totalPage;
  }

  async syncSelfYunxin(params: ContactMultileAccountOption<{ platform?: 'web' | 'electron' }>) {
    const { _account } = params;
    const isMainAccount = !_account || this.systemApi.getCurrentUser()?.id === _account;
    const hasYunxin = !!this.systemApi.getCurrentUser()?.contact?.contactInfo.find(item => item.contactItemType === 'yunxin');
    if (!isMainAccount || hasYunxin) {
      return;
    }

    // 如果返回的列表为空 返回当前用户的信息
    const url = this.systemApi.getUrl('getAccountInfo');
    const sid = this.systemApi.getCurrentUser(_account)?.sessionId || '';

    // v1.20版本不返回部门路径
    const accountRes: ApiResponse<ContactAccountInfo> = await this.http.get(
      url,
      { sid, needUnitNamePath: false },
      {
        _account,
      }
    );
    if (lodashGet(accountRes, 'data.data.yunxinAccountId.length', 0) === 0) {
      return;
    }

    const { yunxinAccountId, qiyeAccountId, orgId } = accountRes.data!.data!;

    await this.contactDB.intoTable({
      tableName: this.contactUtil.contactItemTable,
      list: [
        {
          id: util.getUnique(qiyeAccountId, 'yunxin', yunxinAccountId),
          contactId: qiyeAccountId,
          contactItemRefer: '',
          contactItemType: 'yunxin',
          contactItemVal: yunxinAccountId,
          enterpriseId: orgId,
          isDefault: 0,
          type: 'enterprise',
          _lastUpdateTime: Date.now(),
        },
      ],
      _account,
    });
  }

  /**
   * 同步企业通讯录列表
   */
  private enterpriseFullCount = 0;

  async syncEnterpriseContactList(options: ContactMultileAccountOption<{ force?: boolean; subDomain?: string; params?: resultObject }>): Promise<SyncResponseModal> {
    const from = 'enterprise';

    const { force = false, params: _params, subDomain, isMainAccount, _account } = options;

    let params: undefined | resultObject;

    // 如果是分页的第一页请求需要获取参数
    // 第一页之后的参数引用入参就OK
    if (_params) {
      params = _params;
    } else {
      params = await this.getSyncServerParams({
        from,
        force,
        subDomain,
        isMainAccount,
        _account,
      });
    }

    const url = this.systemApi.getUrl(
      this.getServerUrl(from, {
        ...params,
        force,
        needUnitNamePath: true,
      })
    );

    try {
      const { contactVOList, source, pageIndex, pageSize, totalPage, lastUpdateTime, incTimeInternal, addressRuleLastUpdateTime, addressRuleUpdateFlag } =
        await this.excuteContactServerWithRetry<{
          contactVOList: resultObject[];
          source: 'qiye' | 'lingxi' | 'unknown';
          totalPage?: number;
          pageIndex?: number;
          pageSize?: number;
          lastMaxId?: string;
          lastUpdateTime: number;
          incTimeInternal: number;
          addressRuleLastUpdateTime: number;
          addressRuleUpdateFlag: boolean;
        }>(
          {
            url,
            params,
            isMainAccount,
            _account,
          },
          force
            ? {}
            : {
                correctCodes: [0, 106000, 107000],
                validateRes(res) {
                  return res.addressRuleLastUpdateTime >= 0;
                },
              }
        );

      // const addressRuleLastUpdateTime = _addressRuleLastUpdateTime || 1700703730000;
      // v1.32 新增需求 检查通讯录规则变更
      if (!force && addressRuleLastUpdateTime && addressRuleUpdateFlag) {
        try {
          const hasChanged = await this.detectAddressRuleChanged(addressRuleLastUpdateTime);
          if (hasChanged) {
            return {
              count: 0,
              success: false,
              from: 'enterprise',
            };
          }
        } catch (ex) {}
      }

      // 在本地打一个增量更新打点
      if (lodashGet(params, 'last_update_time', 0) > 0 && Array.isArray(contactVOList) && contactVOList.length) {
        this.dataTrackerApi.track('pc_contact_enterpriseserver_response', {
          _account: options._account,
          from,
          count: contactVOList.length,
          lastUpdateTime: lodashGet(params, 'last_update_time', 0),
          enableTrackInBg: true,
        });
      }

      if (force) {
        this.enterpriseFullCount += contactVOList.length || 0;
      }

      // 设置轮询时长
      this.contactUtil.setContactSyncIntervalSeq(incTimeInternal);

      let isDone = false;
      let enableUseNewtest = true;
      let updateContactIds: string[] = [];
      // 执行数据插入
      if (!Array.isArray(contactVOList) || !contactVOList.length) {
        isDone = true;
      } else {
        const insertResult = await this.contactDB.enterpriseAllInto({
          list: contactVOList,
          force,
          isMainAccount,
          _account,
        });
        updateContactIds = lodashGet(insertResult, '[0].contact_enterprise.updateDiff', []);
        enableUseNewtest = !Object.keys(lodashGet(insertResult, '[0].insertCountMap', {})).length;
      }

      // 检查是否做完所有的分页
      if (!isDone) {
        isDone = !!this.isDone4Enterprise(contactVOList, {
          isAll: force,
          source,
          pageIndex,
          totalPage,
          pageSize,
        });
      }

      // 如果同步完了 存储同步状态信息
      if (isDone) {
        this.contactUtil.setStoreContactSyncPageInfo(
          {
            from,
            domain: params.domain || this.getDomain(options._account),
            lastUpdateTime,
            step: force ? 'all' : 'increase',
            source: 'unknown',
            pageIndex: pageSize,
            done: true,
            totalPage,
            isMainAccount,
            _account,
          },
          enableUseNewtest
        );

        this.recordEnterpriseSyncCount({
          isForce: !!force,
          count: this.enterpriseFullCount,
          isMainAccount,
          _account,
        });

        const returnData = force ? [] : [{ contact_enterprise: { updateDiff: updateContactIds } }];
        return {
          count: lodashGet(contactVOList, 'length', 0),
          from: 'enterprise',
          data: returnData,
          success: true,
        };
      }

      const nextRequestParam = cloneDeep(params);
      if (source === 'lingxi' && force) {
        nextRequestParam.source = 'lingxi';
        nextRequestParam.lastMaxId = lodashGet(contactVOList, `[${contactVOList.length - 1}].qiyeAccountId`, '');

        // 存储未完成存储分页数据
        this.contactUtil.setStoreContactSyncPageInfo({
          from,
          domain: params.domain,
          source: 'lingxi',
          lastMaxId: params.lastMaxId,
          step: 'all',
          done: false,
          _account,
          isMainAccount,
        });
      } else {
        nextRequestParam.source = source;
        nextRequestParam.page_index = pageIndex! + 1; // 当前页数据获取成功

        // 存储未完成存储分页数据
        this.contactUtil.setStoreContactSyncPageInfo({
          from,
          domain: params.domain,
          source,
          pageIndex: pageSize,
          done: false,
          totalPage,
          step: force ? 'all' : 'increase',
          _account,
          isMainAccount,
        });
      }

      await wait(2000);
      return this.syncEnterpriseContactList({
        force,
        subDomain,
        params: nextRequestParam,
        isMainAccount,
        _account,
      });
    } catch (ex) {
      return {
        from: 'enterprise',
        success: false,
        data: [],
        count: 0,
        message: ex instanceof Error ? ex.message : `${ex}`,
      };
    }
  }

  private async detectAddressRuleChanged(addressRuleLastUpdateTime: number) {
    const domain = this.getDomain()!;
    const _account = this.systemApi.getCurrentUser()!.accountMd5!;
    const curStoreInfo = await this.contactUtil.getStoreContactSyncPageInfo({
      from: 'enterprise',
      domain,
      _account,
      isMainAccount: true,
    });
    const oldRuleLastUpdateTime = lodashGet(curStoreInfo, 'addressRuleLastUpdateTime', 0);
    const hasChanged = typeof oldRuleLastUpdateTime === 'number' && addressRuleLastUpdateTime > oldRuleLastUpdateTime;
    const eventName = process.env.BUILD_ISELECTRON ? 'detectContactException' : 'detectContactExceptionInWeb';
    if (hasChanged) {
      this.eventApi.sendSysEvent({
        eventName,
        eventData: {
          type: 'addressRuleChanged',
          enableSkipFullSync: false,
        },
        _account: this.systemApi.getCurrentUser()?.id,
      });
      this.contactUtil.setStoreContactSyncPageInfo({ from: 'enterprise', domain, _account, source: 'lingxi', addressRuleLastUpdateTime });
    }
    return hasChanged;
  }

  private async recordEnterpriseSyncCount(
    options: ContactMultileAccountOption<{
      isForce: boolean;
      count: number;
    }>
  ) {
    const { isForce, count, _account, isMainAccount } = options;
    if (!isForce) {
      return;
    }
    this.enterpriseFullCount = 0;
    await wait(10);
    const pageInfo = await this.contactUtil.getStoreContactSyncPageInfo({
      from: 'enterprise',
      domain: this.getDomain()!,
      _account,
      isMainAccount,
    });

    const coreCount = lodashGet(pageInfo, 'coreCount', count);
    this.dataTrackerApi.track('pc_enterprisefull_syncdone', {
      _account: options._account,
      count,
      coreCount,
      percent: Math.round((coreCount * 100) / count),
      enableTrackInBg: true,
    });
  }

  /**
   *
   * @param isAll:是否是全量更新
   * @param force:强制更新
   * @returns force
   */
  async syncPersonContactList(options: ContactMultileAccountOption<Partial<{ force: boolean }>>): Promise<SyncResponseModal> {
    const { force = false, isMainAccount, _account } = options;
    const from = 'personal';

    try {
      const params = await this.getSyncServerParams({
        from,
        force,
        isMainAccount,
        _account,
      });
      const url = this.systemApi.getUrl(this.getServerUrl(from, params));

      const { personContactVOList: list = [], lastUpdateTime } = await this.excuteContactServerWithRetry<{
        personContactVOList: resultObject[];
        lastUpdateTime: number;
      }>(
        {
          url,
          params,
          isMainAccount,
          _account,
        },
        force ? {} : { correctCodes: [0, 106000, 107000] }
      );

      // 如果强制更新情况下返回[] 表示服务端接口
      if ((Array.isArray(list) && list.length) || force) {
        await this.contactDB.personalAllInto({
          list,
          force,
          isMainAccount,
          _account,
        });
      }

      // 更新本地记录
      this.contactUtil.setStoreContactSyncPageInfo({
        from,
        domain: this.getDomain(options._account) || '',
        step: force ? 'all' : 'increase',
        done: true,
        source: 'unknown',
        lastUpdateTime,
        isMainAccount,
        _account,
      });

      return {
        success: true,
        data: [],
        from,
        count: lodashGet(list, 'length', 0),
        _account,
      };
    } catch (ex) {
      return {
        from,
        success: false,
        data: [],
        message: ex instanceof Error ? ex.message : `${ex}`,
      };
    }
  }

  /**
   * 同步组织树
   */
  async syncOrgList(options: ContactMultileAccountOption<{ force?: boolean; subDomain?: string }>): Promise<SyncResponseModal> {
    const { force = false, subDomain, isMainAccount, _account } = options;
    const from = 'org';
    try {
      const params = await this.getSyncServerParams({
        from,
        force,
        subDomain,
        isMainAccount,
        _account,
      });
      const url = this.systemApi.getUrl(this.getServerUrl(from, params));

      const { unitVOList: list = [], lastUpdateTime } = await this.excuteContactServerWithRetry<{
        unitVOList: resultObject[];
        lastUpdateTime: number;
      }>(
        {
          url,
          params,
          isMainAccount,
          _account,
        },
        force ? {} : { correctCodes: [0, 106000, 107000] }
      );

      if (Array.isArray(list) && list.length) {
        await this.contactDB.orgAllInto({
          list,
          isMainAccount,
          _account,
        });
      }

      // 更新本地记录
      this.contactUtil.setStoreContactSyncPageInfo({
        from,
        domain: this.getDomain() || '',
        step: force ? 'all' : 'increase',
        done: true,
        source: 'unknown',
        lastUpdateTime,
        isMainAccount,
        _account,
      });

      return {
        success: true,
        count: lodashGet(list, 'length', 0),
        data: [],
        from,
      };
    } catch (ex) {
      return {
        from,
        success: false,
        data: [],
        message: ex instanceof Error ? ex.message : `${ex}`,
      };
    }
  }

  /**
   * 同步个人分组
   */
  async syncPersonalOrgList(options: ContactMultileAccountOption<Partial<{ force: boolean }>>): Promise<SyncResponseModal> {
    const { force, isMainAccount, _account } = options;
    const from = 'personalOrg';

    try {
      const params = await this.getSyncServerParams({
        from,
        force,
        isMainAccount,
        _account,
      });
      const url = this.systemApi.getUrl(this.getServerUrl(from, params));

      const { personContactGroupList: list = [], lastUpdateTime } = await this.excuteContactServerWithRetry<{
        personContactGroupList: resultObject[];
        lastUpdateTime: number;
      }>({ url, params, isMainAccount, _account }, force ? {} : { correctCodes: [0, 106000, 107000] });

      // 执行插入 删除老数据
      await this.contactDB.personalOrgAllInto({
        force,
        list,
        isMainAccount,
        _account,
      });

      // 更新本地记录
      this.contactUtil.setStoreContactSyncPageInfo({
        from,
        domain: this.getDomain(_account) || '',
        step: force ? 'all' : 'increase',
        done: true,
        source: 'unknown',
        lastUpdateTime,
        isMainAccount,
        _account,
      });

      return {
        success: true,
        data: [],
        from,
        count: lodashGet(list, 'length', 0),
      };
    } catch (ex) {
      return {
        from,
        success: false,
        data: [],
        message: ex instanceof Error ? ex.message : `${ex}`,
      };
    }
  }

  async retry<T = any>(fn: () => Promise<ResponseData<T> | undefined>, count = 3): Promise<{ success: boolean; data?: ResponseData<T>; error?: unknown }> {
    try {
      const data = await fn();
      return {
        success: true,
        data,
      };
    } catch (e) {
      if (count - 1 <= 0) {
        return {
          success: false,
          error: e,
        };
      }
      return this.retry(fn, count - 1);
    }
  }

  async syncSelfCustomerList(lastId = 0): Promise<CustomerListCommonRes> {
    const { success, data, error } = await this.retry(async () => {
      const url = this.systemApi.getUrl('getCustomerList');
      const res = await this.http.post(
        url,
        {
          lastId,
          mode: 0,
          lastUpdateTime: 0,
          onlySelf: 1,
        },
        {
          contentType: 'json',
        }
      );
      return res.data;
    });
    if (success && data && data.success && data.data) {
      const { items, lastId: _lastId } = data.data;
      const loadMore = items.length > 0;
      if (loadMore) {
        const ret = await this.syncSelfCustomerList(_lastId);
        return {
          data: [...items, ...ret.data],
          loadMore: false,
        };
      }
      return {
        data: items,
        loadMore,
      };
    }
    console.error('[contact_edm] syncCustomerList error', error);
    return Promise.reject(new Error('syncCustomerList error'));
  }

  async doGetCustomerListFromServer(params: CustomerListParams): Promise<CustomerResFromServer[]> {
    const url = this.systemApi.getUrl('getCustomerListPage');
    const res = await this.http.post(url, params, {
      contentType: 'json',
    });
    const { success, data, error } = res.data || {};
    if (success && data) {
      const { companyList = [] } = data;
      return companyList;
    }
    console.error('[contact_edm] doGetCustomerListFromServer error', error);
    return Promise.reject(new Error('doGetCustomerListFromServer error'));
  }

  async doGetCustomersFromServerBatch(params: { idList: string[] }): Promise<CustomerResFromServer[]> {
    if (!Array.isArray(params.idList) || params.idList.length === 0) {
      return Promise.reject(new Error('doGetCustomerListFromServer error'));
    }
    const url = this.systemApi.getUrl('getCustomerDetailBatch');
    const reqParams = {
      companyIdList: params.idList,
    };
    const res = await this.http.post(url, reqParams, {
      contentType: 'json',
    });
    const { success, data, error } = res.data || {};
    if (success && data) {
      const { companyList = [] } = data;
      return companyList;
    }
    console.error('[contact_edm] doGetCustomerListFromServer error', error);
    return Promise.reject(new Error('doGetCustomerListFromServer error'));
  }

  private async getVersionLastId(type: 'customer' | 'clue'): Promise<number> {
    const currentStoreData = type === 'customer' ? this.getStoreData(this.customerSyncLastId) : this.getStoreData(this.clueSyncLastTime);
    if (type === 'customer' && this.getStoreData(this.syncPullVersionCustomer)) {
      // 当前版本不需要重新拉取
      return Number(currentStoreData || 0);
    }
    if (type === 'clue' && this.getStoreData(this.syncPullVersionClue)) {
      // 当前版本不需要重新拉取
      return Number(currentStoreData || 0);
    }
    // 需要删除原来数据
    await this.contactDB.deleteCustomerDataInDB();
    return 0;
  }

  /**
   * 同步我的客户列表
   * 全量拉的lastId,最后需要删除
   */
  async syncCustomerList(force?: boolean): Promise<CustomerListCommonRes> {
    const contactGlobalDBVersion = Number(this.getStoreData(this.contactGlobalDB) || 0);
    let lastUpdateTime = Number(this.getStoreData(this.customerSyncLastTime) || 0);
    // const lastId = Number(this.getStoreData(this.customerSyncLastId) || 0);
    let lastId = await this.getVersionLastId('customer');
    if (contactGlobalDBVersion < db_tables.contact_global.version) {
      lastUpdateTime = 0;
      this.store.putSync(this.contactGlobalDB, db_tables.contact_global.version.toString());
    }

    if (force) {
      lastUpdateTime = 0;
      lastId = 0;
    }
    const { success, data, error } = await this.retry(async () => {
      const url = this.systemApi.getUrl('getCustomerList');
      const res = await this.http.post(
        url,
        {
          lastId,
          mode: 1,
          onlySelf: 0,
          lastUpdateTime,
        },
        {
          contentType: 'json',
        }
      );
      return res.data;
    });
    if (success && data && data.success && data.data) {
      const { items, lastId: _lastId, lastUpdateTime: _lastUpdateTime } = data.data;
      this.store.putSync(this.customerSyncLastId, _lastId);
      this.store.putSync(this.customerSyncLastTime, _lastUpdateTime);
      this.store.putSync(this.syncPullVersionCustomer, 'true');
      const loadMore = items.length > 0 && !(_lastId === lastId && lastUpdateTime === _lastUpdateTime);
      return {
        data: items,
        loadMore,
      };
    }
    console.error('[contact_edm] syncCustomerList error', error);
    return Promise.reject(new Error('syncCustomerList error'));
  }

  /**
   * 同步线索列表
   */
  async syncClueList(): Promise<CustomerListCommonRes> {
    // const lastId = Number(this.getStoreData(this.clueSyncLastId) || 0);
    const lastId = await this.getVersionLastId('clue');
    const lastUpdateTime = Number(this.getStoreData(this.clueSyncLastTime) || 0);
    const { success, data, error } = await this.retry(async () => {
      const url = this.systemApi.getUrl('getClueList');
      const res = await this.http.post(
        url,
        {
          lastId,
          mode: 1,
          onlySelf: 0,
          lastUpdateTime,
        },
        {
          contentType: 'json',
        }
      );
      return res.data;
    });
    if (success && data && data.success && data.data) {
      const { items, lastId: _lastId, lastUpdateTime: _lastUpdateTime } = data.data;
      this.store.putSync(this.clueSyncLastId, _lastId);
      this.store.putSync(this.clueSyncLastTime, _lastUpdateTime);
      this.store.putSync(this.syncPullVersionCustomer, 'true');
      const loadMore = items.length > 0 && !(_lastId === lastId && lastUpdateTime === _lastUpdateTime);
      return {
        data: items,
        loadMore,
      };
    }
    console.error('[contact_edm] syncClueList error', error);
    return Promise.reject(new Error('syncClueList error'));
  }

  async getColleagueList(): Promise<resultObject[]> {
    const { success, data, error } = await this.retry(async () => {
      const url = this.systemApi.getUrl('getColleagueList');
      const res = await this.http.get(
        url,
        {},
        {
          contentType: 'json',
        }
      );
      return res.data;
    });
    if (success && data && data.success && data.data) {
      const items = data.data;
      return items;
    }
    console.error('[contact_edm] getColleagueList error', error);
    return Promise.reject(new Error('getColleagueList error'));
  }

  /**
   * @deprecated:无人调用 1.27之后移除
   * 通过id从服务器获取组织详情信息
   * @param lastUpdateTime  上一次同步的时间
   * @returns 组织详情列表
   */
  async getOrgDetailByServer(lastUpdateTime: number): Promise<resultObject[]> {
    const { data } = await this.http.get(
      this.systemApi.getUrl('getOrgList'),
      {
        lastUpdateTime,
        domain: this.getDomain(),
        isAll: 1,
        fetch_mode: 'increment',
      },
      {
        _account: this.systemApi.getCurrentUser()?.id || '',
      }
    );
    return data?.data?.unitVOList || ([] as resultObject[]);
  }

  /**
   * @deprecated:无人调用 1.27之后移除
   * 通过id从服务器获取通讯录详情信息
   * @param lastUpdateTime 上一次同步的时间
   * @returns 通讯录详情列表
   */
  async getContactByServer(lastUpdateTime: number): Promise<resultObject[]> {
    try {
      const { data } = await this.http.get(
        this.systemApi.getUrl('getEnterpriseContactList'),
        {
          lastUpdateTime,
          domain: this.getDomain(),
          isAll: 1,
          fetch_mode: 'increment',
        },
        {
          _account: this.systemApi.getCurrentUser()?.id || '',
        }
      );
      return data?.data?.contactVOList || ([] as resultObject[]);
    } catch (e) {
      console.warn('[contact] get server contact', e);
      return Promise.resolve([] as resultObject[]);
    }
  }

  /**
   * 重置联系人关联数据
   */
  resetContact() {
    try {
      this.store.del(this.lastSyncTimeKeyMap.enterprise).then().catch(console.warn);
      this.store.del(this.lastSyncTimeKeyMap.client).then().catch(console.warn);
      this.store.del(this.lastSyncTimeKeyMap.org).then().catch(console.warn);
      this.store.del(this.lastSyncTimeKeyMap.personal).then().catch(console.warn);
    } catch (e) {
      console.warn('[contact] reset all sync timestamp', e);
    }
  }

  transPersonalOrgToGroup(orgIdList: string | string[]) {
    if (Array.isArray(orgIdList)) {
      return orgIdList.map(orgId => orgId.replace('personal_org_', ''));
    }
    return orgIdList.replace('personal_org_', '');
  }

  async deletePersonalContact(_params: ContactMultileAccountOption<contactDeleteParams>) {
    const { _account, ...params } = _params;
    const { data } = await this.http.post(this.systemApi.getUrl('deleteContact'), params, {
      _account,
      timeout: 90 * 1000,
    });
    return data;
  }

  async updatePersonalContact(_params: ContactMultileAccountOption<{ params: contactUpdateParams }>) {
    const { _account, params } = _params;
    const groupIdList = (params.groupIdList || []).map(item => this.transPersonalOrgToGroup(item));
    const { data } = await this.http.post(
      this.systemApi.getUrl('updateContact'),
      { ...params, groupIdList: groupIdList.join(',') },
      {
        _account,
      }
    );
    return data;
  }

  async insertPersonalContact(
    _params: ContactMultileAccountOption<{ list: contactInsertParams | contactInsertParams[] }>
  ): Promise<undefined | ResponseData<resultObject[]>> {
    const { list, _account } = _params;
    const params = (Array.isArray(list) ? list : [list]).map(item => ({
      ...item,
      groupIdList: (item.groupIdList || []).map(groupId => this.transPersonalOrgToGroup(groupId)),
      auto: item.auto ? 1 : 0,
    }));
    const additionalParam = params[0]._account ? this.contactUtil.getAccountSession(params[0]._account) : undefined;

    const baseUrl = this.systemApi.getUrl('insertContactBatch');
    const url = this.http.buildUrl(baseUrl, { ...additionalParam }, {});

    const res = await this.http.post(url, params, {
      _account,
      contentType: 'json',
    });
    return res.data;
  }

  async insertPersonalOrg(
    params: ContactMultileAccountOption<{ groupName: string; idList?: string[]; marked?: number }>
  ): Promise<ContactCommonRes<insertPersonalOrgRes>> {
    const { groupName, idList, marked, _account } = params;
    const { data } = await this.http.post(
      this.systemApi.getUrl('insertPersonalOrg'),
      {
        groupName,
        accountIdList: idList,
        marked,
      },
      {
        _account,
        contentType: 'json',
      }
    );
    if (data?.success && data.data) {
      return {
        success: true,
        data: data.data,
      };
    }
    return {
      success: false,
      message: data?.message,
    };
  }

  async updatePersonalOrg(
    params: ContactMultileAccountOption<{ orgId: string; groupName: string; idList?: string[]; marked?: number }>
  ): Promise<ContactCommonRes<insertPersonalOrgRes>> {
    const { orgId, groupName, idList = [], marked = undefined, _account } = params;
    const groupId = this.transPersonalOrgToGroup(orgId);
    const { data } = await this.http.post(
      this.systemApi.getUrl('updatePersonalOrg'),
      {
        groupId,
        groupName,
        accountIdList: idList,
        marked,
      },
      {
        _account,
        timeout: 90 * 1000,
        contentType: 'json',
      }
    );
    if (data?.success && data.data) {
      return {
        success: true,
        data: data.data,
      };
    }
    return {
      success: false,
    };
  }

  async insertPersonalContactByPersonalOrgId(params: ContactMultileAccountOption<{ orgIdList: string[]; idList: string[] }>): Promise<ContactCommonRes> {
    const { orgIdList, idList: accountIdList, _account } = params;
    const groupIdList = this.transPersonalOrgToGroup(orgIdList);
    const { data } = await this.http.post(
      this.systemApi.getUrl('addPersonToPersonalOrg'),
      {
        groupIdList,
        accountIdList,
      },
      {
        _account,
        timeout: 90 * 1000,
        contentType: 'json',
      }
    );
    if (data?.success) {
      return {
        success: true,
      };
    }
    return {
      success: false,
      message: data?.message,
    };
  }

  async deletePersonalOrg(params: ContactMultileAccountOption<DeletePersonalOrgParams>): Promise<ContactCommonRes> {
    const { orgIdList, deletePersonContact, _account } = params;
    const groupIdList = this.transPersonalOrgToGroup(orgIdList);
    const { data } = await this.http.post(
      this.systemApi.getUrl('deletePersonalOrg'),
      {
        groupIdList,
        deletePersonContact,
      },
      {
        _account,
        contentType: 'json',
        timeout: 90 * 1000,
      }
    );
    if (data?.success) {
      return {
        success: true,
      };
    }
    return {
      success: false,
      message: data?.message,
    };
  }

  /**
   * 更新联系人头像
   * @param params 头像文件
   * @returns 组织详情列表
   */
  async uploadIcon(params: uploadIconParams): Promise<uploadIconRes> {
    const fileFormData = new FormData();
    fileFormData.append('file', params.file, params.fileName);
    const data = await this.http.post(this.systemApi.getUrl('uploadIcon'), fileFormData, {
      _account: this.systemApi.getCurrentUser()?.id || '',
      headers: {
        'Content-Type': 'multipart/form-data',
        accept: '*/*',
      },
      timeout: 20 * 60 * 1000,
      contentType: 'stream',
    });
    if (!data?.data) {
      return { success: false, message: '请求失败' };
    }
    return data.data as uploadIconRes;
  }

  async deleteAvartIcon() {
    return this.http.post(this.systemApi.getUrl('deleteAvatarIcon'), {});
  }

  async operateMailLsit(params: OperateMailListParams): Promise<void> {
    try {
      const { data } = await this.http.post(this.systemApi.getUrl('operateMailList'), params, {
        contentType: 'json',
      });
      const list = data?.data ? data.data?.contactVO : undefined;
      console.log('[contact_server] operateMailLsit', list);
      if (list) {
        const syncData = await this.contactDB.enterpriseAllInto({
          list: [list],
          _account: this.systemApi.getCurrentUser()?.id || '',
        });
        let notify: ContactMultileAccountOption<syncRes> = {
          syncStatus: { enterprise: true },
          _account: this.systemApi.getCurrentUser()?.id || '',
        };
        syncData.forEach(item => {
          notify = { ...notify, ...item };
        });
        this.contactDB.sendContactNotify(notify);
      }
    } catch (e) {
      console.error('[contact_server] operateMailLsit error', e);
    }
  }

  /**
   * 邮件列表成员接口
   */
  async getMaillistMember(accountName: string): Promise<maillistMemberRes> {
    try {
      const { account, domain } = this.contactUtil.handleAccountAndDomain(accountName);
      const { data } = await this.http.get(
        this.systemApi.getUrl('getMaillistMember'),
        {
          account_name: account,
          domain: domain || this.contactUtil.getDomain(),
        },
        {
          _account: this.systemApi.getCurrentUser()?.id || '',
          headers: {
            'Qiye-Header': 'anticsrf',
          },
        }
      );
      if (!data?.result) {
        return {
          success: false,
          message: data?.error,
          errorCode: data?.errorCode,
        };
      }
      return data?.result || ([] as resultObject[]);
    } catch (e) {
      console.error('[contact_server] getMaillistMember error', e);
      return {
        success: false,
      };
    }
  }

  // 查看邮件列表成员
  async createMaillist(mailListMember: MailListMember): Promise<any> {
    try {
      const { data } = await this.http.post(this.systemApi.getUrl('createMaillist'), mailListMember, {
        headers: { 'Qiye-Header': 'qiye' },
        contentType: 'json',
      });
      const { code, result, error, errorCode } = data as any;
      if (code !== 200 || !result) {
        return {
          success: false,
          message: error,
          errorCode,
        };
      }
      return {
        success: true,
        data: data?.result || {},
      };
    } catch (e) {
      console.error('[contact_server] createMaillist error', e);
      return {
        success: false,
      };
    }
  }

  // 编辑邮件列表成员
  async updateMaillist(mailListMember: MailListMember): Promise<any> {
    try {
      const { data } = await this.http.post(
        this.systemApi.getUrl('updateMaillist'),
        { ...mailListMember },
        {
          headers: { 'Qiye-Header': 'qiye' },
          contentType: 'json',
        }
      );
      const { code, result, error, errorCode } = data as any;
      if (code !== 200 || !result) {
        return {
          success: false,
          message: error,
          errorCode,
        };
      }
      return {
        success: true,
        data: data?.result || {},
      };
    } catch (e) {
      console.error('[contact_server] getMaillistMember error', e);
      return {
        success: false,
      };
    }
  }

  // 删除邮件列表成员
  async deleteMaillist(delMailListParams: DelMailListParams): Promise<maillistMemberRes> {
    try {
      const { data } = await this.http.post(
        this.systemApi.getUrl('deleteMaillist'),
        { ...delMailListParams },
        {
          headers: { 'Qiye-Header': 'qiye' },
          contentType: 'json',
        }
      );
      const { code, result, error, errorCode } = data as any;
      if (code !== 200 || !result) {
        return {
          success: false,
          message: error,
          errorCode,
          code,
        };
      }
      return {
        success: true,
        data: data?.result || {},
      };
    } catch (e) {
      console.error('[contact_server] getMaillistMember error', e);
      return {
        success: false,
      };
    }
  }

  // 获取用户域名列表
  async listUserDomain(): Promise<any> {
    try {
      const { data } = await this.http.post(this.systemApi.getUrl('listUserDomain'), {}, { headers: { 'Qiye-Header': 'qiye' } });
      return data;
    } catch (e) {
      console.error('[contact_server] getMaillistMember error', e);
      return {
        success: false,
      };
    }
  }

  // 我管理的邮件列表
  async listUserMaillist(type?: number): Promise<ContactCommonRes<UserMailListResultData[]>> {
    try {
      const { data } = await this.http.post(this.systemApi.getUrl('listUserMaillist'), type ? { maintainer_type: type } : {}, {
        headers: { 'Qiye-Header': 'qiye' },
        contentType: 'json',
      });
      const { code, result, error } = data as any;
      if (code !== 200 || !result) {
        return {
          success: false,
          message: error,
        };
      }
      return {
        success: true,
        data: data?.result?.data || [],
      };
    } catch (e) {
      console.error('[contact_server] listUserMaillist error', e);
      return {
        success: false,
      };
    }
  }

  // 查看邮件列表详情
  async getMaillist(getMailListParams: GetMailListParams): Promise<any> {
    try {
      const { data } = await this.http.get(
        this.systemApi.getUrl('getMaillist'),
        { ...getMailListParams },
        {
          headers: { 'Qiye-Header': 'qiye' },
          contentType: 'json',
        }
      );
      const { code, result, error, errorCode } = data as any;
      if (code !== 200 || !result) {
        return {
          success: false,
          message: error,
          errorCode,
        };
      }
      return {
        success: true,
        data: data?.result || {},
      };
    } catch (e) {
      console.error('[contact_server] getMaillistMember error', e);
      return {
        success: false,
      };
    }
  }

  // 获取用户基本信息
  async getMaillistConfig(): Promise<any> {
    try {
      const { data } = await this.http.get(
        this.systemApi.getUrl('getMaillistConfig'),
        {},
        {
          headers: { 'Qiye-Header': 'qiye' },
          contentType: 'json',
        }
      );
      const { code, result, error, errorCode } = data as any;
      if (code !== 200 || !result) {
        return {
          success: false,
          message: error,
          errorCode,
        };
      }
      return {
        success: true,
        data: data?.result || {},
      };
    } catch (e) {
      console.error('[contact_server] getMaillistMember error', e);
      return {
        success: false,
      };
    }
  }

  // 校验邮箱列表账号
  async checkMaillistAccountName(mailListMember: MailListMember): Promise<any> {
    try {
      const { data } = await this.http.post(
        this.systemApi.getUrl('checkMaillistAccountName'),
        { ...mailListMember },
        {
          headers: { 'Qiye-Header': 'qiye' },
          contentType: 'json',
        }
      );
      const { code, result, error, errorCode } = data as any;
      if (code !== 200 || !result) {
        return {
          success: false,
          message: error,
          errorCode,
        };
      }
      return {
        success: true,
        data: data?.result || {},
      };
    } catch (e) {
      console.error('[contact_server] getMaillistMember error', e);
      return {
        success: false,
      };
    }
  }

  async batchOperatePersonalMark(
    params: ContactMultileAccountOption<{
      operateList: { id: string; type: string; marked: number }[];
    }>
  ) {
    const url = this.systemApi.getUrl('addPersonalMark');
    const { operateList: _operateList, _account } = params;

    const operateList = _operateList.map(item => {
      if (item.type === '2') {
        item.id = item.id.replace('personal_org_', '');
      }
      return item;
    });

    try {
      const { data } = await this.http.post(
        url,
        {
          operateList,
        },
        {
          _account,
          contentType: 'json',
        }
      );
      const { code, error, errorCode } = data as any;
      return {
        success: code === 200,
        msg: code === 200 ? 'ok' : error,
        errorCode: code === 200 ? 0 : errorCode,
      };
    } catch (ex) {
      return {
        success: false,
        msg: lodashGet(ex, 'message', typeof ex === 'string' ? ex : ''),
        errorCode: 'unknown',
      };
    }
  }

  // 导入个人通讯录
  async personContactImport(params: PersonalImportParams): Promise<ContactCommonRes<resultObject[]>> {
    try {
      const fileFormData = new FormData();
      fileFormData.append('file', params.file);
      fileFormData.append('fileSize', params.fileSize.toString());
      if (params.groupId) {
        const groupId = this.transPersonalOrgToGroup(params.groupId) as string;
        fileFormData.append('groupId', groupId);
      }
      fileFormData.append('fileType', params.fileType.toString());
      fileFormData.append('type', params.type.toString());
      const { data } = await this.http.post(this.systemApi.getUrl('personContactImport'), fileFormData, {
        _account: this.systemApi.getCurrentUser()?.id,
        headers: {
          'Content-Type': 'multipart/form-data',
          accept: '*/*',
        },
        // timeout: 10,
        timeout: 30 * 60 * 1000,
        contentType: 'stream',
      });
      if (data?.success && data.data) {
        return {
          success: true,
          data: data.data.personContactVOList as resultObject[],
        };
      }
      console.warn('[contact_server] personContactImport warn', data);
      return {
        success: false,
        code: data?.code,
        message: data?.message,
      };
    } catch (e) {
      console.error('[contact_server] personContactImport error', e);
      return {
        success: false,
        message: this.contactUtil.catchError(e),
      };
    }
  }

  // 导出个人通讯录
  async personContactExport(params: PersonalExportParams): Promise<ContactCommonRes<string>> {
    try {
      const { groupId, fileType } = params;
      let _groupId = groupId;
      if (groupId) {
        _groupId = this.transPersonalOrgToGroup(groupId) as string;
      }
      const { data } = await this.http.post(
        this.systemApi.getUrl('personContactExport'),
        {
          groupId: _groupId,
          fileType,
        },
        {
          _account: this.systemApi.getCurrentUser()?.id || '',
          contentType: 'json',
        }
      );
      if (data?.success && data?.data) {
        return {
          success: true,
          data: data.data.downloadUrl,
        };
      }
      return {
        success: false,
        code: data?.code,
        message: data?.message,
      };
    } catch (e) {
      return {
        success: false,
        message: this.contactUtil.catchError(e),
      };
    }
  }

  // 导出个人通讯录模板
  async personContactExportTemplate(type: 1 | 2 = 1): Promise<ContactCommonRes<string>> {
    try {
      const { data } = await this.http.get(this.systemApi.getUrl('personContactExportTemplate'));
      if (data?.success && data?.data) {
        const url = type === 1 ? 'csvTemplateUrl' : 'vcfTemplateUrl';
        return {
          success: true,
          data: data.data[url],
        };
      }
      return {
        success: false,
        code: data?.code,
        message: data?.message,
      };
    } catch (e) {
      return {
        success: false,
        message: this.contactUtil.catchError(e),
      };
    }
  }

  // 获取全部客户传入负责人id来过滤掉不属于负责人的客户
  async getCustomerListFilterByManagerId(idList: string[], page: number): Promise<ContactCommonRes<CustomerLstFromManagerIdRes>> {
    try {
      // 获取当前用户的全部客户（不包含公海客户）
      const { data } = await this.http.post(
        this.systemApi.getUrl('getCustomerListByMangerId'),
        {
          page,
          page_size: 1000,
        },
        {
          contentType: 'json',
        }
      );
      if (data?.success && data?.data) {
        let loadMore = false;
        const totalPage = data.data?.total_page || 0;
        if (totalPage > page) {
          loadMore = true;
        }
        // 返回的客户列表
        let list: resultObject[] = data.data?.content;
        if (list?.length) {
          // 传入用来过滤的负责人列表
          const managerIdSet = new Set(idList);
          list = list.filter(item => {
            const managerList = item.manager_list || [];
            let needReturn = false;
            if (managerList.length > 0) {
              // 如果当前客户的负责人中有一个在过滤的负责人列表中，则说明是是符合过滤条件的客户
              needReturn = managerList.some((manager: resultObject) => managerIdSet.has(manager.id));
            }
            // 如果当前客户的负责人不存在则过滤
            if (!needReturn) {
              console.warn('[contact_server] getCustomerListFilterByManagerId', item);
            }
            return needReturn;
          });
        }
        return {
          success: true,
          data: {
            list,
            loadMore,
            from: 'all',
          },
        };
      }
      return {
        success: false,
        code: data?.code,
        message: data?.message,
      };
    } catch (error: any) {
      console.error('[contact_server] getCustomerListFilterByManagerId error', error);
      if (error?.data?.code === 40101) {
        return { success: true };
      }
      return {
        success: false,
        message: this.contactUtil.catchError(error),
      };
    }
  }

  // 通过负责人获取客户列表
  async getCustomerListByManagerId(params: { idList: string[]; page: number; from?: 'all' | 'filter' }): Promise<ContactCommonRes<CustomerLstFromManagerIdRes>> {
    const { idList, page, from = 'filter' } = params;
    if (from === 'all') {
      return this.getCustomerListFilterByManagerId(idList, page);
    }
    try {
      const { data } = await this.http.post(
        this.systemApi.getUrl('getCustomerListByMangerId'),
        {
          page,
          page_size: 1000,
          quickFilter: {
            relation: 'AND',
            subs: [{ id: 'manager_list', condition: { method: 'ANY_OF', values: idList }, table: 'customer' }],
          },
        },
        {
          contentType: 'json',
        }
      );
      if (data?.success && data?.data) {
        let loadMore = false;
        const totalPage = data.data?.total_page || 0;
        // 超过10页的数据需要换用（返回全部客户用负责人id过滤）的方案
        if (totalPage > 10) {
          return this.getCustomerListFilterByManagerId(idList, page);
        }
        if (totalPage > page) {
          loadMore = true;
        }
        return {
          success: true,
          data: {
            list: data.data.content as resultObject[],
            loadMore,
            from: 'filter',
          },
        };
      }
      return {
        success: false,
        code: data?.code,
        message: data?.message,
      };
    } catch (error: any) {
      console.error('[contact_server] getCustomerListByManagerId error', error);
      if (error?.data?.code === 40101) {
        return { success: true };
      }
      return {
        success: false,
        message: this.contactUtil.catchError(error),
      };
    }
  }

  async getRecentContactListInServer(params: recentContactListParams): Promise<recentContactListRes[]> {
    try {
      const { data } = await this.http.get(this.systemApi.getUrl('getRecentContactList'), params, {
        _account: params._account || this.systemApi.getCurrentUser()?.id || '',
      });
      if (data?.data?.contactList) {
        this.recentContactDiffs(data?.data?.contactList, params);
      }
      return data?.data?.contactList || ([] as recentContactListRes[]);
    } catch (e) {
      return [];
    }
  }

  private async recentContactDiffs(contactList: recentContactListRes[], params: recentContactListParams) {
    const dbContactList = await this.contactDB.getRecentContact(params);
    if (!dbContactList || contactList.length !== dbContactList.length) {
      this.contactDB.saveRecentContactInDb(contactList, params);
      // this.eventApi.sendSysEvent({
      //   eventName: 'recentContactNotify',
      //   eventStrData: 'notify',
      //   eventData: {
      //     result: contactList,
      //   },
      //   _account: params._account || this.systemApi.getCurrentUser()?.id || '',
      // });
      return;
    }
    const dbContactEmailStr = dbContactList.reduce((prev, item) => prev + item.email, '');
    const contactEmailStr = contactList.reduce((prev, item) => prev + item.email, '');
    if (dbContactEmailStr !== contactEmailStr) {
      this.contactDB.saveRecentContactInDb(contactList, params);
      // this.eventApi.sendSysEvent({
      //   eventName: 'recentContactNotify',
      //   eventStrData: 'notify',
      //   eventData: {
      //     result: contactList,
      //   },
      //   _account: params._account || this.systemApi.getCurrentUser()?.id || '',
      // });
    }
  }
}

export const ContactServerInstance = new ContactServer();
