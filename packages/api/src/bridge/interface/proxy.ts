import { SupportNamespaces, BridgeTaskPriority, CommonBridgeInterface } from './common';
import { InterceptorApi, InterceptorRequestConfig, InterceptorResponseConfig } from './interceptor';
import { CustomError } from '../config/bridgeError';

export interface DispatchTaskRequestContent {
  // 要调用那个模块的API
  namespace: SupportNamespaces;
  apiname: string;
  args: unknown[];
  account: string;
}

export interface DispatchTaskParams {
  // 请求内容
  requestContent: DispatchTaskRequestContent;
  // seqNo
  seqNo: string;
}

export interface TaskDetailInMain extends DispatchTaskParams {
  webId: number;
}

// 优先级任务
export interface PriorityTaskDetail extends TaskDetailInMain {
  // 过期时间
  overtime: number;
}

export type WorkerTaskParams = Omit<DispatchTaskParams, 'priority'> & {
  type: 'timeout';
};

export interface ReplyExchange {
  type: 'reply';
  ackNo: string;
  code: number;
  errorMsg: string | Error;
}

// 业务调用窗口bridgeApi
export interface MasterBridge extends CommonBridgeInterface {
  interceptors: {
    request: InterceptorApi<InterceptorRequestConfig>;
    response: InterceptorApi<InterceptorResponseConfig>;
  };

  // 创建WEB调度命令
  createSubPageInWeb(): void;

  /**
   * @name:派发任务到主进程
   * @param param 具体见下
   * @param {SupportNamespaces} param.namespace 命名空间类(note:主要防止不同实例间的同名方法)
   * @param {string} param.apiname 代理方法名
   * @param {unknown[]} [param.args] 代理方法入参
   * @param {string} [account] 账号:要派发到哪个account对应的session后台
   * @param {Record<string,unknown>} [options] 配置参数
   * @param {boolean} [options.enableUpdateParam] 是否支持修改入参(默认为false 不清楚业务逻辑的情况不建议配置)
   */
  requestData(
    param: Omit<DispatchTaskRequestContent, 'account'>,
    account?: string,
    options?: {
      backup?: (error: CustomError) => Promise<unknown>;
    }
  ): Promise<unknown>;

  // 清空所有的任务
  flush(account: string): Promise<unknown>;
  // 返回当前API的优先级和超时时长配置
  getConfigureTaskPriority(): unknown;
  // 配置某个API的优先级和超时时间配置
  configureApiPriority(taskInfo: Omit<DispatchTaskRequestContent, 'args' | 'account'>, priority: BridgeTaskPriority, overtime?: number): void;

  forbiddenBbWin4CurrPage(): void;
  enableBbWin4CurrPage(): void;

  getBgFuncStatus4CurrentPage(): boolean;

  removeBridgeWin(webId: number): Promise<unknown>;

  checkBgAlive(account: string): Promise<unknown>;

  forbiddenBridgeOnce(): void;
  enableBridgeOnce(): void;
  getBridgeTempStatus(): boolean;

  createSubPageInWeb(): void;

  removeSubPageInWeb(): void;
}
