import {
  GloablSearchParams,
  GlobalEmailCallbackReq,
  GlobalSearchApi,
  GlobalSearchCompanyDetail,
  GlobalSearchResult,
  IDeepSearchCompanyRes,
  IDeepSearchContactRes,
  // IHsCodeBackend,
  // IHsCodeReq,
  // reqCustomsClue,
  IGlobalSearchContact,
  IGlobalSearchContactReq,
  IGlobalSearchCreateSubPayload,
  // IGlobalSearchDeepGrubStat,
  IGlobalSearchPageResultWrapper,
  IGlobalSearchSub,
  IGlobalSearchSubListReq,
  IHsCodeBackend,
  IHsCodeReq,
  MailSaleRecordReq,
  IGlobalSearchDeepGrubStat,
  // GlobalEmailCallbackReq,
  GloablSearchContomFairParams,
  GlobalSearchContomFairItem,
  IReqGlobalSearchAddCustomer,
  IContomFairCatalog,
  reqCustomsClue,
  IGlobalSearchStat,
  ILinkedInCompanyReq,
  ILinkedInCompanyResp,
  ILinkedInPersonCompanyReq,
  ILinkedInPersonCompanyResp,
  ILinkedInPersonProductReq,
  ILinkedInPersonProductResp,
  ILinkedInCountryResp,
  GoogleDataReq,
  GlobalLabelSearchParams,
  GlobalLabelSearchResItem,
  CollectLogItem,
  CompanyCollectItem,
  CompanyCollectListRes,
  EmailGuessValid,
  GlobalSearchMenuAuth,
  GlobalSearchListContactItem,
  IIgnoreCompanySubParam,
  ICompanySubFallItem,
  IGlobalSearchProductSub,
  // RequestCompanyMyList
  GlobalFeedbackType,
  GlobalFeedbackQueryType,
  // SmartRcmdItem,
  SmartRcmdReq,
  SmartRcmdPayload,
  SmartRcmdListRes,
  SmartRcmdUpdatePayload,
  TSource,
  RequestLeadsContactBulkAdd,
  WcaReq,
  IBatchAddReq,
  SimilarCompanyTableDataItem,
  FissionRuleRes,
  FissionCompanyRes,
  FessionRelation,
  ICompanyImportResp,
  ListImportCompanyReq,
  ListImportCompanyRes,
  ImportCompanyStatRes,
  FessionCompany,
  ListFissionCompanyReq,
  ListWaPageSearchParams,
  ListWaPageResponse,
  SearchSettingsRes,
  GlobalSingleAddLeadsReq,
  CustomsSingleAddLeadsReq,
  LinkedInBatchAddReq,
  EmailsBatchAddReq,
  GetCustomerLabelByEmailRes,
  IndexCode,
  BrEcharQuery,
  BrTableData,
} from '@/api/logical/global_search';
import { apis } from '../../../config';
import { api } from '../../../api/api';
import { ApiRequestConfig } from '../../../api/data/http';
import { getSignByApiParams } from '../../../utils/httpHelper';
import { ApiLifeCycleEvent } from '@/api/_base/api';
import { CustomsContinent } from '@/api/logical/edm_customs';

const eventApi = api.getEventApi();

const commontToast = (message?: string, ignore?: boolean) => {
  if (!ignore) {
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
  }
};

export const maintainWarning = (message?: string) => {
  eventApi.sendSysEvent({
    eventSeq: 0,
    eventName: 'error',
    eventLevel: 'error',
    eventData: {
      title: '【公告】小主人请不要着急，请耐心等待一会',
      popupType: 'window',
      popupLevel: 'warn',
      content: message,
    },
    auto: true,
  });
};

export class GlobalSearchApiImpl implements GlobalSearchApi {
  afterInit?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  afterLoadFinish?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  afterLogin?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  beforeLogout?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  onFocus?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  onBlur?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  onPathChange?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  name = apis.globalSearchApiImpl;

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  init() {
    return this.name;
  }

