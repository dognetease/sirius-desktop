import { inWindow } from 'api';
import { useEffect, useState } from 'react';

/**
 * 服务端  enum ('NEW', 'OLD', 'NONE') 待确定
 *
 * @param key
 * @returns
 */
export function useVersionCheck(key: string = 'v1v2') {
  // v2显示新版，非v2显示旧版
  let initValue = 'v1';

  if (!inWindow()) {
    return initValue;
  }

  const [state, setState] = useState(() => {
    const value = localStorage.getItem(key);

    return value || initValue;
  });

  useEffect(() => {
    const listenStorageChange = () => {
      setState(() => {
        const value = localStorage.getItem(key);
        return value || initValue;
      });
    };
    window.addEventListener('v1v2', listenStorageChange);
    return () => window.removeEventListener('v1v2', listenStorageChange);
  }, []);

  return state;
}

export function setV1v2(value: string, key: string = 'v1v2') {
  window?.localStorage.setItem(key, value);
  window?.dispatchEvent(new Event('v1v2'));
}
