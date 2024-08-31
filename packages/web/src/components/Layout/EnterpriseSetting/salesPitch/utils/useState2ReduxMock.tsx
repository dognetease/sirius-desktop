import { useCallback } from 'react';
import { shallowEqual } from 'react-redux';
import { SalesPitchActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { SalesPitchReducerState, SalesPitchReducerKeys } from '@web-common/state/reducer/salesPitchReducer/types';

const useState2ReduxMock = <T extends SalesPitchReducerKeys>(stateName: T, reducerName = '') => {
  const state = useAppSelector(_state => _state.salesPitchReducer[stateName as SalesPitchReducerKeys], shallowEqual);
  const reducer = (useActions(SalesPitchActions) as any)[reducerName || 'doUpdateAny'];

  const setter = useCallback(
    (val: SalesPitchReducerState[T] | ((state: SalesPitchReducerState[T]) => SalesPitchReducerState[T])): void => {
      if (reducer) {
        if (typeof val === 'function') {
          reducer(reducerName ? val(state as SalesPitchReducerState[T]) : { name: stateName, data: val(state as SalesPitchReducerState[T]) });
        } else {
          reducer(reducerName ? val : { name: stateName, data: val });
        }
      } else {
        console.error('REDUCER IS NOT VALID', stateName, reducerName);
      }
    },
    [reducer, reducerName, stateName]
  );
  return [state, setter] as [SalesPitchReducerState[T], typeof setter];
};

export default useState2ReduxMock;
