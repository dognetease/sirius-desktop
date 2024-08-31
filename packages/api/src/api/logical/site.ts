import { Api } from '../_base/api';

interface ResponseData<T> {
  code: number;
  message: string;
  success: boolean;
  data?: T;
}

/* 我的站点 */
export interface PageItem {
  checksum?: string;
  code?: string;
  contentNosKey?: string;
  deleted?: boolean;
  modifyTime: number;
  orgId?: string;
  pageName?: string;
  pathCode?: string;
  siteId?: string;
  status: string;
  thumbnail: string;
  showOrder: number;
  type?: string;
  homePage: boolean;
  pageId: string;
}

export interface SiteItem {
  indexUrl: string;
  pages: PageItem[];
  siteId: string;
  siteName: string;
  status: string;
  templateId: string;
  host: string;
  orgId: string;
  isAddProduct: boolean;
  isAddCert: boolean;
  isAddSeoConfig: boolean;
  isBindDomain: boolean;
  siteBindDomainList?: Array<any>;
  isOuterSite?: boolean;
  outerKey?: string;
  productServiceDTO?: Record<string, string>;
  icon?: string;
}

export interface SiteLatestDataReq {
  type: string;
}

export interface GetTemplateDataReq {
  templateType?: 'LANDING_PAGE' | ''; // 传 'LANDING_PAGE' 表示营销落地页的模板，如果不传这个参数默认为“我的站点”模板
  tagId?: string;
  pageNo?: number;
  pageSize?: number;
}

export interface GetSiteDomainListReq {
  isShowOuterSite: boolean; // true 表示显示外部站点，站点数据那块传true, 营销邮件那块传false
}

export interface CreateSitePageReq {
  templateId: string;
  siteId: string;
  siteName: string;
}
export interface DeleteSitePageReq {
  siteId: string;
}

export interface OfflineSiteReq {
  siteId: string;
}

export interface UpdateSiteNameReq {
  siteId: string;
  siteName: string;
  icon?: string;
}

export interface GetSeoConfigReq {
  siteId: string;
}

export interface SitePageSeoConfigItem {
  keyword: string;
  title: string;
  description: string;
}
export interface siteSeoConfigItem {
  pushed: boolean;
  sitemap: string;
}

export interface GetSeoConfigRes {
  sitePageSeoConfig: SitePageSeoConfigItem[];
  siteSeoConfig: siteSeoConfigItem[];
}

export interface UpdatePageSeoConfigReq {
  siteId: string;
  pageId: string;
  title: string;
  keyword: string;
  description: string;
}

export interface UpdateSiteSeoConfigReq {
  siteId: string;
  type: string;
  pushed: boolean;
}

export interface GetAiSiteSeoTkdReq {
  description: string;
}

/** 自定义域名 */
export interface GetDomainListReq {
  siteId: string;
}

export interface GetDomainDetailReq {
  siteId: string;
  domain: string;
}

export interface GetDomainCheckInfoReq {
  domain: string;
  siteId: string;
  type?: string; // 如果type非空，同时添加添加www.和非www.两个域名
}

export interface CheckDomainReq {
  domain: string;
}

export interface BindDomainReq {
  siteId: string;
  domain: string;
  // oldDomain: string; // 修改之前的域名
  // recorded: boolean; // 是否备案
  recordNo?: string; // 网安备案号
  icpCode?: string; // icp备案号
}

export interface UnBindDomainReq {
  siteId: string;
  domain: string;
}

export interface AddDomainCertReq {
  certName: string; // 证书名称
  domain: string; // 绑定域名
  publicKey: string; // 证书内容
  privateKey: string; // 私钥
}

export interface GetDomainCertInfoReq {
  domain: string;
}

// 获取域名后缀列表
export type GetDomainTLDTypesRes = Array<string>;

// 域名搜索
export interface ListDomainPriceReq {
  domainPrefix: string; // 域名前缀
  suffixList: string[]; // 域名前缀列表 example: [".com", ".cn"]
}

interface ListDomainPriceItem {
  actualPrice: number; // 实际购买的价格
  avail: number; // 是否可注册 0表示不可用，1表示可用，-1是域名前缀或后缀不正确
  buyYear: number; // 购买时长
  name: string; // 域名
  // buyPrice: number; // 原购买价格
  // renewPrice: number; // 续费价格
  underlinePrice: number; // 划线价格
}

export type ListDomainPriceRes = Array<ListDomainPriceItem>;

