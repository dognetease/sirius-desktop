/* eslint-disable class-methods-use-this */
import Dexie, { Collection, WhereClause } from 'dexie';
import lodashGet from 'lodash/get';
import lodashChunk from 'lodash/chunk';
import {
  AdQueryConfig,
  DbApiV2,
  DBList,
  DbRefer,
  QueryConfig,
  QueryFilterFunc,
  QueryFilterRegistry,
  SchemaDef,
  SchemaRunningStatus,
  tableConfig,
  tableIndex,
  PutAllOptions,
} from '@/api/data/new_db';
import { StringMap, StringTypedMap } from '@/api/commonModel';
import db_tables from '@/api/data/db_tables';
import { lf } from '@/api/data/lovefield';
import { resultObject, stringOrNumber, User } from '@/api/_base/api';
import { apis } from '@/config';
import { api } from '@/api/api';
import { SystemApi } from '@/api/system/system';
import { DataStoreApi, StoredLock } from '@/api/data/store';
import { getCommonCompareFunc, util } from '@/api/util';
import { AbstractDBInterfaceImpl } from './db_abs';
import { AccountApi } from '@/api/logical/account';

class ActionStore {
  user?: User;

  lock?: StoredLock;

  readonly openedSchemas: StringTypedMap<SchemaController>;
  // readonly openedSchemasByAccount: StringTypedMap<StringTypedMap<SchemaController>>;

  readonly filterRegistry: Map<string, QueryFilterRegistry>;

  constructor() {
    this.user = undefined;
    this.lock = undefined;

    this.openedSchemas = {};
    this.filterRegistry = new Map<string, QueryFilterRegistry>();
  }
}

interface SchemaController extends SchemaRunningStatus {
  // tbs: Set<string>;
  instance: Dexie;
  dbTableController: StringTypedMap<Dexie.Table>;
}

type AccountActionKey = string | 'global';

class DexieDbApiImpl extends AbstractDBInterfaceImpl implements DbApiV2 {
  action: ActionStore;

  // 支持多账号下的DB操作 比action多了一个层级
  accountAction: Map<AccountActionKey, ActionStore> = new Map();

  name: string;

  readonly schemas: StringTypedMap<SchemaDef>;

  readonly LOCK_KEY_FOR_DB = 'dbWrLock';

  systemApi: SystemApi;

  accountApi: AccountApi;

  storeApi: DataStoreApi;

  constructor() {
    super();
    this.schemas = {};
    /* for (const idx in db_tables) */
    Object.keys(db_tables).forEach(idx => {
      const id = idx as DBList;
      if (db_tables[id]) {
        const item = db_tables[id] as SchemaDef;
        this.schemas[id] = item;
      }
    });
    this.name = apis.dexieDbApi;
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;

    const currentUser = this.systemApi?.getCurrentUser()?.accountMd5 || '';
    if (currentUser) {
      this.accountAction.set(currentUser, new ActionStore());
    }

    this.accountAction.set('global', new ActionStore());

    this.action = new ActionStore();
  }

  close(): void {
    /* for (const name in this.action.openedSchemas) */

    [...this.accountAction.keys()].forEach(account => {
      Object.keys(this.accountAction.get(account)!).forEach(name => {
        this.closeSpecific(name as DBList, account);
      });
    });

    [...this.accountAction.values()].forEach(action => {
      action.lock?.destroyLock();
    });
    // this.action.lock?.destroyLock();
  }

  closeSpecific(db: DBList, _account = ''): void {
    // 获取对齐后的_account名称
    let account = this.accountApi.getEmailIdByEmail(_account);
    if (this.schemas[db]?.global) {
      account = 'global';
    } else if (!account || !account.length) {
      account = lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '');
    }

    if (typeof account === 'string' && account.includes('@')) {
      account = this.systemApi.md5(account, true);
    }

    if (!this.accountAction.has(account)) {
      return;
    }

    const action = this.accountAction.get(account)!;

