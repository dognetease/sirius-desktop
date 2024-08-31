import {
  CustomsContinent,
  CustomsRecordReq,
  EdmCustomsApi,
  HScodeItem,
  ICustomDataGetContactsReq,
  ICustomDataGetContactsResp,
  reqAddCustomsStar,
  reqBarTopBuyers,
  reqBuyers,
  reqBuysersBase,
  reqCatchGetEdmEmail,
  reqCustomsBaseParam,
  reqCustomsCompanyList,
  reqCustomsExcavate,
  reqCustomsHsCode,
  reqCustomsStarList,
  reqCustomsStateCountry,
  reqCustomsStatistics,
  ReqCustomsTranslate,
  reqDeleteCustomsStar,
  reqLading,
  reqSuppliersRecordList,
  resBarTopBuyers,
  resBuyers,
  resBuysersBase,
  resBuysersRecord,
  resBuysersSuppliers,
  resCustomsCompanyList,
  resCustomsContact,
  resCustomsCountry,
  resCustomsDataUpdate,
  resCustomsExactExcavate,
  resCustomsExcavate,
  resCustomsFollowCountry,
  resCustomsFreight,
  resCustomsHsCode,
  // ResCustomsRecord,
  resCustomsStarList,
  resCustomsStateCountry,
  resCustomsStatistics,
  ResCustomsTranslate,
  resLading,
  resSuppliersBase,
  resSuppliersBuysers,
  resSuppliersRecord,
  resSuppliersRecordList,
  UpdateStarTagReq,
  ResCustomsRecord,
  // CustomsRecordReq,
  // HScodeItem,
  // CustomsContinent,
  GetIDByListReq,
  CompanyIdType,
  CustomsRecord,
  TCustomsPort,
  ReqAddCompanySub,
  ReqSuggest,
  ResSuggest,
  AiKeywordsSearchReq,
  CompanyExists,
  IHotPortCollection,
  reqGlobalBuysersBase,
  reqGlobalCustomsBaseParam,
  reqGlobalCustomsStatistics,
  reqGlobalSuppliersRecordList,
  reqGlobalBarTopBuyers,
  customsDeepTask,
  ResForwarder,
  customsCompanyType,
  ReqForwarder,
  AirlineItem,
  ExcavateCompanyDetail,
  ExcavateCompanyItem,
  UserQuotaItem,
  UserLogItem,
  UserLogReq,
  ExcavateCompanyReq,
  FissionRuleSaveReq,
  ImportRuleSaveReq,
  ForwarderPortSuggestReq,
  ForwarderTopSearchReq,
  ForwarderSearchTop,
  OptionValueType,
  CommonlyUsePortType,
  CommonlyUsePort,
  TradeReq,
  PurchaseResult,
  DistributionResult,
  TradeALlReq,
  TradeCompanyReq,
  TradeRouteResult,
  DistributionFormData,
  TradeCopmayAllReq,
  TradeCompanyData,
  CompanyTrend,
  HotProductRank,
  LogSave,
  TradeForwarder,
  HasQuantity,
  HistoryItem,
  SearchJudge,
  SearchJudgeResult,
  GuessAndSaveParam,
  FreightReq,
  FreightRelationReq,
  FreightRelationRes,
  FreightAreaReq,
  FreightAreaRes,
  TransportTradeReq,
  TradeportProRes,
  TradeportValue,
} from '@/api/logical/edm_customs';
import { newClueReq, RequestCompanyMyList } from '@/api/logical/customer';
import { apis } from '../../../config';
import { api } from '../../../api/api';
import { ApiRequestConfig } from '../../../api/data/http';
import { isElectron } from '@/config';
import { getSignByApiParams } from '../../../utils/httpHelper';
import { maintainWarning } from './global_search_impl';

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
export class EdmCustomsApiImpl implements EdmCustomsApi {
  name = apis.edmCustomsApiImpl;

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  init() {
    return this.name;
  }

  async get(url: string, req: any, config?: ApiRequestConfig, hideCodeMessage?: boolean) {
    const param = {
      ...req,
      ...getSignByApiParams(req),
    };
    try {
      const { data } = await this.http.get(url, param, config);
      if (!data || !data.success) {
        if (!hideCodeMessage) {
          if (data?.code === 5110) {
            maintainWarning(data?.message);
          } else {
            commontToast(data?.message || '网络错误');
          }
        }
        return Promise.reject(data?.message);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        commontToast();
      }
      if (res.status == 400) {
        commontToast(res.data?.message);
      }
      return Promise.reject(res.data);
    }
  }

  async post(url: string, body: any, config?: ApiRequestConfig, hideCodeMessage?: boolean) {
    config = {
      contentType: 'json',
      noEnqueue: false,
      ...(config || {}),
    };
    const param = {
      ...body,
    };
    try {
      const symbol = url.includes('?') ? '&' : '?';
      const signObj = getSignByApiParams({ body });
      const { data } = await this.http.post(`${url}${symbol}sign=${signObj.sign}&timestamp=${signObj.timestamp}`, param, config as ApiRequestConfig);
      if (!data || !data.success) {
        if (!hideCodeMessage) {
          if (data?.code === 5110) {
            maintainWarning(data?.message);
          } else {
            commontToast(data?.message || '网络错误');
          }
        }
        return Promise.reject(data);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        commontToast();
      }
      if (res.status == 400) {
        commontToast(res.data?.message);
      }
      // 没有返回值时 data为空
      if (res.status == 429) {
        commontToast(res.statusText || '请求次数超出限制');
      }
      return Promise.reject(res.data);
    }
  }

