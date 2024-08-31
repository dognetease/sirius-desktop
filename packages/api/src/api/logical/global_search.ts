/* eslint-disable camelcase */
import { Api } from '../_base/api';
import { ContactAddReq, RequestCompanyMyList } from './customer';
import { CustomsContinent, reqCustomsClue, SearchReferer, reqBuyers } from './edm_customs';
import { WhatsAppAiSearchTaskStatus } from './whatsApp';

export { RequestCompanyMyList } from './customer';
export { reqCustomsClue } from './edm_customs';

export interface GlobalSearchApi extends Api {
  search(req: GloablSearchParams): Promise<GlobalSearchResult>;

  newSearch(req: GloablSearchParams): Promise<GlobalSearchResult>;

  globalSearchGetContactById(req: string[]): Promise<Record<string, GlobalSearchListContactItem[]>>;

  contomFairSearach(req: GloablSearchContomFairParams): Promise<GlobalSearchResult<GlobalSearchContomFairItem>>;

  contomNewFairSearach(req: GloablSearchContomFairParams): Promise<GlobalSearchResult<GlobalSearchContomFairItem>>;

  getDetail(req: { id: string; product?: string }): Promise<GlobalSearchCompanyDetail>;

  getSimilarCompanytable(req: { id: string }): Promise<SimilarCompanyTableDataItem[]>;

  globalLabelSearch(req: { datas: GlobalLabelSearchParams[] }): Promise<GlobalLabelSearchResItem[] | null>;

  addClue(req: reqCustomsClue): Promise<number>;

  addCustomer(req: IReqGlobalSearchAddCustomer): Promise<number>;

  getContactPage(req: IGlobalSearchContactReq): Promise<IGlobalSearchContact>;

  getHsCodeList(req: IHsCodeReq): Promise<IHsCodeBackend[]>;

  deepSearchContact(id: string): Promise<IDeepSearchContactRes>;

  globalSearchDeepStatus(id: string): Promise<IDeepSearchContactRes>;

  getGlobalRcmdList(productName: string): Promise<string[]>;

  deepNewSearchContact(id: string): Promise<IDeepSearchContactRes>;

  deepSearchCompany(companyName: string): Promise<IDeepSearchCompanyRes>;

  doCreateSub(payload: IGlobalSearchCreateSubPayload): Promise<boolean>;

  doGetSubList(req: IGlobalSearchSubListReq): Promise<IGlobalSearchSub[]>;

  doDeleteSub(ids: number[]): Promise<boolean>;

  doUpdateSub(id: number): Promise<boolean>;

  doReadSubList(): Promise<any>;

  doReadCompanySubList(): Promise<boolean>;

  doMailSaleRecord(req: MailSaleRecordReq): Promise<void>;

  doGetDeepGrubStat(): Promise<IGlobalSearchDeepGrubStat[]>;

  globalSearchDeepGrubStatAll(): Promise<IGlobalSearchDeepGrubStat[]>;

  globalSearchDeepGrubStatAllV2(): Promise<IGlobalSearchDeepGrubStat[]>;

  /** 公司挖掘列表 */
  doGetDeepGrubCompanyStat(): Promise<Pick<IGlobalSearchDeepGrubStat, 'id' | 'name' | 'status'>[]>;

  /** 挖掘公司详情 */
  doDeepSearchCompany(id: string): Promise<Pick<IDeepSearchContactRes, 'id'>>;

  globalBatchAddAddressBook(req: { idList: string[]; groupIds?: number[]; sourceType?: TSource }): Promise<void>;

  globalBatchAddAddressBookV1(req: { idList: string[]; groupIds?: number[]; sourceType?: TSource; contactMergeType?: number }): Promise<IBatchAddReq>;

  globalBatchAddLeadsV1(req: {
    globalInfoVOList: Array<{ id: string; chineseCompanyId?: string }>;
    sourceType: TSource;
    leadsGroupIdList?: Array<number>;
  }): Promise<IBatchAddReq>;

  globalSingleAddLeads(req: GlobalSingleAddLeadsReq): Promise<IBatchAddReq>;

  customsSingleAddLeads(req: CustomsSingleAddLeadsReq): Promise<IBatchAddReq>;

  linkedInbatchAddLeads(req: LinkedInBatchAddReq): Promise<IBatchAddReq>;

  batchAddEmailLeads(req: EmailsBatchAddReq): Promise<IBatchAddReq>;

  globalSearchGetIdList(req: GloablSearchParams): Promise<{ idList: string[] }>;

