import lodashGet from 'lodash/get';
import zipWith from 'lodash/zipWith';
import { syncRes, SyncResponseModal, SyncResponseStatus, CoreContactEvent, ContactMultileAccountOption } from '@/api/logical/contactAndOrg';
import { ContactDB, ContactDBInstance } from './contact_dbl';
import { IntervalEventParams, EventHandler } from '@/api/system/system';
import { api } from '@/api/api';
import { DataTrackerApi, LoggerApi } from '@/api/data/dataTracker';
import { apis, inWindow, getShouldInitMemoryDBInMainPage } from '@/config';
import { AccountApi } from '@/api/logical/account';
import ContactUtilInterface, { ContactConst } from './contact_util';
import { ContactServer, ContactServerInstance } from './contact_server';
import { MailApi } from '@/api/logical/mail';
import { ContactEdmHelper, ContactEdmHelperInstance } from './contact_edm_help';
import { contactHealthDetectHelper } from './contact_healthdetect_helper';
import { SystemEvent } from '@/api/data/event';
import { DbApiV2, DbRefer } from '@/api/data/new_db';
import { CustomerSyncRes } from '@/api/logical/contact_edm';
import { ProductAuthApi } from '@/api/logical/productAuth';
import { locationHelper } from '@/api/util/location_helper';
import { PerformanceApi } from '@/api/system/performance';
import { wait } from '@/api/util';

export class ContactSync {
  systemApi = api.getSystemApi();

  eventApi = api.getEventApi();

  http = api.getDataTransApi();

  storeApi = api.getDataStoreApi();

  dbApi: DbApiV2 = api.getNewDBApi();

  contactDB: ContactDB = ContactDBInstance;

  contactUtil: ContactConst = ContactUtilInterface;

  contactServer: ContactServer = ContactServerInstance;

  contactEdmHelper: ContactEdmHelper = ContactEdmHelperInstance;

  dataTracker = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

  loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;

  mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;

  accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

  productApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

  performanceApi = api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;

  isSyncCustomer = false;

  isSyncColleague = false;

  switchCustomerEdmSync = true;

  localContactReady = false;

  shareDomainList: string[] | undefined = undefined;

  contactHealthDetectHelper = contactHealthDetectHelper;

  contactSyncAllHandle: IntervalEventParams = {
    eventPeriod: 'mid',
    handler: ob => {
      // 如果当前页面不可以执行同步 或者被设置成不可以同步
      // 1.24版本之后web环境下不在执行遍历操作
      const enableSync = window.isBridgeWorker || (this.systemApi.getIsLowMemoryModeSync() && this.systemApi.isMainPage());

      if (!enableSync || process.env.BUILD_ISWEB) {
        return;
      }

      // 15min 后执行自动同步
      console.log('[contact] contactSyncAllHandle', ob.seq);
      const intevalTime = this.contactUtil.getContactSyncIntervalSeq();
      if (ob.seq > 2 && ob.seq % intevalTime === 0) {
        console.log('%c[contactInterval]更新同步start', 'color:blue;background:yellow;font-size:18px;');
        this.doSyncFullContact({
          force: false,
          isMainAccount: true,
          _account: this.systemApi.getCurrentUser()?.id || '',
        })
          .then(() => {
            console.log('%c[contactInterval]更新同步成功', 'color:blue;background:yellow;font-size:18px;');
            // 1个小时以后执行一次orgContact数据重复检测
            // 异常场景下太迟了
            if (ob.seq % (4 * intevalTime) === 0) {
              this.contactHealthDetectHelper.detectContactData();
            }

            // 3个小时清理一次frequentContact表
            if (ob.seq % (12 * intevalTime) === 0) {
              // this.contactDB.cleanExpiredFrequentContact({ _account: this.systemApi.getCurrentUser()?.id || '' });
            }
          })
          .catch(res => {
            console.log('%c[contactInterval]更新同步失败', 'color:white;background:red;font-size:18px;', res);
          });
      }
    },
    id: 'contactSyncAll',
    seq: 0,
  };

