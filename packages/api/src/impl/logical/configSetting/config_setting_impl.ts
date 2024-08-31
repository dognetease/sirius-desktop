import { apis } from '../../../config';
import { api } from '../../../api/api';
import { SystemApi } from '../../../api/system/system';
import { Api } from '../../../api/_base/api';
import { ConfigSettingApi, deviceInfo, DeviceListReq } from '../../../api/logical/configSetting';
import { DataTransApi } from '../../../api/data/http';
import { util } from '../../../api/util/index';

class ConfigSettingApiImpl implements ConfigSettingApi {
  name: string;

  private systemApi: SystemApi;

  private http: DataTransApi;

  constructor() {
    this.name = apis.configSettingApiImpl;
    this.systemApi = api.getSystemApi();
    this.http = api.getDataTransApi();
  }

  init(): string {
    return this.name;
  }

  private getCorpCommonRequestParams(): { domain: string; uid: string } {
    const currentUser = this.systemApi.getCurrentUser();
    return {
      domain: currentUser?.domain as string,
      uid: currentUser?.id as string,
    };
  }

  async doDeleteDevice(deviceId: string, deviceProduct?: string): Promise<boolean> {
    const deviceInfo = await this.systemApi.getDeviceInfo();
    const isCorpMailMode = this.systemApi.getIsCorpMailMode();
    const urlKey = isCorpMailMode ? 'corpDeleteDevice' : 'deleteDevice';
    const deviceParams = {
      product: deviceInfo.p,
      deviceId,
      dev_product: deviceProduct || null,
    };

    let requestParams;
    if (isCorpMailMode) {
      const currentUser = this.systemApi.getCurrentUser();
      requestParams = { ...deviceParams, ...this.getCorpCommonRequestParams(), ...{ sid: currentUser?.sessionId } };
    } else {
      requestParams = deviceParams;
    }

    const { data } = await this.http.post(this.systemApi.getUrl(urlKey), requestParams);
    return Boolean(data?.result.suc);
  }

  async doGetDeviceList(): Promise<deviceInfo[]> {
    const deviceInfo = await this.systemApi.getDeviceInfo();
    const isCorpMail = this.systemApi.getIsCorpMailMode();
    const urlKey = isCorpMail ? 'corpGetDeviceList' : 'getDeviceList';
    const url = this.systemApi.getUrl(urlKey);

    const params: DeviceListReq = Object.assign(deviceInfo, {
      lastLoginTime: util.dateFormat(),
      pageSize: '100',
      product: deviceInfo.p === 'web' ? 'sirius' : deviceInfo.p,
    }) as unknown as DeviceListReq;
    let requestParams;
    if (isCorpMail) {
      const currentUser = this.systemApi.getCurrentUser();
      requestParams = Object.assign(params, { sid: currentUser?.sessionId }, this.getCorpCommonRequestParams());
    } else {
      requestParams = params;
    }

    const { data } = await this.http.get(url, requestParams);
    return data?.result.suc ? data.result.loginDeviceList : [];
  }
}

const configSettingApiImpl: Api = new ConfigSettingApiImpl();
api.registerLogicalApi(configSettingApiImpl);
export default configSettingApiImpl;
