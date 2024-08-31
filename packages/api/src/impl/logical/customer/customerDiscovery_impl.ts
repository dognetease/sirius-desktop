import { api } from '../../../api/api';
import { ApiRequestConfig } from '../../../api/data/http';
import {
  AddAuthWhitelistReq,
  AutoTaskRuleRes,
  ChangeValidFlagRes,
  CreateAuthReq,
  CustomerAuthDataType,
  CustomerAuthGrantRecord,
  CustomerAuthHistoryList,
  CustomerAuthHistorySearch,
  CustomerAuthList,
  CustomerAuthorizationSearch,
  CustomerAuthWhitelist,
  CustomerAuthWhitelistSearch,
  CustomerAutoTaskList,
  CustomerAutoTaskReq,
  CustomerDiscoveryApi,
  CustomerDisDetail,
  CustomerEmailAuthManager,
  CustomerEmailEmailList,
  CustomerEmailListReq,
  CustomerEmailsContact,
  CustomerEmailTagItem,
  CustomerManualTask,
  CustomerManualTaskList,
  CustomerManualTaskListReq,
  RecommendTaskInfoData,
  RegularCustomerList,
  RegularCustomerListAllReq,
  RegularCustomerListReq,
  RegularCustomerMenuData,
  RuleViewPermissionData,
  RuleViewPermissionList,
  RuleViewPermissionReq,
} from '../../../api/logical/customerDiscovery';

const eventApi = api.getEventApi();

interface ErrorData {
  message: string;
}

class ApiError extends Error {
  data: ErrorData;

  constructor(data: ErrorData) {
    super(data?.message);
    this.data = data;
  }
}

class CustomerDiscoveryApiImpl implements CustomerDiscoveryApi {
  name = 'customerDiscoveryApi';

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  init() {
    return this.name;
  }

