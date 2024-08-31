// import { IpcRendererReq } from './IpcChannelManage';
export type BridgeTaskPriority = 'high' | 'medium' | 'low';

export type BridgeManageFuncName = keyof WorkerBridgeMange | keyof MasterBridgeManage;

export interface TaskPromise {
  resolve(params: any): void;
  reject(params: any): void;
}

// 数据处理窗口可以支持的业务模块
export type SupportNamespaces = string;

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

export interface ResponseExchange {
  type: 'response';
  ackNo: string;
  code: number;
  data?: unknown;
  errorMsg: string | Error;
  // 任务接受时间点 & 完成时间点
  duration?: number[];
}

export type TaskResponse = Omit<ResponseExchange, 'type'>;

// 业务调用窗口bridgeApi
export interface MasterBridgeManage {
  // 派发任务
  dispatchTask(args: DispatchTaskRequestContent, ackNo: string, winType?: string): Promise<unknown>;
  // 清空所有的任务
  flush(account: string): Promise<void>;
  // 返回所有任务
  getAllTasks(): Promise<unknown>;
  // 返回当前API的优先级和超时时长配置
  getConfigureTaskPriority(): unknown;
  // 配置某个API的优先级和超时时间配置
  configureApiPriority(taskInfo: Omit<DispatchTaskRequestContent, 'args' | 'account'>, priority: BridgeTaskPriority, overtime?: number): void;
  // 关闭后台页面
  // forbiddenBgWin(account: string): Promise<unknown>;
  // // 开启后台页面
  // enableBgWin(account: string): Promise<unknown>;
  getBridgeConnected(): boolean;
  // 检查当前窗口是否联通
  checkBgAlive(account: string): Promise<unknown>;
  // 删除窗口
  removeBridgeWin(webId: number): Promise<unknown>;
}

// 具体API调用处理的异步回调函数
export type WorkerResponseHandleItem = (args: unknown[]) => Promise<unknown>;

// 业务API下的兜底通用异步回调函数
export type WorkerCommonHandleItem = (name: string, args: unknown[]) => Promise<unknown>;

export interface ReturnTaskParams {
  response: TaskResponse;
  options: {
    count: number;
    type: string;
    account: string;
    forcePullTask?: boolean;
  };
}
// 数据数据窗口bridgeAPI
export interface WorkerBridgeMange {
  // 返回任务处理接口
  returnTaskResult(params: ReturnTaskParams): Promise<unknown>;
  // ping主进程
  ping(id: string): Promise<unknown>;
}

export interface AsyncExcuteQueue {
  resolve(params: unknown): void;
  reject(params: unknown): void;
  func(params: unknown): Promise<unknown>;
}

export const sleep = async (t: number) =>
  new Promise(resolve => {
    setTimeout(resolve, t);
  });

export enum BRIDGE_RESPONSE_TYPE {
  'SUCCESS' = 'SUCCESS',
  // 业务接口执行不报错
  'API_RESPONSE_ERROR' = 'API_RESPONSE_ERROR',
  // 业务处理未注册
  'API_UNREGISTER' = 'API_UNREGISTER',
  // 后台窗口不响应
  'BG_WIN_UNRESPONSE' = 'BG_WIN_UNRESPONSE',
  // 无效任务 没有传递account
  'INVALD_ACCOUNT_NOACCOUNT' = 'INVALD_ACCOUNT_NOACCOUNT',
  // 对应的后台任务窗口不存在
  'BG_WIN_NOT_EXIST' = 'BG_WIN_NOT_EXIST',
  // 接口响应超时
  'API_RESPONSE_TIMEOUT' = 'API_RESPONSE_TIMEOUT',
  // 未知错误
  'UNKNOWN_ERROR' = 'UNKNOWN_ERROR',
}
export const BRIDGE_RESPONSE_CODE: Record<BRIDGE_RESPONSE_TYPE, number> = {
  [BRIDGE_RESPONSE_TYPE.SUCCESS]: 0,
  [BRIDGE_RESPONSE_TYPE.API_RESPONSE_ERROR]: -1,
  [BRIDGE_RESPONSE_TYPE.API_UNREGISTER]: -2,
  [BRIDGE_RESPONSE_TYPE.BG_WIN_UNRESPONSE]: -3,
  [BRIDGE_RESPONSE_TYPE.API_RESPONSE_TIMEOUT]: -4,
  [BRIDGE_RESPONSE_TYPE.INVALD_ACCOUNT_NOACCOUNT]: -5,
  [BRIDGE_RESPONSE_TYPE.BG_WIN_NOT_EXIST]: -6,
  [BRIDGE_RESPONSE_TYPE.UNKNOWN_ERROR]: -99,
};

export interface MessageChannelData<T = unknown> {
  channel: 'hasNewTask';
  data: T;
}
