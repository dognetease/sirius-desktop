/* eslint-disable camelcase */
import { Api } from '../_base/api';
import { ApiRequestConfig, ReqAdminAccount, ResAdminAccount } from '../..';

export interface CustomerApi extends Api {
  // uni 接口

  uniEdmList(req: uniEdmListReq): Promise<uniEdmListReqRes>;
  uniEdmListFromContact(req: uniEdmListFromContactReq): Promise<uniEdmListFromContactReqRes>;
  uniIdToCompanyId(req: string[]): Promise<uniIdRes[]>;

  /**
   *  客户列表相关接口
   */

  addNewClient(req: RequestBusinessaAddCompany): Promise<RresponseBusinessaAddCompany>;
  judgeRepeat(req: RequestCompanyMyList): Promise<RresponseCompanyMyList>;
  singleJudgeRepeat(req: reqSingleJudgeRepeat): Promise<resSingleJudgeRepeat>;
  batchJudgeRepeat(req: RequestBusinessaAddCompany): Promise<RresponseBusinessaAddCompany>;
  checkClientName(req: RequestCheckClientName): Promise<RresponseCheckClientName>;
  checkEmailValid(req: ReqCheckEmailValid): Promise<boolean>;
  editCompany(req: RequestBusinessaAddCompany): Promise<RresponseBusinessaAddCompany>;
  editPerfectCompany(req: RequestBusinessaAddCompany): Promise<boolean>;
  recommendList(): Promise<RequestClientRecommend>;
  clueRecommendList(): Promise<RequestClientRecommend>;
  companyList(req?: RequestCompanyList): Promise<RresponseCompanyList>;
  companyMyList(req?: RequestCompanyMyList): Promise<RresponseCompanyMyList>;
  companyAllList(req?: RequestCompanyMyList): Promise<RresponseCompanyMyList>;
  companyForwardList(req?: RequestCompanyMyList): Promise<RresponseCompanyMyList>;
  companySimpleList(req?: companySimpleListReq): Promise<companySimpleListRes>;
  contactList(req?: RequestContactList): Promise<Array<CustomerContactModel>>;
  // uploadCientFile(req: any) : Promise<RresponseUploadCientFile>;
  uploadClientFile(req: FormData): Promise<ResUploadCientFile>;
  downLoadFailClient(): string;
  downLoadFailClue(): string;
  batchAddCompany(req: RequestBatchAddCompany): Promise<RresponseBatchAddCompany>;
  uploadClueDate(req: FormData): Promise<ResUploadCientFile>;
  initAllow(): Promise<RresponseInitAllow>;
  clueInitAllow(): Promise<RresponseInitAllow>;
  getClientEmails(req: RequestClientEmailsList, config?: ApiRequestConfig): Promise<RresponseClientEmailsList>;
  saveRecommendListInfo(req: RequestSaveRecommendData): Promise<boolean>;
  clueSaveRecommendListInfo(req: RequestSaveRecommendData): Promise<boolean>;
  deleteCompany(req: RequestDeleteCompany): Promise<boolean>;
  getContactNums(): Promise<ResponseContactNums>;
  loadContactPerson(): Promise<ResponseLoadContactPerson>;
  getLabelList(req: RequestLabel): Promise<LabelModel[]>;
  getLabelListByPage(req: RequestLabel): Promise<PageLabelModel>;
  getCompanyDetail(companyId: string, conf?: { updateContactDb: boolean; customerType: 'clue' | 'customer' }): Promise<CustomerDetail>;
  companyAddLabels(req: companyAddLabelsReq): Promise<boolean>;
  addLabel(req: Partial<LabelModel>): Promise<LabelModel>;
  companyCheckRules(): Promise<resCompanyRules>;
  updateCompanyCheckRules(req: resCompanyRules): Promise<boolean>;
  repeatList(req: reqRepeatList): Promise<resRepeatList>;
  delLabel(req: string[]): Promise<boolean>;
  editLabel(req: Partial<LabelModel>): Promise<LabelModel>;
  getCustomerByLabel(labelId: string): Promise<Array<{ company_id: string; company_name: string }>>;
  getContactByLabel(labelId: string): Promise<Array<CustomerContactModel>>;
  search(req: ISearchCustomerReq): Promise<ISearchCustomerRes>;
  searchCustomerFromPersonalClue(req: ISearchCustomerFromPersonalClueReq): Promise<ISearchCustomerFromPersonalClueRes>;
  searchCustomerFromClue(req: ISearchCustomerFromClueReq): Promise<ISearchCustomerFromClueRes>;
  searchCustomerFromOpenSea(req: ISearchCustomerFromClueReq): Promise<ISearchCustomerFromClueRes>;
  companyCompare(req: CompanyCompareReq): Promise<CompanyCompareRes>;
  getBaseInfo(): Promise<BaseInfoRes>;
  getGlobalArea(): Promise<BaseInfoRes>;
  companyMerge(req: CompanyMergeReq): Promise<boolean>;
  contactEdit(req: ContactAddReq): Promise<boolean>;
  contactAdd(req: ContactAddReq): Promise<boolean>;
  clientTemplate(): Promise<string>;
  clueTemplate(): Promise<string>;
  contactDetail(req: ContactDetailReq): Promise<ContactDetailRes>;
  contactListPageById(req: ReqContactListById): Promise<ResContactListById>;
  getCustomerDetail(req: CustomerDetailParams, config?: ApiRequestConfig): Promise<CustomerDetail>;
  getSuggestionGlobalAi(req: SuggestionGlobalAiParams, config?: ApiRequestConfig): Promise<SuggestionGlobalAi>;
  getSuggestionGlobalAiGenerate(req: SuggestionGlobalAiGenerateParams, config?: ApiRequestConfig): Promise<SuggestionGlobalAiGenerate>;
  getSuggestionGlobalAiQuery(req: SuggestionGlobalAiQueryParams, config?: ApiRequestConfig): Promise<SuggestionGlobalAi>;
  getSuggestionAICount(req?: SuggestionGlobalAiParams, config?: ApiRequestConfig): Promise<{ countLeft: number }>;
  getCustomerScheduleList(req: CustomerScheduleListParams): Promise<CustomerScheduleListRes>;
  createCustomerSchedule(req: CustomerScheduleEditParams): Promise<number>;
  updateCustomerSchedule(req: CustomerScheduleEditParams): Promise<number>;
  deleteCustomerSchedule(req: CustomerScheduleDeleteParams): Promise<number>;
  getCustomerOperateHistory(req: CustomerOperateHistoryParams): Promise<CustomerOperateHistoryRes>;
  openSeaOperateHistory(req: CustomerOperateHistoryParams): Promise<CustomerOperateHistoryRes>;
  getCustomerOperateDetail(req: CustomerOperateDetailParams): Promise<CustomerOperateDetailRes>;
  openSeaOperateDetail(req: CustomerOperateDetailParams): Promise<CustomerOperateDetailRes>;
  updateOpportunityStage(req: UpdateOpportunityStageParams): Promise<OpportunityDetail>;
  deleteOpportunityContact(req: DeleteOpportunityContactParams): Promise<boolean>;
  deleteCustomerContact(req: DeleteOpportunityContactParams): Promise<boolean>;
  deleteClueContact(req: DeleteOpportunityContactParams): Promise<boolean>;
  deleteCustomerLabels(req: CustomerDeleteLabelsParams): Promise<boolean>;
  forwardCustomer(req: ForwardCustomerParams): Promise<boolean>;
  transferCustomerManager(req: ReqTransferManager): Promise<boolean>;
  transferClueManager(req: ReqTransferManager): Promise<boolean>;
  addCustomerManager(req: ReqAddManager): Promise<boolean>;

