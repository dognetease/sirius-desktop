import { Api } from '../_base/api';

export interface ConvertMailAttachment2DocParams {
  // 邮件 ID
  mid: string;
  // 附件所属的邮件 Part 序号
  part: string; // number?

  // 附件大小
  fileSize?: number;
  // 附件名称
  fileName?: string;
  // 邮箱 host, 可为空
  host?: string;
  // 文件夹 ID，为空则保存到默认文件夹
  dirId?: number;

  // 接口参数，由 api 层注入
  // // Session ID
  // sid: string;
  // // User ID
  // uid: string;
}

export enum ConvertTaskStatus {
  Waiting = 'waiting',
  Completed = 'completed',
  Failed = 'failed',
}

export interface ConvertTaskResponse {
  taskId: string;
  status: ConvertTaskStatus;
  fileId: number;
  fileType: string;
  dirId: number;
  spaceId: number;
  failureReason: string | null;
  userId: number;
}

export interface ConvertApi extends Api {
  convertMailAttachment2Doc(params: ConvertMailAttachment2DocParams): Promise<string>;
  getMailAttachmentDocCovertStatus(taskId: string): Promise<ConvertTaskResponse>;

  convertFile2Doc(dirId: number, fileId: number): Promise<string>;
  convertPersonalFile2Doc(dirId: number, fileId: number): Promise<string>;

  importDoc(file: File, docType: string, fileName: string, dirId: number): Promise<string>;
  checkConvertTask(taskId: string): Promise<ConvertTaskResponse>;

  importPersonalDoc(file: File, docType: string, fileName: string, dirId: number): Promise<string>;
  checkPersonalConvertTask(taskId: string): Promise<ConvertTaskResponse>;

  getFileURL(res: ConvertTaskResponse): string;
}