  contactColleagueSyncHandle: IntervalEventParams = {
    eventPeriod: 'long',
    handler: ob => {
      // 450s 后执行自动同步
      if (ob.seq > 10 && ob.seq % 20 === 0 && this.switchCustomerEdmSync) {
        console.warn('[contact] contactColleagueSyncHandle', ob.seq);
        this.syncContactColleague();
      }
    },
    id: 'contactColleagueSync',
    seq: 0,
  };

  contactCustomerSyncHandle: IntervalEventParams = {
    eventPeriod: 'long',
    handler: ob => {
      console.log('[contact] contactSyncAllHandle', ob.seq);
      if (ob.seq > 10 && ob.seq % 20 === 0 && this.switchCustomerEdmSync) {
        this.syncContactCustomer().catch(res => {
          console.error('[contact] sync error:', res);
        });
      }
    },
    id: 'contactCustomerSync',
    seq: 0,
  };

  getContactReady() {
    return this.localContactReady;
  }

  setContactReady(isReady: boolean) {
    this.localContactReady = isReady;
  }

  private async subDomainShareList(force = false): Promise<boolean> {
    //  如果是强制更新强制调用一下accountInfo接口
    if (force) {
      try {
        const shareDomainMap = await this.accountApi.doSyncDomainShareList();
        //  获取domain列表
        this.shareDomainList = Object.values(shareDomainMap);
      } catch (ex) {
        console.error('[contact_sync]subdomainsharelist.error', ex);
      }

      return true;
    }

    //  如果是强制同步或者shareDomainlist是空的
    if (typeof this.shareDomainList === 'undefined') {
      return new Promise(r => {
        let tHandler: undefined | number;
        let eventId = 0;
        //  第一次必须强制去从拿最新的domainlist 所以要监听storeUserChangeEvent
        const shareDomainCallback = async () => {
          // unregisterSysEventObserver存在eventId还没有生成就执行取消的逻辑？
          await Promise.resolve(1);
          const shareDomainList = lodashGet(this.systemApi.getCurrentUser(), 'props.domainShareList', undefined) as Record<string, string>;
          //  只要同步domainShareList这个字段 表示从服务端更新了accountInfo了
          if (typeof shareDomainList !== 'undefined') {
            this.eventApi.unregisterSysEventObserver('storeUserChangeEvent', eventId);
            tHandler && clearTimeout(tHandler);
            this.shareDomainList = Object.values(shareDomainList);
            r(true);
          }
        };
        eventId = this.eventApi.registerSysEventObserver('storeUserChangeEvent', {
          func: shareDomainCallback,
          _account: this.systemApi.getCurrentUser()?.id || '',
        });
        tHandler = window.setTimeout(() => {
          const shareDomainList = lodashGet(this.systemApi.getCurrentUser(), 'props.domainShareList', undefined) as Record<string, string>;
          this.shareDomainList = shareDomainList ? Object.values(shareDomainList) : [];
          this.eventApi.unregisterSysEventObserver('storeUserChangeEvent', eventId);
          r(false);
        }, 2000);
      });
    }

    return true;
  }

  private async getSubDomainSyncList(force: boolean): Promise<string[]> {
    try {
      const subDomainMap = lodashGet(this.systemApi.getCurrentUser(), 'prop.domainShareList', {}) as Record<string, string>;
      const subOrgList = Object.keys(subDomainMap);
      const subDomainList = Object.values(subDomainMap);
      //  如果是强制同步
      if (force) {
        return subDomainList;
      }
      const domainLocalDBExistList = await Promise.all(subOrgList.map(async orgItemId => this.contactDB.hasSubDomainData(orgItemId)));
      const dbExistMap = Object.fromEntries(zipWith(subOrgList, domainLocalDBExistList, (a, b) => [subDomainMap[a], b]));

      return subDomainList.filter(domainItem => !dbExistMap[domainItem]);
    } catch (ex) {
      console.error('[contact_sync]getSubDomainSyncList.error:', ex);
      return [];
    }
  }

  private coreContactEventHandler: Map<string, number | undefined> = new Map();

  private syncStatusMap: Map<string, 'ing' | 'init'> = new Map();