  globalSearchBrGetIdList(req: GloablSearchParams): Promise<{ idList: string[] }>;

  globalSearchCantonfairGetIdList(req: GloablSearchContomFairParams): Promise<{ idList: string[] }>;

  getCustomerLabelByEmailNew(req: { email_list: string[] }): Promise<GetCustomerLabelByEmailRes>;

  globalBatchAddEdm(req: { edmInfoVOList: Array<{ id: string }>; sourceType: TSource; groupId: string; groupName: string; planId: string }): Promise<IBatchAddReq>;

  batchEdmExposure(req: { edmInfoVOList: Array<{ id: string }> }): Promise<void>;

  customsBatchAddLeadsV1(req: {
    sourceType: TSource;
    customsInfoVOList: Array<{ name: string; originName: string; country: string; chineseCompanyId?: string }>;
    leadsGroupIdList?: Array<number>;
  }): Promise<IBatchAddReq>;

  importCompanyByFile(req: FormData): Promise<ICompanyImportResp>;

  getImportCompanyStat(): Promise<ImportCompanyStatRes>;

  viewImportCompany(id: number): Promise<void>;

  deleteImportCompany(req: { ids: number[] }): Promise<void>;

  clearUnmatchedImportCompany(): Promise<void>;

  collectImportCompany(req: { ids: number[] }): Promise<void>;

  listImportCompany(req: ListImportCompanyReq): Promise<ListImportCompanyRes>;

  searchKeywordsRecommendTip(): Promise<boolean>;

  searchSettings(): Promise<SearchSettingsRes>;

  searchTextCheck(req: { text: string }): Promise<void>;

  leadsContactBulkAdd(req: RequestLeadsContactBulkAdd): Promise<void>;

  globalEmailCheckCallback(req: GlobalEmailCallbackReq): Promise<void>;

  doGetContomfairSearchCatalog(): Promise<IContomFairCatalog[]>;

  doGetStat(): Promise<IGlobalSearchStat>;

  doSaveGoogleData(req: GoogleDataReq): Promise<void>;

  saveLbsChineseData(req: GoogleDataReq): Promise<void>;

  getLinkedInCompanySearch(req: ILinkedInCompanyReq): Promise<ILinkedInCompanyResp>;

  getNewLinkedInCompanySearch(req: ILinkedInCompanyReq): Promise<ILinkedInCompanyResp>;

  getLinkedInSearch(req: ILinkedInPersonProductReq): Promise<ILinkedInPersonProductResp>;

  getLinkedInPersonSearchProduct(req: ILinkedInPersonProductReq): Promise<ILinkedInPersonProductResp>;

  getLinkedInPersonSearchCompany(req: ILinkedInPersonCompanyReq): Promise<ILinkedInPersonCompanyResp>;

  getLinkedInCountryList(req: { searchType: number }): Promise<ILinkedInCountryResp[]>;

  getFacebookCompanySearch(req: any): Promise<any>;
  doCreateCollectByCompanyId(companyId: string | number, name?: string, country?: string): Promise<string | number>;

  doDeleteCollectById(req: { collectId?: string | number; collectIds?: string }): Promise<boolean>;

  doGetCollectList(param: { page: number; size: number }): Promise<CompanyCollectListRes>;

  queryFissionRule(param: { fissionId: number }): Promise<FissionRuleRes>;

  listFissionCompany(param: ListFissionCompanyReq): Promise<FissionCompanyRes>;

  listWaPage(req: ListWaPageSearchParams): Promise<ListWaPageResponse>;

  listWaCountry(): Promise<{ label: string; code: string }[]>;

  doGetCollectLogList(collectId: string | number): Promise<Array<{ time: string; item: CollectLogItem[] }>>;

  doUpdateCollect(id: string | number): Promise<void>;

  doGetGlobalSearchCountryList(): Promise<CustomsContinent[]>;

  doGetEmailGuess(params: { name: string; domain: string }): Promise<Array<string>>;

  doSaveEmailGuessValid(params: EmailGuessValid): Promise<void>;

  doGetGlobalSearachGetMenuAuth(): Promise<GlobalSearchMenuAuth[]>;

  doGetNewSubAuth(): Promise<boolean>;

  doIgnoreCompanySub(param: IIgnoreCompanySubParam): Promise<boolean>;

  doRemoveIgnoreCompanySub(params: IIgnoreCompanySubParam): Promise<boolean>;

  doGetSubCompanyFallList(params: { startOrder?: number; size: number }): Promise<Array<ICompanySubFallItem>>;

  doUpdateProductSub(params: IGlobalSearchProductSub): Promise<boolean>;

