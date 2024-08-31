// // DB搜索加速功能
// import lodashGet from 'lodash/get';
// import zipObject from 'lodash/zipObject';
// import groupBy from 'lodash/groupBy';
// import lodashIntersection from 'lodash/intersection';
// // import { ContactAndOrgApi } from '@/api/logical/contactAndOrg';
// import { resultObject } from '@/api/_base/api';
// import { apis, inWindow, supportLocalIndexedDB, getShouldInitMemoryDBInMainPage } from '@/config';
// import { api as masterApi } from '@/api/api';
// import { AdQueryConfig, DbApiV2, DBList, DbRefer } from '@/api/data/new_db';
// //  Array<column<columnPropDef>>
// import { DataTrackerApi } from '@/api/data/dataTracker';
// import { wait } from '@/api/util/index';

// // import db_tables from '../../../api/data/db_tables';

// /**
//  * 转换格式定义
//  * sourceList[index].primaryKey(唯一主键)定义说明:
//  * 1.如果是string 表示source/target 定义一致
//  * 2.如果是map 表示source-target的映射关系.filter可选 表示筛选函数
//  * sourceList[index].column[index]定义说明:
//  * 1.如果是string 表示source/target 定义一致
//  * 2.如果是map 表示source-target的映射关系
//  * 3.
//  */

// interface LokiRawColumnBaseConfig {
//   source: string;
//   target: string;
// }

// interface LokiRawColumnConfig extends LokiRawColumnBaseConfig {
//   // 类型 insert表示要插入到已有字段中去.如果是cover表示是要直接覆盖
//   opeartionType?: 'insert' | 'cover';
//   // 数据类型 如果是single表示直接push到新表中去 如果是复合表示的是创建一个数组把当前数给包起来
//   dataType?: 'single' | 'complex';
//   filter?: (rawData: any) => boolean;
//   switch?: (field: any) => any;
// }

// interface LokiSourceConfig {
//   mapPath: string;
//   dbName: string;
//   tableName: string;
//   column: (string | LokiRawColumnConfig)[];
//   primaryKey: (string | LokiRawColumnBaseConfig)[];
//   // 当前数据依赖于哪个表的数据 作为插入排序依据
//   depends?: string[];
// }

// const SOURCEDB_FULL_PATH = {
//   CONTACT_GLOBAL_CONTACT: ['contact_global', 'contact'].join('.'),
//   CONTACT_GLOBAL_ORG: ['contact_global', 'org'].join('.'),
//   CONTACT_GLOBAL_ORGMANAGER: ['contact_global', 'orgManager'].join('.'),
//   CONTACT_GLOBAL_ORGCONTACT: ['contact_global', 'orgContact'].join('.'),
// };

// const EMD_CONTACT_SEARCH = {
//   dbName: 'edm_contact_search' as DBList,
//   tables: {
//     contact: 'contact',
//     org: 'org',
//   },
// };

