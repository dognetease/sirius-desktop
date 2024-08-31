/**
 * 问题：某些请求只有最后一次才有意义，如果先发请求后返回，会造成时序bug
 * 功能：对请求或异步操作进行包装，新发出的操作会取消前一个Padding状态的Promise，保证按序返回
 * 注意：被包装的异步操作必须返回一个promise，该promsise不应该then或者catch，
 * 因为取消只是对包装状态进行修改，原promise状态依旧改变，对原Promise的then等操作任然会带来时序问题
 */
/**
 * eg：
 *  //只使用一次的情况
 *  //在fn组件中使用切记使用useMemo
 *  const doSomething = useCallback(getUniqAsync(MailApi.doListMailBoxEntities.bind(MailApi))),[])
 *  //开始操作，
 *  doSomething(xxx,xxx,xxx).then(xxx).catch(xxx)
 *  //再次触发-上一个请求被reject掉，确保返回的数据为最后一次调用
 *  doSomething(xxx,xxx,xxx).then(xxx).catch(xxx)
 */
/**
 * eg;
 *  //多个操作共享一个时序队列的情况
 *  //获取包装函数，经过统一个包装函数包装的异步操作，将有序取消，按序执行
 *  const fnUniqWarp = useCallback(getUniqAsync(),[])
 *  //在fn组件中使用切记使用useMemo
 *  const doSomething = useCallback(fnUniqWarp(MailApi.doListMailBoxEntities.bind(MailApi))),[])
 *  const eat = useCallback(fnUniqWarp(eat),[])
 *  eat(xxx)
 *  doListMailBoxEntities(xxx)
 *  eat(xxx)
 *  doListMailBoxEntities(xxx)
 *  eat(xxx)
 *  doListMailBoxEntities(xxx)
 *  //多个请求相互取消，只有最新的调用会成功
 */
import { apis, apiHolder as api, PerformanceApi } from 'api';
const performance = api.api.requireLogicalApi(apis.performanceImpl) as PerformanceApi;
interface UserCallback {
  (...args: any): Promise<any>;
}
interface PromiseAbort {
  (tip?: string): void;
}
import { ERROR_REQUEST_CANCLE } from '@web-mail/common/constant';
import { getIn18Text } from 'api';
export { ERROR_REQUEST_CANCLE } from '@web-mail/common/constant';
const debounceRequestTimeout = 40000;
// 用于邮件列表的请求包装，包含超时打点。其他业务请使用debounceReqesut
export const debounceMailListRequest = (fn?: UserCallback, globalConfig?: string) => {
  let userPromise: Promise<any> | null = null;
  let promiseAbort: PromiseAbort | null = null;
  let startTime: number | null = 0;
  // 超时定时器
  let requestTimer: number | null = null;
  const getCallback =
    (callback: UserCallback, config?: string) =>
    (...params: any) => {
      if (userPromise && promiseAbort) {
        promiseAbort(ERROR_REQUEST_CANCLE);
      }
      const res = callback(...params);
      if (requestTimer) {
        clearTimeout(requestTimer);
        requestTimer = null;
      }
      startTime = new Date().getTime();
      requestTimer = setTimeout(() => {
        // 打点上报
        try {
          const reqParams = params && params.length ? params[0] : {};
          performance.point({
            statKey: 'mail_list_load_timeout',
            statSubKey: config || '',
            params: reqParams,
            value: debounceRequestTimeout,
            valueType: 1,
          });
        } catch (e) {
          console.error(e);
        }
        // 清除状态
        requestTimer = null;
        startTime = null;
      }, debounceRequestTimeout);
      if (res instanceof Promise) {
        const warpPromise = Promise.race([
          res,
          new Promise((resolve, reject) => {
            promiseAbort = reject;
          }),
        ])
          .then(res => {
            // 列表加载成功打点
            try {
              const reqParams = params && params.length ? params[0] : {};
              if (startTime) {
                const time = new Date().getTime() - startTime;
                performance.point({
                  statKey: 'mail_list_request_load_time',
                  statSubKey: config || '',
                  params: reqParams,
                  value: time,
                  valueType: 1,
                });
              }
            } catch (e) {
              console.error(e);
            }
            if (requestTimer) {
              clearTimeout(requestTimer);
              requestTimer = null;
            }
            startTime = null;
            return res;
          })
          .catch(err => {
            if (requestTimer && err !== ERROR_REQUEST_CANCLE) {
              clearTimeout(requestTimer);
              requestTimer = null;
              startTime = null;
            }
            throw err;
          });
        userPromise = res;
        return warpPromise;
      }
      throw new Error(getIn18Text('HANSHUBIXUFAN'));
    };
  if (fn) {
    return getCallback(fn, globalConfig);
  }
  return (callback: UserCallback, config?: any) => getCallback(callback, config);
};
export const debounceRequest = (fn?: UserCallback) => {
  let userPromise: Promise<any> | null = null;
  let promiseAbort: PromiseAbort | null = null;
  const getCallback =
    (callback: UserCallback) =>
    (...params: any) => {
      if (userPromise && promiseAbort) {
        promiseAbort(ERROR_REQUEST_CANCLE);
      }
      const res = callback(...params);
      if (res instanceof Promise) {
        const warpPromise = Promise.race([
          res,
          new Promise((resolve, reject) => {
            promiseAbort = reject;
          }),
        ]);
        userPromise = res;
        return warpPromise;
      }
      throw new Error(getIn18Text('HANSHUBIXUFAN'));
    };
  if (fn) {
    return getCallback(fn);
  }
  return (callback: UserCallback) => getCallback(callback);
};
/**
 * 功能：对请求或异步操作进行包装，新发出的操作会根据用户传入的函数决定是否取消当前队列中所有Padding状态的Promise。
 * 1.保证请求按序到达，后发先至则会在队列中等待
 * 2.如果取消则会取消当前队列中的所有任务
 * 3.支持重试，支持设置间隔。防止队列头部失败导致的阻塞失败
 * 注意：被包装的异步操作必须返回一个promise，该promsise不应该then或者catch，因为取消只是对包装状态进行修改
 * 原promise状态依旧改变，对原Promise的then等操作任然会带来时序问题
 */
