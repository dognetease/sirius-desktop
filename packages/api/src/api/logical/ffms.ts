import { Api } from '../_base/api';
import { ApiRequestConfig } from '../data/http';

export namespace FFMS {
  export interface OrderListReq {
    status: string;
    pageSize: number;
    page: number;
  }

  export interface OrderInfo {
    id: string;
    status: string;
  }

  export interface OrderListRes {
    list: OrderInfo[];
    total: number;
  }

  export interface OrderDetail {
    id: string;
  }

  export enum OrderStatus {
    Waiting = 'Waiting',
    Following = 'Following',
    Complete = 'Complete',
  }

  export interface CustomerTypeItem {
    customerType: string;
    customerTypeId: string;
    customerTypeName: string;
  }
}

export namespace FFMSLevelAdmin {
  export interface ListItem {
    advance: string;
    advance20gp: string;
    advance40gp: string;
    advance40hc: string;
    createAt: string;
    discount: string;
    levelId: string;
    levelName: string;
    defaultLevel: boolean;
  }
  export interface List {
    content: ListItem[];
  }
  export interface ListReq {
    pageSize: number;
    page: number;
  }
  export interface Add {
    defaultLevel: boolean;
    levelId?: string;
    levelName: string;
    advance20gp: string;
    advance40gp: string;
    advance40hc: string;
  }
  export interface Delete {
    levelIdList: string[];
  }

  export enum CUSTOMER_TYPE {
    TERMINAL_CLIENT = 'TERMINAL_CLIENT',
    CO_LOADER = 'CO_LOADER',
    POTENTIAL_CLIENT = 'POTENTIAL_CLIENT',
  }

  export interface DiscountType {
    discountType: 'PERCENT' | 'MONEY';
  }
}

export namespace FFMSCustomer {
  export interface ChangeType {
    customerIdList: string[];
    customerTypeId: string;
    accountId?: string;
  }
  export interface AddType {
    advance: string;
    customerTypeId?: string;
    customerTypeName?: string;
    customerType?: FFMSLevelAdmin.CUSTOMER_TYPE;
  }

  export interface TypeItem {
    advance: string;
    color: string;
    customerType: string;
    customerTypeId: string;
    customerTypeName: string;
    discount: string;
    updateAt: string;
    defaultType: boolean;
  }

  export interface TypeReq {
    customerType: FFMSLevelAdmin.CUSTOMER_TYPE;
    accountId?: string;
  }

  export interface TypeList {
    content: TypeItem[];
    totalPage: number;
    totalSize: number;
  }

  export interface DeleteType {
    customerTypeIdList: string[];
  }

  export interface DiscountItem {
    advance: string;
    discount: string;
  }

  export interface DiscountReq {
    customerType: FFMSLevelAdmin.CUSTOMER_TYPE;
  }
  export interface DiscountRes {
    coLoader: DiscountItem;
    terminalClient: DiscountItem;
  }

  export interface AddDiscount {
    advance: string;
    customerType?: FFMSLevelAdmin.CUSTOMER_TYPE;
    customerTypeId?: string;
  }
  export interface Delete {
    customerIdList: string[];
    accountId?: string;
  }

  export interface ListItem {
    advance: string;
    advance20gp: string;
    advance40gp: string;
    advance40hc: string;
    createAt: string;
    customerId: string;
    customerTypeId: string;
    customerName: string;
    customerType: string;
    discount: string;
    email: string;
    edmEmailId: string;
    edmSubject: string;
    finalDiscount: string;
    finalPrice20gp: string;
    finalPrice40gp: string;
    finalPrice40hc: string;
    levelName: string;
    phoneNumber: string;
    unsubscribed: boolean;
    searchCompany: {
      country: string;
      id: string;
      name: string;
      relEmail: string;
    };
  }

  export interface List {
    content: ListItem[];
    totalPage: number;
    totalSize: number;
  }
  export interface ListReq {
    pageSize: number;
    page: number;
    customerTypeId: string;
    searchLevelIds?: string;
    fuzzySearch?: string;
    sort?: string;
  }