// 购买域名-提交订单
export interface DomainOrderSubmitReq {
  attachmentUrlList?: Array<string>; // 凭证文件链接（线下转账时需传入）
  domain: string; // 购买域名
  platForm: number; // 支付平台，1-支付宝 2-网银 3-线下支付
  templateId?: string; // 模板id
}

// 购买域名-确认支付
export interface DomainOrderConfirmReq {
  orderId: string; // 订单id
  platForm: number; // 支付平台，1-支付宝 2-网银 3-线下支付
  attachmentUrlList?: Array<string>; // 凭证文件链接（线下转账时需传入）
  payAccount?: string; // 付款人账号（线下转账时需传入）
  payAccountName?: string; // 付款人户名（线下转账时需传入）
}

/** 营销落地页 */
export interface MarketPageItem {
  code: string;
  id: string; // 主键id
  indexUrl: string;
  siteBindDomainList: Array<any>;
  pageId: string;
  pageName: string; // 落地页名称
  siteId: string; // 所属站点
  status: string;
  templateId: string;
  templateName: string;
  thumbnail: string;
  viewNum: number; // 今日浏览
  clueNum: number; // 今日留资
}

type GetMarketListRes = Array<MarketPageItem>;

type GetSiteListRes = Array<{
  orgId: string;
  siteId: string;
  siteName: string;
}>;
export interface CreateMarketReq {
  pageName: string; // 落地页名称
  templateId: string;
  siteId: string; // 所属站点
}

export interface UpdateMarketReq {
  pageName: string;
  siteId: string; // 修改后的所属站点id
  srcSiteId: string; // 修改前的所属站点id，如果没有修改所属站点，siteId 和 srcSiteId 一致
  id: string;
  pageId: string;
  code: string;
}

export interface DeleteMarketReq {
  siteId: string;
  id: string;
  pageId: string;
  code: string;
}

export interface CreateSiteOuterReq {
  siteName: string;
  outerAddress: string;
}

export interface AIGCCreateSiteReq {
  description: string;
  industry: string;
  product: string;
  siteName: string;
  theme: string;
}
export interface PurchaseCertReq {
  domain: string;
}

export interface DomainOrderItem {
  actualPrice: number;
  domain: string;
  cancelTime: number; // 订单取消时间/过期时间
  orderId: string;
  orderTime: number;
  originalPrice: number;
  payLink: string; // 支付链接
  payTime: number;
  refundTime: number;
  status: number; // 订单状态 1-待付款 2-已付款 3-已退款 4-已失效 5-已完成 6-待确认
  statusName: string; // 订单状态 1-待付款 2-已付款 3-已退款 4-已失效 5-已完成 6-待确认
  currentTime: number;
  platform: number;
  templateId: string;
  underlinePrice: number;
  productType: number; // 0,2-domain 1,3-cert
  orderDetail: string;
  validityPeriod: number;
}

export interface BindSiteReq {
  domain: string;
  siteId: string;
}

export interface CreateDomainTemplateReq {
  addressEnglish: string;
  address: string;
  countryCode: string;
  cityEnglish: string;
  city: string;
  email: string;
  firstName?: string;
  firstNameEnglish?: string;
  lastName?: string;
  lastNameEnglish?: string;
  idCode: string;
  idTypeGswl: string;
  postalCode: string;
  phoneType: string;
  regType: string;
  provinceEnglish: string;
  province: string;
  countryTelCode: string;
  wcfCode: string;
  cellphone?: string;
  telephoneCode?: string;
  telephoneExt?: string;
  telephone?: string;
  orgName?: string;
  orgNameEnglish?: string;
  fullName?: string;
  fullNameEnglish?: string;
}

export interface DeleteDomainTemplateReq {
  templateId: string;
}

export interface ListIDTypeReq {
  type?: string;
}

export interface ModifyDomainTemplateReq extends CreateDomainTemplateReq {
  templateId: string;
}

export interface DomainTemplateListReq {
  pageNo: number;
  pageSize: number;
  type?: string;
  status?: number;
}

export interface UploadWCFReq {
  file: any;
  wcfCode: string;
}

export interface AddThirdPartCodeReq {
  renderLocation: string;
  siteId: string;
  thirdPartyCode: string;
}

export interface GetThirdPartCodeReq {
  siteId: string;
}

export interface GetDomainCertLinkReq {
  domain: string;
}

export interface GetDNSConfigPageLinkReq {
  domain: string;
}

export interface CancelDomainReq {
  domain: string;
}

export interface GetRecordInfoReq {
  domain: string;
}

export interface PickResourceReq {
  domain: string;
  spCode: string;
}

export interface SubmitInfoReq {
  domain: string;
  icpCode: string;
  recordNo: string;
}