// const lokiRawDataMapConfig: LokiSourceConfig[] = [
//   /**
//    * 以下是edm配置
//    */
//   // edm的cotact表 目标contact
//   {
//     dbName: EMD_CONTACT_SEARCH.dbName,
//     tableName: EMD_CONTACT_SEARCH.tables.contact,
//     mapPath: SOURCEDB_FULL_PATH.CONTACT_GLOBAL_CONTACT,
//     column: [
//       'id',
//       {
//         source: 'name',
//         target: 'contactName',
//       },
//       {
//         source: 'account',
//         target: 'accountName',
//       },
//       {
//         source: 'customerType',
//         target: 'type',
//       },
//       'contactPYName',
//       'contactPYLabelName',
//       '_lastUpdateTime',
//       '_company',
//     ],
//     primaryKey: ['id'],
//   },
//   // edm的org表 目标contact
//   {
//     dbName: EMD_CONTACT_SEARCH.dbName,
//     tableName: EMD_CONTACT_SEARCH.tables.contact,
//     mapPath: SOURCEDB_FULL_PATH.CONTACT_GLOBAL_ORG,
//     column: [
//       {
//         source: 'id',
//         target: 'orgId',
//       },
//     ],
//     primaryKey: [
//       {
//         source: 'id',
//         target: 'orgId',
//       },
//     ],
//   },
//   // edm的orgContact表  目标contact
//   {
//     dbName: EMD_CONTACT_SEARCH.dbName,
//     tableName: EMD_CONTACT_SEARCH.tables.contact,
//     mapPath: SOURCEDB_FULL_PATH.CONTACT_GLOBAL_ORGCONTACT,
//     column: [
//       'orgId',
//       {
//         source: 'contactId',
//         target: 'id',
//       },
//     ],
//     primaryKey: [
//       'orgId',
//       {
//         source: 'contactId',
//         target: 'id',
//       },
//     ],
//   },
//   // edm的orgManager写入到contact
//   {
//     dbName: EMD_CONTACT_SEARCH.dbName,
//     tableName: EMD_CONTACT_SEARCH.tables.contact,
//     mapPath: SOURCEDB_FULL_PATH.CONTACT_GLOBAL_ORGMANAGER,
//     column: [
//       'orgId',
//       {
//         source: 'managerId',
//         target: 'managerList',
//         opeartionType: 'insert',
//         dataType: 'complex',
//       },
//     ],
//     primaryKey: ['id'],
//   },
//   // edm的org表 目标org
//   {
//     dbName: EMD_CONTACT_SEARCH.dbName,
//     tableName: EMD_CONTACT_SEARCH.tables.org,
//     mapPath: SOURCEDB_FULL_PATH.CONTACT_GLOBAL_ORG,
//     column: ['id', 'orgName', 'orgPYName', 'type', 'orgRank', '_company', '_lastUpdateTime'],
//     primaryKey: ['id'],
//   },
//   // edm的orgManager写入到org表里面
//   {
//     dbName: EMD_CONTACT_SEARCH.dbName,
//     tableName: EMD_CONTACT_SEARCH.tables.org,
//     mapPath: SOURCEDB_FULL_PATH.CONTACT_GLOBAL_ORGMANAGER,
//     column: [
//       {
//         source: 'orgId',
//         target: 'id',
//       },
//       {
//         source: 'managerId',
//         target: 'managerList',
//         opeartionType: 'insert',
//         dataType: 'complex',
//       },
//     ],
//     primaryKey: ['id'],
//   },
// ];

// export interface SearchDBHelperInterface {
//   doCreateLokiData(): Promise<void>;

//   watchDBPutOperation<T = resultObject>(table: DbRefer, items: T | T[]): Promise<void>;

//   deleteRawData(query: AdQueryConfig, needTransform?: boolean): Promise<void>;

//   testMemoryDataOk(dbRefer: AdQueryConfig): Promise<{
//     type: 'miss' | 'empty' | 'ok';
//     loki?: number;
//     db?: number;
//   }>;
// }

// class SearchEdmDBHelper implements SearchDBHelperInterface {
//   dataTrackerApi: DataTrackerApi;

//   private dbApi: DbApiV2;

//   private lokiApi: DbApiV2;

//   private systemApi = masterApi.getSystemApi();

//   // key是原始tableName+目标tableName
//   private lokiSourceConfigMap: Map<string, LokiSourceConfig> = new Map();

//   private lokiSourceTables: Map<string, string> = new Map();

//   private emdContactTable: Map<string, resultObject> = new Map();

//   private emdOrgTable: Map<string, resultObject> = new Map();

//   private emdOrgManagerTable: Map<string, Record<'managerId', string[]>> = new Map();

//   private emdOrgContactTable: Map<string, string> = new Map();

//   constructor() {
//     this.dataTrackerApi = masterApi.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;
//     this.dbApi = masterApi.requireLogicalApi(apis.dexieDbApi) as DbApiV2;
//     this.lokiApi = masterApi.requireLogicalApi(apis.dbMemoryApiImpl) as DbApiV2;

//     lokiRawDataMapConfig.forEach(item => {
//       const uniqueKey = `[${item.tableName}+${item.mapPath}]`;
//       this.lokiSourceConfigMap.set(uniqueKey, item);
//       this.lokiSourceTables.set(uniqueKey, item.mapPath);
//     });
//   }

