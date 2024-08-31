/* eslint-disable max-lines */
import { AES, enc, lib, MD5, SHA1, mode, pad } from 'crypto-js';
import {
  ClipboardInterface,
  config,
  CreateWindowReq,
  CreateWindowRes,
  OnActiveFunc,
  ResponseWinInfo,
  rsaEncrypt,
  WindowHooksName,
  WindowHooksObserverConf,
  WinType,
  ruleEngine,
} from 'env_def';
// import { WinInfo } from 'sirius-desktop/src/declare/WindowManage';
// import System from '@sirius-desktop/web-setting/src/System/system';
import lodashGet from 'lodash/get';
import throttle from 'lodash/throttle';
import moment from 'moment';
import { api } from '@/api/api';

import {
  apis,
  configKeyStore,
  getUrl,
  inWindow,
  isElectron,
  isInMobile,
  URLKey,
  isLowMemoryMode,
  getUrlPre,
  systemProxyType,
  SYSTEM_PROXY_TYPE,
  defaultSystemProxyType,
} from '@/config';
import { anonymousFunction, ApiLifeCycleEvent, commonMessageReturn, NotificationType, PopUpMessageInfo, Properties, User } from '@/api/_base/api';
import { DataStoreApi, globalStoreConfig, StoreConfig, StoreData } from '@/api/data/store';
import {
  AccountAttrs,
  BrowserInfo,
  CurrentModuleType,
  DeviceInfo,
  IntervalEventParams,
  IntervalEventPeriod,
  NotificationContent,
  NotificationNumType,
  NotificationPerm,
  SystemApi,
  UrlHandleConfig,
  WindowInfo,
} from '@/api/system/system';
// import {ErrMsgCodeMap} from "../../api/errMap";
import { EventApi, SystemEvent, SystemEventTypeNames } from '@/api/data/event';
import { ListStore, NumberTypedMap, StringMap, StringTypedMap } from '@/api/commonModel';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { NetStorageApi } from '@/api/logical/netStorage';
import { DataTransApi, ResponseData } from '@/api/data/http';
import { LoginApi, StoredAccount } from '@/api/logical/login';
import { HtmlApi } from '@/api/data/html';
import { AccountApi } from '@/api/logical/account';
import { MailConfApi } from '@/api/logical/mail';
import { TaskCenterApi, SystemTask } from '@/api/logical/task_center';
import { locationHelper } from '@/api/util/location_helper';
import { emailPattern, getIn18Text } from '@/api/utils';
import { getOs } from '../../utils/confOs';
import { Lang, SYSTEM_LANGUAGE, DEFAULT_LANG } from '../../utils/global_label/index';

const LOW_MEMORY_MODE_KEY = 'lowMemoryMode';

const SYSTEM_PROXY_TYPE_STORE_KEY = 'useSystemProxyType';

const APP_LOCK_KEY = 'appLockKey';

const ZOOM_VAL_KEY = 'appPageZoomVal';

// import { CreateWindowReq } from 'sirius-desktop/src/declare/WindowManage';
// import { SimpleWinInfo } from 'sirius-desktop/src/declare/WindowManage';
// import { ContactApi, ContactModel } from '../../api/logical/contactAndOrg';

export const JsonFormatter = {
  stringify(cipherParams: lib.CipherParams) {
    // create json object with ciphertext
    const jsonObj: any = { c: cipherParams.ciphertext.toString(enc.Base64) };
    // optionally add iv or salt
    if (cipherParams.iv) {
      jsonObj.i = cipherParams.iv.toString(enc.Base64);
    }
    if (cipherParams.salt) {
      jsonObj.s = cipherParams.salt.toString(enc.Base64);
    }
    // stringify json object
    return JSON.stringify(jsonObj);
  },
  parse(jsonStr: string) {
    // parse json string
    const jsonObj = JSON.parse(jsonStr);
    // extract ciphertext from json object, and create cipher params object
    if (!jsonObj.c || !jsonObj.i || !jsonObj.s) {
      throw new Error('illegal input');
    }
    const cipherParams = lib.CipherParams.create({
      ciphertext: enc.Base64.parse(jsonObj.c),
    });
    // optionally extract iv or salt
    if (jsonObj.i) {
      cipherParams.iv = enc.Base64.parse(jsonObj.i);
    }
    if (jsonObj.s) {
      cipherParams.salt = enc.Base64.parse(jsonObj.s);
    }
    return cipherParams;
  },
};
type EventManager = {
  events: ListStore<IntervalEventParams>;
  eventKeys: { [k: string]: number };
  eid: number;
  period: number;
  disable?: boolean;
};
type EventStore = Record<IntervalEventPeriod, EventManager>;

const ver = config('version') as string;

const isPord = config('stage') === 'prod';

const currentSessionNameKey = 'SessionName';
const currentSessionStoreConfig = { noneUserRelated: true };
const trackCpuMemKey = 'track_cpu_mem';

class SystemApiImpl implements SystemApi {
  redirectUrlPrefix: Map<string, UrlHandleConfig> = new Map<string, UrlHandleConfig>();

  static sysNotificationTags: Record<NotificationType, string> = {
    mail: 'mail',
    im: 'im',
    sys: 'sys',
    whatsApp: 'whatsApp',
    facebook: 'facebook',
  };

  static defaultTag: NotificationType = 'sys' as NotificationType;

  static readonly host: string = config('host') as string;

  static readonly hostForTest = config('diskHost') as string;

  static readonly contextPath = config('contextPath') as string;

  static readonly loginPage: string = ((config('host') as string) + config('loginPage')) as string;

  static readonly mloginPage: string = ((config('host') as string) + config('mloginPage')) as string;

  static resourceRouterConfig: string[] = ['sheet', 'doc', 'share', 'unitable'];

  static defaultPassKey: string = config('globalKey') as string;

  static defaultSalt: string = config('globalSalt') as string;

  static readonly corpConf = config('mail_mode_corpMail');

  static readonly domesticHost = isPord ? (config('domesticHost') as string) : '';

  static readonly webMailHZHost = config('webMailHZHost') as string;

  static readonly webMailBJHost = config('webMailBJHost') as string;

  static isLowMemoryMode = isLowMemoryMode;

  static systemProxyType = systemProxyType;

  static hostTypes = {
    domestic: 'domestic',
    smartDNSHost: 'smartDNSHost',
  };

  static hostTypeToUrlMap = {
    domestic: 'https://lingxi-domestic.office.163.com/login/',
    smartDNSHost: 'https://lingxi.office.163.com/login/',
  };

  static emdHostTypeToUrlMap = {
    domestic: 'https://waimao-domestic.office.163.com/login/',
    smartDNSHost: 'https://waimao.office.163.com/login/',
  };

  static readonly STORE_HOST_TYPE_KEY = 'host_type';

  static readonly STORE_HOST_TYPE_CONFIG = { noneUserRelated: true };

  static useDomesticHost = false;

  static charSeq: string = (config('globalSeq') as string[]).join('');

  // static webMailHost: string = config('webMailHost') as string;

  static domain: string = config('domain') as string;

  static msgCodeCookieName: string = config('msgCodeCookieName') as string;

  apiStartTime = 0;

  winMap: NumberTypedMap<WindowInfo> | undefined;

  cookies: StringMap;

  subAccountCookies: { [key: string]: StringMap } = {};

  contextPath = '';

  isMsiBuild = false;

  static key = '';

  static eventStore: EventStore = {
    extLong: {
      events: new ListStore<IntervalEventParams>(),
      eventKeys: {},
      eid: -1,
      period: 600000,
    },
    long: {
      events: new ListStore<IntervalEventParams>(),
      eventKeys: {},
      eid: -1,
      period: 90000,
    },
    mid: {
      events: new ListStore<IntervalEventParams>(),
      eventKeys: {},
      eid: -1,
      period: 15000,
    },
    short: {
      events: new ListStore<IntervalEventParams>(),
      eventKeys: {},
      eid: -1,
      period: 1000,
    },
  };

  static networkFail = 0;

  // static accountPattern = /^([a-zA-Z0-9][a-zA-Z0-9_\-.+#']*)@([a-zA-Z0-9_\-.]+\.[a-zA-Z]{2,})$/;
  static accountPattern = emailPattern;

  static cookiePattern = /([a-zA-Z_\-.]+)=([^;]+)(;|$)/gi;

  static readonly keyOfProxyOn = 'oneSiteProxyOn';

  static proxyOn = false;

  browserAgentIdStr: StringTypedMap<[RegExp, number]> = {
    ie: [/msie ([\d.]+);/i, 100],
    edge: [/edge?\/([\d.]+)/i, 100],
    firefox: [/firefox\/([\d.]+)/i, 100],
    chrome: [/chrome\/?([\d.]+)/i, 10],
    safari: [/safari\/([\d.]+)/i, 1],
    opera: [/opera ([\d.]+)/i, 100],
    sirius: [/sirius-desktop\/([\d.]+)/i, 1100],
    uc: [/UCBrowser\/([\d.]+)/i, 1000],
    qq: [/QQBrowser\/([\d.]+)/i, 1000],
    sogou: [/MetaSr ?([\d.]+)/i, 1000],
  };

  // regStr_edge = /edg\/[\d.]+;/gi;
  // regStr_ff = /firefox\/[\d.]+/gi;
  // regStr_chrome = /chrome\/[\d.]+/gi;
  // regStr_saf = /safari\/[\d.]+/gi;
  // regStr_opera = /Opera [\d.]+/gi;
  name: string;

  private storeApi: DataStoreApi;

  private eventApi: EventApi;

  private dataTracker: DataTrackerApi;

  private loggerApi: DataTrackerApi;

  private httpApi: DataTransApi;

  private netStorageApi: NetStorageApi;

  private mailConfApi: MailConfApi;

  htmlApi: HtmlApi;

  private loginApi: LoginApi;

  private accountApi: AccountApi;

  private taskCenterApi: TaskCenterApi;

  winInfo?: ResponseWinInfo;

  private _notificationAvailableLabel = 2;

  private _currentShowedNotification = 0;

  private systemMusic: null | HTMLAudioElement = null;

  private throttlePlaySystemAudio: () => void;

  // host = config('host') as string;
  webmailHZHost = config('webMailHZHost') as string;

  webmailBJHost = config('webMailBJHost') as string;

  // jumpInternalPageType: WinType[] = ['doc', 'sheet', 'unitable', 'share', 'writeMail'];
  jumpInternalPageType: WinType[] = ['doc', 'sheet', 'share', 'writeMail', 'cluePreview', 'openSeaPreview', 'customerPreview', 'opportunityPreview', 'unitable'];

  readonly isMac: boolean = getOs() === 'mac';

  private isLockingApp: boolean | null = null;

  // winInfo:WinInfo|undefined;

