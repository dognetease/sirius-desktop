import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';

const taskMail = {
  isConnecting: false,
  name: 'task_mail',
  using: 'dexie',
  version: 8,
  waitConnectList: [],
  tables: [
    {
      name: 'task',
      columns: [
        {
          name: 'todoId',
          type: lf.Type.INTEGER,
        },
        {
          name: 'alert',
          type: lf.Type.BOOLEAN,
        },
        {
          name: 'alertAt',
          type: lf.Type.INTEGER,
        },
        {
          name: 'alertTime',
          type: lf.Type.INTEGER,
        },
        {
          name: 'completed',
          type: lf.Type.INTEGER,
        },
        {
          name: 'createdAt',
          type: lf.Type.INTEGER,
        },
        {
          name: 'createdBy',
          type: lf.Type.STRING,
        },
        {
          name: 'deadline',
          type: lf.Type.INTEGER,
        },
        {
          name: 'executorList',
          type: lf.Type.OBJECT_ARRAY,
        },
        {
          name: 'focusList',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'mailInfos',
          type: lf.Type.OBJECT_ARRAY,
        },
        {
          name: 'overdue',
          type: lf.Type.BOOLEAN,
        },
        {
          name: 'status',
          type: lf.Type.INTEGER,
        },
        {
          name: 'title',
          type: lf.Type.STRING,
        },
        {
          name: 'total',
          type: lf.Type.INTEGER,
        },
        {
          name: 'type',
          type: lf.Type.INTEGER,
        },
        {
          name: 'userType',
          type: lf.Type.INTEGER,
        },
        {
          name: 'groupType',
          type: lf.Type.INTEGER,
        },
      ],
      primaryKey: {
        columns: ['todoId'],
      },
    },
    // list
    {
      name: 'task_list',
      columns: [
        {
          name: 'mid',
          type: lf.Type.STRING,
        },
        {
          name: 'todoId',
          type: lf.Type.INTEGER,
        },
        {
          name: 'top',
          type: lf.Type.BOOLEAN,
        },
        {
          name: 'tid',
          type: lf.Type.STRING,
        },
        {
          name: 'status',
          type: lf.Type.NUMBER,
        },
        {
          name: 'pos',
          type: lf.Type.NUMBER,
        },
        {
          name: 'createAt',
          type: lf.Type.DATE_TIME,
        },
        {
          name: 'updateAt',
          type: lf.Type.DATE_TIME,
        },
      ],
      primaryKey: {
        columns: ['mid'],
      },
      index: [
        {
          name: 'mailTaskIdIdx',
          columns: ['todoId'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailTaskStatusIdx',
          columns: ['status', 'createAt'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
    },
  ],
} as SchemaDef;

export default taskMail;
