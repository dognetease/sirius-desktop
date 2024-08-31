import { config, ignoreLoginPath } from 'env_def';
import type { Locale } from './utils/global_label';
import { initWindowLang } from './utils/global_label';
import { api, ApiResposity } from './api/api';
import implsList, { apisManager, initApi } from './gen/impl_list';
import { apis, inWindow, isElectron, jumpLogin, loginFlag, loginPage, isLowMemoryMode } from './config';
import { pathNotInArrJudge, isSupportNativeProxy } from './api/util';
import { globalStoreConfig } from '@/api/data/store';
import { User } from './api/_base/api';
// import { LoginApi } from '@/api/logical/login';
import { AccountApi } from '@/api/logical/account';
import { DataTrackerApi } from '@/api/data/dataTracker';
import { bridgeInit } from './bridge/index';
import { getIsLoginPage } from './utils/isLocPage';
import { inWindowTool } from './utils/inWindow';
import { getOs } from './utils/confOs';

// export { Lang, DEFAULT_LANG } from './utils/global_label/index';

export const apiManager = apisManager;
if (inWindowTool()) {
  window.apiManager = apiManager;
}

export type GetLocalLabel = (locale: string | Locale) => string;

export const apiHolder = {
  api: api as ApiResposity,
  features: implsList,
  env: {
    forElectron: config('build_for') === 'electron',
    isMac: getOs() === 'mac',
    os: getOs(),
  },
  initModule: false,
};

export const conf = config;

export const http = {
  // host:"",
  timeout: 3000,
};

apiManager.registerApiPolicy({
  target: apis.upgradeAppApiImpl,
  called: new Set(),
  canRecall: () => true,
  exclude: (apiName, ev) => {
    const loc = apiName === 'onPathChange' ? ev?.curPath || window.location : window.location;
    // console.log('test policy for upgrade ' + type + ' ' + location.href);
    return pathNotInArrJudge(loc, ['/']);
  },
});
apiManager.registerApiPolicy({
  target: apis.taskApiImpl,
  called: new Set(),
  canRecall: () => true,
  exclude: () => {
    const loc = window.location;
    // console.log('test policy for upgrade ' + type + ' ' + location.href);
    return pathNotInArrJudge(loc, ['/', '/launch/', '/jump/']);
  },
});
apiManager.registerApiPolicy({
  target: apis.imApiImpl,
  called: new Set(),
  canRecall: apiName => ['afterLogin', 'beforeLogout', 'onPathChange', 'init'].includes(apiName as string),
  exclude: (apiName, ev) => {
    if (apiName === 'afterLogin' || apiName === 'beforeLogout') {
      return false;
    }
    const loc = apiName === 'onPathChange' ? ev?.curPath || window.location : window.location;
    // console.log('test policy for im ' + type + ' ' + location.href+' result '+b);
    return pathNotInArrJudge(loc, ['/', '/launch/']);
  },
});
apiManager.registerApiPolicy({
  target: apis.pushApiImpl,
  called: new Set(),
  canRecall: () => true,
  exclude: (apiName, ev) => {
    // console.log('test policy for push ' + type + ' ' + location.href);
    const loc = apiName === 'onPathChange' ? ev?.curPath || window.location : window.location;
    return pathNotInArrJudge(loc, ['/', '/launch/']);
  },
});
apiManager.registerApiPolicy({
  target: apis.contactApiImpl,
  called: new Set(),
  canRecall: apiName => ['afterLogin', 'beforeLogout', 'onPathChange'].includes(apiName as string),
  exclude: (apiName, ev) => {
    // if (apiName === 'afterLogin' || apiName === 'beforeLogout') {
    //   return false;
    // }
    console.log('test policy for contact ', apiName, ev);
    const loc = apiName === 'onPathChange' ? ev?.curPath || window.location : window.location;
    return pathNotInArrJudge(loc, [
      '/index.html',
      '/',
      '/doc',
      '/sheet',
      '/unitable',
      '/launch',
      '/writeMail',
      '/readMailComb',
      '/contactSync',
      '/scheduleOpPage',
      '/resources',
      // bkInit要执行contactApi
      '/api_data_init',
      /* '/jump/' */
    ]);
  },
});
apiManager.registerApiPolicy({
  target: apis.mailApiImpl,
  called: new Set(),
  canRecall: apiName => ['afterLogin', 'beforeLogout', 'onPathChange', 'init'].includes(apiName as string),
  exclude: (apiName, ev) => {
    if (apiName === 'afterLogin' || apiName === 'beforeLogout') {
      return false;
    }
    const loc = apiName === 'onPathChange' ? ev?.curPath || window.location : window.location;

    // location.pathname !== '/' && location.pathname !== '/writeMail' && location.pathname !== '/readMailComb';
    const b = pathNotInArrJudge(loc, [
      '/index.html',
      '/',
      '/launch',
      '/writeMail',
      '/readMailComb',
      '/readMail',
      '/strangerMails',
      '/marketingDataViewer',
      '/personalWhatsapp',
      /* '/jump/' */
    ]);
    console.log('test policy for mail ' + loc.pathname + ' ' + location.href, b);
    return b;
  },
});
apiManager.registerApiPolicy({
  target: apis.mailConfApiImpl,
  called: new Set(),
  canRecall: apiName => ['afterLogin', 'beforeLogout', 'onPathChange', 'init'].includes(apiName as string),
  exclude: (apiName, ev) => {
    if (apiName === 'afterLogin' || apiName === 'beforeLogout') {
      return false;
    }
    const loc = apiName === 'onPathChange' ? ev?.curPath || window.location : window.location;
    // console.log('test policy for mail conf ' + type + ' ' + location.href);
    // location.pathname !== '/' && location.pathname !== 'writeMail' && location.pathname !== 'readMailComb';
    return pathNotInArrJudge(loc, [
      '/index.html',
      '/',
      '/launch',
      '/writeMail',
      '/readMailComb',
      '/readMail',
      '/strangerMails',
      '/marketingDataViewer',
      /* '/jump/' */
    ]);
  },
});
// apis.catalogApiImpl
// apiManager.registerApiPolicy({
//     target: apis.mailConfApiImpl,
//     called: new Set(),
//     exclude: (type) => {
//       console.log('test policy for mail conf ' + type + ' ' + location.href);
//       return location.pathname !== '/' && location.pathname!=='writeMail';
//     },
//   },
// );
initApi();
// 在这里执行Bridge的代理逻辑
if (!process.env.BUILD_ISELECTRON) {
  if (isSupportNativeProxy && !getIsLoginPage()) {
    // 执行后台拦截API功能初始化
    bridgeInit();
  }
} else {
  // electron环境暂时先初始化
  if (!isLowMemoryMode) {
    bridgeInit();
  }
}

