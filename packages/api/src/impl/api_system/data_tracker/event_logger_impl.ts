import debounce from 'lodash/debounce';
import dayjs from 'dayjs';
import { LoggerApi } from '@/api/data/dataTracker';
import { apis, environment, URLKey } from '@/config';
import { ApiResponse, DataTransApi } from '@/api/data/http';
import { Api, resultObject, User } from '@/api/_base/api';
import { api } from '@/api/api';
import { EventApi } from '@/api/data/event';
import { DeviceInfo, SystemApi } from '@/api/system/system';
import { FeedbackApi, FeedbackOption, LogConfigOption } from '@/api/logical/feedback_log';
import { MailApi } from '@/api/logical/mail';
import { FileApi } from '@/api/system/fileLoader';
// import { MailConfApi } from '../../../api/logical/mail';
import { LoginApi } from '@/api/logical/login';
import { DataStoreApi } from '@/api/data/store';
import { toJson } from '@/api/util';
import { LogData } from './logger_model';
import { eventLoggerDbImpl } from './event_logger_db_helper';
import { wait } from '@/api/util/index';
import { ProductAuthApi } from '@/api/logical/productAuth';

// import { electronLib } from '../../../gen/bundle';
import { getOs } from '../../../utils/confOs';

const desktopOs = getOs() === 'mac' ? 'mac' : 'win';
const env = typeof environment === 'string' ? environment : 'local';
const isDev = !['test_prod', 'prod', 'prev'].includes(env);

interface LogWriteConfigItem {
  lstSetTime: number;
  cacheLimit: number;
  waitTrackList: Map<number | string, LogData | null>;
  LOG_DELAY: number;
  // 过期间隔
  expiredSpan: number;
  // 日志是否在执行写入
  flushing: boolean;
}

type LogWriteinConfig = Record<'high' | 'normal' | 'low', LogWriteConfigItem>;

class LoggerApiImpl implements LoggerApi {
  static expiredSpan = 3 * 60 * 1000;

  name: string;

  uuid?: string;

  // 是否在执行写日志
  flushing = false;

  eventApi: EventApi;

  systemApi: SystemApi;

  httpApi: DataTransApi;

  feedbackApi: FeedbackApi;

  mailApi: MailApi;

  fileApi: FileApi;

  // lastEvent: number;
  user?: User;

  isLogout: boolean;

  // mailConf: MailConfApi;
  loginApi: LoginApi;

  storeApi: DataStoreApi;

  private productAuthApi: ProductAuthApi;

  readonly logWriteinConfig: LogWriteinConfig = {
    high: {
      lstSetTime: Date.now(),
      cacheLimit: 20,
      waitTrackList: new Map(),
      expiredSpan: 30 * 1000,
      LOG_DELAY: 200,
      flushing: false,
    },
    normal: {
      lstSetTime: Date.now(),
      cacheLimit: 100,
      waitTrackList: new Map(),
      expiredSpan: 3 * 60 * 1000,
      LOG_DELAY: 1000,
      flushing: false,
    },
    low: {
      lstSetTime: Date.now(),
      cacheLimit: 40,
      waitTrackList: new Map(),
      expiredSpan: 8 * 60 * 1000,
      LOG_DELAY: 3000,
      flushing: false,
    },
  };

  // 普通日志上次写入时间
  readonly lstSetTime: number = Date.now();

  // 普通日志最大缓存条数
  loggerCacheLimit = 40;

  private winId = -2;

  private processId = 'unknown';

  private readonly LOG_DELAY = 1000;

  private eventDbLogger = eventLoggerDbImpl;

  private deviceInfo: DeviceInfo | undefined;

  // 静态实例
  private static _logger: LoggerApiImpl = new LoggerApiImpl();

  private lastEventTime = 0;

  readonly platform: string = process.env.BUILD_ISELECTRON ? desktopOs : 'web';

  private forbidden_writelog = false;

  // public static keyDeviceUUID: string = config('browerDeviceUUID') as string;

  trackCommonOption = {
    domain: '',
    orgName: '',
    threadMode: '',
    userAccount: '',
    logginStatus: '',
  };

