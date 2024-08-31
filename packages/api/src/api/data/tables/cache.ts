import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';

export default {
  isConnecting: false,
  name: 'caches',
  version: 1,
  waitConnectList: [],
  using: 'dexie',
  tables: [
    {
      name: 'http',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          name: 'urlPath',
          type: lf.Type.STRING,
        },
        {
          name: 'urlKeyParam',
          type: lf.Type.STRING,
        },
        {
          name: 'urlSubParam',
          type: lf.Type.STRING,
        },
        // {
        //   name: "urlRequestInfoMd5",
        //   type: lf.Type.STRING,
        // },
        {
          name: 'content',
          type: lf.Type.STRING,
        },
        {
          name: 'contentSize',
          type: lf.Type.NUMBER,
        },
        {
          name: 'createTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'expiredTime',
          type: lf.Type.NUMBER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        // {
        //   name: "urlRequestInfoMd5Idx",
        //   columns: ["urlRequestInfoMd5"],
        //   unique: false,
        //   order: lf.Order.ASC,
        // },
        {
          name: 'httpCacheCreateTime',
          columns: ['createTime'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
      nullable: [],
    },
  ],
} as SchemaDef;
