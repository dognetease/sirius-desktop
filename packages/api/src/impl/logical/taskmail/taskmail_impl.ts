/* eslint-disable class-methods-use-this */
/* eslint-disable max-lines */
import cloneDeep from 'lodash/cloneDeep';
import { api } from '@/api/api';
import { Api, ContactModel } from '@/api/_base/api';
import { SystemApi } from '@/api/system/system';
import { DataTransApi } from '@/api/data/http';
import { DbApiV2, DBList } from '@/api/data/new_db';
import { ContactApi, OrgApi } from '@/api/logical/contactAndOrg';
import { EventApi, SystemEvent } from '@/api/data/event';
import {
  TaskMailApi,
  ExecutorModel,
  TaskMailModel,
  TaskMailList,
  TaskMailListReq,
  TaskMailCommonRes,
  OperateTaskReq,
  UrgeTaskReq,
  ListMailDbModel,
  TaskMailListRes,
  TaskMailSimpleItem,
} from '@/api/logical/taskmail';
import { apis } from '@/config';
import { MailApi } from '@/api/logical/mail';

class TaskMailImplApi implements TaskMailApi {
  name: string;

  private systemApi: SystemApi;

  eventApi: EventApi;

  mailApi: MailApi;

  private readonly DBApi: DbApiV2;

  private dbName: DBList = 'task_mail';

  private taskTableName = 'task';

  private taskListTableName = 'task_list';

  private http: DataTransApi;

  private readonly taskMailPageInfo: { pages: number[] };

  contactApi: ContactApi & OrgApi;

  constructor() {
    this.name = apis.taskMailImplApi;
    this.systemApi = api.getSystemApi();
    this.http = api.getDataTransApi();
    this.DBApi = api.getNewDBApi();
    this.eventApi = api.getEventApi();
    this.mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
    this.contactApi = api.requireLogicalApi(apis.contactApiImpl) as unknown as ContactApi & OrgApi;
    this.taskMailPageInfo = {
      pages: [0],
    };
  }

  init(): string {
    return this.name;
  }

  afterInit() {
    this.DBApi.initDb(this.dbName);
    return this.name;
  }

  // eslint-disable-next-line class-methods-use-this
  async handlePromise<T>(promise: Promise<any>): Promise<TaskMailCommonRes<T>> {
    try {
      const res = await promise;
      const { data } = res;
      return data;
    } catch (e: any) {
      return {
        message: e?.data?.message,
        success: false,
      };
    }
  }

  // TODO：应该使用 putAll 进行批量操作
  saveTaskMailInDb(task: TaskMailModel) {
    return this.DBApi.put(
      {
        tableName: this.taskTableName,
        dbName: this.dbName,
      },
      task
    ).then();
  }

  async assembleContact(tasks: TaskMailModel[]): Promise<TaskMailModel[]> {
    // 获取任务关联用户的 ContactModel
    // let contactIds: string[] = [];
    tasks = cloneDeep(tasks);
    const contactSet: Set<string> = new Set<string>();
    const mapContact: Map<number, Set<string>> = new Map<number, Set<string>>();
    tasks.forEach(task => {
      const taskId = task.todoId;
      const taskSet: Set<string> = new Set<string>();
      if (task.createdBy) {
        contactSet.add(task.createdBy);
        taskSet.add(task.createdBy);
      }
      if (task.focusList && task.focusList.length > 0) {
        task.focusList.forEach(it => {
          contactSet.add(it);
          taskSet.add(it);
        });
      }
      if (task.executorList && task.executorList.length > 0) {
        task.executorList.forEach((_: ExecutorModel) => {
          if (_.accId) {
            contactSet.add(_.accId);
            taskSet.add(_.accId);
          }
        });
      }
      mapContact.set(taskId, taskSet);
    });
    const contactIds = Array.from(contactSet);
    const contactAllMap = new Map();
    if (contactIds.length > 0) {
      const infos = await this.contactApi.doGetContactById(contactIds);
      infos.forEach(item => {
        if (!contactAllMap.get(item.contact.id)) {
          contactAllMap.set(item.contact.id, item);
        }
      });
    }
    tasks.forEach(task => {
      const taskId = task.todoId;
      const taskSet: Set<string> | undefined = mapContact.get(taskId);
      const taskContactList: Map<string, ContactModel> = new Map<string, ContactModel>();
      if (taskSet) {
        taskSet.forEach(it => {
          const value = contactAllMap.get(it);
          if (value) {
            taskContactList.set(it, value);
          }
        });
      }
      task.contactList = taskContactList;
    });

    return tasks;
  }

