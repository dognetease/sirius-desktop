import { ApiRequestConfig } from '../..';
import { Api } from '../_base/api';
import { MailEntryModel } from './mail';
import {
  AiWriteMailModel,
  AiWriteMailResModel,
  GenerateReportReq,
  GenerateReportRes,
  QueryReportReq,
  QueryReportRes,
  SecondSendStrategy,
  EmailContentUploadReq,
  EmailContentUploadRes,
  GetEmailContentReq,
  GetEmailContentRes,
  SecondSendInfo,
  ContentPolishReq,
  ContentPolishRes,
  AIModifyInfo,
  GptAiContentReq,
  GPTAiContentRes,
  AIRewriteConfRes,
  SentenceModel,
  GetAiOverviewRes,
  GetAiOverviewReq,
  GetAiDailyStatsReq,
  GetAiDailyStatsRes,
  GetAiDailyDetailReq,
  GetAiDailyDetailRes,
  GetReplayListReq,
  GetReplayListRes,
  AiTaskSwitch,
  UpdateAiBaseInfoReq,
  GetAiHostingTaskListRes,
  SourceNameType,
  GptAiContentRefreshReq,
  GPTAiContentRefreshRes,
  GptAiContentTranslateReq,
  GPTAiContentTranslateRes,
  GptRecordReq,
  GptRecordRes,
  StrategyInfoRes,
  StrategySaveReq,
  HostingPlanModel,
  GetAiHostingPlansReq,
  GetAiHostingPlansRes,
  GetAiHostingPlansRes2,
  createAiHostingGroupReq,
  createAiHostingGroupRes,
  UpdateContactPlanReq,
  GetAiHostingGroupListRes,
  UpdateContactGroupReq,
  AddContactPlanReq,
  GetAiIndustryListRes,
  Plan,
  SubjectAnalysisReq,
  SubjectAnalysisRes,
  SendBoxConfReq,
  SendBoxConfRes,
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
  BasicRuleInfo,
  GetTaskBriefReq,
  GetTaskBriefRes,
  AiBaseInfoSenderEmails,
  GetSummaryDomainRes,
  AddHostingClueContactsReq,
} from './edm_marketing';

export enum EmailStatus {
  Init = 0,
  Sending = 1,
  Sended = 3,
  Failed = 4,
  Canceled = 5,
  Trash = 6,
}

export interface IStatsEmailItem {
  contactEmail: string;
  contactName: string;
}