export interface CertTypeReq {
  domain: string;
}

export interface SubmitCertOrderReq {
  platForm: number;
  certProductCode: string;
  serviceTime: number;
  domain: string;
}

export interface CertListReq {
  domain?: string;
}

export interface UpdateCertNameReq {
  certId: string;
  certName: string;
}

export interface DeployCertReq {
  certId: string;
}

export interface CreateArticleReq {
  categoryId?: string;
  siteId: string;
  thumbnail?: string;
  title: string;
  pagePath?: string;
}

export interface DeleteArticleReq {
  articleId: string;
  siteId: string;
}

export interface ListArticleReq {
  size: number;
  page: number;
  siteId?: string;
  title?: string;
  status?: string;
}

export interface UpdateArticleReq {
  articleId: string;
  categoryId?: string;
  siteId?: string;
  thumbnail?: string;
  title?: string;
  content?: string;
  originSiteId: string;
  pagePath?: string;
}

export interface ChangeStatusReq {
  articleId: string;
  siteId: string;
  status: string;
}

export interface CreateCategoryReq {
  categoryName: string;
  siteId: string;
}

export interface DeleteCategoryReq {
  categoryId: string;
  siteId: string;
}

export interface ListCategoryReq {
  categoryName?: string;
  siteId: string;
}

export interface UpdateCategoryReq {
  categoryId: string;
  siteId?: string;
  categoryName?: string;
  originSiteId: string;
}

export interface OrderCategoryReq {
  categoryId: string;
  siteId: string;
  dragAction: string;
  targetNodeId: string;
}

export interface GetArticleReq {
  articleId: string;
  siteId: string;
}

export interface SiteInfoReq {
  publishStatusList: string[];
  deleted?: boolean;
  isShowOuterSite?: boolean;
  isGetBindDomain?: boolean;
}

export interface SiteTrafficDeliveryOverviewInfoReq {
  endTime: string;
  startTime: string;
  siteId: string;
  criteriaIds: string[];
}

export interface SiteTrafficDeliveryExpenseStatisticsReq {
  eTime: string;
  sTime: string;
  siteId: string;
  type: string;
}

export interface SiteTrafficDeliveryExpenseRecordReq {
  eTime: string;
  sTime: string;
  siteId: string;
}

export interface SiteTrafficDeliveryExpenseRecordExcelReq {
  eTime: string;
  sTime: string;
  siteId: string;
}

export interface SiteApi extends Api {
  // 写信页插入商品和站点数据获取站点列表
  getSiteDomainList(req: GetSiteDomainListReq): Promise<any>;
  getAdsDeliveryByOrg(): Promise<boolean>;
  getTrafficDeliveryInfo(req: SiteTrafficDeliveryOverviewInfoReq): Promise<any>;
  getExpenseStatistics(req: SiteTrafficDeliveryExpenseStatisticsReq): Promise<any>;
  getExpenseRecord(req: SiteTrafficDeliveryExpenseRecordReq): Promise<any>;
  getDeliveryCountryList(): Promise<any>;
  // 桌面端跳web端携带登录态
  genLoginCode(): Promise<any>;
  // 文件上传
  siteUploadFile(req: FormData): Promise<any>;
  siteUploadFileNew(req: FormData): Promise<any>;
  // 我的站点
  getSiteStatData(req: any): Promise<any>;
  getSiteDataCountryList(): Promise<any>;
  getStatDetailsData(type: string, req: any): Promise<any>;
  addFeedback(req: any): Promise<any>;
  createMarketNeed(req: any): Promise<any>;
  getSiteMetaInfo(): Promise<SiteItem[]>;
  getSiteLatestData(req: SiteLatestDataReq): Promise<any>;
  getSiteClueInfo(): Promise<any>;
  getTemplateData(req: GetTemplateDataReq): Promise<any>;
  getSiteTemplateTag(): Promise<any>;
  createSitePage(req: CreateSitePageReq): Promise<any>;
  checkCreateSitePermission(): Promise<any>;
  deleteSitePage(req: DeleteSitePageReq): Promise<any>;
  offlineSite(req: OfflineSiteReq): Promise<any>;
  updateSiteName(req: UpdateSiteNameReq): Promise<any>;
  getSeoConfig(req: GetSeoConfigReq): Promise<GetSeoConfigRes>;
  updatePageSeoConfig(req: UpdatePageSeoConfigReq): Promise<any>;
  updateSiteSeoConfig(req: UpdateSiteSeoConfigReq): Promise<any>;
  getAiSiteSeoTkd(req: GetAiSiteSeoTkdReq): Promise<SitePageSeoConfigItem>;
  // 自定义域名
  getDomainList(req: GetDomainListReq): Promise<any>;
  getDomainDetail(req: GetDomainDetailReq): Promise<any>;
  getDomainCheckInfo(req: GetDomainCheckInfoReq): Promise<any>;
  checkDomain(req: CheckDomainReq): Promise<any>;
  bindDomain(req: BindDomainReq): Promise<any>;
  unBindDomain(req: UnBindDomainReq): Promise<any>;
  addDomainCert(req: AddDomainCertReq): Promise<any>;
  getDomainCertInfo(req: GetDomainCertInfoReq): Promise<any>;
  // 留资
  reportSiteBuilderOpportunity(req: any): Promise<any>;
  // 购买域名
  getDomainTLDTypes(): Promise<GetDomainTLDTypesRes>;
  listDomainPrice(req: ListDomainPriceReq): Promise<ListDomainPriceRes>;
  domainOrderSubmit(req: DomainOrderSubmitReq): Promise<ResponseData<DomainOrderItem>>;
  domainOrderConfirm(req: DomainOrderConfirmReq): Promise<DomainOrderItem>;
  getDomainPayAccount(): Promise<any>;
  // 营销落地页
  createMarket(req: CreateMarketReq): Promise<any>;
  getMarketList(): Promise<GetMarketListRes>;
  getSiteList(): Promise<GetSiteListRes>;
  updateMarket(req: UpdateMarketReq): Promise<any>;
  deleteMarket(req: DeleteMarketReq): Promise<any>;

