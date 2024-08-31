import {
  SiteApi,
  SiteItem,
  SiteLatestDataReq,
  CreateSitePageReq,
  DeleteSitePageReq,
  UpdateSiteNameReq,
  GetSeoConfigReq,
  GetSeoConfigRes,
  UpdatePageSeoConfigReq,
  UpdateSiteSeoConfigReq,
  GetAiSiteSeoTkdReq,
  SitePageSeoConfigItem,
  GetDomainListReq,
  GetDomainCheckInfoReq,
  CheckDomainReq,
  BindDomainReq,
  AddDomainCertReq,
  UnBindDomainReq,
  GetDomainCertInfoReq,
  CreateMarketReq,
  UpdateMarketReq,
  DeleteMarketReq,
  GetTemplateDataReq,
  CreateSiteOuterReq,
  AIGCCreateSiteReq,
  ListDomainPriceReq,
  GetDomainTLDTypesRes,
  PurchaseCertReq,
  BindSiteReq,
  CreateDomainTemplateReq,
  DeleteDomainTemplateReq,
  ListIDTypeReq,
  ModifyDomainTemplateReq,
  DomainTemplateListReq,
  UploadWCFReq,
  DomainOrderSubmitReq,
  DomainOrderConfirmReq,
  AddThirdPartCodeReq,
  GetThirdPartCodeReq,
  GetDomainCertLinkReq,
  CancelDomainReq,
  GetRecordInfoReq,
  PickResourceReq,
  SubmitInfoReq,
  CertTypeReq,
  SubmitCertOrderReq,
  CertListReq,
  UpdateCertNameReq,
  DeployCertReq,
  GetDomainDetailReq,
  OfflineSiteReq,
  CreateArticleReq,
  DeleteArticleReq,
  ListArticleReq,
  UpdateArticleReq,
  ChangeStatusReq,
  CreateCategoryReq,
  DeleteCategoryReq,
  ListCategoryReq,
  UpdateCategoryReq,
  OrderCategoryReq,
  GetArticleReq,
  SiteInfoReq,
  GetDNSConfigPageLinkReq,
  SiteTrafficDeliveryOverviewInfoReq,
  SiteTrafficDeliveryExpenseStatisticsReq,
  SiteTrafficDeliveryExpenseRecordReq,
  // SiteTrafficDeliveryExpenseRecordExcelReq,
} from '@/api/logical/site';
import { apis } from '../../../config';
import { api } from '../../../api/api';
import { ApiRequestConfig } from '../../../api/data/http';

const eventApi = api.getEventApi();

const commontToast = (message?: string) => {
  eventApi.sendSysEvent({
    eventSeq: 0,
    eventName: 'error',
    eventLevel: 'error',
    eventData: {
      title: message || '服务器没有响应，请稍后再试',
      popupType: 'toast',
      popupLevel: 'error',
      content: '',
    },
    auto: true,
  });
};

interface ReqOptions {
  hideCodeMessage?: boolean;
  fullData?: boolean;
}

export class SiteApiImpl implements SiteApi {
  name = apis.siteApiImpl;

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  init() {
    return this.name;
  }

  async get(url: string, req: any, config?: ApiRequestConfig, options: ReqOptions = {}) {
    const param = {
      ...req,
    };
    const { hideCodeMessage, fullData } = options;
    try {
      const { data } = await this.http.get(url, param, config);
      if (!data || !data.success) {
        if (!hideCodeMessage) {
          commontToast(data?.message || '网络错误');
        }
        return Promise.reject(data?.message);
      }
      return fullData ? data : data.data;
    } catch (res: any) {
      // if (res.status >= 500 && res.status < 600) {
      //   commontToast();
      // }
      if (res.status === 400) {
        commontToast(res.data?.message);
      }
      return Promise.reject(res.data);
    }
  }

