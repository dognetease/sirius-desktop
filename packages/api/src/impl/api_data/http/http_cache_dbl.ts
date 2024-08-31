// // import lf, {schema} from "lovefield";
// // import im from 'web/src/components/Layout/IM/im';
//
// // import {lf} from '../../../api/data/lovefield'
// import { DBList, identity, NewDBApi } from '../../../api/data/new_db';
// import { api } from '../../../api/api';
// import { ApiRequestConfig, ApiResponse } from '../../../api/data/http';
// import { resultObject, User } from '../../../api/_base/api';
// import { HttpCacheNewDbl } from './dexie_db_api_impl_new';
// // import dataStore from "../store/data_store_impl";
// // import util from "../../util";
// // import im from "web/src/components/Layout/IM/im";
//
// export default class HttpCacheDb implements HttpCacheNewDbl {
//   private dbApi: NewDBApi;
//   private readonly dbName: DBList = "caches";
//   private readonly cacheTable = "http";
//   private readonly host: string;
//   // private httpStart: RegExp;
//   private readonly defaultExpiredTime: number = 30 * 24 * 3600 * 100;
//   inited:boolean;
//
//   constructor(host: string) {
//     this.host = host;
//     this.dbApi = api.getNewDBApi();
//     this.inited=false;
//     // this.httpStart = new RegExp("^https?://" + this.host, "i");
//   }
//
//   // connect(table: string[], callback: connectCallback): Promise<any> {
//   //   return this.dbApi.connect(this.dbName).then((db: identity<Database>) => {
//   //     const tbs = table.map(item => db.getSchema().table(item));
//   //     return callback(db, tbs);
//   //   }).catch((reason: Error) => {
//   //     console.error("execute Error", reason);
//   //   });
//   // }
//
//   /**
//    *
//    * @param req
//    * @param res
//    */
// // {
// //   name: "id",
// //   type: Type.STRING,
// // },
// // {
// //   name: "urlPath",
// //       type: Type.STRING,
// // },
// // {
// //   name: "urlKeyParam",
// //       type: Type.STRING,
// // },
// // {
// //   name: "urlSubParam",
// //       type: Type.STRING,
// // },
// // {
// //   name: "content",
// //       type: Type.STRING,
// // },
// // {
// //   name: "contentSize",
// //       type: Type.NUMBER,
// // },
// // {
// //   name: "createTime",
// //       type: Type.DATE_TIME,
// // },
// // {
// //   name: "expiredTime",
// //   type: Type.NUMBER,
// // },
//
//   put(req: ApiRequestConfig, res: ApiResponse): Promise<any> {
//     if (!this.inited) return Promise.reject('not inited');
//     if (req.expiredPeriod && req.expiredPeriod < 0) return Promise.resolve();
//     const time = new Date().getTime();
//     const content = JSON.stringify(res),
//       data: object = {
//         id: req.rqKey || '_',
//         urlPath: req.url?.replace(this.host, ''),
//         urlKeyParam: '',
//         urlSubParam: '',
//         content: content,
//         contentSize: content.length,
//         createTime: time,
//         expiredTime: time + (req.expiredPeriod || this.defaultExpiredTime),
//       };
//     return this.dbApi.insertOrReplace({
//       dbName: this.dbName,
//       tableName: this.cacheTable,
//       rows: [data],
//     });
//   }
//
//   get(content: ApiRequestConfig): Promise<resultObject | undefined> {
//     if (!this.inited) return Promise.reject('not inited');
//     console.log('get rqkey from db:', content.rqKey);
//     return new Promise<resultObject | undefined>((r, j) => {
//       const tid = setTimeout(() => {
//         j('time out');
//       }, 2500);
//       this.dbApi.select({
//         dbName: this.dbName,
//         tableName: this.cacheTable,
//         where: (tb: identity<lf.schema.Table>) => {
//           return window.lf.op.and(tb.id.eq(content.rqKey || '_'));
//         },
//       }).then((re: resultObject[]) => {
//         console.log('request cache return :', re);
//         clearTimeout(tid);
//         if (re && re.length == 1) {
//           return r(re[0]);
//         } else {
//           return r(undefined);
//         }
//       }).catch((reason) => {
//         clearTimeout(tid);
//         console.warn(reason);
//         return r(undefined);
//       });
//
//     });
//
//   }
//
//   clear() {
//     if (!this.inited) return Promise.reject('not inited');
//     return this.dbApi.delete({
//       dbName: this.dbName,
//       tableName: this.cacheTable,
//       where: (tb: identity<lf.schema.Table>) => {
//         return window.lf.op.and(tb.expiredTime.lt(new Date().getTime()));
//       },
//     });
//   }
//
//   deleteItem(rqKey: string) {
//     if (!this.inited) return Promise.reject('not inited');
//     return this.dbApi.delete({
//       dbName: this.dbName,
//       tableName: this.cacheTable,
//       where: (tb: identity<lf.schema.Table>) => {
//         return window.lf.op.and(tb.id.eq(rqKey));
//       },
//     });
//   }
//
//   init(user?: User) {
//     let db = this.dbApi.getDB(this.dbName);
//     if (db?.schemaBuilder) {
//       this.dbApi.close(this.dbName);
//     }
//     this.dbApi.initDb(this.dbName, user);
//     this.inited = true;
//   }
//
//   close() {
//     this.dbApi.close(this.dbName);
//     this.inited = false;
//   }
// }