  globalFeedbackReportAdd(params: GlobalFeedbackType): Promise<boolean>;

  globalFeedbackTypeQuery(): Promise<GlobalFeedbackQueryType[]>;

  globalFeedbackResultQuery(params: { companyId: number | string }): Promise<{ currentDayReport: boolean }>;

  checkIpIsMainLand(): Promise<boolean>;

  doGetGlobalSearchGptRcmd(params: { value: string; language: string; size?: number }): Promise<string[]>;

  doGetSmartRcmdList(params: SmartRcmdReq): Promise<SmartRcmdListRes>;

  doCreateSmartRcmd(item: SmartRcmdPayload): Promise<boolean>;

  doUpdateSmartRcmd(item: SmartRcmdUpdatePayload): Promise<boolean>;

  doDeleteSmartRcmd(idList: number[]): Promise<boolean>;

  doGetSmartRcmdCompany(params: {
    page: number;
    size: number;
    id: number;
    filterEdm?: boolean;
    filterCustomer?: boolean;
  }): Promise<IGlobalSearchPageResultWrapper<ICompanySubFallItem>>;

  doRemoveRcmdCompany(params: { idList: string[]; type: 0 }): Promise<boolean>;

  doGetWcaList(req: WcaReq): Promise<GlobalSearchResult>;

  fissionRelation(req: { fissionId: number; recordId: number }): Promise<FessionRelation>;

  fissionOverview(req: { fissionId: number }): Promise<FessionRelation>;

  fissionCompanyList(req: { fissionId: number; country: string; level: number; parentId: number }): Promise<FessionCompany[]>;

  getBrCountry(): Promise<CustomsContinent[]>;

  getBrSearchResult(req: GloablSearchParams): Promise<GlobalSearchResult>;

  getBrEcharQuery(req: { country: string; indexCode: IndexCode }): Promise<BrEcharQuery[]>;

  getBrTableData(req: { country: string; page: number; size: number }): Promise<BrTableData>;
}

export interface ILinkedInCountryResp {
  order: number;
  label: string;
  code: string;
}

export interface ILinkedInPersonCompanyReq {
  searchValue: string;
  page: number;
  size: number;
  countryList: string[] | string;
  type?: number;
}

export interface ILinkedInPersonCompanyResp {
  size: number;
  page: number;
  total: number;
  taskId: number;
  taskStatus: number;
  totalExtraNums: number;
  data: {
    name: string;
    emailList: string[];
    phoneList: string[];
    country: string;
    jobTitle: string;
    facebookUrl: string;
    linkedinUrl: string;
    twitterUrl: string;
    companyName: string;
  }[];
}

export interface ILinkedInPersonProductReq {
  searchValue: string;
  page: number;
  size: number;
  countryList?: string[];
  jobTitle: string;
}

export interface ILinkedInPersonProductResp {
  size: number;
  page: number;
  total: number;
  taskId: number;
  taskStatus: number;
  totalExtraNums: number;
  data: {
    title: string;
    linkUrl: string;
    summaryInfo: string;
    contact: string;
    countryCname: string;
  };
}

export interface ILinkedInCompanyReq {
  name: string;
  page: number;
  size: number;
  industry: string;
}

export interface ILinkedInCompanyRespItem {
  id: string;
  name: string;
  country: string;
  overviewDescription: string;
  location: string;
  industries: string;
  phone: string;
  domain: string;
  contactList: {}[];
  companyType: string;
  staff: string;
  logo: string;
  postalCode: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  youtube: string;
  highLight: string;
  countryInfoBOList: string;
  clueStatus: string;
  overviewDescriptionHighLight: string;
  recommendReason: string;
  recommendReasonHighLight: string;
  new: boolean;
  browsed: boolean;
  nameHighLight: string;
  grubStatus: boolean;
  customerStatus?: string;
  orgCustomerStatus?: string;
  contactStatus?: string;
  emailCount: number;
  phoneCount: number;
  socialCount: number;
  allContactCount: number;
  prevContactCount?: number;
  defaultEmail: string;
  defaultEmailNew: boolean;
  defaultPhone: string;
  defaultPhoneNew: boolean;
  referId: string | null;
  // LEADS(1, "我的线索"), ORG_LEADS(2, "同事线索"), CUSTOMER(3, "我的客户"), ORG_CUSTOMER(4, "同事客户");
  customerLabelType: 'LEADS' | 'ORG_LEADS' | 'OPEN_SEA_LEADS' | 'CUSTOMER' | 'ORG_CUSTOMER' | 'OPEN_SEA_CUSTOMER' | null;
}

