import { Api } from '../_base/api';

import { GlobalSearchItem, GrubStatus, MergeCompany, newClueReq, RequestCompanyMyList } from '../..';

export interface EdmCustomsApi extends Api {
  buyersList(req: reqBuyers): Promise<resBuyers>;
  buyersAsyncList(rea: { asyncId: string }): Promise<resBuyers>;
  getBuyersCount(req: any): Promise<any>;
  suppliersList(req: reqBuyers): Promise<resBuyers>;
  suppliersAsyncList(rea: { asyncId: string }): Promise<resBuyers>;
  getSuppliersCount(req: any): Promise<any>;
  customsCompanyList(req: reqCustomsCompanyList): Promise<resCustomsCompanyList>;
  buyersBase(req: reqBuysersBase): Promise<resBuysersBase>;
  globalBuyersBase(req: reqGlobalBuysersBase): Promise<resBuysersBase>;
  buyersRecord(req: reqCustomsBaseParam): Promise<resBuysersRecord>;
  globalBuyersRecord(req: reqGlobalCustomsBaseParam): Promise<resBuysersRecord>;
  buyersSuppliers(req: reqCustomsBaseParam): Promise<resBuysersSuppliers>;
  globalBuyersSuppliers(req: reqGlobalCustomsBaseParam): Promise<resBuysersSuppliers>;
  buyersFreight(req: reqCustomsBaseParam): Promise<resCustomsFreight>;
  globalBuyersFreight(req: reqGlobalCustomsBaseParam): Promise<resCustomsFreight>;
  suppliersBase(req: reqBuysersBase): Promise<resSuppliersBase>;
  globalSuppliersBase(req: reqGlobalBuysersBase): Promise<resSuppliersBase>;
  suppliersRecord(req: reqCustomsBaseParam): Promise<resSuppliersRecord>;
  globalSuppliersRecord(req: reqGlobalCustomsBaseParam): Promise<resSuppliersRecord>;
  suppliersBuyers(req: reqCustomsBaseParam): Promise<resSuppliersBuysers>;
  fissioCompanyRelation(req: reqGlobalCustomsBaseParam): Promise<resSuppliersBuysers>;
  globalSuppliersBuyers(req: reqGlobalCustomsBaseParam): Promise<resSuppliersBuysers>;
  suppliersFreight(req: reqCustomsBaseParam): Promise<resCustomsFreight>;
  globalSuppliersFreight(req: reqGlobalCustomsBaseParam): Promise<resCustomsFreight>;
  companyMyList(req?: any): Promise<any>;
  customsUpdateTime(): Promise<string>;
  getCustomsCountry(): Promise<resCustomsCountry[]>;
  getCustomsStateCountry(req: reqCustomsStateCountry): Promise<resCustomsStateCountry[]>;
  getBuyersCountry(): Promise<resCustomsCountry[]>;
  getFollowCountry(): Promise<resCustomsFollowCountry[]>;
  addFollowCountry(req: any): Promise<any>;
  customsDataUpdate(): Promise<resCustomsDataUpdate[]>;
  deleteFollowCountry(req: { countryIdList: string[] }): Promise<any[]>;
  batchGetEdmEmail(req: reqCatchGetEdmEmail): Promise<string[]>;
  getSuppliersCountry(): Promise<resCustomsCountry[]>;
  customsAddClue(req: newClueReq): Promise<number>;
  customsAddCustomer(req: RequestCompanyMyList): Promise<number>;
  customsTranslate(req: ReqCustomsTranslate): Promise<ResCustomsTranslate>;
  chromeTranslate(req: ReqCustomsTranslate): Promise<ResCustomsTranslate>;
  customsHsCode(req: reqCustomsHsCode): Promise<resCustomsHsCode[]>;
  addCustomsStarMark(req: reqAddCustomsStar): Promise<boolean>;
  customsStarList(req: reqCustomsStarList): Promise<resCustomsStarList>;
  deleteCustomsStar(req: reqDeleteCustomsStar): Promise<boolean>;
  deleteCustomsStarById(req: reqDeleteCustomsStar): Promise<boolean>;
  suppliersRecordList(req: reqSuppliersRecordList): Promise<resSuppliersRecordList>;
  globalSuppliersRecordList(req: reqGlobalSuppliersRecordList): Promise<resSuppliersRecordList>;
  buyersRecordList(req: reqSuppliersRecordList): Promise<resSuppliersRecordList>;
  globalBuyersRecordList(req: reqGlobalSuppliersRecordList): Promise<resSuppliersRecordList>;
  customsContact(req: reqCustomsBaseParam): Promise<resCustomsContact>;
  fuzzyExcavate(req: reqCustomsExcavate): Promise<resCustomsExcavate>;
  exactlyExcavate(req: reqCustomsExcavate): Promise<resCustomsExactExcavate>;
  globalSearchContact(req: Partial<reqCustomsCompanyList>): Promise<resCustomsContact>;
  openThirdUrl(url: string): void;
  buyersStatistics(req: reqCustomsStatistics): Promise<resCustomsStatistics>;
  globalBuyersStatistics(req: reqGlobalCustomsStatistics): Promise<resCustomsStatistics>;
  suppliersStatistics(req: reqCustomsStatistics): Promise<resCustomsStatistics>;
  globalSuppliersStatistics(req: reqGlobalCustomsStatistics): Promise<resCustomsStatistics>;
  barTopBuyers(req: reqBarTopBuyers): Promise<resBarTopBuyers>;
  globalBarTopBuyers(req: reqGlobalBarTopBuyers): Promise<resBarTopBuyers>;
  barTopSuppliers(req: reqBarTopBuyers): Promise<resBarTopBuyers>;
  barGlobalTopSuppliers(req: reqGlobalBarTopBuyers): Promise<resBarTopBuyers>;
  billOfLading(req: reqLading): Promise<resLading>;
  customsBatchGetEdmEmail(req: { starMarkIdList: number[] }): Promise<string[]>;
  customDataGetContacts(req: ICustomDataGetContactsReq): Promise<ICustomDataGetContactsResp>;
  updateCustomsStarTag(req?: UpdateStarTagReq): Promise<boolean>;
  doGetCustomsRecordList(req: CustomsRecordReq): Promise<ResCustomsRecord>;
  doGetCustomsRecordCountryList(): Promise<CustomsContinent[]>;
  doGetCustomsOldCountryList(): Promise<CustomsContinent[]>;
  doGetHscodeDataList(): Promise<Array<HScodeItem>>;
  doSearchHscode(searchword: string): Promise<Array<Omit<HScodeItem, 'child'>>>;
  doGetHscodeItem(hscode: string): Promise<HScodeItem | null>;
  hscodeMemoMap: Map<string, HScodeItem>;
  doGetEnableRecordPage(): Promise<boolean>;
  // hsCodeTree : Array<HScodeItem>;
  doGetIdsByCompanyList(param: GetIDByListReq): Promise<CompanyIdType[]>;
  getChineseCompanyIdsByCompanyList(param: GetIDByListReq): Promise<CompanyIdType[]>;
  doGetCustomsDetailInfoById(id: string): Promise<CustomsRecord>;
  doGetCustomsPortList(): Promise<TCustomsPort[]>;
  doGetCustomsHotPortList(): Promise<IHotPortCollection[]>;
  doGetCustomsStat(): Promise<number>;
  getCompanyRelationStatus(req: {
    companyName?: string;
    country?: string;
    companyNameId?: string;
    countryId?: string;
  }): Promise<{ companyId: string; status: string; leadsId: string }>;
  getCustomerInputLimit(): Promise<{ limitReached: boolean }>;
  addCompanySub(param: ReqAddCompanySub): Promise<string | number>;
  deleteCompanySub(id: string | number): Promise<boolean>;
  aiKeywordSearch(req: AiKeywordsSearchReq): Promise<string[]>;
  aiKeywordSearchQuota(): Promise<number>;
  doGetSuggest(params: ReqSuggest, type: SuggestOrigin): Promise<ResSuggest[]>;
  doGetCompanyExists(params: { companyName: string; country: string }): Promise<CompanyExists>;
  doGetCompanyExistsDemo(params: { companyList: Array<{ companyName: string; country: string; originCompanyName?: string }> }): Promise<CompanyExists>;
  doAddCustomsDeepTask(params: { queryType: 'suppliers' | 'buyers'; condition?: reqBuyers }): Promise<customsDeepTask>;
  doGetCustomsDeepTask(params: { queryType: 'suppliers' | 'buyers'; condition?: reqBuyers }): Promise<customsDeepTask>;
  doGetGlobalTaskInfo(params: { taskId: number | string }): Promise<{ id: string; code: string; context: string }>;
  doGetForwarderList(req: ReqForwarder, type: customsCompanyType): Promise<ResForwarder>;
  getSearchPeersList(req: ReqForwarder): Promise<ResForwarder>;
  getRecordListForward(req: ReqForwarder, type: customsCompanyType): Promise<ResCustomsRecord>;
  doGetForwarderAsyncList(rea: { asyncId: string }, type: customsCompanyType): Promise<ResForwarder>;
  doGetAirlineList(): Promise<AirlineItem[]>;
  doGetForwarderPortSuggest(req: ForwarderPortSuggestReq): Promise<ResSuggest[]>;
  fissionRuleSave(req: FissionRuleSaveReq): Promise<any>;
  importCompanyFission(req: ImportRuleSaveReq): Promise<any>;
  doGetExcavateCompanyList(req: ExcavateCompanyReq): Promise<ExcavateCompanyItem[]>;
  doGetExcavateCompanyDetail(id: string): Promise<ExcavateCompanyDetail>;
  doGetUserLog(req: UserLogReq): Promise<{
    data: UserLogItem[];
    page: number;
    size: number;
    total: number;
  }>;
  doGetUserQuota(): Promise<UserQuotaItem>;
  doGetchineseBatchAddLeads(req: { ids: string[]; leadsGroupIdList?: Array<number> }): Promise<string>;
  getIfranmeUrl(req: { type: number }): Promise<{ linkUrl: string }>;
  doGetDetailUseLog(id: number): Promise<ExcavateCompanyDetail>;
  doGetForwarderSearchTop(req: ForwarderTopSearchReq): Promise<ForwarderSearchTop[]>;
  doGetHotPortsV2(type: 0 | 1): Promise<TCustomsPort[]>;
  doGetCommonlyUsePorts(type: CommonlyUsePortType): Promise<CommonlyUsePort[]>;
  purchaseTrend(req: TradeReq): Promise<PurchaseResult[]>;
  importRegionalDistribution(req: TradeReq): Promise<DistributionResult>;
  importCompanyDistribution(req: TradeReq): Promise<DistributionResult>;
  exportCompanyDistribution(req: TradeReq): Promise<DistributionResult>;
  getAllTrade(req: TradeALlReq): Promise<TradeData>;
  companyPurchaseTrend(req: TradeCompanyReq): Promise<CompanyTrend>;
  companyHscodeRanking(req: TradeCompanyReq): Promise<PurchaseResult[]>;
  companyGoodsDistribution(req: TradeCompanyReq): Promise<PurchaseResult[]>;
  companyGoodsTypeProportion(req: TradeCompanyReq): Promise<TradeForwarder>;
  companyProductKeywords(req: TradeCompanyReq): Promise<PurchaseResult[]>;
  companyRouteDistribution(req: TradeCompanyReq): Promise<TradeRouteResult>;
  companyTransportTypeProportion(req: TradeCompanyReq): Promise<PurchaseResult[]>;
  companyShippingTypeProportion(req: TradeCompanyReq): Promise<PurchaseResult[]>;
  companyRelatedCompany(req: TradeCompanyReq): Promise<DistributionFormData[]>;
  getAllTradeCompany(req: TradeCopmayAllReq): Promise<TradeCompanyData>;
  companyComplete(req: { companyName: string }): Promise<
    Array<{
      companyName: string;
      country: string;
      countryCn: string;
      type: 'import' | 'export';
    }>
  >;
  hotProductRanking(): Promise<HotProductRank[]>;
  logSave(req: LogSave): Promise<boolean>;
  getQuotaQuery(): Promise<HasQuantity>;
  getTradeLogList(): Promise<HistoryItem[]>;
  getSearchJudge(req: SearchJudge): Promise<SearchJudgeResult>;
  getBuyersCompanyList(req: reqGlobalCustomsBaseParam): Promise<resSuppliersBuysers>;
  getSuppliersCompanyList(req: reqGlobalCustomsBaseParam): Promise<resSuppliersBuysers>;
  guessAndSave(req: GuessAndSaveParam): Promise<string[]>;
  getRcmdSuggestion(req: { keyword: string }): Promise<Array<{ keyword: string; desc: string }>>;
  getBuyersListAsync(rea: { asyncId: string }): Promise<ResForwarder>;
  getPeersCompanyBase(req: FreightReq): Promise<resBuysersBase>;
  listAreaStatisticsRecord(req: reqCustomsBaseParam): Promise<resCustomsFreight>;
  getFreightRelationCompany(req: FreightRelationReq): Promise<FreightRelationRes>;
  getFreightRelationCountry(req: FreightRelationReq): Promise<
    {
      companyCount: number;
      country: string;
    }[]
  >;
  getAreaStatistics(req: FreightAreaReq): Promise<FreightAreaRes>;
  getTransportCompany(req: FreightRelationReq): Promise<FreightRelationRes>;
  transportTrend(req: TransportTradeReq): Promise<Array<TradeportValue>>;
  transportProportion(req: TransportTradeReq): Promise<TradeportProRes>;
  transportRouteDistribution(req: TransportTradeReq): Promise<DistributionFormData[]>;
  transportProductKeywords(req: TransportTradeReq): Promise<Array<TradeportValue>>;
  transportPageCustomer(req: TransportTradeReq): Promise<{
    records: DistributionFormData[];
    total: number;
  }>;
  transportVolumeDistribution(req: TransportTradeReq): Promise<Array<TradeportValue>>;
}

