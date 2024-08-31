import { createContext, Dispatch, useReducer, useMemo } from 'react';

export interface SensitiveState {
  failedCount: number;
  failedWords: Array<string>;
}
export interface ValidatorSensitive {
  /**
   * 注册id
   */
  id: 'sensitive';
  validate: () => {
    success: boolean;
    /**
     * 检测失败后的信息
     */
    failedInfo?: SensitiveState;
  };
  /**
   * 检测失败之后的动作需要触发，可能是一个连续的动作
   */
  failedActionState: Array<() => any>;
}

export interface ValidatorSpamAssassin {
  id: 'spamAssassin';
  validate: () => {
    score: number;
    data: Array<{
      description: string;
      mark: number;
    }>;
  };
}

// export interface ValidatorIpBlacklists {
//   id: 'ipBlacklists',
//   validate: () => {
//     score: number;
//     data: Array<{
//       description: string;
//       mark: number;
//     }>;
//   },
// }

export interface ValidatorBadLinks {
  id: 'badLinks';
  validate: () => {
    count: number;
    data: Array<{
      description: string;
    }>;
  };
}

export interface ValidatorMailContentCheck {
  id: 'mailContentCheckAction' | 'mailContentReCheck';
  actions: Array<() => any>;
}

// 安全发信
export interface ValidatorSmartSend {
  id: 'smartSend';
  selected: boolean;
}
// 开启安全发信
export interface ValidatorSmartSendAction {
  id: 'smartSend:action';
  actions: Array<() => any>;
}

// 千邮千面
export interface ValidatorMultiVersion {
  id: 'multiVersion';
  data: {
    open?: boolean;
    aiRewrite?: boolean;
  };
}
export interface ValidatorMultiVersionAction {
  id: 'multiVersion:action';
  actions: Array<() => any>;
}
export interface FailedState {
  id: 'failedState';
  data: {
    old?: number;
    count?: number;
  };
}

// 记录诊断结果埋点
export interface ValidatorResult {
  id: 'ValidatorResult';
  edmId?: string;
  // volume?: number;
  type?: 0 | 1;
  firstCount?: number;
  lastCount?: number;
}

export type ValidatorState = Array<
  | ValidatorSensitive
  | ValidatorSpamAssassin
  | ValidatorBadLinks
  | ValidatorMailContentCheck
  | ValidatorSmartSend
  | ValidatorMultiVersion
  | ValidatorSmartSendAction
  | ValidatorMultiVersionAction
  | FailedState
  | ValidatorResult
>;

export interface EmailContentPayload {
  spamAssassin: ValidatorSpamAssassin;
  badLinks: ValidatorBadLinks;
}

type Action =
  | {
      type: 'sensitive:validate';
      payload: ValidatorSensitive['validate'];
    }
  | {
      type: 'sensitive:failedActionState';
      payload: () => any;
    }
  | {
      type: 'emailContentCheck';
      payload: EmailContentPayload;
    }
  | {
      type: 'mailContentCheckAction';
      payload: Array<() => any>;
    }
  | {
      type: 'mailContentReCheck';
      payload: Array<() => any>;
    }
  | {
      type: ValidatorSmartSend['id'];
      payload: boolean;
    }
  | {
      type: ValidatorMultiVersion['id'];
      payload: Partial<ValidatorMultiVersion['data']>;
    }
  | {
      type: ValidatorSmartSendAction['id'];
      payload: ValidatorSmartSendAction['actions'];
    }
  | {
      type: ValidatorMultiVersionAction['id'];
      payload: ValidatorMultiVersionAction['actions'];
    }
  | {
      type: 'setFailed';
      payload: Partial<{
        old: number;
        count: number;
      }>;
    }
  | {
      type: 'setValidatorResult';
      payload: ValidatorResult;
    };

