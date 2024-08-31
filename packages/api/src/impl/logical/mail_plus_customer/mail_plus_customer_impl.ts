import lodashChunk from 'lodash/chunk';
import { api } from '@/api/api';
import { apis } from '@/config';
import {
  EmailPlusLabelServerRes,
  EmailRoleBase,
  EmailRoleBaseRes,
  EmailRoleBaseScoreMap,
  EmailRoles,
  GetMyCustomerSearchPageSeverRes,
  GetMyCustomerSearchSeverRes,
  MailPlusCustomerApi,
  MailPlusEdmPrivilegeViewData,
  MailPlusEdmPrivilegeRangeData,
  SearchCustomerModule,
  SearchCustomerRes,
  SearchCustomerPageRes,
  OpportunityListRes,
  OpportunityStatusRes,
  IGetContactListParams,
  IGetContactListReturn,
  ClueStatusRes,
  TCustomerRoleMap,
} from '@/api/logical/mail_plus_customer';
import { ContactApi, OrgApi } from '@/api/logical/contactAndOrg';
import { edmMailHelper, RoleScoreMap } from '@/api/util/edm_mail_helper';
import { SystemApi } from '@/api/system/system';
import { DataTransApi } from '@/api/data/http';
import { ContactModel, CustomerId, EMAIL, _ACCOUNT } from '@/api/_base/api';
import { CustomerListParams, ServerCustomerContactModel, ServerCustomerModel } from '@/api/logical/contact_edm';
import { util, wait } from '@/api/util';
import { EdmRoleApi } from '@/api/logical/edm_role';
import { DataTrackerApi } from '@/index';

class MailPlusCustomer implements MailPlusCustomerApi {
  name: string;

  private contactApi: ContactApi & OrgApi;

  private systemApi: SystemApi;

  private httpApi: DataTransApi;

  private edmRoleApi = api.requireLogicalApi(apis.edmRoleApiImpl) as EdmRoleApi;

  private dataTrackApi = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;

  // 数据权限
  private lastEdmPrivilegeRangeData: MailPlusEdmPrivilegeRangeData | undefined;

  // 模块权限
  private lastEdmPrivilegeViewData: MailPlusEdmPrivilegeViewData | undefined;

  private displayEmailLabelMap = new Map<_ACCOUNT, Map<EMAIL, string>>();

  constructor() {
    this.name = apis.mailPlusCustomerApiImpl;
    this.systemApi = api.getSystemApi();
    this.httpApi = api.getDataTransApi();
    this.contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactApi & OrgApi;
  }

  init(): string {
    return this.name;
  }

  // 根据 email 判断角色
  async doGetRoleByEmail(params: { emails: string[]; _account?: string; useLx?: boolean; useEdm?: boolean }): Promise<EmailRoleBaseRes> {
    const { emails, _account, useLx = true, useEdm = process.env.BUILD_ISEDM } = params;
    if (!emails || emails.length === 0) {
      return {};
    }
    // emailSet代表去重的全小写email, emailList代表传入的不为空email列表
    const { emailSet, emailList } = emails.reduce(
      (obj, item) => {
        const email = item?.toLocaleLowerCase();
        if (email) {
          obj.emailSet.add(email);
          obj.emailList.push(item);
        }
        return obj;
      },
      { emailSet: new Set<string>(), emailList: [] as string[] }
    );
    const dataMap: EmailRoleBaseScoreMap = new Map();
    if (useLx) {
      // 查询灵犀的数据，对 dataMap 和 emailSet 进行了更改
      await this.getLxContactDataByEmail(dataMap, emailSet, _account);
    }
    if (emailSet.size > 0 && useEdm) {
      // 查询客户的数据，对 dataMap 和 emailSet 进行了更改
      await this.getEdmContactDataByEmail(dataMap, emailSet);
    }
    // 遍历传入的emailList,
    return emailList.reduce((total, _email) => {
      // 匹配服务端数据时全部转小写
      const email = _email?.toLocaleLowerCase();
      const currentData = dataMap.get(email);
      // 陌生人不返回出去，直接过滤掉
      if (currentData && currentData.score > RoleScoreMap.external) {
        // 返回的数据结构以传入的email为key
        total[_email] = currentData.data;
      }
      return total;
    }, {} as EmailRoleBaseRes);
  }