  private async doSyncAction(
    options: ContactMultileAccountOption<{
      force?: boolean;
      enableSkipFullSync?: boolean;
    }>
  ): Promise<any> {
    const { force: _force, enableSkipFullSync = false } = options;
    let force = _force;

    // 是否可以快速移除无效数据(自动同步长延迟删除,手动同步段延迟删除)
    // 首次启动需要同步核心接口的时候。删除DB老数据的操作要延后避免DB操作太集中 影响业务执行
    // 用户点强制刷新的时候可以稍等一会就删除数据(用户是有这个心里预期的)
    const enableFastCleanInvalidContact = force;

    if (this.syncStatusMap.get(options._account) === 'ing') {
      console.warn('[contact] 正在同步中:' + window.location.pathname);
      return '正在同步中';
    }
    this.syncStatusMap.set(options._account, 'ing');

    if (enableFastCleanInvalidContact) {
      this.dataTracker.track('pc_contact_trigger_sync', {
        _account: options._account,
        recordSubAccount: false,
      });
    }

    try {
      // web环境下每次刷新都强制执行核心同步流程
      // force = process.env.BUILD_ISWEB || force;
      // 如果是非强制强制 检查本地数据确定是否要同步全量数据
      if (!force) {
        const syncCompleteStatus = await this.contactDB.detectCoreEnterpriseHasData({ _account: options._account });
        force = force || syncCompleteStatus === 'none';
      }

      /**
       * 1.27版本之后无论主账号还是子账号都走核心同步
       */
      await this.doSyncCoreContact({
        force,
        enableFastCleanInvalidContact,
        enableSkipFullSync,
        ...this.contactUtil.getPublicParamFromMultipleOptions(options),
      });
    } catch (ex) {
      console.error('[contact_sync]syncAll.failed', ex);
    }

    this.syncStatusMap.set(options._account, 'init');

    return true;
  }

  // 核心数据同步
  // needNotify是否需要发送isReady通知 子账号不用发送
  /**
   * @description:核心数据同步
   * @param force 是否强制更新
   * @param enableFastCleanInvalidContact 是否可以快速删除无效通讯录数据(true->2s false:15s)
   * @returns
   */
  private async doSyncCoreContact(
    options: ContactMultileAccountOption<{
      force?: boolean;
      enableFastCleanInvalidContact?: boolean;
      enableSkipFullSync?: boolean;
    }>
  ) {
    const { force = false, enableFastCleanInvalidContact = false, enableSkipFullSync = false, isMainAccount } = options;

    // 如果数据至少已经同步了核心数据 直接发送通知
    if (!force) {
      this.contactUtil.sendCrossEvent({
        eventName: 'changeCoreContactSyncStatus',
        eventData: {
          status: 'finish',
          from: 'db',
          isMainAccount,
          enableSkipFullSync,
        },
        _account: options._account,
      });
      return;
    }

    // 发送一个核心数据同步通知 后台停止所有的同步
    this.contactUtil.sendCrossEvent({
      eventName: 'changeCoreContactSyncStatus',
      eventData: {
        status: 'start',
        isMainAccount,
        enableSkipFullSync,
      },
      _account: options._account,
    });

    const corePersonalStartTime = Date.now();
    try {
      const res = await Promise.all([
        this.contactServer.syncPersonContactList({
          force,
          ...this.contactUtil.getPublicParamFromMultipleOptions(options),
        }),
        this.contactServer.syncPersonalOrgList({
          force,
          ...this.contactUtil.getPublicParamFromMultipleOptions(options),
        }),
      ]);
      const countMap = Object.fromEntries(res.map(item => [item.from, item.count || 0]));

      this.dataTracker.track('pc_sync_core_personal_done', {
        _account: options._account,
        status: 'success',
        msg: '',
        duration: Date.now() - corePersonalStartTime,
        ...(countMap || {}),
      });
    } catch (ex) {
      console.error('[contact_sync]doSyncCorePersonal.failed', ex);
      const errMsg = lodashGet(ex, 'message', `${ex}`);
      this.dataTracker.track('pc_sync_core_personal_done', {
        _account: options._account,
        msg: errMsg,
        duration: Date.now() - corePersonalStartTime,
        status: 'fail',
      });
    }

    const coreEntityStartTime = Date.now();
    try {
      const res = await Promise.all([
        this.contactServer.doSyncCoreContactData({
          enableFastCleanInvalidContact,
          ...this.contactUtil.getPublicParamFromMultipleOptions(options),
        }),
        this.contactServer.doSyncCoreOrgData({
          enableFastCleanInvalidContact,
          ...this.contactUtil.getPublicParamFromMultipleOptions(options),
        }),
      ]);
      const coreCountMap = Object.fromEntries(res.map(item => [item.from, item.count]));
      this.dataTracker.track('pc_sync_core_entity_done', {
        _account: options._account,
        status: 'success',
        msg: '',
        duration: Date.now() - coreEntityStartTime,
        ...(coreCountMap || {}),
      });
    } catch (ex) {
      console.error('[contact_sync]doSyncCoreEntity.failed', ex);
      this.dataTracker.track('pc_sync_core_entity_done', {
        _account: options._account,
        status: 'fail',
        msg: lodashGet(ex, 'message', `${ex}`),
        duration: Date.now() - coreEntityStartTime,
      });
    }

    this.contactUtil.sendCrossEvent({
      eventName: 'changeCoreContactSyncStatus',
      eventData: {
        status: 'finish',
        from: 'server',
        enableSkipFullSync,
        isMainAccount,
      },
      _account: options._account,
    });

    // todo:全量数据不可以send所有ID
    this.handleSyncData({
      data: [],
      isAll: true,
      ...this.contactUtil.getPublicParamFromMultipleOptions(options),
    });
  }

