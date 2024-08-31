import { config } from 'env_def';
import lodashGet from 'lodash/get';
import { api as masterApi } from '@/api/api';
import {
  // FetchAccountEmailListApi,
  // FetchAccountReqApi,
  IMMessage,
  NIMApi,
  NIMContructor,
  NIMEventOptions,
  NIMInterface,
  NIMSyncOperation,
  SystemMessage,
  Team,
  // Team,
} from '@/api/logical/im';
import IMInterceptor from './im_interceptor';
import { IMNotify } from './im_notify';

import { apis, environment, inWindow, supportLocalIndexedDB, isElectron } from '@/config';

import { ApiResponse, DataTransApi, ResponseData } from '@/api/data/http';
import { SystemApi } from '@/api/system/system';
import { imSession, NIMEventManager } from './im_eventemitter';
import { PushHandleApi } from '@/api/logical/push';
import { StringMap } from '@/api/commonModel';
// import { wait } from '@/api/util/index';
import { EventApi } from '@/api/data/event';
// import { ContactAndOrgApi } from '@/api/logical/contactAndOrg';
// import { ErrMsgCodeMap } from '@/api/errMap';
import { ApiLifeCycleEvent, /* PopUpMessageInfo, */ User } from '@/api/_base/api';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { ImTeamManager } from './im_team';

import { SessionStream } from './im_sessionlist';
import { P2PMuteStream } from './im_p2pmutelist';
import { TeamMuteStream } from './im_teammutelist';
import { IM_CurrentSession } from './im_currentsession';
import { IM_PushNotify } from './im_pushmsg';
import { IM_Users } from './im_users';
import { IM_Self } from './im_myaccount';
import { IM_Later } from './im_sessionlater';
import { ImTeamStream } from './im_teamv2';
import { IM_Cache } from './im_cache';
import { AccountApi, FetchAccountByEmailApiRet } from '@/api/logical/account';
import { wait } from '@/api/util';
import { ProductAuthApi } from '@/api/logical/productAuth';
import { locationHelper } from '@/api/util/location_helper';
import { CatalogNotifyInfo, CatalogUnionApi } from '@/api/logical/catalog';

type CustomerPushMsg = {
  subType: 'new_email' | 'contact' | 'EMAIL_PUSH' | 'email' | 'international_trade' | 'customer_update' | 'calendar_update' | 'whatsapp_red_dot';
  data: string;
};

type CustomerMailPushMsg = {
  // 邮件标题
  msgTitle: string;
  // 发送邮件的用户邮箱
  sendMailUser: string;
  // 邮件内容
  content: string;
  // 额外内容
  msgExt: {
    actionUrl: string;
    biz: string;
  };
};

export const typeMapToNotificationContent: StringMap = {
  text: '',
  image: '[图片]',
  file: '[文件]',
  custom: '[自定义消息]',
  video: '[视频]',
  audio: '[音频]',
  geo: '[位置]',
};

export const LINGXI_IM_TEAM_DEFAULT_NAME = 'LINGXI_IM_TEAM_DEFAULT_NAME_';

const env = typeof environment === 'string' ? environment : 'local';
const isDev = !['test_prod', 'prod', 'prev'].includes(env);

class NIMImplApi implements NIMApi {
  static inited = false;

  static needInit = false;

  static connectStatus: 'init' | 'ing' | 'success' | 'failed' = 'init';

  name: string;

  private nimInstanceEvents: NIMEventOptions = {};

  private $instance: NIMContructor | null = null;

  private xhr: DataTransApi;

  private systemApi: SystemApi;

  private pushApi: PushHandleApi;

  private accountApi: AccountApi;

  private scheduleApi: CatalogUnionApi;

  // private eventApi: EventApi;
  readonly nimTempEventManager: NIMEventManager = imSession;

  // private user: User | undefined = undefined;
  private eventApi: EventApi;

  // private contactApi: ContactAndOrgApi;

  private logger: DataTrackerApi;
  // private curSession: Session;

  private yunxinInfo: FetchAccountByEmailApiRet | undefined = undefined;

