import lodashGet from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import {
  AdQueryConfig,
  DbApiV2,
  DBList,
  DbRefer,
  QueryConfig,
  QueryFilterRegistry,
  SchemaRunningStatus,
  SchemaDefDBType,
  SchemaDefSimpleDBType,
  availableCompareFunc,
  PutAllOptions,
} from '@/api/data/new_db';
import { apis, inWindow } from '@/config';
import { Api, resultObject, stringOrNumber } from '@/api/_base/api';
import { api } from '@/api/api';
// import db_tables from '@/api/data/db_tables';
import { AbstractDBInterfaceImpl } from './db_abs';
import type { ProductAuthApi } from '@/api/logical/productAuth';
import { searchDbHelper } from '../../logical/contact/contact_search_helper';
import db_tables from '@/api/data/db_tables';
import { personalRegexp } from '@/api/util';

// import db_tables from '../../../api/data/db_tables';

export class DBInterfaceImpl extends AbstractDBInterfaceImpl implements DbApiV2 {
  name: string = apis.dbInterfaceApiImpl;

  dbApi = api.requireLogicalApi(apis.dexieDbApi) as DbApiV2;

  memoryApi = api.requireLogicalApi(apis.dbMemoryApiImpl) as DbApiV2;

  productApi = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;

  systemApi = api.getSystemApi();

  private searchDbHelper = searchDbHelper;

  private fieldCheckMap: Map<string, Record<string, (val: any) => boolean>> = new Map();

  constructor() {
    super();
    this.fieldCheckMap.set('contact', {
      type(val: number) {
        return `${val}` === 'personal';
      },
      id(val: string) {
        return personalRegexp.test(val);
      },
    });

    this.fieldCheckMap.set('contactItem', {
      type(val: number) {
        return `${val}` === 'personal';
      },
      contactId(val: string) {
        return personalRegexp.test(val);
      },
    });
    this.fieldCheckMap.set('orgContact', {
      orgId(val: string) {
        return val.startsWith('personal_org');
      },
      id(val: string) {
        return val.startsWith('personal_org');
      },
    });
    this.fieldCheckMap.set('org', {
      id(val: string) {
        return val.startsWith('personal_org');
      },
      type(val: string) {
        return `${val}` === '2001';
      },
    });
  }

  init(): string {
    return this.name;
  }

  private getShouldUseMemoryDb() {
    if (process.env.BUILD_ISPREVIEWPAGE) {
      return false;
    }
    return true;
  }

  afterLoadFinish() {
    if (this.getShouldUseMemoryDb()) {
      this.searchDbHelper.doCreateLokiData();
    }
    // this.personalContactSpeedHelper.doCreateSpeedData();
    return this.name;
  }

  afterLogin() {
    if (this.getShouldUseMemoryDb()) {
      this.searchDbHelper.doCreateLokiData();
    }
    // this.personalContactSpeedHelper.doCreateSpeedData();
    return this.name;
  }

  initDb(name: DBList, _account?: string): SchemaRunningStatus {
    if (this.getShouldUseMemoryDb()) {
      this.memoryApi.initDb(name, _account);
    }
    return this.dbApi.initDb(name, _account);
  }

  addFilterRegistry(registry: QueryFilterRegistry): void {
    this.memoryApi.addFilterRegistry(registry);
    this.dbApi.addFilterRegistry(registry);
  }

  close(): void {
    this.dbApi.close();
  }

  closeSpecific(db: DBList, _account?: string): void {
    this.dbApi.closeSpecific(db, _account);
  }

