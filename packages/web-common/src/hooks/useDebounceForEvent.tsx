/*
 * 功能：
 */
import { useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';

interface typeDebounceForEvent {
  (callback: (...arg: any) => any, time?: number, config?: object): (...args: any) => any;
}

const useDebounceForEvent: typeDebounceForEvent = (
  callback,
  time = 300,
  config = {
    leading: true,
  }
) => {
  const refCallback = useRef(callback);
  refCallback.current = callback;

  const eventCallback = useCallback(
    debounce((...args) => refCallback.current && refCallback.current(...args), time, config),
    []
  );

  return eventCallback;
};

export default useDebounceForEvent;
