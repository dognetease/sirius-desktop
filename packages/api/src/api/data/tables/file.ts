import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';

export default {
  isConnecting: false,
  name: 'fileop',
  using: 'dexie',
  version: 3,
  waitConnectList: [],
  tables: [
    {
      name: 'file',
      columns: [
        {
          name: 'fid',
          type: lf.Type.INTEGER,
        },
        {
          name: 'fileName',
          type: lf.Type.STRING,
        },
        {
          name: 'filePath',
          type: lf.Type.STRING,
        },
        {
          name: 'fileUrl',
          type: lf.Type.STRING,
        },
        {
          name: 'fileOriginUrl',
          type: lf.Type.STRING,
        },
        {
          name: 'fileExists',
          type: lf.Type.BOOLEAN,
        },
        {
          name: 'fileType',
          type: lf.Type.STRING,
        },
        {
          name: 'fileSize',
          type: lf.Type.INTEGER,
        },
        {
          name: 'fileMd5',
          type: lf.Type.STRING,
        },
        {
          name: 'createTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'fileSourceType',
          type: lf.Type.NUMBER,
        },
        {
          name: 'fileSourceKey',
          type: lf.Type.STRING,
        },
        {
          name: 'fileStatus',
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: [{ name: 'fid', autoIncrement: true }],
        autoInc: true,
      },
      index: [
        {
          name: 'fileNameIndex',
          columns: ['fileName'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'fileUrlIndex',
          columns: ['fileUrl'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'filePathIndex',
          columns: ['filePath'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'fileMd5Index',
          columns: ['fileMd5'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'fileOriginUrlIndex',
          columns: ['fileOriginUrl'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'fileSourceKeyIndex',
          columns: ['fileSourceKey'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'createTimeIndex',
          columns: ['createTime'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
      nullable: ['fileMd5', 'fileType', 'fileExists', 'filePath', 'fileSourceType', 'fileSourceKey', 'fileStatus', 'fileUrl'],
    },
    {
      name: 'import_mail',
      columns: [
        {
          name: 'mailMd5',
          type: lf.Type.STRING,
        },
        {
          name: 'mid',
          type: lf.Type.STRING,
        },
        {
          name: 'mailLocalPath',
          type: lf.Type.STRING,
        },
        {
          name: 'createTime',
          type: lf.Type.NUMBER,
        },
      ],
      primaryKey: {
        columns: [{ name: 'mailMd5', autoIncrement: true }],
        autoInc: true,
      },
      index: [
        {
          name: 'mailMd5Index',
          columns: ['mailMd5'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'midIndex',
          columns: ['mid'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailLocalPathIndex',
          columns: ['mailLocalPath'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'createTimeIndex',
          columns: ['createTime'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
      nullable: ['mailMd5', 'mid', 'mailLocalPath', 'createTime'],
    },
  ],
} as SchemaDef;
