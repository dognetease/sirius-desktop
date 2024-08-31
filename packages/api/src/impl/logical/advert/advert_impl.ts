import { ApiResponse, DataTransApi } from '@/api/data/http';
import { api } from '@/api/api';
import { AdvertApi, AdvertTrackInfo } from '@/api/logical/advert';
import { apis } from '@/config';
import { Api } from '@/api/_base/api';
import { SystemApi } from '@/api/system/system';
import { getOs } from './../../../utils/confOs';

export function advert_sign(version: string) {
  let fill = (function (tbl: string[]) {
    return function (num: number, n: number) {
      return 0 >= n + String(num).length ? num : (tbl[n] || (tbl[n] = Array(n + 1).join('0'))) + num;
    };
  })([]);
  const randomNum = new Date().getTime() * Math.random() * 10000;
  let key = `${Math.abs(Math.floor(randomNum))}`;
  let sum = 0;
  for (let i = 0; i < key.length; i++) {
    sum += parseInt(key.charAt(i));
  }
  sum += key.length;
  const fillSum = fill(sum, 3 - sum.toString().length);
  return version.toString() + key + fillSum;
}

// Doc: http://doc.hz.netease.com/pages/viewpage.action?pageId=319060531

class AdvertApiImpl implements AdvertApi {
  static readonly cur_platform = getOs() as string;

  name: string;
  httpApi: DataTransApi;
  systemApi: SystemApi;

  version: string = '1';

  constructor() {
    this.name = apis.advertApiImpl;
    this.httpApi = api.getDataTransApi();
    this.systemApi = api.getSystemApi();
  }

  init(): string {
    return this.name;
  }

  // getUrl(url: URLKey) {
  //     return this.systemApi.getUrl(url);
  // }
  parseResult(res: ApiResponse<any>) {
    return res.data;
  }
  catchError(reason: any) {
    return reason;
  }

  async fetchConfig(spaceCode: string) {
    const sign = advert_sign(this.version);
    // 跟 @张磊 确认过过了. 都走 _r 的逻辑
    const option = {
      advertSpaceCode: spaceCode,
      _r: sign,
    };
    const url = this.systemApi.getUrl('getAdvertResources');
    return this.httpApi.get(url, option).then(this.parseResult).catch(this.catchError);
  }
  async track(info: AdvertTrackInfo) {
    const _r = advert_sign(this.version);
    const url = info.trackUrl + '&_platform=' + AdvertApiImpl.cur_platform;
    if (url && url.length > 0) {
      return this.httpApi.post(url, { _r }).then(this.parseResult).catch(this.catchError);
    }
  }
}

const advertApiImpl: Api = new AdvertApiImpl();
api.registerLogicalApi(advertApiImpl);

export default advertApiImpl;
