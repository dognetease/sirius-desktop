/**
 * 海关数据全局state 用于层级较深的组件共享状态
 */
import { createContext, Dispatch } from 'react';

interface State {
  dealtTime: [string, string]; // 采购商 供应商搜索的时间范围，需要带入详情弹窗内部的组件
}

interface Action {
  payload: Partial<State>;
}

interface ContextProps {
  state: State;
  dispatch: Dispatch<Action>;
}

export const GlobalContext = createContext<ContextProps>({} as ContextProps);

export function reducer(state: State, action: Action): State {
  return { ...state, ...(action.payload as Partial<State>) };
}
