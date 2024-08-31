/**
 * 功能十分复杂，仅为某个版本解决邮件列表加载问题定制，其他场景酌情使用
 */
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
 *  const doSomething = getCustomUniqAsync(MailApi.doListMailBoxEntities.bind(MailApi),{
 *    //reqParamsList:队列中所有请求的参数列表
 *    //curParams: 当前请求的参数
 *    canAbort:(reqParamsList,curParams)=>{
 *      if(curParams.index==0)return true
 *    },
 *    retryNums:1,
 *    retryInterval:1000
 * }))
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
 *  const fnUniqWarp = getCustomUniqAsync()
 *  //在fn组件中使用切记使用useMemo
 *  //config可以在全局初始化的时候设置，也可以针对不同的请求设置不同的canAbort
 *  const doSomething = fnUniqWarp(MailApi.doListMailBoxEntities.bind(MailApi),
 *  (reqParamsList,curParams)=>{
 *      if(curParams.index==0)return true
 *    }))
 *  const eat =fnUniqWarp(eat)
 *  eat(xxx)
 *  doListMailBoxEntities(xxx)
 *  eat(xxx)
 *  doListMailBoxEntities(xxx)
 *  eat(xxx)
 *  doListMailBoxEntities(xxx)
 *  //多个请求相互取消，只有最新的调用会成功
 */

import { useState, useEffect, useRef } from 'react';

type FnCanAbort = (...args: any) => boolean;
type Fn = (...args: any) => Promise<any>;
type PromiseFN = (...args: any) => any;
type RetryFN = (customFn: Fn, resolve: PromiseFN, reject: PromiseFN, sum: number) => void;
type Task = {
  success: (...args: any) => void;
  abort: (...args: any) => void;
  id: number;
  customSuccess: boolean;
  reqParams?: any;
};

const useGetMailListUniqReqWrap = (fn?: Fn | null, canAbort: FnCanAbort = (...args: any) => true) => {
  const promiseAbort = useRef<(tip: string) => void>();
  const taskList = useRef<Task[]>([]);

  // 有序触发
  const queueActiveOper = (taskId: number) => {
    const task = taskList.current.find(item => item.id == taskId);
    const head = taskList.current[0];
    if (task && head) {
      task.customSuccess = true;
      // 判断是否是队列头
      if (taskId == head.id) {
        let task = taskList.current.shift();
        while (task) {
          task.success();
          if (taskList.current.length && taskList.current[0].customSuccess) {
            task = taskList.current.shift();
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
    let posi = taskList.current.length;
    if (taskList.current.find(item => item.id == taskId)) {
      taskList.current.forEach((item, index) => {
        if (taskId == item.id) {
          posi = index;
        }
        if (taskId == item.id || status) {
          status = true;
          item.abort(e);
        }
      });
      taskList.current = taskList.current.slice(0, posi);
    }
  };

  // 失败重试
  const retry: RetryFN = (fn, r, j, sum) => {
    fn()
      .then(res => {
        r(res);
      })
      .catch(e => {
        if (sum > 0) {
          // 间隔1s重试
          setTimeout(() => {
            retry(fn, r, j, --sum);
          }, 1000);
        } else {
          j(e);
        }
      });
  };

  const getCallback = function (fn, _canAbort?: FnCanAbort) {
    return function (...params: any) {
      const logicCanAbort = _canAbort || canAbort;
      if (
        logicCanAbort(
          taskList.current.map(item => item.reqParams),
          params
        )
      ) {
        // 清空任务队列
        if (taskList && taskList.current.length) {
          while (taskList.current.length > 0) {
            const task: Task = taskList.current.shift() as Task;
            task.abort('请求已被用户取消');
          }
        }
      }
      const taskId = new Date().getTime();
      // 当前任务加入队列
      const helper = new Promise((r, j) => {
        taskList.current.push({
          success: r,
          abort: j,
          id: taskId,
          customSuccess: false,
          reqParams: params,
        });
      });
      // 对用户请求进行包装，失败重试
      const customPromise = new Promise((r, j) => {
        retry(() => fn(...params), r, j, 1);
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
      throw '函数必须返回Promise';
    };
  };

  if (fn) {
    return getCallback(fn);
  }

  return (fn: (...args: any) => Promise<any>, userCanAbort?: FnCanAbort) => getCallback(fn, userCanAbort);
};

export default useGetMailListUniqReqWrap;