  async delete(url: string, req: any, config?: ApiRequestConfig, hideCodeMessage?: boolean) {
    const param = {
      ...req,
    };
    try {
      const { data } = await this.http.delete(url, param, config);
      if (!data || !data.success) {
        if (!hideCodeMessage) {
          commontToast(data?.message || '网络错误');
        }
        return Promise.reject(data?.message);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        commontToast();
      }
      if (res.status == 400) {
        commontToast(res.data?.message);
      }
      return Promise.reject(res.data);
    }
  }

  companyMyList(req?: any): Promise<any> {
    return this.post(this.systemApi.getUrl('companyMyList'), req);
  }

  buyersList(req: reqBuyers): Promise<resBuyers> {
    return this.post(this.systemApi.getUrl('buyersList'), req);
  }

  buyersAsyncList(req: { asyncId: string }): Promise<resBuyers> {
    return this.post(this.systemApi.getUrl('buyersAsyncList'), req, {
      contentType: 'form',
    });
  }

  getBuyersCount(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('getBuyersCount'), req);
  }

  suppliersList(req: reqBuyers): Promise<resBuyers> {
    return this.post(this.systemApi.getUrl('suppliersList'), req);
  }

  suppliersAsyncList(req: { asyncId: string }): Promise<resBuyers> {
    return this.post(this.systemApi.getUrl('suppliersAsyncList'), req, {
      contentType: 'form',
    });
  }

  getSuppliersCount(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('getSuppliersCount'), req);
  }

  customsCompanyList(req: reqCustomsCompanyList): Promise<resCustomsCompanyList> {
    return this.post(this.systemApi.getUrl('customsCompanyList'), req);
  }

  buyersBase(req: reqBuysersBase): Promise<resBuysersBase> {
    return this.get(this.systemApi.getUrl('buyersBase'), req);
  }

  globalBuyersBase(req: reqGlobalBuysersBase): Promise<resBuysersBase> {
    return this.post(this.systemApi.getUrl('globalBuyersBase'), req);
  }

  buyersRecord(req: reqCustomsBaseParam): Promise<resBuysersRecord> {
    return this.get(this.systemApi.getUrl('buyersRecord'), req);
  }

  globalBuyersRecord(req: reqGlobalCustomsBaseParam): Promise<resBuysersRecord> {
    return this.post(this.systemApi.getUrl('globalBuyersRecord'), req);
  }

  buyersSuppliers(req: reqCustomsBaseParam): Promise<resBuysersSuppliers> {
    return this.get(this.systemApi.getUrl('buyersSuppliers'), req);
  }

  globalBuyersSuppliers(req: reqGlobalCustomsBaseParam): Promise<resBuysersSuppliers> {
    return this.post(this.systemApi.getUrl('globalBuyersSuppliers'), req);
  }

  buyersFreight(req: reqCustomsBaseParam): Promise<resCustomsFreight> {
    return this.post(this.systemApi.getUrl('buyersFreight'), req);
  }

  globalBuyersFreight(req: reqGlobalCustomsBaseParam): Promise<resCustomsFreight> {
    return this.post(this.systemApi.getUrl('globalBuyersFreight'), req);
  }

  suppliersBase(req: reqBuysersBase): Promise<resSuppliersBase> {
    return this.get(this.systemApi.getUrl('suppliersBase'), req);
  }

  globalSuppliersBase(req: reqGlobalBuysersBase): Promise<resSuppliersBase> {
    return this.post(this.systemApi.getUrl('globalSuppliersBase'), req);
  }

  suppliersRecord(req: reqCustomsBaseParam): Promise<resSuppliersRecord> {
    return this.get(this.systemApi.getUrl('suppliersRecord'), req);
  }

  globalSuppliersRecord(req: reqGlobalCustomsBaseParam): Promise<resSuppliersRecord> {
    return this.post(this.systemApi.getUrl('globalSuppliersRecord'), req);
  }

  suppliersBuyers(req: reqCustomsBaseParam): Promise<resSuppliersBuysers> {
    return this.get(this.systemApi.getUrl('suppliersBuyers'), req);
  }

  fissioCompanyRelation(req: reqGlobalCustomsBaseParam): Promise<resSuppliersBuysers> {
    return this.post(this.systemApi.getUrl('fissioCompanyRelation'), req);
  }

  getBuyersCompanyList(req: reqGlobalCustomsBaseParam): Promise<resSuppliersBuysers> {
    return this.post(this.systemApi.getUrl('getBuyersCompanyList'), req);
  }

  getSuppliersCompanyList(req: reqGlobalCustomsBaseParam): Promise<resSuppliersBuysers> {
    return this.post(this.systemApi.getUrl('getSuppliersCompanyList'), req);
  }

  globalSuppliersBuyers(req: reqGlobalCustomsBaseParam): Promise<resSuppliersBuysers> {
    return this.post(this.systemApi.getUrl('globalSuppliersBuyers'), req);
  }

  suppliersFreight(req: reqCustomsBaseParam): Promise<resCustomsFreight> {
    return this.post(this.systemApi.getUrl('suppliersFreight'), req);
  }

  globalSuppliersFreight(req: reqGlobalCustomsBaseParam): Promise<resCustomsFreight> {
    return this.post(this.systemApi.getUrl('globalSuppliersFreight'), req);
  }

  customsUpdateTime(): Promise<string> {
    return this.get(this.systemApi.getUrl('customsUpdateTime'), null);
  }

  getCustomsCountry(): Promise<resCustomsCountry[]> {
    return this.get(this.systemApi.getUrl('getCustomsCountry'), null);
  }

  getCustomsStateCountry(req: reqCustomsStateCountry): Promise<resCustomsStateCountry[]> {
    return this.get(this.systemApi.getUrl('getCustomsStateCountry'), req);
  }

  getBuyersCountry(): Promise<resCustomsCountry[]> {
    return this.get(this.systemApi.getUrl('getBuyersCountry'), null);
  }

  getFollowCountry(): Promise<resCustomsFollowCountry[]> {
    return this.get(this.systemApi.getUrl('getFollowCountry'), null);
  }

  addFollowCountry(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('addFollowCountry'), req, {
      contentType: 'json',
    });
  }

  customsDataUpdate(): Promise<resCustomsDataUpdate[]> {
    return this.get(this.systemApi.getUrl('customsDataUpdate'), null);
  }

  batchGetEdmEmail(req: reqCatchGetEdmEmail): Promise<string[]> {
    return this.post(this.systemApi.getUrl('batchGetEdmEmail'), req);
  }

  // @ts-ignore
  deleteFollowCountry(req: any): Promise<any> {
    const url = this.systemApi.getUrl('deleteFollowCountry');
    return this.delete(`${url}?countryIdList=${req.countryIdList.toString()}`, null);
  }

  getSuppliersCountry(): Promise<resCustomsCountry[]> {
    return this.get(this.systemApi.getUrl('getSuppliersCountry'), null);
  }

  customsAddClue(req: newClueReq): Promise<number> {
    return this.post(this.systemApi.getUrl('customsAddClue'), req);
  }

  customsAddCustomer(req: RequestCompanyMyList): Promise<number> {
    return this.post(this.systemApi.getUrl('customsAddCustomer'), req);
  }

  customsTranslate(req: ReqCustomsTranslate): Promise<ResCustomsTranslate> {
    return this.post(this.systemApi.getUrl('customsTranslate'), req, {
      contentType: 'json',
    });
  }
  chromeTranslate(req: ReqCustomsTranslate): Promise<ResCustomsTranslate> {
    return this.post(this.systemApi.getUrl('chromeTranslate'), req, {
      contentType: 'json',
    });
  }

  customsHsCode(req: reqCustomsHsCode): Promise<resCustomsHsCode[]> {
    return this.get(this.systemApi.getUrl('customsHsCode'), req);
  }

  async updateCustomsStarTag(req?: UpdateStarTagReq): Promise<boolean> {
    try {
      await this.post(
        this.systemApi.getUrl('readStarMarkUpdate'),
        req,
        {
          contentType: 'form',
        },
        true
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  addCustomsStarMark(req: reqAddCustomsStar): Promise<boolean> {
    return this.post(this.systemApi.getUrl('customsStarMark'), req);
  }

  customsStarList(req: reqCustomsStarList): Promise<resCustomsStarList> {
    return this.get(this.systemApi.getUrl('customsStarMark'), req);
  }

  deleteCustomsStar(req: reqDeleteCustomsStar): Promise<boolean> {
    return this.delete(this.systemApi.getUrl('customsStarMark'), req);
  }

  deleteCustomsStarById(req: reqDeleteCustomsStar): Promise<boolean> {
    return this.delete(this.systemApi.getUrl('deleteCustomsStarMark'), req);
  }

  suppliersRecordList(req: reqSuppliersRecordList): Promise<resSuppliersRecordList> {
    return this.get(this.systemApi.getUrl('suppliersRecordList'), req);
  }

  globalSuppliersRecordList(req: reqGlobalSuppliersRecordList): Promise<resSuppliersRecordList> {
    return this.post(this.systemApi.getUrl('globalSuppliersRecordList'), req);
  }

  buyersRecordList(req: reqSuppliersRecordList): Promise<resSuppliersRecordList> {
    return this.get(this.systemApi.getUrl('buyersRecordList'), req);
  }

  globalBuyersRecordList(req: reqGlobalSuppliersRecordList): Promise<resSuppliersRecordList> {
    return this.post(this.systemApi.getUrl('globalBuyersRecordList'), req);
  }

  customsContact(req: reqCustomsBaseParam): Promise<resCustomsContact> {
    return this.get(this.systemApi.getUrl('customsContact'), req);
  }

  fuzzyExcavate(req: reqCustomsExcavate): Promise<resCustomsExcavate> {
    return this.get(this.systemApi.getUrl('fuzzyExcavate'), req);
  }

  exactlyExcavate(req: reqCustomsExcavate): Promise<resCustomsExactExcavate> {
    return this.get(this.systemApi.getUrl('exactlyExcavate'), req);
  }

  globalSearchContact(req: Partial<reqCustomsCompanyList>): Promise<resCustomsContact> {
    return this.get(this.systemApi.getUrl('globalSearchContact'), req);
  }

  openThirdUrl(url: string) {
    let newUrl = url;
    if (!url.includes('http')) {
      newUrl = `http://${newUrl}`;
    }
    if (isElectron() && window.electronLib) {
      console.log('wwwwopenxxxx', newUrl);
      window.electronLib.windowManage.openWindow(newUrl).then().catch(console.error);
    } else {
      window.open(newUrl, '_blank', 'menubar=yes,toolbar=yes,location=yes,status=yes,resizable=yes,scrollbars=yes');
    }
  }

  buyersStatistics(req: reqCustomsStatistics): Promise<resCustomsStatistics> {
    return this.get(this.systemApi.getUrl('buyersStatistics'), req);
  }

  globalBuyersStatistics(req: reqGlobalCustomsStatistics): Promise<resCustomsStatistics> {
    return this.post(this.systemApi.getUrl('globalBuyersStatistics'), req);
  }

  suppliersStatistics(req: reqCustomsStatistics): Promise<resCustomsStatistics> {
    return this.get(this.systemApi.getUrl('suppliersStatistics'), req);
  }

  globalSuppliersStatistics(req: reqGlobalCustomsStatistics): Promise<resCustomsStatistics> {
    console.log(this.systemApi.getUrl('globalSuppliersStatistics'), 'xxxxx');
    return this.post(this.systemApi.getUrl('globalSuppliersStatistics'), req);
  }

  billOfLading(req: reqLading): Promise<resLading> {
    return this.get(this.systemApi.getUrl('billOfLading'), req);
  }

  barTopBuyers(req: reqBarTopBuyers): Promise<resBarTopBuyers> {
    return this.get(this.systemApi.getUrl('barTopBuyers'), req);
  }

  globalBarTopBuyers(req: reqGlobalBarTopBuyers): Promise<resBarTopBuyers> {
    return this.post(this.systemApi.getUrl('globalBarTopBuyers'), req);
  }

  barTopSuppliers(req: reqBarTopBuyers): Promise<resBarTopBuyers> {
    return this.get(this.systemApi.getUrl('barTopSuppliers'), req);
  }

  barGlobalTopSuppliers(req: reqGlobalBarTopBuyers): Promise<resBarTopBuyers> {
    return this.post(this.systemApi.getUrl('barGlobalTopSuppliers'), req);
  }

  customsBatchGetEdmEmail(req: { starMarkIdList: number[] }): Promise<string[]> {
    return this.post(this.systemApi.getUrl('customsBatchGetEdmEmail'), req);
  }

  customDataGetContacts(req: ICustomDataGetContactsReq): Promise<ICustomDataGetContactsResp> {
    return this.get(this.systemApi.getUrl('customDataGetContacts'), req);
  }

  doGetCustomsRecordList(req: CustomsRecordReq): Promise<ResCustomsRecord> {
    return this.post(this.systemApi.getUrl('customRecordList'), req);
  }

  aiKeywordSearch(req: AiKeywordsSearchReq): Promise<string[]> {
    return this.post(
      this.systemApi.getUrl('aiKeywordSearch'),
      req,
      {
        contentType: 'form',
      },
      true
    );
  }

  aiKeywordSearchQuota(): Promise<number> {
    return this.get(this.systemApi.getUrl('aiKeywordSearchQuota'), {}, undefined, true);
  }

  doGetCustomsRecordCountryList(): Promise<CustomsContinent[]> {
    return this.get(this.systemApi.getUrl('customsRecordCountryList'), {});
  }

  doGetCustomsOldCountryList(): Promise<CustomsContinent[]> {
    return this.get(this.systemApi.getUrl('customsOldCountryList'), {});
  }

  private hsCodeTree: Array<HScodeItem> = [];

  async doGetHscodeDataList(): Promise<HScodeItem[]> {
    if (this.hsCodeTree.length > 0) {
      return Promise.resolve(this.hsCodeTree);
    }
    const transHscodeTreeToArray = (list: HScodeItem[], parent?: HScodeItem | null, resultList: HScodeItem[] = []) => {
      list.forEach(hscodeItem => {
        hscodeItem.parent = parent;
        if (hscodeItem.hsCode) {
          resultList.push(hscodeItem);
        }
        if (hscodeItem.child) {
          transHscodeTreeToArray(hscodeItem.child, hscodeItem, resultList);
        }
      });
      return resultList;
    };
    const res = await this.get(this.systemApi.getUrl('customsRecordHscodeTree'), {});
    this.hsCodeTree = transHscodeTreeToArray(res, null);
    return this.hsCodeTree;
  }

  async doSearchHscode(hscodeValue: string): Promise<Array<HScodeItem>> {
    const matchItemList: HScodeItem[] = [];
    const _hsCodeItemData = await this.doGetHscodeDataList();
    if (hscodeValue) {
      for (let index = 0; index < _hsCodeItemData.length; index++) {
        const hscodeItem = _hsCodeItemData[index];
        if (hscodeItem.hsCode.startsWith(hscodeValue)) {
          matchItemList.push(hscodeItem);
        }
      }
    }
    return matchItemList.map(matchItem => {
      const descCombine: string[] = [];
      descCombine.unshift(matchItem.desc);
      let currentItem = { ...matchItem };
      while (currentItem.parent) {
        currentItem = { ...currentItem.parent };
        descCombine.unshift(currentItem.desc);
      }
      const outPutItem: HScodeItem = {
        desc: descCombine.join(' '),
        hsCode: matchItem.hsCode,
      };
      return outPutItem;
    });
  }

  hscodeMemoMap: Map<string, HScodeItem> = new Map();

  async doGetHscodeItem(hscode: string): Promise<HScodeItem | null> {
    if (!hscode) {
      return null;
    }
    const memoItem = this.hscodeMemoMap.get(hscode);
    if (memoItem) {
      return memoItem;
    }
    const _hsCodeItemData = await this.doGetHscodeDataList();
    const match: (list: HScodeItem[], code: string, parentDesc: string[]) => HScodeItem | null = (list, code, parentDesc) => {
      for (let index = 0; index < list.length; index++) {
        const item = list[index];
        let matchItem: HScodeItem | null = null;
        if (item.hsCode === code) {
          matchItem = item;
        } else if (item.child) {
          matchItem = match(item.child, code, [...parentDesc, item.desc]);
        }
        if (matchItem) {
          return {
            ...matchItem,
            desc: [...parentDesc, matchItem.desc].filter(d => !!d).join(' '),
          };
        }
      }
      return null;
    };
    const result = match(_hsCodeItemData, hscode, []);
    if (result) {
      this.hscodeMemoMap.set(hscode, result);
    }
    return result;
  }

  doGetEnableRecordPage(): Promise<boolean> {
    return this.get(this.systemApi.getUrl('getEnableRecordPage'), {}, undefined, true);
  }

  doGetIdsByCompanyList(param: GetIDByListReq): Promise<CompanyIdType[]> {
    return this.post(this.systemApi.getUrl('getIdsByCompanyList'), param);
  }

  getChineseCompanyIdsByCompanyList(param: GetIDByListReq): Promise<CompanyIdType[]> {
    return this.post(this.systemApi.getUrl('getChineseCompanyIdsByCompanyList'), param);
  }

  doGetCustomsDetailInfoById(id: string): Promise<CustomsRecord> {
    return this.post(
      this.systemApi.getUrl('getCustomsDetailInfo'),
      {
        id,
      },
      {
        contentType: 'form',
      }
    );
  }

  doGetCustomsPortList(): Promise<TCustomsPort[]> {
    return this.get(this.systemApi.getUrl('getCustomsPortList'), {}, undefined, true);
  }

  doGetCustomsHotPortList(): Promise<IHotPortCollection[]> {
    return this.get(this.systemApi.getUrl('getCustomsHotPortList'), {}, undefined, true);
  }

  doGetCustomsStat(): Promise<number> {
    return this.get(this.systemApi.getUrl('getCustomsStat'), {});
  }

  getCompanyRelationStatus(req: {
    companyName?: string;
    country?: string;
    companyNameId?: string;
    countryId?: string;
  }): Promise<{ companyId: string; status: string; leadsId: string }> {
    return this.get(this.systemApi.getUrl('getCompanyRelationStatus'), req, { noEnqueue: true, useCacheReturn: false });
  }
  getCustomerInputLimit(): Promise<{ limitReached: boolean }> {
    return this.get(this.systemApi.getUrl('getCustomerInputLimit'), {});
  }
  addCompanySub(param: ReqAddCompanySub): Promise<string | number> {
    return this.post(
      this.systemApi.getUrl('addCustomsCollect'),
      {
        ...param,
      },
      {
        contentType: 'form',
      }
    );
  }

  deleteCompanySub(id: string | number): Promise<boolean> {
    return this.post(
      this.systemApi.getUrl('deleteCustomsCollect'),
      {
        id,
      },
      {
        contentType: 'form',
      }
    );
  }

  private suggestValid: (req: ReqSuggest, type: 'customs' | 'global_search') => boolean = (req, type) => {
    const { text } = req;
    if (req.type === 4 && type === 'customs') {
      return true;
    }
    const charSplits = text.split('');
    const spaceSplits = text.split(' ');
    return charSplits.length > 2 && spaceSplits.length < 6;
  };

  async doGetSuggest(params: ReqSuggest, type: 'customs' | 'global_search'): Promise<ResSuggest[]> {
    if (!this.suggestValid(params, type)) {
      return [];
    }
    const apiUrl = type === 'customs' ? this.systemApi.getUrl('customsGetSuggest') : this.systemApi.getUrl('globalSearchGetSugget');
    const resData: ResSuggest[] = await this.post(
      apiUrl,
      {
        ...params,
        size: params.size || 10,
      },
      {
        contentType: 'form',
      }
    );
    return resData;
  }

  doGetCompanyExists(params: { companyName: string; country: string }): Promise<CompanyExists> {
    return this.get(this.systemApi.getUrl('doGetCompanyExists'), {
      ...params,
    });
  }

  doGetCompanyExistsDemo(params: { companyList: Array<{ companyName: string; country: string; originCompanyName?: string }> }): Promise<CompanyExists> {
    // console.log(params, '22222ss')
    return this.post(this.systemApi.getUrl('doGetCompanyExistsDemo'), params);
  }
  doAddCustomsDeepTask(params: { queryType: 'suppliers' | 'buyers'; condition: reqBuyers }): Promise<customsDeepTask> {
    return this.post(this.systemApi.getUrl('doAddCustomsDeepTask'), params);
  }
  doGetCustomsDeepTask(params: { queryType: 'suppliers' | 'buyers'; condition: reqBuyers }): Promise<customsDeepTask> {
    return this.post(this.systemApi.getUrl('doGetCustomsDeepTask'), params);
  }
  doGetGlobalTaskInfo(params: { taskId: number | string }): Promise<{ id: string; code: string; context: string }> {
    return this.get(this.systemApi.getUrl('doGetGlobalTaskInfo'), {
      ...params,
    });
  }
  doGetForwarderAsyncList(rea: { asyncId: string }, type: customsCompanyType): Promise<ResForwarder> {
    return this.post(this.systemApi.getUrl(type === 'buyer' ? 'forwarderBuyersAsyncList' : 'forwarderSuppliersAsyncList'), rea, {
      contentType: 'form',
    });
  }
  doGetForwarderList(req: ReqForwarder, type: customsCompanyType): Promise<ResForwarder> {
    // 做一层数据转换
    const optionType2SType = (item: OptionValueType) => {
      const res: AirlineItem = {
        name: item.value,
        nameCn: item.label,
      };
      return res;
    };
    const { airlines, portOfLadings, portOfUnLadings, ...rest } = req;
    return this.post(this.systemApi.getUrl(type === 'buyer' ? 'forwarderBuyersList' : 'forwarderSuppliersList'), {
      ...rest,
      airlines: airlines?.map(optionType2SType),
      portOfLadings: portOfLadings?.map(optionType2SType),
      portOfUnLadings: portOfUnLadings?.map(optionType2SType),
      // 特殊的type
      type: 'goodsShipped_hsCode',
    });
  }

  getSearchPeersList(req: ReqForwarder): Promise<ResForwarder> {
    // 做一层数据转换
    const optionType2SType = (item: OptionValueType) => {
      const res: AirlineItem = {
        name: item.value,
        nameCn: item.label,
      };
      return res;
    };
    const { airlines, portOfLadings, portOfUnLadings, ...rest } = req;
    return this.post(this.systemApi.getUrl('searchPeersList'), {
      ...rest,
      airlines: airlines?.map(optionType2SType),
      portOfLadings: portOfLadings?.map(optionType2SType),
      portOfUnLadings: portOfUnLadings?.map(optionType2SType),
      // 特殊的type
      type: 'transport_company_port',
    });
  }

  getRecordListForward(req: ReqForwarder, type: customsCompanyType): Promise<ResCustomsRecord> {
    // 做一层数据转换
    const optionType2SType = (item: OptionValueType) => {
      const res: AirlineItem = {
        name: item.value,
        nameCn: item.label,
      };
      return res;
    };
    const { airlines, portOfLadings, portOfUnLadings, ...rest } = req;
    return this.post(this.systemApi.getUrl('getRecordListForward'), {
      ...rest,
      airlines: airlines?.map(optionType2SType),
      portOfLadings: portOfLadings?.map(optionType2SType),
      portOfUnLadings: portOfUnLadings?.map(optionType2SType),
      // 特殊的type
      type: 'goodsShipped_hsCode',
      recordType: type === 'buyer' ? 'import' : 'export',
    });
  }

  doGetAirlineList(): Promise<AirlineItem[]> {
    return this.post(this.systemApi.getUrl('forwarderAirlineList'), {});
  }
  doGetExcavateCompanyDetail(id: string): Promise<ExcavateCompanyDetail> {
    return this.post(this.systemApi.getUrl('forwarderExcavateCompanyDetail'), {
      chineseCompanyId: id,
    });
  }
  fissionRuleSave(req: FissionRuleSaveReq): Promise<ExcavateCompanyDetail> {
    return this.post(this.systemApi.getUrl('fissionRuleSave'), {
      ...req,
    });
  }
  importCompanyFission(req: ImportRuleSaveReq): Promise<ExcavateCompanyDetail> {
    return this.post(this.systemApi.getUrl('importCompanyFission'), {
      ...req,
    });
  }
  doGetExcavateCompanyList(req: ExcavateCompanyReq): Promise<ExcavateCompanyItem[]> {
    return this.post(this.systemApi.getUrl('forwarderExcavateCompanyList'), {
      ...req,
    });
  }
  doGetUserQuota(): Promise<UserQuotaItem> {
    return this.post(this.systemApi.getUrl('searchUserQuota'), {});
  }
  doGetUserLog(req: UserLogReq): Promise<{
    data: UserLogItem[];
    page: number;
    size: number;
    total: number;
  }> {
    return this.post(this.systemApi.getUrl('searchUserLog'), {
      ...req,
    });
  }
  doGetchineseBatchAddLeads(req: { ids: string[]; leadsGroupIdList?: Array<number> }): Promise<string> {
    return this.post(this.systemApi.getUrl('chineseBatchAddLeads'), {
      ...req,
    });
  }
  getIfranmeUrl(req: { type: number }): Promise<{ linkUrl: string }> {
    return this.post(this.systemApi.getUrl('externalLinkQuery'), {
      ...req,
    });
  }
  doGetDetailUseLog(id: number): Promise<ExcavateCompanyDetail> {
    return this.post(this.systemApi.getUrl('detailUseLog'), {
      logId: id,
    });
  }
  doGetForwarderPortSuggest(req: ForwarderPortSuggestReq): Promise<ResSuggest[]> {
    return this.post(
      this.systemApi.getUrl('forwarderPortSuggest'),
      {
        ...req,
      },
      {
        contentType: 'form',
      }
    );
  }
  doGetForwarderSearchTop(req: ForwarderTopSearchReq): Promise<ForwarderSearchTop[]> {
    return this.get(this.systemApi.getUrl('forwarderSearchTop'), {
      ...req,
    });
  }

  doGetCommonlyUsePorts(type: CommonlyUsePortType): Promise<CommonlyUsePort[]> {
    return this.post(
      this.systemApi.getUrl('forwarderGetCommonlyUsePorts'),
      {
        type,
      },
      {
        contentType: 'form',
      }
    );
  }

  doGetHotPortsV2(type: 0 | 1): Promise<TCustomsPort[]> {
    return this.post(
      this.systemApi.getUrl('forwarderGetHotPorts'),
      {
        type,
      },
      {
        contentType: 'form',
      }
    );
  }

  purchaseTrend(req: TradeReq): Promise<PurchaseResult[]> {
    return this.post(this.systemApi.getUrl('purchaseTrend'), {
      ...req,
    });
  }

  importRegionalDistribution(req: TradeReq): Promise<DistributionResult> {
    return this.post(this.systemApi.getUrl('importRegionalDistribution'), {
      ...req,
    });
  }

  importCompanyDistribution(req: TradeReq): Promise<DistributionResult> {
    return this.post(this.systemApi.getUrl('importCompanyDistribution'), {
      ...req,
    });
  }

  exportCompanyDistribution(req: TradeReq): Promise<DistributionResult> {
    return this.post(this.systemApi.getUrl('exportCompanyDistribution'), {
      ...req,
    });
  }

  companyPurchaseTrend(req: TradeCompanyReq): Promise<CompanyTrend> {
    return this.post(this.systemApi.getUrl('companyPurchaseTrend'), {
      ...req,
    });
  }

  companyHscodeRanking(req: TradeCompanyReq): Promise<PurchaseResult[]> {
    return this.post(this.systemApi.getUrl('companyHscodeRanking'), {
      ...req,
    });
  }

  companyGoodsDistribution(req: TradeCompanyReq): Promise<PurchaseResult[]> {
    return this.post(this.systemApi.getUrl('companyGoodsDistribution'), {
      ...req,
    });
  }

  companyGoodsTypeProportion(req: TradeCompanyReq): Promise<TradeForwarder> {
    return this.post(this.systemApi.getUrl('companyGoodsTypeProportion'), {
      ...req,
    });
  }

  companyProductKeywords(req: TradeCompanyReq): Promise<PurchaseResult[]> {
    return this.post(this.systemApi.getUrl('companyProductKeywords'), {
      ...req,
    });
  }

  companyRouteDistribution(req: TradeCompanyReq): Promise<TradeRouteResult> {
    return this.post(this.systemApi.getUrl('companyRouteDistribution'), {
      ...req,
    });
  }

  companyTransportTypeProportion(req: TradeCompanyReq): Promise<PurchaseResult[]> {
    return this.post(this.systemApi.getUrl('companyTransportTypeProportion'), {
      ...req,
    });
  }

  companyShippingTypeProportion(req: TradeCompanyReq): Promise<PurchaseResult[]> {
    return this.post(this.systemApi.getUrl('companyShippingTypeProportion'), {
      ...req,
    });
  }

  companyRelatedCompany(req: TradeCompanyReq): Promise<DistributionFormData[]> {
    return this.post(this.systemApi.getUrl('companyRelatedCompany'), {
      ...req,
    });
  }

  getAllTradeCompany(req: TradeCopmayAllReq): Promise<TradeCompanyData> {
    return Promise.all([
      this.companyPurchaseTrend(req.gloBuyTrend),
      this.companyHscodeRanking(req.hsCodeRank),
      this.companyGoodsDistribution(req.goodsDistribution),
      this.companyGoodsTypeProportion(req.goodsCategory),
      this.companyProductKeywords(req.productKey),
      // this.companyRouteDistribution(req.routeDistribution),
      // this.companyTransportTypeProportion(req.transportPrecent),
      // this.companyShippingTypeProportion(req.shipPrecent),
      this.companyRelatedCompany(req.supplierTop),
    ]);
  }

  getAllTrade(req: TradeALlReq): Promise<[PurchaseResult[], DistributionResult, PurchaseResult[], DistributionResult, DistributionResult]> {
    return Promise.all([
      this.purchaseTrend(req.gloBuyTrend),
      this.importRegionalDistribution(req.buyArea),
      this.purchaseTrend(req.targetMarket),
      this.importCompanyDistribution(req.mainMarket),
      this.exportCompanyDistribution(req.targetArea),
    ]);
  }

  companyComplete(req: { companyName: string }): Promise<
    Array<{
      companyName: string;
      country: string;
      countryCn: string;
      type: 'import' | 'export';
    }>
  > {
    return this.post(this.systemApi.getUrl('companyComplete'), {
      ...req,
    });
  }

  hotProductRanking(): Promise<HotProductRank[]> {
    return this.post(this.systemApi.getUrl('hotProductRanking'), {});
  }

  logSave(req: LogSave): Promise<boolean> {
    return this.post(this.systemApi.getUrl('logSave'), {
      ...req,
    });
  }

  getQuotaQuery(): Promise<HasQuantity> {
    return this.post(this.systemApi.getUrl('getQuotaQuery'), {});
  }
  getTradeLogList(): Promise<HistoryItem[]> {
    return this.post(this.systemApi.getUrl('getTradeLogList'), {});
  }
  getSearchJudge(req: SearchJudge): Promise<SearchJudgeResult> {
    return this.post(this.systemApi.getUrl('getSearchJudge'), {
      ...req,
    });
  }
  guessAndSave(req: GuessAndSaveParam): Promise<string[]> {
    return this.post(this.systemApi.getUrl('guessAndSave'), {
      ...req,
    });
  }
  getRcmdSuggestion(req: { keyword: string }): Promise<Array<{ keyword: string; desc: string }>> {
    return this.post(this.systemApi.getUrl('getRcmdSuggestion'), {
      ...req,
    });
  }

  getBuyersListAsync(rea: { asyncId: string }): Promise<ResForwarder> {
    return this.post(this.systemApi.getUrl('getBuyersListAsync'), rea, {
      contentType: 'form',
    });
  }

  getPeersCompanyBase(req: FreightReq): Promise<resBuysersBase> {
    return this.post(this.systemApi.getUrl('getPeersCompanyBase'), {
      ...req,
    });
  }

  listAreaStatisticsRecord(req: reqCustomsBaseParam): Promise<resCustomsFreight> {
    return this.post(this.systemApi.getUrl('listAreaStatisticsRecord'), req);
  }
  getFreightRelationCompany(req: FreightRelationReq): Promise<FreightRelationRes> {
    return this.post(this.systemApi.getUrl('getFreightRelationCompany'), req);
  }
  getTransportCompany(req: FreightRelationReq): Promise<FreightRelationRes> {
    return this.post(this.systemApi.getUrl('getTransportCompany'), req);
  }
  getFreightRelationCountry(req: FreightRelationReq): Promise<
    {
      companyCount: number;
      country: string;
    }[]
  > {
    return this.post(this.systemApi.getUrl('getFreightRelationCountry'), req);
  }
  getAreaStatistics(req: FreightAreaReq): Promise<FreightAreaRes> {
    return this.post(this.systemApi.getUrl('getAreaStatistics'), req);
  }

  transportTrend(req: TransportTradeReq): Promise<Array<TradeportValue>> {
    return this.post(this.systemApi.getUrl('transportTrend'), req);
  }

  transportProportion(req: TransportTradeReq): Promise<TradeportProRes> {
    return this.post(this.systemApi.getUrl('transportProportion'), req);
  }

  transportRouteDistribution(req: TransportTradeReq): Promise<DistributionFormData[]> {
    return this.post(this.systemApi.getUrl('transportRouteDistribution'), req);
  }

  transportProductKeywords(req: TransportTradeReq): Promise<Array<TradeportValue>> {
    return this.post(this.systemApi.getUrl('transportProductKeywords'), req);
  }

  transportPageCustomer(req: TransportTradeReq): Promise<{
    records: DistributionFormData[];
    total: number;
  }> {
    return this.post(this.systemApi.getUrl('transportPageCustomer'), req);
  }

  transportVolumeDistribution(req: TransportTradeReq): Promise<Array<TradeportValue>> {
    return this.post(this.systemApi.getUrl('transportVolumeDistribution'), req);
  }
}

const edmCustomsApiImpl = new EdmCustomsApiImpl();
api.registerLogicalApi(edmCustomsApiImpl);
export default edmCustomsApiImpl;
