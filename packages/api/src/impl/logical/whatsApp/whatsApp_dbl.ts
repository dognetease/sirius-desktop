import { DbApiV2, DBList, QueryConfig } from '@/api/data/new_db';
import { api } from '@/api/api';
import { apis } from '@/config';
import { EventApi } from '@/api/data/event';
import { resultObject as ResultObject } from '@/api/_base/api';
import { WhatsAppMessage, WhatsAppContact } from '@/api/logical/whatsApp';

export default class WhatsAppManageDb {
  dbApi: DbApiV2;

  eventApi: EventApi;

  private readonly dbName: DBList = 'whatsApp';

  private readonly messageTable = 'message';

  private readonly contactTable = 'contact';

  constructor() {
    this.dbApi = api.requireLogicalApi(apis.dexieDbApi) as DbApiV2;
    this.eventApi = api.getEventApi();
  }

  putAllMessages(messages: WhatsAppMessage[], updatedContactWhatsApps: string[]) {
    return this.dbApi
      .putAll(
        {
          dbName: this.dbName,
          tableName: this.messageTable,
        },
        messages
      )
      .then(() => {
        this.eventApi.sendSysEvent({
          eventName: 'whatsAppMessagesUpdate',
          eventStrData: 'whatsAppMessagesUpdate',
          eventData: { updatedContactWhatsApps },
        });
      });
  }

  putAllContacts(contacts: WhatsAppContact[], updatedContactWhatsApps: string[]) {
    return this.dbApi
      .putAll(
        {
          dbName: this.dbName,
          tableName: this.contactTable,
        },
        contacts
      )
      .then(() => {
        this.eventApi.sendSysEvent({
          eventName: 'whatsAppContactsUpdate',
          eventStrData: 'whatsAppContactsUpdate',
          eventData: { updatedContactWhatsApps },
        });
      });
  }

  getContacts(query: QueryConfig): Promise<ResultObject[]> {
    return this.dbApi.getByEqCondition({
      ...query,
      dbName: this.dbName,
      tableName: this.contactTable,
    } as QueryConfig);
  }

  getMessages(query: QueryConfig): Promise<ResultObject[]> {
    return this.dbApi.getByEqCondition({
      ...query,
      dbName: this.dbName,
      tableName: this.messageTable,
    } as QueryConfig);
  }

  init() {
    this.dbApi.initDb(this.dbName);
  }

  close() {
    this.dbApi.closeSpecific(this.dbName);
  }
}
