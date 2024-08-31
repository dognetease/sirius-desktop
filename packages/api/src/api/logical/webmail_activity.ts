import { Api } from '../_base/api';
import { ResponseData } from '../data/http';

export interface GetActivityInfoRes {
  activityInfos: Array<{
    activityId: number; // 活动id
    type: string; // 活动类型，本期对应此类型匹配取值即可
    join: 0 | 1; // 是否已报名，0：否，1：是
  }>;
}

export interface JoinActivityReq {
  activityId: number;
}

export interface InvokeActivityReq {
  activityId: number;
  tid: string;
}

export interface WebMailApi extends Api {
  /**
   * 获取活动信息
   */
  getActivityInfo(): Promise<ResponseData<GetActivityInfoRes>>;
  /**
   * 活动报名
   */
  joinActivity(req: JoinActivityReq): Promise<ResponseData<boolean>>;
  /**
   * 触发活动
   */
  invokeActivity(req: InvokeActivityReq): Promise<ResponseData<boolean>>;
  /**
   * 发送触发活动
   */
  doInvokeActivity(tid: string, activityId: number): void;
  /**
   * 活动时间
   */
  getTimeRange(): Record<
    string,
    {
      startTime: number;
      endTime: number;
    }
  >;
  /**
   * 设置webmail state
   */
  setState(state: Record<string, unknown>): void;
  /**
   * 获取webmail state
   */
  getState(): Record<string, unknown>;
}
