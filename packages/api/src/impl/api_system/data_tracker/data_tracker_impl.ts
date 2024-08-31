import { config } from 'env_def';
import moment from 'moment';
import lodashGet from 'lodash/get';
import { DataTrackerApi, DataTrackerProp, DataTrackerProperties, LoggerApi } from '@/api/data/dataTracker';
import { apis, environment, inWindow } from '@/config';
import { Api, ApiLifeCycleEvent, resultObject } from '@/api/_base/api';
import { api } from '@/api/api';
import { EventApi, SystemEvent } from '@/api/data/event';
import { DeviceInfo, SystemApi } from '@/api/system/system';
import { MailConfApi } from '@/api/logical/mail';
import { LoginApi } from '@/api/logical/login';
import { DataStoreApi } from '@/api/data/store';
import { platform } from '@/api/util/platform';
import { guideBy } from '@/api/util/decorators';
import { locationHelper } from '@/api/util/location_helper';
import { getOs } from '../../../utils/confOs';
// import { guideBy } from '../../../../dist';

const forElectron = config('build_for') === 'electron';
const isMac = getOs() === 'mac';

const electronKey = isMac ? ['HubbleMacKey', 'OxpeckerMacKey'] : ['HubbleWinKey', 'OxpeckerWinKey'];
const confKey = forElectron ? electronKey : ['HubbleWebKey', 'OxpeckerWebKey'];
const appkey = config(confKey[0]) as string;
const oxpeckerKey = config(confKey[1]) as string;
const oxpeckerHost = config('OxpeckerHost');
// const appkey = 'MA-AE6D-2AE10C747808';
const env = typeof environment === 'string' ? environment : 'local';
const isDev = !['test_prod', 'prod', 'prev', 'test'].includes(env);

console.log('[data-tracker] dataTrackerApiImp stage', isDev);
// 存放到localstroge的key
const DATA_TRACK_PREFIX = 'track_limit_';
// 打点数，默认每几次同步一次local
const SYNC_NUM_DEFAULT = 2;

class DataTrackerApiImp implements DataTrackerApi {
  name: string;

  eventApi: EventApi;

  systemApi: SystemApi;

  mailConf: MailConfApi;

  loginApi: LoginApi;

  storeApi: DataStoreApi;

  loggerApi: LoggerApi;

  waitTrackList: any[] = [];

  // 配置事件打点最大阈值的对象
  limitMap: Map<string, [number, number]> = new Map();

  // 事件打点次数记录
  eventIdNumObj: Record<string, [string, number]> = {};

  private deviceInfo: DeviceInfo | undefined;

  public static keyDeviceUUID: string = config('browerDeviceUUID') as string;

  private islowmemorymode = false;

  trackCommonOption = {
    deviceId: '',
    domain: '',
    orgName: '',
    orgId: 0,
    threadMode: 'off',
    userAccount: '',
    qiyeAccountId: '',
    logginStatus: 'false',
  };

  constructor() {
    this.name = apis.dataTrackerApiImp;
    this.eventApi = api.getEventApi();
    this.systemApi = api.getSystemApi();
    this.storeApi = api.getDataStoreApi();
    this.mailConf = api.requireLogicalApi(apis.mailConfApiImpl) as unknown as MailConfApi;
    this.loginApi = api.requireLogicalApi(apis.loginApiImpl) as unknown as LoginApi;
    this.loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as unknown as LoggerApi;
    this.updateAttributes = this.updateAttributes.bind(this);
  }

  afterLoadFinish?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  onFocus?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  onBlur?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  onPathChange?: ((ev?: ApiLifeCycleEvent | undefined) => string) | undefined;

  /**
   * 获取当前用户的email
   * */
  getEmail() {
    const user = this.systemApi.getCurrentUser();
    return user?.id;
  }

  /**
   * 获取当前用户的Domain
   * */
  getDomain() {
    const user = this.systemApi.getCurrentUser();
    return user?.domain;
  }

  init(): string {
    this.systemApi.getDeviceInfo().then(value => {
      this.deviceInfo = value;
    });
    return this.name;
  }

