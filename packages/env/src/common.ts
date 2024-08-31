import qs from 'querystring';

// function getLocationHash() {
//   return  window && window.location.hash.substring(1);
// }

// page default Match
const routeMap: Record<string, string> = {
  '#edm': '#intelliMarketing?page=index',
  '#customer': '#wm?page=customer',
  '#customsData': '#wmData?page=customs',
  '#globalSearch': '#wmData?page=globalSearch',
  '#worktable': '#worktable?page=worktable',
  '#enterpriseSetting': '#enterpriseSetting?page=fieldSetting',
  '#sns': '#intelliMarketing?page=whatsAppJob',
  '#rbac': '',

  '#mailbox': '#mailbox?page=mailbox',
  '#message': '#coop?page=message',
  '#schedule': '#coop?page=schedule',
  '#disk': '#coop?page=disk',
  '#contact': '#coop?page=lxContact',
  '#setting': '#setting',
  '#apps': '#coop?page=apps',
  '#systemTask': '#systemTask?page=systemTask',
  '#noviceTask': '#noviceTask?page=noviceTask',
};

// hash category match
const hashMap: Record<string, string> = {
  '#edm': '#intelliMarketing',
  '#customer': '#wm',
  '#customsData': '#wmData',
  '#globalSearch': '#wmData',
  '#worktable': '#worktable',
  '#sns': '#intelliMarketing',
  '#enterpriseSetting': '#enterpriseSetting',
  '#rbac': '#enterpriseSetting',

  '#mailbox': '#mailbox',
  '#message': '#coop',
  '#schedule': '#coop',
  '#disk': '#coop',
  '#contact': '#coop',
  '#setting': '#setting',
  '#systemTask': '#systemTask',
  '#noviceTask': '#noviceTask',
};

const initList = Object.keys(routeMap);

export const ruleEngine = (to: string, state: any) => {
  if (to.substring(0, 2) === '/#') {
    to = to.substring(1);
  }

  const category = to.split('?')[0];
  const paramsRaw = to.split('?')[1];
  const params = qs.parse(paramsRaw);
  const page = params.page as string;

  let toAfter = '';

  // 1. call init functions
  if (initList.includes(to)) {
  }

  // 2.  rewrite to path
  // 2.1 page exists, hash should change
  if (routeMap.hasOwnProperty(category) && page) {
    toAfter = hashMap[category] + (paramsRaw ? '?' + paramsRaw : '');
  }

  // 2.2 page not exists, page should accomplish
  if (routeMap.hasOwnProperty(category) && !page) {
    toAfter = routeMap[category] + (paramsRaw ? '&' + paramsRaw : '');
  }
  // 此处setting映射规则需要整理，目前只是兼容快捷设置中的setting
  if (category === '#setting' && state && state?.currentTab === 'mail') {
    toAfter = '#personal?page=emailSetting';
  }

  return toAfter;
};

// cannot save origin history cause ssr env not supported and unclosable
let hasReg = false;

export function registerRouterInterceptor() {
  if (!window) {
    return;
  }

  if (hasReg) {
    return;
  }

  window.history.pushState = new Proxy(window.history.pushState, {
    apply: (target, thisArg, argArray) => {
      // trigger here what you need
      const state = argArray[0];
      let to = argArray[2] as string;
      to = ruleEngine(to, state) || to;

      return target.call(thisArg, state, '', to);
    },
  });

  hasReg = true;
}

// const snsInit = [
//   'page=whatsApp',
//   ''
// ]

export * from './desktop_router_rewrite';
export * from './desktop_router_rewrite_v2';
