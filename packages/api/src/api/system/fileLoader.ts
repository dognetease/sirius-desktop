import { Api } from '../_base/api';
import { ApiResponse, LoaderActionConf } from '../data/http';
import FileManageDb from '@/impl/api_system/file_dbl';

export type CloudUploaderCommonArgs = {
  bucketName?: string;
  fileId?: number;
  new?: boolean;
  nosKey?: string;
  token?: string;
  offset?: number;
  context?: string;
};

export interface LoaderResult {
  succ: boolean;
  fid: number;
  errMsg: string;
  storeInLocal: boolean;
  resultUrl?: string;
  data?: Blob;
  fileModel: FileAttachModel;
  path?: string;
}

export interface FsSaveRes {
  success: boolean;
  path: string;
  loadResArr?: { fileModel: FileAttachModel; succ: boolean }[];
}

export interface LoaderRequest {
  requestUrl: string;
  fileName: string;
  pos?: string;
  type?: number;
}

export interface FileLoaderActionConf extends LoaderActionConf {
  saveAndDownload?: boolean;
  progressThrottle?: boolean;
  throttleTime?: number;
  noStoreData?: boolean;
  _account?: string;
}

/**
 * 文件类型
 */
export type FileType =
  | 'doc'
  | 'docx'
  | 'xls'
  | 'xlsx'
  | 'ppt'
  | 'pptx'
  | 'vsd'
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'psd'
  | 'svg'
  | 'ico'
  | 'gif'
  | 'pdf'
  | 'exe'
  | 'dmg'
  | 'msi'
  | 'aac'
  | 'avi'
  | 'csv'
  | 'ics'
  | 'jar'
  | 'tar'
  | 'zip'
  | 'gzip'
  | 'rar'
  | 'rtf'
  | 'txt'
  | 'mpeg'
  | 'mp3'
  | 'mp4'
  | 'html'
  | 'css'
  | 'js'
  | 'json'
  | 'xml'
  | 'dat'
  | 'cmecypt'
  | 'other';

export type FileAttachModelKey = keyof FileAttachModel;

export interface FileAttachModel {
  /**
   * 文件的id,数据库保存时产生
   */
  fid?: number;
  fileName: string;
  fileMime?: string;
  fileType?: FileType;
  /**
   *
   */
  fallbackFilePath?: string;
  /**
   * 文件尺寸，-1表示文件尺寸未知
   */
  fileSize: number;
  /**
   * 文件所在文件目录，针对本地文件，如存在此值则表明文件存在于本地文件系统
   */
  dirPath?: string;
  /**
   * 文件所在文件系统的位置，针对本地文件，如存在此值则表明文件存在于本地文件系统
   */
  filePath?: string;
  /**
   * 文件下载地址
   */
  fileUrl?: string;
  /**
   * 预览地址,部分预览地址需要调用函数生成
   */
  filePreviewUrl?: string;
  hitQuery?: FileAttachModelKey;
  /**
   * 文件对象，由用户在浏览器选择时，从input元素中取得
   */
  file?: File;
  fileContent?: string | Blob | ArrayBuffer;
  fileMd5?: string;
  fileSourceType?: FileSourceType;
  fileSourceKey?: string;
  fileRecorderTime?: number;
  /**
   * 文件状态
   */
  fileStatus?: string;
  /**
   * 文件已经下载的进度
   */
  fileReceivedBytes?: number;
  /**
   * 文件的原始下载地址(唯一值，用来查找)
   */
  fileOriginUrl?: string;
  fileUrlInUse?: string;
  /**
   * 文件下载进度
   */
  fileDownloadProgress?: number;
  // 云附件上传进度
  uploadOffset?: number;
  // 云附件上传 context
  uploadContext?: string;
  // 同 filePath
  path?: string;
  // electron中系统下载dialog，点击确认后toast的内容
  dialogConfirmText?: string;
  originOffset?: number;

  _account?: string;
}

export interface ImportMailModel {
  mailMd5: string;
  mid: string;
  mailLocalPath: string;
  createTime?: number;
}

export type FileStatus = 'downloading' | 'downloaded' | 'uploading' | 'uploaded' | 'initial';

export enum FileSourceType {
  uploadMail = 0,
  downloadMail = 1,
  downloadIM = 2,
  downloadPreview = 3,
}

export type FileDownloadStatus =
  | {
      url: string;
      receivedBytes: number;
      totalBytes: number;
      status?: FileStatus;
    }
  | undefined;

export interface FileDownloadManage {
  [url: string]: FileAttachModel;
}

export interface FileSaveAsConf {
  mode: 'move' | 'copy';
  saveStore: boolean;
}

export interface UploadPieceHandler extends LoaderActionConf {
  startPiece: number;
  sliceSize: number;
  status: 'start' | 'uploading' | 'last' | 'finished' | 'failed';
  token: string;
  context: string;
  offset: number;
  nextUploader(res: ApiResponse<any>): UploadPieceHandler | undefined;
  // 首个分片行为
  firstUploadAction?: (params: any) => void;
}

