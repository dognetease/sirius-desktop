import {
  TemplateListReq,
  TemplateDetailReq,
  SaveTemplateReq,
  DeleteTemplateReq,
  TemplateUseTimeReq,
  TemplateCommonRes,
  TemplateDetail,
  TemplateByIdDetail,
  MailTemplateApi,
  WaimaoRecommendTemplateListReq,
  WaimaoRecommendTemplateTag,
  TemplateType,
  TemplateTagIdList,
  SaveOrUpdateTagReq,
  TemplateConditionRes,
  GetTemplateListReq,
  GetTemplateListRes,
  TemplateSearchReq,
  TemplateSearchRes,
  TemplateQuertLimitRes,
  GetTemplateTopReq,
  GetTemplateTopRes,
} from '@/api/logical/mail_template';
import { apis } from '@/config';
import { SystemApi } from '@/api/system/system';
import { DataTransApi } from '@/api/data/http';
import { api } from '@/api/api';
import { Api } from '@/api/_base/api';

// import { HtmlApi, MailConfApi, ResponseSignature } from '../../..';

class MailTemplateImplApi implements MailTemplateApi {
  name: string;

  private systemApi: SystemApi;

  private http: DataTransApi;

  constructor() {
    this.name = apis.mailTemplateImplApi;
    this.systemApi = api.getSystemApi();
    this.http = api.getDataTransApi();
  }

  init(): string {
    return this.name;
  }

  // eslint-disable-next-line class-methods-use-this
  async handlePromise<T>(promise: Promise<any>): Promise<TemplateCommonRes<T>> {
    try {
      const res = await promise;
      const { data } = res;
      return data;
    } catch (e) {
      return {
        message: (e as any)?.message || (e as any)?.data?.message,
        success: false,
      };
    }
  }

  async doGetMailTemplateList(params: TemplateListReq, _account?: string): Promise<TemplateCommonRes<TemplateDetail[]>> {
    const url = this.systemApi.getUrl('getMailTemplateList');
    const res = await this.handlePromise<TemplateDetail[]>(this.http.get(url, params, { _account }));
    return res;
  }

  async doGetMailTemplateDetail(params: TemplateDetailReq, _account?: string): Promise<TemplateCommonRes<TemplateByIdDetail>> {
    const url = this.systemApi.getUrl('getMailTemplateDetail');
    const res = await this.handlePromise<TemplateByIdDetail>(this.http.get(url, params, { _account }));
    return res;
  }

  async doSaveMailTemplate(params: SaveTemplateReq, _account?: string): Promise<TemplateCommonRes<DeleteTemplateReq>> {
    const url = this.systemApi.getUrl('saveMailTemplate');
    const res = await this.handlePromise<DeleteTemplateReq>(this.http.post(url, params, { contentType: 'json', _account }));
    return res;
  }

