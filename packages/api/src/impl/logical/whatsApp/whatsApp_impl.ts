/* eslint-disable camelcase */
import {
  WhatsAppApi,
  WhatsAppQuota,
  RequestWhatsAppOrderQuota,
  ResponseWhatsAppOrderQuota,
  WhatsAppMessage,
  WhatsAppContact,
  WhatsAppTemplate,
  WhatsAppTemplateV2,
  RequestWhatsAppQuota,
  WhatsAppFileExtractResult,
  WhatsAppMessageDirection,
  RequestWhatsAppTemplates,
  RequestWhatsAppTemplatesV2,
  ResponseWhatsAppTemplates,
  ResponseWhatsAppTemplatesV2,
  RequestWhatsAppApprovedTemplates,
  ResponseWhatsAppApprovedTemplates,
  RequestWhatsAppApprovedTemplatesV2,
  ResponseWhatsAppApprovedTemplatesV2,
  RequestWhatsAppPullMessage,
  ResponseWhatsAppPullMessage,
  RequestEditWhatsAppJob,
  RequestEditWhatsAppJobV2,
  ResponseEditWhatsAppJob,
  WhatsAppJobDetail,
  WhatsAppJobDetailV2,
  RequestWhatsAppJobs,
  ResponseWhatsAppJobs,
  ResponseWhatsAppJobsV2,
  RequestWhatsAppJobsStat,
  WhatsAppJobStat,
  RequestWhatsAppJobReport,
  ResponseWhatsAppJobReportReceivers,
  RequestWhatsAppJobReportStat,
  ResponseWhatsAppContact,
  RequestWhatsAppSendMessage,
  WhatsAppAiSearchParams,
  WhatsAppAiSearchResponse,
  WhatsAppChatListRequest,
  WhatsAppChatListResponse,
  WhatsAppChatListByIdsReq,
  WhatsAppChatListByIdsRes,
  WhatsAppChatInitAroundRequest,
  WhatsAppChatInitAroundResponse,
  WhatsAppMessageListRequest,
  WhatsAppMessageListReponse,
  PersonalMessageContact,
  PersonalJobWhatsAppRes,
  PersonalJobWhatsAppDetailRes,
  PersonalJobWhatsAppStatisticRes,
  PersonalJobWhatsAppDetailTableReq,
  PersonalJobWhatsAppDetailTableRes,
  PersonalJobWhatsAppDetailExportRes,
  ReqPersonalMessageHistory,
  PersonalMessageHistory,
  WhatsAppBusinessMessageContactsRequest,
  WhatsAppBusinessMessageContactsResponse,
  WhatsAppBusinessMessageRequest,
  WhatsAppBusinessMessageResponse,
  SnsNosUploadInfo,
  ResVerifyWhatsappNumber,
  WhatsAppBSP,
  WhatsAppOrgStatusV2,
  WhatsAppTplStatusV2,
  WhatsAppCreateAppResV2,
  WhatsAppManagerPhonesReq,
  WhatsAppManagerPhonesRes,
  WhatsAppPhoneV2,
  WhatsAppPhoneAllotAccountsReq,
  WhatsAppPhoneAllotAccountsRes,
  WhatsAppPhoneAllotSelectReq,
  WhatsAppPhoneAllotSelectRes,
  WhatsAppAllotPhoneReq,
  WhatsAppRecycleAllotPhoneReq,
  WhatsAppStatisticReqV2,
  WhatsAppStatisticResV2,
  WhatsAppQuotaV2,
  WhatsAppChatListReqV2,
  WhatsAppChatListResV2,
  WhatsAppChatListByIdsReqV2,
  WhatsAppChatListByIdsResV2,
  WhatsAppChatInitAroundReqV2,
  WhatsAppChatInitAroundResV2,
  WhatsAppMessageListReqV2,
  WhatsAppMessageListResV2,
  WhatsAppSendMessageReqV2,
  WhatsAppSendMessageResV2,
  WhatsAppMessageListCRMReq,
  WhatsAppMessageListCRMRes,
  WhatsAppMessageListCRMAroundReq,
  WhatsAppMessageListCRMAroundRes,
} from '@/api/logical/whatsApp';
import { api } from '@/api/api';
import { ApiRequestConfig } from '@/api/data/http';
import { ApiLifeCycleEvent } from '@/api/_base/api';
import { QueryConfig } from '@/api/data/new_db';
import WhatsAppManageDb from './whatsApp_dbl';

