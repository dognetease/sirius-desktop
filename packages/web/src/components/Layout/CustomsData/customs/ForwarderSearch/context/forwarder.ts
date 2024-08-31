import { ForwarderRecordItem, resCustomsFollowCountry } from 'api';
import { createContext } from 'react';

export interface ExcavateState
  extends Pick<
    ForwarderRecordItem,
    // 'contactCount' |
    // 'emailCount' |
    // 'phoneCount' |
    // 'socialCount' |
    'country' | 'companyName' | 'chineseCompanyId' | 'chineseCompanyContactCount'
  > {}

export interface ForwarderState {
  curExcavate?: ExcavateState | null;
  followCountry?: resCustomsFollowCountry[] | null;
}

export interface ExcavateAction {
  type: 'CHANGE';
  payload?: ForwarderState['curExcavate'];
}

export interface FollowCountryAction {
  type: 'FOLLOW_COUNTRY_CHANGE';
  payload?: ForwarderState['followCountry'];
}

export type ForwarderAction = ExcavateAction | FollowCountryAction;

export const initState: ForwarderState = {
  curExcavate: null,
  followCountry: null,
};

export const ForwarderContext = createContext<[ForwarderState, React.Dispatch<ForwarderAction>]>([initState, () => void 0]);

export const forwarderReducer = (state: ForwarderState, action: ForwarderAction): ForwarderState => {
  switch (action.type) {
    case 'CHANGE':
      return {
        ...state,
        curExcavate: action.payload,
      };
    case 'FOLLOW_COUNTRY_CHANGE':
      return {
        ...state,
        followCountry: action.payload,
      };
    default:
      return state;
  }
};