  async get(url: string, req: any, config?: ApiRequestConfig, ignoreToast?: boolean) {
    const param = {
      ...req,
      ...getSignByApiParams(req),
    };
    try {
      const { data } = await this.http.get(url, param, config);
      if (!data || !data.success) {
        if (data?.message) {
          if (data?.code === 5110) {
            maintainWarning(data?.message);
          } else {
            commontToast(data?.message, ignoreToast);
          }
        }
        return Promise.reject(data?.message);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        commontToast(undefined, ignoreToast);
      }
      if (res.status === 400) {
        commontToast(res.data?.message, ignoreToast);
      }
      // 没有返回值时 data为空
      if (res.status === 429) {
        commontToast('搜索频繁，请稍后再试', ignoreToast);
      }
      return Promise.reject(res.data);
    }
  }

  async post(url: string, body: any, reqConfig?: ApiRequestConfig, ignoreToast?: boolean) {
    const config = {
      contentType: 'json',
      noEnqueue: true,
      ...(reqConfig || {}),
    };
    try {
      const symbol = url.includes('?') ? '&' : '?';
      const signObj = getSignByApiParams({ body });
      const { data } = await this.http.post(`${url}${symbol}sign=${signObj.sign}&timestamp=${signObj.timestamp}`, body, config as ApiRequestConfig);
      if (!data || !data.success) {
        if (data?.message) {
          if (data?.code === 5110) {
            maintainWarning(data?.message);
          } else {
            commontToast(data?.message, ignoreToast);
          }
        }
        return Promise.reject(data);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        commontToast(undefined, ignoreToast);
      }
      if (res.status === 400) {
        commontToast(res.data?.message, ignoreToast);
      }
      // 没有返回值时 data为空
      if (res.status === 429) {
        commontToast('搜索频繁，请稍后再试', ignoreToast);
      }
      return Promise.reject(res.data);
    }
  }

  /**
   * 该接口返回数据结构比较奇怪
   * @param req
   * @returns
   */
  async search(req: GloablSearchParams): Promise<GlobalSearchResult> {
    return this.get(this.systemApi.getUrl('globalSearchList'), req);
  }

  async newSearch(req: GloablSearchParams): Promise<GlobalSearchResult> {
    return this.post(this.systemApi.getUrl('globalNewSearchList'), {
      ...req,
      version: 1,
    });
  }

  contomFairSearach(req: GloablSearchContomFairParams): Promise<GlobalSearchResult<GlobalSearchContomFairItem>> {
    return this.post(this.systemApi.getUrl('globalSearchContomFairList'), req);
  }

  contomNewFairSearach(req: GloablSearchContomFairParams): Promise<GlobalSearchResult<GlobalSearchContomFairItem>> {
    return this.post(this.systemApi.getUrl('globalNewSearchContomFairList'), {
      ...req,
      version: 1,
    });
  }

  globalSearchGetContactById(req: string[]): Promise<Record<string, GlobalSearchListContactItem[]>> {
    return this.post(this.systemApi.getUrl('globalSearchGetContactById'), {
      idList: req,
    });
  }
  // globalSearchGetContactById(req: string[]): {

  // }

  // getDetail(id: string): Promise<GlobalSearchCompanyDetail> {
  //   return this.get(this.systemApi.getUrl('globalSearchGetDetail'), {
  //     id,
  //     version: 1,
  //   });
  // }

  getDetail(req: { id: string; product?: string | undefined }): Promise<GlobalSearchCompanyDetail> {
    return this.get(this.systemApi.getUrl('globalSearchGetDetail'), {
      ...req,
      version: 1,
    });
  }

  getSimilarCompanytable(req: { id: string }): Promise<SimilarCompanyTableDataItem[]> {
    return this.post(this.systemApi.getUrl('globalSearchGetSimilarCompany'), req);
  }