export type customsDataType = 'hsCode' | 'goodsShipped' | 'company' | 'port';
export type customsOrderType = 'asc' | 'desc';
export type customsCompanyType = 'suppler' | 'buyer';
export type customsTimeFilterType = 'recent_quarter' | 'last_half_year' | 'last_one_year' | 'last_two_year' | 'last_three_year' | 'last_five_year' | 'all';
// export type customSearchType = 'goodsShipped' | 'company' | 'hsCode' | 'port';
export interface reqBuyers {
  startFrom?: number;
  type: customsDataType;
  queryValue: string;
  countryList?: string[];
  relationCountryList?: string[];
  timeFilter?: customsTimeFilterType;
  containsExpress?: boolean | null;
  excludeViewed?: boolean;
  hasEmail?: boolean;
  from: number;
  size?: number;
  sortBy?: string;
  order?: string;
  groupByCountry?: boolean;
  exactlySearch?: boolean;
  onlyContainsChina?: boolean;
  updateTime?: string;
  advanceHsCode?: string;
  advanceGoodsShipped?: string;
  otherGoodsShipped?: string[];
  referer?: SearchReferer;
  total?: number;
  realTotalCount?: number;
  advanceHsCodeSearchType?: number;
  advanceGoodsShippedSearchType?: number;
  async?: boolean;
  // 拓展词语
  extInfo?: string;
}