/**
 * eg：
 *  //只使用一次的情况
 *  //在fn组件中使用切记使用useMemo
 *  const doSomething = useCallback(getCustomUniqAsync(MailApi.doListMailBoxEntities.bind(MailApi),{
 *    //reqParamsList:队列中所有请求的参数列表
 *    //curParams: 当前请求的参数
 *    canAbort:(reqParamsList,curParams)=>{
 *      if(curParams.index==0)return true
 *    },
 *    retryNums:1,
 *    retryInterval:1000
 * })),[])
 *  //开始操作，
 *  doSomething(xxx,xxx,xxx).then(xxx).catch(xxx)
 *  doSomething(xxx,xxx,xxx).then(xxx).catch(xxx)
 *  doSomething(xxx,xxx,xxx).then(xxx).catch(xxx)
 *  //前三次请求均成功，按照请求顺序依次成功
 *  //当参数变化，canAbort返回true的时候，队列清空，没返回的任务全部失败
 *  doSomething(xxx,xxx,xxx).then(xxx).catch(xxx)
 */
/**
 * eg;
 *  //多个操作共享一个时序队列的情况
 *  //获取包装函数，经过统一个包装函数包装的异步操作，将有序取消，按序执行
 *  const fnUniqWarp = useCallback(getCustomUniqAsync(),[])
 *  //在fn组件中使用切记使用useMemo
 *  //config可以在全局初始化的时候设置，也可以针对不同的请求设置不同的canAbort
 *  const doSomething = useCallback(fnUniqWarp(MailApi.doListMailBoxEntities.bind(MailApi),
 *  (reqParamsList,curParams)=>{
 *      if(curParams.index==0)return true
 *    })),[]) as WarpFN
 *  const eat = useCallback(fnUniqWarp(eat),[])
 *  eat(xxx)
 *  doListMailBoxEntities(xxx)
 *  eat(xxx)
 *  doListMailBoxEntities(xxx)
 *  eat(xxx)
 *  doListMailBoxEntities(xxx)
 *  //多个请求相互取消，只有最新的调用会成功
 */
