import React, { createContext, useReducer } from 'react';
import { initState, reduce } from './currentTeamReduce';

const Context = createContext({});

const Provider: React.FC<any> = props => {
  const [state, dispatch] = useReducer(reduce, initState);
  return <Context.Provider value={{ state, dispatch }}>{props.children}</Context.Provider>;
};
export default { Context, Provider };
