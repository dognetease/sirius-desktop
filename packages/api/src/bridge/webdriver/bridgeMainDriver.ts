// 负责维护管理所有的任务(类似于main/BridgeManage)
import { MainChannelApi, MainChannel } from './webChannel';
import { ChannelParams } from '../interface/webChannel';

import { TaskPromise, BridgeTaskPriority } from '../interface/common';
import { PriorityTaskDetail, TaskDetailInMain, BRIDGE_RESPONSE_TYPE, BRIDGE_RESPONSE_CODE } from '../interface/webMainDriver';
import { ReturnTaskParams } from '../interface/webWorkerDriver';
import { inWindow } from '@/config';
import { DispatchTaskRequestContent } from '../interface/proxy';
import { TaskResponse } from '../interface/register';
import { isSupportNativeProxy } from '@/api/util';

type Options = ReturnTaskParams['options'];

interface TaskStackMap {
  highTasks: (PriorityTaskDetail & Partial<TaskPromise>)[];
  mediumTasks: (PriorityTaskDetail & Partial<TaskPromise>)[];
  lowTasks: PriorityTaskDetail[];
  timeoutTasks: (TaskDetailInMain & Partial<TaskPromise>)[];
}

export class MainBridgeEngine {
  private taskStackMap: Map<string, TaskStackMap> = new Map();

  private mainChannelApi: MainChannelApi = new MainChannel();

  // web环境不支持多session窗口
  static DEFAULT_WORKER_WEBID = 1;

  // 处理中的任务(任务被任务窗口接受就需要转移到这里了)
  private taskListInProcess: Map<string | number, TaskDetailInMain> = new Map();

  // 后台数据处理窗口
  private bgDataWinList: Map<
    string,
    {
      timestamp: number;
      account: string;
      status: 'connect' | 'unconnect';
    }
  > = new Map();

  private priorityConfigMap: Map<string, { priority: BridgeTaskPriority; overtime: number }> = new Map([
    [
      'mail.saveMails',
      {
        priority: 'high',
        overtime: 5 * 1000,
      },
    ],
  ]);

  static DefaultTimeoutResponseTime: Map<Exclude<BridgeTaskPriority, 'low'>, number> = new Map([
    ['high', 20 * 1000],
    ['medium', 30 * 1000],
  ]);

  // 所有的接口响应超时管理
  private responseTimeoutManageMap: Map<string, ReturnType<typeof setTimeout>> = new Map();

  // 所有的接口耗时统计管理
  private consumingDurationManageMap: Map<string, number> = new Map();

  static traverDuration = 100;

  static MaxLowPriorityCount = 2;

  // 窗口存活的最大有效时间(暂定10s)
  static WinMaxAliveDuration = 20 * 1000;

  constructor() {
    if (inWindow() && isSupportNativeProxy) {
      this.delayInit();
    }
  }

  private async delayInit() {
    // 等待impl list初始化结束
    await new Promise(r => setTimeout(r, 100));
    this.initIpcChannel();
  }

  createSubPage() {
    console.log('[bridge.web]1.26版本之后web不在创建iframe页面');
  }

  removeSubPage() {
    const bgIframe = document.getElementById('accountBgEntry');
    bgIframe?.remove();
  }

