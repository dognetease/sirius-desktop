import { Transaction } from 'dexie';
// import lodashGet from 'lodash/get';
import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';

let oldVersion = 12;

// const email2Lowercase = (trans:Transaction) => {
//   trans.table('contactItem').toCollection().modify(item => {
//     if (item.contactItemType === 'EMAIL' && item.contactItemVal) {
//       item.contactItemVal = item.contactItemVal.toLocaleLowerCase();
//     }
//   });
// };

const addType2OrgContact = (trans: Transaction) => {
  console.log('[table/contact]', trans);
  // 版本11升级12的时候把数据库邮箱全部转小写 author: 邹明亮/郭超
  // 升级到13版本以上之后 尝试要删除所有的contact.accountStatus=3(被删除)通讯录数据 & 不可见数据
  // const needDeleteContactIds:string[] = [];
  // trans.table('contact').toCollection().modify((item, ref) => {
  //   if (item.type === 'enterprise' && (item.accountStatus === 3 || item.visibleCode !== 0)) {
  //     needDeleteContactIds.push(item.id);
  //     delete ref.value;
  //   } else if (item.accountName) {
  //     item.accountName = item.accountName.toLocaleLowerCase();
  //   }
  // }).then(count => {
  //   console.log('[db]upgrade', count, needDeleteContactIds);
  //   if (!Array.isArray(needDeleteContactIds) || !needDeleteContactIds.length) {
  //     return;
  //   }
  //   // 删除contactItem中contact状态=3的数据
  //   trans.table('contactItem').where('contactId').anyOf(needDeleteContactIds).delete()
  //     .catch((...args) => { console.log('[db]upgrade.failed1', args); });
  //   // 删除contactOrg中contact状态=3的数据
  //   trans.table('orgContact').where('contactId').anyOf(needDeleteContactIds).delete()
  //     .catch((...args) => { console.log('[db]upgrade.failed2', args); });
  // });

  // trans.table('orgContact').toCollection().modify(item => {
  //   // 只有有rankNum字段的是企业类型
  //   if (!item.type && typeof lodashGet(item, 'rankNum', undefined) === 'number') {
  //     item.type = 'enterprise';
  //   }

  //   if (!item.type && lodashGet(item, 'orgId', '').startsWith('personal_org')) {
  //     item.type = 'personal';
  //   }
  // });

  // 不可见的组织也给删掉
  // trans.table('org').toCollection().modify((item, ref) => {
  //   // 检查普通部门(type=0) 如果是部门不是可见或者搜索可见则删除数据
  //   if (item.type === 0 && ![item.visibleCode].includes(0, 7)) {
  //     delete ref.value;
  //   }
  // });
};

