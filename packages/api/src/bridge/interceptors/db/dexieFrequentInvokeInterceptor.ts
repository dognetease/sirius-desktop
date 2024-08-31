import { AppendInterceptorApi, InterceptorApi, InterceptorRequestConfig, InterceptorResponseConfig } from '../../interface/interceptor';
import { api as masterApi } from '@/api/api';
import { apis, inWindow } from '@/config';
import { SystemApi } from '@/api/system/system';
import { LoggerApi } from '@/api/data/dataTracker';
/**
 * @name DB频繁调用打点
 * @description: 主要用来监控可能存在的死循环调用
 */
export class DBFrequentInvokeInterceptor implements AppendInterceptorApi {
  private systemApi: SystemApi;

  dataTrackerApi: LoggerApi;

  // 触发报警上限(以不高于每五秒一次的频率连续触发了20次)
  private triggerReportLimit = 20;

  // 临时调用信息存储(单位时间内只调用一次的就放到这里就行)
  static tempInfoStoreLimit = 100;

  // 最多只存储100条临时信息
  private tempInfoSet: Set<string> = new Set();

  // 异常信息存储
  private exceptionInfoStore: Map<
    string,
    {
      count: number;
      lasttimestamp: number;
    }
  > = new Map();

  // 最多只存储20条异常信息
  private expcetionStoreLimit = 20;

  constructor(interceptors: [InterceptorApi<InterceptorRequestConfig>, InterceptorApi<InterceptorResponseConfig>]) {
    this.systemApi = masterApi.getSystemApi();

    this.dataTrackerApi = masterApi.requireLogicalApi(apis.dataTrackerApiImp) as LoggerApi;

    if (!inWindow()) {
      return;
    }
    // 执行清理策略防止溢出
    this.systemApi.intervalEvent({
      handler: ob => {
        // 2分钟清理一次tempSet
        if (ob.seq % 8 === 0) {
          this.tempInfoSet.clear();
        }

        // 20分钟清理一次异常map
        if (ob.seq % 800 === 0) {
          this.exceptionInfoStore.clear();
        }
      },
      seq: 0,
      eventPeriod: 'mid',
    });

    const [interceptor] = interceptors;
    interceptor.use({
      namespace: apis.dbInterfaceApiImpl,
      type: 'normal',
      resolve: async request => {
        setTimeout(() => {
          this.trackLog(request);
        }, 10);
        return request;
      },
    });
  }

  eject() {}

  trackLog(requestConfig: InterceptorRequestConfig) {
    const { args, namespace, apiname } = requestConfig;
    //  就认为有可能是陷入死循环&只抽检50%的数据。触发上报
    if (namespace !== apis.dbInterfaceApiImpl || Math.random() < 0.5) {
      return;
    }
    const md5 = this.systemApi.md5([apiname, JSON.stringify(args)].join('-'), true);

    /**
     * 三个流程:
     * 第一步先检查异常Map中是否有当前md5信息(短时间多次重复请求)
     * 第二步检查tempInfo表中是否有当前md5信息(短时间内第二次触发)
     * 第三部在tempInfo表中标记一个状态
     */
    if (this.exceptionInfoStore.has(md5)) {
      this.storeAndReport(md5, requestConfig);
    } else if (!this.exceptionInfoStore.has(md5) && this.tempInfoSet.has(md5)) {
      this.storeExceptionFromTemp(md5);
    } else {
      this.storeTempInfo(md5);
    }
  }

  storeTempInfo(md5: string) {
    // 缩减体积
    while (this.tempInfoSet.size > DBFrequentInvokeInterceptor.tempInfoStoreLimit) {
      const { value: deleteId } = this.tempInfoSet.keys().next();
      this.tempInfoSet.delete(deleteId);
    }

    this.tempInfoSet.add(md5);
  }

  // 第二次上报的时候将数据从tempset中转移到exceptionStore中
  private storeExceptionFromTemp(md5: string) {
    // 限制数量上限
    while (this.exceptionInfoStore.size > this.expcetionStoreLimit) {
      const { value: deleteMd5 } = this.exceptionInfoStore.keys().next();
      this.exceptionInfoStore.delete(deleteMd5);
    }
    // 数据存储
    this.exceptionInfoStore.set(md5, {
      count: 1,
      lasttimestamp: Date.now(),
    });
    this.tempInfoSet.delete(md5);
  }

  // 存储异常数据 执行上报
  private storeAndReport(md5: string, requestConfig: InterceptorRequestConfig) {
    const { lasttimestamp, count } = this.exceptionInfoStore.get(md5)!;
    const now = Date.now();

    // 继续存储(最新的更新往后挪)
    this.exceptionInfoStore.delete(md5);

    // 距离上次调用超过了5s放弃
    if (now - lasttimestamp > 5000) {
      return;
    }

    // 如果已经打到了报警上限则执行上报
    const { apiname = '', args = [] } = requestConfig;
    if (count + 1 > this.triggerReportLimit) {
      this.dataTrackerApi.track('pc_db_frequent_excute', {
        apiname,
        argsinfo: JSON.stringify(args).slice(0, 200),
      });
      return;
    }

    // 往后挪
    this.exceptionInfoStore.set(md5, {
      count: count + 1,
      lasttimestamp: now,
    });
    // console.error('interceptor.freq.storeAndReport', md5, requestConfig, JSON.stringify(Object.fromEntries(this.exceptionInfoStore)), '次数:', count + 1);
  }
}