  private async getLxContactDataByEmail(dataMap: EmailRoleBaseScoreMap, emailSet: Set<string>, _account?: string): Promise<void> {
    const lxData = await this.contactApi.doGetContactByEmail({ emails: [...emailSet], _account });
    // 遍历返回的办公联系人
    Object.keys(lxData).forEach(key => {
      const contactModels = lxData[key];
      contactModels.forEach(({ contact }) => {
        // 根据办公联系人的 contactModel 构造出 EmailRoleBase
        const newData = edmMailHelper.transContactModelToEmailRole(contact);
        // 根据新数据的优先级
        edmMailHelper.insertIntoDataMap({ dataMap, emailSet, newData, maxScore: RoleScoreMap.enterprise });
      });
    });
    console.log('[doGetRoleByEmail] after lx', dataMap, emailSet);
  }

  private async getEdmContactDataByEmail(dataMap: EmailRoleBaseScoreMap, emailSet: Set<string>): Promise<void> {
    if (emailSet.size > 0) {
      const url = this.systemApi.getUrl('getCustomerLabelByEmailNew');
      const { data } = await this.httpApi.post<EmailPlusLabelServerRes[]>(
        url,
        { email_list: [...emailSet] },
        {
          contentType: 'json',
        }
      );
      // 如果一个email匹配了一个公海客户、一个我的客户，服务端接口会返回两条数据，前端会根据优先级 score，取优先级高的，优先级低的数据被舍弃
      // 如果一个email匹配了两个我的客户、服务端接口会返回两条数据，前端根据客户的创建时间，创建晚的主体中返回，其他的放到 relatedCustomerInfo 中
      // 如果一个email匹配了同一个客户的两个不同联系人，服务端接口会返回两条数据，前端根据联系人ID，ID大的在主体中返回，其他的被舍弃
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        const SCORE_MAP: Record<EmailPlusLabelServerRes['email_label'], EmailRoles> = {
          4: 'myCustomer',
          7: 'openSeaCustomer',
          8: 'colleagueCustomer',
          9: 'colleagueCustomerNoAuth',
          1: 'myClue',
          10: 'colleagueClue',
          3: 'openSeaClue',
          11: 'colleagueClueNoAuth',
        };
        data.data.forEach(v => {
          const role = SCORE_MAP[v.email_label];
          if (role) {
            const newData: EmailRoleBase = {
              role,
              email: v.contact_email?.toLocaleLowerCase(),
              companyId: String(v.id),
              companyName: v.company_name,
              contactId: String(v.contact_id),
              contactName: v.contact_name,
              customerCreateTime: v.create_time || 0,
              relatedCompanyInfo: [{ companyId: String(v.id), companyName: String(v.company_name) }], // 把自己放进去了
            };
            edmMailHelper.insertIntoDataMap({ dataMap, emailSet, newData, privilege: this.doGetLastEdmPrivilegeViewData() });
          }
        });
      }
      console.log('[doGetRoleByEmail] after edm', dataMap, emailSet);
    }
  }

  doCompareContactModelRoles(contactModels: ContactModel[]): ContactModel {
    return contactModels.reduce((prev, next) => {
      const prevData = edmMailHelper.transContactModelToEmailRole(prev.contact);
      const nextData = edmMailHelper.transContactModelToEmailRole(next.contact);
      return edmMailHelper.compareRoles(prevData, nextData) > -1 ? prev : next;
    });
  }

  doCompareEmailRoles(dataList: EmailRoleBase[]): EmailRoleBase {
    return dataList.reduce((prev, next) => (edmMailHelper.compareRoles(prev, next) > -1 ? prev : next));
  }

  /**
   * /根据客户id批量获取客户详情数据
   * @param companyIdList
   * @returns
   */
  async doGetCustomerDataByIds(companyIdList: CustomerId[], updateCustomerIdRoleMap?: TCustomerRoleMap): Promise<ServerCustomerModel[]> {
    try {
      if (!Array.isArray(companyIdList) || companyIdList.length === 0) {
        return [];
      }
      // 根据角色去分别请求接口，不知道角色，再统一请求
      // 客户，同事客户一个接口
      let myCompanyIdList = companyIdList;
      // 公海客户
      let openSeaCompanyIdList = companyIdList;
      // 我的线索，同事线索
      let myClueIdList = companyIdList;
      // 公海线索
      let openSeaClueIdList = companyIdList;
      // 如果有传递id到角色的映射关系，则精确请求
      if (updateCustomerIdRoleMap && Object.keys(updateCustomerIdRoleMap).length) {
        myCompanyIdList = companyIdList.filter(
          id => !updateCustomerIdRoleMap[id] || ['myCustomer', 'colleagueCustomer', 'colleagueCustomerNoAuth'].includes(updateCustomerIdRoleMap[id])
        );
        openSeaCompanyIdList = companyIdList.filter(id => !updateCustomerIdRoleMap[id] || ['openSeaCustomer'].includes(updateCustomerIdRoleMap[id]));
        myClueIdList = companyIdList.filter(
          id => !updateCustomerIdRoleMap[id] || ['myClue', 'colleagueClue', 'colleagueClueNoAuth'].includes(updateCustomerIdRoleMap[id])
        );
        openSeaClueIdList = companyIdList.filter(id => !updateCustomerIdRoleMap[id] || ['openSeaClue'].includes(updateCustomerIdRoleMap[id]));
      }
      const [myCustomerList, openSeaCustomerList, myClue, openSeaClue] = await Promise.all([
        !!myCompanyIdList.length ? this.doGetMyCustomerDataByIds(myCompanyIdList) : [],
        !!openSeaCompanyIdList.length ? this.doGetOpenSeaCustomerDataByIds(openSeaCompanyIdList) : [],
        !!myClueIdList.length ? this.getMyClueDataById(myClueIdList[0]) : null,
        !!openSeaClueIdList.length ? this.getOpenSeaClueDataById(openSeaClueIdList[0]) : null,
      ]);
      const customerList: ServerCustomerModel[] = [];
      myCustomerList.forEach(item => {
        customerList.push({ ...(item as ServerCustomerModel), company_type: 'customer' });
      });
      openSeaCustomerList.forEach(item => {
        customerList.push({ ...(item as ServerCustomerModel), company_type: 'openSea' });
      });
      if (myClue) {
        customerList.push({ ...(myClue as ServerCustomerModel), company_type: 'clue' });
      }
      if (openSeaClue) {
        customerList.push({ ...(openSeaClue as ServerCustomerModel), company_type: 'clue' });
      }
      // return [...myCustomerList, ...openSeaCustomerList];
      return customerList;
    } catch (e) {
      console.error('[mail_plus_customer] doGetCustomerDataByIds error', e);
      return [];
    }
  }

  /**
   * /根据客户id批量获取客户详情数据
   * @param companyIdList
   * @returns
   */
  async doGetMyCustomerDataByIds2(companyIdList: CustomerId[]): Promise<ServerCustomerModel[]> {
    try {
      if (!Array.isArray(companyIdList) || companyIdList.length === 0) {
        return [];
      }
      const customerViewRole = this.doGetLastEdmPrivilegeViewData()?.customer;
      if (!customerViewRole) {
        console.warn('🚀 ~ MailPlusCustomer ~ doGetMyCustomerDataByIds 无客户权限');
        return [];
      }
      const url = this.systemApi.getUrl('getCustomerDetailBatch');
      const reqParams = {
        companyIdList,
      };
      const res = await this.httpApi.post(url, reqParams, {
        contentType: 'json',
      });
      const { success, data, error } = res.data || {};
      if (success && data) {
        const { companyList = [] } = data;
        return companyList;
      }
      console.error('[mail_plus_customer] doGetCustomerDataByIds error', error);
      return [];
    } catch (e) {
      console.error('[mail_plus_customer] doGetCustomerDataByIds error', e);
      return [];
    }
  }

  private async getMyCustomerDataById(customerId: string): Promise<ServerCustomerModel | null> {
    try {
      const url = this.systemApi.getUrl('getCompanyDetailById');
      const reqParams = {
        customerId,
      };
      const res = await this.httpApi.get(url, reqParams, {
        contentType: 'json',
      });
      const { success, data, error } = res.data || {};
      if (success && data) {
        return data;
      }
      console.error('[mail_plus_customer] getMyCustomerDataById error customerId', customerId, error);
    } catch (e) {
      console.error('[mail_plus_customer] getMyCustomerDataById error customerId', customerId, e);
    }
    return null;
  }

  // 根据线索id获取线索详情，目前线索是按照一种特殊客户去处理的
  // 注意：目前仅有请求单个线索的场景，后续如有多个线索的场景，再进行拓展
  private async getMyClueDataById(clueId: string): Promise<ServerCustomerModel | null> {
    try {
      const clueViewRole = this.doGetLastEdmPrivilegeViewData()?.clue;
      if (!clueViewRole) {
        console.warn('🚀 ~ MailPlusCustomer ~ getMyClueDataById 无线索权限');
        return null;
      }
      const url = this.systemApi.getUrl('getClueDetailById');
      const reqParams = {
        leadsId: clueId,
      };
      const res = await this.httpApi.get(url, reqParams, {
        contentType: 'json',
      });
      const { success, data, error } = res.data || {};
      if (success && data) {
        return {
          ...data,
          company_id: data.leads_id,
          company_number: data.leads_number,
          contact_list: [data.main_contact],
        } as ServerCustomerModel;
      }
      console.error('[mail_plus_customer] getMyClueDataById error clueId', clueId, error);
    } catch (e) {
      console.error('[mail_plus_customer] getMyClueDataById error clueId', clueId, e);
    }
    return null;
  }
  // 根据线索id获取公海线索详情，逻辑同上
  private async getOpenSeaClueDataById(clueId: string): Promise<ServerCustomerModel | null> {
    try {
      const openSeaClueViewRole = this.doGetLastEdmPrivilegeViewData()?.openSeaClue;
      if (!openSeaClueViewRole) {
        console.warn('🚀 ~ MailPlusCustomer ~ getOpenSeaClueDataById 无公海线索权限');
        return null;
      }
      const url = this.systemApi.getUrl('getOpenSeaClueDetailById');
      const reqParams = {
        id: clueId,
      };
      const res = await this.httpApi.get(url, reqParams, {
        contentType: 'json',
      });
      const { success, data, error } = res.data || {};
      if (success && data) {
        return {
          ...data,
          company_id: data.id,
          company_number: data.leads_number,
          originCompanyId: data.leads_id,
          contact_list: [data.main_contact],
        } as ServerCustomerModel;
      }
      console.error('[mail_plus_customer] getOpenSeaClueDataById error clueId', clueId, error);
    } catch (e) {
      console.error('[mail_plus_customer] getOpenSeaClueDataById error clueId', clueId, e);
    }
    return null;
  }

  /**
   * /根据客户id批量获取客户详情数据
   * @param companyIdList
   * @returns
   */
  async doGetMyCustomerDataByIds(companyIdList: CustomerId[]): Promise<ServerCustomerModel[]> {
    try {
      if (!Array.isArray(companyIdList) || companyIdList.length === 0) {
        return [];
      }
      const customerViewRole = this.doGetLastEdmPrivilegeViewData()?.customer;
      if (!customerViewRole) {
        console.warn('🚀 ~ MailPlusCustomer ~ doGetMyCustomerDataByIds 无客户权限');
        return [];
      }
      if (companyIdList.length > 6) {
        this.dataTrackApi.track('pc_getMyCustomerDataByIds_max_limit_error');
        console.warn('🚀 ~ MailPlusCustomer ~ doGetMyCustomerDataByIds ~ companyIdList个数过长');
      }
      // 把请求的客户id分片请求（同时请求3个），每次请求间隔300ms
      const requests = lodashChunk(companyIdList, 3);
      const requesetPromise = requests.reduce(async (promise, ids, index) => {
        if (index !== 0) {
          await wait(300);
        }
        const res = await promise;
        const promiseList: Promise<ServerCustomerModel | null>[] = [];
        ids.forEach(id => {
          if (id) {
            promiseList.push(this.getMyCustomerDataById(id));
          }
        });
        const list = await Promise.all(promiseList);
        res.push(...list);
        return res;
      }, Promise.resolve([]) as Promise<Array<ServerCustomerModel | null>>);
      const serverList = await requesetPromise;
      const resData: ServerCustomerModel[] = [];
      serverList.forEach(item => {
        if (item !== null) {
          resData.push(item);
        }
      });
      return resData;
    } catch (e) {
      console.error('[mail_plus_customer] doGetCustomerDataByIds error', e);
      return [];
    }
  }

  /**
   * /根据公海客户id批量获取公海客户详情数据
   * @param ids
   * @returns
   */
  async doGetOpenSeaCustomerDataByIds(ids: CustomerId[]): Promise<ServerCustomerModel[]> {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return [];
      }
      const openSeaCustomerViewRole = this.doGetLastEdmPrivilegeViewData()?.openSeaCustomer;
      if (!openSeaCustomerViewRole) {
        console.warn('🚀 ~ MailPlusCustomer ~ doGetMyCustomerDataByIds ~ 无公海客户权限');
        return [];
      }
      const url = this.systemApi.getUrl('getOpenSeaCustomerDetailBatch');
      const reqParams = {
        ids,
      };
      const res = await this.httpApi.post(url, reqParams, {
        contentType: 'json',
      });
      const { success, data, error } = res.data || {};
      if (success && data) {
        if (Array.isArray(data)) {
          return data.map(item => ({ ...item, originCompanyId: item.company_id, company_id: item.id }));
        }
      }
      console.error('[mail_plus_customer] doGetOpenSeaCustomerDataByIds error', error);
      return [];
    } catch (e) {
      console.error('[mail_plus_customer] doGetOpenSeaCustomerDataByIds error', e);
      return [];
    }
  }

  /**
   * 获取当前账号
   * @private
   */
  private getCurrentContactId() {
    const user = this.systemApi.getCurrentUser();
    return user?.contact?.contact.id || (user?.prop?.contactId as string);
  }

  // 根据客户详情数据获取客户角色
  doGetCustomerRoleByModel(model: ServerCustomerModel): EmailRoles {
    // const managerList = model.manager_list;
    const { manager_list: managerList, company_type } = model;
    // 如果是客户或者公海客户
    if (company_type === 'customer' || company_type === 'openSea') {
      if (!managerList?.length) {
        return 'openSeaCustomer';
      }
      const managerIdsMap = util.listToMap(managerList, 'id');
      const contactId = this.getCurrentContactId();
      if (contactId && managerIdsMap[contactId]) {
        return 'myCustomer';
      }
      if (this.lastEdmPrivilegeRangeData?.customer) {
        const hasAuth = this.lastEdmPrivilegeRangeData?.customer.some(v => managerIdsMap[v]);
        return hasAuth ? 'colleagueCustomer' : 'colleagueCustomerNoAuth';
      }
      return 'colleagueCustomer';
    } else {
      // 这个时候company_type === 'clue',是线索
      if (!managerList?.length) {
        return 'openSeaClue';
      }
      const managerIdsMap = util.listToMap(managerList, 'id');
      const contactId = this.getCurrentContactId();
      if (contactId && managerIdsMap[contactId]) {
        return 'myClue';
      }
      if (this.lastEdmPrivilegeRangeData?.clue) {
        const hasAuth = this.lastEdmPrivilegeRangeData?.clue.some(v => managerIdsMap[v]);
        return hasAuth ? 'colleagueClue' : 'colleagueClueNoAuth';
      }
      return 'colleagueClue';
    }
  }

  // 设置外贸相关权限 doSetLastEdmRoleData
  doSetLastEdmPrivilegeData(params: { privilegeMap?: Map<string, Set<string>>; contactPrivilegeRangeData?: string[]; cluePrivilegeRangeData?: string[] }) {
    const { privilegeMap, contactPrivilegeRangeData, cluePrivilegeRangeData } = params;
    if (privilegeMap) {
      this.lastEdmPrivilegeViewData = this.edmRoleApi.doGetMailPlusEdmViewPrivilege();
    }

    if (contactPrivilegeRangeData) {
      this.lastEdmPrivilegeRangeData = {
        customer: this.edmRoleApi.doGetContactPrivilegeRangeData(),
        clue: this.lastEdmPrivilegeRangeData?.clue,
      };
    }
    if (cluePrivilegeRangeData) {
      this.lastEdmPrivilegeRangeData = {
        clue: this.edmRoleApi.doGetCluePrivilegeRangeData(),
        customer: this.lastEdmPrivilegeRangeData?.customer,
      };
    }
    console.log('[mail plus customer] role', this.lastEdmPrivilegeViewData, this.lastEdmPrivilegeRangeData);
  }

  doGetLastEdmPrivilegeViewData() {
    if (!this.lastEdmPrivilegeViewData) {
      this.doSetLastEdmPrivilegeData({ privilegeMap: new Map() });
    }
    return this.lastEdmPrivilegeViewData;
  }

  // 分页获取远端我的客户列表
  async doGetCustomerListFromServer(params: CustomerListParams): Promise<ServerCustomerModel[]> {
    // 从服务端获取数据
    const viewRole = this.doGetLastEdmPrivilegeViewData()?.customer;
    if (!viewRole) {
      return [];
    }
    try {
      const url = this.systemApi.getUrl('getCustomerListPage');
      const res = await this.httpApi.post(url, params, {
        contentType: 'json',
      });
      const { success, data, error } = res.data || {};
      if (success && data) {
        const { companyList = [] } = data;
        return companyList;
      }
      console.error('[mail_plus_customer] doGetCustomerListFromServer error', error);
    } catch (e) {
      console.error('[mail_plus_customer] doGetCustomerListFromServer catch error', e);
    }
    return [];
  }

  async doSearchCustomerPage(keyword: string, pageSize = 20, page = 1): Promise<SearchCustomerPageRes> {
    if (!keyword) {
      return Promise.reject(new Error('[doSearchCustomerPage] keyword is null'));
    }
    const url = this.systemApi.getUrl('searchMyCustomer');
    const req = {
      page,
      page_size: pageSize,
      quickFilter: {
        relation: 'AND',
        subs: [
          {
            condition: {
              method: 'CONTAIN',
              value: keyword,
            },
            id: 'company_name',
            table: 'customer',
          },
        ],
      },
    };
    const { data } = await this.httpApi.post<GetMyCustomerSearchPageSeverRes>(url, req, {
      contentType: 'json',
    });
    if (data?.success && data.data) {
      const arr = (data.data.content || []).map(v => ({
        customerId: v.company_id,
        customerName: v.company_name,
        customerCreateTime: v.create_time || 0,
      }));
      return {
        data: arr,
        pageSize: data.data.page_size, // 页码大小
        pageNum: data.data.page, // 页码数
        totalSize: data.data.total_size, // 总命中数
        totalNum: data.data.total_page, // 总页数
      };
    }
    return Promise.reject(new Error('[doSearchCustomerPage] return error'));
  }

  async doSearchCustomerAndContact(keyword: string, module: SearchCustomerModule, limit = 300): Promise<SearchCustomerRes> {
    const result: SearchCustomerRes = {
      customerList: [],
      customerContactList: [],
    };
    // 先判断权限,如果有客户模块的权限，再去请求，否则直接返回空
    const lastEdmPrivilegeViewData = this.doGetLastEdmPrivilegeViewData();
    if (!(lastEdmPrivilegeViewData && lastEdmPrivilegeViewData.customer)) {
      return result;
    }
    if (keyword) {
      const url = this.systemApi.getUrl('searchMyCustomerAndContact');
      const req = {
        keyword,
        limit,
        module,
      };
      const { data } = await this.httpApi.post<GetMyCustomerSearchSeverRes>(url, req, {
        contentType: 'json',
      });
      if (data?.success && data.data) {
        const customerList = data.data.customer_list;
        if (Array.isArray(customerList) && customerList.length > 0) {
          result.customerList = customerList.map(v => ({
            customerId: String(v.company_id),
            customerName: v.company_name,
            customerCreateTime: v.create_time || 0,
          }));
        }
        const contactList = data.data.contact_list;
        if (Array.isArray(contactList) && contactList.length > 0) {
          result.customerContactList = contactList.map(v => ({
            customerId: String(v.company_id),
            contactId: String(v.contact_id),
            contactName: v.contact_name,
            contactEmail: v.contact_email,
            contactCreateTime: v.create_time || 0,
          }));
        }
      }
    }
    return result;
  }

  // 请求客户下的商机
  async doGetOpportunityByCompany(page = 1, size = 20, companyId: string, status?: number[]): Promise<OpportunityListRes> {
    if (!companyId) {
      return Promise.reject(new Error('[doGetOpportunityByCompany] company_id is null'));
    }
    try {
      const url = this.systemApi.getUrl('getOpportunityByCompany');
      const params: {
        page: number;
        size: number;
        company_id: string;
        status?: number[] | undefined;
      } = { page, size, company_id: companyId };
      if (Array.isArray(status) && status.length) {
        params.status = status;
      }
      const { data } = await this.httpApi.get(url, params);
      if (data?.success && data.data) {
        if (Array.isArray(data.data.content) && !!data.data.content.length) {
          const arr = data.data.content;
          return {
            data: arr,
            pageSize: data.data.page_size, // 页码大小
            pageNum: data.data.page, // 页码数
            totalSize: data.data.total_size, // 总命中数
            totalNum: data.data.total_page, // 总页数
          };
        }
        return {
          data: [],
          pageSize: data.data.page_size, // 页码大小
          pageNum: data.data.page, // 页码数
          totalSize: data.data.total_size, // 总命中数
          totalNum: data.data.total_page, // 总页数
        };
      }
      return {
        data: [],
        pageSize: 20, // 页码大小
        pageNum: 1, // 页码数
        totalSize: 0, // 总命中数
        totalNum: 0, // 总页数
      };
    } catch (error) {
      console.log('[doGetOpportunityByCompany] err:', error);
      return {
        data: [],
        pageSize: 20, // 页码大小
        pageNum: 1, // 页码数
        totalSize: 0, // 总命中数
        totalNum: 0, // 总页数
      };
    }
  }

  // 请求商机状态映射关系
  async doGetOpportunityStatus(): Promise<OpportunityStatusRes> {
    const url = this.systemApi.getUrl('getOpportunityStatus');
    const { data } = await this.httpApi.get<OpportunityStatusRes>(url, { table: 'customer_opportunity' });
    if (data?.success && data.data) {
      return data.data;
    }
    return Promise.reject(new Error('[doGetOpportunityByCompany] error'));
  }
  // 请求线索状态映射关系
  async doGetClueStatus(table: 'leads' | 'customer'): Promise<ClueStatusRes> {
    const url = this.systemApi.getUrl('getClueFieldInfo');
    const { data } = await this.httpApi.get(url, { table });
    if (data?.success && data.data) {
      if (data.data?.fields.length) {
        const result = {} as any;
        data.data?.fields.forEach((i: { field_id: string; config: string }) => {
          result[i.field_id as string] = JSON.parse(i.config)?.items || [];
        });
        return result as ClueStatusRes;
      } else {
        Promise.reject(new Error('[doGetClueStatus] error'));
      }
    }
    return Promise.reject(new Error('[doGetClueStatus] error'));
  }

  // 通过id分页方式获取联系人列表
  async doGetContactListByCompanyId(params: IGetContactListParams): Promise<IGetContactListReturn> {
    const { emailRole, ...data } = params;
    let res: IGetContactListReturn = {
      success: false,
      totalSize: 0,
      page: 1,
      data: [],
    };
    switch (emailRole) {
      case 'myCustomer':
      case 'colleagueCustomer':
        res = await this.doGetContactListFromCustomer(data);
        break;
      case 'openSeaCustomer':
        res = await this.doGetContactListFromOpenSea(data);
        break;
      // 线索是同一个接口
      case 'myClue':
      case 'colleagueClue':
      case 'openSeaClue':
        res = await this.doGetClueContactList(data);
        break;
      default:
        console.error(`暂不支持${emailRole}类型的查询`);
    }
    return res;
  }

  // 通过公海客户id分页方式获取联系人列表
  async doGetContactListFromOpenSea(params: Omit<IGetContactListParams, 'emailRole'>): Promise<IGetContactListReturn> {
    try {
      const { page = 1, pageSize = 10, id } = params;
      if (pageSize > 500) {
        throw new Error('最大只能500!!');
      }
      const url = this.systemApi.getUrl('getOpenSeaCustomerList');
      const reqParams = {
        condition: '',
        customer_open_sea_id: id,
        page,
        page_size: pageSize,
      };
      const res = await this.httpApi.post(url, reqParams, {
        contentType: 'json',
      });
      const { success, data, error, message } = res.data || {};
      if (success && data?.content) {
        if (Array.isArray(data.content)) {
          return {
            success: true,
            totalSize: data.total_size,
            page,
            data: data.content as ServerCustomerContactModel[],
          };
        }
      }
      console.error('🚀 ~ MailPlusCustomer ~ doGetContactListFromOpenSea ~ error:', error);
      return {
        success: false,
        totalSize: 0,
        data: [],
        message,
        error,
        page,
      };
    } catch (error) {
      console.error('🚀 ~ MailPlusCustomer ~ doGetContactListFromOpenSea ~ error:', error);
      return {
        success: false,
        totalSize: 0,
        page: 1,
        data: [],
        message: (error as Error)?.message,
      };
    }
  }

  // 通过客户id分页方式获取联系人列表
  async doGetContactListFromCustomer(params: Omit<IGetContactListParams, 'emailRole'>): Promise<IGetContactListReturn> {
    try {
      const { page = 1, pageSize = 10, id } = params;
      if (pageSize > 500) {
        throw new Error('最大只能500!!');
      }
      const url = this.systemApi.getUrl('getCompanyCustomerList');
      const reqParams = {
        company_id: id,
        search_request: {
          page,
          page_size: pageSize,
        },
      };
      const res = await this.httpApi.post(url, reqParams, {
        contentType: 'json',
      });
      const { success, data, code, message, total } = res.data || {};
      if (success && data) {
        if (Array.isArray(data)) {
          return {
            success: true,
            totalSize: total,
            page,
            data: data as ServerCustomerContactModel[],
          };
        }
      }
      console.error('🚀 ~ MailPlusCustomer ~ doGetContactListFromCustomer ~ error:', message);
      return {
        success: false,
        totalSize: 0,
        page,
        data: [],
        message,
        error: code as string,
      };
    } catch (error) {
      console.error('🚀 ~ MailPlusCustomer ~ doGetContactListFromCustomer ~ error:', error);
      return {
        success: false,
        totalSize: 0,
        page: 1,
        data: [],
        message: (error as Error)?.message,
      };
    }
  }

  // 通过线索id分页方式获取联系人列表
  async doGetClueContactList(params: Omit<IGetContactListParams, 'emailRole'>): Promise<IGetContactListReturn> {
    try {
      const { page = 1, pageSize = 10, id } = params;
      if (pageSize > 500) {
        throw new Error('最大只能500!!');
      }
      const url = this.systemApi.getUrl('getClueContactList');
      const reqParams = {
        leads_id: id,
        search_request: {
          page,
          page_size: pageSize,
        },
      };
      const res = await this.httpApi.post(url, reqParams, {
        contentType: 'json',
      });
      const { success, data, code, message, total } = res.data || {};
      if (success && data) {
        if (Array.isArray(data)) {
          return {
            success: true,
            totalSize: total,
            page,
            data: data as ServerCustomerContactModel[],
          };
        }
      }
      console.error('🚀 ~ MailPlusCustomer ~ doGetContactListFromCustomer ~ error:', message);
      return {
        success: false,
        totalSize: 0,
        page,
        data: [],
        message,
        error: code as string,
      };
    } catch (error) {
      console.error('🚀 ~ MailPlusCustomer ~ doGetContactListFromCustomer ~ error:', error);
      return {
        success: false,
        totalSize: 0,
        page: 1,
        data: [],
        message: (error as Error)?.message,
      };
    }
  }

  // 获取当前redux中展示的所有的邮件标签角色
  doGetDisplayEmailLabelMap(): Map<_ACCOUNT, Map<EMAIL, string>> {
    return this.displayEmailLabelMap;
  }

  // 设置当前redux中展示的邮件标签角色
  doUpdateDisplayEmailLabelMap(params: { email: string; _account: string; name?: string; action?: 'add' | 'delete' }) {
    const { email, _account, name = email, action = 'add' } = params;
    const emailMap = this.displayEmailLabelMap.get(_account) || new Map();
    if (action === 'add' && !emailMap.has(email)) {
      emailMap.set(email, name);
    } else if (action === 'delete' && emailMap.has(email)) {
      emailMap.delete(email);
    }
    this.displayEmailLabelMap.set(_account, emailMap);
  }

  // 获取读信页是否需要弹窗标记营销有效回复
  async doGetReplyMark(mid: string): Promise<{ visible: boolean }> {
    const url = this.systemApi.getUrl('EdmReplyMark');
    try {
      const res = await this.httpApi.get(
        url,
        { mid },
        {
          contentType: 'json',
        }
      );
      const { success, data } = res.data || {};
      if (success && data) {
        return { visible: data.visible || false };
      } else {
        return { visible: false };
      }
    } catch (error) {
      console.log('MailPlusCustomer doGetReplyMark error:', error);
      return { visible: false };
    }
  }
  // 读信页弹窗标记营销有效回复
  async doGetReplyMarkConfirm(mid: string, valid: boolean): Promise<any> {
    const url = this.systemApi.getUrl('EdmReplyMarkConfirm');
    const reqParams = {
      mid,
      valid,
    };
    try {
      const res = await this.httpApi.post(url, reqParams, {
        contentType: 'json',
      });
      return res;
    } catch (error) {
      console.log('MailPlusCustomer doGetReplyMarkConfirm error:', error);
    }
  }
}

const mailPlusCustomerApi: MailPlusCustomerApi = new MailPlusCustomer();

api.registerLogicalApi(mailPlusCustomerApi);

export default mailPlusCustomerApi;
