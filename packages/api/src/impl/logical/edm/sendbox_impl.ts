import { api } from '../../../api/api';
import { ApiRequestConfig, DataTransApi } from '../../../api/data/http';
import {
  EdmSendBoxApi,
  RequestAttachmentFinishUpload,
  RequestAttachmentUploadToken,
  RequestEdmSingleAction,
  RequestOperateList,
  RequestOperateListV2,
  RequestReplyContent,
  RequestSaveDraft,
  RequestSendBoxDel,
  RequestSendBoxDetail,
  RequestCircleSendBoxDetail,
  RequestCustomerNewLabelByEmail,
  ResponseCustomerNewLabelByEmail,
  RequestSendBoxInfo,
  RequestSyncContact,
  ResponseSyncContact,
  RequestSendDraft,
  RequestTraceLinkList,
  ResponseContactsStatus,
  ResponseEdmDraftInfo,
  ResponseEdmDraftList,
  ResponseEdmTraceList,
  ResponseOperateList,
  ResponseOperateListV2,
  ResponseReservedCount,
  ResponseSensitiveWords,
  RequestScoreEmail,
  ResponseDetailSubject,
  RequestEmailScoreDetail,
  RequestSendScoreEmail,
  ResponseExportValidFailedContacts,
  ResponseExportArrivedFailed,
  RequestExportContactList,
  RequestUpdateEdmEmailPush,
  EdmMarkInfo,
  ResponseSendBoxCopy,
  ResponseSendBoxSenderList,
  RequestExpectSendDate,
  ResponseExpectSendDate,
  ResponseSendBoxDel,
  ResponseSendBoxDetail,
  ResponseSendBoxInfo,
  ResponseSendDraft,
  ResponseTraceLinkInfo,
  ResponseTraceLinkItem,
  ResponseUsedEmailList,
  RequestEdmUnsubscribes,
  ResponseEdmUnsubscribes,
  ResponseUploadBatchFileToValidate,
  BatchSendSetting,
  ResponseCalculateBatchSendDates,
  ResponseFilterCount,
  ResponseQuotaCount,
  ResponseSendBoxRecord,
  ResponseSendBoxPageList,
  EdmStatInfo,
  ResQuotaList,
  ResponseArriveOperate,
  RequestExportValidFailedContacts,
  CronTimeZoneResponse,
  validateEdmCcReq,
  BatchContactValidateReq,
  EdmSettingInputRec,
  UserGuideRecords,
  EdmEmailContentAssistantResp,
  EdmRewardTaskStateResp,
  EdmOperationTasksResp,
  EdmRewardTaskJoinResp,
  ResponseSendOperate,
  EdmSendboxOperatesByEmailRes,
  QuotaReqModel,
  GPTDayLeft,
  RequestGPTReport,
  RequsetAddBlackList,
  HostingContentReq,
  HostingContentResp,
  HostingReWriteReq,
  HostingReWriteResp,
  SaveHostingReq,
  FetchFilterConfigResp,
  FetchCustomerInfoRes,
  FilterCrmClueContactsReq,
  FilterCrmClueContactsRes,
  AddCrmClueContactsReq,
  GetBounceContentReq,
  HostingSendLimit,
  WarmUpResp,
  WarmUpReq,
  SenderRotateList,
  DeleteEmailFromAddressBookReq,
  RemarketingDataSourceRes,
  SenderListV2Resp,
  CheckEmailAddressReq,
  MarketingSuggestRes,
  ResponseEdmStatInfo,
  CheckReplyEmailRes,
  IStatsEmailItem,
} from '../../../api/logical/edm';
import {
  AiWriteMailModel,
  AiWriteMailResModel,
  ContentPolishReq,
  ContentPolishRes,
  EmailContentUploadReq,
  EmailContentUploadRes,
  GenerateReportReq,
  GenerateReportRes,
  GetEmailContentReq,
  GetEmailContentRes,
  QueryReportReq,
  QueryReportRes,
  AIRewriteConfRes,
  GptAiContentReq,
  GPTAiContentRes,
  GetAiOverviewRes,
  GetAiOverviewReq,
  GetAiDailyStatsReq,
  GetAiDailyStatsRes,
  GetAiDailyDetailReq,
  GetAiDailyDetailRes,
  GetReplayListReq,
  GetReplayListRes,
  // SaveAiHostingTaskReq, SaveAiHostingTaskRes,
  // GetAiHostingTaskInfoReq, GetAiHostingTaskInfoRes,
  AiTaskSwitch,
  UpdateAiBaseInfoReq,
  GetAiIndustryListRes,
  GetAiHostingTaskListRes,
  GptAiContentRefreshReq,
  GPTAiContentRefreshRes,
  GptAiContentTranslateReq,
  GPTAiContentTranslateRes,
  GptRecordReq,
  GptRecordRes,
  StrategyInfoRes,
  StrategySaveReq,
  GetAiHostingPlansReq,
  GetAiHostingPlansRes,
  GetAiHostingPlansRes2,
  createAiHostingGroupReq,
  createAiHostingGroupRes,
  UpdateContactPlanReq,
  GetAiHostingGroupListRes,
  UpdateContactGroupReq,
  AddContactPlanReq,
  SubjectAnalysisReq,
  SubjectAnalysisRes,
  SendBoxConfReq,
  SendBoxConfRes,
  UnsubscribeUrlRes,
  UnsubscribeUrlModel,
  GetPlanListReq,
  GetPlanListRes,
  SetTaskSendLimitReq,
  TaskPlanSwitchReq,
  GetMultiAccountRes,
  MultiAccountOverviewReq,
  MultiAccountOverviewRes,
  RewardTaskPopupInfoRes,
  GetDiagnosisDetailRes,
  EdmSettingInputRecReq,
  GetSummaryInfoRes,
  GetTaskBriefReq,
  GetTaskBriefRes,
  GetSummaryDomainRes,
  AddHostingClueContactsReq,
} from '../../../api/logical/edm_marketing';
import { MailEntryModel } from '../../../api/logical/mail';
import { apis } from '../../../config';
import { SystemApi } from '../../../api/system/system';
import { MailSendHandler } from '../mail/mail_send_handler';
import { MailModelHandler } from '../mail/mail_entry_helper';
import { MailContactHandler } from '../mail/mail_obtain_contact_helper';
import { MailContentDbHelper } from '../mail/mail_content_db_handler';
import { ActionStore, MailEntryProcessingItem, ResponseMailContentEntry } from '../mail/mail_action_store_model';

