import { apiHolder, NIMApi } from 'api';
import qs from 'querystring';
import { navigate } from '@reach/router';

interface Props {
  sessionId: string;
  mode: 'normal' | 'history';
  // 自定义扩展字段
  [key: string]: string;
}

const nimApi: NIMApi = apiHolder.api.requireLogicalApi('NIM') as unknown as NIMApi;

interface Options {
  createSession: boolean;
  validateTeam: boolean;
}

export const openSession = async (params: Props, options?: Partial<Options>) => {
  params.mode = params.mode || 'normal';
  const [scene, to] = params.sessionId.split('-') as ['p2p' | 'team', ''];
  options = {
    createSession: false,
    validateTeam: false,
    ...options,
  };
  // @ts-ignore
  await nimApi.currentSession.setSession(
    {
      scene,
      to,
    },
    {
      validateTeam: options.validateTeam,
      tryCreateSession: !!options.createSession,
    }
  );
  // @ts-ignore
  navigate('#message?' + qs.stringify(params));
};

export const closeSession = async () => {
  navigate('#message');
};

// 解析参数
export const getParams = (str: string, name: string) => {
  const reg = new RegExp(`${name}=([^\\?&]+)(?=(&|$))`);
  if (str.match(reg)) {
    return (str.match(reg) as string[])[1];
  }
  return null;
};
