import { Transaction } from 'dexie';
import { Api, intBool, resultObject, stringOrNumber, User } from '../_base/api';
import { lf } from './lovefield';
import { ContactAndOrgType, contactTableNames, TableOrderByType } from '../logical/contactAndOrg';
import { StringTypedMap } from '../commonModel';

/**
 * 数据库实体基类
 */
export interface NEntity {
  /**
   * 各个表的id
   */
  id: string;
  /**
   * 各个表的附加K-V值
   */
  additionalInfo: NEntityAttachedInfo[] | undefined;
}

/**
 * 扩展KV的配置
 */
export type EntityType = 'ContactItem' | 'Contact' | 'Org';

/**
 * 通用数据库表，主要实体的扩展 k-v 表
 */
export interface NEntityAttachedInfo extends NEntity {
  // id:number;
  infoKey: string;
  infoVal: string;
  itemId: number;
  itemType: EntityType;
}

export interface column<T = string> {
  name: T;
  type: identity<lf.Type>;
}

export interface tableIndex {
  name?: string;
  columns: string[];
  unique?: boolean;
  multi?: boolean;
  order?: lf.Order;
}

interface tableUnique {
  name: string;
  columns: string[];
}

export interface tablePrimaryKey {
  columns: (string | lf.schema.IndexedColumn)[];
  autoInc?: boolean;
}

interface OrderByObject {
  columnName: string;
  desc: intBool;
}

export interface SearchConditionFilter {
  key: string;
  val: any;
}

export type SearchFilterType = 'equal' | 'notEqual' | 'match';
export type BaseType = string | number | boolean;
export interface SearchFilter {
  key: string | Array<string>;
  val: BaseType | Array<BaseType> | Array<BaseType | Array<BaseType>>;
  type: SearchFilterType | Array<SearchFilterType>;
}

export interface orderCompareParams {
  a: any;
  b: any;
  query?: string;
  orderBy: TableOrderByType;
  idx?: number;
}

export interface orderParams<T = any> {
  data: T[];
  query?: string;
  orderBy?: TableOrderByType;
}

export type SchemaDefSimpleDBType = 'loveField' | 'dexie' | 'loki';
export type SchemaDefMemoryComplexDBType =
  | SchemaDefSimpleDBType
  | {
      type: SchemaDefSimpleDBType;
      // 如果支持多种类型 并发顺序是什么(可能写入的时候是并发 读的时候按照顺序来执行)
    };
export type SchemaDefDBType = SchemaDefSimpleDBType | SchemaDefSimpleDBType[];

export interface SchemaDef<tableNameDef = string, columnPropDef = string> {
  name: DBList;
  tables: tableConfig<tableNameDef, columnPropDef>[];
  tableIndex?: StringTypedMap<tableConfig>;
  version: number;
  global?: boolean;
  using?: SchemaDefDBType;
  cache?: boolean;
  upgrade?: (trans: Transaction) => PromiseLike<any> | void; // 升级数据库脚本
  versionchange?: (e: IDBVersionChangeEvent) => void;
  deleteBefore?: number;
}

export interface SchemaRunningStatus extends SchemaDef {
  // waitConnectList: string[];
  isConnecting: boolean;
  currentToken: string;
  tableSet: Set<string>;
}

export interface ContactSearchConfig {
  query: string;
  tableName: contactTableNames;
  select: string;
  exclude?: SearchConditionFilter[]; // 代表搜索的时候过滤的条件
  include?: SearchConditionFilter[]; // 代表搜索的时候过滤的条件
  orderByItem?: TableOrderByType;
  hitName: ContactAndOrgType;
  aliasTableName?: contactTableNames;
  _account?: string;
}

export interface tableConfig<tableNameDef = string, columnPropDef = string> {
  name: tableNameDef;
  columns: Array<column<columnPropDef>>;
  primaryKey: tablePrimaryKey;
  nullable?: string[];
  unique?: tableUnique;
  index?: tableIndex[];
  model?: () => void;
}

export interface DbRefer {
  dbName: DBList;
  tableName: string;
  _dbAccount?: string;
  _account?: string;
  // 是否要尽可能快 默认为false.如果是true-会优先检索内存数据
  asSoon?: boolean;
}

// export type QueryConfigFilter = ((item: resultObject, param?: QueryConfig) => boolean)
/**
 * 过滤函数
 * @param item 数据库读取的元素
 * @param param 由调用方传入的查询参数，通常使用其中的 param.additionalData 来传入额外的过滤参数
 * 返回是否保留
 */
