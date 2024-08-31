// import { DatabaseHolderInterface, } from '../../../api/data/db';
// import { config } from 'env_def';
import zipObject from 'lodash/zipObject';
import { resultObject } from '@/api/_base/api';

import { AdQueryConfig, DbApiV2, DBList } from '@/api/data/new_db';
import { apis } from '@/config';
import { api } from '@/api/api';
import { LogData } from './logger_model';

// import { DexieDbApiImpl } from '../db/daxie_db_impl';

export interface EventLoggerNewDbl {
  put(data: LogData[]): Promise<number>;

  getByPeriod(period?: number, endTimestamp?: number): Promise<Record<string, resultObject[] | undefined>>;

  clearByPeriod(period?: number, endTimestamp?: number): Promise<number>;

  init(): void;

  close(): void;
}

class EventLoggerDbImpl implements EventLoggerNewDbl {
  readonly dbName = 'loggers';

  readonly tableName = 'logger';

  readonly highPrioritytableName = 'highLogger';

  readonly normalPrioritytableName = 'logger';

  readonly lowPrioritytableName = 'lowLogger';

  inited = false;

  readonly table = { tableName: this.tableName, dbName: this.dbName as DBList };

  private readonly defaultPeriodTime: number = 24 * 3600 * 1000;

  private readonly logKeptPeriod: number = 12 * 3600 * 1000;

  private readonly clearCheckPeriod: number = 600 * 1000;

  lastPutTimestamp = 0;

  db: DbApiV2;

  constructor() {
    this.db = api.requireLogicalApi(apis.dbInterfaceApiImpl) as DbApiV2;
  }

  close(): void {
    this.inited = false;
    try {
      this.db.closeSpecific(this.dbName);
    } catch (e) {
      console.warn(e);
    }
  }

  async getByPeriod(period?: number, endTimestamp?: number): Promise<Record<string, resultObject[] | undefined>> {
    const results = await Promise.all(this.buildQuery({ period, endTimestamp }).map(condition => this.db.getByRangeCondition(condition)));
    return zipObject(['high', 'normal', 'low'], results);
  }

  private buildQuery(params: { period?: number; endTimestamp?: number; type?: 'below' | 'between' }): AdQueryConfig[] {
    const { endTimestamp = Date.now(), period = this.defaultPeriodTime, type = 'between' } = params;

    const start = endTimestamp - period;
    return [this.highPrioritytableName, this.tableName, this.lowPrioritytableName].map(tableName => ({
      adCondition: {
        type,
        args: type === 'between' ? [start, endTimestamp] : [endTimestamp],
        field: 'date',
      },
      count: 1500,
      dbName: this.dbName,
      tableName,
    }));
  }

  init(): void {
    this.db.initDb(this.dbName);
    this.inited = true;
  }

  async put(data: LogData[], priority = 'normal'): Promise<number> {
    let tableName = this.normalPrioritytableName;

    if (priority === 'high') {
      tableName = this.highPrioritytableName;
    } else if (priority === 'low') {
      tableName = this.lowPrioritytableName;
    }

    // 10%的几率去删一次
    const random = Math.random() > 0.9;

    if (data && data.length > 0) {
      this.db
        .putAll(
          {
            dbName: this.dbName,
            tableName,
          },
          data
        )
        .then();
    }
    if (random && this.lastPutTimestamp && this.lastPutTimestamp + this.clearCheckPeriod < Date.now()) {
      this.clearByPeriod(this.logKeptPeriod, Date.now() - this.logKeptPeriod).then(() => {
        console.log('[logger-db] clear log from local ');
      });
    }
    return data?.length || 0;
  }

  async clearByPeriod(period?: number, endTimestamp?: number): Promise<number> {
    await Promise.all(this.buildQuery({ period, endTimestamp, type: 'below' }).map(condition => this.db.deleteByByRangeCondition(condition)));
    return 0;
  }
}

// export const dbNew = new DexieDbApiImpl();

export const eventLoggerDbImpl = new EventLoggerDbImpl();
