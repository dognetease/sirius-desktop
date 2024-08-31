import {
  NetStorageShareApi,
  RequestAddAnonymousShare,
  RequestAddCollaborator,
  RequestAnonymousDirList,
  RequestAnonymousFileInfo,
  RequestCheckShareAuth,
  RequestGetExternalShareInteractDetail,
  RequestGetExternalShareLink,
  RequestGetExternalShareList,
  RequestGetExternalShareStatistic,
  RequestGetShareLink,
  RequestListCollaborator,
  RequestModifyNSExternalShareLink,
  RequestModifyNSExternalShareLinkStatus,
  RequestNSListShareItem,
  RequestRemoveCollaborator,
  RequestUpdateCollaborator,
  RequestUpdateShareType,
  ResponseAnonymousDirList,
  ResponseAnonymousFileInfo,
  ResponseCheckShareAuth,
  ResponseExternalShareInteractDetail,
  ResponseExternalShareLink,
  ResponseExternalShareList,
  ResponseExternalShareStatistic,
  ResponseNSCollaborator,
  ResponseSharedData,
  ResponseShareLink,
} from '../../../api/logical/netStorage';
import { EventApi } from '../../../api/data/event';
import { apis, URLKey } from '../../../config';
import { Api, PopUpMessageInfo, resultObject } from '../../../api/_base/api';
import { api } from '../../../api/api';
import { DataTransApi, ResponseData } from '../../../api/data/http';
import { SystemApi } from '../../../api/system/system';
import { ErrMsgCodeMap, ErrMsgType, ErrResult } from '../../../api/errMap';

class NetStorageShareImpl implements NetStorageShareApi {
  name: string;

  private http: DataTransApi;

  private systemApi: SystemApi;

  private eventApi: EventApi;

  constructor() {
    this.name = apis.netStorageShareImpl;
    // this.name=apis.netStorageImpl;
    this.http = api.getDataTransApi();
    this.systemApi = api.getSystemApi();
    this.eventApi = api.getEventApi();
  }

  init(): string {
    return this.name;
  }

  async addNSCollaborator(req: RequestAddCollaborator): Promise<PopUpMessageInfo> {
    const { data } = await this.http.post(this.systemApi.getUrl('addNSCollaborator'), req, { contentType: 'json' });
    return {
      title: data!.message as string,
      code: data!.code as string,
    };
  }

  async deleteNSShare(recordId: number, forMe: boolean): Promise<PopUpMessageInfo> {
    const url = !forMe ? 'deleteNSShare' : 'deleteNSShareWithMe';
    const { data } = await this.http.post(this.systemApi.getUrl(url), { recordId });
    return {
      title: data!.message as string,
      code: data!.code as string,
    };
  }

  async getNSShareLink(req: RequestGetShareLink): Promise<ResponseShareLink> {
    const { data } = await this.http.get(this.systemApi.getUrl('getNSShareLink'), req);
    if (data?.success) {
      return {
        availableShareTypes: data.data.availableShareTypes,
        shareType: data.data.shareType,
        shareUrl: data.data.shareUrl,
      };
    }
    return Promise.reject(this.getNSErrMsg(data!));
  }

  async getNSExternalShareLink(req: RequestGetExternalShareLink): Promise<ResponseExternalShareLink> {
    const { data } = await this.http.post(this.systemApi.getUrl('getNSExternalShareLink'), req, { contentType: 'json' });
    if (data?.success) {
      return data.data as ResponseExternalShareLink;
    }
    return Promise.reject(this.getNSErrMsg(data!));
  }

  /**
   * 外部分享链接互动统计总览
   */
  async getNSExternalShareStatistic(req: RequestGetExternalShareStatistic): Promise<ResponseExternalShareStatistic> {
    const { data } = await this.http.get(this.systemApi.getUrl('getNSExternalShareStatistic'), req, { contentType: 'json' });
    if (data?.success) {
      return data.data as ResponseExternalShareStatistic;
    }
    return Promise.reject(this.getNSErrMsg(data!));
  }

