import moment from 'moment';
import type { GroupedFilter, SubFilter } from '@lxunit/app-l2c-crm';
import lodashGet from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import {
  AddressBookNewApi,
  QuickMarktingGroupType,
  GetGroupListParams,
  AssociateMarktingParam,
  AddGroup2GroupParams,
  TransferContact2GroupParmas,
  MarktingContactGroup,
  MarktingGroupPageInfo,
  QuickMarktingGroup,
  QuickMarktingGuideList,
  // IAddressBookGroupItem,
  IAddressBookCreateType,
  IAddressBookContactList,
  RecycleListReqV2,
  RecycleListResV2,
  BusinessContactVO,
  AddressBookApiRequestConfig,
} from '@/api/logical/address_book_new';
import { api } from '@/api/api';
// import { AddressBookGroupsParams } from '@/api/logical/address_book';

export class AddressBookNewApiImpl implements AddressBookNewApi {
  name = 'addressBookNewApiImpl';

  private http = api.getDataTransApi();

  // private systemApi = api.getSystemApi();
  systemApi = api.getSystemApi();

  private eventApi = api.getEventApi();

  private createTypeMap: Record<string, string> = {};

  init() {
    return this.name;
  }

  afterLoadFinish() {
    if (!process.env.BUILD_ISEDM) return this.name;
    const currentUser = this.systemApi.getCurrentUser();
    if (!currentUser) return this.name;
    this.initCreateTypeMap();
    return this.name;
  }

  private initCreateTypeMap() {
    this.getAllCreateTypeList().then(createTypeList => {
      createTypeList.forEach(item => {
        this.createTypeMap[item.id] = item.label;
      });
    });
  }

  private errorHandler(error: Error | any) {
    this.eventApi.sendSysEvent({
      auto: true,
      eventSeq: 0,
      eventName: 'error',
      eventLevel: 'error',
      eventData: {
        title: error?.message || error?.data?.message || '网络错误',
        content: '',
        popupType: 'toast',
        popupLevel: 'error',
      },
    });
  }