  // 拟废弃，如有单个的转换，可以使用此函数
  async taskMailModelFormat(task: TaskMailModel): Promise<TaskMailModel> {
    // TODO : 一个列表只调用一次doGetContactById
    // 获取任务关联用户的 ContactModel
    // let contactIds: string[] = [];
    const contactSet: Set<string> = new Set<string>();
    if (task.createdBy) contactSet.add(task.createdBy);
    if (task.focusList && task.focusList.length > 0) task.focusList.forEach(it => contactSet.add(it));
    if (task.executorList && task.executorList.length > 0) {
      task.executorList.forEach((_: ExecutorModel) => {
        if (_.accId) contactSet.add(_.accId);
      });
    }
    const contactIds = Array.from(contactSet);
    const contactList = new Map();
    if (contactIds.length > 0) {
      const infos = await this.contactApi.doGetContactById(contactIds);

      infos.forEach(item => {
        if (!contactList.get(item.contact.id)) {
          contactList.set(item.contact.id, item);
        }
      });
    }
    task.contactList = contactList;
    return task;
  }

  /**
   * 比较任务详情的接口的数据和本地库中是否变更
   * 如果本地库中没有数据，则直接存本地库，不需要通知更新操作
   * 如果变更的话，更新本地库，通知web端更新
   * 如果没有变更，则不进行任何操作
   * @param taskMailList 接口返回的任务详情的list
   */
  async taskMailDiffs(taskMailList: TaskMailModel[]) {
    const changeIds: number[] = [];
    const changeTaskMailMap = new Map();
    const todoIds: number[] = [];
    const taskMailListMap = new Map();
    const dbResultMap = new Map();
    taskMailList.forEach(task => {
      todoIds.push(task.todoId);
      taskMailListMap.set(task.todoId, task);
    });
    const dbResult = (await this.getTaskMailInDb(todoIds)) as TaskMailModel[];
    dbResult.forEach(task => {
      dbResultMap.set(task.todoId, task);
    });
    todoIds.forEach(todoId => {
      const currentTaskMail = taskMailListMap.get(todoId);
      const currentDbTaskMail = dbResultMap.get(todoId);
      if (!currentDbTaskMail) {
        this.saveTaskMailInDb(currentTaskMail);
      } else {
        const isChange = this.diffHandler(currentTaskMail, currentDbTaskMail);
        if (isChange) {
          changeIds.push(todoId);
        }
      }
    });
    changeIds.forEach(todoId => {
      this.saveTaskMailInDb(taskMailListMap.get(todoId));
      changeTaskMailMap.set(todoId, taskMailListMap.get(todoId));
    });
    if (changeIds.length > 0) {
      this.eventApi.sendSysEvent({
        eventName: 'todoChange',
        eventStrData: 'refreshTaskList',
        eventData: {
          taskMailList: changeTaskMailMap,
        },
      } as SystemEvent);
      console.log('有变更，通知web更新');
    }
  }

  diffHandler(currentTaskMail: TaskMailModel, currentDbTaskMail: TaskMailModel): boolean {
    // diff非数组类型的字段
    const needDiff = ['alert', 'alertAt', 'alertTime', 'completed', 'deadline', 'groupType', 'overdue', 'status', 'type', 'userType'];
    for (let i = 0; i < needDiff.length; i++) {
      if (currentTaskMail[needDiff[i] as keyof typeof currentTaskMail] !== currentDbTaskMail[needDiff[i] as keyof typeof currentDbTaskMail]) {
        return true;
      }
    }
    // 比较执行人列表 executorList 字段
    const executorMap = new Map();
    const dbExecutorMap = new Map();
    const executorIds: string[] = [];
    const dbExecutorIds: string[] = [];
    currentTaskMail.executorList.forEach((_: ExecutorModel) => {
      executorIds.push(_.accId);
      executorMap.set(_.accId, _);
    });
    currentDbTaskMail.executorList.forEach((_: ExecutorModel) => {
      dbExecutorIds.push(_.accId);
      dbExecutorMap.set(_.accId, _);
    });
    if (executorIds.length !== dbExecutorIds.length) {
      return true;
    }
    for (let i = 0; i < executorIds.length; i++) {
      if (executorMap.get(executorIds[i]).completeTime !== dbExecutorMap.get(executorIds[i]).completeTime) {
        return true;
      }
      if (executorMap.get(executorIds[i]).status !== dbExecutorMap.get(executorIds[i]).status) {
        return true;
      }
    }
    return false;
  }

