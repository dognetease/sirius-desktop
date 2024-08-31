import { Transaction } from 'dexie';
import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';

const mail = {
  isConnecting: false,
  name: 'mail_new',
  version: 25,
  waitConnectList: [],
  using: 'dexie',
  upgrade: (trans: Transaction) => {
    trans
      .table('mail_status')
      .toCollection()
      .modify(mailStatus => {
        if (mailStatus.isThread === undefined) {
          mailStatus.isThread = 0;
          mailStatus.threadId = '';
        }
      })
      .then(() => trans.table('mail_attr').clear());
  },
  tables: [
    {
      name: 'composed_mail', // 写信表
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          name: '_id',
          type: lf.Type.STRING,
        },
        {
          name: 'cid',
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: ['cid'],
      },
      index: [
        {
          name: 'mailIdIdx',
          columns: ['id'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailComposeIdx',
          columns: ['_id'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
    },
    {
      name: 'unfinished_mail', // 未完成邮件
      columns: [
        {
          name: 'draftVersionId',
          type: lf.Type.STRING,
        },
        {
          name: 'cid',
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: ['draftVersionId'],
      },
      index: [
        {
          name: 'mailCidIdx',
          columns: ['cid'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
    },
    {
      name: 'deleted_mail', // 删除信件表
      columns: [
        {
          name: 'mid',
          type: lf.Type.STRING,
        },
        {
          name: 'cid',
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: ['mid'],
      },
    },
    {
      name: 'mail_data', // 信件不变数据
      columns: [
        {
          name: 'mid',
          type: lf.Type.STRING,
        },
        {
          name: 'isThread',
          type: lf.Type.NUMBER,
        },
        {
          name: 'title',
          type: lf.Type.STRING,
        },
        {
          name: 'titleMd5',
          type: lf.Type.STRING,
        },
        {
          name: 'attachmentCount',
          type: lf.Type.NUMBER,
        },
        {
          name: 'sdTime',
          type: lf.Type.DATE_TIME,
        },
        {
          name: 'rcTime',
          type: lf.Type.DATE_TIME,
        },
        {
          name: 'fromEmail',
          type: lf.Type.STRING,
        },
        {
          name: 'fromName',
          type: lf.Type.STRING,
        },
        {
          name: 'toEmail',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'toContactName',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'contactData',
          type: lf.Type.OBJECT_ARRAY,
        },
        {
          name: 'linkAttached',
          type: lf.Type.BOOLEAN,
        },
        // {
        //   name: 'ccEmail',
        //   type: lf.Type.STRING_ARRAY,
        // },
        // {
        //   name: 'ccContactName',
        //   type: lf.Type.STRING_ARRAY,
        // },
        // {
        //   name: 'bccEmail',
        //   type: lf.Type.STRING_ARRAY,
        // },
        // {
        //   name: 'bccContactName',
        //   type: lf.Type.STRING_ARRAY,
        // },
        {
          name: 'entryData',
          type: lf.Type.OBJECT,
        },
        {
          name: 'brief',
          type: lf.Type.STRING,
        },
        {
          name: 'allInfo',
          type: lf.Type.NUMBER,
        },
        {
          name: 'taskId', // 任务id
          type: lf.Type.NUMBER,
        },
        {
          name: 'createTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'sentMailId', // 发送邮件的mid
          type: lf.Type.STRING,
        },
        {
          name: 'encpwd', // 发件箱邮件加密密码
          type: lf.Type.STRING,
        },
        {
          name: 'mailIllegal', // 邮件异常
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: ['mid'],
      },
      index: [
        {
          name: 'mailITitleMd5Idx',
          columns: ['titleMd5', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
        // {
        //   name: 'mailMarkRcIdx',
        //   columns: ['markStatus', 'rcTime'],
        //   unique: false,
        //   order: lf.Order.ASC,
        // },
        {
          name: 'mailSenderIdx',
          columns: ['fromEmail'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailSenderNameIdx',
          columns: ['fromName'],
          unique: false,
          order: lf.Order.ASC,
        },
        // {
        //   name: 'mailSendersIdx',
        //   columns: ['senderName'],
        //   unique: false,
        //   order: lf.Order.ASC,
        // },
        // {
        //   name: 'mailSendersNameIdx',
        //   columns: ['senderEmail'],
        //   multi: true,
        //   unique: false,
        //   order: lf.Order.ASC,
        // },
        {
          name: 'mailReceiverNameIdx',
          columns: ['toContactName'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailReceiverIdx',
          columns: ['toEmail'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
      ],
      nullable: [],
    },
    {
      name: 'mail_content', // 邮件内容数据
      columns: [
        {
          name: 'mid',
          type: lf.Type.STRING,
        },
        {
          name: 'isThread',
          type: lf.Type.NUMBER,
        },
        {
          name: 'type',
          type: lf.Type.NUMBER,
        },
        {
          name: 'fromEmail',
          type: lf.Type.STRING,
        },
        {
          name: 'fromName',
          type: lf.Type.STRING,
        },
        {
          name: 'toEmail',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'toContactName',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'ccEmail',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'ccContactName',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'bccEmail',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'bccContactName',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'title',
          type: lf.Type.STRING,
        },
        {
          name: 'titleMd5',
          type: lf.Type.STRING,
        },
        {
          name: 'brief',
          type: lf.Type.STRING,
        },
        {
          name: 'content',
          type: lf.Type.STRING,
        },
        {
          name: 'langType', // 语言种类
          type: lf.Type.STRING,
        },
        {
          name: 'langListMap', // 语言的合集
          type: lf.Type.OBJECT,
        },
        {
          name: 'contentMd5',
          type: lf.Type.STRING,
        },
        {
          name: 'createTime',
          type: lf.Type.DATE_TIME,
        },
        {
          name: 'keyWords',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'contactData',
          type: lf.Type.OBJECT_ARRAY,
        },
        {
          name: 'antispamInfo',
          type: lf.Type.OBJECT,
        },
      ],
      primaryKey: {
        columns: ['mid'],
      },
      index: [
        {
          name: 'mailContentMd5IdIdx',
          columns: ['contentMd5'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailReceiverCCIdx',
          columns: ['ccEmail'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailReceiverNameIdx',
          columns: ['ccContactName'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailReceiverNameIdx',
          columns: ['bccContactName'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailReceiverBCCIdx',
          columns: ['bccEmail'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailSenderIdx',
          columns: ['fromEmail'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailSenderNameIdx',
          columns: ['fromName'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailReceiverNameIdx',
          columns: ['toContactName'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailReceiverIdx',
          columns: ['toEmail'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
      ],
      nullable: [],
    },
    {
      name: 'mail_attachment',
      columns: [
        {
          name: 'mid',
          type: lf.Type.STRING,
        },
        {
          name: 'isThread',
          type: lf.Type.NUMBER,
        },
        {
          name: 'title',
          type: lf.Type.STRING,
        },
        {
          name: 'titleMd5',
          type: lf.Type.STRING,
        },
        {
          name: 'attachment',
          type: lf.Type.OBJECT_ARRAY,
        },
        {
          name: 'attachmentNames',
          type: lf.Type.STRING_ARRAY,
        },
      ],
      primaryKey: {
        columns: ['mid'],
      },
      index: [
        {
          name: 'mailAttachmentFileIdIdx',
          columns: ['attachmentNames'],
          multi: true,
          unique: false,
          order: lf.Order.ASC,
        },
      ],
      nullable: [],
    },
    {
      name: 'mail_status', // 邮件状态
      columns: [
        {
          name: 'mid',
          type: lf.Type.STRING,
        },
        {
          name: 'isThread',
          type: lf.Type.NUMBER,
        },
        {
          name: 'threadId',
          type: lf.Type.STRING,
        },
        {
          name: 'threadMessageFirstId', // 聚合邮件中第一封实体邮件ID
          type: lf.Type.STRING,
        },
        {
          name: 'threadMessageIds', // 聚合邮件所有实体邮件ID
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'title',
          type: lf.Type.STRING,
        },
        {
          name: 'rank',
          type: lf.Type.NUMBER,
        },
        {
          name: 'titleMd5',
          type: lf.Type.STRING,
        },
        {
          name: 'folder',
          type: lf.Type.NUMBER,
        },
        {
          name: 'tags',
          type: lf.Type.STRING_ARRAY,
        },
        {
          name: 'redFlag',
          type: lf.Type.NUMBER,
        },
        {
          name: 'preferred',
          type: lf.Type.NUMBER,
        },
        {
          name: 'readStatus',
          type: lf.Type.NUMBER,
        },
        {
          name: 'rcTime',
          type: lf.Type.DATE_TIME,
        },
        {
          name: 'replyStatus',
          type: lf.Type.NUMBER,
        },
        {
          name: 'forwardStatus',
          type: lf.Type.NUMBER,
        },
        {
          name: 'directForwardedStatus',
          type: lf.Type.NUMBER,
        },
        // rclStatus
        {
          name: 'rclStatus',
          type: lf.Type.NUMBER,
        },
        {
          name: 'sndStatus',
          type: lf.Type.NUMBER,
        },
        {
          name: 'updateTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'memo',
          type: lf.Type.STRING,
        },
        {
          name: 'isOneRcpt',
          type: lf.Type.BOOLEAN,
        },
        {
          name: 'isDefer', // 1 待办邮件， 0 不是待办邮件
          type: lf.Type.NUMBER,
        },
        {
          name: 'deferTime', // 待办时间
          type: lf.Type.NUMBER,
        },
        {
          name: 'deferNotice', // 1 待办提醒， 0 无待办提醒
          type: lf.Type.NUMBER,
        },
        {
          name: 'requestReadReceiptLocal', // requestReadReceiptLocalπ
          type: lf.Type.BOOLEAN,
        },
      ],
      primaryKey: {
        columns: [{ name: 'mid' }],
      },
      index: [
        {
          name: 'mailTagMailIdIdx',
          columns: ['tags'],
          unique: false,
          multi: true,
          order: lf.Order.ASC,
        },
        {
          name: 'mailThreadIdIdx',
          columns: ['isThread', 'threadId', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailIndexMailPosIdx',
          columns: ['isThread', 'folder', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailIndexMailPosIdx',
          columns: ['isThread', 'folder', 'rank', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailIndexMailMarkReadIdx',
          columns: ['isThread', 'folder', 'readStatus', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailIndexMailMarkFlagIdx',
          columns: ['isThread', 'folder', 'redFlag', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailIndexMailMarkPreferIdx',
          columns: ['isThread', 'folder', 'preferred', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailRcTimeFlagAllIdx',
          columns: ['isThread', 'rcTime', 'rank', 'redFlag', 'readStatus'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailFolderUpdateTimeIdx',
          columns: ['folder', 'updateTime'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailFlagRcTimeIdx',
          columns: ['isThread', 'redFlag', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailReadRcTimeIdx',
          columns: ['isThread', 'readStatus', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailRcTimeTitleIdx',
          columns: ['rcTime', 'titleMd5'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'mailDeferIndex',
          columns: ['isThread', 'isDefer', 'deferTime', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
      nullable: [],
    },
    {
      name: 'mail_box',
      columns: [
        {
          name: 'mailBoxId',
          type: lf.Type.NUMBER,
        },
        {
          name: 'sort',
          type: lf.Type.NUMBER,
        },
        {
          name: 'mailBoxName',
          type: lf.Type.STRING,
        },
        {
          name: 'mailBoxShowName',
          type: lf.Type.BOOLEAN,
        },
        {
          name: 'mailBoxType',
          type: lf.Type.STRING,
        },
        {
          name: 'mailBoxUnread',
          type: lf.Type.NUMBER,
        },
        {
          name: 'mailBoxCurrentUnread',
          type: lf.Type.NUMBER,
        },
        {
          name: 'totalCount',
          type: lf.Type.NUMBER,
        },
        {
          name: 'threadTotalCount',
          type: lf.Type.NUMBER,
        },
        {
          name: 'threadMailBoxUnread',
          type: lf.Type.NUMBER,
        },
        {
          name: 'threadMailBoxCurrentUnread',
          type: lf.Type.NUMBER,
        },
        {
          name: 'pid',
          type: lf.Type.NUMBER,
        },
        {
          name: 'locked',
          type: lf.Type.BOOLEAN,
        },
        {
          name: 'hideFlag',
          type: lf.Type.BOOLEAN,
        },
        {
          name: 'foldFlag',
          type: lf.Type.BOOLEAN,
        },
        {
          name: 'updateTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'lastMailId',
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: ['mailBoxId'],
      },
      index: [
        // {
        //   name: 'mailboxParentIdIdx',
        //   columns: ['pid'],
        //   unique: false,
        //   order: lf.Order.ASC,
        // },
      ],
    },
    {
      name: 'operation',
      columns: [
        {
          name: 'oid',
          type: lf.Type.INTEGER,
        },
        {
          name: 'operationName',
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
          name: 'updateTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'finishTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'operationRetryTime',
          type: lf.Type.NUMBER,
        },
        {
          name: 'operationContent',
          type: lf.Type.STRING,
        },
        {
          name: 'operationTitle',
          type: lf.Type.STRING,
        },
        {
          name: 'delFlag',
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
        {
          name: 'operationDelIndex',
          columns: ['operationType', 'delFlag', 'createTime'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
    },
    {
      name: 'signature',
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          name: 'signId',
          type: lf.Type.INTEGER,
        },
        {
          name: 'type',
          type: lf.Type.STRING,
        },
        {
          name: 'content',
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: ['id'],
      },
      index: [
        {
          name: 'signatureType',
          columns: ['type'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
    },
    {
      name: 'mail_attr', // 邮件各种属性
      columns: [
        {
          name: 'aid',
          type: lf.Type.STRING,
        },
        {
          name: 'attrType',
          type: lf.Type.STRING, // customer：客户邮件，star：星标联系人邮件
        },
        {
          name: 'attrValue',
          type: lf.Type.STRING,
        },
        {
          name: 'filterValues',
          type: lf.Type.OBJECT,
        },
        {
          name: 'mid',
          type: lf.Type.STRING,
        },
        {
          name: 'rcTime',
          type: lf.Type.DATE_TIME,
        },
        {
          name: 'readStatus', // 1已读 0未读
          type: lf.Type.NUMBER,
        },
      ],
      primaryKey: {
        columns: [
          {
            name: 'aid',
          },
        ],
      },
      index: [
        {
          name: 'queryIndex',
          columns: ['attrType', 'attrValue', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'queryReadStatusIndex',
          columns: ['attrType', 'attrValue', 'readStatus', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'midIndex',
          columns: ['mid'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
    },
    {
      name: 'mail_statistic', // 邮件统计
      columns: [
        {
          name: 'id',
          type: lf.Type.STRING,
        },
        {
          name: 'type',
          type: lf.Type.STRING, // customer/folder
        },
        {
          name: 'unread',
          type: lf.Type.NUMBER,
        },
        {
          name: 'parent',
          type: lf.Type.STRING,
        },
        {
          name: 'sort',
          type: lf.Type.NUMBER,
        },
        {
          name: 'updateTime',
          type: lf.Type.NUMBER,
        },
      ],
      primaryKey: {
        columns: [
          {
            name: 'id',
          },
        ],
      },
      index: [
        {
          name: 'typeIndex',
          columns: ['type', 'updateTime'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
    },
    {
      name: 'third_party_mail', // 第三方邮件
      columns: [
        {
          name: 'mid',
          type: lf.Type.STRING,
        },
        {
          name: 'entryModel',
          type: lf.Type.OBJECT,
        },
        {
          name: 'owner',
          type: lf.Type.STRING,
        },
        {
          name: 'rcTime',
          type: lf.Type.NUMBER,
        },
      ],
      primaryKey: {
        columns: [
          {
            name: 'mid',
          },
        ],
      },
      index: [
        {
          name: 'ownerIndex',
          columns: ['owner', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
    },
    {
      name: 'third_party_mail_content', // 第三方邮件详情
      columns: [
        {
          name: 'mid',
          type: lf.Type.STRING,
        },
        {
          name: 'owner',
          type: lf.Type.STRING,
        },
        {
          name: 'entryModel',
          type: lf.Type.OBJECT,
        },
      ],
      primaryKey: {
        columns: [
          {
            name: 'mid',
          },
        ],
      },
      index: [
        {
          name: 'ownerIndex',
          columns: ['owner', 'rcTime'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
    },
  ],
} as SchemaDef;

export default mail;
