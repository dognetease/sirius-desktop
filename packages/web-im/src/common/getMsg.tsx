import { IMMessage, NIMApi, apiHolder } from 'api';
import lodashGet from 'lodash/get';
import { getIn18Text } from 'api';
const nimApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;
export const getMsg: (
  idClient: string,
  serverOptions: {
    sessionId: string;
    from?: string;
    time: number;
  }
) => Promise<IMMessage> = async (idClient: string, serverOptions) => {
  const { msg } = (await nimApi.excute('getLocalMsgByIdClient', {
    idClient,
  })) as {
    msg: IMMessage;
  };
  if (msg && lodashGet(msg, 'idServer.length', 0) !== 0) {
    return Promise.resolve(msg);
  }
  // 从服务端去查找消息
  const [scene, to] = serverOptions.sessionId.split('-');
  const { msgs = [] } = (await nimApi.excute('getHistoryMsgs', {
    scene,
    to,
    limit: 10,
    beginTime: serverOptions.time - 10,
    endTime: serverOptions.time + 10,
  })) as {
    msgs: IMMessage[];
  };
  const targetMsg = msgs.find(item => item.idClient === idClient);
  if (targetMsg) {
    return Promise.resolve(targetMsg);
  }
  return Promise.resolve({
    scene,
    flow: 'out',
    to,
    type: 'tip',
    tip: getIn18Text('CHEHUILEYITIAO11'),
    idClient,
  } as IMMessage);
};
