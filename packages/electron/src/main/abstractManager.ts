import { app, BrowserWindow, BrowserWindowConstructorOptions, Cookie, CookiesSetDetails, session } from 'electron';
import path from 'path';
// import os from 'os';
import { profile, host, domain, stage, domesticHost, commonApiHost, commonMailHost, docHost, webMailBJHost, webMailHZHost, attaPreviewHost, corpHost } from 'envDef';
import fse from 'fs-extra';
import { WinIdMap, WinInfo, WinTypeMap, BrowserViewIdMap } from '../declare/WindowManage';
import { IpcMainSend } from '../declare/IpcChannelManage';
import {
  feedbackURL,
  aboutURL,
  captureURL,
  appIconPath,
  attachmentPreviewPageURL,
  bkInitUrl,
  contactUrl,
  diskUrl,
  docURL,
  imgPreviewPageURL,
  imUrl,
  isMac,
  kfURL,
  loginURL,
  mailUrl,
  mainURL,
  readMailCombUrl,
  strangerMailsUrl,
  readMailURL,
  resourcesURL,
  scheduleOpURL,
  scheduleUrl,
  shareURL,
  sheetURL,
  unitableURL,
  updateURL,
  userDataPath,
  webFeedbackURL,
  webAboutURL,
  webCaptureURL,
  webAttachmentPreviewPageURL,
  webContactUrl,
  webDiskUrl,
  webDocURL,
  webImgPreviewPageURL,
  webImUrl,
  webKfURL,
  webLoginURL,
  webMailUrl,
  webReadMailCombUrl,
  webstrangerMailsUrl,
  webReadURL,
  webResourcesURL,
  webScheduleOpPageURL,
  webScheduleUrl,
  webShareURL,
  webSheetURL,
  webUpdateURL,
  webURL,
  webWriteURL,
  writeMailURL,
  webReadMailReadOnly,
  readMailReadOnlyURL,
  webReadOnlyUniversal,
  readOnlyUniversalURL,
  changePwdUrl,
  webChangePwdUrl,
  webUnitableURL,
  subAccountBgUrl,
  webSubAccountBgUrl,
  customerPreviewURL,
  webCustomerPreviewURL,
  webOpportunityPreviewURL,
  opportunityPreviewURL,
  webIframePreviewURL,
  iframePreviewURL,
  webCluePreviewURL,
  cluePreviewURL,
  webOpenSeaPreviewURL,
  openSeaPreviewURL,
  marketingDataViewURL,
  webMarketingDataViewURL,
  webPersonalWhatsappUrl,
  personalWhatsappUrl,
  // notificationPageURL,
  // webNotificationPageURL,
  scheduleReminderURL,
  webScheduleReminderURL,
  downloadReminderURL,
  webDownloadReminderURL,
  advertisingURL,
  webAdvertisingURL,
  // webAsyncapiUrl,
  // asyncapiUrl
} from './config';
import { CookieStore, PathTypeName } from '../declare/AppManage';
import { StoreData, StoreDataKey, YMStoreModuleName } from '../declare/StoreManage';
import Session = Electron.Session;
import { getDownloadPath, storeManage } from './storeManage';
// import utils from './utils';
// import { downloadManage } from './downloadManage';
// import { ElectronDownload } from '../declare/downloadManage';
// import {storeManage} from "./storeManage";
// import Session = Electron.Session;

// import { fsManage } from './fsManage';

export type CookieSetParams = {
  cookies: CookieStore[];
  cookieJar: Electron.Cookies;
  url?: string;
  domain?: string;
  noLog?: boolean;
  from?: string;
  noBuildExtraCookie?: boolean;
};

const addTailSlash = (host: string) => (host.endsWith('/') ? host : host + '/');

const isEdm: boolean = !!profile && profile.startsWith('edm');

export class AbstractManager {
  static winIdMap: WinIdMap = {};

  static webIdMap: WinIdMap = {};

  static browserViewIdMap: BrowserViewIdMap = {};

  static browserViewId = 1;

  static windowCreating = false;

  static windowCreateRetry = 0;

  static readonly cookieNameSetForAllDomain: Set<string> = new Set<string>([
    'QIYE_TOKEN',
    'qiye_uid',
    'ORI_QIYE_SESS',
    'ORI_QIYE_TOKEN',
    'QIYE_SESS',
    'Coremail',
    'MAIL_SERVER_TYPE',
    'MAIL_SERVER_LOCATION',
    'mail_idc',
  ]);

  static readonly sessionHasSetSessionProxy = new Set<string>();

  static readonly downloadSessionSet = new Set<string>();

  static readonly cookieNameNeedPreserve: Map<string, number> = new Map<string, number>([
    ['pass_2fa', 3600 * 24 * 60],
    ['qiye_token', 3600 * 24 * 7],
    ['qiye_rtoken', 3600 * 24 * 7],
    ['qiye_uid', 3600 * 24 * 7],
    ['qiye_sess', 3600 * 24 * 7],
    ['coremail', 3600 * 24 * 7],
    ['h_uid', 3600 * 24 * 7],
    ['mail_server_type', 3600 * 24 * 7],
    ['mail_server_location', 3600 * 24 * 7],
    ['mail_idc', 3600 * 24 * 7],
    ['route', 3600],
    ['qiye_sessionid', 1800],
    ['bh', 3600 * 24 * 7],
    // 增加7天的有效期，但是服务端失效时间短
    ['ori_qiye_sess', 3600 * 24 * 7],
    ['ori_qiye_token', 3600 * 24 * 7],
  ]);