const { LX_TO_WHATSAPP, WHATSAPP_TO_LX } = WhatsAppMessageDirection;

interface WhatsAppApiRequestConfig extends ApiRequestConfig {
  toastError?: boolean;
}

export class WhatsAppApiImpl implements WhatsAppApi {
  name = 'whatsAppApiImpl';

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  private eventApi = api.getEventApi();

  private whatsAppDb = new WhatsAppManageDb();

  constructor() {}

  init() {
    return this.name;
  }

  afterInit() {
    if (this.systemApi.getCurrentUser()) {
      this.whatsAppDb.init();
    }

    return this.name;
  }

  beforeLogout() {
    this.whatsAppDb.close();

    return this.name;
  }

  afterLogin(ev?: ApiLifeCycleEvent) {
    if (ev && ev.data) {
      this.whatsAppDb.init();
    }

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

  proxyWarningHandler() {
    this.eventApi.sendSysEvent({ eventName: 'whatsAppProxyWarning' });
  }

  async get(url: string, req?: any, config?: WhatsAppApiRequestConfig) {
    try {
      const { data } = await this.http.get(url, req, config);

      if (!data) throw {};

      if (!data.success) {
        if (data.code === 601) {
          // 客户端IP不属于海外IP
          this.proxyWarningHandler();

          return Promise.reject(data);
        }

        throw data;
      }

      return data.data;
    } catch (error: Error | any) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  async post(url: string, body: any, config?: WhatsAppApiRequestConfig) {
    config = {
      contentType: 'json',
      noEnqueue: false,
      ...(config || {}),
    };

    try {
      const { data } = await this.http.post(url, body, config);

      if (!data) throw {};

      if (!data.success) {
        if (data.code === 601) {
          // 客户端IP不属于海外IP
          this.proxyWarningHandler();

          return Promise.reject(data);
        }

        throw data;
      }

      return data.data;
    } catch (error: Error | any) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  async delete(url: string, req: any, config?: WhatsAppApiRequestConfig) {
    try {
      const { data } = await this.http.delete(url, req, config);

      if (!data) throw {};

      if (!data.success) {
        if (data.code === 601) {
          // 客户端IP不属于海外IP
          this.proxyWarningHandler();

          return Promise.reject(data);
        }

        throw data;
      }

      return data.data;
    } catch (error: Error | any) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  extendMessage(message: WhatsAppMessage): WhatsAppMessage {
    let contactWhatsApp = '';

    if (message.messageDirection === LX_TO_WHATSAPP) {
      contactWhatsApp = message.to;
    } else if (message.messageDirection === WHATSAPP_TO_LX) {
      contactWhatsApp = message.from;
    }

    return { ...message, contactWhatsApp };
  }

  getQuota(req: RequestWhatsAppQuota): Promise<WhatsAppQuota> {
    return this.get(this.systemApi.getUrl('getWhatsAppQuota'), req);
  }

  reportWhatsAppOpportunity(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('reportWhatsAppOpportunity'), req);
  }

  getOrderQuota(req: RequestWhatsAppOrderQuota): Promise<ResponseWhatsAppOrderQuota> {
    return this.get(this.systemApi.getUrl('getWhatsAppOrderQuota'), req);
  }

  async pullContact(): Promise<WhatsAppContact[]> {
    const contactsToBeUpdate: WhatsAppContact[] = [];

    try {
      const contactsFromServer: ResponseWhatsAppContact = (await this.get(this.systemApi.getUrl('pullWhatsAppContact'))).contacts;

      const contactsFromDb = await Promise.all(
        contactsFromServer.map((contact: any) => {
          const query = { contactWhatsApp: contact.to };

          return this.getContacts({ query } as unknown as QueryConfig);
        })
      );

      contactsFromServer.forEach((contact, index) => {
        const contactInDb = contactsFromDb[index][0] as unknown as WhatsAppContact;

        contactsToBeUpdate.push({
          contactName: contact.contactName,
          contactWhatsApp: contact.to,
          lastSeqNo: contactInDb ? contactInDb.lastSeqNo : '',
        });
      });

      const updatedContactWhatsApps = contactsToBeUpdate.map(contact => contact.contactWhatsApp);

      this.whatsAppDb.putAllContacts(contactsToBeUpdate, updatedContactWhatsApps);
    } catch (error) {
      this.errorHandler(error);
    }

    return contactsToBeUpdate;
  }

  async pullMessage(req: RequestWhatsAppPullMessage): Promise<ResponseWhatsAppPullMessage> {
    const response: ResponseWhatsAppPullMessage = await this.post(this.systemApi.getUrl('pullWhatsAppMessage'), req);

    const { recorders: data } = response;

    const { messages, contactMap } = data.reduce<{
      messages: WhatsAppMessage[];
      contactMap: Record<string, WhatsAppContact>;
    }>(
      (accumulator, item) => {
        const { messages, contactMap } = accumulator;

        const message = this.extendMessage(item);

        messages.push(message);

        if (message.contactWhatsApp) {
          if (!contactMap[message.contactWhatsApp]) {
            contactMap[message.contactWhatsApp] = {
              contactWhatsApp: message.contactWhatsApp,
              contactName: message.contactName,
              lastSeqNo: message.seqNo,
            };
          } else {
            const contact = contactMap[message.contactWhatsApp];

            if (message.seqNo > contact.lastSeqNo) {
              contact.contactName = message.contactName;
              contact.lastSeqNo = message.seqNo;
            }
          }
        }

        return accumulator;
      },
      { messages: [], contactMap: {} }
    );

    const contacts = Object.values(contactMap);
    const updatedContactWhatsApps = Object.keys(contactMap);

    this.whatsAppDb.putAllMessages(messages, updatedContactWhatsApps);
    this.whatsAppDb.putAllContacts(contacts, updatedContactWhatsApps);

    return response;
  }

  sendMessage(req: RequestWhatsAppSendMessage): Promise<WhatsAppMessage> {
    return this.post(this.systemApi.getUrl('sendWhatsAppMessage'), { ...req, t: Date.now() });
  }

  getContacts(query: QueryConfig): Promise<WhatsAppContact[]> {
    return this.whatsAppDb.getContacts(query) as Promise<WhatsAppContact[]>;
  }

  getMessages(query: QueryConfig): Promise<WhatsAppMessage[]> {
    return this.whatsAppDb.getMessages(query) as Promise<WhatsAppMessage[]>;
  }

  getTemplates(req: RequestWhatsAppTemplates): Promise<ResponseWhatsAppTemplates> {
    return this.get(this.systemApi.getUrl('getWhatsAppTemplates'), req);
  }

  getApprovedTemplates(req: RequestWhatsAppApprovedTemplates): Promise<ResponseWhatsAppApprovedTemplates> {
    return this.get(this.systemApi.getUrl('getWhatsAppApprovedTemplates'), req);
  }

  getTemplateDetail(req: { id: string }): Promise<WhatsAppTemplate> {
    return this.get(this.systemApi.getUrl('getWhatsAppTemplateDetail'), req);
  }

  getTemplateCategories(): Promise<{ value: string; desc: string }[]> {
    return this.get(this.systemApi.getUrl('getWhatsAppTemplateCategories'));
  }

  getTemplateLanguages(): Promise<{ value: string; desc: string }[]> {
    return this.get(this.systemApi.getUrl('getWhatsAppTemplateLanguages'));
  }

  getPublicTemplates(): Promise<WhatsAppTemplate[]> {
    return this.get(this.systemApi.getUrl('getWhatsAppPublicTemplates'));
  }

  createTemplateDraft(req: WhatsAppTemplate): Promise<WhatsAppTemplate> {
    return this.post(this.systemApi.getUrl('createWhatsAppTemplateDraft'), req);
  }

  updateTemplateDraft(req: WhatsAppTemplate): Promise<WhatsAppTemplate> {
    return this.post(this.systemApi.getUrl('updateWhatsAppTemplateDraft'), req);
  }

  deleteTemplateDraft(req: { id: string }): Promise<null> {
    return this.delete(this.systemApi.getUrl('deleteWhatsAppTemplateDraft'), req);
  }

  submitTemplate(req: WhatsAppTemplate): Promise<WhatsAppTemplate> {
    return this.post(this.systemApi.getUrl('submitWhatsAppTemplate'), req);
  }

  getJobTemplateLink(): Promise<string> {
    return this.get(this.systemApi.getUrl('getWhatsAppJobTemplateLink'));
  }

  extractJobReceiverFile(req: FormData, config?: ApiRequestConfig): Promise<WhatsAppFileExtractResult> {
    return this.post(this.systemApi.getUrl('extractWhatsAppJobReceiverFile'), req, {
      contentType: 'stream',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    });
  }

  extractJobReceiverText(req: { text: string }): Promise<WhatsAppFileExtractResult> {
    return this.post(this.systemApi.getUrl('extractWhatsAppJobReceiverText'), req);
  }

  createJob(req: RequestEditWhatsAppJob): Promise<ResponseEditWhatsAppJob> {
    return this.post(this.systemApi.getUrl('createWhatsAppJob'), req);
  }

  editJob(req: RequestEditWhatsAppJob): Promise<ResponseEditWhatsAppJob> {
    return this.post(this.systemApi.getUrl('editWhatsAppJob'), req);
  }

  deleteJob(req: { jobId: string }): Promise<null> {
    return this.post(this.systemApi.getUrl('deleteWhatsAppJob'), req, { contentType: 'form' });
  }

  revertJob(req: { jobId: string }): Promise<null> {
    return this.post(this.systemApi.getUrl('revertWhatsAppJob'), req, { contentType: 'form' });
  }

  getJobDetail(req: { jobId: string }): Promise<WhatsAppJobDetail> {
    return this.get(this.systemApi.getUrl('getWhatsAppJobDetail'), req);
  }

  getJobs(req: RequestWhatsAppJobs): Promise<ResponseWhatsAppJobs> {
    return this.get(this.systemApi.getUrl('getWhatsAppJobs'), req);
  }

  getJobsStat(req: RequestWhatsAppJobsStat): Promise<WhatsAppJobStat> {
    return this.get(this.systemApi.getUrl('getWhatsAppJobsStat'), req);
  }

  getJobReportReceivers(req: RequestWhatsAppJobReport): Promise<ResponseWhatsAppJobReportReceivers> {
    return this.get(this.systemApi.getUrl('getWhatsAppJobReportReceivers'), req);
  }

  getJobReportStat(req: RequestWhatsAppJobReportStat): Promise<WhatsAppJobStat> {
    return this.get(this.systemApi.getUrl('getWhatsAppJobReportStat'), req);
  }

  doAiSearch(req: WhatsAppAiSearchParams): Promise<WhatsAppAiSearchResponse> {
    return this.post(this.systemApi.getUrl('doWhatsAppAiSearch'), req);
  }

  getChatList(req: WhatsAppChatListRequest): Promise<WhatsAppChatListResponse> {
    return this.get(this.systemApi.getUrl('getWhatsAppChatList'), req);
  }

  getChatListByIds(req: WhatsAppChatListByIdsReq): Promise<WhatsAppChatListByIdsRes> {
    return this.post(this.systemApi.getUrl('getWhatsAppChatListByIds'), req);
  }

  getChatInitAround(req: WhatsAppChatInitAroundRequest): Promise<WhatsAppChatInitAroundResponse> {
    return this.get(this.systemApi.getUrl('getWhatsAppChatInitAround'), req);
  }

  getMessageList(req: WhatsAppMessageListRequest): Promise<WhatsAppMessageListReponse> {
    return this.post(this.systemApi.getUrl('getWhatsAppMessageList'), req);
  }

  getNosUploadToken(req: { fileName: string }): Promise<SnsNosUploadInfo> {
    return this.get(this.systemApi.getUrl('getSnsNosUploadToken'), req);
  }

  getNosDownloadUrl(req: { fileName: string; nosKey: string }): Promise<string> {
    return this.post(this.systemApi.getUrl('getSnsNosDownloadUrl'), req);
  }

  getContactsByCompanyId(resourceId: string, resourceType = 1): Promise<PersonalMessageContact> {
    return this.get(this.systemApi.getUrl('getContactsByCompanyId'), {
      resourceId,
      resourceType,
    });
  }

  getPersonalMessageHistory(req: ReqPersonalMessageHistory): Promise<PersonalMessageHistory> {
    const body = {
      start: req.start,
      limit: req.limit,
      resourceId: req.resourceId,
      accounts: [
        {
          accountId: req.accountId,
          accountWhatsApp: req.accountWhatsApp,
        },
      ],
      contactWhatsApps: [req.whatsappId],
      resourceType: req.resourceType === undefined ? 1 : req.resourceType,
    };
    return this.post(this.systemApi.getUrl('getPersonalMessageHistory'), body);
  }

  getBusinessMessageContacts(req: WhatsAppBusinessMessageContactsRequest): Promise<WhatsAppBusinessMessageContactsResponse> {
    return this.get(this.systemApi.getUrl('getWhatsAppBusinessMessageContacts'), req);
  }

  getBusinessMessageHistory(req: WhatsAppBusinessMessageRequest): Promise<WhatsAppBusinessMessageResponse> {
    return this.post(this.systemApi.getUrl('getWhatsAppBusinessMessageHistory'), req);
  }
  getPersonalJobWhatsAppList(req: { [key: string]: string | number }): Promise<PersonalJobWhatsAppRes> {
    return this.get(this.systemApi.getUrl('getPersonalJobWhatsAppList'), req);
  }

  getPersonalJobWhatsAppDetail(req: { jobId: string }): Promise<PersonalJobWhatsAppDetailRes> {
    return this.get(this.systemApi.getUrl('getPersonalJobWhatsAppDetail'), req);
  }

  getPersonalJobWhatsAppStatistic(req: { jobId: string }): Promise<PersonalJobWhatsAppStatisticRes> {
    return this.get(this.systemApi.getUrl('getPersonalJobWhatsAppStatistic'), req);
  }

  getPersonalJobWhatsAppDetailTable(req: PersonalJobWhatsAppDetailTableReq): Promise<PersonalJobWhatsAppDetailTableRes> {
    return this.get(this.systemApi.getUrl('getPersonalJobWhatsAppDetailTable'), req);
  }

  getPersonalJobWhatsAppDetailExport(req: { jobId: string }): Promise<PersonalJobWhatsAppDetailExportRes> {
    return this.post(this.systemApi.getUrl('getPersonalJobWhatsAppDetailExport'), req, { contentType: 'form' });
  }

  personalJobCreate(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('personalJobCreate'), req);
  }

  personalJobUpdate(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('personalJobUpdate'), req);
  }

  verifyWhatsappNumber(req: string[]): Promise<ResVerifyWhatsappNumber> {
    return this.post(this.systemApi.getUrl('verifyWhatsappNumber'), {
      whatsAppNumbers: req,
    });
  }

  getGlobalAreaForAISearch(): Promise<{ label: string; code: string }[]> {
    return this.get(this.systemApi.getUrl('getGlobalAreaForAISearch'));
  }

  // v2
  createJobV2(req: RequestEditWhatsAppJobV2): Promise<ResponseEditWhatsAppJob> {
    return this.post(this.systemApi.getUrl('createWhatsAppJobV2'), req);
  }

  deleteJobV2(req: { jobId: string }): Promise<null> {
    return this.post(this.systemApi.getUrl('deleteWhatsAppJobV2'), req, { contentType: 'form' });
  }

  editJobV2(req: RequestEditWhatsAppJobV2): Promise<ResponseEditWhatsAppJob> {
    return this.post(this.systemApi.getUrl('editWhatsAppJobV2'), req);
  }

  getJobDetailV2(req: { jobId: string }): Promise<WhatsAppJobDetailV2> {
    return this.get(this.systemApi.getUrl('getWhatsAppJobDetailV2'), req);
  }

  revertJobV2(req: { jobId: string }): Promise<null> {
    return this.post(this.systemApi.getUrl('revertWhatsAppJobV2'), req, { contentType: 'form' });
  }

  getJobsV2(req: RequestWhatsAppJobs): Promise<ResponseWhatsAppJobsV2> {
    return this.get(this.systemApi.getUrl('getWhatsAppJobsV2'), req);
  }

  getJobsStatV2(req: RequestWhatsAppJobsStat): Promise<WhatsAppJobStat> {
    return this.get(this.systemApi.getUrl('getWhatsAppJobsStatV2'), req);
  }

  getTemplatesV2(req: RequestWhatsAppTemplatesV2): Promise<ResponseWhatsAppTemplatesV2> {
    return this.get(this.systemApi.getUrl('getWhatsAppTemplatesV2'), req);
  }

  getTemplateCategoriesV2(): Promise<{ value: string; desc: string }[]> {
    return this.get(this.systemApi.getUrl('getWhatsAppTemplateCategoriesV2'));
  }

  getTemplateLanguagesV2(): Promise<{ value: string; desc: string }[]> {
    return this.get(this.systemApi.getUrl('getWhatsAppTemplateLanguagesV2'));
  }

  editTemplateDraftV2(req: WhatsAppTemplateV2): Promise<WhatsAppTemplateV2> {
    return this.post(this.systemApi.getUrl('editWhatsAppTemplateDraftV2'), req);
  }

  deleteTemplateDraftV2(req: { id: string }): Promise<null> {
    return this.delete(this.systemApi.getUrl('deleteWhatsAppTemplateDraftV2'), req);
  }

  submitTemplateV2(req: WhatsAppTemplateV2): Promise<WhatsAppTemplateV2> {
    return this.post(this.systemApi.getUrl('submitWhatsAppTemplateV2'), req);
  }

  getTemplateDetailV2(req: { id: string }): Promise<WhatsAppTemplateV2> {
    return this.get(this.systemApi.getUrl('getWhatsAppTemplateDetailV2'), req);
  }

  getApprovedTemplatesV2(req: RequestWhatsAppApprovedTemplatesV2): Promise<ResponseWhatsAppApprovedTemplatesV2> {
    return this.get(this.systemApi.getUrl('getWhatsAppApprovedTemplatesV2'), req);
  }

  getJobReportStatV2(req: RequestWhatsAppJobReportStat): Promise<WhatsAppJobStat> {
    return this.get(this.systemApi.getUrl('getWhatsAppJobReportStatV2'), req);
  }

  getJobReportReceiversV2(req: RequestWhatsAppJobReport): Promise<ResponseWhatsAppJobReportReceivers> {
    return this.get(this.systemApi.getUrl('getWhatsAppJobReportReceiversV2'), req);
  }

  getBsp(): Promise<WhatsAppBSP> {
    return this.get(this.systemApi.getUrl('getWhatsAppBSP'));
  }

  getOrgStatusV2(): Promise<WhatsAppOrgStatusV2> {
    return this.get(this.systemApi.getUrl('getWhatsAppOrgStatusV2'));
  }

  getTplStatusV2(): Promise<WhatsAppTplStatusV2> {
    return this.get(this.systemApi.getUrl('getWhatsAppTplStatusV2'));
  }

  createAppV2(): Promise<WhatsAppCreateAppResV2> {
    return this.post(this.systemApi.getUrl('createWhatsAppAppV2'), undefined);
  }

  noticeRegisterFinishV2(): Promise<void> {
    return this.get(this.systemApi.getUrl('noticeWhatsAppRegisterFinishV2'), undefined);
  }

  getManagerPhones(req: WhatsAppManagerPhonesReq): Promise<WhatsAppManagerPhonesRes> {
    return this.get(this.systemApi.getUrl('getWhatsAppManagerPhones'), req);
  }

  getAllotPhones(): Promise<WhatsAppPhoneV2[]> {
    return this.get(this.systemApi.getUrl('getWhatsAppAllotPhones'));
  }

  getPhoneAllotAccounts(req: WhatsAppPhoneAllotAccountsReq): Promise<WhatsAppPhoneAllotAccountsRes> {
    return this.get(this.systemApi.getUrl('getWhatsAppPhoneAllotAccounts'), req);
  }

  getPhoneAllotSelect(req: WhatsAppPhoneAllotSelectReq): Promise<WhatsAppPhoneAllotSelectRes> {
    return this.get(this.systemApi.getUrl('getWhatsAppPhoneAllotSelect'), req);
  }

  allotPhoneToAccounts(req: WhatsAppAllotPhoneReq): Promise<void> {
    return this.post(this.systemApi.getUrl('allotWhatsAppPhoneToAccounts'), req);
  }

  recycleAllotPhone(req: WhatsAppRecycleAllotPhoneReq): Promise<void> {
    return this.post(this.systemApi.getUrl('recycleWhatsAppAllotPhone'), req);
  }

  getStatisticV2(req: WhatsAppStatisticReqV2): Promise<WhatsAppStatisticResV2> {
    return this.get(this.systemApi.getUrl('getWhatsAppStatisticV2'), req);
  }

  getQuotaV2(): Promise<WhatsAppQuotaV2> {
    return this.get(this.systemApi.getUrl('getWhatsAppQuotaV2'));
  }

  getChatListV2(req: WhatsAppChatListReqV2): Promise<WhatsAppChatListResV2> {
    return this.get(this.systemApi.getUrl('getWhatsAppChatListV2'), { ...req, t: Date.now() });
  }

  getChatListByIdsV2(req: WhatsAppChatListByIdsReqV2): Promise<WhatsAppChatListByIdsResV2> {
    return this.post(this.systemApi.getUrl('getWhatsAppChatListByIdsV2'), { ...req, t: Date.now() });
  }

  getChatInitAroundV2(req: WhatsAppChatInitAroundReqV2): Promise<WhatsAppChatInitAroundResV2> {
    return this.get(this.systemApi.getUrl('getWhatsAppChatInitAroundV2'), { ...req, t: Date.now() });
  }

  getMessageListV2(req: WhatsAppMessageListReqV2): Promise<WhatsAppMessageListResV2> {
    return this.post(this.systemApi.getUrl('getWhatsAppMessageListV2'), { ...req, t: Date.now() });
  }

  getMessageListCRM(req: WhatsAppMessageListCRMReq): Promise<WhatsAppMessageListCRMRes> {
    return this.post(this.systemApi.getUrl('getWhatsAppMessageListCRM'), { ...req, t: Date.now() });
  }
  getMessageListCRMAround(req: WhatsAppMessageListCRMAroundReq): Promise<WhatsAppMessageListCRMAroundRes> {
    return this.get(this.systemApi.getUrl('getWhatsAppMessageListCRMAround'), { ...req, t: Date.now() });
  }

  sendMessageV2(req: WhatsAppSendMessageReqV2): Promise<WhatsAppSendMessageResV2> {
    return this.post(this.systemApi.getUrl('sendWhatsAppMessageV2'), { ...req, t: Date.now() });
  }
}

const whatsAppApiImpl = new WhatsAppApiImpl();

api.registerLogicalApi(whatsAppApiImpl);

export default whatsAppApiImpl;