  constructor() {
    this.name = apis.loggerApiImpl;
    this.eventApi = api.getEventApi();
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.httpApi = api.getDataTransApi();
    this.fileApi = api.getFileApi();
    this.feedbackApi = api.requireLogicalApi(apis.feedbackApiImpl) as unknown as FeedbackApi;
    this.mailApi = api.requireLogicalApi(apis.mailApiImpl) as unknown as MailApi;
    // this.mailConf = api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
    this.loginApi = api.requireLogicalApi(apis.loginApiImpl) as unknown as LoginApi;
    this.productAuthApi = api.requireLogicalApi(apis.productAuthApiImpl) as unknown as ProductAuthApi;

    this.isLogout = false;
    this.debounceDbLoggerPut = debounce(this.debounceDbLoggerPut, this.LOG_DELAY, { leading: true });
    // this.lastEvent = Date.now();
  }

  // 单实例
  public static getInstance(): LoggerApiImpl {
    return LoggerApiImpl._logger;
  }

  getUrl(url: URLKey) {
    return this.systemApi.getUrl(url);
  }

  parseResult(res: ApiResponse<any>) {
    return res.data;
  }

  catchError(reason: any) {
    return reason;
  }

  init(): string {
    if (this.systemApi.isElectron()) {
      this.systemApi.getCurrentWinInfo(true).then(currentWinInfo => {
        this.winId = currentWinInfo.webId;
      });
      if (window.process && window.process.pid) {
        this.processId = window.process.pid + ':' + window.process.ppid;
      }
    }
    this.systemApi.getDeviceInfo().then(value => {
      this.deviceInfo = value;
    });
    return this.name;
  }

  afterInit(): string {
    this.user = this.systemApi.getCurrentUser();
    this.uuid = this.storeApi.getUUID();
    if (!isDev) {
      this.systemApi.intervalEvent({
        seq: 0,
        eventPeriod: 'long',
        handler: ev => {
          if (ev.seq > 1) {
            this.track('tick', {}, 'low');
            this.forbidden_writelog = this.productAuthApi.getABSwitchSync('forbidden_writelog') as boolean;
          }
        },
      });
    }
    this.eventDbLogger.init();
    return this.name;
  }

  afterLogin(): string {
    this.user = this.systemApi.getCurrentUser();
    this.isLogout = false;
    this.eventDbLogger.init();
    return this.name;
  }

  afterLoadFinish(): string {
    if (!isDev) {
      this.logReport();
    }
    return this.name;
  }

  beforeLogout(): string {
    this.isLogout = true;
    this.eventDbLogger.close();
    return this.name;
  }

  /**
   * 日志召回功能
   * step0: 只在唯一后台执行
   * step1: 获取是否需要上传日志的配置 yes ? step2 : 结束
   * step2: 根据step1返回的时间段获取日志，注意electron和web的不同获取方式
   * step3: nos上传日志，返回文件名用于日志元数据上传接口
   * step4: 调用日志元数据上传接口进行日志上传
   */
  private logReport() {
    this.systemApi.intervalEvent({
      seq: 0,
      eventPeriod: 'extLong',
      handler: ev => {
        const seq = ev.seq || 0;
        if (seq > 0 && seq % 6 === 1) {
          this.getLogConfig({
            productId: process.env.BUILD_ISEDM ? 'fastmail' : 'sirius',
            platform: this.platform,
          }).then(res => {
            // 无数据或false，不上传日志
            if (res?.data?.statusSwitch) {
              this.startUploadLog(res?.data?.timeSpan, res?.data?.recallId);
            }
          });
        }
      },
    });
  }

  // 获取日志配置接口
  private getLogConfig(option: LogConfigOption) {
    return this.httpApi.get(this.getUrl('getLogConfig'), option, { contentType: 'json' }).then(this.parseResult).catch(this.catchError);
  }

  // 上传日志接口
  private uploadLog(option: FeedbackOption) {
    return this.httpApi.post(this.getUrl('uploadLog'), option, { contentType: 'json' }).then(this.parseResult).catch(this.catchError);
  }

