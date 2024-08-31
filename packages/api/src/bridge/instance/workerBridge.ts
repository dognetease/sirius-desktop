import lodashGet from 'lodash/get';
import { SupportNamespaces, BRIDGE_RESPONSE_CODE, Broadcast2AllWinParams } from '../interface/common';
import { WorkerBridge, WorkerCommonHandleItem, WorkerResponseHandleItem, TaskResponse, WorkerTaskParams } from '../interface/register';
import { api as masterApi } from '@/api/api';
import { isElectron, inWindow } from '@/config';
import { WorkerBridgeMange } from '../interface/webWorkerDriver';
import { SystemEvent } from '@/api/data/event';
import bridgeProxyConfigList from '../config/config';
import { WorkerBridgeImpl as WebWorkerBridgeImpl } from '../webdriver/webWorkerEngine';
import { isSupportNativeProxy } from '@/api/util';

type OmitStringType<T, R> = T extends R ? never : T;

export class WorkerBridgeApi implements WorkerBridge {
  private engine: WorkerBridgeMange | null = null;

  // private bridgeWebInstance: WorkerBridgeMange | null = null;

  private systemApi = masterApi.getSystemApi();

  eventApi = masterApi.getEventApi();

  private responseHandleMap: Map<string, WorkerResponseHandleItem> = new Map();

  private commonHandleMap: Map<SupportNamespaces, WorkerCommonHandleItem> = new Map();

  static MaxEnableExcuteCount = 10;

  // 异步执行队列(最大长度10)
  private asyncExcuteCount = 0;

  private lastPingTimestamp = Date.now();

  // 需要关注三个模块的ready的状态
  private needReadyModuleNames = new Set(['mail', 'account']);

  constructor() {
    // this.init();
    console.log('workerBridge.start');
  }

  async init() {
    // if非window环境 || 在前台
    if (!inWindow() || (window.isBridgeWorker !== true && window.isAccountBg !== true)) {
      return;
    }
    // 执行workerBridgeManage初始化
    if (isElectron()) {
      this.engine = Object.assign(window.electronLib.workerBridgeManage, {
        broadcast2AllWin() {},
        addWinEvent() {},
        removeWinEvent() {},
      });
    } else {
      this.engine = new WebWorkerBridgeImpl();
    }

    this.initRegister();

    const eventId = this.eventApi.registerSysEventObserver('initModule', {
      name: 'initModule-workerBridge',
      func: (ev: SystemEvent<unknown>) => {
        const moduleName = ev.eventStrData!;
        this.needReadyModuleNames.delete(moduleName);
        if (this.needReadyModuleNames.size === 0) {
          this.eventApi.unregisterSysEventObserver('initModule', eventId);
          this.startPullTask();
          this.ping();
          this.subAccountPageInnerEvents();
          setTimeout(() => {
            this.sendSubAccountReadyEvent();
          }, 30);

          // 检查任务是否执行卡死
          // this.scheduleInspectTask();
          // 检查调度器是否OK(这两个保障力度不一样)
          this.startInspectWorkerbridgeAlive();
        }
      },
    });
  }

  // 启动一个定时器(5s) 定时检查任务的执行状态
  scheduleInspectTask() {
    this.systemApi.intervalEvent({
      eventPeriod: 'short',
      handler: ev => {
        if (ev.seq % 5 !== 0 || ev.seq === 0) {
          return;
        }
        this.checkTaskAlive();
      },
      seq: 0,
    });
  }

  // 承接账号后台页面所有的inner事件
  private subAccountPageInnerEvents() {
    this.eventApi.registerSysEventObserver('error', {
      func: ev => {
        // @todo:郭超 需要想办法当error事件发送到对应的窗口去
        console.warn('[accountPage-innerevent]', ev);
      },
    });
  }

  // 发布当前账号(从属账号的)ready事件到主账号界面
  private async sendSubAccountReadyEvent() {
    if (window && window.isAccountBg) {
      const mainAccount = this.systemApi.getMainAccount();
      const subAccount = this.systemApi.getCurrentSubAccount();
      const agentAccount = this.systemApi.getCurrentAgentAccount();
      const winInfo = await window.electronLib.windowManage.getCurWindow();
      this.eventApi.sendSysEvent({
        eventName: 'SubAccountWindowReady',
        eventData: {
          mainAccount: mainAccount.email,
          subAccount: subAccount.email,
          winId: winInfo?.id,
          webId: winInfo?.webId,
          agentEmail: agentAccount.email,
        },
      });
    }
  }

