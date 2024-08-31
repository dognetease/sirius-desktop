import { apis } from 'api';
import './src/styles/global.scss';
import '@lingxi-common-component/sirius-ui/index.css';
import { navigate } from 'gatsby';
import wrapWithProvider from './wrap-with-provider';

const isInWindow = typeof window !== 'undefined';

console.log(`apis is `, apis);

export const wrapRootElement = wrapWithProvider;
console.log('----------------from gatsby browser-------------------');
if (isInWindow) {
  const env = window.getSpConf('stage');
  window.siriusVersion = window.getSpConf('version') + (env !== 'prod' ? '-' + window.getSpConf('versionTime') : '');
  if (env !== 'prod') {
    window.navigateTo = navigate;
  }
}

const addGlobalRouterHandler = (systemApi, eventApi) => {
  const rootOb = 'routeChangeRootOb';
  if (systemApi.isMainPage() && eventApi.getObserverByName('routeChange', rootOb) === undefined) {
    eventApi.registerSysEventObserver('routeChange', {
      name: rootOb,
      func: e => {
        console.log('[gatsby ] will navigate ', e);
        const {
          eventData: { name = undefined, url = '/', state = {}, replace = false },
          eventStrData,
        } = e;
        if (eventStrData === 'gatsbyStateNav') {
          navigate(url, {
            state,
            replace,
          });
        } else {
          if (name) {
            navigate('#' + name);
            return;
          }
          navigate(url);
        }
        // if (inWindow() && systemApi.isElectron()) {
        //   window.electronLib.windowManage.restore();
        // }
      },
    });
  }
};
//

// let loginStatus = false;
export const onRouteUpdate = ({ location, prevLocation }) => {
  const systemApi = window.apiResposity.getSystemApi();
  const trackerApi = window.apiResposity.dataTrackerApiImp;
  const eventApi = window.apiResposity.getEventApi();
  addGlobalRouterHandler(systemApi, eventApi);
  // const loginApi = window.apiResposity.requireLogicalApi(apis.loginApiImpl);
  // const storeApi = window.apiResposity.getDataStoreApi();
  // const currentLoginStatus = storeApi.getCurrentUser() !== undefined;
  if (location && location.path && systemApi) {
    if (
      !systemApi.getCurrentUser() &&
      window.apiUtils.pathNotInArrJudge(location, window.apiUtils.ignoreLoginPath) &&
      location.hash &&
      location.hash.indexOf('setting') < 0
    ) {
      console.log('----------need logout-------------\n' + location.href);
      eventApi.sendSimpleSysEvent('logout');
    }
  }

  const urlChangedFields = {
    hash: 1,
    search: 2,
    pathname: 4,
  };

  const changeWeight = Object.keys(urlChangedFields).reduce((total, current) => {
    if (!prevLocation || !Reflect.has(prevLocation, current)) {
      return total + urlChangedFields[current];
    }
    if (location[current] !== prevLocation[current]) {
      return total + urlChangedFields[current];
    }
    return total;
  }, 0);

  console.log('[router]Changed', changeWeight);

  // 如果仅仅是hash改变了 不触发onPathChange 生命周期
  if (changeWeight <= urlChangedFields.hash) {
    return;
  }

  trackerApi.track('window_path_changed', {
    from: prevLocation ? prevLocation.href : '',
    to: location ? location.href : '',
  });
  window.apiManager.triggerApiLifeCycleEvent({
    event: 'onPathChange',
    curPath: location,
    prePath: prevLocation,
  });
};

/**
 * 获取permance的各类时间
 */
const getPagePerformanceTimes = async () => {
  const timeArr = [];
  const currPageName = window.apiUtils.getPageName();
  if (window.electronLib) {
    // 每个页面都应该记录该值
    const initTime = await window.electronLib.storeManage.get('app', 'electron-init-time');
    if (initTime) {
      timeArr.push({
        type: currPageName,
        subType: 'electron_init_time',
        value: Number(initTime),
      });
    }
    const systemApi = window.apiResposity.getSystemApi();
    if (systemApi.isMainWindow()) {
      // 避免页面跳转该值不准
      const createWindowTime = await window.electronLib.storeManage.get('app', 'electron-create-window-time');
      if (createWindowTime) {
        const windowCreateToPageInitTimeSpan = window.pageInitTime - Number(createWindowTime);
        timeArr.push({
          type: currPageName,
          subType: 'electron_create_window_time',
          value: windowCreateToPageInitTimeSpan,
        });
      }
    }
    // 页面onload事件后清空electron相关的时间
    await window.electronLib.storeManage.set('app', 'electron-create-window-time', '');
    await window.electronLib.storeManage.set('app', 'electron-init-time', '');
  }
  // 先用performance.timing获取
  if (isInWindow && window.performance && window.performance.timing) {
    const { fetchStart, domInteractive, loadEventStart, domComplete, navigationStart } = performance.timing;
    timeArr.push({
      type: currPageName,
      subType: 'dom_interactive',
      value: domInteractive - fetchStart,
    });

    timeArr.push({
      type: currPageName,
      subType: 'dom_load_event',
      value: loadEventStart - fetchStart,
    });

    timeArr.push({
      type: currPageName,
      subType: 'dom_all_time',
      value: domComplete - navigationStart,
    });
  }

  return timeArr;
};

