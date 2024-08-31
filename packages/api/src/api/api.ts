import { apis, inWindow } from '@/config';
import { DataTransApi } from './data/http';
import { Api, ApiLifeCycleApi, ApiLifeCycleEvent } from './_base/api';
import { DataStoreApi } from './data/store';
import { SystemApi } from './system/system';
// import { DbApiV2 } from './data/db';
import { EventApi } from './data/event';
import { DbApiV2 } from './data/new_db';
import { FileApi } from './system/fileLoader';
import { isSupportNativeProxy } from './util';

/**
 * 通用api包装基类
 */
class AbsWrapper implements Api {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  init(): string {
    return this.name;
  }
}

if (!isSupportNativeProxy) {
  const noop = function () {};
  const fns = process.env.BUILD_ISWEB
    ? [
        'get',
        'delete',
        'head',
        'options',
        'post',
        'put',
        'patch',
        'buildUrl',
        'addConfig',
        'setDisableCache',
        'buildRequestKey',
        'getUrlPath',
        'cleanCacheEntry',
        'setLogoutStatus',
        'getDeviceInfo',
        'getLogoutPage',
        'addCommonHeader',
        'updateDeviceInfo',
        'triggerCurrentUserLogout',
        'del',
        'clear',
        'getSync',
        'putSync',
        'getSeqHelper',
        'setLastAccount',
        'getCurrentUser',
        'doGetCookies',
        'setUserProp',
        'setCurrentNode',
        'getCurrentNode',
        'getLock',
        'getUUID',
        'loadUser',
        'isLogout',
        'getKey',
        'addWatchedKey',
        'contextPath',
        'isMsiBuild',
        'isFirstInit',
        'handleAccountAndDomain',
        'getCurrentUserMailMode',
        'getIsCorpMailMode',
        'openNewWindow',
        'webDownloadLink',
        'intervalEvent',
        'cancelEvent',
        'encryptMsg',
        'decryptMsg',
        'md5',
        'sha1',
        'generateKey',
        'isElectron',
        'isMainWindow',
        'isInMobile',
        'isMainPage',
        'getUrl',
        'isInWebWorker',
        'isNetworkAvailable',
        'getNetworkFailIndex',
        'showSysNotification',
        'isSysNotificationAvailable',
        'requestSysNotificationPerm',
        'updateAppNotification',
        'watchLogin',
        'watchPreLogin',
        'closeWindow',
        'closeSubWindow',
        'getCurrentWinInfo',
        'getCurrentModule',
        'doGetCookies',
        'clearUserAuthCookie',
        'getStartTimeSpan',
        'createWindow',
        'createWindowWithInitData',
        'handleJumpUrl',
        'decryptByKey',
        'encryptByKey',
        'buildJumpUrl',
        'getBrowserInfo',
        'hideWindow',
        'getNativeClipBoard',
        'rsaEncrypt',
        'getAutoLaunch',
        'setAutoLaunch',
        'getAllWindow',
        'showMainWindow',
        'getLocalLoginToken',
        'addWindowHooks',
        'addWindowHookConf',
        'navigateToSchedule',
        'switchLoading',
        'switchAppLoading',
        'inWebMail',
        'invalidate',
        'showWin',
        'hideWin',
        'prepareWindow',
        'isStartWindow',
        'isTransferringData',
        'isBkLoginInit',
        'isBkStableWindow',
        'getProxyOn',
        'setProxyOn',
        'getIsDomesticHostType',
        'getCurrentHostType',
        'setCurrentHostType',
        'reLaunchApp',
        'getIsAddAccountPage',
        'jumpToWebHostLogin',
        'setCurrentSessionName',
        'getCurrentSessionName',
        'getFolderSize',
        'inEdm',
        'getIsAddSubAccountPage',
        'getIsSubAccountPage',
        'getIsSubAccountInitPage',
        'getIsAddPersonalSubAccountPage',
        'getUrlSearchValue',
        'getMainAccount',
        'getCurrentSubAccount',
        'getCurrentAgentAccount',
        'getSessionNameOfSubAccount',
        'getIsLowMemoryMode',
        'setIsLowMemoryMode',
        'getIsLowMemoryModeSync',
        'inElectronBuild',
        'inWebBuild',
        'inLingXiBuild',
        'registerSysEventObserver',
        'unregisterSysEventObserver',
        'sendSysEvent',
        'sendSimpleSysEvent',
        'setupWebWorker',
        'terminateWebWorker',
        'postMessage',
        'confirmEvent',
        'dumpMessageFromQueue',
        'getObserverByName',
        'getFileInfoByFileName',
        'upload',
        'downloadLocalFile',
        'saveDownload',
        'download',
        'clipboardWriteImage',
        'saveZip',
        'saveAll',
        'getFsDownloadStatus',
        'abortFsDownload',
        'testLocalFile',
        'openFile',
        'saveAs',
        'judgeFileType',
        'storeFileInfo',
        'registerTmpFile',
        'saveTmpFile',
        'getAttachmentZipPath',
        'getFileInfo',
        'getFileKey',
        'delFileInfo',
        'delAttachmentZipPath',
        'show',
        'openDir',
        'selectFile',
        'moveFilePath',
        'uploadFile',
        'uploadPieceByPiece',
        'initDb',
        'getTableCount',
        'getById',
        'getByIds',
        'getByIndexIds',
        'getByEqCondition',
        'putAll',
        'bulkPut',
        'close',
        'closeSpecific',
        'deleteById',
        'getByRangeCondition',
        'addFilterRegistry',
        'deleteByByRangeCondition',
        'deleteDB',
        'removeAccountAction',
        'track',
        'time',
        'initLimit',
        'doGetAccountInfo',
        'isInited',
        'setCurrentAccount',
        'newUsersIntoEmailList',
        'doGetOrgList',
        'getAuthConfig',
        'triggerNotificationInfoChange',
        'getMailMergeSettings',
        'getABSwitchSync',
        'saveAuthConfigFromNet',
        'doSaveCurrentAccount',
        'doGetContactByItem',
        'timeEnd',
        'getSubAccounts',
        'syncAllMails',
        'mailOperationEmailListChange',
        'point',
        'initModel',
        'getIsSharedAccountAsync',
        'doListMailBoxEntities',
        'isWebWmEntry',
        'getActiveUserTrackParams',
        'doListMailBox',
        'doGetDefaultSign',
      ]
    : [];
  fns.forEach(fnName => {
    // @ts-ignore
    AbsWrapper.prototype[fnName] = noop;
  });
}

