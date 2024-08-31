import { NetStorageType, ResponseNSUploadInfo } from 'api';

export enum UploadFileStatus {
  UPLOADING,
  CONVERTING,
  DONE,
  FAIL,
  PAUSE,
}

export enum DownloadFileStatus {
  DOWNLOADING,
  DONE,
  FAIL,
}

export interface IUploadFile {
  file: File;
  status: UploadFileStatus;
  id: string;
  fileType: string;
  fileSize: string;
  uploadSpeed?: string;
  md5?: string;
  progress?: number;
  sliceUploadStartTime?: number;
  offset: number;
  dirId?: number;
  diskType?: NetStorageType;
  uploadInfo?: ResponseNSUploadInfo;
  failedReason?: string;
  // 成功或失败的原因,用来埋点上报
  reason?: string;
  // 上传成功的额外信息,目前用于提示表格截断(2021.10.11)
  successInfo?: string;

  startUpload(): void;
  continueUpload(): void;
  abortUpload?(): void;

  openFile?(): void;
}

export interface DownloadDisk {
  status: DownloadFileStatus;
  id: number;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  originSize: number;
  downloadSpeed?: string;
  progress: number;
  diskType: NetStorageType | 'share' | string;
  name: string;
  cancel: () => void;
  lastTime: number;
}

export const sliceSize = 2 * 1024 * 1024;

export const uploadHost = 'wanproxy-web.127.net';