  // 注册初始化方法
  private initRegister() {
    // 注册一个通用的方法.
    this.registerCommonCMD('common', async () => true);

    // 注册一个抛错的方法测试耗时
    this.registerResponseCMD('common', 'thrownError', args => {
      throw new Error(args[0] as string);
    });

    // 查询当前窗口对应的webId
    this.registerResponseCMD('common', 'lookupWebId', async () => {
      if (isElectron()) {
        return window.electronLib.windowManage.getCurWindow();
      }
      return 'no-webid-inweb';
    });

    // 注册一个延时返回方法
    this.registerResponseCMD('common', 'sleep', () => new Promise(r => setTimeout(r, 100)));

    // 注册一个长任务
    this.registerResponseCMD(
      'common',
      'longWait',
      () =>
        new Promise(resolve => {
          setTimeout(resolve, 60 * 1000);
        })
    );

    // 注册一个通用的图片缓存方法
    this.registerResponseCMD('common', 'cacheImage', args => {
      const img = new Image();
      img.src = (args as [string])[0];
      return Promise.resolve(true);
    });

    this.registerResponseCMD('common', 'forwardEvent', args => {
      if (Array.isArray(args) && args.length) {
        this.eventApi.sendSysEvent(args[0]);
      }
      return Promise.resolve(true);
    });
  }

  // 主动向主进程拉任务
  private startPullTask(forcePullTask = false) {
    this.returnTaskResult(
      {
        ackNo: `RESIDENT-TASK-${Math.random()}`,
        code: 0,
        data: undefined,
        errorMsg: 'ok',
        duration: [0],
      },
      forcePullTask
    );
  }