  async doDeleteMailTemplate(params: DeleteTemplateReq, email?: string): Promise<TemplateCommonRes<string>> {
    const url = this.systemApi.getUrl('deleteMailTemplate');
    const res = await this.handlePromise<string>(
      this.http.post(url, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        _account: email,
      })
    );
    return res;
  }

  async doSaveMailTemplateUseTime(params: TemplateUseTimeReq, _account?: string): Promise<TemplateCommonRes<string>> {
    const url = this.systemApi.getUrl('saveMailTemplateUseTime');
    const res = await this.handlePromise<string>(
      this.http.post(url, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        _account,
      })
    );
    return res;
  }

  async getWaimaoRecommendTemplateTagList(templateCategory: 'LX' | 'LX-WAIMAO' = 'LX'): Promise<TemplateCommonRes<{ tags: WaimaoRecommendTemplateTag[] }>> {
    const url = this.systemApi.getUrl('getWaimaoRecommendTemplateTagList');
    const res = await this.handlePromise<{
      tags: WaimaoRecommendTemplateTag[];
    }>(this.http.get(url, { templateCategory }));

    return res;
  }

  async getWaimaoRecommendTemplateList(req: WaimaoRecommendTemplateListReq): Promise<TemplateCommonRes<TemplateDetail[]>> {
    const url = this.systemApi.getUrl('getWaimaoRecommendTemplateList');
    const res = await this.handlePromise<TemplateDetail[]>(this.http.post(url, req, { contentType: 'json' }));

    return res;
  }

  async getQueryCondition(req: { fromPage: 1 | 2 }): Promise<TemplateConditionRes> {
    const url = this.systemApi.getUrl('getQueryCondition');
    const res = await this.handlePromise<TemplateConditionRes>(this.http.get(url, req));
    if (res.success && res.data) {
      return res.data;
    }

    throw new Error('网络错误');
  }

  async getTemplateList(req: GetTemplateListReq): Promise<GetTemplateListRes | null> {
    const url = this.systemApi.getUrl('getTemplateList');
    const res = await this.handlePromise<GetTemplateListRes>(
      this.http.post(url, req, {
        contentType: 'json',
      })
    );
    if (res.success && res.code === 200) {
      return res.data || null;
    }

    throw new Error('网络错误');
  }

  async getTemplateTop(req: GetTemplateTopReq): Promise<GetTemplateTopRes> {
    const url = this.systemApi.getUrl('getTemplateTop');
    const res = await this.handlePromise<GetTemplateTopRes>(
      this.http.get(url, req, {
        contentType: 'json',
      })
    );
    if (res.success && res.code === 200) {
      return res.data || [];
    }

    throw new Error('网络错误');
  }

  async templateSearch(req: TemplateSearchReq): Promise<TemplateSearchRes> {
    const url = this.systemApi.getUrl('templateSearch');
    const res = await this.handlePromise<TemplateSearchRes>(
      this.http.post(url, req, {
        contentType: 'json',
      })
    );
    if (res.success && res.code === 200) {
      return res.data || [];
    }

    throw new Error('网络错误');
  }

  async templateQueryLimit(): Promise<TemplateQuertLimitRes> {
    const url = this.systemApi.getUrl('templateQueryLimit');
    const res = await this.handlePromise<TemplateQuertLimitRes>(
      this.http.get(url, {
        templateType: 'PERSONAL',
        templateCategory: 'LX-WAIMAO',
      })
    );
    if (res.success && res.data) {
      return res.data;
    }

    throw new Error('网络错误');
  }

  async fetchSuggestTemplates(): Promise<any> {
    const url = this.systemApi.getUrl('fetchSuggestTemplates');
    const res = await this.handlePromise<TemplateQuertLimitRes>(
      this.http.get(url, {
        templateCategory: 'LX-WAIMAO',
      })
    );
    if (res.success && res.data) {
      return res.data;
    }
  }

  async fetchNewTemplateUpdateTime(): Promise<any> {
    const url = this.systemApi.getUrl('fetchNewTemplateUpdateTime');
    const res = await this.handlePromise<TemplateQuertLimitRes>(
      this.http.get(url, {
        templateCategory: 'LX-WAIMAO',
      })
    );
    if (res.success && res.data) {
      return res.data;
    }
  }

  async getTemplateTagList(params: TemplateType): Promise<TemplateCommonRes<{ tagList: WaimaoRecommendTemplateTag[] }>> {
    const url = this.systemApi.getUrl('getTemplateTagList');
    const res = await this.handlePromise<{
      tagList: WaimaoRecommendTemplateTag[];
    }>(this.http.get(url, params));
    return res;
  }

  async deleteTemplateTags(params: TemplateTagIdList): Promise<TemplateCommonRes> {
    const url = this.systemApi.getUrl('deleteTemplateTags');
    const res = await this.handlePromise(this.http.post(url, params, { contentType: 'json' }));
    return res;
  }

  async saveOrUpdateTemplateTag(params: SaveOrUpdateTagReq): Promise<TemplateCommonRes> {
    const url = this.systemApi.getUrl('saveOrUpdateTemplateTag');
    const res = await this.handlePromise(this.http.post(url, params, { contentType: 'json' }));
    return res;
  }
}

const mailTemplateImplApi: Api = new MailTemplateImplApi();

api.registerLogicalApi(mailTemplateImplApi);

export default mailTemplateImplApi;