  getClueDetail(req: ClueDetailParams): Promise<ClueDetail>;
  getOpportunityDetail(req: OpportunityDetailParams): Promise<OpportunityDetail>;
  getOpportunityCloseRecord(req: OpportunityCloseRecordParams): Promise<OpportunityCloseRecordRes>;
  getOpportunityStages(req: OpportunityStagesParams): Promise<OpportunityStages>;
  getContactEmails(req: ContactEmailsParams): Promise<ContactEmails>;
  openSeaContactEmails(req: ContactEmailsParams): Promise<ContactEmails>;
  getEmailsContacts(req: EmailsContactsParams): Promise<EmailsContacts>;
  openSeaEmailsContacts(req: EmailsContactsParams): Promise<EmailsContacts>;

  mkdirIfAbsent(dirName: string, parentDirId: number): Promise<{ id: number; parentId: string; spaceId: string; path: string }>;
  addFollow(id: string, type: FollowsType, req: IFollowModel): Promise<boolean>;
  getFollowList(req: ReqFollowList): Promise<ResponseFollowList>;
  openSeaFollowList(req: ReqOpenSeaFollowList): Promise<ResponseFollowList>;
  getMainContactList(req: ReqMainContactList): Promise<ResMainContactList[]>;
  getManagerList(): Promise<ResManagerItem[]>;
  companyCheckExport(req: companyCheckExportReq): Promise<clueCheckExportRes>;
  businessCheckExport(req: opportunityCheckExportReq): Promise<clueCheckExportRes>;

  // 客户公海
  openSeaCustomerList(req?: RequestCompanyMyList): Promise<RresponseCompanyMyList>;
  openSCAllocate(req?: ReqOpenSeaAllocate): Promise<customerResult>;
  openSeaCustomerDelete(req: string[]): Promise<customerResult>;
  openSeaCustomerDetail(req: { id: string }): Promise<CustomerDetail>;
  openSeaCustomerReceive(req: string[]): Promise<customerResult>;
  openSeaCustomerValid(id: string): Promise<customerResult>;
  returnCustomerOpenSea(req: ReqReturnOpenSea): Promise<boolean>;
  returnCustomerOpenSeaRule(): Promise<openSeaRules>;

  /**
   *  线索相关接口
   */
  addNewClue(req: newClueReq): Promise<boolean>;
  editClue(req: newClueReq): Promise<boolean>;
  myClueList(req: newMyClueListReq): Promise<newMyClueListRes>;
  clueCheckExport(req: newMyClueListReq): Promise<clueCheckExportRes>;
  clueExport(): string;
  allClueList(req: newMyClueListReq): Promise<newMyClueListRes>;
  clueDelete(req: string[]): Promise<boolean>;
  clueForceDelete(req: string[]): Promise<boolean>;
  existTransferCustomer(req: string[]): Promise<{ result: boolean }>;
  editClueStatus(req: editClueStatusReq): Promise<boolean>;
  clueBatchUpdate(req: clueBatchUpdateReq): Promise<{ result: boolean }>;
  clueContactList(req: clueContactListReq): Promise<clueContactListRes[]>;
  changeTOCustomer(req: changeTOCustomerReq): Promise<boolean>;
  clueCloseRecordList(id: string): Promise<clueRecordRes>;
  /**
   *  商机相关接口
   */
  addOpportunity(req: newOpportunityReq): Promise<boolean>;
  editOpportunity(req: newOpportunityReq): Promise<boolean>;
  deleteOpportunity(id: number): Promise<boolean>;
  batchDeleteOpportunity(req: { ids: number[] }): Promise<boolean>;
  opportunityDetail(id: number): Promise<any>;
  opportunityList(req: opportunityListReq): Promise<opportunityListRes>;
  opportunityListAll(req: opportunityListReq): Promise<opportunityListRes>;
  opportunityContactList(req: opportunityListReq): Promise<opportunityContactListItem[]>;
  opportunityContactListAll(req: opportunityListReq): Promise<opportunityContactListItem[]>;
  opportunityStage(req: opportunityStageReq): Promise<boolean>;
  businessStages(): Promise<businessStagesReq>;
  contactListById(req: contactListByIdReq): Promise<ContactDetailRes[]>;
  companyContactListById(req: contactListByIdReq): Promise<ContactDetailRes[]>;
  businessContactListById(req: Partial<contactListByIdReq>): Promise<ContactDetailRes[]>;
  /**
   * 查重
   */
  judgeRepeatSearch(req: JudgeRepeatSearchReq): Promise<JudgeRepeatItem[]>;
  emailSuffixConfigList(): Promise<EmailSuffixList>;
  emailSuffixConfigListUpdate(req: EmailSuffixList): Promise<boolean>;

  /**
   * 浏览器插件
   */
  extensionCaptureEmailList(req: IExtensionCaptureEmailListReq): Promise<IExtensionCaptureEmailListItem[]>;
  extensionCaptureEmailDelete(req: number[]): Promise<IExtensionCaptureEmailDeleteRes>;
  extensionImportClue(req: IExtensionImportClue): Promise<boolean>;
  extensionWhiteList(): Promise<IExtensionWhiteListRes>;
  extensionWhiteListAdd(req: IExtensionWhiteListDeleteReq): Promise<boolean>;
  extensionWhiteListDelete(req: IExtensionWhiteListDeleteReq): Promise<boolean>;

  /**
   * 附件上传
   */
  getNosUploadToken(req: ReqNosToken): Promise<ResNosToken>;
  finishNosUpload(req: ReqFinishNosUpload): Promise<ResFinishNosUpload>;
  previewNosFile(docId: string, source: string, sourceId: string): Promise<string>;
  syncDocument(docId: string, source: string): Promise<boolean>;

  /**
   * 公海线索
   */

  openSeaList(req: openSeaReq): Promise<openSeaListRes>;
  openSeaReceive(req: string[]): Promise<boolean>;
  openSeaAllocate(req: seaAllocateReq): Promise<boolean>;
  openSeaDelete(req: string[]): Promise<boolean>;
  openSeaDetail(id: string): Promise<openSeaDetail>;
  getCustomerAccount(req: ReqAdminAccount): Promise<ResAdminAccount>;
  returnOpenSea(req: ReqReturnOpenSea): Promise<boolean>;
  snapshotPreview(req: RessnapshotPreview): Promise<string>;
  openSeaSnapshotPreview(req: RessnapshotPreview): Promise<string>;
  openSeaValid(id: string): Promise<string>;
  clueValid(id: string): Promise<string>;
  opportunityValid(id: string): Promise<string>;
  companyValid(id: string): Promise<string>;

  getOpenSeaSetting(): Promise<IOpenSeaSetting>;
  updateOpenSeaSetting(req: IOpenSeaSetting): Promise<boolean>;

  /**
   * 文件列表
   */
  getDocumentList(req: ReqDocumentList): Promise<ResDocumentList>;

  // 黑名单
  getEdmBlacklist(req: RequestEdmBlacklist): Promise<ResponseEdmBlacklist>;
  getEdmNSBlacklist(req: RequestEdmBlacklist): Promise<ResponseEdmNSBlacklist>;
  addEdmBlacklist(req: RequestAddEdmBlacklist): Promise<any>;
  addEdmNSBlacklist(req: any): Promise<any>;
  removeEdmBlacklist(req: RequestRemoveEdmBlacklist): Promise<any>;
  removeEdmNSBlacklist(req: RequestRemoveEdmNSBlacklist): Promise<any>;
  exportBlacklist(req: any): Promise<any>;
  exportNSBlacklist(req: any): Promise<any>;

