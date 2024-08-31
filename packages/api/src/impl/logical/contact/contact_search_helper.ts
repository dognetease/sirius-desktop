// DB搜索加速功能
import lodashGet from 'lodash/get';
import lodashChunk from 'lodash/chunk';
import lodashDebounce from 'lodash/debounce';
// import { ContactAndOrgApi } from '@/api/logical/contactAndOrg';
import { EntityContact, EntityOrg, resultObject, EntityContactItem } from '@/api/_base/api';
import { apis, inWindow, supportLocalIndexedDB, getShouldInitMemoryDBInMainPage } from '@/config';
import { IntervalEventParams } from '@/api/system/system';
import { api as masterApi } from '@/api/api';
import { AdQueryConfig, DbApiV2, DBList, DbRefer } from '@/api/data/new_db';
//  Array<column<columnPropDef>>
import { DataTrackerApi } from '@/api/data/dataTracker';
import { wait } from '@/api/util/index';

// import db_tables from '../../../api/data/db_tables';

/**
 * 转换格式定义
 * sourceList[index].primaryKey(唯一主键)定义说明:
 * 1.如果是string 表示source/target 定义一致
 * 2.如果是map 表示source-target的映射关系.filter可选 表示筛选函数
 * sourceList[index].column[index]定义说明:
 * 1.如果是string 表示source/target 定义一致
 * 2.如果是map 表示source-target的映射关系
 * 3.
 */

interface LokiRawColumnBaseConfig {
  source: string;
  target: string;
}

interface LokiRawColumnConfig extends LokiRawColumnBaseConfig {
  // 类型 insert表示要插入到已有字段中去.如果是cover表示是要直接覆盖
  opeartionType?: 'insert' | 'cover';
  // 数据类型 如果是single表示直接push到新表中去 如果是复合表示的是创建一个数组把当前数给包起来
  dataType?: 'single' | 'complex';
  filter?: (rawData: any) => boolean;
  switch?: (field: any) => any;
}

interface LokiSourceConfig {
  mapPath: string;
  dbName: string;
  tableName: string;
  column: (string | LokiRawColumnConfig)[];
  primaryKey: (string | LokiRawColumnBaseConfig)[];
  // 当前数据依赖于哪个表的数据 作为插入排序依据
  depends?: string[];
}

const SOURCEDB_FULL_PATH = {
  CONTACT_DEXIE_CONTACT: ['contact_dexie', 'contact'].join('.'),
  CONTACT_DEXIE_CONTACTITEM: ['contact_dexie', 'contactItem'].join('.'),
  CONTACT_DEXIE_ORG: ['contact_dexie', 'org'].join('.'),
};

const CONTACT_SEARCH = {
  dbName: 'contact_search' as DBList,
  tables: {
    contact: 'contact',
    org: 'org',
  },
};

const lokiRawDataMapConfig: LokiSourceConfig[] = [
  {
    mapPath: SOURCEDB_FULL_PATH.CONTACT_DEXIE_CONTACT,
    dbName: CONTACT_SEARCH.dbName,
    tableName: CONTACT_SEARCH.tables.contact,
    column: [
      'id',
      'contactName',
      'contactPYName',
      'contactPYLabelName',
      {
        source: 'accountName',
        target: 'accountName',
        switch: (field: string) => field.toLocaleLowerCase(),
      },
      {
        source: 'displayEmail',
        target: 'accountName',
        switch: (field: string) => field.toLocaleLowerCase(),
      },
      'remark',
      'avatar',
      'avatarPendant',
      'visibleCode',
      'enableIM',
      'type',
      'position',
      'enterpriseId',
    ],
    primaryKey: ['id'],
  },
  {
    mapPath: SOURCEDB_FULL_PATH.CONTACT_DEXIE_CONTACTITEM,
    dbName: CONTACT_SEARCH.dbName,
    tableName: CONTACT_SEARCH.tables.contact,
    column: [
      {
        target: 'id',
        source: 'contactId',
      },
      {
        target: 'accountName',
        source: 'contactItemVal',
        switch: (field: string) => field.toLocaleLowerCase(),
      },
      'isDefault',
    ],
    primaryKey: [
      {
        source: 'contactId',
        target: 'id',
      },
    ],
  },
  {
    dbName: CONTACT_SEARCH.dbName,
    tableName: CONTACT_SEARCH.tables.org,
    mapPath: SOURCEDB_FULL_PATH.CONTACT_DEXIE_ORG,
    column: ['id', 'orgName', 'orgPYName', 'type', 'orgRank', 'visibleCode', 'originId', 'enterpriseId', 'memberNum'],
    primaryKey: ['id'],
  },
];

