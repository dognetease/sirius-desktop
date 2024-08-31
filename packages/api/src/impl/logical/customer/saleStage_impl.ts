import { SaleStageApi, SaleStageTableList, StageItem } from '@/api/logical/saleStage';
import { api } from '../../../api/api';
import { ApiRequestConfig } from '../../../api/data/http';

const eventApi = api.getEventApi();

class SaleStageImpl implements SaleStageApi {
  name = 'saleStageApiImpl';

  private http = api.getDataTransApi();

  private systemApi = api.getSystemApi();

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

  async post(url: string, body: any, config?: ApiRequestConfig) {
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

  getList(): Promise<SaleStageTableList> {
    return this.get(this.systemApi.getUrl('getSaleStageList')).then(data => data.sale_stage_list);
  }

  addStage(req: StageItem): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addStage'), req);
  }

  updateStage(req: StageItem): Promise<boolean> {
    return this.post(this.systemApi.getUrl('updateStage'), req);
  }

  deleteStage(req: StageItem): Promise<boolean> {
    return this.post(this.systemApi.getUrl('deleteStage'), req);
  }

  updateOrderList(req: SaleStageTableList): Promise<boolean> {
    return this.post(this.systemApi.getUrl('updateOrderList'), { stages_order: req });
  }

  setDealStage(req: StageItem): Promise<boolean> {
    return this.post(this.systemApi.getUrl('setDealStage'), req);
  }
}

const impl = new SaleStageImpl();
api.registerLogicalApi(impl);
export default impl;