  aigcCreateSite(req: AIGCCreateSiteReq): Promise<any>;
  getIndustryList(): Promise<{ id: number; industry: string; description: string }[]>;
  getAiSiteStyleList(): Promise<{ id: number; theme: string; description: string }[]>;
  createSiteOuter(req: CreateSiteOuterReq): Promise<any>;
  listDomain(): Promise<any>;
  purchaseCert(req: PurchaseCertReq): Promise<any>;
  domainOrderList(): Promise<any>;
  bindSite(req: BindSiteReq): Promise<any>;
  // getUnBindSite(): Promise<any>;
  createDomainTemplate(req: CreateDomainTemplateReq): Promise<any>;
  deleteDomainTemplate(req: DeleteDomainTemplateReq): Promise<any>;
  getDomainTemplate(req: DeleteDomainTemplateReq): Promise<any>;
  listIDType(req: ListIDTypeReq): Promise<any>;
  modifyDomainTemplate(req: ModifyDomainTemplateReq): Promise<any>;
  domainTemplateList(req: DomainTemplateListReq): Promise<any>;
  uploadWCF(req: UploadWCFReq): Promise<any>;
  addThirdPartCode(req: AddThirdPartCodeReq): Promise<any>;
  getThirdPartCode(req: GetThirdPartCodeReq): Promise<any>;
  getDomainCertLink(req: GetDomainCertLinkReq): Promise<any>;
  getDNSConfigPageLink(req: GetDNSConfigPageLinkReq): Promise<any>;
  cancelDomain(req: CancelDomainReq): Promise<any>;
  listServiceProviders(): Promise<any>;
  getRecordInfo(req: GetRecordInfoReq): Promise<any>;
  pickResource(req: PickResourceReq): Promise<any>;
  submitInfo(req: SubmitInfoReq): Promise<any>;
  certType(req: CertTypeReq): Promise<any>;
  submitCertOrder(req: SubmitCertOrderReq): Promise<any>;
  certList(req: CertListReq): Promise<any>;
  updateCertName(req: UpdateCertNameReq): Promise<any>;
  deployCert(req: DeployCertReq): Promise<any>;
  createArticle(req: CreateArticleReq): Promise<any>;
  deleteArticle(req: DeleteArticleReq): Promise<any>;
  listArticle(req: ListArticleReq): Promise<any>;
  getSiteCategory(): Promise<any>;
  updateArticle(req: UpdateArticleReq): Promise<any>;
  changeStatus(req: ChangeStatusReq): Promise<any>;
  createCategory(req: CreateCategoryReq): Promise<any>;
  deleteCategory(req: DeleteCategoryReq): Promise<any>;
  listCategory(req: ListCategoryReq): Promise<any>;
  updateCategory(req: UpdateCategoryReq): Promise<any>;
  orderCategory(req: OrderCategoryReq): Promise<any>;
  getArticle(req: GetArticleReq): Promise<any>;
  siteInfo(req: SiteInfoReq): Promise<any>;
}