  /**
   * 外部分享链接列表
   */
  async getNSExternalShareList(request: RequestGetExternalShareList): Promise<ResponseExternalShareList> {
    const { data } = await this.http.post(this.systemApi.getUrl('getNSExternalShareList'), request, { contentType: 'json' });
    if (data?.success) {
      const shareData = data.data || {};
      shareData.shareDetails = shareData.shareDetails
        ? shareData.shareDetails.map((item: resultObject) => {
            const { linkDetail } = item;
            delete item.linkDetail;
            item = { ...item, ...linkDetail };
            return item;
          })
        : [];
      return shareData as ResponseExternalShareList;
    }
    return Promise.reject(this.getNSErrMsg(data!));
  }

  /**
   * 外部分享链接详情
   */
  async getNSExternalShareInteractDetail(req: RequestGetExternalShareInteractDetail): Promise<ResponseExternalShareInteractDetail> {
    const { data } = await this.http.post(this.systemApi.getUrl('getNSExternalShareInteractDetail'), req, { contentType: 'json' });
    if (data?.success) {
      return data.data as ResponseExternalShareInteractDetail;
    }
    return Promise.reject(this.getNSErrMsg(data!));
  }

  /**
   * 外部分享链接状态修改
   * @param req
   */
  async modifyNSExternalShareLinkStatus(req: RequestModifyNSExternalShareLinkStatus): Promise<boolean> {
    const url = this.http.buildUrl(this.systemApi.getUrl('modifyNSExternalShareLinkStatus'), req);
    const { data } = await this.http.post(url, {}, { contentType: 'json' });
    if (data?.success) {
      return data.data as boolean;
    }
    return Promise.reject(this.getNSErrMsg(data!));
  }

  /**
   * 外部分享链接修改
   * @param req
   */
  async modifyNSExternalShareLink(req: RequestModifyNSExternalShareLink): Promise<boolean> {
    const url = this.systemApi.getUrl('modifyNSExternalShareLink');
    const { data } = await this.http.post(url, req, { contentType: 'json' });
    if (data?.success) {
      return data.data as boolean;
    }
    return Promise.reject(this.getNSErrMsg(data!));
  }

  async listNSCollaborator(req: RequestListCollaborator): Promise<ResponseNSCollaborator> {
    const { data } = await this.http.get(this.systemApi.getUrl('listNSCollaborator'), req);
    if (data?.success) {
      return {
        page: data.data.page,
        pageSize: data.data.pageSize,
        totalCount: data.data.totalCount,
        collaborators: data.data.collaborators,
      };
    }
    return Promise.reject(this.getNSErrMsg(data!));
  }

  async listNSShare(req: RequestNSListShareItem): Promise<ResponseSharedData> {
    const url = !req.forMe ? 'listNSShare' : 'listNSShareWithMe';
    const { data } = await this.http.get(this.systemApi.getUrl(url), req);
    if (data?.success) {
      const resShareData = data as ResponseSharedData;
      return {
        data: (resShareData.data ? resShareData.data : []).map(item => ({ ...item, roleArr: item?.roles || [] })),
        total: resShareData.total,
        page: resShareData.page,
        size: resShareData.size,
      };
    }
    return Promise.reject(this.getNSErrMsg(data!));
  }

  async removeNSCollaborator(req: RequestRemoveCollaborator): Promise<PopUpMessageInfo> {
    const { data } = await this.http.post(this.systemApi.getUrl('removeNSCollaborator'), req);
    return {
      title: data!.message as string,
      code: data!.code as string,
    };
  }

  async updateNSCollaborator(req: RequestUpdateCollaborator): Promise<PopUpMessageInfo> {
    const { data } = await this.http.post(this.systemApi.getUrl('updateNSCollaborator'), req, { contentType: 'json' });
    return {
      title: data!.message as string,
      code: data!.code as string,
    };
  }

