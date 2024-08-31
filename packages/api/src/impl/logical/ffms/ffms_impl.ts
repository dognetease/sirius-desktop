import { api } from '../../../api/api';
import { ApiRequestConfig, DataTransApi } from '../../../api/data/http';
import { FFMSApi, FFMS, FFMSLevelAdmin, FFMSCustomer, FFMSRate, FFMSOverView, FFMSOrder, FFMSStatic, FFMSSite, FFMSPriceHistory } from '../../../api/logical/ffms';
import { apis } from '../../../config';
import { SystemApi } from '../../../api/system/system';

const eventApi = api.getEventApi();
const storageApi = api.getDataStoreApi();
const GrayPath = 'sirius-it-gray';
const GrayRuleName = 'default';
class FFMSApiImpl implements FFMSApi {
  name: string;

  private http: DataTransApi;

  private systemApi: SystemApi;

  constructor() {
    this.name = apis.ffmsApi;
    this.systemApi = api.getSystemApi();
    this.http = api.getDataTransApi();
  }

  async get(url: string, req: any, config?: ApiRequestConfig) {
    try {
      const { data } = await this.http.get(url, req, config);
      if (!data || !data.success) {
        if (data?.message) {
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
      if (res.status === 400 || (res.status >= 500 && res.status < 600)) {
        eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: res?.data?.message || '服务器没有响应，请稍后再试',
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
        // if (data?.message && data.code === 40101) {
        if (data?.message) {
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
      console.log('xxx-https', res);
      if (res.status === 400 || (res.status >= 500 && res.status < 600)) {
        eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: res?.data?.message || '服务器没有响应，请稍后再试',
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

  init() {
    const x = storageApi.getSync(`${GrayPath}#${GrayRuleName}`, {
      noneUserRelated: false,
    }).data;
    this.updateTrafficLabel(x);
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

  getOrderList(): Promise<FFMS.OrderListRes> {
    return this.get(this.systemApi.getUrl('ffRateList'), null);
  }

  getOrderDetail(req: FFMSRate.DraftDetailReq): Promise<FFMS.OrderDetail> {
    return this.get(this.systemApi.getUrl('getFfCustomerLevelList'), req);
  }

  addFfCustomerLevel(req: FFMSLevelAdmin.Add): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addFfCustomerLevel'), req);
  }

  getFfCustomerLevelList(req: FFMSLevelAdmin.ListReq): Promise<FFMSLevelAdmin.List> {
    return this.get(this.systemApi.getUrl('getFfCustomerLevelList'), req);
  }

  deleteFfCustomerLevel(req: FFMSLevelAdmin.Delete): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteFfCustomerLevel'), req);
  }

  getDiscount(): Promise<FFMSCustomer.DiscountRes> {
    return this.get(this.systemApi.getUrl('getDiscount'), null);
  }

  getFfGlobalDiscountList(req: FFMSCustomer.DiscountReq): Promise<FFMSCustomer.DiscountRes> {
    return this.get(this.systemApi.getUrl('getDiscount'), req);
  }

  saveDiscount(req: FFMSCustomer.AddDiscount): Promise<boolean> {
    return this.post(this.systemApi.getUrl('saveDiscount'), req);
  }

  deleteFfCustomer(req: FFMSCustomer.Delete): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteFfCustomer'), req);
  }

  getFfCustomerList(req: FFMSCustomer.ListReq): Promise<FFMSCustomer.List> {
    return this.get(this.systemApi.getUrl('getFfCustomerList'), req);
  }

  saveFfCustomer(req: FFMSCustomer.SaveReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('saveFfCustomer'), req);
  }

  changeFfCustomerLevel(req: FFMSCustomer.EditLevel): Promise<boolean> {
    return this.post(this.systemApi.getUrl('changeFfCustomerLevel'), req);
  }

  ffCustomerTemplate(): Promise<FFMSCustomer.CustomerTemplate> {
    return this.get(this.systemApi.getUrl('ffCustomerTemplate'), null);
  }

  ffCustomerUpload(req: FormData): Promise<FFMSCustomer.UploadRes> {
    return this.post(this.systemApi.getUrl('ffCustomerUpload'), req, {
      contentType: 'stream',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  ffRateTemplate(): Promise<FFMSCustomer.CustomerTemplate> {
    return this.get(this.systemApi.getUrl('ffRateTemplate'), null);
  }

  ffRateList(req: FFMSRate.ListReq): Promise<FFMSRate.List> {
    return this.post(this.systemApi.getUrl('ffRateList'), req);
  }

  saveFfRate(req: FFMSRate.SaveReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('saveFfRate'), req);
  }

  deleteFfRate(req: FFMSRate.DeleteRate): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteFfRate'), req);
  }

  ffPortList(): Promise<FFMSRate.PortList> {
    return this.get(this.systemApi.getUrl('ffPortList'), null);
  }

  ffCarrierList(): Promise<FFMSRate.CarrierList> {
    return this.get(this.systemApi.getUrl('ffCarrierList'), null);
  }

  saveFfUploadData(req: FFMSRate.ImportReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('saveFfUploadData'), req);
  }

  ffRateDraftList(req: FFMSRate.DraftListReq): Promise<FFMSRate.PortDraftList> {
    return this.get(this.systemApi.getUrl('ffRateDraftList'), req);
  }

  ffRateDraftDetail(req: FFMSRate.DraftDetailReq): Promise<FFMSRate.DraftDetailRes> {
    return this.get(this.systemApi.getUrl('ffRateDraftDetail'), req);
  }

  deleteFfRateDraft(req: FFMSRate.DeleteDraftItem): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteFfRateDraft'), req);
  }

  ffImportRecallInfo(): Promise<FFMSRate.ImportInfo> {
    return this.get(this.systemApi.getUrl('ffImportRecallInfo'), null);
  }

  ffImportRecall(): Promise<boolean> {
    return this.post(this.systemApi.getUrl('ffImportRecall'), null);
  }

  ffOverviewList(req: FFMSOverView.ListReq): Promise<FFMSOverView.ListRes> {
    return this.post(this.systemApi.getUrl('ffOverviewList'), req);
  }

  ffWhiteList(): Promise<FFMSRate.WhiteList> {
    return this.post(this.systemApi.getUrl('ffWhiteList'), null);
  }

  ffGetShareLink(): Promise<{ url: string }> {
    return this.get(this.systemApi.getUrl('ffGetShareLink'), {});
  }

  ffBookList(req: FFMSOrder.ListReq): Promise<FFMSOrder.List> {
    return this.get(this.systemApi.getUrl('ffBookList'), req);
  }

  changeffBookStatus(req: FFMSOrder.BookStatus): Promise<boolean> {
    return this.post(this.systemApi.getUrl('changeffBookStatus'), req);
  }

  saveFfFollow(req: FFMSOrder.FollowReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('saveFfFollow'), req);
  }

  getFfBookDetail(req: FFMSOrder.DetailReq): Promise<FFMSOrder.DetailRes> {
    return this.get(this.systemApi.getUrl('getFfBookDetail'), req);
  }

  getFfBookingStatus(): Promise<FFMSOrder.Status> {
    return this.get(this.systemApi.getUrl('getFfBookingStatus'), null);
  }

  deleteFfBook(req: FFMSOrder.DeleteBookReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteFfBook'), req);
  }

  getPortState(req: FFMSStatic.PortStateReq): Promise<FFMSStatic.PortStateRes> {
    return this.get(this.systemApi.getUrl('getPortState'), req);
  }

  // getPortStateList(req: FFMSStatic.PortStateListReq): Promise<FFMSStatic.PortStateListRes> {
  //   return this.get(this.systemApi.getUrl('getPortStateList'), req);
  // }

  getVisiteList(req: FFMSStatic.VisitListReq): Promise<FFMSStatic.VisitListRes> {
    return this.get(this.systemApi.getUrl('getVisiteList'), req);
  }

  getVisiteDetail(req: FFMSStatic.VisitDetailReq): Promise<FFMSStatic.VisitDetailRes> {
    return this.get(this.systemApi.getUrl('getVisiteDetail'), req);
  }

  getVisiteState(req: FFMSStatic.VisitStaticReq): Promise<FFMSStatic.VisitStatic[]> {
    return this.get(this.systemApi.getUrl('getVisiteState'), req);
  }

  checkSiteId(siteId: string): Promise<boolean> {
    return this.get(this.systemApi.getUrl('checkSiteId'), { siteId });
  }

  getOrgSite(): Promise<FFMSSite.SiteInfo> {
    return this.get(this.systemApi.getUrl('getOrgSiteId'), {});
  }

  saveSiteId(siteId: string): Promise<void> {
    return this.get(this.systemApi.getUrl('saveSiteId'), { siteId });
  }

  saveFfCustomerType(req: FFMSCustomer.AddType): Promise<boolean> {
    return this.post(this.systemApi.getUrl('saveFfCustomerType'), req);
  }

  getFfCustomerTypeList(req: FFMSCustomer.TypeReq): Promise<FFMSCustomer.TypeList> {
    return this.get(this.systemApi.getUrl('getFfCustomerTypeList'), req);
  }

  deleteFfCustomerType(req: FFMSCustomer.DeleteType): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteFfCustomerType'), req);
  }

  changeCustomerType(req: FFMSCustomer.ChangeType): Promise<boolean> {
    return this.post(this.systemApi.getUrl('changeCustomerType'), req);
  }

  getCustomerTypeOptions(): Promise<{ content: FFMS.CustomerTypeItem[] }> {
    return this.get(this.systemApi.getUrl('getCustomerTypeOptions'), {});
  }

  uploadFfmsPrice(req: FormData, config?: ApiRequestConfig): Promise<FFMSRate.PriceUploadRes> {
    return this.post(this.systemApi.getUrl('ffRateUpload'), req, config);
  }

  ffmsAnalyzePicture(req: FormData, config?: ApiRequestConfig): Promise<FFMSRate.PricePicRes> {
    return this.post(this.systemApi.getUrl('ffmsAnalyzePicture'), req, config);
  }

  saveFfmsAnalyzePicture(req: FFMSRate.SaveAnalyzePrice): Promise<FFMSRate.SaveAnalyzePriceRes> {
    return this.post(this.systemApi.getUrl('saveFfmsAnalyzePicture'), req);
  }

  getFfmsPriceTitle(): Promise<FFMSRate.StandardField[]> {
    return this.get(this.systemApi.getUrl('getFfmsPriceTitle'), null);
  }

  changeFfmsDiscountType(req: FFMSLevelAdmin.DiscountType): Promise<boolean> {
    return this.post(this.systemApi.getUrl('changeFfmsDiscountType'), req);
  }

  getFfmsDiscountType(): Promise<FFMSLevelAdmin.DiscountType> {
    return this.get(this.systemApi.getUrl('getFfmsDiscountType'), null);
  }

  getFfmsCustomerConfigType(): Promise<FFMSCustomer.CustomerTypeStatus> {
    return this.get(this.systemApi.getUrl('getFfmsCustomerConfigType'), null);
  }

  getFFmsRateHistoryList(req: FFMSRate.HistoryReq): Promise<FFMSRate.HistoryRes> {
    return this.get(this.systemApi.getUrl('getFFmsRateHistoryList'), req);
  }

  ffPermissionsPortList(): Promise<FFMSRate.PortItem[]> {
    return this.get(this.systemApi.getUrl('ffPermissionsPortList'), null);
  }

  ffPermissionsDeparturePort(): Promise<FFMSRate.PortItem[]> {
    return this.get(this.systemApi.getUrl('ffPermissionsDeparturePort'), null);
  }

  ffAnalyzeText(req: FFMSRate.TextReq): Promise<FFMSRate.List> {
    return this.post(this.systemApi.getUrl('ffAnalyzeText'), req);
  }

  batchSaveFfPrice(req: FFMSRate.BatchSaveReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('batchSaveFfPrice'), req);
  }

  getPushedCustomerList(req: FFMSRate.PushedCustomerReq): Promise<FFMSRate.PushedCustomerRes> {
    return this.get(this.systemApi.getUrl('getPushedCustomerList'), req);
  }

  pushToCustomer(freightHistoryId: string[]): Promise<boolean> {
    return this.post(this.systemApi.getUrl('pushToCustomer'), { freightHistoryId });
  }

  getEdmJobList(freightHistoryId: string): Promise<FFMSPriceHistory.EdmJobRes> {
    return this.get(this.systemApi.getUrl('getEdmJobList'), { freightHistoryId });
  }

  getEdmJobDetail(freightHistoryId: string, edmEmailId: string): Promise<FFMSPriceHistory.EdmJobDetail> {
    return this.get(this.systemApi.getUrl('getEdmJobDetail'), { freightHistoryId, edmEmailId });
  }

  getDefaultCustomerList(page: number, pageSize: number): Promise<FFMSCustomer.List> {
    return this.get(this.systemApi.getUrl('getDefaultCustomerList'), { page, pageSize });
  }
}

const ffmsApiImpl = new FFMSApiImpl();
api.registerLogicalApi(ffmsApiImpl);
export default ffmsApiImpl;
