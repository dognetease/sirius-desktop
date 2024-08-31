import { api } from '@/api/api';
import { WebMailApi, GetActivityInfoRes, JoinActivityReq, InvokeActivityReq } from '@/api/logical/webmail_activity';
import { apis, URLKey } from '@/config';
import { ApiResponse, DataTransApi } from '@/api/data/http';
import { Api } from '@/api/_base/api';
import { SystemApi } from '@/api/system/system';

import { activityConf } from './activity-conf';

const activity_key = 'webmail_lx_note_v2'; // 本期活动的key
class WebmailApiImpl implements WebMailApi {
  name: string;

  httpApi: DataTransApi;

  systemApi: SystemApi;

  protected _activityId = 0;

  // webmail 跳转携带参数
  protected _webmailState: Record<string, unknown>;

  constructor() {
    this.name = apis.webmailApiImpl;
    this.httpApi = api.getDataTransApi();
    this.systemApi = api.getSystemApi();
    this._webmailState = {};
  }

  init(): string {
    return this.name;
  }

  getUrl(url: URLKey) {
    return this.systemApi.getUrl(url);
  }

  parseResult<T = any>(res: ApiResponse<T>) {
    return res.data || {};
  }

  catchError(reason: any) {
    return reason;
  }

  public getActivityInfo() {
    return this.httpApi.get<GetActivityInfoRes>(this.getUrl('getActivityInfo'), {}, { contentType: 'form' }).then(
      res => {
        const activityInfos = res.data?.data?.activityInfos;
        if (activityInfos != null) {
          const info = activityInfos.find(item => item.type === activity_key);
          this._activityId = info?.activityId || 0;
        } else {
          throw new Error('获取活动详情失败，请重试');
        }
        // this._activityId = res.data?.data?.activityInfos[0].activityId || 0;
        return this.parseResult(res);
      },
      () => {
        // return reason;
        throw new Error('获取活动详情失败，请重试');
      }
    );
  }

  public joinActivity(option: JoinActivityReq) {
    return this.httpApi
      .post<boolean>(this.getUrl('joinActivity'), option, {
        contentType: 'form',
      })
      .then(this.parseResult, err => {
        // return reason;
        console.log(err);
        const code: number | undefined = err.data?.code;
        if (code === 30000) {
          throw new Error('活动已截至');
        }
        if (code === 30001) {
          throw new Error('无法参与报名');
        }
        throw new Error('报名失败，请重试');
      });
  }

  public invokeActivity(option: InvokeActivityReq) {
    return this.httpApi.post(this.getUrl('invokeActivity'), option, { contentType: 'form' }).then(this.parseResult).catch(this.catchError);
  }

  // 参加活动
  public doInvokeActivity(tid: string, activityId: number): void {
    /**
     * todo
     * 1. 是webmail
     * 2. 在活动期限内
     * 3. 已报名活动
     */
    const time = Date.now();
    const { startTime, endTime } = this.getTimeRange().yun_bi_ji;
    if (time > startTime && time < endTime) {
      this.invokeActivity({
        activityId,
        tid,
      });
    }
  }

  // 返回活动时间
  public getTimeRange() {
    return activityConf;
  }

  public setState(state: Record<string, unknown>): void {
    this._webmailState = state;
  }

  public getState() {
    return this._webmailState;
  }
}

const webmailApiImpl: Api = new WebmailApiImpl();
api.registerLogicalApi(webmailApiImpl);

export default webmailApiImpl;
