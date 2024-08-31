import {
  AutoMarketApi,
  RequestAutoMarketTaskList,
  ResponseAutoMarketTaskList,
  AutoMarketTaskDetail,
  ResponseAutoMarketCustomerUpdateFields,
  GroupAutoMarketTaskRes,
  AutoMarketHolidayInfo,
  AutoMarketEdmTaskList,
  AddressContactRes,
  UniCustomerFollowStatusRes,
} from '@/api/logical/auto_market';
import { api } from '@/api/api';
import { ApiRequestConfig } from '@/api/data/http';

interface AutoMarketApiRequestConfig extends ApiRequestConfig {
  toastError?: boolean;
}

export class AutoMarketApiImpl implements AutoMarketApi {
  name = 'autoMarketApiImpl';

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  private eventApi = api.getEventApi();

  init() {
    return this.name;
  }

  errorHandler(error: Error | any) {
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

  async get(url: string, req?: any, config?: AutoMarketApiRequestConfig) {
    try {
      const { data } = await this.http.get(url, req, config);

      if (!data) throw {};
      if (!data.success) throw data;

      return data.data;
    } catch (error: Error | any) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  async post(url: string, body: any, config?: AutoMarketApiRequestConfig) {
    config = {
      contentType: 'json',
      noEnqueue: false,
      ...(config || {}),
    };

    try {
      const { data } = await this.http.post(url, body, config);

      if (!data) throw {};
      if (!data.success) throw data;

      return data.data;
    } catch (error: Error | any) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  async delete(url: string, req: any, config?: AutoMarketApiRequestConfig) {
    try {
      const { data } = await this.http.delete(url, req, config);

      if (!data) throw {};
      if (!data.success) throw data;

      return data.data;
    } catch (error: Error | any) {
      const { toastError = true } = config || {};

      toastError && this.errorHandler(error);

      return Promise.reject(error);
    }
  }

  editTask(req: AutoMarketTaskDetail): Promise<{ taskId: string }> {
    return this.post(this.systemApi.getUrl('editAutoMarketTask'), req);
  }

  getCustomerUpdateFields(): Promise<ResponseAutoMarketCustomerUpdateFields> {
    return this.get(this.systemApi.getUrl('getAutoMarketCustomerUpdateFields'));
  }

  getTaskList(req: RequestAutoMarketTaskList): Promise<ResponseAutoMarketTaskList> {
    return this.get(this.systemApi.getUrl('getAutoMarketTaskList'), req);
  }

  getTaskDetail(req: { taskId: string }): Promise<AutoMarketTaskDetail> {
    return this.get(this.systemApi.getUrl('getAutoMarketTaskDetail'), req);
  }

  getTaskStats(req: { taskId: string; actionId: string }): Promise<any> {
    return this.get(this.systemApi.getUrl('getAutoMarketTaskStats'), req);
  }

  deleteTaskDetail(req: { taskId: string }): Promise<any> {
    return this.delete(this.systemApi.getUrl('deleteAutoMarketTaskDetail'), req);
  }

  updateTaskStatus(req: { taskId: string }): Promise<any> {
    return this.post(this.systemApi.getUrl('updateAutoMarketTaskStatus'), req, {
      contentType: 'form',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    });
  }

  async getAutoMarketTaskByGroup(groupId: string): Promise<GroupAutoMarketTaskRes> {
    return this.get(this.systemApi.getUrl('getAutoMarketTaskByGroup'), { groupId });
  }

  getAutoMarketHolidayInfo(): Promise<AutoMarketHolidayInfo> {
    return this.get(this.systemApi.getUrl('getAutoMarketHolidayInfo'));
  }

  getAutoMarketEdmTask(edmEmailId: string | number): Promise<AutoMarketEdmTaskList> {
    return this.get(this.systemApi.getUrl('getAutoMarketEdmTask'), { edmEmailId });
  }

  getAddressContactForAutomarket(keyIds: string[], addressListType: string): Promise<AddressContactRes> {
    return this.get(this.systemApi.getUrl('getAddressContactForAutomarket'), { keyIds, addressListType });
  }

  getUniCustomerFollowStatus(): Promise<UniCustomerFollowStatusRes> {
    return this.get(this.systemApi.getUrl('getUniCustomerFollowStatus'));
  }

  setTaskTemplateStatus(taskId: string, template: boolean): Promise<void> {
    return this.post(this.systemApi.getUrl('setTaskTemplateStatus'), { taskId, template }, { contentType: 'form' });
  }

  saveByTemplate(templateTaskId: string, taskObjectInfo: any, objectRealName: string): Promise<{ taskId: string }> {
    return this.post(this.systemApi.getUrl('saveByTemplate'), { templateTaskId, taskObjectInfo, objectRealName });
  }

  getAutomarketTemplateList(req: RequestAutoMarketTaskList): Promise<ResponseAutoMarketTaskList> {
    return this.get(this.systemApi.getUrl('getAutomarketTemplateList'), req);
  }
}

const autoMarketApiImpl = new AutoMarketApiImpl();

api.registerLogicalApi(autoMarketApiImpl);

export default autoMarketApiImpl;
