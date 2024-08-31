import qs from 'querystring';

// function getLocationHash() {
//   return  window && window.location.hash.substring(1);
// }

// page default Match
const routeMap: Record<string, string> = {
  '#sns': '#edm?page=whatsAppJob',
};

// hash category match
const hashMap: Record<string, string> = {
  '#sns': '#edm',
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
  if (routeMap.hasOwnProperty(category) && page) {
    toAfter = hashMap[category] + (paramsRaw ? '?' + paramsRaw : '');
  }

  // 2.2 page not exists, page should accomplish

  return toAfter;
};

// cannot save origin history cause ssr env not supported and unclosable
export let map = new Map();

export function registerRouterInterceptorDesktop() {
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

// const snsInit = [
//   'page=whatsApp',
//   ''
// ]