export interface resBuyers<T = customsRecordItem> {
  startFrom: number;
  from: number;
  size: number;
  total: number;
  records: T[];
  analyzeTokens: string[];
  totalExceedTenThousand: boolean;
  suggests?: string[];
  asyncId?: string;
  realTotalCount?: number;
  freightInfoList: T[];
}

export interface GlobalSearchItemByCustoms extends Omit<Partial<GlobalSearchItem>, 'id'> {
  id: string;
}

export interface customsRecordItem {
  id: number;
  companyName: string;
  name: string;
  status: string;
  country: string;
  topProductDesc: string;
  topHsCode: string;
  topHsCodeDesc: string;
  totalTransactions: string;
  valueOfGoodsUSD: number;
  lastTransactionDate: string;
  starMark: boolean;
  topHsCodeStart?: string;
  topProductDescStart?: string;
  hasContact: boolean;
  highLight?: {
    type: 'hsCode' | 'goodsShipped' | 'company';
    value: string;
  };
  clueStatus: string;
  orgClueStatus: string;
  customerStatus: string;
  orgCustomerStatus: string;
  contactStatus: string | null;
  companyTypeAlias?: string;
  transactionsPercentage?: string;
  valueOfGoodsUsdPercentage?: string;
  canExcavate: boolean;
  hasExcavated: boolean;
  starMarkId?: string;
  visited: boolean;
  visitedId?: number;
  originCompanyName: string;
  collect?: boolean;
  collectId?: string | number | null;
  excavatedCompanyInfo: GlobalSearchItemByCustoms;
  referId: string | null;
  // LEADS(1, "我的线索"), ORG_LEADS(2, "同事线索"), CUSTOMER(3, "我的客户"), ORG_CUSTOMER(4, "同事客户");
  customerLabelType: 'LEADS' | 'ORG_LEADS' | 'OPEN_SEA_LEADS' | 'CUSTOMER' | 'ORG_CUSTOMER' | 'OPEN_SEA_CUSTOMER' | null;
  fromWca?: boolean | null;
  standardCountry?: string;
}

export interface reqCustomsCompanyList {
  from: number;
  size: number;
  companyType: customsCompanyType;
  companyName: string;
  queryValue?: string;
  country?: string;
  groupByCountry?: boolean;
  returnCountry?: boolean;
}

export interface ListModalType {
  companyName: string;
  country: string;
  visited?: boolean;
}

export interface resCustomsCompanyList {
  companies: ListModalType[];
  from: number;
  size: number;
  total: number;
}

export interface reqBuysersBase {
  companyName: string;
  country?: string;
  groupByCountry?: boolean;
  usdRecentYear: string;
  recordCountRecentYear: string;
  visited?: boolean;
  mergedCompanyNames?: string[];
}

export interface reqGlobalBuysersBase {
  companyList: Array<{ companyName: string; country?: string; originCompanyName?: string }>;
  country?: string;
  groupByCountry?: boolean;
  usdRecentYear: string;
  recordCountRecentYear: string;
  visited?: boolean;
  beginDate?: string;
  endDate?: string;
  sourceType?: 'customs' | 'global' | 'transport';
  // mergedCompanyNames?: string[]
}

export interface ICustomsBaseCompany {
  id: string;
  name: string;
  companyType: string;
  contactCount: number;
  country: string;
  alias?: string;
  domain?: string;
  facebook?: string;
  foundedDate?: string;
  highLight?: Record<string, string>;
  industries?: string;
  instagram?: string;
  linkedin?: string;
  location?: string;
  operatingStatus?: string;
  overviewDescription?: string;
  phone?: string;
  shortDesc?: string;
  staff?: string;
  twitter?: string;
  webapp?: string;
  youtube?: string;
}

export interface IResCustomsBase {
  excavatedCompanyInfo?: ICustomsBaseCompany;
  country: string;
  position: string;
  address: string;
  ciqRecord: string;
  postalCode: string;
  status: string;
  hasContact: boolean;
  clueStatus: string;
  orgClueStatus: string;
  customerStatus: string;
  contactStatus: string | null;
  orgCustomerStatus: string;
  canExcavate: boolean;
  hasExcavated: boolean;
  canExactlyExcavate: boolean;
  collectId: null | string | number;
  companyName: string;
  originCompanyName: string;
  mergedCompanyNames: string[];
  referId: string | null;
  // LEADS(1, "我的线索"), ORG_LEADS(2, "同事线索"), CUSTOMER(3, "我的客户"), ORG_CUSTOMER(4, "同事客户");
  customerLabelType: 'LEADS' | 'ORG_LEADS' | 'OPEN_SEA_LEADS' | 'CUSTOMER' | 'ORG_CUSTOMER' | 'OPEN_SEA_CUSTOMER' | null;
  companyNameId?: string;
  countryId?: string;
  standardCountry?: string;
  customerCount: number;
  lastTransportTime: string;
  totalTransportValue: number;
  totalTransportCount: number;
  nameAndCountry?: string;
}

export interface IResCustomsBuyerBase extends IResCustomsBase {
  maxSupplerName: string;
  maxSupplierCountry: string;
  totalImportOfUsd: number;
  importCount: number;
  lastImportTime: string;
}

export interface IResCustomsSupplierBase extends IResCustomsBase {
  maxBuyerName: string;
  maxBuyerCountry: string;
  exportOfUsd: number;
  exportCount: number;
  lastExportTime: string;
}

export type resBuysersBase = IResCustomsBuyerBase;

