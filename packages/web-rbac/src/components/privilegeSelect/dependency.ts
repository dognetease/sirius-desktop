export const DependencyConfig: Record<string, Record<string, string[]>> = {
  EDM: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
  },
  CONTACT: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
  },
  COMMERCIAL: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
  },
  CHANNEL: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
  },
  CHANNEL_OPEN_SEA: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
    CLAIM: ['VIEW'],
    ALLOT: ['VIEW'],
  },
  WHATSAPP: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
  },
  CONTACT_OPEN_SEA: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
    CLAIM: ['VIEW'],
    ALLOT: ['VIEW'],
  },
  WHATSAPP_GROUP_SEND: {
    GROUP_SEND: ['WHATSAPP_LOGIN'],
  },
};

const reverseOne = function (config: Record<string, string[]>) {
  const ret: Record<string, string[]> = {};
  Object.keys(config).forEach(key => {
    const arr = config[key];
    arr.forEach(v => {
      ret[v] = ret[v] || [];
      ret[v].push(key);
    });
  });
  return ret;
};

/**
 * 反转依赖
 * 例如：操作依赖查看权限，取消查看权限的同时，应该取消操作权限
 * @param config
 * @returns
 */
export const reverseConfig = (config: Record<string, Record<string, string[]>>) => {
  const ret: Record<string, Record<string, string[]>> = {};
  Object.keys(config).forEach(k => (ret[k] = reverseOne(config[k])));
  return ret;
};

export const ReversedDependency = reverseConfig(DependencyConfig);