  private mainAccountTeamSyncStatus: 'init' | 'ing' | 'done' = 'init';

  // 同步完整通讯录数据
  private async doSyncFullContact(options: ContactMultileAccountOption<{ force?: boolean }>) {
    const { force = false, ...restOptions } = options;

    // 同步shareDomain(关联企业)
    await this.subDomainShareList(force);
    const needSyncSubDomainlist = await this.getSubDomainSyncList(force);

    const totalSyncQueue: Promise<unknown>[] = [];
    // 只有用户点强制同步 OR DB表中没有关联企业数据才同步
    if (needSyncSubDomainlist.length > 0) {
      needSyncSubDomainlist.forEach(subDomain => {
        totalSyncQueue.push(this.contactServer.doSyncCoreContactData({ subDomain, ...restOptions }));
        totalSyncQueue.push(this.contactServer.doSyncCoreOrgData({ subDomain, ...restOptions }));
      });
    }

    const enableSkipFullSync = getShouldInitMemoryDBInMainPage() || this.productApi.getABSwitchSync('skip_full_enterprise') || this.systemApi.getIsLowMemoryModeSync();

    // 企业通讯录增量或者全量更新要调用全量接口要同事满足三个条件：
    // 1.electron环境下
    // 2.非低内存模式
    // 3.没有被灰中skipFullEnterprise
    // 4.web环境下
    if (force && enableSkipFullSync) {
      console.log('[contact_sync]skipfullenterprise in web');
    } else {
      totalSyncQueue.push(
        this.contactServer.syncEnterpriseContactList({
          force,
          ...restOptions,
        })
      );
    }

    // 如果是增量更新或者第三方账号 插入组织/个人/个人分组更新任务
    if (!force) {
      totalSyncQueue.push(this.contactServer.syncOrgList({ force, ...restOptions }));
      totalSyncQueue.push(this.contactServer.syncPersonContactList({ force, ...restOptions }));
      totalSyncQueue.push(this.contactServer.syncPersonalOrgList({ force, ...restOptions }));
    }

    const res = (await Promise.all(totalSyncQueue)) as SyncResponseModal[];

    // 如果增量更新场景下 没有执行过全量同步。尝试去同步一下自身信息，解决systemApi.getCurrentUser().contact中yunxin信息为空的问题
    // if (!force && !enableSkipFullSync) {
    if (!force && enableSkipFullSync) {
      try {
        await this.contactServer.syncSelfYunxin({
          _account: options._account,
        });
      } catch (ex) {
        console.error('contactDB.syncSelf error', ex);
      }
    }

    await wait(200);

    // 数据后台 || 增量更新场景下触发计算部门人数逻辑
    if (!force) {
      try {
        await this.contactDB.triggerComputeEntityOrgMemeberNum(restOptions._account);
      } catch (ex) {
        console.error('contactDB.triggerComputeEntityOrgMemeberNum error', ex);
      }
    }

    // 增量更新|| 全量更新的时候有关联账号更新 || 第三方账号
    if (!force || needSyncSubDomainlist.length) {
      this.handleSyncData({
        data: res,
        isAll: false,
        ...restOptions,
      });
    }

    // 如果是主账号 & 是强制更新=> 这个流程也比较奇怪 会有人通过强制更新来做群组更新
    if (options.isMainAccount && (force || this.mainAccountTeamSyncStatus === 'init')) {
      this.mainAccountTeamSyncStatus = 'ing';
      // 同步群组信息
      setTimeout(() => {
        this.contactDB
          .syncTeamList({ force: true })
          .then(() => {
            this.mainAccountTeamSyncStatus = 'done';
          })
          .catch(() => {
            this.mainAccountTeamSyncStatus = 'init';
          });
      }, 3000);
    }
  }