  initIpcChannel() {
    this.mainChannelApi.registerHandleCallback('dispatchTask', async (e, params) => {
      console.log('[web-bridge]dispatchTask.invoked', e, params);
      const channelId = e.data.channelId!;
      const data = await this.dispatchTask(e, {
        ...params,
        channelId,
      });
      return Promise.resolve({ data });
    });

    this.mainChannelApi.registerHandleCallback('returnTaskResult', async (e, params) => {
      const data = await this.returnTaskResult(e, params);
      return Promise.resolve({ data });
    });

    this.mainChannelApi.registerHandleCallback('registerTaskHandleWin2Main', async (e, args) => {
      console.log('[web-bridge]registerTaskHandleWin2Main.invoked', e, args);
      const data = await this.registerTaskHandleWin2Main();
      return Promise.resolve({ data });
    });

    this.mainChannelApi.registerHandleCallback('flush', async (e, args) => {
      console.log('[web-bridge]flush.invoked', e, args);
      const data = await this.flush(args);
      return Promise.resolve({ data });
    });

    this.mainChannelApi.registerHandleCallback('getAllTasks', async (e, args) => {
      console.log('[web-bridge]flush.getAllTasks', e, args);
      const data = await this.getAllTasks(args);
      return Promise.resolve(data);
    });

    this.mainChannelApi.registerHandleCallback('configureApiPriority', async (e, args) => {
      console.log('[web-bridge]configureApiPriority.invoked', e, args);
      const data = await this.configureApiPriority(args);
      return Promise.resolve(data);
    });
    this.mainChannelApi.registerHandleCallback('getConfigureTaskPriority', async () => {
      const data = await this.getConfigureTaskPriority();
      return Promise.resolve(data);
    });

    // 注册一个报活处理函数
    this.mainChannelApi.registerHandleCallback('ping', async (e, args: string) => {
      const channelId = e.data.channelId!;
      this.delayDetectBgWin(channelId, args);
      return true;
    });

    // 注册一个广播消息方法
    this.mainChannelApi.registerHandleCallback('broadcastEvent2All', async (e, args: { businessEventName: string; params: unknown }) => {
      console.warn('[web-bridge]broadcastEvent2All', e, args);
      const { businessEventName: eventname, params } = args;
      this.mainChannelApi.broadcast(
        {
          eventname,
          args: params,
        },
        {
          excludeSelf: true,
          selfChannelId: e.data.channelId!,
        }
      );
    });
  }

  // 清空所有的任务
  async flush(account: string) {
    // 清空待接受请求
    if (!account || !account.length) {
      [...this.taskStackMap.keys()].map(accountItem => this.flush(accountItem));
      return true;
    }

    if (!this.taskStackMap.has(account)) {
      return true;
    }

    const taskStack = this.taskStackMap.get(account)!;
    // 清空待接受请求
    [...taskStack.highTasks, ...taskStack.mediumTasks, ...taskStack.timeoutTasks].forEach(item => {
      const { reject } = item;
      typeof reject === 'function' && reject(new Error(BRIDGE_RESPONSE_TYPE.BG_WIN_UNRESPONSE));
    });
    // 清空请求中的请求
    const keys = [...this.taskListInProcess.keys()].filter(item => this.taskListInProcess.get(item)!.requestContent.account === account);
    keys.forEach(ackNo => {
      this.doReturn2JobQ({
        ackNo: ackNo as string,
        code: BRIDGE_RESPONSE_CODE.BG_WIN_UNRESPONSE,
        errorMsg: BRIDGE_RESPONSE_TYPE.BG_WIN_UNRESPONSE,
      });
      this.taskListInProcess.delete(ackNo);
    });
    return true;
  }

  // 配置当前任务的优先级和超时时长
  configureApiPriority(config: { taskInfo: Omit<DispatchTaskRequestContent, 'args' | 'account'>; priority: BridgeTaskPriority; overtime: number | undefined }) {
    const { taskInfo, priority } = config;
    const defaultOvertime = MainBridgeEngine.DefaultTimeoutResponseTime.has(priority as Exclude<BridgeTaskPriority, 'low'>)
      ? MainBridgeEngine.DefaultTimeoutResponseTime.get(priority as Exclude<BridgeTaskPriority, 'low'>)
      : Infinity;

    const key = [taskInfo.namespace, taskInfo.apiname].join('.');
    this.priorityConfigMap.set(key, {
      priority,
      overtime: (config.overtime || defaultOvertime) as number,
    });
    return true;
  }

  // 返回当前所有的定义优先级
  getConfigureTaskPriority() {
    return this.priorityConfigMap;
  }