console.log('----------judge login-----------');

const toLogin = () => {
  const sysApi = window.apiResposity.getSystemApi();
  const loggerApi = window.apiResposity.requireLogicalApi(apis.loggerApiImpl) as DataTrackerApi;
  // const storeApi = window.apiResposity.getDataStoreApi();
  try {
    console.log('----------jump to login-----------');
    if (isElectron() && !sysApi.isMainWindow() && !sysApi.isStartWindow() && window.electronLib) {
      // jumpLogin();
      setTimeout(() => {
        if (!sysApi.getCurrentUser()) sysApi.closeWindow(false, true);
      }, 1000);
      console.log('[api] should close ', window.location.href);
      loggerApi.track('electron_load_page_login_failed', {
        href: window.location.href,
      });
    }
    // 万一没关掉，还是去login
    jumpLogin();
  } catch (ex) {
    console.warn('[api] logout issue:', ex);
    // const loginApi = api.requireLogicalApi(apis.loginApiImpl) as LoginApi;
    // loginApi.jumpLogin();
    // setTimeout(() => {
    window.location.assign(loginPage);
    // }, 0);
  }
};

const transferData = async () => {
  // const sysApi = window.apiResposity.getSystemApi();
  const storeApi = window.apiResposity.getDataStoreApi();
  // const loginApi = window.apiResposity.requireLogicalApi(apis.loginApiImpl) as LoginApi;
  const accountApi = window.apiResposity.requireLogicalApi(apis.accountApiImpl) as AccountApi;
  try {
    const res: Record<string, string> = await window.electronLib.storeManage.get('account');
    const keyDeviceUUID: string = config('browerDeviceUUID') as string;
    const nodeKey = 'currentNodeStore';
    // const accountKey = sysApi.md5(config('keyOfAccount') as string);
    const { info, node, uuid, accounts } = res;
    console.log('[transfer] data:', res);
    if (node) {
      storeApi.putSync(nodeKey, node, globalStoreConfig);
    }
    if (uuid) {
      storeApi.putSync(keyDeviceUUID, uuid, globalStoreConfig);
      storeApi.loadUUID();
    }
    if (accounts) {
      // const saveContent = await sysApi.encryptMsg(accounts);
      // storeApi.putSync(accountKey, saveContent, globalStoreConfig);
      await accountApi.doSaveStorageAccount(JSON.parse(accounts));
    } else {
      console.warn('no accounts data');
      loginFlag.canJump = true;
      window.location.assign('/');
      return;
    }
    if (info) {
      const lst: User = JSON.parse(info);
      const res = await storeApi.setLastAccount(lst);
      if (res === 'fail') {
        console.warn('save current account failed');
        loginFlag.canJump = true;
        window.location.assign('/');
        return;
      }
      if (lst?.cookies && lst?.cookies.length > 0) {
        try {
          await window.electronLib.appManage.setCookieStore(lst.cookies);
          // if (loginedAccount?.user?.lastLoginTime) {
          // const lst = loginedAccount?.user?.lastLoginTime;
          // if (lst && lst > new Date().getTime() + LoginApiImpl.maxLoginNoRefreshSpan) {
          //   needLogin = false;
          // }
          // }
          console.log('[transfer]  finish seting cookies !!!!!- ', lst.cookies);
        } catch (e) {
          console.warn(e);
        }
      }
      window.location.assign('/');
      // const loginModel = await loginApi.doAutoLogin(lst.id);
      // console.log('[transfer]  auto login ', loginModel);
      // if (loginModel.pass) {
      //   loginFlag.canJump = true;
      // } else {
      //   loginFlag.canJump = true;
      //   toLogin();
      // }
    } else {
      console.warn('no current account ');
      loginFlag.canJump = true;
      window.location.assign('/');
      return;
    }
    // 记录账号转移完成
    window.electronLib.storeManage.set('app', 'initAccount', 'true').then();
  } catch (ex) {
    console.warn('init account failed:', ex);
    loginFlag.canJump = true;
    window.location.assign('/');
  }
};

