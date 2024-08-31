import React, { useReducer } from 'react';
import { TradeContext, tradeReducer, initState } from './tradeContext';

export default (props: { children: React.ReactNode }) => {
  const value = useReducer(tradeReducer, initState);
  return <TradeContext.Provider value={value}>{props.children}</TradeContext.Provider>;
};