/**
 * api 注册点
 */
export interface ApiResposity {
  requireDataTransApi(name: string): DataTransApi;

  getDataTransApi(): DataTransApi;

  getEventApi(): EventApi;

  requireEventApi(name: string): EventApi;

  requireDataStoreApi(name: string): DataStoreApi;

  getDataStoreApi(): DataStoreApi;

  requireSystemApi(name: string): SystemApi;

  getSystemApi(): SystemApi;

  requireNewDBApi(name: string): DbApiV2;

  getNewDBApi(): DbApiV2;

  registerEventApi(impl: EventApi): void;

  registerDataTransApi(impl: DataTransApi): void;

  registerLogicalApi(impl: Api): void;

  registerSystemApi(impl: SystemApi): void;

  registerDataStoreApi(impl: DataStoreApi): void;

  // registerDataNewDbApi(impl: NewDBApi): void;

  registerDataDbApi(impl: DbApiV2): void;

  requireDataDbApi(name: string): DbApiV2;

  requireLogicalApi(name: string): Api;

  registerFileApi(impl: FileApi): void;

  getFileApi(): FileApi;
}

type ApiType = Api | SystemApi | EventApi | DataTransApi | DataStoreApi | DbApiV2 | FileApi;

class ProxyFactory<T extends ApiType> {
  impl?: T;

  defaultImplName: string;

  constructor(dfn: string) {
    this.defaultImplName = dfn;
  }