export interface SearchDBHelperInterface {
  doCreateLokiData(): Promise<void>;

  reCreateLokiFromDB(options: { type: 'miss' | 'empty'; db?: number; loki?: number }): Promise<void>;

  watchDBPutOperation<T = resultObject>(table: DbRefer, items: T | T[]): Promise<void>;

  deleteRawData(query: AdQueryConfig, needTransform?: boolean): Promise<void>;

  testMemoryDataOk(dbRefer: AdQueryConfig): Promise<{
    type: 'miss' | 'empty' | 'ok';
    loki?: number;
    db?: number;
  }>;
}

class SearchDBHelper implements SearchDBHelperInterface {
  dataTrackerApi: DataTrackerApi;

  private dbApi: DbApiV2;

  private lokiApi: DbApiV2;

  private systemApi = masterApi.getSystemApi();

  private eventApi = masterApi.getEventApi();

  // key是原始tableName+目标tableName
  private lokiSourceConfigMap: Map<string, LokiSourceConfig> = new Map();

  private lokiSourceTables: Map<string, string> = new Map();

  // 存储个人通讯录信息。debounce读取contactItem信息补充个人用户多email信息
  private personalContactMap: Map<string, Map<string, resultObject>> = new Map();

  constructor() {
    this.dataTrackerApi = masterApi.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
    this.dbApi = masterApi.requireLogicalApi(apis.dexieDbApi) as DbApiV2;
    this.lokiApi = masterApi.requireLogicalApi(apis.dbMemoryApiImpl) as DbApiV2;

    lokiRawDataMapConfig.forEach(item => {
      const uniqueKey = `[${item.tableName}+${item.mapPath}]`;
      this.lokiSourceConfigMap.set(uniqueKey, item);
      this.lokiSourceTables.set(uniqueKey, item.mapPath);
    });

    this.debounceUpdatePersonalContact = lodashDebounce(this.debounceUpdatePersonalContact, 500) as unknown as (account: string) => Promise<void>;
  }

  private initStatus: 'init' | 'inited' = 'init';
  private initStatusMap: Map<string, 'init' | 'inited'> = new Map();

  private coreSyncEventId: number | undefined = undefined;

  private memoryContactWriteLock = false;

  private lastCreateTime = 0;

  // 每隔1小时检查一次(次要保障 主要还是依赖于用户触发重试)
  private detectIntervalHandler: IntervalEventParams = {
    eventPeriod: 'mid',
    handler: async ob => {
      if (ob.seq > 0 && ob.seq % 240 === 0) {
        console.log('[contact_healthdetect_helper]lokiDetectIntervalHandler');
        const options = await this.testMemoryDataOk({ dbName: 'contact_search', tableName: 'contact' });

        if (options.type === 'ok') {
          return;
        }

        // 尝试重建内存
        this.reCreateLokiFromDB({
          ...options,
          channel: 'interval',
        });
      }
    },
    seq: 0,
  };

  async doCreateLokiData() {
    if (!inWindow() || this.initStatus === 'inited') {
      return;
    }

    const shouldInitMemoryDBInMainPage = getShouldInitMemoryDBInMainPage();
    // 是否需要在主页初始化memory db
    if (!shouldInitMemoryDBInMainPage && !window.isBridgeWorker) {
      return;
    }
    // if (!window.isBridgeWorker) {
    //   return;
    // }
    const user = this.systemApi.getCurrentUser();
    if (!user) {
      return;
    }

    // 创建监测内存轮询。保证异常场景下，就算用户不触发搜索的情况下也可以重建内存
    this.systemApi.intervalEvent(this.detectIntervalHandler);

    this.coreSyncEventId && this.eventApi.unregisterSysEventObserver('changeCoreContactSyncStatus', this.coreSyncEventId);
    // 监听核心数据的事件通知(添加锁)
    this.coreSyncEventId = this.eventApi.registerSysEventObserver('changeCoreContactSyncStatus', {
      func: async e => {
        const coreSyncStatus = lodashGet(e, 'eventData.status', 'start');
        const coreSyncFrom = lodashGet(e, 'eventData.from', 'db');
        const account = e._account || this.systemApi.getCurrentUser()?.id;
        if (coreSyncStatus === 'start') {
          this.initStatus = 'init';
          this.memoryContactWriteLock = true;
          return;
        }

        // 如果核心接口刚做了服务端同步 先不要着急开始开始同步。等无效数据清空之后再做
        if (coreSyncStatus === 'finish' && coreSyncFrom === 'server') {
          return;
        }
        this.memoryContactWriteLock = false;
        // await wait(this.systemApi.isMainPage() ? 1000 : 3000);
        await wait(3000);
        this.createLxSearchDataFromDB({
          account,
          supportRebuild: true,
        });
      },
    });
  }