export const writeContextReducer = (state: ValidatorState, action: Action): ValidatorState => {
  switch (action.type) {
    case 'sensitive:validate': {
      const sensitive = state.find(item => item.id === 'sensitive');
      if (sensitive) {
        sensitive.validate = action.payload;
      } else {
        return [
          ...state,
          {
            id: 'sensitive',
            validate: action.payload,
            failedActionState: [],
          },
        ];
      }
      return [...state];
    }
    case 'sensitive:failedActionState': {
      const sensitive = state.find(item => item.id === 'sensitive');
      if (sensitive) {
        const failedActionState = sensitive.failedActionState || [];
        failedActionState.push(action.payload);
        sensitive.failedActionState = failedActionState;
      } else {
        return [
          ...state,
          {
            id: 'sensitive',
            validate: () => ({ success: true }),
            failedActionState: [action.payload],
          },
        ];
      }
      return [...state];
    }
    case 'emailContentCheck': {
      const newState = state;
      const badLinksIndex = state.findIndex(item => item.id === 'badLinks');
      const spamAssassinIndex = state.findIndex(item => item.id === 'spamAssassin');
      if (badLinksIndex > -1) {
        newState[badLinksIndex] = action.payload.badLinks;
      } else {
        newState.push(action.payload.badLinks);
      }
      if (spamAssassinIndex > -1) {
        newState[spamAssassinIndex] = action.payload.spamAssassin;
      } else {
        newState.push(action.payload.spamAssassin);
      }
      return [...newState];
    }
    case 'mailContentCheckAction': {
      const mailContentCheckIndex = state.findIndex(item => item.id === 'mailContentCheckAction');
      const mailContentCheckState: ValidatorMailContentCheck = {
        id: 'mailContentCheckAction',
        actions: action.payload,
      };
      if (mailContentCheckIndex > -1) {
        state[mailContentCheckIndex] = mailContentCheckState;
      } else {
        state.push(mailContentCheckState);
      }
      return [...state];
    }
    case 'mailContentReCheck': {
      const mailContentCheckIndex = state.findIndex(item => item.id === 'mailContentReCheck');
      const mailContentCheckState: ValidatorMailContentCheck = {
        id: 'mailContentReCheck',
        actions: action.payload,
      };
      if (mailContentCheckIndex > -1) {
        state[mailContentCheckIndex] = mailContentCheckState;
      } else {
        state.push(mailContentCheckState);
      }
      return [...state];
    }
    case 'smartSend': {
      const smartSendIndex = state.findIndex(item => item.id === 'smartSend');
      const smartSendState: ValidatorSmartSend = {
        id: 'smartSend',
        selected: action.payload,
      };
      if (smartSendIndex > -1) {
        state[smartSendIndex] = smartSendState;
      } else {
        state.push(smartSendState);
      }
      return [...state];
    }
    case 'multiVersion': {
      const multiVersionIndex = state.findIndex(item => item.id === 'multiVersion');
      const multiVersionState: ValidatorMultiVersion = {
        id: 'multiVersion',
        data: action.payload,
      };
      if (multiVersionIndex > -1) {
        state[multiVersionIndex] = {
          id: 'multiVersion',
          data: {
            ...(state[multiVersionIndex] as ValidatorMultiVersion).data,
            ...action.payload,
          },
        };
      } else {
        state.push(multiVersionState);
      }
      return [...state];
    }
    case 'smartSend:action': {
      const actionsIndex = state.findIndex(item => item.id === 'smartSend:action');
      const curActions: ValidatorSmartSendAction = {
        id: 'smartSend:action',
        actions: action.payload,
      };
      if (actionsIndex > -1) {
        state[actionsIndex] = curActions;
      } else {
        state.push(curActions);
      }
      return [...state];
    }
    case 'multiVersion:action': {
      const actionsIndex = state.findIndex(item => item.id === 'multiVersion:action');
      const curActions: ValidatorMultiVersionAction = {
        id: 'multiVersion:action',
        actions: action.payload,
      };
      if (actionsIndex > -1) {
        state[actionsIndex] = curActions;
      } else {
        state.push(curActions);
      }
      return [...state];
    }
    case 'setFailed': {
      const actionsIndex = state.findIndex(item => item.id === 'failedState');
      if (actionsIndex > -1) {
        state[actionsIndex] = {
          id: 'failedState',
          data: {
            ...(state[actionsIndex] as FailedState).data,
            ...action.payload,
          },
        };
      } else {
        state.push({
          id: 'failedState',
          data: action.payload,
        });
      }
      return [...state];
    }
    case 'setValidatorResult': {
      const actionsIndex = state.findIndex(item => item.id === 'ValidatorResult');
      if (actionsIndex > -1) {
        const currentState = state[actionsIndex] as ValidatorResult;
        let nextState: ValidatorResult;
        nextState = {
          ...(state[actionsIndex] as ValidatorResult),
          ...action.payload,
        };
        if (currentState.firstCount != null) {
          // 永远不改变第一次计数
          nextState = {
            ...nextState,
            firstCount: currentState.firstCount,
          };
        }
        state[actionsIndex] = nextState;
      } else {
        state.push({
          ...action.payload,
        });
      }
      return [...state];
    }
  }
  return state;
};

export const ValidatorContext = createContext<{
  state: ValidatorState;
  dispatch: Dispatch<Action>;
} | null>(null);

export const useValidatorProvider = () => {
  const [state, dispatch] = useReducer(writeContextReducer, []);
  const validatorProvider = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return validatorProvider;
};