  private getImpl() {
    // if (process.env.NODE_ENV === 'development') {
    //   const ignoreApiNames = [apis.performanceImpl, apis.catalogApiImpl,apis.imDiscussApiImpl,apis.imTeamApiImpl];
    //   if (ignoreApiNames.includes(this.defaultImplName)) {
    //     return {}
    //   }
    // }

    const api1 = api.requireLogicalApi(this.defaultImplName) as T;
    if (this.impl && api1 === this.impl) {
      console.error('can not get impl', this.defaultImplName);
      return api.requireLogicalApi(apis.emptyApiImpl) as T;
    }
    this.impl = api1;
    return api1;
  }

  getProxyInstance(): T {
    // if (!this.impl) this.getImpl();
    const that = this;
    // const impl1 = this.impl ? this.impl : new AbsWrapper(this.defaultImplName);
    // console.log("add proxy for impl "+this.defaultImplName+"-> ",impl1);
    return new Proxy<T>(new AbsWrapper(this.defaultImplName) as unknown as T, {
      get(_: T, p: string | symbol): any {
        if (p === '__isProxy') return 'yes';
        if (p === 'name') return that.defaultImplName + '-proxy';
        // console.log('[api proxy] get property of ', that.defaultImplName, p);
        // if (process.env.NODE_ENV === 'development') {
        //   const commonApis = ['init', 'afterInit', 'afterLoadFinish', 'afterLogin', 'beforeLogout', 'onFocus', 'onBlur', 'onPathChange'];
        //   if (that.defaultImplName === apis.performanceImpl) {
        //     const fnsArr = commonApis.concat(['time', 'timeLog', 'timeEnd', 'point', 'count', 'getTimerLog', 'handleWebMemory', 'handleProcessInfo', 'uploadLog', 'saveLog']);
        //     if (typeof p === 'string' && fnsArr.includes(p)) {
        //       return () => Promise.resolve({});
        //     }
        //   }
        //   if(that.defaultImplName === apis.catalogApiImpl) {
        //     const fnsArr = commonApis.concat(['doGetFreeBusyList']);
        //     if (typeof p === 'string' && fnsArr.includes(p)) {
        //       return () => Promise.resolve([]);
        //     }
        //   }
        // }
        let { impl } = that;
        if (!impl || impl.__isProxy === 'yes') {
          impl = that.getImpl();
        }
        if (impl && impl.__isProxy !== 'yes' && impl[p as keyof ApiType]) {
          let implElement = impl[p as keyof ApiType];
          if (typeof implElement === 'function') {
            implElement = implElement.bind(that.impl);
          }
          return implElement;
        }
        return impl[p as keyof ApiType];
      },
    });
  }
}

class ApiFactory implements ApiResposity {
  private defaultDataTransApi: DataTransApi;

  private defaultDataStoreApi: DataStoreApi;

  private defaultSystemApi: SystemApi;

  private defaultEventApi: EventApi;

  private defaultFileApi: FileApi;

  private defaultDBApi: DbApiV2;

  // eslint-disable-next-line no-undef
  [key: string]: Api | (() => ApiType) | ((name: string) => ApiType) | ((impl: any) => void) | ProxyFactory<ApiType>;

  constructor() {
    this.defaultDataTransApi = new ProxyFactory<DataTransApi>(apis.defaultApiImpl).getProxyInstance();
    this.defaultDataStoreApi = new ProxyFactory<DataStoreApi>(apis.defaultDataStoreApiImpl).getProxyInstance(); // new DataStoreApiWrapper(undefined);
    this.defaultSystemApi = new ProxyFactory<SystemApi>(apis.defaultSystemApiImpl).getProxyInstance();
    this.defaultEventApi = new ProxyFactory<EventApi>(apis.defaultEventApi).getProxyInstance();
    this.defaultFileApi = new ProxyFactory<FileApi>(apis.defaultFileApi).getProxyInstance();
    this.defaultDBApi = new ProxyFactory<DbApiV2>(apis.dbInterfaceApiImpl).getProxyInstance();
  }

  requireDataTransApi(name: string): DataTransApi {
    return this[name] as DataTransApi;
  }

