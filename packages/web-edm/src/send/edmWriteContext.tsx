import { EdmVariableItem } from 'api';
import { createContext, Dispatch } from 'react';

export enum EmptyContactType {
  Friend = 'friend',
  Email = 'email',
  Empty = 'empty',
}
export interface IEdmWriteState {
  draftId?: string;
  edmEmailId?: string;
  currentStage: number;
  emailType?: number;
  templateId?: string;
  canSend: boolean;
  isReady: boolean;
  editorCreated: boolean;
  sendCapacity?: SendCapacity;
  variableList?: Array<EdmVariableItem>;
  emptyContactType: EmptyContactType;
  showEmptyContactModal: boolean;
  templateParamsFromEditor: Array<string>;
  senderEmails: Array<string>;
  mailContent?: string;
}

export interface SendCapacity {
  todaySendCount: number;
  totalSendCount: number;
  availableSendCount: number;
  singleSendCount: number;
  privilegeUpgradeSendCount: number;
  sendCount: number;
}

export const writeContextReducer = (state: IEdmWriteState, action: { type: string; payload: Partial<IEdmWriteState> }) => {
  switch (action.type) {
    case 'setState':
      if (action.payload.sendCapacity) {
        return {
          ...state,
          ...action.payload,
          sendCapacity: {
            ...action.payload.sendCapacity,
            sendCount: action.payload.sendCapacity.sendCount ?? state.sendCapacity?.sendCount,
            privilegeUpgradeSendCount: action.payload.sendCapacity.privilegeUpgradeSendCount ?? state.sendCapacity?.privilegeUpgradeSendCount,
          },
        };
      }
      return { ...state, ...action.payload };
  }
  return state;
};

export interface ContextProps {
  value: {
    state: IEdmWriteState;
    dispatch: Dispatch<{ type: string; payload: Partial<IEdmWriteState> }>;
    isEdmModalEditor?: boolean;
  };
}
export const edmWriteContext = createContext<ContextProps>({} as ContextProps);
