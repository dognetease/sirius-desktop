import { createContext } from 'react';
import { InitState, initState, UseInitStateReturnType } from './useInitState';

export interface InitContextValue extends InitState {
  dispatch: UseInitStateReturnType['dispatch'] | null;
}

export const initContextValue: InitContextValue = {
  ...initState,
  dispatch: null,
};

export const VirtualTableContext = createContext(initContextValue);