  // eslint-disable-next-line max-statements
  constructor() {
    this.contextPath = config('contextPath') as string;
    this.isMsiBuild = config('is_msi_build')?.toString() === 'true';
    this.name = apis.defaultSystemApiImpl;
    this.storeApi = api.getDataStoreApi();
    this.eventApi = api.getEventApi();
    this.mailConfApi = api.requireLogicalApi(apis.mailConfApiImpl) as MailConfApi;
    this.netStorageApi = api.requireLogicalApi(apis.netStorageImpl) as NetStorageApi;
    this.dataTracker = api.requireLogicalApi(apis.dataTrackerApiImp) as DataTrackerApi;
    this.htmlApi = api.requireLogicalApi(apis.htmlApi) as HtmlApi;
    this.loggerApi = api.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;
    this.httpApi = api.getDataTransApi();
    this.accountApi = api.requireLogicalApi(apis.accountApiImpl) as AccountApi;
    this.taskCenterApi = api.requireLogicalApi(apis.taskCenterApiImpl) as TaskCenterApi;
    this.loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;

    // if (inWindow() && window.Notification && window.Notification.maxActions) {
    //   this._notificationAvailableLabel = Notification.maxActions;
    // }

    if (inWindow() && window.electronLib) {
      this.winMap = {};
      this.getCurrentWinInfo().then();
    }
    this.cookies = {};
    this.handleInternalUrlWebJump = this.handleInternalUrlWebJump.bind(this);
    const diskDetailPageHandler = {
      handleUrl: this.handleInternalUrlWebJump,
      openInElectron: true,
      needTransferUseApi: false,
      needUploadAccountInfo: false,
      openInternalPage: true,
    };
    const diskFolderAnchorPageHandler = {
      handleUrl: this.handleDiskShareWebJump.bind(this),
      openInElectron: true,
      needTransferUseApi: false,
      needUploadAccountInfo: false,
      openInternalPage: true,
    };
    this.redirectUrlPrefix.set(SystemApiImpl.hostForTest + '/share/', diskFolderAnchorPageHandler);
    this.redirectUrlPrefix.set(SystemApiImpl.hostForTest + '/sheet', diskDetailPageHandler);
    this.redirectUrlPrefix.set(SystemApiImpl.hostForTest + '/doc', diskDetailPageHandler);
    this.redirectUrlPrefix.set(SystemApiImpl.hostForTest + '/unitable', diskDetailPageHandler);
    this.redirectUrlPrefix.set(SystemApiImpl.hostForTest + '/resources', diskDetailPageHandler);
    const cluePreviewHandler = {
      handleUrl: (url: string) => {
        if (this.isElectron()) {
          const query = new URLSearchParams(url.split('?')[1]);
          const clue_id = query.get('clue_id');

          this.createWindowWithInitData('cluePreview', {
            eventName: 'initPage',
            eventData: { clue_id },
          });
        } else {
          this.openNewWindow(url);
        }

        return '';
      },
    };
    const openSeaPreviewHandler = {
      handleUrl: (url: string) => {
        if (this.isElectron()) {
          const query = new URLSearchParams(url.split('?')[1]);
          const clue_open_sea_id = query.get('clue_open_sea_id');

          this.createWindowWithInitData('openSeaPreview', {
            eventName: 'initPage',
            eventData: { clue_open_sea_id },
          });
        } else {
          this.openNewWindow(url);
        }

        return '';
      },
    };
    const customerPreviewHandler = {
      handleUrl: (url: string) => {
        if (this.isElectron()) {
          const query = new URLSearchParams(url.split('?')[1]);
          const company_id = query.get('company_id');

          this.createWindowWithInitData('customerPreview', {
            eventName: 'initPage',
            eventData: { company_id },
          });
        } else {
          this.openNewWindow(url);
        }

        return '';
      },
    };
    const opportunityPreviewHandler = {
      handleUrl: (url: string) => {
        if (this.isElectron()) {
          const query = new URLSearchParams(url.split('?')[1]);
          const opportunity_id = query.get('opportunity_id');

          this.createWindowWithInitData('opportunityPreview', {
            eventName: 'initPage',
            eventData: { opportunity_id },
          });
        } else {
          this.openNewWindow(url);
        }

        return '';
      },
    };
    this.redirectUrlPrefix.set(SystemApiImpl.hostForTest + '/share/', diskFolderAnchorPageHandler);
    this.redirectUrlPrefix.set(SystemApiImpl.hostForTest + '/sheet', diskDetailPageHandler);
    this.redirectUrlPrefix.set(SystemApiImpl.hostForTest + '/doc', diskDetailPageHandler);
    this.redirectUrlPrefix.set('/cluePreview', cluePreviewHandler);
    this.redirectUrlPrefix.set('/openSeaPreview', openSeaPreviewHandler);
    this.redirectUrlPrefix.set('/customerPreview', customerPreviewHandler);
    this.redirectUrlPrefix.set('/opportunityPreview', opportunityPreviewHandler);
    this.redirectUrlPrefix.set(SystemApiImpl.hostForTest + '/resources', diskDetailPageHandler);
    this.redirectUrlPrefix.set(SystemApiImpl.hostForTest + '/#disk', {
      handleUrl: this.handleDiskPageRouteJump.bind(this),
    });
    const mailPageJumpHandler = {
      handleUrl: this.handleMailReadingPageJump.bind(this),
    };
    const mailTeamPageJumpHandler = {
      handleUrl: this.handleMailReadingOnlyPageJump.bind(this),
    };
    this.redirectUrlPrefix.set('https://sirius.qiye.163.com/router/mail/detail', mailPageJumpHandler);
    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/mail/in-team-detail', mailTeamPageJumpHandler);
    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/mail/detail', mailPageJumpHandler);
    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/mail/mailsetting', {
      handleUrl: this.handleSettingWebJump.bind(this),
    });
    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/calendar/home', {
      handleUrl: this.handleScheduleJump.bind(this),
    });

    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/calendar/jump_schedule_detail', {
      handleUrl: this.handleScheduleJump.bind(this),
    });
    this.redirectUrlPrefix.set('https://sirius.qiye.163.com/router/mail/detail', mailPageJumpHandler);
    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/mail/in-team-detail', mailTeamPageJumpHandler);
    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/mail/detail', mailPageJumpHandler);

    this.redirectUrlPrefix.set(SystemApiImpl.host + '/it-notify-manage/api/pub/notify/visit', {
      handleUrl: (url: string) => {
        const { searchParams } = new URL(url);
        const redirect = searchParams.get('redirect') || '';
        const sign = searchParams.get('sign') || '';

        if (!redirect) return '';

        if (sign) {
          this.httpApi.get(SystemApiImpl.host + '/it-notify-manage/api/pub/notify/linkLog', { sign }).catch(() => {});
        }

        if (!redirect.startsWith(SystemApiImpl.host)) return redirect;

        return this.handleEdmPageRouteJump(redirect);
      },
    });

    this.redirectUrlPrefix.set(SystemApiImpl.host + '/#edm', {
      handleUrl: (url: string) => this.handleEdmPageRouteJump(url),
    });
    this.redirectUrlPrefix.set(SystemApiImpl.host + '/#customer', {
      handleUrl: (url: string) => this.handleEdmPageRouteJump(url),
    });
    this.redirectUrlPrefix.set(SystemApiImpl.host + '/#/unitable-crm', {
      handleUrl: (url: string) => this.handleUnitableCrmRouteJump(url),
    });
    // this.redirectUrlPrefix.set(SystemApiImpl.host + '/#globalSearch', {
    //   handleUrl: (url: string) => this.handleEdmPageRouteJump(url)
    // });
    this.redirectUrlPrefix.set(SystemApiImpl.host + '/#wmData', {
      handleUrl: (url: string) => this.handleEdmPageRouteJump(url),
    });
    this.redirectUrlPrefix.set(SystemApiImpl.host + '/#systemTask', {
      handleUrl: (url: string) => this.handleEdmPageRouteJump(url),
    });
    this.redirectUrlPrefix.set(SystemApiImpl.host + '/#enterpriseSetting', {
      handleUrl: (url: string) => this.handleEdmPageRouteJump(url),
    });
    this.redirectUrlPrefix.set(SystemApiImpl.host + '/#site?page=sns', {
      handleUrl: (url: string) => this.handleEdmPageRouteJump(url),
    });
    this.redirectUrlPrefix.set(SystemApiImpl.host + '/#sns', {
      handleUrl: (url: string) => this.handleEdmPageRouteJump(url),
    });
    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/mail/mailsetting', {
      handleUrl: this.handleSettingWebJump.bind(this),
    });
    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/calendar/home', {
      handleUrl: this.handleScheduleJump.bind(this),
    });

    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/calendar/jump_schedule_detail', {
      handleUrl: this.handleScheduleJump.bind(this),
    });

    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/globalSearch/home', {
      handleUrl: this.handleGlobalSearchJump.bind(this),
    });
    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/customsData/home', {
      handleUrl: this.handleCustomsDataJump.bind(this),
    });
    this.redirectUrlPrefix.set('https://hubble.netease.com/sl/aaag0w', {
      handleUrl: this.handleImWebJump.bind(this),
    });
    // this.redirectUrlPrefix.set('/#disk', {
    //   handleUrl: this.handleDiskPageRouteJump,
    // });
    // this.redirectUrlPrefix.set(SystemApiImpl.hostForTest + '/#disk?', {
    //   handleUrl: this.handleInternalUrlWebJump.bind(this),
    //   openInElectron: true,
    //   needTransferUseApi: false,
    //   needUploadAccountInfo: false,
    //   openInternalPage: true,
    // });
    // this.redirectUrlPrefix.set(this.host + '/login', {});
    const mailHandler = {
      handleUrl: this.handleMailUrl.bind(this),
      needTransferUseApi: false,
      openInElectron: false,
    };
    this.redirectUrlPrefix.set(this.webmailBJHost, mailHandler);
    this.redirectUrlPrefix.set(this.webmailHZHost, mailHandler);
    this.redirectUrlPrefix.set('https://router.lx.netease.com/sirius/desktop/unitableReport', {
      handleUrl: this.handleDesktopUnitableReport.bind(this),
    });
    this.throttlePlaySystemAudio = throttle(this.playSystemAudio, 1500, { trailing: false });
  }

  getContextPath(): string {
    return (config('contextPath') as string) || '';
  }

  async getUserConfig(keys: string[]): Promise<AccountAttrs[]> {
    const contextUrl = this.getUrl('getUserConfig');
    const params = { accountAttrs: keys };
    const result = await this.httpApi
      .post(contextUrl, params, { contentType: 'json' })
      .then((res: ResponseData) => {
        if (res && res.data && res.data.success) {
          return res.data.data?.accountAttrs as AccountAttrs[];
        }
        return Promise.reject(new Error('请求未成功'));
      })
      .catch(e => {
        console.warn('getUserConfig error', e);
        return [];
      });
    return result;
  }

  async setUserConfig(attrs: AccountAttrs[]): Promise<boolean> {
    const contextUrl = this.getUrl('setUserConfig');
    const params = { accountAttrs: attrs };
    const result = await this.httpApi
      .post(contextUrl, params, { contentType: 'json' })
      .then((res: ResponseData) => !!(res && res.data && res.data.success))
      .catch(e => {
        console.warn('setMailConfig error', e);
        return false;
      });
    return result;
  }

  getTimeZoneList() {
    return [
      { key: 999, value: `${getIn18Text('timeZoneDefault')} (${Intl.DateTimeFormat().resolvedOptions().timeZone})` },
      { key: 0, value: getIn18Text('timeZone0') },
      { key: 1, value: getIn18Text('timeZone1') },
      { key: 2, value: getIn18Text('timeZone2') },
      { key: 3, value: getIn18Text('timeZone3') },
      { key: 4, value: getIn18Text('timeZone4') },
      { key: 5, value: getIn18Text('timeZone5') },
      { key: 6, value: getIn18Text('timeZone6') },
      { key: 7, value: getIn18Text('timeZone7') },
      { key: 8, value: getIn18Text('timeZone8') },
      { key: 9, value: getIn18Text('timeZone9') },
      { key: 10, value: getIn18Text('timeZone10') },
      { key: 11, value: getIn18Text('timeZone11') },
      { key: 12, value: getIn18Text('timeZone12') },
      { key: -1, value: getIn18Text('timeZone-1') },
      { key: -2, value: getIn18Text('timeZone-2') },
      { key: -3, value: getIn18Text('timeZone-3') },
      { key: -4, value: getIn18Text('timeZone-4') },
      { key: -5, value: getIn18Text('timeZone-5') },
      { key: -6, value: getIn18Text('timeZone-6') },
      { key: -7, value: getIn18Text('timeZone-7') },
      { key: -8, value: getIn18Text('timeZone-8') },
      { key: -9, value: getIn18Text('timeZone-9') },
      { key: -10, value: getIn18Text('timeZone-10') },
      { key: -11, value: getIn18Text('timeZone-11') },
      { key: -12, value: getIn18Text('timeZone-12') },
    ];
  }

  getSystemTimeZone() {
    const useLocalZone = this.mailConfApi.getLocalTimezone();
    const timeZone = useLocalZone ? -(new Date().getTimezoneOffset() / 60) : this.mailConfApi.getTimezone();
    return this.getTimeZoneList().find(v => v.key === timeZone);
  }

  getDateByTimeZone(originDate: number | string | Date, timeDiff: number, isMailDate?: boolean): number {
    try {
      const useLocalTimeZone = this.mailConfApi.getLocalTimezone();
      // 默认系统时区是东8
      let _timeDiff = useLocalTimeZone ? 8 : timeDiff; // (timeDiff || this._jetlag);
      let _originDate = originDate;
      // 获取偏移时间差（小时） 本地时区强改为-8
      const offset = -8;
      // 字符串形式时间戳处理
      if (typeof originDate === 'string' && Number.isInteger(Number(originDate))) {
        _originDate = Number(originDate);
      } else if (typeof originDate === 'string' && originDate.indexOf('-') !== -1) {
        _originDate = originDate.replace(/-/g, '/');
      } else {
        _originDate = originDate;
      }
      _originDate = new Date(_originDate);
      // 邮件展示时区特殊处理
      if (useLocalTimeZone && isMailDate) {
        _timeDiff = -(new Date().getTimezoneOffset() / 60);
      }

      return _originDate.getTime() + (_timeDiff + offset) * 60 * 60 * 1000;
    } catch (error) {
      console.warn(`getDateByTimeZone error: originDate ${originDate}`);
      return 0;
    }
  }

  // 时区转换
  timeZoneTrans(timeStr: string, fromTimeZone: number | string, toTimeZone: number | string) {
    const dateArr = timeStr?.trim().split(/\s+/);
    if (dateArr?.length < 2) return null;

    let fromTimeZone1 = Number(fromTimeZone);
    // 跟随系统
    if (fromTimeZone1 - 999 === 0) {
      const systemTimeZone = this.getSystemTimeZone()?.key || 8;
      fromTimeZone1 = systemTimeZone;
    }

    const abs = Math.abs(fromTimeZone1);
    const utcStr = dateArr[0] + 'T' + dateArr[1] + (fromTimeZone1 > 0 ? '+' : '-') + (abs < 10 ? '0' + abs : abs) + ':00';
    // 选中的时区时间
    const selectedMoment = moment(utcStr);
    const systemMoment = moment(selectedMoment.valueOf()).utcOffset(Number(toTimeZone));
    return systemMoment;
  }

  getSystemProxyTypeSync(): SYSTEM_PROXY_TYPE {
    if (!process.env.BUILD_ISELECTRON) {
      return defaultSystemProxyType;
    }
    return SystemApiImpl.systemProxyType;
  }

  private updateHostType() {
    if (!inWindow()) return;
    const isElectron = this.isElectron();
    let hostType = '';
    if (isElectron) {
      const hostTypeStoreInfo = this.storeApi.getSync(SystemApiImpl.STORE_HOST_TYPE_KEY, SystemApiImpl.STORE_HOST_TYPE_CONFIG);
      if (hostTypeStoreInfo.suc && hostTypeStoreInfo.data) {
        hostType = hostTypeStoreInfo.data;
      }
    } else {
      // web端通过hostname来判断
      const hostName = document.location.host;
      const hostNameToHostType = {
        'lingxi-domestic.office.163.com': SystemApiImpl.hostTypes.domestic,
        'lingxi.office.163.com': SystemApiImpl.hostTypes.smartDNSHost,
      };
      // @ts-ignore
      hostType = hostNameToHostType[hostName];
    }

    if (hostType) {
      if (hostType === SystemApiImpl.hostTypes.domestic) {
        SystemApiImpl.useDomesticHost = true;
        this.setProxyOn(true);
        return;
      }
    }
    this.setProxyOn(false);
    SystemApiImpl.useDomesticHost = false;
  }

  getWebMailLangStr() {
    if (inWindow()) {
      return window.systemLang === 'en' ? 'en_US' : 'zh_CN';
    }
    return 'zh_CN';
  }

  // 解码方法
  decodeSessionName(_session: string) {
    if (!_session) return null;
    const sessionStr = decodeURIComponent(_session);
    const sessionArr = sessionStr.split(':');
    if (sessionArr[1]) {
      let mainEmail = '';
      if (window && window.isAccountBg) {
        mainEmail = this.getMainAccount().email;
      } else {
        const currentUser = this.getCurrentUser();
        mainEmail = currentUser?.id || '';
      }
      if (mainEmail) {
        const subEmail = sessionArr[1].replace(`${mainEmail}-`, '');
        return {
          mainEmail,
          subEmail,
        };
      }
    }
    return null;
  }

  async getActiveUserTrackParams(isShareAccount?: boolean) {
    try {
      const trackParam = {
        installSource: '',
        language: '',
        agentNumber: 0,
        accountType: '主账号',
      };
      const langMap = {
        zh: '中文版',
        en: '英文版',
        'zh-trad': '繁体中文版',
      };

      trackParam.language = langMap[window.systemLang || DEFAULT_LANG];
      if (process.env.BUILD_ISELECTRON && window.process) {
        const { process } = window;
        const isX64 = process.arch.toLowerCase() === 'x64';
        const { isMac } = window.electronLib.env;
        if (isMac) {
          trackParam.installSource = isX64 ? 'dmg_x64' : 'dmg_arm64';
        } else if (this.isMsiBuild) {
          trackParam.installSource = isX64 ? 'msi_x64' : 'msi_ia32';
        } else {
          trackParam.installSource = isX64 ? 'exe_x64' : 'exe_ia32';
        }
      }

      const currentUser = this.getCurrentUser();
      if (process.env.BUILD_ISELECTRON) {
        const subAccounts = currentUser ? await this.accountApi.getSubAccounts({ expired: false }) : [];
        trackParam.agentNumber = subAccounts && subAccounts.length ? subAccounts.length : 0;
      }
      const hasIsShareAccountParam = typeof isShareAccount !== 'undefined';

      if (currentUser?.isSharedAccount) {
        trackParam.accountType = '公共账号-切换';
      } else {
        const isSharedAccount = hasIsShareAccountParam ? isShareAccount : await this.accountApi.getIsSharedAccountAsync();
        if (isSharedAccount) {
          trackParam.accountType = '公共账号-授权码登录';
        }
      }
      return trackParam;
    } catch (ex) {
      console.error(ex);
      return {};
    }
  }

  private dailyActiveApp: IntervalEventParams = {
    eventPeriod: 'extLong',
    handler: async () => {
      // 90s 后执行自动同步
      const isMainPage = this.isMainPage();
      const currentUser = this.getCurrentUser();
      if (currentUser && !isMainPage) return;
      const trackParam = (await this.getActiveUserTrackParams()) || {};
      this.dataTracker.track('pc_dailyActiveUser', {
        type: 'activeStatus',
        ...trackParam,
      });
    },
    id: 'dailyActiveApp',
    seq: 0,
  };

  handleMailReadingPageJump(link: string, urlHandler?: UrlHandleConfig) {
    if (urlHandler) {
      console.log('has urlHandler : ', urlHandler);
    }
    const url = new URL(link);
    const qr = new URLSearchParams(url.search);
    // /sirius/mail/detail?mailId={id}
    const mid = qr.get('mailId') || qr.get('mid');
    if (this.isElectron()) {
      this.createWindowWithInitData(
        { type: 'readMail', additionalParams: { account: '' } },
        {
          eventName: 'initPage',
          eventData: mid,
          _account: '',
        }
      );
    } else {
      this.openNewWindow(
        SystemApiImpl.contextPath + `/readMail/?id=${mid}`
        // , 'readMail',
        // 'menubar=0,scrollbars=1,resizable=1,width=800,height=600'
      );
    }
    return '';
  }

  // 只读读信页
  handleMailReadingOnlyPageJump(link: string, urlHandler?: UrlHandleConfig) {
    if (urlHandler) {
      console.log('has urlHandler : ', urlHandler);
    }
    const url = new URL(link);
    const qr = new URLSearchParams(url.search);
    // /sirius/mail/detail?mailId={id}
    const mid = qr.get('mid') || qr.get('id');
    const teamId = qr.get('teamId');
    if (mid) {
      if (this.isElectron()) {
        this.createWindowWithInitData(
          { type: 'readMailReadOnly', additionalParams: { account: '' } },
          {
            eventName: 'initPage',
            eventData: { mid, teamId },
            eventStrData: '',
            _account: '',
          }
        ).then();
      } else {
        window.open(SystemApiImpl.contextPath + `/readMailReadOnly/?id=${mid}&teamId=${teamId}`, 'readMail', 'menubar=0,scrollbars=1,resizable=1,width=800,height=600');
      }
    }
    return '';
  }

  handleDiskPageRouteJump(link: string, urlHandler?: UrlHandleConfig) {
    if (urlHandler) {
      console.log('has urlHandler : ', urlHandler);
    }
    const url: URL = new URL(link);
    const searchUrl = url.hash.split('?')[1];
    if (searchUrl) {
      const searchParams = new URLSearchParams(searchUrl);
      const startTime = searchParams.get('shareTime') || searchParams.get('startTime');
      const endTime = searchParams.get('endTime');
      if (startTime && endTime) {
        // navigate('/#disk', { state: { defaultRangeTime: [Number(startTime), Number(endTime)] } });
        this.eventApi.sendSysEvent({
          eventName: 'routeChange',
          eventStrData: 'gatsbyStateNav',
          eventData: {
            url: '/#disk',
            state: { defaultRangeTime: [Number(startTime), Number(endTime)] },
          },
        });
      }
    }
    // 自行处理，啥也不返回
    return '';
  }

  private parseUrlObjectParams = (hash: string) => {
    const params: any = {};
    hash
      .replace('#', '')
      .split('&')
      .forEach(param => {
        const [key, value] = param.split('=');
        params[key] = value;
      });
    return params;
  };

  handleEdmPageRouteJump(link: string) {
    const urlWithoutHost = link.substring(SystemApiImpl.host.length);
    if (this.isElectron()) {
      this.eventApi.sendSysEvent({
        eventName: 'routeChange',
        eventStrData: 'gatsbyStateNav',
        eventData: {
          url: urlWithoutHost,
        },
      });
      return '';
    }
    return this.handleInternalUrlWebJump(link);
  }

  handleUnitableCrmRouteJump(link: string) {
    if (this.isElectron()) {
      const getHashString = (url: string) => {
        const hashIndex = url.indexOf('#/');
        if (hashIndex === -1) {
          return '';
        }
        return url.substring(hashIndex);
      };

      window.location.hash = getHashString(link);
      // this.eventApi.sendSysEvent({
      //   eventName: 'routeChange',
      //   eventStrData: 'gatsbyStateNav',
      //   eventData: {
      //     url: urlWithoutHost,
      //   },
      // });
      return '';
    }
    return this.handleInternalUrlWebJump(link);
  }

  handleInternalUrlWebJump(url: string, urlHandler?: UrlHandleConfig) {
    const parseUrl = new URL(url);
    if (parseUrl && parseUrl.pathname) {
      if (urlHandler && this.isElectron()) {
        if (urlHandler.openInElectron) {
          // 此分支打开内部浏览器展示页面
          if (!urlHandler.openInternalPage) {
            const newUrl = 'customer'; // in ['sheet','doc','share'])?'/';
            urlHandler.originUrl = url;
            return newUrl;
          }
          const _pathName = parseUrl.pathname.replaceAll('/', '');
          urlHandler.data = {
            eventName: 'initPage',
            eventData: {
              hash: url,
            },
          } as SystemEvent;
          // 桌面端 跳转到 ['/sheet/','/doc/','/share/'] 跳转到统一多页签resources窗口
          if (SystemApiImpl.resourceRouterConfig.indexOf(_pathName) !== -1) {
            // 是否包含跳转窗口标识
            if (url.indexOf('targetWindow') !== -1) {
              const paramsObj = this.parseUrlObjectParams(parseUrl.hash);
              urlHandler.data.eventData.windowId = paramsObj.targetWindow;
              urlHandler.data.eventData.hash = url.replace(/\&targetWindow=\w+/, '');
            }
            // doc 和 sheet 参数强行指定 type
            // fix QIYE163-20234 type 值被改为reaction
            if (_pathName !== 'share') {
              const { hash } = urlHandler.data.eventData;
              // eslint-disable-next-line max-depth
              if (hash?.includes('type=')) {
                urlHandler.data.eventData.hash = hash?.replace(/type=\w+/, `type=${_pathName}`);
              } else {
                urlHandler.data.eventData.hash = `${hash}&type=${_pathName}`;
              }
            }
            return 'resources';
          }
          return _pathName;
        }
        const newUrl = SystemApiImpl.loginPage + '#' + encodeURIComponent(parseUrl.pathname + (parseUrl.hash ? parseUrl.hash : ''));
        return newUrl;
      }
    }
    return url;
  }

  handleDiskShareWebJump(url: string, urlHandler?: UrlHandleConfig) {
    const parseUrl = new URL(url);
    if (parseUrl && parseUrl.pathname && urlHandler && this.isElectron() && urlHandler.openInElectron) {
      const _pathName = parseUrl.pathname.replaceAll('/', '');
      const params = this.parseUrlObjectParams(parseUrl.hash?.toLowerCase());
      if (_pathName === 'share' && params?.type === 'folder') {
        // TODO 获取URL
        this.netStorageApi
          .getLinkInfo({
            linkUrl: url,
          })
          .then((res: any) => {
            // console.log('res.content?.bizCode?', res.content?.bizCode?.toLowerCase())
            params.from = res.content?.bizCode?.toLowerCase() || params.from;
            this.eventApi.sendSysEvent({
              eventName: 'routeChange',
              eventStrData: 'gatsbyStateNav',
              asInnerMsg: true,
              eventData: {
                url: '/#disk',
                state: { anchorFolder: params },
              },
            });
          });

        return '';
      }
    }
    return this.handleInternalUrlWebJump(url, urlHandler);
  }

  handleSettingWebJump() {
    this.eventApi.sendSysEvent({
      eventName: 'routeChange',
      eventStrData: 'gatsbyNav',
      eventData: {
        url: '/#setting',
        state: {
          currentTab: 'mail',
        },
      },
    });
    return '';
  }

  handleImWebJump() {
    this.eventApi.sendSysEvent({
      eventName: 'routeChange',
      eventStrData: 'gatsbyNav',
      eventData: {
        url: '/#message',
        state: {
          currentTab: 'mail',
        },
      },
    });
    return '';
  }

  /**
   * 处理汇报相关邮件的拦截器
   * @param link
   */
  handleDesktopUnitableReport(link: string) {
    console.log(link);
    const url: URL = new URL(link);
    const siriusLinkControlFlag = url.searchParams.get('siriusLinkControlFlag');
    const siriusLinkControlPayload = url.searchParams.get('siriusLinkControlPayload');
    let payloadData: {
      reportEventSource?: string;
      reportType?: string;
    } = {};
    try {
      payloadData = siriusLinkControlPayload ? JSON.parse(decodeURIComponent(siriusLinkControlPayload)) : {};
    } catch (error) {
      payloadData = {};
    }
    let target = 'appsHome';

    /** 用于埋点 */
    let dataTrackOperaType = '';

    switch (siriusLinkControlFlag) {
      case 'appDailyReportWrite':
        target = 'appsDailyReport';
        dataTrackOperaType = `daily_${payloadData.reportEventSource}`;
        break;
      case 'appWeeklyReportWrite':
        target = 'appsWeeklyReport';
        dataTrackOperaType = `weekly_${payloadData.reportEventSource}`;
        break;
      case 'appViewMoreReports':
        // eslint-disable-next-line no-case-declarations
        const isweekly = payloadData.reportType === 'weekly';
        target = isweekly ? 'appsWeeklyReportDetail' : 'appsDailyReportDetail';
        dataTrackOperaType = `${payloadData.reportType}_view`;
        break;
      default:
        break;
    }

    this.dataTracker.track('report_mail_behavior', {
      opera_type: dataTrackOperaType,
    });

    this.eventApi.sendSysEvent({
      eventName: 'routeChange',
      eventStrData: 'gatsbyStateNav',
      eventData: {
        url: `#apps?pageId=${target}`,
        state: {
          siriusLinkControlPayload,
        },
      },
    });

    return '';
  }

  // 跳转日历
  handleScheduleJump(link: string, urlHandler?: UrlHandleConfig) {
    if (urlHandler) {
      console.log('has urlHandler : ', urlHandler);
    }
    // Path: home-列表。detail-详情
    // type：month/week/threeDays/day - 月/周/三日/日
    // time：时间戳？？
    const url: URL = new URL(link);
    if (url.search) {
      const searchParams = new URLSearchParams(url.search);
      // 如果时间没有获取到则默认今天
      const time = searchParams.get('time') || +new Date();
      this.eventApi.sendSysEvent({
        eventName: 'routeChange',
        eventStrData: 'gatsbyStateNav',
        eventData: {
          url: '/#schedule',
          state: { type: 'timeGridWeek', time },
        },
      });
    }
    // 自行处理，啥也不返回
    return '';
  }

  handleGlobalSearchJump(link: string, urlHandler?: UrlHandleConfig) {
    if (urlHandler) {
      console.log('has urlHandler : ', urlHandler);
    }
    const url: URL = new URL(link);
    const searchParams = new URLSearchParams(url.search);
    const page = searchParams.get('page') || '';
    // 如果时间没有获取到则默认今天
    this.eventApi.sendSysEvent({
      eventName: 'routeChange',
      eventStrData: 'gatsbyStateNav',
      eventData: {
        url: `/#wmData?page=${page}`,
      },
    });
    return '';
  }

  handleCustomsDataJump(link: string) {
    const url: URL = new URL(link);
    const searchParams = new URLSearchParams(url.search);
    const page = searchParams.get('page') || '';
    // 如果时间没有获取到则默认今天
    this.eventApi.sendSysEvent({
      eventName: 'routeChange',
      eventStrData: 'gatsbyStateNav',
      eventData: {
        url: `/#wmData?page=${page}`,
      },
    });
    return '';
  }

  handleMailUrl(url: string, urlConfig?: UrlHandleConfig) {
    console.log('[sys] handle mail Url', url, urlConfig);
    const currentUser: User | undefined = this.getCurrentUser();
    if (currentUser) {
      const searchValue = /sid=[0-9A-Za-z*\-_]+/i;
      if (searchValue.test(url)) {
        return url.replace(searchValue, 'sid=' + currentUser.sessionId);
      }
      return this.httpApi.buildUrl(url, { sid: currentUser.sessionId });
    }
    return url;
  }

  async handleJumpUrl(winid: number | string | undefined, jumpUrl: any, customerHandler?: UrlHandleConfig) {
    if (typeof winid === 'string' && !jumpUrl) {
      jumpUrl = String(winid);
      winid = undefined;
    }

    // 针对web wm入口，使用ruleEngine转换url并拼接当前域名
    if (systemApi.isWebWmEntry() && jumpUrl.split('.com')[1]) {
      const forWmJumpUrl = ruleEngine(jumpUrl.split('.com')[1], null);
      forWmJumpUrl && (jumpUrl = `${location.origin}/${forWmJumpUrl}`);
      console.log('[sys] open window from web-entry-wm: ', jumpUrl);
    }

    console.log('[sys] open window from win:' + winid, jumpUrl);
    if (jumpUrl && typeof jumpUrl === 'string') {
      if (jumpUrl.startsWith('/systemTask')) {
        if (!this.inEdm()) {
          return this.eventApi.sendSysEvent({
            auto: true,
            eventSeq: 0,
            eventName: 'error',
            eventLevel: 'error',
            eventData: {
              title: '请在网易外贸通中打开链接',
              popupType: 'toast',
              popupLevel: 'info',
            },
          });
        }

        const params = new URLSearchParams(jumpUrl.split('?')[1]);

        return this.taskCenterApi.handleSystemTask({
          moduleType: params.get('moduleType'),
          taskType: params.get('taskType'),
          bizId: params.get('bizId'),
          bizContent: encodeURIComponent(params.get('bizContent') as string),
        } as unknown as SystemTask);
      }
      let urlHandler: UrlHandleConfig | undefined;
      // if (needHandle) {
      // const httpApi = window.api.getDataTransApi();
      // saveUserTmpInfo(this.)
      // https://sirius-desktop-web.cowork.netease.com/doc/
      try {
        const { url, succ, h } = await this.buildJumpUrl(jumpUrl, customerHandler);
        urlHandler = h as UrlHandleConfig;
        if (!succ) {
          // this.eventApi.sendSysEvent({
          //   eventName: 'error',
          //   eventLevel: 'error',
          //   eventStrData: '',
          //   eventData: {
          //     popupType: 'toast',
          //     popupLevel: 'info',
          //     title: '免登录跳转失败，将直接打开链接',
          //     code: 'PARAM.ERR',
          //   } as PopUpMessageInfo,
          //   eventSeq: 0,
          // });
        }
        if (urlHandler) {
          if (!urlHandler.openInternalPage && this.isElectron() && window.electronLib && urlHandler.openInElectron) {
            this.createWindow({ type: url as WinType, url: urlHandler.originUrl, setMainWindowCookie: true }).then();
          } else if (urlHandler.openInternalPage && this.isElectron() && window.electronLib && urlHandler.openInElectron && urlHandler.data) {
            this.createWindowWithInitData(url as WinType, urlHandler.data).then();
          } else if (url && url.length > 0) {
            this.openNewWindow(url, urlHandler?.openInElectron);
          }
          return;
        }
      } catch (reason) {
        // TODO : error toast to user
        console.warn('[sys] handle url error:' + jumpUrl, reason);
        // this.eventApi.sendSysEvent({
        //   eventName: 'error',
        //   eventLevel: 'error',
        //   eventStrData: '',
        //   eventData: {
        //     popupType: 'toast',
        //     popupLevel: 'info',
        //     title: '免登录跳转出现错误，将直接打开链接',
        //     code: 'PARAM.ERR',
        //   } as PopUpMessageInfo,
        //   eventSeq: 0,
        // });
      }
      this.openNewWindow(jumpUrl);
      // } else {
      //   systemApi.openNewWindow(data);
      // }
    }
  }

  inEdm(): boolean {
    return process.env.BUILD_ISEDM;
  }

  inElectronBuild(): boolean {
    return process.env.BUILD_ISELECTRON;
  }

  inWebBuild(): boolean {
    return process.env.BUILD_ISWEB;
  }

  inLingXiBuild(): boolean {
    return process.env.BUILD_ISLINGXI;
  }

  async buildJumpUrl(url: string, customerHandler?: UrlHandleConfig): Promise<{ url: string; succ: boolean; h?: UrlHandleConfig }> {
    // let needHandle: boolean = false;
    let urlHandler = customerHandler;
    let matchedPattern: string | undefined;
    let succ = false;
    if (!urlHandler) {
      // Object.entries(this.redirectUrlPrefix).forEach(st => {
      //   if (url.startsWith(st[0])) {
      //     // needHandle = true;
      //     urlHandler = st[1];
      //     // const url = httpApi.buildUrl(baseUrl, {});
      //   }
      // });
      this.redirectUrlPrefix.forEach((value, key) => {
        if (url.startsWith(key)) {
          // needHandle = true;
          if (!matchedPattern || matchedPattern.length < key.length) {
            urlHandler = value;
            matchedPattern = key;
          }
          // const url = httpApi.buildUrl(baseUrl, {});
        }
      });
    }
    this.loggerApi.track('jumpWithLogin', {
      url,
      urlTrans: !!urlHandler?.handleUrl,
      openInWin: !!urlHandler?.openInElectron,
      needTransfer: urlHandler?.needTransferUseApi,
      needUploadAccount: urlHandler?.needUploadAccountInfo,
      openInternal: urlHandler?.openInternalPage,
    });
    if (urlHandler && urlHandler.handleUrl) {
      url = urlHandler.handleUrl(url, urlHandler);
    }
    const newUKey = urlHandler && urlHandler.needUploadAccountInfo ? await this.uploadAccountInfo() : '';
    if (urlHandler && urlHandler.needTransferUseApi) {
      const baseUrl = this.getUrl('getUrlWithTicket');
      const res = await this.httpApi.post(baseUrl, {
        userInfo: encodeURIComponent(newUKey),
        redirectUrl: encodeURIComponent(url),
      });
      if (res && res.data && res.data.success) {
        const ticket = res.data.data?.ticket as string;
        if (ticket) {
          const newUrl = this.httpApi.buildUrl(this.getUrl('jumpUrl'), {
            ticket,
          });
          // this.openNewWindow(newUrl);
          this.loggerApi.track('jumpWithLoginSuccess', { url, jump: newUrl });
          url = newUrl;
          succ = true;
        }
      }
    } else {
      succ = true;
    }
    return { url, succ, h: urlHandler };
  }

  getNativeClipBoard(): ClipboardInterface | undefined {
    if (inWindow() && this.isElectron() && window.electronLib) {
      return window.electronLib.appManage.getClipBoard();
    }
    return undefined;
  }

  getScreenCapture(data: { from?: string; hideCur?: '0' | '1' } = {}) {
    if (inWindow() && this.isElectron() && window.electronLib) {
      return window.electronLib.appManage.screenCapture(JSON.stringify(data));
    }
    return undefined;
  }

  setScreenCaptureAccess() {
    if (inWindow() && this.isElectron() && window.electronLib) {
      return window.electronLib.appManage.toggleCaptureScreenAccess();
    }
    return undefined;
  }

  setScreenCaptureShortcut(data: { newShortcut?: string; oldShortcut?: string } = {}) {
    if (inWindow() && this.isElectron() && window.electronLib) {
      return window.electronLib.appManage.screenCaptureShortcut(JSON.stringify(data));
    }
    return undefined;
  }

  setMinimizeGlobalShortcutUI(data: { newShortcut?: string; oldShortcut?: string } = {}) {
    if (inWindow() && this.isElectron() && window.electronLib) {
      return window.electronLib.appManage.setMinimizeGlobalShortcut(JSON.stringify(data));
    }
    return undefined;
  }

  private async uploadAccountInfo() {
    const newUKey = this.generateKey(16);
    const setUrl = this.getUrl('setData');
    const { localList: re, current } = await this.accountApi.doGetAccountList(true);
    if (current) re.push(current);
    if (re && re.length > 0) {
      const udata = this.encryptByKey(JSON.stringify(re[0]), newUKey);
      this.httpApi.post(setUrl, { info: udata }).then(res => {
        console.log('[sys] upload account info got:', res);
      });
    }
    return newUKey;
  }

  async getLocalLoginToken(account: string, pass: string): Promise<string> {
    const newUKey = this.generateKey(16);
    const storedAccount = {
      account_name: account,
      password: pass,
      lastLogin: Date.now(),
    } as StoredAccount;
    const udata = this.encryptByKey(JSON.stringify(storedAccount), newUKey);
    await this.storeApi.put(newUKey, udata, {
      prefix: 'lg-',
      noneUserRelated: true,
    });
    return newUKey;
  }

  getCurrentWinInfo(noStatus?: boolean): Promise<ResponseWinInfo> {
    if (inWindow() && window.electronLib) {
      if (noStatus && this.winInfo) {
        return Promise.resolve(this.winInfo);
      }
      // return this.winInfo
      //   ? Promise.resolve(this.winInfo):
      return window.electronLib.windowManage.getCurWindow().then((ev: ResponseWinInfo | undefined) => {
        if (ev) {
          this.winInfo = ev;
          return ev;
        }
        return Promise.reject(new Error('无法找到当前窗口的信息，这个错误不应该发生'));
      });
    }
    throw new Error('当前环境不支持该调用');
  }

  getCurrentModule(): CurrentModuleType {
    if (this.isMainPage()) {
      const { hash } = window.location;
      return hash.split('?')[0].slice(1) as CurrentModuleType;
    }
    return 'other';
  }

  getCachedCurrentWinInfo(): ResponseWinInfo | undefined {
    return this.winInfo;
  }

  setUserProp(key: string, value: string, store?: boolean): void {
    this.storeApi.setUserProp(key, value, store);
  }

  get notificationAvailableLabel(): number {
    return this._notificationAvailableLabel;
  }

  get currentShowedNotification(): number {
    return this._currentShowedNotification;
  }

  private watchEventOnOffLine(evt: Event) {
    console.log('[sys] system on off line:', evt);
    if (evt.type === 'offline') {
      SystemApiImpl.networkFail = 1000;
    } else if (evt.type === 'online') {
      SystemApiImpl.networkFail -= 1000;
      if (SystemApiImpl.networkFail < 0) {
        SystemApiImpl.networkFail = 0;
      }
    }
  }

  async getAllWindow(type?: WinType) {
    if (this.isElectron() && window.electronLib) {
      let winInfos: ResponseWinInfo[] = await window.electronLib.windowManage.getAllWinInfo();
      if (type) {
        winInfos = winInfos.filter(it => it.type === type);
      }
      return winInfos;
    }
    return [];
  }

  private watchNetworkFail(ev: SystemEvent) {
    if (ev.eventStrData === 'warn') {
      SystemApiImpl.networkFail += 1;
      if (SystemApiImpl.networkFail > 10) {
        SystemApiImpl.networkFail = 10;
      }
    } else if (ev.eventStrData === 'suc') {
      SystemApiImpl.networkFail -= 2;
      if (SystemApiImpl.networkFail < 0) {
        SystemApiImpl.networkFail = 0;
      }
    }
  }

  watchLogin(ev: SystemEvent): void {
    // console.log('registerSysEventObserver ,login ==》', ev);
    if (ev && ev.eventData) {
      // let data = ev.eventData;
      // // data.domain = this.handleAccountAndDomain(data.id).domain
      // SystemApiImpl.user = data as User;
      // // Promise.resolve(SystemApiImpl.user).then(user => {
      // this.storeUser(data);
      // });
    } else {
      // if (this.isElectron() && window.electronLib && this.winMap) {
      //   for (let i in this.winMap) {
      //     console.log(i);
      //     if (i && this.winMap.hasOwnProperty(i)) {
      //       this.closeSubWindow(parseInt(i));
      //       delete this.winMap[i];
      //     }
      //     // const item=this.winMap[i];
      //   }
      // }
      // SystemApiImpl.user = undefined;
      // this.storeApi.del(this.userAccountKey, globalStoreConfig).then().catch(reason => {
      //   console.log(reason);
      // });
    }
  }

  beforeLogout(ev?: ApiLifeCycleEvent) {
    if (this.isElectron() && inWindow() && window.electronLib && this.winMap) {
      console.log('[sys] clear all window and close all window', this.winMap, ev);
      if (this.winMap) {
        Object.keys(this.winMap).forEach(i => {
          if (i && Object.prototype.hasOwnProperty.apply(this.winMap, [i])) {
            // this.closeSubWindow(parseInt(i), false);
            !!this.winMap && delete this.winMap[Number(i)];
          }
          // const item=this.winMap[i];
        });
      }
      window.electronLib.windowManage.closeAllWindowExceptMain(true).then();
    }
    return this.name;
  }

  // createWindowWithData(type:WinType,data:any){
  //
  // }
  createWindow(type: WinType | CreateWindowReq, data?: any): Promise<CreateWindowRes> {
    if (inWindow() && this.isElectron() && window.electronLib && type) {
      const { windowManage } = window.electronLib;
      // 对象type结构
      const config =
        typeof type === 'string'
          ? {
              type,
            }
          : type;
      return windowManage.createWindow(config).then((res: CreateWindowRes) => {
        console.log('[sys] create new window return:', res, config, type);
        // windowManage.addBeforeWinCloseListener((ev: WindowEventData) => {
        //   console.log("close window receive:",ev);
        //   const eventPromise = this.eventApi.sendSimpleSysEvent("electronClose");
        //   return eventPromise ? eventPromise.then(() => {
        //     return false;
        //   }) : Promise.reject("send event failed");
        // });
        // 非手动 非日程 非下载完成 非营销弹窗
        if (
          res.winId &&
          !config.manualShow &&
          config.type !== 'scheduleReminder' &&
          config.type !== 'downloadReminder' &&
          config.type !== ('advertisingReminder' as any)
        ) {
          window.electronLib.windowManage.show(res.winId);
        }
        this.saveWinInfo(res, type, data);
        return res;
      });
    }
    return Promise.reject(new Error('not supported or param error'));
  }

  private saveWinInfo(res: CreateWindowRes, type: WinType | CreateWindowReq, data?: any) {
    const tp = typeof type === 'object' ? type.type : type;
    if (!this.winMap) {
      this.winMap = {};
    }
    if (res.winId) {
      this.winMap[res.winId] = {
        win: res,
        type: tp,
        initData: data,
      };
    }
  }

  private uniqueWinMap: Map<string, number> = new Map();

  private async filterDuplicateWindow(data: SystemEvent): Promise<CreateWindowRes | null> {
    if (data.uniqueId && this.uniqueWinMap.has(data.uniqueId)) {
      const winId = this.uniqueWinMap.get(data.uniqueId);
      const r = winId && this.winMap ? this.winMap[winId] : null;
      if (winId && r?.win.success && (await window.electronLib.windowManage.show(winId))) {
        return r.win;
      }
    }
    return null;
  }

  private saveUniqueWindowMap(uniqueId?: string, winId?: number): boolean {
    if (uniqueId && winId) {
      this.uniqueWinMap.set(uniqueId, winId);
      return true;
    }
    return false;
  }

  /**
   * 获取可用的多页签窗口并展示该窗口
   * @param data 当event包含windowId即目标窗口webBrowserId
   * @returns webBrowserId
   */
  private async getTabEventTarget(data: SystemEvent): Promise<string> {
    const { windowId } = data.eventData;
    let eventTarget = '';
    let availableTab;
    // 包含目标窗口
    if (windowId) {
      eventTarget = windowId === 'new' ? '' : windowId;
      return eventTarget;
    }

    // 不包含目标窗口，检测当前已打开的窗口是否包含此多页签hash，包含就高亮目标窗口
    const allWins = await this.getAllWindow();
    availableTab = allWins.find(item => item.type === 'resources' && item.isVisible);
    if (!availableTab) {
      availableTab = allWins.find(item => item.type === 'resources' && !item.isVisible);
    }
    if (availableTab) {
      eventTarget = String(availableTab.webId);
      await window.electronLib.windowManage.show(availableTab.id);
    }
    return eventTarget;
  }

  async createWindowWithInitData(type: WinType | CreateWindowReq, data: SystemEvent): Promise<CreateWindowRes> {
    console.log('[sys] create window type:' + type + ' with data:', data);
    const res = await this.filterDuplicateWindow(data);
    if (res) {
      if (type === 'imgPreviewPage' || type === 'scheduleOpPage') {
        data.eventTarget = String(res.webId);
        this.eventApi.sendSysEvent(data);
      }
      return res;
    }

    // 日程提醒
    if (['advertisingReminder', 'scheduleReminder', 'downloadReminder'].includes(type as string)) {
      const allWins = await this.getAllWindow();
      const availableWin = allWins.find(item => item.type === type);
      if (availableWin) {
        // 直接传输信息
        this.eventApi.sendSysEvent({ ...data, eventTarget: String(availableWin.webId) });
        return { success: true };
      }
    }

    // // 日程提醒
    // if (type === 'downloadReminder') {
    //   const allWins = await this.getAllWindow();
    //   const availableWin = allWins.find(item => item.type === 'downloadReminder');
    //   if (availableWin) {
    //     // 直接传输信息
    //     this.eventApi.sendSysEvent({ ...data, eventTarget: String(availableWin.webId) });
    //     return { success: true };
    //   }
    // }

    // // 日程提醒
    // if (type === 'advertisingReminder') {
    //   const allWins = await this.getAllWindow();
    //   const availableWin = allWins.find(item => item.type === 'advertisingReminder');
    //   if (availableWin) {
    //     // 直接传输信息
    //     this.eventApi.sendSysEvent({ ...data, eventTarget: String(availableWin.webId) });
    //     return { success: true };
    //   }
    // }

    // 查看资源
    if (type === 'resources') {
      // 检查resources是否已经存在
      const eventTarget = await this.getTabEventTarget(data);
      // 当前有已经启动的resources主窗口 或者包含目标窗口
      // 指向特定多页签窗口发送InitData
      if (eventTarget) {
        data.eventTarget = eventTarget;
        this.eventApi.sendSysEvent(data);
        return { success: true };
      }
      // TODO 不包含目标窗口，判断当前是否有已经打开的resources主窗口， 更新多页签store ，向主窗口发送systemEvent添加页签
    }

    // 创建窗口并向其发消息
    return this.createWindow(type).then((res1: CreateWindowRes) => {
      data.eventTarget = String(res1.webId);
      this.eventApi.sendSysEvent(data);
      this.saveUniqueWindowMap(data.uniqueId, res1.winId);
      return res1;
    });
  }

  closeSubWindow(winId: number, needIntercept?: boolean, forceClose?: boolean) {
    this.loggerApi.track('close_sub_window', {
      href: window.location.href,
      winId,
      forceClose,
      needIntercept,
    });
    if (inWindow() && this.isElectron() && window.electronLib) {
      window.electronLib.windowManage.close({
        winId,
        force: !needIntercept,
        quit: forceClose,
      });
    }
  }

  closeWindow(needIntercept?: boolean, forceClose?: boolean): void {
    try {
      this.loggerApi.track('close_window', {
        href: window.location.href,
        forceClose,
        needIntercept,
      });
      this.loggerApi.flush();
    } catch (e) {
      console.warn('[sys]close window error', e);
    }
    if (inWindow() && this.isElectron() && window.electronLib) {
      window.electronLib.windowManage.close({
        force: !needIntercept,
        quit: forceClose,
      });
    }
  }

  // @deprecated
  hideWindow(needIntercept?: boolean): void {
    if (inWindow() && this.isElectron() && window.electronLib) {
      window.electronLib.windowManage.hideForClose({ force: !needIntercept });
    }
  }

  async showWin(winid?: number): Promise<void> {
    if (inWindow() && this.isElectron() && window.electronLib) {
      await window.electronLib.windowManage.show(winid);
    }
  }

  async hideWin(winid?: number): Promise<void> {
    if (inWindow() && this.isElectron() && window.electronLib) {
      await window.electronLib.windowManage.hide(winid);
    }
  }

  async prepareWindow(type: WinType): Promise<void> {
    const isLowMemoryMode = await this.getIsLowMemoryModeSync();
    const isAppLocking = this.getIsLockApp();
    if (isLowMemoryMode || isAppLocking) {
      return Promise.resolve();
    }
    if (inWindow() && this.isElectron() && window.electronLib) {
      await window.electronLib.windowManage.prepareWindow(type);
    }
  }

  // private storeUser(data: User) {
  //   this.storeApi.put(this.userAccountKey, JSON.stringify(data), globalStoreConfig).then((res) => {
  //     if (res) {
  //       console.log('error store : ' + res);
  //     } else {
  //       console.log('store success');
  //     }
  //   });
  // }
  watchPreLogin(ev: SystemEvent): void {
    // console.log('registerSysEventObserver ,preLogin ==》', ev);
    if (ev && ev.eventData) {
      // let data = ev.eventData;
      // // data.domain = this.handleAccountAndDomain(data.id).domain
      // SystemApiImpl.node = data.node as string;
      // // Promise.resolve(SystemApiImpl.node).then(node => {
      // this.storeApi.put(this.nodeKey, SystemApiImpl.node, globalStoreConfig).then((res) => {
      //   if (res) {
      //     console.log("error store : " + res);
      //   } else {
      //     console.log("store success");
      //   }
      // });
      // })
    } else {
      // SystemApiImpl.user = undefined;
    }
  }

  isSysNotificationAvailable(): NotificationPerm {
    return inWindow() && window.Notification ? Notification.permission : 'unavailable';
  }

  requestSysNotificationPerm(): Promise<boolean> {
    if (!window.Notification) {
      return Promise.resolve(false);
    }
    return Notification.requestPermission()
      .then(res => res === 'granted')
      .catch(() => false);
  }

  reLaunchApp() {
    if (window.electronLib) {
      window.electronLib.appManage.reLaunchApp();
    }
  }

  reloadToMainPage() {
    if (!inWindow()) return;
    const mainPageUrl = `${location.protocol}//${location.host}${location.pathname}`;
    location.replace(mainPageUrl);
  }

  // 播放系统提示音
  playSystemAudio() {
    try {
      const res = this.storeApi.getSync('win7Beep');
      const { suc, data } = res;
      // 默认是true
      if (suc && data === 'false') return;
      this.systemMusic = new Audio(`${this.contextPath}/ding.mp3`);
      this.systemMusic.play();
    } catch (error) {
      console.log('[sys] play system audio error:', error);
    }
  }

  // 展示系统通知
  showSysNotification(info: PopUpMessageInfo): Promise<boolean> {
    const st = this.isSysNotificationAvailable();
    if (st === 'unavailable') {
      return Promise.resolve(false);
    }
    if (st === 'granted') {
      // win7
      if (navigator.userAgent.toLowerCase().indexOf('windows nt 6.1') !== -1) {
        try {
          this.throttlePlaySystemAudio && this.throttlePlaySystemAudio();
        } catch (error) {
          console.log('[sys] throttle play system audio error:', error);
        }
      }
      this.createNotification(info);
      return Promise.resolve(true);
    }
    return this.requestSysNotificationPerm().then(res => {
      if (res) {
        return this.showSysNotification(info);
      }
      return false;
    });

    // return Promise.resolve(false);
  }

  private createNotification(info: PopUpMessageInfo) {
    const isLocking = this.getIsLockApp();
    if (isLocking) return;
    const s: NotificationType = info.tag || SystemApiImpl.defaultTag;
    const tag = SystemApiImpl.sysNotificationTags[s];
    const notification = new Notification(info.title, {
      tag: tag + new Date().getTime() / 60000,
      icon: info.icon,
      body: info.content,
    });
    notification.onshow = (ev: Event) => {
      console.log('[sys] notification showed,', ev);
    };
    notification.onerror = (ev: Event) => {
      console.log('[sys] notification error:', ev);
    };
    if (info.confirmCallback) {
      notification.onclick = info.confirmCallback;
    } else {
      notification.onclick = ev => {
        console.log('[sys] notification clicked:', ev);
        window.focus();
        notification.close();
      };
    }
  }

  updateAppNotification(conts: NotificationContent): void {
    const inNative = this.isElectron();
    if (!inNative) {
      return;
    }
    const content = conts;
    if (!Array.isArray(conts.type)) {
      conts.type = [conts.type];
    }
    const types: NotificationNumType[] = conts.type as NotificationNumType[];
    // for (const type of types)
    types.forEach(type => {
      if (type === 'macDocker' && typeof content.content?.num !== 'undefined') {
        if (this.isElectron()) {
          window.electronLib.appManage.setBadgeCount(content.content.num);
        }
      } else if (type === 'windowsFlush' && typeof content.content?.num !== 'undefined') {
        if (this.isElectron() && !this.isMac) {
          window.electronLib.windowManage.isFocused().then((bool?: boolean) => {
            !bool && window.electronLib.windowManage.flashFrame();
          });
        }
      } else if (type === 'macTray' && content.content?.title) {
        if (this.isElectron() && this.isMac) {
          window.electronLib.appManage.setTrayTitle(content.content.title);
        }
      } else if (type === 'browserTitle' && content.content?.title) {
        if (typeof window.document !== 'undefined') {
          document.title = content.content.title;
        }
      }
    });
  }

  getIsWebCustomHost(): boolean {
    if (process.env.BUILD_ISELECTRON) {
      return false;
    }
    if (process.env.BUILD_ISWEB) {
      const hostName = location.hostname || location.host;
      const isCustomHost = !hostName.includes('.163.com');
      return isCustomHost;
    }
    return false;
  }

  getCurrentNode(email?: string): string {
    return this.storeApi.getCurrentNode(email);
  }

  getCurrentUser(email?: string): User | undefined {
    return this.storeApi.getCurrentUser(email);
  }

  getCurrentUserAccountAlias(email?: string) {
    const currentUser = this.getCurrentUser(email);
    if (currentUser?.prop) {
      if (Array.isArray(currentUser.prop.accountAlias)) {
        return currentUser.prop.accountAlias;
      }
    }
    return [];
  }

  getIsDomesticHostType(): boolean {
    return SystemApiImpl.useDomesticHost;
  }

  getCurrentHostType(): string {
    return SystemApiImpl.useDomesticHost ? SystemApiImpl.hostTypes.domestic : SystemApiImpl.hostTypes.smartDNSHost;
  }

  /**
   * 根据线路跳转到对应的host
   */
  jumpToWebHostLogin() {
    // 只在web中生效
    if (window && !window.electronLib) {
      const currentHostType = this.getCurrentHostType();
      // @ts-ignore
      const hostUrl = process.env.BUILD_ISEDM ? SystemApiImpl.emdHostTypeToUrlMap[currentHostType] : SystemApiImpl.hostTypeToUrlMap[currentHostType];
      if (hostUrl) {
        window.location.href = hostUrl;
      }
    }
  }

  setCurrentHostType(hostType: 'domestic' | 'smartDNSHost') {
    if (!inWindow()) return;
    const { hostTypes } = SystemApiImpl;
    if (hostTypes[hostType]) {
      if (hostType === SystemApiImpl.hostTypes.domestic) {
        SystemApiImpl.useDomesticHost = true;
        this.setProxyOn(true);
      } else {
        SystemApiImpl.useDomesticHost = false;
        this.setProxyOn(false);
      }
      this.storeApi.putSync(SystemApiImpl.STORE_HOST_TYPE_KEY, hostType, SystemApiImpl.STORE_HOST_TYPE_CONFIG);
    } else {
      console.error(`setCurrentHost error, ${hostType} not supported.`);
    }
  }

  getCurrentUserMailMode(_account?: string): string {
    const currentUser = this.getCurrentUser(_account);
    const userMailMode = currentUser?.prop?.mailMode;
    return (userMailMode || config('default_mail_mode')) as string;
  }

  getIsCorpMailMode(_account?: string): boolean {
    const mailMode = this.getCurrentUserMailMode(_account);
    return mailMode === SystemApiImpl.corpConf;
  }

  getAccountUrl(url: URLKey, account?: string) {
    return this.getUrl(url, undefined, undefined, account);
  }

  getUrl(url: URLKey, currentNode?: string, splitReq?: boolean, _account?: string): string {
    let resultUrl = '';
    let nodeAccount = _account;

    if (!currentNode) {
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        if (_account === currentUser.id || (currentUser.loginAccount && currentUser.loginAccount === _account)) {
          nodeAccount = '';
        }
      }
    }

    const curNode = currentNode || this.getCurrentNode(nodeAccount);
    // 分割请求
    if (splitReq) {
      resultUrl = getUrlPre(url, curNode);
    } else {
      resultUrl = getUrl(url, curNode);
    }
    if (SystemApiImpl.domesticHost && SystemApiImpl.useDomesticHost) {
      const hostArr = [SystemApiImpl.host, SystemApiImpl.webMailBJHost, SystemApiImpl.webMailHZHost];
      for (let i = 0; i < hostArr.length; ++i) {
        const currHost = hostArr[i];
        if (resultUrl.startsWith(currHost)) {
          resultUrl = resultUrl.replace(currHost, SystemApiImpl.domesticHost);
          break;
        }
      }
    }
    return resultUrl;
  }

  handleAccountAndDomain(account: string): Properties {
    const exec = SystemApiImpl.accountPattern.exec(account);
    if (exec && exec.length === 3) {
      return { account: exec[1], domain: exec[2] };
    }
    return {};
  }

  isElectron(): boolean {
    // Renderer process
    return isElectron();
    // {
    //     return true;
    // }
    // // Main process
    // if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
    //     return true;
    // }
    //
    // // Detect the user agent when the `nodeIntegration` option is set to true
    // if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
    //     return true;
    // }
    // return false;
  }

  isInMobile(): boolean {
    return isInMobile();
  }

  static eventTrans: Map<WindowHooksName, SystemEventTypeNames> = new Map<WindowHooksName, SystemEventTypeNames>([
    ['onAfterClose', 'electronClosed'],
    ['onBeforeClose', 'electronClose'],
    ['onActive', 'electronActive'],
    ['onBlur', 'electronBlur'],
    ['onShow', 'electronShow'],
    ['onHide', 'electronHide'],
    ['onLockScreen', 'lockScreen'],
    ['onUnlockScreen', 'unlockScreen'],
    ['onLaptopSuspend', 'laptopSuspend'],
    ['onLaptopResume', 'laptopResume'],
  ]);

  async addWindowHooks(type: WindowHooksName, callback: OnActiveFunc, targetWinId?: number, intercept?: boolean): Promise<number> {
    if (this.isElectron() && window.electronLib && SystemApiImpl.eventTrans.has(type)) {
      const conf = {
        hooksName: type,
        intercept,
        targetWinId,
      } as WindowHooksObserverConf;
      await this.addWindowHookConf(conf);
      const evName = SystemApiImpl.eventTrans.get(type);
      if (evName) {
        return this.eventApi.registerSysEventObserver(evName, {
          func: ev => {
            if (ev && ev.eventData) {
              const { winId, data, extData } = ev.eventData;
              callback && callback(winId, data, extData);
            }
          },
        });
      }
      return Promise.resolve(0);
    }
    return Promise.reject(new Error('环境不支持此方法'));
  }

  addWindowHookConf(conf: WindowHooksObserverConf | WindowHooksObserverConf[]): Promise<void> {
    if (this.isElectron() && window.electronLib) {
      const cs = Array.isArray(conf) ? conf : [conf];
      return window.electronLib.windowManage.setHooksConfig(cs);
    }
    return Promise.reject(new Error('环境不支持此方法'));
  }

  isMainWindow(): boolean {
    // inWindow() && this.isElectron() && window.electronLib.windowManage.isMainWindow();
    return this.isElectron() && this.isMainPage();
  }

  // eslint-disable-next-line class-methods-use-this
  showMainWindow(): void {
    if (inWindow() && this.isElectron()) {
      try {
        window.electronLib.windowManage.show();
      } catch (error) {
        console.warn(error);
      }
    }
  }

  isStartWindow(): boolean {
    // inWindow() && this.isElectron() && window.electronLib.windowManage.isMainWindow();
    return this.isElectron() && window.location.pathname.indexOf('/launch') >= 0;
  }

  isTransferringData(): boolean {
    return this.isElectron() && window.location.href.indexOf('init=true') > 0 && (window.location.pathname === '/' || window.location.pathname === '/index.html');
  }

  isBkLoginInit(): boolean {
    return this.isElectron() && window.location.href.indexOf('bkLoginInit=true') > 0 && window.location.pathname.includes('login');
  }

  isBkStableWindow(): boolean {
    return this.isElectron() && locationHelper.isBkPage();
  }

  getIsAddAccountPage(): boolean {
    // return this.isElectron() && (window.location.href.includes('add-account-page') || window.history?.state?.isAddAccountPage);
    return window.location.href.includes('add-account-page') || window.history?.state?.isAddAccountPage;
  }

  getIsAddSubAccountPage(): boolean {
    // return this.isElectron() && window && window.location.href.includes('add-sub-account');
    return window && window.location.href.includes('add-sub-account');
  }

  getIsSubAccountInitPage(): boolean {
    // return this.isElectron() && window && window.location.href.includes('init-sub-account');
    return window && window.location.href.includes('init-sub-account');
  }

  getIsSubAccountPage(): boolean {
    // return this.isElectron() && window && window.location.href.includes('init-sub-account');
    return window && window.location.href.includes('init-sub-account');
  }

  getMainAccount(email?: string) {
    return {
      email: this.getCurrentUser(email)?.id || '',
    };
  }

  getMainAccount1() {
    if (window && window.isAccountBg) {
      return {
        email: this.getUrlSearchValue('main-account') || '',
      };
    }
    return {
      email: this.getCurrentUser()?.id || '',
    };
  }

  getCurrentSubAccount() {
    if (window && window.isAccountBg) {
      return {
        email: this.getUrlSearchValue('sub-account') || '',
      };
    }
    return {
      email: '',
    };
  }

  getCurrentAgentAccount() {
    if (window && window.isAccountBg) {
      return {
        email: this.getUrlSearchValue('agent-account') || '',
      };
    }
    return {
      email: '',
    };
  }

  getIsMainAccount(email?: string) {
    if (!email) {
      return false;
    }
    const mainAccount = this.getCurrentUser();
    const currentAccount = this.getCurrentUser(email);
    return !!(mainAccount && mainAccount?.id === currentAccount?.id);
  }

  getIsAddPersonalSubAccountPage(): boolean {
    return this.isElectron() && window && window.location.href.includes('add-personal-sub-account');
  }

  isMainPage(): boolean {
    return locationHelper.isMainPage();
  }

  isWebWmEntry(): boolean {
    return !!process.env.IS_WM_ENTRY;
  }

  isWebFfEntry(): boolean {
    return !!process.env.IS_FF_ENTRY;
  }

  isInWebWorker(): boolean {
    // eslint-disable-next-line no-restricted-globals
    return 'WorkerGlobalScope' in self && typeof self.document === 'undefined';
  }

  // eslint-disable-next-line max-params
  openNewWindow(url: string, openInElectron?: boolean, callbacks?: WindowHooksObserverConf[], initData?: SystemEvent, haveJquery?: boolean): commonMessageReturn {
    if (inWindow()) {
      // if (this.isElectron() && window.electronLib) {
      //   window.electronLib.windowManage.openWindow(url).then();
      // } else {
      //   window.open(url);
      // }
      if (this.isElectron() && window.electronLib) {
        if (openInElectron) {
          if (!initData) {
            this.createWindow({
              type: 'customer',
              url,
              setMainWindowCookie: true,
              hooks: callbacks,
              haveJquery,
            }).then();
          } else {
            this.createWindowWithInitData(
              {
                type: 'customer',
                url,
                setMainWindowCookie: true,
                hooks: callbacks,
                haveJquery,
              },
              initData
            );
          }
        } else {
          window.electronLib.windowManage.openWindow(url).then().catch(console.error);
        }
      } else {
        console.warn('tag:' + this.name, 'oepn url', url);
        // 通过open来判断新窗口是否被chrome拦截
        const open = window.open(url, '_blank', 'menubar=yes,toolbar=yes,location=yes,status=yes,resizable=yes,scrollbars=yes');
        if (open) {
          console.log('[sys] open window ' + url, open);
        } else {
          return 'fail';
        }
      }
    }
    return '';
  }

  webDownloadLink(url: string, fileName?: string): void {
    if (inWindow()) {
      try {
        const downlondA: any = document.createElement('A');
        downlondA.href = url;
        downlondA.download = fileName || url;
        document.body.appendChild(downlondA);
        downlondA.click();
        document.body.removeChild(downlondA);
      } catch (error) {
        console.error('[sys] 下载失败', error);
      }
    }
  }

  getAutoLaunch(): Promise<boolean> {
    if (this.isElectron() && window.electronLib) {
      return window?.electronLib?.appManage?.isAppAutoLaunch();
    }
    return Promise.resolve(false);
  }

  setAutoLaunch(val?: boolean) {
    if (this.isElectron() && window.electronLib) {
      return window?.electronLib?.appManage?.setAppAutoLaunch(!!val);
    }
    throw new Error('此环境不支持该调用');
  }

  getProxyOn(reload?: boolean): boolean {
    if (reload) {
      const data = this.storeApi.getSync(SystemApiImpl.keyOfProxyOn);
      SystemApiImpl.proxyOn = data && data.suc && data.data === 'true';
      // return data && data.suc && data.data === 'true';
    }
    return SystemApiImpl.proxyOn;
  }

  async setProxyOn(on: boolean): Promise<boolean> {
    try {
      const ret = await this.storeApi.put(SystemApiImpl.keyOfProxyOn, String(on));
      SystemApiImpl.proxyOn = on;
      return ret === '';
    } catch (e) {
      console.warn(e);
      return false;
    }
  }

  decryptMsg(content: string): Promise<string> {
    // console.log(content);
    return this.getKey()
      .then((key: string) => this.decryptByKey(content, key))
      .catch(ex => {
        console.warn('[sys] decrypt message error:', ex);
        return '';
      });
  }

  decryptByKey(content: string, key: string, useFormat = true) {
    const array = AES.decrypt(content, key, {
      format: useFormat ? JsonFormatter : undefined,
    });
    return array.toString(enc.Utf8);
  }

  encryptMsg(content: string): Promise<string> {
    // console.log(content);
    // for (let i in aes) {
    //     console.log(i + " " + aes[i]);
    // }
    return this.getKey()
      .then((key: string) => this.encryptByKey(content, key))
      .catch(ex => {
        console.warn('encrypt message error:', ex);

        return '';
      });
  }

  encryptByECB(content: string, keyStr: string) {
    const key = enc.Utf8.parse(keyStr);
    const src = enc.Utf8.parse(content);
    const encrypted = AES.encrypt(src, key, {
      mode: mode.ECB,
      padding: pad.Pkcs7,
    });
    return encrypted.toString();
  }

  decryptByECB(encrypted: string, keyStr: string) {
    const key = enc.Utf8.parse(keyStr);
    const decrypt = AES.decrypt(encrypted, key, {
      mode: mode.ECB,
      padding: pad.Pkcs7,
    });
    return enc.Utf8.stringify(decrypt).toString();
  }

  encryptByKey(content: string, key: string, useFormat = true) {
    const encrypt = AES.encrypt(content, key, {
      format: useFormat ? JsonFormatter : undefined,
    });
    return encrypt.toString();
  }

  sha1(content: string, isBase64Type = false): string {
    const wordArr = SHA1(content);
    if (!isBase64Type) {
      return wordArr.toString();
    }
    return wordArr.toString(enc.Base64);
  }

  md5(content: string, short?: boolean): string {
    // console.log(content);
    if (!short) {
      return MD5(content).toString();
    }
    return MD5(content).toString(enc.Base64);
  }

  intervalEvent(res: IntervalEventParams): number | undefined {
    if (typeof window === 'undefined' || typeof window.setInterval === 'undefined') {
      return undefined;
    }
    if (res) {
      const element = SystemApiImpl.eventStore[res.eventPeriod];
      if (res.id && element.eventKeys[res.id]) {
        return undefined;
      }
      const _id = element.events.addOb(res);
      res.seq = 0;
      res._id = _id;
      res.id = res.id || '__k-' + _id;
      element.eventKeys[res.id] = res._id;
      if (element.eid < 0) {
        const func = this.buildExecutor(element);
        func();
      } else {
        console.warn('[sys] system interval built ', element);
      }
    }
    return res._id;
  }

  private buildExecutor(element: EventManager) {
    const handler = () => {
      if (!element.disable) {
        element.events
          .iterate(ob => {
            if (!!ob.noUserAuth || (this.getCurrentUser() && !this.storeApi.isLogout())) {
              ob.seq += 1;
              if (ob.seq > 10000000) {
                ob.seq = 0;
              }
              setTimeout(() => {
                try {
                  ob.handler(ob);
                } catch (ex) {
                  console.warn('[sys-interval] error', ex);
                }
              }, 0);
            }
          })
          .then();
      }
    };
    const func = () => {
      element.eid = window.setTimeout(() => {
        console.log('[sys] interval run once ', element);
        handler();
        func();
      }, element.period);
    };
    return func;
  }

  cancelEvent(period: IntervalEventPeriod, oid: number | string, disable?: boolean): boolean {
    if (typeof window === 'undefined' || typeof window.setInterval === 'undefined') {
      return false;
    }
    if (period && oid && disable === undefined) {
      console.log('[sys] cancel event ', oid, period);
      const element = SystemApiImpl.eventStore[period];
      let id: number;
      if (typeof oid === 'string') {
        id = element.eventKeys[oid];
      } else {
        id = oid;
      }
      const ob = element.events.getOb(id);
      if (ob) {
        element.events.removeOb(id);
        if (ob.id) {
          delete element.eventKeys[ob.id];
        }
        if (element.eid > 0 && element.events.total === 0) {
          window.clearInterval(element.eid);
        }
      }
    }
    if (period && disable !== undefined) {
      const element = SystemApiImpl.eventStore[period];
      element.disable = disable;
    }
    return true;
  }

  private getKey(): Promise<string> {
    if (SystemApiImpl.key && SystemApiImpl.key.length > 0) {
      return Promise.resolve(SystemApiImpl.key);
    }
    return this.storeApi
      .get(SystemApiImpl.defaultPassKey, globalStoreConfig)
      .then((rs: StoreData) => {
        if (rs.suc) {
          return rs.data as string;
        }
        const key = this.generateKey(16);
        return this.storeApi.put(SystemApiImpl.defaultPassKey, key, globalStoreConfig).then(rs => {
          if (rs) {
            throw Error(rs as string);
          }
          return key;
        });
      })
      .then((rs: string) => {
        SystemApiImpl.key = rs;
        return rs;
      });
  }

  getStartTimeSpan() {
    return new Date().getTime() - this.apiStartTime;
  }

  generateKey(len: number): string {
    // let result = '';
    // const charactersLength = SystemApiImpl.charSeq.length;
    // for (let i = 0; i < len; i++) {
    //     result += SystemApiImpl.charSeq.charAt(Math.floor(Math.random() * charactersLength));
    // }
    // return result;
    return config(len.toString(16), 'genRandomKey') as string;
  }

  isNetworkAvailable(): boolean {
    return SystemApiImpl.networkFail < 5;
  }

  getNetworkFailIndex(): number {
    return SystemApiImpl.networkFail;
  }

  watchStorageChange(ev: SystemEvent) {
    if (ev && ev.eventData && ev.eventStrData) {
      const changeKeyName = ev.eventStrData;
      const changeDataInfo = ev.eventData as StorageEvent;
      const key1 = this.storeApi.getKey(SystemApiImpl.keyOfProxyOn);
      if (changeKeyName === key1) {
        SystemApiImpl.proxyOn = changeDataInfo.newValue === 'true';
      }

      const hostTypeKey = this.storeApi.getKey(SystemApiImpl.STORE_HOST_TYPE_KEY, SystemApiImpl.STORE_HOST_TYPE_CONFIG);
      if (changeKeyName === hostTypeKey) {
        SystemApiImpl.useDomesticHost = changeDataInfo.newValue === SystemApiImpl.hostTypes.domestic;
      }
    }
  }

  init(): string {
    console.time('init_load_js');
    SystemApiImpl.proxyOn = this.getProxyOn(true);
    // 暂时放在此，如果有更早的请求，需要弄到html.js里面
    this.updateHostType();
    this.storeApi.addWatchedKey(SystemApiImpl.keyOfProxyOn);
    if (inWindow()) {
      // 限制pc_dailyActiveUser每天打10个点，每3次同步一次local
      this.dataTracker.initLimit('pc_dailyActiveUser', 3, 3);
      // 邮箱格式校验错误打点限制，每天50个点，10次同步下
      this.dataTracker.initLimit('email_verification_failed', 3, 3);
      this.intervalEvent(this.dailyActiveApp);
    }
    // this.initWorker();
    // this.eventApi.registerSysEventObserver('login', this.watchLogin.bind(this));
    // this.eventApi.registerSysEventObserver('preLogin', this.watchPreLogin.bind(this));
    this.eventApi.registerSysEventObserver('networkFail', {
      name: 'systemApiNetworkFailOb',
      func: this.watchNetworkFail.bind(this),
    });
    this.eventApi.registerSysEventObserver('storeChangeEvent', {
      name: 'systemStorageChangeOb',
      func: this.watchStorageChange.bind(this),
    });
    const isAddAccountPage = this.getIsAddAccountPage() || this.getIsAddPersonalSubAccountPage() || this.getIsAddSubAccountPage();
    if (inWindow() && !isAddAccountPage) {
      setTimeout(() => {
        this.doGetCookies(true).then();
      }, 7000);
      window.addEventListener('online', this.watchEventOnOffLine.bind(this));
      window.addEventListener('offline', this.watchEventOnOffLine.bind(this));
    }
    this.apiStartTime = new Date().getTime();
    return this.name;
  }

  private disableDbWin4CurrPage() {
    if (window && window.bridgeApi && window.bridgeApi.master) {
      window.bridgeApi.master.forbiddenBbWin4CurrPage();
    }
  }

  setCurrentSessionName(sessionName: string, _account?: string) {
    if (!sessionName) return;
    this.storeApi.putSync(currentSessionNameKey, sessionName, { ...currentSessionStoreConfig, _account });
  }

  getCurrentSessionName(_account?: string): string | null {
    const storeInfo = this.storeApi.getSync(currentSessionNameKey, { ...currentSessionStoreConfig, _account });
    if (storeInfo.suc && storeInfo.data) {
      return storeInfo.data;
    }
    return this.getUrlSearchValue('sessionName');
  }

  private async getSessionCookieStore(_account?: string) {
    try {
      const sessionName = this.getCurrentSessionName(_account);
      if (!sessionName) {
        return [];
      }
      const cookieStores = await window.electronLib.appManage.getSessionCookieStore({ sessionName });
      return cookieStores;
    } catch (ex) {
      console.error('getSessionCookieStore error', ex);
      return [];
    }
  }

  getUrlSearchValue(key: string): string | null {
    if (window) {
      const { href } = window.location;
      const urlInfo = new URL(href);
      return urlInfo.searchParams.get(key);
    }
    return '';
  }

  async doGetCookies(refresh?: boolean, _account?: string): Promise<StringMap> {
    const shouldRefresh = !_account ? refresh : !this.subAccountCookies[_account] || refresh;
    if (shouldRefresh && inWindow()) {
      if (process.env.BUILD_ISELECTRON) {
        const isAddAccountPage = this.getIsAddAccountPage();
        const sessionName = isAddAccountPage ? this.getCurrentSessionName()! : undefined;
        const cookieStore = isAddAccountPage
          ? await window.electronLib.appManage.getSessionCookieStore({ sessionName })
          : _account
          ? await this.getSessionCookieStore(_account)
          : await window.electronLib.appManage.getCookieStore();
        cookieStore.forEach((it: { name: string | number; value: string }) => {
          this.cookies[it.name] = it.value;
        });
      } else if (_account) {
        if (!this.subAccountCookies[_account]) {
          this.subAccountCookies[_account] = {};
        }
        const _cookies = this.getCurrentUser(_account)?.cookies;
        _cookies?.forEach(cookieItem => {
          this.subAccountCookies[_account][cookieItem.name] = cookieItem.value;
        });
      } else {
        const string = window.document.cookie;
        let re;
        do {
          try {
            re = SystemApiImpl.cookiePattern.exec(string);
            if (re) {
              this.cookies[re[1]] = re[2];
            } else {
              break;
            }
          } catch (e) {
            console.error('get cookie error:', e);
            break;
          }
        } while (re);
      }
    }
    return !_account ? this.cookies : this.subAccountCookies[_account] || {};
  }

  clearUserAuthCookie(reserveMsgCodeCookie?: boolean, shouldDeleteAllCookies?: boolean): void {
    console.log('clear cookies in web,', reserveMsgCodeCookie, shouldDeleteAllCookies);
    // if (shouldDeleteAllCookies) {
    document.cookie = '';
    // return;
    // }
    // const currentUser = this.getCurrentUser();
    // if (currentUser && currentUser.cnName) {
    //   document.cookie = currentUser.cnName + '=;MAX-AGE=-1;domain=' + SystemApiImpl.domain + ';path=/;expires='
    //     + new Date(1).toUTCString();
    //   if (!reserveMsgCodeCookie) {
    //     document.cookie = SystemApiImpl.msgCodeCookieName + '=;MAX-AGE=-1;domain=' + SystemApiImpl.domain
    //       + ';path=/;expires=' + new Date(1).toUTCString();
    //   }
    // }
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    let deviceInfo: DeviceInfo;
    if (this.isElectron() && window.electronLib) {
      deviceInfo = await window.electronLib.appManage.getDeviceInfo();
      const { _appName } = deviceInfo;
      deviceInfo._deviceId = this.storeApi.getUUID() + '_' + _appName + '_' + config('stage');
    } else {
      deviceInfo = this.getBrowserDeviceInfo();
    }
    deviceInfo._deviceId = this.md5(deviceInfo._deviceId || this.storeApi.getUUID());

    deviceInfo._version = ver;
    return deviceInfo;
  }

  getBrowserDeviceInfo(): DeviceInfo {
    const ua = window.navigator.userAgent.toLowerCase();
    const browserInfo = this.getBrowserInfo();
    const macReg = ua.match(/(mac os x)\s+([\w_]+)/i);
    const windowReg = ua.match(/(windows nt)\s+([\w.]+)/i);
    // const isMac = !!macReg;
    // const isWindows = !!windowReg;
    let _systemVersion = '';
    if (windowReg) {
      _systemVersion = windowReg[2];
    } else if (macReg) {
      _systemVersion = macReg[2]?.replace(/_/g, '.');
    }
    const _system = 'web';
    const _manufacturer = browserInfo.name || '';
    const _device = browserInfo.name || 'browser';
    const _deviceName = browserInfo.name + ' ' + browserInfo.version;
    const _deviceId = this.storeApi.getUUID();
    return {
      p: 'web',
      _deviceId,
      _device,
      _systemVersion,
      _system,
      _manufacturer,
      _deviceName,
    };
  }

  getBrowserInfo(): BrowserInfo {
    const agent = navigator.userAgent.toLowerCase();
    let res: Array<string> | null = null;
    let name = 'unknown';
    let version = 'unknown';
    let weight = 0;
    // IE
    // if (agent.indexOf('msie') >= 0) {
    // for (const it in this.browserAgentIdStr)
    Object.keys(this.browserAgentIdStr).forEach(it => {
      if (Object.prototype.hasOwnProperty.apply(this.browserAgentIdStr, [it])) {
        const [reg, w] = this.browserAgentIdStr[it];
        res = reg.exec(agent);
        // console.log("browser navigator match:",res);
        if (res && res[1]) {
          if (w >= weight) {
            weight = w;
            name = it;
            version = res[1];
            // console.log("browser result:",name,version);
          }
        }
      }
    });
    return {
      name,
      version,
    };
    // }
    // else if (agent.indexOf('edg/') >= 0) {
    //   res = agent.match(regStr_edge);
    //   name = 'Edge';
    // }
    //
    // //firefox
    // else if (agent.indexOf('firefox/') >= 0) {
    //   res = agent.match(regStr_ff);
    //   name = 'Firefox';
    // }
    //
    // //Safari
    // else if (agent.indexOf('safari') >= 0 && agent.indexOf('chrome') < 0) {
    //   res = agent.match(regStr_saf);
    //   name = 'Safari';
    // }
    //
    // //Chrome
    // else if (agent.indexOf('chrome') > 0) {
    //   res = agent.match(regStr_chrome);
    //   name = 'Chrome';
    // }
  }

  async navigateToSchedule(frameNavCallback?: anonymousFunction) {
    const { scheduleTabOpenInWindow } = configKeyStore;
    const keyHolder = this.storeApi.getSync(scheduleTabOpenInWindow.keyStr);
    if (this.isElectron() && keyHolder && keyHolder.suc && keyHolder.data && keyHolder.data === 'true') {
      const scheduleWinInfo = await this.createWindow('schedule');
      return scheduleWinInfo;
    }
    frameNavCallback && frameNavCallback();
    return false;
  }

  switchLoading(bool: boolean) {
    const loading = document.querySelector('#sirius-root-loading');
    if (!loading) {
      throw new Error('全局loading没了');
    }
    if (bool) {
      loading?.setAttribute('class', `sirius-loading ${this.inEdm() ? 'sirius-root-loading-edm' : ''}`);
    } else {
      console.timeEnd('init_load_js');
      loading?.removeAttribute('class');
    }
  }

  switchAppLoading(bool: boolean) {
    const loading = document.querySelector('#sirius-app-loading');
    if (!loading) {
      throw new Error('App loading没了');
    }
    if (bool) {
      loading?.setAttribute('class', 'sirius-app-loading show');
    } else {
      loading.setAttribute('class', 'sirius-app-loading');
    }
  }

  inWebMail(): boolean {
    const profile = config('profile') as string;
    return profile?.startsWith('webmail');
  }

  invalidate() {
    window.electronLib.windowManage.invalidate();
  }

  isFirstInit(bool?: boolean) {
    if (bool !== undefined) {
      this.storeApi.putSync('isFirstInit', bool ? 'true' : 'false', {
        noneUserRelated: true,
      });
      return bool;
    }
    const { suc, data } = this.storeApi.getSync('isFirstInit', {
      noneUserRelated: true,
    });
    return !(suc && data && data === 'false');
  }

  rsaEncrypt(m: string, e: string, rand: string, con: string) {
    if (!m || m.length === 0 || !e || e.length === 0 || !con || con.length === 0) {
      throw new Error('加密参数不全[' + m + ' ' + e + ' ' + rand + ']');
    }
    return rsaEncrypt(m, e, rand, con);
  }

  private getCacheRangeKey = (sizeMb: number) => {
    const config = [
      { val: '<100M', checkFn: (val: number) => val < 100 },
      { val: '<200M', checkFn: (val: number) => val < 200 },
      { val: '<300M', checkFn: (val: number) => val < 300 },
      { val: '<500M', checkFn: (val: number) => val < 500 },
      { val: '<1G', checkFn: (val: number) => val < 1024 },
      { val: '<2G', checkFn: (val: number) => val < 2048 },
      { val: '<5G', checkFn: (val: number) => val < 5120 },
      { val: '>5G', checkFn: (val: number) => val >= 5120 },
    ];

    if (!sizeMb || sizeMb < 0) return '';
    let rangeKey = '';
    for (let i = 0; i < config.length; ++i) {
      const currConfig = config[i];
      if (currConfig.checkFn(sizeMb)) {
        rangeKey = currConfig.val;
        break;
      }
    }
    return rangeKey;
  };

  private getHasTrackEvent(key: string) {
    try {
      const data = this.storeApi.getSync(key, globalStoreConfig);
      if (data && data.data) {
        return true;
      }
      return false;
    } catch (ex) {
      console.error('getHasTrackEvent Error', ex);
      return false;
    }
  }

  private setHasTrackEvent(key: string) {
    try {
      this.storeApi.putSync(key, 'true', globalStoreConfig);
    } catch (ex) {
      console.error('setHasTrackEvent-error', ex);
    }
  }

  async trackCpuAndMemInfo() {
    try {
      if (!inWindow() || !window.electronLib) {
        return;
      }
      const hasTracked = this.getHasTrackEvent(trackCpuMemKey);
      if (hasTracked) return;
      const cpuAndMemInfo = await window.electronLib.appManage.getCpuMemInfo();
      if (cpuAndMemInfo) {
        let cpuTracked = false;
        if (cpuAndMemInfo.cpu && cpuAndMemInfo.cpu.name) {
          this.dataTracker.track('pcMail_cpu', {
            cpuName: cpuAndMemInfo.cpu.name,
            cpuNum: cpuAndMemInfo.cpu.coreNum,
          });
          cpuTracked = true;
        }
        let memTracked = false;
        if (cpuAndMemInfo.memory && cpuAndMemInfo.memory.total) {
          this.dataTracker.track('pcMail_internalStorage', { detail: cpuAndMemInfo.memory.total });
          memTracked = true;
        }

        if (cpuTracked && memTracked) {
          this.setHasTrackEvent(trackCpuMemKey);
        }
      }
    } catch (ex) {
      console.error('trackCpuAndMemInfo error', ex);
    }
  }

  async trackWinInstall() {
    try {
      if (!inWindow() || !window.electronLib) {
        return;
      }
      if (window.electronLib.env.isMac) {
        return;
      }
      const currentVersion = window.electronLib.env.version;
      const WIN_INSTALL_SITE_KEY = 'WIN_INSTALL_KEY';
      const storeConfig = { noneUserRelated: true };
      const preTrackInfo = this.storeApi.getSync(WIN_INSTALL_SITE_KEY, storeConfig);
      if (preTrackInfo && preTrackInfo.data) {
        try {
          const preTrackObj = JSON.parse(preTrackInfo.data);
          if (preTrackObj[currentVersion]) {
            // 当前版本已经记录过，不再记录
            return;
          }
        } catch (ex) {
          console.error(ex);
        }
      }
      const installPath = await window.electronLib.appManage.getPath('exe');
      if (installPath) {
        const installSite = installPath.substring(0, 1);
        this.dataTracker.track('win_installSite', { site: installSite });
        this.storeApi.putSync(
          WIN_INSTALL_SITE_KEY,
          JSON.stringify({
            [currentVersion]: true,
          }),
          storeConfig
        );
      }
    } catch (ex) {
      console.error('trackWinInstall', ex);
    }
  }

  async trackMailCacheSize() {
    try {
      if (!inWindow() || !window.electronLib) return;
      const TRACK_CACHE_SIZE_KEY = 'TRACK_CACHE_SIZE_KEY';
      const storeConfig = { noneUserRelated: true };
      const isTrackToday = this.getIsTrackToday(TRACK_CACHE_SIZE_KEY, storeConfig);

      if (isTrackToday) {
        try {
          // 上报
          const { isMac } = window.electronLib.env;
          const userDataPath = await window.electronLib.appManage.getPath('userData');
          const downloadUserPath = isMac ? userDataPath + '/download' : userDataPath + '\\download';
          const folderSize = await this.getFolderSize(downloadUserPath);
          if (!folderSize) return;

          const sizeMb = Number.parseFloat((folderSize / 1024).toFixed(2));

          const TRACK_CACHE_COUNT_KEY = 'TRACK_CACHE_COUNT_KEY';
          const trackCount = this.getUploadTimeByKey(TRACK_CACHE_COUNT_KEY, storeConfig);

          this.dataTracker.track('cacheSize', {
            cacheType: '所有附件',
            sizeRange: this.getCacheRangeKey(sizeMb),
            sizeDetail: (sizeMb / 1024).toFixed(2),
            uploadTime: trackCount,
          });

          const dayKey = this.getStoreDayKey();
          this.storeApi.putSync(TRACK_CACHE_COUNT_KEY, trackCount.toString(), storeConfig);
          this.storeApi.putSync(
            TRACK_CACHE_SIZE_KEY,
            JSON.stringify({
              [dayKey]: true,
            }),
            storeConfig
          );
        } catch (ex) {
          console.error(ex);
        }
      }
    } catch (ex) {
      console.error('trackMailCacheSize', ex);
    }
  }

  private getStoreDayKey() {
    const now = new Date();
    const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    return dayKey;
  }

  private getIsTrackToday(storeKey: string, storeConfig?: StoreConfig): boolean {
    const preStoreInfo = this.storeApi.getSync(storeKey, storeConfig);
    if (preStoreInfo && preStoreInfo.data) {
      try {
        const preStoreObj = JSON.parse(preStoreInfo.data);
        const dayKey = this.getStoreDayKey();
        if (preStoreObj[dayKey]) {
          return false;
        }
        return true;
      } catch (ex) {
        console.error('getIsTrackToday', ex);
      }
    }
    return true;
  }

  private getUploadTimeByKey(uploadKey: string, storeConfig?: StoreConfig) {
    const storeInfo = this.storeApi.getSync(uploadKey, storeConfig);
    let count = 1;
    if (storeInfo && storeInfo.data) {
      count = Number.parseInt(storeInfo.data, 10) + 1;
    }

    return count;
  }

  async trackDbSize() {
    try {
      if (!inWindow()) {
        return;
      }
      // @ts-ignore
      if (navigator && navigator.storage && navigator.storage.estimate) {
        const CACHE_DB_SIZE_KEY = 'CACHE_DB_SIZE_KEY';
        const storeConfig = { noneUserRelated: true };
        const isTrackToday = this.getIsTrackToday(CACHE_DB_SIZE_KEY, storeConfig);
        if (!isTrackToday) return;

        const storageInfo = await navigator.storage.estimate();
        if (storageInfo && storageInfo.usage) {
          const sizeMb = Number.parseFloat((storageInfo.usage / 1024 / 1024).toFixed(2));
          const rangeKey = this.getCacheRangeKey(sizeMb);
          const CACHE_DB_SIZE_COUNT_KEY = 'CACHE_DB_SIZE_COUNT_KEY';
          const trackCount = this.getUploadTimeByKey(CACHE_DB_SIZE_COUNT_KEY, storeConfig);
          this.dataTracker.track('cacheSize', {
            cacheType: 'DB',
            sizeRange: rangeKey,
            sizeDetail: sizeMb,
            uploadTime: trackCount,
          });
          const dayKey = this.getStoreDayKey();
          this.storeApi.putSync(CACHE_DB_SIZE_COUNT_KEY, trackCount.toString(), storeConfig);
          this.storeApi.putSync(
            CACHE_DB_SIZE_KEY,
            JSON.stringify({
              [dayKey]: true,
            }),
            storeConfig
          );
        }
      }
    } catch (ex) {
      console.error('trackDbSize error', ex);
    }
  }

  async getFolderSize(folderPath: string) {
    if (!inWindow() || !window.electronLib) {
      return;
    }

    const { isMac } = window.electronLib.env;
    // window 的暂不上报该埋点
    if (!isMac) return;

    if (!folderPath) return;

    const { appManage } = window.electronLib;
    const folderSizeArr = await appManage.getFolderSize(folderPath);
    if (!folderSizeArr || !folderSizeArr.length) return;
    if (isMac) {
      const totalItems = folderSizeArr.filter(item => item.dir && item.dir === '.');
      const totalItem = totalItems && totalItems.length ? totalItems[0] : null;
      if (!totalItem) return;
      return totalItem.size;
    }
    const winSizeItem = folderSizeArr[0];
    if (!winSizeItem) return;
    return winSizeItem.size;
  }

  afterLoadFinish(): string {
    if (!inWindow()) return this.name;
    const isMainPage = this.isMainPage();
    if (isMainPage) {
      // 延迟上报，避免启动时计算量太大
      setTimeout(() => {
        this.trackCpuAndMemInfo();
        this.trackWinInstall();
        this.trackMailCacheSize();
        this.trackDbSize();
      }, 30000);

      const isLowMemoryMode = this.getIsLowMemoryModeSync();
      if (!isLowMemoryMode) {
        this.createBkStableWindow();
      }

      setTimeout(() => {
        this.sendWindowCrashInfo();
        this.sendMainCrashInfo();
      }, 15000);
    }
    return this.name;
  }

  private async createBkStableWindow() {
    if (process.env.BUILD_ISELECTRON) {
      const bkStableType = 'bkStable';
      const allWinInfo = await window.electronLib.windowManage.getAllWinInfo();
      const hasBkStable = allWinInfo.some(item => item.type === bkStableType);
      if (!hasBkStable) {
        window.electronLib.windowManage.createWindow({ type: bkStableType, manualShow: true }).then(res => {
          console.log('!!! -- build app init window success -- !!!');
          return res;
        });
      }
    }
  }

  getIsLowMemoryModeSync() {
    return SystemApiImpl.isLowMemoryMode;
  }

  getCurrentCompanyId(email?: string) {
    const user = this.getCurrentUser(email);
    const tempCompanyId = lodashGet(user, 'contact.contact.enterpriseId', 0) || lodashGet(user, 'prop.companyId', '').replace(/[^\d]+/, '');
    return !Number.isNaN(tempCompanyId) ? Number(tempCompanyId) : 0;
  }

  async getIsLowMemoryMode() {
    const defaultValue = false;
    if (!inWindow()) {
      return defaultValue;
    }
    if (window && window.electronLib) {
      try {
        const res = await window.electronLib.storeManage.get('user', LOW_MEMORY_MODE_KEY);
        return res as boolean;
      } catch (ex: any) {
        console.error('getIsLowMemoryMode', ex);
        return defaultValue;
      }
    }
    return defaultValue;
  }

  async setSystemProxyType(value: string) {
    try {
      if (!inWindow()) return;
      if (process.env.BUILD_ISELECTRON) {
        SystemApiImpl.systemProxyType = value as SYSTEM_PROXY_TYPE;
        await window.electronLib.storeManage.set('user', SYSTEM_PROXY_TYPE_STORE_KEY, value);
      }
    } catch (ex) {
      console.error('setUseSystemProxyType error', ex);
    }
  }

  async setIsLowMemoryMode(value: boolean) {
    try {
      if (!inWindow()) {
        return;
      }
      if (window && window.electronLib) {
        SystemApiImpl.isLowMemoryMode = value;
        await window.electronLib.storeManage.set('user', LOW_MEMORY_MODE_KEY, value);
        if (value) {
          this.disableDbWin4CurrPage();
        }
      }
    } catch (ex: any) {
      console.error('setIsLowMemoryMode', ex);
    }
  }

  getSystemLang(): Lang {
    try {
      if (window.systemLang) {
        return window.systemLang;
      }
      const langStr = localStorage.getItem(SYSTEM_LANGUAGE);
      if (langStr) {
        window.systemLang = langStr as Lang;
      }
      return window.systemLang || DEFAULT_LANG;
    } catch (ex) {
      console.error('getSystemLang error', ex);
      return DEFAULT_LANG;
    }
  }

  setSystemLang(val: Lang): boolean {
    try {
      if (localStorage) {
        localStorage.setItem(SYSTEM_LANGUAGE, val);
        return true;
      }
      return false;
    } catch (ex) {
      console.error('setSystemLang error', ex);
      return false;
    }
  }

  private setLockApp(val: 'true' | 'false'): boolean {
    try {
      this.storeApi.putSync(APP_LOCK_KEY, val, globalStoreConfig);
      this.isLockingApp = val === 'true';
      this.eventApi.sendSysEvent({
        eventName: 'onAppLockChanged',
        eventData: {
          isLockApp: val === 'true',
        },
      });
      return true;
    } catch (ex) {
      console.error('setLockApp error to ' + val, ex);
      return false;
    }
  }

  getIsLockApp(): boolean {
    const default_val = false;
    try {
      if (!process.env.BUILD_ISELECTRON) return false;
      if (this.isLockingApp !== null) {
        return this.isLockingApp;
      }
      const data = this.storeApi.getSync(APP_LOCK_KEY, globalStoreConfig);
      if (data && data.suc && data.data) {
        const res = data.data === 'true';
        this.isLockingApp = res;
        return res;
      }
      return default_val;
    } catch (ex) {
      console.error('getIsLockApp error', ex);
      return default_val;
    }
  }

  lockApp(): boolean {
    if (process.env.BUILD_ISELECTRON) {
      window.electronLib.windowManage.getAllWinInfo().then(winInfos => {
        if (winInfos && winInfos.length) {
          const blackWinTypes = ['main', 'bkStable'];
          winInfos
            .filter(winInfo => !blackWinTypes.includes(winInfo.type))
            .forEach(winInfo => {
              this.closeSubWindow(winInfo.id, false, true);
            });
        }
      });
    }
    return this.setLockApp('true');
  }

  unLockApp(): boolean {
    if (!process.env.BUILD_ISELECTRON) {
      return false;
    }
    return this.setLockApp('false');
  }

  async getIsAutoLaunchToTray() {
    const defaultRes = false;
    try {
      if (!process.env.BUILD_ISELECTRON) {
        return defaultRes;
      }
      const res = await window.electronLib.storeManage.get('app', 'autoLaunchToTray');
      return (res && res.toString() === 'true') || defaultRes;
    } catch (ex) {
      console.log('getIsAutoLaunchToTray-catch', ex);
      return defaultRes;
    }
  }

  async setIsAutoLaunchToTray(val: boolean) {
    try {
      if (!process.env.BUILD_ISELECTRON) {
        return {
          success: true,
        };
      }
      await window.electronLib.appManage.setAppAutoLaunchToTray(val);
      return {
        success: true,
      };
    } catch (ex: any) {
      return {
        success: false,
        errorMsg: (ex && ex.message) || '',
      };
    }
  }

  async getPageZoomValue() {
    const defaultValue = -1;
    try {
      if (!process.env.BUILD_ISELECTRON) {
        return defaultValue;
      }
      const val = await window.electronLib.storeManage.get('app', ZOOM_VAL_KEY);
      return Number(val);
    } catch (ex) {
      return defaultValue;
    }
  }

  async setPageZoomValue(val: number) {
    try {
      if (!process.env.BUILD_ISELECTRON) return true;
      await window.electronLib.storeManage.set('app', ZOOM_VAL_KEY, val);
      await window.electronLib.windowManage.setMainWindowZoomFactor(val);
      return true;
    } catch (ex) {
      console.error('setPageZoomValue-catch', ex);
      return false;
    }
  }

  // 获取合适的action
  getActions(params: { actions: any; subActions?: any; _account?: string }) {
    const { actions, subActions, _account } = params;
    if (!_account) {
      return { suc: true, val: actions };
    }
    const targetAccountId = this.accountApi.getEmailIdByEmail(_account);
    if (targetAccountId === '') {
      return { suc: true, val: actions };
    }
    const mainAccountId = this.getCurrentUser()?.id;
    if (targetAccountId === mainAccountId) {
      return { suc: true, val: actions };
    }
    const targetActions = subActions?.get(targetAccountId);
    if (targetActions) {
      return { suc: true, val: targetActions };
    }
    return { suc: false, val: null, msg: 'account not existed' };
  }

  getSessionNameOfSubAccount(subEmailId: string): string {
    const currentUser = this.getCurrentUser();
    const mainAccountEmail = currentUser ? currentUser.id : '';
    if (!mainAccountEmail) {
      return '';
    }
    const subAccountEmailId = this.storeApi.getEmailIdByEmail(subEmailId);
    if (!subAccountEmailId) {
      return '';
    }
    return `persist:${mainAccountEmail}-${subAccountEmailId}`;
  }

  getIsThirdSubAccountByEmailId(emailId: string): boolean {
    return emailId && emailId.includes('.third.') ? true : false;
  }

  private sendMainCrashToOxpecker(reportInfo: { date: Date; id: string }) {
    if (!reportInfo || !reportInfo.id) return;
    const key = 'MAIN_CRASH_REPORT';
    const alreadyReportInfo = this.storeApi.getSync(key, globalStoreConfig);
    let alreadyReportMap: { [key: string]: boolean } = {};
    if (alreadyReportInfo && alreadyReportInfo.data) {
      try {
        alreadyReportMap = JSON.parse(alreadyReportInfo.data);
        if (alreadyReportMap[reportInfo.id]) {
          return;
        }
      } catch (ex) {
        console.error('parse error', ex);
      }
    }
    this.dataTracker.track('electron_main_crash', {
      crashDate: reportInfo.date && typeof reportInfo.date.getTime === 'function' ? reportInfo.date.getTime() : '',
      crashId: reportInfo.id,
    });
    alreadyReportMap[reportInfo.id] = true;
    this.storeApi.putSync(key, JSON.stringify(alreadyReportMap), globalStoreConfig);
  }

  async sendMainCrashInfo() {
    if (!process.env.BUILD_ISELECTRON) return;
    try {
      const isMainWindow = this.isMainWindow();
      if (!isMainWindow) return;
      const reportInfos = await window.electronLib.appManage.getUploadedReports();
      if (!reportInfos || !reportInfos.length) return;
      reportInfos.forEach(reportInfo => {
        this.sendMainCrashToOxpecker(reportInfo);
      });
    } catch (ex) {
      console.error('sendMainCrashInfo-catch', ex);
    }
  }

  private async sendWindowCrashInfo() {
    if (!process.env.BUILD_ISELECTRON) return;
    try {
      const isMainWindow = this.isMainWindow();
      if (!isMainWindow) return;
      const crashInfos = await window.electronLib.appManage.getWindowCrashInfos();
      if (!crashInfos || !crashInfos.length) return;
      crashInfos.forEach(crashInfo => {
        this.dataTracker.track('electron_window_crash', {
          ...(crashInfo || {}),
        });
      });
      await window.electronLib.appManage.deleteWinCrashInfos();
    } catch (ex) {
      console.error('sendWindowCrashInfo-catch', ex);
    }
  }

  private getWaimaoHost() {
    const stage = config('stage') as string;
    const waimaoHost = {
      dev: 'https://waimao-dev.cowork.netease.com',
      test: 'https://waimao.cowork.netease.com/',
      prod: 'https://waimao.office.163.com/',
      prev: 'https://waimao-pre.office.163.com/',
    };
    return waimaoHost[stage as keyof typeof waimaoHost] || waimaoHost.test;
  }

  private getJumpUrl(code: string, target: string) {
    const sid = this.getCurrentUser()?.sessionId;
    if (!sid) {
      return '';
    }
    // 获取 redirectUrl
    const query = `jumpMode=clientLogin&sid=${sid}&target=${target}`;
    const host = this.getWaimaoHost();
    const redirectUrl = host + encodeURIComponent(`jump/?${query}`);
    // 获取跳转登录的链接
    const path = 'it-others/api/pub/login/jump/';
    return `${host}${path}?code=${code}&redirectUrl=${redirectUrl}`;
  }

  async openWaimaoUrlWithLoginInfo(url: string) {
    if (!this.isElectron() || !process.env.BUILD_ISEDM) {
      window.open(url, '_blank');
      return;
    }
    this.loginApi
      .getLoginCode()
      .then(code => {
        const jumpUrl = this.getJumpUrl(code, url);
        window.open(jumpUrl, '_blank');
      })
      .catch(e => {
        console.error('openUrlInWebWithLoginInfo error', e);
        window.open(url, '_blank');
      });
  }
}

const systemApi: SystemApi = new SystemApiImpl();
api.registerSystemApi(systemApi);
export default systemApi;
