import { EdmMenusApi } from '@/api/logical/edm_menu';
import { api } from '@/api/api';
import { ApiRequestConfig } from '@/api/data/http';

const eventApi = api.getEventApi();

const commonToast = (message?: string) => {
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

export class EdmMenusApiImpl implements EdmMenusApi {
  name = 'edmMenusApiImpl';

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
          commonToast(data?.message || '网络错误');
        }
        return Promise.reject(data?.message);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        commonToast();
      }
      if (res.status == 400) {
        commonToast(res.data?.message);
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
          commonToast(data?.message || '网络错误');
        }
        return Promise.reject(data);
      }
      return data.data;
    } catch (res: any) {
      if (res.status >= 500 && res.status < 600) {
        commonToast();
      }
      if (res.status == 400) {
        commonToast(res.data?.message);
      }
      // 没有返回值时 data为空
      if (res.status == 429) {
        commonToast(res.statusText || '请求次数超出限制');
      }
      return Promise.reject(res.data);
    }
  }

  getAllPinnedMenus(req: { productId: string; productVersionId: string }) {
    return this.get(this.systemApi.getUrl('edmAllUsefulMenu'), {
      ...req,
      lan:
        {
          zh: 'zh_CN',
          en: 'en_US',
          'zh-trad': 'zh_TW',
        }[this.systemApi.getSystemLang()] || 'zh_CN',
    }).then(data => {
      return data.menuItems;
    });
  }

  updatePinnedMenus(req: { productId: string; productVersionId: string; usefulMenuLabels: string[] }) {
    return this.post(this.systemApi.getUrl('edmUpdateUsefulMenu'), req);
  }

  getPinnedMenus(req: { productId: string; productVersionId: string }) {
    return this.get(this.systemApi.getUrl('edmUsefulMenu'), {
      ...req,
      lan:
        {
          zh: 'zh_CN',
          en: 'en_US',
          'zh-trad': 'zh_TW',
        }[this.systemApi.getSystemLang()] || 'zh_CN',
    }).then(data => {
      return data.usefulMenuItems;
    });
  }
}

const edmMenusApiImpl = new EdmMenusApiImpl();
api.registerLogicalApi(edmMenusApiImpl);
export default edmMenusApiImpl;
