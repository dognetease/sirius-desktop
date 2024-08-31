import lodashGet from 'lodash/get';
import { api as masterApi } from '@/api/api';
import { apis } from '@/config';
import { AppendInterceptorApi, InterceptorApi, InterceptorRequestConfig, InterceptorResponseConfig } from '../../interface/interceptor';
import { DbRefer } from '@/api/data/new_db';
import { SystemApi } from '@/api/system/system';

// DB异步操作修改入参
export class DexieUpdateargsInterceptor implements AppendInterceptorApi {
  /**
   * @param interceptors {Interceptor[]} request拦截器实例 & repsonse拦截器
   * @param target
   */

  private systemApi: SystemApi;

  constructor(interceptors: [InterceptorApi<InterceptorRequestConfig>, InterceptorApi<InterceptorResponseConfig>]) {
    this.systemApi = masterApi.getSystemApi();

    const [requestInterceptor] = interceptors;

    requestInterceptor.use({
      namespace: apis.dbInterfaceApiImpl,
      resolve: async config => {
        if (config.namespace !== apis.dbInterfaceApiImpl) {
          return config;
        }
        // 如果检测到_dbAccount是邮箱 强制专程md5
        const _account = lodashGet(config, 'args[0]._dbAccount', '') || lodashGet(config, 'args[0]._account', '');
        if (typeof _account === 'string' && _account.length > 0 && _account.includes('@')) {
          const [dbRefer] = config.args as [DbRefer];
          dbRefer._dbAccount = this.systemApi.md5(_account, true);
          return config;
        }
        // 如果不是从属账号请求的DB操作 直接跳过
        if (!window.isAccountBg) {
          return config;
        }

        const [dbRefer] = config.args as [DbRefer];
        // 统一添加一个dbAccount的参数
        dbRefer._dbAccount = lodashGet(this.systemApi.getCurrentUser(), 'accountMd5', '');
        return config;
      },
    });
  }

  eject() {}
}
/** ***********DB操作相关拦截器end*********** */