  async post(url: string, body: any, config?: ApiRequestConfig, options: ReqOptions = {}) {
    config = {
      contentType: 'json',
      noEnqueue: false,
      ...(config || {}),
    };
    const param =
      config?.contentType !== 'stream'
        ? {
            ...body,
          }
        : body;
    const { hideCodeMessage, fullData } = options;
    try {
      const { data } = await this.http.post(url, param, config as ApiRequestConfig);
      if (fullData) {
        return data;
      }
      if (!data || !data.success) {
        if (!hideCodeMessage) {
          commontToast(data?.message || '网络错误');
        }
        return Promise.reject(data);
      }
      return data.data;
    } catch (res: any) {
      // if (res.status >= 500 && res.status < 600) {
      //   commontToast();
      // }
      if (res.status === 400) {
        commontToast(res.data?.message);
      }
      // 没有返回值时 data为空
      if (res.status === 429) {
        commontToast(res.statusText || '请求次数超出限制');
      }
      if (res === 'NETWORK.ERR.TIMEOUT') {
        return Promise.reject(res);
      }
      return Promise.reject(res.data);
    }
  }

  /** 写信页插入商品 */
  // 获取已上线站点列表和每个站点绑定的域名
  getSiteDomainList(): Promise<any> {
    return this.post(this.systemApi.getUrl('getSiteDomainList'), {});
  }

  getAdsDeliveryByOrg(): Promise<boolean> {
    return this.get(this.systemApi.getUrl('getAdsDeliveryByOrg'), {});
  }

  getTrafficDeliveryInfo(req: SiteTrafficDeliveryOverviewInfoReq): Promise<any> {
    return this.post(this.systemApi.getUrl('getTrafficDeliveryInfo'), req);
  }

  getExpenseStatistics(req: SiteTrafficDeliveryExpenseStatisticsReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getExpenseStatistics'), req);
  }

  getExpenseRecord(req: SiteTrafficDeliveryExpenseRecordReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getExpenseRecord'), req);
  }

  getDeliveryCountryList(): Promise<any> {
    return this.get(this.systemApi.getUrl('getDeliveryCountryList'), {});
  }

  // 获取登陆态的code
  genLoginCode(): Promise<any> {
    return this.get(this.systemApi.getUrl('genLoginCode'), {});
  }

  // 文件上传
  siteUploadFile(req: FormData): Promise<any> {
    return this.post(this.systemApi.getUrl('siteUploadFile'), req, { contentType: 'stream' });
  }

  // 文件上传
  siteUploadFileNew(req: FormData): Promise<any> {
    return this.post(this.systemApi.getUrl('siteUploadFileNew'), req, { contentType: 'stream' });
  }

  // 站点数据主页
  getSiteStatData(req: any): Promise<any> {
    return this.get(this.systemApi.getUrl('getWholeData'), req);
  }

  // 站点数据国家列表
  getSiteDataCountryList(): Promise<any> {
    return this.get(this.systemApi.getUrl('getSiteDataCountryList'), {});
  }

  // 站点数据详情
  getStatDetailsData(type: string, req: any): Promise<any> {
    switch (type) {
      case 'allAccess':
        return this.get(this.systemApi.getUrl('getDetailWholeData'), req);
      case 'allSubmit':
        return this.get(this.systemApi.getUrl('getDetailWholeReferIntentionData'), req);
      case 'detailsAccess':
        return this.get(this.systemApi.getUrl('getDetailProductData'), req);
      case 'detailsSubmit':
        return this.get(this.systemApi.getUrl('getDetailProductReferIntentionData'), req);
      case 'landingView':
        return this.get(this.systemApi.getUrl('getDetailLandingPageData'), req);
      case 'landingClue':
        return this.get(this.systemApi.getUrl('getDetailLandingPageReferIntentionData'), req);
      default:
        return Promise.resolve();
    }
  }

  /** seo */
  // 获取seo TKD和收录状态
  getSeoConfig(req: GetSeoConfigReq): Promise<GetSeoConfigRes> {
    return this.get(this.systemApi.getUrl('getSeoConfig'), req);
  }

  // 更新seo TKD
  updatePageSeoConfig(req: UpdatePageSeoConfigReq): Promise<any> {
    return this.post(this.systemApi.getUrl('updatePageSeoConfig'), req);
  }

  // 更新seo 收录状态
  updateSiteSeoConfig(req: UpdateSiteSeoConfigReq): Promise<any> {
    return this.post(this.systemApi.getUrl('updateSiteSeoConfig'), req);
  }

  // AI获取seo TKD
  getAiSiteSeoTkd(req: GetAiSiteSeoTkdReq): Promise<SitePageSeoConfigItem> {
    return this.get(this.systemApi.getUrl('getAiSiteSeoTkd'), req);
  }

