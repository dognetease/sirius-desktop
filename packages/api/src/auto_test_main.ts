import { config } from 'env_def';
import { Locale, initWindowLang } from './utils/global_label';
import { apisManager, initApi } from './gen/impl_list';
import { apis, inWindow } from '@/config';
// import { bridgeInit } from './bridge/index';

// export { Lang, DEFAULT_LANG } from './utils/global_label/index';
// import { pathNotInArrJudge } from '@/api/util';
// import { ApiManager } from './api_manager';
export type GetLocalLabel = (locale: string | Locale) => string;
export const apiManager = apisManager;

apiManager.registerApiPolicy({
  target: apis.upgradeAppApiImpl,
  called: new Set(),
  canRecall: () => true,
  exclude: () => true,
  // console.log('test policy for upgrade ' + type + ' ' + location.href);
});
apiManager.registerApiPolicy({
  target: apis.taskApiImpl,
  called: new Set(),
  canRecall: () => true,
  exclude: () => true,
  // const loc = window.location;
  // console.log('test policy for upgrade ' + type + ' ' + location.href);
});
apiManager.registerApiPolicy({
  target: apis.imApiImpl,
  called: new Set(),
  canRecall: apiName => ['afterLogin', 'beforeLogout', 'onPathChange', 'init'].includes(apiName as string),
  exclude: apiName => {
    if (apiName === 'afterLogin' || apiName === 'beforeLogout') {
      return false;
    }
    // const loc = apiName === 'onPathChange'
    //   ? (ev?.curPath || window.location)
    //   : window.location;
    // console.log('test policy for im ' + type + ' ' + location.href+' result '+b);
    return true;
  },
});
apiManager.registerApiPolicy({
  target: apis.pushApiImpl,
  called: new Set(),
  canRecall: () => true,
  exclude: apiName => {
    console.log('test policy for push ' + apiName + ' ' + location.href);
    // const loc = apiName === 'onPathChange'
    //   ? ev?.curPath || window.location
    //   : window.location;
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
    // const loc = apiName === 'onPathChange'
    //   ? ev?.curPath || window.location
    //   : window.location;
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
    // const loc = apiName === 'onPathChange'
    //   ? ev?.curPath || window.location
    //   : window.location;
    //
    // // location.pathname !== '/' && location.pathname !== '/writeMail' && location.pathname !== '/readMailComb';
    // const b = pathNotInArrJudge(loc, [
    //   '/index.html',
    //   '/',
    //   '/launch',
    //   '/writeMail',
    //   '/readMailComb',
    //   '/readMail',
    //   '/strangerMails'
    // ]);
    // console.log('test policy for mail ' + loc.pathname + ' ' + location.href, b);
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
    // const loc = apiName === 'onPathChange'
    //   ? ev?.curPath || window.location
    //   : window.location;
    console.log('test policy for mail conf ' + apiName + ' ' + location.href);
    // location.pathname !== '/' && location.pathname !== 'writeMail' && location.pathname !== 'readMailComb';
    return true;
  },
});

initApi();

// 执行后台拦截API功能初始化
// bridgeInit();

const eventApi = window.apiResposity.getEventApi();
const systemApi = window.apiResposity.getSystemApi();

if (!systemApi.getCurrentUser()) {
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
    } else if (ev) {
      // apiManager.triggerApiLifeCycleEvent({
      //   event: 'beforeLogout',
      //   curPath: location,
      //   data: ev
      // });
      // 收到登出信息，后台窗口直接关闭
      systemApi.closeWindow(false, true);
    }
  },
});
if (inWindow()) {
  initWindowLang(true);
  window.getSpConf = (data: string) => config(data);
}
