import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';

const { STRING, NUMBER, STRING_ARRAY, BOOLEAN } = lf.Type;

export const EdmContactSearch = {
  name: 'edm_contact_search',
  using: 'loki',
  global: true,
  version: 1,
  cache: false,
  tables: [
    {
      name: 'contact',
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
          name: 'company',
          type: STRING,
        },
        {
          name: 'contactName',
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
          name: 'accountName',
          type: STRING,
        },
        {
          name: 'managerList',
          type: STRING_ARRAY,
        },
        {
          name: 'type',
          type: STRING,
        },
        {
          name: '_lastUpdateTime',
          type: NUMBER,
        },
        {
          name: '_company',
          type: STRING,
        },
      ],
      primaryKey: {
        columns: [],
      },
      index: [
        {
          columns: ['_company', 'orgId', '_lastUpdateTime'],
        },
        {
          columns: ['id'],
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
          name: 'orgName',
          type: STRING,
        },
        {
          name: 'orgPYName',
          type: STRING,
        },
        {
          name: 'type',
          type: NUMBER,
        },
        {
          name: 'orgRank',
          type: NUMBER,
        },
        {
          name: '_company',
          type: STRING,
        },
        {
          name: 'managerList',
          type: STRING_ARRAY,
        },
        {
          name: '_lastUpdateTime',
          type: NUMBER,
        },
      ],
      primaryKey: {
        columns: [],
      },
      index: [
        {
          columns: ['_company', '_lastUpdateTime'],
        },
        {
          columns: ['id'],
        },
      ],
    },
  ],
} as unknown as SchemaDef;

export const ContactSearchDB = {
  name: 'contact_search',
  using: 'loki',
  global: false,
  version: 1,
  cache: false,
  tables: [
    {
      name: 'contact',
      columns: [
        {
          name: 'id',
          type: STRING,
        },
        {
          name: 'isDefault',
          type: NUMBER,
        },
        {
          name: 'contactName',
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
          name: 'accountName',
          type: STRING,
        },
        {
          name: 'avatar',
          type: STRING,
        },
        {
          name: 'avatarPendant',
          type: STRING,
        },
        {
          name: 'visibleCode',
          type: NUMBER,
        },
        {
          name: 'position',
          type: STRING,
        },
        {
          name: 'enableIM',
          type: BOOLEAN,
        },
        {
          name: 'type',
          type: STRING,
        },
        {
          name: 'enterpriseId',
          type: STRING,
        },
      ],
      primaryKey: {
        columns: [],
      },
      index: [
        {
          columns: ['id'],
        },
        {
          columns: ['accountName'],
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
          name: 'orgName',
          type: STRING,
        },
        {
          name: 'orgPYName',
          type: STRING,
        },
        {
          name: 'type',
          type: NUMBER,
        },
        {
          name: 'orgRank',
          type: NUMBER,
        },
        {
          name: 'visibleCode',
          type: STRING,
        },
        {
          name: 'memberNum',
          type: NUMBER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['id'],
        },
      ],
    },
    {
      name: 'orgpathlist',
      columns: [
        {
          name: 'id',
          type: STRING,
        },
        {
          name: 'pathIdList',
          type: STRING_ARRAY,
        },
        {
          name: 'pathNameList',
          type: STRING_ARRAY,
        },
        {
          name: 'enterpriseId',
          type: NUMBER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['id'],
        },
        {
          columns: ['enterpriseId'],
        },
      ],
    },
  ],
} as unknown as SchemaDef;