  afterInit(): string {
    console.warn('[data-tracker] window.DATracker', window.DATracker, appkey);
    if (inWindow() && (!window.DATracker || !window.DATracker.__loaded)) {
      window.DATracker.init(appkey, {
        truncateLength: 255,
        persistence: 'localStorage',
        cross_subdomain_cookie: false,
      });
      window.DATracker.oxpecker_init(oxpeckerKey);

      window.DATracker.oxpecker_set_base_attributes({
        _version: window.getSpConf('version') as string,
      });
    }
    // this.DATracker = window.DATracker;
    const userId = this.getEmail();

    this.systemApi.getIsLowMemoryMode().then(flag => {
      this.islowmemorymode = flag;
    });

    if (userId) {
      this.login();
    } else {
      this.logoutHandle();
    }
    window.DATracker.oxpecker_set_url({
      baseUrl: `${oxpeckerHost}/api/pub/event/tracking`,
      beaconUrl: `${oxpeckerHost}/api/pub/event/send-beacon/tracking`,
      isNewUrl: `${oxpeckerHost}/api/pub/user-active`,
    });

    if (!locationHelper.isMainPage()) {
      const eid = this.eventApi.registerSysEventObserver('setDATrackerToken', {
        func: (e: SystemEvent<{ token: string }>) => {
          const token = lodashGet(e, 'eventData.token', '');
          if (token && token.length) {
            this.setToken(token);
            this.eventApi.unregisterSysEventObserver('setDATrackerToken', eid);
          }
        },
      });
    }

    if (this.waitTrackList.length) {
      this.waitTrackList.forEach(item => {
        this.track(item.eventId, item.attributes);
      });
    }

    this.track('pc_restartApplication');
    this.eventApi.registerSysEventObserver('updateUserInfo', {
      func: () => {
        this.loginHandle();
      },
    });
    // this.setCommonAttributes();
    this.eventApi.registerSysEventObserver('toMuchOrToSlowLogger', {
      func: ev => {
        this.track('toMuchOrToSlowLogger', ev.eventData || {}, true);
      },
    });
    return this.name;
  }

  private getCurrentVersion() {
    return inWindow() && window.electronLib && window.electronLib.env ? window.electronLib.env.showVersion : (config('version') as string);
  }

  private getUUId() {
    const sync = this.storeApi.getSync(DataTrackerApiImp.keyDeviceUUID);
    const uuid = sync && sync.suc && sync.data ? sync.data : '';
    return uuid;
  }

  logoutHandle() {
    const currentVersion = this.getCurrentVersion();
    const uuid = this.getUUId();
    const deviceId = this.deviceInfo?._deviceId || '';
    this.trackCommonOption = {
      deviceId: deviceId,
      domain: '',
      orgName: '',
      orgId: 0,
      threadMode: 'off',
      userAccount: '',
      qiyeAccountId: '',
      logginStatus: 'false',
    };
    this.updateAttributes({
      deviceId,
      domain: '',
      orgName: '',
      threadMode: 'off',
      userAccount: '',
      logginStatus: false,
      uuid: uuid,
      version: currentVersion,
      platform: platform.isMobile() ? 'h5' : 'web',
      app: platform.getMobileApp(),
    });
  }

  loginHandle() {
    const user = this.systemApi.getCurrentUser();
    const companyId = this.systemApi.getCurrentCompanyId();
    const orgName = user?.company || '';
    // const orgId = user?.
    const domain = user?.domain || '';
    const threadMode = this.mailConf.getMailMergeSettings();
    const userAccount = user?.id;
    const logginStatus = true;
    const deviceId = this.deviceInfo?._deviceId || '';
    const uuid = this.getUUId();
    const version = this.getCurrentVersion();
    this.trackCommonOption = {
      deviceId,
      domain,
      orgName,
      orgId: companyId,
      threadMode,
      userAccount: user?.accountMd5 || '',
      qiyeAccountId: user?.contact?.contact?.id || '',
      logginStatus: '' + logginStatus,
    };
    this.updateAttributes({
      deviceId,
      domain,
      orgName,
      threadMode,
      userAccount,
      logginStatus,
      uuid,
      version,
      platform: platform.isMobile() ? 'h5' : 'web',
      app: platform.getMobileApp(),
    });
  }

  afterLogin(): string {
    this.login();
    return this.name;
  }

  beforeLogout(): string {
    this.logoutHandle();
    this.logout();
    return this.name;
  }

  login(): void {
    this.loginHandle();
    const userId = this.getEmail();
    window.DATracker.login(userId!);
  }

  logout(): void {
    window.DATracker.logout();
  }

  // setCommonAttributes() {
  //   this.registerAttributes({
  //     platform: platform.isMobile() ? 'h5' : 'web',
  //     app: platform.getMobileApp(),
  //   });
  // }

  @guideBy(inWindow)
  track(eventId: string, attributes?: resultObject & Partial<{ enableTrackInBg: boolean; _account: string; recordSubAccount: boolean }>, noPopup?: boolean): void {
    console.log(eventId, attributes);
    if (isDev) {
      return;
    }
    const { enableTrackInBg = false, _account, recordSubAccount = true } = attributes || { enableTrackInBg: false, recordSubAccount: true };

    // 后台打日志需要在attributes中增加一个enableTrackInBg
    if (inWindow() && window.isBridgeWorker && !enableTrackInBg) {
      return;
    }

    const mainAccount = this.systemApi.getCurrentUser()?.id;
    const accountType = _account && _account !== mainAccount ? 'sub' : 'main';

    // 如果是子账号同时配置了不打点 直接跳过
    if (accountType === 'sub' && !recordSubAccount) {
      return;
    }

    try {
      if (this.canTrack(eventId)) {
        if (window.DATracker && window.DATracker.track) {
          window.DATracker.track(
            eventId,
            Object.assign(attributes || {}, {
              islowmemorymode: this.islowmemorymode,
              // _page: inWindow() ? location.pathname : 'unknown',
              operationaccount: attributes?._account,
              acountType: accountType,
            })
          );
        } else {
          this.waitTrackList.push({
            eventId,
            attributes,
          });
        }
        if (!noPopup) this.loggerApi.track(eventId, attributes, 'high');
      }
    } catch (ex) {
      console.log('[track_impl]track.error', ex);
    }
  }

