import { TaskResponse } from './register';
import { CommonBridgeInterface } from './common';

export interface ReturnTaskParams {
  response: TaskResponse;
  options: {
    count: number;
    type: string;
    account: string;
    forcePullTask?: boolean;
    [key: string]: unknown;
  };
}

export type BroadcastEventOptions = {
  excludeSelf?: boolean;
  [key: string]: unknown;
};

// 数据数据窗口bridgeAPI
export interface WorkerBridgeMange extends CommonBridgeInterface {
  // 返回任务处理接口
  returnTaskResult(params: ReturnTaskParams): Promise<unknown>;
  ping(params: string): Promise<unknown>;
}