  async getAllTasks(account: string) {
    if (!this.taskStackMap.has(account)) {
      return {};
    }

    const totalTasks = [...this.taskStackMap.values()];

    return {
      highTaskStatck: totalTasks
        .map(item => item.highTasks)
        .flat(1)
        .map(item => {
          const _item = { ...item };
          Reflect.deleteProperty(_item, 'resolve');
          Reflect.deleteProperty(_item, 'reject');
          return _item;
        }),
      mediumTaskStack: totalTasks
        .map(item => item.mediumTasks)
        .flat(1)
        .map(item => {
          const _item = { ...item };
          Reflect.deleteProperty(_item, 'resolve');
          Reflect.deleteProperty(_item, 'reject');
          return _item;
        }),
      lowTaskStack: totalTasks
        .map(item => item.lowTasks)
        .flat(1)
        .map(item => {
          const _item = { ...item };
          Reflect.deleteProperty(_item, 'resolve');
          Reflect.deleteProperty(_item, 'reject');
          return _item;
        }),
      timeoutStatck: totalTasks
        .map(item => item.timeoutTasks)
        .flat(1)
        .map(item => {
          const _item = { ...item };
          Reflect.deleteProperty(_item, 'resolve');
          Reflect.deleteProperty(_item, 'reject');
          return _item;
        }),
      taskListInProcess: [...this.taskListInProcess.values()].filter(item => item.requestContent.account === account),
    };
  }

  async registerTaskHandleWin2Main() {
    return true;
  }

  // 配置当前任务的超时逻辑
  private configDelayrejectAboutTask(args: TaskDetailInMain) {
    const { seqNo, requestContent } = args;
    const key = [requestContent.namespace, requestContent.apiname].join('.');
    console.log('[bridge]configDelayrejectAboutTask1', 'key is:', key);

    // 获取当前接口的优先级以及超时时长
    const priorityAndOvertime = (
      this.priorityConfigMap.has(key)
        ? this.priorityConfigMap.get(key)
        : ({
            priority: 'meidum',
            overtime: MainBridgeEngine.DefaultTimeoutResponseTime.get('medium'),
          } as unknown)
    ) as {
      priority: BridgeTaskPriority;
      overtime: number;
    };

    // 如果是低幼任务不处理
    if (priorityAndOvertime.priority === 'low') {
      return;
    }

    const timeoutFunc = () => {
      // 从任务队列中查找
      const taskStackList = this.taskStackMap.get(requestContent.account as string);

      [taskStackList!.highTasks, taskStackList!.mediumTasks, taskStackList!.timeoutTasks].some(stacklist => {
        const index = stacklist.findIndex(item => item.seqNo === seqNo);
        if (index === -1) {
          return false;
        }
        const taskInfo = stacklist[index] as TaskPromise;
        // 触发reject 直接返回错误
        typeof taskInfo.reject === 'function' && taskInfo.reject(new Error(BRIDGE_RESPONSE_TYPE.API_RESPONSE_TIMEOUT));
        // 从队列中移除
        stacklist.splice(index, 1);
        return true;
      });

      // 如果在待执行队列中没有找到当前seq 表示当前接口已经响应了要在处理中列表中去找
      if (this.taskListInProcess.has(seqNo)) {
        this.doReturn2JobQ({
          ackNo: seqNo,
          code: BRIDGE_RESPONSE_CODE.API_RESPONSE_TIMEOUT,
          errorMsg: BRIDGE_RESPONSE_TYPE.API_RESPONSE_TIMEOUT,
        });
      }
    };

    const $t = setTimeout(() => {
      timeoutFunc();
    }, priorityAndOvertime.overtime);

    this.responseTimeoutManageMap.set(seqNo, $t);
  }

