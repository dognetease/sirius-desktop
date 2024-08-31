import { Transaction } from 'dexie';
import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';

const { STRING, NUMBER, STRING_ARRAY, INTEGER } = lf.Type;
export const contactGlobal = {
  name: 'contact_global',
  using: 'dexie',
  global: true,
  version: 4,
  upgrade: (trans: Transaction) => {
    // 版本3升级4的时候把数据库邮箱全部转小写 author: 邹明亮
    trans
      .table('contact')
      .toCollection()
      .modify(item => {
        if (item.account) {
          item.account = item.account.toLocaleLowerCase();
        }
      });

    trans
      .table('orgContact')
      .toCollection()
      .modify(item => {
        if (item.account) {
          item.account = item.account.toLocaleLowerCase();
        }
      });
  },
  // cache: false,
  tables: [
    {
      name: 'contact',
      columns: [
        {
          name: 'id',
          type: STRING,
        },
        {
          name: '_company',
          type: STRING,
        },
        {
          name: 'originId',
          type: STRING,
        },
        {
          name: 'name',
          type: STRING,
        },
        {
          name: 'contactLabel',
          type: STRING,
        },
        {
          name: 'contactPYName',
          type: STRING,
        },
        {
          name: 'contactPYLabelName',
          type: STRING,
        },
        {
          name: 'avatar',
          type: STRING,
        },
        {
          name: 'account',
          type: STRING,
        },
        {
          name: 'labelNames',
          type: STRING_ARRAY,
        },
        {
          name: 'whatsApp',
          type: STRING,
        },
        {
          name: 'phones',
          type: STRING_ARRAY,
        },
        {
          name: 'remark',
          type: STRING,
        },
        {
          name: 'customerType',
          type: STRING,
        },
        {
          name: '_lastUpdateTime',
          type: NUMBER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['_company'],
        },
        {
          columns: ['originId'],
        },
        {
          columns: ['contactPYName'],
        },
        {
          columns: ['contactPYLabelName'],
        },
        {
          columns: ['name'],
        },
        {
          columns: ['_company', 'account'],
        },
        {
          columns: ['_company', 'customerType', '_lastUpdateTime'],
        },
      ],
    },
    {
      name: 'org',
      columns: [
        {
          name: 'id',
          type: STRING,
        },
        {
          name: 'originId',
          type: STRING,
        },
        {
          name: 'orgRank',
          type: NUMBER,
        },
        {
          name: 'orgName',
          type: STRING,
        },
        {
          name: 'orgPYName',
          type: STRING,
        },
        {
          name: 'type',
          type: STRING,
        },
        {
          name: 'parent',
          type: STRING,
        },
        {
          name: 'level',
          type: NUMBER,
        },
        {
          name: 'managerNames',
          type: STRING_ARRAY,
        },
        {
          name: 'labelNames',
          type: STRING_ARRAY,
        },
        {
          name: 'customerType',
          type: STRING,
        },
        {
          name: '_lastUpdateTime',
          type: NUMBER,
        },
        {
          name: 'area',
          type: STRING,
        },
        {
          name: 'zone',
          type: STRING,
        },
        {
          name: 'domain',
          type: STRING,
        },
        {
          name: 'companyName',
          type: STRING,
        },
        {
          name: 'createType',
          type: NUMBER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['_company'],
        },
        {
          columns: ['_company', 'originId'],
        },
        {
          columns: ['orgName'],
        },
        {
          columns: ['orgPYName'],
        },
        {
          columns: ['_company', 'parent'],
        },
        {
          columns: ['_company', 'type'],
        },
        {
          columns: ['_company', 'customerType', '_lastUpdateTime'],
        },
      ],
    },
    {
      name: 'orgContact',
      columns: [
        {
          name: 'id',
          type: STRING,
        },
        {
          name: 'contactId',
          type: STRING,
        },
        {
          name: 'account',
          type: STRING,
        },
        {
          name: 'orgId',
          type: STRING,
        },
        {
          name: 'customerType',
          type: STRING,
        },
        {
          name: '_lastUpdateTime',
          type: NUMBER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [{ columns: ['contactId'] }, { columns: ['orgId'] }, { columns: ['_company', 'account'] }, { columns: ['_company', 'customerType', '_lastUpdateTime'] }],
    },
    {
      name: 'orgManager',
      columns: [
        {
          name: 'id',
          type: STRING,
        },
        {
          name: 'orgId',
          type: STRING,
        },
        {
          name: 'managerAccount',
          type: STRING,
        },
        {
          name: 'managerName',
          type: STRING,
        },
        {
          name: 'managerId',
          type: STRING,
        },
        {
          name: 'companyId',
          type: STRING,
        },
        {
          name: 'customerType',
          type: STRING,
        },
        {
          name: '_lastUpdateTime',
          type: NUMBER,
        },
        {
          name: 'lastUpdateTime',
          type: NUMBER,
        },
        {
          name: 'lastSetTopTime',
          type: NUMBER,
        },
        {
          name: 'lastMailTime',
          type: NUMBER,
        },
        {
          name: 'sortWeight',
          type: NUMBER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['orgId'],
        },
        {
          columns: ['_company', 'customerType', '_lastUpdateTime'],
        },
        {
          name: 'myCustomer',
          columns: ['_company', 'managerId', 'customerType'],
        },
        {
          name: 'sortId',
          columns: ['_company', 'managerId', 'customerType', 'sortWeight'],
        },
      ],
    },
    {
      name: 'label',
      columns: [
        {
          name: 'id',
          type: STRING,
        },
        {
          name: 'orgId',
          type: STRING,
        },
        {
          name: 'contactId',
          type: STRING,
        },
        {
          name: 'color',
          type: STRING,
        },
        {
          name: 'originId',
          type: STRING,
        },
        {
          name: 'name',
          type: STRING,
        },
        {
          name: 'createTime',
          type: NUMBER,
        },
        {
          name: 'type',
          type: NUMBER,
        },
        {
          name: 'customerType',
          type: STRING,
        },
        {
          name: '_lastUpdateTime',
          type: NUMBER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['contactId'],
        },
        {
          columns: ['orgId'],
        },
        {
          columns: ['originId'],
        },
        {
          columns: ['name'],
        },
        {
          columns: ['_company', 'customerType', 'type'],
        },
        {
          columns: ['_company', 'customerType', '_lastUpdateTime'],
        },
      ],
    },
  ],
} as SchemaDef;

export const contactCustomer = {
  name: 'contact_customer',
  using: 'dexie',
  version: 1,
  cache: false,
  tables: [
    {
      name: 'colleagueContact',
      columns: [
        {
          name: 'id',
          type: STRING,
        },
        {
          name: 'contactId',
          type: STRING,
        },
        {
          name: 'nickname',
          type: STRING,
        },
        {
          name: 'email',
          type: STRING,
        },
        {
          name: 'orgId',
          type: STRING,
        },
        {
          name: 'status',
          type: INTEGER,
        },
        {
          name: '_lastUpdateTime',
          type: NUMBER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['contactId'],
        },
        {
          columns: ['orgId'],
        },
        {
          columns: ['status'],
        },
        {
          columns: ['_lastUpdateTime'],
        },
      ],
    },
  ],
} as SchemaDef;
