/*
 * 功能：
 */
import { useRef, useCallback } from 'react';
import throttle from 'lodash/throttle';

interface typeThrottleForEvent {
  (callback: (...arg: any) => any, time?: number, config?: object): (...args: any) => any;
}

const useThrottleForEvent: typeThrottleForEvent = (
  callback,
  time = 300,
  config = {
    leading: true,
  }
) => {
  const refCallback = useRef(callback);
  refCallback.current = callback;

  const eventCallback = useCallback(
    throttle((...args) => refCallback.current && refCallback.current(...args), time, config),
    []
  );

  return eventCallback;
};

export default useThrottleForEvent;
