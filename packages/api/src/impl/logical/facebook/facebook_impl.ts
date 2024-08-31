/* eslint-disable camelcase */
import {
  AuthorizeUrlRes,
  FacebookApi,
  PagesListRes,
  PagesStatisticRes,
  FacebookChatListReq,
  FacebookChatListRes,
  FacebookMessageListReq,
  FacebookMessageListRes,
  FacebookMessageSendReq,
  FacebookMessageSendRes,
  FacebookMessageReadReq,
  FacebookMessageReadRes,
  FacebookExpiresAccount,
  FacebookBindStatusRes,
  FacebookAccountReq,
  BoundListRes,
  PagePostListReq,
  PagePostListRes,
  FbCommentListReq,
  FbCommentListRes,
  ChildCommentListReq,
  ChildCommentListRes,
  UnReadCommentCountReq,
  CheckBindStatusReq,
} from '@/api/logical/facebook';
import { api } from '@/api/api';
import { ApiRequestConfig } from '@/api/data/http';

interface FacebookApiRequestConfig extends ApiRequestConfig {
  toastError?: boolean;
}

export class FacebookApiImpl implements FacebookApi {
  name = 'facebookApiImpl';

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  private eventApi = api.getEventApi();

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
        title: error?.message || error?.data?.message || '网络错误',
        content: '',
        popupType: 'toast',
        popupLevel: 'error',
      },
    });
  }

  async get(url: string, req?: any, config?: FacebookApiRequestConfig) {
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

  async post(url: string, body: any, config?: FacebookApiRequestConfig) {
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

  async delete(url: string, req: any, config?: FacebookApiRequestConfig) {
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

  getPublicPageBriefList(): Promise<{ pageId: string; pageName: string }[]> {
    return this.get(this.systemApi.getUrl('getFacebookPublicPageBriefList'));
  }

  getChatList(req: FacebookChatListReq): Promise<FacebookChatListRes> {
    return this.get(this.systemApi.getUrl('getFacebookChatList'), req, { timeout: 2 * 60 * 1000 });
  }

  getMessageList(req: FacebookMessageListReq): Promise<FacebookMessageListRes> {
    return this.get(this.systemApi.getUrl('getFacebookMessageList'), req);
  }

  sendMessage(req: FacebookMessageSendReq): Promise<FacebookMessageSendRes> {
    return this.post(this.systemApi.getUrl('sendFacebookMessage'), req);
  }

  readMessage(req: FacebookMessageReadReq): Promise<FacebookMessageReadRes> {
    return this.post(this.systemApi.getUrl('readFacebookMessage'), req);
  }

  getExpiresAccount(): Promise<FacebookExpiresAccount[]> {
    return this.get(this.systemApi.getUrl('getFacebookExpiresAccount'));
  }

  getAuthorizeUrl(): Promise<AuthorizeUrlRes> {
    return this.get(this.systemApi.getUrl('getAuthorizeUrl'));
  }

  getFacebookPagesList(req: { pageName?: string; pageNumber: number; pageSize: number }): Promise<PagesListRes> {
    return this.get(this.systemApi.getUrl('getFacebookPagesList'), req);
  }

  getBondAccount(req: { pageNumber: number; pageSize: number; sort?: string }): Promise<BoundListRes> {
    return this.get(this.systemApi.getUrl('getBondAccount'), req, { toastError: false });
  }

  getPagesStatistic(): Promise<PagesStatisticRes> {
    return this.get(this.systemApi.getUrl('getPagesStatistic'));
  }

  checkBindStatus(req: CheckBindStatusReq): Promise<FacebookBindStatusRes> {
    return this.get(this.systemApi.getUrl('checkBindStatus'), req);
  }

  cancelBindAccount(req: FacebookAccountReq): Promise<void> {
    return this.delete(this.systemApi.getUrl('cancelBindAccount'), req);
  }

  getPagePostList(req: PagePostListReq): Promise<PagePostListRes> {
    return this.get(this.systemApi.getUrl('getPagePostList'), req);
  }

  getFbCommentList(req: FbCommentListReq): Promise<FbCommentListRes> {
    return this.get(this.systemApi.getUrl('getFbCommentList'), req);
  }

  getFbChildCommmetList(req: ChildCommentListReq): Promise<ChildCommentListRes> {
    return this.get(this.systemApi.getUrl('getFbChildCommmetList'), req);
  }

  replyPostComments(config?: FacebookApiRequestConfig): Promise<string> {
    return this.post(this.systemApi.getUrl('replyPostComments'), null, config);
  }

  unReadCommentCount(req: UnReadCommentCountReq): Promise<string> {
    return this.post(this.systemApi.getUrl('unReadCommentCount'), req);
  }
}

const facebookApiImpl = new FacebookApiImpl();

api.registerLogicalApi(facebookApiImpl);

export default facebookApiImpl;