  async updateNSShareType(req: RequestUpdateShareType): Promise<PopUpMessageInfo> {
    const { data } = await this.http.post(this.systemApi.getUrl('updateNSShareType'), req, { contentType: 'json' });
    return {
      title: data!.message as string,
      code: data!.code as string,
    };
  }

  async checkShareAuth(req: RequestCheckShareAuth): Promise<ResponseCheckShareAuth> {
    const { data } = await this.http.post(this.systemApi.getUrl('checkShareAuth'), req);
    if (data?.success) {
      return data.data;
    }
    return Promise.reject(this.getNSErrMsg(data!));
  }

  async getExtShareContentList(req: RequestCheckShareAuth): Promise<ResponseCheckShareAuth> {
    const { data } = await this.http.post(this.systemApi.getUrl('checkShareAuth'), req);
    if (data?.success) {
      return data.data;
    }
    return Promise.reject(this.getNSErrMsg(data!));
  }

  private getNSErrMsg(err: ResponseData): PopUpMessageInfo {
    if (err && err.code) {
      return this.getErrMsg(err.code);
    }
    return {
      code: err.code === undefined ? '' : err.code + '',
      title: ErrMsgCodeMap.UNKNOWN_ERR,
    };
  }

  private getErrMsg(errMsg: string | number | undefined, defaultMsg?: string): PopUpMessageInfo {
    if (errMsg) {
      const messageInfo = ErrResult[errMsg];
      if (messageInfo) {
        if ((messageInfo.popupType && messageInfo.popupType == 'window') || messageInfo.popupType == 'toast') {
          this.eventApi.sendSysEvent({
            eventName: 'error',
            eventLevel: 'error',
            eventStrData: '',
            eventData: messageInfo,
            eventSeq: 0,
          });
        }
        return messageInfo;
      }
      if (errMsg in ErrMsgCodeMap) {
        return {
          title: ErrMsgCodeMap[errMsg as ErrMsgType] as string,
          code: errMsg + '',
        };
      }
    }
    return {
      title: (errMsg ? errMsg + '' : undefined) || defaultMsg || ErrMsgCodeMap.UNKNOWN_ERR,
      code: 'UNKNOWN_ERR',
    };
  }

  private async getCommonRequestResult(req: any, key: URLKey, useGet?: boolean) {
    const { data } = !useGet ? await this.http.post(this.systemApi.getUrl(key), req, { contentType: 'json' }) : await this.http.get(this.systemApi.getUrl(key), req);
    if (data?.success) {
      return data.data;
    }
    return Promise.reject(this.getNSErrMsg(data!));
  }

  async addAnonymousShareContent(req: RequestAddAnonymousShare): Promise<any> {
    return await this.getCommonRequestResult(req, 'addNSExtShare');
  }

  async checkAnonymousDirList(req: RequestAnonymousDirList): Promise<ResponseAnonymousDirList> {
    const ret = await this.getCommonRequestResult(req, 'getNSExtDirContentList', true);
    return ret as ResponseAnonymousDirList;
  }

  async checkAnonymousFileInfo(req: RequestAnonymousFileInfo): Promise<ResponseAnonymousFileInfo> {
    const ret = await this.getCommonRequestResult(req, 'getNSExtFileContent', true);
    return ret as ResponseAnonymousFileInfo;
  }

  async downloadAnonymousFileInfo(req: RequestAnonymousFileInfo): Promise<PopUpMessageInfo> {
    const ret = await this.getCommonRequestResult(req, 'getNSExtFileDownload', true);
    return {
      content: ret as string,
      code: 'S_OK',
      title: '',
    };
  }

  async previewAnonymousFileInfo(req: RequestAnonymousFileInfo): Promise<PopUpMessageInfo> {
    const ret = await this.getCommonRequestResult(req, 'getNSExtFilePreview', true);
    return {
      content: ret as string,
      code: 'S_OK',
      title: '',
    };
  }
}

const netStorageImpl: Api = new NetStorageShareImpl();
api.registerLogicalApi(netStorageImpl);
export default netStorageImpl;
