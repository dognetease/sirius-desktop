export const DependencyConfig: Record<string, Record<string, string[]>> = {
  EDM: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
  },
  ADDRESS_BOOK: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
  },
  ADDRESS_OPEN_SEA: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
    ALLOT: ['VIEW'],
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
  CUSTOM: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
  },
  LOCAL_PRODUCT: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
  },
  PLATFORM_PRODUCT: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
  },
  FACEBOOK: {
    OP: ['VIEW'],
    DATA: ['VIEW'],
  },
  SUPPLIER_MANAGER: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
    EXPORT: ['VIEW'],
  },
  EP_MARKET_BLACKLIST: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
    EXPORT: ['VIEW'],
  },
  ORDER: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
    EXPORT: ['VIEW'],
  },
  WHATSAPP_PERSONAL_ACCOUNT: {
    VIEW_MESSAGE_RECORD: ['VIEW'],
  },
  WHATSAPP_BUSINESS_ACCOUNT: {
    MANAGE: ['VIEW'],
    DELETE: ['VIEW'],
    ALLOT: ['VIEW'],
    REGISTER: ['VIEW'],
    VIEW_MESSAGE_RECORD: ['VIEW'],
  },
  SOCIAL_MEDIA: {
    OP: ['VIEW'],
    DELETE: ['VIEW'],
    UNBIND: ['VIEW'],
  },
  SUBSCRIBE_CUSTOMER_LIST: {
    OP: ['VIEW'],
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