  async syncContactColleague() {
    if (this.isSyncColleague) {
      console.error('[contact_sync] syncContactColleague error, syncContactColleague is sync');
      return [];
    }
    this.isSyncColleague = true;
    try {
      const data = await this.contactServer.getColleagueList();
      const res = await this.contactEdmHelper.handleColleagueList(data);
      this.isSyncColleague = false;
      return res;
    } catch (e) {
      this.isSyncColleague = false;
      console.error('[contact_sync] syncContactColleague error', e);
      return [];
    }
  }

  async syncCustomerListLoop(force?: boolean): Promise<CustomerSyncRes> {
    const res: Record<string, unknown[]> = {
      orgList: [],
      managerList: [],
      contactList: [],
      orgContactList: [],
      labelList: [],
    };
    try {
      const { data, loadMore } = await this.contactServer.syncCustomerList(force);
      const arr = await Promise.all([
        this.contactEdmHelper.handleCustomerList({ data }),
        loadMore ? await this.syncCustomerListLoop() : Promise.resolve({} as CustomerSyncRes),
      ]);
      arr.forEach(item => {
        Object.keys(res).forEach(key => {
          const curKey = key as unknown as keyof CustomerSyncRes;
          res[curKey] = res[curKey].concat(item[curKey] || []);
        });
      });
    } catch (e) {
      console.error('[contact_sync] syncCustomerList error', e);
    }
    return res as unknown as CustomerSyncRes;
  }

  async syncClueListLoop(): Promise<CustomerSyncRes> {
    const res: Record<string, unknown[]> = {
      orgList: [],
      managerList: [],
      contactList: [],
      orgContactList: [],
      labelList: [],
    };
    try {
      const { data, loadMore } = await this.contactServer.syncClueList();
      const arr = await Promise.all([this.contactEdmHelper.handleClueList({ data }), loadMore ? await this.syncClueListLoop() : Promise.resolve({} as CustomerSyncRes)]);
      arr.forEach(item => {
        Object.keys(res).forEach(key => {
          const curKey = key as unknown as keyof CustomerSyncRes;
          res[curKey] = res[curKey].concat(item[curKey]);
        });
      });
    } catch (e) {
      console.error('[contact_sync] syncClueList error', e);
    }
    return res as unknown as CustomerSyncRes;
  }