//   // 清理无效数据(数据要整条完整数据写入 只有部分信息的数据要定时清理 避免内存泄露)
//   private cleanInvalidEdmRaw() {
//     // orgContact表中存储的contactId&orgId
//     const relateOrgIds = [...this.emdOrgContactTable.values()];
//     const relateContactIds = [...this.emdOrgContactTable.values()];

//     // 其他表中存储的contactId或者orgId只要没有包含在relate列表中 表示没有办法生成完整数据要直接删掉
//     const totalOrgIds = [...this.emdOrgTable.keys()];
//     const totalOrgManagerIds = [...this.emdOrgManagerTable.keys()];
//     const totalContactIds = [...this.emdContactTable.keys()];

//     const remainOrgTable: Map<string, resultObject> = new Map();
//     lodashIntersection(relateOrgIds, totalOrgIds).forEach(orgId => {
//       const orgItem = this.emdOrgTable.get(orgId);
//       !!orgItem && remainOrgTable.set(orgId, orgItem);
//     });
//     // 存储有效orgMap
//     this.emdOrgTable = remainOrgTable;

//     const remainOrgManagerTable: Map<string, Record<'managerId', string[]>> = new Map();
//     lodashIntersection(relateOrgIds, totalOrgManagerIds).forEach(orgId => {
//       const orgManagerItem = this.emdOrgManagerTable.get(orgId);
//       !!orgManagerItem && remainOrgManagerTable.set(orgId, orgManagerItem);
//     });
//     this.emdOrgManagerTable = remainOrgManagerTable;

//     const remainContactTable: Map<string, resultObject> = new Map();
//     lodashIntersection(relateContactIds, totalContactIds).forEach(contactId => {
//       const contactItem = this.emdOrgManagerTable.get(contactId);
//       !!contactItem && remainContactTable.set(contactId, contactItem);
//     });
//     this.emdContactTable = remainContactTable;
//   }

//   async doCreateLokiData() {}

//   async initLokiDataFromDB() {
//     this.generateEdmSearchDataFromDB();
//   }

//   // 存储正在执行数据初始化的collection name
//   private edmGenerateLockMap: Set<string> = new Set();

//   // 创建通讯录搜索表
//   async generateEdmSearchDataFromDB() {
//     // 先只在数据后台创建搜索内存表
//     if (this.edmGenerateLockMap.size > 0) {
//       return;
//     }

//     const edmSourceTables = new Set([...this.lokiSourceTables.values()]);
//     const edmConfigKeys = [...edmSourceTables].filter(item => item.indexOf('global') !== -1);
//     this.edmGenerateLockMap.add('global');

//     const requestList = edmConfigKeys.map(async mapKey => {
//       const [_dbName, _tableName] = mapKey.split('.') as [string, string];
//       const dbRefer = {
//         dbName: _dbName,
//         tableName: _tableName,
//         _dbAccount: 'global',
//       } as unknown as DbRefer;
//       return this.getTableRawdata(dbRefer);
//     });

//     Promise.all(requestList)
//       .then(rawDataList => {
//         this.generateEdmSearchData(edmConfigKeys, rawDataList);
//       })
//       .catch((err: Error) => {
//         console.error('[loki]createFailed.edm', err);
//       })
//       .then(() => {
//         this.edmGenerateLockMap.delete('global');
//       });
//   }

//   // 如果loki数据长度不到DB数据的90%
//   async testMemoryDataOk(dbRefer: AdQueryConfig): Promise<{
//     type: 'miss' | 'empty' | 'ok';
//     loki?: number;
//     db?: number;
//   }> {
//     // 只有内存表的contact能触发检测逻辑
//     if (dbRefer.dbName !== 'contact_search' || dbRefer.tableName !== 'contact') {
//       return { type: 'ok' };
//     }

//     const [lokiCount = 0, dbCount = 0] = await Promise.all([
//       this.lokiApi.getTableCount({
//         dbName: 'contact_search',
//         tableName: 'contact',
//       }),
//       this.dbApi.getTableCount({
//         dbName: 'contact_dexie',
//         tableName: 'contact',
//       }),
//     ]);

//     if (dbCount === 0) {
//       return { type: 'ok' };
//     }

//     if (lokiCount === 0) {
//       return { type: 'empty' };
//     }

//     return lokiCount > 0.99 * dbCount ? { type: 'ok' } : { type: 'miss', loki: lokiCount, db: dbCount };
//   }