  // _downloadManager: ElectronDownload;

  authCookieExpiredTime = 3600 * 24 * 7;

  // currentCookies: Map<string, Map<string, CookieStore>> = new Map<string, Map<string, CookieStore>>();

  // static defaultWin?:SimpleWinInfo;
  defaultConfig: BrowserWindowConstructorOptions = {
    // 客户端最小尺寸，因为邮件列表列没有设置最小尺寸，先设置为1115，放大一点
    minWidth: isEdm ? 1280 : 960,
    minHeight: isEdm ? 640 : 600,
    width: 1280,
    height: 800,
    titleBarStyle: isMac ? 'hidden' : 'default',
    useContentSize: false,
    frame: isMac,
    hasShadow: true,
    show: true,
    resizable: true,
    acceptFirstMouse: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // enableRemoteModule: true,
      webviewTag: true,
      webSecurity: false,
      spellcheck: false,

      // offscreen : true,
    },
  };

  static readonly commonPageOption = {
    show: true,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      contextIsolation: false,
    },
  };

  winTypeMap: WinTypeMap = {
    subAccountBg: {
      webUrl: webSubAccountBgUrl,
      url: subAccountBgUrl,
      option: {
        show: false,
        webPreferences: {
          nodeIntegration: true,
          webSecurity: false,
          contextIsolation: false,
          offscreen: true,
        },
      },
      singleInstance: false,
    },
    addAccount: {
      webUrl: webLoginURL,
      url: loginURL,
      option: AbstractManager.commonPageOption,
      singleInstance: true,
    },
    changePwd: {
      url: changePwdUrl,
      webUrl: webChangePwdUrl,
      option: AbstractManager.commonPageOption,
      singleInstance: true,
    },
    main: {
      url: mainURL,
      webUrl: webURL + '/',
      failWebUrl: webLoginURL,
      failUrl: loginURL,
      // minHeight: 680,
      minHeight: isEdm ? 680 : 600,
      option: {
        // minHeight: 680,
        minHeight: isEdm ? 680 : 600,
        // vibrancy: 'sidebar',
        // visualEffectState: 'active',
        // transparent:true,
      },
    },
    mail: {
      url: mailUrl,
      webUrl: webMailUrl,
      option: {
        vibrancy: 'sidebar',
        visualEffectState: 'active',
      },
      singleInstance: true,
    },
    im: {
      url: imUrl,
      webUrl: webImUrl,
      option: {
        vibrancy: 'sidebar',
        visualEffectState: 'active',
      },
      singleInstance: true,
    },
    schedule: {
      url: scheduleUrl,
      webUrl: webScheduleUrl,
      option: {
        vibrancy: 'sidebar',
        visualEffectState: 'active',
      },
      singleInstance: true,
      prepareCount: 1,
      maxPreparedCount: 1,
      autoPrepare: 0,
    },
    contact: {
      url: contactUrl,
      webUrl: webContactUrl,
      option: {
        vibrancy: 'sidebar',
        visualEffectState: 'active',
      },
      singleInstance: true,
    },
    disk: {
      url: diskUrl,
      webUrl: webDiskUrl,
      option: {
        vibrancy: 'sidebar',
        visualEffectState: 'active',
      },
      singleInstance: true,
    },
    writeMailAttachmentPage: {
      webUrl: webWriteURL,
      url: writeMailURL,
      option: {
        resizable: true,
        // show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          // enableRemoteModule: true,
          webviewTag: true,
          webSecurity: false,
          spellcheck: false,
          backgroundThrottling: false,
        },
      },
    },
    writeMail: {
      webUrl: webWriteURL,
      url: writeMailURL,
      option: {
        resizable: true,
        // show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          // enableRemoteModule: true,
          webviewTag: true,
          webSecurity: false,
          spellcheck: false,
          backgroundThrottling: false,
        },
      },
      prepareCount: 1,
      maxPreparedCount: 2,
      autoPrepare: 1,
    },
    readMailComb: {
      webUrl: webReadMailCombUrl,
      url: readMailCombUrl,
      option: {
        resizable: true,
      },
    },
    readMail: {
      webUrl: webReadURL,
      url: readMailURL,
      option: {
        resizable: true,
      },
      prepareCount: 1,
      maxPreparedCount: 2,
      autoPrepare: 1,
      lastCreateOutDateTime: 7 * 24 * 60 * 60 * 1000,
    },
    strangerMails: {
      webUrl: webstrangerMailsUrl,
      url: strangerMailsUrl,
      singleInstance: true,
      option: {
        resizable: true,
      },
    },
    imgPreviewPage: {
      webUrl: webImgPreviewPageURL,
      url: imgPreviewPageURL,
      singleInstance: true,
      option: {
        resizable: true,
        show: false,
        titleBarStyle: isMac ? 'hiddenInset' : 'default',
        width: 867,
        height: 640,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          // enableRemoteModule: true,
          webviewTag: true,
          webSecurity: false,
          spellcheck: false,
          backgroundThrottling: false,
        },
      },
      prepareCount: 1,
      maxPreparedCount: 1,
      autoPrepare: 1,
      lastCreateOutDateTime: 7 * 24 * 60 * 60 * 1000,
    },
    attachment_preview: {
      webUrl: webAttachmentPreviewPageURL,
      url: attachmentPreviewPageURL,
      singleInstance: true,
      option: {
        resizable: true,
      },
    },
    login: {
      webUrl: webLoginURL,
      url: loginURL,
      option: {
        resizable: true,
      },
    },
    feedback: {
      webUrl: webFeedbackURL,
      url: feedbackURL,
      option: {
        width: 800,
        height: 640,
        useContentSize: true,
        hasShadow: true,
        center: true,
        resizable: true,
        maximizable: false,
        minimizable: false,
        webPreferences: {
          nodeIntegration: true,
          webSecurity: false,
          contextIsolation: false,
        },
      },
      singleInstance: true,
    },
    about: {
      webUrl: webAboutURL,
      url: aboutURL,
      option: {
        icon: appIconPath,
        show: true,
        width: 400,
        height: 332,
        useContentSize: true,
        frame: true,
        hasShadow: true,
        movable: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        webPreferences: {
          nodeIntegration: true,
          // enableRemoteModule: true,
          webSecurity: false,
          contextIsolation: false,
        },
      },
      singleInstance: true,
    },
    capture: {
      webUrl: webCaptureURL,
      url: captureURL,
      option: {
        fullscreen: isMac ? undefined : true,
        icon: appIconPath,
        width: 400,
        height: 332,
        useContentSize: true,
        skipTaskbar: true,
        show: false,
        frame: false,
        thickFrame: false,
        enableLargerThanScreen: true,
        movable: false,
        hasShadow: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        webPreferences: {
          nodeIntegration: true,
          // enableRemoteModule: true,
          webSecurity: false,
          contextIsolation: false,
        },
        // useContentSize: true,
        // transparent: true,
        // frame: false,
        // hasShadow: false,
        // movable: false,
        // resizable: false,
        // maximizable: false,
        // minimizable: false,
        // enableLargerThanScreen: true,
        // webPreferences: {
        //   nativeWindowOpen: true,
        //   nodeIntegration: true,
        //   // enableRemoteModule: true,
        //   webSecurity: false,
        //   contextIsolation: false,
        // },
      },
      singleInstance: false,
    },
    update: {
      webUrl: webUpdateURL,
      url: updateURL,
      option: {
        width: 400,
        height: 332,
        useContentSize: false,
        frame: false,
        hasShadow: true,
        resizable: false,
        maximizable: false,
        minimizable: false,
        modal: true,
        webPreferences: {
          nodeIntegration: true,
          // enableRemoteModule: true,
          webSecurity: false,
        },
      },
    },
    customer: {
      webUrl: '',
      url: '',
      option: {
        icon: appIconPath,
        titleBarStyle: 'default',
        width: 1280,
        height: 800,
        frame: true,
      },
    },
    doc: {
      webUrl: webDocURL,
      url: docURL,
      option: {
        resizable: true,
      },
    },
    share: {
      webUrl: webShareURL,
      url: shareURL,
      option: {
        resizable: true,
      },
    },
    scheduleOpPage: {
      webUrl: webScheduleOpPageURL,
      url: scheduleOpURL,
      option: {
        resizable: !0,
        show: false,
        width: 960,
        height: 640,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          // enableRemoteModule: true,
          webviewTag: true,
          webSecurity: false,
          spellcheck: false,
          backgroundThrottling: false,
        },
      },
      prepareCount: 1,
      singleInstance: true,
      maxPreparedCount: 1,
      autoPrepare: 0,
    },
    sheet: {
      webUrl: webSheetURL,
      url: sheetURL,
      option: {
        resizable: true,
      },
    },
    unitable: {
      webUrl: webUnitableURL,
      url: unitableURL,
      option: {
        resizable: true,
      },
    },
    resources: {
      webUrl: webResourcesURL,
      url: resourcesURL,
      option: {
        resizable: true,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          webviewTag: true,
          webSecurity: false,
          spellcheck: false,
          backgroundThrottling: false,
        },
      },
      prepareCount: 1,
      maxPreparedCount: 3,
      autoPrepare: 0,
    },
    scheduleReminder: {
      webUrl: webScheduleReminderURL,
      url: scheduleReminderURL,
      singleInstance: true,
      option: {
        width: 360,
        maxWidth: 360,
        minWidth: 360,
        maxHeight: 600,
        minHeight: 200,
        resizable: false,
        show: false,
        movable: true,
        frame: false,
        roundedCorners: true,
        hasShadow: true,
        alwaysOnTop: true,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        fullscreen: false,
        // focusable: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          webviewTag: true,
          webSecurity: false,
          spellcheck: false,
          backgroundThrottling: false,
        },
      },
      prepareCount: 0,
      maxPreparedCount: 0,
      autoPrepare: 0,
      lastCreateOutDateTime: 7 * 24 * 60 * 60 * 1000,
    },
    advertisingReminder: {
      webUrl: webAdvertisingURL,
      url: advertisingURL,
      singleInstance: true,
      option: {
        width: 360,
        maxWidth: 360,
        minWidth: 360,
        maxHeight: 600,
        minHeight: 200,
        resizable: false,
        show: false,
        movable: true,
        frame: false,
        roundedCorners: true,
        hasShadow: true,
        alwaysOnTop: true,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        fullscreen: false,
        // focusable: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          webviewTag: true,
          webSecurity: false,
          spellcheck: false,
          backgroundThrottling: false,
        },
      },
      prepareCount: 0,
      maxPreparedCount: 0,
      autoPrepare: 0,
      lastCreateOutDateTime: 7 * 24 * 60 * 60 * 1000,
    },
    downloadReminder: {
      webUrl: webDownloadReminderURL,
      url: downloadReminderURL,
      singleInstance: true,
      option: {
        width: 360,
        maxWidth: 360,
        minWidth: 360,
        maxHeight: 600,
        minHeight: 120,
        resizable: false,
        show: false,
        movable: true,
        frame: false,
        roundedCorners: true,
        hasShadow: true,
        alwaysOnTop: true,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        fullscreen: false,
        // focusable: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          webviewTag: true,
          webSecurity: false,
          spellcheck: false,
          backgroundThrottling: false,
        },
      },
      prepareCount: 0,
      maxPreparedCount: 0,
      autoPrepare: 0,
      lastCreateOutDateTime: 7 * 24 * 60 * 60 * 1000,
    },
    kf: {
      webUrl: webKfURL,
      url: kfURL,
      option: {
        resizable: true,
      },
    },
    bkInit: {
      webUrl: bkInitUrl,
      url: bkInitUrl,
      option: {
        icon: appIconPath,
        show: false,
        webPreferences: {
          // preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: true,
          // enableRemoteModule: true,
          webSecurity: false,
          contextIsolation: false,
          // offscreen : true,
        },
      },
      singleInstance: true,
      // sessions: 'default'
    },
    bkStable: {
      webUrl: bkInitUrl,
      url: bkInitUrl,
      singleInstance: true,
      option: {
        icon: appIconPath,
        show: false,
        width: 1000,
        height: 800,
        useContentSize: true,
        frame: true,
        hasShadow: true,
        movable: true,
        resizable: false,
        maximizable: false,
        minimizable: false,
        webPreferences: {
          // preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: true,
          // enableRemoteModule: true,
          webSecurity: false,
          contextIsolation: false,
          offscreen: true,
        },
      },
    },
    bkLogin: {
      webUrl: webLoginURL,
      url: loginURL,
      option: {
        show: false,
        webPreferences: {
          // preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: true,
          // enableRemoteModule: true,
          webSecurity: false,
          contextIsolation: false,
          offscreen: true,
        },
      },
    },
    readMailReadOnly: {
      webUrl: webReadMailReadOnly,
      url: readMailReadOnlyURL,
      option: {
        resizable: true,
      },
      prepareCount: 0,
      maxPreparedCount: 0,
      autoPrepare: 0,
    },
    readOnlyUniversal: {
      webUrl: webReadOnlyUniversal,
      url: readOnlyUniversalURL,
      option: {
        resizable: true,
      },
      prepareCount: 0,
      maxPreparedCount: 0,
      autoPrepare: 0,
    },
    // asyncApi: {
    //   url: webAsyncapiUrl,
    //   webUrl: asyncapiUrl,
    //   option: {
    //     icon: appIconPath,
    //     show: false,
    //     webPreferences: {
    //       // preload: path.join(__dirname, 'preload.js'),
    //       nativeWindowOpen: true,
    //       nodeIntegration: true,
    //       // enableRemoteModule: true,
    //       webSecurity: false,
    //       contextIsolation: false
    //       // offscreen : true,
    //     }
    //   },
    //   singleInstance: true
    // }
    cluePreview: {
      webUrl: webCluePreviewURL,
      url: cluePreviewURL,
      option: {
        resizable: true,
        titleBarStyle: 'default',
      },
    },
    openSeaPreview: {
      webUrl: webOpenSeaPreviewURL,
      url: openSeaPreviewURL,
      option: {
        resizable: true,
        titleBarStyle: 'default',
      },
    },
    customerPreview: {
      webUrl: webCustomerPreviewURL,
      url: customerPreviewURL,
      option: {
        resizable: true,
        titleBarStyle: 'default',
      },
    },
    opportunityPreview: {
      webUrl: webOpportunityPreviewURL,
      url: opportunityPreviewURL,
      option: {
        resizable: true,
        titleBarStyle: 'default',
      },
    },
    iframePreview: {
      webUrl: webIframePreviewURL,
      url: iframePreviewURL,
      option: {
        resizable: true,
        titleBarStyle: 'default',
      },
    },
    marketingDataViewer: {
      webUrl: webMarketingDataViewURL,
      url: marketingDataViewURL,
      option: {
        resizable: true,
      },
    },
    personalWhatsapp: {
      webUrl: webPersonalWhatsappUrl,
      url: personalWhatsappUrl,
      singleInstance: true,
      option: {
        resizable: true,
      },
    },
    // notificationPage: {
    //   webUrl: webNotificationPageURL,
    //   url: notificationPageURL,
    //   singleInstance: true,
    //   option: {
    //     resizable: true,
    //     show: false,
    //     titleBarStyle: isMac ? 'hiddenInset' : 'default',
    //     width: 867,
    //     height: 640,
    //     webPreferences: {
    //       nativeWindowOpen: true,
    //       nodeIntegration: true,
    //       contextIsolation: false,
    //       // enableRemoteModule: true,
    //       webviewTag: true,
    //       webSecurity: false,
    //       spellcheck: false,
    //       backgroundThrottling: false,
    //     },
    //   },
    //   prepareCount: 1,
    //   maxPreparedCount: 1,
    //   autoPrepare: 1,
    //   lastCreateOutDateTime: 7 * 24 * 60 * 60 * 1000,
    // },
  };

  host: string = /* 'http://su-desktop-web.cowork.netease.com'; */ host;

  domain: string = /* 'http://su-desktop-web.cowork.netease.com'; */ domain;

  domesticHost: string = /* 'https://lingxi-domestic.office.163.com' */ stage !== 'prod' ? '' : domesticHost;

  commonApiHost: string = commonApiHost;

  commonMailHost: string = commonMailHost;

  debug: boolean = stage !== 'prod';

  // static defaultSession: Session | undefined;

  // static aliveSessionMap: Map<string, Session> = new Map<string, Electron.Session>();

  readonly defaultSessionName: string = 'persist:sirius';

  commonWebPreferences = {
    partition: this.defaultSessionName,
    preload: path.join(__dirname, 'preload.js'),
  };

  readonly allCookieDomain = [
    ...(this.commonApiHost ? [this.commonApiHost] : [addTailSlash(this.host), ...(this.domesticHost ? [addTailSlash(this.domesticHost)] : []), addTailSlash(docHost)]),
    ...(this.commonMailHost ? [addTailSlash(this.commonMailHost)] : [addTailSlash(webMailHZHost), addTailSlash(webMailBJHost)]),
    addTailSlash(attaPreviewHost),
  ];

  readonly unUnusedCookieDomain = [
    ...(this.commonApiHost ? [addTailSlash(this.host), ...(this.domesticHost ? [addTailSlash(this.domesticHost)] : []), addTailSlash(docHost)] : []),
    ...(this.commonMailHost ? [addTailSlash(webMailHZHost), addTailSlash(webMailBJHost)] : []),
    addTailSlash(corpHost),
  ].map(item => {
    try {
      const url = new URL(item);
      return url.host;
    } catch (ex) {
      console.error('parse url error');
      return '';
    }
  });

  readonly allCookieDomainMap: Map<string, string>;

  readonly unUnsedCookieDomainMap: Map<string, boolean>;

  InitData: StoreData;

  // 清理log的时间
  clearLogsTime: null | number = null;

  // 清理周期（一天）
  clearPeriod: number = 24 * 60 * 60 * 1000;

  constructor() {
    this.InitData = {
      window: {
        bounds: {
          main: {
            width: 1280,
            height: 800,
          },
        },
      },
      app: {
        autoLaunch: true,
        downloadPath: getDefaultDownloadPath(),
        initAccount: undefined,
        autoLaunchToTray: true,
        isTransferToAutoLaunch: false,
        appPageZoomVal: -1,
      },
      account: {},
      performanceLog: {},
      user: { account: {}, current: undefined, lowMemoryMode: false, useInProcessGPU: false, useSystemProxyType: 'systemProxy-smartProxy' },
      bridge: {},
      event: {},
      download: {
        inprogress: {},
      },
      memory: {},
    };
    // this.winIdMap={};
    this.allCookieDomainMap = new Map<string, string>(
      this.allCookieDomain.map(it => {
        const url = new URL(it);
        const startWithDot = url.host.indexOf('.') !== 0;
        return [it, startWithDot ? url.host : '.' + url.host];
      })
    );
    this.unUnsedCookieDomainMap = new Map<string, boolean>(
      this.unUnusedCookieDomain.map(it => {
        return [it, true];
      })
    );
    // this._downloadManager = downloadManage;
  }

  getWindow(winId?: number) {
    // 自定义hook及各类其他必要属性需要被附加在window上
    const winIdMapElement = this.getWin(winId);
    return winIdMapElement ? winIdMapElement.win : undefined;
  }

  getWin(winId: number | undefined) {
    const id = winId || -1;
    let winIdMapElement: WinInfo | undefined = AbstractManager.winIdMap[id];
    if (winIdMapElement) {
      const fromId = BrowserWindow.fromId(winIdMapElement.id);
      if (fromId) {
        winIdMapElement.win = fromId;
      } else {
        winIdMapElement = undefined;
        delete AbstractManager.winIdMap[id];
      }
    }
    return winIdMapElement;
  }

  send(req: IpcMainSend): void {
    const { id } = req;
    const win = this.getWindow(id);
    if (win) {
      win.webContents.send(req.channel, req.data);
    } else {
      console.warn('no window found for', req);
    }
  }

  broadCast(req: IpcMainSend): void {
    console.log(req);
  }

  getMainWinInfo(): WinInfo | undefined {
    let winInfo: WinInfo | undefined = AbstractManager.winIdMap[-1];
    if (!winInfo) {
      const values = Object.values(AbstractManager.winIdMap) as WinInfo[];
      winInfo = values.find(it => it.isMain);
      if (winInfo) {
        AbstractManager.winIdMap[-1] = winInfo;
      } else {
        // throw new Error('no main window');
      }
    }
    return winInfo;
  }

  updateCommonSessionOpt(sessionName: string) {
    console.log('download updateCommonSessionOpt', sessionName);
    this.commonWebPreferences.partition = this.buildSessionName(sessionName);
  }

  private buildSessionName(sessionName: string) {
    const hasSessionName = sessionName && sessionName.length > 0;
    let ret;
    if (hasSessionName) {
      if (sessionName === this.defaultSessionName) {
        return sessionName;
      }
      if (sessionName.startsWith('memory')) {
        ret = sessionName;
      } else {
        ret = this.defaultSessionName + '_' + sessionName;
      }
    } else {
      ret = this.defaultSessionName;
    }
    // this.writeLog('__electron_get_session', {sessionName, ret}).then();
    console.log('download [main] handle session of ', sessionName, ret);
    return ret;
  }

  // getStoredCookie(domain: string | undefined) {
  //   console.log(domain)
  //   return this.currentCookies;
  // }

  getCookieFromCookieJar(cookieJar: Electron.Cookies, domain: string | undefined) {
    return cookieJar.get(domain ? { domain } : {}).then((res: Cookie[]) => {
      const ret: CookieStore[] = [];
      if (res && res.length > 0) {
        res.forEach(it => {
          ret.push({ ...it } as CookieStore);
        });
      }
      return ret;
    });
  }

  private getHostByDomain(domain?: string) {
    return domain && domain.startsWith('.') ? domain.slice(1) : domain;
  }

  private filterUnusedCookie(item: CookieStore) {
    if (!this.unUnusedCookieDomain || !this.unUnusedCookieDomain.length) {
      return true;
    }
    if (AbstractManager.cookieNameSetForAllDomain.has(item.name)) {
      const cookieHost = this.getHostByDomain(item.domain);
      if (cookieHost) {
        const isUnusedDomain = this.unUnsedCookieDomainMap.get(cookieHost);
        return !isUnusedDomain;
      }
      return true;
    }
    return true;
  }

  // eslint-disable-next-line no-unused-vars
  private async deleteUnUsedCookie(cookieJar: Electron.Cookies, cookieNameValueMap: Map<string, string>, _defaultUrl?: string) {
    try {
      if (!this.unUnsedCookieDomainMap.size) {
        return;
      }
      if (!cookieNameValueMap || !cookieNameValueMap.size) {
        return;
      }
      const cookies = await this.getCookieFromCookieJar(cookieJar, undefined);
      const removePromises: Array<Promise<void>> = [];
      cookies.forEach(item => {
        const newCookieValue = cookieNameValueMap.get(item.name);
        if (typeof newCookieValue !== 'undefined') {
          const cookieHost = this.getHostByDomain(item.domain);
          if (newCookieValue !== item.value && cookieHost && this.unUnsedCookieDomainMap.get(cookieHost)) {
            this.writeLog('cookieNameValueMap-delete-needdelete', { msg: `name is ${item.name}, doamin is ${item.domain}` });
            if (item.domain) {
              const url = this.getUrlByDoamin(item.domain);
              const newVar = {
                url: url,
                name: item.name,
                value: item.value,
                httpOnly: !!item.hostOnly,
                secure: !!item.secure,
                path: item.path || '/',
                sameSite: 'no_restriction',
                domain: item.domain,
              } as CookiesSetDetails;

              newVar.expirationDate = 1;
              removePromises.push(
                cookieJar.set(newVar).catch(err => {
                  try {
                    this.writeLog('removeCookie-Catch', { message: err ? err.message : '' });
                  } catch (ex: any) {
                    this.writeLog('removeCookie-Catch-Catch', { message: ex ? ex.message : '' });
                  }
                })
              );
            }
          }
        }
      });
      if (removePromises && removePromises.length) {
        await Promise.allSettled(removePromises);
      }
    } catch (ex: any) {
      this.writeLog('removeCookie-Catch-Catch', { message: ex ? ex.message : '' });
    }
  }

  private getUrlByDoamin(domain?: string) {
    return domain ? `https://${this.getHostByDomain(domain)}/` : '';
  }

  setCookieToCookieJar(conf: CookieSetParams) {
    const { cookieJar, cookies, url, domain, noLog, from, noBuildExtraCookie = false } = conf;
    if (!noLog) {
      setTimeout(() => {
        this.writeLog('__electron_set_cookie', { cookies, url, from }).then();
      }, 100);
    }
    let cookiesNeedSet;
    const cookiesNameValueMap = new Map<string, string>();
    if (cookies && cookies.length > 0) {
      if (!noBuildExtraCookie) {
        cookies.forEach(it => {
          if (AbstractManager.cookieNameSetForAllDomain.has(it.name)) {
            cookiesNameValueMap.set(it.name, it.value);
          }
          this.buildExtraHostCookies(it, cookies);
        });
        cookiesNeedSet = cookies;
      } else {
        cookiesNeedSet = cookies.filter(this.filterUnusedCookie.bind(this));
        this.writeLog('filter-cookie-need-set', { msg: `before length is ${cookies.length}, after filter length is ${cookiesNeedSet.length}.` });
      }
      const cookieStorePromise = cookiesNeedSet.reduce(
        (promise: Promise<void>, cur: CookieStore) =>
          promise.then(() => {
            const newVar = {
              url: cur.url || this.getUrlByDoamin(cur.domain) || url,
              name: cur.name,
              value: cur.value,
              httpOnly: !!cur.hostOnly,
              secure: !!cur.secure,
              path: cur.path || '/',
              sameSite: 'no_restriction',
            } as CookiesSetDetails;
            if (domain || cur.domain) {
              newVar.domain = domain || cur.domain;
            }
            // if (cur.sameSite) {
            //   newVar.sameSite = cur.sameSite;
            // }
            if (cur.expirationDate) {
              newVar.expirationDate = cur.expirationDate;
            } else if (newVar.name && AbstractManager.cookieNameNeedPreserve.has(newVar.name.toLowerCase())) {
              newVar.expirationDate =
                Math.round(Date.now() / 1000) + (AbstractManager.cookieNameNeedPreserve.get(newVar.name.toLowerCase()) || this.authCookieExpiredTime);
            }
            if (this.debug) {
              console.log('###! set cookie:', newVar);
            }
            return cookieJar.set(newVar).catch(ex => {
              try {
                this.writeLog('set-cookie-error', {
                  cookie: { name: newVar.name, value: newVar.value, domain: newVar.domain, url: newVar.url, sameSite: newVar.sameSite },
                  error: { message: ex && ex.message ? ex.message : '', stack: ex && ex.stack ? ex.stack : '' },
                });
                console.warn('[main-cookie]', newVar, ex);
              } catch (catchEx: any) {
                this.writeLog('set-cookie-error-catch', {
                  message: catchEx && catchEx.message ? catchEx.message : '',
                  stack: catchEx && catchEx.stack ? catchEx.stack : '',
                });
              }
              return Promise.resolve();
            });
          }),
        Promise.resolve()
      );
      return cookieStorePromise
        .then(() =>
          // 过度逻辑，先暂时后置检查下
          this.deleteUnUsedCookie(cookieJar, cookiesNameValueMap, url)
        )
        .then(() => cookieJar.flushStore());
    }
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject('参数错误，需要传入需设置的cookie: ' + JSON.stringify(conf));
  }

  /**
   * 提供sessionName则会启动对应的session
   * @param sessionName
   */
  getSession(sessionName?: string) {
    // if (!sessionName && AbstractManager.defaultSession) {
    //   return AbstractManager.defaultSession as Session;
    // } else {
    // const key = sessionName || '';
    // if (AbstractManager.aliveSessionMap.has(key)) {
    //   return AbstractManager.aliveSessionMap.get(key) as Session;
    // }
    const sessName = sessionName && sessionName.length > 0 ? sessionName : this.get('user', 'currentSession');
    const sessionNameFinal = this.buildSessionName(sessName);
    const sess = session.fromPartition(sessionNameFinal, { cache: true });
    if (isEdm) {
      if (AbstractManager.sessionHasSetSessionProxy && !AbstractManager.sessionHasSetSessionProxy.has(sessionNameFinal)) {
        const useSystemProxy = storeManage.getSystemProxyType();
        if (useSystemProxy) {
          if (useSystemProxy === 'systemProxy-smartProxy') {
            sess
              .resolveProxy('https://www.baidu.com')
              .then(res => {
                if (res && res.toLowerCase().indexOf('proxy') >= 0) {
                  const proxyServer = res.split(/\s/)[1];
                  sess.setProxy({
                    proxyRules: `https=${proxyServer},direct://`,
                  });
                }
              })
              .catch((err: any) => {
                this.writeLog('resolveProxy-catch', { message: err && err.message, stack: err && err.stack });
              });
          } else if (useSystemProxy === 'systemProxy-useDirect') {
            sess.setProxy({ proxyBypassRules: '.163.com,.netease.com' });
          }
        }
        AbstractManager.sessionHasSetSessionProxy.add(sessionNameFinal);
      }
    }
    // if (!sessionName) AbstractManager.defaultSession = sess;
    // AbstractManager.aliveSessionMap.set(key, sess);
    return sess as Session;
    // }
  }

  buildExtraHostCookies(cookieItem: CookieStore, cookieStore: CookieStore[]) {
    if (AbstractManager.cookieNameSetForAllDomain.has(cookieItem.name)) {
      this.allCookieDomainMap.forEach((val, k) => {
        if (
          !cookieItem.domain ||
          val.indexOf(cookieItem.domain) < 0 ||
          (cookieItem.domain && cookieItem.domain.indexOf('.') !== 0 && val.indexOf('.' + cookieItem.domain) < 0)
        ) {
          cookieStore.push({
            url: k,
            sameSite: 'no_restriction',
            secure: true,
            name: cookieItem.name,
            value: cookieItem.value,
            expirationDate: cookieItem.expirationDate,
            domain: val,
          } as CookieStore);
        }
      });
    }
  }

  get(moduleName: YMStoreModuleName, attr?: StoreDataKey) {
    const data = this.InitData[moduleName];
    // @ts-ignore
    return attr ? data[attr] : data;
  }

  async writeToLogFile(conf: { data: string[] | string; appendix?: string }) {
    const { data, appendix } = conf;
    const dir = path.join(userDataPath, 'logs');
    await fse.ensureDir(dir);
    const now = new Date();
    const dtStr = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
    const typeStr = appendix ? '.' + appendix : '';
    const ph = path.join(dir, dtStr + typeStr + '.log');
    let result = (data && Array.isArray(data) ? data.join(',\n\n') : String(data)) + ',\n\n';
    if (result.length > 5 * 1024 * 1024) {
      result = result.substr(0, 5 * 1024 * 1024);
    }
    await fse.appendFile(ph, result);
    const nowTime = now.getTime();
    const { clearLogsTime, clearPeriod } = this;
    if (!this.clearLogsTime || nowTime - (clearLogsTime as number) > clearPeriod) {
      this.clearOutOfDateLogs(dir, nowTime);
    }
  }

  getFilePath(fileName: string, filePath?: string, dirPath?: string): string {
    if (!filePath) {
      dirPath = dirPath || getDownloadPath();
      try {
        fse.ensureDirSync(dirPath);
      } catch (ex) {
        console.warn('folder not ensured:', ex);
        this.writeLog('-electron-donwload-folder-create-failed', { filePath, fileName, dirPath }).then();
        dirPath = getDefaultDownloadPath();
      }
      filePath = path.normalize(path.join(dirPath, fileName));
    }

    return filePath;
  }

  async getCookie(domain: string, sessionName?: string): Promise<string> {
    const res = await this.getCookieFromCookieJar(this.getSession(sessionName).cookies, undefined);
    //     {
    //   domain,
    // }
    let cookie = '';
    if (res && res.length > 0) {
      console.log('got all cookies : ', res);
      const cookieStores = res.filter(it => {
        if (it.domain) {
          const domainStr = it.domain?.startsWith('.') ? it.domain?.substr(1) : it.domain;
          return domain.indexOf(domainStr) >= 0;
        }
        return false;
      });
      let first = true;
      cookieStores.forEach(item => {
        if (first) {
          first = false;
          cookie = item.name + '=' + item.value;
        } else {
          cookie += '; ' + item.name + '=' + item.value;
        }
      });
    }
    return cookie;
  }

  // 清除7天前过时log
  clearOutOfDateLogs(dir: string, nowTime: number) {
    // 如果需要清理log，则下一任务周期中处理，避免写入大量日志后还需要额外等待清理日志的时间，进而造成卡顿
    setTimeout(() => {
      const sevDays = 7 * 24 * 60 * 60 * 1000;
      fse.readdir(dir, (err, files) => {
        if (err) {
          return console.error(err);
        }
        if (files?.length) {
          files.forEach(file => {
            try {
              const fileDate = file.split('.')[0];
              if (nowTime - new Date(fileDate).getTime() > sevDays) {
                fse.remove(`${dir}/${file}`).then();
              }
            } catch (error) {
              console.error('删除log失败', error);
            }
          });
        }
        this.clearLogsTime = nowTime;
      });
    }, 10);
  }

  // 暂时没引用
  // private getCurDate() {
  //   const now = new Date();
  //   return (
  //     now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds()
  //   );
  // }

  writeLog(eventId: string, data: any) {
    return this.writeToLogFile({ data: '\n' + JSON.stringify({ date: Date.now(), eventId, data }) });
  }

  writeCatchError(type: string, ex: any) {
    return this.writeLog(type, { message: ex && ex.message ? ex.message : '' });
  }
}

const getAppPathByName = (name: PathTypeName): string | undefined => {
  let ret;
  try {
    ret = app.getPath(name);
  } catch (e) {
    console.warn(e);
  }
  return ret;
};

const pathNames: PathTypeName[] = ['downloads', 'desktop', 'home', 'userData'];

export const getDefaultDownloadPath = () => {
  let ret;
  pathNames.some(it => {
    const res = getAppPathByName(it);
    if (res && res.trim().length > 0) {
      ret = res;
      return true;
    }
    return false;
  });
  return ret || './';
  // try {
  //   return app.getPath('downloads');
  // } catch (error) {
  //   try {
  //     return app.getPath('desktop');
  //   } catch (error) {
  //     try {
  //       return app.getPath('home');
  //     } catch (error) {
  //       return app.getPath('userData');
  //     }
  //   }
  // }
};
