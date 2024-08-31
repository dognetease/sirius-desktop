import * as Sentry from '@sentry/browser';
import { Severity } from '@sentry/browser';
// import { Integrations } from '@sentry/tracing';
import { config } from 'env_def';
import { api } from '../../../api/api';
import { apis, environment, inWindow } from '../../../config';
import { SystemApi } from '../../../api/system/system';
import { EndTransactionParams, ErrorReportApi, StartTransactionParams, TransConf } from '../../../api/data/errorReport';
import { DataStoreApi } from '../../../api/data/store';
import { DataTrackerApi } from '../../../api/data/dataTracker';
import { toJson } from '../../../api/util';
import { StringMap } from '../../../api/commonModel';

// import { electronLib } from '../../../gen/bundle';
/** sentry2 的sirius项目 */
// const edmDsn = 'https://a46855cc3d654c8f8bfb0811ff3992fe@sentry2.lx.netease.com/13';
type SentryParams = Exclude<Parameters<(typeof Sentry)['init']>[0], undefined>;

interface Trans extends Sentry.Transaction {
  finish(): string;

  startChild(SpanContext: any): this;

  setData(key: string, value: any): this;

  setTag(key: string, value: string | number): this;
}

/**
 * 判断报错执行栈是否包含l2c js文件，如果包含则认为是l2c相关报错
 * @param sentryEvent
 * @returns
 */

function isL2cError(sentryEvent: Sentry.Event): boolean {
  try {
    const values = sentryEvent.exception?.values;
    if (values) {
      return values.some(value => {
        const stackFrames = value.stacktrace?.frames;
        if (stackFrames) {
          return stackFrames.some(stackFrame => {
            if (stackFrame.filename?.includes('/9590deda-')) {
              // if (stackFrame.filename?.includes('demo/error.tsx')) {
              return true;
            }
          });
        }
      });
    }
  } catch (error) {}
  return false;
}

class ErrorReport implements ErrorReportApi {
  name: string;

  systemApi: SystemApi;

  dataStore: DataStoreApi;

  loggerApi: DataTrackerApi;

  userInfo?: { id: string; lastLoginTime: number; nickName: string; uuid: string };

  inited: boolean;

  transMap: Map<number, Trans>;

  constructor() {
    this.name = apis.errorReportImpl;
    this.systemApi = api.getSystemApi();
    this.dataStore = api.getDataStoreApi();
    this.userInfo = this.initUserInfo();
    this.loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;
    this.inited = false;
    this.transMap = new Map<number, Trans>();
  }

  init() {
    this.userInfo = this.initUserInfo();
    return this.name;
  }

  // 初始化用户信息
  initUserInfo() {
    return {
      id: '',
      lastLoginTime: 0,
      nickName: '',
      uuid: this.dataStore && this.dataStore.getUUID ? this.dataStore.getUUID() : '',
    };
  }

  getModuleName() {
    if (!inWindow()) {
      return '';
    }
    const otherMatch = window.location.hash.match(/^#(\w+)/);
    const path = window.location.pathname || 'unknown';
    return otherMatch ? otherMatch[1] : path;
  }

  // 初始化sentry
  initSentry() {
    const isElectron = this.systemApi.isElectron();
    const currentUser = this.systemApi.getCurrentUser();
    const user = currentUser || this.initUserInfo();
    this.userInfo = {
      id: environment === 'prod' || environment === 'prev' ? this.systemApi.md5(user.id, true) : user.id,
      lastLoginTime: user.lastLoginTime,
      nickName: currentUser?.sessionId || '_',
      uuid: this.dataStore.getUUID(),
    };
    const dsn = isElectron ? this.systemApi.getUrl('electronSentry') : this.systemApi.getUrl('webSentry');
    // const host = (config('host') as string) ?? '';
    // const isBuildEdm = host.includes('waimao');

    const env = typeof environment === 'string' ? environment : 'local';
    // const envList = ['prev', 'prod', 'test_prod'];
    let sentryExtraParams: SentryParams = {};

    // if (isBuildEdm) {
    // envList.push('test');
    const version = config('version') as string;
    // 如果是测试环境 或者 预发环境 采样比例为：100%，如果是线上环境 采样比例为：20%;
    const isTest = ['prev', 'test'].includes(env);
    const otherModule = this.getModuleName();
    sentryExtraParams = {
      sampleRate: isTest ? 1 : 0.2,
      tracesSampleRate: isTest ? 1 : 0.2,
      maxValueLength: 1000,
      beforeSend(event) {
        event.tags = event.tags || {};
        if (!event.tags.moduleName) {
          event.tags.moduleName = isL2cError(event) ? 'l2c-crm' : otherModule;
        }
        return event;
      },
      // release: undefined,
      initialScope: {
        user: {
          id: this.userInfo?.id,
        },
        tags: {
          version,
        },
      },
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'The database connection is closing',
        'UnknownError: Internal error opening backing store for indexedDB.open.',
        // 'VersionError The operation failed because the stored database is a higher version than the version requested',
        '非持久化消息需要有消费者才可发送',
        'BG_WIN_NOT_EXIST',
        'ERR.LOGIN.SMSSESSEXP',
        // 'Render frame was disposed before WebFrameMain could be accessed'
        'Minified React error',
        'login status not proper',
        'Failed to fetch', // UI测试的报错
        // 'promise rejection captured with value'
      ],
    };
    // }

    // if (envList.includes(env)) {
    if (!this.inited && env !== 'local') {
      // const release = window.electronLib && window.electronLib.env ? window.electronLib.env.showVersion : (config('version') as string);
      const options = {
        beforeSend: (event: Sentry.Event) => {
          // const frames = event.exception?.values || (event.exception?.values && event.exception?.values[0]?.stacktrace?.frames);
          // // 改变 transaction 字段，也就是 filename 字段
          // frames?.forEach(frame => {
          //   if (frame?.filename?.startsWith('sirius://')) {
          //     // eslint-disable-next-line no-param-reassign
          //     frame.filename = 'app:///' + frame.filename.split('/').reverse()[0];
          //   }
          // });
          return event;
        },
        // dsn: dsn as string,
        dsn /*: isBuildEdm ? edmDsn : (dsn as string)*/,
        environment: env,
        denyUrls: [/https?:\/\/localhost/gi],
        integrations: [new Sentry.BrowserTracing()],
        // release,
        // _metadata: { sdk: { version: config('version') as string } },
        autoSessionTracking: true,
        dist: env,
        ...sentryExtraParams,
      };
      Sentry.init(options);
      this.inited = true;
      console.log('sentry init success', options);
      // }
      Sentry.configureScope(scope => {
        scope.setExtra('errorInfo', { ...this.userInfo });
        return scope;
      });
    }
  }