export interface ILinkedInCompanyResp {
  data: ILinkedInCompanyRespItem[];
  size: number;
  page: number;
  total: number;
  industries: string[];
  taskId: number;
  taskStatus: number;
  totalExtraNums: number;
}

export interface MailSaleRecordReq {
  origin?: string;
  emails: string[];
}

export interface GlobalSearchResult<T = GlobalSearchItem> {
  realTotalCount?: number;
  pageableResult: {
    data: Array<T> | null;
    total: number;
  };
  queryInfoBO: {
    countryInfoBOList: Array<{
      countryName: string;
      countryNameCh: string;
      count: number;
    }> | null;
    countryBOMap: ICountryMap | null;
    // 搜索推荐词
    recommendWordList?: null | string[];
  };
}

export interface GlobalSearchContomFairItem extends GlobalSearchItem {
  procurementCategorys?: string;
  procurementCategorysHighLight?: string;
}

export interface ICountryMap {
  [key: string]: CountryMapProp[];
}

export interface CountryMapProp {
  code: string;
  name: string;
  cname: string;
  continent: string;
  count: number;
  ccontinent: string;
}

export type TGloabalSearchType = 'company' | 'domain' | 'product';

export interface GloablSearchParams {
  name?: string;
  domain?: string;
  product?: string;
  page: number;
  size: number;
  hasEmail?: boolean;
  allMatchQuery?: boolean;
  searchType?: TGloabalSearchType;
  staffNumMin?: number;
  staffNumMax?: number;
  country?: string[];
  startTime?: number;
  createTime?: number;
  hasBrowsed?: boolean;
  referer?: SearchReferer;
  excludeExpressCompany?: boolean;
  hasDomain?: boolean;
  fromWca?: boolean;
  hasCustomsData?: boolean;
  sortField?: string;
  nearSynonymList?: string[];
  version?: number;
  filterEdm?: boolean;
  filterCustomer?: boolean;
  excludeValueList?: string[];
  otherLanguages?: string[];
}

export interface GloablSearchContomFairParams extends GloablSearchParams {
  /**
   * 搜索广交会年份，0：全部 ，N：近 N 年
   */
  yearList: number[];
  searchValueList?: string[];
}

export type GrubStatus = 'NOT_GRUBBING' | 'GRUBBING' | 'GRUBBED' | 'OFFLINE_GRUBBING' | 'OFFLINE_GRUBBED';

export interface GlobalSearchListContactItem {
  checkStatus?: null | -1 | 0 | 1;
  contact?: string;
  country?: string | null;
  facebookUrl?: string | null;
  grubStatus?: GrubStatus | null;
  isHidden?: boolean | null;
  isNew?: boolean;
  jobTitle?: string;
  linkedinUrl?: string;
  name?: string;
  origin?: string;
  phone?: string;
  region?: string;
  score?: number;
  twitterUrl?: string;
  type?: string;
  updateTime?: string;
}

export interface MergeCompany {
  name: string;
  country: string;
  location?: string;
  companyId: string;
  lastExportTime?: string;
  lastImportTime?: string;
  originCompanyName?: string;
  collectId: null | number | string;
}

export interface SimilarCompanyTableDataItem {
  name?: string;
  country?: string;
  contactCount?: string;
  domain?: string;
  id: string;
  companyId: string;
  domainCountry?: string;
  mainProduct?: string;
}

