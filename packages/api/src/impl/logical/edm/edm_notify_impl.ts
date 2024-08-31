import { EdmNotifyApi, resNotifyConfig, reqNotify, QuotaNotifyRes, QuotaNotifyModalRes } from '@/api/logical/edm_notify';
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

export class EdmNotifyApiImpl implements EdmNotifyApi {
  name = apis.edmNotifyApiImpl;

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  init() {
    return this.name;
  }

  async get(url: string, req: any, config?: ApiRequestConfig, hideCodeMessage?: boolean) {
    const param = {
      ...req,
    };
    try {
      const { data } = await this.http.get(url, param, config);
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
      const { data } = await this.http.post(url, param, config as ApiRequestConfig);

      if (!data || !data.success) {
        if (!hideCodeMessage) {
          commontToast(data?.message || '网络错误');
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

  getNotifyConfig(): Promise<resNotifyConfig> {
    return this.get(this.systemApi.getUrl('getNotifyConfig'), null);
  }
  updateNotifyConfig(req: reqNotify): Promise<boolean> {
    return this.post(this.systemApi.getUrl('updateNotifyConfig'), req);
  }
  getQuotaNotify(moduleType: 'EDM'): Promise<QuotaNotifyRes> {
    return this.get(this.systemApi.getUrl('getQuotaNotify'), { moduleType });
  }
  getQuotaNotifyModal(moduleType: 'EDM', triggerLoc?: 'click' | 'createTask'): Promise<QuotaNotifyModalRes> {
    return this.get(this.systemApi.getUrl('getQuotaNotifyModal'), { moduleType, triggerLoc });
  }
}

const impl = new EdmNotifyApiImpl();
api.registerLogicalApi(impl);
export default impl;