  // 开始日志上传上报过程
  private async startUploadLog(timeSpan: number, recallId: string) {
    let logFile = new File([], '');
    let fileName = `clieng-log/sirius/${this.platform}/${this.user?.id}/${Date.now()}-0`;
    const period = timeSpan || 1;
    if (process.env.BUILD_ISELECTRON) {
      const res = await window.electronLib?.fsManage?.logsToArrayBuf(period);
      if (!res?.data) {
        return;
      }
      fileName = `${fileName}.zip`;
      logFile = new File([res?.data], fileName, { type: 'application/zip' });
    } else {
      const webLogMap = await this.getWebLogs(period * 24 * 3600 * 1000);
      const logBlobArray = [...webLogMap.values()];
      if (!logBlobArray || !logBlobArray.length) {
        return;
      }
      fileName = `${fileName}.log`;
      logFile = new File(logBlobArray, fileName);
    }
    const uploadRes = await this.uploadNosMediaOrLog(logFile, fileName, 'log');
    // 上传成功，开始上报
    if (uploadRes === 'success') {
      const deviceInfo = await this.systemApi.getDeviceInfo();
      const params = {
        productId: process.env.BUILD_ISEDM ? 'fastmail' : deviceInfo.p,
        recallId,
        deviceId: '',
        platform: this.platform,
        version: window?.siriusVersion,
        systemVersion: deviceInfo._systemVersion,
        email: this.user?.id || '',
        files: [
          {
            type: 'log',
            name: fileName,
            fileCreateTime: Date.now(),
            size: logFile.size,
          },
        ],
      };
      this.uploadLog(params);
    }
  }

  // web端获取日志的blob的方法
  async getWebLogs(period?: number) {
    const logMap = (await this.getLogger(period)) || {};
    const entries = Object.entries(logMap).map(item => {
      const [key, log] = item;
      const logsStr = (log || []).map(item => {
        try {
          item.data = JSON.parse(item.data);
        } catch (e) {}
        return JSON.stringify(item);
      });
      const r = navigator.appVersion.indexOf('Win') !== -1 ? '\r\n\n' : '\n\n';
      const blob = new Blob([logsStr.join(r)]);
      return [key, blob] as [string, Blob];
    });
    return new Map(entries);
  }

  // 上传方法，用于图片、视频及log文件上传nos
  async uploadNosMediaOrLog(file: File, fileName: string, type: string) {
    // 调用接口获取nos上传参数，包括桶名，对象名，凭证，分片大小
    const tokenRes = await this.feedbackApi.getNosToken({ fileName });
    if (tokenRes?.data) {
      // 上传地址
      const uploadUrl = this.systemApi.getUrl('mailAttachmentUploadHost') + tokenRes.data.bucketName + '/' + tokenRes.data.objectName;
      // 获取分片上传信息
      const shardObj = this.mailApi.buildAttachmentSliceUploader(
        {},
        {
          file: file as File,
          id: 0,
          type: type === 'log' ? type : 'mmc',
          fileName,
          fileSize: file.size,
        },
        tokenRes.data,
        tokenRes.data
      );
      // 上传
      const uploadRes = await this.fileApi.uploadPieceByPiece(
        uploadUrl,
        {
          fileName,
          file: file as File,
          fileSize: file.size,
        },
        shardObj
      );
      if (uploadRes?.statusText === 'OK') {
        return 'success';
      }
    }
    return 'fail';
  }

  private traceId = 'event-traceid-' + Date.now();
  private updateTraceIdToken: ReturnType<typeof setTimeout> | null = null;
  private traceIdMap: Map<
    string,
    {
      count: number;
      startEvent: string;
      startTime: number;
    }
  > = new Map();

  private formatContent(eventId: string, attributes: resultObject | undefined) {
    const now = attributes?.eventTime || Date.now();
    if (this.lastEventTime >= now) {
      this.lastEventTime = now;
      return undefined;
    }

    if (process.env.BUILD_ISLINGXI) {
      // const dateStr = this.formatTime(now);
      return <LogData>{
        date: now,
        user: this.user?.id,
        uuid: this.uuid,
        sid: this.user?.sessionId,
        eventId,
        pid: this.processId,
        winId: this.winId,
        data: attributes,
        curPath: window.location.pathname,
        appendix: attributes?.appendix,
      };
    }

    // 设置本次宏任务的traceId,根据traceId来记录一次宏任务中执行任务数量
    // 数量超过上限 上报一个用户日志
    this.updateTraceIdToken && clearTimeout(this.updateTraceIdToken);
    this.updateTraceIdToken = setTimeout(() => {
      this.traceIdMap.clear();
      this.traceId = 'event-traceid-' + Date.now();
      // 清理老traceIdMap
    }, 0);

    // 记录一次宏任务内日志数量和日志ID
    if (this.traceIdMap.has(this.traceId)) {
      const obj = this.traceIdMap.get(this.traceId)!;
      obj.count += 1;
      this.traceIdMap.set(this.traceId, obj);
    } else {
      this.traceIdMap.set(this.traceId, {
        count: 1,
        startEvent: eventId,
        startTime: Date.now(),
      });
    }

    const { startTime = 0, count = 0, startEvent = '' } = this.traceIdMap.get(this.traceId) || {};
    if (startTime && (count >= 100 || now - startTime > 2000)) {
      setTimeout(() => {
        const obj = {
          reason: count > 100 ? 'many' : 'slow',
          count,
          traceId: this.traceId,
          duration: now - startTime,
          startEventId: startEvent,
          endEvent: eventId,
        };
        // console.log('event_report_page_hang', obj);
        this.eventApi.sendSysEvent({
          eventName: 'toMuchOrToSlowLogger',
          eventData: obj,
        });
      }, 1000);
    }

    return <LogData>{
      date: now,
      user: this.user?.id,
      uuid: this.uuid,
      sid: this.user?.sessionId,
      eventId,
      pid: this.processId,
      winId: this.winId,
      data: attributes,
      curPath: window.location.pathname,
      appendix: attributes?.appendix,
      _traceId: this.traceId,
    };
  }