export interface GlobalSearchItem {
  id: string;
  companyId: string;
  name: string;
  shortDesc: string;
  industries: string;
  location: string;
  country?: string;
  domainCountry?: string;
  domainTitle?: string;
  contactCount: number;
  logo?: string;
  domain?: string;
  highLight: {
    type: string;
    value: string;
  };
  contactList: GlobalSearchListContactItem[];
  prevContactList?: GlobalSearchListContactItem[];
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  customerStatus?: string;
  orgCustomerStatus?: string;
  contactStatus?: string;
  overviewDescription: string;
  overviewDescriptionHighLight?: string;
  recommendReason: string;
  recommendReasonHighLight?: string;
  recommendReasonV1: string;
  recommendReasonHighLightV1?: string;
  grubStatus: GrubStatus;
  // 是否new标
  new?: boolean;
  // 是否已浏览
  browsed?: boolean;
  /**
   * 收藏ID 如果存在则表示已经被收藏
   */
  collectId?: string | number;
  lastContactTime?: number;
  emailCount: number;
  phoneCount: number;
  socialCount: number;
  allContactCount: number;
  prevContactCount?: number;
  defaultEmail: string;
  defaultEmailNew: boolean;
  defaultPhone: string;
  defaultPhoneNew: boolean;
  mergeCompanys: Array<MergeCompany> | null;
  customsTransactionLabel: string;
  businessProductLabel: string;
  productCategoryList: Array<string>;
  domainHighlight?: string;
  domainTitleHighLight: string;
  recommendShowName?: string;
  recommendShowNameHighLight?: string;
  referId: string | null;
  // LEADS(1, "我的线索"), ORG_LEADS(2, "同事线索"), CUSTOMER(3, "我的客户"), ORG_CUSTOMER(4, "同事客户");
  customerLabelType: 'LEADS' | 'ORG_LEADS' | 'OPEN_SEA_LEADS' | 'CUSTOMER' | 'ORG_CUSTOMER' | 'OPEN_SEA_CUSTOMER' | null;
  /**
   *  中国公司是否可挖掘
   *  0 可挖掘 1 已经挖掘 其他都不可挖掘
   */
  excavateCnCompanyStatus?: 0 | 1 | null;
  // 挖掘后的关联公司ID
  chineseCompanyId?: string;
  domainStatus?: number;
  fromWca?: boolean | null;
  companyNameId?: string;
  countryId?: string;
  chineseCompanyContactCount?: number;
  chineseCompanyCount?: number;
  chineseCompanyName?: string;
}

export interface GloablSearchProductIntro {
  name: string;
  price: string;
  imgUrl: string;
  url?: string;
}
export interface GlobalSearchCompanyDetailNewsList {
  url?: string;
  title?: string;
  content?: string;
  date?: string;
  domain?: string;
}

export interface GlobalLabelSearchParams {
  name: string;
  country: string;
  companyId: string;
}

export interface GlobalLabelSearchResItem {
  name: string;
  country: string;
  customerStatus: string;
  orgCustomerStatus: string;
  contactStatus: string;
  companyId: string;
  referId: string | null;
  // LEADS(1, "我的线索"), ORG_LEADS(2, "同事线索"), CUSTOMER(3, "我的客户"), ORG_CUSTOMER(4, "同事客户");
  customerLabelType: 'LEADS' | 'ORG_LEADS' | 'OPEN_SEA_LEADS' | 'CUSTOMER' | 'ORG_CUSTOMER' | 'OPEN_SEA_CUSTOMER' | null;
}

export interface ICompanyImportResp {
  fail: number;
  message: string;
  status: 1 | 2 | 3;
  success: number;
  total: number;
  repeat: number; // 导入重复数
}

export interface GlobalSearchCompanyDetail {
  alias: string;
  companyType: string;
  contact: string;
  contactCount: number;
  contactList: Array<GlobalSearchContactItem>;
  domain: string;
  facebook: string;
  foundedDate: string;
  id: string;
  customerStatus?: string;
  orgCustomerStatus?: string;
  contactStatus?: string;
  industries: string;
  instagram: string;
  linkedin: string;
  location: string;
  name: string;
  operatingStatus: string;
  overviewDescription: string;
  overviewDescriptionHighLight?: string;
  phone: string;
  shortDesc: string;
  staff: string;
  twitter: string;
  youtube: string;
  logo?: string;
  country: string;
  domainCountry?: string;
  grubStatus: GrubStatus;
  productList?: GloablSearchProductIntro[];
  /**
   * 收藏Id
   */
  collectId: string | number;
  companyId: string | number;
  mergeCompanys: Array<MergeCompany> | null;
  productCategoryList?: string[];
  productCategoryString?: string;
  relateComapny?: string;
  domainStatus?: number;
  companyNameId?: string;
  countryId?: string;
  origin?: string;
  newsList?: GlobalSearchCompanyDetailNewsList[];
  revenue?: string;
  sic?: string[];
  naics?: string[];
}

export interface CustomButtonsType {
  buttonName: string;
  handler: (params?: CustombBtnHandParams) => void;
}
export interface CustombBtnHandParams {
  detailData?: GlobalSearchCompanyDetail;
}
export interface IsPageSwitchItem {
  // 是否禁止上下翻页
  hasNext?: boolean;
  hasLast?: boolean;
  // 翻页触发的函数
  onPagTurn?: (addition: number) => void;
}