  // 邮件标签规则
  getRuleList(): Promise<{ items: EdmMailRule[] }>;
  addRule(req: Partial<EdmMailRule>): Promise<boolean>;
  updateRule(req: EdmMailRule): Promise<boolean>;
  deleteRule(req: string[]): Promise<boolean>;
  addMailTag(req: { name: string; color: string }): Promise<boolean>;
  updateMailTag(req: { name: string; color: string; labelId: string }): Promise<boolean>;
  getMailTagList(req: {
    condition: ContactEmailsCondition;
    clue_id?: string;
    company_id?: string;
    opportunity_id?: string;
    clue_open_sea_id?: string;
    mainResourceId?: string;
  }): Promise<Array<{ labelId: string; name: string; color: string }>>;

  // 数据迁移
  parseFiles(req: FormData): Promise<ResParseTables>;
  getObjectFields(multiFile: boolean): Promise<{ [key: string]: DMObjectField[] }>;
  validDMFields(req: ReqDMValidField, config?: ApiRequestConfig): Promise<boolean>;
  doDMImport(req: ReqDMImport): Promise<ResDMImport>;
  validDMImport(req: ReqDMImport): Promise<ResDMImport & { need_clue_import: boolean }>;
  downloadDMFail(download_id: string): Promise<void>;

  // 邮件侧边栏
  getCustomerByEmail(email: string): Promise<{ items: CustomerInfoShort[] }>;
  updatePartialCompany(req: Partial<RequestBusinessaAddCompany>): Promise<{ id: number }>;
  updatePartialClue(req: Partial<newClueReq>): Promise<{ id: number }>;
  updatePartialContact(Req: Partial<ContactAddReq>): Promise<{ id: number }>;

  getCustomerListByWhatsAppId(whatsappId: string): Promise<{ resourceIdList: CustomerDetail[] }>;
  getBindCustomerByWhatsAppId(whatsappId: string): Promise<CustomerDetail>;
  getPersonalWhatsappHistory(req: { fromNumber: string; toNumber: string; fromAccId: string }): Promise<PersonalWhatsappHistoryRes>;
  getPersonalWhatsappHistoryAround(req: { fromNumber: string; messageId: string; fromAccId: string }): Promise<PersonalWhatsappHistoryRes>;
  bindWhatsAppIdToCompany(req: { whatsappId: string; companyId: string }): Promise<boolean>;

  bspBindWhatsAppIdToCompany(req: { whatsappId: string; companyId: string }): Promise<boolean>;
  getBspBindCustomerByWhatsAppId(whatsappId: string): Promise<CustomerDetail>;
}

export type CustomerConditionType = 'clue' | 'company' | 'opportunity' | 'open_sea';
export interface RequestLabel {
  key?: string;
  label_type: number;
  page?: number;
  page_size?: number;
}
export interface companyCheckExportReq extends Partial<RequestCompanyMyList> {
  ids: string[];
}
export interface opportunityCheckExportReq extends Partial<opportunityListReq> {
  ids: number[];
}
export interface LabelModel {
  label_id: string;
  label_name: string;
  label_type: number;
  label_color_id: string;
  label_color: string;
  label_company_count?: number;
  label_create_time?: number;
}

export interface PageLabelModel {
  content: LabelModel[];
  page: number;
  page_size: number;
  total_page: number;
  total_size: number;
  original_size: number;
  asc_flag?: boolean;
  order_by?: string;
}

export interface ILabelData {
  label_id: string;
  label_name: string;
  label_company_count: number;
}

export type View = 'customer' | 'label' | 'labelDetail' | 'customer-from-modal';
export type ViewChangeParams = {
  labelId: string;
  labelName: string;
};

export interface ICustomerContactData {
  isValid: boolean;
  contact_id: string;
  contact_name: string;
  email: string;
  company_id: string;
  company_name: string;
  rejected?: boolean;
  blacklist?: boolean;
  valid?: any;
  source_name?: string;
}

export interface ISearchCustomerReq {
  key?: string;
  range: 'ALL' | 'LABEL' | 'CONTACT';
  label_id_limit?: string;
}
export interface ISearchCustomerFromPersonalClueReq {
  company_level_list?: number[];
  company_name: string;
  continent: string;
  country: string;
  filter_label_op: string;
  label_name_list: string[];
  manager_id_list: string[];
  source_list: number[];
  star_level_list: number[];
  return_all?: boolean;
}
export interface ISearchCustomerFromClueReq {
  clue_batch_list?: number[];
  company_name: string;
  continent: string;
  country: string;

  name: string;
  source_list: number[];
  return_all?: boolean;
}

export interface ICustomerData {
  company_id: string;
  company_name: string;
  contacts: ICustomerContactData[];
  labels: ILabelData[];
}

export interface ICustomerFromPersonalClueData {
  company_id: string;
  company_name: string;
  contact_list: ICustomerContactData[];
  contacts?: ICustomerContactData[];
  labels: ILabelData[];
}
export interface ICustomerFromClueData {
  id: string;
  name: string;
  number: string;
  contact_list: ICustomerContactData[];
  contacts?: ICustomerContactData[];
  labels: ILabelData[];
}
export interface ISearchCustomerRes {
  label_list: ILabelData[];
  company_list: ICustomerData[];
}
export interface ISearchCustomerFromPersonalClueRes {
  company_list: ICustomerFromPersonalClueData[];
  company_num: number;
  contact_num: number;
}
export interface ISearchCustomerFromClueRes {
  part_num: any; // 线索数量
  contact_num: any;
  part_info_list: ICustomerFromClueData[];
  [x: string]: ICustomerFromClueData[];
}
export interface CustomerDetailParams {
  company_id: string;
}

export interface SuggestionGlobalAiParams {
  email: string;
  from: 'global' | 'ai';
}

export interface SuggestionGlobalAiGenerateParams {
  email: string;
  content: string;
}
export interface SuggestionGlobalAiQueryParams {
  genId: string;
}

export interface CustomerScheduleListParams {
  company_id?: string;
  clue_id?: string;
  opportunity_id?: string;
  page: number;
  page_size: number;
}

export interface CustomerSchedule {
  schedule_id: number;
  subject: string;
  create_time: string;
  schedule_time: string;
  distance_start: string;
}

export interface CustomerScheduleListRes {
  page: number;
  page_size: number;
  total_size: number;
  item_list: CustomerSchedule[];
}

export interface CustomerScheduleEditParams {
  company_id?: string;
  clue_id?: string;
  opportunity_id?: string;
  schedule_id?: number;
  subject?: string;
  start?: string;
}

export interface CustomerScheduleDeleteParams {
  schedule_id?: number;
  condition: 'clue' | 'company' | 'opportunity';
}
export interface SocialPlatform {
  type: string;
  number: string;
  name: string;
}

export interface ContactDetail {
  contact_id: string;
  contact_name: string;
  main_contact: boolean;
  email: string;
  label_list: LabelModel[];
  contact_icon: string;
  telephones: string[];
  whats_app: string;
  social_platform: SocialPlatform[];
  job: string;
  home_page: string;
  gender: string;
  birthday: string;
  remark: string;
  pictures: string[];
  rejected: boolean;
  valid: boolean;
  telephone?: string;
  address?: string[];
  contact_infos?: Array<{ contact_type: string; contact_content: string; valid: boolean; verify_status: number }>;
  area?: string[];
  ext_infos?: Array<{ key: string; value: string }>;
  department?: string;
}