//   private canCreateSearchData(dbRefer: DbRefer) {
//     // 支持在数据后台创建内存数据
//     // 暂时注释调用创建内存数据功能 需要重新调试
//     if (!inWindow()) {
//       return false;
//     }
//     const shouldInitMemoryDBInMainPage = getShouldInitMemoryDBInMainPage();
//     if (shouldInitMemoryDBInMainPage && !this.systemApi.isMainPage()) {
//       return false;
//     }
//     if (!window.isBridgeWorker) {
//       return false;
//     }

//     return [...this.lokiSourceTables.values()].includes([dbRefer.dbName, dbRefer.tableName].join('.'));
//   }

//   private async getTableRawdata(dbQuery: AdQueryConfig): Promise<resultObject[]> {
//     if (!supportLocalIndexedDB() || !['contact_dexie', 'contact_global'].includes(dbQuery.dbName)) {
//       return Promise.resolve([]);
//     }

//     return this.dbApi.getByRangeCondition(dbQuery);
//   }

//   // 开始构建edm搜索数据
//   private async generateEdmSearchData(sourceConfigList: string[], rawDataCollection: resultObject[][]) {
//     const rawDataMap = zipObject(sourceConfigList, rawDataCollection);

//     // 先创建contactMap表
//     // 现针对contact表和org表分别创建对应的部分数据 并且利用各自的primaryKey去生成所以
//     // 然后在利用orgContact里面的contactId&orgId把这两个数据关联起来
//     const contactRawKey = SOURCEDB_FULL_PATH.CONTACT_GLOBAL_CONTACT;
//     this.emdContactTable = new Map(rawDataMap[contactRawKey].map(item => [item.id, item]));

//     const orgRawKey = SOURCEDB_FULL_PATH.CONTACT_GLOBAL_ORG;
//     this.emdOrgTable = new Map(rawDataMap[orgRawKey].map(item => [item.id, item]));

//     const orgContactRawKey = SOURCEDB_FULL_PATH.CONTACT_GLOBAL_ORGCONTACT;
//     this.emdOrgContactTable = new Map(rawDataMap[orgContactRawKey].map(item => [item.contactId, item.orgId]));

//     const orgManagerKey = SOURCEDB_FULL_PATH.CONTACT_GLOBAL_ORGMANAGER;
//     const groupData: Record<string, resultObject[]> = groupBy(rawDataMap[orgManagerKey], (rawData: resultObject) => rawData.orgId as string);
//     Object.keys(groupData).forEach(orgId => {
//       this.emdOrgManagerTable.set(orgId, {
//         managerId: groupData[orgId]!.map(item => item.managerId),
//       });
//     });
//     return Promise.all([this.putEmdContactSearch(), this.putEmdOrg()]);
//   }

//   async putEmdContactSearch() {
//     const contactOrgIdKeys = [...this.emdOrgContactTable.keys()].filter(contactId => {
//       const orgId = this.emdOrgContactTable.get(contactId)!;
//       return this.emdContactTable.has(contactId) && this.emdOrgTable.has(orgId);
//     });

//     if (!contactOrgIdKeys.length) {
//       return;
//     }

//     // 最终要写入的contactSearchList
//     const contactFullPath = `[${EMD_CONTACT_SEARCH.tables.contact}+${SOURCEDB_FULL_PATH.CONTACT_GLOBAL_CONTACT}]`;
//     const orgFullPath = `[${EMD_CONTACT_SEARCH.tables.contact}+${SOURCEDB_FULL_PATH.CONTACT_GLOBAL_ORG}]`;
//     const orgManagerFullPath = `[${EMD_CONTACT_SEARCH.tables.contact}+${SOURCEDB_FULL_PATH.CONTACT_GLOBAL_ORGMANAGER}]`;

