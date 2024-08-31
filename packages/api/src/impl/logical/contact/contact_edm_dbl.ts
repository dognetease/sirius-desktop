import { api } from '@/api/api';
import { ContactDB, ContactDBInstance } from '@/impl/logical/contact/contact_dbl';
import { ContactTransform, ContactTransformInstance } from '@/impl/logical/contact/contact_transform';
import { resultObject } from '@/api/_base/api';
import { DBList, DbRefer } from '@/api/data/new_db';

export class ContactEdmDB {
  systemApi = api.getSystemApi();

  dbApi = api.getNewDBApi();

  contactDB: ContactDB = ContactDBInstance;

  contactTrans: ContactTransform = ContactTransformInstance;

  private dbName: DBList = 'contact_global';

  initDB() {
    this.dbApi.initDb(this.dbName);
  }

  insertToTable<T = resultObject>(table: DbRefer, data: T[]) {
    this.dbApi.putAll<T>(table, data);
  }
}

export const contactEdmDB = new ContactEdmDB();
