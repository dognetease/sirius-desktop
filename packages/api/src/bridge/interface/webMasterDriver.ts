// web环境下的bridgemaste实例
import { BridgeTaskPriority, BridgeEventCallback, CommonBridgeInterface } from './common';
import { DispatchTaskRequestContent } from './proxy';

export interface DispatchTaskParams {
  // 请求内容
  requestContent: DispatchTaskRequestContent;
  // seqNo
  seqNo: string;
  // markId:string;
  channelId: string;
}

export interface TaskDetailInMain extends DispatchTaskParams {
  markId?: string;
}

export interface ReplyExchange {
  type: 'reply';
  ackNo: string;
  code: number;
  errorMsg: string | Error;
}

// 业务调用窗口bridgeApi
export interface MasterDriverManage extends CommonBridgeInterface {
  // 派发任务
  dispatchTask(args: DispatchTaskRequestContent, ackNo: string, winType?: string): Promise<unknown>;
  // 清空所有的任务
  flush(account: string): Promise<unknown>;
  // 返回所有任务
  getAllTasks(): Promise<unknown>;
  // 返回当前API的优先级和超时时长配置
  getConfigureTaskPriority(): unknown;
  // 配置某个API的优先级和超时时间配置
  configureApiPriority(taskInfo: Omit<DispatchTaskRequestContent, 'args' | 'account'>, priority: BridgeTaskPriority, overtime?: number): void;
  checkBgAlive(account: string): Promise<unknown>;
  removeBridgeWin(webId: number): Promise<unknown>;
  // 订阅后台事件
  addWinEvent(eventName: string, callback: BridgeEventCallback): void;
  removeWinEvent(eventName: string, eventId?: string): void;
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

export const sleep = async (t: number) =>
  new Promise(resolve => {
    setTimeout(resolve, t);
  });

export const getname = (str: string) => {
  const reg = /\b([\w\d]+)(\.[\w\d]+)?$/;
  const result = str.match(reg);
  if (!result || !result[1]) {
    return 'unknown';
  }
  return result[1];
};

export interface MessageChannelData<T = unknown> {
  channel: 'hasNewTask';
  data: T;
}
