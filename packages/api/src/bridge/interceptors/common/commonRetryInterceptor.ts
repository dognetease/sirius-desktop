import lodashGet from 'lodash/get';
// import { Interceptor, AppendInterceptorApi } from './interceptor';
import { AppendInterceptorApi, InterceptorApi, InterceptorRequestConfig, InterceptorResponseConfig } from '../../interface/interceptor';
import { CustomError } from '../../config/bridgeError';
import { BRIDGE_RESPONSE_CODE } from '../../interface/common';
import bridgeProxyConfigList from '../../config/config';
import { isElectron } from '@/config';

/**
 * @name: 调度后台异常场景下的兜底逻辑
 * @description: 主要有以下几种场景
 * 1.当前页面禁用后台
 * 2.web环境下后台不存在(Note:因为多账号的原因，Electron场景下的BG_WIN_NOT_EXIST不适配这种case)
 */
export class ForbiddenRetryInterceptor implements AppendInterceptorApi {
  constructor(interceptors: [InterceptorApi<InterceptorRequestConfig>, InterceptorApi<InterceptorResponseConfig>]) {
    const [, interceptor] = interceptors;
    interceptor.use({
      type: 'error',
      resolve: async response => response,
      reject(error: CustomError) {
        const errorCode = lodashGet(error, 'code', -999);

        const enableRetry = [
          () => errorCode === BRIDGE_RESPONSE_CODE.REJECT_BRIDGE_BY_CURPAGE,
          () => {
            if (isElectron()) {
              return false;
            }
            return error.message.indexOf('BG_WIN_NOT_EXIST') !== -1;
          },
        ].some(call => call());
        if (!enableRetry) {
          throw error;
        }

        const namespace = lodashGet(error, 'config.namespace', '');
        const apiname = lodashGet(error, 'config.apiname', '');
        const args = lodashGet(error, 'config.args', '');

        // 寻找对应的配置
        const bridgeProxyConfig = bridgeProxyConfigList.find(item => item.namespace === namespace);
        if (!bridgeProxyConfig) {
          throw error;
        }
        const apiTarget = bridgeProxyConfig.target();
        // 如果找不到实例 或者对应的方法不存在
        // eslint-disable-next-line
        // @ts-ignore
        if (!apiTarget || typeof apiTarget[`_$${apiname}`] !== 'function') {
          throw error;
        }
        // eslint-disable-next-line
        // @ts-ignore
        return apiTarget[`_$${apiname}`](...args);
      },
    });
  }

  eject() {}
}
