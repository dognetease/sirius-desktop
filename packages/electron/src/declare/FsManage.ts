import { SaveDialogOptions } from 'electron';
import { Stats, WriteStream } from 'fs';
import { WriteFileOptions } from 'fs-extra';
import { ParsedMail, SimpleParserOptions } from 'mailparser';

export interface FsDownloadConfig {
  receivedProgressWinId?: number; // 接收进度的窗口的 id
  // 接收进度条的唯一key（可以不传）
  channel?: string;
  // 需要下载的地址
  url: string;
  realUrl?: string;
  downloadUrl?: string;
  // 保存地址
  filePath?: string;
  // 目录地址
  dirPath?: string;
  // 文件名
  fileName: string;
  start?: number;
  // 多账号后台指定sessionName
  sessionName?: string;

  progress?: (receivedBytes: number, totalBytes: number, progress: number) => void;
}

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

export interface logsToArrayBufRes {
  success: boolean;
  name?: string;
  path?: string;
  data?: ArrayBuffer;
}

export interface FsSaveDialogOptions extends SaveDialogOptions {
  fileName?: string;
  winId?: number;
  openAsMainWindow?: boolean;
}

export interface FsParsedMail extends ParsedMail {
  id: string;
  lastModified: number;
  encoding?: string;
}

export interface FsManageHandle {
  getCookie(domain?: string): Promise<string>;

  /**
   * 打包并压缩文件
   * @param cofig 压缩打包配置
   */
  zip(cofig: FsZipConfig): Promise<FsZipRes>;

  writeToLogFile(conf: { data: string[] | string; appendix?: string }): void;
}

export interface FsManage {
  dragFile(filePath: string): void;
}

export interface FsManageRenderer {
  /**
   * 在文件夹中展示当前文件
   * @param path 文件地址
   */
  show(path: string): void;

  createWriteStream(fileName: string, dirName?: string): Promise<WriteStream>;

  /**
   *  文件｜目录存在
   *  @param path:文件｜目录地址
   */
  isExist(path: string): boolean;

  /**
   * 以桌面默认方式打开文件
   * @param path 文件地址
   */
  open(path: string): Promise<string>;

  /**
   * 删除文件
   * @param path 文件地址
   */
  remove(path: string): Promise<void>;

  /**
   * 读取文件
   * @param path 文件地址
   */
  readFile(path: string): Promise<Buffer>;

  /**
   * 递归获取该文件夹下所有文件路径
   * @param path 文件夹地址
   * @param fileExtension 特定文件
   * @param deep 是否需要递归子文件夹
   */
  loopDirPath(path: string, fileExtension?: string, deep?: boolean): Promise<string[]>;

  /**
   * 移动文件
   * @param from 文件原地址
   * @param to 文件需要移动的地址
   */
  move(from: string, to: string): Promise<void>;

  /**
   * 复制文件
   * @param from 文件原地址
   * @param to 文件需要复制的地址
   */
  copy(from: string, to: string): Promise<void>;

  /**
   * 路径标准化
   * @param path 原地址
   */
  normalizePath(path: string): string;

  /**
   * 计算文件 md5
   * @param filePath 文件路径
   */
  getFileMd5(filePath: string): string;

  /**
   * 创建临时目录
   * @param prefix 前缀
   */
  mktempdir(prefix: string): Promise<string>;

  /**
   * 创建目录
   * @param dirName
   * @param path
   */
  mkDir(dirName: string, path?: string): Promise<string>;

  /**
   * 设置下载文件名
   * @param downloadPath
   * @param fileName
   * @param extName
   * @param fileMaxCount
   */
  setDownloadFileName(downloadPath: string, fileName?: string, extName?: string, fileMaxCount?: number): string;

  /**
   * 复制图片到剪贴板
   * @param dataURL
   */
  clipboardWriteImage(dataURL: string): void;

  /**
   * 保存base64格式的文件
   * @param path 保存路径
   * @param data base 64 数据
   */
  saveBase64File(path: string, data: string): Promise<any>;

  /**
   * 写入本地文件
   * @param file 文件二进制
   * @param path 路径
   */
  writeFile(file: string | Buffer | Uint8Array, path: string, options: WriteFileOptions | string, callback: (err: Error) => void): void;

  /**
   * 将最近log文件打包并转为ArrayBuffer
   */
  logsToArrayBuf(period?: number): Promise<logsToArrayBufRes>;

  /**
   * 文件拖拽
   */
  dragFile(filePath: string, iconPath?: string): void;

  /**
   * 获取文件状态
   */
  stat(filePath: string): Promise<Stats>;

  /**
   * 解析 eml 文件
   */
  parseEml(filePath: string, lastModified: number, options?: SimpleParserOptions): Promise<FsParsedMail>;

  /**
   * 解析 TNEF 文件
   * https://www.npmjs.com/package/node-tnef
   */
  parseTNEFFile(file: Buffer | string, encoding: string): Promise<string | ParsedMail['attachments']>;

  /**
   * 是否为文件夹
   * @param filePath 文件路径
   */
  isDir(filePath: string): Promise<boolean>;

  getBaseName(filePath: string): string;

  getIsFolderHasFullAccess(testPath: string): { success: boolean; createRes: boolean; deleteRes?: boolean; errorMsg?: string; errorCode?: string };
}

export type FsManageFunctionName = FsManageHandleType | FsManageType;
export type FsManageHandleType = keyof FsManageHandle;
export type FsManageType = keyof FsManage;