  // 目前查询：全量的任务ID List，以及两封置顶的任务详情
  async getTaskMailListInDb(params: TaskMailListReq): Promise<TaskMailListRes> {
    if (!params) {
      return Promise.reject(new Error('参数未传入'));
    }

    let todoToMails: TaskMailSimpleItem[] = [];
    let todoList: TaskMailModel[] = [];

    const todoToMailsIdDb: TaskMailSimpleItem[] = (await this.DBApi.getByEqCondition({
      dbName: this.dbName,
      tableName: this.taskListTableName,
    })) as ListMailDbModel[];

    if (Array.isArray(todoToMailsIdDb) && todoToMailsIdDb.length > 0) {
      todoToMails = todoToMailsIdDb
        .filter(v => !!v)
        .map(v => ({
          todoId: v.todoId,
          tid: v.tid,
          mid: v.mid,
          top: v.top,
          pos: v.pos,
        }))
        .sort((a, b) => a.pos - b.pos);
    }

    if (todoToMails.length > 0) {
      const todoListIds = [...new Set(todoToMails.filter(v => v.top).map(v => v.todoId))].slice(0, 2);
      if (todoListIds.length > 0) {
        todoList = (await this.getTaskMailInDb(todoListIds)) as TaskMailModel[];
      }
    }

    return {
      success: true,
      code: 200,
      data: {
        size: todoToMails.length,
        todoToMails,
        todoList,
        hasNextPage: 0,
      },
    };
  }

  async getTaskMailListInServer(params: TaskMailListReq) {
    // 收件箱，请求2条详情数据（todoList），todoToMails 用于去重，使用服务端原始数据
    // 任务邮件文件夹，请求多条详情数据，不使用服务端返回的 todoToMails，使用 todoList.mailInfo 拼接出新的 todoToMails
    const isForInbox = params.detailCount === 2 && params.status === 1;

    const url = this.systemApi.getUrl('getTaskMailList');
    const res = await this.handlePromise<TaskMailList>(this.http.get(url, params, { noEnqueue: true }));
    if (res && res.data) {
      const { todoList, todoToMails } = res.data;

      if (todoList && todoList.length > 0) {
        res.data.todoList = await this.assembleContact(todoList as TaskMailModel[]);
        if (todoToMails && todoToMails.length > 0) {
          if (isForInbox) {
            // 如果是收件箱，在 res.data.todoList 找到对应的 todoToMails，top 设为 true，并且放在头两位
            // 把res.data.todoToMails 的其他项拼在后面
            const towTopMails: TaskMailSimpleItem[] = [];
            const towTopSet = new Set();
            res.data.todoList.some(outer => {
              const { mailInfos } = outer;
              if (Array.isArray(mailInfos) && mailInfos.length > 0) {
                return mailInfos.some(inner => {
                  const { mid } = inner;
                  if (!towTopSet.has(mid)) {
                    towTopSet.add(mid);
                    towTopMails.push({
                      todoId: outer.todoId,
                      tid: inner.tid,
                      mid: inner.mid,
                      top: true,
                      pos: towTopMails.length,
                    });
                  }
                  return towTopSet.size > 1;
                });
              }
              return false;
            });
            const newTodoMails = res.data.todoToMails
              .filter(v => !towTopSet.has(v.mid))
              .map((v, index) => ({
                ...v,
                top: false,
                pos: index + 100,
              }));
            res.data.todoToMails = [...towTopMails, ...newTodoMails];
          } else {
            // 如果是任务文件夹，则直接使用 res.data.todoList 拼出 todoToMails
            let twoTopCount = 0;
            let pos = 0;
            res.data.todoToMails = todoList.reduce<TaskMailSimpleItem[]>((total, outer) => {
              const { mailInfos } = outer;
              if (Array.isArray(mailInfos) && mailInfos.length > 0) {
                const mails = mailInfos.map(inner => {
                  const top = twoTopCount < 2;
                  if (!top) {
                    twoTopCount += 1;
                  }
                  pos += 1;
                  return {
                    todoId: outer.todoId,
                    tid: inner.tid,
                    mid: inner.mid,
                    pos,
                    top,
                  };
                });
                total.push(...mails);
              }
              return total;
            }, [] as TaskMailSimpleItem[]);
          }
        }
      }
    }
    return res;
  }