export interface EdmSendBoxApi extends Api {
  getSendBoxInfo(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxInfo>;
  getSendBoxAll(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxInfo>;

  getSendBoxRecord(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxRecord>;
  getSendBoxPageList(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxPageList>;
  getSendBoxAllPageList(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxPageList>;

  setHostingStatus(req: { edmEmailId: string }): Promise<boolean>;

  setAllHostingStatus(req: { edmEmailId: string }): Promise<boolean>;

  getTaskBrief(req: GetTaskBriefReq): Promise<GetTaskBriefRes>;

  getCircleSendBoxPageList(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxPageList>;
  getCircleSendBoxAllPageList(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<ResponseSendBoxPageList>;

  getSendBoxStatInfo(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<EdmStatInfo>;
  getSendBoxAllStatInfo(req?: RequestSendBoxInfo, config?: ApiRequestConfig): Promise<EdmStatInfo>;

  refreshSendBoxPageList(req?: { edmEmailIds: string; sendboxType?: number }): Promise<ResponseSendBoxPageList>;
  refreshSendBoxAllPageList(req?: { edmEmailIds: string }): Promise<ResponseSendBoxPageList>;

  refreshCircleSendBoxPageList(req?: { batchIds: string }): Promise<ResponseSendBoxPageList>;
  refreshCircleSendBoxAllPageList(req?: { batchIds: string }): Promise<ResponseSendBoxPageList>;

  getSendBoxDetail(req: RequestSendBoxDetail): Promise<ResponseSendBoxDetail>;
  getSendBoxDetailV2(req: RequestSendBoxDetail): Promise<ResponseSendBoxDetail>;
  getParentDetail(req: RequestSendBoxDetail): Promise<ResponseSendBoxDetail>;

  addToBlackList(req: RequsetAddBlackList): Promise<any>;

  getCircleSendBoxDetail(req: RequestCircleSendBoxDetail): Promise<ResponseSendBoxDetail>;
  getCustomerNewLabelByEmail(req: RequestCustomerNewLabelByEmail): Promise<ResponseCustomerNewLabelByEmail[]>;
  getCustomerExistEmail(req: RequestCustomerNewLabelByEmail): Promise<string[]>;
  syncContact(req: RequestSyncContact): Promise<ResponseSyncContact>;
  getOperateList(req: RequestOperateList): Promise<ResponseOperateList>;
  getReadOperateList(req: RequestOperateList): Promise<ResponseOperateList>;
  getReadOperateListAll(req: RequestOperateList): Promise<ResponseOperateList>;
  getReplyOperateList(req: RequestOperateList): Promise<ResponseOperateList>;
  getReplyOperateListV2(req: RequestOperateListV2): Promise<ResponseOperateListV2>;
  getReplyContent(req: RequestReplyContent): Promise<MailEntryModel>;
  getPrivilegeReplyContent(req: RequestReplyContent): Promise<MailEntryModel>;
  getReplyOperateListAll(req: RequestOperateList): Promise<ResponseOperateList>;
  getDecryptEmail(req: { contactEmails: string }): Promise<string[]>;
  getTraceLinkList(req: RequestTraceLinkList): Promise<Array<ResponseTraceLinkItem>>;
  getTraceLinkInfo(req: { edmEmailId: string }): Promise<ResponseTraceLinkInfo>;
  delFromSendBox(req: RequestSendBoxDel): Promise<ResponseSendBoxDel>;
  revertFromSendBox(req: RequestEdmSingleAction): Promise<boolean>;
  copyFromSendBox(req: RequestEdmSingleAction): Promise<ResponseSendBoxCopy>;
  getArriveOperates(req: RequestOperateList): Promise<ResponseArriveOperate>;
  getArriveOperatesAll(req: RequestOperateList): Promise<ResponseArriveOperate>;
  getDetailSubject(req: { edmEmailId: string }): Promise<ResponseDetailSubject>;
  getCycleDetailSubject(req: { batchId: string }): Promise<ResponseDetailSubject>;
  generateReport(req: GenerateReportReq): Promise<GenerateReportRes>;
  queryReport(req: QueryReportReq): Promise<QueryReportRes>;
  getSendBoxSenderList(): Promise<ResponseSendBoxSenderList>;
  getExpectSendDate(req: RequestExpectSendDate): Promise<ResponseExpectSendDate>;
  sendboxAnalysis(req: SubjectAnalysisReq): Promise<SubjectAnalysisRes>;

  // draft
  getDraftList(): Promise<ResponseEdmDraftList>;
  getDraftInfo(draftId: string): Promise<ResponseEdmDraftInfo>;
  delDraftByList(req: { draftIds: string }): Promise<Array<number>>;
  createDraft(): Promise<string>;
  saveDraft(req: Partial<RequestSaveDraft>): Promise<boolean>;
  notSaveDraft(draftId: string): Promise<void>;

  // 营销跟踪
  getEdmTraceList(req: any): Promise<ResponseEdmTraceList>;
  getEdmTraceListAll(req: any): Promise<ResponseEdmTraceList>;
  getEdmMarketingData(req: any): Promise<ResponseEdmTraceList>;

  //
  getUsedEmailList(req: { emailType: number }): Promise<ResponseUsedEmailList>;
  getUsedEmailInfo(req: { emailType: number; usedEmailId: string }): Promise<{ usedEmailId: string; emailContent: string; emailAttachment: string }>;
  getContactsStatus(req: Array<Record<string, string>>): Promise<ResponseContactsStatus>;
  getContactsStatusV2(req: { contacts: Array<Record<string, string>>; draftId: string }): Promise<ResponseContactsStatus>;
  uploadTemplateFile(req: FormData, config?: ApiRequestConfig): Promise<ResponseContactsStatus>;
  checkEmailAddress(req: CheckEmailAddressReq, config?: ApiRequestConfig): Promise<any>;

  deleteHostingPlan(req: { taskId: string; planId: string }): Promise<boolean>;

  sendMail(req: RequestSendDraft): Promise<ResponseSendDraft>;
  sendSenderRotateMail(req: RequestSendDraft): Promise<ResponseSendDraft>;

  sendNormalMail(req: RequestSendDraft): Promise<ResponseSendDraft>;
  sendSenderRotateNormalMail(req: RequestSendDraft): Promise<ResponseSendDraft>;
  cronEdit(req: RequestSendDraft): Promise<any>;
  getSendBoxConf(req: SendBoxConfReq, config?: ApiRequestConfig): Promise<SendBoxConfRes>;
  refreshUnsubscribeUrl(domain?: string): void;
  handleTempUnsubscribeText(emailContent: string, senderEmail?: string, isRemove?: boolean): Promise<string>;
  handleSubscribeText(body: string): string;
  handleUnsubscribeText(lang: 'zh' | 'en'): string;
  getUnsubscribeUrlByLang(lang: 'zh' | 'en'): string;
  // 营销邮件诊断
  getDiagnosisDetail(): Promise<GetDiagnosisDetailRes>;
  // 循环发信
  uploadBatchFileToValidate(req: FormData, config?: ApiRequestConfig): Promise<ResponseUploadBatchFileToValidate>;
  calculateBatchSendDates(req: BatchSendSetting): Promise<ResponseCalculateBatchSendDates>;
  batchSendMail(req: RequestSendDraft): Promise<{ flowInfoList: Array<ResponseSendDraft> }>;

  // 发件量
  getSendCount(): Promise<ResponseReservedCount>;
  getFilterCount(): Promise<ResponseFilterCount>;
  getQuotaCheckCount(req: QuotaReqModel): Promise<ResponseQuotaCount>;
  fetchWarmUpData(req: WarmUpReq): Promise<WarmUpResp>;
  fetchSenderList(): Promise<SenderRotateList>;
  fetchSenderListV2(): Promise<SenderListV2Resp>;

  // ai营销托管
  getAiOverview(req: GetAiOverviewReq): Promise<GetAiOverviewRes>;
  getAiDailyStats(req: GetAiDailyStatsReq): Promise<GetAiDailyStatsRes>;
  getAiHostingPlans(req: GetAiHostingPlansReq): Promise<GetAiHostingPlansRes2>;
  getAiHostingPlanList(req: GetAiHostingPlansReq): Promise<GetAiHostingPlansRes>;
  updateContactPlan(req: UpdateContactPlanReq): Promise<boolean>;
  getAiHostingGroupList(req: GetAiHostingPlansReq): Promise<GetAiHostingGroupListRes>;
  createAiHostingGroup(req: createAiHostingGroupReq): Promise<createAiHostingGroupRes>;
  updateContactGroup(req: UpdateContactGroupReq): Promise<boolean>;
  addContactPlan(req: AddContactPlanReq): Promise<boolean>;
  getLastBasicInfo(req: { taskId: string }): Promise<SaveHostingReq>;
  getAiDailyDetail(req: GetAiDailyDetailReq): Promise<GetAiDailyDetailRes>;
  getReplayList(req: GetReplayListReq): Promise<GetReplayListRes>;
  getPlanList(req: GetPlanListReq): Promise<GetPlanListRes>;
  setTaskSendLimit(req: SetTaskSendLimitReq): Promise<boolean>;
  taskPlanSwitch(req: TaskPlanSwitchReq): Promise<boolean>;
  addHostingClueContacts(req: AddHostingClueContactsReq): Promise<boolean>;

  // saveAiHostingTask(req: SaveAiHostingTaskReq): Promise<SaveAiHostingTaskRes>;
  // getAiHostingTaskInfo(req: GetAiHostingTaskInfoReq): Promise<GetAiHostingTaskInfoRes>;
  getAiHostingTaskList(): Promise<GetAiHostingTaskListRes>;
  aiTaskSwitch(req: AiTaskSwitch): Promise<boolean>;
  updateAiBaseInfo(req: UpdateAiBaseInfoReq): Promise<string>;
  getAiIndustryList(): Promise<GetAiIndustryListRes>;
  strategySave(req: StrategySaveReq): Promise<boolean>;
  strategyInfo(): Promise<StrategyInfoRes>;
  getReceiverTemplate(): Promise<string>;
  getSensitiveWords(): Promise<ResponseSensitiveWords>;
  getScoreEmail(req: RequestScoreEmail): Promise<EdmMarkInfo>;
  sendScoreEmail(req: RequestSendScoreEmail): Promise<string>;
  getEmailScoreDetail(req: RequestEmailScoreDetail): Promise<any>;
  exportValidFailedContacts(req: string[]): Promise<ResponseExportValidFailedContacts>;
  exportArrivedFailed(req: { edmEmailId: string; tag: number }): Promise<ResponseExportArrivedFailed>;
  exportContactList(req: RequestExportContactList): Promise<ResponseExportArrivedFailed>;
  getExportContactState(req: RequestExportContactList): Promise<{ sync: boolean; fileName: string }>;
  downloadContactList(req: RequestExportContactList): void;
  updateEdmEmailPush(req: RequestUpdateEdmEmailPush): Promise<any>;
  exportValidFailedContactsV2(req: RequestExportValidFailedContacts): Promise<ResponseExportValidFailedContacts>;
  uploadEdmImage(file: File): Promise<string>;
  delEdmImage(url: string): Promise<boolean>;
  getEdmVerifyFilter(): Promise<Array<{ value: string; text: string; explain: string }>>;

  getAttachmentUploadToken(req: RequestAttachmentUploadToken): Promise<ResponseAttachmentUploadToken>;
  attachmentFinishUpload(req: RequestAttachmentFinishUpload): Promise<ResponseAttachmentFinishUpload>;
  getEmailIdByInternalId(id: string): Promise<{ code: string; var: Array<{ id: string }> }>;

  getRecommandSubject(): Promise<any>;

  // edm 退订列表
  getEdmUnsubscribes(req: RequestEdmUnsubscribes): Promise<ResponseEdmUnsubscribes>;

  getQuotaList(page?: number, pageSize?: number): Promise<ResQuotaList>;
  getEdmUserUsed(accId: string): Promise<{ accId: string; totalUsed: number; maxDayQuota: number; maxSingleQuota: number; maxTotalQuota: number }>;
  setQuotaForEdmUser(req: { accId: string; totalQuota?: number; dayQuota?: number; singleQuota?: number; defaultQuota?: number }): Promise<boolean>;

  getEdmCronTimezone(): Promise<CronTimeZoneResponse>;

  validateEdmCc(req: validateEdmCcReq): Promise<null>;

  batchContactValidate(req: BatchContactValidateReq): Promise<BatchContactValidateResp>;

  getEdmSettingInputRec(): Promise<EdmSettingInputRec>;

  deleteEdmSettingInputRec(req: EdmSettingInputRecReq): Promise<boolean>;

  fetchRemarketingContacts(req: { edmEmailIds: string[] }): Promise<RemarketingDataSourceRes>;

  getUserGuideRecords(): Promise<UserGuideRecords>;

  getEmailContentAssistant(): Promise<EdmEmailContentAssistantResp>;

  getRewardTaskState(): Promise<EdmRewardTaskStateResp>;

  getOperationTasksResp(): Promise<EdmOperationTasksResp>;

  joinRewardTask(): Promise<EdmRewardTaskJoinResp>;

  setUserGuideRecord(type: number | string, isSkip: boolean): Promise<void>;

  getSendOperateList(req: RequestOperateList): Promise<ResponseSendOperate>;

  getSendOperateListAll(req: RequestOperateList): Promise<ResponseSendOperate>;

  getEdmSendboxOperatesByEmail(req: { contactEmail: string }): Promise<EdmSendboxOperatesByEmailRes>;

  // GPT AI写信
  getGPTQuota(): Promise<GPTDayLeft>;

  reportGPTTask(req: RequestGPTReport): Promise<any>;

  gptEmailWrite(req: AiWriteMailModel): Promise<AiWriteMailResModel>;

  gptEmailRetouch(req: AiWriteMailModel): Promise<AiWriteMailResModel>;

  getGptConfig(): Promise<any>;

  getGPTAiContent(req: GptAiContentReq): Promise<GPTAiContentRes>;

  getGPTAiContentRefresh(req: GptAiContentRefreshReq): Promise<GPTAiContentRefreshRes>;

  doTranslateGPTAiContent(req: GptAiContentTranslateReq, token: number): Promise<GPTAiContentTranslateRes>;
  getGptRecord(req: GptRecordReq): Promise<GptRecordRes>;

  getRewardTaskPopupInfo(): Promise<RewardTaskPopupInfoRes>;

  getEdmSettingInputRec(): Promise<EdmSettingInputRec>;

  /**
   * 邮件内容上传nos
   */
  emailContentUpload(req: EmailContentUploadReq): Promise<EmailContentUploadRes>;
  /**
   * 根据id获取邮件内容
   */
  getEmailContent(req: GetEmailContentReq): Promise<GetEmailContentRes>;
  /**
   * 主题改写
   */
  contentPolish(req: ContentPolishReq): Promise<ContentPolishRes>;
  /**
   * ai重写配置
   */
  getAIRewriteConf(): Promise<AIRewriteConfRes>;

  // -------- 托管营销 --------
  // 生成托管内容
  generalHostingContent(req: HostingContentReq): Promise<HostingContentResp>;

  // 生成改写内容
  generalHostingReWriteContent(req: HostingReWriteReq): Promise<HostingReWriteResp>;

  // 创建 / 修改接口
  saveHosting(req: SaveHostingReq): Promise<{ taskId: string; planId: string }>;

  // 基础信息 + 邮件信息
  fetchHostingInfo(req: FetchHostingInfoReq): Promise<SaveHostingReq>;

  fetchFilterConfig(): Promise<FetchFilterConfigResp>;

  saveFilterConfig(req: FetchFilterConfigResp): Promise<any>;

  fetchCustomerInfo(req: { emails: string[] }): Promise<FetchCustomerInfoRes>;

  filterCrmClueContacts(req: FilterCrmClueContactsReq): Promise<FilterCrmClueContactsRes>;

  addCrmClueContacts(req: AddCrmClueContactsReq): Promise<boolean>;

  getBounceContent(req: GetBounceContentReq): Promise<MailEntryModel>;

  getSendedContent(req: GetBounceContentReq): Promise<MailEntryModel>;

  getMarketingSuggest(): Promise<MarketingSuggestRes>;

  fetchSendLimit(req: { taskId?: string }): Promise<HostingSendLimit>;

  deleteEmailFromAddressBook(req: DeleteEmailFromAddressBookReq): Promise<boolean>;

  checkReplyEmail(req: { email: string }): Promise<CheckReplyEmailRes>;

  getSummaryInfo(): Promise<GetSummaryInfoRes>;

  getSummaryDomain(): Promise<GetSummaryDomainRes>;

  // 多域名营销相关
  getMultiAccount(): Promise<GetMultiAccountRes>;
  multiAccountOverview(req: MultiAccountOverviewReq): Promise<MultiAccountOverviewRes>;

  getEdmTraceStats(req: any): Promise<ResponseEdmStatInfo>;
  getEdmTraceStatsAll(req: any): Promise<ResponseEdmStatInfo>;

  getMarketingStats(): Promise<Record<'weeklySendCount' | 'autoCount' | 'manualCount' | 'manualContactCount', number>>;

  getEdmTraceStatsEmailList(req: any): Promise<Array<IStatsEmailItem>>;

  getEdmTraceStatsEmailListAll(req: any): Promise<Array<IStatsEmailItem>>;
}

export interface DeleteEmailFromAddressBookReq {
  contactList?: { email: string }[];
}

export enum ProviderType {
  All = 'All',
  Gmail = 'Gmail',
  Outlook = 'Outlook',
  Others = 'Others',
}

//  0：系统账号 1：客户账号 非必需(不传的话返回所有账号)
export enum WarmUpAccountSource {
  system = 0,
  custom = 1,
}
export interface WarmUpReq {
  days: number;
  provider?: 'Gmail' | 'Outlook' | 'Others';
  email?: string;
  sources?: WarmUpAccountSource[];
}

export interface WarmUpResp {
  accountData?: WarmUpData[];
}

export interface SenderRotateList {
  accounts?: WarmUpData[];
}

export interface SenderListV2Resp {
  belongSenders?: SendBoxSender[];
  assignSenders?: WarmUpData[];
  recentEmails?: string[];
}

export interface WarmUpData {
  email?: string;
  level?: number; // level取值：0：高 1：中 2：低 3：差
  levelDesc?: string;
  totalSent?: number;
  totalReceived?: number;
  totalSpam?: number;
  totalConversation?: number;
  totalInbox?: number; // 进对方收件箱总封数
  dailyData?: WarmUpDailyData[];

  filterDate?: number;
  filterProvider?: ProviderType;
  check?: boolean;
  disable?: boolean;
  score?: number;
  source?: 0 | 1; // 0 系统预热 1 客户预热
  totalCategories?: number;
  unavailable?: boolean;
  /**
   * 绑定用户来源，0: 开通普通多域名，1:旗舰版安心发
   */
  userType?: 0 | 1;
}
export interface WarmUpDailyData {
  date?: string;
  sent?: number;
  received?: number;
  spam?: number;
  categories?: number; // 策略文件夹, 页面对应其他文件夹
  others?: number; // 丢失邮件
  inbox?: number; // 进对方收件箱封数
}

export interface HostingSendLimit {
  autoSendLimit?: number;
  manualSendLimit?: number;
}
export interface FetchCustomerInfoRes {
  customerInfos: CustomerInfoModel[];
}

export interface FilterCrmClueContactsReq {
  emails: string[];
  filterExistedDomain: boolean;
  filterUnsubscribed: boolean;
}

export interface CheckEmailAddressReq {
  draftId: string;
  contacts: Array<Record<string, string>>;
  first: boolean;
  businessType?: string;
  useOrgQuota?: 0 | 1;
  businessMap?: BusinessMapModel | null;
  senderEmailInfos?: CheckEmailAddressInfo[];
}

export interface CheckEmailAddressInfo {
  email: string;
  // 0-主邮箱 1-别名邮箱 2-绑定邮箱
  type: number;
}

export interface CrmClueContact {
  email: string;
  existed: boolean;
}

export interface FilterCrmClueContactsRes {
  existedCount: number; // 存在数量
  unsubscribedCount: number; // 在退订列表里的数量
  illegalCount: number; // 非法地址数量
  availableCount: number; // 可用数量
}

export interface AddCrmClueContact {
  email: string;
  name: string;
  sourceName: string;
}

export interface AddCrmClueContactsReq {
  filterUnsubscribed: boolean;
  filterExistedDomain: boolean;
  edmEmailId: number;
  edmSubject: string;
  contacts: AddCrmClueContact[];
}

export interface GetBounceContentReq {
  edmEmailId: string;
  contactEmail: string;
  tid: string;
}

export interface GetSendedContentReq {
  edmEmailId: string;
  contactEmail: string;
}

export interface MarketingSuggestResItem {
  statsType: number;
  count: number;
  conditions: string;
}

export interface MarketingSuggestResGroups {
  groupId: string;
  groupName: string;
  items: MarketingSuggestResItem[];
  groupKey?: string;
}

export interface MarketingSuggestResMarketing {
  full: MarketingSuggestResItem[];
  groups: MarketingSuggestResGroups[];
}

export interface MarketingSuggestRes {
  available: boolean;
  marketing0?: MarketingSuggestResMarketing;
  marketing1?: MarketingSuggestResMarketing;
}

export interface CheckReplyEmailRes {
  thirdAlias: boolean;
}

export interface CustomerInfoModel {
  email: string;
  name: string;
  country: string;
  timezone: string;
  exist: boolean;
  localTime: string;
}
export interface FetchFilterConfigResp {
  checkConfigs?: Array<FilterConfig>;
}
export interface FilterModel {
  id?: number;
  name?: string;
  status?: number; // 0: 关  1: 开
  code?: string;
}

export interface FilterConfig {
  groupName?: string;
  filterItems: Array<FilterModel>;
}

export interface FetchHostingInfoReq {
  taskId: string;
  planId?: string;
}
export interface SaveHostingReq extends HostingContentReq {
  taskId?: string;
  operateType?: number; // 0-新建、1-重建、2-新增计划、3-修改计划
  multiHostingInfos?: Array<HostingInfo>;
  hostingInfo?: HostingInfo;
  relatedInfo?: {
    relatedId: string; // 对应智能营销透传的ruleId
    bindState: number; // 绑定状态，1-绑定
  };
}

export interface AutoRecInfo {
  products?: string;
  customerLocation?: string | string[][];
  customerProducts?: string;
}

export interface HostingInfo {
  planInfo?: Partial<HostingPlanModel>;
  mailInfos?: Array<HostingMailInfo>;
  syncSendEmail?: boolean;
  removeRecUser?: boolean; // 当修改自动获客推荐信息，界面弹框指定
  planMode?: 0 | 1; // 0手动获客 1自动获客
}

export interface HostingMailInfo {
  roundIndex?: number;
  edmRoundId?: string; // 轮次信息id，保存更新时，需携带；新建时传空即可
  sendSettingInfo?: Partial<SendSettingInfo>;
  contentEditInfo?: Partial<EdmContentInfo>;
  multipleContentInfo?: AIModifyParam;
  syncSendEmail?: boolean;

  // 拓展邮件
  mailType?: number; // 0: 默认, 1: 打开未回复
  expandHostingMailInfos?: Array<HostingMailInfo>;
  // 只给 千邮千面 做回显使用, 请勿用于其他用途 @hanxu
  plan?: Plan;
  placeHolderMail?: boolean;
  // expandHostingMailInfos?: Array<{
  //   edmRoundId: string;
  //   sendSettingInfo?: Partial<SendSettingInfo>;
  //   contentEditInfo?: Partial<EdmContentInfo>;
  //   multipleContentInfo?: AIModifyParam;
  //   mailType: number;
  // }>;
}

export interface PlanInfos {
  planId?: string;
  emailSize?: number;
  mailSelects?: Array<MailSelectType>;
}

export interface MailSelectType {
  round: number;
  mailType: number;
  name?: string;
}

export interface HostingContentReq {
  planInfos?: Array<PlanInfos>;
  company?: string;
  planMode?: 0 | 1; // 0手动获客 1自动获客
  // 计划名字, 原来planInfos里面的planName是模板名字  @hanxu 2023.07.20
  name?: string;
  createTime?: string;
  first: boolean;
  aiTaskId?: string;
  sender?: string;
  senderEmail?: string;
  senderEmails?: AiBaseInfoSenderEmails[] | string[];
  replyEmail?: string;

  // MARK: - AI写信需要的字段
  productIntros?: Array<string>;
  industry?: string;
  companyIntro?: string;
  language?: string;
  selectEmails?: Array<string>;

  ruleInfo?: BasicRuleInfo;
  autoMaxSendLimit?: number;
  manualMaxSendLimit?: number;
}

export interface PlanAiContents {
  index?: number;
  planInfo?: Partial<HostingPlanModel>;
  aiContentInfos?: Array<HostingContentInfo & Partial<EdmContentInfo>>;
}
export interface HostingContentResp {
  aiTaskId?: string;
  finishState?: number; // 0表示处理中，1标识处理完成，2标识处理失败，当出现2时，前端中断轮询
  // 服务端字段, 现在的业务只有单次请求, 所以这个数组只有会一个
  planAiContents?: Array<PlanAiContents>;
}
export interface HostingContentInfo {
  index?: number;
  content?: string;
  subject?: string;

  round?: number;
  mailType?: number;
}
export interface HostingReWriteReq {
  maxVersion?: number; // 最大版本数量，取/api/biz/edm/gpt/dynamic-config配置接口的hostingMaxVersion字段
  first: boolean;
  aiTaskId?: string | null;
  sentenceLists?: Array<HostingSentence>;
  languageLimit?: 0 | 1;
}

export interface HostingSentence {
  index: number;
  sentenceList?: SentenceModel[];
}

export interface HostingReWriteResp {
  aiTaskId?: string | null;
  finishState?: number;
  aiDynamicInfosList: Array<HostingReWriteDynamicInfo>;
}

export interface HostingReWriteDynamicInfo {
  index: number;
  aiDynamicInfos?: Array<AIModifyInfo>;
}

export interface EdmSendboxOperatesByEmailRes {
  sendNum: number;
  sendInfoList: {
    edmEmailId: string;
    edmSubject: string;
    emailSubject: string;
    sendAt: string;
    sendResult: boolean;
  }[];
  arriveNum: number;
  arriveInfoList: {
    arriveAt: string;
    edmEmailId: string;
    edmSubject: string;
    emailSubject: string;
  }[];
  readNum: number;
  readInfoList: {
    edmEmailId: string;
    edmSubject: string;
    readCount: number;
    recentReadAt: string;
  }[];
  replyNum: number;
  replyInfoList: {
    edmEmailId: string;
    replyAt: string;
    replyEmailInnerMid: string;
    replyEmailSubject: string;
  }[];
  unsubscribeNum: number;
  unsubscribeInfoList: {
    edmEmailId: string;
    edmSubject: string;
    emailSubject: string;
    sendAt: string;
  }[];
  productClickNum: number;
  productDetailList: {
    productId: string;
    productName: string;
    clickNum: number;
    stayTime: number;
    viewPosition: number;
  }[];
}

export interface UserGuideRecords {
  records: Array<{
    type: number | string;
    desc: string;
    finish: boolean;
  }>;
}

export interface EdmEmailContentAssistant {
  origin?: string;
  translate?: string;
  comment?: string;
  tags?: string[];
}

export interface EdmEmailContentAssistantTopic {
  subject?: string;
  desc?: string;
  tags?: string[];
  assistants?: EdmEmailContentAssistant[];
}

export interface EdmEmailContentAssistantGroup {
  moduleName?: string;
  topics?: EdmEmailContentAssistantTopic[];
}

export type EdmEmailContentAssistantResp = EdmEmailContentAssistantGroup[];

export interface EdmOperationTaskLabel {
  iconUrl?: string;
  desc?: string;
}

export interface EdmOperationTask {
  iconUrl?: string;
  subject?: string;
  desc?: string;
  superscript?: string;
  templateId?: string;
  emailSubject?: string;
  labels?: EdmOperationTaskLabel[];
}

export interface EdmOperationTasksResp {
  operationTasks?: EdmOperationTask[];
}

export interface EdmRewardTaskStateResp {
  taskType?: string;
  state: number; // -1-无权限、0-未参与、1-已参与、2-已结束、3-已奖励、4-活动不可见
  taskExpireTime?: string; // 活动结束时间
  expireTimestamp?: number; // 结束时间戳
  taskTtaskDisappearsTimeype?: string; // 参与活动用户按钮最终消失时间，默认为taskExpireTime + 7天
  disappearsTimestamp?: number; // 消失时间戳
  userSendCount?: number; // 当前用户发送量(已参与活动用户会有)
  rewardSendCount?: number; // 当前企业预计获赠的营销邮件量
  orgSendCount?: number; // 实际奖励数量：min(rewardSendCount， 5000)、企业共发送邮件营销数
  ruleType?: number; // state状态0~3会带有此字段，0：老规则 1：新规则
}

export interface EdmRewardTaskJoinResp {
  taskType?: string;
  state: number; // -1-无权限、0-未参与、1-已参与、2-已结束、3-已奖励、4-活动不可见
  rewardSendCount?: number; // 当前企业预计获赠的营销邮件量
  orgSendCount?: number; // 实际奖励数量：min(rewardSendCount， 5000)、企业共发送邮件营销数
}

export interface EdmSettingInputMemory {
  type: number;
  contents: string[];
}

export interface EdmSettingInputRec {
  memories: EdmSettingInputMemory[];
}

export interface BatchContactValidateResp {
  contactFileType: string;
  draftId: string;
}

export interface GPTDayLeft {
  dayLimit: number;
  dayLeft: number;
  aiContentDayLimit: number; // ai内容日限额
  aiContentDayLeft: number; // ai内容当日剩余次数
}

export interface BatchContactValidateReq {
  contactList: Array<{
    email: string;
  }>;
}

export interface validateEdmCcReq {
  ccInfos: Array<{ email: string }>;
}

export interface CronTimeZoneCountry {
  country: string;
  timeZoneList: Array<CronTimeZoneItem>;
}

export interface CronTimeZoneItem {
  timeZone: string;
  timeZoneDesc: string;
  defaultTimeZone: boolean;
}

export interface CronTimeZoneResponse {
  countryList: Array<CronTimeZoneCountry>;
}

export interface RequestSendBoxInfo {
  accId?: number;
  sendTime?: string;
  recentlyUpdateTime?: string;
  edmSubject?: string;
  emailStatus?: EmailStatus;
  page?: number;
  pageSize?: number;
  sendboxType?: number;
  /**
   * 最近打开
   */
  recentRead?: boolean;
  /**
   * 最近回复
   */
  recentReply?: boolean;
}

export interface EdmStatInfo {
  sendEdmCount: number;
  sendCount: number;
  sendRatio: number;
  arriveCount: number;
  arriveRatio: number;
  readCount: number;
  readRatio: number;
  replyCount: number;
  replyRatio: number;
  unsubscribeCount: number;
  unsubscribeRatio: number;
  productClickNum: number;
}

export enum ReplyTabEnum {
  AVAILABLE = 'AVAILABLE',
  CONCEAL = 'CONCEAL',
  UNAVAILABLE = 'UNAVAILABLE',
}

export enum SubjectId {
  sendRate = 1, // 送达率
  openRate = 2, // 打开率
  replyRate = 3, // 回复率
}

export interface SecondSendListInfo {
  edmEmailId: string;
  edmSubject: string;
  sendTime: string;
  sendTimeZone: string;
  emailStatus: number;
  emailThumbnail: string;
  recentlyUpdateTime: string;
  receiverCount: number;
  sendCount: number;
  arriveCount: number;
  readCount: number;
  replyCount: number;
  productClickNum: number;
  unsubscribeCount: number;
  sendboxType: number;
  sendType: number;
  isChild?: string;
  contactsCount?: number;
  recentReadCount?: number;
  recentReplyCount?: number;
}

// ai改写多版本信息
export interface MultipleContentInfo {
  emailContentId: string;
  aiDynamicInfos: Array<{
    originalSentence: string;
    aiSentenceList: Array<{
      aiSentence: string;
    }>;
    placeholder: string;
  }>;
}

export interface EdmEmailInfo {
  id: number | string;
  accId?: string;
  edmEmailId: string;
  edmSubject: string;
  emailSubject?: string;
  emailSubjects?: { subject: string }[];
  /**
   * 是否是安全发信
   */
  sendStrategyOn?: boolean;
  replyEmail?: string; // 回复地址
  senderEmail?: string; // 发件地址
  sendTime: string;
  sendTimeZone: string;
  /**
   * 时间相关
   * createTime：创建时间
      expectCompleteTime：预计完成时间
      completeTime：完成时间
   */
  createTime?: string;
  expectCompleteTime?: string;
  completeTime?: string;
  contactsCount?: number;

  sendboxType: 0 | 1 | 6; // 0:普通草稿 1:分批任务草稿 6: 大发信任务
  /**
   * 0待发送 1发送中 2发送成功 3发送失败 4已撤销 5垃圾邮件
   */
  emailStatus: number;
  emailThumbnail: string;
  recentlyUpdateTime: string;
  receiverCount: number;
  sendCount: number;
  arriveCount: number;
  readCount: number;
  readNum: number;
  replyCount: number;
  unsubscribeCount: number;
  traceLinks?: Array<{ traceUrl: string; traceId: string }>;
  traceCount?: number;
  titleLabel: boolean;
  push: boolean;
  ccInfos: { email: string }[];
  arriveRatio: string;
  readRatio: string;
  replyRatio: string;
  sendType: 0 | 1 | 2; // 0-试发送，1-立即发送，2-定时发送
  isDel: number;
  sendModeDesc?: string; // 任务发送模式:  精准发送 / 便捷发送
  batchId?: string | number;
  replyTab: ReplyTabEnum;
  /**
   * 邮件摘要
   */
  emailSummary?: string;
  failReason?: string;
  recentReadCount?: number;
  recentReplyCount?: number;
  /**
   * 二次营销列表
   */
  subList?: Array<SecondSendListInfo>;
  level?: 1 | 2; // 层级
  edmMode?: number;
  /**
   * 是否开启过托管营销，0 未开启
   */
  hostingStatus?: 0 | 1;
  /**
   * 千邮千面
   */
  multipleContentInfo?: MultipleContentInfo;
  /**
   * 多发件地址
   */
  senderMode?: 0 | 1;
  /**
   * 复制任务相关
   */
  rootCopyId?: string;
  copyId?: string;
}

export interface TimingSetModel {
  cronTime: string;
  cronTimeZone: string;
  sendTimeCountry: string;
}

export interface QuotaContactsModel {
  email: string;
  sourceName: string;
}

export interface QuotaReqModel {
  // emails: string[],
  contacts: QuotaContactsModel[];
  timingSet?: TimingSetModel;
}
export interface ResponseSendBoxInfo {
  accId: number;
  edmStatInfo: EdmStatInfo;
  sendboxList: Array<EdmEmailInfo>;
}

export interface ResponseSendBoxRecord {
  hasEdmRecord: boolean;
  hasPrivilege: boolean;
}

export interface ResponseSendBoxPageList {
  totalSize: number;
  sendboxList: Array<EdmEmailInfo>;
}

export interface RequestSendBoxDetail {
  edmEmailId: string | string;
  subject?: string;
  hideAutoReply?: boolean;
}

export interface RequsetAddBlackList {
  contactList: Array<{ email: string }>;
}
export interface RequestCircleSendBoxDetail {
  batchId: string;
  subject?: string;
  hideAutoReply?: boolean;
}

export interface RequestCustomerNewLabelByEmail {
  email_list: string[];
}

export interface ResponseCustomerNewLabelByEmail {
  company_name: string;
  contact_email: string;
  contact_id: string;
  contact_name: string;
  create_time: string;
  email_label: string;
  id: string;
  detail_id: string;
}

export interface BounceModel {
  contactEmail?: string;
  contactName?: string;
  date?: number;
  bounceReason?: string;
}
export interface ResponseSendBoxDetail {
  edmSendboxEmailInfo: EdmEmailInfo;
  contactInfoList: Array<ContatInfoForDetail>;
  bounceList: Array<BounceModel>;
  receiverList: Array<{ companyId?: string; contactEmail: string; contactName: string }>;
  sendList: Array<{ companyId?: string; contactEmail: string; conctatName: string; date: number | string; contactId: string }>;
  arriveList: Array<{ companyId?: string; contactId?: string; contactName: string; contactEmail: string; date: number | string }>;
  // 下面两个date的类型由number | string改为number了，目前没看到string的场景
  readList: Array<{
    coverEmail: string;
    contactEmail: string;
    date: number;
    readCount: number;
    time?: string;
  }>;
  replyList: Array<{
    companyId?: string;
    contactId?: string;
    contactName: string;
    contactEmail: string;
    date: number;
    replyCount: number;
    autoReply: boolean;
    time?: string;
  }>;
  unsubscribeList: Array<{ companyId?: string; contactId?: string; contactName: string; contactEmail: string; date: number | string }>;
  subscribeList: Array<{ companyId?: string; contactId?: string; contactName: string; contactEmail: string; date: number | string }>;
  traceLogList: Array<traceLogItem>;
  unArriveList: Array<{
    companyId?: string;
    contactEmail: string;
    contactId?: string;
    contactName?: string;
    date: number;
    failReason?: string;
  }>;
  unSendList: Array<{
    contactEmail: string;
    contactName?: string;
    date: number;
    failReason?: string;
  }>;
  multipleContentInfo?: MultipleContentInfo;
  unreadList?: traceLogItem[];
  unReplyList?: traceLogItem[];
  arriveUnReplyList?: traceLogItem[];
}
export interface RequestSyncContact {
  importContactList: Array<{
    clueBatch: number;
    email: string;
    name: string;
  }>;
}
export interface ResponseSyncContact {
  clue_total_cnt: number;
  clue_success_cnt: number;
  contact_total_cnt: number;
  contact_success_cnt: number;
  message: string;
}

export interface RemarketingDataSourceRes {
  unreadList?: traceLogItem[];
  unReplyList?: traceLogItem[];
  arriveUnReplyList?: traceLogItem[];
  multipleReadList?: traceLogItem[];
}
export interface traceLogItem {
  city: string;
  contactEmail: string;
  contactMaskEmail: string;
  contactName: string;
  continent: string;
  country: string;
  deviceInfo: string;
  id: string;
  operateDevice: string;
  operateTime: string;
  province: string;
  timeZone: string;
  timezoneOperateTime: string;
  traceId: string;
  traceUrl: string;
}

/**
 * arriveStatus:
 *  DEFAULT(0, "默认"),
    ENQUEUE(10, "发送到队列"),
    SEND_SUCCESS(20, "发送成功"),
    SEND_FAILED(21, "发送失败"),
    EMAIL_FILTER(22, "自动过滤"),
    SPAM(30, "垃圾邮件"),
    // 下面是邮件投递状态
    LOCAL_SUCCESS(100, "投递成功"),
    MAIL_ISOLATE(300, "邮件被隔离"),
    DENIED(400, "邮件被拒收"),
    IN_DELIVERY(1000, "进入投递队列");
 */
export interface ContatInfoForDetail {
  contactEmail: string;
  contactName: string;
  emailId: string;
  readCount: number;
  replyCount: number;
  unsubscribeCount: number;
  recentlyUpdateTime: string;
  replyEmailId?: string;
  autoReply?: boolean;
  arriveStatus?: number;
  failReason?: string;
  verifyStatus?: number;
}

export interface GPTReport {
  gptRecordId: string;
  type: number; // 1: ai写信 2: ai润色
}
export interface RequestGPTReport {
  edmEmailIds: string[];
  gptRecordInfo: GPTReport[];
}

export interface RequestOperateList {
  edmEmailId?: string;
  contactEmail: string;
  hideAutoReply?: boolean;
  parent?: boolean;
  batchId?: string;
}

export interface RequestOperateListV2 extends RequestOperateList {
  taskId: string;
  edmEmailIds?: string[];
}
export interface RequestReplyContent {
  mid: string;
  edmEmailId: string;
  operateId: string;
}
export interface ResponseOperateList {
  operateInfoList: Array<{
    id: number;
    contactEmail: string;
    operateName: string;
    operateTime: string;
    operateDevice: string;
  }>;
}

export interface ResponseOperateListV2 {
  data: Array<{
    planSubject: string;
    emailSubject: string;
    mid: string;
    edmEmailId: string;
    operateId: string;
    lastReplyTime: string;
  }>;
}

export interface RequestSendBoxDel {
  edmEmailIds: string;
}
export interface ResponseSendBoxDel {
  failedList: Array<string | number>;
}

export interface RequestEdmSingleAction {
  edmEmailId: string;
}
export interface ResponseSendBoxCopy {
  accId: number;
  edmEmailId: string;
  sendSettingInfo: SendSettingInfo;
  sendTime?: string;
  sendTimeZone?: string;
  contentEditInfo: EdmContentInfo;
  cronSendType: number; // 0 统一发送时间 1 当地发送时间
  receiverInfo: EdmReceiverInfo;
  todaySendCount: number;
  totalSendCount: number;
  availableSendCount: number;
  singleSendCount: number;
  push: boolean;
  edmMarkInfo: EdmMarkInfo;
  sendTimeCountry?: string;
  replyEdmEmailId?: string;
  secondSendInfo?: { saveInfos: Array<Partial<SecondSendStrategy>> };
  sendDomainLimit?: number;
  sendStrategyOn?: boolean;
  sendboxType: 0 | 1 | 6; // 0:普通草稿 1:分批任务草稿 6: 大发信任务
}

export interface SendBoxSender {
  email: string; // 邮箱地址
  level: number; // 0:高，1:中，2:低，3:差
  levelDesc: string;
  tagList: string[]; // 无法收信等
  spf1Status: number; // spf状态 0验证中 1验证成功 2验证失败
  dkimStatus: number; // dkim状态 0验证中 1验证成功 2验证失败
  dmarcStatus: number; // dmarc状态 0验证中 1验证成功 2验证失败
  check?: boolean;
  unavailable?: boolean;
  // 是否是ntesmail.com的赠送域名
  giftDomain?: boolean;
  /**
   * 绑定用户来源，0: 开通普通多域名，1:旗舰版安心发
   */
  userType?: 0 | 1;
}

export interface ResponseSendBoxSenderList {
  senderList: SendBoxSender[];
}

export interface ExpectSendDate {
  domain?: string;
  count: number;
}

export interface RequestExpectSendDate {
  sendDomainLimit?: number;
  domainStats: ExpectSendDate[];
}

export interface ResponseExpectSendDate {
  sendDate: string;
}

export interface SendSettingInfo {
  edmSubject: string;
  emailSubject: string;
  emailSubjects?: Array<{ subject: string }>;
  sender: string;
  replyEmail: string;
  ccInfos?: { email: string }[];
  ccReceivers?: boolean;
  sendTime?: string;
  sendTimeZone?: string;
  // 老版本只支持一个发件地址
  senderEmail?: string;
  // 新版本支持多发件地址, 用下面这个字段. 2023.09.20 @hanxu
  senderEmails?: string[] | AiBaseInfoSenderEmails[];
}

export enum EdmEmailType {
  CREATE_EMAIL = 0, // 新建邮件
  USE_TEMPLATE = 2, // 模板邮件
}

export interface EdmContentInfo {
  emailContent: string;
  emailAttachment?: string;
  emailType?: number; // 0-新建邮件，1-已发邮件，2-模板邮件
  templateId?: string;
  templateParams?: string;
  traceLinks?: Array<{ traceUrl: string }>;
  edmSendProductInfos?: Array<{ productId: string; productLink: string; siteId: string }>;
  emailReceipt: number; // 邮件回执
  originalEmailContentId?: string;
  subject?: string;
}
export interface EdmReceiverInfo {
  totalContactCount: number;
  unsubscribeCount: number;
  contactInfoList: Array<EdmSendConcatInfo>;
}

export interface InvalidEmailSimpleData {
  contactEmail: string;
  contactName?: string;
  reason: string;
}
export interface InvalidEmailData extends InvalidEmailSimpleData {
  key: string;
  contactEmail: string;
  contactName?: string;
  verifyStatus: number; // 0-无效，1-有效，2-未知
  verifyStatusList?: number[];
  reason: string;
  op?: string;
  sourceName?: string;
}
export interface EdmSendConcatInfo extends InvalidEmailSimpleData {
  valid: any;
  contactName: string;
  contactEmail: string;
  contactIcon?: string;
  // 0表示没有异常
  contactStatus?: number;
  // 新版本数据
  contactStatusList?: number[];
  // verifyStatus 字段对应的是 check 接口的数据, 1表示没有异常
  verifyStatus?: number;
  verifyStatusList?: number[];
  reason: string;
  companyName?: string;
  variableMap?: Record<string, string>;
  sourceName?: SourceNameType; // 收件人来源
  increaseSourceName?: string; // 添加来源
  originContactEmail?: string;
  _key?: string;
  // 是否逻辑删除, 用来做过滤展示页面的删除标记
  logicDelete?: boolean;
}

export interface ResponseEdmDraftList {
  edmDraftInfoList: Array<EdmDraftListItem>;
}

export interface EdmDraftListItem {
  draftId: string;
  edmSubject: string;
  editTime: string;
  currentStage: number;
  emailThumbnail: string;
  draftType: 0 | 1; // 0:普通草稿 1:分批草稿
}

export type EmailScoreStage = 'PRE' | 'COMPOSE' | 'END';

export interface EdmMarkInfo {
  email: string | null;
  id: string | null;
  limit: number | null;
  stage: EmailScoreStage | null;
}

export interface ResponseEdmDraftInfo {
  accId: number;
  draftId: string;
  currentStage: number;
  todaySendCount: number;
  totalSendCount: number;
  availableSendCount: number;
  singleSendCount: number;
  sendSettingInfo: SendSettingInfo;
  contentEditInfo: EdmContentInfo;
  secondSendInfo: { saveInfos: Array<SecondSendStrategy> };
  receiverInfo: EdmReceiverInfo & BatchFileReceiverInfo;
  contactFileType: BatchFileType;
  batchSendSetting: BatchSendSetting;
  markInfo: EdmMarkInfo;
  push: boolean;
  syncContact: boolean;
  clueBatch: number;
  replyEdmEmailId: null | string;
  sendDomainLimit?: number;
  sendStrategyOn?: boolean;
}

export interface RequestSaveDraft {
  draftId: string;
  currentStage: number;
  batchSendSetting?: Partial<BatchSendSetting>;
  sendSettingInfo?: Partial<SendSettingInfo>;
  contentEditInfo: Partial<EdmContentInfo>;
  secondSendInfo?: { saveInfos: Partial<SecondSendStrategy> };
  receiverInfo: {
    contacts?: Array<Record<string, string>>;
  };
  push: boolean;
  draftType: 0 | 1 | 6; // 0:普通草稿 1:分批草稿 6:大发信
  syncContact: boolean;
  syncSendEmail?: boolean;
  clueBatch: number;
  source?: string;
  replyEdmEmailId?: null | string;
  sendStrategyOn?: boolean;
  sendDomainLimit?: number;
  syncContactStoreClue?: boolean;
}

export interface BatchSendSetting {
  batchSize?: number;
  batchTime?: number;
  draftId?: string;
  sendHour?: number;
  sendMinute?: number;
  sendSecond?: number;
  sendTimeZone?: string;
  timeSetting?: boolean;
}

export interface ResponseUsedEmailList {
  usedEmailInfoList: Array<{
    id: string;
    usedEmailId: string;
    emailSubject: string;
    emailThumbnail: string;
  }>;
}

export interface ResponseContactsStatus {
  totalContactCount: number;
  unsubscribeCount: number;
  blacklistCount: number;
  sendLimitCount: number;
  contactInfoList: Array<EdmSendConcatInfo>;
  extraVariables: string[];
}

export interface ResponseReservedCount {
  todaySendCount: number; // 单日已发送数量
  totalSendCount: number; // 单日发件量限额
  availableSendCount: number; // 单日剩余可用发件量
  singleSendCount: number; // 单次发件量限制
  orgAvailableSendCount: number; // 企业剩余可用发件量
  sendCount: number; // 今日发信量
  privilegeUpgradeSendCount: number; // 推荐升级旗舰版单日发信数
}

export interface ResponseFilterCount {
  dayLeft: number; // 当前人今日剩余过滤数
  dayLimit: number;
  totalLeft: number; // 企业总剩余过滤数
  totalLimit: number;
}

export interface ResponseQuotaCount {
  needQuota: number; // //所需过滤次数
  dayQuotaEnough: boolean; // //日额度是否足够
  orgQuotaEnough: boolean; // 企业额度是否足够
}

export interface RequestSendDraft {
  draftId?: string;
  edmEmailId?: string;
  sendType?: number;
  edmSource?: string;
  sendStrategyOn?: boolean;
  secondSendInfo?: SecondSendInfo;
  batchSendSetting?: BatchSendSetting;
  sendSettingInfo: SendSettingInfo;
  contentEditInfo: EdmContentInfo;
  multipleContentInfo?: AIModifyParam;
  receiverInfo?: {
    contacts?: Array<Record<string, string>>;
    cronTime?: string;
    cronTimeZone?: string;
    trySendEmail?: { email: string };
    syncSchedule?: boolean;
    sendTimeCountry?: string;
    // 当地时间发送的时候, 传这个值
    cronLocalTime?: string;
  };
  push?: boolean;
  syncContact?: boolean;
  syncSendEmail?: boolean;
  clueBatch?: number;
  replyEdmEmailId?: string;
  sendDomainLimit?: number;
  syncContactStoreClue?: boolean;
  hostingInfo?: Record<'hostingTaskId' | 'hostingPlanId' | 'userGroupId', string>;
  /**
   * 复制相关
   */
  rootCopyId?: string;
  copyId?: string;
}

export interface AIModifyParam {
  emailContentId?: string;
  aiDynamicInfos?: Array<Partial<AIModifyInfo>>;
}

export interface ResponseSendDraft {
  edmEmailId: string;
  edmSubject: string;
  sendCount: number;
  hasRemarketing?: boolean;
}

export interface ResponseEdmTraceList {
  totalContactCount: number;
  contactInfoList: Array<TraceInfo>;
}

export interface ResponseEdmStatInfo {
  arriveCount: number;
  readCount: number;
  replyCount: number;
  unsubscribeCount: number;
}
export interface TraceInfo {
  contactEmail: string;
  contactName: string;
  emailId: string;
  sendCount: number;
  readCount: number;
  replyCount: number;
  unsubscribeCount: number;
  recentlyUpdateTime: string;
  replyEmailId: string;
  arriveCount: number;
  deliverTime: string;
}

export interface PageParam {
  pageSize: number;
  pageNum: number;
}
export interface SortableParams {
  sort: string;
}

export interface RequestAttachmentUploadToken {
  fileName: string;
  fileSize: number;
  md5: string;
}

export interface ResponseAttachmentUploadToken {
  bucketName: string;
  context: string;
  fileId: number;
  new: boolean;
  nosKey: string;
  token: string;
}

export interface RequestAttachmentFinishUpload {
  fileId: number;
  nosKey: string;
  fileSize?: number;
}

export interface ResponseAttachmentFinishUpload {
  downloadUrl: string;
  expireTime: number;
  fileName: string;
  fileSize: number;
  identity: string;
}

export interface RequestTraceLinkList {
  id?: string;
  edmEmailId: string;
  traceId?: string;
  pageSize?: number;
}

export interface ResponseTraceLinkItem {
  id: string;
  contactEmail: string;
  contactMaskEmail: string;
  contactName: string;
  operateTime: string;
  timezoneOperateTime: string;
  operateDevice: string;
  deviceInfo: string;
  timeZone: string;
  country: string;
  continent: string;
  province: string;
  city: string;
}

export interface ResponseTraceLinkInfo {
  edmEmailId: string;
  totalCount: number;
  totalNum: number;
}

export interface SensitiveWord {
  type: 'DANGER' | 'AVOID';
  word: string;
  equal_type: 'FULL_MATCH' | 'IGNORE_CASE';
  suggestWords?: Array<string>;
}

export interface ResponseSensitiveWords {
  sensitive_words: SensitiveWord[];
}

export interface RequestScoreEmail {
  draftId: string;
}

export interface RequestSendScoreEmail {
  content: string;
  id: string;
  subject: string;
  templateParams: string;
}

export interface RequestEmailScoreDetail {
  id: string;
}

export interface ResponseExportValidFailedContacts {
  download_url: string;
  file_name: string;
  size: number;
}

export interface ResponseExportArrivedFailed {
  download_url: string;
  file_name: string;
  size: number;
}
export interface RequestExportContactList {
  contactEmailKey: string;
  minArriveCount: number;
  minReadCount: number;
  minSendCount: number;
  page: number;
  pageSize: number;
  sort: string;
  traceStatus: number;
  sent?: boolean;
}

export interface RequestUpdateEdmEmailPush {
  edmEmailId: string;
  push: boolean;
}

export interface RequestEdmUnsubscribes {
  email: string;
  page: number;
  pageSize: number;
}

export interface EdmUnsubscribeItem {
  contactEmail: string;
  edmEmailId: string;
  edmSubject: string;
  unsubscribeDate: string;
}

export interface ResponseEdmUnsubscribes {
  unsubscribeList: EdmUnsubscribeItem[];
  totalSize: number;
}

export interface ResponseUploadBatchFileToValidate {
  draftId: string;
  contactFileType: BatchFileType;
  receiverInfo: BatchFileReceiverInfo;
}

export type BatchFileType = 'xlsx' | 'xls' | 'csv' | 'resend';

export interface BatchFileReceiverInfo {
  blacklistCount: number;
  invalidCount: number;
  repeatCount: number;
  totalContactCount: number;
  unsubscribeCount: number;
  validCount: number;
  contactInfoList: Array<{ contactEmail: string }>;
}

export interface ResponseCalculateBatchSendDates {
  batchSize: number;
  batchTime: number;
  dates: string[];
  draftId: string;
}

export interface ResQuotaList {
  page: number;
  pageSize: number;
  totalSize: number;
  totalQuota: number;
  totalUsed: number;
  expireAt: string;
  quotaAdminList: Array<QuotaForMember>;
}

export interface QuotaForMember {
  accId: string;
  createAt: string;
  dayQuota: number;
  defaultTotalQuota: boolean;
  editAt: string;
  email: string;
  name: string;
  singleQuota: number;
  totalQuota: number;
}

export interface ResponseArriveOperate {
  arriveInfoList: Array<{
    edmSubject: string;
    edmEmailId: string | number;
    emailSubject: string;
    arriveAt: string;
  }>;
}

export interface SubjectTagInfo {
  tagDesc?: string;
  tagId?: SubjectId;
}
export interface SubjectInfo {
  subject: string;
  tagList?: Array<SubjectTagInfo>;
  index?: number;
}
export interface ResponseDetailSubject {
  emailSubjects: Array<SubjectInfo>;
}
export interface ResponseSendOperate {
  sendInfoList: Array<{
    edmSubject: string;
    edmEmailId: string | number;
    emailSubject: string;
    sendAt: string;
    sendResult: string;
  }>;
}

export interface RequestExportValidFailedContacts {
  invalidContactList: Array<InvalidEmailSimpleData>;
}

export interface BusinessMapModel {
  taskId?: string;
}

export interface AiMarketingContact {
  contactName: string;
  contactEmail: string;
  sourceName?: string;
  increaseSourceName?: string;
}

export type DisplayModelOpenStatus = '' | 'hide' | 'close' | 'open';
export interface DisplayModel {
  v2?: EdmSendConcatInfo;
  check?: InvalidEmailData;
  // 是否选中
  checked?: boolean;

  // 明确不可用, 才叫 invalid
  invalid?: boolean;
  // 只要命中后端规则, 就是 exception
  exception?: boolean;
  // 标签展开状态
  openStatus?: DisplayModelOpenStatus;
  // 标签展开高度
  openHeight?: number;
}
