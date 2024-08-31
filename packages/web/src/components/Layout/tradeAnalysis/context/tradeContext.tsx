import { ForwarderRecordItem, resCustomsFollowCountry } from 'api';
import { createContext } from 'react';
import { TabValueList } from '../component/tradeSearch/tradeSearch';

export interface tradeState {
  type: TabValueList;
  value?: string;
  country?: string;
  recordType?: 'import' | 'export' | 'peers';
}

export const initState: tradeState = { type: '1', value: '' };

export const TradeContext = createContext<[tradeState, React.Dispatch<tradeState>]>([initState, () => void 0]);

export const tradeReducer = (state: tradeState, action: tradeState): tradeState => {
  console.log(action, 'dsadadsadwa');

  switch (action.type) {
    case '3':
      return {
        type: action.type,
        value: action.value,
        country: action.country,
        recordType: action.recordType,
      };
    case '1':
      return {
        type: '1',
        value: '',
        country: '',
        recordType: 'import',
      };
    default:
      return { type: '1', value: '' };
  }
};