  // 获取任务数据，
  // TODO: 仅当status 为1 时，添加数据库支持，只查进行中的数据， 从task_list表中查到list后再去task表查实体数据，整合成TaskMailList 数据 ，
  //  和网络接口比对后，列表数据直接重建入库，model数据进task表
  async doGetFullTaskMailList(params: TaskMailListReq, noCache?: boolean, onlyDb?: boolean): Promise<TaskMailListRes> {
    console.log('[task-mail] noCache ', noCache, 'onlyDb ', onlyDb);
    if (onlyDb) {
      return this.getTaskMailListInDb(params);
    }
    // 目前（1.10）仅对首页进行中的数据进行了本地化
    if (params.status === 1 && params.detailCount === 2) {
      return this.doGetTaskMailList(params, noCache);
    }
    return this.getTaskMailListInServer(params);
  }

  async doGetTaskMailList(params: TaskMailListReq, noCache?: boolean): Promise<TaskMailListRes> {
    console.log('[task-mail] doGetTaskMailList start ', params, noCache);
    let cacheRes: TaskMailListRes | undefined;
    if (!noCache) {
      cacheRes = await this.getTaskMailListInDb(params);
    }
    const netPromise = this.getTaskMailListInServer(params).then(async netRes => {
      console.log('[task-mail] doGetTaskMailList net ', cacheRes, netRes);
      this.syncTaskMail(netRes, cacheRes, { params, eventMerge: true, fromNetwork: noCache }).then();
      return netRes;
    });
    console.log('[task-mail] doGetTaskMailList end ', cacheRes, netPromise);
    return noCache || !cacheRes?.data?.todoToMails || cacheRes?.data?.todoToMails.length === 0 ? netPromise : (cacheRes as TaskMailListRes);
  }

  async syncTaskMail(
    networkRes: TaskMailListRes,
    cacheRes: TaskMailListRes | undefined,
    conf: {
      params: TaskMailListReq;
      eventMerge: boolean; // 为 true 时等待邮件消息中心消息统一发送
      fromNetwork?: boolean;
    }
  ) {
    const { params, eventMerge = true, fromNetwork = false } = conf;
    const dtA = (cacheRes || (await this.getTaskMailListInDb(params))).data;
    const dtB = networkRes.data;
    const isDiff = await this.syncTaskMailHandler(dtA, dtB);

    this.mailApi.doCallMailMsgCenter({
      type: 'syncMail',
      msgCenter: {
        merge: eventMerge,
        diff: !fromNetwork && isDiff,
        refreshType: 'task',
      },
    });
  }

  private async syncTaskMailHandler(
    dtA?: TaskMailList, // 缓存
    dtB?: TaskMailList // 网络
  ): Promise<boolean> {
    if (!dtA && !dtB) {
      return false;
    }
    // 比对待办list
    const todoListA = dtA && dtA.todoList ? dtA.todoList : [];
    const todoListB = dtB && dtB.todoList ? dtB.todoList : [];
    const toDoListDiff = await this.compareAndSyncTodoList(todoListA, todoListB);

    // 比对代办list包含的id数据
    const todoMailsA = dtA && dtA.todoToMails ? dtA.todoToMails : [];
    const todoMailsB = dtB && dtB.todoToMails ? dtB.todoToMails : [];
    const toDoMailsDiff = await this.compareAndSyncTodoMail(todoMailsA, todoMailsB);

    console.log('[task-mail] syncTaskMailHandler toDoListDiff', toDoListDiff, 'toDoListDiff ', toDoMailsDiff);
    return toDoListDiff || toDoMailsDiff;
  }