export interface reqCustomsBaseParam {
  companyName?: string;
  from: number;
  size: number;
  sortBy?: string;
  order?: string;
  country?: string;
  groupByCountry?: boolean;
  hsCode?: string;
  goodsShipped?: string;
  exactlySearch?: boolean;
  suppliersCountry?: string[];
  buyersCountry?: string[];
  relationCountry?: string | string[];
  originCountry?: string[];
  startTransDate?: string;
  endTransDate?: string;
  excludeCommonEmail?: boolean; // 是否排除公共邮箱
  originCompanyName?: string;
  year?: number | string;
  endYear?: number | string;
  mergedCompanyNames?: string[];
  listRecordCount?: number;
  companyList?: Array<{
    companyName?: string;
    country?: string;
  }>;
  portOfLadings?: Array<{
    name: string;
    nameCn: string;
  }>;
  portOfUnLadings?: Array<{
    name: string;
    nameCn: string;
  }>;
  beginDate?: string;
  endDate?: string;
  sourceType?: 'customs' | 'global' | 'transport';
}

export interface reqGlobalCustomsBaseParam {
  companyList: Array<{ companyName: string; country?: string; originCompanyName?: string }>;
  from: number;
  size: number;
  sortBy?: string;
  order?: string;
  country?: string;
  groupByCountry?: boolean;
  hsCode?: string;
  goodsShipped?: string;
  allMatchQuery?: boolean;
  suppliersCountry?: string[];
  buyersCountry?: string[];
  relationCountry?: string | string[];
  originCountry?: string[];
  startTransDate?: string;
  endTransDate?: string;
  excludeCommonEmail?: boolean; // 是否排除公共邮箱
  originCompanyName?: string;
  startYear?: number | string;
  year?: number | string;
  endYear?: number | string;
  mergedCompanyNames?: string[];
  shpCountryList?: string[];
  conCountryList?: string[];
  beginDate?: string;
  endDate?: string;
  sourceType?: 'customs' | 'global' | 'transport';
  exactlySearch?: boolean;
}

export interface resBuysersRecord {
  maxSupplerName: string;
  totalImportOfUsd: number;
  importCount: number;
  lastImportTime: string;
  page: number;
  size: number;
  total: number;
  transactionRecords: transactionRecordItem[];
}

export interface transactionRecordItem {
  recordId: string;
  hsCode: string;
  hsCodeDesc: string;
  goodsShpd: string;
  goodsshpd: string;
  companyName: string;
  valueOfGoodsUSD: number;
  transactionTime: string;
  highGoodsShpd: string;
  highHsCode: string;
  country: string;
  highLight: {
    type: string;
    value: string;
  };
  sourceType?: number;
}

export interface resBuysersSuppliers {
  page: number;
  size: number;
  total: number;
  companies: suppliersCompany[];
}

export interface suppliersCompany {
  companyName: string;
  country: string;
  valueOfGoodsUSD: number;
  percentage: number;
  lasTransactionTime: string;
  transactionCount: number;
  companyCnName?: string;
  excavateCnCompanyStatus?: number;
  chineseCompanyId?: string;
  chineseCompanyContactCount?: number;
  chineseCompanyCount?: number;
  companyNameAndCountry?: string;
}

export interface resCustomsFreight {
  from: number;
  size: number;
  total: number;
  freightInfoList: customsFreightItem[];
}

export interface customsFreightItem {
  arriveDate: string;
  transportCompany: string;
  originCountry: string;
  shipper: string;
  consignee: string;
  hsCode: string;
  goodsShpd: string;
  goodsshpd: string;
  valueOfGoodsUSD: number;
  quantity: string;
  weight: string;
  highGoodsShpd: string;
  highHsCode: string;
  highLight: {
    type: string;
    value: string;
  };
}

export type resSuppliersBase = IResCustomsSupplierBase;

export interface resSuppliersRecord {
  maxBuyerName: string;
  exportOfUsd: number;
  exportCount: number;
  lastExportTime: string;
  page: number;
  size: number;
  total: number;
  transactionRecords: transactionRecordItem[];
}

export interface resSuppliersBuysers {
  page: number;
  size: number;
  total: number;
  companies: suppliersCompany[];
}

export interface reqSuppliersBuysers {
  companyName: string;
  country: string;
  valueOfGoodsUSD: number;
  percentage: number;
  lasTransactionTime: string;
  transactionCount: number;
}

export interface resCustomsCountry {
  label: string;
  code: string;
}

export interface resCustomsFollowCountry {
  id: string;
  country: string;
  countryChinese: string;
  code: string;
  showBox?: boolean;
  value?: string;
  continent?: string;
}

export interface reqCustomsCountryList {
  countryList: any[];
}

export interface resCustomsDataUpdate {
  updateTime: string;
  latestUpdate: boolean;
  transactions: number;
  buyersUpdateCount: number;
  suppliersUpdateCount: number;
  viewCount?: number;
  transportCompanyCount?: number;
}

export interface reqCustomsStateCountry {
  showOtherCountry: boolean;
}
export interface resCustomsStateCountry {
  state: string;
  code: string;
  indeterminate?: boolean;
  countries: resCustomsCountry[];
}

export interface GetIDByListReq {
  companyList: ListType[];
}
export interface CompanyIdType {
  id: string | number;
  companyId: string | number;
  grubStatus?: GrubStatus;
  companyDeepAvailable?: boolean;
  companyGrubStatus?: GrubStatus;
  referId: string | null;
  customerLabelType: 'LEADS' | 'ORG_LEADS' | 'OPEN_SEA_LEADS' | 'CUSTOMER' | 'ORG_CUSTOMER' | 'OPEN_SEA_CUSTOMER' | null;
}

export interface ListType {
  companyName: string;
  country: string;
}

export interface reqCatchGetEdmEmail {
  companyCountryList: ListType[];
}
export interface reqCustomsClue {
  name: string;
  area?: string[];
}

export interface reqCustomsCustomer {
  companyName: string;
  country: string;
  continent: string;
  province: string;
  city: string;
  contacts: customsContactItem[];
}
export interface reqCustomsHsCode {
  queryValue?: string;
  hsCodeParent?: string;
  limit: number;
}

export interface resCustomsHsCode {
  hsCode: string;
  hsCodeDesc: string;
  hasChildNode: boolean;
  highHsCodeDesc: string;
  highLight?: {
    type: string;
    value: string;
  };
}

export interface reqAddCustomsStar {
  companyType: string;
  companyName: string;
  status?: string;
  country?: string;
  topProductDesc?: string;
  topProductHsCode?: string;
  topProductHsCodeDesc?: string;
  totalTransactions?: string;
  valueOfGoodsUsd?: string;
  lastTransactionDate?: string;
  canExcavate: boolean;
  hasExcavated: boolean;
  id?: string;
}

export interface reqCustomsStarList {
  page: number;
  size: number;
  sort?: string;
}

export interface resCustomsStarList {
  page: number;
  size: number;
  total: number;
  list: resCustomsStarItem[];
}

export interface resCustomsStarItem extends customsRecordItem {
  id: number;
  /**
   * 数据更新标记, 0-无更新, 1-有更新(1.6新增)
   */
  updateTag: 0 | 1;
  /**
   * 数据更新时间(1.6新增)
   */
  updateTime: string;
}
export interface reqDeleteCustomsStar {
  id?: string;
  companyName?: string;
  companyType?: string;
  country?: string;
}