const contact = {
  name: 'contact_dexie',
  using: ['dexie'],
  // using: process.env.BUILD_ISWEB ? ['loki', 'dexie'] : ['dexie'],
  version: 17,
  cache: true,
  versionchange: e => {
    oldVersion = e.oldVersion;
  },
  upgrade: async (trans: Transaction) => {
    console.warn('[tables/contact]upgrade:', oldVersion);
    // 16版本之前的版本(灵犀版本:1.19前) 执行邮件大小转小写
    if (oldVersion < 15) {
      // email2Lowercase(trans);
    }
    // 16前的版本(灵犀版本1.20前)
    if (oldVersion < 16) {
      addType2OrgContact(trans);
    }
  },
  tables: [
    {
      name: 'personal_mark',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          // type 1=个人 2=分组
          name: 'type',
          type: lf.Type.NUMBER,
        },
        {
          // contactId OR orgId
          name: 'value',
          type: lf.Type.STRING,
        },
        {
          // 组织名或者contact name
          name: 'name',
          type: lf.Type.STRING,
        },
        {
          name: 'emails',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'originId',
          type: lf.Type.STRING,
        },
        {
          // 此星标联系人名下所有的星标未读数
          name: 'unreadMailCount',
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['type'],
        },
        {
          columns: ['value'],
        },
        {
          name: 'personalMarkEmail',
          columns: ['emails'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
      ],
    },
    {
      name: 'contact',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          name: 'contactLabel',
          type: lf.Type.STRING,
        },
        {
          name: 'accountStatus',
          type: lf.Type.INTEGER,
        },
        {
          name: 'accountVisible',
          type: lf.Type.INTEGER,
        },
        {
          name: 'contactPYName',
          type: lf.Type.STRING,
        },
        {
          name: 'contactName',
          type: lf.Type.STRING,
        },
        {
          name: 'accountName',
          type: lf.Type.STRING,
        },
        {
          name: 'enterpriseId',
          type: lf.Type.INTEGER,
        },
        {
          name: 'accountOriginId',
          type: lf.Type.STRING,
        },
        {
          name: 'enableIM',
          type: lf.Type.BOOLEAN,
        },
        {
          name: 'type',
          type: lf.Type.STRING,
        },
        {
          name: 'remark',
          type: lf.Type.STRING,
        },
        {
          name: 'position',
          type: lf.Type.STRING,
        },
        {
          name: 'avatar',
          type: lf.Type.STRING,
        },
        {
          name: 'visibleCode',
          type: lf.Type.INTEGER,
        },
        {
          name: 'updateTime',
          type: lf.Type.DATE_TIME,
        },
        {
          name: 'contactPYLabelName',
          type: lf.Type.STRING,
        },
        {
          name: 'marked',
          type: lf.Type.STRING,
        },
        // 数据源
        {
          name: 'source',
          type: lf.Type.STRING,
        },
        {
          name: '_lastUpdateTime',
          type: lf.Type.INTEGER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        // {
        //   columns: ["contactLabel"],
        // },
        {
          columns: ['accountOriginId'],
        },
        {
          columns: ['contactPYName'],
        },
        {
          columns: ['contactName'],
        },
        {
          columns: ['accountName'],
        },
        {
          columns: ['contactPYLabelName'],
        },
        {
          columns: ['type', 'contactLabel'],
        },
        {
          columns: ['_lastUpdateTime'],
        },
        {
          columns: ['enterpriseId', '_lastUpdateTime'],
        },
      ],
      nullable: ['remark', 'position', 'updateTime', 'avatar'],
    },
    {
      name: 'contactItem',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          name: 'contactItemVal',
          type: lf.Type.STRING,
        },
        {
          name: 'contactItemType',
          type: lf.Type.STRING,
        },
        {
          name: 'type',
          type: lf.Type.STRING,
        },
        {
          name: 'isDefault',
          type: lf.Type.INTEGER,
        },
        {
          name: 'emailType',
          type: lf.Type.INTEGER, // 1 主账号 -1 未知 2 别名账号
        },
        {
          name: 'contactId',
          type: lf.Type.STRING,
        },
        {
          name: 'unreadItemCount',
          type: lf.Type.INTEGER,
        },
        {
          name: 'useFrequency',
          type: lf.Type.STRING,
        },
        // 数据源
        {
          name: 'source',
          type: lf.Type.STRING,
        },
        {
          name: 'updateTime',
          type: lf.Type.DATE_TIME,
        },
        {
          name: '_lastUpdateTime',
          type: lf.Type.NUMBER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['contactItemVal'],
        },
        {
          columns: ['contactItemType'],
        },
        {
          columns: ['contactId'],
        },
        {
          columns: ['contactItemType', 'enterpriseId', '_lastUpdateTime'],
        },
      ],
      nullable: ['unreadItemCount', 'useFrequency', 'updateTime'],
    },
    {
      name: 'orgContact',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          name: 'contactId',
          type: lf.Type.STRING,
        },
        {
          name: 'enterpriseId',
          type: lf.Type.NUMBER,
        },
        {
          name: 'orgId',
          type: lf.Type.STRING,
        },
        {
          name: 'imId',
          type: lf.Type.STRING,
        },
        {
          name: 'yunxinId',
          type: lf.Type.STRING,
        },
        {
          name: 'nickInTeam',
          type: lf.Type.STRING,
        },
        {
          name: 'joinTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'type',
          type: lf.Type.STRING,
        },
        {
          name: '_lastUpdateTime',
          type: lf.Type.INTEGER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        { columns: ['contactId'] },
        { columns: ['orgId'] },
        { columns: ['imId'] },
        { columns: ['yunxinId'] },
        { columns: ['type'] },
        { columns: ['enterpriseId', '_lastUpdateTime'] },
      ],
    },
    {
      name: 'org',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          name: 'enterpriseId',
          type: lf.Type.NUMBER,
        },
        {
          name: 'originId',
          type: lf.Type.STRING,
        },
        {
          name: 'orgRank',
          type: lf.Type.INTEGER,
        },
        {
          name: 'orgName',
          type: lf.Type.STRING,
        },
        {
          name: 'orgPYName',
          type: lf.Type.STRING,
        },
        {
          name: 'type',
          type: lf.Type.STRING,
        },
        {
          name: 'parent',
          type: lf.Type.STRING,
        },
        {
          name: 'level',
          type: lf.Type.INTEGER,
        },
        {
          name: 'visibleCode',
          type: lf.Type.INTEGER,
        },
        {
          name: 'childrenCount',
          type: lf.Type.INTEGER,
        },
        {
          name: 'marked',
          type: lf.Type.INTEGER,
        },
        // 数据源
        {
          name: 'source',
          type: lf.Type.STRING,
        },
        {
          name: '_lastUpdateTime',
          type: lf.Type.INTEGER,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          columns: ['originId'],
        },
        {
          columns: ['orgName'],
        },
        {
          columns: ['orgPYName'],
        },
        {
          columns: ['parent'],
        },
        {
          columns: ['type'],
        },
        {
          columns: ['orgRank'],
        },
        {
          columns: ['enterpriseId', '_lastUpdateTime'],
        },
      ],
      nullable: ['childrenCount', 'level', 'type'],
    },
    {
      name: 'email_list',
      columns: [
        {
          name: 'accountName',
          type: lf.Type.STRING,
        },
        {
          name: 'contactName',
          type: lf.Type.STRING,
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
          name: 'mailIds',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'priority',
          type: lf.Type.NUMBER,
        },
        {
          name: 'latestSendTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'isSystemAccount',
          type: lf.Type.BOOLEAN,
        },
      ],
      primaryKey: {
        columns: ['accountName'],
      },
      index: [
        {
          columns: ['priority'],
        },
        {
          name: 'mailIdIdx',
          columns: ['mailIds'],
          unique: false,
          multi: true,
          order: lf.Order.ASC,
        },
      ],
      nullable: ['latestSendTime', 'contactName'],
    },
    {
      name: 'recent_contact',
      columns: [
        {
          name: 'email',
          type: lf.Type.STRING,
        },
        {
          name: 'accountId',
          type: lf.Type.STRING,
        },
        {
          name: 'iconUrl',
          type: lf.Type.STRING,
        },
        {
          name: 'nickname',
          type: lf.Type.STRING,
        },
        {
          name: 'index',
          type: lf.Type.INTEGER,
        },
      ],
      primaryKey: {
        columns: ['index'],
      },
      index: [
        {
          name: 'recentContactIdx',
          columns: ['email'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
    },
    {
      name: 'frequentContact',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          name: 'contactId',
          type: lf.Type.STRING,
        },
        {
          name: 'email',
          type: lf.Type.STRING,
        },
        {
          name: 'timestamp',
          type: lf.Type.NUMBER,
        },
        {
          // 联系次数
          name: 'sendcount',
          type: lf.Type.NUMBER,
        },
        {
          name: 'type',
          type: lf.Type.STRING,
        },
        {
          name: 'channel',
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          name: 'frequentComposeIndex',
          columns: ['contactId', 'channel'],
        },
        {
          columns: ['timestamp'],
        },
      ],
    },
  ],
} as SchemaDef;

export default contact;