type FnCanAbort = (paramList: any[], param: any[]) => boolean;
type UserCallBack = (...args: any) => Promise<any>;
type PromiseFN = (...args: any) => any;
type RetryFN = (customFn: UserCallBack, resolve: PromiseFN, reject: PromiseFN, sum: number) => void;
type Task = {
  success: (...args: any) => void;
  abort: (...args: any) => void;
  id: number;
  customSuccess: boolean;
  reqParams?: any;
};
interface GetCallback {
  (callback: UserCallBack, _canAbort?: FnCanAbort): UserCallBack;
}
interface Config {
  // 全局是否可取消
  canAbort?: FnCanAbort;
  // 重试次数
  retryNums?: number;
  // 重试间隔
  retryInterval?: number;
}
export interface WarpFN {
  (callback: UserCallBack, userCanAbort?: FnCanAbort | undefined): UserCallBack;
}
export const debouceRequestByRule = (fn?: UserCallBack | null, config?: Config): WarpFN | UserCallBack => {
  const { canAbort = () => true, retryNums = 0, retryInterval = 0 } = config ?? {};
  let taskList: Task[] = [];
  // 有序触发
  const queueActiveOper = (taskId: number) => {
    const task = taskList.find((item: Task) => item.id === taskId);
    const head = taskList[0];
    if (task && head) {
      task.customSuccess = true;
      // 判断是否是队列头
      if (taskId === head.id) {
        let curTask = taskList.shift();
        while (curTask) {
          curTask.success();
          if (taskList.length && taskList[0].customSuccess) {
            curTask = taskList.shift();
          } else {
            break;
          }
        }
      }
    }
  };
  // 中途失败，后续全部取消
  const queueFailOper = (taskId: number, e: any) => {
    let status = false;
    let posi = taskList.length;
    if (taskList.find(item => item.id === taskId)) {
      taskList.forEach((item, index) => {
        if (taskId === item.id) {
          posi = index;
        }
        if (taskId === item.id || status) {
          status = true;
          item.abort(e);
        }
      });
      taskList = taskList.slice(0, posi);
    }
  };
  // 失败重试
  const retry: RetryFN = (callback: UserCallBack, r, j, sum) => {
    callback()
      .then(res => {
        r(res);
      })
      .catch(e => {
        if (sum > 0) {
          // 间隔1s重试
          setTimeout(() => {
            retry(callback, r, j, sum - 1);
          }, retryInterval);
        } else {
          j(e);
        }
      });
  };
  const getCallback: GetCallback =
    (callback, _canAbort) =>
    (...params: any) => {
      const logicCanAbort = _canAbort || canAbort;
      if (
        logicCanAbort(
          taskList.map(item => item.reqParams),
          params
        )
      ) {
        // 清空任务队列
        if (taskList && taskList.length) {
          while (taskList.length > 0) {
            const task: Task = taskList.shift() as Task;
            task.abort(ERROR_REQUEST_CANCLE);
          }
        }
      }
      const taskId = new Date().getTime();
      // 当前任务加入队列
      const helper = new Promise((r, j) => {
        taskList.push({
          success: r,
          abort: j,
          id: taskId,
          customSuccess: false,
          reqParams: params,
        });
      });
      // 对用户请求进行包装，失败重试
      const customPromise = new Promise((r, j) => {
        retry(() => callback(...params), r, j, retryNums);
      });
      if (customPromise instanceof Promise) {
        customPromise.then(res => {
          queueActiveOper(taskId);
          return res;
        });
        const warpPromise = new Promise((r, j) => {
          Promise.all([helper, customPromise])
            .then(res => r(res[1]))
            .catch(e => {
              j(e);
              queueFailOper(taskId, e);
            });
        });
        return warpPromise;
      }
      throw new Error(getIn18Text('HANSHUBIXUFAN'));
    };
  if (fn) {
    return getCallback(fn);
  }
  const warpFn: WarpFN = (callback: UserCallBack, userCanAbort?: FnCanAbort) => getCallback(callback, userCanAbort);
  return warpFn;
};
export default debounceRequest;
