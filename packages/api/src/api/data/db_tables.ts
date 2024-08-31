import { DBMap } from './new_db';
import account from './tables/account';
import contact_dexie from './tables/contact';
import mail_new from './tables/mail';
import task_global from './tables/globalTask';
import fileop from './tables/file';
import catalog_dexie from './tables/catalog';
import caches from './tables/cache';
import operation from './tables/operation';
import task_mail from './tables/taskmail';
import whatsApp from './tables/whatsApp';
import loggers from './tables/loggers';
import { contactCustomer, contactGlobal } from './tables/edm_contact';
import { ContactSearchDB, EdmContactSearch } from './tables/contact_search';
import storageDB from './tables/storage-db';
// import { StringTypedMap } from '../commonModel';
// export enum Order { ASC, DESC }
//
// export enum Type {
//   ARRAY_BUFFER,
//   BOOLEAN,
//   DATE_TIME,
//   INTEGER,
//   NUMBER,
//   OBJECT,
//   STRING
// }

/**
 export interface DbColumnDef {
  name: string;
  type: lf.Type;
}

 export interface DbSchemaDef {
  name: string;
  columns: DbColumnDef[];
  primaryKey: {
    column: string[] | {name: string, order?: string, autoIncrement?: boolean } [],
  }
  nullable:string[];
  unique
}
 * */

export default {
  catalog_dexie,
  mail_new,
  fileop,
  operation,
  caches,
  contact_dexie,
  contact_global: contactGlobal,
  contact_customer: contactCustomer,
  task_global,
  account,
  task_mail,
  whatsApp,
  loggers,
  edm_contact_search: EdmContactSearch,
  contact_search: ContactSearchDB,
  storageDB,
} as DBMap;