const eventApi = api.getEventApi();
const storageApi = api.getDataStoreApi();
const GrayPath = 'sirius-it-gray';
const GrayRuleName = 'default';

const chineseUnsubscribeUrl = 'https://sirius-it-edm.qiye.163.com/unsubscribe_zh.html';
const englishUnsubscribeUrl = 'https://sirius-it-edm.qiye.163.com/unsubscribe_en.html';
class EdmSendBoxImpl implements EdmSendBoxApi {
  name: string;

  private http: DataTransApi;

  private systemApi: SystemApi;

  mailContentHandler: MailSendHandler;

  modelHandler: MailModelHandler;

  actions: ActionStore;

  contactHandler: MailContactHandler;

  mailDbHandler: MailContentDbHelper;

  unsubscribeUrl: UnsubscribeUrlModel;

  subscribeUrl: string;

  constructor() {
    this.name = apis.edmSendBoxApiImpl;
    this.systemApi = api.getSystemApi();
    this.http = api.getDataTransApi();
    this.actions = new ActionStore();
    this.modelHandler = new MailModelHandler(this.actions);
    this.contactHandler = new MailContactHandler(this.actions);
    this.mailDbHandler = new MailContentDbHelper(this.actions, this.modelHandler, this.contactHandler);
    this.mailContentHandler = new MailSendHandler(this.actions, this.modelHandler, this.contactHandler, this.mailDbHandler);
    this.unsubscribeUrl = {
      zh: chineseUnsubscribeUrl,
      en: englishUnsubscribeUrl,
    };
    this.subscribeUrl = '';
  }

