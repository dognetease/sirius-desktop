import { SchemaDef } from '@/api/data/new_db';
import { lf } from '@/api/data/lovefield';
const { STRING } = lf.Type;
type tableName = 'localStorage';

const storageDB: SchemaDef<tableName> = {
  name: 'storageDB',
  global: true,
  using: 'dexie',
  version: 1,
  tables: [
    {
      name: 'localStorage',
      columns: [
        {
          name: 'key',
          type: STRING,
        },
        {
          name: 'value',
          type: STRING,
        },
      ],
      primaryKey: {
        columns: [{ name: 'key', autoIncrement: false }],
      },
      index: [
        {
          name: 'key',
          columns: ['key'],
          unique: true,
          multi: false,
        },
      ],
    },
  ],
};

export default storageDB;