  async checkBgAlive(account: string) {
    const totalList = [...this.bgDataWinList.values()];
    const winList = totalList.filter(item => item.status === 'connect').filter(item => item.account === account);
    // 当前account对应的窗口list>0 & 有至少一个窗口的报活时间戳在规定的时间内
    const now = Date.now();
    const flag1 = winList.length > 0;
    const flag2 = winList.some(item => now - item.timestamp <= MainBridgeEngine.WinMaxAliveDuration);
    return Promise.resolve(flag1 && flag2);
  }

  // 根据任务优先级将任务分发到不同的队列中去
  async dispatchTask(e: MessageEvent<ChannelParams>, args: TaskDetailInMain) {
    console.log('[web-bridge]main.dispatchTask start:', e, args);

    const taskAccount = args.requestContent.account;
    // 如果使用的是无效账号 直接返回错误
    if (typeof taskAccount !== 'string' || !taskAccount.length) {
      return Promise.reject(new Error(BRIDGE_RESPONSE_TYPE.INVALD_ACCOUNT_NOACCOUNT));
    }
    // 不存在后台任务窗口直接返回错误
    const hasTaskWin = await this.checkBgAlive(taskAccount);
    if (!hasTaskWin) {
      return Promise.reject(new Error(BRIDGE_RESPONSE_TYPE.BG_WIN_NOT_EXIST));
    }
    console.log('[bridge]pushtask', JSON.stringify(args));
    const now = Date.now();
    const key = [args.requestContent.namespace, args.requestContent.apiname].join('.');

    const priority = this.priorityConfigMap.has(key) ? this.priorityConfigMap.get(key)!.priority : 'medium';

    // 配置当前接口的超时处理函数
    this.configDelayrejectAboutTask(args);

    // 统计接受到任务时间点
    this.consumingDurationManageMap.set(args.seqNo, now);

    if (priority === 'high' || priority === 'medium') {
      const duration = priority === 'high' ? 200 : 500;

      return new Promise((resolve, reject) => {
        const taskDetail = {
          ...args,
          overtime: now + duration,
          resolve,
          reject,
        };

        // 这种频繁get/set的操作感觉不太友好.需要进一步优化@guochao
        const taskList = this.taskStackMap.get(taskAccount)![priority === 'high' ? 'highTasks' : 'mediumTasks'];
        taskList.push(taskDetail);
      });
    }
    if (priority === 'low') {
      const duration = 1000 * 20;
      const taskDetail = {
        ...args,
        overtime: now + duration,
      };
      const taskList = this.taskStackMap.get(taskAccount)!.lowTasks;
      taskList.push(taskDetail);
      this.taskStackMap.get(taskAccount)!.lowTasks.push(taskDetail);
      return Promise.resolve(true);
    }
    return Promise.reject(new Error('NO_PRIORITY'));
  }

  async doReturn2JobQ(response: TaskResponse) {
    const { ackNo } = response;

    // 如果当前任务没有的话
    if (!this.taskListInProcess.has(ackNo)) {
      return;
    }

    // 查找timeout句柄删除
    if (this.responseTimeoutManageMap.has(ackNo)) {
      const t = this.responseTimeoutManageMap.get(ackNo) as ReturnType<typeof setTimeout>;
      clearTimeout(t);
      this.responseTimeoutManageMap.delete(ackNo);
    }

    const { channelId } = this.taskListInProcess.get(ackNo) as TaskDetailInMain;
    console.log(`[bridge]returntask.ackNo:${ackNo}.exist:${this.taskListInProcess.has(ackNo)}`);
    console.log(`[bridge]returntask.winID:${channelId}`);
    // 删除记录
    this.taskListInProcess.delete(ackNo);
    // const winInfo = this.getWinInfoByWebId(webId);

    // 统计bridge耗时
    let durationList: undefined | number[];
    // 如果数据窗口下发了duration统计
    if (this.consumingDurationManageMap.has(response.ackNo)) {
      const bgDuration = Array.isArray(response.duration) ? response.duration : [];
      durationList = [this.consumingDurationManageMap.get(response.ackNo) as number, ...bgDuration];
    }

    // 向jobQ发送回执
    this.mainChannelApi.send2Render(channelId, {
      type: 'response',
      ackNo,
      code: response.code,
      data: response.code === 0 ? response.data : undefined,
      errorMsg: response.errorMsg,
      duration: durationList,
    });

    this.consumingDurationManageMap.delete(response.ackNo);
  }

