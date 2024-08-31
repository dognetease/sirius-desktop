import { config } from 'env_def';
import { host } from '@/urlConfig/url_common';

// const host = (config('host') || '') as string;
export class FeedbackLogUrl {
  /**
   * 问题反馈（日志上报）相关接口
   */

  getNosToken: string = host + config('getNosToken');

  submitFeedback: string = host + config('submitFeedback');

  getLogConfig: string = host + config('getLogConfig');

  uploadLog: string = host + config('uploadLog');
}
export type FeedbackLogUrlKeys = keyof FeedbackLogUrl;
const urlConfig = new FeedbackLogUrl();
const urlsMap = new Map<FeedbackLogUrlKeys, string>();

Object.keys(urlConfig).forEach(item => {
  urlsMap.set(item as FeedbackLogUrlKeys, urlConfig[item as FeedbackLogUrlKeys]);
});
export default urlsMap;