  async get(url: string, req: any, config?: ApiRequestConfig) {
    try {
      const { data } = await this.http.get(url, req, config);
      if (!data || !data.success) {
        if (data?.message && data.code === 40101) {
          eventApi.sendSysEvent({
            eventSeq: 0,
            eventName: 'error',
            eventLevel: 'error',
            eventData: {
              title: data?.message,
              popupType: 'toast',
              popupLevel: 'error',
              content: '',
            },
            auto: true,
          });
        }
        return Promise.reject(data?.message);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: '服务器没有响应，请稍后再试',
            popupType: 'toast',
            popupLevel: 'error',
            content: '',
          },
          auto: true,
        });
      }
      return Promise.reject(res.data);
    }
  }

  async post(url: string, body: any, config?: ApiRequestConfig) {
    config = {
      contentType: 'json',
      noEnqueue: true,
      ...(config || {}),
    };
    try {
      const { data } = await this.http.post(url, body, config);
      if (!data || !data.success) {
        if (data?.message && data.code === 40101) {
          eventApi.sendSysEvent({
            eventSeq: 0,
            eventName: 'error',
            eventLevel: 'error',
            eventData: {
              title: data?.message,
              popupType: 'toast',
              popupLevel: 'error',
              content: '',
            },
            auto: true,
          });
        }
        return Promise.reject(data);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: '服务器没有响应，请稍后再试',
            popupType: 'toast',
            popupLevel: 'error',
            content: '',
          },
          auto: true,
        });
      }
      return Promise.reject(res.data);
    }
  }

  getSendBoxInfo(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxInfo> {
    return this.get(this.systemApi.getUrl('getSendBoxInfo'), req, config);
  }

  getSendBoxAll(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxInfo> {
    return this.get(this.systemApi.getUrl('getSendBoxAll'), req, config);
  }

  getSendBoxRecord(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxRecord> {
    return this.get(this.systemApi.getUrl('getSendBoxRecord'), req, config);
  }

  getSendBoxPageList(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxPageList> {
    return this.get(this.systemApi.getUrl('getSendBoxPageList'), req, config);
  }

  setHostingStatus(req: { edmEmailId: string }): Promise<boolean> {
    return this.post(this.systemApi.getUrl('setHostingStatus'), req);
  }

  getTaskBrief(req: GetTaskBriefReq): Promise<GetTaskBriefRes> {
    return this.get(this.systemApi.getUrl('getTaskBrief'), req);
  }

  setAllHostingStatus(req: { edmEmailId: string }): Promise<boolean> {
    return this.post(this.systemApi.getUrl('setAllHostingStatus'), req);
  }

  getSendBoxAllPageList(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxPageList> {
    return this.get(this.systemApi.getUrl('getSendBoxAllPageList'), req, config);
  }

  getCircleSendBoxPageList(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxPageList> {
    return this.get(this.systemApi.getUrl('getCircleSendBoxPageList'), req, config);
  }

  getCircleSendBoxAllPageList(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxPageList> {
    return this.get(this.systemApi.getUrl('getCircleSendBoxAllPageList'), req, config);
  }

  getSendBoxStatInfo(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<EdmStatInfo> {
    return this.get(this.systemApi.getUrl('getSendBoxStatInfo'), req, config);
  }

  getSendBoxAllStatInfo(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<EdmStatInfo> {
    return this.get(this.systemApi.getUrl('getSendBoxAllStatInfo'), req, config);
  }

  refreshSendBoxPageList(req?: { edmEmailIds: string; sendboxType?: number }): Promise<ResponseSendBoxPageList> {
    return this.get(this.systemApi.getUrl('refreshSendBoxPageList'), req);
  }

  refreshSendBoxAllPageList(req?: { edmEmailIds: string }): Promise<ResponseSendBoxPageList> {
    return this.get(this.systemApi.getUrl('refreshSendBoxAllPageList'), req);
  }

  refreshCircleSendBoxPageList(req?: { batchIds: string }): Promise<ResponseSendBoxPageList> {
    return this.get(this.systemApi.getUrl('refreshCircleSendBoxPageList'), req);
  }

  refreshCircleSendBoxAllPageList(req?: { batchIds: string }): Promise<ResponseSendBoxPageList> {
    return this.get(this.systemApi.getUrl('refreshCircleSendBoxAllPageList'), req);
  }

  getSendBoxDetail(req: RequestSendBoxDetail): Promise<ResponseSendBoxDetail> {
    return this.get(this.systemApi.getUrl('getSendBoxDetail'), req);
  }

  getSendBoxDetailV2(req: RequestSendBoxDetail): Promise<ResponseSendBoxDetail> {
    return this.get(this.systemApi.getUrl('getSendBoxDetailV2'), req);
  }

  getParentDetail(req: RequestSendBoxDetail): Promise<ResponseSendBoxDetail> {
    return this.get(this.systemApi.getUrl('getParentDetail'), req, {
      timeout: 20 * 60 * 1000,
    });
  }

  addToBlackList(req: RequsetAddBlackList): Promise<any> {
    return this.post(this.systemApi.getUrl('addToBlackList'), req);
  }

  getCircleSendBoxDetail(req: RequestCircleSendBoxDetail): Promise<ResponseSendBoxDetail> {
    return this.get(this.systemApi.getUrl('getCircleSendBoxDetail'), req);
  }

  getCustomerNewLabelByEmail(req: RequestCustomerNewLabelByEmail): Promise<ResponseCustomerNewLabelByEmail[]> {
    return this.post(this.systemApi.getUrl('getCustomerNewLabelByEmail'), req);
  }

  getCustomerExistEmail(req: RequestCustomerNewLabelByEmail): Promise<string[]> {
    return this.post(this.systemApi.getUrl('getCustomerExistEmail'), req);
  }

  syncContact(req: RequestSyncContact): Promise<ResponseSyncContact> {
    return this.post(this.systemApi.getUrl('syncContact'), req);
  }

  getOperateList(req: RequestOperateList): Promise<ResponseOperateList> {
    return this.get(this.systemApi.getUrl('getOperateList'), req);
  }

  getReadOperateList(req: RequestOperateList): Promise<ResponseOperateList> {
    return this.get(this.systemApi.getUrl('getReadOperateList'), req);
  }

  getReadOperateListAll(req: RequestOperateList): Promise<ResponseOperateList> {
    return this.get(this.systemApi.getUrl('getReadOperateListAll'), req);
  }

  getReplyOperateList(req: RequestOperateList): Promise<ResponseOperateList> {
    return this.get(this.systemApi.getUrl('getReplyOperateList'), req);
  }

  getReplyOperateListV2(req: RequestOperateListV2): Promise<ResponseOperateListV2> {
    return this.get(this.systemApi.getUrl('getReplyOperateListV2'), req);
  }

  getReplyContent(req: RequestReplyContent): Promise<MailEntryModel> {
    return this.get(this.systemApi.getUrl('getReplyContent'), { edmEmailId: req.edmEmailId, operateId: req.operateId })
      .then((res: any) => {
        if (res) {
          return this.mailContentHandler.getMailContentProcessResponse(req.mid, res as ResponseMailContentEntry);
        }
        return Promise.reject(res.message);
      })
      .then((res: MailEntryProcessingItem[]) => this.mailContentHandler.handleMailContentResponse(res));
  }

  getPrivilegeReplyContent(req: RequestReplyContent): Promise<MailEntryModel> {
    return this.get(this.systemApi.getUrl('getPrivilegeReplyContent'), { edmEmailId: req.edmEmailId, operateId: req.operateId })
      .then((res: any) => {
        if (res) {
          return this.mailContentHandler.getMailContentProcessResponse(req.mid, res as ResponseMailContentEntry);
        }
        return Promise.reject(res.message);
      })
      .then((res: MailEntryProcessingItem[]) => this.mailContentHandler.handleMailContentResponse(res));
  }

  getReplyOperateListAll(req: RequestOperateList): Promise<ResponseOperateList> {
    return this.get(this.systemApi.getUrl('getReplyOperateListAll'), req);
  }

  getDecryptEmail(req: { contactEmails: string }): Promise<string[]> {
    return this.post(this.systemApi.getUrl('getDecryptEmail'), req, {
      contentType: 'form',
    });
  }

  getTraceLinkList(req: RequestTraceLinkList): Promise<Array<ResponseTraceLinkItem>> {
    return this.get(this.systemApi.getUrl('getTraceLinkList'), req);
  }

  getTraceLinkInfo(req: { edmEmailId: string }): Promise<ResponseTraceLinkInfo> {
    return this.get(this.systemApi.getUrl('getTraceLinkInfo'), req, {
      noEnqueue: true,
    });
  }

  delFromSendBox(req: RequestSendBoxDel): Promise<ResponseSendBoxDel> {
    return this.http.delete(this.systemApi.getUrl('delFromSendBox'), req).then(({ data }) => data as any);
  }

  revertFromSendBox(req: RequestEdmSingleAction): Promise<boolean> {
    return this.post(this.systemApi.getUrl('revertFromSendBox'), req, {
      contentType: 'form',
    });
  }

  copyFromSendBox(req: RequestEdmSingleAction): Promise<ResponseSendBoxCopy> {
    return this.get(this.systemApi.getUrl('copyFromSendBox'), req);
  }

  getSendBoxSenderList(): Promise<ResponseSendBoxSenderList> {
    return this.get(this.systemApi.getUrl('getSendBoxSenderList'), null);
  }

  getExpectSendDate(req: RequestExpectSendDate): Promise<ResponseExpectSendDate> {
    return this.post(this.systemApi.getUrl('getExpectSendDate'), req);
  }

  // draft
  getDraftList(): Promise<ResponseEdmDraftList> {
    return this.get(this.systemApi.getUrl('getDraftList'), null);
  }

  getDraftInfo(draftId: string): Promise<ResponseEdmDraftInfo> {
    return this.get(this.systemApi.getUrl('getDraftInfo'), { draftId });
  }

  delDraftByList(req: { draftIds: string }): Promise<Array<number>> {
    return this.http.delete(this.systemApi.getUrl('delDraftByList'), req).then(({ data }) => {
      if (data?.success) {
        return data.data;
      }
      return Promise.reject(data);
    });
  }

  createDraft(): Promise<string> {
    return this.get(this.systemApi.getUrl('createDraft'), null);
  }

  saveDraft(req: Partial<RequestSaveDraft>): Promise<boolean> {
    return this.post(this.systemApi.getUrl('saveDraft'), req);
  }

  // 营销跟踪
  getEdmTraceList(req: any): Promise<ResponseEdmTraceList> {
    return this.post(this.systemApi.getUrl('getEdmTraceList'), req);
  }

  getEdmTraceListAll(req: any): Promise<ResponseEdmTraceList> {
    return this.post(this.systemApi.getUrl('getEdmTraceListAll'), req);
  }

  // 营销跟踪
  getEdmTraceStats(req: any): Promise<ResponseEdmStatInfo> {
    return this.post(this.systemApi.getUrl('getEdmTraceStats'), req);
  }

  getEdmTraceStatsAll(req: any): Promise<ResponseEdmStatInfo> {
    return this.post(this.systemApi.getUrl('getEdmTraceStatsAll'), req);
  }

  getEdmTraceStatsEmailList(req: any): Promise<Array<IStatsEmailItem>> {
    return this.post(this.systemApi.getUrl('getEdmTraceStatsEmailList'), req);
  }

  getEdmTraceStatsEmailListAll(req: any): Promise<Array<IStatsEmailItem>> {
    return this.post(this.systemApi.getUrl('getEdmTraceStatsEmailListAll'), req);
  }
  //
  getUsedEmailList(req: { emailType: number }): Promise<ResponseUsedEmailList> {
    return this.get(this.systemApi.getUrl('getUsedEmailList'), req);
  }

  getUsedEmailInfo(req: { emailType: number; usedEmailId: string }): Promise<{
    usedEmailId: string;
    emailContent: string;
    emailAttachment: string;
  }> {
    return this.get(this.systemApi.getUrl('getUsedEmailInfo'), req);
  }

  getContactsStatus(req: Array<Record<string, string>>): Promise<ResponseContactsStatus> {
    return this.post(this.systemApi.getUrl('getContactsStatus'), req);
  }

  getContactsStatusV2(req: { contacts: Array<Record<string, string>>; draftId: string }): Promise<ResponseContactsStatus> {
    return this.post(
      this.systemApi.getUrl('getContactsStatusV2'),
      {
        ...req,
        type: 2,
      },
      { timeout: 2 * 60 * 1000 }
    );
  }

  uploadTemplateFile(req: FormData, config?: ApiRequestConfig): Promise<ResponseContactsStatus> {
    return this.post(this.systemApi.getUrl('uploadFileToValidate'), req, {
      contentType: 'stream',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    });
  }

  checkEmailAddress(req: CheckEmailAddressReq, config?: ApiRequestConfig) {
    return this.post(this.systemApi.getUrl('checkEmailAddress'), req, { ...config, timeout: 2 * 60 * 1000 });
  }

  deleteHostingPlan(req: { taskId: string; planId: string }) {
    return this.post(this.systemApi.getUrl('deleteHostingPlan'), req);
  }

  sendMail(req: RequestSendDraft): Promise<ResponseSendDraft> {
    return this.post(this.systemApi.getUrl('edmSendMail'), req, {
      timeout: 2 * 60 * 1000,
    });
  }
  sendSenderRotateMail(req: RequestSendDraft): Promise<ResponseSendDraft> {
    return this.post(this.systemApi.getUrl('edmSendSenderRoatateMail'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  sendNormalMail(req: RequestSendDraft): Promise<ResponseSendDraft> {
    return this.post(this.systemApi.getUrl('edmNormalSendMail'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  sendSenderRotateNormalMail(req: RequestSendDraft): Promise<ResponseSendDraft> {
    return this.post(this.systemApi.getUrl('sendSenderRotateNormalMail'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  cronEdit(req: RequestSendDraft): Promise<any> {
    return this.post(this.systemApi.getUrl('edmCronEdit'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  // 循环发信
  uploadBatchFileToValidate(req: FormData, config?: ApiRequestConfig): Promise<ResponseUploadBatchFileToValidate> {
    return this.post(this.systemApi.getUrl('uploadBatchFileToValidate'), req, {
      contentType: 'stream',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    });
  }

  calculateBatchSendDates(req: BatchSendSetting): Promise<ResponseCalculateBatchSendDates> {
    return this.post(this.systemApi.getUrl('calculateBatchSendDates'), req);
  }

  batchSendMail(req: RequestSendDraft): Promise<{ flowInfoList: Array<ResponseSendDraft> }> {
    return this.post(this.systemApi.getUrl('batchSendMail'), req);
  }

  // 发件量
  getSendCount(): Promise<ResponseReservedCount> {
    return this.get(this.systemApi.getUrl('getSendCount'), null);
  }

  getFilterCount(): Promise<ResponseFilterCount> {
    return this.get(this.systemApi.getUrl('getFilterCount'), null);
  }

  getQuotaCheckCount(req: QuotaReqModel): Promise<ResponseQuotaCount> {
    return this.post(this.systemApi.getUrl('getQuotaCheckCount'), req);
  }

  fetchWarmUpData(req: WarmUpReq): Promise<WarmUpResp> {
    return this.get(this.systemApi.getUrl('fetchWarmUpData'), req);
  }

  fetchSenderList(): Promise<SenderRotateList> {
    return this.get(this.systemApi.getUrl('fetchSenderList'), null);
  }

  fetchSenderListV2(): Promise<SenderListV2Resp> {
    return this.get(this.systemApi.getUrl('fetchSenderListV2'), null);
  }

  getReceiverTemplate(): Promise<string> {
    return this.get(this.systemApi.getUrl('getReceiverTemplate'), null);
  }

  getSensitiveWords(): Promise<ResponseSensitiveWords> {
    return this.get(this.systemApi.getUrl('getSensitiveWords'), null);
  }

  getScoreEmail(req: RequestScoreEmail): Promise<EdmMarkInfo> {
    return this.get(this.systemApi.getUrl('getScoreEmail'), req);
  }

  getEmailScoreDetail(req: RequestEmailScoreDetail): Promise<any> {
    return this.get(this.systemApi.getUrl('getEmailScoreDetail'), req);
  }

  sendScoreEmail(req: RequestSendScoreEmail): Promise<string> {
    return this.post(this.systemApi.getUrl('sendScoreEmail'), req);
  }

  exportValidFailedContacts(req: string[]): Promise<ResponseExportValidFailedContacts> {
    return this.post(this.systemApi.getUrl('exportValidFailedContacts'), req, { contentType: 'json' });
  }

  exportArrivedFailed(req: { edmEmailId: string }): Promise<ResponseExportArrivedFailed> {
    return this.post(this.systemApi.getUrl('exportArrivedFailed'), req, { contentType: 'form' });
  }

  exportContactList(req: RequestExportContactList): Promise<ResponseExportArrivedFailed> {
    return this.get(this.systemApi.getUrl('exportContactList'), req, { contentType: 'form' });
  }

  getExportContactState(req: RequestExportContactList): Promise<{ sync: boolean; fileName: string }> {
    return this.post(this.systemApi.getUrl('getExportContactState'), req);
  }

  downloadContactList(req: RequestExportContactList): void {
    const params = new URLSearchParams();
    Object.entries(req).forEach(([key, value]) => {
      if (![null, undefined, ''].includes(value)) {
        params.append(key, value);
      }
    });
    return this.systemApi.webDownloadLink(`${this.systemApi.getUrl('downloadContactList')}?${params.toString()}`);
  }

  updateEdmEmailPush(req: RequestUpdateEdmEmailPush): Promise<any> {
    return this.post(this.systemApi.getUrl('updateEdmEmailPush'), req, { contentType: 'form' });
  }

  uploadEdmImage(file: File) {
    const formData = new FormData();
    formData.append('picFile', file);
    formData.append('from', 'edm');
    formData.append('needDel', 'false');

    return this.http
      .post(this.systemApi.getUrl('uploadEdmImage'), formData, {
        contentType: 'stream',
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 20 * 60 * 1000,
      })
      .then(({ data }) => data?.data.picUrl);
  }

  delEdmImage(url: string) {
    return this.http
      .post(
        this.systemApi.getUrl('uploadEdmImage'),
        {
          needDel: true,
          url,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
      .then(({ data }) => data?.data);
  }

  getAttachmentUploadToken(req: RequestAttachmentUploadToken) {
    return this.get(this.systemApi.getUrl('getAttachmentToken'), req);
  }

  attachmentFinishUpload(req: RequestAttachmentFinishUpload) {
    return this.post(this.systemApi.getUrl('attachmentFinishUpload'), req, {
      contentType: 'form',
    });
  }

  getRecommandSubject(): Promise<any> {
    return this.get(this.systemApi.getUrl('getRecommandSubject'), {});
  }

  getEmailIdByInternalId(id: string): Promise<{ code: string; var: Array<{ id: string }> }> {
    const params = new URLSearchParams({
      func: 'mbox:getMessageInfos',
      sid: this.systemApi.getCurrentUser()?.sessionId || '',
    });
    return this.http
      .post(
        this.systemApi.getUrl('mailOperation') + '?' + params.toString(),
        {
          limit: 1,
          start: 0,
          summaryWindowSize: 1,
          returnTotal: true,
          returnTag: false,
          returnAttachments: false,
          order: 'date',
          desc: false,
          skipLockedFolders: false,
          filter: {},
          ids: [id],
          internalIdMode: !isNaN(Number(id)),
        },
        {
          contentType: 'json',
          headers: {
            Accept: 'application/json;charset=UTF-8',
          },
        }
      )
      .then(res => res.data as any);
  }

  getEdmUnsubscribes(req: RequestEdmUnsubscribes): Promise<ResponseEdmUnsubscribes> {
    return this.get(this.systemApi.getUrl('getEdmUnsubscribes'), req);
  }

  getQuotaList(page?: number, pageSize?: number): Promise<ResQuotaList> {
    return this.get(this.systemApi.getUrl('getQuotaList'), {
      page,
      pageSize,
    });
  }

  getEdmUserUsed(accId: string): Promise<{ accId: string; totalUsed: number; maxDayQuota: number; maxSingleQuota: number; maxTotalQuota: number }> {
    return this.get(this.systemApi.getUrl('getEdmUserUsed'), {
      accId,
    });
  }

  setQuotaForEdmUser(req: { accId: string; totalQuota?: number; dayQuota?: number; singleQuota?: number; defaultQuota?: number }): Promise<boolean> {
    return this.post(this.systemApi.getUrl('setQuotaForEdmUser'), req, {
      contentType: 'form',
    });
  }

  getArriveOperates(req: RequestOperateList): Promise<ResponseArriveOperate> {
    return this.get(this.systemApi.getUrl('getArriveOperates'), req);
  }

  getArriveOperatesAll(req: RequestOperateList): Promise<ResponseArriveOperate> {
    return this.get(this.systemApi.getUrl('getArriveOperatesAll'), req);
  }

  getDetailSubject(req: { edmEmailId: string }): Promise<ResponseDetailSubject> {
    return this.get(this.systemApi.getUrl('getDetailSubject'), req);
  }

  getCycleDetailSubject(req: { batchId: string }): Promise<ResponseDetailSubject> {
    return this.get(this.systemApi.getUrl('getCycleDetailSubject'), req);
  }

  exportValidFailedContactsV2(req: RequestExportValidFailedContacts): Promise<ResponseExportValidFailedContacts> {
    return this.post(this.systemApi.getUrl('exportValidFailedContactsV2'), req);
  }

  getEdmCronTimezone(): Promise<CronTimeZoneResponse> {
    return this.get(this.systemApi.getUrl('getEdmCronTimezone'), {});
  }

  notSaveDraft(draftId: string) {
    return this.post(this.systemApi.getUrl('notSaveDraft'), { draftId });
  }

  validateEdmCc(req: validateEdmCcReq) {
    return this.post(this.systemApi.getUrl('validateEdmCc'), req);
  }

  batchContactValidate(req: BatchContactValidateReq) {
    return this.post(this.systemApi.getUrl('batchContactValidate'), req);
  }

  getEdmVerifyFilter(): Promise<Array<{ value: string; text: string; explain: string }>> {
    return this.get(this.systemApi.getUrl('getEdmVerifyFilter'), {});
  }

  getEdmSettingInputRec(): Promise<EdmSettingInputRec> {
    return this.get(this.systemApi.getUrl('getEdmSettingInputRec'), {});
  }

  getUserGuideRecords(): Promise<UserGuideRecords> {
    return this.get(this.systemApi.getUrl('getUserGuideRecords'), {});
  }

  getEmailContentAssistant(): Promise<EdmEmailContentAssistantResp> {
    return this.get(this.systemApi.getUrl('getEmailContentAssistant'), {});
  }

  getRewardTaskState(): Promise<EdmRewardTaskStateResp> {
    return this.get(this.systemApi.getUrl('getRewardTaskState'), {});
  }

  getOperationTasksResp(): Promise<EdmOperationTasksResp> {
    return this.get(this.systemApi.getUrl('getOperationTasksResp'), {});
  }

  joinRewardTask(): Promise<EdmRewardTaskJoinResp> {
    return this.post(this.systemApi.getUrl('joinRewardTask'), {});
  }

  sendboxAnalysis(req: SubjectAnalysisReq): Promise<SubjectAnalysisRes> {
    return this.post(this.systemApi.getUrl('sendboxAnalysis'), req);
  }

  setUserGuideRecord(type: number | string, isSkip?: boolean): Promise<void> {
    const params: { type: number | string; skip?: boolean; finish?: boolean } = { type };
    if (isSkip) {
      params.skip = true;
    } else {
      params.finish = true;
    }
    return this.post(this.systemApi.getUrl('setUserGuideRecord'), params, { contentType: 'form' });
  }

  deleteEdmSettingInputRec(req: EdmSettingInputRecReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteEdmSettingInputRec'), req);
  }

  fetchRemarketingContacts(req: { edmEmailIds: string[] }): Promise<RemarketingDataSourceRes> {
    return this.post(this.systemApi.getUrl('fetchRemarketingContacts'), req);
  }

  getSendOperateList(req: RequestOperateList): Promise<ResponseSendOperate> {
    return this.get(this.systemApi.getUrl('getSendOperateList'), req);
  }

  getSendOperateListAll(req: RequestOperateList): Promise<ResponseSendOperate> {
    return this.get(this.systemApi.getUrl('getSendOperateListAll'), req);
  }

  getEdmSendboxOperatesByEmail(req: { contactEmail: string }): Promise<EdmSendboxOperatesByEmailRes> {
    return this.get(this.systemApi.getUrl('getEdmSendboxOperatesByEmail'), req);
  }

  getEdmMarketingData(req: any): Promise<ResponseEdmTraceList> {
    return this.post(this.systemApi.getUrl('getEdmMarketingData'), req);
  }

  // ai 写信
  gptEmailWrite(req: AiWriteMailModel): Promise<AiWriteMailResModel> {
    return this.post(this.systemApi.getUrl('gptEmailWrite'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  gptEmailRetouch(req: AiWriteMailModel): Promise<AiWriteMailResModel> {
    return this.post(this.systemApi.getUrl('gptEmailRetouch'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  getGPTQuota(): Promise<GPTDayLeft> {
    return this.get(this.systemApi.getUrl('getGPTQuota'), {});
  }

  reportGPTTask(req: RequestGPTReport): Promise<any> {
    return this.post(this.systemApi.getUrl('reportGPTTask'), req);
  }

  getGptConfig(): Promise<any> {
    return this.get(this.systemApi.getUrl('getGptConfig'), {});
  }

  generateReport(req: GenerateReportReq): Promise<GenerateReportRes> {
    return this.post(this.systemApi.getUrl('generateReport'), req);
  }

  getGPTAiContent(req: GptAiContentReq): Promise<GPTAiContentRes> {
    return this.post(this.systemApi.getUrl('getGPTAiContent'), req);
  }

  getGPTAiContentRefresh(req: GptAiContentRefreshReq): Promise<GPTAiContentRefreshRes> {
    return this.post(this.systemApi.getUrl('getGPTAiContentRefresh'), req);
  }

  async doTranslateGPTAiContent(req: GptAiContentTranslateReq, token: number): Promise<GPTAiContentTranslateRes> {
    const res = await this.http.post(this.systemApi.getUrl('doTranslateGPTAiContent'), req, {
      contentType: 'json',
      noEnqueue: true,
    });
    return {
      ...res.data,
      token,
    } as GPTAiContentTranslateRes;
  }

  getGptRecord(req: GptRecordReq): Promise<GptRecordRes> {
    return this.get(this.systemApi.getUrl('getGptRecord'), req);
  }

  getRewardTaskPopupInfo(): Promise<RewardTaskPopupInfoRes> {
    return this.post(this.systemApi.getUrl('getRewardTaskPopupInfo'), {});
  }

  queryReport(req: QueryReportReq): Promise<QueryReportRes> {
    return this.get(this.systemApi.getUrl('queryReport'), req);
  }

  emailContentUpload(req: EmailContentUploadReq): Promise<EmailContentUploadRes> {
    return this.post(this.systemApi.getUrl('emailContentUpload'), req);
  }

  getEmailContent(req: GetEmailContentReq): Promise<GetEmailContentRes> {
    return this.get(this.systemApi.getUrl('getEmailContent'), req);
  }

  contentPolish(req: ContentPolishReq): Promise<ContentPolishRes> {
    return this.post(this.systemApi.getUrl('contentPolish'), req);
  }

  getAIRewriteConf(): Promise<AIRewriteConfRes> {
    return this.post(this.systemApi.getUrl('getAIRewriteConf'), {});
  }

  generalHostingContent(req: HostingContentReq): Promise<HostingContentResp> {
    return this.post(this.systemApi.getUrl('generalHostingContent'), req);
  }

  generalHostingReWriteContent(req: HostingReWriteReq): Promise<HostingReWriteResp> {
    return this.post(this.systemApi.getUrl('generalHostingReWriteContent'), req);
  }

  saveHosting(req: SaveHostingReq): Promise<{ taskId: string; planId: string }> {
    return this.post(this.systemApi.getUrl('saveHosting'), req);
  }

  fetchHostingInfo(req: { taskId: string }): Promise<SaveHostingReq> {
    return this.get(this.systemApi.getUrl('fetchHostingInfo'), req);
  }

  fetchFilterConfig(): Promise<FetchFilterConfigResp> {
    return this.get(this.systemApi.getUrl('fetchFilterConfig'), {});
  }

  saveFilterConfig(req: FetchFilterConfigResp): Promise<any> {
    return this.post(this.systemApi.getUrl('saveFilterConfig'), req);
  }

  fetchCustomerInfo(req: { emails: string[] }): Promise<FetchCustomerInfoRes> {
    return this.post(this.systemApi.getUrl('fetchCustomerInfo'), req, {
      timeout: 2 * 1000, // 这里2秒如果不出数据. 就不要了
    });
  }

  filterCrmClueContacts(req: FilterCrmClueContactsReq): Promise<FilterCrmClueContactsRes> {
    return this.post(this.systemApi.getUrl('filterCrmClueContacts'), req);
  }

  addCrmClueContacts(req: AddCrmClueContactsReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addCrmClueContacts'), req);
  }

  addHostingClueContacts(req: AddHostingClueContactsReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addHostingClueContacts'), req);
  }

  getBounceContent(req: GetBounceContentReq): Promise<MailEntryModel> {
    return this.get(this.systemApi.getUrl('getBounceContent'), req)
      .then((res: any) => {
        if (res) {
          return this.mailContentHandler.getMailContentProcessResponse(req.tid, res as ResponseMailContentEntry);
        }
        return Promise.reject(res.message);
      })
      .then((res: MailEntryProcessingItem[]) => {
        // 服务端无法返回邮件id以及任何概念的id，这里拼接请求参数作为id以保证查看邮件详情展示
        this.fillEdmMailIdToItems(res, req.edmEmailId);
        return this.mailContentHandler.handleMailContentResponse(res);
      });
  }

  private fillEdmMailIdToItems(items: MailEntryProcessingItem[], edmMailId: string) {
    if (items && items.length && edmMailId) {
      items.forEach(item => {
        if (!item.id) {
          item.id = edmMailId;
        }
      });
    }
  }

  getSendedContent(req: GetBounceContentReq): Promise<MailEntryModel> {
    return this.get(this.systemApi.getUrl('getSendedContent'), req)
      .then((res: any) => {
        if (res) {
          return this.mailContentHandler.getMailContentProcessResponse(req.tid, res as ResponseMailContentEntry);
        }
        return Promise.reject(res.message);
      })
      .then((res: MailEntryProcessingItem[]) => {
        // 服务端无法返回邮件id以及任何概念的id，这里拼接请求参数作为id以保证查看邮件详情展示
        this.fillEdmMailIdToItems(res, req.edmEmailId);
        return this.mailContentHandler.handleMailContentResponse(res);
      });
  }

  getMarketingSuggest(): Promise<MarketingSuggestRes> {
    return this.get(this.systemApi.getUrl('getMarketingSuggest'), {});
  }

  fetchSendLimit(req: { taskId: string }): Promise<HostingSendLimit> {
    return this.get(this.systemApi.getUrl('fetchSendLimit'), req);
  }

  deleteEmailFromAddressBook(req: DeleteEmailFromAddressBookReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteEmailFromAddressBook'), req);
  }

  checkReplyEmail(req: { email: string }): Promise<CheckReplyEmailRes> {
    return this.get(this.systemApi.getUrl('checkReplyEmail'), req);
  }

  getSummaryInfo(): Promise<GetSummaryInfoRes> {
    return this.get(this.systemApi.getUrl('getSummaryInfo'), {}, { timeout: 2 * 60 * 1000 });
  }

  getSummaryDomain(): Promise<GetSummaryDomainRes> {
    return this.get(this.systemApi.getUrl('getSummaryDomain'), {});
  }

  // ai托管
  getAiOverview(req: GetAiOverviewReq): Promise<GetAiOverviewRes> {
    return this.get(this.systemApi.getUrl('getAiOverview'), req);
  }

  getAiDailyDetail(req: GetAiDailyDetailReq): Promise<GetAiDailyDetailRes> {
    return this.get(this.systemApi.getUrl('getAiDailyDetail'), req);
  }

  getReplayList(req: GetReplayListReq): Promise<GetReplayListRes> {
    return this.get(this.systemApi.getUrl('getReplayList'), req);
  }

  getAiDailyStats(req: GetAiDailyStatsReq): Promise<GetAiDailyStatsRes> {
    return this.get(this.systemApi.getUrl('getAiDailyStats'), req);
  }

  getAiHostingPlans(req: GetAiHostingPlansReq): Promise<GetAiHostingPlansRes2> {
    return this.get(this.systemApi.getUrl('getAiHostingPlans'), req);
  }

  // 获取营销任务简要列表
  getAiHostingPlanList(req: GetAiHostingPlansReq): Promise<GetAiHostingPlansRes> {
    return this.get(this.systemApi.getUrl('getAiHostingPlanList'), req);
  }

  updateContactPlan(req: UpdateContactPlanReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('updateContactPlan'), req);
  }

  getAiHostingGroupList(req: GetAiHostingPlansReq): Promise<GetAiHostingGroupListRes> {
    return this.get(this.systemApi.getUrl('getAiHostingGroupList'), req);
  }

  createAiHostingGroup(req: createAiHostingGroupReq): Promise<createAiHostingGroupRes> {
    return this.post(this.systemApi.getUrl('createAiHostingGroup'), req);
  }

  updateContactGroup(req: UpdateContactGroupReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('updateContactGroup'), req);
  }

  addContactPlan(req: AddContactPlanReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addContactPlan'), req, { timeout: 2 * 60 * 1000 });
  }

  getLastBasicInfo(req: { taskId: string }): Promise<SaveHostingReq> {
    return this.get(this.systemApi.getUrl('getLastBasicInfo'), req);
  }

  // saveAiHostingTask(req: SaveAiHostingTaskReq): Promise<SaveAiHostingTaskRes> {
  //   return this.post(this.systemApi.getUrl('saveAiHostingTask'), req);
  // }

  // getAiHostingTaskInfo(req: GetAiHostingTaskInfoReq): Promise<GetAiHostingTaskInfoRes> {
  //   return this.get(this.systemApi.getUrl('getAiHostingTaskInfo'), req);
  // }

  getAiHostingTaskList(): Promise<GetAiHostingTaskListRes> {
    return this.get(this.systemApi.getUrl('getAiHostingTaskList'), {});
  }

  aiTaskSwitch(req: AiTaskSwitch): Promise<boolean> {
    return this.post(this.systemApi.getUrl('aiTaskSwitch'), req);
  }

  strategyInfo(): Promise<StrategyInfoRes> {
    return this.get(this.systemApi.getUrl('strategyInfo'), {});
  }

  strategySave(req: StrategySaveReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('strategySave'), req);
  }

  updateAiBaseInfo(req: UpdateAiBaseInfoReq): Promise<string> {
    return this.post(this.systemApi.getUrl('updateAiBaseInfo'), req);
  }

  getAiIndustryList(): Promise<GetAiIndustryListRes> {
    return this.get(this.systemApi.getUrl('getAiIndustryList'), {});
  }

  getSendBoxConf(req: SendBoxConfReq, config?: ApiRequestConfig): Promise<SendBoxConfRes> {
    return this.get(this.systemApi.getUrl('getSendBoxConf'), req, config);
  }

  getDiagnosisDetail(): Promise<GetDiagnosisDetailRes> {
    return this.get(this.systemApi.getUrl('getDiagnosisDetail'), {});
  }

  getUnsubscribeUrl(domain?: string): Promise<UnsubscribeUrlRes> {
    return this.get(this.systemApi.getUrl('getUnsubscribeUrl'), { domain });
  }

  getMultiAccount(): Promise<GetMultiAccountRes> {
    return this.get(this.systemApi.getUrl('getMultiAccount'), {});
  }

  multiAccountOverview(req: MultiAccountOverviewReq): Promise<MultiAccountOverviewRes> {
    return this.get(this.systemApi.getUrl('multiAccountOverview'), req);
  }

  async refreshUnsubscribeUrl(email?: string): Promise<void> {
    if (process.env.BUILD_ISLINGXI) return;
    const domain = email ? email.split('@')[1] : '';
    const { chineseUnsubscribeUrl: zhUrl, englishUnsubscribeUrl: enUrl, subscribeUrl: subscribeUrl } = await this.getUnsubscribeUrl(domain || '');
    console.log('refreshUnsubscribeUrl====================111111111', domain);
    if (zhUrl && enUrl) {
      this.unsubscribeUrl.zh = zhUrl;
      this.unsubscribeUrl.en = enUrl;
      if (subscribeUrl) {
        this.subscribeUrl = subscribeUrl;
      }
    }
  }

  handleUnsubscribeText(lang: 'zh' | 'en'): string {
    const url = this.unsubscribeUrl[lang] + '?host=#{t_host}&sign=#{t_p1}&from=#{t_p2}';
    let text;
    if (lang === 'zh') {
      text = `<p class='un_sub_text'>如不想收到此类邮件，<a href="${url}" target="_blank" class="edm-unsubscribe temp-edm-unsubscribe-url">点击退订</a></p>`;
    } else {
      // eslint-disable-next-line max-len
      text = `<p class='un_sub_text'>If you don't want to receive our emails, you can easily <a href="${url}" target="_blank" class="edm-unsubscribe temp-edm-unsubscribe-url">unsubscribe</a> here.</p>`;
    }
    return text;
  }
  handleSubscribeText(body: string): string {
    let text = `<a contenteditable="false" href="${this.subscribeUrl}" target="_blank" style="display:inline-block; text-decoration: none; cursor: pointer;" class="edm-subscribe">${body}</a>`;
    return text;
  }

  async handleTempUnsubscribeText(emailContent: string, senderEmail?: string, isRemove = true): Promise<string> {
    const node = document.createElement('div');
    node.innerHTML = emailContent;
    const nodes = node.querySelectorAll('.temp-edm-unsubscribe-url');
    if (nodes.length > 0) {
      await this.refreshUnsubscribeUrl(senderEmail);
      const reg = /[\u4e00-\u9fa5]/;
      nodes.forEach((item: any) => {
        const text = item.innerText;
        if (text) {
          item.setAttribute('href', this.getUnsubscribeUrlByLang(reg.test(text[0]) ? 'zh' : 'en'));
          if (isRemove) {
            item.classList.remove('temp-edm-unsubscribe-url');
          }
        }
      });
    }
    return node.innerHTML;
  }

  getUnsubscribeUrlByLang(lang: 'zh' | 'en'): string {
    return this.unsubscribeUrl[lang] + '?host=#{t_host}&sign=#{t_p1}&from=#{t_p2}';
  }

  getPlanList(req: GetPlanListReq): Promise<GetPlanListRes> {
    return this.get(this.systemApi.getUrl('getPlanList'), req);
  }

  setTaskSendLimit(req: SetTaskSendLimitReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('setTaskSendLimit'), req);
  }

  taskPlanSwitch(req: TaskPlanSwitchReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('taskPlanSwitch'), req);
  }

  /**
   * 灰度测试
   * @returns
   */
  fetchTrafficLabel() {
    const url = this.systemApi.getUrl('getABSwitch');
    const matchPath = `${GrayPath}#${GrayRuleName}`;
    this.http
      .get(url, {
        matchPath,
      })
      .then(res => {
        if (res.data?.data) {
          const str = res.data.data[GrayPath] ? res.data.data[GrayPath][GrayRuleName] : undefined;
          if (str) {
            this.updateTrafficLabel(str);
            storageApi.put(matchPath, str, {
              noneUserRelated: false,
            });
          }
        }
      });
  }

  async getMarketingStats(): Promise<Record<'weeklySendCount' | 'autoCount' | 'manualCount' | 'manualContactCount', number>> {
    const url = this.systemApi.getUrl('getMarketingStats');
    const res = await this.http.get<Record<'weeklySendCount' | 'autoCount' | 'manualCount' | 'manualContactCount', number>>(url);
    return (
      res.data?.data || {
        weeklySendCount: 0,
        autoCount: 0,
        manualCount: 0,
        manualContactCount: 0,
      }
    );
  }

  init() {
    const x = storageApi.getSync(`${GrayPath}#${GrayRuleName}`, {
      noneUserRelated: false,
    }).data;
    this.updateTrafficLabel(x);
    this.refreshUnsubscribeUrl();
    return this.name;
  }

  private updateTrafficLabel(label?: string) {
    if (!label) return;
    const [key, value] = label.split(':');
    if (!key || !value) {
      return;
    }
    this.http.addCommonHeader(key, value);
  }

  afterInit() {
    this.fetchTrafficLabel();
    this.systemApi.intervalEvent({
      eventPeriod: 'long',
      handler: async ev => {
        console.log('[abtest]', ev);
        // 15分钟执行一次
        if (ev.seq % 10 === 0) {
          this.fetchTrafficLabel();
        }
      },
      seq: 0,
    });
    return this.name;
  }
}

const edmSendBoxImpl = new EdmSendBoxImpl();
api.registerLogicalApi(edmSendBoxImpl);
export default edmSendBoxImpl;
