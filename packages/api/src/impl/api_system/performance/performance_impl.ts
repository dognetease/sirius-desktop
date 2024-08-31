/*
 * @Author: your name
 * @Date: 2022-02-11 10:49:20
 * @LastEditTime: 2022-03-11 16:55:36
 * @LastEditors: Please set LastEditors
 * @Description: 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @FilePath: /dev-wlj/packages/api/src/impl/api_system/performance/performance.ts
 */
import { config } from 'env_def';
import {
  AllStatType,
  PerformanceApi,
  PerformanceLogType,
  PerformancePointType,
  PerformanceTimerType,
  PerformanceType,
  PerformanceTypeDef,
  PointParams,
  TimerLogger,
  TimerParams,
  IProcessMemoryInfo,
} from '@/api/system/performance';
import { DeviceInfo, IntervalEventParams, SystemApi } from '@/api/system/system';
import { DataStoreApi } from '@/api/data/store';
import { User } from '@/api/_base/api';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { api } from '@/api/api';
import { apis, getPageName, inWindow, isElectron } from '@/config';
import { platform } from '@/api/util/platform';
import { ProductAuthApi } from '@/api/logical/productAuth';
import { ContactAndOrgApi } from '@/api/logical/contactAndOrg';
import { getOs } from '../../../utils/confOs';

const forElectron = config('build_for') === 'electron';
const osType = getOs();
const _platform = forElectron ? osType : 'web-' + platform.os;
const inEdm = process.env.BUILD_ISEDM;

const logItem = ({ statKey, statSubKey, params }: TimerParams): PerformanceTimerType => ({
  start: Date.now(),
  log: [],
  end: 0,
  valueType: 1,
  recording: true,
  statKey,
  statSubKey,
  params,
  type: 'timer',
  dirty: false,
  value: 0,
});

const pointItem = ({ value, statKey, statSubKey, params, valueType }: PointParams): PerformancePointType => ({
  start: Date.now(),
  valueType,
  value,
  statKey,
  statSubKey,
  params,
  type: 'point',
});

const keyMap = {
  heapStatistics: 'pr_heap_mem',
  processMemoryInfo: 'pr_proc_mem',
  CPUUsage: 'pr_cpu_rate',
  webMemory: 'web_memory',
};

interface storeItem {
  [key: string]: {
    [key: string]: {
      [key: string]: any;
    };
  };
}

type keyMapKeyType = 'heapStatistics' | 'processMemoryInfo' | 'CPUUsage' | 'webMemory';

class ActionStore {
  storedStart: PerformanceType;

  pointStore: PerformancePointType[];

  timerStore: PerformanceTimerType[];

  processInfoStore: storeItem[];

  webMemoryStore: storeItem[];

  countTaskNumStat: { lstReport: number; [k: string]: PerformancePointType | number };

  illegalStatCount: {
    count: number;
    lastOccurredTime: number;
  };

  constructor() {
    this.pointStore = [];
    this.timerStore = [];
    this.processInfoStore = [];
    this.webMemoryStore = [];
    this.storedStart = {};
    this.illegalStatCount = {
      count: 0,
      lastOccurredTime: Date.now(),
    };
    this.countTaskNumStat = { lstReport: Date.now() };
  }
}

type InnerPerfPointHandleType = { value: PerformancePointType; type: PerformanceTypeDef; key: string };

class PerformanceImpl implements PerformanceApi {
  name: string;

  deviceConfig?: DeviceInfo;

  systemApi: SystemApi;

  storeApi: DataStoreApi;

  dataTracker: DataTrackerApi;

  loggerTracker: DataTrackerApi;

  actionStore: ActionStore;

  longTaskObserving: boolean;

  productAuth: ProductAuthApi;

  contactApi: ContactAndOrgApi;

  /**
   * @description: 是否上传监控数据
   * @param {*}
   * @return {*}
   */
  private eagleMonitor: boolean;

  // /**
  //  * @description: 默认记录项, 由于time是公共方法，会经常改写此值
  //  * @param {*}
  //  * @return {*}
  //  */
  // defaultTimerName: string;

  /**
   * @description: 内存中有多少条记录，到100条上传
   */
  logLeng: number;

  /**
   * @description: 上一次上传的时间
   */
  private lastUploadTime: number;

  /**
   * 最后一次记录时间
   * @private
   */
  private lastRecordTime: number;

  readonly MAX_UPLOAD_SPAN: number = 3 * 60 * 1000;

  readonly MAX_HANDLE_BATCH = 40;

  readonly MAX_PROCESS_INFO_STORE_NUM = 3;

  readonly MAX_WEB_MEMORY_STORE_NUM = 3;

  readonly MAX_SEND_BATCH = 10; // 一次最多发几条

  readonly COMMON_TIME_TO_LIVE = 10 * 60 * 1000;

  readonly MAX_TIME_SPAN_TO_RECORD = 24 * 3600 * 1000;

  private readonly pageName: string;

  private readonly pid: number;

  private readonly counterKeys: Map<string, string>;

  private switch = false;

  constructor() {
    this.eagleMonitor = true;
    this.logLeng = 0;
    this.name = apis.performanceImpl;
    // this.defaultTimerName = '';
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.dataTracker = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
    this.loggerTracker = api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;
    this.productAuth = api.requireLogicalApi(apis.productAuthApiImpl) as ProductAuthApi;
    this.lastUploadTime = Date.now();
    this.lastRecordTime = Date.now();
    this.actionStore = new ActionStore();
    this.longTaskObserving = false;
    this.counterKeys = new Map<string, string>();
    this.pageName = getPageName();
    this.pid = isElectron() && window.process ? window.process.pid : -1;
    this.contactApi = api.requireLogicalApi(apis.contactApiImpl) as ContactAndOrgApi;
    // Object.keys(AllStatType).forEach(k => {
    //   const perfType = AllStatType[k];
    //   if (perfType.type === 'count') {
    //     this.counterKeys.add(k);
    //   }
    // });
  }

  beforeUpload(flush?: boolean) {
    if (inWindow()) {
      // if (this.uploadTimer) window.clearTimeout(this.uploadTimer);
      // 强制清空 或 超过最大存储数量 或 超过时间间隔
      if (flush || this.logLeng >= this.MAX_HANDLE_BATCH || this.lastRecordTime - this.lastUploadTime > this.MAX_UPLOAD_SPAN) {
        this.uploadLog();
      }
    }
  }