  async reCreateLokiFromDB(options: { type: string; db?: number; loki?: number; channel?: 'user' | 'interval' | 'retry' }) {
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';
    if (this.lxGenerateLockMap.has(mainAccount)) {
      return;
    }

    this.dataTrackerApi.track('pc_contact_searchrawdata_recreate', {
      ...options,
      channel: options.channel || 'user',
      enableTrackInBg: true,
      // 距离上次创建时间 换算成分钟
      distance: Math.floor((Date.now() - this.lastCreateTime) / (60 * 1000)),
    });

    const account = this.systemApi.getCurrentUser()?.id || '';

    this.initStatusMap.set(account, 'inited');
    this.createLxSearchDataFromDB({
      account,
    });
  }

  private lxGenerateLockMap: Set<string> = new Set();

  // 构建内存数据只有初始化的时候可以重试构建一次 其他场景下不支持重试
  private async createLxSearchDataFromDB(options: { account?: string; supportRebuild?: boolean }) {
    const { supportRebuild = false, account = this.systemApi.getCurrentUser()?.id || '' } = options;
    if (this.lxGenerateLockMap.has(account)) {
      return;
    }

    this.lxGenerateLockMap.add(account);

    // 只有主账号才需要去读群组&个人分组数据灌入到内存中
    const readOrgRawData = async (dbReferItem: DbRefer, isMainAccount: boolean) => {
      if (!isMainAccount) {
        return [];
      }
      const teamArr = await this.getTableRawdata({
        ...dbReferItem,
        adCondition: {
          field: 'type',
          type: 'anyOf',
          args: [2000, 2001],
        },
        count: 1,
      });
      if (!teamArr || !teamArr.length) {
        return [];
      }
      return this.getTableRawdata({
        ...dbReferItem,
        adCondition: {
          field: 'type',
          type: 'anyOf',
          args: [2000, 2001],
        },
      });
    };

    // 延迟请求 避免集中操作

    const isMainAccount = [this.systemApi.getCurrentUser()?.accountMd5, this.systemApi.getCurrentUser()?.id].includes(account);
    if (!isMainAccount) {
      await wait(3000);
    }

    try {
      const rawdataList = await Promise.all([
        this.getTableRawdata({
          dbName: 'contact_dexie',
          tableName: 'contact',
          _dbAccount: account,
        }),
        readOrgRawData(
          {
            dbName: 'contact_dexie',
            tableName: 'org',
            _dbAccount: account,
          },
          isMainAccount
        ),
      ]);
      this.generateLxSearchData(
        [
          {
            dbName: 'contact_dexie',
            tableName: 'contact',
            _dbAccount: account,
          },
          {
            dbName: 'contact_dexie',
            tableName: 'org',
            _dbAccount: account,
          },
        ],
        rawdataList
      );
    } catch (ex) {
      console.error('[loki]createFailed.lx.', account, ex);

      this.dataTrackerApi.track('pc_contact_createsearch_error', {
        enableTrackInBg: true,
        msg: lodashGet(ex, 'message', `${ex}`),
      });

      // 在这里打个点
    } finally {
      this.lxGenerateLockMap.delete(account);

      // 执行创建完成逻辑
      isMainAccount && this.compeleteWithTestAndRebuild(supportRebuild);
    }
  }

