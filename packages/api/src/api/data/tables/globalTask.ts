import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';

const globalTask = {
  isConnecting: false,
  name: 'task_global',
  global: true,
  using: 'dexie',
  version: 3,
  waitConnectList: [],
  tables: [
    {
      name: 'contact_detecttask',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          // 账号
          name: 'account',
          type: lf.Type.STRING,
        },
        {
          name: 'domain',
          type: lf.Type.STRING,
        },
        {
          name: 'tablename',
          type: lf.Type.STRING,
        },
        {
          name: 'expiredTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'isDone',
          type: lf.Type.BOOLEAN,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['domain', 'account', 'tablename'],
        },
      ],
    },
    {
      name: 'contact_synctask',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          // 账号
          name: 'account',
          type: lf.Type.STRING,
        },
        {
          name: 'domain',
          type: lf.Type.STRING,
        },
        {
          // 主要表示是哪个业务(enterprise or org)
          name: 'from',
          type: lf.Type.STRING,
        },
        {
          // 服务端数据源的来源决定了分页方式(qiye-使用page分页.lx使用lastMaxId)
          name: 'source',
          type: lf.Type.STRING,
        },
        {
          name: 'pageIndex',
          type: lf.Type.NUMBER,
        },
        {
          name: 'totalPage',
          type: lf.Type.NUMBER,
        },
        {
          name: 'pageSize',
          type: lf.Type.NUMBER,
        },
        {
          name: 'lastMaxId',
          type: lf.Type.STRING,
        },
        {
          name: 'expiredTime',
          type: lf.Type.NUMBER,
        },
        {
          // v1.20版本采用step枚举类型 isAll优先级降到step之后
          name: 'step',
          type: lf.Type.STRING,
        },
        {
          name: 'done',
          type: lf.Type.STRING,
        },
        {
          // 是否是全量同步(1.20之后废弃)
          name: 'isAll',
          type: lf.Type.BOOLEAN,
        },
        {
          name: 'coreCount',
          type: lf.Type.STRING,
        },
        {
          // 上次更新时间
          name: 'lastUpdateTime',
          type: lf.Type.NUMBER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['domain', 'account', 'from'],
        },
      ],
    },
    {
      name: 'task',
      columns: [
        {
          name: 'id',
          type: lf.Type.INTEGER,
        },
        {
          name: 'account',
          type: lf.Type.STRING,
        },
        {
          name: 'action',
          type: lf.Type.STRING,
        },
        {
          name: 'from',
          type: lf.Type.STRING,
        },
        {
          name: 'to',
          type: lf.Type.STRING,
        },
        {
          name: 'expired',
          type: lf.Type.NUMBER,
        },
        {
          name: 'createTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'content',
          type: lf.Type.OBJECT,
        },
      ],
      primaryKey: {
        columns: [{ name: 'id', autoIncrement: true }],
      },
      index: [
        {
          columns: ['action', 'account'],
        },
      ],
    },
  ],
} as SchemaDef;

export default globalTask;