export type QueryFilterFunc = (item: resultObject, param?: QueryConfig) => boolean;

/**
 * 预定义注册函数实体
 */
export type QueryFilterRegistry = {
  /**
   * 注册的过滤函数，{@link QueryFilterFunc}
   */
  filterFunc: QueryFilterFunc;
  /**
   * 注册的过滤函数的唯一标识名称，调用查询方法时，需要传入此name，则框架会调用对应的过滤函数进行过滤
   */
  name: string;
};

/**
 * 等值查询参数
 *
 * 限于支持，order和query只能有一个生效，优先order,
 * 如果order不为空，则query无任何实际作用
 *
 * 另外，此接口注重效率，order和query均需要为声明的索引字段，
 * 传入多条时，需要确认建立了联合索引
 */
export interface QueryConfig extends DbRefer {
  /**
   * 查询对象，以key = value 的方式作为条件，用and 方式连接
   * 例如传入 {a:1,b:2} 意味着成查询 字段a值为1，并且字段b值为2的数据
   */
  query?: resultObject;
  /**
   * 排序字段
   */
  order?: string;
  /**
   * 分页的开始值（无需从整页开始）
   */
  start?: number;
  /**
   * 分页获取的大小
   */
  count?: number;
  /**
   * true标识降序，不传或false标识升序
   */
  desc?: boolean;
  /**
   * 预先注册的filter函数name，参见{@link QueryFilterRegistry }
   * 可以传入数组，便于拆分基础过滤器进行逻辑复用
   */
  filter?: string[] | string;
  /**
   * 用dexie过滤 默认true
   */
  useDexieFilter?: boolean;
  /**
   * 用内存filter，limit结果返回的数量
   * useDexieFilter 为false 才能使用
   */
  filterLimit?: number;
  /**
   * 是否使用索引进行排序
   */
  orderUsingIndex?: boolean;
  /**
   * 额外传递的参数，主要用于支持传入特定数据给filter
   */
  additionalData?: resultObject;

  /**
   * 是否返回总条数
   */
  returnTotal?: boolean;
}

export type availableCompareFunc =
  | 'above'
  | 'aboveOrEqual'
  | 'anyOf'
  | 'anyOfIgnoreCase'
  | 'below'
  | 'belowOrEqual'
  | 'between'
  | 'equals'
  | 'equalsIgnoreCase'
  | 'inAnyRange'
  | 'startsWith'
  | 'startsWithAnyOf'
  | 'startsWithIgnoreCase'
  | 'startsWithAnyOfIgnoreCase'
  | 'noneOf'
  | 'notEqual';

export interface AdQueryCondition {
  type: availableCompareFunc;
  args?: any[];
  field?: string | string[];
  // fields?:string[];
  // args?:any[];
}

export interface AdQueryConfig extends QueryConfig {
  adCondition?: AdQueryCondition;
  _account?: string;
}

export interface insertConfig extends DbRefer {
  rows: resultObject[];
}

export interface SelectConfig extends DbRefer {
  where?: (table: identity<lf.schema.Table>) => resultObject;
  orderBy?: OrderByObject[];
}

export interface DeleteConfig extends DbRefer {
  where?: (table: identity<lf.schema.Table>) => resultObject;
}

export interface executeConfig extends DbRefer {
  callback: (db: identity<lf.Database>) => identity<lf.query.Builder>;
}

export interface DBCollection<T = any, T1 = any> extends SchemaRunningStatus {
  schemaBuilder?: T;
  dbInstance?: T1;
  waitConnectList?: DBWaitConnect[];
  errorTimes: number;
  // isConnecting: boolean,
  // name: string,
  // version: number,
  // tables: tableConfig[]
}

export interface DBError {
  code?: number;
  message: string;
}

export type DBMap = {
  [key in DBList]: DBCollection;
};
export type ContactSearchDBNames = 'edm_contact_search' | 'contact_search';
export type DBList =
  // 'catalog'
  // | 'contact'
  // 'whatsApp'
  | 'mail_new'
  | 'fileop'
  | 'caches'
  | 'contact_dexie'
  | 'catalog_dexie'
  | 'operation'
  | 'task_global'
  | 'account'
  | 'task_mail'
  | 'contact_global'
  | 'loggers'
  | 'contact_customer'
  | 'whatsApp'
  | 'storageDB'
  | ContactSearchDBNames;

export type DbConfItem = {
  deletable: boolean;
  failTime: number;
};

export type DBConf = Record<DBList, DbConfItem>;

