import lodashGet from 'lodash/get';
import { api } from '@/api/api';
import {
  CreateDiscussOption,
  DiscussBindOption,
  DiscussMailDetailOption,
  DiscussMailOption,
  IMDiscussApi,
  MailAttachOption,
  MailDiscussOption,
  ShareMailOption,
} from '@/api/logical/im_discuss';
import { apis, URLKey } from '@/config';
import { ApiResponse, DataTransApi, ResponseData } from '@/api/data/http';
import { Api } from '@/api/_base/api';
import { SystemApi } from '@/api/system/system';
import { MailApi } from '@/api/logical/mail';

class IMDiscussApiImpl implements IMDiscussApi {
  name: string;

  httpApi: DataTransApi;

  systemApi: SystemApi;

  mailApi: MailApi;

  constructor() {
    this.name = apis.imDiscussApiImpl;
    this.httpApi = api.getDataTransApi();
    this.systemApi = api.getSystemApi();
    this.mailApi = api.requireLogicalApi(apis.mailApiImpl) as MailApi;
  }

  init(): string {
    return this.name;
  }

  getUrl(url: URLKey) {
    return this.systemApi.getUrl(url);
  }

  parseResult(res: ApiResponse<any>) {
    return res.data;
  }

  catchError(reason: any) {
    return reason;
  }

  createDiscuss(option: CreateDiscussOption) {
    return this.httpApi
      .post(this.getUrl('createDiscuss'), option, {
        contentType: 'json',
      })
      .then(res => {
        if (lodashGet(res, 'data.code', 999) !== 0) {
          throw new Error(lodashGet(res, 'data.message', '创建失败'));
        }
        return res.data as ResponseData<any>;
      });
  }

  getDiscussMail(option: DiscussMailOption) {
    return this.httpApi.get(this.getUrl('getDiscussMail'), option).then(this.parseResult).catch(this.catchError);
  }

  getDiscussMailDetail(option: DiscussMailDetailOption) {
    return this.httpApi.post(this.getUrl('getDiscussMailDetail'), option).then(this.parseResult).catch(this.catchError);
  }

  getMailDiscuss(option: MailDiscussOption) {
    return this.httpApi.get(this.getUrl('getMailDiscuss'), option, { contentType: 'json' }).then(this.parseResult).catch(this.catchError);
  }

  cancelDiscussBind(option: DiscussBindOption) {
    return this.httpApi
      .post(this.getUrl('cancelDiscussBind'), option, {
        contentType: 'json',
      })
      .then(this.parseResult)
      .catch(this.catchError);
  }

  discussMailAttach(option: MailAttachOption) {
    return this.httpApi.post(this.getUrl('discussMailAttach'), option).then(this.parseResult).catch(this.catchError);
  }

  shareMail(option: ShareMailOption) {
    return this.httpApi.post(this.getUrl('shareMail'), option, { contentType: 'json' }).then(this.parseResult).catch(this.catchError);
  }
}

const imDiscussApiImpl: Api = new IMDiscussApiImpl();
api.registerLogicalApi(imDiscussApiImpl);

export default imDiscussApiImpl;
