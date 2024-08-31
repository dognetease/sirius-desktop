import { createContext, Dispatch } from 'react';
import { getTransText } from '@/components/util/translate';

export enum IntelligentSearchType {
  Phone = 'phone',
  Email = 'email',
  Group = 'wagroup',
}
export interface SearchParams {
  type: string;
  searchEngine: string;
  isAllMatch: number;
  siteList: string[];
  countryList?: string[];
  content: string;
  page: number;
  pageSize: number;
  title?: string;
  inWa?: boolean;
  excludeDelivered?: boolean;
}

interface Action {
  type: ActionType;
  payload: Partial<SearchParams> | string | number | boolean | string[];
}

interface ContextProps {
  state: SearchParams;
  dispatch: Dispatch<Action>;
}

export enum ActionType {
  updateState = 'updateState',
  typeChange = 'typeChange',
  searchEngineChange = 'searchEngineChange',
  isAllMatchChange = 'isAllMatchChange',
  siteListChange = 'siteListChange',
  countryListChange = 'countryListChange',
  contentChange = 'contentChange',
  excludeDeliveredChange = 'excludeDeliveredChange',
}

export const IntelligentSearchContext = createContext<ContextProps>({} as ContextProps);

export function reducer(state: SearchParams, action: Action): SearchParams {
  switch (action.type) {
    case ActionType.updateState:
      return { ...state, ...(action.payload as Partial<SearchParams>) };
    case ActionType.typeChange:
      if (action.payload === IntelligentSearchType.Email) {
        state.countryList = undefined;
        state.excludeDelivered = undefined;
      } else if (action.payload === IntelligentSearchType.Group) {
        state.countryList = undefined;
      } else {
        state.countryList = state.countryList || [];
      }
      return { ...state, type: action.payload as string };
    case ActionType.searchEngineChange:
      return { ...state, searchEngine: action.payload as string };
    case ActionType.isAllMatchChange:
      return { ...state, isAllMatch: action.payload as number };
    case ActionType.siteListChange:
      return { ...state, siteList: action.payload as string[] };
    case ActionType.countryListChange:
      return { ...state, countryList: action.payload as string[] };
    case ActionType.contentChange:
      return { ...state, content: action.payload as string };
    case ActionType.excludeDeliveredChange:
      return { ...state, excludeDelivered: action.payload as boolean };
    default:
      return state;
  }
}

export const SearchType = [
  { label: 'WhatsApp', value: IntelligentSearchType.Phone },
  { label: 'WhatsApp群组', value: IntelligentSearchType.Group },
  { label: getTransText('YOUXIANG'), value: IntelligentSearchType.Email },
];

export const SearchEngine = [
  // { label: '全部', value: '' },
  { label: 'Google', value: 'google' },
  { label: 'Bing', value: 'bing' },
];

export const SearchSiteList = [
  {
    label: getTransText('SHEJIAOPINGTAI'),
    options: [
      { label: 'Facebook', value: 'facebook' },
      { label: 'LinkedIn', value: 'linkedin' },
      { label: 'Twitter', value: 'twitter' },
      { label: 'Instagram', value: 'instagram' },
      { label: 'Telegram', value: 'telegram' },
      { label: 'Line', value: 'line' },
      { label: 'Snapchat', value: 'snapchat' },
      { label: 'Tumbler', value: 'tumbler' },
      { label: 'Pinterest', value: 'pinterest' },
      { label: 'Vk', value: 'vk' },
      { label: 'Skype', value: 'skype' },
      { label: 'Viber', value: 'viber' },
      { label: 'Crunchbase', value: 'crunchbase' },
    ],
  },
  {
    label: getTransText('ShortVideoPlatform'),
    options: [
      { label: 'Youtube', value: 'youtube' },
      { label: 'Tiktok', value: 'tiktok' },
      { label: 'Kwai', value: 'kwai' },
    ],
  },
  {
    label: getTransText('CommercePlatforms'),
    options: [
      { label: 'Amazon', value: 'amazon' },
      { label: 'Aliexpress', value: 'aliexpress' },
      { label: 'Wish', value: 'wish' },
      { label: 'Shopee', value: 'shopee' },
      { label: 'Ebay', value: 'ebay' },
      { label: 'Lazada', value: 'lazada' },
    ],
  },
];

export const allSites: string[] = SearchSiteList.reduce((list, group) => {
  const next = list.concat(group.options.map(item => item.value));
  return next;
}, [] as string[]);

export const defaultSites = ['facebook', 'instagram', 'telegram', 'linkedin', 'pinterest', 'youtube', 'tiktok'];

export const initialState = {
  type: IntelligentSearchType.Phone,
  searchEngine: 'google',
  isAllMatch: 0,
  excludeDelivered: false,
  siteList: defaultSites,
  countryList: [],
  content: '',
  page: 1,
  pageSize: 20,
};

export const whatsAppTypes = [IntelligentSearchType.Phone, IntelligentSearchType.Group];
