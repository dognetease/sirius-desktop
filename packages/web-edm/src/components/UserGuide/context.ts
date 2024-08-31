import { createContext, Dispatch } from 'react';

interface Action {
  payload: Partial<State>;
}

interface State {
  shouldShow: boolean;
  currentStep: number;
  hasOperate: boolean;
  guideState: 'unknow' | 'finish' | 'notFinish';
}

interface ContextProps {
  state: State;
  dispatch: Dispatch<Action>;
}

export const UserGuideContext = createContext<ContextProps>({} as ContextProps);

export function userGuideReducer(state: State, action: Action): State {
  return { ...state, ...action.payload };
}
