/* eslint-disable camelcase */
import { Api } from '@/api/_base/api';
import { ApiRequestConfig } from '@/api/data/http';

export interface MaterielApiRequestConfig extends ApiRequestConfig {
  toastError?: boolean;
}

export interface MaterielUploadInfo {
  bucketName: string;
  context?: string;
  nosKey: string;
  token: string;
}

export interface MaterielDirectory {
  createAt: string;
  createBy: string;
  fileId: string;
  fileLevel: number;
  fileName: string;
  fileType: 'DIRECTORY';
  parentFileId: string;
  scope: 'PERSONAL' | 'COMPANY';
}

export interface MaterielFile extends Omit<MaterielDirectory, 'fileType'> {
  fileType: 'FILE';
  fileLink: string;
  fileSize: number;
  lastUseAt: string;
}

export interface MaterielFileListReq {
  page: number;
  pageSize: number;
  fileName: string;
  parentFileId: string;
}

export interface MaterielFileListRes {
  content: (MaterielFile | MaterielDirectory)[];
  totalSize: number;
}

export interface ShareListReq {
  chatId?: string;
  page?: number;
  pageSize?: number;
  shareId?: string;
  userId?: string;
}
export interface ShareWhatsappUserResponse {
  chatAvatarUrl?: string;
  chatName: string;
  /** 客户业务id */
  bizId: number;
  /** 客户业务名称 */
  bizName?: string;
  /** 客户业务类型 */
  bizType?: number;
  /** 名片id */
  businessCardId?: string;
  /** whatsapp会话id */
  chatId?: string;
  /** 封面图链接 */
  coverLink?: string;
  /** 创建时间 */
  createAt?: string;
  /** 分享创建人 */
  createBy?: string;
  /** 描述 */
  description?: string;
  /** 下载数 */
  downloadCount?: number;
  /** 文件id */
  fileId?: string;
  /** 文件链接 */
  fileLink?: string;
  /** 文件名 */
  fileName?: string;
  /** 文件大小 */
  fileSize?: number;
  /** 消息id */
  messageId?: string;
  /** 发送时间 */
  sendAt?: string;
  /** 分享数 */
  shareCount?: number;
  /** 分享id */
  shareId?: string;
  /** 分享状态:wait-待分享,shared-已分享 */
  shareState?: string;
  /** 分享结果:sent-已发送,delivery-已送达,failed-失败 */
  state?: string;
  /** 标题 */
  title?: string;
  /** 访客数 */
  userCount?: number;
  /** whatsapp账号id */
  userId?: string;
  /** 浏览数 */
  viewCount?: number;
}
export interface ShareListRes {
  /** 列表内容 */
  content?: Array<ShareWhatsappUserResponse>;
  /** 排序方向 */
  direct?: string;
  /** 排序字段 */
  orderBy?: string;
  /** 页码 */
  page: number;
  /** 当前页大小 */
  pageSize: number;
  /** 当前时间戳 */
  timestamp?: string;
  /** 总页数 */
  totalPage: number;
  /** 总大小 */
  totalSize: number;
}

export interface MaterielShare {
  title: string;
  description: string;
  coverLink: string;
  createAt: string;
  createBy: string;
  createdByCurAcc: boolean;
  fileId: string;
  fileLink?: string;
  fileName?: string;
  fileSize?: number;
  shareId: string;
  shareLink: string;
  shareState: 'WAIT' | 'SHARED';
  shareCount: number;
  viewCount: number;
  userCount: number;
  downloadCount: number;
  businessCardId: string;
}

export interface MaterielShareListReq {
  query: string;
  accIds: string[];
  page: number;
  pageSize: number;
  startTime?: number;
  endTime?: number;
}

export interface MaterielShareListRes {
  content: MaterielShare[];
  totalSize: number;
}

export interface MaterielShareAccount {
  accId: string;
  avatarUrl: string;
  nickName: string;
}

export interface MaterielReportWaShareReq {
  userId: string;
  chatId: string;
  messageId: string;
  shareId: string;
  state: 'SENT' | 'DELIVERY' | 'FAILED';
}

export interface MaterielBusinessCard {
  businessCardId: string;
  avatarLink: string;
  chineseName: string;
  companyAddress: string;
  companyName: string;
  email: string;
  englishName: string;
  job: string;
  mobile: string;
  whatsapp: string;
  whatsappQrContent: string;
  whatsappQrVisible: boolean;
}

export interface MaterielShareVisitListReq {
  accIds: string[];
  page: number;
  pageSize: number;
  startTime?: number;
  endTime?: number;
}

export interface ShareVisitResponse {
  /** 城市 */
  city?: string;
  /** 洲 */
  continent?: string;
  /** 国家 */
  country?: string;
  /** 文件id */
  fileId?: string;
  /** 文件链接 */
  fileLink?: string;
  /** 文件名 */
  fileName?: string;
  /** 文件大小 */
  fileSize?: number;
  /** 文件类型:file-文件,directory-文件夹 */
  fileType?: string;
  /** 省份 */
  province?: string;
  /** 用户ip */
  userIp?: string;
  /** 分享来自whatsapp号码 */
  userNumber?: string;
  /** 访问时间 */
  visitAt?: string;
  shareLink?: string;
}
export interface MaterielShareVisitListRes {
  /** 列表内容 */
  content?: Array<ShareVisitResponse>;
  /** 排序方向 */
  direct?: string;
  /** 排序字段 */
  orderBy?: string;
  /** 页码 */
  page?: number;
  /** 当前页大小 */
  pageSize?: number;
  /** 当前时间戳 */
  timestamp?: string;
  /** 总页数 */
  totalPage?: number;
  /** 总大小 */
  totalSize?: number;
}

export interface MaterielApi extends Api {
  getUploadToken(req: { fileName: string }): Promise<MaterielUploadInfo>;
  getDownloadUrl(req: { fileName: string; nosKey: string }): Promise<string>;
  getPreviewUrl(req: { fileName: string; downloadUrl: string }): Promise<string>;
  addFile(req: Partial<MaterielFile>): Promise<Partial<MaterielFile>>;
  deleteFile(req: { fileId: string }): Promise<void>;
  renameFile(req: { fileId: string; fileName: string }): Promise<void>;
  getFileList(req: MaterielFileListReq): Promise<MaterielFileListRes>;
  getWAShareList(req: ShareListReq): Promise<ShareListRes>;
  getShareList(req: MaterielShareListReq): Promise<MaterielShareListRes>;
  getShareAccounts(): Promise<MaterielShareAccount[]>;
  getSharePreview(req: { shareId: string }): Promise<MaterielShare & { businessCard: MaterielBusinessCard }>;
  editShare(req: Partial<MaterielShare>): Promise<MaterielShare>;
  reportWaShare(req: MaterielReportWaShareReq): Promise<void>;
  getBusinessCard(req?: { businessCardId?: string }): Promise<MaterielBusinessCard>;
  editBusinessCard(req: Partial<MaterielBusinessCard>): Promise<MaterielBusinessCard>;
  getShareVisitList(req: MaterielShareVisitListReq): Promise<MaterielShareVisitListRes>;
}