/**
 * api.api.getFileApi().download()
 */
export interface FileApi extends Api {
  getFileInfoByFileName(fileName: string): Promise<FileAttachModel[]>;

  fileDb: FileManageDb;

  upload(url: string, req: FileAttachModel, conf?: LoaderActionConf): Promise<ApiResponse<any>>;

  downloadLocalFile(req: Partial<FileAttachModel>): Promise<LoaderResult | FsSaveRes>;

  saveDownload(req: Partial<FileAttachModel>, conf?: FileLoaderActionConf): Promise<LoaderResult | FsSaveRes>;

  download(req: Partial<FileAttachModel>, conf?: LoaderActionConf): Promise<LoaderResult>;

  clipboardWriteImage(dataURK: string): void;

  saveZip(
    req: Array<Partial<FileAttachModel>>,
    saveName: string,
    mailId?: string,
    options?: {
      // 是否删除源文件
      removeOrginalFile?: boolean;
      _account?: string;
    }
  ): Promise<FsSaveRes>;

  saveAll(req: Array<Partial<FileAttachModel>>, _account?: string): Promise<FsSaveRes>;

  getFsDownloadStatus(url: string): FileAttachModel | undefined;

  abortFsDownload(url: string): void;

  testLocalFile(file: FileAttachModel): Promise<boolean>;

  openFile(file: FileAttachModel): Promise<boolean>;

  openFileFromDownload(filePath: string): Promise<boolean>;

  openDirFromDownload(filePath: string): Promise<boolean>;

  saveAs(file: FileAttachModel, conf?: FileSaveAsConf): Promise<boolean>;

  /**
   * 确认文件类型，mineType和appendix都有的情况下，mineType优先
   * @param mineType 文件的content-type , 通常取自server端返回的Content-Type header
   * @param fileName 文件名，通过文件名后缀判定文件类型
   */
  judgeFileType(mineType: string | undefined, fileName: string): FileType;

  storeFileInfo(file: FileAttachModel): Promise<FileAttachModel>;

  registerTmpFile(file: FileAttachModel): FileAttachModel;

  saveTmpFile(files: FileAttachModel[]): Promise<FileAttachModel[]>;

  getAttachmentZipPath(mid: string): Promise<string>; // 获取附件打包下载zip文件的目录路径

  getFileInfo(file: FileAttachModel): Promise<FileAttachModel[]>;

  getFileKey(file: FileAttachModel): { key: string | number; field: keyof FileAttachModel };

  delFileInfo(file: FileAttachModel): void;

  delAttachmentZipPath(mid: string): void; // 删除indexDb中附件打包下载zip文件的目录路径

  show(file: FileAttachModel): Promise<boolean>;

  openDir(filePath: string): boolean; // 打开系统文件夹

  selectFile(file: FileAttachModel): Promise<string>;

  moveFilePath(file: FileAttachModel, re: string): boolean;

  uploadFile(file: any): any;

  uploadPieceByPiece(url: string, content: FileAttachModel, uploader: UploadPieceHandler): Promise<ApiResponse<any>>;

  /**
   * mail
   * @param mailInfos mail
   * @param _account 子账号
   * @returns mailMd5[]
   */
  saveImportMails(mailInfos: ImportMailModel[], _account?: string): Promise<string[]>;

  /**
   * 通过文件md5检查本地已上传的邮件
   * @param md5List 邮件md5
   * @param _account 子账号
   */
  checkMailMd5Exists(md5List: string[], _account?: string): Promise<ImportMailModel[]>;
}

/**
 * 文件类型枚举
 */
export const attachmentTypeMap: { [k: string]: FileType } = {
  'image/png': 'png',
  'image/apng': 'png',
  'image/avif': 'png',
  'image/gif': 'gif',
  'image/jpeg': 'jpeg',
  'image/svg+xml': 'svg',
  'image/webp': 'jpeg',
  'audio/aac': 'jpeg',
  'video/x-msvideo': 'avi',
  'text/csv': 'csv',
  'text/calendar': 'ics',
  'application/java-archive': 'jar',
  'application/x-tar': 'tar',
  'application/zip': 'zip',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.visio': 'vsd',
  'application/rtf': 'rtf',
  'application/msword': 'doc',
  // 'application/octet-stream': 'other',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'video/mpeg': 'mpeg',
  'audio/mpeg': 'mp3',
  'audio/mpegurl': 'mp4',
  'application/gzip': 'gzip',
  'text/html': 'html',
  'text/css': 'css',
  'text/javascript': 'js',
  'application/json': 'json',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'video/mp4': 'mp4',
  'application/x-apple-diskimage': 'dmg',
  'application/x-msi': 'msi',
  'application/x-msdos-program': 'exe',
  'image/x-photoshop': 'psd',
  'image/x-icon': 'ico',
  'application/rar': 'rar',
  'application/x-cm-encrypted': 'cmecypt',
};