  /**
   * @deprecated:1.20版本不支持在后台页面创建内存版本的个人通讯录(后台功能不稳定)
   * @param query
   * @returns
   */
  useMemory4RangeConditionBak(query: AdQueryConfig): boolean {
    const { dbName, tableName } = query;
    // 在非数据后台不可以调用loki
    if (inWindow() && !window.isBridgeWorker) {
      return false;
    }
    if (dbName !== 'contact_dexie' || ![...this.fieldCheckMap.keys()].includes(tableName)) {
      return false;
    }

    let flag = false;
    const fieldCheckConfig = this.fieldCheckMap.get(tableName)!;

    const conditionType: availableCompareFunc = lodashGet(query, 'adCondition.type', '');
    switch (conditionType) {
      case 'anyOf': {
        const args: string[] = query.adCondition!.args!;
        if (!Array.isArray(args) || !args.length) {
          return false;
        }
        const fieldArr = query.adCondition!.field!;
        const filed = Array.isArray(fieldArr) ? fieldArr[0] : fieldArr;
        const totalKeys = Object.keys(fieldCheckConfig);

        if (!totalKeys.includes(filed)) {
          return false;
        }

        flag = args.flat().every(_arg => fieldCheckConfig[filed]!(_arg));
        break;
      }

      case 'startsWith': {
        const args = `${query.adCondition!.args!}`;
        const fieldArr = query.adCondition!.field!;
        const filed = Array.isArray(fieldArr) ? fieldArr[0] : fieldArr;
        const totalKeys = Object.keys(fieldCheckConfig);
        if (!totalKeys.includes(filed)) {
          return false;
        }
        flag = fieldCheckConfig[filed]!(args);
        break;
      }

      case 'equals': {
        const args = `${query.adCondition!.args!}`;
        const fieldArr = query.adCondition!.field!;
        const filed = Array.isArray(fieldArr) ? fieldArr[0] : fieldArr;
        const totalKeys = Object.keys(fieldCheckConfig);
        if (!totalKeys.includes(filed)) {
          return false;
        }
        flag = fieldCheckConfig[filed]!(args);
        break;
      }
      default:
        break;
    }
    return flag;
  }

  /**
   * @deprecated:1.20版本不支持在后台页面创建内存版本的个人通讯录(后台功能不稳定)
   * @description: 判断byEqCondition是否可以走内存模式
   * @param query
   * @returns
   */
  useMemory4EqConditionBak(query: QueryConfig): boolean {
    // eslint-disable-next-line
    const { dbName, tableName } = query;
    // 非数据后台不允许走内存
    if (dbName !== 'contact_dexie' || ![...this.fieldCheckMap.keys()].includes(query.tableName) || !window.isBridgeWorker) {
      return false;
    }

    const fieldCheckConfig = this.fieldCheckMap.get(tableName)!;
    const fieldCheckKeys = Object.keys(fieldCheckConfig);
    if (!query.query) {
      return false;
    }
    return Object.keys(query.query).every(_queryKey => {
      if (!fieldCheckKeys.includes(_queryKey)) {
        return false;
      }
      const call = fieldCheckConfig![_queryKey];
      return call(`${query.query![_queryKey]}`);
    });
  }

  /**
   * @name:判断put操作是否可以走DB
   * @param dbRefer
   * @param result
   * @returns
   */
  useMemory4WriteBak(dbRefer: DbRefer, result: resultObject[]) {
    // eslint-disable-next-line
    // @ts-ignore
    const fieldMap: Map<string, Record<string, (val: any) => boolean>> = new Map([
      [
        'contact',
        {
          type(val: string) {
            return val === 'personal';
          },
        },
      ],
      [
        'contactItem',
        {
          type(val: string) {
            return val === 'personal';
          },
        },
      ],
      [
        'orgContact',
        {
          orgId(val: string) {
            return val.startsWith('personal_org');
          },
          id(val: string) {
            return val.startsWith('personal_org');
          },
        },
      ],
      [
        'org',
        {
          id(val: string) {
            return val.startsWith('personal_org');
          },
        },
      ],
    ]);

    const { dbName, tableName } = dbRefer;
    if (dbName !== 'contact_dexie' || ![...fieldMap.keys()].includes(tableName)) {
      return false;
    }
    return result.every(item => {
      const regField: string = Object.keys(fieldMap.get(tableName)!)[0]!;
      if (!Reflect.has(item, regField)) {
        return false;
      }
      const regCall = fieldMap.get(tableName)![regField];
      return regCall(item[regField]);
    });
  }

  checkLocalSupportType(dbRefer: DbRefer): SchemaDefSimpleDBType[] {
    if (dbRefer.dbName === 'contact_search' || dbRefer.dbName === 'edm_contact_search') {
      return ['loki'];
    }

    const supportTypes: SchemaDefDBType = lodashGet(db_tables, `[${dbRefer.dbName}].using`, 'dexie');
    if (!Array.isArray(supportTypes)) {
      return [supportTypes];
    }

    // loki&dexie都要写入的时候 loki是dexie的子集数据 业务方要通过配置asSoon字段指定是否要写入到loki
    return supportTypes.filter(item => {
      if (item === 'loki') {
        return dbRefer.asSoon;
      }
      return true;
    });
  }

  async getById(table: DbRefer, id: string | number, _account?: string): Promise<resultObject> {
    return this.dbApi.getById(table, id, _account);
  }

  async getByIds<T = resultObject>(table: DbRefer, ids: string[] | number[], _account?: string): Promise<T[]> {
    return this.dbApi.getByIds(table, ids, _account);
  }