  private async get<T>(url: string, req?: any, config?: AddressBookApiRequestConfig): Promise<T> {
    try {
      const { data } = await this.http.get<T>(url, req, config);
      if (!data) {
        throw new Error('unknown');
      }
      if (!data.success) {
        throw data;
      }
      return data!.data as T;
    } catch (error) {
      const { toastError = true } = config || {};
      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  private async post<T>(url: string, body: any, config?: AddressBookApiRequestConfig): Promise<T> {
    config = {
      contentType: 'json',
      noEnqueue: false,
      ...(config || {}),
    };

    try {
      const { data } = await this.http.post<T>(url, body, config);

      if (!data) throw new Error('unknown');
      if (!data.success) throw data;

      return data!.data as T;
    } catch (error) {
      const { toastError = true, errorTitle } = config || {};

      toastError && this.errorHandler(errorTitle ? { message: errorTitle } : error);

      return Promise.reject(error);
    }
  }

  async getGroupList(params: Partial<GetGroupListParams>) {
    const url = this.systemApi.getUrl('getMarktingGroupList');
    return this.post<MarktingContactGroup[]>(url, params);
  }

  async getGroupListWithPage(params: GetGroupListParams) {
    const url = this.systemApi.getUrl('getMarktingGroupListWithPage');
    return this.post<
      {
        content: MarktingContactGroup[];
      } & MarktingGroupPageInfo
    >(url, params);
  }

  async createGroup(groupName: string) {
    const url = this.systemApi.getUrl('addMarktingGroup');
    return this.post<MarktingContactGroup>(url, {
      group_name: groupName,
    });
  }

  // 关联营销托管任务
  async associateEdm(params: AssociateMarktingParam[]) {
    const url = this.systemApi.getUrl('associateEdm');
    await this.post<unknown>(url, {
      associateList: params,
    });
  }

  // 将联系人添加到分组
  async addContact2Group(params: { contact_ids: number[]; target_group_ids: number[] }) {
    const url = this.systemApi.getUrl('addMarktingContact2Group');
    await this.post(url, params);
  }

  // 删除分组
  async deleteGroup(groupId: number) {
    const url = this.systemApi.getUrl('deleteMarktingGroup');
    await this.post(url, {
      group_id: groupId,
    });
  }

  async updateGroup(groupId: number, groupName: string) {
    const url = this.systemApi.getUrl('editMarktingGroup');
    await this.post(url, {
      group_id: groupId,
      group_name: groupName,
    });
  }

  // 批量将分组内添加到另外一个分组
  async addGroup2Group(params: AddGroup2GroupParams) {
    const url = this.systemApi.getUrl('addMarktingGroup2Group');
    await this.post(url, params);
  }

  // 转移分组
  async transferContact2Group(params: TransferContact2GroupParmas) {
    const url = this.systemApi.getUrl('transferMarktingContact2Groups');
    await this.post(url, params);
  }

  // 获取快捷营销列表
  getQuickMarktingList() {
    const url = this.systemApi.getUrl('getQuickMarktingList');
    return this.get<QuickMarktingGroup[]>(url);
  }
  // 获取快捷营销列表对应的数量
  getQuickMarktingGroupCount(params: { type: QuickMarktingGroupType; groupId: number }) {
    console.log('[addressBookNewApiImpl] getQuickMarktingGroupCount', params);

    const url = this.systemApi.getUrl('getQuickMarktingGroupCount');
    return this.get<number>(url, {
      type: params.type,
      group_id: params.groupId,
    });
  }

  getQuickMarktingGuideList(params: { groupId: number }) {
    const url = this.systemApi.getUrl('getQuickMarktingGuide');
    return this.get<QuickMarktingGuideList>(url, {
      group_id: params.groupId,
    });
  }

  // 创建快捷营销分群
  async createQuickMarktingGroup(parmas: Pick<QuickMarktingGroup, 'group_filter_settings' | 'group_name'>) {
    console.log('[addressBookNewApiImpl] createQuickMarktingGroup', parmas);
    const url = this.systemApi.getUrl('createQuickMarktingGroup');
    return this.post<number>(url, parmas);
  }

  // 删除快捷营销分群
  async deleteQuickMarktingGroup(parmas: { groupId: number }) {
    const url = this.systemApi.getUrl('deleteQuickMarktingGroup');
    await this.get(url, {
      group_id: parmas.groupId,
    });
  }

  // 取消绑定
  async cancelGroupEdm(groupIds: number[]) {
    const url = this.systemApi.getUrl('cancelGroupEdm');
    await this.post(url, {
      group_ids: groupIds,
    });
  }

  // 回收站列表
  async getNewAddressRecycleList(params: Partial<RecycleListReqV2>) {
    const url = this.systemApi.getUrl('addressRecycleList');
    return this.get<RecycleListResV2>(url, params);
  }

  // 清空回收站
  async emptyAddressRecycle(): Promise<void> {
    return this.post(this.systemApi.getUrl('emptyAddressRecycle'), {});
  }

  // 恢复回收站数据
  async recoverAddressRecycle(recycleIds: number[]) {
    const url = this.systemApi.getUrl('recoverAddressRecycle');
    await this.post(url, {
      recycle_contact_ids: recycleIds,
    });
  }

  // 彻底删除回收站数据
  async deleteAddressRecycle(recycleIds: number[]) {
    const url = this.systemApi.getUrl('deleteAddressRecycle');
    await this.post(url, {
      recycle_contact_ids: recycleIds,
    });
  }

  // 回收站联系人详情
  async getRecycleDetail(recycleId: number) {
    const url = this.systemApi.getUrl('getAddressRecycleDetail');
    return this.get<BusinessContactVO>(url, { recycle_contact_id: recycleId });
  }

  async getAllContactGroupList(filterDefaultGroup = true): Promise<Array<MarktingContactGroup>> {
    return this.getGroupList({ page: 1, page_size: 100 }).then(groupList => (!filterDefaultGroup ? groupList : groupList.filter(item => item.group_type !== 0)));
  }

  async getAllCreateTypeList(): Promise<Array<IAddressBookCreateType>> {
    return this.get(this.systemApi.getUrl('addressBookGetConfigDictionary')).then((res: any) => {
      const createTypes = res.contact_create_type || [];
      return createTypes.map((createType: any) => ({
        id: createType.value,
        label: createType.label,
      }));
    });
  }

  // 查询筛选条件下的Email
  async getMarktingFiltedEmails(params: Partial<{ groupedFilter: GroupedFilter }>, config?: AddressBookApiRequestConfig) {
    const url = this.systemApi.getUrl('getEdmContactList');
    const reqConfig = config || {};

    const groupedFilter = params.groupedFilter ? cloneDeep(params.groupedFilter) : { relation: 'AND', subs: [] as SubFilter[] };

    const list = await this.post<BusinessContactVO[]>(
      url,
      {
        groupedFilter,
      },
      reqConfig
    );

    if (lodashGet(list, 'length', 0) > 0) {
      return list;
    }
    return [];
  }

  async getGroupCountByFilter(params: Partial<{ filter: GroupedFilter }>) {
    const url = this.systemApi.getUrl('getGroupCountByFilter');

    const groupedFilter = params.filter ? cloneDeep(params.filter) : { relation: 'AND', subs: [] as SubFilter[] };

    const count = await this.post<number>(url, {
      filter: groupedFilter,
      functionType: 'LEADS_CONTACT',
      viewType: 'MY_LEADS_CONTACT',
    });
    return count;
  }

  static getMarktingHistory(item: any) {
    if (!item.edm_email_statistic) {
      return '';
    }
    let result = '';
    const edmEmailStatistic = item.edm_email_statistic;
    if (edmEmailStatistic.delivery_count && edmEmailStatistic.delivery_count > 0) {
      result = `发送过${edmEmailStatistic.send_count}，送达过${edmEmailStatistic.delivery_count}次`;
      return result;
    }
    if (edmEmailStatistic.send_count && edmEmailStatistic.send_count > 0) {
      return '未送达';
    }
    return '未营销';
  }

  static computeMarktingHistory(item: any, defaultMailMarkingHistoryStr: string) {
    let result = '';
    const edmEmailStatistic = item.edm_email_statistic;
    if (edmEmailStatistic.delivery_count && edmEmailStatistic.delivery_count > 0) {
      result = `发送过${edmEmailStatistic.send_count}，送达${edmEmailStatistic.delivery_count}次`;
      return result;
    }
    if (edmEmailStatistic.send_count && edmEmailStatistic.send_count > 0) {
      return '未送达';
    }
    return defaultMailMarkingHistoryStr;
  }

  async searchContactList(inParam: any): Promise<IAddressBookContactList> {
    const param = inParam ? cloneDeep(inParam) : inParam;
    if (param) {
      const defaultEmailFilter = {
        id: 'email',
        condition: {
          method: 'IS_NOT_EMPTY',
          value: '',
        },
        table: 'leads_contact',
      };
      if (param.groupFilter && param.groupFilter.subs) {
        param.groupedFilter = param.groupFilter;
        delete param.groupFilter;
      } else {
        param.groupedFilter = undefined;
      }
      if (!param.quickFilter || !param.quickFilter.subs) {
        param.quickFilter = {
          relation: 'AND',
          subs: [defaultEmailFilter],
        };
      }
      // } else {
      //   param.quickFilter.subs.push(defaultEmailFilter);
      // }
      if (!param.filter || !param.filter.subs) {
        param.filter = {
          relation: 'AND',
          subs: [defaultEmailFilter],
        };
      } else {
        param.filter.subs.push(defaultEmailFilter); // 默认过滤掉邮箱为空的联系人
      }
      const defaultSort = {
        field_id: 'contact_id',
        reverse: true,
      };
      if (!param.sort) {
        param.sort = defaultSort;
      }
    }
    return this.post(this.systemApi.getUrl('addressBookGetMyContactList'), param).then((res: any) => {
      const dataList = res.content || [];
      const timeFormatStr = 'YYYY-MM-DD HH:mm:ss';
      return {
        ascFlag: res.asc_flag as boolean,
        totalCount: res.total_size as number,
        page: res.page as number,
        pageSize: res.page_size as number,
        list: dataList.map((item: any) => {
          const defaultMailMarkingHistoryStr = '未营销';
          const mailMarketingHistoryStr = item.edm_email_statistic
            ? AddressBookNewApiImpl.computeMarktingHistory(item, defaultMailMarkingHistoryStr)
            : defaultMailMarkingHistoryStr;
          let mailMarketHistoryStatus = '';
          if (mailMarketingHistoryStr) {
            if (mailMarketingHistoryStr !== defaultMailMarkingHistoryStr) {
              if (mailMarketingHistoryStr.includes('发送过')) {
                mailMarketHistoryStatus = 'success';
              }
              if (mailMarketingHistoryStr.includes('未送达')) {
                mailMarketHistoryStatus = 'warn';
              }
            }
          }

          const newItem = {
            ...item,
            email: item.email,
            contactId: Number(item.contact_id),
            contactName: item.contact_name,
            groupNames:
              item.groups && item.groups.length
                ? item.groups.map((groupItem: any) => ({
                    groupId: groupItem.id,
                    groupName: groupItem.group_name,
                  }))
                : [],
            mailMarketHistoryStatus: mailMarketHistoryStatus as 'success' | 'warn' | '',
            mailMarketingHistory: mailMarketingHistoryStr,
            area: item.area && item.area.length ? item.area.filter((item: string) => item).join('/') : '',
            companyName: item.leads_company_name,
            job: item.job,
            createTypeId: item.create_type,
            createTypeName: this.createTypeMap[item.create_type] || '',
            createTime: item.create_time ? moment(item.create_time).format(timeFormatStr) : '',
            lastSendTime:
              item.edm_email_statistic && item.edm_email_statistic.latest_send_time ? moment(item.edm_email_statistic.latest_send_time).format(timeFormatStr) : '',
            leadsId: item.leads_id,
            leadsName: item.leads_name,
            sourcename: item.source_name,
            valid: !!item.valid,
          };
          return newItem;
        }),
      };
    });
  }

  async searchContactCount(param: any[]): Promise<number> {
    const defaultEmailFilter = {
      id: 'email',
      condition: {
        method: 'IS_NOT_EMPTY',
        value: '',
      },
      table: 'leads_contact',
    };
    const defaultSort = {
      field_id: 'contact_id',
      reverse: true,
    };
    const req = {
      page: 1,
      page_size: 20,
      sort: defaultSort,
      quickFilter: {
        relation: 'AND',
        subs: [...param, defaultEmailFilter],
      },
    };
    return this.post(this.systemApi.getUrl('addressBookGetMyContactCount'), req);
  }

  deleteContacts(req: { contact_ids: number[]; leads_id: number }): Promise<any> {
    return this.post(this.systemApi.getUrl('addressBookDeleteAddressBookContacts'), req);
  }

  batchDeleteContacts(req: { deleteList: Array<{ contact_id: number; leads_id: number }> }) {
    return this.post(this.systemApi.getUrl('addressBookBatchDeleteAddressBookContacts'), req);
  }

  asyncDeleteContactsByEmails(req: { emails: Array<string> }) {
    return this.post(this.systemApi.getUrl('addressBookDeleteContactsByEmails'), req);
  }

  addContactsToGroup(req: { contact_ids: Array<number>; target_group_ids: Array<number> }): Promise<void> {
    return this.post(this.systemApi.getUrl('addressBookAddContactToGroups'), req);
  }

  transferContactsToGroups(req: { contact_ids: Array<number>; target_group_ids: Array<number> }): Promise<void> {
    return this.post(this.systemApi.getUrl('addressBookTransferContactsToGroup'), req);
  }

  batchAddGroups(req: { groupNames: Array<string> }): Promise<MarktingContactGroup[]> {
    return Promise.all(req.groupNames.map(groupName => this.createGroup(groupName)));
  }
}

const addressBookNewApiImpl = new AddressBookNewApiImpl();

api.registerLogicalApi(addressBookNewApiImpl);

export default addressBookNewApiImpl;
