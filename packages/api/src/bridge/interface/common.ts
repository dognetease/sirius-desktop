// import { IpcRendererReq } from './IpcChannelManage';
export type BridgeTaskPriority = 'high' | 'medium' | 'low';

export interface TaskPromise {
  resolve(params: any): void;
  reject(params: any): void;
}

// 数据处理窗口可以支持的业务模块
export type SupportNamespaces = string;

// 这里定义的错误和bridge执行报错不太一样
// (这个报错都是前置流程报错)
export enum BRIDGE_RESPONSE_TYPE {
  'SUCCESS' = 'SUCCESS',
  // 业务接口执行不报错
  'API_RESPONSE_ERROR' = 'API_RESPONSE_ERROR',
  // 业务处理未注册
  'API_UNREGISTER' = 'API_UNREGISTER',
  // 被当前页面拒绝
  'REJECT_BRIDGE_BY_CURPAGE' = 'REJECT_BRIDGE_BY_CURPAGE',
  // 灰度没有被命中
  'AB_MISSED' = 'AB_MISSED',
  'BRIDGE_ERROR' = 'BRIDGE_ERROR',
  'ONLY_SUPPORT_ELECTRON' = 'ONLY_SUPPORT_ELECTRON',
  'PREVENT_USER_CROSSWIN_PUT' = 'PREVENT_USER_CROSSWIN_PUT',
  'BRIDGE_UNKNOWN' = 'BRIDGE_UNKNOWN',
}

export const BRIDGE_RESPONSE_CODE: Record<BRIDGE_RESPONSE_TYPE, number> = {
  [BRIDGE_RESPONSE_TYPE.SUCCESS]: 0,
  [BRIDGE_RESPONSE_TYPE.API_RESPONSE_ERROR]: -1,
  [BRIDGE_RESPONSE_TYPE.API_UNREGISTER]: -2,
  [BRIDGE_RESPONSE_TYPE.REJECT_BRIDGE_BY_CURPAGE]: -15,
  [BRIDGE_RESPONSE_TYPE.AB_MISSED]: -16,
  [BRIDGE_RESPONSE_TYPE.BRIDGE_ERROR]: -17,
  [BRIDGE_RESPONSE_TYPE.ONLY_SUPPORT_ELECTRON]: -18,
  [BRIDGE_RESPONSE_TYPE.BRIDGE_UNKNOWN]: -19,
  [BRIDGE_RESPONSE_TYPE.PREVENT_USER_CROSSWIN_PUT]: 20,
};

export type BridgeEventCallback = (params: unknown) => void;

export type BroadcastEventOptions = {
  excludeSelf?: boolean;
  [key: string]: unknown;
};

export interface Broadcast2AllWinParams {
  data: unknown;
  options?: BroadcastEventOptions;
}

export interface CommonBridgeInterface {
  // 订阅跨窗口时间
  addWinEvent(eventName: string, callback: BridgeEventCallback): void;
  removeWinEvent(eventName: string, eventId?: string): void;
  broadcast2AllWin(eventName: string, params: Broadcast2AllWinParams): void;
}
