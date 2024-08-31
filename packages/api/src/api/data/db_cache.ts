import { AdQueryConfig, availableCompareFunc, DBList, DbRefer, QueryConfig, QueryFilterRegistry, tableConfig } from '@/api/data/new_db';
import { Api, resultObject, stringOrNumber } from '@/api/_base/api';

export interface IDBTable<idType = string, dataType = resultObject, tableName = string> {
  name: tableName;
  data: Map<idType, dataType>;
  primaryKey: string;
  index: IDBIndexMap;
}

export interface DBCreateTableParams {
  dbName: DBList;
  version: number;
  tables: tableConfig[];
}

export type DBCreateTableIndexParams<T = resultObject> = DbRefer & {
  data: T[];
};

export interface DBDeleteTableParams extends DbRefer {
  data: string[];
}

export type DBTableIndexParams<T = resultObject> = DBCreateTableIndexParams<T> & Pick<tableConfig, 'primaryKey' | 'index'>;

export type DBTablesMap = Map<string, IDBTable>;

export type DBCacheStatus =
  | 'unInit'
  | 'ready'
  | 'getDBDataStart'
  | 'getDBDataDone'
  | 'getDBDataFailed'
  | 'DBTableIndexCreate'
  | 'DBTableIndexCreated'
  | 'DBTableIndexCreateError';

export interface DBOperatorBetweenParams {
  start: stringOrNumber;
  end: stringOrNumber;
  includeLower?: boolean;
  includeUpper?: boolean;
}
export interface DBOperatorInAnyRangeParams {
  includeLower?: boolean;
  includeUpper?: boolean;
  range: [stringOrNumber, stringOrNumber][];
}

export type IDBIndexMap = Map<stringOrNumber, IDBIndex>;

export interface IDBIndex {
  primaryKeySet: Set<string>;
  children?: IDBIndexMap;
}

export interface DBOperatorParams {
  type: availableCompareFunc;
  value: stringOrNumber;
  params: unknown;
}

export type DBBetweenParams = [Array<stringOrNumber>, Array<stringOrNumber>, boolean, boolean] | [stringOrNumber, stringOrNumber, boolean, boolean];
export type DBInAnyRangeParams = [Array<[Array<stringOrNumber>, Array<stringOrNumber>]>, boolean, boolean];

export interface DBOperator {
  anyOf(value: stringOrNumber, params: stringOrNumber[]): boolean; // 在...内
  above(value: stringOrNumber, params: stringOrNumber): boolean; // 大于
  aboveOrEqual(value: stringOrNumber, params: stringOrNumber): boolean; // 大于或等于
  anyOfIgnoreCase(value: stringOrNumber, params: stringOrNumber[]): boolean; // 不在参数内
  below(value: stringOrNumber, params: stringOrNumber): boolean; // 小于
  belowOrEqual(value: stringOrNumber, params: stringOrNumber): boolean; // 小于或等于
  between(value: stringOrNumber, params: DBOperatorBetweenParams): boolean; // 在传入的范围之间
  equals(value: stringOrNumber, params: stringOrNumber): boolean; // 等于
  equalsIgnoreCase(value: string, params: string): boolean; // 等于忽略大小写
  inAnyRange(value: stringOrNumber, params: DBOperatorInAnyRangeParams): boolean; // 在任何范围内
  startsWith(value: string, params: string): boolean; // 以...开始
  startsWithAnyOf(value: string, params: string[]): boolean; // 以传入的任何参数开始
  startsWithIgnoreCase(value: string, params: string): boolean; // 不以传入的参数开始
  startsWithAnyOfIgnoreCase(value: string, params: string[]): boolean; // 不以传入的任何参数开始
  noneOf(value: any): boolean; // 不存在
  notEqual(value: stringOrNumber, params: stringOrNumber): boolean; // 不等于
}

export interface DBCacheApi extends Api {
  doGetDBCacheReady(): boolean;

  doGetDBCacheStatus(): string;

  getByRangeCondition<T = resultObject>(condition: AdQueryConfig): T[];

  getByEqCondition<T>(condition: QueryConfig): T[];

  setFilterRegistry(params: QueryFilterRegistry): void;

  putAll<T>(params: DBCreateTableIndexParams<T>): T[];

  bulkPut(params: DBCreateTableIndexParams): string[];

  insert<T = resultObject>(params: DBCreateTableIndexParams<T>): T[];

  getTableCount(table: DbRefer): number;

  getById<T = resultObject>(table: DbRefer, id: string | number): T;

  getByIds<T = resultObject>(table: DbRefer, ids: string[] | number[]): T[];

  getByIndexIds<T = resultObject>(table: DbRefer, keyPath: string, ids: string[] | number[]): T[];

  deleteById(params: DBCreateTableIndexParams<stringOrNumber>): void;

  deleteByByRangeCondition(query: AdQueryConfig): number;
}