  // 提交反馈
  addFeedback(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('addFeedback'), req);
  }

  // 提交sem营销
  createMarketNeed(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('createMarketNeed'), req);
  }

  // 我的站点首页数据
  getSiteMetaInfo(): Promise<SiteItem[]> {
    return this.get(this.systemApi.getUrl('getSiteMetaInfo'), {});
  }

  // 我的站点首页数据展示
  getSiteLatestData(req: SiteLatestDataReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getSiteLatestData'), req);
  }

  // 获取模版列表
  getTemplateData(req: GetTemplateDataReq): Promise<any> {
    // this.get 返回 res.data.data，this.http.get返回 res
    return this.http.get(this.systemApi.getUrl('getTemplateData'), req);
  }

  // 获取模版标签列表信息
  getSiteTemplateTag(): Promise<any> {
    return this.get(this.systemApi.getUrl('getSiteTemplateTag'), {});
  }

  // 创建站点
  createSitePage(req: CreateSitePageReq): Promise<any> {
    return this.post(this.systemApi.getUrl('createSitePage'), req, {}, { hideCodeMessage: true });
  }

  // 检查是否允许新建站点
  checkCreateSitePermission(): Promise<any> {
    return this.post(this.systemApi.getUrl('checkCreateSitePermission'), null, {}, { hideCodeMessage: true });
  }

  // 删除站点
  deleteSitePage(req: DeleteSitePageReq): Promise<any> {
    return this.post(this.systemApi.getUrl('deleteSitePage'), req, { contentType: 'form' }, { hideCodeMessage: true });
  }

  // 站点下线
  offlineSite(req: OfflineSiteReq): Promise<any> {
    return this.post(this.systemApi.getUrl('offlineSite'), {}, { params: req });
  }

  // 更新站点名称
  updateSiteName(req: UpdateSiteNameReq): Promise<any> {
    return this.post(this.systemApi.getUrl('updateSiteName'), req, { contentType: 'form' }, { hideCodeMessage: true });
  }

  /** 自定义域名 */
  // 获取已添加域名列表
  getDomainList(req: GetDomainListReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getDomainList'), req);
  }

  // 查询域名详情
  getDomainDetail(req: GetDomainDetailReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getDomainDetail'), req);
  }

  // 获取域名验证信息
  getDomainCheckInfo(req: GetDomainCheckInfoReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getDomainCheckInfo'), req);
  }

  // 验证域名
  checkDomain(req: CheckDomainReq): Promise<any> {
    return this.post(this.systemApi.getUrl('checkDomain'), req, { contentType: 'form' }, { fullData: true });
  }

  // 绑定域名
  bindDomain(req: BindDomainReq): Promise<any> {
    return this.post(this.systemApi.getUrl('bindDomain'), req, {}, { hideCodeMessage: true });
  }

  // 解绑域名
  unBindDomain(req: UnBindDomainReq): Promise<any> {
    return this.post(this.systemApi.getUrl('unBindDomain'), req);
  }

  // 添加 https 证书
  addDomainCert(req: AddDomainCertReq): Promise<any> {
    return this.post(this.systemApi.getUrl('addDomainCert'), req, {}, { fullData: true });
  }

  // 获取 https 证书信息
  getDomainCertInfo(req: GetDomainCertInfoReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getDomainCertInfo'), req);
  }

  // 获取购买域名支持的后缀列表
  getDomainTLDTypes(): Promise<GetDomainTLDTypesRes> {
    return this.get(this.systemApi.getUrl('getDomainTLDTypes'), {});
  }

  // 域名搜索
  listDomainPrice(req: ListDomainPriceReq): Promise<any> {
    return this.post(this.systemApi.getUrl('listDomainPrice'), req);
  }

  // 购买域名-提交订单
  domainOrderSubmit(req: DomainOrderSubmitReq): Promise<any> {
    return this.post(this.systemApi.getUrl('domainOrderSubmit'), req, {}, { hideCodeMessage: true, fullData: true });
  }

  // 购买域名-确认支付
  domainOrderConfirm(req: DomainOrderConfirmReq): Promise<any> {
    return this.post(this.systemApi.getUrl('domainOrderConfirm'), req);
  }

  // 购买域名-获取线下转账汇款信息
  getDomainPayAccount(): Promise<any> {
    return this.get(this.systemApi.getUrl('getDomainPayAccount'), {});
  }

  // 获取新增总数
  getSiteClueInfo(): Promise<any> {
    return this.get(this.systemApi.getUrl('getSiteClueInfo'), {});
  }

  /** 营销落地页 */
  // 创建营销落地页
  createMarket(req: CreateMarketReq): Promise<any> {
    return this.post(this.systemApi.getUrl('createMarket'), req);
  }

  // 查询营销落地页列表
  getMarketList(): Promise<any> {
    return this.get(this.systemApi.getUrl('getMarketList'), {});
  }

  // 查询站点集合下拉列表
  getSiteList(): Promise<any> {
    return this.get(this.systemApi.getUrl('getSiteList'), {});
  }

  // 编辑营销落地页
  updateMarket(req: UpdateMarketReq): Promise<any> {
    return this.post(this.systemApi.getUrl('updateMarket'), req);
  }

  // 建站留资
  reportSiteBuilderOpportunity(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('reportSiteBuilderOpportunity'), req);
  }

  // 删除营销落地页
  deleteMarket(req: DeleteMarketReq): Promise<any> {
    return this.post(this.systemApi.getUrl('deleteMarket'), req);
  }

  // 使用ai建站
  aigcCreateSite(req: AIGCCreateSiteReq): Promise<any> {
    return this.post(this.systemApi.getUrl('aigcCreateSite'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  // 获取行业列表
  getIndustryList(): Promise<any> {
    return this.get(this.systemApi.getUrl('getIndustryList'), {});
  }

  // 获取建站风格列表
  getAiSiteStyleList(): Promise<any> {
    return this.get(this.systemApi.getUrl('getAiSiteStyleList'), {});
  }

  // 绑定外部站点
  createSiteOuter(req: CreateSiteOuterReq): Promise<any> {
    return this.post(this.systemApi.getUrl('createSiteOuter'), req, {}, { hideCodeMessage: true });
  }

  // 我的域名列表
  listDomain(): Promise<any> {
    return this.get(this.systemApi.getUrl('listDomain'), {});
  }

  // 购买证书
  purchaseCert(req: PurchaseCertReq): Promise<any> {
    return this.post(this.systemApi.getUrl('purchaseCert'), {}, { params: req });
  }

  // 域名购买列表
  domainOrderList(): Promise<any> {
    return this.get(this.systemApi.getUrl('domainOrderList'), {});
  }

  // 域名绑定站点
  bindSite(req: BindSiteReq): Promise<any> {
    return this.post(this.systemApi.getUrl('bindSite'), req);
  }

  // 查询未绑定域名的站点
  // getUnBindSite(): Promise<any> {
  //   return this.get(this.systemApi.getUrl('getUnBindSite'), {});
  // }

  // 创建模版
  createDomainTemplate(req: CreateDomainTemplateReq): Promise<any> {
    return this.post(this.systemApi.getUrl('createDomainTemplate'), req, {}, { hideCodeMessage: true });
  }

  // 删除模版
  deleteDomainTemplate(req: DeleteDomainTemplateReq): Promise<any> {
    return this.post(this.systemApi.getUrl('deleteDomainTemplate'), {}, { params: req });
  }

  // 获取模版信息
  getDomainTemplate(req: DeleteDomainTemplateReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getDomainTemplate'), req);
  }

  // 获取证件类型列表
  listIDType(req: ListIDTypeReq): Promise<any> {
    return this.get(this.systemApi.getUrl('listIDType'), req);
  }

  // 修改模版
  modifyDomainTemplate(req: ModifyDomainTemplateReq): Promise<any> {
    return this.post(this.systemApi.getUrl('modifyDomainTemplate'), req, {}, { hideCodeMessage: true });
  }

  // 分页获取模版
  domainTemplateList(req: DomainTemplateListReq): Promise<any> {
    return this.get(this.systemApi.getUrl('domainTemplateList'), req, {}, { fullData: true });
  }

  // 增加第三方统计代码
  addThirdPartCode(req: AddThirdPartCodeReq): Promise<any> {
    return this.post(this.systemApi.getUrl('addThirdPartCode'), req, {}, { hideCodeMessage: true });
  }

  // 获取第三方统计代码
  getThirdPartCode(req: GetThirdPartCodeReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getThirdPartCode'), req);
  }

  // 上传实名认证资料
  uploadWCF(req: UploadWCFReq): Promise<any> {
    const { file, wcfCode } = req;
    return this.post(this.systemApi.getUrl('uploadWCF'), file, {
      params: { wcfCode },
      headers: {
        'Content-Type': 'multipart/form-data',
        accept: '*/*',
      },
      contentType: 'stream',
    });
  }

  getDomainCertLink(req: GetDomainCertLinkReq): Promise<any> {
    return this.post(this.systemApi.getUrl('getDomainCertLink'), {}, { params: req });
  }

  getDNSConfigPageLink(req: GetDNSConfigPageLinkReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getDNSConfigPageLink'), {}, { params: req }, { hideCodeMessage: true });
  }

  cancelDomain(req: CancelDomainReq): Promise<any> {
    return this.post(this.systemApi.getUrl('cancelDomain'), {}, { params: req });
  }

  listServiceProviders(): Promise<any> {
    return this.get(this.systemApi.getUrl('listServiceProviders'), {});
  }

  getRecordInfo(req: GetRecordInfoReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getRecordInfo'), req);
  }

  pickResource(req: PickResourceReq): Promise<any> {
    return this.post(this.systemApi.getUrl('pickResource'), {}, { params: req }, { fullData: true });
  }

  submitInfo(req: SubmitInfoReq): Promise<any> {
    return this.post(this.systemApi.getUrl('submitInfo'), {}, { params: req });
  }

  certType(req: CertTypeReq): Promise<any> {
    return this.get(this.systemApi.getUrl('certType'), req);
  }

  submitCertOrder(req: SubmitCertOrderReq): Promise<any> {
    return this.post(this.systemApi.getUrl('submitCertOrder'), req, {}, { hideCodeMessage: true, fullData: true });
  }

  certList(req: CertListReq): Promise<any> {
    return this.get(this.systemApi.getUrl('certList'), req);
  }

  updateCertName(req: UpdateCertNameReq): Promise<any> {
    return this.post(this.systemApi.getUrl('updateCertName'), {}, { params: req });
  }

  deployCert(req: DeployCertReq): Promise<any> {
    return this.post(this.systemApi.getUrl('deployCert'), {}, { params: req }, { hideCodeMessage: true, fullData: true });
  }

  createArticle(req: CreateArticleReq): Promise<any> {
    return this.post(this.systemApi.getUrl('createArticle'), req);
  }

  deleteArticle(req: DeleteArticleReq): Promise<any> {
    return this.post(this.systemApi.getUrl('deleteArticle'), req);
  }

  listArticle(req: ListArticleReq): Promise<any> {
    return this.get(this.systemApi.getUrl('listArticle'), req, {}, { fullData: true });
  }

  getSiteCategory(): Promise<any> {
    return this.get(this.systemApi.getUrl('getSiteCategory'), {});
  }

  updateArticle(req: UpdateArticleReq): Promise<any> {
    return this.post(this.systemApi.getUrl('updateArticle'), req);
  }

  changeStatus(req: ChangeStatusReq): Promise<any> {
    return this.post(this.systemApi.getUrl('changeStatus'), req, {}, { hideCodeMessage: req.status === 'online', fullData: req.status === 'online' });
  }

  createCategory(req: CreateCategoryReq): Promise<any> {
    return this.post(this.systemApi.getUrl('createCategory'), req);
  }

  deleteCategory(req: DeleteCategoryReq): Promise<any> {
    return this.post(this.systemApi.getUrl('deleteCategory'), req);
  }

  listCategory(req: ListCategoryReq): Promise<any> {
    return this.get(this.systemApi.getUrl('listCategory'), req);
  }

  updateCategory(req: UpdateCategoryReq): Promise<any> {
    return this.post(this.systemApi.getUrl('updateCategory'), req);
  }

  orderCategory(req: OrderCategoryReq): Promise<any> {
    return this.post(this.systemApi.getUrl('orderCategory'), req);
  }

  getArticle(req: GetArticleReq): Promise<any> {
    return this.get(this.systemApi.getUrl('getArticle'), req);
  }

  siteInfo(req: SiteInfoReq): Promise<any> {
    return this.post(this.systemApi.getUrl('siteInfo'), req);
  }
}

const siteApiImpl = new SiteApiImpl();
api.registerLogicalApi(siteApiImpl);
export default siteApiImpl;
