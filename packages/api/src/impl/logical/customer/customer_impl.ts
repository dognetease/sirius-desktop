// import qs from 'querystring';
import { ReqAdminAccount, ResAdminAccount } from '@/api/logical/edm_role';
import { api } from '../../../api/api';
import { ApiRequestConfig } from '../../../api/data/http';
import {
  BaseInfoRes,
  businessStagesReq,
  changeTOCustomerReq,
  clueBatchUpdateReq,
  clueCheckExportRes,
  clueContactListReq,
  clueContactListRes,
  ClueDetail,
  ClueDetailParams,
  clueRecordRes,
  companyAddLabelsReq,
  companyCheckExportReq,
  CompanyCompareReq,
  CompanyCompareRes,
  CompanyMergeReq,
  companySimpleListReq,
  companySimpleListRes,
  ContactAddReq,
  ContactDetailReq,
  ContactDetailRes,
  ContactEmails,
  ContactEmailsCondition,
  ContactEmailsParams,
  contactListByIdReq,
  CustomerApi,
  CustomerContactModel,
  CustomerDeleteLabelsParams,
  CustomerDetail,
  SuggestionGlobalAi,
  CustomerDetailParams,
  SuggestionGlobalAiParams,
  CustomerEmailTag,
  CustomerInfoShort,
  CustomerOperateDetailParams,
  CustomerOperateDetailRes,
  CustomerOperateHistoryParams,
  CustomerOperateHistoryRes,
  customerResult,
  CustomerScheduleDeleteParams,
  CustomerScheduleEditParams,
  CustomerScheduleListParams,
  CustomerScheduleListRes,
  DeleteOpportunityContactParams,
  DMObjectField,
  editClueStatusReq,
  EdmMailRule,
  EmailsContacts,
  EmailsContactsParams,
  EmailSuffixList,
  FollowsType,
  ForwardCustomerParams,
  IExtensionCaptureEmailDeleteRes,
  IExtensionCaptureEmailListItem,
  IExtensionCaptureEmailListReq,
  IExtensionImportClue,
  IExtensionWhiteListDeleteReq,
  IExtensionWhiteListRes,
  IFollowModel,
  IOpenSeaSetting,
  ISearchCustomerFromClueReq,
  ISearchCustomerFromClueRes,
  ISearchCustomerFromPersonalClueReq,
  ISearchCustomerFromPersonalClueRes,
  ISearchCustomerReq,
  ISearchCustomerRes,
  JudgeRepeatItem,
  JudgeRepeatSearchReq,
  LabelModel,
  newClueReq,
  newMyClueListReq,
  newMyClueListRes,
  newOpportunityReq,
  openSeaDetail,
  openSeaListRes,
  openSeaReq,
  openSeaRules,
  opportunityCheckExportReq,
  OpportunityCloseRecordParams,
  OpportunityCloseRecordRes,
  opportunityContactListItem,
  OpportunityDetail,
  OpportunityDetailParams,
  opportunityListReq,
  opportunityListRes,
  opportunityStageReq,
  OpportunityStages,
  OpportunityStagesParams,
  PageLabelModel,
  ReqAddManager,
  ReqCheckEmailValid,
  ReqContactListById,
  ReqDMImport,
  ReqDMValidField,
  ReqDocumentList,
  ReqFinishNosUpload,
  ReqFollowList,
  ReqMainContactList,
  ReqNosToken,
  ReqOpenSeaAllocate,
  ReqOpenSeaFollowList,
  reqRepeatList,
  ReqReturnOpenSea,
  reqSingleJudgeRepeat,
  ReqTransferManager,
  RequestAddEdmBlacklist,
  RequestBatchAddCompany,
  RequestBusinessaAddCompany,
  RequestCheckClientName,
  RequestClientEmailsList,
  RequestClientRecommend,
  RequestCompanyList,
  RequestCompanyMyList,
  RequestContactList,
  RequestDeleteCompany,
  RequestEdmBlacklist,
  RequestLabel,
  RequestRemoveEdmBlacklist,
  RequestRemoveEdmNSBlacklist,
  RequestSaveRecommendData,
  resCompanyRules,
  ResContactListById,
  ResDMImport,
  ResDocumentList,
  ResFinishNosUpload,
  ResMainContactList,
  ResManagerItem,
  ResNosToken,
  ResParseTables,
  ResponseContactNums,
  ResponseEdmBlacklist,
  ResponseEdmNSBlacklist,
  ResponseFollowList,
  ResponseLoadContactPerson,
  resRepeatList,
  resSingleJudgeRepeat,
  RessnapshotPreview,
  ResUploadCientFile,
  RresponseBatchAddCompany,
  RresponseBusinessaAddCompany,
  RresponseCheckClientName,
  RresponseClientEmailsList,
  RresponseCompanyList,
  RresponseCompanyMyList,
  RresponseInitAllow,
  seaAllocateReq,
  UpdateOpportunityStageParams,
  uniEdmListReq,
  uniEdmListReqRes,
  uniIdRes,
  uniEdmListFromContactReq,
  uniEdmListFromContactReqRes,
  PersonalWhatsappHistoryRes,
  SuggestionGlobalAiQueryParams,
  SuggestionGlobalAiGenerateParams,
  SuggestionGlobalAiGenerate,
} from '../../../api/logical/customer';
// import { ContactAndOrgApi } from '@/api/logical/contactAndOrg';
// import { apis } from '@/config';

const eventApi = api.getEventApi();

class CustomerImpl implements CustomerApi {
  name = 'customerApiImpl';

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  // private contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;

  init() {
    return this.name;
  }

