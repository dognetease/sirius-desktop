import { SupportNamespaces, CommonBridgeInterface } from './common';
import { DispatchTaskParams } from './proxy';

export type WorkerTaskParams = Omit<DispatchTaskParams, 'priority'> & {
  type: 'timeout';
};

export interface ResponseExchange {
  type: 'response';
  ackNo: string;
  code: number;
  data?: unknown;
  duration?: number[];
  errorMsg: string | Error;
}

export type TaskResponse = Omit<ResponseExchange, 'type'>;

// 具体API调用处理的异步回调函数
export type WorkerResponseHandleItem = (args: unknown[]) => Promise<unknown>;

// 业务API下的兜底通用异步回调函数
export type WorkerCommonHandleItem = (name: string, args: unknown[]) => Promise<unknown>;
// 数据数据窗口bridgeAPI
export interface WorkerBridge extends CommonBridgeInterface {
  init(): void;
  /**
   * 注册通用
   * @param namespace
   * @param cmd
   * @param handler
   */
  registerResponseCMD(namespace: SupportNamespaces, cmd: string, handler: WorkerResponseHandleItem): void;
  registerCommonCMD(namespace: SupportNamespaces, handler: WorkerCommonHandleItem): void;
}

interface BridgeEventDef {
  excludeSelf?: boolean;
  toAccounts?: string[];
  toAllAccounts?: boolean;
}

type BridgeEventTypes = Record<string, BridgeEventDef>;

export const bridgeEventAllType: BridgeEventTypes = {
  contactMemoryReady: {
    excludeSelf: true,
  },
};
