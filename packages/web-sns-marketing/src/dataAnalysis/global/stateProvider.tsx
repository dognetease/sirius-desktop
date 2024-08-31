import React, { createContext, useReducer } from 'react';
import { getRangeMap } from '../components/rangePicker';

export interface State {
  platform: string;
  endTime: string;
  startTime: string;
  accountId: string;
  accountType: string;
  authorizeType: string;
  sortField?: string;
}

interface StateAction {
  type: Action;
  payload: Partial<State>;
}

export enum Action {
  UpdateState = 'UpdateState',
}

export const StateContext = createContext<State>({} as State);
export const StateDispatchContext = createContext<React.Dispatch<StateAction>>({} as React.Dispatch<StateAction>);

const stateReducer = function (state: State, action: StateAction) {
  switch (action.type) {
    case Action.UpdateState:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export const StateProvider: React.FC<{ children: React.ReactNode }> = props => {
  const rangeMap = getRangeMap();
  const initState = {
    platform: '',
    endTime: rangeMap.month[1],
    startTime: rangeMap.month[0],
    accountId: '',
    accountType: '',
    authorizeType: '',
  };

  const [searchState, dispatch] = useReducer(stateReducer, initState);

  return (
    <StateContext.Provider value={searchState}>
      <StateDispatchContext.Provider value={dispatch}>{props.children}</StateDispatchContext.Provider>
    </StateContext.Provider>
  );
};
