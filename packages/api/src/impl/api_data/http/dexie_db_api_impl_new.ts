// import { DatabaseHolderInterface, } from '../../../api/data/db';
import { config } from 'env_def';
import { resultObject } from '../../../api/_base/api';
import { ApiRequestConfig, ApiResponse } from '../../../api/data/http';
import { DbApiV2, DBList } from '../../../api/data/new_db';
import { apis } from '../../../config';
import { api } from '../../../api/api';

// import { DexieDbApiImpl } from '../db/daxie_db_impl';

export interface HttpCacheNewDbl {
  /**
   *
   * @param req
   * @param res
   */
  // {
  //   name: "id",
  //   type: Type.STRING,
  // },
  // {
  //   name: "urlPath",
  //       type: Type.STRING,
  // },
  // {
  //   name: "urlKeyParam",
  //       type: Type.STRING,
  // },
  // {
  //   name: "urlSubParam",
  //       type: Type.STRING,
  // },
  // {
  //   name: "content",
  //       type: Type.STRING,
  // },
  // {
  //   name: "contentSize",
  //       type: Type.NUMBER,
  // },
  // {
  //   name: "createTime",
  //       type: Type.DATE_TIME,
  // },
  // {
  //   name: "expiredTime",
  //   type: Type.NUMBER,
  // },

  put(req: ApiRequestConfig, res: ApiResponse): Promise<any>;

  get(content: ApiRequestConfig): Promise<resultObject | undefined>;

  clear(): any;

  deleteItem(rqKey: string): Promise<any>;

  init(): void;

  close(): void;
}

export const tableDefs = {};

export class HttpCacheNewImpl implements HttpCacheNewDbl {
  readonly dbName = 'caches';

  private readonly host: string;

  inited = false;

  readonly table = { tableName: 'http', dbName: this.dbName as DBList };

  private readonly defaultExpiredTime: number = 14 * 24 * 3600 * 1000;

  db: DbApiV2;

  constructor() {
    this.db = api.requireLogicalApi(apis.dbInterfaceApiImpl) as DbApiV2;
    this.host = config('host') as string;
  }

  clear(): any {}

  close(): void {
    this.inited = false;
  }

  deleteItem(rqKey: string): Promise<any> {
    if (!this.inited) {
      return Promise.reject('not inited');
    }
    return this.db.deleteById(this.table, rqKey);
  }

  get(content: ApiRequestConfig): Promise<resultObject | undefined> {
    console.log('[http-cache] get http cache for ', content);
    if (!this.inited) {
      return Promise.reject('not inited');
    }
    if (content && content.rqKey) {
      return this.db.getById(this.table, content.rqKey);
    }
    return Promise.resolve(undefined);
  }

  init(): void {
    this.db.initDb(this.dbName);
    this.inited = true;
  }

  put(req: ApiRequestConfig, res: ApiResponse): Promise<any> {
    console.log('[http-cache] put http request cache:', req, res);
    if (!this.inited) {
      return Promise.reject('not inited');
    }
    if (req.expiredPeriod && req.expiredPeriod < 0) {
      return Promise.resolve();
    }
    const time = new Date().getTime();
    const content = JSON.stringify(res);
    const data: object = {
      id: req.rqKey || '_',
      urlPath: req.url?.replace(this.host, ''),
      urlKeyParam: '',
      urlSubParam: '',
      content,
      contentSize: content.length,
      createTime: time,
      expiredTime: time + (req.expiredPeriod || this.defaultExpiredTime),
    };
    return this.db.put(this.table, data);
  }
}

// export const dbNew = new DexieDbApiImpl();

export const httpCacheImpl = new HttpCacheNewImpl();
