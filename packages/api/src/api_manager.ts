// import debounce from 'lodash/debounce';
import { api, ApiPolicy } from './api/api';
// import implsList from './gen/impl_list';
import { StringTypedMap } from './api/commonModel';
import { Api, ApiLifeCycleApi, ApiLifeCycleEvent } from './api/_base/api';

class DefaultApiPolicy implements ApiPolicy {
  called: Set<ApiLifeCycleApi> = new Set<ApiLifeCycleApi>();

  target: string;

  constructor(target: string) {
    this.target = target;
  }

  exclude() {
    return false;
  }

  canRecall() {
    return true;
  }
}

export class ApiManager {
  impls: string[];

  apiPolicies: StringTypedMap<ApiPolicy>;

  constructor(impls: string[]) {
    this.impls = impls;
    this.apiPolicies = {};
    // for (const i of implsList)
    this.impls.forEach(i => {
      const logicalApi: Api = api.requireLogicalApi(i);
      this.registerApiPolicy(new DefaultApiPolicy(i));
      if (!logicalApi) {
        console.warn('[api] ' + i + ' has a impl of undefined');
      } else {
        console.log('[api] ' + i + ' installed  ');
      }
    });
  }

  registerApiPolicy(policy: ApiPolicy) {
    if (!policy || !policy.target) {
      return;
    }
    if (!this.apiPolicies[policy.target]) {
      this.apiPolicies[policy.target] = policy;
    } else {
      const origin = this.apiPolicies[policy.target];
      this.apiPolicies[policy.target] = { ...origin, ...policy };
    }
  }

  // registerImApi() {
  //   const imApi = new NIMImplApi();
  //   api.registerLogicalApi(imApi);
  //   imApi.init();
  // }
  //
  // unregisterIMApi() {
  //   api.unregisterLogicalApi(apis.imApiImpl);
  // }

  judgeCall(apiPolicy: undefined | ApiPolicy, type: ApiLifeCycleApi, ev?: ApiLifeCycleEvent) {
    if (!apiPolicy) {
      return true;
    }
    const exclude = !ev?.ignorePath && !!apiPolicy.exclude && apiPolicy.exclude(type, ev);
    const recall = !!apiPolicy.canRecall && apiPolicy.canRecall(type, ev);
    const called = apiPolicy.called.has(type);
    const b = !exclude && (recall || !called);
    if (type !== 'onBlur' && type !== 'onFocus') {
      console.log('[api] test policy for  ' + apiPolicy.target + '.' + type + ' ' + location.href + ' result :' + b, { exclude, recall, called });
    }
    return b;
  }

  // triggerApiLifeCycleEvent(ev?: ApiLifeCycleEvent) {
  //   debounce(this.triggerApiLifeCycleEventInternal, 700, { maxWait: 1000, leading: true, trailing: false }).apply(this, [ev]);
  // }

  triggerApiLifeCycleEvent(ev?: ApiLifeCycleEvent) {
    if (!ev || !ev.event) {
      return;
    }
    const type = ev.event;
    if (type !== 'onBlur' && type !== 'onFocus') {
      console.log('[api] trigger api life cycle: ' + type);
    }
    // for (const i of this.impls)
    this.impls.forEach(i => {
      const logicalApi: Api = api.requireLogicalApi(i);
      let apiPolicy: ApiPolicy | undefined;
      if (this.apiPolicies && i in this.apiPolicies) {
        apiPolicy = this.apiPolicies[i];
      }
      const needCall: boolean = this.judgeCall(apiPolicy, type, ev);
      if (needCall && logicalApi) {
        // const element = (
        //   logicalApi[type as keyof Api] as Function
        // ).bind(logicalApi);
        try {
          logicalApi[type as keyof Api] &&
            typeof logicalApi[type as keyof Api] === 'function' &&
            // eslint-disable-next-line @typescript-eslint/ban-types
            (logicalApi[type as keyof Api]! as Function).apply(logicalApi, [ev]);
        } catch (ex) {
          console.warn('[api] error occured when call api lifecycle function ' + type + ' for ' + i, ex);
        }
        if (apiPolicy && apiPolicy.called) {
          apiPolicy.called.add(type);
        }
      } else if (type !== 'onBlur' && type !== 'onFocus') {
        console.log('[api] ignore call api ' + i + ' for function ' + type);
      }
      if (!logicalApi) {
        console.warn('[api] ' + i + ' has a impl of undefined');
      }
      // else
      //   console.log(i + ' installed and call ' + type);
    });
    this.triggerRelatedApi(ev);
  }

  private triggerRelatedApi(ev: ApiLifeCycleEvent) {
    if (ev.event === 'afterLogin') {
      const initEv = {
        ...ev,
        ...({
          event: 'init',
          ignorePath: true,
        } as Partial<ApiLifeCycleEvent>),
      };
      this.triggerApiLifeCycleEvent(initEv);
      const afterInitEv = {
        ...ev,
        ...{
          event: 'afterInit',
          ignorePath: true,
        },
      };
      this.triggerApiLifeCycleEvent(afterInitEv);
      const afterLoadFinishEv = {
        ...ev,
        ...{
          event: 'afterLoadFinish',
          ignorePath: true,
        },
      };
      this.triggerApiLifeCycleEvent(afterLoadFinishEv);
    }
  }
}

// function judgeCall(apiPolicy: undefined | ApiPolicy, type: ApiLifeCycleApi) {
//   if (!apiPolicy) return true;
//   const exclude = apiPolicy.exclude && apiPolicy.exclude(type);
//   const recall = apiPolicy.canRecall && apiPolicy.canRecall(type);
//   const called = apiPolicy.called.has(type);
//   return !exclude && (recall || !called);
// }
//
// export const triggerApiLifeCycleEvent = (
//     apiPolicies: StringTypedMap<ApiPolicy>, type: ApiLifeCycleApi) => {
//   for (let i of implsList) {
//     const logicalApi: Api = api.requireLogicalApi(i);
//     let apiPolicy: ApiPolicy | undefined = undefined;
//     if (apiPolicies && i in apiPolicies) {
//       apiPolicy = apiPolicies[i];
//     }
//     let needCall: boolean = judgeCall(apiPolicy, type);
//     // if (!apiPolicy || !apiPolicy.exclude(type)) {
//     if (needCall && logicalApi && logicalApi[type as keyof Api]
//         && typeof logicalApi[type as keyof Api] === "function") {
//       const element = (logicalApi[type as keyof Api] as Function).bind(logicalApi);
//       const s = element();
//       console.log("call after init for " + s + " " + type);
//       if (apiPolicy) {
//         apiPolicy.called.add(type);
//       }
//
//       // }
//     }
//     if (!logicalApi)
//       console.warn(i + " has a impl of undefined");
//     else
//       console.log(i + " installed and call " + type);
//   }
// };
