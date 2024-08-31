import { Locale, initWindowLang } from './utils/global_label';
import { apisManager, initApi } from './gen/impl_account_bg_list';
import { apis, inWindow } from '@/config';
import { bridgeInit } from './bridge';
// export { Lang, DEFAULT_LANG } from './utils/global_label/index';

export type GetLocalLabel = (locale: string | Locale) => string;
export const apiManager = apisManager;

const noLifeCycleApiNames = [apis.upgradeAppApiImpl, apis.keyboardApiImpl, apis.imApiImpl, apis.kfApiImpl, apis.configSettingApiImpl, apis.mailPraiseApiImpl];

noLifeCycleApiNames.forEach(apiName => {
  apiManager.registerApiPolicy({
    target: apiName,
    called: new Set(),
    canRecall: () => true,
    exclude: () => true,
  });
});

apiManager.registerApiPolicy({
  target: apis.pushApiImpl,
  called: new Set(),
  canRecall: () => true,
  exclude: apiName => {
    console.log('test policy for push ' + apiName + ' ' + location.href);
    const canCallApis = ['beforeLogout', 'afterLogin', 'init', 'afterLoadFinish'];
    if (canCallApis.includes(apiName as string)) {
      return false;
    }
    return true;
  },
});
apiManager.registerApiPolicy({
  target: apis.contactApiImpl,
  called: new Set(),
  canRecall: apiName => ['afterLogin', 'beforeLogout', 'onPathChange', 'init'].includes(apiName as string),
  exclude: (apiName, ev) => {
    if (apiName === 'afterLogin' || apiName === 'beforeLogout') {
      return false;
    }
    console.log('test policy for contact ', apiName, ev);
    return false;
  },
});
apiManager.registerApiPolicy({
  target: apis.mailApiImpl,
  called: new Set(),
  canRecall: apiName => ['afterLogin', 'beforeLogout', 'onPathChange', 'init'].includes(apiName as string),
  exclude: apiName => {
    if (apiName === 'afterLogin' || apiName === 'beforeLogout') {
      return false;
    }
    return false;
  },
});
apiManager.registerApiPolicy({
  target: apis.mailConfApiImpl,
  called: new Set(),
  canRecall: apiName => ['afterLogin', 'beforeLogout', 'onPathChange', 'init'].includes(apiName as string),
  exclude: apiName => {
    if (apiName === 'afterLogin' || apiName === 'beforeLogout') {
      return false;
    }
    console.log('test policy for mail conf ' + apiName + ' ' + location.href);
    return true;
  },
});

initApi();

// 执行后台拦截API功能初始化
bridgeInit();
const eventApi = window.apiResposity.getEventApi();
const systemApi = window.apiResposity.getSystemApi();
const isNoLoginPage = systemApi.getIsAddSubAccountPage() || systemApi.getIsSubAccountInitPage() || systemApi.getIsAddPersonalSubAccountPage();

if (!systemApi.getCurrentUser() && !isNoLoginPage) {
  systemApi.closeWindow(false, true);
}

apiManager.triggerApiLifeCycleEvent({
  event: 'afterInit',
  curPath: location,
});

window.addEventListener('load', ev => {
  console.log('loadend called', ev);
  apiManager.triggerApiLifeCycleEvent({
    event: 'afterLoadFinish',
    curPath: location,
    evData: ev,
  });
});

eventApi.registerSysEventObserver('login', {
  name: 'commonLoginOb',
  func: ev => {
    if (ev && ev.eventData) {
      apiManager.triggerApiLifeCycleEvent({
        event: 'afterLogin',
        curPath: location,
        data: ev,
      });
    } else {
      apiManager.triggerApiLifeCycleEvent({
        event: 'beforeLogout',
        curPath: location,
      });
    }
  },
});
if (inWindow()) {
  initWindowLang();
}
