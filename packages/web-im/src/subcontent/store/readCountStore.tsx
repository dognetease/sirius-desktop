import React, { createContext, useEffect, useState } from 'react';
import { apiHolder, IMMessage, NIMApi } from 'api';
import debounce from 'lodash/debounce';
import lodashGet from 'lodash/get';

const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
/**
 * 已读未读全局数据
 */
interface GetTeamMsgsReadsParamsApi {
  teamId: string;
  idServer: string;
}

export const ReadContext = createContext<ReadContextApi>({} as ReadContextApi);
interface ReadProviderApi {
  to: string;
  sessionId: string;
  children: React.ReactNode;
}

interface SingleReadCountApi {
  read: string;
  unread: string;
}

type ReadCountApi = Record<string, SingleReadCountApi>;
interface ReadContextApi {
  readMap: ReadCountApi;
  getTeamMsgReads(params: IMMessage): void;
}

interface SingleMsgReceiptsApi {
  teamId: string;
  idServer: string;
  read: string;
  unread: string;
  idClient: string;
}
interface MsgReceiptsApi {
  teamMsgReceipts: SingleMsgReceiptsApi[];
}

interface teamMsgReadsStateApi {
  params: ReadProviderApi;
  resolve(params: SingleReadCountApi): void;
  reject(error: Error): void;
}
export const ReadProvider: React.FC<ReadProviderApi> = props => {
  const { to, sessionId } = props;

  const [readStatusMap, setReadStatusMap] = useState<ReadCountApi>({});
  const onTeamMsgReceipt = (params: MsgReceiptsApi) => {
    const { teamMsgReceipts } = params;
    const receipts = {};
    teamMsgReceipts
      .filter(item => item.teamId === to)
      .forEach(item => {
        receipts[item.idServer] = item;
      });
    setReadStatusMap(state => ({ ...state, ...receipts }));
  };
  // 监听已读未读消息
  useEffect(() => {
    nimApi.subscrible('onTeamMsgReceipt', onTeamMsgReceipt);
    return () => {
      nimApi.unSubcrible('onTeamMsgReceipt', onTeamMsgReceipt);
    };
  }, []);

  const [msgReadParamsList, setMsgReadParamList] = useState({});
  // 查询已读未读数量
  const getAllTeamMsgReads = debounce(async () => {
    const totalParmas = Object.values(msgReadParamsList);
    // 清空请求数据项
    setMsgReadParamList({});
    // 需要考虑超过50条查询(实际场景应该不太会一次性出现50条.暂时先不考虑)
    const done = (error, params, result) => {
      if (error instanceof Error) {
        return setMsgReadParamList({});
      }
      const { teamMsgReceipts } = result as {
        teamMsgReceipts: SingleMsgReceiptsApi[];
      };

      const readMap: { [key: string]: SingleMsgReceiptsApi } = {};
      teamMsgReceipts.forEach(item => {
        Reflect.set(readMap, item.idServer, item);
      });
      setReadStatusMap(state => ({ ...state, ...readMap }));
      setMsgReadParamList({});
    };
    if (!totalParmas.length) {
      return;
    }
    nimApi.excute('getTeamMsgReads', {
      needReturn: true,
      done,
      teamMsgReceipts: totalParmas,
    });
  }, 50);
  const getTeamMsgReads = (params: IMMessage) => {
    const isSkipRequest = [
      () =>
        // unread===0不处理
        lodashGet(params, 'unread', -1) === 0,
      () =>
        // 当前新发送消息不处理
        params.sourceType !== 'pull',
      () => {
        // 超过三0天不处理
        const now = new Date().getTime();
        const duration = now - new Date(params.time).getTime();
        return duration > 30 * 24 * 60 * 60 * 1000;
      },
      () =>
        // 纯本地消息不处理
        !Reflect.has(params, 'idServer'),
    ].some(call => call());
    if (isSkipRequest) {
      const read = lodashGet(params, 'read', 0);
      const unread = lodashGet(params, 'unread', 1);
      return setReadStatusMap(state => {
        const readMap = { ...state };
        readMap[params.idServer as string] = {
          read,
          unread,
        };
        return readMap;
      });
    }

    setMsgReadParamList(state => {
      const result = { ...state };
      result[params.idServer as string] = {
        idServer: params.idServer,
        idClient: params.idClient,
        teamId: params.to,
      };
      return result;
    });
  };

  useEffect(() => {
    if (!Object.values(msgReadParamsList).length) {
      return;
    }
    getAllTeamMsgReads();
  }, [msgReadParamsList]);

  return (
    <ReadContext.Provider
      value={{
        readMap: readStatusMap,
        getTeamMsgReads,
      }}
    >
      {props.children}
    </ReadContext.Provider>
  );
};