  /**
   * start节点无需额外判断，只需要将数据压栈，
   * 待到end节点时，出栈最近的一个start,
   * 如无法出栈start, 则丢弃end ,记录失败数 +1
   * 如果出栈后start无异常标记，且栈为空，则正常匹配了一对开始和结束数据，记录上报数据
   * 否则如果出栈后栈仍有前置节点，则记录此记录为异常记录，异常记录仍可上报，在key上添加"$err" 以示区分，且此栈内所有前置节点需要标记为异常
   * 此外为了减少异常数据，事件设置最大ttl,出栈的start的记录如在ttl外，则视为无法出栈start, 此时移除所有栈内元素
   * @description: 开始记录 statKey + statSubKey 作为 performanceLog key
   * @return {*}
   * @param timeParams
   */
  async time(timeParams: TimerParams) {
    try {
      const { statKey = '', statSubKey = '', params } = timeParams;
      const curTimeItem = logItem({ statKey, statSubKey, params });
      const { key, performanceLog = {}, timerLogs: originTimeLogs } = await this.validateParamGetLogs(timeParams);
      if (!key) {
        return;
        // throw new Error('lack statKey');
      }
      const timeLogger = originTimeLogs || [];
      timeLogger.push(curTimeItem);
      performanceLog[key] = timeLogger;
      this.putPerformanceLog(performanceLog, statKey);
      console.log('[pref] start time logger ', timeLogger);
      // window.performance.mark();
      // this.defaultTimerName = key;
      // const performanceLog: PerformanceType = await this.getPerformanceLog();
      // if (timerLogs) {
      //   // const timerLogs = performanceLog[key] as PerformanceTimerType[];
      //   const timer = timerLogs.find(item => item && item.recording);
      //   const curTimer = curTimeItem;
      //   if (timer) {
      //     // 有正在记录的 timer 为了数据准确性 本条变成脏数据，并且存在的这条也要改成脏数据
      //     timer.dirty = true;
      //     timer.recording = false;
      //     // 在end的时候需对应滤掉 所以不能直接忽略
      //     curTimer.dirty = true;
      //     curTimer.recording = false;
      //   }
      //   // 脏end没有被清空 开始了新的start
      //   if (timerLogs.some(item => item.dirty)) {
      //     curTimer.dirty = true;
      //     curTimer.recording = false;
      //   }
      //   performanceLog[key].push(curTimer);
      // } else {
      // performanceLog[key] = [curTimeItem];
      // }
      // storeApi.put('performanceLog', JSON.stringify(performanceLog));
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * 逻辑与end相仿，每次记录完毕更新start值为当前时间戳
   * @description: 记录中打点,
   * @param {TimerParams} params
   * @return {*}
   */
  async timeLog(params?: TimerParams) {
    // try {
    //   const { timerLogs } = await this.validateParamGetLogs(params, undefined); // 调用会穿插其他打点，无法保障timeLog一定会紧随最初的time
    //   if (!timerLogs || timerLogs.some(item => item && item.type !== 'timer')) {
    //     return;
    //     // throw new Error('can not find log');
    //   }
    //   const timer = (timerLogs as PerformanceTimerType[]).find(item => item && item.recording);
    //   if (timer) {
    //     const logTime = new Date().getTime();
    //     timer.log.push([logTime, logTime - timer.start]);
    //     // return;
    //   }
    // } catch (e) {
    //   console.warn(e);
    // }
    console.log(params);
    throw new Error('not implemented');
  }

  /**
   * 参见time函数逻辑说明
   * @description: 记录结束
   * @param {TimerParams} params 结束点参数，statKey 和 subStatKey 需要和 time调用时完全一致，才能配对记录成功
   * @param noReport 传入true,会取出start的记录，但是不上报
   * @return {*}
   */
  async timeEnd(params: TimerParams, noReport?: boolean) {
    try {
      const now = Date.now();
      const { timerLogs, performanceLog = {}, perfType, key } = await this.validateParamGetLogs(params, undefined);
      const payload = params.params || {};
      if (!timerLogs || !perfType || !key) {
        return;
        // throw new Error('can not find timer');
      }
      const ttl = perfType.ttl || this.COMMON_TIME_TO_LIVE;
      const timer = timerLogs.pop() as PerformanceTimerType;
      if (!timer) {
        // 栈内没有可用点，表明有数据丢失
        console.warn('[perf] no start point error record :', params);
        this.recordIllegalEvent();
      } else if (timer && timerLogs.length === 0 && !timer.dirty && now - timer.start < ttl) {
        // 正常情形，timeLogs内有且只有一个正常配对的start点, 且该start点时间在合理范围内
        timer.recording = false;
        timer.end = now;
        timer.value = timer.end - timer.start;
        timer.params = { ...timer.params, ...payload };
        if (timer.value < this.MAX_TIME_SPAN_TO_RECORD) {
          if (!noReport) {
            this.actionStore.timerStore.push(timer);
            this.logLeng += 1;
          }
        }
        console.log('[perf] normal time log:', timer);
      } else if (timer) {
        // 有多余一个剩余的start点，或当前点被标记为dirty
        if (now - timer.start < ttl) {
          // 起点未超时 ， 记录脏记录上报，上报脏记录会在statkey后增加 $err后缀，区分于原始统计key
          timer.recording = false;
          timer.end = now;
          timer.value = timer.end - timer.start;
          // this.logLeng += 1;
          timer.dirty = true;
          timer.params = { ...timer.params, ...payload };
          if (timer.value < this.MAX_TIME_SPAN_TO_RECORD) {
            if (!noReport) {
              this.actionStore.timerStore.push(timer);
              this.logLeng += 1;
            }
          }
          console.log('[perf] illegal time log:', timer);
        } else {
          // 起点超时，记录异常
          console.warn('[perf] timeout point error record :', params);
          if (!noReport) {
            this.recordIllegalEvent();
          }
        }
        if (timerLogs.length > 0) {
          // 清理开始节点栈
          const newTimeLogs = this.cleanTimeLogger(timerLogs, now, ttl);
          performanceLog[key] = newTimeLogs;
        }
      }
      this.putPerformanceLog(performanceLog, params.statKey);
      this.lastRecordTime = Date.now();
      if (!noReport) {
        this.beforeUpload(params.flushAndReportImmediate);
      }
      // 记录中存在脏数据 需要清除
      // const dirtyIndex = (timerLogs as PerformanceTimerType[]).findIndex(item => item && item.dirty);
      // if (dirtyIndex !== -1) {
      //   delete timerLogs[dirtyIndex];
      //   this.putPerformanceLog(performanceLog);
      //   return;
      // }
      // const timer = (timerLogs as PerformanceTimerType[]).find(item => item && item.recording);
      // if (timer) {
      //   timer.recording = false;
      //   timer.end = new Date().getTime();
      //   this.logLeng += 1;
      //   // 合并 time 和 timeend 的params
      //   timer.params = { ...timer.params, ...payload };
      //   this.putPerformanceLog(performanceLog);
      //   this.lastRecordTime = Date.now();
      //   this.beforeUpload();
      // }
    } catch (e) {
      console.warn(e);
    }
  }

  private cleanTimeLogger(timerLogs: any, now: number, ttl: number) {
    const lastIdx = timerLogs.length - 1;
    let expiredStartIdx = -1;
    for (let idx = lastIdx; idx >= 0; idx -= 1) {
      const item = timerLogs[idx] as PerformanceTimerType;
      if (now - item.start < ttl) {
        // 未过期的节点标记为异常
        item.dirty = true;
      } else {
        // 过期节点直接删除,如果当前节点已经过期，那更早push进来的节点也一定过期了
        expiredStartIdx = idx + 1;
        break;
      }
    }
    if (expiredStartIdx > 0) {
      const newTimeLogs = timerLogs.slice(expiredStartIdx);
      return newTimeLogs;
    }
    return timerLogs;
  }

  async saveLog(param?: (PerformanceTimerType | PerformancePointType)[]) {
    const addLogs = param || this.buildAddLogs();
    try {
      if (addLogs && addLogs.length > 0) {
        const data = JSON.stringify(addLogs);
        if (isElectron() && window.electronLib) {
          await window.electronLib.storeManage.set('performanceLog', 'noReportLog', data);
        } else {
          await this.storeApi.put('performanceLog-noReportLog', data, { noneUserRelated: true });
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // 性能log存储
  private putPerformanceLog(performanceLog: PerformanceType, statKey?: string, pgName?: string) {
    if (!performanceLog) return;
    if (statKey && AllStatType[statKey] && !AllStatType[statKey].crossWindow) {
      this.actionStore.storedStart = performanceLog;
    } else {
      const data = JSON.stringify(performanceLog);
      const inElectron = this.systemApi.isElectron() && window.electronLib;
      if (!inElectron) {
        this.storeApi.put('performanceLog' + (pgName || ''), data).then();
      } else {
        window.electronLib.storeManage.set('performanceLog', pgName || 'log', data).then();
      }
    }
    console.log('[perf] put new record for ' + statKey, performanceLog);
  }

  // performanceLog: PerformanceType; 所有记录 statKey + statSubKey 作为 key
  /**
   * @description: 获取在store里面的 performanceLog
   * @return {*}
   * @param pgName 部分数据为了防止全局修改造成冲突，需要适用pageName隔离
   */
  async getPerformanceLog(pgName?: string) {
    const inElectron = this.systemApi.isElectron() && window.electronLib;
    let storePerformanceLog;
    if (!inElectron) {
      const sync = await this.storeApi.get('performanceLog' + (pgName || ''));
      if (sync && sync.suc && sync.data) {
        storePerformanceLog = sync.data;
      }
    } else {
      storePerformanceLog = await window.electronLib.storeManage.get('performanceLog', pgName || 'log');
    }
    let performanceLog: PerformanceType = {};
    if (storePerformanceLog) {
      performanceLog = JSON.parse(storePerformanceLog);
    }
    return performanceLog;
  }

  /**
   * @description: 记录打点前进行参数验证，并返回通用数据
   * @param {TimerParams} params
   * @param {string} okey
   * @param oPerformanceLog 已经获取到的performance log,便于批量调用时不再获取
   * @return {*}
   */
  async validateParamGetLogs(params: TimerParams | PointParams | undefined, okey?: string, oPerformanceLog?: PerformanceType) {
    const { key, perfType } = this.testKey(params, okey);
    if (!perfType || !key) {
      return {};
    }
    const performanceLog: PerformanceType = oPerformanceLog || (perfType.crossWindow ? await this.getPerformanceLog() : this.actionStore.storedStart) || {};
    const timerLogs = performanceLog[key];
    // if (!timerLogs) {
    //   return { key, performanceLog };
    //   // throw new Error('can not find timer');
    // }
    return {
      timerLogs,
      performanceLog,
      key,
      perfType,
    };
  }

  private testKey(params: TimerParams | PointParams | undefined, okey?: string) {
    let key = okey?.toLowerCase();
    if (params && params.statKey) {
      const subkey = params.statSubKey?.toLowerCase() || '';
      key = params.statKey.toLowerCase() + subkey;
      // throw new Error('lack statKey');
    } else {
      return {};
    }
    const retKey = key && /^[$a-z0-9_.-]+$/.test(key) ? key : undefined;
    const perfType = AllStatType[params.statKey];
    if (perfType === undefined) {
      return {};
    }
    return { key: retKey, perfType };
  }

  /**
   * 校验PointParam是否合法
   * 目前主要是通过 类型配置的 checkFn 来做校验
   * @param param
   * @returns
   */
  private checkPointParam(param: PointParams): boolean {
    const { statKey } = param;
    const statsKeyConfig = AllStatType[statKey];
    if (!statsKeyConfig) {
      // 没有注册的类型，直接校验不通过
      return false;
    }
    const configCheckFn = statsKeyConfig.checkFn;
    if (typeof configCheckFn === 'function') {
      const result = configCheckFn(param);
      return result;
    }
    return true;
  }

  /**
   * 普通单点记录无状态，不需要额外查找关联记录，故可批量记录到数组内，按规则整体上报即可
   * 增量类型单点需要适用当前值减去前值记录，故需要额外处理（type.increasingRecord === true）
   * 1
   * 2：当前值，例如当前内存占用等信息；单位：内存占用：Byte
   * 3、百分比，例如cpu占用等信息
   * 5、速度值，例如 kb/s等值
   * @param {PointParams} params
   * @return {*}
   */
  async point(params: PointParams | PointParams[]) {
    try {
      // const { timerLogs = [], performanceLog = {}, key } = await this.validateParamGetLogs(params);
      // if (!key) return;
      const allParam = Array.isArray(params) ? params : [params];
      const { item, increasingItem, flush } = allParam.reduce(
        (prev, param) => {
          const { key, perfType } = this.testKey(param);
          if (!key || !this.checkPointParam(param) || !perfType) {
            return prev;
          }
          const pointType = pointItem(param);
          if (perfType.increasingRecord) {
            prev.increasingItem.push({ value: pointType, type: perfType, key });
          } else {
            prev.item.push(pointType);
          }
          prev.flush = prev.flush || !!param.flushAndReportImmediate;
          // return pointItem(param);
          return prev;
        },
        { item: [] as PerformancePointType[], increasingItem: [] as InnerPerfPointHandleType[], flush: false }
      );
      if (item.length > 0) {
        this.logLeng += item.length;
        this.actionStore.pointStore.push(...item);
        this.lastRecordTime = Date.now();
        this.beforeUpload();
      }
      if (increasingItem.length > 0) {
        const crossWinPerLog: PerformanceType = await this.getPerformanceLog();
        const reportItem = increasingItem.map(it => {
          const { value, type: perfType, key } = it;
          const performanceLog = perfType.crossWindow ? crossWinPerLog : this.actionStore.storedStart;
          // performanceLog || (perfType.crossWindow ? performanceType : this.actionStore.storedStart) || {};
          const timerLogs = performanceLog[key];
          const prevItem = timerLogs.pop() as PerformancePointType;
          if (prevItem) {
            value.value -= prevItem.value;
          }
          timerLogs.push({ ...value });
          performanceLog[key] = timerLogs;
          return value;
        });
        // const reportItem = await Promise.all(allPromises);
        this.logLeng += reportItem.length;
        this.actionStore.pointStore.push(...reportItem);
        // if (performanceLog) {
        //   performanceLog[key] = timerLogs;
        // }
        if (crossWinPerLog) this.putPerformanceLog(crossWinPerLog);
        this.lastRecordTime = Date.now();
        this.beforeUpload(flush);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // 计数逻辑
  // 计数逻辑和周期相关，需要确认统计周期，然后在该周期内每次调用此函数，计数+n (param.value标识增加数量) ，周期末尾上报统计计数并清零，
  // 全局计数需要保障并发正确性，故每个页面需要单独计数，更新数据时也只更新本页面内部数据,
  // TODO : 全局性计数上报，需要在单一任务中进行上报，并及时清理所有页面的计数，需要后台任务和storeManager.getAndClear() 支持
  async count(params: PointParams | PointParams[]) {
    const handleItems = (crossWinItem: InnerPerfPointHandleType[], crossPerformanceLog: PerformanceType) => {
      crossWinItem.forEach(it => {
        const { value, key } = it;
        this.counterKeys.set(key, value.statKey);
        // performanceLog = performanceLog || (perfType.crossWindow ? await this.getPerformanceLog() : this.actionStore.storedStart) || {};
        const logger = crossPerformanceLog[key] || [];
        if (logger.length > 0) {
          logger[0].value = (logger[0].value || 0) + value.value;
        } else {
          logger.push(value);
        }
        crossPerformanceLog[key] = logger;
      });
    };

    try {
      const allParam = Array.isArray(params) ? params : [params];
      const { item, crossWinItem } = allParam.reduce(
        (prev, param) => {
          const { key, perfType } = this.testKey(param);
          if (!key || !this.checkPointParam(param) || !perfType) {
            return prev;
          }
          // const {
          //   perfTYpe, key, timerLogs, performanceLog
          // } = this.validateParamGetLogs(param);
          const pointType = pointItem(param);
          const handleItem = { value: pointType, type: perfType, key };
          if (perfType.crossWindow) {
            prev.crossWinItem.push(handleItem);
          } else {
            prev.item.push(handleItem);
          }
          // return pointItem(param);
          return prev;
        },
        { item: [] as InnerPerfPointHandleType[], crossWinItem: [] as InnerPerfPointHandleType[] }
      );
      if (item.length > 0) {
        const performanceLog: PerformanceType = this.actionStore.storedStart;
        handleItems(item, performanceLog);
      }
      if (crossWinItem.length > 0) {
        const crossPerformanceLog: PerformanceType = await this.getPerformanceLog(this.pageName + '-' + this.pid);
        handleItems(crossWinItem, crossPerformanceLog);
        if (crossPerformanceLog) this.putPerformanceLog(crossPerformanceLog, undefined, this.pageName + '-' + this.pid);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * @description: 获得特定 或 所有记录
   * @param {TimerParams} params
   * @return {*}
   */
  // eslint-disable-next-line class-methods-use-this
  async getTimerLog(params: TimerParams): Promise<TimerLogger | undefined> {
    const { timerLogs } = await this.validateParamGetLogs(params);
    const timerTypes = this.actionStore.timerStore.filter(it => it.statKey === params.statKey && (!params.statSubKey || params.statSubKey === it.statSubKey));
    const pointTypes = this.actionStore.pointStore.filter(it => it.statKey === params.statKey && (!params.statSubKey || params.statSubKey === it.statSubKey));
    // if (!params || !params.statSubKey) {
    //   return performanceLog;
    // }
    // const subkey = params.statSubKey || '';
    // const key = params.statKey + subkey;
    // if (Object.prototype.isPrototypeOf.hasOwnProperty.call(performanceLog, key)) {
    //   return performanceLog[key];
    // }
    return [...(timerLogs || []), ...timerTypes, ...pointTypes];
  }

  private buildAddLogs(): (PerformanceTimerType | PerformancePointType)[] {
    const addLogs = [];
    if (this.actionStore.timerStore && this.actionStore.timerStore.length > 0) {
      addLogs.push(...this.actionStore.timerStore);
    }
    if (this.actionStore.pointStore && this.actionStore.pointStore.length > 0) {
      addLogs.push(...this.actionStore.pointStore);
    }
    return addLogs;
  }

  /**
   * @description: 上传记录
   * @param {*}
   * @return {*}
   */
  uploadLog() {
    // const performanceLog: PerformanceType = await this.getPerformanceLog();
    // const allLogs = Object.values(performanceLog)
    //   .filter(it => !!it)
    //   .reduce((prev, next) => {
    //     prev.push(...next.filter(it => !!it));
    //     return prev;
    //   }, []);
    const addLogs = this.buildAddLogs();
    console.log('[perf] upload logs :', addLogs);
    this.doUploadLogs(addLogs);
    this.actionStore.pointStore = [];
    this.actionStore.timerStore = [];
    // 没有end 的数据
    // const unFinishLog: PerformanceType = {};
    // Object.keys(performanceLog).forEach(key => {
    //   const value = performanceLog[key].filter(item => item && item.type === 'timer' && !item.end);
    //   if (value.length) unFinishLog[key] = value;
    // });
    // this.putPerformanceLog(unFinishLog);
    this.logLeng = 0;
    this.lastUploadTime = Date.now();
  }

  private doUploadLogs(addLogs: PerformanceLogType[]) {
    const userInfo: User | undefined = this.systemApi.getCurrentUser();
    let start = 0;
    const count = addLogs.length;
    const mainAccount = this.systemApi.getCurrentUser()?.id || '';

    while (start < count) {
      const payload: unknown[] = [];
      addLogs.slice(start, start + this.MAX_SEND_BATCH).forEach(item => {
        const { enableRecordSubAccount = true } = item.params || { enableRecordSubAccount: true };
        const isSubAccount = item.params?._account && item.params?._account !== mainAccount;

        if (isSubAccount && !enableRecordSubAccount) {
          return;
        }

        const subAccountSuffix = isSubAccount ? `_subaccount:${item.params?._account}` : '';
        const payloadItem = {
          statKey: item.statKey + (item.dirty ? '$err' : '') + subAccountSuffix,
          statSubKey: item.statSubKey || '',
          ext: item.params || null,
          valueType: item.valueType,
          value: item.value,
          time: item.start,
        };
        payload.push(payloadItem);
      });
      // const value = item.type === 'timer' ? item.end - item.start : item.value;
      const res = {
        $_lingxi: {
          _accountId: userInfo?.accountMd5,
          _siriusVersion: window.siriusVersion,
          _platform,
          _domain: userInfo?.domain,
          payload,
        },
      };
      try {
        if (this.eagleMonitor) {
          this.dataTracker.track(`siruis_desktop_${_platform}_perf`, res);
        }
        // 所有数据进入log日志 , 由于 dataTracker 默认调用 loggerTacker ，无需二次调用
        // this.loggerTracker.track(`siruis_desktop_${_platform}_perf`, res);
      } catch (e) {
        console.warn(e);
      }
      start += this.MAX_SEND_BATCH;
    }
  }

  init() {
    return this.name;
  }

  afterInit() {
    this.systemApi.getDeviceInfo().then(res => {
      this.deviceConfig = res;
    });
    if (this.systemApi.getCurrentUser()) {
      this.getSwitch().then();
    }
    this.systemApi.intervalEvent({
      eventPeriod: 'extLong',
      seq: 0,
      handler: (ev: IntervalEventParams): void => {
        if (ev.seq % 5 === 0 && ev.seq > 3) {
          // if (ev.seq) {
          if (this.systemApi.isElectron() && window.electronLib) {
            this.handleProcessInfo().then();
          } else {
            this.handleWebMemory();
          }
        }
        if (ev.seq % 4 === 0 && ev.seq > 3) {
          this.periodTaskHandle().then();
        }
        if (ev.seq % 10 === 2 && ev.seq > 1) {
          this.logLongTaskToServer();
          this.getSwitch().then();
        }
        if (ev.seq % 3 === 0 && ev.seq > 3) {
          this.handleRemainLog();
        }
        // 暂时先调为5
        if (ev.seq % 5 === 0 && ev.seq > 3) {
          this.sendProcessMemoryAndCpuInfos();
        }
      },
    });

    // setTimeout(() => {
    //   this.startCanUserClimbWallTask();
    // }, 10000);

    return this.name;
  }

  private async getSwitch() {
    if (!process.env.BUILD_ISPREVIEWPAGE) {
      this.switch = (await this.productAuth.getABSwitch('contact_cache')) as boolean;
    }
  }

  afterLoadFinish() {
    return this.name;
  }

  afterLogin() {
    if (this.systemApi.getCurrentUser()) {
      this.getSwitch().then();
    }
    return this.name;
  }

  beforeLogout() {
    this.actionStore = new ActionStore();
    // 清空存储
    this.putPerformanceLog({});
    this.putPerformanceLog({}, this.pageName);
    // if (this.systemApi.isElectron() && window.electronLib) {
    //   window.electronLib.storeManage.set('performanceLog', 'log', '{}').then();
    // } else {
    //
    // }
    return this.name;
  }

  onFocus() {
    return this.name;
  }

  onPathChange() {
    return this.name;
  }

  // private reportWebPerf() {
  //   console.log('start record web perf');
  //   this.handleWebMemory(true);
  // }

  handleWebMemory() {
    const { memory } = window.performance;
    const { jsHeapSizeLimit, totalJSHeapSize, usedJSHeapSize } = memory;
    const repObj = { jsHeapSizeLimit, totalJSHeapSize, usedJSHeapSize };
    const resObj = {
      webMemory: (repObj as { [key: string]: any }) || {},
    };
    // 加入webMemoryStore
    this.actionStore.webMemoryStore.push(resObj);
    if (this.actionStore.webMemoryStore.length > this.MAX_WEB_MEMORY_STORE_NUM) {
      this.handleStore(this.actionStore.webMemoryStore as unknown as storeItem[]);
      // 置空
      this.actionStore.webMemoryStore = [];
    }
  }

  /* 'pr_blink_mem', , 'pr_io_counts' */
  readonly processInfoTagArr = ['pr_heap_mem', 'pr_proc_mem', 'pr_cpu_rate'];

  // 获取 分值 中位数 90位数 99位数...
  // eslint-disable-next-line class-methods-use-this
  calcMedian(originArr: number[], m: number) {
    const arr = originArr.sort((a, b) => a - b);
    const tmp = (arr.length - 1) * m;
    const gw = Math.floor(tmp);
    const xw = tmp.toString().includes('.') ? tmp - gw : 0;
    const res = (1 - xw) * arr[gw] + xw * arr[gw + 1];
    return Number(res.toFixed(2));
  }

  // 按照store维度
  // 处理store 得出 平均数 中位数 ...
  handleStore(storeArr: storeItem[]) {
    console.log('handleStorehandleStore', storeArr);
    // 属性数组 第一层为主键 第二层key为子键后缀
    const arrayObj: {
      [key: string]: {
        [key: string]: {
          [key: string]: any;
        };
      };
    } = {};
    // 遍历数组 生成基本结构
    storeArr.forEach((item: any) => {
      const curInfoObj = item;
      Object.keys(curInfoObj).forEach(key => {
        const curPerfObj = curInfoObj[key];
        Object.keys(curPerfObj).forEach(key1 => {
          if (!arrayObj[key]) {
            arrayObj[key] = {};
          }
          const curVal = curPerfObj[key1];
          const isNum = typeof curVal === 'number';
          if (!arrayObj[key][key1]) {
            // 仅限数字
            arrayObj[key][key1] = {
              valArr: [curVal],
              ...(isNum ? { total: curVal } : {}),
            };
          } else {
            arrayObj[key][key1].valArr.push(curVal);
            if (isNum) {
              arrayObj[key][key1].total += curVal;
            }
          }
        });
      });
    });

    console.log('handleStorehandleStore111', arrayObj);
    const retArr: PointParams[] = [];
    // 遍历 获取平均值 等
    Object.keys(arrayObj).forEach(key => {
      const curPerfObj = arrayObj[key];
      Object.keys(curPerfObj).forEach(key1 => {
        const curVal = curPerfObj[key1];
        const { total, valArr } = curVal;
        const statKey = keyMap[key as keyMapKeyType];
        if (!statKey) return;
        const statSubKeySuffix = key1.toLowerCase();
        const { pageName } = this;
        // 平均值
        retArr.push({
          statKey,
          statSubKey: pageName + '-' + statSubKeySuffix,
          value: total / (valArr as Array<number>)?.length,
          valueType: 2,
        });
        // 中位数
        retArr.push({
          statKey,
          statSubKey: pageName + '-50-' + statSubKeySuffix,
          value: this.calcMedian(valArr as Array<number>, 0.5),
          valueType: 2,
        });
        // 90位数
        retArr.push({
          statKey,
          statSubKey: pageName + '-90-' + statSubKeySuffix,
          value: this.calcMedian(valArr as Array<number>, 0.9),
          valueType: 2,
        });
        // 99位数
        retArr.push({
          statKey,
          statSubKey: pageName + '-99-' + statSubKeySuffix,
          value: this.calcMedian(valArr as Array<number>, 0.99),
          valueType: 2,
        });
      });
    });

    console.log('handleStorehandleStore222', retArr);
    if (retArr.length > 0) {
      this.point(retArr).then();
    }
  }

  // eslint-disable-next-line consistent-return
  async handleProcessInfo() {
    if (window.process) {
      return Promise.all([
        window.process.getHeapStatistics(),
        window.process.getProcessMemoryInfo(),
        window.isBridgeWorker ? window.process.getCPUUsage() : Promise.resolve({}),
      ]).then((res: any[]) => {
        console.log('handleProcessInfohandleProcessInfo', res);
        const resObj = {
          heapStatistics: res[0] || {},
          processMemoryInfo: res[1] || {},
          CPUUsage: res[2] || {},
        };
        // 加入processInfoStore
        this.actionStore.processInfoStore.push(resObj);
        if (this.actionStore.processInfoStore.length > this.MAX_PROCESS_INFO_STORE_NUM) {
          this.handleStore(this.actionStore.processInfoStore as unknown as storeItem[]);
          // 置空
          this.actionStore.processInfoStore = [];
        }
      });
    }
  }

  // private buildNumPointItemFromObj(prefix: string, value: Record<string, number>) {
  //   const ret: PointParams[] = [];
  //   Object.keys(value).forEach(it => {
  //     // 只处理number类型
  //     if (typeof value[it] === 'number' || (typeof value[it] === 'string' && /^[+-]?[0-9]+(\.[0-9]+)?$/i.test(String(value[it])))) {
  //       ret.push({
  //         statKey: prefix,
  //         statSubKey: this.pageName + '-' + it.toLowerCase(),
  //         value: Number(value[it]),
  //         valueType: 2,
  //       });
  //     }
  //   });
  //   return ret;
  // }

  private recordIllegalEvent() {
    this.actionStore.illegalStatCount.count += 1;
    const now = Date.now();
    if (now - this.actionStore.illegalStatCount.lastOccurredTime > this.MAX_UPLOAD_SPAN) {
      this.point({
        statKey: 'stat_illegal_count',
        params: { start: this.actionStore.illegalStatCount.lastOccurredTime, end: now },
        value: this.actionStore.illegalStatCount.count,
        valueType: 4,
      }).then();
      this.actionStore.illegalStatCount.lastOccurredTime = now;
      this.actionStore.illegalStatCount.count = 0;
    }
  }

  private async periodTaskHandle() {
    const crossPerformanceLog = (await this.getPerformanceLog(this.pageName + '-' + this.pid)) || {};
    const timerStartRecording = this.actionStore.storedStart;
    // 上报task_count
    const items: PerformancePointType[] = [];
    // await this.getPerformanceLog();
    this.counterKeys.forEach((statKey, key) => {
      const perfType = AllStatType[statKey];
      const element = perfType.crossWindow ? crossPerformanceLog[key] : timerStartRecording[key];
      if (element && element.length > 0) {
        const elItem = element.pop() as PerformancePointType;
        if (elItem.value !== 0) {
          items.push({ ...elItem });
          elItem.value = 0;
          elItem.start = Date.now();
          element.push(elItem);
        }
      }
    });
    if (items.length > 0) {
      this.point(items).then();
    }
    // 清理本地记录
    this.cleanTimeMarkStartRecording(timerStartRecording);
    // 清理全局记录
    this.cleanTimeMarkStartRecording(crossPerformanceLog);
    this.putPerformanceLog(crossPerformanceLog);
  }

  private cleanTimeMarkStartRecording(timerStartRecording: PerformanceType) {
    Object.keys(timerStartRecording).forEach(key => {
      const perfType = AllStatType[key];
      const ttl = perfType?.ttl || this.COMMON_TIME_TO_LIVE;
      const item = timerStartRecording[key];
      const newLogger = this.cleanTimeLogger(item, Date.now(), ttl);
      timerStartRecording[key] = newLogger;
    });
  }

  readonly keyConfigArr = [
    {
      name: '50-100',
      conditionFn: (val: number) => val >= 50 && val < 100,
    },
    {
      name: '100-300',
      conditionFn: (val: number) => val >= 100 && val < 300,
    },
    {
      name: '300-Bigger',
      conditionFn: (val: number) => val >= 300,
    },
  ];

  getConfigItem(duration: number) {
    return this.keyConfigArr.find(confItem => {
      try {
        const { conditionFn } = confItem;
        if (conditionFn && typeof conditionFn === 'function') {
          const result = conditionFn(duration);
          return result;
        }
        return false;
      } catch (ex) {
        console.error(ex);
      }
      return undefined;
    });
  }

  getKeyByDuration() {
    const pageName = getPageName();
    return {
      statKey: 'long_task_record_duration',
      statSubKey: `${pageName}` + (this.switch ? '' : '_B'),
    };
  }

  logLongTaskToServer() {
    if (this.longTaskObserving) return;
    const observer = new PerformanceObserver(list => {
      const longTaskEntries = list.getEntries();
      const items = [];
      for (let i = 0; i < longTaskEntries.length; i++) {
        // @todo longTask没有额外信息来指示哪个脚本的哪个方法导致的，后续可以调研下
        const currLongTaskEntry = longTaskEntries[i];
        console.log('[Long Task]', currLongTaskEntry);
        const { duration, startTime } = currLongTaskEntry;

        const configItem = this.getConfigItem(duration);
        if (configItem) {
          // if (this.actionStore.countTaskNumStat[configItem.name]) this.actionStore.countTaskNumStat[configItem.name] += 1;
          // else this.actionStore.countTaskNumStat[configItem.name] = 1;
          this.count({
            // start: Date.now(),
            statKey: 'long_time_task_count',
            statSubKey: this.pageName + '_' + configItem.name,
            value: 1,
            valueType: 4,
            // type: 'point',
          }).then();
        }
        const { statKey, statSubKey } = this.getKeyByDuration();
        if (statKey && duration > 50) {
          const needSendToServer = Math.random() > 0.9;
          if (!needSendToServer) {
            continue;
          }
          items.push(
            pointItem({
              // start: Date.now(),
              statKey,
              statSubKey,
              params: { startTime, uptime: window.process ? window.process.uptime() : -1 },
              value: duration,
              valueType: 2,
              // type: 'point',
            }) as PerformancePointType
          );

          let segmentSubKey = '';
          if (duration < 80) {
            segmentSubKey = 'lowest_duration';
          } else if (duration >= 80 && duration < 150) {
            segmentSubKey = 'normal_duration';
          } else if (duration >= 150) {
            segmentSubKey = 'highest_duration';
          }

          // 分段统计长任务
          items.push(
            pointItem({
              statKey,
              statSubKey: segmentSubKey,
              value: duration,
              valueType: 2,
              params: {
                startTime,
                uptime: window.process ? window.process.uptime() : -1,
              },
            })
          );
        }
      }
      this.point(items).then();
    });

    observer.observe({ entryTypes: ['longtask'] });
    this.longTaskObserving = true;
  }

  private async handleRemainLog() {
    let addLogs: (PerformancePointType | PerformanceTimerType)[] = [];
    try {
      if (isElectron() && window.electronLib) {
        const data = await window.electronLib.storeManage.get('performanceLog', 'noReportLog');
        if (data && typeof data === 'string' && data.length > 0) addLogs = JSON.parse(data) as (PerformancePointType | PerformanceTimerType)[];
      } else {
        const dt = await this.storeApi.get('performanceLog-noReportLog', { noneUserRelated: true });
        if (dt && dt.suc && dt.data) {
          addLogs = JSON.parse(dt.data) as (PerformancePointType | PerformanceTimerType)[];
        }
      }
    } catch (ex) {
      console.warn('[performance] remain log handle', ex);
    }
    if (addLogs && addLogs.length) {
      this.doUploadLogs(addLogs);
      this.saveLog([]).then();
    }
  }

  /**
   * 上报主进程，GPU，服务进程的CPU使用情况
   * @param processMetricList
   */
  private sendProcessCpuInfos(processMetricList: Array<Electron.ProcessMetric>) {
    const processTypeWhiteListMap: { [key: string]: boolean } = { Browser: true, GPU: true, Utility: true };
    const processTypeKeyMap: { [key: string]: string } = {
      Browser: 'main_process_cpu_used',
    };
    // 基本上市99线的值乘以7，时间间隔不变的话，应该数据量会很小。
    const processTypeCPULimitMap: { [key: string]: number } = {
      Browser: 700,
    };

    const pointList: PointParams[] = [];
    processMetricList.forEach(processMetric => {
      const processType = processMetric.type;
      if (processTypeWhiteListMap[processType]) {
        const performanceKey = processTypeKeyMap[processType];
        const percentCPUUsage = processMetric.cpu ? processMetric.cpu.percentCPUUsage : null;
        if (!percentCPUUsage) {
          return;
        }
        const statSubKey = processMetric.name ? processMetric.name + '_' + (processMetric.serviceName || '') : '';
        const percentCPUUsageNum = Number.parseFloat(Number(percentCPUUsage).toFixed(3));
        const minNum = processTypeCPULimitMap[processType];
        if (minNum) {
          if (percentCPUUsageNum && percentCPUUsageNum < minNum) {
            return;
          }
        }
        pointList.push({
          statKey: performanceKey,
          statSubKey,
          // CPU的使用率保留三位小数
          value: percentCPUUsageNum,
          valueType: 2,
        });
      }
    });

    if (pointList && pointList.length) {
      this.point(pointList).catch(err => {
        console.error('sendProcessCpuInfos error', err);
      });
    }
  }

  /**
   * 上报渲染进程数量
   * @param processMetricList
   */
  private sendRenderProcessCount(processMetricList: Array<Electron.ProcessMetric>) {
    const renderProcessType = 'Tab';
    const count = processMetricList.filter(processMetric => processMetric.type === renderProcessType).length;

    // 该条主要表示窗口数量，如果窗口数量小于10(99线)，应该是正常情况，不上报即可
    if (!count || count < 10) {
      return;
    }

    this.point({
      statKey: 'render_process_count',
      value: count,
      valueType: 2,
    }).catch(err => {
      console.error('sendRenderProcessCount error', err);
    });
  }

  /**
   * 获取windows的进程内存信息
   * @param processMetricList
   */
  private getWindowsProcessMemoryInfos(processMetricList: Array<Electron.ProcessMetric>) {
    const processTypeWhiteListMap: { [key: string]: boolean } = { Browser: true, GPU: true, Utility: true };
    const result: Array<IProcessMemoryInfo> = [];
    processMetricList.forEach(processMetric => {
      const processType = processMetric.type;
      if (!processTypeWhiteListMap[processType]) {
        return;
      }
      const privateBytes = processMetric.memory.privateBytes as number;
      // 转换为Mb
      const privateMb = Number.parseFloat((privateBytes / 1024).toFixed(2));
      result.push({
        type: processType,
        memoryUsed: privateMb,
        name: processMetric.name,
        serviceName: processMetric.serviceName,
      });
    });
    return result;
  }

  private sendTotalMemoryInfo(processMetricList: Array<Electron.ProcessMetric>) {
    if (!processMetricList) return;
    let sum = 0;
    processMetricList.forEach(processMetric => {
      const processMemoryUsed = processMetric.memory.privateBytes;
      if (processMemoryUsed) {
        sum += processMemoryUsed;
      }
    });
    if (!sum) {
      return;
    }
    const totalMemoryUsed = Number.parseFloat((sum / 1024).toFixed(2));
    // 小于2.5G(差不多99线)属于正常范围，先暂时过滤。
    if (totalMemoryUsed < 2560) {
      return;
    }
    this.point({
      statKey: 'total_process_memory_used',
      valueType: 2,
      value: totalMemoryUsed,
    }).catch(err => {
      console.error('sendTotalMemoryInfo Error', err);
    });
  }

  private sendProcessMemoryInfos(processMetricList: Array<Electron.ProcessMetric>) {
    const processMemoryInfos: Array<IProcessMemoryInfo> = this.getWindowsProcessMemoryInfos(processMetricList);
    const processTypeKeyMap: { [key: string]: string } = {
      Browser: 'main_process_memory_used',
      GPU: 'gpu_process_memory_used',
    };

    const processTypeKeyLimitMap: { [key: string]: number } = {
      Browser: 400,
      GPU: 500,
    };

    const pointList: PointParams[] = [];

    processMemoryInfos.forEach(processMemoryInfo => {
      if (!processMemoryInfo.memoryUsed) return;
      const processType = processMemoryInfo.type;
      const limitNum = processTypeKeyLimitMap[processType];
      if (limitNum) {
        const memoryUsedNum = processMemoryInfo.memoryUsed;
        if (memoryUsedNum && memoryUsedNum < limitNum) {
          return;
        }
      }
      const performanceKey = processTypeKeyMap[processType];
      if (!performanceKey) return;
      const statSubKey = processMemoryInfo.name ? processMemoryInfo.name + '_' + (processMemoryInfo.serviceName || '') : '';

      pointList.push({
        statKey: performanceKey,
        statSubKey,
        valueType: 2,
        value: processMemoryInfo.memoryUsed,
      });
    });

    if (pointList && pointList.length) {
      this.point(pointList).catch(err => {
        console.error('sendProcessMemoryInfos error', err);
      });
    }
  }

  /**
   * 上报其它进程的内存和CPU使用情况
   */
  private async sendProcessMemoryAndCpuInfos() {
    if (process.env.BUILD_ISWEB || process.env.BUILD_ISEDM) {
      return;
    }
    if (!this.systemApi.isMainPage()) {
      return;
    }

    const processMetricList = await window.electronLib.appManage.getAppMetrics();
    if (!processMetricList || !processMetricList.length) {
      return;
    }
    this.sendProcessCpuInfos(processMetricList);
    this.sendRenderProcessCount(processMetricList);
    this.sendProcessMemoryInfos(processMetricList);
    this.sendTotalMemoryInfo(processMetricList);
  }

  // // 首次启动，以及随后每小时检查一次，用户是否可以翻墙
  // private startCanUserClimbWallTask() {
  //   if (inEdm) {
  //     this.canUserClimbWallTest(true).catch();
  //     this.systemApi.intervalEvent({
  //       eventPeriod: 'extLong',
  //       seq: 0,
  //       handler: () => {
  //         this.canUserClimbWallTest().catch();
  //       },
  //     });
  //   }
  // }

  // private async canUserClimbWallTest(forceStart = false) {
  //   const EXECUTE_INTERVAL = 3600000;
  //   const LOCAL_KEY = 'WALL_TEST';
  //
  //   const localData = await this.storeApi.get(LOCAL_KEY);
  //   const lastExeCute = localData?.data ? +localData.data : 0;
  //   if (!lastExeCute || forceStart || Date.now() - lastExeCute >= EXECUTE_INTERVAL) {
  //     this.canUserClimbWall()
  //       .then(capable => {
  //         if (capable) {
  //           this.reportUserClimbWall(capable);
  //         }
  //         this.storeApi.put(LOCAL_KEY, Date.now() + '').catch(e => {
  //           console.error('[performance_impl] canUserClimbWallTest put error', e);
  //         });
  //       })
  //       .catch(e => {
  //         console.error('[performance_impl] canUserClimbWallTest error', e);
  //       });
  //   }
  // }

  // private canUserClimbWall(): Promise<boolean> {
  //   return new Promise(resolve => {
  //     const img = new Image();
  //     let timer: number | null = window.setTimeout(() => {
  //       resolve(false);
  //     }, 60000);
  //     img.onload = () => {
  //       resolve(true);
  //       if (timer) {
  //         clearTimeout(timer);
  //         timer = null;
  //       }
  //     };
  //     img.onerror = () => {
  //       resolve(false);
  //       if (timer) {
  //         clearTimeout(timer);
  //         timer = null;
  //       }
  //     };
  //     img.src = 'https://google.com/favicon.ico?' + Date.now();
  //   });
  // }

  // private async reportUserClimbWall(capable: boolean) {
  //   const currentUser = this.systemApi.getCurrentUser();
  //   if (currentUser) {
  //     const { domain, id: userId, company, prop } = currentUser;
  //     const attr = {
  //       capable,
  //       domain,
  //       userId,
  //       company,
  //       isWeb: !forElectron,
  //       osType,
  //       orgId: '',
  //     };
  //     if (prop?.contactId) {
  //       const contactInfo = await this.contactApi.doGetContactById(prop?.contactId);
  //       if (contactInfo && contactInfo[0]) {
  //         attr.orgId = (contactInfo[0].contact.enterpriseId || '') + '';
  //       }
  //     }
  //     this.dataTracker.track('can_user_climb_wall', attr);
  //   }
  // }
}

const performanceImpl: PerformanceApi = new PerformanceImpl();
api.registerLogicalApi(performanceImpl);
export default performanceImpl;
