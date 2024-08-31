import React, { useEffect, useState, useRef } from 'react';
import { IMMessage, apiHolder, NIMApi } from 'api';
import lodashGet from 'lodash/get';
import debounce from 'lodash/debounce';
import { getIn18Text } from 'api';
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
interface TreadRequestProps {
  idClient: string;
  scene: string;
  to: string;
  from: string;
  beginTime: number;
  endTime: number;
}
export interface TreamMsgProps {
  requestReply(params: TreadRequestProps): void;
  replyMap: Record<string, IMMessage>;
}
export const Context = React.createContext({} as TreamMsgProps);
export const Provider: React.FC<any> = props => {
  const [replyMap, setReplyMap] = useState<Record<string, IMMessage>>({});
  const [replyRequestList, setReplyRequestList] = useState<TreadRequestProps[]>([]);
  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const requestReply = (params: TreadRequestProps) => {
    if (Reflect.has(replyMap, params.idClient)) {
      return;
    }
    setReplyRequestList(state => {
      const result = [...state];
      result.push(params);
      return result;
    });
  };
  const _requestItem = async (params: TreadRequestProps): Promise<IMMessage | undefined> => {
    let msg: IMMessage | undefined;
    try {
      const result = await nimApi.excute('getLocalMsgByIdClient', {
        idClient: params.idClient,
      });
      msg = result.msg;
      if (lodashGet(msg, 'type.length', 0) === 0) {
        throw new Error('Local MSG NULL');
      }
      return Promise.resolve(msg);
    } catch (ex) {}
    try {
      const results = await nimApi.excute('getHistoryMsgs', {
        scene: params.scene,
        to: params.to,
        limit: 10,
        beginTime: params.beginTime,
        endTime: params.endTime,
      });
      msg = (results.msgs as IMMessage[]).find(item => item.idClient === params.idClient);
      if (!msg) {
        throw new Error('SERVER MSG NULL');
      }
      return Promise.resolve(msg);
    } catch (ex) {}
    // 默认就是被撤回信息
    return Promise.resolve({
      scene: params.scene,
      from: params.from,
      flow: 'out',
      to: params.to,
      type: 'tip',
      tip: getIn18Text('CHEHUILEYITIAO'),
      text: 'LX_DELETED',
      idClient: params.idClient,
    } as IMMessage);
  };
  const _batchRequest = debounce(async () => {
    const list = await Promise.all(replyRequestList.map(item => _requestItem(item)));
    const _map: Record<string, IMMessage> = {};
    (list.filter(item => lodashGet(item, 'idClient.length', 0) !== 0) as IMMessage[]).forEach((item: IMMessage) => {
      Reflect.set(_map, item.idClient, item);
    });
    if (!isMountedRef.current) return;
    setReplyMap(state => ({ ...state, ..._map }));
    setReplyRequestList([]);
  }, 30);
  useEffect(() => {
    if (!replyRequestList.length) {
      return;
    }
    _batchRequest();
  }, [replyRequestList]);
  return (
    <Context.Provider
      value={{
        requestReply,
        replyMap,
      }}
    >
      {props.children}
    </Context.Provider>
  );
};
