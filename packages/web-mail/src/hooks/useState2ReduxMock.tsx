/*
 * 功能：将redux中的值以useState的方式转接到组件中
 * 支持redux中的类型提示
 * 支持默认的redux写入，简单写法不用再传入reducerName了
 * warn: 如果只是用到了reucer而没用到状态，可以将状态值传null，则返回的state不会导致重新渲染
 * todo: 外贸的业务待下个版本梳理移出。
 */
import { useCallback } from 'react';
import { shallowEqual } from 'react-redux';
import { MailActions, useActions, useAppSelector } from '@web-common/state/createStore';
import { MailBoxReducerState, MailBoxReducerKey } from '../types';

const useState2ReduxMock = <T extends MailBoxReducerKey>(stateName: T, reducerName = '') => {
  const state = useAppSelector(state => (stateName != null && stateName != '' ? state.mailReducer[stateName as keyof typeof state.mailReducer] : null), shallowEqual);
  const reducer = (useActions(MailActions) as any)[reducerName || 'doUpdateAny'];

  const setter = useCallback(
    (val: MailBoxReducerState[T] | ((state: MailBoxReducerState[T]) => MailBoxReducerState[T])): void => {
      if (reducer) {
        if (typeof val === 'function') {
          reducer(reducerName ? val(state as MailBoxReducerState[T]) : { name: stateName, data: val(state as MailBoxReducerState[T]) });
        } else {
          reducer(reducerName ? val : { name: stateName, data: val });
        }
      } else {
        console.error('REDUCER IS NOT VALID', stateName, reducerName);
      }
    },
    [reducer, reducerName, stateName]
  );
  return [state, setter] as [MailBoxReducerState[T], typeof setter];
};

export default useState2ReduxMock;