//     // 开始拼装contactSearch数据
//     const contactSearchRawData = contactOrgIdKeys.map(contactId => {
//       const orgId = this.emdOrgContactTable.get(contactId)!;
//       return {
//         ...this.convertRawFormat(this.emdContactTable.get(contactId)!, this.lokiSourceConfigMap.get(contactFullPath)!.column),
//         ...this.convertRawFormat(this.emdOrgTable.get(orgId)!, this.lokiSourceConfigMap.get(orgFullPath)!.column),
//         ...this.convertRawFormat(this.emdOrgManagerTable.get(orgId)!, this.lokiSourceConfigMap.get(orgManagerFullPath)!.column),
//       };
//     });
//     if (contactSearchRawData.length) {
//       this.lokiApi.deleteByByRangeCondition({
//         dbName: EMD_CONTACT_SEARCH.dbName,
//         tableName: EMD_CONTACT_SEARCH.tables.contact,
//         adCondition: {
//           type: 'anyOf',
//           field: ['id'],
//           args: contactSearchRawData.map(item => item.id),
//         },
//       });
//       this.putRaw2Loki(
//         {
//           dbName: EMD_CONTACT_SEARCH.dbName,
//           tableName: EMD_CONTACT_SEARCH.tables.contact,
//         },
//         contactSearchRawData,
//         { mode: 'batch' }
//       );
//     }

//     // 清空临时存储
//     await wait(1000);
//     // todo:这里是全量清空 还是只清空已写入的数据
//     contactOrgIdKeys.forEach(contactId => {
//       const orgId = this.emdOrgContactTable.get(contactId)!;
//       this.emdContactTable.delete(contactId);
//       this.emdOrgContactTable.delete(contactId);
//       this.emdOrgTable.delete(orgId);
//       this.emdOrgManagerTable.delete(orgId);
//     });
//   }

//   putEmdOrg() {
//     const orgFullPath = `[${EMD_CONTACT_SEARCH.tables.org}+${SOURCEDB_FULL_PATH.CONTACT_GLOBAL_ORG}]`;
//     const orgManagerFullPath = `[${EMD_CONTACT_SEARCH.tables.org}+${SOURCEDB_FULL_PATH.CONTACT_GLOBAL_ORGMANAGER}]`;

//     const edmOrgList = [...this.emdOrgTable.keys()].map(orgId => {
//       if (!this.emdOrgManagerTable.has(orgId)) {
//         return this.convertRawFormat(this.emdOrgTable.get(orgId)!, this.lokiSourceConfigMap.get(orgFullPath)!.column);
//       }

//       return {
//         ...this.convertRawFormat(this.emdOrgTable.get(orgId)!, this.lokiSourceConfigMap.get(orgFullPath)!.column),
//         ...this.convertRawFormat(this.emdOrgManagerTable.get(orgId)!, this.lokiSourceConfigMap.get(orgManagerFullPath)!.column),
//       };
//     });

//     this.lokiApi.deleteByByRangeCondition({
//       dbName: EMD_CONTACT_SEARCH.dbName,
//       tableName: EMD_CONTACT_SEARCH.tables.org,
//       adCondition: {
//         type: 'anyOf',
//         field: ['id'],
//         args: edmOrgList.map(item => item.id),
//       },
//     });

//     this.putRaw2Loki(
//       {
//         dbName: EMD_CONTACT_SEARCH.dbName,
//         tableName: EMD_CONTACT_SEARCH.tables.org,
//       },
//       edmOrgList,
//       { mode: 'batch' }
//     );
//   }

//   // 数据格式转换 将原始table中的数据格式转换成内存表的数据格式
//   private convertRawFormat(_rawData: resultObject, column: (string | LokiRawColumnConfig)[]) {
//     const rawData: resultObject = {};
//     _rawData &&
//       column.forEach(item => {
//         const targetKey = typeof item === 'string' ? item : item.target;
//         const sourceKey = typeof item === 'string' ? item : item.source;
//         if (Reflect.has(_rawData, sourceKey)) {
//           let targetVal = _rawData[sourceKey];
//           if (typeof item !== 'string' && typeof item.switch === 'function') {
//             targetVal = item.switch(targetVal);
//           }
//           Reflect.set(rawData, targetKey, targetVal);
//         }
//       });
//     return rawData;
//   }