export interface GlobalSearchContactItem {
  contact: string;
  phone: string;
  region: string;
  country: string;
  isNew: boolean;
  checkStatus: number;
  grubStatus: number;
  origin: string;
  type: string;
  name: string;
  linkedinUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  instegtramUrl: string;
  youtubeUrl: string;
  updateTime: string;
  jobTitle: string;
  contactId: string;
  // 邮箱是否可隐藏（公共邮箱）
  isHidden: boolean;
  // 多邮箱
  emails?: Array<{
    email: string;
    origin: string;
    emailStatus: string;
  }>;
  id?: string;
  guessStatus?: 'success' | 'fail';
  guess?: boolean;
}

export interface IHsCodeBackend {
  hsCode: string;
  hsCodeDesc: string;
  hasChildNode: boolean;
  highlight: {
    type: string;
    value: string;
  };
}

export interface IHsCodeReq {
  queryValue?: string;
  hsCodeParent?: string;
  limit?: number;
}

export interface IDeepSearchContactRes {
  id: string;
  grubEmailCount: number;
  grubPhoneCount: number;
  newEmails?: string[];
  newPhones?: string[];
  status: GrubStatus;
}

export interface IDeepSearchCompanyRes {
  addRecordNum: number;
}

export interface IGlobalSearchContact {
  content: {
    contactName: string;
    contactPhone: string;
    contactEmail: string;
  }[];
  size: number;
  number: number;
  totalElements: number;
}

export interface IGlobalSearchContactReq {
  id: string;
  page: number;
  size: number;
}

export interface IBatchAddReq {
  success: boolean;
  // 是否异步录入
  asyncId?: number | null;
}

export type GlobalSearchSubKeywordType = 'product' | 'hscode';

export interface IGlobalSearchCreateSubPayload {
  value: string;
  type: GlobalSearchSubKeywordType;
  country?: Array<string>;
  origin?: 'globalSearch' | 'customsData';
  targetCompanys?: Array<{
    companyName?: string;
    domain?: string;
  }>;
  customerProducts?: string;
}

export interface IGlobalSearchProductSub extends IGlobalSearchCreateSubPayload {
  id: number;
}

export interface IGlobalSearchSubListReq extends Partial<IGlobalSearchCreateSubPayload> {
  page: number;
  size: number;
}

export interface IGlobalSearchPageResultWrapper<T = any> {
  content: T[];
  data?: T[];
  totalElements: number;
  totalPages: number;
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  pageable: {
    offset: number;
    pageNumber: boolean;
    pageSize: number;
    paged: boolean;
  };
  sort: {
    unsorted: boolean;
    sorted: boolean;
    empty: boolean;
  };
}

export interface IGlobalSearchSub {
  id: number;
  value: string;
  type: GlobalSearchSubKeywordType;
  /**
   * 状态，0-新建，1-待查阅,2-已阅，-1已经删除
   */
  status: 0 | 1 | 2 | -1;
  createTime: string;
  updateTime: string;
  watchTime: string;
  acountCorpId: number;
  orgId: string;
  domainId: string;
  accountId: number;
  country?: string[];
  originCountrys?: string[];
  targetCompanys?: Array<{
    companyName?: string;
    domain?: string;
  }>;
  extTaskId?: string;
  // 营销托管任务id
  extPlanId?: string;
  customerProducts?: string;
}

export interface IGlobalSearchDeepGrubStat {
  grubCount: number;
  newEmails?: Array<string>;
  newPhones?: Array<string>;
  status: GrubStatus;
  name: string;
  id: string;
  code?: string;
  condition?: reqBuyers;
  queryType?: 'customs' | 'buysers' | 'suppliers';
  taskId?: string;
  // 营销托管任务id
  planId?: string;
  // 公司订阅id
  fissionId?: number;
}

export interface GlobalEmailCallbackReq {
  id: string;
  emailCheckResult: { key: string; value: string[] }[];
}
// 0：全球搜，1：海关，2：领英-找联系人，3：智能推荐，4：lbs搜索，21：领英-找公司，23：展会列表
export type TSource = 0 | 1 | 2 | 3 | 4 | 21 | 23 | 24 | 110;

export interface IReqGlobalSearchAddCustomer extends RequestCompanyMyList {
  sourceType: TSource;
}

export interface IContomFairCatalog {
  key: string;
  value: string;
  parent?: string;
  searchKeys?: string[];
  children?: IContomFairCatalog[];
}

export interface IGlobalSearchStat {
  companyNums: number;
  rollInfos: string[];
}

export interface GoogleDataItem {
  name?: string;
  country?: string;
  webUrl?: string;
  phoneNumber?: string;
  address?: string;
}

export interface GoogleDataReq {
  datas: Array<GoogleDataItem>;
}

export interface CompanyCollectListRes<T = CompanyCollectItem> {
  totalElements: number;
  size: number;
  content: Array<T>;
}

