import { api } from '../../../api/api';
import { ApiRequestConfig } from '../../../api/data/http';
import {
  EdmProductDataApi,
  RequestProductClickData,
  ResponseProductClickData,
  RequestProductAnalyticsData,
  ResponseProductAnalyticsData,
  RequestCustomerClueInfo,
  ResponseCustomerClueInfo,
  RequestAllTaskProductClickData,
  ResponseAllTaskProductClickData,
  RequestProductViewData,
  ResponseProductViewData,
} from '../../../api/logical/edm_product_data';
import { apis } from '../../../config';

const eventApi = api.getEventApi();
const storageApi = api.getDataStoreApi();
const GrayPath = 'sirius-it-gray';
const GrayRuleName = 'default';
class EdmProductDataImpl implements EdmProductDataApi {
  name = apis.edmProductDataImpl;

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

  async get(url: string, req: any, config?: ApiRequestConfig) {
    try {
      const { data } = await this.http.get(url, req, config);
      if (!data || !data.success) {
        if (data?.message && data.code === 40101) {
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
      if (res.status >= 500 && res.status < 600) {
        eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: '服务器没有响应，请稍后再试',
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
        if (data?.message && data.code === 40101) {
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
      if (res.status >= 500 && res.status < 600) {
        eventApi.sendSysEvent({
          eventSeq: 0,
          eventName: 'error',
          eventLevel: 'error',
          eventData: {
            title: '服务器没有响应，请稍后再试',
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

  // 数据统计 - 产品数据
  getEdmProductClickData(req: RequestProductAnalyticsData): Promise<ResponseProductAnalyticsData> {
    return this.get(this.systemApi.getUrl('getEdmProductClickData'), req);
  }

  // 任务详情 - 产品点击数
  getEdmTaskClickData(req: RequestProductClickData): Promise<ResponseProductClickData> {
    return this.get(this.systemApi.getUrl('getEdmTaskClickData'), req);
  }

  // 获取留资列表
  getEdmCustomerClueInfo(req: RequestCustomerClueInfo): Promise<ResponseCustomerClueInfo> {
    return this.post(this.systemApi.getUrl('getEdmCustomerClueInfo'), req.clueIds);
  }

  // 站点潜在客户列表
  getAllTaskProductClickData(req: RequestAllTaskProductClickData): Promise<ResponseAllTaskProductClickData> {
    return this.get(this.systemApi.getUrl('getAllTaskProductClickData'), req);
  }

  getProductViewData(req: RequestProductViewData): Promise<ResponseProductViewData> {
    return this.get(this.systemApi.getUrl('getProductViewData'), req);
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
}

const edmProductDataImpl = new EdmProductDataImpl();
api.registerLogicalApi(edmProductDataImpl);
export default edmProductDataImpl;
