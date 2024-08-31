import { api } from '@/api/api';
import { DataTransApi, ResponseData } from '@/api/data/http';
import {
  AddSalesPitchModel,
  DeleteSalesPitchModel,
  EditSalesPitchModel,
  ReqParamsSalesPitchList,
  ResSalesPitchItem,
  ResSalesPitchListItem,
  SalesPitchApi,
  SalesPitchConfig,
  SalesPitchDataMap,
  SalesPitchModel,
  SearchSalesPitchParams,
  SortSalesPitchParams,
} from '@/api/logical/salesPitch';
import { apis, inWindow } from '@/config';
import { SystemApi } from '@/api/system/system';
import { DataStoreApi } from '@/api/data/store';
import { salesPitchHelper } from '@/api/util/sales_pitch_helper';

class SalesPitchImplApi implements SalesPitchApi {
  name: string;

  static LOCAL_SETTING_KEY = 'SALES_PITCH_SETTING';

  static ID_SEP = '@#@';

  private httpApi: DataTransApi;

  private systemApi: SystemApi;

  private storeApi: DataStoreApi;

  constructor() {
    this.name = apis.salesPitchApiImpl;
    this.httpApi = api.getDataTransApi();
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
  }

  init(): string {
    return this.name;
  }

  // 获取话术数据
  async getSalesPitchData(params: ReqParamsSalesPitchList): Promise<SalesPitchDataMap> {
    const { stages = [], type = 'ALL' } = params;
    const url = this.systemApi.getUrl('getSalesPitchList');
    const reqParams = { stages, type };
    const { data } = await this.httpApi.get<ResSalesPitchListItem[]>(url, reqParams);
    const dataMap: SalesPitchDataMap = salesPitchHelper.genDefaultPitchDataMap();

    if (data?.success && Array.isArray(data?.data)) {
      const list = data.data;
      list.forEach(v => {
        if (dataMap[v.stage]) {
          dataMap[v.stage] = v.discourseList.map(it => ({
            ...it,
            cardId: salesPitchHelper.genSalesPitchCardId({
              stageId: it.discourseStage,
              type: it.type,
              id: it.id,
            }),
          }));
        }
      });
    }
    return dataMap;
  }

  // 查询话术库配置
  async getSalesPitchConfig(): Promise<SalesPitchConfig> {
    const url = this.systemApi.getUrl('getSalesConfig');
    const { data } = await this.httpApi.get<SalesPitchConfig>(url);
    const result = {
      showEnterprise: true,
    };
    console.log('getSalesPitchConfig', data);
    if (data?.success && data?.data) {
      result.showEnterprise = data.data.showEnterprise;
    }
    await this.setLocalSalesPitchConfig(result);
    return result;
  }

  // 查询本地话术库配置
  getLocalSalesPitchConfig(): SalesPitchConfig {
    if (!inWindow()) {
      return { showEnterprise: true };
    }
    const res = this.storeApi.getSync(SalesPitchImplApi.LOCAL_SETTING_KEY);
    if (res.suc && res.data) {
      try {
        const localSetting: SalesPitchConfig = JSON.parse(res.data);
        if (localSetting) {
          return localSetting;
        }
        return { showEnterprise: true };
      } catch (e) {
        return { showEnterprise: true };
      }
    }
    return { showEnterprise: true };
  }

  // 修改话术库配置
  async setSalesPitchConfig(params: SalesPitchConfig): Promise<boolean> {
    const url = this.systemApi.getUrl('setSalesConfig');
    const { data } = await this.httpApi.post<SalesPitchConfig>(
      url,
      {
        showEnterprise: params.showEnterprise,
      },
      {
        contentType: 'json',
      }
    );
    return !!data?.success;
  }

  // 修改本地话术库配置
  async setLocalSalesPitchConfig(newConfig: SalesPitchConfig): Promise<void> {
    this.storeApi.put(SalesPitchImplApi.LOCAL_SETTING_KEY, JSON.stringify(newConfig)).then();
  }

  // 新增话术
  async addSalesPitch(params: AddSalesPitchModel): Promise<ResponseData> {
    const url = this.systemApi.getUrl('addSalesPitch');
    const { data } = await this.httpApi.post(url, params, {
      contentType: 'json',
    });
    return data as ResponseData;
  }

  // 编辑话术，todo，等服务端新接口
  async editSalesPitch(params: EditSalesPitchModel): Promise<SalesPitchModel> {
    const baseUrl = this.systemApi.getUrl('editSalesPitch');
    const url = this.httpApi.buildUrl(baseUrl, {
      id: params.id,
      type: params.oldType,
    });
    const { data } = await this.httpApi.post(
      url,
      {
        updateToContent: params.discourseContent,
        updateToScene: params.discourseScene,
        updateToStage: params.discourseStage,
        updateToType: params.type,
      },
      {
        contentType: 'json',
      }
    );
    return data?.success && data?.data;
  }

  // 话术搜索
  async searchSalesPitch(params: SearchSalesPitchParams): Promise<SalesPitchDataMap> {
    const url = this.systemApi.getUrl('searchSalesPitch');
    const { data } = await this.httpApi.get<ResSalesPitchItem[]>(url, params);
    const dataMap: SalesPitchDataMap = salesPitchHelper.genDefaultPitchDataMap();
    if (data?.success && data?.data) {
      if (data?.success && Array.isArray(data?.data)) {
        data.data.forEach(v => {
          if (dataMap[v.discourseStage]) {
            const it = {
              ...v,
              cardId: salesPitchHelper.genSalesPitchCardId({
                stageId: v.discourseStage,
                type: v.type,
                id: v.id,
              }),
            };
            dataMap[v.discourseStage].push(it);
          }
        });
      }
    }
    return dataMap;
  }

  // 话术排序
  async sortSalesPitch(params: SortSalesPitchParams): Promise<boolean> {
    const url = this.systemApi.getUrl('sortSalesPitchList');
    const { data } = await this.httpApi.post(url, params, {
      contentType: 'json',
    });
    return !!data?.success;
  }

  // 删除话术
  async deleteSalesPitch(params: DeleteSalesPitchModel): Promise<boolean> {
    const url = this.systemApi.getUrl('deleteSalesPitch');
    const { data } = await this.httpApi.post(url, params, {
      contentType: 'json',
    });
    return !!data?.success;
  }
}

const salesPitchImplApi: SalesPitchApi = new SalesPitchImplApi();

api.registerLogicalApi(salesPitchImplApi);

export default salesPitchImplApi;
