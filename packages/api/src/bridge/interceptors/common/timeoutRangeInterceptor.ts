import lodashGet from 'lodash/get';
import { AppendInterceptorApi, InterceptorApi, InterceptorRequestConfig, InterceptorResponseConfig } from '../../interface/interceptor';
import { CustomError } from '../../config/bridgeError';
import { api as masterApi } from '@/api/api';
import { apis } from '@/config';
import { DataTrackerApi } from '@/api/data/dataTracker';
/**
 * @name:失败原因统计(只统计调用超时的具体信息)
 */
export class TimeoutRangeInterceptor implements AppendInterceptorApi {
  private dataTrackerApi = masterApi.requireLogicalApi(apis.dataTrackerApiImp) as unknown as DataTrackerApi;

  // 后台响应超时错误
  private timeoutErrorCount = 0;

  private timeoutErrorMap: Map<string, number> = new Map();

  // 后台无响应超时错误
  private bgNotExistErrorCount = 0;

  static MaxGrandCount = 20;

  constructor(interceptors: [InterceptorApi<InterceptorRequestConfig>, InterceptorApi<InterceptorResponseConfig>]) {
    const [, interceptor] = interceptors;
    interceptor.use({
      namespace: 'common',
      type: 'error',
      resolve: async response => response,
      reject: async (error: CustomError) => {
        setTimeout(() => {
          this.recordCommonErrorLog(error);
        }, 20);
        throw error;
      },
    });
  }

  recordCommonErrorLog(error: CustomError) {
    // 错误发生在主进程接受任务派发流程中 没有duration字段

    const code = typeof error === 'string' ? error : lodashGet(error, 'message', '');

    // 统计timeout | bgnotExist错误。为了避免上报过于频繁。合并到20条之后上报
    if (code.indexOf('API_RESPONSE_TIMEOUT') !== -1) {
      this.timeoutErrorCount += 1;

      const errkey = [lodashGet(error, 'config.namespace', ''), lodashGet(error, 'config.apiname', '')].join('-');

      this.timeoutErrorMap.set(errkey, (this.timeoutErrorMap.get(errkey) || 0) + 1);

      if (this.timeoutErrorCount <= TimeoutRangeInterceptor.MaxGrandCount) {
        return;
      }
      this.dataTrackerApi.track('pc_bridge_timeout_error', {
        path: location.pathname,
        msg: JSON.stringify(Object.fromEntries(this.timeoutErrorMap)),
      });

      this.timeoutErrorCount = 0;
      this.timeoutErrorMap.clear();
    } else if (code.indexOf('BG_WIN_NOT_EXIST') !== -1) {
      this.bgNotExistErrorCount += 1;

      if (this.bgNotExistErrorCount <= TimeoutRangeInterceptor.MaxGrandCount) {
        return;
      }
      this.dataTrackerApi.track('pc_bridge_notexist_error', {
        path: location.pathname,
      });
      this.bgNotExistErrorCount = 0;
    }
  }

  eject() {}
}
