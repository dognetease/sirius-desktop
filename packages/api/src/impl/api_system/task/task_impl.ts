import { SystemApi } from '../../../api/system/system';
import { DbApiV2, DBList } from '../../../api/data/new_db';
import { apis } from '../../../config';
import { api } from '../../../api/api';
import { Api, ApiLifeCycleEvent, stringOrNumber } from '../../../api/_base/api';
import { TaskApi, TaskEntity, ContactSyncTaskEntity } from '../../../api/system/task';

class TaskApiImpl implements TaskApi {
  name: string;

  private systemApi: SystemApi;

  private readonly DBApi: DbApiV2;

  private dbName: DBList = 'task_global';

  private tableName = 'task';

  private contactSyncTaskTableName = 'contact_synctask';

  private isInited = false;

  constructor() {
    this.name = apis.taskApiImpl;
    this.systemApi = api.getSystemApi();
    this.DBApi = api.getNewDBApi();
  }

  getEmail() {
    const user = this.systemApi.getCurrentUser();
    return user?.id || '';
  }

  doCreateTask(params: TaskEntity) {
    const now = new Date().getTime();
    const items: TaskEntity = Object.assign(params, {
      createTime: now,
      expired: now + 5 * 60 * 1000,
    });
    return this.DBApi.put(
      {
        tableName: this.tableName,
        dbName: this.dbName,
      },
      items
    );
  }

  async executeAfterLoginTask() {
    if (!this.systemApi.isMainWindow()) {
      return;
    }
    const account = this.getEmail();
    const res = (await this.DBApi.getByEqCondition({
      dbName: this.dbName,
      tableName: this.tableName,
      query: {
        action: 'AfterLogin',
        account,
      },
    })) as TaskEntity[];
    const promiseList: Array<Promise<any>> = [];
    const deleteTaskIdList: number[] = [];
    res.forEach(item => {
      if (item.expired! >= new Date().getTime()) {
        if (item.to === 'mail') {
          promiseList.push(this.readMailTask(item.content.mailId));
        }
        deleteTaskIdList.push(item.id!);
      } else {
        deleteTaskIdList.push(item.id!);
      }
    });
    await this.deleteExpiredTask(deleteTaskIdList);
    await Promise.all(promiseList);
  }

  readMailTask(mailId: stringOrNumber) {
    return this.systemApi.createWindowWithInitData({ type: 'readMail', additionalParams: { account: '' } }, { eventName: 'initPage', eventData: mailId, _account: '' });
  }

  deleteExpiredTask(idList: number[]) {
    return this.DBApi.deleteById(
      {
        dbName: this.dbName,
        tableName: this.tableName,
      },
      idList
    );
  }

  doUpdateContactSyncTask(params: Omit<ContactSyncTaskEntity, 'expiredTime'>) {
    return this.DBApi.put(
      {
        dbName: this.dbName,
        tableName: this.contactSyncTaskTableName,
      },
      {
        ...params,
        id: this.systemApi.md5([params.account, params.domain, params.from].join(',')),
        expiredTime: Date.now() + 30 * 60 * 1000,
      }
    );
  }

  async doDeleteContactSyncTask(params: Pick<ContactSyncTaskEntity, 'account' | 'domain' | 'from'>) {
    const $id = this.systemApi.md5([params.account, params.domain, params.from].join(','));
    await this.DBApi.put(
      {
        dbName: this.dbName,
        tableName: this.contactSyncTaskTableName,
      },
      {
        ...params,
        id: $id,
        source: 'unknown',
        expiredTime: 0,
      }
    );
  }

  async getContactSyncTask(params: Pick<ContactSyncTaskEntity, 'account' | 'domain' | 'from'>) {
    const $id = this.systemApi.md5([params.account, params.domain, params.from].join(','));
    // const account = _account || this.systemApi.getCurrentUser()?.accountMd5 || '';
    try {
      const result = (await this.DBApi.getByEqCondition({
        dbName: this.dbName,
        tableName: this.contactSyncTaskTableName,
        query: params,
      })) as unknown as ContactSyncTaskEntity[];
      if (Array.isArray(result) && result.length > 0) {
        return result[0]!;
      }
    } catch (ex) {
      console.error('[task_impl]getContactSyncTask.error:', ex);
    }

    return {
      ...params,
      id: $id,
      account: params.account,
      source: 'unknown',
      expiredTime: 0,
    } as unknown as ContactSyncTaskEntity;
  }

  getContactDoneStep(param: ContactSyncTaskEntity | undefined) {
    if (!param) {
      return 'none';
    }
    // 如果没有step字段 表示是19版本的老数据
    // param.expiredTime!==0 表示上次更新还没有做完
    if (!Reflect.has(param, 'step') && param.isAll && param.expiredTime !== 0) {
      return param.isAll ? 'none' : 'increase';
    }

    // 如果step=core 表示核心数据已经同步完了(核心数据不分页 只要有记录就表示同步完成)
    // 如果step=all 需要根据isDone判断全量同步是否已经做完
    if (param.step === 'core') {
      return 'core';
    }
    if (param.step === 'all') {
      return param.done ? 'all' : 'core';
    }
    if (param.step === 'increase') {
      return param.done ? 'increase' : 'all';
    }
    return 'none';
  }

  onPathChange(ev?: ApiLifeCycleEvent) {
    if (ev && ev.curPath?.pathname === '/') {
      !this.isInited && this.afterInit();
    }
    return this.name;
  }

  afterInit() {
    if (this.isInited) {
      return this.name;
    }
    this.DBApi.initDb(this.dbName);
    this.executeAfterLoginTask().then().catch(console.warn);
    this.isInited = true;
    return this.name;
  }

  afterLogin() {
    return this.name;
  }

  init(): string {
    return this.name;
  }
}

const impl: Api = new TaskApiImpl();
api.registerLogicalApi(impl);
export default impl;