  private readonly appkey: string = config('NIMSID') as string;

  private loginStatus: 'logged' | 'unlogin' = 'logged';

  private productAuthApi: ProductAuthApi;

  interceptor = new IMInterceptor();

  teamManager = new ImTeamManager();

  imteamStream = new ImTeamStream();

  sessionStream = new SessionStream();

  p2pMuteStream = new P2PMuteStream();

  teamMuteStream = new TeamMuteStream();

  imself = new IM_Self();

  imlater = new IM_Later();

  imusers = new IM_Users();

  imnotify = new IMNotify();

  imcache = new IM_Cache();

  currentSession = new IM_CurrentSession();

  msgPushStream = new IM_PushNotify();

  interceptorMethods: Set<string> = new Set(['sendText', 'sendFile', 'sendTipMsg', 'sendCustomMsg', 'sendGeo', 'forwardMsg']);

  // debounceHandleCustomerUpdateEvent: ((customerId: string[]) => void) | undefined;

  constructor() {
    this.systemApi = masterApi.getSystemApi();
    this.xhr = masterApi.getDataTransApi();
    this.eventApi = masterApi.getEventApi();
    this.pushApi = masterApi.requireLogicalApi(apis.pushApiImpl) as unknown as PushHandleApi;
    // this.contactApi = masterApi.requireLogicalApi(apis.contactApiImpl) as unknown as ContactAndOrgApi;
    this.name = apis.imApiImpl;
    this.logger = masterApi.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;
    this.accountApi = masterApi.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    this.scheduleApi = masterApi.requireLogicalApi(apis.catalogApiImpl) as CatalogUnionApi;
    this.productAuthApi = masterApi.requireLogicalApi(apis.productAuthApiImpl) as unknown as ProductAuthApi;

    if (!inWindow() || window.isAccountBg || window.isBridgeWorker) {
      return;
    }
    try {
      // 原始数据先初始化
      this.imself.init(this);
      this.sessionStream.init(this);
      this.p2pMuteStream.init(this);
      this.teamMuteStream.init(this);
      this.currentSession.init(this);
      this.imusers.init(this);
      this.imlater.init(this);
      this.imteamStream.init(this);

      // 依赖其他数据的后初始化
      this.imnotify.init(this);
      this.teamManager.init(this);
      this.msgPushStream.init(this);
      this.imcache.init(this);
    } catch (error) {
      console.warn('[im] #### init error:', error);
    }
    // 事件注册无需重复，提前注册保存到全局map中
    this.subscrible('onconnect', (ev: any) => {
      this.onconnect(ev);

      // 发送当前会话ready事件
      this.eventApi.sendSysEvent({
        eventName: 'initModule',
        eventStrData: 'im',
      });
    });
    this.subscrible('ondisconnect', (ev: any) => {
      this.ondisconnect(ev);
    });
    this.subscrible('oncustomsysmsg', ev => {
      this.handleCustomerEvent(ev);
    });
    // this.debounceHandleCustomerUpdateEvent = triggerDebounceBySize(this.handleCustomerUpdate.bind(this), {
    //   triggerSize: 100,
    //   debounceTimeout: 1000,
    //   debounceConf: {
    //     leading: true,
    //     trailing: true,
    //   },
    // });
  }

  // eslint-disable-next-line no-unused-vars
  getTeamName(_teamDetail: Record<keyof Team, any> | undefined) {
    throw new Error('Method not implemented.');
  }

  onFocus?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  onBlur?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  isImInited() {
    return NIMImplApi.connectStatus === 'success';
  }

  init(): string {
    this.initIm();
    return this.name;
  }

