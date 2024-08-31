import { lf } from '@/api/data/lovefield';
import { SchemaDef } from '@/api/data/new_db';

export default {
  name: 'whatsApp',
  using: 'dexie',
  version: 1,
  isConnecting: false,
  waitConnectList: [],
  tables: [
    {
      name: 'message',
      columns: [
        {
          name: 'seqNo',
          type: lf.Type.STRING,
        },
        {
          name: 'orgId',
          type: lf.Type.NUMBER,
        },
        {
          name: 'accountId',
          type: lf.Type.STRING,
        },
        {
          name: 'messageId',
          type: lf.Type.STRING,
        },
        {
          name: 'messageType',
          type: lf.Type.STRING,
        },
        {
          name: 'messageDirection',
          type: lf.Type.NUMBER,
        },
        {
          name: 'message',
          type: lf.Type.OBJECT_ARRAY,
        },
        {
          name: 'quoteMessageId',
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
          name: 'contactName',
          type: lf.Type.STRING,
        },
        {
          name: 'contactWhatsApp',
          type: lf.Type.STRING,
        },
        {
          name: 'sentAt',
          type: lf.Type.NUMBER,
        },
        {
          name: 'deliveryAt',
          type: lf.Type.NUMBER,
        },
        {
          name: 'seenAt',
          type: lf.Type.NUMBER,
        },
      ],
      primaryKey: {
        columns: ['messageId'],
      },
      index: [
        {
          name: 'messageIdIndex',
          columns: ['messageId'],
          unique: true,
          order: lf.Order.ASC,
        },
        {
          name: 'seqNoIndex',
          columns: ['seqNo'],
          unique: true,
          order: lf.Order.ASC,
        },
        {
          name: 'contactWhatsAppIndex',
          columns: ['contactWhatsApp'],
          unique: false,
          order: lf.Order.ASC,
        },
        {
          name: 'seenAtIndex',
          columns: ['seenAt'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
      nullable: ['quoteMessageId', 'contactName', 'contactWhatsApp'],
    },
    {
      name: 'contact',
      columns: [
        {
          name: 'contactWhatsApp',
          type: lf.Type.STRING,
        },
        {
          name: 'contactName',
          type: lf.Type.STRING,
        },
        {
          name: 'lastSeqNo',
          type: lf.Type.STRING,
        },
      ],
      primaryKey: {
        columns: ['contactWhatsApp'],
      },
      index: [
        {
          name: 'contactWhatsAppIndex',
          columns: ['contactWhatsApp'],
          unique: true,
          order: lf.Order.ASC,
        },
        {
          name: 'lastSeqNoIndex',
          columns: ['lastSeqNo'],
          unique: false,
          order: lf.Order.ASC,
        },
      ],
      nullable: ['contactName'],
    },
  ],
} as SchemaDef;
