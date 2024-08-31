/**
 * 问题：某些请求只有最后一次才有意义，如果先发请求后返回，会造成时序bug
 * 功能：对请求或异步操作进行包装，新发出的操作会取消前一个Padding状态的Promise，保证按序返回
 * 注意：被包装的异步操作必须返回一个promise，该promsise不应该then或者catch，
 * 因为取消只是对包装状态进行修改，原promise状态依旧改变，对原Promise的then等操作任然会带来时序问题
 */
/**
 * eg：
 *  //只使用一次的情况
 *  const doListMailBoxEntities = useGetUniqReqWrap(MailApi.doListMailBoxEntities.bind(MailApi)) as ((...args: any) => Promise<any>)
 *  doListMailBoxEntities(xxx,xxx,xxx).then(xxx).catch(xxx)
 *  //多个操作共享一个时序队列的情况
 *  //获取包装函数，经过统一个包装函数包装的异步操作，将有序取消，按序执行
 *  const fnUniqWarp = useGetUniqReqWrap()
 *  const doListMailBoxEntities = fnUniqWarp(MailApi.doListMailBoxEntities.bind(MailApi)) as ((...args: any) => Promise<any>)
 *  const eat = fnUniqWarp(eat) as ((...args: any) => Promise<any>)
 *  eat(xxx)
 *  doListMailBoxEntities(xxx)
 *  eat(xxx)
 *  doListMailBoxEntities(xxx)
 *  eat(xxx)
 *  doListMailBoxEntities(xxx)
 *
 */
import { useRef, useCallback, useMemo } from 'react';
export interface userCallback {
  (...args: any): Promise<any>;
}

import { ERROR_REQUEST_CANCLE } from '@web-mail/common/constant';
import { getIn18Text } from 'api';
export { ERROR_REQUEST_CANCLE } from '@web-mail/common/constant';

const useGetUniqReqWrap = (fn?: userCallback) => {
  const promiseRef = useRef<Promise<any>>();
  const promiseAbort = useRef<(tip: string) => void>(null);

  const getCallback = useCallback(
    (callback: userCallback) =>
      (...params: any) => {
        if (promiseRef && promiseAbort.current) {
          promiseAbort && promiseAbort.current && promiseAbort.current(ERROR_REQUEST_CANCLE);
        }
        const res = callback(...params);
        if (res instanceof Promise) {
          const pr = promiseRef;
          const warpPromise = Promise.race([
            res,
            new Promise((resolve, reject) => {
              const pab = promiseAbort;
              pab.current = reject;
            }),
          ]);
          pr.current = res;
          return warpPromise.then(data => {
            const pab = promiseAbort;
            pab.current = null;
            return data;
          });
        }
        throw new Error(getIn18Text('HANSHUBIXUFAN'));
      },
    []
  );

  const fnRes = useMemo(() => {
    return fn ? getCallback(fn) : () => {};
  }, [fn]);

  const fnWrap = useMemo(() => {
    return (callback: userCallback) => getCallback(callback);
  }, []);

  if (fn) {
    return fnRes;
  }
  return fnWrap;
};
export default useGetUniqReqWrap;
