import { useState, useEffect, useCallback } from 'react';

import { eventApi, customerDiscoveryApi } from '../api';
import { RegularCustomerMenuData } from 'api';

/**
 * 往来邮件菜单栏红点
 */
export const useRegularCustomerMenuData = () => {
  const [regularMenuData, setRegularMenuData] = useState<RegularCustomerMenuData>();

  const getRegularCustomerMenuData = useCallback(async () => {
    const res = await customerDiscoveryApi.getRegularCustomerMenuData();
    setRegularMenuData(preState => ({ ...preState, ...res }));
  }, []);
  useEffect(() => {
    getRegularCustomerMenuData();
    const id = eventApi.registerSysEventObserver('regularCustomerMenuUpdate', {
      func: event => {
        const { eventData = {} } = event;
        setRegularMenuData(preState => ({ ...preState, ...eventData }));
      },
    });
    return () => {
      eventApi.unregisterSysEventObserver('regularCustomerMenuUpdate', id);
    };
  }, []);
  return {
    regularMenuData,
  };
};
export const subscribeRegularCustomerMenuData = (cb: (data: any) => void) => {
  let currentData = {};
  let eventId: number | null;
  customerDiscoveryApi.getRegularCustomerMenuData().then(res => {
    currentData = res;
    cb(currentData);
    eventId = eventApi.registerSysEventObserver('regularCustomerMenuUpdate', {
      func: event => {
        const { eventData = {} } = event;
        currentData = { ...currentData, ...eventData };
        cb(currentData);
      },
    });
  });
  return () => {
    if (typeof eventId === 'number') {
      eventApi.unregisterSysEventObserver('regularCustomerMenuUpdate', eventId);
    }
  };
};