  /**
   * 同同步edm当前公司的客户线索数据
   */
  async syncContactCustomer(params?: { isInit?: boolean; force?: boolean }): Promise<{ syncFinish: boolean; error?: unknown }> {
    const { isInit, force } = params || {};
    try {
      if (!this.contactUtil.getCurrentContactId()) {
        await this.accountApi.doGetMailAliasAccountListV2();
      }
      if (this.isSyncCustomer) {
        console.error('[contact_sync] syncContactCustomer error', '客户数据同步中，请稍后');
        return {
          syncFinish: false,
        };
      }
      const start = Date.now();
      this.isSyncCustomer = true;
      if (isInit) {
        const selfRes = await this.contactServer.syncSelfCustomerList();
        await this.contactEdmHelper.handleCustomerList({ data: selfRes.data, needDeleteLastData: false });
        this.isSyncCustomer = false;
        this.contactUtil.logger('contact_edm_sync_myCustomer', this.contactUtil.useTime(start));
      }
      // edm-mail-1215废弃 不在同步线索
      //  await Promise.all([
      //    this.syncCustomerListLoop(),
      //    this.syncClueListLoop()
      //  ]);
      await this.syncCustomerListLoop(force);
      this.isSyncCustomer = false;
      this.contactEdmHelper.sendContactEdmNotify({ type: 'customer', isForce: force }, true);
      this.contactUtil.logger('contact_edm_sync_contact_customer', this.contactUtil.useTime(start));
      console.warn('[contact_edm] sync syncContactCustomer finish!');
      return {
        syncFinish: true,
      };
    } catch (e) {
      this.isSyncCustomer = false;
      console.error('[contact_sync] syncContactCustomer error', e);
      return {
        error: e,
        syncFinish: true,
      };
    }
  }

  enableSync(): boolean {
    if (!inWindow()) {
      return false;
    }
    if (process.env.BUILD_ISELECTRON) {
      return this.systemApi.isMainPage();
    }
    return this.systemApi.isMainPage() || locationHelper.isJumpPage();
  }

  enableEdmSync() {
    return (
      inWindow() &&
      this.systemApi.getCurrentUser() &&
      process.env.BUILD_ISEDM &&
      this.systemApi.inEdm() &&
      this.productApi.getABSwitchSync('edm_mail') &&
      this.enableSync() &&
      // TODO: 外贸 + 邮件第三期，暂时不对挂载邮箱开放
      !window.isAccountBg
    );
  }

  /**
   * 发送联系人同步完成通知i
   * @param data
   */
  private handleSyncData(
    options: ContactMultileAccountOption<{
      data: SyncResponseModal[];
      isAll?: boolean;
    }>
  ): ContactMultileAccountOption<syncRes> {
    const { data, isAll = false, ...restOptions } = options;
    console.log('[contact] handleSyncData', data);
    let res: ContactMultileAccountOption<syncRes> = {
      syncStatus: {},
      isAll,
      ...restOptions,
    };
    const syncStatus: SyncResponseStatus = {};
    if (isAll) {
      syncStatus.enterprise = true;
      syncStatus.org = true;
      syncStatus.personal = true;
      syncStatus.personalOrg = true;
    }
    // 如果是全量数据 不执行数据比对
    if (!isAll) {
      data.forEach(item => {
        if (!item.count) {
          return;
        }
        syncStatus[item.from] = item.success;
        ['enterprise', 'personal'].includes(item.from) &&
          item.data?.forEach(diff => {
            res = Object.assign(res, diff);
          });
      });
    }

    res.syncStatus = syncStatus;
    this.loggerApi.track('contact_sync_suceess', {
      contactSyncTimes: this.contactDB.contactSyncTimes,
    });
    console.log('[contact] will sendContactNotify', res);
    setTimeout(() => {
      this.contactDB.sendContactNotify(res);
    }, 100);
    return res;
  }

  private delayStartFullSyncHandler = 0;