  private async compeleteWithTestAndRebuild(supportRebuild = false) {
    this.lastCreateTime = Date.now();
    // 延迟2000删除最终锁 避免被频繁创建
    await wait(2000);
    if (!supportRebuild) {
      return;
    }
    // 比较内存和DB数据长度 不一致情况下触发重建
    const status = await this.testMemoryStatusWithRetry();

    if (status === 'ok') {
      return;
    }
    this.reCreateLokiFromDB({
      type: status,
      channel: 'retry',
    });
  }

  /**
   * 多次重试监测内存状态(重试reason:核心接口调用接受之后创建内存DB可能会因为全量/增量接口有过多差异数据导致DB和内存差距打)
   * @param maxRetryTimes 重试次数
   * @returns
   */
  private async testMemoryStatusWithRetry(maxRetryTimes = 3): Promise<string> {
    if (this.lxGenerateLockMap.size !== 0) {
      return 'ok';
    }

    const { type } = await this.testMemoryDataOk({ dbName: 'contact_search', tableName: 'contact' });

    if (type === 'ok') {
      return 'ok';
    }
    if (maxRetryTimes > 0) {
      await wait(3000);
      return this.testMemoryStatusWithRetry(maxRetryTimes - 1);
    }
    return type;
  }

  // 如果loki数据长度不到DB数据的90%
  async testMemoryDataOk(dbRefer: AdQueryConfig): Promise<{
    type: 'miss' | 'empty' | 'ok';
    loki?: number;
    db?: number;
  }> {
    // 只有内存表的contact能触发检测逻辑
    if (dbRefer.dbName !== 'contact_search' || dbRefer.tableName !== 'contact') {
      return { type: 'ok' };
    }

    const [lokiCount = 0, dbCount = 0] = await Promise.all([
      this.lokiApi.getTableCount({
        dbName: 'contact_search',
        tableName: 'contact',
      }),
      this.dbApi.getTableCount({
        dbName: 'contact_dexie',
        tableName: 'contact',
      }),
    ]);

    if (dbCount === 0) {
      return { type: 'ok' };
    }

    if (lokiCount === 0) {
      return { type: 'empty' };
    }

    return lokiCount > 0.99 * dbCount ? { type: 'ok' } : { type: 'miss', loki: lokiCount, db: dbCount };
  }

  private canCreateSearchData(dbRefer: DbRefer) {
    // 支持在数据后台创建内存数据
    // 暂时注释调用创建内存数据功能 需要重新调试
    if (!inWindow()) {
      return false;
    }

    // 既不是shouldInitMemoryDBInMainPage(web场景下前台页面) && 也不是数据后台页面
    const shouldInitMemoryDBInMainPage = getShouldInitMemoryDBInMainPage();
    if (!shouldInitMemoryDBInMainPage && !window.isBridgeWorker) {
      return false;
    }

    // 如果前台页面在同步核心数据期间 内存通讯录禁止更新
    if (dbRefer.dbName === 'contact_dexie' && this.memoryContactWriteLock) {
      return false;
    }

    if (dbRefer.dbName === 'contact_dexie' && !['contact', 'org'].includes(dbRefer.tableName)) {
      return false;
    }

    return [...this.lokiSourceTables.values()].includes([dbRefer.dbName, dbRefer.tableName].join('.'));
  }

  private async getTableRawdata(dbQuery: AdQueryConfig): Promise<resultObject[]> {
    if (!supportLocalIndexedDB() || !['contact_dexie', 'contact_global'].includes(dbQuery.dbName)) {
      return Promise.resolve([]);
    }

    return this.dbApi.getByRangeCondition(dbQuery);
  }

  // 数据格式转换 将原始table中的数据格式转换成内存表的数据格式
  private convertRawFormat(_rawData: resultObject, column: (string | LokiRawColumnConfig)[]) {
    const rawData: resultObject = {};
    _rawData &&
      column.forEach(item => {
        const targetKey = typeof item === 'string' ? item : item.target;
        const sourceKey = typeof item === 'string' ? item : item.source;
        if (Reflect.has(_rawData, sourceKey)) {
          let targetVal = _rawData[sourceKey];
          if (typeof item !== 'string' && typeof item.switch === 'function') {
            targetVal = item.switch(targetVal);
          }
          Reflect.set(rawData, targetKey, targetVal);
        }
      });
    return rawData;
  }

