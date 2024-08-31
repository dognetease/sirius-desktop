import React, { createContext, useReducer } from 'react';
import { apiHolder, NIMApi, IMMessage } from 'api';
import { InitStateApi, initState, reduce, ReducePayload, Actions } from './treadDrawerVisbleReduce';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

export { Actions } from './treadDrawerVisbleReduce';
export const Context = createContext(
  {} as {
    state: InitStateApi;
    dispatch: React.Dispatch<ReducePayload>;
    requestTreadInfo(msg: IMMessage): Promise<boolean>;
  }
);

type GetTreadMsgParmasApi = Record<'scene' | 'idClient' | 'threadMsgFromAccount' | 'threadMsgToAccount' | 'threadMsgIdServer', string> & {
  threadMsgTime: number;
};

export const Provider: React.FC<any> = props => {
  const [state, dispatch] = useReducer(reduce, initState);

  // 查询tread信息(treadHead & tread回复列表)
  const requestTreadInfo = async (msg: IMMessage): Promise<boolean> => {
    const param = Reflect.has(msg, 'threadMsgIdClient')
      ? {
          scene: msg.scene,
          idClient: msg.threadMsgIdClient,
          threadMsgFromAccount: msg.threadMsgFromAccount,
          threadMsgToAccount: msg.threadMsgToAccount,
          threadMsgIdServer: msg.threadMsgIdServer,
          threadMsgTime: msg.threadMsgTime,
        }
      : {
          scene: msg.scene,
          idClient: msg.idClient,
          threadMsgFromAccount: msg.from,
          threadMsgToAccount: msg.to,
          threadMsgIdServer: msg.idServer,
          threadMsgTime: msg.time,
        };

    const res = (await nimApi.excute('getThreadMsgs', {
      ...param,
      reverse: true,
    })) as {
      msgs: IMMessage[];
      threadMsg: IMMessage;
      timetag: string;
      total: number;
    };

    if (!res.threadMsg || !Reflect.has(res.threadMsg, 'type')) {
      throw new Error('yyyy');
    }

    dispatch({
      action: Actions.REQUEST_TREAD_MSGS,
      data: {
        threadMsg: res.threadMsg,
        msgs: res.msgs,
      },
    });
    return true;
  };

  return <Context.Provider value={{ state, dispatch, requestTreadInfo }}>{props.children}</Context.Provider>;
};