  async get(url: string, req?: any, config?: ApiRequestConfig) {
    try {
      const { data } = await this.http.get(url, req, config);
      if (!data || !data.success) {
        return Promise.reject(data?.message);
      }
      return data?.data;
    } catch (err: any) {
      setTimeout(() => {
        const message = err.data?.message || err.data?.msg || '网络错误';
        eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: message,
            popupType: 'toast',
            popupLevel: 'error',
            content: '',
          },
          auto: true,
        });
      });
      return Promise.reject(err.data);
    }
  }
  // withCode需要返回code
  async post(url: string, body: any, config?: ApiRequestConfig, withCode?: boolean) {
    config = {
      contentType: 'json',
      noEnqueue: false,
      ...(config || {}),
    };
    try {
      const { data } = await this.http.post(url, body, config);
      if (!data || !data.success) {
        const err = {
          data: {
            message: data?.message,
          },
        };
        throw err;
        // return Promise.reject(data?.message);
      }
      try {
        if (withCode) {
          if (typeof data?.data === 'object' && !Array.isArray(data?.data) && !data.data.dataCode) {
            data.data.dataCode = data.code;
          } else if (!data?.data) {
            data.data = { dataCode: data.code };
          }
        }
      } catch (error) {
        console.log('data.data.dataCode is err:', error);
      }
      return data?.data;
    } catch (err: any) {
      eventApi.sendSysEvent({
        eventSeq: 0,
        eventName: 'error',
        eventLevel: 'error',
        eventData: {
          title: err.data?.message || err.data?.msg || '网络错误',
          popupType: 'toast',
          popupLevel: 'error',
          content: '',
        },
        auto: true,
      });
      return Promise.reject(err.data);
    }
  }

  uniEdmList(req: uniEdmListReq): Promise<uniEdmListReqRes> {
    return this.post(this.systemApi.getUrl('uniEdmList'), req);
  }

  uniEdmListFromContact(req: uniEdmListFromContactReq): Promise<uniEdmListFromContactReqRes> {
    return this.post(this.systemApi.getUrl('uniEdmListFromContact'), req);
  }

  uniIdToCompanyId(req: string[]): Promise<uniIdRes[]> {
    return this.post(this.systemApi.getUrl('uniIdToCompanyId'), req);
  }

  getLabelList(req: RequestLabel) {
    return this.get(this.systemApi.getUrl('getLabelList'), req);
  }

  getLabelListByPage(req: RequestLabel): Promise<PageLabelModel> {
    return this.post(this.systemApi.getUrl('getLabelListByPage'), req);
  }

  addLabel(req: Partial<LabelModel>): Promise<LabelModel> {
    return this.post(this.systemApi.getUrl('addLabel'), req, {
      contentType: 'form',
    });
  }

  delLabel(req: string[]): Promise<boolean> {
    return this.post(
      this.systemApi.getUrl('deleteLabel'),
      {
        label_id_list: req,
      },
      {
        contentType: 'form',
      }
    );
  }

  editLabel(req: Partial<LabelModel>): Promise<LabelModel> {
    return this.post(this.systemApi.getUrl('editLabel'), req, {
      contentType: 'form',
    });
  }

  getCustomerByLabel(labelId: string): Promise<Array<{ company_id: string; company_name: string }>> {
    return this.get(this.systemApi.getUrl('getCompanyByLabel'), { label_id: labelId });
  }

  getContactByLabel(labelId: string): Promise<Array<{ contact_id: string; contact_name: string; email: string }>> {
    return this.get(this.systemApi.getUrl('getContactByLabel'), { label_id: labelId });
  }

  search(req: ISearchCustomerReq): Promise<ISearchCustomerRes> {
    return this.get(this.systemApi.getUrl('searchCustomer'), req);
  }

  searchCustomerFromPersonalClue(req: ISearchCustomerFromPersonalClueReq): Promise<ISearchCustomerFromPersonalClueRes> {
    return this.post(this.systemApi.getUrl('searchCustomerFromPersonalClue'), req);
  }

  searchCustomerFromClue(req: ISearchCustomerFromClueReq): Promise<ISearchCustomerFromClueRes> {
    return this.post(this.systemApi.getUrl('searchCustomerFromClue'), req);
  }

  searchCustomerFromOpenSea(req: ISearchCustomerFromClueReq): Promise<ISearchCustomerFromClueRes> {
    return this.post(this.systemApi.getUrl('searchCustomerFromOpenSea'), req);
  }

  getCustomerDetail(req: CustomerDetailParams, config?: ApiRequestConfig): Promise<CustomerDetail> {
    return this.get(this.systemApi.getUrl('getCustomerDetail'), req, config);
  }

  getSuggestionGlobalAi(req: SuggestionGlobalAiParams, config?: ApiRequestConfig): Promise<SuggestionGlobalAi> {
    return this.get(this.systemApi.getUrl('getSuggestionGlobalAi'), req, config)
      .then(res => res)
      .catch(() => ({ aiFail: req.from === 'ai' }));
  }
  getSuggestionGlobalAiGenerate(req: SuggestionGlobalAiGenerateParams): Promise<SuggestionGlobalAiGenerate> {
    return this.post(this.systemApi.getUrl('getSuggestionGlobalAiGenerate'), req)
      .then(res => res)
      .catch(() => ({ aiFail: true }));
  }
  async getSuggestionGlobalAiQuery(req: SuggestionGlobalAiQueryParams): Promise<SuggestionGlobalAi> {
    return this.post(this.systemApi.getUrl('getSuggestionGlobalAiQuery'), req, undefined, true)
      .then(res => ({ ...res, code: res?.dataCode }))
      .catch(() => ({ aiFail: true }));
  }

  getSuggestionAICount(_req?: SuggestionGlobalAiParams, config?: ApiRequestConfig): Promise<{ countLeft: number }> {
    return this.get(this.systemApi.getUrl('getSuggestionAICount'), null, config);
  }

  getCustomerScheduleList(req: CustomerScheduleListParams): Promise<CustomerScheduleListRes> {
    const { clue_id, company_id, opportunity_id } = req;
    let apiUrl = '';
    if (clue_id) {
      apiUrl = 'getClueScheduleList';
    }
    if (opportunity_id) {
      apiUrl = 'getBusinessScheduleList';
    }
    if (company_id) {
      apiUrl = 'getCompanyScheduleList';
    }
    return this.get(this.systemApi.getUrl(apiUrl as any), req);
  }

  createCustomerSchedule(req: CustomerScheduleEditParams): Promise<number> {
    const { clue_id, company_id, opportunity_id } = req;
    let apiUrl = '';
    if (clue_id) {
      apiUrl = 'createClueSchedule';
    }
    if (opportunity_id) {
      apiUrl = 'createBusinessSchedule';
    }
    if (company_id) {
      // 新建日程使用了新的接口，请求方式从post改变成了get
      apiUrl = 'createCompanySchedule';
      return this.get(this.systemApi.getUrl(apiUrl as any), req);
    }
    return this.post(this.systemApi.getUrl(apiUrl as any), req, { contentType: 'form' });
  }

  updateCustomerSchedule(req: CustomerScheduleEditParams): Promise<number> {
    const { clue_id, company_id, opportunity_id } = req;
    let apiUrl = '';
    if (clue_id) {
      apiUrl = 'updateClueSchedule';
    }
    if (opportunity_id) {
      apiUrl = 'updateBusinessSchedule';
    }
    if (company_id) {
      apiUrl = 'updateCompanySchedule';
    }
    return this.post(this.systemApi.getUrl(apiUrl as any), req, { contentType: 'form' });
  }

  deleteCustomerSchedule(req: CustomerScheduleDeleteParams): Promise<number> {
    const { condition, schedule_id } = req;

    enum mapApiUrl {
      company = 'deleteCompanySchedule',
      clue = 'deleteClueSchedule',
      opportunity = 'deleteBusinessSchedule',
    }

    const apiUrl = mapApiUrl[condition];
    return this.post(this.systemApi.getUrl(apiUrl as any), { schedule_id }, { contentType: 'form' });
  }

  getCustomerOperateHistory(req: CustomerOperateHistoryParams): Promise<CustomerOperateHistoryRes> {
    const { condition } = req;

    enum mapApiUrl {
      company = 'getCompanyOperateHistory',
      clue = 'getClueOperateHistory',
      opportunity = 'getBusinessOperateHistory',
      open_sea = 'getSeaOperateHistory',
      customer_open_sea = 'getCompanyOpenSeaOperateHistory',
    }

    const url = mapApiUrl[condition];
    return this.post(this.systemApi.getUrl(url), req);
  }

  openSeaOperateHistory(req: CustomerOperateHistoryParams): Promise<CustomerOperateHistoryRes> {
    return this.post(this.systemApi.getUrl('openSeaOperateHistory'), req);
  }

  getCustomerOperateDetail(req: CustomerOperateDetailParams): Promise<CustomerOperateDetailRes> {
    const { condition } = req;

    enum mapApiUrl {
      company = 'getCompanyOperateDetail',
      clue = 'getClueOperateDetail',
      opportunity = 'getBusinessDetail',
      open_sea = 'getSeaOperateDetail',
      customer_open_sea = 'getCompanyOpenSeaOperateDetail',
    }

    const url = mapApiUrl[condition];
    return this.post(this.systemApi.getUrl(url), req);
  }

  openSeaOperateDetail(req: CustomerOperateDetailParams): Promise<CustomerOperateDetailRes> {
    return this.post(this.systemApi.getUrl('openSeaOperateDetail'), req);
  }

  updateOpportunityStage(req: UpdateOpportunityStageParams): Promise<OpportunityDetail> {
    return this.post(this.systemApi.getUrl('updateOpportunityStage'), req);
  }

  deleteOpportunityContact(req: DeleteOpportunityContactParams): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteOpportunityContact'), req);
  }

  deleteCustomerContact(req: DeleteOpportunityContactParams): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteCustomerContact'), req);
  }

  deleteClueContact(req: DeleteOpportunityContactParams): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteClueContact'), req);
  }

  deleteCustomerLabels(req: CustomerDeleteLabelsParams): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteCustomerLabels'), req);
  }

  forwardCustomer(req: ForwardCustomerParams): Promise<boolean> {
    return this.post(this.systemApi.getUrl('forwardCustomer'), req);
  }

  transferCustomerManager(req: ReqTransferManager): Promise<boolean> {
    return this.post(this.systemApi.getUrl('transferCustomerManager'), req);
  }

  transferClueManager(req: ReqTransferManager): Promise<boolean> {
    return this.post(this.systemApi.getUrl('transferClueManager'), req);
  }

  addCustomerManager(req: ReqAddManager): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addCustomerManager'), req);
  }

  getClueDetail(req: ClueDetailParams): Promise<ClueDetail> {
    return this.get(this.systemApi.getUrl('getClueDetail'), req);
  }

  getOpportunityDetail(req: OpportunityDetailParams): Promise<OpportunityDetail> {
    return this.get(this.systemApi.getUrl('getOpportunityDetail'), req);
  }

  getOpportunityCloseRecord(req: OpportunityCloseRecordParams): Promise<OpportunityCloseRecordRes> {
    return this.get(this.systemApi.getUrl('getOpportunityCloseRecord'), req);
  }

  getOpportunityStages(req: OpportunityStagesParams): Promise<OpportunityStages> {
    return this.get(this.systemApi.getUrl('getOpportunityStages'), req);
  }

  getContactEmails(req: ContactEmailsParams): Promise<ContactEmails> {
    const { condition } = req;

    enum mapApiUrl {
      company = 'getCompanyContactEmails',
      clue = 'getClueContactEmails',
      opportunity = 'getBusinessContactEmails',
      open_sea = 'getOpenSeaContactEmails',
    }

    const url = mapApiUrl[condition];
    return this.post(this.systemApi.getUrl(url), req);
  }

  openSeaContactEmails(req: ContactEmailsParams): Promise<ContactEmails> {
    return this.post(this.systemApi.getUrl('openSeaContactEmails'), req);
  }

  getEmailsContacts(req: EmailsContactsParams): Promise<EmailsContacts> {
    const { condition } = req;

    enum mapApiUrl {
      company = 'getCompanyEmailsContacts',
      clue = 'getClueEmailsContacts',
      opportunity = 'getBusinessEmailsContacts',
      open_sea = 'getOpenSeaEmailsContacts',
      customer_open_sea = 'customerOpenSeaEmailsContacts',
    }

    const url = mapApiUrl[condition];
    return this.post(this.systemApi.getUrl(url), req);
  }

  openSeaEmailsContacts(req: EmailsContactsParams): Promise<EmailsContacts> {
    return this.post(this.systemApi.getUrl('openSeaEmailsContacts'), req);
  }

  /**
   * 客户联系人模块
   */
  async addNewClient(req?: RequestBusinessaAddCompany): Promise<RresponseBusinessaAddCompany> {
    const data = await this.post(this.systemApi.getUrl('addNewClient'), req);
    // await this.contactApi.doInsertCustomer({ customerData: data });
    return data;
  }

  async editCompany(req: RequestBusinessaAddCompany): Promise<RresponseBusinessaAddCompany> {
    const data = await this.post(this.systemApi.getUrl('editCompany'), req);
    // await this.contactApi.doInsertCustomer({ customerData: data });
    return data;
  }

  editPerfectCompany(req?: RequestBusinessaAddCompany): Promise<boolean> {
    return this.post(this.systemApi.getUrl('editPerfectCompany'), req);
  }

  recommendList(): Promise<RequestClientRecommend> {
    return this.get(this.systemApi.getUrl('recommendList'), null);
  }

  clueRecommendList(): Promise<RequestClientRecommend> {
    return this.get(this.systemApi.getUrl('clueRecommendList'), null);
  }

  companyList(req?: RequestCompanyList): Promise<RresponseCompanyList> {
    return this.post(this.systemApi.getUrl('companyList'), req);
  }

  companyMyList(req?: RequestCompanyMyList): Promise<RresponseCompanyMyList> {
    return this.post(this.systemApi.getUrl('companyMyList'), req);
  }

  companyAllList(req?: RequestCompanyMyList): Promise<RresponseCompanyMyList> {
    return this.post(this.systemApi.getUrl('companyAllList'), req);
  }

  companyForwardList(req?: RequestCompanyMyList): Promise<RresponseCompanyMyList> {
    return this.post(this.systemApi.getUrl('companyForwardList'), req);
  }

  companySimpleList(req?: companySimpleListReq): Promise<companySimpleListRes> {
    return this.post(this.systemApi.getUrl('companySimpleList'), req);
  }

  contactList(req?: RequestContactList): Promise<Array<CustomerContactModel>> {
    return this.post(this.systemApi.getUrl('getCustomerContact'), req);
  }

  uploadClientFile(req: FormData): Promise<any> {
    return this.post(this.systemApi.getUrl('uploadClientFile'), req, {
      contentType: 'stream',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  uploadClueDate(req: FormData): Promise<ResUploadCientFile> {
    return this.post(this.systemApi.getUrl('uploadClueDate'), req, {
      contentType: 'stream',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  downLoadFailClient(): string {
    return this.systemApi.getUrl('downLoadFailClient');
  }

  downLoadFailClue(): string {
    return this.systemApi.getUrl('downLoadFailClue');
  }

  clueExport(): string {
    return this.systemApi.getUrl('clueExport');
  }

  batchAddCompany(req: RequestBatchAddCompany): Promise<RresponseBatchAddCompany> {
    return this.post(this.systemApi.getUrl('batchAddCompany'), req);
  }

  initAllow(): Promise<RresponseInitAllow> {
    return this.get(this.systemApi.getUrl('initAllow'));
  }

  clueInitAllow(): Promise<RresponseInitAllow> {
    return this.get(this.systemApi.getUrl('clueInitAllow'));
  }

  getClientEmails(req: RequestClientEmailsList, config?: ApiRequestConfig): Promise<RresponseClientEmailsList> {
    return this.post(this.systemApi.getUrl('getClientEmails'), req, config);
  }

  saveRecommendListInfo(req: RequestSaveRecommendData): Promise<boolean> {
    return this.post(this.systemApi.getUrl('saveRecommendListInfo'), req);
  }

  clueSaveRecommendListInfo(req: RequestSaveRecommendData): Promise<boolean> {
    return this.post(this.systemApi.getUrl('clueSaveRecommendListInfo'), req);
  }

  deleteCompany(req: RequestDeleteCompany): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteCompany'), req, {
      contentType: 'form',
    });
  }

  getContactNums(): Promise<ResponseContactNums> {
    return this.get(this.systemApi.getUrl('getContactNums'), null);
  }

  loadContactPerson(): Promise<ResponseLoadContactPerson> {
    return this.get(this.systemApi.getUrl('loadContactPerson'), null);
  }

  getCompanyDetail(companyId: string, conf: { updateContactDb: boolean; customerType: 'clue' | 'customer' }): Promise<CustomerDetail> {
    return this.get(this.systemApi.getUrl('getCompanyDetail'), { company_id: companyId }).then(res => {
      if (conf?.updateContactDb) {
        // setTimeout(() => {
        //   this.contactApi.doInsertCustomer({ customerData: res, customerType: conf?.customerType || 'customer' }).catch();
        // }, 1000);
      }
      return res;
    });
  }

  checkClientName(req: RequestCheckClientName): Promise<RresponseCheckClientName> {
    return this.post(this.systemApi.getUrl('checkClientName'), req);
  }

  checkEmailValid(req: ReqCheckEmailValid): Promise<boolean> {
    return this.post(this.systemApi.getUrl('checkEmailValid'), req);
  }

  companyCompare(req: CompanyCompareReq): Promise<CompanyCompareRes> {
    return this.post(this.systemApi.getUrl('companyCompare'), req);
  }

  getBaseInfo(): Promise<BaseInfoRes> {
    return this.get(this.systemApi.getUrl('getBaseInfo'));
  }

  getGlobalArea(): Promise<BaseInfoRes> {
    return this.get(this.systemApi.getUrl('getGlobalArea'));
  }

  getManagerList(): Promise<ResManagerItem[]> {
    return this.get(this.systemApi.getUrl('getManagerList'));
  }

  companyMerge(req: CompanyMergeReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('companyMerge'), req);
  }

  contactEdit(req: ContactAddReq): Promise<boolean> {
    const { condition } = req;

    enum mapApiUrl {
      company = 'editCompanyContact',
      clue = 'editClueContact',
      opportunity = 'editBusinessContact',
    }

    const editUrl = mapApiUrl[condition];
    return this.post(this.systemApi.getUrl(editUrl), req).then(res => {
      if (['clue', 'company'].includes(condition) && req.company_id && res) {
        this.getCompanyDetail(req.company_id, { updateContactDb: true, customerType: condition === 'company' ? 'customer' : 'clue' }).catch(e => {
          console.error('[contactAdd] get detail', e);
        });
      }
      return res;
    });
  }

  contactAdd(req: ContactAddReq): Promise<boolean> {
    const { condition } = req;

    enum mapApiUrl {
      company = 'addCompanyContact',
      clue = 'addClueContact',
      opportunity = 'addBusinessContact',
    }

    const addUrl = mapApiUrl[condition];
    return this.post(this.systemApi.getUrl(addUrl), req).then(res => {
      if (['clue', 'company'].includes(condition) && req.company_id && res) {
        this.getCompanyDetail(req.company_id, { updateContactDb: true, customerType: condition === 'company' ? 'customer' : 'clue' }).catch(e => {
          console.error('[contactAdd] get detail', e);
        });
      }
      return res;
    });
  }

  clientTemplate(): Promise<string> {
    return this.get(this.systemApi.getUrl('clientTemplate'));
  }

  clueTemplate(): Promise<string> {
    return this.get(this.systemApi.getUrl('clueTemplate'));
  }

  contactDetail(req: ContactDetailReq): Promise<ContactDetailRes> {
    const { condition } = req;

    enum mapApiUrl {
      company = 'companyContactDetail',
      clue = 'clueContactDetail',
    }

    const apiUrl = mapApiUrl[condition];
    return this.post(this.systemApi.getUrl(apiUrl), req);
  }

  mkdirIfAbsent(dirName: string, dirId: number): Promise<{ id: number; parentId: string; spaceId: string; path: string }> {
    return this.post(this.systemApi.getUrl('mkDirIfAbsent'), null, {
      params: { dirName, parentDirId: dirId },
      noEnqueue: true,
    });
  }

  addFollow(id: string, type: FollowsType, req: IFollowModel): Promise<boolean> {
    const map = {
      customer: 'company_id',
      clue: 'clue_id',
      business: 'opportunity_id',
      openSea: 'id',
      customerOpenSea: '',
    };
    const key = map[type];

    enum mapApiUrl {
      customer = 'addCompanyFollow',
      clue = 'addClueFollow',
      business = 'addBusinessFollow',
      openSea = 'addFollow',
      customerOpenSea = 'addCompanyFollow',
    }

    const url = mapApiUrl[type];

    return this.post(this.systemApi.getUrl(url), {
      ...req,
      [key]: id,
    });
  }

  getFollowList(req: ReqFollowList): Promise<ResponseFollowList> {
    const { id, type, ...rest } = req;
    const map: Record<FollowsType, string> = {
      customer: 'company_id',
      clue: 'clue_id',
      business: 'opportunity_id',
      openSea: 'clueOpenSeaId',
      customerOpenSea: 'customer_open_id',
    };
    const key = map[type];

    enum mapApiUrl {
      customer = 'getCompanyFollowList',
      clue = 'getClueFollowList',
      business = 'getBusinessFollowList',
      openSea = 'openSeaFollowList',
      customerOpenSea = 'customerOpenSeaFollowList',
    }

    const url = mapApiUrl[type];
    return this.get(this.systemApi.getUrl(url), {
      ...rest,
      [key]: id,
    });
  }

  openSeaFollowList(req: ReqOpenSeaFollowList): Promise<ResponseFollowList> {
    return this.get(this.systemApi.getUrl('openSeaFollowList'), req);
  }

  companyAddLabels(req: companyAddLabelsReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('companyAddLabels'), req, {
      contentType: 'form',
    });
  }

  companyCheckExport(req: companyCheckExportReq): Promise<clueCheckExportRes> {
    return this.post(this.systemApi.getUrl('companyCheckExport'), req, {
      contentType: 'json',
    });
  }

  businessCheckExport(req: opportunityCheckExportReq): Promise<clueCheckExportRes> {
    return this.post(this.systemApi.getUrl('businessCheckExport'), req, {
      contentType: 'json',
    });
  }

  // 客户公海
  openSeaCustomerList(req?: RequestCompanyMyList): Promise<RresponseCompanyMyList> {
    return this.post(this.systemApi.getUrl('openSeaCustomerList'), req);
  }

  openSCAllocate(req?: ReqOpenSeaAllocate): Promise<customerResult> {
    return this.post(this.systemApi.getUrl('openSCAllocate'), req);
  }

  openSeaCustomerDelete(req: string[]): Promise<customerResult> {
    return this.post(this.systemApi.getUrl('openSeaCustomerDelete'), req);
  }

  openSeaCustomerDetail(req: { id: string }): Promise<CustomerDetail> {
    return this.get(this.systemApi.getUrl('openSeaCustomerDetail'), req);
  }

  openSeaCustomerReceive(req: string[]): Promise<customerResult> {
    return this.post(this.systemApi.getUrl('openSeaCustomerReceive'), req);
  }

  openSeaCustomerValid(id: string): Promise<customerResult> {
    return this.get(this.systemApi.getUrl('openSeaCustomerValid'), { id });
  }

  returnCustomerOpenSea(req: ReqReturnOpenSea): Promise<boolean> {
    return this.post(this.systemApi.getUrl('returnCustomerOpenSea'), req);
  }

  returnCustomerOpenSeaRule(): Promise<openSeaRules> {
    return this.get(this.systemApi.getUrl('returnCustomerOpenSeaRule'));
  }

  /*
   * 线索相关模块
   */
  async addNewClue(req: newClueReq): Promise<boolean> {
    const data = await this.post(this.systemApi.getUrl('addNewClue'), req);
    // await this.contactApi.doInsertCustomer({ customerData: data, customerType: 'clue' });
    return data;
  }

  async editClue(req: newClueReq): Promise<boolean> {
    const data = await this.post(this.systemApi.getUrl('editClue'), req);
    // await this.contactApi.doInsertCustomer({ customerData: data, customerType: 'clue' });
    return data;
  }

  myClueList(req: newMyClueListReq): Promise<newMyClueListRes> {
    return this.post(this.systemApi.getUrl('myClueList'), req);
  }

  allClueList(req: newMyClueListReq): Promise<newMyClueListRes> {
    return this.post(this.systemApi.getUrl('allClueList'), req);
  }

  clueCheckExport(req: newMyClueListReq): Promise<clueCheckExportRes> {
    return this.post(this.systemApi.getUrl('clueCheckExport'), req, {
      contentType: 'json',
    });
  }

  clueDelete(req: string[]): Promise<boolean> {
    return this.post(this.systemApi.getUrl('clueDelete'), req);
  }

  clueForceDelete(req: string[]): Promise<boolean> {
    return this.post(this.systemApi.getUrl('clueForceDelete'), req);
  }

  existTransferCustomer(req: string[]): Promise<{ result: boolean }> {
    return this.post(this.systemApi.getUrl('existTransferCustomer'), req);
  }

  editClueStatus(req: editClueStatusReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('editClueStatus'), req);
  }

  clueBatchUpdate(req: clueBatchUpdateReq): Promise<{ result: boolean }> {
    return this.post(this.systemApi.getUrl('clueBatchUpdate'), req);
  }

  addOpportunity(req: newOpportunityReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addOpportunity'), req);
  }

  editOpportunity(req: newOpportunityReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('editOpportunity'), req);
  }

  deleteOpportunity(id: number): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteOpportunity'), id);
  }

  batchDeleteOpportunity(req: { ids: number[] }): Promise<boolean> {
    return this.post(this.systemApi.getUrl('batchDeleteOpportunity'), req, { contentType: 'form' });
  }

  opportunityDetail(id: number): Promise<any> {
    return this.get(this.systemApi.getUrl('opportunityDetail'), id);
  }

  opportunityList(req: opportunityListReq): Promise<opportunityListRes> {
    return this.post(this.systemApi.getUrl('opportunityList'), req);
  }

  opportunityListAll(req: opportunityListReq): Promise<opportunityListRes> {
    return this.post(this.systemApi.getUrl('opportunityListAll'), req);
  }

  opportunityStage(req: opportunityStageReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('opportunityStage'), req);
  }

  businessStages(): Promise<businessStagesReq> {
    return this.get(this.systemApi.getUrl('businessStages'));
  }

  contactListById(req: contactListByIdReq): Promise<ContactDetailRes[]> {
    return this.post(this.systemApi.getUrl('contactListById'), req);
  }

  companyContactListById(req: contactListByIdReq): Promise<ContactDetailRes[]> {
    return this.post(this.systemApi.getUrl('companyContactListById'), req);
  }

  businessContactListById(req: Partial<contactListByIdReq>): Promise<ContactDetailRes[]> {
    return this.post(this.systemApi.getUrl('businessContactListById'), req);
  }

  clueContactList(req: clueContactListReq): Promise<clueContactListRes[]> {
    return this.post(this.systemApi.getUrl('clueContactList'), req);
  }

  changeTOCustomer(req: changeTOCustomerReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('changeTOCustomer'), req);
  }

  clueCloseRecordList(id: string): Promise<clueRecordRes> {
    return this.get(this.systemApi.getUrl('clueCloseRecordList'), { id });
  }

  getMainContactList(req: ReqMainContactList): Promise<ResMainContactList[]> {
    return this.post(this.systemApi.getUrl('getMainContactList'), req);
  }

  opportunityContactList(req: opportunityListReq): Promise<opportunityContactListItem[]> {
    return this.post(this.systemApi.getUrl('opportunityContactList'), req);
  }

  opportunityContactListAll(req: opportunityListReq): Promise<opportunityContactListItem[]> {
    return this.post(this.systemApi.getUrl('opportunityContactListAll'), req);
  }

  getNosUploadToken(req: ReqNosToken, condition = 'company'): Promise<ResNosToken> {
    let url = this.systemApi.getUrl('getNosUploadToken');
    url = url.replace(/\/api\/biz\/document/, '/api/biz/' + condition + '/document');

    return this.get(url, {
      bizCode: 'lxbg-df1788e',
      ...req,
    });
  }

  finishNosUpload(req: ReqFinishNosUpload, condition = 'company'): Promise<ResFinishNosUpload> {
    let url = this.systemApi.getUrl('finishUploadNos');
    url = url.replace(/\/api\/biz\/document/, '/api/biz/' + condition + '/document');

    return this.post(url, req, {
      contentType: 'json',
    });
  }

  previewNosFile(docId: string, source: string, sourceId: string): Promise<string> {
    let url = this.systemApi.getUrl('previewNosFile');
    url = url.replace(/\/api\/biz\/document/, '/api/biz/' + source + '/document');
    return this.post(url, {
      document_id: docId,
      condition: source || '',
      [source + '_id']: sourceId,
    });
  }

  syncDocument(docId: string, source: string): Promise<boolean> {
    let url = this.systemApi.getUrl('syncDocument');
    url = url.replace(/\/api\/biz\/document\//, '/api/biz/' + source + '/document/');
    return this.get(url, {
      documentId: docId,
    });
  }

  openSeaList(req: openSeaReq): Promise<openSeaListRes> {
    return this.post(this.systemApi.getUrl('openSeaList'), req);
  }

  openSeaReceive(req: string[]): Promise<boolean> {
    return this.post(this.systemApi.getUrl('openSeaReceive'), req);
  }

  openSeaAllocate(req: seaAllocateReq): Promise<boolean> {
    return this.post(this.systemApi.getUrl('openSeaAllocate'), req);
  }

  openSeaDelete(req: string[]): Promise<boolean> {
    return this.post(this.systemApi.getUrl('openSeaDelete'), req);
  }

  openSeaDetail(id: string): Promise<openSeaDetail> {
    return this.get(this.systemApi.getUrl('openSeaDetail'), id);
  }

  getCustomerAccount(req: ReqAdminAccount): Promise<ResAdminAccount> {
    return this.get(this.systemApi.getUrl('getCustomerAccount'), req);
  }

  returnOpenSea(req: ReqReturnOpenSea): Promise<boolean> {
    return this.post(this.systemApi.getUrl('returnOpenSea'), req);
  }

  snapshotPreview(req: RessnapshotPreview): Promise<string> {
    const { condition } = req;

    enum mapApiUrl {
      company = 'companySnapshotPreview',
      clue = 'clueSnapshotPreview',
      opportunity = 'businessSnapshotPreview',
      open_sea = 'openSeaSnapshotPreview',
    }

    const url = mapApiUrl[condition];
    return this.post(this.systemApi.getUrl(url), req);
  }

  openSeaSnapshotPreview(req: RessnapshotPreview): Promise<string> {
    return this.post(this.systemApi.getUrl('openSeaSnapshotPreview'), req);
  }

  openSeaValid(id: string): Promise<string> {
    return this.get(this.systemApi.getUrl('openSeaValid'), { id });
  }

  clueValid(id: string): Promise<string> {
    return this.get(this.systemApi.getUrl('clueValid'), { id });
  }

  opportunityValid(id: string): Promise<string> {
    return this.get(this.systemApi.getUrl('opportunityValid'), { id });
  }

  companyValid(id: string): Promise<string> {
    return this.get(this.systemApi.getUrl('companyValid'), { id });
  }

  /**
   * 文件列表
   */
  getDocumentList(req: ReqDocumentList): Promise<ResDocumentList> {
    const { condition, condition_id, ...rest } = req;
    const map: Record<string, string> = {
      company: this.systemApi.getUrl('getCompanyDocuments'),
      clue: this.systemApi.getUrl('getClueDocuments'),
      opportunity: this.systemApi.getUrl('getBusinessDocuments'),
      open_sea: this.systemApi.getUrl('getOpenSeaDocuments'),
      customer_open_sea: this.systemApi.getUrl('getCustomerOpenSeaDocuments'),
    };
    const mapId: Record<string, string> = {
      company: 'company_id',
      clue: 'clue_id',
      opportunity: 'opportunity_id',
      open_sea: 'clue_open_sea_id',
      customer_open_sea: 'customer_open_sea_id',
    };

    return this.post(map[condition], {
      condition,
      ...rest,
      [mapId[condition]]: condition_id,
    });
  }

  // 黑名单
  getEdmBlacklist(req: RequestEdmBlacklist): Promise<ResponseEdmBlacklist> {
    return this.get(this.systemApi.getUrl('getEdmBlacklist'), req);
  }

  // 黑名单
  getEdmNSBlacklist(req: RequestEdmBlacklist): Promise<ResponseEdmNSBlacklist> {
    return this.get(this.systemApi.getUrl('getEdmNSBlacklist'), req);
  }

  addEdmBlacklist(req: RequestAddEdmBlacklist): Promise<any> {
    return this.post(this.systemApi.getUrl('addEdmBlacklist'), req);
  }

  addEdmNSBlacklist(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('addEdmNSBlacklist'), req);
  }

  removeEdmBlacklist(req: RequestRemoveEdmBlacklist): Promise<any> {
    return this.post(this.systemApi.getUrl('removeEdmBlacklist'), req);
  }

  removeEdmNSBlacklist(req: RequestRemoveEdmNSBlacklist): Promise<any> {
    return this.post(this.systemApi.getUrl('removeEdmNSBlacklist'), req);
  }

  exportBlacklist(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('exportBlacklist'), req);
  }

  exportNSBlacklist(req: any): Promise<any> {
    return this.post(this.systemApi.getUrl('exportNSBlacklist'), req);
  }

  getRuleList(): Promise<{ items: EdmMailRule[] }> {
    return this.get(this.systemApi.getUrl('getEdmRuleList'));
  }

  addRule(req: Partial<EdmMailRule>): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addEdmRule'), req);
  }

  updateRule(req: EdmMailRule): Promise<boolean> {
    return this.post(this.systemApi.getUrl('updateEdmRule'), req);
  }

  deleteRule(req: string[]): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteEdmRule'), {
      rule_ids: req,
    });
  }

  addMailTag(req: { name: string; color: string }): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addMailTag'), req);
  }

  updateMailTag(req: { name: string; color: string; labelId: string }): Promise<boolean> {
    return this.post(this.systemApi.getUrl('updateMailTag'), req);
  }

  getMailTagList(req: {
    condition: ContactEmailsCondition;
    clue_id?: string;
    company_id?: string;
    opportunity_id?: string;
    clue_open_sea_id?: string;
    mainResourceId?: string;
  }): Promise<Array<CustomerEmailTag>> {
    let url = this.systemApi.getUrl('getEdmTagList');
    const { condition } = req;
    const conditionToPath: Record<string, string> = {
      [ContactEmailsCondition.OpenSea]: 'clue/open_sea',
    };
    const _condition = conditionToPath[condition] || condition;
    url = url.replace(/\/api\/biz\/company\//, '/api/biz/' + _condition + '/');

    return this.post(url, req).then(data => data.labels);
  }

  contactListPageById(req: ReqContactListById): Promise<ResContactListById> {
    const { condition } = req;
    const conditionToPath: Record<string, string> = {
      open_sea: 'clue/open_sea',
      customer_open_sea: 'customer/open_sea',
    };
    const _condition = conditionToPath[condition] || condition;
    let url = this.systemApi.getUrl('contactListPageById');
    url = url.replace(/\/api\/biz\/company\//, '/api/biz/' + _condition + '/');
    return this.post(url, req);
  }

  /*
   * 浏览器插件
   */
  extensionCaptureEmailList(req: IExtensionCaptureEmailListReq): Promise<IExtensionCaptureEmailListItem[]> {
    return this.post(this.systemApi.getUrl('extensionCaptureEmailList'), req);
  }

  extensionCaptureEmailDelete(req: number[]): Promise<IExtensionCaptureEmailDeleteRes> {
    return this.post(this.systemApi.getUrl('extensionCaptureEmailDelete'), req);
  }

  extensionImportClue(req: IExtensionImportClue): Promise<boolean> {
    return this.post(this.systemApi.getUrl('extensionImportClue'), req);
  }

  extensionWhiteList(): Promise<IExtensionWhiteListRes> {
    return this.get(this.systemApi.getUrl('extensionWhiteList'));
  }

  extensionWhiteListAdd(req: IExtensionWhiteListDeleteReq): Promise<boolean> {
    return this.get(this.systemApi.getUrl('extensionWhiteListAdd'), req);
  }

  extensionWhiteListDelete(req: IExtensionWhiteListDeleteReq): Promise<boolean> {
    return this.get(this.systemApi.getUrl('extensionWhiteListDelete'), req);
  }

  companyCheckRules(): Promise<resCompanyRules> {
    return this.get(this.systemApi.getUrl('companyCheckRules'));
  }

  updateCompanyCheckRules(req: resCompanyRules): Promise<boolean> {
    return this.post(this.systemApi.getUrl('updateCompanyCheckRules'), req);
  }

  judgeRepeat(req: RequestCompanyMyList): Promise<RresponseCompanyMyList> {
    return this.post(this.systemApi.getUrl('judgeRepeat'), req);
  }

  repeatList(req: reqRepeatList): Promise<resRepeatList> {
    return this.post(this.systemApi.getUrl('repeatList'), req);
  }

  singleJudgeRepeat(req: reqSingleJudgeRepeat): Promise<resSingleJudgeRepeat> {
    return this.post(this.systemApi.getUrl('singleJudgeRepeat'), req);
  }

  batchJudgeRepeat(req: RequestBusinessaAddCompany): Promise<RresponseBusinessaAddCompany> {
    return this.post(this.systemApi.getUrl('batchJudgeRepeat'), req);
  }

  judgeRepeatSearch(req: JudgeRepeatSearchReq): Promise<JudgeRepeatItem[]> {
    return this.post(this.systemApi.getUrl('judgeRepeatSearch'), req);
  }

  emailSuffixConfigList(): Promise<EmailSuffixList> {
    return this.get(this.systemApi.getUrl('emailSuffixConfigList'));
  }

  emailSuffixConfigListUpdate(req: EmailSuffixList): Promise<boolean> {
    return this.post(this.systemApi.getUrl('emailSuffixConfigListUpdate'), req);
  }

  getOpenSeaSetting(): Promise<IOpenSeaSetting> {
    return this.get(this.systemApi.getUrl('getOpenSeaSetting'));
  }

  updateOpenSeaSetting(req: IOpenSeaSetting): Promise<boolean> {
    return this.post(this.systemApi.getUrl('updateOpenSeaSetting'), req);
  }

  // 数据迁移
  parseFiles(req: FormData): Promise<ResParseTables> {
    return this.post(this.systemApi.getUrl('customerDMParse'), req, {
      contentType: 'stream',
      timeout: 2 * 60 * 1000,
    });
  }

  getObjectFields(multiFile: boolean): Promise<{ [key: string]: DMObjectField[] }> {
    return this.get(this.systemApi.getUrl('customerDMMaps'), { multiFile });
  }

  validDMFields(req: ReqDMValidField, config?: ApiRequestConfig): Promise<boolean> {
    return this.post(this.systemApi.getUrl('customerDMValidField'), req, config).then(res => res.result);
  }

  validDMImport(req: ReqDMImport): Promise<ResDMImport & { need_clue_import: boolean }> {
    return this.post(this.systemApi.getUrl('customerDImportValid'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  doDMImport(req: ReqDMImport): Promise<ResDMImport> {
    return this.post(this.systemApi.getUrl('customerDMImport'), req, {
      timeout: 2 * 60 * 1000,
    });
  }

  downloadDMFail(download_id: string): Promise<void> {
    return this.get(this.systemApi.getUrl('customerDMDownloadFail'), { download_id });
  }

  getCustomerByEmail(email: string): Promise<{ items: CustomerInfoShort[] }> {
    return this.get(this.systemApi.getUrl('getCustomerByEmail'), { email });
  }

  updatePartialCompany(req: Partial<RequestBusinessaAddCompany>): Promise<{ id: number }> {
    return this.post(this.systemApi.getUrl('updatePartialCompany'), req);
  }

  updatePartialClue(req: Partial<newClueReq>): Promise<{ id: number }> {
    return this.post(this.systemApi.getUrl('updatePartialClue'), req);
  }

  updatePartialContact(req: Partial<ContactAddReq>): Promise<{ id: number }> {
    return this.post(this.systemApi.getUrl('updatePartialContact'), req);
  }

  importRecord(req: RequestLabel) {
    return this.post(this.systemApi.getUrl('importRecord'), req);
  }

  /**
   * whatsapp 侧边栏
   */
  getCustomerListByWhatsAppId(whatsappId: string): Promise<{ resourceIdList: CustomerDetail[] }> {
    return this.post(this.systemApi.getUrl('getCustomerListByWhatsAppId'), {
      resourceType: 'company',
      wa: whatsappId,
    });
  }

  getBindCustomerByWhatsAppId(whatsappId: string): Promise<CustomerDetail> {
    return this.post(this.systemApi.getUrl('getBindCompanyByWhatsAppId'), {
      resourceType: 'company',
      wa: whatsappId,
    });
  }

  getPersonalWhatsappHistory(req: { fromNumber: string; toNumber: string; fromAccId: string }): Promise<PersonalWhatsappHistoryRes> {
    return this.get(this.systemApi.getUrl('getPersonalWhatsappHistory'), req);
  }

  getPersonalWhatsappHistoryAround(req: { fromNumber: string; messageId: string; fromAccId: string }): Promise<PersonalWhatsappHistoryRes> {
    return this.get(this.systemApi.getUrl('getPersonalWhatsappHistoryAround'), req);
  }

  bindWhatsAppIdToCompany(req: { whatsappId: string; companyId: string }): Promise<boolean> {
    return this.post(this.systemApi.getUrl('bindWhatsAppIdToCompany'), {
      resourceType: 'company',
      resourceId: req.companyId,
      wa: req.whatsappId,
    });
  }

  bspBindWhatsAppIdToCompany(req: { whatsappId: string; companyId: string }): Promise<boolean> {
    return this.post(this.systemApi.getUrl('bspBindWhatsAppIdToCompany'), {
      resourceType: 1,
      resourceId: req.companyId,
      chatId: req.whatsappId,
    });
  }

  getBspBindCustomerByWhatsAppId(whatsappId: string): Promise<CustomerDetail> {
    return this.get(this.systemApi.getUrl('bspGetCBindCompanyByWhatsappId'), {
      // resourceType: 0,
      chatId: whatsappId,
    });
  }
}

const customerApiImpl = new CustomerImpl();
api.registerLogicalApi(customerApiImpl);
export default customerApiImpl;