  getDataTransApi(): DataTransApi {
    // if (!this.defaultDataTransApi) {
    //     const api = this[apis.defaultApiImpl] as DataTransApi;
    //     this.defaultDataTransApi = new DataTransApiWrapper(api);
    // }
    return this.defaultDataTransApi as DataTransApi;
  }

  requireDataStoreApi(name: string): DataStoreApi {
    return this[name] as DataStoreApi;
  }

  getEventApi(): EventApi {
    // if (!this.defaultEventApi) {
    //     const api = this[apis.defaultEventApi] as EventApi;
    //     this.defaultEventApi = new EventApiWrapper(api);
    // }
    return this.defaultEventApi as EventApi;
  }

  requireEventApi(name: string): EventApi {
    return this[name] as EventApi;
  }

  getDataStoreApi(): DataStoreApi {
    // if (!this.defaultDataStoreApi) {
    //     const api = this[apis.defaultDataStoreApiImpl] as DataStoreApi;
    //     this.defaultDataStoreApi = new DataStoreApiWrapper(api);
    // }
    return this.defaultDataStoreApi as DataStoreApi;
  }

  requireSystemApi(name: string): SystemApi {
    return this[name] as SystemApi;
  }

  getSystemApi(): SystemApi {
    // if (!this.defaultSystemApi) {
    //     const api = this[apis.defaultSystemApiImpl] as SystemApi;
    //     this.defaultSystemApi = new SystemApiWrapper(api);
    // }
    return this.defaultSystemApi as SystemApi;
  }

  registerFileApi(impl: FileApi) {
    this[impl.name] = impl;
  }

  getFileApi(): FileApi {
    // console.log(this.defaultFileApi);
    // console.log(this);
    return this.defaultFileApi as FileApi;
  }

  getNewDBApi(): DbApiV2 {
    return this.defaultDBApi as DbApiV2;
  }

  requireNewDBApi(name: string): DbApiV2 {
    return this[name] as DbApiV2;
  }

  registerDataTransApi(impl: DataTransApi): void {
    if (!impl) {
      throw new Error('wrong http api');
    }
    this[impl.name] = impl;
  }

  registerEventApi(impl: EventApi): void {
    if (!impl) {
      throw new Error('wrong event api');
    }
    this[impl.name] = impl;
  }

  registerSystemApi(impl: SystemApi): void {
    if (!impl) {
      throw new Error('wrong system api');
    }
    this[impl.name] = impl;
  }

  registerDataStoreApi(impl: DataStoreApi): void {
    if (!impl) {
      throw new Error('wrong data store api');
    }
    console.log('[api]register.storeApi.init');

    this[impl.name] = impl;
  }

  registerDataNewDbApi(impl: DbApiV2): void {
    if (!impl) {
      throw new Error('wrong newdb api');
    }
    this[impl.name] = impl;
  }

  registerDataDbApi(impl: DbApiV2): void {
    if (!impl) {
      throw new Error('wrong db api');
    }
    this[impl.name] = impl;
  }

  requireDataDbApi(name: string): DbApiV2 {
    return this[name] as DbApiV2;
  }

  /**
   * 注册各类业务逻辑实现
   * @param impl 业务逻辑实现
   */
  registerLogicalApi(impl: Api) {
    if (!impl) {
      throw new Error('wrong logical api');
    }
    this[impl.name] = impl;
  }

  /**
   * 获取各类业务逻辑的实现
   * @param name 业务逻辑实现名 参考 {@link apis}
   */
  requireLogicalApi(name: string): Api {
    const newVar = this[name] as Api;
    if (newVar) {
      return newVar;
    }
    const newName = 'proxy_' + name;
    const proxyApi = this[newName] as Api;
    if (proxyApi) {
      return proxyApi;
    }
    console.log('require api of ', name);
    const proxyFactory = new ProxyFactory<Api>(name) as ProxyFactory<Api>;
    const proxyInstance = proxyFactory.getProxyInstance();
    this[newName] = proxyInstance;
    return proxyInstance as Api;
  }
}