  private async generateLxSearchData(dbReferList: DbRefer[], rawDataList: resultObject[][]) {
    // 开始构建搜索数据
    // const rawDataMap = zipObject(dbReferList.map(item => item.tableName), rawDataList);
    const _dbAccount = this.getAccount(lodashGet(dbReferList, '[0]._dbAccount', undefined));
    const [contactList, OrgList] = rawDataList as [EntityContact[], EntityOrg[]];

    const personalContactModelMap: Map<string, resultObject> = new Map();

    try {
      Promise.all([
        this.lokiApi.clear({
          dbName: CONTACT_SEARCH.dbName,
          tableName: CONTACT_SEARCH.tables.contact,
          _dbAccount,
        }),
        this.lokiApi.clear({
          dbName: CONTACT_SEARCH.dbName,
          tableName: CONTACT_SEARCH.tables.org,
          _dbAccount,
        }),
      ]);
    } catch (ex) {
      console.error('[contact_search_help]generateLxSearchData.error(1):', ex);
    }

    // 构建contact对应的内存数据
    try {
      await this.generateChunk<EntityContact>(
        contactList,
        async (list: EntityContact[]) => {
          // 执行数据转换
          const contactConfigKey = `[${CONTACT_SEARCH.tables.contact}+${SOURCEDB_FULL_PATH.CONTACT_DEXIE_CONTACT}]`;

          const contactColumn = this.lokiSourceConfigMap.get(contactConfigKey)!.column;

          const convertedList = list.map(item => {
            const searchContact = this.convertRawFormat(item, contactColumn);
            if (item.type === 'personal') {
              personalContactModelMap.set(item.id, searchContact);
            }
            return searchContact;
          });

          return this.bulkPutContactSearch(
            {
              dbName: CONTACT_SEARCH.dbName,
              tableName: CONTACT_SEARCH.tables.contact,
              _dbAccount,
            },
            convertedList,
            {
              coverType: 'ignore',
            }
          );
        },
        { tableName: CONTACT_SEARCH.tables.contact }
      );
    } catch (ex) {
      console.error('[loki]createDataFromDB.failed(contact)', ex);
    }

    // 构建org数据
    try {
      await this.generateChunk<EntityOrg>(
        OrgList,
        async list => {
          const orgConfigKey = `[${CONTACT_SEARCH.tables.org}+${SOURCEDB_FULL_PATH.CONTACT_DEXIE_ORG}]`;
          const orgColumn = this.lokiSourceConfigMap.get(orgConfigKey)!.column;

          const convertedList = list.map(orgItem => this.convertRawFormat(orgItem, orgColumn));
          return this.bulkPutContactSearch(
            {
              dbName: CONTACT_SEARCH.dbName,
              tableName: CONTACT_SEARCH.tables.org,
              _dbAccount,
            },
            convertedList,
            {
              coverType: 'ignore',
            }
          );
        },
        { tableName: CONTACT_SEARCH.tables.org }
      );
    } catch (ex) {
      console.error('[loki]createDataFromDB.failed(org)', ex);
    }

    // 更新个人通讯录中的多email场景
    this.updatePersonalEmailsByContactMap(_dbAccount, personalContactModelMap);
  }

  // 解决个人通讯录中的多email场景下没法搜索问题
  private async updatePersonalEmailsByContactMap(_dbAccount: string, contactMap: Map<string, resultObject>) {
    if (!contactMap || !contactMap.size) {
      return;
    }
    const contactIds = [...contactMap.keys()];

    try {
      const contactItemList = await this.dbApi.getByRangeCondition<EntityContactItem>({
        dbName: 'contact_dexie',
        tableName: 'contactItem',
        _dbAccount,
        adCondition: {
          type: 'anyOf',
          field: 'contactId',
          args: contactIds,
        },
      });
      if (!Array.isArray(contactItemList) || !contactItemList.length) {
        return;
      }
      await this.generateChunk<EntityContactItem>(
        contactItemList,
        async list => {
          const contactItemConfigKey = `[${CONTACT_SEARCH.tables.contact}+${SOURCEDB_FULL_PATH.CONTACT_DEXIE_CONTACTITEM}]`;
          const contactColumn = this.lokiSourceConfigMap.get(contactItemConfigKey)!.column;
          const convertedList = list
            .filter(item => {
              if (item.contactItemType !== 'EMAIL') {
                return false;
              }
              // 读取对应的contact表中的email信息 如果一致不更新
              const contactId = contactMap.get(item.contactId)!.id;
              return item.contactId === contactId;
            })
            .map(item => {
              const _oldInfo = contactMap.get(item.contactId);
              const increaseInfo = this.convertRawFormat(item, contactColumn);
              return {
                ..._oldInfo,
                ...increaseInfo,
                isDefault: _oldInfo?.accountName === increaseInfo.accountName ? 1 : 0,
              };
            });
          return this.bulkPutContactSearch(
            {
              dbName: CONTACT_SEARCH.dbName,
              tableName: CONTACT_SEARCH.tables.contact,
              _dbAccount,
            },
            convertedList,
            {
              coverType: 'cover',
            }
          );
        },
        { tableName: CONTACT_SEARCH.tables.contact }
      );
    } catch (ex) {
      console.error('[loki]createDataFromDB.failed(org)', ex);
    }
  }

