/* eslint-disable camelcase */
import {
  SnsMarketingApi,
  SnsMarketingAccount,
  SnsBindingAccountsReq,
  SnsBindingAccountsRes,
  SnsBindingAccountsAllReq,
  SnsBindingAccountsAllRes,
  SnsBindingThridLinkReq,
  SnsBindingThridLinkRes,
  SnsBindingAccountStatusReq,
  SnsBindingAccountStatusRes,
  SnsBindingAccountDetailReq,
  SnsBindingAddAccountReq,
  SnsMarketingPost,
  SnsMarketingMedia,
  SnsSendAiPostReq,
  SnsBindingDailyQuota,
  SnsMarketingUploadInfo,
  SnsEditPostPayload,
  SnsPostPageListReq,
  SnsPostPageListRes,
  SnsPostCommentsReq,
  SnsPostCommentsRes,
  SnsPostChildCommentsReq,
  SnsPostChildCommentsRes,
  SnsSendPostCommentReq,
  SnsUpdateCommentUnReadCountReq,
  SnsRefineContentReq,
  SnsMarketingChatListReq,
  SnsMarketingChatListRes,
  SnsMarketingMessageListReq,
  SnsMarketingMessageListRes,
  SnsMarketingSendMessageReq,
  SnsMarketingSendMessageRes,
  SnsMarketingReadMessageReq,
  SnsMarketingChatListByIdsReq,
  SnsMarketingChatListByIdsRes,
  SnsMarketingPlatform,
  SnsHelpDocsRes,
  SnsRetryAiPostTaskReq,
  SnsTaskAiQuota,
  AiDefaultParam,
  SnsTaskCompleteReq,
  SnsMarketingPlan,
  SnsTaskListReq,
  SnsTaskListRes,
  SnsCalendarReq,
  SnsCalendarRes,
  SnsTaskDraft,
  SnsTaskPreSendReq,
  SnsMarketingState,
  SnsDataAnalysis,
} from '@/api/logical/sns_marketing';
import { api } from '@/api/api';
import { ApiRequestConfig, constHttpCanceledToken } from '@/api/data/http';

interface SnsMarketingApiRequestConfig extends ApiRequestConfig {
  toastError?: boolean;
}

export class SnsMarketingApiImpl implements SnsMarketingApi {
  name = 'snsMarketingApiImpl';

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

  async get(url: string, req?: any, config?: SnsMarketingApiRequestConfig) {
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

  async post(url: string, body: any, config?: SnsMarketingApiRequestConfig) {
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
      const isCanceled = (error?.message || '').startsWith(constHttpCanceledToken);

      console.log('xxxx-isCanceled', isCanceled);

      if (toastError && !isCanceled) {
        this.errorHandler(error?.response?.data || error);
      }

      return Promise.reject(error);
    }
  }