    if (Object.prototype.hasOwnProperty.apply(action.openedSchemas, [db]) && action.openedSchemas[db]) {
      try {
        const dbIns = action.openedSchemas[db];
        if (dbIns.instance.isOpen()) dbIns.instance.close();
      } catch (e) {
        console.warn(e);
      }
      delete action.openedSchemas[db];
      this.accountAction.set(account, action);
    }
  }

  init(): string {
    const currentUser = this.systemApi?.getCurrentUser()?.accountMd5 || '';
    if (currentUser) {
      this.accountAction.set(currentUser, new ActionStore());
    }
    // this.initInterfaceAndProxy();
    return this.name;
  }

  async deleteDB(dbName: DBList, _account?: string) {
    try {
      await Dexie.delete(dbName);
      this.closeSpecific(dbName as DBList, _account);
      return {
        success: true,
      };
    } catch (ex) {
      console.error('deleteDB-Error', ex);
      return {
        success: false,
      };
    }
  }

  initDb(name: DBList, _account = ''): SchemaRunningStatus {
    if (!(name in this.schemas)) {
      throw new Error('db not defined');
    }
    let account = _account;

    if (this.schemas[name]?.global) {
      account = 'global';
    } else if (!_account || !_account.length) {
      account = lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '');
    }

    if (typeof account === 'string' && account.includes('@')) {
      const tempAccount = this.accountApi.getEmailIdByEmail(_account);
      if (tempAccount) {
        account = this.systemApi.md5(account, true);
      }
    }

    if (!this.accountAction.has(account)) {
      this.accountAction.set(account, new ActionStore());
    }

    const action = this.accountAction.get(account)!;

    if (name in action.openedSchemas) {
      return action.openedSchemas[name];
    }
    action.openedSchemas[name] = this.createSchema(this.schemas[name], account);
    return action.openedSchemas[name];
  }

  createSchema(it: SchemaDef, _accountMd5 = ''): SchemaController {
    let accountMd5 = _accountMd5;
    // const currentUser = this.systemApi.getCurrentUser();
    if (!(accountMd5 && accountMd5.length) && !it.global) {
      throw new Error('not login');
    }
    // 如果传入的accountMd5 不是md5格式，则先对齐再转换
    if (typeof accountMd5 === 'string' && accountMd5.includes('@')) {
      const standardAccount = this.accountApi.getEmailIdByEmail(_accountMd5);
      accountMd5 = this.systemApi.md5(standardAccount, true);
    }

    const dbName = it.global ? it.name : it.name + '_' + (accountMd5 || new Date().getTime());
    const db = new Dexie(dbName, { chromeTransactionDurability: 'relaxed' });

    if (it.versionchange && typeof it.versionchange === 'function') {
      db.on('versionchange', it.versionchange);
    }

    const schema = db.version(it.version);
    console.log('[db] add ', schema);
    const tbs: StringMap = {};
    /* for (const tb of it.tables) */
    it.tables.forEach(tb => {
      // schema.stores()
      console.log('[db] create table:', tb);
      tbs[tb.name] = this.buildTableDefStr(tb);
      it.tableIndex = it.tableIndex || {};
      it.tableIndex[tb.name] = tb;
    });
    const version = schema.stores(tbs);

    if (it.upgrade) {
      version.upgrade(it.upgrade);
    }
    const dbTables: StringTypedMap<Dexie.Table> = {};
    /* for (const table of db.tables) */
    db.tables.forEach(table => {
      if (it.tableIndex && it.tableIndex[table.name]) {
        const tbDef = it.tableIndex[table.name];
        tbDef.model && table.mapToClass(tbDef.model);
      }
      dbTables[table.name] = table;
    });
    // const schema = this.schemas[name];
    // const table = this.createSchema(schema);
    const ret = {
      ...it,
      instance: db,
      dbTableController: dbTables,
    } as SchemaController;
    console.log('[db] all tables:', db.tables);
    return ret;
  }

  private buildTableDefStr(tb: tableConfig) {
    let ret = '';
    const prColumn: string[] = tb.primaryKey.columns.map((it: string | lf.schema.IndexedColumn) => {
      let r = '';
      if (typeof it === 'string') {
        r = it;
      } else {
        const item: lf.schema.IndexedColumn = it as lf.schema.IndexedColumn;
        r = item.autoIncrement ? '++' + item.name : item.name;
      }
      return r;
    });
    ret += prColumn.join(',');
    if (tb.index && tb.index.length > 0) {
      const indexColumn: string[] = tb.index.map((it: tableIndex) => {
        if (!it || !it.columns || it.columns.length === 0) {
          return '';
        }
        let ret = '';
        if (it.columns.length === 1) {
          const indexStr = it.multi ? '*' + it.columns[0] : it.columns[0];
          ret = it.unique ? '&' + it.columns[0] : indexStr;
        } else {
          ret = '[' + it.columns.join('+') + ']';
        }
        return ret;
      });
      ret += ',' + indexColumn.join(',');
    }
    return ret;
  }

  afterInit(): string {
    const user = this.systemApi.getCurrentUser();
    const userMd5 = user?.accountMd5 || '';
    this.action.user = user;
    this.action.lock = this.storeApi.getLock(this.LOCK_KEY_FOR_DB);
    if (!this.accountAction.has(userMd5) && userMd5.length > 0) {
      this.accountAction.set(userMd5, new ActionStore());
    }
    return this.name;
  }

  afterLogin(): string {
    const user = this.systemApi.getCurrentUser();
    const userMd5 = user?.accountMd5 || '';
    this.action.user = user;
    this.action.lock = this.storeApi.getLock(this.LOCK_KEY_FOR_DB);
    if (!this.accountAction.has(userMd5) && userMd5.length > 0) {
      this.accountAction.set(userMd5, new ActionStore());
    }
    return this.name;
  }

  beforeLogout(): string {
    this.close();
    this.action = new ActionStore();

    [...this.accountAction.keys()].forEach(account => {
      this.accountAction.set(account, new ActionStore());
    });
    return this.name;
  }

  useCache(config: DbRefer): boolean {
    const { dbName } = config;
    return !!db_tables[dbName]?.cache;
  }

  private async innerGetByRangeCondition<T = resultObject>(query: AdQueryConfig, _account?: string): Promise<T[] | { totalCount: number; data: T[] }> {
    const dbTable = this.testDbTableNotExist(query, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    let ret: Collection | undefined;
    let transFilter;
    if (query.adCondition) {
      if (query.adCondition.args && query.adCondition.field) {
        const where: WhereClause = dbTable.where(query.adCondition.field);
        let type = query.adCondition.type as keyof WhereClause;
        const { args, field } = query.adCondition;
        const fieldCount = Array.isArray(field) ? field.length : 1;
        if (type === 'anyOf' && fieldCount === 1 && args.length === 1 && Array.isArray(args[0]) && args[0].length > 10000) {
          transFilter = {
            key: field,
            value: args[0],
          };
        } else {
          if (type === 'anyOf' && fieldCount > 1 && args.length === 1) {
            type = 'equals';
          }
          const whereElement = where[type];
          if (whereElement && typeof whereElement === 'function') {
            ret = (whereElement as (...arg: any) => Collection).apply(where, query.adCondition.args);
          }
        }
      }
    }
    if (!ret) {
      ret = dbTable.toCollection();
    }

    let totalCount: number | null = null;
    if (query && query.returnTotal) {
      totalCount = await this.getCollectionCount(ret);
    }

    const res = await this.handleQueryCollection(query, ret, _account);
    if (transFilter) {
      const valSet = new Set(transFilter.value);
      const key = Array.isArray(transFilter.key) ? transFilter.key[0] : transFilter.key;
      return res.filter(item => valSet.has(item[key]));
    }
    if (totalCount) {
      return {
        totalCount,
        data: res,
      };
    }
    return res;
  }

  async getByRangeCondition<T = resultObject>(query: AdQueryConfig, _account?: string): Promise<T[]> {
    return this.innerGetByRangeCondition(query, _account) as Promise<T[]>;
  }

  getByRangeConditionWithTotalCount<T = resultObject>(query: AdQueryConfig, _account?: string): Promise<{ totalCount: number; data: T[] }> {
    query.returnTotal = true;
    return this.innerGetByRangeCondition(query, _account) as Promise<{ totalCount: number; data: T[] }>;
  }

  private async getCollectionCount(coll: Collection): Promise<number | null> {
    try {
      if (coll) {
        const collCopied = coll.clone();
        return await collCopied.count();
      }
      return null;
    } catch (ex) {
      console.error('getCollectionCount error', ex);
      return null;
    }
  }

  private runRangeQuery(query: AdQueryConfig, dbTable: Dexie.Table<any, any>) {
    let ret: Collection | undefined;
    if (query.adCondition) {
      if (query.adCondition.args && query.adCondition.field) {
        const where: WhereClause = dbTable.where(query.adCondition.field);
        const whereElement = where[query.adCondition.type as keyof WhereClause];
        if (whereElement && typeof whereElement === 'function') {
          ret = (whereElement as (...arg: any) => Collection).apply(where, query.adCondition.args);
        }
      }
    }
    return ret;
  }

  private async innerGetByEqCondition<T = resultObject>(query: QueryConfig, _account?: string): Promise<resultObject[] | { totalCount: number; data: T[] }> {
    const dbTable = this.testDbTableNotExist(query, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    // const queryCondition = query.query;
    let ret: Collection | undefined;
    if (query.order && query.orderUsingIndex) {
      ret = dbTable.orderBy(query.order);
    } else if (query.query) {
      ret = dbTable.where(query.query);
    } else {
      ret = dbTable.toCollection();
    }
    let totalCount: number | null = null;
    if (query && query.returnTotal) {
      totalCount = await this.getCollectionCount(ret);
    }
    const res = await this.handleQueryCollection(query, ret, _account);
    if (totalCount) {
      return {
        totalCount,
        data: res,
      };
    }
    return res;
  }

  async getByEqConditionWithTotal?<T = resultObject>(query: QueryConfig, _account?: string): Promise<{ totalCount: number; data: T[] }> {
    query.returnTotal = true;
    return this.innerGetByEqCondition(query, _account) as Promise<{ totalCount: number; data: T[] }>;
  }

  async getByEqCondition(query: QueryConfig, _account?: string): Promise<resultObject[]> {
    const res = (await this.innerGetByEqCondition(query, _account)) as resultObject[];
    return res;
  }

  async deleteByByRangeCondition(query: AdQueryConfig, _account?: string): Promise<number> {
    const dbTable = this.testDbTableNotExist(query, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    const ret = this.runRangeQuery(query, dbTable);
    if (!ret) {
      return Promise.reject(new Error('请检查查询条件，无法创建查询'));
    }
    return ret.delete();
  }

  addFilterRegistry(registry: QueryFilterRegistry) {
    // 暂时吧所有的判定条件存储到global这个账户上
    const action = this.accountAction.get('global')!;
    action.filterRegistry.set(registry.name, registry);
  }

  private async handleQueryCollection(query: QueryConfig, ret: Collection, _account?: string): Promise<any[]> {
    const action = this.accountAction.get('global')!;
    const { useDexieFilter = true, filterLimit, additionalData, desc = true } = query;
    const count = query.count || (filterLimit ? 10000 : query.count);
    // eslint-disable-next-line no-nested-ternary
    const configFilters = Array.isArray(query.filter) ? query.filter : query.filter ? [query.filter] : undefined;
    const filters: QueryFilterFunc[] = [];
    if (configFilters && configFilters.length > 0) {
      configFilters.forEach(it => {
        if (action.filterRegistry.has(it)) {
          const queryFilterRegistry = action.filterRegistry.get(it);
          if (queryFilterRegistry && queryFilterRegistry.filterFunc) filters.push(queryFilterRegistry.filterFunc);
        }
      });
      if (useDexieFilter && filters.length > 0) {
        filters.forEach(it => {
          ret = ret.filter(x => it(x, query));
        });
      }
    }
    if (query.start && query.start > 0) {
      ret.offset(query.start);
    }
    if (count && count > 0) {
      ret.limit(count);
    }
    // 目前查询db默认值为desc，添加排序后需要重制这个值状态
    if (!desc) {
      ret.reverse();
    }
    if (query.order && !query.orderUsingIndex) {
      return ret.toArray().then(res => {
        const key = query.order!;
        return res.sort(getCommonCompareFunc(key));
      });
    }
    const res = await ret.toArray();

    if (!useDexieFilter && filters.length > 0) {
      const resData: any[] = additionalData?.lastData || [];
      try {
        res.forEach(x => {
          const flag = filters.every(it => it(x, query));
          if (flag) {
            resData.push(x);
          }

          if (filterLimit && resData.length >= filterLimit) {
            console.warn('[db] filterLimit break');
            throw new Error();
          }
        });
      } catch (e) {
        return resData;
      }
      if (filterLimit && res.length === count && resData.length < filterLimit) {
        console.warn('[db] filterLimit loop', resData.length);
        const newQuery = { ...query } as AdQueryConfig;
        const field = (newQuery.adCondition?.field || 'id') as string;
        newQuery.adCondition = {
          type: 'above',
          args: [res[res.length - 1][field]],
          field,
        };
        newQuery.additionalData = { ...(newQuery.additionalData || {}), lastData: resData };
        return this.getByRangeCondition(newQuery, _account) as Promise<any[]>;
      }
      return resData;
    }
    return res;
  }

  getTableCount(db: DbRefer, _account?: string): Promise<number> {
    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    return dbTable.count();
  }

  getById(db: DbRefer, id: string | number, _account?: string): Promise<resultObject> {
    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    return dbTable.get(id);
  }

  async getByIds<T = resultObject>(db: DbRefer, ids: string[] | number[], _account?: string): Promise<T[]> {
    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    const res = await dbTable.bulkGet(ids);
    return res;
  }

  async getByIndexIds<T = resultObject>(db: DbRefer, keyPath: string, ids: string[] | number[], _account?: string): Promise<T[]> {
    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    const res = await dbTable.where(keyPath).anyOf(ids).toArray();

    return res;
  }

  async deleteById(db: DbRefer, id: stringOrNumber | stringOrNumber[], _account?: string): Promise<void> {
    console.log('[db] ==== delete from db for data of db:', db);
    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    // const dbTable = this.openedSchemas[db.dbName].dbTableController[db.tableName];

    try {
      // await this.action.lock?.lock();
      const idList = util.singleToList(id);
      return lodashChunk(idList, 2000).reduce((total, curIds, curIndex) => {
        total = total
          .then(async () => {
            if (curIndex !== 0) {
              await this.dbWait(200);
            }
            return dbTable.bulkDelete(curIds);
          })
          .catch(ex => {
            console.error('[daxie_db_impl]deleteById1.error', ex);
          });

        return total;
      }, Promise.resolve());
    } catch (ex) {
      // console.warn('[db] delete error:', db, ex);
      this.handleDexieCommonError(db, ex);
      return Promise.reject(ex);
    } finally {
      // this.action.lock?.unlock();
      console.log('finally db');
    }
  }

  async put<T = resultObject>(db: DbRefer, items: T, _account?: string): Promise<T> {
    console.log('[db] ==== insert into db for data of db:' + db.dbName + '.' + db.tableName, items);
    if (!items) {
      return items;
    }
    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    // const dbTable = this.openedSchemas[db.dbName].dbTableController[db.tableName];
    items = this.dbCloneItem<T>(items);
    try {
      // await this.action.lock?.lock();
      const res = await dbTable.put(items);
      if (res) {
        Object.defineProperty(items, '__prKey__', {
          value: res,
          writable: false,
        });
      }
      return items;
    } catch (ex) {
      // console.warn('[db] put data error ', db, ex);
      this.handleDexieCommonError(db, ex);
      return Promise.reject(ex);
    } finally {
      // this.action.lock?.unlock();
      console.log('finally db');
    }
  }

  // 一次性写入OR分批次写入都调用这里
  async bulkPut<T = resultObject>(db: DbRefer, items: T[], _account?: string): Promise<T[]> {
    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    items = this.dbClone(items) as T[];

    if (db.dbName !== 'contact_dexie') {
      const keys: string[] = await dbTable.bulkPut(items, undefined, { allKeys: true });
      keys.forEach((val, idx) => {
        Object.defineProperty(items[idx], '__prKey__', {
          value: val,
          writable: false,
        });
      });
      return items;
    }
    const keys: string[] = await dbTable.bulkPut(items, undefined, { allKeys: true }).catch(Dexie.BulkError, e => {
      console.error(`[dexie]${items.length - e.failures.length}条数据写入成功.error:`, e);
    });
    keys.forEach((val, idx) => {
      Object.defineProperty(items[idx], '__prKey__', {
        value: val,
        writable: false,
      });
    });
    return items;
  }

  async putAll<T = resultObject>(db: DbRefer, items: T[], _options?: PutAllOptions, _account?: string): Promise<T[]> {
    console.log('[daxie_db_impl]putAll', db, items.length);
    if (!items || items.length === 0) {
      return items;
    }
    const pageSize = lodashGet(_options, 'pageSize', 1000);
    try {
      // await this.action.lock?.lock();
      const ret: T[] = await (items.length > pageSize ? this.putLargeDataSetToDb(db, items, _options, _account) : this.bulkPut(db, items, _account));
      // return promiseExtended.then(() => {
      console.log('[db] put all finished ', db, ret);
      return ret;
      // });
    } catch (ex) {
      this.handleDexieCommonError(db, ex);
      return Promise.reject(ex);
    } finally {
      // this.action.lock?.unlock();
      console.log('finally db');
    }
  }

  private async putLargeDataSetToDb<T = resultObject>(db: DbRefer, items: T[], _options?: PutAllOptions, _account?: string): Promise<T[]> {
    const pageSize = lodashGet(_options, 'pageSize', 1000);
    const intervalTime = lodashGet(_options, 'intervalTime', 1500);

    const itemParams = lodashChunk(items, pageSize);

    const result: T[] = [];

    let requestPromise = Promise.resolve();

    itemParams.forEach((chunkItems, chunkIndex) => {
      requestPromise = requestPromise
        .then(async () => {
          // 第一次不需要等待
          if (chunkIndex !== 0) {
            await this.dbWait(intervalTime);
          }
          await this.bulkPut(db, chunkItems, _account);
          result.push(...chunkItems);
        })
        .catch(e => {
          console.warn('[db] batch put item error : ', e);
          throw e;
        });
    });
    await requestPromise;
    return result;
  }

  private testDbTableNotExist(db: DbRefer, _account?: string): Dexie.Table | undefined {
    // todo-zpy: 有爆炸性问题 @超哥
    const { _dbAccount, _account: gc_account } = db;
    // 获取对齐后的_account名称
    const standardAccount = this.accountApi.getEmailIdByEmail(_account || '');
    // 兼容_account逻辑
    let account = standardAccount || (typeof _dbAccount === 'string' && _dbAccount.length ? _dbAccount : gc_account || '');

    if (this.schemas[db.dbName]?.global) {
      account = 'global';
    } else if (!account || !account.length) {
      account = lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '');
    }

    if (typeof account === 'string' && account.includes('@')) {
      account = this.systemApi.md5(account, true);
    }

    if (!this.accountAction.has(account)) {
      this.accountAction.set(account, new ActionStore());
    }

    const action = this.accountAction.get(account)!;

    const isDbExist = lodashGet(action.openedSchemas, `[${db.dbName}].dbTableController[${db.tableName}].name.length`, 0) !== 0;
    if (!isDbExist) {
      this.initDb(db.dbName, account);
    }
    const dbInstance = action.openedSchemas[db.dbName].dbTableController[db.tableName];

    return dbInstance;
  }

  private handleDexieCommonError(db: DbRefer, ex: any) {
    console.warn('[db] put all data error', db, ex);
    // if()
  }

  removeAccountAction(emailMD5: string) {
    if (this.accountAction.has(emailMD5)) {
      this.accountAction.delete(emailMD5);
    }
  }

  // 清除当前表的所有内容
  async clear(db: DbRefer, _account?: string) {
    const dbTable = this.testDbTableNotExist(db, _account);
    await dbTable?.clear();
    return true;
  }

  async getTotalDatabaseNames(filterDbName: boolean = false) {
    const dbNames = await Dexie.getDatabaseNames();
    if (filterDbName) {
      const whiteDbNameList = ['account', 'nim-', 'fileop_', 'storageDB'];
      return dbNames.filter(dbName => {
        const inWhiteList = whiteDbNameList.find(whiteDbName => dbName.indexOf(whiteDbName) === 0);
        if (inWhiteList) {
          return false;
        }
        return true;
      });
    }
    return dbNames;
  }
}

const newDBApi: DbApiV2 = new DexieDbApiImpl();

api.registerLogicalApi(newDBApi);

export default newDBApi;
