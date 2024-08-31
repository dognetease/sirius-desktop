import React, { useEffect } from 'react';
import { useAppSelector } from '@web-common/state/createStore';

export const useRegisterModuleDebug = (name: string, callback: () => void) => {
  const isDebug = useAppSelector(state => state.globalReducer.debugComponents[name]);
  useEffect(() => {
    if (isDebug) {
      console.error(`🚀🚀🚀 [useRegisterModuleDebug] ${name}模块已开启debug模式`);
      debugger;
      callback && callback();
    }
  }, [isDebug]);
};
