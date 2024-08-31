import {
  EdmVariableItem,
  FieldSettingApi,
  FieldTableList,
  ReqCheckDelete,
  ReqUpdateFieldOptions,
  ReqBatchAddVariable,
  EdmVariableSystemListRes,
} from '@/api/logical/fieldSetting';
import { api } from '../../../api/api';
import { ApiRequestConfig } from '../../../api/data/http';

const eventApi = api.getEventApi();

class FieldSettingImpl implements FieldSettingApi {
  name = 'fieldSettingApiImpl';

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

  getList(): Promise<FieldTableList[]> {
    return this.get(this.systemApi.getUrl('getFieldList')).then(data => data.table_config_list);
  }

  checkCanDelete(req: ReqCheckDelete): Promise<boolean> {
    return this.post(this.systemApi.getUrl('checkFieldOption'), req).then(data => data.code === 0);
  }

  updateFieldOptions(req: ReqUpdateFieldOptions): Promise<boolean> {
    return this.post(this.systemApi.getUrl('updateFieldOptions'), req);
  }

  getVariableList(): Promise<Array<EdmVariableItem>> {
    return this.get(this.systemApi.getUrl('getVariableList'));
  }

  addVariable(variableName: string): Promise<boolean> {
    return this.post(this.systemApi.getUrl('addVariable'), {
      variableName,
    });
  }

  batchAddVariable(req: ReqBatchAddVariable): Promise<boolean> {
    return this.post(this.systemApi.getUrl('batchAddVariable'), req);
  }

  delVariable(variableId: string): Promise<boolean> {
    return this.post(this.systemApi.getUrl('delVariabale'), {
      variableId,
    });
  }

  editVariable(variableId: string, variableName: string): Promise<boolean> {
    return this.post(this.systemApi.getUrl('editVariable'), {
      variableId,
      variableName,
    });
  }

  getVariableSystemList(): Promise<EdmVariableSystemListRes> {
    return this.get(this.systemApi.getUrl('getVariableSystemList'));
  }
}

const impl = new FieldSettingImpl();
api.registerLogicalApi(impl);
export default impl;