  async delete(url: string, req: any, config?: SnsMarketingApiRequestConfig) {
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

  getSnsBindingAccounts(req: SnsBindingAccountsReq): Promise<SnsBindingAccountsRes> {
    return this.get(this.systemApi.getUrl('getSnsBindingAccounts'), req, { toastError: (req as any).toastError });
  }

  getSnsBindingAccountsAll(req: SnsBindingAccountsAllReq): Promise<SnsBindingAccountsAllRes> {
    return this.get(this.systemApi.getUrl('getSnsBindingAccountsAll'), req, { toastError: (req as any).toastError });
  }

  getSnsBindingThridLink(req: SnsBindingThridLinkReq): Promise<SnsBindingThridLinkRes> {
    return this.get(this.systemApi.getUrl('getSnsBindingThridLink'), req);
  }

  getSnsBindingAccountStatus(req: SnsBindingAccountStatusReq): Promise<SnsBindingAccountStatusRes> {
    return this.get(this.systemApi.getUrl('getSnsBindingAccountStatus'), req);
  }

  getSnsBindingAccountDetail(req: SnsBindingAccountDetailReq): Promise<SnsMarketingAccount[]> {
    return this.get(this.systemApi.getUrl('getSnsBindingAccountDetail'), req);
  }

  addSnsBindingAccount(req: SnsBindingAddAccountReq): Promise<void> {
    return this.post(this.systemApi.getUrl('addSnsBindingAccount'), req);
  }

  cancelSnsBindingAccount(req: { id: string }): Promise<void> {
    return this.delete(this.systemApi.getUrl('cancelSnsBindingAccount'), req);
  }

  deleteSnsBindingAccount(req: { id: string }): Promise<void> {
    return this.delete(this.systemApi.getUrl('deleteSnsBindingAccount'), req);
  }

  getUploadToken(req: { fileName: string }): Promise<SnsMarketingUploadInfo> {
    return this.get(this.systemApi.getUrl('getSnsMarketingUploadToken'), req);
  }

  getDownloadUrl(req: { fileName: string; nosKey: string }): Promise<string> {
    return this.post(this.systemApi.getUrl('getSnsMarketingDownloadUrl'), req);
  }

  createAiPostTask(req: Record<string, any>): Promise<{ batchId: string }> {
    return this.post(this.systemApi.getUrl('createSnsMarketingAiPostTask'), req, {
      timeout: 60000,
    });
  }

  retryAiPostTask(req: SnsRetryAiPostTaskReq): Promise<void> {
    return this.post(this.systemApi.getUrl('retrySnsMarketingAiPostTask'), req);
  }

  getAiTaskPosts(req: { taskId: string }): Promise<SnsMarketingPost[]> {
    return this.get(this.systemApi.getUrl('getSnsMarketingAiTaskPosts'), req);
  }

  sendAiPost(req: SnsSendAiPostReq): Promise<void> {
    return this.post(this.systemApi.getUrl('sendSnsMarketingAiPost'), req);
  }

  sendManualPost(req: SnsEditPostPayload): Promise<void> {
    return this.post(this.systemApi.getUrl('sendSnsMarketingManualPost'), req);
  }

  getSnsPost(req: { postDbId: string }): Promise<SnsMarketingPost> {
    return this.get(this.systemApi.getUrl('getSnsMarketingPost'), req);
  }

  updateSnsPost(req: SnsMarketingPost): Promise<void> {
    return this.post(this.systemApi.getUrl('updateSnsMarketingPost'), req);
  }

  getSnsPostPageList(req: SnsPostPageListReq): Promise<SnsPostPageListRes> {
    return this.post(this.systemApi.getUrl('getSnsMarketingPostPageList'), req);
  }

  getSnsPostComments(req: SnsPostCommentsReq): Promise<SnsPostCommentsRes> {
    return this.get(this.systemApi.getUrl('getSnsMarketingPostComments'), req);
  }

  getSnsPostChildComments(req: SnsPostChildCommentsReq): Promise<SnsPostChildCommentsRes> {
    return this.get(this.systemApi.getUrl('getSnsMarketingPostChildComments'), req);
  }

  sendSnsPostComment(req: SnsSendPostCommentReq): Promise<void> {
    return this.post(this.systemApi.getUrl('sendSnsMarketingPostComment'), req);
  }

  updateCommentUnReadCount(req: SnsUpdateCommentUnReadCountReq): Promise<void> {
    return this.post(this.systemApi.getUrl('updateSnsCommentUnReadCount'), req);
  }

  deleteSnsPost(req: { postDbId: string }): Promise<void> {
    return this.delete(this.systemApi.getUrl('deleteSnsMarketingPost'), req);
  }

  getReplaceContent(req: { postDbId: string }, config?: ApiRequestConfig): Promise<{ contents: string[] }> {
    const conf = {
      timeout: 60000,
      ...config,
    };
    return this.post(this.systemApi.getUrl('getSnsReplaceContent'), req, conf);
  }

  getRefineContent(req: SnsRefineContentReq, config?: ApiRequestConfig): Promise<{ contents: string[] }> {
    const conf = {
      timeout: 60000,
      ...config,
    };
    return this.post(this.systemApi.getUrl('getSnsRefineContent'), req, conf);
  }

  getReplaceImage(req: { postDbId: string; content?: string }, config?: ApiRequestConfig): Promise<{ mediaList: SnsMarketingMedia[] }> {
    const conf = {
      timeout: 60000,
      ...config,
    };
    return this.post(this.systemApi.getUrl('getSnsReplaceImage'), req, conf);
  }

  getChatList(req: SnsMarketingChatListReq): Promise<SnsMarketingChatListRes> {
    return this.post(this.systemApi.getUrl('getSnsMarketingChatList'), { ...req, t: Date.now() });
  }

  getMessageList(req: SnsMarketingMessageListReq): Promise<SnsMarketingMessageListRes> {
    return this.post(this.systemApi.getUrl('getSnsMarketingMessageList'), { ...req, t: Date.now() });
  }

  sendMessage(req: SnsMarketingSendMessageReq): Promise<SnsMarketingSendMessageRes> {
    return this.post(this.systemApi.getUrl('sendSnsMarketingMessage'), { ...req, t: Date.now() });
  }

  readMessage(req: SnsMarketingReadMessageReq): Promise<void> {
    return this.post(this.systemApi.getUrl('updateSnsMarketingMessage'), { ...req, t: Date.now() });
  }

  getChatListByIds(req: SnsMarketingChatListByIdsReq): Promise<SnsMarketingChatListByIdsRes> {
    return this.post(this.systemApi.getUrl('getSnsMarketingChatListByIds'), { ...req, t: Date.now() });
  }

  getSnsHelpDocs(req: { platform: SnsMarketingPlatform }): Promise<SnsHelpDocsRes> {
    return this.get(this.systemApi.getUrl('getSnsHelpDocs'), req);
  }

  getSnsBindingDailyQuota(): Promise<SnsBindingDailyQuota> {
    return this.get(this.systemApi.getUrl('getSnsBindingDailyQuota'));
  }

  getSnsTaskQuota(): Promise<SnsTaskAiQuota> {
    return this.get(this.systemApi.getUrl('getSnsTaskQuota'));
  }

  getSnsTaskAiParam(): Promise<AiDefaultParam> {
    return this.get(this.systemApi.getUrl('getSnsTaskAiParam'));
  }

  createSnsTask(): Promise<{ taskId: string; taskName: string }> {
    return this.get(this.systemApi.getUrl('createSnsTask'));
  }

  completeSnsTask(req: SnsTaskCompleteReq): Promise<{ taskId: string; taskName: string }> {
    return this.post(this.systemApi.getUrl('completeSnsTask'), req);
  }

  getDefaultPlan(req: { accounts: Array<Partial<SnsMarketingAccount>> }): Promise<SnsMarketingPlan> {
    return this.post(this.systemApi.getUrl('getDefaultPlan'), req);
  }

  getSnsTaskList(req: SnsTaskListReq): Promise<SnsTaskListRes> {
    return this.get(this.systemApi.getUrl('getSnsTaskList'), req);
  }

  getSnsCalendar(req: SnsCalendarReq): Promise<SnsCalendarRes> {
    return this.post(this.systemApi.getUrl('getSnsCalendar'), req);
  }

  getSnsTaskDetail(taskId: string): Promise<SnsTaskDraft> {
    return this.get(this.systemApi.getUrl('getSnsTaskDetail'), {
      taskId,
    });
  }

  saveSnsTask(req: Partial<SnsTaskCompleteReq>): Promise<boolean> {
    return this.post(this.systemApi.getUrl('saveSnsTask'), req);
  }

  tryCreatePostForSnsTask(req: SnsTaskPreSendReq): Promise<{ batchId: string }> {
    return this.post(this.systemApi.getUrl('tryCreatePostForSnsTask'), req, {
      timeout: 60000,
    });
  }

  createPostsForSnsTask(req: SnsTaskPreSendReq): Promise<{ batchId: string }> {
    return this.post(this.systemApi.getUrl('createPostsForSnsTask'), req);
  }

  enableSnsTask(taskId: string): Promise<boolean> {
    return this.post(this.systemApi.getUrl('enableSnsTask'), null, {
      params: {
        taskId,
      },
    });
  }

  delSnsTask(taskId: string): Promise<boolean> {
    return this.post(this.systemApi.getUrl('delSnsTask'), null, {
      params: {
        taskId,
      },
    });
  }

  pauseSnsTask(taskId: string): Promise<boolean> {
    return this.post(this.systemApi.getUrl('pauseSnsTask'), null, {
      params: {
        taskId,
      },
    });
  }

  copySnsTask(req: { taskId: string }): Promise<SnsTaskDraft> {
    return this.post(this.systemApi.getUrl('copySnsTask'), null, {
      params: req,
    });
  }

  getTaskState(taskId: string): Promise<SnsMarketingState.TaskStateRes> {
    return this.get(this.systemApi.getUrl('getTaskState'), { taskId });
  }

  getTaskPostState(req: SnsMarketingState.TaskPostStateReq): Promise<SnsMarketingState.TaskPostStateRes> {
    return this.post(this.systemApi.getUrl('getTaskPostState'), req);
  }

  getPostState(req: SnsMarketingState.PostStateReq): Promise<SnsMarketingState.PostStateRes> {
    return this.post(this.systemApi.getUrl('getPostState'), req);
  }

  getAllBindingAccount(req: SnsDataAnalysis.AllBindingAccountReq): Promise<SnsDataAnalysis.AllBindingAccountRes> {
    return this.get(this.systemApi.getUrl('getAllBindingAccount'), req);
  }

  getHotPosts(req: SnsDataAnalysis.HotPostReq): Promise<SnsDataAnalysis.HotPostRes> {
    return this.post(this.systemApi.getUrl('getHotPosts'), req);
  }

  getMediaState(req: SnsDataAnalysis.MediaStateReq): Promise<SnsDataAnalysis.MediaStateRes> {
    return this.post(this.systemApi.getUrl('getMediaState'), req);
  }
}

const snsMarketingApi = new SnsMarketingApiImpl();

api.registerLogicalApi(snsMarketingApi);

export default snsMarketingApi;