  globalLabelSearch(req: { datas: GlobalLabelSearchParams[] }): Promise<GlobalLabelSearchResItem[]> {
    return this.post(this.systemApi.getUrl('globalLabelSearch'), req);
  }

  addClue(req: reqCustomsClue): Promise<number> {
    return this.post(this.systemApi.getUrl('globalSearchAddClue'), req);
  }

  addCustomer(req: IReqGlobalSearchAddCustomer): Promise<number> {
    return this.post(this.systemApi.getUrl('globalSearchAddCustomer'), req);
  }

  /**
   * 全球搜HsCode辅助筛选列表
   * @param req
   */
  getHsCodeList(req: IHsCodeReq): Promise<IHsCodeBackend[]> {
    req.limit = req.limit ?? 100;
    return this.get(this.systemApi.getUrl('globalSearchGetHsCodeList'), req);
  }

  deepSearchContact(id: string): Promise<IDeepSearchContactRes> {
    return this.get(this.systemApi.getUrl('globalSearchDeepSearchContact'), {
      id,
    });
  }

  globalSearchDeepStatus(id: string): Promise<IDeepSearchContactRes> {
    return this.get(this.systemApi.getUrl('globalSearchDeepStatus'), {
      operateId: id,
    });
  }

  deepNewSearchContact(id: string): Promise<IDeepSearchContactRes> {
    return new Promise((reslove, reject) => {
      this.get(this.systemApi.getUrl('globalSearchNewDeepSearchContact'), {
        id,
      }).then(res => {
        let count = 20;
        let tm: any;
        const getDeepSearchStatus = async (deepId: string) => {
          try {
            const deepResult = await this.get(this.systemApi.getUrl('globalSearchDeepStatus'), {
              operateId: deepId,
            });
            if (tm) {
              clearTimeout(tm);
            }
            if (deepResult.status === 'GRUBBED' || deepResult.status === 'OFFLINE_GRUBBING' || deepResult.status === 'OFFLINE_GRUBBED') {
              reslove(deepResult);
            } else if ((deepResult.status === 'GRUBBING' || deepResult.status === 'NOT_GRUBBING') && count > 0) {
              tm = setTimeout(() => {
                getDeepSearchStatus(res.operateId);
              }, 3000);
            } else {
              reject('error --- 未知错误');
            }
            count--;
          } catch (error) {
            reject(error);
          }
        };
        getDeepSearchStatus(res.operateId);
      });
    });
  }

  deepSearchCompany(companyName: string): Promise<IDeepSearchCompanyRes> {
    return this.get(this.systemApi.getUrl('globalSearchDeepSearchCompany'), {
      companyName,
    });
  }

  getGlobalRcmdList(productName: string): Promise<string[]> {
    return this.post(this.systemApi.getUrl('getGlobalRcmdList'), {
      productName,
    });
  }

  getContactPage(req: IGlobalSearchContactReq): Promise<IGlobalSearchContact> {
    return this.get(this.systemApi.getUrl('globalSearchContactPage'), req);
  }

  async doCreateSub(payload: IGlobalSearchCreateSubPayload): Promise<boolean> {
    await this.post(this.systemApi.getUrl('globalSearchKeywordsCreate'), payload);
    return true;
  }

  async doGetSubList(params: IGlobalSearchSubListReq): Promise<IGlobalSearchSub[]> {
    const res: IGlobalSearchPageResultWrapper<IGlobalSearchSub> = await this.get(this.systemApi.getUrl('globalSearchKeywordsList'), params);
    return res.content || [];
  }

  async doDeleteSub(ids: number[]): Promise<boolean> {
    await this.post(
      this.systemApi.getUrl('globalSearchKeywordsDelete'),
      {
        idList: ids,
      },
      {
        contentType: 'form',
      }
    );
    return true;
  }