  async get(url: string, req?: any, config?: ApiRequestConfig): Promise<any> {
    try {
      const res = await this.http.get(url, req, config);
      if (!res?.data?.success) {
        throw new ApiError(res?.data as ErrorData);
      }
      return res.data;
    } catch (err: any) {
      const message = err?.data?.message || '网络错误';
      setTimeout(() => {
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
      return Promise.reject(message);
    }
  }

  async post(url: string, body: any, config?: ApiRequestConfig): Promise<any> {
    try {
      const res = await this.http.post(url, body, {
        contentType: 'json',
        noEnqueue: false,
        ...(config || {}),
      });
      if (!res?.data?.success) {
        throw new ApiError(res?.data as ErrorData);
      }
      return res.data;
    } catch (err: any) {
      const message = err?.data?.message || '网络错误';
      if (!config?.noErrorMsgEmit) {
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
      }
      return Promise.reject(message);
    }
  }

  EmailListUrl: Record<string, string> = {
    [CustomerAuthDataType.Clue]: this.systemApi.getUrl('getClueContactEmails'),
    [CustomerAuthDataType.Company]: this.systemApi.getUrl('getCompanyContactEmails'),
    [CustomerAuthDataType.OpenSea]: this.systemApi.getUrl('getOpenSeaContactEmails'),
    [CustomerAuthDataType.Opportunity]: this.systemApi.getUrl('getBusinessContactEmails'),
    [CustomerAuthDataType.RegularCustomer]: this.systemApi.getUrl('getRegularCustomerEmailList'),
    [CustomerAuthDataType.CustomerOpenSea]: this.systemApi.getUrl('customerOpenSeaContactEmails'),
    [CustomerAuthDataType.Address]: this.systemApi.getUrl('getCompanyContactEmails'),
  };

  EmailTagUrl: Record<string, string> = {
    [CustomerAuthDataType.Clue]: this.systemApi.getUrl('getClueTagList'),
    [CustomerAuthDataType.Company]: this.systemApi.getUrl('getEdmTagList'),
    [CustomerAuthDataType.OpenSea]: this.systemApi.getUrl('getOpenSeaTagList'),
    [CustomerAuthDataType.Opportunity]: this.systemApi.getUrl('getOpportunityTagList'),
    [CustomerAuthDataType.RegularCustomer]: this.systemApi.getUrl('getRegularCustomerEmailTag'),
    [CustomerAuthDataType.CustomerOpenSea]: this.systemApi.getUrl('getCustomerOpenSeaTagList'),
    [CustomerAuthDataType.Address]: this.systemApi.getUrl('getEdmTagList'),
  };

  EmailContactUrl: Record<string, string> = {
    [CustomerAuthDataType.Clue]: this.systemApi.getUrl('getClueEmailsContacts'),
    [CustomerAuthDataType.Company]: this.systemApi.getUrl('getCompanyEmailsContacts'),
    [CustomerAuthDataType.OpenSea]: this.systemApi.getUrl('getOpenSeaEmailsContacts'),
    [CustomerAuthDataType.Opportunity]: this.systemApi.getUrl('getBusinessEmailsContacts'),
    [CustomerAuthDataType.RegularCustomer]: this.systemApi.getUrl('getRegularCustomerEmailContact'),
    [CustomerAuthDataType.CustomerOpenSea]: this.systemApi.getUrl('customerOpenSeaEmailsContacts'),
    [CustomerAuthDataType.Address]: this.systemApi.getUrl('getCompanyEmailsContacts'),
  };

  EmailPreviewUrl: Record<string, string> = {
    [CustomerAuthDataType.Clue]: this.systemApi.getUrl('clueSnapshotPreview'),
    [CustomerAuthDataType.Company]: this.systemApi.getUrl('companySnapshotPreview'),
    [CustomerAuthDataType.OpenSea]: this.systemApi.getUrl('openSeaSnapshotPreview'),
    [CustomerAuthDataType.Opportunity]: this.systemApi.getUrl('businessSnapshotPreview'),
    [CustomerAuthDataType.RegularCustomer]: this.systemApi.getUrl('previewRegularCustomerEmail'),
    [CustomerAuthDataType.CustomerOpenSea]: this.systemApi.getUrl('openSeaCompanySnapshotPreview'),
    [CustomerAuthDataType.Address]: this.systemApi.getUrl('companySnapshotPreview'),
  };

  /** -------------------------------往来邮件相关------------------------------------- */
  async getCustomerEmailList(req: CustomerEmailListReq): Promise<CustomerEmailEmailList> {
    const res = await this.post(this.EmailListUrl[req.condition], { ...req, version: 'regular_customer' }, { noErrorMsgEmit: req.noErrorMsgEmit });
    return res.data;
  }
  // eslint-disable-next-line
  async getCustomerEmailTags(condition: string, main_resource_id: string, data_source: string): Promise<Array<CustomerEmailTagItem>> {
    const res = await this.post(this.EmailTagUrl[condition], { condition, main_resource_id, data_source, version: 'regular_customer' });
    return res?.data?.labels || [];
  }
  // eslint-disable-next-line
  async getCustomerEmailContacts(condition: string, main_resource_id: string, data_source: string): Promise<CustomerEmailsContact> {
    const res = await this.post(this.EmailContactUrl[condition], { condition, main_resource_id, data_source, version: 'regular_customer' });
    return res.data;
  }
  // eslint-disable-next-line
  async getCustomerEmailPreviewUrl(condition: string, mailSnapshotId: string, main_resource_id: string, data_source: string): Promise<string> {
    const res = await this.post(this.EmailPreviewUrl[condition], { condition, mailSnapshotId, main_resource_id, data_source, version: 'regular_customer' });
    return res.data;
  }

  /** -------------------------------权限相关------------------------------------- */
  productId = 'fastmail';

  productVersionId = 'professional';

  async createAuth(req: CreateAuthReq): Promise<void> {
    return this.post(this.systemApi.getUrl('createAuth'), req);
  }

  async getCustomerAuthList(req: CustomerAuthorizationSearch): Promise<CustomerAuthList> {
    const { productId, productVersionId } = this;
    return this.get(this.systemApi.getUrl('getCustomerAuthList'), { ...req, productId, productVersionId });
  }

  async getCustomerAuthGrantRecords(recordId: string): Promise<{ data: Array<CustomerAuthGrantRecord> }> {
    const { productId, productVersionId } = this;
    return this.get(this.systemApi.getUrl('getCustomerAuthGrantRecords'), { recordId, productId, productVersionId });
  }

  async getAuthManagerList(): Promise<Array<CustomerEmailAuthManager>> {
    const { productId, productVersionId } = this;
    const res = await this.get(this.systemApi.getUrl('getAuthManagerList'), { productId, productVersionId });
    return res.data;
  }

  /**
   * 通过授权申请
   * @param recordIds
   * @returns
   */
  async passAuth(recordIds: string[]) {
    const { productId, productVersionId } = this;
    return this.post(this.systemApi.getUrl('passAuth'), { recordIds, productId, productVersionId });
  }

  /**
   * 驳回授权申请
   * @param recordIds
   * @returns
   */
  async rejectAuth(recordIds: string[]) {
    const { productId, productVersionId } = this;
    return this.post(this.systemApi.getUrl('rejectAuth'), { recordIds, productId, productVersionId });
  }

  /**
   * 通过单独资源
   * @param recordId
   * @param resourceIds
   * @returns
   */
  async passAuthResource(recordId: string, resourceIds: string[]) {
    const { productId, productVersionId } = this;
    return this.post(this.systemApi.getUrl('passAuthResource'), {
      recordId,
      resourceIds,
      productId,
      productVersionId,
    });
  }

  /**
   * 驳回单独资源
   * @param recordId
   * @param resourceIds
   * @returns
   */
  async rejectAuthResource(recordId: string, resourceIds: string[]) {
    const { productId, productVersionId } = this;
    return this.post(this.systemApi.getUrl('rejectAuthResource'), {
      recordId,
      resourceIds,
      productId,
      productVersionId,
    });
  }

  /**
   * 审核历史记录列表
   * @param req
   * @returns
   */
  async getCustomerAuthHistoryList(req: CustomerAuthHistorySearch): Promise<CustomerAuthHistoryList> {
    const { productId, productVersionId } = this;
    return this.get(this.systemApi.getUrl('getCustomerAuthHistoryList'), {
      ...req,
      productId,
      productVersionId,
    });
  }

  async getAuthWhiteList(req: CustomerAuthWhitelistSearch): Promise<CustomerAuthWhitelist> {
    const { productId, productVersionId } = this;
    return this.get(this.systemApi.getUrl('getAuthWhiteList'), {
      ...req,
      productId,
      productVersionId,
    });
  }

  async addAuthWhitelist(req: AddAuthWhitelistReq): Promise<void> {
    const { productId, productVersionId } = this;
    return this.post(this.systemApi.getUrl('addAuthWhitelist'), {
      ...req,
      productId,
      productVersionId,
    });
  }

  async removeAuthWhitelist(ownerAccId: string): Promise<void> {
    const { productId, productVersionId } = this;
    return this.post(this.systemApi.getUrl('removeAuthWhitelist'), {
      ownerAccId,
      productId,
      productVersionId,
    });
  }

  /** -------------------------------老客相关------------------------------------- */
  getCustomerAutoTaskList(req: CustomerAutoTaskReq): Promise<CustomerAutoTaskList> {
    return this.post(this.systemApi.getUrl('getCustomerAutoTaskList'), req, { noEnqueue: true });
  }

  getCustomerManualTaskList(req: CustomerManualTaskListReq): Promise<CustomerManualTaskList> {
    return this.post(this.systemApi.getUrl('getCustomerManualTaskList'), req, { noEnqueue: true });
  }

  getRegularCustomerList(req: RegularCustomerListReq): Promise<RegularCustomerList> {
    return this.post(this.systemApi.getUrl('getRegularCustomerList'), req);
  }

  getRegularCustomerListAll(req: RegularCustomerListAllReq): Promise<RegularCustomerList> {
    return this.post(this.systemApi.getUrl('getRegularCustomerListAll'), req);
  }

  getRegularCustomerDetail(regularCustomerId: string): Promise<{ data: CustomerDisDetail }> {
    return this.get(this.systemApi.getUrl('getRegularCustomerDetail'), { regularCustomerId });
  }

  addManualTask(req: CustomerManualTask): Promise<void> {
    return this.post(this.systemApi.getUrl('addManualTask'), req);
  }

  deleteManualTask(taskId: string): Promise<void> {
    return this.post(this.systemApi.getUrl('deleteManualTask'), { taskId });
  }

  suspendManualTask(taskId: string): Promise<void> {
    return this.post(this.systemApi.getUrl('suspendManualTask'), { taskId });
  }

  restartManualTask(taskId: string): Promise<void> {
    return this.post(this.systemApi.getUrl('restartManualTask'), { taskId });
  }

  changeCustomerTaskStatus(taskId: string, status: string): Promise<void> {
    return this.post(this.systemApi.getUrl('changeCustomerTaskStatus'), { taskId, status });
  }

  changeValidFlag(regularCustomerIdList: string[], validFlag: string | number): Promise<ChangeValidFlagRes> {
    return this.post(this.systemApi.getUrl('changeValidFlag'), { regularCustomerIdList, validFlag }).then(res => res.data || {});
  }

  syncClue(regularCustomerIdList: string[]): Promise<void> {
    return this.post(this.systemApi.getUrl('syncClue'), { regularCustomerIdList });
  }

  assignClue(regularCustomerIdList: string[], acceptorId: string): Promise<void> {
    return this.post(this.systemApi.getUrl('assignClue'), { regularCustomerIdList, acceptorId });
  }

  syncOpenSea(regularCustomerIdList: string[]): Promise<void> {
    return this.post(this.systemApi.getUrl('syncOpenSea'), { regularCustomerIdList });
  }

  syncCustomer(customer: any): Promise<void> {
    return this.post(this.systemApi.getUrl('syncCustomer'), { ...customer });
  }

  unFinishCustomerTask(taskId: string): Promise<{ data: { taskStatus: string } }> {
    return this.post(this.systemApi.getUrl('unFinishCustomerTask'), { taskId });
  }

  async getRegularCustomerMenuData(): Promise<RegularCustomerMenuData> {
    const { productId, productVersionId } = this;
    const res = await Promise.all([
      this.get(this.systemApi.getUrl('getRegularCustomerMenuData'), {}).then(res => res?.data || {}),
      this.get(this.systemApi.getUrl('getPrivilegeMenuData'), { productId, productVersionId }).then(res => res?.data || {}),
    ]);
    return { ...(res?.[0] ?? {}), ...(res?.[1] ?? {}) };
  }

  getRuleRecommendKeyword(): Promise<string[]> {
    return this.get(this.systemApi.getUrl('getRuleRecommendKeyword'), {}).then(res => res?.data || []);
  }

  getRuleViewPermissionList(state: number): Promise<RuleViewPermissionData[]> {
    return this.post(this.systemApi.getUrl('getRuleViewPermissionList'), { state }).then(res => res?.data || {});
  }

  getRuleViewPermissionPage(req: RuleViewPermissionReq): Promise<RuleViewPermissionList> {
    return this.post(this.systemApi.getUrl('getRuleViewPermissionPage'), req);
  }

  changeRuleViewPermission(accIds: string[], state: number): Promise<void> {
    return this.post(this.systemApi.getUrl('changeRuleViewPermission'), { accIds, state });
  }

  getAutoTaskRule(): Promise<AutoTaskRuleRes> {
    return this.get(this.systemApi.getUrl('getAutoTaskRule'), {}).then(res => res?.data || {});
  }

  changeAutoTaskStatus(isOpen: boolean): Promise<void> {
    return this.post(this.systemApi.getUrl('changeAutoTaskStatus'), { isOpen });
  }

  getRecommendTaskInfo(taskId: string): Promise<RecommendTaskInfoData> {
    return this.get(this.systemApi.getUrl('getRecommendTaskInfo'), { taskId }, { noEnqueue: true }).then(res => res?.data || {});
  }

  synCustomerStatus(regularCustomerId: string, company_id: number): Promise<void> {
    return this.post(this.systemApi.getUrl('synCustomerStatus'), { company_id, regularCustomerId });
  }
}

const customerDiscoveryApiImpl = new CustomerDiscoveryApiImpl();
api.registerLogicalApi(customerDiscoveryApiImpl);
export default customerDiscoveryApiImpl;
