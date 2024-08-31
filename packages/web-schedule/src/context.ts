import React from 'react';

/** 同步日历日程context */

export interface PopDetailVisibleState {
  visible: boolean;
}

export const popDetailVisibleReducer = (state: PopDetailVisibleState, action: PopDetailVisbleActionType) => {
  switch (action.type) {
    case 'close':
      return {
        visible: false,
      };
    case 'open':
      return {
        visible: true,
      };
    default:
      break;
  }
  return state;
};

export interface PopDetailVisbleActionType {
  type: 'open' | 'close';
}

export const PopDetailVisbleContext = React.createContext<{
  dispatch: React.Dispatch<PopDetailVisbleActionType>;
  visible: PopDetailVisibleState['visible'];
}>({
  dispatch: () => null,
  visible: false,
});