  async doUpdateSub(id: number): Promise<boolean> {
    try {
      await this.get(this.systemApi.getUrl('globalSearchKeywordsUpdate'), {
        id,
      });
    } catch (error) {
      return false;
    }
    return true;
  }

  async doReadSubList() {
    try {
      await this.get(this.systemApi.getUrl('globalSearchReadSubList'), {}, undefined, true);
    } catch (error) {
      return false;
    }
    return true;
  }

  async doReadCompanySubList(): Promise<boolean> {
    try {
      await this.get(this.systemApi.getUrl('globalSearchReadCompanySubList'), {}, undefined, true);
    } catch (error) {
      return false;
    }
    return true;
  }

  async doMailSaleRecord(params: MailSaleRecordReq) {
    try {
      await this.post(
        this.systemApi.getUrl('globalSearchMailSaleReacord'),
        params,
        {
          contentType: 'form',
        },
        true
      );
    } catch (error) {
      console.log('doMailSaleRecord error');
    }
  }

  async doGetDeepGrubStat() {
    try {
      const data = await this.get(this.systemApi.getUrl('globalSearchDeepGrubStat'), undefined, undefined, true);
      return (data?.deepGrubStatDetailVOList || []) as IGlobalSearchDeepGrubStat[];
    } catch (error) {
      throw new Error('deep grub task list error');
    }
  }

  async globalSearchDeepGrubStatAll() {
    try {
      const data = await this.get(this.systemApi.getUrl('globalSearchDeepGrubStatAll'), undefined, undefined, true);
      return (data?.deepGrubStatDetailVOList || []) as IGlobalSearchDeepGrubStat[];
    } catch (error) {
      throw new Error('deep grub task list error');
    }
  }

  async globalSearchDeepGrubStatAllV2() {
    try {
      const data = await this.get(this.systemApi.getUrl('globalSearchDeepGrubStatAllV2'), undefined, undefined, true);
      return (data?.deepGrubStatDetailVOList || []) as IGlobalSearchDeepGrubStat[];
    } catch (error) {
      throw new Error('deep grub task list error');
    }
  }

  async doGetDeepGrubCompanyStat() {
    try {
      const data = await this.get(this.systemApi.getUrl('globalSearchDeepGrubCompanyStat'), undefined, undefined, true);
      return (data?.deepGrubStatDetailVOList || []) as IGlobalSearchDeepGrubStat[];
    } catch (error) {
      throw new Error('deep grub task list error');
    }
  }

  doDeepSearchCompany(id: string) {
    return this.get(this.systemApi.getUrl('deepGrubCompanyDetail'), {
      id,
    });
  }

  globalBatchAddAddressBook(req: { idList: string[]; groupIds?: number[] }): Promise<void> {
    return this.post(this.systemApi.getUrl('globalBatchAddAddressBook'), req, {
      // 后端批量调用需要花费较长时间 超时时间延长到2分钟ß
      timeout: 2 * 60 * 1000,
    });
  }

