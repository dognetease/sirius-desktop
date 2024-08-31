import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class EdmUrl {
  /*
   * 外贸营销相关
   * */
  getSendBoxInfo: string = (host + config('getSendBoxInfo')) as string;

  getSendBoxAll: string = (host + config('getSendBoxAll')) as string;

  getMarketingStats: string = (host + config('getMarketingStats')) as string;

  getSendBoxRecord: string = (host + config('getSendBoxRecord')) as string;

  getSendBoxPageList: string = (host + config('getSendBoxPageList')) as string;

  setHostingStatus: string = (host + config('setHostingStatus')) as string;

  setAllHostingStatus: string = (host + config('setAllHostingStatus')) as string;

  getSendBoxAllPageList: string = (host + config('getSendBoxAllPageList')) as string;

  getCircleSendBoxPageList: string = (host + config('getCircleSendBoxPageList')) as string;

  getCircleSendBoxAllPageList: string = (host + config('getCircleSendBoxAllPageList')) as string;

  getSendBoxStatInfo: string = (host + config('getSendBoxStatInfo')) as string;

  getSendBoxAllStatInfo: string = (host + config('getSendBoxAllStatInfo')) as string;

  refreshSendBoxPageList: string = (host + config('refreshSendBoxPageList')) as string;

  refreshSendBoxAllPageList: string = (host + config('refreshSendBoxAllPageList')) as string;

  refreshCircleSendBoxPageList: string = (host + config('refreshCircleSendBoxPageList')) as string;

  refreshCircleSendBoxAllPageList: string = (host + config('refreshCircleSendBoxAllPageList')) as string;

  getSendBoxDetail: string = (host + config('getSendBoxDetail')) as string;

  getSendBoxDetailV2: string = (host + config('getSendBoxDetailV2')) as string;

  getParentDetail: string = (host + config('getParentDetail')) as string;

  addToBlackList: string = (host + config('addToBlackList')) as string;

  getCircleSendBoxDetail: string = (host + config('getCircleSendBoxDetail')) as string;

  getCustomerNewLabelByEmail: string = (host + config('getCustomerNewLabelByEmail')) as string;

  getCustomerExistEmail: string = (host + config('getCustomerExistEmail')) as string;

  syncContact: string = (host + config('syncContact')) as string;

  getOperateList: string = (host + config('getOperateList')) as string;

  getReadOperateList: string = (host + config('getReadOperateList')) as string;

  getReadOperateListAll: string = (host + config('getReadOperateListAll')) as string;

  getReplyOperateList: string = (host + config('getReplyOperateList')) as string;

  getReplyOperateListV2: string = (host + config('getReplyOperateListV2')) as string;

  getReplyContent: string = (host + config('getReplyContent')) as string;

  getPrivilegeReplyContent: string = (host + config('getPrivilegeReplyContent')) as string;

  getReplyOperateListAll: string = (host + config('getReplyOperateListAll')) as string;

  getDecryptEmail: string = (host + config('getDecryptEmail')) as string;

  getTraceLinkList: string = (host + config('getTraceLinkList')) as string;

  getTraceLinkInfo: string = (host + config('getTraceLinkInfo')) as string;

  delFromSendBox: string = (host + config('delFromSendBox')) as string;

  revertFromSendBox: string = (host + config('revertFromSendBox')) as string;

  copyFromSendBox: string = (host + config('copyFromSendBox')) as string;

  getArriveOperates: string = (host + config('getArriveOperates')) as string;

  getArriveOperatesAll: string = (host + config('getArriveOperatesAll')) as string;

  getDetailSubject: string = (host + config('getDetailSubject')) as string;

  getCycleDetailSubject: string = (host + config('getCycleDetailSubject')) as string;

  generateReport: string = (host + config('generateReport')) as string;

  queryReport: string = (host + config('queryReport')) as string;

  getSendBoxSenderList: string = (host + config('getSendBoxSenderList')) as string;

  getExpectSendDate: string = (host + config('getExpectSendDate')) as string;

  sendboxAnalysis: string = (host + config('sendboxAnalysis')) as string;

  /* 营销草稿 */
  getDraftList: string = (host + config('getDraftList')) as string;

  getDraftInfo: string = (host + config('getDraftInfo')) as string;

  delDraftByList: string = (host + config('delDraftByList')) as string;

  createDraft: string = (host + config('createDraft')) as string;

  saveDraft: string = (host + config('saveDraft')) as string;

  getEdmTraceList: string = (host + config('getEdmTraceList')) as string;

  getEdmTraceListAll: string = (host + config('getEdmTraceListAll')) as string;

  getEdmTraceStats: string = (host + config('getEdmTraceStats')) as string;

  getEdmTraceStatsAll: string = (host + config('getEdmTraceStatsAll')) as string;

  getEdmTraceStatsEmailList: string = (host + config('getEdmTraceStatsEmailList')) as string;

  getEdmTraceStatsEmailListAll: string = (host + config('getEdmTraceStatsEmailListAll')) as string;

  EdmReplyMark: string = (host + config('EdmReplyMark')) as string;

  EdmReplyMarkConfirm: string = (host + config('EdmReplyMarkConfirm')) as string;

  getUserGuideRecords: string = (host + config('getUserGuideRecords')) as string;

  getEmailContentAssistant: string = (host + config('getEmailContentAssistant')) as string;

  getRewardTaskState: string = (host + config('getRewardTaskState')) as string;

  getOperationTasksResp: string = (host + config('getOperationTasksResp')) as string;

  joinRewardTask: string = (host + config('joinRewardTask')) as string;

  setUserGuideRecord: string = (host + config('setUserGuideRecord')) as string;

  deleteEdmSettingInputRec: string = (host + config('deleteEdmSettingInputRec')) as string;

  fetchRemarketingContacts: string = (host + config('fetchRemarketingContacts')) as string;

  /** 发件流程 */
  getSendCount: string = (host + config('getSendCount')) as string;

  getFilterCount: string = (host + config('getFilterCount')) as string;

  getQuotaCheckCount: string = (host + config('getQuotaCheckCount')) as string;

  fetchWarmUpData: string = (host + config('fetchWarmUpData')) as string;

  getReceiverTemplate: string = (host + config('getReceiverTemplate')) as string;

  fetchSenderList: string = (host + config('fetchSenderList')) as string;

  fetchSenderListV2: string = (host + config('fetchSenderListV2')) as string;

  getEdmSettingInputRec: string = (host + config('getEdmSettingInputRec')) as string;

  getUsedEmailList: string = (host + config('getUsedEmailList')) as string;

  getUsedEmailInfo: string = (host + config('getUsedEmailInfo')) as string;

  getContactsStatus: string = (host + config('getContactsStatus')) as string;

  getContactsStatusV2: string = (host + config('getContactsStatusV2')) as string;

  uploadFileToValidate: string = (host + config('uploadFileToValidate')) as string;

  checkEmailAddress: string = (host + config('checkEmailAddress')) as string;

  deleteHostingPlan: string = (host + config('deleteHostingPlan')) as string;

  edmSendMail: string = (host + config('edmSendMail')) as string;

  edmSendSenderRoatateMail: string = (host + config('edmSendSenderRoatateMail')) as string;

  sendSenderRotateNormalMail: string = (host + config('sendSenderRotateNormalMail')) as string;

  edmNormalSendMail: string = (host + config('edmNormalSendMail')) as string;

  edmCronEdit: string = (host + config('edmCronEdit')) as string;

  emailContentUpload: string = (host + config('emailContentUpload')) as string;

  getEmailContent: string = (host + config('getEmailContent')) as string;

  contentPolish: string = (host + config('contentPolish')) as string;

  getAIRewriteConf: string = (host + config('getAIRewriteConf')) as string;

  generalHostingContent: string = (host + config('generalHostingContent')) as string;

  generalHostingReWriteContent: string = (host + config('generalHostingReWriteContent')) as string;

  getMultiAccount: string = host + config('getMultiAccount');

  multiAccountOverview: string = host + config('multiAccountOverview');

  saveHosting: string = (host + config('saveHosting')) as string;

  fetchHostingInfo: string = (host + config('fetchHostingInfo')) as string;

  fetchFilterConfig: string = (host + config('fetchFilterConfig')) as string;

  saveFilterConfig: string = (host + config('saveFilterConfig')) as string;

  fetchCustomerInfo: string = (host + config('fetchCustomerInfo')) as string;

  filterCrmClueContacts: string = (host + config('filterCrmClueContacts')) as string;

  addCrmClueContacts: string = (host + config('addCrmClueContacts')) as string;

  getBounceContent: string = (host + config('getBounceContent')) as string;

  getSendedContent: string = (host + config('getSendedContent')) as string;

  getMarketingSuggest: string = (host + config('getMarketingSuggest')) as string;

  fetchSendLimit: string = (host + config('fetchSendLimit')) as string;

  deleteEmailFromAddressBook: string = (host + config('deleteEmailFromAddressBook')) as string;

  getSendBoxConf: string = (host + config('getSendBoxConf')) as string;

  getTaskBrief: string = (host + config('getTaskBrief')) as string;

  getUnsubscribeUrl: string = (host + config('getUnsubscribeUrl')) as string;

  getDiagnosisDetail: string = (host + config('getDiagnosisDetail')) as string;

  checkReplyEmail: string = (host + config('checkReplyEmail')) as string;

  getSummaryInfo: string = (host + config('getSummaryInfo')) as string;

  getSummaryDomain: string = (host + config('getSummaryDomain')) as string;

  addHostingClueContacts: string = (host + config('addHostingClueContacts')) as string;

  /** 循环发信 */
  uploadBatchFileToValidate: string = (host + config('uploadBatchFileToValidate')) as string;

  calculateBatchSendDates: string = (host + config('calculateBatchSendDates')) as string;

  batchSendMail: string = (host + config('batchSendMail')) as string;

  getSensitiveWords: string = (host + config('getSensitiveWords')) as string;

  getScoreEmail: string = (host + config('getScoreEmail')) as string;

  sendScoreEmail: string = (host + config('sendScoreEmail')) as string;

  getEmailScoreDetail: string = (host + config('getEmailScoreDetail')) as string;

  exportValidFailedContacts: string = (host + config('exportValidFailedContacts')) as string;

  exportArrivedFailed: string = (host + config('exportArrivedFailed')) as string;

  exportContactList: string = (host + config('exportContactList')) as string;

  getExportContactState: string = (host + config('getExportContactState')) as string;

  downloadContactList: string = (host + config('downloadContactList')) as string;

  updateEdmEmailPush: string = (host + config('updateEdmEmailPush')) as string;

  exportValidFailedContactsV2: string = (host + config('exportValidFailedContactsV2')) as string;

  getEdmVerifyFilter: string = (host + config('getEdmVerifyFilter')) as string;

  /** 黑名单 */
  getEdmBlacklist: string = (host + config('getEdmBlacklist')) as string;

  getEdmNSBlacklist: string = (host + config('getEdmNSBlacklist')) as string;

  addEdmBlacklist: string = (host + config('addEdmBlacklist')) as string;

  addEdmNSBlacklist: string = (host + config('addEdmNSBlacklist')) as string;

  removeEdmBlacklist: string = (host + config('removeEdmBlacklist')) as string;

  removeEdmNSBlacklist: string = (host + config('removeEdmNSBlacklist')) as string;

  exportBlacklist: string = (host + config('exportBlacklist')) as string;

  exportNSBlacklist: string = (host + config('exportNSBlacklist')) as string;

  /** edm 退订列表 */
  getEdmUnsubscribes: string = (host + config('getEdmUnsubscribes')) as string;

  /** edm 配额 */
  getQuotaList: string = host + config('getQuotaList');

  getEdmUserUsed: string = host + config('getEdmUserUsed');

  setQuotaForEdmUser: string = host + config('setQuotaForEdmUser');

  /** edm ai写信 */
  gptEmailWrite: string = host + config('gptEmailWrite');

  gptEmailRetouch: string = (host + config('gptEmailRetouch')) as string;

  getGPTQuota: string = (host + config('getGPTQuota')) as string;

  reportGPTTask: string = (host + config('reportGPTTask')) as string;

  getGptConfig: string = (host + config('getGptConfig')) as string;

  getGPTAiContent: string = (host + config('getGPTAiContent')) as string;

  getGPTAiContentRefresh: string = (host + config('getGPTAiContentRefresh')) as string;

  doTranslateGPTAiContent: string = (host + config('doTranslateGPTAiContent')) as string;

  getGptRecord: string = (host + config('getGptRecord')) as string;

  getRewardTaskPopupInfo: string = (host + config('getRewardTaskPopupInfo')) as string;

  // ai营销托管
  getAiOverview: string = (host + config('getAiOverview')) as string;

  getAiDailyStats: string = (host + config('getAiDailyStats')) as string;

  getAiHostingPlans: string = (host + config('getAiHostingPlans')) as string;

  getAiHostingPlanList: string = (host + config('getAiHostingPlanList')) as string;

  updateContactPlan: string = (host + config('updateContactPlan')) as string;

  getAiHostingGroupList: string = (host + config('getAiHostingGroupList')) as string;

  createAiHostingGroup: string = (host + config('createAiHostingGroup')) as string;

  updateContactGroup: string = (host + config('updateContactGroup')) as string;

  addContactPlan: string = (host + config('addContactPlan')) as string;

  getLastBasicInfo: string = (host + config('getLastBasicInfo')) as string;

  getAiDailyDetail: string = (host + config('getAiDailyDetail')) as string;

  getReplayList: string = (host + config('getReplayList')) as string;

  getPlanList: string = (host + config('getPlanList')) as string;

  taskPlanSwitch: string = (host + config('taskPlanSwitch')) as string;

  setTaskSendLimit: string = (host + config('setTaskSendLimit')) as string;

  // saveAiHostingTask: string = host + config('saveAiHostingTask') as string;

  // getAiHostingTaskInfo: string = host + config('getAiHostingTaskInfo') as string;

  getAiHostingTaskList: string = (host + config('getAiHostingTaskList')) as string;

  aiTaskSwitch: string = (host + config('aiTaskSwitch')) as string;

  strategyInfo: string = (host + config('strategyInfo')) as string;

  strategySave: string = (host + config('strategySave')) as string;

  updateAiBaseInfo: string = (host + config('updateAiBaseInfo')) as string;

  getAiIndustryList: string = (host + config('getAiIndustryList')) as string;

  /** uni 相关接口 */

  uniEdmList: string = host + config('uniEdmList');

  uniEdmListFromContact: string = host + config('uniEdmListFromContact');

  uniIdToCompanyId: string = host + config('uniIdToCompanyId');

  /** 客户模块 */
  importRecord: string = (host + config('importRecord')) as string;

  addNewClient: string = (host + config('addNewClient')) as string;

  checkClientName: string = (host + config('checkClientName')) as string;

  checkEmailValid: string = (host + config('checkEmailValid')) as string;

  recommendList: string = (host + config('recommendList')) as string;

  clueRecommendList: string = (host + config('clueRecommendList')) as string;

  editCompany: string = (host + config('editCompany')) as string;

  editPerfectCompany: string = (host + config('editPerfectCompany')) as string;

  companyList: string = (host + config('companyList')) as string;

  companyMyList: string = (host + config('companyMyList')) as string;

  companyAllList: string = (host + config('companyAllList')) as string;

  companyForwardList: string = (host + config('companyForwardList')) as string;

  companySimpleList: string = (host + config('companySimpleList')) as string;

  batchAddCompany: string = (host + config('batchAddCompany')) as string;

  uploadClueDate: string = (host + config('uploadClueDate')) as string;

  initAllow: string = (host + config('initAllow')) as string;

  clueInitAllow: string = (host + config('clueInitAllow')) as string;

  getClientEmails: string = (host + config('getClientEmails')) as string;

  deleteCompany: string = (host + config('deleteCompany')) as string;

  getContactNums: string = (host + config('getContactNums')) as string;

  loadContactPerson: string = (host + config('loadContactPerson')) as string;

  uploadClientFile: string = (host + config('uploadClientFile')) as string;

  downLoadFailClient: string = (host + config('downLoadFailClient')) as string;

  downLoadFailClue: string = (host + config('downLoadFailClue')) as string;

  saveRecommendListInfo: string = (host + config('saveRecommendListInfo')) as string;

  clueSaveRecommendListInfo: string = (host + config('clueSaveRecommendListInfo')) as string;

  getCompanyDetail: string = (host + config('getCompanyDetail')) as string;

  getLabelListByPage: string = (host + config('getLabelListByPage')) as string;

  contactListPageById: string = (host + config('contactListPageById')) as string;

  batchExport: string = (host + config('batchExport')) as string;

  getLabelList: string = (host + config('getLabelList')) as string;

  deleteLabel: string = (host + config('deleteLabel')) as string;

  addLabel: string = (host + config('addLabel')) as string;

  editLabel: string = (host + config('editLabel')) as string;

  getCompanyByLabel: string = (host + config('getCompanyByLabel')) as string;

  searchCustomer: string = (host + config('searchCustomer')) as string;

  searchCustomerFromPersonalClue: string = (host + config('searchCustomerFromPersonalClue')) as string;

  searchCustomerFromClue: string = (host + config('searchCustomerFromClue')) as string;

  searchCustomerFromOpenSea: string = (host + config('searchCustomerFromOpenSea')) as string;

  getContactByLabel: string = (host + config('getContactByLabel')) as string;

  getCustomerContact: string = (host + config('getCustomerContact')) as string;

  getCustomerDetail: string = (host + config('getCustomerDetail')) as string;

  getSuggestionGlobalAi: string = (host + config('getSuggestionGlobalAi')) as string;

  getSuggestionAICount: string = (host + config('getSuggestionAICount')) as string;

  getSuggestionGlobalAiGenerate: string = (host + config('getSuggestionGlobalAiGenerate')) as string;

  getSuggestionGlobalAiQuery: string = (host + config('getSuggestionGlobalAiQuery')) as string;

  getCustomerScheduleList: string = (host + config('getCustomerScheduleList')) as string;

  getClueScheduleList: string = (host + config('getClueScheduleList')) as string;

  getBusinessScheduleList: string = (host + config('getBusinessScheduleList')) as string;

  getCompanyScheduleList: string = (host + config('getCompanyScheduleList')) as string;

  createCustomerSchedule: string = (host + config('createCustomerSchedule')) as string;

  createClueSchedule: string = (host + config('createClueSchedule')) as string;

  createBusinessSchedule: string = (host + config('createBusinessSchedule')) as string;

  createCompanySchedule: string = (host + config('createCompanySchedule')) as string;

  updateCustomerSchedule: string = (host + config('updateCustomerSchedule')) as string;

  updateClueSchedule: string = (host + config('updateClueSchedule')) as string;

  updateBusinessSchedule: string = (host + config('updateBusinessSchedule')) as string;

  updateCompanySchedule: string = (host + config('updateCompanySchedule')) as string;

  deleteCustomerSchedule: string = (host + config('deleteCustomerSchedule')) as string;

  deleteClueSchedule: string = (host + config('deleteClueSchedule')) as string;

  deleteBusinessSchedule: string = (host + config('deleteBusinessSchedule')) as string;

  deleteCompanySchedule: string = (host + config('deleteCompanySchedule')) as string;

  getCustomerOperateHistory: string = (host + config('getCustomerOperateHistory')) as string;

  openSeaOperateHistory: string = (host + config('openSeaOperateHistory')) as string;

  getSeaOperateHistory: string = (host + config('getSeaOperateHistory')) as string;

  getClueOperateHistory: string = (host + config('getClueOperateHistory')) as string;

  getCompanyOperateHistory: string = (host + config('getCompanyOperateHistory')) as string;

  getBusinessOperateHistory: string = (host + config('getBusinessOperateHistory')) as string;

  getCompanyOpenSeaOperateHistory: string = (host + config('getCompanyOpenSeaOperateHistory')) as string;

  getCustomerOperateDetail: string = (host + config('getCustomerOperateDetail')) as string;

  openSeaOperateDetail: string = (host + config('openSeaOperateDetail')) as string;

  getSeaOperateDetail: string = (host + config('getSeaOperateDetail')) as string;

  getCompanyOpenSeaOperateDetail: string = (host + config('getCompanyOpenSeaOperateDetail')) as string;

  getClueOperateDetail: string = (host + config('getClueOperateDetail')) as string;

  getCompanyOperateDetail: string = (host + config('getCompanyOperateDetail')) as string;

  getBusinessDetail: string = (host + config('getBusinessDetail')) as string;

  deleteCustomerLabels: string = (host + config('deleteCustomerLabels')) as string;

  forwardCustomer: string = (host + config('forwardCustomer')) as string;

  transferCustomerManager: string = (host + config('transferCustomerManager')) as string;

  transferClueManager: string = (host + config('transferClueManager')) as string;

  addCustomerManager: string = (host + config('addCustomerManager')) as string;

  addFollow: string = (host + config('addFollow')) as string;

  addClueFollow: string = (host + config('addClueFollow')) as string;

  addBusinessFollow: string = (host + config('addBusinessFollow')) as string;

  addCompanyFollow: string = (host + config('addCompanyFollow')) as string;

  companyCheckExport: string = (host + config('companyCheckExport')) as string;

  companyExport: string = (host + config('companyExport')) as string;

  businessCheckExport: string = (host + config('businessCheckExport')) as string;

  businessExport: string = (host + config('businessExport')) as string;

  getSendOperateList: string = (host + config('getSendOperateList')) as string;

  getSendOperateListAll: string = (host + config('getSendOperateListAll')) as string;

  getEdmSendboxOperatesByEmail: string = (host + config('getEdmSendboxOperatesByEmail')) as string;

  getFollowList: string = (host + config('getFollowList')) as string;

  getClueFollowList: string = (host + config('getClueFollowList')) as string;

  getBusinessFollowList: string = (host + config('getBusinessFollowList')) as string;

  getCompanyFollowList: string = (host + config('getCompanyFollowList')) as string;

  openSeaFollowList: string = (host + config('openSeaFollowList')) as string;

  customerOpenSeaFollowList: string = (host + config('customerOpenSeaFollowList')) as string;

  getClueDetail: string = (host + config('getClueDetail')) as string;

  getOpportunityDetail: string = (host + config('getOpportunityDetail')) as string;

  getOpportunityStages: string = (host + config('getOpportunityStages')) as string;

  getOpportunityCloseRecord: string = (host + config('getOpportunityCloseRecord')) as string;

  updateOpportunityStage: string = (host + config('updateOpportunityStage')) as string;

  deleteOpportunityContact: string = (host + config('deleteOpportunityContact')) as string;

  deleteCustomerContact: string = (host + config('deleteCustomerContact')) as string;

  deleteClueContact: string = (host + config('deleteClueContact')) as string;

  getContactEmails: string = (host + config('getContactEmails')) as string;

  openSeaContactEmails: string = (host + config('openSeaContactEmails')) as string;

  getClueContactEmails: string = (host + config('getClueContactEmails')) as string;

  getBusinessContactEmails: string = (host + config('getBusinessContactEmails')) as string;

  getCompanyContactEmails: string = (host + config('getCompanyContactEmails')) as string;

  getOpenSeaContactEmails: string = (host + config('getOpenSeaContactEmails')) as string;

  getEmailsContacts: string = (host + config('getEmailsContacts')) as string;

  openSeaEmailsContacts: string = (host + config('openSeaEmailsContacts')) as string;

  getClueEmailsContacts: string = (host + config('getClueEmailsContacts')) as string;

  getBusinessEmailsContacts: string = (host + config('getBusinessEmailsContacts')) as string;

  getCompanyEmailsContacts: string = (host + config('getCompanyEmailsContacts')) as string;

  getOpenSeaEmailsContacts: string = (host + config('getOpenSeaEmailsContacts')) as string;

  customerOpenSeaEmailsContacts: string = (host + config('customerOpenSeaEmailsContacts')) as string;

  customerOpenSeaContactEmails: string = (host + config('customerOpenSeaContactEmails')) as string;
  // whatsApp
  getWhatsAppQuota: string = (host + config('getWhatsAppQuota')) as string;

  reportWhatsAppOpportunity: string = (host + config('reportWhatsAppOpportunity')) as string;

  getWhatsAppOrderQuota: string = (host + config('getWhatsAppOrderQuota')) as string;

  pullWhatsAppContact: string = (host + config('pullWhatsAppContact')) as string;

  pullWhatsAppMessage: string = (host + config('pullWhatsAppMessage')) as string;

  sendWhatsAppMessage: string = (host + config('sendWhatsAppMessage')) as string;

  getWhatsAppTemplates: string = (host + config('getWhatsAppTemplates')) as string;

  getWhatsAppApprovedTemplates: string = (host + config('getWhatsAppApprovedTemplates')) as string;

  getWhatsAppTemplateDetail: string = (host + config('getWhatsAppTemplateDetail')) as string;

  getWhatsAppTemplateCategories: string = (host + config('getWhatsAppTemplateCategories')) as string;

  getWhatsAppTemplateLanguages: string = (host + config('getWhatsAppTemplateLanguages')) as string;

  getWhatsAppPublicTemplates: string = (host + config('getWhatsAppPublicTemplates')) as string;

  createWhatsAppTemplateDraft: string = (host + config('createWhatsAppTemplateDraft')) as string;

  updateWhatsAppTemplateDraft: string = (host + config('updateWhatsAppTemplateDraft')) as string;

  deleteWhatsAppTemplateDraft: string = (host + config('deleteWhatsAppTemplateDraft')) as string;

  submitWhatsAppTemplate: string = (host + config('submitWhatsAppTemplate')) as string;

  getWhatsAppJobTemplateLink: string = (host + config('getWhatsAppJobTemplateLink')) as string;

  extractWhatsAppJobReceiverFile: string = (host + config('extractWhatsAppJobReceiverFile')) as string;

  extractWhatsAppJobReceiverText: string = (host + config('extractWhatsAppJobReceiverText')) as string;

  createWhatsAppJob: string = (host + config('createWhatsAppJob')) as string;

  editWhatsAppJob: string = (host + config('editWhatsAppJob')) as string;

  deleteWhatsAppJob: string = (host + config('deleteWhatsAppJob')) as string;

  revertWhatsAppJob: string = (host + config('revertWhatsAppJob')) as string;

  getWhatsAppJobDetail: string = (host + config('getWhatsAppJobDetail')) as string;

  getWhatsAppJobs: string = (host + config('getWhatsAppJobs')) as string;

  getWhatsAppJobsStat: string = (host + config('getWhatsAppJobsStat')) as string;

  getWhatsAppJobReportReceivers: string = (host + config('getWhatsAppJobReportReceivers')) as string;

  getWhatsAppJobReportStat: string = (host + config('getWhatsAppJobReportStat')) as string;

  doWhatsAppAiSearch: string = (host + config('doWhatsAppAiSearch')) as string;

  exportWhatsAppAiSearchResult: string = (host + config('exportWhatsAppAiSearchResult')) as string;

  exportWhatsAppPhone: string = (host + config('exportWhatsAppPhone')) as string;

  getWhatsAppChatList: string = (host + config('getWhatsAppChatList')) as string;

  getWhatsAppChatListByIds: string = (host + config('getWhatsAppChatListByIds')) as string;

  getWhatsAppChatInitAround: string = (host + config('getWhatsAppChatInitAround')) as string;

  getWhatsAppMessageList: string = (host + config('getWhatsAppMessageList')) as string;

  getPersonalJobWhatsAppList: string = (host + config('getPersonalJobWhatsAppList')) as string;

  getPersonalJobWhatsAppDetail: string = (host + config('getPersonalJobWhatsAppDetail')) as string;

  getPersonalJobWhatsAppStatistic: string = (host + config('getPersonalJobWhatsAppStatistic')) as string;

  getPersonalJobWhatsAppDetailTable: string = (host + config('getPersonalJobWhatsAppDetailTable')) as string;

  getPersonalJobWhatsAppDetailExport: string = (host + config('getPersonalJobWhatsAppDetailExport')) as string;

  personalJobCreate: string = (host + config('personalJobCreate')) as string;

  personalJobUpdate: string = (host + config('personalJobUpdate')) as string;

  verifyWhatsappNumber: string = host + config('verifyWhatsappNumber');

  getSnsNosUploadToken: string = (host + config('getSnsNosUploadToken')) as string;

  getSnsNosDownloadUrl: string = (host + config('getSnsNosDownloadUrl')) as string;

  getCustomerListByWhatsAppId: string = (host + config('getCustomerListByWhatsAppId')) as string;

  getBindCompanyByWhatsAppId: string = (host + config('getBindCompanyByWhatsAppId')) as string;

  getPersonalWhatsappHistory: string = (host + config('getPersonalWhatsappHistory')) as string;

  getPersonalWhatsappHistoryAround: string = (host + config('getPersonalWhatsappHistoryAround')) as string;

  bindWhatsAppIdToCompany: string = (host + config('bindWhatsAppIdToCompany')) as string;

  getContactsByCompanyId: string = (host + config('getContactsByCompanyId')) as string;
  bspBindWhatsAppIdToCompany = host + config('bspBindWhatsAppIdToCompany');
  bspGetCBindCompanyByWhatsappId = host + config('bspGetCBindCompanyByWhatsappId');

  getPersonalMessageHistory: string = (host + config('getPersonalMessageHistory')) as string;

  getWhatsAppBusinessMessageContacts: string = (host + config('getWhatsAppBusinessMessageContacts')) as string;

  getWhatsAppBusinessMessageHistory: string = (host + config('getWhatsAppBusinessMessageHistory')) as string;

  getSenderList = host + config('getSenderList');

  addSender = host + config('addSender');

  deleteSender = host + config('deleteSender');

  updateSender = host + config('updateSender');

  updateSenderStatus = host + config('updateSenderStatus');

  queryBindStatus = host + config('queryBindStatus');

  getWhatsAppStatisticList = host + config('getWhatsAppStatisticList');

  getWhatsAppAllStatisticList = host + config('getWhatsAppAllStatisticList');

  getGlobalAreaForAISearch = host + config('getGlobalAreaForAISearch');

  getAllotList = host + config('getAllotList');

  getAllotPersonList = host + config('getAllotPersonList');

  addAllot = host + config('addAllot');

  deleteAllot = host + config('deleteAllot');

  getPersonalSenderList = host + config('getPersonalSenderList');

  getPersonalSenderListV2 = host + config('getPersonalSenderListV2');

  getPersonalContactList = host + config('getPersonalContactList');

  getPersonalMessageList = host + config('getPersonalMessageList');

  getPersonalRecentlyContactCount = host + config('getPersonalRecentlyContactCount');

  getPersonalRecentlyMessageCount = host + config('getPersonalRecentlyMessageCount');

  getBusinessContactList = host + config('getBusinessContactList');

  getBusinessMessageList = host + config('getBusinessMessageList');

  loginPersonalWA = host + config('loginPersonalWA');

  logoutPersonalWA = host + config('logoutPersonalWA');

  getWhatsAppAccountList = host + config('getWhatsAppAccountList');

  getWhatsAppAccountListV2 = host + config('getWhatsAppAccountListV2');

  getWhatsAppChatted = host + config('getWhatsAppChatted');

  getChannelList = host + config('getChannelList');

  addChannelQuota = host + config('addChannelQuota');

  getSubList = host + config('getSubList');

  updateChannelQuota = host + config('updateChannelQuota');

  unbindChannel = host + config('unbindChannel');

  getOperateLog = host + config('getOperateLog');
  getWhatsAppList = host + config('getWhatsAppList');
  recordExport = host + config('recordExport');
  waAccConfig = host + config('waAccConfig');
  waAccConfigEdit = host + config('waAccConfigEdit');
  getAllocationMode = host + config('getAllocationMode');
  updateAllocationMode = host + config('updateAllocationMode');
  getOperateLogDetail = host + config('getOperateLogDetail');
  getOperateLogType = host + config('getOperateLogType');
  addWAKeyword = host + config('addWAKeyword');
  deleteWAKeyword = host + config('deleteWAKeyword');
  getWAKeywordList = host + config('getWAKeywordList');
  getWAReddot = host + config('getWAReddot');
  addWaMarketingTask = host + config('addWaMarketingTask');
  marketTaskList = host + config('marketTaskList');
  marketTaskDetailList = host + config('marketTaskDetailList');
  marketTaskDetail = host + config('marketTaskDetail');
  marketTaskImportTemplate = host + config('marketTaskImportTemplate');
  marketTaskTemplateAnalyze = host + config('marketTaskTemplateAnalyze');
  getMarketChannelList = host + config('getMarketChannelList');
  getMarketSendList = host + config('getMarketSendList');
  getWAChannelContactList = host + config('getWAChannelContactList');
  maskVerifyWhatsappNumber = host + config('maskVerifyWhatsappNumber');
  getWaGPTQuota = host + config('getWaGPTQuota');
  getWaGPTConfig = host + config('getWaGPTConfig');
  getWaGPTMsg = host + config('getWaGPTMsg');
  getGroupQrCode = host + config('getGroupQrCode');
  getNewChannelId = host + config('getNewChannelId');
  reconnectGroupQrCode = host + config('reconnectGroupQrCode');
  logoutWa = host + config('logoutWa');
  createWaGroupTask = host + config('createWaGroupTask');
  groupHistoryKeywords = host + config('groupHistoryKeywords');
  getWaGroupList = host + config('getWaGroupList');
  getWaGroupNumberList = host + config('getWaGroupNumberList');

  getGroupTaskSummary = host + config('getGroupTaskSummary');
  getGroupTaskDetail = host + config('getGroupTaskDetail');
  getGroupTaskList = host + config('getGroupTaskList');
  checkJoinGroupResult = host + config('checkJoinGroupResult');
  getWaMultiSendQuota = host + config('getWaMultiSendQuota');

  // 个人 WA 管理
  getWaMgmtChannelList = host + config('getWaMgmtChannelList');
  getWaMgmtChannelId = host + config('getWaMgmtChannelId');
  getWaMgmtQrCode = host + config('getWaMgmtQrCode');
  getWaMgmtChatList = host + config('getWaMgmtChatList');
  sendWaMgmtImgByUrl = host + config('sendWaMgmtImgByUrl');
  logoutWaMgmt = host + config('logoutWaMgmt');
  getWaOrgStat = host + config('getWaOrgStat');
  getStatisticsList = host + config('getStatisticsList');
  getWaWorkload = host + config('getWaWorkload');
  getWaChannelAllList = host + config('getWaChannelAllList');

  // WhatsApp v2
  createWhatsAppJobV2 = host + config('createWhatsAppJobV2');
  deleteWhatsAppJobV2 = host + config('deleteWhatsAppJobV2');
  editWhatsAppJobV2 = host + config('editWhatsAppJobV2');
  getWhatsAppJobDetailV2 = host + config('getWhatsAppJobDetailV2');
  revertWhatsAppJobV2 = host + config('revertWhatsAppJobV2');
  getWhatsAppJobsV2 = host + config('getWhatsAppJobsV2');
  getWhatsAppJobsStatV2 = host + config('getWhatsAppJobsStatV2');
  getWhatsAppTemplatesV2 = host + config('getWhatsAppTemplatesV2');
  getWhatsAppTemplateCategoriesV2 = host + config('getWhatsAppTemplateCategoriesV2');
  getWhatsAppTemplateLanguagesV2 = host + config('getWhatsAppTemplateLanguagesV2');
  editWhatsAppTemplateDraftV2 = host + config('editWhatsAppTemplateDraftV2');
  deleteWhatsAppTemplateDraftV2 = host + config('deleteWhatsAppTemplateDraftV2');
  submitWhatsAppTemplateV2 = host + config('submitWhatsAppTemplateV2');
  getWhatsAppTemplateDetailV2 = host + config('getWhatsAppTemplateDetailV2');
  getWhatsAppApprovedTemplatesV2 = host + config('getWhatsAppApprovedTemplatesV2');
  getWhatsAppJobReportStatV2 = host + config('getWhatsAppJobReportStatV2');
  getWhatsAppJobReportReceiversV2 = host + config('getWhatsAppJobReportReceiversV2');
  getWhatsAppBSP = host + config('getWhatsAppBSP');
  getWhatsAppOrgStatusV2 = host + config('getWhatsAppOrgStatusV2');
  getWhatsAppTplStatusV2 = host + config('getWhatsAppTplStatusV2');
  createWhatsAppAppV2 = host + config('createWhatsAppAppV2');
  noticeWhatsAppRegisterFinishV2 = host + config('noticeWhatsAppRegisterFinishV2');
  getWhatsAppManagerPhones = host + config('getWhatsAppManagerPhones');
  getWhatsAppAllotPhones = host + config('getWhatsAppAllotPhones');
  getWhatsAppPhoneAllotAccounts = host + config('getWhatsAppPhoneAllotAccounts');
  getWhatsAppPhoneAllotSelect = host + config('getWhatsAppPhoneAllotSelect');
  allotWhatsAppPhoneToAccounts = host + config('allotWhatsAppPhoneToAccounts');
  recycleWhatsAppAllotPhone = host + config('recycleWhatsAppAllotPhone');
  getWhatsAppStatisticV2 = host + config('getWhatsAppStatisticV2');
  getWhatsAppQuotaV2 = host + config('getWhatsAppQuotaV2');
  getWhatsAppChatListV2 = host + config('getWhatsAppChatListV2');
  getWhatsAppChatListByIdsV2 = host + config('getWhatsAppChatListByIdsV2');
  getWhatsAppChatInitAroundV2 = host + config('getWhatsAppChatInitAroundV2');
  getWhatsAppMessageListV2 = host + config('getWhatsAppMessageListV2');
  getWhatsAppMessageListCRM = host + config('getWhatsAppMessageListCRM');
  getWhatsAppMessageListCRMAround = host + config('getWhatsAppMessageListCRMAround');
  sendWhatsAppMessageV2 = host + config('sendWhatsAppMessageV2');

  // facebook
  getFacebookPublicPageBriefList = host + config('getFacebookPublicPageBriefList');

  getFacebookChatList = host + config('getFacebookChatList');

  getFacebookMessageList = host + config('getFacebookMessageList');

  sendFacebookMessage = host + config('sendFacebookMessage');

  readFacebookMessage = host + config('readFacebookMessage');

  getFacebookExpiresAccount = host + config('getFacebookExpiresAccount');

  getAuthorizeUrl = host + config('getAuthorizeUrl');

  getBondAccount = host + config('getBondAccount');

  getFacebookPagesList = host + config('getFacebookPagesList');

  getPagesStatistic = host + config('getPagesStatistic');

  checkBindStatus = host + config('checkBindStatus');

  cancelBindAccount = host + config('cancelBindAccount');
  getPagePostList: string = (host + config('getPagePostList')) as string;

  getFbCommentList: string = (host + config('getFbCommentList')) as string;

  getFbChildCommmetList: string = (host + config('getFbChildCommmetList')) as string;

  replyPostComments: string = (host + config('replyPostComments')) as string;

  unReadCommentCount: string = (host + config('unReadCommentCount')) as string;

  getNotifyConfig = host + config('getNotifyConfig');

  updateNotifyConfig = host + config('updateNotifyConfig');

  getQuotaNotify = host + config('getQuotaNotify');

  getQuotaNotifyModal = host + config('getQuotaNotifyModal');

  buyersList: string = (host + config('buyersList')) as string;

  buyersAsyncList: string = (host + config('buyersAsyncList')) as string;

  getBuyersCount: string = (host + config('getBuyersCount')) as string;

  suppliersList: string = (host + config('suppliersList')) as string;

  suppliersAsyncList: string = (host + config('suppliersAsyncList')) as string;

  forwarderBuyersList: string = host + config('forwarderBuyersList');

  searchPeersList: string = host + config('searchPeersList');

  getBuyersListAsync: string = host + config('getBuyersListAsync');

  getPeersCompanyBase: string = host + config('getPeersCompanyBase');

  listAreaStatisticsRecord: string = host + config('listAreaStatisticsRecord');

  getFreightRelationCompany: string = host + config('getFreightRelationCompany');

  getFreightRelationCountry: string = host + config('getFreightRelationCountry');

  getAreaStatistics: string = host + config('getAreaStatistics');

  getTransportCompany: string = host + config('getTransportCompany');

  forwarderBuyersAsyncList: string = host + config('forwarderBuyersAsyncList');

  forwarderSuppliersList: string = host + config('forwarderSuppliersList');

  forwarderSuppliersAsyncList: string = host + config('forwarderSuppliersAsyncList');

  forwarderAirlineList: string = host + config('forwarderAirlineList');

  forwarderExcavateCompanyDetail = host + config('forwarderExcavateCompanyDetail');

  fissionRuleSave = host + config('fissionRuleSave');

  importCompanyFission = host + config('importCompanyFission');

  forwarderExcavateCompanyList = host + config('forwarderExcavateCompanyList');

  searchUserQuota = host + config('searchUserQuota');

  searchUserLog = host + config('searchUserLog');

  chineseBatchAddLeads = host + config('chineseBatchAddLeads');

  externalLinkQuery = host + config('externalLinkQuery');

  detailUseLog = host + config('detailUseLog');

  forwarderPortSuggest = host + config('forwarderPortSuggest');

  forwarderSearchTop = host + config('forwarderSearchTop');

  forwarderGetHotPorts = host + config('forwarderGetHotPorts');

  forwarderGetCommonlyUsePorts = host + config('forwarderGetCommonlyUsePorts');

  getSuppliersCount: string = (host + config('getSuppliersCount')) as string;

  customsCompanyList: string = (host + config('customsCompanyList')) as string;

  buyersBase: string = (host + config('buyersBase')) as string;

  globalBuyersFreight: string = (host + config('globalBuyersFreight')) as string;

  globalBuyersBase: string = (host + config('globalBuyersBase')) as string;

  buyersRecord: string = (host + config('buyersRecord')) as string;

  globalBuyersRecord: string = (host + config('globalBuyersRecord')) as string;

  buyersSuppliers: string = (host + config('buyersSuppliers')) as string;

  globalBuyersSuppliers: string = (host + config('globalBuyersSuppliers')) as string;

  buyersFreight: string = (host + config('buyersFreight')) as string;

  suppliersBase: string = (host + config('suppliersBase')) as string;

  globalSuppliersBase: string = (host + config('globalSuppliersBase')) as string;

  suppliersRecord: string = (host + config('suppliersRecord')) as string;

  globalSuppliersRecord: string = (host + config('globalSuppliersRecord')) as string;

  suppliersBuyers: string = (host + config('suppliersBuyers')) as string;

  fissioCompanyRelation: string = (host + config('fissioCompanyRelation')) as string;

  globalSuppliersBuyers: string = (host + config('globalSuppliersBuyers')) as string;

  suppliersRecordList: string = (host + config('suppliersRecordList')) as string;

  globalSuppliersRecordList: string = (host + config('globalSuppliersRecordList')) as string;

  buyersRecordList: string = (host + config('buyersRecordList')) as string;

  globalBuyersRecordList: string = (host + config('globalBuyersRecordList')) as string;

  suppliersFreight: string = (host + config('suppliersFreight')) as string;

  globalSuppliersFreight: string = (host + config('globalSuppliersFreight')) as string;

  customsUpdateTime: string = (host + config('customsUpdateTime')) as string;

  getCustomsCountry: string = (host + config('getCustomsCountry')) as string;

  getCustomsStateCountry: string = (host + config('getCustomsStateCountry')) as string;

  getBuyersCountry: string = (host + config('getBuyersCountry')) as string;

  getFollowCountry: string = (host + config('getFollowCountry')) as string;

  addFollowCountry: string = (host + config('addFollowCountry')) as string;

  customsDataUpdate: string = (host + config('customsDataUpdate')) as string;

  batchGetEdmEmail: string = (host + config('batchGetEdmEmail')) as string;

  deleteFollowCountry: string = (host + config('deleteFollowCountry')) as string;

  customDataGetContacts: string = host + config('customDataGetContacts');
  // customRecordList: string = host + config('customRecordList');
  // customsRecordCountryList: string = host + config('customsRecordCountryList');
  // customsRecordHscodeTree:string = host + config('customsRecordHscodeTree');
  // getEnableRecordPage:string = host + config('getEnableRecordPage');

  customRecordList: string = host + config('customRecordList');

  aiKeywordSearch: string = host + config('aiKeywordSearch');

  aiKeywordSearchQuota: string = host + config('aiKeywordSearchQuota');

  customsRecordCountryList: string = host + config('customsRecordCountryList');

  customsOldCountryList: string = host + config('customsOldCountryList');

  customsRecordHscodeTree: string = host + config('customsRecordHscodeTree');

  getEnableRecordPage: string = host + config('getEnableRecordPage');

  getIdsByCompanyList: string = host + config('getIdsByCompanyList');

  getChineseCompanyIdsByCompanyList: string = host + config('getChineseCompanyIdsByCompanyList');

  getCustomsDetailInfo: string = host + config('getCustomsDetailInfo');

  getSuppliersCountry: string = (host + config('getSuppliersCountry')) as string;

  customsAddClue: string = (host + config('customsAddClue')) as string;

  customsAddCustomer: string = (host + config('customsAddCustomer')) as string;

  customsTranslate: string = (host + config('customsTranslate')) as string;

  chromeTranslate: string = (host + config('chromeTranslate')) as string;

  customsHsCode: string = (host + config('customsHsCode')) as string;

  customsStarMark: string = (host + config('customsStarMark')) as string;

  readStarMarkUpdate: string = (host + config('readStarMarkUpdate')) as string;

  customsContact: string = (host + config('customsContact')) as string;

  fuzzyExcavate: string = (host + config('fuzzyExcavate')) as string;

  exactlyExcavate: string = (host + config('exactlyExcavate')) as string;

  globalSearchContact: string = (host + config('globalSearchContact')) as string;

  buyersStatistics: string = (host + config('buyersStatistics')) as string;

  globalBuyersStatistics: string = (host + config('globalBuyersStatistics')) as string;

  suppliersStatistics: string = (host + config('suppliersStatistics')) as string;

  globalSuppliersStatistics: string = (host + config('globalSuppliersStatistics')) as string;

  billOfLading: string = (host + config('billOfLading')) as string;

  deleteCustomsStarMark: string = (host + config('deleteCustomsStarMark')) as string;

  barTopSuppliers: string = (host + config('barTopSuppliers')) as string;

  barGlobalTopSuppliers: string = (host + config('barGlobalTopSuppliers')) as string;

  barTopBuyers: string = (host + config('barTopBuyers')) as string;

  globalBarTopBuyers: string = (host + config('globalBarTopBuyers')) as string;

  globalSearchAddCustomer = host + config('globalSearchAddCustomer');

  globalSearchAddClue = host + config('globalSearchAddClue');

  globalSearchGetHsCodeList = host + config('globalSearchGetHsCodeList');

  globalSearchDeepSearchContact = host + config('globalSearchDeepSearchContact');

  globalSearchNewDeepSearchContact = host + config('globalSearchNewDeepSearchContact');

  getGlobalRcmdList = host + config('getGlobalRcmdList');

  globalSearchDeepStatus = host + config('globalSearchDeepStatus');

  deepGrubCompanyDetail = host + config('deepGrubCompanyDetail');

  globalSearchDeepSearchCompany = host + config('globalSearchDeepSearchCompany');

  globalSearchContactPage = host + config('globalSearchContactPage');

  globalSearchCheckOpenProxy = host + config('globalSearchCheckOpenProxy');

  gloabalSearchGptRcmd = host + config('gloabalSearchGptRcmd');

  getSmartRcmdList = host + config('getSmartRcmdList');

  createSmartRcmd = host + config('createSmartRcmd');

  updateSmartRcmd = host + config('updateSmartRcmd');

  getSmartRcmdCompany = host + config('getSmartRcmdCompany');

  deleteSmartRcmd = host + config('deleteSmartRcmd');

  removeRcmdCompany = host + config('removeRcmdCompany');

  customsBatchGetEdmEmail: string = host + config('customsBatchGetEdmEmail');

  mkDirIfAbsent: string = (host + config('mkDirIfAbsent')) as string;

  companyCompare: string = (host + config('companyCompare')) as string;

  getBaseInfo: string = (host + config('getBaseInfo')) as string;

  getGlobalArea: string = (host + config('getGlobalArea')) as string;

  companyMerge: string = (host + config('companyMerge')) as string;

  contactEdit: string = (host + config('contactEdit')) as string;

  editClueContact: string = (host + config('editClueContact')) as string;

  editCompanyContact: string = (host + config('editCompanyContact')) as string;

  editBusinessContact: string = (host + config('editBusinessContact')) as string;

  contactAdd: string = (host + config('contactAdd')) as string;

  addClueContact: string = (host + config('addClueContact')) as string;

  addCompanyContact: string = (host + config('addCompanyContact')) as string;

  addBusinessContact: string = (host + config('addBusinessContact')) as string;

  clientTemplate: string = (host + config('clientTemplate')) as string;

  clueTemplate: string = (host + config('clueTemplate')) as string;

  csutomerDownloadTemplate: string = (host + config('csutomerDownloadTemplate')) as string;

  contactDetail: string = (host + config('contactDetail')) as string;

  getCustomerLabelByEmail: string = (host + config('getCustomerLabelByEmail')) as string;

  getCustomerLabelByEmailNew: string = (host + config('getCustomerLabelByEmailNew')) as string;

  getOpportunityByCompany: string = (host + config('getOpportunityByCompany')) as string;

  getOpportunityStatus: string = (host + config('getOpportunityStatus')) as string;

  // getClueStatus: string = (host + config('getClueStatus')) as string;

  getClueFieldInfo: string = (host + config('getClueFieldInfo')) as string;

  searchMyCustomer: string = (host + config('searchMyCustomer')) as string;

  searchMyCustomerAndContact: string = (host + config('searchMyCustomerAndContact')) as string;

  clueContactDetail: string = (host + config('clueContactDetail')) as string;

  companyContactDetail: string = (host + config('companyContactDetail')) as string;

  companyAddLabels: string = (host + config('companyAddLabels')) as string;

  companyCheckRules: string = (host + config('companyCheckRules')) as string;

  updateCompanyCheckRules: string = (host + config('updateCompanyCheckRules')) as string;

  judgeRepeat: string = (host + config('judgeRepeat')) as string;

  singleJudgeRepeat: string = (host + config('singleJudgeRepeat')) as string;

  batchJudgeRepeat: string = (host + config('batchJudgeRepeat')) as string;

  repeatList: string = (host + config('repeatList')) as string;

  judgeRepeatSearch: string = (host + config('judgeRepeatSearch')) as string;

  emailSuffixConfigList: string = (host + config('emailSuffixConfigList')) as string;

  emailSuffixConfigListUpdate: string = (host + config('emailSuffixConfigListUpdate')) as string;

  // customer-open-sea

  openSeaCustomerList: string = (host + config('openSeaCustomerList')) as string;

  openSCAllocate: string = (host + config('openSCAllocate')) as string;

  openSeaCustomerDelete: string = (host + config('openSeaCustomerDelete')) as string;

  openSeaCustomerDetail: string = (host + config('openSeaCustomerDetail')) as string;

  openSeaCustomerReceive: string = (host + config('openSeaCustomerReceive')) as string;

  openSeaCustomerValid: string = (host + config('openSeaCustomerValid')) as string;

  returnCustomerOpenSea: string = (host + config('returnCustomerOpenSea')) as string;

  returnCustomerOpenSeaRule: string = (host + config('returnCustomerOpenSeaRule')) as string;

  getManagerList: string = (host + config('getManagerList')) as string;

  addNewClue: string = (host + config('addNewClue')) as string;

  editClue: string = (host + config('editClue')) as string;

  myClueList: string = (host + config('myClueList')) as string;

  allClueList: string = (host + config('allClueList')) as string;

  clueDelete: string = (host + config('clueDelete')) as string;

  clueForceDelete: string = (host + config('clueForceDelete')) as string;

  existTransferCustomer: string = (host + config('existTransferCustomer')) as string;

  editClueStatus: string = (host + config('editClueStatus')) as string;

  clueBatchUpdate: string = (host + config('clueBatchUpdate')) as string;

  addOpportunity: string = (host + config('addOpportunity')) as string;

  editOpportunity: string = (host + config('editOpportunity')) as string;

  deleteOpportunity: string = (host + config('deleteOpportunity')) as string;

  batchDeleteOpportunity: string = (host + config('batchDeleteOpportunity')) as string;

  opportunityDetail: string = (host + config('opportunityDetail')) as string;

  opportunityList: string = (host + config('opportunityList')) as string;

  opportunityListAll: string = (host + config('opportunityListAll')) as string;

  opportunityStage: string = (host + config('opportunityStage')) as string;

  businessStages: string = (host + config('businessStages')) as string;

  contactListById: string = (host + config('contactListById')) as string;

  companyContactListById: string = (host + config('companyContactListById')) as string;

  businessContactListById: string = (host + config('businessContactListById')) as string;

  clueContactList: string = (host + config('clueContactList')) as string;

  clueCheckExport: string = (host + config('clueCheckExport')) as string;

  clueExport: string = (host + config('clueExport')) as string;

  changeTOCustomer: string = (host + config('changeTOCustomer')) as string;

  clueCloseRecordList: string = (host + config('clueCloseRecordList')) as string;

  getMainContactList: string = (host + config('getMainContactList')) as string;

  opportunityContactList: string = (host + config('opportunityContactList')) as string;

  opportunityContactListAll: string = (host + config('opportunityContactListAll')) as string;

  snapshotPreview: string = (host + config('snapshotPreview')) as string;

  openSeaSnapshotPreview: string = (host + config('openSeaSnapshotPreview')) as string;

  clueSnapshotPreview: string = (host + config('clueSnapshotPreview')) as string;

  businessSnapshotPreview: string = (host + config('businessSnapshotPreview')) as string;

  companySnapshotPreview: string = (host + config('companySnapshotPreview')) as string;

  openSeaCompanySnapshotPreview: string = (host + config('openSeaCompanySnapshotPreview')) as string;

  getNosUploadToken: string = (host + config('getNosUploadToken')) as string;

  finishUploadNos: string = (host + config('finishUploadNos')) as string;

  previewNosFile: string = (host + config('previewNosFile')) as string;

  syncDocument: string = (host + config('syncDocument')) as string;

  getCompanyDocuments = host + config('getCompanyDocuments');

  getClueDocuments = host + config('getClueDocuments');

  getBusinessDocuments = host + config('getBusinessDocuments');

  getOpenSeaDocuments = host + config('getOpenSeaDocuments');

  getCustomerOpenSeaDocuments = host + config('getCustomerOpenSeaDocuments');

  previewCompanyDocument = host + config('previewCompanyDocument');

  previewCustomerOpenSeaDocument = host + config('previewCustomerOpenSeaDocument');

  previewBusinessDocument = host + config('previewBusinessDocument');

  previewClueDocument = host + config('previewClueDocument');

  openSeaList: string = (host + config('openSeaList')) as string;

  openSeaReceive: string = (host + config('openSeaReceive')) as string;

  openSeaAllocate: string = (host + config('openSeaAllocate')) as string;

  openSeaDelete: string = (host + config('openSeaDelete')) as string;

  openSeaDetail: string = (host + config('openSeaDetail')) as string;

  returnOpenSea: string = (host + config('returnOpenSea')) as string;

  getCustomerAccount: string = (host + config('getCustomerAccount')) as string;

  openSeaValid: string = (host + config('openSeaValid')) as string;

  clueValid: string = (host + config('clueValid')) as string;

  opportunityValid: string = (host + config('opportunityValid')) as string;

  companyValid: string = (host + config('companyValid')) as string;

  // 插件相关
  extensionCaptureEmailList: string = (host + config('extensionCaptureEmailList')) as string;

  extensionCaptureEmailDelete: string = (host + config('extensionCaptureEmailDelete')) as string;

  extensionImportClue: string = (host + config('extensionImportClue')) as string;

  extensionWhiteList: string = (host + config('extensionWhiteList')) as string;

  extensionWhiteListAdd: string = (host + config('extensionWhiteListAdd')) as string;

  extensionWhiteListDelete: string = (host + config('extensionWhiteListDelete')) as string;

  // 数据迁移
  customerDMParse = (host + config('customerDMParse')) as string;

  customerDMValidField = (host + config('customerDMValidField')) as string;

  customerDMMaps = (host + config('customerDMMaps')) as string;

  customerDImportValid = (host + config('customerDImportValid')) as string;

  customerDMImport = (host + config('customerDMImport')) as string;

  customerDMDownloadFail = (host + config('customerDMDownloadFail')) as string;

  /** 产品权限 */
  getProductPrivilege: string = (host + config('getProductPrivilege')) as string;

  getEdmAccount = (host + config('getEdmAccount')) as string;

  getCurrentRoleInfo = (host + config('getCurrentRoleInfo')) as string;

  getRoleList = (host + config('getRoleList')) as string;

  getRoleDetail = (host + config('getRoleDetail')) as string;

  addOrRemoveRoleToAccount = (host + config('addOrRemoveRoleToAccount')) as string;

  addOrRemoveRole = (host + config('addOrRemoveRole')) as string;

  saveMembersToRole = (host + config('saveMembersToRole')) as string;

  getCurrentPrivilege = (host + config('getCurrentPrivilege')) as string;

  getAllPrivilege = host + config('getAllPrivilege');

  getVersion = (host + config('getVersion')) as string;

  getModulePrivilege = host + config('getModulePrivilege');

  getModuleDataRange = host + config('getModuleDataRange');

  savePrivilege = (host + config('savePrivilege')) as string;

  getMenuList = host + config('getMenuList');

  getMenuListV2 = host + config('getMenuListV2');
  getMenuListNew = host + config('getMenuListNew');

  getMenuWhitelist = host + config('getMenuWhitelist');

  getMenuSwitch = host + config('getMenuSwitch');

  getKfInfo = host + config('getKfInfo');

  getMenuVersion = host + config('getMenuVersion');

  setMenuListNew = host + config('setMenuListNew');

  showKfEntry = host + config('showKfEntry');

  saveMenuSetting = host + config('saveMenuSetting');

  saveMenuSettingV2 = host + config('saveMenuSettingV2');
  aiFloatEntrance = host + config('aiFloatEntrance');

  getUnreadCount = host + config('getUnreadCount');

  getEmailPanel = host + config('getEmailPanel');

  getWorktableArticleList = host + config('getWorktableArticleList');

  getWorkBenchKnowledgeList = host + config('getWorkBenchKnowledgeList');

  getWorkBenchCurrencyList = host + config('getWorkBenchCurrencyList');

  getWorkBenchExchangeRate = host + config('getWorkBenchExchangeRate');

  getWorkBenchCityList = host + config('getWorkBenchCityList');

  getWorkBenchCityInfo = host + config('getWorkBenchCityInfo');

  getEmployeePkList = host + config('getEmployeePkList');

  postWorkBenchNoticeIgnoreAll = host + config('postWorkBenchNoticeIgnoreAll');

  getWorkBenchNoticeList = host + config('getWorkBenchNoticeList');

  getEmployeePkMemberList = host + config('getEmployeePkMemberList');

  getUnreadMail = host + config('getUnreadMail');

  getContactMail = host + config('getContactMail');

  ignoreMailByMid = host + config('ignoreMailByMid');

  getPlayContext = host + config('getPlayContext');

  reportPlayTime = host + config('reportPlayTime');

  getWorktableSendCount = host + config('getWorktableSendCount');

  getCustomerPanel = host + config('getCustomerPanel');

  getAllCustomerPanel = host + config('getAllCustomerPanel');

  getFollowsPanel = host + config('getFollowsPanel');

  getAllFollowsPanel = host + config('getAllFollowsPanel');

  getSchedulePanel = host + config('getSchedulePanel');

  getAccountRange = host + config('getAccountRange');

  getEdmPanel = host + config('getEdmPanel');

  getAllEdmPanel = host + config('getAllEdmPanel');

  getEdmNotice = host + config('getEdmNotice');

  getSysUsageView = host + config('getSysUsageView');

  getMyStagePanel = host + config('getMyStagePanel');

  getAllStagePanel = host + config('getAllStagePanel');

  getGuideContent = host + config('getGuideContent');

  getOrdersWa = host + config('getOrdersWa');

  getAppUpgradeVersion = host + config('newUpgradeWeb');

  // 企业设置
  getFieldList = host + config('getFieldList');

  checkFieldOption = host + config('checkFieldOption');

  updateFieldOptions = host + config('updateFieldOptions');

  getVariableList = host + config('getVariableList');

  addVariable = host + config('addVariable');

  batchAddVariable = host + config('batchAddVariable');

  delVariabale = host + config('delVariabale');

  editVariable = host + config('editVariable');

  getVariableSystemList = host + config('getVariableSystemList');

  getSaleStageList = host + config('getSaleStageList');

  addStage = host + config('addStage');

  updateStage = host + config('updateStage');

  deleteStage = host + config('deleteStage');

  updateOrderList = host + config('updateOrderList');

  setDealStage = host + config('setDealStage');

  getEdmRuleList = host + config('getEdmRuleList');

  addEdmRule = host + config('addEdmRule');

  updateEdmRule = host + config('updateEdmRule');

  deleteEdmRule = host + config('deleteEdmRule');

  addMailTag = host + config('addMailTag');

  updateMailTag = host + config('updateMailTag');

  getEdmTagList = host + config('getEdmTagList');

  // 全球搜
  getLinkedInCompanySearch = host + config('getLinkedInCompanySearch');

  getLinkedInSearch = host + config('getLinkedInSearch');

  getNewLinkedInCompanySearch = host + config('getNewLinkedInCompanySearch');

  getFacebookCompanySearch = host + config('getFacebookCompanySearch');

  getLinkedInPersonSearchProduct = host + config('getLinkedInPersonSearchProduct');

  getLinkedInPersonSearchCompany = host + config('getLinkedInPersonSearchCompany');

  globalSearchList = host + config('globalSearchList');

  globalNewSearchList = host + config('globalNewSearchList');

  globalFeedbackResultQuery = host + config('globalFeedbackResultQuery');

  globalFeedbackTypeQuery = host + config('globalFeedbackTypeQuery');

  globalFeedbackReportAdd = host + config('globalFeedbackReportAdd');

  globalSearchGetContactById = host + config('globalSearchGetContactById');

  getLinkedInCountryList = host + config('getLinkedInCountryList');

  getCompanyRelationStatus = host + config('getCompanyRelationStatus');

  getCustomerInputLimit = host + config('getCustomerInputLimit');

  globalSearchContomFairList = host + config('globalSearchContomFairList');

  globalNewSearchContomFairList = host + config('globalNewSearchContomFairList');

  globalSearchGetDetail = host + config('globalSearchGetDetail');

  globalSearchGetSimilarCompany = host + config('globalSearchGetSimilarCompany');

  globalLabelSearch = host + config('globalLabelSearch');

  globalSearchKeywordsList = host + config('globalSearchKeywordsList');

  globalSearchKeywordsCreate = host + config('globalSearchKeywordsCreate');

  globalSearchKeywordsDelete = host + config('globalSearchKeywordsDelete');

  globalSearchKeywordsUpdate = host + config('globalSearchKeywordsUpdate');

  globalSearchReadSubList = host + config('globalSearchReadSubList');

  globalSearchReadCompanySubList = host + config('globalSearchReadCompanySubList');

  globalSearchMailSaleReacord = host + config('globalSearchMailSaleReacord');

  globalSearchDeepGrubStat = host + config('globalSearchDeepGrubStat');

  globalSearchDeepGrubStatAll = host + config('globalSearchDeepGrubStatAll');

  globalSearchDeepGrubStatAllV2 = host + config('globalSearchDeepGrubStatAllV2');

  globalSearchDeepGrubCompanyStat = host + config('globalSearchDeepGrubCompanyStat');

  globalBatchAddAddressBook = host + config('globalBatchAddAddressBook');

  globalBatchAddAddressBookV1 = host + config('globalBatchAddAddressBookV1');

  globalBatchAddLeadsV1 = host + config('globalBatchAddLeadsV1');

  globalSingleAddLeads = host + config('globalSingleAddLeads');

  customsSingleAddLeads = host + config('customsSingleAddLeads');

  batchAddEmailLeads = host + config('batchAddEmailLeads');

  linkedInbatchAddLeads = host + config('linkedInbatchAddLeads');

  globalSearchGetIdList = host + config('globalSearchGetIdList');

  globalSearchBrGetIdList = host + config('globalSearchBrGetIdList');

  globalSearchCantonfairGetIdList = host + config('globalSearchCantonfairGetIdList');

  globalBatchAddEdm = host + config('globalBatchAddEdm');

  batchEdmExposure = host + config('batchEdmExposure');

  customsBatchAddLeadsV1 = host + config('customsBatchAddLeadsV1');

  downloadCompanyImportTemplate = host + config('downloadCompanyImportTemplate');

  importCompanyByFile = host + config('importCompanyByFile');

  getImportCompanyStat = host + config('getImportCompanyStat');

  viewImportCompany = host + config('viewImportCompany');

  deleteImportCompany = host + config('deleteImportCompany');

  clearUnmatchedImportCompany = host + config('clearUnmatchedImportCompany');

  collectImportCompany = host + config('collectImportCompany');

  listImportCompany = host + config('listImportCompany');

  searchKeywordsRecommendTip = host + config('searchKeywordsRecommendTip');

  searchSettings = host + config('searchSettings');

  searchTextCheck = host + config('searchTextCheck');

  leadsContactBulkAdd = host + config('leadsContactBulkAdd');

  globalEmailCheckCallback = host + config('globalEmailCheckCallback');

  globalSearchStat = host + config('globalSearchStat');

  saveGoogleData = host + config('saveGoogleData');

  saveLbsChineseData = host + config('saveLbsChineseData');

  createCollectByCompanyId = host + config('createCollectByCompanyId');

  deleteCollectById = host + config('deleteCollectById');

  getCollectList = host + config('getCollectList');

  listCollectLog = host + config('listCollectLog');

  queryFissionRule = host + config('queryFissionRule');

  listFissionCompany = host + config('listFissionCompany');

  listWaPage = host + config('listWaPage');

  listWaCountry = host + config('listWaCountry');

  updateCollect = host + config('updateCollect');

  getGlobalSearchCountryList = host + config('getGlobalSearchCountryList');

  getGlobalSearachGetMenuAuth = host + config('getGlobalSearachGetMenuAuth');

  getContomfairSearchCatalog = host + config('getContomfairSearchCatalog');

  getEmailGuessResult = host + config('getEmailGuessResult');

  saveEmailGuessValid = host + config('saveEmailGuessValid');

  getCustomsPortList = host + config('getCustomsPortList');

  getCustomsHotPortList = host + config('getCustomsHotPortList');

  getCustomsStat = host + config('getCustomsStat');

  addCustomsCollect = host + config('addCustomsCollect');

  deleteCustomsCollect = host + config('deleteCustomsCollect');

  globalSearchGetSugget = host + config('globalSearchGetSugget');

  customsGetSuggest = host + config('customsGetSuggest');

  doGetCompanyExists = host + config('doGetCompanyExists');

  getNewSubAuth = host + config('getNewSubAuth');

  globalSearchIgnoreCompany = host + config('globalSearchIgnoreCompany');

  globalSearchRemoveIgnoreCompany = host + config('globalSearchRemoveIgnoreCompany');

  getSubCompanyFallList = host + config('getSubCompanyFallList');

  updateSubCompany = host + config('updateSubCompany');

  doGetCompanyExistsDemo = host + config('doGetCompanyExistsDemo');

  doAddCustomsDeepTask = host + config('doAddCustomsDeepTask');

  doGetCustomsDeepTask = host + config('doGetCustomsDeepTask');

  doGetGlobalTaskInfo = host + config('doGetGlobalTaskInfo');
  // 图片
  uploadEdmImage: string = (host + config('uploadEdmImage')) as string;

  delEdmImage: string = (host + config('delEdmImage')) as string;

  getAttachmentToken: string = (host + config('getAttachmentToken')) as string;

  attachmentFinishUpload: string = (host + config('attachmentFinishUpload')) as string;

  getRecommandSubject: string = (host + config('getRecommandSubject')) as string;

  getClueTagList: string = (host + config('getClueTagList')) as string;

  getOpenSeaTagList: string = (host + config('getOpenSeaTagList')) as string;

  getOpportunityTagList: string = (host + config('getOpportunityTagList')) as string;

  getCustomerOpenSeaTagList: string = (host + config('getCustomerOpenSeaTagList')) as string;

  getBrCountry: string = (host + config('getBrCountry')) as string;

  getBrSearchResult: string = (host + config('getBrSearchResult')) as string;

  getBrEcharQuery: string = (host + config('getBrEcharQuery')) as string;

  getBrTableData: string = (host + config('getBrTableData')) as string;

  // 老客相关
  getCustomerAutoTaskList: string = host + config('getCustomerAutoTaskList');

  // 邮件授权相关
  createAuth: string = host + config('createAuth');

  getCustomerAuthList: string = host + config('getCustomerAuthList');

  getCustomerAuthHistoryList: string = host + config('getCustomerAuthHistoryList');

  getCustomerAuthGrantRecords: string = host + config('getCustomerAuthGrantRecords');

  passAuth: string = host + config('passAuth');

  rejectAuth: string = host + config('rejectAuth');

  passAuthResource: string = host + config('passAuthResource');

  rejectAuthResource: string = host + config('rejectAuthResource');

  getAuthWhiteList: string = host + config('getAuthWhiteList');

  addAuthWhitelist: string = host + config('addAuthWhitelist');

  removeAuthWhitelist: string = host + config('removeAuthWhitelist');

  getCustomerManualTaskList: string = host + config('getCustomerManualTaskList');

  getRegularCustomerList: string = host + config('getRegularCustomerList');

  getRegularCustomerListAll: string = host + config('getRegularCustomerListAll');

  getRegularCustomerDetail: string = host + config('getRegularCustomerDetail');

  addManualTask: string = host + config('addManualTask');

  deleteManualTask: string = host + config('deleteManualTask');

  suspendManualTask: string = host + config('suspendManualTask');

  restartManualTask: string = host + config('restartManualTask');

  changeCustomerTaskStatus: string = host + config('changeCustomerTaskStatus');

  unFinishCustomerTask: string = host + config('unFinishCustomerTask');

  changeValidFlag: string = host + config('changeValidFlag');

  syncClue: string = host + config('syncClue');

  assignClue: string = host + config('assignClue');

  syncOpenSea: string = host + config('syncOpenSea');

  syncCustomer: string = host + config('syncCustomer');

  getRegularCustomerEmailList: string = host + config('getRegularCustomerEmailList');

  getRegularCustomerEmailTag: string = host + config('getRegularCustomerEmailTag');

  getRegularCustomerEmailContact: string = host + config('getRegularCustomerEmailContact');

  previewRegularCustomerEmail: string = host + config('previewRegularCustomerEmail');

  getAuthManagerList: string = host + config('getAuthManagerList');

  getRegularCustomerMenuData: string = host + config('getRegularCustomerMenuData');

  getPrivilegeMenuData: string = host + config('getPrivilegeMenuData');

  getRuleRecommendKeyword: string = host + config('getRuleRecommendKeyword');

  getRuleViewPermissionList: string = host + config('getRuleViewPermissionList');

  getRuleViewPermissionPage: string = host + config('getRuleViewPermissionPage');

  changeRuleViewPermission: string = host + config('changeRuleViewPermission');

  getAutoTaskRule: string = host + config('getAutoTaskRule');

  changeAutoTaskStatus: string = host + config('changeAutoTaskStatus');

  getRecommendTaskInfo: string = host + config('getRecommendTaskInfo');

  synCustomerStatus: string = host + config('synCustomerStatus');

  // 客户公海设置
  getOpenSeaSetting: string = host + config('getOpenSeaSetting');

  updateOpenSeaSetting: string = host + config('updateOpenSeaSetting');

  getEdmCronTimezone: string = host + config('getEdmCronTimezone');

  notSaveDraft: string = host + config('notSaveDraft');

  // 客户邮件
  getCustomerMail: string = (host + config('getCustomerMail')) as string;

  // 下属邮件
  getSubordinateMail: string = (host + config('getSubordinateMail')) as string;

  // 客户邮件未读数
  getCustomerMailUnread: string = (host + config('getCustomerMailUnread')) as string;

  // 确认是否存在
  checkTpMailExist: string = (host + config('checkTpMailExist')) as string;

  // 获取客户、下属邮件详情
  readTpMessage: string = (host + config('readTpMessage')) as string;

  // 获取客户、下属邮件图片、附件链接
  getTpMailPart: string = (host + config('getTpMailPart')) as string;

  // 获取客户、下属邮件预览链接
  getTpMailPreview: string = (host + config('getTpMailPreview')) as string;

  transferAttachment: string = (host + config('transferAttachment')) as string;

  // 获取邮件分发，详情
  getDeliveryDetail: string = (host + config('getDeliveryDetail')) as string;

  // 邮件+
  getCustomerByEmail: string = (host + config('getCustomerByEmail')) as string;

  updatePartialCompany: string = (host + config('updatePartialCompany')) as string;

  updatePartialClue: string = (host + config('updatePartialClue')) as string;

  updatePartialContact: string = (host + config('updatePartialContact')) as string;

  validateEdmCc: string = host + config('validateEdmCc');

  batchContactValidate: string = host + config('batchContactValidate');

  // 自动化营销
  editAutoMarketTask: string = (host + config('editAutoMarketTask')) as string;

  getAutoMarketCustomerUpdateFields: string = (host + config('getAutoMarketCustomerUpdateFields')) as string;

  getAutoMarketTaskList = (host + config('getAutoMarketTaskList')) as string;

  getAutoMarketTaskDetail = (host + config('getAutoMarketTaskDetail')) as string;

  getAutoMarketTaskStats = (host + config('getAutoMarketTaskStats')) as string;

  deleteAutoMarketTaskDetail = (host + config('deleteAutoMarketTaskDetail')) as string;

  updateAutoMarketTaskStatus = (host + config('updateAutoMarketTaskStatus')) as string;

  getAutoMarketTaskByGroup = (host + config('getAutoMarketTaskByGroup')) as string;

  getAutoMarketHolidayInfo = (host + config('getAutoMarketHolidayInfo')) as string;

  setTaskTemplateStatus = host + config('setTaskTemplateStatus');

  saveByTemplate = host + config('saveByTemplate');

  getAutomarketTemplateList = host + config('getAutomarketTemplateList');

  // 地址簿
  getAddressBookContacts = host + config('getAddressBookContacts');

  deleteAddressBookContacts = host + config('deleteAddressBookContacts');

  returnAddressBookContactsToOpenSea = host + config('returnAddressBookContactsToOpenSea');

  getAddressBookGroups = host + config('getAddressBookGroups');

  postAddressBookGroupTop = host + config('postAddressBookGroupTop');

  getAddressBookGroupDetail = host + config('getAddressBookGroupDetail');

  deleteAddressBookGroup = host + config('deleteAddressBookGroup');

  updateAddressBookGroupName = host + config('updateAddressBookGroupName');

  getAddressBookSources = host + config('getAddressBookSources');

  addAddressBookAutoGroup = host + config('addAddressBookAutoGroup');

  editAddressBookAutoGroup = host + config('editAddressBookAutoGroup');

  removeAddressContactsFromGroup = host + config('removeAddressContactsFromGroup');

  checkAddressBookLxContactsHasSync = host + config('checkAddressBookLxContactsHasSync');

  scanAddressBookContactsFromLxContacts = host + config('scanAddressBookContactsFromLxContacts');

  importAddressBookContactsFromLxContacts = host + config('importAddressBookContactsFromLxContacts');

  addressBookGetMarketGroups = host + config('addressBookGetMarketGroups');

  getContactsByGroupId = host + config('getContactsByGroupId');

  getImportHistoryList = host + config('getImportHistoryList');

  getPublicHistoryList = host + config('getPublicHistoryList');

  getAddressRecycleList = host + config('getAddressRecycleList');

  removeRecycle = host + config('removeRecycle');

  reviveRecycle = host + config('reviveRecycle');

  addressBookTemplate = host + config('addressBookTemplate');

  addNewGroup = host + config('addNewGroup');

  uploadContactsByPaste = host + config('uploadContactsByPaste');

  uploadContactsByFile = host + config('uploadContactsByFile');

  addressBookSearchContacts = host + config('addressBookSearchContacts');

  addressBookGetContactById = host + config('addressBookGetContactById');

  getMemberList = host + config('getMemberList');

  getImportSelectList = host + config('getImportSelectList');

  addressBookAdd2Recycle = host + config('addressBookAdd2Recycle');

  addressBookAddContact2Group = host + config('addressBookAddContact2Group');

  addressBookContactTransfer = host + config('addressBookContactTransfer');

  addressBookBatchAddGroup = host + config('addressBookBatchAddGroup');

  addressBookOpenSeaTemplate = host + config('addressBookOpenSeaTemplate');

  addressBookOpenSeaFileImport = host + config('addressBookOpenSeaFileImport');

  addressBookOpenSeaTextImport = host + config('addressBookOpenSeaTextImport');

  addressBookOpenSeaList = host + config('addressBookOpenSeaList');

  addressBookOpenSeaDetail = host + config('addressBookOpenSeaDetail');

  addressBookOpenSeaReceive = host + config('addressBookOpenSeaReceive');

  addressBookOpenSeaReceiveNew = host + config('addressBookOpenSeaReceiveNew');

  addressBookOpenSeaAssign = host + config('addressBookOpenSeaAssign');

  addressBookOpenSeaDelete = host + config('addressBookOpenSeaDelete');

  addressBookOpenSeaReturnRecordList = host + config('addressBookOpenSeaReturnRecordList');

  getAddressMembers = host + config('getAddressMembers');

  addressBookUpdateContact = host + config('addressBookUpdateContact');

  addContact2AddressBook = host + config('addContact2AddressBook');

  getAddressGroupList = host + config('getAddressGroupList');

  getAddressOriginList = host + config('getAddressOriginList');

  IAddContact2AddressBookReq = host + config('IAddContact2AddressBookReq');

  addressBookGetGroupRule = host + config('addressBookGetGroupRule');

  getEdmMarketingData = host + config('getEdmMarketingData');

  addressBookGetEmailList = host + config('addressBookGetEmailList');

  // 地址簿黑名单
  addressBookGetEdmBlacklist: string = (host + config('addressBookGetEdmBlacklist')) as string;

  addressBookGetEdmNSBlacklist: string = (host + config('addressBookGetEdmNSBlacklist')) as string;

  addressBookAddEdmBlacklist: string = (host + config('addressBookAddEdmBlacklist')) as string;

  addressBookAddEdmNSBlacklist: string = (host + config('addressBookAddEdmNSBlacklist')) as string;

  addressBookRemoveEdmBlacklist: string = (host + config('addressBookRemoveEdmBlacklist')) as string;

  addressBookRemoveEdmNSBlacklist: string = (host + config('addressBookRemoveEdmNSBlacklist')) as string;

  addressBookExportBlacklist: string = (host + config('addressBookExportBlacklist')) as string;

  addressBookExportNSBlacklist: string = (host + config('addressBookExportNSBlacklist')) as string;

  addressBookExportContactsCheck: string = (host + config('addressBookExportContactsCheck')) as string;

  addressBookExportContactsUrl: string = (host + config('addressBookExportContactsUrl')) as string;

  addressBookExportContactsCheckOpenSea: string = (host + config('addressBookExportContactsCheckOpenSea')) as string;

  addressBookExportContactsUrlOpenSea: string = (host + config('addressBookExportContactsUrlOpenSea')) as string;

  getAddressSyncConfigList: string = (host + config('getAddressSyncConfigList')) as string;

  updateAddressSyncConfig: string = (host + config('updateAddressSyncConfig')) as string;

  getAddressContactsLabels: string = (host + config('getAddressContactsLabels')) as string;

  getAddressBookStopService: string = (host + config('getAddressBookStopService')) as string;

  // addressBookDeleteAllFromRecycle: string = (host + config('addressBookDeleteAllFromRecycle')) as string;

  addressBookGetGroupList: string = (host + config('addressBookGetGroupList')) as string;

  addressBookGetConfigDictionary: string = (host + config('addressBookGetConfigDictionary')) as string;

  addressBookGetMyContactList: string = (host + config('addressBookGetMyContactList')) as string;

  addressBookGetMyContactCount: string = (host + config('addressBookGetMyContactCount')) as string;

  addressBookAddContactToGroups: string = (host + config('addressBookAddContactToGroups')) as string;

  addressBookTransferContactsToGroup: string = (host + config('addressBookTransferContactsToGroup')) as string;
  // AI托管营销

  /** 站点管理 */
  // 获取已上线站点列表和每个站点绑定的域名
  getSiteDomainList = host + config('getSiteDomainList');

  getAdsDeliveryByOrg = host + config('getAdsDeliveryByOrg');

  // 获取投放概览
  getTrafficDeliveryInfo = host + config('getTrafficDeliveryInfo');

  // 获取花费统计
  getExpenseStatistics = host + config('getExpenseStatistics');

  // 获取花费明细
  getExpenseRecord = host + config('getExpenseRecord');

  getDeliveryCountryList = host + config('getDeliveryCountryList');

  // 生成登录code
  genLoginCode = (host + config('genLoginCode')) as string;

  // 文件上传
  siteUploadFile = (host + config('siteUploadFile')) as string;

  // 文件上传
  siteUploadFileNew = (host + config('siteUploadFileNew')) as string;

  // 站点数据首页
  getWholeData = (host + config('getWholeData')) as string;

  // 站点数据国家列表
  getSiteDataCountryList = (host + config('getSiteDataCountryList')) as string;

  // 整体访问详情
  getDetailWholeData = (host + config('getDetailWholeData')) as string;

  // 整体留资金详情
  getDetailWholeReferIntentionData = (host + config('getDetailWholeReferIntentionData')) as string;

  // 产品详情访问详情
  getDetailProductData = (host + config('getDetailProductData')) as string;

  // 产品详情留资详情
  getDetailProductReferIntentionData = (host + config('getDetailProductReferIntentionData')) as string;

  // 营销落地页访问详情
  getDetailLandingPageData = (host + config('getDetailLandingPageData')) as string;

  // 营销落地页访问详情
  getDetailLandingPageReferIntentionData = (host + config('getDetailLandingPageReferIntentionData')) as string;

  // 添加反馈
  addFeedback = (host + config('addFeedback')) as string;

  // 创建sem营销
  createMarketNeed = (host + config('createMarketNeed')) as string;

  // 我的站点状态数据
  getSiteMetaInfo = (host + config('getSiteMetaInfo')) as string;

  // 获取我的站点中展示数据
  getSiteLatestData = (host + config('getSiteLatestData')) as string;

  // 获取新增总数
  getSiteClueInfo = (host + config('getSiteClueInfo')) as string;

  // 获取模版信息
  getTemplateData = (host + config('getTemplateData')) as string;

  // 获取模版标签列表信息
  getSiteTemplateTag = (host + config('getSiteTemplateTag')) as string;

  // 创建站点
  createSitePage = (host + config('createSitePage')) as string;

  // 是否允许新建
  checkCreateSitePermission = (host + config('checkCreateSitePermission')) as string;

  // 删除站点
  deleteSitePage = (host + config('deleteSitePage')) as string;

  // 删除站点
  offlineSite = (host + config('offlineSite')) as string;

  // 更新站点名称
  updateSiteName = (host + config('updateSiteName')) as string;

  // 获取seo TKD和收录状态
  getSeoConfig = (host + config('getSeoConfig')) as string;

  // 更新seo TKD
  updatePageSeoConfig = (host + config('updatePageSeoConfig')) as string;

  // 更新seo 收录状态
  updateSiteSeoConfig = (host + config('updateSiteSeoConfig')) as string;

  // AIs获取eo TKD
  getAiSiteSeoTkd = (host + config('getAiSiteSeoTkd')) as string;

  // 获取已添加域名列表
  getDomainList = (host + config('getDomainList')) as string;

  // 查询域名详情
  getDomainDetail = (host + config('getDomainDetail')) as string;

  // 获取域名验证信息
  getDomainCheckInfo = (host + config('getDomainCheckInfo')) as string;

  // 验证域名
  checkDomain = (host + config('checkDomain')) as string;

  // 绑定域名
  bindDomain = (host + config('bindDomain')) as string;

  // 解绑域名
  unBindDomain = (host + config('unBindDomain')) as string;

  // 添加 https 证书
  addDomainCert = (host + config('addDomainCert')) as string;

  // 获取 https 证书信息
  getDomainCertInfo = (host + config('getDomainCertInfo')) as string;

  // 获取购买域名支持的后缀列表
  getDomainTLDTypes = (host + config('getDomainTLDTypes')) as string;

  // 域名搜索
  listDomainPrice = (host + config('listDomainPrice')) as string;

  // 购买域名-提交订单
  domainOrderSubmit = (host + config('domainOrderSubmit')) as string;

  // 购买域名-确认支付
  domainOrderConfirm = (host + config('domainOrderConfirm')) as string;

  // 购买域名-获取线下转账汇款信息
  getDomainPayAccount = (host + config('getDomainPayAccount')) as string;

  // 营销落地页
  // 创建营销落地页
  createMarket = (host + config('createMarket')) as string;

  // 查询营销落地页列表
  getMarketList = (host + config('getMarketList')) as string;

  // 查询站点集合下拉列表
  getSiteList = (host + config('getSiteList')) as string;

  // 编辑营销落地页
  updateMarket = (host + config('updateMarket')) as string;

  // 删除营销落地页
  deleteMarket = (host + config('deleteMarket')) as string;

  // 绑定外部站点
  createSiteOuter = (host + config('createSiteOuter')) as string;

  reportSiteBuilderOpportunity = (host + config('reportSiteBuilderOpportunity')) as string;
  // 使用AI建站
  aigcCreateSite = (host + config('aigcCreateSite')) as string;

  // 行业列表
  getIndustryList = (host + config('getIndustryList')) as string;

  // AI建站风格列表
  getAiSiteStyleList = (host + config('getAiSiteStyleList')) as string;

  // 我的域名列表
  listDomain = (host + config('listDomain')) as string;

  // 购买证书
  purchaseCert = (host + config('purchaseCert')) as string;

  // 域名购买列表
  domainOrderList = (host + config('domainOrderList')) as string;

  // 域名绑定站点
  bindSite = (host + config('bindSite')) as string;

  // 查询未绑定域名的站点
  // getUnBindSite = (host + config('getUnBindSite')) as string;

  // 创建模版
  createDomainTemplate = (host + config('createDomainTemplate')) as string;

  // 删除模版
  deleteDomainTemplate = (host + config('deleteDomainTemplate')) as string;

  // 获取模版信息
  getDomainTemplate = (host + config('getDomainTemplate')) as string;

  // 获取证件类型列表
  listIDType = (host + config('listIDType')) as string;

  // 修改模版
  modifyDomainTemplate = (host + config('modifyDomainTemplate')) as string;

  // 分页获取模版
  domainTemplateList = (host + config('domainTemplateList')) as string;

  // 上传实名认证资料
  uploadWCF = (host + config('uploadWCF')) as string;

  // 获取证书链接
  getDomainCertLink = (host + config('getDomainCertLink')) as string;

  // 获取DNS解析链接
  getDNSConfigPageLink = (host + config('getDNSConfigPageLink')) as string;

  // 增加第三方统计代码
  addThirdPartCode = (host + config('addThirdPartCode')) as string;

  // 获取第三方统计代码
  getThirdPartCode = (host + config('getThirdPartCode')) as string;

  // 取消域名备案
  cancelDomain = (host + config('cancelDomain')) as string;

  // 域名备案服务商
  listServiceProviders = (host + config('listServiceProviders')) as string;

  // 域名备案数据
  getRecordInfo = (host + config('getRecordInfo')) as string;

  // 选择域名备案服务商
  pickResource = (host + config('pickResource')) as string;

  // 域名备案
  submitInfo = (host + config('submitInfo')) as string;

  // 域名证书
  certType = (host + config('certType')) as string;

  // 购买证书
  submitCertOrder = (host + config('submitCertOrder')) as string;

  // 证书列表
  certList = (host + config('certList')) as string;

  // 修改证书名称
  updateCertName = (host + config('updateCertName')) as string;

  // 部署证书
  deployCert = (host + config('deployCert')) as string;

  // 新建文章
  createArticle = (host + config('createArticle')) as string;

  // 删除文章
  deleteArticle = (host + config('deleteArticle')) as string;

  // 文章列表
  listArticle = (host + config('listArticle')) as string;

  // 获取全部分类
  getSiteCategory = (host + config('getSiteCategory')) as string;

  // 更新文章
  updateArticle = (host + config('updateArticle')) as string;

  // 文章上/下线
  changeStatus = (host + config('changeStatus')) as string;

  // 创建分类
  createCategory = (host + config('createCategory')) as string;

  // 删除分类
  deleteCategory = (host + config('deleteCategory')) as string;

  // 分类列表
  listCategory = (host + config('listCategory')) as string;

  // 更新分类
  updateCategory = (host + config('updateCategory')) as string;

  // 分类排序
  orderCategory = (host + config('orderCategory')) as string;

  // 文章详情
  getArticle = (host + config('getArticle')) as string;

  // 站点数据
  siteInfo = (host + config('siteInfo')) as string;

  /** 产品数据 */
  getEdmProductClickData: string = (host + config('getEdmProductClickData')) as string;

  getEdmTaskClickData: string = (host + config('getEdmTaskClickData')) as string;

  getEdmCustomerClueInfo: string = (host + config('getEdmCustomerClueInfo')) as string;

  // 站点潜在客户列表
  getAllTaskProductClickData: string = (host + config('getAllTaskProductClickData')) as string;

  getProductViewData: string = (host + config('getProductViewData')) as string;

  // 获取营销任务关联的自动化营销任务列表
  getAutoMarketEdmTask: string = (host + config('getAutoMarketEdmTask')) as string;

  getAddressContactForAutomarket: string = (host + config('getAddressContactForAutomarket')) as string;

  getUniCustomerFollowStatus: string = (host + config('getUniCustomerFollowStatus')) as string;

  // 任务中心
  getSystemTasks: string = (host + config('getSystemTasks')) as string;
  updateSystemTaskStatus: string = (host + config('updateSystemTaskStatus')) as string;
  getSystemTaskConfigList: string = (host + config('getSystemTaskConfigList')) as string;
  updateSystemTaskConfigStatus: string = (host + config('updateSystemTaskConfigStatus')) as string;
  getNoviceTaskRemind: string = (host + config('getNoviceTaskRemind')) as string;
  closeNoviceTaskRemind: string = (host + config('closeNoviceTaskRemind')) as string;
  getNoviceTasks: string = (host + config('getNoviceTasks')) as string;
  finishNoviceTask: string = (host + config('finishNoviceTask')) as string;
  getNoviceTaskTeamTasks: string = (host + config('getNoviceTaskTeamTasks')) as string;
  getNoviceTaskTeamStats: string = (host + config('getNoviceTaskTeamStats')) as string;
  getNoviceTaskExternUrl: string = (host + config('getNoviceTaskExternUrl')) as string;
  // AI营销托管
  // 管理联系人-新增
  addAiHostingContact: string = (host + config('addAiHostingContact')) as string;

  // 管理联系人-联系人状态
  getAiHostingContactStatus: string = (host + config('getAiHostingContactStatus')) as string;

  // 管理联系人-删除
  deleteAiHostingContact: string = (host + config('deleteAiHostingContact')) as string;

  // 管理联系人-营销状态开启/关闭
  switchAiHostingContact: string = (host + config('switchAiHostingContact')) as string;

  // 管理联系人-列表
  getAiHostingContactList: string = (host + config('getAiHostingContactList')) as string;

  // 管理联系人-回复列表
  getAiHostingReplyContactList: string = (host + config('getAiHostingReplyContactList')) as string;

  // 联系人详情-统计
  getAiHostingContactDetailStatistics: string = (host + config('getAiHostingContactDetailStatistics')) as string;

  // 联系人详情-列表
  getAiHostingContactDetailList: string = (host + config('getAiHostingContactDetailList')) as string;

  // 策略模版信息接口 - 模板列表
  getAiHostingPlanInfos: string = (host + config('getAiHostingPlanInfos')) as string;

  // 策略模版信息接口 - 模板列表
  getAiHostingPlanV2Infos: string = (host + config('getAiHostingPlanV2Infos')) as string;

  // 自定义策略邮件模版列表接口
  getAiHostingPlanEmailTemplates: string = (host + config('getAiHostingPlanEmailTemplates')) as string;

  // 自定义策略接口（新增/变更）
  saveAiHostingPlan: string = (host + config('saveAiHostingPlan')) as string;

  // 自定义策略删除
  delAiHostingPlan: string = (host + config('delAiHostingPlan')) as string;
  // 社媒营销
  getSnsBindingAccounts: string = (host + config('getSnsBindingAccounts')) as string;
  getSnsBindingAccountsAll: string = (host + config('getSnsBindingAccountsAll')) as string;
  getSnsBindingThridLink: string = (host + config('getSnsBindingThridLink')) as string;
  getSnsBindingAccountStatus: string = (host + config('getSnsBindingAccountStatus')) as string;
  getSnsBindingAccountDetail: string = (host + config('getSnsBindingAccountDetail')) as string;
  addSnsBindingAccount: string = (host + config('addSnsBindingAccount')) as string;
  cancelSnsBindingAccount: string = (host + config('cancelSnsBindingAccount')) as string;
  deleteSnsBindingAccount: string = (host + config('deleteSnsBindingAccount')) as string;
  getSnsBindingDailyQuota: string = (host + config('getSnsBindingDailyQuota')) as string;
  getSnsMarketingUploadToken: string = (host + config('getSnsMarketingUploadToken')) as string;
  getSnsMarketingDownloadUrl: string = (host + config('getSnsMarketingDownloadUrl')) as string;
  createSnsMarketingAiPostTask: string = (host + config('createSnsMarketingAiPostTask')) as string;
  retrySnsMarketingAiPostTask: string = (host + config('retrySnsMarketingAiPostTask')) as string;
  getSnsMarketingAiTaskPosts: string = (host + config('getSnsMarketingAiTaskPosts')) as string;
  sendSnsMarketingAiPost: string = (host + config('sendSnsMarketingAiPost')) as string;
  sendSnsMarketingManualPost: string = (host + config('sendSnsMarketingManualPost')) as string;
  getSnsMarketingPost: string = (host + config('getSnsMarketingPost')) as string;
  updateSnsMarketingPost: string = (host + config('updateSnsMarketingPost')) as string;
  getSnsMarketingPostPageList: string = (host + config('getSnsMarketingPostPageList')) as string;
  getSnsMarketingPostComments: string = (host + config('getSnsMarketingPostComments')) as string;
  getSnsMarketingPostChildComments: string = (host + config('getSnsMarketingPostChildComments')) as string;
  sendSnsMarketingPostComment: string = (host + config('sendSnsMarketingPostComment')) as string;
  updateSnsCommentUnReadCount: string = (host + config('updateSnsCommentUnReadCount')) as string;
  deleteSnsMarketingPost: string = (host + config('deleteSnsMarketingPost')) as string;
  getSnsReplaceContent: string = (host + config('getSnsReplaceContent')) as string;
  getSnsRefineContent: string = (host + config('getSnsRefineContent')) as string;
  getSnsReplaceImage: string = (host + config('getSnsReplaceImage')) as string;
  getSnsMarketingChatList: string = (host + config('getSnsMarketingChatList')) as string;
  getSnsMarketingMessageList: string = (host + config('getSnsMarketingMessageList')) as string;
  sendSnsMarketingMessage: string = (host + config('sendSnsMarketingMessage')) as string;
  updateSnsMarketingMessage: string = (host + config('updateSnsMarketingMessage')) as string;
  getSnsMarketingChatListByIds: string = (host + config('getSnsMarketingChatListByIds')) as string;
  getSnsHelpDocs: string = (host + config('getSnsHelpDocs')) as string;

  getSnsTaskQuota = (host + config('getSnsTaskQuota')) as string;

  getSnsTaskAiParam = (host + config('getSnsTaskAiParam')) as string;

  createSnsTask = (host + config('createSnsTask')) as string;

  completeSnsTask = (host + config('completeSnsTask')) as string;

  getSnsTaskDetail = host + config('getSnsTaskDetail');

  saveSnsTask = host + config('saveSnsTask');

  getDefaultPlan = (host + config('getDefaultPlan')) as string;

  getSnsTaskList = host + config('getSnsTaskList');

  getSnsCalendar = host + config('getSnsCalendar');

  tryCreatePostForSnsTask = host + config('tryCreatePostForSnsTask');

  createPostsForSnsTask = host + config('createPostsForSnsTask');

  enableSnsTask = host + config('enableSnsTask');

  delSnsTask = host + config('delSnsTask');

  pauseSnsTask = host + config('pauseSnsTask');

  copySnsTask = host + config('copySnsTask');

  getTaskState = host + config('getTaskState');

  getTaskPostState = host + config('getTaskPostState');

  getPostState = host + config('getPostState');

  getAllBindingAccount = host + config('getAllBindingAccount');

  getHotPosts = host + config('getHotPosts');

  getMediaState = host + config('getMediaState');

  doGetWcaList = host + config('doGetWcaList');

  purchaseTrend = host + config('purchaseTrend');

  importRegionalDistribution = host + config('importRegionalDistribution');

  importCompanyDistribution = host + config('importCompanyDistribution');

  exportCompanyDistribution = host + config('exportCompanyDistribution');

  companyPurchaseTrend = host + config('companyPurchaseTrend');

  companyHscodeRanking = host + config('companyHscodeRanking');

  companyGoodsDistribution = host + config('companyGoodsDistribution');

  companyGoodsTypeProportion = host + config('companyGoodsTypeProportion');

  companyProductKeywords = host + config('companyProductKeywords');

  companyRouteDistribution = host + config('companyRouteDistribution');

  companyTransportTypeProportion = host + config('companyTransportTypeProportion');

  companyShippingTypeProportion = host + config('companyShippingTypeProportion');

  companyRelatedCompany = host + config('companyRelatedCompany');

  companyComplete = host + config('companyComplete');

  hotProductRanking = host + config('hotProductRanking');

  transportTrend = host + config('transportTrend');

  transportProportion = host + config('transportProportion');

  transportRouteDistribution = host + config('transportRouteDistribution');

  transportProductKeywords = host + config('transportProductKeywords');

  transportPageCustomer = host + config('transportPageCustomer');

  transportVolumeDistribution = host + config('transportVolumeDistribution');

  // quotaQuery = host + config('quotaQuery');

  logSave = host + config('logSave');

  getQuotaQuery = host + config('getQuotaQuery');
  getTradeLogList = host + config('getTradeLogList');
  // menu菜单
  edmUsefulMenu = host + config('edmUsefulMenu');
  edmAllUsefulMenu = host + config('edmAllUsefulMenu');
  edmUpdateUsefulMenu = host + config('edmUpdateUsefulMenu');
  fissionRelation = host + config('fissionRelation');
  fissionOverview = host + config('fissionOverview');
  fissionCompanyList = host + config('fissionCompanyList');
  getSearchJudge = host + config('getSearchJudge');
  getBuyersCompanyList = host + config('getBuyersCompanyList');
  getSuppliersCompanyList = host + config('getSuppliersCompanyList');

  // 文件管理
  getMaterielUploadToken = host + config('getMaterielUploadToken');
  getMaterielDownloadUrl = host + config('getMaterielDownloadUrl');
  getMaterielPreviewUrl = host + config('getMaterielPreviewUrl');
  addMaterielFile = host + config('addMaterielFile');
  deleteMaterielFile = host + config('deleteMaterielFile');
  renameMaterielFile = host + config('renameMaterielFile');
  getMaterielFileList = host + config('getMaterielFileList');
  getMaterielShareList = host + config('getMaterielShareList');
  getMaterielShareAccounts = host + config('getMaterielShareAccounts');
  getMaterielSharePreview = host + config('getMaterielSharePreview');
  editMaterielShare = host + config('editMaterielShare');
  reportMaterielWaShare = host + config('reportMaterielWaShare');
  getMaterielBusinessCard = host + config('getMaterielBusinessCard');
  editMaterielBusinessCard = host + config('editMaterielBusinessCard');

  getWAShareList = host + config('getWAShareList');
  getRecordListForward = host + config('getRecordListForward');
  guessAndSave = host + config('guessAndSave');
  getRcmdSuggestion = host + config('getRcmdSuggestion');
  addressBookDeleteAddressBookContacts = host + config('addressBookDeleteAddressBookContacts');

  addressBookBatchDeleteAddressBookContacts = host + config('addressBookBatchDeleteAddressBookContacts');
  addressBookDeleteContactsByEmails = host + config('addressBookDeleteContactsByEmails');

  getBusinessAds: string = (host + config('getBusinessAds')) as string;
  setBusinessAdsClick: string = (host + config('setBusinessAdsClick')) as string;
  getShareVisitList = host + config('getShareVisitList');

  getEmailInquirySwitch: string = (host + config('getEmailInquirySwitch')) as string;
  getEmailInquiry: string = (host + config('getEmailInquiry')) as string;
  markEmailInquiryRead: string = (host + config('markEmailInquiryRead')) as string;
  getMailContentInquiry: string = (host + config('getMailContentInquiry')) as string;
}

export type EdmUrlKeys = keyof EdmUrl;
const urlConfig = new EdmUrl();
const urlsMap = new Map<EdmUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as EdmUrlKeys, urlConfig[item as EdmUrlKeys]);
});
export default urlsMap;
