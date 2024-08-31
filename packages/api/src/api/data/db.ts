import { Api } from '../_base/api';

export interface DatabaseHolderInterface<T = any> {
  db: T;
  // [key:string]:V | T;
}

export interface DbApi extends Api {
  // schemaBuilder: schema.Builder;
  // isConnected: boolean;
  // db: Database | any;
  // waitConnectList: [];

  isConnecting: boolean;

  connect(): Promise<DatabaseHolderInterface>;

  intoTable(tableName: string, rows: object[]): Promise<object[]>;

  init(): string;

  close(): void;
}

// export interface NewDbApi extends Api {
//     dbName:DBList;
//     dbVersion:number;
//     initDb(user?: User | undefined | null):void;
// }