  private formatTime(now: Date) {
    return dayjs(now).format('YYYY-MM-DD HH:mm:ss');
  }

  track(eventId: string, attributes?: resultObject, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    // 服务端配置是否写DB。1.23版本灰度一部分domain 测试一下日志对
    if (this.forbidden_writelog) {
      return;
    }

    try {
      const data = this.formatContent(eventId, attributes);
      if (data) {
        const trackKey = `${eventId}_${data.date}`;

        this.cacheLog(trackKey, data, priority);
        this.checkFlush(priority);
      }
    } catch (e) {
      console.warn('[logger] error', e);
    }
    // }
  }

  private cacheLog(key: number | string, value: LogData, priority: 'high' | 'normal' | 'low') {
    const writeConfig = this.logWriteinConfig[priority];
    const { waitTrackList, cacheLimit } = writeConfig;

    // 防止重复添加，已经set过的key并正在flush处理时对应key的value 会被置为null
    if (waitTrackList.get(key) === undefined) {
      waitTrackList.set(key, value);
      // 写入完成之后才可以修改lstSetTime
      writeConfig.lstSetTime = Date.now();
    }

    // 如果日志写入的待写入的条数超过了缓存上限，则删除掉待写日志的attribute
    if (process.env.BUILD_ISEDM && waitTrackList.size >= 2 * cacheLimit) {
      waitTrackList.forEach(item => {
        item?.data && (item.data = 'attr hasbeen removed.');
      });
    }

    if (priority !== 'low') {
      return;
    }

    // 如果是低优级别的日志 & 超过日志数量=> 每次丢弃一半日志 直到日志数量少于上限
    while (waitTrackList.size > cacheLimit) {
      [...waitTrackList.keys()].forEach((loggerKey, index) => {
        if (index % 2) {
          waitTrackList.delete(loggerKey);
        }
      });
    }
  }

  /**
   * 统一执行flush前置条件判断，方便后续除track外的其他方法执行flush写入
   */
  private checkFlush(priority: 'high' | 'normal' | 'low') {
    // （每40条处理 || 最后一条添加时间与当前时间间隔超过预定时间） && 锁，当前不在写日志的过程中

    const { waitTrackList, lstSetTime, expiredSpan, cacheLimit, flushing } = this.logWriteinConfig[priority];

    // 如果当前优先级对应日志正在执行写入
    if (flushing || !waitTrackList || !waitTrackList.size) {
      return;
    }

    // 如果日志大于最大条数(lowerlog这个条件成立不了) || 已经超过了expriredSpan时间没有执行写入
    if (waitTrackList.size >= cacheLimit) {
      const hasExceedLimit = waitTrackList.size >= 2 * cacheLimit;
      this.syncFlush(priority, hasExceedLimit);
    } else if (lstSetTime + expiredSpan < Date.now()) {
      this.syncFlush(priority);
    }
  }

  requestIdleCallbackId: null | ReturnType<typeof requestIdleCallback> = null;

