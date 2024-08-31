/* eslint-disable camelcase */
import {
  MaterielApi,
  MaterielApiRequestConfig,
  MaterielUploadInfo,
  MaterielFile,
  MaterielFileListReq,
  MaterielFileListRes,
  MaterielShareListReq,
  MaterielShareListRes,
  MaterielShareAccount,
  MaterielShare,
  MaterielReportWaShareReq,
  MaterielBusinessCard,
  ShareListReq,
  ShareListRes,
  MaterielShareVisitListReq,
  MaterielShareVisitListRes,
} from '@/api/logical/materiel';
import { api } from '@/api/api';

export class MaterielApiImpl implements MaterielApi {
  name = 'materielApiImpl';

  private http = api.getDataTransApi();

  private eventApi = api.getEventApi();

  private systemApi = api.getSystemApi();

  constructor() {}

  init() {
    return this.name;
  }

  errorHandler(error: Error | any) {
    this.eventApi.sendSysEvent({
      auto: true,
      eventSeq: 0,
      eventName: 'error',
      eventLevel: 'error',
      eventData: {
        title: error?.data?.message || error?.message || '网络错误',
        content: '',
        popupType: 'toast',
        popupLevel: 'error',
      },
    });
  }

  async get(url: string, req?: any, config?: MaterielApiRequestConfig) {
    try {
      const { data } = await this.http.get(url, req, config);

      if (!data) throw {};

      if (!data.success) {
        throw data;
      }

      return data.data;
    } catch (error: Error | any) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  async post(url: string, body: any, config?: MaterielApiRequestConfig) {
    config = {
      contentType: 'json',
      noEnqueue: false,
      ...(config || {}),
    };

    try {
      const { data } = await this.http.post(url, body, config);

      if (!data) throw {};

      if (!data.success) {
        throw data;
      }

      return data.data;
    } catch (error: Error | any) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  async delete(url: string, req: any, config?: MaterielApiRequestConfig) {
    try {
      const { data } = await this.http.delete(url, req, config);

      if (!data) throw {};

      if (!data.success) {
        throw data;
      }

      return data.data;
    } catch (error: Error | any) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  getUploadToken(req: { fileName: string }): Promise<MaterielUploadInfo> {
    return this.get(this.systemApi.getUrl('getMaterielUploadToken'), req);
  }

  getDownloadUrl(req: { fileName: string; nosKey: string }): Promise<string> {
    return this.post(this.systemApi.getUrl('getMaterielDownloadUrl'), req);
  }

  getPreviewUrl(req: { fileName: string; downloadUrl: string }): Promise<string> {
    return this.post(this.systemApi.getUrl('getMaterielPreviewUrl'), req);
  }

  addFile(req: Partial<MaterielFile>): Promise<Partial<MaterielFile>> {
    return this.post(this.systemApi.getUrl('addMaterielFile'), req);
  }

  deleteFile(req: { fileId: string }): Promise<void> {
    return this.get(this.systemApi.getUrl('deleteMaterielFile'), req);
  }

  renameFile(req: { fileId: string }): Promise<void> {
    return this.get(this.systemApi.getUrl('renameMaterielFile'), req);
  }

  getFileList(req: MaterielFileListReq): Promise<MaterielFileListRes> {
    return this.get(this.systemApi.getUrl('getMaterielFileList'), req);
  }

  getShareList(req: MaterielShareListReq): Promise<MaterielShareListRes> {
    return this.get(this.systemApi.getUrl('getMaterielShareList'), req);
  }

  getShareAccounts(): Promise<MaterielShareAccount[]> {
    return this.get(this.systemApi.getUrl('getMaterielShareAccounts'));
  }

  getSharePreview(req: { shareId: string }): Promise<MaterielShare & { businessCard: MaterielBusinessCard }> {
    return this.get(this.systemApi.getUrl('getMaterielSharePreview'), req);
  }

  editShare(req: Partial<MaterielShare>): Promise<MaterielShare> {
    return this.post(this.systemApi.getUrl('editMaterielShare'), req);
  }

  reportWaShare(req: MaterielReportWaShareReq): Promise<void> {
    return this.post(this.systemApi.getUrl('reportMaterielWaShare'), req);
  }

  getBusinessCard(req?: { businessCardId?: string }): Promise<MaterielBusinessCard> {
    return this.get(this.systemApi.getUrl('getMaterielBusinessCard'), req);
  }

  editBusinessCard(req: Partial<MaterielBusinessCard>): Promise<MaterielBusinessCard> {
    return this.post(this.systemApi.getUrl('editMaterielBusinessCard'), req);
  }

  getWAShareList(req: ShareListReq): Promise<ShareListRes> {
    return this.get(this.systemApi.getUrl('getWAShareList'), req);
  }

  getShareVisitList(req: MaterielShareVisitListReq): Promise<MaterielShareVisitListRes> {
    return this.get(this.systemApi.getUrl('getShareVisitList'), req);
  }
}

const materielApi = new MaterielApiImpl();

api.registerLogicalApi(materielApi);

export default materielApi;