  private async compareAndSyncTodoList(
    dtA: TaskMailModel[], // 缓存
    dtB: TaskMailModel[] // 网络
  ): Promise<boolean> {
    const changedModels: Map<number, TaskMailModel> = new Map();
    const dtAMap = dtA.reduce<Map<number, TaskMailModel>>((total, current) => total.set(current.todoId, current), new Map());
    const dtBMap = dtB.reduce<Map<number, TaskMailModel>>((total, current) => total.set(current.todoId, current), new Map());

    // 不需要删除，所以以网络数据为基准进行循环
    dtBMap.forEach((itemB, todoId) => {
      const itemA = dtAMap.get(todoId);
      if (!itemA || this.diffHandler(itemB, itemA)) {
        changedModels.set(todoId, itemB);
      }
    });

    const isDiff = changedModels.size > 0;
    if (isDiff) {
      // 更新本地数据库
      const ids = [...changedModels.keys()];
      const db = {
        dbName: this.dbName,
        tableName: this.taskTableName,
      };
      const res = await this.DBApi.getByIds(db, ids);
      if (Array.isArray(res)) {
        const dbRes = res.filter(v => v);
        if (dbRes.length > 0) {
          dbRes.forEach(v => {
            const { todoId } = v;
            const origin = changedModels.get(todoId) || {};
            changedModels.set(todoId, { ...v, ...(origin as TaskMailModel) });
          });
        }
      }
      await this.DBApi.putAll(db, [...changedModels.values()]);
    }

    return isDiff;
  }

  getTaskPageInfo(idx: number) {
    let page = 1;
    if (idx === 0) {
      this.setTaskPageInfo(0, 0);
    } else {
      const { pages } = this.taskMailPageInfo;
      const maxPage = pages[pages.length - 1];
      if (idx > maxPage) {
        page = pages.length + 1;
      } else if (idx > 0) {
        // taskMailPages 记录分页信息，例如 [0, 10]，如果 index 为 10， 则请求第 3 页数据
        for (let i = 0, len = pages.length; i < len; i++) {
          if (idx <= pages[i]) {
            page = i + 1;
            break;
          }
        }
      }
    }
    console.log('[task-mail] get page info', this.taskMailPageInfo.pages);
    return { page };
  }

  setTaskPageInfo(index: number, count: number) {
    if (index === 0) {
      this.taskMailPageInfo.pages = [0];
    }
    const { pages } = this.taskMailPageInfo;
    const lastCount = pages[pages.length - 1];
    if (index + count > lastCount) {
      this.taskMailPageInfo.pages.push(lastCount + count);
    }
    console.log('[task-mail] set page info', this.taskMailPageInfo.pages);
  }

  private async compareAndSyncTodoMail(
    dtA: TaskMailSimpleItem[], // 缓存
    dtB: TaskMailSimpleItem[] // 网络
  ): Promise<boolean> {
    let isDiff = dtB.length > 0 && dtA.length !== dtB.length;

    if (!isDiff) {
      let comparedCount = 0;
      for (let i = 0, len = dtA.length; i < len; i++) {
        const itemA = dtA[i];
        const itemB = dtB[i];
        if (!itemB) {
          isDiff = true;
          break;
        }
        const targets: Array<keyof TaskMailSimpleItem> = ['todoId', 'mid', 'tid', 'top'];
        isDiff = targets.some(key => itemB[key] && itemA[key] !== itemB[key]);
        if (isDiff) {
          break;
        }
        comparedCount += 1;
      }
      isDiff = isDiff || comparedCount < dtB.length;
    }

    if (isDiff) {
      const delIds = [...new Set(dtA.map(v => v.mid || 0))];
      const db = {
        dbName: this.dbName,
        tableName: this.taskListTableName,
      };
      await this.DBApi.deleteById(db, delIds);
      await this.DBApi.putAll(db, dtB);
    }
    return isDiff;
  }

