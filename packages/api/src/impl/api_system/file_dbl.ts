// import lf, {schema} from "lovefield";
// import im from 'web/src/components/Layout/IM/im';

// import { lf } from '../../api/data/lovefield';
import { DbApiV2, DBList } from '../../api/data/new_db';
import { api } from '../../api/api';
// import {ApiRequestConfig, ApiResponse} from "../../../api/data/http";
import { resultObject } from '../../api/_base/api';
import { FileAttachModel, ImportMailModel } from '../../api/system/fileLoader';
import { apis } from '../../config';
import { util } from '../../api/util/index';
// import dataStore from "../store/data_store_impl";
// import util from "../../util";
// import im from "web/src/components/Layout/IM/im";

export default class FileManageDb {
  dbApi: DbApiV2;

  private readonly dbName: DBList = 'fileop';

  private readonly fileTable = 'file';

  private readonly importMailTable = 'import_mail';
  // private readonly host: string;
  // private httpStart: RegExp;
  // private readonly defaultExpiredTime: number = 30 * 24 * 3600 * 100;

  constructor() {
    // this.host = host;
    this.dbApi = api.requireLogicalApi(apis.dbInterfaceApiImpl) as DbApiV2;
    // this.httpStart = new RegExp("^https?://" + this.host, "i");
  }

  // connect(table: string[], callback: connectCallback): Promise<any> {
  //   return this.dbApi.connect(this.dbName).then((db: identity<Database>) => {
  //     const tbs = table.map(item => db.getSchema().table(item));
  //     return callback(db, tbs);
  //   }).catch((reason: Error) => {
  //     console.error("execute Error", reason);
  //   });
  // }

  /**
   *
   * @param file
   */
  // {
  //   name: "fid",
  //   type: Type.NUMBER,
  // },
  // {
  //   name: "fileName",
  //       type: Type.STRING,
  // },
  // {
  //   name: "filePath",
  //       type: Type.STRING,
  // },
  // {
  //   name: "fileUrl",
  //       type: Type.STRING,
  // },
  // {
  //   name: "fileExists",
  //       type: Type.BOOLEAN,
  // },
  // {
  //   name: "fileType",
  //       type: Type.STRING,
  // },
  // {
  //   name: "fileSize",
  //       type: Type.NUMBER,
  // },
  // {
  //   name: "fileMd5",
  //       type: Type.STRING,
  // },
  // {
  //   name: "createTime",
  //       type: Type.NUMBER,
  // },
  // {
  //   name: "fileSourceType",
  //   type: Type.NUMBER,
  // },
  // {
  //   name: "fileSourceKey",
  //       type: Type.STRING,
  // },
  put(file: FileAttachModel): Promise<FileAttachModel> {
    // if (req.expiredPeriod && req.expiredPeriod < 0) return Promise.resolve();
    const time = new Date().getTime();
    const data = this.mapFileAttachModelToObject(file, time);
    return this.dbApi
      .put(
        {
          dbName: this.dbName,
          tableName: this.fileTable,
          _dbAccount: file?._account,
        },
        data
      )
      .then((result: resultObject) => {
        const res = result.__prKey__;
        // const r = res[0];
        if (util.isNumber(res)) file.fid = Number(res);
        return file;
      });
  }

  get(key: string | number, type: keyof FileAttachModel, _account = ''): Promise<FileAttachModel[]> {
    return this.dbApi
      .getByEqCondition(
        {
          dbName: this.dbName,
          tableName: this.fileTable,
          query: { [type]: key },
          _dbAccount: _account,
        },
        //   where: (tb: identity<lf.schema.Table>) => {
        //     return window.lf.op.and(tb[type].eq(key || '_'));
        //
        //   orderBy: [{
        //     columnName: 'fid',
        //     desc: 1,
        //   }],
        // }
        _account
      )
      .then((re: resultObject[]) =>
        re
          .sort((a, b) => {
            if (a?.fid) {
              return b?.fid ? -(Number(a.fid) - Number(b.fid)) : -1;
            }
            return b?.fid ? 1 : 0;
          })
          .map(it => this.mapObjectToFileAttachModel(it))
      );
  }

  del(fid: number, _account = '') {
    return this.dbApi.deleteById(
      {
        dbName: this.dbName,
        tableName: this.fileTable,
        _dbAccount: _account,
      },
      fid
    );
  }

  delBatch(items: FileAttachModel[]) {
    if (!items || items.length === 0) return;
    setTimeout(() => {
      const fids = items
        .map(it => {
          if (it.filePath && window.electronLib.fsManage.isExist(it.filePath)) return undefined;
          return it.fid;
        })
        .filter(it => !!it) as number[];
      this.dbApi
        .deleteById(
          {
            dbName: this.dbName,
            tableName: this.fileTable,
            _dbAccount: items[0]?._account,
          },
          fids
        )
        .then();
    }, 10);
  }

  putImportMails(mailInfo: ImportMailModel[], _account?: string) {
    const time = new Date().getTime();
    const data = this.mapImportMailsModelToObj(mailInfo, time);
    return this.dbApi.putAll(
      {
        dbName: this.dbName,
        tableName: this.importMailTable,
        _dbAccount: _account,
      },
      data
    );
  }

  getImportMailByMd5(md5List: string[], _account?: string): Promise<ImportMailModel[]> {
    return this.dbApi
      .getByIds(
        {
          dbName: this.dbName,
          tableName: this.importMailTable,
          _dbAccount: _account,
        },
        md5List
      )
      .then((res: resultObject[]) => {
        res = res.length ? res.filter(item => item !== undefined) : [];
        if (res.length) {
          return this.mapObjToImportMailsModel(res);
        }
        return [];
      });
  }

  private mapImportMailsModelToObj(mailInfos: ImportMailModel[], time: number): resultObject[] {
    return mailInfos.map(
      info =>
        ({
          mailMd5: info.mailMd5,
          mid: info.mid,
          mailLocalPath: info.mailLocalPath,
          createTime: time,
        } as resultObject)
    );
  }

  private mapObjToImportMailsModel(mailInfos: resultObject[]): ImportMailModel[] {
    return mailInfos.map(
      info =>
        ({
          mailMd5: info.mailMd5,
          mid: info.mid,
          mailLocalPath: info.mailLocalPath,
          createTime: info.createTime,
        } as ImportMailModel)
    );
  }

  private mapFileAttachModelToObject(file: FileAttachModel, time: number) {
    const data: resultObject = {
      fid: file.fid,
      fileName: file.fileName,
      fileMd5: file.fileMd5,
      fileSize: file.fileSize,
      fileType: file.fileType,
      filePath: file.filePath,
      fileUrl: file.fileUrl,
      fileOriginUrl: file.fileOriginUrl || file.fileUrl || '_',
      fileSourceType: file.fileSourceType,
      fileSourceKey: file.fileSourceKey,
      fileStatus: file.fileStatus,
      createTime: time,
    };
    return data;
  }

  private mapObjectToFileAttachModel(it: resultObject) {
    return {
      fid: it.fid,
      fileName: it.fileName,
      fileMd5: it.fileMd5,
      fileSize: it.fileSize,
      fileType: it.fileType,
      filePath: it.filePath,
      fileUrl: it.fileUrl,
      fileSourceType: it.fileSourceType,
      fileSourceKey: it.fileSourceKey,
      fileStatus: it.fileStatus,
      fileRecorderTime: it.createTime,
    } as FileAttachModel;
  }

  init() {
    this.dbApi.initDb(this.dbName);
  }

  close() {
    this.dbApi.closeSpecific(this.dbName);
  }
}
