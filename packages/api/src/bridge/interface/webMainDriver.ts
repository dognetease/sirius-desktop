// import { IpcRendererReq } from './IpcChannelManage';
import { DispatchTaskRequestContent } from './proxy';
import { BridgeTaskPriority } from './common';

export interface TaskPromise {
  resolve(params: any): void;
  reject(params: any): void;
}

export interface DispatchTaskParams {
  // 请求内容
  requestContent: DispatchTaskRequestContent;
  // seqNo
  seqNo: string;
}

export interface TaskDetailInMain extends DispatchTaskParams {
  // markId:string;
  channelId: string;
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
export interface WebMasterBridgeInterface {
  // 派发任务
  dispatchTask(args: DispatchTaskRequestContent, ackNo: string, winType?: string): Promise<unknown>;
  // 清空所有的任务
  flush(): Promise<unknown>;
  // 返回所有任务
  getAllTasks(): Promise<unknown>;
  // 返回当前API的优先级和超时时长配置
  getConfigureTaskPriority(): unknown;
  // 配置某个API的优先级和超时时间配置
  configureApiPriority(taskInfo: Omit<DispatchTaskRequestContent, 'args'>, priority: BridgeTaskPriority, overtime?: number): void;

  // 关闭后台页面
  forbiddenBgWin(): Promise<unknown>;
  // 开启后台页面
  enableBgWin(): Promise<unknown>;
  // 检查当前窗口是否联通
  checkBgAlive(account: string): Promise<unknown>;
  // 删除窗口
  removeBridgeWin(webId: number): Promise<unknown>;
}

// 具体API调用处理的异步回调函数
export type WorkerResponseHandleItem = (args: unknown[]) => Promise<unknown>;

// 业务API下的兜底通用异步回调函数
export type WorkerCommonHandleItem = (name: string, args: unknown[]) => Promise<unknown>;

export interface AsyncExcuteQueue {
  resolve(params: unknown): void;
  reject(params: unknown): void;
  func(params: unknown): Promise<unknown>;
}

export enum BRIDGE_RESPONSE_TYPE {
  'SUCCESS' = 'SUCCESS',
  // 业务接口执行不报错
  'API_RESPONSE_ERROR' = 'API_RESPONSE_ERROR',
  // 业务处理未注册
  'API_UNREGISTER' = 'API_UNREGISTER',
  // 后台窗口不响应
  'BG_WIN_UNRESPONSE' = 'BG_WIN_UNRESPONSE',
  // 接口响应超时
  'API_RESPONSE_TIMEOUT' = 'API_RESPONSE_TIMEOUT',
  // 未知错误
  'UNKNOWN_ERROR' = 'UNKNOWN_ERROR',
  // 无效任务 没有传递account
  'INVALD_ACCOUNT_NOACCOUNT' = 'INVALD_ACCOUNT_NOACCOUNT',
  // 对应的后台任务窗口不存在
  'BG_WIN_NOT_EXIST' = 'BG_WIN_NOT_EXIST',
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

export const sleep = async (t: number) =>
  new Promise(resolve => {
    setTimeout(resolve, t);
  });

export const getname = (str: string) => {
  const reg = /\b(?<name>[\w\d]+)(\.[\w\d]+)?$/;
  const result = str.match(reg);
  if (!result) {
    return 'unknown';
  }
  return result!.groups!.name;
};

export interface MessageChannelData<T = unknown> {
  channel: 'hasNewTask';
  data: T;
}

// 后台窗口ready的storage表示
export const BridgeConnected = 'bridgeConnected';