export interface CompanyCollectItem {
  id: number | string;
  companyName: string;
  originName: string;
  companyId: string;
  country: string | string[];
  //上次查看时间
  watchTime: string;
  // 联系人数量
  contactNum: number;
  // 上次更新时的联系人数量
  lastContactNum: number;
  // 交易时间
  trsTime: string;
  // 更新时间
  dataUpdateTime: string;

  // 公司ID 跳转详情用
  esId: string | number;
  /**
   * 状态，0-新建，1-待查阅,2-已阅，-1已经删除
   */
  status: number;
  fissionId: number | null;
  // 裂变状态，0：一键裂变，1：裂变中，2成功
  fissionStatus: number;
  fissionCompanyNum: number;
}

export interface FissionRuleRes {
  // 任务类型，1：一级裂变，2：二级裂变
  type: number | null;
  countryCnList: string[] | null;
  midCompanyCountryList: string[] | null;
  countryList: string[] | null;
  middleNames: string[] | null;
  middleCustomsCompanyIdList: string[] | null;
  middleCustomsCompanyList: Array<{ companyName: string; country: string; countryCn: string; companyType: number }>;
  oneFissionNum: number;
  twoFissionNum: number;
  totalFissionNum: number;
  // 1:采购商，2：供应商
  companyType: number;
  companyName: string;
  country: string;
  startCompanyType: number;
  originCompanyName: string;
  originCountry: string;
  contactCount: number;
  trsTime: string;
}

export interface FissionCompanyItem {
  name: string;
  originName: string;
  country: string;
  // 1:表示1级潜客，2：表示二级潜客
  level: number;
  contactCount: number;
  overviewDescription: string;
  referId: string;
  customerLabelType: string;
  id: string;
  companyId: string;
  fissionId: string;
  // 1:采购，2：供应
  companyType: number;
  visited: boolean;
}

export interface ListFissionCompanyReq {
  page: number;
  size: number;
  fissionId: number;
  excludeOrgClue?: boolean;
  excludeMyClue?: boolean;
  hasEmail?: boolean;
  excludeExpressCompany?: boolean;
  excludeViewed?: boolean;
}

export interface FissionCompanyRes {
  size: number;
  page: number;
  total: number;
  data: FissionCompanyItem[];
}

export interface ListImportCompanyReq {
  size: number;
  page: number;
  searchValue?: string;
  startTime?: string;
  endTime?: string;
  status?: number;
  notViewed?: boolean;
}

export interface ImportCompanyResItem {
  id: number;
  collectId: string | null;
  originCompanyName: string;
  originCountry: string;
  companyName: string;
  country: string;
  customsCompanyName: string;
  customsCountry: string;
  customsCompanyType: number;
  status: number;
  createTime: string;
  notViewed: boolean;
  referId: string;
  customerLabelType: string;
  viewCountDesc: string;
  fissionStatus: number;
  fissionCompanyNum?: number;
  contactCount: number;
  trsTime: string;
  fissionId: number | null;
}

export interface ListImportCompanyRes {
  customsMatchCompanyNum: number;
  pageableResult: {
    size: number;
    page: number;
    total: number;
    data: ImportCompanyResItem[];
  };
}

export interface SearchSettingsRes {
  edmSyncCount: number;
}

export interface ImportCompanyStatRes {
  notViewNum: number;
  inMatchNum: number;
}

export enum CollectLogItemTypeEnum {
  Customs = 20,
  GlobalSearch = 10,
}

export interface CollectLogItem {
  dateStr: string;
  logDesc: string;
  // 10：海关，20：全球搜
  type: CollectLogItemTypeEnum;
}
export interface ListWaPageSearchParams {
  // 搜索类型，默认值：wagroup
  type: string;
  searchEngine: string;
  isAllMatch: number;
  excludeDelivered?: boolean;
  siteList: string[];
  countryList?: string[];
  content: string;
  page: number;
  pageSize: number;
}
export interface ListWaPageSearchItem {
  linkUrl: string;
  email: string;
  phoneNumber: string;
  countryCname: string;
  country: string;
  title: string;
  deliveredLabel: string;
  delivered: boolean;
  id: string;
  waGroup: string;
}
export interface ListWaPageResponse {
  taskStatus: WhatsAppAiSearchTaskStatus;
  totalExtraNums: number;
  taskId: number;
  page: number;
  size: number;
  total: number;
  list: ListWaPageSearchItem[];
}

