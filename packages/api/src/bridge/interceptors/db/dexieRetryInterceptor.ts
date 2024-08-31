import lodashGet from 'lodash/get';
import { AppendInterceptorApi, InterceptorApi, InterceptorRequestConfig, InterceptorResponseConfig } from '../../interface/interceptor';
import { CustomError } from '../../config/bridgeError';
import { api as masterApi } from '@/api/api';
import { apis, inWindow } from '@/config';
import { SystemApi } from '@/api/system/system';
import { LoggerApi } from '@/api/data/dataTracker';
import { locationHelper } from '@/api/util/location_helper';
/**
 * @name DB调用失败重试拦截器
 */
export class DBRetryInterceptor implements AppendInterceptorApi {
  private dbApi = masterApi.requireLogicalApi(apis.dbInterfaceApiImpl);

  private systemApi: SystemApi;

  dataTrackerApi: LoggerApi;

  loggerApi: LoggerApi;

  private enableRetryApis = ['getByRangeCondition', 'getByEqCondition', 'getTableCount', 'getById', 'getByIds', 'getByIndexIds'];

  static warningLimit = 1000;

  constructor(interceptors: [InterceptorApi<InterceptorRequestConfig>, InterceptorApi<InterceptorResponseConfig>]) {
    this.systemApi = masterApi.getSystemApi();

    this.dataTrackerApi = masterApi.requireLogicalApi(apis.dataTrackerApiImp) as LoggerApi;

    this.loggerApi = masterApi.requireLogicalApi(apis.loggerApiImpl) as LoggerApi;

    if (inWindow() && !locationHelper.isMainPage()) {
      DBRetryInterceptor.warningLimit = 100;
    }

    const [, interceptor] = interceptors;
    interceptor.use({
      namespace: apis.dbInterfaceApiImpl,
      type: 'error',
      resolve: async response => {
        setTimeout(() => {
          this.trackLog(response);
        }, 0);
        return response;
      },
      reject: async (error: CustomError) => {
        const account = lodashGet(error as CustomError, 'config.account', '');
        // 如果发生异常的用户不是主账号 直接返回错误不兜底
        if (this.systemApi.getCurrentUser() && this.systemApi.getCurrentUser()!.accountMd5 !== account) {
          throw error;
        }

        const namespace = lodashGet(error as CustomError, 'config.namespace', '') as string;
        const errMsg = lodashGet(error, 'message', typeof error === 'string' ? error : '');

        const apiname = lodashGet(error as CustomError, 'config.apiname', '');

        // eslint-disable-next-line
        // @ts-ignore
        const $tempMethod = this.dbApi[`_$${apiname}`];

        // 如果是因为bridge导致的错误(BG_WIN_UNRESPONSE)
        // 20220919:apiTimeout只有read类操作可以执行重试
        const BridgeErrorDesc = ['BG_WIN_UNRESPONSE', 'INVALD_ACCOUNT_NOACCOUNT', 'BG_WIN_NOT_EXIST'];
        const enableRetryError =
          BridgeErrorDesc.some(reason => errMsg.indexOf(reason) !== -1) || (BridgeErrorDesc.includes('API_RESPONSE_TIMEOUT') && this.enableRetryApis.includes(apiname));
        // (重试条件:DB模块 & 初始化代理的时候配置了temp函数 & 错误类型支持重试)
        const enableRetry = namespace === apis.dbInterfaceApiImpl && typeof $tempMethod === 'function' && enableRetryError;

        if (!enableRetry) {
          throw error;
        }

        const args = lodashGet(error as CustomError, 'config.args', []);

        // 在这里重新调用API的原始方法
        // eslint-disable-next-line
        // @ts-ignore
        return this.dbApi[`_$${apiname}`](...args);
      },
    });
  }

  eject() {}

  private apilist: string[] = ['getByRangeCondition', 'getByEqCondition', 'getByIndexIds', 'getByIds'];

  // static warningLimit=environment === 'dev' ? 10 : 1000

  trackLog(response: InterceptorResponseConfig) {
    const namespace = lodashGet(response, 'config.namespace', '');
    const apiname = lodashGet(response, 'config.apiname', '');

    if (namespace !== apis.dbInterfaceApiImpl || !this.apilist.includes(apiname)) {
      return;
    }

    const dbName = lodashGet(response, 'config.args[0].dbName', '');
    const tableName = lodashGet(response, 'config.args[0].tableName', '');

    const count = lodashGet(response, 'data.length', 0) as number;
    if (typeof count !== 'number' || count < DBRetryInterceptor.warningLimit) {
      return;
    }

    let enableRecord = false;

    let argsCount = 0;
    switch (apiname) {
      case 'getByRangeCondition': {
        argsCount = lodashGet(response, 'config.args[0].adCondition.args.length', 0) as number;
        break;
      }
      case 'getByEqCondition': {
        argsCount = lodashGet(response, 'config.args[0].adCondition.args.length', 0) as number;
        break;
      }
      case 'getByIndexIds': {
        argsCount = lodashGet(response, 'config.args[2].length', 0);
        break;
      }
      case 'getByIds': {
        argsCount = lodashGet(response, 'config.args[1].length', 0);
        break;
      }
      default:
        break;
    }
    enableRecord = typeof argsCount === 'number' && argsCount >= 1;
    if (!enableRecord) {
      return;
    }

    this.dataTrackerApi.track('pc_db_exceed_thousand', {
      dbname: dbName,
      tablename: tableName,
      apiname,
      limit: DBRetryInterceptor.warningLimit,
      // 统计量级 要不然数据不好统计
      count: Math.round(count / DBRetryInterceptor.warningLimit),
      arglen: Math.round(argsCount / DBRetryInterceptor.warningLimit),
    });

    this.loggerApi.track('pc_db_exceed_thousand_detail', {
      params: lodashGet(response, 'config', {}),
      count,
    });
  }
}