export interface CustomerDetail {
  origin_company_id: string; // 对应客户id，注意和companyId区别，对应的是
  company_id: string;
  company_name: string;
  company_domain: string;
  company_logo: string;
  company_number: string;
  clue_id?: string;
  clue_name?: string;
  country: string;
  company_level: string;
  company_level_name?: string;
  area: string[];
  short_name: string;
  star_level: string;
  intent: string;
  label_list: LabelModel[];
  main_industry: string;
  purchase_amount: string;
  zone: string;
  scale: string;
  fax: string;
  telephone: string;
  address: string;
  remark: string;
  pictures: string[];
  source: string;
  sourceName?: string;
  social_media: SocialPlatform[];
  contact_list: ContactDetail[];
  manager_list: { name: string; manager_name: string; id: string }[];
  system_info: {
    create_time: string;
    create_user: string;
    create_user_id: string;
    update_time: string;
    update_user: string;
    update_user_id: string;
    moment_time: string;
    moment_user: string;
    moment_user_id: string;
  };
  require_product_type_label: string;
  product_require_level_label: string;
  edit_flag: boolean;
  website: string;
  last_return_reason?: string;
  last_manager_name?: string;
  standard_area_format?: boolean;
  status?: string;
  leads_name?: string;
  return_managers?: { name: string; manager_name: string; id: string }[];
  return_time?: string;
  return_remark?: string;
}

export interface PersonalWhatsappHistory {
  id: string;
  serializedId: string;
  fromMe: boolean;
  body?: string;
  type: string;
  t: number;
  from: string;
  to: string;
  author: string;
  self: string;
  ack: number;
  chatId: string;
  forwarded: boolean;
  sensitiveType: number;
  subtype?: string;
}
export interface PersonalWhatsappHistoryRes {
  totalSize: number;
  content: PersonalWhatsappHistory[];
}

export interface SuggestionGlobalAi {
  companyName: string;
  area: string;
  aiFail?: boolean;
  code?: number;
  webapp?: string;
  location?: string;
  socialMediaList?: { name: string; desc: string; number?: string }[];
}
export interface SuggestionGlobalAiGenerate {
  genId: string; // 轮询id
  aiFail?: boolean;
}

export interface CustomerOperateHistoryParams {
  condition: 'clue' | 'company' | 'opportunity' | 'open_sea' | 'customer_open_sea';
  clue_id?: string;
  company_id?: string;
  opportunity_id?: string;
  clue_open_sea_id?: string;
  customer_open_sea_id?: string;
  page: number;
  page_size: number;
  sort?: string;
  is_desc?: boolean;
}

export interface CustomerOperateHistoryItem {
  id: string;
  oper_id: string;
  oper_name: string;
  oper_desc: string;
  oper_time: string;
  is_sys: boolean;
}

export interface CustomerOperateHistoryRes {
  total_size: number;
  item_list: CustomerOperateHistoryItem[];
}

export interface CustomerOperateDetailParams {
  condition: 'clue' | 'company' | 'opportunity' | 'open_sea' | 'customer_open_sea';
  clue_id?: string;
  company_id?: string;
  opportunity_id?: string;
  clue_open_sea_id?: string;
  customer_open_sea_id?: string;
  history_id: string;
}

export interface CustomerOperateDetailRes {
  change_info: {
    oper_name: string;
    oper_desc: string;
    time: string;
  };
  table_name: {
    label: string;
    value: string;
  }[];
  data: any[];
}

export interface CustomerDeleteLabelsParams {
  company_id: string;
  label_name_list: string[];
}

export interface ForwardCustomerParams {
  company_id: number;
  account_list: {
    scene: string;
    account: string;
  }[];
}

export interface customerManagerItem {
  id: string;
  name: string;
}

export interface ReqTransferManager {
  ids: string[];
  manager: customerManagerItem;
}
export interface ReqAddManager {
  ids: string[];
  managerList: customerManagerItem[];
}

export interface ClueDetailParams {
  id: string;
}

export interface ClueDetail {
  city: string;
  company_id: string;
  company_domain: string;
  company_name: string;
  customer_company_name: string;
  contact_list: ContactDetail[];
  label_list?: LabelModel[];
  main_contact: boolean;
  pictures: string[];
  rejected: boolean;
  remark: string;
  social_platform: SocialPlatform[];
  telephones: string[];
  whats_app: string;
  continent: string;
  country: string;
  create_at: string;
  create_by: string;
  create_by_id: string;
  create_type: number;
  create_type_name: string;
  id: string;
  name: string;
  number: string;
  province: string;
  remain_time: string;
  source: number;
  source_name: string;
  status: string;
  status_name: string;
  update_at: string;
  update_by: string;
  update_by_id: string;
  follow_time: string;
  follow_by: string;
  manager_list: { name: string }[];
  enter_time: string;
  clue_batch: string;
  clue_batch_label: string;
  area: string[];
  website?: string;
}

export interface OpportunityDetailParams {
  id: string;
}

export interface OpportunityDetail {
  company_id: string;
  company_name: string;
  company_domain: string;
  contact_list: ContactDetail[];
  contact_name_list: string[];
  create_at: string;
  create_by: string;
  currency: number;
  currency_code: number;
  currency_name: string;
  deal_at: string;
  deal_info: string;
  email_cnt: number;
  estimate: string;
  follow_at: string;
  follow_by: string;
  id: string;
  name: string;
  number: string;
  product: string;
  remark: string;
  source: string;
  source_name: string;
  stage: OpportunityStageItem;
  stage_time: number;
  stage_name: string;
  turnover: string;
  update_at: string;
  update_by: string;
  manager_list: { name: string }[];
}

export interface OpportunityCloseRecordParams {
  id: string;
}

export interface OpportunityCloseRecordItem {
  close_by: string;
  close_at: string;
  stage_name: string;
  reason: string;
}