export const dbConfs: Partial<DBConf> = {
  caches: {
    deletable: true,
    failTime: 0,
  },
  catalog_dexie: {
    deletable: true,
    failTime: 0,
  },
  contact_dexie: {
    deletable: false,
    failTime: 0,
  },
  fileop: {
    deletable: false,
    failTime: 0,
  },
  mail_new: {
    deletable: false,
    failTime: 0,
  },
  operation: {
    deletable: false,
    failTime: 0,
  },
  task_global: {
    deletable: false,
    failTime: 0,
  },
  task_mail: {
    deletable: false,
    failTime: 0,
  },
};

export type PutAllOptions = Partial<
  Record<'pageSize' | 'memoryPageSize' | 'intervalTime' | 'memoryIntervalTime', number> & {
    // 对应数据是否支持缓存
    supportCache: 'enable' | 'disable';
  }
>;

export interface DbApiV2 extends Api {
  initDb(name: DBList, _account?: string): SchemaRunningStatus;

  getTableCount(table: DbRefer, _account?: string): Promise<number>;

  getById(table: DbRefer, id: string | number, _account?: string): Promise<resultObject>;

  getByIds<T = resultObject>(table: DbRefer, ids: string[] | number[], _account?: string): Promise<T[]>;

  getByIndexIds<T = resultObject>(table: DbRefer, keyPath: string, ids: string[] | number[], _account?: string): Promise<T[]>;

  getByEqCondition(query: QueryConfig, _account?: string): Promise<resultObject[]>;

  getByEqConditionWithTotal?<T = resultObject>(query: QueryConfig, _account?: string): Promise<{ totalCount: number; data: T[] }>;

  put<T = resultObject>(table: DbRefer, items: T, _account?: string): Promise<T>;

  putAll<T = resultObject>(
    table: DbRefer,
    items: T[],
    // pageSize:单次put最大条数
    // memoryPageSize:内存表单次put最大条数
    // intervalTime:两次put的间隔时长
    // memoryIntervalTime:内存表中两次put的最大条数
    options?: PutAllOptions,
    _account?: string
  ): Promise<T[]>;

  bulkPut<T = resultObject>(table: DbRefer, items: T[], _account?: string): Promise<T[]>;

  close(): void;

  closeSpecific(db: DBList, _account?: string): void;

  deleteById(db: DbRefer, id: stringOrNumber | stringOrNumber[], _account?: string): Promise<void>;

  getByRangeCondition<T = resultObject>(query: AdQueryConfig, _account?: string): Promise<T[]>;

  getByRangeConditionWithTotalCount?<T = resultObject>(query: AdQueryConfig, _account?: string): Promise<{ totalCount: number; data: T[] }>;

  addFilterRegistry(registry: QueryFilterRegistry): void;

  deleteByByRangeCondition(query: AdQueryConfig, _account?: string, options?: { supportCache?: boolean }): Promise<number>;

  deleteDB(dbName: string, _account?: string): Promise<{ success: boolean }>;

  removeAccountAction(emailMD5: string): void;

  clear(db: DbRefer, _account?: string): Promise<boolean>;

  getTotalDatabaseNames(filterDbName?: boolean): Promise<string[]>;
}

/**
 * @deprecated The method should not be used
 */
export interface NewDBApi extends Api {
  getDB(name: DBList): DBCollection<lf.schema.Builder, lf.Database>;

  initDb(name: DBList, user?: User | undefined | null): void;

  connect(name: DBList): Promise<identity<lf.Database>>;

  select(config: SelectConfig): Promise<resultObject[]>;

  delete(config: DeleteConfig): Promise<resultObject[]>;

  execute(config: executeConfig): Promise<resultObject[]>;

  insertOrReplace(config: insertConfig): Promise<resultObject[]>;

  close(name: DBList): void;
}

export type DBWaitConnect = (db?: identity<lf.Database>, ex?: any) => void;

export type identity<T> = T;

export interface connectCallback {
  (db: identity<lf.Database>, tables: identity<lf.schema.Table>[]): Promise<any>;
}

export type ContactSearchResult = {
  [key in contactTableNames]?: Set<any>;
};
export type ContactSearchResult2 = Partial<
  Record<
    contactTableNames,
    {
      idSet: Set<string>;
      idMap: Record<string, unknown>;
    }
  >
>;

export interface searchResult {
  contactIdMap: resultObject;
  contactIdList: Array<number>;
}

export interface SearchQueryConfig {
  query: string;
  searchList: resultObject[];
  index?: number;
  contactIdMap?: resultObject;
  contactIdList?: [];
}
