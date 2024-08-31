import { IGlobalSearchSub, api } from 'api';
import { createContext } from 'react';
import { KeywordsForm } from './SubKeywordFormModal/SubkeyWordFormModal';

interface KeywordsFormState extends Omit<KeywordsForm, 'country'> {
  country?: string[];
}

const storeApi = api.getDataStoreApi();
interface SubKeyWordContextState {
  tag: number;
  listLoading: boolean;
  addLoading: boolean;
  addModalOpen: boolean;
  selectedSubIds: Array<number>;
  list: IGlobalSearchSub[];
  modalInit?: KeywordsFormState;
  redpoint: boolean;
  clickedToolTip: Array<string>;
  emailGuessState: EmailGuessState;
}

export interface EmailGuessState {
  visible: boolean;
  initInfo?: {
    domain: string;
    name: string;
    // 公司id
    id: string;
  };
}

export interface EmailGuessAction {
  type: 'EMAIL_GUESS_CHANGE_VISIBLE';
  payload?: EmailGuessState;
}

interface SubKeyWordContextAction {
  type: 'LIST_REFRESH' | 'LIST_FINISH' | 'LIST_SELECTED_CHANGE';
  payload?: {
    ids?: SubKeyWordContextState['selectedSubIds'];
    list?: IGlobalSearchSub[];
  };
}

interface SubAddContextAction {
  type: 'ADD_START' | 'ADD_FINISH' | 'MODAL_OPEN_CHANGE' | 'MODAL_OPEN_TOGGLE';
  payload?: {
    open: boolean;
    initForm?: KeywordsFormState;
  };
}

interface SubToolTipAction {
  type: 'OK_TOOL_TIP';
  payload?: string;
}

interface SubRedPointAction {
  type: 'RED_POINT';
  payload?: boolean;
}

type SubContextAction = SubKeyWordContextAction | SubAddContextAction | SubRedPointAction | SubToolTipAction | EmailGuessAction;

const getInitClickedToolTip = () => {
  return ['global_search_keyword_sub_create', 'global_search_keyword_sub_tab', 'global_search_keyword_sub_detail', 'global_search_keyword_sub_select_type'].filter(
    key => {
      return storeApi.getSync(key).data === 'true';
    }
  );
};

export const refreshSubListInitialState: SubKeyWordContextState = {
  tag: 0,
  listLoading: false,
  addLoading: false,
  addModalOpen: false,
  modalInit: {
    product: 'product',
    keyword: '',
  },
  selectedSubIds: [],
  list: [],
  redpoint: false,
  clickedToolTip: getInitClickedToolTip(),
  emailGuessState: {
    visible: false,
  },
};

export const SubKeyWordContext = createContext<[SubKeyWordContextState, React.Dispatch<SubContextAction>]>([refreshSubListInitialState, () => void 0]);

export const refreshSubListReducer = (state: SubKeyWordContextState, action: SubContextAction): SubKeyWordContextState => {
  switch (action.type) {
    case 'LIST_REFRESH':
      return { ...state, tag: state.tag + 1, listLoading: true };
    case 'LIST_FINISH':
      return { ...state, listLoading: false, list: action.payload?.list || [] };
    case 'LIST_SELECTED_CHANGE':
      return { ...state, selectedSubIds: action.payload?.ids || [] };
    case 'ADD_START':
      return { ...state, addLoading: true };
    case 'ADD_FINISH':
      return { ...state, addLoading: false };
    case 'MODAL_OPEN_CHANGE': {
      const addModalOpen = !!action.payload?.open;
      const modalInit = addModalOpen ? action.payload?.initForm || refreshSubListInitialState.modalInit : refreshSubListInitialState.modalInit;
      return { ...state, addModalOpen, modalInit };
    }
    case 'MODAL_OPEN_TOGGLE': {
      const addModalOpen = !state.addModalOpen;
      const modalInit = addModalOpen ? action.payload?.initForm || refreshSubListInitialState.modalInit : refreshSubListInitialState.modalInit;
      return { ...state, addModalOpen, modalInit };
    }
    case 'RED_POINT':
      return {
        ...state,
        redpoint: !!action.payload,
      };
    case 'OK_TOOL_TIP':
      const newClickedToolTip = typeof action.payload === 'string' ? Array.from(new Set([...state.clickedToolTip, action.payload])) : state.clickedToolTip;
      return {
        ...state,
        clickedToolTip: newClickedToolTip,
      };
    case 'EMAIL_GUESS_CHANGE_VISIBLE':
      const visible = !!action.payload?.visible;
      return {
        ...state,
        emailGuessState: {
          visible: visible,
          initInfo: visible ? action.payload?.initInfo : undefined,
        },
      };
    default:
      return state;
  }
};