  afterInit() {
    this.initSentry();
    return this.name;
  }

  afterLogin() {
    this.initSentry();
    return this.name;
  }

  beforeLogout() {
    this.userInfo = this.initUserInfo();
    return this.name;
  }

  // 上传报错的方法
  doReportMessage(error: any, optionalInfo?: StringMap) {
    if (!error) {
      return;
    }
    const env = config('stage');
    if (env !== 'local') {
      if (optionalInfo) {
        const combineMessage = { ...this.userInfo, optionalInfo };
        const errorInfo = { ...combineMessage };
        Sentry.configureScope(scope => {
          scope.setExtra('errorInfo', errorInfo);
          return scope;
        });
      }
      if (error instanceof Error) {
        const eid = Sentry.captureException(error);
        console.log('error reported with eid:' + eid);
      } else {
        const message = `${this.userInfo?.uuid}的错误:${error ? toJson(error) : 'unknown'}`;
        Sentry.captureMessage(message, Severity.Warning);
      }
    }
  }

  endTransaction(conf: EndTransactionParams): void {
    const { id } = conf;
    const tid = typeof id === 'number' ? id : parseInt(id || '0');
    const transaction: Trans | undefined = this.transMap.get(tid);
    if (transaction) {
      transaction.sampled = true;
      this.setTagAndData(conf, transaction);
      const rtid = transaction.finish();
      this.transMap.delete(tid);
      this.loggerApi.track('perf_transaction_finished', { conf, rtid });
      if (rtid) {
        console.warn('transaction finished with tid:' + tid);
      }
    }
  }

  startTransaction(conf: StartTransactionParams): number {
    const { name, op, parent } = conf;
    try {
      const id = this.getUniqueID();
      const parentTrans = parent && this.transMap.get(parent);

      //
      let transaction: Trans | undefined;
      if (TransConf[name]) {
        const { sampleRate } = TransConf[name];
        const sampled = sampleRate && sampleRate > 0 && Math.random() < sampleRate;
        if (!sampled) return -2;
      }
      const context = {
        name,
        op: op || 'default',
        sampled: true,
        tags: {
          moduleName: this.getModuleName(),
        },
      };
      if (parentTrans) {
        transaction = parentTrans.startChild(context) as Trans;
      } else {
        transaction = Sentry.startTransaction(context) as unknown as Trans;
        if (!conf.notAsTop && transaction) Sentry.configureScope(scope => scope.setSpan(transaction as Sentry.Span));
      }
      this.checkTransSize();
      if (transaction) {
        this.setTagAndData(conf, transaction);
        this.transMap.set(id, transaction);
        this.loggerApi.track('perf_transaction_start', { conf, id });
        return id;
      }
      return -3;
    } catch (e) {
      console.error('[err] error when start sentry transaction:', e);
      return -1;
    }
  }

  // 临时方案，避免太多未结束的transaction占用太多内存
  private checkTransSize() {
    if (this.transMap.size > 35) {
      this.transMap.clear();
    }
  }

  private setTagAndData(conf: StartTransactionParams | EndTransactionParams, transaction: Trans) {
    console.log('setTagAndData', conf);
    if (conf && conf.tags) {
      Object.entries(conf.tags).forEach(([k, v]) => {
        transaction.setTag(k, v);
      });
    }
    if (conf && conf.data) {
      Object.entries(conf.data).forEach(([k, v]) => {
        transaction.setData(k, v);
      });
    }
  }

  getTransById(id: number) {
    const tid = typeof id === 'number' ? id : parseInt(id || '0');
    return this.transMap.get(tid);
  }

  // getModuleName(): string {
  //
  //   return "unknown"
  // }

  getUniqueID(): number {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }
}

const errorReportImpl: any = new ErrorReport();

api.registerLogicalApi(errorReportImpl);
export default errorReportImpl;
