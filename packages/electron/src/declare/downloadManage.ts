import { DownloadItem, SaveDialogOptions, WebContents } from 'electron';
import { FsDownloadConfig } from './FsManage';

export type ElectronDownloadCallback = (item: DownloadItem, itemData: IDownloadFile) => void;

export type DownloadListeners = {
  [url in string]: ElectronDownloadCallback;
};
export interface FsZipConfig {
  /**
   * 文件路径
   */
  files: string[];
  /**
   * 打包后的文件保存地址
   */
  filePath?: string;
  /**
   * 保存的文件名（会自动加上.zip后缀）
   */
  fileName: string;
}
export interface ElectronDownload {
  addDownloadItem: (event: Event, item: DownloadItem, webContents: WebContents, originUrl: string) => Promise<IDownloadFile>;
  // Electron下载模块注册
  listenerDownload(event: Event, item: DownloadItem, webContents: WebContents): void;
}
export interface INewDownloadFile {
  url: string;
  fileName?: string;
  path: string;
}
export type DownloadItemState = 'progressing' | 'completed' | 'cancelled' | 'interrupted';
export interface IDownloadFile {
  id?: string;
  url: string;
  fileName?: string;
  path?: string;
  state: DownloadItemState;
  startTime: number;
  progress: number;
  totalBytes: number;
  receivedBytes: number;
  paused: boolean;
  _sourceItem: DownloadItem;
}

export interface IDownloadBytes {
  receivedBytes: number;
  totalBytes: number;
}

export interface IPagination {
  pageIndex: number;
  pageCount: number;
}

export interface IAddDownloadItem {
  item: DownloadItem;
  downloadIds: string[];
  data: IDownloadFile[];
  newDownloadItem: INewDownloadFile | null;
}

export interface IUpdateDownloadItem {
  item: DownloadItem;
  data: IDownloadFile[];
  downloadItem: IDownloadFile;
  prevReceivedBytes: number;
  state: DownloadItemState;
}

export interface ErrMap {
  [prop: string]: string;
}

export type FileProgress = {
  receivedBytes: number;
  totalBytes: number;
};

export type RequestManage = {
  [url in string]: any;
};

export interface FsDownloadRes {
  success: boolean;
  filePath: string;
  fileName: string;
  totalBytes: number;
  message?: string;
  error?: Error;
  md5?: string;
}

export type FsZipRes = Omit<FsDownloadRes, 'md5' | 'totalBytes'>;

export interface FsSelectRes {
  // 操作返回的地址
  path: string | string[];
  // 操作是否成功
  success: boolean;
}

export interface FsSaveRes {
  // 操作返回的地址
  path: string;
  // 操作是否成功
  success: boolean;
}

export interface FsSaveDialogOptions extends SaveDialogOptions {
  fileName?: string;
  winId?: number;
  openAsMainWindow?: boolean;
}

export interface DownloadManageHandle {
  /**
   * 使用Electron原生下载文件至本地，平替fsManage.download
   * @param config 下载配置
   */
  download(config: FsDownloadConfig): Promise<FsDownloadRes>;

  downloadAbort(url: string): void;
}

export interface DownloadManage {
  downloadAbort(url: string): void;
  /**
   * 下载文件至本地
   * @param config 下载配置
   */
  download(config: FsDownloadConfig): Promise<FsDownloadRes>;
}

export type DownloadManageFunctionName = DownloadManageHandleType | DownloadManageType;
export type DownloadManageHandleType = keyof DownloadManageHandle;
export type DownloadManageType = keyof DownloadManage;