  export interface SaveReq {
    customerTypeId: string;
    email: string;
    phoneNumber: string;
    customerId?: string;
    levelId?: string;
    customerName?: string;
  }

  export interface EditLevel {
    customerIdList: string[];
    levelId: string;
    accountId?: string;
  }

  export interface CustomerTemplate {
    filename: string;
    url: string;
  }

  export interface UploadRes {
    errorCount: number;
    repeatCount: number;
    successCount: number;
    totalCount: number;
  }

  export interface CustomerTypeStatusItem {
    customerType: string;
    customerTypeConfigStatus: string;
  }

  export interface CustomerTypeStatus {
    configStatusList: CustomerTypeStatusItem[];
  }
}

export namespace FFMSRate {
  export interface Carrier {
    carrier: string;
    cnName: string;
  }

  export type CarrierList = Array<Carrier>;

  export interface ListReq {
    pageSize: number;
    page: number;
    sailingDateScope: string;
    searchCarrierList: string[];
    searchPortList: string[];
    updateDateScope: string;
    expireFreight?: boolean;
    sort?: string;
    createDateScope?: string;
  }
  export interface ListItem {
    arriveDate: string;
    carrier: string;
    createAt: string;
    departurePortCode: string;
    departurePort: {
      cnName: string;
      code: string;
      countryCnName: string;
      enName: string;
    };
    destinationPortCode: string;
    destinationPort: {
      cnName: string;
      code: string;
      countryCnName: string;
      enName: string;
    };
    expiryDate: string;
    freightId: string;
    price: string;
    price20GP: string;
    price40GP: string;
    price40HC: string;
    special: string;
    route: string;
    sailingDate: string;
    updateAt: string;
    vessel: string;
    voyage: number;
    existHistory: boolean;
    freightHistoryId: string;
    bookingCount?: number;
    rowId?: number | string;
    freightDraftId: string;
    reason?: string;
    tagList?: string[];
    pushCustomerCount: number;
    freightCarrier: {
      carrier: string;
      cnName: string;
    };
  }

  export interface TextReq {
    text: string;
  }

  export interface List {
    content: ListItem[];
    totalPage: number;
    totalSize: number;
  }

  export interface SaveReq {
    arriveDate: string;
    carrier: string;
    departurePortCode: string;
    destinationPortCode: string;
    expiryDate: string;
    voyage: number;
    freightId?: string;
    freightDraftId?: string;
    price: string;
    special: string;
    route: string;
    sailingDate: string;
    vessel: string;
  }

  export interface BatchSaveReq {
    freightRateList: SaveReq[];
  }

  export interface DeleteRate {
    freightIdList: string[];
  }
  export interface PortItem {
    cnName: string;
    code: string;
    countryCnName: string;
    enName: string;
    route: string;
  }

  export interface Option {
    label: string;
    value: string;
  }

  export interface RouteOption {
    label: string;
    value: string | number;
    route: string;
    searchText: string;
  }

  export type PortList = PortItem[];

  export interface ImportReq {
    analyzeId: string;
  }

  export interface AnalyzeRes {
    analyzeId: string;
    filename: string;
    filesize: string;
    invalidCount: number;
    totalCount: number;
    validCount: number;
  }

  export interface DraftListReq {
    pageSize: number;
    page: number;
    sort?: string;
    updateDateScope?: string;
  }

  export interface DraftItem {
    arriveDate: string;
    carrier: string;
    departurePort: string;
    destinationPort: string;
    expiryDate: string;
    freightDraftId: string;
    price: string;
    route: string;
    sailingDate: string;
    special: string;
    vessel: string;
    voyage: number;
    reason: string;
  }

  export interface PortDraftList {
    content: DraftItem[];
    totalPage: number;
    totalSize: number;
  }

  export interface DraftDetailReq {
    freightDraftId: string;
  }

  export interface DraftDetailRes {
    analyzeDetail: DraftItem;
    draftDetail: DraftItem;
    freightDraftId: string;
  }
  export interface DeleteDraftItem {
    freightDraftIdList: string[];
  }