  setContactSync(options: ContactMultileAccountOption<{ force: boolean; enableSkipFullSync?: boolean }>) {
    if (!inWindow()) {
      return;
    }

    // 防止后台页面重启之后接受不到前台通知的情况下自动重启
    this.createIntervalSubscribleContactCoreEvent(options._account);

    // 处理事件监听
    const addCoreEventFunc = async (e: SystemEvent<CoreContactEvent>) => {
      const coreSyncStatus = lodashGet(e, 'eventData.status', 'start');
      const coreDataFrom = lodashGet(e, 'eventData.from', 'db');
      const subAccount = options._account;
      const isMainAccount = this.systemApi.getIsMainAccount(subAccount);

      if (isMainAccount) {
        // 接受到起前台通知立马取消延迟默认操作(防止后台自动重启场景下接受不到前台通知)
        this.delayStartFullSyncHandler && this.systemApi.cancelEvent('mid', this.delayStartFullSyncHandler);
        // 取消定时轮询
        this.systemApi.cancelEvent(this.contactSyncAllHandle.eventPeriod, 'contactSyncAll');
      }

      if (coreSyncStatus === 'start') {
        console.error('[conact_sync]coresync', coreSyncStatus, coreDataFrom);
        return;
      }

      // 如果发送了finish通知 但是无效数据还没有删除 先不要开始执行同步
      if (coreSyncStatus === 'finish' && coreDataFrom === 'server') {
        // enableSkipFullSync = e.eventData?.enableSkipFullSync || false;
        return;
      }

      // electron环境下要定时执行遍历更新
      if (process.env.BUILD_ISELECTRON && isMainAccount) {
        this.systemApi.intervalEvent(this.contactSyncAllHandle);
      }

      // 稍微延迟一下 保证拿到了灰度配置
      wait(100);

      // 如果core刚执行了服务端同步。在数据后台页面马上执行一次全量同步
      let isForce = coreDataFrom === 'server';

      // 如果本地只做了核心数据数据同步 fullContact还是要走全量同步
      if (!isMainAccount) {
        isForce = false;
      } else if (!isForce) {
        const syncStatus = await this.contactDB.detectCoreEnterpriseHasData({
          from: 'enterprise',
        });
        isForce = syncStatus !== 'all';
      }

      console.error('[conact_sync]coresync.done', coreDataFrom, '.isForce:', isForce);
      await this.doSyncFullContact({
        force: isForce,
        isMainAccount,
        _account: this.systemApi.getCurrentUser(subAccount)?.id || '',
      });

      // 如果调用的是全量更新 全量更新之后立马调用一次增量更新
      // why?
      // reason: 全量接口对于大企业可能配置了缓存。整个强制更新流程中,全量接口调用,管理后台的最新改动可能因为缓存还没有生效。
      // 继续调用一次增量更新保证最新数据一定已经要写入到本地
      if (isForce) {
        await wait(500);
        await this.doSyncFullContact({
          force: false,
          isMainAccount,
          _account: this.systemApi.getCurrentUser(subAccount)?.id || '',
        });
      }
      // 将检测重复数据的逻辑放到这里来
      try {
        await wait(200);
        isMainAccount && this.contactHealthDetectHelper.doDetectContactItemData();
        await wait(200);
        this.contactDB.cleanExpiredFrequentContact({ _account: this.systemApi.getCurrentUser(subAccount)?.id || '' });
      } catch (ex) {
        console.log('[contact_sync]setContactSync.error(doDetectContactItemData)', ex);
      }
    };

    /**
     * 主账号可以在以下场景之一中执行全量数据同步:
     * 1.数据后台页面
     * 2.低内存模式下的主页(electron环境)
     * 3.getShouldInitMemoryDBInMainPage=true(web环境下的主页)
     */
    const enableSubscribleCoreEvent =
      window.isBridgeWorker || (this.systemApi.getIsLowMemoryModeSync() && this.systemApi.isMainPage()) || getShouldInitMemoryDBInMainPage();
    if (enableSubscribleCoreEvent) {
      const eid = this.coreContactEventHandler.get(options._account);
      eid && this.eventApi.unregisterSysEventObserver('changeCoreContactSyncStatus', eid);
      const nextEventId = this.eventApi.registerSysEventObserver('changeCoreContactSyncStatus', {
        func: addCoreEventFunc,
        _account: options._account,
      });
      this.coreContactEventHandler.set(options._account, nextEventId);
    }

    // 是否可以同步(默认可以)
    const enableSync = this.enableSync();
    if (!enableSync) {
      return;
    }

    this.doSyncAction(options);
  }