  globalBatchAddAddressBookV1(req: { idList: string[]; groupIds?: number[]; contactMergeType?: number }): Promise<IBatchAddReq> {
    return this.post(this.systemApi.getUrl('globalBatchAddAddressBookV1'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  globalEmailCheckCallback(req: GlobalEmailCallbackReq): Promise<void> {
    return this.post(this.systemApi.getUrl('globalEmailCheckCallback'), req);
  }

  async doGetContomfairSearchCatalog(): Promise<IContomFairCatalog[]> {
    const rawData: Array<Omit<IContomFairCatalog, 'children'>> = await this.get(this.systemApi.getUrl('getContomfairSearchCatalog'), {});
    const resultData: IContomFairCatalog[] = [];
    rawData.forEach(item => {
      if (!item.parent) {
        resultData.push({
          ...item,
          children: rawData.filter(e => e.parent === item.key),
        });
      }
    });
    return resultData;
  }

  doGetStat(): Promise<IGlobalSearchStat> {
    return this.get(this.systemApi.getUrl('globalSearchStat'), {});
  }

  getLinkedInCompanySearch(req: ILinkedInCompanyReq): Promise<ILinkedInCompanyResp> {
    return this.post(this.systemApi.getUrl('getLinkedInCompanySearch'), req);
  }

  getNewLinkedInCompanySearch(req: ILinkedInCompanyReq): Promise<ILinkedInCompanyResp> {
    return this.post(this.systemApi.getUrl('getNewLinkedInCompanySearch'), {
      ...req,
      version: 1,
    });
  }
  getLinkedInSearch(req: ILinkedInPersonProductReq): Promise<ILinkedInPersonProductResp> {
    return this.post(this.systemApi.getUrl('getLinkedInSearch'), {
      ...req,
      type: 60,
    });
  }

  getLinkedInPersonSearchCompany(req: ILinkedInPersonCompanyReq): Promise<ILinkedInPersonCompanyResp> {
    return this.post(this.systemApi.getUrl('getLinkedInPersonSearchCompany'), req);
  }

  getLinkedInPersonSearchProduct(req: ILinkedInPersonProductReq): Promise<ILinkedInPersonProductResp> {
    return this.post(this.systemApi.getUrl('getLinkedInPersonSearchProduct'), {
      ...req,
      version: 1,
    });
  }

  getLinkedInCountryList(req: { searchType: number }): Promise<ILinkedInCountryResp[]> {
    return this.get(this.systemApi.getUrl('getLinkedInCountryList'), req);
  }

  doSaveGoogleData(req: GoogleDataReq): Promise<void> {
    return this.post(this.systemApi.getUrl('saveGoogleData'), req, undefined, true);
  }

  saveLbsChineseData(req: GoogleDataReq): Promise<void> {
    return this.post(this.systemApi.getUrl('saveLbsChineseData'), req, undefined, true);
  }

  getFacebookCompanySearch(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('getFacebookCompanySearch'), req);
  }

  doCreateCollectByCompanyId(companyId: string | number, name?: string, country?: string): Promise<string | number> {
    return this.post(
      this.systemApi.getUrl('createCollectByCompanyId'),
      {
        companyId,
        name,
        country,
      },
      {
        contentType: 'form',
      }
    );
  }
  doDeleteCollectById(req: { collectId?: string | number; collectIds?: string }): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteCollectById'), req, {
      contentType: 'form',
    });
  }
  doGetCollectList(param: { page: number; size: number }): Promise<CompanyCollectListRes<CompanyCollectItem>> {
    return this.get(this.systemApi.getUrl('getCollectList'), {
      ...param,
    });
  }
  queryFissionRule(param: { fissionId: number }): Promise<FissionRuleRes> {
    return this.post(this.systemApi.getUrl('queryFissionRule'), param);
  }
  listFissionCompany(param: ListFissionCompanyReq): Promise<FissionCompanyRes> {
    return this.post(this.systemApi.getUrl('listFissionCompany'), param);
  }
  listWaPage(param: ListWaPageSearchParams): Promise<ListWaPageResponse> {
    return this.post(this.systemApi.getUrl('listWaPage'), param, { noEnqueue: true, useCacheReturn: false });
  }
  listWaCountry(): Promise<{ label: string; code: string }[]> {
    return this.post(this.systemApi.getUrl('listWaCountry'), {});
  }
  async doGetCollectLogList(collectId: string | number): Promise<Array<{ time: string; item: CollectLogItem[] }>> {
    const res: CollectLogItem[] | null = await this.get(this.systemApi.getUrl('listCollectLog'), {
      collectId,
    });
    const collectLogItemMap: { [time: string]: CollectLogItem[] } = {};
    res?.forEach(item => {
      if (collectLogItemMap[item.dateStr]) {
        collectLogItemMap[item.dateStr].push(item);
      } else {
        collectLogItemMap[item.dateStr] = [item];
      }
    });
    const list: Array<{ time: string; item: CollectLogItem[] }> = [];
    for (const timeString in collectLogItemMap) {
      if (Object.prototype.hasOwnProperty.call(collectLogItemMap, timeString)) {
        const items = collectLogItemMap[timeString];
        list.push({
          time: timeString,
          item: items,
        });
      }
    }
    return list;
  }
  doUpdateCollect(id: string | number): Promise<void> {
    return this.post(
      this.systemApi.getUrl('updateCollect'),
      {
        id,
      },
      {
        contentType: 'form',
      }
    );
  }

  doGetGlobalSearchCountryList(): Promise<CustomsContinent[]> {
    return this.get(this.systemApi.getUrl('getGlobalSearchCountryList'), {});
  }

  doGetEmailGuess(params: { name: string; domain: string }): Promise<string[]> {
    return this.post(this.systemApi.getUrl('getEmailGuessResult'), {
      ...params,
    });
  }

  doSaveEmailGuessValid(params: EmailGuessValid): Promise<void> {
    return this.post(this.systemApi.getUrl('saveEmailGuessValid'), {
      ...params,
    });
  }
  doGetGlobalSearachGetMenuAuth(): Promise<GlobalSearchMenuAuth[]> {
    return this.post(this.systemApi.getUrl('getGlobalSearachGetMenuAuth'), {});
  }

  doGetNewSubAuth(): Promise<boolean> {
    return this.post(this.systemApi.getUrl('getNewSubAuth'), {});
  }

  doIgnoreCompanySub(param: IIgnoreCompanySubParam): Promise<boolean> {
    return this.post(this.systemApi.getUrl('globalSearchIgnoreCompany'), {
      ...param,
      type: param.type ?? 0,
    });
  }

  doRemoveIgnoreCompanySub(params: IIgnoreCompanySubParam): Promise<boolean> {
    return this.post(this.systemApi.getUrl('globalSearchRemoveIgnoreCompany'), {
      ...params,
    });
  }

  doGetSubCompanyFallList(params: { startOrder?: number; size: number }): Promise<Array<ICompanySubFallItem>> {
    return this.get(this.systemApi.getUrl('getSubCompanyFallList'), {
      ...params,
    });
  }

  doUpdateProductSub(params: IGlobalSearchProductSub): Promise<boolean> {
    return this.post(this.systemApi.getUrl('updateSubCompany'), {
      ...params,
    });
  }

  globalFeedbackReportAdd(params: GlobalFeedbackType): Promise<boolean> {
    return this.post(this.systemApi.getUrl('globalFeedbackReportAdd'), params);
  }

  globalFeedbackTypeQuery(): Promise<GlobalFeedbackQueryType[]> {
    return this.post(this.systemApi.getUrl('globalFeedbackTypeQuery'), {});
  }

  globalFeedbackResultQuery(params: { companyId: number | string }): Promise<{ currentDayReport: boolean }> {
    return this.post(this.systemApi.getUrl('globalFeedbackResultQuery'), params);
  }

  checkIpIsMainLand(): Promise<boolean> {
    return this.get(this.systemApi.getUrl('globalSearchCheckOpenProxy'), undefined);
  }
  doGetGlobalSearchGptRcmd(params: { value: string; language: string }): Promise<string[]> {
    return this.post(this.systemApi.getUrl('gloabalSearchGptRcmd'), params);
  }

  async doGetSmartRcmdList(params: SmartRcmdReq): Promise<SmartRcmdListRes> {
    const res: SmartRcmdListRes = await this.get(this.systemApi.getUrl('getSmartRcmdList'), params);
    res.content = res.content.map(it => ({
      ...it,
      // sentry此处报类型错误，此字段于新版本已无用，索性直接去除
      // synonyms: it.synonyms ? (it.synonyms as unknown as string).split(',') : it.synonyms,
    }));
    return res;
  }

  doCreateSmartRcmd(item: SmartRcmdPayload): Promise<boolean> {
    const _item = {
      ...item,
    };
    if (item.synonyms) {
      _item.synonyms = item.synonyms.join(',') as any;
    }
    return this.post(this.systemApi.getUrl('createSmartRcmd'), _item);
  }

  doUpdateSmartRcmd(item: SmartRcmdUpdatePayload): Promise<boolean> {
    const _item = {
      ...item,
    };
    if (item.synonyms) {
      _item.synonyms = item.synonyms.join(',') as any;
    }
    return this.post(this.systemApi.getUrl('updateSmartRcmd'), _item);
  }

  doDeleteSmartRcmd(idList: number[]): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteSmartRcmd'), {
      idList,
    });
  }

  doGetSmartRcmdCompany(params: { page: number; size: number; id: number }): Promise<IGlobalSearchPageResultWrapper<ICompanySubFallItem>> {
    return this.get(this.systemApi.getUrl('getSmartRcmdCompany'), {
      ...params,
      _t: new Date().getTime(),
    });
  }

  doRemoveRcmdCompany(params: { idList: string[]; type: 0 }): Promise<boolean> {
    return this.post(this.systemApi.getUrl('removeRcmdCompany'), params);
  }

  globalBatchAddLeadsV1(req: {
    globalInfoVOList: Array<{ id: string; chineseCompanyId: string }>;
    sourceType: TSource;
    leadsGroupIdList?: Array<number>;
  }): Promise<IBatchAddReq> {
    return this.post(this.systemApi.getUrl('globalBatchAddLeadsV1'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  globalSingleAddLeads(req: GlobalSingleAddLeadsReq): Promise<IBatchAddReq> {
    return this.post(this.systemApi.getUrl('globalSingleAddLeads'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  customsSingleAddLeads(req: CustomsSingleAddLeadsReq): Promise<IBatchAddReq> {
    return this.post(this.systemApi.getUrl('customsSingleAddLeads'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  linkedInbatchAddLeads(req: LinkedInBatchAddReq): Promise<IBatchAddReq> {
    return this.post(this.systemApi.getUrl('linkedInbatchAddLeads'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  batchAddEmailLeads(req: EmailsBatchAddReq): Promise<IBatchAddReq> {
    return this.post(this.systemApi.getUrl('batchAddEmailLeads'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  getCustomerLabelByEmailNew(req: { email_list: string[] }): Promise<GetCustomerLabelByEmailRes> {
    return this.post(this.systemApi.getUrl('getCustomerLabelByEmailNew'), req, { noEnqueue: true, useCacheReturn: false });
  }

  globalSearchGetIdList(req: GloablSearchParams): Promise<{ idList: string[] }> {
    return this.post(this.systemApi.getUrl('globalSearchGetIdList'), req);
  }

  globalSearchBrGetIdList(req: GloablSearchParams): Promise<{ idList: string[] }> {
    return this.post(this.systemApi.getUrl('globalSearchBrGetIdList'), req);
  }

  globalSearchCantonfairGetIdList(req: GloablSearchContomFairParams): Promise<{ idList: string[] }> {
    return this.post(this.systemApi.getUrl('globalSearchCantonfairGetIdList'), req);
  }

  globalBatchAddEdm(req: { edmInfoVOList: Array<{ id: string }>; sourceType: TSource; groupId: string; groupName: string; planId: string }): Promise<IBatchAddReq> {
    return this.post(this.systemApi.getUrl('globalBatchAddEdm'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  batchEdmExposure(req: { edmInfoVOList: Array<{ id: string }> }): Promise<void> {
    return this.post(this.systemApi.getUrl('batchEdmExposure'), req, {
      timeout: 2 * 60 * 1000,
      noErrorMsgEmit: true,
    });
  }

  customsBatchAddLeadsV1(req: {
    sourceType: TSource;
    customsInfoVOList: Array<{ name: string; originName: string; country: string; chineseCompanyId?: string }>;
    leadsGroupIdList?: Array<number>;
  }): Promise<IBatchAddReq> {
    return this.post(this.systemApi.getUrl('customsBatchAddLeadsV1'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  importCompanyByFile(req: FormData): Promise<ICompanyImportResp> {
    return this.post(this.systemApi.getUrl('importCompanyByFile'), req, {
      contentType: 'stream',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  getImportCompanyStat(): Promise<ImportCompanyStatRes> {
    return this.get(this.systemApi.getUrl('getImportCompanyStat'), {}, { noErrorMsgEmit: true }, true);
  }

  viewImportCompany(id: number): Promise<void> {
    return this.get(this.systemApi.getUrl('viewImportCompany'), { id }, { noErrorMsgEmit: true }, true);
  }

  deleteImportCompany(params: { ids: number[] }): Promise<void> {
    return this.post(this.systemApi.getUrl('deleteImportCompany'), params);
  }

  clearUnmatchedImportCompany(): Promise<void> {
    return this.post(this.systemApi.getUrl('clearUnmatchedImportCompany'), {});
  }

  collectImportCompany(params: { ids: number[] }): Promise<void> {
    return this.post(this.systemApi.getUrl('collectImportCompany'), params);
  }

  listImportCompany(params: ListImportCompanyReq): Promise<ListImportCompanyRes> {
    return this.post(this.systemApi.getUrl('listImportCompany'), params);
  }

  searchKeywordsRecommendTip(): Promise<boolean> {
    return this.get(this.systemApi.getUrl('searchKeywordsRecommendTip'), {}, { noErrorMsgEmit: true }, true);
  }

  searchSettings(): Promise<SearchSettingsRes> {
    return this.get(this.systemApi.getUrl('searchSettings'), {}, { noErrorMsgEmit: true }, true);
  }

  searchTextCheck(req: { text: string }): Promise<void> {
    return this.get(this.systemApi.getUrl('searchTextCheck'), req);
  }

  leadsContactBulkAdd(req: RequestLeadsContactBulkAdd): Promise<void> {
    return this.post(this.systemApi.getUrl('leadsContactBulkAdd'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  doGetWcaList(req: WcaReq): Promise<GlobalSearchResult> {
    return this.post(this.systemApi.getUrl('doGetWcaList'), req);
  }

  fissionRelation(req: { fissionId: number; recordId: number }): Promise<FessionRelation> {
    return this.post(this.systemApi.getUrl('fissionRelation'), req);
  }

  fissionOverview(req: { fissionId: number }): Promise<FessionRelation> {
    return this.post(this.systemApi.getUrl('fissionOverview'), req);
  }

  fissionCompanyList(req: { fissionId: number; country: string; level: number; parentId: number }): Promise<FessionCompany[]> {
    return this.post(this.systemApi.getUrl('fissionCompanyList'), req);
  }

  getBrCountry(): Promise<CustomsContinent[]> {
    return this.post(this.systemApi.getUrl('getBrCountry'), {});
  }

  getBrSearchResult(req: GloablSearchParams): Promise<GlobalSearchResult> {
    return this.post(this.systemApi.getUrl('getBrSearchResult'), {
      ...req,
      version: 1,
    });
  }

  getBrEcharQuery(req: { country: string; indexCode: IndexCode }): Promise<BrEcharQuery[]> {
    return this.post(this.systemApi.getUrl('getBrEcharQuery'), req);
  }

  getBrTableData(req: { country: string; page: number; size: number }): Promise<BrTableData> {
    return this.post(this.systemApi.getUrl('getBrTableData'), req);
  }
}

const impl = new GlobalSearchApiImpl();
api.registerLogicalApi(impl);
export default impl;