export interface reqSuppliersRecordList {
  from: number;
  size: number;
  sortBy?: string;
  order?: string;
  suppliersName?: string;
  buyersName?: string;
  groupByCountry?: boolean;
  buyersCountry?: string;
  suppliersCountry?: string;
}

export interface reqGlobalSuppliersRecordList {
  companyList?: Array<{ companyName: string; country: string; originCompanyName?: string }>;
  from: number;
  size: number;
  sortBy?: string;
  order?: string;
  relationCompany?: string;
  relationCountry?: string;
  relationCompanyList?: Array<{ companyName: string; country: string; originCompanyName?: string }>;
  sourceType?: 'customs' | 'global' | 'transport';
}
export interface resSuppliersRecordList {
  from: number;
  size: number;
  total: number;
  transactionRecords: transactionRecordItem[];
}

export interface resCustomsContact {
  from: number;
  size: number;
  total: number;
  mediaCount: number;
  contactCount: number;
  contacts: customsContactItem[];
}

export interface customsContactItem {
  contactName: string;
  email: string;
  telephones: string[];
  whatsApp?: string;
  socialPlatform?: string;
  job?: string;
}

export interface ReqCustomsTranslate {
  q: string;
  from: string;
  to: string;
}

export interface ResCustomsTranslate {
  errorCode: number;
  query: string;
  translation: string[];
}

export interface reqCustomsExcavate {
  from: number;
  size: number;
  companyName: string;
  country?: string;
}

export interface resCustomsExcavate {
  total: number;
  page: number;
  size: number;
  companyInfoList: companyInfoItem[];
}

export interface companyInfoItem {
  id: string;
  name: string;
  country: string;
  shortDesc: string;
  overviewDescription: string;
  location: string;
  industries: string;
  phone: string;
  contactCount: number;
  domain: string;
  alias: string;
  foundedDate: string;
  operatingStatus: string;
  companyType: string;
  staff: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  youtube: string;
  webapp: string;
  highLight: {
    type: string;
    value: string;
  };
}

export interface resCustomsExactExcavate {
  companyBaseInfo: companyInfoItem;
  firstPageContactInfo: firstPageContact;
}

export interface firstPageContact {
  page: number;
  size: number;
  total: number;
  contacts: customsContactItem[];
}
export interface reqCustomsStatistics {
  companyName: string;
  country: string;
  year: string;
  endYear: string;
  mergedCompanyNames?: string[];
}

export interface reqGlobalCustomsStatistics {
  // companyName: string;
  companyList: Array<{ companyName: string; country?: string; originCompanyName?: string }>;
  // country: string;
  startYear?: string;
  endYear?: string;
  beginDate?: string;
  endDate?: string;
  sourceType?: 'customs' | 'global' | 'transport';
  year?: string;
  mergedCompanyNames?: string[];
  // mergedCompanyNames: string[]
}
export interface resCustomsStatistics {
  dateTimeList: string[];
  countList: string[];
  priceList: string[];
}
export interface reqLading {
  recordId: string;
}
export interface resLading {
  shipmentInfo: {
    billOfLadingNumber: string;
    billOfLadingType: string;
    mainBillOfLadingNumber: string;
    arrivalDate: string;
    shipmentOrigin: string;
    shipmentDestination: string;
    portOfUnlading: string;
    portOfLading: string;
    placeOfReceipt: string;
    transportMethod: string;
    vessel: string;
    isContainerized: string;
    volume: string;
    quantity: string;
    measurement: string;
    weightKg: string;
    weightT: string;
    weightOriginFormat: string;
    valueOfGoodsUSD: string;
    frob: string;
    manifestNumber: string;
    inbondCode: string;
    numberOfContainers: string;
    hasLCL: string;
  };
  companyDetail: {
    consignee: string; // 收货人
    consigneeOriginFormat: string; // 收货人（原件）
    consigneeGlobalHQ: string; // 收货人全球总部
    consigneeDomesticHQ: string; // 收货人国内总部
    consigneeUltimateParent: string; // 收货人最终父
    shipper: string; // 发货人
    shipperOriginFormat: string; // 发货人（原始格式）
    shipperGlobalHQ: string; // 发货人全球总部
    shipperDomesticHQ: string; // 发货人国内总部
    shipperUltimateParent: string; // 发货人终极父母
    carrier: string; // 运输公司
    notifyParty: string; // 通知方
    notifyPartySCAC: string; // 通知当事人 SCAC
  };
  container: {
    containerNumbers: string; // 装箱编号
    hsCode: string; // HS编码
    goodsShipped: string; // 发货的货物
    volumeContainerTEU: string; // 体积（集装箱标准箱）
    containerMarks: string; // 容器标记
    dividedLCL: string; // 分/拼箱
    containerTypeOfService: string; // 容器服务类型
    containerTypes: string; // 容器类型
    dangerousGoods: string; // 危险物品
  };
}

export interface reqBarTopBuyers {
  companyName: string; // 公司名
  country: string; // 国家
  year: string; // 年份，如2021
  endYear: string;
  mergedCompanyNames?: string[];
}
export interface reqGlobalBarTopBuyers {
  companyList: Array<{ companyName: string; country?: string; originCompanyName?: string }>; // 公司名
  startYear: string; // 年份，如2021
  endYear: string;
  beginDate?: string;
  endDate?: string;
  sourceType?: 'customs' | 'global' | 'transport';
  year?: string;
  mergedCompanyNames?: string[];
  // mergedCompanyNames: string[]
}

// companyList: {companyName: string, country: string, originCompanyName?: string};

export interface resBarTopBuyers {
  topNCompanyInfo: topNCompanyInfoItem[];
}
export interface topNCompanyInfoItem {
  companyName: string; // 公司名
  country: string; // 国家
  price: string; // 价格
}

export interface ICustomDataGetContactsReq {
  companyName: string;
  country: string;
  excludeCommonEmail?: boolean;
  originCompanyName?: string;
}

export interface ICustomDataGetContactsResp {
  companyName: string;
  country: string;
  companySite: string;
  contactInfoList: {
    contactName: string;
    email: string;
    rejected: boolean;
    blacklist: boolean;
    mainContact: boolean;
    telephones: string[];
    homePage: string;
    socialPlatform: {
      type: number;
      number: string;
      name: string;
    }[];
  }[];
  price: string; // 价格
}

export interface UpdateStarTagReq {
  id?: number;
}

export type CustomsRecordType = 'Import' | 'Export';

// 手动输入 manual
// 联想 suggest
// AI artifact
// 底部推荐词 recommend
export type SearchReferer = 'manual' | 'suggest' | 'artifact' | 'recommend';
export interface CustomsRecordReq {
  type?: customsDataType | 'port';
  /** 开始时间 */
  begin?: string;
  /** 截止时间 */
  end?: string;
  /** 公司名称 */
  queryCompany?: string;
  /** 公司类型：-1全部，0进口，1出口 */
  companyType?: -1 | 0 | 1;
  /** 国家列表 */
  countryList?: Array<string>;
  /**  海关编码或产品描述 */
  hsCode?: string;
  /** 产品描述 */
  goodsShipped?: string;
  /** 其他语种产品描述 */
  otherGoodsShipped?: string[];
  /** 进出口类型：import/export */
  recordType?: CustomsRecordType;
  /** 港口类型：-1全部，0装货港，1目的港 */
  portType?: -1 | 0 | 1;
  /** 港口名称 */
  port?: string;
  /** 进口商名称 */
  conCompany?: string;
  /** 出口商名称 */
  shpCompany?: string;
  /** 进口国家地区 */
  conCountryList?: Array<string> | Array<Array<string>>;
  /** 出口商名称 */
  shpCountryList?: Array<string>;
  /** 搜索方式 */
  referer?: SearchReferer;
  /** 页码 */
  page: number;
  /** 每页条数 */
  size: number;
  /** 首页跳转 */
  conCountryListValue?: string[];
}

