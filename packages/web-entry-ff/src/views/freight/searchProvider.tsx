import React, { createContext, useReducer } from 'react';
import { Moment } from 'moment';

interface SearchState {
  expireFreight: boolean;
  sailingDate: [Moment, Moment];
  searchCarrierList: string[];
  sort: string;
  priceSortField: string;
  departurePortCode: string;
  destinationPortCode: string;
}

interface State {
  searchState: SearchState;
  isInit: boolean;
}

interface SearchAction {
  type: Action;
  payload: Partial<State> | Partial<SearchState>;
}

export enum Action {
  UpdateSearch = 'UpdateSearch',
  UpdateState = 'UpdateState',
}

export const SearchContext = createContext<State>({} as State);
export const SearchDispatchContext = createContext<React.Dispatch<SearchAction>>({} as React.Dispatch<SearchAction>);

const searchReducer = function (state: State, action: SearchAction) {
  switch (action.type) {
    case Action.UpdateSearch:
      return { ...state, searchState: { ...state.searchState, ...action.payload } };
    case Action.UpdateState:
      return { ...state, ...action.payload };
  }
  return state;
};

export const SearchProvider: React.FC<{ children: React.ReactNode }> = props => {
  const initState = {
    searchState: {
      expireFreight: false,
      sailingDate: [] as unknown as [Moment, Moment],
      searchCarrierList: [],
      sort: 'price',
      priceSortField: 'price20GP',
      departurePortCode: '',
      destinationPortCode: '',
    },
    isInit: true,
  };

  const [searchState, dispatch] = useReducer(searchReducer, initState);

  return (
    <SearchContext.Provider value={searchState}>
      <SearchDispatchContext.Provider value={dispatch}>{props.children}</SearchDispatchContext.Provider>
    </SearchContext.Provider>
  );
};
