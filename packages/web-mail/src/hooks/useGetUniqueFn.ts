/**
 * 返回第一个参数方法的包装版本
 * 在依赖变化的时候，包装方法的执行不会执行参数中的方法，只会空执行。
 * 其主要用于，解决某些情况下，业务请求加载之后，组件已经切换，但请求还没回来的情况出现
 * 老数据设置到新组件的错误情况。
 *
 * 限制： 返回的包装函数，必须在useCallback或者useMemo的依赖中。不可转换为ref进行依赖穿透。
 * 这是因为函数调用的成功与否，由函数生成的先后顺序决定。只有最新生成的函数可以调用成功。以前生成的函数则调用无效。
 * ref会导致执行的永远是最新的函数。
 */

/**
 * 使用例子
 * 场景: 读信页邮件提醒
 */

// const riskReminderStatusChange = useGetUniqueFn((res)=>{
//   setRiskReminderOpen([0, 2].includes(res));
// },[content?.id]);

//   // 获取提醒设置开关
//   useEffect(() => {
//     if (isCorpMail) return;
//     setCurrentAccount();
//     /**
//      * 对请求进行唯一性包装可以解决一部分问题，但是对于非关键业务逻辑，请求并不总是发出。
//      * 依靠请求的前后顺序来保证请求的唯一性并不是什么靠谱的事情。
//      * 所以对请求的处理函数进行处理。无效的请求处理直接转空调用。
//      *
//      */
//     mailManagerApi.getRiskReminderStatus().then((res: any) => {
//       riskReminderStatusChange(res);
//     });
//     getRefuselist();
//   }, [content?.id, riskReminderStatusChange]);

import { useRef, useMemo, useEffect } from 'react';
import useCreateCallbackForEvent from './useCreateCallbackForEvent';

const useGetUniqueFn = <T>(fn: T, deps: ReadonlyArray<any>): T => {
  const callBack = useCreateCallbackForEvent(fn);
  const idRef = useRef<number>(0);

  /**
   * 在组件卸载的时候，将方法置空，防止空调用。
   */
  useEffect(() => {
    return () => {
      idRef.current = idRef.current + 1;
    };
  }, []);

  const res = useMemo(() => {
    idRef.current = idRef.current + 1;
    const id = idRef.current;
    return (...res) => {
      if (id === idRef.current) {
        return callBack(...res);
      } else {
        console.log('useGetUniqueFn: Empty call');
      }
    };
  }, deps);

  return res as T;
};

export default useGetUniqueFn;
