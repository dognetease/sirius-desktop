/* eslint-disable class-methods-use-this */
import lodashGet from 'lodash/get';
import lodashChunk from 'lodash/chunk';
import Lokijs from 'lokijs';
// import cloneDeep from 'lodash/cloneDeep';
import lodashZip from 'lodash/zip';
import {
  AdQueryConfig,
  DbApiV2,
  DBList,
  DbRefer,
  QueryConfig,
  QueryFilterRegistry,
  SchemaDef,
  SchemaRunningStatus,
  AdQueryCondition,
  PutAllOptions,
} from '@/api/data/new_db';
import { StringTypedMap } from '@/api/commonModel';
import db_tables from '@/api/data/db_tables';
import { resultObject, stringOrNumber, User } from '@/api/_base/api';
import { apis, supportLocalIndexedDB } from '@/config';
import { api } from '@/api/api';
import { SystemApi } from '@/api/system/system';
import { DataStoreApi, StoredLock } from '@/api/data/store';
import { AbstractDBInterfaceImpl } from './db_abs';
import { LoggerApi } from '@/api/data/dataTracker';
import { AccountApi } from '@/api/logical/account';
import { util } from '@/api/util';

type SupportLokiOperator = '$gt' | '$gte' | '$eq' | '$ne' | '$lt' | '$lte' | '$between' | '$in' | '$regex' | '$type' | '$size' | '$exist';

type LokiFindParam = {
  // 主键OR索引
  $field: string;
  // 操作符
  $operator: SupportLokiOperator;
  // value
  $val: string | string[] | RegExp;
};