export interface ApiPolicy {
  target: string;
  exclude?: (apiName: ApiLifeCycleApi, ev?: ApiLifeCycleEvent) => boolean;
  canRecall?: (apiName: ApiLifeCycleApi, ev?: ApiLifeCycleEvent) => boolean;
  loginOutCalled?: boolean;
  called: Set<ApiLifeCycleApi>;
}

/* class CustomerConsole {
 // Console: NodeJS.ConsoleConstructor ;

 static originalConsole = inWindow() ? window.console : (global && global.console);

 memory: any;

 profile(label?: string): void {
 CustomerConsole.originalConsole.profile && CustomerConsole.originalConsole.profile(label);
 }

 profileEnd(label?: string): void {
 CustomerConsole.originalConsole.profileEnd && CustomerConsole.originalConsole.profileEnd(label);
 }

 assert(condition?: boolean, ...data: any[]): void {
 return CustomerConsole.originalConsole.assert && CustomerConsole.originalConsole.assert(condition, data);
 }

 clear(): void {
 return CustomerConsole.originalConsole.clear && CustomerConsole.originalConsole.clear();
 }

 count(label?: string): void {
 return CustomerConsole.originalConsole.count && CustomerConsole.originalConsole.count(label);
 }

 countReset(label?: string): void {
 return CustomerConsole.originalConsole.countReset && CustomerConsole.originalConsole.countReset(label);
 }

 debug(...data: any[]): void {
 return CustomerConsole.originalConsole.debug && CustomerConsole.originalConsole.debug(data);
 }

 dir(item?: any, options?: any): void {
 return CustomerConsole.originalConsole.dir && CustomerConsole.originalConsole.dir(item, options);
 }

 dirxml(...data: any[]): void {
 return CustomerConsole.originalConsole.dirxml && CustomerConsole.originalConsole.dirxml(data);
 }

 error(...data: any[]): void {
 return CustomerConsole.originalConsole.error && CustomerConsole.originalConsole.error(data);
 }

 exception(message?: string, ...optionalParams: any[]): void {
 return CustomerConsole.originalConsole.exception && CustomerConsole.originalConsole.exception(message, optionalParams);
 }

 group(...data: any[]): void {
 return CustomerConsole.originalConsole.group && CustomerConsole.originalConsole.group(data);
 }

 groupCollapsed(...data: any[]): void {
 return CustomerConsole.originalConsole.groupCollapsed && CustomerConsole.originalConsole.groupCollapsed(data);
 }

 groupEnd(): void {
 return CustomerConsole.originalConsole.groupEnd && CustomerConsole.originalConsole.groupEnd();
 }

 info(...data: any[]): void {
 return CustomerConsole.originalConsole.info && CustomerConsole.originalConsole.info(data);
 }

 log(...data: any[]): void {
 return CustomerConsole.originalConsole.log && CustomerConsole.originalConsole.log(data);
 }

 table(tabularData?: any, properties?: string[]): void {
 return CustomerConsole.originalConsole.table && CustomerConsole.originalConsole.table(tabularData, properties);
 }

 time(label?: string): void {
 return CustomerConsole.originalConsole.time && CustomerConsole.originalConsole.time(label);
 }

 timeEnd(label?: string): void {
 return CustomerConsole.originalConsole.timeEnd && CustomerConsole.originalConsole.timeEnd(label);
 }

 timeLog(label?: string, ...data: any[]): void {
 return CustomerConsole.originalConsole.timeLog && CustomerConsole.originalConsole.timeLog(label, data);
 }

 timeStamp(label?: string): void {
 return CustomerConsole.originalConsole.timeStamp && CustomerConsole.originalConsole.timeStamp(label);
 }

 trace(...data: any[]): void {
 return CustomerConsole.originalConsole.trace && CustomerConsole.originalConsole.trace(data);
 }

 warn(...data: any[]): void {
 return CustomerConsole.originalConsole.warn && CustomerConsole.originalConsole.warn(data);
 }

 } */

// if (environment == '')
//   window.console = new CustomerConsole() as Console;

const apiIns: ApiResposity = new ApiFactory();
if (inWindow()) {
  window.apiResposity = apiIns;
} else {
  // global.api = apiIns;
}
export const api = apiIns;
