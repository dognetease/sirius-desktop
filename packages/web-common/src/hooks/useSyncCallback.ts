import { useCallback, useEffect, useState } from 'react';

/** 在函数中获取 useState 最新值 */
export const useSyncCallback = (callback: any) => {
  const [proxyState, setProxyState] = useState({ current: false });
  const [params, setParams] = useState([]);

  const Func = useCallback(
    (...args: any) => {
      setParams(args);
      setProxyState({ current: true });
    },
    [proxyState]
  );

  useEffect(() => {
    if (proxyState.current === true) setProxyState({ current: false });
  }, [proxyState]);

  useEffect(() => {
    proxyState.current && callback(...params);
  });
  return Func;
};