  asyncFlushHandler: null | ReturnType<typeof setTimeout> = null;
  /**
   *  异步写入日志，不占用主进程
   */
  syncFlush(priority: 'high' | 'normal' | 'low', isForce = false) {
    try {
      if (window?.requestIdleCallback) {
        this.requestIdleCallbackId && window.cancelIdleCallback(this.requestIdleCallbackId);
        const num = window.requestIdleCallback(() => {
          this.flush(priority);
        });
        if (!isForce) {
          this.requestIdleCallbackId = num;
        }
      } else {
        this.asyncFlushHandler && clearTimeout(this.asyncFlushHandler);
        const num = setTimeout(() => {
          this.flush(priority);
        }, 0);
        if (isForce) {
          this.asyncFlushHandler = num;
        }
      }
    } catch (error) {
      console.warn('log impl flush error', error);
    }
  }

  async flush(priority: 'high' | 'normal' | 'low' = 'normal') {
    try {
      await this.flushAndRecordEvent(priority);
    } catch (ex) {}

    const logWriteConfigItem = this.logWriteinConfig[priority];
    logWriteConfigItem.flushing = false;
  }

  // web上获取日志
  getLogger(period?: number, endTimestamp?: number): Promise<Record<string, resultObject[] | undefined>> {
    return this.eventDbLogger.getByPeriod(period, endTimestamp);
  }

  private debounceDbLoggerPut(data: LogData[], priority: string) {
    this.eventDbLogger.put(data, priority);
  }

  private async flushAndRecordEvent(priority: 'high' | 'normal' | 'low') {
    const logWriteinConfigItem = this.logWriteinConfig[priority];

    const { flushing, waitTrackList } = logWriteinConfigItem;

    if (flushing) {
      return Promise.reject(new Error('日志写入正在进行中'));
    }

    console.warn('[event_logger]flushAndRecordEvent.true', priority, logWriteinConfigItem, this.logWriteinConfig);

    const inElectron = process.env.BUILD_ISELECTRON && window.electronLib;

    // 方法锁
    logWriteinConfigItem.flushing = true;

    const dtMapInElectron = new Map<string, string[]>();
    const dtMapInWeb = new Map<string, LogData[]>();
    // 高优或者低幼日志写入到单独的文件中去
    const defaultAppendix = priority !== 'normal' ? priority : '__default';

    // 遍历加工过的日志key集合
    const used: (string | number)[] = [];
    /* for (const [key, value] of this.waitTrackList) */
    waitTrackList.forEach((value, key) => {
      used.push(key);
      // value有可能已被处理加工过，被处理的value会被置为null
      if (!value) {
        return;
      }

      value._dateStr = this.formatTime(new Date(value.date));
      value.deviceId = this.deviceInfo?._deviceId;

      // 检测参数如果过大(500k)。则丢弃属性
      if (typeof value.data === 'object' && toJson(value.data).length > 200 * 1024) {
        // if (typeof value.data === 'object' && toJson(value.data).length > 0.5 * 1024 * 1024) {
        value.data = {
          throwaway: true,
        };
      }

      if (inElectron) {
        const appendixKey = value.appendix || defaultAppendix;
        if (!dtMapInElectron.has(appendixKey)) {
          dtMapInElectron.set(appendixKey, [] as string[]);
        }
        const oldDt = dtMapInElectron.get(appendixKey) as string[];

        oldDt.push(toJson(value));
        dtMapInElectron.set(appendixKey, oldDt);
      } else if (value.data) {
        if (typeof value.data !== 'string') value.data = toJson(value.data);

        const appendixKey = defaultAppendix;
        if (!dtMapInWeb.has(appendixKey)) {
          dtMapInWeb.set(appendixKey, [] as LogData[]);
        }
        const oldDt = dtMapInWeb.get(appendixKey) as LogData[];
        oldDt.push(value);
        dtMapInWeb.set(appendixKey, oldDt);
      }

      // 标记映射中对应key为null 防止重复set
      waitTrackList.set(key, null);
    });

    if (inElectron) {
      dtMapInElectron.forEach((value, key) => {
        const appendix = key === '__default' ? undefined : key;
        return window.electronLib.ipcChannelManage.send({
          channel: 'fsManage',
          functionName: 'writeToLogFile',
          params: { data: value, appendix },
        });
      });
    } else {
      dtMapInWeb.forEach((value, key) => {
        this.debounceDbLoggerPut(value, key === '__default' ? 'normal' : key);
      });
    }

    used.forEach(key => {
      waitTrackList.delete(key);
    });
    // 避免频繁写入
    await wait(1000);
  }
}

const dataTrackerApiImp: Api = LoggerApiImpl.getInstance();
api.registerLogicalApi(dataTrackerApiImp);
export default dataTrackerApiImp;
