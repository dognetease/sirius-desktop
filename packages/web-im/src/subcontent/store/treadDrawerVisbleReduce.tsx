import { IMMessage } from 'api';
// 处理数据 & 初始化数据
export interface InitStateApi {
  visible: boolean;
  treadMsg: IMMessage | null;
  msgs: IMMessage[];
}

export enum Actions {
  OPEN_TREAD_TREE = 'OPEN_TREAD_TREE',
  CLOSE_TREAD_TREE = 'CLOSE_TREAD_TREE',
  REQUEST_TREAD_MSGS = 'REQUEST_TREAD_MSGS',
}

export type ReducePayload =
  | {
      action: Actions.REQUEST_TREAD_MSGS;
      data: {
        threadMsg: IMMessage;
        msgs: IMMessage[];
      };
    }
  | {
      action: Actions.CLOSE_TREAD_TREE;
    };
type ReduceApi = (state: InitStateApi, payload: ReducePayload) => InitStateApi;
export const reduce: ReduceApi = (state: InitStateApi, payload) => {
  const { action } = payload;

  if (action === Actions.CLOSE_TREAD_TREE) {
    return {
      visible: false,
      treadMsg: null,
      msgs: [],
    };
  } else if (action === Actions.REQUEST_TREAD_MSGS) {
    return {
      visible: true,
      treadMsg: payload.data.threadMsg,
      msgs: payload.data.msgs,
    };
  }

  return state;
};

export const initState: InitStateApi = {
  visible: false,
  treadMsg: null,
  msgs: [],
};