  export interface ImportInfo {
    countDownSeconds: number;
    invalidCount: number;
    validCount: number;
    updateCount: number;
    fileName: string;
    importType: 'FILE' | 'PICTURE' | 'TEXT';
  }
  export interface WhiteList {
    whitelist: boolean;
  }

  export interface PriceUploadRes {
    analyzeId: string;
    filename: string;
    filesize: string;
    invalidCount: number;
    totalCount: number;
    validCount: number;
  }

  export interface PricePicRes {
    data: string[][];
    filename: string;
    mappingRules: { label: string; value: string; index: number }[];
  }

  export interface SaveAnalyzePrice {
    data: string[][];
    map: boolean;
    filename: string;
    mappingRules: { label: string; value: string; index: number }[];
  }

  export interface SaveAnalyzePriceRes {
    invalidCount: number;
    repeatCount: number;
    totalCount: number;
    validCount: number;
  }

  export interface StandardField {
    label: string;
    required: boolean;
    value: string;
    index: number;
    codeIndex?: number;
  }

  export interface HistoryReq {
    freightId: string;
    page: number;
    pageSize: number;
    sort?: string;
  }

  export interface HistoryRes {
    content: ListItem[];
    totalPage: number;
    totalSize: number;
  }

  export interface PushedCustomerReq {
    freightHistoryId: string;
    page: number;
    pageSize: number;
  }

  export interface PushedCustomer {
    contactEmail: string;
    price: {
      price20gp: number;
      price40gp: number;
      price40hc: number;
    };
  }

  export interface PushedCustomerRes {
    content: PushedCustomer[];
    totalSize: number;
  }
}

export namespace FFMSOverView {
  export interface PortInfo {
    cnName: string;
    code: string;
    countryCnName: string;
    enName: string;
  }

  export interface ListReq {
    departurePortCode?: string;
    destinationPortCode?: string;
    expireFreight?: boolean;
    page: number | string;
    pageSize: number | string;
    sailingDateScope?: string;
    searchCarrierList?: string[];
    sort?: string;
  }

  export interface ListRow {
    arriveDate: string;
    carrier: string;
    createAt: string;
    departurePort: PortInfo;
    destinationPort: PortInfo;
    expiryDate: string;
    freightId: string;
    price: string;
    price20GP: string;
    price40GP: string;
    price40HC: string;
    route: string;
    sailingDate: string;
    special: boolean;
    updateAt: string;
    vessel: string;
    voyage: string;
    isFixed?: boolean;
    fixedIndex?: number;
    tagList: FreightTag[];
    owner: boolean;
    freightCarrier: {
      carrier: string;
      cnName: string;
    };
  }

  export interface ListRes {
    content: ListRow[];
    totalSize: number;
  }

  export enum FreightTag {
    FASTEST = 'FASTEST',
    EARLIEST = 'EARLIEST',
    CHEAPEST = 'CHEAPEST',
    AVAILABLE_BOOKING = 'AVAILABLE_BOOKING',
  }
}

export namespace FFMSOrder {
  export enum ORDER_TYPE {
    'NOT_FOLLOWED' = 'NOT_FOLLOWED',
    'FOLLOWING' = 'FOLLOWING',
    'COMPLETED' = 'COMPLETED',
  }

  export enum NEXT_ORDER_TYPE {
    'NOT_FOLLOWED' = 'FOLLOWING',
    'FOLLOWING' = 'COMPLETED',
    'COMPLETED' = '',
  }

  export interface ListReq {
    pageSize: number;
    page: number;
    followStatus?: ORDER_TYPE;
    freightHistoryId?: string;
    sort?: string;
  }

  export interface ListItem {
    advance: string;
    advance20gp: string;
    advance40gp: string;
    advance40hc: string;
    bookingAt: string;
    bookingId: string;
    completedAt: string;
    customerId: string;
    customerName: string;
    customerType: string;
    customerTypeColor: string;
    customerTypeName: string;
    discount: string;
    email: string;
    freightId: string;
    levelName: string;
    phoneNumber: string;
    containerPrice: string;
  }