  // 初始化任务池Map
  private initTaskMap(taskAccount: string) {
    if (this.taskStackMap.has(taskAccount)) {
      return;
    }
    const taskStackList = {
      highTasks: [],
      mediumTasks: [],
      lowTasks: [],
      timeoutTasks: [],
    } as {
      highTasks: (PriorityTaskDetail & Partial<TaskPromise>)[];
      mediumTasks: (PriorityTaskDetail & Partial<TaskPromise>)[];
      lowTasks: PriorityTaskDetail[];
      timeoutTasks: (TaskDetailInMain & Partial<TaskPromise>)[];
    };
    this.taskStackMap.set(taskAccount, taskStackList);
  }

  // 返回任务执行结果
  async returnTaskResult(e: MessageEvent<ChannelParams>, args: { response?: TaskResponse; options: Options }) {
    const { response, options } = args;

    const channelId = e.data.channelId!;

    this.delayDetectBgWin(channelId, options.account);
    // 初始化当前account对应的任务池Map(之前放在dispatchtask 感觉还是放到pullTask的时候执行更合理)
    this.initTaskMap(options.account);

    // 异步将response返给前台 避免因为return2Job报错导致pullTask停止
    setTimeout(async () => {
      if (!args.response || !this.taskListInProcess.has(args.response.ackNo)) {
        return;
      }

      try {
        await this.doReturn2JobQ(response as TaskResponse);
      } catch (ex) {
        console.error('[bridge]returnTaskResult.doReturn2JobQ error', ex);
      }
    }, 0);

    try {
      const res = await this.pullTasks(channelId, options);
      return res;
    } catch (ex) {
      // console.log('[bridge]pullTask.error', options.account, ex);
      // 测试代码:貌似ispulling=true之后 有场景没有办法正确的重置
      this.pullingLockMap.set(channelId, false);
      // 强制给后台返回一个空任务
      return Promise.resolve(
        options.count > 0
          ? [
              {
                seqNo: `RESIDENT-ERRORTASK-${Math.random()}`,
                requestContent: {
                  namespace: 'common',
                  apiname: 'residentTask',
                  args: [
                    {
                      random: Math.random(),
                    },
                  ],
                },
                // fakeWinId
                webId: -999,
              },
            ]
          : []
      );
    }
  }

  // pulling锁 key=webId(不能等于account 因为可能会出现同个web是同一个account的场景)
  private pullingLockMap: Map<string, boolean> = new Map();

  private traverseTimeMap: Map<string, number> = new Map();