  private async generateChunk<T = resultObject>(
    data: T[],
    createFunc: (list: T[]) => Promise<void>,
    options: {
      tableName?: string;
      limit?: number;
      interval?: number;
    }
  ) {
    const { limit = 5000, interval = 200, tableName } = options;
    return lodashChunk(data, limit).reduce(async (total, current, currentIndex) => {
      if (currentIndex > 0) {
        await wait(interval);
      }

      total = createFunc(current).catch(ex => {
        console.error(`[loki]createDataFromDB.chunk.failed(${tableName})`, ex);
      });
      return total;
    }, Promise.resolve());
  }

  /**
   * @description:将数据插入到Loki缓存中 options.coverType='merge'不适合大数据量场景
   * @param dbRefer: DbRefer
   * @param data:数据列表
   * @param options
   * @param options.coverType cover:直接覆盖源数据 clean:清空所有老数据 merge:和老数据执行合并
   * @returns
   */
  private async bulkPutContactSearch<T = resultObject>(dbRefer: DbRefer, data: T[], options: { coverType?: 'cover' | 'clean' | 'merge' | 'ignore'; uniqueKey?: string }) {
    if (!Array.isArray(data) || !data.length) {
      return;
    }
    const { coverType = 'cover', uniqueKey = 'id' } = options;

    let newData: T[] = data;
    if (coverType === 'clean') {
      await this.lokiApi.clear(dbRefer);
    } else if (coverType === 'cover') {
      const ids = data.map(item => lodashGet(item, uniqueKey, ''));
      await this.lokiApi.deleteByByRangeCondition({
        ...dbRefer,
        adCondition: {
          type: 'anyOf',
          field: uniqueKey,
          args: ids,
        },
      });
    } else if (coverType === 'merge') {
      const ids = data.map(item => lodashGet(item, uniqueKey, ''));
      const historyRawlist = await this.lokiApi.getByRangeCondition({
        ...dbRefer,
        adCondition: {
          type: 'anyOf',
          field: uniqueKey,
          args: ids,
        },
      });

      const historyRawMap = new Map(historyRawlist.map(item => [item[uniqueKey], item]));

      newData = data.map(item => {
        const key = (item as Record<string, unknown>)[uniqueKey] || 'unknown';
        if (!historyRawMap.has(key)) {
          return item;
        }
        return {
          ...historyRawMap.get(key),
          ...item,
        };
      });
    }

    this.lokiApi.putAll(dbRefer, newData);
  }