if (
  inWindow() &&
  window.location.href.indexOf('login') < 0 &&
  pathNotInArrJudge(window.location, ignoreLoginPath) &&
  !window.apiResposity.getSystemApi().getCurrentUser()
) {
  // const loginPass = false;
  // location.assign('/login'/*+encodeURIComponent(location.href)*/);
  // 以下逻辑主要用于账号迁移时,将主进程内存储的数据写入数据到localstorage
  if (isElectron() && window.electronLib && window.location.href.indexOf('init=true') >= 0) {
    loginFlag.canJump = false;
    transferData();
  } else {
    toLogin();
  }
  // return null;
} else if (inWindow() && window.apiResposity.getSystemApi().getCurrentUser()) {
  console.log('----------pass login check-----------');
  initWindowLang(true);

  // 正常登录，证明账号已经初始化了
  if (inWindow() && isElectron() && window.electronLib) {
    window.electronLib.storeManage.set('app', 'initAccount', 'true').then();
  }
}
if (inWindow()) {
  if (isElectron()) {
    console.log('init stat: ', process && typeof process.memoryUsage === 'function' ? process.memoryUsage() : process);
  }
  // if (conf('stage') !== 'prod') {
  window.getSpConf = (data: string) => config(data);
  // }
  console.log('init stat: ', window.performance.memory);
  // const browserInfo = api.getSystemApi().getBrowserInfo();
  // if (browserInfo && (browserInfo.name === 'safari' || browserInfo.name === 'ie')) {
  //   window.alert('所用的浏览器可能不支持当前应用，推荐更换chrome浏览器再试');
  //   window.location.assign('https://cn.bing.com/search?q=chrome+%E4%B8%8B%E8%BD%BD&PC=U316&FORM=CHROMN');
  // }
}

// function handleOpenUrl(winid: number, data: any) {
//   const systemApi=window.api.getSystemApi();
//   systemApi.handleJumpUrl(winid, data);
// }
//
// if (inWindow()) {
//   const systemApi=window.api.getSystemApi();
//   if (systemApi.isElectron() && window.electronLib) {
//     window.electronLib.windowManage.addHooksListener({
//       onOpenExternalUrl: handleOpenUrl,
//     }, 'current');
//   }
// }
