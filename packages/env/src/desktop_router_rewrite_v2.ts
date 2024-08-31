import qs from 'querystring';
import { map } from './desktop_router_rewrite';
// function getLocationHash() {
//   return  window && window.location.hash.substring(1);
// }

// page default Match
const routeMap: Record<string, string> = {
  '#intelliMarketing': '#edm?page=addressBookIndex',
  '#sns': '#edm?page=whatsAppJob',
  '#message': '#coop?page=message',
  '#schedule': '#coop?page=schedule',
  '#disk': '#coop?page=disk',
  '#contact': '#coop?page=contact',
};

// hash category match
const hashMap: Record<string, string> = {
  '#sns': '#edm',
  '#intelliMarketing': '#edm',
  '#message': '#coop',
  '#schedule': '#coop',
  '#disk': '#coop',
  '#contact': '#coop',
};

const initList = Object.keys(routeMap);

const ruleEngine = (to: string, state: any) => {
  console.log(state);
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
  if (routeMap.hasOwnProperty(category)) {
    if (page) {
      toAfter = hashMap[category] + (paramsRaw ? '?' + paramsRaw : '');
    } else {
      toAfter = routeMap[category] + (paramsRaw ? '&' + paramsRaw : '');
    }
  }

  // 2.2 page not exists, page should accomplish

  return toAfter;
};

export function registerRouterInterceptorDesktopV2() {
  if (!window) {
    return;
  }

  if (map.get('hasReg')) {
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

  map.set('hasReg', true);
}