export interface OpportunityCloseRecordRes {
  records: OpportunityCloseRecordItem[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OpportunityStagesParams {}

export interface OpportunityStageItem {
  name: string;
  ratio: number;
  stage: number;
  type: number;
}

export interface OpportunityStages {
  stages: OpportunityStageItem[];
}

export interface UpdateOpportunityStageParams {
  id: string;
  stage: number;
  dealExt?: {
    turnover: string;
    deal_at: string;
    deal_info: string;
  };
  closeExt?: {
    reason: string;
  };
}

export interface DeleteOpportunityContactParams {
  contact_id: string;
  condition?: 'clue' | 'company' | 'opportunity' | 'open_sea';
  clue_id?: string;
  company_id?: string;
  opportunity_id?: string;
}

export enum ContactEmailsCondition {
  Clue = 'clue',
  Company = 'company',
  Opportunity = 'opportunity',
  OpenSea = 'open_sea',
}

export interface ContactEmailsParams {
  page: number;
  page_size: number;
  clue_id?: string;
  company_id?: string;
  opportunity_id?: string;
  clue_open_sea_id?: string;
  condition: ContactEmailsCondition;
  start_date?: string;
  end_date?: string;
  from?: string;
  to?: string;
  type?: string;
  main_res_id?: string;
  mainResourceId?: string;
  labels?: string[];
}

export interface CustomerEmailTag {
  labelId: string;
  name: string;
  color: string;
}

export interface AttachmentItem {
  attachment_id: string;
  attachment_url: string;
  content_id: string;
  content_length: string;
  content_type: string;
  encoding: string;
  estimate_size: string;
  file_name: string;
  file_type: string;
  id: string;
  inlined: boolean;
  is_msg: boolean;
  snapshot_id: string;
}

export interface ContactEmailItem {
  attachments: AttachmentItem[];
  id: string;
  mail_id: string;
  fid: number;
  from: string;
  to: string;
  isSelf: boolean;
  received_date: string;
  sent_date: string;
  snapshot_id: string;
  subject: string;
  summary: string;
  hide?: boolean;
}

export interface ContactEmails {
  content: ContactEmailItem[];
  need_permission: string[];
  need_permission_publisher: string[];
  need_permission_receiver: string[];
  total_size: number;
}

export interface EmailsContactsParams {
  clue_id?: string;
  company_id?: string;
  opportunity_id?: string;
  clue_open_sea_id?: string;
  mainResourceId?: string;
  condition: ContactEmailsCondition;
}

export interface EmailsContactItem {
  email: string;
  name: string;
}

export interface EmailsContacts {
  from_email_list: EmailsContactItem[];
  to_email_list: EmailsContactItem[];
}

/**
 *  客户定义类型分割线
 */

interface contact_list_item {
  contact_name: string;
  email: string;
}
export interface RequestBusinessaAddCompany {
  // 公司名称
  company_name: string;
  // 客户标签
  label_name_list?: string[];
  // 公司域名
  company_domain?: string;
  // 联系人
  contact_list: Partial<ContactAddReq>[];
  // 备注
  remark?: string;
  company_id?: string;
  label_list?: ILabelData[];
  // 客户分级
  company_level?: number;
  main_contact?: string;
  rejected?: boolean;
  main_email?: string;
  // 客户来源
  source?: string;
  // 公司简称
  short_name?: string;
  // 公司星级
  star_level?: number;
  // 公司logo
  company_logo?: string;
  // 客户意向
  intent?: number;
  // 主营产品
  main_industry?: number;
  // 年采购额
  purchase_amount?: number;
  // 时区
  zone?: string[];
  // 国家地区
  area?: string[];
  // 公司规模
  scale?: number;
  // 传真
  fax?: string;
  pictures?: string[];
  require_product_type?: string;
  product_require_level?: string;
  // 客户跟进状态
  customer_follow_status?: string;
}

export interface newClueReq {
  id?: string;
  name?: string;
  company_name?: string;
  company_domain?: string;
  contact_list?: Partial<ContactAddReq>[];
  remark?: string;
  source?: number;
}

export interface newOpportunityReq {
  company_id: number;
  contact_id_list: number[];
  currency?: number;
  deal_at: string;
  deal_info: string;
  estimate: string;
  name: string;
  product: string;
  remark: string;
  source: string;
  status: number;
  turnover: string;
  id?: number;
}

export interface RresponseBusinessaAddCompany {
  company_name: string;
  company_id: string;
  label_list: { label_id: number; label_name: string }[];
  remark: string;
  exchange_cnt: number;
}

// 转客户以及商机

export interface changeTOCustomerReq {
  customer: RequestBusinessaAddCompany;
  opportunity: Partial<newOpportunityReq>;
  id: string;
}

export interface clueRecordRes {
  close_reason: string;
  close_record_id: string;
  create_at: string;
  create_by: string;
  create_by_id: string;
  status: number;
  status_name: string;
}
[];

// 编辑客户资料
export interface RresponseBusinessaEditCompany {
  company_name: string;
  label_list: { label_id: number; label_name: string }[];
  remark: string;
  exchange_cnt: number;
}
// 推荐客户资料
export interface RequestRecommendList {
  company_id: string;
  domain: string;
  exchange_cnt: number;
  company_name: string;
}
[];

export interface RequestClientRecommend {
  count: number;
  list: RequestRecommendList[];
}

export type ReqMainContactList = Partial<RequestCompanyMyList>;

// export interface ReqMainContactList {
//     create_time_start?: string,
//     create_time_end?: string,
//     active_time_start?: string,
//     active_time_end?: string,
//     label_name_list?: string[],
//     search_key?: string,
//     reqType: number
// }

export interface ResMainContactList {
  contact_id: string;
  contact_name: string;
  email: string;
}
[];

export interface ResManagerItem {
  id: string;
  name: string;
  email: string;
}
// 获取客户列表
export interface RequestCompanyList {
  create_time_start?: string;
  create_time_end?: string;
  active_time_start?: string;
  active_time_end?: string;
  search_key?: string;
  type?: number; // 1:我的客户； 0： 未完善客户
  sort: string; // 排序字段
  is_desc: boolean | string; // 降序， 升序
}

export interface RequestCompanyMyList {
  create_time_start?: string;
  create_time_end?: string;
  active_time_start?: string;
  active_time_end?: string;
  search_key?: string;
  sort: string; // 排序字段
  is_desc: boolean | string; // 降序， 升序
  filter_label_op: string;
  label_name_list: string[];
  page?: number;
  page_size?: number;
  contact_search_key?: contactSearchKey;
  continent: string;
  country: string;
  star_level_list: string[];
  source_list: number[];
  company_level_list: string[];
  manager_id_list: string[];
  product_require_level_list?: string[];
  require_product_type_list?: string[];
  ids: string[];
  intent: string[];
  purchase_amount: string[];
  scale: string[];
  main_industry: string[];
  create_type_list?: string[];
}

export interface contactSearchKey {
  blank: boolean;
  email?: string;
  telephone?: string;
  whats_app?: string;
}
export interface companySimpleListReq {
  id?: number;
  name?: string;
  page?: number;
  page_size?: number;
}

export interface companySimpleListRes {
  content: Partial<RresponseCompanyCommonItem>[];
  page: number;
  page_size: number;
  total_page: number;
  total_size: number;
  original_size: number;
  order?: boolean;
  order_by?: string;
}

export interface newMyClueListReq {
  req_type?: number;
  create_time_start?: string;
  create_time_end?: string;
  enter_time_start?: string;
  enter_time_end?: string;
  active_time_start?: string;
  active_time_end?: string;
  create_type_list?: number[];
  clue_batch_list?: string[];
  manager_id_list?: string[];
  name?: string;
  page?: number;
  page_size?: number;
  status_list?: number[];
  order_by?: string; // 排序字段
  asc_flag?: boolean; // 是否升序
  contact_search_key?: any;
  continent?: string;
  country?: string;
  clue_id_list?: string[];
}

export interface clueCheckExportRes {
  contact_num: number;
  export_num: number;
  is_async: boolean;
  message: string;
  part_num: number;
}
export interface openSeaReq {
  create_time_start?: string;
  create_time_end?: string;
  return_time_end: string;
  return_time_start: string;
  clue_create_type_list?: number[];
  clue_name?: string;
  page: number;
  page_size: number;
  clue_status_list?: number[];
  order_by: string; // 排序字段
  asc_flag?: boolean; // 是否升序
  continent?: string;
  country?: string;
}

export interface clueContactListReq {
  create_time_start?: string;
  create_time_end?: string;
  active_time_start?: string;
  active_time_end?: string;
  create_type?: number;
  name?: string;
  reqType: number;
  status?: number;
  ids?: string[];
  receive_range: number;
}
export interface clueContactListRes {
  contact_id: string;
  contact_name: string;
  email: string;
}

interface clueDuplicateData {
  clue_id: string;
  clue_name: string;
  clue_number: string;
  items: {
    field: string;
    value: string;
  }[];
  manager_list: {
    email: string;
    id: string;
    name: string;
  }[];
}
export interface myClueItem {
  create_at: string;
  create_type: number;
  exchange_cnt: number;
  follow_by: string;
  follow_time: string;
  id: string;
  main_contact_email: string;
  main_contact_id: string;
  main_contact_name: string;
  name: string;
  number: string;
  remain_time: string;
  remark: string;
  rightFlag: number;
  roleType: number;
  source: number;
  status: number;
  valid: boolean;
  duplicate_data: clueDuplicateData[];
}

export interface newMyClueListRes {
  content: myClueItem[];
  page: number;
  page_size: number;
  total_page: number;
  total_size: number;
  original_size: number;
  order?: boolean;
  order_by?: string;
}

export interface RresponseCompanyListItem {
  company_id: string;
  company_domain: string;
  exchange_cnt: number;
  company_name: string;
  active_time: string;
  label_list: { label_id: number; label_name: string }[];
  remark: string;
  contact_list: {
    contact_id: string;
    contact_name: string;
    email: string;
    rejected: boolean;
  };
}

export interface RresponseCompanyList {
  company_list: RresponseCompanyListItem[];
  page_num: number;
  total: number;
  my_customer_cnt: number;
  imperfect_cnt: number;
}

export interface RresponseCompanyCommonItem {
  active_time: string;
  area: string;
  company_domain: string;
  company_id: string;
  id: string;
  company_name: string;
  company_level: string;
  contact_list: ContactDetail[];
  create_time: string;
  duplicate_data: {
    company_id: string;
    company_name: string;
    dup_field: string;
  }[];
  exchange_cnt: number;
  exist_duplicate: boolean;
  label_list: LabelModel[];
  remark: string;
  short_name: string;
  source: string;
  star_level: string;
  ongoing_opportunity_flag?: boolean;
  multi_contact_flag?: boolean;
  standard_area_format?: boolean;
}
export interface RresponseCompanyMyList {
  content: RresponseCompanyCommonItem[];
  page: number;
  page_size: number;
  total_page: number;
  total_size: number;
  original_size: number;
  order?: boolean;
  order_by?: string;
}

// 客户文件上传

export interface RresponseUploadCientFile {
  total_cnt: number;
  success_cnt: number;
  fail_cnt: number;
  message: string;
  company_list: {
    company_name: string;
    domain: string;
    remark: string;
    contact_list: contact_list_item[];
  };
}

export interface ResUploadCientFile {
  download_id: string;
  dup_cnt: number;
  fail_cnt: number;
  total_cnt: number;
  success_cnt: number;
  success_customer_cnt: number;
  message: string;
  status_code: string;
}

// 客户导入

export interface RequestBatchAddCompany {
  company_list: {
    company_name: string;
    domain: string;
    remark: string;
    contact_list: contact_list_item[];
  }[];
  label_name_list: string[];
}

export interface RresponseBatchAddCompany {
  status_code: string;
  total_cnt: number;
  success_cnt: number;
  fail_cnt: number;
  message: string;
}

// 是否存在推荐接口

export interface RresponseInitAllow {
  recommend: boolean; // true有推荐数据; false 没有推荐数据
}

// 往来邮件
export interface RequestClientEmailsList {
  company_id: string;
  contact_list?: string[];
  offset: number; // 默认为0
  timestamp?: string;
  page_size: number; // 一页大小, 如果客户端不传，则默认为50
  email_category: string; // 邮件类型查看1.15小节邮件类型接口
  start_date?: string;
  end_date?: string;
  fids?: number[];
  exclude_fids?: number[];
}

export interface RresponseClientEmailsList {
  code: number;
  message: string;
  offset: number;
  timestamp: string;
  emailInfoList: any;
}

/**
 * 保存推荐
 */

export interface RequestSaveRecommendItem {
  company_id: string;
  company_name: string;
  domain: string;
}

export interface RequestSaveRecommendData {
  import_list: RequestSaveRecommendItem[];
  part_code: 1 | 2; // 1 线索 2 客户
}

/**
 * 删除客户
 */

export interface RequestDeleteCompany {
  company_id_list: string;
}

/**
 * 获取联系人数量
 */

export interface ResponseContactNums {
  company_cnt: number;
  contact_cnt: number;
  message: string;
}

export interface ResponseLoadContactPerson {
  // company_cnt: number,
  // contact_cnt: number,
  // message: string
  company_total_cnt: number;
  company_success_cnt: number;
  contact_total_cnt: number;
  contact_success_cnt: number;
  message: string;
}

export interface CompanyModel {
  company_id: string;
  company_name: string;
  domain: string;
  exchange_cnt: number;
  active_time: string;
  label_lsit: LabelModel[];
}

/**
 * 检查客户是否重名
 */

export interface RequestCheckClientName {
  company_id: string; // 新增客户为空
  company_name: string;
}
export interface reqSingleJudgeRepeat {
  company_id?: string;
  company_domain?: string;
  company_name?: string;
  email?: string;
  home_page?: string;
  landline_telephone?: string;
  telephones?: string;
  whats_app?: string;
}
export interface resSingleJudgeRepeat {
  fieldName?: string;
  result: boolean;
}

export interface RresponseCheckClientName {
  code: number; // 非0为检验错误
  message: string;
}

export interface ReqCheckEmailValid {
  clue_id?: string;
  clue_open_sea_id?: string;
  company_id?: string;
  condition: string;
  id: string;
  opportunity_id: string;
}

/**
 * 客户重复数据对比
 */

export interface CompanyCompareReq {
  company_id: string;
  ref_company_id: string;
}

interface companyItem {
  company_id: string;
  company_name: string;
}

export interface selectItem {
  label: string;
  value: string;
  parentValue?: string;
  children: children[];
}

interface children {
  label: string;
  value: string;
  parentValue?: string;
  children: children[];
}
interface companyDataItem {
  name: string;
  title: string;
  values: selectItem[];
}
export interface CompanyCompareRes {
  company_info: companyItem[];
  data: companyDataItem[];
}

/**
 * 获取基本配置
 */

export interface BaseInfoRes {
  area: selectItem[];
  company_level: selectItem[];
  company_source: selectItem[];
  intent: selectItem[];
  purchase_amount: selectItem[];
  zone: selectItem[];
  scale: selectItem[];
  social_platform: selectItem[];
  clue_source: selectItem[];
  clue_batch: selectItem[];
  gender: selectItem[];
  business_stage: {
    stage: number;
    name: string;
    radio: string;
    type: number;
  }[];
  businessStages: {
    value: number;
    label: string;
    type: number;
  }[];
  star_level: selectItem[];
  company_product_require_level: selectItem[];
  company_require_product_type: selectItem[];
  main_industry: selectItem[];
  clue_status: selectItem[];
}

export type customerBaseKey = keyof BaseInfoRes;
/**
 * 客户合并接口
 */

interface mergeItem {
  column: string;
  value: string;
}
export interface CompanyMergeReq {
  selecte_company_id: string;
  delete_company_id: string;
  company_data: mergeItem[];
}

/**
 * 新增联系人&& 编辑联系人
 */

export interface ContactAddReq {
  company_id?: string;
  opportunity_id?: string;
  clue_id?: string;
  contact_id?: string;
  condition: 'clue' | 'company' | 'opportunity';
  contact_name: string;
  main_contact: boolean;
  email: string;
  contact_icon: string;
  label_list: string[];
  telephones: string[];
  whats_app: string;
  social_platform: { type: string; number: string }[];
  job: string;
  home_page: string;
  gender: string;
  birthday: string;
  remark: string;
  pictures: string[];
  sourceName?: string;
  decision_maker?: boolean;
}

/**
 * 获取联系人数据
 */

export interface ContactDetailReq {
  condition: 'company' | 'clue';
  search_key: string;
  clue_id: number;
  opportunity_id: number;
  company_id: number;
  contact_id: number;
}

export interface ContactDetailRes {
  contact_id: string;
  contact_name: string;
  main_contact: boolean;
  email: string;
  contact_icon: string;
  label_list: any[];
  telephones: string[];
  whats_app: string;
  social_platform: { type: string; number: string }[];
  job: string;
  home_page: string;
  gender: string;
  birthday: string;
  remark: string;
  pictures: string[];
}

export interface ReqContactListById {
  clue_id?: string;
  clue_open_sea_id?: string;
  company_id?: string;
  opportunity_id?: string;
  condition: 'clue' | 'company' | 'opportunity' | 'open_sea' | 'customer_open_sea';
  page: number;
  page_size: number;
  contact_search_key?: {
    email?: string;
    telephone?: string;
    whats_app?: string;
  };
}

export interface ResContactListById {
  content: ContactDetail[];
  page: number;
  page_size: number;
  total_page: number;
  total_size: number;
  original_size: number;
}

export interface CustomerContactModel {
  contact_id: string;
  contact_name: string;
  email: string;
}

export interface RequestContactList {
  condition: string;
  search_key?: string;
}

/**
 * 批量客户增加标签
 */

export interface companyAddLabelsReq {
  company_list: string;
  label_name_list: string;
}

export type FollowsType = 'customer' | 'clue' | 'business' | 'openSea' | 'customerOpenSea';

export interface IFollowModel {
  content: string;
  follow_at: string;
  next_follow_at?: string;
  attachments?: Array<FollowAttachment>;
  attachment?: string;
  type: number;
  follow_by?: string;
  refId?: string;
  contactId?: string;
  contactName?: string;
  extra?: string;
}

export interface ClueFollowModel extends IFollowModel {
  clue_id: number;
}

export interface BOFollowModel extends IFollowModel {
  opportunity_id: number;
}

export interface CustomerFollowModel {
  company_id: number;
  content: string;
  follow_at: string;
  next_follow_at?: string;
  attachments?: Array<FollowAttachment>;
  attachment?: string;
  type: number;
  follow_by?: string;
  refId?: string;
  contactId?: string;
  contactName?: string;
}

export interface FollowAttachment {
  docId: number;
  name: string;
  size: number;
}

export interface ReqFollowList {
  id: string;
  type: FollowsType;
  split_by?: string;
  start?: string;
  end?: string;
  follow_type?: number[];
  follow_type_list?: number[];
}

export interface ReqOpenSeaFollowList {
  clueOpenSeaId: string;
  split_by?: string;
  start?: string;
  end?: string;
}

export interface ResponseFollowList {
  count: number;
  follow_list: Array<FollowGroupModel>;
}

export interface FollowGroupModel {
  tag: string;
  count: number;
  follow_info_list: Array<IFollowModel>;
}

export interface editClueStatusReq {
  ids: number[] | string[];
  status: number | string;
  close_reason?: string;
}

export interface clueBatchUpdateReq {
  clue_batch?: number;
  source?: number;
  ids?: string[];
}
export interface opportunityListReq {
  company_id_list?: number[];
  opportunity_id_list: number[];
  create_at_begin?: string;
  create_at_end?: string;
  follow_at_begin?: string;
  follow_at_end?: string;
  key?: string;
  order?: string;
  order_by?: string;
  page?: number;
  page_size?: number;
  status?: number;
  stage_list: number[];
  contact_search_key: any;
  manager_id_list?: string[];
  receive_range?: number;
}

export interface opportunityListItemRes {
  company_id: number;
  company_name: string;
  contact_name_list: string[];
  create_at: string;
  create_by: string;
  currency: number;
  deal_at: string;
  deal_info: string;
  email_cnt: number;
  estimate: string;
  follow_at: string;
  follow_by: string;
  id: string;
  name: string;
  number: string;
  product: string;
  remark: string;
  source: string;
  stage: OpportunityStageItem;
  stage_name: string;
  stage_time: number;
  turnover: string;
  update_at: string;
  update_by: string;
}

export interface opportunityListRes {
  create_at_begin: string;
  create_at_end: string;
  follow_at_begin: string;
  follow_at_end: string;
  key: string;
  order: string;
  order_by: string;
  status: number;
  content: Partial<opportunityListItemRes>[];
  total_page: number;
  total_size: number;
  page: number;
  page_size: number;
}

export interface opportunityStageReq {
  id: number;
  stage: number;
  close_ext: string;
  deal_ext: string;
}

export interface businessStagesReqItem {
  stage: number;
  name: string;
  ratio: null;
  type: number;
}
export interface businessStagesReq {
  stages: businessStagesReqItem;
}

export interface contactListByIdReq {
  clue_id: number;
  company_id: number;
  opportunity_id: number;
  condition: string;
  contact_id: number;
  mainResourceId: number;
  resourceType: number;
  search_key: string;
}

export interface IExtensionCaptureEmailListReq {
  email: string;
  source: string;
  label_list: number[];
  capture_start_time: string;
  capture_end_time: string;
  page?: number;
  page_size?: number;
}
export interface IExtensionCaptureEmailDeleteRes {
  result: boolean;
}
export interface IExtensionCaptureEmailListItem {
  capture_time: string;
  domain: string;
  email: string;
  id: number;
  label_list: number[];
}
export interface IExtensionWhiteListRes {
  default_list: string[];
  personal_list: string[];
}
export interface IExtensionWhiteListDeleteReq {
  domain: string;
}
export interface IExtensionImportClue {
  capture_email_id_list: string[];
}

export interface opportunityContactListItem {
  contact_id: string;
  contact_name: string;
  email: string;
}

export interface ReqNosToken {
  fileName: string;
  source: string;
}

export interface ResNosToken {
  token: string;
  bucketName: string;
  nosKey: string;
  context?: string;
}

export interface ReqFinishNosUpload {
  file_name: string;
  nos_key: string;
  size: number;
  source?: string;
  md5?: string;
}

export interface ResFinishNosUpload {
  id: string;
  file_type: string;
  file_name: string;
  size: number;
  create_time: string;
}

export interface RessnapshotPreview {
  clue_id?: string;
  company_id?: string;
  opportunity_id?: string;
  clue_open_sea_id?: string;
  condition: 'clue' | 'company' | 'opportunity' | 'open_sea';
  mailSnapshotId: string;
}
export interface openSeaListRes {
  content: openSeaItem[];
  page: number;
  page_size: number;
  total_page: number;
  total_size: number;
  original_size: number;
  order?: boolean;
  order_by?: string;
}

export interface openSeaItem {
  clue_create_at: string;
  clue_create_type: number;
  clue_create_type_name: string;
  last_follow_time: string;
  id: string;
  clue_id: string;
  clue_name: string;
  clue_source: number;
  clue_source_name: string;
  clue_status: number;
  clue_status_name: string;
  last_manager_name: string;
  last_return_reason: string;
  last_return_remark: string;
  last_return_time: string;
}

export interface seaAllocateReq {
  ids: string[];
  manager_id: string;
  manager_name: string;
}

export interface openSeaDetail {
  area: string[];
  city: string;
  clue_create_type: number;
  clue_create_type_name: string;
  clue_id: string;
  clue_name: string;
  clue_number: string;
  clue_remark: string;
  clue_source: number;
  clue_source_name: string;
  clue_status: number;
  clue_status_name: string;
  company_domain: string;
  company_name: string;
  contact_list: ContactDetail[];
  continent: string;
  country: string;
  province: string;
  create_at: string;
  create_by: string;
  create_by_id: string;
  follow_time: string;
  follow_by: string;
  id: string;
  last_manager_name: string;
  last_return_reason: string;
  last_return_remark: string;
  last_return_time: string;
  update_at: string;
  update_by: string;
  update_by_id: string;
}

export interface ReqReturnOpenSea {
  ids: string[];
  return_reason: string;
  return_remark: string;
}

export interface openSeaRules {
  conditions: {
    contents: string[];
    ruleName: string[];
  }[];
}

export interface ReqDocumentList {
  condition: 'clue' | 'company' | 'open_sea' | 'opportunity' | 'customer_open_sea';
  condition_id: string;
  end_time?: string;
  start_time?: string;
  file_name?: string;
  file_type?: string;
  mainResourceId?: string;
  is_desc?: boolean;
  order_by?: string;
  page?: number;
  page_size?: number;
  source?: string;
}

export interface ResDocumentList {
  asc_flag: boolean;
  order_by: string;
  originan_size: number;
  page: number;
  page_size: number;
  total_page: number;
  total_size: number;
  content: Array<DocumentItem>;
}

export interface DocumentItem {
  create_time: string;
  file_name: string;
  file_type: string;
  id: string;
  size: string;
  email_snapshot_id?: string;
  email_subject?: string;
  status: number;
}

export interface RequestEdmBlacklist {
  key: string;
  page: number;
  page_size: number;
}

export interface EdmBlacklistItem {
  company_id: string;
  company_name: string;
  contact_id: string;
  contact_name: string;
  create_at: string;
  email: string;
  name: string;
}
export interface EdmNSBlacklistItem {
  [key: string]: string;
}

export interface ResponseEdmBlacklist {
  blacklists: EdmBlacklistItem[];
  total_size: number;
}

export interface ResponseEdmNSBlacklist {
  blacklists: EdmNSBlacklistItem[];
  total_size: number;
}

export interface RequestAddEdmBlacklist {
  contact_list: ICustomerContactData[];
}

export interface RequestRemoveEdmBlacklist {
  email_list: string[];
}
export interface RequestRemoveEdmNSBlacklist {
  domainList: string[];
}

export interface EdmMailRule {
  id: string;
  name: string;
  continue: boolean;
  disabled: boolean;
  history_flag: boolean;
  rule_id: string;
  condictions: Array<EdmMailRuleCondition>;
  actions: Array<{ type: string; value: string[] }>;
  labels?: EdmMailTag[];
}

export interface EdmMailRuleCondition {
  field: string;
  ignoreCase: boolean;
  flagOperatorOr: boolean;
  operator: string;
  operand: string[];
}

export interface EdmMailTag {
  label_id: string;
  color: string;
  name: string;
}

export interface resCompanyRules {
  company_name: string;
  email: string;
  company_domain: number;
  home_page: number;
  landline_telephone: number;
  telephone: number;
  whatsapp: number;
}

export interface reqRepeatList {
  company_id?: string;
  company_domain?: string;
  company_name?: string;
  home_page?: string;
  landline_telephone?: string;
  telephones?: string;
  whats_app?: string;
}

export type resRepeatList = resRepeatListItem[];

export interface resRepeatListItem {
  company_id: string;
  company_name: string;
  company_number: string;
  contact_id: string;
  contact_name: string;
  create_at: string;
  email: string;
  follow_time: string;
  manager_list: {
    email: string;
    id: string;
    name: string;
  }[];
  telephones: string[];
  whats_app: string;
}

export interface ReqOpenSeaAllocate {
  ids: string[];
  manager_id: string;
  manager_name: string;
}
export interface customerResult {
  result: boolean;
}
// 公海设置
interface IFieldItem {
  checked?: boolean;
  name: 'effectTime' | 'receiveNoHandle' | 'followNoHandle' | 'receiveNoDeal' | 'advanceNotify' | 'drawLimitAfterRetreat' | 'companyLevelExclude' | 'dealCompanyExclude';
  title: string;
  value?: string | string[];

  source?: {
    value: string;
    label: string;
  }[];
}

export interface IOpenSeaSetting {
  enable: boolean;
  params: IOpenSeaSettingRule[];
}

export interface IOpenSeaSettingRule {
  rule: 'autoRetreatEffectTime' | 'autoRetreatRule' | 'notifyRule' | 'drawRule' | 'excludeRule';
  ruleName: string;
  required: boolean;
  description?: string;
  conditions: IFieldItem[];
}
export interface ResParseTables {
  file_field_list: ResParsedTable[];
  session_id: string;
  history_field_mapping_list: Array<{
    file_name: string;
    mapping_result: boolean;
    mapping_field_code: string;
    object_code: string;
    origin_column_number: string;
    default_value?: string;
  }>;
}

export interface ResParsedTable {
  file_name: string;
  field_list: Array<{
    field_name: string;
    field_number: string;
    parse_vale: string[];
  }>;
}

export interface DMObjectField {
  enum_flag: boolean;
  code: string;
  name: string;
  support_custom: boolean;
  essential: boolean;
}

export interface ReqDMValidField {
  file_name: string;
  mapping_field_code: string;
  object_code: string;
  origin_column_number: string;
  session_id: string;
}

export interface ReqDMImport {
  clue_import: boolean;
  // combination_code: string;
  session_id: string;
  update: boolean;
  field_mapping_list: Array<{
    file_name: string;
    default_value?: string;
    mapping_field_code: string;
    object_code: string;
    origin_column_number: string;
  }>;
}

export interface ResDMImport {
  download_id?: string;
  dup_cnt: number;
  fail_cnt: number;
  status_code: string; // 'success' 'part' 'fail'
  success_cnt: number;
  success_customer_cnt: number;
  total_cnt: number;
  message: string;
}

export interface CustomerInfoShort {
  category: string; // CHANNEL CONTACT COMMERCIAL
  email: string;
  resource_id: string;
  resource_name: string;
}
export interface JudgeRepeatSearchReq {
  conditions: {
    field: string;
    value: string;
  }[];
}
export interface JudgeRepeatItem {
  companyCreateTime: number;
  companyDomain: string;
  companyFollowAt: number;
  companyId: number;
  companyName: string;
  companyNumber: string;
  companyTelephone: string;
  contactEmail: string;
  contactEmailSuffix: string;
  contactHomePage: string;
  contactId: number;
  contactName: string;
  contactTelephone: string;
  contactWhatsapp: string;
  companyOpenSeaId: string | number;
  mainContact: number;
  moduleFlag: number;
  orgId: number;
  canViewDetail: boolean;
  owners: {
    name: string;
    accId: number;
  }[];
}
export interface EmailSuffixList {
  defaultList?: string[];
  suffixList: string[];
}
export interface uniEdmListReq {
  customerIds: string[]; // 客户ID
  filterCondition?: string; // 过滤条件
  mainContact?: boolean; // 是否仅保留主联系人 (非必选，默认为false)
  allSelected: boolean; // 是否全选
}

export interface uniEdmListReqRes {
  company_list: CustomerDetail[];
}

export interface uniEdmListFromContactReq {
  contact_ids: string[]; // 客户ID
  // filterCondition?: string; // 过滤条件
  // mainContact?: boolean; // 是否仅保留主联系人 (非必选，默认为false)
  // allSelected: boolean; // 是否全选
}
export interface uniEdmListFromContactReqRes {
  contact_num: number;
  contact_list: Array<{ contact_id: string; contact_name: string; email: string; valid: boolean }>;
}

export interface uniIdRes {
  company_id: string;
  uni_record_id: string;
}

export type WayType = 'EDM' | 'Address_Book' | 'BizWhatsApp' | 'PersonWhatsApp';