  async getByIndexIds<T = resultObject>(table: DbRefer, keyPath: string, ids: string[] | number[], _account?: string): Promise<T[]> {
    return this.dbApi.getByIndexIds(table, keyPath, ids, _account);
  }

  async deleteById(db: DbRefer, id: stringOrNumber | stringOrNumber[], _account?: string): Promise<void> {
    const ids = Array.isArray(id) ? id : [id];

    if (!ids || !ids.length) {
      return;
    }

    try {
      this.searchDbHelper.deleteRawData(
        {
          ...db,
          adCondition: {
            type: 'anyOf',
            field: ['id'],
            args: ids,
          },
        },
        false
      );
    } catch (ex) {
      console.warn('[db_interface_impl]searchDbHelper.deleteById.error', ex);
    }

    const supportTypes = this.checkLocalSupportType({
      asSoon: false,
      ...db,
    });

    if (supportTypes.length === 1) {
      this[supportTypes.includes('loki') ? 'memoryApi' : 'dbApi'].deleteById(db, id, _account);
      return;
    }
    // 1.22之后删除后续逻辑(1.22之后不再有同时支持loki和dexie的数据库配置)
    this.memoryApi.deleteById(db, id, _account);
    this.dbApi.deleteById(db, id, _account);
  }

  async deleteByByRangeCondition(query: AdQueryConfig, _account?: string, options?: { supportCache?: boolean }): Promise<number> {
    const asSoon = false;
    const supportTypes = this.checkLocalSupportType(
      Object.assign(query, {
        asSoon,
      })
    );
    const supportCache = lodashGet(options, 'supportCache', true);
    try {
      supportCache && this.searchDbHelper.deleteRawData(cloneDeep(query), true);
    } catch (ex) {
      console.error('[dbInterfaceImpl]deleteRangeCondition.searchHelper.deleteRawData failed:', ex);
    }

    if (supportTypes.length === 1) {
      return this[supportTypes.includes('loki') ? 'memoryApi' : 'dbApi'].deleteByByRangeCondition(query, _account);
    }
    this.memoryApi.deleteByByRangeCondition(query, _account);
    return this.dbApi.deleteByByRangeCondition(query, _account);
  }

  async getByEqCondition(query: QueryConfig, _account?: string): Promise<resultObject[]> {
    const asSoon = false;
    const supportTypes = this.checkLocalSupportType(
      Object.assign(query, {
        asSoon,
      })
    );
    if (supportTypes.length === 1 && supportTypes.includes('loki')) {
      return this.memoryApi.getByEqCondition(query, _account);
    }
    if (supportTypes.length === 1 && supportTypes.includes('dexie')) {
      return this.dbApi.getByEqCondition(query, _account);
    }

    return this.memoryApi.getByEqCondition(query, _account).catch(error => {
      console.warn('[dbInterfaceImpl]getByRangeCondition.lokiError:', error);
      const ret = this.dbApi.getByEqCondition(query, _account);
      return ret;
    });
  }

  async getByRangeCondition<T = resultObject>(query: AdQueryConfig, _account?: string): Promise<T[]> {
    const asSoon = false;
    const supportTypes = this.checkLocalSupportType(
      Object.assign(query, {
        asSoon,
      })
    );

    if (supportTypes.includes('loki')) {
      const list = await this.memoryApi.getByRangeCondition<T>(query, _account);
      // 返回空结果之后判断如果内存数据少于DB数据尝试重新初始化内存数据
      if (!Array.isArray(list) || !list.length) {
        this.searchDbHelper.testMemoryDataOk(query).then(options => {
          if (options.type !== 'ok') {
            this.searchDbHelper.reCreateLokiFromDB({
              type: options.type,
              db: options.db || 0,
              loki: options.loki || 0,
            });
          }
        });
      }
      return list;
    }
    return this.dbApi.getByRangeCondition(query, _account);
  }

  // 获取表count
  async getTableCount(table: DbRefer, _account?: string): Promise<number> {
    const supportTypes = this.checkLocalSupportType(table);

    if (supportTypes.length === 1 && supportTypes.includes('loki')) {
      return this.memoryApi.getTableCount(table, _account);
    }
    if (supportTypes.length === 1 && supportTypes.includes('dexie')) {
      return this.dbApi.getTableCount(table, _account);
    }

    return this.memoryApi.getTableCount(table, _account).catch(error => {
      console.warn('[dbInterfaceImpl]getByRangeCondition.lokiError:', error);
      const ret = this.dbApi.getTableCount(table, _account);
      return ret;
    });
  }