/** 国贸通海关单据数据 */
export interface CustomsRecord {
  /** @ApiModelProperty("数据来源:0盘聚，1国贸通")
   * private int sourceType;
   */
  sourceType: 0 | 1;

  /**  @ApiModelProperty("数据来源方ID")
  private String id; */
  id: string;

  /* 进口商信息 */
  /** @ApiModelProperty("格式化进口商名称")
  private String conName; */
  conName?: string;

  /** @ApiModelProperty("原始进口商名称")
  private String originConName; */
  originConName?: string;

  /** @ApiModelProperty("进口商所在国家")
  private String conCountry; */
  conCountry?: string;

  /** @ApiModelProperty("进口商所在城市")
   private String conCity; */
  conCity?: string;

  /** @ApiModelProperty("进口商详细地址")
   private String conFullAddress; */
  conFullAddress: string;

  /** @ApiModelProperty("进口商邮编")
  private String conPostalCode; */
  conPostalCode?: string;

  /** @ApiModelProperty("进口商联系人")
  private String consignee; */
  consignee?: string;

  /*国贸通新增字段*/
  /** @ApiModelProperty("进口商电话")
  private String conPhoneNum; */
  conPhoneNum?: string;

  /**  @ApiModelProperty("进口商电子邮件")
   private String conEmail; */
  conEmail?: string;

  /** @ApiModelProperty("进口商企业编码")
  private String conOrgCode; */
  conOrgCode?: string;

  /** @ApiModelProperty("进口商所在国家中文")
  private String conNameCn; */
  conCountryCn?: string;

  /** @ApiModelProperty("进口商网址")
  private String conWebUrl; */
  conWebUrl?: string;

  /* 出口商信息 */
  /** @ApiModelProperty("格式化出口商名称")
  private String shpName; */
  shpName?: string;

  /** @ApiModelProperty("原始出口商名称")
  private String originShpName; */
  originShpName?: string;

  /** @ApiModelProperty("出口商所在国家")
  private String shpCountry; */
  shpCountry?: string;

  /** @ApiModelProperty("出口商所在城市")
  private String shpCity; */
  shpCity?: string;

  /** @ApiModelProperty("出口商详细地址")
  private String shpFullAddress; */
  shpFullAddress?: string;

  /** @ApiModelProperty("出口商邮编")
  private String shpPostalCode; */
  shpPostalCode?: string;

  /**  @ApiModelProperty("出口商联系人")
   private String shipper; */
  shipper?: string;

  /*国贸通新增字段*/
  /**  @ApiModelProperty("出口商电话")
   private String shpPhoneNum; */
  shpPhoneNum?: string;

  /**  @ApiModelProperty("出口商电子邮件")
   private String shpEmail; */
  shpEmail?: string;

  /**  @ApiModelProperty("出口商企业编码")
   private String shpOrgCode; */
  shpOrgCode?: string;

  /** @ApiModelProperty("出口商所在国家中文")
  private String shpNameCn; */
  shpCountryCn?: string;

  /**  @ApiModelProperty("出口商网址")
   private String shpWebUrl; */
  shpWebUrl?: string;

  /* 海关信息 */
  /**  @ApiModelProperty("海关编码")
   private String hsCode; */
  hsCode?: string;

  /**  @ApiModelProperty("产品描述")
   private String goodsShipped; */
  goodsShipped?: string;

  /**  @ApiModelProperty("产销洲")
   private String originCountry; */
  originCountry?: string;

  /**  @ApiModelProperty("装货港")
   private String portOfLading; */
  portOfLading?: string;

  /**  @ApiModelProperty("目的港")
   private String portOfUnLading; */
  portOfUnLading?: string;

  /**  @ApiModelProperty("运输公司名称")
   private String carrier; */
  carrier?: string;

  /**  @ApiModelProperty("金额美元")
   private String valueOfGoodsUSD; */
  valueOfGoodsUSD?: string;

  /**  @ApiModelProperty("货物重量")
   private String weightKg; */
  weightKg?: string;

  /** @ApiModelProperty("数量")
  private String itemQuantity; */
  itemQuantity?: string;

  /**  @ApiModelProperty("数量单位")
   private String itemUnit; */
  itemUnit?: string;

  /**
   * @ApiModelProperty("到达日期")
   * private String arrivalDate;
   */
  arrivalDate?: string;

  /**  @ApiModelProperty("交易日期")
   private String shpmtDate; */
  shpmtDate?: string;

  /**  @ApiModelProperty("数据产生时间")
   private String createtime; */
  createtime?: string;

  /*国贸通新增字段*/
  /**  @ApiModelProperty("报关单号")
   private String declarationNum; */
  declarationNum?: string;

  /**  @ApiModelProperty("提关单号")
   private String billOfLadingNum; */
  billOfLadingNum?: string;

  /**  @ApiModelProperty("行业")
   private String industry; */
  industry?: string;

  /**  @ApiModelProperty("子行业")
   private String subIndustry; */
  subIndustry?: string;

  /**  @ApiModelProperty("集装箱数量")
   private String containerQuantity; */
  containerQuantity?: string;

  /**  @ApiModelProperty("净重")
   private String netWeight; */
  netWeight?: string;

  /**  @ApiModelProperty("毛重")
   private String grossWeight; */
  grossWeight?: string;

  /**  @ApiModelProperty("运费条款")
   private String freightClause; */
  freightClause?: string;

  /** @ApiModelProperty("贸易类型")
  private String tradeType; */
  tradeType?: string;
  /**  @ApiModelProperty("成交方式")
   private String tradeTerm; */
  tradeTerm?: string;
  /** @ApiModelProperty("贸易方式")
  private String tradeMode; */
  tradeMode?: string;
  /**  @ApiModelProperty("运输方式")
   private String transportMethod; */
  transportMethod?: string;

  /**  @ApiModelProperty("中转国")
   private String transitCountry; */
  transitCountry?: string;

  /**  @ApiModelProperty("国外港口")
   private String foreignPort; */
  foreignPort?: string;

  /**  @ApiModelProperty("当地港口")
   private String localPort; */
  localPort?: string;

  /**  @ApiModelProperty("船公司")
   private String shipCompany; */
  shipCompany?: string;

  /**   @ApiModelProperty("年份")
    private String year; */
  year?: string;

  /**   @ApiModelProperty("月度")
    private String month; */
  month?: string;

  /**  @ApiModelProperty("进出口")
   private String recordType; */
  recordType?: CustomsRecordType;