  private initIm() {
    if (!inWindow() || window.isAccountBg || window.isBridgeWorker) {
      return;
    }

    this.xhr.addConfig({
      matcher: /^\/(cowork|im)\/api\/biz\/.*/i,
      requestAutoReLogin(data: ApiResponse<ResponseData>): boolean {
        const statusCode = lodashGet(data, 'status', '');
        const dataCode = lodashGet(data, 'data.code', '');
        return `${statusCode}` === '401' || ['401', '403'].includes(`${dataCode}`);
      },
      reLoginUrlHandler: conf => conf,
    });

    if (lodashGet(this.systemApi.getCurrentUser(), 'accountMd5.length', 0) === 0) {
      const eventApi = masterApi.getEventApi();
      const eid = eventApi.registerSysEventObserver('storeUserChangeEvent', {
        func: () => {
          const len = lodashGet(this.systemApi.getCurrentUser(), 'accountMd5.length', 0);
          if (len > 0) {
            eventApi.unregisterSysEventObserver('storeUserChangeEvent', eid);
            this.initNIMInstance();
          }
        },
      });
    } else {
      this.initNIMInstance();
    }
  }

  private latestNIMServerTime = 0;

  private checkYunxinAliveHanlder = 0;

  checkNIMInstanceAlive() {
    // 超过10分钟 没有成功就重新链接
    const maxCheckDuration = 10 * 60 * 1000;
    const handler = async () => {
      try {
        const latestNIMServerTime = (await this.excute('getServerTime')) as unknown as number;
        console.log('[im]getServerTime', latestNIMServerTime);
        if (typeof latestNIMServerTime === 'number' && Number.isSafeInteger(latestNIMServerTime)) {
          this.latestNIMServerTime = latestNIMServerTime;
        }
      } catch (ex) {
        console.log('[im]getServerTime.failed:', ex);
      }
    };

    // 在检查到重连之后 如果距离上次报活时间很长。这次链接大概率是不可用的。直接重连
    const willReconnectCallback = async (source: 'reconnect' | 'visibilitychange' = 'reconnect') => {
      const now = Date.now();
      if (this.latestNIMServerTime === 0 || now - this.latestNIMServerTime < maxCheckDuration) {
        return;
      }
      console.warn('[im]willreconnect', now - this.latestNIMServerTime, '.source is:', source);
      this.destroyNIMInstanceAndStatus();
      this.unSubcrible('onwillreconnect', willReconnectCallback);
      // 不能取消 可能重连不成功
      // document.removeEventListener('visibilitychange', visibleChangeCallback);
      if (lodashGet(this, 'yunxinInfo.yunxinToken.length', 0) !== 0) {
        // const { yunxinToken, yunxinAccountId } = this.yunxinInfo!;
        await this.$instance?.connect();
        document.removeEventListener('visibilitychange', visibleChangeCallback);
        console.log('[im]willreconnect.ok1');
      } else {
        await this.initNIMInstance();
        console.log('[im]willreconnect.ok2');
      }
    };

    const visibleChangeCallback = async () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      await wait(1000);
      willReconnectCallback();
    };