  export interface List {
    content: ListItem[];
    totalPage: number;
    totalSize: number;
  }
  export interface BookStatus {
    bookingId: string;
    followStatus: ORDER_TYPE;
  }
  export interface FollowReq {
    bookingId: string;
    content: string;
  }
  export interface DetailReq {
    bookingId: string;
  }

  export interface BookingFollowItem {
    content: string;
    followAt: string;
  }
  export interface DetailRes {
    customerDetail: {
      advance: string;
      advance20gp: string;
      advance40gp: string;
      advance40hc: string;
      createAt: string;
      customerId: string;
      customerName: string;
      customerType: string;
      discount: string;
      email: string;
      finalDiscount: string;
      levelName: string;
      phoneNumber: string;
    };
    freightBookingDetail: {
      bookingAt: string;
      bookingId: string;
      completedAt: string;
      count20gp: string;
      count40gp: string;
      count40hc: string;
      price20GP: string;
      price40GP: string;
      price40HC: string;
      followStatus: string;
      special: boolean;
      totalPrice: string;
    };
    freightBookingFollowList: BookingFollowItem[];
    freightRateDetail: FFMSRate.ListItem;
  }

  export interface DeleteBookReq {
    bookingIdList: string[];
  }
  export interface Status {
    redDot: boolean;
  }
}

export namespace FFMSStatic {
  export enum StaticType {
    PLATFORM = 'PLATFORM',
    MINE = 'MINE',
  }

  export interface PortStateReq {
    departurePortCode?: string;
    destinationPortCode?: string;
    visitDateScope: string;
    type: StaticType;
    page?: number;
    pageSize?: number;
  }

  // export interface PortStateListReq {
  //   departurePortCode?: string;
  //   destinationPortCode?: string;
  //   visitDateScope: string;
  //   type: StaticType;
  // }

  export interface PortStateRes {
    content: PortState[];
    totalSize: number;
  }

  export interface PortState {
    departurePort: PortInfo;
    destinationPort: PortInfo;
    exposureSum: number;
    operateSum: number;
    querySum: number;
  }

  export interface VisitListReq {
    type: StaticType;
    visitDateScope: string;
    customerType: string;
    customerTypeId: string;
    haveEmail: string | boolean;
    page: number;
    pageSize: number;
    sort?: string;
    departurePortCode?: string;
    destinationPortCode?: string;
  }

  export enum CustomerType {
    TERMINAL_CLIENT = 'TERMINAL_CLIENT',
    CO_LOADER = 'CO_LOADER',
    POTENTIAL_CLIENT = 'POTENTIAL_CLIENT',
  }

  export interface VisitListItem {
    customerName: string;
    customerType: CustomerType;
    email: string;
    visitAt: string;
    visitId: string;
    visitTime: string;
    booking: boolean;
    customerTypeName: string;
    customerTypeColor: string;
  }

  export interface VisitListRes {
    content: VisitListItem[];
    totalSize: number;
  }

  export interface PortInfo {
    cnName: string;
    code: string;
    countryCnName: string;
    enName: string;
  }

  export interface CarrierInfo {
    carrier: string;
    cnName: string;
  }

  export interface VisitDetailContent {
    arriveDate: string;
    carrier: string;
    createAt: string;
    departurePort: PortInfo;
    departurePortCode: string;
    destinationPort: PortInfo;
    destinationPortCode: string;
    expiryDate: string;
    freightCarrier: CarrierInfo;
    freightId: string;
    owner: boolean;
    price: string;
    price20GP: string;
    price40GP: string;
    price40HC: string;
    route: string;
    sailingDate: string;
    special: boolean;
    tagList: string[];
    updateAt: string;
    vessel: string;
    voyage: string;
  }

  export enum OperateType {
    SEARCH = 'SEARCH',
    BOOKING = 'BOOKING',
    COLLECT = 'COLLECT',
    DETAIL = 'DETAIL',
  }