  /**
   * 重量单位
   */
  weightUnit?: string;
  /**
   * 重量公吨
   */
  weightT?: number;

  companyName?: string;

  country?: string;

  standardCountry?: string;

  recordId?: string;
}

export interface ResCustomsRecord {
  records: Array<CustomsRecord>;
  suggests?: string[];
  goodsShippedKeywords?: string[];
  total: number;
}

export type ContinentType = 'North America' | 'South America' | 'Asia' | 'Europe' | 'Africa' | 'Oceania';

export interface CustomsContinent {
  continentCn: ContinentType;
  continent: string;
  countries: Array<CustomsRecordCountry>;
}

export interface CustomsRecordCountry {
  /**
   *
   */
  code: string;
  /**
   * 国家名称
   */
  name: string;
  /**
   * 国家名称英文
   */
  nameCn: string;
}
export interface HScodeItem {
  child?: Array<HScodeItem> | null;
  parent?: HScodeItem | null;
  desc: string;
  hsCode: string;
}

export interface TCustomsPort {
  name: string;
  nameCn: string;
  recordCnt?: number;
  code?: string;
  timeFilter?: string;
  tags?: string[];
}

export interface IHotPortCollection {
  airline: string;
  ports: TCustomsPort[];
}

export interface ReqAddCompanySub {
  companyName: string;
  country: string;
  originCompanyName: string;
}

/**
 * 联想类型：0产品，1采购商，2供应商，3全部 4 港口
 * 当联想产品时，都传0
 * 当联想公司时，采购/供应（盘据）传对应类型，海关单据（国贸通）传全部
 */
export type SuggestType = 0 | 1 | 2 | 3 | 4 | 5;

export type SuggestOrigin = 'customs' | 'global_search' | 'smartrcmd' | 'tradeAnalysis' | 'hsCode';
export interface ReqSuggest {
  type: SuggestType;
  text: string;
  size?: number;
}

export interface ResSuggest {
  count: number;
  highlight: string;
  keyword: string;
  keywordCn?: string;
  country?: string;
  countryCn?: string;
  type?: 'import' | 'export';
}

export interface AiKeywordsSearchReq {
  type: number;
  language: string;
  size: number;
  text: string;
}

export interface CompanyExists {
  buyer: boolean;
  supplier: boolean;
  companyName: string;
  country: string;
  companyList: Array<MergeCompany>;
}

export interface globalCompanyExists {
  buyer: boolean;
  supplier: boolean;
  companyList: Array<{ companyName: string; coutry: string; originCompanyName: string }>;
  country: string;
}

export interface customsDeepTask {
  id: string;
  status: string;
  grubCount: number;
  code: string;
  taskKey: string;
  condition: reqBuyers;
}

export const enum ForwarderType {
  Port,
  AirLine,
}

export interface OptionValueType {
  value: string;
  label: string;
}

export interface ReqForwarder extends Omit<reqBuyers, 'type' | 'queryValue'> {
  queryType: ForwarderType;

  isHuodaiQuery?: boolean;
  // 入口港
  portOfLadings?: OptionValueType[];
  // 出口港
  portOfUnLadings?: OptionValueType[];
  // 航线
  airlines?: OptionValueType[];
  // 全部未浏览
  notViewed?: boolean;
  // 我未浏览
  excludeViewed?: boolean;
  // 关键词列表
  queryKeys: string[];
  // 货运类型
  freightTypeList?: number[];
}

export interface ForwarderRecordItem extends customsRecordItem {
  /**
   *  中国公司是否可挖掘
   *  0 可挖掘 1 已经挖掘 其他都不可挖掘
   */
  excavateCnCompanyStatus?: 0 | 1 | null;
  // 挖掘后的关联公司ID
  chineseCompanyId?: string;
  // 联系人数量
  chineseCompanyContactCount?: number;
  // 联系人数量
  contactCount?: number;
  // 邮箱数量
  emailCount?: number;
  // 电话数量
  phoneCount?: number;
  // 社交媒体数量
  socialCount?: number;
  // 关联公司名称
  companyCnName?: string;
  // top10国家中文
  topNRelationsCountryZhs?: string[];
  // top10国家
  topNRelationsCountrys?: string[];
  chineseCompanyCount?: number;
  viewCount?: number;
  viewCountDesc?: string;
  // top10hscode及描述
  topNHscodes?: Array<{
    hsCode?: string;
    hsCodeDesc?: string;
    highLightHsCode?: string;
    hasChildNode?: boolean;
    highLight?: {
      type?: string;
      value?: string;
    };
  }>;
  companyAllTransactions?: string;
  topNHuoDaiCountries?: Array<{
    allCount: number;
    country: string;
    countryCn: string;
    desc: string;
    highLight: string;
    transCount: string;
  }>;
}

export type ResForwarder = resBuyers<ForwarderRecordItem>;

export interface AirlineItem extends TCustomsPort {}

interface RuleSaveReq {
  type: Number;
  companyType: number;
  middleCustomsCompanyIdList: string[];
  countryList?: string[];
}

export interface FissionRuleSaveReq extends RuleSaveReq {
  collectId: number;
}

export interface ImportRuleSaveReq extends RuleSaveReq {
  importId: number;
}

export interface ExcavateCompanyReq {
  companyName: string;
  country: string;
}
export interface UserLogReq {
  companyName?: string;
  startTime?: string;
  endTime?: string;
  status?: number;
  page: number;
  size: number;
}

export interface ExcavateCompanyItem {
  id: string;
  chineseCompanyId: string;
  chineseName?: string;
  companyNameId?: string;
  countryId?: string;
  legalPerson?: string;
  registeredAddress?: string;
  registeredCapital?: string;
  registerDate?: string;
  logo?: string;
  project?: string;
  status?: string;
  visited?: string;
  countryRegion?: string;
  staffSize?: string;
  website?: string;
  industry?: string;
  businessScope?: string;
  indus?: string;
  contactCount?: number;
  businessStatus?: string;
  recommendLabel?: string;
  clueStatus?: number;
}

export interface UserQuotaItem {
  dayOrgDetailQuotaTotal?: number;
  dayOrgDetailQuotaUsed?: any;
  dayAccountDetailQuotaTotal?: number;
  dayAccountDetailQuotaUsed?: any;
}
export interface UserLogItem {
  address?: string;
  businessScope?: string;
  businessStatus?: string;
  chineseCompanyId: string;
  chineseName?: string;
  chineseNameHighlight?: string;
  clueStatus?: number;
  companyTags?: string[];
  contactCount?: number;
  // contactList
  // countryRegion
  id: string;
  industry?: string;
  legalPerson?: string;
  queryTime?: string;
  recommendLabel?: string;
  // registerDate
  registeredAddress?: string;
  // registeredCapital
  // simpleHref
  // staffSize
  standardNameAndCountry?: string;
  status?: string;
  // viewAccountIdList
  // visited
  website?: string;
  logId?: number;
  customsCompanyName?: string;
  customsCompanyType?: string;
  customsCountry?: string;
}

