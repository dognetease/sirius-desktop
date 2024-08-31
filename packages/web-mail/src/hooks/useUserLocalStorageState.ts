/*
 * 功能：将状态存储在分用户的loaclStorage中的hook。
 * 仅支持简单类型的序列化，复杂类型的暂无需求
 */
import { useState, useEffect, Dispatch, SetStateAction, useRef } from 'react';
import { apiHolder as api } from 'api';
const storageApi = api.api.getDataStoreApi();

// 从localStoreage获取状态
export const getStateFromLocalStorage = <T>(stateName: string): T | null => {
  try {
    const serializedState = storageApi.getSync(stateName)?.data;
    if (serializedState) {
      return JSON.parse(serializedState) as T;
    }
    return null;
  } catch (err) {
    console.error(`[ Hook Error useUserLocalStorageState ]Error getting state ${stateName} from localStorage:`, err);
    return null;
  }
};

const useUserLocalStorageState = <T>(stateName: string, initialState: T): [T | null, Dispatch<SetStateAction<T | null>>] => {
  const [state, setState] = useState<T | null>(() => {
    let localState = getStateFromLocalStorage<T>(stateName);
    return localState != null ? localState : initialState;
  });
  const isInit = useRef(false);

  useEffect(() => {
    if (isInit.current) {
      try {
        const serializedState = JSON.stringify(state);
        storageApi.putSync(stateName, serializedState);
      } catch (err) {
        console.error(`Error setting state ${stateName} to localStorage: ${err}`);
      }
    }
    isInit.current = true;
  }, [state, stateName]);

  return [state, setState];
};

export default useUserLocalStorageState;
