import { WindowEventData, WindowManageFunctionName } from './WindowManage';
import { FsManageFunctionName } from './FsManage';
import { AppManageType } from './AppManage';
import { StoreManageFuncNames } from './StoreManage';
import { BridgeManageFuncName } from './BridgeManage';
import { DownloadManageFunctionName } from './downloadManage';

export type sendChannelType =
  | 'fsManage'
  | 'browserInvoke'
  | 'fsManageInvoke'
  | 'appCall'
  | 'storeInvoke'
  | 'ondragstart'
  | 'bridgeInVoke'
  | 'downloadManageInvoke'
  | 'downloadManage';

export type receiveChannelType = 'renderer-data-exchange' | 'window-hooks' | 'bridge-data-exchange' | 'open-file-channel';

export type IpcMainSendChannelType = 'downloadProgress';

export type functionNameType = WindowManageFunctionName | FsManageFunctionName | AppManageType | StoreManageFuncNames | BridgeManageFuncName | DownloadManageFunctionName;

export interface IpcRendererReq {
  channel: sendChannelType;
  functionName: functionNameType;
  params?: any;
}

export interface IpcRendererSendTo {
  id: number;
  channel: receiveChannelType;
  data?: WindowEventData;
  sent?: boolean;
}

export interface IpcMainSend {
  id?: number;
  channel: string;
  data?: any;
}

export interface IpcRendererReceive {
  channel: receiveChannelType;
  // 有返回值，将会把返回值发送回原窗口
  listener: (data: any) => Promise<any>;
}

export interface IpcRendererReceiveIpcMain {
  channel: string;
  listener: (data: any) => void;
  once?: boolean;
}

export interface IpcListenerManageMap {
  [props: string]: (() => void) | undefined;
}

export interface IpcRendererRes {
  data: any;
}

export interface IpcChannelManage {
  sendTo(req: IpcRendererSendTo): void;

  receive(listener: IpcRendererReceive): void;

  send(req: IpcRendererReq): void;
}

export interface IpcMainChannelManage {
  send(req: IpcMainSend): void;
}