type TxChainParam = {
  type: 'where' | 'find' | 'limit';
  value: unknown;
};

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
  instance: Lokijs;
  dbTableController: StringTypedMap<Lokijs.Collection>;
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

  loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;

  constructor() {
    super();
    this.schemas = {};
    /* for (const idx in db_tables) */
    Object.keys(db_tables).forEach(idx => {
      const id = idx as DBList;
      if (db_tables[id]) {
        const item = db_tables[id] as SchemaDef;
        // const supportLoki = (Array.isArray(item.using) && item.using.includes('loki')) || (typeof item.using === 'string' && item.using === 'loki');
        // if (!item.using || supportLoki) {
        //   this.schemas[id] = item;
        // }
        this.schemas[id] = item;
      }
    });
    console.warn('[db.loki]constructor', apis);
    this.name = apis.dbMemoryApiImpl;
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as unknown as AccountApi;

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
    } else if (!_account || !_account.length) {
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
      action.openedSchemas[db].instance.close();
      delete action.openedSchemas[db];
    }
  }

  init(): string {
    // this.initInterfaceAndProxy();
    // if (supportLocalIndexedDB() && inWindow() && window.isBridgeWorker) {
    //   this.createSearchTable();
    // }
    if (this.systemApi && this.systemApi.getCurrentUser) {
      const currentUser = this.systemApi.getCurrentUser()?.accountMd5 || '';
      if (currentUser) {
        this.accountAction.set(currentUser, new ActionStore());
      }
    }

    return this.name;
  }

  async deleteDB(dbName: string) {
    console.log('[db.loki]deleteDB', dbName);
    return {
      success: true,
    };
  }

  private isMockDB(db: DbRefer) {
    // 先只支持通讯录
    if (!supportLocalIndexedDB() && db.dbName !== 'contact_dexie') {
      return true;
    }
    return false;
  }

  initDb(name: DBList, _account = ''): SchemaRunningStatus {
    if (!(name in this.schemas)) {
      throw new Error('db not defined');
    }
    let account = _account;

    // 获取对齐后的_account名称
    if (typeof account === 'string' && account.includes('@')) {
      account = this.accountApi.getEmailIdByEmail(_account);
      account = this.systemApi.md5(account, true);
    }

    if (this.schemas[name]?.global) {
      account = 'global';
    } else if (!_account || !_account.length) {
      account = lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '');
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

    if (typeof accountMd5 === 'string' && accountMd5.includes('@')) {
      const standardAccount = this.accountApi.getEmailIdByEmail(_accountMd5);
      accountMd5 = this.systemApi.md5(standardAccount, true);
    }

    const dbName = it.global ? it.name : it.name + '_' + (accountMd5 || new Date().getTime());

    const db = new Lokijs(dbName, {
      autosave: false,
      autoload: false,
      persistenceMethod: 'memory',
    });

    const dbTables: StringTypedMap<Lokijs.Collection> = {};

    // 创建对应db下的table
    it.tables.forEach(tb => {
      // 获取定义索引&主键
      // lokijs不支持复合索引。把所有的复合所以拆成单索引。复合索引查询使用And操作符执行
      const indices: string[] = [...new Set((tb.index || []).flatMap(item => item.columns))];
      const uniques = tb.primaryKey.columns as string[];
      // 定义唯一约束和二进制索引
      const collection = db.addCollection(tb.name, {
        unique: uniques,
        indices,
      });

      dbTables[tb.name] = collection;
    });

    return {
      ...it,
      instance: db,
      dbTableController: dbTables,
    } as SchemaController;
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

  // todo:定义过滤方法
  // tranformFilterFunc(condition:AdQueryCondition) {}
  // 将query转成标准的AdQueryCondition
  tranformQuery2CondtionArray(query?: resultObject): AdQueryCondition[] {
    if (!query) {
      return [];
    }
    const conditionArray: AdQueryCondition[] = [];
    Object.keys(query).forEach(_key => {
      let keys: string[];
      let vals: string[];
      // 如果key是一个复合索引
      if (_key.startsWith('[')) {
        keys = _key.replace(/[\[\]]/g, '').split('+');
        vals = Array.isArray(query[_key]) ? query[_key] : query[_key]!.replace(/[\[\]]/g, '').split('+');
      } else {
        keys = [_key];
        vals = Array.isArray(query[_key]) ? query[_key] : [query[_key]];
      }

      keys.forEach((it, _index) => {
        conditionArray.push({
          type: 'equals',
          field: it,
          args: [vals[_index]],
        });
      });
    });

    return conditionArray;
  }

  // 将符合索引转成loki支持的AND操作符
  transformCompoundIndex2CondtionArray(query: AdQueryCondition): AdQueryCondition[] {
    if (!query || !Array.isArray(query.field)) {
      return [query];
    }
    const { field: oldField, type: oldType, args: oldArgs } = query;
    let totalArgs: unknown[] = [];
    switch (oldType) {
      case 'between': {
        const argBounds: unknown[][] = oldArgs!.filter(item => Array.isArray(item));
        const argIncludeConfig: boolean[] = oldArgs!.filter(item => !Array.isArray(item));
        // todo: 貌似loki的between默认就是[] 所以dexie的lowerContainer和upperContainer没有办法配置
        // 可能要转成复合的$gt/$gte/$lt/$lte
        if (argIncludeConfig.includes(false)) {
          console.warn('[db.lokijs]switchCompoundIndex.lowerContainer', query);
        }
        totalArgs = lodashZip(argBounds);
        break;
      }
      default: {
        totalArgs = oldArgs as unknown[];
        break;
      }
    }

    return (oldField as string[]).map((_field, _fieldIndex) => {
      const argItem = totalArgs[_fieldIndex];
      return {
        type: oldType,
        field: _field,
        args: Array.isArray(argItem) ? argItem : [argItem],
      };
    });
  }

  // 将DB的操作转换成loki可以识别的操作符
  transformIDBKeyRange(condition: AdQueryCondition): LokiFindParam | false {
    if (!condition || !condition.field) {
      return false;
    }

    const { field } = condition;
    const fileVal = Array.isArray(field) ? field[0]! : field!;

    // args可能会存在多层数据 直接给拍平
    const args = Array.isArray(condition.args) ? condition.args.flat() : condition.args!;

    switch (condition.type) {
      case 'below':
        return {
          $field: fileVal,
          $operator: '$lt',
          $val: Array.isArray(args) ? args[0]! : args,
        };
      case 'belowOrEqual':
        return {
          $field: fileVal,
          $operator: '$lte',
          $val: Array.isArray(args) ? args[0]! : args,
        };
      case 'above':
        return {
          $field: fileVal,
          $operator: '$gt',
          $val: Array.isArray(args) ? args[0]! : args,
        };
      case 'aboveOrEqual': {
        return {
          $field: fileVal,
          $operator: '$gte',
          $val: Array.isArray(args) ? args[0]! : args,
        };
      }
      case 'equals': {
        return {
          $field: fileVal,
          $operator: '$eq',
          $val: Array.isArray(args) ? args[0]! : args,
        };
      }

      case 'notEqual': {
        return {
          $field: fileVal,
          $operator: '$ne',
          $val: Array.isArray(args) ? args[0]! : args,
        };
      }
      case 'anyOf':
        return {
          $field: fileVal,
          $operator: '$in',
          $val: Array.isArray(args) ? args : [args],
        };
      case 'startsWith': {
        const args = Array.isArray(condition.args) ? condition.args : [condition.args];
        const regval = lodashGet(args, '[0]', 'unkonwn') as string;
        const regex = new RegExp(`^${regval}`, 'i');
        return {
          $field: fileVal,
          $operator: '$regex',
          $val: regex,
        };
      }

      default: {
        return false;
      }
    }
  }

  private tranformLimitOpeartor(query: QueryConfig) {
    const txLimitList: TxChainParam[] = [];
    const { filterLimit } = query;
    const count = query.count || (filterLimit ? 10000 : query.count);

    if (count && count > 0) {
      txLimitList.push({
        type: 'limit',
        value: count,
      });
    }
    return txLimitList;
  }

  async getByRangeCondition<T = resultObject>(query: AdQueryConfig, _account?: string): Promise<T[]> {
    // 不支持DB场景 mail_new表返回空数据
    if (this.isMockDB(query)) {
      return [];
    }
    const dbTable = this.testDbTableNotExist(query, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }

    const adConditionArray = this.transformCompoundIndex2CondtionArray(query.adCondition!);
    const txFindList: TxChainParam[] = adConditionArray
      .map(item => this.transformIDBKeyRange(item))
      .filter(item => item !== false)
      .map(item => ({
        type: 'find',
        value: {
          [(item as LokiFindParam).$field]: {
            [(item as LokiFindParam).$operator]: (item as LokiFindParam).$val,
          },
        },
      }));

    const action = this.accountAction.get('global')!;
    // eslint-disable-next-line no-nested-ternary
    const _configFilterNames = Array.isArray(query.filter) ? query.filter : [query.filter || 'unknown'];
    const configFilters = _configFilterNames.filter(name => action.filterRegistry.has(name)).map(name => action.filterRegistry.get(name)!.filterFunc);

    const txWhereList: TxChainParam[] = [];
    // 如果配置不适用dexie筛选
    if (configFilters.length) {
      txWhereList.push({
        type: 'where',
        value(res: resultObject) {
          return configFilters.every(filterFunc => filterFunc(res, query));
        },
      });
    }
    // const txList = [...txFindList, ...txWhereList];
    // return dbTable.chain(txList).data();
    const txList = [...txFindList, ...txWhereList, ...this.tranformLimitOpeartor(query)];
    const results = dbTable.chain(txList).data();

    // 添加一个临时方案 如果ID重复 根据ID做一个去重
    /**
     * @description:需要注释去重逻辑
     * @reason:目前看内存数据没有重复的数据。因为要支持搜索展示个人名下的所有email.内存数据中存了多条相同id不同accountName的通讯录数据
     * @author:郭超
     */
    if (['edm_contact_search', 'contact_search'].includes(query.dbName)) {
      return [...new Map(results.map(item => [item.id + ':::' + item.accountName, item])).values()];
    }

    return results;
  }

  getByEqCondition(query: QueryConfig, _account?: string): Promise<resultObject[]> {
    if (this.isMockDB(query)) {
      return Promise.resolve([]);
    }

    const dbTable = this.testDbTableNotExist(query, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }

    const adConditionArray = this.tranformQuery2CondtionArray(query.query).map(_condtionItem => this.transformIDBKeyRange(_condtionItem));

    const txFindList: TxChainParam[] = adConditionArray
      .filter(item => item !== false)
      .map(item => ({
        type: 'find',
        value: {
          [(item as LokiFindParam).$field]: {
            $eq: (item as LokiFindParam).$val,
          },
        },
      }));
    const action = this.accountAction.get('global')!;
    // eslint-disable-next-line no-nested-ternary
    const _configFilterNames = Array.isArray(query.filter) ? query.filter : [query.filter || 'unknown'];
    const configFilters = _configFilterNames.filter(name => action.filterRegistry.has(name)).map(name => action.filterRegistry.get(name)!.filterFunc);

    // 如果配置不适用dexie筛选
    const txWhereList: TxChainParam[] = [];
    // 如果配置不适用dexie筛选
    if (configFilters.length) {
      txWhereList.push({
        type: 'where',
        value(res: resultObject) {
          return configFilters.every(filterFunc => filterFunc(res, query));
        },
      });
    }
    const txList = [...txFindList, ...txWhereList, ...this.tranformLimitOpeartor(query)];
    return Promise.resolve(dbTable.chain(txList).data());
  }

  async deleteByByRangeCondition(query: AdQueryConfig, _account?: string): Promise<number> {
    if (this.isMockDB(query)) {
      return Promise.resolve(0);
    }

    const dbTable = this.testDbTableNotExist(query, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }

    const operators = this.transformIDBKeyRange(query.adCondition!);

    if (!operators) {
      console.warn('[db.loki]getByRangeCondition.unsupport', query);
      return Promise.reject(new Error('请检查查询条件，无法创建查询'));
    }

    dbTable.findAndRemove({
      [operators.$field]: {
        [operators.$operator]: operators.$val,
      },
    });
    return Promise.resolve(0);
  }

  addFilterRegistry(registry: QueryFilterRegistry) {
    // 暂时吧所有的判定条件存储到global这个账户上
    const action = this.accountAction.get('global')!;
    action.filterRegistry.set(registry.name, registry);
  }

  getTableCount(db: DbRefer, _account?: string): Promise<number> {
    if (this.isMockDB(db)) {
      return Promise.resolve(0);
    }

    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }

    return Promise.resolve(dbTable.count());
  }

  getById(db: DbRefer, id: string | number, _account?: string): Promise<resultObject> {
    // todo:测试空场景是否影响业务
    if (this.isMockDB(db)) {
      return Promise.resolve({});
    }
    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }

    return Promise.resolve(
      dbTable.find({
        id: {
          $eq: id,
        },
      })
    );
  }

  async getByIds<T = resultObject>(db: DbRefer, ids: string[] | number[], _account?: string): Promise<T[]> {
    if (this.isMockDB(db)) {
      return Promise.resolve([]);
    }
    const dbTable = this.testDbTableNotExist(db, _account);

    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    const res = await Promise.all(ids.map(_id => this.getById(db, _id, _account)));
    return Promise.resolve(res as unknown as T[]);
  }

  async getByIndexIds<T = resultObject>(db: DbRefer, keyPath: string, ids: string[] | number[], _account?: string): Promise<T[]> {
    if (this.isMockDB(db)) {
      return Promise.resolve([]);
    }

    console.warn('[db.loki]getByIndexIds.unsupport', db, keyPath, ids);

    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }

    if (Array.isArray(ids) && ids.length > 1) {
      const result = await Promise.all(ids.map(_id => this.getByIndexIds<T>(db, keyPath, [_id as string], _account)));
      return result.flat();
    }

    return dbTable
      .chain()
      .find({
        [keyPath]: { $eq: ids[0]! },
      })
      .data();
  }

  async deleteById(db: DbRefer, id: stringOrNumber | stringOrNumber[], _account?: string): Promise<void> {
    if (this.isMockDB(db)) {
      return Promise.resolve();
    }

    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    const idList = util.singleToList(id);
    // if (Array.isArray(id)) {
    //   await Promise.all(id.map(_id => this.deleteById(db, _id)));
    //   return Promise.resolve();
    // }
    dbTable.findAndRemove({
      id: {
        $in: idList,
      },
    });
    return Promise.resolve();
  }

  async put<T = resultObject>(db: DbRefer, items: T, _account?: string): Promise<T> {
    if (this.isMockDB(db)) {
      return Promise.resolve(items);
    }
    if (!items) {
      return items;
    }
    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }

    /**
     * 先尝试直接插入 如果失败可能是因为有已经有唯一主键对应的值存在了。这个时候再兜底使用findAndUpdate更新
     */
    try {
      dbTable.insert(items);
      return items;
    } catch (ex) {
      // 查找当前table对应的primaryKey
      // const action = [...this.accountAction.values()][0]!;
      const action = this.accountAction.get(this.getDBAccount(db, _account))!;
      const _primaryKey = lodashGet(action, `openedSchemas[${db.dbName}].dbTableController[${db.tableName}].uniqueNames[0]`, '');
      // 查询到唯一主键
      if (_primaryKey && _primaryKey.length) {
        dbTable.findAndUpdate(
          {
            [`${_primaryKey}`]: {
              $eq: lodashGet(items, `${_primaryKey}`),
            },
          },
          _items => ({
            ..._items,
            items,
          })
        );
        return items;
      }
      return items;
    }
  }

  private getDBAccount(db: DbRefer, _account?: string): string {
    const { _dbAccount } = db;

    let account = _account || (_dbAccount as string);

    // if (this.schemas[db.dbName]?.global) {
    //   account = 'global';
    // } else if (!_account || !_account.length) {
    //   account = lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '');
    // }
    if (this.schemas[db.dbName]?.global) {
      account = 'global';
    } else if (!_account || !_account.length) {
      account = lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '');
    }

    if (typeof account === 'string' && account.includes('@')) {
      account = this.systemApi.md5(account, true);
    }
    return account;
  }

  // 一次性写入OR分批次写入都调用这里
  async bulkPut<T = resultObject>(db: DbRefer, _items: T[], _account?: string): Promise<T[]> {
    if (this.isMockDB(db)) {
      return Promise.resolve(_items);
    }
    if (!Array.isArray(_items) || !_items.length) {
      return _items;
    }
    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }

    const items = _items.map(_item => {
      Reflect.deleteProperty(_item as unknown as resultObject, '$loki');
      return _item;
    });

    // 如果表是空的 直接插入
    if (dbTable.count() === 0) {
      dbTable.insert(items);
      return items;
    }

    // 查找当前table对应的primaryKey
    const action = this.accountAction.get(this.getDBAccount(db, _account))!;

    const _primaryKey: string = lodashGet(action, `openedSchemas[${db.dbName}].dbTableController[${db.tableName}].uniqueNames[0]`, '');
    const keys = _primaryKey.length > 0 ? _items.map(item => lodashGet(item, `${_primaryKey}`, '') as string) : [];

    if (_primaryKey.length && keys.length) {
      dbTable.findAndRemove({
        [`${_primaryKey}`]: {
          $in: keys,
        },
      });
    }

    dbTable.insert(items);
    return items;
  }

  static LokiPutMaxCount = 5000;

  async putAll<T = resultObject>(db: DbRefer, items: T[], _options?: PutAllOptions, _account?: string): Promise<T[]> {
    if (!items || items.length === 0) {
      return items;
    }

    const pageSize = lodashGet(_options, 'memoryPageSize') || lodashGet(_options, 'pageSize', DexieDbApiImpl.LokiPutMaxCount);

    try {
      // await this.action.lock?.lock();
      const ret: T[] = await (items.length > pageSize ? this.putLargeDataSetToDb(db, items, undefined, _account) : this.bulkPut(db, items, _account));
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
    const pageSize = lodashGet(_options, 'memoryPageSize') || lodashGet(_options, 'pageSize', DexieDbApiImpl.LokiPutMaxCount);
    const intervalTime = lodashGet(_options, 'memoryIntervalTime') || lodashGet(_options, 'intervalTime', 200);

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

  private testDbTableNotExist(db: DbRefer, _account?: string): Lokijs.Collection | undefined {
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

  clear(db: DbRefer, _account?: string) {
    console.log('[db.loki]clear:', db);
    const dbTable = this.testDbTableNotExist(db, _account);
    if (!dbTable) {
      return Promise.reject(new Error('请检查参数，不存在请求的数据库或表'));
    }
    dbTable?.findAndRemove();
    return Promise.resolve(true);
  }

  async getTotalDatabaseNames(_?: boolean) {
    console.log(_);
    return [];
  }
}

const newMemoryApi: DbApiV2 = new DexieDbApiImpl();

api.registerLogicalApi(newMemoryApi);

export default newMemoryApi;
