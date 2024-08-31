export interface IFacebookSearchState {
  query: string;
  tableStatus: TTableStatus;
  tableData: ITableData[];
  isTasking: boolean;
  page: number;
  pageSize: number;
  selectedKeys: string[];
  isCertify: boolean;
  total: number;
  isInit: boolean;
  extraTotal: number;
}

export type TGrubStatus = 'NOT_GRUBBING' | 'GRUBBING' | 'GRUBBED';

export interface ITableData {
  id: string;
  name: string;
  heightLightName: string;
  grubStatus: TGrubStatus;
  facebookLink: string;
  follow: number;
  thumbsUp: number;
  information: string;
  isCertify: boolean;
  contacts: {
    email: string;
    mobile: string;
  }[];
}

export type TTableStatus = 'loading' | 'data';

export type TUpdateTable = {
  type: 'UPDATE_TABLE';
  payload: {
    status?: TTableStatus;
    total?: number;
    tableData?: any;
  };
};

export type TUpdatePagination = {
  type: 'UPDATE_PAGE';
  payload: {
    page: number;
    pageSize?: number;
  };
};

export type TUpdateSelectedKeys = {
  type: 'UPDATE_SELECT';
  payload: {
    selected: string[];
  };
};

export type TUpdateQuery = {
  type: 'UPDATE_QUERY';
  payload: {
    query: string;
  };
};

export type TUpdateTaskStatus = {
  type: 'UPDATE_TASK_STATUS';
  payload: {
    taskStatus: number;
    extraTotal: number;
  };
};

export type TUpdateCertify = {
  type: 'UPDATE_CERTIFY';
  payload: {
    isCertify: boolean;
  };
};

export type TUpdateIsInit = {
  type: 'UPDATE_IS_INIT';
  payload: {
    isInit: boolean;
  };
};

export type TUpdateGrubStatus = {
  type: 'UPDATE_GRUB_STATUS';
  payload: {
    id: string;
    grubStatus: TGrubStatus;
  };
};

export type TFacebookAction =
  | TUpdateTable
  | TUpdateIsInit
  | TUpdatePagination
  | TUpdateSelectedKeys
  | TUpdateQuery
  | TUpdateTaskStatus
  | TUpdateCertify
  | TUpdateGrubStatus;

export const initState: IFacebookSearchState = {
  query: '',
  tableStatus: 'loading',
  tableData: [] as any,
  page: 1,
  pageSize: 20,
  selectedKeys: [],
  isCertify: false,
  isTasking: false,
  total: 0,
  isInit: true,
  extraTotal: 0,
};

export const reducer = (state: IFacebookSearchState, action: TFacebookAction): IFacebookSearchState => {
  const { type, payload } = action;
  switch (type) {
    case 'UPDATE_CERTIFY':
      return {
        ...state,
        isCertify: payload.isCertify,
      };
    case 'UPDATE_PAGE':
      return {
        ...state,
        page: payload.page,
        pageSize: payload.pageSize ?? state.pageSize,
      };
    case 'UPDATE_QUERY':
      return {
        ...state,
        query: payload.query,
      };
    case 'UPDATE_SELECT':
      return {
        ...state,
        selectedKeys: payload.selected,
      };
    case 'UPDATE_TABLE':
      return {
        ...state,
        tableData: payload.tableData ?? state.tableData,
        total: payload.total ?? state.total,
        tableStatus: payload.status ?? state.tableStatus,
      };
    case 'UPDATE_TASK_STATUS':
      return {
        ...state,
        isTasking: payload.taskStatus === 1,
        extraTotal: payload.extraTotal,
      };
    case 'UPDATE_IS_INIT':
      return {
        ...state,
        isInit: payload.isInit ?? state.isInit,
      };
    case 'UPDATE_GRUB_STATUS':
      return {
        ...state,
        tableData: state.tableData.map(each => {
          if (each.id === payload.id) {
            return {
              ...each,
              grubStatus: payload.grubStatus,
            };
          }
          return each;
        }),
      };
    default:
      return state;
  }
};