export interface ExcavateContactList {
  // 1：手机、2：邮箱、3：座机、4：微信、5：QQ、6：其他
  //1：手机；2：固话；3：邮箱；4：传真；5：QQ；6：其他；7：微信
  contactType?: '1' | '2' | '3' | '4' | '5' | '6' | '7';
  contactInfo?: string;
  person?: string;
  remark?: string;
  labels?: string;
  position?: string;
}

export interface ExcavateCompanyDetail extends ExcavateCompanyItem {
  contactList?: Array<ExcavateContactList>;
}

export interface ForwarderTopSearchReq {
  // 最少条数
  size?: number;
  // topN条
  topN?: number;
}

export type ForwarderPortSuggestReq = Omit<ReqSuggest, 'type'>;

export interface ForwarderSearchTop {
  portOfLadings?: AirlineItem[];
  portOfUnLadings?: AirlineItem[];
  airlines?: AirlineItem[];
  timeCond?: string;
}

export interface CommonlyUsePort {
  country: Pick<resCustomsFollowCountry, 'country' | 'countryChinese'>;
  ports: TCustomsPort[];
}

export const enum CommonlyUsePortType {
  CN,
  Collection,
}

export interface TradeReq {
  countryList?: string[];
  dimensionType: string;
  queryValue: string;
  needTopCountry?: boolean;
  type: '1' | '2' | '3';
}

export interface PurchaseResult {
  label: string;
  value: number;
  labelDesc?: string;
  unit?: string;
  topCountry?: string;
}

export interface DistributionFormData {
  avgAmountByQuantity: number;
  avgAmountByWeight: number;
  companyName: string;
  country: string;
  maxTradingDate: string;
  minTradingDate: string;
  percentAmount: string;
  percentCount: string;
  sumAmount: string;
  sumCount: string;
  sumQuantity: string;
  sumWeight: string;
  countryCn: string;
  topHsCodes: Array<{
    hsCode: string;
    hsCodeDesc: string;
  }>;
}

export interface DistributionResult {
  formData: Array<DistributionFormData>;
  pieData: Array<{
    label: string;
    value: number;
  }>;
}

export interface TradeALlReq {
  gloBuyTrend: TradeReq;
  buyArea: TradeReq;
  targetMarket: TradeReq;
  mainMarket: TradeReq;
  targetArea: TradeReq;
}

export type TimeFilter = 'last_five_year' | 'last_three_year' | 'last_one_year' | 'all';
export interface TradeCompanyReq {
  companyName: string;
  country: string;
  dimensionType: string;
  hscodeType: '1' | '2';
  recordType?: 'import' | 'export' | undefined | 'peers';
  timeFilter?: TimeFilter;
}

export interface TradeRouteResult {
  combLabel: string;
  subData: PurchaseResult[];
}

export interface TradeValue {}
export interface AirRouteStatResult {
  [country: string]: Array<PurchaseResult>;
}

export interface TradeForwarder {
  airRouteStatResult: AirRouteStatResult;
  goodsTypeStatResult: PurchaseResult[];
  transportCompanyStatResult: PurchaseResult[];
  transportMethodStatResult: PurchaseResult[];
}

export interface TradeCopmayAllReq {
  gloBuyTrend: TradeCompanyReq;
  goodsDistribution: TradeCompanyReq;
  goodsCategory: TradeCompanyReq;
  // routeDistribution: TradeCompanyReq;
  // transportPrecent: TradeCompanyReq;
  // shipPrecent: TradeCompanyReq;
  supplierTop: TradeCompanyReq;
  productKey: TradeCompanyReq;
  hsCodeRank: TradeCompanyReq;
}

export interface CompanyTrend {
  quantity: PurchaseResult[];
  transaction_count: PurchaseResult[];
  value_of_goods: PurchaseResult[];
  weight: PurchaseResult[];
}

export interface HotProductRank {
  order: number;
  productName: string;
  showProductName: number;
  sumAmount: number;
  sumCount: number;
  sumWeight: number;
}

export interface LogSave {
  companyName?: string;
  country?: string;
  searchValue?: string;
  type: '1' | '2' | '3' | '4';
}

export interface HasQuantity {
  dayResidualQuota: number;
  dayTotalQuota: number;
}

export interface HistoryItem {
  type: number;
  value: string;
  watchTime: string;
  country?: string;
  recordType?: 'import' | 'export';
}

export interface SearchJudge {
  companyName: string;
  country?: string;
  searchValue?: string;
  type: string;
}

export interface SearchJudgeResult {
  recordType: string;
  searchFlag: boolean;
}

export interface GuessAndSaveParam {
  id: string;
  name: string;
}

export type CompanyListReq = Array<{
  companyName: string;
  country?: string;
  originCompanyName?: string;
}>;

export type FreightReq = Omit<reqBuysersBase, 'companyName'> & {
  companyList: CompanyListReq;
  beginDate?: string;
  endDate?: string;
  sourceType?: 'customs' | 'global' | 'transport';
};

export interface FreightRelationReq {
  companyList: CompanyListReq;
  conCountryList?: string[];
  endYear?: string;
  from?: number;
  mergedCompanyNames?: string[];
  order?: string;
  recordType?: string;
  relationCountry?: string[];
  shpCountryList?: string[];
  size?: number;
  sortBy?: string;
  startYear?: string;
  transportCustomerStatCountry?: string;
  sourceCompanyList?: CompanyListReq;
  beginDate?: string;
  endDate?: string;
  sourceType?: 'customs' | 'global' | 'transport';
}

export interface FreightRelationResCom {
  chineseCompanyContactCount: number;
  chineseCompanyId?: number;
  companyCnName: string;
  companyName: string;
  country: string;
  percentage?: string;
}

export interface FreightRelationRes {
  from: number;
  size: number;
  total: number;
  companies: Array<FreightRelationResCom>;
}

export interface FreightAreaReq {
  recordType: string;
  companyList: CompanyListReq;
  endYear: string;
  startYear: string;
  beginDate?: string;
  endDate?: string;
  sourceType?: 'customs' | 'global' | 'transport';
}

export interface TransportTradeReq {
  nameAndCountry: string;
  dimensionType?: string;
  timeFilter: string;
  orderBy?: string;
  page?: number;
  recordType?: string;
  size?: number;
}

export interface TradeportProRes {
  containerStatResult: TradeportValue[];
  goodsTypeStatResult: TradeportValue[];
  transportMethodStatResult: TradeportValue[];
}

export interface TradeportValue {
  label: string;
  labelDesc: string;
  topCountry: string;
  unit: string;
  value: number;
}

export interface FreightAreaRes {
  countryTop5PortCountMap: {
    [key: string]: TradeportValue[];
  };
  pieData: {
    label: string;
    labelDesc: string;
    topCountry: string;
    unit: string;
    value: number;
  }[];
}
export interface GuessAndSaveResult {
  [key: string]: string;
}

export type TradeData = [PurchaseResult[], DistributionResult, PurchaseResult[], DistributionResult, DistributionResult];

export type TradeCompanyData = [CompanyTrend, PurchaseResult[], PurchaseResult[], TradeForwarder, PurchaseResult[], DistributionFormData[]];