  private getAccount(_dbAccount: string | undefined) {
    if (!_dbAccount || !_dbAccount.length) {
      return lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '');
    }
    if (_dbAccount!.indexOf('@') !== -1) {
      return this.systemApi.md5(_dbAccount, true);
    }
    return _dbAccount;
  }

  // 监听DB的写入操作
  async watchDBPutOperation(dbRefer: DbRefer, _items: resultObject | resultObject[]) {
    if (!this.canCreateSearchData(dbRefer)) {
      return;
    }
    // 避免影响主业务流程
    await wait(100);

    this.bulkCacheContactDexie(dbRefer, _items);
  }

  // 企业通讯录不适配这个业务逻辑(最好能单独插入)
  private async bulkCacheContactDexie(dbRefer: DbRefer, _items: unknown | unknown[]) {
    const { _dbAccount = lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '') } = dbRefer;

    const contactModelList: resultObject[] = [];

    if (dbRefer.tableName === 'org') {
      const list = Array.isArray(_items) ? _items : [_items];
      const firstId: string = lodashGet(list, '[0].id', '');
      // 只写入群组数据
      const flag = typeof firstId === 'string' && (firstId.startsWith('team') || firstId.startsWith('personal_org'));
      if (!flag) {
        return;
      }
    }

    switch (dbRefer.tableName) {
      // 通讯录
      case 'contact': {
        if (!this.personalContactMap.has(_dbAccount)) {
          this.personalContactMap.set(_dbAccount, new Map());
        }
        const items: EntityContact[] = Array.isArray(_items) ? _items : [_items];
        const contactConfigKey = `[${CONTACT_SEARCH.tables.contact}+${SOURCEDB_FULL_PATH.CONTACT_DEXIE_CONTACT}]`;
        const contactColumn = this.lokiSourceConfigMap.get(contactConfigKey)!.column;
        items.forEach(item => {
          const convertItem = this.convertRawFormat(item, contactColumn);
          if (item.type === 'personal') {
            this.personalContactMap.get(_dbAccount)!.set(item.id, convertItem);
          }
          contactModelList.push(convertItem);
        });

        break;
      }

      case 'org': {
        const items: EntityOrg[] = Array.isArray(_items) ? _items : [_items];
        const orgConfigKey = `[${CONTACT_SEARCH.tables.org}+${SOURCEDB_FULL_PATH.CONTACT_DEXIE_ORG}]`;
        const orgColumn = this.lokiSourceConfigMap.get(orgConfigKey)!.column;
        items.forEach(item => {
          contactModelList.push(this.convertRawFormat(item, orgColumn));
        });
        break;
      }
      default:
        break;
    }

    await wait(200);

    this.generateChunk(
      contactModelList,
      list =>
        this.bulkPutContactSearch(
          {
            dbName: CONTACT_SEARCH.dbName,
            tableName: dbRefer.tableName,
            _dbAccount,
          },
          list,
          {
            coverType: 'cover',
            uniqueKey: 'id',
          }
        ),
      {
        tableName: dbRefer.tableName,
      }
    );

    this.debounceUpdatePersonalContact(_dbAccount);
  }

  // debounce更新个人通讯录信息
  private async debounceUpdatePersonalContact(_dbAccount: string) {
    if (!this.personalContactMap.has(_dbAccount)) {
      return;
    }

    await this.updatePersonalEmailsByContactMap(_dbAccount, this.personalContactMap.get(_dbAccount)!);
    this.personalContactMap.get(_dbAccount)?.clear();
    this.personalContactMap.delete(_dbAccount);
  }

  async deleteRawData(query: AdQueryConfig, needTransform = true) {
    if (!this.canCreateSearchData(query)) {
      return;
    }

    // 如果没有配置field
    if (lodashGet(query, 'adCondition.field.length', 0) === 0) {
      return;
    }

    // 如果是contact_dexie & org 非群组数据不可以写入
    if (query.dbName === 'contact_dexie' && query.tableName === 'org') {
      const flag: string = lodashGet(query, 'adCondition.args[0]', '');
      if (typeof flag !== 'string' || (!flag.startsWith('team') && !flag.startsWith('personal_org'))) {
        return;
      }
    }

    const _field = query.adCondition!.field!;
    const newQuery = { ...query };
    // 这个要做索引转换吗？
    // 利用column做转换吧
    const configList = [...this.lokiSourceConfigMap.values()];

    configList.forEach(sourceConfig => {
      if (sourceConfig.mapPath !== [query.dbName, query.tableName].join('.')) {
        return;
      }

      const transferMap: Record<string, string> = {};
      sourceConfig.column.forEach(item => {
        if (typeof item === 'string') {
          transferMap[item] = item;
        } else {
          transferMap[item.source] = item.target;
        }
      });
      // 不需要配置转换的话直接把对应的ID
      if (!needTransform) {
        console.log('[contact_search_helper]', needTransform);
      } else if (Array.isArray(_field)) {
        newQuery.adCondition!.field = _field.map(fiedItem => transferMap[fiedItem]);
      } else {
        newQuery.adCondition!.field = transferMap[_field];
      }
      newQuery.tableName = sourceConfig.tableName;
      newQuery.dbName = sourceConfig.dbName as DBList;

      this.lokiApi.deleteByByRangeCondition(newQuery);
    });
  }
}

export const searchDbHelper = new SearchDBHelper();