    this.unSubcrible('onwillreconnect', willReconnectCallback);
    document.removeEventListener('visibilitychange', visibleChangeCallback);
    // 重置数据
    this.latestNIMServerTime = 0;
    this.checkYunxinAliveHanlder && this.systemApi.cancelEvent('mid', this.checkYunxinAliveHanlder);
    this.subscrible('onwillreconnect', willReconnectCallback);
    // 监控visibleChange事件
    document.addEventListener('visibilitychange', visibleChangeCallback);
    // 轮询检查
    this.checkYunxinAliveHanlder = this.systemApi.intervalEvent({
      eventPeriod: 'mid',
      handler,
      seq: 0,
    }) as unknown as number;
  }

  afterLogin(ev?: ApiLifeCycleEvent) {
    if (ev && ev.data) {
      // this.user = ev.data as User;
      this.initNIMInstance();
      this.loginStatus = 'logged';
    }
    return this.name;
  }

  beforeLogout() {
    this.destroyNIMInstanceAndStatus();
    this.loginStatus = 'unlogin';
    return this.name;
  }

  private destroyNIMInstanceAndStatus() {
    try {
      this.$instance?.disconnect();
    } catch (e) {
      console.warn(e);
    }
    try {
      this.$instance?.destroy();
    } catch (e) {
      console.warn(e);
    }
    this.$instance = null;
    NIMImplApi.connectStatus = 'init';
    console.log('[im] im instance destroyed:', this);
    this.pushApi?.triggerNotificationInfoChange({
      action: 'im_clear',
      content: '',
      num: 0,
      title: '',
    });
    this.clearStatus();
  }

  private clearStatus() {
    this.yunxinInfo = undefined;
    // this.eventApi = masterApi.getEventApi();
    // this.curSession = ({} as unknown) as Session;
    console.warn('[im] --- im clear status:', this.$instance);
  }

  afterInit() {
    // console.log('test im after init :', this.pushApi);
    NIMImplApi.needInit = true;
    return this.name;
  }

  afterLoadFinish() {
    if (inWindow()) {
      const user = this.systemApi.getCurrentUser() as User;
      console.log('[im] im will init , im got user:', user);
      if (user) {
        this.initNIMInstance();
        // this.initNIMInstance();
      }

      // 监听网络状态。执行无限重连
      this.watchNetwork();
    }
    return this.name;
  }

  onPathChange(ev?: ApiLifeCycleEvent) {
    // NIMImplApi.needInit = true;
    if (ev?.curPath?.pathname === '/') {
      this.initIm();
      this.afterInit();
      this.afterLoadFinish();
    }
    return this.name;
  }

  // 监听网络状态
  private watchNetwork() {
    window.addEventListener('online', () => {
      this.systemApi.getCurrentUser() && this.initNIMInstance();
    });
  }

  /**
   * @description: 临时添加。为解决web环境下从jump跳主页IM没有初始化的BUG
   * @todo: 1.6版本之前jump只会跳主页。之后jump可能会跳别的地方这种场景下isPathlegal函数不满足业务需要需要改
   * @returns boolean
   */
  isPathlegal() {
    return this.systemApi.isMainPage() || (!isElectron() && locationHelper.testPathMatch('jump', false));
  }

  async initNIMInstance(retry?: number) {
    /**
     * needInit在afterInit和pathChange事件中会被设置为true,不走afterInit/pathChange 的 api回调，证明无需加载
     * 非主页不初始化IM
     */
    if (!NIMImplApi.needInit || !this.isPathlegal() || !this.systemApi.getCurrentUser()) {
      return;
    }

    const retryTime = retry || 0;
    if (!this.pushApi) {
      this.pushApi = masterApi.requireLogicalApi(apis.pushApiImpl) as unknown as PushHandleApi;
    }

    console.log('[im] im init for :', NIMImplApi.connectStatus);
    // 成功或者链接中都不需要重新重连
    if (NIMImplApi.connectStatus !== 'init') {
      return;
    }
    if (this.$instance && typeof this.$instance.connect !== 'undefined' && this.yunxinInfo) {
      this.destroyNIMInstanceAndStatus();
    }

    console.log('[im] im will init ,events:', this.nimInstanceEvents);
    NIMImplApi.connectStatus = 'ing';
    try {
      await wait(1000);
      await this.excuteConnect();
      NIMImplApi.connectStatus = 'success';
      console.log('[im] im instance inited');
      this.eventApi.sendSysEvent({
        eventName: 'initModule',
        eventStrData: 'im',
      });
    } catch (ex) {
      console.warn('[im] im instance initfailed:', ex);
      NIMImplApi.connectStatus = 'init';
      // 登录情况下无限重试
      if (this.loginStatus === 'logged' && retryTime < 15) {
        await wait(30 * 1000);
        this.initNIMInstance(retryTime + 1);
      }
    }
  }

  async excuteConnect(): Promise<string> {
    const emailAddress = this.getEmailAccount();
    if (!emailAddress) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject('got email failed');
    }
    console.log('[im] init yun xin connection:' + emailAddress);
    this.yunxinInfo = await this.accountApi.getCurrentAccountInfo(emailAddress);
    if (!this.yunxinInfo) {
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject('got account failed');
    }
    console.log('[im] got yun xin info:', this.yunxinInfo);
    this.sdkInit(this.yunxinInfo.yunxinToken, this.yunxinInfo.yunxinAccountId, {});
    return '';
  }

  // 获取邮箱账号
  getEmailAccount(): string {
    const currentUser = this.systemApi.getCurrentUser();
    const id = currentUser?.id as string;
    return id;
  }

  /**
   * SDK初始化
   * @param token
   * @param account
   * @param options
   */
  async sdkInit(token: string, account: string, options: NIMEventOptions = {}) {
    let imAuthConfig: Record<string, unknown> = {};
    // @todo:获取IM权限

    // 如果IM入口不展示 本地不建DB&不接受消息
    const enableUseCompleteIM = this.getIMAuthConfig();
    if (!enableUseCompleteIM) {
      imAuthConfig = {
        db: false,
        shouldIgnoreMsg() {
          return true;
        },
      };
    } else if (!supportLocalIndexedDB()) {
      imAuthConfig = {
        db: false,
      };
    }

    try {
      const aNIMWebSDK = window.SDK;
      const NIM = aNIMWebSDK.NIM as NIMInterface;
      // 事件监听函数
      const allOptions = Object.assign(
        options,
        this.nimInstanceEvents,
        {
          // debug: process.env.NODE_ENV === 'development' ? true : false,
          debug: environment !== 'prod',
          appKey: this.appkey,
          syncSessionUnread: true,
          token,
          account,
          syncStickTopSessions: true,
          // 忽略什么样的通知消息
          shouldIgnoreNotification(msg: IMMessage) {
            const shouldIgnore = lodashGet(msg, 'attach.type', '') === 'updateTeam' && lodashGet(msg, 'attach.team.serverCustom.length', 0);
            // 默认忽略展示所有的移除群成员信息
            const shouldRemoveMember = lodashGet(msg, 'attach.type', '') === 'removeTeamMembers';
            return !!shouldIgnore || shouldRemoveMember;
          },
          shouldIgnoreMsg(msg: IMMessage) {
            const shouldRemoveMember = lodashGet(msg, 'attach.type', '') === 'removeTeamMembers';
            return shouldRemoveMember;
          },
        },
        imAuthConfig
      );
      this.logger.track('im_init', { account, token });
      this.$instance = NIM.getInstance(allOptions);
    } catch (ex) {
      console.warn('[im] #### init failed', ex);
      if (!isDev) {
        throw new Error('--- init failed');
      }
    }

    return new Promise((resolve, reject) => {
      const tempConnectCallback = () => {
        // this.checkNIMInstanceAlive();
        resolve(true);
        this.unSubcrible('onconnect', tempConnectCallback);
        this.unSubcrible('ondisconnect', tempDisConnectCallback);
      };

      const tempDisConnectCallback = () => {
        this.unSubcrible('onconnect', tempConnectCallback);
        this.unSubcrible('ondisconnect', tempDisConnectCallback);
        reject();
      };

      this.subscrible('onconnect', tempConnectCallback);
      this.subscrible('ondisconnect', tempDisConnectCallback);
    });
  }

  /**
   * 获取实例方法 暂时使用 以后不允许调用
   */
  getInstance() {
    return this.$instance;
  }

  /**
   * 监听sdk登录状态
   */
  onconnect(ev: any) {
    console.info('#### im connect', ev, this.$instance?.options);
  }

  ondisconnect(ev: any) {
    this.logger.track('im_disconnect', ev);
    this.clearStatus();
    NIMImplApi.connectStatus = 'init';
    if (this.$instance && this.$instance.destroy) {
      try {
        this.$instance?.destroy();
      } catch (ex) {
        console.warn(ex);
      }
    }
  }

  onerror(ev: any) {
    console.warn('got error:', ev);
    this.logger.track('im_error', ev);
  }

  /**
   * 调用NIM实例方法(异步方法)
   * @param command 方法名
   * @param options 方法入参
   * @param restArgs 剩余参数(具体参考文档)
   */

  async excute(command: Exclude<keyof NIMContructor, NIMSyncOperation>, options: any = {}, ...restArgs: unknown[]): Promise<any> {
    // if yunxinInstance not ok.wait connect emit
    if (!this.$instance) {
      await new Promise((resolve, reject) => {
        const tempConnect = () => {
          resolve(true);
          this.nimTempEventManager.removeListener('onconnect', tempConnect);
        };

        const tempOndisconnect = () => {
          reject();
          this.nimTempEventManager.removeListener('ondisconnect', tempConnect);
        };

        this.subscrible('onconnect', tempConnect);
        this.subscrible('ondisconnect', tempOndisconnect);
      });
    }

    // 只有各种send消息才执行interceptor
    if (this.interceptorMethods.has(command)) {
      options = ((await this.interceptor.request.excute(Promise.resolve([command, options]))) as [string, Record<string, any>])[1];
    }
    const $this = this;
    const result: any = await new Promise((resolve, reject) => {
      try {
        (this.$instance as NIMContructor)[command](
          {
            ...options,
            ...(Reflect.has(options, 'custom')
              ? {
                  custom: JSON.stringify(options.custom),
                }
              : {}),
            async done(error: Error, ...rest: any[]): Promise<any> {
              if (error instanceof Error) {
                return Reflect.has(options, 'done') ? options.done(error, ...rest) : reject(error);
              }

              let result = rest[0];
              if ($this.interceptorMethods.has(command)) {
                result = (
                  (await $this.interceptor.response.excute(
                    // @ts-ignore
                    Promise.resolve([command as string, options, ...rest])
                  )) as [string, Record<string, any>, any]
                )[2];
              }

              return Reflect.has(options, 'done') ? options.done(error, ...rest) : resolve(result);
            },
          },
          ...restArgs
        );
      } catch (e) {
        reject(e);
      }
    });

    if (!Reflect.has(options, 'done')) {
      return Promise.resolve(result);
    }
    return true;
  }

  /**
   * 调用NIM实例异步方法
   * @param command 方法名
   * @param restArgs 入参
   */
  async excuteSync(command: NIMSyncOperation, ...restArgs: unknown[]) {
    if (!this.$instance) {
      await new Promise((resolve, reject) => {
        this.subscrible('onconnect', resolve);
        this.subscrible('ondisconnect', reject);
      });
    }
    const $ins = this.$instance as NIMContructor;
    const $method = $ins[command] as (...args: unknown[]) => unknown;
    return Promise.resolve($method.apply($ins, restArgs));
  }

  getIMAuthConfig() {
    // 如果IM入口不展示 本地不建DB&不接受消息
    const enableUseCompleteIM = this.productAuthApi.getAuthConfig('IM_SHOW') === null || this.productAuthApi.getAuthConfig('IM_SHOW')?.show !== false;
    console.log('im_default_config is:', enableUseCompleteIM);
    return enableUseCompleteIM;
    // return false;
  }

  /**
   * @description 订阅Nim事件监听回调
   * NIMSDK是单例模式 一个事件只可以绑定一个回调。
   * 不同的模块如果都想要监听同一个事件。就需要用nimTempEventManager做一个中间代理。通过nimTempEventManager的emit方法来做分发.这种情况下一定要注意在卸载的时候取消监听
   * @param event 监听函数名
   * @param callback  监听回调
   */
  subscrible(event: keyof NIMEventOptions, callback: (...params: any[]) => void) {
    console.log('[im] #### add event to im ,', event, callback);
    this.nimTempEventManager.repackageEvent(event, callback);

    // 如果之前监听过同类事件 直接忽略
    if (this.nimTempEventManager.listenerCount(event) !== 1) {
      console.log('[im] #### event already exist :' + event);
      return callback;
    }

    console.log('[im] #### first event pass:', this.nimTempEventManager);

    const newCallback = (...args: any[]) => {
      this.nimTempEventManager.emit(event, ...args);
    };

    // 涉及到重连 为了防止侦听时间丢失.先备份到nimInstanceEvents
    this.nimInstanceEvents[event] = newCallback as any;

    // 如果当时实例已经被初始化 直接挂载到instance实例上
    if (this.$instance && this.$instance.setOptions && typeof this.$instance.setOptions === 'function') {
      this.$instance.setOptions({
        [event]: newCallback,
      });
      console.log('[im] #### event added to im ,', event);
    }
    return callback;
  }

  // 取消订阅
  unSubcrible(eventName: keyof NIMEventOptions, callback?: (...params: any[]) => void) {
    console.log('[im] #### im remove callback', eventName, callback);
    if (typeof callback !== 'function') {
      this.nimTempEventManager.removeAllListeners(eventName);
    } else {
      this.nimTempEventManager.removeListener(eventName, callback);
    }
  }

  /**
   * 订阅自定义事件
   * @param eventname
   * @param callback
   */
  subCustomEvent(eventname: string, callback: (...options: any[]) => void, options: { [k: string]: any } = { once: false }) {
    this.nimTempEventManager[options.once ? 'once' : 'on'](eventname, callback);
  }

  // 取消订阅
  offCustomEvent(eventName: string, callback: (...options: any[]) => void) {
    this.nimTempEventManager.removeListener(eventName, callback);
  }

  emitCustomEvent(eventname: string, ...args: any[]) {
    this.nimTempEventManager.emit(eventname, ...args);
  }

  private handleCustomerEvent(ev: SystemMessage) {
    console.log('[im] #### receive from im , email event catch im info:', ev);
    const { content } = ev;
    if (content) {
      const msg: CustomerPushMsg = JSON.parse(content);
      if (msg.subType === 'new_email') {
        const data: CustomerMailPushMsg = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
        const actionUrl = new URL(data?.msgExt?.actionUrl);
        const params = actionUrl.searchParams;
        const mailId = params.get('mailId') || '';
        const accountId = params.get('aid') || '';
        this.pushApi!.triggerNotificationInfoChange({
          content: data.msgTitle,
          title: data.sendMailUser,
          action: 'new_mail',
          num: 1,
          mailId,
          accountId,
        });
      } else if (msg.subType === 'international_trade') {
        const msgData = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
        const { type, data } = msgData;
        if (type === 'WhatsAppIm') {
          this.eventApi.sendSysEvent({
            eventName: 'whatsAppMessagesUpdate',
            eventStrData: 'whatsAppMessagesUpdate',
            eventData: data,
          });

          ((data.toList || []) as string[]).forEach(chatId => {
            try {
              this.pushApi!.triggerNotificationInfoChange({
                title: 'WhatsApp 新消息',
                content: '来自 WhatsApp 联系人的新消息',
                action: 'whatsApp',
                data: JSON.stringify({ chatId }),
                num: 0,
              });
            } catch {}
          });
          return;
        }

        if (type === 'WhatsAppMessageStatus') {
          this.eventApi.sendSysEvent({
            eventName: 'whatsAppMessageStatus',
            eventStrData: 'whatsAppMessageStatus',
            eventData: data,
          });
        }

        if (type === 'WhatsAppImV2') {
          this.eventApi.sendSysEvent({
            eventName: 'whatsAppMessagesUpdateV2',
            eventStrData: 'whatsAppMessagesUpdateV2',
            eventData: data,
          });
          try {
            this.pushApi!.triggerNotificationInfoChange({
              title: 'WhatsApp 新消息',
              content: '来自 WhatsApp 联系人的新消息',
              action: 'whatsApp',
              data: JSON.stringify(data),
              num: 0,
            });
          } catch {}
        }

        if (type === 'WhatsAppMessageStatusV2') {
          this.eventApi.sendSysEvent({
            eventName: 'whatsAppMessageStatusV2',
            eventStrData: 'whatsAppMessageStatusV2',
            eventData: data,
          });
        }

        if (type === 'FacebookNewMsg') {
          this.eventApi.sendSysEvent({
            eventName: 'facebookNewMessage',
            eventStrData: 'facebookNewMessage',
            eventData: msgData,
          });

          if (msgData.dialogList && msgData.dialogList[0]) {
            const { pageId, contactId } = msgData.dialogList[0];

            try {
              const pushData = JSON.stringify({ pageId, contactId });

              this.pushApi!.triggerNotificationInfoChange({
                title: 'Facebook 新消息',
                content: '来自 Facebook 联系人的新消息',
                action: 'facebook',
                data: pushData,
                num: 0,
              });
            } catch (error) {}
          }
          return;
        }

        if (type === 'FacebookAccountExpires') {
          this.eventApi.sendSysEvent({
            eventName: 'facebookAccountExpires',
            eventStrData: 'facebookAccountExpires',
            eventData: msgData,
          });
        }

        if (type === 'FacebookSync30DayFinish') {
          // 完成 30 天历史消息同步，暂不感知用户
        }

        if (type === 'SocialMediaNewMsg') {
          this.eventApi.sendSysEvent({
            eventName: 'socialMediaNewMsg',
            eventStrData: 'socialMediaNewMsg',
            eventData: msgData,
          });
        }

        if (type === 'SystemTaskNewTask') {
          this.eventApi.sendSysEvent({
            eventName: 'SystemTaskNewTask',
            eventStrData: 'SystemTaskNewTask',
            eventData: msgData,
          });
        }

        if (type === 'SystemTaskStatusUpdate') {
          this.eventApi.sendSysEvent({
            eventName: 'SystemTaskStatusUpdate',
            eventStrData: 'SystemTaskStatusUpdate',
            eventData: msgData,
          });
        }

        if (type === 'regular-customer-task' || type === 'privilege-grant-redPoint') {
          this.eventApi.sendSysEvent({
            eventName: 'regularCustomerMenuUpdate',
            eventData: msgData,
          });
        }
        // 产品和公司订阅 触发一级菜单红点 原来全球搜和海关是分开的 现在合并成一个“外贸”大数据
        if (type === 'globalSearch-redPoint' || type === 'globalSearch-collect-redPoint') {
          this.eventApi.sendSysEvent({
            eventName: 'globalSearchSubscribeUpdate',
            eventData: {
              type,
              subCount: msgData?.subCount,
            },
          });
        }
      } else if (msg.subType === 'customer_update') {
        // const data: CustomerUpdatePushMsg = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
        // if (this.debounceHandleCustomerUpdateEvent) {
        //   this.debounceHandleCustomerUpdateEvent(data.companyIds);
        // }
      } else if (msg.subType === 'calendar_update') {
        if (isElectron()) {
          const data: CatalogNotifyInfo = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
          this.scheduleApi.initScheduleNotice(data);
        }
      } else if (msg.subType === 'whatsapp_red_dot') {
        const data: any = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
        this.eventApi.sendSysEvent({
          eventName: 'whatsappSubscribeUpdate',
          eventData: {
            type: 'reddot',
            reddot: Boolean(data.redDot),
          },
        });
      }
    }
  }

  // private handleCustomerUpdate(companyIds: string[]) {
  //   this.contactApi.handlePushCustomerMgs({ companyIds });
  //   // 延迟1.5s是因为uni推送的客户消息后，客户删除时异步的，防止服务端未读数未完成更新，所以增加了1.5s的延迟
  //   setTimeout(() => {
  //     this.eventApi.sendSysEvent({
  //       eventName: 'mailChanged',
  //       eventStrData: 'refreshCustomerUnread',
  //       eventData: { customerIds: companyIds },
  //     } as SystemEvent);
  //   }, 1500);
  // }
}

const NIMImplApiInstance = new NIMImplApi();
// const nimInstanceImpl: NIMApi = NIMImplApiInstance;
const nimInstanceImpl: NIMApi = new Proxy(NIMImplApiInstance, {
  get(target: any, property) {
    if (target[property]) {
      return target[property];
    }
    if (target.$instance && target.$instance[property]) {
      return target.$instance[property];
    }
    return undefined;
  },
});
masterApi.registerLogicalApi(nimInstanceImpl);

export default nimInstanceImpl;