  export interface VisitDetailReq {
    visitId: string;
    page: number;
    pageSize: number;
  }

  export interface VisitDetailItem {
    content: VisitDetailContent;
    departurePort: PortInfo;
    destinationPort: PortInfo;
    operateAt: string;
    operateId: string;
    operateType: OperateType;
  }

  export interface VisitDetailRes {
    content: VisitDetailItem[];
    totalSize: number;
  }

  export interface VisitStaticReq {
    type: StaticType;
    visitDateScope: string;
  }

  export interface VisitStatic {
    date: string;
    start: string;
    end: string;
    statistics: Array<{ name: string; count: number; customerTypeId: string }>;
  }
}

export namespace FFMSSite {
  export interface SiteInfo {
    domain: string;
    shareId: string;
    siteId: string;
  }
}

export namespace FFMSPriceHistory {
  export interface EdmJob {
    createTime: string;
    edmEmailId: string;
    edmSubject: string;
    freightHistoryId: string;
    freightId: string;
  }

  export interface EdmJobRes {
    content: EdmJob[];
    totalSize: number;
  }

  export interface EdmJobContact {
    contactEmail: string;
    price: { price20gp: number; price40gp: number; price40hc: number };
  }

  export interface EdmJobDetail {
    arriveList: EdmJobContact[];
    receiverList: EdmJobContact[];
    readList: EdmJobContact[];
    replyList: EdmJobContact[];
    edmSendboxEmailInfo: {
      sendCount: number;
      arriveCount: number;
      readCount: number;
      replyCount: number;
      contactsCount: number;
    };
  }
}

