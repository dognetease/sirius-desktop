import React, { createContext, useReducer } from 'react';
import { initState, reduce, TeamInfo } from './teamsettingVisibleReduce';

export const Context = createContext(
  {} as {
    state: TeamInfo;
    dispatch: React.Dispatch<any>;
  }
);

export const Provider: React.FC<any> = props => {
  const [state, dispatch] = useReducer(reduce, initState);
  return <Context.Provider value={{ state, dispatch }}>{props.children}</Context.Provider>;
};
