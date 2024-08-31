import lodashGet from 'lodash/get';
import { api as masterApi } from '@/api/api';
import { apis, isElectron } from '@/config';
import { MailApi } from '@/api/logical/mail';
import { BRIDGE_RESPONSE_CODE, BRIDGE_RESPONSE_TYPE } from '../../interface/common';
import { AppendInterceptorApi, InterceptorApi, InterceptorRequestConfig, InterceptorResponseConfig } from '../../interface/interceptor';
import { DispatchTaskRequestContent as TaskConfig } from '../../interface/proxy';
import { CustomError } from '../../config/bridgeError';

// mail的代理方法只能在electron中执行
export class MailElectronInterceptor implements AppendInterceptorApi {
  /**
   * @param interceptors {Interceptor[]} request拦截器实例 & repsonse拦截器
   * @param target
   */

  private mailApi = masterApi.requireLogicalApi(apis.mailApiImpl) as MailApi;

  private systemApi = masterApi.getSystemApi();

  constructor(interceptors: [InterceptorApi<InterceptorRequestConfig>, InterceptorApi<InterceptorResponseConfig>]) {
    const [requestInterceptor, responseInterceptor] = interceptors;

    // 不是在electron环境中
    requestInterceptor.use({
      namespace: apis.mailApiImpl,
      async resolve(config) {
        if (config.namespace !== apis.mailApiImpl || isElectron()) {
          return config;
        }

        throw new CustomError(BRIDGE_RESPONSE_TYPE.ONLY_SUPPORT_ELECTRON, {
          code: BRIDGE_RESPONSE_CODE.ONLY_SUPPORT_ELECTRON,
          config: config as TaskConfig,
        });
      },
    });

    responseInterceptor.use({
      namespace: apis.mailApiImpl,
      type: 'error',
      async resolve(res) {
        return res;
      },
      reject: async (error: CustomError) => {
        // 如果错误信息中没有返回调用信息 直接输出输出错误
        const isMail = lodashGet(error, 'config.namespace', '') === apis.mailApiImpl;
        const account = lodashGet(error, 'config.account', '');
        const masterAccount = lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '');
        /**
         * 如果不是邮件不执行重试
         * account页面不执行重试
         * 非主账号不执行重试
         */
        if (!isMail || window.isAccountBg || account !== masterAccount) {
          throw error;
        }

        const { apiname, args } = lodashGet(error, 'config');
        // eslint-disable-next-line
        // @ts-ignore
        if (typeof this.mailApi[`_$${apiname}`] !== 'function') {
          throw error;
        }
        // eslint-disable-next-line
        // @ts-ignore
        return this.mailApi[`_$${apiname}`](...args);
      },
    });
  }

  eject() {}
}
/** ***********DB操作相关拦截器end*********** */
