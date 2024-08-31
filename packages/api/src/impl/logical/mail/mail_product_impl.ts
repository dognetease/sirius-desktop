import {
  WaimaoProductListReq,
  ProductCommonRes,
  MailProductApi,
  WaimaoProductTableReq,
  ProductTableRes,
  ProductLinksReq,
  ProductLinksRes,
} from '@/api/logical/mail_product';
import { apis } from '@/config';
import { SystemApi } from '@/api/system/system';
import { DataTransApi, ApiRequestConfig } from '@/api/data/http';
import { api } from '@/api/api';
import { Api } from '@/api/_base/api';

class MailProductImplApi implements MailProductApi {
  name: string;

  private systemApi: SystemApi;

  private http: DataTransApi;

  constructor() {
    this.name = apis.mailProductImplApi;
    this.systemApi = api.getSystemApi();
    this.http = api.getDataTransApi();
  }

  init(): string {
    return this.name;
  }

  // eslint-disable-next-line class-methods-use-this
  async handlePromise(promise: Promise<any>): Promise<ProductCommonRes> {
    try {
      const res = await promise;
      const { data } = res.data;
      if (data) {
        return data;
      } else {
        return { totalCount: 0 };
      }
    } catch (e: any) {
      console.log('e====>', e);
      return {
        error: true,
      };
    }
  }

  async getWaimaoProductList(req: WaimaoProductListReq): Promise<ProductCommonRes> {
    if (!process.env.BUILD_ISEDM) {
      return Promise.resolve({});
    }
    const url = this.systemApi.getUrl('getWaimaoProductList');
    const res = await this.handlePromise(this.http.get(url, req));
    return res;
  }

  async getWaimaoProductTable(req: WaimaoProductTableReq): Promise<ProductTableRes> {
    const url = this.systemApi.getUrl('getWaimaoProductTable');
    return this.http.get(url, req).then(res => {
      try {
        if (res.data?.data) {
          return res.data.data;
        }
        return {
          error: true,
        };
      } catch (e) {
        console.log('e====>', e);
        return {
          error: true,
        };
      }
    });
  }

  /**
   * 外贸情况下获取普通邮件插入商品信息后跳转的path
   * @param req
   * @returns
   */
  async genProductLinks(req: ProductLinksReq): Promise<ProductLinksRes> {
    const config: ApiRequestConfig = {
      contentType: 'json',
    };
    const url = this.systemApi.getUrl('genProductLinks');
    const res = await this.http.post(url, req, config).catch(() => ({ data: { data: [] } }));

    if (res.data?.data) {
      return res.data.data;
    }
    return [];
  }
}

const mailProductApiImpl: Api = new MailProductImplApi();

api.registerLogicalApi(mailProductApiImpl);

export default mailProductApiImpl;
