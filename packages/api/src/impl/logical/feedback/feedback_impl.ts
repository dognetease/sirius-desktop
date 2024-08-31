import { api } from '@/api/api';
import { TokenOption, FeedbackOption, FeedbackApi } from '@/api/logical/feedback_log';
import { apis, URLKey } from '@/config';
import { ApiResponse, DataTransApi } from '@/api/data/http';
import { Api } from '@/api/_base/api';
import { SystemApi } from '@/api/system/system';

class FeedbackApiImpl implements FeedbackApi {
  name: string;

  httpApi: DataTransApi;

  systemApi: SystemApi;

  constructor() {
    this.name = apis.feedbackApiImpl;
    this.httpApi = api.getDataTransApi();
    this.systemApi = api.getSystemApi();
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

  getNosToken(option: TokenOption) {
    return this.httpApi.get(this.getUrl('getNosToken'), option, { contentType: 'json' }).then(this.parseResult).catch(this.catchError);
  }

  submitFeedback(option: FeedbackOption) {
    return this.httpApi.post(this.getUrl('submitFeedback'), option, { contentType: 'json' }).then(this.parseResult).catch(this.catchError);
  }
}

const feedbackApiImpl: Api = new FeedbackApiImpl();
api.registerLogicalApi(feedbackApiImpl);

export default feedbackApiImpl;