export interface FFMSApi extends Api {
  getOrderList(): Promise<FFMS.OrderListRes>;
  getOrderDetail(req: FFMSRate.DraftDetailReq): Promise<FFMS.OrderDetail>;
  addFfCustomerLevel(req: FFMSLevelAdmin.Add): Promise<boolean>;
  getFfCustomerLevelList(req: FFMSLevelAdmin.ListReq): Promise<FFMSLevelAdmin.List>;
  deleteFfCustomerLevel(req: FFMSLevelAdmin.Delete): Promise<boolean>;
  getDiscount(): Promise<FFMSCustomer.DiscountRes>;
  getFfGlobalDiscountList(req: FFMSCustomer.DiscountReq): Promise<FFMSCustomer.DiscountRes>;
  saveDiscount(req: FFMSCustomer.AddDiscount): Promise<boolean>;
  deleteFfCustomer(req: FFMSCustomer.Delete): Promise<boolean>;
  getFfCustomerList(req: FFMSCustomer.ListReq): Promise<FFMSCustomer.List>;
  saveFfCustomer(req: FFMSCustomer.SaveReq): Promise<boolean>;
  changeFfCustomerLevel(req: FFMSCustomer.EditLevel): Promise<boolean>;
  ffCustomerTemplate(): Promise<FFMSCustomer.CustomerTemplate>;
  ffRateTemplate(): Promise<FFMSCustomer.CustomerTemplate>;
  ffRateList(req: FFMSRate.ListReq): Promise<FFMSRate.List>;
  ffCustomerUpload(req: FormData): Promise<FFMSCustomer.UploadRes>;
  saveFfRate(req: FFMSRate.SaveReq): Promise<boolean>;
  deleteFfRate(req: FFMSRate.DeleteRate): Promise<boolean>;
  ffPortList(): Promise<FFMSRate.PortList>;
  ffCarrierList(): Promise<FFMSRate.CarrierList>;
  saveFfUploadData(req: FFMSRate.ImportReq): Promise<boolean>;
  ffRateDraftList(req: FFMSRate.DraftListReq): Promise<FFMSRate.PortDraftList>;
  ffRateDraftDetail(req: FFMSRate.DraftDetailReq): Promise<FFMSRate.DraftDetailRes>;
  deleteFfRateDraft(req: FFMSRate.DeleteDraftItem): Promise<boolean>;
  ffImportRecallInfo(): Promise<FFMSRate.ImportInfo>;
  ffImportRecall(): Promise<boolean>;
  ffOverviewList(req: FFMSOverView.ListReq): Promise<FFMSOverView.ListRes>;
  ffWhiteList(): Promise<FFMSRate.WhiteList>;
  ffGetShareLink(): Promise<{ url: string }>;
  ffBookList(req: FFMSOrder.ListReq): Promise<FFMSOrder.List>;
  changeffBookStatus(req: FFMSOrder.BookStatus): Promise<boolean>;
  saveFfFollow(req: FFMSOrder.FollowReq): Promise<boolean>;
  getFfBookDetail(req: FFMSOrder.DetailReq): Promise<FFMSOrder.DetailRes>;
  getFfBookingStatus(): Promise<FFMSOrder.Status>;
  deleteFfBook(req: FFMSOrder.DeleteBookReq): Promise<boolean>;
  getPortState(req: FFMSStatic.PortStateReq): Promise<FFMSStatic.PortStateRes>;
  // getPortStateList(req: FFMSStatic.PortStateListReq): Promise<FFMSStatic.PortStateListRes>;
  getVisiteList(req: FFMSStatic.VisitListReq): Promise<FFMSStatic.VisitListRes>;
  getVisiteDetail(req: FFMSStatic.VisitDetailReq): Promise<FFMSStatic.VisitDetailRes>;
  getVisiteState(req: FFMSStatic.VisitStaticReq): Promise<FFMSStatic.VisitStatic[]>;
  checkSiteId(siteId: string): Promise<boolean>;
  getOrgSite(): Promise<FFMSSite.SiteInfo>;
  saveSiteId(siteId: string): Promise<void>;
  saveFfCustomerType(req: FFMSCustomer.AddType): Promise<boolean>;
  getFfCustomerTypeList(req: FFMSCustomer.TypeReq): Promise<FFMSCustomer.TypeList>;
  deleteFfCustomerType(req: FFMSCustomer.DeleteType): Promise<boolean>;
  changeCustomerType(req: FFMSCustomer.ChangeType): Promise<boolean>;
  getCustomerTypeOptions(): Promise<{ content: FFMS.CustomerTypeItem[] }>;
  uploadFfmsPrice(req: FormData, config?: ApiRequestConfig): Promise<FFMSRate.PriceUploadRes>;
  ffmsAnalyzePicture(req: FormData, config?: ApiRequestConfig): Promise<FFMSRate.PricePicRes>;
  saveFfmsAnalyzePicture(req: FFMSRate.SaveAnalyzePrice): Promise<FFMSRate.SaveAnalyzePriceRes>;
  getFfmsPriceTitle(): Promise<FFMSRate.StandardField[]>;
  changeFfmsDiscountType(req: FFMSLevelAdmin.DiscountType): Promise<boolean>;
  getFfmsDiscountType(): Promise<FFMSLevelAdmin.DiscountType>;
  getFfmsCustomerConfigType(): Promise<FFMSCustomer.CustomerTypeStatus>;
  getFFmsRateHistoryList(req: FFMSRate.HistoryReq): Promise<FFMSRate.HistoryRes>;
  ffPermissionsPortList(): Promise<FFMSRate.PortItem[]>;
  ffPermissionsDeparturePort(): Promise<FFMSRate.PortItem[]>;
  ffAnalyzeText(req: FFMSRate.TextReq): Promise<FFMSRate.List>;
  batchSaveFfPrice(req: FFMSRate.BatchSaveReq): Promise<boolean>;
  getPushedCustomerList(req: FFMSRate.PushedCustomerReq): Promise<FFMSRate.PushedCustomerRes>;
  pushToCustomer(freightHistoryId: string[]): Promise<boolean>;
  getEdmJobList(freightHistoryId: string): Promise<FFMSPriceHistory.EdmJobRes>;
  getEdmJobDetail(freightHistoryId: string, edmEmailId: string): Promise<FFMSPriceHistory.EdmJobDetail>;
  getDefaultCustomerList(page: number, pageSize: number): Promise<FFMSCustomer.List>;
}