/**
 * 发送性能时间点
 * @param {*} times
 */
const sendPerformanceTimes = times => {
  const performanceApi = window.apiResposity.performanceImpl;
  const items = times.map(timeItem => ({
    statKey: timeItem.subType,
    statSubKey: timeItem.type,
    value: timeItem.value,
    valueType: 1,
  }));
  performanceApi.point(items).then();
};

const logPagePerformanceToServer = () => {
  try {
    // 延迟以避免某些时刻performance.timing获取不到值
    setTimeout(async () => {
      const permformanceTimes = await getPagePerformanceTimes();
      sendPerformanceTimes(permformanceTimes);
    }, 20);
    // logLongTaskToServer();
  } catch (ex) {
    console.error('logPagePermanceToServer', ex);
  }
};

let isClientEntryInited = false;
/**
 *
 */
function handleOnClientEntry() {
  if (isClientEntryInited) return;
  const loggerApi = window.apiResposity.loggerApiImpl;
  const trackerApi = window.apiResposity.dataTrackerApiImp;
  const eventApi = window.apiResposity.getEventApi();
  const systemApi = window.apiResposity.getSystemApi();
  addGlobalRouterHandler(systemApi, eventApi);

  eventApi.registerSysEventObserver('login', {
    name: 'commonLoginOb',
    func: ev => {
      if (ev && ev.eventData) {
        window.apiManager.triggerApiLifeCycleEvent({
          event: 'afterLogin',
          curPath: location,
          data: ev,
        });
      } else if (ev) {
        window.apiManager.triggerApiLifeCycleEvent({
          event: 'beforeLogout',
          curPath: location,
        });
      }
    },
  });
  console.log('load end event triggered');
  if (isInWindow) {
    window.apiManager.triggerApiLifeCycleEvent({
      event: 'afterInit',
      curPath: location,
    });
  }
  window.addEventListener('error', ev => {
    // 对错误'ResizeObserver loop limit exceeded',先放弃打点，因为此错误是安全的。todo：添加错误合并，延迟打点策略
    if (ev.message.toLowerCase() === 'resizeobserver loop limit exceeded') {
      // console.log('window_error_caught: resizeobserver loop limit exceeded');
      return;
    }
    trackerApi.track('window_error_caught', { pos: ev.filename + ' ' + ev.lineno + ',' + ev.colno }, true);
    loggerApi.track('window_error_caught', {
      error: ev.error,
      msg: ev.message,
      pos: ev.filename + ' ' + ev.lineno + ',' + ev.colno,
    });
  });
  window.addEventListener('load', ev => {
    console.log('loadend called', ev);
    window.apiManager.triggerApiLifeCycleEvent({
      event: 'afterLoadFinish',
      curPath: location,
      evData: ev,
    });
    if (!systemApi.isMainPage()) {
      systemApi.switchLoading(false);
    }
    logPagePerformanceToServer();
    window.performance.clearResourceTimings();
    window.performance.clearMeasures();
    window.performance.clearMarks();
  });
  window.addEventListener('blur', ev => {
    console.log('lost focus called', ev);
    window.apiManager.triggerApiLifeCycleEvent({
      event: 'onBlur',
      curPath: location,
      evData: ev,
    });
  });
  window.addEventListener('focus', ev => {
    console.log('lost focus called', ev);
    addGlobalRouterHandler(systemApi, eventApi);
    window.apiManager.triggerApiLifeCycleEvent({
      event: 'onFocus',
      curPath: location,
      evData: ev,
    });
  });

  isClientEntryInited = true;
}

export const onClientEntry = () => {
  if (window.featureSupportInfo.supportNativeProxy) {
    handleOnClientEntry();
  }
};

if (!window.featureSupportInfo.supportNativeProxy) {
  handleOnClientEntry();
}
