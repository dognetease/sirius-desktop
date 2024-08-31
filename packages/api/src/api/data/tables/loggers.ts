import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';

export default {
  isConnecting: false,
  global: true,
  name: 'loggers',
  using: 'dexie',
  version: 2,
  waitConnectList: [],
  tables: [
    {
      name: 'logger',
      columns: [
        {
          name: 'userName',
          type: lf.Type.STRING,
        },
        {
          name: 'date',
          type: lf.Type.INTEGER,
        },
        {
          name: 'eventId',
          type: lf.Type.STRING,
        },
        {
          name: 'tags',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'curPath',
          type: lf.Type.STRING,
        },
        {
          name: 'pid',
          type: lf.Type.INTEGER,
        },
        {
          name: 'sid',
          type: lf.Type.STRING,
        },
        {
          name: 'uuid',
          type: lf.Type.STRING,
        },
        {
          name: 'data',
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: ['date'],
        autoInc: true,
      },
      index: [
        {
          name: 'tags',
          columns: ['tags'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'eventId',
          columns: ['eventId'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
      nullable: [],
    },
    {
      name: 'lowLogger',
      columns: [
        {
          name: 'userName',
          type: lf.Type.STRING,
        },
        {
          name: 'date',
          type: lf.Type.INTEGER,
        },
        {
          name: 'eventId',
          type: lf.Type.STRING,
        },
        {
          name: 'tags',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'curPath',
          type: lf.Type.STRING,
        },
        {
          name: 'pid',
          type: lf.Type.INTEGER,
        },
        {
          name: 'sid',
          type: lf.Type.STRING,
        },
        {
          name: 'uuid',
          type: lf.Type.STRING,
        },
        {
          name: 'data',
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: ['date'],
        autoInc: true,
      },
      index: [
        {
          name: 'tags',
          columns: ['tags'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'eventId',
          columns: ['eventId'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
      nullable: [],
    },
    {
      name: 'highLogger',
      columns: [
        {
          name: 'userName',
          type: lf.Type.STRING,
        },
        {
          name: 'date',
          type: lf.Type.INTEGER,
        },
        {
          name: 'eventId',
          type: lf.Type.STRING,
        },
        {
          name: 'tags',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'curPath',
          type: lf.Type.STRING,
        },
        {
          name: 'pid',
          type: lf.Type.INTEGER,
        },
        {
          name: 'sid',
          type: lf.Type.STRING,
        },
        {
          name: 'uuid',
          type: lf.Type.STRING,
        },
        {
          name: 'data',
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: ['date'],
        autoInc: true,
      },
      index: [
        {
          name: 'tags',
          columns: ['tags'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'eventId',
          columns: ['eventId'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
      nullable: [],
    },
  ],
} as SchemaDef;
