import lodashGet from 'lodash/get';
import { apis } from '@/config';
import { BRIDGE_RESPONSE_CODE, BRIDGE_RESPONSE_TYPE } from '../../interface/common';
import { AppendInterceptorApi, InterceptorApi, InterceptorRequestConfig, InterceptorResponseConfig } from '../../interface/interceptor';
import { DispatchTaskRequestContent as TaskConfig } from '../../interface/proxy';
import { CustomError } from '../../config/bridgeError';

// 阻止跨窗口写入用户信息到localstorage
export class PreventUserPutInterceptor implements AppendInterceptorApi {
  /**
   * @param interceptors {Interceptor[]} request拦截器实例 & repsonse拦截器
   * @param target
   */

  constructor(interceptors: [InterceptorApi<InterceptorRequestConfig>, InterceptorApi<InterceptorResponseConfig>]) {
    const [requestInterceptor, responseInterceptor] = interceptors;

    requestInterceptor.use({
      namespace: apis.defaultDataStoreApiImpl,
      async resolve(config) {
        // 如果是要跨窗口写入用户信息到DB中直接抛出错误忽略
        if (config.namespace === apis.defaultDataStoreApiImpl && lodashGet(config, 'args[0]', '').includes('currentLoginUserAccount')) {
          throw new CustomError(BRIDGE_RESPONSE_TYPE.PREVENT_USER_CROSSWIN_PUT, {
            code: BRIDGE_RESPONSE_CODE.PREVENT_USER_CROSSWIN_PUT,
            config: config as TaskConfig,
          });
        }
        return config;
      },
    });

    responseInterceptor.use({
      namespace: apis.defaultDataStoreApiImpl,
      async resolve(response) {
        return response;
      },
      reject(error: CustomError) {
        if (lodashGet(error, 'code', -99) === BRIDGE_RESPONSE_CODE.PREVENT_USER_CROSSWIN_PUT) {
          console.warn('[storeApi].put.proxy:user信息禁止跨窗写入', error.config);
          return Promise.resolve('');
        }
        throw error;
      },
    });
  }

  eject() {}
}
/** ***********DB操作相关拦截器end*********** */