  private ping() {
    const account = lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '');
    this.systemApi.intervalEvent({
      eventPeriod: 'mid',
      handler: () => {
        const now = Date.now();
        if (now - this.lastPingTimestamp < 10 * 1000) {
          return;
        }
        this.engine!.ping(account);
      },
      seq: 0,
    });
  }

  returnTaskResult(result: Omit<TaskResponse, 'account'>, forcePullTask = false): Promise<unknown> {
    setTimeout(async () => {
      const enableCount = Math.max(WorkerBridgeApi.MaxEnableExcuteCount - this.asyncExcuteCount, 0);
      this.lastPingTimestamp = Date.now();
      const account = lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '');

      try {
        const res = (await this.engine!.returnTaskResult({
          response: result,
          options: {
            count: enableCount,
            type: 'bkStable',
            account,
            forcePullTask,
          },
        })) as WorkerTaskParams[];

        this.doHandleTaskList(res);
      } catch (ex) {
        console.error('[pullTask]error:', ex);
        // 异常场景 重新拉任务
        this.startPullTask();
      }
    }, 0);
    return Promise.resolve(true);
  }

  // 管理所有的异步任务检查轮询句柄
  private taskLivenessCheckHandleMap: Map<string, number> = new Map();

  // 轮询检查任务执行情况
  private checkTaskAlive() {
    let deadTaskCount = 0;

    [...this.taskLivenessCheckHandleMap.keys()].forEach(seqNo => {
      const checkCount = this.taskLivenessCheckHandleMap.get(seqNo)!;
      if (checkCount > 0) {
        this.taskLivenessCheckHandleMap.set(seqNo, checkCount - 1);
      } else {
        deadTaskCount += 1;
        this.taskLivenessCheckHandleMap.delete(seqNo);
      }
    });
    // 如果有超时未响应任务 强行调度一次
    if (deadTaskCount) {
      this.setAsyncExcuteCount(Math.min(this.asyncExcuteCount + deadTaskCount, WorkerBridgeApi.MaxEnableExcuteCount));
      this.startPullTask(true);
    }
  }

  // 处理主进程返回的任务
  async doHandleTaskList(list: WorkerTaskParams[]) {
    // 遍历所有任务全部执行一次拿到结果然后将结果回传
    const startTime = Date.now();
    (Array.isArray(list) ? list : []).forEach(async item => {
      // 存储任务检查句柄
      this.taskLivenessCheckHandleMap.set(item.seqNo, this.getTaskRespondCheckCount(item.requestContent.namespace, item.requestContent.apiname));

      try {
        this.setAsyncExcuteCount(this.asyncExcuteCount + 1);
        const result = await this.handleRequest(item);
        const endTime = Date.now();

        // 设置执行中的异步任务个数(减任务的时候不重置workerbridge live检查次数)
        this.setAsyncExcuteCount(this.asyncExcuteCount - 1, false);
        return this.returnTaskResult({
          code: BRIDGE_RESPONSE_CODE.SUCCESS,
          data: result,
          errorMsg: 'ok',
          ackNo: item.seqNo,
          duration: [endTime - startTime],
        });
      } catch (ex) {
        const errMsg = ex instanceof Error ? ex.message : (ex as string);
        this.setAsyncExcuteCount(this.asyncExcuteCount - 1, false);
        return this.returnTaskResult({
          code: errMsg === 'un-register-handle' ? BRIDGE_RESPONSE_CODE.API_UNREGISTER : BRIDGE_RESPONSE_CODE.API_RESPONSE_ERROR,
          errorMsg: errMsg,
          ackNo: item.seqNo,
        });
      } finally {
        // 取消定时检查
        this.taskLivenessCheckHandleMap.delete(item.seqNo);
      }
    });
    return true;
  }

  private workerUnliveCount = 0;

  /**
   * 检查后台任务进程是否存货(workerUnliveCount>=4即认为是后台进程已经停止拉任务了)
   * 最长一分钟后台进程不拉任务即重启
   */
  private startInspectWorkerbridgeAlive() {
    this.systemApi.intervalEvent({
      eventPeriod: 'mid',
      handler: () => {
        if (this.workerUnliveCount >= 4) {
          this.startPullTask(true);
          this.workerUnliveCount = 0;
          return;
        }
        this.workerUnliveCount += 1;
      },
      seq: 0,
    });
  }

  //
  /**
   * @name 设置当前异步任务执行个数
   * @param count {number} 任务个数
   * @param isResetUnliveCount {boolean} 是否重置任务
   */
  private setAsyncExcuteCount(count: number, isResetUnliveCount = true) {
    // 是否要重置任务
    if (isResetUnliveCount) {
      this.workerUnliveCount = 0;
    }

    this.asyncExcuteCount = count;
  }

  // 获取当前任务的轮询检查次数(总TTL=config中配置的2倍时间 设置5S检查一次?)
  getTaskRespondCheckCount(namespace: string, apiname: string) {
    const defaultCount = (30 * 1000) / (5 * 1000);

    const bridgeProxyConfig = bridgeProxyConfigList.find(item => item.namespace === namespace);

    if (!bridgeProxyConfig) {
      return defaultCount;
    }

    const moduleTimeoutDuration = lodashGet(bridgeProxyConfig, 'priorityConfig[1]', 0);

    const apiconfig = bridgeProxyConfig.apis.filter(item => typeof item !== 'string').find(item => (item as OmitStringType<typeof item, string>).key === apiname);

    const apiTimeoutDuration = lodashGet(apiconfig, 'priorityConfig[1]', 0);

    if (typeof apiTimeoutDuration === 'number' && apiTimeoutDuration !== 0) {
      const count = apiTimeoutDuration / (5 * 1000);
      return Math.ceil(count);
    }
    if (typeof moduleTimeoutDuration === 'number' && moduleTimeoutDuration !== 0) {
      const count = moduleTimeoutDuration / (5 * 1000);
      return Math.ceil(count);
    }

    return defaultCount;
  }

  // 处理主窗口返回的数据
  async handleRequest(params: WorkerTaskParams) {
    const { namespace, apiname, args } = params.requestContent;
    if (this.responseHandleMap.has([namespace, apiname].join('.'))) {
      const func = this.responseHandleMap.get([namespace, apiname].join('.')) as WorkerResponseHandleItem;
      return func(args);
    }
    if (this.commonHandleMap.has(namespace)) {
      const func = this.commonHandleMap.get(namespace) as WorkerCommonHandleItem;
      return func(apiname, args);
    }

    return Promise.reject(new Error('un-register-handle'));
  }

  // 注册通用兜底方法到workerBridgeManage
  async registerCommonCMD(namespace: SupportNamespaces, handler: WorkerCommonHandleItem) {
    this.commonHandleMap.set(namespace, handler);
  }

  // 注册API处理方法到workerBridgeManage
  async registerResponseCMD(namespace: SupportNamespaces, cmd: string, handler: WorkerResponseHandleItem) {
    this.responseHandleMap.set([namespace, cmd].join('.'), handler);
  }

  broadcast2AllWin(eventName: string, params: Broadcast2AllWinParams) {
    if (isElectron()) {
      return;
    }
    this.engine!.broadcast2AllWin(eventName, params);
  }

  addWinEvent(eventName: string, callback: (param: unknown) => void) {
    if (isElectron()) {
      return;
    }
    this.engine!.addWinEvent(eventName, callback);
  }

  removeWinEvent(eventName: string, eventId?: string) {
    if (isElectron()) {
      return;
    }
    this.engine!.removeWinEvent(eventName, eventId);
  }
}

export const workerBridgeInstance = isSupportNativeProxy ? new WorkerBridgeApi() : null;