//   /**
//    * 将数据写入到loki内存中
//    * @param dbRefer 目标表信息
//    * @param rawData 数据
//    * @param options 配置
//    * @param options.mode 批量写入还是单次写入
//    * @param options.writeType 是覆盖还是插入
//    */
//   private async putRaw2Loki(
//     dbRefer: DbRefer,
//     rawData: resultObject[],
//     options: {
//       mode?: 'batch' | 'single';
//       writeType?: 'cover' | 'insert';
//     } = { mode: 'single', writeType: 'cover' }
//   ) {
//     const { mode, writeType } = options;
//     if (mode === 'batch') {
//       this.lokiApi.putAll(dbRefer, rawData);
//       return;
//     }
//     // 如果搜索数据来源是不同表的数据 数据索引非目标表的唯一索引的话要使用insert方法
//     // 否则会产生只有部分数据的垃圾数据
//     // todo: 要等到增量写入的时候使用调用
//     if (writeType === 'insert') {
//       console.log('xxxxx');
//     }

//     rawData.forEach(rawDataItem => {
//       this.lokiApi.put(dbRefer, rawDataItem);
//     });
//   }

//   // 监听DB的写入操作
//   async watchDBPutOperation(dbRefer: DbRefer, _items: resultObject | resultObject[]) {
//     if (!this.canCreateSearchData(dbRefer)) {
//       return;
//     }

//     // 避免影响主业务流程
//     await wait(100);

//     if (dbRefer.dbName !== 'contact_global') {
//       return;
//     }
//     const items = Array.isArray(_items) ? _items : [_items];
//     switch (dbRefer.tableName) {
//       case 'contact': {
//         const tempTable = new Map(items.map(item => [item.id, item]));
//         this.emdContactTable = new Map([...this.emdContactTable, ...tempTable]);
//         break;
//       }
//       case 'org': {
//         const tempOrgTable = new Map(items.map(item => [item.id, item]));
//         this.emdOrgTable = new Map([...this.emdOrgTable, ...tempOrgTable]);
//         break;
//       }
//       case 'orgManager': {
//         const groupData: Record<string, resultObject[]> = groupBy(items, (rawData: resultObject) => rawData.orgId as string);
//         Object.keys(groupData).forEach(orgId => {
//           this.emdOrgManagerTable.set(orgId, {
//             managerId: groupData[orgId]!.map(item => item.managerId),
//           });
//         });
//         break;
//       }
//       case 'orgContact': {
//         const tempOrgContactTable = new Map(items.map(item => [item.contactId, item.orgId]));
//         this.emdOrgContactTable = new Map([...this.emdOrgContactTable, ...tempOrgContactTable]);
//         break;
//       }
//       default:
//     }
//     // 延迟写入Edm数据
//     this.debouncePutEdmRaw();
//   }

//   private debouncePutEdmRaw(): void {
//     this.putEmdContactSearch();
//     this.putEmdOrg();
//   }

//   async deleteRawData(query: AdQueryConfig, needTransform = true) {
//     if (!this.canCreateSearchData(query)) {
//       return;
//     }

//     // 如果没有配置field
//     if (lodashGet(query, 'adCondition.field.length', 0) === 0) {
//       return;
//     }

//     const _field = query.adCondition!.field!;
//     const newQuery = { ...query };
//     // 这个要做索引转换吗？
//     // 利用column做转换吧
//     const configList = [...this.lokiSourceConfigMap.values()];

//     configList.forEach(sourceConfig => {
//       if (sourceConfig.mapPath !== [query.dbName, query.tableName].join('.')) {
//         return;
//       }

//       const transferMap: Record<string, string> = {};
//       sourceConfig.column.forEach(item => {
//         if (typeof item === 'string') {
//           transferMap[item] = item;
//         } else {
//           transferMap[item.source] = item.target;
//         }
//       });
//       // 不需要配置转换的话直接把对应的ID
//       if (!needTransform) {
//         console.log('[contact_edm_search_helper]');
//       } else if (Array.isArray(_field)) {
//         newQuery.adCondition!.field = _field.map(fiedItem => transferMap[fiedItem]);
//       } else {
//         newQuery.adCondition!.field = transferMap[_field];
//       }
//       newQuery.tableName = sourceConfig.tableName;
//       newQuery.dbName = sourceConfig.dbName as DBList;

//       this.lokiApi.deleteByByRangeCondition(newQuery);
//     });
//   }
// }

// export const searchEdmDbHelper = new SearchEdmDBHelper();