export interface EmailGuessValid {
  //全球搜公司ID
  id: string;
  // 联系人姓名
  name: string;
  // 有效邮箱
  validEmailList: string[];
}
export interface GlobalSearchMenuAuth {
  menuCode: string;
  isVisible: boolean;
}

export interface IIgnoreCompanySubParam {
  idList: string[];
  // 0忽略 1隐藏
  type?: 0 | 1;
}

export interface ICompanySubFallItem extends GlobalSearchCompanyDetail {
  /**
   * 海关交易数量
   */
  transCount?: number;
  /**
   * 最后海关交易时间
   */
  lastTransDate?: string;
  /**
   * 卡片编号顺序，用次进行分页
   */
  order: number;
  recommendReason: string;
  recommendReasonHighLight?: string;
  browsed?: boolean;
}

export interface GlobalFeedbackType {
  errorTypes: Array<string>;
  remark: string;
  origin: string;
  companyId: number | string;
}

export interface GlobalFeedbackQueryType {
  errorName: string;
  errorType: string;
}

export interface SmartRcmdReq {
  value?: string;
  type?: string;
  page: number;
  size: number;
}

export interface SmartRcmdItem extends IGlobalSearchSub {
  // 推荐词列表
  synonyms?: string[];
}

export interface SmartRcmdListRes {
  content: SmartRcmdItem[];
  totalElements: number;
}

export interface SmartRcmdPayload extends IGlobalSearchCreateSubPayload {
  synonyms?: string[];
}

export interface SmartRcmdUpdatePayload extends SmartRcmdPayload {
  id: number;
}

export interface RequestLeadsContactBulkAdd {
  leads_id: string;
  // 联系人
  contacts: Partial<ContactAddReq>[];
}

export interface GlobalSingleAddLeadsReq {
  id: string;
  sourceType: number;
  leadsGroupIdList?: Array<number>;
  contactList: GlobalSearchContactItem[];
  chineseCompanyId?: string;
}

export interface CustomsSingleAddLeadsReq {
  name: string;
  country: string;
  originName?: string;
  sourceType: number;
  leadsGroupIdList?: Array<number>;
  contactList: GlobalSearchContactItem[];
  chineseCompanyId?: string;
}

export interface LinkedInBatchAddReq {
  globalInfoVOList: Array<{ id: string }>;
  sourceType: number;
  leadsGroupIdList?: Array<number>;
}

export interface EmailsBatchAddReq {
  globalInfoVOList: Array<{ id: string }>;
  sourceType: number;
  leadsGroupIdList?: Array<number>;
}

export interface CustomerLabelByEmailItem {
  company_name: string;
  contact_email: string;
  contact_id: number;
  contact_name: string;
  create_time: string;
  detail_id: number;
  email_label: number;
  id: number;
}

export type GetCustomerLabelByEmailRes = Array<CustomerLabelByEmailItem>;

export interface WcaReq {
  country?: string[];
  size: number;
  page: number;
  name?: string;
  hasEmail?: boolean;
  hasBrowsed?: boolean;
}

export interface FessionRelation {
  id: string;
  name: string;
  country: string;
  type: 1 | 2 | string;
  childrens?: Array<FessionRelation>;
  companyId?: string;
  level?: number;
  children?: Array<FessionRelation>;
  companyNum?: number;
  [key: string]: unknown;
}

export interface FessionCompany {
  countr: string;
  countryCn: string;
  companyNum: string;
  companyType: number;
  name: string;
}

export interface GlobalSearchParamsProp {
  value: string;
  page?: number;
  pageSize?: number;
  from?: string;
  createTime?: string;
  hasMail?: boolean;
  allMatchQuery?: boolean;
  filterVisited?: boolean;
  type?: TGloabalSearchType;
  notLogisticsCompany?: boolean;
  hasCustomData?: boolean;
  hasWebsite?: boolean;
  filterEdm?: boolean;
  filterCustomer?: boolean;
  excludeValueList?: string;
  fromWca?: boolean;
  sortField?: string;
  nearSynonymList?: string[];
  forceSetNearSynonymList?: boolean;
  country?: string[];
  otherGoodsShipped?: string[];
}

export interface BrEcharQuery {
  dataYear: string;
  dataValue: string;
}

export interface BrTableData {
  size: number;
  data: Array<BrDataProp>;
  total: number;
}

export interface BrDataProp {
  goodsName: string;
  legalPerson: string;
  quantityDesc: string;
  dataValue: string;
  registeredCapital: string;
  quarter: string;
  goodsCode: string;
}

export type IndexCode = 'importFromChina' | 'portContainerThroughput' | 'gni' | 'gdp' | 'midYearPopulation';