  async pullTasks(channelId: string, options: Options) {
    const { count, account } = options;
    if ((this.pullingLockMap.get(channelId) || count <= 0) && !options.forcePullTask) {
      return Promise.resolve([]);
    }

    // 锁定 避免频繁重复拉取
    this.pullingLockMap.set(channelId, true);

    const now = Date.now();
    // 检查任务时间戳是否过期
    if (now - (this.traverseTimeMap.get(channelId) || 0) > MainBridgeEngine.traverDuration) {
      this.traverseTaskDueTime(account);
      this.traverseTimeMap.set(channelId, now);
    }
    await this.waitTask(account, count);

    // 如果没有这个account相关的任务池OR任务池是空的直接返回
    if (!this.taskStackMap.has(account) || Object.values(this.taskStackMap.get(account)!).flat().length === 0) {
      // 测试代码:貌似ispulling=true之后 有场景没有办法正确的重置
      this.pullingLockMap.set(channelId, false);
      return Promise.resolve([
        {
          seqNo: `RESIDENT-EMPTYTASK-${Math.random()}`,
          requestContent: {
            namespace: 'common',
            apiname: 'residentTask',
            args: [{ random: Math.random() }],
          },
          // fakeWinId
          webId: -999,
        },
      ]);
    }

    let list: (TaskDetailInMain & Partial<TaskPromise>)[] = [];
    const { highTasks, mediumTasks, lowTasks, timeoutTasks } = this.taskStackMap.get(account)!;

    if (timeoutTasks.length) {
      const _timeoutTasks = timeoutTasks.splice(0, count);
      // 检查任务队列中是否有resolve等待reply给jobQ
      _timeoutTasks.forEach(item => {
        const { resolve } = item;
        typeof resolve === 'function' && resolve(true);
      });
      _timeoutTasks.map(item => {
        Reflect.deleteProperty(item, 'resolve');
        Reflect.deleteProperty(item, 'reject');
        return item;
      });
      list = list.concat(_timeoutTasks);
    }

    // 拉取高优任务
    if (list.length < count && highTasks.length) {
      const _highTasks = highTasks.splice(0, count - list.length);
      // 通知主页面请求已经被处理
      _highTasks.forEach(item => {
        const { resolve } = item;
        typeof resolve === 'function' && resolve(true);
      });
      // 删除resolve/reject方法(无法序列化)
      _highTasks.map(item => {
        Reflect.deleteProperty(item, 'resolve');
        Reflect.deleteProperty(item, 'reject');
        return item;
      });
      list = [...list, ..._highTasks];
    }

    // console.log('[bridge]pullTask.medium', list.length, count, mediumTasks.length, JSON.stringify(list));
    // 拉取中优任务(逻辑同高优)
    if (list.length < count && mediumTasks.length > 0) {
      const _mediumTasks = mediumTasks.splice(0, count - list.length);
      _mediumTasks.forEach(item => {
        const { resolve } = item;
        typeof resolve === 'function' && resolve(true);
      });
      _mediumTasks.map(item => {
        Reflect.deleteProperty(item, 'resolve');
        Reflect.deleteProperty(item, 'reject');
        return item;
      });
      list = [...list, ..._mediumTasks];
    }

    // 拉取未超时低幼任务
    if (list.length < count) {
      const enableExcuteLowTaskCount = Math.min(count, this.getEnableLowTasksSize(channelId));
      const _lowTasks = lowTasks.splice(0, enableExcuteLowTaskCount);
      list = [...list, ..._lowTasks];
    }

    // 将list放到处理中任务队列
    this.taskListInProcess = new Map([...this.taskListInProcess, ...new Map(list.map(item => [item.seqNo, item]))]);

    // 如果任务列表<要求数量 就在列表中塞入一个默认任务 保证后台窗口一直有任务执行(可以一直从主进程拉任务)
    // 如果主进程中总的任务数量<count 每次间隔最大时间20ms
    // 如果主进程中总的任务数量===0 每次最大间隔时间2s
    if (list.length < count) {
      list.push({
        seqNo: `RESIDENT-TASK-${Math.random()}`,
        requestContent: {
          namespace: 'common',
          apiname: 'residentTask',
          args: [{ random: Math.random() }],
          account: options.account,
        },
        // fakeWinId
        channelId: 'resident-999',
      });
    }

    // 统计当前任务被调度的时间
    // 统计当前任务被调度的时间
    const consumingNow = Date.now();
    list.forEach(item => {
      if (!this.consumingDurationManageMap.has(item.seqNo)) {
        return;
      }
      const startTime = this.consumingDurationManageMap.get(item.seqNo) as number;
      this.consumingDurationManageMap.set(item.seqNo, consumingNow - startTime);
    });
    // console.log('[bridge]pullTask.finally', JSON.stringify(list));
    this.pullingLockMap.set(channelId, false);
    return Promise.resolve(list);
  }