  async getTaskMailInServer(todoIds: number | number[]): Promise<TaskMailCommonRes<TaskMailModel[]>> {
    const params = {
      todoIdList: typeof todoIds === 'number' ? todoIds.toString() : todoIds.join(','),
    };
    const url = this.systemApi.getUrl('getTaskMailContent');
    const res = await this.handlePromise<TaskMailModel[]>(this.http.get(url, params));
    if (res && res.data && res.data.length > 0) {
      return this.assembleContact(res.data).then(taskMailList => {
        res.data = taskMailList;
        this.taskMailDiffs(taskMailList);
        return res;
      });
    }
    return res;
  }

  async doGetTaskMailContent(todoIds: number | number[], noCache?: boolean): Promise<TaskMailCommonRes<TaskMailModel[]>> {
    console.log('[task-mail] called ', todoIds, noCache);
    const todoIdsNum = Array.isArray(todoIds) ? todoIds.length : 1;
    const promise = this.getTaskMailInServer(todoIds);
    if (noCache) {
      // 不需要走本地库
      return promise;
    }
    const dbResult = (await this.getTaskMailInDb(todoIds)) as TaskMailModel[];
    console.log('[task-mail] called ', dbResult);
    if (dbResult && dbResult.length > 0 && dbResult.length >= todoIdsNum) {
      // 本地数据库中有数据
      return {
        success: true,
        message: 'success',
        code: 200,
        data: dbResult,
      };
    }
    // 调用服务端接口
    return promise;
  }

  async getTaskMailInDb(ids: number | number[]) {
    if (!ids) {
      return Promise.reject(new Error('参数未传入'));
    }
    const checkIds = Array.isArray(ids) ? ids : [ids];
    let result = (await this.DBApi.getByIds(
      {
        tableName: this.taskTableName,
        dbName: this.dbName,
      },
      checkIds
    )) as TaskMailModel[];
    console.log('[task-mail] getTaskMailInDb ', result);
    result = result.filter(_ => _);
    if (result && result.length > 0) {
      return this.assembleContact(result as TaskMailModel[]).then(taskMailList => {
        result = taskMailList;
        return result;
      });
    }
    return result;
  }

  async doUrgeTask(params: UrgeTaskReq): Promise<TaskMailCommonRes<string>> {
    const url = this.systemApi.getUrl('urgeTask');
    const res = await this.handlePromise<string>(this.http.post(url, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }));
    return res;
  }

  async doOperateTask(params: OperateTaskReq, userId?: string): Promise<TaskMailCommonRes<string>> {
    const url = this.systemApi.getUrl('operateTask');
    const res = await this.handlePromise<string>(this.http.post(url, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }));
    if (!res.success) {
      return res;
    }

    // 修改更新数据库
    const dbData = (await this.getTaskMailInDb(params.todoId)) as TaskMailModel[];
    if (!dbData || dbData.length === 0) {
      return res;
    }
    let executor = {} as ExecutorModel;
    for (let i = 0; i < dbData[0].executorList.length; i++) {
      if (dbData[0].executorList[i].accId === userId) {
        executor = dbData[0].executorList[i];
      }
    }
    // mark: 0-标记未完成，1-标记完成，2-创建者提前完成任务，3-创建者重新开启
    if (params.mark === 0 && executor.status === 1 && executor) {
      executor.status = 0;
      dbData[0].completed--;
      if (dbData[0].completed < dbData[0].total) {
        dbData[0].status = 0;
      }
    } else if (params.mark === 1 && executor.status === 0 && executor) {
      executor.status = 1;
      executor.completeTime = new Date().getTime();
      dbData[0].completed++;
      if (dbData[0].completed >= dbData[0].total) {
        dbData[0].status = 1;
      }
    } else if (params.mark === 2) {
      dbData[0].status = 2;
    } else if (params.mark === 3) {
      dbData[0].status = 0;
    }
    await this.saveTaskMailInDb(dbData[0]);

    // 返回操作结果
    return res;
  }
}

const taskMailImplApi: Api = new TaskMailImplApi();

api.registerLogicalApi(taskMailImplApi);

export default taskMailImplApi;