  // 配置事件每天最大的打点数,事件id，阈值，默认同步local的频率，几次打点同步一次
  initLimit(eventId: string, limitNum: number, syncNum?: number): void {
    if (limitNum <= 0) {
      console.log('[data-traker] initLimit number must above 0');
      return;
    }
    // 默认最少10次打点同步一次local，不要太频繁
    const defaultSyncNum = Math.max(Math.ceil(limitNum / 3), SYNC_NUM_DEFAULT);
    this.limitMap.set(eventId, [limitNum, syncNum || defaultSyncNum]);
  }

  // 是否需要继续打点
  canTrack(eventId: string): boolean {
    const limit = this.limitMap.has(eventId) && this.limitMap.get(eventId);
    if (limit) {
      const nowNum = this.getLimitNum(eventId);
      this.setLimitNum(eventId, nowNum + 1);
      if (nowNum >= limit[0]) {
        return false;
      }
    }
    return true;
  }

  // 获取事件当天打点数
  getLimitNum(eventId: string): number {
    let result = 0;
    const nowArr = this.eventIdNumObj[eventId];
    if (nowArr && nowArr.length) {
      const dayStr = moment().format('YYYY-MM-DD');
      // 如果日期正确
      if (dayStr === nowArr[0]) {
        result = nowArr[1];
      } else {
        result = 0;
      }
      // 判断是否需要同步local
      const limit = this.limitMap.has(eventId) && this.limitMap.get(eventId);
      const syncNum = limit && limit[1] ? limit[1] : SYNC_NUM_DEFAULT; // 没有配置同步频率，默认10次同步一次
      // 需要同步
      if (result % syncNum === 0) {
        let newNum = result;
        const key = DATA_TRACK_PREFIX + eventId;
        const sync = this.storeApi.getSync(key);
        // 取到local的值
        if (sync && sync.suc && sync.data) {
          const local = JSON.parse(sync.data);
          const localNum = dayStr === local[0] ? local[1] : 0;
          newNum = Math.max(result, localNum);
        }
        this.eventIdNumObj[eventId] = [dayStr, newNum];
        this.storeApi.putSync(key, JSON.stringify([dayStr, newNum]));
      }
    }
    return result;
  }

  // 设置事件当天打点数
  setLimitNum(eventId: string, num: number): void {
    // 设置到内存
    const dayStr = moment().format('YYYY-MM-DD');
    this.eventIdNumObj[eventId] = [dayStr, num];
    // 同步local
    const limit = this.limitMap.has(eventId) && this.limitMap.get(eventId);
    const syncNum = limit && limit[1] ? limit[1] : 10; // 没有配置同步频率，默认10次同步一次
    // 按照频率同步
    if (num % syncNum === 0) {
      const key = DATA_TRACK_PREFIX + eventId;
      const data = [dayStr, num];
      this.storeApi.putSync(key, JSON.stringify(data));
    }
  }

  clearAttributes(): void {
    window.DATracker.clear_attributes();
  }

  getAttributes(): Promise<DataTrackerProperties> {
    return new Promise(res => {
      window.DATracker.current_attributes((properties: DataTrackerProperties) => {
        res(properties);
      });
    });
  }

  registerAttributes(properties: DataTrackerProperties): void {
    window.DATracker.register_attributes(properties);
  }

  // 更新埋点配置
  updateAttributes(properties: Partial<Record<DataTrackerProp, any>>): void {
    try {
      window.DATracker.current_attributes(curProperties => {
        const newProperties = Object.assign(curProperties, properties);
        window.DATracker.register_attributes(newProperties);
      });
      const { domain, logginStatus, orgName, orgId, qiyeAccountId } = this.trackCommonOption;
      window.DATracker.oxpecker_set_product_profile({
        domain: properties.domain || domain,
        isLogin: properties.logginStatus || logginStatus,
        orgName: properties.orgName || orgName,
        orgId: properties.orgId || orgId,
        qiyeAccountId: properties.qiyeAccountId || qiyeAccountId,
      });
    } catch (err) {
      console.log(err);
    }
  }

  unregisterAttributes(prop: DataTrackerProp): void {
    window.DATracker.unregister_attributes(prop);
  }

  flush() {
    window.DATracker.oxpecker_flush();
  }

  setToken(token: string) {
    window.DATracker.oxpecker_set_token(token);
  }

  setNoLoggerUntil(noLoggerUntil: number): void {
    console.log(noLoggerUntil);
  }
}

const dataTrackerApiImp: Api = new DataTrackerApiImp();
api.registerLogicalApi(dataTrackerApiImp);
export default dataTrackerApiImp;
export const updateTrackerAttributes = (dataTrackerApiImp as DataTrackerApiImp).updateAttributes;