  // 监听通讯录核心接口事件
  // 避免后台页面重建场景下因为无法接受到事件通知
  private createIntervalSubscribleContactCoreEvent(_account: string) {
    const isMainAccount = this.systemApi.getIsMainAccount(_account);
    // 如果执行的同步的数据不是主账号数据 则不处理
    if (!isMainAccount || !window.isBridgeWorker) {
      return;
    }

    const handler: EventHandler = async ob => {
      // 超过三次(45s )直接放弃
      if (ob.seq > 3) {
        this.delayStartFullSyncHandler && this.systemApi.cancelEvent('mid', this.delayStartFullSyncHandler);
        return;
      }
      // 如果当前通讯录状态不是空 则在15s后强制发送一个chagneCore事件
      const status = await this.contactDB.detectCoreEnterpriseHasData({});
      if (status !== 'none') {
        this.delayStartFullSyncHandler && this.systemApi.cancelEvent('mid', this.delayStartFullSyncHandler);
        this.eventApi.sendSysEvent({
          eventName: 'changeCoreContactSyncStatus',
          eventData: {
            status: 'finish',
            from: 'db',
          },
          _account,
        });
      }
    };

    this.delayStartFullSyncHandler && this.systemApi.cancelEvent('mid', this.delayStartFullSyncHandler);
    this.delayStartFullSyncHandler = this.systemApi.intervalEvent({
      eventPeriod: 'mid',
      handler,
      id: 'contactSubcribleContactCoreEvent',
      seq: 0,
    })!;
  }

  setColleagueContactSync() {
    if (this.enableEdmSync()) {
      this.systemApi.intervalEvent(this.contactColleagueSyncHandle);
      if (this.contactEdmHelper.getColleagueSyncTimes() === 0) {
        this.contactUtil.retry(this.colleagueContactInit.bind(this));
      } else {
        this.colleagueContactInit();
      }
      console.time('[contact_sync] app contact colleague sync first');
      this.syncContactColleague().then(() => {
        console.timeEnd('[contact_sync] app contact colleague sync first');
      });
    }
  }

  setCustomerContactSync() {
    if (this.enableEdmSync()) {
      // 客户通讯录 定时远程同步
      this.systemApi.intervalEvent(this.contactCustomerSyncHandle);
      if (this.contactEdmHelper.getContactEdmSyncTimes() === 0) {
        this.contactUtil.retry(this.customerContactInit.bind(this));
      } else {
        this.customerContactInit();
      }
      console.time('[contact_sync] app contact colleague sync first');
      this.syncContactCustomer().then(() => {
        console.timeEnd('[contact_sync] app contact colleague sync first');
      });
    }
  }

  async customerContactInit(tid?: number) {
    const inited = await this.getTableInited({
      tableName: this.contactEdmHelper.tableNames.contact,
      dbName: this.contactEdmHelper.dbName,
    });
    if (tid) {
      clearTimeout(tid);
    }
    if (inited) {
      this.contactEdmHelper.sendContactEdmNotify();
    } else {
      this.syncContactCustomer({ isInit: true }).then();
    }
  }

  async colleagueContactInit(tid?: number) {
    const inited = await this.getTableInited({
      tableName: this.contactEdmHelper.tableNames.colleagueContact,
      dbName: this.contactEdmHelper.customerDBName,
    });
    if (tid) {
      clearTimeout(tid);
    }
    if (inited) {
      this.contactEdmHelper.sendEdmColleagueNotify();
    } else {
      this.syncContactColleague().then();
    }
  }

  async getTableInited(table: DbRefer) {
    const count = await this.dbApi.getTableCount(table);
    return count > 0;
  }

  clearSyncAll() {
    this.systemApi.cancelEvent(this.contactSyncAllHandle.eventPeriod, 'contactSyncAll');
    if (process.env.BUILD_ISEDM) {
      this.systemApi.cancelEvent(this.contactCustomerSyncHandle.eventPeriod, 'contactCustomerSync');
      this.systemApi.cancelEvent(this.contactColleagueSyncHandle.eventPeriod, 'contactColleagueSync');
      this.contactEdmHelper.customerSyncTimes = 0;
      this.contactEdmHelper.colleagueSyncTimes = 0;
    }
    this.contactDB.contactSyncTimes = 0;
  }
}

export const ContactSyncInstance = new ContactSync();
