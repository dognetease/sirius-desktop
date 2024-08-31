import React, { useReducer } from 'react';
import { ForwarderContext, forwarderReducer, initState } from './forwarder';

export default (props: { children: React.ReactNode }) => {
  const value = useReducer(forwarderReducer, initState);
  return <ForwarderContext.Provider value={value}>{props.children}</ForwarderContext.Provider>;
};
