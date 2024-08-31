import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';

export default {
  isConnecting: false,
  name: 'catalog_dexie',
  version: 12,
  waitConnectList: [],
  using: 'dexie',
  tables: [
    {
      name: 'catalog',
      columns: [
        {
          name: 'id',
          type: lf.Type.NUMBER,
        },
        {
          name: 'name',
          type: lf.Type.STRING,
        },
        {
          name: 'status',
          type: lf.Type.INTEGER,
        },
        {
          name: 'subscribeStatus',
          type: lf.Type.INTEGER,
        },
        {
          name: 'seq',
          type: lf.Type.INTEGER,
        },
        {
          name: 'type',
          type: lf.Type.INTEGER,
        },
        {
          name: 'publish',
          type: lf.Type.INTEGER,
        },
        {
          name: 'privilege',
          type: lf.Type.INTEGER,
        },
        {
          name: 'createTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'updateTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'color',
          type: lf.Type.STRING,
        },
        {
          name: 'description',
          type: lf.Type.STRING,
        },
        {
          name: 'isOwner',
          type: lf.Type.INTEGER,
        },
        {
          name: 'belonger',
          type: lf.Type.OBJECT,
        },
        {
          name: 'shares',
          type: lf.Type.OBJECT,
        },
        {
          name: 'syncAccountId',
          type: lf.Type.NUMBER,
        },
        {
          name: 'thirdAccount',
          type: lf.Type.OBJECT,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      nullable: ['description'],
    },
    {
      name: 'schedule',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          name: 'catalogId',
          type: lf.Type.NUMBER,
        },
        {
          name: 'scheduleId',
          type: lf.Type.NUMBER,
        },
        {
          name: 'recurrenceId',
          type: lf.Type.NUMBER,
        },
        {
          name: 'recur',
          type: lf.Type.OBJECT,
        },
        {
          name: 'allDay',
          type: lf.Type.INTEGER,
        },
        {
          name: 'start',
          type: lf.Type.NUMBER,
        },
        {
          name: 'end',
          type: lf.Type.NUMBER,
        },
        {
          name: 'partStat',
          type: lf.Type.INTEGER,
        },
        {
          name: 'summary',
          type: lf.Type.STRING,
        },
        {
          name: 'location',
          type: lf.Type.STRING,
        },
        {
          name: 'clazz',
          type: lf.Type.INTEGER,
        },
        {
          name: 'transp',
          type: lf.Type.INTEGER,
        },
        {
          name: 'description',
          type: lf.Type.STRING,
        },
        {
          name: 'color',
          type: lf.Type.STRING,
        },
        {
          name: 'attachments',
          type: lf.Type.OBJECT,
        },
        {
          name: 'recurIntro',
          type: lf.Type.STRING,
        },
        {
          name: 'reminders',
          type: lf.Type.OBJECT,
        },
        {
          name: 'creator',
          type: lf.Type.OBJECT,
        },
        {
          name: 'belonger',
          type: lf.Type.OBJECT,
        },
        {
          name: 'organizer',
          type: lf.Type.OBJECT,
        },
        {
          name: 'createTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'updateTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'priority',
          type: lf.Type.INTEGER,
        },
        {
          name: 'status',
          type: lf.Type.INTEGER,
        },
        {
          name: 'sequence',
          type: lf.Type.NUMBER,
        },
        {
          name: 'privilege',
          type: lf.Type.NUMBER,
        },
        {
          name: 'instanceId',
          type: lf.Type.NUMBER,
        },
        {
          name: 'catalogStatus',
          type: lf.Type.INTEGER,
        },
        {
          name: 'meetingInfo',
          type: lf.Type.OBJECT,
        },
        {
          name: 'timeFlag',
          type: lf.Type.NUMBER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['timeFlag', 'start'],
        },
        {
          columns: ['catalogId', 'scheduleId', 'recurrenceId'],
        },
      ],
      nullable: ['recurIntro', 'description', 'location', 'updateTime', 'createTime', 'privilege', 'priority', 'catalogStatus', 'meetingInfo'],
    },
    {
      name: 'scheduleContact',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          name: 'email',
          type: lf.Type.STRING,
        },
        {
          name: 'contactId',
          type: lf.Type.STRING,
        },
        {
          name: 'scheduleId',
          type: lf.Type.NUMBER,
        },
        {
          name: 'partStat',
          type: lf.Type.INTEGER,
        },
        {
          name: 'isOwner',
          type: lf.Type.INTEGER,
        },
        {
          name: 'isOrganizer',
          type: lf.Type.INTEGER,
        },
        {
          name: 'isCreator',
          type: lf.Type.INTEGER,
        },
        {
          name: 'isInviter',
          type: lf.Type.INTEGER,
        },
        {
          name: 'simpleInfo',
          type: lf.Type.OBJECT,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['scheduleId'],
        },
      ],
    },
    {
      name: 'scheduleReminder',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          name: 'email',
          type: lf.Type.STRING,
        },
        {
          name: 'start',
          type: lf.Type.NUMBER,
        },
        {
          name: 'updateTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'scheduleId',
          type: lf.Type.NUMBER,
        },
        {
          name: 'reminders',
          type: lf.Type.OBJECT,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['scheduleId'],
        },
        {
          columns: ['scheduleId', 'start'],
        },
      ],
    },
  ],
} as SchemaDef;
