import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';

export default {
  isConnecting: false,
  name: 'operation',
  using: 'dexie',
  version: 1,
  waitConnectList: [],
  tables: [
    {
      name: 'operation',
      columns: [
        {
          name: 'oid',
          type: lf.Type.INTEGER,
        },
        {
          name: 'operation',
          type: lf.Type.STRING,
        },
        {
          name: 'operationType',
          type: lf.Type.STRING,
        },
        {
          name: 'operationStatus',
          type: lf.Type.STRING,
        },
        {
          name: 'createTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'finishTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'operationData',
          type: lf.Type.OBJECT,
        },
        {
          name: 'operationRetryTime',
          type: lf.Type.NUMBER,
        },
      ],
      primaryKey: {
        columns: [{ name: 'oid', autoIncrement: true }],
        autoInc: true,
      },
      index: [
        {
          name: 'operationTypeIndex',
          columns: ['operationType'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'operationNameIndex',
          columns: ['operationName'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'opCreateTimeIndex',
          columns: ['createTime', 'operationType'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
    },
  ],
} as SchemaDef;
