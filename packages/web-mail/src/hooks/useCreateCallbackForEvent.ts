/*
 * 功能：将内部方法包装之后，传递给window的监听器，实现被包装函数中可以访问state中最新的值
 * 返回的方法会保持引用的稳定性
 */
import { useRef, useCallback } from 'react';

const useCreateCallbackForEvent = <T extends (...args: any[]) => any>(callback?: T): T => {
  const refCallback = useRef<T | undefined>(callback);
  refCallback.current = callback;
  const eventCallback = useCallback((...args: Parameters<T>) => refCallback.current && refCallback.current(...args), []);
  return eventCallback as T;
};

export default useCreateCallbackForEvent;