  // 等待任务
  private async waitTask(account: string, count: number) {
    let waitCount = 1;
    // 最多等待2S
    const maxWaitCount = 40;
    let hasTasks = false;

    let $tHandle: null | ReturnType<typeof setTimeout> = null;

    // 获取taskStackMap中指定key的task总数
    const getTaskCount = (account: string, list: (keyof TaskStackMap)[]) => {
      let totalCount = 0;
      const taskStack = this.taskStackMap.get(account) as TaskStackMap;
      list.forEach(key => {
        totalCount += taskStack[key].length;
      });
      return totalCount;
    };

    const waitFunc = (resolve: (args?: unknown) => void) => {
      // 统计非低幼任务个数
      // 统计非低幼任务个数
      const totalTaskCount = this.taskStackMap.has(account) ? getTaskCount(account, ['highTasks', 'mediumTasks', 'mediumTasks']) : 0;
      const highTaskCount = this.taskStackMap.has(account) ? getTaskCount(account, ['highTasks', 'timeoutTasks']) : 0;
      /**
       * 4种场景跳出轮询
       * 1.任务数量>count
       * 2.已经等待超过了10次
       * 3.检测到有任务(<count)并且已经多等待了20ms
       * 4.有高优任务
       */
      if (totalTaskCount >= count || waitCount >= maxWaitCount || hasTasks || highTaskCount > 0) {
        resolve(2);
        return;
        // 如果检测有任务但是任务数量不够 就在等待20ms——这样的话一个任务最大的等待时长差不多是39ms(两次)感觉还是不太OK还得继续优化
      }
      if (totalTaskCount > 0) {
        hasTasks = true;
        $tHandle = setTimeout(() => {
          waitFunc(resolve);
        }, 50);
        return;
      }
      waitCount += 1;
      $tHandle = setTimeout(() => {
        waitFunc(resolve);
      }, 50);
    };

    // 两种策略 一个是执行定时检测.一个是监听派发(如果是高优任务直接返回)
    await new Promise(resolve => {
      waitFunc(resolve);
    });
    $tHandle && clearTimeout($tHandle);
    return true;
  }

  // 延时检测后台窗口是否存活
  private delayDetectBgWin(channelId: string, account: string) {
    this.bgDataWinList.set(channelId, {
      timestamp: Date.now(),
      account,
      status: 'connect',
    });
  }

  // get低幼任务可执行的最大size
  getEnableLowTasksSize(channelId: string) {
    console.log('[web-bridge]getEnableLowTasksSize:', channelId);
    // const taskCountInProcess = [...this.taskListInProcess.values()].filter(item => item.webId === webId).length;
    const taskCountInProcess = [...this.taskListInProcess.values()].length;
    // 最多只可以并发两个低幼任务
    return Math.max(MainBridgeEngine.MaxLowPriorityCount - taskCountInProcess, 0);
  }

  // 遍历队列中所有任务的到期时间(只处理中高优)
  private traverseTaskDueTime(account: string) {
    if (!this.taskStackMap.has(account)) {
      return;
    }
    const nowTime = Date.now();

    const { highTasks, mediumTasks, timeoutTasks } = this.taskStackMap.get(account)!;
    // 找到队列中第一个未超时任务
    const unDueHighTaskIndex = highTasks.findIndex(item => {
      const { overtime } = item;
      return overtime > nowTime;
    });
    const unDueMediumTaskIndex = mediumTasks.findIndex(item => {
      const { overtime } = item;
      return overtime > nowTime;
    });
    // 将超时的高优任务push到高优队列中去(中优任务同理)
    if (unDueHighTaskIndex > 0) {
      this.taskStackMap.get(account)!.timeoutTasks = [...timeoutTasks, ...highTasks.splice(0, unDueHighTaskIndex)];
    }
    if (unDueMediumTaskIndex > 0) {
      this.taskStackMap.get(account)!.timeoutTasks = [...timeoutTasks, ...mediumTasks.splice(0, unDueMediumTaskIndex)];
    }
  }
}