  async put<T = resultObject>(table: DbRefer, data: T, _account?: string): Promise<T> {
    if (!data) {
      return data;
    }

    const asSoon = false;
    const supportTypes = this.checkLocalSupportType(
      Object.assign(table, {
        asSoon,
      })
    );

    // 理论上这个逻辑不会被trigger
    if (!Array.isArray(supportTypes)) {
      throw new Error('loki or dexie');
    }

    try {
      let ret: T | undefined;
      if (supportTypes.length === 1) {
        ret = await this[supportTypes[0] === 'loki' ? 'memoryApi' : 'dbApi']!.put(table, data, _account);
      } else {
        this.memoryApi.put(table, cloneDeep(data), _account);
        ret = await this.dbApi.put(table, data, _account);
      }

      if (!ret) {
        console.error('putAll error');
        return ret;
      }
      this.searchDbHelper.watchDBPutOperation(table, ret);
      return ret;
    } catch (ex) {
      console.error('[db_interface_impl]put.error', ex, table);
    }
    return data;
  }

  async putAll<T = resultObject>(table: DbRefer, data: T[], options?: PutAllOptions, _account?: string): Promise<T[]> {
    if (data.length === 0) {
      return data;
    }

    const asSoon = false;
    const supportTypes = this.checkLocalSupportType(
      Object.assign(table, {
        asSoon,
      })
    );

    // 理论上这个逻辑不会被trigger
    if (!Array.isArray(supportTypes)) {
      throw new Error('loki or dexie');
    }

    let ret: T[] = [];
    if (supportTypes.length === 1) {
      ret = await this[supportTypes[0] === 'loki' ? 'memoryApi' : 'dbApi']!.putAll(table, data, options, _account);
    } else {
      this.memoryApi.putAll(table, cloneDeep(data), undefined, _account);
      ret = await this.dbApi.putAll(table, data, options, _account);
    }

    if (!ret) {
      console.error('putAll error');
      return [];
    }
    const supportCache = options?.supportCache || 'enable';
    if (supportCache === 'enable') {
      this.searchDbHelper.watchDBPutOperation(table, ret);
    }

    return ret;
  }

  async bulkPut<T = resultObject>(table: DbRefer, data: T[], _account?: string): Promise<T[]> {
    const asSoon = false;
    const supportTypes = this.checkLocalSupportType(
      Object.assign(table, {
        asSoon,
      })
    );

    // 理论上这个逻辑不会被trigger
    if (!Array.isArray(supportTypes)) {
      throw new Error('loki or dexie');
    }

    let ret: T[] = [];
    if (supportTypes.length === 1) {
      ret = await this[supportTypes[0] === 'loki' ? 'memoryApi' : 'dbApi']!.bulkPut(table, data, _account);
    } else {
      this.memoryApi.bulkPut(table, cloneDeep(data), _account);
      ret = await this.dbApi.bulkPut(table, cloneDeep(data), _account);
    }

    if (!ret) {
      console.error('putAll error');
      return [];
    }
    // this.searchDbHelper.putRawData(table, ret);
    return ret;
  }

  deleteDB(dbName: string, _account?: string): Promise<{ success: boolean }> {
    return this.dbApi.deleteDB(dbName, _account);
  }

  removeAccountAction(emailMD5: string) {
    this.dbApi.removeAccountAction(emailMD5);
  }

  getByEqConditionWithTotal<T = resultObject>(query: QueryConfig, _account?: string): Promise<{ totalCount: number; data: T[] }> {
    return this.dbApi.getByEqConditionWithTotal ? this.dbApi.getByEqConditionWithTotal(query, _account) : Promise.reject('no getByEqConditionWithTotal');
  }

  getByRangeConditionWithTotalCount<T = resultObject>(query: AdQueryConfig, _account?: string): Promise<{ totalCount: number; data: T[] }> {
    return this.dbApi.getByRangeConditionWithTotalCount
      ? this.dbApi.getByRangeConditionWithTotalCount(query, _account)
      : Promise.reject('no getByRangeConditionWithTotalCount');
  }

  async clear(dbRefer: DbRefer, _account?: string) {
    await this.dbApi.clear(dbRefer, _account);
    return true;
  }

  getTotalDatabaseNames(filterDbName?: boolean) {
    return this.dbApi.getTotalDatabaseNames(filterDbName);
  }
}

const impl: Api = new DBInterfaceImpl();
api.registerLogicalApi(impl);
export default impl;
