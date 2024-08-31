import ContactSelectNotify from '@/impl/logical/contact/contact_select_notify';
import { AppendInterceptorApi, InterceptorApi, InterceptorRequestConfig, InterceptorResponseConfig } from '@/bridge/interface/interceptor';
import { apis } from '@/config';
// 同步redux
// 背景:bridge已经代理了API方法 ContactSelectNotify不适合再去执行代理。可以把ContactSelectNotify的同步逻辑通过拦截器的方式注入整个proxy成功以后
// Q:bridge只有在配置了代理的时候拦截器才能生效 但是Redux同步的逻辑是必须要执行。这里需要处理
// 没有启用2022-10-26
export class ContactSyncReduxInterceptor implements AppendInterceptorApi {
  constructor(interceptors: [InterceptorApi<InterceptorRequestConfig>, InterceptorApi<InterceptorResponseConfig>]) {
    const [, responseInterceptor] = interceptors;

    responseInterceptor.use({
      namespace: apis.contactApiImpl,
      async resolve(res) {
        const { namespace, apiname } = res.config;
        // 如果不在同步白名单
        if (namespace !== apis.contactApiImpl || !ContactSelectNotify.selectWhiteList.includes(apiname)) {
          return res;
        }

        try {
          // 执行同步
          ContactSelectNotify.handleNeedTransData.apply(ContactSelectNotify, [apiname, res.data]);
        } catch (ex) {
          console.warn('[contact]syncReduxfailed', ex);
        }

        return res;
      },
    });
  }

  eject() {}
}
